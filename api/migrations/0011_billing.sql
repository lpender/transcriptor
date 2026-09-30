-- Billing per production (docs/design/billing.md). state: trial | active |
-- past_due | readonly. A production starts on a 14-day trial.
ALTER TABLE productions ADD COLUMN trial_ends_at TEXT;
ALTER TABLE productions ADD COLUMN period_ends_at TEXT;
