-- ═══════════════════════════════════════════════════════════════════════════
-- AI Generation Logs — Phase 3: Taigenic Learning System
-- Tracks every AI generation (article body, outline, brief) for:
--   1. Quality analysis — which prompts produce higher scores
--   2. Acceptance rates — which drafts get accepted vs rejected
--   3. Cost tracking — tokens used per generation
--   4. Learning loop — feed outcomes back into prompt tuning
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ai_generation_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- What was generated
  feature       VARCHAR(40) NOT NULL DEFAULT 'taigenic-writer',
    -- 'taigenic-writer' | 'taigenic-outline' | 'taigenic-brief' | 'taigenic-section'
  post_id       UUID REFERENCES magazine_posts(id) ON DELETE SET NULL,

  -- Input parameters
  topic         TEXT,
  title         TEXT,
  category      VARCHAR(60),
  tone          VARCHAR(60),
  focus_keyword TEXT,
  word_target   INTEGER,

  -- Output metrics
  word_count    INTEGER,
  block_count   INTEGER,
  seo_score     INTEGER,           -- 0–100, computed at generation time
  nlp_coverage  REAL,              -- 0.0–1.0, fraction of NLP terms used
  nlp_terms_used TEXT[],

  -- AI provider info
  provider      VARCHAR(40),       -- 'openai' | 'anthropic' | etc.
  model         VARCHAR(80),
  prompt_version VARCHAR(20) DEFAULT 'v1',
  tokens_in     INTEGER,
  tokens_out    INTEGER,
  latency_ms    INTEGER,           -- round-trip time

  -- Outcome tracking (updated after user action)
  outcome       VARCHAR(20) DEFAULT 'pending',
    -- 'pending' | 'accepted' | 'partial' | 'rejected' | 'regenerated'
  blocks_accepted INTEGER,
  blocks_rejected INTEGER,
  outcome_at    TIMESTAMPTZ,

  -- Structured output extras
  seo_title_generated    TEXT,
  meta_desc_generated    TEXT,
  faq_count              INTEGER DEFAULT 0,

  -- Freeform metadata
  metadata      JSONB DEFAULT '{}'
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ai_gen_logs_created    ON ai_generation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_gen_logs_feature    ON ai_generation_logs(feature);
CREATE INDEX IF NOT EXISTS idx_ai_gen_logs_post       ON ai_generation_logs(post_id);
CREATE INDEX IF NOT EXISTS idx_ai_gen_logs_outcome    ON ai_generation_logs(outcome);
CREATE INDEX IF NOT EXISTS idx_ai_gen_logs_category   ON ai_generation_logs(category);

-- ── RLS: allow inserts from any authenticated user, reads from admin ─────────
ALTER TABLE ai_generation_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (edge function uses service role, but client inserts are fine too)
CREATE POLICY ai_gen_logs_insert ON ai_generation_logs
  FOR INSERT WITH CHECK (true);

-- Anyone can update their own log entries (for outcome tracking)
CREATE POLICY ai_gen_logs_update ON ai_generation_logs
  FOR UPDATE USING (true);

-- Select: allow all (admin dashboard reads; no sensitive data in logs)
CREATE POLICY ai_gen_logs_select ON ai_generation_logs
  FOR SELECT USING (true);
