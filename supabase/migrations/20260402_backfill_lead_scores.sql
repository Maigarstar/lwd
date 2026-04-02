-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Backfill lead scores for all existing rows
-- Run once after 20260401_unify_lead_statuses.sql
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Replicates the calcLeadScore() logic from:
--   supabase/functions/admin-leads/index.ts
--   src/constants/leadStatuses.js
--
-- Scoring breakdown:
--   Contact completeness:  phone(+10), website in req(+8), interests(+7 each, max 28)
--   Source quality:        Partner Enquiry Form(+20), venue(+15), other(+8)
--   Engagement signals:    message > 80 chars(+7)
--   Status progression:    new(0), qualified(+12), engaged(+20),
--                          proposal_sent(+35), booked(+55), lost(0), spam(0)
--   Max: 100
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE leads
SET
  score = LEAST(100, (
    -- Contact completeness
    CASE WHEN phone IS NOT NULL AND phone <> '' THEN 10 ELSE 0 END
    + CASE WHEN requirements_json->>'website' IS NOT NULL AND requirements_json->>'website' <> '' THEN 8 ELSE 0 END
    + LEAST(
        COALESCE(jsonb_array_length(requirements_json->'interests'), 0) * 7,
        28
      )

    -- Source quality
    + CASE
        WHEN lead_source = 'Partner Enquiry Form'                        THEN 20
        WHEN lead_source ILIKE '%venue%'                                 THEN 15
        WHEN lead_source IS NOT NULL AND lead_source <> ''               THEN 8
        ELSE 0
      END

    -- Engagement signal: long message
    + CASE WHEN message IS NOT NULL AND LENGTH(message) > 80 THEN 7 ELSE 0 END

    -- Status progression bonus
    + CASE status
        WHEN 'new'           THEN 0
        WHEN 'qualified'     THEN 12
        WHEN 'engaged'       THEN 20
        WHEN 'proposal_sent' THEN 35
        WHEN 'booked'        THEN 55
        WHEN 'lost'          THEN 0
        WHEN 'spam'          THEN 0
        ELSE 0
      END
  )),
  updated_at = NOW()
WHERE score IS NULL OR score = 0;

-- Verify: show score distribution after backfill
SELECT
  CASE
    WHEN score >= 70 THEN 'Hot (70+)'
    WHEN score >= 40 THEN 'Warm (40-69)'
    ELSE 'Cold (<40)'
  END AS band,
  COUNT(*) AS lead_count,
  ROUND(AVG(score), 1) AS avg_score
FROM leads
GROUP BY band
ORDER BY MIN(score) DESC;
