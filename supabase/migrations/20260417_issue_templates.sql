-- Magazine issue templates table
create table if not exists magazine_issue_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  page_count int,
  pages_data jsonb default '[]',
  created_at timestamptz default now()
);
alter table magazine_issue_templates enable row level security;
create policy "allow_all" on magazine_issue_templates for all using (true) with check (true);
