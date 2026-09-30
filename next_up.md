# Next Up — transcriptor

## Now

## Queue

## Gated
- [ ] productionize-name-domain — DECISION: pick a product name and buy the
  domain (2026-09-30). Free: offbook.net, offbookapp.com, linesmith.com,
  sidesapp.com, linesapp.com. Taken: offbook.com/.app/.io/.co, runlines.*,
  linesmith.app, cuesheet.app.
- [ ] productionize-pricing — DECIDED 2026-09-30: $1/month, web signup only
  (no Apple IAP, no 30%). Open: bill monthly ($0.33 fee) or yearly $12 ($0.65
  fee)? Recommend yearly with monthly offered.
- [ ] productionize-voices — DECIDED 2026-09-30 (loop's call, Lee may
  overrule): browser SpeechSynthesis free in the subscription; ElevenLabs
  render sold per script at cost plus margin, clips cached by hash of
  voice+text so a script anyone already rendered costs nothing; BYO
  ElevenLabs key renders free. Never unlimited in the $1.
- [x] productionize-show-sound — DECIDED 2026-09-30: sound design is a
  product feature, users upload music and room tone per scene. James's
  files stay private to this show.

## Done
- [x] note-box-three-lines (2026-09-26) — The note edit box (`#read textarea.note`, index.html)
  is too tall; make it three lines (`rows=3`, no taller). Verify: press + on a
  line, box shows three lines, on both the wide column and the narrow layout.
  Done: global `textarea { height: 58vh }` (paste box) was overriding `rows`; scoped it to `#src`, box is `rows=3`. Verified in Playwright at 1400 and 390 wide: height = 3 lines + padding.
