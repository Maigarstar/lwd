-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: analytics_enabled on vendors table
-- Date: 2026-04-04
-- Purpose: Gate the vendor analytics panel behind a per-vendor flag.
--          Admin sets this to true when a vendor upgrades to a plan that
--          includes analytics (Featured / Elite).
--          Off by default — vendors see an upgrade prompt until admin flips it.
-- Run in: Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.vendors
  add column if not exists analytics_enabled boolean not null default false;

-- Optional: enable for all existing approved vendors at once
-- update public.vendors set analytics_enabled = true;

-- Index — admin queries listing vendors with/without analytics
create index if not exists idx_vendors_analytics_enabled
  on public.vendors (analytics_enabled)
  where analytics_enabled = true;

comment on column public.vendors.analytics_enabled is
  'When true, vendor sees real analytics (views, live interest, source breakdown, compare intelligence). Toggled per-vendor by admin — used as a paid plan feature gate.';
