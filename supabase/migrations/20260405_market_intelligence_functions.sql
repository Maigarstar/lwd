-- ══════════════════════════════════════════════════════════════════════════════
-- Migration: market_intelligence_functions
-- Date: 2026-04-05
-- Purpose: MBA/doctorate-level market intelligence — 9 SQL functions covering
--   destination demand, audience origins, cross-border flow, supply/demand
--   gaps, lead intelligence, wedding pipeline, traffic sources, and trends.
--
-- Data sources:
--   page_events      → visitor behaviour events (views, shortlists, enquiries)
--   live_sessions    → visitor geo/device (country_code, city, device_type)
--   listings         → destination supply (country, region, listing_type, status)
--   leads            → CRM pipeline (location_preference, budget, wedding_date)
--   listing_applications → application funnel by geography/category
--   media_events     → image engagement by destination
-- ══════════════════════════════════════════════════════════════════════════════


-- ── 1. DESTINATION DEMAND ────────────────────────────────────────────────────
-- Which destination countries are capturing the most couple engagement?
-- Joins page_events → listings.country; computes prior-period momentum.
-- ─────────────────────────────────────────────────────────────────────────────
drop function if exists public.get_destination_demand(timestamptz, timestamptz, int);

create or replace function public.get_destination_demand(
  p_from  timestamptz default now() - interval '30 days',
  p_to    timestamptz default now(),
  p_limit int         default 25
)
returns table (
  country          text,
  listing_count    bigint,
  page_views       bigint,
  unique_sessions  bigint,
  shortlists       bigint,
  enquiries        bigint,
  outbound_clicks  bigint,
  intent_events    bigint,
  intent_rate      numeric,   -- (intent / views) × 100
  demand_score     numeric,   -- weighted composite 0–100
  prev_views       bigint,    -- prior equal period
  momentum_pct     numeric    -- % change vs prior period
)
language sql security definer stable as $$

with period_len as (
  select p_to - p_from as len
),

-- Current period events joined to listing destination
current_events as (
  select
    coalesce(l.country, 'Unknown') as country,
    pe.session_id,
    pe.event_type
  from public.page_events   pe
  join public.listings       l  on l.id = pe.listing_id
  where pe.created_at >= p_from
    and pe.created_at <  p_to
    and pe.listing_id  is not null
    and l.status       = 'published'
    and l.country      is not null
    and l.country      <> ''
),

-- Prior period events (same window length, directly before)
prior_events as (
  select
    coalesce(l.country, 'Unknown') as country,
    pe.event_type
  from public.page_events   pe
  join public.listings       l  on l.id = pe.listing_id
  cross join period_len
  where pe.created_at >= p_from - period_len.len
    and pe.created_at <  p_from
    and pe.listing_id  is not null
    and l.status       = 'published'
    and l.country      is not null
),

-- Aggregate current
current_agg as (
  select
    country,
    count(*) filter (where event_type = 'page_view')             as views,
    count(distinct session_id)                                    as sessions,
    count(*) filter (where event_type = 'shortlist_add')         as shortlists,
    count(*) filter (where event_type in
      ('enquiry_started','enquiry_submitted'))                    as enquiries,
    count(*) filter (where event_type = 'outbound_click')        as outbound_clicks
  from current_events
  group by country
),

-- Aggregate prior
prior_agg as (
  select
    country,
    count(*) filter (where event_type = 'page_view') as prev_views
  from prior_events
  group by country
),

-- Listing supply per country
supply as (
  select
    country,
    count(*) as listing_count
  from public.listings
  where status = 'published'
    and country is not null
    and country <> ''
  group by country
)

