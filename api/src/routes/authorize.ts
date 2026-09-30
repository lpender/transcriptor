//   GET  /authorize?…   → signed in: the consent page (client, host, what it gets); signed out: a sign-in form that comes back here
//   POST /authorize     → Allow or Deny
// Everything from the client (name, domain, scopes) is escaped: it is attacker-chosen.
import { currentUser } from '../auth';
import { myProductions } from '../productions';
import { error, route } from '../router';
import type { OAuthEnv } from '../oauth';

const esc = (v: string) => v.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const page = (title: string, body: string) => new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title>
<style>body{margin:0;background:#13120E;color:#EFE7D6;font:400 17px/1.5 Georgia,serif}main{max-width:32em;margin:0 auto;padding:40px 20px}h1{font:500 1.6em/1.2 Georgia,serif;margin:0 0 12px}p,li{color:#EFE7D6}.dim{color:#B9AE94}button,input{font:500 15px ui-monospace,Menlo,monospace;min-height:44px;padding:0 18px;border-radius:10px;border:1px solid #5E5540;background:#262218;color:#EFE7D6}input{width:100%;box-sizing:border-box;padding:0 10px;margin:8px 0}.row{display:flex;gap:10px;margin-top:18px}.warn{color:#C8462F}</style></head><body><main>${body}</main></body></html>`, { headers: { 'content-type': 'text/html; charset=utf-8', 'x-frame-options': 'DENY', 'content-security-policy': "frame-ancestors 'none'" } });

route('GET', '/authorize', async (req, rawEnv) => {
  const env = rawEnv as OAuthEnv;
  const oauth = env.OAUTH_PROVIDER;
  let request;
  try { request = await oauth.parseAuthRequest(req); } catch (e) { return error('invalid_request', 400, (e as Error).message); }
  const user = await currentUser(env.DB, req);
  if (!user) {
    const next = new URL(req.url).pathname + new URL(req.url).search;
    return page('Sign in to Tablework', `<h1>Sign in to Tablework</h1><p class="dim">An app wants to act for you. Sign in first; the link brings you back here.</p>
<form method="post" action="/auth/link-form"><input type="hidden" name="next" value="${esc(next)}"><input type="email" name="email" placeholder="your@email" required autofocus><div class="row"><button>Send me a sign-in link</button></div></form>`);
  }
  const details = await oauth.describeConsent(request);
  const consent = await oauth.beginConsent(request);
  const productions = await myProductions(env.DB, user);
  const who = details.clientDomain ? `Published by <strong>${esc(details.clientDomain)}</strong>.` : `<span class="dim">This app registered itself; its name is not verified.</span>`;
  const list = productions.length ? `<ul>${productions.map((p) => `<li>${esc(p.name)} <span class="dim">(${esc(p.role)})</span></li>`).join('')}</ul>` : '<p class="dim">You are in no productions yet; it will be able to create one.</p>';
  const res = page(`Allow ${details.clientName}`, `<h1>Allow ${esc(details.clientName)} to act as ${esc(user.email)}?</h1>
<p>${who} Access goes to <strong>${esc(details.redirectHost)}</strong>.${details.redirectIsLoopback ? ' <span class="warn">That is an app on your own computer; continue only if you just started this from it.</span>' : ''}</p>
<p>It will be able to read and change these productions as you can:</p>${list}
<form method="post"><input type="hidden" name="handle" value="${esc(consent.handle)}"><input type="hidden" name="scope" value="mcp">
<div class="row"><button name="decision" value="approve">Allow</button><button name="decision" value="deny">Deny</button></div></form>`);
  consent.headers.forEach((v, k) => res.headers.append(k, v));
  return res;
});

route('POST', '/authorize', async (req, rawEnv) => {
  const env = rawEnv as OAuthEnv;
  const oauth = env.OAUTH_PROVIDER;
  const user = await currentUser(env.DB, req);
  if (!user) return error('unauthorized', 401, 'Sign in first.');
  const form = await req.formData();
  const handle = String(form.get('handle') ?? '');
  if (form.get('decision') !== 'approve') {
    const denied = await oauth.denyConsent(req, handle);
    return new Response(null, { status: 302, headers: denied.headers });
  }
  const approved = await oauth.approveConsent(req, handle, { scope: ['mcp'] });
  const { redirectTo } = await oauth.completeAuthorization({ request: approved.request, userId: user.id, metadata: { email: user.email }, scope: approved.request.scope, props: { userId: user.id, email: user.email } });
  approved.headers.set('location', redirectTo);
  return new Response(null, { status: 302, headers: approved.headers });
});
