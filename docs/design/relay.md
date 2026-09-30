# Together on our own relay — the production's Durable Object (design round, 2026-09-30)

Replaces the public MQTT brokers for signed-in members (ADR 002). Decided
by the loop.

## Understand

Today `joinRoom()` speaks MQTT 3.1.1 over WebSocket to a public broker,
signs each move with a key from the room word, orders by the leader's
clock, retains the last move, heartbeats every 15 s. It works for one
show; it depends on three strangers' brokers and a shared word.

## Diverge

1. **Keep MQTT, host our own broker.** A server to run. Rejected.
2. **Durable Object per production**, WebSocket hibernation API. The DO
   knows who is connected, orders moves by its own clock, keeps the last
   move in its storage for late joiners, and drops when nobody is in.
   Free-plan SQLite-backed DOs. Chosen.
3. **Polling the API** (leader PUTs place, followers GET every second).
   Simplest; a second behind, a request a second per device. Rejected.
4. **WebRTC data channels** between devices. No server, but needs a
   signalling server anyway. Rejected.

## Skeptic

- Auth on a WebSocket: the app's session cookie rides the upgrade request
  when the API is same-site with the app (localhost:8799 → :8787 today;
  tablework.com → api.tablework.com live). The route resolves the session,
  checks membership, then hands off to the DO with the user and role.
- Who may lead: `can(role, 'lead')` (owner, director, crew). Cast may
  only follow. The DO enforces it on every move, not just on connect.
- Ordering: the DO stamps each move with an increasing sequence; a
  follower ignores anything with a lower sequence than it has. No clocks
  to compare.
- Late joiner and reconnect: the DO sends the last move on connect from
  its storage; a dropped socket is noticed by the DO's `webSocketClose`
  and by the client's ping (hibernation keeps idle sockets alive at no
  cost; the client pings every 20 s as now).
- Presence: the DO broadcasts `{who: [{email, role, leading}]}` on join
  and leave, so the header can say "Leading · 4 following".
- Script mismatch: the move carries `i`, `text` and `scriptId` as now;
  the follower's nearest-text fallback stays.
- Signed out: the try-it path has no production, so the MQTT room word
  stays for it (deleted when MQTT's last user, this show, is done).
- Testing: `@cloudflare/vitest-pool-workers` runs Durable Objects; the
  test opens two WebSockets through `handle()` with `upgrade` headers…
  which the router does not do. The DO route lives in `index.ts` (it
  needs `env.ROOMS`), and the test drives the DO through
  `env.ROOMS.get(id).fetch(...)` with real WebSocket pairs.

## Spec

- `api/src/room.ts`: `export class Room extends DurableObject` with
  `fetch` (upgrade only; `user`, `role` passed in headers by the Worker),
  `webSocketMessage` (parse `{type:'move', i, text, scriptId}`; reject
  from non-leaders; stamp `seq`; store `last`; broadcast), `webSocketClose`
  (broadcast presence), and `{type:'ping'}` → `{type:'pong'}`.
- Route: `GET /productions/:id/room` with `Upgrade: websocket` [read] →
  `env.ROOMS.get(env.ROOMS.idFromName(id)).fetch(req with x-user, x-role)`.
- `wrangler.toml`: `[[durable_objects.bindings]] name = "ROOMS" class_name
  = "Room"`, `[[migrations]] new_sqlite_classes = ["Room"]`.
- App: when signed in with a production, `joinRoom()` opens the DO socket
  instead of MQTT; `tell()` sends moves; the Lead/Follow chips stay; the
  room word field hides. Header text from presence.

## Split into Queue items

- `relay-do` — the Room DO, route, wrangler binding, a test with two
  sockets: leader moves, follower receives in order, cast cannot lead,
  late joiner gets the last move.
- `web-relay` — the app uses the DO when signed in, MQTT otherwise;
  header shows presence. Verify in Chrome with two contexts.
