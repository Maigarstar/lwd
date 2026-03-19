-- Migration: 20260319_footer_nav_admin_write
--
-- RLS Part 1 ran before admin moved to service_role key, which blocked
-- Footer Builder and Menu Builder from saving (anon SELECT only).
--
-- This adds anon ALL policies on the four CMS tables actively written
-- by the admin via the anon client. Temporary until admin moves to
-- edge functions with service_role.

-- ── Footer ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "footer_config_admin_write" ON public.footer_config;
CREATE POLICY "footer_config_admin_write" ON public.footer_config
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "footer_items_admin_write" ON public.footer_items;
CREATE POLICY "footer_items_admin_write" ON public.footer_items
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── Navigation ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "nav_config_admin_write" ON public.nav_config;
CREATE POLICY "nav_config_admin_write" ON public.nav_config
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "nav_items_admin_write" ON public.nav_items;
CREATE POLICY "nav_items_admin_write" ON public.nav_items
  FOR ALL TO anon USING (true) WITH CHECK (true);
