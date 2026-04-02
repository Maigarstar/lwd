-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Seed legacy showcase venues into venue_showcases (DB-driven)
-- ═══════════════════════════════════════════════════════════════════════════
-- Migrates 5 hardcoded React showcase page components to the dynamic
-- ShowcaseRenderer system (published_sections JSONB → ShowcaseRenderer).
--
-- Venues migrated:
--   1. The Ritz London              /showcase/the-ritz-london
--   2. Six Senses Krabey Island     /showcase/six-senses-krabey-island
--   3. Domaine des Etangs           /showcase/domaine-des-etangs
--   4. InterContinental Park Lane   /showcase/intercontinental-london-park-lane
--   5. Grand Tirolia Kitzbühel      /showcase/grand-tirolia-kitzbuehel
--
-- After this migration:
--   - Remove hardcoded route interceptions from main.jsx (5 slug rules)
--   - Remove render cases for the 5 legacy page components
--   - ShowcasePage fetches from venue_showcases, ShowcaseRenderer handles all
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. THE RITZ LONDON
-- ─────────────────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM venue_showcases WHERE slug = 'the-ritz-london') THEN
  INSERT INTO venue_showcases (
    title, slug, type, status, location, excerpt,
    hero_image_url, key_stats, published_sections,
    published_at, sort_order, created_at, updated_at
  ) VALUES (
    'The Ritz London',
    'the-ritz-london',
    'venue',
    'published',
    'Mayfair, London',
    'Since 1906, the pinnacle of London luxury — where impeccable service, legendary afternoon tea and two Michelin stars define the art of the extraordinary.',
    'https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21069.jpg',
    $ritz_ks$[
      {"value":"136","label":"Rooms & Suites","sublabel":"Including seven grand suites"},
      {"value":"1906","label":"Established","sublabel":"118 years of tradition"},
      {"value":"★★","label":"Michelin Stars","sublabel":"The Ritz Restaurant"},
      {"value":"Royal","label":"Warrant","sublabel":"By Royal appointment"},
      {"value":"No.1","label":"Piccadilly","sublabel":"London's finest address"},
      {"value":"∞","label":"White Glove","sublabel":"Personal butler service"}
    ]$ritz_ks$::jsonb,
    $ritz_ps$[
      {
        "id": "ritz-hero",
        "type": "hero",
        "content": {
          "title": "The Ritz London",
          "eyebrow": "Mayfair · London · Est. 1906",
          "tagline": "Since 1906, the pinnacle of London luxury — where impeccable service, legendary afternoon tea and two Michelin stars define the art of the extraordinary.",
          "address": "150 Piccadilly · Mayfair · London",
          "image": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21069.jpg",
          "stats": [
            {"value": "136", "label": "Rooms & Suites"},
            {"value": "Since 1906", "label": "Est. Piccadilly"},
            {"value": "★★", "label": "Michelin Stars"},
            {"value": "Royal", "label": "Warrant"}
          ]
        },
        "layout": {}
      },
      {
        "id": "ritz-stats",
        "type": "stats",
        "content": {
          "eyebrow": "At a Glance",
          "items": [
            {"value": "136", "label": "Rooms & Suites", "sublabel": "Including seven grand suites"},
            {"value": "1906", "label": "Established", "sublabel": "118 years of tradition"},
            {"value": "★★", "label": "Michelin Stars", "sublabel": "The Ritz Restaurant"},
            {"value": "Royal", "label": "Warrant", "sublabel": "By Royal appointment"},
            {"value": "No.1", "label": "Piccadilly", "sublabel": "London's finest address"},
            {"value": "∞", "label": "White Glove", "sublabel": "Personal butler service"}
          ]
        },
        "layout": {"variant": "strip", "accentBg": "#1a1209"}
      },
      {
        "id": "ritz-intro",
        "type": "intro",
        "content": {
          "eyebrow": "The Ritz London",
          "headline": "London's Most Celebrated Address",
          "body": "Designed by Charles Mewès and Arthur Davis and opened by César Ritz on 24th May 1906, The Ritz London stands as one of the world's most legendary hotels — a living monument to the art of living well, where Louis XVI interiors, gilded colonnades, and sweeping views across Green Park remain as breathtaking today as the night it opened."
        },
        "layout": {"variant": "left-aligned", "accentBg": "#0f0e0c"}
      },
      {
        "id": "ritz-story",
        "type": "feature",
        "content": {
          "eyebrow": "The Ritz Story",
          "headline": "A Standard of Extraordinary",
          "body": "Holding the Royal Warrant by appointment to HRH The Prince of Wales, The Ritz London is not merely a hotel — it is a place where every guest is treated as royalty, every occasion elevated, and every detail a matter of honour. From the moment you step through the doors on Piccadilly, time slows. The Long Gallery stretches before you, dressed in hand-painted silk, antique marble, and gilded mirrors; the scent of fresh florals drifts from the Palm Court; and the white-gloved staff of four generations greet you by name.",
          "image": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21068.jpg"
        },
        "layout": {"variant": "image-right", "accentBg": "#1a1209"}
      },
      {
        "id": "ritz-gallery",
        "type": "gallery",
        "content": {
          "title": "Gallery",
          "images": [
            {"url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21069.jpg", "caption": "The Long Gallery"},
            {"url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21068.jpg", "caption": "Grand Staircase"},
            {"url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21070.jpg", "caption": "Suite"},
            {"url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21071.jpg", "caption": "Detail"},
            {"url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9418.jpg", "caption": "Interiors"},
            {"url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9420.jpg", "caption": "Rooms"},
            {"url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_6651.jpg", "caption": "Palm Court"},
            {"url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_7662.jpg", "caption": "Afternoon Tea"},
            {"url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9422.jpg", "caption": "Wedding Celebration"},
            {"url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9423.jpg", "caption": "Wedding Ceremony"},
            {"url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_1282.jpg", "caption": "Ballroom"},
            {"url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_999.jpg", "caption": "Exterior"}
          ]
        },
        "layout": {}
      },
      {
        "id": "ritz-weddings",
        "type": "weddings",
        "content": {
          "eyebrow": "Weddings at The Ritz",
          "headline": "Every Wedding is a Masterpiece",
          "body": "Every wedding at The Ritz is a masterpiece of discretion, elegance, and impeccable taste — created by London's most celebrated wedding team, in London's most celebrated hotel.",
          "image": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9422.jpg"
        },
        "layout": {"variant": "image-left"}
      },
      {
        "id": "ritz-dining",
        "type": "dining",
        "content": {
          "eyebrow": "Dining",
          "headline": "Two Michelin Stars & the World's Most Famous Afternoon Tea",
          "body": "Two Michelin stars, a world-famous afternoon tea, and the legendary Rivoli Bar — dining at The Ritz is as much a part of London's cultural life as the changing of the guard or a walk through Green Park.",
          "image": "https://www.theritzlondon.com/content/uploads/2023/03/The-Ritz-Restaurant-medium-res.avif"
        },
        "layout": {"variant": "image-right"}
      },
      {
        "id": "ritz-rooms",
        "type": "feature",
        "content": {
          "eyebrow": "Rooms & Suites",
          "headline": "136 Rooms of Extraordinary Refinement",
          "body": "136 rooms and suites, each a sanctuary of extraordinary refinement, dressed in silk damask and antique gold, with hand-painted ceilings, exquisite antiques, marble bathrooms of palatial proportions, and a personal butler in attendance at all times.",
          "image": "https://www.theritzlondon.com/content/uploads/2025/01/Deluxe-King.avif"
        },
        "layout": {"variant": "image-left", "accentBg": "#130f1e"}
      },
      {
        "id": "ritz-cta",
        "type": "cta",
        "content": {
          "headline": "Begin Your Story at The Ritz",
          "subline": "Our team will be in touch within 24 hours to discuss availability, exclusive packages, and everything your day deserves.",
          "background": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_14891.jpg"
        },
        "layout": {}
      }
    ]$ritz_ps$::jsonb,
    NOW(), 10, NOW(), NOW()
  );
