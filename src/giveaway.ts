import type { ChatMessage } from './chat';
import type { CompiledRules } from './rules';

export type GiveawayState = 'open' | 'sending' | 'joined' | 'failed' | 'ended';

export interface Giveaway {
  id: string;
  channel: string;
  /** Was zum Teilnehmen in den Chat geschrieben wird, z. B. „!join“ */
  entry: string;
  /** Wie erkannt: Ankündigung (Streamer/Mod/Bot) oder viele Zuschauer schreiben denselben Befehl */
  source: 'announcement' | 'crowd';
  sourceName: string | null;
  message: string | null;
  /** Wie viele verschiedene Leute den Befehl geschrieben haben, seit Kanalwache mitliest */
  participants: number;
  detectedAt: number;
  lastActivity: number;
  state: GiveawayState;
  error: string | null;
  won: boolean;
  /** Du hast teilgenommen (bleibt auch nach dem Ende gesetzt) */
  joined: boolean;
  /** Im Chat angesagte Gewinner (Anzeigenamen) */
  winners: string[];
  winnerMessage: string | null;
  winnerBy: string | null;
  winnerAt: number | null;
}

/** Nur harmlose Befehle dürfen gesendet werden: „!wort“ plus bis zu zwei kurze Argumente. */
export const ENTRY_RE = /^![\p{L}\p{N}_-]{1,30}( [\p{L}\p{N}_-]{1,20}){0,2}$/u;

const CROWD_WINDOW_MS = 30_000;
const EXPIRE_OPEN_MS = 15 * 60_000;
const DROP_ENDED_MS = 30 * 60_000;
/** Beendete Giveaways mit Gewinner bleiben länger stehen */
const DROP_WITH_WINNER_MS = 2 * 60 * 60_000;
/** So lange nach dem Ende wird eine Gewinner-Ansage noch dem Giveaway zugeordnet */
const WINNER_GRACE_MS = 15 * 60_000;
const MAX_CHATTERS = 3000;

export interface DetectorEvents {
  onNew(g: Giveaway): void;
  onWin(g: Giveaway | null, channel: string, announcement: string, by: string): void;
  /** Gewinner wurde angesagt (nicht du) */
  onWinners?(g: Giveaway, winners: string[]): void;
  onChange(): void;
}

