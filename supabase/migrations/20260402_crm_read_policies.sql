-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: RLS SELECT policies for CRM admin reads
-- ═══════════════════════════════════════════════════════════════════════════
-- leads are now fetched via the admin-leads edge function (service_role)
-- so no SELECT policy is needed on the leads table itself.
--
-- lead_messages and lead_events are still read directly via the supabase
-- browser client (authenticated JWT). Add SELECT policies so logged-in
-- admin users can read them.
-- ═══════════════════════════════════════════════════════════════════════════

-- lead_messages: allow authenticated reads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'lead_messages' AND policyname = 'authenticated_read_lead_messages'
  ) THEN
    CREATE POLICY "authenticated_read_lead_messages"
      ON lead_messages FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- lead_events: allow authenticated reads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'lead_events' AND policyname = 'authenticated_read_lead_events'
  ) THEN
    CREATE POLICY "authenticated_read_lead_events"
      ON lead_events FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- Verify policies created
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename IN ('lead_messages', 'lead_events')
ORDER BY tablename, policyname;
