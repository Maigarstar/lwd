import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CATEGORIES } from '../data/categories';
import { getPostsByCategory, POSTS } from '../data/posts';
import NewsletterCapture from './NewsletterCapture';
import MegaMenuPanel from '../../../components/nav/MegaMenuPanel';
import { useIsMobile } from '../../../components/profile/ProfileDesignSystem';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const FU = "'Nunito', 'Inter', 'Helvetica Neue', sans-serif";
const FD = "'Gilda Display', 'Playfair Display', Georgia, serif";
const GOLD = '#c9a96e';
const CREAM = '#f5f0e8';

// ─── Fashion Mega Menu (desktop only) ────────────────────────────────────────
const FASHION_LINKS = [
  { label: 'Bridal Gowns',       sub: 'The season\'s finest' },
  { label: 'Shoes & Accessories', sub: 'Complete the look' },
  { label: 'Jewellery',           sub: 'Wear forever' },
  { label: 'Beauty Edit',         sub: 'Prep & perfection' },
  { label: 'Guest Dresses',       sub: 'For your guests' },
  { label: 'Honeymoon Style',     sub: 'Pack beautifully' },
];

function FashionMegaMenu({ isLight, onNavigateFashion, onNavigateCategory }) {
  const BG       = isLight ? '#fff' : '#111';
  const BORDER   = isLight ? 'rgba(30,28,22,0.1)' : 'rgba(201,169,110,0.15)';
  const TEXT     = isLight ? '#1a1806' : '#f5f0e8';
  const MUTED    = isLight ? 'rgba(30,28,22,0.5)' : 'rgba(245,240,232,0.5)';
  const HBORDER  = isLight ? 'rgba(30,28,22,0.06)' : 'rgba(245,240,232,0.06)';

  const fashionPosts = getPostsByCategory('fashion').slice(0, 1);
  const featuredPost = fashionPosts[0];

  return (
    <div style={{
      position: 'absolute', top: '100%', left: 0, right: 0,
      background: BG, borderBottom: `1px solid ${BORDER}`,
      boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
      zIndex: 199,
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(28px,3vw,40px) clamp(20px,4vw,60px)', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 40 }}>
        {/* Left: category links */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${HBORDER}` }}>
            <div style={{ width: 16, height: 1, background: GOLD }} />
            <span style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD }}>
              Fashion & Beauty
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>
            {FASHION_LINKS.map((link, i) => (
              <button
                key={i}
                onClick={onNavigateFashion}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                  padding: '12px 0', background: 'none', border: 'none',
                  borderBottom: `1px solid ${HBORDER}`, cursor: 'pointer', textAlign: 'left',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.querySelector('.mm-label').style.color = GOLD; }}
                onMouseLeave={e => { e.currentTarget.querySelector('.mm-label').style.color = TEXT; }}
              >
                <span className="mm-label" style={{ fontFamily: FU, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: TEXT, marginBottom: 2, transition: 'color 0.15s' }}>
                  {link.label}
                </span>
                <span style={{ fontFamily: FU, fontSize: 10, color: MUTED, fontWeight: 300 }}>
                  {link.sub}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={onNavigateFashion}
            style={{
              marginTop: 20,
              fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: GOLD, background: 'none', border: `1px solid ${GOLD}50`,
              padding: '10px 22px', borderRadius: 1, cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${GOLD}12`; e.currentTarget.style.borderColor = GOLD; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = `${GOLD}50`; }}
          >
            Enter the Fashion Edit →
          </button>
        </div>

        {/* Right: featured fashion story */}
        {featuredPost && (
          <div>
            <div style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, marginBottom: 12 }}>
              Latest Story
            </div>
            <div style={{ overflow: 'hidden', borderRadius: 2, marginBottom: 14 }}>
              <img src={featuredPost.coverImage} alt={featuredPost.title} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block', transition: 'transform 0.5s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              />
            </div>
            <div style={{ fontFamily: FD, fontSize: 16, fontWeight: 400, color: TEXT, marginBottom: 8, lineHeight: 1.25 }}>
              {featuredPost.title}
            </div>
            <div style={{ fontFamily: FU, fontSize: 11, color: MUTED }}>
              {featuredPost.readingTime} min read
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Subscribe Modal ───────────────────────────────────────────────────────────
function SubscribeModal({ onClose }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: 640, borderRadius: 2, overflow: 'hidden' }}>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: 14, right: 14, zIndex: 10,
            background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(201,169,110,0.3)',
            color: '#f5f0e8', fontFamily: FU, fontSize: 11, padding: '4px 9px',
            cursor: 'pointer', borderRadius: 2, lineHeight: 1, letterSpacing: '0.1em',
          }}
        >
          ✕
        </button>
        <NewsletterCapture />
      </div>
    </div>
  );
}

