import { describe, expect, it } from 'vitest';
import { handle } from '../src/router';
import '../src/routes/auth';
import { env } from './env';

const post = (path: string, body: unknown, headers: HeadersInit = {}) =>
  handle(new Request(`http://x${path}`, { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json', ...headers } }), env);

describe('sign in', () => {
  it('walks link → verify → cookie → /me → logout', async () => {
    const asked = await post('/auth/link', { email: 'dee@example.com' });
    expect(asked.status).toBe(202);
    const { link } = await asked.json() as { link: string };
    expect(link).toContain('/auth/verify?token=');

    const verified = await handle(new Request(link), env);
    expect(verified.status).toBe(302);
    expect(verified.headers.get('location')).toBe(`${env.APP_ORIGIN}/?signin=ok`);
    const setCookie = verified.headers.get('set-cookie')!;
    expect(setCookie).toMatch(/HttpOnly; Secure; SameSite=Lax/);
    const cookie = setCookie.split(';')[0];

    const me = await handle(new Request('http://x/me', { headers: { cookie } }), env);
    expect(me.status).toBe(200);
    expect((await me.json() as { user: { email: string } }).user.email).toBe('dee@example.com');

    expect((await handle(new Request(link), env)).headers.get('location')).toContain('signin=expired');  // single use

    const out = await post('/auth/logout', {}, { cookie });
    expect(out.headers.get('set-cookie')).toContain('Max-Age=0');
    expect((await handle(new Request('http://x/me', { headers: { cookie } }), env)).status).toBe(401);
  });
  it('refuses a bad address and never leaks whether one is known', async () => {
    expect((await post('/auth/link', { email: 'nope' })).status).toBe(400);
    expect((await post('/auth/link', 'garbage')).status).toBe(400);
    const a = await post('/auth/link', { email: 'new@example.com' });
    const b = await post('/auth/link', { email: 'new@example.com' });
    expect([a.status, b.status]).toEqual([202, 202]);
  });
  it('401s without a session', async () => {
    expect((await handle(new Request('http://x/me'), env)).status).toBe(401);
  });
});
