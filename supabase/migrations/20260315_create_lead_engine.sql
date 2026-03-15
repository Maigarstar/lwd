-- ============================================================================
-- Lead Gen Engine - Master Database Schema
-- Created: 2026-03-15
-- Purpose: Centralized lead capture, qualification, routing, and tracking
-- Supports: venue forms, vendor forms, Aura chat, guided flows, concierge
-- ============================================================================

-- ─── MASTER LEADS TABLE ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Source classification
  lead_source TEXT NOT NULL,
  lead_channel TEXT NOT NULL,
  lead_type TEXT NOT NULL,

  -- Status and priority
  status TEXT NOT NULL DEFAULT 'new',
  priority TEXT DEFAULT 'normal',
  score INTEGER DEFAULT 0,

  -- Ownership
  owner_type TEXT,
  owner_id UUID,

  -- Listing context
  listing_id UUID,
  listing_type TEXT,
  venue_id UUID,
  vendor_id UUID,

  -- User and session context
  user_id UUID,
  aura_session_id TEXT,
  conversation_id TEXT,

  -- Contact details
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  preferred_contact_method TEXT,

  -- Wedding details
  wedding_date DATE,
  wedding_month TEXT,
  wedding_year INTEGER,
  exact_date_known BOOLEAN DEFAULT false,
  guest_count TEXT,
  budget_range TEXT,
  location_preference TEXT,
  event_location TEXT,

  -- Message and intent
  message TEXT,
  intent_summary TEXT,
  requirements_json JSONB DEFAULT '{}'::jsonb,
  tags_json JSONB DEFAULT '[]'::jsonb,
  timeline_stage TEXT,

  -- Consent
  consent_marketing BOOLEAN DEFAULT false,
  consent_data_processing BOOLEAN DEFAULT true,

  -- Lifecycle timestamps
  vendor_notified_at TIMESTAMPTZ,
  internal_notified_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  booked_at TIMESTAMPTZ,
  lost_at TIMESTAMPTZ,

  -- Outcome
  loss_reason TEXT,
  booking_value_estimate NUMERIC,
  lead_value_band TEXT
);

CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status);
CREATE INDEX IF NOT EXISTS leads_score_idx ON leads(score DESC);
CREATE INDEX IF NOT EXISTS leads_vendor_id_idx ON leads(vendor_id);
CREATE INDEX IF NOT EXISTS leads_venue_id_idx ON leads(venue_id);
CREATE INDEX IF NOT EXISTS leads_lead_source_idx ON leads(lead_source);
CREATE INDEX IF NOT EXISTS leads_lead_type_idx ON leads(lead_type);
CREATE INDEX IF NOT EXISTS leads_listing_id_idx ON leads(listing_id);
CREATE INDEX IF NOT EXISTS leads_requirements_json_idx ON leads USING GIN(requirements_json);
CREATE INDEX IF NOT EXISTS leads_tags_json_idx ON leads USING GIN(tags_json);


-- ─── LEAD EVENTS (timeline and audit trail) ─────────────────────────────────

CREATE TABLE IF NOT EXISTS lead_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_label TEXT,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

CREATE INDEX IF NOT EXISTS lead_events_lead_id_idx ON lead_events(lead_id);
CREATE INDEX IF NOT EXISTS lead_events_event_type_idx ON lead_events(event_type);
CREATE INDEX IF NOT EXISTS lead_events_created_at_idx ON lead_events(created_at DESC);


-- ─── LEAD NOTIFICATIONS (outbound tracking) ─────────────────────────────────

CREATE TABLE IF NOT EXISTS lead_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  recipient_type TEXT NOT NULL,
  recipient_email TEXT,
  delivery_status TEXT DEFAULT 'pending',
  payload_json JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lead_notifications_lead_id_idx ON lead_notifications(lead_id);
CREATE INDEX IF NOT EXISTS lead_notifications_delivery_status_idx ON lead_notifications(delivery_status);


-- ─── LEAD MESSAGES (enquiry copy and internal notes) ─────────────────────────

CREATE TABLE IF NOT EXISTS lead_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL,
  body TEXT,
  meta_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

CREATE INDEX IF NOT EXISTS lead_messages_lead_id_idx ON lead_messages(lead_id);
CREATE INDEX IF NOT EXISTS lead_messages_message_type_idx ON lead_messages(message_type);


-- ─── LEAD CONVERSATIONS (Aura context and extracted intelligence) ────────────

CREATE TABLE IF NOT EXISTS lead_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  aura_session_id TEXT,
  conversation_id TEXT,
  raw_summary TEXT,
  intent_summary TEXT,
  requirements_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lead_conversations_lead_id_idx ON lead_conversations(lead_id);
CREATE INDEX IF NOT EXISTS lead_conversations_aura_session_id_idx ON lead_conversations(aura_session_id);


-- ─── LEAD ASSIGNMENTS (ownership and internal workflow) ──────────────────────

CREATE TABLE IF NOT EXISTS lead_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  assigned_to UUID,
  assigned_role TEXT,
  assignment_status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lead_assignments_lead_id_idx ON lead_assignments(lead_id);
CREATE INDEX IF NOT EXISTS lead_assignments_assigned_to_idx ON lead_assignments(assigned_to);


-- ─── LEAD MATCHES (multi-match scenarios, Aura recommendations) ──────────────

CREATE TABLE IF NOT EXISTS lead_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  matched_listing_id UUID,
  matched_listing_type TEXT,
  matched_vendor_id UUID,
  matched_venue_id UUID,
  match_score INTEGER DEFAULT 0,
  match_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lead_matches_lead_id_idx ON lead_matches(lead_id);
CREATE INDEX IF NOT EXISTS lead_matches_matched_listing_id_idx ON lead_matches(matched_listing_id);


-- ─── AUTO-UPDATE TRIGGERS ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at_trigger
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

CREATE OR REPLACE FUNCTION update_lead_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lead_conversations_updated_at_trigger
  BEFORE UPDATE ON lead_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_conversations_updated_at();

CREATE OR REPLACE FUNCTION update_lead_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lead_assignments_updated_at_trigger
  BEFORE UPDATE ON lead_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_assignments_updated_at();
