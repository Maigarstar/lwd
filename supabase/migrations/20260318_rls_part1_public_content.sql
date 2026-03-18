-- RLS Part 1: Public content tables
-- Access model: anon SELECT only (public site reads).
-- Admin writes are protected by service_role key which bypasses RLS.
--
-- !! DO NOT RUN until admin Supabase client is switched to service_role key !!
-- All 13 tables below are actively written to by admin via anon key.
-- Running this before that switch breaks: Footer Builder, Menu Builder,
-- Magazine Studio, listing management, review moderation, showcase editing.
--
-- Exception: reviews also needs anon INSERT for the public review submission
-- form on venue pages (reviewService.js → submitReview). That policy is
-- included here and is safe — it only grants INSERT, not read/update/delete.

-- ─── Venue listings ───────────────────────────────────────────────────────────

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "listings_public_read" ON public.listings;
CREATE POLICY "listings_public_read" ON public.listings
  FOR SELECT TO anon USING (true);

ALTER TABLE public.listing_media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "listing_media_public_read" ON public.listing_media;
CREATE POLICY "listing_media_public_read" ON public.listing_media
  FOR SELECT TO anon USING (true);

-- Reviews: public read + public insert (venue review submission form).
-- Admin moderation (approve/reject/delete) requires service_role.
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reviews_public_read" ON public.reviews;
DROP POLICY IF EXISTS "reviews_public_insert" ON public.reviews;
CREATE POLICY "reviews_public_read" ON public.reviews
  FOR SELECT TO anon USING (true);
CREATE POLICY "reviews_public_insert" ON public.reviews
  FOR INSERT TO anon WITH CHECK (true);

ALTER TABLE public.venue_showcases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "venue_showcases_public_read" ON public.venue_showcases;
CREATE POLICY "venue_showcases_public_read" ON public.venue_showcases
  FOR SELECT TO anon USING (true);

-- ─── Site navigation and footer ───────────────────────────────────────────────

ALTER TABLE public.nav_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nav_config_public_read" ON public.nav_config;
CREATE POLICY "nav_config_public_read" ON public.nav_config
  FOR SELECT TO anon USING (true);

ALTER TABLE public.nav_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nav_items_public_read" ON public.nav_items;
CREATE POLICY "nav_items_public_read" ON public.nav_items
  FOR SELECT TO anon USING (true);

ALTER TABLE public.footer_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "footer_config_public_read" ON public.footer_config;
CREATE POLICY "footer_config_public_read" ON public.footer_config
  FOR SELECT TO anon USING (true);

ALTER TABLE public.footer_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "footer_items_public_read" ON public.footer_items;
CREATE POLICY "footer_items_public_read" ON public.footer_items
  FOR SELECT TO anon USING (true);

-- ─── Magazine ─────────────────────────────────────────────────────────────────

ALTER TABLE public.magazine_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "magazine_posts_public_read" ON public.magazine_posts;
CREATE POLICY "magazine_posts_public_read" ON public.magazine_posts
  FOR SELECT TO anon USING (true);

ALTER TABLE public.magazine_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "magazine_categories_public_read" ON public.magazine_categories;
CREATE POLICY "magazine_categories_public_read" ON public.magazine_categories
  FOR SELECT TO anon USING (true);

ALTER TABLE public.magazine_blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "magazine_blocks_public_read" ON public.magazine_blocks;
CREATE POLICY "magazine_blocks_public_read" ON public.magazine_blocks
  FOR SELECT TO anon USING (true);

ALTER TABLE public.magazine_media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "magazine_media_public_read" ON public.magazine_media;
CREATE POLICY "magazine_media_public_read" ON public.magazine_media
  FOR SELECT TO anon USING (true);

ALTER TABLE public.magazine_homepage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "magazine_homepage_public_read" ON public.magazine_homepage;
CREATE POLICY "magazine_homepage_public_read" ON public.magazine_homepage
  FOR SELECT TO anon USING (true);
