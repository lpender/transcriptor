import { describe, expect, it } from 'vitest';
import { handle } from '../src/router';
import '../src/routes/auth';
import '../src/routes/invites';
import '../src/routes/productions';
import '../src/routes/scripts';
import '../src/routes/sound';
import { setStripe, type StripeCalls } from '../src/stripe';
import { env } from './env';
import { signIn } from './helpers';

describe('read-only productions', () => {
  it('refuse saves, invites and joins with a plain message, keep reading', async () => {
    const ann = await signIn('ann23@example.com'), bob = await signIn('bob23@example.com');
    const { production } = await (await ann.call('POST', '/productions', { name: 'Lapsed' })).json() as { production: { id: string } };
    await ann.call('PUT', `/productions/${production.id}/script`, { title: 'L', text: 'A: Hi.' });
    const { url } = await (await ann.call('POST', `/productions/${production.id}/invites`, { role: 'cast' })).json() as { url: string };
    const token = new URL(url).searchParams.get('invite')!;
    await env.DB.prepare("UPDATE productions SET trial_ends_at = '2000-01-01T00:00:00Z' WHERE id = ?").bind(production.id).run();   // trial over, no subscription
    const put = await ann.call('PUT', `/productions/${production.id}/script`, { title: 'L', text: 'A: Bye.' });
    expect(put.status).toBe(402);
    expect((await put.json() as { message: string }).message).toContain('saving is off');
    expect((await ann.call('POST', `/productions/${production.id}/invites`, { role: 'cast' })).status).toBe(402);
    expect((await bob.call('POST', `/invites/${token}/accept`)).status).toBe(402);
    expect((await ann.call('GET', `/productions/${production.id}/script`)).status).toBe(200);   // reading is fine
    expect((await ann.call('GET', `/productions/${production.id}`)).status).toBe(200);
    // paying brings it back
    await env.DB.prepare("UPDATE productions SET state = 'active', stripe_subscription_id = 'sub_x' WHERE id = ?").bind(production.id).run();
    expect((await ann.call('PUT', `/productions/${production.id}/script`, { title: 'L', text: 'A: Bye.' })).status).toBe(200);
    expect((await bob.call('POST', `/invites/${token}/accept`)).status).toBe(200);
  });
});

describe('seats', () => {
  it('follow joins and removals when a subscription exists', async () => {
    const calls: [string, number][] = [];
    const s: StripeCalls = {
      createCustomer: async () => ({ id: 'c' }), createCheckout: async () => ({ url: '' }), createPortal: async () => ({ url: '' }), getPrices: async () => [],
      setQuantity: async (sub, q) => { calls.push([sub, q]); },
    };
    setStripe(s);
    (env as unknown as { STRIPE_SECRET_KEY?: string }).STRIPE_SECRET_KEY = 'sk';
    const ann = await signIn('ann24@example.com'), bob = await signIn('bob24@example.com'), cy = await signIn('cy24@example.com');
    const { production } = await (await ann.call('POST', '/productions', { name: 'Seats' })).json() as { production: { id: string } };
    const { url } = await (await ann.call('POST', `/productions/${production.id}/invites`, { role: 'cast' })).json() as { url: string };
    const token = new URL(url).searchParams.get('invite')!;
    await bob.call('POST', `/invites/${token}/accept`);
    expect(calls).toEqual([]);   // no subscription yet: nothing to sync
    await env.DB.prepare("UPDATE productions SET stripe_subscription_id = 'sub_s' WHERE id = ?").bind(production.id).run();
    await cy.call('POST', `/invites/${token}/accept`);
    expect(calls).toEqual([['sub_s', 3]]);
    await ann.call('DELETE', `/productions/${production.id}/members/${bob.user.id}`);
    expect(calls).toEqual([['sub_s', 3], ['sub_s', 2]]);
    setStripe(null);
    expect((await handle(new Request('http://x/health'), env)).status).toBe(200);
  });
});
