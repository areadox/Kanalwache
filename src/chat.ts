/**
 * Schlanke Twitch-Chat-Verbindung (IRC über WebSocket).
 * Mit Login wird dein Twitch-Account benutzt (Lesen und Schreiben),
 * ohne Login wird anonym mitgelesen.
 */

export interface ChatMessage {
  channel: string;
  login: string;
  displayName: string;
  text: string;
  isBroadcaster: boolean;
  isMod: boolean;
}

export interface ChatHandlers {
  onMessage(m: ChatMessage): void;
  onNotice(channel: string, msgId: string, text: string): void;
  /** Twitch meldet deinen Status im Kanal (nach dem Betreten und nach jeder gesendeten Nachricht) */
  onUserState(channel: string, isMod: boolean): void;
  onStatus(): void;
}

export interface ChatAuth {
  token: string;
  login: string;
}

const IRC_URL = 'wss://irc-ws.chat.twitch.tv:443';

interface ParsedLine {
  tags: Record<string, string>;
  prefix: string;
  command: string;
  params: string[];
}

function unescapeTag(v: string): string {
  return v.replace(/\\(.)/g, (_m, c: string) => ({ s: ' ', ':': ';', '\\': '\\', r: '\r', n: '\n' } as Record<string, string>)[c] ?? c);
}

export function parseLine(line: string): ParsedLine | null {
  let rest = line;
  const tags: Record<string, string> = {};
  if (rest.startsWith('@')) {
    const sp = rest.indexOf(' ');
    for (const pair of rest.slice(1, sp).split(';')) {
      const eq = pair.indexOf('=');
      if (eq < 0) tags[pair] = '';
      else tags[pair.slice(0, eq)] = unescapeTag(pair.slice(eq + 1));
    }
    rest = rest.slice(sp + 1);
  }
  let prefix = '';
  if (rest.startsWith(':')) {
    const sp = rest.indexOf(' ');
    prefix = rest.slice(1, sp);
    rest = rest.slice(sp + 1);
  }
  const trailingAt = rest.indexOf(' :');
  let trailing: string | null = null;
  if (trailingAt >= 0) {
    trailing = rest.slice(trailingAt + 2);
    rest = rest.slice(0, trailingAt);
  }
  const parts = rest.split(' ').filter(Boolean);
  const command = parts.shift();
  if (!command) return null;
  if (trailing !== null) parts.push(trailing);
  return { tags, prefix, command, params: parts };
}

export class TwitchChat {
  private ws: WebSocket | null = null;
  private wanted = new Set<string>();
  private joined = new Set<string>();
  private auth: ChatAuth | null = null;
  private authFailed = false;
  private registered = false;
  private loggedInAs: string | null = null;
  private stopping = false;
  private retry = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private joinTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private lastData = 0;

  constructor(private h: ChatHandlers) {}

  /** Verbunden und mit deinem Account angemeldet, also kann geschrieben werden. */
  get canSend(): boolean {
    return this.registered && !!this.loggedInAs;
  }

  get connected(): boolean {
    return this.registered;
  }

  get authProblem(): boolean {
    return this.authFailed;
  }

  isJoined(channel: string): boolean {
    return this.joined.has(channel);
  }

  setAuth(auth: ChatAuth | null): void {
    if (auth?.token === this.auth?.token && auth?.login === this.auth?.login) return;
    this.auth = auth;
    this.authFailed = false;
    if (this.ws) this.restart();
  }

  setChannels(channels: Iterable<string>): void {
    this.wanted = new Set(channels);
    if (!this.wanted.size) {
      this.stop();
      return;
    }
    if (!this.ws && !this.reconnectTimer) this.connect();
    else this.syncJoins();
  }

