-- A note keeps the line it is on in words as well as by hash, so the app can
-- put it back beside the right line without a second lookup.
ALTER TABLE notes ADD COLUMN line TEXT NOT NULL DEFAULT '';
