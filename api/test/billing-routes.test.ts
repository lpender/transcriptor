import { describe, expect, it } from 'vitest';
import { handle } from '../src/router';
import '../src/routes/auth';
import '../src/routes/billing';
import '../src/routes/productions';
import { setStripe, signWebhook, type StripeCalls } from '../src/stripe';
import { env } from './env';
import { signIn } from './helpers';

const fake = () => {
  const log: unknown[] = [];
  const s: StripeCalls = {
    createCustomer: async (email) => { log.push(['customer', email]); return { id: 'cus_1' }; },
    createCheckout: async (o) => { log.push(['checkout', o]); return { url: 'https://checkout.stripe.test/s' }; },
    createPortal: async (c) => { log.push(['portal', c]); return { url: 'https://portal.stripe.test/p' }; },
    setQuantity: async (sub, q) => { log.push(['qty', sub, q]); },
    getPrices: async (ids) => ids.map((id, k) => ({ id, unit_amount: k ? 1000 : 100, currency: 'usd', interval: k ? 'year' : 'month' })),
  };
  return { s, log };
};
const e = env as unknown as Record<string, string | undefined>;

describe('billing routes', () => {
  it('quotes plans, sends the owner to checkout with the seat count, then to the portal', async () => {
    const { s, log } = fake();
    setStripe(s);
    Object.assign(e, { STRIPE_SECRET_KEY: 'sk_test', STRIPE_PRICE_MONTHLY: 'price_m', STRIPE_PRICE_YEARLY: 'price_y', STRIPE_WEBHOOK_SECRET: 'whsec' });
    const plans = await (await handle(new Request('http://x/billing/plans'), env)).json() as { plans: { plan: string; cents: number }[] };
    expect(plans.plans).toEqual([{ plan: 'monthly', cents: 100, currency: 'usd', per: 'month' }, { plan: 'yearly', cents: 1000, currency: 'usd', per: 'year' }]);
    const ann = await signIn('ann22@example.com'), bob = await signIn('bob22@example.com');
    const { production } = await (await ann.call('POST', '/productions', { name: 'Bill' })).json() as { production: { id: string } };
    await env.DB.prepare("INSERT INTO members VALUES (?, ?, 'director', '[]', '2026-09-30T00:00:00Z')").bind(bob.user.id, production.id).run();
    const st = await (await bob.call('GET', `/productions/${production.id}/billing`)).json() as { state: string; words: string; seats: number };
    expect(st).toMatchObject({ state: 'trial', seats: 2 });
    expect(st.words).toMatch(/^Trial, 14 days left/);
    expect((await bob.call('POST', `/productions/${production.id}/billing/checkout`, { plan: 'yearly' })).status).toBe(403);   // director may not pay
    expect((await ann.call('POST', `/productions/${production.id}/billing/checkout`, { plan: 'weekly' })).status).toBe(400);
    expect((await ann.call('POST', `/productions/${production.id}/billing/portal`)).status).toBe(404);   // nothing yet
    const co = await (await ann.call('POST', `/productions/${production.id}/billing/checkout`, { plan: 'yearly' })).json() as { url: string };
    expect(co.url).toBe('https://checkout.stripe.test/s');
    const checkout = log.find((l) => (l as unknown[])[0] === 'checkout') as [string, { quantity: number; price: string; reference: string; trialDays?: number }];
    expect(checkout[1]).toMatchObject({ quantity: 2, price: 'price_y', reference: production.id, trialDays: 14 });
    expect(await (await ann.call('POST', `/productions/${production.id}/billing/portal`)).json()).toEqual({ url: 'https://portal.stripe.test/p' });

    // the webhook is the truth
    const post = async (event: unknown, sig?: string) => {
      const body = JSON.stringify(event);
      return handle(new Request('http://x/webhooks/stripe', { method: 'POST', headers: { 'stripe-signature': sig ?? (await signWebhook(body, 'whsec')) }, body }), env);
    };
    expect((await post({ type: 'x' }, 't=1,v1=bad')).status).toBe(400);
    expect((await post({ id: 'evt_1', type: 'checkout.session.completed', data: { object: { client_reference_id: production.id, customer: 'cus_1', subscription: 'sub_1' } } })).status).toBe(200);
    await post({ id: 'evt_2', type: 'customer.subscription.updated', data: { object: { id: 'sub_1', customer: 'cus_1', status: 'active', current_period_end: 1_800_000_000, metadata: { production: production.id } } } });
    let b = await (await ann.call('GET', `/productions/${production.id}/billing`)).json() as { state: string; words: string; subscribed: boolean };
    expect(b).toMatchObject({ state: 'active', subscribed: true });
    expect(b.words).toMatch(/^Paid until/);
    expect((await ann.call('POST', `/productions/${production.id}/billing/checkout`, { plan: 'yearly' })).status).toBe(409);
    await post({ id: 'evt_3', type: 'invoice.payment_failed', data: { object: { subscription: 'sub_1' } } });
    b = await (await ann.call('GET', `/productions/${production.id}/billing`)).json() as { state: string; words: string; subscribed: boolean };
    expect(b.state).toBe('past_due');
    await post({ id: 'evt_4', type: 'customer.subscription.deleted', data: { object: { id: 'sub_1', customer: 'cus_1', status: 'canceled', metadata: { production: production.id } } } });
    b = await (await ann.call('GET', `/productions/${production.id}/billing`)).json() as { state: string; words: string; subscribed: boolean };
    expect(b).toMatchObject({ state: 'readonly', subscribed: false });
    setStripe(null);
  });
  it('is off without keys', async () => {
    setStripe(null);
    Object.assign(e, { STRIPE_SECRET_KEY: undefined, STRIPE_WEBHOOK_SECRET: undefined });
    expect(await (await handle(new Request('http://x/billing/plans'), env)).json()).toEqual({ plans: [], off: true });
    expect((await handle(new Request('http://x/webhooks/stripe', { method: 'POST', body: '{}' }), env)).status).toBe(503);
  });
});
