# Architecture — Tablework (transcriptor)

Today (2026-09-30): one static file, no server. Target: the same frontend
plus a Cloudflare edge backend (ADR 002). This file describes both; the
"Target" parts are not built yet and `next_up.md` tracks them.

## Shape

```mermaid
flowchart LR
  actor([Actor / director / SM]) --> web[index.html on Pages]
  claude([Claude via MCP]) --> mcp[MCP Worker]
  web --> api[API Worker]
  mcp --> api
  api --> d1[(D1: users, productions,\nmembers, scripts, notes, stats)]
  api --> r2[(R2: clips, sound)]
  web <-->|WebSocket| do[Durable Object\nper production: relay + presence]
  api --> stripe[Stripe]
  api --> eleven[ElevenLabs]
  api --> resend[Resend magic links]
```

## Layout (today)

| Path | Role |
|---|---|
| `index.html` | The whole frontend: markup, styles, script |
| `how.html` | The public "How Tablework works" page (PLATFORM §5) |
| `sentences.js` | Sentence/piece splitter, shared by browser and `convert.py` tests |
| `script.js`, `clips.js`, `clips/` | Generated for this show; move to D1/R2 in target |
| `cues.js`, `sound/` | This show's sound design; becomes per-production upload |
| `convert.py`, `tts.py`, `normalize.py`, `stress.json` | Pipeline for this show; `tts.py` becomes a Worker job |
| `sw.js` | Service worker; `CACHE` bumped every deploy |
| `api/` | The Workers backend: `src/index.ts` entry (handler only), `src/router.ts`, `src/routes/*.ts` (one file per area), `src/auth.ts`, `src/access.ts`, `src/email.ts`, `migrations/` D1, `test/` vitest on a real D1 |
| `api/src/oauth.ts`, `api/src/routes/authorize.ts` | OAuth 2.1 for claude.ai connectors (provider wraps the Worker; `/oauth/mcp`, `/authorize` consent page) |
| `api/src/room.ts` | The Room Durable Object: Together's relay per production |
| `api/src/mcp.ts`, `api/src/routes/mcp*.ts`, `routes/scripts.ts` | The MCP server (`POST /mcp`, bearer personal tokens) and its tools: whoami, list_productions, list_members, set_parts, invite, add_script, get_script, list_sound, set_cues |
| `Taskfile.yml` | `task serve` (app), `task dev` (API on :8787), `task test` (gate), `task deploy` (Lee) |
| `docs/BEHAVIOUR.md` | Exact behaviour of the app as it stands |

## Data flow

Today: everything in `localStorage` (script, place, role, stats, notes,
sound prefs). Leader/follower over public MQTT (see BEHAVIOUR "Together").

Target: the browser keeps `localStorage` as a cache and works with no
account (try-it path). Signed in, state syncs to D1 through the API Worker.
A production owns scripts, cues, sound files, members and the clip render
budget. Notes are private per member unless shared to the production.
Together goes through the production's Durable Object, one WebSocket per
device; the DO orders moves by its own clock and keeps the last move for
late joiners. Clips are looked up by `sha1(model + voice + text)` in R2
before any render is bought.

## Hosting and deploy

Today the app is GitHub Pages from `main` (push = deploy, bump `sw.js`
CACHE); the API runs only locally (`task dev`). The live shape below is
configured and dry-runs green (`task deploy:check`); bringing it up is a
one-time runbook for Lee, every step an `ACTION:` in `next_up.md`:

1. `cd api && npx wrangler login` (browser).
2. `npx wrangler d1 create tablework`, `npx wrangler kv namespace create
   OAUTH_KV`, `npx wrangler r2 bucket create tablework-clips`; paste the two
   ids into `[env.production]` in `api/wrangler.toml`.
3. Secrets, once: `npx wrangler secret put SEALING_KEY --env production`
   (any long random string), then as they exist: `RESEND_API_KEY`,
   `MAIL_FROM`, `ELEVEN_LABS_API_KEY`, `STRIPE_SECRET_KEY`,
   `STRIPE_WEBHOOK_SECRET`; price ids go in `vars`.
4. Domain: `api.tablework.com` is the Worker's custom domain (in
   `routes`); the app is a Cloudflare Pages project on `tablework.com`
   built from this repo's root with no build step (`_headers` keeps
   `index.html` and `sw.js` uncached at the edge).
5. `task deploy` — applies migrations to the remote D1, deploys the
   Worker. Pages deploys on push once connected to the repo.
6. Stripe webhook: point it at `https://api.tablework.com/webhooks/stripe`.
7. claude.ai connector: `https://api.tablework.com/oauth/mcp`.

Environments: local `task dev` (`[vars]` at the top of `wrangler.toml`,
local D1/KV/R2, no login); production `[env.production]`. The app picks
its API by hostname (`localhost` → `:8787`, else `api.tablework.com`).
Loops never run `task deploy`.

## Scenarios

| Scenario | What happens | Where handled |
|---|---|---|
| Try before signup | Paste a script, browser voices, no account; state in localStorage until signup, then uploaded | frontend |
| Same play rendered by a second production | Every clip already in R2 by hash; price shown is $0 | API render endpoint |
| ElevenLabs down mid-render | The job is per line and idempotent by hash; failures are listed on the render, done lines stay done, Retry forgets the failures | `api/src/render.ts` |
| Leader loses connection | The Room keeps the last move and its sequence; a follower that reconnects gets it in `hello`; presence tells everyone who is leading | `api/src/room.ts` |
| Member removed from production | Session still valid, membership check on every production route returns 403; local cache of that script cleared on next load | API middleware |
| Owner stops paying | Webhook sets past_due then readonly; writes answer 402, reading/learning/Together keep working; nothing deleted | `api/src/billing.ts`, `gate()` |
| Copyrighted script uploaded | Private to the production, never listed or shared beyond members; takedown path in TOS | policy, not code |

## External services

| Service | Used for | Parser / adapter |
|---|---|---|
| ElevenLabs | Voice render | `api/src/eleven.ts` → `Rendered {audio, spans}` |
| Stripe | Checkout, portal, webhooks | `billing/stripe.ts` → `Subscription` |
| Resend | Magic-link email | `auth/mail.ts` |
| Cloudflare D1/R2/DO/KV | Store, files, relay, sessions | direct |
