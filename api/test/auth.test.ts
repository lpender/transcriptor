import { env } from './env';
import { describe, expect, it } from 'vitest';
import { createSession, currentUser, issueMagicLink, resolveSession, revokeSession, verifyMagicLink, SESSION_COOKIE } from '../src/auth';

const db = env.DB;

describe('magic links', () => {
  it('creates the user on first verify and never twice', async () => {
    const { token } = await issueMagicLink(db, 'Ann@Example.com', 'login');
    const first = await verifyMagicLink(db, token, 'login');
    expect(first?.user.email).toBe('ann@example.com');
    expect(await verifyMagicLink(db, token, 'login')).toBeNull();      // single use
    const again = await issueMagicLink(db, 'ann@example.com', 'login');
    expect((await verifyMagicLink(db, again.token, 'login'))?.user.id).toBe(first?.user.id);
  });
  it('refuses the wrong purpose, garbage, and stores only hashes', async () => {
    const { token } = await issueMagicLink(db, 'bob@example.com', 'login');
    expect(await verifyMagicLink(db, token, 'invite')).toBeNull();
    expect(await verifyMagicLink(db, 'nope', 'login')).toBeNull();
    expect(await verifyMagicLink(db, 42, 'login')).toBeNull();
    const rows = await db.prepare('SELECT token_hash FROM magic_link_tokens').all<{ token_hash: string }>();
    for (const r of rows.results) expect(r.token_hash).not.toBe(token);
  });
  it('refuses a bad address', async () => {
    await expect(issueMagicLink(db, 'not an email', 'login')).rejects.toThrow('invalid_email');
  });
  it('drops an expired link', async () => {
    const { token } = await issueMagicLink(db, 'old@example.com', 'login');
    await db.prepare("UPDATE magic_link_tokens SET expires_at = '2000-01-01T00:00:00Z'").run();
    expect(await verifyMagicLink(db, token, 'login')).toBeNull();
  });
});

describe('sessions', () => {
  it('resolves from cookie or bearer, and revokes', async () => {
    const { token: link } = await issueMagicLink(db, 'cy@example.com', 'login');
    const user = (await verifyMagicLink(db, link, 'login'))!.user;
    const { token } = await createSession(db, user.id);
    expect((await resolveSession(db, token))?.id).toBe(user.id);
    const byCookie = new Request('http://x/me', { headers: { cookie: `a=b; ${SESSION_COOKIE}=${token}` } });
    expect((await currentUser(db, byCookie))?.id).toBe(user.id);
    const byBearer = new Request('http://x/me', { headers: { authorization: `Bearer ${token}` } });
    expect((await currentUser(db, byBearer))?.id).toBe(user.id);
    expect(await currentUser(db, new Request('http://x/me'))).toBeNull();
    await revokeSession(db, token);
    expect(await resolveSession(db, token)).toBeNull();
  });
});
