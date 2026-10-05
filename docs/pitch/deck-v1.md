# Tablework — deck v1 (2026-10-04)

**Built to be destroyed.** This is the deck the founder would write unaided:
every number is true and traced, and the omissions are left in on purpose so
the teardown starts from a fixed target. Read `teardown-round-1.md` next.

---

## 1. Tablework

**The rehearsal room, in one place.** One script, one set of voices, every
actor's lines, the director's view of who is off book.

Live: https://lpender.github.io/transcriptor/

## 2. The problem

A cast of twelve learns the same play twelve different ways. Each actor runs
lines against a different recording — a scene partner app, a friend on the
phone, their own voice memo. Nobody's reading of the other characters is the
same, so nobody rehearses against the show they are actually in. The director
finds out who is off book at the first stumble-through, three weeks late.

## 3. The product

- The director loads the script once. Paste it, or drop a PDF, or tell their
  AI "load this into Tablework" over MCP.
- One **voice per character**, rendered once and shared by the whole company.
- Each actor drills their own part: lines hide, misses are remembered, weak
  sentences come back.
- The director sees per-actor standing: best clean run, the weak sentences,
  how long each actor has been quiet.
- The stage manager runs music and room tone per scene; in the room, every
  device follows the leader's place.

## 4. Why now

Rendered speech became cheap enough to give a whole company its own cast of
voices: this show's 7,442-character script costs ~$1.35 at ElevenLabs rates.
Three years ago that was a studio day.

## 5. What exists today

Working, on a live URL, built from 2026-09-16:

- Single-file frontend, offline-capable (service worker, whole app + audio).
- Cloudflare Workers API: auth, productions, invites, scripts, progress,
  billing, sound, renders.
- Stripe subscriptions per production, seat-counted, 14-day trial.
- An MCP server with OAuth, so a director's AI administers the production.
- 342 commits, 66 tests, a browser smoke gate.

## 6. The competition

| | Solo apps (Offbook, Go Offbook, Cold Read) | Cast apps (ActOnCue Stage, Off Book!, OnBook Live) | Tablework |
|---|---|---|---|
| Price | $7–14 / month / actor | $0.35 / rehearsal hour / actor | $1 / seat / month |
| One shared set of character voices | — | — | **yes** |
| Per-actor off-book standing for the director | — | — | **yes** |
| The show's sound cues | — | — | **yes** |
| Everyone's place synced in the room | — | partial | **yes** |

Source: `docs/recon/competitors.md`, read 2026-09-30, amended 2026-10-01.

## 7. Business model

$1 per seat per month, or $10 per seat per year, billed to the production,
14-day free trial. Voice renders priced before they are spent, at cost plus a
$1 minimum. A cast of ten is $10 a month — less than one seat of any solo
competitor.

## 8. Traction

None yet. One production uses it: the founder's own, rehearsing from the live
page today.

## 9. The team

One engineer, part-time, employed full-time elsewhere.

## 10. The ask

_[blank]_

---

## What this deck does not contain, and an investor will notice

1. **No distribution slide.** Nothing about how the second production hears of
   it, let alone the hundredth. Slide 8 says "none yet" and then slide 10 asks
   for money anyway.
2. **No market size.** Not one number for how many productions exist. "A cast
   of ten is $10 a month" is a price, not a market.
3. **No churn.** A production rehearses six to eight weeks and closes. The
   deck never says what happens to the subscription when the show does.
4. **Engineering output in the traction slot.** 342 commits and 66 tests are
   costs. Slide 5 is a receipt, not evidence anyone wants this.
5. **No LTV, no CAC, no ARPU.** At $1 a seat these are the whole question.
6. **The moat is asserted as a feature table.** Slide 6 lists things
   competitors lack today, which is a roadmap gap, not a moat.
7. **"One engineer, part-time" with no second one named.** And no mention that
   an IP assignment applies.
8. **Slide 4 is an AI-wrapper "why now".** Cheap TTS is available to all four
   competitors on the same day it became available here.
