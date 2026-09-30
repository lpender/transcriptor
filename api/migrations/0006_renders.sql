-- A render of a production's script: resumable, per line, idempotent by clip hash.
CREATE TABLE renders (
  id            TEXT PRIMARY KEY,
  production_id TEXT NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  script_id     TEXT NOT NULL REFERENCES scripts(id),
  total         INTEGER NOT NULL,     -- distinct clips the script needs
  done          INTEGER NOT NULL DEFAULT 0,
  failed        TEXT NOT NULL DEFAULT '[]',   -- [{hash, speaker, error}]
  state         TEXT NOT NULL DEFAULT 'running',  -- running | done
  created_by    TEXT NOT NULL REFERENCES users(id),
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
CREATE INDEX renders_open ON renders(production_id) WHERE state = 'running';
