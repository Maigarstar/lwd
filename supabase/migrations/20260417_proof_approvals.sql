-- Magazine proof approvals table
create table if not exists magazine_proof_approvals (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid,
  page_number int,
  vendor_email text,
  vendor_name text,
  approved boolean not null,
  notes text,
  created_at timestamptz default now()
);
alter table magazine_proof_approvals enable row level security;
create policy "allow_all" on magazine_proof_approvals for all using (true) with check (true);
