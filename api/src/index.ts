// The API Worker entry: nothing but the handler, see router.ts.
import { cors, handle, type Env } from './router';
import './routes/auth';

export default {
  fetch: (req: Request, env: Env) => handle(req, env).then(cors(req, env)),
} satisfies ExportedHandler<Env>;
