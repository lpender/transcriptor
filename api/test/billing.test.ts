import { describe, expect, it } from 'vitest';
import { canWrite, describe as words, effectiveState, type Billing } from '../src/billing';
import '../src/routes/auth';
import '../src/routes/productions';
import { signWebhook, verifyWebhook } from '../src/stripe';
import { env } from './env';
import { signIn } from './helpers';

const b = (o: Partial<Billing>): Billing => ({ state: 'trial', trial_ends_at: null, period_ends_at: null, stripe_customer_id: null, stripe_subscription_id: null, ...o });

describe('billing state', () => {
  it('a running trial writes; a lapsed one is read-only; a subscription rescues it', () => {
    const now = new Date('2026-10-01T00:00:00Z');
    expect(canWrite(b({ trial_ends_at: '2026-10-10T00:00:00Z' }), now)).toBe(true);
    expect(effectiveState(b({ trial_ends_at: '2026-09-20T00:00:00Z' }), now)).toBe('readonly');
    expect(canWrite(b({ trial_ends_at: '2026-09-20T00:00:00Z', stripe_subscription_id: 'sub_1' }), now)).toBe(true);
    expect(canWrite(b({ state: 'past_due' }), now)).toBe(true);
    expect(canWrite(b({ state: 'readonly' }), now)).toBe(false);
    expect(words(b({ trial_ends_at: '2026-10-10T00:00:00Z' }), now)).toBe('Trial, 9 days left.');
    expect(words(b({ state: 'active', period_ends_at: '2026-10-12T00:00:00Z' }), now)).toBe('Paid until 12 Oct.');
    expect(words(b({ state: 'readonly' }), now)).toContain('saving is off');
  });
  it('a new production starts on a 14-day trial', async () => {
    const ann = await signIn('ann21@example.com');
    const { production } = await (await ann.call('POST', '/productions', { name: 'Trial' })).json() as { production: { id: string; state: string } };
    expect(production.state).toBe('trial');
    const row = await env.DB.prepare('SELECT trial_ends_at FROM productions WHERE id = ?').bind(production.id).first<{ trial_ends_at: string }>();
    const days = (new Date(row!.trial_ends_at).getTime() - Date.now()) / 86400000;
    expect(days).toBeGreaterThan(13.9);
    expect(days).toBeLessThan(14.1);
  });
});

describe('webhook signature', () => {
  it('accepts a body signed with the secret, within five minutes, and nothing else', async () => {
    const body = '{"id":"evt_1","type":"checkout.session.completed"}';
    const now = 1_800_000_000;
    const sig = await signWebhook(body, 'whsec_test', now);
    expect(await verifyWebhook(body, sig, 'whsec_test', now)).toBe(true);
    expect(await verifyWebhook(body, sig, 'whsec_other', now)).toBe(false);
    expect(await verifyWebhook(body + ' ', sig, 'whsec_test', now)).toBe(false);
    expect(await verifyWebhook(body, sig, 'whsec_test', now + 301)).toBe(false);
    expect(await verifyWebhook(body, null, 'whsec_test', now)).toBe(false);
    expect(await verifyWebhook(body, 't=1,v1=zz', 'whsec_test', now)).toBe(false);
  });
});
