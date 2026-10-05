# The arithmetic (2026-10-04)

**Updated after the close.** The market leg landed late and sized it. The
inverse below was computed first and needed no external source; the sizing
that confirms it is in the box immediately after, with the research round in
`teardown-round-2.md`.

> ## The number the inverse was waiting for
>
> **US TAM at $1 per seat per month: $2.6M–$6.5M.**
> **$100M of annual revenue is 15–38× the entire market.**
>
> Source: the 2026-10-04 market research leg (`teardown-round-2.md`). The
> chain's own inputs were not delivered to this file, so treat the band as the
> leg's figure rather than one re-derived here — but note it agrees with the
> inverse below, which was computed independently and first. **Two independent
> routes, same conclusion: the venture case does not exist at this price.**

## Inputs, all from the repo

| Input | Value | Source |
|---|---|---|
| Price today | $1 / seat / month, or $10 / seat / year | `index.html` welcome, ADR 003 |
| Typical cast | 10 seats | assumption, stated |
| Paying life of a production | 6–8 weeks ⇒ **2 months** | `docs/VISION.md`, rehearsal reality |
| Revenue per production, per run | **$20** | 10 × $1 × 2 |
| Render revenue | ~$0 contribution | sold at cost + $1 minimum, ADR 003 |

## Chain A — the customer count $100M requires, at today's price

```
$100,000,000 ÷ $20 per production-run = 5,000,000 production-runs per year
```

**Five million productions a year.** For scale, that is more productions than
there are plausibly staged in the English-speaking world by any counting
method, by a wide margin — which is the point of doing the division: the
answer does not need the denominator to be decisive. The venture test fails
before the market is sized.

A business, rather than a venture outcome:

```
$1,000,000 ÷ $20 = 50,000 production-runs per year
  $100,000 ÷ $20 =  5,000 production-runs per year
```

**Fifty thousand paying productions a year for $1M of revenue.** With two
owned channels and no paid acquisition budget (LTV $20–30, see
`teardown-round-1.md`), that is not reachable.

## Chain B — the same arithmetic at the organisation price

Assume the refined position: the producing organisation pays per season.
Price band **$199–399**, call it $299. Call it one paying season per year.

```
$100,000,000 ÷ $299 =  334,448 organisations
  $1,000,000 ÷ $299 =    3,344 organisations
    $100,000 ÷ $299 =      334 organisations
```

**334 institutions is a side business. 3,344 is a real one.** Both are numbers
a person can picture, which the $1-a-seat chain never was. The change of buyer
moves the required customer count by **150×**.

## The softest input, named — and partly answered

**The number of producing organisations that have a budget and would spend it
on this.** Not the number of theatres — the number with a line item. The late
leg did not count them either, but it found something better than a count:
**Stage Write already sells to exactly that buyer at $249/year for a team and
$599/year for education, and is the one commercially healthy product in the
category.** So the buyer demonstrably exists and pays; what is unknown is how
many there are. Note the price band is **higher** than the $199–399 guessed
before the leg landed, which moves chain B in the right direction.

The counts themselves remain unsourced. Candidate primary sources for the next session, in
order: EdTA on US high schools producing plays and the students in them; AACT
on community theatres; TCG Theatre Facts on nonprofit professional theatres
and their budgets; the NEA Survey of Public Participation in the Arts.

**Do not fill this gap from memory.** The decision in `deck-v3.md` does not
depend on it: five phone calls to directors answer "is there a budget and who
signs" faster and better than any desk estimate, and that is already the ask.

## What nobody in this run has data for

1. How many productions a year, at any definition.
2. Whether a school or community theatre has ever bought software of this kind.
3. What the solo competitors' actual conversion and churn look like. (The leg
   found the *price* ceiling — $4 once, unchanged 2016 to 2026 — and that the
   category leader coldRead froze development in 2022 while still billing
   $83.99/year. Conversion and churn numbers are still unavailable.)
4. Whether a director will accept a default voice casting (which is what the
   render cache needs to compound — `moat-measured.md`).
5. Invite-link conversion in this product: sent → accepted → started their own.
   **This one is not research. It is instrumentation, and it is the ask.**
