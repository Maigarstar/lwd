-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Visual Media Intelligence
-- Date: 2026-04-05
-- Tables: media_events, media_metadata_enrichment, vendor_media_scorecard
-- RPCs:   get_listing_media_stats, get_gallery_position_performance,
--         get_platform_media_trends, compute_vendor_media_scorecard
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. media_events ────────────────────────────────────────────────────────
create table if not exists public.media_events (
  id               uuid        primary key default gen_random_uuid(),
  session_id       text        not null,
  media_id         text        not null,
  listing_id       uuid        references public.listings(id) on delete cascade,

  event_type       text        not null,
  -- media_view | media_dwell | media_click | media_swipe
  -- media_gallery_open | media_video_play | media_video_complete
  -- media_save | media_download | media_share | media_enquiry | media_search_click

  gallery_position int         null,
  slide_index      int         null,
  is_hero          boolean     not null default false,
  dwell_ms         int         null,
  video_pct        int         null,
  share_platform   text        null,   -- instagram | pinterest | whatsapp | twitter | copy_link

  referrer         text        null,
  utm_source       text        null,
  utm_medium       text        null,
  utm_campaign     text        null,

  device_type      text        null,
  country_code     text        null,

  created_at       timestamptz not null default now(),

  constraint media_events_type_check check (event_type in (
    'media_view','media_dwell','media_click','media_swipe',
    'media_gallery_open','media_video_play','media_video_complete',
    'media_save','media_download','media_share','media_enquiry','media_search_click'
  ))
);

create index if not exists idx_media_events_listing_id   on public.media_events (listing_id);
create index if not exists idx_media_events_media_id     on public.media_events (media_id);
create index if not exists idx_media_events_event_type   on public.media_events (event_type);
create index if not exists idx_media_events_created_at   on public.media_events (created_at desc);
create index if not exists idx_media_events_media_time   on public.media_events (media_id, created_at desc);
create index if not exists idx_media_events_listing_time on public.media_events (listing_id, event_type, created_at desc);

alter table public.media_events enable row level security;

create policy "media_events_insert_public"
  on public.media_events for insert to anon, authenticated
  with check (true);

create policy "media_events_vendor_read"
  on public.media_events for select to authenticated
  using (
    listing_id in (
      select id from public.listings where vendor_id = auth.uid()
    )
  );

create policy "media_events_admin_read"
  on public.media_events for select to authenticated
  using (
    coalesce((auth.jwt() ->> 'is_admin')::boolean, false) = true
  );


-- ── 2. media_metadata_enrichment ──────────────────────────────────────────
create table if not exists public.media_metadata_enrichment (
  id                   uuid    primary key default gen_random_uuid(),
  media_id             text    not null unique,
  listing_id           uuid    references public.listings(id) on delete cascade,

  style_tags           text[]  not null default '{}',
  subject_tags         text[]  not null default '{}',
  season               text    null,
  time_of_day          text    null,
  dominant_colors      text[]  not null default '{}',
  color_mood           text    null,
  orientation          text    null,
  aspect_ratio         text    null,

  style_confidence     numeric(3,2) null,
  subject_confidence   numeric(3,2) null,

  engagement_score     numeric(6,2) not null default 0,
  trend_rank           int          null,
  platform_trend_rank  int          null,

  search_appearances   int  not null default 0,
  search_clicks        int  not null default 0,

  enriched_at          timestamptz  not null default now(),
  updated_at           timestamptz  not null default now()
);

create index if not exists idx_mme_listing_id       on public.media_metadata_enrichment (listing_id);
create index if not exists idx_mme_engagement_score on public.media_metadata_enrichment (engagement_score desc);
create index if not exists idx_mme_style_tags       on public.media_metadata_enrichment using gin (style_tags);
create index if not exists idx_mme_subject_tags     on public.media_metadata_enrichment using gin (subject_tags);

alter table public.media_metadata_enrichment enable row level security;

create policy "mme_public_read"   on public.media_metadata_enrichment for select using (true);
create policy "mme_service_write" on public.media_metadata_enrichment for all to service_role using (true);


