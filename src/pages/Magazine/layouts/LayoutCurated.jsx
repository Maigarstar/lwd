/**
 * LayoutCurated — Style 4: Curated Editorial Mix
 *
 * The balanced editorial layout — refined visual rhythm with category sections.
 * Split hero, editor's picks, destinations, editorial break, real weddings,
 * latest stories, trending + honeymoons sidebar, fashion spotlight.
 *
 * Closest to the original MagazineHomePage layout. The "default" style.
 */
import { HeroSplitScreen } from '../components/HeroModules';
import PostCard, { CardLargeEditorial, CardOverlay, CardMinimal, CardHorizontal } from '../components/PostCards';
import EditorialHeading from '../components/EditorialHeading';
import EditorialBreak from '../components/EditorialBreak';
import SectionHeader from '../components/SectionHeader';
import { getMagTheme, FD, FU, GOLD_CONST as GOLD } from '../magazineTheme';

export default function LayoutCurated({
  featured, trending, latest, destinations, realWeddings, honeymoons, fashion,
  goArticle, goCategory, isLight, isMobile,
}) {
  const T = getMagTheme(isLight);
  const BG = T.bg;
  const BG2 = isLight ? '#f0ece3' : '#080806';
  const border = T.border;

  return (
    <>
      {/* ── Hero: Split Screen ─────────────────────────────────────── */}
      <HeroSplitScreen post={featured[0]} onRead={goArticle} />

      {/* ── Editor's Picks ─────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(56px, 8vw, 100px) clamp(24px, 5vw, 80px)', background: BG }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <EditorialHeading
            label="Curated by the Editors"
            title="The Edit"
            intro="Hand-selected stories from across the world of luxury weddings."
            light={isLight}
            titleSize="medium"
          />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 'clamp(24px, 4vw, 56px)',
          }}>
            {featured.slice(0, 3).map(post => (
              <CardLargeEditorial key={post.id} post={post} onClick={goArticle} light={isLight} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Destinations ───────────────────────────────────────────── */}
      <section style={{ padding: '0 clamp(24px, 5vw, 80px) clamp(56px, 8vw, 100px)', background: BG }}>
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

      {/* ── Editorial Break ────────────────────────────────────────── */}
      <EditorialBreak post={latest[2] || featured[3]} onRead={goArticle} isLight={isLight} />

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

      {/* ── Latest Stories ─────────────────────────────────────────── */}
      <section style={{ padding: '0 clamp(24px, 5vw, 80px) clamp(56px, 8vw, 100px)', background: BG }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <EditorialHeading
            label="From the Magazine"
            title="Latest Stories"
            intro="Fresh perspectives on modern luxury weddings."
            light={isLight}
            titleSize="medium"
          />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 'clamp(28px, 3.5vw, 48px)',
          }}>
            {latest.map(post => (
              <PostCard key={post.id} post={post} style="standard" onClick={goArticle} light={isLight} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Trending + Honeymoons ──────────────────────────────────── */}
      <section style={{
        padding: 'clamp(48px, 6vw, 80px) clamp(24px, 5vw, 80px)',
        background: BG2,
        borderTop: `1px solid ${border}`,
        borderBottom: `1px solid ${border}`,
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

      {/* ── Fashion Spotlight ──────────────────────────────────────── */}
      <section style={{ padding: 'clamp(56px, 8vw, 100px) clamp(24px, 5vw, 80px)', background: BG }}>
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
    </>
  );
}
