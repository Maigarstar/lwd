-- ─── Add explicit listing link to venue_showcases ─────────────────────────────
-- Purpose: Link showcase to listing via FK instead of slug matching
-- Allows showcases to reference their associated listing directly

ALTER TABLE venue_showcases
ADD COLUMN listing_id uuid REFERENCES listings(id) ON DELETE SET NULL;

CREATE INDEX idx_venue_showcases_listing_id ON venue_showcases(listing_id);

COMMENT ON COLUMN venue_showcases.listing_id IS 'FK to listings table. The listing this showcase is associated with.';
