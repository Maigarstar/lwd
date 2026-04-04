-- ═══════════════════════════════════════════════════════════════════════════
-- Seed: dummy analytics data for dev vendor (The Grand Pavilion)
-- listing_id: 11111111-1111-1111-1111-111111111113
-- Run once in Supabase SQL Editor.
-- page_events.session_id has a FK → live_sessions, so sessions inserted first.
-- ═══════════════════════════════════════════════════════════════════════════

do $$
declare
  vid  uuid := '11111111-1111-1111-1111-111111111113';
  slug text := 'the-grand-pavilion';
  etype text := 'vendor';

  cA uuid := '22222222-2222-2222-2222-222222222221';
  cB uuid := '22222222-2222-2222-2222-222222222222';
  cC uuid := '22222222-2222-2222-2222-222222222223';

begin

-- ── 1. Insert live_sessions for every session_id used in page_events ─────────

insert into public.live_sessions (session_id, first_seen_at, last_seen_at, device_type, browser, os, page_count, intent_count)
values
  ('sess-dev-001', now() - interval '28 days', now() - interval '27 days', 'Desktop', 'Chrome',  'Windows 10/11', 3, 0),
  ('sess-dev-002', now() - interval '27 days', now() - interval '26 days', 'Mobile',  'Safari',  'iOS 17.1',      2, 0),
  ('sess-dev-003', now() - interval '26 days', now() - interval '25 days', 'Desktop', 'Chrome',  'macOS 14.2',    4, 1),
  ('sess-dev-004', now() - interval '25 days', now() - interval '24 days', 'Desktop', 'Firefox', 'Windows 10/11', 2, 0),
  ('sess-dev-005', now() - interval '24 days', now() - interval '23 days', 'Mobile',  'Chrome',  'Android 14',    3, 1),
  ('sess-dev-006', now() - interval '23 days', now() - interval '22 days', 'Desktop', 'Safari',  'macOS 14.1',    2, 0),
  ('sess-dev-007', now() - interval '22 days', now() - interval '21 days', 'Desktop', 'Chrome',  'Windows 10/11', 5, 1),
  ('sess-dev-008', now() - interval '22 days', now() - interval '21 days', 'Tablet',  'Safari',  'iOS 17.0',      3, 0),
  ('sess-dev-009', now() - interval '21 days', now() - interval '20 days', 'Desktop', 'Chrome',  'macOS 13.6',    4, 1),
  ('sess-dev-010', now() - interval '20 days', now() - interval '19 days', 'Mobile',  'Safari',  'iOS 16.7',      2, 0),
  ('sess-dev-011', now() - interval '18 days', now() - interval '17 days', 'Desktop', 'Edge',    'Windows 10/11', 3, 1),
  ('sess-dev-012', now() - interval '18 days', now() - interval '17 days', 'Desktop', 'Chrome',  'macOS 14.3',    6, 2),
  ('sess-dev-013', now() - interval '17 days', now() - interval '16 days', 'Mobile',  'Chrome',  'Android 13',    3, 1),
  ('sess-dev-014', now() - interval '16 days', now() - interval '15 days', 'Desktop', 'Chrome',  'Windows 10/11', 4, 1),
  ('sess-dev-015', now() - interval '15 days', now() - interval '14 days', 'Desktop', 'Firefox', 'macOS 14.2',    2, 0),
  ('sess-dev-016', now() - interval '15 days', now() - interval '14 days', 'Mobile',  'Safari',  'iOS 17.2',      3, 1),
  ('sess-dev-017', now() - interval '14 days', now() - interval '13 days', 'Desktop', 'Chrome',  'Windows 10/11', 5, 1),
  ('sess-dev-018', now() - interval '14 days', now() - interval '13 days', 'Desktop', 'Safari',  'macOS 14.3',    4, 0),
  ('sess-dev-019', now() - interval '7 days',  now() - interval '45 minutes', 'Desktop', 'Chrome', 'Windows 10/11', 4, 1),
  ('sess-dev-020', now() - interval '2 hours', now() - interval '2 hours', 'Mobile', 'Safari', 'iOS 17.3', 2, 0),
  -- Source-tagged sessions
  ('src-g-001', now() - interval '6 days', now() - interval '6 days', 'Desktop', 'Chrome',  'Windows 10/11', 2, 0),
  ('src-g-002', now() - interval '5 days', now() - interval '5 days', 'Desktop', 'Chrome',  'macOS 14.2',    3, 0),
  ('src-g-003', now() - interval '4 days', now() - interval '4 days', 'Desktop', 'Chrome',  'Windows 10/11', 2, 0),
  ('src-g-004', now() - interval '3 days', now() - interval '3 days', 'Mobile',  'Chrome',  'Android 14',    2, 0),
  ('src-g-005', now() - interval '2 days', now() - interval '2 days', 'Desktop', 'Chrome',  'macOS 14.3',    3, 1),
  ('src-g-006', now() - interval '1 day',  now() - interval '1 day',  'Desktop', 'Chrome',  'Windows 10/11', 2, 0),
  ('src-i-001', now() - interval '6 days', now() - interval '6 days', 'Mobile',  'Safari',  'iOS 17.2',      2, 0),
  ('src-i-002', now() - interval '4 days', now() - interval '4 days', 'Mobile',  'Safari',  'iOS 17.1',      3, 1),
  ('src-i-003', now() - interval '2 days', now() - interval '2 days', 'Mobile',  'Chrome',  'Android 13',    2, 0),
  ('src-i-004', now() - interval '18 hours', now() - interval '18 hours', 'Mobile', 'Safari', 'iOS 17.3',   2, 0),
  ('src-p-001', now() - interval '5 days', now() - interval '5 days', 'Desktop', 'Safari',  'macOS 14.1',    2, 0),
  ('src-p-002', now() - interval '3 days', now() - interval '3 days', 'Mobile',  'Safari',  'iOS 16.7',      2, 0),
  ('src-d-001', now() - interval '5 days', now() - interval '5 days', 'Desktop', 'Chrome',  'Windows 10/11', 3, 0),
  ('src-d-002', now() - interval '4 days', now() - interval '4 days', 'Desktop', 'Firefox', 'macOS 14.2',    2, 0),
  ('src-d-003', now() - interval '1 day',  now() - interval '1 day',  'Desktop', 'Edge',    'Windows 10/11', 2, 0),
  -- Compare sessions
  ('cmp-sess-01', now() - interval '25 days', now() - interval '25 days', 'Desktop', 'Chrome',  'macOS 14.0',    5, 2),
  ('cmp-sess-02', now() - interval '19 days', now() - interval '19 days', 'Desktop', 'Chrome',  'Windows 10/11', 6, 3),
  ('cmp-sess-03', now() - interval '12 days', now() - interval '12 days', 'Desktop', 'Firefox', 'macOS 14.2',    4, 2),
  ('cmp-sess-04', now() - interval '9 days',  now() - interval '9 days',  'Mobile',  'Safari',  'iOS 17.1',      3, 1),
  ('cmp-sess-05', now() - interval '5 days',  now() - interval '5 days',  'Desktop', 'Chrome',  'Windows 10/11', 5, 2),
  ('cmp-sess-06', now() - interval '2 days',  now() - interval '2 days',  'Desktop', 'Safari',  'macOS 14.3',    4, 2),
  ('cmp-sess-07', now() - interval '1 day',   now() - interval '1 day',   'Mobile',  'Chrome',  'Android 14',    3, 1),
  ('cmp-sess-08', now() - interval '4 hours', now() - interval '4 hours', 'Desktop', 'Chrome',  'macOS 14.3',    4, 2),
  -- Live sessions (right now)
  ('live-dev-now-001', now() - interval '4 minutes', now() - interval '30 seconds', 'Desktop', 'Chrome', 'macOS 14.3', 3, 1),
  ('live-dev-now-002', now() - interval '2 minutes', now() - interval '10 seconds', 'Mobile',  'Safari', 'iOS 17.2',   1, 0)
