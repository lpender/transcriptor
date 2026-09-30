# Next Up — transcriptor

## Now

## Queue

## Gated
- [ ] productionize-name-domain — DECISION: pick a product name and buy the
  domain (2026-09-30). Checked: offbook.com/.app/.io/.co/.studio taken;
  offbook.net, offbook.club, linesapp.com free. runlines.* taken.
- [ ] productionize-pricing — DECISION: $1/month asked (2026-09-30). Stripe
  takes $0.30 + 2.9% per charge, about a third of $1; Apple takes 30% if it is
  an iOS app. Options: $1/month billed yearly ($12), or $1/month web-only via
  Stripe. Pick before building billing.
- [ ] productionize-tts-cost — DECISION: who pays for voices. ElevenLabs is
  about $30 per full-length play; at $1/month that is 30 months of revenue per
  script. Options: browser SpeechSynthesis free tier + paid ElevenLabs render
  as an add-on, or a cheaper engine (OpenAI tts, about $1.50 per play).
- [ ] productionize-show-sound — DECISION: James's cues and `sound/` are one
  show's design. Keep as a per-script "cue sheet" upload feature, or drop from
  the product and keep for this run only.
- [ ] render-three-silent-lines — ACTION: Run `ELEVEN_LABS_API_KEY=... python3 tts.py` for the 3 lines the
  2026-09-19 "Mr." re-split left silent ("Or if he wasn't, he said he could be
  reached!", "Mr. Sebatacheck, please …", "Mr. McMartin, in admissions …"),
  then delete the 3 orphaned clips. Spends ElevenLabs credits.

## Done
- [x] note-box-three-lines (2026-09-26) — The note edit box (`#read textarea.note`, index.html)
  is too tall; make it three lines (`rows=3`, no taller). Verify: press + on a
  line, box shows three lines, on both the wide column and the narrow layout.
  Done: global `textarea { height: 58vh }` (paste box) was overriding `rows`; scoped it to `#src`, box is `rows=3`. Verified in Playwright at 1400 and 390 wide: height = 3 lines + padding.
