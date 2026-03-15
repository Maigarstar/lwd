import { CardStandard } from './PostCards';
import { getMagTheme, FD, FU, GOLD_CONST as GOLD } from '../magazineTheme';

export default function RelatedPosts({ posts = [], onRead, light = false }) {
  if (!posts.length) return null;
  const T = getMagTheme(light);

  return (
    <section style={{ background: T.bg, padding: 'clamp(48px, 7vw, 88px) clamp(24px, 6vw, 80px)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 44 }}>
          <div style={{ width: 24, height: 1, background: GOLD }} />
          <span style={{
            fontFamily: FU, fontSize: 9, fontWeight: 700,
            letterSpacing: '0.25em', textTransform: 'uppercase', color: GOLD,
          }}>
            Further Reading
          </span>
          <div style={{ flex: 1, height: 1, background: T.border }} />
        </div>

        {/* Grid: minmax increased from 280px to 340px for ~50% larger image footprint */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 'clamp(32px, 4vw, 52px)',
        }}>
          {posts.map(post => (
            <CardStandard key={post.id} post={post} onClick={onRead} light={light} />
          ))}
        </div>
      </div>
    </section>
  );
}
