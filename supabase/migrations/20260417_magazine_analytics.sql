-- Magazine Read Events for Analytics
-- Run this in the Supabase SQL editor

create table if not exists magazine_read_events (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null,
  session_id text not null,
  page_number int,
  event_type text not null,
  duration_ms int,
  referrer text,
  created_at timestamptz default now()
);

create index if not exists magazine_read_events_issue_event_idx on magazine_read_events(issue_id, event_type);

alter table magazine_read_events enable row level security;
create policy "allow_all" on magazine_read_events for all using (true) with check (true);
