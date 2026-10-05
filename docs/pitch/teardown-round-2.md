# Teardown round 2 — the market as it is (2026-10-04)

A separate research leg, landed after the window closed and folded in. It is
the round that changes the company rather than the deck, and it did.

**How to read it.** The leg re-verified every App Store date against Apple's
`itunes.apple.com/lookup` API rather than the rendered page, and in doing so
**corrected three of its own earlier dates by about two years**. That is the
right failure to have: store dates come from the API, never the HTML. Its
weakest section is named below rather than presented as absence of evidence.

## 1. The price ceiling, and it has not moved in a decade

| Source | Date | Words |
|---|---|---|
| r/Theatre | 2016-08-23 | *"It's $4, but it's definitely the best money I've ever spent on an app."* |
| r/Theatre | 2026-03-17 | *"LineLearner (which costs about $4 once)."* |
| r/Theatre | 2025-06-22 | thread titled *"any free apps similiar to coldRead?"* — *"it isn't free (not only that, it's quite expensive,)"* |

**Ten years, same number: $4, once.** The ask arrives anchored at zero —
*"What are you using (free preferably)?"*, top answer *"free version is fine
for basics."* And the churn is the run, in a user's own words: *"I found it
worthy of two months' subscription"* — not "I subscribe."

**Of roughly 25 line-learning apps currently shipping, every one is free**,
with about 40 new entrants in the last six months, most with zero ratings.

## 2. The leader could not fund itself

**coldRead** has 3,934 ratings — the largest installed base in the category by
roughly 28× — and its iOS build has been **frozen since 2022-12-03** while it
still bills $10.99/month and $83.99/year. Its own latest release note is the
epitaph: *"This app has been updated by Apple to prepare for watchOS 27
compatibility"* — Apple recompiling an abandoned binary that is still charging
annually.

**When the category leader cannot fund development at $10.99 a month, the
constraint is price, not product.** That is a demand-side cause, and
demand-side causes do not get fixed by building better.

## 3. The graveyard, and the one death that should worry us most

The category's graveyard is not dead companies — it is **abandoned listings
still charging**. Nobody announces death here; exactly one app in the whole
sweep has a stated cause.

- **Scene Partner** (MyTheaterApps LLC) — **dead**. Listing `id375769774` now
  returns `resultCount: 0`, the App Store 404s, the domain is parked on a
  content farm. It was **the only line-learning app that ever worked from
  licensed script text, with real MTI and Samuel French e-Script deals** —
  precisely the asset anyone would nominate as this category's moat. **Licensed
  scripts did not save it.** No cause public.
- **Scenebot / Scenebot Stage** — frozen 2020, domain gone, shell pivoted away.
- **Theatrely** — domain gone, last article 2026-06-07.
- **linelearner.com** — 302s to HugeDomains, parked for sale.
- **An app called "Lines"** — its disappearance produced [one r/Theatre post on
  2020-08-14](https://reddit.com/r/Theatre/comments/i9r1x1/) asking why, with
  **zero replies.** Nobody noticed it had gone.
- **Zombies, listed and charging and not shipped in years:** coldRead
  (2022-12-03), The Actor's Lines (2021-03-14), Play On Cue (2019-03-17),
  Stagehand (2020-03-24), Wozzol (2021-07-19), Stella – Run Lines (one release,
  2024-12-19).
- **Dormant:** LineLearner, sixteen years old. iOS frozen 2024-07-13, release
  note in full: *"Fixing build issue."* Android 10K+ downloads, $5.49, 2.9
  stars. Its developer's site's newest dated item is from **2014-05-06**.
- **Alive and shipping:** Off Book! (2026-09-25), Rehearsal Pro (2026-09-08,
  $19.99 once, 66 ratings), ActOnCue (2026-10-02).

**The one clean supply-side failure:** **Theatre Manager** (Arts Management
Systems, founded 1985) announced wind-down **2024-05-08** and handed ~200+
institutional clients to Spektrix. Forty years, solo-led, lost a capital race.
That is fixable with money — and it is the only one here that is.

## 4. The finding that changes the company

**Two products in the entire field sell to a production rather than an actor:**

| Product | Price | Who pays |
|---|---|---|
| Off Book! (LineSync) | $1.99/month | the director; the cast never pays |
| **Stage Write** | $5.99–9.99/month, **$249/yr team, $599/yr education** | whoever holds the budget |

**Stage Write is the one commercially healthy product in the whole report.**
Free read-only seats for the cast, paid seats for the budget holder — it routes
around the $4-once individual entirely.

That is `refined-idea.md`'s position, found independently in the market, with a
price band attached. **The organisation pivot is not a hypothesis any more; it
is the only shape in this category with evidence behind it.** It also prices it:
$249–599 a year, not the $199–399 guessed before this leg landed.

## 5. Distribution through the obvious channels is closed

- **r/Theatre moderators removed a launch post on 2026-05-07.**
- **r/acting auto-removes memorisation questions** as FAQ duplicates.
- **Hacker News has zero coverage of the category** across every query tried.

So the invite link and the founder's own network are not merely the best
channels — within what was searched, they are the only ones.

## 6. What was NOT searched, and must not be filled from memory

The leg's own caveats, carried verbatim in substance:

1. **Dated theatre-tech shutdown announcements** — the search budget ran out
   mid-sweep and fallbacks served CAPTCHAs. Treat that near-empty result as
   **"not searched," not as absence of deaths.**
2. **Founder post-mortems** on Indie Hackers, Medium and Substack: unsearched.
3. **No cause of death is public** for Scene Partner, coldRead, Scenebot,
   LineLearner, "Lines" or Theatrely.
4. `currentVersionReleaseDate` proves the **developer account** is live, not
   that the product is developed.
5. Funding rounds in arts/theatre/education-creative tools, 2024–2026: not
   delivered inside the window.