select
  c.country,
  coalesce(s.listing_count, 0),
  coalesce(c.views,       0),
  coalesce(c.sessions,    0),
  coalesce(c.shortlists,  0),
  coalesce(c.enquiries,   0),
  coalesce(c.outbound_clicks, 0),
  coalesce(c.shortlists, 0) + coalesce(c.enquiries, 0) + coalesce(c.outbound_clicks, 0) as intent_events,
  -- Intent rate
  case when coalesce(c.views, 0) > 0
       then round(
         (coalesce(c.shortlists,0) + coalesce(c.enquiries,0) + coalesce(c.outbound_clicks,0))
         ::numeric / c.views * 100, 2)
       else 0 end,
  -- Demand score: weighted composite (views×1 + sessions×2 + shortlists×5 + enquiries×10) / log scale
  round(
    least(
      (coalesce(c.views,0)::numeric * 1
       + coalesce(c.sessions,0)::numeric * 2
       + coalesce(c.shortlists,0)::numeric * 5
       + coalesce(c.enquiries,0)::numeric * 10
      ) / greatest(log(coalesce(s.listing_count,1) + 2)::numeric * 20, 1::numeric),
    100::numeric)::numeric,
  1),
  coalesce(p.prev_views, 0),
  -- Momentum %
  case
    when coalesce(p.prev_views, 0) = 0 and coalesce(c.views, 0) > 0 then 100
    when coalesce(p.prev_views, 0) = 0 then 0
    else round((coalesce(c.views,0) - p.prev_views)::numeric / p.prev_views * 100, 1)
  end

from current_agg   c
left join prior_agg  p on p.country = c.country
left join supply     s on s.country = c.country
order by
  (coalesce(c.views,0)::numeric * 1
   + coalesce(c.sessions,0)::numeric * 2
   + coalesce(c.shortlists,0)::numeric * 5
   + coalesce(c.enquiries,0)::numeric * 10
  ) / greatest(log(coalesce(s.listing_count,1) + 2)::numeric * 20, 1) desc
limit p_limit;
$$;


-- ── 2. AUDIENCE ORIGINS ───────────────────────────────────────────────────────
-- Where are couples browsing FROM? Browser-country breakdown with engagement depth.
-- ─────────────────────────────────────────────────────────────────────────────
drop function if exists public.get_audience_origins(timestamptz, timestamptz, int);

create or replace function public.get_audience_origins(
  p_from  timestamptz default now() - interval '30 days',
  p_to    timestamptz default now(),
  p_limit int         default 20
)
returns table (
  country_code      text,
  country_name      text,
  sessions          bigint,
  avg_page_depth    numeric,   -- avg pages per session
  avg_intent_depth  numeric,   -- avg intent events per session
  mobile_pct        numeric,   -- % sessions on mobile
  tablet_pct        numeric,
  desktop_pct       numeric,
  bounce_pct        numeric,   -- sessions with page_count = 1
  high_intent_pct   numeric,   -- sessions with intent_count >= 2
  top_browser       text,
  top_os            text
)
language sql security definer stable as $$

select
  coalesce(country_code, 'XX')                              as country_code,
  coalesce(country_name, 'Unknown')                         as country_name,
  count(*)                                                  as sessions,
  round(avg(coalesce(page_count,  1))::numeric, 1)         as avg_page_depth,
  round(avg(coalesce(intent_count,0))::numeric, 2)         as avg_intent_depth,
  round(count(*) filter (where device_type = 'Mobile')
        ::numeric / count(*) * 100, 1)                     as mobile_pct,
  round(count(*) filter (where device_type = 'Tablet')
        ::numeric / count(*) * 100, 1)                     as tablet_pct,
  round(count(*) filter (where device_type = 'Desktop')
        ::numeric / count(*) * 100, 1)                     as desktop_pct,
  round(count(*) filter (where coalesce(page_count,1) <= 1)
        ::numeric / count(*) * 100, 1)                     as bounce_pct,
  round(count(*) filter (where coalesce(intent_count,0) >= 2)
        ::numeric / count(*) * 100, 1)                     as high_intent_pct,
  -- Most common browser for this origin
  (select browser from public.live_sessions ls2
   where ls2.country_code = ls.country_code
     and ls2.last_seen_at >= p_from and ls2.last_seen_at < p_to
     and ls2.browser is not null
   group by browser order by count(*) desc limit 1)        as top_browser,
  (select os from public.live_sessions ls2
   where ls2.country_code = ls.country_code
     and ls2.last_seen_at >= p_from and ls2.last_seen_at < p_to
     and ls2.os is not null
   group by os order by count(*) desc limit 1)             as top_os

from public.live_sessions ls
where last_seen_at >= p_from
  and last_seen_at <  p_to
group by country_code, country_name
order by count(*) desc
limit p_limit;
$$;


