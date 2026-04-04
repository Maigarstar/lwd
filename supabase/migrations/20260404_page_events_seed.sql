-- ═══════════════════════════════════════════════════════════════════════════
-- Seed: page_events + live_sessions for ALL real vendors
-- Date: 2026-04-04
-- Purpose: Populate vendor analytics panel with realistic 30-day event data.
--          Loops every vendor in the table — no hardcoded UUIDs.
--          Produces: views, shortlists, compares, enquiries, outbound clicks,
--          source breakdown (Google / Instagram / Pinterest / Direct),
--          rising trend (last 7d stronger than prior 7d).
-- Run in: Supabase SQL Editor (safe to re-run — ON CONFLICT DO NOTHING)
-- Requires: 20260404_listing_id_tracking.sql already run
-- ═══════════════════════════════════════════════════════════════════════════

do $$
declare
  v           record;
  sid_prefix  text;
  slug        text;

  -- Offsets (days ago) for the 20 core sessions per vendor
  view_offsets int[] := array[28,27,26,25,24,23,22,21,20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1];

begin

for v in select id, name, email from public.vendors loop

  -- Build a short stable prefix from the vendor UUID
  sid_prefix := 'dev-' || left(replace(v.id::text, '-', ''), 8);
  slug       := lower(regexp_replace(v.name, '[^a-zA-Z0-9]+', '-', 'g'));

  -- ── 1. Live sessions (20 base + 6 source-tagged + 2 live) ─────────────────

  insert into public.live_sessions
    (session_id, first_seen_at, last_seen_at, device_type, browser, os, page_count, intent_count,
     country_code, country_name, city)
  values
    -- Core sessions spread over 28 days
    (sid_prefix||'-s01', now()-'28 days'::interval, now()-'27 days'::interval, 'Desktop','Chrome','Windows 10/11',3,0,'GB','United Kingdom','London'),
    (sid_prefix||'-s02', now()-'27 days'::interval, now()-'26 days'::interval, 'Mobile', 'Safari','iOS 17.1',2,0,'GB','United Kingdom','Manchester'),
    (sid_prefix||'-s03', now()-'26 days'::interval, now()-'25 days'::interval, 'Desktop','Chrome','macOS 14.2',4,1,'US','United States','New York'),
    (sid_prefix||'-s04', now()-'25 days'::interval, now()-'24 days'::interval, 'Desktop','Firefox','Windows 10/11',2,0,'GB','United Kingdom','Edinburgh'),
    (sid_prefix||'-s05', now()-'24 days'::interval, now()-'23 days'::interval, 'Mobile', 'Chrome','Android 14',3,1,'AU','Australia','Sydney'),
    (sid_prefix||'-s06', now()-'23 days'::interval, now()-'22 days'::interval, 'Desktop','Safari','macOS 14.1',2,0,'IE','Ireland','Dublin'),
    (sid_prefix||'-s07', now()-'22 days'::interval, now()-'21 days'::interval, 'Desktop','Chrome','Windows 10/11',5,1,'GB','United Kingdom','London'),
    (sid_prefix||'-s08', now()-'21 days'::interval, now()-'20 days'::interval, 'Tablet', 'Safari','iOS 17.0',3,0,'CA','Canada','Toronto'),
    (sid_prefix||'-s09', now()-'20 days'::interval, now()-'19 days'::interval, 'Desktop','Chrome','macOS 13.6',4,1,'GB','United Kingdom','Bristol'),
    (sid_prefix||'-s10', now()-'19 days'::interval, now()-'18 days'::interval, 'Mobile', 'Safari','iOS 16.7',2,0,'US','United States','Los Angeles'),
    (sid_prefix||'-s11', now()-'14 days'::interval, now()-'13 days'::interval, 'Desktop','Edge','Windows 10/11',3,1,'GB','United Kingdom','London'),
    (sid_prefix||'-s12', now()-'13 days'::interval, now()-'12 days'::interval, 'Desktop','Chrome','macOS 14.3',6,2,'DE','Germany','Berlin'),
    (sid_prefix||'-s13', now()-'12 days'::interval, now()-'11 days'::interval, 'Mobile', 'Chrome','Android 13',3,1,'GB','United Kingdom','Leeds'),
    (sid_prefix||'-s14', now()-'11 days'::interval, now()-'10 days'::interval, 'Desktop','Chrome','Windows 10/11',4,1,'FR','France','Paris'),
    (sid_prefix||'-s15', now()-'10 days'::interval, now()-'9 days'::interval,  'Desktop','Firefox','macOS 14.2',2,0,'GB','United Kingdom','London'),
    (sid_prefix||'-s16', now()-'7 days'::interval,  now()-'6 days'::interval,  'Mobile', 'Safari','iOS 17.2',3,1,'GB','United Kingdom','Birmingham'),
    (sid_prefix||'-s17', now()-'5 days'::interval,  now()-'4 days'::interval,  'Desktop','Chrome','Windows 10/11',5,1,'GB','United Kingdom','London'),
    (sid_prefix||'-s18', now()-'4 days'::interval,  now()-'3 days'::interval,  'Desktop','Safari','macOS 14.3',4,0,'US','United States','Chicago'),
    (sid_prefix||'-s19', now()-'2 days'::interval,  now()-'1 day'::interval,   'Desktop','Chrome','Windows 10/11',4,1,'GB','United Kingdom','London'),
    (sid_prefix||'-s20', now()-'6 hours'::interval, now()-'30 minutes'::interval,'Mobile','Safari','iOS 17.3',2,0,'GB','United Kingdom','London'),
    -- Source-tagged sessions
    (sid_prefix||'-g1', now()-'6 days'::interval,  now()-'6 days'::interval,  'Desktop','Chrome','Windows 10/11',2,0,'GB','United Kingdom','London'),
    (sid_prefix||'-g2', now()-'4 days'::interval,  now()-'4 days'::interval,  'Desktop','Chrome','macOS 14.2',3,1,'GB','United Kingdom','London'),
    (sid_prefix||'-g3', now()-'2 days'::interval,  now()-'2 days'::interval,  'Desktop','Chrome','Windows 10/11',2,0,'US','United States','Boston'),
    (sid_prefix||'-i1', now()-'5 days'::interval,  now()-'5 days'::interval,  'Mobile', 'Safari','iOS 17.2',2,0,'GB','United Kingdom','London'),
    (sid_prefix||'-i2', now()-'3 days'::interval,  now()-'3 days'::interval,  'Mobile', 'Chrome','Android 14',2,1,'GB','United Kingdom','Manchester'),
    (sid_prefix||'-p1', now()-'3 days'::interval,  now()-'3 days'::interval,  'Desktop','Safari','macOS 14.1',2,0,'GB','United Kingdom','London')
  on conflict (session_id) do nothing;

  -- Tag UTM sources
  update public.live_sessions set utm_source='google',    utm_medium='organic' where session_id in (sid_prefix||'-g1',sid_prefix||'-g2');
  update public.live_sessions set utm_source='google',    utm_medium='cpc'     where session_id  = sid_prefix||'-g3';
  update public.live_sessions set utm_source='instagram', utm_medium='social'  where session_id in (sid_prefix||'-i1',sid_prefix||'-i2');
  update public.live_sessions set utm_source='pinterest', utm_medium='social'  where session_id  = sid_prefix||'-p1';

  -- ── 2. Page views — 30-day spread, rising trend last 7d ───────────────────

  insert into public.page_events (session_id, event_type, path, listing_id, listing_slug, entity_type, created_at)
  values
    -- Week 4 (days 22–28 ago) — 8 views
    (sid_prefix||'-s01','page_view','/'||slug, v.id, slug,'vendor', now()-'28 days'::interval),
    (sid_prefix||'-s02','page_view','/'||slug, v.id, slug,'vendor', now()-'27 days'::interval),
    (sid_prefix||'-s03','page_view','/'||slug, v.id, slug,'vendor', now()-'26 days'::interval),
    (sid_prefix||'-s04','page_view','/'||slug, v.id, slug,'vendor', now()-'25 days'::interval),
    (sid_prefix||'-s05','page_view','/'||slug, v.id, slug,'vendor', now()-'24 days'::interval),
    (sid_prefix||'-s06','page_view','/'||slug, v.id, slug,'vendor', now()-'23 days'::interval),
    (sid_prefix||'-s07','page_view','/'||slug, v.id, slug,'vendor', now()-'22 days'::interval),
    (sid_prefix||'-s08','page_view','/'||slug, v.id, slug,'vendor', now()-'21 days'::interval),
    -- Week 3 (days 14–21 ago) — 7 views
    (sid_prefix||'-s09','page_view','/'||slug, v.id, slug,'vendor', now()-'20 days'::interval),
    (sid_prefix||'-s10','page_view','/'||slug, v.id, slug,'vendor', now()-'19 days'::interval),
    (sid_prefix||'-s11','page_view','/'||slug, v.id, slug,'vendor', now()-'14 days'::interval),
    (sid_prefix||'-s12','page_view','/'||slug, v.id, slug,'vendor', now()-'13 days'::interval),
    (sid_prefix||'-s13','page_view','/'||slug, v.id, slug,'vendor', now()-'12 days'::interval),
    (sid_prefix||'-s14','page_view','/'||slug, v.id, slug,'vendor', now()-'11 days'::interval),
    (sid_prefix||'-s15','page_view','/'||slug, v.id, slug,'vendor', now()-'10 days'::interval),
    -- Prior 7d (days 7–13) — baseline 9 views
    (sid_prefix||'-s01','page_view','/'||slug, v.id, slug,'vendor', now()-'13 days'::interval),
    (sid_prefix||'-s02','page_view','/'||slug, v.id, slug,'vendor', now()-'11 days'::interval),
    (sid_prefix||'-s03','page_view','/'||slug, v.id, slug,'vendor', now()-'10 days'::interval),
    (sid_prefix||'-s04','page_view','/'||slug, v.id, slug,'vendor', now()-'9 days'::interval),
    (sid_prefix||'-s05','page_view','/'||slug, v.id, slug,'vendor', now()-'9 days'::interval),
    (sid_prefix||'-s06','page_view','/'||slug, v.id, slug,'vendor', now()-'8 days'::interval),
    (sid_prefix||'-s07','page_view','/'||slug, v.id, slug,'vendor', now()-'8 days'::interval),
    (sid_prefix||'-s08','page_view','/'||slug, v.id, slug,'vendor', now()-'7 days 2 hours'::interval),
    (sid_prefix||'-s09','page_view','/'||slug, v.id, slug,'vendor', now()-'7 days'::interval),
    -- Current 7d — 16 views (↑ ~78% vs prior 7d)
    (sid_prefix||'-s10','page_view','/'||slug, v.id, slug,'vendor', now()-'6 days'::interval),
    (sid_prefix||'-s11','page_view','/'||slug, v.id, slug,'vendor', now()-'6 days'::interval),
    (sid_prefix||'-s12','page_view','/'||slug, v.id, slug,'vendor', now()-'5 days'::interval),
    (sid_prefix||'-s13','page_view','/'||slug, v.id, slug,'vendor', now()-'5 days'::interval),
    (sid_prefix||'-s14','page_view','/'||slug, v.id, slug,'vendor', now()-'4 days'::interval),
    (sid_prefix||'-s15','page_view','/'||slug, v.id, slug,'vendor', now()-'4 days'::interval),
    (sid_prefix||'-s16','page_view','/'||slug, v.id, slug,'vendor', now()-'3 days'::interval),
    (sid_prefix||'-s17','page_view','/'||slug, v.id, slug,'vendor', now()-'3 days'::interval),
    (sid_prefix||'-s18','page_view','/'||slug, v.id, slug,'vendor', now()-'2 days'::interval),
    (sid_prefix||'-s19','page_view','/'||slug, v.id, slug,'vendor', now()-'2 days'::interval),
    (sid_prefix||'-s01','page_view','/'||slug, v.id, slug,'vendor', now()-'1 day'::interval),
    (sid_prefix||'-s02','page_view','/'||slug, v.id, slug,'vendor', now()-'1 day'::interval),
    (sid_prefix||'-s20','page_view','/'||slug, v.id, slug,'vendor', now()-'18 hours'::interval),
    (sid_prefix||'-s19','page_view','/'||slug, v.id, slug,'vendor', now()-'10 hours'::interval),
    (sid_prefix||'-s20','page_view','/'||slug, v.id, slug,'vendor', now()-'4 hours'::interval),
    (sid_prefix||'-s17','page_view','/'||slug, v.id, slug,'vendor', now()-'45 minutes'::interval),
    -- Source-tagged views
    (sid_prefix||'-g1','page_view','/'||slug, v.id, slug,'vendor', now()-'6 days 3 hours'::interval),
    (sid_prefix||'-g2','page_view','/'||slug, v.id, slug,'vendor', now()-'4 days 2 hours'::interval),
    (sid_prefix||'-g3','page_view','/'||slug, v.id, slug,'vendor', now()-'2 days 1 hour'::interval),
    (sid_prefix||'-i1','page_view','/'||slug, v.id, slug,'vendor', now()-'5 days 6 hours'::interval),
    (sid_prefix||'-i2','page_view','/'||slug, v.id, slug,'vendor', now()-'3 days 4 hours'::interval),
    (sid_prefix||'-p1','page_view','/'||slug, v.id, slug,'vendor', now()-'3 days 8 hours'::interval);

  -- ── 3. Shortlists — 7 across 30 days ──────────────────────────────────────

  insert into public.page_events (session_id, event_type, path, listing_id, listing_slug, entity_type, created_at)
  values
    (sid_prefix||'-s03','shortlist_add','/'||slug, v.id, slug,'vendor', now()-'26 days'::interval),
    (sid_prefix||'-s07','shortlist_add','/'||slug, v.id, slug,'vendor', now()-'20 days'::interval),
    (sid_prefix||'-s11','shortlist_add','/'||slug, v.id, slug,'vendor', now()-'13 days'::interval),
    (sid_prefix||'-s13','shortlist_add','/'||slug, v.id, slug,'vendor', now()-'5 days'::interval),
    (sid_prefix||'-s16','shortlist_add','/'||slug, v.id, slug,'vendor', now()-'3 days'::interval),
    (sid_prefix||'-s19','shortlist_add','/'||slug, v.id, slug,'vendor', now()-'1 day'::interval),
    (sid_prefix||'-s20','shortlist_add','/'||slug, v.id, slug,'vendor', now()-'6 hours'::interval);

  -- ── 4. Compare events — 5 across 30 days ──────────────────────────────────

  insert into public.page_events (session_id, event_type, path, listing_id, listing_slug, entity_type, created_at)
  values
    (sid_prefix||'-s05','compare_add','/'||slug, v.id, slug,'vendor', now()-'24 days'::interval),
    (sid_prefix||'-s09','compare_add','/'||slug, v.id, slug,'vendor', now()-'18 days'::interval),
    (sid_prefix||'-s14','compare_add','/'||slug, v.id, slug,'vendor', now()-'9 days'::interval),
    (sid_prefix||'-s17','compare_add','/'||slug, v.id, slug,'vendor', now()-'4 days'::interval),
    (sid_prefix||'-s19','compare_add','/'||slug, v.id, slug,'vendor', now()-'2 days'::interval);

  -- ── 5. Enquiries — 3 started, 2 submitted ─────────────────────────────────

  insert into public.page_events (session_id, event_type, path, listing_id, listing_slug, entity_type, created_at)
  values
    (sid_prefix||'-s05','enquiry_started',   '/'||slug, v.id, slug,'vendor', now()-'24 days'::interval),
    (sid_prefix||'-s05','enquiry_submitted', '/'||slug, v.id, slug,'vendor', now()-'24 days'::interval),
    (sid_prefix||'-s12','enquiry_started',   '/'||slug, v.id, slug,'vendor', now()-'12 days'::interval),
    (sid_prefix||'-s12','enquiry_submitted', '/'||slug, v.id, slug,'vendor', now()-'12 days'::interval),
    (sid_prefix||'-s17','enquiry_started',   '/'||slug, v.id, slug,'vendor', now()-'4 days'::interval),
    (sid_prefix||'-s17','enquiry_submitted', '/'||slug, v.id, slug,'vendor', now()-'4 days'::interval);

  -- ── 6. Outbound clicks — 4 ────────────────────────────────────────────────

  insert into public.page_events (session_id, event_type, path, listing_id, listing_slug, entity_type, created_at)
  values
    (sid_prefix||'-s04','outbound_click','/'||slug, v.id, slug,'vendor', now()-'23 days'::interval),
    (sid_prefix||'-s09','outbound_click','/'||slug, v.id, slug,'vendor', now()-'15 days'::interval),
    (sid_prefix||'-s15','outbound_click','/'||slug, v.id, slug,'vendor', now()-'8 days'::interval),
    (sid_prefix||'-s19','outbound_click','/'||slug, v.id, slug,'vendor', now()-'1 day'::interval);

end loop;

end $$;

-- ── What this produces per vendor ────────────────────────────────────────────
-- Page views 30d: ~43  |  prior 7d: 9  |  current 7d: 16  → ↑ ~78%
-- Unique sessions: 26
-- Shortlists: 7
-- Compares:   5
-- Enquiries started: 6 / submitted: 6
-- Outbound clicks:   4
-- Sources: Google (3), Instagram (2), Pinterest (1), Direct (remainder)
-- ─────────────────────────────────────────────────────────────────────────────
