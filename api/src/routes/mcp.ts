//   POST /mcp        JSON-RPC (Streamable HTTP, stateless) with a bearer token   → the user's AI
//   POST /tokens     {label}  → a personal token, shown once                    [signed in]
//   GET  /tokens              → the caller's tokens (label, created, last used)
//   DELETE /tokens/:id        → revoke
import { currentUser, resolveSession, revokeSession } from '../auth';
import { now, plus, sha256, token as mint } from '../ids';
import { myProductions } from '../productions';
import { error, json, route } from '../router';
import { rpc, tool, DATA_NOTE } from '../mcp';

const TOKEN_TTL_MS = 10 * 365 * 24 * 60 * 60 * 1000;

route('POST', '/mcp', async (req, env) => {
  const bearer = req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  const user = await resolveSession(env.DB, bearer);
  if (!user) return error('unauthorized', 401, 'Send a personal token as a bearer.', { 'www-authenticate': 'Bearer realm="tablework"' });
  const body = await req.json().catch(() => null) as Parameters<typeof rpc>[0] | Parameters<typeof rpc>[0][] | null;
  if (!body) return json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, 400);
  const answers = (await Promise.all((Array.isArray(body) ? body : [body]).map((m) => rpc(m, { user, env })))).filter((a) => a !== null);
  if (!answers.length) return new Response(null, { status: 202 });
  return json(Array.isArray(body) ? answers : answers[0]);
});

route('POST', '/tokens', async (req, env) => {
  const user = await currentUser(env.DB, req);
  if (!user) return error('unauthorized', 401);
  const { label } = (await req.json().catch(() => ({}))) as { label?: unknown };
  if (typeof label !== 'string' || !label.trim() || label.length > 80) return error('invalid_label', 400);
  const t = mint();
  const at = now();
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at, last_seen, label) VALUES (?, ?, ?, ?, ?, ?)').bind(await sha256(t), user.id, at, plus(TOKEN_TTL_MS), at, label.trim()).run();
  return json({ token: t, label: label.trim(), mcpUrl: `${env.API_ORIGIN}/mcp` }, 201);
});

route('GET', '/tokens', async (req, env) => {
  const user = await currentUser(env.DB, req);
  if (!user) return error('unauthorized', 401);
  const rows = await env.DB.prepare('SELECT token_hash AS id, label, created_at, last_seen FROM sessions WHERE user_id = ? AND label IS NOT NULL AND revoked_at IS NULL ORDER BY created_at DESC').bind(user.id).all();
  return json({ tokens: rows.results });
});

route('DELETE', '/tokens/:id', async (req, env, { id }) => {
  const user = await currentUser(env.DB, req);
  if (!user) return error('unauthorized', 401);
  const r = await env.DB.prepare('UPDATE sessions SET revoked_at = ? WHERE token_hash = ? AND user_id = ? AND label IS NOT NULL AND revoked_at IS NULL').bind(now(), id, user.id).run();
  return r.meta.changes ? json({ ok: true }) : error('not_found', 404);
});

// The first tools. Ingest and cues come with mcp-add-script and mcp-cues-parts-invite.
tool({
  name: 'whoami',
  description: 'Who is signed in and which productions they are in, with their role in each. Call this first; pass a production id to the other tools.' + DATA_NOTE,
  inputSchema: { type: 'object', properties: {} },
  run: async (_a, { user, env }) => ({ user: { email: user.email, name: user.name }, productions: await myProductions(env.DB, user) }),
});
tool({
  name: 'list_productions',
  description: 'The productions the signed-in user is in: id, name, role, member count.' + DATA_NOTE,
  inputSchema: { type: 'object', properties: {} },
  run: async (_a, { user, env }) => ({ productions: await myProductions(env.DB, user) }),
});
