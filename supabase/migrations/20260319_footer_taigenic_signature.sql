-- Migration: 20260319_footer_taigenic_signature
-- Adds Taigenic signature fields to footer_config table

ALTER TABLE footer_config
  ADD COLUMN IF NOT EXISTS show_taigenic    boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS taigenic_label   text    DEFAULT 'Powered by Taigenic.AI',
  ADD COLUMN IF NOT EXISTS taigenic_tagline text    DEFAULT 'AI systems for luxury brands',
  ADD COLUMN IF NOT EXISTS taigenic_url     text    DEFAULT '/taigenic',
  ADD COLUMN IF NOT EXISTS taigenic_symbol  text    DEFAULT '✦';

-- Backfill existing row
UPDATE footer_config
SET
  show_taigenic    = true,
  taigenic_label   = 'Powered by Taigenic.AI',
  taigenic_tagline = 'AI systems for luxury brands',
  taigenic_url     = '/taigenic',
  taigenic_symbol  = '✦'
WHERE id = 'homepage';