  send(channel: string, text: string): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.canSend || !this.joined.has(channel)) return false;
    this.ws.send(`PRIVMSG #${channel} :${text.replace(/[\r\n]/g, ' ')}`);
    return true;
  }

  stop(): void {
    this.stopping = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.ws?.close();
    this.cleanup();
    this.stopping = false;
    this.h.onStatus();
  }

  private restart(): void {
    this.stop();
    if (this.wanted.size) this.connect();
  }

  private cleanup(): void {
    this.ws = null;
    this.registered = false;
    this.loggedInAs = null;
    this.joined.clear();
    if (this.joinTimer) clearTimeout(this.joinTimer);
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.joinTimer = null;
    this.pingTimer = null;
  }

  private connect(): void {
    this.reconnectTimer = null;
    const useAuth = this.auth && !this.authFailed ? this.auth : null;
    let ws: WebSocket;
    try {
      ws = new WebSocket(IRC_URL);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws = ws;
    ws.onopen = () => {
      ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
      if (useAuth) {
        ws.send(`PASS oauth:${useAuth.token}`);
        ws.send(`NICK ${useAuth.login}`);
      } else {
        ws.send('PASS SCHMOOPIIE');
        ws.send(`NICK justinfan${10000 + Math.floor(Math.random() * 80000)}`);
      }
      this.lastData = Date.now();
      this.pingTimer = setInterval(() => {
        if (Date.now() - this.lastData > 6 * 60_000) ws.close();
        else if (ws.readyState === WebSocket.OPEN) ws.send('PING :kanalwache');
      }, 60_000);
    };
    ws.onmessage = (ev) => {
      this.lastData = Date.now();
      for (const line of String(ev.data).split('\r\n')) if (line) this.handle(line, useAuth);
    };
    ws.onclose = () => {
      if (this.ws !== ws) return;
      this.cleanup();
      this.h.onStatus();
      if (!this.stopping && this.wanted.size) this.scheduleReconnect();
    };
    ws.onerror = () => {
      /* onclose folgt */
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    const delay = Math.min(60_000, 2000 * 2 ** this.retry++);
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  /** Kanäle nacheinander betreten (Twitch begrenzt die Zahl der JOINs). */
  private syncJoins(): void {
    if (!this.registered || !this.ws) return;
    for (const ch of [...this.joined]) {
      if (!this.wanted.has(ch)) {
        this.ws.send(`PART #${ch}`);
        this.joined.delete(ch);
      }
    }
    if (this.joinTimer) return;
    const next = [...this.wanted].find((c) => !this.joined.has(c));
    if (!next) return;
    this.ws.send(`JOIN #${next}`);
    this.joined.add(next);
    this.joinTimer = setTimeout(() => {
      this.joinTimer = null;
      this.syncJoins();
    }, 600);
  }

  private handle(line: string, usedAuth: ChatAuth | null): void {
    const msg = parseLine(line);
    if (!msg) return;
    switch (msg.command) {
      case 'PING':
        this.ws?.send(`PONG :${msg.params[0] ?? 'tmi.twitch.tv'}`);
        break;
      case '001':
        this.registered = true;
        this.retry = 0;
        this.loggedInAs = usedAuth ? usedAuth.login : null;
        this.h.onStatus();
        this.syncJoins();
        break;
      case 'RECONNECT':
        this.restart();
        break;
      case 'PRIVMSG': {
        const channel = (msg.params[0] ?? '').replace(/^#/, '');
        const login = msg.prefix.split('!')[0];
        const badges = msg.tags.badges ?? '';
        this.h.onMessage({
          channel,
          login,
          displayName: msg.tags['display-name'] || login,
          text: msg.params[1] ?? '',
          isBroadcaster: badges.includes('broadcaster/') || login === channel,
          isMod: msg.tags.mod === '1' || badges.includes('moderator/'),
        });
        break;
      }
      case 'USERSTATE':
        {
          const badges = msg.tags.badges ?? '';
          this.h.onUserState(
            (msg.params[0] ?? '').replace(/^#/, ''),
            msg.tags.mod === '1' || badges.includes('moderator/') || badges.includes('broadcaster/'),
          );
        }
        break;
      case 'NOTICE': {
        const text = msg.params[1] ?? '';
        if (!this.registered && /authentication failed|improperly formatted auth/i.test(text)) {
          // Login-Token wird nicht angenommen: anonym weiterlesen, Schreiben geht dann nicht.
          this.authFailed = true;
          this.h.onStatus();
          this.restart();
          return;
        }
        this.h.onNotice((msg.params[0] ?? '').replace(/^#/, ''), msg.tags['msg-id'] ?? '', text);
        break;
      }
    }
  }
}
