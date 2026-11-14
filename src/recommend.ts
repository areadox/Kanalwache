import { net } from 'electron';

const GQL_URL = 'https://gql.twitch.tv/gql';
const WEB_CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';

/** Ein Kanal, den Twitch dir empfiehlt */
export interface Recommended {
  login: string;
  displayName: string;
  avatar: string | null;
  live: boolean;
  viewers: number | null;
  title: string | null;
  game: string | null;
}

const USER = 'login displayName profileImageURL(width: 70)';
const STREAM = 'viewersCount title game { displayName }';

/**
 * Twitch dokumentiert die Empfehlungen nicht. Es gibt mehrere Wege, die die Twitch-Seite selbst nutzt;
 * der erste, der antwortet, wird gemerkt.
 */
const STRATEGIES: { name: string; query: string; pick: (data: any) => any[] }[] = [
  {
    // „Empfohlene Kanäle“ der Seitenleiste auf twitch.tv
    name: 'personalSections',
    query: `query { personalSections(input: { sectionInputs: [RECOMMENDED_SECTION, SIMILAR_SECTION], recommendationContext: { platform: "web" } }) { type items { user { ${USER} } content { __typename ... on Stream { ${STREAM} } } } } }`,
    pick: (d) => (Array.isArray(d?.personalSections) ? d.personalSections : []).flatMap((s: any) => (Array.isArray(s?.items) ? s.items : []).map((it: any) => ({
      user: it?.user, stream: it?.content?.__typename === 'Stream' ? it.content : null,
    }))),
  },
  {
    // Live-Empfehlungen der Startseite
    name: 'liveRecommendations',
    query: `query { currentUser { recommendations { liveRecommendations(first: 24) { edges { node { ${STREAM} broadcaster { ${USER} } } } } } } }`,
    pick: (d) => (d?.currentUser?.recommendations?.liveRecommendations?.edges ?? []).map((e: any) => ({ user: e?.node?.broadcaster, stream: e?.node })),
  },
  {
    // Notlösung: die beliebtesten deutschsprachigen Streams
    name: 'topStreams',
    query: `query { streams(first: 24, options: { languages: ["de"] }) { edges { node { ${STREAM} broadcaster { ${USER} } } } } }`,
    pick: (d) => (d?.streams?.edges ?? []).map((e: any) => ({ user: e?.node?.broadcaster, stream: e?.node })),
  },
];

let working: number | null = null;
export let lastSource: string | null = null;

async function run(token: string, query: string): Promise<any> {
  const res = await net.fetch(GQL_URL, {
    method: 'POST',
    headers: { 'Client-ID': WEB_CLIENT_ID, Authorization: `OAuth ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (res.status === 401) throw new Error('Twitch-Login abgelaufen – bitte neu anmelden.');
  if (!res.ok) throw new Error(`Twitch antwortet mit HTTP ${res.status}`);
  return res.json();
}

export async function fetchRecommended(token: string): Promise<{ list: Recommended[]; source: string }> {
  const order = working != null ? [working, ...STRATEGIES.keys()].filter((v, i, a) => a.indexOf(v) === i) : [...STRATEGIES.keys()];
  let lastErr: Error | null = null;
  for (const i of order) {
    const st = STRATEGIES[i];
    try {
      const json = await run(token, st.query);
      if (Array.isArray(json?.errors) && json.errors.length && !json?.data) continue;
      const seen = new Set<string>();
      const list: Recommended[] = [];
      for (const { user, stream } of st.pick(json?.data)) {
        const login = typeof user?.login === 'string' ? user.login.toLowerCase() : null;
        if (!login || seen.has(login)) continue;
        seen.add(login);
        list.push({
          login,
          displayName: typeof user.displayName === 'string' ? user.displayName : login,
          avatar: typeof user.profileImageURL === 'string' ? user.profileImageURL : null,
          live: !!stream,
          viewers: typeof stream?.viewersCount === 'number' ? stream.viewersCount : null,
          title: typeof stream?.title === 'string' ? stream.title : null,
          game: typeof stream?.game?.displayName === 'string' ? stream.game.displayName : null,
        });
      }
      if (!list.length) continue;
      working = i;
      lastSource = st.name;
      return { list, source: st.name };
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw lastErr ?? new Error('Twitch liefert gerade keine Empfehlungen.');
}
