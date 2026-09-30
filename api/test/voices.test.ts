import { describe, expect, it } from 'vitest';
import '../src/routes/auth';
import '../src/routes/productions';
import '../src/routes/scripts';
import '../src/routes/voices';
import { CAST, clipHash, priceCents, quote, spoken } from '../src/voices';
import { env } from './env';
import { signIn } from './helpers';

describe('price', () => {
  it('is zero for nothing, a dollar minimum, thirty cents a thousand', () => {
    expect(priceCents(0)).toBe(0);
    expect(priceCents(1)).toBe(100);
    expect(priceCents(3333)).toBe(100);
    expect(priceCents(3334)).toBe(101);
    expect(priceCents(100_000)).toBe(3000);
  });
  it('names a clip the way tts.py does', async () => {
    // sha1('eleven_v3' + voice + 'No.')[:16], checked against python hashlib
    expect(await clipHash('iP95p4xoKVk53GoZ742B', 'No.')).toBe(EXPECTED_NO);
    expect(spoken('I was going to —')).toBe('I was going to');
  });
});
const EXPECTED_NO = 'a49e33a775f8d898';

describe('quote', () => {
  it('charges only for uncached characters and dedupes repeated lines', async () => {
    const text = 'NELSON: No.\nNELSON: No.\nRECEPTIONIST: Highlights for Children.';
    const before = await quote(env.DB, text, {});
    expect(before).toMatchObject({ lines: 3, characters: 3 + 24, cached: 0, toRender: 27, priceCents: 100, speakers: { NELSON: { lines: 2 }, RECEPTIONIST: { lines: 1 } } });
    await env.DB.prepare("INSERT INTO clips VALUES (?, 3, 'clips/x.mp3', '2026-09-30T00:00:00Z')").bind(await clipHash(CAST[0].id, 'No.')).run();
    const after = await quote(env.DB, text, {});
    expect(after).toMatchObject({ cached: 3, toRender: 24, priceCents: 100 });
    // a different voice is a different clip
    expect((await quote(env.DB, text, { NELSON: CAST[1].id })).cached).toBe(0);
  });
  it('quotes over HTTP for a director, sets voices, refuses cast', async () => {
    const ann = await signIn('ann14@example.com'), bob = await signIn('bob14@example.com');
    const { production } = await (await ann.call('POST', '/productions', { name: 'Vanya' })).json() as { production: { id: string } };
    await env.DB.prepare("INSERT INTO members VALUES (?, ?, 'cast', '[]', '2026-09-30T00:00:00Z')").bind(bob.user.id, production.id).run();
    expect((await ann.call('POST', `/productions/${production.id}/render/quote`)).status).toBe(404);
    await ann.call('PUT', `/productions/${production.id}/script`, { title: 'Vanya', text: 'VANYA: I am fifty-seven.' });
    expect((await bob.call('POST', `/productions/${production.id}/render/quote`)).status).toBe(403);
    expect((await ann.call('PUT', `/productions/${production.id}/voices`, { VANYA: 'not-a-voice' })).status).toBe(400);
    expect((await ann.call('PUT', `/productions/${production.id}/voices`, { VANYA: CAST[3].id })).status).toBe(200);
    const { quote: q } = await (await ann.call('POST', `/productions/${production.id}/render/quote`)).json() as { quote: { toRender: number; priceCents: number; speakers: Record<string, { voice: string }> } };
    expect(q).toMatchObject({ toRender: 'I am fifty-seven.'.length, priceCents: 100, speakers: { VANYA: { voice: CAST[3].id } } });
    expect((await (await bob.call('GET', `/productions/${production.id}/voices`)).json() as { voices: Record<string, string> }).voices).toEqual({ VANYA: CAST[3].id });
  });
});
