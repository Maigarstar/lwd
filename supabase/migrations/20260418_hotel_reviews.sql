-- ─────────────────────────────────────────────────────────────────────────────
-- The LWD Hotel Review — data model
-- Supports: editorial, sponsored, self_serve review types
-- Public page fields included (nullable) so Phase 2 publishing requires no migration
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists magazine_hotel_reviews (
  id                  uuid        primary key default gen_random_uuid(),

  -- Identity
  hotel_name          text        not null,
  location            text,
  star_rating         int         check (star_rating between 1 and 5),
  price_range         text        check (price_range in ('£','££','£££','££££')),

  -- Commercial type
  review_type         text        not null default 'editorial'
                        check (review_type in ('editorial','sponsored','self_serve')),

  -- Linked directory listing (Fill From Listing)
  source_listing_id   uuid        references listings(id) on delete set null,

  -- Editorial copy
  headline            text,
  standfirst          text,
  review_text         text,   -- raw user notes / paste-in

  -- AI-structured section content
  sections            jsonb       default '{}',
  -- { arrival, rooms, dining, spa, bar, pool, location, wedding }

  -- Structured metadata
  key_facts           jsonb       default '{}',
  -- { capacity, style, bestFor, priceGuide, rooms, ceremonies }

  verdict             text,
  best_for            text[]      default '{}',

  -- Ratings (1–10)
  rating_rooms        int         check (rating_rooms between 1 and 10),
  rating_dining       int         check (rating_dining between 1 and 10),
  rating_service      int         check (rating_service between 1 and 10),
  rating_value        int         check (rating_value between 1 and 10),
  rating_location     int         check (rating_location between 1 and 10),

  -- Images: [{url, category, isHero, storageKey}]
  -- category: 'exterior'|'rooms'|'dining'|'spa'|'details'|'wedding'
  images              jsonb       default '[]',

  -- Sections included in this review
  sections_config     jsonb       default '{"arrival":true,"rooms":true,"dining":true,"spa":false,"bar":false,"wedding":true}',

  -- Publishing (Phase 2 — nullable today, ready to use)
  slug                text        unique,
  is_public           boolean     default false,
  published_url       text,
  published_at        timestamptz,
  status              text        default 'draft'
                        check (status in ('draft','review','published')),

  -- Meta
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table magazine_hotel_reviews enable row level security;
create policy "allow_all" on magazine_hotel_reviews for all using (true) with check (true);

-- Auto-update updated_at
create or replace function update_hotel_review_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger hotel_review_updated_at
  before update on magazine_hotel_reviews
  for each row execute function update_hotel_review_updated_at();
