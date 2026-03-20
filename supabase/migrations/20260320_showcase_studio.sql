-- ── Showcase Studio: schema additions ────────────────────────────────────────
-- Adds: template_key, theme, SEO fields, published_sections (safe publish model)
-- published_sections = live snapshot; sections = working draft
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.venue_showcases
  ADD COLUMN IF NOT EXISTS template_key        TEXT,
  ADD COLUMN IF NOT EXISTS theme               TEXT DEFAULT 'dark',
  ADD COLUMN IF NOT EXISTS seo_title           TEXT,
  ADD COLUMN IF NOT EXISTS seo_description     TEXT,
  ADD COLUMN IF NOT EXISTS og_image            TEXT,
  ADD COLUMN IF NOT EXISTS published_sections  JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Drop existing status check (may not include 'archived') and re-add
ALTER TABLE public.venue_showcases
  DROP CONSTRAINT IF EXISTS venue_showcases_status_check;

ALTER TABLE public.venue_showcases
  ADD CONSTRAINT venue_showcases_status_check
  CHECK (status IN ('draft', 'published', 'archived'));

-- updated_at trigger: verify it exists (created in prior migration)
-- published_at already exists in the table schema

COMMENT ON COLUMN public.venue_showcases.sections IS 'Working draft — edited in Showcase Studio';
COMMENT ON COLUMN public.venue_showcases.published_sections IS 'Live snapshot — updated only on publish. Public pages read this column.';
COMMENT ON COLUMN public.venue_showcases.template_key IS 'island_resort | grand_hotel | castle_wedding | intimate_villa';
COMMENT ON COLUMN public.venue_showcases.theme IS 'dark | light | warm — visual treatment preset';
