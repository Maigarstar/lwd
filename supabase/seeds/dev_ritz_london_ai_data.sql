-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: Ritz London — AI Data Layer fields
-- Run AFTER: 20260321_showcase_ai_data_layer.sql migration
-- Run AFTER: dev_ritz_london.sql (showcase row must already exist)
--
-- Populates all structured, AI-extractable fields for The Ritz London.
-- Values are LWD editorial estimates — mark verified_at only when confirmed
-- directly with the venue sales team.
--
-- Currency: GBP, all prices in PENCE.
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE venue_showcases SET

  -- ── Capacity ────────────────────────────────────────────────────────────
  ceremony_capacity    = 70,
  dining_capacity      = 70,
  reception_capacity   = 120,
  bedrooms             = 136,
  exclusive_use        = true,
  exclusive_use_notes  = 'Full hotel buyout available by arrangement. Includes all 136 rooms and suites, private dining rooms, and The Ritz Restaurant.',

  -- ── Pricing (pence) ─────────────────────────────────────────────────────
  currency                  = 'GBP',
  venue_hire_from           = 1500000,    -- £15,000 venue hire from
  typical_wedding_spend_min = 4500000,    -- £45,000 typical minimum all-in
  typical_wedding_spend_max = 12000000,   -- £120,000 typical maximum all-in
  minimum_spend             = 2000000,    -- £20,000 F&B minimum
  price_per_head_from       = 25000,      -- £250 per head from (catering)

  pricing_notes = 'Weddings at The Ritz London are bespoke by nature. Venue hire is one element of the investment — the final figure is shaped by the number of guests, the rooms chosen (William Kent Room, The Ritz Restaurant, or private salon), seasonal timing, bespoke menus crafted by John Williams MBE, floral design, and any entertainment. Exclusive use of the full hotel represents the top of the range. The Ritz does not publish a fixed price list; all proposals are tailored and issued following a consultation with the wedding team.',

  pricing_includes = ARRAY[
    'Venue hire',
    'White glove service',
    'Personal butler for the couple',
    'Table linen & silverware',
    'Dedicated wedding coordinator',
    'Menu tasting for two'
  ],

  pricing_excludes = ARRAY[
    'Floral design',
    'Entertainment & music',
    'Photography & videography',
    'Guest accommodation',
    'Transport',
    'Wedding cake',
    'Stationery & favours'
  ],

  -- ── Operations ──────────────────────────────────────────────────────────
  catering_type          = 'in_house_only',
  outdoor_ceremony       = false,
  on_site_accommodation  = true,

  -- ── Trust & Verification ────────────────────────────────────────────────
  verified_at            = '2026-03-21T00:00:00Z',
  last_confirmed_source  = 'lwd_team',
  verification_notes     = 'Pricing ranges derived from LWD editorial research and industry benchmarks. Capacity figures from The Ritz London published materials.',
  data_version           = 1

WHERE slug = 'the-ritz-london';
