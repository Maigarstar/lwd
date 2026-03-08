-- ═══════════════════════════════════════════════════════════════════════════════
-- SUPABASE SETUP: vendor_enquiries TABLE & RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════
-- This SQL creates the core enquiry table for the lead generation system
-- Couples submit enquiries → Vendors manage in Lead Inbox → Track conversion metrics
--
-- SETUP INSTRUCTIONS:
-- 1. Open Supabase dashboard → SQL Editor
-- 2. Create new query
-- 3. Copy entire content of this file
-- 4. Click "Run" to execute all statements
-- 5. Verify table created: SELECT * FROM vendor_enquiries LIMIT 1;
-- 6. Run test queries below
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CREATE vendor_enquiries TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vendor_enquiries (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Vendor & Listing References
  vendor_id TEXT NOT NULL,                   -- Vendor/Venue ID (string-based: "vdr-13", "vnu-5", etc)
  listing_id TEXT,                           -- Future: Separate listing ID (now = vendor_id)

  -- Couple Identification (email-based for anonymous couples, user_id when auth exists)
  couple_id TEXT NOT NULL,                   -- Email or user UUID when authenticated
  couple_name TEXT NOT NULL,                 -- Couple's full name
  couple_email TEXT NOT NULL,                -- Couple's email address
  couple_phone TEXT,                         -- Optional: couple's phone number

  -- Enquiry Details
  message TEXT,                              -- Couple's message/questions
  guest_count INT,                           -- Estimated guest count
  budget_range TEXT,                         -- Budget bracket (e.g., "10k-25k", "25k-50k")
  event_date DATE,                           -- Requested/planned wedding date

  -- Enquiry Status & Timeline
  status TEXT NOT NULL DEFAULT 'new',        -- Status: new, replied, booked, archived
  vendor_reply TEXT,                         -- Vendor's reply message

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  replied_at TIMESTAMP WITH TIME ZONE,       -- When vendor first replied

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('new', 'replied', 'booked', 'archived')),
  CONSTRAINT unique_couple_vendor UNIQUE(couple_email, vendor_id) -- Prevent duplicate enquiries
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ─────────────────────────────────────────────────────────────────────────────

-- Index on vendor_id: Essential for Lead Inbox queries (filter all enquiries for a vendor)
CREATE INDEX IF NOT EXISTS idx_vendor_enquiries_vendor_id
  ON vendor_enquiries(vendor_id);

-- Index on status: Essential for filtering by pipeline stage (new, replied, booked, archived)
CREATE INDEX IF NOT EXISTS idx_vendor_enquiries_status
  ON vendor_enquiries(status);

-- Composite index: vendor_id + status for fastest Lead Inbox queries
CREATE INDEX IF NOT EXISTS idx_vendor_enquiries_vendor_status
  ON vendor_enquiries(vendor_id, status);

-- Index on created_at: For sorting by date (newest first)
CREATE INDEX IF NOT EXISTS idx_vendor_enquiries_created
  ON vendor_enquiries(created_at DESC);

-- Index on couple_id: For finding enquiries by couple email
CREATE INDEX IF NOT EXISTS idx_vendor_enquiries_couple_id
  ON vendor_enquiries(couple_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE vendor_enquiries ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. RLS POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

-- POLICY 1: Couples can INSERT their own enquiries (anonymous, no auth required)
-- This allows VendorContactForm.jsx to submit enquiries without authentication
CREATE POLICY "couples_can_insert_enquiries" ON vendor_enquiries
  FOR INSERT
  WITH CHECK (
    couple_email IS NOT NULL AND
    couple_name IS NOT NULL
  );

-- POLICY 2: Vendors can SELECT their own enquiries
-- This allows VendorLeadInbox to read enquiries for their vendor_id
CREATE POLICY "vendors_can_read_own_enquiries" ON vendor_enquiries
  FOR SELECT
  USING (true); -- For now, allow all reads (secure in next phase with auth)

-- POLICY 3: Vendors can UPDATE their own enquiries (reply, change status)
-- This allows VendorDashboard to update enquiry status and add replies
CREATE POLICY "vendors_can_update_own_enquiries" ON vendor_enquiries
  FOR UPDATE
  USING (true) -- For now, allow all updates (secure in next phase with auth)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. TEST QUERIES (Run after table creation to verify)
-- ─────────────────────────────────────────────────────────────────────────────

-- Test 1: Verify table exists
-- SELECT table_name FROM information_schema.tables WHERE table_name='vendor_enquiries';

-- Test 2: Create test enquiry (simulates VendorContactForm.jsx submission)
-- INSERT INTO vendor_enquiries (
--   vendor_id, couple_id, couple_name, couple_email, couple_phone,
--   message, guest_count, budget_range, event_date, status
-- ) VALUES (
--   1, 'jane@example.com', 'Jane & John Smith', 'jane@example.com', '+44 7700 123456',
--   'We love your style! Can you accommodate 120 guests?', 120, '25k-50k', '2026-06-15', 'new'
-- );

-- Test 3: Verify enquiry was created (simulates VendorLeadInbox.jsx read)
-- SELECT id, couple_name, couple_email, guest_count, status, created_at
-- FROM vendor_enquiries
-- WHERE vendor_id = 1
-- ORDER BY created_at DESC;

-- Test 4: Vendor replies to enquiry (simulates vendor reply button)
-- UPDATE vendor_enquiries
-- SET status = 'replied', vendor_reply = 'We love your vision! Let''s chat!', replied_at = NOW()
-- WHERE id = 1;

-- Test 5: Check Lead Inbox counts by status
-- SELECT
--   COUNT(*) FILTER (WHERE status = 'new') as new_count,
--   COUNT(*) FILTER (WHERE status = 'replied') as replied_count,
--   COUNT(*) FILTER (WHERE status = 'booked') as booked_count,
--   COUNT(*) FILTER (WHERE status = 'archived') as archived_count
-- FROM vendor_enquiries
-- WHERE vendor_id = 1;

-- Test 6: Calculate conversion metrics (simulates dashboard stats)
-- SELECT
--   COUNT(*) as total_enquiries,
--   COUNT(*) FILTER (WHERE status = 'booked') as booked_count,
--   ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'booked') / COUNT(*), 1) as conversion_rate_percent,
--   ROUND(AVG(EXTRACT(EPOCH FROM (replied_at - created_at)) / 3600), 1) as avg_response_time_hours
-- FROM vendor_enquiries
-- WHERE vendor_id = 1 AND status != 'archived';
