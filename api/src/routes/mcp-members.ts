// Members over MCP: who is in the production, which parts they learn, and
// invite links. Same gates as routes/productions.ts and routes/invites.ts.
import { can, isRole } from '../access';
import { mintInvite } from '../invites';
import { tool, DATA_NOTE } from '../mcp';
import { members, roleOf, setParts, setRole, removeMember, writable, READONLY_MESSAGE } from '../productions';
import { syncSeats } from '../seats';
import { currentScript } from '../scripts';
import { parseScript } from '../shared';

const need = async (db: D1Database, userId: string, productionId: unknown) => {
  if (typeof productionId !== 'string') throw new Error('Pass the production id from whoami.');
  const role = await roleOf(db, userId, productionId);
  if (!role) throw new Error('Not a member of that production.');
  return role;
};

tool<{ production: string }>({
  name: 'list_members',
  description: 'The members of a production: email, name, role, and the parts (character names) each is learning.' + DATA_NOTE,
  inputSchema: { type: 'object', properties: { production: { type: 'string' } }, required: ['production'] },
  run: async ({ production }, { user, env }) => {
    await need(env.DB, user.id, production);
    return { members: (await members(env.DB, production)).map(({ email, name, role, parts }) => ({ email, name, role, parts })) };
  },
});

tool<{ production: string; email?: string; parts: string[] }>({
  name: 'set_parts',
  description: 'Set which characters a member is learning, by the speaker names as they appear in the script (case does not matter). Omit email to set your own; an owner or director may set anyone\'s but crew\'s (crew do not learn lines). Unknown names are refused with the list of speakers.' + DATA_NOTE,
  inputSchema: { type: 'object', properties: { production: { type: 'string' }, email: { type: 'string' }, parts: { type: 'array', items: { type: 'string' } } }, required: ['production', 'parts'] },
  run: async ({ production, email, parts: asked }, { user, env }) => {
    const role = await need(env.DB, user.id, production);
    if (!Array.isArray(asked) || !asked.every((p) => typeof p === 'string' && p.length <= 60) || asked.length > 40) throw new Error('parts must be a list of speaker names.');
    // Names must be speakers in the current script, spelled its way.
    const script = await currentScript(env.DB, production);
    const speakers = script ? Object.keys(parseScript(script.text).speakers) : [];
    const parts = asked.map((p) => speakers.find((s) => s.toLowerCase() === p.trim().toLowerCase()) ?? p.trim());
    const unknown = parts.filter((p) => !speakers.includes(p));
    if (script && unknown.length) throw new Error(`Not in the script: ${unknown.join(', ')}. The speakers are: ${speakers.join(', ')}.`);
    let target = user.id;
    if (email && email.toLowerCase() !== user.email) {
      if (!can(role, 'share')) throw new Error(`Your role (${role}) may only set your own parts.`);
      const m = (await members(env.DB, production)).find((x) => x.email === email.toLowerCase());
      if (!m) throw new Error('No member with that email.');
      if (m.role === 'crew' && parts.length) throw new Error(`${m.name || m.email} is crew: crew run the sound and the cues and do not learn lines. Change the role first (set_role).`);
      target = m.user_id;
    }
    await setParts(env.DB, production, target, parts);
    return { ok: true, email: email ?? user.email, parts };
  },
});

tool<{ production: string; role: string }>({
  name: 'invite',
  description: 'Make an invite link for a role (director, cast or crew), good for 14 days and for any number of people. Give it to the person or paste it in the group chat.',
  inputSchema: { type: 'object', properties: { production: { type: 'string' }, role: { type: 'string', enum: ['director', 'cast', 'crew'] } }, required: ['production', 'role'] },
  run: async ({ production, role }, { user, env }) => {
    const mine = await need(env.DB, user.id, production);
    if (!can(mine, 'share')) throw new Error(`Your role (${mine}) may not invite.`);
    if (!(await writable(env.DB, production))) throw new Error(READONLY_MESSAGE);
    if (!isRole(role) || role === 'owner') throw new Error('Invite as director, cast or crew.');
    const { token, invite } = await mintInvite(env.DB, production, role, user.id);
    return { url: `${env.APP_ORIGIN}/?invite=${token}`, role, expiresAt: invite.expires_at };
  },
});

// A member by email, for the tools that act on someone else.
const memberByEmail = async (db: D1Database, production: string, email: unknown) => {
  if (typeof email !== 'string') throw new Error('Pass the member\'s email.');
  const m = (await members(db, production)).find((x) => x.email === email.toLowerCase());
  if (!m) throw new Error('No member with that email.');
  return m;
};

tool<{ production: string; email: string; role: string }>({
  name: 'set_role',
  description: 'Change a member\'s role: owner, director, cast or crew. Owners and directors may do this; only an owner can make an owner; the last owner cannot be demoted.',
  inputSchema: { type: 'object', properties: { production: { type: 'string' }, email: { type: 'string' }, role: { type: 'string', enum: ['owner', 'director', 'cast', 'crew'] } }, required: ['production', 'email', 'role'] },
  run: async ({ production, email, role }, { user, env }) => {
    const mine = await need(env.DB, user.id, production);
    if (!can(mine, 'share')) throw new Error(`Your role (${mine}) may not change roles.`);
    if (!isRole(role)) throw new Error('Role must be owner, director, cast or crew.');
    if (role === 'owner' && mine !== 'owner') throw new Error('Only an owner can make an owner.');
    const m = await memberByEmail(env.DB, production, email);
    const r = await setRole(env.DB, production, m.user_id, role);
    if (r === 'last_owner') throw new Error('That is the last owner; name another owner first.');
    return { ok: true, email: m.email, role };
  },
});

