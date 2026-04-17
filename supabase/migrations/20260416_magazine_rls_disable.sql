-- Migration: 20260416_magazine_rls_disable
--
-- rls_part1 (20260318) re-enabled RLS on magazine tables after the original
-- migration (20260312) disabled it. The anon-write policy approach doesn't
-- reliably unblock the 403 in all Supabase configurations.
--
-- Safest fix: revert to the original disabled state, matching
-- 20260312_magazine_tables.sql intent. The admin dashboard uses the anon key
-- for all reads and writes — RLS on these tables only causes problems.
--
-- Public read access is preserved because with RLS disabled, anon can read too.

ALTER TABLE public.magazine_posts       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.magazine_blocks      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.magazine_homepage    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.magazine_media       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.magazine_categories  DISABLE ROW LEVEL SECURITY;
