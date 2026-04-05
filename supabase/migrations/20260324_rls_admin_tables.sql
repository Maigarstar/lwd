-- =============================================================================
-- Phase 2: RLS for internal admin-only tables
-- Idempotent — safe to re-run
--
-- These tables are service_role only in practice.
-- service_role bypasses RLS automatically — no policies needed.
-- Enabling RLS with zero policies means anon + authenticated get nothing.
-- =============================================================================

-- ── Email infrastructure ──────────────────────────────────────────────────
ALTER TABLE public.email_sends          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_suppressions   ENABLE ROW LEVEL SECURITY;

-- ── Job queue ─────────────────────────────────────────────────────────────
ALTER TABLE public.intake_jobs          ENABLE ROW LEVEL SECURITY;

-- ── Lead pipeline internal tables ─────────────────────────────────────────
ALTER TABLE public.lead_events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_messages        ENABLE ROW LEVEL SECURITY;

-- ── Account management ────────────────────────────────────────────────────
ALTER TABLE public.managed_accounts     ENABLE ROW LEVEL SECURITY;

-- ── Pipeline engine ───────────────────────────────────────────────────────
ALTER TABLE public.pipeline_assignment_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_email_templates      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipelines                     ENABLE ROW LEVEL SECURITY;

-- ── Platform configuration ────────────────────────────────────────────────
ALTER TABLE public.platform_settings    ENABLE ROW LEVEL SECURITY;

-- ── Prospect / outreach ───────────────────────────────────────────────────
ALTER TABLE public.prospect_campaigns         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_onboarding_tasks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospects                  ENABLE ROW LEVEL SECURITY;

-- ── Social / content ──────────────────────────────────────────────────────
ALTER TABLE public.social_campaigns     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_content       ENABLE ROW LEVEL SECURITY;

-- ── Team ──────────────────────────────────────────────────────────────────
ALTER TABLE public.team_members         ENABLE ROW LEVEL SECURITY;

-- ── Outreach / audit ──────────────────────────────────────────────────────
ALTER TABLE public.outreach_emails            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_assignment_rules  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_audits             ENABLE ROW LEVEL SECURITY;

-- No SELECT / INSERT / UPDATE / DELETE policies for anon or authenticated.
-- All access goes through service_role (edge functions, admin dashboard).
--
-- Intentionally deferred to Phase 3 (need public SELECT policies first):
--   listings, listing_media, venue_showcases
