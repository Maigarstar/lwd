-- ============================================================================
-- Taigenic B2B Pipeline
-- Created: 2026-03-24
-- Purpose: Pipeline for B2B enquiries from the /taigenic landing page.
--          Stages: New Enquiry → Contacted → Demo Scheduled → Proposal Sent
--                  → Negotiating → Closed Won → Closed Lost
-- ============================================================================

-- ── Insert Taigenic B2B pipeline ─────────────────────────────────────────────
INSERT INTO pipelines (id, name, partner_type, description, color, is_default, sort_order)
VALUES (
  'a1000000-0000-0000-0000-000000000003',
  'Taigenic B2B',
  'brand',
  'B2B pipeline for Taigenic licensing, partnership, demo, and advertising enquiries from the /taigenic landing page.',
  '#c9a84c',
  false,
  2
)
ON CONFLICT (id) DO NOTHING;

-- ── Insert pipeline stages ────────────────────────────────────────────────────
INSERT INTO pipeline_stages (id, pipeline_id, name, position, color, description)
VALUES
  ('b1000000-0000-0000-0000-000000000020', 'a1000000-0000-0000-0000-000000000003', 'New Enquiry',      0, '#c9a84c', 'Inbound enquiry received from Taigenic landing page'),
  ('b1000000-0000-0000-0000-000000000021', 'a1000000-0000-0000-0000-000000000003', 'Contacted',        1, '#8f9eb4', 'Initial response sent'),
  ('b1000000-0000-0000-0000-000000000022', 'a1000000-0000-0000-0000-000000000003', 'Demo Scheduled',   2, '#6b9e78', 'Demo or discovery call booked'),
  ('b1000000-0000-0000-0000-000000000023', 'a1000000-0000-0000-0000-000000000003', 'Proposal Sent',    3, '#9b8abf', 'Proposal or pricing deck sent'),
  ('b1000000-0000-0000-0000-000000000024', 'a1000000-0000-0000-0000-000000000003', 'Negotiating',      4, '#bf9a5a', 'In active negotiation'),
  ('b1000000-0000-0000-0000-000000000025', 'a1000000-0000-0000-0000-000000000003', 'Closed Won',       5, '#4caf82', 'Deal closed successfully'),
  ('b1000000-0000-0000-0000-000000000026', 'a1000000-0000-0000-0000-000000000003', 'Closed Lost',      6, '#e05c4a', 'Opportunity did not proceed')
ON CONFLICT (id) DO NOTHING;
