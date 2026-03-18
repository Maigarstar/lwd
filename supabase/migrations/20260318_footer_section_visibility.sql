-- Add per-section visibility toggles to footer_config
-- show_iconic_strip:      hide/show the Iconic Venues marquee strip
-- show_editorial_tagline: hide/show the italic editorial tagline above the strip

ALTER TABLE public.footer_config
  ADD COLUMN IF NOT EXISTS show_iconic_strip      boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_editorial_tagline boolean NOT NULL DEFAULT true;
