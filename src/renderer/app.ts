const api = window.kanalwache;

// ---------- kleine Helfer ----------

type Child = Node | string | null | undefined | false;

function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Record<string, unknown> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === 'class') el.className = String(value);
    else if (key === 'text') el.textContent = String(value);
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value as EventListener);
    else el.setAttribute(key, value === true ? '' : String(value));
  }
  for (const c of children) if (c) el.append(c);
  return el;
}

const ICONS = {
  bell: '<svg viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',
  eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
  up: '<svg viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  refresh: '<svg viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
  volume: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  mute: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="m17 9 5 5M22 9l-5 5"/></svg>',
  external: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  gift: '<svg viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8S10.5 3.5 8 4.5 9 8 12 8Zm0 0s1.5-4.5 4-3.5S15 8 12 8Z"/></svg>',
  trophy: '<svg viewBox="0 0 24 24"><path d="M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 21h8M9 17h6v4H9z"/></svg>',
  coin: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v9M9.5 9.5h3.75a1.75 1.75 0 0 1 0 3.5h-2.5a1.75 1.75 0 0 0 0 3.5h3.75"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path d="M12 3 5 6v5.5c0 4.3 2.9 8 7 9.5 4.1-1.5 7-5.2 7-9.5V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg>',
  dashboard: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/></svg>',
  user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
  chat: '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4V5Z"/><path d="M8 9h8M8 12h5"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M9 6v12M15 6v12"/></svg>',
  left: '<svg viewBox="0 0 24 24"><path d="m15 6-6 6 6 6"/></svg>',
  right: '<svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>',
  list: '<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
  record: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5" fill="currentColor"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z"/></svg>',
  sword: '<svg viewBox="0 0 24 24"><path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2"/></svg>',
  home: '<svg viewBox="0 0 24 24"><path d="M4 11 12 4l8 7v9h-5v-6H9v6H4v-9Z"/></svg>',
};

function icon(name: keyof typeof ICONS): HTMLSpanElement {
  const s = h('span', { class: 'ico' });
  s.innerHTML = ICONS[name];
  return s;
}

function iconButton(name: keyof typeof ICONS, title: string, onclick: (e: MouseEvent) => void, extra = ''): HTMLButtonElement {
  return h('button', { class: `icon-btn ${extra}`.trim(), title, 'aria-label': title, type: 'button', onclick }, icon(name));
}

function fmtViewers(n: number | null): string {
  if (n == null) return '';
  return n >= 1000 ? `${(n / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} Tsd.` : n.toLocaleString('de-DE');
}

function fmtUptime(startedAt: string | null): string {
  if (!startedAt) return '';
  const mins = Math.max(0, Math.floor((Date.now() - Date.parse(startedAt)) / 60000));
  const hrs = Math.floor(mins / 60);
  return hrs ? `${hrs}:${String(mins % 60).padStart(2, '0')} Std.` : `${mins} Min.`;
}

function displayName(c: ChannelView): string {
  return c.status?.displayName || c.login;
}

function avatar(c: ChannelView, size = 'md'): HTMLElement {
  const url = c.status?.avatar;
  if (url) return h('img', { class: `avatar ${size}`, src: url, alt: '' });
  return h('span', { class: `avatar ${size} placeholder`, text: c.login.charAt(0).toUpperCase() });
}

let toastTimer = 0;
function toast(msg: string, action?: { label: string; run: () => void }): void {
  const t = document.getElementById('toast')!;
  t.replaceChildren(document.createTextNode(msg));
  if (action) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'toast-action';
    b.textContent = action.label;
    b.addEventListener('click', () => {
      t.classList.remove('show');
      action.run();
    });
    t.append(b);
  }
  t.classList.add('show');
  t.classList.toggle('has-action', !!action);
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => t.classList.remove('show'), action ? 7000 : 3200);
}

// ---------- Tabs mit eingebetteten Twitch-Ansichten ----------

interface Tab {
  id: string;
  kind: 'stream' | 'login';
  login: string | null;
  auto: boolean;
  button: HTMLElement;
  view: HTMLElement;
  /** Player (kompakte Ansicht) bzw. die ganze Seite */
  wv: WebviewEl;
  ready: boolean;
  /** Chat neben dem Player (nur kompakte Ansicht) */
  chat: WebviewEl | null;
  chatReady: boolean;
  /** Stumm-Zustand, der beim (Neu-)Aufbau gesetzt wird */
  muted: boolean;
  /** Was im Tab angezeigt wird: Kanalseite, Mod-Ansicht oder Stream-Manager */
  mode: ViewMode;
  /** Kanalpunkte: in dieser Sitzung abgeholte Boni und zuletzt gelesener Kontostand */
  claims: number;
  balance: string | null;
  /** Läuft der Player gerade? null = kein Video (offline, Mod-Ansicht …) */
  playing: boolean | null;
  /** Laufende Aufnahme (nur in Mod-Kanälen) */
  rec: Recording | null;
  recStarting: boolean;
  /** Schnellleiste unter dem Player (nur kompakte Ansicht) */
  qbar: HTMLElement | null;
}

const tabs = new Map<string, Tab>();
let activeId = 'home';
let state: AppState | null = null;

function channelByLogin(login: string): ChannelView | undefined {
  if (!state) return undefined;
  if (state.own?.login === login) return state.own;
  return state.favorites.find((f) => f.login === login);
}

function createWebview(url: string, onFirstReady: (wv: WebviewEl) => void): WebviewEl {
  const wv = document.createElement('webview') as WebviewEl;
  wv.setAttribute('src', url);
  wv.setAttribute('partition', 'persist:twitch');
  wv.setAttribute('allowpopups', '');
  wv.setAttribute('webpreferences', 'backgroundThrottling=no');
  let first = true;
  let darkTries = 0;
  wv.addEventListener('dom-ready', () => {
    // Twitch-Design dauerhaft auf Dunkel stellen (gilt für alle Twitch-Seiten in Kanalwache)
    if (/^https:\/\/(www|dashboard)\.twitch\.tv\//.test(wv.getURL()) && darkTries < 2) {
      void wv.executeJavaScript(DARK_JS).then((changed) => {
        if (changed === true) {
          darkTries++;
          wv.reload();
        }
      }).catch(() => {});
    }
    if (!first) return;
    first = false;
    onFirstReady(wv);
  });
  return wv;
}

/** Setzt Twitchs Design-Einstellung auf Dunkel; true = musste geändert werden (dann neu laden). */
const DARK_JS = `(() => {
  try {
    if (localStorage.getItem('twilight.theme') !== '1') { localStorage.setItem('twilight.theme', '1'); return true; }
  } catch (e) {}
  return false;
})()`;

/** Prüft, ob im Player ein Video läuft. */
const PLAYING_JS = `(() => {
  const v = document.querySelector('video');
  if (!v) return null;
  return !v.paused && !v.ended && v.readyState >= 2;
})()`;

// ---------- Kompakte Ansicht: nur Player und Chat ----------

let chatHidden = (() => { try { return localStorage.getItem('kw.chatHidden') === '1'; } catch { return false; } })();
let chatWidth = (() => { try { return Number(localStorage.getItem('kw.chatWidth')) || 340; } catch { return 340; } })();

function applyChatLayout(): void {
  const views = document.getElementById('views')!;
  views.style.setProperty('--chat-w', `${chatWidth}px`);
  views.classList.toggle('chat-hidden', chatHidden);
}

function isCompact(t: Tab): boolean {
  return t.kind === 'stream' && t.mode === 'viewer' && !state?.settings.fullPage;
}

function playerUrl(login: string): string {
  return `https://player.twitch.tv/?channel=${login}&parent=twitch.tv&player=popout&enableExtensions=true&muted=false`;
}

function chatUrl(login: string): string {
  // darkpopout erzwingt das dunkle Design im Popout-Chat
  return `https://www.twitch.tv/popout/${login}/chat?popout=&darkpopout`;
}

/** Ziehen am Trenner verstellt die Chat-Breite (für alle Tabs gleich). */
function makeSplitter(): HTMLElement {
  const handle = h('div', { class: 'splitter', title: 'Ziehen, um die Chat-Breite zu ändern · Doppelklick: Standardbreite' });
  handle.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const views = document.getElementById('views')!;
    // Die Webviews würden sonst die Mausbewegungen schlucken
    const shield = h('div', { class: 'drag-shield' });
    document.body.append(shield);
    const right = views.getBoundingClientRect().right;
    const move = (ev: PointerEvent) => {
      chatWidth = Math.round(Math.min(Math.max(right - ev.clientX, 260), Math.max(320, views.clientWidth - 360)));
      applyChatLayout();
    };
    const up = () => {
      shield.remove();
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      try { localStorage.setItem('kw.chatWidth', String(chatWidth)); } catch { /* egal */ }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
  handle.addEventListener('dblclick', () => {
    chatWidth = 340;
    applyChatLayout();
    try { localStorage.setItem('kw.chatWidth', '340'); } catch { /* egal */ }
  });
  return handle;
}

// ---------- Seitenleiste: Breite verstellen und einklappen ----------

const SB_MIN = 210, SB_MAX = 460, SB_DEFAULT = 300;
let sidebarWidth = (() => { try { const v = Number(localStorage.getItem('kw.sidebarWidth')); return v >= SB_MIN && v <= SB_MAX ? v : SB_DEFAULT; } catch { return SB_DEFAULT; } })();
let sidebarCollapsed = (() => { try { return localStorage.getItem('kw.sidebarCollapsed') === '1'; } catch { return false; } })();

function applySidebarLayout(): void {
  document.body.style.setProperty('--sb-w', `${sidebarWidth}px`);
  document.body.classList.toggle('sb-collapsed', sidebarCollapsed);
  const btn = document.getElementById('btn-sb-toggle');
  if (btn) {
    btn.title = sidebarCollapsed ? 'Kanalliste ausklappen' : 'Kanalliste einklappen (nur Bilder)';
    btn.replaceChildren(icon(sidebarCollapsed ? 'right' : 'left'));
  }
}

function setSidebarCollapsed(v: boolean): void {
  sidebarCollapsed = v;
  try { localStorage.setItem('kw.sidebarCollapsed', v ? '1' : '0'); } catch { /* egal */ }
  applySidebarLayout();
}

function setupSidebarResizer(): void {
  const handle = h('div', { class: 'sb-resizer', title: 'Ziehen, um die Kanalliste breiter oder schmaler zu machen · Doppelklick: Standardbreite' });
  document.getElementById('sidebar')!.append(handle);
  handle.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const shield = h('div', { class: 'drag-shield' });
    document.body.append(shield);
    const move = (ev: PointerEvent) => {
      const x = ev.clientX;
      if (x < SB_MIN - 60) { if (!sidebarCollapsed) setSidebarCollapsed(true); return; }
      if (sidebarCollapsed) setSidebarCollapsed(false);
      sidebarWidth = Math.round(Math.min(Math.max(x, SB_MIN), Math.min(SB_MAX, window.innerWidth - 420)));
      applySidebarLayout();
    };
    const up = () => {
      shield.remove();
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      try { localStorage.setItem('kw.sidebarWidth', String(sidebarWidth)); } catch { /* egal */ }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
  handle.addEventListener('dblclick', () => {
    sidebarWidth = SB_DEFAULT;
    try { localStorage.setItem('kw.sidebarWidth', String(SB_DEFAULT)); } catch { /* egal */ }
    setSidebarCollapsed(false);
  });
  document.getElementById('btn-sb-toggle')!.addEventListener('click', () => setSidebarCollapsed(!sidebarCollapsed));
  applySidebarLayout();
}

/** Baut den Inhalt eines Tabs (neu) auf – kompakt (Player + Chat) oder als ganze Seite. */
function buildTabContent(t: Tab): void {
  t.ready = false;
  t.chatReady = false;
  const onPlayerReady = (wv: WebviewEl) => {
    if (t.wv !== wv) return;
    t.ready = true;
    if (wantMuted(t)) wv.setAudioMuted(true);
    // Gemeinsame Lautstärke gleich übernehmen (danach hält syncVolumes sie aktuell)
    if (t.kind === 'stream') void wv.executeJavaScript(volSetJs(quickVolume)).catch(() => {});
    renderTabBar();
  };
  if (t.kind === 'stream' && t.login && isCompact(t)) {
    const login = t.login;
    t.wv = createWebview(playerUrl(login), onPlayerReady);
    t.chat = createWebview(chatUrl(login), (wv) => {
      if (t.chat === wv) t.chatReady = true;
    });
    t.view.className = 'view stream compact' + (t.id === activeId ? ' active' : '');
    t.view.replaceChildren(
      h('div', { class: 'player-pane' }, h('div', { class: 'player-stage' }, t.wv), (t.qbar = buildQuickbar(t))),
      makeSplitter(),
      h('div', { class: 'chat-pane' }, t.chat),
    );
  } else {
    const url = t.kind === 'login' ? 'https://www.twitch.tv/login' : urlFor(t.login!, t.mode);
    t.wv = createWebview(url, onPlayerReady);
    t.chat = null;
    t.view.className = 'view stream' + (t.id === activeId ? ' active' : '');
    t.view.replaceChildren(t.wv);
  }
}

function reloadTab(t: Tab): void {
  t.wv.reload();
  t.chat?.reload();
}

// ---------- Moderation ----------

function isMod(login: string): boolean {
  return !!state?.mods.includes(login);
}

function isBroadcaster(login: string): boolean {
  return state?.broadcaster === login;
}

function urlFor(login: string, mode: ViewMode): string {
  if (mode === 'mod') return `https://www.twitch.tv/moderator/${login}`;
  if (mode === 'manager') return `https://dashboard.twitch.tv/u/${login}/stream-manager`;
  return `https://www.twitch.tv/${login}`;
}

const MODE_LABEL: Record<ViewMode, string> = { viewer: 'Zuschauer', mod: 'Mod-Ansicht', manager: 'Stream-Manager' };

function setMode(t: Tab, mode: ViewMode): void {
  if (t.kind !== 'stream' || !t.login || t.mode === mode) return;
  if (t.rec) {
    if (!confirm('Beim Umschalten endet die laufende Aufnahme (sie wird gespeichert). Trotzdem umschalten?')) return;
    void stopRecording(t).then(() => setMode(t, mode));
    return;
  }
  if (t.ready) t.muted = t.wv.isAudioMuted();
  t.mode = mode;
  buildTabContent(t);
  renderTabBar();
}

function openStream(login: string, opts: { auto: boolean; muted: boolean; focus: boolean; mode?: ViewMode }): void {
  const id = `stream:${login}`;
  const existing = tabs.get(id);
  if (existing) {
    if (opts.mode && !opts.auto) setMode(existing, opts.mode);
    if (opts.focus) activate(id);
    return;
  }
  const mode = opts.mode ?? 'viewer';
  const view = h('section', { class: 'view stream' });
  document.getElementById('views')!.append(view);
  const tab: Tab = {
    id, kind: 'stream', login, auto: opts.auto, button: h('div'), view,
    wv: null as unknown as WebviewEl, ready: false, chat: null, chatReady: false, muted: opts.muted,
    mode, claims: 0, balance: null, playing: null, rec: null, recStarting: false, qbar: null,
  };
  buildTabContent(tab);
  tabs.set(id, tab);
  // Automatisch geöffnete Streams nur in den Vordergrund holen, wenn gerade nichts anderes läuft.
  if (opts.focus) activate(id);
  else if (opts.auto && activeId === 'home' && tabs.size === 1) {
    activate(id);
    // Automatisch geöffnet: Stumm-Einstellung für automatisch geöffnete Streams beachten
    if (singleAudio()) setAudioTab(id, opts.muted);
  } else renderTabBar();
  if (opts.auto) toast(`${channelByLogin(login) ? displayName(channelByLogin(login)!) : login} ist live – du schaust jetzt zu.`);
}

function openLogin(): void {
  const id = 'login';
  if (tabs.has(id)) return activate(id);
  const view = h('section', { class: 'view stream' });
  document.getElementById('views')!.append(view);
  const tab: Tab = {
    id, kind: 'login', login: null, auto: false, button: h('div'), view,
    wv: null as unknown as WebviewEl, ready: false, chat: null, chatReady: false, muted: false,
    mode: 'viewer', claims: 0, balance: null, playing: null, rec: null, recStarting: false, qbar: null,
  };
  buildTabContent(tab);
  tabs.set(id, tab);
  activate(id);
}

function closeTab(id: string, batch = false, recStopped = false): void {
  const t = tabs.get(id);
  if (!t) return;
  if ((t.rec || t.recStarting) && !recStopped) {
    if (!batch && !confirm(`Bei ${tabLabel(t)} läuft eine Aufnahme. Aufnahme beenden (wird gespeichert) und Tab schließen?`)) return;
    void stopRecording(t).then(() => {
      closeTab(id, false, true);
    });
    return;
  }
  if (t.kind === 'stream' && t.login) {
    closedTabs.push({ login: t.login, mode: t.mode, index: [...tabs.keys()].indexOf(id) });
    if (closedTabs.length > 20) closedTabs.shift();
  }
  // Beim Schließen des aktiven Tabs zum Nachbarn wechseln (wie im Browser)
  const seq = tabSequence();
  const idx = seq.indexOf(id);
  t.view.remove();
  tabs.delete(id);
  if (batch) return;
  if (audioTabId === id) audioTabId = null;
  if (activeId === id) {
    const rest = tabSequence();
    activate(rest[Math.min(idx, rest.length - 1)] ?? 'home');
  } else renderTabBar();
}

const FIXED_VIEWS = ['home', 'giveaways'];

function activate(id: string): void {
  activeId = tabs.has(id) || FIXED_VIEWS.includes(id) ? id : 'home';
  // Ton folgt dem aktiven Stream; auf Übersicht/Giveaways läuft der bisherige weiter
  if (singleAudio() && tabs.get(activeId)?.kind === 'stream' && audioTabId !== activeId) setAudioTab(activeId, false);
  for (const v of FIXED_VIEWS) document.getElementById(`view-${v}`)!.classList.toggle('active', activeId === v);
  for (const t of tabs.values()) t.view.classList.toggle('active', t.id === activeId);
  renderTabBar();
  renderSidebar();
}

// ---------- Tab-Leiste ----------

/** Reihenfolge aller Tabs: erst die festen, dann die offenen Streams */
function tabSequence(): string[] {
  return [...FIXED_VIEWS, ...tabs.keys()];
}

function tabLabel(t: Tab): string {
  const ch = t.login ? channelByLogin(t.login) : undefined;
  return t.kind === 'login' ? 'Twitch-Anmeldung' : ch ? displayName(ch) : t.login!;
}

let tabScroll = 0;
let lastShownActive: string | null = null;

function tabButton(t: Tab): HTMLElement {
  const ch = t.login ? channelByLogin(t.login) : undefined;
  const live = !!ch?.status?.live;
  const muted = t.ready && t.wv.isAudioMuted();
  const single = singleAudio();
  const audible = isAudible(t);
  // Bei „nur ein Tab“ sind alle anderen sowieso stumm – dort nur den Ton-Tab hervorheben
  const showMuted = single ? t.id === audioTabId && muted : muted;
  const label = tabLabel(t);
  const title = t.mode === 'viewer' ? label : `${label} – ${MODE_LABEL[t.mode]}`;
  const btn = h('div', {
    class: `tab${t.id === activeId ? ' active' : ''}${t.mode !== 'viewer' ? ` mode-${t.mode}` : ''}${showMuted ? ' is-muted' : ''}${single && audible ? ' has-audio' : ''}`,
    role: 'tab', title, draggable: 'true', 'data-tab': t.id, 'aria-selected': String(t.id === activeId),
  },
    t.mode === 'mod' ? h('span', { class: 'tab-mode', title: 'Mod-Ansicht' }, icon('shield'))
      : t.mode === 'manager' ? h('span', { class: 'tab-mode', title: 'Stream-Manager' }, icon('dashboard'))
        : ch ? avatar(ch, 'xs') : null,
    h('span', { class: 'tab-label', text: label }),
    live && t.playing === false
      ? h('span', {
          class: 'paused-flag',
          title: 'Player pausiert – solange zählst du nicht als Zuschauer und bekommst keine Kanalpunkte. Klick zum Fortsetzen.',
          onclick: (e: MouseEvent) => {
            e.stopPropagation();
            void t.wv.executeJavaScript(`(() => { const v = document.querySelector('video'); if (v) v.play(); })()`).catch(() => {});
            setTimeout(() => void claimPoints(), 1500);
          },
        }, icon('pause'))
      : live ? h('span', { class: 'live-dot', title: t.playing ? 'Live – Player läuft, du wirst als Zuschauer gezählt' : 'Live' }) : null,
    t.rec ? h('span', { class: 'rec-badge', title: 'Aufnahme läuft' }, 'REC') : null,
    t.auto ? h('span', { class: 'tag', text: 'auto', title: 'Automatisch geöffnet' }) : null,
    t.balance
      ? h('span', {
          class: `pts${t.claims ? ' has-claims' : ''}`,
          title: `Kanalpunkte: ${t.balance}${t.claims ? ` · ${t.claims}× Bonus abgeholt in dieser Sitzung` : ''}`,
        }, icon('coin'), h('span', { text: t.balance }))
      : null,
    t.kind === 'stream'
      ? iconButton(muted ? 'mute' : 'volume',
          single && t.id !== audioTabId ? 'Ton hierher holen (die anderen Tabs werden stumm)'
            : muted ? 'Ton einschalten (Strg+M)' : 'Stumm schalten (Strg+M)', (e) => {
          e.stopPropagation();
          toggleMute(t);
        }, 'tab-btn tab-mute')
      : null,
    iconButton('close', 'Tab schließen (Strg+W)', (e) => {
      e.stopPropagation();
      closeTab(t.id);
    }, 'tab-btn'),
  );
  btn.addEventListener('click', () => activate(t.id));
  btn.addEventListener('auxclick', (e) => {
    if ((e as MouseEvent).button === 1) closeTab(t.id);
  });
  btn.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showTabMenu(t, e.clientX, e.clientY);
  });
  // Umsortieren per Ziehen
  btn.addEventListener('dragstart', (e) => {
    e.dataTransfer?.setData('text/kw-tab', t.id);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
    btn.classList.add('dragging');
  });
  btn.addEventListener('dragend', () => {
    btn.classList.remove('dragging');
    document.querySelectorAll('.drop-before, .drop-after').forEach((x) => x.classList.remove('drop-before', 'drop-after'));
  });
  btn.addEventListener('dragover', (e) => {
    if (!e.dataTransfer?.types.includes('text/kw-tab')) return;
    e.preventDefault();
    const r = btn.getBoundingClientRect();
    const before = e.clientX < r.left + r.width / 2;
    btn.classList.toggle('drop-before', before);
    btn.classList.toggle('drop-after', !before);
  });
  btn.addEventListener('dragleave', () => btn.classList.remove('drop-before', 'drop-after'));
  btn.addEventListener('drop', (e) => {
    e.preventDefault();
    const from = e.dataTransfer?.getData('text/kw-tab');
    const before = btn.classList.contains('drop-before');
    btn.classList.remove('drop-before', 'drop-after');
    if (from && from !== t.id) moveTab(from, t.id, before);
  });
  t.button = btn;
  return btn;
}

