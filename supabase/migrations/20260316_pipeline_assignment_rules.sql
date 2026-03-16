-- ─────────────────────────────────────────────────────────────────────────────
-- Auto Pipeline Assignment Rules
-- Stores configurable rules that map prospect fields to pipelines.
-- A singleton settings row controls AI fallback and the default pipeline.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── pipeline_assignment_rules ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pipeline_assignment_rules (
  id             UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id    UUID    NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  rule_field     TEXT    NOT NULL
                   CHECK (rule_field IN ('venue_type','source','company_name','notes','country','email')),
  rule_condition TEXT    NOT NULL
                   CHECK (rule_condition IN ('contains','equals','starts_with','not_contains')),
  rule_value     TEXT    NOT NULL,
  priority       INTEGER NOT NULL DEFAULT 50,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS assignment_rules_pipeline_idx  ON pipeline_assignment_rules (pipeline_id);
CREATE INDEX IF NOT EXISTS assignment_rules_priority_idx  ON pipeline_assignment_rules (priority DESC);
CREATE INDEX IF NOT EXISTS assignment_rules_active_idx    ON pipeline_assignment_rules (is_active);

ALTER TABLE pipeline_assignment_rules DISABLE ROW LEVEL SECURITY;

-- ── pipeline_assignment_settings ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pipeline_assignment_settings (
  id                   UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  ai_fallback_enabled  BOOLEAN NOT NULL DEFAULT true,
  fallback_pipeline_id UUID    REFERENCES pipelines(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pipeline_assignment_settings DISABLE ROW LEVEL SECURITY;

-- Singleton row - always exactly one row in this table
INSERT INTO pipeline_assignment_settings (ai_fallback_enabled, fallback_pipeline_id)
VALUES (true, 'a1000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- ── Default seed rules ────────────────────────────────────────────────────────
-- Evaluated highest priority first. First match wins.
-- Covers the standard venue_type dropdown values + common source patterns.

INSERT INTO pipeline_assignment_rules (pipeline_id, rule_field, rule_condition, rule_value, priority, is_active) VALUES

  -- ── Venue Partnerships (a1000000-...0001) ─────────────────────────────────
  ('a1000000-0000-0000-0000-000000000001', 'venue_type', 'equals',   'Venue',      100, true),
  ('a1000000-0000-0000-0000-000000000001', 'venue_type', 'contains', 'venue',       90, true),
  ('a1000000-0000-0000-0000-000000000001', 'venue_type', 'contains', 'estate',      85, true),
  ('a1000000-0000-0000-0000-000000000001', 'venue_type', 'contains', 'hotel',       85, true),
  ('a1000000-0000-0000-0000-000000000001', 'venue_type', 'contains', 'castle',      85, true),
  ('a1000000-0000-0000-0000-000000000001', 'venue_type', 'contains', 'manor',       85, true),
  ('a1000000-0000-0000-0000-000000000001', 'venue_type', 'contains', 'barn',        80, true),
  ('a1000000-0000-0000-0000-000000000001', 'venue_type', 'contains', 'hall',        80, true),
  ('a1000000-0000-0000-0000-000000000001', 'venue_type', 'contains', 'chateau',     85, true),
  ('a1000000-0000-0000-0000-000000000001', 'venue_type', 'contains', 'vineyard',    80, true),
  ('a1000000-0000-0000-0000-000000000001', 'venue_type', 'contains', 'resort',      80, true),
  ('a1000000-0000-0000-0000-000000000001', 'source',     'equals',   'List Your Venue', 95, true),

  -- ── Wedding Planner Partnerships (a1000000-...0003) ───────────────────────
  ('a1000000-0000-0000-0000-000000000003', 'venue_type', 'equals',   'Planner',    100, true),
  ('a1000000-0000-0000-0000-000000000003', 'venue_type', 'contains', 'planner',     90, true),
  ('a1000000-0000-0000-0000-000000000003', 'venue_type', 'contains', 'coordinator', 90, true),
  ('a1000000-0000-0000-0000-000000000003', 'venue_type', 'contains', 'stylist',     85, true),
  ('a1000000-0000-0000-0000-000000000003', 'venue_type', 'contains', 'organiser',   85, true),
  ('a1000000-0000-0000-0000-000000000003', 'venue_type', 'contains', 'organizer',   85, true),

  -- ── Vendor Partnerships (a1000000-...0002) ────────────────────────────────
  ('a1000000-0000-0000-0000-000000000002', 'venue_type', 'equals',   'Vendor',     100, true),
  ('a1000000-0000-0000-0000-000000000002', 'venue_type', 'contains', 'vendor',      90, true),
  ('a1000000-0000-0000-0000-000000000002', 'venue_type', 'contains', 'florist',     90, true),
  ('a1000000-0000-0000-0000-000000000002', 'venue_type', 'contains', 'photograph',  90, true),
  ('a1000000-0000-0000-0000-000000000002', 'venue_type', 'contains', 'videograph',  90, true),
  ('a1000000-0000-0000-0000-000000000002', 'venue_type', 'contains', 'caterer',     88, true),
  ('a1000000-0000-0000-0000-000000000002', 'venue_type', 'contains', 'catering',    88, true),
  ('a1000000-0000-0000-0000-000000000002', 'venue_type', 'contains', 'cake',        85, true),
  ('a1000000-0000-0000-0000-000000000002', 'venue_type', 'contains', 'baker',       85, true),
  ('a1000000-0000-0000-0000-000000000002', 'venue_type', 'contains', 'band',        85, true),
  ('a1000000-0000-0000-0000-000000000002', 'venue_type', 'contains', 'musician',    85, true),
  ('a1000000-0000-0000-0000-000000000002', 'venue_type', 'contains', 'dj',          85, true),
  ('a1000000-0000-0000-0000-000000000002', 'venue_type', 'contains', 'makeup',      85, true),
  ('a1000000-0000-0000-0000-000000000002', 'venue_type', 'contains', 'hair',        80, true),
  ('a1000000-0000-0000-0000-000000000002', 'venue_type', 'contains', 'dress',       80, true),
  ('a1000000-0000-0000-0000-000000000002', 'venue_type', 'contains', 'bridal',      80, true),
  ('a1000000-0000-0000-0000-000000000002', 'venue_type', 'contains', 'jeweller',    80, true),
  ('a1000000-0000-0000-0000-000000000002', 'venue_type', 'contains', 'stationer',   80, true),
  ('a1000000-0000-0000-0000-000000000002', 'venue_type', 'contains', 'transport',   80, true),
  ('a1000000-0000-0000-0000-000000000002', 'venue_type', 'contains', 'chauffeur',   80, true),
  ('a1000000-0000-0000-0000-000000000002', 'source',     'equals',   'Vendor Signup', 95, true)

ON CONFLICT DO NOTHING;
