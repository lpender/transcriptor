import { describe, expect, it } from 'vitest';
import { setEngine } from '../src/eleven';
import '../src/routes/auth';
import '../src/routes/byo-key';
import '../src/routes/productions';
import '../src/routes/render';
import '../src/routes/scripts';
import '../src/routes/voices';
import { seal, unseal } from '../src/seal';
import { env } from './env';
import { signIn } from './helpers';

describe('seal', () => {
  it('round-trips and fails under the wrong secret', async () => {
    const s = await seal('secret-a', 'sk_test_123');
    expect(s).not.toContain('sk_test');
    expect(await unseal('secret-a', s)).toBe('sk_test_123');
    await expect(unseal('secret-b', s)).rejects.toThrow();
  });
});

describe('own key', () => {
  it('is stored sealed, shown by last4, makes the quote free and drives the render', async () => {
    (env as { ELEVEN_LABS_API_KEY?: string; SEALING_KEY?: string }).ELEVEN_LABS_API_KEY = undefined;
    (env as { SEALING_KEY?: string }).SEALING_KEY = 'test-sealing';
    const ann = await signIn('ann17@example.com'), dir = await signIn('dir17@example.com');
    const { production } = await (await ann.call('POST', '/productions', { name: 'Own' })).json() as { production: { id: string } };
    await env.DB.prepare("INSERT INTO members VALUES (?, ?, 'director', '[]', '2026-09-30T00:00:00Z')").bind(dir.user.id, production.id).run();
    await ann.call('PUT', `/productions/${production.id}/script`, { title: 'Own', text: 'A: Hello there.' });
    expect((await ann.call('POST', `/productions/${production.id}/render`)).status).toBe(503);   // no key anywhere
    expect((await dir.call('PUT', `/productions/${production.id}/eleven-key`, { key: 'sk_abcdefghijklmnop1234' })).status).toBe(403);   // director may not
    expect((await ann.call('PUT', `/productions/${production.id}/eleven-key`, { key: 'short' })).status).toBe(400);
    expect(await (await ann.call('PUT', `/productions/${production.id}/eleven-key`, { key: 'sk_abcdefghijklmnop1234' })).json()).toEqual({ last4: '1234' });
    const row = await env.DB.prepare('SELECT eleven_key_enc AS enc FROM productions WHERE id = ?').bind(production.id).first<{ enc: string }>();
    expect(row!.enc).not.toContain('sk_abc');
    expect(await (await dir.call('GET', `/productions/${production.id}/eleven-key`)).json()).toEqual({ last4: '1234' });
    const { quote } = await (await ann.call('POST', `/productions/${production.id}/render/quote`)).json() as { quote: { priceCents: number; ownKey: boolean; toRender: number } };
    expect(quote).toMatchObject({ priceCents: 0, ownKey: true, toRender: 12 });
    let used = '';
    setEngine(async (_v, say, key) => { used = key; return { audio: new TextEncoder().encode(say).buffer as ArrayBuffer, spans: [] }; });
    const { render } = await (await ann.call('POST', `/productions/${production.id}/render`)).json() as { render: { id: string } };
    await ann.call('POST', `/productions/${production.id}/render/${render.id}/next`);
    expect(used).toBe('sk_abcdefghijklmnop1234');
    expect(await (await ann.call('DELETE', `/productions/${production.id}/eleven-key`)).json()).toEqual({ last4: null });
    expect((await (await ann.call('POST', `/productions/${production.id}/render/quote`)).json() as { quote: { ownKey: boolean } }).quote.ownKey).toBe(false);
  });
});
