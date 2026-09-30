// The production's room: one Durable Object, every device a WebSocket
// (docs/design/relay.md). The Worker has already checked the session and the
// membership; it passes who and what role in headers. Moves from a leader are
// stamped with a growing sequence, kept as the last move for late joiners, and
// sent to everyone else. Hibernation keeps idle sockets free.
import { DurableObject } from 'cloudflare:workers';
import { can, type Role } from './access';

interface Who { email: string; role: Role; leading: boolean }
export interface Move { type: 'move'; seq: number; i: number; text: string; scriptId: string; from: string; at: string }

export class Room extends DurableObject {
  async fetch(req: Request): Promise<Response> {
    if (req.headers.get('upgrade') !== 'websocket') return new Response('websocket only', { status: 426 });
    const who: Who = { email: req.headers.get('x-user') ?? '', role: (req.headers.get('x-role') as Role) ?? 'cast', leading: false };
    if (!who.email) return new Response('who?', { status: 400 });
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment(who);
    const last = await this.ctx.storage.get<Move>('last');
    server.send(JSON.stringify({ type: 'hello', you: who, last: last ?? null }));
    this.presence();
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    let msg: Record<string, unknown>;
    try { msg = JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw)); } catch { return; }
    const who = ws.deserializeAttachment() as Who;
    switch (msg.type) {
      case 'ping': ws.send(JSON.stringify({ type: 'pong' })); return;
      case 'lead': {   // take or give up the lead; only a role that may
        const want = !!msg.on;
        if (want && !can(who.role, 'lead')) { ws.send(JSON.stringify({ type: 'refused', why: 'Your part cannot lead.' })); return; }
        ws.serializeAttachment({ ...who, leading: want });
        this.presence();
        return;
      }
      case 'move': {
        if (!who.leading || !can(who.role, 'lead')) { ws.send(JSON.stringify({ type: 'refused', why: 'Only the leader moves the room.' })); return; }
        const i = Number(msg.i), text = String(msg.text ?? '').slice(0, 2000), scriptId = String(msg.scriptId ?? '').slice(0, 32);
        if (!Number.isInteger(i) || i < 0) return;
        const seq = ((await this.ctx.storage.get<number>('seq')) ?? 0) + 1;
        const move: Move = { type: 'move', seq, i, text, scriptId, from: who.email, at: new Date().toISOString() };
        await this.ctx.storage.put({ seq, last: move });
        this.broadcast(move, ws);
        return;
      }
    }
  }

  webSocketClose(ws: WebSocket): void { ws.close(); this.presence(); }
  webSocketError(ws: WebSocket): void { ws.close(); this.presence(); }

  private broadcast(msg: unknown, except?: WebSocket): void {
    const text = JSON.stringify(msg);
    for (const s of this.ctx.getWebSockets()) if (s !== except) { try { s.send(text); } catch { /* gone; close will follow */ } }
  }
  private presence(): void {
    const who = this.ctx.getWebSockets().map((s) => s.deserializeAttachment() as Who);
    this.broadcast({ type: 'who', who });
  }
}
