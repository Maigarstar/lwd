-- =============================================================================
-- Phase 3B Step 2: RLS for listings and listing_media
-- Idempotent — safe to re-run
--
-- DO NOT RUN until Step 1 (venue_showcases) has been verified working.
--
-- listings policy: anon can SELECT rows where status = 'published' only.
-- listing_media policy: anon can SELECT media belonging to published listings.
-- service_role bypasses RLS automatically — all admin ops continue unchanged.
-- authenticated role: no policy (Client Portal vendor access is a separate
--   follow-up phase; VendorDashboard.jsx is explicitly out of this scope).
--
-- What this locks down:
--   - Draft and archived listings invisible to public
--   - fetchListingBySlug(slug) returns null for non-published slugs → 404
--   - fetchListings() without status filter returns only published rows
--     (but all existing public callers already pass status: 'published')
--   - Admin reads still work via admin-listings edge function (service_role)
--
-- Verification checklist (run in browser + SQL editor):
--   1. Public venue profile page loads at /wedding-venues/[published-slug]
--   2. HomePage venue grid populates
--   3. LocationPage venue grid populates
--   4. Admin listings panel still loads (fetchListingsAdmin — not affected)
--   5. Listing Studio edit still opens for draft listings (fetchListingById — not affected)
--   6. Intake push-to-listing still creates listings (admin-listings edge fn — not affected)
--
-- Browser console smoke test (run on the live site with anon key):
--   const { data } = await supabase.from('listings').select('id, name, status').limit(5);
--   // All rows should have status = 'published'. No drafts visible.
--
-- SQL check after running:
--   SELECT tablename, rowsecurity
--   FROM pg_tables
--   WHERE schemaname = 'public' AND tablename IN ('listings', 'listing_media');
--   -- Both rowsecurity = true
--
--   SELECT policyname, cmd, roles, qual
--   FROM pg_policies
--   WHERE schemaname = 'public' AND tablename IN ('listings', 'listing_media');
-- =============================================================================

-- ── LISTINGS ──────────────────────────────────────────────────────────────────
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Public read: anon can only see published listings
DROP POLICY IF EXISTS "listings_anon_select_published" ON public.listings;

CREATE POLICY "listings_anon_select_published"
  ON public.listings
  FOR SELECT
  TO anon
  USING (status = 'published');

-- No INSERT / UPDATE / DELETE policies for anon or authenticated.
-- All writes go through admin-listings edge function (service_role).

-- ── LISTING_MEDIA ─────────────────────────────────────────────────────────────
-- No direct public queries use listing_media (all 4 service functions are
-- orphaned — media is accessed through the parent listings record).
-- Enabling RLS with zero anon policies blocks direct public access entirely.
-- service_role (edge functions) bypasses automatically.
--
-- If a future feature needs public media access, add:
--   CREATE POLICY "listing_media_anon_select_published"
--     ON public.listing_media FOR SELECT TO anon
--     USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.status = 'published'));
ALTER TABLE public.listing_media ENABLE ROW LEVEL SECURITY;

-- No SELECT / INSERT / UPDATE / DELETE policies for anon or authenticated.
-- All access goes through service_role (edge functions).
