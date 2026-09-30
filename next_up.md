# Next Up — transcriptor

## Now
<!-- autodev until 2026-09-30 17:42 -->
## Queue
- [ ] design-voices-render — Spec the render flow: price quote from
  uncached characters, per-line resumable job, R2 cache by hash, BYO key.
- [ ] design-sound-upload — Spec per-production music + room tone
  upload per scene, normalization in a Worker (port `normalize.py`), replaces
  `cues.js` + `sound/`.
- [ ] cf-scaffold — `wrangler` project, D1 migration 0001, one health
  route, `Taskfile.yml` with `task dev`, `task test`, `task deploy` (deploy
  is ACTION for Lee). Verify: `task test` green, `curl localhost:8787/health` ok.
- [ ] db-schema-0001 — D1 migration: users, productions, members, invites,
  scripts, notes per `docs/design/sharing.md`; `can(role, cap)` table in
  `api/src/access.ts` with a unit test. UNTIL: cf-scaffold.
- [ ] api-productions — create/list/get, members, change role, remove, leave
  (last owner rule). Tests against local D1. UNTIL: db-schema-0001.
- [ ] api-invites — mint (role, 14 days), revoke, accept signed in / signed
  out (via magic link purpose `invite`). UNTIL: auth-magic-link.
- [ ] web-production-panel — More sheet: members, roles, invite link, seat
  count and monthly price; the word "production" only with 2+ members.
  UNTIL: api-invites.
- [ ] web-progress-view — owner/director table: per member cleared/total,
  weak lines. UNTIL: api-productions.
- [ ] auth-magic-link (EPIC) — Resend + KV sessions; try-it path stays
  account-free. UNTIL: cf-scaffold.
- [ ] billing-stripe (EPIC) — Checkout per production, portal, webhook →
  production.state; $1/seat/month, $10/seat/year. UNTIL: auth-magic-link.
- [ ] relay-durable-object (EPIC) — Replace public MQTT with the production's
  DO; keep the message shape and clock ordering. UNTIL: auth-magic-link.
- [ ] verify-cf-mcp-oauth — Spike: hello-world remote MCP on Workers with
  `@cloudflare/workers-oauth-provider`, connect from claude.ai as a custom
  connector, call `whoami`. Verify: a tool call round-trips. Local only
  until Lee has a domain; `workers.dev` subdomain is free. UNTIL: cf-scaffold.
- [ ] mcp-scaffold — `/mcp` route, `whoami`, `list_productions`, bearer
  personal tokens (hashed, revocable). Tests. UNTIL: api-productions.
- [ ] mcp-add-script — `add_script` + `get_script`; one `parseScript` in
  `sentences.js` shared with the paste box, with the validator and speaker
  counts. Tests. UNTIL: mcp-scaffold.
- [ ] mcp-cues-parts-invite — `set_cues`, `list_sound`, `set_parts`,
  `invite`. UNTIL: mcp-add-script, api-invites.
- [ ] mcp-oauth — OAuth 2.1 provider + consent page listing productions.
  UNTIL: verify-cf-mcp-oauth, mcp-scaffold.
- [ ] how-it-works-page (EPIC) — Public docs page: productions, invites,
  voices and cost, MCP setup, cues. Written from the specs above.

## Gated
- [ ] buy-domain — ACTION: buy tablework.com (free 2026-09-30) and point
  it at Pages (or Cloudflare once cf-scaffold lands). Costs money. Name is
  decided: Tablework (LOG 2026-09-30).
- [ ] render-three-silent-lines — ACTION: Run `ELEVEN_LABS_API_KEY=... python3 tts.py` for the 3 lines the
  2026-09-19 "Mr." re-split left silent ("Or if he wasn't, he said he could be
  reached!", "Mr. Sebatacheck, please …", "Mr. McMartin, in admissions …"),
  then delete the 3 orphaned clips. Spends ElevenLabs credits.

## Done
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
