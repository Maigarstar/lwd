-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: seed_media_events
-- Date: 2026-04-05
-- Purpose: Seeds realistic media_events rows for images that already exist
--          in media_ai_index, so the Media Intelligence platform module
--          shows real thumbnails with engagement data immediately.
--
-- Safe to run multiple times — uses INSERT … ON CONFLICT DO NOTHING where
-- possible, and the events table has no unique constraint (each row is a
--  discrete event occurrence), so simply check for existing seed rows first.
-- ═══════════════════════════════════════════════════════════════════════════

-- Guard: only seed if media_events is empty (prevents duplicate seeding)
DO $$
DECLARE
  event_count int;
BEGIN
  SELECT COUNT(*) INTO event_count FROM public.media_events;
  IF event_count > 0 THEN
    RAISE NOTICE 'media_events already has % rows — skipping seed.', event_count;
    RETURN;
  END IF;

  -- ── Seed events for the top 20 images in media_ai_index ─────────────────
  -- Pattern: each image gets a realistic spread of views, clicks, shares, enquiries
  -- spread across the last 30 days.

  INSERT INTO public.media_events (
    media_id, listing_id, event_type, session_id, created_at
  )
  SELECT
    mai.media_id,
    mai.listing_id,
    ev.event_type,
    -- Synthetic session IDs (16-char hex)
    substring(md5(mai.media_id || ev.event_type || ev.offset_days::text), 1, 16),
    -- Spread events across the last 30 days
    now() - (random() * 30 || ' days')::interval
  FROM (
    SELECT media_id, listing_id
    FROM   public.media_ai_index
    WHERE  url IS NOT NULL
    ORDER  BY is_featured DESC NULLS LAST, created_at DESC NULLS LAST
    LIMIT  20
  ) mai
  -- Generate event rows per image using a cross join
  CROSS JOIN (
    -- media_view  ×70  (most common)
    SELECT 'media_view'    AS event_type, generate_series AS offset_days FROM generate_series(1, 70)
    UNION ALL
    -- media_click ×22
    SELECT 'media_click',   generate_series FROM generate_series(1, 22)
    UNION ALL
    -- media_share ×8
    SELECT 'media_share',   generate_series FROM generate_series(1, 8)
    UNION ALL
    -- media_enquiry ×3
    SELECT 'media_enquiry', generate_series FROM generate_series(1, 3)
    UNION ALL
    -- media_dwell ×15
    SELECT 'media_dwell',   generate_series FROM generate_series(1, 15)
  ) ev
  -- Randomly thin out events so images have different scores
  WHERE random() < 0.55;

  RAISE NOTICE 'Seeded media_events for top 20 images in media_ai_index.';
END $$;

-- ── Grant unchanged ──────────────────────────────────────────────────────────
-- (media_events RLS and grants were set in 20260405_media_intelligence.sql)
