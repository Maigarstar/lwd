import { useState, useEffect, useMemo } from 'react';
import { getPostsByCategory, POSTS } from './data/posts';
import { getCategoryById, CATEGORIES } from './data/categories';
import { fetchPosts, fetchCategories } from '../../services/magazineService';
import { HeroEditorial, HeroDualFeature, HeroPortrait } from './components/HeroModules';
import PostCard from './components/PostCards';
import MagazineNav from './components/MagazineNav';
import NewsletterCapture from './components/NewsletterCapture';
import SiteFooter from '../../components/sections/SiteFooter';

const FD = "'Gilda Display', 'Playfair Display', Georgia, serif";
const FU = "'Nunito', 'Inter', 'Helvetica Neue', sans-serif";
const GOLD = '#c9a96e';
const CREAM = '#f5f0e8';

const SORT_OPTIONS = [
  { value: 'latest',  label: 'Latest' },
  { value: 'popular', label: 'Most Read' },
  { value: 'az',      label: 'A–Z' },
];

// Category-specific hero style mapping — editorial layouts per category
const CATEGORY_HERO_MAP = {
  'destinations':   'editorial',
  'venues':         'editorial',
  'fashion':        'portrait',
  'real-weddings':  'dual-feature',
  'planning':       'editorial',
  'honeymoons':     'dual-feature',
  'trends':         'portrait',
  'news':           'editorial',
  'travel':         'dual-feature',
  'home-living':    'portrait',
};

// Subcategory pills per category — contextual navigation
const SUBCATEGORY_MAP = {
  'destinations': ['Europe', 'Asia', 'Caribbean', 'Americas', 'Africa', 'Middle East', 'Pacific'],
  'venues':       ['Châteaux', 'Villas', 'Hotels', 'Estates', 'Gardens', 'Beach', 'City'],
  'fashion':      ['Bridal Gowns', 'Accessories', 'Shoes', 'Beauty', 'Guest Dresses', 'Menswear'],
  'real-weddings': ['Intimate', 'Grand', 'Destination', 'Cultural', 'Elopements'],
  'planning':     ['Budgets', 'Timelines', 'Etiquette', 'Traditions', 'Registry'],
  'honeymoons':   ['Beach', 'City Break', 'Safari', 'Mountains', 'Island', 'Road Trip'],
  'trends':       ['2026 Trends', 'Decor', 'Colour', 'Florals', 'Tablescapes'],
  'news':         ['Industry', 'Awards', 'Launches', 'Events'],
  'travel':       ['Luxury Hotels', 'Retreats', 'Adventure', 'Wellness', 'City Guides', 'Flight'],
  'home-living':  ['Interior Design', 'Tablescaping', 'Entertaining', 'Garden', 'Art & Objects', 'Renovation'],
};

