# 003 — $1 per seat per month to the production; voices sold per script

- Date: 2026-09-30
- Status: Accepted

## Context

Lee wants $1/month subscriptions and no Apple 30%. Stripe takes $0.30 + 2.9%
per charge, a third of a $1 charge. An ElevenLabs render of a full play is
about $30, thirty months of one subscriber. Competitors charge $12/month
(coldRead) or $4–$20 once.

## Decision

- Billing is per production, paid by its owner, on the web only (no IAP).
  $1 per member per month, or $10 per member per year. A production of one
  is $1/month.
- Browser `SpeechSynthesis` voices are included.
- An ElevenLabs render is sold per script: price shown before rendering,
  computed from the characters not yet in the clip cache, at cost plus
  margin. Clips are cached globally by `sha1(model + voice + text)`, so a
  line anyone has rendered is free for everyone after.
- A production may supply its own ElevenLabs key and render at no charge.

## Alternatives rejected

- Unlimited voices in the subscription — loses money on every play.
- Credit packs ("voice minutes") — honest but users cannot predict a play's
  cost and hate meters.
- BYO key only — most actors have no ElevenLabs account.

## Consequences

- Never a negative-margin user. Popular plays trend to zero marginal cost.
- The cache is a shared asset across productions; only clip audio is shared,
  never which production rendered it.
- Stripe fees on yearly billing are 6.5% instead of 33%; monthly stays
  available.