tool<{ production: string; email?: string }>({
  name: 'remove_member',
  description: 'Remove a member from the production, or leave it yourself (omit email). Owners and directors may remove others; the last owner cannot leave.',
  inputSchema: { type: 'object', properties: { production: { type: 'string' }, email: { type: 'string' } }, required: ['production'] },
  run: async ({ production, email }, { user, env }) => {
    const mine = await need(env.DB, user.id, production);
    const target = email ? await memberByEmail(env.DB, production, email) : null;
    if (target && target.user_id !== user.id && !can(mine, 'share')) throw new Error(`Your role (${mine}) may not remove others.`);
    const r = await removeMember(env.DB, production, target ? target.user_id : user.id);
    if (r === 'last_owner') throw new Error('That is the last owner; name another owner first.');
    await syncSeats(env, production);
    return { ok: true, removed: target ? target.email : user.email };
  },
});

tool<{ name: string }>({
  name: 'set_name',
  description: 'Set the signed-in person\'s name, as the company sees it (empty clears it).',
  inputSchema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
  run: async ({ name }, { user, env }) => {
    if (typeof name !== 'string' || name.trim().length > 80) throw new Error('A name up to 80 characters.');
    await env.DB.prepare('UPDATE users SET name = ? WHERE id = ?').bind(name.trim() || null, user.id).run();
    return { ok: true, name: name.trim() || null };
  },
});

// Who is off book: the director's question, answered in words per member.
tool<{ production: string }>({
  name: 'who_is_off_book',
  description: 'How far each member is through their lines: best clean run against the sentences in their parts, which sentences they still miss (the weakest three quoted), when they last worked. In words, ready to relay. An owner or director sees everyone; cast see only themselves.' + DATA_NOTE,
  inputSchema: { type: 'object', properties: { production: { type: 'string' } }, required: ['production'] },
  run: async ({ production }, { user, env }) => {
    const role = await need(env.DB, user.id, production);
    const everyone = can(role, 'progress');  // cast see their own standing only
    const rows = (await env.DB.prepare(`SELECT u.email, u.name, m.role, m.parts, p.best, p.total, p.misses, p.updated_at
        FROM members m JOIN users u ON u.id = m.user_id LEFT JOIN progress p ON p.user_id = m.user_id AND p.production_id = m.production_id
        WHERE m.production_id = ? AND (? OR m.user_id = ?) ORDER BY m.joined_at`).bind(production, everyone ? 1 : 0, user.id).all<{ email: string; name: string | null; role: string; parts: string; best: number | null; total: number | null; misses: string | null; updated_at: string | null }>()).results;
    // Crew never learn; an owner or director without parts is directing, not owing lines.
    const lines = rows.filter((r) => r.role !== 'crew' && (r.role === 'cast' || r.parts !== '[]')).map((r) => {
      const who = r.name || r.email, parts = JSON.parse(r.parts) as string[];
      const shaky = r.misses ? Object.keys(JSON.parse(r.misses) as object) : [];
      const weak = shaky.length;
      // The weakest few, quoted, so the director knows where to drill.
      const quoted = weak ? ` (${shaky.slice(0, 3).map((t) => `"${t}"`).join(', ')}${weak > 3 ? ', …' : ''})` : '';
      if (!parts.length) return `${who}: no parts chosen yet (set_parts).`;
      if (!r.total) return `${who} (${parts.join(', ')}): not started.`;
      const days = r.updated_at ? Math.floor((Date.now() - new Date(r.updated_at).getTime()) / 864e5) : 0;
      const when = r.updated_at ? (days > 6 ? ` Quiet ${days} days.` : ` Last worked ${r.updated_at.slice(0, 10)}.`) : '';
      if (r.best! >= r.total) return `${who} (${parts.join(', ')}): off book${weak ? `, ${weak} sentence${weak > 1 ? 's' : ''} still shaky${quoted}` : ''}.${when}`;
      return `${who} (${parts.join(', ')}): ${r.best} of ${r.total} sentences clear${weak ? `, ${weak} weak${quoted}` : ''}.${when}`;
    });
    // One line up top, the director's whole picture.
    const learners = rows.filter((r) => r.role !== 'crew' && (r.role === 'cast' || r.parts !== '[]'));
    const offBook = learners.filter((r) => r.total && r.best! >= r.total).length;
    const notStarted = learners.filter((r) => !r.best).length;
    const quiet = learners.filter((r) => r.best && r.updated_at && Date.now() - new Date(r.updated_at).getTime() > 7 * 864e5).length;
    const picture = everyone && learners.length ? `${offBook} of ${learners.length} off book${notStarted ? `, ${notStarted} not started` : ''}${quiet ? `, ${quiet} quiet for a week` : ''}.` : '';
    // An actor asking about themselves wants the next move, not a row count.
    const own = everyone ? null : rows.find((r) => r.email === user.email);
    const next = own && (JSON.parse(own.parts) as string[]).length === 0 ? 'Choose your part with set_parts.'
      : own && own.misses && Object.keys(JSON.parse(own.misses) as object).length ? 'Drill the shaky ones in the app: More, then Practice, then Drill weak lines.'
      : own ? 'Keep running the part in the app: More, then Learn my lines.' : undefined;
    return { summary: [picture, ...lines].filter(Boolean).join('\n'), ...(everyone ? { members: rows.length } : { next }) };
  },
});
