-- Fix 1: Add 'campaign' to outreach_emails.email_type CHECK constraint
-- Campaign emails were failing silently with a DB constraint violation.
ALTER TABLE outreach_emails DROP CONSTRAINT IF EXISTS outreach_emails_email_type_check;
ALTER TABLE outreach_emails ADD CONSTRAINT outreach_emails_email_type_check
  CHECK (email_type IN ('cold','follow_up_1','follow_up_2','proposal','custom','campaign'));

-- Fix 2: Add 'archived' to prospects.status CHECK constraint
-- The Archive button in ProspectPanel sets status='archived' which violated the constraint.
ALTER TABLE prospects DROP CONSTRAINT IF EXISTS prospects_status_check;
ALTER TABLE prospects ADD CONSTRAINT prospects_status_check
  CHECK (status IN ('active','converted','lost','paused','archived'));