-- ── 3. CROSS-BORDER DEMAND MATRIX ─────────────────────────────────────────────
-- Which visitor countries are looking at which destination countries?
-- Powers the "UK couples are drawn to Italy" type insight.
-- ─────────────────────────────────────────────────────────────────────────────
drop function if exists public.get_cross_border_demand(timestamptz, timestamptz, int);

create or replace function public.get_cross_border_demand(
  p_from  timestamptz default now() - interval '30 days',
  p_to    timestamptz default now(),
  p_limit int         default 60
)
returns table (
  visitor_country      text,
  destination_country  text,
  page_views           bigint,
  unique_sessions      bigint,
  intent_events        bigint,
  cross_border         boolean   -- true when visitor ≠ destination country
)
language sql security definer stable as $$

select
  coalesce(ls.country_code, 'XX')   as visitor_country,
  coalesce(l.country,  'Unknown')   as destination_country,
  count(*) filter (where pe.event_type = 'page_view')  as page_views,
  count(distinct pe.session_id)                         as unique_sessions,
  count(*) filter (where pe.event_type in
    ('shortlist_add','enquiry_started','enquiry_submitted','outbound_click')) as intent_events,
  coalesce(ls.country_code, 'XX') != coalesce(l.country, '')                as cross_border

from public.page_events  pe
join public.listings      l  on l.id  = pe.listing_id
join public.live_sessions ls on ls.session_id = pe.session_id

where pe.created_at >= p_from
  and pe.created_at <  p_to
  and pe.listing_id  is not null
  and l.status       = 'published'
  and l.country      is not null
  and l.country      <> ''

group by ls.country_code, l.country
having count(*) filter (where pe.event_type = 'page_view') > 0
order by page_views desc
limit p_limit;
$$;


-- ── 4. SUPPLY vs DEMAND GAP ───────────────────────────────────────────────────
-- Where is demand outpacing supply? Highlights listing opportunity gaps.
-- ─────────────────────────────────────────────────────────────────────────────
drop function if exists public.get_supply_demand_gap(timestamptz, timestamptz);

create or replace function public.get_supply_demand_gap(
  p_from timestamptz default now() - interval '30 days',
  p_to   timestamptz default now()
)
returns table (
  country             text,
  page_views          bigint,
  intent_events       bigint,
  listing_count       bigint,
  demand_per_listing  numeric,   -- views / listing count
  intent_per_listing  numeric,   -- intent / listing count
  gap_score           numeric,   -- higher = bigger opportunity
  opportunity_tier    text       -- "High" | "Medium" | "Low" | "Saturated"
)
language sql security definer stable as $$

with demand as (
  select
    coalesce(l.country, 'Unknown') as country,
    count(*) filter (where pe.event_type = 'page_view') as views,
    count(*) filter (where pe.event_type in
      ('shortlist_add','enquiry_started','enquiry_submitted')) as intents
  from public.page_events pe
  join public.listings     l on l.id = pe.listing_id
  where pe.created_at >= p_from
    and pe.created_at <  p_to
    and l.status = 'published'
    and l.country is not null
  group by l.country
),
supply as (
  select country, count(*) as listing_count
  from public.listings
  where status = 'published' and country is not null and country <> ''
  group by country
)
select
  d.country,
  coalesce(d.views,   0),
  coalesce(d.intents, 0),
  coalesce(s.listing_count, 1),
  round(coalesce(d.views,0)::numeric   / greatest(s.listing_count, 1), 1),
  round(coalesce(d.intents,0)::numeric / greatest(s.listing_count, 1), 2),
  -- gap_score = demand_per_listing normalised 0–100
  round(
    least(
      coalesce(d.views,0)::numeric / greatest(s.listing_count,1) / 10,
    100), 1),
  case
    when coalesce(d.views,0)::numeric / greatest(s.listing_count,1) >= 50  then 'High'
    when coalesce(d.views,0)::numeric / greatest(s.listing_count,1) >= 20  then 'Medium'
    when coalesce(d.views,0)::numeric / greatest(s.listing_count,1) >= 5   then 'Low'
    else 'Saturated'
  end

from demand d
left join supply s on s.country = d.country
order by coalesce(d.views,0)::numeric / greatest(s.listing_count,1) desc;
$$;


