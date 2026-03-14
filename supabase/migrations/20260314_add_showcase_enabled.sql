-- Add showcase_enabled column to listings table
-- Controls whether the "Showcase ✦" button shows on venue cards

ALTER TABLE listings ADD COLUMN IF NOT EXISTS showcase_enabled boolean DEFAULT false;

-- Enable showcase for Domaine des Etangs and Grand Tirolia (both have dedicated showcase pages)
UPDATE listings SET showcase_enabled = true WHERE slug IN ('domaine-des-etangs', 'grand-tirolia-kitzbuehel');
