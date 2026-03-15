-- Phase 4: Editorial Curation Visibility & Discovery Integration
-- Migration date: 2026-03-15

-- ============================================================================
-- 1. Add editorial columns to listings table (editorial_enabled, editorial_collections, aura_recommended)
-- ============================================================================

-- Per-venue editorial curation control
ALTER TABLE listings ADD COLUMN IF NOT EXISTS editorial_enabled BOOLEAN DEFAULT true;

-- Manual editorial collections (JSON array of collection objects)
-- Example: [{ id: "signature-venue", label: "Signature Venue", icon: "★", color: "#C9A84C" }]
ALTER TABLE listings ADD COLUMN IF NOT EXISTS editorial_collections JSONB DEFAULT '[]'::jsonb;

-- System-driven Aura recommendation flag (set by recommendation algorithm)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS aura_recommended BOOLEAN DEFAULT false;

-- ============================================================================
-- 2. Create platform_settings table for global feature toggles
-- ============================================================================

CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default global editorial curation toggle (enabled by default)
INSERT INTO platform_settings (setting_key, setting_value)
VALUES ('editorial_curation_enabled', '{"enabled": true}')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- 3. Create indexes for performance
-- ============================================================================

-- Index for filtering by editorial_enabled
CREATE INDEX IF NOT EXISTS listings_editorial_enabled_idx ON listings(editorial_enabled);

-- Index for filtering by aura_recommended
CREATE INDEX IF NOT EXISTS listings_aura_recommended_idx ON listings(aura_recommended);

-- Index for searching within editorial_collections
CREATE INDEX IF NOT EXISTS listings_editorial_collections_idx ON listings USING GIN(editorial_collections);

-- Index for platform_settings lookups
CREATE INDEX IF NOT EXISTS platform_settings_key_idx ON platform_settings(setting_key);

-- ============================================================================
-- 4. Create trigger to update platform_settings.updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_platform_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS platform_settings_updated_at_trigger ON platform_settings;
CREATE TRIGGER platform_settings_updated_at_trigger
BEFORE UPDATE ON platform_settings
FOR EACH ROW
EXECUTE FUNCTION update_platform_settings_updated_at();

-- ============================================================================
-- 5. Add RLS policies (if needed - adjust based on your auth setup)
-- ============================================================================

-- Enable RLS on platform_settings if not already enabled
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read platform_settings (public feature flags)
CREATE POLICY IF NOT EXISTS "Anyone can read platform settings"
  ON platform_settings FOR SELECT
  USING (true);

-- Only authenticated users can update platform_settings (admin only in practice)
CREATE POLICY IF NOT EXISTS "Authenticated users can update platform settings"
  ON platform_settings FOR UPDATE
  USING (auth.role() = 'authenticated');