function moveTab(fromId: string, toId: string, before: boolean): void {
  const entries = [...tabs.entries()];
  const from = entries.findIndex(([id]) => id === fromId);
  if (from < 0) return;
  const [moved] = entries.splice(from, 1);
  let to = entries.findIndex(([id]) => id === toId);
  if (to < 0) return;
  if (!before) to++;
  entries.splice(to, 0, moved);
  tabs.clear();
  for (const [id, t] of entries) tabs.set(id, t);
  renderTabBar();
}

function updateScrollButtons(): void {
  const sc = document.querySelector<HTMLElement>('.tabs-scroll');
  const left = document.getElementById('tabs-left');
  const right = document.getElementById('tabs-right');
  if (!sc || !left || !right) return;
  const overflow = sc.scrollWidth > sc.clientWidth + 2;
  left.hidden = right.hidden = !overflow;
  (left as HTMLButtonElement).disabled = sc.scrollLeft <= 1;
  (right as HTMLButtonElement).disabled = sc.scrollLeft + sc.clientWidth >= sc.scrollWidth - 1;
  // Kanten andeuten, wenn links/rechts noch Tabs versteckt sind
  sc.classList.toggle('fade-left', overflow && sc.scrollLeft > 1);
  sc.classList.toggle('fade-right', overflow && sc.scrollLeft + sc.clientWidth < sc.scrollWidth - 1);
}

const tabsResize = new ResizeObserver(() => updateScrollButtons());

function renderTabBar(): void {
  const bar = document.getElementById('tabbar')!;
  const oldScroll = bar.querySelector<HTMLElement>('.tabs-scroll');
  if (oldScroll) tabScroll = oldScroll.scrollLeft;

  const fixed = h('div', { class: 'tabs-fixed' },
    h('button', { class: `tab home-tab${activeId === 'home' ? ' active' : ''}`, type: 'button', title: 'Übersicht (Strg+1)', onclick: () => activate('home') },
      icon('home'), h('span', { text: 'Übersicht' })),
    h('button', { class: `tab home-tab${activeId === 'giveaways' ? ' active' : ''}`, type: 'button', title: 'Giveaways (Strg+2)', onclick: () => activate('giveaways') },
      icon('gift'), h('span', { text: 'Giveaways' }),
      openGiveaways().length ? h('span', { class: 'pill', text: String(openGiveaways().length) }) : null),
  );

  const scroller = h('div', { class: 'tabs-scroll', role: 'tablist' }, ...[...tabs.values()].map(tabButton));
  scroller.addEventListener('wheel', (e) => {
    // Mausrad scrollt die Tabs seitwärts
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (!d) return;
    e.preventDefault();
    scroller.scrollLeft += d;
  }, { passive: false });
  scroller.addEventListener('scroll', updateScrollButtons);
  // Leerer Bereich rechts von den Tabs nimmt ebenfalls abgelegte Tabs an (= ans Ende)
  scroller.addEventListener('dragover', (e) => {
    if (e.target === scroller && e.dataTransfer?.types.includes('text/kw-tab')) e.preventDefault();
  });
  scroller.addEventListener('drop', (e) => {
    if (e.target !== scroller) return;
    const from = e.dataTransfer?.getData('text/kw-tab');
    const last = [...tabs.keys()].pop();
    if (from && last && from !== last) moveTab(from, last, false);
  });

  const step = () => Math.max(160, scroller.clientWidth * 0.7);
  const leftBtn = h('button', { id: 'tabs-left', class: 'icon-btn scroll-btn', type: 'button', title: 'Nach links', hidden: true,
    onclick: () => scroller.scrollBy({ left: -step(), behavior: 'smooth' }) }, icon('left'));
  const rightBtn = h('button', { id: 'tabs-right', class: 'icon-btn scroll-btn', type: 'button', title: 'Nach rechts', hidden: true,
    onclick: () => scroller.scrollBy({ left: step(), behavior: 'smooth' }) }, icon('right'));
  const listBtn = h('button', {
    id: 'tabs-list-btn', class: `icon-btn list-btn${tabListOpen ? ' on-accent' : ''}`, type: 'button', title: 'Alle Tabs anzeigen (Strg+K)',
    onclick: (e: MouseEvent) => { e.stopPropagation(); toggleTabList(); },
  }, icon('list'), tabs.size ? h('span', { class: 'list-count', text: String(tabs.size) }) : null);

  const unread = state?.notifs?.unread ?? 0;
  const notifBtn = state?.auth.loggedIn && state.settings.twitchNotifs
    ? h('button', {
        id: 'notif-btn', class: `icon-btn list-btn${notifOpen ? ' on-accent' : ''}`, type: 'button',
        title: unread ? `${unread} neue Twitch-Benachrichtigung${unread === 1 ? '' : 'en'} (Strg+B)` : 'Twitch-Benachrichtigungen (Strg+B)',
        onclick: (e: MouseEvent) => { e.stopPropagation(); toggleNotifs(); },
      }, icon('bell'), unread ? h('span', { class: 'list-count notif-count', text: unread > 99 ? '99+' : String(unread) }) : null)
    : null;

  const parts: Child[] = [fixed, h('span', { class: 'tab-sep' }), leftBtn, scroller, rightBtn, notifBtn, listBtn];

  // Werkzeuge des aktiven Tabs stehen in der zweiten Leiste (rechts neben den Favoriten)
  const toolsZone = document.getElementById('tab-tools-zone')!;
  toolsZone.replaceChildren();
  const active = tabs.get(activeId);
  if (active) {
    const login = active.login;
    const second: ViewMode | null = !login || active.kind !== 'stream'
      ? null
      : isBroadcaster(login) ? 'manager' : isMod(login) || active.mode === 'mod' ? 'mod' : null;
    toolsZone.append(
      h('div', { class: 'tab-tools' },
        second
          ? h('div', { class: 'seg', role: 'group', 'aria-label': 'Ansicht' },
              ...(['viewer', second] as ViewMode[]).map((m) =>
                h('button', {
                  type: 'button',
                  class: `seg-btn${active.mode === m ? ' on' : ''}`,
                  'aria-pressed': String(active.mode === m),
                  title: m === 'viewer' ? 'Nur Stream und Chat' : m === 'mod' ? 'Twitchs Mod-Ansicht mit allen Moderations-Werkzeugen' : 'Dein Stream-Manager',
                  onclick: () => setMode(active, m),
                }, icon(m === 'viewer' ? 'user' : m === 'mod' ? 'shield' : 'dashboard'), h('span', { text: MODE_LABEL[m] }))))
          : null,
        active.kind === 'stream' && active.mode === 'viewer' && active.login !== state?.own?.login
          ? h('span', {
              class: `pts-display${active.balance ? '' : ' empty'}`,
              title: active.balance
                ? `Kanalpunkte in diesem Kanal: ${active.balance}${active.claims ? ` · ${active.claims}× Bonus abgeholt in dieser Sitzung` : ''}`
                : 'Kanalpunkte – erscheinen, sobald der Chat geladen ist (nur wenn der Kanal Kanalpunkte nutzt und du angemeldet bist)',
            }, icon('coin'), h('span', { text: active.balance ?? '–' }))
          : null,
        isCompact(active)
          ? iconButton('chat', chatHidden ? 'Chat einblenden' : 'Chat ausblenden', () => {
              chatHidden = !chatHidden;
              try { localStorage.setItem('kw.chatHidden', chatHidden ? '1' : '0'); } catch { /* egal */ }
              applyChatLayout();
              renderTabBar();
            }, chatHidden ? '' : 'on-accent')
          : null,
        active.rec || active.recStarting || canRecord(active)
          ? h('button', {
              type: 'button',
              class: `rec-btn${active.rec ? ' on' : ''}`,
              disabled: active.recStarting || !!active.rec?.stopping,
              title: active.rec ? 'Aufnahme beenden und speichern (Strg+Umschalt+R)' : 'Aufnahme starten (Strg+Umschalt+R) – nur in Kanälen, in denen du Mod bist',
              onclick: () => void toggleRecording(active),
            },
            h('span', { class: active.rec ? 'rec-square' : 'rec-dot' }),
            h('span', { 'data-rec-tick': active.id, text: active.rec ? recLabel(active.rec) : active.recStarting ? 'Startet …' : 'Aufnehmen' }))
          : null,
        iconButton('refresh', 'Neu laden (Strg+R)', () => reloadTab(active)),
        iconButton('external', 'Im Browser öffnen', () => openTabExternal(active)),
      ),
    );
  }

  bar.replaceChildren(...parts.filter((x): x is Node => !!x && typeof x !== 'string'));
  scroller.scrollLeft = tabScroll;
  tabsResize.disconnect();
  tabsResize.observe(scroller);
  // Neu aktivierten Tab sichtbar machen
  if (active && lastShownActive !== activeId) active.button.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  lastShownActive = activeId;
  updateScrollButtons();
  if (tabListOpen) renderTabList();
  renderFavBar();
  updateQuickbars();
  syncOpenChannels();
}

// ---------- Schnellleiste unter dem Player ----------

let quickVolume = (() => { try { const v = Number(localStorage.getItem('kw.volume')); return Number.isFinite(v) && v > 0 ? Math.min(100, v) : 100; } catch { return 100; } })();
let openChannelsKey = '';

/** Meldet dem Hauptprozess, welche Kanäle als Tab offen sind – dort wird der Chat zum Schreiben verbunden. */
function syncOpenChannels(): void {
  const list = [...tabs.values()].filter((t) => t.kind === 'stream' && t.login).map((t) => t.login!).sort();
  const key = list.join(',');
  if (key === openChannelsKey) return;
  openChannelsKey = key;
  void api.setOpenChannels(list);
}

function expandMessage(text: string, t: Tab): string {
  const ch = t.login ? channelByLogin(t.login) : undefined;
  return text
    .replace(/\{kanal\}/gi, ch ? displayName(ch) : t.login ?? '')
    .replace(/\{ich\}/gi, state?.auth.user ?? '');
}

// ---------- Gemeinsame Lautstärke für alle Streams ----------

/** Liest Lautstärke und Twitchs eigenen Stumm-Zustand im Player. known = Kanalwache hat dieses Video schon eingestellt. */
const VOL_READ_JS = `(() => {
  const v = document.querySelector('video');
  if (!v) return null;
  // user = du hast im Player gerade selbst geklickt, gescrollt oder eine Taste gedrückt
  return { vol: Math.round(v.volume * 100), muted: v.muted, known: v.__kw === true, user: Date.now() - (window.__kwUserAt || 0) < 4000 };
})()`;

/** Setzt die Lautstärke im Player, hebt Twitchs eigenes Stummschalten auf (stumm schaltet Kanalwache selbst) und merkt sie für neue Player. */
function volSetJs(vol: number): string {
  return `(() => {
    const v = document.querySelector('video');
    if (!window.__kwHooked) {
      window.__kwHooked = true;
      const mark = () => { window.__kwUserAt = Date.now(); };
      for (const ev of ['pointerdown', 'wheel', 'keydown']) window.addEventListener(ev, mark, true);
    }
    try { localStorage.setItem('volume', '${(vol / 100).toFixed(2)}'); localStorage.setItem('muted', 'false'); } catch (e) {}
    if (!v) return false;
    v.volume = ${vol / 100};
    v.muted = false;
    v.__kw = true;
    return true;
  })()`;
}

function setCentralVolume(v: number): void {
  quickVolume = Math.max(0, Math.min(100, Math.round(v)));
  try { localStorage.setItem('kw.volume', String(quickVolume)); } catch { /* egal */ }
  for (const el of document.querySelectorAll<HTMLInputElement>('.qb-vol')) if (document.activeElement !== el) el.value = String(quickVolume);
}

function setVolume(_t: Tab, v: number): void {
  setCentralVolume(v);
  void syncVolumes();
}

let volSyncing = false;

/**
 * Hält die Lautstärke in allen Playern gleich. Änderungen an Twitchs eigenem Regler im aktiven Stream
 * werden zur neuen gemeinsamen Lautstärke; Twitchs Stumm-Knopf schaltet wie Strg+M um.
 */
