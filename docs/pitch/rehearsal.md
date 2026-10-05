# The rehearsal (2026-10-04)

**The investor is a real person. Every test below is sourced to something he
published; every word in his mouth here is the loop's, written to apply his
own recorded tests. He has not seen this company and nothing here implies he
has.** Sources: `docs/personas/investor-rob-walling.md`.

---

**INVESTOR:** Revenue?

**FOUNDER:** None. One production uses it, mine.

**INVESTOR:** Then we would decline the application on the first screen — that
is a stated rule, not a judgment call. But let us keep going, because the
interesting part is why there is no revenue. What were you going to charge?

**FOUNDER:** A dollar a seat a month, billed to the production. A cast of ten
is ten dollars.

**INVESTOR:** And the production ends.

**FOUNDER:** Six to eight weeks.

**INVESTOR:** So the lifetime value is twenty dollars, maybe thirty. What is
your plan for acquiring a customer for less than twenty dollars?

**FOUNDER:** The invite link. A director invites the cast, so twelve people
get the product for nothing.

**INVESTOR:** That is the best answer on this page and you did not put it on
the deck. How many of those twelve have ever started a production of their
own?

**FOUNDER:** I do not know. It is not instrumented.

**INVESTOR:** Then you do not know whether you have a business or a hobby, and
no amount of building tells you. What is the moat?

**FOUNDER:** The rendered voices are cached globally. A line rendered once is
free for every company after.

**INVESTOR:** For the same casting?

**FOUNDER:** Only for the same casting. The hash includes the voice.

**INVESTOR:** So the cache pays off when nobody exercises taste, and the one
thing a director will want to control is exactly the thing that voids it. That
is a cost advantage with a hole in it, and it is not a moat. Features are not
moats either — switching cost is. What does a cast lose by leaving?

**FOUNDER:** Their progress. The weak lines, the clean runs.

**INVESTOR:** Which they abandon anyway when the show closes. Your product's
switching cost expires on the same schedule as your revenue. Is this B2B?

**FOUNDER:** Sold to the cast, no. Sold to the department that produces four
shows a year — same code — yes.

**INVESTOR:** That is the company. Does that buyer exist?

**FOUNDER:** I have not asked one.

**INVESTOR:** Five calls. You have a theatre network; use it before you write
another line. And what is your runway?

**FOUNDER:** Under six months, and I have a full-time job.

**INVESTOR:** Then the only correct answer is the one you are already living:
do not quit, do not raise, do not build. Get one stranger to pay you.

---

## Scorecard against his published tests

| # | Test (sourced) | Result | Why |
|---|---|---|---|
| 1 | MRR now, and six months ago | **FAIL** | $0. "Applications from companies without revenue will be denied." |
| 2 | Revenue and logo churn | **FAIL** | Churn is structural: the customer is a production, and productions close. |
| 3 | ARPC and LTV | **FAIL** | ARPC $10/mo, LTV $20–30. No acquisition budget exists at that number. |
| 4 | Is this B2B SaaS? | **PARTIAL** | Not as priced. Yes, if the buyer becomes the producing organisation — same code. |
| 5 | What is the moat, and is it real? | **FAIL** | Counted and found conditional on shared voice casting. `moat-measured.md`. |
| 6 | Ongoing access to demand | **PARTIAL** | The invite link is a real built-in mechanic, unmeasured and unexploited. Two owned channels, both small. |
| 7 | Market size, marketplace dependency | **UNANSWERED** | No marketplace dependency (good). Size unsourced inside the window — the first thing to find out. |
| 8 | A real business on its own terms | **PARTIAL** | Not at $1 a seat. Possibly at an institutional season price, which is untested. |

**1 unanswered, 3 partial, 4 fail, 0 pass.** The failures are all the same
failure wearing different hats: **the price and the buyer are wrong, and no
amount of product fixes that.**

## What to actually practise

Five lines, not advice:

1. "One production pays today — mine does not count, so the number is zero."
   (Say it first. Do not let it be discovered.)
2. "A production closes in six weeks, so the cast is the wrong customer. The
   department that programmes four shows a year is the customer."
3. "The invite link puts the product in twelve hands for nothing. I am
   instrumenting it this month and that number decides whether I continue."
4. "There is no moat. There is a global render cache that pays off only on
   shared casting, and a product shape nobody else has built yet."
5. When a market question arrives, answer it with a market answer. **Past
   three sentences of architecture, a market question went unanswered.**
