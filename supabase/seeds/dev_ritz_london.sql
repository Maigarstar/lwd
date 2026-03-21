-- ─── supabase/seeds/dev_ritz_london.sql ──────────────────────────────────────
-- Showcase seed: The Ritz London
-- Brand palette: #292451 navy · warm cream whites · gold accents
-- Theme: light (overrides default dark palette)
-- Insert via Supabase Management API or SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO venue_showcases (
  type, title, slug, location, excerpt,
  hero_image_url, logo_url, preview_url, listing_id,
  status, template_key,
  theme,
  sections, published_sections,
  key_stats, sort_order,
  created_at, updated_at, published_at
)
VALUES (
  'venue',
  'The Ritz London',
  'the-ritz-london',
  'London, UK',
  'Since 1906, the pinnacle of London luxury — where impeccable service, legendary afternoon tea and two Michelin stars define the art of the extraordinary.',

  -- Hero image (Ritz facade / grand interior)
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1800&q=85',
  NULL,
  '/showcase/the-ritz-london',
  NULL,  -- standalone showcase, no listing_id

  'published',
  'grand_hotel',

  -- Light theme: Ritz navy (#292451) as accent/text, warm cream backgrounds
  '{"mode":"light","bg":"#FDFAF8","bg2":"#F5F0E8","bg3":"#EDE5D8","accent":"#292451","text":"#292451","muted":"rgba(41,36,81,0.52)","label":"#C4A35A","navBg":"rgba(253,250,248,0.97)","navBorder":"rgba(41,36,81,0.10)","navText":"rgba(41,36,81,0.42)","navActive":"#292451","heroOverlayOpacity":0.42}'::jsonb,

  -- sections (working draft = same as published for seed)
  '[
    {
      "id": "ritz-hero",
      "type": "hero",
      "content": {
        "title": "The Ritz London",
        "tagline": "Since 1906, the pinnacle of London luxury — where impeccable service, legendary afternoon tea and two Michelin stars define the art of the extraordinary.",
        "image": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1800&q=85"
      },
      "layout": {}
    },
    {
      "id": "ritz-stats",
      "type": "stats",
      "content": {
        "eyebrow": "At a Glance",
        "items": [
          { "value": "136", "label": "Rooms & Suites", "sublabel": "Including seven penthouses" },
          { "value": "1906", "label": "Since", "sublabel": "118 years of tradition" },
          { "value": "★★", "label": "Michelin Stars", "sublabel": "The Ritz Restaurant" },
          { "value": "Royal", "label": "Warrant", "sublabel": "By Royal appointment" }
        ]
      },
      "layout": { "variant": "strip", "accentBg": "#F5F0E8" }
    },
    {
      "id": "ritz-intro",
      "type": "intro",
      "content": {
        "eyebrow": "150 Piccadilly",
        "headline": "Where Timeless Elegance Defines London",
        "body": "Designed by Charles Mewès and Arthur Davis and opened by César Ritz on 24th May 1906, The Ritz London stands as one of the world''s most legendary hotels. Its Louis XVI interiors, gilded colonnades, and sweeping views across Green Park remain as breathtaking today as they were on the night it opened. The Ritz is not merely a hotel — it is a living monument to the art of living well. Holding the Royal Warrant by appointment to HRH The Prince of Wales, it is a place where every guest is treated as royalty, every occasion is elevated, and every detail is considered a matter of honour. From the moment you step through its doors on Piccadilly, time slows — and the world becomes, quite simply, more beautiful."
      },
      "layout": { "accentBg": "#FDFAF8" }
    },
    {
      "id": "ritz-feature-rooms",
      "type": "feature",
      "content": {
        "eyebrow": "Rooms & Suites",
        "headline": "The Art of Living Well",
        "body": "Each of the 136 rooms and suites at The Ritz is a sanctuary of extraordinary refinement. Inspired by the Palace of Versailles, the interiors are dressed in silk damask and antique gold, with hand-painted ceilings, exquisite antiques, and marble bathrooms of palatial proportions. The William & Mary Suite, The Piccadilly Suite, and The Library Suite each tell their own story — and every room is attended by a personal butler.",
        "image": "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80"
      },
      "layout": { "variant": "image-right", "accentBg": "#F5F0E8" }
    },
    {
      "id": "ritz-mosaic",
      "type": "mosaic",
      "content": {
        "title": "Gallery",
        "body": "Icons Within an Icon. Four legendary spaces, one address.",
        "images": [
          { "url": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80", "caption": "The Ritz Restaurant" },
          { "url": "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80", "caption": "The Palm Court" },
          { "url": "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=800&q=80", "caption": "Green Park Gardens" },
          { "url": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80", "caption": "The Grand Staircase" }
        ]
      },
      "layout": { "variant": "default" }
    },
    {
      "id": "ritz-weddings",
      "type": "weddings",
      "content": {
        "eyebrow": "Weddings & Occasions",
        "headline": "London''s Most Celebrated Address",
        "body": "To celebrate at The Ritz is to enter a world apart. The William Kent Room — an exquisite private dining and reception space — seats up to 80 guests for a wedding breakfast, while its adjoining terrace overlooks the gardens of Green Park. The hotel''s celebrated team of event planners, florists, and culinary artists work with complete discretion to create the day you have imagined — from a bespoke menu crafted by Executive Chef John Williams MBE, to floral arrangements of extraordinary beauty. Every detail is considered, every moment remembered.",
        "image": "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80"
      },
      "layout": { "variant": "image-left", "accentBg": "#EDE5D8" }
    },
    {
      "id": "ritz-quote",
      "type": "quote",
      "content": {
        "text": "The Ritz is not merely a hotel. It is a standard — perhaps the finest standard in the world.",
        "attribution": "César Ritz",
        "attributionRole": "Founder, 1906"
      },
      "layout": { "variant": "centered", "accentBg": "#F5F0E8" }
    },
    {
      "id": "ritz-dining",
      "type": "dining",
      "content": {
        "eyebrow": "The Ritz Restaurant",
        "headline": "Two Michelin Stars. One Extraordinary Table.",
        "body": "Named Restaurant of the Year by the National Restaurant Awards 2025, The Ritz Restaurant is one of the most beautiful dining rooms in the world — sparkling chandeliers, towering marble columns, and floor-to-ceiling windows overlooking Green Park. Executive Chef John Williams MBE sources the finest seasonal British ingredients: organic beef from Cornwall, Lake District lamb, lobster from South West Scotland. The signature Arts de la Table menu, five and seven-course tasting menus, and the legendary Live at The Ritz dinner with dancing on Fridays and Saturdays — each is an occasion of enduring memory. In The Palm Court, afternoon tea has been served since 1906: delicately cut sandwiches, handmade pastries, and a selection of the finest teas in the world, accompanied by Champagne. And in The Rivoli Bar — designed to feel like walking into a golden jewellery box — seasonal cocktails and the finest spirits await.",
        "image": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80"
      },
      "layout": { "variant": "image-right", "accentBg": "#FDFAF8" }
    },
    {
      "id": "ritz-wellness",
      "type": "wellness",
      "content": {
        "eyebrow": "The Palm Court",
        "headline": "Afternoon Tea: A London Ritual Since 1906",
        "body": "For 119 years, The Palm Court at The Ritz has defined the art of British afternoon tea. Beneath its celebrated painted ceiling and amid palms and gilded mirrors, the ritual unfolds as it always has: finger sandwiches of cucumber and smoked salmon, warm scones with clotted cream and preserves, handmade pastries and cakes, and a selection of the world''s finest teas — alongside Champagne for those who wish to celebrate. To take tea at The Ritz is to participate in one of London''s most cherished traditions, unchanged in spirit since the day the hotel opened.",
        "image": "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=1200&q=80"
      },
      "layout": { "variant": "image-left", "accentBg": "#EDE5D8" }
    },
    {
      "id": "ritz-cta",
      "type": "cta",
      "content": {
        "headline": "Begin Your Story at The Ritz",
        "subline": "Enquire about weddings, private dining and exclusive events at London''s most celebrated address.",
        "venueName": "The Ritz London",
        "background": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1600&q=80"
      },
      "layout": {}
    }
  ]'::jsonb,

  -- published_sections (snapshot of above)
  '[
    {
      "id": "ritz-hero",
      "type": "hero",
      "content": {
        "title": "The Ritz London",
        "tagline": "Since 1906, the pinnacle of London luxury — where impeccable service, legendary afternoon tea and two Michelin stars define the art of the extraordinary.",
        "image": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1800&q=85"
      },
      "layout": {}
    },
    {
      "id": "ritz-stats",
      "type": "stats",
      "content": {
        "eyebrow": "At a Glance",
        "items": [
          { "value": "136", "label": "Rooms & Suites", "sublabel": "Including seven penthouses" },
          { "value": "1906", "label": "Since", "sublabel": "118 years of tradition" },
          { "value": "★★", "label": "Michelin Stars", "sublabel": "The Ritz Restaurant" },
          { "value": "Royal", "label": "Warrant", "sublabel": "By Royal appointment" }
        ]
      },
      "layout": { "variant": "strip", "accentBg": "#F5F0E8" }
    },
    {
      "id": "ritz-intro",
      "type": "intro",
      "content": {
        "eyebrow": "150 Piccadilly",
        "headline": "Where Timeless Elegance Defines London",
        "body": "Designed by Charles Mewès and Arthur Davis and opened by César Ritz on 24th May 1906, The Ritz London stands as one of the world''s most legendary hotels. Its Louis XVI interiors, gilded colonnades, and sweeping views across Green Park remain as breathtaking today as they were on the night it opened. The Ritz is not merely a hotel — it is a living monument to the art of living well. Holding the Royal Warrant by appointment to HRH The Prince of Wales, it is a place where every guest is treated as royalty, every occasion is elevated, and every detail is considered a matter of honour. From the moment you step through its doors on Piccadilly, time slows — and the world becomes, quite simply, more beautiful."
      },
      "layout": { "accentBg": "#FDFAF8" }
    },
    {
      "id": "ritz-feature-rooms",
      "type": "feature",
      "content": {
        "eyebrow": "Rooms & Suites",
        "headline": "The Art of Living Well",
        "body": "Each of the 136 rooms and suites at The Ritz is a sanctuary of extraordinary refinement. Inspired by the Palace of Versailles, the interiors are dressed in silk damask and antique gold, with hand-painted ceilings, exquisite antiques, and marble bathrooms of palatial proportions. The William & Mary Suite, The Piccadilly Suite, and The Library Suite each tell their own story — and every room is attended by a personal butler.",
        "image": "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80"
      },
      "layout": { "variant": "image-right", "accentBg": "#F5F0E8" }
    },
    {
      "id": "ritz-mosaic",
      "type": "mosaic",
      "content": {
        "title": "Gallery",
        "body": "Icons Within an Icon. Four legendary spaces, one address.",
        "images": [
          { "url": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80", "caption": "The Ritz Restaurant" },
          { "url": "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80", "caption": "The Palm Court" },
          { "url": "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=800&q=80", "caption": "Green Park Gardens" },
          { "url": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80", "caption": "The Grand Staircase" }
        ]
      },
      "layout": { "variant": "default" }
    },
    {
      "id": "ritz-weddings",
      "type": "weddings",
      "content": {
        "eyebrow": "Weddings & Occasions",
        "headline": "London''s Most Celebrated Address",
        "body": "To celebrate at The Ritz is to enter a world apart. The William Kent Room — an exquisite private dining and reception space — seats up to 80 guests for a wedding breakfast, while its adjoining terrace overlooks the gardens of Green Park. The hotel''s celebrated team of event planners, florists, and culinary artists work with complete discretion to create the day you have imagined — from a bespoke menu crafted by Executive Chef John Williams MBE, to floral arrangements of extraordinary beauty. Every detail is considered, every moment remembered.",
        "image": "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80"
      },
      "layout": { "variant": "image-left", "accentBg": "#EDE5D8" }
    },
    {
      "id": "ritz-quote",
      "type": "quote",
      "content": {
        "text": "The Ritz is not merely a hotel. It is a standard — perhaps the finest standard in the world.",
        "attribution": "César Ritz",
        "attributionRole": "Founder, 1906"
      },
      "layout": { "variant": "centered", "accentBg": "#F5F0E8" }
    },
    {
      "id": "ritz-dining",
      "type": "dining",
      "content": {
        "eyebrow": "The Ritz Restaurant",
        "headline": "Two Michelin Stars. One Extraordinary Table.",
        "body": "Named Restaurant of the Year by the National Restaurant Awards 2025, The Ritz Restaurant is one of the most beautiful dining rooms in the world — sparkling chandeliers, towering marble columns, and floor-to-ceiling windows overlooking Green Park. Executive Chef John Williams MBE sources the finest seasonal British ingredients: organic beef from Cornwall, Lake District lamb, lobster from South West Scotland. The signature Arts de la Table menu, five and seven-course tasting menus, and the legendary Live at The Ritz dinner with dancing on Fridays and Saturdays — each is an occasion of enduring memory. In The Palm Court, afternoon tea has been served since 1906: delicately cut sandwiches, handmade pastries, and a selection of the finest teas in the world, accompanied by Champagne. And in The Rivoli Bar — designed to feel like walking into a golden jewellery box — seasonal cocktails and the finest spirits await.",
        "image": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80"
      },
      "layout": { "variant": "image-right", "accentBg": "#FDFAF8" }
    },
    {
      "id": "ritz-wellness",
      "type": "wellness",
      "content": {
        "eyebrow": "The Palm Court",
        "headline": "Afternoon Tea: A London Ritual Since 1906",
        "body": "For 119 years, The Palm Court at The Ritz has defined the art of British afternoon tea. Beneath its celebrated painted ceiling and amid palms and gilded mirrors, the ritual unfolds as it always has: finger sandwiches of cucumber and smoked salmon, warm scones with clotted cream and preserves, handmade pastries and cakes, and a selection of the world''s finest teas — alongside Champagne for those who wish to celebrate. To take tea at The Ritz is to participate in one of London''s most cherished traditions, unchanged in spirit since the day the hotel opened.",
        "image": "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=1200&q=80"
      },
      "layout": { "variant": "image-left", "accentBg": "#EDE5D8" }
    },
    {
      "id": "ritz-cta",
      "type": "cta",
      "content": {
        "headline": "Begin Your Story at The Ritz",
        "subline": "Enquire about weddings, private dining and exclusive events at London''s most celebrated address.",
        "venueName": "The Ritz London",
        "background": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1600&q=80"
      },
      "layout": {}
    }
  ]'::jsonb,

  -- key_stats (shown in admin card)
  '[{"value":"136","label":"Rooms & Suites"},{"value":"1906","label":"Established"},{"value":"★★","label":"Michelin Stars"}]'::jsonb,

  10,   -- sort_order
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;
