-- Add lead_score column to prospects
-- Score 0-100, calculated by leadScoringService.js

ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS lead_score INTEGER NOT NULL DEFAULT 0
    CHECK (lead_score >= 0 AND lead_score <= 100);

CREATE INDEX IF NOT EXISTS prospects_lead_score_idx ON prospects (lead_score DESC);

-- Optional: pre-set all existing prospects to 0 (will be recalculated by UI)
UPDATE prospects SET lead_score = 0 WHERE lead_score IS NULL;
