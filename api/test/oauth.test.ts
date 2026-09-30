import { describe, expect, it } from 'vitest';
import worker from '../src/index';
import { env } from './env';
import { signIn } from './helpers';

// Drive the whole provider through the Worker's real fetch: register a client,
// see the consent page, allow, swap the code for a token with PKCE, call MCP.
const ORIGIN = 'http://localhost:8787';
const call = (path: string, init?: RequestInit) => worker.fetch(new Request(`${ORIGIN}${path}`, init), env as never, { waitUntil() {}, passThroughOnException() {} } as never);
const b64url = (b: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

describe('OAuth for the MCP server', () => {
  it('publishes metadata, registers a client, asks consent, issues a token, serves MCP with it', async () => {
    const meta = await (await call('/.well-known/oauth-authorization-server')).json() as { authorization_endpoint: string; token_endpoint: string; registration_endpoint: string };
    expect(meta.authorization_endpoint).toBe(`${ORIGIN}/authorize`);
    const resource = await (await call('/.well-known/oauth-protected-resource/oauth/mcp')).json() as { resource: string; authorization_servers: string[] };
    expect(resource).toMatchObject({ resource: `${ORIGIN}/oauth/mcp`, authorization_servers: [ORIGIN] });
    expect((await call('/oauth/mcp', { method: 'POST', body: '{}' })).status).toBe(401);

    const reg = await (await call('/oauth/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ client_name: 'Claude', redirect_uris: ['https://claude.ai/api/mcp/auth_callback'], token_endpoint_auth_method: 'none' }) })).json() as { client_id: string };
    expect(reg.client_id).toBeTruthy();

    const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)).buffer);
    const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
    const authorize = `/authorize?response_type=code&client_id=${encodeURIComponent(reg.client_id)}&redirect_uri=${encodeURIComponent('https://claude.ai/api/mcp/auth_callback')}&scope=mcp&state=xyz&code_challenge=${challenge}&code_challenge_method=S256&resource=${encodeURIComponent(`${ORIGIN}/oauth/mcp`)}`;
    const signedOut = await call(authorize);
    expect(signedOut.status).toBe(200);
    expect(await signedOut.text()).toContain('Sign in to Tablework');

    const ann = await signIn('ann25@example.com');
    await ann.call('POST', '/productions', { name: 'Oauth Play' });
    const consent = await call(authorize, { headers: { cookie: ann.headers.cookie } });
    const html = await consent.text();
    expect(html).toContain('Allow Claude');
    expect(html).toContain('Oauth Play');
    expect(html).toContain('claude.ai');
    const handle = html.match(/name="handle" value="([^"]+)"/)![1];
    const cookies = consent.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');

    const approved = await call('/authorize', { method: 'POST', headers: { cookie: `${ann.headers.cookie}; ${cookies}`, 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ handle, scope: 'mcp', decision: 'approve' }).toString() });
    expect(approved.status).toBe(302);
    const to = new URL(approved.headers.get('location')!);
    expect(to.origin + to.pathname).toBe('https://claude.ai/api/mcp/auth_callback');
    expect(to.searchParams.get('state')).toBe('xyz');
    const code = to.searchParams.get('code')!;

    const token = await (await call('/oauth/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'authorization_code', code, client_id: reg.client_id, redirect_uri: 'https://claude.ai/api/mcp/auth_callback', code_verifier: verifier, resource: `${ORIGIN}/oauth/mcp` }).toString() })).json() as { access_token: string; token_type: string };
    expect(token.token_type.toLowerCase()).toBe('bearer');

    const who = await (await call('/oauth/mcp', { method: 'POST', headers: { authorization: `Bearer ${token.access_token}`, 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'whoami', arguments: {} } }) })).json() as { result: { content: { text: string }[] } };
    const parsed = JSON.parse(who.result.content[0].text) as { user: { email: string }; productions: { name: string }[] };
    expect(parsed.user.email).toBe('ann25@example.com');
    expect(parsed.productions.map((p) => p.name)).toContain('Oauth Play');

    // the ordinary API still works through the wrapper, CORS and all
    const health = await call('/health', { headers: { origin: env.APP_ORIGIN } });
    expect(health.status).toBe(200);
    expect(health.headers.get('access-control-allow-origin')).toBe(env.APP_ORIGIN);
  });
});
