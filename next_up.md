# Next Up — transcriptor

## Now

## Queue

## Gated
- [ ] render-three-silent-lines — ACTION: Run `ELEVEN_LABS_API_KEY=... python3 tts.py` for the 3 lines the
  2026-09-19 "Mr." re-split left silent ("Or if he wasn't, he said he could be
  reached!", "Mr. Sebatacheck, please …", "Mr. McMartin, in admissions …"),
  then delete the 3 orphaned clips. Spends ElevenLabs credits.

## Done
- [x] note-box-three-lines (2026-09-26) — The note edit box (`#read textarea.note`, index.html)
  is too tall; make it three lines (`rows=3`, no taller). Verify: press + on a
  line, box shows three lines, on both the wide column and the narrow layout.
  Done: global `textarea { height: 58vh }` (paste box) was overriding `rows`; scoped it to `#src`, box is `rows=3`. Verified in Playwright at 1400 and 390 wide: height = 3 lines + padding.