-- ── 3. vendor_media_scorecard ─────────────────────────────────────────────
create table if not exists public.vendor_media_scorecard (
  id               uuid    primary key default gen_random_uuid(),
  listing_id       uuid    not null references public.listings(id) on delete cascade,
  snapshot_date    date    not null default current_date,

  total_media          int  not null default 0,
  images_count         int  not null default 0,
  videos_count         int  not null default 0,
  featured_count       int  not null default 0,
  tagged_pct           numeric(5,2) not null default 0,

  views_30d            int  not null default 0,
  clicks_30d           int  not null default 0,
  dwells_30d           int  not null default 0,
  shares_30d           int  not null default 0,
  downloads_30d        int  not null default 0,
  enquiries_from_media_30d int not null default 0,

  best_position        int  null,
  avg_dwell_ms         int  null,

  media_score          int  not null default 0 check (media_score between 0 and 100),
  score_grade          text not null default 'C' check (score_grade in ('A','B','C','D','F')),
  score_delta          int  null,
  views_delta_pct      numeric(6,1) null,

  top_media_ids        text[] not null default '{}',
  trending_style_tags  text[] not null default '{}',
  admin_notes          text   null,

  unique (listing_id, snapshot_date)
);

create index if not exists idx_vms_listing_id    on public.vendor_media_scorecard (listing_id, snapshot_date desc);
create index if not exists idx_vms_snapshot_date on public.vendor_media_scorecard (snapshot_date desc);
create index if not exists idx_vms_score         on public.vendor_media_scorecard (media_score desc);

alter table public.vendor_media_scorecard enable row level security;

create policy "vms_vendor_read"
  on public.vendor_media_scorecard for select to authenticated
  using (
    listing_id in (
      select id from public.listings where vendor_id = auth.uid()
    )
  );

create policy "vms_admin_read"
  on public.vendor_media_scorecard for select to authenticated
  using (
    coalesce((auth.jwt() ->> 'is_admin')::boolean, false) = true
  );

create policy "vms_service_write"
  on public.vendor_media_scorecard for all to service_role using (true);

-- Also allow authenticated vendors to update their own scorecard admin_notes
-- (admin notes are admin-only but we use service_role for writes from edge functions)


-- ── 4. RPCs ────────────────────────────────────────────────────────────────

-- RPC 1: per-media event aggregates for a listing
create or replace function public.get_listing_media_stats(
  p_listing_id  uuid,
  p_from        timestamptz default now() - interval '30 days',
  p_to          timestamptz default now()
)
returns table (
  media_id         text,
  views            bigint,
  clicks           bigint,
  dwells           bigint,
  shares           bigint,
  downloads        bigint,
  enquiries        bigint,
  video_plays      bigint,
  avg_dwell_ms     numeric,
  gallery_position int,
  is_hero          boolean
)
language sql security definer stable
as $$
  select
    me.media_id,
    count(*) filter (where me.event_type = 'media_view')          as views,
    count(*) filter (where me.event_type = 'media_click')         as clicks,
    count(*) filter (where me.event_type = 'media_dwell')         as dwells,
    count(*) filter (where me.event_type = 'media_share')         as shares,
    count(*) filter (where me.event_type = 'media_download')      as downloads,
    count(*) filter (where me.event_type = 'media_enquiry')       as enquiries,
    count(*) filter (where me.event_type = 'media_video_play')    as video_plays,
    round(avg(me.dwell_ms) filter (where me.event_type = 'media_dwell'), 0) as avg_dwell_ms,
    mode() within group (order by me.gallery_position)            as gallery_position,
    bool_or(me.is_hero)                                           as is_hero
  from public.media_events me
  where me.listing_id  = p_listing_id
    and me.created_at >= p_from
    and me.created_at <= p_to
  group by me.media_id
  order by views desc;
$$;
grant execute on function public.get_listing_media_stats to anon, authenticated;


