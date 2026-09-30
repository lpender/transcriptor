// The show's sound over MCP: what files the production has, and which scene
// plays what. Files themselves are uploaded in the web (design: sound-upload).
import { can } from '../access';
import { tool, DATA_NOTE } from '../mcp';
import { roleOf, writable, READONLY_MESSAGE } from '../productions';
import { getCues, listSound, setCues } from './sound';

const need = async (db: D1Database, userId: string, productionId: unknown, cap: 'read' | 'cues') => {
  if (typeof productionId !== 'string') throw new Error('Pass the production id from whoami.');
  const role = await roleOf(db, userId, productionId);
  if (!role) throw new Error('Not a member of that production.');
  if (!can(role, cap)) throw new Error(`Your role (${role}) may not ${cap === 'read' ? 'read the sound list' : 'set cues'}.`);
  if (cap !== 'read' && !(await writable(db, productionId))) throw new Error(READONLY_MESSAGE);
};

tool<{ production: string }>({
  name: 'list_sound',
  description: 'The music and room-tone files a production has uploaded (id, name, kind, seconds, gain in dB), and the current cue list: which scene plays which file, in order, with holds.' + DATA_NOTE,
  inputSchema: { type: 'object', properties: { production: { type: 'string' } }, required: ['production'] },
  run: async ({ production }, { user, env }) => {
    await need(env.DB, user.id, production, 'read');
    const files = await listSound(env.DB, production);
    const name = (id: string | null) => files.find((f) => f.id === id)?.name ?? null;
    return { sound: files.map(({ id, name, kind, seconds, gain_db }) => ({ id, name, kind, seconds, gain_db })), cues: (await getCues(env.DB, production)).map((c) => ({ name: c.name, music: name(c.music_id), bed: name(c.bed_id), hold: !!c.hold })) };
  },
});

tool<{ production: string; cues: { name: string; music?: string; bed?: string; hold?: boolean }[] }>({
  name: 'set_cues',
  description: 'Replace the cue list: one entry per scene in order, {name, music?, bed?, hold?}. music and bed name an uploaded file by id or by name (see list_sound). hold marks a stop of its own (before the show, an interval, the end) that is pressed through like a line. Scene names must be unique.' + DATA_NOTE,
  inputSchema: { type: 'object', properties: { production: { type: 'string' }, cues: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, music: { type: 'string' }, bed: { type: 'string' }, hold: { type: 'boolean' } }, required: ['name'] } } }, required: ['production', 'cues'] },
  run: async ({ production, cues }, { user, env }) => {
    await need(env.DB, user.id, production, 'cues');
    const r = await setCues(env.DB, production, cues);
    if (!r.ok) throw new Error(r.message);
    return r;
  },
});
