// The production's script: one current row, replaced rows kept (docs/design/mcp-ingest.md).
import { parseScript, type Parsed } from './shared';
import { id, now } from './ids';

export const MAX_SCRIPT = 2 * 1024 * 1024;

export interface Script { id: string; title: string; text: string; created_at: string }

export function validate(title: unknown, text: unknown): { ok: true; title: string; text: string; parsed: Parsed } | { ok: false; error: string; errors?: Parsed['errors'] } {
  if (typeof title !== 'string' || !title.trim() || title.length > 200) return { ok: false, error: 'invalid_title' };
  if (typeof text !== 'string' || !text.trim()) return { ok: false, error: 'empty_script' };
  if (text.length > MAX_SCRIPT) return { ok: false, error: 'too_long' };
  const parsed = parseScript(text);
  if (parsed.errors.length) return { ok: false, error: 'bad_lines', errors: parsed.errors.slice(0, 20) };
  if (!parsed.lines) return { ok: false, error: 'empty_script' };
  return { ok: true, title: title.trim(), text: text.replace(/\r\n/g, '\n').trim(), parsed };
}

export async function setScript(db: D1Database, productionId: string, by: string, title: string, text: string): Promise<Script> {
  const s = { id: id(), title, text, created_at: now() };
  await db.batch([
    db.prepare('UPDATE scripts SET replaced_at = ? WHERE production_id = ? AND replaced_at IS NULL').bind(s.created_at, productionId),
    db.prepare('INSERT INTO scripts (id, production_id, title, text, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(s.id, productionId, title, text, by, s.created_at),
  ]);
  return s;
}

export const currentScript = (db: D1Database, productionId: string) =>
  db.prepare('SELECT id, title, text, created_at FROM scripts WHERE production_id = ? AND replaced_at IS NULL').bind(productionId).first<Script>();
