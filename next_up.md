# Next Up — transcriptor

## Now
<!-- autodev until 2026-09-30 17:42 -->

## Queue
- [ ] spike-cue-listening — Web Speech API: advance on the last word of your line, no grading. Verify: one scene in Chrome, hands free. Feeds design-voices-render.
- [ ] design-sharing-model — Diverge → skeptic → spec in
  `docs/design/sharing.md`: production, roles (owner, director, cast, crew),
  invite link, what each role sees, notes privacy. Then D1 schema ADR.
- [ ] design-mcp-ingest — Spec the MCP server: `whoami`,
  `list_productions`, `add_script`, `get_script`, `set_cues`,
  `upload_sound`. Claude converts PDFs client-side; server takes text.
- [ ] design-voices-render — Spec the render flow: price quote from
  uncached characters, per-line resumable job, R2 cache by hash, BYO key.
- [ ] design-sound-upload — Spec per-production music + room tone
  upload per scene, normalization in a Worker (port `normalize.py`), replaces
  `cues.js` + `sound/`.
- [ ] cf-scaffold (EPIC) — `wrangler` project, D1 migration 0001, one health
  route, `Taskfile.yml` with `task dev`, `task test`, `task deploy` (deploy
  is ACTION for Lee). UNTIL: design-sharing-model.
- [ ] auth-magic-link (EPIC) — Resend + KV sessions; try-it path stays
  account-free. UNTIL: cf-scaffold.
- [ ] billing-stripe (EPIC) — Checkout per production, portal, webhook →
  production.state; $1/seat/month, $10/seat/year. UNTIL: auth-magic-link.
- [ ] relay-durable-object (EPIC) — Replace public MQTT with the production's
  DO; keep the message shape and clock ordering. UNTIL: auth-magic-link.
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
