-- ─────────────────────────────────────────────────────────────────────────────
-- outbound_clicks
-- Tracks all external link interactions from venue and vendor pages.
-- Used for attribution, performance reporting, and monetisation data.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS outbound_clicks (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type  text,                        -- 'venue' | 'vendor'
  entity_id    uuid,                        -- venue or vendor id
  venue_id     uuid,                        -- always set when click originates from a venue page
  link_type    text,                        -- 'website' | 'brochure' | 'instagram' | 'facebook' |
                                            -- 'linkedin' | 'pinterest' | 'tiktok' | 'twitter' |
                                            -- 'youtube' | 'whatsapp' | 'email'
  url          text,
  session_id   text,
  user_id      uuid,                        -- null for unauthenticated users (reserved)
  created_at   timestamptz DEFAULT now()
);

-- Indexes for reporting queries
CREATE INDEX IF NOT EXISTS outbound_clicks_entity_id_idx   ON outbound_clicks (entity_id);
CREATE INDEX IF NOT EXISTS outbound_clicks_venue_id_idx    ON outbound_clicks (venue_id);
CREATE INDEX IF NOT EXISTS outbound_clicks_link_type_idx   ON outbound_clicks (link_type);
CREATE INDEX IF NOT EXISTS outbound_clicks_created_at_idx  ON outbound_clicks (created_at);

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- Enabled. Insert-only for public users. No public read, update or delete.
-- This is the correct production pattern for public event capture tables.

ALTER TABLE outbound_clicks ENABLE ROW LEVEL SECURITY;

-- Anon and authenticated users may insert (fire-and-forget click events)
CREATE POLICY "public_insert_outbound_clicks"
  ON outbound_clicks
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No SELECT / UPDATE / DELETE policies — data is write-only from the browser.
-- Admin reporting should query via a service-role edge function.
