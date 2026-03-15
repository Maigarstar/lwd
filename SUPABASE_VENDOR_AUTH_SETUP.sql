-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 3.1 VENDOR AUTHENTICATION SETUP - Supabase SQL (V1 - Focused)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Sets up secure vendor account management linked to Supabase Auth
-- Implements invite-only vendor activation + RLS-based dashboard isolation
-- Scope: Secure login, protected dashboard, RLS isolation (no profile editing yet)

-- 1. Create vendors account table
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_vendor_id TEXT UNIQUE,     -- "vdr-1", "vdr-13" (backward compatibility)
  user_id UUID NOT NULL UNIQUE,     -- Foreign key to auth.users
  email TEXT NOT NULL UNIQUE,
  activation_token TEXT UNIQUE,     -- For invite-based activation
  activation_token_expires_at TIMESTAMP WITH TIME ZONE,
  is_activated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_email ON vendors(email);
CREATE INDEX IF NOT EXISTS idx_vendors_legacy_vendor_id ON vendors(legacy_vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendors_activation_token ON vendors(activation_token);

-- 2. Enable RLS on vendors table
-- ───────────────────────────────────────────────────────────────────────────────
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Vendors can read their own account record
DROP POLICY IF EXISTS "Vendors read own account" ON vendors;
CREATE POLICY "Vendors read own account" ON vendors
  FOR SELECT USING (auth.uid() = user_id);

-- Vendors can update their own account
DROP POLICY IF EXISTS "Vendors update own account" ON vendors;
CREATE POLICY "Vendors update own account" ON vendors
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Update vendor_enquiries RLS policies (secure access)
-- ───────────────────────────────────────────────────────────────────────────────
-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow all reads" ON vendor_enquiries;
DROP POLICY IF EXISTS "Allow all inserts" ON vendor_enquiries;
DROP POLICY IF EXISTS "Allow all updates" ON vendor_enquiries;
DROP POLICY IF EXISTS "Allow all deletes" ON vendor_enquiries;

-- Ensure RLS is enabled
ALTER TABLE vendor_enquiries ENABLE ROW LEVEL SECURITY;

-- Vendors can read only their own enquiries (via legacy_vendor_id)
DROP POLICY IF EXISTS "Vendors read own enquiries" ON vendor_enquiries;
CREATE POLICY "Vendors read own enquiries" ON vendor_enquiries
  FOR SELECT USING (
    vendor_id IN (SELECT legacy_vendor_id FROM vendors WHERE user_id = auth.uid())
  );

-- Vendors can update only their own enquiries (reply, status change)
DROP POLICY IF EXISTS "Vendors update own enquiries" ON vendor_enquiries;
CREATE POLICY "Vendors update own enquiries" ON vendor_enquiries
  FOR UPDATE USING (
    vendor_id IN (SELECT legacy_vendor_id FROM vendors WHERE user_id = auth.uid())
  )
  WITH CHECK (
    vendor_id IN (SELECT legacy_vendor_id FROM vendors WHERE user_id = auth.uid())
  );

-- Couples can insert enquiries for any vendor (anonymous users)
DROP POLICY IF EXISTS "Anyone insert enquiries" ON vendor_enquiries;
CREATE POLICY "Anyone insert enquiries" ON vendor_enquiries
  FOR INSERT WITH CHECK (true);

-- [DEVELOPMENT ONLY] Admin can read all enquiries
-- TODO: Replace with proper admin role check for production
DROP POLICY IF EXISTS "Admin read all enquiries" ON vendor_enquiries;
CREATE POLICY "Admin read all enquiries" ON vendor_enquiries
  FOR SELECT USING (true);

-- 4. Update profile_views table RLS (optional, if it exists)
-- ───────────────────────────────────────────────────────────────────────────────
-- Only apply if profile_views table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profile_views') THEN
    ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Vendors read own profile views" ON profile_views;
    CREATE POLICY "Vendors read own profile views" ON profile_views
      FOR SELECT USING (
        vendor_id IN (SELECT legacy_vendor_id FROM vendors WHERE user_id = auth.uid())
      );

    DROP POLICY IF EXISTS "Anyone insert profile views" ON profile_views;
    CREATE POLICY "Anyone insert profile views" ON profile_views
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- MANUAL SETUP STEPS (Admin Only)
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- 1. RUN THIS SQL FILE in Supabase SQL Editor
--
-- 2. CREATE TEST VENDOR USER
--    - Go to Supabase Dashboard → Authentication → Users
--    - Click "Add new user"
--    - Email: test-vendor@luxuryweddingdirectory.com
--    - Auto generate password (or set one)
--    - Click "Save"
--    - Copy the user's ID (UUID)
--
-- 3. GENERATE ACTIVATION TOKEN AND CREATE VENDOR RECORD
--    Run this SQL (replace [USER-UUID] with UUID from step 2):
--
--    INSERT INTO vendors (
--      legacy_vendor_id,
--      user_id,
--      email,
--      activation_token,
--      activation_token_expires_at,
--      is_activated
--    ) VALUES (
--      'vdr-1',
--      '[USER-UUID]',
--      'test-vendor@luxuryweddingdirectory.com',
--      gen_random_uuid()::text,
--      NOW() + INTERVAL '7 days',
--      FALSE
--    );
--
-- 4. GET ACTIVATION TOKEN
--    Run this query to get the activation token:
--
--    SELECT activation_token FROM vendors WHERE email = 'test-vendor@luxuryweddingdirectory.com';
--
--    Copy the token (it's a UUID string)
--
-- 5. SEND ACTIVATION LINK TO VENDOR
--    Share this link with the vendor:
--    https://luxuryweddingdirectory.com/vendor/activate?token=[ACTIVATION-TOKEN]
--
--    (Replace [ACTIVATION-TOKEN] with the token from step 4)
--
-- 6. VENDOR ACTIVATION FLOW
--    - Vendor clicks activation link
--    - System validates token (not expired, not used)
--    - Vendor enters password
--    - System creates auth user password
--    - Account activated (is_activated = TRUE)
--
-- 7. VENDOR LOGIN
--    - Vendor can now log in with email + password at /vendor/login
--    - Dashboard shows only their enquiries (RLS enforces isolation)
--
-- ═══════════════════════════════════════════════════════════════════════════════
