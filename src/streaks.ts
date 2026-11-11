import { net } from 'electron';

const GQL_URL = 'https://gql.twitch.tv/gql';
const WEB_CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';
/** Twitchs eigene Abfrage für die Belohnungs-Ansicht im Chat (enthält die Zuschauerserie) */
const REWARD_LIST_HASH = '0b1471876d7647993731b9e3c6a13bf304c67fb31d07f06a945d42286ee377c4';

/**
 * Deine Zuschauerserie („Watch Streak“) bei einem Kanal: wie viele Streams in Folge du geschaut hast.
 * Twitch dokumentiert das nicht; gelesen wird der Knoten channel.self.watchStreakMilestone.
 */
export interface Streak {
  count: number;
  /** z. B. ACTIVE / SUSPENDED – roh von Twitch */
  state: string | null;
}

function parseNode(self: any): Streak | null {
  const s = self?.watchStreakMilestone;
  if (!s || typeof s !== 'object') return null;
  const raw = s.watchStreakMilestone?.value;
  const count = typeof raw === 'number' ? raw : typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : NaN;
  if (!Number.isFinite(count) || count <= 0) return null;
  return { count, state: typeof s.state === 'string' ? s.state : null };
}

async function post(token: string, body: unknown): Promise<any> {
  const res = await net.fetch(GQL_URL, {
    method: 'POST',
    headers: { 'Client-ID': WEB_CLIENT_ID, Authorization: `OAuth ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Twitch antwortet mit HTTP ${res.status}`);
  return res.json();
}

/** Weg 1 klappt nicht (Feld unbekannt / Argument nötig) → ab dann Twitchs gespeicherte Abfrage nutzen */
let rawUnsupported = false;

const RAW = 'query($l: String!) { user(login: $l) { id channel { self { watchStreakMilestone { state watchStreakMilestone { value } } } } } }';
const ID_ONLY = 'query($l: String!) { user(login: $l) { id } }';

/** Zuschauerserien für mehrere Kanäle (gebündelt, höchstens 30 pro Anfrage). Unbekannt → nicht im Ergebnis. */
export async function fetchStreaks(token: string, logins: string[]): Promise<Map<string, Streak | null>> {
  const out = new Map<string, Streak | null>();
  for (let i = 0; i < logins.length; i += 30) {
    const chunk = logins.slice(i, i + 30);
    const ids = new Map<string, string>();
    if (!rawUnsupported) {
      const res = await post(token, chunk.map((l) => ({ query: RAW, variables: { l } })));
      const arr: any[] = Array.isArray(res) ? res : [];
      let failed = 0;
      chunk.forEach((login, k) => {
        const r = arr[k];
        const u = r?.data?.user;
        if (u?.id) ids.set(login, u.id);
        if (Array.isArray(r?.errors) && r.errors.length) { failed++; return; }
        if (u) out.set(login, parseNode(u.channel?.self));
      });
      if (failed && failed === chunk.length) rawUnsupported = true;
      else continue;
    }
    // Weg 2: Twitchs gespeicherte Abfrage „RewardList“ (braucht die Kanal-ID)
    if (!ids.size) {
      const res = await post(token, chunk.map((l) => ({ query: ID_ONLY, variables: { l } })));
      (Array.isArray(res) ? res : []).forEach((r: any, k: number) => { if (r?.data?.user?.id) ids.set(chunk[k], r.data.user.id); });
    }
    const withId = chunk.filter((l) => ids.has(l));
    if (!withId.length) continue;
    const res = await post(token, withId.map((l) => ({
      operationName: 'RewardList',
      variables: { channelID: ids.get(l), shouldIncludeAllSuspendedStreaks: false },
      extensions: { persistedQuery: { version: 1, sha256Hash: REWARD_LIST_HASH } },
    })));
    (Array.isArray(res) ? res : []).forEach((r: any, k: number) => {
      if (Array.isArray(r?.errors) && r.errors.length && !r?.data?.channel) return;
      if (r?.data?.channel) out.set(withId[k], parseNode(r.data.channel.self));
    });
  }
  return out;
}
