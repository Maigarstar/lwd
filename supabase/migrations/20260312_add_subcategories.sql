-- ============================================================
-- Add Subcategory Support to Magazine Categories
-- 20260312_add_subcategories.sql
--
-- Adds parent_category_slug field to support hierarchical
-- category structure (parent → child relationships)
-- ============================================================

-- Add parent_category_slug column to magazine_categories
ALTER TABLE magazine_categories
ADD COLUMN parent_category_slug TEXT REFERENCES magazine_categories(slug) ON DELETE SET NULL;

-- Create index for parent lookups
CREATE INDEX IF NOT EXISTS magazine_categories_parent_idx
ON magazine_categories(parent_category_slug);

-- Comment for documentation
COMMENT ON COLUMN magazine_categories.parent_category_slug IS
'Optional slug of parent category. NULL for root/top-level categories. Allows hierarchical organization.';
