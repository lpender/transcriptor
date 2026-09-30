// Sign in by magic link (PLATFORM §1).
//   POST /auth/link   {email}      → 202 always (never says whether the address is known)
//   GET  /auth/verify?token=…      → sets the session cookie, redirects to the app
//   GET  /me                       → the caller, or 401
//   POST /auth/logout              → revokes the session, clears the cookie
import { createSession, currentUser, issueMagicLink, revokeSession, validEmail, verifyMagicLink, SESSION_COOKIE, SESSION_TTL_MS } from '../auth';
import { send } from '../email';
import { acceptInvite, findInvite } from '../invites';
import { syncSeats } from '../seats';
import { error, json, route } from '../router';

const cookie = (token: string, maxAge: number) =>
  `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
const sessionToken = (req: Request) => req.headers.get('cookie')?.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`))?.[1] ?? null;

// A same-origin API path to land on after verify (the OAuth consent page); anything else is ignored.
const safeNext = (x: unknown) => (typeof x === 'string' && /^\/[a-z][a-z0-9/_-]*(\?[^\s#]*)?$/i.test(x) && !x.startsWith('//') ? x : null);

async function sendLink(env: Parameters<typeof send>[0] & { DB: D1Database; API_ORIGIN: string }, email: string, next: string | null) {
  const { token } = await issueMagicLink(env.DB, email, 'login');
  const link = `${env.API_ORIGIN}/auth/verify?token=${encodeURIComponent(token)}${next ? `&next=${encodeURIComponent(next)}` : ''}`;
  const { sent } = await send(env, { to: email, subject: 'Your sign-in link', text: `Open this link to sign in. It works once, for 15 minutes.\n\n${link}` });
  return { sent, link };
}

// The consent page's sign-in form (HTML, not the app).
route('POST', '/auth/link-form', async (req, env) => {
  const form = await req.formData();
  const email = String(form.get('email') ?? '');
  if (!validEmail(email)) return error('invalid_email', 400, 'That does not look like an email address.');
  const { sent, link } = await sendLink(env, email, safeNext(form.get('next')));
  return new Response(`<!doctype html><meta charset="utf-8"><title>Check your mail</title><body style="background:#13120E;color:#EFE7D6;font:17px Georgia,serif;padding:40px 20px"><h1>Check your mail</h1><p>A sign-in link is on its way to ${email.replace(/[&<>]/g, '')}. Open it and you will be brought back here.</p>${sent ? '' : `<p><a style="color:#EFE7D6" href="${link}">Open it here (dev).</a></p>`}`, { headers: { 'content-type': 'text/html; charset=utf-8' } });
});

route('POST', '/auth/link', async (req, env) => {
  const body = await req.json().catch(() => ({})) as { email?: unknown; next?: unknown };
  if (!validEmail(body.email)) return error('invalid_email', 400, 'That does not look like an email address.');
  const { sent, link } = await sendLink(env, body.email, safeNext(body.next));
  // Dev and tests have no mail: the link comes back in the body so the flow can be walked.
  return json(sent ? { ok: true } : { ok: true, link }, 202);
});

// A login link signs in; an invite link signs in and joins the production it
// was minted for, if that invite is still live.
route('GET', '/auth/verify', async (req, env) => {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  const hit = (await verifyMagicLink(env.DB, token, 'login')) ?? (await verifyMagicLink(env.DB, token, 'invite'));
  if (!hit) return Response.redirect(`${env.APP_ORIGIN}/?signin=expired`, 302);
  const next = safeNext(url.searchParams.get('next'));
  let landing = next ? `${env.API_ORIGIN}${next}` : `${env.APP_ORIGIN}/?signin=ok`;
  if (hit.inviteId) {
    const invite = await findInvite(env.DB, { id: hit.inviteId });
    const joined = invite ? await acceptInvite(env.DB, invite, hit.user.id) : 'gone';
    if (joined === 'joined') await syncSeats(env, invite!.production_id);
    landing = joined === 'gone' ? `${env.APP_ORIGIN}/?signin=ok&invite=gone` : joined === 'readonly' ? `${env.APP_ORIGIN}/?signin=ok&invite=readonly` : `${env.APP_ORIGIN}/?joined=${invite!.production_id}`;
  }
  const session = await createSession(env.DB, hit.user.id);
  return new Response(null, { status: 302, headers: { location: landing, 'set-cookie': cookie(session.token, SESSION_TTL_MS / 1000) } });
});

route('GET', '/me', async (req, env) => {
  // Signed out is an answer, not an error: the app asks on every load.
  return json({ user: await currentUser(env.DB, req) });
});

// Your name, as members and the director's AI see you.
route('PUT', '/me', async (req, env) => {
  const user = await currentUser(env.DB, req);
  if (!user) return error('unauthorized', 401);
  const { name } = (await req.json().catch(() => ({}))) as { name?: unknown };
  if (typeof name !== 'string' || name.trim().length > 80) return error('invalid_name', 400);
  const clean = name.trim() || null;
  await env.DB.prepare('UPDATE users SET name = ? WHERE id = ?').bind(clean, user.id).run();
  return json({ user: { ...user, name: clean } });
});

route('POST', '/auth/logout', async (req, env) => {
  await revokeSession(env.DB, sessionToken(req));
  return json({ ok: true }, 200, { 'set-cookie': cookie('', 0) });
});
