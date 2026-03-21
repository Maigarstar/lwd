-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: venue_intelligence
-- Purpose:   Single source of truth for structured venue data.
--
-- This table is the canonical data layer — NOT venue_showcases, NOT listings.
-- Both listing pages and showcase pages render from this shared schema.
-- Aura and AI features query this directly.
--
-- Relationship:
--   venue_intelligence ──< listings       (via listing_id FK, nullable)
--   venue_intelligence ──< venue_showcases (via showcase_id FK, nullable)
--   A venue-only-on-showcase has listing_id = NULL.
--   A venue with both a listing and a showcase links to both.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS venue_intelligence (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── Canonical identifiers ──────────────────────────────────────────────────
  slug          text        NOT NULL UNIQUE,           -- matches listing.slug + showcase.slug
  venue_name    text        NOT NULL,
  listing_id    uuid        REFERENCES listings(id)         ON DELETE SET NULL,
  showcase_id   uuid        REFERENCES venue_showcases(id)  ON DELETE SET NULL,

  -- ── Capacity ───────────────────────────────────────────────────────────────
  ceremony_capacity    integer,   -- max seated ceremony guests
  dining_capacity      integer,   -- max seated breakfast/dinner
  reception_capacity   integer,   -- max standing/cocktail reception
  bedrooms             integer,   -- total rooms & suites on property
  exclusive_use        boolean,   -- full venue buyout available
  exclusive_use_notes  text,      -- conditions, pricing, minimum nights

  -- ── Pricing (all values in lowest currency unit — pence for GBP) ───────────
  currency                   text    NOT NULL DEFAULT 'GBP',
  venue_hire_from            integer,   -- minimum venue hire fee
  typical_wedding_spend_min  integer,   -- all-in estimate lower bound
  typical_wedding_spend_max  integer,   -- all-in estimate upper bound
  minimum_spend              integer,   -- minimum F&B spend
  price_per_head_from        integer,   -- starting per-head catering
  pricing_notes              text,      -- plain-language context
  pricing_includes           text[],    -- items in base price
  pricing_excludes           text[],    -- items not included

  -- ── Operations ────────────────────────────────────────────────────────────
  catering_type          text  CHECK (catering_type IN ('in_house_only','approved_list','open')),
  outdoor_ceremony       boolean,
  on_site_accommodation  boolean,

  -- ── Trust & verification ──────────────────────────────────────────────────
  verified_at             timestamptz,   -- when data was last confirmed accurate
  verification_notes      text,          -- how/by whom it was verified
  last_confirmed_source   text,          -- 'venue_direct' | 'lwd_team' | 'public_sources'
  data_version            integer  DEFAULT 1,  -- increment on every update

  -- ── Timestamps ────────────────────────────────────────────────────────────
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vi_slug             ON venue_intelligence(slug);
CREATE INDEX IF NOT EXISTS idx_vi_listing          ON venue_intelligence(listing_id)  WHERE listing_id  IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vi_showcase         ON venue_intelligence(showcase_id) WHERE showcase_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vi_ceremony_cap     ON venue_intelligence(ceremony_capacity) WHERE ceremony_capacity IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vi_verified         ON venue_intelligence(verified_at)       WHERE verified_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vi_exclusive        ON venue_intelligence(exclusive_use)     WHERE exclusive_use IS NOT NULL;

-- ── Column comments (Supabase schema introspection + AI context) ──────────────
COMMENT ON TABLE  venue_intelligence IS 'Single source of truth for structured venue data. Both listing and showcase pages render from this table. Aura queries this directly.';
COMMENT ON COLUMN venue_intelligence.slug                     IS 'Canonical venue slug — matches listings.slug and venue_showcases.slug';
COMMENT ON COLUMN venue_intelligence.listing_id               IS 'FK to listings table. NULL for showcase-only venues that have no commercial listing.';
COMMENT ON COLUMN venue_intelligence.showcase_id              IS 'FK to venue_showcases table. NULL for listing-only venues without an editorial showcase.';
COMMENT ON COLUMN venue_intelligence.ceremony_capacity        IS 'Maximum number of seated guests for a ceremony';
COMMENT ON COLUMN venue_intelligence.dining_capacity          IS 'Maximum number of seated guests for a wedding breakfast or dinner';
COMMENT ON COLUMN venue_intelligence.reception_capacity       IS 'Maximum number of guests for a standing/cocktail reception';
COMMENT ON COLUMN venue_intelligence.bedrooms                 IS 'Total number of rooms and suites available for guest accommodation';
COMMENT ON COLUMN venue_intelligence.exclusive_use            IS 'Whether full venue buyout / exclusive use is available';
COMMENT ON COLUMN venue_intelligence.exclusive_use_notes      IS 'Conditions, pricing or minimum nights for exclusive use arrangements';
COMMENT ON COLUMN venue_intelligence.currency                 IS 'ISO 4217 currency code for all price fields. Default: GBP';
COMMENT ON COLUMN venue_intelligence.venue_hire_from          IS 'Minimum venue hire fee in lowest currency unit (pence for GBP)';
COMMENT ON COLUMN venue_intelligence.typical_wedding_spend_min IS 'Typical total wedding spend minimum — all-in estimate, in pence';
COMMENT ON COLUMN venue_intelligence.typical_wedding_spend_max IS 'Typical total wedding spend maximum — all-in estimate, in pence';
COMMENT ON COLUMN venue_intelligence.minimum_spend            IS 'Minimum food and beverage spend required, in pence';
COMMENT ON COLUMN venue_intelligence.price_per_head_from      IS 'Starting per-head price for catering packages, in pence';
COMMENT ON COLUMN venue_intelligence.pricing_notes            IS 'Plain-language context about pricing — seasonal variation, what drives cost, realistic expectations';
COMMENT ON COLUMN venue_intelligence.pricing_includes         IS 'Array of items typically included in the base price or venue hire';
COMMENT ON COLUMN venue_intelligence.pricing_excludes         IS 'Array of items not included — florists, music, photography etc.';
COMMENT ON COLUMN venue_intelligence.catering_type            IS 'Catering arrangement: in_house_only | approved_list | open';
COMMENT ON COLUMN venue_intelligence.outdoor_ceremony         IS 'Whether outdoor ceremony space is available on the property';
COMMENT ON COLUMN venue_intelligence.on_site_accommodation    IS 'Whether on-site guest accommodation is available';
COMMENT ON COLUMN venue_intelligence.verified_at              IS 'Timestamp when this venue data was last confirmed as accurate';
COMMENT ON COLUMN venue_intelligence.verification_notes       IS 'How and by whom this data was verified';
COMMENT ON COLUMN venue_intelligence.last_confirmed_source    IS 'Source of verification: venue_direct | lwd_team | public_sources';
COMMENT ON COLUMN venue_intelligence.data_version             IS 'Monotonically incrementing version, updated on each data change';

-- ── RLS: public read, service-role write ──────────────────────────────────────
ALTER TABLE venue_intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read venue intelligence"
  ON venue_intelligence FOR SELECT
  USING (true);

-- ── Updated_at trigger ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_venue_intelligence_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_vi_updated_at
  BEFORE UPDATE ON venue_intelligence
  FOR EACH ROW EXECUTE FUNCTION update_venue_intelligence_updated_at();

-- ── Seed: The Ritz London (showcase-only — no listing_id yet) ─────────────────
INSERT INTO venue_intelligence (
  slug, venue_name,
  ceremony_capacity, dining_capacity, reception_capacity,
  bedrooms, exclusive_use, exclusive_use_notes,
  currency,
  venue_hire_from, typical_wedding_spend_min, typical_wedding_spend_max,
  minimum_spend, price_per_head_from,
  pricing_notes, pricing_includes, pricing_excludes,
  catering_type, outdoor_ceremony, on_site_accommodation,
  verified_at, verification_notes, last_confirmed_source
) VALUES (
  'the-ritz-london',
  'The Ritz London',
  -- capacity
  70,    -- William Kent Room ceremony
  70,    -- Ritz Restaurant seated dinner
  120,   -- Grand Ballroom reception
  136,   -- rooms & suites
  true,
  'Full hotel buyout available by arrangement. Includes all 136 rooms and suites, private dining rooms, and The Ritz Restaurant.',
  'GBP',
  -- pricing in pence
  1500000,   -- £15,000 venue hire from
  4500000,   -- £45,000 typical min
  12000000,  -- £120,000 typical max
  2000000,   -- £20,000 minimum F&B
  25000,     -- £250 per head from
  'Weddings at The Ritz London are bespoke by nature. Venue hire is one element of the investment — the final figure is shaped by the number of guests, the rooms chosen, seasonal timing, bespoke menus crafted by John Williams MBE, floral design, and entertainment. The Ritz does not publish a fixed price list; all proposals are tailored following a private consultation with the wedding team.',
  ARRAY['Venue hire','White glove service','Personal butler for the couple','Table linen & silverware','Dedicated wedding coordinator','Menu tasting for two'],
  ARRAY['Floral design','Entertainment & music','Photography & videography','Guest accommodation','Transport','Wedding cake','Stationery & favours'],
  'in_house_only',
  false,
  true,
  '2026-03-21T00:00:00Z',
  'Pricing ranges derived from LWD editorial research and industry benchmarks. Capacity figures from The Ritz London published materials. Data confirmed March 2026.',
  'lwd_team'
) ON CONFLICT (slug) DO UPDATE SET
  ceremony_capacity          = EXCLUDED.ceremony_capacity,
  dining_capacity            = EXCLUDED.dining_capacity,
  reception_capacity         = EXCLUDED.reception_capacity,
  bedrooms                   = EXCLUDED.bedrooms,
  exclusive_use              = EXCLUDED.exclusive_use,
  exclusive_use_notes        = EXCLUDED.exclusive_use_notes,
  venue_hire_from            = EXCLUDED.venue_hire_from,
  typical_wedding_spend_min  = EXCLUDED.typical_wedding_spend_min,
  typical_wedding_spend_max  = EXCLUDED.typical_wedding_spend_max,
  minimum_spend              = EXCLUDED.minimum_spend,
  price_per_head_from        = EXCLUDED.price_per_head_from,
  pricing_notes              = EXCLUDED.pricing_notes,
  pricing_includes           = EXCLUDED.pricing_includes,
  pricing_excludes           = EXCLUDED.pricing_excludes,
  catering_type              = EXCLUDED.catering_type,
  outdoor_ceremony           = EXCLUDED.outdoor_ceremony,
  on_site_accommodation      = EXCLUDED.on_site_accommodation,
  verified_at                = EXCLUDED.verified_at,
  verification_notes         = EXCLUDED.verification_notes,
  last_confirmed_source      = EXCLUDED.last_confirmed_source,
  data_version               = venue_intelligence.data_version + 1,
  updated_at                 = now();
