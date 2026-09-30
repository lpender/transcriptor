// Rendering the voices, a few lines per call (docs/design/voices.md).
// No queue and no Durable Object: the client asks for the next batch until
// done, every line is idempotent by clip hash, and a dropped browser resumes
// where it left off. ponytail: 4 lines per call keeps a request well under
// the Worker's limits; move to Queues if renders should run unattended.
import { render as speak } from './eleven';
import { id, now } from './ids';
import { plan, type Line } from './voices';

export const BATCH = 4;

export interface Render { id: string; production_id: string; script_id: string; total: number; done: number; failed: { hash: string; speaker: string; error: string }[]; state: 'running' | 'done' }

const row = (r: Omit<Render, 'failed'> & { failed: string }): Render => ({ ...r, failed: JSON.parse(r.failed) });

export const openRender = async (db: D1Database, productionId: string) => {
  const r = await db.prepare("SELECT id, production_id, script_id, total, done, failed, state FROM renders WHERE production_id = ? AND state = 'running'").bind(productionId).first<Omit<Render, 'failed'> & { failed: string }>();
  return r && row(r);
};

export const getRender = async (db: D1Database, productionId: string, renderId: string) => {
  const r = await db.prepare('SELECT id, production_id, script_id, total, done, failed, state FROM renders WHERE id = ? AND production_id = ?').bind(renderId, productionId).first<Omit<Render, 'failed'> & { failed: string }>();
  return r && row(r);
};

// The distinct clips a script needs, in order, with what is already cached marked.
async function needed(db: D1Database, text: string, voiceOf: Record<string, string>, sayAs: Record<string, string>): Promise<{ lines: Line[]; have: Set<string> }> {
  const seen = new Set<string>();
  const lines = (await plan(text, voiceOf, sayAs)).filter((l) => !seen.has(l.hash) && seen.add(l.hash));
  const have = new Set<string>();
  const hashes = lines.map((l) => l.hash);
  for (let i = 0; i < hashes.length; i += 100) {
    const chunk = hashes.slice(i, i + 100);
    const rows = await db.prepare(`SELECT hash FROM clips WHERE hash IN (${chunk.map(() => '?').join(',')})`).bind(...chunk).all<{ hash: string }>();
    for (const r of rows.results) have.add(r.hash);
  }
  return { lines, have };
}

export async function startRender(db: D1Database, productionId: string, scriptId: string, text: string, voiceOf: Record<string, string>, sayAs: Record<string, string>, by: string): Promise<Render> {
  const open = await openRender(db, productionId);
  if (open) return open;
  const { lines, have } = await needed(db, text, voiceOf, sayAs);
  const at = now();
  const r: Render = { id: id(), production_id: productionId, script_id: scriptId, total: lines.length, done: [...have].length, failed: [], state: lines.every((l) => have.has(l.hash)) ? 'done' : 'running' };
  await db.prepare('INSERT INTO renders (id, production_id, script_id, total, done, failed, state, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(r.id, productionId, scriptId, r.total, r.done, '[]', r.state, by, at, at).run();
  return r;
}

// Render up to BATCH clips that are still missing; record failures and carry on.
export async function renderNext(db: D1Database, bucket: R2Bucket, key: string, r: Render, text: string, voiceOf: Record<string, string>, sayAs: Record<string, string>): Promise<Render> {
  const { lines, have } = await needed(db, text, voiceOf, sayAs);
  const failedHashes = new Set(r.failed.map((f) => f.hash));
  const todo = lines.filter((l) => !have.has(l.hash) && !failedHashes.has(l.hash)).slice(0, BATCH);
  for (const l of todo) {
    try {
      const out = await speak(l.voice, l.say, key);
      await bucket.put(`clips/${l.hash}.mp3`, out.audio, { httpMetadata: { contentType: 'audio/mpeg' } });
      await bucket.put(`clips/${l.hash}.json`, JSON.stringify(out.spans), { httpMetadata: { contentType: 'application/json' } });
      await db.prepare('INSERT OR IGNORE INTO clips (hash, chars, r2_key, created_at, spans) VALUES (?, ?, ?, ?, ?)').bind(l.hash, l.chars, `clips/${l.hash}.mp3`, now(), JSON.stringify(out.spans)).run();
      have.add(l.hash);
    } catch (e) {
      r.failed.push({ hash: l.hash, speaker: l.speaker, error: (e as Error).message.slice(0, 200) });
      failedHashes.add(l.hash);
    }
  }
  r.done = lines.filter((l) => have.has(l.hash)).length;
  r.state = lines.every((l) => have.has(l.hash) || failedHashes.has(l.hash)) ? 'done' : 'running';
  await db.prepare('UPDATE renders SET done = ?, failed = ?, state = ?, updated_at = ? WHERE id = ?').bind(r.done, JSON.stringify(r.failed), r.state, now(), r.id).run();
  return r;
}

// Try the failed ones again: forget the failures, reopen.
export async function retryRender(db: D1Database, r: Render): Promise<Render> {
  r.failed = []; r.state = 'running';
  await db.prepare("UPDATE renders SET failed = '[]', state = 'running', updated_at = ? WHERE id = ?").bind(now(), r.id).run();
  return r;
}
