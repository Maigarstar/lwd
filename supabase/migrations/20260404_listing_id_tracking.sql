-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: listing_id tracking on page_events + live_sessions
-- Date: 2026-04-04
-- Purpose: Clean listing attribution — every event tagged with the entity
--          it came from. Powers vendor analytics, retention, and tiered
--          intelligence. Never rely only on URL parsing.
-- Run in: Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. page_events — add listing fields ─────────────────────────────────────

alter table public.page_events
  add column if not exists listing_id   uuid        null,
  add column if not exists listing_slug text        null,
  add column if not exists entity_type  text        null;  -- 'venue' | 'planner' | 'vendor'

-- Primary index — drives all vendor stats queries
create index if not exists idx_page_events_listing_id
  on public.page_events (listing_id)
  where listing_id is not null;

-- Composite index — listing + event type (e.g. views for a venue)
create index if not exists idx_page_events_listing_event
  on public.page_events (listing_id, event_type)
  where listing_id is not null;

-- ── 2. live_sessions — add current listing context ──────────────────────────
-- Tracks which listing the visitor is currently on (or null if browsing).
-- Updated on every event — gives admin the live "viewing Villa X" signal.

alter table public.live_sessions
  add column if not exists current_listing_id   uuid null,
  add column if not exists current_listing_slug text null,
  add column if not exists current_entity_type  text null;

-- Index for live dashboard queries (sessions currently on a specific listing)
create index if not exists idx_live_sessions_listing_id
  on public.live_sessions (current_listing_id)
  where current_listing_id is not null;

-- ── 3. Optional backfill — resolve listing_id from path for recent events ───
-- Only runs for page_events where listing_id is null but path matches a slug.
-- Safe to skip — fixes forward is what matters. Uncomment to run.
--
-- update public.page_events pe
-- set
--   listing_id   = l.id,
--   listing_slug = l.slug,
--   entity_type  = 'venue'
-- from public.listings l
-- where pe.listing_id is null
--   and pe.path is not null
--   and pe.path like '%' || l.slug || '%'
--   and l.slug is not null
--   and pe.created_at > now() - interval '30 days';

-- ── 4. vendor_stats view — ready when data is flowing ───────────────────────
-- Pre-built but not yet surfaced in vendor dashboard.
-- Query pattern for future vendor intelligence panel.

create or replace view public.vendor_stats_7d as
select
  listing_id,
  listing_slug,
  entity_type,
  count(*)                                                        as total_events,
  count(*) filter (where event_type = 'page_view')               as views,
  count(distinct session_id)                                      as unique_sessions,
  count(*) filter (where event_type = 'shortlist_add')           as shortlists,
  count(*) filter (where event_type = 'compare_add')             as compares,
  count(*) filter (where event_type = 'enquiry_started')         as enquiry_started,
  count(*) filter (where event_type = 'enquiry_submitted')       as enquiry_submitted,
  count(*) filter (where event_type = 'outbound_click')          as outbound_clicks,
  -- Conversion rates
  round(
    count(*) filter (where event_type = 'enquiry_submitted')::numeric
    / nullif(count(*) filter (where event_type = 'page_view'), 0) * 100,
    2
  )                                                               as view_to_enquiry_pct,
  round(
    count(*) filter (where event_type = 'enquiry_submitted')::numeric
    / nullif(count(*) filter (where event_type = 'enquiry_started'), 0) * 100,
    2
  )                                                               as enquiry_completion_pct
from public.page_events
where
  listing_id is not null
  and created_at >= now() - interval '7 days'
group by listing_id, listing_slug, entity_type;

-- Same view for 30d window
create or replace view public.vendor_stats_30d as
select
  listing_id,
  listing_slug,
  entity_type,
  count(*)                                                        as total_events,
  count(*) filter (where event_type = 'page_view')               as views,
  count(distinct session_id)                                      as unique_sessions,
  count(*) filter (where event_type = 'shortlist_add')           as shortlists,
  count(*) filter (where event_type = 'compare_add')             as compares,
  count(*) filter (where event_type = 'enquiry_started')         as enquiry_started,
  count(*) filter (where event_type = 'enquiry_submitted')       as enquiry_submitted,
  count(*) filter (where event_type = 'outbound_click')          as outbound_clicks,
  round(
    count(*) filter (where event_type = 'enquiry_submitted')::numeric
    / nullif(count(*) filter (where event_type = 'page_view'), 0) * 100,
    2
  )                                                               as view_to_enquiry_pct,
  round(
    count(*) filter (where event_type = 'enquiry_submitted')::numeric
    / nullif(count(*) filter (where event_type = 'enquiry_started'), 0) * 100,
    2
  )                                                               as enquiry_completion_pct
from public.page_events
where
  listing_id is not null
  and created_at >= now() - interval '30 days'
group by listing_id, listing_slug, entity_type;
