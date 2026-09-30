# 002 — Cloudflare edge stack around the existing static app

- Date: 2026-09-30
- Status: Accepted

## Context

The app is one static HTML file on GitHub Pages with no server. Production
needs accounts, billing, storage for scripts/clips/sound, a WebSocket relay
for leader/follower (today on public MQTT brokers), and an MCP server. Lee's
other apps run Phoenix on Fly (earwig), Rails on Fly (bodylang) and
Fastify on Fly (given.care); each is a server to keep alive.

## Decision

Keep the frontend static and dependency-free. Put everything else on
Cloudflare: Pages (frontend), Workers (API + MCP server, TypeScript), D1
(SQLite: users, productions, memberships, scripts, notes, stats), R2 (clips,
uploaded sound, no egress fees), Durable Objects (one per production: the
leader/follower relay and live presence), Workers KV for sessions. Stripe
Checkout + customer portal for billing, Resend for magic-link email.

## Alternatives rejected

- Supabase (auth, Postgres, storage) — simplest auth, but no WebSocket relay
  and a second vendor for the edge; two dashboards.
- Phoenix on Fly like earwig — channels are ideal for the relay, but a server
  to run and pay for at $1/month per seat.
- Keep public MQTT brokers — fine for one show, not for paying users.

## Consequences

- One vendor, one CLI (`wrangler`), a free tier that covers early usage.
- Clips move from the repo to R2; `tts.py` becomes a Worker job.
- The frontend gains a small API client and an auth state; it must keep
  working with no account for the try-it path.
- D1 is SQLite: no fancy Postgres features, fine for this shape.