on conflict (session_id) do update set last_seen_at = excluded.last_seen_at;

-- ── 2. Update live sessions with current listing context ──────────────────────
update public.live_sessions set
  current_listing_id   = vid,
  current_listing_slug = slug,
  current_entity_type  = etype,
  country_code = 'GB', country_name = 'United Kingdom', city = 'London'
where session_id = 'live-dev-now-001';

update public.live_sessions set
  current_listing_id   = vid,
  current_listing_slug = slug,
  current_entity_type  = etype,
  country_code = 'AU', country_name = 'Australia', city = 'Sydney'
where session_id = 'live-dev-now-002';

-- ── 3. Page views — spread across 30 days ────────────────────────────────────

-- Days 22–28 ago
insert into public.page_events (session_id, event_type, path, listing_id, listing_slug, entity_type, created_at) values
  ('sess-dev-001', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '28 days'),
  ('sess-dev-002', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '27 days'),
  ('sess-dev-003', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '26 days'),
  ('sess-dev-004', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '25 days'),
  ('sess-dev-005', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '24 days'),
  ('sess-dev-006', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '23 days'),
  ('sess-dev-007', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '22 days'),
  ('sess-dev-008', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '22 days');

-- Days 14–21 ago
insert into public.page_events (session_id, event_type, path, listing_id, listing_slug, entity_type, created_at) values
  ('sess-dev-009', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '21 days'),
  ('sess-dev-010', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '20 days'),
  ('sess-dev-011', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '18 days'),
  ('sess-dev-012', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '18 days'),
  ('sess-dev-013', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '17 days'),
  ('sess-dev-014', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '16 days'),
  ('sess-dev-015', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '15 days'),
  ('sess-dev-016', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '15 days'),
  ('sess-dev-017', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '14 days'),
  ('sess-dev-018', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '14 days');

