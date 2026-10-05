# Teardown round 1 — structure (2026-10-04)

Deck v1 read against the tests in `docs/personas/investor-rob-walling.md` §6.
The counterparty is a bootstrapper investor, chosen because the founder wants
income and an honest read, not a venture outcome. That choice already decides
half the verdict: the question is not "is this fundable" but "is this a
business".

## Slide by slide

| # | Slide | Verdict | Why |
|---|---|---|---|
| 1 | Tablework | **Keep** | The one-line position is clear and nobody else can write it. |
| 2 | The problem | **Keep, sharpen** | "Twelve actors learn the play twelve ways" is the real insight and it is buried in the second sentence. |
| 3 | The product | **Cut by half** | Five bullets, of which two (sound cues, room sync) are show-night features used twice a run. They dilute the one that is daily. |
| 4 | Why now | **Cut** | "TTS got cheap" is available to all four competitors on the same day. This is the AI-wrapper slide; it dies in two minutes. |
| 5 | What exists | **Rewrite** | 342 commits and 66 tests are *costs*. Presenting them as progress says the founder cannot tell cost from evidence. |
| 6 | Competition | **Keep the table, drop the word moat** | The table is honest and sourced. See `moat-measured.md`: there is no moat. |
| 7 | Business model | **This is where it dies** | See the arithmetic below. |
| 8 | Traction | **Honest, and fatal as written** | "None yet" against this investor's stated bar: *"Applications from companies without revenue will be denied."* |
| 9 | Team | **Keep, add the gate** | One part-time engineer with an employer IP assignment. Omitting that is the kind of thing that ends a conversation later rather than earlier. |
| 10 | The ask | **Blank is correct** | The honest ask is not money. See `refined-idea.md`. |

## The three questions that decide the meeting

### 1. "What is your ARPU, and what is the LTV?"

The deck never says. Computed from its own numbers:

- ARPC (per production, the paying customer) = **$10/month** for a cast of ten.
- A production rehearses 6–8 weeks and closes. Call it **2 months of paying**,
  generously 3 if they pay through the run.
- **LTV ≈ $20–30 per production**, before the renders, which are sold at cost
  plus a $1 minimum and therefore contribute approximately nothing.

The investor has already stated what that means, before the pitch starts:

> "B2C apps are brutal. They're like eating glass." … "once you get into the
> millions, it's very, very difficult to do that because your churn is so
> high, so much customer support." — ep. 840, 2026-07-07

**At a $20–30 LTV there is no acquisition budget.** Not a small one — none. A
single $15 Google click would have to convert at better than 50% to break
even inside a production's life. That is the whole meeting.

### 2. "How do you get in front of demand on an ongoing basis?"

The deck has no answer. The founder owns two channels, both real and both
small: the production he is in, and a theatre network he can email. The
investor's recorded prior on the alternative:

> only ~4% of the portfolio uses social as a primary channel … "Almost no one
> makes it." — ep. 824, 2026-03-17

What the deck should have noticed and did not: **the invite link is already a
channel.** A director inviting twelve actors puts the product in twelve hands
at zero cost, and some of those actors direct elsewhere next season. That is
the only acquisition mechanic the product has, it is built, and it is
unmeasured and unexploited.

### 3. "Is this B2B SaaS?"

> "We primarily invest in software services that target businesses (B2B
> SaaS)." — application preview, 2026

Sold at $1 a seat to a cast, this is a consumer subscription wearing a team's
clothes. Sold to the *organisation* — the theatre, the school, the department
that produces four shows a year and has a budget line — it is B2B. **Same
code, same product, different buyer and a different price.** That is the
single largest finding of this round and it is a pricing change, not a build.

## The two failure patterns, both present

- **Engineering output in a traction position** — slide 5. Cut the counts;
  keep "working, on a live URL, in use by a real cast".
- **"Now with AI"** — slide 4. The defensible version demotes rendered voices
  to a cost line and leads with the thing that is new: *one shared reading of
  the play for the whole company, and the director's view of who is off book.*

## What survives round 1

One sentence: **a cast of twelve rehearsing against one shared reading of the
play, with the director seeing who is off book.** Everything else on the deck
is either a cost, a feature, or a price that cannot pay for its own customers.