function firstToken(text: string): string {
  return text.trim().split(/\s+/)[0].toLowerCase();
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Sucht in einer Ankündigung den Teilnahme-Befehl. Bekannte Befehle haben Vorrang. */
export function extractEntry(text: string, rules: CompiledRules): string | null {
  const found = [...text.matchAll(/(?:^|[\s"'„“(:])(![\p{L}\p{N}_-]{2,30})/gu)].map((m) => m[1].toLowerCase());
  const candidates = found.filter((c) => !rules.ignore.has(c));
  return candidates.find((c) => rules.entry.has(c)) ?? candidates[0] ?? null;
}

/** Wörter, die in Gewinner-Ansagen vorkommen, aber nie ein Name sind */
const NOT_A_NAME = new Set([
  'ist', 'is', 'the', 'of', 'der', 'die', 'das', 'des', 'dem', 'den', 'vom', 'von', 'und', 'and', 'heute', 'today',
  'giveaway', 'giveaways', 'raffle', 'verlosung', 'gewinnspiel', 'gewinnspiels', 'gewinner', 'gewinnerin', 'winner', 'winners',
  'glückwunsch', 'congrats', 'congratulations', 'gratulation', 'an', 'to', 'du', 'you', 'hast', 'has', 'have', 'hat', 'wurde',
  'was', 'gezogen', 'drawn', 'ausgelost', 'neuer', 'neue', 'new', 'and', 'with', 'mit', 'für', 'for', 'bitte', 'please',
  'meldet', 'melde', 'dich', 'euch', 'alle', 'all', 'everyone', 'danke', 'thanks', 'gewonnen', 'won', 'wins', 'gewinnt',
  'herzlichen', 'herzlich', 'gratuliere', 'nochmal', 'again', 'reroll', 'chat', 'leute', 'ihr', 'wir', 'ein', 'eine',
  'einen', 'key', 'game', 'spiel', 'preis', 'prize', 'hier', 'here', 'jetzt', 'now', 'just', 'gerade', 'auch', 'also',
]);

const NAME_RE = /^[a-z0-9_]{3,25}$/;

/**
 * Sucht in einer Gewinner-Ansage die Namen der Gewinner.
 * Am verlässlichsten: Leute, die beim Giveaway mitgemacht haben (participants). Danach @-Erwähnungen,
 * Leute aus dem Chat und zuletzt typische Satzmuster („Gewinner ist X“, „X hat gewonnen“, „Congrats X“).
 */
export function extractWinners(
  text: string,
  rules: CompiledRules,
  participants?: Map<string, string>,
  chatters?: Map<string, string>,
  exclude: string[] = [],
): string[] {
  if (!rules.win.test(text)) return [];
  const ex = new Set(exclude.map((x) => x.toLowerCase()));
  const out = new Map<string, string>();
  const add = (raw: string, names?: Map<string, string>) => {
    const login = raw.replace(/^@/, '').toLowerCase();
    if (!NAME_RE.test(login) || ex.has(login) || NOT_A_NAME.has(login) || out.has(login)) return;
    out.set(login, names?.get(login) ?? raw.replace(/^@/, ''));
  };
  const tokens = text.match(/@?[A-Za-z0-9_]{3,25}/g) ?? [];
  if (participants?.size) for (const t of tokens) if (participants.has(t.replace(/^@/, '').toLowerCase())) add(t, participants);
  if (out.size) return [...out.values()];
  for (const m of text.matchAll(/@([A-Za-z0-9_]{3,25})/g)) add(m[1], chatters);
  if (out.size) return [...out.values()];
  if (chatters?.size) for (const t of tokens) if (chatters.has(t.toLowerCase())) add(t, chatters);
  if (out.size) return [...out.values()];
  const patterns = [
    /(?:gewinner(?:in)?|winner)\b[^A-Za-z0-9_@]*(?:(?:ist|is|des|der|vom|of|the|giveaways?|raffles?|verlosung|gewinnspiels?|heute|today)\b[^A-Za-z0-9_@]*)*@?([A-Za-z0-9_]{3,25})/i,
    /@?\b([A-Za-z0-9_]{3,25})\s+(?:hat|has)\s+(?:\S+\s+){0,3}?(?:gewonnen|won)\b/i,
    /@?\b([A-Za-z0-9_]{3,25})\s+(?:won|wins|gewinnt)\b/i,
    /(?:congrat\w*|glückwunsch\w*|gratulation\w*|gratuliere)\s*(?:an|to)?\s*[,!:]?\s*@?([A-Za-z0-9_]{3,25})/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) add(m[1], chatters);
    if (out.size) break;
  }
  return [...out.values()];
}

export interface Analysis {
  /** Erkannter Teilnahme-Befehl, wenn die Nachricht ein Giveaway startet */
  start: string | null;
  /** Nachricht beendet ein laufendes Giveaway */
  end: boolean;
  /** Nachricht nennt dich als Gewinner */
  win: boolean;
  /** Welche Wörter getroffen haben (für das Testfeld) */
  hits: { announce: string | null; end: string | null; win: string | null };
  /** Ankündigungswort gefunden, aber kein Befehl */
  noCommand: boolean;
  /** Erkannte Gewinner-Namen (ohne Wissen über Teilnehmer – nur für das Testfeld) */
  winners: string[];
}

/** Wertet eine Nachricht von Streamer, Mod oder Bot aus. */
export function analyzeAnnouncement(text: string, rules: CompiledRules, me: string | null): Analysis {
  const announce = rules.announce.exec(text)?.[0] ?? null;
  const endHit = rules.end.exec(text)?.[0] ?? null;
  const winHit = rules.win.exec(text)?.[0] ?? null;
  const mentionsMe = !!me && new RegExp(`(^|[^\\p{L}\\p{N}_])@?${escapeRe(me)}([^\\p{L}\\p{N}_]|$)`, 'iu').test(text);
  const end = !!endHit || (!!winHit && !!announce);
  const entry = announce && !end ? extractEntry(text, rules) : null;
  return {
    start: entry,
    end,
    win: !!winHit && mentionsMe,
    hits: { announce, end: endHit, win: winHit },
    noCommand: !!announce && !end && !entry,
    winners: winHit ? extractWinners(text, rules) : [],
  };
}

export class GiveawayDetector {
  private items = new Map<string, Giveaway>();
  private crowd = new Map<string, Map<string, { users: Map<string, string>; first: number }>>();
  /** Teilnehmer je Giveaway: Login → Anzeigename */
  private seen = new Map<string, Map<string, string>>();
  /** Zuletzt im Chat aktive Leute je Kanal: Login → Anzeigename */
  private chatters = new Map<string, Map<string, string>>();

  constructor(
    private me: () => string | null,
    private rules: () => CompiledRules,
    private events: DetectorEvents,
  ) {}

  list(): Giveaway[] {
    return [...this.items.values()].sort((a, b) => b.lastActivity - a.lastActivity);
  }

  get(id: string): Giveaway | undefined {
    return this.items.get(id);
  }

  dismiss(id: string): void {
    this.items.delete(id);
    this.seen.delete(id);
    this.events.onChange();
  }

  update(id: string, patch: Partial<Giveaway>): void {
    const g = this.items.get(id);
    if (!g) return;
    Object.assign(g, patch);
    if (patch.state === 'joined') g.joined = true;
    this.events.onChange();
  }

  /** Kanal ist offline gegangen oder wird nicht mehr beobachtet */
  endChannel(channel: string): void {
    let changed = false;
    for (const g of this.items.values()) {
      if (g.channel === channel && g.state !== 'ended') {
        g.state = 'ended';
        g.lastActivity = Date.now();
        changed = true;
      }
    }
    this.crowd.delete(channel);
    if (changed) this.events.onChange();
  }

  /** Alte Einträge aufräumen; regelmäßig aufrufen */
  sweep(now = Date.now()): void {
    let changed = false;
    for (const [id, g] of this.items) {
      if (g.state !== 'ended' && g.state !== 'sending' && now - g.lastActivity > EXPIRE_OPEN_MS) {
        g.state = 'ended';
        changed = true;
      } else if (g.state === 'ended' && !g.won && now - g.lastActivity > (g.winners.length ? DROP_WITH_WINNER_MS : DROP_ENDED_MS)) {
        this.items.delete(id);
        this.seen.delete(id);
        changed = true;
      }
    }
    if (changed) this.events.onChange();
  }

  handle(m: ChatMessage, now = Date.now()): void {
    const me = this.me();
    const text = m.text.trim();
    const token = firstToken(text);
    const rules = this.rules();
    const privileged = m.isBroadcaster || m.isMod || rules.bots.has(m.login);
    if (!privileged) this.rememberChatter(m.channel, m.login, m.displayName);

    // Hast du selbst (z. B. direkt im Twitch-Chat) teilgenommen?
    if (me && m.login === me) {
      for (const g of this.items.values()) {
        if (g.channel === m.channel && g.state === 'open' && firstToken(g.entry) === token) {
          g.state = 'joined';
          g.joined = true;
          g.error = null;
          this.events.onChange();
        }
      }
      return;
    }

    if (privileged) {
      this.handlePrivileged(m, text, now, me, rules);
      return;
    }

    if (!token.startsWith('!')) return;

    // Laufendes Giveaway: Teilnehmer zählen
    for (const g of this.items.values()) {
      if (g.channel === m.channel && g.state !== 'ended' && firstToken(g.entry) === token) {
        const seen = this.seen.get(g.id) ?? new Map<string, string>();
        if (!seen.has(m.login)) {
          seen.set(m.login, m.displayName);
          this.seen.set(g.id, seen);
          g.participants = seen.size;
          g.lastActivity = now;
          this.events.onChange();
        }
        return;
      }
    }

    // Viele schreiben denselben Teilnahme-Befehl → Giveaway, auch ohne erkannte Ankündigung
    if (!rules.entry.has(token) || rules.ignore.has(token) || !ENTRY_RE.test(text)) return;
    const perChannel = this.crowd.get(m.channel) ?? new Map<string, { users: Map<string, string>; first: number }>();
    this.crowd.set(m.channel, perChannel);
    for (const [k, v] of perChannel) if (now - v.first > CROWD_WINDOW_MS) perChannel.delete(k);
    const key = text.toLowerCase();
    const bucket = perChannel.get(key) ?? { users: new Map<string, string>(), first: now };
    bucket.users.set(m.login, m.displayName);
    perChannel.set(key, bucket);
    if (bucket.users.size >= rules.crowdMinUsers) {
      perChannel.delete(key);
      const g = this.upsert(m.channel, key, 'crowd', null, null, now);
      const seen = this.seen.get(g.id) ?? new Map<string, string>();
      for (const [u, name] of bucket.users) seen.set(u, name);
      this.seen.set(g.id, seen);
      g.participants = seen.size;
    }
  }

  private handlePrivileged(m: ChatMessage, text: string, now: number, me: string | null, rules: CompiledRules): void {
    const open = [...this.items.values()].filter((g) => g.channel === m.channel && g.state !== 'ended');
    const a = analyzeAnnouncement(text, rules, me);

    // Gewinner-Ansage mit deinem Namen
    if (a.win) {
      const g = open[0] ?? this.list().find((x) => x.channel === m.channel) ?? null;
      if (g) {
        g.won = true;
        g.lastActivity = now;
      }
      this.events.onWin(g, m.channel, text, m.displayName);
      this.events.onChange();
    }

    // Gewinner angesagt → bei laufendem oder gerade beendetem Giveaway eintragen
    if (a.hits.win) {
      const target = open[0]
        ?? this.list().find((x) => x.channel === m.channel && x.state === 'ended' && now - x.lastActivity < WINNER_GRACE_MS)
        ?? null;
      if (target) {
        const names = extractWinners(text, rules, this.seen.get(target.id), this.chatters.get(m.channel), [m.login, m.channel]);
        if (a.win && me && !names.some((n) => n.toLowerCase() === me)) names.push(me);
        const fresh = names.filter((n) => !target.winners.some((w) => w.toLowerCase() === n.toLowerCase()));
        if (fresh.length) {
          target.winners.push(...fresh);
          target.winnerMessage = text;
          target.winnerBy = m.displayName;
          target.winnerAt = now;
          target.lastActivity = now;
          // Eine Gewinner-Ansage beendet das Giveaway
          for (const g of open) g.state = 'ended';
          if (!a.win) this.events.onWinners?.(target, fresh);
          this.events.onChange();
          return;
        }
      }
    }

    // Ende oder Gewinner gezogen → Giveaway vorbei
    if (a.end) {
      if (!open.length) return;
      for (const g of open) {
        g.state = 'ended';
        g.lastActivity = now;
      }
      this.events.onChange();
      return;
    }

    // Start-Ankündigung
    if (!a.start) return;
    const g = this.upsert(m.channel, a.start, 'announcement', m.displayName, text, now);
    g.sourceName = m.displayName;
    g.message = text;
  }

  private rememberChatter(channel: string, login: string, displayName: string): void {
    let map = this.chatters.get(channel);
    if (!map) {
      map = new Map();
      this.chatters.set(channel, map);
    }
    map.delete(login);
    map.set(login, displayName);
    if (map.size > MAX_CHATTERS) map.delete(map.keys().next().value!);
  }

  private upsert(channel: string, entry: string, source: Giveaway['source'], sourceName: string | null, message: string | null, now: number): Giveaway {
    const id = `${channel}:${firstToken(entry)}`;
    const existing = this.items.get(id);
    if (existing && existing.state !== 'ended') {
      existing.lastActivity = now;
      if (source === 'announcement') existing.source = 'announcement';
      this.events.onChange();
      return existing;
    }
    // Neu oder ein früheres, beendetes Giveaway mit gleichem Befehl → neues Giveaway
    const g: Giveaway = {
      id, channel, entry, source, sourceName, message,
      participants: 0, detectedAt: now, lastActivity: now,
      state: 'open', error: null, won: false, joined: false,
      winners: [], winnerMessage: null, winnerBy: null, winnerAt: null,
    };
    this.items.set(id, g);
    this.seen.delete(id);
    this.events.onNew(g);
    this.events.onChange();
    return g;
  }
}
