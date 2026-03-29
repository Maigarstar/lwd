-- ═══════════════════════════════════════════════════════════════════════════
-- Create categories table for dynamic category grid
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.categories (
  id text primary key,
  label text not null,
  image text,
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Insert default categories (matching the fallback in CategoryGrid.jsx)
insert into public.categories (id, label, image, position, active) values
  ('planners', 'Wedding Planners', 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80', 0, true),
  ('photographers', 'Photographers', 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&w=800&q=80', 1, true),
  ('venues', 'Venues', 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80', 2, true),
  ('flowers', 'Flowers & Floristry', 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&w=800&q=80', 3, true),
  ('videographers', 'Videographers', 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=800&q=80', 4, true),
  ('hair-makeup', 'Hair & Makeup', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80', 5, true),
  ('styling-decor', 'Styling & Décor', 'https://images.unsplash.com/photo-1478146059778-26028b07395a?auto=format&fit=crop&w=800&q=80', 6, true),
  ('cakes', 'Wedding Cakes', 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&w=800&q=80', 7, true),
  ('bridal-dresses', 'Bridal Fashion', 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=800&q=80', 8, true),
  ('entertainment', 'Entertainment', 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=800&q=80', 9, true)
on conflict (id) do nothing;

-- Enable RLS
alter table public.categories enable row level security;

-- Allow anon users to read categories
create policy "Categories are publicly readable"
  on public.categories for select
  using (true);

-- Allow authenticated users (admins) to manage categories
create policy "Admins can manage categories"
  on public.categories
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
