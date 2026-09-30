//   GET  /voices                                  → our cast of voices (public)
//   GET  /productions/:id/voices                  → {speaker: voice}                        [read]
//   PUT  /productions/:id/voices   {speaker: voice} → set the company's voices             [render]
//   POST /productions/:id/render/quote            → what a render would cost               [render]
import { gate } from '../productions';
import { error, json, route } from '../router';
import { currentScript } from '../scripts';
import { CAST, quote, voicesOf } from '../voices';

route('GET', '/voices', () => json({ voices: CAST }));

route('GET', '/productions/:id/voices', async (req, env, { id }) => {
  const g = await gate(env.DB, req, id, 'read');
  if (g instanceof Response) return g;
  return json({ voices: await voicesOf(env.DB, id) });
});

route('PUT', '/productions/:id/voices', async (req, env, { id }) => {
  const g = await gate(env.DB, req, id, 'render');
  if (g instanceof Response) return g;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object' || Array.isArray(body)) return error('invalid_voices', 400);
  const entries = Object.entries(body);
  if (entries.length > 60 || !entries.every(([s, v]) => s.length <= 60 && typeof v === 'string' && CAST.some((c) => c.id === v))) return error('invalid_voices', 400, 'Each speaker must map to one of our voices.');
  await env.DB.batch([
    env.DB.prepare('DELETE FROM voices WHERE production_id = ?').bind(id),
    ...entries.map(([s, v]) => env.DB.prepare('INSERT INTO voices (production_id, speaker, voice_id) VALUES (?, ?, ?)').bind(id, s, v)),
  ]);
  return json({ voices: Object.fromEntries(entries) });
});

route('POST', '/productions/:id/render/quote', async (req, env, { id }) => {
  const g = await gate(env.DB, req, id, 'render');
  if (g instanceof Response) return g;
  const script = await currentScript(env.DB, id);
  if (!script) return error('no_script', 404, 'Load a script first.');
  return json({ quote: await quote(env.DB, script.text, await voicesOf(env.DB, id)) });
});
