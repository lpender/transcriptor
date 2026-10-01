// Productions and their members (docs/design/sharing.md). Pure over D1.
import { can, isRole, type Capability, type Role } from './access';
import { currentUser, type User } from './auth';
import { billingOf, canWrite, trialEnd } from './billing';
import { id, now } from './ids';
import { error } from './router';

export interface Production { id: string; name: string; state: string; created_at: string }
export interface Member { user_id: string; email: string; name: string | null; role: Role; parts: string[]; joined_at: string }

export async function createProduction(db: D1Database, owner: User, name: string): Promise<Production> {
  const p = { id: id(), name: name.trim(), state: 'trial', created_at: now() };
  await db.batch([
    db.prepare('INSERT INTO productions (id, name, state, created_at, trial_ends_at) VALUES (?, ?, ?, ?, ?)').bind(p.id, p.name, p.state, p.created_at, trialEnd()),
    db.prepare("INSERT INTO members (user_id, production_id, role, parts, joined_at) VALUES (?, ?, 'owner', '[]', ?)").bind(owner.id, p.id, p.created_at),
  ]);
  return p;
}

export async function myProductions(db: D1Database, user: User) {
  const rows = await db
    .prepare(`SELECT p.id, p.name, p.state, p.created_at, m.role, m.parts, (SELECT COUNT(*) FROM members x WHERE x.production_id = p.id) AS members
              FROM members m JOIN productions p ON p.id = m.production_id WHERE m.user_id = ? ORDER BY p.created_at DESC`)
    .bind(user.id)
    .all<Production & { role: Role; parts: string; members: number }>();
  return rows.results.map((r) => ({ ...r, parts: JSON.parse(r.parts) as string[] }));
}

export async function roleOf(db: D1Database, userId: string, productionId: string): Promise<Role | null> {
  const row = await db.prepare('SELECT role FROM members WHERE user_id = ? AND production_id = ?').bind(userId, productionId).first<{ role: Role }>();
  return row?.role ?? null;
}

export async function members(db: D1Database, productionId: string): Promise<Member[]> {
  const rows = await db
    .prepare('SELECT m.user_id, u.email, u.name, m.role, m.parts, m.joined_at FROM members m JOIN users u ON u.id = m.user_id WHERE m.production_id = ? ORDER BY m.joined_at')
    .bind(productionId)
    .all<Omit<Member, 'parts'> & { parts: string }>();
  return rows.results.map((m) => ({ ...m, parts: JSON.parse(m.parts) as string[] }));
}

const owners = async (db: D1Database, productionId: string) =>
  (await db.prepare("SELECT COUNT(*) AS n FROM members WHERE production_id = ? AND role = 'owner'").bind(productionId).first<{ n: number }>())!.n;

// Change a member's role. The last owner cannot be demoted: name another first.
export async function setRole(db: D1Database, productionId: string, userId: string, role: Role): Promise<'ok' | 'last_owner' | 'not_member'> {
  const current = await roleOf(db, userId, productionId);
  if (!current) return 'not_member';
  if (current === 'owner' && role !== 'owner' && (await owners(db, productionId)) <= 1) return 'last_owner';
  // Crew do not learn lines, so a move to crew drops the parts.
  await db.prepare("UPDATE members SET role = ?, parts = CASE WHEN ? = 'crew' THEN '[]' ELSE parts END WHERE user_id = ? AND production_id = ?").bind(role, role, userId, productionId).run();
  return 'ok';
}

// Remove a member, or leave. The last owner cannot go; a production with no owner is orphaned.
export async function removeMember(db: D1Database, productionId: string, userId: string): Promise<'ok' | 'last_owner' | 'not_member'> {
  const current = await roleOf(db, userId, productionId);
  if (!current) return 'not_member';
  if (current === 'owner' && (await owners(db, productionId)) <= 1) return 'last_owner';
  await db.prepare('DELETE FROM members WHERE user_id = ? AND production_id = ?').bind(userId, productionId).run();
  return 'ok';
}

export async function setParts(db: D1Database, productionId: string, userId: string, parts: string[]): Promise<void> {
  await db.prepare('UPDATE members SET parts = ? WHERE user_id = ? AND production_id = ?').bind(JSON.stringify(parts), userId, productionId).run();
}

// The gate every production route passes: signed in, a member, and allowed.
// 401 unsigned; 403 `forbidden` when not a member at all (the production is
// invisible); 403 `not_allowed` when the role may not do this.
export type Gate = { user: User; role: Role } | Response;
// WRITE capabilities also need a production that may still save (billing).
const WRITES: ReadonlySet<Capability> = new Set(['script', 'cues', 'render', 'share']);
export const READONLY_MESSAGE = 'This production is not paid for. Everyone can still read, learn and follow; saving is off until it is.';
export async function gate(db: D1Database, req: Request, productionId: string, capability: Capability): Promise<Gate> {
  const user = await currentUser(db, req);
  if (!user) return error('unauthorized', 401);
  const role = await roleOf(db, user.id, productionId);
  if (!role) return error('forbidden', 403);
  if (!can(role, capability)) return error('not_allowed', 403);
  if (WRITES.has(capability) && !(await writable(db, productionId))) return error('readonly', 402, READONLY_MESSAGE);
  return { user, role };
}
export async function writable(db: D1Database, productionId: string): Promise<boolean> {
  const b = await billingOf(db, productionId);
  return !!b && canWrite(b);
}

export const parseRole = (x: unknown): Role | null => (isRole(x) ? x : null);
