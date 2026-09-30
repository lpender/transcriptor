-- How a line is spoken when that differs from how it reads (stress.json's job):
-- quotes for a word capitals cannot reach, an ellipsis for weight. Keyed by the
-- full line text ("NAME: words") so it survives a re-split; part of the clip hash.
CREATE TABLE sayas (
  production_id TEXT NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
  line          TEXT NOT NULL,
  say           TEXT NOT NULL,
  PRIMARY KEY (production_id, line)
);
