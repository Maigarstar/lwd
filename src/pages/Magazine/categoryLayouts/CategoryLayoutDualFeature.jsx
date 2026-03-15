/**
 * CategoryLayoutDualFeature, Style 6: Dual-Feature Lead
 *
 * Two commanding feature stories share the hero. A bold opening
 * statement for categories where two concurrent stories deserve
 * equal weight, Travel, Real Weddings, Honeymoons.
 * Structure:
 *   1. HeroDualFeature, two side-by-side heroes
 *   2. Section descriptor bar
 *   3. 3-column feature grid, CardLargeEditorial
 *   4. Editorial break
 *   5. Story river, CardHorizontal
 *   6. Dense minimal list
 *   7. Category explorer strip
 */
import { HeroDualFeature } from '../components/HeroModules';
import PostCard, { CardLargeEditorial, CardHorizontal, CardMinimal } from '../components/PostCards';
import SectionHeader from '../components/SectionHeader';
import EditorialBreak from '../components/EditorialBreak';
import { CategoryExplorer } from './CategoryLayoutCurated';
import { getMagTheme, FD, FU, GOLD_CONST as GOLD, FD_LS } from '../magazineTheme';
import { CATEGORIES } from '../data/categories';

export default function CategoryLayoutDualFeature({ category, posts = [], coverPost, onRead, onNavigateCategory, isLight = false }) {
  const T = getMagTheme(isLight);

  if (!posts.length) return (
    <EmptyState category={category} isLight={isLight} onNavigateCategory={onNavigateCategory} />
  );

  // HeroDualFeature consumes first 2 posts
  const heroPosts  = posts.slice(0, 2);
  const features   = posts.slice(2, 5);      // 3-col feature grid
  const breakPost  = posts[5] || posts[0];
  const river      = posts.slice(5, 10);     // CardHorizontal
  const minimal    = posts.slice(10);        // CardMinimal

  const relatedCategories = CATEGORIES.filter(c => c.id !== category.id).slice(0, 6);

  return (
    <div style={{ background: T.bg, transition: 'background 0.35s' }}>

      {/* ── 1. Dual-feature hero ──────────────────────────────────────────── */}
      <HeroDualFeature posts={heroPosts} onRead={post => onRead(post.slug || post)} />

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

      {/* ── 2. 3-column feature grid ──────────────────────────────────────── */}
      {features.length > 0 && (
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
            {features.map(post => (
              <CardLargeEditorial key={post.id} post={post} onClick={slug => onRead(slug)} light={isLight} />
            ))}
          </div>
        </section>
      )}

      {/* ── 3. Editorial break ────────────────────────────────────────────── */}
      <EditorialBreak
        post={breakPost}
        onRead={() => onRead(breakPost.slug)}
        isLight={isLight}
        label={category.label}
      />

      {/* ── 4. Story river ────────────────────────────────────────────────── */}
      {river.length > 0 && (
        <section style={{
          padding: 'clamp(48px, 6vw, 72px) clamp(24px, 5vw, 80px)',
          maxWidth: 1440, margin: '0 auto',
        }}>
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
        </section>
      )}

      {/* ── 5. Dense minimal list ─────────────────────────────────────────── */}
      {minimal.length > 0 && (
        <section style={{
          padding: '0 clamp(24px, 5vw, 80px) clamp(48px, 6vw, 72px)',
          maxWidth: 1440, margin: '0 auto',
        }}>
          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 'clamp(36px, 5vw, 52px)' }}>
            <SectionHeader label="More" title="Every Story" isLight={isLight} />
            <div style={{ marginTop: 20 }}>
              {minimal.map((post, i) => (
                <div key={post.id}>
                  <CardMinimal post={post} onClick={slug => onRead(slug)} light={isLight} />
                  {i < minimal.length - 1 && (
                    <div style={{ height: 1, background: T.border }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 6. Explore other categories ───────────────────────────────────── */}
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
