/**
 * Erkennungswörter für den Giveaway-Helfer – vom Nutzer bearbeitbar.
 *
 * Wörter und Wortgruppen werden ohne Rücksicht auf Groß-/Kleinschreibung als ganze Wörter gesucht.
 * Ein * steht für beliebig viele weitere Buchstaben: „verlos*“ findet „verlost“, „Verlosung“, „verlosen“ …
 */

export interface GiveawayRules {
  /** Wörter, an denen eine Ankündigung als Giveaway-Start erkannt wird */
  announceWords: string[];
  /** Befehle, mit denen man teilnimmt (auch für die Erkennung „viele schreiben dasselbe“) */
  entryCommands: string[];
  /** Befehle, die nie als Teilnahme-Befehl gelten */
  ignoreCommands: string[];
  /** Wörter, an denen das Ende eines Giveaways erkannt wird */
  endWords: string[];
  /** Wörter, an denen eine Gewinner-Ansage erkannt wird (zusammen mit deinem Namen) */
  winWords: string[];
  /** Accounts, die wie Streamer/Mods Giveaways ankündigen dürfen (Bots) */
  bots: string[];
  /** Ab wie vielen verschiedenen Leuten, die innerhalb von 30 s denselben Befehl schreiben, ein Giveaway angenommen wird */
  crowdMinUsers: number;
}

export const DEFAULT_RULES: GiveawayRules = {
  announceWords: [
    'giveaway*', 'give-away*', 'give away', 'verlos*', 'gewinnspiel*', 'raffle*',
    'lottery', 'lotterie', 'ziehung', 'keydrop*', 'key-drop*',
  ],
  entryCommands: [
    '!join', '!enter', '!giveaway', '!gw', '!ga', '!raffle', '!ticket', '!tickets', '!teilnehmen',
    '!mitmachen', '!verlosung', '!gewinnspiel', '!win', '!ich', '!dabei', '!lotto', '!lottery',
  ],
  ignoreCommands: [
    '!commands', '!discord', '!socials', '!uptime', '!lurk', '!unlurk', '!followage', '!youtube',
    '!instagram', '!twitter', '!tiktok', '!prime', '!sub', '!points', '!rank', '!so', '!shoutout',
    '!rules', '!regeln', '!help', '!hilfe', '!song', '!sr', '!merch', '!donate', '!tip',
  ],
  endWords: [
    'closed', 'geschlossen', 'beendet', 'ended', 'is over', 'vorbei', 'abgelaufen',
    'no more entries', 'keine teilnahme', 'teilnahme nicht mehr', 'teilnahmeschluss',
  ],
  winWords: [
    'won', 'wins', 'winner*', 'gewinner*', 'gewonnen', 'gewinnt', 'congrat*',
    'glückwunsch*', 'gratulation*', 'gratuliere', 'herzlichen',
  ],
  bots: [
    'streamelements', 'nightbot', 'moobot', 'fossabot', 'wizebot', 'streamlabs', 'sery_bot',
    'botrixoficial', 'deepbot', 'phantombot', 'coebot', 'ankhbot', 'vivbot', 'kofistreambot',
    'soundalerts', 'pretzelrocks', 'tangiabot', 'blerp', 'own3d', 'streamholics',
  ],
  crowdMinUsers: 4,
};

export type RuleListKey = Exclude<keyof GiveawayRules, 'crowdMinUsers'>;
export const RULE_LIST_KEYS: RuleListKey[] = ['announceWords', 'entryCommands', 'ignoreCommands', 'endWords', 'winWords', 'bots'];

const MAX_ITEMS = 200;

/** Bringt einen Eintrag in Normalform – oder verwirft ihn (null). */
export function normalizeRuleItem(key: RuleListKey, raw: string): string | null {
  let s = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!s) return null;
  if (key === 'entryCommands' || key === 'ignoreCommands') {
    s = '!' + s.replace(/^!+/, '');
    return /^![\p{L}\p{N}_-]{1,30}$/u.test(s) ? s : null;
  }
  if (key === 'bots') {
    s = s.replace(/^@/, '');
    return /^[a-z0-9_]{2,25}$/.test(s) ? s : null;
  }
  // Wörter/Wortgruppen: Buchstaben, Ziffern, Leerzeichen, - ' und * als Platzhalter
  if (s.length > 60 || !/^[\p{L}\p{N} '\-*]+$/u.test(s) || !/[\p{L}\p{N}]/u.test(s)) return null;
  return s.replace(/\*+/g, '*');
}

export function sanitizeRules(raw: unknown): GiveawayRules {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const out = { ...DEFAULT_RULES } as GiveawayRules;
  for (const key of RULE_LIST_KEYS) {
    if (!Array.isArray(r[key])) continue;
    const list: string[] = [];
    for (const item of r[key] as unknown[]) {
      const n = typeof item === 'string' ? normalizeRuleItem(key, item) : null;
      if (n && !list.includes(n)) list.push(n);
      if (list.length >= MAX_ITEMS) break;
    }
    out[key] = list;
  }
  const n = Number(r.crowdMinUsers);
  out.crowdMinUsers = Number.isFinite(n) ? Math.min(20, Math.max(2, Math.round(n))) : DEFAULT_RULES.crowdMinUsers;
  return out;
}

// ---------- in Suchmuster übersetzen ----------

const WORD_CHAR = '[\\p{L}\\p{N}_]';

function phraseToPattern(phrase: string): string {
  return phrase
    .split('*')
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+'))
    .join(`${WORD_CHAR}*`);
}

/** Ein Suchmuster für eine Wortliste; trifft nur ganze Wörter. Leere Liste trifft nie. */
export function wordListRe(words: string[]): RegExp {
  if (!words.length) return /(?!)/;
  const alts = words.map(phraseToPattern).join('|');
  return new RegExp(`(?<!${WORD_CHAR})(?:${alts})(?!${WORD_CHAR})`, 'iu');
}

export interface CompiledRules {
  announce: RegExp;
  end: RegExp;
  win: RegExp;
  entry: Set<string>;
  ignore: Set<string>;
  bots: Set<string>;
  crowdMinUsers: number;
}

export function compileRules(r: GiveawayRules): CompiledRules {
  return {
    announce: wordListRe(r.announceWords),
    end: wordListRe(r.endWords),
    win: wordListRe(r.winWords),
    entry: new Set(r.entryCommands),
    ignore: new Set(r.ignoreCommands),
    bots: new Set(r.bots),
    crowdMinUsers: r.crowdMinUsers,
  };
}
