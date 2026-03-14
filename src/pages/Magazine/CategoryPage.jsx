/**
 * CategoryPage, Editorial Category Page Orchestrator
 *
 * The category-level equivalent of MagazineHomePage.
 * Six swappable editorial layouts, a cover story system,
 * subcategory pills, sort control, and a layout switcher.
 *
 * Layouts:
 *   1. Curated      , split-screen hero + editorial well
 *   2. Editorial    , full-screen hero + story river
 *   3. Grid         , magazine grid hero + overlay cards
 *   4. Immersive    , carousel + cinematic blocks
 *   5. Portrait     , portrait hero (fashion / trends)
 *   6. Dual Feature , side-by-side hero (travel / weddings)
 */
import { useState, useEffect, useMemo } from 'react';
import { getPostsByCategory } from './data/posts';
import { getCategoryById, CATEGORIES } from './data/categories';
import { fetchPosts, fetchCategories } from '../../services/magazineService';
import MagazineNav from './components/MagazineNav';
import NewsletterCapture from './components/NewsletterCapture';
import SiteFooter from '../../components/sections/SiteFooter';
import { getMagTheme, FD, FU, GOLD_CONST as GOLD } from './magazineTheme';

import CategoryLayoutCurated    from './categoryLayouts/CategoryLayoutCurated';
import CategoryLayoutEditorial  from './categoryLayouts/CategoryLayoutEditorial';
import CategoryLayoutGrid       from './categoryLayouts/CategoryLayoutGrid';
import CategoryLayoutImmersive  from './categoryLayouts/CategoryLayoutImmersive';
import CategoryLayoutPortrait   from './categoryLayouts/CategoryLayoutPortrait';
import CategoryLayoutDualFeature from './categoryLayouts/CategoryLayoutDualFeature';

/* ── Layout registry ─────────────────────────────────────────────────────── */
const LAYOUTS = {
  curated:       { label: 'Curated',      icon: '⊞', Component: CategoryLayoutCurated },
  editorial:     { label: 'Editorial',    icon: '▤', Component: CategoryLayoutEditorial },
  grid:          { label: 'Grid',         icon: '⊟', Component: CategoryLayoutGrid },
  immersive:     { label: 'Immersive',    icon: '◉', Component: CategoryLayoutImmersive },
  portrait:      { label: 'Portrait',     icon: '▯', Component: CategoryLayoutPortrait },
  'dual-feature':{ label: 'Dual Feature', icon: '◧', Component: CategoryLayoutDualFeature },
};

/* ── Default layout per category ─────────────────────────────────────────── */
const CATEGORY_DEFAULT_LAYOUT = {
  'destinations':   'curated',
  'venues':         'editorial',
  'fashion':        'portrait',
  'real-weddings':  'dual-feature',
  'planning':       'editorial',
  'honeymoons':     'dual-feature',
  'trends':         'portrait',
  'news':           'editorial',
  'travel':         'dual-feature',
  'home-living':    'curated',
};

/* ── Subcategory pills per category ──────────────────────────────────────── */
const SUBCATEGORY_MAP = {
  'destinations':  ['Europe', 'Asia', 'Caribbean', 'Americas', 'Africa', 'Middle East', 'Pacific'],
  'venues':        ['Châteaux', 'Villas', 'Hotels', 'Estates', 'Gardens', 'Beach', 'City'],
  'fashion':       ['Bridal Gowns', 'Accessories', 'Shoes', 'Beauty', 'Guest Dresses', 'Menswear'],
  'real-weddings': ['Intimate', 'Grand', 'Destination', 'Cultural', 'Elopements'],
  'planning':      ['Budgets', 'Timelines', 'Etiquette', 'Traditions', 'Registry'],
  'honeymoons':    ['Beach', 'City Break', 'Safari', 'Mountains', 'Island', 'Road Trip'],
  'trends':        ['2026 Trends', 'Decor', 'Colour', 'Florals', 'Tablescapes'],
  'news':          ['Industry', 'Awards', 'Launches', 'Events'],
  'travel':        ['Luxury Hotels', 'Retreats', 'Adventure', 'Wellness', 'City Guides', 'Flight'],
  'home-living':   ['Interior Design', 'Tablescaping', 'Entertaining', 'Garden', 'Art & Objects', 'Renovation'],
};

const SORT_OPTIONS = [
  { value: 'latest',  label: 'Latest' },
  { value: 'popular', label: 'Most Read' },
  { value: 'az',      label: 'A–Z' },
];

