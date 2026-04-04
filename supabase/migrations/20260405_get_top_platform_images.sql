-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: get_top_platform_images RPC
-- Date: 2026-04-05
-- Purpose: Returns top N images by engagement score across the full platform.
--          Joins media_events aggregates with media_ai_index metadata.
--          Falls back gracefully when no event data exists.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.get_top_platform_images(
  p_from   timestamptz default now() - interval '30 days',
  p_to     timestamptz default now(),
  p_limit  int         default 20
)
returns table (
  media_id         text,
  image_url        text,
  title            text,
  listing_name     text,
  listing_id       uuid,
  category         text,
  region           text,
  country          text,
  is_featured      boolean,
  views            bigint,
  clicks           bigint,
  shares           bigint,
  enquiries        bigint,
  engagement_score numeric
)
language sql security definer stable
as $$
  select
    me.media_id,
    mai.url                                                           as image_url,
    coalesce(nullif(trim(mai.title),    ''),
             nullif(trim(mai.alt_text), ''),
             me.media_id)                                             as title,
    mai.listing_name,
    me.listing_id,
    mai.category,
    mai.region,
    mai.country,
    coalesce(mai.is_featured, false)                                  as is_featured,
    count(*) filter (where me.event_type = 'media_view')              as views,
    count(*) filter (where me.event_type = 'media_click')             as clicks,
    count(*) filter (where me.event_type = 'media_share')             as shares,
    count(*) filter (where me.event_type = 'media_enquiry')           as enquiries,
    (  count(*) filter (where me.event_type = 'media_view')    * 1
     + count(*) filter (where me.event_type = 'media_click')   * 3
     + count(*) filter (where me.event_type = 'media_share')   * 5
     + count(*) filter (where me.event_type = 'media_enquiry') * 10
    )::numeric                                                        as engagement_score
  from public.media_events me
  left join public.media_ai_index mai
         on mai.media_id = me.media_id
  where me.created_at >= p_from
    and me.created_at <= p_to
  group by
    me.media_id, mai.url, mai.title, mai.alt_text,
    mai.listing_name, me.listing_id, mai.category,
    mai.region, mai.country, mai.is_featured
  order by engagement_score desc
  limit p_limit;
$$;

grant execute on function public.get_top_platform_images to authenticated;
