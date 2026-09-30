// The router: routes are plain functions of (request, env) so tests call them
// without a server. Only index.ts exports to the Workers runtime, which
// refuses any export that is not a handler.

export interface Env {
  DB: D1Database;
  APP_ORIGIN: string;   // where the static app lives; the only CORS origin
  API_ORIGIN: string;   // this Worker, for links in mail
  RESEND_API_KEY?: string;
  MAIL_FROM?: string;
  ELEVEN_LABS_API_KEY?: string;   // secret; unset = rendering with our key is off
  SEALING_KEY?: string;           // secret; seals productions' own keys at rest
  STRIPE_SECRET_KEY?: string;     // secret; unset = billing is off
  STRIPE_WEBHOOK_SECRET?: string; // secret
  STRIPE_PRICE_MONTHLY?: string;  // price ids from the Stripe dashboard
  STRIPE_PRICE_YEARLY?: string;
  CLIPS: R2Bucket;                // rendered clips, keyed by hash
}

export const VERSION = '0.1.0';

type Handler = (req: Request, env: Env, params: Record<string, string>) => Promise<Response> | Response;
const routes: { method: string; pattern: URLPattern; handler: Handler }[] = [];
export const route = (method: string, path: string, handler: Handler) =>
  routes.push({ method, pattern: new URLPattern({ pathname: path }), handler });

export const json = (body: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
export const error = (code: string, status: number, message?: string, headers: HeadersInit = {}) => json({ error: code, message }, status, headers);

route('GET', '/health', () => json({ ok: true, version: VERSION }));

export async function handle(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  for (const r of routes) {
    const m = r.method === req.method && r.pattern.exec(url);
    if (m) {
      // A route that throws answers as JSON with CORS, not a bare Worker error the app cannot read.
      try { return await r.handler(req, env, Object.fromEntries(Object.entries(m.pathname.groups).map(([k, v]) => [k, v ?? '']))); }
      catch (e) { console.error(`${req.method} ${url.pathname}:`, e); return error('server_error', 500, (e as Error).message?.slice(0, 300)); }
    }
  }
  return error('not_found', 404);
}

// The static app on another origin calls this API with credentials; only that
// origin is allowed, never '*'.
export const cors = (req: Request, env: Env) => (res: Response) => {
  const origin = req.headers.get('origin');
  if (origin !== env.APP_ORIGIN) return res;
  const h = new Headers(res.headers);
  h.set('access-control-allow-origin', origin);
  h.set('access-control-allow-credentials', 'true');
  h.set('access-control-allow-methods', 'GET, POST, PUT, DELETE');
  h.set('access-control-allow-headers', 'content-type, authorization');
  h.set('access-control-max-age', '86400');
  h.set('vary', 'origin');
  return new Response(res.body, { status: res.status, headers: h });
};

// A preflight gets an empty 204 with the headers above; the router never sees it.
export const preflight = (req: Request) => (req.method === 'OPTIONS' ? new Response(null, { status: 204 }) : null);
