-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: vendor stats RPC v3
-- Date: 2026-04-04
-- Purpose: Country/geography breakdown for a listing's page views.
--          live_sessions already stores country_code + country_name
--          (from Cloudflare headers / ipapi.co fallback). This function
--          joins page_events → live_sessions to surface the data to the
--          vendor analytics panel via anon-key RPC.
-- Run in: Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.get_listing_countries(
  p_listing_id uuid,
  p_from       timestamptz,
  p_to         timestamptz
)
returns table (
  country_code text,
  country_name text,
  sessions     bigint
)
language sql
security definer
stable
as $$
  select
    ls.country_code,
    coalesce(ls.country_name, ls.country_code) as country_name,
    count(distinct pe.session_id)               as sessions
  from public.page_events pe
  join public.live_sessions ls using (session_id)
  where pe.listing_id  = p_listing_id
    and pe.event_type  = 'page_view'
    and pe.created_at >= p_from
    and pe.created_at <= p_to
    and ls.country_code is not null
  group by ls.country_code, ls.country_name
  order by sessions desc
  limit 10;
$$;

grant execute on function public.get_listing_countries to anon, authenticated;
