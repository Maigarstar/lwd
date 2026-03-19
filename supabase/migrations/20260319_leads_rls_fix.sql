-- ─── Fix: Missing anon INSERT policies on lead engine tables ─────────────────
-- Root cause: 20260318_rls_part2_form_inserts.sql enabled RLS on `leads`
-- and assumed "leads_anon_insert" policy already existed — it was never created.
-- Result: all form submissions were silently blocked.
--
-- Fix: create the missing anon INSERT policies for all tables that
-- createLead() writes to in a single form submission flow.
-- Admin reads are via edge function (service role) so no SELECT policy needed.
-- Run: YES — safe to run immediately.

-- ─── leads ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "leads_anon_insert" ON public.leads;
CREATE POLICY "leads_anon_insert" ON public.leads
  FOR INSERT TO anon
  WITH CHECK (true);

-- ─── lead_events (step 4 of createLead) ──────────────────────────────────────
ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lead_events_anon_insert" ON public.lead_events;
CREATE POLICY "lead_events_anon_insert" ON public.lead_events
  FOR INSERT TO anon
  WITH CHECK (true);

-- ─── lead_messages (step 5 of createLead) ────────────────────────────────────
ALTER TABLE public.lead_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lead_messages_anon_insert" ON public.lead_messages;
CREATE POLICY "lead_messages_anon_insert" ON public.lead_messages
  FOR INSERT TO anon
  WITH CHECK (true);
