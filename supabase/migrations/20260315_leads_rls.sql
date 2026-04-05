-- ============================================================================
-- Lead Engine - Row Level Security Policies
-- Created: 2026-03-15
-- Purpose: Secure the leads system
--   - anon role: INSERT only on leads + related tables (form submissions)
--   - service_role: bypasses RLS automatically (admin reads/updates)
--   - No anon SELECT or UPDATE (protects PII from public access)
-- ============================================================================

-- Enable RLS on all lead tables
ALTER TABLE leads               ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_conversations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_assignments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_matches        ENABLE ROW LEVEL SECURITY;

-- ─── LEADS: anon can INSERT (enquiry form submissions) ────────────────────────
CREATE POLICY "leads_anon_insert"
  ON leads FOR INSERT
  TO anon
  WITH CHECK (true);

-- ─── LEAD EVENTS: anon can INSERT (event logging from frontend) ───────────────
CREATE POLICY "lead_events_anon_insert"
  ON lead_events FOR INSERT
  TO anon
  WITH CHECK (true);

-- ─── LEAD MESSAGES: anon can INSERT (initial message storage) ────────────────
CREATE POLICY "lead_messages_anon_insert"
  ON lead_messages FOR INSERT
  TO anon
  WITH CHECK (true);

-- ─── LEAD NOTIFICATIONS: anon can INSERT (notification logging) ──────────────
CREATE POLICY "lead_notifications_anon_insert"
  ON lead_notifications FOR INSERT
  TO anon
  WITH CHECK (true);

-- ─── OTHER TABLES: no anon access (service_role only via bypass) ─────────────
-- lead_conversations, lead_assignments, lead_matches: no anon policies needed
-- service_role bypasses RLS automatically for all admin operations

-- ============================================================================
-- NOTE: When admin auth is added, replace service_role reads with:
--   CREATE POLICY "leads_admin_select" ON leads FOR SELECT
--     TO authenticated USING (auth.jwt() ->> 'role' = 'admin');
--   CREATE POLICY "leads_admin_update" ON leads FOR UPDATE
--     TO authenticated USING (auth.jwt() ->> 'role' = 'admin')
--     WITH CHECK (auth.jwt() ->> 'role' = 'admin');
-- ============================================================================
