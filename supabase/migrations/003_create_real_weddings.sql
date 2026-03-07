-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 2.3: Real Weddings Feature Tables
-- ═══════════════════════════════════════════════════════════════════════════

-- Real weddings gallery
CREATE TABLE IF NOT EXISTS real_weddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  couple_names TEXT,
  wedding_date DATE,
  location TEXT,
  featured_image TEXT,
  gallery_images JSONB, -- Array of {url, caption}
  couple_story TEXT,
  featured BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'draft', -- draft|published
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Vendor credits for real weddings
CREATE TABLE IF NOT EXISTS real_wedding_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  real_wedding_id UUID REFERENCES real_weddings(id) ON DELETE CASCADE,
  vendor_id TEXT,
  vendor_name TEXT NOT NULL,
  vendor_category TEXT, -- venue|catering|photography|planner|florist|music|etc
  vendor_slug TEXT,
  role_description TEXT, -- "Stunning venue" or "Capturing the magic"
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_real_weddings_slug ON real_weddings(slug);
CREATE INDEX idx_real_weddings_status ON real_weddings(status);
CREATE INDEX idx_real_weddings_featured ON real_weddings(featured);
CREATE INDEX idx_real_wedding_vendors_wedding_id ON real_wedding_vendors(real_wedding_id);
CREATE INDEX idx_real_wedding_vendors_vendor_id ON real_wedding_vendors(vendor_id);
