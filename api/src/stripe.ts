// Stripe behind plain fetch (PLATFORM §2): form-encoded bodies, a bearer key,
// and Web Crypto for the webhook signature. No SDK: the one we would use needs
// Node, and we call five endpoints. `setStripe()` is the test seam.

export interface StripeCalls {
  createCustomer(email: string, name?: string): Promise<{ id: string }>;
  createCheckout(o: { customer: string; price: string; quantity: number; success: string; cancel: string; trialDays?: number; reference: string }): Promise<{ url: string }>;
  createPortal(customer: string, returnUrl: string): Promise<{ url: string }>;
  setQuantity(subscription: string, quantity: number): Promise<void>;
  getPrices(ids: string[]): Promise<{ id: string; unit_amount: number; currency: string; interval: string }[]>;
}

const form = (o: Record<string, string | number | undefined>) => new URLSearchParams(Object.entries(o).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString();

export const stripeApi = (key: string): StripeCalls => {
  const call = async <T>(method: string, path: string, body?: Record<string, string | number | undefined>): Promise<T> => {
    const res = await fetch(`https://api.stripe.com/v1${path}`, { method, headers: { authorization: `Bearer ${key}`, 'content-type': 'application/x-www-form-urlencoded' }, body: body && form(body) });
    if (!res.ok) throw new Error(`stripe ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return res.json() as Promise<T>;
  };
  return {
    createCustomer: (email, name) => call('POST', '/customers', { email, name }),
    createCheckout: (o) => call('POST', '/checkout/sessions', {
      mode: 'subscription', customer: o.customer, 'line_items[0][price]': o.price, 'line_items[0][quantity]': o.quantity,
      success_url: o.success, cancel_url: o.cancel, client_reference_id: o.reference, allow_promotion_codes: 'true',
      'subscription_data[trial_period_days]': o.trialDays, 'subscription_data[metadata][production]': o.reference,
    }),
    createPortal: (customer, return_url) => call('POST', '/billing_portal/sessions', { customer, return_url }),
    setQuantity: async (subscription, quantity) => {
      const sub = await call<{ items: { data: { id: string }[] } }>('GET', `/subscriptions/${subscription}`);
      await call('POST', `/subscriptions/${subscription}`, { 'items[0][id]': sub.items.data[0].id, 'items[0][quantity]': quantity, proration_behavior: 'create_prorations' });
    },
    getPrices: async (ids) => Promise.all(ids.map((id) => call<{ id: string; unit_amount: number; currency: string; recurring: { interval: string } }>('GET', `/prices/${id}`).then((p) => ({ id: p.id, unit_amount: p.unit_amount, currency: p.currency, interval: p.recurring.interval })))),
  };
};

let live: StripeCalls | null = null;
export const setStripe = (s: StripeCalls | null) => { live = s; };
export const stripe = (key: string | undefined): StripeCalls | null => live ?? (key ? stripeApi(key) : null);

// Stripe-Signature: t=<unix>,v1=<hex hmac of "<t>.<body>">. 5-minute tolerance.
export async function verifyWebhook(body: string, header: string | null, secret: string, nowSec = Math.floor(Date.now() / 1000)): Promise<boolean> {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=') as [string, string]));
  const t = Number(parts.t), v1 = parts.v1;
  if (!t || !v1 || Math.abs(nowSec - t) > 300) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${body}`)));
  const hex = [...mac].map((b) => b.toString(16).padStart(2, '0')).join('');
  if (hex.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}

// For tests and tooling: sign a body the way Stripe does.
export async function signWebhook(body: string, secret: string, t = Math.floor(Date.now() / 1000)): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${body}`)));
  return `t=${t},v1=${[...mac].map((b) => b.toString(16).padStart(2, '0')).join('')}`;
}
