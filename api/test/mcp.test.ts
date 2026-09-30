import { describe, expect, it } from 'vitest';
import { handle } from '../src/router';
import '../src/routes/auth';
import '../src/routes/mcp';
import '../src/routes/productions';
import { env } from './env';
import { signIn } from './helpers';

const call = (token: string, body: unknown) =>
  handle(new Request('http://x/mcp', { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(body) }), env);

describe('personal tokens and MCP', () => {
  it('mints a token, speaks MCP, lists and revokes', async () => {
    const ann = await signIn('ann10@example.com');
    await ann.call('POST', '/productions', { name: 'Uncle Vanya' });
    expect((await ann.call('POST', '/tokens', { label: '' })).status).toBe(400);
    const made = await ann.call('POST', '/tokens', { label: 'Claude on the laptop' });
    expect(made.status).toBe(201);
    const { token, mcpUrl } = await made.json() as { token: string; mcpUrl: string };
    expect(mcpUrl).toBe(`${env.API_ORIGIN}/mcp`);

    const init = await (await call(token, { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '0' } } })).json() as { result: { serverInfo: { name: string } } };
    expect(init.result.serverInfo.name).toBe('tablework');
    expect((await call(token, { jsonrpc: '2.0', method: 'notifications/initialized' })).status).toBe(202);
    const list = await (await call(token, { jsonrpc: '2.0', id: 2, method: 'tools/list' })).json() as { result: { tools: { name: string }[] } };
    expect(list.result.tools.map((t) => t.name)).toEqual(expect.arrayContaining(['whoami', 'list_productions']));
    const who = await (await call(token, { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'whoami', arguments: {} } })).json() as { result: { content: { text: string }[] } };
    const parsed = JSON.parse(who.result.content[0].text) as { user: { email: string }; productions: { name: string; role: string }[] };
    expect(parsed.user.email).toBe('ann10@example.com');
    expect(parsed.productions).toEqual([expect.objectContaining({ name: 'Uncle Vanya', role: 'owner' })]);
    const bad = await (await call(token, { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'nope' } })).json() as { error: { code: number } };
    expect(bad.error.code).toBe(-32602);
    expect((await (await call(token, { jsonrpc: '2.0', id: 5, method: 'bogus' })).json() as { error: { code: number } }).error.code).toBe(-32601);

    const { tokens } = await (await ann.call('GET', '/tokens')).json() as { tokens: { id: string; label: string }[] };
    expect(tokens.map((t) => t.label)).toEqual(['Claude on the laptop']);
    expect((await ann.call('DELETE', `/tokens/${tokens[0].id}`)).status).toBe(200);
    expect((await call(token, { jsonrpc: '2.0', id: 6, method: 'ping' })).status).toBe(401);
  });
  it('401s without a bearer and never lists login sessions as tokens', async () => {
    const r = await handle(new Request('http://x/mcp', { method: 'POST', body: '{}' }), env);
    expect(r.status).toBe(401);
    expect(r.headers.get('www-authenticate')).toContain('Bearer');
    const bob = await signIn('bob10@example.com');
    expect((await (await bob.call('GET', '/tokens')).json() as { tokens: unknown[] }).tokens).toEqual([]);
  });
});
