import * as fs from 'node:fs';
import * as path from 'node:path';
import { GiveawayRules, sanitizeRules } from './rules';

export interface ChannelConfig {
  login: string;
  /** Stream automatisch öffnen (und damit als eingeloggter Zuschauer beitreten), sobald der Kanal live geht */
  autoOpen: boolean;
  /** Windows-Benachrichtigung, wenn der Kanal live geht */
  notify: boolean;
  /** Wenn du hier Mod bist: beim automatischen Öffnen gleich die Mod-Ansicht zeigen */
  openAsMod: boolean;
  /** Über den Follow-Abgleich hinzugekommen – wird beim Entfolgen wieder entfernt */
  fromFollows: boolean;
}

export interface Settings {
  pollSeconds: number;
  closeToTray: boolean;
  startInTray: boolean;
  autostart: boolean;
  muteAutoOpened: boolean;
  closeTabWhenOffline: boolean;
  /** Chat der Live-Kanäle mitlesen und Giveaways erkennen */
  giveawayHelper: boolean;
  /** Benachrichtigung bei neuem Giveaway */
  giveawayNotify: boolean;
  /** Kanalpunkte-Bonus in offenen Streams automatisch abholen */
  autoClaimPoints: boolean;
  /** Ganze Twitch-Seite statt nur Player und Chat anzeigen */
  fullPage: boolean;
  /** Ton nur aus einem Tab: dem aktiven Stream (bzw. dem zuletzt aktiven) */
  singleAudio: boolean;
  /** Favoritenleiste unter den Tabs anzeigen */
  showFavBar: boolean;
  /** Bei Raids nachfragen: Mitraiden oder nicht */
  raidPrompt: boolean;
  /** Beim Start und alle 6 Stunden nach Updates suchen */
  autoUpdate: boolean;
  /** Aufnahmen: Zielordner (leer = Videos\\Kanalwache) und Qualität */
  recordDir: string;
  recordQuality: 'high' | 'medium' | 'low';
  /** Gefolgte Kanäle regelmäßig abgleichen (neue hinzufügen, entfolgte entfernen) */
  syncFollows: boolean;
  /** Standard für Kanäle aus dem Follow-Abgleich */
  followNotify: boolean;
  followAutoOpen: boolean;
  /** Twitch-Benachrichtigungen (Glocke) abholen und neue auch als Windows-Meldung zeigen */
  twitchNotifs: boolean;
  twitchNotifPopup: boolean;
}

export interface QuickMessage {
  /** Beschriftung des Knopfs */
  label: string;
  /** Was in den Chat geschrieben wird; {kanal} und {ich} werden ersetzt */
  text: string;
}

export const DEFAULT_QUICK_MESSAGES: QuickMessage[] = [
  { label: '👋 Hallo', text: 'Hallo {kanal} 👋' },
  { label: 'GG', text: 'GG! 🎉' },
  { label: 'Lurk', text: '!lurk' },
  { label: '❤️ Danke', text: 'Danke für den Stream, {kanal}! ❤️' },
];

export function sanitizeQuickMessages(raw: unknown): QuickMessage[] {
  if (!Array.isArray(raw)) return DEFAULT_QUICK_MESSAGES.map((m) => ({ ...m }));
  const out: QuickMessage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    const text = typeof r.text === 'string' ? r.text.replace(/[\r\n]+/g, ' ').trim().slice(0, 450) : '';
    if (!text) continue;
    const label = (typeof r.label === 'string' && r.label.trim() ? r.label.trim() : text).slice(0, 24);
    out.push({ label, text });
    if (out.length >= 20) break;
  }
  return out;
}

export interface Config {
  own: ChannelConfig | null;
  favorites: ChannelConfig[];
  settings: Settings;
  giveawayRules: GiveawayRules;
  /** Gefolgte Kanäle, die du nicht übernehmen wolltest oder entfernt hast – der Abgleich lässt sie weg */
  ignoredFollows: string[];
  /** Favoriten (★) in deiner Reihenfolge – erscheinen in der Favoritenleiste */
  starred: string[];
  /** Schnellnachrichten für die Leiste unter dem Player */
  quickMessages: QuickMessage[];
  /** Bis wann die Twitch-Benachrichtigungen angesehen wurden (ms) – neuere zählen als ungelesen */
  notifSeenAt: number;
}

