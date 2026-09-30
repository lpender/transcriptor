//   GET /productions/:id/room  (Upgrade: websocket)  → the production's Room  [read]
// The session rides the upgrade request (same-site cookie); the Worker checks
// membership and hands the socket to the Durable Object with who and what role.
import { gate } from '../productions';
import { error, route } from '../router';

route('GET', '/productions/:id/room', async (req, env, { id }) => {
  if (req.headers.get('upgrade') !== 'websocket') return error('websocket_only', 426, 'Open this with a WebSocket.');
  const g = await gate(env.DB, req, id, 'read');
  if (g instanceof Response) return g;
  const stub = env.ROOMS.get(env.ROOMS.idFromName(id));
  const headers = new Headers(req.headers);
  headers.set('x-user', g.user.email);
  headers.set('x-role', g.role);
  return stub.fetch(new Request(req.url, { method: 'GET', headers }));
});
