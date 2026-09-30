// Invite links (docs/design/sharing.md): multi-use for 14 days, one role baked
// in, revocable, only the hash at rest. Accepting joins the production; a
// member already is left as they are.
import { INVITABLE, type Role } from './access';
import { id, now, plus, sha256, token } from './ids';
import { roleOf, writable } from './productions';

export const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export interface Invite { id: string; production_id: string; role: Role; created_by: string; created_at: string; expires_at: string; revoked_at: string | null }

export async function mintInvite(db: D1Database, productionId: string, role: Role, by: string): Promise<{ token: string; invite: Invite }> {
  if (!INVITABLE.includes(role)) throw new Error('invalid_role');
  const t = token();
  const invite: Invite = { id: id(), production_id: productionId, role, created_by: by, created_at: now(), expires_at: plus(INVITE_TTL_MS), revoked_at: null };
  await db
    .prepare('INSERT INTO invites (id, production_id, role, token_hash, created_by, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(invite.id, productionId, role, await sha256(t), by, invite.created_at, invite.expires_at)
    .run();
  return { token: t, invite };
}

export const listInvites = async (db: D1Database, productionId: string) =>
  (await db.prepare('SELECT id, production_id, role, created_by, created_at, expires_at, revoked_at FROM invites WHERE production_id = ? ORDER BY created_at DESC').bind(productionId).all<Invite>()).results;

export async function revokeInvite(db: D1Database, productionId: string, inviteId: string): Promise<boolean> {
  const r = await db.prepare('UPDATE invites SET revoked_at = ? WHERE id = ? AND production_id = ? AND revoked_at IS NULL').bind(now(), inviteId, productionId).run();
  return r.meta.changes > 0;
}

// A live invite by its token (or id), with the production's name for the "join X as Y" screen.
export async function findInvite(db: D1Database, by: { token?: unknown; id?: string }): Promise<(Invite & { production_name: string }) | null> {
  const key = by.id ?? (typeof by.token === 'string' && by.token.length <= 512 ? await sha256(by.token) : null);
  if (!key) return null;
  return db
    .prepare(`SELECT i.id, i.production_id, i.role, i.created_by, i.created_at, i.expires_at, i.revoked_at, p.name AS production_name
              FROM invites i JOIN productions p ON p.id = i.production_id
              WHERE ${by.id ? 'i.id' : 'i.token_hash'} = ? AND i.revoked_at IS NULL AND i.expires_at > ?`)
    .bind(key, now())
    .first();
}

// Join by a live invite. Already a member: nothing changes, not even the role.
export async function acceptInvite(db: D1Database, invite: Invite, userId: string): Promise<'joined' | 'already' | 'readonly'> {
  if (await roleOf(db, userId, invite.production_id)) return 'already';
  if (!(await writable(db, invite.production_id))) return 'readonly';
  await db.prepare('INSERT INTO members (user_id, production_id, role, parts, joined_at) VALUES (?, ?, ?, ?, ?)').bind(userId, invite.production_id, invite.role, '[]', now()).run();
  return 'joined';
}