async function syncVolumes(): Promise<void> {
  if (volSyncing) return;
  volSyncing = true;
  try {
    const list = [...tabs.values()].filter((t) => t.kind === 'stream' && t.ready && t.mode === 'viewer');
    // Aktiven Tab zuerst – von dort werden Änderungen übernommen
    list.sort((a, b) => Number(b.id === activeId) - Number(a.id === activeId));
    for (const t of list) {
      type VolInfo = { vol: number; muted: boolean; known: boolean; user: boolean };
      let r: VolInfo | null;
      try {
        r = (await t.wv.executeJavaScript(VOL_READ_JS)) as VolInfo | null;
      } catch {
        continue;
      }
      if (!r) continue;
      if (t.id === activeId && r.known && r.user) {
        if (r.muted) {
          // Twitchs Stumm-Knopf im aktiven Player → zentral umschalten
          toggleMute(t);
        } else if (Math.abs(r.vol - quickVolume) > 1) {
          // Twitchs Regler im aktiven Player bewegt → neue gemeinsame Lautstärke
          setCentralVolume(r.vol);
        }
      }
      if (!r.known || r.muted || Math.abs(r.vol - quickVolume) > 1) {
        await t.wv.executeJavaScript(volSetJs(quickVolume)).catch(() => {});
      }
    }
  } finally {
    volSyncing = false;
  }
}

async function sendQuick(t: Tab, m: QuickMessage, btn: HTMLButtonElement): Promise<void> {
  if (!t.login || btn.classList.contains('sending')) return;
  if (!state?.auth.loggedIn) {
    toast('Zum Schreiben im Chat musst du bei Twitch angemeldet sein.');
    return;
  }
  btn.classList.add('sending');
  const r = await api.chatSend(t.login, expandMessage(m.text, t));
  btn.classList.remove('sending');
  if (r.ok) {
    btn.classList.add('sent');
    setTimeout(() => btn.classList.remove('sent'), 1400);
  } else {
    btn.classList.add('failed');
    setTimeout(() => btn.classList.remove('failed'), 1600);
    toast(r.error ?? 'Senden ging nicht.');
  }
}

function buildQuickbar(t: Tab): HTMLElement {
  const bar = h('div', { class: 'quickbar', role: 'toolbar', 'aria-label': 'Schnellleiste' });
  fillQuickbar(t, bar);
  return bar;
}

function fillQuickbar(t: Tab, bar: HTMLElement): void {
  const muted = t.ready && t.wv.isAudioMuted();
  const single = singleAudio();
  const vol = h('input', { type: 'range', min: '0', max: '100', step: '1', value: String(quickVolume), class: 'qb-vol', title: 'Lautstärke', 'aria-label': 'Lautstärke' }) as HTMLInputElement;
  vol.addEventListener('input', () => setVolume(t, Number(vol.value)));
  const messages = state?.quickMessages ?? [];
  bar.dataset.key = JSON.stringify([messages, !!state?.auth.loggedIn]);
  bar.replaceChildren(
    h('button', {
      type: 'button', class: `qb-mute${muted ? ' is-muted' : ''}`, 'data-muted': String(muted),
      title: single && t.id !== audioTabId ? 'Ton hierher holen (Strg+M)' : muted ? 'Ton einschalten (Strg+M)' : 'Stumm schalten (Strg+M)',
      onclick: () => toggleMute(t),
    }, icon(muted ? 'mute' : 'volume'), h('span', { text: muted ? 'Stumm' : 'Ton an' })),
    vol,
    h('span', { class: 'qb-sep' }),
    h('div', { class: 'qb-msgs' },
      ...messages.map((m) => {
        const b = h('button', {
          type: 'button', class: 'qb-msg', disabled: !state?.auth.loggedIn,
          title: state?.auth.loggedIn ? `In den Chat: ${expandMessage(m.text, t)}` : 'Dafür bei Twitch anmelden',
        }, h('span', { text: m.label })) as HTMLButtonElement;
        b.addEventListener('click', () => void sendQuick(t, m, b));
        return b;
      }),
      !messages.length ? h('span', { class: 'muted qb-empty', text: 'Noch keine Schnellnachrichten' }) : null),
    iconButton('edit', 'Schnellnachrichten bearbeiten', () => openQuickDialog(), 'qb-edit'),
  );
}

/** Leisten an Stumm-Zustand und geänderte Nachrichten anpassen (ohne den Regler beim Ziehen neu zu bauen). */
function updateQuickbars(): void {
  for (const t of tabs.values()) {
    if (!t.qbar || !t.qbar.isConnected) continue;
    // Stumm-Knopf sofort anpassen – auch wenn er gerade den Fokus hat (sonst sprang die Anzeige erst verzögert um)
    updateMuteButton(t);
    const key = JSON.stringify([state?.quickMessages ?? [], !!state?.auth.loggedIn]);
    const focusInMsgs = !!t.qbar.querySelector('.qb-msgs')?.contains(document.activeElement);
    if (t.qbar.dataset.key !== key && !focusInMsgs) fillQuickbar(t, t.qbar);
  }
}

function updateMuteButton(t: Tab): void {
  const btn = t.qbar?.querySelector<HTMLButtonElement>('.qb-mute');
  if (!btn) return;
  const muted = t.ready && t.wv.isAudioMuted();
  const title = singleAudio() && t.id !== audioTabId ? 'Ton hierher holen (Strg+M)' : muted ? 'Ton einschalten (Strg+M)' : 'Stumm schalten (Strg+M)';
  if (btn.dataset.muted === String(muted) && btn.title === title) return;
  btn.dataset.muted = String(muted);
  btn.title = title;
  btn.classList.toggle('is-muted', muted);
  btn.replaceChildren(icon(muted ? 'mute' : 'volume'), h('span', { text: muted ? 'Stumm' : 'Ton an' }));
}

// ---------- Schnellnachrichten bearbeiten ----------

let qmDraft: QuickMessage[] = [];

function openQuickDialog(): void {
  (document.getElementById('settings') as HTMLDialogElement).close();
  qmDraft = (state?.quickMessages ?? []).map((m) => ({ ...m }));
  renderQuickDialog();
  (document.getElementById('qm-dialog') as HTMLDialogElement).showModal();
}

let qmSaveTimer = 0;
function saveQuickDraft(): void {
  clearTimeout(qmSaveTimer);
  qmSaveTimer = window.setTimeout(async () => {
    const saved = await api.setQuickMessages(qmDraft.filter((m) => m.text.trim()));
    if (state) state.quickMessages = saved;
    updateQuickbars();
  }, 300);
}

function renderQuickDialog(focusIndex?: number, focusField?: 'label' | 'text'): void {
  const list = document.getElementById('qm-list')!;
  list.replaceChildren(...qmDraft.map((m, i) => {
    const label = h('input', { class: 'qm-label', value: m.label, maxlength: '24', placeholder: 'Knopf', 'aria-label': 'Beschriftung' }) as HTMLInputElement;
    const text = h('input', { class: 'qm-text', value: m.text, maxlength: '450', placeholder: 'Nachricht für den Chat, z. B. Hallo {kanal}!', 'aria-label': 'Nachricht' }) as HTMLInputElement;
    label.addEventListener('input', () => { m.label = label.value; saveQuickDraft(); });
    text.addEventListener('input', () => { m.text = text.value; if (!m.label.trim()) m.label = text.value.slice(0, 24); saveQuickDraft(); });
    const row = h('div', { class: 'qm-row' },
      h('span', { class: 'qm-num', text: String(i + 1) }),
      label, text,
      iconButton('up', 'Nach oben', () => { if (i > 0) { [qmDraft[i - 1], qmDraft[i]] = [qmDraft[i], qmDraft[i - 1]]; saveQuickDraft(); renderQuickDialog(); } }, i === 0 ? 'off' : ''),
      iconButton('down', 'Nach unten', () => { if (i < qmDraft.length - 1) { [qmDraft[i + 1], qmDraft[i]] = [qmDraft[i], qmDraft[i + 1]]; saveQuickDraft(); renderQuickDialog(); } }, i === qmDraft.length - 1 ? 'off' : ''),
      iconButton('trash', 'Entfernen', () => { qmDraft.splice(i, 1); saveQuickDraft(); renderQuickDialog(); }, 'danger'));
    if (focusIndex === i) setTimeout(() => (focusField === 'text' ? text : label).focus(), 0);
    return row;
  }));
  if (!qmDraft.length) list.append(h('p', { class: 'muted rule-hint', text: 'Noch keine Schnellnachrichten – unten hinzufügen.' }));
  (document.getElementById('qm-add') as HTMLButtonElement).disabled = qmDraft.length >= 20;
}

function setupQuickDialog(): void {
  document.getElementById('qm-add')!.addEventListener('click', () => {
    qmDraft.push({ label: '', text: '' });
    renderQuickDialog(qmDraft.length - 1, 'label');
  });
  document.getElementById('qm-reset')!.addEventListener('click', () => {
    if (!confirm('Alle Schnellnachrichten auf die Beispiele zurücksetzen?')) return;
    qmDraft = [
      { label: '👋 Hallo', text: 'Hallo {kanal} 👋' },
      { label: 'GG', text: 'GG! 🎉' },
      { label: 'Lurk', text: '!lurk' },
      { label: '❤️ Danke', text: 'Danke für den Stream, {kanal}! ❤️' },
    ];
    saveQuickDraft();
    renderQuickDialog();
  });
  document.getElementById('btn-quick')!.addEventListener('click', openQuickDialog);
}

// ---------- Updates ----------

let updToastFor = '';

function renderUpdate(next: AppState): void {
  const box = document.getElementById('update-box')!;
  const u = next.update.state;
  // Einmal pro Version kurz Bescheid sagen
  const key = u.kind === 'available' || u.kind === 'ready' ? `${u.kind}:${u.version}` : '';
  if (key && key !== updToastFor) {
    updToastFor = key;
    if (u.kind === 'ready') toast(`Update auf ${u.version} ist bereit – „Jetzt neu starten“ links unten.`);
    else if (u.kind === 'available' && next.update.portable) toast(`Kanalwache ${u.version} ist da.`);
  }
  if (u.kind === 'available' && next.update.portable) {
    box.replaceChildren(h('div', { class: 'upd-box' },
      h('div', { class: 'upd-text' }, h('strong', { text: `Kanalwache ${u.version} ist da` }), h('span', { class: 'muted', text: `Du hast ${next.update.version}` })),
      h('div', { class: 'upd-actions' },
        h('button', { type: 'button', class: 'btn primary small', text: 'Herunterladen', onclick: () => void api.updateDownload() }),
        h('button', { type: 'button', class: 'link-btn', text: 'Was ist neu?', onclick: () => void api.updateNotes() }))));
  } else if (u.kind === 'available' || u.kind === 'downloading') {
    const pct = u.kind === 'downloading' ? u.percent : 0;
    const bar = h('span', { class: 'upd-bar-fill' });
    bar.style.width = `${pct}%`;
    box.replaceChildren(h('div', { class: 'upd-box' },
      h('div', { class: 'upd-text' }, h('strong', { text: `Update ${u.version} wird geladen …` }), h('span', { class: 'muted', text: `${pct} %` })),
      h('span', { class: 'upd-bar' }, bar)));
  } else if (u.kind === 'ready') {
    box.replaceChildren(h('div', { class: 'upd-box ready' },
      h('div', { class: 'upd-text' }, h('strong', { text: `Update ${u.version} ist bereit` }), h('span', { class: 'muted', text: 'Wird sonst beim Beenden installiert' })),
      h('div', { class: 'upd-actions' },
        h('button', { type: 'button', class: 'btn primary small', text: 'Jetzt neu starten', onclick: () => void api.updateInstall() }),
        h('button', { type: 'button', class: 'link-btn', text: 'Was ist neu?', onclick: () => void api.updateNotes() }))));
  } else {
    box.replaceChildren();
  }
  if ((document.getElementById('settings') as HTMLDialogElement).open) renderUpdateSettings();
}

function renderUpdateSettings(): void {
  if (!state) return;
  const u = state.update;
  document.getElementById('upd-version')!.textContent = `Version ${u.version} · ${u.portable ? 'portable' : 'installiert'}`;
  const st = u.state;
  const btn = document.getElementById('btn-upd-check') as HTMLButtonElement;
  btn.disabled = st.kind === 'checking' || st.kind === 'downloading';
  document.getElementById('upd-status')!.textContent =
    !u.supported ? 'Updates gibt es nur in der fertigen App.'
      : st.kind === 'checking' ? 'Suche nach Updates …'
        : st.kind === 'none' ? `Kanalwache ist aktuell (geprüft ${new Date(st.checkedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}).`
          : st.kind === 'available' ? (u.portable ? `Version ${st.version} ist verfügbar – „Herunterladen“ links unten lädt die neue portable .exe.` : `Version ${st.version} wird geladen …`)
            : st.kind === 'downloading' ? `Version ${st.version} wird geladen … ${st.percent} %`
              : st.kind === 'ready' ? `Version ${st.version} ist bereit – „Jetzt neu starten“ oder beim Beenden.`
                : st.kind === 'error' ? `Update-Prüfung fehlgeschlagen: ${st.message}`
                  : u.portable ? 'Die portable Version zeigt neue Versionen an; heruntergeladen wird über den Browser.' : 'Neue Versionen werden im Hintergrund geladen und beim Neustart installiert.';
}

// ---------- Ton: nur ein Tab ----------

/** Tab, aus dem der Ton kommt (nur wenn „Ton nur aus einem Tab“ an ist) */
let audioTabId: string | null = null;
/** Ton-Tab von dir selbst stumm geschaltet */
let audioMuted = false;

function singleAudio(): boolean {
  return state?.settings.singleAudio !== false;
}

/** Soll dieser Tab gerade stumm sein? */
function wantMuted(t: Tab): boolean {
  if (!singleAudio()) return t.muted;
  return t.id !== audioTabId || audioMuted;
}

function applyAudio(): void {
  for (const t of tabs.values()) {
    if (t.kind !== 'stream' || !t.ready) continue;
    const m = wantMuted(t);
    if (t.wv.isAudioMuted() !== m) t.wv.setAudioMuted(m);
  }
}

/** Ton kommt aus diesem Tab (alle anderen werden stumm). */
function setAudioTab(id: string | null, muted = false): void {
  audioTabId = id;
  audioMuted = muted;
  applyAudio();
}

function toggleMute(t: Tab): void {
  if (t.kind !== 'stream' || !t.ready) return;
  queueMicrotask(() => { for (const x of tabs.values()) updateMuteButton(x); });
  if (singleAudio()) {
    // Am Ton-Tab: stumm/laut. An einem anderen Tab: Ton hierher holen.
    if (t.id === audioTabId) setAudioTab(t.id, !audioMuted);
    else setAudioTab(t.id, false);
  } else {
    t.wv.setAudioMuted(!t.wv.isAudioMuted());
    t.muted = t.wv.isAudioMuted();
  }
  renderTabBar();
}

/** Für Symbole und Menüs: Ist dieser Tab der hörbare? */
function isAudible(t: Tab): boolean {
  return t.kind === 'stream' && t.ready && !t.wv.isAudioMuted();
}

function openTabExternal(t: Tab): void {
  void api.openExternal(isCompact(t) && t.login ? `https://www.twitch.tv/${t.login}` : t.wv.getURL() || 'https://www.twitch.tv');
}

// ---------- Kontextmenü ----------

interface MenuItem {
  label?: string;
  icon?: keyof typeof ICONS;
  hint?: string;
  danger?: boolean;
  disabled?: boolean;
  sep?: boolean;
  onClick?: () => void;
}

function closeMenu(): void {
  document.getElementById('ctx-menu')?.remove();
}

function showMenu(x: number, y: number, items: MenuItem[]): void {
  closeMenu();
  const menu = h('div', { id: 'ctx-menu', class: 'ctx-menu', role: 'menu' },
    ...items.map((it) => it.sep
      ? h('div', { class: 'ctx-sep' })
      : h('button', {
          type: 'button', role: 'menuitem', class: `ctx-item${it.danger ? ' danger' : ''}`, disabled: !!it.disabled,
          onclick: () => { closeMenu(); it.onClick?.(); },
        }, it.icon ? icon(it.icon) : h('span', { class: 'ico' }), h('span', { class: 'ctx-label', text: it.label ?? '' }), it.hint ? h('span', { class: 'ctx-hint', text: it.hint }) : null)));
  document.body.append(menu);
  const r = menu.getBoundingClientRect();
  menu.style.left = `${Math.max(8, Math.min(x, window.innerWidth - r.width - 8))}px`;
  menu.style.top = `${Math.max(8, Math.min(y, window.innerHeight - r.height - 8))}px`;
  menu.querySelector<HTMLButtonElement>('.ctx-item:not([disabled])')?.focus();
}

function closeTabs(ids: string[]): void {
  for (const id of ids) closeTab(id, true);
  if (!tabs.has(activeId) && !FIXED_VIEWS.includes(activeId)) activate('home');
  else renderTabBar();
}

