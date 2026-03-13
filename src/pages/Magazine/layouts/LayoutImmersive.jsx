/**
 * LayoutImmersive — Style 3: Immersive Story Layout
 *
 * Cinematic, full-width storytelling — National Geographic meets Vogue.
 * Full-screen carousel hero, immersive full-width feature blocks with
 * alternating gradients, editorial break, and category spotlights.
 */
import { HeroCarousel } from '../components/HeroModules';
import PostCard, { CardLargeEditorial, CardOverlay, CardMinimal, CardHorizontal } from '../components/PostCards';
import EditorialHeading from '../components/EditorialHeading';
import EditorialBreak from '../components/EditorialBreak';
import SectionHeader from '../components/SectionHeader';
import { getMagTheme, FD, FU, GOLD_CONST as GOLD, FD_LS } from '../magazineTheme';

const CREAM = '#f5f0e8';

/* ── Immersive Feature Block ──────────────────────────────────────────────── */
function ImmersiveBlock({ post, onRead, direction = 'left', isLight }) {
  if (!post) return null;

  const gradientDir = direction === 'left'
    ? 'linear-gradient(to right, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0.15) 100%)'
    : 'linear-gradient(to left, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0.15) 100%)';

  return (
    <section style={{
      position: 'relative', overflow: 'hidden',
      minHeight: 'clamp(420px, 60vw, 680px)',
      display: 'flex', alignItems: direction === 'left' ? 'center' : 'center',
    }}>
      {/* Background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${post.coverImage})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }} />

      {/* Gradient */}
      <div style={{ position: 'absolute', inset: 0, background: gradientDir }} />

      {/* Content */}
      <div style={{
        position: 'relative', width: '100%',
        padding: 'clamp(48px, 7vw, 88px) clamp(24px, 6vw, 100px)',
        display: 'flex',
        justifyContent: direction === 'left' ? 'flex-start' : 'flex-end',
      }}>
        <div style={{ maxWidth: 580 }}>
          {/* Gold label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 24, height: 1, background: GOLD }} />
            <span style={{
              fontFamily: FU, fontSize: 9, fontWeight: 700,
              letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD,
            }}>
              {post.categoryLabel}
            </span>
          </div>

          {/* Headline */}
          <h2 style={{
            fontFamily: FD,
            fontSize: 'clamp(28px, 4.5vw, 56px)',
            fontWeight: 400, color: CREAM,
            margin: '0 0 18px', lineHeight: 1.08,
            letterSpacing: FD_LS,
          }}>
            {post.title}
          </h2>

          {/* Excerpt */}
          <p style={{
            fontFamily: FU,
            fontSize: 'clamp(13px, 1.5vw, 16px)',
            fontWeight: 300, color: 'rgba(245,240,232,0.65)',
            margin: '0 0 28px', lineHeight: 1.65,
            maxWidth: 480,
          }}>
            {post.standfirst || post.excerpt}
          </p>

          {/* CTA */}
          <button
            onClick={() => onRead && onRead(post)}
            style={{
              fontFamily: FU, fontSize: 9, fontWeight: 700,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: '#0a0a0a', background: GOLD,
              border: 'none', padding: '12px 24px',
              cursor: 'pointer', borderRadius: 2,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Read Story
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── Trending Ticker ──────────────────────────────────────────────────────── */
function TrendingTicker({ posts, onRead, isLight }) {
  const T = getMagTheme(isLight);
  if (!posts?.length) return null;

  return (
    <div style={{
      overflow: 'hidden',
      padding: 'clamp(20px, 3vw, 36px) 0',
      borderTop: `1px solid ${T.border}`,
      borderBottom: `1px solid ${T.border}`,
      background: isLight ? '#f0ece3' : '#080806',
    }}>
      <style>{`
        @keyframes tickerScroll { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .mag-ticker { display: flex; animation: tickerScroll 30s linear infinite; width: max-content; }
        .mag-ticker:hover { animation-play-state: paused; }
      `}</style>
      <div className="mag-ticker">
        {/* Double the items for seamless loop */}
        {[...posts, ...posts].map((post, i) => (
          <div
            key={`${post.id}-${i}`}
            onClick={() => onRead && onRead(post)}
            style={{
              padding: '0 clamp(24px, 4vw, 48px)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 14,
              whiteSpace: 'nowrap',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <span style={{
              fontFamily: FU, fontSize: 8, fontWeight: 700,
              letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD,
            }}>
              {post.categoryLabel}
            </span>
            <span style={{
              fontFamily: FD, fontSize: 'clamp(16px, 2vw, 22px)',
              fontWeight: 400, color: T.text,
              letterSpacing: FD_LS,
            }}>
              {post.title}
            </span>
            <span style={{ width: 24, height: 1, background: T.border, flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LayoutImmersive({
  featured, trending, latest, destinations, realWeddings, honeymoons, fashion,
  goArticle, goCategory, isLight, isMobile,
}) {
  const T = getMagTheme(isLight);
  const BG = T.bg;

  return (
    <>
      {/* ── Hero: Full-screen carousel ─────────────────────────────── */}
      <HeroCarousel posts={featured} onRead={goArticle} />

      {/* ── Immersive Feature Blocks ───────────────────────────────── */}
      {latest.slice(0, 3).map((post, i) => (
        <ImmersiveBlock
          key={post.id}
          post={post}
          onRead={goArticle}
          direction={i % 2 === 0 ? 'left' : 'right'}
          isLight={isLight}
        />
      ))}

      {/* ── Trending Ticker ────────────────────────────────────────── */}
      <TrendingTicker posts={trending} onRead={goArticle} isLight={isLight} />

      {/* ── Destinations ───────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(56px, 8vw, 100px) clamp(24px, 5vw, 80px)', background: BG }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <EditorialHeading
            label="Around the World"
            title="Destinations"
            intro="The world's most extraordinary wedding locations."
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

      {/* ── Editorial Break ────────────────────────────────────────── */}
      <EditorialBreak post={featured[3] || realWeddings[0]} onRead={goArticle} isLight={isLight} />

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
              <PostCard key={post.id} post={post} style="standard" onClick={goArticle} light={isLight} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Fashion + Honeymoons split ─────────────────────────────── */}
      <section style={{
        padding: 'clamp(48px, 6vw, 80px) clamp(24px, 5vw, 80px)',
        background: isLight ? '#f0ece3' : '#080806',
        borderTop: `1px solid ${T.border}`,
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: isMobile ? 48 : 60,
            alignItems: 'start',
          }}>
            <div>
              <SectionHeader
                label="Style & Beauty"
                title="Fashion"
                light={isLight}
                onViewAll={() => goCategory('fashion')}
              />
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: 'clamp(16px, 2vw, 24px)',
              }}>
                {fashion.map(post => (
                  <CardOverlay key={post.id} post={post} onClick={goArticle} />
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
    </>
  );
}
