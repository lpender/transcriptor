-- PLATFORM §1: only hashes at rest; a leaked database logs nobody in.

CREATE TABLE magic_link_tokens (
  token_hash   TEXT PRIMARY KEY,
  email        TEXT NOT NULL COLLATE NOCASE,   -- the user may not exist yet
  purpose      TEXT NOT NULL CHECK (purpose IN ('login', 'invite')),
  invite_id    TEXT REFERENCES invites(id) ON DELETE CASCADE,
  created_at   TEXT NOT NULL,
  expires_at   TEXT NOT NULL,
  consumed_at  TEXT
);

CREATE TABLE sessions (
  token_hash   TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TEXT NOT NULL,
  expires_at   TEXT NOT NULL,
  last_seen    TEXT NOT NULL,
  revoked_at   TEXT
);
CREATE INDEX sessions_by_user ON sessions(user_id);
