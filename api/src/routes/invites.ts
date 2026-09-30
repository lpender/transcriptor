//   POST   /productions/:id/invites        {role}   → {url, invite}          [share]
//   GET    /productions/:id/invites                 → live and dead invites  [share]
//   DELETE /productions/:id/invites/:inv            → revoke                 [share]
//   GET    /invites/:token                          → {production, role} for the join screen (public)
//   POST   /invites/:token/accept          {email?} → signed in: join now; signed out: a magic link that joins on verify
import { currentUser, issueMagicLink, validEmail } from '../auth';
import { send } from '../email';
import { acceptInvite, findInvite, listInvites, mintInvite, revokeInvite } from '../invites';
import { gate, parseRole, READONLY_MESSAGE } from '../productions';
import { syncSeats } from '../seats';
import { error, json, route } from '../router';

route('POST', '/productions/:id/invites', async (req, env, { id }) => {
  const g = await gate(env.DB, req, id, 'share');
  if (g instanceof Response) return g;
  const role = parseRole(((await req.json().catch(() => ({}))) as { role?: unknown }).role);
  if (!role || role === 'owner') return error('invalid_role', 400, 'Invite as director, cast or crew.');
  const { token, invite } = await mintInvite(env.DB, id, role, g.user.id);
  return json({ url: `${env.APP_ORIGIN}/?invite=${token}`, invite }, 201);
});

route('GET', '/productions/:id/invites', async (req, env, { id }) => {
  const g = await gate(env.DB, req, id, 'share');
  if (g instanceof Response) return g;
  return json({ invites: await listInvites(env.DB, id) });
});

route('DELETE', '/productions/:id/invites/:inv', async (req, env, { id, inv }) => {
  const g = await gate(env.DB, req, id, 'share');
  if (g instanceof Response) return g;
  return (await revokeInvite(env.DB, id, inv)) ? json({ ok: true }) : error('not_found', 404);
});

route('GET', '/invites/:token', async (req, env, { token }) => {
  const invite = await findInvite(env.DB, { token });
  if (!invite) return error('invite_gone', 404, 'That invite has expired or was withdrawn.');
  return json({ production: { id: invite.production_id, name: invite.production_name }, role: invite.role, expiresAt: invite.expires_at });
});

route('POST', '/invites/:token/accept', async (req, env, { token }) => {
  const invite = await findInvite(env.DB, { token });
  if (!invite) return error('invite_gone', 404, 'That invite has expired or was withdrawn.');
  const user = await currentUser(env.DB, req);
  if (user) {
    const joined = await acceptInvite(env.DB, invite, user.id);
    if (joined === 'readonly') return error('readonly', 402, READONLY_MESSAGE);
    if (joined === 'joined') await syncSeats(env, invite.production_id);
    return json({ ok: true, joined, production: { id: invite.production_id, name: invite.production_name } });
  }
  const { email } = (await req.json().catch(() => ({}))) as { email?: unknown };
  if (!validEmail(email)) return error('unauthorized', 401, 'Sign in, or give an email address to be sent a link.');
  const link = `${env.API_ORIGIN}/auth/verify?token=${encodeURIComponent((await issueMagicLink(env.DB, email, 'invite', invite.id)).token)}`;
  const { sent } = await send(env, { to: email, subject: `Join ${invite.production_name}`, text: `Open this link to join ${invite.production_name} as ${invite.role}. It works once, for 15 minutes.\n\n${link}` });
  return json(sent ? { ok: true } : { ok: true, link }, 202);
});
