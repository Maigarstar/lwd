-- ─────────────────────────────────────────────────────────────────────────────
-- Sales Pipeline Tables
-- prospects        : B2B outreach CRM (venues, vendors, planners)
-- outreach_emails  : Log of every email sent to a prospect
-- ─────────────────────────────────────────────────────────────────────────────

-- ── prospects ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS prospects (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Contact info
  company_name        TEXT        NOT NULL,
  contact_name        TEXT,
  email               TEXT,
  phone               TEXT,
  website             TEXT,
  country             TEXT        DEFAULT 'United Kingdom',

  -- Classification
  venue_type          TEXT,         -- 'venue' | 'vendor' | 'planner'
  source              TEXT,         -- 'referral' | 'linkedin' | 'google' | 'directory' | 'event' | 'other'
  package             TEXT,         -- 'standard' | 'premium' | 'elite'

  -- Pipeline
  pipeline_stage      TEXT        NOT NULL DEFAULT 'prospect'
                        CHECK (pipeline_stage IN (
                          'prospect','cold_email_sent','follow_up_sent',
                          'conversation','meeting_booked','proposal_sent',
                          'negotiation','closed_won','closed_lost'
                        )),
  status              TEXT        NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','converted','lost','paused')),

  -- Financials
  proposal_value      NUMERIC(10,2),

  -- Dates
  last_contacted_at   TIMESTAMPTZ,
  next_follow_up_at   TIMESTAMPTZ,

  -- Notes
  notes               TEXT,

  -- Timestamps
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS prospects_pipeline_stage_idx  ON prospects (pipeline_stage);
CREATE INDEX IF NOT EXISTS prospects_status_idx          ON prospects (status);
CREATE INDEX IF NOT EXISTS prospects_next_follow_up_idx  ON prospects (next_follow_up_at);
CREATE INDEX IF NOT EXISTS prospects_email_idx           ON prospects (email);
CREATE INDEX IF NOT EXISTS prospects_company_name_idx    ON prospects USING gin(to_tsvector('english', company_name));

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_prospects_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prospects_updated_at_trigger ON prospects;
CREATE TRIGGER prospects_updated_at_trigger
  BEFORE UPDATE ON prospects
  FOR EACH ROW EXECUTE FUNCTION update_prospects_updated_at();

-- ── outreach_emails ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS outreach_emails (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  prospect_id   UUID        NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,

  email_type    TEXT        NOT NULL
                  CHECK (email_type IN ('cold','follow_up_1','follow_up_2','proposal','custom')),
  subject       TEXT        NOT NULL,
  body          TEXT        NOT NULL,

  status        TEXT        NOT NULL DEFAULT 'sent'
                  CHECK (status IN ('sent','replied','bounced')),

  sent_at       TIMESTAMPTZ DEFAULT NOW(),
  replied_at    TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS outreach_emails_prospect_idx ON outreach_emails (prospect_id);
CREATE INDEX IF NOT EXISTS outreach_emails_status_idx   ON outreach_emails (status);
CREATE INDEX IF NOT EXISTS outreach_emails_sent_at_idx  ON outreach_emails (sent_at DESC);

-- ── RLS (permissive for admin use - tighten per project requirements) ─────────

-- Disable RLS so admin users can read/write freely.
-- If you need row-level security, add policies scoped to authenticated admin role.
ALTER TABLE prospects        DISABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_emails  DISABLE ROW LEVEL SECURITY;
