-- ─────────────────────────────────────────────────────────────────────────────
-- Sales Pipeline Phase 3: Growth, Safety, and Monetisation Infrastructure
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Deal value on prospects ───────────────────────────────────────────────────
-- Enables pipeline value tracking, revenue forecasting, and avg deal size.

ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS deal_value    NUMERIC(12, 2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deal_currency TEXT           NOT NULL DEFAULT 'GBP';

-- ── Email suppression list ─────────────────────────────────────────────────────
-- Tracks unsubscribed / bounced / blocked emails.
-- Checked before every campaign send. Persists across campaigns.

CREATE TABLE IF NOT EXISTS email_suppressions (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  email       TEXT    NOT NULL,
  reason      TEXT    NOT NULL DEFAULT 'unsubscribed'
                      CHECK (reason IN ('unsubscribed', 'bounced', 'complaint', 'manual')),
  source      TEXT,   -- e.g. 'campaign', 'manual', 'resend_webhook'
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS suppressions_email_idx ON email_suppressions (email);
ALTER TABLE email_suppressions DISABLE ROW LEVEL SECURITY;

-- ── outreach_emails: missing updated_at column ────────────────────────────────
-- Needed for any future trigger-based updates.

ALTER TABLE outreach_emails
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Back-fill existing rows
UPDATE outreach_emails SET updated_at = sent_at WHERE updated_at IS NULL;

-- ── prospects: index on email + website for dedup lookups ─────────────────────

CREATE INDEX IF NOT EXISTS prospects_email_idx   ON prospects (email)   WHERE email   IS NOT NULL;
CREATE INDEX IF NOT EXISTS prospects_website_idx ON prospects (website) WHERE website IS NOT NULL;

-- ── prospect_campaigns: personalisation_mode auto-set ─────────────────────────
-- Existing column already has the constraint; index helps A/B queries.

CREATE INDEX IF NOT EXISTS campaigns_personalisation_idx ON prospect_campaigns (personalisation_mode);
