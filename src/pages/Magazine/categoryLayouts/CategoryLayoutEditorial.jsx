/**
 * CategoryLayoutEditorial, Style 2: Story-River Editorial
 *
 * Feels like the feature well of a serious magazine.
 * Structure:
 *   1. Full-screen editorial hero
 *   2. Lead story river, CardHorizontal alternating
 *   3. Visual editorial break
 *   4. 2-column feature grid, CardLargeEditorial
 *   5. Compact minimal list, remaining posts
 *   6. Category explorer strip
 */
import { HeroEditorial } from '../components/HeroModules';
import PostCard, { CardLargeEditorial, CardHorizontal, CardMinimal } from '../components/PostCards';
import SectionHeader from '../components/SectionHeader';
import EditorialBreak from '../components/EditorialBreak';
import { CategoryExplorer } from './CategoryLayoutCurated';
import { getMagTheme, FD, FU, GOLD_CONST as GOLD, FD_LS } from '../magazineTheme';
import { CATEGORIES } from '../data/categories';

export default function CategoryLayoutEditorial({ category, posts = [], coverPost, onRead, onNavigateCategory, isLight = false }) {
  const T = getMagTheme(isLight);

  if (!posts.length) return (
    <EmptyState category={category} isLight={isLight} onNavigateCategory={onNavigateCategory} />
  );

  const cover     = coverPost || posts[0];
  const rest      = posts.filter(p => p.id !== cover.id);
  const river     = rest.slice(0, 6);
  const breakPost = river[2] || cover;
  const features  = rest.slice(6, 10);
  const minimal   = rest.slice(10);

  const relatedCategories = CATEGORIES.filter(c => c.id !== category.id).slice(0, 6);

  return (
    <div style={{ background: T.bg, transition: 'background 0.35s' }}>

      {/* ── 1. Full-screen editorial hero ─────────────────────────────────── */}
      <HeroEditorial
        post={cover}
        onRead={() => onRead(cover.slug)}
        minHeight="90svh"
      />

      {/* ── 2. Story river ────────────────────────────────────────────────── */}
      {river.length > 0 && (
        <section style={{
          padding: 'clamp(56px, 7vw, 88px) clamp(24px, 5vw, 80px)',
          maxWidth: 1440, margin: '0 auto',
        }}>
          <SectionHeader
            label={category.label}
            title="The Stories"
            isLight={isLight}
          />
          <div style={{ marginTop: 'clamp(28px, 4vw, 44px)' }}>
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

      {/* ── 3. Editorial break ────────────────────────────────────────────── */}
      <EditorialBreak
        post={breakPost}
        onRead={() => onRead(breakPost.slug)}
        isLight={isLight}
        label={category.label}
      />

      {/* ── 4. 2-column feature grid ──────────────────────────────────────── */}
      {features.length > 0 && (
        <section style={{ padding: 'clamp(56px, 7vw, 88px) clamp(24px, 5vw, 80px)', maxWidth: 1440, margin: '0 auto' }}>
          <SectionHeader label="Also in this section" title="Further Features" isLight={isLight} />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 'clamp(28px, 4vw, 48px)',
            marginTop: 'clamp(28px, 4vw, 40px)',
          }}>
            {features.map(post => (
              <CardLargeEditorial key={post.id} post={post} onClick={slug => onRead(slug)} light={isLight} />
            ))}
          </div>
        </section>
      )}

      {/* ── 5. Compact minimal list ───────────────────────────────────────── */}
      {minimal.length > 0 && (
        <section style={{
          padding: '0 clamp(24px, 5vw, 80px) clamp(56px, 7vw, 88px)',
          maxWidth: 1440, margin: '0 auto',
        }}>
          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 'clamp(36px, 5vw, 52px)' }}>
            <SectionHeader label="More" title="From the Archive" isLight={isLight} />
            <div style={{ marginTop: 24 }}>
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
