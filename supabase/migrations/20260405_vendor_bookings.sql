-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: vendor_bookings
-- Date: 2026-04-05
-- Purpose: Vendors mark confirmed bookings from LWD enquiries.
--          Turns ROI projection → verified truth.
--          Powers "Confirmed vs Estimated" split in Revenue Impact card.
-- Run in: Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.vendor_bookings (
  id             uuid         primary key default gen_random_uuid(),
  vendor_id      uuid         not null references public.vendors(id) on delete cascade,
  booking_value  numeric      not null default 0,        -- actual booking value £
  booking_date   date         not null default current_date,
  source         text         not null default 'lwd'
    check (source in ('lwd', 'direct', 'other')),
  notes          text         default null,
  created_at     timestamptz  not null default now()
);

create index if not exists idx_vendor_bookings_vendor_id
  on public.vendor_bookings (vendor_id, booking_date desc);

-- RLS: vendors can only see/write their own bookings
alter table public.vendor_bookings enable row level security;

create policy "vendor_bookings_vendor_rw"
  on public.vendor_bookings
  using  (auth.uid() = vendor_id)
  with check (auth.uid() = vendor_id);

create policy "vendor_bookings_admin_read"
  on public.vendor_bookings for select
  using (
    coalesce((auth.jwt() ->> 'is_admin')::boolean, false) = true
  );

-- RPC: get booking totals for a vendor within a date range
create or replace function public.get_vendor_booking_totals(
  p_vendor_id  uuid,
  p_from       timestamptz default now() - interval '30 days',
  p_to         timestamptz default now()
)
returns table (
  total_bookings  bigint,
  total_revenue   numeric
)
language sql
security definer
stable
as $$
  select
    count(*)         as total_bookings,
    coalesce(sum(booking_value), 0) as total_revenue
  from public.vendor_bookings
  where vendor_id = p_vendor_id
    and created_at >= p_from
    and created_at <= p_to;
$$;

grant execute on function public.get_vendor_booking_totals to authenticated;
