-- ─────────────────────────────────────────────────────────────────────────────
-- Sales Pipeline Phase 2: Campaigns, Onboarding, Email Tracking
-- ─────────────────────────────────────────────────────────────────────────────

-- ── prospect_campaigns ────────────────────────────────────────────────────────
-- Stores bulk outreach campaigns sent to filtered prospect groups.
-- Lifecycle: draft -> sending -> sent | paused
-- Once 'sent', a campaign cannot resend. "Send Again" creates a new record.

CREATE TABLE IF NOT EXISTS prospect_campaigns (
  id                  UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  name                TEXT    NOT NULL,
  filters             JSONB   NOT NULL DEFAULT '{}',
  -- filters shape: {
  --   pipeline_id?: string,
  --   stage_ids?: string[],
  --   venue_types?: string[],
  --   min_score?: number,
  --   statuses?: string[]
  -- }
  subject             TEXT,
  body                TEXT,
  template_id         UUID    REFERENCES pipeline_email_templates(id) ON DELETE SET NULL,
  personalisation_mode TEXT   NOT NULL DEFAULT 'template'
                              CHECK (personalisation_mode IN ('template', 'ai_assisted')),
  status              TEXT    NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft', 'sending', 'sent', 'paused')),
  total_recipients    INTEGER NOT NULL DEFAULT 0,
  sent_count          INTEGER NOT NULL DEFAULT 0,
  from_email          TEXT,
  from_name           TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  sent_at             TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS campaigns_status_idx    ON prospect_campaigns (status);
CREATE INDEX IF NOT EXISTS campaigns_created_idx   ON prospect_campaigns (created_at DESC);

ALTER TABLE prospect_campaigns DISABLE ROW LEVEL SECURITY;

-- ── Extend outreach_emails for tracking + campaign attribution ─────────────────

ALTER TABLE outreach_emails
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES prospect_campaigns(id) ON DELETE SET NULL;

ALTER TABLE outreach_emails
  ADD COLUMN IF NOT EXISTS opened_at  TIMESTAMPTZ;

ALTER TABLE outreach_emails
  ADD COLUMN IF NOT EXISTS open_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS outreach_campaign_idx  ON outreach_emails (campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS outreach_opened_idx    ON outreach_emails (opened_at)   WHERE opened_at  IS NOT NULL;

-- ── prospect_onboarding_tasks ─────────────────────────────────────────────────
-- One row per converted prospect. Stores checklist as JSONB array.
-- Automatically created when a prospect reaches a Closed Won stage.

CREATE TABLE IF NOT EXISTS prospect_onboarding_tasks (
  id              UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  prospect_id     UUID    NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  checklist_items JSONB   NOT NULL DEFAULT '[]',
  -- item shape: { id: string, label: string, completed: boolean, completed_at: string|null }
  status          TEXT    NOT NULL DEFAULT 'in_progress'
                          CHECK (status IN ('in_progress', 'complete')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (prospect_id)
);

CREATE INDEX IF NOT EXISTS onboarding_prospect_idx ON prospect_onboarding_tasks (prospect_id);
CREATE INDEX IF NOT EXISTS onboarding_status_idx   ON prospect_onboarding_tasks (status);

ALTER TABLE prospect_onboarding_tasks DISABLE ROW LEVEL SECURITY;

-- ── Email open tracking RPC ────────────────────────────────────────────────────
-- Called by the track-email-open edge function.
-- Sets opened_at on first open, always increments open_count.

CREATE OR REPLACE FUNCTION track_email_open(email_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE outreach_emails
  SET
    opened_at  = COALESCE(opened_at, NOW()),
    open_count = open_count + 1
  WHERE id = email_id;
END;
$$;