// ─── Search Overlay ────────────────────────────────────────────────────────────
function SearchOverlay({ isLight, onNavigateArticle, onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const BG   = isLight ? 'rgba(250,250,248,0.98)' : 'rgba(10,10,10,0.98)';
  const TEXT = isLight ? '#1a1806' : '#f5f0e8';
  const MUTED = isLight ? 'rgba(30,28,22,0.45)' : 'rgba(245,240,232,0.45)';
  const BORDER = isLight ? 'rgba(30,28,22,0.12)' : 'rgba(245,240,232,0.1)';

  const q = query.trim().toLowerCase();
  const results = q.length > 1
    ? POSTS.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.excerpt?.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q)) ||
        p.category?.toLowerCase().includes(q)
      ).slice(0, 8)
    : [];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: BG, borderBottom: `1px solid ${BORDER}`,
          padding: 'clamp(20px,3vw,40px) clamp(20px,4vw,60px)',
        }}
      >
        {/* Search input */}
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: MUTED, fontSize: 16, flexShrink: 0 }}>⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search articles, topics, destinations…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontFamily: FD, fontSize: 'clamp(20px,3vw,30px)', fontWeight: 400,
              color: TEXT, letterSpacing: '0.01em',
            }}
          />
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: FU, fontSize: 10, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: MUTED, flexShrink: 0,
            }}
          >
            Close
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div style={{ maxWidth: 720, margin: '24px auto 0', borderTop: `1px solid ${BORDER}`, paddingTop: 16 }}>
            {results.map(post => (
              <button
                key={post.id}
                onClick={() => { onNavigateArticle && onNavigateArticle(post.slug); onClose(); }}
                style={{
                  display: 'flex', gap: 16, width: '100%', textAlign: 'left',
                  padding: '12px 0', background: 'none', border: 'none',
                  borderBottom: `1px solid ${BORDER}`, cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = 0.7}
                onMouseLeave={e => e.currentTarget.style.opacity = 1}
              >
                <img
                  src={post.coverImage}
                  alt=""
                  style={{ width: 64, height: 46, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, marginBottom: 4 }}>
                    {post.category}
                  </div>
                  <div style={{ fontFamily: FD, fontSize: 16, color: TEXT, lineHeight: 1.2, marginBottom: 4 }}>
                    {post.title}
                  </div>
                  <div style={{ fontFamily: FU, fontSize: 11, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {post.excerpt}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {q.length > 1 && results.length === 0 && (
          <div style={{ maxWidth: 720, margin: '24px auto 0', fontFamily: FU, fontSize: 12, color: MUTED, borderTop: `1px solid ${BORDER}`, paddingTop: 20 }}>
            No articles found for "{query}"
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Mobile Drawer ────────────────────────────────────────────────────────────
function MobileDrawer({
  isOpen,
  onClose,
  isLight,
  activeCategoryId,
  onNavigateHome,
  onNavigateCategory,
  onNavigateFashion,
  onToggleLight,
  onSearch,
  onSubscribe,
}) {
  const [fashionExpanded, setFashionExpanded] = useState(false);

  const BG     = isLight ? 'rgba(250,250,248,0.99)' : 'rgba(10,10,10,0.99)';
  const TEXT   = isLight ? '#1a1806' : CREAM;
  const MUTED  = isLight ? 'rgba(30,28,22,0.45)' : 'rgba(245,240,232,0.45)';
  const BORDER = isLight ? 'rgba(30,28,22,0.08)' : 'rgba(245,240,232,0.07)';

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handleNav = (action) => {
    action();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 800,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Drawer panel, slides from right */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 320, maxWidth: '85vw', zIndex: 801,
          background: BG, backdropFilter: 'blur(24px)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: `1px solid ${BORDER}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD }}>
              LWD
            </span>
            <span style={{ width: 1, height: 12, background: `${GOLD}40` }} />
            <span style={{ fontFamily: FD, fontSize: 14, fontWeight: 400, color: TEXT, fontStyle: 'italic' }}>
              The Magazine
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: FU, fontSize: 20, lineHeight: 1, color: MUTED,
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Category links */}
        <div style={{ flex: 1, padding: '12px 0' }}>
          {/* All */}
          <button
            onClick={() => handleNav(() => onNavigateHome && onNavigateHome())}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '16px 28px', background: 'none', border: 'none', cursor: 'pointer',
              borderLeft: `2px solid ${!activeCategoryId ? GOLD : 'transparent'}`,
            }}
          >
            <span style={{
              fontFamily: FD, fontSize: 22, fontWeight: 400, letterSpacing: '-0.01em',
              color: !activeCategoryId ? GOLD : TEXT,
              transition: 'color 0.15s',
            }}>
              All Stories
            </span>
          </button>

          {CATEGORIES.map(cat => {
            const isActive = activeCategoryId === cat.id;
            const isFashion = cat.id === 'fashion';

            return (
              <div key={cat.id}>
                <button
                  onClick={() => {
                    if (isFashion) {
                      setFashionExpanded(!fashionExpanded);
                    } else {
                      handleNav(() => onNavigateCategory && onNavigateCategory(cat.id));
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', textAlign: 'left',
                    padding: '16px 28px', background: 'none', border: 'none', cursor: 'pointer',
                    borderLeft: `2px solid ${isActive ? GOLD : 'transparent'}`,
                  }}
                >
                  <span style={{
                    fontFamily: FD, fontSize: 22, fontWeight: 400, letterSpacing: '-0.01em',
                    color: isActive ? GOLD : TEXT,
                    transition: 'color 0.15s',
                  }}>
                    {cat.label}
                  </span>
                  {isFashion && (
                    <span style={{
                      fontFamily: FU, fontSize: 10, color: MUTED,
                      transform: fashionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.25s',
                    }}>
                      ▾
                    </span>
                  )}
                </button>

                {/* Fashion sub-links */}
                {isFashion && fashionExpanded && (
                  <div style={{
                    padding: '0 28px 8px 42px',
                    borderLeft: `2px solid transparent`,
                  }}>
                    <button
                      onClick={() => handleNav(() => {
                        if (onNavigateFashion) onNavigateFashion();
                        else onNavigateCategory && onNavigateCategory('fashion');
                      })}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '10px 0', background: 'none', border: 'none',
                        borderBottom: `1px solid ${BORDER}`, cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontFamily: FU, fontSize: 13, fontWeight: 600, color: GOLD }}>
                        View All Fashion →
                      </span>
                    </button>
                    {FASHION_LINKS.map((link, i) => (
                      <button
                        key={i}
                        onClick={() => handleNav(() => {
                          if (onNavigateFashion) onNavigateFashion();
                          else onNavigateCategory && onNavigateCategory('fashion');
                        })}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: '10px 0', background: 'none', border: 'none',
                          borderBottom: i < FASHION_LINKS.length - 1 ? `1px solid ${BORDER}` : 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontFamily: FU, fontSize: 13, fontWeight: 500, color: TEXT, display: 'block', marginBottom: 2 }}>
                          {link.label}
                        </span>
                        <span style={{ fontFamily: FU, fontSize: 11, color: MUTED, fontWeight: 300 }}>
                          {link.sub}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom actions */}
        <div style={{ padding: '16px 28px 28px', borderTop: `1px solid ${BORDER}` }}>
          {/* Search */}
          <button
            onClick={() => { onClose(); onSearch(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%',
              padding: '14px 0', background: 'none', border: 'none',
              borderBottom: `1px solid ${BORDER}`, cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 15, color: MUTED }}>⌕</span>
            <span style={{ fontFamily: FU, fontSize: 12, fontWeight: 500, color: TEXT, letterSpacing: '0.04em' }}>
              Search Articles
            </span>
          </button>

          {/* Theme toggle */}
          {onToggleLight && (
            <button
              onClick={() => { onToggleLight(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                padding: '14px 0', background: 'none', border: 'none',
                borderBottom: `1px solid ${BORDER}`, cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 14, color: MUTED }}>{isLight ? '◐' : '◑'}</span>
              <span style={{ fontFamily: FU, fontSize: 12, fontWeight: 500, color: TEXT, letterSpacing: '0.04em' }}>
                {isLight ? 'Dark Mode' : 'Light Mode'}
              </span>
            </button>
          )}

          {/* Subscribe */}
          <button
            onClick={() => { onClose(); onSubscribe(); }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '100%', marginTop: 16,
              fontFamily: FU, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em',
              textTransform: 'uppercase', color: '#0a0a0a', background: GOLD,
              border: 'none', padding: '14px 20px',
              borderRadius: 2, cursor: 'pointer',
            }}
          >
            Subscribe to the Magazine
          </button>

          {/* Season */}
          <div style={{
            fontFamily: FU, fontSize: 9, letterSpacing: '0.15em',
            color: MUTED, textTransform: 'uppercase', textAlign: 'center',
            marginTop: 16,
          }}>
            Spring · Summer 2026
          </div>
        </div>
      </div>
    </>
  );
}

// ─── MagazineNav ───────────────────────────────────────────────────────────────
export default function MagazineNav({
  activeCategoryId = null,
  onNavigateHome,
  onNavigateCategory,
  onNavigateFashion,
  onNavigateArticle,
  isLight = false,
  onToggleLight,
  filterSubcats,
  activeSubcat,
  onSubcat,
  sort,
  onSort,
  viewMode = 'grid3',
  onViewMode,
  onEdit,
  topOffset = 0,
}) {
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [categories, setCategories] = useState(CATEGORIES); // Start with static data
  const [loadingCategories, setLoadingCategories] = useState(true);
  const scrollRef = useRef(null);
  const catBarRef = useRef(null);
  const megaTimeout = useRef(null);
  const isMobile = useIsMobile(768);

  // Load magazine categories from master (magazine_categories table via CategoryEditor)
  useEffect(() => {
    async function loadCategories() {
      try {
        // Fetch ALL categories from the master source
        const { data: allCategories, error: categoriesError } = await supabase
          .from('magazine_categories')
          .select('*')
          .order('sort_order', { ascending: true });

        if (categoriesError) throw categoriesError;

        if (allCategories && allCategories.length > 0) {
          // Build tree: attach children to their parents using parentSlug
          const catMap = {};
          allCategories.forEach(cat => { catMap[cat.slug] = { ...cat, children: [] }; });
          allCategories.forEach(cat => {
            if (cat.parent_category_slug && catMap[cat.parent_category_slug]) {
              catMap[cat.parent_category_slug].children.push(catMap[cat.slug]);
            }
          });

          // Top-level categories = those without a parent
          const topLevel = allCategories
            .filter(cat => !cat.parent_category_slug)
            .map(cat => catMap[cat.slug]);

          setCategories(topLevel);
          console.log('[MagazineNav] Loaded', topLevel.length, 'categories from magazine_categories master');
        } else {
          setCategories(CATEGORIES);
        }
      } catch (err) {
        console.error('[MagazineNav] Failed to load magazine categories:', err);
        // Fall back to static data
        setCategories(CATEGORIES);
      } finally {
        setLoadingCategories(false);
      }
    }

    loadCategories();
  }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    if (!scrollRef.current || !activeCategoryId) return;
    const active = scrollRef.current.querySelector('[data-active="true"]');
    if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeCategoryId]);

  const openMega  = () => { clearTimeout(megaTimeout.current); setMegaOpen(true); };
  const closeMega = () => { megaTimeout.current = setTimeout(() => setMegaOpen(false), 180); };

  // Mega menu panel state for category mega menus
  const [openMegaPanel, setOpenMegaPanel] = useState(null);
  const megaPanelTimeout = useRef(null);
  const openCatMega = (id) => { clearTimeout(megaPanelTimeout.current); setOpenMegaPanel(id); };
  const startCloseCatMega = () => { megaPanelTimeout.current = setTimeout(() => setOpenMegaPanel(null), 450); };
  const cancelCloseCatMega = () => { clearTimeout(megaPanelTimeout.current); };

  const navBg = isLight ? 'rgba(250,250,248,0.97)' : 'rgba(10,10,10,0.96)';
  const borderColor = scrolled
    ? (isLight ? 'rgba(30,28,22,0.14)' : 'rgba(201,169,110,0.18)')
    : (isLight ? 'rgba(30,28,22,0.08)' : 'rgba(201,169,110,0.1)');
  const dividerColor = isLight ? 'rgba(30,28,22,0.06)' : 'rgba(245,240,232,0.06)';
  const logoText = isLight ? '#1a1806' : '#f5f0e8';
  const season = isLight ? 'rgba(30,28,22,0.28)' : 'rgba(245,240,232,0.28)';
  const catInactive = isLight ? 'rgba(30,28,22,0.45)' : 'rgba(245,240,232,0.45)';
  const catHover = isLight ? 'rgba(30,28,22,0.8)' : 'rgba(245,240,232,0.8)';
  const iconColor = isLight ? 'rgba(30,28,22,0.5)' : 'rgba(245,240,232,0.5)';
  const SORT_OFF = isLight ? 'rgba(30,28,22,0.4)' : 'rgba(245,240,232,0.4)';
  const SORT_BRD = isLight ? 'rgba(30,28,22,0.12)' : 'rgba(245,240,232,0.12)';

  return (
    <>
      <style>{`
        .mag-nav-bar {
          position: sticky; top: ${topOffset}px; z-index: 200;
          backdrop-filter: blur(14px);
          transition: border-color 0.3s, background 0.35s;
        }
        .mag-masthead {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px clamp(16px, 4vw, 60px);
        }
        .mag-cats {
          display: flex; align-items: center;
          padding: 0 clamp(20px, 4vw, 60px);
          overflow-x: auto; gap: 0;
          scrollbar-width: none;
        }
        .mag-cats::-webkit-scrollbar { display: none; }
        .mag-cat-btn {
          font-family: ${FU}; font-size: 10px; font-weight: 500;
          letter-spacing: 0.14em; text-transform: uppercase;
          background: none; border: none;
          padding: 14px 18px; cursor: pointer; white-space: nowrap;
          border-bottom: 1px solid transparent;
          transition: color 0.2s, border-color 0.2s, font-weight 0.2s;
        }
        .mag-cat-btn { color: ${isLight ? 'rgba(0,0,0,0.6)' : 'rgba(245,240,232,0.6)'}; }
        .mag-cat-btn:hover { color: ${catHover}; }
        .mag-cat-btn.active { color: ${isLight ? '#000' : '#f5f0e8'}; font-weight: 500; border-bottom-color: ${GOLD}; }
        .mag-fashion-btn { color: ${catInactive}; position: relative; }
        .mag-fashion-btn:hover, .mag-fashion-btn.mega-open { color: ${GOLD} !important; border-bottom-color: ${GOLD} !important; }
        @media (max-width: 600px) {
          .mag-masthead-title { display: none; }
        }
      `}</style>

      <nav
        className="mag-nav-bar"
        aria-label="Magazine navigation"
        style={{
          background: navBg,
          borderBottom: `1px solid ${borderColor}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}
      >
        {/* Masthead row */}
        <div className="mag-masthead" style={{ borderBottom: isMobile ? 'none' : `1px solid ${dividerColor}`, gap: 20, paddingRight: 'clamp(16px, 4vw, 60px)' }}>
          <button
            onClick={onNavigateHome}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
          >
            <span style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD }}>
              LWD
            </span>
            <span style={{ width: 1, height: 14, background: 'rgba(201,169,110,0.3)', opacity: 0.85 }} />
            <span style={{ fontFamily: FD, fontSize: 15, fontWeight: 400, color: logoText, fontStyle: 'italic', letterSpacing: '0.5px' }}>
              The Magazine
            </span>
          </button>

          {!isMobile && (
            <span className="mag-masthead-title" style={{ fontFamily: FU, fontSize: 9, letterSpacing: '0.15em', color: season, textTransform: 'uppercase' }}>
              Spring · Summer 2026
            </span>
          )}

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Search icon, desktop only */}
            {!isMobile && (
              <button
                onClick={() => setShowSearch(true)}
                title="Search articles"
                style={{
                  fontFamily: FU, fontSize: 15, lineHeight: 1,
                  color: iconColor,
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '4px 6px', borderRadius: 2, transition: 'opacity 0.2s', opacity: 0.75,
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0.75}
              >
                ⌕
              </button>
            )}

            {/* Theme toggle, desktop only */}
            {!isMobile && onToggleLight && (
              <button
                onClick={onToggleLight}
                title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
                style={{
                  fontFamily: FU, fontSize: 14, lineHeight: 1,
                  color: isLight ? '#1a1806' : 'rgba(245,240,232,0.55)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '4px 6px', borderRadius: 2, transition: 'opacity 0.2s', opacity: 0.7,
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
              >
                {isLight ? '◐' : '◑'}
              </button>
            )}

            {/* Subscribe, desktop only */}
            {!isMobile && (
              <button
                onClick={() => setShowSubscribe(true)}
                style={{
                  fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.18em',
                  textTransform: 'uppercase', color: logoText, background: 'transparent',
                  border: `1px solid ${isLight ? 'rgba(0,0,0,0.2)' : 'rgba(245,240,232,0.2)'}`, padding: '6px 14px',
                  borderRadius: 2, cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(245,240,232,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                Subscribe
              </button>
            )}

            {/* Hamburger, mobile only */}
            {isMobile && (
              <button
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
                style={{
                  display: 'flex', flexDirection: 'column', justifyContent: 'center',
                  alignItems: 'center', gap: 4,
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '6px 4px', width: 36, height: 36,
                }}
              >
                <span style={{ display: 'block', width: 20, height: 1.5, background: iconColor, borderRadius: 1 }} />
                <span style={{ display: 'block', width: 14, height: 1.5, background: GOLD, borderRadius: 1 }} />
                <span style={{ display: 'block', width: 20, height: 1.5, background: iconColor, borderRadius: 1 }} />
              </button>
            )}
          </div>
        </div>

        {/* Magazine mega menu is now handled by main navigation HomeNav */}

        {/* Magazine Category Navigation Row */}
        <div
          className="mag-cats"
          ref={(el) => { scrollRef.current = el; catBarRef.current = el; }}
          style={{
            background: navBg,
            borderTop: `1px solid ${dividerColor}`,
            borderBottom: `1px solid ${dividerColor}`,
          }}
        >
          {/* ALL button */}
          <button
            className={`mag-cat-btn ${!activeCategoryId ? 'active' : ''}`}
            onClick={() => onNavigateCategory && onNavigateCategory(null)}
            style={{
              color: !activeCategoryId ? GOLD : catInactive,
              borderBottomColor: !activeCategoryId ? GOLD : 'transparent',
            }}
          >
            All
          </button>

          {/* Category buttons (with mega menu support) */}
          {categories.map(cat => {
            const isMega = cat.type === 'mega_menu' || cat.type === 'dropdown';
            const catId = cat.slug || cat.id;
            const isActive = activeCategoryId === catId;

            if (isMega) {
              return (
                <div
                  key={cat.id}
                  style={{ position: 'relative', display: 'inline-flex' }}
                  onMouseEnter={() => openCatMega(cat.id)}
                  onMouseLeave={startCloseCatMega}
                >
                  <button
                    className={`mag-cat-btn ${isActive ? 'active' : ''}`}
                    data-active={isActive}
                    style={{
                      color: isActive || openMegaPanel === cat.id ? GOLD : catInactive,
                      borderBottomColor: openMegaPanel === cat.id ? GOLD : (isActive ? GOLD : 'transparent'),
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    {cat.label}
                    <span style={{
                      fontSize: 8, opacity: 0.5,
                      transition: 'transform 0.2s',
                      transform: openMegaPanel === cat.id ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}>▾</span>
                  </button>
                </div>
              );
            }

            return (
              <button
                key={cat.id}
                className={`mag-cat-btn ${isActive ? 'active' : ''}`}
                data-active={isActive}
                onClick={() => onNavigateCategory && onNavigateCategory(catId)}
                style={{
                  color: isActive ? GOLD : catInactive,
                  borderBottomColor: isActive ? GOLD : 'transparent',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* ── Mega Menu Panel (absolute overlay, flush below category bar) ── */}
        {openMegaPanel && (() => {
          const megaItem = categories.find(c => c.id === openMegaPanel);
          if (!megaItem || !megaItem.children || megaItem.children.length === 0) return null;
          const cols = Math.min(megaItem.children.length, 5);
          return (
            <div
              onMouseEnter={cancelCloseCatMega}
              onMouseLeave={startCloseCatMega}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 699,
                background: isLight
                  ? 'linear-gradient(to bottom, rgba(250,248,245,0.98), rgba(245,240,232,0.99))'
                  : 'linear-gradient(to bottom, rgba(8,6,4,0.95), rgba(4,2,0,0.98))',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                borderTop: `1px solid ${isLight ? 'rgba(201,168,76,0.12)' : 'rgba(201,168,76,0.15)'}`,
                borderBottom: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(201,168,76,0.08)'}`,
                boxShadow: isLight ? '0 6px 24px rgba(0,0,0,0.06)' : '0 8px 32px rgba(0,0,0,0.4)',
                animation: 'magMegaSlide 0.7s cubic-bezier(0.16, 0.7, 0.3, 1) both',
              }}
            >
              <div style={{
                maxWidth: 1280, margin: '0 auto',
                padding: '32px clamp(20px, 4vw, 64px)',
              }}>
                {/* Section heading */}
                <div style={{
                  fontFamily: FU, fontSize: 10, fontWeight: 600,
                  letterSpacing: '2px', textTransform: 'uppercase',
                  color: GOLD, marginBottom: 24,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ width: 20, height: 1, background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
                  {megaItem.label}
                </div>
                {/* Children grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${cols}, 1fr)`,
                  gap: '16px 24px',
                }}>
                  {megaItem.children.map((child, idx) => (
                    <a
                      key={child.id}
                      href={child.url || `/magazine/${child.slug}`}
                      style={{
                        display: 'block', padding: '12px 0 12px 4px',
                        borderBottom: `1px solid ${isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'}`,
                        textDecoration: 'none',
                        transition: 'transform 0.2s, color 0.2s',
                        fontFamily: FD, fontSize: 15, fontWeight: 400,
                        letterSpacing: '0.2px',
                        color: isLight ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.85)',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateX(4px)';
                        e.currentTarget.style.color = isLight ? '#000' : '#fff';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.color = isLight ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.85)';
                      }}
                    >
                      {child.label}
                      {child.description && (
                        <div style={{
                          fontFamily: FU, fontSize: 11, marginTop: 2,
                          color: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)',
                          fontWeight: 400,
                        }}>
                          {child.description}
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </div>
              <style>{`
                @keyframes magMegaSlide {
                  from { opacity: 0; transform: translateY(-3px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}</style>
            </div>
          );
        })()}

        {/* Filter bar, desktop only, shown when filterSubcats provided */}
        {!isMobile && filterSubcats?.length > 0 && (
          <div style={{
            borderTop: `1px solid ${dividerColor}`,
            background: navBg,
            padding: '0 clamp(20px, 4vw, 60px)',
          }}>
            <div style={{
              maxWidth: 1280, margin: '0 auto',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            }}>
              {/* Left: subcategory pills */}
              <div style={{
                display: 'flex', gap: 6, alignItems: 'center',
                overflowX: 'auto', padding: '10px 0', scrollbarWidth: 'none',
              }}>
                {/* All pill */}
                <button
                  onClick={() => onSubcat && onSubcat(null)}
                  style={{
                    fontFamily: FU, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
                    padding: '5px 13px', borderRadius: 20, cursor: 'pointer',
                    transition: 'all 0.18s', whiteSpace: 'nowrap', flexShrink: 0,
                    fontWeight: !activeSubcat ? 700 : 400,
                    background: !activeSubcat ? `${GOLD}15` : 'transparent',
                    border: `1px solid ${!activeSubcat ? GOLD : SORT_BRD}`,
                    color: !activeSubcat ? GOLD : SORT_OFF,
                  }}
                >
                  All
                </button>
                {filterSubcats.map(sub => {
                  const isActiveSub = activeSubcat === sub;
                  return (
                    <button
                      key={sub}
                      onClick={() => onSubcat && onSubcat(isActiveSub ? null : sub)}
                      style={{
                        fontFamily: FU, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
                        padding: '5px 13px', borderRadius: 20, cursor: 'pointer',
                        transition: 'all 0.18s', whiteSpace: 'nowrap', flexShrink: 0,
                        fontWeight: isActiveSub ? 700 : 400,
                        background: isActiveSub ? `${GOLD}15` : 'transparent',
                        border: `1px solid ${isActiveSub ? GOLD : SORT_BRD}`,
                        color: isActiveSub ? GOLD : SORT_OFF,
                      }}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>

              {/* Right: controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
                {/* Sort group */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {[
                    { value: 'latest', label: 'Latest' },
                    { value: 'popular', label: 'Most Read' },
                    { value: 'az', label: 'A–Z' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => onSort && onSort(opt.value)}
                      style={{
                        fontFamily: FU, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                        background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
                        color: sort === opt.value ? GOLD : SORT_OFF,
                        fontWeight: sort === opt.value ? 700 : 400,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Thin divider */}
                <div style={{ width: 1, height: 14, background: dividerColor }} />

                {/* View mode group */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {[
                    { mode: 'grid2', icon: '▦' },
                    { mode: 'grid3', icon: '⊞' },
                    { mode: 'list',  icon: '☰' },
                    { mode: 'wide',  icon: '⊟' },
                    { mode: 'compact', icon: '▤' },
                  ].map(({ mode, icon }) => (
                    <button
                      key={mode}
                      onClick={() => onViewMode && onViewMode(mode)}
                      style={{
                        fontFamily: FU, fontSize: 13, border: 'none', cursor: 'pointer',
                        padding: '4px 7px', borderRadius: 2, lineHeight: 1,
                        color: viewMode === mode ? GOLD : SORT_OFF,
                        background: viewMode === mode ? `${GOLD}12` : 'transparent',
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>

                {/* Thin divider before edit button */}
                {onEdit && <div style={{ width: 1, height: 14, background: dividerColor }} />}

                {/* Edit button */}
                {onEdit && (
                  <button
                    onClick={onEdit}
                    style={{
                      fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
                      textTransform: 'uppercase', color: GOLD,
                      background: `${GOLD}10`, border: `1px solid ${GOLD}30`,
                      padding: '5px 11px', borderRadius: 2, cursor: 'pointer',
                    }}
                  >
                    ✎ Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Fashion Mega Menu, desktop only, positioned inside nav */}
        {!isMobile && megaOpen && (
          <div onMouseEnter={openMega} onMouseLeave={closeMega}>
            <FashionMegaMenu
              isLight={isLight}
              onNavigateFashion={() => {
                setMegaOpen(false);
                if (onNavigateFashion) onNavigateFashion();
                else onNavigateCategory && onNavigateCategory('fashion');
              }}
              onNavigateCategory={id => {
                setMegaOpen(false);
                onNavigateCategory && onNavigateCategory(id);
              }}
            />
          </div>
        )}
      </nav>

      {/* Mobile Drawer */}
      {isMobile && (
        <MobileDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          isLight={isLight}
          activeCategoryId={activeCategoryId}
          onNavigateHome={onNavigateHome}
          onNavigateCategory={onNavigateCategory}
          onNavigateFashion={onNavigateFashion}
          onToggleLight={onToggleLight}
          onSearch={() => setShowSearch(true)}
          onSubscribe={() => setShowSubscribe(true)}
        />
      )}

      {showSubscribe && <SubscribeModal onClose={() => setShowSubscribe(false)} />}
      {showSearch && (
        <SearchOverlay
          isLight={isLight}
          onNavigateArticle={onNavigateArticle}
          onClose={() => setShowSearch(false)}
        />
      )}
    </>
  );
}
