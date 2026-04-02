-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Fix RLS write gaps across admin tables
-- ═══════════════════════════════════════════════════════════════════════════
-- These tables have RLS enabled but no write policies for authenticated
-- admin users. Direct anon-client writes from AdminDashboard were silently
-- failing (RLS blocking without error surfacing).
--
-- Fix: Add FOR ALL TO authenticated policies. Admin uses signInWithPassword
-- so they receive role=authenticated JWT — these policies grant them access.
-- ═══════════════════════════════════════════════════════════════════════════

-- helper: only creates the policy if it doesn't already exist
DO $$ BEGIN

  -- ── reviews ───────────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reviews' AND policyname='reviews_authenticated_all') THEN
    CREATE POLICY "reviews_authenticated_all"
      ON public.reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;

  -- ── review_messages ───────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='review_messages' AND policyname='review_messages_anon_insert') THEN
    CREATE POLICY "review_messages_anon_insert"
      ON public.review_messages FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='review_messages' AND policyname='review_messages_authenticated_all') THEN
    CREATE POLICY "review_messages_authenticated_all"
      ON public.review_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;

  -- ── social_campaigns ──────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='social_campaigns' AND policyname='social_campaigns_authenticated_all') THEN
    CREATE POLICY "social_campaigns_authenticated_all"
      ON public.social_campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;

  -- ── social_content ────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='social_content' AND policyname='social_content_authenticated_all') THEN
    CREATE POLICY "social_content_authenticated_all"
      ON public.social_content FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;

  -- ── leads ─────────────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='leads' AND policyname='leads_authenticated_select') THEN
    CREATE POLICY "leads_authenticated_select"
      ON public.leads FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='leads' AND policyname='leads_authenticated_update') THEN
    CREATE POLICY "leads_authenticated_update"
      ON public.leads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;

  -- ── lead_messages ─────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lead_messages' AND policyname='lead_messages_authenticated_write') THEN
    CREATE POLICY "lead_messages_authenticated_write"
      ON public.lead_messages FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lead_messages' AND policyname='lead_messages_authenticated_update') THEN
    CREATE POLICY "lead_messages_authenticated_update"
      ON public.lead_messages FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lead_messages' AND policyname='lead_messages_authenticated_delete') THEN
    CREATE POLICY "lead_messages_authenticated_delete"
      ON public.lead_messages FOR DELETE TO authenticated USING (true);
  END IF;

  -- ── prospects ─────────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prospects' AND policyname='prospects_anon_select') THEN
    CREATE POLICY "prospects_anon_select"
      ON public.prospects FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prospects' AND policyname='prospects_authenticated_all') THEN
    CREATE POLICY "prospects_authenticated_all"
      ON public.prospects FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;

  -- ── pipelines ─────────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pipelines' AND policyname='pipelines_anon_select') THEN
    CREATE POLICY "pipelines_anon_select"
      ON public.pipelines FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pipelines' AND policyname='pipelines_authenticated_all') THEN
    CREATE POLICY "pipelines_authenticated_all"
      ON public.pipelines FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;

  -- ── pipeline_stages ───────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pipeline_stages' AND policyname='pipeline_stages_anon_select') THEN
    CREATE POLICY "pipeline_stages_anon_select"
      ON public.pipeline_stages FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pipeline_stages' AND policyname='pipeline_stages_authenticated_all') THEN
    CREATE POLICY "pipeline_stages_authenticated_all"
      ON public.pipeline_stages FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;

  -- ── pipeline_email_templates ──────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pipeline_email_templates' AND policyname='pipeline_email_templates_anon_select') THEN
    CREATE POLICY "pipeline_email_templates_anon_select"
      ON public.pipeline_email_templates FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pipeline_email_templates' AND policyname='pipeline_email_templates_authenticated_all') THEN
    CREATE POLICY "pipeline_email_templates_authenticated_all"
      ON public.pipeline_email_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;

  -- ── prospect_campaigns ────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prospect_campaigns' AND policyname='prospect_campaigns_anon_select') THEN
    CREATE POLICY "prospect_campaigns_anon_select"
      ON public.prospect_campaigns FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prospect_campaigns' AND policyname='prospect_campaigns_authenticated_all') THEN
    CREATE POLICY "prospect_campaigns_authenticated_all"
      ON public.prospect_campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;

  -- ── prospect_onboarding_tasks ─────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='prospect_onboarding_tasks' AND policyname='prospect_onboarding_tasks_authenticated_all') THEN
    CREATE POLICY "prospect_onboarding_tasks_authenticated_all"
      ON public.prospect_onboarding_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;

  -- ── outreach_emails ───────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='outreach_emails' AND policyname='outreach_emails_authenticated_all') THEN
    CREATE POLICY "outreach_emails_authenticated_all"
      ON public.outreach_emails FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;

  -- ── intake_jobs ───────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='intake_jobs' AND policyname='intake_jobs_authenticated_all') THEN
    CREATE POLICY "intake_jobs_authenticated_all"
      ON public.intake_jobs FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;

END $$;
