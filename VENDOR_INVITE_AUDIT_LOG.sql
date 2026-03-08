-- ═══════════════════════════════════════════════════════════════════════════
-- Vendor Invite Audit Log Table
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Track all vendor account invitations for audit trail and debugging
-- Used by: create-vendor-account Edge Function
-- Usage: Admin can query this to see invitation history, troubleshoot issues

CREATE TABLE IF NOT EXISTS vendor_invite_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Vendor reference
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Invitation details
  email TEXT NOT NULL,
  vendor_name TEXT NOT NULL,

  -- Admin who sent invite (optional - requires RLS/JWT setup)
  invited_by_admin_id UUID,

  -- Rate limiting & security
  client_ip TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Status tracking (optional - for future use)
  status TEXT DEFAULT 'invited', -- invited, activated, expired, failed
  notes TEXT
);

-- ─────────────────────────────────────────────────────────────────────────
-- Indexes for fast queries
-- ─────────────────────────────────────────────────────────────────────────

-- Find all invites for a vendor
CREATE INDEX IF NOT EXISTS idx_vendor_invite_log_vendor_id
ON vendor_invite_log(vendor_id);

-- Find invites by email (useful for debugging duplicates)
CREATE INDEX IF NOT EXISTS idx_vendor_invite_log_email
ON vendor_invite_log(email);

-- Find recent invites (for rate limiting)
CREATE INDEX IF NOT EXISTS idx_vendor_invite_log_created_at
ON vendor_invite_log(created_at DESC);

-- Find invites by client IP (for rate limiting & security)
CREATE INDEX IF NOT EXISTS idx_vendor_invite_log_client_ip
ON vendor_invite_log(client_ip, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────
-- Useful Queries for Admin
-- ─────────────────────────────────────────────────────────────────────────

-- See all invitations for a vendor:
-- SELECT * FROM vendor_invite_log WHERE vendor_id = 'uuid' ORDER BY created_at DESC;

-- Check for duplicate invitations (same email):
-- SELECT email, COUNT(*) as count FROM vendor_invite_log
-- WHERE created_at > NOW() - INTERVAL '30 days'
-- GROUP BY email HAVING COUNT(*) > 1;

-- Check rate limiting (invites from same IP in last minute):
-- SELECT client_ip, COUNT(*) as count FROM vendor_invite_log
-- WHERE created_at > NOW() - INTERVAL '1 minute'
-- GROUP BY client_ip HAVING COUNT(*) > 10;

-- Find recently invited vendors:
-- SELECT vendor_name, email, created_at FROM vendor_invite_log
-- WHERE created_at > NOW() - INTERVAL '7 days'
-- ORDER BY created_at DESC;

-- ─────────────────────────────────────────────────────────────────────────
-- RLS Policies (Optional - for admin only access)
-- ─────────────────────────────────────────────────────────────────────────

-- Enable RLS on this table if needed:
-- ALTER TABLE vendor_invite_log ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all invite logs:
-- CREATE POLICY "admin_view_invite_logs" ON vendor_invite_log
-- FOR SELECT USING (auth.jwt_claims ->> 'is_admin' = 'true');

-- Allow admins to insert logs:
-- CREATE POLICY "admin_insert_invite_logs" ON vendor_invite_log
-- FOR INSERT WITH CHECK (auth.jwt_claims ->> 'is_admin' = 'true');