function showTabMenu(t: Tab, x: number, y: number): void {
  const ids = [...tabs.keys()];
  const idx = ids.indexOf(t.id);
  const muted = t.ready && t.wv.isAudioMuted();
  showMenu(x, y, [
    { label: 'Neu laden', icon: 'refresh', hint: 'Strg+R', onClick: () => reloadTab(t) },
    ...(t.kind === 'stream' ? [{
      label: singleAudio() && t.id !== audioTabId ? 'Ton hierher holen' : muted ? 'Ton einschalten' : 'Stumm schalten',
      icon: (muted ? 'volume' : 'mute') as keyof typeof ICONS, hint: 'Strg+M', onClick: () => toggleMute(t),
    }] : []),
    { label: 'Im Browser öffnen', icon: 'external', onClick: () => openTabExternal(t) },
    ...(t.kind === 'stream' && t.login && channelByLogin(t.login)
      ? [{ label: isStarred(t.login) ? 'Aus den Favoriten entfernen' : 'Zu den Favoriten', icon: 'star' as keyof typeof ICONS, hint: 'Strg+D', onClick: () => toggleStar(t.login!) }]
      : []),
    ...(t.rec || canRecord(t)
      ? [{ label: t.rec ? 'Aufnahme beenden' : 'Aufnahme starten', icon: 'record' as keyof typeof ICONS, hint: 'Strg+Umschalt+R', onClick: () => void toggleRecording(t) }]
      : []),
    { sep: true },
    { label: 'Nach ganz links', icon: 'left', disabled: idx === 0, onClick: () => moveTab(t.id, ids[0], true) },
    { label: 'Nach ganz rechts', icon: 'right', disabled: idx === ids.length - 1, onClick: () => moveTab(t.id, ids[ids.length - 1], false) },
    { sep: true },
    { label: 'Tab schließen', icon: 'close', hint: 'Strg+W', onClick: () => closeTab(t.id) },
    { label: 'Andere Tabs schließen', disabled: ids.length < 2, onClick: () => closeTabs(ids.filter((id) => id !== t.id)) },
    { label: 'Tabs rechts davon schließen', disabled: idx === ids.length - 1, onClick: () => closeTabs(ids.slice(idx + 1)) },
    { label: 'Offline-Streams schließen', disabled: !ids.some((id) => isOfflineTab(id)), onClick: () => closeTabs(ids.filter(isOfflineTab)) },
    { label: 'Alle Tabs schließen', danger: true, onClick: () => closeTabs(ids) },
  ]);
}

function isOfflineTab(id: string): boolean {
  const t = tabs.get(id);
  return !!t && t.kind === 'stream' && !!t.login && channelByLogin(t.login)?.status?.live === false;
}

// ---------- Liste aller Tabs ----------

let tabListOpen = false;
let tabListSel = 0;

function toggleTabList(force?: boolean): void {
  tabListOpen = force ?? !tabListOpen;
  if (tabListOpen && notifOpen) toggleNotifs(false);
  const panel = document.getElementById('tab-list')!;
  panel.hidden = !tabListOpen;
  const sub = document.getElementById('subbar')!;
  panel.style.top = `${document.getElementById('tabbar')!.offsetHeight + (sub.hidden ? 0 : sub.offsetHeight) + 4}px`;
  if (tabListOpen) {
    const input = panel.querySelector<HTMLInputElement>('input')!;
    input.value = '';
    tabListSel = Math.max(0, tabSequence().indexOf(activeId));
    renderTabList();
    input.focus();
  }
  document.getElementById('tabs-list-btn')?.classList.toggle('on-accent', tabListOpen);
}

function tabListEntries(): { id: string; label: string; t: Tab | null }[] {
  const q = (document.querySelector<HTMLInputElement>('#tab-list input')?.value ?? '').trim().toLowerCase();
  const all = [
    { id: 'home', label: 'Übersicht', t: null },
    { id: 'giveaways', label: 'Giveaways', t: null },
    ...[...tabs.values()].map((t) => ({ id: t.id, label: tabLabel(t), t })),
  ];
  return q ? all.filter((e) => e.label.toLowerCase().includes(q) || (e.t?.login ?? '').includes(q)) : all;
}

function renderTabList(): void {
  const list = document.getElementById('tab-list-items')!;
  const entries = tabListEntries();
  tabListSel = Math.min(Math.max(0, tabListSel), Math.max(0, entries.length - 1));
  list.replaceChildren(...entries.map((e, i) => {
    const t = e.t;
    const ch = t?.login ? channelByLogin(t.login) : undefined;
    const live = !!ch?.status?.live;
    const row = h('div', {
      class: `tl-row${e.id === activeId ? ' current' : ''}${i === tabListSel ? ' sel' : ''}`, role: 'option', 'aria-selected': String(i === tabListSel),
      onclick: () => { activate(e.id); toggleTabList(false); },
    },
      !t ? icon(e.id === 'home' ? 'home' : 'gift')
        : t.mode === 'mod' ? h('span', { class: 'tab-mode' }, icon('shield'))
          : t.mode === 'manager' ? h('span', { class: 'tab-mode' }, icon('dashboard'))
            : ch ? avatar(ch, 'xs') : icon('user'),
      h('span', { class: 'tl-label', text: e.label }),
      t && t.mode !== 'viewer' ? h('span', { class: 'muted tl-sub', text: MODE_LABEL[t.mode] }) : null,
      t?.rec ? h('span', { class: 'rec-badge', title: 'Aufnahme läuft' }, 'REC') : null,
      live ? h('span', { class: t?.playing === false ? 'tl-paused' : 'live-dot', title: t?.playing === false ? 'pausiert' : 'live' }) : null,
      t && isAudible(t) && singleAudio() ? h('span', { class: 'tl-audio', title: 'Ton kommt aus diesem Tab' }, icon('volume')) : null,
      t && t.ready && t.wv.isAudioMuted() && (!singleAudio() || t.id === audioTabId) ? h('span', { class: 'tl-muted', title: 'stumm' }, icon('mute')) : null,
      i < 9 ? h('kbd', { text: `Strg+${tabSequence().indexOf(e.id) + 1}` }) : null,
      t ? iconButton('close', 'Schließen', (ev) => { ev.stopPropagation(); closeTab(t.id); }, 'tl-close') : null,
    );
    row.addEventListener('mousemove', () => {
      if (tabListSel === i) return;
      tabListSel = i;
      list.querySelectorAll('.tl-row').forEach((r, j) => r.classList.toggle('sel', j === i));
    });
    return row;
  }));
  // Strg+Zahl nur anzeigen, wo es gilt (1–9)
  list.querySelectorAll('kbd').forEach((k) => { if (Number(k.textContent!.replace('Strg+', '')) > 9) k.remove(); });
  if (!entries.length) list.append(h('p', { class: 'muted tl-empty', text: 'Kein Tab passt zur Suche.' }));
  list.querySelector('.tl-row.sel')?.scrollIntoView({ block: 'nearest' });
  const closeAll = document.getElementById('tab-list-closeall') as HTMLButtonElement;
  closeAll.disabled = !tabs.size;
}

function setupTabList(): void {
  const panel = document.getElementById('tab-list')!;
  const input = panel.querySelector<HTMLInputElement>('input')!;
  input.addEventListener('input', () => { tabListSel = 0; renderTabList(); });
  input.addEventListener('keydown', (e) => {
    const entries = tabListEntries();
    if (e.key === 'ArrowDown') { e.preventDefault(); tabListSel = (tabListSel + 1) % Math.max(1, entries.length); renderTabList(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); tabListSel = (tabListSel - 1 + entries.length) % Math.max(1, entries.length); renderTabList(); }
    else if (e.key === 'Enter') { e.preventDefault(); const sel = entries[tabListSel]; if (sel) { activate(sel.id); toggleTabList(false); } }
    else if (e.key === 'Escape') { e.preventDefault(); toggleTabList(false); }
    else if (e.key === 'Delete' && !input.value) {
      const sel = entries[tabListSel];
      if (sel?.t) { e.preventDefault(); closeTab(sel.t.id); }
    }
  });
  document.getElementById('tab-list-closeall')!.addEventListener('click', () => {
    closeTabs([...tabs.keys()]);
    toggleTabList(false);
  });
  // Klick außerhalb schließt Liste und Menü
  document.addEventListener('mousedown', (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('#ctx-menu')) closeMenu();
    if (tabListOpen && !target.closest('#tab-list') && !target.closest('#tabs-list-btn')) toggleTabList(false);
  });
  // Klick in Player/Chat (eigene Webviews) kommt hier nicht an – dafür verliert das Fenster den Fokus
  window.addEventListener('blur', () => {
    closeMenu();
    setTimeout(() => {
      if (tabListOpen && !document.querySelector('#tab-list')?.contains(document.activeElement)) toggleTabList(false);
    }, 0);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeMenu(); if (tabListOpen) toggleTabList(false); }
  });
}

// ---------- Favoriten ----------

function starred(): string[] {
  return state?.starred ?? [];
}

function isStarred(login: string): boolean {
  return starred().includes(login);
}

function setStarred(list: string[]): void {
  if (state) state.starred = list;
  renderFavBar();
  renderSidebar();
  void api.setStarred(list);
}

function toggleStar(login: string): void {
  const list = starred();
  if (list.includes(login)) {
    setStarred(list.filter((l) => l !== login));
    toast(`${nameOf(login)} ist kein Favorit mehr.`);
  } else {
    setStarred([...list, login]);
    toast(`${nameOf(login)} ist jetzt Favorit – Alt+${Math.min(list.length + 1, 9)}${list.length >= 9 ? ' (bzw. Alt+←/→)' : ''}.`);
  }
}

function moveStar(login: string, to: number): void {
  const list = starred().filter((l) => l !== login);
  list.splice(Math.max(0, Math.min(to, list.length)), 0, login);
  setStarred(list);
}

/** Durchschalten nur zwischen Favoriten, die live sind oder schon offen. */
function cycleFavorites(dir: 1 | -1): void {
  const list = starred().filter((l) => channelByLogin(l)?.status?.live || tabs.has(`stream:${l}`));
  if (!list.length) {
    toast(starred().length ? 'Gerade ist keiner deiner Favoriten live.' : 'Noch keine Favoriten – Stern am Kanal klicken oder Strg+D im Stream.');
    return;
  }
  const cur = tabs.get(activeId)?.login ?? null;
  const idx = cur ? list.indexOf(cur) : -1;
  const next = idx < 0 ? (dir === 1 ? 0 : list.length - 1) : (idx + dir + list.length) % list.length;
  openStream(list[next], { auto: false, muted: false, focus: true });
}

let favScroll = 0;

function renderFavBar(): void {
  const bar = document.getElementById('favbar');
  if (!bar || !state) return;
  const list = starred();
  const show = state.settings.showFavBar && list.length > 0;
  const old = bar.querySelector<HTMLElement>('.fav-scroll');
  if (old) favScroll = old.scrollLeft;
  const sub = document.getElementById('subbar')!;
  const updateSub = () => { sub.hidden = !show && !document.getElementById('tab-tools-zone')!.childElementCount; };
  if (!show) {
    bar.replaceChildren();
    updateSub();
    return;
  }
  const scroller = h('div', { class: 'fav-scroll' });
  list.forEach((login, i) => {
    const c = channelByLogin(login);
    if (!c) return;
    const s = c.status;
    const open = tabs.has(`stream:${login}`);
    const active = activeId === `stream:${login}`;
    const chip = h('button', {
      type: 'button',
      class: `fav-chip${s?.live ? ' live' : ' offline'}${open ? ' open' : ''}${active ? ' active' : ''}`,
      draggable: 'true',
      title: `${displayName(c)} – ${s?.live ? `live${s.viewers != null ? ` · ${fmtViewers(s.viewers)} Zuschauer` : ''}${s.game ? ` · ${s.game}` : ''}` : 'offline'}${i < 9 ? ` · Alt+${i + 1}` : ''}`,
    },
      i < 9 ? h('kbd', { class: 'fav-key', text: String(i + 1) }) : null,
      avatar(c, 'xs'),
      h('span', { class: 'fav-name', text: displayName(c) }),
      s?.live ? h('span', { class: 'live-dot' }) : null,
    );
    chip.addEventListener('click', () => openStream(login, { auto: false, muted: false, focus: true }));
    chip.addEventListener('auxclick', (e) => {
      if ((e as MouseEvent).button === 1 && open) closeTab(`stream:${login}`);
    });
    chip.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showMenu(e.clientX, e.clientY, [
        { label: open ? 'Zum Tab wechseln' : 'Öffnen', icon: 'right', onClick: () => openStream(login, { auto: false, muted: false, focus: true }) },
        { sep: true },
        { label: 'Nach links', icon: 'left', disabled: i === 0, onClick: () => moveStar(login, i - 1) },
        { label: 'Nach rechts', icon: 'right', disabled: i === list.length - 1, onClick: () => moveStar(login, i + 1) },
        { sep: true },
        ...(open ? [{ label: 'Tab schließen', icon: 'close' as keyof typeof ICONS, onClick: () => closeTab(`stream:${login}`) }] : []),
        { label: 'Aus den Favoriten entfernen', icon: 'star', danger: true, onClick: () => toggleStar(login) },
      ]);
    });
    // Umsortieren per Ziehen
    chip.addEventListener('dragstart', (e) => {
      e.dataTransfer?.setData('text/kw-fav', login);
      chip.classList.add('dragging');
    });
    chip.addEventListener('dragend', () => {
      chip.classList.remove('dragging');
      bar.querySelectorAll('.drop-before, .drop-after').forEach((x) => x.classList.remove('drop-before', 'drop-after'));
    });
    chip.addEventListener('dragover', (e) => {
      if (!e.dataTransfer?.types.includes('text/kw-fav')) return;
      e.preventDefault();
      const r = chip.getBoundingClientRect();
      const before = e.clientX < r.left + r.width / 2;
      chip.classList.toggle('drop-before', before);
      chip.classList.toggle('drop-after', !before);
    });
    chip.addEventListener('dragleave', () => chip.classList.remove('drop-before', 'drop-after'));
    chip.addEventListener('drop', (e) => {
      e.preventDefault();
      const from = e.dataTransfer?.getData('text/kw-fav');
      const before = chip.classList.contains('drop-before');
      chip.classList.remove('drop-before', 'drop-after');
      if (!from || from === login) return;
      const without = list.filter((l) => l !== from);
      const at = without.indexOf(login) + (before ? 0 : 1);
      without.splice(at, 0, from);
      setStarred(without);
    });
    scroller.append(chip);
  });
  scroller.addEventListener('wheel', (e) => {
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (!d) return;
    e.preventDefault();
    scroller.scrollLeft += d;
  }, { passive: false });
  const liveCount = list.filter((l) => channelByLogin(l)?.status?.live).length;
  bar.replaceChildren(
    h('span', { class: 'fav-label', title: 'Favoriten: Alt+1–9 springt direkt hin, Alt+←/→ schaltet zwischen den Favoriten durch, die live oder offen sind. Strg+D: aktiven Stream zum Favoriten machen.' },
      icon('star'), h('span', { text: liveCount ? `${liveCount}/${list.length} live` : 'Favoriten' })),
    scroller,
  );
  scroller.scrollLeft = favScroll;
  updateSub();
  bar.querySelector('.fav-chip.active')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

// ---------- Raids ----------

interface RaidInfo {
  source: string;
  target: string;
  /** Nur aus einer Chat-Ansage geschlossen, nicht aus Twitchs Raid-Banner */
  guessed: boolean;
  text: string;
  /** Twitchs Banner hat einen „Beitreten“- bzw. „Verlassen“-Knopf */
  join: boolean;
  leave: boolean;
  /** Aus Twitchs Abschluss-Zeile im Chat („… hat … geraidet“) – der Raid ist schon durch */
  done?: boolean;
  /** Anzeigename des Ziels, falls er vom Login abweicht */
  name?: string;
}

const RAID_SHOW_MS = 3 * 60_000;
/** Schon gezeigte Raids (Quelle>Ziel) – nicht doppelt melden */
const raidSeen = new Map<string, number>();
let raidScan = false;

/** Sucht in Twitchs Chat das Raid-Banner („X raidet Y …“) und liest Ziel und Knöpfe aus. */
const RAID_JS = `(() => {
  const norm = (s) => (s || '').replace(/\\s+/g, ' ').trim();
  const log = document.querySelector('[data-test-selector="chat-scrollable-area__message-container"], .chat-scrollable-area__message-container, [role="log"]');
  const word = /\\braid(?:et|en|est|ing|s)?\\b/i;
  const incoming = /\\b(raided|geraidet|danke|thanks|willkommen|welcome|from|von)\\b/i;
  const hits = [];
  for (const el of document.querySelectorAll('div, section, aside, p')) {
    if (log && log.contains(el)) continue;
    const t = norm(el.textContent);
    if (t.length < 6 || t.length > 240 || !word.test(t) || incoming.test(t)) continue;
    if (!el.getClientRects().length) continue;
    hits.push(el);
  }
  if (!hits.length) return null;
  hits.sort((a, b) => norm(b.textContent).length - norm(a.textContent).length);
  for (const box of hits) {
    const text = norm(box.textContent);
    const btns = Array.from(box.querySelectorAll('button, [role="button"]'));
    const label = (b) => (b.textContent || '') + ' ' + (b.getAttribute('aria-label') || '');
    const join = btns.some((b) => /beitreten|join|mitmachen|teilnehmen|jetzt raiden|raid now/i.test(label(b)));
    const leave = btns.some((b) => /verlassen|leave|abbrechen|cancel|nicht/i.test(label(b)));
    const countdown = /\\b\\d{1,2}:\\d{2}\\b|\\b\\d{1,3}\\s*(?:s|sek|sec)/i.test(text);
    let target = null;
    let shownName = null;
    for (const a of box.querySelectorAll('a[href]')) {
      const href = a.getAttribute('href') || '';
      const m = href.match(/^\\/([A-Za-z0-9_]{3,25})(?:[/?#]|$)/) || href.match(/twitch\\.tv\\/([A-Za-z0-9_]{3,25})(?:[/?#]|$)/);
      if (m && !/^(popout|moderator|directory|settings|videos|search|subs|wallet|drops)$/i.test(m[1])) {
        target = m[1];
        shownName = norm(a.textContent) || m[1];
        break;
      }
    }
    if (!target) {
      const m = text.match(/(?:raidet|raiding|raids|raiden)\\s+(?:jetzt\\s+)?(?:zu\\s+|to\\s+|bei\\s+)?@?([A-Za-z0-9_]{3,25})/i) || text.match(/raid\\s+(?:zu|to|auf|bei)\\s+@?([A-Za-z0-9_]{3,25})/i);
      if (m) target = m[1];
    }
    // Nur echte Banner: Ziel gefunden und Knopf oder Countdown dabei (sonst z. B. „Raid-Abend“ im Titel)
    if (target && (join || leave || countdown)) {
      // Für die Karte: Banner-Text ohne die Knopf-Beschriftungen
      const copy = box.cloneNode(true);
      copy.querySelectorAll('button, [role="button"]').forEach((b) => b.remove());
      return { target, name: shownName || target, text: norm(copy.textContent).slice(0, 200), join, leave };
    }
  }
  return null;
})()`;

