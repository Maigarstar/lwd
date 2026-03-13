-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED: Domaine des Etangs — Full Listing Record
-- Massignac · Charente · France · Auberge Collection
-- Mapped from DDE_VENUE data in DdeShowcasePage.jsx
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
  'Domaine des Etangs',
  'domaine-des-etangs',
  'wedding-venues',
  'france',

  -- ── Location ─────────────────────────────────────────────────────────────────
  'France',
  'Charente',
  'Massignac',
  'Le Bourg, 16310 Massignac, Charente, France',
  '16310',
  '45.7286',
  '0.4911',

  -- ── Core content ─────────────────────────────────────────────────────────────
  'A 13th-century château estate set within 2,500 private acres of lakes, forests, and sculpture-dotted parkland — one of the most extraordinary wedding destinations in France.',

  'Founded as a fortified residence by the Dukes of Aquitaine in the 13th century, Domaine des Etangs has evolved across seven hundred years — from aristocratic stronghold to wheat farm, from neglected ruin to one of France''s most celebrated private estates. The current neo-Gothic château was shaped in 1860 by the influence of architect Eugène Viollet-le-Duc.

After a transformative restoration under Garance Primat — who closed the property entirely in 2013 to reimagine it as a living work of art — the Domaine reopened in 2015 as a five-star hotel. Today it is managed by Auberge Collection, celebrated as Travel + Leisure''s No. 2 hotel in France.

