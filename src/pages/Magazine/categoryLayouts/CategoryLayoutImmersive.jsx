/**
 * CategoryLayoutImmersive — Style 4: Cinematic Immersive
 *
 * Full-screen storytelling. Every post is a world you step into.
 * National Geographic meets Vogue. Full-bleed image blocks,
 * alternating gradient directions, and a closing grid.
 * Structure:
 *   1. HeroCarousel — full-screen autoplay
 *   2. Immersive feature blocks — alternating left/right
 *   3. Editorial break
 *   4. Closing story grid
 *   5. Category explorer strip
 */
import { HeroCarousel } from '../components/HeroModules';
import PostCard, { CardOverlay } from '../components/PostCards';
import SectionHeader from '../components/SectionHeader';
import EditorialBreak from '../components/EditorialBreak';
import { CategoryExplorer } from './CategoryLayoutCurated';
import { getMagTheme, FD, FU, GOLD_CONST as GOLD, FD_LS } from '../magazineTheme';
import { CATEGORIES } from '../data/categories';

const CREAM = '#f5f0e8';

/* ── Immersive Feature Block (full-width, image background) ─────────────── */
function ImmersiveBlock({ post, onRead, direction = 'left' }) {
  if (!post) return null;

  const grad = direction === 'left'
    ? 'linear-gradient(to right, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.58) 48%, rgba(0,0,0,0.12) 100%)'
    : 'linear-gradient(to left,  rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.58) 48%, rgba(0,0,0,0.12) 100%)';

  return (
    <section style={{
      position: 'relative', overflow: 'hidden',
      minHeight: 'clamp(440px, 58vw, 680px)',
      display: 'flex', alignItems: 'center',
    }}>
      {/* Background image */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${post.coverImage})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }} />
      {/* Gradient */}
      <div style={{ position: 'absolute', inset: 0, background: grad }} />

      {/* Content */}
      <div style={{
        position: 'relative', width: '100%',
        padding: 'clamp(48px, 7vw, 88px) clamp(24px, 6vw, 100px)',
        display: 'flex',
        justifyContent: direction === 'left' ? 'flex-start' : 'flex-end',
      }}>
        <div style={{ maxWidth: 560 }}>
          {/* Gold label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 24, height: 1, background: GOLD }} />
            <span style={{ fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD }}>
              {post.categoryLabel}
            </span>
          </div>

          {/* Headline */}
          <h2 style={{
            fontFamily: FD, fontSize: 'clamp(28px, 4.5vw, 56px)',
            fontWeight: 400, color: CREAM,
            margin: '0 0 18px', lineHeight: 1.08, letterSpacing: FD_LS,
          }}>
            {post.title}
          </h2>

          {/* Excerpt */}
          <p style={{
            fontFamily: FU, fontSize: 'clamp(13px, 1.4vw, 15px)',
            fontWeight: 300, color: 'rgba(245,240,232,0.62)',
            margin: '0 0 28px', lineHeight: 1.65, maxWidth: 440,
          }}>
            {post.standfirst || post.excerpt}
          </p>

          {/* Meta */}
          <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 28 }}>
            {post.author?.name && (
              <span style={{ fontFamily: FU, fontSize: 10, color: 'rgba(245,240,232,0.45)', letterSpacing: '0.08em' }}>
                {post.author.name}
              </span>
            )}
            {post.readingTime && (
              <span style={{ fontFamily: FU, fontSize: 10, color: 'rgba(245,240,232,0.45)', letterSpacing: '0.08em' }}>
                {post.readingTime} min read
              </span>
            )}
          </div>

          {/* CTA */}
          <button
            onClick={() => onRead && onRead(post.slug)}
            style={{
              fontFamily: FU, fontSize: 9, fontWeight: 700,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: '#0a0a0a', background: GOLD,
              border: 'none', padding: '13px 26px',
              cursor: 'pointer', borderRadius: 2, transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.82'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Read Story
          </button>
        </div>
      </div>
    </section>
  );
}

export default function CategoryLayoutImmersive({ category, posts = [], coverPost, onRead, onNavigateCategory, isLight = false }) {
  const T = getMagTheme(isLight);

  if (!posts.length) return (
    <EmptyState category={category} isLight={isLight} onNavigateCategory={onNavigateCategory} />
  );

  // Carousel takes first 5 (or all if fewer)
  const carouselCount = Math.min(5, posts.length);
  const carousel      = posts.slice(0, carouselCount);
  const immersive     = posts.slice(carouselCount, carouselCount + 4);
  const breakPost     = immersive[1] || carousel[0];
  const grid          = posts.slice(carouselCount + 4);

  const relatedCategories = CATEGORIES.filter(c => c.id !== category.id).slice(0, 6);

  return (
    <div style={{ background: T.bg, transition: 'background 0.35s' }}>

      {/* ── 1. Full-screen carousel hero ──────────────────────────────────── */}
      <HeroCarousel posts={carousel} onRead={post => onRead(post.slug || post)} />

      {/* ── 2. Immersive feature blocks ───────────────────────────────────── */}
      {immersive.map((post, i) => (
        <ImmersiveBlock
          key={post.id}
          post={post}
          onRead={onRead}
          direction={i % 2 === 0 ? 'left' : 'right'}
        />
      ))}

      {/* ── 3. Editorial break ────────────────────────────────────────────── */}
      {breakPost && (
        <EditorialBreak
          post={breakPost}
          onRead={() => onRead(breakPost.slug)}
          isLight={isLight}
          label={category.label}
        />
      )}

      {/* ── 4. Closing story grid ─────────────────────────────────────────── */}
      {grid.length > 0 && (
        <section style={{
          padding: 'clamp(56px, 7vw, 88px) clamp(24px, 5vw, 80px)',
          maxWidth: 1440, margin: '0 auto',
          background: T.bg,
        }}>
          <SectionHeader label="More Stories" title="From the Archive" isLight={isLight} />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 'clamp(16px, 2vw, 24px)',
            marginTop: 'clamp(28px, 4vw, 40px)',
          }}>
            {grid.map(post => (
              <CardOverlay key={post.id} post={post} onClick={p => onRead(p.slug || p)} />
            ))}
          </div>
        </section>
      )}

      {/* ── 5. Category explorer strip ────────────────────────────────────── */}
      <CategoryExplorer categories={relatedCategories} onNavigate={onNavigateCategory} isLight={isLight} />
    </div>
  );
}

function EmptyState({ category, isLight, onNavigateCategory }) {
  const related = CATEGORIES.filter(c => c.id !== category.id).slice(0, 4);
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(48px, 8vw, 88px) clamp(24px, 5vw, 80px)' }}>
      <CategoryExplorer categories={related} onNavigate={onNavigateCategory} isLight={isLight} />
    </div>
  );
}