END IF;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. SIX SENSES KRABEY ISLAND
-- ─────────────────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM venue_showcases WHERE slug = 'six-senses-krabey-island') THEN
  INSERT INTO venue_showcases (
    title, slug, type, status, location, excerpt,
    hero_image_url, key_stats, published_sections,
    published_at, sort_order, created_at, updated_at
  ) VALUES (
    'Six Senses Krabey Island',
    'six-senses-krabey-island',
    'venue',
    'published',
    'Preah Sihanouk Province, Cambodia',
    'A private island sanctuary where the Gulf of Thailand meets barefoot luxury — 40 overwater and beachfront villas, world-class wellness, and an extraordinary weddings programme.',
    '/Six-Senses-Krabey-Island/DJI_20240519072805_0089_D-Enhanced-NR.jpg',
    $ssk_ks$[
      {"value":"40","label":"Private Villas","sublabel":"Overwater & beachfront"},
      {"value":"100","label":"Max Guests","sublabel":"For celebrations"},
      {"value":"100%","label":"Private Island","sublabel":"Exclusively yours"},
      {"value":"5 km","label":"From Mainland","sublabel":"Preah Sihanouk"},
      {"value":"★","label":"Six Senses Spa","sublabel":"World-class wellness"},
      {"value":"∞","label":"Ocean Views","sublabel":"Gulf of Thailand"}
    ]$ssk_ks$::jsonb,
    $ssk_ps$[
      {
        "id": "ssk-hero",
        "type": "hero",
        "content": {
          "title": "Six Senses Krabey Island",
          "eyebrow": "Koh Krabey Island · Cambodia",
          "tagline": "A private island sanctuary where the Gulf of Thailand meets barefoot luxury.",
          "address": "Koh Krabey Island, Preah Sihanouk Province, Cambodia",
          "image": "/Six-Senses-Krabey-Island/DJI_20240519072805_0089_D-Enhanced-NR.jpg",
          "stats": [
            {"value": "40", "label": "Private Villas"},
            {"value": "100", "label": "Max Guests"},
            {"value": "Private", "label": "Island"},
            {"value": "5 km", "label": "From Mainland"}
          ]
        },
        "layout": {}
      },
      {
        "id": "ssk-stats",
        "type": "stats",
        "content": {
          "eyebrow": "At a Glance",
          "items": [
            {"value": "40", "label": "Private Villas", "sublabel": "Overwater & beachfront"},
            {"value": "100", "label": "Max Guests", "sublabel": "For celebrations"},
            {"value": "100%", "label": "Private Island", "sublabel": "Exclusively yours"},
            {"value": "5 km", "label": "From Mainland", "sublabel": "Preah Sihanouk"},
            {"value": "★", "label": "Six Senses Spa", "sublabel": "World-class wellness"},
            {"value": "∞", "label": "Ocean Views", "sublabel": "Gulf of Thailand"}
          ]
        },
        "layout": {"variant": "strip", "accentBg": "#0d1a1f"}
      },
      {
        "id": "ssk-intro",
        "type": "intro",
        "content": {
          "eyebrow": "Six Senses Krabey Island",
          "headline": "A Private Island Sanctuary in the Gulf of Thailand",
          "body": "Six Senses Krabey Island is Cambodia's most intimate resort, 40 overwater and beachfront villas set across a pristine private island, united by extraordinary wellness, farm-to-table dining, and an exceptional weddings programme."
        },
        "layout": {"variant": "left-aligned", "accentBg": "#0d1a1f"}
      },
      {
        "id": "ssk-story",
        "type": "feature",
        "content": {
          "eyebrow": "The Island Story",
          "headline": "An Island Transformed by Six Senses",
          "body": "Koh Krabey Island sits in the warm waters of the Gulf of Thailand, just 5 kilometres from the shores of Preah Sihanouk Province. Once an untouched stretch of jungle and beach, the island was reimagined by Six Senses as a place where nature and barefoot luxury could coexist. For weddings and celebrations, the island can be taken over completely, making it one of the most exclusive and unique wedding venues in Asia.",
          "image": "/Six-Senses-Krabey-Island/Aerial_view_of_the_Khmer_House_[8313-A4].jpg"
        },
        "layout": {"variant": "image-right", "accentBg": "#131c14"}
      },
      {
        "id": "ssk-gallery",
        "type": "gallery",
        "content": {
          "title": "Gallery",
          "images": [
            {"url": "/Six-Senses-Krabey-Island/Krabey_Island_aerial_view-4500x3006-8fa955b.jpg", "caption": "Aerial view of Krabey Island"},
            {"url": "/Six-Senses-Krabey-Island/Ocean_Pool_Villa_Suite_sunset_[7382-A4].jpg", "caption": "Ocean Pool Villa at sunset"},
            {"url": "/Six-Senses-Krabey-Island/Ocean_Pool_Villa_Suite2_[7375-A4].jpg", "caption": "Ocean Pool Villa"},
            {"url": "/Six-Senses-Krabey-Island/Private_Sundeck_of_Ocean_Pool_Villa_[8354-A4].jpg", "caption": "Private sundeck"},
            {"url": "/Six-Senses-Krabey-Island/Main_pool_[8371-A4].jpg", "caption": "Main pool"},
            {"url": "/Six-Senses-Krabey-Island/krabey-island-cambodia_Main_beach-4500x3000-4cf3e1a.jpg", "caption": "Main beach"},
            {"url": "/Six-Senses-Krabey-Island/Romantic_boardwalk_dinner_[8279-A4].jpg", "caption": "Private boardwalk dinner"},
            {"url": "/Six-Senses-Krabey-Island/AHA_Restaurant-Terrace_[8335-A4].jpg", "caption": "AHA Restaurant terrace"},
            {"url": "/Six-Senses-Krabey-Island/Yoga_on_the_Rocks_[8357-A4].jpg", "caption": "Yoga on the rocks"},
            {"url": "/Six-Senses-Krabey-Island/SixSensesKrabeyIslandSpa.jpg", "caption": "Six Senses Spa"},
            {"url": "/Six-Senses-Krabey-Island/6Z6A9594.jpg", "caption": "Wedding at Six Senses Krabey Island"},
            {"url": "/Six-Senses-Krabey-Island/6Z6A9599-Enhanced-NR.jpg", "caption": "Wedding ceremony"}
          ]
        },
        "layout": {}
      },
      {
        "id": "ssk-weddings",
        "type": "weddings",
        "content": {
          "eyebrow": "Weddings",
          "headline": "An Island to Yourself",
          "body": "Every wedding at Six Senses Krabey Island is an island to yourself — a completely private backdrop of ocean, jungle, and sky, shaped entirely by you.",
          "image": "/Six-Senses-Krabey-Island/6Z6A9594.jpg"
        },
        "layout": {"variant": "image-left"}
      },
      {
        "id": "ssk-dining",
        "type": "dining",
        "content": {
          "eyebrow": "Dining",
          "headline": "Farm-to-Table at the Edge of the Ocean",
          "body": "Chef-driven, produce-led menus rooted in Cambodian flavour, from barefoot beach dinners to candlelit tables in the jungle — every meal is shaped by the island around it.",
          "image": "/Six-Senses-Krabey-Island/AHA_Restaurant_[8343-A4].jpg"
        },
        "layout": {"variant": "image-right"}
      },
      {
        "id": "ssk-wellness",
        "type": "wellness",
        "content": {
          "eyebrow": "Wellness & Spa",
          "headline": "The Six Senses Philosophy of Longevity",
          "body": "The Six Senses Spa is built on the philosophy of longevity, combining ancient Cambodian healing traditions with cutting-edge biohacking and personalised wellness programmes.",
          "image": "/Six-Senses-Krabey-Island/SixSensesKrabeyIslandSpa.jpg"
        },
        "layout": {"variant": "image-left"}
      },
      {
        "id": "ssk-cta",
        "type": "cta",
        "content": {
          "headline": "Begin Your Island Wedding",
          "subline": "Our team will be in touch within 24 hours to discuss availability and exclusive wedding programmes.",
          "background": "/Six-Senses-Krabey-Island/Romantic_boardwalk_dinner_[8279-A4].jpg"
        },
        "layout": {}
      }
    ]$ssk_ps$::jsonb,
    NOW(), 20, NOW(), NOW()
  );
