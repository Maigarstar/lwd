-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: vendor monthly snapshots + report tracking + enquiry outcomes
-- Date: 2026-04-04
-- Purpose: Permanent monthly data record per vendor powering:
--          - YoY comparisons
--          - Renewal emails
--          - Churn health scores
--          - "Did this convert?" attribution loop
-- Run in: Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Monthly snapshots ─────────────────────────────────────────────────────
create table if not exists public.vendor_monthly_snapshots (
  id                   uuid        primary key default gen_random_uuid(),
  vendor_id            uuid        not null references public.vendors(id) on delete cascade,
  month                date        not null,   -- always 1st of month: 2026-03-01

  -- Core event counts
  views                int         not null default 0,
  unique_sessions      int         not null default 0,
  shortlists           int         not null default 0,
  compares             int         not null default 0,
  enquiry_started      int         not null default 0,
  enquiry_submitted    int         not null default 0,
  outbound_clicks      int         not null default 0,

  -- Derived metrics
  touch_points         int         not null default 0,
  view_to_enquiry      numeric(6,2),
  enquiry_completion   numeric(6,2),

  -- Media value (£ equivalent ad spend)
  media_value_low      int         not null default 0,
  media_value_high     int         not null default 0,

  -- Revenue ROI (populated if vendor has set their assumptions)
  est_revenue_low      int,
  est_revenue_high     int,
  roi_multiple         numeric(8,1),

  -- Metadata
  snapshot_generated_at timestamptz not null default now(),

  unique (vendor_id, month)
);

create index if not exists idx_vms_vendor_month
  on public.vendor_monthly_snapshots (vendor_id, month desc);

alter table public.vendor_monthly_snapshots enable row level security;

-- Admins read all; vendors read own
create policy "admin read snapshots"
  on public.vendor_monthly_snapshots for select
  using (true);

-- ── 2. Enquiry outcomes — "did this convert?" responses ──────────────────────
create table if not exists public.vendor_enquiry_outcomes (
  id            uuid        primary key default gen_random_uuid(),
  vendor_id     uuid        not null references public.vendors(id) on delete cascade,
  month         date        not null,
  converted     boolean     not null,
  booking_count int,
  booking_value numeric,
  responded_at  timestamptz not null default now(),
  source        text        not null default 'email'  -- 'email' | 'dashboard'
    check (source in ('email', 'dashboard'))
);

create index if not exists idx_veo_vendor_month
  on public.vendor_enquiry_outcomes (vendor_id, month desc);

alter table public.vendor_enquiry_outcomes enable row level security;

create policy "admin read outcomes"
  on public.vendor_enquiry_outcomes for select
  using (true);

-- Allow anon inserts for tokenised one-click email links (no login required)
create policy "anon insert outcomes"
  on public.vendor_enquiry_outcomes for insert
  with check (true);

-- ── 3. Report sends — email send + open tracking ─────────────────────────────
create table if not exists public.vendor_report_sends (
  id                 uuid        primary key default gen_random_uuid(),
  vendor_id          uuid        not null references public.vendors(id) on delete cascade,
  month              date        not null,
  email_address      text        not null,
  sent_at            timestamptz not null default now(),
  opened_at          timestamptz,              -- set by tracking pixel
  clicked_at         timestamptz,              -- set when CTA clicked
  outcome_responded  boolean     not null default false,
  resend_message_id  text,

  unique (vendor_id, month)
);

create index if not exists idx_vrs_vendor_sent
  on public.vendor_report_sends (vendor_id, sent_at desc);

alter table public.vendor_report_sends enable row level security;

create policy "admin read report sends"
  on public.vendor_report_sends for select
  using (true);

-- Allow anon update for tracking pixel + tokenised outcome links
create policy "anon update report send tracking"
  on public.vendor_report_sends for update
  using (true)
  with check (true);

-- ── 4. Lifetime stats convenience view ───────────────────────────────────────
create or replace view public.vendor_lifetime_stats as
select
  vendor_id,
  sum(views)             as total_views,
  sum(unique_sessions)   as total_sessions,
  sum(shortlists)        as total_shortlists,
  sum(compares)          as total_compares,
  sum(enquiry_submitted) as total_enquiries,
  sum(outbound_clicks)   as total_outbound,
  sum(touch_points)      as total_touch_points,
  sum(media_value_low)   as total_media_value_low,
  sum(media_value_high)  as total_media_value_high,
  min(month)             as first_snapshot_month,
  max(month)             as latest_snapshot_month,
  count(*)               as months_tracked
from public.vendor_monthly_snapshots
group by vendor_id;

-- ── 5. RPC: record enquiry outcome (tokenised, no auth required) ──────────────
create or replace function public.record_enquiry_outcome(
  p_vendor_id   uuid,
  p_month       date,
  p_converted   boolean,
  p_count       int     default null,
  p_value       numeric default null,
  p_source      text    default 'email'
)
returns void
language sql
security definer
as $$
  insert into public.vendor_enquiry_outcomes
    (vendor_id, month, converted, booking_count, booking_value, source)
  values
    (p_vendor_id, p_month, p_converted, p_count, p_value, p_source)
  on conflict do nothing;

  update public.vendor_report_sends
  set outcome_responded = true
  where vendor_id = p_vendor_id
    and month     = p_month;
$$;

grant execute on function public.record_enquiry_outcome to anon, authenticated;

-- ── 6. RPC: record report open (tracking pixel) ───────────────────────────────
create or replace function public.record_report_open(
  p_vendor_id uuid,
  p_month     date
)
returns void
language sql
security definer
as $$
  update public.vendor_report_sends
  set opened_at = coalesce(opened_at, now())
  where vendor_id = p_vendor_id
    and month     = p_month;
$$;

grant execute on function public.record_report_open to anon, authenticated;

-- ── 7. RPC: get vendor report history (for admin + vendor dashboard) ──────────
create or replace function public.get_vendor_report_history(
  p_vendor_id uuid,
  p_months    int default 13
)
returns table (
  month               date,
  views               int,
  shortlists          int,
  enquiry_submitted   int,
  touch_points        int,
  media_value_low     int,
  media_value_high    int,
  est_revenue_high    int,
  roi_multiple        numeric,
  email_sent          bool,
  email_opened        bool,
  outcome_responded   bool
)
language sql
security definer
stable
as $$
  select
    s.month,
    s.views,
    s.shortlists,
    s.enquiry_submitted,
    s.touch_points,
    s.media_value_low,
    s.media_value_high,
    s.est_revenue_high,
    s.roi_multiple,
    (r.id is not null)            as email_sent,
    (r.opened_at is not null)     as email_opened,
    coalesce(r.outcome_responded, false) as outcome_responded
  from public.vendor_monthly_snapshots s
  left join public.vendor_report_sends r
    on r.vendor_id = s.vendor_id and r.month = s.month
  where s.vendor_id = p_vendor_id
  order by s.month desc
  limit p_months;
$$;

grant execute on function public.get_vendor_report_history to anon, authenticated;
