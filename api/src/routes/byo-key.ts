//   GET    /productions/:id/eleven-key   → {last4} or {last4: null}        [render]
//   PUT    /productions/:id/eleven-key   {key} → store, sealed             [billing]  (it spends their money)
//   DELETE /productions/:id/eleven-key                                     [billing]
// With a key of its own, a production renders at no charge and skips the quote.
import { gate } from '../productions';
import { error, json, route } from '../router';
import { seal } from '../seal';

route('GET', '/productions/:id/eleven-key', async (req, env, { id }) => {
  const g = await gate(env.DB, req, id, 'render');
  if (g instanceof Response) return g;
  const row = await env.DB.prepare('SELECT eleven_key_last4 AS last4 FROM productions WHERE id = ?').bind(id).first<{ last4: string | null }>();
  return json({ last4: row?.last4 ?? null });
});

route('PUT', '/productions/:id/eleven-key', async (req, env, { id }) => {
  const g = await gate(env.DB, req, id, 'billing');
  if (g instanceof Response) return g;
  if (!env.SEALING_KEY) return error('no_sealing_key', 503, 'Keys cannot be kept here yet.');
  const { key } = (await req.json().catch(() => ({}))) as { key?: unknown };
  if (typeof key !== 'string' || !/^[A-Za-z0-9_-]{16,128}$/.test(key.trim())) return error('invalid_key', 400, 'That does not look like an ElevenLabs API key.');
  const k = key.trim();
  await env.DB.prepare('UPDATE productions SET eleven_key_enc = ?, eleven_key_last4 = ? WHERE id = ?').bind(await seal(env.SEALING_KEY, k), k.slice(-4), id).run();
  return json({ last4: k.slice(-4) });
});

route('DELETE', '/productions/:id/eleven-key', async (req, env, { id }) => {
  const g = await gate(env.DB, req, id, 'billing');
  if (g instanceof Response) return g;
  await env.DB.prepare('UPDATE productions SET eleven_key_enc = NULL, eleven_key_last4 = NULL WHERE id = ?').bind(id).run();
  return json({ last4: null });
});