END IF;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. DOMAINE DES ETANGS
-- ─────────────────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM venue_showcases WHERE slug = 'domaine-des-etangs') THEN
  INSERT INTO venue_showcases (
    title, slug, type, status, location, excerpt,
    hero_image_url, key_stats, published_sections,
    published_at, sort_order, created_at, updated_at
  ) VALUES (
    'Domaine des Etangs',
    'domaine-des-etangs',
    'venue',
    'published',
    'Massignac, Charente, France',
    'A 13th-century château set within 1,000 hectares of private forests, lakes, meadows, and sculpture-dotted parkland — one of the most extraordinary estate wedding venues in France.',
    '/Domaine-des-Etangs-Auberge-Collection/DDE_Exterior_Drone_2025_DJI_0745-HDR.jpg',
    $dde_ks$[
      {"value":"13th C","label":"Origins","sublabel":"Charente, France"},
      {"value":"29","label":"Rooms","sublabel":"Inc. 6 cottages"},
      {"value":"200","label":"Max Capacity","sublabel":"Outdoor events"},
      {"value":"8+","label":"Event Spaces","sublabel":"Each distinct"},
      {"value":"2,500","label":"Private Acres","sublabel":"Lakes & forests"},
      {"value":"★ 1","label":"Michelin Star","sublabel":"Restaurant Dyades"}
    ]$dde_ks$::jsonb,
    $dde_ps$[
      {
        "id": "dde-hero",
        "type": "hero",
        "content": {
          "title": "Domaine des Etangs",
          "eyebrow": "Massignac · Charente · France",
          "tagline": "Where art, nature and French country elegance converge.",
          "address": "Le Bourg, 16310 Massignac, Charente, France",
          "image": "/Domaine-des-Etangs-Auberge-Collection/DDE_Exterior_Drone_2025_DJI_0745-HDR.jpg",
          "stats": [
            {"value": "13th C", "label": "Origins"},
            {"value": "2,500", "label": "Private Acres"},
            {"value": "200", "label": "Max Guests"},
            {"value": "★ 1", "label": "Michelin Star"}
          ]
        },
        "layout": {}
      },
      {
        "id": "dde-stats",
        "type": "stats",
        "content": {
          "eyebrow": "At a Glance",
          "items": [
            {"value": "13th C", "label": "Origins", "sublabel": "Charente, France"},
            {"value": "29", "label": "Rooms", "sublabel": "Inc. 6 cottages"},
            {"value": "200", "label": "Max Capacity", "sublabel": "Outdoor events"},
            {"value": "8+", "label": "Event Spaces", "sublabel": "Each distinct"},
            {"value": "2,500", "label": "Private Acres", "sublabel": "Lakes & forests"},
            {"value": "★ 1", "label": "Michelin Star", "sublabel": "Restaurant Dyades"}
          ]
        },
        "layout": {"variant": "strip", "accentBg": "#1c2318"}
      },
      {
        "id": "dde-intro",
        "type": "intro",
        "content": {
          "eyebrow": "Domaine des Etangs",
          "headline": "2,500 Acres of Art, Lakes & French Country Elegance",
          "body": "A 13th-century château set within 1,000 hectares of private forests, lakes, meadows, and sculpture-dotted parkland — one of the most extraordinary estate wedding venues in France, managed by Auberge Collection and celebrated as Travel + Leisure's No. 2 hotel in France."
        },
        "layout": {"variant": "left-aligned", "accentBg": "#1c2318"}
      },
      {
        "id": "dde-story",
        "type": "feature",
        "content": {
          "eyebrow": "The Domaine Story",
          "headline": "From Medieval Fortification to Living Art Estate",
          "body": "Founded as a fortified residence by the Dukes of Aquitaine in the 13th century, Domaine des Etangs has evolved across seven hundred years — from aristocratic stronghold to wheat farm, from neglected ruin to one of France's most celebrated private estates. After a transformative restoration under Garance Primat, the Domaine reopened in 2015 as a five-star hotel, a living work of art set across 2,500 private acres.",
          "image": "/Domaine-des-Etangs-Auberge-Collection/DDE_Exteriors_Drone_2023_24.jpg"
        },
        "layout": {"variant": "image-right", "accentBg": "#1c2318"}
      },
      {
        "id": "dde-gallery",
        "type": "gallery",
        "content": {
          "title": "Gallery",
          "images": [
            {"url": "/Domaine-des-Etangs-Auberge-Collection/DDE_Exterior_Drone_2025_DJI_0745-HDR.jpg", "caption": "Aerial view of the Domaine"},
            {"url": "/Domaine-des-Etangs-Auberge-Collection/DDE_Castle_Exteriors_2023_33.jpg", "caption": "The château façade"},
            {"url": "/Domaine-des-Etangs-Auberge-Collection/Ceremony Domainedesetangs-1.jpg", "caption": "Outdoor ceremony"},
            {"url": "/Domaine-des-Etangs-Auberge-Collection/Wedding long table.jpg", "caption": "Long wedding reception table"},
            {"url": "/Domaine-des-Etangs-Auberge-Collection/Castle courtyard.jpg", "caption": "Castle courtyard"},
            {"url": "/Domaine-des-Etangs-Auberge-Collection/Signature-Suite-Venus-6.jpg", "caption": "Signature Vénus Suite"},
            {"url": "/Domaine-des-Etangs-Auberge-Collection/DDE_Dine_Dyades_YC-2019-Terrasse-Dyades-19.jpg", "caption": "Restaurant Dyades terrace"},
            {"url": "/Domaine-des-Etangs-Auberge-Collection/Wedding-Credit Chloe Fayollas-260.jpg", "caption": "Wedding at the Domaine"},
            {"url": "/Domaine-des-Etangs-Auberge-Collection/DDE_Art_Rondinone_Sun.jpg", "caption": "Contemporary art installation"},
            {"url": "/Domaine-des-Etangs-Auberge-Collection/Indoor-pool-Yorrick.jpg", "caption": "Indoor pool"},
            {"url": "/Domaine-des-Etangs-Auberge-Collection/Pegase-farm-cottage.jpg", "caption": "Pégase farm cottage"},
            {"url": "/Domaine-des-Etangs-Auberge-Collection/Castle gardens.jpg", "caption": "Castle gardens"}
          ]
        },
        "layout": {}
      },
      {
        "id": "dde-spaces",
        "type": "spaces",
        "content": {
          "eyebrow": "Event Spaces",
          "headline": "Eight Distinct Spaces, Each with Centuries of Character",
          "body": "From an intimate lakeside chapel to a 200 m² stone barn, each space at Domaine des Etangs carries centuries of character, and a contemporary soul.",
          "image": "/Domaine-des-Etangs-Auberge-Collection/DDE_Events__Decoration-Setups_2023_Credit Manu Heslop (6).jpg"
        },
        "layout": {"variant": "image-left"}
      },
      {
        "id": "dde-weddings",
        "type": "weddings",
        "content": {
          "eyebrow": "Weddings",
          "headline": "Entirely Unique, Shaped by Your Story",
          "body": "Every wedding at Domaine des Etangs is designed to feel entirely unique — shaped by your story, your guests, and the landscape itself.",
          "image": "/Domaine-des-Etangs-Auberge-Collection/Wedding-Credit Chloe Fayollas-260.jpg"
        },
        "layout": {"variant": "image-right"}
      },
      {
        "id": "dde-dining",
        "type": "dining",
        "content": {
          "eyebrow": "Dining",
          "headline": "One Michelin Star, Rooted in the Seasons of Charente",
          "body": "Chef Matthieu Pasgrimaud builds every menu around the Domaine's own organic kitchen garden — inventive, terroir-driven, and rooted in the seasons of Charente.",
          "image": "/Domaine-des-Etangs-Auberge-Collection/DDE_Dine_Dyades_YC-2019-Terrasse-Dyades-19.jpg"
        },
        "layout": {"variant": "image-left"}
      },
      {
        "id": "dde-cta",
        "type": "cta",
        "content": {
          "headline": "Begin Your Story at Domaine des Etangs",
          "subline": "Our team will be in touch within 24 hours to discuss your vision for an extraordinary celebration in the heart of Charente.",
          "background": "/Domaine-des-Etangs-Auberge-Collection/DDE_Exterior_Drone_2025_DJI_0745-HDR.jpg"
        },
        "layout": {}
      }
    ]$dde_ps$::jsonb,
    NOW(), 30, NOW(), NOW()
  );
