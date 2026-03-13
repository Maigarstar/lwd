-- ============================================================
-- Magazine Studio — Core Tables
-- 20260312_magazine_tables.sql
--
-- Tables:
--   magazine_categories   — category config (hero, SEO, card style)
--   magazine_posts        — article metadata + hero + SEO fields
--   magazine_blocks       — structured block content (AI-insertable)
--   magazine_media        — uploaded media tracking
--   magazine_homepage     — homepage section config (single-row)
--
-- RLS disabled — admin-only writes via anon key (Phase 1)
-- ============================================================


-- ── 0. Helper: update_updated_at trigger function ─────────────────────────────
-- Reuse if already exists from other migrations
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ── 1. magazine_categories ────────────────────────────────────────────────────
create table if not exists magazine_categories (
  id              uuid        primary key default gen_random_uuid(),
  slug            text        unique not null,
  name            text        not null,
  description     text,
  hero_image      text,
  accent_color    text        default '#c9a96e',
  hero_title      text,
  card_style      text        default 'standard',  -- standard | overlay | editorial | horizontal
  sort_order      text        default 'latest',    -- latest | popular | alpha
  seo_title       text,
  seo_description text,
  seo_keywords    text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table magazine_categories disable row level security;

create trigger magazine_categories_updated_at
  before update on magazine_categories
  for each row execute function update_updated_at_column();

comment on table magazine_categories  is 'Magazine category configuration — hero, card style, SEO';
comment on column magazine_categories.slug is 'Unique URL slug matching the static CATEGORIES id (e.g. destinations)';


-- ── 2. magazine_posts ─────────────────────────────────────────────────────────
create table if not exists magazine_posts (
  -- Identity
  id                   uuid        primary key default gen_random_uuid(),
  slug                 text        unique not null,

  -- Core content
  title                text        not null default '',
  excerpt              text,
  standfirst           text,

  -- Category
  category_slug        text        references magazine_categories(slug) on delete set null,
  category_label       text,

  -- Author (stored as JSON for flexibility — no separate authors table in Phase 1)
  -- Shape: { id, name, role, bio, avatar }
  author_data          jsonb,

  -- Taxonomy
  tags                 text[]      default '{}',

  -- Publishing
  reading_time         int         default 5,
  published            boolean     default false,
  published_at         timestamptz,
  featured             boolean     default false,
  trending             boolean     default false,

  -- Layout
  layout               text        default 'full-width',  -- full-width | sidebar
  hero_style           text        default 'editorial',   -- editorial | split | grid | carousel
  hero_height          text        default 'standard',    -- standard | tall | short

  -- Hero image / video
  cover_image          text,
  cover_image_alt      text,
  cover_image_credit   text,
  hero_video_url       text,

  -- Hero controls
  hero_overlay_opacity int         default 60,   -- 0–90
  hero_focal_point     text        default 'center',
  hero_title_position  text        default 'bottom', -- bottom | center | top

  -- Editorial tone (for AI tools)
  tone                 text        default 'Luxury Editorial',

  -- SEO / Open Graph
  seo_title            text,
  meta_description     text,
  og_title             text,
  og_description       text,
  og_image             text,

  -- Timestamps
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

alter table magazine_posts disable row level security;

create index if not exists magazine_posts_slug_idx        on magazine_posts(slug);
create index if not exists magazine_posts_published_idx   on magazine_posts(published, published_at desc);
create index if not exists magazine_posts_category_idx    on magazine_posts(category_slug);
create index if not exists magazine_posts_featured_idx    on magazine_posts(featured) where featured = true;
create index if not exists magazine_posts_trending_idx    on magazine_posts(trending) where trending = true;

create trigger magazine_posts_updated_at
  before update on magazine_posts
  for each row execute function update_updated_at_column();

comment on table  magazine_posts                      is 'Magazine article metadata, hero config, and SEO fields';
comment on column magazine_posts.author_data          is 'JSON: { id, name, role, bio, avatar }';
comment on column magazine_posts.tags                 is 'Array of text tags for filtering and AI context';
comment on column magazine_posts.hero_overlay_opacity is '0–90 integer, rendered as rgba(0,0,0,opacity/100)';


-- ── 3. magazine_blocks ────────────────────────────────────────────────────────
-- Structured per-block content storage.
-- AI-insertable: the AI engine can INSERT rows directly without a full post save.
-- block_order uses integers; fractional/gap ordering is allowed for AI insertion.
-- Cascade delete ensures blocks are removed when the post is deleted.
create table if not exists magazine_blocks (
  id            uuid    primary key default gen_random_uuid(),
  post_id       uuid    not null references magazine_posts(id) on delete cascade,
  block_type    text    not null,  -- intro | paragraph | body_wysiwyg | heading | image | video |
                                   -- quote | divider | gallery | slider | masonry | dual_image |
                                   -- lookbook | before_after | video_gallery | embed | etc.
  block_order   int     not null,  -- ascending; gaps allowed for AI mid-insertion
  block_content jsonb   not null default '{}'
  -- block_content shape varies by block_type:
  -- intro/paragraph:  { text: string }
  -- body_wysiwyg:      { text: string (HTML) }
  -- heading:           { text, level: 1-4 }
  -- image:             { src, alt, caption, credit, wide: bool, focal }
  -- video:             { src, poster, controls, autoplay, muted, loop, caption, credit }
  -- quote:             { text, attribution }
  -- gallery/slider/masonry/lookbook: { images: [{src,alt,caption,credit}], columns?, autoplay?, ... }
  -- dual_image:        { imageA: {src,alt,...}, imageB: {src,alt,...}, layout: '50/50'|'60/40'|'40/60' }
  -- before_after:      { before: {src,alt,...}, after: {src,alt,...}, beforeLabel, afterLabel }
  -- video_gallery:     { videos: [{src,poster,title,caption,credit}] }
  -- embed:             { url, caption }
);

alter table magazine_blocks disable row level security;

create index if not exists magazine_blocks_post_order_idx on magazine_blocks(post_id, block_order);

comment on table  magazine_blocks             is 'Per-block content for magazine articles. AI-insertable — each row is one content block.';
comment on column magazine_blocks.block_order is 'Render order (ASC). Gaps allowed; AI can insert between existing blocks.';
comment on column magazine_blocks.block_content is 'JSON payload varies by block_type — see column comment for shape per type.';


-- ── 4. magazine_media ─────────────────────────────────────────────────────────
-- Tracks every file uploaded through MagazineMediaUploader.
-- Populated by trackMediaUpload() in magazineService.js.
create table if not exists magazine_media (
  id          uuid        primary key default gen_random_uuid(),
  file_url    text        not null,
  title       text,
  alt_text    text,
  caption     text,
  credit      text,
  uploaded_at timestamptz default now()
);

alter table magazine_media disable row level security;

create index if not exists magazine_media_uploaded_idx on magazine_media(uploaded_at desc);

comment on table magazine_media is 'Tracks media uploaded via Magazine Studio. Populated by trackMediaUpload().';


-- ── 5. magazine_homepage ──────────────────────────────────────────────────────
-- Single-row table storing the homepage section config.
-- sections JSON shape: [{ id, label, visible, config: { style?, count?, title?, ... } }]
create table if not exists magazine_homepage (
  id         uuid        primary key default gen_random_uuid(),
  sections   jsonb       not null default '[]',
  updated_at timestamptz default now()
);

alter table magazine_homepage disable row level security;

create trigger magazine_homepage_updated_at
  before update on magazine_homepage
  for each row execute function update_updated_at_column();

comment on table  magazine_homepage          is 'Single-row homepage section configuration. Upserted by HomepageEditor.';
comment on column magazine_homepage.sections is 'JSON array of section configs — visibility, order, hero style, card style, titles.';
