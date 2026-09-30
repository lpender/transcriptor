//   POST /productions/:id/render              → start (or the one already running)       [render]
//   POST /productions/:id/render/:rid/next    → render the next few lines, return progress [render]
//   POST /productions/:id/render/:rid/retry   → forget failures and go again              [render]
//   GET  /productions/:id/render/:rid         → progress                                  [read]
//   GET  /productions/:id/clips               → {line text: {f, s}} for the app, like clips.js [read]
//   GET  /clips/:hash.mp3 | .json             → the clip itself (public: hashes are the key)
import { gate } from '../productions';
import { getRender, renderNext, retryRender, startRender } from '../render';
import { error, json, route } from '../router';
import { currentScript } from '../scripts';
import { plan, sayAsOf, voicesOf } from '../voices';
import { parseScript } from '../shared';
import { unseal } from '../seal';

const scriptAndVoices = async (env: { DB: D1Database }, id: string) => {
  const script = await currentScript(env.DB, id);
  return script ? { script, voiceOf: await voicesOf(env.DB, id), sayAs: await sayAsOf(env.DB, id) } : null;
};

// The key a render runs on: the production's own if it has one, else ours.
export async function keyFor(env: { DB: D1Database; ELEVEN_LABS_API_KEY?: string; SEALING_KEY?: string }, id: string): Promise<{ key: string; own: boolean } | null> {
  const row = await env.DB.prepare('SELECT eleven_key_enc AS enc FROM productions WHERE id = ?').bind(id).first<{ enc: string | null }>();
  if (row?.enc && env.SEALING_KEY) return { key: await unseal(env.SEALING_KEY, row.enc), own: true };
  return env.ELEVEN_LABS_API_KEY ? { key: env.ELEVEN_LABS_API_KEY, own: false } : null;
}

route('POST', '/productions/:id/render', async (req, env, { id }) => {
  const g = await gate(env.DB, req, id, 'render');
  if (g instanceof Response) return g;
  if (!(await keyFor(env, id))) return error('no_engine', 503, 'Voice rendering is not switched on here yet.');
  const sv = await scriptAndVoices(env, id);
  if (!sv) return error('no_script', 404, 'Load a script first.');
  return json({ render: await startRender(env.DB, id, sv.script.id, sv.script.text, sv.voiceOf, sv.sayAs, g.user.id) }, 201);
});

route('POST', '/productions/:id/render/:rid/next', async (req, env, { id, rid }) => {
  const g = await gate(env.DB, req, id, 'render');
  if (g instanceof Response) return g;
  const r = await getRender(env.DB, id, rid);
  if (!r) return error('not_found', 404);
  if (r.state === 'done') return json({ render: r });
  const k = await keyFor(env, id);
  if (!k) return error('no_engine', 503);
  const sv = await scriptAndVoices(env, id);
  if (!sv) return error('no_script', 404);
  return json({ render: await renderNext(env.DB, env.CLIPS, k.key, r, sv.script.text, sv.voiceOf, sv.sayAs) });
});

route('POST', '/productions/:id/render/:rid/retry', async (req, env, { id, rid }) => {
  const g = await gate(env.DB, req, id, 'render');
  if (g instanceof Response) return g;
  const r = await getRender(env.DB, id, rid);
  return r ? json({ render: await retryRender(env.DB, r) }) : error('not_found', 404);
});

route('GET', '/productions/:id/render/:rid', async (req, env, { id, rid }) => {
  const g = await gate(env.DB, req, id, 'read');
  if (g instanceof Response) return g;
  const r = await getRender(env.DB, id, rid);
  return r ? json({ render: r }) : error('not_found', 404);
});

// What the app loads instead of clips.js: every line that has a clip, with its spans.
route('GET', '/productions/:id/clips', async (req, env, { id }) => {
  const g = await gate(env.DB, req, id, 'read');
  if (g instanceof Response) return g;
  const sv = await scriptAndVoices(env, id);
  if (!sv) return json({ clips: {} });
  const lines = await plan(sv.script.text, sv.voiceOf, sv.sayAs);
  const hashes = [...new Set(lines.map((l) => l.hash))];
  const have = new Set<string>();
  for (let i = 0; i < hashes.length; i += 100) {
    const chunk = hashes.slice(i, i + 100);
    for (const r of (await env.DB.prepare(`SELECT hash FROM clips WHERE hash IN (${chunk.map(() => '?').join(',')})`).bind(...chunk).all<{ hash: string }>()).results) have.add(r.hash);
  }
  const clips: Record<string, { f: string; s?: string }> = {};
  let k = 0;
  for (const scene of parseScript(sv.script.text).scenes) for (const s of scene) {
    const l = lines[k++];
    if (have.has(l.hash)) clips[`${s.speaker}: ${s.text}`] = { f: `${env.API_ORIGIN}/clips/${l.hash}.mp3`, s: `${env.API_ORIGIN}/clips/${l.hash}.json` };
  }
  return json({ clips });
});

route('GET', '/clips/:name', async (_req, env, { name }) => {
  if (!/^[0-9a-f]{16}\.(mp3|json)$/.test(name)) return error('not_found', 404);
  const obj = await env.CLIPS.get(`clips/${name}`);
  if (!obj) return error('not_found', 404);
  return new Response(obj.body, { headers: { 'content-type': name.endsWith('.mp3') ? 'audio/mpeg' : 'application/json', 'cache-control': 'public, max-age=31536000, immutable', 'access-control-allow-origin': '*' } });
});