-- ── 5. CATEGORY DEMAND BY DESTINATION ────────────────────────────────────────
-- Venues vs photographers vs planners: which category drives interest by country?
-- ─────────────────────────────────────────────────────────────────────────────
drop function if exists public.get_category_demand_by_destination(timestamptz, timestamptz);

create or replace function public.get_category_demand_by_destination(
  p_from timestamptz default now() - interval '30 days',
  p_to   timestamptz default now()
)
returns table (
  country       text,
  listing_type  text,
  page_views    bigint,
  sessions      bigint,
  shortlists    bigint,
  enquiries     bigint,
  listing_count bigint
)
language sql security definer stable as $$

select
  coalesce(l.country,      'Unknown') as country,
  coalesce(l.listing_type, 'unknown') as listing_type,
  count(*) filter (where pe.event_type = 'page_view')                  as page_views,
  count(distinct pe.session_id)                                         as sessions,
  count(*) filter (where pe.event_type = 'shortlist_add')              as shortlists,
  count(*) filter (where pe.event_type in
    ('enquiry_started','enquiry_submitted'))                            as enquiries,
  (select count(*) from public.listings sl
   where sl.status = 'published'
     and sl.country = l.country
     and sl.listing_type = l.listing_type)                             as listing_count
from public.page_events pe
join public.listings     l on l.id = pe.listing_id
where pe.created_at >= p_from
  and pe.created_at <  p_to
  and l.status = 'published'
  and l.country is not null and l.country <> ''
  and l.listing_type is not null
group by l.country, l.listing_type
order by page_views desc;
$$;


-- ── 6. LEAD GEO INTELLIGENCE ──────────────────────────────────────────────────
-- Where are enquiring couples planning their weddings?
-- Draws from leads.event_location + location_preference.
-- ─────────────────────────────────────────────────────────────────────────────
drop function if exists public.get_lead_geo_analysis(timestamptz, timestamptz);

create or replace function public.get_lead_geo_analysis(
  p_from timestamptz default now() - interval '30 days',
  p_to   timestamptz default now()
)
returns table (
  location          text,
  lead_count        bigint,
  avg_score         numeric,
  high_value_count  bigint,   -- score >= 60
  booked_count      bigint,
  conversion_rate   numeric,  -- booked / lead_count × 100
  avg_booking_value numeric,
  top_budget_band   text,
  top_guest_band    text
)
language sql security definer stable as $$

select
  coalesce(
    nullif(trim(event_location), ''),
    nullif(trim(location_preference), ''),
    'Not Specified'
  )                                           as location,
  count(*)                                    as lead_count,
  round(avg(coalesce(score, 0))::numeric, 1) as avg_score,
  count(*) filter (where coalesce(score,0) >= 60)  as high_value_count,
  count(*) filter (where status = 'booked')         as booked_count,
  round(
    count(*) filter (where status = 'booked')::numeric
    / count(*) * 100, 1)                     as conversion_rate,
  round(avg(
    case when booking_value_estimate > 0
         then booking_value_estimate end)::numeric, 0) as avg_booking_value,
  -- Most common budget band
  (select budget_range
   from public.leads l2
   where coalesce(nullif(trim(l2.event_location),''), nullif(trim(l2.location_preference),''), 'Not Specified')
       = coalesce(nullif(trim(l.event_location),''), nullif(trim(l.location_preference),''), 'Not Specified')
     and l2.created_at >= p_from and l2.created_at < p_to
     and l2.budget_range is not null
   group by budget_range order by count(*) desc limit 1) as top_budget_band,
  -- Most common guest band
  (select guest_count
   from public.leads l2
   where coalesce(nullif(trim(l2.event_location),''), nullif(trim(l2.location_preference),''), 'Not Specified')
       = coalesce(nullif(trim(l.event_location),''), nullif(trim(l.location_preference),''), 'Not Specified')
     and l2.created_at >= p_from and l2.created_at < p_to
     and l2.guest_count is not null
   group by guest_count order by count(*) desc limit 1) as top_guest_band

from public.leads l
where created_at >= p_from
  and created_at <  p_to
group by 1
having count(*) > 0
order by lead_count desc
limit 30;
$$;


