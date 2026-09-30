// Sign a user in and return a header set for their requests.
import { createSession, findOrCreateUser } from '../src/auth';
import { handle } from '../src/router';
import { env } from './env';

export async function signIn(email: string) {
  const user = await findOrCreateUser(env.DB, email);
  const { token } = await createSession(env.DB, user.id);
  const headers = { cookie: `tw_session=${token}`, 'content-type': 'application/json' };
  const call = (method: string, path: string, body?: unknown) =>
    handle(new Request(`http://x${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }), env);
  return { user, headers, call };
}
