-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: vendor stats RPC functions
-- Date: 2026-04-04
-- Purpose: page_events and live_sessions have admin-only SELECT RLS.
--          These SECURITY DEFINER functions run with elevated privileges
--          so the vendor dashboard (anon key) can read its own listing's data.
--          Each function is scoped strictly to a single listing_id — no
--          cross-listing data leakage is possible.
-- Run in: Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Aggregate stats for a listing over a time window ──────────────────────
create or replace function public.get_listing_stats(
  p_listing_id uuid,
  p_from       timestamptz,
  p_to         timestamptz
)
returns json
language sql
security definer
stable
as $$
  select json_build_object(
    'views',              count(*) filter (where event_type = 'page_view'),
    'unique_sessions',    count(distinct session_id),
    'shortlists',         count(*) filter (where event_type = 'shortlist_add'),
    'compares',           count(*) filter (where event_type = 'compare_add'),
    'enquiry_started',    count(*) filter (where event_type = 'enquiry_started'),
    'enquiry_submitted',  count(*) filter (where event_type = 'enquiry_submitted'),
    'outbound',           count(*) filter (where event_type = 'outbound_click'),
    'view_to_enquiry',    round(
      count(*) filter (where event_type = 'enquiry_submitted')::numeric
      / nullif(count(*) filter (where event_type = 'page_view'), 0) * 100, 1
    ),
    'enquiry_completion', round(
      count(*) filter (where event_type = 'enquiry_submitted')::numeric
      / nullif(count(*) filter (where event_type = 'enquiry_started'), 0) * 100, 1
    )
  )
  from public.page_events
  where listing_id  = p_listing_id
    and created_at >= p_from
    and created_at <= p_to;
$$;

-- ── 2. Source breakdown — session UTM/referrer for a listing ─────────────────
create or replace function public.get_listing_sources(
  p_listing_id uuid,
  p_from       timestamptz,
  p_to         timestamptz
)
returns table (session_id text, utm_source text, referrer text)
language sql
security definer
stable
as $$
  select distinct pe.session_id, ls.utm_source, ls.referrer
  from public.page_events pe
  join public.live_sessions ls using (session_id)
  where pe.listing_id  = p_listing_id
    and pe.event_type  = 'page_view'
    and pe.created_at >= p_from
    and pe.created_at <= p_to;
$$;

-- ── 3. Daily view counts for last 30 days ────────────────────────────────────
create or replace function public.get_listing_daily_views(
  p_listing_id uuid
)
returns table (day date, views bigint)
language sql
security definer
stable
as $$
  select
    created_at::date                              as day,
    count(*)                                      as views
  from public.page_events
  where listing_id = p_listing_id
    and event_type = 'page_view'
    and created_at >= now() - interval '30 days'
  group by created_at::date
  order by day;
$$;

-- ── 4. Live visitor count (last 5 minutes) ───────────────────────────────────
create or replace function public.get_listing_live_count(
  p_listing_id uuid
)
returns bigint
language sql
security definer
stable
as $$
  select count(*)
  from public.live_sessions
  where current_listing_id = p_listing_id
    and last_seen_at       >= now() - interval '5 minutes';
$$;

-- ── 5. Compare intelligence — other listings in same compare sessions ────────
create or replace function public.get_listing_compare_peers(
  p_listing_id uuid
)
returns table (listing_slug text, entity_type text, sessions bigint)
language sql
security definer
stable
as $$
  with my_sessions as (
    select distinct session_id
    from public.page_events
    where listing_id = p_listing_id
      and event_type = 'compare_add'
      and created_at >= now() - interval '30 days'
  )
  select
    pe.listing_slug,
    pe.entity_type,
    count(distinct pe.session_id) as sessions
  from public.page_events pe
  join my_sessions ms using (session_id)
  where pe.event_type  = 'compare_add'
    and pe.listing_id != p_listing_id
    and pe.listing_slug is not null
  group by pe.listing_slug, pe.entity_type
  order by sessions desc
  limit 8;
$$;

-- Grant execute to anon + authenticated (functions are scoped to one listing_id)
grant execute on function public.get_listing_stats          to anon, authenticated;
grant execute on function public.get_listing_sources        to anon, authenticated;
grant execute on function public.get_listing_daily_views    to anon, authenticated;
grant execute on function public.get_listing_live_count     to anon, authenticated;
grant execute on function public.get_listing_compare_peers  to anon, authenticated;
