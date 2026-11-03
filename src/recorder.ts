import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Schreibt Aufnahmen auf die Platte. Die Oberfläche nimmt Bild und Ton des Player-Tabs auf
 * (MediaRecorder) und schickt die Daten stückweise hierher – so landet nie die ganze Aufnahme im Speicher.
 */

interface Active {
  file: string;
  out: fs.WriteStream;
  bytes: number;
  error: string | null;
}

export class RecordingFiles {
  private active = new Map<string, Active>();
  private next = 1;

  constructor(private onError: (id: string, message: string) => void) {}

  get count(): number {
    return this.active.size;
  }

  start(dir: string, login: string, ext: 'mp4' | 'webm'): { id: string; file: string } {
    fs.mkdirSync(dir, { recursive: true });
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
    let file = path.join(dir, `${login}_${stamp}.${ext}`);
    for (let i = 2; fs.existsSync(file); i++) file = path.join(dir, `${login}_${stamp}_${i}.${ext}`);
    const id = String(this.next++);
    const out = fs.createWriteStream(file, { flags: 'wx' });
    const rec: Active = { file, out, bytes: 0, error: null };
    out.on('error', (err) => {
      rec.error = err.message;
      this.onError(id, err.message);
    });
    this.active.set(id, rec);
    return { id, file };
  }

  write(id: string, data: ArrayBuffer | Uint8Array): number {
    const rec = this.active.get(id);
    if (!rec || rec.error) return -1;
    const buf = Buffer.from(data instanceof Uint8Array ? data : new Uint8Array(data));
    rec.out.write(buf);
    rec.bytes += buf.length;
    return rec.bytes;
  }

  async stop(id: string): Promise<{ file: string; bytes: number; error: string | null } | null> {
    const rec = this.active.get(id);
    if (!rec) return null;
    this.active.delete(id);
    await new Promise<void>((resolve) => rec.out.end(() => resolve()));
    // Leere Datei (z. B. sofort wieder gestoppt) nicht liegen lassen
    if (rec.bytes === 0) {
      try {
        fs.unlinkSync(rec.file);
      } catch {
        /* egal */
      }
    }
    return { file: rec.file, bytes: rec.bytes, error: rec.error };
  }

  /** Beim Beenden: alles, was angekommen ist, sicher auf die Platte bringen */
  async closeAll(): Promise<void> {
    await Promise.all([...this.active.keys()].map((id) => this.stop(id)));
  }
}
