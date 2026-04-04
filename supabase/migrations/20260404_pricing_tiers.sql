-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: pricing_tiers
-- Date: 2026-04-04
-- Purpose: Store official tier pricing so ROI calculations use live values
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.pricing_tiers (
  tier          text primary key,
  display_name  text not null,
  monthly_price numeric(10,2) not null,
  annual_price  numeric(10,2) not null,
  color         text,
  is_active     boolean default true,
  updated_at    timestamptz default now()
);

insert into public.pricing_tiers (tier, display_name, monthly_price, annual_price, color) values
  ('standard', 'Standard',  149.00,  1490.00, '#6b7280'),
  ('featured',  'Featured',  349.00,  3490.00, '#C9A84C'),
  ('showcase',  'Showcase',  699.00,  6990.00, '#8b5cf6')
on conflict (tier) do nothing;

-- RPC to get current tier pricing (used by analytics panel)
create or replace function public.get_pricing_tiers()
returns table (tier text, display_name text, monthly_price numeric, annual_price numeric, color text)
language sql security definer stable
as $$
  select tier, display_name, monthly_price, annual_price, color
  from public.pricing_tiers
  where is_active = true
  order by monthly_price;
$$;

grant execute on function public.get_pricing_tiers() to anon, authenticated;

-- Allow admins to update pricing
alter table public.pricing_tiers enable row level security;
create policy "Public read" on public.pricing_tiers for select using (true);
create policy "Admin write" on public.pricing_tiers for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
