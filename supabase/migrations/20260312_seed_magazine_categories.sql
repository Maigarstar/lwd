-- ============================================================
-- Seed Magazine Categories
-- 20260312_seed_magazine_categories.sql
--
-- Populates magazine_categories with the 8 default categories
-- ============================================================

-- Insert the 8 categories (only if they don't already exist)
INSERT INTO magazine_categories (slug, name, description, hero_image, accent_color, card_style)
VALUES
  ('destinations', 'Destinations', 'The world''s most extraordinary wedding locations — from Amalfi clifftops to Scottish estates.', 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1920&q=85', '#7ba7bc', 'overlay'),
  ('venues', 'Venues', 'Palaces, châteaux, villas, and estates. The finest wedding venues on earth.', 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?auto=format&fit=crop&w=1920&q=85', '#b8a9c9', 'standard'),
  ('fashion', 'Fashion & Beauty', 'Bridal couture, beauty rituals, and the designers shaping the future of the modern wedding.', 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=1920&q=85', '#d4a5a5', 'editorial'),
  ('real-weddings', 'Real Weddings', 'Extraordinary love stories told through the world''s most beautiful wedding photography.', 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=85', '#c9a96e', 'overlay'),
  ('planning', 'Planning', 'Expert advice, insider guides, and the knowledge to plan an extraordinary celebration.', 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1920&q=85', '#a0b4a0', 'horizontal'),
  ('honeymoons', 'Honeymoons', 'Private islands, mountain retreats, and city suites. The first chapter of your married life.', 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1920&q=85', '#7ba7bc', 'overlay'),
  ('trends', 'Trends', 'The ideas, aesthetics, and movements defining how the world''s most discerning couples celebrate.', 'https://images.unsplash.com/photo-1529543544282-ea669407fca3?auto=format&fit=crop&w=1920&q=85', '#c9a96e', 'standard'),
  ('news', 'News', 'Industry news, award announcements, and the stories shaping luxury weddings worldwide.', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=85', '#a8a8a8', 'horizontal')
ON CONFLICT (slug) DO NOTHING;
