import { describe, expect, it } from 'vitest';
import { parseScript, printScript } from '../src/shared';
import { handle } from '../src/router';
import '../src/routes/auth';
import '../src/routes/mcp';
import '../src/routes/productions';
import '../src/routes/scripts';
import { env } from './env';
import { signIn } from './helpers';

const PLAY = `NELSON: No.\nRECEPTIONIST: Highlights for Children.\n***\nMR. MCMARTIN: Eight thousand years.\n\nNELSON: Eight hundred.`;

describe('parseScript', () => {
  it('reads the format, counts speakers, keeps scenes', () => {
    const p = parseScript(PLAY);
    expect(p.scenes.map((s) => s.length)).toEqual([2, 2]);
    expect(p.speakers).toEqual({ NELSON: 2, RECEPTIONIST: 1, 'MR. MCMARTIN': 1 });
    expect(p.errors).toEqual([]);
    expect(printScript(p.scenes)).toBe('NELSON: No.\nRECEPTIONIST: Highlights for Children.\n***\nMR. MCMARTIN: Eight thousand years.\nNELSON: Eight hundred.');
  });
  it('reports what is not a speech, with line numbers', () => {
    const p = parseScript('NELSON: Fine.\n(He sits.)\nlowercase: no\nACT ONE\n***\n***\nNELSON: Ok');
    expect(p.errors).toEqual([{ line: 2, text: '(He sits.)' }, { line: 3, text: 'lowercase: no' }, { line: 4, text: 'ACT ONE' }]);
    expect(p.scenes).toHaveLength(2);   // a double break is one break
  });
});

describe('scripts over HTTP and MCP', () => {
  it('saves for a director, refuses cast, replaces, and reads back', async () => {
    const ann = await signIn('ann11@example.com'), bob = await signIn('bob11@example.com');
    const { production } = await (await ann.call('POST', '/productions', { name: 'Waiting' })).json() as { production: { id: string } };
    await env.DB.prepare("INSERT INTO members VALUES (?, ?, 'cast', '[]', '2026-09-30T00:00:00Z')").bind(bob.user.id, production.id).run();
    expect((await ann.call('GET', `/productions/${production.id}/script`)).status).toBe(404);
    const bad = await ann.call('PUT', `/productions/${production.id}/script`, { title: 'Waiting', text: 'NELSON: Hi\n(beat)' });
    expect(bad.status).toBe(400);
    expect(await bad.json()).toEqual({ error: 'bad_lines', errors: [{ line: 2, text: '(beat)' }] });
    const ok = await ann.call('PUT', `/productions/${production.id}/script`, { title: 'Waiting', text: PLAY });
    expect(ok.status).toBe(200);
    expect(await ok.json()).toMatchObject({ speakers: { NELSON: 2 }, scenes: 2, lines: 4 });
    expect((await bob.call('PUT', `/productions/${production.id}/script`, { title: 'x', text: PLAY })).status).toBe(403);
    await ann.call('PUT', `/productions/${production.id}/script`, { title: 'Waiting v2', text: 'NELSON: Yes.' });
    const got = await (await bob.call('GET', `/productions/${production.id}/script`)).json() as { script: { title: string; text: string } };
    expect(got.script).toMatchObject({ title: 'Waiting v2', text: 'NELSON: Yes.' });
    const kept = await env.DB.prepare('SELECT COUNT(*) AS n FROM scripts WHERE production_id = ? AND replaced_at IS NOT NULL').bind(production.id).first<{ n: number }>();
    expect(kept?.n).toBe(1);
  });
  it('does the same over MCP', async () => {
    const ann = await signIn('ann12@example.com');
    const { production } = await (await ann.call('POST', '/productions', { name: 'Lear' })).json() as { production: { id: string } };
    const { token } = await (await ann.call('POST', '/tokens', { label: 't' })).json() as { token: string };
    const mcp = async (name: string, args: unknown) => {
      const r = await handle(new Request('http://x/mcp', { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }) }), env);
      const { result } = await r.json() as { result: { content: { text: string }[]; isError?: boolean } };
      return { text: result.content[0].text, isError: !!result.isError };
    };
    const err = await mcp('add_script', { production: production.id, title: 'Lear', text: 'LEAR: Howl.\nStorm.' });
    expect(err.isError).toBe(true);
    expect(err.text).toContain('2: Storm.');
    const ok = await mcp('add_script', { production: production.id, title: 'Lear', text: 'LEAR: Howl, howl.\nFOOL: Nuncle.' });
    expect(JSON.parse(ok.text)).toMatchObject({ speakers: { LEAR: 1, FOOL: 1 }, lines: 2 });
    const back = JSON.parse((await mcp('get_script', { production: production.id })).text) as { text: string };
    expect(back.text).toBe('LEAR: Howl, howl.\nFOOL: Nuncle.');
    expect((await mcp('get_script', { production: 'nope' })).isError).toBe(true);
  });
});
