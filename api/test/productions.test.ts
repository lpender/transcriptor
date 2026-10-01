import { describe, expect, it } from 'vitest';
import { handle } from '../src/router';
import '../src/routes/auth';
import '../src/routes/productions';
import { env } from './env';
import { signIn } from './helpers';

describe('productions', () => {
  it('creates with the caller as owner and lists it', async () => {
    const ann = await signIn('ann@example.com');
    const made = await ann.call('POST', '/productions', { name: ' Waiting ' });
    expect(made.status).toBe(201);
    const { production } = await made.json() as { production: { id: string; name: string } };
    expect(production.name).toBe('Waiting');
    const mine = await (await ann.call('GET', '/productions')).json() as { productions: { id: string; role: string; members: number; parts: string[] }[] };
    expect(mine.productions).toEqual([expect.objectContaining({ id: production.id, role: 'owner', members: 1 })]);
  });
  it('hides a production from non-members and gates by role', async () => {
    const ann = await signIn('ann2@example.com'), bob = await signIn('bob2@example.com');
    const { production } = await (await ann.call('POST', '/productions', { name: 'Hamlet' })).json() as { production: { id: string } };
    expect((await bob.call('GET', `/productions/${production.id}`)).status).toBe(403);
    expect(await (await bob.call('GET', `/productions/${production.id}`)).json()).toEqual({ error: 'forbidden' });
    // add bob as cast directly, then he can read but not share
    await env.DB.prepare("INSERT INTO members VALUES (?, ?, 'cast', '[]', '2026-09-30T00:00:00Z')").bind(bob.user.id, production.id).run();
    const seen = await bob.call('GET', `/productions/${production.id}`);
    expect(seen.status).toBe(200);
    expect((await seen.json() as { role: string; members: unknown[] }).members).toHaveLength(2);
    const tried = await bob.call('PUT', `/productions/${production.id}/members/${ann.user.id}`, { role: 'cast' });
    expect(tried.status).toBe(403);
    expect(await tried.json()).toEqual({ error: 'not_allowed' });
  });
  it('changes roles, protects the last owner, lets members leave', async () => {
    const ann = await signIn('ann3@example.com'), bob = await signIn('bob3@example.com');
    const { production } = await (await ann.call('POST', '/productions', { name: 'Lear' })).json() as { production: { id: string } };
    await env.DB.prepare("INSERT INTO members VALUES (?, ?, 'crew', '[]', '2026-09-30T00:00:00Z')").bind(bob.user.id, production.id).run();
    expect((await ann.call('PUT', `/productions/${production.id}/members/${ann.user.id}`, { role: 'cast' })).status).toBe(409);   // last owner
    expect((await ann.call('DELETE', `/productions/${production.id}/members/${ann.user.id}`)).status).toBe(409);
    expect((await ann.call('PUT', `/productions/${production.id}/members/${bob.user.id}`, { role: 'god' })).status).toBe(400);
    expect((await ann.call('PUT', `/productions/${production.id}/members/${bob.user.id}`, { role: 'owner' })).status).toBe(200);
    expect((await ann.call('PUT', `/productions/${production.id}/members/${ann.user.id}`, { role: 'director' })).status).toBe(200);
    // a director may not make owners
    expect((await ann.call('PUT', `/productions/${production.id}/members/${ann.user.id}`, { role: 'owner' })).status).toBe(403);
    // bob (now owner) may not be removed by ann? ann is director with share: yes she can remove others, but not the last owner
    expect((await ann.call('DELETE', `/productions/${production.id}/members/${bob.user.id}`)).status).toBe(409);
    // ann leaves
    expect((await ann.call('DELETE', `/productions/${production.id}/members/${ann.user.id}`)).status).toBe(200);
    expect((await ann.call('GET', `/productions/${production.id}`)).status).toBe(403);
  });
  it('sets parts for yourself, or for others only with share', async () => {
    const ann = await signIn('ann4@example.com'), bob = await signIn('bob4@example.com');
    const { production } = await (await ann.call('POST', '/productions', { name: 'Godot' })).json() as { production: { id: string } };
    await env.DB.prepare("INSERT INTO members VALUES (?, ?, 'cast', '[]', '2026-09-30T00:00:00Z')").bind(bob.user.id, production.id).run();
    expect((await bob.call('PUT', `/productions/${production.id}/members/${bob.user.id}/parts`, { parts: ['VLADIMIR'] })).status).toBe(200);
    expect((await bob.call('PUT', `/productions/${production.id}/members/${ann.user.id}/parts`, { parts: ['ESTRAGON'] })).status).toBe(403);
    expect((await ann.call('PUT', `/productions/${production.id}/members/${bob.user.id}/parts`, { parts: ['VLADIMIR', 'LUCKY'] })).status).toBe(200);
    expect((await ann.call('PUT', `/productions/${production.id}/members/${bob.user.id}/parts`, { parts: 'no' })).status).toBe(400);
    const { members } = await (await ann.call('GET', `/productions/${production.id}`)).json() as { members: { email: string; parts: string[] }[] };
    expect(members.find((m) => m.email === 'bob4@example.com')?.parts).toEqual(['VLADIMIR', 'LUCKY']);
  });
  it('renames for a director, not for cast', async () => {
    const ann = await signIn('ann26@example.com'), bob = await signIn('bob26@example.com');
    const { production } = await (await ann.call('POST', '/productions', { name: 'Untitled' })).json() as { production: { id: string } };
    await env.DB.prepare("INSERT INTO members VALUES (?, ?, 'cast', '[]', '2026-09-30T00:00:00Z')").bind(bob.user.id, production.id).run();
    expect((await bob.call('PUT', `/productions/${production.id}`, { name: 'Hamlet' })).status).toBe(403);
    expect((await ann.call('PUT', `/productions/${production.id}`, { name: '  ' })).status).toBe(400);
    expect(await (await ann.call('PUT', `/productions/${production.id}`, { name: ' The Tempest ' })).json()).toEqual({ production: { id: production.id, name: 'The Tempest' } });
    expect(((await (await bob.call('GET', `/productions/${production.id}`)).json()) as { production: { name: string } }).production.name).toBe('The Tempest');
  });
  it('401s signed out', async () => {
    expect((await handle(new Request('http://x/productions'), env)).status).toBe(401);
  });
});
