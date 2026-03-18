/**
 * MagazineHomePage, Thin orchestrator for the magazine homepage.
 *
 * Responsibilities:
 *   1. Fetch article data (DB or static fallback)
 *   2. Derive post collections (featured, trending, latest, by-category)
 *   3. Resolve cover story (from homepage config or first featured)
 *   4. Select the active layout component (editorial | grid | immersive | curated)
 *   5. Render shared chrome: MagazineNav, NewsletterCapture, SiteFooter
 *
 * All section-level UI lives in the layout components under ./layouts/.
 */
import { useState, useEffect } from 'react';
import { POSTS, getFeaturedPosts, getTrendingPosts, getLatestPosts, getPostsByCategory } from './data/posts';
import { fetchPosts, fetchHomepageConfig } from '../../services/magazineService';
import MagazineNav from './components/MagazineNav';
import NewsletterCapture from './components/NewsletterCapture';
import { useIsMobile } from '../../components/profile/ProfileDesignSystem';
import { getMagTheme } from './magazineTheme';

// ── Layout components ─────────────────────────────────────────────────────────
import LayoutEditorial from './layouts/LayoutEditorial';
import LayoutGrid from './layouts/LayoutGrid';
import LayoutImmersive from './layouts/LayoutImmersive';
import LayoutCurated from './layouts/LayoutCurated';

const LAYOUTS = {
  editorial: LayoutEditorial,
  grid: LayoutGrid,
  immersive: LayoutImmersive,
  curated: LayoutCurated,
};

const DEFAULT_LAYOUT = 'curated';

export default function MagazineHomePage({
  onNavigateArticle,
  onNavigateCategory,
  layoutStyle = DEFAULT_LAYOUT,
  isLight = false,
  onToggleLight,
  footerNav = {},
}) {
  const [dbPosts, setDbPosts] = useState([]);
  const [hpConfig, setHpConfig] = useState(null);
  const isMobile = useIsMobile(768);

  // ── Data fetching ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchPosts({ published: true }).then(({ data }) => {
      if (data && data.length > 0) setDbPosts(data);
    });
    fetchHomepageConfig().then(({ data }) => {
      if (data && data.length > 0) setHpConfig(data);
    });
  }, []);

  // ── Derive post collections ───────────────────────────────────────────────
  const usingDb = dbPosts.length > 0;
  const byCat = (slug) => dbPosts.filter(p => p.categorySlug === slug);

  const featured     = usingDb ? dbPosts.filter(p => p.featured).slice(0, 5)        : getFeaturedPosts(5);
  const trending     = usingDb ? dbPosts.filter(p => p.trending).slice(0, 5)        : getTrendingPosts(5);
  const latest       = usingDb ? dbPosts.slice(0, 6)                                : getLatestPosts(6);
  const destinations = usingDb ? byCat('destinations').slice(0, 3)                  : getPostsByCategory('destinations').slice(0, 3);
  const realWeddings = usingDb ? byCat('real-weddings').slice(0, 3)                 : getPostsByCategory('real-weddings').slice(0, 3);
  const honeymoons   = usingDb ? byCat('honeymoons').slice(0, 3)                    : getPostsByCategory('honeymoons').slice(0, 3);
  const fashion      = usingDb ? byCat('fashion').slice(0, 3)                       : getPostsByCategory('fashion').slice(0, 3);

  // ── Cover story system ────────────────────────────────────────────────────
  // Homepage config can designate a specific cover story by slug.
  // If set, that story replaces featured[0] (the hero position).
  const hpSection = id => hpConfig?.find(s => s.id === id);
  const coverStorySlug = hpSection('cover')?.config?.slug;

  let resolvedFeatured = [...featured];
  if (coverStorySlug) {
    const allPosts = usingDb ? dbPosts : POSTS;
    const coverPost = allPosts.find(p => p.slug === coverStorySlug);
    if (coverPost) {
      // Put cover story first, remove duplicate if it already appears
      resolvedFeatured = [coverPost, ...featured.filter(p => p.slug !== coverStorySlug)].slice(0, 5);
    }
  }

  // ── Layout selection ──────────────────────────────────────────────────────
  // URL param override for preview/testing: #/magazine?layout=editorial
  const urlLayout = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.hash.split('?')[1] || '').get('layout')
    : null;
  const resolvedLayoutStyle = urlLayout || hpSection('layout')?.config?.style || layoutStyle;
  const LayoutComponent = LAYOUTS[resolvedLayoutStyle] || LayoutCurated;

  // ── Navigation callbacks ──────────────────────────────────────────────────
  const goArticle = post => onNavigateArticle && onNavigateArticle(post.slug);
  const goCategory = id => onNavigateCategory && onNavigateCategory(id);

  // ── Theme ─────────────────────────────────────────────────────────────────
  const T = getMagTheme(isLight);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', transition: 'background 0.35s' }}>
      {/* ── Shared chrome: Navigation ──────────────────────────────── */}
      <MagazineNav
        activeCategoryId={null}
        onNavigateHome={() => {}}
        onNavigateCategory={goCategory}
        onNavigateArticle={goArticle}
        isLight={isLight}
        onToggleLight={onToggleLight}
      />

      {/* ── Active layout ──────────────────────────────────────────── */}
      <LayoutComponent
        featured={resolvedFeatured}
        trending={trending}
        latest={latest}
        destinations={destinations}
        realWeddings={realWeddings}
        honeymoons={honeymoons}
        fashion={fashion}
        goArticle={goArticle}
        goCategory={goCategory}
        isLight={isLight}
        isMobile={isMobile}
      />

      {/* ── Shared chrome: Newsletter + Footer ─────────────────────── */}
      <NewsletterCapture isLight={isLight} />
    </div>
  );
}
