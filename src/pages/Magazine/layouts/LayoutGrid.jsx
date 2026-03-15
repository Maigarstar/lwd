/**
 * LayoutGrid, Style 2: Luxury Visual Grid
 *
 * Modern editorial platform feel, Pinterest meets Architectural Digest.
 * Multi-story magazine grid hero, masonry-like content grid with spanning tiles,
 * category strip, and curated section spotlights.
 */
import { HeroMagazineGrid } from '../components/HeroModules';
import PostCard, { CardLargeEditorial, CardStandard, CardOverlay, CardMinimal, CardHorizontal } from '../components/PostCards';
import EditorialHeading from '../components/EditorialHeading';
import SectionHeader from '../components/SectionHeader';
import { CATEGORIES } from '../data/categories';
import { getMagTheme, FD, FU, GOLD_CONST as GOLD, FD_LS } from '../magazineTheme';

const CREAM = '#f5f0e8';

/* ── Category Strip ────────────────────────────────────────────────────────── */
function CategoryStrip({ categories, onNavigate, isLight }) {
  const T = getMagTheme(isLight);
  return (
    <div style={{
      display: 'flex', gap: 10, overflowX: 'auto',
      padding: '4px 0 12px',
      scrollSnapType: 'x mandatory',
      WebkitOverflowScrolling: 'touch',
      msOverflowStyle: 'none',
      scrollbarWidth: 'none',
    }}>
      <style>{`.cat-strip::-webkit-scrollbar { display: none; }`}</style>
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onNavigate(cat.id)}
          className="cat-strip"
          style={{
            flexShrink: 0, scrollSnapAlign: 'start',
            fontFamily: FU, fontSize: 10, fontWeight: 600,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: GOLD, background: 'transparent',
            border: `1px solid ${GOLD}40`,
            padding: '10px 20px', borderRadius: 2,
            cursor: 'pointer', transition: 'all 0.2s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `${GOLD}14`; e.currentTarget.style.borderColor = GOLD; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = `${GOLD}40`; }}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}

export default function LayoutGrid({
  featured, trending, latest, destinations, realWeddings, honeymoons, fashion,
  goArticle, goCategory, isLight, isMobile,
}) {
  const T = getMagTheme(isLight);
  const BG = T.bg;
  const BG2 = isLight ? '#f0ece3' : '#080806';

  // Combine latest + trending for the masonry section
  const masonryPosts = [...latest, ...trending.filter(t => !latest.find(l => l.id === t.id))].slice(0, 7);

  return (
    <>
      {/* ── Hero: Magazine Grid ────────────────────────────────────── */}
      <HeroMagazineGrid posts={featured} onRead={goArticle} />

      {/* ── Masonry Grid Section ───────────────────────────────────── */}
      <section style={{ padding: 'clamp(56px, 8vw, 100px) clamp(24px, 5vw, 80px)', background: BG }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <EditorialHeading
            label="From the Magazine"
            title="Latest & Trending"
            intro="The stories defining luxury weddings right now."
            light={isLight}
            titleSize="medium"
          />

          <style>{`
            .mag-masonry {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: clamp(16px, 2.5vw, 28px);
            }
            .mag-masonry > :first-child {
              grid-column: span 2;
              grid-row: span 2;
            }
            @media (max-width: 900px) {
              .mag-masonry { grid-template-columns: repeat(2, 1fr); }
              .mag-masonry > :first-child { grid-column: span 2; grid-row: span 1; }
            }
            @media (max-width: 560px) {
              .mag-masonry { grid-template-columns: 1fr; }
              .mag-masonry > :first-child { grid-column: span 1; }
            }
          `}</style>

          <div className="mag-masonry">
            {/* Lead tile, spans 2 columns and 2 rows */}
            {masonryPosts[0] && (
              <div>
                <CardOverlay post={masonryPosts[0]} onClick={goArticle} tall />
              </div>
            )}
            {/* Standard tiles */}
            {masonryPosts.slice(1, 7).map(post => (
              <div key={post.id}>
                <CardStandard post={post} onClick={goArticle} light={isLight} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Category Strip ─────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(32px, 4vw, 56px) clamp(24px, 5vw, 80px)',
        background: BG2,
        borderTop: `1px solid ${T.border}`,
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <EditorialHeading
            label="Explore"
            title="Browse by Category"
            light={isLight}
            titleSize="medium"
          />
          <CategoryStrip categories={CATEGORIES} onNavigate={goCategory} isLight={isLight} />
        </div>
      </section>

      {/* ── Real Weddings ──────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(56px, 8vw, 100px) clamp(24px, 5vw, 80px)', background: BG }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <EditorialHeading
            label="Love Stories"
            title="Real Weddings"
            intro="Intimate stories from couples who celebrated in extraordinary style."
            light={isLight}
            titleSize="medium"
            onViewAll={() => goCategory('real-weddings')}
          />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 'clamp(28px, 3.5vw, 48px)',
          }}>
            {realWeddings.map(post => (
              <CardLargeEditorial key={post.id} post={post} onClick={goArticle} light={isLight} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Fashion ────────────────────────────────────────────────── */}
      <section style={{ padding: '0 clamp(24px, 5vw, 80px) clamp(56px, 8vw, 100px)', background: BG }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <EditorialHeading
            label="Style & Beauty"
            title="Fashion & Beauty"
            intro="The season's most coveted bridal looks and beauty inspiration."
            light={isLight}
            titleSize="medium"
            onViewAll={() => goCategory('fashion')}
          />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 'clamp(20px, 2.5vw, 32px)',
          }}>
            {fashion.map(post => (
              <CardOverlay key={post.id} post={post} onClick={goArticle} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Trending sidebar + Honeymoons ──────────────────────────── */}
      <section style={{
        padding: 'clamp(48px, 6vw, 80px) clamp(24px, 5vw, 80px)',
        background: BG2,
        borderTop: `1px solid ${T.border}`,
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr clamp(280px, 35%, 400px)',
            gap: isMobile ? 40 : 60,
            alignItems: 'start',
          }}>
            <div>
              <SectionHeader label="Right Now" title="Trending" light={isLight} />
              <div>
                {trending.map((post, i) => (
                  <CardMinimal key={post.id} post={post} index={i} onClick={goArticle} light={isLight} />
                ))}
              </div>
            </div>
            <div>
              <SectionHeader label="Away Together" title="Honeymoons" light={isLight} onViewAll={() => goCategory('honeymoons')} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {honeymoons.map(post => (
                  <CardHorizontal key={post.id} post={post} onClick={goArticle} light={isLight} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Destinations ───────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(56px, 8vw, 100px) clamp(24px, 5vw, 80px)', background: BG }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <EditorialHeading
            label="Around the World"
            title="Destinations"
            intro="Discover the world's most inspiring wedding destinations."
            light={isLight}
            titleSize="medium"
            onViewAll={() => goCategory('destinations')}
          />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 'clamp(20px, 2.5vw, 32px)',
          }}>
            {destinations.map(post => (
              <CardOverlay key={post.id} post={post} onClick={goArticle} tall />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
