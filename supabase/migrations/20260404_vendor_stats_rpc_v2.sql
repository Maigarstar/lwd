-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: vendor stats RPC v2
-- Date: 2026-04-04
-- Purpose: Generic daily event counter — lets the trend chart show
--          views, shortlists, or enquiries without separate hardcoded functions.
-- Run in: Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.get_listing_daily_events(
  p_listing_id uuid,
  p_event_type text
)
returns table (day date, count bigint)
language sql
security definer
stable
as $$
  select
    created_at::date  as day,
    count(*)          as count
  from public.page_events
  where listing_id = p_listing_id
    and event_type  = p_event_type
    and created_at >= now() - interval '30 days'
  group by created_at::date
  order by day;
$$;

grant execute on function public.get_listing_daily_events to anon, authenticated;
