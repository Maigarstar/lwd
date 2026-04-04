-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: media_score_engine
-- Date: 2026-04-05
-- Purpose: Proper, scalable media scoring function.
--
-- Score = Quality of engagement, not volume.
-- Formula:
--   1. Rates: click_rate, dwell_quality, share_rate, enquiry_rate (per views)
--   2. Intent score (weighted): enquiry ×40, share ×20, click ×25, dwell ×15
--   3. Volume modifier: log10(views + 1) × 5 (capped influence)
--   4. Final: clamp( intent × 0.8 + volume_modifier, 0, 100 )
--
-- Grading: A 80–100 · B 65–79 · C 50–64 · D 35–49 · F <35
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.compute_vendor_media_scorecard(
  p_listing_id      uuid,
  p_from            timestamptz default now() - interval '30 days',
  p_to              timestamptz default now(),
  p_benchmark_dwell numeric     default 4500   -- ms; avg good dwell on platform
)
returns table (
  listing_id     uuid,
  media_score    numeric,
  score_grade    text,
  views          bigint,
  clicks         bigint,
  dwells         bigint,
  shares         bigint,
  enquiries      bigint,
  avg_dwell_ms   numeric,
  click_rate     numeric,
  dwell_quality  numeric,
  share_rate     numeric,
  enquiry_rate   numeric,
  intent_score   numeric,
  volume_factor  numeric,
  images_count   bigint,
  snapshot_date  date
)
language plpgsql security definer stable
as $$
declare
  v_views       bigint;
  v_clicks      bigint;
  v_dwells      bigint;
  v_shares      bigint;
  v_enquiries   bigint;
  v_avg_dwell   numeric;
  v_click_rate  numeric;
  v_dwell_q     numeric;
  v_share_rate  numeric;
  v_enq_rate    numeric;
  v_intent      numeric;
  v_volume      numeric;
  v_score       numeric;
  v_grade       text;
  v_img_count   bigint;
begin
  -- ── Aggregate events ──────────────────────────────────────────────────────
  select
    count(*) filter (where me.event_type = 'media_view')    ,
    count(*) filter (where me.event_type = 'media_click')   ,
    count(*) filter (where me.event_type = 'media_dwell')   ,
    count(*) filter (where me.event_type = 'media_share')   ,
    count(*) filter (where me.event_type = 'media_enquiry') ,
    coalesce(
      avg(case when me.event_type = 'media_dwell'
               then (me.metadata->>'elapsed_ms')::numeric end),
      0
    )
  into v_views, v_clicks, v_dwells, v_shares, v_enquiries, v_avg_dwell
  from public.media_events me
  where me.listing_id  = p_listing_id
    and me.created_at >= p_from
    and me.created_at <= p_to;

  -- ── Image count ───────────────────────────────────────────────────────────
  select count(*) into v_img_count
  from public.media_ai_index
  where listing_id = p_listing_id;

  -- ── Guard: no views → score 0 ─────────────────────────────────────────────
  if coalesce(v_views, 0) = 0 then
    return query select
      p_listing_id, 0::numeric, 'F'::text,
      0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint,
      0::numeric, 0::numeric, 0::numeric, 0::numeric, 0::numeric,
      0::numeric, 0::numeric,
      coalesce(v_img_count, 0),
      current_date;
    return;
  end if;

  -- ── Rates (protected division) ────────────────────────────────────────────
  v_click_rate := (v_clicks::numeric / v_views) * 100;   -- 0–100%
  v_dwell_q    := least(v_avg_dwell / p_benchmark_dwell, 2.0);  -- cap at 2× benchmark
  v_share_rate := (v_shares::numeric / v_views) * 100;
  v_enq_rate   := (v_enquiries::numeric / v_views) * 100;

  -- ── Intent score (weighted, raw ≈ 0–100 when rates hit practical maxima) ──
  -- click_rate max ~15%, share_rate max ~5%, enquiry_rate max ~8%, dwell_quality 0–2
  -- Scale to 0–100: divide each rate by its expected max, multiply by weight
  v_intent :=
    ( least(v_click_rate  / 15,  1) * 25  )   -- clicks
  + ( least(v_dwell_q,          1) * 15  )   -- dwell quality (already 0–1 capped)
  + ( least(v_share_rate  / 5,   1) * 20  )   -- shares
  + ( least(v_enq_rate    / 8,   1) * 40  );  -- enquiries (highest weight)
  -- intent_score now in 0–100

  -- ── Volume modifier ────────────────────────────────────────────────────────
  v_volume := log(v_views + 1) * 5;   -- log10; 10 views≈5pt, 1000 views≈15pt, 10k≈20pt

  -- ── Final score ────────────────────────────────────────────────────────────
  v_score := least( greatest( (v_intent * 0.8) + v_volume, 0 ), 100 );
  v_score := round(v_score, 1);

  -- ── Grade ──────────────────────────────────────────────────────────────────
  v_grade := case
    when v_score >= 80 then 'A'
    when v_score >= 65 then 'B'
    when v_score >= 50 then 'C'
    when v_score >= 35 then 'D'
    else 'F'
  end;

  return query select
    p_listing_id,
    v_score,
    v_grade,
    coalesce(v_views,     0),
    coalesce(v_clicks,    0),
    coalesce(v_dwells,    0),
    coalesce(v_shares,    0),
    coalesce(v_enquiries, 0),
    round(v_avg_dwell, 0),
    round(v_click_rate, 2),
    round(v_dwell_q,    3),
    round(v_share_rate, 2),
    round(v_enq_rate,   2),
    round(v_intent,     1),
    round(v_volume,     1),
    coalesce(v_img_count, 0),
    current_date;
end;
$$;

-- ── Batch upsert scorecard for ALL listings ────────────────────────────────
create or replace function public.refresh_all_media_scorecards(
  p_from timestamptz default now() - interval '30 days',
  p_to   timestamptz default now()
)
returns void
language plpgsql security definer
as $$
declare
  r record;
  sc record;
begin
  -- Get all listing_ids that have any media_events
  for r in
    select distinct listing_id
    from   public.media_events
    where  listing_id is not null
  loop
    -- Compute score for this listing
    select * into sc
    from public.compute_vendor_media_scorecard(r.listing_id, p_from, p_to);

    -- Previous score for delta
    declare
      v_prev_score numeric;
      v_delta      int;
    begin
      select media_score into v_prev_score
      from   public.vendor_media_scorecard
      where  listing_id    = r.listing_id
        and  snapshot_date = current_date - 1;

      v_delta := case
        when v_prev_score is not null
        then (sc.media_score - v_prev_score)::int
        else null
      end;

      insert into public.vendor_media_scorecard (
        listing_id, media_score, score_grade, score_delta,
        views_30d, clicks_30d, images_count, snapshot_date
      ) values (
        r.listing_id, sc.media_score, sc.score_grade, v_delta,
        sc.views, sc.clicks, sc.images_count, current_date
      )
      on conflict (listing_id, snapshot_date) do update set
        media_score   = excluded.media_score,
        score_grade   = excluded.score_grade,
        score_delta   = excluded.score_delta,
        views_30d     = excluded.views_30d,
        clicks_30d    = excluded.clicks_30d,
        images_count  = excluded.images_count;
    end;
  end loop;
end;
$$;

grant execute on function public.compute_vendor_media_scorecard  to authenticated;
grant execute on function public.refresh_all_media_scorecards    to authenticated;
