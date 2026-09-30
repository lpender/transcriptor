import { describe, expect, it } from 'vitest';
import { handle } from '../src/router';
import '../src/routes/auth';
import '../src/routes/mcp';
import '../src/routes/mcp-cues';
import '../src/routes/productions';
import '../src/routes/sound';
import { env } from './env';
import { signIn } from './helpers';

const mcpFor = (token: string) => async (name: string, args: unknown) => {
  const r = await handle(new Request('http://x/mcp', { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }) }), env);
  const { result } = await r.json() as { result: { content: { text: string }[]; isError?: boolean } };
  return { text: result.content[0].text, isError: !!result.isError, json: () => JSON.parse(result.content[0].text) };
};

describe('cues over MCP', () => {
  it('lists files, sets cues by file name, refuses cast and unknown files', async () => {
    const ann = await signIn('ann20@example.com'), bob = await signIn('bob20@example.com');
    const { production } = await (await ann.call('POST', '/productions', { name: 'Cues' })).json() as { production: { id: string } };
    await env.DB.prepare("INSERT INTO members VALUES (?, ?, 'cast', '[]', '2026-09-30T00:00:00Z')").bind(bob.user.id, production.id).run();
    const up = (q: string, body: string) => handle(new Request(`http://x/productions/${production.id}/sound?${q}`, { method: 'POST', headers: { ...ann.headers, 'content-type': 'audio/mpeg', 'content-length': String(body.length) }, body }), env);
    await up('name=Office%20fans&kind=bed&gain=-3', 'b');
    await up('name=Celli&kind=music', 'm');
    const a = mcpFor((await (await ann.call('POST', '/tokens', { label: 'a' })).json() as { token: string }).token);
    const b = mcpFor((await (await bob.call('POST', '/tokens', { label: 'b' })).json() as { token: string }).token);
    const listed = (await a('list_sound', { production: production.id })).json() as { sound: { name: string; kind: string; gain_db: number }[]; cues: unknown[] };
    expect(listed.sound.map((s) => [s.kind, s.name, s.gain_db])).toEqual([['bed', 'Office fans', -3], ['music', 'Celli', 0]]);
    expect(listed.cues).toEqual([]);
    expect((await b('set_cues', { production: production.id, cues: [{ name: 'A' }] })).isError).toBe(true);
    expect((await a('set_cues', { production: production.id, cues: [{ name: 'A', bed: 'Nope' }] })).text).toContain('does not have');
    expect((await a('set_cues', { production: production.id, cues: [{ name: 'Before the show', music: 'celli', bed: 'office fans', hold: true }, { name: 'Reception', bed: 'Office fans' }] })).json()).toEqual({ ok: true, cues: 2 });
    const after = (await b('list_sound', { production: production.id })).json() as { cues: { name: string; music: string | null; bed: string | null; hold: boolean }[] };
    expect(after.cues).toEqual([{ name: 'Before the show', music: 'Celli', bed: 'Office fans', hold: true }, { name: 'Reception', music: null, bed: 'Office fans', hold: false }]);
  });
});
