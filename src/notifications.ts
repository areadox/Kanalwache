import { net } from 'electron';

const GQL_URL = 'https://gql.twitch.tv/gql';
const WEB_CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';

/** Eine Benachrichtigung aus Twitchs Glocke (oben rechts auf twitch.tv) */
export interface TwitchNotification {
  id: string;
  /** Text ohne Formatierung */
  text: string;
  /** Zeitpunkt (ms) oder null, wenn Twitch keinen liefert */
  at: number | null;
  /** Von Twitch als gelesen markiert */
  read: boolean;
  thumbnail: string | null;
  /** Wohin ein Klick führen soll (twitch.tv-Adresse) */
  url: string | null;
  /** Kanal, wenn die Adresse direkt auf einen Kanal zeigt – wird dann in Kanalwache geöffnet */
  login: string | null;
  category: string | null;
}

/**
 * Felder, die Twitchs Benachrichtigungen haben können. Twitch dokumentiert diese Schnittstelle nicht;
 * meldet die Abfrage ein Feld als unbekannt, lassen wir es weg und fragen erneut.
 */
const NODE_FIELDS = ['id', 'body', 'isRead', 'updatedAt', 'createdAt', 'thumbnailURL', 'category', 'type', 'actions { type url }'];
const REQUIRED = new Set(['id', 'body']);

let knownBad = new Set<string>();

function buildQuery(fields: string[]): string {
  return `query { currentUser { id notifications(first: 30) { edges { node { ${fields.join(' ')} } } } } }`;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

/** Twitch liefert den Text teils mit <b>…</b>-Auszeichnung oder Markdown-Sternchen – nur Text behalten. */
export function plainText(body: string): string {
  return decodeEntities(body.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, ''))
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

const RESERVED = new Set(['directory', 'settings', 'subscriptions', 'inventory', 'drops', 'wallet', 'search', 'videos', 'p', 'downloads', 'jobs', 'turbo', 'friends', 'messages', 'prime', 'store', 'notifications', 'popout', 'moderator', 'u']);

/** twitch.tv/<kanal> (ohne weiteren Pfad) → Kanal-Login, sonst null */
export function channelFromUrl(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/^(?:https?:\/\/)?(?:www\.|m\.)?twitch\.tv\/([A-Za-z0-9_]{2,25})\/?(?:[?#].*)?$/i);
  if (!m) return null;
  const login = m[1].toLowerCase();
  return RESERVED.has(login) ? null : login;
}

function normalizeUrl(url: unknown): string | null {
  if (typeof url !== 'string' || !url) return null;
  if (/^https:\/\//i.test(url)) return url;
  if (url.startsWith('/')) return `https://www.twitch.tv${url}`;
  // twitch://stream/<kanal> u. ä. aus der App-Welt
  const app = url.match(/^twitch:\/\/(?:stream|open\?stream=)\/?([A-Za-z0-9_]+)/i);
  if (app) return `https://www.twitch.tv/${app[1].toLowerCase()}`;
  return null;
}

export function parseNotification(n: any): TwitchNotification | null {
  if (!n || typeof n.id !== 'string' || typeof n.body !== 'string') return null;
  const actions: any[] = Array.isArray(n.actions) ? n.actions : [];
  const url = normalizeUrl((actions.find((a) => a && typeof a.url === 'string' && a.url) ?? {}).url);
  const t = Date.parse(n.updatedAt || n.createdAt || '');
  return {
    id: n.id,
    text: plainText(n.body),
    at: Number.isFinite(t) ? t : null,
    read: n.isRead === true,
    thumbnail: typeof n.thumbnailURL === 'string' && /^https:\/\//.test(n.thumbnailURL) ? n.thumbnailURL : null,
    url,
    login: channelFromUrl(url),
    category: typeof n.category === 'string' ? n.category : typeof n.type === 'string' ? n.type : null,
  };
}

/** Holt die letzten Benachrichtigungen deines Twitch-Kontos (wie die Glocke auf twitch.tv). */
export async function fetchTwitchNotifications(token: string): Promise<TwitchNotification[]> {
  let fields = NODE_FIELDS.filter((f) => !knownBad.has(f));
  for (let attempt = 0; attempt < NODE_FIELDS.length + 1; attempt++) {
    const res = await net.fetch(GQL_URL, {
      method: 'POST',
      headers: { 'Client-ID': WEB_CLIENT_ID, Authorization: `OAuth ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: buildQuery(fields) }),
    });
    if (res.status === 401) throw new Error('Twitch-Login abgelaufen – bitte ab- und wieder anmelden.');
    if (!res.ok) throw new Error(`Twitch antwortet mit HTTP ${res.status}`);
    const json = (await res.json()) as any;
    const errors: any[] = Array.isArray(json?.errors) ? json.errors : [];
    if (errors.length) {
      // Unbekannte Felder weglassen und nochmal fragen
      const bad = new Set<string>();
      for (const e of errors) {
        const m = String(e?.message ?? '').match(/Cannot query field "(\w+)"/);
        if (m) bad.add(m[1]);
      }
      let drop = fields.filter((f) => bad.has(f.split(/[\s{]/)[0]));
      // Unbekanntes Unterfeld der Aktionen → Aktionen ganz weglassen
      if (!drop.length && bad.size && !bad.has('notifications')) drop = fields.filter((f) => f.startsWith('actions'));
      if (drop.some((f) => REQUIRED.has(f)) || bad.has('notifications') || !drop.length) {
        throw new Error('Twitch stellt die Benachrichtigungen gerade nicht bereit.');
      }
      for (const f of drop) knownBad.add(f);
      fields = fields.filter((f) => !drop.includes(f));
      continue;
    }
    const conn = json?.data?.currentUser?.notifications;
    if (!json?.data?.currentUser) throw new Error('Nicht angemeldet.');
    const edges: any[] = Array.isArray(conn?.edges) ? conn.edges : [];
    const out: TwitchNotification[] = [];
    for (const e of edges) {
      const n = parseNotification(e?.node);
      if (n && n.text) out.push(n);
    }
    return out;
  }
  throw new Error('Twitch stellt die Benachrichtigungen gerade nicht bereit.');
}

/** Für Tests: gemerkte unbekannte Felder vergessen */
export function resetFieldCache(): void {
  knownBad = new Set();
}
