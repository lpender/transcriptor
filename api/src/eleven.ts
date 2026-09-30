// ElevenLabs behind one function (PLATFORM: namespaced adapter, generic type
// out). The same call tts.py makes: v3 with timestamps, mp3 44.1k/128.
import { sentences } from './shared';
import { MODEL } from './voices';

export interface Rendered { audio: ArrayBuffer; spans: [number, number][] }
export type Engine = (voice: string, say: string, key: string) => Promise<Rendered>;

interface Alignment { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] }

// When each sentence of a line starts and ends, so playback can loop one (tts.py's spans()).
export function spans(text: string, a: Alignment): [number, number][] {
  const out: [number, number][] = [];
  let at = 0;
  for (const piece of sentences(text)) {
    const first = text.indexOf(piece, at);
    if (first < 0) break;
    const last = first + piece.length - 1;
    if (last >= a.character_start_times_seconds.length) break;
    out.push([+a.character_start_times_seconds[first].toFixed(3), +a.character_end_times_seconds[last].toFixed(3)]);
    at = last + 1;
  }
  return out;
}

export const elevenLabs: Engine = async (voice, say, key) => {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}/with-timestamps?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'content-type': 'application/json' },
    body: JSON.stringify({ text: say, model_id: MODEL }),
  });
  if (!res.ok) throw new Error(`elevenlabs ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const body = await res.json() as { audio_base64: string; alignment: Alignment };
  const audio = Uint8Array.from(atob(body.audio_base64), (c) => c.charCodeAt(0)).buffer;
  return { audio, spans: spans(say, body.alignment) };
};

// Tests swap the engine; nothing else does.
let engine: Engine = elevenLabs;
export const setEngine = (e: Engine) => { engine = e; };
export const render = (voice: string, say: string, key: string) => engine(voice, say, key);
