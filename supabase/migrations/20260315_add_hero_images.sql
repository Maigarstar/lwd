-- Add hero images to test venues

-- Lake Garda Villa Paradiso - test/dummy venue, using placeholder
UPDATE listings
SET hero_image = 'https://qpkggfibwreznussudfh.supabase.co/storage/v1/object/public/listing-media/placeholder-luxury-venue.jpg'
WHERE name = 'Lake Garda Villa Paradiso' AND (hero_image IS NULL OR hero_image = '');

-- Note: Six Senses Krabey Island already has real client photography - no update needed
