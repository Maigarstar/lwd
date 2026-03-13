-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED: Grand Tirolia — Full Listing Record
-- Mapped from GT_VENUE data in VenueProfilePage.jsx
-- Run this against your Supabase project via the SQL Editor or CLI:
--   supabase db push  OR  paste into Supabase > SQL Editor and run
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

INSERT INTO listings (
  -- ── Identity ─────────────────────────────────────────────────────────────────
  listing_type,
  venue_name,
  slug,
  category,
  destination,

  -- ── Location ─────────────────────────────────────────────────────────────────
  country,
  region,
  city,
  address,
  postcode,
  lat,
  lng,

  -- ── Core content ─────────────────────────────────────────────────────────────
  summary,
  description,
  capacity,
  price_range,
  amenities,

  -- ── Media ────────────────────────────────────────────────────────────────────
  hero_images,
  media_items,
  hero_layout,
  hero_caption,
  hero_credit,

  -- ── Spaces ───────────────────────────────────────────────────────────────────
  spaces,

  -- ── Rooms & Accommodation ────────────────────────────────────────────────────
  rooms_accommodation_type,
  rooms_total,
  rooms_suites,
  rooms_max_guests,
  rooms_exclusive_use,
  rooms_min_stay,
  rooms_description,
  rooms_images,

  -- ── Dining ───────────────────────────────────────────────────────────────────
  dining_style,
  dining_chef_name,
  dining_in_house,
  dining_external,
  dining_menu_styles,
  dining_dietary,
  dining_drinks,
  dining_description,
  dining_menu_images,

  -- ── Exclusive Use ────────────────────────────────────────────────────────────
  exclusive_use_enabled,
  exclusive_use_title,
  exclusive_use_subtitle,
  exclusive_use_description,
  exclusive_use_cta_text,
  exclusive_use_includes,

  -- ── Wedding Weekend ──────────────────────────────────────────────────────────
  wedding_weekend_enabled,
  wedding_weekend_subtitle,
  wedding_weekend_days,

  -- ── On the Estate ────────────────────────────────────────────────────────────
  estate_enabled,
  estate_items,

  -- ── Nearby Experiences ───────────────────────────────────────────────────────
  nearby_enabled,
  nearby_items,

  -- ── FAQ ──────────────────────────────────────────────────────────────────────
  faq_enabled,
  faq_title,
  faq_subtitle,
  faq_cta_enabled,
  faq_cta_headline,
  faq_cta_subtext,
  faq_cta_button_text,
  faq_categories,

  -- ── SEO ──────────────────────────────────────────────────────────────────────
  seo_title,
  seo_description,
  seo_keywords,

  -- ── Contact Profile ──────────────────────────────────────────────────────────
  contact_profile,

  -- ── Publishing ───────────────────────────────────────────────────────────────
  status,
  visibility,
  published_at

) VALUES (

  -- ── Identity ─────────────────────────────────────────────────────────────────
  'venue',
  'Grand Tirolia',
  'grand-tirolia',
  'wedding-venues',
  'austria',

  -- ── Location ─────────────────────────────────────────────────────────────────
  'Austria',
  'Tyrol',
  'Kitzbühel',
  'Eichenheim 10, 6370 Kitzbühel, Austria',
  '6370',
  '47.4258',
  '12.4204',

  -- ── Core content ─────────────────────────────────────────────────────────────
  'Europe''s most celebrated Alpine wedding estate — where the mountains are not a backdrop, they are part of the ceremony.',

  'Perched above Kitzbühel at an elevation of 800 metres, Grand Tirolia has been the benchmark for Alpine luxury since 1895. With five dedicated wedding spaces, a two-Michelin-starred kitchen, and an 18-hole championship golf course, it offers something no other estate in Europe can replicate — a complete world unto itself.

Grand Tirolia began as a hunting lodge for a Tyrolean aristocrat who understood that the most important thing a host can do is make their guests feel that no detail was left to chance. That philosophy has informed every renovation, every appointment, and every hire since.

Today, the estate comprises 98 rooms and suites, five event spaces, five dining concepts, a championship golf course, and a spa that regularly tops the European wellness rankings. But the soul of the place is unchanged: a genuine commitment to making every guest feel, above all else, extraordinary.',

  '450',
  'On request',

  'Grand Atrium · 450 guests, Grand Alps Spa · 3,000 m² wellness, Golf Eichenheim · 18 holes, Ski-in / Ski-out · direct access, Outdoor Pool · heated year-round, Fine Dining · Restaurant Tirolia, Cooper Bar · signature cocktails, The Golden · jazz bar & live acts, 98 Rooms & Suites · inc. 12 suites, Alpine Views · all rooms, Helipad · private arrivals, Eichenheim Terrace · private hire, Fitness Centre · 24-hour access, Tennis Courts · 3 courts, Kino Tirolia · private cinema, Wine Cellar · private tastings, Wellness Classes · daily schedule, Black See Lake · 15 min transfer',

  -- ── Media ────────────────────────────────────────────────────────────────────
  -- hero_images: primary aerial shot
  '[
    {
      "url": "/grand-tirolia/20250820_GTK_DJI_0382-HDR.jpg",
      "alt_text": "Grand Tirolia aerial view, Kitzbühel, Austria",
      "credit_camera": "",
      "copyright": "Grand Tirolia",
      "show_credit": false,
      "type": "hero",
      "featured": true,
      "visibility": "public"
    }
  ]'::jsonb,

  -- media_items: full gallery
  '[
    {
      "id": "gt-01",
      "url": "/grand-tirolia/20250820_GTK_DJI_0382-HDR.jpg",
      "alt_text": "Grand Tirolia aerial view, Kitzbühel, Austria",
      "title": "Aerial — Summer",
      "credit_camera": "",
      "copyright": "Grand Tirolia",
      "show_credit": false,
      "type": "hero",
      "featured": true,
      "visibility": "public",
      "sort_order": 1
    },
    {
      "id": "gt-02",
      "url": "/grand-tirolia/GT_Winter_Exterior_2026.jpg",
      "alt_text": "Grand Tirolia winter aerial view, snow-covered Kitzbühel",
      "title": "Winter Aerial",
      "credit_camera": "",
      "copyright": "Grand Tirolia",
      "show_credit": false,
      "type": "exterior",
      "featured": true,
      "visibility": "public",
      "sort_order": 2
    },
    {
      "id": "gt-03",
      "url": "/grand-tirolia/GT-Aussenansicht-Winter-097.jpg",
      "alt_text": "Grand Tirolia exterior at dusk, winter",
      "title": "Night Exterior",
      "credit_camera": "",
      "copyright": "Grand Tirolia",
      "show_credit": false,
      "type": "exterior",
      "featured": false,
      "visibility": "public",
      "sort_order": 3
    },
    {
      "id": "gt-04",
      "url": "/grand-tirolia/20250819_GTK_DJI_0314.jpg",
      "alt_text": "Grand Tirolia summer aerial panorama",
      "title": "Summer Aerial",
      "credit_camera": "",
      "copyright": "Grand Tirolia",
      "show_credit": false,
      "type": "exterior",
      "featured": false,
      "visibility": "public",
      "sort_order": 4
    },
    {
      "id": "gt-05",
      "url": "/grand-tirolia/GT_Lobby_2023.jpg",
      "alt_text": "Grand Alps Spa thermal pool with mountain views",
      "title": "Grand Alps Spa — Pool",
      "credit_camera": "",
      "copyright": "Grand Tirolia",
      "show_credit": false,
      "type": "spa",
      "featured": true,
      "visibility": "public",
      "sort_order": 5
    },
    {
      "id": "gt-06",
      "url": "/grand-tirolia/GT-Eichenheim-Terrasse-012.jpg",
      "alt_text": "Eichenheim champagne terrace overlooking the Alps",
      "title": "Champagne Terrace",
      "credit_camera": "",
      "copyright": "Grand Tirolia",
      "show_credit": false,
      "type": "exterior",
      "featured": false,
      "visibility": "public",
      "sort_order": 6
    },
    {
      "id": "gt-07",
      "url": "/grand-tirolia/Atrium_2024.jpg",
      "alt_text": "The Grand Atrium event space at Grand Tirolia",
      "title": "Grand Atrium",
      "credit_camera": "",
      "copyright": "Grand Tirolia",
      "show_credit": false,
      "type": "event_space",
      "featured": true,
      "visibility": "public",
      "sort_order": 7
    },
    {
      "id": "gt-08",
      "url": "/grand-tirolia/GTK-Gala_A7_00720-min.jpg",
      "alt_text": "Grand Ballroom at Grand Tirolia, gala dinner setup",
      "title": "Grand Ballroom — Gala",
      "credit_camera": "",
      "copyright": "Grand Tirolia",
      "show_credit": false,
      "type": "event_space",
      "featured": true,
      "visibility": "public",
      "sort_order": 8
    },
    {
      "id": "gt-09",
      "url": "/grand-tirolia/GTK-Gala_A7_00729.jpg",
      "alt_text": "Grand Ballroom wide shot, Kitzbühel",
      "title": "Grand Ballroom — Wide",
      "credit_camera": "",
      "copyright": "Grand Tirolia",
      "show_credit": false,
      "type": "event_space",
      "featured": false,
      "visibility": "public",
      "sort_order": 9
    },
    {
      "id": "gt-10",
      "url": "/grand-tirolia/GTK-Gala_A7_00735.jpg",
      "alt_text": "Table detail, Grand Tirolia gala dinner",
      "title": "Gala Table Detail",
      "credit_camera": "",
      "copyright": "Grand Tirolia",
      "show_credit": false,
      "type": "event_space",
      "featured": false,
      "visibility": "public",
      "sort_order": 10
    },
    {
      "id": "gt-11",
      "url": "/grand-tirolia/GTK-Gala_DSC00538.jpg",
      "alt_text": "Wedding dance floor, Grand Tirolia",
      "title": "Wedding Dance Floor",
      "credit_camera": "",
      "copyright": "Grand Tirolia",
      "show_credit": false,
      "type": "event_space",
      "featured": false,
      "visibility": "public",
      "sort_order": 11
    },
    {
      "id": "gt-12",
      "url": "/grand-tirolia/20250821_GTK_A7_08271.jpg",
      "alt_text": "Restaurant Tirolia dining room",
      "title": "Restaurant Tirolia",
      "credit_camera": "",
      "copyright": "Grand Tirolia",
      "show_credit": false,
      "type": "dining",
      "featured": true,
      "visibility": "public",
      "sort_order": 12
    },
    {
      "id": "gt-13",
      "url": "/grand-tirolia/GT_Mai23_Gasthaus_239_web.jpg",
      "alt_text": "Gasthaus Eichenheim interior, Tyrolean farmhouse dining",
      "title": "Gasthaus Eichenheim",
      "credit_camera": "",
      "copyright": "Grand Tirolia",
      "show_credit": false,
      "type": "dining",
      "featured": false,
      "visibility": "public",
      "sort_order": 13
    },
    {
      "id": "gt-14",
      "url": "/grand-tirolia/20250819_GTK_A9_01073.jpg",
      "alt_text": "Cocktail service at Grand Tirolia",
      "title": "Cocktails",
      "credit_camera": "",
      "copyright": "Grand Tirolia",
      "show_credit": false,
      "type": "dining",
      "featured": false,
      "visibility": "public",
      "sort_order": 14
    },
    {
      "id": "gt-15",
      "url": "/grand-tirolia/Grand_Tirolia_Cooper_Bar.jpg",
      "alt_text": "The Cooper Bar at Grand Tirolia, stone walls and leather banquettes",
      "title": "The Cooper Bar",
      "credit_camera": "",
      "copyright": "Grand Tirolia",
      "show_credit": false,
      "type": "dining",
      "featured": false,
      "visibility": "public",
      "sort_order": 15
    },
    {
      "id": "gt-16",
      "url": "/grand-tirolia/GT_Jazzclub_high_169.jpg",
      "alt_text": "The Golden jazz club, Grand Tirolia",
      "title": "The Golden — Jazz Club",
      "credit_camera": "",
      "copyright": "Grand Tirolia",
      "show_credit": false,
      "type": "dining",
      "featured": false,
      "visibility": "public",
      "sort_order": 16
    },
    {
      "id": "gt-17",
      "url": "/grand-tirolia/GT_Juli_2023_Restaurant_Food_17.jpg",
      "alt_text": "Fine dining dish, Restaurant Tirolia",
      "title": "Food — Plate Detail",
      "credit_camera": "",
      "copyright": "Grand Tirolia",
      "show_credit": false,
      "type": "dining",
      "featured": false,
      "visibility": "public",
      "sort_order": 17
    },
    {
      "id": "gt-18",
      "url": "/grand-tirolia/GT_Juli_2023_Restaurant_Food_3.jpg",
      "alt_text": "Fine dining plate presentation, Grand Tirolia kitchen",
      "title": "Food — Seasonal Plate",
      "credit_camera": "",
      "copyright": "Grand Tirolia",
      "show_credit": false,
      "type": "dining",
      "featured": false,
      "visibility": "public",
      "sort_order": 18
    },
    {
      "id": "gt-19",
      "url": "/grand-tirolia/GrandTirolia_Juni2024_199.jpg",
      "alt_text": "Culinary detail, Grand Tirolia restaurant",
      "title": "Food — Summer Menu",
      "credit_camera": "",
      "copyright": "Grand Tirolia",
      "show_credit": false,
      "type": "dining",
      "featured": false,
      "visibility": "public",
      "sort_order": 19
    },
    {
      "id": "gt-20",
      "url": "/grand-tirolia/GrandTirolia_Juni2024_200.jpg",
      "alt_text": "Culinary presentation, Grand Tirolia summer 2024",
      "title": "Food — Artisan Dish",
      "credit_camera": "",
      "copyright": "Grand Tirolia",
      "show_credit": false,
      "type": "dining",
      "featured": false,
      "visibility": "public",
      "sort_order": 20
    },
    {
      "id": "gt-21",
      "url": "/grand-tirolia/GT_Mai23_Zimmer_096_high.jpg",
      "alt_text": "Deluxe Alpine Room at Grand Tirolia, 52 m²",
      "title": "Deluxe Alpine Room",
      "credit_camera": "",
      "copyright": "Grand Tirolia",
      "show_credit": false,
      "type": "room",
      "featured": true,
      "visibility": "public",
      "sort_order": 21
    },
    {
      "id": "gt-22",
      "url": "/grand-tirolia/GrandTirolia_DeluxeZimmer_Balkon_Terrasse.jpg",
      "alt_text": "Deluxe Room balcony terrace with mountain views, Grand Tirolia",
      "title": "Deluxe Room — Balcony",
      "credit_camera": "",
      "copyright": "Grand Tirolia",
      "show_credit": false,
      "type": "room",
      "featured": false,
      "visibility": "public",
      "sort_order": 22
    },
    {
      "id": "gt-23",
      "url": "/grand-tirolia/GolfEichenheim_IndianSummer.jpg",
      "alt_text": "Golf Eichenheim course in Indian summer, Kitzbühel",
      "title": "Golf Eichenheim — Autumn",
      "credit_camera": "",
      "copyright": "Grand Tirolia",
      "show_credit": false,
      "type": "activities",
      "featured": true,
      "visibility": "public",
      "sort_order": 23
    },
    {
      "id": "gt-24",
      "url": "/grand-tirolia/Herz_Golfplatz.jpg",
      "alt_text": "Heart-shaped bunker on Eichenheim golf course, Grand Tirolia",
      "title": "Golf — Heart Bunker",
      "credit_camera": "",
      "copyright": "Grand Tirolia",
      "show_credit": false,
      "type": "activities",
      "featured": false,
      "visibility": "public",
      "sort_order": 24
    }
  ]'::jsonb,

  'cinematic',
  'Grand Tirolia, Kitzbühel · Tyrol, Austria',
  '© Grand Tirolia',

  -- ── Spaces ───────────────────────────────────────────────────────────────────
  '[
    {
      "id": "atrium",
      "name": "The Grand Atrium",
      "image": "/grand-tirolia/Atrium_2024.jpg",
      "description": "The centrepiece of Grand Tirolia — a fully customisable event hall with a curved 18-metre LED wall, integrated state-of-the-art sound, and a stage built for performances of any scale. Up to 450 guests for a seated dinner.",
      "capacity_seated": 450,
      "capacity_standing": 600,
      "features": ["18m curved LED wall", "State-of-the-art sound system", "Integrated stage", "Fully customisable lighting"],
      "suitable_for": ["Ceremony", "Dinner", "Gala", "Live performance"]
    },
    {
      "id": "ballroom",
      "name": "The Grand Ballroom",
      "image": "/grand-tirolia/GTK-Gala_A7_00729.jpg",
      "description": "The Ballroom seats 280 guests beneath original Tyrolean plasterwork and cascading crystal chandeliers. Ghost chairs, bespoke linen, and candlelit tables — the room transforms entirely to match your vision. Perfect for black-tie receptions, dinner dances, and intimate civil ceremonies.",
      "capacity_seated": 280,
      "capacity_standing": 350,
      "features": ["Original Tyrolean plasterwork", "Crystal chandeliers", "Dance floor", "Natural daylight"],
      "suitable_for": ["Ceremony", "Dinner", "Reception", "Black-tie"]
    },
    {
      "id": "eichenheim-terrace",
      "name": "Eichenheim Terrace",
      "image": "/grand-tirolia/GT-Eichenheim-Terrasse-012.jpg",
      "description": "The champagne terrace overlooking the Kitzbüheler Alps — ideal for outdoor ceremonies, drinks receptions, and pre-dinner gatherings. Available for private hire.",
      "capacity_seated": 120,
      "capacity_standing": 200,
      "features": ["Panoramic Alpine views", "Private hire available", "Outdoor ceremony setup"],
      "suitable_for": ["Ceremony", "Drinks reception", "Pre-dinner"]
    },
    {
      "id": "golden",
      "name": "The Golden",
      "image": "/grand-tirolia/GT_Jazzclub_high_169.jpg",
      "description": "Tufted velvet sofas, shelves of rare single malts, and a curved bar hand-finished in Austrian pine — The Golden is Grand Tirolia''s jazz club and cocktail bar. Live acts every weekend, available for intimate late-night wedding receptions.",
      "capacity_seated": 60,
      "capacity_standing": 80,
      "features": ["Jazz club", "Live music licence", "Private hire", "Full cocktail bar"],
      "suitable_for": ["After-party", "Intimate reception", "Late-night bar"]
    },
    {
      "id": "cooper-bar",
      "name": "The Cooper Bar",
      "image": "/grand-tirolia/Grand_Tirolia_Cooper_Bar.jpg",
      "description": "Stone walls, arched brass mirrors, green leather banquettes — the Cooper Bar is Grand Tirolia''s most unexpected room. Available for private hire as part of your wedding evening.",
      "capacity_seated": 45,
      "capacity_standing": 65,
      "features": ["Private hire", "Full bar", "Unique architecture"],
      "suitable_for": ["After-party", "Private drinks", "Intimate gathering"]
    }
  ]'::jsonb,

  -- ── Rooms & Accommodation ────────────────────────────────────────────────────
  'hotel',
  '98',
  '12',
  '200',
  true,
  '1',

  'From the 52 m² Deluxe Alpine Room to the 320 m² Grand Tirolia Suite with its private sauna and fireplace — every one of our 98 rooms has been designed to put the landscape first. Wood-panelled walls, hand-woven Alpine textiles, and private balconies overlooking the Kitzbüheler Horn mean your guests wake up already in the Alps.',

  '[
    {
      "url": "/grand-tirolia/GT_Mai23_Zimmer_096_high.jpg",
      "alt_text": "Deluxe Alpine Room at Grand Tirolia — 52 m²",
      "caption": "Deluxe Alpine Room · 52 m²"
    },
    {
      "url": "/grand-tirolia/GrandTirolia_DeluxeZimmer_Balkon_Terrasse.jpg",
      "alt_text": "Deluxe Room private balcony terrace with mountain views",
      "caption": "Deluxe Room Balcony Terrace"
    },
    {
      "url": "/grand-tirolia/GT-Aussenansicht-Winter-097.jpg",
      "alt_text": "Grand Tirolia hotel exterior, winter night",
      "caption": "Hotel Exterior — Winter"
    }
  ]'::jsonb,

  -- ── Dining ───────────────────────────────────────────────────────────────────
  'Fine dining, Alpine bistro, cocktail bar, jazz club',
  'Grand Tirolia Culinary Team',
  true,
  false,

  '["Plated tasting menu", "Sharing feast", "Buffet stations", "Alpine farmhouse", "Canape reception", "Cocktail reception", "Late-night supper"]'::jsonb,

  '["Vegetarian", "Vegan", "Gluten-free", "Dairy-free", "Nut-free", "Halal (on request)", "Kosher (on request)"]'::jsonb,

  '["Champagne", "Fine wine", "Austrian wines", "Craft cocktails", "Non-alcoholic", "Open bar", "Schnapps selection", "Single malts"]'::jsonb,

  'Grand Tirolia''s culinary team brings together five distinct dining concepts — from the precision of Restaurant Tirolia to the informal warmth of Gasthaus Eichenheim and the late-night energy of The Golden. Every wedding menu is designed exclusively for your day. The estate''s in-house team handles all catering — no outside suppliers required.',

  '[
    {
      "url": "/grand-tirolia/GT_Juli_2023_Restaurant_Food_17.jpg",
      "alt_text": "Fine dining plate, Restaurant Tirolia"
    },
    {
      "url": "/grand-tirolia/GT_Juli_2023_Restaurant_Food_3.jpg",
      "alt_text": "Seasonal plate, Grand Tirolia kitchen"
    },
    {
      "url": "/grand-tirolia/GrandTirolia_Juni2024_199.jpg",
      "alt_text": "Summer menu, Grand Tirolia"
    },
    {
      "url": "/grand-tirolia/GrandTirolia_Juni2024_200.jpg",
      "alt_text": "Artisan dish, Grand Tirolia restaurant"
    },
    {
      "url": "/grand-tirolia/GrandTirolia_Juni2024_204.jpg",
      "alt_text": "Chef''s creation, Grand Tirolia"
    }
  ]'::jsonb,

  -- ── Exclusive Use ────────────────────────────────────────────────────────────
  true,
  'Exclusive Use',
  'The entire estate, exclusively yours',
  'Grand Tirolia is available for full exclusive use — all 98 rooms, five event spaces, five dining concepts, the spa, the golf course, and every staff member dedicated entirely to your wedding party. Available for three-night minimum stays.',
  'Enquire About Exclusive Use',

  '["All 98 rooms & suites", "5 private event spaces", "5 dining concepts & bars", "Grand Alps Spa — 3,000 m²", "Golf Eichenheim — 18 holes", "Dedicated wedding team", "Private helipad access", "In-house culinary team", "Full AV & production support", "Exclusive use of all grounds"]'::jsonb,

  -- ── Wedding Weekend ──────────────────────────────────────────────────────────
  true,
  'A full Alpine wedding experience — arrival to farewell',

  '[
    {
      "day": "Day 1",
      "title": "Arrival & Welcome",
      "description": "Guests arrive by helicopter or private transfer. Welcome drinks on the Eichenheim Terrace, room check-in, informal dinner at Gasthaus Eichenheim.",
      "icon": "arrival"
    },
    {
      "day": "Day 2",
      "title": "The Wedding Day",
      "description": "Morning spa & golf. Ceremony at the chapel or terrace. Champagne reception. Gala dinner in the Grand Atrium or Ballroom. Late-night at The Golden.",
      "icon": "wedding"
    },
    {
      "day": "Day 3",
      "title": "The Morning After",
      "description": "Schnapps breakfast at Gasthaus Eichenheim. Golf round for the keenest guests. Spa day. Farewell lunch on the terrace.",
      "icon": "brunch"
    },
    {
      "day": "Day 4",
      "title": "Extended Stay",
      "description": "Skiing, hiking, or a day trip to Kitzbühel old town. Ski safari on the Hahnenkamm. Optional helicopter excursion to Salzburg or Innsbruck.",
      "icon": "explore"
    }
  ]'::jsonb,

  -- ── On the Estate ────────────────────────────────────────────────────────────
  true,

  '[
    {
      "title": "Grand Alps Spa",
      "description": "3,000 m² of thermal pools, saunas, and relaxation suites overlooking the Alps.",
      "icon": "spa",
      "image": "/grand-tirolia/GT_Lobby_2023.jpg"
    },
    {
      "title": "Golf Eichenheim",
      "description": "18-hole championship course laid out in 1965. Uninterrupted mountain panoramas.",
      "icon": "golf",
      "image": "/grand-tirolia/GolfEichenheim_IndianSummer.jpg"
    },
    {
      "title": "Kino Tirolia",
      "description": "Private cinema available for exclusive screenings, presentations, or late-night entertainment.",
      "icon": "cinema"
    },
    {
      "title": "Fitness & Wellness",
      "description": "24-hour fitness centre, daily yoga and pilates classes, tennis courts.",
      "icon": "fitness"
    },
    {
      "title": "Outdoor Heated Pool",
      "description": "Year-round outdoor pool with Alpine panorama.",
      "icon": "pool"
    },
    {
      "title": "Wine Cellar",
      "description": "Private tastings and sommelier-led events in the estate cellar.",
      "icon": "wine"
    }
  ]'::jsonb,

  -- ── Nearby Experiences ───────────────────────────────────────────────────────
  true,

  '[
    {
      "title": "Kitzbühel Old Town",
      "description": "One of Europe''s most beautiful medieval Alpine towns — 5 minutes from the estate.",
      "distance": "5 min",
      "icon": "town"
    },
    {
      "title": "Hahnenkamm Ski Area",
      "description": "Ski-in ski-out access to the famous Hahnenkamm slope and 170+ km of pistes.",
      "distance": "Ski-in",
      "icon": "ski"
    },
    {
      "title": "Black See Lake",
      "description": "Mountain lake ideal for summer swimming, paddleboarding, and picnics.",
      "distance": "15 min",
      "icon": "lake"
    },
    {
      "title": "Innsbruck",
      "description": "Historic Tyrolean capital — accessible by helicopter in 12 minutes or road in 75 minutes.",
      "distance": "75 min",
      "icon": "city"
    },
    {
      "title": "Salzburg",
      "description": "Mozart''s birthplace and one of Europe''s most romantic cities — 90 min by road.",
      "distance": "90 min",
      "icon": "city"
    }
  ]'::jsonb,

  -- ── FAQ ──────────────────────────────────────────────────────────────────────
  true,
  'Frequently Asked Questions',
  'Everything you need to know about hosting your wedding at Grand Tirolia.',
  true,
  'Ready to Begin Planning?',
  'Our dedicated wedding team will respond within 24 hours.',
  'Send an Enquiry',

  '[
    {
      "category": "Capacity & Spaces",
      "questions": [
        {
          "question": "What is the maximum guest capacity at Grand Tirolia?",
          "answer": "The Grand Atrium accommodates up to 450 guests for a seated dinner. The Grand Ballroom holds 280 guests. For a combined cocktail reception across all spaces, Grand Tirolia can comfortably accommodate up to 600 guests."
        },
        {
          "question": "Can we hold both the ceremony and reception at Grand Tirolia?",
          "answer": "Yes. Grand Tirolia offers multiple ceremony locations — the Eichenheim Terrace for outdoor ceremonies, a private chapel, and the Grand Ballroom for indoor ceremonies. The reception and dinner then flow naturally into the Grand Atrium."
        },
        {
          "question": "Is exclusive use available?",
          "answer": "Yes. Grand Tirolia is available for full exclusive use — all 98 rooms and suites, five event spaces, and all dining concepts exclusively for your wedding party. Minimum three-night stay required. Please enquire for exclusive use pricing."
        }
      ]
    },
    {
      "category": "Accommodation",
      "questions": [
        {
          "question": "How many rooms are available for wedding guests?",
          "answer": "Grand Tirolia has 98 rooms and suites — including 12 suites with separate living rooms. The Grand Tirolia Suite at 320 m² is the ultimate bridal suite, with a private sauna, fireplace, and panoramic loggia."
        },
        {
          "question": "Is there a minimum room booking for weddings?",
          "answer": "For exclusive use bookings, a minimum of a 3-night stay applies. For partial buyouts, the estate team will advise on the minimum accommodation requirement based on your chosen spaces and dates."
        }
      ]
    },
    {
      "category": "Dining & Catering",
      "questions": [
        {
          "question": "Does Grand Tirolia handle all catering in-house?",
          "answer": "Yes. The estate has a fully in-house culinary team. Every wedding menu is designed exclusively for your day in collaboration with our executive chef. External catering is not required or permitted."
        },
        {
          "question": "Can dietary requirements be accommodated?",
          "answer": "Absolutely. Our culinary team accommodates all dietary requirements — vegetarian, vegan, gluten-free, dairy-free, nut-free, halal and kosher menus are available upon request with advance notice."
        }
      ]
    },
    {
      "category": "Planning & Coordination",
      "questions": [
        {
          "question": "Does Grand Tirolia provide a dedicated wedding coordinator?",
          "answer": "Yes. Every wedding booked at Grand Tirolia is assigned a dedicated Wedding Director who manages all planning from first enquiry to final farewell. Your Wedding Director is your single point of contact throughout."
        },
        {
          "question": "What is the booking timeline?",
          "answer": "We recommend enquiring at least 18 months in advance for summer and winter peak dates. However, last-minute bookings for shoulder season dates can occasionally be accommodated — please enquire."
        }
      ]
    }
  ]'::jsonb,

  -- ── SEO ──────────────────────────────────────────────────────────────────────
  'Grand Tirolia — Luxury Wedding Venue, Kitzbühel, Austria | Alpine Estate Weddings',
  'Grand Tirolia is Europe''s most celebrated Alpine wedding estate. 5 event spaces, 98 rooms, 2-Michelin-star dining & 3,000 m² spa. Perched above Kitzbühel, Tyrol, Austria. Exclusive use available.',

  '["Grand Tirolia", "Kitzbühel wedding venue", "Austria wedding venue", "Alpine wedding", "luxury wedding Austria", "Tyrol wedding", "exclusive use Austria", "mountain wedding venue Europe", "Grand Tirolia Kitzbühel", "wedding estate Austria", "Kitzbühel hotel wedding", "Alpine luxury wedding", "destination wedding Austria"]'::jsonb,

  -- ── Contact Profile ──────────────────────────────────────────────────────────
  '{
    "photo_url": "/grand-tirolia/GT_Logo_Positiv_RGB.jpg",
    "name": "Wedding Team",
    "title": "Wedding Director, Grand Tirolia",
    "bio": "Our dedicated wedding team has been crafting unforgettable Alpine celebrations since 1895. We respond to all enquiries within 24 hours.",
    "email": "weddings@grandtirolia.at",
    "phone": "+43 5356 6666",
    "whatsapp": "",
    "response_time": "Within 24 hours",
    "response_rate": "100%",
    "instagram": "@grandtirolia",
    "website": "https://www.grandtirolia.at"
  }'::jsonb,

  -- ── Publishing ───────────────────────────────────────────────────────────────
  'published',
  'public',
  NOW()

);

COMMIT;