/* ── Main orchestrator ───────────────────────────────────────────────────── */
export default function CategoryPage({
  categoryId,
  onNavigateArticle,
  onNavigateHome,
  onNavigateCategory,
  isLight = false,
  onToggleLight,
  footerNav = {},
}) {
  const [layoutKey, setLayoutKey]       = useState(CATEGORY_DEFAULT_LAYOUT[categoryId] || 'curated');
  const [sort, setSort]                 = useState('latest');
  const [activeSubcat, setActiveSubcat] = useState(null);
  const [dbPosts, setDbPosts]           = useState([]);
  const [dbCategory, setDbCategory]     = useState(null);

  // Reset state when category changes
  useEffect(() => {
    setLayoutKey(CATEGORY_DEFAULT_LAYOUT[categoryId] || 'curated');
    setSort('latest');
    setActiveSubcat(null);
    setDbPosts([]);
    setDbCategory(null);

    fetchPosts({ published: true, category_slug: categoryId }).then(({ data }) => {
      if (data?.length > 0) setDbPosts(data);
    }).catch(() => {});

    fetchCategories().then(({ data }) => {
      if (data) {
        const found = data.find(c => c.slug === categoryId);
        if (found) setDbCategory(found);
      }
    }).catch(() => {});
  }, [categoryId]);

  // When DB category loads, apply its saved defaultLayout (only if user hasn't manually switched)
  useEffect(() => {
    if (dbCategory?.defaultLayout && LAYOUTS[dbCategory.defaultLayout]) {
      setLayoutKey(dbCategory.defaultLayout);
    }
  }, [dbCategory]);

  // Resolve category
  const staticCategory = getCategoryById(categoryId);
  const category = dbCategory
    ? { ...staticCategory, ...dbCategory, id: categoryId }
    : staticCategory;

  // SEO
  useEffect(() => {
    if (!category) return;
    const prev = document.title;
    document.title = `${category.seoTitle || category.label || categoryId} | LDW Magazine`;
    const setMeta = (sel, content) => {
      if (!content) return;
      let el = document.querySelector(sel);
      if (!el) { el = document.createElement('meta'); document.head.appendChild(el); }
      const attr = sel.includes('[name') ? 'name' : 'property';
      const key  = sel.match(/["']([^"']+)['"]/)?.[1];
      if (key) el.setAttribute(attr, key);
      el.setAttribute('content', content);
    };
    setMeta('[name="description"]',       category.seoDescription || category.description || '');
    setMeta('[property="og:title"]',       category.seoTitle || category.label || '');
    setMeta('[property="og:description"]', category.seoDescription || category.description || '');
    setMeta('[property="og:image"]',       category.heroImage || '');
    setMeta('[property="og:type"]',        'website');
    return () => { document.title = prev; };
  }, [category]);

  // Merge DB + static posts, sort
  const allPosts = dbPosts.length > 0 ? dbPosts : getPostsByCategory(categoryId);

  const sortedPosts = useMemo(() => [...allPosts].sort((a, b) => {
    if (sort === 'az') return a.title.localeCompare(b.title);
    if (sort === 'popular') return (b.trending ? 1 : 0) - (a.trending ? 1 : 0);
    return new Date(b.date || b.publishedAt) - new Date(a.date || a.publishedAt);
  }), [allPosts, sort]);

  const T = getMagTheme(isLight);

  if (!category) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: FU, color: T.muted, fontSize: 14 }}>Category not found.</p>
      </div>
    );
  }

  // subcategories: DB-saved list wins, else static map fallback
  const subcats = (category?.subcategories?.length > 0)
    ? category.subcategories
    : SUBCATEGORY_MAP[categoryId] || [];

  const layoutEntry = LAYOUTS[layoutKey] || LAYOUTS.curated;
  const { Component: LayoutComponent } = layoutEntry;

  const goArticle = (postOrSlug) => {
    const slug = typeof postOrSlug === 'string' ? postOrSlug : postOrSlug?.slug;
    if (slug) onNavigateArticle && onNavigateArticle(slug);
  };

  // Cover post: DB-saved coverSlug wins, else first sorted post
  const coverPost = useMemo(() => {
    if (category?.coverSlug) {
      return sortedPosts.find(p => p.slug === category.coverSlug) || sortedPosts[0] || null;
    }
    return sortedPosts[0] || null;
  }, [category?.coverSlug, sortedPosts]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', transition: 'background 0.35s' }}>

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <MagazineNav
        activeCategoryId={categoryId}
        onNavigateHome={onNavigateHome}
        onNavigateCategory={onNavigateCategory}
        onNavigateArticle={goArticle}
        isLight={isLight}
        onToggleLight={onToggleLight}
      />

      {/* ── Subcategory pills + controls bar ──────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: isLight ? 'rgba(250,250,248,0.97)' : 'rgba(10,10,10,0.97)',
        borderBottom: `1px solid ${T.border}`,
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{
          maxWidth: 1440,
          margin: '0 auto',
          padding: '0 clamp(24px, 5vw, 80px)',
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}>
          {/* Subcategory pills */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flex: 1, padding: '12px 0', overflowX: 'auto', scrollbarWidth: 'none' }}>
            <button
              onClick={() => setActiveSubcat(null)}
              style={pillStyle(!activeSubcat, T, isLight)}
            >
              All
            </button>
            {subcats.map(sub => (
              <button
                key={sub}
                onClick={() => setActiveSubcat(activeSubcat === sub ? null : sub)}
                style={pillStyle(activeSubcat === sub, T, isLight)}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: T.border, flexShrink: 0, margin: '0 16px' }} />

          {/* Sort control */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
            {SORT_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setSort(opt.value)} style={{
                fontFamily: FU, fontSize: 9, fontWeight: sort === opt.value ? 700 : 400,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: sort === opt.value ? GOLD : T.subtle,
                background: 'transparent', border: 'none',
                padding: '4px 8px', cursor: 'pointer',
                transition: 'color 0.15s',
              }}>
                {opt.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: T.border, flexShrink: 0, margin: '0 16px' }} />

          {/* Layout switcher */}
          <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexShrink: 0 }}>
            {Object.entries(LAYOUTS).map(([key, { label, icon }]) => {
              const active = layoutKey === key;
              return (
                <button
                  key={key}
                  title={label}
                  onClick={() => setLayoutKey(key)}
                  style={{
                    fontFamily: FU,
                    fontSize: 13,
                    lineHeight: 1,
                    color: active ? GOLD : T.subtle,
                    background: active ? `${GOLD}14` : 'transparent',
                    border: `1px solid ${active ? `${GOLD}50` : 'transparent'}`,
                    width: 28, height: 28,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 3, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = T.text; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = T.subtle; }}
                >
                  {icon}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: T.border, flexShrink: 0, margin: '0 12px' }} />

          {/* Edit in Studio */}
          <button
            title={`Edit ${category.label} in Magazine Studio`}
            onClick={() => {
              try {
                sessionStorage.setItem('magazineStudio_nav', JSON.stringify({ mode: 'category', editingId: null }));
                sessionStorage.setItem('magazineStudio_categoryId', categoryId);
              } catch {}
              window.history.pushState(null, '', '/magazine-studio');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            style={{
              fontFamily: FU, fontSize: 9, fontWeight: 600,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: T.subtle, background: 'transparent',
              border: `1px solid ${T.border}`,
              padding: '4px 10px', borderRadius: 2,
              cursor: 'pointer', transition: 'all 0.15s',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = GOLD; e.currentTarget.style.borderColor = `${GOLD}60`; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.subtle; e.currentTarget.style.borderColor = T.border; }}
          >
            ✎ Edit
          </button>
        </div>
      </div>

      {/* ── Active layout ─────────────────────────────────────────────────── */}
      <LayoutComponent
        category={category}
        posts={sortedPosts}
        coverPost={coverPost}
        onRead={goArticle}
        onNavigateCategory={onNavigateCategory}
        isLight={isLight}
      />

      {/* ── Newsletter + Footer ───────────────────────────────────────────── */}
      <NewsletterCapture isLight={isLight} />
      <SiteFooter {...footerNav} />
    </div>
  );
}

/* ── Pill button style helper ─────────────────────────────────────────────── */
function pillStyle(active, T, isLight) {
  return {
    fontFamily: FU,
    fontSize: 9,
    fontWeight: active ? 700 : 400,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: active ? GOLD : T.subtle,
    background: active ? `${GOLD}12` : 'transparent',
    border: `1px solid ${active ? `${GOLD}60` : T.border}`,
    padding: '5px 12px',
    borderRadius: 20,
    cursor: 'pointer',
    transition: 'all 0.18s',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  };
}
