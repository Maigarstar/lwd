-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 2.4: Vendor Shortlist / Favorites Table
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS vendor_shortlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id TEXT NOT NULL, -- session ID or email for anonymous users
  vendor_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  vendor_slug TEXT NOT NULL,
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(couple_id, vendor_id)
);

-- Create indexes
CREATE INDEX idx_vendor_shortlists_couple_id ON vendor_shortlists(couple_id);
CREATE INDEX idx_vendor_shortlists_vendor_id ON vendor_shortlists(vendor_id);
CREATE INDEX idx_vendor_shortlists_added_at ON vendor_shortlists(added_at DESC);
