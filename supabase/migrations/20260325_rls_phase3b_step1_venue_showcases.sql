-- =============================================================================
-- Phase 3B Step 1: RLS for venue_showcases
-- Idempotent — safe to re-run
--
-- Policy: anon can SELECT rows where status = 'published' only.
-- service_role bypasses RLS automatically — all admin ops continue unchanged.
-- authenticated role: no policy (no app use case for auth'd direct reads;
--   all admin reads go through admin-showcases edge function).
--
-- Run this first. Verify before running Step 2 (listings).
--
-- Verification checklist (run in browser console):
--   1. Public showcase page loads at /venues/[published-slug]
--   2. ShowcasePage.jsx fallback (listing by slug) works on venue with published listing
--   3. Admin showcase list still loads (admin-showcases edge fn — not affected)
--   4. Showcase studio save/publish still works
--
-- SQL check after running:
--   SELECT tablename, rowsecurity
--   FROM pg_tables
--   WHERE schemaname = 'public' AND tablename = 'venue_showcases';
--   -- rowsecurity should be true
--
--   SELECT policyname, cmd, roles, qual
--   FROM pg_policies
--   WHERE schemaname = 'public' AND tablename = 'venue_showcases';
--   -- should show showcases_anon_select_published with qual: (status = 'published')
-- =============================================================================

ALTER TABLE public.venue_showcases ENABLE ROW LEVEL SECURITY;

-- Public read: anon can only see published showcases
DROP POLICY IF EXISTS "showcases_anon_select_published" ON public.venue_showcases;

CREATE POLICY "showcases_anon_select_published"
  ON public.venue_showcases
  FOR SELECT
  TO anon
  USING (status = 'published');

-- No INSERT / UPDATE / DELETE policies for anon or authenticated.
-- All writes go through admin-showcases edge function (service_role).
