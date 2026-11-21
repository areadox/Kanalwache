import { net } from 'electron';

/**
 * Übersetzt kurze Chat-Nachrichten. Ohne Schlüssel über MyMemory (kostenlos, ohne Anmeldung, begrenzt auf
 * einige tausend Zeichen am Tag); mit eigenem DeepL-API-Schlüssel (DeepL API Free) über DeepL.
 */
export async function translateText(text: string, from: string, to: string, deeplKey: string): Promise<{ ok: boolean; text?: string; service?: string; error?: string }> {
  const src = from.toLowerCase();
  const dst = to.toLowerCase();
  if (!text.trim()) return { ok: false, error: 'Leere Nachricht.' };
  try {
    if (deeplKey.trim()) {
      const host = /:fx$/.test(deeplKey.trim()) ? 'api-free.deepl.com' : 'api.deepl.com';
      const res = await net.fetch(`https://${host}/v2/translate`, {
        method: 'POST',
        headers: { Authorization: `DeepL-Auth-Key ${deeplKey.trim()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: [text], source_lang: src.toUpperCase(), target_lang: dst === 'en' ? 'EN-US' : dst === 'pt' ? 'PT-BR' : dst.toUpperCase() }),
      });
      if (res.status === 403) return { ok: false, error: 'DeepL-Schlüssel ungültig.' };
      if (res.status === 456) return { ok: false, error: 'DeepL-Kontingent für diesen Monat aufgebraucht.' };
      if (!res.ok) return { ok: false, error: `DeepL antwortet mit HTTP ${res.status}.` };
      const j = (await res.json()) as any;
      const out = j?.translations?.[0]?.text;
      return typeof out === 'string' && out ? { ok: true, text: out, service: 'DeepL' } : { ok: false, error: 'DeepL hat nichts zurückgegeben.' };
    }
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 480))}&langpair=${encodeURIComponent(`${src}|${dst}`)}`;
    const res = await net.fetch(url);
    if (!res.ok) return { ok: false, error: `Übersetzungsdienst antwortet mit HTTP ${res.status}.` };
    const j = (await res.json()) as any;
    const out = j?.responseData?.translatedText;
    if (j?.quotaFinished) return { ok: false, error: 'Tageskontingent des kostenlosen Übersetzers aufgebraucht – in den Einstellungen kannst du einen DeepL-Schlüssel eintragen.' };
    if (typeof out !== 'string' || !out || /^(MYMEMORY WARNING|INVALID)/i.test(out)) return { ok: false, error: 'Übersetzung fehlgeschlagen.' };
    return { ok: true, text: decodeEntities(out), service: 'MyMemory' };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function decodeEntities(s: string): string {
  return s.replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(Number(n))).replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}
