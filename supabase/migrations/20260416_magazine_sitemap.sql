-- ─────────────────────────────────────────────────────────────────────────────
-- 20260416_magazine_sitemap.sql
-- Published magazine issues view for sitemap, RSS, and discovery indexing.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW magazine_issues_published AS
  SELECT
    id,
    slug,
    title,
    issue_number,
    season,
    year,
    cover_image,
    og_image_url,
    seo_title,
    seo_description,
    published_at,
    updated_at,
    page_count
  FROM magazine_issues
  WHERE status = 'published'
  ORDER BY published_at DESC;

COMMENT ON VIEW magazine_issues_published IS
  'Published magazine issues for sitemap, RSS, and discovery indexing. '
  'Issues are live at /publications/[slug].';
