-- Migration: Review themes + Aura metadata
-- Adds themes (text[]) and aura_metadata (jsonb) columns to reviews
-- Creates theme extraction function and trigger
-- Backfills existing approved reviews

-- ── Add columns ───────────────────────────────────────────────────────────────
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS themes text[] DEFAULT '{}';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS aura_metadata jsonb DEFAULT '{}';

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS reviews_themes_idx ON reviews USING GIN(themes);
CREATE INDEX IF NOT EXISTS reviews_aura_metadata_idx ON reviews USING GIN(aura_metadata);

-- ── Theme extraction function ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION extract_review_themes(review_text text)
RETURNS text[] AS $$
DECLARE
  t text := lower(review_text);
  result text[] := '{}';
BEGIN
  -- service: team, coordination, concierge, professional, attentive, handled, seamless, flawless
  IF t ILIKE '%team%' OR t ILIKE '%coordination%' OR t ILIKE '%concierge%'
     OR t ILIKE '%professional%' OR t ILIKE '%attentive%' OR t ILIKE '%handled%'
     OR t ILIKE '%seamless%' OR t ILIKE '%flawless%' THEN
    result := array_append(result, 'service');
  END IF;

  -- food: cuisine, chef, dining, restaurant, catering, meal, menu, taste, culinary
  IF t ILIKE '%cuisine%' OR t ILIKE '%chef%' OR t ILIKE '%dining%'
     OR t ILIKE '%restaurant%' OR t ILIKE '%catering%' OR t ILIKE '%meal%'
     OR t ILIKE '%menu%' OR t ILIKE '%taste%' OR t ILIKE '%culinary%' THEN
    result := array_append(result, 'food');
  END IF;

  -- privacy: private, secluded, exclusive, buyout, intimate, no strangers, just us
  IF t ILIKE '%private%' OR t ILIKE '%secluded%' OR t ILIKE '%exclusive%'
     OR t ILIKE '%buyout%' OR t ILIKE '%intimate%' OR t ILIKE '%no strangers%'
     OR t ILIKE '%just us%' THEN
    result := array_append(result, 'privacy');
  END IF;

  -- views: views, scenery, landscape, ocean, beach, jungle, waterfront, sunrise, sunset, nature
  IF t ILIKE '%views%' OR t ILIKE '%scenery%' OR t ILIKE '%landscape%'
     OR t ILIKE '%ocean%' OR t ILIKE '%beach%' OR t ILIKE '%jungle%'
     OR t ILIKE '%waterfront%' OR t ILIKE '%sunrise%' OR t ILIKE '%sunset%'
     OR t ILIKE '%nature%' THEN
    result := array_append(result, 'views');
  END IF;

  -- staff: staff, team, hospitality, helpful, care, knowledge, warmth, personal
  IF t ILIKE '%staff%' OR t ILIKE '%hospitality%' OR t ILIKE '%helpful%'
     OR t ILIKE '%warmth%' OR t ILIKE '%personal%' THEN
    result := array_append(result, 'staff');
  END IF;

  -- planning: planning, organised, detail, coordination, logistics, every detail, nothing was missed
  IF t ILIKE '%planning%' OR t ILIKE '%organised%' OR t ILIKE '%organized%'
     OR t ILIKE '% detail%' OR t ILIKE '%logistics%' OR t ILIKE '%every detail%'
     OR t ILIKE '%nothing was missed%' THEN
    result := array_append(result, 'planning');
  END IF;

  -- rooms: villa, suite, accommodation, room, overwater, beachfront, villas, hideaway
  IF t ILIKE '%villa%' OR t ILIKE '%suite%' OR t ILIKE '%accommodation%'
     OR t ILIKE '%overwater%' OR t ILIKE '%beachfront%' OR t ILIKE '%hideaway%' THEN
    result := array_append(result, 'rooms');
  END IF;

  -- exclusivity: island buyout, exclusive use, entire venue, sole use, private island, complete privacy
  IF t ILIKE '%island buyout%' OR t ILIKE '%exclusive use%' OR t ILIKE '%entire venue%'
     OR t ILIKE '%sole use%' OR t ILIKE '%private island%' OR t ILIKE '%complete privacy%' THEN
    result := array_append(result, 'exclusivity');
  END IF;

  -- ceremony: ceremony, vows, aisle, chapel, wedding, altar, officiant, blessing
  IF t ILIKE '%ceremony%' OR t ILIKE '%vows%' OR t ILIKE '%aisle%'
     OR t ILIKE '%chapel%' OR t ILIKE '%altar%' OR t ILIKE '%officiant%'
     OR t ILIKE '%blessing%' THEN
    result := array_append(result, 'ceremony');
  END IF;

  -- destination: destination, travel, journey, remote, island, international, Cambodia, Tuscany, France
  IF t ILIKE '%destination%' OR t ILIKE '%travel%' OR t ILIKE '%journey%'
     OR t ILIKE '%remote%' OR t ILIKE '%international%' OR t ILIKE '%cambodia%'
     OR t ILIKE '%tuscany%' OR t ILIKE '%france%' THEN
    result := array_append(result, 'destination');
  END IF;

  -- value: worth it, value, exceeded expectations, investment, price, pricing
  IF t ILIKE '%worth it%' OR t ILIKE '%value%' OR t ILIKE '%exceeded expectations%'
     OR t ILIKE '%investment%' OR t ILIKE '%price%' OR t ILIKE '%pricing%' THEN
    result := array_append(result, 'value');
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ── Aura metadata builder ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION build_aura_metadata(
  p_review_text text,
  p_rating numeric,
  p_themes text[]
)
RETURNS jsonb AS $$
DECLARE
  sentiment text;
  word_count int;
  key_phrases text[] := '{}';
