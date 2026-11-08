import { app, BrowserWindow, dialog, ipcMain, Menu, nativeImage, nativeTheme, Notification, session, shell, Tray, webContents } from 'electron';
import { RecordingFiles } from './recorder';
import { extractRaidTarget } from './raid';
import { Updater } from './updater';
import * as path from 'node:path';
import { clampPoll, normalizeLogin, sanitizeQuickMessages, Settings, Store } from './store';
import { ChannelStatus, fetchFollows, fetchModChannels, fetchStatuses, FollowedChannel } from './twitch';
import { fetchTwitchNotifications, TwitchNotification } from './notifications';
import { TwitchChat } from './chat';
import { analyzeAnnouncement, ENTRY_RE, Giveaway, GiveawayDetector } from './giveaway';
import { compileRules, CompiledRules, DEFAULT_RULES, sanitizeRules } from './rules';

/** Gemeinsame, dauerhafte Sitzung für alle Twitch-Ansichten: hier liegt dein Login. */
const PARTITION = 'persist:twitch';
const TWITCH_URL_RE = /^https:\/\/([a-z0-9-]+\.)*twitch\.tv(\/|$)/i;
const startHidden = process.argv.includes('--hidden');

let win: BrowserWindow | null = null;
let tray: Tray | null = null;
let quitting = false;
let store: Store;
let statuses = new Map<string, ChannelStatus>();
let lastCheck: number | null = null;
let lastError: string | null = null;
let checking = false;
let firstPoll = true;
let pollTimer: NodeJS.Timeout | null = null;
let trayHintShown = false;
let auth = { loggedIn: false, user: null as string | null };
let authToken: string | null = null;

// ---------- Gefolgte Kanäle ----------

let followsCache: { at: number; token: string; list: FollowedChannel[] } | null = null;

async function loadFollows(force: boolean): Promise<FollowedChannel[]> {
  if (!authToken) throw new Error('Dafür musst du bei Twitch angemeldet sein.');
  if (!force && followsCache && followsCache.token === authToken && Date.now() - followsCache.at < 2 * 60_000) return followsCache.list;
  const list = await fetchFollows(authToken);
  followsCache = { at: Date.now(), token: authToken, list };
  return list;
}

/** Fügt gefolgte Kanäle mit den Follow-Standardwerten hinzu; liefert die Anzahl neuer Kanäle. */
function addFollowed(logins: string[]): number {
  const s = store.config.settings;
  const have = new Set(store.allLogins());
  let added = 0;
  for (const login of logins) {
    if (have.has(login)) continue;
    store.config.favorites.push({ login, autoOpen: s.followAutoOpen, notify: s.followNotify, openAsMod: false, fromFollows: true });
    have.add(login);
    added++;
  }
  return added;
}

let syncingFollows = false;

/** Abgleich: neue Follows hinzufügen, entfolgte (nur die aus dem Abgleich) entfernen. */
async function syncFollows(): Promise<void> {
  if (syncingFollows || !store.config.settings.syncFollows || !authToken) return;
  syncingFollows = true;
  try {
    const list = await loadFollows(true);
    const followed = new Set(list.map((f) => f.login));
    const ignored = new Set(store.config.ignoredFollows);
    const added = addFollowed(list.map((f) => f.login).filter((l) => !ignored.has(l)));
    const auto = store.config.favorites.filter((f) => f.fromFollows);
    // Leere Liste trotz vieler Follow-Kanäle: eher ein Fehler bei Twitch – dann nichts entfernen
    const trustRemoval = list.length > 0 || auto.length <= 5;
    const before = store.config.favorites.length;
    if (trustRemoval) store.config.favorites = store.config.favorites.filter((f) => !f.fromFollows || followed.has(f.login));
    const removed = before - store.config.favorites.length;
    store.config.ignoredFollows = store.config.ignoredFollows.filter((l) => followed.has(l));
    if (added || removed) {
      syncChat();
      saveAndPush(true);
      win?.webContents.send('toast', [
        added ? `${added} neue${added === 1 ? 'r gefolgter Kanal' : ' gefolgte Kanäle'} hinzugefügt` : '',
        removed ? `${removed} entfolgte${removed === 1 ? 'r Kanal' : ' Kanäle'} entfernt` : '',
      ].filter(Boolean).join(', ') + '.');
    }
  } catch {
    // Nächster Versuch beim nächsten Durchlauf
  } finally {
    syncingFollows = false;
  }
}

/** Favoriten, die noch in deiner Kanalliste stehen (entfernte Kanäle fallen raus) */
function starredList(): string[] {
  const have = new Set(store.allLogins());
  return store.config.starred.filter((l) => have.has(l));
}

/** Angekündigte Raids je Kanal (aus dem Chat) */
const pendingRaids = new Map<string, { target: string; at: number; text: string; by: string }>();

// ---------- Moderation ----------

/** Mod-Status laut Twitch-Abfrage (null = Abfrage hat nicht geklappt) */
let gqlMods: Set<string> | null = null;
/** Mod-Status laut Chat (USERSTATE); ergänzt die Abfrage */
const ircMods = new Map<string, boolean>();

function isModOn(login: string): boolean {
  if (ircMods.has(login)) return ircMods.get(login)!;
  return !!gqlMods?.has(login);
}

function modChannels(): string[] {
  return store.allLogins().filter((l) => l !== ownBroadcasterLogin() && isModOn(l));
}

/** Dein eigener Kanal – nur, wenn du auch mit diesem Account angemeldet bist */
function ownBroadcasterLogin(): string | null {
  const own = store?.config.own?.login;
  return own && auth.user?.toLowerCase() === own ? own : null;
}

// ---------- Twitch-Benachrichtigungen (Glocke) ----------

