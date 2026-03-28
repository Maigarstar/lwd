-- RESTORE SCRIPT: locations table backup
-- To restore: paste this into Supabase SQL Editor

INSERT INTO public.locations (id, location_key, location_type, country_slug, region_slug, city_slug, hero_image, hero_video, hero_title, hero_subtitle, cta_text, cta_link, featured_venues_title, featured_venues, featured_vendors_title, featured_vendors, map_lat, map_lng, map_zoom, discovery_filters, published, published_at, created_at, updated_at, metadata)
VALUES ('0304e545-782b-4aea-971e-07c14c4d4c49', 'country:england', 'country', 'england', NULL, NULL, 'https://qpkggfibwreznussudfh.supabase.co/storage/v1/object/public/listing-media/locations/country/england/1774681936320.jpeg', NULL, 'Weddings in England', NULL, 'Explore Venues', '#', 'Signature Venues', '[]', 'Top Wedding Planners', '[]', NULL, NULL, 8, '{"showCapacityFilter":true,"showStyleFilter":true,"showPriceFilter":true,"defaultSort":"recommended"}', TRUE, NULL, '2026-03-28T07:07:56.159954+00:00', '2026-03-28T07:22:51.679308+00:00', '{"heroImages":["https://qpkggfibwreznussudfh.supabase.co/storage/v1/object/public/listing-media/locations/country/england/1774681936320.jpeg"],"infoRegions":["Cotswolds","London","Surrey","Berkshire","Lake District","Hampshire","Devon","Cornwall","Kent","Sussex","Norfolk","Suffolk","Yorkshire","Oxfordshire","Somerset","Bath","Wiltshire","Dorset","Cheshire","Northumberland","Durham","Warwickshire","West Midlands","Derbyshire","Buckinghamshire","Hertfordshire","Essex","Lancashire","Greater Manchester","Gloucestershire","Cambridgeshire","Lincolnshire","Nottinghamshire","Leicestershire","Shropshire","Worcestershire","Herefordshire","Staffordshire","Northamptonshire","Bedfordshire","Isle of Wight","Bristol","Merseyside","Cumbria","Rutland","Scotland","Wales","Northern Ireland","Channel Islands"],"infoVibes":[],"infoServices":[],"seoContent":"England offers an unrivalled range of wedding settings, from the honey-stone villages of the Cotswolds to the grandeur of London''s historic hotels. Country houses, royal estates and contemporary barn conversions form the backbone of the English luxury wedding market.","seoFaqs":[{"q":"When is the best time to get married in England?","a":"The ideal season varies. We recommend consulting with our local experts who can advise on weather patterns, peak availability and local considerations specific to England."},{"q":"How far in advance should I book a England venue?","a":"Our most sought-after venues in England typically book 18–24 months in advance for peak season dates. We recommend beginning your search at least 18 months before your intended wedding date."},{"q":"Do I need a local or symbolic ceremony in England?","a":"Requirements vary by country. Many couples opt for a symbolic ceremony at the destination followed by a legal ceremony at home. Our team can advise on the exact requirements for England."},{"q":"What is the average cost of a luxury wedding venue in England?","a":"Premium exclusive-use venues in England typically range from £10,000 to £40,000 for venue hire alone, excluding catering, florals and accommodation. Pricing varies by location and season."}],"editorialPara1":"","editorialPara2":"","editorialBlocks":[{"icon":"🏰","text":""},{"icon":"🌿","text":""},{"icon":"🌅","text":""},{"icon":"✨","text":""}],"editorialVenueMode":"latest","showEditorialSplit":true,"showLatestVenues":true,"showLatestVendors":true,"showPlanningGuide":true,"showMotto":true,"motto":"","mottoSubline":"","mottoBgImage":{"url":"https://qpkggfibwreznussudfh.supabase.co/storage/v1/object/public/listing-media/motto-country-england-1774682548046.jpeg","thumbnailUrl":"https://qpkggfibwreznussudfh.supabase.co/storage/v1/object/public/listing-media/motto-country-england-1774682548046_thumb.jpg"},"mottoOverlay":"0.65","editorialEyebrow":"","editorialHeadingPrefix":"","editorialCtaText":"","seoHeading":"","latestVenuesHeading":"","latestVenuesSub":"","latestVenuesCount":12,"latestVenuesMode":"latest","latestVenuesCardStyle":"luxury","latestVenuesSelected":[],"latestVendorsHeading":"","latestVendorsSub":"","latestVendorsCount":12,"latestVendorsMode":"latest","latestVendorsCardStyle":"luxury","latestVendorsSelected":[]}')
ON CONFLICT (location_key) DO UPDATE SET
  location_type = EXCLUDED.location_type,
  country_slug = EXCLUDED.country_slug,
  region_slug = EXCLUDED.region_slug,
  city_slug = EXCLUDED.city_slug,
  hero_image = EXCLUDED.hero_image,
  hero_video = EXCLUDED.hero_video,
  hero_title = EXCLUDED.hero_title,
  hero_subtitle = EXCLUDED.hero_subtitle,
  cta_text = EXCLUDED.cta_text,
  cta_link = EXCLUDED.cta_link,
  featured_venues_title = EXCLUDED.featured_venues_title,
  featured_venues = EXCLUDED.featured_venues,
  featured_vendors_title = EXCLUDED.featured_vendors_title,
  featured_vendors = EXCLUDED.featured_vendors,
  map_lat = EXCLUDED.map_lat,
  map_lng = EXCLUDED.map_lng,
  map_zoom = EXCLUDED.map_zoom,
  discovery_filters = EXCLUDED.discovery_filters,
  published = EXCLUDED.published,
  published_at = EXCLUDED.published_at,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at,
  metadata = EXCLUDED.metadata;
