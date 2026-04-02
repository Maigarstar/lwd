-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Fix RLS write gaps across admin tables
-- ═══════════════════════════════════════════════════════════════════════════
-- These tables have RLS enabled but no write policies for authenticated
-- admin users. Direct anon-client writes from AdminDashboard were silently
-- failing (RLS blocking without error surfacing).
--
-- Fix: Add FOR ALL TO authenticated policies. Admin uses signInWithPassword
-- so they receive role=authenticated JWT — these policies grant them access.
--
-- Tables covered:
--   reviews               — approve/reject/moderate
--   review_messages       — add/delete review thread messages
--   social_campaigns      — social studio create/update
--   social_content        — social studio content CRUD
--   leads                 — CRM status updates, deal edits
--   lead_messages         — CRM notes, tasks
--   prospects             — sales pipeline create/update
--   pipelines             — pipeline builder
--   pipeline_stages       — pipeline stages CRUD
--   pipeline_email_templates — email template CRUD
-- ═══════════════════════════════════════════════════════════════════════════

-- ── reviews ───────────────────────────────────────────────────────────────────
-- Existing: anon INSERT (submissions) + anon SELECT (approved only)
-- Adding:   authenticated full access (admin moderation)
CREATE POLICY IF NOT EXISTS "reviews_authenticated_all"
  ON public.reviews FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── review_messages ───────────────────────────────────────────────────────────
-- Previously: RLS enabled, no policies at all
CREATE POLICY IF NOT EXISTS "review_messages_anon_insert"
  ON public.review_messages FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "review_messages_authenticated_all"
  ON public.review_messages FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── social_campaigns ──────────────────────────────────────────────────────────
CREATE POLICY IF NOT EXISTS "social_campaigns_authenticated_all"
  ON public.social_campaigns FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── social_content ────────────────────────────────────────────────────────────
CREATE POLICY IF NOT EXISTS "social_content_authenticated_all"
  ON public.social_content FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── leads ─────────────────────────────────────────────────────────────────────
-- Existing: anon INSERT (form submissions), service_role bypass for edge fn
-- Adding:   authenticated UPDATE + SELECT so admin CRM can read/update directly
CREATE POLICY IF NOT EXISTS "leads_authenticated_select"
  ON public.leads FOR SELECT TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "leads_authenticated_update"
  ON public.leads FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

-- ── lead_messages ─────────────────────────────────────────────────────────────
-- Existing: anon INSERT, authenticated SELECT (from 20260402_crm_read_policies)
-- Adding:   authenticated INSERT/UPDATE/DELETE for CRM notes and tasks
CREATE POLICY IF NOT EXISTS "lead_messages_authenticated_write"
  ON public.lead_messages FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "lead_messages_authenticated_update"
  ON public.lead_messages FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "lead_messages_authenticated_delete"
  ON public.lead_messages FOR DELETE TO authenticated
  USING (true);

-- ── prospects ─────────────────────────────────────────────────────────────────
CREATE POLICY IF NOT EXISTS "prospects_anon_select"
  ON public.prospects FOR SELECT TO anon
  USING (true);

CREATE POLICY IF NOT EXISTS "prospects_authenticated_all"
  ON public.prospects FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── pipelines ─────────────────────────────────────────────────────────────────
CREATE POLICY IF NOT EXISTS "pipelines_anon_select"
  ON public.pipelines FOR SELECT TO anon
  USING (true);

CREATE POLICY IF NOT EXISTS "pipelines_authenticated_all"
  ON public.pipelines FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── pipeline_stages ───────────────────────────────────────────────────────────
CREATE POLICY IF NOT EXISTS "pipeline_stages_anon_select"
  ON public.pipeline_stages FOR SELECT TO anon
  USING (true);

CREATE POLICY IF NOT EXISTS "pipeline_stages_authenticated_all"
  ON public.pipeline_stages FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── pipeline_email_templates ──────────────────────────────────────────────────
CREATE POLICY IF NOT EXISTS "pipeline_email_templates_anon_select"
  ON public.pipeline_email_templates FOR SELECT TO anon
  USING (true);

CREATE POLICY IF NOT EXISTS "pipeline_email_templates_authenticated_all"
  ON public.pipeline_email_templates FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── prospect_campaigns ────────────────────────────────────────────────────────
CREATE POLICY IF NOT EXISTS "prospect_campaigns_anon_select"
  ON public.prospect_campaigns FOR SELECT TO anon
  USING (true);

CREATE POLICY IF NOT EXISTS "prospect_campaigns_authenticated_all"
  ON public.prospect_campaigns FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── prospect_onboarding_tasks ─────────────────────────────────────────────────
CREATE POLICY IF NOT EXISTS "prospect_onboarding_tasks_authenticated_all"
  ON public.prospect_onboarding_tasks FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── outreach_emails ───────────────────────────────────────────────────────────
CREATE POLICY IF NOT EXISTS "outreach_emails_authenticated_all"
  ON public.outreach_emails FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── intake_jobs ───────────────────────────────────────────────────────────────
CREATE POLICY IF NOT EXISTS "intake_jobs_authenticated_all"
  ON public.intake_jobs FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
