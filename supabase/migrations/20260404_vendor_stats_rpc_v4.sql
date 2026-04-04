-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: vendor stats RPC v4
-- Date: 2026-04-04
-- Purpose: Update get_listing_daily_views + get_listing_daily_events to
--          accept full date range (p_from / p_to) instead of hardcoded
--          30-day window. Enables 90d / 12m trend charts.
--          Default params maintain full backwards compatibility.
-- Run in: Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.get_listing_daily_views(
  p_listing_id uuid,
  p_from       timestamptz default now() - interval '30 days',
  p_to         timestamptz default now()
)
returns table (day date, views bigint)
language sql
security definer
stable
as $$
  select
    created_at::date as day,
    count(*)         as views
  from public.page_events
  where listing_id  = p_listing_id
    and event_type  = 'page_view'
    and created_at >= p_from
    and created_at <= p_to
  group by created_at::date
  order by day;
$$;

create or replace function public.get_listing_daily_events(
  p_listing_id uuid,
  p_event_type text,
  p_from       timestamptz default now() - interval '30 days',
  p_to         timestamptz default now()
)
returns table (day date, count bigint)
language sql
security definer
stable
as $$
  select
    created_at::date as day,
    count(*)         as count
  from public.page_events
  where listing_id  = p_listing_id
    and event_type  = p_event_type
    and created_at >= p_from
    and created_at <= p_to
  group by created_at::date
  order by day;
$$;

grant execute on function public.get_listing_daily_views  to anon, authenticated;
grant execute on function public.get_listing_daily_events to anon, authenticated;