let notifs: { list: TwitchNotification[]; error: string | null; loading: boolean; at: number | null } = { list: [], error: null, loading: false, at: null };
let notifTimer: NodeJS.Timeout | null = null;
/** IDs, die beim letzten Abruf schon da waren – nur wirklich neue gehen als Windows-Meldung raus */
let notifKnown: Set<string> | null = null;
const NOTIF_EVERY = 2 * 60_000;

function notifUnread(): number {
  const seen = store.config.notifSeenAt;
  return notifs.list.filter((n) => !n.read && (n.at == null ? false : n.at > seen)).length;
}

function scheduleNotifs(delay = NOTIF_EVERY): void {
  if (notifTimer) clearTimeout(notifTimer);
  notifTimer = setTimeout(() => void refreshNotifs(), delay);
}

async function refreshNotifs(): Promise<void> {
  if (notifTimer) clearTimeout(notifTimer);
  notifTimer = null;
  if (!authToken || !store.config.settings.twitchNotifs) {
    if (notifs.list.length || notifs.error) {
      notifs = { list: [], error: null, loading: false, at: null };
      notifKnown = null;
      pushState();
      updateTrayMenu();
    }
    return;
  }
  notifs.loading = true;
  pushState();
  try {
    const list = await fetchTwitchNotifications(authToken);
    // Ohne Link: steht ein bekannter Kanal am Anfang des Texts („KanalEins ist jetzt live …“), diesen öffnen
    for (const n of list) {
      if (n.login || n.url) continue;
      const lower = n.text.toLowerCase();
      for (const login of store.allLogins()) {
        const name = (statuses.get(login)?.displayName ?? login).toLowerCase();
        if (lower.startsWith(name + ' ') || lower.startsWith(login + ' ')) { n.login = login; break; }
      }
    }
    const prevKnown = notifKnown;
    notifKnown = new Set(list.map((n) => n.id));
    notifs = { list, error: null, loading: false, at: Date.now() };
    if (prevKnown && store.config.settings.twitchNotifPopup && Notification.isSupported()) {
      const fresh = list.filter((n) => !prevKnown.has(n.id) && !n.read).slice(0, 3);
      for (const f of fresh) {
        const note = new Notification({ title: 'Twitch', body: f.text, icon: iconPath() });
        note.on('click', () => {
          showWindow();
          openNotif(f);
        });
        note.show();
      }
    }
  } catch (err) {
    notifs = { ...notifs, loading: false, error: err instanceof Error ? err.message : String(err), at: Date.now() };
  } finally {
    pushState();
    updateTrayMenu();
    scheduleNotifs();
  }
}

function openNotif(n: TwitchNotification): void {
  if (n.login) openChannel(n.login, false);
  else if (n.url) void shell.openExternal(n.url);
}

async function refreshMods(): Promise<void> {
  if (!authToken) {
    if (gqlMods) {
      gqlMods = null;
      ircMods.clear();
      pushState();
    }
    return;
  }
  try {
    const next = await fetchModChannels(store.allLogins(), authToken);
    const changed = !gqlMods || next.size !== gqlMods.size || [...next].some((l) => !gqlMods!.has(l));
    gqlMods = next;
    if (changed) pushState();
  } catch {
    // Erkennung über den Chat bleibt
  }
}

// ---------- Giveaway-Helfer ----------

/** Gesendete Teilnahmen, auf deren Bestätigung durch Twitch gewartet wird (Kanal → Giveaway-ID) */
const pendingJoins = new Map<string, { id: string; timer: NodeJS.Timeout }>();

const chat = new TwitchChat({
  onMessage: (m) => {
    detector.handle(m);
    // Raid-Ansage („wir raiden jetzt @xyz“) merken – geht der Kanal danach offline, kommt die Raid-Karte
    if (m.isBroadcaster || m.isMod || rules().bots.has(m.login)) {
      const target = extractRaidTarget(m.text, m.channel);
      if (target) pendingRaids.set(m.channel, { target, at: Date.now(), text: m.text, by: m.displayName });
    }
  },
  onUserState: (channel, isMod) => {
    finishJoin(channel, null);
    finishSend(channel, null);
    if (!chat.canSend) return;
    if (ircMods.get(channel) !== isMod) {
      ircMods.set(channel, isMod);
      pushState();
    }
  },
  onNotice: (channel, msgId, text) => {
    if (pendingJoins.has(channel) && /^(msg_|unrecognized_cmd|no_permission)/.test(msgId)) finishJoin(channel, noticeText(msgId, text));
    if (pendingSends.has(channel) && /^(msg_|unrecognized_cmd|no_permission)/.test(msgId)) finishSend(channel, noticeText(msgId, text));
  },
  onStatus: () => pushState(),
});

let compiledRules: CompiledRules | null = null;
function rules(): CompiledRules {
  if (!compiledRules) compiledRules = compileRules(store.config.giveawayRules);
  return compiledRules;
}

