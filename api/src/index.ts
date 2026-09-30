// The API Worker entry: nothing but the handler, see router.ts.
import type { Env } from './router';
import './routes/auth';
import './routes/productions';
import './routes/invites';
import './routes/progress';
import './routes/mcp';
import './routes/scripts';
import './routes/mcp-members';
import './routes/voices';
import './routes/render';
import './routes/byo-key';
import './routes/sound';
import './routes/mcp-cues';
import './routes/billing';
import './routes/room';
export { Room } from './room';

import './routes/authorize';
import { providerFor, type OAuthEnv } from './oauth';

// The OAuth provider wraps everything: /oauth/* and /authorize are its, the
// rest falls through to the router with CORS (see oauth.ts).
export default {
  fetch: (req: Request, env: Env, ctx: ExecutionContext) => providerFor(new URL(req.url).origin).fetch(req, env as OAuthEnv, ctx),
} satisfies ExportedHandler<Env>;
