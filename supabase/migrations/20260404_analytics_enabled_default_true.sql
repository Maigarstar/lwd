-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: analytics_enabled default → true
-- Date: 2026-04-04
-- Purpose: Analytics is now ON by default for all vendors.
--          Previous migration set default false (gated feature).
--          Decision: enable for everyone — analytics is core product value,
--          not a gate. Vendors on all tiers see data. Admin always sees all.
-- Run in: Supabase SQL Editor (safe to re-run)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Enable analytics for all existing vendors that don't have it yet
update public.vendors
set analytics_enabled = true
where analytics_enabled = false or analytics_enabled is null;

-- 2. Change column default so new vendors start with analytics on
alter table public.vendors
  alter column analytics_enabled set default true;

-- 3. Drop the partial index (only covered analytics_enabled=true rows)
--    Replace with a full index for admin queries that filter on this column
drop index if exists idx_vendors_analytics_enabled;
create index if not exists idx_vendors_analytics_enabled
  on public.vendors (analytics_enabled);

comment on column public.vendors.analytics_enabled is
  'Analytics access flag. Default true — all vendors have analytics. Admin can
   disable for suspended/inactive accounts. Vendor dashboard respects this flag;
   admin views always show data regardless.';
