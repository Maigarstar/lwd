-- Add approval workflow columns to listing_applications
-- These are separate from the generic reviewed_by/reviewed_at columns
-- to allow distinct tracking of who approved + when + at what tier

ALTER TABLE public.listing_applications
  ADD COLUMN IF NOT EXISTS vendor_id   uuid,  -- soft link to vendors.id (no FK — vendors table pre-exists)
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by TEXT,
  ADD COLUMN IF NOT EXISTS tier        TEXT CHECK (tier IN ('standard', 'featured', 'showcase'));

-- contact_name is referenced by approve-vendor-application function
ALTER TABLE public.listing_applications
  ADD COLUMN IF NOT EXISTS contact_name TEXT;

CREATE INDEX IF NOT EXISTS idx_listing_applications_vendor_id
  ON public.listing_applications(vendor_id) WHERE vendor_id IS NOT NULL;
