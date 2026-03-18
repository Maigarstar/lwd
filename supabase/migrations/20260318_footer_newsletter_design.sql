-- Add brand block + newsletter + iconic strip controls to footer_config
ALTER TABLE footer_config
  ADD COLUMN IF NOT EXISTS logo_text               text    NOT NULL DEFAULT 'Luxury Wedding Directory',
  ADD COLUMN IF NOT EXISTS brand_est_text          text    NOT NULL DEFAULT 'Est. 2006 · Worldwide',
  ADD COLUMN IF NOT EXISTS brand_office_text       text    NOT NULL DEFAULT 'Worldwide · London Headquarters',
  ADD COLUMN IF NOT EXISTS strip_pad_y             integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS newsletter_bg           text    NOT NULL DEFAULT '#000000',
  ADD COLUMN IF NOT EXISTS newsletter_border_color text    NOT NULL DEFAULT '#2d2d2d',
  ADD COLUMN IF NOT EXISTS newsletter_pad_y        integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS newsletter_label        text    NOT NULL DEFAULT 'The Editorial';