const detector = new GiveawayDetector(() => auth.user?.toLowerCase() ?? null, rules, {
  onNew: (g) => {
    if (!store.config.settings.giveawayNotify || !Notification.isSupported()) return;
    const name = statuses.get(g.channel)?.displayName ?? g.channel;
    const n = new Notification({
      title: `🎁 Giveaway bei ${name}`,
      body: `Teilnahme mit ${g.entry}${g.sourceName ? ` – angekündigt von ${g.sourceName}` : ''}. Klicken zum Teilnehmen.`,
      icon: iconPath(),
    });
    n.on('click', () => {
      showWindow();
      win?.webContents.send('show-giveaways');
    });
    n.show();
  },
  onWinners: (g, winners) => {
    // Nur melden, wenn du mitgemacht hast – sonst steht der Gewinner einfach im Giveaways-Tab
    if (!g.joined || !store.config.settings.giveawayNotify || !Notification.isSupported()) return;
    const name = statuses.get(g.channel)?.displayName ?? g.channel;
    const n = new Notification({
      title: `Giveaway bei ${name} ist ausgelost`,
      body: `Gewonnen ${winners.length === 1 ? 'hat' : 'haben'} ${winners.join(', ')} – diesmal leider nicht du.`,
      icon: iconPath(),
      silent: true,
    });
    n.on('click', () => {
      showWindow();
      win?.webContents.send('show-giveaways');
    });
    n.show();
  },
  onWin: (_g, channel, announcement, by) => {
    const name = statuses.get(channel)?.displayName ?? channel;
    if (Notification.isSupported()) {
      const n = new Notification({
        title: `🏆 Du hast bei ${name} gewonnen!`,
        body: `${by}: ${announcement}`.slice(0, 220),
        icon: iconPath(),
        urgency: 'critical',
        timeoutType: 'never',
      });
      n.on('click', () => {
        showWindow();
        openChannel(channel, false);
      });
      n.show();
    }
    showWindow();
    win?.flashFrame(true);
    openChannel(channel, false);
  },
  onChange: () => {
    pushState();
    updateTrayMenu();
  },
});

// ---------- Nachrichten in den Chat (Schnellleiste) ----------

/** Gesendete Nachrichten, auf deren Bestätigung durch Twitch gewartet wird (Kanal → Rückmeldung) */
const pendingSends = new Map<string, { resolve: (error: string | null) => void; timer: NodeJS.Timeout }>();
const lastSend = new Map<string, number>();

function finishSend(channel: string, error: string | null): void {
  const p = pendingSends.get(channel);
  if (!p) return;
  clearTimeout(p.timer);
  pendingSends.delete(channel);
  p.resolve(error);
}

async function sendChat(channelRaw: unknown, textRaw: unknown): Promise<{ ok: boolean; error?: string }> {
  const channel = typeof channelRaw === 'string' ? normalizeLogin(channelRaw) : null;
  const text = typeof textRaw === 'string' ? textRaw.replace(/[\r\n]+/g, ' ').trim().slice(0, 500) : '';
  if (!channel || !text) return { ok: false, error: 'Leere Nachricht.' };
  if (/^[/.]/.test(text)) return { ok: false, error: 'Befehle mit / oder . gehen über die Schnellleiste nicht – nur normale Nachrichten und !befehle.' };
  if (!auth.loggedIn) return { ok: false, error: 'Zum Schreiben musst du bei Twitch angemeldet sein.' };
  if (pendingSends.has(channel)) return { ok: false, error: 'Die letzte Nachricht wird noch gesendet.' };
  const since = Date.now() - (lastSend.get(channel) ?? 0);
  if (since < 1500) return { ok: false, error: 'Nicht so schnell – kurz warten.' };
  // Kanal ggf. erst betreten
  if (!chat.isJoined(channel)) {
    openTabChannels.add(channel);
    syncChat();
    for (let i = 0; i < 30 && !(chat.canSend && chat.isJoined(channel)); i++) await new Promise((r) => setTimeout(r, 200));
  }
  if (!chat.canSend) {
    return {
      ok: false,
      error: chat.authProblem
        ? 'Twitch nimmt den Login für den Chat nicht an. In den Einstellungen ab- und wieder anmelden.'
        : 'Der Chat ist gerade nicht verbunden – gleich nochmal versuchen.',
    };
  }
  if (!chat.send(channel, text)) return { ok: false, error: 'Senden ging nicht – Chat noch nicht bereit.' };
  lastSend.set(channel, Date.now());
  // Twitch bestätigt mit USERSTATE oder lehnt mit NOTICE ab (z. B. Follower-only, Slow-Mode)
  const error = await new Promise<string | null>((resolve) => {
    const timer = setTimeout(() => finishSend(channel, null), 4000);
    pendingSends.set(channel, { resolve, timer });
  });
  return error ? { ok: false, error } : { ok: true };
}

function noticeText(msgId: string, fallback: string): string {
  if (msgId.startsWith('msg_followersonly')) return 'In diesem Chat dürfen nur Follower schreiben.';
  if (msgId === 'msg_subsonly') return 'In diesem Chat dürfen nur Abonnenten schreiben.';
  if (msgId === 'msg_emoteonly') return 'Der Chat ist im Emote-Modus.';
  if (msgId === 'msg_duplicate') return 'Dieselbe Nachricht wurde gerade schon gesendet – kurz warten.';
  if (msgId === 'msg_slowmode' || msgId === 'msg_ratelimit') return 'Slow-Mode – bitte kurz warten und nochmal.';
  if (msgId === 'msg_banned' || msgId === 'msg_channel_blocked') return 'Du bist in diesem Kanal gebannt.';
  if (msgId === 'msg_timedout') return 'Du hast gerade einen Timeout in diesem Kanal.';
  if (msgId.startsWith('msg_verified_email') || msgId.includes('verified_phone')) return 'Der Kanal verlangt eine bestätigte E-Mail oder Telefonnummer.';
  return fallback || 'Twitch hat die Nachricht abgelehnt.';
}

function finishJoin(channel: string, error: string | null): void {
  const p = pendingJoins.get(channel);
  if (!p) return;
  clearTimeout(p.timer);
  pendingJoins.delete(channel);
  detector.update(p.id, error ? { state: 'failed', error } : { state: 'joined', error: null });
}

