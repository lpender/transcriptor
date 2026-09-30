// Sign in by magic link (PLATFORM §1).
//   POST /auth/link   {email}      → 202 always (never says whether the address is known)
//   GET  /auth/verify?token=…      → sets the session cookie, redirects to the app
//   GET  /me                       → the caller, or 401
//   POST /auth/logout              → revokes the session, clears the cookie
import { createSession, currentUser, issueMagicLink, revokeSession, validEmail, verifyMagicLink, SESSION_COOKIE, SESSION_TTL_MS } from '../auth';
import { send } from '../email';
import { acceptInvite, findInvite } from '../invites';
import { error, json, route } from '../router';

const cookie = (token: string, maxAge: number) =>
  `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
const sessionToken = (req: Request) => req.headers.get('cookie')?.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`))?.[1] ?? null;

route('POST', '/auth/link', async (req, env) => {
  const body = await req.json().catch(() => ({})) as { email?: unknown };
  if (!validEmail(body.email)) return error('invalid_email', 400, 'That does not look like an email address.');
  const { token } = await issueMagicLink(env.DB, body.email, 'login');
  const link = `${env.API_ORIGIN}/auth/verify?token=${encodeURIComponent(token)}`;
  const { sent } = await send(env, { to: body.email, subject: 'Your sign-in link', text: `Open this link to sign in. It works once, for 15 minutes.\n\n${link}` });
  // Dev and tests have no mail: the link comes back in the body so the flow can be walked.
  return json(sent ? { ok: true } : { ok: true, link }, 202);
});

// A login link signs in; an invite link signs in and joins the production it
// was minted for, if that invite is still live.
route('GET', '/auth/verify', async (req, env) => {
  const token = new URL(req.url).searchParams.get('token');
  const hit = (await verifyMagicLink(env.DB, token, 'login')) ?? (await verifyMagicLink(env.DB, token, 'invite'));
  if (!hit) return Response.redirect(`${env.APP_ORIGIN}/?signin=expired`, 302);
  let landing = `${env.APP_ORIGIN}/?signin=ok`;
  if (hit.inviteId) {
    const invite = await findInvite(env.DB, { id: hit.inviteId });
    landing = invite ? (await acceptInvite(env.DB, invite, hit.user.id), `${env.APP_ORIGIN}/?joined=${invite.production_id}`) : `${env.APP_ORIGIN}/?signin=ok&invite=gone`;
  }
  const session = await createSession(env.DB, hit.user.id);
  return new Response(null, { status: 302, headers: { location: landing, 'set-cookie': cookie(session.token, SESSION_TTL_MS / 1000) } });
});

route('GET', '/me', async (req, env) => {
  const user = await currentUser(env.DB, req);
  return user ? json({ user }) : error('unauthorized', 401);
});

route('POST', '/auth/logout', async (req, env) => {
  await revokeSession(env.DB, sessionToken(req));
  return json({ ok: true }, 200, { 'set-cookie': cookie('', 0) });
});
