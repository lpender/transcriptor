// Members over MCP: who is in the production, which parts they learn, and
// invite links. Same gates as routes/productions.ts and routes/invites.ts.
import { can, isRole } from '../access';
import { mintInvite } from '../invites';
import { tool, DATA_NOTE } from '../mcp';
import { members, roleOf, setParts } from '../productions';

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
  description: 'Set which characters a member is learning, by the exact speaker names in the script. Omit email to set your own; an owner or director may set anyone\'s.' + DATA_NOTE,
  inputSchema: { type: 'object', properties: { production: { type: 'string' }, email: { type: 'string' }, parts: { type: 'array', items: { type: 'string' } } }, required: ['production', 'parts'] },
  run: async ({ production, email, parts }, { user, env }) => {
    const role = await need(env.DB, user.id, production);
    if (!Array.isArray(parts) || !parts.every((p) => typeof p === 'string' && p.length <= 60) || parts.length > 40) throw new Error('parts must be a list of speaker names.');
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
    if (!isRole(role) || role === 'owner') throw new Error('Invite as director, cast or crew.');
    const { token, invite } = await mintInvite(env.DB, production, role, user.id);
    return { url: `${env.APP_ORIGIN}/?invite=${token}`, role, expiresAt: invite.expires_at };
  },
});
