import { describe, expect, it } from 'vitest';
import { handle } from '../src/router';
import '../src/routes/auth';
import '../src/routes/invites';
import '../src/routes/mcp';
import '../src/routes/mcp-members';
import '../src/routes/productions';
import '../src/routes/progress';
import '../src/routes/scripts';
import { env } from './env';
import { signIn } from './helpers';

const mcpFor = (token: string) => async (name: string, args: unknown) => {
  const r = await handle(new Request('http://x/mcp', { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }) }), env);
  const { result } = await r.json() as { result: { content: { text: string }[]; isError?: boolean } };
  return { text: result.content[0].text, isError: !!result.isError, json: () => JSON.parse(result.content[0].text) };
};

describe('members over MCP', () => {
  it('lists, sets parts by role, and invites', async () => {
    const ann = await signIn('ann13@example.com'), bob = await signIn('bob13@example.com');
    const { production } = await (await ann.call('POST', '/productions', { name: 'Godot' })).json() as { production: { id: string } };
    await env.DB.prepare("INSERT INTO members VALUES (?, ?, 'cast', '[]', '2026-09-30T00:00:00Z')").bind(bob.user.id, production.id).run();
    const a = mcpFor((await (await ann.call('POST', '/tokens', { label: 'a' })).json() as { token: string }).token);
    const b = mcpFor((await (await bob.call('POST', '/tokens', { label: 'b' })).json() as { token: string }).token);
    expect((await a('list_members', { production: production.id })).json().members).toHaveLength(2);
    expect((await b('set_parts', { production: production.id, parts: ['VLADIMIR'] })).isError).toBe(false);
    expect((await b('set_parts', { production: production.id, email: 'ann13@example.com', parts: ['LUCKY'] })).isError).toBe(true);
    expect((await a('set_parts', { production: production.id, email: 'bob13@example.com', parts: ['VLADIMIR', 'POZZO'] })).isError).toBe(false);
    expect((await a('set_parts', { production: production.id, email: 'nobody@example.com', parts: [] })).text).toContain('No member');
    const listed = (await a('list_members', { production: production.id })).json().members as { email: string; parts: string[] }[];
    expect(listed.find((m) => m.email === 'bob13@example.com')?.parts).toEqual(['VLADIMIR', 'POZZO']);
    expect((await b('invite', { production: production.id, role: 'cast' })).isError).toBe(true);
    expect((await a('invite', { production: production.id, role: 'owner' })).isError).toBe(true);
    const inv = (await a('invite', { production: production.id, role: 'crew' })).json() as { url: string; role: string };
    expect(inv.role).toBe('crew');
    const token = new URL(inv.url).searchParams.get('invite')!;
    expect((await handle(new Request(`http://x/invites/${token}`), env)).status).toBe(200);
    expect((await a('list_members', { production: 'nope' })).isError).toBe(true);
  });
  it('checks parts against the script and reports who is off book', async () => {
    const ann = await signIn('ann28@example.com'), bob = await signIn('bob28@example.com');
    const { production } = await (await ann.call('POST', '/productions', { name: 'Book' })).json() as { production: { id: string } };
    await env.DB.prepare("INSERT INTO members VALUES (?, ?, 'cast', '[]', '2026-09-30T00:00:00Z')").bind(bob.user.id, production.id).run();
    await ann.call('PUT', `/productions/${production.id}/script`, { title: 'B', text: 'VLADIMIR: Nothing to be done.\nESTRAGON: I am beginning to come round to that opinion.' });
    const a = mcpFor((await (await ann.call('POST', '/tokens', { label: 'a' })).json() as { token: string }).token);
    const b = mcpFor((await (await bob.call('POST', '/tokens', { label: 'b' })).json() as { token: string }).token);
    const bad = await b('set_parts', { production: production.id, parts: ['Pozzo'] });
    expect(bad.isError).toBe(true);
    expect(bad.text).toContain('VLADIMIR, ESTRAGON');
    expect((await b('set_parts', { production: production.id, parts: ['vladimir'] })).json().parts).toEqual(['VLADIMIR']);
    expect((await b('who_is_off_book', { production: production.id })).isError).toBe(true);
    let s = (await a('who_is_off_book', { production: production.id })).json().summary as string;
    expect(s).toContain('bob28@example.com (VLADIMIR): not started.');
    expect(s).toContain('ann28@example.com: no parts chosen yet (set_parts).');
    await bob.call('PUT', `/productions/${production.id}/me/progress`, { best: 3, total: 5, misses: { 'x': 1 } });
    s = (await a('who_is_off_book', { production: production.id })).json().summary as string;
    expect(s).toContain('bob28@example.com (VLADIMIR): 3 of 5 sentences clear, 1 weak.');
    await bob.call('PUT', `/productions/${production.id}/me/progress`, { best: 5, total: 5, misses: {} });
    s = (await a('who_is_off_book', { production: production.id })).json().summary as string;
    expect(s).toContain('bob28@example.com (VLADIMIR): off book.');
  });
});
