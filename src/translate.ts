import { net } from 'electron';

export type TranslateService = 'mymemory' | 'deepl' | 'libre' | 'ollama' | 'openai' | 'anthropic';

export interface TranslateOptions {
  service: TranslateService;
  /** DeepL- / LibreTranslate- / OpenAI- / Anthropic-Schlüssel */
  key: string;
  /** Adresse für LibreTranslate, Ollama oder OpenAI-kompatible Dienste */
  url: string;
  /** Modell für Ollama / OpenAI / Anthropic */
  model: string;
}

type Result = { ok: boolean; text?: string; service?: string; error?: string };

const LANG_NAMES: Record<string, string> = {
  en: 'English', es: 'Spanish', fr: 'French', it: 'Italian', nl: 'Dutch', pl: 'Polish', pt: 'Portuguese',
  tr: 'Turkish', ru: 'Russian', ja: 'Japanese', ko: 'Korean', zh: 'Chinese', sv: 'Swedish', da: 'Danish',
  fi: 'Finnish', no: 'Norwegian', cs: 'Czech', hu: 'Hungarian', uk: 'Ukrainian', ar: 'Arabic', de: 'German',
};

function prompt(text: string, from: string, to: string): string {
  return `Translate this Twitch chat message from ${LANG_NAMES[from] ?? from} to ${LANG_NAMES[to] ?? to}. `
    + 'Keep @mentions, usernames, emote names and emojis unchanged, keep the casual chat tone, and answer with the translation only – no quotes, no explanations.\n\n'
    + text;
}

/** KI-Antworten manchmal mit Anführungszeichen oder Vorspann – auf die reine Übersetzung kürzen */
function clean(out: string): string {
  let s = out.trim();
  s = s.replace(/^(translation|übersetzung)\s*:\s*/i, '');
  if (/^["„“'].*["“”']$/s.test(s) && s.length > 2) s = s.slice(1, -1).trim();
  return s.split('\n').filter((l) => l.trim()).join(' ').slice(0, 500);
}

function base(url: string, fallback: string): string {
  return (url.trim() || fallback).replace(/\/+$/, '');
}

async function json(res: Response, name: string): Promise<any> {
  if (res.status === 401 || res.status === 403) throw new Error(`${name}: Schlüssel ungültig oder keine Berechtigung.`);
  if (res.status === 429) throw new Error(`${name}: zu viele Anfragen – kurz warten.`);
  if (!res.ok) {
    let detail = '';
    try { detail = ((await res.text()) || '').slice(0, 160); } catch { /* egal */ }
    throw new Error(`${name} antwortet mit HTTP ${res.status}${detail ? `: ${detail}` : ''}`);
  }
  return res.json();
}

export async function translateText(text: string, from: string, to: string, opt: TranslateOptions): Promise<Result> {
  const src = from.toLowerCase();
  const dst = to.toLowerCase();
  if (!text.trim()) return { ok: false, error: 'Leere Nachricht.' };
  try {
    switch (opt.service) {
      case 'deepl': {
        if (!opt.key.trim()) return { ok: false, error: 'DeepL: kein Schlüssel eingetragen.' };
        const host = /:fx$/.test(opt.key.trim()) ? 'api-free.deepl.com' : 'api.deepl.com';
        const j = await json(await net.fetch(`https://${host}/v2/translate`, {
          method: 'POST',
          headers: { Authorization: `DeepL-Auth-Key ${opt.key.trim()}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: [text], source_lang: src.toUpperCase(), target_lang: dst === 'en' ? 'EN-US' : dst === 'pt' ? 'PT-BR' : dst.toUpperCase() }),
        }), 'DeepL');
        const out = j?.translations?.[0]?.text;
        return typeof out === 'string' && out ? { ok: true, text: out, service: 'DeepL' } : { ok: false, error: 'DeepL hat nichts zurückgegeben.' };
      }
      case 'libre': {
        const j = await json(await net.fetch(`${base(opt.url, 'http://localhost:5000')}/translate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: text, source: src, target: dst, format: 'text', ...(opt.key.trim() ? { api_key: opt.key.trim() } : {}) }),
        }), 'LibreTranslate');
        const out = j?.translatedText;
        return typeof out === 'string' && out ? { ok: true, text: out, service: 'LibreTranslate' } : { ok: false, error: j?.error || 'LibreTranslate hat nichts zurückgegeben.' };
      }
      case 'ollama': {
        if (!opt.model.trim()) return { ok: false, error: 'Ollama: kein Modell eingetragen (z. B. „llama3.1“).' };
        const j = await json(await net.fetch(`${base(opt.url, 'http://localhost:11434')}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: opt.model.trim(), stream: false, options: { temperature: 0.2 }, messages: [{ role: 'user', content: prompt(text, src, dst) }] }),
        }), 'Ollama');
        const out = j?.message?.content;
        return typeof out === 'string' && out.trim() ? { ok: true, text: clean(out), service: `Ollama (${opt.model.trim()})` } : { ok: false, error: 'Ollama hat nichts zurückgegeben.' };
      }
      case 'openai': {
        if (!opt.model.trim()) return { ok: false, error: 'Kein Modell eingetragen.' };
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (opt.key.trim()) headers.Authorization = `Bearer ${opt.key.trim()}`;
        const j = await json(await net.fetch(`${base(opt.url, 'https://api.openai.com/v1')}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ model: opt.model.trim(), temperature: 0.2, messages: [{ role: 'user', content: prompt(text, src, dst) }] }),
        }), 'KI-Dienst');
        const out = j?.choices?.[0]?.message?.content;
        return typeof out === 'string' && out.trim() ? { ok: true, text: clean(out), service: opt.model.trim() } : { ok: false, error: 'Der KI-Dienst hat nichts zurückgegeben.' };
      }
      case 'anthropic': {
        if (!opt.key.trim()) return { ok: false, error: 'Claude: kein API-Schlüssel eingetragen.' };
        if (!opt.model.trim()) return { ok: false, error: 'Claude: kein Modell eingetragen.' };
        const j = await json(await net.fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'x-api-key': opt.key.trim(), 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: opt.model.trim(), max_tokens: 400, messages: [{ role: 'user', content: prompt(text, src, dst) }] }),
        }), 'Claude');
        const out = Array.isArray(j?.content) ? j.content.filter((c: any) => c?.type === 'text').map((c: any) => c.text).join('') : '';
        return out.trim() ? { ok: true, text: clean(out), service: opt.model.trim() } : { ok: false, error: 'Claude hat nichts zurückgegeben.' };
      }
      default: {
        const j = await json(await net.fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 480))}&langpair=${encodeURIComponent(`${src}|${dst}`)}`), 'MyMemory');
        const out = j?.responseData?.translatedText;
        if (j?.quotaFinished) return { ok: false, error: 'Tageskontingent von MyMemory aufgebraucht – in den Einstellungen kannst du einen anderen Dienst wählen.' };
        if (typeof out !== 'string' || !out || /^(MYMEMORY WARNING|INVALID)/i.test(out)) return { ok: false, error: 'Übersetzung fehlgeschlagen.' };
        return { ok: true, text: decodeEntities(out), service: 'MyMemory' };
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/ECONNREFUSED|ERR_CONNECTION_REFUSED/i.test(msg)) return { ok: false, error: `Keine Verbindung zu ${opt.url || 'dem Dienst'} – läuft er?` };
    return { ok: false, error: msg };
  }
}

function decodeEntities(s: string): string {
  return s.replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(Number(n))).replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}
