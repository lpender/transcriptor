import { describe, expect, it } from 'vitest';
import { handle } from '../src/router';
import '../src/routes/auth';
import '../src/routes/productions';
import '../src/routes/sound';
import { env } from './env';
import { signIn } from './helpers';

const upload = (headers: Record<string, string>, pid: string, q: string, body: string, type = 'audio/mpeg') =>
  handle(new Request(`http://x/productions/${pid}/sound?${q}`, { method: 'POST', headers: { ...headers, 'content-type': type, 'content-length': String(body.length) }, body }), env);

describe('sound and cues', () => {
  it('uploads for crew, lists, assigns cues, refuses deleting a used file, serves it', async () => {
    const ann = await signIn('ann19@example.com'), cy = await signIn('cy19@example.com'), bob = await signIn('bob19@example.com');
    const { production } = await (await ann.call('POST', '/productions', { name: 'Sound' })).json() as { production: { id: string } };
    await env.DB.prepare("INSERT INTO members VALUES (?, ?, 'crew', '[]', '2026-09-30T00:00:00Z')").bind(cy.user.id, production.id).run();
    await env.DB.prepare("INSERT INTO members VALUES (?, ?, 'cast', '[]', '2026-09-30T00:00:00Z')").bind(bob.user.id, production.id).run();
    expect((await upload(bob.headers, production.id, 'name=x&kind=bed', 'mp3data')).status).toBe(403);
    expect((await upload(cy.headers, production.id, 'name=x&kind=song', 'mp3data')).status).toBe(400);
    expect((await upload(cy.headers, production.id, 'name=x&kind=bed', 'nope', 'text/plain')).status).toBe(415);
    const bed = await upload(cy.headers, production.id, 'name=Office%20fans&kind=bed&seconds=61.5&gain=-2.5', 'mp3-bed');
    expect(bed.status).toBe(201);
    const { sound: b } = await bed.json() as { sound: { id: string; url: string; gain_db: number } };
    expect(b.gain_db).toBe(-2.5);
    const { sound: m } = await (await upload(cy.headers, production.id, 'name=Celli&kind=music', 'mp3-music')).json() as { sound: { id: string } };
    const listed = await (await bob.call('GET', `/productions/${production.id}/sound`)).json() as { sound: { name: string; kind: string }[] };
    expect(listed.sound.map((s) => [s.kind, s.name])).toEqual([['bed', 'Office fans'], ['music', 'Celli']]);

    expect((await cy.call('PUT', `/productions/${production.id}/cues`, [{ name: 'A' }, { name: 'A' }])).status).toBe(400);
    expect((await cy.call('PUT', `/productions/${production.id}/cues`, [{ name: 'A', bed: 'nope' }])).status).toBe(400);
    expect((await cy.call('PUT', `/productions/${production.id}/cues`, [{ name: 'Before the show', music: m.id, bed: b.id, hold: true }, { name: 'Reception', bed: b.id }])).status).toBe(200);
    const { cues, gains } = await (await bob.call('GET', `/productions/${production.id}/cues`)).json() as { cues: { name: string; music?: string; bed?: string; hold: boolean }[]; gains: Record<string, number> };
    expect(cues.map((c) => [c.name, !!c.music, !!c.bed, c.hold])).toEqual([['Before the show', true, true, true], ['Reception', false, true, false]]);
    expect(cues[0].bed).toBe(b.url);
    expect(gains[b.url.split('/').pop()!]).toBe(-2.5);

    expect((await cy.call('DELETE', `/productions/${production.id}/sound/${b.id}`)).status).toBe(409);
    await cy.call('PUT', `/productions/${production.id}/cues`, []);
    expect((await cy.call('DELETE', `/productions/${production.id}/sound/${b.id}`)).status).toBe(200);
    const served = await handle(new Request(`http://x/${m.id ? (await env.DB.prepare('SELECT r2_key FROM sound WHERE id = ?').bind(m.id).first<{ r2_key: string }>())!.r2_key : ''}`), env);
    expect(served.status).toBe(200);
    expect(served.headers.get('content-type')).toBe('audio/mpeg');
    expect(await served.text()).toBe('mp3-music');
    expect((await handle(new Request(`http://x/${b.url.split('/').slice(-2).join('/')}`), env)).status).toBe(404);   // deleted from R2 too
  });
});
