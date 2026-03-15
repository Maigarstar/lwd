/**
 * CategoryLayoutPortrait, Style 5: Portrait-First Editorial
 *
 * Designed for fashion, beauty, and portrait-heavy categories.
 * Lead story takes the full left column; four tall portrait cards
 * bleed off the right. Natural for Fashion & Beauty and Trends.
 * Structure:
 *   1. HeroPortrait, lead story + 4 portrait cards
 *   2. Section descriptor bar
 *   3. Story river, CardHorizontal alternating
 *   4. Overlay card grid, 4-column portrait tiles
 *   5. Editorial break
 *   6. Category explorer strip
 */
import { HeroPortrait } from '../components/HeroModules';
import PostCard, { CardOverlay, CardHorizontal } from '../components/PostCards';
import SectionHeader from '../components/SectionHeader';
import EditorialBreak from '../components/EditorialBreak';
import { CategoryExplorer } from './CategoryLayoutCurated';
import { getMagTheme, FD, FU, GOLD_CONST as GOLD, FD_LS } from '../magazineTheme';
import { CATEGORIES } from '../data/categories';

export default function CategoryLayoutPortrait({ category, posts = [], coverPost, onRead, onNavigateCategory, isLight = false }) {
  const T = getMagTheme(isLight);

  if (!posts.length) return (
    <EmptyState category={category} isLight={isLight} onNavigateCategory={onNavigateCategory} />
  );

  // HeroPortrait: lead = posts[0], portrait cards = posts[1..4]
  const heroPosts  = posts.slice(0, 5);
  const river      = posts.slice(5, 10);
  const tiles      = posts.slice(10, 14);
  const breakPost  = river[2] || posts[0];

  const relatedCategories = CATEGORIES.filter(c => c.id !== category.id).slice(0, 6);

  return (
    <div style={{ background: T.bg, transition: 'background 0.35s' }}>

      {/* ── 1. Portrait hero ──────────────────────────────────────────────── */}
      <HeroPortrait posts={heroPosts} onRead={post => onRead(post.slug || post)} />

      {/* ── Section descriptor bar ────────────────────────────────────────── */}
      <div style={{
        padding: 'clamp(20px, 2.5vw, 28px) clamp(24px, 5vw, 80px)',
        borderBottom: `1px solid ${T.border}`,
        background: T.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 20, height: 1, background: GOLD }} />
          <span style={{ fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD }}>
            {category.label}
          </span>
          <span style={{ fontFamily: FU, fontSize: 12, fontWeight: 300, color: T.muted, maxWidth: 500 }}>
            {category.description}
          </span>
        </div>
        <span style={{ fontFamily: FU, fontSize: 10, color: T.subtle, letterSpacing: '0.1em' }}>
          {posts.length} {posts.length === 1 ? 'story' : 'stories'}
        </span>
      </div>

      {/* ── 2. Story river ────────────────────────────────────────────────── */}
      {river.length > 0 && (
        <section style={{
          padding: 'clamp(48px, 6vw, 72px) clamp(24px, 5vw, 80px)',
          maxWidth: 1440, margin: '0 auto',
        }}>
          <SectionHeader label="Latest" title="The Stories" isLight={isLight} />
          <div style={{ marginTop: 'clamp(24px, 3vw, 36px)' }}>
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
        </section>
      )}

      {/* ── 3. Portrait tile grid ─────────────────────────────────────────── */}
      {tiles.length > 0 && (
        <section style={{
          padding: '0 clamp(24px, 5vw, 80px) clamp(48px, 6vw, 72px)',
          maxWidth: 1440, margin: '0 auto',
        }}>
          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 'clamp(36px, 5vw, 52px)' }}>
            <SectionHeader label="Editor's Eye" title="Visual Stories" isLight={isLight} />
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 'clamp(14px, 1.8vw, 20px)',
              marginTop: 'clamp(24px, 3vw, 36px)',
            }}>
              {tiles.map(post => (
                <CardOverlay key={post.id} post={post} onClick={p => onRead(p.slug || p)} tall />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 4. Editorial break ────────────────────────────────────────────── */}
      <EditorialBreak
        post={breakPost}
        onRead={() => onRead(breakPost.slug)}
        isLight={isLight}
        label={category.label}
      />

      {/* ── 5. Explore other categories ───────────────────────────────────── */}
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