/**
 * Läuft im Twitch-Chat: sucht Twitchs Abschluss-Zeile eines Raids im Chatverlauf –
 * nur Systemzeilen ohne Absender, damit Zuschauer-Nachrichten wie „Raid zu X lol“ nichts auslösen.
 * Wird per toString() in die Seite geschickt, darf also nichts von außen benutzen.
 */
function raidDoneScan(source: string, display: string): { target: string; name: string; text: string } | null {
  const norm = (x: string | null) => (x || '').replace(/\s+/g, ' ').trim();
  const log = document.querySelector('[data-test-selector="chat-scrollable-area__message-container"], .chat-scrollable-area__message-container, [role="log"]');
  if (!log) return null;
  const userSel = '[data-a-target="chat-message-username"], .chat-author__display-name, .chat-line__username, [data-a-user]';
  const msgSel = '.chat-line__message, [data-a-target="chat-line-message"]';
  const NAME = '@?([A-Za-z0-9_]{3,25})';
  const isSrc = (n: string) => n.toLowerCase() === source.toLowerCase() || n.toLowerCase() === display.toLowerCase();
  const noise = /^(mit|with|a|euch|you|jetzt|now|the|den|die|das|einem|einer)$/i;
  const lines = Array.from(log.querySelectorAll('div, p, span')).filter((el) => {
    const t = norm(el.textContent);
    if (t.length < 8 || t.length > 220 || !/raid|weitergeleitet|redirect/i.test(t)) return false;
    if (el.querySelector(userSel) || el.closest(userSel) || el.closest(msgSel)) return false;
    // nur die innerste Zeile mit dem Text
    return !Array.from(el.children).some((c) => /raid|weitergeleitet|redirect/i.test(c.textContent || '') && norm(c.textContent).length >= 8);
  });
  for (const el of lines.reverse()) {
    const t = norm(el.textContent);
    let target: string | null = null;
    let m: RegExpMatchArray | null;
    if ((m = t.match(new RegExp('^' + NAME + '\\s+(?:hat|has)\\s+(?:raided\\s+)?' + NAME, 'i'))) && /geraidet|raided/i.test(t) && isSrc(m[1])) target = m[2];
    else if ((m = t.match(new RegExp(NAME + '\\s+raided\\s+' + NAME, 'i'))) && isSrc(m[1])) target = m[2];
    else if ((m = t.match(new RegExp('^' + NAME + '\\s+(?:raidet|is\\s+raiding)\\s+(?:jetzt\\s+)?' + NAME, 'i'))) && isSrc(m[1]) && !noise.test(m[2])) target = m[2];
    else if ((m = t.match(new RegExp('(?:raid\\s+(?:zu|to|nach|auf|bei)|now\\s+raiding|raiding|raidet\\s+jetzt|(?:zu|nach)(?=\\s+@?[A-Za-z0-9_]{3,25}\\s+weitergeleitet)|redirect(?:ing|ed)?\\s+to)\\s+' + NAME, 'i')))
      && /zuschauer|viewers|weitergeleitet|redirect|abgeschlossen|complete|erfolgreich|successful/i.test(t)) target = m[1];
    if (target && !isSrc(target) && !noise.test(target)) {
      // Steht der Name als Link da, gilt der Kanal aus dem Link (Anzeigename kann vom Login abweichen)
      let login = target;
      for (const a of Array.from(el.querySelectorAll('a[href]'))) {
        const hm = (a.getAttribute('href') || '').match(/(?:^|twitch\.tv)\/([A-Za-z0-9_]{3,25})(?:[/?#]|$)/);
        if (hm && norm(a.textContent).toLowerCase() === target.toLowerCase()) login = hm[1];
      }
      return { target: login, name: target, text: t.slice(0, 200) };
    }
  }
  return null;
}

/** Klickt im Raid-Banner „Beitreten“ bzw. „Verlassen“. */
function raidClickJs(kind: 'join' | 'leave'): string {
  const re = kind === 'join' ? '/beitreten|join|mitmachen|teilnehmen|jetzt raiden|raid now/i' : '/verlassen|leave|abbrechen|cancel/i';
  return `(() => {
    const log = document.querySelector('[data-test-selector="chat-scrollable-area__message-container"], .chat-scrollable-area__message-container, [role="log"]');
    const b = Array.from(document.querySelectorAll('button, [role="button"]')).find((x) => !(log && log.contains(x)) && ${re}.test((x.textContent || '') + ' ' + (x.getAttribute('aria-label') || '')));
    if (b) { b.click(); return true; }
    return false;
  })()`;
}

async function watchRaids(): Promise<void> {
  if (raidScan || !state?.settings.raidPrompt) return;
  raidScan = true;
  try {
    for (const t of tabs.values()) {
      if (t.kind !== 'stream' || !t.login || t.mode !== 'viewer') continue;
      const target = t.chat ?? t.wv;
      if (!(t.chat ? t.chatReady : t.ready)) continue;
      try {
        const r = (await target.executeJavaScript(RAID_JS)) as { target: string; name: string; text: string; join: boolean; leave: boolean } | null;
        if (r && r.target.toLowerCase() !== t.login) {
          showRaid({ source: t.login, target: r.target, name: r.name, guessed: false, text: r.text, join: r.join, leave: r.leave });
          continue;
        }
        // Kein Banner (mehr)? Dann nach Twitchs Abschluss-Zeile im Chatverlauf schauen
        const d = (await target.executeJavaScript(`(${raidDoneScan.toString()})(${JSON.stringify(t.login)}, ${JSON.stringify(nameOf(t.login))})`)) as { target: string; name: string; text: string } | null;
        if (d && d.target.toLowerCase() !== t.login) showRaid({ source: t.login, target: d.target, name: d.name, guessed: false, done: true, text: d.text, join: false, leave: false });
      } catch {
        // Seite lädt gerade
      }
    }
  } finally {
    raidScan = false;
  }
}

function showRaid(r: RaidInfo): void {
  if (!state?.settings.raidPrompt) return;
  const key = `${r.source}>${r.target.toLowerCase()}`;
  const seen = raidSeen.get(key);
  if (seen && Date.now() - seen < 30 * 60_000) {
    // Schon gezeigt – nur Knöpfe aus dem Banner nachtragen, falls die Karte noch steht
    const card = document.querySelector<HTMLElement>(`.raid-card[data-key="${CSS.escape(key)}"]`);
    if (card && !r.guessed) card.dataset.banner = '1';
    return;
  }
  raidSeen.set(key, Date.now());
  const fromName = nameOf(r.source);
  const targetName = channelByLogin(r.target.toLowerCase()) ? nameOf(r.target.toLowerCase()) : r.name || r.target;
  const ch = channelByLogin(r.source);
  const stack = document.getElementById('raid-stack')!;

  let timer = 0;
  let left = RAID_SHOW_MS;
  let last = Date.now();
  const bar = h('span', { class: 'raid-bar' });
  const close = () => {
    clearInterval(timer);
    card.classList.add('leaving');
    setTimeout(() => card.remove(), 220);
  };
  const joinRaid = () => {
    close();
    const src = tabs.get(`stream:${r.source}`);
    // Twitch Bescheid geben (Banner-Knopf), dann zum Ziel wechseln und die Quelle schließen
    if (src && (src.chat ? src.chatReady : src.ready) && (card.dataset.banner === '1' || r.join)) {
      void (src.chat ?? src.wv).executeJavaScript(raidClickJs('join')).catch(() => {});
    }
    openStream(r.target.toLowerCase(), { auto: false, muted: false, focus: true });
    if (src) setTimeout(() => closeTab(src.id), 1500);
    toast(`Du raidest mit zu ${targetName}.`);
  };
  const declineRaid = () => {
    close();
    const src = tabs.get(`stream:${r.source}`);
    if (src && (src.chat ? src.chatReady : src.ready) && (card.dataset.banner === '1' || r.leave)) {
      void (src.chat ?? src.wv).executeJavaScript(raidClickJs('leave')).catch(() => {});
    }
  };

  const card: HTMLElement = h('article', { class: `raid-card${r.guessed ? ' guessed' : ''}`, 'data-key': key, role: 'alertdialog', 'aria-label': `${fromName} raidet ${r.target}` },
    h('header', { class: 'raid-head' },
      icon('sword'),
      h('span', { class: 'raid-kicker', text: r.guessed ? 'Raid (vermutlich)' : r.done ? 'Raid abgeschlossen' : 'Raid' }),
      iconButton('close', 'Ausblenden', () => close(), 'raid-x')),
    h('div', { class: 'raid-main' },
      ch ? avatar(ch) : h('span', { class: 'avatar md placeholder', text: r.source[0].toUpperCase() }),
      h('p', { class: 'raid-line' },
        h('strong', { text: fromName }), r.done ? ' hat ' : ' raidet ', h('strong', { class: 'raid-target', text: targetName }), r.done ? ' geraidet' : null)),
    r.text ? h('p', { class: 'raid-text', text: r.text }) : null,
    r.guessed ? h('p', { class: 'raid-hint', text: 'Aus der Ansage im Chat geschlossen – der Stream ist gerade zu Ende gegangen.' }) : null,
    h('div', { class: 'raid-actions' },
      h('button', { type: 'button', class: 'btn', text: 'Nicht mitraiden', onclick: declineRaid }),
      h('button', { type: 'button', class: 'btn primary raid-go', onclick: joinRaid }, icon('sword'), h('span', { text: 'Mitraiden' }))),
    bar,
  );
  if (!r.guessed) card.dataset.banner = '1';

  // 3 Minuten stehen lassen; beim Drüberfahren anhalten
  let paused = false;
  card.addEventListener('mouseenter', () => { paused = true; });
  card.addEventListener('mouseleave', () => { paused = false; last = Date.now(); });
  timer = window.setInterval(() => {
    const now = Date.now();
    if (!paused) left -= now - last;
    last = now;
    bar.style.width = `${Math.max(0, (left / RAID_SHOW_MS) * 100)}%`;
    if (left <= 0) close();
  }, 250);

  stack.append(card);
  void api.raidNotify(r.source, r.target);
}

// ---------- Tastenkürzel ----------

const closedTabs: { login: string; mode: ViewMode; index: number }[] = [];

function handleShortcut(name: string): void {
  const seq = tabSequence();
  const cur = Math.max(0, seq.indexOf(activeId));
  const active = tabs.get(activeId);
  if (name === 'notifs') { toggleNotifs(true); return; }
  if (name === 'notifs-toggle') { if (state?.auth.loggedIn && state.settings.twitchNotifs) toggleNotifs(); return; }
  if (name === 'next') activate(seq[(cur + 1) % seq.length]);
  else if (name === 'prev') activate(seq[(cur - 1 + seq.length) % seq.length]);
  else if (name.startsWith('go')) {
    const n = Number(name.slice(2));
    activate(n === 9 ? seq[seq.length - 1] : seq[n - 1] ?? seq[seq.length - 1]);
  } else if (name === 'close') {
    if (active) closeTab(active.id);
  } else if (name === 'reopen') {
    const last = closedTabs.pop();
    if (last) {
      openStream(last.login, { auto: false, muted: false, focus: true, mode: last.mode });
      // an die alte Stelle zurück
      const ids = [...tabs.keys()];
      const id = `stream:${last.login}`;
      if (last.index < ids.length - 1 && ids[last.index] !== id) moveTab(id, ids[last.index], true);
    }
    else toast('Kein geschlossener Tab zum Wiederherstellen.');
  } else if (name === 'mute') {
    if (active) toggleMute(active);
  } else if (name === 'reload') {
    if (active) reloadTab(active);
  } else if (name === 'tablist') {
    toggleTabList();
  } else if (name === 'favnext' || name === 'favprev') {
    cycleFavorites(name === 'favnext' ? 1 : -1);
  } else if (/^fav[1-9]$/.test(name)) {
    const login = starred()[Number(name.slice(3)) - 1];
    if (login) openStream(login, { auto: false, muted: false, focus: true });
    else toast(`Es gibt keinen Favoriten Nr. ${name.slice(3)}.`);
  } else if (name === 'star') {
    if (active?.kind === 'stream' && active.login && channelByLogin(active.login)) toggleStar(active.login);
    else toast('Favorit wird man über den Stern am Kanal oder mit Strg+D in einem Stream-Tab.');
  } else if (name === 'record') {
    if (active && (active.rec || canRecord(active))) void toggleRecording(active);
    else toast('Aufnehmen geht nur in Stream-Tabs von Kanälen, in denen du Mod bist.');
  }
}

// ---------- Seitenleiste ----------

function channelRow(c: ChannelView, opts: { own: boolean; index?: number; count?: number }): HTMLElement {
  const s = c.status;
  const open = tabs.has(`stream:${c.login}`);
  const sub = !s
    ? 'Wird geprüft …'
    : !s.exists
      ? 'Kanal nicht gefunden'
      : s.live
        ? s.game || 'Live'
        : 'Offline';

  const row = h('div', {
    class: `channel${s?.live ? ' is-live' : ''}${open && activeId === `stream:${c.login}` ? ' is-active' : ''}${s && !s.exists ? ' is-missing' : ''}`,
    title: s?.live && s.title ? s.title : displayName(c),
  },
    h('div', { class: 'avatar-wrap' },
      avatar(c),
      s?.live ? h('span', { class: 'live-ring' }) : null,
      hasOpenGiveaway(c.login)
        ? h('button', { class: 'gift-flag', type: 'button', title: 'Giveaway läuft – anzeigen', onclick: (e: MouseEvent) => { e.stopPropagation(); activate('giveaways'); } }, icon('gift'))
        : null),
    h('div', { class: 'channel-text' },
      h('span', { class: 'channel-name' },
        h('span', { class: 'cn-text', text: displayName(c) }),
        isStarred(c.login) ? h('span', { class: 'cn-star', title: 'Favorit' }, icon('star')) : null),
      h('span', { class: 'channel-sub' },
        isMod(c.login) ? h('span', { class: 'mod-badge', title: 'Du bist hier Moderator' }, icon('shield'), 'Mod') : null,
        isMod(c.login) ? ' · ' : null,
        sub),
    ),
    h('span', { class: 'channel-flags' },
      c.notify ? h('span', { class: 'flag', title: 'Benachrichtigung an' }, icon('bell')) : null,
      c.autoOpen ? h('span', { class: 'flag', title: 'Schaut automatisch zu, wenn live' }, icon('eye')) : null,
      isMod(c.login) && c.openAsMod ? h('span', { class: 'flag mod', title: 'Öffnet gleich die Mod-Ansicht' }, icon('shield')) : null),
    s?.live ? h('span', { class: 'viewers', text: fmtViewers(s.viewers) }) : null,
    h('div', { class: 'channel-actions' },
      iconButton('bell', c.notify ? 'Benachrichtigung aus' : 'Benachrichtigen, wenn live', (e) => {
        e.stopPropagation();
        void api.updateChannel(c.login, { notify: !c.notify });
      }, c.notify ? 'on' : 'off'),
      iconButton('star', isStarred(c.login) ? 'Aus den Favoriten entfernen' : 'Zu den Favoriten (Favoritenleiste, Alt+←/→)', (e) => {
        e.stopPropagation();
        toggleStar(c.login);
      }, isStarred(c.login) ? 'star-on hover-only' : 'off hover-only'),
      iconButton('eye', c.autoOpen ? 'Nicht mehr automatisch zuschauen' : 'Automatisch zuschauen, wenn live', (e) => {
        e.stopPropagation();
        void api.updateChannel(c.login, { autoOpen: !c.autoOpen });
      }, c.autoOpen ? 'on' : 'off'),
      isMod(c.login)
        ? iconButton('shield', c.openAsMod ? 'Beim Live-Gehen normal öffnen' : 'Beim Live-Gehen gleich die Mod-Ansicht öffnen', (e) => {
            e.stopPropagation();
            void api.updateChannel(c.login, { openAsMod: !c.openAsMod });
          }, c.openAsMod ? 'on mod' : 'off hover-only')
        : null,
      !opts.own && opts.index! > 0
        ? iconButton('up', 'Nach oben', (e) => { e.stopPropagation(); void api.moveChannel(c.login, -1); }, 'hover-only')
        : null,
      !opts.own && opts.index! < opts.count! - 1
        ? iconButton('down', 'Nach unten', (e) => { e.stopPropagation(); void api.moveChannel(c.login, 1); }, 'hover-only')
        : null,
      !opts.own
        ? iconButton('trash', 'Entfernen', (e) => {
            e.stopPropagation();
            if (confirm(`${displayName(c)} aus der Liste entfernen?`)) void api.removeChannel(c.login);
          }, 'hover-only danger')
        : null,
    ),
  );
  row.addEventListener('click', () => openStream(c.login, { auto: false, muted: false, focus: true }));
  return row;
}

function renderSidebar(): void {
  if (!state) return;

  // Anmeldung
  const authBox = document.getElementById('auth')!;
  authBox.replaceChildren(
    state.auth.loggedIn
      ? h('div', { class: 'auth ok' },
          h('span', { class: 'auth-dot' }),
          h('span', { text: `Angemeldet als ${state.auth.user ?? 'Twitch-Nutzer'}` }))
      : h('div', { class: 'auth warn' },
          h('span', { text: 'Nicht angemeldet – du wirst nicht als Zuschauer gezählt.' }),
          h('button', { class: 'btn primary small', type: 'button', text: 'Bei Twitch anmelden', onclick: openLogin })),
  );

  // Eigener Kanal
  const own = document.getElementById('own')!;
  if (state.own) {
    own.replaceChildren(channelRow(state.own, { own: true }));
  } else {
    const input = h('input', { placeholder: 'Dein Kanalname', spellcheck: 'false' });
    const form = h('form', { class: 'inline-form', autocomplete: 'off' }, input, h('button', { type: 'submit', text: 'Festlegen' }));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const r = await api.setOwn(input.value);
      if (!r.ok) toast(r.error ?? 'Ging nicht.');
    });
    own.replaceChildren(form);
  }

  // Lieblingskanäle: live zuerst (nach Zuschauern), dann in deiner Reihenfolge
  const favs = document.getElementById('favorites')!;
  const filterBox = document.getElementById('fav-filter') as HTMLInputElement;
  filterBox.hidden = state.favorites.length < 12;
  const q = filterBox.hidden ? '' : filterBox.value.trim().toLowerCase();
  favs.replaceChildren();
  const order = state.favorites
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => !q || c.login.includes(q) || displayName(c).toLowerCase().includes(q));
  const live = order.filter((x) => x.c.status?.live).sort((a, b) => (b.c.status!.viewers ?? 0) - (a.c.status!.viewers ?? 0));
  const offline = order.filter((x) => !x.c.status?.live);
  for (const { c, i } of live) favs.append(channelRow(c, { own: false, index: i, count: state.favorites.length }));
  // Bei vielen Kanälen lassen sich die Offline-Kanäle einklappen
  const collapsible = state.favorites.length >= 8 && offline.length > 0 && !q;
  if (collapsible) {
    favs.append(h('button', {
      type: 'button', class: `group-toggle${offlineCollapsed ? ' collapsed' : ''}`, 'aria-expanded': String(!offlineCollapsed),
      onclick: () => {
        offlineCollapsed = !offlineCollapsed;
        try { localStorage.setItem('kw.offlineCollapsed', offlineCollapsed ? '1' : '0'); } catch { /* egal */ }
        renderSidebar();
      },
    }, icon('down'), h('span', { text: `Offline · ${offline.length}` })));
  }
  if (!collapsible || !offlineCollapsed) {
    for (const { c, i } of offline) favs.append(channelRow(c, { own: false, index: i, count: state.favorites.length }));
  }
  if (!state.favorites.length) favs.append(h('p', { class: 'muted small', text: 'Noch keine Kanäle. Füge unten einen hinzu oder übernimm die Kanäle, denen du folgst.' }));
  else if (q && !order.length) favs.append(h('p', { class: 'muted small', text: 'Kein Kanal passt zur Suche.' }));
  document.getElementById('btn-follows')!.hidden = !state.auth.loggedIn;
  document.getElementById('live-count')!.textContent = live.length ? `${live.length} live` : '';

  // Fußzeile
  const lc = document.getElementById('last-check')!;
  lc.classList.toggle('error', !!state.lastError);
  lc.textContent = state.checking
    ? 'Prüfe …'
    : state.lastError
      ? `Fehler: ${state.lastError}`
      : state.lastCheck
        ? `Geprüft ${new Date(state.lastCheck).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`
        : '';
  lc.title = state.lastError ?? '';
}

