-- ─── google_connections ────────────────────────────────────────────────────────
-- Stores Google OAuth tokens and selected properties for GA4 and Search Console.
-- One row per service (analytics | search_console) for the site-wide admin.
-- Run in Supabase SQL editor or via supabase db push.
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS google_connections (
  id                      UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  service                 TEXT         NOT NULL CHECK (service IN ('analytics', 'search_console')),
  status                  TEXT         NOT NULL DEFAULT 'disconnected'
                                       CHECK (status IN ('disconnected', 'pending', 'connected', 'error')),
  -- OAuth tokens (stored server-side only, never exposed to browser)
  access_token            TEXT,
  refresh_token           TEXT,
  token_expiry            TIMESTAMPTZ,
  scope                   TEXT,
  -- Property selection (chosen after connecting)
  selected_property_id    TEXT,
  selected_property_name  TEXT,
  available_properties    JSONB        NOT NULL DEFAULT '[]'::jsonb,
  -- State token for CSRF protection during OAuth flow (cleared after use)
  oauth_state             TEXT,
  -- Status metadata
  error_message           TEXT,
  connected_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ  DEFAULT NOW(),
  updated_at              TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(service)
);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION update_google_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS google_connections_updated_at ON google_connections;
CREATE TRIGGER google_connections_updated_at
  BEFORE UPDATE ON google_connections
  FOR EACH ROW EXECUTE FUNCTION update_google_connections_updated_at();

-- Seed disconnected placeholder rows (upsert-safe)
INSERT INTO google_connections (service, status)
VALUES
  ('analytics',      'disconnected'),
  ('search_console', 'disconnected')
ON CONFLICT (service) DO NOTHING;

-- RLS: disabled for single-admin app (consistent with other admin tables)
-- Hardening: add RLS + admin role policy in a future migration once
-- Supabase Auth is wired to the admin login flow.
