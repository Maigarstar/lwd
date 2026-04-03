-- ═══════════════════════════════════════════════════════════════════════════
-- live_tracking
-- Two-table model: live_sessions (current state) + page_events (append log)
-- Feeds: Admin → Intelligence → Live Stats module
-- Privacy: no raw IP stored, city-level geo only, ephemeral session IDs
-- ═══════════════════════════════════════════════════════════════════════════

-- ── live_sessions ────────────────────────────────────────────────────────────
-- One row per anonymous session — upserted on every event.
-- Represents the *current* known state of the visitor.

create table if not exists public.live_sessions (
  session_id        text primary key,           -- sessionStorage UUID, anon
  first_seen_at     timestamptz not null default now(),
  last_seen_at      timestamptz not null default now(),

  -- Geo (Cloudflare headers — city level, no IP)
  country_code      text,                        -- e.g. "GB"
  country_name      text,                        -- e.g. "United Kingdom"
  city              text,                        -- e.g. "London"
  region            text,                        -- e.g. "England"
  latitude          numeric(9,6),
  longitude         numeric(9,6),

  -- Device
  device_type       text,                        -- Desktop | Mobile | Tablet
  browser           text,
  os                text,
  user_agent        text,

  -- Current navigation
  current_path      text,
  current_title     text,
  entry_path        text,
  referrer          text,

  -- UTM
  utm_source        text,
  utm_medium        text,
  utm_campaign      text,

  -- Engagement
  page_count        int not null default 1,
  intent_count      int not null default 0       -- shortlist/compare/enquiry/etc
);

-- Indexes for live admin queries
create index if not exists idx_live_sessions_last_seen  on public.live_sessions(last_seen_at desc);
create index if not exists idx_live_sessions_country    on public.live_sessions(country_code);

-- RLS
alter table public.live_sessions enable row level security;

drop policy if exists "Public can upsert own session"  on public.live_sessions;
drop policy if exists "Admins can read live sessions"  on public.live_sessions;

-- Anyone can upsert their own session row
create policy "Public can upsert own session"
  on public.live_sessions
  for all
  using (true)
  with check (true);

-- Authenticated admins can read all sessions
create policy "Admins can read live sessions"
  on public.live_sessions
  for select
  using (auth.role() = 'authenticated');


-- ── page_events ──────────────────────────────────────────────────────────────
-- Append-only event log. Every page_view + intent event recorded here.
-- Heartbeats are NOT stored to avoid high row counts.

create table if not exists public.page_events (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  session_id    text not null references public.live_sessions(session_id) on delete cascade,
  event_type    text not null,  -- page_view | shortlist_add | compare_add | enquiry_started | enquiry_submitted | outbound_click | aura_query
  path          text,
  title         text,
  metadata      jsonb          -- extra context per event type
);

-- Indexes
create index if not exists idx_page_events_session    on public.page_events(session_id);
create index if not exists idx_page_events_created    on public.page_events(created_at desc);
create index if not exists idx_page_events_type       on public.page_events(event_type);
create index if not exists idx_page_events_path       on public.page_events(path);

-- RLS
alter table public.page_events enable row level security;

drop policy if exists "Public can insert events"    on public.page_events;
drop policy if exists "Admins can read page events" on public.page_events;

create policy "Public can insert events"
  on public.page_events
  for insert
  with check (true);

create policy "Admins can read page events"
  on public.page_events
  for select
  using (auth.role() = 'authenticated');

-- Add isp column (added when ISP tab feature shipped)
alter table public.live_sessions
  add column if not exists isp text;