// ---------- Übersicht ----------

function renderHome(): void {
  if (!state) return;
  const home = document.getElementById('view-home')!;
  const all = [...(state.own ? [state.own] : []), ...state.favorites];
  const live = all.filter((c) => c.status?.live).sort((a, b) => (b.status!.viewers ?? 0) - (a.status!.viewers ?? 0));
  const offline = all.filter((c) => !c.status?.live && c.status?.exists !== false);
  const bust = state.lastCheck ?? 0;

  const parts: Child[] = [];

  if (!state.auth.loggedIn) {
    parts.push(
      h('div', { class: 'notice' },
        h('div', {},
          h('strong', { text: 'Einmal bei Twitch anmelden' }),
          h('p', { text: 'Dann schaust du mit deinem Account zu: Du zählst als Zuschauer, kannst chatten und sammelst Kanalpunkte. Die Anmeldung bleibt gespeichert.' })),
        h('button', { class: 'btn primary', type: 'button', text: 'Anmelden', onclick: openLogin })),
    );
  }

  const gws = openGiveaways();
  if (gws.length) {
    parts.push(
      h('button', { class: 'gw-banner', type: 'button', onclick: () => activate('giveaways') },
        icon('gift'),
        h('span', { text: gws.length === 1
          ? `Giveaway bei ${nameOf(gws[0].channel)} – mit ${gws[0].entry} teilnehmen`
          : `${gws.length} offene Giveaways – jetzt ansehen` }),
        h('span', { class: 'gw-banner-go', text: 'Ansehen →' })),
    );
  }

  if (!all.length) {
    parts.push(
      h('div', { class: 'empty' },
        h('h1', { text: 'Willkommen bei Kanalwache' }),
        h('p', { text: 'Leg links deinen eigenen Kanal fest und füge deine Lieblingskanäle hinzu. Sobald einer live geht, bekommst du Bescheid – und mit dem Augen-Symbol schaust du automatisch zu.' }),
        state.auth.loggedIn
          ? h('button', { class: 'btn primary', type: 'button', text: 'Gefolgte Kanäle übernehmen', onclick: openFollowsDialog })
          : null),
    );
  } else {
    parts.push(h('h1', { class: 'home-title', text: live.length ? 'Gerade live' : 'Gerade ist niemand live' }));
    if (live.length) {
      const grid = h('div', { class: 'live-grid' });
      for (const c of live) {
        const s = c.status!;
        const thumb = h('img', { src: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${c.login}-640x360.jpg?t=${bust}`, alt: '', loading: 'lazy' });
        thumb.addEventListener('error', () => (thumb.style.visibility = 'hidden'));
        const card = h('article', { class: 'live-card', tabindex: '0' },
          h('div', { class: 'thumb' },
            thumb,
            h('span', { class: 'badge-live', text: 'LIVE' }),
            hasOpenGiveaway(c.login) ? h('span', { class: 'badge-gift', text: '🎁 Giveaway' }) : null,
            h('span', { class: 'badge-viewers', text: `${fmtViewers(s.viewers)} Zuschauer` }),
            s.startedAt ? h('span', { class: 'badge-uptime', text: fmtUptime(s.startedAt) }) : null),
          h('div', { class: 'card-body' },
            avatar(c),
            h('div', { class: 'card-text' },
              h('span', { class: 'card-title', text: s.title || 'Ohne Titel' }),
              h('span', { class: 'card-meta', text: [displayName(c), s.game].filter(Boolean).join(' · ') })),
            isMod(c.login) || isBroadcaster(c.login)
              ? h('button', {
                  class: 'card-mod', type: 'button',
                  title: isBroadcaster(c.login) ? 'Stream-Manager öffnen' : 'Mod-Ansicht öffnen',
                  onclick: (e: MouseEvent) => {
                    e.stopPropagation();
                    openStream(c.login, { auto: false, muted: false, focus: true, mode: isBroadcaster(c.login) ? 'manager' : 'mod' });
                  },
                }, icon(isBroadcaster(c.login) ? 'dashboard' : 'shield'), h('span', { text: isBroadcaster(c.login) ? 'Manager' : 'Mod' }))
              : null),
        );
        const go = () => openStream(c.login, { auto: false, muted: false, focus: true });
        card.addEventListener('click', go);
        card.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
        grid.append(card);
      }
      parts.push(grid);
    } else {
      parts.push(h('p', { class: 'muted', text: 'Kanalwache prüft im Hintergrund weiter und meldet sich, sobald jemand startet.' }));
    }

    if (offline.length) {
      parts.push(h('h2', { class: 'home-sub', text: 'Offline' }));
      const list = h('div', { class: 'offline-list' });
      const LIMIT = 30;
      for (const c of showAllOffline ? offline : offline.slice(0, LIMIT)) {
        const chip = h('button', { class: 'offline-chip', type: 'button', title: `${displayName(c)} öffnen` }, avatar(c, 'sm'), h('span', { text: displayName(c) }));
        chip.addEventListener('click', () => openStream(c.login, { auto: false, muted: false, focus: true }));
        list.append(chip);
      }
      if (offline.length > LIMIT) {
        list.append(h('button', { class: 'offline-chip more', type: 'button', text: showAllOffline ? 'Weniger anzeigen' : `Alle ${offline.length} anzeigen`, onclick: () => {
          showAllOffline = !showAllOffline;
          renderHome();
        } }));
      }
      parts.push(list);
    }
  }

  home.replaceChildren(h('div', { class: 'home-inner' }, ...parts));
}

// ---------- Giveaways ----------

function openGiveaways(): Giveaway[] {
  return state?.giveaways.filter((g) => g.state === 'open' || g.state === 'failed') ?? [];
}

function hasOpenGiveaway(login: string): boolean {
  return openGiveaways().some((g) => g.channel === login);
}

function nameOf(login: string): string {
  const c = channelByLogin(login);
  return c ? displayName(c) : login;
}

function ago(ts: number): string {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return 'gerade eben';
  const m = Math.round(s / 60);
  if (m < 60) return `vor ${m} Min.`;
  const hrs = Math.round(m / 60);
  if (hrs < 24) return `vor ${hrs} Std.`;
  const d = Math.round(hrs / 24);
  return d === 1 ? 'gestern' : d < 7 ? `vor ${d} Tagen` : new Date(ts).toLocaleDateString('de-DE');
}

// ---------- Twitch-Benachrichtigungen (Glocke) ----------

let notifOpen = false;

function toggleNotifs(force?: boolean): void {
  notifOpen = force ?? !notifOpen;
  const panel = document.getElementById('notif-panel')!;
  panel.hidden = !notifOpen;
  const sub = document.getElementById('subbar')!;
  panel.style.top = `${document.getElementById('tabbar')!.offsetHeight + (sub.hidden ? 0 : sub.offsetHeight) + 4}px`;
  if (notifOpen) {
    toggleTabList(false);
    renderNotifs();
    // Beim Öffnen gelten alle als gesehen; die Punkte bleiben bis zum Schließen sichtbar
    notifSeenBefore = state?.notifs.seenAt ?? 0;
    void api.notifsSeen();
    const n = state?.notifs;
    if (n && !n.loading && (!n.at || Date.now() - n.at > 30_000)) void api.notifsRefresh();
  }
  document.getElementById('notif-btn')?.classList.toggle('on-accent', notifOpen);
}

/** seenAt von vor dem Öffnen – damit „neu“ im offenen Fenster markiert bleibt */
let notifSeenBefore = 0;

function renderNotifs(): void {
  const n = state?.notifs;
  const status = document.getElementById('np-status')!;
  const list = document.getElementById('np-items')!;
  if (!n || !state) return;
  status.textContent = n.loading ? 'wird abgerufen …' : n.at ? `aktualisiert ${ago(n.at)}` : '';
  if (!notifOpen) return;
  if (!state.auth.loggedIn) {
    list.replaceChildren(h('p', { class: 'tl-empty muted', text: 'Melde dich bei Twitch an, um deine Benachrichtigungen zu sehen.' }));
    return;
  }
  if (!state.settings.twitchNotifs) {
    list.replaceChildren(h('p', { class: 'tl-empty muted', text: 'Abruf ist in den Einstellungen ausgeschaltet.' }));
    return;
  }
  const rows: Child[] = [];
  if (n.error) rows.push(h('p', { class: 'np-error', text: `${n.error} Über „Auf twitch.tv“ siehst du sie trotzdem.` }));
  if (!n.list.length && !n.error) rows.push(h('p', { class: 'tl-empty muted', text: n.loading ? 'Wird abgerufen …' : 'Keine Benachrichtigungen.' }));
  for (const x of n.list) {
    const isNew = !x.read && x.at != null && x.at > notifSeenBefore;
    const pic = x.thumbnail ?? (x.login ? channelByLogin(x.login)?.status?.avatar ?? null : null);
    const thumb = pic ? h('img', { class: 'np-thumb', src: pic, alt: '' }) as HTMLImageElement : h('span', { class: 'np-thumb np-thumb-empty' }, icon('bell'));
    if (thumb instanceof HTMLImageElement) thumb.addEventListener('error', () => thumb.replaceWith(h('span', { class: 'np-thumb np-thumb-empty' }, icon('bell'))));
    rows.push(h('div', {
      class: `np-row${isNew ? ' is-new' : ''}${x.url || x.login ? ' clickable' : ''}`,
      title: x.login ? `${x.login} in Kanalwache öffnen` : x.url ?? '',
      onclick: () => { if (x.url || x.login) { void api.notifsOpen(x.id); toggleNotifs(false); } },
    },
      thumb,
      h('div', { class: 'np-text' },
        h('span', { class: 'np-body', text: x.text }),
        x.at ? h('span', { class: 'np-time muted', text: ago(x.at) }) : null),
      isNew ? h('span', { class: 'np-dot', title: 'Neu' }) : null));
  }
  list.replaceChildren(...rows.filter((r): r is Node | string => !!r));
}

function setupNotifs(): void {
  document.getElementById('np-refresh')!.replaceChildren(icon('refresh'));
  document.getElementById('np-refresh')!.addEventListener('click', () => void api.notifsRefresh());
  document.getElementById('np-web')!.addEventListener('click', () => {
    toggleNotifs(false);
    void api.openExternal('https://www.twitch.tv/');
  });
  document.addEventListener('mousedown', (e) => {
    const target = e.target as HTMLElement;
    if (notifOpen && !target.closest('#notif-panel') && !target.closest('#notif-btn')) toggleNotifs(false);
  });
  window.addEventListener('blur', () => setTimeout(() => { if (notifOpen && !document.querySelector('#notif-panel')?.contains(document.activeElement)) toggleNotifs(false); }, 0));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && notifOpen) toggleNotifs(false); });
}

/** Was du in das Befehlsfeld getippt hast, bleibt beim Neuzeichnen erhalten. */
const entryEdits = new Map<string, string>();

const STATE_LABEL: Record<Giveaway['state'], string> = {
  open: 'Offen',
  sending: 'Wird gesendet …',
  joined: 'Du nimmst teil',
  failed: 'Nicht geklappt',
  ended: 'Beendet',
};

function giveawayCard(g: Giveaway): HTMLElement {
  const ch = channelByLogin(g.channel);
  const canJoin = (g.state === 'open' || g.state === 'failed') && !!state?.auth.loggedIn;
  const input = h('input', {
    class: 'gw-entry',
    value: entryEdits.get(g.id) ?? g.entry,
    spellcheck: 'false',
    'data-gw': g.id,
    disabled: !canJoin,
    title: 'Diese Nachricht wird in den Chat geschrieben',
  }) as HTMLInputElement;
  input.addEventListener('input', () => entryEdits.set(g.id, input.value));

  const join = async () => {
    const r = await api.joinGiveaway(g.id, input.value);
    if (!r.ok) toast(r.error ?? 'Teilnahme ging nicht.');
    else entryEdits.delete(g.id);
  };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && canJoin) void join(); });

  const how = g.source === 'announcement'
    ? `Angekündigt von ${g.sourceName ?? 'Moderation'}`
    : `Erkannt, weil viele ${g.entry} schreiben`;

  return h('article', { class: `gw-card state-${g.state}${g.won ? ' won' : ''}` },
    h('header', { class: 'gw-head' },
      ch ? avatar(ch) : h('span', { class: 'avatar md placeholder', text: g.channel[0].toUpperCase() }),
      h('div', { class: 'gw-title' },
        h('strong', { text: nameOf(g.channel) }),
        h('span', { class: 'muted', text: `${how} · ${ago(g.detectedAt)}` })),
      h('span', { class: `gw-state ${g.won ? 'won' : g.state}`, text: g.won ? '🏆 Gewonnen!' : g.state === 'ended' && g.winners.length ? 'Ausgelost' : STATE_LABEL[g.state] })),
    g.message ? h('blockquote', { class: 'gw-msg', text: g.message }) : null,
    g.won ? h('p', { class: 'gw-won', text: 'Dein Name wurde als Gewinner genannt. Schau schnell in den Chat – oft musst du dich innerhalb kurzer Zeit melden.' }) : null,
    g.winners.length
      ? h('div', { class: `gw-winners${g.won ? ' me' : ''}` },
          h('div', { class: 'gw-winners-head' },
            icon('trophy'),
            h('span', { class: 'gw-winners-label', text: 'Gewinner' }),
            h('span', { class: 'gw-winners-names' },
              ...g.winners.map((w) => h('span', { class: `gw-winner${state?.auth.user && w.toLowerCase() === state.auth.user.toLowerCase() ? ' is-me' : ''}`, text: w })))),
          g.winnerMessage
            ? h('p', { class: 'gw-winner-msg', title: g.winnerAt ? new Date(g.winnerAt).toLocaleTimeString('de-DE') : '' },
                h('span', { class: 'muted', text: `${g.winnerBy ?? 'Chat'}: ` }), g.winnerMessage)
            : null,
          g.joined && !g.won ? h('p', { class: 'muted gw-winner-note', text: 'Du warst dabei – diesmal hat es nicht geklappt.' }) : null)
      : g.state === 'ended' && !g.won
        ? h('p', { class: 'muted gw-no-winner', text: g.joined ? 'Beendet – du warst dabei. Gewinner wurde (noch) nicht im Chat genannt.' : 'Beendet – Gewinner wurde (noch) nicht im Chat genannt.' })
        : null,
    g.error ? h('p', { class: 'gw-error', text: g.error }) : null,
    h('div', { class: 'gw-actions' },
      g.state === 'open' || g.state === 'failed' || g.state === 'sending' ? input : null,
      g.state === 'open' || g.state === 'failed' || g.state === 'sending'
        ? h('button', {
            class: 'btn primary', type: 'button', disabled: !canJoin,
            text: g.state === 'sending' ? 'Wird gesendet …' : g.state === 'failed' ? 'Nochmal' : 'Teilnehmen',
            title: state?.auth.loggedIn ? 'Befehl jetzt mit deinem Account in den Chat schreiben' : 'Dafür bei Twitch anmelden',
            onclick: join,
          })
        : null,
      g.state === 'joined' ? h('span', { class: 'gw-sent', text: `✓ ${g.entry} gesendet` }) : null,
      h('button', { class: 'btn', type: 'button', text: 'Zum Stream', onclick: () => openStream(g.channel, { auto: false, muted: false, focus: true }) }),
      iconButton('close', 'Ausblenden', () => void api.dismissGiveaway(g.id)),
    ),
    g.participants ? h('p', { class: 'gw-foot muted', text: `${g.participants} ${g.participants === 1 ? 'Person hat' : 'Leute haben'} ${g.entry} geschrieben, seit Kanalwache mitliest` }) : null,
  );
}

function renderGiveaways(): void {
  if (!state) return;
  const view = document.getElementById('view-giveaways')!;
  // Fokus und Cursor im Befehlsfeld über das Neuzeichnen retten
  const focused = document.activeElement instanceof HTMLInputElement ? document.activeElement : null;
  const focusId = focused?.dataset.gw;
  const caret = focused?.selectionStart ?? null;

  const active = state.giveaways.filter((g) => g.state !== 'ended' || g.won);
  const ended = state.giveaways.filter((g) => g.state === 'ended' && !g.won);
  const parts: Child[] = [
    h('h1', { class: 'home-title', text: 'Giveaways' }),
    h('p', { class: 'muted lead', text: 'Kanalwache liest den Chat deiner Lieblingskanäle mit, solange sie live sind, und zeigt hier laufende Giveaways. Teilnehmen tust du selbst – mit einem Klick, unter deinem Account.' }),
    h('button', { class: 'btn small rules-open', type: 'button', onclick: openRulesDialog }, icon('edit'), h('span', { text: 'Erkennungswörter bearbeiten' })),
  ];

  if (!state.settings.giveawayHelper) {
    parts.push(h('div', { class: 'notice' },
      h('div', {}, h('strong', { text: 'Giveaway-Helfer ist aus' }), h('p', { text: 'Schalte ihn in den Einstellungen ein, damit Giveaways erkannt werden.' })),
      h('button', { class: 'btn primary', type: 'button', text: 'Einschalten', onclick: () => void api.updateSettings({ giveawayHelper: true }) })));
  } else {
    const live = state.favorites.filter((f) => f.status?.live).length;
    const status = !state.auth.loggedIn
      ? { cls: 'warn', text: 'Nicht bei Twitch angemeldet – Giveaways werden erkannt, aber Teilnehmen geht erst nach der Anmeldung.' }
      : state.chat.authProblem
        ? { cls: 'warn', text: 'Twitch nimmt den Login für den Chat nicht an. In den Einstellungen ab- und wieder anmelden.' }
        : !live
          ? { cls: 'idle', text: 'Gerade ist keiner deiner Lieblingskanäle live – sobald einer startet, liest Kanalwache mit.' }
          : state.chat.connected
            ? { cls: 'ok', text: `Liest den Chat von ${live} Live-${live === 1 ? 'Kanal' : 'Kanälen'} mit.` }
            : { cls: 'idle', text: 'Verbinde mit dem Twitch-Chat …' };
    parts.push(h('div', { class: `gw-status ${status.cls}` }, h('span', { class: 'gw-status-dot' }), h('span', { text: status.text })));
  }

  if (active.length) {
    parts.push(h('div', { class: 'gw-list' }, ...active.map(giveawayCard)));
  } else if (state.settings.giveawayHelper) {
    parts.push(h('div', { class: 'gw-empty' }, icon('gift'), h('p', { text: 'Gerade läuft kein Giveaway. Sobald eins startet, bekommst du Bescheid.' })));
  }

  if (ended.length) {
    parts.push(h('h2', { class: 'home-sub', text: 'Vorbei' }));
    parts.push(h('div', { class: 'gw-list compact' }, ...ended.map(giveawayCard)));
  }

  view.replaceChildren(h('div', { class: 'home-inner' }, ...parts));

  if (focusId) {
    const again = view.querySelector<HTMLInputElement>(`input[data-gw="${CSS.escape(focusId)}"]`);
    if (again && !again.disabled) {
      again.focus();
      if (caret != null) again.setSelectionRange(caret, caret);
    }
  }
}

// ---------- Gefolgte Kanäle ----------

let offlineCollapsed = (() => { try { return localStorage.getItem('kw.offlineCollapsed') === '1'; } catch { return false; } })();
let showAllOffline = false;
let follows: FollowedChannel[] = [];
const followPick = new Set<string>();
let followsLoading = false;
let followsError: string | null = null;

function inMyList(login: string): boolean {
  return !!state && (state.own?.login === login || state.favorites.some((f) => f.login === login));
}

function visibleFollows(): FollowedChannel[] {
  const q = (document.getElementById('follows-search') as HTMLInputElement).value.trim().toLowerCase();
  return follows.filter((f) => !q || f.login.includes(q) || f.displayName.toLowerCase().includes(q));
}

function renderFollows(): void {
  const list = document.getElementById('follows-list')!;
  const btn = document.getElementById('follows-import') as HTMLButtonElement;
  const count = document.getElementById('follows-count')!;
  if (followsLoading) {
    list.replaceChildren(h('p', { class: 'muted follows-msg', text: 'Lade die Kanäle, denen du folgst …' }));
  } else if (followsError) {
    list.replaceChildren(h('p', { class: 'gw-error follows-msg', text: followsError }));
  } else if (!follows.length) {
    list.replaceChildren(h('p', { class: 'muted follows-msg', text: 'Du folgst noch keinem Kanal.' }));
  } else {
    const vis = visibleFollows();
    list.replaceChildren(...vis.map((f) => {
      const already = inMyList(f.login);
      const cb = h('input', { type: 'checkbox', checked: already || followPick.has(f.login), disabled: already }) as HTMLInputElement;
      cb.addEventListener('change', () => {
        if (cb.checked) followPick.add(f.login); else followPick.delete(f.login);
        updateFollowCount();
      });
      return h('label', { class: `follow-item${already ? ' already' : ''}`, title: already ? 'Schon in deiner Liste' : f.displayName },
        cb,
        f.avatar ? h('img', { class: 'avatar sm', src: f.avatar, alt: '' }) : h('span', { class: 'avatar sm placeholder', text: f.login[0].toUpperCase() }),
        h('span', { class: 'follow-name', text: f.displayName }),
        f.live ? h('span', { class: 'live-dot', title: 'Gerade live' }) : null,
        already ? h('span', { class: 'muted follow-tag', text: 'drin' }) : null);
    }));
    if (!vis.length) list.append(h('p', { class: 'muted follows-msg', text: 'Kein Kanal passt zur Suche.' }));
  }
  btn.disabled = followsLoading || !!followsError;
  updateFollowCount();
}

function updateFollowCount(): void {
  const n = followPick.size;
  const btn = document.getElementById('follows-import') as HTMLButtonElement;
  const sync = (document.getElementById('follows-sync') as HTMLInputElement).checked;
  document.getElementById('follows-count')!.textContent = follows.length
    ? `${n} von ${follows.filter((f) => !inMyList(f.login)).length} neuen ausgewählt`
    : '';
  btn.textContent = n ? `${n} übernehmen` : sync ? 'Nur Abgleich speichern' : 'Übernehmen';
  btn.disabled = followsLoading || !!followsError || (!n && !sync);
}

async function loadFollowList(force: boolean): Promise<void> {
  followsLoading = true;
  followsError = null;
  renderFollows();
  const r = await api.getFollows(force);
  followsLoading = false;
  if (!r.ok) {
    followsError = r.error ?? 'Laden ging nicht.';
    follows = [];
  } else {
    // Live zuerst, dann alphabetisch
    follows = (r.list ?? []).slice().sort((a, b) => Number(b.live) - Number(a.live) || a.displayName.localeCompare(b.displayName, 'de'));
    followPick.clear();
    for (const f of follows) if (!inMyList(f.login)) followPick.add(f.login);
  }
  renderFollows();
}

function openFollowsDialog(): void {
  if (!state?.auth.loggedIn) {
    toast('Melde dich zuerst bei Twitch an.');
    return;
  }
  (document.getElementById('settings') as HTMLDialogElement).close();
  (document.getElementById('follows-search') as HTMLInputElement).value = '';
  (document.getElementById('follows-notify') as HTMLInputElement).checked = state.settings.followNotify;
  (document.getElementById('follows-auto') as HTMLInputElement).checked = state.settings.followAutoOpen;
  (document.getElementById('follows-sync') as HTMLInputElement).checked = true;
  (document.getElementById('follows') as HTMLDialogElement).showModal();
  void loadFollowList(false);
}

function setupFollowsDialog(): void {
  document.getElementById('btn-follows')!.addEventListener('click', openFollowsDialog);
  document.getElementById('btn-follows-2')!.addEventListener('click', openFollowsDialog);
  document.getElementById('follows-reload')!.append(icon('refresh'));
  document.getElementById('follows-reload')!.addEventListener('click', () => void loadFollowList(true));
  document.getElementById('follows-search')!.addEventListener('input', renderFollows);
  document.getElementById('follows-sync')!.addEventListener('change', updateFollowCount);
  const pickVisible = (on: boolean) => {
    for (const f of visibleFollows()) {
      if (inMyList(f.login)) continue;
      if (on) followPick.add(f.login); else followPick.delete(f.login);
    }
    renderFollows();
  };
  document.getElementById('follows-all')!.addEventListener('click', () => pickVisible(true));
  document.getElementById('follows-none')!.addEventListener('click', () => pickVisible(false));
  document.getElementById('follows-import')!.addEventListener('click', async () => {
    const btn = document.getElementById('follows-import') as HTMLButtonElement;
    btn.disabled = true;
    const r = await api.importFollows([...followPick], {
      notify: (document.getElementById('follows-notify') as HTMLInputElement).checked,
      autoOpen: (document.getElementById('follows-auto') as HTMLInputElement).checked,
      sync: (document.getElementById('follows-sync') as HTMLInputElement).checked,
    });
    if (!r.ok) {
      toast(r.error ?? 'Übernehmen ging nicht.');
      btn.disabled = false;
      return;
    }
    (document.getElementById('follows') as HTMLDialogElement).close();
    toast(r.added ? `${r.added} ${r.added === 1 ? 'Kanal' : 'Kanäle'} übernommen.` : 'Gespeichert.');
  });
}

// ---------- Einstellungen ----------

// ---------- Kanalpunkte ----------

/** Läuft in der Twitch-Seite: liest den Kontostand und klickt den Bonus, falls er da ist. */
const CLAIM_JS = `(() => {
  const r = { claimed: false, balance: null };
  const bal = document.querySelector('[data-test-selector="copo-balance-string"]');
  if (bal) r.balance = (bal.textContent || '').trim() || null;
  let btn = null;
  const icon = document.querySelector('.claimable-bonus__icon');
  if (icon) btn = icon.closest('button');
  if (!btn) {
    const summary = document.querySelector('[data-test-selector="community-points-summary"]');
    if (summary) btn = Array.from(summary.querySelectorAll('button')).find((b) => /bonus|claim|abholen|einfordern/i.test(b.getAttribute('aria-label') || '')) || null;
  }
  if (!btn) btn = Array.from(document.querySelectorAll('button[aria-label]')).find((b) => /^(claim bonus|bonus abholen|bonus einfordern|bonus einlösen)$/i.test((b.getAttribute('aria-label') || '').trim())) || null;
  if (btn && !btn.disabled) { btn.click(); r.claimed = true; }
  return r;
})()`;

let claimRunning = false;

async function claimPoints(): Promise<void> {
  if (claimRunning || !state) return;
  claimRunning = true;
  let changed = false;
  try {
    // Läuft der Player? (Nur dann zählst du als Zuschauer.)
    for (const t of tabs.values()) {
      if (t.kind !== 'stream') continue;
      let playing: boolean | null = null;
      if (t.ready && t.mode === 'viewer') {
        try {
          const r = await t.wv.executeJavaScript(PLAYING_JS);
          playing = typeof r === 'boolean' ? r : null;
        } catch {
          playing = t.playing;
        }
      }
      if (playing !== t.playing) {
        t.playing = playing;
        changed = true;
      }
    }

    if (!state.settings.autoClaimPoints || !state.auth.loggedIn) return;
    for (const t of tabs.values()) {
      if (t.kind !== 'stream' || t.login === state.own?.login) continue;
      // Kompakt: Bonus-Knopf steckt im Chat; ganze Seite: im Chat-Bereich der Seite
      const target = t.chat ?? t.wv;
      if (!(t.chat ? t.chatReady : t.ready)) continue;
      try {
        const r = (await target.executeJavaScript(CLAIM_JS)) as { claimed: boolean; balance: string | null } | null;
        if (!r) continue;
        if (r.balance && r.balance !== t.balance) {
          t.balance = r.balance;
          changed = true;
        }
        if (r.claimed) {
          t.claims++;
          changed = true;
        }
      } catch {
        // Seite lädt gerade neu – beim nächsten Durchlauf wieder
      }
    }
  } finally {
    claimRunning = false;
    if (changed) renderTabBar();
  }
}

// ---------- Aufnahme (nur in Kanälen, in denen du Mod bist) ----------

interface Recording {
  id: string;
  file: string;
  recorder: MediaRecorder;
  stream: MediaStream;
  started: number;
  bytes: number;
  /** Kette der Schreibvorgänge – beim Stoppen wird darauf gewartet */
  writes: Promise<unknown>;
  stopping: Promise<void> | null;
}

const QUALITY_BPS: Record<AppSettings['recordQuality'], number> = { high: 8_000_000, medium: 5_000_000, low: 2_500_000 };

function canRecord(t: Tab): boolean {
  return t.kind === 'stream' && !!t.login && isMod(t.login) && t.mode === 'viewer';
}

/** MP4 (H.264) bevorzugt – läuft in jedem Player; sonst WebM */
function pickRecordingFormat(): { mime: string; ext: 'mp4' | 'webm' } {
  const candidates: [string, 'mp4' | 'webm'][] = [
    ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'mp4'],
    ['video/mp4;codecs=avc1,mp4a.40.2', 'mp4'],
    ['video/mp4;codecs=avc1.640028,opus', 'mp4'],
    ['video/mp4;codecs=avc1,opus', 'mp4'],
    ['video/webm;codecs=vp9,opus', 'webm'],
    ['video/webm;codecs=vp8,opus', 'webm'],
  ];
  const hit = candidates.find(([m]) => MediaRecorder.isTypeSupported(m));
  return hit ? { mime: hit[0], ext: hit[1] } : { mime: 'video/webm', ext: 'webm' };
}

function fmtBytes(n: number): string {
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toLocaleString('de-DE', { maximumFractionDigits: 2 })} GB`;
  const mb = n / 1024 ** 2;
  return `${mb < 100 ? mb.toLocaleString('de-DE', { maximumFractionDigits: 1 }) : Math.round(mb).toLocaleString('de-DE')} MB`;
}

function fmtClock(ms: number): string {
  const s = Math.floor(ms / 1000);
  const hh = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return hh ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
}

function recLabel(r: Recording): string {
  return r.stopping ? 'Speichert …' : `${fmtClock(Date.now() - r.started)} · ${fmtBytes(r.bytes)}`;
}

async function startRecording(t: Tab): Promise<void> {
  if (t.rec || t.recStarting || !t.login) return;
  if (!canRecord(t)) {
    toast('Aufnehmen geht nur in Kanälen, in denen du Mod bist (Zuschauer-Ansicht).');
    return;
  }
  if (!t.ready) {
    toast('Der Player lädt noch – gleich nochmal versuchen.');
    return;
  }
  t.recStarting = true;
  renderTabBar();
  let stream: MediaStream | null = null;
  try {
    const sourceId = await api.recSourceId(t.wv.getWebContentsId(), t.login);
    // Bild und Ton direkt aus dem Player-Tab – der Ton kommt mit, auch wenn der Tab stumm ist
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: sourceId } },
      video: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: sourceId, maxWidth: 1920, maxHeight: 1080, maxFrameRate: 30 } },
    } as unknown as MediaStreamConstraints);
    const { mime, ext } = pickRecordingFormat();
    const started = await api.recStart(t.login, ext);
    if (!started.ok || !started.id || !started.file) throw new Error(started.error ?? 'Aufnahme konnte nicht starten.');
    const recorder = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: QUALITY_BPS[state?.settings.recordQuality ?? 'high'],
      audioBitsPerSecond: 160_000,
    });
    const rec: Recording = { id: started.id, file: started.file, recorder, stream, started: Date.now(), bytes: 0, writes: Promise.resolve(), stopping: null };
    recorder.ondataavailable = (e) => {
      if (!e.data.size) return;
      rec.writes = rec.writes.then(async () => {
        const n = await api.recChunk(rec.id, await e.data.arrayBuffer());
        if (n >= 0) rec.bytes = n;
      }).catch(() => {});
    };
    recorder.onerror = () => {
      void stopRecording(t, 'Die Aufnahme wurde wegen eines Fehlers beendet.');
    };
    stream.getVideoTracks()[0]?.addEventListener('ended', () => void stopRecording(t));
    recorder.start(2000);
    t.rec = rec;
    t.view.classList.add('recording');
    toast(`Aufnahme von ${tabLabel(t)} läuft.`);
  } catch (err) {
    stream?.getTracks().forEach((x) => x.stop());
    toast(`Aufnahme ging nicht: ${err instanceof Error ? err.message : err}`);
  } finally {
    t.recStarting = false;
    renderTabBar();
  }
}