export default function MagazineCategoryPage({ categoryId, onNavigateArticle, onNavigateHome, onNavigateCategory, isLight = false, onToggleLight, footerNav = {} }) {
  const [sort, setSort] = useState('latest');
  const [activeSubcat, setActiveSubcat] = useState(null);
  const [dbPosts, setDbPosts] = useState([]);
  const [dbCategory, setDbCategory] = useState(null);

  useEffect(() => {
    fetchPosts({ published: true, category_slug: categoryId }).then(({ data }) => {
      if (data && data.length > 0) setDbPosts(data);
    });
    fetchCategories().then(({ data }) => {
      if (data) {
        const found = data.find(c => c.slug === categoryId);
        if (found) setDbCategory(found);
      }
    });
    setActiveSubcat(null);
    setSort('latest');
  }, [categoryId]);

  // SEO head injection
  const usingDb = dbPosts.length > 0;
  const staticCategory = getCategoryById(categoryId);
  const category = dbCategory ? { ...staticCategory, ...dbCategory, id: categoryId } : staticCategory;

  useEffect(() => {
    if (!category) return;
    const prevTitle = document.title;
    document.title = `${category.seoTitle || category.label || category.name || category.id} | LDW Magazine`;
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
    setMeta('[property="og:title"]',       category.seoTitle || category.label || category.name || '');
    setMeta('[property="og:description"]', category.seoDescription || category.description || '');
    setMeta('[property="og:image"]',       category.heroImage || '');
    setMeta('[property="og:type"]',        'website');
    return () => { document.title = prevTitle; };
  }, [category]);

  const allPosts = usingDb ? dbPosts : getPostsByCategory(categoryId);

  const sorted = useMemo(() => [...allPosts].sort((a, b) => {
    if (sort === 'az') return a.title.localeCompare(b.title);
    if (sort === 'popular') return (b.trending ? 1 : 0) - (a.trending ? 1 : 0);
    return new Date(b.date || b.publishedAt) - new Date(a.date || a.publishedAt);
  }), [allPosts, sort]);

  const [featured, ...rest] = sorted;
  const goArticle = post => onNavigateArticle && onNavigateArticle(post.slug);

  // Related categories — 3 neighbours in the CATEGORIES array
  const relatedCategories = useMemo(() => {
    const idx = CATEGORIES.findIndex(c => c.id === categoryId);
    if (idx === -1) return CATEGORIES.slice(0, 3);
    return CATEGORIES.filter(c => c.id !== categoryId).slice(0, 4);
  }, [categoryId]);

  // Theme tokens
  const BG      = isLight ? '#fafaf8' : '#0a0a0a';
  const TEXT     = isLight ? '#1a1806' : CREAM;
  const MUTED    = isLight ? 'rgba(30,28,22,0.5)' : 'rgba(245,240,232,0.5)';
  const SORT_OFF = isLight ? 'rgba(30,28,22,0.4)' : 'rgba(245,240,232,0.4)';
  const SORT_BRD = isLight ? 'rgba(30,28,22,0.12)' : 'rgba(245,240,232,0.12)';
  const INTRO_BRD = isLight ? 'rgba(30,28,22,0.1)' : 'rgba(201,169,110,0.1)';
  const LABEL_C  = isLight ? 'rgba(30,28,22,0.35)' : 'rgba(245,240,232,0.35)';
  const CARD_BG  = isLight ? '#fff' : '#0d0d0b';
  const HOVER_BG = isLight ? 'rgba(30,28,22,0.03)' : 'rgba(245,240,232,0.03)';

  if (!category) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: FU, color: MUTED, fontSize: 14 }}>Category not found.</p>
    </div>
  );

  const cardStyle = category.defaultCardStyle || 'standard';
  const heroStyle = CATEGORY_HERO_MAP[categoryId] || 'editorial';
  const subcats = SUBCATEGORY_MAP[categoryId] || [];

  // Pick hero component based on category
  const renderHero = () => {
    if (!featured) {
      return (
        <div style={{
          position: 'relative', height: 'clamp(280px, 40svh, 420px)',
          backgroundImage: `url(${category.heroImage})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          display: 'flex', alignItems: 'flex-end',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 70%)' }} />
          <div style={{ position: 'relative', padding: 'clamp(32px, 5vw, 60px) clamp(24px, 6vw, 80px)' }}>
            <span style={{ fontFamily: FU, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, display: 'block', marginBottom: 12 }}>
              Luxury Wedding Directory
            </span>
            <h1 style={{ fontFamily: FD, fontSize: 'clamp(34px, 6vw, 72px)', fontWeight: 400, color: CREAM, margin: 0 }}>
              {category.label}
            </h1>
          </div>
        </div>
      );
    }

    switch (heroStyle) {
      case 'portrait':
        return <HeroPortrait posts={sorted.slice(0, 5)} onRead={goArticle} />;
      case 'dual-feature':
        return <HeroDualFeature posts={sorted.slice(0, 2)} onRead={goArticle} />;
      default:
        return (
          <HeroEditorial
            post={{ ...featured, title: category.label, excerpt: category.description, coverImage: category.heroImage }}
            onRead={() => {}}
            minHeight="clamp(360px, 55svh, 560px)"
            textAlign="left"
          />
        );
    }
  };

  // For portrait / dual-feature heroes, the top posts are consumed by the hero
  const heroConsumed = heroStyle === 'portrait' ? 5 : heroStyle === 'dual-feature' ? 2 : 0;
  const gridPosts = heroConsumed > 0 ? sorted.slice(heroConsumed) : rest;

  return (
    <div style={{ background: BG, minHeight: '100vh', transition: 'background 0.35s' }}>
      <MagazineNav
        activeCategoryId={categoryId}
        onNavigateHome={onNavigateHome}
        onNavigateCategory={onNavigateCategory}
        onNavigateArticle={goArticle}
        isLight={isLight}
        onToggleLight={onToggleLight}
      />

      {/* Category hero — variant per category */}
      {renderHero()}

      {/* Subcategory pills strip */}
      {subcats.length > 0 && (
        <div style={{
          padding: '0 clamp(24px, 5vw, 80px)',
          borderBottom: `1px solid ${INTRO_BRD}`,
          background: BG,
        }}>
          <div style={{
            maxWidth: 1280, margin: '0 auto',
            display: 'flex', gap: 6, alignItems: 'center',
            overflowX: 'auto', padding: '16px 0',
            scrollbarWidth: 'none',
          }}>
            <button
              onClick={() => setActiveSubcat(null)}
              style={{
                fontFamily: FU, fontSize: 10, fontWeight: !activeSubcat ? 700 : 400,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: !activeSubcat ? GOLD : SORT_OFF,
                background: !activeSubcat ? `${GOLD}12` : 'transparent',
                border: `1px solid ${!activeSubcat ? GOLD : SORT_BRD}`,
                padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
                transition: 'all 0.18s', whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              All
            </button>
            {subcats.map(sub => {
              const active = activeSubcat === sub;
              return (
                <button
                  key={sub}
                  onClick={() => setActiveSubcat(active ? null : sub)}
                  style={{
                    fontFamily: FU, fontSize: 10, fontWeight: active ? 700 : 400,
                    letterSpacing: '0.08em',
                    color: active ? GOLD : SORT_OFF,
                    background: active ? `${GOLD}12` : 'transparent',
                    border: `1px solid ${active ? GOLD : SORT_BRD}`,
                    padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
                    transition: 'all 0.18s', whiteSpace: 'nowrap', flexShrink: 0,
                  }}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Category intro + sort control */}
      <div style={{ padding: 'clamp(32px, 4vw, 52px) clamp(24px, 5vw, 80px)', background: BG, borderBottom: `1px solid ${INTRO_BRD}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ maxWidth: 600 }}>
            <h2 style={{ fontFamily: FD, fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 400, color: TEXT, margin: '0 0 10px' }}>
              {category.label}
            </h2>
            <p style={{ fontFamily: FU, fontSize: 14, fontWeight: 300, color: MUTED, margin: 0, lineHeight: 1.65 }}>
              {category.description}
            </p>
          </div>

          {/* Sort control */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontFamily: FU, fontSize: 10, color: LABEL_C, letterSpacing: '0.1em', marginRight: 8, textTransform: 'uppercase' }}>
              Sort:
            </span>
            {SORT_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setSort(opt.value)} style={{
                fontFamily: FU, fontSize: 10, fontWeight: sort === opt.value ? 700 : 400,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: sort === opt.value ? GOLD : SORT_OFF,
                background: sort === opt.value ? `${GOLD}12` : 'transparent',
                border: `1px solid ${sort === opt.value ? GOLD : SORT_BRD}`,
                padding: '5px 12px', borderRadius: 2, cursor: 'pointer',
                transition: 'all 0.18s',
              }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Post grid */}
      <section style={{ padding: 'clamp(48px, 7vw, 88px) clamp(24px, 5vw, 80px)', maxWidth: 1280, margin: '0 auto' }}>
        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: FU, fontSize: 13, color: MUTED }}>
            No stories in this category yet.
          </div>
        ) : (
          <>
            {/* Lead story — only for editorial hero (portrait/dual already show it) */}
            {heroConsumed === 0 && featured && (
              <div style={{ marginBottom: 'clamp(40px, 5vw, 64px)' }}>
                <LeadStory post={featured} onClick={goArticle} isLight={isLight} />
              </div>
            )}

            {gridPosts.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'clamp(32px, 4vw, 52px)' }}>
                {gridPosts.map(post => (
                  <PostCard key={post.id} post={post} style={cardStyle} onClick={goArticle} light={isLight} />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Related categories */}
      <section style={{
        padding: 'clamp(48px, 6vw, 72px) clamp(24px, 5vw, 80px)',
        borderTop: `1px solid ${INTRO_BRD}`,
        background: BG,
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <div style={{ width: 20, height: 1, background: GOLD }} />
            <span style={{
              fontFamily: FU, fontSize: 9, fontWeight: 700,
              letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD,
            }}>
              Explore More
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {relatedCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => onNavigateCategory && onNavigateCategory(cat.id)}
                style={{
                  position: 'relative', overflow: 'hidden',
                  height: 160, borderRadius: 3,
                  background: CARD_BG, border: `1px solid ${INTRO_BRD}`,
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = `${GOLD}50`}
                onMouseLeave={e => e.currentTarget.style.borderColor = INTRO_BRD}
              >
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: `url(${cat.heroImage})`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  opacity: 0.35, transition: 'opacity 0.3s',
                }} />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: isLight
                    ? 'linear-gradient(to top, rgba(250,250,248,0.95) 20%, rgba(250,250,248,0.6) 100%)'
                    : 'linear-gradient(to top, rgba(10,10,10,0.95) 20%, rgba(10,10,10,0.6) 100%)',
                }} />
                <div style={{ position: 'relative', padding: 20, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <span style={{
                    fontFamily: FU, fontSize: 8, fontWeight: 700,
                    letterSpacing: '0.2em', textTransform: 'uppercase',
                    color: cat.accentColor || GOLD, marginBottom: 6,
                  }}>
                    {cat.label}
                  </span>
                  <p style={{
                    fontFamily: FU, fontSize: 11, fontWeight: 300,
                    color: MUTED, margin: 0, lineHeight: 1.5,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {cat.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <NewsletterCapture isLight={isLight} />
      <SiteFooter {...footerNav} />
    </div>
  );
}

// Full-width lead story card
function LeadStory({ post, onClick, isLight = false }) {
  const BG   = isLight ? '#fff' : '#0d0d0b';
  const TEXT  = isLight ? '#1a1806' : CREAM;
  const MUTED = isLight ? 'rgba(30,28,22,0.55)' : 'rgba(245,240,232,0.55)';
  const META  = isLight ? 'rgba(30,28,22,0.35)' : 'rgba(245,240,232,0.35)';
  const BORDER = isLight ? 'rgba(30,28,22,0.1)' : 'rgba(201,169,110,0.1)';

  return (
    <article style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: 0, background: BG, border: `1px solid ${BORDER}`,
      borderRadius: 2, overflow: 'hidden', cursor: 'pointer',
    }} onClick={() => onClick && onClick(post)}>
      <style>{`.ls-img:hover { transform: scale(1.04) !important; }`}</style>
      <div style={{ overflow: 'hidden', minHeight: 480 }}>
        <div className="ls-img" style={{
          width: '100%', height: '100%', minHeight: 480,
          backgroundImage: `url(${post.coverImage})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          transition: 'transform 0.8s ease',
        }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(32px, 4vw, 56px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ width: 20, height: 1, background: GOLD }} />
          <span style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD }}>
            Featured Story
          </span>
        </div>
        <h2 style={{ fontFamily: FD, fontSize: 'clamp(24px, 3.2vw, 42px)', fontWeight: 400, color: TEXT, margin: '0 0 16px', lineHeight: 1.1 }}>
          {post.title}
        </h2>
        <p style={{ fontFamily: FU, fontSize: 14, fontWeight: 300, color: MUTED, margin: '0 0 24px', lineHeight: 1.65 }}>
          {post.excerpt}
        </p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: FU, fontSize: 10, color: META, letterSpacing: '0.08em' }}>{post.author.name}</span>
          <span style={{ color: META }}>·</span>
          <span style={{ fontFamily: FU, fontSize: 10, color: META }}>{post.readingTime} min read</span>
        </div>
      </div>
    </article>
  );
}
