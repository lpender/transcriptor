import { describe, expect, it } from 'vitest';
import '../src/routes/auth';
import '../src/routes/productions';
import '../src/routes/progress';
import { env } from './env';
import { signIn } from './helpers';

describe('progress', () => {
  it('a member posts, the director reads everyone, cast may not', async () => {
    const ann = await signIn('ann8@example.com'), bob = await signIn('bob8@example.com');
    const { production } = await (await ann.call('POST', '/productions', { name: 'Hedda' })).json() as { production: { id: string } };
    await env.DB.prepare("INSERT INTO members VALUES (?, ?, 'cast', '[\"TESMAN\"]', '2026-09-30T00:00:00Z')").bind(bob.user.id, production.id).run();
    expect((await bob.call('PUT', `/productions/${production.id}/me/progress`, { best: 12, total: 40, misses: { 'No.': 2 } })).status).toBe(200);
    expect((await bob.call('PUT', `/productions/${production.id}/me/progress`, { best: -1, total: 40, misses: {} })).status).toBe(400);
    expect((await bob.call('PUT', `/productions/${production.id}/me/progress`, { best: 1, total: 1, misses: [] })).status).toBe(400);
    expect((await bob.call('PUT', `/productions/${production.id}/me/progress`, { best: 15, total: 40, misses: { 'No.': 1, 'Yes.': 3 } })).status).toBe(200);   // upsert
    expect((await bob.call('GET', `/productions/${production.id}/progress`)).status).toBe(403);
    const { progress } = await (await ann.call('GET', `/productions/${production.id}/progress`)).json() as { progress: { email: string; best: number; total: number; weak: number; parts: string[] }[] };
    expect(progress).toHaveLength(2);
    expect(progress).toEqual(expect.arrayContaining([
      expect.objectContaining({ email: 'ann8@example.com', best: 0, total: 0, weak: 0 }),
      expect.objectContaining({ email: 'bob8@example.com', best: 15, total: 40, weak: 2, parts: ['TESMAN'] }),
    ]));
  });
  it('crew may not post progress', async () => {
    const ann = await signIn('ann9@example.com'), cy = await signIn('cy9@example.com');
    const { production } = await (await ann.call('POST', '/productions', { name: 'Ghosts' })).json() as { production: { id: string } };
    await env.DB.prepare("INSERT INTO members VALUES (?, ?, 'crew', '[]', '2026-09-30T00:00:00Z')").bind(cy.user.id, production.id).run();
    expect((await cy.call('PUT', `/productions/${production.id}/me/progress`, { best: 1, total: 1, misses: {} })).status).toBe(403);
  });
});