/** Beendet die Aufnahme und speichert sie. Mehrfachaufrufe warten auf dasselbe Ende. */
function stopRecording(t: Tab, note?: string): Promise<void> {
  const rec = t.rec;
  if (!rec) return Promise.resolve();
  if (rec.stopping) return rec.stopping;
  rec.stopping = new Promise<void>((resolve) => {
    const finish = async () => {
      await rec.writes;
      rec.stream.getTracks().forEach((x) => x.stop());
      const res = await api.recStop(rec.id).catch(() => null);
      if (t.rec === rec) t.rec = null;
      t.view.classList.remove('recording');
      renderTabBar();
      if (res && res.bytes > 0) {
        const name = res.file.split(/[\\/]/).pop()!;
        toast(`${note ? note + ' ' : ''}Aufnahme gespeichert: ${name} (${fmtBytes(res.bytes)})${res.error ? ' – unvollständig: ' + res.error : ''}`, {
          label: 'Im Ordner zeigen',
          run: () => void api.recShowFile(res.file),
        });
      } else {
        toast(note ?? 'Aufnahme beendet – es wurde nichts aufgezeichnet.');
      }
      resolve();
    };
    if (rec.recorder.state === 'inactive') void finish();
    else {
      rec.recorder.onstop = () => void finish();
      rec.recorder.stop();
    }
  });
  renderTabBar();
  return rec.stopping;
}

