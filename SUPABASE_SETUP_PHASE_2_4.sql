-- ════════════════════════════════════════════════════════════════════════════
-- Supabase Setup for Phase 2.4: Shortlist/Favorites Feature
-- ════════════════════════════════════════════════════════════════════════════
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase dashboard
-- 2. Navigate to SQL Editor
-- 3. Create a new query
-- 4. Copy and paste this entire file
-- 5. Click "Run" to execute
--
-- This creates the vendor_shortlists table with RLS policies enabled.
-- ════════════════════════════════════════════════════════════════════════════

-- Create the vendor_shortlists table
CREATE TABLE vendor_shortlists (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID,  -- For authenticated users (can be NULL for anonymous)
  item_id INT NOT NULL,   -- Vendor/venue numeric ID
  item_type TEXT NOT NULL DEFAULT 'vendor', -- 'vendor' or 'venue'
  item_name TEXT NOT NULL, -- Cached vendor/venue name
  item_image TEXT, -- Cached first image URL for thumbnail
  item_category TEXT, -- Cached category (e.g., "photographers", "venues")
  item_price TEXT, -- Cached price for display
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  device_id TEXT, -- For non-authenticated users (enables cross-device persistence)

  -- Constraints to prevent duplicates
  CONSTRAINT unique_user_item UNIQUE(user_id, item_id) DEFERRABLE,
  CONSTRAINT unique_device_item UNIQUE(device_id, item_id) DEFERRABLE
);

-- Create indexes for fast lookups
CREATE INDEX idx_shortlist_user ON vendor_shortlists(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_shortlist_device ON vendor_shortlists(device_id) WHERE device_id IS NOT NULL;
CREATE INDEX idx_shortlist_created ON vendor_shortlists(created_at DESC);
CREATE INDEX idx_shortlist_item ON vendor_shortlists(item_id);

-- Enable RLS (Row Level Security)
ALTER TABLE vendor_shortlists ENABLE ROW LEVEL SECURITY;

-- Policy 1: Authenticated users can read their own shortlists
CREATE POLICY "Users can read own shortlist" ON vendor_shortlists
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Policy 2: Authenticated users can insert into their own shortlist
CREATE POLICY "Users can insert own shortlist" ON vendor_shortlists
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Policy 3: Authenticated users can delete from their own shortlist
CREATE POLICY "Users can delete own shortlist" ON vendor_shortlists
  FOR DELETE USING (
    auth.uid() = user_id
  );

-- Policy 4: Authenticated users can update their own shortlist
CREATE POLICY "Users can update own shortlist" ON vendor_shortlists
  FOR UPDATE USING (
    auth.uid() = user_id
  ) WITH CHECK (
    auth.uid() = user_id
  );

-- Policy 5: Anonymous users (device_id) can read their shortlists (no auth required)
CREATE POLICY "Anonymous users can read shortlist by device_id" ON vendor_shortlists
  FOR SELECT USING (
    device_id IS NOT NULL AND user_id IS NULL
  );

-- Policy 6: Anonymous users (device_id) can insert into shortlist (no auth required)
CREATE POLICY "Anonymous users can insert shortlist by device_id" ON vendor_shortlists
  FOR INSERT WITH CHECK (
    device_id IS NOT NULL AND user_id IS NULL
  );

-- Policy 7: Anonymous users (device_id) can delete from shortlist (no auth required)
CREATE POLICY "Anonymous users can delete shortlist by device_id" ON vendor_shortlists
  FOR DELETE USING (
    device_id IS NOT NULL AND user_id IS NULL
  );

-- Policy 8: Anonymous users (device_id) can update shortlist (no auth required)
CREATE POLICY "Anonymous users can update shortlist by device_id" ON vendor_shortlists
  FOR UPDATE USING (
    device_id IS NOT NULL AND user_id IS NULL
  ) WITH CHECK (
    device_id IS NOT NULL AND user_id IS NULL
  );

-- ════════════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ════════════════════════════════════════════════════════════════════════════
-- After running this script, verify that:
-- 1. Table 'vendor_shortlists' exists in your schema
-- 2. RLS is enabled (check "Authentication" tab in Supabase)
-- 3. All 8 policies are created
-- 4. Indexes are created for performance
--
-- To test:
-- Run this SELECT query:
--   SELECT * FROM vendor_shortlists LIMIT 1;
--
-- It should return an empty result set with no errors.
-- ════════════════════════════════════════════════════════════════════════════
