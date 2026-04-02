-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 1: RLS for leads and vendor_inquiries
-- Idempotent — safe to re-run in dev/staging
-- ═══════════════════════════════════════════════════════════════════════════

-- ── LEADS ─────────────────────────────────────────────────────────────────
-- Public can submit leads. No client-side reads.
-- Admin reads via edge functions (service_role bypasses RLS).
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leads_anon_insert" ON public.leads;

CREATE POLICY "leads_anon_insert"
  ON public.leads
  FOR INSERT
  TO anon
  WITH CHECK (true);


-- ── VENDOR INQUIRIES ──────────────────────────────────────────────────────
-- Public can submit enquiries. No client-side reads.
-- vendor_id is TEXT (slug) — cannot bind to auth.uid().
-- All reads through admin dashboard (service_role bypasses RLS).
ALTER TABLE public.vendor_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inquiries_anon_insert" ON public.vendor_inquiries;

CREATE POLICY "inquiries_anon_insert"
  ON public.vendor_inquiries
  FOR INSERT
  TO anon
  WITH CHECK (true);
