import { describe, expect, it } from 'vitest';
import '../src/routes/auth';
import '../src/routes/productions';
import '../src/routes/scripts';
import '../src/routes/voices';
import { clipHash, DEFAULT_VOICE, plan } from '../src/voices';
import { env } from './env';
import { signIn } from './helpers';

describe('say as', () => {
  it('changes what is spoken and therefore the clip', async () => {
    const text = "NELSON: That's what I said.";
    const plain = await plan(text, {});
    const stressed = await plan(text, {}, { "NELSON: That's what I said.": 'That\'s what "I" said.' });
    expect(plain[0].say).toBe("That's what I said.");
    expect(stressed[0].say).toBe('That\'s what "I" said.');
    expect(stressed[0].hash).toBe(await clipHash(DEFAULT_VOICE, 'That\'s what "I" said.'));
    expect(stressed[0].hash).not.toBe(plain[0].hash);
  });
  it('is set by a director, read by cast, removed by an empty say', async () => {
    const ann = await signIn('ann18@example.com'), bob = await signIn('bob18@example.com');
    const { production } = await (await ann.call('POST', '/productions', { name: 'Stress' })).json() as { production: { id: string } };
    await env.DB.prepare("INSERT INTO members VALUES (?, ?, 'cast', '[]', '2026-09-30T00:00:00Z')").bind(bob.user.id, production.id).run();
    await ann.call('PUT', `/productions/${production.id}/script`, { title: 'S', text: 'A: Eight thousand years.' });
    expect((await bob.call('PUT', `/productions/${production.id}/sayas`, { 'A: Eight thousand years.': 'Eight THOUSAND years.' })).status).toBe(403);
    expect((await ann.call('PUT', `/productions/${production.id}/sayas`, ['no'])).status).toBe(400);
    expect(await (await ann.call('PUT', `/productions/${production.id}/sayas`, { 'A: Eight thousand years.': 'Eight THOUSAND years.' })).json()).toEqual({ sayas: { 'A: Eight thousand years.': 'Eight THOUSAND years.' } });
    expect((await (await bob.call('GET', `/productions/${production.id}/sayas`)).json() as { sayas: Record<string, string> }).sayas).toEqual({ 'A: Eight thousand years.': 'Eight THOUSAND years.' });
    const { quote } = await (await ann.call('POST', `/productions/${production.id}/render/quote`)).json() as { quote: { toRender: number } };
    expect(quote.toRender).toBe('Eight THOUSAND years.'.length);
    expect(await (await ann.call('PUT', `/productions/${production.id}/sayas`, { 'A: Eight thousand years.': '' })).json()).toEqual({ sayas: {} });
  });
});
