-- Sentence timings live beside the clip row, so the app gets every clip's
-- spans in one call instead of one file each.
ALTER TABLE clips ADD COLUMN spans TEXT NOT NULL DEFAULT '[]';
