-- ═══════════════════════════════════════════════════════════════════════════
-- AI Settings System - Production Ready
-- ═══════════════════════════════════════════════════════════════════════════
-- Purpose: Manage AI provider configuration (ChatGPT, Gemini, Claude)
-- Security: API keys stored server-side only, never exposed to frontend
-- Tables: ai_settings, ai_usage_log
-- RLS: Admin only access with COALESCE null safety

-- ─────────────────────────────────────────────────────────────────────────
-- AI SETTINGS TABLE
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Provider identification
  provider TEXT NOT NULL UNIQUE,
  provider_display_name TEXT NOT NULL,

  -- API Configuration (SERVER SIDE ONLY - NEVER expose to frontend)
  api_key TEXT NOT NULL,
  model TEXT NOT NULL,

  -- Status
  active BOOLEAN DEFAULT FALSE,

  -- Configuration
  description TEXT,
  rate_limit INTEGER DEFAULT 100 CHECK (rate_limit > 0),
  max_tokens INTEGER DEFAULT 1500 CHECK (max_tokens > 0),
  temperature DECIMAL(3,2) DEFAULT 0.7
    CHECK (temperature >= 0 AND temperature <= 1),

  -- Future flexibility
  provider_config JSONB DEFAULT '{}'::jsonb,

  -- Admin tracking with timezone awareness
  created_by_admin_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by_admin_id UUID,
  last_used_at TIMESTAMPTZ,

  -- Validate provider names
  CONSTRAINT valid_provider CHECK (provider IN ('openai', 'gemini', 'claude'))
);

-- ─────────────────────────────────────────────────────────────────────────
-- Enforce only ONE active provider at database level
-- ─────────────────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_settings_one_active
ON ai_settings ((active)) WHERE active = TRUE;

-- Other indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ai_settings_provider
ON ai_settings(provider);

CREATE INDEX IF NOT EXISTS idx_ai_settings_updated_at
ON ai_settings(updated_at DESC);

-- ─────────────────────────────────────────────────────────────────────────
-- AI USAGE LOG TABLE
-- ─────────────────────────────────────────────────────────────────────────
-- Track all AI generation requests for analytics, cost tracking, and auditing

CREATE TABLE IF NOT EXISTS ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Provider information
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  api_setting_id UUID REFERENCES ai_settings(id) ON DELETE SET NULL,

  -- Generation context
  feature TEXT NOT NULL,
  venue_id UUID,

  -- Token usage with validation
  prompt_tokens INTEGER DEFAULT 0 CHECK (prompt_tokens >= 0),
  completion_tokens INTEGER DEFAULT 0 CHECK (completion_tokens >= 0),
  total_tokens INTEGER DEFAULT 0 CHECK (total_tokens >= 0),

  -- Cost tracking
  estimated_cost DECIMAL(10,4) DEFAULT 0 CHECK (estimated_cost >= 0),

  -- Request status with validation
  status TEXT DEFAULT 'success'
    CHECK (status IN ('success', 'error', 'timeout', 'rate_limited')),
  error_message TEXT,

  -- Performance metrics
  request_duration_ms INTEGER CHECK (request_duration_ms >= 0),

  -- Audit timestamp with timezone awareness
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────
-- Indexes for usage analytics and dashboards
-- ─────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_ai_usage_log_feature
ON ai_usage_log(feature, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_log_provider
ON ai_usage_log(provider, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_log_venue_id
ON ai_usage_log(venue_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_log_created_at
ON ai_usage_log(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────────────────

-- ADMIN ONLY: Manage AI settings
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_ai_settings" ON ai_settings
FOR ALL
USING (COALESCE((auth.jwt() ->> 'is_admin')::boolean, FALSE) = TRUE)
WITH CHECK (COALESCE((auth.jwt() ->> 'is_admin')::boolean, FALSE) = TRUE);

-- ADMIN ONLY: View usage logs
ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_view_ai_usage" ON ai_usage_log
FOR SELECT
USING (COALESCE((auth.jwt() ->> 'is_admin')::boolean, FALSE) = TRUE);

-- NOTE: Backend service role inserts to ai_usage_log
-- Service role bypasses RLS, so no INSERT policy needed
-- If service role not available, add:
-- CREATE POLICY "backend_insert_ai_usage" ON ai_usage_log
-- FOR INSERT WITH CHECK (TRUE);

-- ─────────────────────────────────────────────────────────────────────────
-- INITIAL DATA
-- ─────────────────────────────────────────────────────────────────────────
-- No seed row - admin creates first provider entry via Admin UI
-- This ensures api_key is always valid (never placeholder or placeholder)

-- ─────────────────────────────────────────────────────────────────────────
-- ADMIN HELPER QUERIES
-- ─────────────────────────────────────────────────────────────────────────

-- Get active provider (for backend /api/ai/generate)
-- SELECT id, provider, api_key, model, rate_limit, max_tokens
-- FROM ai_settings WHERE active = TRUE LIMIT 1;

-- Get all providers for admin UI (with MASKED key, no real key!)
-- SELECT id, provider, provider_display_name, model, active, rate_limit, max_tokens, temperature,
--   CONCAT(LEFT(api_key, 5), '****', RIGHT(api_key, 4)) as api_key_masked
-- FROM ai_settings ORDER BY created_at DESC;

-- Get usage by feature (for analytics dashboard)
-- SELECT
--   feature,
--   COUNT(*) as total_requests,
--   SUM(total_tokens) as total_tokens,
--   SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
--   SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed,
--   ROUND(SUM(estimated_cost)::NUMERIC, 2) as total_cost,
--   ROUND(AVG(request_duration_ms)::NUMERIC, 0) as avg_duration_ms
-- FROM ai_usage_log
-- WHERE created_at > NOW() - INTERVAL '7 days'
-- GROUP BY feature
-- ORDER BY total_requests DESC;

-- Get usage by provider (for cost tracking)
-- SELECT
--   provider,
--   model,
--   COUNT(*) as total_requests,
--   SUM(total_tokens) as total_tokens,
--   ROUND(SUM(estimated_cost)::NUMERIC, 2) as total_cost,
--   ROUND(AVG(request_duration_ms)::NUMERIC, 0) as avg_duration_ms
-- FROM ai_usage_log
-- WHERE created_at > NOW() - INTERVAL '30 days'
-- GROUP BY provider, model
-- ORDER BY total_cost DESC;

-- Find errors (for debugging)
-- SELECT provider, feature, status, error_message, COUNT(*) as count,
--   ROUND(AVG(request_duration_ms)::NUMERIC, 0) as avg_duration_ms
-- FROM ai_usage_log
-- WHERE created_at > NOW() - INTERVAL '24 hours' AND status != 'success'
-- GROUP BY provider, feature, status, error_message
-- ORDER BY count DESC;

-- Identify most expensive features
-- SELECT feature, SUM(total_tokens) as total_tokens,
--   ROUND(SUM(estimated_cost)::NUMERIC, 2) as total_cost,
--   COUNT(*) as request_count
-- FROM ai_usage_log
-- WHERE created_at > NOW() - INTERVAL '30 days'
-- GROUP BY feature
-- ORDER BY total_cost DESC;

-- Find venues using AI generation
-- SELECT DISTINCT venue_id, COUNT(*) as ai_requests
-- FROM ai_usage_log
-- WHERE venue_id IS NOT NULL
-- GROUP BY venue_id
-- ORDER BY ai_requests DESC LIMIT 20;
