-- Comprehensive migration to add ALL missing columns for ListingStudio Phase 1 & 2
-- This adds columns for the complete form schema

BEGIN;

-- ── Basic listing fields (already exist but ensuring they're present) ────────
ALTER TABLE listings ADD COLUMN IF NOT EXISTS listing_type TEXT DEFAULT 'venue';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS vendor_account_id UUID;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS venue_name TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS slug TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'wedding-venues';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS destination TEXT DEFAULT 'italy';

-- ── Location fields ──────────────────────────────────────────────────────────
ALTER TABLE listings ADD COLUMN IF NOT EXISTS country TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS region TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS postcode TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS address_line2 TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS lat TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS lng TEXT DEFAULT '';

-- ── Core description fields ───────────────────────────────────────────────────
ALTER TABLE listings ADD COLUMN IF NOT EXISTS summary TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS amenities TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS price_range TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS capacity TEXT DEFAULT '';

-- ── Media fields ─────────────────────────────────────────────────────────────
ALTER TABLE listings ADD COLUMN IF NOT EXISTS hero_images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS media_items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS hero_layout TEXT DEFAULT 'cinematic';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS hero_video_url TEXT DEFAULT '';

-- ── Exclusive Use block ───────────────────────────────────────────────────────
ALTER TABLE listings ADD COLUMN IF NOT EXISTS exclusive_use_enabled BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS exclusive_use_title TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS exclusive_use_subtitle TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS exclusive_use_price TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS exclusive_use_subline TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS exclusive_use_description TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS exclusive_use_cta_text TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS exclusive_use_includes JSONB DEFAULT '[]'::jsonb;

-- ── Venue Spaces (max 5) ──────────────────────────────────────────────────────
ALTER TABLE listings ADD COLUMN IF NOT EXISTS spaces JSONB DEFAULT '[]'::jsonb;

-- ── Rooms & Accommodation ─────────────────────────────────────────────────────
ALTER TABLE listings ADD COLUMN IF NOT EXISTS rooms_accommodation_type TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS rooms_total TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS rooms_suites TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS rooms_max_guests TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS rooms_exclusive_use BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS rooms_min_stay TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS rooms_description TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS rooms_images JSONB DEFAULT '[]'::jsonb;

-- ── Dining ────────────────────────────────────────────────────────────────────
ALTER TABLE listings ADD COLUMN IF NOT EXISTS dining_style TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS dining_chef_name TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS dining_in_house BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS dining_external BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS dining_menu_styles JSONB DEFAULT '[]'::jsonb;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS dining_dietary JSONB DEFAULT '[]'::jsonb;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS dining_drinks JSONB DEFAULT '[]'::jsonb;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS dining_description TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS dining_menu_images JSONB DEFAULT '[]'::jsonb;

-- ── Catering Cards (max 3) ────────────────────────────────────────────────────
ALTER TABLE listings ADD COLUMN IF NOT EXISTS catering_enabled BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS catering_cards JSONB DEFAULT '[]'::jsonb;

-- ── Wedding Weekend day cards (max 4) ─────────────────────────────────────────
ALTER TABLE listings ADD COLUMN IF NOT EXISTS wedding_weekend_enabled BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS wedding_weekend_subtitle TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS wedding_weekend_days JSONB DEFAULT '[]'::jsonb;

-- ── On the Estate + Nearby Experiences ────────────────────────────────────────
ALTER TABLE listings ADD COLUMN IF NOT EXISTS estate_enabled BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS estate_items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS nearby_enabled BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS nearby_items JSONB DEFAULT '[]'::jsonb;

-- ── FAQ section ───────────────────────────────────────────────────────────────
ALTER TABLE listings ADD COLUMN IF NOT EXISTS faq_enabled BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS faq_title TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS faq_subtitle TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS faq_cta_enabled BOOLEAN DEFAULT true;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS faq_cta_headline TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS faq_cta_subtext TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS faq_cta_button_text TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS faq_categories JSONB DEFAULT '[]'::jsonb;

-- ── SEO metadata ──────────────────────────────────────────────────────────────
ALTER TABLE listings ADD COLUMN IF NOT EXISTS seo_title TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS seo_description TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS seo_keywords JSONB DEFAULT '[]'::jsonb;

-- ── Publishing state ──────────────────────────────────────────────────────────
ALTER TABLE listings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- ── Multi-location support ────────────────────────────────────────────────────
ALTER TABLE listings ADD COLUMN IF NOT EXISTS additional_locations JSONB DEFAULT '[]'::jsonb;

-- ── Contact profile / sidebar card ────────────────────────────────────────────
ALTER TABLE listings ADD COLUMN IF NOT EXISTS contact_profile JSONB DEFAULT '{"photo_url":"","name":"","title":"","bio":"","email":"","phone":"","whatsapp":"","response_time":"","response_rate":"","instagram":"","website":""}'::jsonb;

-- ── Operating hours & additional info ─────────────────────────────────────────
ALTER TABLE listings ADD COLUMN IF NOT EXISTS opening_hours_enabled BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS opening_hours JSONB DEFAULT '{}'::jsonb;

-- ── Social proof ───────────────────────────────────────────────────────────────
ALTER TABLE listings ADD COLUMN IF NOT EXISTS press_features JSONB DEFAULT '[]'::jsonb;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS awards JSONB DEFAULT '[]'::jsonb;

-- ── Hero caption/credit (from hero_images array) ─────────────────────────────
ALTER TABLE listings ADD COLUMN IF NOT EXISTS hero_caption TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS hero_credit TEXT DEFAULT '';

-- ── Videos (JSONB array of video objects) ─────────────────────────────────────
ALTER TABLE listings ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]'::jsonb;

COMMIT;
