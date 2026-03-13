/**
 * CategoryLayoutCurated — Balanced editorial section front.
 *
 * Feels like a curated magazine section — not a blog archive.
 * Structure:
 *   1. Split-screen category hero with cover post
 *   2. "In This Section" — 3 featured cards
 *   3. Story river — alternating horizontal cards
 *   4. Visual pull-quote break
 *   5. Secondary grid — remaining posts
 *   6. Category explorer strip
 */
import { HeroSplitScreen } from '../components/HeroModules';
import PostCard, { CardLargeEditorial, CardOverlay, CardHorizontal, CardMinimal } from '../components/PostCards';
import SectionHeader from '../components/SectionHeader';
import EditorialBreak from '../components/EditorialBreak';
import { getMagTheme, FD, FU, GOLD_CONST as GOLD } from '../magazineTheme';
import { CATEGORIES } from '../data/categories';

const CREAM = '#f5f0e8';

export default function CategoryLayoutCurated({ category, posts = [], coverPost, onRead, onNavigateCategory, isLight = false }) {
  const T = getMagTheme(isLight);

  if (!posts.length) return <EmptyState category={category} isLight={isLight} onNavigateCategory={onNavigateCategory} />;

  // Derive post sets
  const cover   = coverPost || posts[0];
  const rest    = posts.filter(p => p.id !== cover.id);
  const picks   = rest.slice(0, 3);
  const river   = rest.slice(3, 8);
  const grid    = rest.slice(8);
  const pullQuote = river[0] || picks[0];

  const relatedCategories = CATEGORIES.filter(c => c.id !== category.id).slice(0, 6);

  return (
    <div style={{ background: T.bg, transition: 'background 0.35s' }}>

      {/* ── 1. Category hero with split screen ─────────────────────────────── */}
      <HeroSplitScreen post={cover} onRead={() => onRead(cover.slug)} imageRight={false} />

      {/* Category descriptor bar */}
      <div style={{
        padding: 'clamp(24px, 3vw, 36px) clamp(24px, 5vw, 80px)',
        borderBottom: `1px solid ${T.border}`,
        background: T.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <div style={{
            fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: GOLD, marginBottom: 6,
          }}>
            {category.label}
          </div>
          <p style={{ fontFamily: FU, fontSize: 13, fontWeight: 300, color: T.muted, margin: 0, maxWidth: 540, lineHeight: 1.6 }}>
            {category.description}
          </p>
        </div>
        <div style={{ fontFamily: FU, fontSize: 10, color: T.subtle, letterSpacing: '0.1em' }}>
          {posts.length} {posts.length === 1 ? 'story' : 'stories'}
        </div>
      </div>

      {/* ── 2. In This Section — 3 featured cards ──────────────────────────── */}
      {picks.length > 0 && (
        <section style={{ padding: 'clamp(48px, 6vw, 72px) clamp(24px, 5vw, 80px)', maxWidth: 1440, margin: '0 auto' }}>
          <SectionHeader
            label="In This Section"
            title="Editor's Selection"
            isLight={isLight}
          />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'clamp(24px, 3vw, 40px)',
            marginTop: 'clamp(24px, 3vw, 36px)',
          }}>
            {picks.map(post => (
              <CardLargeEditorial key={post.id} post={post} onClick={slug => onRead(slug)} light={isLight} />
            ))}
          </div>
        </section>
      )}

      {/* ── 3. Story river ─────────────────────────────────────────────────── */}
      {river.length > 0 && (
        <section style={{
          padding: '0 clamp(24px, 5vw, 80px) clamp(48px, 6vw, 72px)',
          maxWidth: 1440, margin: '0 auto',
        }}>
          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 'clamp(40px, 5vw, 60px)' }}>
            <SectionHeader label="Latest" title="From the Archive" isLight={isLight} />
            <div style={{ marginTop: 'clamp(24px, 3vw, 32px)' }}>
              {river.map((post, i) => (
                <div key={post.id}>
                  <CardHorizontal
                    post={post}
                    onClick={slug => onRead(slug)}
                    light={isLight}
                    imageRight={i % 2 === 1}
                  />
                  {i < river.length - 1 && (
                    <div style={{ height: 1, background: T.border, margin: '0' }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 4. Editorial break — pull quote from a story ───────────────────── */}
      {pullQuote && (
        <EditorialBreak post={pullQuote} onRead={() => onRead(pullQuote.slug)} isLight={isLight} label={category.label} />
      )}

      {/* ── 5. Secondary grid ──────────────────────────────────────────────── */}
      {grid.length > 0 && (
        <section style={{ padding: 'clamp(48px, 6vw, 72px) clamp(24px, 5vw, 80px)', maxWidth: 1440, margin: '0 auto' }}>
          <SectionHeader label="More Stories" title="Further Reading" isLight={isLight} />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 'clamp(24px, 3vw, 40px)',
            marginTop: 'clamp(24px, 3vw, 36px)',
          }}>
            {grid.map(post => (
              <PostCard key={post.id} post={post} style="standard" onClick={slug => onRead(slug)} light={isLight} />
            ))}
          </div>
        </section>
      )}

      {/* ── 6. Explore other categories ────────────────────────────────────── */}
      <CategoryExplorer categories={relatedCategories} onNavigate={onNavigateCategory} isLight={isLight} />
    </div>
  );
}

/* ─── Shared: Category Explorer Strip ─────────────────────────────────────── */
export function CategoryExplorer({ categories, onNavigate, isLight }) {
  const T = getMagTheme(isLight);
  return (
    <section style={{
      padding: 'clamp(48px, 6vw, 72px) clamp(24px, 5vw, 80px)',
      borderTop: `1px solid ${T.border}`,
      background: isLight ? '#f4f1ec' : '#080806',
    }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 24, height: 1, background: GOLD }} />
          <span style={{ fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD }}>
            Explore More
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => onNavigate && onNavigate(cat.id)}
              style={{
                flexShrink: 0,
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
      </div>
    </section>
  );
}

/* ─── Empty state ──────────────────────────────────────────────────────────── */
function EmptyState({ category, isLight, onNavigateCategory }) {
  const T = getMagTheme(isLight);
  const related = CATEGORIES.filter(c => c.id !== category.id).slice(0, 4);
  return (
    <div style={{ background: T.bg, minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(48px, 8vw, 88px) clamp(24px, 5vw, 80px)' }}>
      <div style={{ width: 24, height: 1, background: GOLD, marginBottom: 24 }} />
      <h2 style={{ fontFamily: FD, fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 400, color: T.text, margin: '0 0 12px', textAlign: 'center' }}>
        Stories Coming Soon
      </h2>
      <p style={{ fontFamily: FU, fontSize: 14, color: T.muted, margin: '0 0 40px', textAlign: 'center', maxWidth: 400, lineHeight: 1.65 }}>
        We're curating the finest stories for this section. Check back soon.
      </p>
      <CategoryExplorer categories={related} onNavigate={onNavigateCategory} isLight={isLight} />
    </div>
  );
}
