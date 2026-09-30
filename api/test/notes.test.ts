import { describe, expect, it } from 'vitest';
import '../src/routes/auth';
import '../src/routes/notes';
import '../src/routes/productions';
import { env } from './env';
import { signIn } from './helpers';

describe('notes', () => {
  it('are the member\'s own: set, read back, removed by an empty note, invisible to others', async () => {
    const ann = await signIn('ann27@example.com'), bob = await signIn('bob27@example.com'), cy = await signIn('cy27@example.com');
    const { production } = await (await ann.call('POST', '/productions', { name: 'Notes' })).json() as { production: { id: string } };
    await env.DB.prepare("INSERT INTO members VALUES (?, ?, 'cast', '[]', '2026-09-30T00:00:00Z')").bind(bob.user.id, production.id).run();
    await env.DB.prepare("INSERT INTO members VALUES (?, ?, 'crew', '[]', '2026-09-30T00:00:00Z')").bind(cy.user.id, production.id).run();
    expect((await cy.call('GET', `/productions/${production.id}/me/notes`)).status).toBe(403);   // crew do not learn
    expect((await bob.call('PUT', `/productions/${production.id}/me/notes`, ['x'])).status).toBe(400);
    const put = await bob.call('PUT', `/productions/${production.id}/me/notes`, { 'NELSON: No.': ' beat before ', 'NELSON: Yes.': 'louder' });
    expect(await put.json()).toEqual({ notes: { 'NELSON: No.': 'beat before', 'NELSON: Yes.': 'louder' } });
    expect((await (await ann.call('GET', `/productions/${production.id}/me/notes`)).json() as { notes: object }).notes).toEqual({});   // not hers
    await bob.call('PUT', `/productions/${production.id}/me/notes`, { 'NELSON: No.': 'beat, then dry', 'NELSON: Yes.': '' });
    expect((await (await bob.call('GET', `/productions/${production.id}/me/notes`)).json() as { notes: object }).notes).toEqual({ 'NELSON: No.': 'beat, then dry' });
  });
});