function toggleRecording(t: Tab): Promise<void> {
  return t.rec ? stopRecording(t) : startRecording(t);
}

function setupRecording(): void {
  // Laufzeit und Größe jede Sekunde aktualisieren, ohne die Leiste neu aufzubauen
  setInterval(() => {
    for (const el of document.querySelectorAll<HTMLElement>('[data-rec-tick]')) {
      const t = tabs.get(el.dataset.recTick!);
      if (t?.rec) el.textContent = recLabel(t.rec);
    }
  }, 1000);
  api.onRecError((id, msg) => {
    for (const t of tabs.values()) if (t.rec?.id === id) void stopRecording(t, `Schreibfehler (${msg}).`);
  });
  api.onStopAllRecordings(() => {
    void Promise.all([...tabs.values()].map((t) => stopRecording(t))).then(() => api.recAllStopped());
  });
  document.getElementById('btn-rec-dir')!.addEventListener('click', async () => {
    const d = await api.recChooseDir();
    if (d) document.getElementById('rec-dir')!.textContent = d;
  });
  document.getElementById('btn-rec-open')!.addEventListener('click', () => void api.recOpenDir());
}

// ---------- Erkennungswörter ----------

type ListKey = Exclude<keyof GiveawayRules, 'crowdMinUsers'>;

const RULE_SECTIONS: { key: ListKey; title: string; hint: string; placeholder: string }[] = [
  { key: 'announceWords', title: 'Giveaway-Wörter', hint: 'Schreibt Streamer, Mod oder Bot eins davon zusammen mit einem Befehl, gilt das als Giveaway-Start.', placeholder: 'z. B. verlos* oder free key' },
  { key: 'entryCommands', title: 'Teilnahme-Befehle', hint: 'Werden in Ankündigungen bevorzugt. Schreiben viele Zuschauer einen davon, wird ein Giveaway auch ohne Ankündigung erkannt.', placeholder: 'z. B. !join' },
  { key: 'ignoreCommands', title: 'Ignorierte Befehle', hint: 'Gelten nie als Teilnahme-Befehl, auch wenn sie in einer Ankündigung stehen.', placeholder: 'z. B. !discord' },
  { key: 'endWords', title: 'Ende-Wörter', hint: 'Beenden ein laufendes Giveaway im Kanal.', placeholder: 'z. B. geschlossen' },
  { key: 'winWords', title: 'Gewinner-Wörter', hint: 'Zusammen mit deinem Namen lösen sie den Gewinner-Alarm aus.', placeholder: 'z. B. gewonnen' },
  { key: 'bots', title: 'Bots', hint: 'Diese Accounts dürfen Giveaways ankündigen wie Streamer und Mods.', placeholder: 'z. B. streamelements' },
];

let rulesFocus: ListKey | null = null;

async function saveRules(next: GiveawayRules, focusKey: ListKey | null): Promise<GiveawayRules> {
  const saved = await api.setGiveawayRules(next);
  if (state) state.giveawayRules = saved;
  rulesFocus = focusKey;
  renderRulesDialog();
  void runRuleTest();
  return saved;
}

function addRuleItems(key: ListKey, raw: string): void {
  if (!state) return;
  const items = raw.split(',').map((x) => x.trim()).filter(Boolean);
  if (!items.length) return;
  const before = state.giveawayRules[key].length;
  void saveRules({ ...state.giveawayRules, [key]: [...state.giveawayRules[key], ...items] }, key).then((saved) => {
    const added = saved[key].length - before;
    if (added < items.length) {
      toast(items.length === 1
        ? `„${items[0]}“ wurde nicht übernommen – schon vorhanden oder ungültig.`
        : `${items.length - added} von ${items.length} Einträgen nicht übernommen – schon vorhanden oder ungültig.`);
    }
  });
}

function ruleSection(sec: (typeof RULE_SECTIONS)[number]): HTMLElement {
  const rules = state!.giveawayRules;
  const list = rules[sec.key];
  const isDefault = JSON.stringify(list) === JSON.stringify(state!.defaultRules[sec.key]);
  const input = h('input', { class: 'chip-input', placeholder: sec.placeholder, spellcheck: 'false', 'data-rule': sec.key });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addRuleItems(sec.key, input.value);
    } else if (e.key === 'Backspace' && !input.value && list.length) {
      void saveRules({ ...rules, [sec.key]: list.slice(0, -1) }, sec.key);
    }
  });
  input.addEventListener('paste', (e) => {
    const text = e.clipboardData?.getData('text') ?? '';
    if (/[,\n]/.test(text)) {
      e.preventDefault();
      addRuleItems(sec.key, text.replace(/\n/g, ','));
    }
  });
  const box = h('div', { class: 'chips', onclick: () => input.focus() },
    ...list.map((item) =>
      h('span', { class: 'chip' },
        h('span', { text: item }),
        h('button', { type: 'button', class: 'chip-x', title: `„${item}“ entfernen`, 'aria-label': `${item} entfernen`, onclick: (e: MouseEvent) => {
          e.stopPropagation();
          void saveRules({ ...rules, [sec.key]: list.filter((x) => x !== item) }, sec.key);
        } }, '×'))),
    input);
  return h('section', { class: 'rule-sec' },
    h('div', { class: 'rule-head' },
      h('h3', { text: sec.title }),
      h('span', { class: 'muted rule-count', text: `${list.length}` }),
      !isDefault
        ? h('button', { type: 'button', class: 'link-btn', text: 'Standard', title: 'Diese Liste auf die Standardwerte zurücksetzen', onclick: () => {
            void saveRules({ ...rules, [sec.key]: [...state!.defaultRules[sec.key]] }, null);
          } })
        : null),
    h('p', { class: 'muted rule-hint', text: sec.hint }),
    box);
}

function renderRulesDialog(): void {
  if (!state) return;
  const body = document.getElementById('rules-body')!;
  const crowd = h('input', { type: 'number', min: '2', max: '20', value: String(state.giveawayRules.crowdMinUsers), class: 'num' }) as HTMLInputElement;
  crowd.addEventListener('change', () => void saveRules({ ...state!.giveawayRules, crowdMinUsers: Number(crowd.value) }, null));

  body.replaceChildren(
    h('div', { class: 'rule-grid' }, ...RULE_SECTIONS.map(ruleSection)),
    h('label', { class: 'row crowd-row' },
      h('span', { text: 'Giveaway ohne Ankündigung erkennen, wenn mindestens' }),
      crowd,
      h('span', { text: 'Leute innerhalb von 30 Sekunden denselben Teilnahme-Befehl schreiben' })),
    h('p', { class: 'muted rule-hint', text: 'Groß-/Kleinschreibung egal, es zählen nur ganze Wörter. Ein * steht für beliebige weitere Buchstaben: „verlos*“ findet „verlost“, „Verlosung“, „verlosen“. Mehrere Einträge auf einmal mit Komma trennen.' }),
  );
  if (rulesFocus) body.querySelector<HTMLInputElement>(`input[data-rule="${rulesFocus}"]`)?.focus();
}

async function runRuleTest(): Promise<void> {
  const input = document.getElementById('rule-test') as HTMLInputElement;
  const role = document.getElementById('rule-test-role') as HTMLSelectElement;
  const out = document.getElementById('rule-test-out')!;
  const text = input.value.trim();
  if (!text) {
    out.className = 'test-out';
    out.textContent = 'Füge eine Chat-Nachricht ein, um zu sehen, was Kanalwache daraus erkennt.';
    return;
  }
  const r = await api.testGiveawayMessage(text, role.value === 'privileged');
  if (!r) return;
  let cls = 'none';
  let msg: string;
  if (r.privileged) {
    const parts: string[] = [];
    if (r.win) {
      cls = 'win';
      parts.push(`🏆 Gewinner-Alarm – „${r.hits.win}“ und dein Name`);
    }
    if (r.start) {
      cls = r.win ? cls : 'start';
      parts.push(`🎁 Giveaway-Start erkannt („${r.hits.announce}“) – Teilnahme mit ${r.start}`);
    } else if (r.end) {
      cls = r.win ? cls : 'end';
      parts.push(`⏹ Beendet ein laufendes Giveaway („${r.hits.end ?? r.hits.win}“)`);
    } else if (r.noCommand) {
      cls = 'warn';
      parts.push(`„${r.hits.announce}“ gefunden, aber kein Befehl wie !join in der Nachricht – kein Giveaway`);
    }
    if (r.winners.length && !r.win) {
      cls = cls === 'none' ? 'end' : cls;
      parts.push(`🏆 Gewinner erkannt: ${r.winners.join(', ')}`);
    } else if (r.hits.win && !r.win && !r.winners.length) {
      parts.push(`Gewinner-Wort „${r.hits.win}“ gefunden, aber kein Name – im echten Chat werden zusätzlich die Teilnehmer abgeglichen`);
    }
    if (!r.win && r.hits.win && !r.me) parts.push('(für den Gewinner-Alarm musst du angemeldet sein)');
    msg = parts.join(' · ') || 'Nichts erkannt – kein Giveaway-, Ende- oder Gewinner-Wort gefunden.';
  } else if (r.entryCommand) {
    cls = 'start';
    msg = `Zählt als Teilnahme-Befehl ${r.entryCommand}. Schreiben ${r.crowdMinUsers} verschiedene Leute das innerhalb von 30 s, wird ein Giveaway erkannt.`;
  } else if (r.ignored) {
    cls = 'end';
    msg = 'Ignorierter Befehl – löst nichts aus.';
  } else {
    msg = 'Kein Teilnahme-Befehl – Nachrichten von Zuschauern zählen nur, wenn sie mit einem Teilnahme-Befehl beginnen.';
  }
  out.className = `test-out ${cls}`;
  out.textContent = msg;
}

function openRulesDialog(): void {
  const dlg = document.getElementById('rules') as HTMLDialogElement;
  (document.getElementById('settings') as HTMLDialogElement).close();
  rulesFocus = null;
  renderRulesDialog();
  void runRuleTest();
  dlg.showModal();
}

function setupRulesDialog(): void {
  let timer = 0;
  const debounced = () => {
    clearTimeout(timer);
    timer = window.setTimeout(() => void runRuleTest(), 150);
  };
  document.getElementById('rule-test')!.addEventListener('input', debounced);
  document.getElementById('rule-test-role')!.addEventListener('change', debounced);
  document.getElementById('btn-rules')!.addEventListener('click', openRulesDialog);
}

function setupSettings(): void {
  const dialog = document.getElementById('settings') as HTMLDialogElement;
  document.getElementById('btn-settings')!.append(icon('gear'));
  document.getElementById('btn-check')!.append(icon('refresh'));
  document.getElementById('btn-check')!.addEventListener('click', () => void api.checkNow());
  document.getElementById('btn-settings')!.addEventListener('click', () => {
    syncSettingsForm();
    dialog.showModal();
  });
  for (const el of dialog.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-setting]')) {
    el.addEventListener('change', () => {
      const key = el.dataset.setting as keyof AppSettings;
      const value = el instanceof HTMLInputElement && el.type === 'checkbox' ? el.checked : key === 'pollSeconds' ? Number(el.value) : el.value;
      void api.updateSettings({ [key]: value } as Partial<AppSettings>);
    });
  }
}

function syncSettingsForm(): void {
  if (!state) return;
  renderUpdateSettings();
  void api.recDir().then((d) => { document.getElementById('rec-dir')!.textContent = d; });
  const dialog = document.getElementById('settings')!;
  for (const el of dialog.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-setting]')) {
    const v = state.settings[el.dataset.setting as keyof AppSettings];
    if (el instanceof HTMLInputElement && el.type === 'checkbox') el.checked = !!v;
    else el.value = String(v);
  }
  const acc = document.getElementById('settings-account')!;
  acc.replaceChildren(
    h('div', { class: 'row' },
      h('span', { text: state.own ? `Eigener Kanal: ${displayName(state.own)}` : 'Kein eigener Kanal festgelegt' }),
      state.own
        ? h('button', { class: 'btn small', type: 'button', text: 'Ändern', onclick: async () => {
            const next = prompt('Neuer Kanalname (leer lassen zum Entfernen):', state!.own!.login);
            if (next === null) return;
            const r = await api.setOwn(next.trim() || null);
            if (!r.ok) toast(r.error ?? 'Ging nicht.');
            syncSettingsForm();
          } })
        : null),
    h('div', { class: 'row' },
      h('span', { text: state.auth.loggedIn ? `Twitch: angemeldet als ${state.auth.user ?? '?'}` : 'Twitch: nicht angemeldet' }),
      state.auth.loggedIn
        ? h('button', { class: 'btn small danger', type: 'button', text: 'Abmelden', onclick: async () => {
            if (!confirm('Bei Twitch abmelden? Offene Streams laufen dann ohne deinen Account weiter.')) return;
            await api.logout();
            for (const t of tabs.values()) reloadTab(t);
            syncSettingsForm();
          } })
        : null),
  );
}

// ---------- Start ----------

function applyState(next: AppState): void {
  const wasLoggedIn = state?.auth.loggedIn;
  const layoutChanged = !!state && state.settings.fullPage !== next.settings.fullPage;
  const audioModeChanged = !!state && state.settings.singleAudio !== next.settings.singleAudio;
  state = next;
  if (audioModeChanged) {
    if (next.settings.singleAudio) {
      const cur = tabs.get(activeId);
      setAudioTab(cur?.kind === 'stream' ? cur.id : audioTabId && tabs.has(audioTabId) ? audioTabId : null);
    } else {
      // Zurück zu „jeder Tab einzeln“: alle wieder laut, außer selbst stumm geschaltete
      for (const t of tabs.values()) t.muted = false;
      applyAudio();
    }
  }
  if (layoutChanged) {
    for (const t of tabs.values()) {
      if (t.kind !== 'stream' || t.mode !== 'viewer' || t.rec) continue;
      if (t.ready) t.muted = t.wv.isAudioMuted();
      buildTabContent(t);
    }
  }
  if (wasLoggedIn === false && next.auth.loggedIn) {
    // Gerade angemeldet: Login-Tab schließen, offene Streams mit Account neu laden.
    closeTab('login');
    for (const t of tabs.values()) reloadTab(t);
    toast(`Angemeldet als ${next.auth.user ?? 'Twitch-Nutzer'}.`);
  }
  renderSidebar();
  renderHome();
  renderGiveaways();
  renderUpdate(next);
  renderTabBar();
  renderNotifs();
  if (notifOpen && !next.auth.loggedIn) toggleNotifs(false);
}

async function main(): Promise<void> {
  applyChatLayout();
  setupSidebarResizer();
  setupSettings();
  setupRulesDialog();
  setInterval(() => void claimPoints(), 15_000);

  const form = document.getElementById('add-form') as HTMLFormElement;
  const input = document.getElementById('add-input') as HTMLInputElement;
  const err = document.getElementById('add-error')!;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!input.value.trim()) return;
    const r = await api.addChannel(input.value);
    err.textContent = r.ok ? '' : r.error ?? '';
    if (r.ok) input.value = '';
  });

  api.onState(applyState);
  api.onShowGiveaways(() => activate('giveaways'));
  api.onShortcut(handleShortcut);
  api.onRaid((r) => showRaid({ source: r.source, target: r.target, guessed: r.guessed, text: r.text, join: false, leave: false }));
  setInterval(() => void watchRaids(), 2500);
  setupRecording();
  setupQuickDialog();
  document.getElementById('btn-upd-check')!.addEventListener('click', () => void api.updateCheck());
  setInterval(() => void syncVolumes(), 1000);
  setupTabList();
  setupNotifs();
  api.onToast(toast);
  setupFollowsDialog();
  document.getElementById('fav-filter')!.addEventListener('input', () => renderSidebar());
  api.onOpenChannel((p) => openStream(p.login, { auto: p.auto, muted: p.muted, focus: !p.auto, mode: p.mode }));
  api.onChannelOffline((login) => {
    const t = tabs.get(`stream:${login}`);
    if (!t) return;
    const close = () => { if (t.auto && state?.settings.closeTabWhenOffline) closeTab(t.id, false, true); };
    if (t.rec) void stopRecording(t, `${tabLabel(t)} ist offline gegangen.`).then(close);
    else close();
  });

  applyState(await api.getState());
  // Laufzeiten in der Übersicht aktuell halten
  setInterval(() => {
    if (activeId === 'home') renderHome();
    if (activeId === 'giveaways') renderGiveaways();
  }, 60_000);
}

void main();
