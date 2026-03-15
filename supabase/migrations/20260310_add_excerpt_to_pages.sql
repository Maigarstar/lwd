-- Add excerpt column to pages table for Page Studio
-- Used for page summaries, meta descriptions, and AI-generated content

ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS excerpt TEXT DEFAULT '';
