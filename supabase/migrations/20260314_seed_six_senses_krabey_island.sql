-- ===============================================================================
-- SEED: Six Senses Krabey Island - Full Listing Record
-- Koh Krabey Island, Preah Sihanouk Province, Cambodia
-- ===============================================================================
-- Run after: 20260314_add_hero_tagline.sql (adds hero_tagline column)
-- ===============================================================================

INSERT INTO listings (
  listing_type, name, slug,
  country, country_slug, region, region_slug, city, city_slug, address, lat, lng,
  hero_tagline, short_description, description,
  hero_image, hero_layout,
  capacity_min, capacity_max,
  price_from, price_label, price_currency,
  venue_type, styles, tags,
  category_slug,
  status, visibility, is_verified, is_featured,
  seo_title, seo_description,
  rooms_total, rooms_max_guests, rooms_exclusive_use, rooms_description,
  dining_style, dining_in_house, dining_description,
  exclusive_use_enabled, exclusive_use_title, exclusive_use_subtitle, exclusive_use_description, exclusive_use_includes,
  faq_enabled, faq_title, faq_categories,
  contact_profile,
  spaces,
  media_items,
  estate_enabled, estate_items,
  showcase_enabled
) VALUES (
  'venue',
  'Six Senses Krabey Island',
  'six-senses-krabey-island',
  'Cambodia', 'cambodia',
  'Preah Sihanouk Province', 'preah-sihanouk',
  'Koh Krabey Island', 'koh-krabey-island',
  'Koh Krabey Island, Preah Sihanouk Province, Cambodia',
  10.6427, 103.5260,
  'A private island sanctuary in the Gulf of Thailand',
  'Forty overwater and beachfront villas, a world-class spa, and pristine private beaches, exclusively yours.',
  'Six Senses Krabey Island is a private island retreat in the Gulf of Thailand, off the coast of Sihanoukville in Cambodia. Set across 20 hectares of lush jungle and crystalline coastline, the island is home to 40 pool villas - overwater, beachfront, and hideaway - all designed with Cambodian materials and a deep sensitivity to the natural landscape. The Six Senses Spa is among the finest in Southeast Asia, blending ancient Khmer healing traditions with contemporary therapies. Dining centres on the AHA Restaurant and the Tree Restaurant, both drawing on the island''s own organic garden and the incredible seafood of the Gulf. For weddings and private celebrations, the island can be taken on an exclusive buyout basis, offering total privacy for up to 100 guests.',
  'Six-Senses-Krabey-Island/DJI_20240519072805_0089_D-Enhanced-NR.jpg',
  'cinematic',
  2, 100,
  1200, 'From', 'USD',
  'private-island',
  '["island", "overwater", "beachfront", "tropical", "wellness"]'::jsonb,
  '["private-island", "cambodia", "southeast-asia", "wellness", "luxury-resort", "wedding-venue"]'::jsonb,
  'venues',
  'published', 'public', true, true,
  'Six Senses Krabey Island - Private Island Wedding and Events Cambodia',
  'An entire private island in the Gulf of Thailand. Forty overwater and beachfront villas, world-class spa, vibrant dining. Exclusive island buyout available for weddings and celebrations.',
  40, 100, true,
  'Forty pool villas across four categories: Ocean Pool Villa Suites, Beachfront Retreats, Hideaway Pool Villas, and a two-bedroom Oceanfront Villa. Each features Cambodian natural materials, a private pool, outdoor shower, and direct beach or ocean access.',
  'In-house', true,
  'The AHA Restaurant serves contemporary cuisine inspired by Cambodian and regional flavours, with ingredients from the island''s own organic garden. The Tree Restaurant offers relaxed dining in the jungle canopy. Private beachfront dinners and sunset boardwalk suppers can be arranged throughout the island.',
  true,
  'The Whole Island Is Yours',
  'Exclusive Island Buyout',
  'Six Senses Krabey Island offers one of the most extraordinary exclusive-use experiences in Southeast Asia. A full island buyout gives you private access to all 40 villas, every beach and boardwalk, the spa, the AHA and Tree Restaurants, the Sunset Bar, the main pool, and every activity on the island. Your dedicated Six Senses events team designs every detail from first enquiry to final farewell.',
  '[{"text": "All 40 villas exclusively yours"}, {"text": "All restaurants and bars"}, {"text": "Six Senses Spa, pool, and all facilities"}, {"text": "All beaches, boardwalks, and ocean activities"}, {"text": "Dedicated wedding concierge team"}, {"text": "Bespoke decor, ceremony and reception design"}, {"text": "Airport and boat transfer coordination"}, {"text": "Up to 100 wedding guests"}]'::jsonb,
  true,
  'Your Questions, Answered',
  '[{"category": "Before You Book", "questions": [{"q": "Can we have exclusive use of the whole island?", "a": "Yes. Six Senses Krabey Island can be taken on a full buyout basis, giving you exclusive access to all 40 villas, every beach, the spa, and all dining areas. The island accommodates up to 100 guests."}, {"q": "What is the best time of year to get married at Six Senses Krabey Island?", "a": "The dry season runs from November to April, offering calm seas, clear skies, and ideal beach conditions. This is the most popular period for weddings."}]}, {"category": "The Experience", "questions": [{"q": "What wedding ceremony styles are available?", "a": "The island supports barefoot beach ceremonies, formal pavilion settings, symbolic ceremonies, legal ceremonies with a Cambodian official, and blessing ceremonies."}, {"q": "Can we arrange helicopter or private boat transfers?", "a": "Yes. Private speedboat transfers from Sihanoukville port are included, and helicopter arrivals can be arranged on request."}, {"q": "Is the spa available exclusively for our group?", "a": "On a full island buyout, the Six Senses Spa and all its treatment rooms are reserved exclusively for your group throughout your stay."}, {"q": "What activities are included for guests?", "a": "All guests have access to snorkelling, kayaking, paddleboarding, the fitness centre, yoga sessions, the Alchemy Bar, and daily guided experiences including Khmer cooking classes and sunset fishing."}]}]'::jsonb,
  '{"photo_url": null, "name": "Six Senses Krabey Island", "title": "Wedding and Events Team", "bio": "Our dedicated wedding concierge team is here to design and deliver your perfect island celebration, from first enquiry to final farewell.", "email": "reservations-krabey@sixsenses.com", "phone": "+855 69 944 888", "whatsapp": "+85569944888", "response_time": "Within 24 hours", "response_rate": "100%", "instagram": "@sixsenseskrabeyisland", "website": "https://www.sixsenses.com/en/hotels/krabey-island"}'::jsonb,
  '[{"id": "space-1", "name": "The Beach", "description": "A private stretch of white sand lapped by calm Gulf waters, ideal for barefoot ceremonies at sunrise or sunset. Accommodates up to 80 standing guests.", "capacity": 80, "indoor": false, "outdoor": true}, {"id": "space-2", "name": "Overwater Deck", "description": "An elevated timber platform extending out over the sea, surrounded by water on three sides. Perfect for intimate ceremonies and cocktail receptions.", "capacity": 40, "indoor": false, "outdoor": true}, {"id": "space-3", "name": "Jungle Clearing", "description": "A secluded clearing in the island interior, framed by tropical foliage and lit by lanterns. A dramatic setting for evening ceremonies and dinners.", "capacity": 60, "indoor": false, "outdoor": true}, {"id": "space-4", "name": "AHA Restaurant Terrace", "description": "The main restaurant terrace overlooking the sea, with capacity for seated dinners of up to 100 guests. Available for exclusive use on a full island buyout.", "capacity": 100, "indoor": true, "outdoor": true}, {"id": "space-5", "name": "Private Boardwalk", "description": "A candlelit wooden boardwalk stretching across the water, connecting the island to the overwater villas. A stunning setting for a sunset dinner.", "capacity": 20, "indoor": false, "outdoor": true}]'::jsonb,
  '[{"id": "m-1", "url": "Six-Senses-Krabey-Island/DJI_20240519072805_0089_D-Enhanced-NR.jpg", "role": "hero", "title": "Aerial view at sunrise", "alt_text": "Aerial view of Six Senses Krabey Island in the Gulf of Thailand at sunrise", "visibility": "public"}, {"id": "m-2", "url": "Six-Senses-Krabey-Island/Ocean_Pool_Villa_Suite2_[7375-A4].jpg", "role": "gallery", "title": "Ocean Pool Villa Suite", "alt_text": "Overwater villa with private infinity pool at Six Senses Krabey Island", "visibility": "public"}, {"id": "m-3", "url": "Six-Senses-Krabey-Island/The Beach Retreat-7952x5304-364164d.jpg", "role": "gallery", "title": "Beach Retreat Villa", "alt_text": "Beachfront retreat villa at Six Senses Krabey Island", "visibility": "public"}, {"id": "m-4", "url": "Six-Senses-Krabey-Island/AHA_Restaurant_[8343-A4].jpg", "role": "gallery", "title": "AHA Restaurant", "alt_text": "AHA Restaurant dining room at Six Senses Krabey Island", "visibility": "public"}, {"id": "m-5", "url": "Six-Senses-Krabey-Island/SixSensesKrabeyIslandSpa.jpg", "role": "gallery", "title": "Six Senses Spa", "alt_text": "Six Senses Spa treatment room", "visibility": "public"}, {"id": "m-6", "url": "Six-Senses-Krabey-Island/6Z6A9594.jpg", "role": "gallery", "title": "Wedding Ceremony", "alt_text": "Wedding ceremony on the beach at Six Senses Krabey Island", "visibility": "public"}, {"id": "m-7", "url": "Six-Senses-Krabey-Island/Romantic_boardwalk_dinner_[8340-A4].jpg", "role": "gallery", "title": "Romantic Boardwalk Dinner", "alt_text": "Private candlelit dinner on the boardwalk", "visibility": "public"}, {"id": "m-8", "url": "Six-Senses-Krabey-Island/Yoga_on_the_Rocks_[8357-A4].jpg", "role": "gallery", "title": "Yoga on the Rocks", "alt_text": "Yoga session on the rocks at Six Senses Krabey Island", "visibility": "public"}, {"id": "m-9", "url": "Six-Senses-Krabey-Island/DJI_20240519065028_0027_D-Enhanced-NR.jpg", "role": "gallery", "title": "Island from above", "alt_text": "Aerial view of the island and surrounding sea", "visibility": "public"}, {"id": "m-10", "url": "Six-Senses-Krabey-Island/Private_Sundeck_of_Ocean_Pool_Villa_[8354-A4].jpg", "role": "gallery", "title": "Private Sundeck", "alt_text": "Private sundeck of an overwater villa", "visibility": "public"}]'::jsonb,
  true,
  '[{"id": "e-1", "name": "Six Senses Spa", "description": "Ancient Khmer healing rituals meet contemporary wellness in one of Southeast Asia''s most celebrated spas.", "icon": "spa"}, {"id": "e-2", "name": "Yoga and Meditation", "description": "Daily sessions on the rocks, in the jungle clearing, or on your villa deck at sunrise and sunset.", "icon": "yoga"}, {"id": "e-3", "name": "Snorkelling and Diving", "description": "Crystal-clear Gulf waters rich with marine life surround the island. Equipment is provided for all guests.", "icon": "dive"}, {"id": "e-4", "name": "Kayaking", "description": "Explore the coastline and nearby mangroves at your own pace.", "icon": "kayak"}, {"id": "e-5", "name": "Khmer Cooking Class", "description": "Learn the ancient spices and techniques of Cambodian cuisine with the island''s chefs.", "icon": "cooking"}, {"id": "e-6", "name": "Alchemy Bar", "description": "Create personalised natural potions, oils, and skincare using local herbs and botanicals.", "icon": "alchemy"}]'::jsonb,
  true
);

-- Link to venue_showcases record
UPDATE venue_showcases
SET
  listing_id = (SELECT id FROM listings WHERE slug = 'six-senses-krabey-island'),
  preview_url = '/showcase/six-senses-krabey-island'
WHERE slug = 'six-senses-krabey-island';
