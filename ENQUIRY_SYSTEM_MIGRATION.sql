-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION: Add lead_source column to vendor_enquiries (if not already exists)
-- ═══════════════════════════════════════════════════════════════════════════════
-- For existing installations that need to add lead source tracking
-- Run this in Supabase SQL Editor if you already have vendor_enquiries table
--
-- NOTE: The main SUPABASE_ENQUIRY_SETUP.sql now includes lead_source by default
-- This migration is only needed for existing tables created before lead source feature
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Add lead_source column if it doesn't exist
ALTER TABLE vendor_enquiries
ADD COLUMN IF NOT EXISTS lead_source TEXT DEFAULT 'Venue Profile';

-- 2. Verify the column was added
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'vendor_enquiries' AND column_name = 'lead_source';

-- 3. Update existing records to have a default lead_source if null
UPDATE vendor_enquiries
SET lead_source = 'Venue Profile'
WHERE lead_source IS NULL;
