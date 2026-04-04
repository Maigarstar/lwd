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
begin

-- ── 1. Ensure analytics_enabled = true + tier set for dev vendor ──────────
update public.vendors
set analytics_enabled = true,
    tier = 'featured'
where id = vid;

-- ── 2. Insert 12 months of monthly snapshots ─────────────────────────────
-- Seasonal pattern for a UK luxury venue (peak Apr-Sep, quiet Dec-Jan)
insert into public.vendor_monthly_snapshots
  (vendor_id, month, views, unique_sessions, shortlists, compares,
   enquiry_started, enquiry_submitted, outbound_clicks,
   touch_points, media_value_low, media_value_high,
   est_revenue_low, est_revenue_high, roi_multiple)
values
  (vid, date_trunc('month', now() - interval '12 months')::date,
   312, 241, 18, 7, 5, 3, 22,  340, 3280, 5930,  45000,  54000, 36.2),
  (vid, date_trunc('month', now() - interval '11 months')::date,
   489, 374, 31, 14, 9, 6, 38,  540, 5190, 9480,  90000, 108000, 30.9),
  (vid, date_trunc('month', now() - interval '10 months')::date,
   621, 488, 42, 19, 12, 9, 51, 691, 6620, 11990, 135000, 162000, 46.4),
  (vid, date_trunc('month', now() - interval '9 months')::date,
   584, 452, 38, 17, 11, 8, 47, 647, 6230, 11290, 120000, 144000, 41.2),
  (vid, date_trunc('month', now() - interval '8 months')::date,
   441, 337, 27, 11,  8, 5, 33, 484, 4640,  8410,  75000,  90000, 25.8),
  (vid, date_trunc('month', now() - interval '7 months')::date,
   378, 289, 22,  9,  6, 4, 28, 413, 3950,  7170,  60000,  72000, 20.6),
  (vid, date_trunc('month', now() - interval '6 months')::date,
   298, 231, 17,  6,  5, 3, 19, 324, 3090,  5620,  45000,  54000, 15.5),
  (vid, date_trunc('month', now() - interval '5 months')::date,
   201, 158, 11,  4,  3, 2, 12, 218, 2070,  3770,  30000,  36000, 10.3),
  (vid, date_trunc('month', now() - interval '4 months')::date,
   433, 334, 29, 13,  8, 5, 34, 480, 4600,  8350,  75000,  90000, 25.8),
  (vid, date_trunc('month', now() - interval '3 months')::date,
   512, 397, 36, 16, 10, 7, 41, 571, 5490,  9960, 105000, 126000, 36.1),
  (vid, date_trunc('month', now() - interval '2 months')::date,
   487, 376, 33, 15,  9, 6, 38, 541, 5190,  9410,  90000, 108000, 30.9),
  (vid, date_trunc('month', now() - interval '1 month')::date,
   558, 431, 39, 18, 11, 8, 44, 623, 5990, 10870, 120000, 144000, 41.2)
on conflict (vendor_id, month) do nothing;

-- ── 3. Insert vendor_report_sends history ────────────────────────────────
insert into public.vendor_report_sends
  (id, vendor_id, month, email_address, sent_at, opened_at, outcome_responded)
values
  -- 3 months ago — sent, opened, responded
  (gen_random_uuid(), vid,
   date_trunc('month', now() - interval '3 months')::date,
   'contact@grandpavilion.com',
   date_trunc('month', now() - interval '3 months') + interval '2 days',
   date_trunc('month', now() - interval '3 months') + interval '2 days 4 hours',
   true),
  -- 2 months ago — sent, opened, not responded
  (gen_random_uuid(), vid,
   date_trunc('month', now() - interval '2 months')::date,
   'contact@grandpavilion.com',
   date_trunc('month', now() - interval '2 months') + interval '2 days',
   date_trunc('month', now() - interval '2 months') + interval '3 days 2 hours',
   false),
  -- 1 month ago — sent, opened quickly
  (gen_random_uuid(), vid,
   date_trunc('month', now() - interval '1 month')::date,
   'contact@grandpavilion.com',
   date_trunc('month', now() - interval '1 month') + interval '2 days',
   date_trunc('month', now() - interval '1 month') + interval '2 days 1 hour',
   false)
on conflict (vendor_id, month) do nothing;

end $$;
