//   GET  /billing/plans                              → the two prices, from Stripe (public, cached)
//   GET  /productions/:id/billing                    → state in words, plan, seats             [read]
//   POST /productions/:id/billing/checkout {plan}    → {url} Stripe Checkout, quantity = members [billing]
//   POST /productions/:id/billing/portal             → {url} Stripe Customer Portal            [billing]
//   POST /webhooks/stripe                            → the source of truth for production.state
import { billingOf, describe, effectiveState } from '../billing';
import { now } from '../ids';
import { gate } from '../productions';
import { error, json, route } from '../router';
import { stripe, verifyWebhook } from '../stripe';

let plansCache: { at: number; plans: unknown } | null = null;

route('GET', '/billing/plans', async (_req, env) => {
  const s = stripe(env.STRIPE_SECRET_KEY);
  if (!s || !env.STRIPE_PRICE_MONTHLY || !env.STRIPE_PRICE_YEARLY) return json({ plans: [], off: true });
  if (plansCache && Date.now() - plansCache.at < 3600_000) return json({ plans: plansCache.plans });
  const prices = await s.getPrices([env.STRIPE_PRICE_MONTHLY, env.STRIPE_PRICE_YEARLY]);
  const plans = prices.map((p) => ({ plan: p.interval === 'year' ? 'yearly' : 'monthly', cents: p.unit_amount, currency: p.currency, per: p.interval }));
  plansCache = { at: Date.now(), plans };
  return json({ plans });
});

route('GET', '/productions/:id/billing', async (req, env, { id }) => {
  const g = await gate(env.DB, req, id, 'read');
  if (g instanceof Response) return g;
  const b = (await billingOf(env.DB, id))!;
  const seats = (await env.DB.prepare('SELECT COUNT(*) AS n FROM members WHERE production_id = ?').bind(id).first<{ n: number }>())!.n;
  return json({ state: effectiveState(b), words: describe(b), seats, subscribed: !!b.stripe_subscription_id, off: !stripe(env.STRIPE_SECRET_KEY) });
});

route('POST', '/productions/:id/billing/checkout', async (req, env, { id }) => {
  const g = await gate(env.DB, req, id, 'billing');
  if (g instanceof Response) return g;
  const s = stripe(env.STRIPE_SECRET_KEY);
  if (!s) return error('billing_off', 503, 'Billing is not switched on here yet.');
  const { plan } = (await req.json().catch(() => ({}))) as { plan?: unknown };
  const price = plan === 'monthly' ? env.STRIPE_PRICE_MONTHLY : plan === 'yearly' ? env.STRIPE_PRICE_YEARLY : undefined;
  if (!price) return error('invalid_plan', 400, 'monthly or yearly.');
  const b = (await billingOf(env.DB, id))!;
  if (b.stripe_subscription_id) return error('already_subscribed', 409, 'This production already has a subscription; use Manage.');
  try {
    let customer = b.stripe_customer_id;
    if (!customer) {
      customer = (await s.createCustomer(g.user.email, g.user.name ?? undefined)).id;
      await env.DB.prepare('UPDATE productions SET stripe_customer_id = ? WHERE id = ?').bind(customer, id).run();
    }
    const seats = (await env.DB.prepare('SELECT COUNT(*) AS n FROM members WHERE production_id = ?').bind(id).first<{ n: number }>())!.n;
    const trialLeft = b.trial_ends_at ? Math.ceil((new Date(b.trial_ends_at).getTime() - Date.now()) / 86400000) : 0;
    const { url } = await s.createCheckout({ customer, price, quantity: Math.max(1, seats), reference: id, success: `${env.APP_ORIGIN}/?billing=ok`, cancel: `${env.APP_ORIGIN}/?billing=cancel`, trialDays: trialLeft > 0 ? trialLeft : undefined });
    return json({ url });
  } catch (e) { console.error('checkout:', e); return error('billing_unavailable', 502, 'Billing is not reachable right now. Nothing was charged.'); }
});

route('POST', '/productions/:id/billing/portal', async (req, env, { id }) => {
  const g = await gate(env.DB, req, id, 'billing');
  if (g instanceof Response) return g;
  const s = stripe(env.STRIPE_SECRET_KEY);
  if (!s) return error('billing_off', 503, 'Billing is not switched on here yet.');
  const b = (await billingOf(env.DB, id))!;
  if (!b.stripe_customer_id) return error('no_billing', 404, 'Nothing to manage yet.');
  try { return json({ url: (await s.createPortal(b.stripe_customer_id, `${env.APP_ORIGIN}/?billing=managed`)).url }); }
  catch (e) { console.error('portal:', e); return error('billing_unavailable', 502, 'Billing is not reachable right now.'); }
});

// Stripe's events → the production's state. Verified, idempotent, and quiet
// about events it does not care about. The production is found by the
// subscription's metadata, set at Checkout.
interface Sub { id: string; customer: string; status: string; current_period_end?: number; trial_end?: number | null; metadata?: { production?: string }; items?: { data: { quantity: number }[] } }
route('POST', '/webhooks/stripe', async (req, env) => {
  if (!env.STRIPE_WEBHOOK_SECRET) return error('billing_off', 503);
  const body = await req.text();
  if (!(await verifyWebhook(body, req.headers.get('stripe-signature'), env.STRIPE_WEBHOOK_SECRET))) return error('bad_signature', 400);
  const event = JSON.parse(body) as { id: string; type: string; data: { object: Record<string, unknown> } };
  const o = event.data.object;
  const setState = async (pid: string, state: string, sub: Sub | null) => {
    await env.DB.prepare('UPDATE productions SET state = ?, stripe_subscription_id = COALESCE(?, stripe_subscription_id), stripe_customer_id = COALESCE(?, stripe_customer_id), period_ends_at = COALESCE(?, period_ends_at) WHERE id = ?')
      .bind(state, sub?.id ?? null, sub?.customer ?? null, sub?.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null, pid).run();
  };
  const fromStatus = (status: string) => (status === 'trialing' ? 'trial' : status === 'active' ? 'active' : status === 'past_due' || status === 'unpaid' ? 'past_due' : 'readonly');
  switch (event.type) {
    case 'checkout.session.completed': {
      const pid = o.client_reference_id as string | undefined;
      if (pid) await env.DB.prepare('UPDATE productions SET stripe_customer_id = ?, stripe_subscription_id = COALESCE(?, stripe_subscription_id), state = CASE WHEN state = "readonly" THEN "active" ELSE state END WHERE id = ?').bind(o.customer as string, (o.subscription as string | null) ?? null, pid).run();
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = o as unknown as Sub;
      if (sub.metadata?.production) await setState(sub.metadata.production, fromStatus(sub.status), sub);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = o as unknown as Sub;
      if (sub.metadata?.production) await env.DB.prepare("UPDATE productions SET state = 'readonly', stripe_subscription_id = NULL WHERE id = ?").bind(sub.metadata.production).run();
      break;
    }
    case 'invoice.payment_failed': {
      const subId = (o.subscription as string | null) ?? null;
      if (subId) await env.DB.prepare("UPDATE productions SET state = 'past_due' WHERE stripe_subscription_id = ?").bind(subId).run();
      break;
    }
    default:
      console.log(`stripe: unhandled ${event.type}`);
  }
  return json({ received: true, at: now() });
});