-- Prior 7d (days 7–13 ago) — baseline for delta comparison
insert into public.page_events (session_id, event_type, path, listing_id, listing_slug, entity_type, created_at) values
  ('sess-dev-001', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '13 days'),
  ('sess-dev-002', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '12 days'),
  ('sess-dev-003', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '11 days'),
  ('sess-dev-004', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '11 days'),
  ('sess-dev-005', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '10 days'),
  ('sess-dev-006', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '10 days'),
  ('sess-dev-007', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '9 days'),
  ('sess-dev-008', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '9 days'),
  ('sess-dev-009', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '8 days'),
  ('sess-dev-010', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '8 days'),
  ('sess-dev-019', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '7 days 2 hours');

-- Current 7d — stronger week (positive delta)
insert into public.page_events (session_id, event_type, path, listing_id, listing_slug, entity_type, created_at) values
  ('sess-dev-011', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '6 days'),
  ('sess-dev-012', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '6 days'),
  ('sess-dev-013', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '5 days'),
  ('sess-dev-014', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '5 days'),
  ('sess-dev-015', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '4 days'),
  ('sess-dev-016', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '4 days'),
  ('sess-dev-017', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '3 days'),
  ('sess-dev-018', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '3 days'),
  ('sess-dev-001', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '2 days'),
  ('sess-dev-002', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '2 days'),
  ('sess-dev-003', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '2 days'),
  ('sess-dev-004', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '1 day'),
  ('sess-dev-005', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '1 day'),
  ('sess-dev-006', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '22 hours'),
  ('sess-dev-007', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '18 hours'),
  ('sess-dev-008', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '14 hours'),
  ('sess-dev-009', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '10 hours'),
  ('sess-dev-010', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '6 hours'),
  ('sess-dev-020', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '2 hours'),
  ('sess-dev-019', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '45 minutes');

-- ── 4. Source-tagged page views (plain — utm lives on live_sessions) ──────────
-- Sessions already inserted above with utm_source set on live_sessions.
-- These page_events just link back by session_id.
insert into public.page_events (session_id, event_type, path, listing_id, listing_slug, entity_type, created_at) values
  ('src-g-001', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '6 days 3 hours'),
  ('src-g-002', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '5 days 7 hours'),
  ('src-g-003', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '4 days 2 hours'),
  ('src-g-004', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '3 days 5 hours'),
  ('src-g-005', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '2 days 1 hour'),
  ('src-g-006', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '1 day 4 hours'),
  ('src-i-001', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '6 days 1 hour'),
  ('src-i-002', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '4 days 9 hours'),
  ('src-i-003', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '2 days 6 hours'),
  ('src-i-004', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '18 hours'),
  ('src-p-001', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '5 days 2 hours'),
  ('src-p-002', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '3 days 8 hours'),
  ('src-d-001', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '5 days 5 hours'),
  ('src-d-002', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '4 days 3 hours'),
  ('src-d-003', 'page_view', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '1 day 2 hours');

-- ── 4b. Set utm_source on the corresponding live_sessions ────────────────────
update public.live_sessions set utm_source = 'google',    utm_medium = 'organic' where session_id in ('src-g-001','src-g-002','src-g-004','src-g-005','src-g-006');
update public.live_sessions set utm_source = 'google',    utm_medium = 'cpc'     where session_id = 'src-g-003';
update public.live_sessions set utm_source = 'instagram', utm_medium = 'social'  where session_id in ('src-i-001','src-i-002','src-i-003','src-i-004');
update public.live_sessions set utm_source = 'pinterest', utm_medium = 'social'  where session_id in ('src-p-001','src-p-002');

-- ── 5. Shortlists ────────────────────────────────────────────────────────────
insert into public.page_events (session_id, event_type, path, listing_id, listing_slug, entity_type, created_at) values
  ('sess-dev-003', 'shortlist_add', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '26 days'),
  ('sess-dev-007', 'shortlist_add', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '20 days'),
  ('sess-dev-011', 'shortlist_add', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '13 days'),
  ('sess-dev-015', 'shortlist_add', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '8 days'),
  ('sess-dev-013', 'shortlist_add', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '5 days'),
  ('sess-dev-017', 'shortlist_add', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '3 days'),
  ('sess-dev-020', 'shortlist_add', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '1 day'),
  ('sess-dev-019', 'shortlist_add', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '6 hours');