-- ── 7. WEDDING DATE PIPELINE ──────────────────────────────────────────────────
-- Heatmap of when couples are planning to marry + budget/guest distributions.
-- ─────────────────────────────────────────────────────────────────────────────
drop function if exists public.get_wedding_date_pipeline();

create or replace function public.get_wedding_date_pipeline()
returns table (
  wedding_year    int,
  wedding_month   text,
  lead_count      bigint,
  avg_score       numeric,
  booked_count    bigint,
  budget_band     text,
  guest_band      text,
  avg_guest_num   numeric
)
language sql security definer stable as $$

select
  coalesce(wedding_year, 0)   as wedding_year,
  coalesce(wedding_month, '?') as wedding_month,
  count(*)                    as lead_count,
  round(avg(coalesce(score, 0))::numeric, 1) as avg_score,
  count(*) filter (where status = 'booked')  as booked_count,
  -- Most common budget
  (select budget_range from public.leads l2
   where l2.wedding_year  = l.wedding_year
     and l2.wedding_month = l.wedding_month
     and l2.budget_range is not null
   group by budget_range order by count(*) desc limit 1) as budget_band,
  -- Most common guest count band
  (select guest_count from public.leads l2
   where l2.wedding_year  = l.wedding_year
     and l2.wedding_month = l.wedding_month
     and l2.guest_count is not null
   group by guest_count order by count(*) desc limit 1) as guest_band,
  -- Rough numeric average (from common bands like "50-100" → midpoint 75)
  null::numeric as avg_guest_num

from public.leads l
where wedding_year is not null
  and wedding_year >= extract(year from now())::int
group by wedding_year, wedding_month
order by wedding_year, case wedding_month
  when 'January'   then 1 when 'February' then 2 when 'March'     then 3
  when 'April'     then 4 when 'May'      then 5 when 'June'      then 6
  when 'July'      then 7 when 'August'   then 8 when 'September' then 9
  when 'October'   then 10 when 'November' then 11 when 'December' then 12
  else 13 end;
$$;


-- ── 8. TRAFFIC SOURCE ANALYSIS ────────────────────────────────────────────────
-- UTM / referrer breakdown showing which channels bring most engaged traffic.
-- ─────────────────────────────────────────────────────────────────────────────
drop function if exists public.get_traffic_source_analysis(timestamptz, timestamptz);

create or replace function public.get_traffic_source_analysis(
  p_from timestamptz default now() - interval '30 days',
  p_to   timestamptz default now()
)
returns table (
  source        text,
  medium        text,
  sessions      bigint,
  avg_pages     numeric,
  avg_intents   numeric,
  mobile_pct    numeric,
  intent_rate   numeric,   -- sessions with intent >= 1 / total × 100
  high_intent_pct numeric  -- sessions with intent >= 3 / total × 100
)
language sql security definer stable as $$

select
  coalesce(nullif(utm_source,   ''), '(direct)')  as source,
  coalesce(nullif(utm_medium,   ''), '(none)')    as medium,
  count(*)                                        as sessions,
  round(avg(coalesce(page_count,  1))::numeric, 1) as avg_pages,
  round(avg(coalesce(intent_count,0))::numeric, 2) as avg_intents,
  round(count(*) filter (where device_type = 'Mobile')::numeric / count(*) * 100, 1) as mobile_pct,
  round(count(*) filter (where coalesce(intent_count,0) >= 1)::numeric / count(*) * 100, 1) as intent_rate,
  round(count(*) filter (where coalesce(intent_count,0) >= 3)::numeric / count(*) * 100, 1) as high_intent_pct
from public.live_sessions
where last_seen_at >= p_from
  and last_seen_at <  p_to
group by 1, 2
order by sessions desc
limit 30;
$$;


-- ── 9. DESTINATION MONTHLY TREND ─────────────────────────────────────────────
-- Month-by-month demand series for top destinations (sparkline / trend data).
-- ─────────────────────────────────────────────────────────────────────────────
drop function if exists public.get_destination_monthly_trend(int, int);

create or replace function public.get_destination_monthly_trend(
  p_months_back int  default 12,
  p_top_n       int  default 8
)
returns table (
  country     text,
  month_start date,
  page_views  bigint,
  sessions    bigint,
  intents     bigint
)
language sql security definer stable as $$

