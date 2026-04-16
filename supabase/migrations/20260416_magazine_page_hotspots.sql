-- 20260416_magazine_page_hotspots
-- Adds vendor_credits column to magazine_issue_pages.
-- link_targets already exists (hotspot regions) — no change needed.
-- Also adds an index for fast credit lookups.

ALTER TABLE magazine_issue_pages
  ADD COLUMN IF NOT EXISTS vendor_credits jsonb DEFAULT '[]';

COMMENT ON COLUMN magazine_issue_pages.link_targets IS
  'Clickable hotspot regions: [{id,x%,y%,w%,h%,type,label,url,vendorName,category}]';
COMMENT ON COLUMN magazine_issue_pages.vendor_credits IS
  'Supplier credits for this page: [{id,role,vendorName,category,profileSlug,website}]';
