-- Magazine Personalised Issues
-- Run this in the Supabase SQL editor

create table if not exists magazine_personalised_issues (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null,
  slug text unique not null,
  partner1_name text,
  partner2_name text,
  wedding_date text,
  venue_name text,
  created_at timestamptz default now(),
  constraint fk_issue foreign key(issue_id) references magazine_issues(id) on delete cascade
);

alter table magazine_personalised_issues enable row level security;
create policy "allow_all" on magazine_personalised_issues for all using (true) with check (true);