with top_countries as (
  select coalesce(l.country, 'Unknown') as country, count(*) as cnt
  from public.page_events pe
  join public.listings l on l.id = pe.listing_id
  where pe.created_at >= now() - (p_months_back || ' months')::interval
    and pe.event_type = 'page_view'
    and l.status = 'published'
    and l.country is not null
  group by l.country
  order by cnt desc
  limit p_top_n
)
select
  coalesce(l.country, 'Unknown') as country,
  date_trunc('month', pe.created_at)::date as month_start,
  count(*) filter (where pe.event_type = 'page_view')  as page_views,
  count(distinct pe.session_id)                         as sessions,
  count(*) filter (where pe.event_type in
    ('shortlist_add','enquiry_started','enquiry_submitted')) as intents
from public.page_events pe
join public.listings     l  on l.id = pe.listing_id
where pe.created_at >= now() - (p_months_back || ' months')::interval
  and l.country in (select country from top_countries)
  and l.status = 'published'
group by l.country, date_trunc('month', pe.created_at)
order by country, month_start;
$$;


-- ── 10. APPLICATION PIPELINE GEO ──────────────────────────────────────────────
-- Where are businesses applying from? Supply pipeline intelligence.
-- ─────────────────────────────────────────────────────────────────────────────
drop function if exists public.get_application_pipeline_geo(timestamptz, timestamptz);

create or replace function public.get_application_pipeline_geo(
  p_from timestamptz default now() - interval '90 days',
  p_to   timestamptz default now()
)
returns table (
  country       text,
  category      text,
  total         bigint,
  new_count     bigint,
  approved      bigint,
  declined      bigint,
  conversion_pct numeric
)
language sql security definer stable as $$

select
  coalesce(nullif(country,''), 'Unknown') as country,
  coalesce(nullif(category,''), 'unknown') as category,
  count(*)                                            as total,
  count(*) filter (where status = 'new')              as new_count,
  count(*) filter (where status = 'approved')         as approved,
  count(*) filter (where status = 'declined')         as declined,
  round(
    count(*) filter (where status = 'approved')::numeric
    / count(*) * 100, 1)                              as conversion_pct
from public.listing_applications
where created_at >= p_from
  and created_at <  p_to
group by country, category
order by total desc
limit 50;
$$;


-- ── GRANTS ─────────────────────────────────────────────────────────────────────
grant execute on function public.get_destination_demand              to authenticated;
grant execute on function public.get_audience_origins                to authenticated;
grant execute on function public.get_cross_border_demand             to authenticated;
grant execute on function public.get_supply_demand_gap               to authenticated;
grant execute on function public.get_category_demand_by_destination  to authenticated;
grant execute on function public.get_lead_geo_analysis               to authenticated;
grant execute on function public.get_wedding_date_pipeline           to authenticated;
grant execute on function public.get_traffic_source_analysis         to authenticated;
grant execute on function public.get_destination_monthly_trend       to authenticated;
grant execute on function public.get_application_pipeline_geo        to authenticated;


-- ── 11. EXECUTIVE SUMMARY ROLL-UP ─────────────────────────────────────────────
-- Single function powering the 60-second executive summary tab.
-- Returns one row of headline KPIs across all intelligence dimensions.
-- ─────────────────────────────────────────────────────────────────────────────
drop function if exists public.get_market_intelligence_summary(timestamptz, timestamptz);

create or replace function public.get_market_intelligence_summary(
  p_from timestamptz default now() - interval '30 days',
  p_to   timestamptz default now()
)
returns table (
  -- Demand
  top_destination            text,
  top_destination_views      bigint,
  top_destination_intents    bigint,
  fastest_growing_dest       text,
  fastest_growing_pct        numeric,
  total_destinations_active  bigint,
  -- Audience
  top_source_country         text,
  top_source_sessions        bigint,
  total_sessions             bigint,
  cross_border_pct           numeric,
  -- Supply
  highest_gap_destination    text,
  highest_gap_score          numeric,
  high_opportunity_count     bigint,
  -- Leads
  total_leads                bigint,
  avg_lead_score             numeric,
  booked_leads               bigint,
  -- Platform
  total_page_views           bigint,
  total_intent_events        bigint,
  platform_intent_rate       numeric
)
language sql security definer stable as $$

