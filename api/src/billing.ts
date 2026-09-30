// What a production may do given how it is paid for (docs/design/billing.md).
// trial and active write; past_due writes too (a card retry is in flight);
// readonly keeps reading, learning and Together but refuses saves.
import { plus } from './ids';

export const TRIAL_DAYS = 14;
export type BillingState = 'trial' | 'active' | 'past_due' | 'readonly';
export const trialEnd = () => plus(TRIAL_DAYS * 24 * 60 * 60 * 1000);

export interface Billing { state: BillingState; trial_ends_at: string | null; period_ends_at: string | null; stripe_customer_id: string | null; stripe_subscription_id: string | null }

export const billingOf = (db: D1Database, productionId: string) =>
  db.prepare('SELECT state, trial_ends_at, period_ends_at, stripe_customer_id, stripe_subscription_id FROM productions WHERE id = ?').bind(productionId).first<Billing>();

// A trial that has run out with no subscription behind it is read-only.
export function effectiveState(b: Billing, now = new Date()): BillingState {
  if (b.state === 'trial' && b.trial_ends_at && new Date(b.trial_ends_at) < now && !b.stripe_subscription_id) return 'readonly';
  return b.state;
}
export const canWrite = (b: Billing, now = new Date()) => effectiveState(b, now) !== 'readonly';

// In words, for the company panel.
export function describe(b: Billing, now = new Date()): string {
  const s = effectiveState(b, now);
  const days = (iso: string | null) => (iso ? Math.max(0, Math.ceil((new Date(iso).getTime() - now.getTime()) / 86400000)) : 0);
  if (s === 'trial') return `Trial, ${days(b.trial_ends_at)} days left.`;
  if (s === 'active') return b.period_ends_at ? `Paid until ${new Date(b.period_ends_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}.` : 'Paid.';
  if (s === 'past_due') return 'Card failed. Rehearsals keep going; saving stops if it is not fixed.';
  return 'Not paid. Everyone can still read, learn and follow; saving is off until it is.';
}
