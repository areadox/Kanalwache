interface ChannelStatus {
  login: string;
  displayName: string;
  avatar: string | null;
  live: boolean;
  title: string | null;
  game: string | null;
  viewers: number | null;
  startedAt: string | null;
  exists: boolean;
}

interface ChannelView {
  login: string;
  autoOpen: boolean;
  notify: boolean;
  openAsMod: boolean;
  fromFollows: boolean;
  status: ChannelStatus | null;
}

interface AppSettings {
  pollSeconds: number;
  closeToTray: boolean;
  startInTray: boolean;
  autostart: boolean;
  muteAutoOpened: boolean;
  closeTabWhenOffline: boolean;
  giveawayHelper: boolean;
  giveawayNotify: boolean;
  autoClaimPoints: boolean;
  syncFollows: boolean;
  fullPage: boolean;
  singleAudio: boolean;
  showFavBar: boolean;
  recordDir: string;
  recordQuality: 'high' | 'medium' | 'low';
  followNotify: boolean;
  followAutoOpen: boolean;
}

interface FollowedChannel {
  login: string;
  displayName: string;
  avatar: string | null;
  live: boolean;
  followedAt: string | null;
}

interface GiveawayRules {
  announceWords: string[];
  entryCommands: string[];
  ignoreCommands: string[];
  endWords: string[];
  winWords: string[];
  bots: string[];
  crowdMinUsers: number;
}

type TestResult =
  | {
      privileged: true;
      me: string | null;
      start: string | null;
      end: boolean;
      win: boolean;
      noCommand: boolean;
      winners: string[];
      hits: { announce: string | null; end: string | null; win: string | null };
    }
  | { privileged: false; me: string | null; entryCommand: string | null; ignored: boolean; crowdMinUsers: number };

interface Giveaway {
  id: string;
  channel: string;
  entry: string;
  source: 'announcement' | 'crowd';
  sourceName: string | null;
  message: string | null;
  participants: number;
  detectedAt: number;
  lastActivity: number;
  state: 'open' | 'sending' | 'joined' | 'failed' | 'ended';
  error: string | null;
  won: boolean;
  joined: boolean;
  winners: string[];
  winnerMessage: string | null;
  winnerBy: string | null;
  winnerAt: number | null;
}

interface AppState {
  own: ChannelView | null;
  favorites: ChannelView[];
  settings: AppSettings;
  auth: { loggedIn: boolean; user: string | null };
  lastCheck: number | null;
  lastError: string | null;
  checking: boolean;
  giveaways: Giveaway[];
  chat: { connected: boolean; canSend: boolean; authProblem: boolean };
  giveawayRules: GiveawayRules;
  defaultRules: GiveawayRules;
  /** Kanäle, auf denen du Moderator bist */
  mods: string[];
  /** Favoriten in deiner Reihenfolge */
  starred: string[];
  /** Dein eigener Kanal, wenn du mit diesem Account angemeldet bist */
  broadcaster: string | null;
}

type ViewMode = 'viewer' | 'mod' | 'manager';

interface OpenRequest {
  login: string;
  auto: boolean;
  muted: boolean;
  mode: ViewMode;
}

interface Result {
  ok: boolean;
  error?: string;
}

interface KanalwacheApi {
  getState(): Promise<AppState>;
  onState(cb: (s: AppState) => void): void;
  onOpenChannel(cb: (p: OpenRequest) => void): void;
  onChannelOffline(cb: (login: string) => void): void;
  addChannel(login: string): Promise<Result>;
  removeChannel(login: string): Promise<void>;
  updateChannel(login: string, patch: Partial<Pick<ChannelView, 'autoOpen' | 'notify' | 'openAsMod'>>): Promise<void>;
  moveChannel(login: string, dir: -1 | 1): Promise<void>;
  setOwn(login: string | null): Promise<Result>;
  updateSettings(patch: Partial<AppSettings>): Promise<void>;
  checkNow(): Promise<void>;
  logout(): Promise<void>;
  openExternal(url: string): Promise<void>;
  onShowGiveaways(cb: () => void): void;
  joinGiveaway(id: string, entry: string): Promise<Result>;
  dismissGiveaway(id: string): Promise<void>;
  setGiveawayRules(rules: GiveawayRules): Promise<GiveawayRules>;
  getFollows(force: boolean): Promise<{ ok: boolean; list?: FollowedChannel[]; error?: string }>;
  importFollows(logins: string[], opts: { notify: boolean; autoOpen: boolean; sync: boolean }): Promise<{ ok: boolean; added?: number; error?: string }>;
  onToast(cb: (msg: string) => void): void;
  recSourceId(wcId: number, login: string): Promise<string>;
  recStart(login: string, ext: 'mp4' | 'webm'): Promise<{ ok: boolean; id?: string; file?: string; error?: string }>;
  recChunk(id: string, data: ArrayBuffer): Promise<number>;
  recStop(id: string): Promise<{ file: string; bytes: number; error: string | null } | null>;
  recAllStopped(): Promise<void>;
  recDir(): Promise<string>;
  recChooseDir(): Promise<string | null>;
  recOpenDir(): Promise<void>;
  recShowFile(file: string): Promise<void>;
  onRecError(cb: (id: string, msg: string) => void): void;
  onStopAllRecordings(cb: () => void): void;
  onShortcut(cb: (name: string) => void): void;
  setStarred(list: string[]): Promise<void>;
  testGiveawayMessage(text: string, privileged: boolean): Promise<TestResult | null>;
}

interface Window {
  kanalwache: KanalwacheApi;
}

/** Die Teile des Electron-<webview>, die die Oberfläche benutzt. */
interface WebviewEl extends HTMLElement {
  setAudioMuted(muted: boolean): void;
  isAudioMuted(): boolean;
  reload(): void;
  getURL(): string;
  executeJavaScript(code: string): Promise<unknown>;
  loadURL(url: string): Promise<void>;
  getWebContentsId(): number;
}
