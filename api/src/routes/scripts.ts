//   PUT /productions/:id/script   {title, text}  → validate hard, replace          [script]
//   GET /productions/:id/script                  → the current script              [read]
// The same two doors over MCP: add_script, get_script.
import { parseScript } from '../shared';
import { tool, DATA_NOTE } from '../mcp';
import { gate, roleOf, writable, READONLY_MESSAGE } from '../productions';
import { can } from '../access';
import { error, json, route } from '../router';
import { currentScript, setScript, validate } from '../scripts';

route('PUT', '/productions/:id/script', async (req, env, { id }) => {
  const g = await gate(env.DB, req, id, 'script');
  if (g instanceof Response) return g;
  const { title, text } = (await req.json().catch(() => ({}))) as { title?: unknown; text?: unknown };
  const v = validate(title, text);
  if (!v.ok) return json({ error: v.error, errors: v.errors }, 400);
  const script = await setScript(env.DB, id, g.user.id, v.title, v.text);
  return json({ script: { id: script.id, title: script.title }, speakers: v.parsed.speakers, scenes: v.parsed.scenes.length, lines: v.parsed.lines });
});

route('GET', '/productions/:id/script', async (req, env, { id }) => {
  const g = await gate(env.DB, req, id, 'read');
  if (g instanceof Response) return g;
  const script = await currentScript(env.DB, id);
  return script ? json({ script }) : error('no_script', 404, 'This production has no script yet.');
});

// MCP: the caller's role gates the same way; a production is named by id.
const need = async (env: { DB: D1Database }, userId: string, productionId: unknown, cap: 'script' | 'read') => {
  if (typeof productionId !== 'string') throw new Error('Pass the production id from whoami.');
  const role = await roleOf(env.DB, userId, productionId);
  if (!role) throw new Error('Not a member of that production.');
  if (!can(role, cap)) throw new Error(`Your role (${role}) may not ${cap === 'read' ? 'read the script' : 'change the script'}.`);
  if (cap !== 'read' && !(await writable(env.DB, productionId))) throw new Error(READONLY_MESSAGE);
};

tool<{ production: string; title: string; text: string }>({
  name: 'add_script',
  description: 'Load or replace a production\'s script. Convert the play yourself first: one speech per line as "NAME: what they say", a line with only *** between scenes, nothing else (no stage directions, no page numbers). Returns the speakers with line counts so a misread can be seen; on bad lines nothing is saved and the line numbers come back.' + DATA_NOTE,
  inputSchema: { type: 'object', properties: { production: { type: 'string' }, title: { type: 'string' }, text: { type: 'string' } }, required: ['production', 'title', 'text'] },
  run: async ({ production, title, text }, { user, env }) => {
    await need(env, user.id, production, 'script');
    const v = validate(title, text);
    if (!v.ok) throw new Error(v.error === 'bad_lines' ? `Lines that are not "NAME: speech" or ***:\n${v.errors!.map((e) => `  ${e.line}: ${e.text}`).join('\n')}` : v.error);
    const script = await setScript(env.DB, production, user.id, v.title, v.text);
    return { saved: { id: script.id, title: script.title }, speakers: v.parsed.speakers, scenes: v.parsed.scenes.length, lines: v.parsed.lines };
  },
});

tool<{ production: string }>({
  name: 'get_script',
  description: 'The production\'s current script in the same one-speech-per-line format, with its speakers.' + DATA_NOTE,
  inputSchema: { type: 'object', properties: { production: { type: 'string' } }, required: ['production'] },
  run: async ({ production }, { user, env }) => {
    await need(env, user.id, production, 'read');
    const script = await currentScript(env.DB, production);
    if (!script) throw new Error('This production has no script yet.');
    return { title: script.title, speakers: parseScript(script.text).speakers, text: script.text };
  },
});
