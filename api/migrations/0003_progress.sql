-- A member's learning state, one row per production: the best clean run and
-- the sentences still owed. The app keeps the same in localStorage and posts
-- after each graded sentence when signed in.
CREATE TABLE progress (
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  production_id TEXT NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  best          INTEGER NOT NULL DEFAULT 0,      -- most sentences cleared in one run
  total         INTEGER NOT NULL DEFAULT 0,      -- sentences in their parts
  misses        TEXT NOT NULL DEFAULT '{}',      -- {"sentence text": count still owed}
  updated_at    TEXT NOT NULL,
  PRIMARY KEY (user_id, production_id)
);
