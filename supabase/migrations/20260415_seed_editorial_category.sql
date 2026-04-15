-- ============================================================
-- Seed "Editorial" Magazine Category
-- 20260415_seed_editorial_category.sql
--
-- Adds "Editorial" as the default WordPress-style fallback
-- category for the Magazine Studio. Every new article created
-- without a category selected silently falls back to this row,
-- and handleSavePost reapplies it on save if the user clears
-- the field. This row MUST exist — without it, the FK constraint
-- magazine_posts_category_slug_fkey rejects new article inserts
-- made with category_slug='editorial'.
--
-- Safe to run multiple times. ON CONFLICT (slug) DO NOTHING means
-- the row is only inserted if it isn't already there.
-- ============================================================

INSERT INTO magazine_categories (slug, name, description, hero_image, accent_color, card_style)
VALUES
  (
    'editorial',
    'Editorial',
    'Longform features, opinion, and the editorial voice of Luxury Wedding Directory.',
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=85',
    '#c9a96e',
    'editorial'
  )
ON CONFLICT (slug) DO NOTHING;
