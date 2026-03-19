-- Migration: 20260319_site_branding
-- Full brand identity + header/footer layout management table.
-- Single source of truth for logo, sizing, placement, and layout presets.

CREATE TABLE IF NOT EXISTS public.site_branding (
  id                       text PRIMARY KEY DEFAULT 'main',

  -- ── Brand Identity ───────────────────────────────────────────────────────
  brand_name               text    DEFAULT 'Luxury Wedding Directory',
  brand_tagline            text,                       -- optional editorial tagline
  logo_alt_text            text    DEFAULT 'Luxury Wedding Directory',
  logo_link_target         text    DEFAULT '/',        -- usually homepage

  -- ── Logo Type ───────────────────────────────────────────────────────────
  logo_type                text    NOT NULL DEFAULT 'text',
    -- 'text' | 'image' | 'image+text' | 'icon'

  logo_variant             text    DEFAULT 'full',
    -- 'full' | 'wordmark' | 'monogram' | 'icon-mark'

  -- ── Logo Assets ─────────────────────────────────────────────────────────
  logo_text                text    DEFAULT 'Luxury Wedding Directory',
  logo_font                text    DEFAULT 'serif',   -- 'serif' | 'sans'
  logo_color               text,                      -- null = theme gold

  logo_image_light         text,                      -- main logo (light bg / default)
  logo_image_dark          text,                      -- logo for dark backgrounds
  logo_image_mobile        text,                      -- compact mark for mobile
  logo_image_footer        text,                      -- footer-specific image (optional)

  transparent_bg_expected  boolean NOT NULL DEFAULT true,
    -- when true, dark logo variant auto-selected on transparent nav

  -- ── Logo Sizing — Header ─────────────────────────────────────────────────
  header_logo_size         text    DEFAULT 'medium',  -- 'small' | 'medium' | 'large' | 'custom'
  header_logo_width_desktop int    DEFAULT 180,       -- px (custom mode)
  header_logo_width_mobile  int    DEFAULT 120,       -- px
  header_logo_rendering    text    DEFAULT 'contain',
    -- 'contain' | 'cover' | 'original' | 'fixed-height' | 'fixed-width'

  -- ── Logo Sizing — Footer ─────────────────────────────────────────────────
  footer_logo_size         text    DEFAULT 'medium',
  footer_logo_width_desktop int   DEFAULT 160,
  footer_logo_width_mobile  int   DEFAULT 110,

  -- ── Alignment ───────────────────────────────────────────────────────────
  logo_align_header        text    DEFAULT 'left',    -- 'left' | 'center' | 'right'
  menu_align_header        text    DEFAULT 'right',   -- 'left' | 'center' | 'right' | 'split'

  -- ── Header Layout Presets ────────────────────────────────────────────────
  header_layout            text    NOT NULL DEFAULT 'logo-left',
    -- 'logo-left'              : logo left, menu right (standard)
    -- 'logo-center-stacked'    : logo centered on top row, menu below
    -- 'logo-above-centered'    : logo + menu stacked, both centered (editorial)
    -- 'split-center-logo'      : menu split left+right, logo dead center
    -- 'logo-left-center-menu'  : logo left, links centered

  show_logo_in_header      boolean NOT NULL DEFAULT true,

  -- ── Footer Layout ────────────────────────────────────────────────────────
  footer_layout            text    DEFAULT 'logo-left-columns',
    -- 'logo-left-columns'      : logo left, nav columns right (standard)
    -- 'logo-center-above-links': centered logo above nav links
    -- 'logo-center-newsletter' : centered logo above newsletter strip
    -- 'minimal-center'         : minimal centered brand only

  show_logo_in_footer      boolean NOT NULL DEFAULT true,
  use_same_logo_everywhere boolean NOT NULL DEFAULT true,
    -- false = allow separate footer logo asset

  updated_at               timestamptz DEFAULT now()
);

-- Default row
INSERT INTO public.site_branding (id)
VALUES ('main')
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE public.site_branding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_branding_anon_select" ON public.site_branding;
CREATE POLICY "site_branding_anon_select" ON public.site_branding
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "site_branding_admin_write" ON public.site_branding;
CREATE POLICY "site_branding_admin_write" ON public.site_branding
  FOR ALL TO anon USING (true) WITH CHECK (true);
