// The subscription's quantity follows the member count (docs/design/billing.md).
// Best effort: a Stripe hiccup is logged, and the next change resyncs.
import { stripe } from './stripe';

export async function syncSeats(env: { DB: D1Database; STRIPE_SECRET_KEY?: string }, productionId: string): Promise<number | null> {
  const s = stripe(env.STRIPE_SECRET_KEY);
  const row = await env.DB.prepare('SELECT stripe_subscription_id AS sub FROM productions WHERE id = ?').bind(productionId).first<{ sub: string | null }>();
  if (!s || !row?.sub) return null;
  const n = (await env.DB.prepare('SELECT COUNT(*) AS n FROM members WHERE production_id = ?').bind(productionId).first<{ n: number }>())!.n;
  try { await s.setQuantity(row.sub, Math.max(1, n)); } catch (e) { console.warn('seats: could not sync', productionId, (e as Error).message); return null; }
  return n;
}
