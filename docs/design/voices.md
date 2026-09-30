# Voices — free by default, rendered per script, cached for all (design round, 2026-09-30)

Follows ADR 003. Decided by the loop.

## Understand

Today `tts.py` renders every speech through ElevenLabs `eleven_v3` with
timestamps, names the clip `sha1(model + voice + spoken)[:16]`, and the app
plays a clip per line, seeking to a sentence by its timestamp. Cost checked
2026-09-30 on elevenlabs.io/pricing: Creator $22 for 121k credits
(~$0.18 per 1k characters), Pro $99 for 600k (~$0.17). A full-length play
is 60–100k characters, so $11–18 at Creator rates; ADR 003's "$30" was
high but the shape holds: one render is a year of one seat.

## Diverge

1. **Browser voices only** (`speechSynthesis`). Free, instant, every
   platform, one voice per character by picking different system voices.
   Quality: flat, but it is a reader, not a performance. No timestamps:
   `onboundary` gives word offsets in Chrome and Safari, enough to seek.
2. **ElevenLabs for all, in the subscription.** Loses money (ADR 003).
3. **Cheap engine tier** (OpenAI `tts-1`, $15 per 1M characters, ≈ $1.50
   a play). Good voices, no emphasis control, no timestamps. Possible
   middle tier later; not now, one engine adapter is enough to start.
4. **ElevenLabs per script, quoted, cached by hash, BYO key free.**
   ADR 003. Chosen, on top of 1.

## Skeptic

- Browser voices differ per device; a cast hears different readers. Fine
  for learning; the rendered voices are the shared "company voices".
- `speechSynthesis` on iOS needs a user gesture and drops long utterances
  in the background; speak per line, not per script.
- Quote: characters not yet in the cache × $0.30 per 1k (cost ~$0.18 plus
  margin and Stripe's cut), minimum $1, shown before the render; a play
  nobody has rendered is ~$18–30, a popular one is $1 or $0.
- Partial cache: a re-split or a stress edit changes only those lines;
  the quote reflects that (the hash is per spoken text).
- Failure mid-render: job is per line, idempotent by hash, resumable;
  charge on completion (Stripe PaymentIntent captured after the last
  line), or refund the missing lines.
- BYO key: stored encrypted per production (bodylang has the pattern for
  Anthropic keys, `anthropic_api_key=` in `user.rb`); renders skip the
  quote and the charge; clips still land in the shared cache. Skeptic:
  does a BYO render's clip go to everyone free? Yes: the text and voice
  are ours (`VOICES` is our cast of voices), the user paid ElevenLabs for
  generation, not for exclusivity. Recorded in ADR 003 consequences.
- Emphasis (`stress.json`) becomes a per-line "say it as" field on the
  script, editable in the web, part of the hash.
- Voice per character: a picker from our fixed `VOICES` set (gender, age,
  accent tags); per production; part of the hash.
- Payment before backend exists: nothing. Browser voices ship now in the
  static app; the render flow waits for cf-scaffold + billing.

## Spec

- Frontend now: `speak(line)` via `speechSynthesis` when no clip;
  one system voice per character chosen by a stable hash of the name
  from the voices available; `onboundary` seeks; the P key works with no
  clips at all. Header says "Reading with this device's voices".
- API: `POST /productions/:id/render/quote` → {characters, cached,
  toRender, price}; `POST …/render` → job; `GET …/render/:job` →
  {done, total, failed[]}; per-line consumer on Cloudflare Queues, engine
  behind `voices/eleven.ts` returning a generic `Clip {hash, url, spans}`.
- Storage: R2 `clips/<hash>.mp3` + `clips/<hash>.json` (spans). D1
  `clips(hash, chars, created_at)` for the cache lookup.
- Web: More sheet "Company voices": per character voice picker, quote,
  render button (owner/director), progress, BYO key field.

## Split into Queue items

- `browser-voices` — now, static app: speechSynthesis fallback with a
  voice per character and boundary seeking. Verify in Chrome and Safari.
- `stress-per-line` — move `stress.json` into the script data as a
  per-line "say as", editable in the notes column. UNTIL: db-schema-0001.
- `voices-quote` — cache table + quote endpoint with a unit test on the
  arithmetic. UNTIL: cf-scaffold.
- `voices-render-job` — Queues consumer, `voices/eleven.ts`, R2 write,
  resumable. Costs credits to test: ACTION for Lee to allow one test
  render. UNTIL: voices-quote.
- `voices-byo-key` — encrypted per-production key, quote skipped.
- `web-voices-panel` — More sheet panel. UNTIL: voices-quote.
