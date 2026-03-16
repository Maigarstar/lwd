-- Migration: lost reason capture + internal notes direction column
-- Applied: 2026-03-17

-- Lost reason fields on prospects
ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS lost_reason    TEXT,
  ADD COLUMN IF NOT EXISTS lost_notes     TEXT,
  ADD COLUMN IF NOT EXISTS lost_at        TIMESTAMPTZ;

-- direction column on outreach_emails
-- 'outbound' = email sent to prospect (default)
-- 'inbound'  = email received from prospect (marked replied)
-- 'internal' = internal note, not sent anywhere
ALTER TABLE outreach_emails
  ADD COLUMN IF NOT EXISTS direction TEXT NOT NULL DEFAULT 'outbound'
    CHECK (direction IN ('outbound', 'inbound', 'internal'));

-- Index for filtering internal notes vs emails
CREATE INDEX IF NOT EXISTS outreach_emails_direction_idx ON outreach_emails (direction);

-- Index for lost reason analytics
CREATE INDEX IF NOT EXISTS prospects_lost_reason_idx ON prospects (lost_reason) WHERE lost_reason IS NOT NULL;
CREATE INDEX IF NOT EXISTS prospects_lost_at_idx     ON prospects (lost_at)     WHERE lost_at IS NOT NULL;
