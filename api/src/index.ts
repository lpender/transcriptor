// The API Worker entry: nothing but the handler, see router.ts.
import { cors, handle, preflight, type Env } from './router';
import './routes/auth';
import './routes/productions';
import './routes/invites';
import './routes/progress';
import './routes/mcp';
import './routes/scripts';
import './routes/mcp-members';
import './routes/voices';

export default {
  fetch: async (req: Request, env: Env) => cors(req, env)(preflight(req) ?? (await handle(req, env))),
} satisfies ExportedHandler<Env>;
