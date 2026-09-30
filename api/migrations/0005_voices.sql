-- The clip cache and the company's voices (docs/design/voices.md).
-- A clip is named by sha1(model + voice + spoken text), the same name tts.py
-- gives it, so what this show already rendered is already in the cache.
CREATE TABLE clips (
  hash        TEXT PRIMARY KEY,
  chars       INTEGER NOT NULL,
  r2_key      TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

-- Which of our voices reads which character, per production.
CREATE TABLE voices (
  production_id TEXT NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  speaker       TEXT NOT NULL,
  voice_id      TEXT NOT NULL,
  PRIMARY KEY (production_id, speaker)
);
