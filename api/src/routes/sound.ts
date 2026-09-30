//   POST   /productions/:id/sound?name=&kind=music|bed&seconds=&gain=  body: the file   → row   [cues]
//   GET    /productions/:id/sound                                        → files            [read]
//   DELETE /productions/:id/sound/:sid                                   → refused if a cue uses it [cues]
//   GET    /productions/:id/cues                                         → cues.js's shape + gains [read]
//   PUT    /productions/:id/cues   [{name, music?, bed?, hold?}]         → the whole ordered list  [cues]
//   GET    /sound/:key                                                   → the file (keys are random)
// Files go through the Worker rather than a presigned URL: no S3 keys to
// mint, and the free plan's 100 MB body is more than a 25 MB file.
import { id, now } from '../ids';
import { gate } from '../productions';
import { error, json, route } from '../router';

const MAX_BYTES = 25 * 1024 * 1024;
const TYPES: Record<string, string> = { 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/ogg': 'ogg', 'audio/webm': 'webm' };
const num = (x: string | null, lo: number, hi: number) => { const n = x === null ? NaN : Number(x); return Number.isFinite(n) && n >= lo && n <= hi ? n : null; };

interface SoundRow { id: string; name: string; kind: 'music' | 'bed'; r2_key: string; seconds: number | null; gain_db: number; bytes: number }
const listSound = async (db: D1Database, productionId: string) =>
  (await db.prepare('SELECT id, name, kind, r2_key, seconds, gain_db, bytes FROM sound WHERE production_id = ? ORDER BY kind, name').bind(productionId).all<SoundRow>()).results;

route('POST', '/productions/:id/sound', async (req, env, { id: pid }) => {
  const g = await gate(env.DB, req, pid, 'cues');
  if (g instanceof Response) return g;
  const q = new URL(req.url).searchParams;
  const name = (q.get('name') || '').trim().slice(0, 120), kind = q.get('kind');
  const type = req.headers.get('content-type')?.split(';')[0].trim() ?? '';
  if (!name || (kind !== 'music' && kind !== 'bed')) return error('invalid_sound', 400, 'Give a name and a kind (music or bed).');
  if (!TYPES[type]) return error('invalid_type', 415, 'mp3, m4a, wav, ogg or webm.');
  const size = Number(req.headers.get('content-length') || 0);
  if (!req.body || size > MAX_BYTES) return error('too_big', 413, 'Up to 25 MB.');
  const seconds = num(q.get('seconds'), 0, 36000), gain = num(q.get('gain'), -60, 60) ?? 0;
  const sid = id();
  const key = `sound/${sid}.${TYPES[type]}`;
  const put = await env.CLIPS.put(key, req.body, { httpMetadata: { contentType: type } });
  if (put.size > MAX_BYTES) { await env.CLIPS.delete(key); return error('too_big', 413, 'Up to 25 MB.'); }
  await env.DB.prepare('INSERT INTO sound (id, production_id, name, kind, r2_key, content_type, bytes, seconds, gain_db, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(sid, pid, name, kind, key, type, put.size, seconds, gain, g.user.id, now()).run();
  return json({ sound: { id: sid, name, kind, seconds, gain_db: gain, bytes: put.size, url: `${env.API_ORIGIN}/${key}` } }, 201);
});

route('GET', '/productions/:id/sound', async (req, env, { id: pid }) => {
  const g = await gate(env.DB, req, pid, 'read');
  if (g instanceof Response) return g;
  return json({ sound: (await listSound(env.DB, pid)).map((s) => ({ ...s, url: `${env.API_ORIGIN}/${s.r2_key}` })) });
});

route('DELETE', '/productions/:id/sound/:sid', async (req, env, { id: pid, sid }) => {
  const g = await gate(env.DB, req, pid, 'cues');
  if (g instanceof Response) return g;
  const used = await env.DB.prepare('SELECT name FROM cues WHERE production_id = ? AND (music_id = ? OR bed_id = ?)').bind(pid, sid, sid).first<{ name: string }>();
  if (used) return error('in_use', 409, `"${used.name}" uses it; unassign it first.`);
  const row = await env.DB.prepare('SELECT r2_key FROM sound WHERE id = ? AND production_id = ?').bind(sid, pid).first<{ r2_key: string }>();
  if (!row) return error('not_found', 404);
  await env.CLIPS.delete(row.r2_key);
  await env.DB.prepare('DELETE FROM sound WHERE id = ?').bind(sid).run();
  return json({ ok: true });
});

// cues.js's shape: [{name, music, bed, hold}] with file names, plus GAINS by file name.
route('GET', '/productions/:id/cues', async (req, env, { id: pid }) => {
  const g = await gate(env.DB, req, pid, 'read');
  if (g instanceof Response) return g;
  const files = Object.fromEntries((await listSound(env.DB, pid)).map((s) => [s.id, s]));
  const rows = (await env.DB.prepare('SELECT name, music_id, bed_id, hold FROM cues WHERE production_id = ? ORDER BY position').bind(pid).all<{ name: string; music_id: string | null; bed_id: string | null; hold: number }>()).results;
  const url = (sid: string | null) => (sid && files[sid] ? `${env.API_ORIGIN}/${files[sid].r2_key}` : undefined);
  const gains: Record<string, number> = {};
  for (const s of Object.values(files)) gains[s.r2_key.split('/').pop()!] = s.gain_db;
  return json({ cues: rows.map((r) => ({ name: r.name, music: url(r.music_id), bed: url(r.bed_id), hold: !!r.hold, music_id: r.music_id, bed_id: r.bed_id })), gains });
});

route('PUT', '/productions/:id/cues', async (req, env, { id: pid }) => {
  const g = await gate(env.DB, req, pid, 'cues');
  if (g instanceof Response) return g;
  const body = (await req.json().catch(() => null)) as { name?: unknown; music?: unknown; bed?: unknown; hold?: unknown }[] | null;
  if (!Array.isArray(body) || body.length > 200) return error('invalid_cues', 400);
  const files = new Set((await listSound(env.DB, pid)).map((s) => s.id));
  const names = new Set<string>();
  const cues = body.map((c) => ({ name: typeof c.name === 'string' ? c.name.trim().slice(0, 80) : '', music: typeof c.music === 'string' ? c.music : null, bed: typeof c.bed === 'string' ? c.bed : null, hold: !!c.hold }));
  for (const c of cues) {
    if (!c.name || names.has(c.name)) return error('invalid_cues', 400, 'Every scene needs its own name.');
    names.add(c.name);
    if ((c.music && !files.has(c.music)) || (c.bed && !files.has(c.bed))) return error('invalid_cues', 400, 'A cue names a file this production does not have.');
  }
  await env.DB.batch([
    env.DB.prepare('DELETE FROM cues WHERE production_id = ?').bind(pid),
    ...cues.map((c, k) => env.DB.prepare('INSERT INTO cues (production_id, position, name, music_id, bed_id, hold) VALUES (?, ?, ?, ?, ?, ?)').bind(pid, k, c.name, c.music, c.bed, c.hold ? 1 : 0)),
  ]);
  return json({ ok: true, cues: cues.length });
});

route('GET', '/sound/:name', async (_req, env, { name }) => {
  if (!/^[0-9A-Za-z]{16}\.(mp3|m4a|wav|ogg|webm)$/.test(name)) return error('not_found', 404);
  const obj = await env.CLIPS.get(`sound/${name}`);
  if (!obj) return error('not_found', 404);
  return new Response(obj.body, { headers: { 'content-type': obj.httpMetadata?.contentType ?? 'application/octet-stream', 'content-length': String(obj.size), 'accept-ranges': 'bytes', 'cache-control': 'public, max-age=31536000, immutable', 'access-control-allow-origin': '*' } });
});
