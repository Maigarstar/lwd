-- Social Studio + Managed Accounts Data Layer
-- Tables: managed_accounts, social_campaigns, social_content
--
-- managed_accounts: active service clients.
--   Created when a CRM deal is won and converted.
--   Optionally linked to a vendor login (vendors.id) and the originating CRM
--   lead (leads.id). Serves as the hub for content delivery, campaigns, and
--   activity. Separate from CRM (pipeline) and Vendor Accounts (auth layer).
--
-- social_campaigns: campaign wrappers grouping content items by theme/goal.
-- social_content: individual content pipeline items per managed account.
-- ----------------------------------------------------------------------------

-- managed_accounts
CREATE TABLE IF NOT EXISTS managed_accounts (
  id                   UUID    DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Display name shown throughout the platform
  name                 TEXT    NOT NULL,
  slug                 TEXT    NOT NULL UNIQUE,

  -- Optional logo for client cards
  logo_url             TEXT,

  -- Primary contact at the client
  primary_contact_name  TEXT,
  primary_contact_email TEXT,
  contact_phone        TEXT,

  -- Company type: venue | hotel | planner | agency | other
  company_type         TEXT,

  -- Service plan / tier: signature | growth | essentials | custom
  plan                 TEXT,

  -- Service delivery status (what is happening with the service)
  -- onboarding | active | paused | at-risk | churned
  service_status       TEXT    NOT NULL DEFAULT 'onboarding'
                       CHECK (service_status IN ('onboarding', 'active', 'paused', 'at-risk', 'churned')),

  -- Account lifecycle status (is the account still live)
  -- active | paused | churned
  status               TEXT    NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active', 'paused', 'churned')),

  -- Contract window
  contract_start_date  DATE,
  contract_end_date    DATE,
  renewal_date         DATE,

  -- Internal team member responsible for this account
  account_manager      TEXT,

  -- Onboarding progress: pending | in-progress | complete
  onboarding_status    TEXT    NOT NULL DEFAULT 'pending'
                       CHECK (onboarding_status IN ('pending', 'in-progress', 'complete')),

  -- Internal notes (account context, history, requirements)
  internal_notes       TEXT,

  -- Cross-system links (both optional)
  -- Link to the vendor login account (access layer). Set if the client has
  -- a vendor portal login. NOT required for service delivery.
  vendor_id            UUID    REFERENCES vendors(id) ON DELETE SET NULL,

  -- Link back to the originating CRM lead (the won deal that created this
  -- managed account). Used for audit trail and cross-system navigation.
  crm_lead_id          UUID    REFERENCES leads(id) ON DELETE SET NULL,

  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- social_campaigns
CREATE TABLE IF NOT EXISTS social_campaigns (
  id                   UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  managed_account_id   UUID    REFERENCES managed_accounts(id) ON DELETE SET NULL,
  name                 TEXT    NOT NULL,
  description          TEXT,
  start_date           DATE,
  end_date             DATE,
  -- active | paused | complete | archived
  status               TEXT    NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active', 'paused', 'complete', 'archived')),
  sort_order           INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- social_content
-- One row = one deliverable in the content pipeline.
-- Each duplicate row is independent; parent_id is lineage reference only.
CREATE TABLE IF NOT EXISTS social_content (
  id                   UUID    DEFAULT gen_random_uuid() PRIMARY KEY,

  managed_account_id   UUID    NOT NULL REFERENCES managed_accounts(id) ON DELETE CASCADE,

  campaign_id          UUID    REFERENCES social_campaigns(id) ON DELETE SET NULL,
  -- Denormalised campaign name for fast reads / backwards compat
  campaign_name        TEXT,

  title                TEXT    NOT NULL,
  -- Type key: post | reel | blog | venue-feature | newsletter | organic-content
  --           photography | video | style-shoot | fam-trip
  --           link-building | consultancy | mentoring
  type                 TEXT    NOT NULL DEFAULT 'post',
  -- Platform key: instagram | facebook | pinterest | linkedin | tiktok | web | email
  platform             TEXT    NOT NULL DEFAULT 'instagram',

  -- brief | draft | review | approved | scheduled | live | reported
  status               TEXT    NOT NULL DEFAULT 'brief'
                       CHECK (status IN ('brief','draft','review','approved','scheduled','live','reported')),

  publish_date         DATE,
  assigned_to          TEXT,
  caption_brief        TEXT,
  internal_notes       TEXT,

  -- Duplication lineage
  parent_id            UUID    REFERENCES social_content(id) ON DELETE SET NULL,

  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes

CREATE INDEX IF NOT EXISTS idx_managed_accounts_status
  ON managed_accounts (status);

CREATE INDEX IF NOT EXISTS idx_managed_accounts_service_status
  ON managed_accounts (service_status);

CREATE INDEX IF NOT EXISTS idx_managed_accounts_vendor_id
  ON managed_accounts (vendor_id);

CREATE INDEX IF NOT EXISTS idx_managed_accounts_crm_lead_id
  ON managed_accounts (crm_lead_id);

CREATE INDEX IF NOT EXISTS idx_social_content_managed_account_id
  ON social_content (managed_account_id);

CREATE INDEX IF NOT EXISTS idx_social_content_status
  ON social_content (status);

CREATE INDEX IF NOT EXISTS idx_social_content_publish_date
  ON social_content (publish_date);

CREATE INDEX IF NOT EXISTS idx_social_content_campaign_id
  ON social_content (campaign_id);

CREATE INDEX IF NOT EXISTS idx_social_campaigns_managed_account_id
  ON social_campaigns (managed_account_id);

-- updated_at triggers

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER trg_managed_accounts_updated_at
    BEFORE UPDATE ON managed_accounts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_social_campaigns_updated_at
    BEFORE UPDATE ON social_campaigns
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_social_content_updated_at
    BEFORE UPDATE ON social_content
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Seed: initial managed accounts
-- Stable UUIDs used as fallback in ManagedAccountsModule and SocialStudioModule
-- when the DB tables are unavailable.

INSERT INTO managed_accounts (id, name, slug, plan, status, service_status, onboarding_status) VALUES
  ('a1b2c3d4-0001-0000-0000-000000000001', 'Villa d''Este',             'villa-deste',               'signature', 'active', 'active', 'complete'),
  ('a1b2c3d4-0002-0000-0000-000000000002', 'Belmond Villa San Michele', 'belmond-villa-san-michele', 'signature', 'active', 'active', 'complete'),
  ('a1b2c3d4-0003-0000-0000-000000000003', 'Borgo Egnazia',             'borgo-egnazia',             'growth',    'active', 'active', 'complete'),
  ('a1b2c3d4-0004-0000-0000-000000000004', 'Amanzoe',                   'amanzoe',                   'growth',    'active', 'active', 'complete')
ON CONFLICT (id) DO NOTHING;
