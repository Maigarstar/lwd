-- ═══════════════════════════════════════════════════════════════════════════
-- Seed: vendor_monthly_snapshots + vendor_report_sends for dev vendor
-- Date: 2026-04-04
-- Purpose: Populate 12 months of realistic data so the Reporting Hub,
--          Health Scores, and Vendor Performance tabs show live data.
--          Dev vendor: The Grand Pavilion (11111111-1111-1111-1111-111111111113)
-- Run in: Supabase SQL Editor (safe to re-run — ON CONFLICT DO NOTHING)
-- Requires: 20260404_vendor_monthly_snapshots.sql already run
-- ═══════════════════════════════════════════════════════════════════════════

do $$
declare
  vid  uuid := '11111111-1111-1111-1111-111111111113';
  rid  uuid := gen_random_uuid();
begin

-- ── 1. Ensure analytics_enabled = true for dev vendor ────────────────────
update public.vendors
set analytics_enabled = true,
    tier = 'featured'
where id = vid;

-- ── 2. Insert 12 months of monthly snapshots ─────────────────────────────
-- Realistic seasonal pattern for a UK luxury venue:
--   Q1 (Jan-Mar): low/moderate  Q2 (Apr-Jun): peak  Q3 (Jul-Sep): peak  Q4 (Oct-Dec): moderate

insert into public.vendor_monthly_snapshots
  (vendor_id, month, views, unique_sessions, shortlists, compares, enquiries,
   touch_points, media_value_low, media_value_high, est_revenue,
   report_frequency, created_at)
values
  -- 12 months back (May 2025)
  (vid, to_char(date_trunc('month', now()) - interval '12 months', 'YYYY-MM'),
   312, 241, 18, 7, 3, 340, 3280, 5930, 54000, 'monthly', now()),
  -- 11 months (Jun 2025 — peak start)
  (vid, to_char(date_trunc('month', now()) - interval '11 months', 'YYYY-MM'),
   489, 374, 31, 14, 6, 540, 5190, 9480, 108000, 'monthly', now()),
  -- 10 months (Jul 2025 — peak)
  (vid, to_char(date_trunc('month', now()) - interval '10 months', 'YYYY-MM'),
   621, 488, 42, 19, 9, 691, 6620, 11990, 162000, 'monthly', now()),
  -- 9 months (Aug 2025 — peak)
  (vid, to_char(date_trunc('month', now()) - interval '9 months', 'YYYY-MM'),
   584, 452, 38, 17, 8, 647, 6230, 11290, 144000, 'monthly', now()),
  -- 8 months (Sep 2025 — declining)
  (vid, to_char(date_trunc('month', now()) - interval '8 months', 'YYYY-MM'),
   441, 337, 27, 11, 5, 484, 4640, 8410, 90000, 'monthly', now()),
  -- 7 months (Oct 2025)
  (vid, to_char(date_trunc('month', now()) - interval '7 months', 'YYYY-MM'),
   378, 289, 22, 9, 4, 413, 3950, 7170, 72000, 'monthly', now()),
  -- 6 months (Nov 2025)
  (vid, to_char(date_trunc('month', now()) - interval '6 months', 'YYYY-MM'),
   298, 231, 17, 6, 3, 324, 3090, 5620, 54000, 'monthly', now()),
  -- 5 months (Dec 2025 — low)
  (vid, to_char(date_trunc('month', now()) - interval '5 months', 'YYYY-MM'),
   201, 158, 11, 4, 2, 218, 2070, 3770, 36000, 'monthly', now()),
  -- 4 months (Jan 2026 — planning season spike)
  (vid, to_char(date_trunc('month', now()) - interval '4 months', 'YYYY-MM'),
   433, 334, 29, 13, 5, 480, 4600, 8350, 90000, 'monthly', now()),
  -- 3 months (Feb 2026 — engagement ring season)
  (vid, to_char(date_trunc('month', now()) - interval '3 months', 'YYYY-MM'),
   512, 397, 36, 16, 7, 571, 5490, 9960, 126000, 'monthly', now()),
  -- 2 months (Mar 2026)
  (vid, to_char(date_trunc('month', now()) - interval '2 months', 'YYYY-MM'),
   487, 376, 33, 15, 6, 541, 5190, 9410, 108000, 'monthly', now()),
  -- 1 month (Apr 2026 — current peak)
  (vid, to_char(date_trunc('month', now()) - interval '1 month', 'YYYY-MM'),
   558, 431, 39, 18, 8, 623, 5990, 10870, 144000, 'monthly', now())
on conflict (vendor_id, month) do nothing;

-- ── 3. Insert vendor_report_sends history ────────────────────────────────

-- Get or generate a report send ID
rid := gen_random_uuid();

insert into public.vendor_report_sends
  (id, vendor_id, month, sent_at, opened_at, outcome_responded,
   open_token, outcome_token)
values
  -- 3 months ago — sent, opened, responded
  (gen_random_uuid(), vid,
   to_char(date_trunc('month', now()) - interval '3 months', 'YYYY-MM'),
   date_trunc('month', now()) - interval '3 months' + interval '2 days',
   date_trunc('month', now()) - interval '3 months' + interval '2 days 4 hours',
   true,
   encode(gen_random_bytes(16), 'hex'),
   encode(gen_random_bytes(16), 'hex')),
  -- 2 months ago — sent, opened, not responded
  (gen_random_uuid(), vid,
   to_char(date_trunc('month', now()) - interval '2 months', 'YYYY-MM'),
   date_trunc('month', now()) - interval '2 months' + interval '2 days',
   date_trunc('month', now()) - interval '2 months' + interval '3 days 2 hours',
   false,
   encode(gen_random_bytes(16), 'hex'),
   encode(gen_random_bytes(16), 'hex')),
  -- 1 month ago — sent, opened immediately
  (gen_random_uuid(), vid,
   to_char(date_trunc('month', now()) - interval '1 month', 'YYYY-MM'),
   date_trunc('month', now()) - interval '1 month' + interval '2 days',
   date_trunc('month', now()) - interval '1 month' + interval '2 days 1 hour',
   false,
   encode(gen_random_bytes(16), 'hex'),
   encode(gen_random_bytes(16), 'hex'))
on conflict do nothing;

end $$;
