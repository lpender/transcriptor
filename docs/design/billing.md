# Billing — $1 a seat a month, paid by the production (design round, 2026-09-30)

Follows ADR 003 and PLATFORM.md §2; reference implementation bodylang's
`billing_controller.rb` + `webhooks/stripe_controller.rb`. Decided by the
loop; Stripe keys are Lee's.

## Understand

The owner of a production pays. Seats = members. A solo actor is one seat.
Cast come and go during a run, so the seat count moves. Nobody should lose
work when a card fails: lapse means read-only, never deletion.

## Diverge

1. **Per-user subscription** (each member pays $1). Simple Stripe, but the
   director cannot pay for the cast, and a cast member who never pays is
   locked out of the production's script. Rejected.
2. **Per-production subscription, quantity = members** (Stripe licensed
   pricing, quantity updated as members join and leave, prorated). One
   customer per owner, one subscription per production. Chosen.
3. **Flat per production** ($10/month any size). Simpler still, but a
   production of one pays ten times ADR 003's promise.
4. **Credits** (buy $10, burn $1/seat/month). Meter to run, users hate it.

## Skeptic

- Stripe fee on $1: 33 cents. Mitigation in ADR 003: yearly $10/seat by
  default; monthly offered. With quantity billing a production of 8 is $8
  a month, one charge, fee 53 cents: fine.
- Trial: an actor pasting a script to try must not hit a paywall. Free
  until a second member joins? That makes the solo tier free forever.
  Decided: 14-day trial on every production (Stripe `trial_period_days`),
  then paid; `try-it` without an account stays free (nothing to keep).
- What is gated when unpaid? Writes: adding members, rendering, uploading
  sound, saving the script. Reading, learning, notes and Together keep
  working (read-only), so a rehearsal never dies on a card. Progress still
  posts (it is the actor's, not the production's).
- Seat changes: `members` insert/delete → update the subscription quantity
  (proration on). Invite accept and remove-member call it; failures are
  logged, not fatal (the next change resyncs).
- Ownership transfer: the customer is the owner's; a new owner re-checks
  out. Edge case, documented, not built.
- Webhook truth: `checkout.session.completed`, `customer.subscription.updated`
  / `.deleted`, `invoice.payment_failed` → `productions.state` ∈ trial |
  active | past_due | readonly, plus `stripe_customer_id`,
  `stripe_subscription_id`, `current_period_end`. One predicate
  `canWrite(production)`.
- Signature verification: Stripe-Signature `t=…,v1=…`, HMAC-SHA256 of
  `${t}.${body}` with the endpoint secret, 5-minute tolerance. Web Crypto,
  no SDK. Stripe's REST API is plain `fetch` with a bearer key and
  form-encoded bodies; no SDK either (Workers-compatible, one adapter).
- Prices: two Stripe prices (monthly $1, yearly $10) created in the
  dashboard; their ids are env vars. `GET /billing/plans` reads them so the
  page never disagrees with Stripe.

## Spec

- Schema: `productions` + `stripe_customer_id`, `stripe_subscription_id`,
  `state` (existing) values trial|active|past_due|readonly, `trial_ends_at`,
  `period_ends_at`.
- `api/src/stripe.ts`: `createCheckout(customer, price, quantity, urls)`,
  `createPortal(customer, url)`, `setQuantity(subscription, n)`,
  `verifyWebhook(body, sig, secret)`, `findOrCreateCustomer(email)`. Pure
  fetch; a `setStripe()` seam for tests like `setEngine()`.
- Routes: `POST /productions/:id/billing/checkout {plan}` [billing] →
  {url}; `POST /productions/:id/billing/portal` [billing] → {url};
  `GET /billing/plans` (public); `POST /webhooks/stripe` (signature).
- Gate: `canWrite` checked in script PUT, sound POST, render start,
  invite accept (joining a readonly production is refused with a plain
  message), member add.
- Web: the company panel shows the state in words ("Trial, 12 days left",
  "Paid until 12 Oct", "Card failed: rehearsals keep going, saving
  stops") with one button: Pay (Checkout) or Manage (Portal).
- Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`,
  `STRIPE_PRICE_YEARLY` — all Lee's (ACTION), test mode first.

## Split into Queue items

- `billing-core` — schema, `stripe.ts` with the test seam, `verifyWebhook`
  unit-tested against a hand-signed payload, `canWrite`, trial set at
  production creation.
- `billing-routes` — checkout, portal, plans, webhook → state; tests with
  a stubbed Stripe.
- `billing-gate` — `canWrite` on the write routes; tests.
- `billing-seats` — quantity sync on member changes; tests.
- `web-billing` — the state line and the one button in the company panel.
