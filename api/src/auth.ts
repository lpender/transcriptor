// Magic links and sessions (PLATFORM §1). Pure over D1: no HTTP here.
// - A link is the one factor: 15 minutes, single use, hash at rest.
// - A session is an opaque token, 30 days, revocable, touched on use.
// - The user row is created when a login link is first verified, so asking for
//   a link never says whether an address is known.

import { id, now, plus, sha256, token } from './ids';

export const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type Purpose = 'login' | 'invite';
export interface User { id: string; email: string; name: string | null }

const usable = (t: unknown): t is string => typeof t === 'string' && t.length > 0 && t.length <= 512;
export const validEmail = (e: unknown): e is string => typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 254;

export async function issueMagicLink(db: D1Database, email: string, purpose: Purpose, inviteId: string | null = null): Promise<{ token: string; expiresAt: string }> {
  if (!validEmail(email)) throw new Error('invalid_email');
  const t = token();
  const expiresAt = plus(MAGIC_LINK_TTL_MS);
  await db
    .prepare('INSERT INTO magic_link_tokens (token_hash, email, purpose, invite_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(await sha256(t), email.trim().toLowerCase(), purpose, inviteId, now(), expiresAt)
    .run();
  return { token: t, expiresAt };
}

// Spend a link: marks it consumed in the same statement that checks it, so a
// link verifies at most once even under concurrent calls. Returns the user
// (created on first login) or null.
export async function verifyMagicLink(db: D1Database, t: unknown, purpose: Purpose): Promise<{ user: User; inviteId: string | null } | null> {
  if (!usable(t)) return null;
  const at = now();
  const row = await db
    .prepare('UPDATE magic_link_tokens SET consumed_at = ? WHERE token_hash = ? AND purpose = ? AND consumed_at IS NULL AND expires_at > ? RETURNING email, invite_id')
    .bind(at, await sha256(t), purpose, at)
    .first<{ email: string; invite_id: string | null }>();
  if (!row) return null;
  const user = await findOrCreateUser(db, row.email);
  return { user, inviteId: row.invite_id };
}

export async function findOrCreateUser(db: D1Database, email: string): Promise<User> {
  const found = await db.prepare('SELECT id, email, name FROM users WHERE email = ?').bind(email).first<User>();
  if (found) return found;
  const user = { id: id(), email, name: null };
  await db.prepare('INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)').bind(user.id, email, now()).run();
  return user;
}

export async function createSession(db: D1Database, userId: string): Promise<{ token: string; expiresAt: string }> {
  const t = token();
  const at = now();
  const expiresAt = plus(SESSION_TTL_MS);
  await db.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at, last_seen) VALUES (?, ?, ?, ?, ?)').bind(await sha256(t), userId, at, expiresAt, at).run();
  return { token: t, expiresAt };
}

// The user a session token stands for, or null. Touches last_seen.
export async function resolveSession(db: D1Database, t: unknown): Promise<User | null> {
  if (!usable(t)) return null;
  const at = now();
  const hash = await sha256(t);
  const user = await db
    .prepare('SELECT u.id, u.email, u.name FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > ?')
    .bind(hash, at)
    .first<User>();
  if (!user) return null;
  await db.prepare('UPDATE sessions SET last_seen = ? WHERE token_hash = ?').bind(at, hash).run();
  return user;
}

export async function revokeSession(db: D1Database, t: unknown): Promise<void> {
  if (!usable(t)) return;
  await db.prepare('UPDATE sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL').bind(now(), await sha256(t)).run();
}

export const SESSION_COOKIE = 'tw_session';

// The caller: the session cookie for the web, a bearer token for CLIs and MCP.
export async function currentUser(db: D1Database, req: Request): Promise<User | null> {
  const bearer = req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  const cookie = req.headers.get('cookie')?.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`))?.[1];
  return resolveSession(db, bearer ?? cookie);
}
