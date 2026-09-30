import { describe, expect, it } from 'vitest';
import { env } from './env';

// Open a socket into the room as someone; collect what arrives; wait on facts, not clocks.
async function join(room: DurableObjectStub, email: string, role: string) {
  const res = await room.fetch('http://room/', { headers: { upgrade: 'websocket', 'x-user': email, 'x-role': role } });
  const ws = res.webSocket!;
  ws.accept();
  const got: Record<string, unknown>[] = [];
  ws.addEventListener('message', (e) => { got.push(JSON.parse(e.data as string)); });
  const send = (m: unknown) => ws.send(JSON.stringify(m));
  const of = (type: string) => got.filter((m) => m.type === type);
  const until = async (pred: () => boolean, what: string) => {
    for (let i = 0; i < 100; i++) { if (pred()) return; await new Promise((r) => setTimeout(r, 30)); }
    throw new Error(`waited 3 s for ${what}; got ${JSON.stringify(got)}`);
  };
  return { ws, got, send, of, until };
}

describe('the room', () => {
  it('lets a director lead, orders moves, refuses cast, remembers the last move for a late joiner', async () => {
    const room = env.ROOMS.get(env.ROOMS.idFromName('prod-1'));
    const dir = await join(room, 'dir@example.com', 'director');
    const cast = await join(room, 'cast@example.com', 'cast');
    await dir.until(() => dir.of('hello').length === 1, 'hello');
    expect((dir.got[0] as { last: unknown }).last).toBeNull();
    cast.send({ type: 'lead', on: true });
    await cast.until(() => cast.of('refused').length === 1, 'lead refused');
    cast.send({ type: 'move', i: 3, text: 'x', scriptId: 's' });
    await cast.until(() => cast.of('refused').length === 2, 'move refused');
    dir.send({ type: 'lead', on: true });
    await cast.until(() => cast.of('who').some((m) => (m as { who: { email: string; leading: boolean }[] }).who.some((w) => w.email === 'dir@example.com' && w.leading)), 'director leading');
    dir.send({ type: 'move', i: 3, text: 'NELSON: No.', scriptId: 'abc' });
    dir.send({ type: 'move', i: 4, text: 'NELSON: Yes.', scriptId: 'abc' });
    await cast.until(() => cast.of('move').length === 2, 'two moves');
    const moves = cast.of('move') as { seq: number; i: number; from: string }[];
    expect(moves.map((m) => [m.seq, m.i])).toEqual([[1, 3], [2, 4]]);
    expect(moves[0].from).toBe('dir@example.com');
    expect(dir.of('move')).toHaveLength(0);   // not echoed to the sender
    const late = await join(room, 'late@example.com', 'cast');
    await late.until(() => late.of('hello').length === 1, 'late hello');
    expect((late.got[0] as { last: { seq: number; i: number } }).last).toMatchObject({ seq: 2, i: 4 });
    dir.send({ type: 'ping' });
    await dir.until(() => dir.of('pong').length === 1, 'pong');
    cast.ws.close();
    await dir.until(() => { const w = dir.of('who').at(-1) as { who: { email: string }[] } | undefined; return !!w && !w.who.some((x) => x.email === 'cast@example.com') && w.who.some((x) => x.email === 'late@example.com'); }, 'cast gone, late present');
  });
  it('refuses a plain request', async () => {
    const room = env.ROOMS.get(env.ROOMS.idFromName('prod-2'));
    expect((await room.fetch('http://room/')).status).toBe(426);
  });
});