-- ── 6. Compare events — our listing ──────────────────────────────────────────
insert into public.page_events (session_id, event_type, path, listing_id, listing_slug, entity_type, created_at) values
  ('cmp-sess-01', 'compare_add', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '25 days'),
  ('cmp-sess-02', 'compare_add', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '19 days'),
  ('cmp-sess-03', 'compare_add', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '12 days'),
  ('cmp-sess-04', 'compare_add', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '9 days'),
  ('cmp-sess-05', 'compare_add', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '5 days'),
  ('cmp-sess-06', 'compare_add', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '2 days'),
  ('cmp-sess-07', 'compare_add', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '1 day'),
  ('cmp-sess-08', 'compare_add', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '4 hours');

-- ── 7. Compare events — competitors in the same sessions ─────────────────────
insert into public.page_events (session_id, event_type, path, listing_id, listing_slug, entity_type, created_at) values
  ('cmp-sess-01', 'compare_add', '/venue/villa-la-selva',   cA, 'villa-la-selva',   'venue', now() - interval '25 days'),
  ('cmp-sess-02', 'compare_add', '/venue/villa-la-selva',   cA, 'villa-la-selva',   'venue', now() - interval '19 days'),
  ('cmp-sess-04', 'compare_add', '/venue/villa-la-selva',   cA, 'villa-la-selva',   'venue', now() - interval '9 days'),
  ('cmp-sess-06', 'compare_add', '/venue/villa-la-selva',   cA, 'villa-la-selva',   'venue', now() - interval '2 days'),
  ('cmp-sess-07', 'compare_add', '/venue/villa-la-selva',   cA, 'villa-la-selva',   'venue', now() - interval '1 day'),
  ('cmp-sess-02', 'compare_add', '/venue/chateau-du-bois',  cB, 'chateau-du-bois',  'venue', now() - interval '19 days'),
  ('cmp-sess-03', 'compare_add', '/venue/chateau-du-bois',  cB, 'chateau-du-bois',  'venue', now() - interval '12 days'),
  ('cmp-sess-05', 'compare_add', '/venue/chateau-du-bois',  cB, 'chateau-du-bois',  'venue', now() - interval '5 days'),
  ('cmp-sess-08', 'compare_add', '/venue/chateau-du-bois',  cB, 'chateau-du-bois',  'venue', now() - interval '4 hours'),
  ('cmp-sess-03', 'compare_add', '/venue/borgo-di-castelo', cC, 'borgo-di-castelo', 'venue', now() - interval '12 days'),
  ('cmp-sess-06', 'compare_add', '/venue/borgo-di-castelo', cC, 'borgo-di-castelo', 'venue', now() - interval '2 days');

-- ── 8. Enquiries ─────────────────────────────────────────────────────────────
insert into public.page_events (session_id, event_type, path, listing_id, listing_slug, entity_type, created_at) values
  ('sess-dev-005', 'enquiry_started',   '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '24 days'),
  ('sess-dev-005', 'enquiry_submitted', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '24 days'),
  ('sess-dev-012', 'enquiry_started',   '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '16 days'),
  ('sess-dev-012', 'enquiry_submitted', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '16 days'),
  ('sess-dev-016', 'enquiry_started',   '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '9 days'),
  ('sess-dev-018', 'enquiry_started',   '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '7 days'),
  ('sess-dev-013', 'enquiry_started',   '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '4 days'),
  ('sess-dev-013', 'enquiry_submitted', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '4 days'),
  ('sess-dev-020', 'enquiry_started',   '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '3 hours'),
  ('sess-dev-020', 'enquiry_submitted', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '3 hours');

-- ── 9. Outbound clicks ────────────────────────────────────────────────────────
insert into public.page_events (session_id, event_type, path, listing_id, listing_slug, entity_type, created_at) values
  ('sess-dev-004', 'outbound_click', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '23 days'),
  ('sess-dev-009', 'outbound_click', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '15 days'),
  ('sess-dev-014', 'outbound_click', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '8 days'),
  ('sess-dev-017', 'outbound_click', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '3 days'),
  ('sess-dev-019', 'outbound_click', '/vendor/the-grand-pavilion', vid, slug, etype, now() - interval '30 minutes');

end $$;

-- ── What this produces ────────────────────────────────────────────────────────
-- Views  7d: ~20  |  prior 7d: ~11  →  ↑ ~82%
-- Unique 7d: ~15  |  prior 7d: ~9   →  ↑ ~67%
-- Shortlists 7d: 3  |  prior: 2     →  ↑ 50%
-- Enquiries  7d: 2  |  prior: 1     →  ↑ 100%
-- Conversion: ~10%
-- Live right now: 2 visitors
-- Sources: Google (6), Instagram (4), Direct (3), Pinterest (2)
-- Compare peers: Villa La Selva (5×), Chateau du Bois (4×), Borgo di Castelo (2×)
-- 30-day sparkline: low → steady → rising curve
-- ─────────────────────────────────────────────────────────────────────────────