with period_len as (select p_to - p_from as len),

-- Demand: page_events → listings
dest_agg as (
  select
    coalesce(l.country, 'Unknown') as country,
    count(*) filter (where pe.event_type = 'page_view')            as views,
    count(*) filter (where pe.event_type in
      ('shortlist_add','enquiry_started','enquiry_submitted'))      as intents
  from public.page_events pe
  join public.listings     l on l.id = pe.listing_id
  where pe.created_at >= p_from and pe.created_at < p_to
    and l.status = 'published' and l.country is not null
  group by l.country
),
dest_prior as (
  select coalesce(l.country,'Unknown') as country,
    count(*) filter (where pe.event_type = 'page_view') as prev_views
  from public.page_events pe
  join public.listings l on l.id = pe.listing_id
  cross join period_len
  where pe.created_at >= p_from - period_len.len and pe.created_at < p_from
    and l.status = 'published' and l.country is not null
  group by l.country
),
top_dest as (
  select country, views, intents from dest_agg order by views + intents * 5 desc limit 1
),
rising_dest as (
  select d.country,
    case when coalesce(pr.prev_views,0) = 0 then 100
         else round((d.views - pr.prev_views)::numeric / pr.prev_views * 100, 1) end as momentum
  from dest_agg d left join dest_prior pr on pr.country = d.country
  where d.views > 10
  order by momentum desc limit 1
),
-- Gap
supply as (
  select country, count(*) as cnt from public.listings
  where status = 'published' and country is not null group by country
),
gap_agg as (
  select d.country,
    round(d.views::numeric / greatest(s.cnt, 1) / 10, 1) as gap_score,
    case when d.views::numeric / greatest(s.cnt,1) >= 50 then 'High' else 'Other' end as tier
  from dest_agg d left join supply s on s.country = d.country
),
top_gap as (select country, gap_score from gap_agg order by gap_score desc limit 1),
high_opp as (select count(*) as cnt from gap_agg where tier = 'High'),
-- Audience
sess_agg as (
  select country_code, country_name, count(*) as sessions
  from public.live_sessions
  where last_seen_at >= p_from and last_seen_at < p_to
  group by country_code, country_name
),
top_origin as (select country_name, sessions from sess_agg order by sessions desc limit 1),
total_sess as (select coalesce(sum(sessions),0) as total from sess_agg),
xborder as (
  select count(distinct pe.session_id) as cnt
  from public.page_events pe
  join public.listings l on l.id = pe.listing_id
  join public.live_sessions ls on ls.session_id = pe.session_id
  where pe.created_at >= p_from and pe.created_at < p_to
    and l.country is not null
    and ls.country_code is not null
    and ls.country_code != l.country::text
),
-- Leads
lead_agg as (
  select count(*) as total,
    round(avg(coalesce(score,0))::numeric,1) as avg_score,
    count(*) filter (where status = 'booked') as booked
  from public.leads where created_at >= p_from and created_at < p_to
),
-- Platform totals
plat as (
  select count(*) filter (where event_type = 'page_view') as total_views,
    count(*) filter (where event_type in
      ('shortlist_add','enquiry_started','enquiry_submitted','outbound_click')) as total_intents
  from public.page_events
  where created_at >= p_from and created_at < p_to
)

select
  td.country, td.views, td.intents,
  rd.country, rd.momentum,
  (select count(distinct country) from dest_agg where views > 0),
  to2.country_name, to2.sessions,
  ts.total,
  case when ts.total > 0
    then round(xb.cnt::numeric / ts.total * 100, 1) else 0 end,
  tg.country, tg.gap_score,
  ho.cnt,
  la.total, la.avg_score, la.booked,
  pl.total_views, pl.total_intents,
  case when pl.total_views > 0
    then round(pl.total_intents::numeric / pl.total_views * 100, 2) else 0 end

from top_dest td
cross join rising_dest rd
cross join top_gap tg
cross join high_opp ho
cross join top_origin to2
cross join total_sess ts
cross join xborder xb
cross join lead_agg la
cross join plat pl;
$$;

grant execute on function public.get_market_intelligence_summary to authenticated;
