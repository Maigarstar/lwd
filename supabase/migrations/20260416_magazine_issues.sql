-- ============================================================
-- LWD Magazine Issues — Phase 1A Schema
-- 20260416_magazine_issues.sql
--
-- Tables:
--   magazine_issues       — issue metadata, PDF refs, editorial status
--   magazine_issue_pages  — per-page image + thumbnail refs
--   magazine_analytics    — reader event tracking (schema-only, Phase 1B uses it)
--
-- Storage buckets (create manually in Supabase dashboard if not present):
--   magazine-pdfs    → [issue-id]/original.pdf
--   magazine-pages   → [issue-id]/v[render_version]/page-001.jpg
--   magazine-thumbs  → [issue-id]/v[render_version]/thumb-001.jpg
--   magazine-covers  → [issue-id]/cover.jpg
--
-- RLS disabled — admin-only writes via service role (Phase 1)
-- ============================================================

-- ── 0. Ensure update_updated_at_column exists ─────────────────────────────────
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ── 1. magazine_issues ────────────────────────────────────────────────────────
create table if not exists magazine_issues (
  -- Identity
  id                  uuid        primary key default gen_random_uuid(),
  slug                text        unique not null,
  slug_locked         boolean     not null default false,  -- true after first publish

  -- Metadata
  title               text        not null default '',
  issue_number        int,
  season              text,       -- 'Spring' | 'Summer' | 'Autumn' | 'Winter'
  year                int,
  intro               text,
  editor_note         text,

  -- Cover
  cover_image         text,       -- public URL of cover image
  cover_storage_path  text,       -- storage path: magazine-covers/[id]/cover.jpg
  og_image_url        text,       -- social share image (defaults to cover_image)

  -- PDF source
  pdf_url             text,       -- public URL of original PDF
  pdf_storage_path    text,       -- storage path: magazine-pdfs/[id]/original.pdf

  -- Processing pipeline
  -- processing_state is decoupled from editorial status deliberately.
  -- A PDF can be processing while the issue stays in draft.
  processing_state    text        not null default 'idle'
                        check (processing_state in ('idle','processing','ready','failed')),
  processing_error    text,
  processed_at        timestamptz,
  render_version      int         not null default 1,      -- increments on every reprocess

  -- Editorial workflow
  status              text        not null default 'draft'
                        check (status in ('draft','published','archived')),
  is_featured         boolean     not null default false,
  published_at        timestamptz,

  -- Stats (denormalised counters — updated by reader events)
  page_count          int         not null default 0,
  view_count          int         not null default 0,
  download_count      int         not null default 0,

  -- SEO
  seo_title           text,
  seo_description     text,

  -- Cross-links (reserved, not used in Phase 1)
  featured_article_ids uuid[]     default '{}',
  featured_venue_ids   uuid[]     default '{}',

  -- Timestamps
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table magazine_issues disable row level security;

create index if not exists magazine_issues_status_idx
  on magazine_issues(status);
create index if not exists magazine_issues_featured_idx
  on magazine_issues(is_featured) where is_featured = true;
create index if not exists magazine_issues_published_idx
  on magazine_issues(published_at desc) where published_at is not null;
create index if not exists magazine_issues_processing_idx
  on magazine_issues(processing_state);

create trigger magazine_issues_updated_at
  before update on magazine_issues
  for each row execute function update_updated_at_column();

comment on table  magazine_issues                    is 'LWD print magazine issues — PDF pipeline, editorial workflow, reader stats';
comment on column magazine_issues.slug               is 'URL slug, e.g. "issue-01-spring-2026". Locked after first publish.';
comment on column magazine_issues.slug_locked        is 'Once true, slug cannot be changed (prevents broken URLs after publication)';
comment on column magazine_issues.processing_state   is 'PDF pipeline state: idle → processing → ready | failed. Separate from editorial status.';
comment on column magazine_issues.render_version     is 'Increments on every reprocess so CDN paths change: magazine-pages/[id]/v[n]/page-NNN.jpg';
comment on column magazine_issues.status             is 'Editorial workflow: draft → published → archived';


-- ── 2. magazine_issue_pages ───────────────────────────────────────────────────
create table if not exists magazine_issue_pages (
  -- Identity
  id                    uuid        primary key default gen_random_uuid(),
  issue_id              uuid        not null references magazine_issues(id) on delete cascade,

  -- Position
  page_number           int         not null,             -- 1-indexed, absolute page number
  spread_index          int,                              -- for double-page spread grouping (Phase 1B)
  is_left_page          boolean,                          -- spread positioning (Phase 1B)
  is_right_page         boolean,                          -- spread positioning (Phase 1B)

  -- Source
  source_type           text        not null default 'pdf'
                          check (source_type in ('pdf','jpeg','template')),
  source_page_key       text,                             -- e.g. "page-001" — links to storage path

  -- Full-resolution image
  image_url             text,                             -- public URL
  image_storage_path    text,                             -- magazine-pages/[id]/v[n]/page-001.jpg
  width                 int,                              -- px
  height                int,                              -- px

  -- Thumbnail (generated at ≤400px width)
  thumbnail_url         text,
  thumbnail_storage_path text,                            -- magazine-thumbs/[id]/v[n]/thumb-001.jpg

  -- Editorial
  caption               text,
  link_targets          jsonb       default '[]',         -- [{x,y,w,h,url,label}] — Phase 2 hotspots

  -- Pipeline version snapshot (matches issue.render_version at time of processing)
  render_version        int         not null default 1,

  -- Timestamps
  created_at            timestamptz not null default now()
);

alter table magazine_issue_pages disable row level security;

create unique index if not exists magazine_issue_pages_unique_idx
  on magazine_issue_pages(issue_id, page_number);
create index if not exists magazine_issue_pages_issue_idx
  on magazine_issue_pages(issue_id, page_number asc);
create index if not exists magazine_issue_pages_source_idx
  on magazine_issue_pages(issue_id, source_type);

comment on table  magazine_issue_pages                        is 'Per-page images extracted from PDF or uploaded as JPEG. Tiered source types: pdf | jpeg | template.';
comment on column magazine_issue_pages.page_number            is '1-indexed absolute page number within the issue';
comment on column magazine_issue_pages.source_type            is 'pdf = extracted from PDF pipeline; jpeg = manually uploaded; template = built in LWD studio (Phase 1D)';
comment on column magazine_issue_pages.link_targets           is 'JSON array of clickable hotspots [{x%,y%,w%,h%,url,label}]. Reserved for Phase 2.';
comment on column magazine_issue_pages.render_version         is 'Snapshot of issue.render_version when this page was generated. Used for CDN cache-busting.';


-- ── 3. magazine_analytics ─────────────────────────────────────────────────────
-- Schema-only for Phase 1A. Reader writes events here in Phase 1B.
create table if not exists magazine_analytics (
  id          uuid        primary key default gen_random_uuid(),
  issue_id    uuid        not null references magazine_issues(id) on delete cascade,
  page_number int,
  event_type  text        not null,   -- 'view' | 'page_turn' | 'download' | 'share' | 'dwell'
  reader_mode text,                   -- 'single' | 'spread' | 'scroll'
  device_type text,                   -- 'mobile' | 'tablet' | 'desktop'
  duration_ms int,                    -- dwell time in ms (for dwell events)
  session_id  text,                   -- anonymous session tracking
  created_at  timestamptz not null default now()
);

alter table magazine_analytics disable row level security;

create index if not exists magazine_analytics_issue_idx
  on magazine_analytics(issue_id, created_at desc);
create index if not exists magazine_analytics_event_idx
  on magazine_analytics(event_type, created_at desc);
create index if not exists magazine_analytics_session_idx
  on magazine_analytics(session_id) where session_id is not null;

comment on table  magazine_analytics             is 'Reader event stream — page views, turns, dwell time. Populated by Phase 1B reader.';
comment on column magazine_analytics.event_type  is 'view | page_turn | download | share | dwell';
comment on column magazine_analytics.duration_ms is 'Milliseconds on page — only set for dwell events';
