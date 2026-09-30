-- The show's sound per production (docs/design/sound-upload.md): files never
-- re-encoded, a gain per file measured in the browser; cues map scenes to them.
CREATE TABLE sound (
  id            TEXT PRIMARY KEY,
  production_id TEXT NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  kind          TEXT NOT NULL CHECK (kind IN ('music', 'bed')),
  r2_key        TEXT NOT NULL,
  content_type  TEXT NOT NULL,
  bytes         INTEGER NOT NULL,
  seconds       REAL,
  gain_db       REAL NOT NULL DEFAULT 0,
  created_by    TEXT NOT NULL REFERENCES users(id),
  created_at    TEXT NOT NULL
);
CREATE INDEX sound_by_production ON sound(production_id);

-- Scenes take cues in order; a hold is a stop of its own (cues.js's shape).
CREATE TABLE cues (
  production_id TEXT NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  position      INTEGER NOT NULL,
  name          TEXT NOT NULL,
  music_id      TEXT REFERENCES sound(id),
  bed_id        TEXT REFERENCES sound(id),
  hold          INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (production_id, position),
  UNIQUE (production_id, name)
);
