// Members over MCP: who is in the production, which parts they learn, and
// invite links. Same gates as routes/productions.ts and routes/invites.ts.
import { can, isRole } from '../access';
import { mintInvite } from '../invites';
import { tool, DATA_NOTE } from '../mcp';
import { members, roleOf, setParts, writable, READONLY_MESSAGE } from '../productions';
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
  description: 'Set which characters a member is learning, by the speaker names as they appear in the script (case does not matter). Omit email to set your own; an owner or director may set anyone\'s. Unknown names are refused with the list of speakers.' + DATA_NOTE,
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
      target = m.user_id;
    }
    await setParts(env.DB, production, target, parts);
    return { ok: true, email: email ?? user.email, parts };
  },
});

tool<{ production: string; role: string }>({
  name: 'invite',
  description: 'Make an invite link for a role (director, cast or crew), good for 14 days and for any number of people. Give it to the person or paste it in the group chat.' + DATA_NOTE,
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

tool<{ name: string }>({
  name: 'set_name',
  description: 'Set the signed-in person\'s name, as the company sees it (empty clears it).' + DATA_NOTE,
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
  description: 'For an owner or director: every member with parts, how far through their lines they have got (best clean run against the sentences in their parts), how many sentences they still miss, and when they last worked. In words, ready to relay.' + DATA_NOTE,
  inputSchema: { type: 'object', properties: { production: { type: 'string' } }, required: ['production'] },
  run: async ({ production }, { user, env }) => {
    const role = await need(env.DB, user.id, production);
    if (!can(role, 'progress')) throw new Error(`Your role (${role}) may not see everyone's progress.`);
    const rows = (await env.DB.prepare(`SELECT u.email, u.name, m.role, m.parts, p.best, p.total, p.misses, p.updated_at
        FROM members m JOIN users u ON u.id = m.user_id LEFT JOIN progress p ON p.user_id = m.user_id AND p.production_id = m.production_id
        WHERE m.production_id = ? ORDER BY m.joined_at`).bind(production).all<{ email: string; name: string | null; role: string; parts: string; best: number | null; total: number | null; misses: string | null; updated_at: string | null }>()).results;
    const lines = rows.filter((r) => r.role !== 'crew').map((r) => {
      const who = r.name || r.email, parts = JSON.parse(r.parts) as string[];
      const weak = r.misses ? Object.keys(JSON.parse(r.misses) as object).length : 0;
      if (!parts.length) return `${who}: no parts chosen yet (set_parts).`;
      if (!r.total) return `${who} (${parts.join(', ')}): not started.`;
      const when = r.updated_at ? ` Last worked ${r.updated_at.slice(0, 10)}.` : '';
      if (r.best! >= r.total) return `${who} (${parts.join(', ')}): off book${weak ? `, ${weak} sentence${weak > 1 ? 's' : ''} still shaky` : ''}.${when}`;
      return `${who} (${parts.join(', ')}): ${r.best} of ${r.total} sentences clear${weak ? `, ${weak} weak` : ''}.${when}`;
    });
    return { summary: lines.join('\n'), members: rows.length };
  },
});
