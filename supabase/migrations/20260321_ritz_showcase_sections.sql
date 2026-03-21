-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: ritz_showcase_sections
-- Replaces placeholder Unsplash sections with full editorial sections JSON.
-- After this runs, /showcase/the-ritz-london is fully DB-driven via ShowcaseRenderer.
-- The static RitzLondonShowcasePage.jsx route can then be removed from main.jsx.
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE venue_showcases
SET
  hero_image_url = 'https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21069.jpg',

  theme = '{
    "mode": "light",
    "bg": "#faf9f6",
    "bg2": "#f5f0e8",
    "bg3": "#ede5d8",
    "accent": "#C4A35A",
    "text": "#1a1410",
    "muted": "rgba(26,20,16,0.55)",
    "label": "#C4A35A",
    "navBg": "rgba(250,249,246,0.97)",
    "navBorder": "rgba(196,163,90,0.18)",
    "navText": "rgba(26,20,16,0.42)",
    "navActive": "#C4A35A",
    "heroOverlayOpacity": 0.50
  }'::jsonb,

  sections = '[
    {
      "id": "ritz-hero",
      "type": "hero",
      "content": {
        "title": "The Ritz London",
        "tagline": "150 Piccadilly · Mayfair · London · Est. 1906",
        "image": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21069.jpg",
        "overlay_opacity": 0.50
      },
      "layout": {}
    },
    {
      "id": "ritz-gallery",
      "type": "gallery",
      "content": {
        "title": "The Ritz London",
        "images": [
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21069.jpg", "caption": "The Long Gallery" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21068.jpg", "caption": "Grand staircase" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21059.jpg", "caption": "Interior" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21070.jpg", "caption": "Suite" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21071.jpg", "caption": "Detail" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9418.jpg",  "caption": "Gallery" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9420.jpg",  "caption": "Rooms" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9421.jpg",  "caption": "Dining" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9422.jpg",  "caption": "Celebration" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9423.jpg",  "caption": "Wedding" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9424.jpg",  "caption": "Reception" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9425.jpg",  "caption": "Couple" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_6651.jpg",  "caption": "Palm Court" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_7662.jpg",  "caption": "Afternoon tea" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_1282.jpg",  "caption": "Ballroom" },
          { "url": "https://www.theritzlondon.com/content/uploads/2025/01/Deluxe-King.avif",               "caption": "Deluxe King Room" },
          { "url": "https://www.theritzlondon.com/content/uploads/2023/03/The-Ritz-Restaurant-medium-res.avif", "caption": "The Ritz Restaurant" }
        ]
      },
      "layout": { "variant": "grid" }
    },
    {
      "id": "ritz-overview",
      "type": "intro",
      "content": {
        "eyebrow": "Mayfair · London · Est. 1906",
        "headline": "London''s Most Celebrated Address",
        "body": "The Ritz London is one of the world''s most celebrated hotels, a landmark of extraordinary refinement at 150 Piccadilly where impeccable service, award-winning dining, and timeless Louis XVI interiors have defined the gold standard of luxury hospitality since 1906."
      },
      "layout": { "variant": "left-aligned", "accentBg": "#faf9f6" }
    },
    {
      "id": "ritz-key-stats",
      "type": "stats",
      "content": {
        "eyebrow": "",
        "items": [
          { "value": "136",    "label": "Rooms & Suites",  "sublabel": "Including seven grand suites" },
          { "value": "1906",   "label": "Established",     "sublabel": "118 years of tradition" },
          { "value": "★★",    "label": "Michelin Stars",  "sublabel": "The Ritz Restaurant" },
          { "value": "Royal",  "label": "Warrant",         "sublabel": "By Royal appointment" },
          { "value": "No.1",   "label": "Piccadilly",      "sublabel": "London''s finest address" },
          { "value": "∞",      "label": "White Glove",     "sublabel": "Personal butler service" }
        ]
      },
      "layout": { "variant": "strip", "accentBg": "#ffffff" }
    },
    {
      "id": "ritz-story",
      "type": "feature",
      "content": {
        "eyebrow": "The Ritz Story",
        "headline": "A Standard of Extraordinary",
        "body": "Holding the Royal Warrant by appointment to HRH The Prince of Wales, The Ritz London is not merely a hotel — it is a place where every guest is treated as royalty, every occasion elevated, and every detail a matter of honour. From the moment you step through the doors on Piccadilly, time slows. The Long Gallery stretches before you, dressed in hand-painted silk, antique marble, and gilded mirrors. This is the hotel that invented the standard by which all others are measured.",
        "image": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21068.jpg"
      },
      "layout": { "variant": "image-left", "accentBg": "#faf9f6" }
    },
    {
      "id": "ritz-rooms-band",
      "type": "highlight-band",
      "content": {
        "eyebrow": "Accommodation",
        "headline": "136 Rooms. Versailles in the Heart of London.",
        "body": "136 rooms and suites, each a sanctuary of extraordinary refinement, dressed in silk damask and antique gold, with hand-painted ceilings, exquisite antiques, marble bathrooms of palatial proportions, and a personal butler in attendance at all times.",
        "divider": true
      },
      "layout": { "accentBg": "#ffffff", "theme": "light", "align": "left", "size": "standard" }
    },
    {
      "id": "ritz-rooms-1",
      "type": "feature",
      "content": {
        "eyebrow": "Deluxe Rooms · Personal Butler Included",
        "headline": "Rooms of Extraordinary Refinement",
        "body": "Inspired by the Palace of Versailles, every room at The Ritz is dressed in silk damask and antique gold, with hand-painted ceilings, exquisite period antiques, and marble bathrooms of palatial proportion. Each room overlooks either Green Park or Piccadilly — and every guest is attended by a personal butler, day and night.",
        "image": "https://www.theritzlondon.com/content/uploads/2025/01/Deluxe-King.avif"
      },
      "layout": { "variant": "image-left", "accentBg": "#1C1828" }
    },
    {
      "id": "ritz-rooms-2",
      "type": "feature",
      "content": {
        "eyebrow": "Suites & Grand Suites · Up to 7 rooms",
        "headline": "The William & Mary Suite",
        "body": "The grand suites at The Ritz — among them the William & Mary Suite, The Piccadilly Suite, and The Library Suite — are among the most celebrated in the world. Spanning multiple interconnecting rooms, each has its own identity, its own story, and its own dedicated butler team. They have hosted royalty, heads of state, and icons of culture for over a century.",
        "image": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21070.jpg"
      },
      "layout": { "variant": "image-right", "accentBg": "#130f1e" }
    },
    {
      "id": "ritz-corridor",
      "type": "image-full",
      "content": {
        "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21069.jpg",
        "alt": "The Long Gallery at The Ritz London",
        "caption": "The Long Gallery — the most beautiful corridor in the world.",
        "height": "440px"
      },
      "layout": {}
    },
    {
      "id": "ritz-rooms-mosaic",
      "type": "mosaic",
      "content": {
        "title": "Every Room a Private World",
        "body": "Hand-embroidered fabrics, original oil paintings, antique French furniture, bespoke Ritz floral arrangements, and a butler who knows your preferences before you arrive.",
        "images": [
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21071.jpg", "alt": "Grand Suite" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9418.jpg",  "alt": "Room detail" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9420.jpg",  "alt": "Room detail" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9421.jpg",  "alt": "Room detail" }
        ]
      },
      "layout": { "pattern": "grid" }
    },
    {
      "id": "ritz-rooms-carousel",
      "type": "gallery",
      "content": {
        "title": "Room Categories",
        "images": [
          { "url": "https://www.theritzlondon.com/content/uploads/2025/01/Deluxe-King.avif",          "caption": "Deluxe King Room" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21070.jpg", "caption": "Junior Suite" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21071.jpg", "caption": "The Piccadilly Suite" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9418.jpg",  "caption": "The Library Suite" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9420.jpg",  "caption": "William & Mary Suite" }
        ]
      },
      "layout": { "variant": "carousel" }
    },
    {
      "id": "ritz-dining-band",
      "type": "highlight-band",
      "content": {
        "eyebrow": "Dining · Two Michelin Stars · The Palm Court · The Rivoli Bar",
        "headline": "A Kitchen That Defines London",
        "body": "Two Michelin stars, a world-famous afternoon tea, and the legendary Rivoli Bar — dining at The Ritz is as much a part of London''s cultural life as the changing of the guard or a walk through Green Park.",
        "divider": true
      },
      "layout": { "accentBg": "#1C1828", "theme": "dark", "align": "left", "size": "large" }
    },
    {
      "id": "ritz-restaurant",
      "type": "dining",
      "content": {
        "eyebrow": "The Ritz Restaurant · Two Michelin Stars · John Williams MBE",
        "headline": "The Most Beautiful Dining Room in the World",
        "body": "Named Restaurant of the Year by the National Restaurant Awards 2025, The Ritz Restaurant is an unrivalled statement of grandeur: towering marble columns, crystal chandeliers, and floor-to-ceiling windows that look out across the gardens of Green Park. Executive Chef John Williams MBE sources the finest seasonal British produce to create menus that celebrate the very best of what Britain grows, catches, and rears.",
        "image": "https://www.theritzlondon.com/content/uploads/2023/03/The-Ritz-Restaurant-medium-res.avif"
      },
      "layout": { "variant": "image-right", "accentBg": "#1a1525" }
    },
    {
      "id": "ritz-cesar-quote",
      "type": "quote",
      "content": {
        "text": "The Ritz is not merely a hotel. It is a standard — perhaps the finest standard in the world.",
        "attribution": "César Ritz",
        "attributionRole": "Founder, 1906"
      },
      "layout": { "variant": "centered", "accentBg": "#130f1e" }
    },
    {
      "id": "ritz-palm-court",
      "type": "image-full",
      "content": {
        "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_6651.jpg",
        "alt": "The Palm Court at The Ritz London",
        "caption": "The Palm Court · Afternoon Tea · Since 1906",
        "height": "400px"
      },
      "layout": {}
    },
    {
      "id": "ritz-weddings-band",
      "type": "highlight-band",
      "content": {
        "eyebrow": "Weddings & Private Celebrations",
        "headline": "London''s Most Celebrated Wedding Address",
        "body": "Every wedding at The Ritz is a masterpiece of discretion, elegance, and impeccable taste — created by London''s most celebrated wedding team, in London''s most celebrated hotel.",
        "divider": true
      },
      "layout": { "accentBg": "#faf9f6", "theme": "light", "align": "center", "size": "large" }
    },
    {
      "id": "ritz-weddings-hero",
      "type": "image-full",
      "content": {
        "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9422.jpg",
        "alt": "Wedding at The Ritz London",
        "height": "520px"
      },
      "layout": {}
    },
    {
      "id": "ritz-william-kent",
      "type": "weddings",
      "content": {
        "eyebrow": "The William Kent Room · Private Dining & Celebrations",
        "headline": "An Occasion Unlike Any Other",
        "body": "The William Kent Room at The Ritz is one of London''s most exquisite private dining and celebration spaces — an intimate salon of gilded panelling and silk-draped walls that seats up to 80 guests for a wedding breakfast, overlooking the private gardens of Green Park. Every detail is considered; every moment remembered for a lifetime.",
        "image": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9424.jpg"
      },
      "layout": { "variant": "image-right", "accentBg": "#f5f0e8" }
    },
    {
      "id": "ritz-weddings-mosaic",
      "type": "mosaic",
      "content": {
        "title": "",
        "body": "",
        "images": [
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9423.jpg", "alt": "Wedding ceremony" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9425.jpg", "alt": "Wedding couple" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_1282.jpg", "alt": "Wedding setup" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9426.jpg", "alt": "Wedding detail" }
        ]
      },
      "layout": { "pattern": "asymmetrical" }
    },
    {
      "id": "ritz-wedding-strip",
      "type": "gallery",
      "content": {
        "title": "The Ritz Wedding",
        "images": [
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9426.jpg", "caption": "Floral detail" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9427.jpg", "caption": "Terrace" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_13861.jpg","caption": "Detail" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9423.jpg", "caption": "Ceremony" }
        ]
      },
      "layout": { "variant": "grid" }
    },
    {
      "id": "ritz-cta",
      "type": "cta",
      "content": {
        "headline": "Begin Your Ritz Wedding Story",
        "subline": "Contact our dedicated wedding team to arrange a private consultation at 150 Piccadilly.",
        "background": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_14891.jpg",
        "venueName": "The Ritz London"
      },
      "layout": {}
    }
  ]'::jsonb,

  published_sections = '[
    {
      "id": "ritz-hero",
      "type": "hero",
      "content": {
        "title": "The Ritz London",
        "tagline": "150 Piccadilly · Mayfair · London · Est. 1906",
        "image": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21069.jpg",
        "overlay_opacity": 0.50
      },
      "layout": {}
    },
    {
      "id": "ritz-gallery",
      "type": "gallery",
      "content": {
        "title": "The Ritz London",
        "images": [
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21069.jpg", "caption": "The Long Gallery" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21068.jpg", "caption": "Grand staircase" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21059.jpg", "caption": "Interior" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21070.jpg", "caption": "Suite" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21071.jpg", "caption": "Detail" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9418.jpg",  "caption": "Gallery" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9420.jpg",  "caption": "Rooms" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9421.jpg",  "caption": "Dining" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9422.jpg",  "caption": "Celebration" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9423.jpg",  "caption": "Wedding" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9424.jpg",  "caption": "Reception" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9425.jpg",  "caption": "Couple" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_6651.jpg",  "caption": "Palm Court" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_7662.jpg",  "caption": "Afternoon tea" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_1282.jpg",  "caption": "Ballroom" },
          { "url": "https://www.theritzlondon.com/content/uploads/2025/01/Deluxe-King.avif",               "caption": "Deluxe King Room" },
          { "url": "https://www.theritzlondon.com/content/uploads/2023/03/The-Ritz-Restaurant-medium-res.avif", "caption": "The Ritz Restaurant" }
        ]
      },
      "layout": { "variant": "grid" }
    },
    {
      "id": "ritz-overview",
      "type": "intro",
      "content": {
        "eyebrow": "Mayfair · London · Est. 1906",
        "headline": "London''s Most Celebrated Address",
        "body": "The Ritz London is one of the world''s most celebrated hotels, a landmark of extraordinary refinement at 150 Piccadilly where impeccable service, award-winning dining, and timeless Louis XVI interiors have defined the gold standard of luxury hospitality since 1906."
      },
      "layout": { "variant": "left-aligned", "accentBg": "#faf9f6" }
    },
    {
      "id": "ritz-key-stats",
      "type": "stats",
      "content": {
        "eyebrow": "",
        "items": [
          { "value": "136",    "label": "Rooms & Suites",  "sublabel": "Including seven grand suites" },
          { "value": "1906",   "label": "Established",     "sublabel": "118 years of tradition" },
          { "value": "★★",    "label": "Michelin Stars",  "sublabel": "The Ritz Restaurant" },
          { "value": "Royal",  "label": "Warrant",         "sublabel": "By Royal appointment" },
          { "value": "No.1",   "label": "Piccadilly",      "sublabel": "London''s finest address" },
          { "value": "∞",      "label": "White Glove",     "sublabel": "Personal butler service" }
        ]
      },
      "layout": { "variant": "strip", "accentBg": "#ffffff" }
    },
    {
      "id": "ritz-story",
      "type": "feature",
      "content": {
        "eyebrow": "The Ritz Story",
        "headline": "A Standard of Extraordinary",
        "body": "Holding the Royal Warrant by appointment to HRH The Prince of Wales, The Ritz London is not merely a hotel — it is a place where every guest is treated as royalty, every occasion elevated, and every detail a matter of honour. From the moment you step through the doors on Piccadilly, time slows. The Long Gallery stretches before you, dressed in hand-painted silk, antique marble, and gilded mirrors. This is the hotel that invented the standard by which all others are measured.",
        "image": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21068.jpg"
      },
      "layout": { "variant": "image-left", "accentBg": "#faf9f6" }
    },
    {
      "id": "ritz-rooms-band",
      "type": "highlight-band",
      "content": {
        "eyebrow": "Accommodation",
        "headline": "136 Rooms. Versailles in the Heart of London.",
        "body": "136 rooms and suites, each a sanctuary of extraordinary refinement, dressed in silk damask and antique gold, with hand-painted ceilings, exquisite antiques, marble bathrooms of palatial proportions, and a personal butler in attendance at all times.",
        "divider": true
      },
      "layout": { "accentBg": "#ffffff", "theme": "light", "align": "left", "size": "standard" }
    },
    {
      "id": "ritz-rooms-1",
      "type": "feature",
      "content": {
        "eyebrow": "Deluxe Rooms · Personal Butler Included",
        "headline": "Rooms of Extraordinary Refinement",
        "body": "Inspired by the Palace of Versailles, every room at The Ritz is dressed in silk damask and antique gold, with hand-painted ceilings, exquisite period antiques, and marble bathrooms of palatial proportion. Each room overlooks either Green Park or Piccadilly — and every guest is attended by a personal butler, day and night.",
        "image": "https://www.theritzlondon.com/content/uploads/2025/01/Deluxe-King.avif"
      },
      "layout": { "variant": "image-left", "accentBg": "#1C1828" }
    },
    {
      "id": "ritz-rooms-2",
      "type": "feature",
      "content": {
        "eyebrow": "Suites & Grand Suites · Up to 7 rooms",
        "headline": "The William & Mary Suite",
        "body": "The grand suites at The Ritz — among them the William & Mary Suite, The Piccadilly Suite, and The Library Suite — are among the most celebrated in the world. Spanning multiple interconnecting rooms, each has its own identity, its own story, and its own dedicated butler team. They have hosted royalty, heads of state, and icons of culture for over a century.",
        "image": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21070.jpg"
      },
      "layout": { "variant": "image-right", "accentBg": "#130f1e" }
    },
    {
      "id": "ritz-corridor",
      "type": "image-full",
      "content": {
        "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21069.jpg",
        "alt": "The Long Gallery at The Ritz London",
        "caption": "The Long Gallery — the most beautiful corridor in the world.",
        "height": "440px"
      },
      "layout": {}
    },
    {
      "id": "ritz-rooms-mosaic",
      "type": "mosaic",
      "content": {
        "title": "Every Room a Private World",
        "body": "Hand-embroidered fabrics, original oil paintings, antique French furniture, bespoke Ritz floral arrangements, and a butler who knows your preferences before you arrive.",
        "images": [
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21071.jpg", "alt": "Grand Suite" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9418.jpg",  "alt": "Room detail" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9420.jpg",  "alt": "Room detail" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9421.jpg",  "alt": "Room detail" }
        ]
      },
      "layout": { "pattern": "grid" }
    },
    {
      "id": "ritz-rooms-carousel",
      "type": "gallery",
      "content": {
        "title": "Room Categories",
        "images": [
          { "url": "https://www.theritzlondon.com/content/uploads/2025/01/Deluxe-King.avif",          "caption": "Deluxe King Room" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21070.jpg", "caption": "Junior Suite" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_21071.jpg", "caption": "The Piccadilly Suite" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9418.jpg",  "caption": "The Library Suite" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9420.jpg",  "caption": "William & Mary Suite" }
        ]
      },
      "layout": { "variant": "carousel" }
    },
    {
      "id": "ritz-dining-band",
      "type": "highlight-band",
      "content": {
        "eyebrow": "Dining · Two Michelin Stars · The Palm Court · The Rivoli Bar",
        "headline": "A Kitchen That Defines London",
        "body": "Two Michelin stars, a world-famous afternoon tea, and the legendary Rivoli Bar — dining at The Ritz is as much a part of London''s cultural life as the changing of the guard or a walk through Green Park.",
        "divider": true
      },
      "layout": { "accentBg": "#1C1828", "theme": "dark", "align": "left", "size": "large" }
    },
    {
      "id": "ritz-restaurant",
      "type": "dining",
      "content": {
        "eyebrow": "The Ritz Restaurant · Two Michelin Stars · John Williams MBE",
        "headline": "The Most Beautiful Dining Room in the World",
        "body": "Named Restaurant of the Year by the National Restaurant Awards 2025, The Ritz Restaurant is an unrivalled statement of grandeur: towering marble columns, crystal chandeliers, and floor-to-ceiling windows that look out across the gardens of Green Park. Executive Chef John Williams MBE sources the finest seasonal British produce to create menus that celebrate the very best of what Britain grows, catches, and rears.",
        "image": "https://www.theritzlondon.com/content/uploads/2023/03/The-Ritz-Restaurant-medium-res.avif"
      },
      "layout": { "variant": "image-right", "accentBg": "#1a1525" }
    },
    {
      "id": "ritz-cesar-quote",
      "type": "quote",
      "content": {
        "text": "The Ritz is not merely a hotel. It is a standard — perhaps the finest standard in the world.",
        "attribution": "César Ritz",
        "attributionRole": "Founder, 1906"
      },
      "layout": { "variant": "centered", "accentBg": "#130f1e" }
    },
    {
      "id": "ritz-palm-court",
      "type": "image-full",
      "content": {
        "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_6651.jpg",
        "alt": "The Palm Court at The Ritz London",
        "caption": "The Palm Court · Afternoon Tea · Since 1906",
        "height": "400px"
      },
      "layout": {}
    },
    {
      "id": "ritz-weddings-band",
      "type": "highlight-band",
      "content": {
        "eyebrow": "Weddings & Private Celebrations",
        "headline": "London''s Most Celebrated Wedding Address",
        "body": "Every wedding at The Ritz is a masterpiece of discretion, elegance, and impeccable taste — created by London''s most celebrated wedding team, in London''s most celebrated hotel.",
        "divider": true
      },
      "layout": { "accentBg": "#faf9f6", "theme": "light", "align": "center", "size": "large" }
    },
    {
      "id": "ritz-weddings-hero",
      "type": "image-full",
      "content": {
        "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9422.jpg",
        "alt": "Wedding at The Ritz London",
        "height": "520px"
      },
      "layout": {}
    },
    {
      "id": "ritz-william-kent",
      "type": "weddings",
      "content": {
        "eyebrow": "The William Kent Room · Private Dining & Celebrations",
        "headline": "An Occasion Unlike Any Other",
        "body": "The William Kent Room at The Ritz is one of London''s most exquisite private dining and celebration spaces — an intimate salon of gilded panelling and silk-draped walls that seats up to 80 guests for a wedding breakfast, overlooking the private gardens of Green Park. Every detail is considered; every moment remembered for a lifetime.",
        "image": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9424.jpg"
      },
      "layout": { "variant": "image-right", "accentBg": "#f5f0e8" }
    },
    {
      "id": "ritz-weddings-mosaic",
      "type": "mosaic",
      "content": {
        "title": "",
        "body": "",
        "images": [
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9423.jpg", "alt": "Wedding ceremony" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9425.jpg", "alt": "Wedding couple" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_1282.jpg", "alt": "Wedding setup" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9426.jpg", "alt": "Wedding detail" }
        ]
      },
      "layout": { "pattern": "asymmetrical" }
    },
    {
      "id": "ritz-wedding-strip",
      "type": "gallery",
      "content": {
        "title": "The Ritz Wedding",
        "images": [
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9426.jpg", "caption": "Floral detail" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9427.jpg", "caption": "Terrace" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_13861.jpg","caption": "Detail" },
          { "url": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_9423.jpg", "caption": "Ceremony" }
        ]
      },
      "layout": { "variant": "grid" }
    },
    {
      "id": "ritz-cta",
      "type": "cta",
      "content": {
        "headline": "Begin Your Ritz Wedding Story",
        "subline": "Contact our dedicated wedding team to arrange a private consultation at 150 Piccadilly.",
        "background": "https://5starweddingdirectory.com/custom/domain_1/image_files/sitemgr_photo_14891.jpg",
        "venueName": "The Ritz London"
      },
      "layout": {}
    }
  ]'::jsonb,

  updated_at = now()
WHERE slug = 'the-ritz-london';