END IF;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. INTERCONTINENTAL LONDON PARK LANE
-- ─────────────────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM venue_showcases WHERE slug = 'intercontinental-london-park-lane') THEN
  INSERT INTO venue_showcases (
    title, slug, type, status, location, excerpt,
    hero_image_url, key_stats, published_sections,
    published_at, sort_order, created_at, updated_at
  ) VALUES (
    'InterContinental London Park Lane',
    'intercontinental-london-park-lane',
    'venue',
    'published',
    'Hyde Park Corner, London',
    'At Hyde Park Corner, where Mayfair meets the Royal parks — 447 rooms, London''s grandest ballroom, and Michelin-starred dining at the heart of the capital''s most storied address.',
    '/parklane.intercontinental/sitemgr_photo_23363.jpg',
    $ic_ks$[
      {"value":"447","label":"Rooms & Suites","sublabel":"Including suites with Hyde Park views"},
      {"value":"5","label":"Event Spaces","sublabel":"Ballroom to intimate suites"},
      {"value":"800","label":"Ballroom Capacity","sublabel":"Largest private hotel ballroom"},
      {"value":"★","label":"Michelin Star","sublabel":"Theo Randall at The InterContinental"},
      {"value":"Hyde Park","label":"Corner","sublabel":"London's most storied address"},
      {"value":"24hr","label":"Concierge","sublabel":"Club InterContinental included"}
    ]$ic_ks$::jsonb,
    $ic_ps$[
      {
        "id": "ic-hero",
        "type": "hero",
        "content": {
          "title": "InterContinental London Park Lane",
          "eyebrow": "Hyde Park Corner · Mayfair · London",
          "tagline": "At Hyde Park Corner, where Mayfair meets the Royal parks — 447 rooms, London's grandest ballroom, and Michelin-starred dining.",
          "address": "One Hamilton Place, Hyde Park Corner, London W1J 7QY",
          "image": "/parklane.intercontinental/sitemgr_photo_23363.jpg",
          "stats": [
            {"value": "447", "label": "Rooms & Suites"},
            {"value": "5", "label": "Event Spaces"},
            {"value": "800", "label": "Ballroom Guests"},
            {"value": "Michelin", "label": "Starred Dining"}
          ]
        },
        "layout": {}
      },
      {
        "id": "ic-stats",
        "type": "stats",
        "content": {
          "eyebrow": "At a Glance",
          "items": [
            {"value": "447", "label": "Rooms & Suites", "sublabel": "Including suites with Hyde Park views"},
            {"value": "5", "label": "Event Spaces", "sublabel": "Ballroom to intimate suites"},
            {"value": "800", "label": "Ballroom Capacity", "sublabel": "Largest private hotel ballroom"},
            {"value": "★", "label": "Michelin Star", "sublabel": "Theo Randall at The InterContinental"},
            {"value": "Hyde Park", "label": "Corner", "sublabel": "London's most storied address"},
            {"value": "24hr", "label": "Concierge", "sublabel": "Club InterContinental included"}
          ]
        },
        "layout": {"variant": "strip", "accentBg": "#0C1628"}
      },
      {
        "id": "ic-intro",
        "type": "intro",
        "content": {
          "eyebrow": "InterContinental London Park Lane",
          "headline": "Where Hyde Park Meets Mayfair",
          "body": "InterContinental London Park Lane stands at Hyde Park Corner — one of the capital's most symbolic addresses — where 447 rooms and suites, celebrated dining at the Michelin-starred Theo Randall, and London's most magnificent private ballroom define a hotel of authentic grandeur and contemporary refinement."
        },
        "layout": {"variant": "left-aligned", "accentBg": "#0C1628"}
      },
      {
        "id": "ic-story",
        "type": "feature",
        "content": {
          "eyebrow": "The IC Park Lane Story",
          "headline": "A City Address Without Equal",
          "body": "To stay at InterContinental London Park Lane is to occupy one of the capital's most storied corners — One Hamilton Place, where the arc of Mayfair meets the green expanse of Hyde Park and the ceremonial sweep of Constitution Hill. From your room, the Wellington Arch frames the view; the hotel's 447 rooms and suites, Michelin-starred Italian at Theo Randall, and the personal attention of Club InterContinental each speak of an establishment that understands London as intimately as it understands luxury.",
          "image": "/parklane.intercontinental/sitemgr_photo_23362.jpg"
        },
        "layout": {"variant": "image-right", "accentBg": "#070E1C"}
      },
      {
        "id": "ic-gallery",
        "type": "gallery",
        "content": {
          "title": "Gallery",
          "images": [
            {"url": "/parklane.intercontinental/sitemgr_photo_23363.jpg", "caption": "InterContinental London Park Lane"},
            {"url": "/parklane.intercontinental/sitemgr_photo_23364.jpg", "caption": "The Ballroom"},
            {"url": "/parklane.intercontinental/sitemgr_photo_23365.jpg", "caption": "Event setup"},
            {"url": "/parklane.intercontinental/sitemgr_photo_23366.jpg", "caption": "Suite"},
            {"url": "/parklane.intercontinental/sitemgr_photo_23367.jpg", "caption": "Room detail"},
            {"url": "/parklane.intercontinental/sitemgr_photo_23368.jpg", "caption": "Dining"},
            {"url": "/parklane.intercontinental/sitemgr_photo_23369.jpg", "caption": "Hyde Park Terrace"},
            {"url": "/parklane.intercontinental/sitemgr_photo_23370.jpg", "caption": "Burlington Suite"},
            {"url": "/parklane.intercontinental/sitemgr_photo_23372.jpg", "caption": "Wedding reception"},
            {"url": "/parklane.intercontinental/sitemgr_photo_23373.jpg", "caption": "Ballroom table setting"},
            {"url": "/parklane.intercontinental/sitemgr_photo_23374.jpg", "caption": "Wedding florals"},
            {"url": "/parklane.intercontinental/sitemgr_photo_23375.jpg", "caption": "Lobby"}
          ]
        },
        "layout": {}
      },
      {
        "id": "ic-weddings",
        "type": "weddings",
        "content": {
          "eyebrow": "Weddings",
          "headline": "London's Grandest Hotel Ballroom",
          "body": "800 guests, five event spaces, a dedicated wedding team, and a Michelin-starred kitchen — at One Hamilton Place, the most significant address in the capital for celebrations of extraordinary scale and ambition.",
          "image": "/parklane.intercontinental/sitemgr_photo_23364.jpg"
        },
        "layout": {"variant": "image-left"}
      },
      {
        "id": "ic-dining",
        "type": "dining",
        "content": {
          "eyebrow": "Dining",
          "headline": "Theo Randall at The InterContinental",
          "body": "Theo Randall at The InterContinental — the Michelin-starred Italian that has defined the restaurant since 2006 — alongside Chez Marie brasserie, The Bar, and the seasonal Hyde Park Terrace: four distinct moods for every occasion.",
          "image": "/parklane.intercontinental/sitemgr_photo_23368.jpg"
        },
        "layout": {"variant": "image-right"}
      },
      {
        "id": "ic-rooms",
        "type": "feature",
        "content": {
          "eyebrow": "Rooms & Suites",
          "headline": "447 Rooms Designed for the Discerning Traveller",
          "body": "From Deluxe King rooms with park and city aspects to the sweeping Hamilton Suite on the upper floors — each room designed for the discerning traveller who expects Hyde Park views, Club InterContinental privileges, and a level of personal attention that distinguishes the truly exceptional.",
          "image": "/parklane.intercontinental/sitemgr_photo_23366.jpg"
        },
        "layout": {"variant": "image-left", "accentBg": "#070E1C"}
      },
      {
        "id": "ic-cta",
        "type": "cta",
        "content": {
          "headline": "Begin Your Story at IC Park Lane",
          "subline": "Our dedicated weddings team will be in touch within 24 hours to discuss your vision for an extraordinary celebration.",
          "background": "/parklane.intercontinental/sitemgr_photo_23363.jpg"
        },
        "layout": {}
      }
    ]$ic_ps$::jsonb,
    NOW(), 40, NOW(), NOW()
  );
