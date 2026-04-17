-- ════════════════════════════════════════════════════════════════════════════
-- Vendor Analytics RPC
-- 20260418_vendor_analytics_rpc.sql
--
-- Provides a token-protected analytics endpoint for magazine ad vendors.
-- Vendors receive a link containing a base64 token encoding:
--   <issue_id>:<page_number>:<vendor_email>
--
-- The function validates the token against magazine_issue_pages (checks that
-- the vendor_email in the slot matches), then returns aggregated read events
-- for that specific page.
--
-- Access: anon role via GRANT EXECUTE (token is the authentication mechanism).
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_vendor_analytics(p_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_decoded   text;
  v_parts     text[];
  v_issue_id  uuid;
  v_page_num  int;
  v_email     text;
  v_slot      jsonb;
  v_issue_title text;
BEGIN
  -- Decode base64 token. JS btoa() produces standard base64.
  BEGIN
    v_decoded := convert_from(decode(p_token, 'base64'), 'UTF8');
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL; -- Invalid base64
  END;

  -- Split on ':' — UUIDs and integers contain no colons; emails rarely do
  v_parts := string_to_array(v_decoded, ':');

  -- Minimum: issue_id (36 chars), page_number, vendor_email
  IF array_length(v_parts, 1) < 3 THEN RETURN NULL; END IF;

  BEGIN
    v_issue_id := v_parts[1]::uuid;
    v_page_num := v_parts[2]::int;
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL; -- Malformed token
  END;

  -- Reconstruct email (may contain ':' if somehow present — join remaining parts)
  v_email := array_to_string(v_parts[3:], ':');

  -- Validate token against slot data
  SELECT
    template_data->'slot',
    mi.title
  INTO v_slot, v_issue_title
  FROM magazine_issue_pages mip
  JOIN magazine_issues mi ON mi.id = mip.issue_id
  WHERE mip.issue_id = v_issue_id
    AND mip.page_number = v_page_num
    AND lower(mip.template_data->'slot'->>'vendor_email') = lower(v_email)
  LIMIT 1;

  IF v_slot IS NULL THEN RETURN NULL; END IF;

  -- Aggregate read events for this page
  RETURN (
    WITH events AS (
      SELECT
        session_id,
        duration_ms,
        created_at::date AS event_date
      FROM magazine_read_events
      WHERE issue_id = v_issue_id
        AND page_number = v_page_num
    ),
    daily AS (
      SELECT
        event_date,
        COUNT(*) AS views
      FROM events
      GROUP BY event_date
      ORDER BY event_date
    )
    SELECT jsonb_build_object(
      -- Core stats
      'total_views',       COUNT(*),
      'unique_readers',    COUNT(DISTINCT session_id),
      'avg_dwell_seconds', COALESCE(ROUND(AVG(CASE WHEN duration_ms > 0 THEN duration_ms / 1000.0 END), 1), 0),
      'best_day_views',    COALESCE((SELECT MAX(views) FROM daily), 0),

      -- Daily trend (array of {date, views} for sparkline)
      'daily_trend', COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object('date', event_date::text, 'views', views)
          ORDER BY event_date
        )
        FROM daily
      ), '[]'::jsonb),

      -- Context
      'issue_id',    v_issue_id,
      'issue_title', v_issue_title,
      'page_number', v_page_num,
      'slot',        v_slot
    )
    FROM events
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_vendor_analytics(text) TO anon;


-- ── Verification ─────────────────────────────────────────────────────────────
-- To test (run as anon role):
--   SELECT get_vendor_analytics('<base64-encoded token>');
--   → Should return NULL for invalid tokens, jsonb data for valid ones.
