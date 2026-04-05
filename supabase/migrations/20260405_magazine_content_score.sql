-- Migration: persist Editorial Intelligence score to magazine_posts
-- Adds content_score, grade, breakdown JSON, and updated timestamp.
-- Index on content_score enables server-side sort and filter without
-- loading full content arrays for every row.
--
-- Run in Supabase SQL Editor.

ALTER TABLE magazine_posts
  ADD COLUMN IF NOT EXISTS content_score          int,
  ADD COLUMN IF NOT EXISTS content_score_grade    text,
  ADD COLUMN IF NOT EXISTS content_score_breakdown jsonb,
  ADD COLUMN IF NOT EXISTS content_score_updated_at timestamptz;

-- Index for sort-by-score and "needs attention" (score < 55) filter
CREATE INDEX IF NOT EXISTS idx_magazine_posts_content_score
  ON magazine_posts (content_score);

-- Partial index for the "needs attention" use-case — very fast count/filter
CREATE INDEX IF NOT EXISTS idx_magazine_posts_content_score_low
  ON magazine_posts (content_score)
  WHERE content_score < 55;

COMMENT ON COLUMN magazine_posts.content_score IS
  'Editorial Intelligence score 0–100, computed from word count, SEO fields, NLP coverage, keyword placement, structure, and visual content.';
COMMENT ON COLUMN magazine_posts.content_score_grade IS
  'Letter grade: A (≥85), B (≥70), C (≥55), D (≥40), F (<40).';
COMMENT ON COLUMN magazine_posts.content_score_breakdown IS
  'JSON breakdown: {wordPts, seoPts, nlpPts, kwPts, structPts, imgPts} — used for reporting and editor coaching.';
COMMENT ON COLUMN magazine_posts.content_score_updated_at IS
  'Timestamp of last score computation. Allows detecting stale scores when scoring logic changes.';
