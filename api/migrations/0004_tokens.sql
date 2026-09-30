-- A personal access token is a long-lived, labelled session: same table, same
-- hash, same resolver; the label is what the web lists and revokes by.
ALTER TABLE sessions ADD COLUMN label TEXT;
