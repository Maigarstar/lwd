-- ============================================================================
-- Unify Lead Statuses
-- Created: 2026-04-01
-- Purpose: Collapse 4 competing status systems into one canonical set:
--          new → qualified → engaged → proposal_sent → booked → lost | spam
--
-- Mapping:
--   contacted        → engaged
--   sent_to_partner  → engaged
--   partner_replied  → engaged
--   partner_opened   → engaged
--   in_conversation  → engaged
--   proposal         → proposal_sent
--   converted        → booked
--   archived         → lost (with legacy note)
--
-- Preserves history: logs previous status into lead_events before mapping.
-- ============================================================================

-- Step 1: Log every non-canonical status into lead_events before migration
INSERT INTO lead_events (lead_id, event_type, event_label, event_data)
SELECT
  id,
  'status_migration',
  'Status migrated from legacy value',
  jsonb_build_object(
    'legacy_status', status,
    'migration_date', now()::text,
    'migration_version', '20260401_unify_lead_statuses'
  )
FROM leads
WHERE status NOT IN ('new', 'qualified', 'engaged', 'proposal_sent', 'booked', 'lost', 'spam');

-- Step 2: Map old statuses to unified model
UPDATE leads SET status = 'engaged'       WHERE status IN ('contacted', 'sent_to_partner', 'partner_replied', 'partner_opened', 'in_conversation');
UPDATE leads SET status = 'proposal_sent' WHERE status = 'proposal';
UPDATE leads SET status = 'booked'        WHERE status = 'converted';

-- Step 3: Handle archived separately — map to lost with a note
INSERT INTO lead_events (lead_id, event_type, event_label, event_data)
SELECT
  id,
  'status_migration',
  'Archived lead mapped to lost during status unification',
  jsonb_build_object(
    'legacy_status', 'archived',
    'migration_note', 'Was archived, mapped to lost. Review if this lead should be reactivated.',
    'migration_date', now()::text
  )
FROM leads
WHERE status = 'archived';

UPDATE leads SET status = 'lost' WHERE status = 'archived';

-- Step 4: Add CHECK constraint to prevent future drift
ALTER TABLE leads ADD CONSTRAINT leads_status_check
  CHECK (status IN ('new', 'qualified', 'engaged', 'proposal_sent', 'booked', 'lost', 'spam'));

-- Step 5: Ensure score column exists and is indexed (for persisted scoring)
-- Score column already exists from original migration (INTEGER DEFAULT 0)
-- Just ensure index exists
CREATE INDEX IF NOT EXISTS leads_score_idx ON leads(score DESC);

-- Step 6: Add proposal_sent_at lifecycle timestamp if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'proposal_sent_at'
  ) THEN
    ALTER TABLE leads ADD COLUMN proposal_sent_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'engaged_at'
  ) THEN
    ALTER TABLE leads ADD COLUMN engaged_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'spam_reason'
  ) THEN
    ALTER TABLE leads ADD COLUMN spam_reason TEXT;
  END IF;
END $$;

COMMENT ON TABLE leads IS 'Unified lead model. Canonical statuses: new, qualified, engaged, proposal_sent, booked, lost, spam. Partner workflow tracked via metadata fields (vendor_notified_at, responded_at, etc), not statuses.';
