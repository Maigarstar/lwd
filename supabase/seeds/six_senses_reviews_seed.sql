-- Seed: 3 approved reviews for Six Senses Krabey Island
-- Run once in Supabase SQL Editor
-- Safe to re-run: ON CONFLICT DO NOTHING guards against duplicates

DO $$
DECLARE
  v_listing_id UUID;
BEGIN
  SELECT id INTO v_listing_id
  FROM listings
  WHERE slug = 'six-senses-krabey-island'
  LIMIT 1;

  IF v_listing_id IS NULL THEN
    RAISE NOTICE 'Listing not found for slug six-senses-krabey-island — skipping review seed.';
    RETURN;
  END IF;

  RAISE NOTICE 'Seeding reviews for listing ID: %', v_listing_id;

  -- ── Review 1: French couple, beach ceremony, March 2025 ─────────────────────
  INSERT INTO reviews (
    entity_type, entity_id,
    reviewer_name, reviewer_email, reviewer_location,
    event_type, event_date,
    overall_rating, sub_ratings,
    review_title, review_text,
    is_verified, moderation_status, published_at
  ) VALUES (
    'venue', v_listing_id,
    'Isabelle & Laurent Moreau', 'isabelle.moreau@lwd-seed.example',
    'Paris, France',
    'Wedding', '2025-03-15',
    5.0,
    '{"setting": 5, "service": 5, "food": 5, "value": 4}',
    'An experience that simply cannot be replicated',
    'The team at Six Senses made our wedding feel effortless from the first site visit to the final farewell. The private beach ceremony at sunrise — the light filtering through the jungle, the sound of the water, the florals arranged against the natural landscape — was beyond anything we had imagined or seen. Nothing felt staged. Every detail was considered without ever feeling choreographed. The AHA Restaurant dinner for our 32 guests was extraordinary, and Chef Adams personally walked us through the evening. We have stayed at many luxury properties worldwide and this was categorically the most personal and memorable experience of our lives together.',
    true, 'approved', NOW() - INTERVAL '45 days'
  )
  ON CONFLICT (reviewer_email, entity_type, entity_id) DO NOTHING;

  -- ── Review 2: British couple, island buyout, January 2025 ───────────────────
  INSERT INTO reviews (
    entity_type, entity_id,
    reviewer_name, reviewer_email, reviewer_location,
    event_type, event_date,
    overall_rating, sub_ratings,
    review_title, review_text,
    is_verified, moderation_status, published_at
  ) VALUES (
    'venue', v_listing_id,
    'Charlotte & James Ashworth', 'charlotte.ashworth@lwd-seed.example',
    'London, UK',
    'Wedding', '2025-01-18',
    5.0,
    '{"setting": 5, "service": 5, "food": 4, "value": 5}',
    'The most extraordinary setting in Southeast Asia',
    'We spent months searching for the right venue and nearly settled for something far less special. Six Senses Krabey Island is in a different league entirely. The island buyout gave us complete privacy for our 58 guests — no background hotel noise, no strangers, just our people in one of the world''s most beautiful places. The overwater villas are genuinely stunning, and the team''s coordination across our transfers, spa programme, and three-day celebration was seamless throughout. The Private Boardwalk dinner on the last evening is something our families still talk about. If you are considering it, stop considering and book.',
    true, 'approved', NOW() - INTERVAL '30 days'
  )
  ON CONFLICT (reviewer_email, entity_type, entity_id) DO NOTHING;

  -- ── Review 3: Indian couple, multi-day celebration, December 2024 ───────────
  INSERT INTO reviews (
    entity_type, entity_id,
    reviewer_name, reviewer_email, reviewer_location,
    event_type, event_date,
    overall_rating, sub_ratings,
    review_title, review_text,
    is_verified, moderation_status, published_at
  ) VALUES (
    'venue', v_listing_id,
    'Priya & Arjun Mehta', 'priya.mehta@lwd-seed.example',
    'Mumbai, India',
    'Wedding', '2024-12-07',
    4.8,
    '{"setting": 5, "service": 5, "food": 5, "value": 4}',
    'Seamlessly blended luxury with genuine intimacy',
    'We had a three-day multi-faith celebration — Hindu ceremony elements alongside a Western reception dinner — and the team adapted to every cultural detail with genuine care and knowledge. Nothing was ever lost in translation. The Jungle Clearing ceremony at dusk was breathtaking, and the overwater boardwalk dinner for our close family is something our parents still talk about months later. Travel logistics from Bangkok are more involved than a typical destination, but the concierge team guided every step with precision. An extraordinary venue for couples who want something that cannot be replicated anywhere else in the world.',
    true, 'approved', NOW() - INTERVAL '15 days'
  )
  ON CONFLICT (reviewer_email, entity_type, entity_id) DO NOTHING;

  RAISE NOTICE 'Review seed complete for six-senses-krabey-island.';
END $$;
