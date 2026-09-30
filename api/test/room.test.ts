import { describe, expect, it } from 'vitest';
import { env } from './env';

// Open a socket into the room as someone; collect what arrives.
async function join(room: DurableObjectStub, email: string, role: string) {
  const res = await room.fetch('http://room/', { headers: { upgrade: 'websocket', 'x-user': email, 'x-role': role } });
  const ws = res.webSocket!;
  ws.accept();
  const got: Record<string, unknown>[] = [];
  ws.addEventListener('message', (e) => { got.push(JSON.parse(e.data as string)); });
  const send = (m: unknown) => ws.send(JSON.stringify(m));
  const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms));
  return { ws, got, send, wait, of: (type: string) => got.filter((m) => m.type === type) };
}

describe('the room', () => {
  it('lets a director lead, orders moves, refuses cast, remembers the last move for a late joiner', async () => {
    const room = env.ROOMS.get(env.ROOMS.idFromName('prod-1'));
    const dir = await join(room, 'dir@example.com', 'director');
    const cast = await join(room, 'cast@example.com', 'cast');
    await dir.wait();
    expect((dir.got[0] as { type: string; last: unknown }).type).toBe('hello');
    expect((dir.got[0] as { last: unknown }).last).toBeNull();
    cast.send({ type: 'lead', on: true }); await cast.wait();
    expect(cast.of('refused')).toHaveLength(1);
    cast.send({ type: 'move', i: 3, text: 'x', scriptId: 's' }); await cast.wait();
    expect(cast.of('refused')).toHaveLength(2);
    dir.send({ type: 'lead', on: true }); await dir.wait();
    expect((cast.of('who').at(-1) as { who: { email: string; leading: boolean }[] }).who.find((w) => w.email === 'dir@example.com')?.leading).toBe(true);
    dir.send({ type: 'move', i: 3, text: 'NELSON: No.', scriptId: 'abc' });
    dir.send({ type: 'move', i: 4, text: 'NELSON: Yes.', scriptId: 'abc' });
    await cast.wait(400);
    const moves = cast.of('move') as { seq: number; i: number; from: string }[];
    expect(moves.map((m) => [m.seq, m.i])).toEqual([[1, 3], [2, 4]]);
    expect(moves[0].from).toBe('dir@example.com');
    expect(dir.of('move')).toHaveLength(0);   // not echoed to the sender
    const late = await join(room, 'late@example.com', 'cast'); await late.wait();
    expect((late.got[0] as { last: { seq: number; i: number } }).last).toMatchObject({ seq: 2, i: 4 });
    dir.send({ type: 'ping' }); await dir.wait();
    expect(dir.of('pong')).toHaveLength(1);
    cast.ws.close(); await dir.wait(400);
    const who = (dir.of('who').at(-1) as { who: { email: string }[] }).who.map((w) => w.email);
    expect(who).not.toContain('cast@example.com');
    expect(who).toContain('late@example.com');
  });
  it('refuses a plain request', async () => {
    const room = env.ROOMS.get(env.ROOMS.idFromName('prod-2'));
    expect((await room.fetch('http://room/')).status).toBe(426);
  });
});
