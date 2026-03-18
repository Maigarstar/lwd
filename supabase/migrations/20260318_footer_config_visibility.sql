-- Add visibility_mode to footer_config
-- Controls which page types the footer renders on.
-- Values: 'all' | 'editorial' | 'directory'

ALTER TABLE footer_config
  ADD COLUMN IF NOT EXISTS visibility_mode text NOT NULL DEFAULT 'all';
