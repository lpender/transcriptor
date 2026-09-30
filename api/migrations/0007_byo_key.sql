-- A production's own ElevenLabs key, encrypted at rest with the Worker's
-- SEALING_KEY (AES-GCM); only the last four characters are ever shown back.
ALTER TABLE productions ADD COLUMN eleven_key_enc TEXT;
ALTER TABLE productions ADD COLUMN eleven_key_last4 TEXT;
