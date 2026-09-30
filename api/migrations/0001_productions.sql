-- The nouns of docs/design/sharing.md. Ids are random text (nanoid-style) so
-- they can be minted in the Worker; times are ISO-8601 text, UTC.

CREATE TABLE users (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name        TEXT,
  created_at  TEXT NOT NULL,
  last_seen   TEXT
);

CREATE TABLE productions (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  state       TEXT NOT NULL DEFAULT 'active',   -- active | readonly (billing lapsed)
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  created_at  TEXT NOT NULL
);

-- One row per user per production; a user holds ONE role there.
-- parts: JSON array of character names this member is learning.
CREATE TABLE members (
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  production_id TEXT NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('owner', 'director', 'cast', 'crew')),
  parts         TEXT NOT NULL DEFAULT '[]',
  joined_at     TEXT NOT NULL,
  PRIMARY KEY (user_id, production_id)
);
CREATE INDEX members_by_production ON members(production_id);

-- Multi-use, expiring, revocable; only the hash of the token is stored.
CREATE TABLE invites (
  id            TEXT PRIMARY KEY,
  production_id TEXT NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('director', 'cast', 'crew')),
  token_hash    TEXT NOT NULL UNIQUE,
  created_by    TEXT NOT NULL REFERENCES users(id),
  created_at    TEXT NOT NULL,
  expires_at    TEXT NOT NULL,
  revoked_at    TEXT
);

-- The script text in the paste format; a replaced script keeps its row.
CREATE TABLE scripts (
  id            TEXT PRIMARY KEY,
  production_id TEXT NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  text          TEXT NOT NULL,
  created_by    TEXT NOT NULL REFERENCES users(id),
  created_at    TEXT NOT NULL,
  replaced_at   TEXT
);
CREATE INDEX scripts_current ON scripts(production_id) WHERE replaced_at IS NULL;

-- Keyed by the line's text (line_hash = sha256 of it) so a re-split keeps them.
-- Private to the author unless shared.
CREATE TABLE notes (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  production_id TEXT NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  line_hash     TEXT NOT NULL,
  text          TEXT NOT NULL,
  shared        INTEGER NOT NULL DEFAULT 0,
  updated_at    TEXT NOT NULL,
  UNIQUE (user_id, production_id, line_hash)
);
CREATE INDEX notes_shared ON notes(production_id, line_hash) WHERE shared = 1;
