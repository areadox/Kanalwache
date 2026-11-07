import { app, net, shell } from 'electron';

/**
 * Update-Funktion.
 * - Installierte Version (Setup): electron-updater lädt neue Releases von GitHub im Hintergrund und
 *   installiert sie beim Neustart bzw. beim Beenden.
 * - Portable .exe: kann sich nicht selbst ersetzen – hier wird nur geprüft und der Download angeboten.
 */

const REPO = 'areadox/Kanalwache';
const RELEASES_URL = `https://github.com/${REPO}/releases`;

export type UpdateState =
  | { kind: 'idle'; checkedAt: number | null }
  | { kind: 'checking' }
  | { kind: 'none'; checkedAt: number }
  | { kind: 'available'; version: string; url: string; download: string | null; portable: boolean }
  | { kind: 'downloading'; version: string; percent: number }
  | { kind: 'ready'; version: string }
  | { kind: 'error'; message: string };

export function isPortable(): boolean {
  return !!process.env.PORTABLE_EXECUTABLE_FILE;
}

/** Vergleicht Versionen wie 0.0.10 und 0.0.9 richtig. */
export function newerThan(a: string, b: string): boolean {
  const pa = a.replace(/^v/, '').split(/[.-]/).map((x) => parseInt(x, 10) || 0);
  const pb = b.replace(/^v/, '').split(/[.-]/).map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) > (pb[i] ?? 0);
  }
  return false;
}

export class Updater {
  state: UpdateState = { kind: 'idle', checkedAt: null };
  private nsis: import('electron-updater').AppUpdater | null = null;
  private timer: NodeJS.Timeout | null = null;

  constructor(private onChange: (s: UpdateState) => void) {}

  get version(): string {
    return app.getVersion();
  }

  get portable(): boolean {
    return isPortable();
  }

  /** Nur in der gebauten App sinnvoll (nicht beim Entwickeln mit npm start). */
  get supported(): boolean {
    return app.isPackaged;
  }

  private set(s: UpdateState): void {
    this.state = s;
    this.onChange(s);
  }

  start(auto: boolean): void {
    if (!this.supported) return;
    if (!this.portable) this.setupNsis();
    this.setAuto(auto);
  }

  setAuto(auto: boolean): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (!auto || !this.supported) return;
    setTimeout(() => void this.check(false), 15_000);
    this.timer = setInterval(() => void this.check(false), 6 * 60 * 60_000);
  }

  private setupNsis(): void {
    // erst hier laden – im Entwicklungsmodus wird das Modul nicht gebraucht
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { autoUpdater } = require('electron-updater') as typeof import('electron-updater');
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowPrerelease = false;
    autoUpdater.on('checking-for-update', () => this.set({ kind: 'checking' }));
    autoUpdater.on('update-not-available', () => this.set({ kind: 'none', checkedAt: Date.now() }));
    autoUpdater.on('update-available', (info) =>
      this.set({ kind: 'available', version: info.version, url: `${RELEASES_URL}/tag/v${info.version}`, download: null, portable: false }),
    );
    autoUpdater.on('download-progress', (p) => {
      const version = this.state.kind === 'available' || this.state.kind === 'downloading' ? this.state.version : '';
      this.set({ kind: 'downloading', version, percent: Math.round(p.percent) });
    });
    autoUpdater.on('update-downloaded', (info) => this.set({ kind: 'ready', version: info.version }));
    autoUpdater.on('error', (err) => this.set({ kind: 'error', message: friendly(err) }));
    this.nsis = autoUpdater;
  }

  /** Nach Updates suchen. manual = vom Knopf aus (dann auch „keine Updates“ melden). */
  async check(manual: boolean): Promise<void> {
    if (!this.supported) {
      if (manual) this.set({ kind: 'error', message: 'Updates gibt es nur in der fertigen App (nicht beim Entwickeln).' });
      return;
    }
    if (this.state.kind === 'downloading' || this.state.kind === 'ready') return;
    if (this.nsis) {
      try {
        await this.nsis.checkForUpdates();
      } catch (err) {
        this.set({ kind: 'error', message: friendly(err) });
      }
      return;
    }
    // Portable: GitHub fragen, ob es ein neueres Release gibt
    this.set({ kind: 'checking' });
    try {
      const res = await net.fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
        headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Kanalwache' },
      });
      if (!res.ok) throw new Error(`GitHub antwortet mit HTTP ${res.status}`);
      const rel = (await res.json()) as { tag_name?: string; html_url?: string; assets?: { name: string; browser_download_url: string }[] };
      const version = (rel.tag_name ?? '').replace(/^v/, '');
      if (!version || !newerThan(version, this.version)) {
        this.set({ kind: 'none', checkedAt: Date.now() });
        return;
      }
      const asset = rel.assets?.find((a) => /portable\.exe$/i.test(a.name));
      this.set({ kind: 'available', version, url: rel.html_url ?? RELEASES_URL, download: asset?.browser_download_url ?? null, portable: true });
    } catch (err) {
      this.set({ kind: 'error', message: friendly(err) });
    }
  }

  /** Portable: neue Datei über den Browser laden. */
  download(): void {
    if (this.state.kind !== 'available') return;
    void shell.openExternal(this.state.download ?? this.state.url);
  }

  openReleaseNotes(): void {
    const v = this.state.kind === 'available' || this.state.kind === 'downloading' || this.state.kind === 'ready' ? this.state.version : null;
    void shell.openExternal(v ? `${RELEASES_URL}/tag/v${v}` : RELEASES_URL);
  }

  /** Installer-Version: jetzt neu starten und installieren. */
  installNow(): void {
    if (this.state.kind !== 'ready' || !this.nsis) return;
    // isSilent = false: Installer sichtbar (zeigt Fortschritt); danach Kanalwache wieder starten
    this.nsis.quitAndInstall(false, true);
  }
}

function friendly(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|ERR_INTERNET_DISCONNECTED|net::/i.test(msg)) return 'Keine Verbindung zu GitHub.';
  if (/404/.test(msg)) return 'Kein Release gefunden.';
  return msg.split('\n')[0].slice(0, 160);
}
