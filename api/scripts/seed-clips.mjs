// Seed the clip cache from the show's clips.js: every clip tts.py rendered is
// named by the same hash the API uses, so the play quotes at $0 from day one.
//   node scripts/seed-clips.mjs > tmp/seed-clips.sql
//   npx wrangler d1 execute tablework --local --file ../tmp/seed-clips.sql
import { readFileSync } from 'node:fs';
globalThis.window = {};
new Function(readFileSync(new URL('../../clips.js', import.meta.url), 'utf8'))();
const rows = Object.entries(window.CLIPS).map(([line, c]) => {
  const f = typeof c === 'string' ? c : c.f;
  const hash = f.replace(/^clips\//, '').replace(/\.mp3$/, '');
  const chars = line.split(':').slice(1).join(':').trim().length;
  const spans = JSON.stringify(typeof c === 'string' ? [] : c.s || []);
  return `('${hash}', ${chars}, '${f}', '2026-09-30T00:00:00Z', '${spans}')`;
});
console.log(`INSERT OR IGNORE INTO clips (hash, chars, r2_key, created_at, spans) VALUES\n${rows.join(',\n')};`);