function joinGiveaway(id: string, entryInput: string): { ok: boolean; error?: string } {
  const g = detector.get(id);
  if (!g || g.state === 'ended') return { ok: false, error: 'Das Giveaway ist schon vorbei.' };
  const entry = entryInput.trim().replace(/\s+/g, ' ');
  if (!ENTRY_RE.test(entry)) return { ok: false, error: 'Nur Befehle wie „!join“ oder „!ticket 5“ sind erlaubt.' };
  if (!auth.loggedIn) return { ok: false, error: 'Zum Teilnehmen musst du bei Twitch angemeldet sein.' };
  if (!chat.canSend) {
    return {
      ok: false,
      error: chat.authProblem
        ? 'Twitch nimmt den Login für den Chat nicht an. Melde dich in den Einstellungen ab und wieder an.'
        : 'Der Chat ist gerade nicht verbunden – gleich nochmal versuchen.',
    };
  }
  if (pendingJoins.has(g.channel)) return { ok: false, error: 'In diesem Kanal wird gerade schon gesendet.' };
  if (!chat.send(g.channel, entry)) return { ok: false, error: 'Senden ging nicht – Chat noch nicht bereit.' };
  // Twitch bestätigt eine angenommene Nachricht mit USERSTATE, eine abgelehnte mit NOTICE.
  const timer = setTimeout(() => finishJoin(g.channel, null), 5000);
  pendingJoins.set(g.channel, { id, timer });
  detector.update(id, { state: 'sending', entry, error: null });
  return { ok: true };
}

/** Welche Chats mitgelesen werden: alle Lieblingskanäle, die gerade live sind (dein eigener nicht). */
/** Kanäle, die gerade als Stream-Tab offen sind (für Schnellnachrichten) */
let openTabChannels = new Set<string>();

function syncChat(): void {
  const wanted = store.config.settings.giveawayHelper
    ? store.config.favorites.map((f) => f.login).filter((l) => statuses.get(l)?.live)
    : [];
  for (const l of openTabChannels) if (!wanted.includes(l)) wanted.push(l);
  for (const g of detector.list()) if (!wanted.includes(g.channel)) detector.endChannel(g.channel);
  chat.setChannels(wanted);
}

// Player sollen ohne Klick starten (auch automatisch geöffnete Streams).
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
// Verdeckte Fenster weiter zeichnen lassen – sonst bleibt bei Aufnahmen im Hintergrund das Bild stehen
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => showWindow());
  app.whenReady().then(init);
}

// ---------- Updates ----------

const updater = new Updater(() => {
  pushState();
  updateTrayMenu();
});

// ---------- Aufnahmen ----------

const recordings = new RecordingFiles((id, message) => win?.webContents.send('rec-error', id, message));
let quitAfterRecordings = false;

function recordDir(): string {
  return store.config.settings.recordDir || path.join(app.getPath('videos'), 'Kanalwache');
}

app.on('before-quit', (e) => {
  quitting = true;
  // Laufende Aufnahmen erst sauber beenden lassen, dann schließen
  if (recordings.count && !quitAfterRecordings) {
    e.preventDefault();
    quitAfterRecordings = true;
    win?.webContents.send('stop-all-recordings');
    setTimeout(() => void recordings.closeAll().then(() => app.quit()), 8000);
  }
});
app.on('window-all-closed', () => {
  // Bleibt im Infobereich aktiv; beendet wird über das Tray-Menü.
  if (!store?.config.settings.closeToTray) app.quit();
});

function iconPath(): string {
  return path.join(__dirname, 'icon.png');
}

