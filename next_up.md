# Next Up — transcriptor

## Now
<!-- autodev until 2026-09-30 17:42 -->
- [ ] sync-progress (owner: loop, started 2026-09-30) — `PUT /productions/:id/me/progress` {best, misses} and
  `GET /productions/:id/progress` [progress cap] → per member {email, parts,
  best, weak}; the app posts after each learn run when signed in. Tests.
## Queue
- [ ] billing-stripe (EPIC) — Checkout per production, portal, webhook →
  production.state; $1/seat/month, $10/seat/year. UNTIL: auth-magic-link.
- [ ] relay-durable-object (EPIC) — Replace public MQTT with the production's
  DO; keep the message shape and clock ordering. UNTIL: auth-magic-link.
- [ ] mcp-scaffold — `/mcp` route, `whoami`, `list_productions`, bearer
  personal tokens (hashed, revocable). Tests.
- [ ] web-progress-view — owner/director table: per member cleared/total,
  weak lines. UNTIL: sync-progress.
- [ ] mcp-add-script — `add_script` + `get_script`; one `parseScript` in
  `sentences.js` shared with the paste box, with the validator and speaker
  counts. Tests. UNTIL: mcp-scaffold.
- [ ] mcp-cues-parts-invite — `set_cues`, `list_sound`, `set_parts`,
  `invite`. UNTIL: mcp-add-script, api-invites.
- [ ] mcp-oauth — OAuth 2.1 provider + consent page listing productions.
  UNTIL: verify-cf-mcp-oauth, mcp-scaffold.
- [ ] stress-per-line — `stress.json` becomes a per-line "say as" on the
  script, editable in the notes column, part of the clip hash. UNTIL: db-schema-0001.
- [ ] voices-quote — `clips` cache table + quote endpoint; unit test on the
  arithmetic ($0.30 per 1k uncached chars, min $1). UNTIL: cf-scaffold.
- [ ] voices-render-job — Queues consumer, `voices/eleven.ts`, R2 write,
  resumable per line. UNTIL: voices-quote. Testing spends credits: ACTION
  for Lee to allow one small test render when it is ready.
- [ ] voices-byo-key — encrypted per-production ElevenLabs key; quote and
  charge skipped. UNTIL: voices-render-job.
- [ ] web-voices-panel — More sheet: voice per character, quote, render,
  progress, BYO key. UNTIL: voices-quote.
- [ ] sound-api — D1 `sound` + `cues`, presigned R2 upload URL, rows, cues
  PUT, delete refused when in use. UNTIL: db-schema-0001.
- [ ] web-sound-panel — Add music / Add room tone, per-scene assignment,
  gain readout, measure on upload. UNTIL: sound-api, measure-loudness.
- [ ] how-it-works-page (EPIC) — Public docs page: productions, invites,
  voices and cost, MCP setup, cues. Written from the specs above.

## Gated
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
