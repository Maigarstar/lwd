-- ============================================================================
-- Seed: Realistic Reviews with Full Context, Sub-Ratings, and Conversation Threads
-- Run after: 20260322_reviews_reputation_engine.sql
-- ============================================================================

BEGIN;

-- ─── Helper: get listing IDs by name ─────────────────────────────────────────
DO $$
DECLARE
  v_six_senses_id   UUID;
  v_domaine_id      UUID;
  v_tirolia_id      UUID;

  -- Review IDs (fixed so messages can reference them)
  r1 UUID := '11111111-1111-1111-1111-111111111101';
  r2 UUID := '11111111-1111-1111-1111-111111111102';
  r3 UUID := '11111111-1111-1111-1111-111111111103';
  r4 UUID := '11111111-1111-1111-1111-111111111104';
  r5 UUID := '11111111-1111-1111-1111-111111111105';
  r6 UUID := '11111111-1111-1111-1111-111111111106';
  r7 UUID := '11111111-1111-1111-1111-111111111107';
  r8 UUID := '11111111-1111-1111-1111-111111111108';
  r9 UUID := '11111111-1111-1111-1111-111111111109';

BEGIN
  -- Resolve listing IDs (handle gracefully if listings don't exist)
  SELECT id INTO v_six_senses_id FROM listings WHERE name ILIKE '%Six Senses Krabey%' LIMIT 1;
  SELECT id INTO v_domaine_id    FROM listings WHERE name ILIKE '%Domaine des Etangs%' OR name ILIKE '%Étangs%' LIMIT 1;
  SELECT id INTO v_tirolia_id    FROM listings WHERE name ILIKE '%Tirolia%' LIMIT 1;

  -- ── Six Senses Krabey Island reviews ────────────────────────────────────────

  IF v_six_senses_id IS NOT NULL THEN

    -- Review 1: Approved, verified couple, high rating, has owner reply
    INSERT INTO reviews (
      id, entity_type, entity_id,
      reviewer_name, reviewer_email, reviewer_location,
      reviewer_role, guest_count,
      event_type, event_date,
      overall_rating, sub_ratings,
      review_title, review_text,
      is_verified, is_verified_booking, verification_source,
      is_public, is_featured, featured_quote,
      moderation_status, reply_count, first_reply_at, last_message_at,
      published_at, created_at
    ) VALUES (
      r1, 'venue', v_six_senses_id,
      'Alexandra & James Whitmore', 'a.whitmore@gmail.com', 'London, UK',
      'couple', 88,
      'Wedding & Reception', '2025-09-14',
      4.9,
      '{"venue": 5.0, "service": 5.0, "catering": 4.9, "atmosphere": 5.0, "value": 4.6}'::jsonb,
      'An island that felt entirely ours',
      'We booked the full island buyout for our September wedding and the experience was beyond anything we imagined. The Six Senses team anticipated every detail before we even thought to ask. From the moment our speedboat arrived to the final farewell breakfast, we felt like the island had been waiting just for us.

The ceremony on the private beach at sunrise was breathtaking — the kind of image that stays with you forever. Chef Phalla and the culinary team created a completely bespoke menu drawing on the island''s own garden and local fishermen. Our guests still talk about the seafood course.

The overwater villas meant everyone had complete privacy, and the spa was extraordinary — we had it reserved for a full wellness day the morning after the ceremony. If you are considering an island buyout wedding, there is no comparison.',
      TRUE, TRUE, 'booking',
      TRUE, TRUE, 'The island felt entirely ours — from the sunrise ceremony on the private beach to the final farewell breakfast.',
      'replied', 1, NOW() - INTERVAL '45 days', NOW() - INTERVAL '40 days',
      NOW() - INTERVAL '60 days', NOW() - INTERVAL '65 days'
    ) ON CONFLICT (id) DO NOTHING;

    -- Review 2: Pending, couple, sub-ratings present but unverified
    INSERT INTO reviews (
      id, entity_type, entity_id,
      reviewer_name, reviewer_email, reviewer_location,
      reviewer_role, guest_count,
      event_type, event_date,
      overall_rating, sub_ratings,
      review_title, review_text,
      is_verified, is_verified_booking, verification_source,
      is_public, moderation_status,
      created_at
    ) VALUES (
      r2, 'venue', v_six_senses_id,
      'Sophie & Charles Laurent', 's.laurent@me.com', 'Paris, France',
      'couple', 64,
      'Intimate Wedding', '2025-11-22',
      4.7,
      '{"venue": 5.0, "service": 4.8, "catering": 4.6, "atmosphere": 5.0, "value": 4.3}'::jsonb,
      'Intimate perfection in Cambodia',
      'We chose Six Senses Krabey Island for a smaller, intimate celebration — just 64 of our closest family and friends. The island team were exceptional at creating a sense of exclusivity even at our scale. The Tree Restaurant dinner the night before the ceremony was a highlight in itself.

The only small note would be that one villa took slightly longer to prepare on arrival day, but the concierge handled it graciously with a private champagne reception at the spa as a gesture. That kind of recovery speaks to the quality of the team.',
      FALSE, FALSE, NULL,
      FALSE, 'pending',
      NOW() - INTERVAL '3 days'
    ) ON CONFLICT (id) DO NOTHING;

    -- Review 3: Approved, guest perspective, awaiting owner reply
    INSERT INTO reviews (
      id, entity_type, entity_id,
      reviewer_name, reviewer_email, reviewer_location,
      reviewer_role, guest_count,
      event_type, event_date,
      overall_rating, sub_ratings,
      review_title, review_text,
      is_verified, is_verified_booking, verification_source,
      is_public, moderation_status,
      published_at, created_at
    ) VALUES (
      r3, 'venue', v_six_senses_id,
      'Isabelle Marchetti', 'i.marchetti@gmail.com', 'Milan, Italy',
      'guest', 88,
      'Wedding Guest', '2025-09-14',
      4.8,
      '{"venue": 5.0, "service": 4.9, "catering": 4.8, "atmosphere": 5.0, "value": 4.5}'::jsonb,
      'As a guest — the most beautiful wedding I have attended',
      'I attended as a guest at the Alexandra and James wedding. As a traveller who has stayed at many luxury properties globally, Six Senses Krabey Island ranks as one of the most extraordinary places I have experienced.

The attention to detail extended to every guest, not just the couple. My overwater villa was immaculate, the spa staff were exceptional, and the ceremony itself was genuinely moving — the island setting creates an atmosphere that simply cannot be manufactured.

The only question I would have is whether the island offers direct availability for smaller private celebrations — I would love to return with my partner.',
      FALSE, FALSE, NULL,
      TRUE, 'awaiting_reply',
      NOW() - INTERVAL '50 days', NOW() - INTERVAL '55 days'
    ) ON CONFLICT (id) DO NOTHING;

  END IF;

  -- ── Domaine des Étangs reviews ───────────────────────────────────────────────

  IF v_domaine_id IS NOT NULL THEN

    -- Review 4: Approved, verified, planner review
    INSERT INTO reviews (
      id, entity_type, entity_id,
      reviewer_name, reviewer_email, reviewer_location,
      reviewer_role, guest_count,
      event_type, event_date,
      overall_rating, sub_ratings,
      review_title, review_text,
      is_verified, is_verified_booking, verification_source,
      is_public, is_featured,
      moderation_status, reply_count, first_reply_at, last_message_at,
      published_at, created_at
    ) VALUES (
      r4, 'venue', v_domaine_id,
      'Helena Rousseau', 'helena@rousseau-events.fr', 'Paris, France',
      'planner', 120,
      'Three-Day Wedding Celebration', '2025-06-07',
      4.8,
      '{"venue": 5.0, "service": 4.9, "catering": 4.8, "atmosphere": 5.0, "value": 4.4}'::jsonb,
      'The finest luxury chateau in France for a three-day celebration',
      'As a wedding planner with over 15 years working exclusively with luxury venues in France, I have worked at Domaine des Étangs multiple times. It consistently delivers at the highest level.

The estate is extraordinary in scale — the chateau, the mill, the lake, the forest. Guests from London, New York, and Dubai all remarked that they had never seen anything comparable in France. The culinary programme under the direction of Chef Yannick is genuinely Michelin-calibre.

For planners: the venue team are professional partners who understand high-expectation clients. Their operational precision during the wedding weekend was exceptional.',
      TRUE, TRUE, 'booking',
      TRUE, TRUE,
      'replied', 1, NOW() - INTERVAL '25 days', NOW() - INTERVAL '20 days',
      NOW() - INTERVAL '40 days', NOW() - INTERVAL '45 days'
    ) ON CONFLICT (id) DO NOTHING;

    -- Review 5: Pending, couple
    INSERT INTO reviews (
      id, entity_type, entity_id,
      reviewer_name, reviewer_email, reviewer_location,
      reviewer_role, guest_count,
      event_type, event_date,
      overall_rating, sub_ratings,
      review_title, review_text,
      is_verified, is_verified_booking, verification_source,
      is_public, moderation_status,
      created_at
    ) VALUES (
      r5, 'venue', v_domaine_id,
      'Claudia & Oliver Stern', 'c.stern@stern-gmbh.de', 'Munich, Germany',
      'couple', 76,
      'Wedding & Honeymoon Stay', '2025-08-23',
      4.6,
      '{"venue": 5.0, "service": 4.5, "catering": 4.7, "atmosphere": 5.0, "value": 4.2}'::jsonb,
      'Breathtaking estate, minor logistical notes',
      'The Domaine des Étangs estate is simply breathtaking — the lake, the chateau interiors, the parkland. We fell in love on our first site visit and our guests were equally overwhelmed on the day.

The ceremony in the chapel was perfect. The dinner in the grand salon was the most elegant evening of our lives. Two small notes: the shuttle coordination for guests coming from Angoulême station could be more proactive, and the bar service slowed during the cocktail hour. These are minor compared to everything that was exceptional.',
      TRUE, TRUE, 'enquiry',
      FALSE, 'pending',
      NOW() - INTERVAL '1 day'
    ) ON CONFLICT (id) DO NOTHING;

    -- Review 6: Rejected (spam/suspicious)
    INSERT INTO reviews (
      id, entity_type, entity_id,
      reviewer_name, reviewer_email, reviewer_location,
      reviewer_role,
      overall_rating, sub_ratings,
      review_title, review_text,
      is_verified, is_verified_booking,
      is_public, moderation_status, admin_notes,
      created_at
    ) VALUES (
      r6, 'venue', v_domaine_id,
      'John Smith', 'john123@tempmail.com', NULL,
      'other',
      5.0,
      '{}'::jsonb,
      'Amazing amazing amazing',
      'Best venue ever! 10/10! Amazing! Book this venue! Amazing service! Will recommend to everyone!',
      FALSE, FALSE,
      FALSE, 'rejected', 'Rejected: generic spam pattern, no event context, temp email domain.',
      NOW() - INTERVAL '10 days'
    ) ON CONFLICT (id) DO NOTHING;

  END IF;

  -- ── Grand Tirolia reviews ────────────────────────────────────────────────────

  IF v_tirolia_id IS NOT NULL THEN

    -- Review 7: Approved, corporate event, verified
    INSERT INTO reviews (
      id, entity_type, entity_id,
      reviewer_name, reviewer_email, reviewer_location,
      reviewer_role, guest_count,
      event_type, event_date,
      overall_rating, sub_ratings,
      review_title, review_text,
      is_verified, is_verified_booking, verification_source,
      is_public, moderation_status,
      published_at, created_at
    ) VALUES (
      r7, 'venue', v_tirolia_id,
      'Markus Kellner', 'm.kellner@kellner-group.at', 'Vienna, Austria',
      'corporate', 42,
      'Private Corporate Retreat', '2025-10-03',
      4.7,
      '{"venue": 5.0, "service": 4.8, "catering": 4.9, "atmosphere": 5.0, "value": 4.3}'::jsonb,
      'Exceptional winter Alpine luxury for a senior leadership retreat',
      'We organised a three-night senior leadership retreat at Grand Tirolia for 42 executives from across Europe. The discretion and service standards were exactly what we needed for a high-profile group.

The private dining experiences were highlights: the cheese cellar dinner on the first evening set the tone perfectly. The skiing coordination for guests of varying abilities was handled with professionalism. Chef''s tasting menu on the final night was genuinely outstanding.

Grand Tirolia understands discretion. No other guests were present during our stay. The team never missed a beat.',
      TRUE, TRUE, 'booking',
      TRUE, 'approved',
      NOW() - INTERVAL '30 days', NOW() - INTERVAL '35 days'
    ) ON CONFLICT (id) DO NOTHING;

    -- Review 8: Pending, couple, first wedding at the venue
    INSERT INTO reviews (
      id, entity_type, entity_id,
      reviewer_name, reviewer_email, reviewer_location,
      reviewer_role, guest_count,
      event_type, event_date,
      overall_rating, sub_ratings,
      review_title, review_text,
      is_verified, is_verified_booking, verification_source,
      is_public, moderation_status,
      created_at
    ) VALUES (
      r8, 'venue', v_tirolia_id,
      'Anna-Lena & Thomas Brüggemann', 'annalena.b@me.com', 'Hamburg, Germany',
      'couple', 35,
      'Intimate Alpine Wedding', '2025-12-28',
      5.0,
      '{"venue": 5.0, "service": 5.0, "catering": 5.0, "atmosphere": 5.0, "value": 4.7}'::jsonb,
      'A winter fairy tale — absolute perfection',
      'We chose Grand Tirolia for our winter wedding and we cannot find a single word of criticism. Everything, without exception, was perfect.

The snow-covered setting for our ceremony was something from a film. The team had arranged a private sleigh for our entrance. Our 35 guests, many travelling from outside Germany, were completely taken care of from arrival to departure. Every meal was remarkable.

If you want an intimate luxury Alpine winter wedding, Grand Tirolia is in a category of one.',
      TRUE, TRUE, 'enquiry',
      FALSE, 'pending',
      NOW() - INTERVAL '5 days'
    ) ON CONFLICT (id) DO NOTHING;

  END IF;

  -- ── review_messages: conversation threads ────────────────────────────────────

  -- Thread for r1 (Six Senses — replied)
  INSERT INTO review_messages (review_id, sender_type, sender_name, message_body, is_internal_note, created_at)
  VALUES (
    r1, 'owner', 'Six Senses Krabey Island — Events Team',
    'Alexandra, James — thank you so much for sharing this. Your wedding weekend was a genuine joy for our entire team. Reading your words about the sunrise ceremony and Chef Phalla''s menu made everyone here smile. We hope to welcome you back to Krabey Island — perhaps for a future anniversary. With warmest regards, the Six Senses Krabey Island Events Team.',
    FALSE, NOW() - INTERVAL '40 days'
  );

  -- Admin internal note on r1
  INSERT INTO review_messages (review_id, sender_type, sender_name, message_body, is_internal_note, created_at)
  VALUES (
    r1, 'admin', 'Admin',
    'Featured review — approved for homepage and listing page display. Verified booking confirmed via Six Senses booking reference SKI-2025-0914.',
    TRUE, NOW() - INTERVAL '59 days'
  );

  -- Thread for r3 (Six Senses — awaiting reply)
  INSERT INTO review_messages (review_id, sender_type, sender_name, message_body, is_internal_note, created_at)
  VALUES (
    r3, 'admin', 'Admin',
    'Flagged for owner response — guest (Isabelle Marchetti) has asked about availability for smaller private stays. Good opportunity for the Six Senses team to convert.',
    TRUE, NOW() - INTERVAL '48 days'
  );

  -- Thread for r4 (Domaine des Étangs — replied)
  INSERT INTO review_messages (review_id, sender_type, sender_name, message_body, is_internal_note, created_at)
  VALUES (
    r4, 'owner', 'Domaine des Étangs — Events',
    'Helena, thank you — it is always a pleasure to work with a planner of your calibre and professionalism. The Stern wedding in June was everything we hoped it would be. We look forward to the next collaboration. Warm regards, the Domaine team.',
    FALSE, NOW() - INTERVAL '20 days'
  );

  -- Admin internal note on r6 (rejected spam)
  INSERT INTO review_messages (review_id, sender_type, sender_name, message_body, is_internal_note, created_at)
  VALUES (
    r6, 'admin', 'Admin',
    'Auto-flagged: temp email domain (tempmail.com), no event date, no reviewer context, generic positive language pattern. Rejected without response.',
    TRUE, NOW() - INTERVAL '10 days'
  );

END;
$$;

COMMIT;
