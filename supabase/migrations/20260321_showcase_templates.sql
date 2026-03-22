-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 20260321_showcase_templates.sql
-- Adds is_template flag to venue_showcases and seeds The Ritz London
-- as the master luxury hotel template.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add is_template column
ALTER TABLE venue_showcases
  ADD COLUMN IF NOT EXISTS is_template BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Index for fast template lookups
CREATE INDEX IF NOT EXISTS idx_venue_showcases_is_template
  ON venue_showcases(is_template)
  WHERE is_template = TRUE;

-- 3. Seed The Ritz London as the master luxury hotel template
--    Slug is prefixed with 'template-' so it never collides with live showcases.
INSERT INTO venue_showcases (
  type, title, slug, location, excerpt,
  hero_image_url, logo_url,
  status, is_template, template_key,
  sections, published_sections, key_stats,
  sort_order
) VALUES (
  'venue',
  'The Ritz London',
  'template-luxury-london-hotel',
  '150 Piccadilly · Mayfair · London W1J 9BR',
  'Since 1906, the pinnacle of London luxury — where impeccable service, legendary afternoon tea and two Michelin stars define the art of the extraordinary.',
  'https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21069.jpg',
  NULL,
  'draft',
  TRUE,
  'luxury_london_hotel',
  '[
    {
      "id": "ritz-hero-001",
      "type": "hero",
      "content": {
        "title": "The Ritz London",
        "tagline": "Since 1906, the pinnacle of London luxury — where impeccable service, legendary afternoon tea and two Michelin stars define the art of the extraordinary.",
        "image": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21069.jpg",
        "eyebrow": "150 Piccadilly · Mayfair · London · Est. 1906",
        "overlay_opacity": 0.45
      },
      "layout": {}
    },
    {
      "id": "ritz-stats-001",
      "type": "stats",
      "content": {
        "eyebrow": "The Numbers",
        "items": [
          { "value": "136",    "label": "Rooms & Suites",  "sublabel": "Including seven grand suites" },
          { "value": "1906",   "label": "Established",      "sublabel": "118 years of tradition"       },
          { "value": "★★",    "label": "Michelin Stars",   "sublabel": "The Ritz Restaurant"          },
          { "value": "Royal",  "label": "Warrant",          "sublabel": "By Royal appointment"         },
          { "value": "No.1",   "label": "Piccadilly",       "sublabel": "London''s finest address"     },
          { "value": "120",    "label": "Max Guests",       "sublabel": "Reception capacity"           }
        ]
      },
      "layout": { "variant": "strip", "accentBg": "#1a1209" }
    },
    {
      "id": "ritz-gallery-001",
      "type": "gallery",
      "content": {
        "title": "A Glimpse Inside",
        "images": [
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21069.jpg", "caption": "The Long Gallery" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21068.jpg", "caption": "Grand staircase" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21059.jpg", "caption": "The Ritz interior" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21070.jpg", "caption": "Suite" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_6651.jpg",  "caption": "Palm Court" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9422.jpg",  "caption": "Wedding celebration" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9423.jpg",  "caption": "Ceremony" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_1282.jpg",  "caption": "The Ballroom" },
          { "url": "https://www.theritzlondon.com/content/uploads/2025/01/Deluxe-King.avif",               "caption": "Deluxe King room" }
        ]
      },
      "layout": { "variant": "grid" }
    },
    {
      "id": "ritz-intro-001",
      "type": "intro",
      "content": {
        "eyebrow": "The Ritz London",
        "headline": "London''s Most Celebrated Address",
        "body": "Designed by Charles Mewès and Arthur Davis and opened by César Ritz on 24th May 1906, The Ritz London stands as one of the world''s most legendary hotels — a living monument to the art of living well, where Louis XVI interiors, gilded colonnades, and sweeping views across Green Park remain as breathtaking today as the night it opened."
      },
      "layout": { "variant": "left-aligned", "accentBg": "#faf9f6" }
    },
    {
      "id": "ritz-band-story-001",
      "type": "highlight-band",
      "content": {
        "eyebrow": "The Ritz Story",
        "headline": "A Standard of Extraordinary",
        "body": "Holding the Royal Warrant by appointment to HRH The Prince of Wales, The Ritz London is not merely a hotel — it is a place where every guest is treated as royalty, every occasion elevated, and every detail a matter of honour. The Long Gallery stretches before you, dressed in hand-painted silk, antique marble, and gilded mirrors; the white-gloved staff of four generations greet you by name."
      },
      "layout": {}
    },
    {
      "id": "ritz-glance-001",
      "type": "verified",
      "content": {
        "eyebrow": "At a Glance",
        "headline": "Venue Intelligence",
        "venue_hire_from": "£1,500,000",
        "typical_spend_min": "£4,500,000",
        "typical_spend_max": "£12,000,000",
        "ceremony_capacity": "70",
        "dining_capacity": "70",
        "reception_capacity": "120",
        "bedrooms": "136",
        "exclusive_use": "Available by arrangement — all 136 rooms and suites",
        "catering": "In-house only — John Williams MBE",
        "outdoor_ceremony": "No",
        "accommodation": "On-site — 136 rooms and suites",
        "location_summary": "150 Piccadilly, Mayfair, London W1J 9BR",
        "style": "Grand historic hotel — Louis XVI interiors",
        "best_for": "Ultra-luxury London weddings, intimate receptions, prestige celebrations",
        "verified_date": "March 2026",
        "verification_notes": "Pricing ranges derived from LWD editorial research and industry benchmarks. Capacity figures from published Ritz London materials."
      },
      "layout": {}
    },
    {
      "id": "ritz-pricing-001",
      "type": "pricing",
      "content": {
        "eyebrow": "Pricing & What to Expect",
        "headline": "An Investment in the Extraordinary",
        "body": "Weddings at The Ritz London are bespoke by nature. Venue hire is one element of the investment — the final figure is shaped by the number of guests, the rooms chosen, seasonal timing, bespoke menus crafted by John Williams MBE, floral design, and entertainment. The Ritz does not publish a fixed price list; all proposals are tailored following a private consultation with the wedding team.",
        "price_from": "£1,500,000",
        "price_context": "Venue hire from",
        "typical_min": "£4,500,000",
        "typical_max": "£12,000,000",
        "typical_label": "Typical total wedding investment",
        "includes": [
          "Venue hire",
          "White glove service throughout",
          "Personal butler for the couple",
          "Fine linen, silverware & china",
          "Dedicated wedding coordinator",
          "Menu tasting for two"
        ],
        "excludes": [
          "Floral design & styling",
          "Entertainment & music",
          "Photography & videography",
          "Guest accommodation",
          "Wedding cake",
          "Stationery & favours"
        ],
        "guidance": "Plan for a minimum spend of £2,000,000 for an intimate celebration of 40–50 guests, rising to £12,000,000 or beyond for grand receptions of 100+ guests. Every Ritz wedding is unique — the team will guide you through all options during your initial consultation."
      },
      "layout": {}
    },
    {
      "id": "ritz-feature-rooms-001",
      "type": "feature",
      "content": {
        "eyebrow": "Rooms & Suites",
        "headline": "A Sanctuary of Extraordinary Refinement",
        "body": "136 rooms and suites, each dressed in silk damask and antique gold, with hand-painted ceilings, exquisite antiques, marble bathrooms of palatial proportions, and a personal butler in attendance at all times. The Grand Suites — including the William Kent Suite, the Trafalgar Suite, and the Prince of Wales Suite — represent the pinnacle of London luxury.",
        "image": "https://www.theritzlondon.com/content/uploads/2025/01/Deluxe-King.avif"
      },
      "layout": { "variant": "image-right" }
    },
    {
      "id": "ritz-dining-001",
      "type": "dining",
      "content": {
        "eyebrow": "The Ritz Restaurant",
        "headline": "Two Michelin Stars. London''s Most Famous Table.",
        "body": "Under the magnificent canopy of The Ritz Restaurant — where gilded ceilings, marble pillars, and views across the garden create the most opulent dining room in London — Head Chef John Williams MBE has held two Michelin stars since 2016. To dine here is to participate in a tradition of culinary excellence spanning the hotel''s entire history.",
        "image": "https://www.theritzlondon.com/content/uploads/2023/03/The-Ritz-Restaurant-medium-res.avif"
      },
      "layout": { "variant": "image-left" }
    },
    {
      "id": "ritz-feature-palmcourt-001",
      "type": "feature",
      "content": {
        "eyebrow": "Palm Court & Rivoli Bar",
        "headline": "Afternoon Tea at The Ritz",
        "body": "The world''s most famous afternoon tea is served five times daily in The Palm Court — a vision of gilded splendour, cascading floral arrangements, and live music, where the ceremony of fine china, finger sandwiches, warm scones and champagne has remained unchanged since 1906. The Rivoli Bar offers London''s most celebrated cocktail destination: an art deco jewel of amber and gold.",
        "image": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_6651.jpg"
      },
      "layout": { "variant": "image-left" }
    },
    {
      "id": "ritz-quote-001",
      "type": "quote",
      "content": {
        "text": "The Ritz London does not simply set the standard. It invented it.",
        "attribution": "Luxury Wedding Directory",
        "attributionRole": "Editorial Review"
      },
      "layout": { "variant": "centered" }
    },
    {
      "id": "ritz-mosaic-001",
      "type": "mosaic",
      "content": {
        "title": "Wedding Celebrations",
        "body": "",
        "images": [
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9422.jpg", "alt": "Wedding celebration" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9423.jpg", "alt": "Ceremony" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9424.jpg", "alt": "Wedding reception" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9425.jpg", "alt": "The couple" }
        ]
      },
      "layout": { "variant": "grid" }
    },
    {
      "id": "ritz-weddings-001",
      "type": "weddings",
      "content": {
        "eyebrow": "Weddings at The Ritz",
        "headline": "London''s Most Celebrated Wedding Venue",
        "body": "Every wedding at The Ritz is a masterpiece of discretion, elegance, and impeccable taste — created by London''s most celebrated wedding team, in London''s most celebrated hotel. The Ritz offers complete flexibility: intimate ceremonies in the William Kent Suite, grand receptions of up to 120 guests in The Ritz Restaurant, and wedding breakfasts that combine the artistry of John Williams MBE with menus crafted personally for each couple.",
        "image": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9426.jpg"
      },
      "layout": { "variant": "image-right" }
    },
    {
      "id": "ritz-band-weddings-001",
      "type": "highlight-band",
      "content": {
        "eyebrow": "Wedding Intelligence",
        "headline": "Capacity · Ceremony · Celebration",
        "body": "Reception: 120 guests · Ceremony: 70 guests · 136 rooms on-site · Exclusive use available · In-house catering by John Williams MBE · White glove service throughout"
      },
      "layout": {}
    },
    {
      "id": "ritz-cta-001",
      "type": "cta",
      "content": {
        "headline": "Begin Your Ritz Wedding",
        "subline": "Speak with our wedding team to arrange a private consultation at 150 Piccadilly.",
        "venueName": "The Ritz London"
      },
      "layout": {}
    }
  ]'::jsonb,
  '[]'::jsonb,
  '[
    { "value": "136",   "label": "Rooms & Suites" },
    { "value": "120",   "label": "Max Guests"     },
    { "value": "★★",   "label": "Michelin Stars"  },
    { "value": "Royal", "label": "Warrant"         }
  ]'::jsonb,
  0
) ON CONFLICT (slug) DO UPDATE SET
  sections     = EXCLUDED.sections,
  is_template  = TRUE,
  updated_at   = NOW();
