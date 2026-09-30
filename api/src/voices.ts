// Voices and the price of rendering them (ADR 003, docs/design/voices.md).
import { parseScript } from './shared';

export const MODEL = 'eleven_v3';
// Our cast of voices: ElevenLabs ids with a plain description for the picker.
export const CAST: { id: string; name: string; about: string }[] = [
  { id: 'iP95p4xoKVk53GoZ742B', name: 'Chris', about: 'charming, down-to-earth, male' },
  { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice', about: 'clear, British, female' },
  { id: 'cjVigY5qzO86Huf0OWal', name: 'Eric', about: 'smooth, trustworthy, male' },
  { id: 'pqHfZKP75CvOlQylNhV4', name: 'Bill', about: 'wise, old, male' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', about: 'dominant, firm, male' },
];
export const DEFAULT_VOICE = CAST[0].id;

// Price: cost is about $0.18 per 1k characters at ElevenLabs Creator rates;
// $0.30 per 1k covers margin and Stripe's cut. Nothing to render is free;
// anything at all is at least a dollar.
export const CENTS_PER_1K = 30;
export const MIN_CENTS = 100;
export const priceCents = (chars: number) => (chars <= 0 ? 0 : Math.max(MIN_CENTS, Math.ceil((chars / 1000) * CENTS_PER_1K)));

// What the voice is asked to say: the speech without a trailing dash, which
// eleven_v3 reads as a pause and a noise (same rule as tts.py).
export const spoken = (text: string) => text.replace(/[-–—]\s*$/, '').trim();

export async function sha1(text: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
export const clipHash = async (voice: string, say: string) => (await sha1(MODEL + voice + say)).slice(0, 16);

export interface Line { speaker: string; say: string; voice: string; hash: string; chars: number }

// Every line of a script with its voice and clip name. `sayAs` maps a full
// line ("NAME: words") to how it should be spoken instead.
export async function plan(text: string, voiceOf: Record<string, string>, sayAs: Record<string, string> = {}): Promise<Line[]> {
  const out: Line[] = [];
  for (const scene of parseScript(text).scenes) {
    for (const s of scene) {
      const say = spoken(sayAs[`${s.speaker}: ${s.text}`] ?? s.text);
      const voice = voiceOf[s.speaker] ?? DEFAULT_VOICE;
      out.push({ speaker: s.speaker, say, voice, hash: await clipHash(voice, say), chars: say.length });
    }
  }
  return out;
}

export interface Quote { lines: number; characters: number; cached: number; toRender: number; priceCents: number; speakers: Record<string, { lines: number; voice: string }> }

// The quote: only characters not already in the cache cost anything.
export async function quote(db: D1Database, text: string, voiceOf: Record<string, string>, sayAs: Record<string, string> = {}): Promise<Quote> {
  const lines = await plan(text, voiceOf, sayAs);
  const have = new Set<string>();
  const hashes = [...new Set(lines.map((l) => l.hash))];
  for (let i = 0; i < hashes.length; i += 100) {   // D1 binds at most ~100 parameters comfortably
    const chunk = hashes.slice(i, i + 100);
    const rows = await db.prepare(`SELECT hash FROM clips WHERE hash IN (${chunk.map(() => '?').join(',')})`).bind(...chunk).all<{ hash: string }>();
    for (const r of rows.results) have.add(r.hash);
  }
  const speakers: Quote['speakers'] = {};
  let characters = 0, cached = 0;
  const seen = new Set<string>();
  for (const l of lines) {
    speakers[l.speaker] ??= { lines: 0, voice: l.voice };
    speakers[l.speaker].lines++;
    if (seen.has(l.hash)) continue;   // the same words in the same voice render once
    seen.add(l.hash);
    characters += l.chars;
    if (have.has(l.hash)) cached += l.chars;
  }
  const toRender = characters - cached;
  return { lines: lines.length, characters, cached, toRender, priceCents: priceCents(toRender), speakers };
}

export const voicesOf = async (db: D1Database, productionId: string): Promise<Record<string, string>> =>
  Object.fromEntries((await db.prepare('SELECT speaker, voice_id FROM voices WHERE production_id = ?').bind(productionId).all<{ speaker: string; voice_id: string }>()).results.map((r) => [r.speaker, r.voice_id]));

export const sayAsOf = async (db: D1Database, productionId: string): Promise<Record<string, string>> =>
  Object.fromEntries((await db.prepare('SELECT line, say FROM sayas WHERE production_id = ?').bind(productionId).all<{ line: string; say: string }>()).results.map((r) => [r.line, r.say]));
