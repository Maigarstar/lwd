-- ─── Vendor Approval Status Migration ────────────────────────────────────────
-- Adds approval workflow columns to vendors table
-- Supports 5-status model: Pending Approval → Approved → Invited → Activated → Suspended/Rejected
-- ─────────────────────────────────────────────────────────────────────────────

-- Add approval status column
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';

-- Add timestamp for when account was approved
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Add reference to admin who approved the account
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS approved_by_admin_id UUID;

-- Create index for filtering by approval status (for admin dashboard queries)
CREATE INDEX IF NOT EXISTS idx_vendors_approval_status ON vendors(approval_status);

-- Create index for finding recently approved accounts
CREATE INDEX IF NOT EXISTS idx_vendors_approved_at ON vendors(approved_at DESC);

-- ─── Status Mapping Documentation ────────────────────────────────────────────
-- Status values and their meanings:
--   'pending'   - Account created, awaiting admin approval
--   'approved'  - Admin approved, ready to send activation email
--   'rejected'  - Admin rejected, account suspended
--   (others inherited from existing is_activated flag)
--
-- Full workflow:
--   Pending Approval → (admin approves) → Approved → (send email) → Invited → (vendor activates) → Activated
--   Pending Approval → (admin rejects) → Rejected (cannot login)
--   Activated → (admin suspends) → Suspended (cannot login)
-- ─────────────────────────────────────────────────────────────────────────────
