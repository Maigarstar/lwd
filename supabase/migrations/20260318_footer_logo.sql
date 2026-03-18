-- Add logo_url and logo_type to footer_config
-- logo_type: 'text' (default LWD wordmark) | 'image' (uploaded file)
ALTER TABLE footer_config
  ADD COLUMN IF NOT EXISTS logo_url  text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS logo_type text NOT NULL DEFAULT 'text';
