-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: vendor ROI settings
-- Date: 2026-04-04
-- Purpose: Store vendor's personalised ROI assumptions.
--          avg_booking_value + est_close_rate power the Revenue Impact card.
--          report_frequency controls monthly vs quarterly email cadence.
-- Run in: Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.vendors
  add column if not exists avg_booking_value   numeric      default null,
  add column if not exists est_close_rate      numeric      default null,   -- 0–100
  add column if not exists roi_settings_set_at timestamptz  default null,
  add column if not exists report_frequency    text         default 'monthly'
    check (report_frequency in ('monthly', 'quarterly'));

-- RLS: vendors can update their own ROI settings
create policy "vendor update own roi settings"
  on public.vendors for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RPC: save ROI settings (called from analytics panel)
create or replace function public.save_vendor_roi_settings(
  p_vendor_id       uuid,
  p_booking_value   numeric,
  p_close_rate      numeric
)
returns void
language sql
security definer
as $$
  update public.vendors
  set
    avg_booking_value   = p_booking_value,
    est_close_rate      = p_close_rate,
    roi_settings_set_at = now()
  where id = p_vendor_id;
$$;

grant execute on function public.save_vendor_roi_settings to anon, authenticated;

-- RPC: get vendor ROI settings (used by analytics panel on load)
create or replace function public.get_vendor_roi_settings(
  p_vendor_id uuid
)
returns table (
  avg_booking_value   numeric,
  est_close_rate      numeric,
  roi_settings_set_at timestamptz,
  report_frequency    text
)
language sql
security definer
stable
as $$
  select
    avg_booking_value,
    est_close_rate,
    roi_settings_set_at,
    report_frequency
  from public.vendors
  where id = p_vendor_id;
$$;

grant execute on function public.get_vendor_roi_settings to anon, authenticated;
