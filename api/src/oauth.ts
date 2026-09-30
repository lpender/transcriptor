// OAuth 2.1 for claude.ai's connector (PLATFORM §4, docs/design/mcp-ingest.md),
// on @cloudflare/workers-oauth-provider. The provider owns discovery, dynamic
// client registration, PKCE, tokens and revocation in OAUTH_KV; we own the
// consent page (routes/authorize.ts) and the protected MCP handler here.
// Personal tokens keep `/mcp`; OAuth clients use `/oauth/mcp`. One rpc() serves both.
import { OAuthProvider, type OAuthHelpers } from '@cloudflare/workers-oauth-provider';
import { rpc } from './mcp';
import { cors, error, handle, json, preflight, type Env } from './router';

export type OAuthEnv = Env & { OAUTH_KV: KVNamespace; OAUTH_PROVIDER: OAuthHelpers };
export interface Props { userId: string; email: string }

// The token's user runs the same JSON-RPC as a personal token would.
type Handler = Required<Pick<ExportedHandler<OAuthEnv>, 'fetch'>>;
const mcpOverOAuth: Handler = {
  async fetch(req, env, ctx) {
    const props = (ctx as unknown as { props?: Props }).props;
    if (req.method !== 'POST' || !props?.userId) return error('unauthorized', 401);
    const user = await env.DB.prepare('SELECT id, email, name FROM users WHERE id = ?').bind(props.userId).first<{ id: string; email: string; name: string | null }>();
    if (!user) return error('unauthorized', 401, 'That account is gone.');
    const body = await req.json().catch(() => null) as Parameters<typeof rpc>[0] | Parameters<typeof rpc>[0][] | null;
    if (!body) return json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, 400);
    const answers = (await Promise.all((Array.isArray(body) ? body : [body]).map((m) => rpc(m, { user, env })))).filter((a) => a !== null);
    if (!answers.length) return new Response(null, { status: 202 });
    return json(Array.isArray(body) ? answers : answers[0]);
  },
};

// Everything else is the ordinary API; the consent page lives in it.
const everythingElse: Handler = {
  fetch: async (req, env) => cors(req, env)(preflight(req) ?? (await handle(req, env))),
};

// The resource URL must be absolute and match what clients see, so the
// provider is built per origin (dev on localhost, live on the API domain).
const providers = new Map<string, OAuthProvider<OAuthEnv>>();
export function providerFor(origin: string): OAuthProvider<OAuthEnv> {
  let p = providers.get(origin);
  if (!p) {
    p = new OAuthProvider<OAuthEnv>({
      apiRoute: '/oauth/mcp',
      apiHandler: mcpOverOAuth,
      defaultHandler: everythingElse,
      authorizeEndpoint: '/authorize',
      tokenEndpoint: '/oauth/token',
      clientRegistrationEndpoint: '/oauth/register',
      scopesSupported: ['mcp'],
      requiredScopes: ['mcp'],
      resourceMetadata: { resource: `${origin}/oauth/mcp`, authorization_servers: [origin] },
      clientIdMetadataDocumentEnabled: true,
    });
    providers.set(origin, p);
  }
  return p;
}
