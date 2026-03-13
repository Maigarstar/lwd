/**
 * CategoryLayoutGrid — Style 3: Visual Magazine Grid
 *
 * Bold, image-first editorial grid. Dense mosaic layout —
 * Vogue.com meets T Magazine. Lead posts in hero grid, rest
 * in uniform overlay cards, with a feature band mid-section.
 * Structure:
 *   1. HeroMagazineGrid — editorial 2-3 mosaic
 *   2. Overlay card grid — remaining posts
 *   3. Editorial break
 *   4. Minimal story list
 *   5. Category explorer strip
 */
import { HeroMagazineGrid } from '../components/HeroModules';
import PostCard, { CardOverlay, CardMinimal } from '../components/PostCards';
import SectionHeader from '../components/SectionHeader';
import EditorialBreak from '../components/EditorialBreak';
import { CategoryExplorer } from './CategoryLayoutCurated';
import { getMagTheme, FD, FU, GOLD_CONST as GOLD, FD_LS } from '../magazineTheme';
import { CATEGORIES } from '../data/categories';

export default function CategoryLayoutGrid({ category, posts = [], coverPost, onRead, onNavigateCategory, isLight = false }) {
  const T = getMagTheme(isLight);

  if (!posts.length) return (
    <EmptyState category={category} isLight={isLight} onNavigateCategory={onNavigateCategory} />
  );

  // HeroMagazineGrid uses the first 4-5 posts
  const heroCount      = 5;
  const heroPosts      = posts.slice(0, heroCount);
  const cover          = coverPost || posts[0];
  const overlayPosts   = posts.filter(p => p.id !== cover.id).slice(heroCount - 1, heroCount + 11);
  const breakPost      = posts[Math.floor(posts.length / 2)] || posts[0];
  const minimalPosts   = posts.slice(heroCount + 11);

  const relatedCategories = CATEGORIES.filter(c => c.id !== category.id).slice(0, 6);

  return (
    <div style={{ background: T.bg, transition: 'background 0.35s' }}>

      {/* ── 1. Hero magazine grid ─────────────────────────────────────────── */}
      <HeroMagazineGrid posts={heroPosts} onRead={goPost => onRead(goPost.slug || goPost)} />

      {/* Category descriptor bar */}
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
          <span style={{ fontFamily: FU, fontSize: 12, fontWeight: 300, color: T.muted }}>
            {category.description}
          </span>
        </div>
        <span style={{ fontFamily: FU, fontSize: 10, color: T.subtle, letterSpacing: '0.1em' }}>
          {posts.length} {posts.length === 1 ? 'story' : 'stories'}
        </span>
      </div>

      {/* ── 2. Overlay card grid ──────────────────────────────────────────── */}
      {overlayPosts.length > 0 && (
        <section style={{ padding: 'clamp(40px, 5vw, 64px) clamp(24px, 5vw, 80px)', maxWidth: 1440, margin: '0 auto' }}>
          <SectionHeader label="All Stories" title={category.label} isLight={isLight} />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 'clamp(16px, 2vw, 24px)',
            marginTop: 'clamp(24px, 3vw, 36px)',
          }}>
            {overlayPosts.map(post => (
              <CardOverlay key={post.id} post={post} onClick={p => onRead(p.slug || p)} tall />
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

      {/* ── 4. Minimal story list ─────────────────────────────────────────── */}
      {minimalPosts.length > 0 && (
        <section style={{
          padding: 'clamp(40px, 5vw, 64px) clamp(24px, 5vw, 80px)',
          maxWidth: 1440, margin: '0 auto',
        }}>
          <SectionHeader label="More Stories" title="From the Archive" isLight={isLight} />
          <div style={{ marginTop: 24 }}>
            {minimalPosts.map((post, i) => (
              <div key={post.id}>
                <CardMinimal post={post} onClick={slug => onRead(slug)} light={isLight} />
                {i < minimalPosts.length - 1 && (
                  <div style={{ height: 1, background: T.border }} />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

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
