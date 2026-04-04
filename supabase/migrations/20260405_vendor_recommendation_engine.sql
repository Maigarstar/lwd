-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: vendor_recommendation_engine
-- Date: 2026-04-05
-- Purpose: Single-insight recommendation per vendor, based on media score
--          + event behavioural data.
--
-- ONE insight. ONE action. CLEAR cause.
-- Rules run in priority order — first match wins.
--
-- Returns: { rule_key, headline, body, action_hint, priority }
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.get_vendor_recommendation(
  p_listing_id uuid,
  p_from       timestamptz default now() - interval '30 days',
  p_to         timestamptz default now()
)
returns table (
  rule_key    text,
  headline    text,
  body        text,
  action_hint text,
  priority    int
)
language plpgsql security definer stable
as $$
declare
  v_views        bigint;
  v_clicks       bigint;
  v_dwells       bigint;
  v_shares       bigint;
  v_enquiries    bigint;
  v_shortlists   bigint;
  v_avg_dwell    numeric;
  v_click_rate   numeric;
  v_share_rate   numeric;
  v_enq_rate     numeric;
  v_best_pos     int;
  v_media_score  numeric;
  v_img_count    bigint;

  -- Thresholds
  c_low_click    constant numeric := 4;    -- click_rate % below this = weak
  c_low_dwell    constant numeric := 2000; -- ms below this = not holding attention
  c_low_enq      constant numeric := 1.5;  -- enquiry_rate % below this = low conversion
  c_high_score   constant numeric := 75;   -- score above this = high-performing
  c_low_images   constant int     := 6;    -- fewer than this = thin gallery
begin
  -- ── Aggregate events ──────────────────────────────────────────────────────
  select
    count(*) filter (where event_type = 'media_view'),
    count(*) filter (where event_type = 'media_click'),
    count(*) filter (where event_type = 'media_dwell'),
    count(*) filter (where event_type = 'media_share'),
    count(*) filter (where event_type = 'media_enquiry'),
    count(*) filter (where event_type = 'media_save'),
    coalesce(avg(case when event_type = 'media_dwell'
                      then (metadata->>'elapsed_ms')::numeric end), 0)
  into v_views, v_clicks, v_dwells, v_shares, v_enquiries, v_shortlists, v_avg_dwell
  from public.media_events
  where listing_id  = p_listing_id
    and created_at >= p_from
    and created_at <= p_to;

  -- ── Image count + best gallery position ───────────────────────────────────
  select count(*) into v_img_count
  from public.media_ai_index
  where listing_id = p_listing_id;

  -- Best position = position with highest click count
  select gallery_position into v_best_pos
  from   public.media_events
  where  listing_id = p_listing_id
    and  event_type = 'media_click'
    and  gallery_position is not null
    and  created_at >= p_from
  group  by gallery_position
  order  by count(*) desc
  limit  1;

  -- ── Media score (from scorecard, or compute live) ──────────────────────────
  select media_score into v_media_score
  from   public.vendor_media_scorecard
  where  listing_id    = p_listing_id
  order  by snapshot_date desc
  limit  1;

  if v_media_score is null then
    select sc.media_score into v_media_score
    from   public.compute_vendor_media_scorecard(p_listing_id, p_from, p_to) sc;
  end if;

  -- ── Rates ─────────────────────────────────────────────────────────────────
  v_click_rate  := case when coalesce(v_views, 0) > 0 then (v_clicks::numeric / v_views) * 100 else 0 end;
  v_share_rate  := case when coalesce(v_views, 0) > 0 then (v_shares::numeric / v_views) * 100 else 0 end;
  v_enq_rate    := case when coalesce(v_views, 0) > 0 then (v_enquiries::numeric / v_views) * 100 else 0 end;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- RULE ENGINE (priority order — first match wins)
  -- ═══════════════════════════════════════════════════════════════════════════

  -- Rule 1: Best image buried (position > 2, and meaningful traffic)
  if v_best_pos is not null and v_best_pos > 2 and coalesce(v_views, 0) > 10 then
    return query select
      'best_image_buried'::text,
      'Your strongest image is hidden'::text,
      ('Your highest-performing image appears at position ' || v_best_pos ||
       ' in your gallery. Moving it into the first two positions could meaningfully increase engagement and enquiries.')::text,
      'Move your top image to position 1 or 2.'::text,
      1;
    return;
  end if;

  -- Rule 2: High shortlist + low enquiry (intent without conversion)
  if coalesce(v_shortlists, 0) > 5 and v_enq_rate < c_low_enq then
    return query select
      'high_interest_low_conversion'::text,
      'Strong interest, low conversion'::text,
      'Couples are saving and shortlisting your listing — but not enquiring. This often signals that pricing clarity or the enquiry flow itself is creating friction.'::text,
      'Review your enquiry form and pricing visibility.'::text,
      2;
    return;
  end if;

  -- Rule 3: High views, weak click-through (visuals not catching attention)
  if coalesce(v_views, 0) > 20 and v_click_rate < c_low_click then
    return query select
      'weak_visual_engagement'::text,
      'Visuals not capturing attention'::text,
      'Your listing is being seen, but couples are not engaging with your images. Your opening visual may need to be stronger, more distinctive, or more emotionally resonant.'::text,
      'Replace your first image with your most striking shot.'::text,
      3;
    return;
  end if;

  -- Rule 4: Low dwell time (images not holding attention)
  if coalesce(v_dwells, 0) > 5 and v_avg_dwell < c_low_dwell then
    return query select
      'low_dwell'::text,
      'Images not holding attention'::text,
      'Couples are moving quickly through your visuals. Consider adding more depth, variety, or visual storytelling across your gallery — particularly in the middle positions where attention drops.'::text,
      'Add more atmospheric or detail shots between key images.'::text,
      4;
    return;
  end if;

  -- Rule 5: Thin gallery
  if coalesce(v_img_count, 0) < c_low_images then
    return query select
      'thin_gallery'::text,
      'Gallery needs more depth'::text,
      ('Your listing currently has ' || coalesce(v_img_count, 0) ||
       ' image' || case when coalesce(v_img_count, 0) = 1 then '' else 's' end ||
       '. Couples expect to see a full picture of your space — galleries with 12 or more strong images consistently drive higher engagement and enquiry rates.')::text,
      'Upload at least 12 high-quality images across different spaces and moments.'::text,
      5;
    return;
  end if;

  -- Rule 6: High-performing (positive reinforcement)
  if coalesce(v_media_score, 0) >= c_high_score then
    return query select
      'high_performing'::text,
      'Your visuals are working'::text,
      'Your imagery is resonating strongly with couples. The current style, quality, and gallery structure is driving above-average engagement across the platform. Maintaining this standard will continue to attract high-intent enquiries.'::text,
      'Keep your best images prominent — and consider refreshing seasonally.'::text,
      6;
    return;
  end if;

  -- Rule 7: No data yet (default)
  return query select
    'no_data'::text,
    'Building your intelligence picture'::text,
    'As couples interact with your listing, this will generate a personalised recommendation based on exactly how your visuals are performing — what is capturing attention, what is driving enquiries, and what could be stronger.'::text,
    'Ensure your gallery is complete and your best image leads.'::text,
    99;
end;
$$;

grant execute on function public.get_vendor_recommendation to authenticated;
