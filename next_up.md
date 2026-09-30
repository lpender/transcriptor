# Next Up — transcriptor

## Now
<!-- autodev until 2026-09-30 17:42 -->
- [ ] mcp-cues (owner: loop, started 2026-09-30) — `set_cues`, `list_sound` over MCP.
## Queue
- [ ] billing-stripe (EPIC) — Checkout per production, portal, webhook →
  production.state; $1/seat/month, $10/seat/year. UNTIL: auth-magic-link.
- [ ] relay-durable-object (EPIC) — Replace public MQTT with the production's
  DO; keep the message shape and clock ordering. UNTIL: auth-magic-link.
- [ ] mcp-oauth — OAuth 2.1 provider + consent page listing productions.
  UNTIL: verify-cf-mcp-oauth, mcp-scaffold.
- [ ] web-sound-panel — Add music / Add room tone, per-scene assignment,
  gain readout, measure on upload. UNTIL: sound-api, measure-loudness.
- [ ] how-it-works-page (EPIC) — Public docs page: productions, invites,
  voices and cost, MCP setup, cues. Written from the specs above.

## Gated
- [ ] eleven-key-and-bucket — ACTION: `cd api && npx wrangler r2 bucket create
  tablework-clips`, `npx wrangler secret put ELEVEN_LABS_API_KEY` and
  `npx wrangler secret put SEALING_KEY` (any long random string), then say
  yes to one test render of the 3 unrendered lines (~700 characters, cents).
  Spends credits. UNTIL: cf-account.
- [ ] verify-cf-mcp-oauth — Spike: hello-world remote MCP on Workers with
  `@cloudflare/workers-oauth-provider`, connect from claude.ai as a custom
  connector, call `whoami`. Verify: a tool call round-trips. Local only
  until Lee has a domain; `workers.dev` subdomain is free. UNTIL: cf-account (claude.ai must reach a public URL).
- [ ] resend-account — ACTION: a Resend account (free tier) with the domain
  verified in DNS, then `cd api && npx wrangler secret put RESEND_API_KEY`
  and `MAIL_FROM`. Until then sign-in links are only logged. UNTIL: buy-domain.
- [ ] cf-account — ACTION: `cd api && npx wrangler login`, then `npx wrangler d1
  create tablework` and paste the id into `api/wrangler.toml`. Free tier;
  needs your browser. Until then everything runs on local D1 only.
- [ ] buy-domain — ACTION: buy tablework.com (free 2026-09-30) and point
  it at Pages (or Cloudflare once cf-scaffold lands). Costs money. Name is
  decided: Tablework (LOG 2026-09-30).
