-- Category Intelligence Layer
-- Adds Aura/AI integration, editorial intent, and homepage management
-- Date: 2026-04-07

-- TIER 1: Core AI & Aura Integration + Editorial Promotion
ALTER TABLE magazine_categories
ADD COLUMN ai_discovery_enabled BOOLEAN DEFAULT true,
ADD COLUMN ai_curator_prompt TEXT,
ADD COLUMN editorial_voice TEXT,
ADD COLUMN discovery_keywords TEXT[],
ADD COLUMN target_audience TEXT,
ADD COLUMN aura_priority INT DEFAULT 50,
ADD COLUMN featured_on_homepage BOOLEAN DEFAULT false,
ADD COLUMN homepage_sort_order INT,
ADD COLUMN is_active BOOLEAN DEFAULT true,
ADD COLUMN icon TEXT;

-- TIER 2: Content Strategy & Time-Limited Features
ALTER TABLE magazine_categories
ADD COLUMN content_guidelines JSONB DEFAULT '{"tone":"","formality":"","topics":[],"rules":[],"avoid":[]}',
ADD COLUMN featured_until TIMESTAMPTZ;

-- Indexes for common queries
CREATE INDEX idx_categories_active ON magazine_categories(is_active) WHERE is_active = true;
CREATE INDEX idx_categories_featured_homepage ON magazine_categories(featured_on_homepage, homepage_sort_order) WHERE featured_on_homepage = true;
CREATE INDEX idx_categories_discovery ON magazine_categories(ai_discovery_enabled, aura_priority DESC) WHERE ai_discovery_enabled = true;
CREATE INDEX idx_categories_keywords ON magazine_categories USING GIN(discovery_keywords);

-- Comments for clarity (documentation)
COMMENT ON COLUMN magazine_categories.ai_discovery_enabled IS 'Whether Aura can recommend this category to users';
COMMENT ON COLUMN magazine_categories.ai_curator_prompt IS 'Custom instructions for Aura curation (e.g., "Fashion-forward luxury wedding dresses")';
COMMENT ON COLUMN magazine_categories.editorial_voice IS 'Editorial personality (e.g., "elegant, luxury-focused, expert-led")';
COMMENT ON COLUMN magazine_categories.discovery_keywords IS 'Keywords for Aura to match users to this category';
COMMENT ON COLUMN magazine_categories.target_audience IS 'Who this category is for (e.g., "luxury brides, age 25-40")';
COMMENT ON COLUMN magazine_categories.aura_priority IS 'Ranking priority for Aura recommendations (0-100, higher = prioritized more)';
COMMENT ON COLUMN magazine_categories.featured_on_homepage IS 'Display this category on homepage';
COMMENT ON COLUMN magazine_categories.homepage_sort_order IS 'Order on homepage (lower = earlier)';
COMMENT ON COLUMN magazine_categories.is_active IS 'Category is live and editable (false = archived/dormant)';
COMMENT ON COLUMN magazine_categories.icon IS 'Emoji or icon name for UI (e.g., "👗", "ring", "plane")';
COMMENT ON COLUMN magazine_categories.content_guidelines IS 'Structured guidelines: {tone, formality, topics, rules, avoid}';
COMMENT ON COLUMN magazine_categories.featured_until IS 'Time-limit for featured status (seasonal/promotional categories)';
