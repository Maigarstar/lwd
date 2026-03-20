-- ─── Event Presentation Fields ───────────────────────────────────────────────
-- Adds customisable copy/UX fields to the events table.
-- These power the "Presentation" section in Event Studio and are rendered
-- directly on EventDetailPage.
--
-- Run in Supabase SQL Editor (or via `supabase db push`).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS editorial_intro   TEXT,
  ADD COLUMN IF NOT EXISTS video_label       TEXT    DEFAULT 'A Glimpse Inside',
  ADD COLUMN IF NOT EXISTS pricing_label     TEXT,
  ADD COLUMN IF NOT EXISTS cta_text          TEXT    DEFAULT 'Secure your place',
  ADD COLUMN IF NOT EXISTS calendar_enabled  BOOLEAN DEFAULT TRUE;