BEGIN
  -- Sentiment from rating
  IF p_rating >= 4.8 THEN sentiment := 'exceptional';
  ELSIF p_rating >= 4.0 THEN sentiment := 'very-positive';
  ELSIF p_rating >= 3.5 THEN sentiment := 'positive';
  ELSIF p_rating >= 3.0 THEN sentiment := 'mixed';
  ELSE sentiment := 'needs-improvement';
  END IF;

  -- Word count
  word_count := array_length(string_to_array(trim(regexp_replace(p_review_text, '\s+', ' ', 'g')), ' '), 1);

  -- Extract key phrases (fixed list of luxury wedding phrases present in text)
  IF lower(p_review_text) ILIKE '%island buyout%' THEN key_phrases := array_append(key_phrases, 'island buyout'); END IF;
  IF lower(p_review_text) ILIKE '%private beach%' THEN key_phrases := array_append(key_phrases, 'private beach ceremony'); END IF;
  IF lower(p_review_text) ILIKE '%chef%personally%' OR lower(p_review_text) ILIKE '%personally walked%' THEN key_phrases := array_append(key_phrases, 'chef personally walked us'); END IF;
  IF lower(p_review_text) ILIKE '%overwater%' THEN key_phrases := array_append(key_phrases, 'overwater villas'); END IF;
  IF lower(p_review_text) ILIKE '%sunrise%' THEN key_phrases := array_append(key_phrases, 'sunrise ceremony'); END IF;
  IF lower(p_review_text) ILIKE '%sunset%' THEN key_phrases := array_append(key_phrases, 'sunset ceremony'); END IF;
  IF lower(p_review_text) ILIKE '%jungle%' THEN key_phrases := array_append(key_phrases, 'jungle setting'); END IF;
  IF lower(p_review_text) ILIKE '%complete privacy%' OR lower(p_review_text) ILIKE '%no strangers%' THEN key_phrases := array_append(key_phrases, 'complete privacy'); END IF;
  IF lower(p_review_text) ILIKE '%seamless%' THEN key_phrases := array_append(key_phrases, 'seamless coordination'); END IF;
  IF lower(p_review_text) ILIKE '%exceeded%' THEN key_phrases := array_append(key_phrases, 'exceeded expectations'); END IF;

  RETURN jsonb_build_object(
    'themes', to_jsonb(p_themes),
    'sentiment', sentiment,
    'key_phrases', to_jsonb(key_phrases),
    'word_count', word_count
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ── Trigger function ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION reviews_extract_themes_fn()
RETURNS trigger AS $$
DECLARE
  extracted_themes text[];
BEGIN
  -- Only process approved reviews with review_text
  IF NEW.moderation_status = 'approved' AND NEW.review_text IS NOT NULL AND NEW.review_text != '' THEN
    extracted_themes := extract_review_themes(NEW.review_text);
    NEW.themes := extracted_themes;
    NEW.aura_metadata := build_aura_metadata(
      NEW.review_text,
      COALESCE(NEW.overall_rating, 0),
      extracted_themes
    );
  ELSIF NEW.moderation_status != 'approved' THEN
    -- Clear themes for non-approved reviews
    NEW.themes := '{}';
    NEW.aura_metadata := '{}';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Create trigger ────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS reviews_extract_themes ON reviews;
CREATE TRIGGER reviews_extract_themes
  BEFORE INSERT OR UPDATE OF review_text, moderation_status
  ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION reviews_extract_themes_fn();

-- ── Backfill existing approved reviews ───────────────────────────────────────
UPDATE reviews
SET
  themes = extract_review_themes(review_text),
  aura_metadata = build_aura_metadata(
    review_text,
    COALESCE(overall_rating, 0),
    extract_review_themes(review_text)
  )
WHERE
  moderation_status = 'approved'
  AND review_text IS NOT NULL
  AND review_text != '';
