-- Migration: 20260416_magazine_admin_write
--
-- RLS Part 1 (20260318_rls_part1_public_content.sql) added only SELECT
-- policies for magazine tables, blocking all admin writes (INSERT/UPDATE/DELETE)
-- because the admin dashboard uses the anon key for writes.
--
-- Exact same pattern as 20260319_footer_nav_admin_write.sql which fixed
-- Footer Builder and Menu Builder with the same root cause.
--
-- Affected by the 403:
--   magazine_posts       → article editor saves fail
--   magazine_blocks      → content blocks fail to persist
--   magazine_homepage    → homepage config saves fail
--   magazine_media       → media upload tracking fails
--   magazine_categories  → category writes fail
--
-- Note: magazine_issues, magazine_issue_pages, magazine_analytics have
-- RLS disabled in 20260416_magazine_issues.sql — no action needed.

-- ── magazine_posts ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "magazine_posts_admin_write" ON public.magazine_posts;
CREATE POLICY "magazine_posts_admin_write" ON public.magazine_posts
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── magazine_blocks ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "magazine_blocks_admin_write" ON public.magazine_blocks;
CREATE POLICY "magazine_blocks_admin_write" ON public.magazine_blocks
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── magazine_homepage ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "magazine_homepage_admin_write" ON public.magazine_homepage;
CREATE POLICY "magazine_homepage_admin_write" ON public.magazine_homepage
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── magazine_media ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "magazine_media_admin_write" ON public.magazine_media;
CREATE POLICY "magazine_media_admin_write" ON public.magazine_media
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── magazine_categories ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "magazine_categories_admin_write" ON public.magazine_categories;
CREATE POLICY "magazine_categories_admin_write" ON public.magazine_categories
  FOR ALL TO anon USING (true) WITH CHECK (true);
