ALTER TABLE footer_config
  ADD COLUMN IF NOT EXISTS strip_label text NOT NULL DEFAULT 'Iconic Venues';
