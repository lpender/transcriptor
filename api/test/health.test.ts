import { describe, expect, it } from 'vitest';
import { handle, VERSION, type Env } from '../src/router';

const env = { DB: {} as D1Database, APP_ORIGIN: 'http://localhost:8799', API_ORIGIN: 'http://localhost:8787' } satisfies Env;

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
