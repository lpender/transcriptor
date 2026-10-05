# The arithmetic (2026-10-04)

**Status: the inverse is done, the market count is not.** A research leg
against primary sources (TCG Theatre Facts, EdTA, AACT, the NEA participation
survey) was commissioned in this window and did not land inside it. So this
file gives the half that needs no external source — **how many customers each
revenue level requires** — and names the missing input rather than filling it
with a remembered number.

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

## The softest input, named

**The number of producing organisations that have a budget and would spend it
on this.** Not the number of theatres — the number with a line item. Nothing
in this run sourced it. Candidate primary sources for the next session, in
order: EdTA on US high schools producing plays and the students in them; AACT
on community theatres; TCG Theatre Facts on nonprofit professional theatres
and their budgets; the NEA Survey of Public Participation in the Arts.

**Do not fill this gap from memory.** The decision in `deck-v3.md` does not
depend on it: five phone calls to directors answer "is there a budget and who
signs" faster and better than any desk estimate, and that is already the ask.

## What nobody in this run has data for

1. How many productions a year, at any definition.
2. Whether a school or community theatre has ever bought software of this kind.
3. What the solo competitors' actual conversion and churn look like.
4. Whether a director will accept a default voice casting (which is what the
   render cache needs to compound — `moat-measured.md`).
5. Invite-link conversion in this product: sent → accepted → started their own.
   **This one is not research. It is instrumentation, and it is the ask.**
