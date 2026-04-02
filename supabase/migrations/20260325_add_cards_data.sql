-- ═══════════════════════════════════════════════════════════════════════════
-- Add cards_data JSONB column to listings
-- Stores all three Listing Studio card configurations:
--   Venue Card   (card_venue_*)
--   Vendor Card  (card_vendor_*)
--   GCard        (card_gcard_*)
-- Keys are camelCase, e.g. { cardVenueTitle: "...", cardVenueDescription: "..." }
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS cards_data JSONB DEFAULT '{}'::jsonb;
