-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 3 cont.: Contract tracking, team seats, platform settings
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Contract tracking on prospects ───────────────────────────────────────────
-- Tracks agreement lifecycle per prospect.

ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS contract_status  TEXT NOT NULL DEFAULT 'none'
    CHECK (contract_status IN ('none','sent','signed','declined')),
  ADD COLUMN IF NOT EXISTS contract_sent_at   TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS contract_signed_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS prospects_contract_status_idx
  ON prospects (contract_status) WHERE contract_status != 'none';

-- ── Platform settings ─────────────────────────────────────────────────────────
-- Key/value store for third-party service credentials and sales config.
-- Stored server-side; sensitive values should be treated as masked in UI.

CREATE TABLE IF NOT EXISTS platform_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL DEFAULT '',
  label       TEXT NOT NULL DEFAULT '',
  category    TEXT NOT NULL DEFAULT 'general'
                CHECK (category IN ('email','webhook','pipeline','general')),
  is_secret   BOOLEAN NOT NULL DEFAULT false,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE platform_settings DISABLE ROW LEVEL SECURITY;

-- Seed default setting keys (no values - admin fills them in)
INSERT INTO platform_settings (key, label, category, is_secret) VALUES
  ('resend_api_key',         'Resend API Key',          'email',    true),
  ('from_email',             'Default From Email',       'email',    false),
  ('from_name',              'Default From Name',        'email',    false),
  ('reply_webhook_secret',   'Reply Webhook Secret',     'webhook',  true),
  ('unsubscribe_domain',     'Unsubscribe Link Domain',  'webhook',  false),
  ('pipeline_default_id',    'Default Pipeline ID',      'pipeline', false),
  ('auto_followup_enabled',  'Auto Follow-up Enabled',   'pipeline', false)
ON CONFLICT (key) DO NOTHING;

-- ── Team members ──────────────────────────────────────────────────────────────
-- CRM-level team tracking (not auth-linked, tracks who has access + role).

CREATE TABLE IF NOT EXISTS team_members (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name         TEXT NOT NULL,
  email        TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'outreach'
                 CHECK (role IN ('admin','outreach','viewer')),
  status       TEXT NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active','invited','removed')),
  invited_at   TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NULL,
  notes        TEXT DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (email)
);

ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS team_members_status_idx ON team_members (status);
