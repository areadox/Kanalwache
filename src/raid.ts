/**
 * Erkennt in Chat-Nachrichten von Streamer, Mod oder Bot, dass der Kanal gleich einen anderen raidet
 * („Wir raiden jetzt @kanal“, „raiding kanal“). Nachrichten über eingehende Raids („Danke für den Raid“)
 * werden ignoriert.
 */

const INCOMING = /\b(danke|dank|thanks?|thx|ty|willkommen|welcome|hallo|hello|hi|raided|geraidet|for the raid|für den raid|f[uü]rs? raiden|incoming|eingehend|von|from)\b/i;

const OUTGOING = [
  /\bwir\s+raiden\s+(?:jetzt\s+|gleich\s+|heute\s+)?(?:zu|bei|nach|auf)?\s*@?([A-Za-z0-9_]{3,25})\b/i,
  /\braiden\s+(?:jetzt\s+|gleich\s+)?(?:zu|bei|nach|auf)\s+@?([A-Za-z0-9_]{3,25})\b/i,
  /\braid(?:et|en)?\s+(?:jetzt\s+|gleich\s+)?(?:geht\s+)?(?:zu|bei|nach|auf)\s+@?([A-Za-z0-9_]{3,25})\b/i,
  /\bwe(?:'re|\s+are)\s+raiding\s+(?:over\s+to\s+)?@?([A-Za-z0-9_]{3,25})\b/i,
  /\braiding\s+(?:over\s+to\s+)?@?([A-Za-z0-9_]{3,25})\b/i,
  /\braid(?:ing)?\s+(?:over\s+)?to\s+@?([A-Za-z0-9_]{3,25})\b/i,
];

const NOT_A_CHANNEL = new Set([
  'jetzt', 'gleich', 'heute', 'euch', 'dich', 'alle', 'zusammen', 'together', 'everyone', 'now', 'soon', 'the', 'den', 'die', 'das',
  'einen', 'eine', 'jemanden', 'someone', 'somebody', 'next', 'mal', 'noch', 'dann', 'then',
]);

export function extractRaidTarget(text: string, source: string): string | null {
  if (INCOMING.test(text)) return null;
  for (const re of OUTGOING) {
    const m = text.match(re);
    if (!m) continue;
    const login = m[1].toLowerCase();
    if (login === source || NOT_A_CHANNEL.has(login) || !/^[a-z0-9_]{3,25}$/.test(login)) continue;
    // Schreibweise aus der Ansage behalten (für die Anzeige); geöffnet wird klein geschrieben
    return m[1];
  }
  return null;
}
