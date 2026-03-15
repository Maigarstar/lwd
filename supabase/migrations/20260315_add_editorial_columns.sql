-- Phase 4d: Editorial Control Toggles Migration
-- Adds editorial_enabled column to listings table for per-venue control

-- Add editorial_enabled column to listings table
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS editorial_enabled boolean NOT NULL DEFAULT true;

-- Add platform_settings table for global feature flags
CREATE TABLE IF NOT EXISTS platform_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Insert default platform settings
INSERT INTO platform_settings (key, value, description)
VALUES
  ('editorial_curation_enabled', 'true', 'Global toggle for editorial curation visibility'),
  ('editorial_tier_system_enabled', 'true', 'Enable/disable quality tier badges'),
  ('editorial_indicators_enabled', 'true', 'Enable/disable approval and freshness indicators')
ON CONFLICT (key) DO NOTHING;

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS platform_settings_key_idx ON platform_settings(key);

-- Create index for editorial_enabled queries
CREATE INDEX IF NOT EXISTS listings_editorial_enabled_idx ON listings(editorial_enabled);