async function init(): Promise<void> {
  app.setAppUserModelId('de.areadox.kanalwache');
  Menu.setApplicationMenu(null);
  // Twitch-Seiten sollen immer dunkel erscheinen
  nativeTheme.themeSource = 'dark';
  store = new Store(app.getPath('userData'));

  const ses = session.fromPartition(PARTITION);
  // Twitch soll einen normalen Chrome sehen, nicht „Electron“.
  ses.setUserAgent(
    ses
      .getUserAgent()
      .replace(/\sElectron\/\S+/i, '')
      .replace(/\sKanalwache\/\S+/i, '')
      .replace(/\skanalwache\/\S+/i, ''),
  );
  ses.setPermissionRequestHandler((_wc, permission, cb) => {
    cb(['fullscreen', 'notifications', 'clipboard-sanitized-write'].includes(permission));
  });
  ses.cookies.on('changed', (_e, cookie) => {
    if (cookie.domain?.includes('twitch.tv') && (cookie.name === 'auth-token' || cookie.name === 'login')) {
      void refreshAuth();
    }
  });

  app.on('web-contents-created', (_e, contents) => {
    if (contents.getType() !== 'webview') return;
    // Tastenkürzel auch dann, wenn Player oder Chat den Fokus haben
    contents.on('before-input-event', (e, input) => {
      const name = shortcutFor(input);
      if (!name) return;
      e.preventDefault();
      win?.webContents.send('shortcut', name);
    });
    contents.setWindowOpenHandler(({ url }) => {
      if (TWITCH_URL_RE.test(url)) {
        // Twitch-Popups (z. B. Chat-Popout) im selben Login-Kontext öffnen.
        return {
          action: 'allow',
          overrideBrowserWindowOptions: {
            autoHideMenuBar: true,
            icon: iconPath(),
            webPreferences: { partition: PARTITION, sandbox: true, contextIsolation: true },
          },
        };
      }
      if (/^https?:\/\//i.test(url)) void shell.openExternal(url);
      return { action: 'deny' };
    });
  });

  createWindow();
  createTray();
  applyAutostart();
  registerIpc();
  await refreshAuth();
  schedulePoll(0);
  updater.start(store.config.settings.autoUpdate);
  setInterval(() => detector.sweep(), 60_000);
  setInterval(() => void syncFollows(), 10 * 60_000);
}

function createWindow(): void {
  win = new BrowserWindow({
    width: 1440,
    height: 880,
    minWidth: 960,
    minHeight: 580,
    show: false,
    backgroundColor: '#0d0d10',
    title: 'Kanalwache',
    icon: iconPath(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: true,
      backgroundThrottling: false,
    },
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.webContents.on('before-input-event', (e, input) => {
    const name = shortcutFor(input);
    if (!name) return;
    e.preventDefault();
    win?.webContents.send('shortcut', name);
  });
  win.once('ready-to-show', () => {
    if (!(startHidden || store.config.settings.startInTray)) win?.show();
  });
  win.on('close', (e) => {
    if (!quitting && store.config.settings.closeToTray) {
      e.preventDefault();
      win?.hide();
      if (!trayHintShown && Notification.isSupported()) {
        trayHintShown = true;
        new Notification({
          title: 'Kanalwache läuft weiter',
          body: 'Die App wartet im Infobereich auf Live-Kanäle. Beenden über das Symbol unten rechts.',
          icon: iconPath(),
          silent: true,
        }).show();
      }
    }
  });
  win.webContents.on('will-attach-webview', (e, webPreferences, params) => {
    // Eingebettete Ansichten dürfen nur Twitch laden und bekommen keine Node-Rechte.
    delete (webPreferences as any).preload;
    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;
    webPreferences.sandbox = true;
    webPreferences.backgroundThrottling = false;
    params.partition = PARTITION;
    if (!TWITCH_URL_RE.test(params.src)) e.preventDefault();
  });
}

/** Tastenkürzel für die Tab-Navigation (wie im Browser) */
function shortcutFor(input: Electron.Input): string | null {
  if (input.type !== 'keyDown') return null;
  const ctrl = input.control || input.meta;
  // Alt + Pfeil / Zahl: nur durch die Favoriten schalten
  if (input.alt) {
    if (ctrl || input.shift) return null;
    if (input.code === 'ArrowRight') return 'favnext';
    if (input.code === 'ArrowLeft') return 'favprev';
    const fav = input.code.match(/^(?:Digit|Numpad)([1-9])$/);
    return fav ? `fav${fav[1]}` : null;
  }
  if (!ctrl) return input.code === 'F5' ? 'reload' : null;
  const c = input.code;
  if (c === 'Tab') return input.shift ? 'prev' : 'next';
  if (c === 'PageDown') return 'next';
  if (c === 'PageUp') return 'prev';
  if (input.shift) {
    if (c === 'KeyT') return 'reopen';
    if (c === 'KeyA') return 'tablist';
    if (c === 'KeyR') return 'record';
    return null;
  }
  const digit = c.match(/^(?:Digit|Numpad)([1-9])$/);
  if (digit) return `go${digit[1]}`;
  if (c === 'KeyW') return 'close';
  if (c === 'KeyD') return 'star';
  if (c === 'KeyM') return 'mute';
  if (c === 'KeyK') return 'tablist';
  if (c === 'KeyB') return 'notifs-toggle';
  if (c === 'KeyR') return 'reload';
  return null;
}

function showWindow(): void {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}

function createTray(): void {
  const img = nativeImage.createFromPath(iconPath()).resize({ width: 16, height: 16 });
  tray = new Tray(img);
  tray.setToolTip('Kanalwache');
  tray.on('click', showWindow);
  updateTrayMenu();
}

function updateTrayMenu(): void {
  if (!tray) return;
  const live = store
    .allLogins()
    .map((l) => statuses.get(l))
    .filter((s): s is ChannelStatus => !!s && s.live);
  const items: Electron.MenuItemConstructorOptions[] = [];
  if (live.length) {
    items.push({ label: 'Gerade live', enabled: false });
    for (const s of live) {
      items.push({
        label: `${s.displayName}${s.viewers != null ? `  (${s.viewers.toLocaleString('de-DE')})` : ''}`,
        click: () => {
          showWindow();
          openChannel(s.login, false);
        },
      });
    }
    items.push({ type: 'separator' });
  }
  const openGiveaways = detector.list().filter((g: Giveaway) => g.state === 'open');
  if (openGiveaways.length) {
    items.push({
      label: `🎁 ${openGiveaways.length} offene${openGiveaways.length === 1 ? 's Giveaway' : ' Giveaways'}`,
      click: () => {
        showWindow();
        win?.webContents.send('show-giveaways');
      },
    });
    items.push({ type: 'separator' });
  }
  const unread = notifs ? notifUnread() : 0;
  if (unread) {
    items.push({
      label: `🔔 ${unread} neue Twitch-Benachrichtigung${unread === 1 ? '' : 'en'}`,
      click: () => {
        showWindow();
        win?.webContents.send('shortcut', 'notifs');
      },
    }, { type: 'separator' });
  }
  if (updater?.state.kind === 'ready') {
    items.push({ label: `⬆ Update auf ${updater.state.version} installieren`, click: () => updater.installNow() }, { type: 'separator' });
  }
  items.push(
    { label: 'Kanalwache öffnen', click: showWindow },
    { label: 'Jetzt prüfen', click: () => schedulePoll(0) },
    { type: 'separator' },
    {
      label: 'Beenden',
      click: () => {
        quitting = true;
        app.quit();
      },
    },
  );
  tray.setContextMenu(Menu.buildFromTemplate(items));
  tray.setToolTip(live.length ? `Kanalwache – ${live.length} live` : 'Kanalwache – niemand live');
}

function applyAutostart(): void {
  if (!app.isPackaged) return;
  // Die portable .exe entpackt sich bei jedem Start in einen Temp-Ordner;
  // für den Autostart muss die eigentliche .exe eingetragen werden.
  const exe = process.env.PORTABLE_EXECUTABLE_FILE || process.execPath;
  app.setLoginItemSettings({
    openAtLogin: store.config.settings.autostart,
    path: exe,
    args: ['--hidden'],
  });
}

async function refreshAuth(): Promise<void> {
  const ses = session.fromPartition(PARTITION);
  const [token] = await ses.cookies.get({ url: 'https://www.twitch.tv', name: 'auth-token' });
  const [login] = await ses.cookies.get({ url: 'https://www.twitch.tv', name: 'login' });
  const next = { loggedIn: !!token?.value, user: login?.value ? decodeURIComponent(login.value) : null };
  chat.setAuth(token?.value && next.user ? { token: token.value, login: next.user.toLowerCase() } : null);
  const tokenChanged = (token?.value ?? null) !== authToken;
  authToken = token?.value ?? null;
  if (next.loggedIn !== auth.loggedIn || next.user !== auth.user) {
    auth = next;
    pushState();
  }
  if (tokenChanged) {
    ircMods.clear();
    followsCache = null;
    void refreshMods();
    void syncFollows();
    notifKnown = null;
    void refreshNotifs();
  }
}

// ---------- Live-Abfrage ----------

function schedulePoll(delayMs: number): void {
  if (pollTimer) clearTimeout(pollTimer);
  pollTimer = setTimeout(async () => {
    await poll();
    schedulePoll(store.config.settings.pollSeconds * 1000);
  }, delayMs);
}

async function poll(): Promise<void> {
  if (checking) return;
  const logins = store.allLogins();
  if (!logins.length) {
    lastCheck = Date.now();
    pushState();
    return;
  }
  checking = true;
  pushState();
  try {
    const result = await fetchStatuses(logins);
    const next = new Map<string, ChannelStatus>();
    for (const login of logins) {
      const prev = statuses.get(login);
      const now = result.get(login) ?? prev;
      if (!now) continue;
      next.set(login, now);
      if (now.live && !prev?.live) onWentLive(now, firstPoll);
      if (!now.live && prev?.live) {
        win?.webContents.send('channel-offline', login);
        // Kurz vorher einen Raid angekündigt? → „vermutlich“-Raid-Karte
        const pending = pendingRaids.get(login);
        if (pending && Date.now() - pending.at < 20 * 60_000 && store.config.settings.raidPrompt) {
          win?.webContents.send('raid', { source: login, target: pending.target, guessed: true, text: `${pending.by}: ${pending.text}` });
        }
        pendingRaids.delete(login);
      }
    }
    statuses = next;
    lastError = null;
    firstPoll = false;
    await refreshMods();
  } catch (err) {
    lastError = err instanceof Error ? err.message : String(err);
  } finally {
    checking = false;
    lastCheck = Date.now();
    syncChat();
    pushState();
    updateTrayMenu();
  }
}

function onWentLive(s: ChannelStatus, atStartup: boolean): void {
  const cfg = store.channel(s.login);
  if (!cfg) return;
  if (cfg.notify && !atStartup && Notification.isSupported()) {
    const n = new Notification({
      title: `${s.displayName} ist live`,
      body: [s.title, s.game].filter(Boolean).join(' · ') || 'Jetzt reinschauen',
      icon: iconPath(),
    });
    n.on('click', () => {
      showWindow();
      openChannel(s.login, false);
    });
    n.show();
  }
  if (cfg.autoOpen) openChannel(s.login, true);
}

function openChannel(login: string, auto: boolean): void {
  const cfg = store.channel(login);
  win?.webContents.send('open-channel', {
    login,
    auto,
    muted: auto && store.config.settings.muteAutoOpened,
    mode: auto && cfg?.openAsMod && isModOn(login) ? 'mod' : 'viewer',
  });
}

// ---------- Zustand für die Oberfläche ----------

function view(cfg: { login: string; autoOpen: boolean; notify: boolean; openAsMod: boolean; fromFollows: boolean }) {
  return { ...cfg, status: statuses.get(cfg.login) ?? null };
}

function buildState() {
  const c = store.config;
  return {
    own: c.own ? view(c.own) : null,
    favorites: c.favorites.map(view),
    settings: c.settings,
    auth,
    lastCheck,
    lastError,
    checking,
    giveaways: detector.list(),
    mods: modChannels(),
    starred: starredList(),
    quickMessages: store.config.quickMessages,
    update: { state: updater.state, version: app.getVersion(), portable: updater.portable, supported: updater.supported },
    broadcaster: ownBroadcasterLogin(),
    giveawayRules: store.config.giveawayRules,
    defaultRules: DEFAULT_RULES,
    chat: { connected: chat.connected, canSend: chat.canSend, authProblem: chat.authProblem },
    notifs: { ...notifs, unread: notifUnread(), seenAt: store.config.notifSeenAt },
  };
}

function pushState(): void {
  win?.webContents.send('state', buildState());
}

function saveAndPush(repoll: boolean): void {
  store.save();
  pushState();
  updateTrayMenu();
  if (repoll) schedulePoll(300);
}

function registerIpc(): void {
  ipcMain.handle('get-state', () => buildState());

  ipcMain.handle('add-channel', (_e, input: unknown) => {
    const login = typeof input === 'string' ? normalizeLogin(input) : null;
    if (!login) return { ok: false, error: 'Das sieht nicht nach einem Twitch-Kanalnamen aus.' };
    if (store.config.own?.login === login) return { ok: false, error: 'Das ist schon dein eigener Kanal.' };
    if (store.config.favorites.some((f) => f.login === login)) return { ok: false, error: 'Der Kanal ist schon in der Liste.' };
    store.config.favorites.push({ login, autoOpen: true, notify: true, openAsMod: false, fromFollows: false });
    store.config.ignoredFollows = store.config.ignoredFollows.filter((l) => l !== login);
    saveAndPush(true);
    return { ok: true };
  });

  ipcMain.handle('get-follows', async (_e, force: unknown) => {
    try {
      const list = await loadFollows(force === true);
      return { ok: true, list };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcMain.handle('import-follows', async (_e, logins: unknown, opts: unknown) => {
    if (!Array.isArray(logins)) return { ok: false, error: 'Ungültige Anfrage.' };
    const o = (opts && typeof opts === 'object' ? opts : {}) as Record<string, unknown>;
    const s = store.config.settings;
    s.followNotify = o.notify !== false;
    s.followAutoOpen = o.autoOpen === true;
    s.syncFollows = o.sync === true;
    let follows: FollowedChannel[] = [];
    try {
      follows = await loadFollows(false);
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
    const followed = new Set(follows.map((f) => f.login));
    const chosen = new Set(logins.filter((l): l is string => typeof l === 'string' && followed.has(l)));
    const added = addFollowed([...chosen]);
    // Nicht ausgewählte merken, damit der Abgleich sie nicht doch hinzufügt
    const inList = new Set(store.allLogins());
    const ignored = new Set(store.config.ignoredFollows.filter((l) => !chosen.has(l)));
    for (const f of follows) if (!chosen.has(f.login) && !inList.has(f.login)) ignored.add(f.login);
    store.config.ignoredFollows = [...ignored];
    syncChat();
    saveAndPush(true);
    return { ok: true, added };
  });

  ipcMain.handle('remove-channel', (_e, login: unknown) => {
    const removed = store.config.favorites.find((f) => f.login === login);
    if (removed?.fromFollows && !store.config.ignoredFollows.includes(removed.login)) store.config.ignoredFollows.push(removed.login);
    store.config.favorites = store.config.favorites.filter((f) => f.login !== login);
    syncChat();
    saveAndPush(false);
  });

  ipcMain.handle('update-channel', (_e, login: unknown, patch: unknown) => {
    const cfg = typeof login === 'string' ? store.channel(login) : undefined;
    if (!cfg || !patch || typeof patch !== 'object') return;
    const p = patch as Record<string, unknown>;
    if (typeof p.autoOpen === 'boolean') cfg.autoOpen = p.autoOpen;
    if (typeof p.notify === 'boolean') cfg.notify = p.notify;
    if (typeof p.openAsMod === 'boolean') cfg.openAsMod = p.openAsMod;
    saveAndPush(false);
    // Neu auf „automatisch zuschauen“ gestellt und der Kanal ist gerade live: sofort öffnen.
    if (p.autoOpen === true && statuses.get(cfg.login)?.live) openChannel(cfg.login, true);
  });

  ipcMain.handle('set-starred', (_e, list: unknown) => {
    if (!Array.isArray(list)) return;
    const have = new Set(store.allLogins());
    store.config.starred = [...new Set(list.map((x) => (typeof x === 'string' ? normalizeLogin(x) : null)).filter((x): x is string => !!x && have.has(x)))];
    saveAndPush(false);
  });

  ipcMain.handle('move-channel', (_e, login: unknown, dir: unknown) => {
    const list = store.config.favorites;
    const i = list.findIndex((f) => f.login === login);
    const j = i + (dir === -1 ? -1 : 1);
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    saveAndPush(false);
  });

  ipcMain.handle('set-own', (_e, input: unknown) => {
    if (input === null || input === '') {
      store.config.own = null;
      saveAndPush(false);
      return { ok: true };
    }
    const login = typeof input === 'string' ? normalizeLogin(input) : null;
    if (!login) return { ok: false, error: 'Das sieht nicht nach einem Twitch-Kanalnamen aus.' };
    store.config.favorites = store.config.favorites.filter((f) => f.login !== login);
    store.config.own = { login, autoOpen: false, notify: false, openAsMod: false, fromFollows: false };
    saveAndPush(true);
    return { ok: true };
  });

  ipcMain.handle('update-settings', (_e, patch: unknown) => {
    if (!patch || typeof patch !== 'object') return;
    const p = patch as Partial<Settings>;
    const s = store.config.settings;
    for (const key of ['closeToTray', 'startInTray', 'autostart', 'muteAutoOpened', 'closeTabWhenOffline', 'giveawayHelper', 'giveawayNotify', 'autoClaimPoints', 'syncFollows', 'followNotify', 'followAutoOpen', 'fullPage', 'singleAudio', 'showFavBar', 'raidPrompt', 'autoUpdate', 'twitchNotifs', 'twitchNotifPopup'] as const) {
      if (typeof p[key] === 'boolean') s[key] = p[key] as boolean;
    }
    if (typeof p.pollSeconds === 'number') s.pollSeconds = clampPoll(p.pollSeconds);
    if (p.recordQuality === 'high' || p.recordQuality === 'medium' || p.recordQuality === 'low') s.recordQuality = p.recordQuality;
    applyAutostart();
    if (p.syncFollows === true) void syncFollows();
    if (typeof p.autoUpdate === 'boolean') updater.setAuto(p.autoUpdate);
    if (typeof p.twitchNotifs === 'boolean') void refreshNotifs();
    syncChat();
    saveAndPush(typeof p.pollSeconds === 'number');
  });

  ipcMain.handle('giveaway-join', (_e, id: unknown, entry: unknown) => {
    if (typeof id !== 'string' || typeof entry !== 'string') return { ok: false, error: 'Ungültige Anfrage.' };
    return joinGiveaway(id, entry);
  });

  ipcMain.handle('set-giveaway-rules', (_e, raw: unknown) => {
    store.config.giveawayRules = sanitizeRules(raw);
    compiledRules = null;
    saveAndPush(false);
    return store.config.giveawayRules;
  });

  ipcMain.handle('test-giveaway-message', (_e, text: unknown, privileged: unknown) => {
    const t = typeof text === 'string' ? text.slice(0, 500).trim() : '';
    const r = rules();
    const me = auth.user?.toLowerCase() ?? null;
    if (!t) return null;
    if (privileged) return { privileged: true, me, ...analyzeAnnouncement(t, r, me) };
    const token = t.split(/\s+/)[0].toLowerCase();
    return {
      privileged: false,
      me,
      entryCommand: r.entry.has(token) && !r.ignore.has(token) && ENTRY_RE.test(t) ? token : null,
      ignored: r.ignore.has(token),
      crowdMinUsers: r.crowdMinUsers,
    };
  });

  ipcMain.handle('giveaway-dismiss', (_e, id: unknown) => {
    if (typeof id === 'string') detector.dismiss(id);
  });

  ipcMain.handle('check-now', () => schedulePoll(0));

  ipcMain.handle('logout', async () => {
    await session.fromPartition(PARTITION).clearStorageData();
    await refreshAuth();
  });

  // Aufnahmen – nur in Kanälen, in denen du Moderator bist
  ipcMain.handle('rec-source-id', (e, wcId: unknown, login: unknown) => {
    if (typeof login !== 'string' || !isModOn(login)) throw new Error('Aufnehmen geht nur in Kanälen, in denen du Mod bist.');
    const wc = typeof wcId === 'number' ? webContents.fromId(wcId) : undefined;
    if (!wc || wc.getType() !== 'webview') throw new Error('Player nicht gefunden.');
    return wc.getMediaSourceId(e.sender);
  });

  ipcMain.handle('rec-start', (_e, login: unknown, ext: unknown) => {
    if (typeof login !== 'string' || !isModOn(login)) return { ok: false, error: 'Aufnehmen geht nur in Kanälen, in denen du Mod bist.' };
    try {
      const r = recordings.start(recordDir(), login, ext === 'webm' ? 'webm' : 'mp4');
      return { ok: true, ...r };
    } catch (err) {
      return { ok: false, error: `Datei konnte nicht angelegt werden: ${err instanceof Error ? err.message : err}` };
    }
  });

  ipcMain.handle('rec-chunk', (_e, id: unknown, data: unknown) => {
    if (typeof id !== 'string' || !(data instanceof ArrayBuffer || data instanceof Uint8Array)) return -1;
    return recordings.write(id, data);
  });

  ipcMain.handle('rec-stop', (_e, id: unknown) => (typeof id === 'string' ? recordings.stop(id) : null));

  ipcMain.handle('rec-all-stopped', async () => {
    await recordings.closeAll();
    if (quitAfterRecordings) app.quit();
  });

  ipcMain.handle('rec-dir', () => recordDir());

  ipcMain.handle('rec-choose-dir', async () => {
    if (!win) return null;
    const r = await dialog.showOpenDialog(win, {
      title: 'Ordner für Aufnahmen wählen',
      defaultPath: recordDir(),
      properties: ['openDirectory', 'createDirectory'],
    });
    if (r.canceled || !r.filePaths[0]) return null;
    store.config.settings.recordDir = r.filePaths[0];
    saveAndPush(false);
    return r.filePaths[0];
  });

  ipcMain.handle('rec-open-dir', async () => {
    const dir = recordDir();
    try {
      require('node:fs').mkdirSync(dir, { recursive: true });
    } catch {
      /* egal */
    }
    await shell.openPath(dir);
  });

  ipcMain.handle('rec-show-file', (_e, file: unknown) => {
    if (typeof file === 'string' && file.startsWith(recordDir())) shell.showItemInFolder(file);
  });

  ipcMain.handle('raid-notify', (_e, source: unknown, target: unknown) => {
    if (typeof source !== 'string' || typeof target !== 'string' || !Notification.isSupported()) return;
    if (win?.isVisible() && win.isFocused()) return;
    const from = statuses.get(source)?.displayName ?? source;
    const n = new Notification({
      title: `⚔ ${from} raidet ${target}`,
      body: 'Klicken, um mitzuraiden oder abzulehnen.',
      icon: iconPath(),
      timeoutType: 'never',
    });
    n.on('click', () => showWindow());
    n.show();
  });

  ipcMain.handle('update-check', () => updater.check(true));
  ipcMain.handle('update-download', () => updater.download());
  ipcMain.handle('update-install', () => updater.installNow());
  ipcMain.handle('update-notes', () => updater.openReleaseNotes());

  ipcMain.handle('set-open-channels', (_e, list: unknown) => {
    if (!Array.isArray(list)) return;
    openTabChannels = new Set(list.map((x) => (typeof x === 'string' ? normalizeLogin(x) : null)).filter((x): x is string => !!x));
    syncChat();
  });

  ipcMain.handle('chat-send', (_e, channel: unknown, text: unknown) => sendChat(channel, text));

  ipcMain.handle('set-quick-messages', (_e, list: unknown) => {
    store.config.quickMessages = sanitizeQuickMessages(list);
    saveAndPush(false);
    return store.config.quickMessages;
  });

  ipcMain.handle('notifs-refresh', () => refreshNotifs());
  ipcMain.handle('notifs-seen', () => {
    const newest = Math.max(Date.now(), ...notifs.list.map((n) => n.at ?? 0));
    if (store.config.notifSeenAt < newest) {
      store.config.notifSeenAt = newest;
      store.save();
      pushState();
      updateTrayMenu();
    }
  });
  ipcMain.handle('notifs-open', (_e, id: unknown) => {
    const n = notifs.list.find((x) => x.id === id);
    if (n) openNotif(n);
  });

  ipcMain.handle('open-external', (_e, url: unknown) => {
    if (typeof url === 'string' && /^https:\/\//i.test(url)) void shell.openExternal(url);
  });
}
