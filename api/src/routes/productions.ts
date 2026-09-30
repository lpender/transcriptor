//   POST   /productions                         {name}            → create, caller is owner
//   GET    /productions                                           → mine, with role and member count
//   GET    /productions/:id                                       → production, members, my role   [read]
//   PUT    /productions/:id/members/:user       {role}            → change a role                  [share]
//   DELETE /productions/:id/members/:user                         → remove; self = leave           [share, or self]
//   PUT    /productions/:id/members/:user/parts {parts:[…]}       → which characters they learn    [self, or share]
import { currentUser } from '../auth';
import { createProduction, gate, members, myProductions, parseRole, removeMember, setParts, setRole } from '../productions';
import { error, json, route } from '../router';
import { syncSeats } from '../seats';

const body = <T>(req: Request) => req.json().catch(() => ({})) as Promise<Partial<T>>;
const outcome = (r: 'ok' | 'last_owner' | 'not_member') =>
  r === 'ok' ? json({ ok: true }) : r === 'last_owner' ? error('last_owner', 409, 'Name another owner first.') : error('not_found', 404);

route('POST', '/productions', async (req, env) => {
  const user = await currentUser(env.DB, req);
  if (!user) return error('unauthorized', 401);
  const { name } = await body<{ name: string }>(req);
  if (typeof name !== 'string' || !name.trim() || name.length > 120) return error('invalid_name', 400);
  return json({ production: await createProduction(env.DB, user, name) }, 201);
});

route('GET', '/productions', async (req, env) => {
  const user = await currentUser(env.DB, req);
  if (!user) return error('unauthorized', 401);
  return json({ productions: await myProductions(env.DB, user) });
});

route('GET', '/productions/:id', async (req, env, { id }) => {
  const g = await gate(env.DB, req, id, 'read');
  if (g instanceof Response) return g;
  const production = await env.DB.prepare('SELECT id, name, state, created_at FROM productions WHERE id = ?').bind(id).first();
  return json({ production, role: g.role, members: await members(env.DB, id) });
});

route('PUT', '/productions/:id/members/:user', async (req, env, { id, user }) => {
  const g = await gate(env.DB, req, id, 'share');
  if (g instanceof Response) return g;
  const role = parseRole((await body<{ role: unknown }>(req)).role);
  if (!role) return error('invalid_role', 400);
  if (role === 'owner' && g.role !== 'owner') return error('not_allowed', 403, 'Only an owner can make an owner.');
  return outcome(await setRole(env.DB, id, user, role));
});

route('DELETE', '/productions/:id/members/:user', async (req, env, { id, user }) => {
  const g = await gate(env.DB, req, id, 'read');
  if (g instanceof Response) return g;
  if (user !== g.user.id && (await gate(env.DB, req, id, 'share')) instanceof Response) return error('not_allowed', 403);
  const r = await removeMember(env.DB, id, user);
  if (r === 'ok') await syncSeats(env, id);
  return outcome(r);
});

route('PUT', '/productions/:id/members/:user/parts', async (req, env, { id, user }) => {
  const g = await gate(env.DB, req, id, 'read');
  if (g instanceof Response) return g;
  if (user !== g.user.id && (await gate(env.DB, req, id, 'share')) instanceof Response) return error('not_allowed', 403);
  const { parts } = await body<{ parts: unknown }>(req);
  if (!Array.isArray(parts) || !parts.every((p) => typeof p === 'string' && p.length <= 60) || parts.length > 40) return error('invalid_parts', 400);
  await setParts(env.DB, id, user, parts);
  return json({ ok: true });
});
