-- ─────────────────────────────────────────────────────────────────────────────
-- Pipeline Builder: Custom multi-pipeline CRM engine
-- Tables: pipelines, pipeline_stages, pipeline_email_templates
-- Extends: prospects (add pipeline_id, stage_id)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── pipelines ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pipelines (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT    NOT NULL,
  partner_type  TEXT    NOT NULL DEFAULT 'custom'
                  CHECK (partner_type IN ('venue','vendor','planner','custom')),
  description   TEXT,
  color         TEXT    NOT NULL DEFAULT '#8f7420',
  is_default    BOOLEAN NOT NULL DEFAULT false,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pipelines_partner_type_idx ON pipelines (partner_type);

-- ── pipeline_stages ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pipeline_stages (
  id                    UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id           UUID    NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  name                  TEXT    NOT NULL,
  color                 TEXT    NOT NULL DEFAULT '#8f7420',
  position              INTEGER NOT NULL DEFAULT 0,
  is_won                BOOLEAN NOT NULL DEFAULT false,
  is_lost               BOOLEAN NOT NULL DEFAULT false,
  auto_follow_up_days   INTEGER,          -- null = no auto follow-up
  email_template_id     UUID,             -- FK added after template table created
  closed_won_actions    JSONB   NOT NULL DEFAULT '[]',
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pipeline_stages_pipeline_idx ON pipeline_stages (pipeline_id);
CREATE INDEX IF NOT EXISTS pipeline_stages_position_idx ON pipeline_stages (pipeline_id, position);

-- ── pipeline_email_templates ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pipeline_email_templates (
  id           UUID  DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id  UUID  NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  stage_id     UUID  REFERENCES pipeline_stages(id) ON DELETE SET NULL,
  name         TEXT  NOT NULL,
  email_type   TEXT  NOT NULL DEFAULT 'custom'
                 CHECK (email_type IN ('cold','follow_up_1','follow_up_2','proposal','welcome','custom')),
  subject      TEXT  NOT NULL,
  body         TEXT  NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pipeline_email_templates_pipeline_idx ON pipeline_email_templates (pipeline_id);
CREATE INDEX IF NOT EXISTS pipeline_email_templates_stage_idx    ON pipeline_email_templates (stage_id);

-- Add FK from pipeline_stages.email_template_id now that templates table exists
ALTER TABLE pipeline_stages
  ADD CONSTRAINT fk_stage_email_template
  FOREIGN KEY (email_template_id) REFERENCES pipeline_email_templates(id) ON DELETE SET NULL;

-- ── Extend prospects ──────────────────────────────────────────────────────────

ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES pipelines(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS stage_id    UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS prospects_pipeline_id_idx ON prospects (pipeline_id);
CREATE INDEX IF NOT EXISTS prospects_stage_id_idx    ON prospects (stage_id);

-- ── updated_at triggers ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS pipelines_updated_at ON pipelines;
CREATE TRIGGER pipelines_updated_at
  BEFORE UPDATE ON pipelines
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS pipeline_email_templates_updated_at ON pipeline_email_templates;
CREATE TRIGGER pipeline_email_templates_updated_at
  BEFORE UPDATE ON pipeline_email_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE pipelines                DISABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages          DISABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_email_templates DISABLE ROW LEVEL SECURITY;

-- ── Seed: 3 default pipelines (fixed UUIDs for idempotent re-runs) ────────────

INSERT INTO pipelines (id, name, partner_type, description, color, is_default, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Venue Partnerships',          'venue',   'Outreach pipeline for wedding venues',          '#8f7420', true,  0),
  ('a1000000-0000-0000-0000-000000000002', 'Vendor Partnerships',         'vendor',  'Outreach pipeline for wedding suppliers',        '#2c6e49', false, 1),
  ('a1000000-0000-0000-0000-000000000003', 'Wedding Planner Partnerships', 'planner', 'Outreach pipeline for wedding planners',         '#1d4e89', false, 2)
ON CONFLICT (id) DO NOTHING;

-- ── Seed: Venue Partnerships stages ──────────────────────────────────────────

INSERT INTO pipeline_stages (id, pipeline_id, name, color, position, is_won, is_lost, auto_follow_up_days, closed_won_actions) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Prospect',        '#94a3b8', 0, false, false, null,  '[]'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Cold Email Sent', '#f59e0b', 1, false, false, 4,     '[]'),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Follow Up',       '#f97316', 2, false, false, 7,     '[]'),
  ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'Conversation',    '#8b5cf6', 3, false, false, null,  '[]'),
  ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'Meeting Booked',  '#06b6d4', 4, false, false, null,  '[]'),
  ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000001', 'Proposal Sent',   '#3b82f6', 5, false, false, 5,     '[]'),
  ('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000001', 'Negotiation',     '#ec4899', 6, false, false, null,  '[]'),
  ('b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000001', 'Closed Won',      '#22c55e', 7, true,  false, null,  '["activate_profile","send_welcome_email","add_to_newsletter","create_onboarding_task"]'),
  ('b1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000001', 'Closed Lost',     '#ef4444', 8, false, true,  null,  '[]')
ON CONFLICT (id) DO NOTHING;

-- ── Seed: Vendor Partnerships stages ─────────────────────────────────────────

INSERT INTO pipeline_stages (id, pipeline_id, name, color, position, is_won, is_lost, auto_follow_up_days, closed_won_actions) VALUES
  ('b2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'Prospect',             '#94a3b8', 0, false, false, null, '[]'),
  ('b2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'Cold Email Sent',      '#f59e0b', 1, false, false, 4,    '[]'),
  ('b2000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 'Follow Up',            '#f97316', 2, false, false, 7,    '[]'),
  ('b2000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 'Conversation',         '#8b5cf6', 3, false, false, null, '[]'),
  ('b2000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', 'Information Requested','#06b6d4', 4, false, false, 3,    '[]'),
  ('b2000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000002', 'Proposal Sent',        '#3b82f6', 5, false, false, 5,    '[]'),
  ('b2000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000002', 'Closed Won',           '#22c55e', 6, true,  false, null, '["activate_profile","send_welcome_email","add_to_newsletter","create_onboarding_task"]'),
  ('b2000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000002', 'Closed Lost',          '#ef4444', 7, false, true,  null, '[]')
ON CONFLICT (id) DO NOTHING;

-- ── Seed: Wedding Planner Partnerships stages ─────────────────────────────────

INSERT INTO pipeline_stages (id, pipeline_id, name, color, position, is_won, is_lost, auto_follow_up_days, closed_won_actions) VALUES
  ('b3000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 'Prospect',               '#94a3b8', 0, false, false, null, '[]'),
  ('b3000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000003', 'Cold Email Sent',         '#f59e0b', 1, false, false, 4,    '[]'),
  ('b3000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'Conversation Started',    '#8b5cf6', 2, false, false, null, '[]'),
  ('b3000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000003', 'Feature Discussion',      '#06b6d4', 3, false, false, 5,    '[]'),
  ('b3000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000003', 'Collaboration Confirmed', '#3b82f6', 4, false, false, null, '[]'),
  ('b3000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000003', 'Closed Won',              '#22c55e', 5, true,  false, null, '["activate_profile","send_welcome_email","add_to_newsletter","create_onboarding_task"]'),
  ('b3000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000003', 'Closed Lost',             '#ef4444', 6, false, true,  null, '[]')
ON CONFLICT (id) DO NOTHING;

-- ── Seed: Email templates for Venue Partnerships ──────────────────────────────

INSERT INTO pipeline_email_templates (id, pipeline_id, stage_id, name, email_type, subject, body) VALUES
  (
    'c1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000002',
    'Venue Cold Outreach',
    'cold',
    'Partnership enquiry - Luxury Wedding Directory',
    'Hi {{contact_name}},

I came across {{company_name}} and was genuinely impressed. The attention to detail and overall aesthetic is exactly what our couples are looking for.

I''m reaching out because we''re building our premium venue directory at Luxury Wedding Directory, and {{company_name}} would be an exceptional fit.

We connect high-net-worth couples planning luxury weddings with the finest venues in the UK. Our members are actively searching for venues with your calibre.

Would you be open to a short call this week to explore whether there''s a fit?

Warm regards,
{{sender_name}}
Luxury Wedding Directory'
  ),
  (
    'c1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000003',
    'Venue Follow Up 1',
    'follow_up_1',
    'Following up - Luxury Wedding Directory partnership',
    'Hi {{contact_name}},

I wanted to follow up on my previous message about a potential partnership with Luxury Wedding Directory.

I understand you''re incredibly busy, so I''ll keep this brief. We currently feature over 200 luxury venues and drive enquiries from couples with budgets starting at £50,000.

I believe {{company_name}} would perform exceptionally well on our platform.

Would a 15-minute call work for you this week?

Best,
{{sender_name}}'
  ),
  (
    'c1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000003',
    'Venue Follow Up 2',
    'follow_up_2',
    'Last follow up - {{company_name}} + Luxury Wedding Directory',
    'Hi {{contact_name}},

I don''t want to keep filling your inbox, so this will be my last message for now.

If the timing isn''t right for a partnership, I completely understand. If things change in the future, I''d love to hear from you.

If you do have 10 minutes this week, I''m confident I can show you why venues like yours consistently perform well with us.

Either way, I wish you a wonderful season.

Best,
{{sender_name}}'
  ),
  (
    'c1000000-0000-0000-0000-000000000004',
    'a1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000006',
    'Venue Proposal',
    'proposal',
    'Partnership proposal for {{company_name}}',
    'Hi {{contact_name}},

It was great speaking with you. As discussed, I''m sharing our partnership proposal for {{company_name}}.

What''s included in your listing:
- Premium venue profile with full gallery
- Priority placement in search results
- Featured in our weekly newsletter (15,000+ subscribers)
- Enquiry management dashboard
- Monthly analytics report
- Dedicated account manager

Our packages start from £{{proposal_value}} per year, with no commission on bookings.

I''ve attached the full proposal document. Happy to answer any questions or arrange a follow-up call.

Looking forward to welcoming {{company_name}} to the directory.

Best regards,
{{sender_name}}
Luxury Wedding Directory'
  ),
  (
    'c1000000-0000-0000-0000-000000000005',
    'a1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000008',
    'Venue Welcome Email',
    'welcome',
    'Welcome to Luxury Wedding Directory - next steps for {{company_name}}',
    'Hi {{contact_name}},

Welcome to Luxury Wedding Directory. We are thrilled to have {{company_name}} as part of our curated collection.

Your listing is now being set up. Here is what happens next:

1. Our team will contact you within 24 hours to begin your onboarding
2. You will receive login details for your venue dashboard
3. We will schedule a photography and content review session
4. Your listing will go live within 5 working days

In the meantime, if you have any questions, please reply to this email.

We look forward to connecting your venue with the finest couples in the UK.

With warm regards,
{{sender_name}}
Luxury Wedding Directory'
  )
ON CONFLICT (id) DO NOTHING;

-- Update stage email_template_id references
UPDATE pipeline_stages SET email_template_id = 'c1000000-0000-0000-0000-000000000001' WHERE id = 'b1000000-0000-0000-0000-000000000002';
UPDATE pipeline_stages SET email_template_id = 'c1000000-0000-0000-0000-000000000002' WHERE id = 'b1000000-0000-0000-0000-000000000003';
UPDATE pipeline_stages SET email_template_id = 'c1000000-0000-0000-0000-000000000004' WHERE id = 'b1000000-0000-0000-0000-000000000006';
UPDATE pipeline_stages SET email_template_id = 'c1000000-0000-0000-0000-000000000005' WHERE id = 'b1000000-0000-0000-0000-000000000008';

-- ── Backfill existing prospects to default pipeline ───────────────────────────

UPDATE prospects
SET pipeline_id = 'a1000000-0000-0000-0000-000000000001'
WHERE pipeline_id IS NULL;