-- RPC 2: click-through rate by gallery position
create or replace function public.get_gallery_position_performance(
  p_listing_id  uuid,
  p_from        timestamptz default now() - interval '30 days',
  p_to          timestamptz default now()
)
returns table (
  gallery_position  int,
  impressions       bigint,
  clicks            bigint,
  ctr               numeric
)
language sql security definer stable
as $$
  select
    me.gallery_position,
    count(*) filter (where event_type = 'media_view')  as impressions,
    count(*) filter (where event_type = 'media_click') as clicks,
    round(
      count(*) filter (where event_type = 'media_click')::numeric
      / nullif(count(*) filter (where event_type = 'media_view'), 0) * 100
    , 1) as ctr
  from public.media_events me
  where me.listing_id        = p_listing_id
    and me.gallery_position  is not null
    and me.created_at       >= p_from
    and me.created_at       <= p_to
  group by me.gallery_position
  order by me.gallery_position;
$$;
grant execute on function public.get_gallery_position_performance to anon, authenticated;


-- RPC 3: platform-wide style/subject trend rankings
create or replace function public.get_platform_media_trends(
  p_from   timestamptz default now() - interval '30 days',
  p_to     timestamptz default now(),
  p_limit  int         default 20
)
returns table (
  tag           text,
  tag_type      text,
  total_views   bigint,
  total_clicks  bigint,
  total_shares  bigint,
  listing_count bigint,
  trend_score   numeric
)
language sql security definer stable
as $$
  with style_signals as (
    select
      unnest(mme.style_tags) as tag,
      'style'::text           as tag_type,
      me.event_type,
      me.listing_id
    from public.media_events me
    join public.media_metadata_enrichment mme on mme.media_id = me.media_id
    where me.created_at >= p_from and me.created_at <= p_to
  ),
  subject_signals as (
    select
      unnest(mme.subject_tags) as tag,
      'subject'::text           as tag_type,
      me.event_type,
      me.listing_id
    from public.media_events me
    join public.media_metadata_enrichment mme on mme.media_id = me.media_id
    where me.created_at >= p_from and me.created_at <= p_to
  ),
  all_signals as (
    select * from style_signals
    union all
    select * from subject_signals
  )
  select
    tag,
    tag_type,
    count(*) filter (where event_type = 'media_view')  as total_views,
    count(*) filter (where event_type = 'media_click') as total_clicks,
    count(*) filter (where event_type = 'media_share') as total_shares,
    count(distinct listing_id)                         as listing_count,
    (count(*) filter (where event_type = 'media_view')  * 1
     + count(*) filter (where event_type = 'media_click') * 3
     + count(*) filter (where event_type = 'media_share') * 5)::numeric as trend_score
  from all_signals
  where tag is not null and tag != ''
  group by tag, tag_type
  order by trend_score desc
  limit p_limit;
$$;
grant execute on function public.get_platform_media_trends to authenticated;


-- RPC 4: nightly scorecard compute for one listing
create or replace function public.compute_vendor_media_scorecard(
  p_listing_id  uuid,
  p_date        date default current_date
)
returns void
language plpgsql security definer
as $$
declare
  v_total_media        int;
  v_images_count       int;
  v_videos_count       int;
  v_featured_count     int;
  v_tagged_pct         numeric;
  v_views_30d          int;
  v_clicks_30d         int;
  v_dwells_30d         int;
  v_shares_30d         int;
  v_downloads_30d      int;
  v_enquiries_30d      int;
  v_best_position      int;
  v_top_media_ids      text[];
  v_trending_tags      text[];
  v_media_score        int;
  v_score_grade        text;
  v_from               timestamptz := (p_date - interval '30 days')::timestamptz;
  v_to                 timestamptz := p_date::timestamptz;
