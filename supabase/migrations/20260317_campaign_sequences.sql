-- =============================================================================
-- 20260317_campaign_sequences.sql
-- Extend prospect_campaigns with multi-step sequence support.
--
-- sequence_steps JSONB: array of { step, delay_days, label, subject, body }
-- settings JSONB:       { ai_personalisation, stop_on_reply, max_per_send }
-- step_sent INTEGER:    0=nothing sent, 1=step1 sent, 2=step2 sent, etc.
-- =============================================================================

ALTER TABLE prospect_campaigns
  ADD COLUMN IF NOT EXISTS sequence_steps JSONB    NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS settings       JSONB    NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS step_sent      INTEGER  NOT NULL DEFAULT 0;
