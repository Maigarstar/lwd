-- Magazine Studio: Editorial Workflow, Feature Flags, AI Writer fields
-- Run in Supabase SQL Editor

-- ── Editorial Workflow ────────────────────────────────────────────────────────
ALTER TABLE magazine_posts
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(20) DEFAULT 'draft'
    CHECK (workflow_status IN ('draft', 'review', 'published', 'archived')),
  ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ── Feature Flags (Placement & Discovery) ────────────────────────────────────
ALTER TABLE magazine_posts
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS homepage_feature BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS category_feature BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS editors_choice BOOLEAN DEFAULT FALSE;

-- ── AI Writer fields ──────────────────────────────────────────────────────────
ALTER TABLE magazine_posts
  ADD COLUMN IF NOT EXISTS ai_topic TEXT,
  ADD COLUMN IF NOT EXISTS ai_tone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS ai_word_count INTEGER,
  ADD COLUMN IF NOT EXISTS ai_outline JSONB,
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ai_last_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_metadata JSONB;

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_magazine_posts_workflow_status  ON magazine_posts(workflow_status);
CREATE INDEX IF NOT EXISTS idx_magazine_posts_is_featured      ON magazine_posts(is_featured)      WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_magazine_posts_homepage_feature ON magazine_posts(homepage_feature) WHERE homepage_feature = TRUE;
CREATE INDEX IF NOT EXISTS idx_magazine_posts_editors_choice   ON magazine_posts(editors_choice)   WHERE editors_choice = TRUE;