begin
  select count(*) into v_total_media
  from public.media_ai_index
  where listing_id = p_listing_id and visibility = 'public';

  select
    count(*) filter (where media_type = 'image'),
    count(*) filter (where media_type = 'video'),
    count(*) filter (where is_featured = true)
  into v_images_count, v_videos_count, v_featured_count
  from public.media_ai_index
  where listing_id = p_listing_id and visibility = 'public';

  select round(
    count(*) filter (where array_length(style_tags,1) > 0)::numeric
    / nullif(count(*), 0) * 100, 1)
  into v_tagged_pct
  from public.media_ai_index
  where listing_id = p_listing_id and visibility = 'public';

  select
    count(*) filter (where event_type = 'media_view'),
    count(*) filter (where event_type = 'media_click'),
    count(*) filter (where event_type = 'media_dwell'),
    count(*) filter (where event_type = 'media_share'),
    count(*) filter (where event_type = 'media_download'),
    count(*) filter (where event_type = 'media_enquiry')
  into v_views_30d, v_clicks_30d, v_dwells_30d, v_shares_30d, v_downloads_30d, v_enquiries_30d
  from public.media_events
  where listing_id = p_listing_id and created_at >= v_from and created_at <= v_to;

  select gallery_position into v_best_position
  from public.get_gallery_position_performance(p_listing_id, v_from, v_to)
  order by ctr desc nulls last limit 1;

  select array_agg(media_id order by (clicks*3 + views + shares*5) desc)
  into v_top_media_ids
  from (
    select
      media_id,
      count(*) filter (where event_type='media_view')  as views,
      count(*) filter (where event_type='media_click') as clicks,
      count(*) filter (where event_type='media_share') as shares
    from public.media_events
    where listing_id = p_listing_id and created_at >= v_from and created_at <= v_to
    group by media_id
    limit 3
  ) t;

  select array_agg(tag order by cnt desc)
  into v_trending_tags
  from (
    select unnest(style_tags) as tag, count(*) as cnt
    from public.media_metadata_enrichment
    where listing_id = p_listing_id
      and media_id in (
        select media_id from public.media_events
        where listing_id = p_listing_id
          and created_at >= v_from and created_at <= v_to
          and event_type = 'media_click'
      )
    group by tag
    limit 5
  ) t;

  v_media_score := least(100, (
    least(20, coalesce(v_images_count, 0) * 2)
    + least(20, coalesce(v_tagged_pct, 0) * 0.2)
    + least(30, coalesce(v_clicks_30d, 0) * 3)
    + least(30, coalesce(v_enquiries_30d, 0) * 10)
  )::int);

  v_score_grade := case
    when v_media_score >= 80 then 'A'
    when v_media_score >= 65 then 'B'
    when v_media_score >= 45 then 'C'
    when v_media_score >= 25 then 'D'
    else 'F'
  end;

  insert into public.vendor_media_scorecard (
    listing_id, snapshot_date,
    total_media, images_count, videos_count, featured_count, tagged_pct,
    views_30d, clicks_30d, dwells_30d, shares_30d, downloads_30d, enquiries_from_media_30d,
    best_position, top_media_ids, trending_style_tags,
    media_score, score_grade
  ) values (
    p_listing_id, p_date,
    coalesce(v_total_media,0), coalesce(v_images_count,0), coalesce(v_videos_count,0),
    coalesce(v_featured_count,0), coalesce(v_tagged_pct,0),
    coalesce(v_views_30d,0), coalesce(v_clicks_30d,0), coalesce(v_dwells_30d,0),
    coalesce(v_shares_30d,0), coalesce(v_downloads_30d,0), coalesce(v_enquiries_30d,0),
    v_best_position,
    coalesce(v_top_media_ids, '{}'),
    coalesce(v_trending_tags, '{}'),
    v_media_score, v_score_grade
  )
  on conflict (listing_id, snapshot_date) do update set
    total_media               = excluded.total_media,
    images_count              = excluded.images_count,
    videos_count              = excluded.videos_count,
    featured_count            = excluded.featured_count,
    tagged_pct                = excluded.tagged_pct,
    views_30d                 = excluded.views_30d,
    clicks_30d                = excluded.clicks_30d,
    dwells_30d                = excluded.dwells_30d,
    shares_30d                = excluded.shares_30d,
    downloads_30d             = excluded.downloads_30d,
    enquiries_from_media_30d  = excluded.enquiries_from_media_30d,
    best_position             = excluded.best_position,
    top_media_ids             = excluded.top_media_ids,
    trending_style_tags       = excluded.trending_style_tags,
    media_score               = excluded.media_score,
    score_grade               = excluded.score_grade;
end;
$$;
grant execute on function public.compute_vendor_media_scorecard to service_role;
