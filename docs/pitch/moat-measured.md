# The moat, counted (2026-10-04)

Deck v1 slide 6 asserts a moat as a feature table. Features are not a moat —
the investor's own words, ep. 836, 2026-06-09: *"Nope, false moat."* So the
claim is replaced here with a number, or deleted.

## What is actually accumulating

**The clip cache is global, not per-production.** `api/migrations/0005` makes
`clips.hash` the primary key with no `production_id` column; `clipHash()` in
`api/src/voices.ts:30` is `sha1(model + voice + spoken text)`. So a line
rendered once for anyone is free for everyone, forever:

```
api/src/voices.ts:66   if (seen.has(l.hash)) continue;   // the same words in the same voice render once
api/src/voices.ts:69   if (have.has(l.hash)) cached += l.chars;
```

That is the only asset here that compounds from doing the work rather than
from writing more code. Every production that renders a play it shares with
another company — the Shakespeare, the Wilde, the Miller, the dozen titles
school and community theatre actually programme — pays once on behalf of
everyone who follows.

## Counted today

| | |
|---|---|
| Rendered clips in the cache | **258** (257 distinct files, 9.5 MB) |
| Plays covered | **1** |
| Productions that have ever rendered | **1** (the founder's own) |
| Characters of this show's script | 7,442 |
| Cost to render it at ElevenLabs rates | ~$1.35 |
| Tests in the repo | 74 `it(` blocks across 23 files |

Commands: `node -e "global.window={};require('./clips.js');…"`,
`ls clips/*.mp3 | wc -l`, `grep -c 'it(' api/test/*.test.ts`.

## The derivative, which is the question actually asked

The total is a vanity number. The marginal one:

- **Second company doing the same play with the same voice casting: $0.** The
  whole script is already in the cache.
- **Second company doing the same play with DIFFERENT voice casting: full
  price.** The hash includes the voice id, so a director who picks a different
  actor-voice for Algernon re-renders the entire play. **This is the flaw in
  the asset and it is not small**: voice casting is the one thing a director
  will want to make their own, so the cache hits hardest exactly when nobody
  exercises taste.
- **A different cut of the same play: mostly cached**, because the hash is per
  spoken line, and two companies cutting *Earnest* still share most lines
  verbatim.

So the honest shape is: the cache is real, it is global, and its hit rate is
governed by whether companies converge on the same voice casting — which the
product currently gives them no reason to do. **A "the standard reading of
Earnest" default casting would convert this from an accident into an asset.**
That is a product change of about ten lines, not an architecture.

## What it is not

- **Not legally protected.** No patent, no license, nothing proprietary in the
  audio: ElevenLabs will sell the same voices to the same plays to anyone.
- **Not a correctness artifact.** Unlike a reconciliation ground truth, there
  is no accumulated judgment in a clip — it is a cache, and a funded
  competitor reproduces it by spending money, not time. For the public-domain
  canon the entire cost is in the low hundreds of dollars.
- **Not a switching cost today.** The investor's test is switching cost =
  risk (ep. 836). A cast's real lock-in is their *progress* — the weak
  sentences, the clean runs, the notes — and that is per-user data a
  competitor cannot copy but a user can abandon between shows, because the
  show ends.
- **Time for a funded competitor to match the cache:** days. For the per-actor
  standing model and the shared-voice product shape: weeks. Neither is a moat.

## Verdict

**There is no moat, and the deck must stop implying one.** What there is: a
cost advantage that grows if, and only if, productions converge on shared
voice casting, and a first-mover position in a product shape nobody else has
built yet. Both are worth saying plainly. Neither survives the word "moat".
