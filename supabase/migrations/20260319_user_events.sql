-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: user_events — unified behavioural event table
-- ═══════════════════════════════════════════════════════════════════════════
-- Single source of truth for all user intent signals.
-- Replaces fragmented per-feature tables with one pipeline.
--
-- Event types (Phase 1):
--   search              — directory/category search executed
--   search_result_click — user clicks a result card after searching
--   enquiry_started     — user opens or begins filling an enquiry form
--   enquiry_submitted   — enquiry form successfully submitted
--   shortlist_add       — venue/vendor added to shortlist
--   shortlist_remove    — venue/vendor removed from shortlist
--
-- Event types (Phase 2):
--   aura_query          — Aura chat message sent
--   session_start       — browser session begins (captures referrer + UTM)
--
-- Event types (Phase 3):
--   returned_after_outbound — user came back to LWD within 30min of outbound click
--   profile_view        — venue/vendor profile viewed
--   gallery_interaction — image gallery interaction
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_events (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id  TEXT        NOT NULL,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type  TEXT        NOT NULL,
  entity_type TEXT,                        -- 'venue' | 'vendor' | 'page' | null
  entity_id   UUID,                        -- listing/vendor UUID if applicable
  metadata    JSONB       DEFAULT '{}',    -- event-specific payload
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS user_events_event_type_idx  ON user_events (event_type);
CREATE INDEX IF NOT EXISTS user_events_entity_id_idx   ON user_events (entity_id);
CREATE INDEX IF NOT EXISTS user_events_session_id_idx  ON user_events (session_id);
CREATE INDEX IF NOT EXISTS user_events_created_at_idx  ON user_events (created_at DESC);
CREATE INDEX IF NOT EXISTS user_events_entity_type_idx ON user_events (entity_type);

-- RLS: anon and authenticated users can INSERT only
-- Reading requires service_role (via admin-user-events edge function)
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_events_insert_anon"
  ON user_events FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "user_events_insert_auth"
  ON user_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- No SELECT, UPDATE, or DELETE policies for public roles
-- All reads go through the admin-user-events edge function (service_role)
