-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 2: Vendor Inquiries Table
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS vendor_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  vendor_email TEXT NOT NULL,
  couple_name TEXT NOT NULL,
  couple_email TEXT NOT NULL,
  couple_phone TEXT,
  wedding_date DATE NOT NULL,
  guest_count INTEGER,
  budget TEXT,
  message TEXT,
  status TEXT DEFAULT 'new', -- new|replied|closed
  vendor_reply TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  replied_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_vendor_inquiries_vendor_id ON vendor_inquiries(vendor_id);
CREATE INDEX idx_vendor_inquiries_status ON vendor_inquiries(status);
CREATE INDEX idx_vendor_inquiries_created_at ON vendor_inquiries(created_at DESC);

-- Enable RLS (Row Level Security) - optional, for production
-- ALTER TABLE vendor_inquiries ENABLE ROW LEVEL SECURITY;