- [ ] render-three-silent-lines — ACTION: Run `ELEVEN_LABS_API_KEY=... python3 tts.py` for the 3 lines the
  2026-09-19 "Mr." re-split left silent ("Or if he wasn't, he said he could be
  reached!", "Mr. Sebatacheck, please …", "Mr. McMartin, in admissions …"),
  then delete the 3 orphaned clips. Spends ElevenLabs credits.

## Done
- [x] sound-api — DONE 2026-09-30: migration 0010 `sound` + `cues`; upload through the Worker (25 MB, audio types), list, delete refused while a cue uses it, `GET/PUT /productions/:id/cues` in cues.js's shape with `gains`, `GET /sound/:key` from R2. 1 test walking the lot.
- [x] web-say-as — DONE 2026-09-30: the note editor (owner/director, signed in) gains a "Say it as…" field; saved to `/sayas`, shown as ♪ under the note, the quote counts the line as unrendered. Driven in Chrome: 689 → 703 characters to render after a say-as (`tmp/qa` not needed).
- [x] web-voices-panel — DONE 2026-09-30: "Company voices" in the Account section (owner/director): a voice per speaker from our cast, the quote in plain words, "Render the voices for $X" that drives the batches to done; clips come from the API in clips.js's shape (spans now stored on the clip row, seed updated). Driven in Chrome against local D1: 6 speakers, $1.00 quote, render refused politely without a key (`tmp/qa/2026-09-30-voices.png`).
- [x] stress-per-line — DONE 2026-09-30: migration 0008 `sayas` (per production, keyed by full line), `plan()`/quote/render take it and hash on the spoken text, `GET/PUT /productions/:id/sayas` [script]. 2 tests. `stress.json` is that table's shape and can be PUT as-is; the notes-column editor comes with web-voices-panel.
- [x] voices-byo-key — DONE 2026-09-30: migration 0007, `api/src/seal.ts` (AES-GCM under `SEALING_KEY`), routes get/put/delete `/productions/:id/eleven-key` (owner only, last4 shown), `keyFor()` picks the production's key over ours, quote is $0 with an own key. 2 tests.
- [x] voices-render-job — DONE 2026-09-30: migration 0006 `renders`; `api/src/eleven.ts` (adapter, tts.py's spans), `render.ts` (client-driven batches of 4, idempotent by hash, failures recorded, retry), routes start/next/retry/progress, `GET /productions/:id/clips` (clips.js shape), `GET /clips/:hash`; R2 binding `CLIPS`. 3 tests with a stub engine. A real render needs the key and credits (Gated).
- [x] voices-quote — DONE 2026-09-30: migration 0005 `clips` + `voices`, `api/src/voices.ts` (cast, tts.py-compatible clip hash, $0.30/1k min $1, quote over uncached chars, dedup), routes `/voices`, `/productions/:id/voices`, `/render/quote`; `scripts/seed-clips.mjs` seeds the cache from clips.js. 4 tests; live: the real play quotes with its 3 unrendered lines only.
- [x] mcp-parts-invite — DONE 2026-09-30: `list_members`, `set_parts` (own, or anyone's with share), `invite` (director/cast/crew) in `api/src/routes/mcp-members.ts`; 1 test walking all three plus refusals.
- [x] web-script-from-production — DONE 2026-09-30: signed in, the production's script replaces the device's (place kept when identical); owner/director get "Save to the production" in the paste box with the validator's line numbers on refusal. Driven in Chrome: server line appears, paste-box line lands on the server, bad line refused.
- [x] mcp-add-script — DONE 2026-09-30: `parseScript`/`printScript` in `sentences.js` (shared), `api/src/scripts.ts`, `PUT/GET /productions/:id/script` and MCP `add_script`/`get_script` with the hard validator and speaker counts; 4 tests. Live over wrangler dev: the real Waiting script loads via MCP.
- [x] web-progress-view — DONE 2026-09-30: an owner or director sees each member's standing on their row ("12 of 40 clear, 3 weak", "off book", "not started"). Fixed a double draw of the panel when two sign-in paths raced. Driven in Chrome (`tmp/qa/2026-09-30-progress.png`).
- [x] web-tokens — DONE 2026-09-30: "Your AI" in the Account section: Connect your AI → labelled token shown once as a `claude mcp add` line (copied) plus the claude.ai connector note; tokens listed with last use and Revoke. Driven in Chrome: token lists MCP tools, revoked token gets 401 (`tmp/qa/2026-09-30-tokens.png`).
- [x] mcp-scaffold — DONE 2026-09-30: `api/src/mcp.ts` (stateless Streamable-HTTP JSON-RPC: initialize, tools/list, tools/call, ping), `routes/mcp.ts` (`POST /mcp` with a bearer, personal tokens as labelled 10-year sessions: mint once, list, revoke), tools `whoami` + `list_productions`. 2 tests; live curl: initialize → whoami returns the user and production.
- [x] sync-progress — DONE 2026-09-30: migration 0003 `progress`, `PUT /productions/:id/me/progress` [learn] and `GET …/progress` [progress]; the app posts 2 s after a graded sentence when signed in and in a production. 2 tests; driven in Chrome: one right answer → best 1 of 317 on the server.
- [x] web-production-panel — DONE 2026-09-30: signed in, the Account section shows the company: create ("Keep this script under your account"), members with roles and parts, seat count and price, Invite cast/crew/director links (copied), a picker when in several productions; `?invite=` landing peeks, joins signed in or by email link. Driven in Chrome against `task dev` with a second user via curl (`tmp/qa/2026-09-30-company.png`).
- [x] web-signin — DONE 2026-09-30: Account section in More (email → link; signed in shows the address and Sign out), `api()` helper with credentials, `/me` on load, `?signin=` and `?joined=` landings. Preflight CORS added to the Worker. Walked in Chrome against `task dev`: link → verify → signed in → sign out (`tmp/qa/2026-09-30-signin.png`).
- [x] api-invites — DONE 2026-09-30: `api/src/invites.ts` + `routes/invites.ts` (mint 14-day multi-use link, list, revoke, public peek, accept signed in or via an invite magic link that joins on verify); 3 tests on D1.
- [x] api-productions — DONE 2026-09-30: `api/src/productions.ts` + `routes/productions.ts` (create, list, get with members, set role, remove/leave, parts) behind `gate(cap)`; last-owner rule; 5 tests on D1.
- [x] auth-routes — DONE 2026-09-30: `/auth/link`, `/auth/verify`, `/me`, `/auth/logout` in `api/src/routes/auth.ts`, mail through `email.ts` (Resend when keyed, logged otherwise). 3 route tests on D1; walked live on `wrangler dev` with curl: 202 → 302 with cookie → /me 200.
- [x] auth-core — DONE 2026-09-30: migration 0002 (magic_link_tokens, sessions), `api/src/auth.ts` (issue/verify links, sessions, `currentUser` from cookie or bearer), `ids.ts`; 5 tests on a real D1 via `@cloudflare/vitest-pool-workers` 0.22 + vitest 4.
- [x] db-schema-0001 — DONE 2026-09-30: `api/migrations/0001_productions.sql` (users, productions, members, invites, scripts, notes), `api/src/access.ts` with the role × capability table and 4 tests; applied to local D1, CHECK on role verified.
- [x] cf-scaffold — DONE 2026-09-30: `api/` Worker (router.ts + index.ts entry), vitest + tsc, `Taskfile.yml` with serve/dev/test/deploy; `task test` green; `wrangler dev` answers `/health` with CORS for the app origin.
- [x] measure-loudness — DONE 2026-09-30: `loudness(blobOrUrl)` in index.html (Web Audio, mean-square dB). Playwright: OfficeFans −28.43 vs ffmpeg −28.4, SadDay −23.48 vs −23.5; a 0.1-amplitude tone −23.01 as expected.
- [x] engine-gain-node — DONE 2026-09-30: every track routes through a GainNode with `window.GAINS[file]` dB (0 when absent); slider and fades untouched. Verified in Playwright with real audio: +6 dB → 1.995, −3 dB → 0.708, both tracks playing, fade stops one and leaves the other.
- [x] browser-voices — DONE 2026-09-30: `speak()` via speechSynthesis when a line has no clip, voice per character by name hash, silenced at volume 0, header says whose voices. Verified in Playwright with a stubbed engine (advances line by line, cancel on stop). Safari and real voices: Lee's ear.
- [x] design-sound-upload — DONE 2026-09-30: `docs/design/sound-upload.md`; never re-encode, measure in the browser, GainNode at playback; split into engine-gain-node, measure-loudness, sound-api, web-sound-panel.
- [x] design-voices-render — DONE 2026-09-30: `docs/design/voices.md`; ElevenLabs cost checked ($0.18/1k, play $11–18), ADR 003 amended; split into browser-voices, stress-per-line, voices-quote, voices-render-job, voices-byo-key, web-voices-panel.
- [x] design-mcp-ingest — DONE 2026-09-30: `docs/design/mcp-ingest.md`, ADR 005 (text in the paste format, no files over MCP, OAuth + bearer); split into verify-cf-mcp-oauth, mcp-scaffold, mcp-add-script, mcp-cues-parts-invite, mcp-oauth.
- [x] design-sharing-model — DONE 2026-09-30: `docs/design/sharing.md` (diverge, skeptic, spec, role table), ADR 004; split into db-schema-0001, api-productions, api-invites, web-production-panel, web-progress-view.
- [x] spike-cue-listening — DONE 2026-09-30: H switch "Hear me say it" in More; last two words of the sentence under test count as the press. Verified in Playwright with a stubbed SpeechRecognition (wrong words ignored, reveal, then right + next). UNTIL Lee tries it with a real mic: one-word pieces ("No.") will fire on any "no".
- [x] productionize-billing-period — DECIDED 2026-09-30 (loop): monthly and yearly, yearly default (ADR 003 as written).
- [x] productionize-name — DECIDED 2026-09-30 (loop): Tablework. Runner-up Run-through. Off Book rejected.
- [x] platform-conventions — DONE 2026-09-30: `~/dev/godfiles/conventions/PLATFORM.md` v1, references given.care auth/access and bodylang Stripe; checklist for new apps.
- [x] recon-competitors — DONE 2026-09-30: `docs/recon/competitors.md`, five products, every claim linked. Finding: cue-listening via speech recognition is the one feature we lack; queued as a spike.
- [x] productionize-docs — DONE 2026-09-30: kind tool → app; VISION, ADR
  001 positioning, 002 stack, 003 pricing/voices, product LOG, ARCHITECTURE
  with target shape, QUIRKS; `specification.md` moved to `docs/BEHAVIOUR.md`.
- [x] productionize-show-sound — DECIDED 2026-09-30: sound design is a
  per-production upload feature; James's files stay private to this show.
- [x] note-box-three-lines (2026-09-26) — global `textarea { height: 58vh }`
  overrode `rows`; scoped to `#src`, box is `rows=3`. Verified in Playwright
  at 1400 and 390 wide.
