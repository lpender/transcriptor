import { describe, expect, it } from 'vitest';
import { handle } from '../src/router';
import '../src/routes/auth';
import '../src/routes/invites';
import '../src/routes/productions';
import { env } from './env';
import { signIn } from './helpers';

const anon = (method: string, path: string, body?: unknown) =>
  handle(new Request(`http://x${path}`, { method, headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }), env);

describe('invites', () => {
  it('mints, peeks, joins signed in, is multi-use, and revokes', async () => {
    const ann = await signIn('ann5@example.com'), bob = await signIn('bob5@example.com'), cy = await signIn('cy5@example.com');
    const { production } = await (await ann.call('POST', '/productions', { name: 'Macbeth' })).json() as { production: { id: string } };
    expect((await ann.call('POST', `/productions/${production.id}/invites`, { role: 'owner' })).status).toBe(400);
    const minted = await ann.call('POST', `/productions/${production.id}/invites`, { role: 'cast' });
    expect(minted.status).toBe(201);
    const { url, invite } = await minted.json() as { url: string; invite: { id: string } };
    const token = new URL(url).searchParams.get('invite')!;
    expect((await (await anon('GET', `/invites/${token}`)).json() as { role: string; production: { name: string } })).toMatchObject({ role: 'cast', production: { name: 'Macbeth' } });
    expect(await (await bob.call('POST', `/invites/${token}/accept`)).json()).toMatchObject({ joined: 'joined' });
    expect(await (await cy.call('POST', `/invites/${token}/accept`)).json()).toMatchObject({ joined: 'joined' });   // multi-use
    expect(await (await bob.call('POST', `/invites/${token}/accept`)).json()).toMatchObject({ joined: 'already' });
    const { members } = await (await ann.call('GET', `/productions/${production.id}`)).json() as { members: { email: string; role: string }[] };
    expect(members.map((m) => [m.email, m.role])).toEqual([['ann5@example.com', 'owner'], ['bob5@example.com', 'cast'], ['cy5@example.com', 'cast']]);
    expect((await bob.call('GET', `/productions/${production.id}/invites`)).status).toBe(403);   // cast may not share
    expect((await ann.call('DELETE', `/productions/${production.id}/invites/${invite.id}`)).status).toBe(200);
    expect((await anon('GET', `/invites/${token}`)).status).toBe(404);
    expect((await signIn('dee5@example.com')).call('POST', `/invites/${token}/accept`).then((r) => r.status)).resolves.toBe(404);
  });
  it('joins a signed-out person through a magic link that both signs in and joins', async () => {
    const ann = await signIn('ann6@example.com');
    const { production } = await (await ann.call('POST', '/productions', { name: 'Othello' })).json() as { production: { id: string } };
    const { url } = await (await ann.call('POST', `/productions/${production.id}/invites`, { role: 'crew' })).json() as { url: string };
    const token = new URL(url).searchParams.get('invite')!;
    expect((await anon('POST', `/invites/${token}/accept`, {})).status).toBe(401);
    const asked = await anon('POST', `/invites/${token}/accept`, { email: 'new6@example.com' });
    expect(asked.status).toBe(202);
    const { link } = await asked.json() as { link: string };
    const verified = await handle(new Request(link), env);
    expect(verified.headers.get('location')).toBe(`${env.APP_ORIGIN}/?joined=${production.id}`);
    const cookie = verified.headers.get('set-cookie')!.split(';')[0];
    const seen = await handle(new Request(`http://x/productions/${production.id}`, { headers: { cookie } }), env);
    expect((await seen.json() as { role: string }).role).toBe('crew');
  });
  it('drops an expired invite', async () => {
    const ann = await signIn('ann7@example.com');
    const { production } = await (await ann.call('POST', '/productions', { name: 'Tempest' })).json() as { production: { id: string } };
    const { url } = await (await ann.call('POST', `/productions/${production.id}/invites`, { role: 'cast' })).json() as { url: string };
    await env.DB.prepare("UPDATE invites SET expires_at = '2000-01-01T00:00:00Z' WHERE production_id = ?").bind(production.id).run();
    expect((await anon('GET', `/invites/${new URL(url).searchParams.get('invite')}`)).status).toBe(404);
  });
});
