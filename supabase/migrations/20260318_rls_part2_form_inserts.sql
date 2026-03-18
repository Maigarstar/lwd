-- RLS Part 2: Public form submission tables
-- Access model: anon INSERT only, tightly scoped.
-- No anon SELECT, UPDATE, or DELETE — submitted data is private.
-- Run: YES — safe to run now.

-- ─── leads ───────────────────────────────────────────────────────────────────
-- Existing policy `leads_anon_insert` already covers anon INSERT.
-- Enabling RLS activates that policy. No new policy needed.

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- ─── vendor_enquiries ────────────────────────────────────────────────────────
-- Existing policies cover: anon INSERT, vendor SELECT (own), vendor UPDATE (own).
-- Enabling RLS activates all of them.

ALTER TABLE public.vendor_enquiries ENABLE ROW LEVEL SECURITY;

-- ─── newsletter_subscribers ──────────────────────────────────────────────────
-- Public subscribe form: anon INSERT only.
-- Admin reads subscribers via admin tooling (covered by Part 3 access model).

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_subscribe" ON public.newsletter_subscribers;
CREATE POLICY "anon_subscribe" ON public.newsletter_subscribers
  FOR INSERT TO anon
  WITH CHECK (true);
