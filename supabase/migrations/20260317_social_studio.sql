-- ─── Social Studio Data Layer ─────────────────────────────────────────────────
-- Tables: social_clients, social_campaigns, social_content
-- social_clients: managed accounts (Phase 2 will link to CRM clients table)
-- social_campaigns: campaign wrappers grouping related content
-- social_content: individual content items in the delivery pipeline
-- ──────────────────────────────────────────────────────────────────────────────

-- ── social_clients ────────────────────────────────────────────────────────────
-- Managed client accounts. Standalone for now; Phase 2 adds crm_client_id FK.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_clients (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT    NOT NULL,
  slug          TEXT    NOT NULL UNIQUE,
  -- Optional: venue/brand logo shown in client dropdowns
  logo_url      TEXT,
  -- Contact info (basic)
  contact_name  TEXT,
  contact_email TEXT,
  -- Active/inactive flag for filtering managed accounts
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  -- Phase 2: link to CRM clients table once that exists
  -- crm_client_id UUID REFERENCES crm_clients(id) ON DELETE SET NULL,
  -- Notes for internal team
  internal_notes TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── social_campaigns ──────────────────────────────────────────────────────────
-- Campaign wrappers. A campaign groups content items under a shared theme/goal.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_campaigns (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id     UUID    REFERENCES social_clients(id) ON DELETE SET NULL,
  name          TEXT    NOT NULL,
  -- Optional: campaign description / brief
  description   TEXT,
  -- Date range for campaign
  start_date    DATE,
  end_date      DATE,
  -- active | paused | complete | archived
  status        TEXT    NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'paused', 'complete', 'archived')),
  -- Sorting / display order
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── social_content ────────────────────────────────────────────────────────────
-- Individual content items. One row = one deliverable in the pipeline.
-- Duplicates each get their own independent row (parent_id for lineage only).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_content (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Client this item belongs to
  client_id     UUID    NOT NULL REFERENCES social_clients(id) ON DELETE CASCADE,

  -- Optional campaign grouping
  campaign_id   UUID    REFERENCES social_campaigns(id) ON DELETE SET NULL,
  -- Denormalised campaign name for fast reads / backwards compat
  campaign_name TEXT,

  -- Content descriptor
  title         TEXT    NOT NULL,
  -- Type key matches CONTENT_TYPES in SocialStudioModule
  -- post | reel | blog | venue-feature | newsletter | organic-content
  -- photography | video | style-shoot | fam-trip | link-building | consultancy | mentoring
  type          TEXT    NOT NULL DEFAULT 'post',
  -- Platform key matches PLATFORMS in SocialStudioModule
  -- instagram | facebook | pinterest | linkedin | tiktok | web | email
  platform      TEXT    NOT NULL DEFAULT 'instagram',

  -- Workflow status
  -- brief | draft | review | approved | scheduled | live | reported
  status        TEXT    NOT NULL DEFAULT 'brief'
                CHECK (status IN ('brief','draft','review','approved','scheduled','live','reported')),

  -- Scheduling
  publish_date  DATE,

  -- Team assignment
  assigned_to   TEXT,

  -- Content fields
  caption_brief TEXT,
  internal_notes TEXT,

  -- Duplication lineage (each duplicate is its own row; parent_id is for reference only)
  parent_id     UUID    REFERENCES social_content(id) ON DELETE SET NULL,

  -- Timestamps
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_social_content_client_id
  ON social_content (client_id);

CREATE INDEX IF NOT EXISTS idx_social_content_status
  ON social_content (status);

CREATE INDEX IF NOT EXISTS idx_social_content_publish_date
  ON social_content (publish_date);

CREATE INDEX IF NOT EXISTS idx_social_content_campaign_id
  ON social_content (campaign_id);

CREATE INDEX IF NOT EXISTS idx_social_campaigns_client_id
  ON social_campaigns (client_id);

-- ── updated_at triggers ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER trg_social_clients_updated_at
    BEFORE UPDATE ON social_clients
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

-- ── Seed: initial managed clients ─────────────────────────────────────────────
-- Matches MOCK_CLIENTS in SocialStudioModule. IDs are stable UUIDs so they
-- can be referenced by content rows without drift.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO social_clients (id, name, slug, active) VALUES
  ('a1b2c3d4-0001-0000-0000-000000000001', 'Villa d''Este',                  'villa-deste',                TRUE),
  ('a1b2c3d4-0002-0000-0000-000000000002', 'Belmond Villa San Michele',       'belmond-villa-san-michele',   TRUE),
  ('a1b2c3d4-0003-0000-0000-000000000003', 'Borgo Egnazia',                   'borgo-egnazia',               TRUE),
  ('a1b2c3d4-0004-0000-0000-000000000004', 'Amanzoe',                         'amanzoe',                     TRUE)
ON CONFLICT (id) DO NOTHING;
