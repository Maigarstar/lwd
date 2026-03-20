-- ─── Corinthia London Showcase Seed ─────────────────────────────────────────
-- slug: corinthia-london
-- Run in Supabase SQL Editor (management API) — bypasses anon RLS
-- Idempotent: ON CONFLICT (slug) DO UPDATE
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO venue_showcases (
  type,
  title,
  slug,
  location,
  excerpt,
  hero_image_url,
  logo_url,
  listing_id,
  status,
  template_key,
  sections,
  published_sections,
  key_stats,
  sort_order,
  created_at,
  updated_at,
  published_at
)
VALUES (
  'venue',
  'Corinthia London',
  'corinthia-london',
  'Whitehall Place, London SW1A 2BD',
  'London''s Magical Grand Hotel — a Victorian masterpiece reborn as the city''s most storied five-star address, where 140 years of history meets London''s most expansive hotel spa.',

  -- Hero image: grand hotel lobby / chandelier atmosphere
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1800&q=85',

  NULL,
  NULL,
  'published',
  'grand_hotel',

  -- ── sections (working copy) ───────────────────────────────────────────────
  '[
    {
      "id": "cl-hero-01",
      "type": "hero",
      "content": {
        "title": "Corinthia London",
        "tagline": "London''s Magical Grand Hotel — where 140 years of history meet the city''s most extraordinary five-star experience.",
        "image": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1800&q=85",
        "overlay_opacity": 0.48
      },
      "layout": {}
    },
    {
      "id": "cl-stats-01",
      "type": "stats",
      "content": {
        "eyebrow": "The Hotel",
        "items": [
          { "value": "283", "label": "Guest Rooms", "sublabel": "& 51 suites" },
          { "value": "7", "label": "Penthouses", "sublabel": "with butler service" },
          { "value": "3,300㎡", "label": "Biome Spa", "sublabel": "London''s largest hotel spa" },
          { "value": "Est. 1885", "label": "Heritage", "sublabel": "140 years of grandeur" }
        ]
      },
      "layout": { "variant": "strip" }
    },
    {
      "id": "cl-intro-01",
      "type": "intro",
      "content": {
        "eyebrow": "Whitehall Place",
        "headline": "A Grand Hotel Built for the Ages",
        "body": "Commissioned in 1883 as the largest hotel in Europe, the Corinthia London occupies a magnificent Victorian building at the corner of Whitehall Place — minutes from Trafalgar Square, the Thames, and Westminster. Following a $490 million transformation in 2011, the hotel''s French Haussmann facade was preserved while its interiors were reborn in timeless luxury. The centrepiece of arrival is the Crystal Moon Lounge, where a bespoke 1,001-crystal Baccarat chandelier hangs beneath a vaulted dome. Tom Kerridge''s acclaimed brasserie, Mezzogiorno by Francesco Mazzei, and the four-floor Biome spa make this not simply a hotel, but a destination within London itself."
      },
      "layout": { "accentBg": "#0c0b09" }
    },
    {
      "id": "cl-feature-01",
      "type": "feature",
      "content": {
        "eyebrow": "The Penthouses",
        "headline": "Above the City, Entirely Your Own",
        "image": "https://images.unsplash.com/photo-1578683994960-aa2e9a53c5fc?w=1400&q=85",
        "body": "Seven two-storey duplex penthouses crown the Corinthia, each with its own personality and 24-hour butler. The Royal Penthouse — the largest two-bedroom residence in London at 465 sq m — spans two levels with a private spa suite, ten-seat dining room, wine cellar, and a terrace commanding a 180-degree panorama: the Thames, the London Eye, Big Ben. The Hamilton Penthouse offers a rooftop hot tub framed by Nelson''s Column. The Musician''s Penthouse houses a Steinway grand piano. Each is a private world above Whitehall."
      },
      "layout": { "variant": "image-right", "accentBg": "#110f0c" }
    },
    {
      "id": "cl-mosaic-01",
      "type": "mosaic",
      "content": {
        "title": "An Extraordinary Interior World",
        "body": "From the Baccarat chandelier to the ballroom''s Victorian ceiling, every corner tells a story.",
        "images": [
          { "url": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1000&q=80", "caption": "Kerridge''s Bar & Grill" },
          { "url": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000&q=80", "caption": "Biome Spa" },
          { "url": "https://images.unsplash.com/photo-1519741497674-611b6285b7af?w=1000&q=80", "caption": "The Ballroom" },
          { "url": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1000&q=80", "caption": "Crystal Moon Lounge" }
        ]
      },
      "layout": { "variant": "default" }
    },
    {
      "id": "cl-weddings-01",
      "type": "weddings",
      "content": {
        "eyebrow": "The Ballroom",
        "headline": "Your Wedding, in London''s Most Storied Room",
        "image": "https://images.unsplash.com/photo-1519741497674-611b6285b7af?w=1400&q=85",
        "body": "The Corinthia''s Grand Ballroom is a masterpiece of preserved Victorian craftsmanship — glittering original chandeliers, high ornate ceilings, and a private entrance from Whitehall Place. With capacity for up to 350 guests for a Champagne reception, it is one of London''s grandest settings for a wedding celebration. The adjacent Courtroom, with its floor-to-ceiling windows and crescent-shaped design, offers an intimate ceremony space suffused with natural light. The hotel''s dedicated wedding team, bespoke culinary menus, and in-house pâtissiers create a day that is entirely, unmistakably yours."
      },
      "layout": { "variant": "image-left", "accentBg": "#100e0c" }
    },
    {
      "id": "cl-quote-01",
      "type": "quote",
      "content": {
        "text": "The Corinthia has timeless Victorian grandeur with modern sophistication — the hotel embodies the promise of luxury done with intelligence and heart.",
        "attribution": "Five Star Alliance",
        "attributionRole": "Hotel Review"
      },
      "layout": { "variant": "centered", "accentBg": "#0a0906" }
    },
    {
      "id": "cl-dining-01",
      "type": "dining",
      "content": {
        "eyebrow": "Kerridge''s Bar & Grill",
        "headline": "The Finest of British Craft",
        "image": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400&q=85",
        "body": "Tom Kerridge — whose Hand & Flowers in Marlow holds the distinction of being the UK''s only two-Michelin-starred pub — brought his first London restaurant to the Corinthia. Designed by David Collins Studio, Kerridge''s Bar & Grill is a confident celebration of the best British seasonal produce: rotisserie-cooked meats, premium steaks, long leisurely lunches. Alongside it, Mezzogiorno by Francesco Mazzei (opened 2025) fills an 8-metre vaulted room with the soul of Southern Italy — hand-painted stucco, Murano chandeliers, and dishes including Four Pastas of Rome and Scottish Crab with Tuscan Panzanella. And in the Crystal Moon Lounge, afternoon tea is served beneath the Baccarat chandelier with blends crafted by the hotel''s own Tea Master."
      },
      "layout": { "variant": "image-right", "accentBg": "#0f0d0b" }
    },
    {
      "id": "cl-wellness-01",
      "type": "wellness",
      "content": {
        "eyebrow": "Biome by Corinthia",
        "headline": "London''s Most Expansive Hotel Spa",
        "image": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1400&q=85",
        "body": "Biome by Corinthia London spans four floors and 3,300 square metres — London''s largest hotel spa. Its thermal sequence begins with an immersive guided journey: the glass amphitheatre sauna at 90°C, steam rooms, ice fountain, and a vitality pool at 36°C. Heated marble loungers and private sleep pods lead into 17 treatment rooms offering rituals by Wildsmith and Augustinus Bader. The Biome Spa Suite provides two treatment pods, a contemporary Rasul, and a private steam shower for couples. Above it all, the AMP x Corinthia Gym operates 24 hours — Technogym, BLK BOX, Peloton, and specialist personal training. Primal Luxury: where nature''s wisdom meets modern science."
      },
      "layout": { "variant": "image-left", "accentBg": "#0d0c0a" }
    },
    {
      "id": "cl-cta-01",
      "type": "cta",
      "content": {
        "headline": "Begin Your Story at Corinthia London",
        "subline": "Reserve a penthouse, plan your wedding, or simply arrive. London''s most storied address is waiting.",
        "venueName": "Corinthia London"
      },
      "layout": {}
    }
  ]'::jsonb,

  -- ── published_sections (snapshot — identical to sections above) ──────────
  '[
    {
      "id": "cl-hero-01",
      "type": "hero",
      "content": {
        "title": "Corinthia London",
        "tagline": "London''s Magical Grand Hotel — where 140 years of history meet the city''s most extraordinary five-star experience.",
        "image": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1800&q=85",
        "overlay_opacity": 0.48
      },
      "layout": {}
    },
    {
      "id": "cl-stats-01",
      "type": "stats",
      "content": {
        "eyebrow": "The Hotel",
        "items": [
          { "value": "283", "label": "Guest Rooms", "sublabel": "& 51 suites" },
          { "value": "7", "label": "Penthouses", "sublabel": "with butler service" },
          { "value": "3,300㎡", "label": "Biome Spa", "sublabel": "London''s largest hotel spa" },
          { "value": "Est. 1885", "label": "Heritage", "sublabel": "140 years of grandeur" }
        ]
      },
      "layout": { "variant": "strip" }
    },
    {
      "id": "cl-intro-01",
      "type": "intro",
      "content": {
        "eyebrow": "Whitehall Place",
        "headline": "A Grand Hotel Built for the Ages",
        "body": "Commissioned in 1883 as the largest hotel in Europe, the Corinthia London occupies a magnificent Victorian building at the corner of Whitehall Place — minutes from Trafalgar Square, the Thames, and Westminster. Following a $490 million transformation in 2011, the hotel''s French Haussmann facade was preserved while its interiors were reborn in timeless luxury. The centrepiece of arrival is the Crystal Moon Lounge, where a bespoke 1,001-crystal Baccarat chandelier hangs beneath a vaulted dome. Tom Kerridge''s acclaimed brasserie, Mezzogiorno by Francesco Mazzei, and the four-floor Biome spa make this not simply a hotel, but a destination within London itself."
      },
      "layout": { "accentBg": "#0c0b09" }
    },
    {
      "id": "cl-feature-01",
      "type": "feature",
      "content": {
        "eyebrow": "The Penthouses",
        "headline": "Above the City, Entirely Your Own",
        "image": "https://images.unsplash.com/photo-1578683994960-aa2e9a53c5fc?w=1400&q=85",
        "body": "Seven two-storey duplex penthouses crown the Corinthia, each with its own personality and 24-hour butler. The Royal Penthouse — the largest two-bedroom residence in London at 465 sq m — spans two levels with a private spa suite, ten-seat dining room, wine cellar, and a terrace commanding a 180-degree panorama: the Thames, the London Eye, Big Ben. The Hamilton Penthouse offers a rooftop hot tub framed by Nelson''s Column. The Musician''s Penthouse houses a Steinway grand piano. Each is a private world above Whitehall."
      },
      "layout": { "variant": "image-right", "accentBg": "#110f0c" }
    },
    {
      "id": "cl-mosaic-01",
      "type": "mosaic",
      "content": {
        "title": "An Extraordinary Interior World",
        "body": "From the Baccarat chandelier to the ballroom''s Victorian ceiling, every corner tells a story.",
        "images": [
          { "url": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1000&q=80", "caption": "Kerridge''s Bar & Grill" },
          { "url": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000&q=80", "caption": "Biome Spa" },
          { "url": "https://images.unsplash.com/photo-1519741497674-611b6285b7af?w=1000&q=80", "caption": "The Ballroom" },
          { "url": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1000&q=80", "caption": "Crystal Moon Lounge" }
        ]
      },
      "layout": { "variant": "default" }
    },
    {
      "id": "cl-weddings-01",
      "type": "weddings",
      "content": {
        "eyebrow": "The Ballroom",
        "headline": "Your Wedding, in London''s Most Storied Room",
        "image": "https://images.unsplash.com/photo-1519741497674-611b6285b7af?w=1400&q=85",
        "body": "The Corinthia''s Grand Ballroom is a masterpiece of preserved Victorian craftsmanship — glittering original chandeliers, high ornate ceilings, and a private entrance from Whitehall Place. With capacity for up to 350 guests for a Champagne reception, it is one of London''s grandest settings for a wedding celebration. The adjacent Courtroom, with its floor-to-ceiling windows and crescent-shaped design, offers an intimate ceremony space suffused with natural light. The hotel''s dedicated wedding team, bespoke culinary menus, and in-house pâtissiers create a day that is entirely, unmistakably yours."
      },
      "layout": { "variant": "image-left", "accentBg": "#100e0c" }
    },
    {
      "id": "cl-quote-01",
      "type": "quote",
      "content": {
        "text": "The Corinthia has timeless Victorian grandeur with modern sophistication — the hotel embodies the promise of luxury done with intelligence and heart.",
        "attribution": "Five Star Alliance",
        "attributionRole": "Hotel Review"
      },
      "layout": { "variant": "centered", "accentBg": "#0a0906" }
    },
    {
      "id": "cl-dining-01",
      "type": "dining",
      "content": {
        "eyebrow": "Kerridge''s Bar & Grill",
        "headline": "The Finest of British Craft",
        "image": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400&q=85",
        "body": "Tom Kerridge — whose Hand & Flowers in Marlow holds the distinction of being the UK''s only two-Michelin-starred pub — brought his first London restaurant to the Corinthia. Designed by David Collins Studio, Kerridge''s Bar & Grill is a confident celebration of the best British seasonal produce: rotisserie-cooked meats, premium steaks, long leisurely lunches. Alongside it, Mezzogiorno by Francesco Mazzei (opened 2025) fills an 8-metre vaulted room with the soul of Southern Italy — hand-painted stucco, Murano chandeliers, and dishes including Four Pastas of Rome and Scottish Crab with Tuscan Panzanella. And in the Crystal Moon Lounge, afternoon tea is served beneath the Baccarat chandelier with blends crafted by the hotel''s own Tea Master."
      },
      "layout": { "variant": "image-right", "accentBg": "#0f0d0b" }
    },
    {
      "id": "cl-wellness-01",
      "type": "wellness",
      "content": {
        "eyebrow": "Biome by Corinthia",
        "headline": "London''s Most Expansive Hotel Spa",
        "image": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1400&q=85",
        "body": "Biome by Corinthia London spans four floors and 3,300 square metres — London''s largest hotel spa. Its thermal sequence begins with an immersive guided journey: the glass amphitheatre sauna at 90°C, steam rooms, ice fountain, and a vitality pool at 36°C. Heated marble loungers and private sleep pods lead into 17 treatment rooms offering rituals by Wildsmith and Augustinus Bader. The Biome Spa Suite provides two treatment pods, a contemporary Rasul, and a private steam shower for couples. Above it all, the AMP x Corinthia Gym operates 24 hours — Technogym, BLK BOX, Peloton, and specialist personal training. Primal Luxury: where nature''s wisdom meets modern science."
      },
      "layout": { "variant": "image-left", "accentBg": "#0d0c0a" }
    },
    {
      "id": "cl-cta-01",
      "type": "cta",
      "content": {
        "headline": "Begin Your Story at Corinthia London",
        "subline": "Reserve a penthouse, plan your wedding, or simply arrive. London''s most storied address is waiting.",
        "venueName": "Corinthia London"
      },
      "layout": {}
    }
  ]'::jsonb,

  -- key_stats
  '[
    {"value": "283", "label": "Guest Rooms"},
    {"value": "7",   "label": "Penthouses"},
    {"value": "3,300㎡", "label": "Biome Spa"},
    {"value": "Est. 1885", "label": "Heritage"}
  ]'::jsonb,

  -- sort_order, created_at, updated_at, published_at
  1,
  now(),
  now(),
  now()
)
ON CONFLICT (slug) DO UPDATE
  SET
    title             = EXCLUDED.title,
    location          = EXCLUDED.location,
    excerpt           = EXCLUDED.excerpt,
    hero_image_url    = EXCLUDED.hero_image_url,
    status            = EXCLUDED.status,
    sections          = EXCLUDED.sections,
    published_sections = EXCLUDED.published_sections,
    key_stats         = EXCLUDED.key_stats,
    updated_at        = now(),
    published_at      = now();
