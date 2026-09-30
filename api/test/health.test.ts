import { describe, expect, it } from 'vitest';
import { cors, handle, preflight, route, VERSION, type Env } from '../src/router';

const env = { DB: {} as D1Database, CLIPS: {} as R2Bucket, ROOMS: {} as DurableObjectNamespace, APP_ORIGIN: 'http://localhost:8799', API_ORIGIN: 'http://localhost:8787' } satisfies Env;

describe('router', () => {
  it('answers /health', async () => {
    const res = await handle(new Request('http://x/health'), env);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, version: VERSION });
  });
  it('404s the rest as JSON', async () => {
    const res = await handle(new Request('http://x/nope'), env);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'not_found' });
  });
});

describe('errors', () => {
  it('answers a throwing route as a JSON 500', async () => {
    route('GET', '/boom', () => { throw new Error('kaboom'); });
    const res = await handle(new Request('http://x/boom'), env);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'server_error', message: 'kaboom' });
  });
});

describe('cors', () => {
  it('answers a preflight from the app origin, and nothing for others', async () => {
    const pre = new Request('http://x/auth/link', { method: 'OPTIONS', headers: { origin: env.APP_ORIGIN } });
    const res = cors(pre, env)(preflight(pre)!);
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe(env.APP_ORIGIN);
    expect(res.headers.get('access-control-allow-headers')).toContain('content-type');
    const other = new Request('http://x/health', { headers: { origin: 'https://evil.example' } });
    expect(cors(other, env)(await handle(other, env)).headers.get('access-control-allow-origin')).toBeNull();
  });
});