Set within 1,000 hectares (2,500 acres) of private forests, meadows, lakes, and parkland, the estate is home to 29 rooms and cottages, a one-Michelin-star restaurant, an indoor pool and spa, a potager garden, and a rotating programme of site-specific art installations. With eight distinct event spaces — from a 200-guest castle courtyard to the intimate Octave Barn — Domaine des Etangs offers a wedding unlike anywhere else in France.',

  '200',
  'From €15,000',

  'Castle Courtyard · up to 200 guests, La Laiterie · up to 90 guests, Octave Barn · up to 90 guests, Dragon Barn · up to 50 guests, Castle Gardens · outdoor ceremonies, Château Rooms · intimate gatherings, 1 Michelin Star · Restaurant Dyades, Potager Garden · farm-to-table dining, Indoor Pool & Spa · year-round wellness, 2,500 Private Acres · forests lakes meadows, Art Installations · site-specific commissions, 29 Rooms & Cottages · inc. 6 farm cottages, Exclusive Use Available · entire estate, Chef''s Garden · seasonal produce, Auberge Collection · five-star management',

  -- ── Media ────────────────────────────────────────────────────────────────────
  -- hero_images
  '[
    {
      "url": "/Domaine-des-Etangs-Auberge-Collection/DDE_Exterior_Drone_2025_DJI_0745-HDR.jpg",
      "alt_text": "Domaine des Etangs aerial drone view, Massignac, Charente, France",
      "credit_camera": "",
      "copyright": "Domaine des Etangs / Auberge Collection",
      "show_credit": false,
      "type": "hero",
      "featured": true,
      "visibility": "public"
    }
  ]'::jsonb,

  -- media_items: full gallery
  '[
    {
      "id": "dde-01",
      "url": "/Domaine-des-Etangs-Auberge-Collection/DDE_Exterior_Drone_2025_DJI_0745-HDR.jpg",
      "alt_text": "Domaine des Etangs aerial drone view, Massignac, Charente, France",
      "title": "Aerial — Estate 2025",
      "credit_camera": "",
      "copyright": "Domaine des Etangs / Auberge Collection",
      "show_credit": false,
      "type": "hero",
      "featured": true,
      "visibility": "public",
      "sort_order": 1
    },
    {
      "id": "dde-02",
      "url": "/Domaine-des-Etangs-Auberge-Collection/DDE_Castle_Exteriors_2023_33.jpg",
      "alt_text": "The château façade at Domaine des Etangs",
      "title": "Château Façade",
      "credit_camera": "",
      "copyright": "Domaine des Etangs / Auberge Collection",
      "show_credit": false,
      "type": "exterior",
      "featured": true,
      "visibility": "public",
      "sort_order": 2
    },
    {
      "id": "dde-03",
      "url": "/Domaine-des-Etangs-Auberge-Collection/DDE_Exteriors_Drone_2023_24.jpg",
      "alt_text": "Domaine des Etangs drone aerial view of the estate and lakes",
      "title": "Estate Aerial — Lakes",
      "credit_camera": "",
      "copyright": "Domaine des Etangs / Auberge Collection",
      "show_credit": false,
      "type": "exterior",
      "featured": true,
      "visibility": "public",
      "sort_order": 3
    },
    {
      "id": "dde-04",
      "url": "/Domaine-des-Etangs-Auberge-Collection/DDE_Castle_Exteriors_2023_39 (1).jpg",
      "alt_text": "Domaine des Etangs château exterior and grounds",
      "title": "Château Exterior",
      "credit_camera": "",
      "copyright": "Domaine des Etangs / Auberge Collection",
      "show_credit": false,
      "type": "exterior",
      "featured": false,
      "visibility": "public",
      "sort_order": 4
    },
    {
      "id": "dde-05",
      "url": "/Domaine-des-Etangs-Auberge-Collection/Castle courtyard.jpg",
      "alt_text": "Castle courtyard garden at Domaine des Etangs",
      "title": "Castle Courtyard",
      "credit_camera": "",
      "copyright": "Domaine des Etangs / Auberge Collection",
      "show_credit": false,
      "type": "exterior",
      "featured": true,
      "visibility": "public",
      "sort_order": 5
    },
    {
      "id": "dde-06",
      "url": "/Domaine-des-Etangs-Auberge-Collection/Castle gardens.jpg",
      "alt_text": "Castle gardens at Domaine des Etangs",
      "title": "Castle Gardens",
      "credit_camera": "",
      "copyright": "Domaine des Etangs / Auberge Collection",
      "show_credit": false,
      "type": "exterior",
      "featured": false,
      "visibility": "public",
      "sort_order": 6
    },
    {
      "id": "dde-07",
      "url": "/Domaine-des-Etangs-Auberge-Collection/DDE_Events__Decoration-Setups_2023_Credit Manu Heslop (6).jpg",
      "alt_text": "La Laiterie wedding reception setup, Domaine des Etangs",
      "title": "La Laiterie — Reception",
      "credit_camera": "Manu Heslop",
      "copyright": "Domaine des Etangs / Auberge Collection",
      "show_credit": true,
      "type": "event_space",
      "featured": true,
      "visibility": "public",
      "sort_order": 7
    },
    {
      "id": "dde-08",
      "url": "/Domaine-des-Etangs-Auberge-Collection/DDE_Events__Decoration-Setups_2023_33.jpg",
      "alt_text": "Octave Barn wedding setup at Domaine des Etangs",
      "title": "Octave Barn — Setup",
      "credit_camera": "",
      "copyright": "Domaine des Etangs / Auberge Collection",
      "show_credit": false,
      "type": "event_space",
      "featured": true,
      "visibility": "public",
      "sort_order": 8
    },
    {
      "id": "dde-09",
      "url": "/Domaine-des-Etangs-Auberge-Collection/DDE_Events__Decoration-Setups_2023_Credit Manu Heslop (13).jpg",
      "alt_text": "Wedding decoration detail at Domaine des Etangs",
      "title": "Wedding Decoration",
      "credit_camera": "Manu Heslop",
      "copyright": "Domaine des Etangs / Auberge Collection",
      "show_credit": true,
      "type": "event_space",
      "featured": false,
      "visibility": "public",
      "sort_order": 9
    },
    {
      "id": "dde-10",
      "url": "/Domaine-des-Etangs-Auberge-Collection/DDE_Events__Decoration-Setups_2023_21.jpg",
      "alt_text": "Event decoration setup at Domaine des Etangs",
      "title": "Event Setup",
      "credit_camera": "",
      "copyright": "Domaine des Etangs / Auberge Collection",
      "show_credit": false,
      "type": "event_space",
      "featured": false,
      "visibility": "public",
      "sort_order": 10
    },
    {
      "id": "dde-11",
      "url": "/Domaine-des-Etangs-Auberge-Collection/Dragon farm cottage (3).jpg",
      "alt_text": "Dragon Barn farm cottage at Domaine des Etangs",
      "title": "Dragon Barn",
      "credit_camera": "",
      "copyright": "Domaine des Etangs / Auberge Collection",
      "show_credit": false,
      "type": "event_space",
      "featured": false,
      "visibility": "public",
      "sort_order": 11
    },
    {
      "id": "dde-12",
      "url": "/Domaine-des-Etangs-Auberge-Collection/Ceremony Domainedesetangs-1.jpg",
      "alt_text": "Outdoor ceremony at Domaine des Etangs",
      "title": "Outdoor Ceremony",
      "credit_camera": "",
      "copyright": "Domaine des Etangs / Auberge Collection",
      "show_credit": false,
      "type": "wedding",
      "featured": true,
      "visibility": "public",
      "sort_order": 12
    },
    {
      "id": "dde-13",
      "url": "/Domaine-des-Etangs-Auberge-Collection/Ceremony Domainedesetangs-5a.jpg",
      "alt_text": "Wedding ceremony at Domaine des Etangs, Charente",
      "title": "Ceremony — Garden",
      "credit_camera": "",
      "copyright": "Domaine des Etangs / Auberge Collection",
      "show_credit": false,
      "type": "wedding",
      "featured": false,
      "visibility": "public",
      "sort_order": 13
    },
    {
      "id": "dde-14",
      "url": "/Domaine-des-Etangs-Auberge-Collection/Ceremony Domainedesetangs-7a.jpg",
      "alt_text": "Ceremony at Domaine des Etangs",
      "title": "Ceremony — Aisle",
      "credit_camera": "",
      "copyright": "Domaine des Etangs / Auberge Collection",
      "show_credit": false,
      "type": "wedding",
      "featured": false,
      "visibility": "public",
      "sort_order": 14
    },
    {
      "id": "dde-15",
      "url": "/Domaine-des-Etangs-Auberge-Collection/Ceremony.jpg",
      "alt_text": "Wedding ceremony at Domaine des Etangs",
      "title": "Ceremony",
      "credit_camera": "",
      "copyright": "Domaine des Etangs / Auberge Collection",
      "show_credit": false,
      "type": "wedding",
      "featured": false,
      "visibility": "public",
      "sort_order": 15
    },
    {
      "id": "dde-16",
      "url": "/Domaine-des-Etangs-Auberge-Collection/Wedding-Credit Chloe Fayollas-260.jpg",
      "alt_text": "Wedding at Domaine des Etangs",
      "title": "Wedding — Hero",
      "credit_camera": "Chloe Fayollas",
      "copyright": "Chloe Fayollas / Domaine des Etangs",
      "show_credit": true,
      "type": "wedding",
      "featured": true,
      "visibility": "public",
      "sort_order": 16
    },
    {
      "id": "dde-17",
      "url": "/Domaine-des-Etangs-Auberge-Collection/wedding-Credit Chloe Fayollas-713.jpg",
      "alt_text": "Wedding detail at Domaine des Etangs, credit Chloe Fayollas",
      "title": "Wedding Detail",
      "credit_camera": "Chloe Fayollas",
      "copyright": "Chloe Fayollas / Domaine des Etangs",
      "show_credit": true,
      "type": "wedding",
      "featured": false,
      "visibility": "public",
      "sort_order": 17
    },
    {
      "id": "dde-18",
      "url": "/Domaine-des-Etangs-Auberge-Collection/wedding-Credit Chloe Fayollas-716.jpg",
      "alt_text": "Wedding moment at Domaine des Etangs",
      "title": "Wedding — Couple",
      "credit_camera": "Chloe Fayollas",
      "copyright": "Chloe Fayollas / Domaine des Etangs",
      "show_credit": true,
      "type": "wedding",
      "featured": false,
      "visibility": "public",
      "sort_order": 18
    },
    {
      "id": "dde-19",
      "url": "/Domaine-des-Etangs-Auberge-Collection/wedding-Credit Chloe Fayollas-720.jpg",
      "alt_text": "Wedding celebration at Domaine des Etangs",
      "title": "Wedding — Celebration",
      "credit_camera": "Chloe Fayollas",
      "copyright": "Chloe Fayollas / Domaine des Etangs",
      "show_credit": true,
      "type": "wedding",
      "featured": false,
      "visibility": "public",
      "sort_order": 19
    },
    {
      "id": "dde-20",
      "url": "/Domaine-des-Etangs-Auberge-Collection/Wedding long table.jpg",
      "alt_text": "Long wedding reception table at Domaine des Etangs",
      "title": "Wedding — Long Table",
      "credit_camera": "",
      "copyright": "Domaine des Etangs / Auberge Collection",
      "show_credit": false,
      "type": "wedding",
      "featured": true,
      "visibility": "public",
      "sort_order": 20
    },
    {
      "id": "dde-21",
      "url": "/Domaine-des-Etangs-Auberge-Collection/Honor table.jpg",
      "alt_text": "Wedding honour table setup at Domaine des Etangs",
      "title": "Wedding — Honour Table",
      "credit_camera": "",
      "copyright": "Domaine des Etangs / Auberge Collection",
      "show_credit": false,
      "type": "wedding",
      "featured": false,
      "visibility": "public",
      "sort_order": 21
    },
    {
      "id": "dde-22",
      "url": "/Domaine-des-Etangs-Auberge-Collection/DDE_Events_Birthday_Rose_CreditYannFalempin_2025_36.jpg",
      "alt_text": "Event celebration at Domaine des Etangs, 2025",
      "title": "Event — Rose Garden",
      "credit_camera": "Yann Falempin",
      "copyright": "Yann Falempin / Domaine des Etangs",
      "show_credit": true,
      "type": "wedding",
      "featured": false,
      "visibility": "public",
      "sort_order": 22
    },
    {
      "id": "dde-23",
      "url": "/Domaine-des-Etangs-Auberge-Collection/DDE_Events_Birthday_Rose_CreditYannFalempin_2025_38.jpg",
      "alt_text": "Celebration event at Domaine des Etangs, 2025",
      "title": "Event — Reception",
      "credit_camera": "Yann Falempin",
      "copyright": "Yann Falempin / Domaine des Etangs",
      "show_credit": true,
      "type": "wedding",
      "featured": false,
      "visibility": "public",
      "sort_order": 23
    },
    {
      "id": "dde-24",
      "url": "/Domaine-des-Etangs-Auberge-Collection/DDE_Dine_Dyades_YC-2019-Terrasse-Dyades-19.jpg",
      "alt_text": "Restaurant Dyades terrace at Domaine des Etangs, Michelin star dining",
      "title": "Restaurant Dyades — Terrace",
      "credit_camera": "",
      "copyright": "Domaine des Etangs / Auberge Collection",
      "show_credit": false,
      "type": "dining",
      "featured": true,
      "visibility": "public",
      "sort_order": 24
    },
    {
      "id": "dde-25",
      "url": "/Domaine-des-Etangs-Auberge-Collection/DDE_Events__Decoration-Setups_2023_40.jpg",
      "alt_text": "Dining setup at Domaine des Etangs",
      "title": "Dining — Event Setup",
      "credit_camera": "",
      "copyright": "Domaine des Etangs / Auberge Collection",
      "show_credit": false,
      "type": "dining",
      "featured": false,
      "visibility": "public",
      "sort_order": 25
    },
    {
      "id": "dde-26",
      "url": "/Domaine-des-Etangs-Auberge-Collection/DDE_Exteriors_Vegetable garden_lin-25.jpg",
      "alt_text": "Potager vegetable garden at Domaine des Etangs",
      "title": "Potager Garden",
      "credit_camera": "",
      "copyright": "Domaine des Etangs / Auberge Collection",
      "show_credit": false,
      "type": "dining",
      "featured": false,
      "visibility": "public",
      "sort_order": 26
    },
    {
      "id": "dde-27",
      "url": "/Domaine-des-Etangs-Auberge-Collection/Signature-Suite-Venus-6.jpg",
      "alt_text": "Signature Suite Vénus at Domaine des Etangs",
      "title": "Signature Suite Vénus",
      "credit_camera": "",
      "copyright": "Domaine des Etangs / Auberge Collection",
      "show_credit": false,
      "type": "room",
      "featured": true,
      "visibility": "public",
      "sort_order": 27
    },
    {
      "id": "dde-28",
      "url": "/Domaine-des-Etangs-Auberge-Collection/Prestige Suite Soleil (4).jpg",
      "alt_text": "Prestige Suite Soleil at Domaine des Etangs",
      "title": "Prestige Suite Soleil",
      "credit_camera": "",
      "copyright": "Domaine des Etangs / Auberge Collection",
      "show_credit": false,
      "type": "room",
      "featured": true,
      "visibility": "public",
      "sort_order": 28
    },
    {
      "id": "dde-29",
      "url": "/Domaine-des-Etangs-Auberge-Collection/Prestige room Saturne (6) (1).jpg",
      "alt_text": "Prestige Room Saturne at Domaine des Etangs",
      "title": "Prestige Room Saturne",
      "credit_camera": "",
      "copyright": "Domaine des Etangs / Auberge Collection",
      "show_credit": false,
      "type": "room",
      "featured": false,
      "visibility": "public",
      "sort_order": 29
    },
    {
      "id": "dde-30",
      "url": "/Domaine-des-Etangs-Auberge-Collection/Salon Famille.jpg",
      "alt_text": "Family lounge at Domaine des Etangs",
      "title": "Salon Famille",
      "credit_camera": "",
      "copyright": "Domaine des Etangs / Auberge Collection",
      "show_credit": false,
      "type": "room",
      "featured": false,
      "visibility": "public",
      "sort_order": 30
    },
    {
      "id": "dde-31",
      "url": "/Domaine-des-Etangs-Auberge-Collection/Pegase-farm-cottage.jpg",
      "alt_text": "Pégase farm cottage at Domaine des Etangs",
      "title": "Pégase Farm Cottage",
      "credit_camera": "",
      "copyright": "Domaine des Etangs / Auberge Collection",
      "show_credit": false,
      "type": "room",
      "featured": true,
      "visibility": "public",
      "sort_order": 31
    },
    {
      "id": "dde-32",
      "url": "/Domaine-des-Etangs-Auberge-Collection/Cottages-Pegase-Cassiopee.jpg",
      "alt_text": "Cottages Pégase and Cassiopée at Domaine des Etangs",
      "title": "Pégase & Cassiopée Cottages",
      "credit_camera": "Yorick Chassigneux",
      "copyright": "Yorick Chassigneux / Domaine des Etangs",
      "show_credit": true,
      "type": "room",
      "featured": false,
      "visibility": "public",
      "sort_order": 32
    },
    {
      "id": "dde-33",
      "url": "/Domaine-des-Etangs-Auberge-Collection/DDE_Longere_Exteriors_2023.jpg",
      "alt_text": "Longère exterior at Domaine des Etangs, 2023",
      "title": "La Longère",
      "credit_camera": "",
      "copyright": "Domaine des Etangs / Auberge Collection",
      "show_credit": false,
      "type": "room",
      "featured": false,
      "visibility": "public",
      "sort_order": 33
    },
    {
      "id": "dde-34",
      "url": "/Domaine-des-Etangs-Auberge-Collection/Indoor-pool-Yorrick.jpg",
      "alt_text": "Indoor pool at Domaine des Etangs, credit Yorrick Chassigneux",
      "title": "Indoor Pool",
      "credit_camera": "Yorick Chassigneux",
      "copyright": "Yorick Chassigneux / Domaine des Etangs",
      "show_credit": true,
      "type": "spa",
      "featured": true,
      "visibility": "public",
      "sort_order": 34
    },
    {
      "id": "dde-35",
      "url": "/Domaine-des-Etangs-Auberge-Collection/DDE_Art_Rondinone_Sun.jpg",
      "alt_text": "Ugo Rondinone Sun sculpture at Domaine des Etangs",
      "title": "Art — Rondinone Sun",
      "credit_camera": "Arthur Péquin",
      "copyright": "Arthur Péquin / Domaine des Etangs",
      "show_credit": true,
      "type": "activities",
      "featured": true,
      "visibility": "public",
      "sort_order": 35
    },
    {
      "id": "dde-36",
      "url": "/Domaine-des-Etangs-Auberge-Collection/DDE_Exteriors_Nature_2022_sol-37.jpg",
      "alt_text": "Natural parkland and lakes at Domaine des Etangs",
      "title": "Estate Parkland",
      "credit_camera": "",
      "copyright": "Domaine des Etangs / Auberge Collection",
      "show_credit": false,
      "type": "activities",
      "featured": false,
      "visibility": "public",
      "sort_order": 36
    }
  ]'::jsonb,

  'cinematic',
  'Domaine des Etangs · Massignac, Charente, France',
  '© Auberge Collection',

  -- ── Spaces ───────────────────────────────────────────────────────────────────
  '[
    {
      "id": "la-laiterie",
      "name": "La Laiterie",
      "image": "/Domaine-des-Etangs-Auberge-Collection/DDE_Events__Decoration-Setups_2023_Credit Manu Heslop (6).jpg",
      "description": "The jewel of the estate''s event spaces — a fully restored 19th-century dairy barn with original stone walls, exposed timber beams, and doors that open entirely onto the château gardens. Up to 90 guests seated for dinner, with a warm and utterly romantic atmosphere that no purpose-built venue can replicate.",
      "capacity_seated": 90,
      "capacity_standing": 120,
      "features": ["Original stone walls", "Exposed timber beams", "Garden access", "Fully restored interior"],
      "suitable_for": ["Dinner reception", "Ceremony", "Intimate gathering", "Cocktail reception"]
    },
    {
      "id": "octave-barn",
      "name": "Octave Barn",
      "image": "/Domaine-des-Etangs-Auberge-Collection/DDE_Events__Decoration-Setups_2023_33.jpg",
      "description": "A beautifully proportioned barn in the heart of the estate''s farmyard, with whitewashed walls and wooden beams creating a canvas of pure light. Seats up to 90 guests and flows easily into the courtyard for pre-dinner drinks.",
      "capacity_seated": 90,
      "capacity_standing": 110,
      "features": ["Whitewashed walls", "Natural light", "Courtyard access", "Farm setting"],
      "suitable_for": ["Dinner reception", "Cocktail reception", "Pre-dinner drinks"]
    },
    {
      "id": "dragon-barn",
      "name": "Dragon Barn",
      "image": "/Domaine-des-Etangs-Auberge-Collection/Dragon farm cottage (3).jpg",
      "description": "The most characterful of the estate''s spaces — a stone farm barn with vaulted ceilings and a wild, romantic character. Ideal for smaller wedding celebrations of up to 50 guests who want something genuinely unique.",
      "capacity_seated": 50,
      "capacity_standing": 70,
      "features": ["Vaulted stone ceilings", "Historic character", "Private location"],
      "suitable_for": ["Intimate dinner", "Ceremony", "Private party"]
    },
    {
      "id": "castle-courtyard",
      "name": "Castle Courtyard",
      "image": "/Domaine-des-Etangs-Auberge-Collection/Castle courtyard.jpg",
      "description": "The grand open courtyard at the heart of the château — framed by the neo-Gothic façade on one side and the estate parkland on the other. For outdoor ceremonies and large summer receptions of up to 200 guests, there is no more dramatic setting in southwest France.",
      "capacity_seated": 200,
      "capacity_standing": 300,
      "features": ["Open-air setting", "Château backdrop", "Estate parkland views", "Marquee-compatible"],
      "suitable_for": ["Outdoor ceremony", "Large reception", "Summer dinner", "Drinks reception"]
    },
    {
      "id": "castle-gardens",
      "name": "Castle Gardens",
      "image": "/Domaine-des-Etangs-Auberge-Collection/Castle gardens.jpg",
      "description": "Formal gardens surrounding the château, designed for outdoor ceremonies and champagne receptions. The manicured lawns, sculpted hedgerows, and views across the estate lakes make this the perfect setting for a summer ceremony.",
      "capacity_seated": 150,
      "capacity_standing": 200,
      "features": ["Formal gardens", "Lake views", "Ceremony-ready", "Champagne terrace"],
      "suitable_for": ["Outdoor ceremony", "Champagne reception", "Pre-dinner drinks"]
    },
    {
      "id": "chateau-rooms",
      "name": "Château Salons",
      "image": "/Domaine-des-Etangs-Auberge-Collection/DDE_Castle_Exteriors_2023_33.jpg",
      "description": "The château''s private reception rooms and grand salons, available for intimate ceremonies, pre-wedding gatherings, and morning-after brunches. Period details, fine art, and curated furnishings throughout.",
      "capacity_seated": 30,
      "capacity_standing": 50,
      "features": ["Period interiors", "Fine art", "Curated furnishings", "Private access"],
      "suitable_for": ["Intimate ceremony", "Pre-wedding gathering", "Morning-after brunch"]
    }
  ]'::jsonb,

  -- ── Rooms & Accommodation ────────────────────────────────────────────────────
  'hotel',
  '29',
  '6',
  '60',
  true,
  '2',

  'Twenty-nine rooms and cottages spanning the château, the restored farm buildings, and six freestanding cottages set within the estate parkland. From the extraordinary Signature Suite Vénus — with its private lake terrace — to the Pégase, Cassiopée, and Dragon farm cottages ideal for wedding parties, every room has been designed by Garance Primat as part of the Domaine''s living art vision. No two rooms are the same.',

  '[
    {
      "url": "/Domaine-des-Etangs-Auberge-Collection/Signature-Suite-Venus-6.jpg",
      "alt_text": "Signature Suite Vénus at Domaine des Etangs with private lake terrace",
      "caption": "Signature Suite Vénus · Private Lake Terrace"
    },
    {
      "url": "/Domaine-des-Etangs-Auberge-Collection/Prestige Suite Soleil (4).jpg",
      "alt_text": "Prestige Suite Soleil at Domaine des Etangs",
      "caption": "Prestige Suite Soleil"
    },
    {
      "url": "/Domaine-des-Etangs-Auberge-Collection/Prestige room Saturne (6) (1).jpg",
      "alt_text": "Prestige Room Saturne at Domaine des Etangs",
      "caption": "Prestige Room Saturne"
    },
    {
      "url": "/Domaine-des-Etangs-Auberge-Collection/Pegase-farm-cottage.jpg",
      "alt_text": "Pégase farm cottage at Domaine des Etangs",
      "caption": "Pégase Farm Cottage"
    },
    {
      "url": "/Domaine-des-Etangs-Auberge-Collection/Cottages-Pegase-Cassiopee.jpg",
      "alt_text": "Farm cottages at Domaine des Etangs",
      "caption": "Farm Cottages — Estate Grounds"
    },
    {
      "url": "/Domaine-des-Etangs-Auberge-Collection/DDE_Longere_Exteriors_2023.jpg",
      "alt_text": "La Longère exterior at Domaine des Etangs",
      "caption": "La Longère"
    }
  ]'::jsonb,

  -- ── Dining ───────────────────────────────────────────────────────────────────
  'One Michelin star restaurant, garden café, private dining',
  'Matthieu Pasgrimaud',
  true,
  false,

  '["Plated tasting menu", "Sharing feast", "Farm-to-table seasonal menu", "Garden terrace dinner", "Long table reception", "Canape reception", "Cocktail reception", "Private chef''s table", "Morning-after brunch"]'::jsonb,

  '["Vegetarian", "Vegan", "Gluten-free", "Dairy-free", "Nut-free", "Halal (on request)", "Kosher (on request)"]'::jsonb,

  '["Champagne", "Fine French wine", "Bordeaux selection", "Craft cocktails", "Non-alcoholic", "Open bar", "Digestifs", "Armagnac & Cognac", "Local spirits"]'::jsonb,

  'Restaurant Dyades — the estate''s one-Michelin-star restaurant — anchors the culinary experience at Domaine des Etangs. Chef Matthieu Pasgrimaud''s cooking is rooted in the estate''s own potager garden and the farms and producers of the Charente region. Every wedding menu is designed exclusively for your day. The estate''s team handles all catering — no outside suppliers required. The restaurant''s terrace overlooking the château gardens is available for private dinner hire.',

  '[
    {
      "url": "/Domaine-des-Etangs-Auberge-Collection/DDE_Dine_Dyades_YC-2019-Terrasse-Dyades-19.jpg",
      "alt_text": "Restaurant Dyades terrace at Domaine des Etangs"
    },
    {
      "url": "/Domaine-des-Etangs-Auberge-Collection/DDE_Events__Decoration-Setups_2023_40.jpg",
      "alt_text": "Dining table setup at Domaine des Etangs"
    },
    {
      "url": "/Domaine-des-Etangs-Auberge-Collection/DDE_Exteriors_Vegetable garden_lin-25.jpg",
      "alt_text": "Potager garden supplying Restaurant Dyades"
    }
  ]'::jsonb,

  -- ── Exclusive Use ────────────────────────────────────────────────────────────
  true,
  'Exclusive Use',
  'The entire estate, exclusively yours',
  'Domaine des Etangs is available for full exclusive use — all 29 rooms and cottages, six event spaces, Restaurant Dyades, the indoor pool and spa, the art collection, and 2,500 acres of private parkland — dedicated entirely to your wedding party. A minimum two-night stay applies.',
  'Enquire About Exclusive Use',

  '["All 29 rooms & cottages", "6 private event spaces", "Restaurant Dyades (1 Michelin star)", "Indoor pool & spa", "2,500 private acres", "Dedicated wedding team", "In-house culinary team", "Potager garden & farm produce", "Private art collection", "Full estate grounds & lakes", "Exclusive château access", "Personal estate manager"]'::jsonb,

  -- ── Wedding Weekend ──────────────────────────────────────────────────────────
  true,
  'A full estate wedding experience — arrival to farewell',

  '[
    {
      "day": "Day 1",
      "title": "Arrival & Welcome",
      "description": "Guests arrive by private transfer or helicopter to the Charente. Welcome apéritifs on the château terrace. Explore the estate — the lakes, the gardens, the art installations. Informal dinner at Restaurant Dyades or a private long-table in La Laiterie.",
      "icon": "arrival"
    },
    {
      "day": "Day 2",
      "title": "The Wedding Day",
      "description": "Morning at leisure — the gardens, the pool, the spa. Outdoor ceremony in the castle courtyard or gardens. Champagne reception on the terrace. Michelin-star dinner in La Laiterie or under the stars in the courtyard. Dancing until the early hours.",
      "icon": "wedding"
    },
    {
      "day": "Day 3",
      "title": "The Morning After",
      "description": "Champagne brunch in the château salons. Afternoon for estate exploration — kayaking on the lakes, cycling through the parkland, visiting the art installations. Early evening farewell drinks at the château.",
      "icon": "brunch"
    },
    {
      "day": "Day 4",
      "title": "Extended Stay",
      "description": "Day trips to Cognac, the Bordeaux vineyards, or the Atlantic coast. Private tastings at legendary Cognac houses. Truffle hunting in season. A final dinner at Restaurant Dyades.",
      "icon": "explore"
    }
  ]'::jsonb,

  -- ── On the Estate ────────────────────────────────────────────────────────────
  true,

  '[
    {
      "title": "Restaurant Dyades",
      "description": "One Michelin star. Chef Matthieu Pasgrimaud''s seasonal cuisine rooted in the estate''s own potager and the producers of the Charente.",
      "icon": "dining",
      "image": "/Domaine-des-Etangs-Auberge-Collection/DDE_Dine_Dyades_YC-2019-Terrasse-Dyades-19.jpg"
    },
    {
      "title": "Indoor Pool & Spa",
      "description": "A stunning indoor pool and wellness centre, available exclusively for guests of the estate.",
      "icon": "pool",
      "image": "/Domaine-des-Etangs-Auberge-Collection/Indoor-pool-Yorrick.jpg"
    },
    {
      "title": "Art Collection",
      "description": "Site-specific commissions and installations throughout the grounds — including works by Ugo Rondinone, Barthélémy Toguo, and international artists.",
      "icon": "art",
      "image": "/Domaine-des-Etangs-Auberge-Collection/DDE_Art_Rondinone_Sun.jpg"
    },
    {
      "title": "Potager Garden",
      "description": "A productive kitchen garden supplying Restaurant Dyades with seasonal vegetables, herbs, and flowers.",
      "icon": "garden",
      "image": "/Domaine-des-Etangs-Auberge-Collection/DDE_Exteriors_Vegetable garden_lin-25.jpg"
    },
    {
      "title": "Lakes & Parkland",
      "description": "2,500 acres of private forests, meadows, and lakes — available for walking, cycling, kayaking, and fishing.",
      "icon": "nature",
      "image": "/Domaine-des-Etangs-Auberge-Collection/DDE_Exteriors_Nature_2022_sol-37.jpg"
    },
    {
      "title": "Estate Cottages",
      "description": "Six restored farm cottages set within the parkland — perfect for wedding party accommodation with complete privacy.",
      "icon": "cottage"
    }
  ]'::jsonb,

  -- ── Nearby Experiences ───────────────────────────────────────────────────────
  true,

  '[
    {
      "title": "Cognac",
      "description": "Private tours and tastings at the great Cognac houses — Hennessy, Rémy Martin, Courvoisier — in the birthplace of Cognac.",
      "distance": "45 min",
      "icon": "wine"
    },
    {
      "title": "Bordeaux Vineyards",
      "description": "Saint-Émilion, Pomerol, and the Médoc — among the world''s most celebrated wine regions, easily accessible for a day trip.",
      "distance": "90 min",
      "icon": "wine"
    },
    {
      "title": "Atlantic Coast",
      "description": "The Charente coast and the Île de Ré — beautiful beaches, oyster beds, and Atlantic light.",
      "distance": "90 min",
      "icon": "beach"
    },
    {
      "title": "Angoulême",
      "description": "The historic capital of the Charente, famous for its medieval ramparts, the International Comics Festival, and fine dining.",
      "distance": "30 min",
      "icon": "town"
    },
    {
      "title": "Périgord & Dordogne",
      "description": "The prehistoric caves of Lascaux, the Bastide villages of the Dordogne, and the Périgord truffle country.",
      "distance": "60 min",
      "icon": "explore"
    }
  ]'::jsonb,

  -- ── FAQ ──────────────────────────────────────────────────────────────────────
  true,
  'Frequently Asked Questions',
  'Everything you need to know about hosting your wedding at Domaine des Etangs.',
  true,
  'Ready to Begin Planning?',
  'Our dedicated wedding team will respond within 24 hours.',
  'Send an Enquiry',

  '[
    {
      "category": "Capacity & Spaces",
      "questions": [
        {
          "question": "What is the maximum guest capacity at Domaine des Etangs?",
          "answer": "The castle courtyard accommodates up to 200 guests for an outdoor reception or seated dinner with a marquee. La Laiterie and Octave Barn each seat up to 90 guests. For a combined cocktail reception across multiple spaces, the estate can accommodate larger numbers."
        },
        {
          "question": "Can we hold both the ceremony and reception on the estate?",
          "answer": "Yes. Domaine des Etangs offers multiple ceremony locations — the castle courtyard and gardens for outdoor ceremonies, and La Laiterie or the château salons for indoor options. The reception and dinner then flow naturally through the estate''s spaces."
        },
        {
          "question": "Is exclusive use available?",
          "answer": "Yes. The entire estate — all 29 rooms and cottages, all six event spaces, Restaurant Dyades, and the full 2,500 acres — is available for full exclusive use. A minimum two-night stay applies. Please enquire for exclusive use pricing."
        }
      ]
    },
    {
      "category": "Accommodation",
      "questions": [
        {
          "question": "How many guests can stay on the estate?",
          "answer": "Domaine des Etangs has 29 rooms and cottages in total, sleeping approximately 60 guests. The six farm cottages — Pégase, Cassiopée, Dragon, and others — are particularly popular with wedding parties, offering complete privacy within the estate grounds."
        },
        {
          "question": "What is the minimum stay for weddings?",
          "answer": "For exclusive use bookings, a minimum two-night stay applies. For partial bookings, the wedding team will advise on the minimum accommodation requirement based on your chosen spaces and dates."
        }
      ]
    },
    {
      "category": "Dining & Catering",
      "questions": [
        {
          "question": "Does Domaine des Etangs handle all catering in-house?",
          "answer": "Yes. The estate has a fully in-house culinary team led by Chef Matthieu Pasgrimaud. Every wedding menu is designed exclusively for your day in collaboration with the chef. External catering is not required or permitted."
        },
        {
          "question": "Can dietary requirements be accommodated?",
          "answer": "Absolutely. Our culinary team accommodates all dietary requirements — vegetarian, vegan, gluten-free, dairy-free, nut-free, halal and kosher menus are available upon request with advance notice."
        },
        {
          "question": "Is Restaurant Dyades available for private hire?",
          "answer": "Yes. Restaurant Dyades, including its terrace overlooking the château gardens, is available for private dinner hire as part of your wedding weekend programme."
        }
      ]
    },
    {
      "category": "Planning & Coordination",
      "questions": [
        {
          "question": "Does Domaine des Etangs provide a dedicated wedding coordinator?",
          "answer": "Yes. Every wedding at Domaine des Etangs is managed by a dedicated wedding coordinator from your first enquiry through to the final farewell. Your coordinator is your single point of contact throughout the planning process."
        },
        {
          "question": "What is the booking timeline?",
          "answer": "We recommend enquiring at least 18 months in advance for summer dates. The estate hosts a limited number of weddings per year to ensure the highest quality of service. Please enquire as early as possible to check availability."
        },
        {
          "question": "Is the estate available for civil ceremonies?",
          "answer": "Domaine des Etangs can host blessing ceremonies and celebrations on the estate. For legally binding ceremonies in France, civil ceremonies must be held at the local Mairie (town hall) in Massignac, which is just minutes from the estate. Our team can assist with all arrangements."
        }
      ]
    }
  ]'::jsonb,

  -- ── SEO ──────────────────────────────────────────────────────────────────────
  'Domaine des Etangs — Luxury Wedding Venue, Charente, France | Estate Weddings',
  'Domaine des Etangs is a 13th-century château estate in Massignac, Charente. 6 event spaces, 29 rooms & cottages, 1 Michelin star restaurant & 2,500 private acres. Exclusive use available.',

  '["Domaine des Etangs", "Charente wedding venue", "France wedding venue", "French château wedding", "luxury wedding France", "Massignac wedding", "exclusive use France", "château wedding venue France", "Auberge Collection wedding", "Domaine des Etangs wedding", "southwest France wedding venue", "destination wedding France", "Charente luxury venue", "wedding estate France", "French country wedding"]'::jsonb,

  -- ── Contact Profile ──────────────────────────────────────────────────────────
  '{
    "photo_url": null,
    "name": "Wedding Team",
    "title": "Wedding Coordinator, Domaine des Etangs",
    "bio": "Our dedicated wedding team crafts exceptional celebrations on one of France''s most extraordinary private estates. We respond to all enquiries within 24 hours.",
    "email": "dde.commercial@auberge.com",
    "phone": "+33 5 45 61 93 66",
    "whatsapp": "",
    "response_time": "Within 24 hours",
    "response_rate": "100%",
    "instagram": "@domainedesetangs",
    "website": "https://www.domainedesetangs.com"
  }'::jsonb,

  -- ── Publishing ───────────────────────────────────────────────────────────────
  'published',
  'public',
  NOW()

);

COMMIT;
