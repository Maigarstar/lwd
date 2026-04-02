-- =============================================================================
-- Admin authenticated write policies
-- =============================================================================
-- Now that the admin dashboard uses real Supabase Auth, the browser client
-- holds a valid JWT. These policies let authenticated users (admins) write
-- to tables that previously only accepted service_role (edge function) writes.
--
-- Scope: only tables the admin dashboard writes to directly via supabase client.
-- Tables that route through edge functions (leads, venue_showcases) are excluded
-- — service_role bypasses RLS on those already.
--
-- Safe to re-run (idempotent DROP IF EXISTS + CREATE).
-- =============================================================================

-- ── listings ─────────────────────────────────────────────────────────────────
-- Admin SEO Studio writes: seo_title, seo_description, seo_keywords, slug
-- Admin Listing Studio writes: all listing fields

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "listings_authenticated_all" ON public.listings;
CREATE POLICY "listings_authenticated_all"
  ON public.listings FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── magazine_posts ────────────────────────────────────────────────────────────
-- Admin SEO Studio writes: seo_title, meta_description, og_image, canonical_url
-- Magazine Studio writes: all article fields

ALTER TABLE public.magazine_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "magazine_posts_anon_select_published" ON public.magazine_posts;
CREATE POLICY "magazine_posts_anon_select_published"
  ON public.magazine_posts FOR SELECT TO anon
  USING (published = true);

DROP POLICY IF EXISTS "magazine_posts_authenticated_all" ON public.magazine_posts;
CREATE POLICY "magazine_posts_authenticated_all"
  ON public.magazine_posts FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── locations ────────────────────────────────────────────────────────────────
-- Location Studio writes: hero content, SEO fields, metadata, featured IDs

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "locations_anon_select" ON public.locations;
CREATE POLICY "locations_anon_select"
  ON public.locations FOR SELECT TO anon
  USING (true);

DROP POLICY IF EXISTS "locations_authenticated_all" ON public.locations;
CREATE POLICY "locations_authenticated_all"
  ON public.locations FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── category_content ─────────────────────────────────────────────────────────
-- Already has a broad policy — tighten to authenticated only.

DROP POLICY IF EXISTS "Admin can manage categories" ON public.category_content;
DROP POLICY IF EXISTS "category_content_authenticated_all" ON public.category_content;
CREATE POLICY "category_content_authenticated_all"
  ON public.category_content FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── ai_settings ──────────────────────────────────────────────────────────────
-- Replace the is_admin JWT claim check with plain authenticated check.
-- The admin is the only authenticated user, so this is equivalent for now.

DROP POLICY IF EXISTS "admin_manage_ai_settings" ON public.ai_settings;
CREATE POLICY "admin_manage_ai_settings"
  ON public.ai_settings FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_view_ai_usage" ON public.ai_usage_log;
CREATE POLICY "admin_view_ai_usage"
  ON public.ai_usage_log FOR SELECT TO authenticated
  USING (true);

-- ── Verify ───────────────────────────────────────────────────────────────────
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename IN ('listings','magazine_posts','locations','category_content','ai_settings','ai_usage_log')
ORDER BY tablename, policyname;

-- ── footer_config, footer_items, site_branding ───────────────────────────────
-- Footer Builder and Menu Builder write to these tables.

ALTER TABLE public.footer_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "footer_config_anon_select" ON public.footer_config;
CREATE POLICY "footer_config_anon_select"
  ON public.footer_config FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "footer_config_authenticated_all" ON public.footer_config;
CREATE POLICY "footer_config_authenticated_all"
  ON public.footer_config FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.footer_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "footer_items_anon_select" ON public.footer_items;
CREATE POLICY "footer_items_anon_select"
  ON public.footer_items FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "footer_items_authenticated_all" ON public.footer_items;
CREATE POLICY "footer_items_authenticated_all"
  ON public.footer_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.site_branding ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "site_branding_anon_select" ON public.site_branding;
CREATE POLICY "site_branding_anon_select"
  ON public.site_branding FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "site_branding_authenticated_all" ON public.site_branding;
CREATE POLICY "site_branding_authenticated_all"
  ON public.site_branding FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── nav_config, nav_items ────────────────────────────────────────────────────
-- Menu Builder writes to these tables.

ALTER TABLE public.nav_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nav_config_anon_select" ON public.nav_config;
CREATE POLICY "nav_config_anon_select"
  ON public.nav_config FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "nav_config_authenticated_all" ON public.nav_config;
CREATE POLICY "nav_config_authenticated_all"
  ON public.nav_config FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.nav_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nav_items_anon_select" ON public.nav_items;
CREATE POLICY "nav_items_anon_select"
  ON public.nav_items FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "nav_items_authenticated_all" ON public.nav_items;
CREATE POLICY "nav_items_authenticated_all"
  ON public.nav_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