END IF;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. GRAND TIROLIA KITZBÜHEL
-- ─────────────────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM venue_showcases WHERE slug = 'grand-tirolia-kitzbuehel') THEN
  INSERT INTO venue_showcases (
    title, slug, type, status, location, excerpt,
    hero_image_url, key_stats, published_sections,
    published_at, sort_order, created_at, updated_at
  ) VALUES (
    'Grand Tirolia Kitzbühel',
    'grand-tirolia-kitzbuehel',
    'venue',
    'published',
    'Kitzbühel, Tyrol, Austria',
    'Alpine luxury at its pinnacle — a five-star retreat in Kitzbühel where world-class skiing, the Eichenheim golf course, and intimate mountain celebrations define extraordinary.',
    '/grand-tirolia/20250820_GTK_DJI_0382-HDR.jpg',
    $gt_ks$[
      {"value":"5★","label":"Alpine Hotel","sublabel":"Kitzbühel, Tyrol"},
      {"value":"Ski-In","label":"Ski-Out","sublabel":"Direct piste access"},
      {"value":"Golf","label":"Eichenheim","sublabel":"Signature 18-hole course"},
      {"value":"Spa","label":"Alpine Wellness","sublabel":"Panoramic mountain spa"},
      {"value":"250","label":"Max Guests","sublabel":"For private celebrations"},
      {"value":"Year","label":"Round","sublabel":"Winter & summer seasons"}
    ]$gt_ks$::jsonb,
    $gt_ps$[
      {
        "id": "gt-hero",
        "type": "hero",
        "content": {
          "title": "Grand Tirolia Kitzbühel",
          "eyebrow": "Kitzbühel · Tyrol · Austria",
          "tagline": "Alpine luxury at its pinnacle — five-star refinement, world-class skiing, and unforgettable mountain celebrations in the heart of Kitzbühel.",
          "address": "Eichenheim 1, 6370 Kitzbühel, Tyrol, Austria",
          "image": "/grand-tirolia/20250820_GTK_DJI_0382-HDR.jpg",
          "stats": [
            {"value": "5★", "label": "Alpine Hotel"},
            {"value": "Ski-In", "label": "Ski-Out"},
            {"value": "Golf", "label": "Eichenheim"},
            {"value": "Spa", "label": "Wellness"}
          ]
        },
        "layout": {}
      },
      {
        "id": "gt-stats",
        "type": "stats",
        "content": {
          "eyebrow": "At a Glance",
          "items": [
            {"value": "5★", "label": "Alpine Hotel", "sublabel": "Kitzbühel, Tyrol"},
            {"value": "Ski-In", "label": "Ski-Out", "sublabel": "Direct piste access"},
            {"value": "Golf", "label": "Eichenheim", "sublabel": "Signature 18-hole course"},
            {"value": "Spa", "label": "Alpine Wellness", "sublabel": "Panoramic mountain spa"},
            {"value": "250", "label": "Max Guests", "sublabel": "For private celebrations"},
            {"value": "Year", "label": "Round", "sublabel": "Winter & summer seasons"}
          ]
        },
        "layout": {"variant": "strip", "accentBg": "#1a1209"}
      },
      {
        "id": "gt-intro",
        "type": "intro",
        "content": {
          "eyebrow": "Grand Tirolia Kitzbühel",
          "headline": "The Heart of Alpine Luxury",
          "body": "Perched above Kitzbühel with direct piste access and panoramic views of the Tyrolean Alps, Grand Tirolia is Austria's finest mountain retreat — a place where five-star comfort, celebrated dining, and the drama of the Alps create the perfect backdrop for intimate celebrations and private events."
        },
        "layout": {"variant": "left-aligned", "accentBg": "#1a1209"}
      },
      {
        "id": "gt-story",
        "type": "feature",
        "content": {
          "eyebrow": "Alpine Elegance",
          "headline": "Where Every Season is Extraordinary",
          "body": "Whether blanketed in winter snow or bathed in summer sun across the Eichenheim golf course, Grand Tirolia offers an unparalleled setting for weddings and private events. The hotel's atrium, restaurant, and celebration spaces create a seamless canvas for moments that last a lifetime.",
          "image": "/grand-tirolia/Atrium_2024.jpg"
        },
        "layout": {"variant": "image-right", "accentBg": "#1a1209"}
      },
      {
        "id": "gt-gallery",
        "type": "gallery",
        "content": {
          "title": "Gallery",
          "images": [
            {"url": "/grand-tirolia/20250820_GTK_DJI_0382-HDR.jpg", "caption": "Grand Tirolia from above"},
            {"url": "/grand-tirolia/GT-Aussenansicht-Winter-097.jpg", "caption": "Exterior — winter"},
            {"url": "/grand-tirolia/GT_Winter_Exterior_2026.jpg", "caption": "Winter exterior"},
            {"url": "/grand-tirolia/Atrium_2024.jpg", "caption": "The Atrium"},
            {"url": "/grand-tirolia/GT_Lobby_2023.jpg", "caption": "Lobby"},
            {"url": "/grand-tirolia/GTK-Gala_A7_00720-min.jpg", "caption": "Gala celebration"},
            {"url": "/grand-tirolia/GTK-Gala_A7_00729.jpg", "caption": "Private dinner"},
            {"url": "/grand-tirolia/GT_Juli_2023_Restaurant_Food_17.jpg", "caption": "Restaurant dining"},
            {"url": "/grand-tirolia/GrandTirolia_DeluxeZimmer_Balkon_Terrasse.jpg", "caption": "Deluxe room with balcony"},
            {"url": "/grand-tirolia/GolfEichenheim_IndianSummer.jpg", "caption": "Eichenheim Golf Course"},
            {"url": "/grand-tirolia/GT-Eichenheim-Terrasse-012.jpg", "caption": "Eichenheim Terrace"},
            {"url": "/grand-tirolia/Grand_Tirolia_Cooper_Bar.jpg", "caption": "Cooper Bar"}
          ]
        },
        "layout": {}
      },
      {
        "id": "gt-weddings",
        "type": "weddings",
        "content": {
          "eyebrow": "Weddings & Celebrations",
          "headline": "An Alpine Backdrop Like No Other",
          "body": "From intimate ceremonies in the atrium to grand celebrations with panoramic mountain views, Grand Tirolia's dedicated events team brings unparalleled expertise to every occasion.",
          "image": "/grand-tirolia/GTK-Gala_A7_00720-min.jpg"
        },
        "layout": {"variant": "image-left"}
      },
      {
        "id": "gt-dining",
        "type": "dining",
        "content": {
          "eyebrow": "Dining",
          "headline": "Alpine Cuisine at Altitude",
          "body": "From the signature restaurant serving refined Tyrolean cuisine with panoramic mountain views to the intimate Cooper Bar — every culinary moment at Grand Tirolia is crafted with the precision and passion the Alps inspire.",
          "image": "/grand-tirolia/GT_Juli_2023_Restaurant_Food_17.jpg"
        },
        "layout": {"variant": "image-right"}
      },
      {
        "id": "gt-cta",
        "type": "cta",
        "content": {
          "headline": "Begin Your Alpine Story",
          "subline": "Our team will be in touch within 24 hours to discuss your vision for an extraordinary celebration in the heart of Kitzbühel.",
          "background": "/grand-tirolia/20250819_GTK_DJI_0314.jpg"
        },
        "layout": {}
      }
    ]$gt_ps$::jsonb,
    NOW(), 50, NOW(), NOW()
  );
END IF;

END $$;
