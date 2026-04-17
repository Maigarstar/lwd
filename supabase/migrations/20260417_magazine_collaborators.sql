-- Magazine Collaborators & Page Comments
-- Run this in the Supabase SQL editor

create table if not exists magazine_collaborators (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null,
  email text not null,
  name text,
  role text not null default 'editor',
  token text unique not null default gen_random_uuid()::text,
  status text not null default 'invited',
  message text,
  invited_at timestamptz default now(),
  last_active timestamptz,
  constraint fk_issue foreign key(issue_id) references magazine_issues(id) on delete cascade
);

create table if not exists magazine_page_comments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null,
  page_number int not null,
  author_email text not null,
  author_name text,
  content text not null,
  resolved boolean default false,
  created_at timestamptz default now()
);

alter table magazine_collaborators enable row level security;
alter table magazine_page_comments enable row level security;
create policy "allow_all" on magazine_collaborators for all using (true) with check (true);
create policy "allow_all" on magazine_page_comments for all using (true) with check (true);
