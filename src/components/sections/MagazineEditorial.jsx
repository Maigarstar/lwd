// ─── Magazine Editorial Section ─────────────────────────────────────────────
// Large feature article + 3 secondary cards in a luxury editorial layout.
// Featured posts (post.featured === true) appear first.
import { POSTS } from '../../pages/Magazine/data/posts';

const FD = "'Gilda Display', 'Playfair Display', Georgia, serif";
const FU = "'Nunito', 'Inter', 'Helvetica Neue', sans-serif";
const GOLD = '#c9a96e';

function CategoryLabel({ label }) {
  return (
    <span style={{ fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD }}>
     , {label}
    </span>
  );
}

// ── Hero feature card ──────────────────────────────────────────────────────────
function FeatureCard({ post, onClick }) {
  return (
    <article onClick={onClick} style={{ cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ overflow: 'hidden', borderRadius: 2, flex: '0 0 auto', aspectRatio: '16/10' }}>
        <img
          src={post.coverImage}
          alt={post.coverImageAlt || post.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.55s ease', display: 'block' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        />
      </div>
      <div style={{ paddingTop: 20, flex: 1 }}>
        <CategoryLabel label={post.categoryLabel} />
        <h2 style={{ fontFamily: FD, fontSize: 'clamp(24px, 2.8vw, 36px)', fontWeight: 400, color: '#f5f0e8', margin: '8px 0 10px', lineHeight: 1.08, letterSpacing: '-0.02em' }}>
          {post.title}
        </h2>
        {post.standfirst && (
          <p style={{ fontFamily: FD, fontSize: 14, fontStyle: 'italic', color: 'rgba(245,240,232,0.58)', lineHeight: 1.6, margin: '0 0 14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {post.standfirst}
          </p>
        )}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          {post.author?.name && <span style={{ fontFamily: FU, fontSize: 10, color: 'rgba(245,240,232,0.4)' }}>{post.author.name}</span>}
          {post.readingTime && <span style={{ fontFamily: FU, fontSize: 10, color: 'rgba(245,240,232,0.27)' }}>{post.readingTime} min read</span>}
        </div>
      </div>
    </article>
  );
}

// ── Small secondary card ───────────────────────────────────────────────────────
function SecondaryCard({ post, onClick, last }) {
  return (
    <article
      onClick={onClick}
      style={{
        cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'flex-start',
        paddingBottom: last ? 0 : 20,
        borderBottom: last ? 'none' : '1px solid rgba(245,240,232,0.07)',
      }}
    >
      <div style={{ width: 126, height: 96, flexShrink: 0, overflow: 'hidden', borderRadius: 2 }}>
        <img
          src={post.coverImage}
          alt={post.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.07)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <CategoryLabel label={post.categoryLabel} />
        <h3 style={{ fontFamily: FD, fontSize: 16, fontWeight: 400, color: '#f5f0e8', margin: '5px 0 6px', lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {post.title}
        </h3>
        {post.readingTime && (
          <span style={{ fontFamily: FU, fontSize: 9, color: 'rgba(245,240,232,0.28)', letterSpacing: '0.06em' }}>{post.readingTime} min read</span>
        )}
      </div>
    </article>
  );
}

// ── Section ────────────────────────────────────────────────────────────────────
export default function MagazineEditorial({ onViewMagazine, onViewMagazineArticle }) {
  const ordered = [...POSTS.filter(p => p.featured), ...POSTS.filter(p => !p.featured)];
  const feature   = ordered[0];
  const secondary = ordered.slice(1, 4);

  if (!feature) return null;

  return (
    <section style={{ background: '#09090a', borderTop: '1px solid rgba(201,169,110,0.1)', borderBottom: '1px solid rgba(201,169,110,0.1)', padding: 'clamp(48px, 6vw, 80px) clamp(20px, 5vw, 72px)' }}>
      <style>{`
        .me-grid { display: flex; gap: clamp(28px, 4vw, 56px); align-items: flex-start; flex-wrap: wrap; }
        .me-feature { flex: 2 1 320px; min-width: 0; }
        .me-sidebar { flex: 1 1 240px; min-width: 0; display: flex; flex-direction: column; gap: 20px; }
      `}</style>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 'clamp(28px, 4vw, 44px)', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, marginBottom: 6 }}>The Magazine</div>
          <h2 style={{ fontFamily: FD, fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 400, color: '#f5f0e8', margin: 0, lineHeight: 1.05, letterSpacing: '-0.02em' }}>From The Edit</h2>
        </div>
        <button
          onClick={onViewMagazine}
          style={{ fontFamily: FU, fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', background: 'none', border: '1px solid rgba(201,169,110,0.3)', color: GOLD, cursor: 'pointer', padding: '9px 18px', borderRadius: 2, transition: 'all 0.2s', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.background = `${GOLD}14`; e.currentTarget.style.borderColor = `${GOLD}60`; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'rgba(201,169,110,0.3)'; }}
        >
          Explore the Magazine →
        </button>
      </div>

      {/* Grid */}
      <div className="me-grid">
        <div className="me-feature">
          <FeatureCard post={feature} onClick={() => onViewMagazineArticle?.(feature.slug)} />
        </div>
        <div className="me-sidebar">
          {secondary.map((post, i) => (
            <SecondaryCard key={post.id} post={post} last={i === secondary.length - 1} onClick={() => onViewMagazineArticle?.(post.slug)} />
          ))}
          {/* Divider + explore link */}
          <div style={{ borderTop: '1px solid rgba(245,240,232,0.07)', paddingTop: 20 }}>
            <button
              onClick={onViewMagazine}
              style={{ fontFamily: FD, fontSize: 14, fontStyle: 'italic', background: 'none', border: 'none', color: 'rgba(245,240,232,0.38)', cursor: 'pointer', padding: 0, transition: 'color 0.2s', letterSpacing: '0.02em' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f5f0e8'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(245,240,232,0.38)'; }}
            >
              Read all articles in the magazine →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
