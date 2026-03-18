-- RLS Part 3: Internal and admin-only tables
-- !! DO NOT RUN until an admin access model is in place !!
--
-- These tables must not receive anon policies.
-- The admin dashboard currently uses the anon key for all reads and writes.
-- Enabling RLS here without a proper access model will silently break:
--   - CRM (prospects, pipelines, outreach)
--   - Social studio (managed_accounts, social_content, social_campaigns)
--   - Email system (email_sends, email_suppressions, outreach_emails)
--   - Team and platform config (team_members, platform_settings, website_audits)
--
-- Required before running Part 3:
--   Option A: Switch admin dashboard to use service_role key
--             (service_role bypasses RLS entirely — cleanest solution)
--   Option B: Add `authenticated` role policies and ensure admin users
--             authenticate via Supabase Auth before accessing these tables.
--
-- Tables covered by this file (34 lint errors will remain until this is run):
--   managed_accounts, social_campaigns, social_content,
--   prospects, prospect_campaigns, prospect_onboarding_tasks,
--   pipelines, pipeline_stages, pipeline_email_templates,
--   pipeline_assignment_rules, pipeline_assignment_settings,
--   outreach_emails, email_sends, email_suppressions,
--   team_members, platform_settings, website_audits

-- ─── Client portal / social studio ───────────────────────────────────────────

-- ALTER TABLE public.managed_accounts ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "admin_only" ON public.managed_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ALTER TABLE public.social_campaigns ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "admin_only" ON public.social_campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ALTER TABLE public.social_content ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "admin_only" ON public.social_content FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── CRM / Sales pipeline ─────────────────────────────────────────────────────

-- ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "admin_only" ON public.prospects FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ALTER TABLE public.prospect_campaigns ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "admin_only" ON public.prospect_campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ALTER TABLE public.prospect_onboarding_tasks ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "admin_only" ON public.prospect_onboarding_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "admin_only" ON public.pipelines FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "admin_only" ON public.pipeline_stages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ALTER TABLE public.pipeline_email_templates ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "admin_only" ON public.pipeline_email_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ALTER TABLE public.pipeline_assignment_rules ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "admin_only" ON public.pipeline_assignment_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ALTER TABLE public.pipeline_assignment_settings ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "admin_only" ON public.pipeline_assignment_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── Email system ─────────────────────────────────────────────────────────────

-- ALTER TABLE public.outreach_emails ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "admin_only" ON public.outreach_emails FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "admin_only" ON public.email_sends FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "admin_only" ON public.email_suppressions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── Platform admin ───────────────────────────────────────────────────────────

-- ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "admin_only" ON public.team_members FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "admin_only" ON public.platform_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ALTER TABLE public.website_audits ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "admin_only" ON public.website_audits FOR ALL TO authenticated USING (true) WITH CHECK (true);
