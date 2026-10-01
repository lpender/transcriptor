//   PUT /productions/:id/me/progress  {best, total, misses}   → upsert the caller's row   [learn]
//   GET /productions/:id/progress                             → every member's row        [progress]
import { gate } from '../productions';
import { now } from '../ids';
import { error, json, route } from '../router';

const isCount = (x: unknown): x is number => Number.isInteger(x) && (x as number) >= 0 && (x as number) < 100000;

route('PUT', '/productions/:id/me/progress', async (req, env, { id }) => {
  const g = await gate(env.DB, req, id, 'learn');
  if (g instanceof Response) return g;
  const { best, total, misses } = (await req.json().catch(() => ({}))) as { best?: unknown; total?: unknown; misses?: unknown };
  const ok = isCount(best) && isCount(total) && misses && typeof misses === 'object' && !Array.isArray(misses)
    && Object.entries(misses as object).every(([k, v]) => k.length <= 500 && isCount(v)) && Object.keys(misses as object).length <= 2000;
  if (!ok) return error('invalid_progress', 400);
  await env.DB
    .prepare(`INSERT INTO progress (user_id, production_id, best, total, misses, updated_at) VALUES (?, ?, ?, ?, ?, ?)
              ON CONFLICT (user_id, production_id) DO UPDATE SET best = excluded.best, total = excluded.total, misses = excluded.misses, updated_at = excluded.updated_at`)
    .bind(g.user.id, id, best, total, JSON.stringify(misses), now())
    .run();
  return json({ ok: true });
});

route('GET', '/productions/:id/progress', async (req, env, { id }) => {
  const g = await gate(env.DB, req, id, 'progress');
  if (g instanceof Response) return g;
  const rows = await env.DB
    .prepare(`SELECT u.email, u.name, m.role, m.parts, p.best, p.total, p.misses, p.updated_at
              FROM members m JOIN users u ON u.id = m.user_id LEFT JOIN progress p ON p.user_id = m.user_id AND p.production_id = m.production_id
              WHERE m.production_id = ? ORDER BY m.joined_at`)
    .bind(id)
    .all<{ email: string; name: string | null; role: string; parts: string; best: number | null; total: number | null; misses: string | null; updated_at: string | null }>();
  return json({
    progress: rows.results.map((r) => ({
      email: r.email, name: r.name, role: r.role, parts: JSON.parse(r.parts) as string[],
      best: r.best ?? 0, total: r.total ?? 0, weak: r.misses ? Object.keys(JSON.parse(r.misses) as object).length : 0,
      shaky: r.misses ? Object.keys(JSON.parse(r.misses) as object).slice(0, 3) : [],   // the weakest few, quoted in the app
      updatedAt: r.updated_at,
    })),
  });
});