export const DEFAULT_SETTINGS: Settings = {
  pollSeconds: 60,
  closeToTray: true,
  startInTray: false,
  autostart: false,
  muteAutoOpened: true,
  closeTabWhenOffline: true,
  giveawayHelper: true,
  giveawayNotify: true,
  autoClaimPoints: true,
  syncFollows: false,
  fullPage: false,
  singleAudio: true,
  showFavBar: true,
  raidPrompt: true,
  autoUpdate: true,
  recordDir: '',
  recordQuality: 'high',
  followNotify: true,
  followAutoOpen: false,
  twitchNotifs: true,
  twitchNotifPopup: false,
};

const LOGIN_RE = /^[a-z0-9_]{2,25}$/;

/** Akzeptiert „Name“, „@Name“ oder eine twitch.tv-Adresse und liefert den Login in Kleinbuchstaben. */
export function normalizeLogin(input: string): string | null {
  let s = input.trim();
  const url = s.match(/twitch\.tv\/(?:popout\/)?([A-Za-z0-9_]+)/i);
  if (url) s = url[1];
  s = s.replace(/^@/, '').toLowerCase();
  return LOGIN_RE.test(s) ? s : null;
}

function sanitizeChannel(raw: unknown, defaults: Omit<ChannelConfig, 'login'>): ChannelConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const login = typeof r.login === 'string' ? normalizeLogin(r.login) : null;
  if (!login) return null;
  return {
    login,
    autoOpen: typeof r.autoOpen === 'boolean' ? r.autoOpen : defaults.autoOpen,
    notify: typeof r.notify === 'boolean' ? r.notify : defaults.notify,
    openAsMod: typeof r.openAsMod === 'boolean' ? r.openAsMod : defaults.openAsMod,
    fromFollows: typeof r.fromFollows === 'boolean' ? r.fromFollows : defaults.fromFollows,
  };
}

export class Store {
  private file: string;
  config: Config;

  constructor(userDataDir: string) {
    this.file = path.join(userDataDir, 'kanalwache.json');
    this.config = this.load();
  }

  private load(): Config {
    let raw: Record<string, unknown> = {};
    try {
      raw = JSON.parse(fs.readFileSync(this.file, 'utf8'));
    } catch {
      // Erster Start oder kaputte Datei: mit Standardwerten weitermachen.
    }
    const favorites: ChannelConfig[] = [];
    if (Array.isArray(raw.favorites)) {
      for (const f of raw.favorites) {
        const c = sanitizeChannel(f, { autoOpen: true, notify: true, openAsMod: false, fromFollows: false });
        if (c && !favorites.some((x) => x.login === c.login)) favorites.push(c);
      }
    }
    const settingsRaw = (raw.settings && typeof raw.settings === 'object' ? raw.settings : {}) as Record<string, unknown>;
    const settings = { ...DEFAULT_SETTINGS };
    for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
      if (typeof settingsRaw[key] === typeof DEFAULT_SETTINGS[key]) (settings as any)[key] = settingsRaw[key];
    }
    settings.pollSeconds = clampPoll(settings.pollSeconds);
    if (!['high', 'medium', 'low'].includes(settings.recordQuality)) settings.recordQuality = 'high';
    return {
      own: sanitizeChannel(raw.own, { autoOpen: false, notify: false, openAsMod: false, fromFollows: false }),
      favorites,
      settings,
      giveawayRules: sanitizeRules(raw.giveawayRules),
      quickMessages: sanitizeQuickMessages(raw.quickMessages),
      starred: Array.isArray(raw.starred)
        ? [...new Set((raw.starred as unknown[]).map((x) => (typeof x === 'string' ? normalizeLogin(x) : null)).filter((x): x is string => !!x))]
        : [],
      notifSeenAt: typeof raw.notifSeenAt === 'number' && Number.isFinite(raw.notifSeenAt) ? raw.notifSeenAt : 0,
      ignoredFollows: Array.isArray(raw.ignoredFollows)
        ? [...new Set((raw.ignoredFollows as unknown[]).map((x) => (typeof x === 'string' ? normalizeLogin(x) : null)).filter((x): x is string => !!x))]
        : [],
    };
  }

  save(): void {
    const tmp = this.file + '.tmp';
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(tmp, JSON.stringify(this.config, null, 2), 'utf8');
    fs.renameSync(tmp, this.file);
  }

  allLogins(): string[] {
    const set = new Set<string>();
    if (this.config.own) set.add(this.config.own.login);
    for (const f of this.config.favorites) set.add(f.login);
    return [...set];
  }

  channel(login: string): ChannelConfig | undefined {
    if (this.config.own?.login === login) return this.config.own;
    return this.config.favorites.find((f) => f.login === login);
  }
}

export function clampPoll(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_SETTINGS.pollSeconds;
  return Math.min(900, Math.max(30, Math.round(n)));
}
