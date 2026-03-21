-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: showcase_ai_data_layer
-- Purpose:   Add structured, AI-extractable venue data fields to venue_showcases.
--
-- These fields power three new showcase components:
--   1. ShowcaseAtAGlance   — explicit labelled data block (replaces decorative stats)
--   2. ShowcasePricing     — "Pricing & What to Expect" honest range section
--   3. ShowcaseVerified    — trust signals (verified_at, source, data freshness)
--
-- Fields are intentionally nullable so partial data is valid.
-- AI systems (Aura, LLMs, structured extraction) consume these directly.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. CAPACITY FIELDS ───────────────────────────────────────────────────────
ALTER TABLE venue_showcases
  ADD COLUMN IF NOT EXISTS ceremony_capacity     integer,   -- max seated ceremony guests
  ADD COLUMN IF NOT EXISTS dining_capacity       integer,   -- max seated dinner/breakfast
  ADD COLUMN IF NOT EXISTS reception_capacity    integer,   -- max standing/cocktail reception
  ADD COLUMN IF NOT EXISTS bedrooms              integer,   -- total rooms/suites on property
  ADD COLUMN IF NOT EXISTS exclusive_use         boolean,   -- full venue buyout available
  ADD COLUMN IF NOT EXISTS exclusive_use_notes   text;      -- e.g. "From £X, minimum 2 nights"

-- ── 2. PRICING FIELDS ────────────────────────────────────────────────────────
ALTER TABLE venue_showcases
  ADD COLUMN IF NOT EXISTS currency                    text    DEFAULT 'GBP',
  ADD COLUMN IF NOT EXISTS venue_hire_from             integer,  -- minimum venue hire fee (pence)
  ADD COLUMN IF NOT EXISTS typical_wedding_spend_min   integer,  -- typical total min (pence)
  ADD COLUMN IF NOT EXISTS typical_wedding_spend_max   integer,  -- typical total max (pence)
  ADD COLUMN IF NOT EXISTS minimum_spend               integer,  -- minimum F&B spend (pence)
  ADD COLUMN IF NOT EXISTS price_per_head_from         integer,  -- per-head from (pence)
  ADD COLUMN IF NOT EXISTS pricing_notes               text,     -- narrative context for pricing
  ADD COLUMN IF NOT EXISTS pricing_includes            text[],   -- e.g. ARRAY['Venue hire','Catering']
  ADD COLUMN IF NOT EXISTS pricing_excludes            text[];   -- e.g. ARRAY['Flowers','Music']

-- ── 3. TRUST & VERIFICATION FIELDS ───────────────────────────────────────────
ALTER TABLE venue_showcases
  ADD COLUMN IF NOT EXISTS verified_at             timestamptz,  -- when data was last confirmed
  ADD COLUMN IF NOT EXISTS verification_notes      text,         -- e.g. "Confirmed with sales team"
  ADD COLUMN IF NOT EXISTS last_confirmed_source   text,         -- e.g. "venue_direct" | "lwd_team"
  ADD COLUMN IF NOT EXISTS data_version            integer DEFAULT 1;  -- increment on each update

-- ── 4. CATERING & OPERATIONS ─────────────────────────────────────────────────
ALTER TABLE venue_showcases
  ADD COLUMN IF NOT EXISTS catering_type           text,   -- 'in_house_only' | 'approved_list' | 'open'
  ADD COLUMN IF NOT EXISTS outdoor_ceremony        boolean,
  ADD COLUMN IF NOT EXISTS on_site_accommodation   boolean;

-- ── 5. INDEXES ────────────────────────────────────────────────────────────────
-- Support Aura queries filtering by capacity and verified status
CREATE INDEX IF NOT EXISTS idx_venue_showcases_ceremony_capacity
  ON venue_showcases(ceremony_capacity) WHERE ceremony_capacity IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_venue_showcases_verified_at
  ON venue_showcases(verified_at) WHERE verified_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_venue_showcases_exclusive_use
  ON venue_showcases(exclusive_use) WHERE exclusive_use IS NOT NULL;

-- ── 6. COMMENTS (for Supabase schema introspection + AI context) ─────────────
COMMENT ON COLUMN venue_showcases.ceremony_capacity    IS 'Maximum number of seated guests for a ceremony';
COMMENT ON COLUMN venue_showcases.dining_capacity      IS 'Maximum number of seated guests for a wedding breakfast or dinner';
COMMENT ON COLUMN venue_showcases.reception_capacity   IS 'Maximum number of guests for a standing/cocktail reception';
COMMENT ON COLUMN venue_showcases.bedrooms             IS 'Total number of rooms and suites available for guest accommodation';
COMMENT ON COLUMN venue_showcases.exclusive_use        IS 'Whether full venue buyout / exclusive use is available';
COMMENT ON COLUMN venue_showcases.exclusive_use_notes  IS 'Conditions, pricing or minimum nights for exclusive use arrangements';
COMMENT ON COLUMN venue_showcases.currency             IS 'ISO 4217 currency code for all price fields. Default: GBP';
COMMENT ON COLUMN venue_showcases.venue_hire_from      IS 'Minimum venue hire fee in lowest currency unit (pence for GBP)';
COMMENT ON COLUMN venue_showcases.typical_wedding_spend_min IS 'Typical total wedding spend minimum — all-in estimate, in pence';
COMMENT ON COLUMN venue_showcases.typical_wedding_spend_max IS 'Typical total wedding spend maximum — all-in estimate, in pence';
COMMENT ON COLUMN venue_showcases.minimum_spend        IS 'Minimum food and beverage spend required, in pence';
COMMENT ON COLUMN venue_showcases.price_per_head_from  IS 'Starting per-head price for catering packages, in pence';
COMMENT ON COLUMN venue_showcases.pricing_notes        IS 'Plain-language context about pricing — seasonal variation, what drives cost, realistic expectations';
COMMENT ON COLUMN venue_showcases.pricing_includes     IS 'Array of items included in the base price or venue hire';
COMMENT ON COLUMN venue_showcases.pricing_excludes     IS 'Array of items not included — florists, music, photography etc.';
COMMENT ON COLUMN venue_showcases.verified_at          IS 'Timestamp when this venue data was last confirmed as accurate';
COMMENT ON COLUMN venue_showcases.verification_notes   IS 'How and by whom this data was verified';
COMMENT ON COLUMN venue_showcases.last_confirmed_source IS 'Source of verification: venue_direct | lwd_team | public_sources';
COMMENT ON COLUMN venue_showcases.data_version         IS 'Monotonically incrementing version number, updated on each data change';
COMMENT ON COLUMN venue_showcases.catering_type        IS 'Catering arrangement: in_house_only | approved_list | open';
COMMENT ON COLUMN venue_showcases.outdoor_ceremony     IS 'Whether outdoor ceremony space is available on the property';
COMMENT ON COLUMN venue_showcases.on_site_accommodation IS 'Whether on-site guest accommodation is available';
