/**
 * LayoutEditorial — Style 1: Editorial Magazine Cover
 *
 * Condé Nast Traveller feel — one dominant cover story commands attention.
 * Full-width cinematic hero, two-up secondary cards, story river with
 * alternating image positions, editorial break, and category spotlights.
 */
import { HeroEditorial } from '../components/HeroModules';
import { CardLargeEditorial, CardOverlay, CardHorizontal, CardMinimal } from '../components/PostCards';
import EditorialHeading from '../components/EditorialHeading';
import EditorialBreak from '../components/EditorialBreak';
import SectionHeader from '../components/SectionHeader';
import { getMagTheme, FD, FU, GOLD_CONST as GOLD, FD_LS } from '../magazineTheme';

export default function LayoutEditorial({
  featured, trending, latest, destinations, realWeddings, honeymoons, fashion,
  goArticle, goCategory, isLight, isMobile,
}) {
  const T = getMagTheme(isLight);
  const BG = T.bg;
  const BG2 = isLight ? '#f0ece3' : '#080806';

  return (
    <>
      {/* ── Hero: Full-width editorial statement ──────────────────── */}
      <HeroEditorial post={featured[0]} onRead={goArticle} />

      {/* ── Two-Up Secondary Features ─────────────────────────────── */}
      <section style={{ padding: 'clamp(56px, 8vw, 100px) clamp(24px, 5vw, 80px)', background: BG }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <EditorialHeading
            label="Also in This Issue"
            title="Editor's Selection"
            light={isLight}
            titleSize="medium"
          />
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: 'clamp(28px, 4vw, 56px)',
          }}>
            {featured.slice(1, 3).map(post => (
              <CardLargeEditorial key={post.id} post={post} onClick={goArticle} light={isLight} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Editorial Break ────────────────────────────────────────── */}
      <EditorialBreak
        post={featured[3] || latest[0]}
        onRead={goArticle}
        label="Cover Feature"
        isLight={isLight}
      />

      {/* ── Story River — Alternating horizontal cards ─────────────── */}
      <section style={{ padding: 'clamp(56px, 8vw, 100px) clamp(24px, 5vw, 80px)', background: BG }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <EditorialHeading
            label="From the Magazine"
            title="Latest Stories"
            intro="Long-form editorial features and in-depth reporting."
            light={isLight}
            titleSize="medium"
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {latest.slice(0, 5).map((post, i) => (
              <div key={post.id}>
                <CardHorizontal
                  post={post}
                  onClick={goArticle}
                  light={isLight}
                  imageRight={i % 2 === 1}
                />
                {i < Math.min(latest.length, 5) - 1 && (
                  <div style={{
                    height: 1,
                    background: `linear-gradient(90deg, transparent, ${GOLD}30, transparent)`,
                    margin: '8px 0',
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Destinations — Tall overlay cards ──────────────────────── */}
      <section style={{ padding: '0 clamp(24px, 5vw, 80px) clamp(56px, 8vw, 100px)', background: BG }}>
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

      {/* ── Trending + Fashion split ───────────────────────────────── */}
      <section style={{
        padding: 'clamp(48px, 6vw, 80px) clamp(24px, 5vw, 80px)',
        background: BG2,
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
            {/* Trending */}
            <div>
              <SectionHeader label="Right Now" title="Trending" light={isLight} />
              <div>
                {trending.map((post, i) => (
                  <CardMinimal key={post.id} post={post} index={i} onClick={goArticle} light={isLight} />
                ))}
              </div>
            </div>
            {/* Fashion */}
            <div>
              <SectionHeader
                label="Style & Beauty"
                title="Fashion"
                light={isLight}
                onViewAll={() => goCategory('fashion')}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {fashion.map(post => (
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
