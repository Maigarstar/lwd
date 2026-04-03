-- ═══════════════════════════════════════════════════════════════════════════
-- listing_applications
-- Stores applications submitted via /list-your-business
-- Feeds: Admin → Sales → Listing Applications module
-- Also triggers a CRM lead record on submission (Phase 3, handled client-side)
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.listing_applications (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),

  -- Applicant
  name                text not null,
  email               text not null,
  phone               text,

  -- Business
  business_name       text not null,
  category            text not null check (category in ('venue', 'planner', 'vendor')),
  country             text,
  region              text,
  website             text,
  instagram           text,
  message             text,

  -- Tracking
  source_page         text default 'list-your-business',
  source_campaign     text,
  package_interest    text,

  -- Admin workflow
  status              text not null default 'new'
                      check (status in ('new', 'reviewing', 'contacted', 'approved', 'declined')),
  internal_notes      text,
  reviewed_by         text,
  reviewed_at         timestamptz,

  -- CRM / account links (populated later)
  crm_lead_id         uuid references public.leads(id) on delete set null,
  converted_vendor_id uuid,

  -- Submission context
  device_info         jsonb
);

-- Index for common admin queries
create index if not exists idx_listing_applications_status   on public.listing_applications(status);
create index if not exists idx_listing_applications_category on public.listing_applications(category);
create index if not exists idx_listing_applications_email    on public.listing_applications(email);
create index if not exists idx_listing_applications_created  on public.listing_applications(created_at desc);

-- RLS: public insert (anyone can apply), admin can read/update all
alter table public.listing_applications enable row level security;

-- Anyone can insert their own application
create policy "Anyone can submit a listing application"
  on public.listing_applications
  for insert
  with check (true);

-- Authenticated admins can read all
create policy "Admins can read listing applications"
  on public.listing_applications
  for select
  using (auth.role() = 'authenticated');

-- Authenticated admins can update status/notes
create policy "Admins can update listing applications"
  on public.listing_applications
  for update
  using (auth.role() = 'authenticated');

-- Add device_info if table already existed before this column was introduced
alter table public.listing_applications
  add column if not exists device_info jsonb;
