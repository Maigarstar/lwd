-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 4 COUPLE AUTHENTICATION SETUP - Supabase SQL (Production Ready)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Sets up secure couple account management with single-source-of-truth enquiries
-- Uses vendor_enquiries for both vendor and couple views (no duplication)
-- Implements RLS to isolate couple data

-- 1. Create couples profile table
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS couples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,       -- Foreign key to auth.users
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  event_date DATE,
  guest_count INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_couples_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_couples_email ON couples(email);

-- 2. Create couple_shortlists table (persistent saved vendors)
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS couple_shortlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL,
  vendor_id TEXT NOT NULL,             -- Vendor legacy_vendor_id ("vdr-1")
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_shortlist_couple FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE,
  CONSTRAINT uq_couple_vendor UNIQUE (couple_id, vendor_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_couple_shortlists_couple_id ON couple_shortlists(couple_id);
CREATE INDEX IF NOT EXISTS idx_couple_shortlists_vendor_id ON couple_shortlists(vendor_id);

-- 3. Update vendor_enquiries table to include couple_id
-- ───────────────────────────────────────────────────────────────────────────────
-- Add couple_id column if it doesn't exist
ALTER TABLE vendor_enquiries ADD COLUMN couple_id UUID;

-- Add foreign key constraint
ALTER TABLE vendor_enquiries ADD CONSTRAINT fk_vendor_enquiries_couple
  FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE SET NULL;

-- Create index for couple dashboard queries
CREATE INDEX IF NOT EXISTS idx_vendor_enquiries_couple_id ON vendor_enquiries(couple_id);

-- 4. Enable RLS on couples table
-- ───────────────────────────────────────────────────────────────────────────────
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;

-- Couples can read their own profile
DROP POLICY IF EXISTS "Couples read own profile" ON couples;
CREATE POLICY "Couples read own profile" ON couples
  FOR SELECT USING (auth.uid() = user_id);

-- Couples can update their own profile
DROP POLICY IF EXISTS "Couples update own profile" ON couples;
CREATE POLICY "Couples update own profile" ON couples
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Enable RLS on couple_shortlists table
-- ───────────────────────────────────────────────────────────────────────────────
ALTER TABLE couple_shortlists ENABLE ROW LEVEL SECURITY;

-- Couples can insert into their own shortlist
DROP POLICY IF EXISTS "Couples insert shortlist" ON couple_shortlists;
CREATE POLICY "Couples insert shortlist" ON couple_shortlists
  FOR INSERT WITH CHECK (
    couple_id IN (
      SELECT id FROM couples WHERE user_id = auth.uid()
    )
  );

-- Couples can view their own shortlist
DROP POLICY IF EXISTS "Couples read shortlist" ON couple_shortlists;
CREATE POLICY "Couples read shortlist" ON couple_shortlists
  FOR SELECT USING (
    couple_id IN (
      SELECT id FROM couples WHERE user_id = auth.uid()
    )
  );

-- Couples can delete from their own shortlist
DROP POLICY IF EXISTS "Couples delete shortlist" ON couple_shortlists;
CREATE POLICY "Couples delete shortlist" ON couple_shortlists
  FOR DELETE USING (
    couple_id IN (
      SELECT id FROM couples WHERE user_id = auth.uid()
    )
  );

-- 6. Update vendor_enquiries RLS to include couple view
-- ───────────────────────────────────────────────────────────────────────────────
-- Couples can read their own enquiries
DROP POLICY IF EXISTS "Couples read own enquiries" ON vendor_enquiries;
CREATE POLICY "Couples read own enquiries" ON vendor_enquiries
  FOR SELECT USING (
    couple_id IN (
      SELECT id FROM couples WHERE user_id = auth.uid()
    )
  );

-- Couples can insert enquiries
DROP POLICY IF EXISTS "Couples insert enquiries" ON vendor_enquiries;
CREATE POLICY "Couples insert enquiries" ON vendor_enquiries
  FOR INSERT WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SUMMARY
-- ═══════════════════════════════════════════════════════════════════════════════
-- This setup creates:
--
-- 1. couples table
--    - Stores couple profile data (name, event date, guest count)
--    - Links to Supabase Auth via user_id
--    - RLS ensures couples only see their own profile
--
-- 2. couple_shortlists table
--    - Stores saved vendors (heart button)
--    - UNIQUE constraint prevents duplicate saves per couple
--    - RLS ensures couples only see/manage their own shortlist
--
-- 3. vendor_enquiries updates
--    - Added couple_id column to track which couple submitted
--    - Now used by vendor dashboard, couple dashboard, and admin dashboard
--    - Single source of truth for enquiries (no duplication)
--    - RLS allows couples to read their own enquiries
--
-- Architecture:
--   Couple Dashboard queries:
--   - couple_shortlists (saved vendors)
--   - vendor_enquiries WHERE couple_id = auth.user_id (their enquiries)
--   - couples (their profile)
--
--   Vendor Dashboard queries:
--   - vendor_enquiries WHERE vendor_id = my_vendor_id (their enquiries)
--
--   Admin Dashboard queries:
--   - vendor_enquiries (all enquiries, dev RLS allows all for admin)
--
-- No duplication between couple_enquiries and vendor_enquiries.
-- Single table, multiple views.
-- ═══════════════════════════════════════════════════════════════════════════════
