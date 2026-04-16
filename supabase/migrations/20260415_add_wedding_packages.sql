-- Wedding Packages — add JSONB column to listings table
--
-- Each listing can have up to 5 wedding packages, each one a structured
-- offering with name, duration, price, capacities and inclusions. Used
-- by venues like Orchardleigh that publish "House Weddings" + "Estate
-- Weddings" style multi-day packages.
--
-- Shape (per package object inside the array):
-- {
--   "id": "pkg-xxx",
--   "name": "House Weddings",
--   "duration_days": 4,
--   "exclusive_use": true,
--   "price_from": 8889,
--   "price_currency": "£",
--   "season": "winter" | "summer" | "year-round" | "",
--   "min_guests": 60,
--   "max_guests": 144,
--   "dining_capacity": 144,
--   "accommodation_capacity": 95,
--   "description": "1, 2, 3 or 4 day weddings with exclusive use…",
--   "inclusions": ["Golf", "Shooting", "Fishing", "Hot Tubs", "Dance til Dawn"],
--   "sort_order": 0
-- }

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS wedding_packages JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN listings.wedding_packages IS
  'Array of structured wedding package offerings (max 5). Each package has name, duration_days, price_from, capacities and inclusions[]. Surfaced on the public listing as a comparison block.';
