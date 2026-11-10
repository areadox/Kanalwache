import { net } from 'electron';

const GQL_URL = 'https://gql.twitch.tv/gql';
const WEB_CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';

/** Dein Verhältnis zu einem Kanal: folgst du, hast du ihn abonniert? null = unbekannt */
export interface ChannelRelation {
  login: string;
  id: string | null;
  following: boolean | null;
  /** Abo-Stufe („1000“, „2000“, „3000“) oder null; undefined = unbekannt */
  subTier: string | null | undefined;
}

async function gql(token: string, body: unknown): Promise<any> {
  const res = await net.fetch(GQL_URL, {
    method: 'POST',
    headers: { 'Client-ID': WEB_CLIENT_ID, Authorization: `OAuth ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.status === 401) throw new Error('Twitch-Login abgelaufen – bitte neu anmelden.');
  if (!res.ok) throw new Error(`Twitch antwortet mit HTTP ${res.status}`);
  return res.json();
}

export async function fetchRelation(token: string, login: string): Promise<ChannelRelation> {
  const out: ChannelRelation = { login, id: null, following: null, subTier: undefined };
  // Erst mit Abo-Stufe; kennt Twitch das Feld nicht, ohne
  const queries = [
    'query($l: String!) { user(login: $l) { id self { follower { followedAt } subscriptionBenefit { tier } } } }',
    'query($l: String!) { user(login: $l) { id self { follower { followedAt } } } }',
    'query($l: String!) { user(login: $l) { id } }',
  ];
  for (const query of queries) {
    const json = await gql(token, { query, variables: { l: login } });
    if (Array.isArray(json?.errors) && json.errors.length && !json?.data?.user) continue;
    const u = json?.data?.user;
    if (!u) return out;
    out.id = typeof u.id === 'string' ? u.id : null;
    if (u.self && 'follower' in u.self) out.following = !!u.self.follower;
    if (u.self && 'subscriptionBenefit' in u.self) out.subTier = u.self.subscriptionBenefit?.tier ?? null;
    return out;
  }
  return out;
}

/**
 * Folgen / Entfolgen über Twitchs Schnittstelle. Twitch verlangt dafür teils eine „Integrity“-Prüfung,
 * die nur die echte Webseite bestehen kann – dann kommt fallback: true und die Oberfläche klickt den
 * Knopf auf der Kanalseite.
 */
export async function setFollow(token: string, targetId: string, follow: boolean): Promise<{ ok: boolean; fallback?: boolean; error?: string }> {
  const query = follow
    ? 'mutation($id: ID!) { followUser(input: { targetID: $id, disableNotifications: false }) { follow { followedAt } error { code } } }'
    : 'mutation($id: ID!) { unfollowUser(input: { targetID: $id }) { follow { followedAt } } }';
  try {
    const json = await gql(token, { query, variables: { id: targetId } });
    const errs: any[] = Array.isArray(json?.errors) ? json.errors : [];
    const code = json?.data?.followUser?.error?.code;
    if (errs.length || code) return { ok: false, fallback: true, error: code || errs[0]?.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, fallback: true, error: err instanceof Error ? err.message : String(err) };
  }
}
