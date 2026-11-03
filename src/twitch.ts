import { net } from 'electron';

export interface ChannelStatus {
  login: string;
  displayName: string;
  avatar: string | null;
  live: boolean;
  title: string | null;
  game: string | null;
  viewers: number | null;
  startedAt: string | null;
  /** false, wenn Twitch den Kanal nicht kennt */
  exists: boolean;
}

// Die Twitch-Webseite fragt Live-Status über diese Schnittstelle ab. Sie ist nicht offiziell
// dokumentiert, braucht aber keinen eigenen API-Schlüssel. Fällt sie aus, wird die Kanalseite
// selbst ausgewertet (siehe fetchViaPage).
const GQL_URL = 'https://gql.twitch.tv/gql';
const WEB_CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';

function empty(login: string): ChannelStatus {
  return { login, displayName: login, avatar: null, live: false, title: null, game: null, viewers: null, startedAt: null, exists: false };
}

async function fetchViaGql(logins: string[]): Promise<Map<string, ChannelStatus>> {
  const out = new Map<string, ChannelStatus>();
  for (let i = 0; i < logins.length; i += 50) {
    const chunk = logins.slice(i, i + 50);
    // Logins sind vorher gegen [a-z0-9_] geprüft, daher ist das Einsetzen hier sicher.
    const query = `query {
      users(logins: ${JSON.stringify(chunk)}) {
        login
        displayName
        profileImageURL(width: 70)
        broadcastSettings { title game { displayName } }
        stream { viewersCount createdAt game { displayName } }
      }
    }`;
    const res = await net.fetch(GQL_URL, {
      method: 'POST',
      headers: { 'Client-ID': WEB_CLIENT_ID, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error(`Twitch antwortet mit HTTP ${res.status}`);
    const json = (await res.json()) as any;
    if (Array.isArray(json?.errors) && json.errors.length) throw new Error(String(json.errors[0]?.message ?? 'GQL-Fehler'));
    const users: any[] = Array.isArray(json?.data?.users) ? json.data.users : [];

    for (const login of chunk) out.set(login, empty(login));
    for (const u of users) {
      if (!u || typeof u.login !== 'string') continue;
      const login = u.login.toLowerCase();
      const stream = u.stream ?? null;
      out.set(login, {
        login,
        displayName: u.displayName || login,
        avatar: u.profileImageURL || null,
        live: !!stream,
        title: u.broadcastSettings?.title || null,
        game: stream?.game?.displayName || u.broadcastSettings?.game?.displayName || null,
        viewers: typeof stream?.viewersCount === 'number' ? stream.viewersCount : null,
        startedAt: stream?.createdAt || null,
        exists: true,
      });
    }
  }
  return out;
}

async function fetchViaPage(login: string): Promise<ChannelStatus> {
  const res = await net.fetch(`https://www.twitch.tv/${login}`, {
    headers: { 'Accept-Language': 'de-DE,de;q=0.9' },
  });
  if (!res.ok) throw new Error(`Kanalseite antwortet mit HTTP ${res.status}`);
  const html = await res.text();
  const s = empty(login);
  s.exists = true;
  s.live = html.includes('"isLiveBroadcast":true');
  const title = html.match(/<meta property="og:title" content="([^"]*)"/);
  if (title) s.displayName = decodeEntities(title[1]).split(' - ')[0] || login;
  const img = html.match(/<meta property="og:image" content="([^"]*)"/);
  if (img) s.avatar = decodeEntities(img[1]);
  return s;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export async function fetchStatuses(logins: string[]): Promise<Map<string, ChannelStatus>> {
  try {
    return await fetchViaGql(logins);
  } catch (gqlError) {
    const out = new Map<string, ChannelStatus>();
    let failures = 0;
    for (const login of logins) {
      try {
        out.set(login, await fetchViaPage(login));
      } catch {
        failures++;
      }
    }
    if (failures === logins.length) throw gqlError;
    return out;
  }
}

/**
 * Fragt mit deinem Login ab, auf welchen dieser Kanäle du Moderator bist.
 * Nutzt dieselbe Abfrage wie twitch.tv; schlägt sie fehl, bleibt die Erkennung über den Chat.
 */
export async function fetchModChannels(logins: string[], token: string): Promise<Set<string>> {
  const out = new Set<string>();
  for (let i = 0; i < logins.length; i += 50) {
    const chunk = logins.slice(i, i + 50);
    const query = `query { users(logins: ${JSON.stringify(chunk)}) { login self { isModerator } } }`;
    const res = await net.fetch(GQL_URL, {
      method: 'POST',
      headers: { 'Client-ID': WEB_CLIENT_ID, Authorization: `OAuth ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error(`Twitch antwortet mit HTTP ${res.status}`);
    const json = (await res.json()) as any;
    if (Array.isArray(json?.errors) && json.errors.length) throw new Error(String(json.errors[0]?.message ?? 'GQL-Fehler'));
    for (const u of Array.isArray(json?.data?.users) ? json.data.users : []) {
      if (u && typeof u.login === 'string' && u.self?.isModerator === true) out.add(u.login.toLowerCase());
    }
  }
  return out;
}

export interface FollowedChannel {
  login: string;
  displayName: string;
  avatar: string | null;
  live: boolean;
  followedAt: string | null;
}

/** Alle Kanäle, denen du folgst (über deinen Login, wie auf twitch.tv). */
export async function fetchFollows(token: string, max = 2000): Promise<FollowedChannel[]> {
  const out: FollowedChannel[] = [];
  let cursor: string | null = null;
  const query = `query Follows($after: Cursor) {
    currentUser {
      follows(first: 100, after: $after) {
        edges { cursor followedAt node { login displayName profileImageURL(width: 70) stream { id } } }
        pageInfo { hasNextPage }
      }
    }
  }`;
  for (;;) {
    const res = await net.fetch(GQL_URL, {
      method: 'POST',
      headers: { 'Client-ID': WEB_CLIENT_ID, Authorization: `OAuth ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { after: cursor } }),
    });
    if (res.status === 401) throw new Error('Twitch-Login abgelaufen – bitte ab- und wieder anmelden.');
    if (!res.ok) throw new Error(`Twitch antwortet mit HTTP ${res.status}`);
    const json = (await res.json()) as any;
    if (Array.isArray(json?.errors) && json.errors.length) throw new Error(String(json.errors[0]?.message ?? 'GQL-Fehler'));
    const conn = json?.data?.currentUser?.follows;
    if (!conn) throw new Error('Twitch hat keine Follow-Liste geliefert.');
    const edges: any[] = Array.isArray(conn.edges) ? conn.edges : [];
    for (const e of edges) {
      const n = e?.node;
      if (!n || typeof n.login !== 'string') continue;
      out.push({
        login: n.login.toLowerCase(),
        displayName: n.displayName || n.login,
        avatar: n.profileImageURL || null,
        live: !!n.stream,
        followedAt: e.followedAt || null,
      });
    }
    cursor = edges.length ? edges[edges.length - 1].cursor ?? null : null;
    if (!conn.pageInfo?.hasNextPage || !cursor || out.length >= max) break;
  }
  return out;
}

export interface ChannelReward {
  id: string;
  title: string;
  cost: number;
  prompt: string | null;
  color: string | null;
  image: string | null;
  enabled: boolean;
  paused: boolean;
  inStock: boolean;
  needsInput: boolean;
}

export interface ChannelRewards {
  rewards: ChannelReward[];
  balance: number | null;
  pointsName: string | null;
  pointsIcon: string | null;
}

/** Belohnungen eines Kanals und dein Kontostand dort (über deinen Login, wie auf twitch.tv). */
export async function fetchRewards(login: string, token: string): Promise<ChannelRewards> {
  // login ist vorher gegen [a-z0-9_] geprüft
  const query = `query {
    user(login: ${JSON.stringify(login)}) {
      channel {
        self { communityPoints { balance } }
        communityPointsSettings {
          name
          image { url }
          customRewards {
            id title cost prompt backgroundColor
            isEnabled isPaused isInStock isUserInputRequired
            image { url url2x }
            defaultImage { url url2x }
          }
        }
      }
    }
  }`;
  const res = await net.fetch(GQL_URL, {
    method: 'POST',
    headers: { 'Client-ID': WEB_CLIENT_ID, Authorization: `OAuth ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (res.status === 401) throw new Error('Twitch-Login abgelaufen – bitte ab- und wieder anmelden.');
  if (!res.ok) throw new Error(`Twitch antwortet mit HTTP ${res.status}`);
  const json = (await res.json()) as any;
  if (Array.isArray(json?.errors) && json.errors.length) throw new Error(String(json.errors[0]?.message ?? 'GQL-Fehler'));
  const ch = json?.data?.user?.channel;
  if (!ch) throw new Error('Kanal nicht gefunden.');
  const settings = ch.communityPointsSettings;
  const rewards: ChannelReward[] = (Array.isArray(settings?.customRewards) ? settings.customRewards : [])
    .filter((r: any) => r && typeof r.id === 'string' && typeof r.title === 'string')
    .map((r: any) => ({
      id: r.id,
      title: r.title,
      cost: Number(r.cost) || 0,
      prompt: r.prompt || null,
      color: typeof r.backgroundColor === 'string' && /^#[0-9a-f]{3,8}$/i.test(r.backgroundColor) ? r.backgroundColor : null,
      image: r.image?.url2x || r.image?.url || r.defaultImage?.url2x || r.defaultImage?.url || null,
      enabled: r.isEnabled !== false,
      paused: r.isPaused === true,
      inStock: r.isInStock !== false,
      needsInput: r.isUserInputRequired === true,
    }))
    .filter((r: ChannelReward) => r.enabled)
    .sort((a: ChannelReward, b: ChannelReward) => a.cost - b.cost);
  const bal = ch.self?.communityPoints?.balance;
  return {
    rewards,
    balance: typeof bal === 'number' ? bal : null,
    pointsName: settings?.name || null,
    pointsIcon: settings?.image?.url || null,
  };
}
