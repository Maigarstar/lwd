-- ── 20260416_magazine_ab_cover.sql ─────────────────────────────────────────────
-- A/B Cover Testing for magazine_issues.
-- Adds alt cover image columns, test flag, and impression/click counters.
-- Also creates the increment_ab_stat RPC used by the front-end.

ALTER TABLE magazine_issues
  ADD COLUMN IF NOT EXISTS alt_cover_image        text,
  ADD COLUMN IF NOT EXISTS alt_cover_storage_path text,
  ADD COLUMN IF NOT EXISTS ab_test_active         boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ab_variant_impressions  jsonb   NOT NULL DEFAULT '{"a":0,"b":0}',
  ADD COLUMN IF NOT EXISTS ab_variant_clicks       jsonb   NOT NULL DEFAULT '{"a":0,"b":0}';

COMMENT ON COLUMN magazine_issues.alt_cover_image        IS 'Alternate cover for A/B test (variant B)';
COMMENT ON COLUMN magazine_issues.alt_cover_storage_path IS 'Storage path for variant B cover';
COMMENT ON COLUMN magazine_issues.ab_test_active         IS 'When true, 50% of visitors see alt_cover_image';
COMMENT ON COLUMN magazine_issues.ab_variant_impressions IS 'Impression counters: {"a": N, "b": N}';
COMMENT ON COLUMN magazine_issues.ab_variant_clicks      IS 'Click counters: {"a": N, "b": N}';

-- ── RPC: increment_ab_stat ────────────────────────────────────────────────────
-- Called fire-and-forget from the front-end to track impressions and clicks.
CREATE OR REPLACE FUNCTION increment_ab_stat(p_issue_id uuid, p_variant text, p_field text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  current_val jsonb;
  new_val     jsonb;
BEGIN
  IF p_field = 'impressions' THEN
    SELECT ab_variant_impressions INTO current_val FROM magazine_issues WHERE id = p_issue_id;
    new_val := jsonb_set(current_val, ARRAY[p_variant], to_jsonb((COALESCE((current_val->>p_variant)::int, 0) + 1)));
    UPDATE magazine_issues SET ab_variant_impressions = new_val WHERE id = p_issue_id;
  ELSIF p_field = 'clicks' THEN
    SELECT ab_variant_clicks INTO current_val FROM magazine_issues WHERE id = p_issue_id;
    new_val := jsonb_set(current_val, ARRAY[p_variant], to_jsonb((COALESCE((current_val->>p_variant)::int, 0) + 1)));
    UPDATE magazine_issues SET ab_variant_clicks = new_val WHERE id = p_issue_id;
  END IF;
END;
$$;
