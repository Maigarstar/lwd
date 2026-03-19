-- ─── dev_events_seed.sql ─────────────────────────────────────────────────────
-- Seed data for events + event_bookings (development / demo use only).
-- Idempotent: ON CONFLICT DO NOTHING on slug unique constraint.
--
-- Usage:
--   Copy-paste into Supabase SQL Editor and run.
--   Or: supabase db reset (runs all seeds automatically)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_managed_id  uuid := 'a1b2c3d4-0001-0000-0000-000000000001'; -- Villa d'Este
  v_event1_id   uuid := gen_random_uuid();
  v_event2_id   uuid := gen_random_uuid();
  v_event3_id   uuid := gen_random_uuid();
BEGIN

-- ── Event 1: Open Day at Villa d'Este ─────────────────────────────────────────
INSERT INTO events (
  id, managed_account_id,
  slug, title, subtitle, event_type, status,
  start_date, start_time, end_date, end_time, timezone,
  location_name, location_address,
  booking_mode, capacity, waitlist_enabled,
  is_virtual, is_exhibition,
  description,
  cover_image_url,
  tags_json
) VALUES (
  v_event1_id, v_managed_id,
  'villa-deste-open-day-spring-2026',
  'Villa d''Este Open Day — Spring 2026',
  'An exclusive afternoon for couples planning their wedding on Lake Como',
  'open_day', 'published',
  '2026-04-26', '14:00:00', '2026-04-26', '18:00:00', 'Europe/Rome',
  'Villa d''Este', 'Via Regina 40, 22012 Cernobbio CO, Italy',
  'internal', 40, true,
  false, false,
  E'Join us for an exclusive open day at Villa d\'Este, one of the world\'s most celebrated lakeside estates.\n\nOur wedding team will guide you through the grand salons, the lakeside terrace, and the private garden spaces — giving you a true sense of what your wedding day could look like.\n\nWhat to expect:\n• Private tours of all wedding spaces\n• Tastings from our award-winning kitchen\n• One-to-one consultations with our dedicated wedding planner\n• A champagne reception on the terrace as the sun sets over Lake Como\n\nPlaces are strictly limited to 20 couples. Registration is complimentary.',
  'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=1200&q=80',
  '["open_day", "lake_como", "italy", "luxury"]'
) ON CONFLICT (slug) DO NOTHING;

-- ── Event 2: LWD Virtual Wedding Showcase ─────────────────────────────────────
INSERT INTO events (
  id, managed_account_id,
  slug, title, subtitle, event_type, status,
  start_date, start_time, end_date, end_time, timezone,
  location_name, location_address,
  booking_mode, capacity, waitlist_enabled,
  is_virtual, virtual_platform, stream_url,
  is_exhibition,
  description,
  cover_image_url,
  tags_json
) VALUES (
  v_event2_id, v_managed_id,
  'lwd-virtual-wedding-showcase-may-2026',
  'LWD Virtual Wedding Showcase',
  'A curated showcase of Europe''s finest wedding venues — from your living room',
  'virtual_tour', 'published',
  '2026-05-14', '18:00:00', '2026-05-14', '20:00:00', 'Europe/London',
  NULL, NULL,
  'internal', 500, false,
  true, 'youtube_live', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  false,
  E'Experience the world''s most extraordinary wedding venues without leaving home.\n\nThis two-hour virtual showcase brings together five iconic properties from the Luxury Wedding Directory — each presenting their signature spaces, sharing real wedding stories, and taking live questions from couples.\n\nFeatured venues:\n• Villa d''Este, Lake Como\n• Grand Tirolia, Kitzbühel\n• Borgo Egnazia, Puglia\n• Domaine des Étangs, France\n• Six Senses Krabey Island, Cambodia\n\nThe event streams live on YouTube. Register to receive the direct link and a personalised follow-up from each venue.',
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80',
  '["virtual", "showcase", "multi-venue", "europe"]'
) ON CONFLICT (slug) DO NOTHING;

-- ── Event 3: Borgo Egnazia Open Evening ───────────────────────────────────────
INSERT INTO events (
  id, managed_account_id,
  slug, title, subtitle, event_type, status,
  start_date, start_time, end_date, end_time, timezone,
  location_name, location_address,
  booking_mode, capacity, waitlist_enabled,
  is_virtual, is_exhibition,
  description,
  cover_image_url,
  tags_json
) VALUES (
  v_event3_id, v_managed_id,
  'borgo-egnazia-open-evening-june-2026',
  'Borgo Egnazia — Private Open Evening',
  'An intimate evening in Puglia''s most remarkable wedding estate',
  'open_day', 'published',
  '2026-06-12', '19:00:00', '2026-06-12', '22:00:00', 'Europe/Rome',
  'Borgo Egnazia', 'Contrada Masciola, 72015 Savelletri di Fasano BR, Italy',
  'internal', 20, false,
  false, false,
  E'As the sun drops behind the trulli of Puglia, Borgo Egnazia opens its doors for an intimate evening for couples who have always dreamed of a Puglian wedding.\n\nThis is not a trade fair. It is an opportunity to walk the property at its most beautiful hour, dine at the harvest table, and meet the team who will make your wedding happen.\n\nThe evening includes:\n• Private tour of the Corte and ceremony garden\n• Seasonal tasting menu at Due Camini\n• Consultation with the wedding director\n• An overnight stay option for those travelling from outside Italy\n\nOnly 10 couples can be accommodated. Priority booking for Signature and Growth plan members.',
  'https://images.unsplash.com/photo-1476370648495-3533f64427a2?w=1200&q=80',
  '["open_day", "puglia", "italy", "luxury"]'
) ON CONFLICT (slug) DO NOTHING;

-- ── Sample bookings for Event 1 ───────────────────────────────────────────────
INSERT INTO event_bookings (
  event_id, first_name, last_name, email, phone,
  guest_count, status, consent_data_processing
) VALUES
  (v_event1_id, 'Isabella', 'Marchetti', 'isabella.marchetti@example.com', '+39 02 1234567', 2, 'confirmed', true),
  (v_event1_id, 'Oliver',   'Hughes',    'o.hughes@example.com',           '+44 7700 123456', 2, 'confirmed', true),
  (v_event1_id, 'Sofía',    'García',    'sofia.garcia@example.com',       '+34 612 345678',  2, 'confirmed', true),
  (v_event1_id, 'Chloé',    'Dupont',    'chloe.dupont@example.com',       NULL,              1, 'pending',   true)
ON CONFLICT DO NOTHING;

END $$;
