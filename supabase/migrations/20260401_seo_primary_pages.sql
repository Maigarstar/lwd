-- ============================================================================
-- SEO Primary Pages
-- Created: 2026-04-01
-- Purpose: Persists "primary page" designations when cannibalisation is
--          detected between two pages competing for the same keyword/topic.
--          Replaces localStorage key 'seo-primary-pages'.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.seo_primary_pages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conflict_key    TEXT NOT NULL,
  primary_id      UUID NOT NULL,
  primary_name    TEXT NOT NULL,
  primary_type    TEXT NOT NULL
                  CHECK (primary_type IN ('listing', 'showcase', 'article')),
  conflict_type   TEXT NOT NULL
                  CHECK (conflict_type IN ('listing', 'showcase', 'article')),
  conflict_slug   TEXT,
  conflict_name   TEXT,
  set_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_seo_primary_conflict UNIQUE (conflict_key)
);

CREATE INDEX IF NOT EXISTS idx_seo_primary_pages_primary_id
  ON public.seo_primary_pages (primary_id);

CREATE INDEX IF NOT EXISTS idx_seo_primary_pages_primary_type
  ON public.seo_primary_pages (primary_type);

-- RLS: anon can read + write (admin panel uses anon key, same pattern as listings)
ALTER TABLE public.seo_primary_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_seo_primary_pages"
  ON public.seo_primary_pages FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_seo_primary_pages"
  ON public.seo_primary_pages FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_seo_primary_pages"
  ON public.seo_primary_pages FOR UPDATE TO anon USING (true);

CREATE POLICY "anon_delete_seo_primary_pages"
  ON public.seo_primary_pages FOR DELETE TO anon USING (true);

COMMENT ON TABLE public.seo_primary_pages IS 'Stores which page is designated as primary when cannibalisation is detected between competing pages in SEO Studio.';
