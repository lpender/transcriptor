//   GET /productions/:id/me/notes                  → {line text: note}          [learn]
//   PUT /productions/:id/me/notes  {line: note}    → upsert; '' removes         [learn]
// Notes are the member's own (docs/design/sharing.md): private unless shared,
// keyed by the line's text so they survive a re-split.
import { id, now, sha256 } from '../ids';
import { gate } from '../productions';
import { error, json, route } from '../router';

const mine = async (db: D1Database, userId: string, productionId: string) =>
  Object.fromEntries((await db.prepare('SELECT line, text FROM notes WHERE user_id = ? AND production_id = ? ORDER BY updated_at').bind(userId, productionId).all<{ line: string; text: string }>()).results.map((r) => [r.line, r.text]));

route('GET', '/productions/:id/me/notes', async (req, env, { id: pid }) => {
  const g = await gate(env.DB, req, pid, 'learn');
  if (g instanceof Response) return g;
  return json({ notes: await mine(env.DB, g.user.id, pid) });
});

route('PUT', '/productions/:id/me/notes', async (req, env, { id: pid }) => {
  const g = await gate(env.DB, req, pid, 'learn');
  if (g instanceof Response) return g;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object' || Array.isArray(body)) return error('invalid_notes', 400);
  const entries = Object.entries(body);
  if (entries.length > 500 || !entries.every(([l, t]) => l.length <= 2000 && typeof t === 'string' && t.length <= 4000)) return error('invalid_notes', 400);
  const at = now();
  const stmts = [];
  for (const [line, text] of entries) {
    const hash = await sha256(line);
    stmts.push((text as string).trim()
      ? env.DB.prepare('INSERT INTO notes (id, user_id, production_id, line_hash, line, text, shared, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?) ON CONFLICT (user_id, production_id, line_hash) DO UPDATE SET text = excluded.text, line = excluded.line, updated_at = excluded.updated_at').bind(id(), g.user.id, pid, hash, line, (text as string).trim(), at)
      : env.DB.prepare('DELETE FROM notes WHERE user_id = ? AND production_id = ? AND line_hash = ?').bind(g.user.id, pid, hash));
  }
  if (stmts.length) await env.DB.batch(stmts);
  return json({ notes: await mine(env.DB, g.user.id, pid) });
});
