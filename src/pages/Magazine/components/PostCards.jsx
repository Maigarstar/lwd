// Luxury post card system, 5 styles + smart router
import { getMagTheme, FD, FU, GOLD_CONST as GOLD } from '../magazineTheme';

const CREAM = '#f5f0e8';

function formatDate(d) {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function Meta({ post, T }) {
  const parts = [
    post.author?.name,
    formatDate(post.date),
    post.readingTime ? `${post.readingTime} min` : null,
  ].filter(Boolean);
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      {parts.map((part, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {i > 0 && <span style={{ color: T.subtle, fontSize: 8 }}>·</span>}
          <span style={{ fontFamily: FU, fontSize: 10, color: T.muted, letterSpacing: '0.06em' }}>{part}</span>
        </span>
      ))}
    </div>
  );
}

// ── Style 1: Large Editorial Card ─────────────────────────────────────────────
export function CardLargeEditorial({ post, onClick, light = false }) {
  const T = getMagTheme(light);
  return (
    <article style={{ cursor: 'pointer', background: T.card }} onClick={() => onClick && onClick(post)}>
      <style>{`.cle-img:hover { transform: scale(1.04) !important; }`}</style>
      <div style={{ overflow: 'hidden', marginBottom: 22 }}>
        <div className="cle-img" style={{
          width: '100%', aspectRatio: '16 / 9',
          backgroundImage: `url(${post.coverImage})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          transition: 'transform 0.7s ease',
        }} />
      </div>
      <div style={{ padding: '0 0 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <span style={{
            fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: GOLD,
          }}>
            {post.categoryLabel}
          </span>
          <div style={{ flex: 1, height: 1, background: T.goldDim }} />
        </div>
        <h2 style={{
          fontFamily: FD, fontSize: 'clamp(24px, 2.8vw, 38px)',
          fontWeight: 400, color: T.text,
          margin: '0 0 14px', lineHeight: 1.1,
          letterSpacing: '-0.02em',
        }}>
          {post.title}
        </h2>
        <p style={{
          fontFamily: FU, fontSize: 14, fontWeight: 300,
          color: T.muted, margin: '0 0 18px', lineHeight: 1.65,
          display: '-webkit-box', WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {post.excerpt}
        </p>
        <Meta post={post} T={T} />
      </div>
    </article>
  );
}

// ── Style 2: Standard Magazine Card ──────────────────────────────────────────
export function CardStandard({ post, onClick, light = false }) {
  const T = getMagTheme(light);
  return (
    <article style={{ cursor: 'pointer' }} onClick={() => onClick && onClick(post)}>
      <style>{`.csm-img:hover { transform: scale(1.05) !important; }`}</style>
      {/* Aspect ratio increased from 3/2 to 4/3, ~33% taller image */}
      <div style={{ overflow: 'hidden', borderRadius: 2, marginBottom: 18 }}>
        <div className="csm-img" style={{
          width: '100%', aspectRatio: '4 / 3',
          backgroundImage: `url(${post.coverImage})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          transition: 'transform 0.6s ease',
        }} />
      </div>
      <span style={{
        fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.2em',
        textTransform: 'uppercase', color: GOLD, display: 'block', marginBottom: 10,
      }}>
        {post.categoryLabel}
      </span>
      <h3 style={{
        fontFamily: FD, fontSize: 'clamp(20px, 2.2vw, 28px)',
        fontWeight: 400, color: T.text,
        margin: '0 0 10px', lineHeight: 1.15,
        letterSpacing: '-0.02em',
      }}>
        {post.title}
      </h3>
      <p style={{
        fontFamily: FU, fontSize: 13, fontWeight: 300,
        color: T.muted, margin: '0 0 14px', lineHeight: 1.6,
        display: '-webkit-box', WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {post.excerpt}
      </p>
      <Meta post={post} T={T} />
    </article>
  );
}

// ── Style 3: Minimal Text-Led Card ───────────────────────────────────────────
export function CardMinimal({ post, index, onClick, light = false }) {
  const T = getMagTheme(light);
  return (
    <article style={{
      cursor: 'pointer', padding: '20px 0',
      borderBottom: `1px solid ${T.border}`,
      display: 'flex', gap: 16, alignItems: 'flex-start',
    }} onClick={() => onClick && onClick(post)}>
      {/* Thumbnail, responsive image on trending cards */}
      {post.coverImage && (
        <div style={{
          width: 'clamp(56px, 12vw, 80px)', height: 'clamp(42px, 9vw, 60px)', flexShrink: 0, overflow: 'hidden',
          borderRadius: 2, backgroundImage: `url(${post.coverImage})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        }} />
      )}
      <div style={{ flex: 1, display: 'flex', gap: 'clamp(8px, 2vw, 14px)', alignItems: 'flex-start', minWidth: 0 }}>
        {index !== undefined && (
          <span style={{
            fontFamily: FD, fontSize: 'clamp(22px, 3.2vw, 38px)',
            fontWeight: 400, color: `${GOLD}40`,
            lineHeight: 1, flexShrink: 0, minWidth: 'clamp(28px, 5vw, 38px)', marginTop: -2,
          }}>
            {String(index + 1).padStart(2, '0')}
          </span>
        )}
        <div style={{ flex: 1 }}>
          <span style={{
            fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: GOLD, display: 'block', marginBottom: 7,
          }}>
            {post.categoryLabel}
          </span>
          <h3 style={{
            fontFamily: FD, fontSize: 'clamp(16px, 1.8vw, 21px)',
            fontWeight: 400, color: T.text,
            margin: '0 0 7px', lineHeight: 1.2,
          }}>
            {post.title}
          </h3>
          <span style={{ fontFamily: FU, fontSize: 10, color: T.subtle, letterSpacing: '0.06em' }}>
            {post.author?.name} · {post.readingTime} min
          </span>
        </div>
      </div>
    </article>
  );
}

// ── Style 4: Overlay Image Card ───────────────────────────────────────────────
export function CardOverlay({ post, onClick, tall = false, light = false }) {
  return (
    <article style={{
      position: 'relative', overflow: 'hidden', borderRadius: 2, cursor: 'pointer',
      aspectRatio: tall ? '3 / 4' : '4 / 3',
    }} onClick={() => onClick && onClick(post)}>
      <style>{`.co-img:hover { transform: scale(1.06) !important; }`}</style>
      <div className="co-img" style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${post.coverImage})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        transition: 'transform 0.7s ease',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: 'clamp(16px, 2.5vw, 24px)',
      }}>
        <span style={{
          fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: GOLD, display: 'block', marginBottom: 8,
        }}>
          {post.categoryLabel}
        </span>
        <h3 style={{
          fontFamily: FD, fontSize: 'clamp(17px, 2vw, 24px)',
          fontWeight: 400, color: CREAM,
          margin: '0 0 8px', lineHeight: 1.15,
          letterSpacing: '-0.02em',
        }}>
          {post.title}
        </h3>
        <span style={{ fontFamily: FU, fontSize: 10, color: 'rgba(245,240,232,0.4)', letterSpacing: '0.06em' }}>
          {post.readingTime} min read
        </span>
      </div>
    </article>
  );
}

// ── Style 5: Horizontal Feature Card ─────────────────────────────────────────
// Image size increased from 120×120 to 180×180 (+50%)
export function CardHorizontal({ post, onClick, light = false, imageRight = false }) {
  const T = getMagTheme(light);
  const imgSize = 'clamp(100px, 25vw, 180px)';
  return (
    <article style={{
      display: 'grid', gridTemplateColumns: imageRight ? `1fr ${imgSize}` : `${imgSize} 1fr`,
      gap: 'clamp(12px, 2vw, 18px)', cursor: 'pointer', background: T.card, padding: '16px 0',
      borderBottom: `1px solid ${T.border}`,
    }} onClick={() => onClick && onClick(post)}>
      <style>{`.ch-img:hover { transform: scale(1.06) !important; }`}</style>
      <div style={{ overflow: 'hidden', borderRadius: 2, order: imageRight ? 2 : 1, aspectRatio: '1 / 1' }}>
        <div className="ch-img" style={{
          width: '100%', height: '100%',
          backgroundImage: `url(${post.coverImage})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          transition: 'transform 0.6s ease',
        }} />
      </div>
      <div style={{ order: imageRight ? 1 : 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
        <span style={{
          fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: GOLD,
        }}>
          {post.categoryLabel}
        </span>
        <h3 style={{
          fontFamily: FD, fontSize: 'clamp(16px, 1.8vw, 21px)',
          fontWeight: 400, color: T.text, margin: 0, lineHeight: 1.2,
          display: '-webkit-box', WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {post.title}
        </h3>
        {post.excerpt && (
          <p style={{
            fontFamily: FU, fontSize: 12, color: T.muted, margin: 0, lineHeight: 1.55,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {post.excerpt}
          </p>
        )}
        <span style={{ fontFamily: FU, fontSize: 10, color: T.subtle, letterSpacing: '0.06em' }}>
          {post.readingTime} min
        </span>
      </div>
    </article>
  );
}

// ── Smart PostCard router ─────────────────────────────────────────────────────
export default function PostCard({ post, style = 'standard', onClick, index, light = false, tall = false }) {
  switch (style) {
    case 'editorial':   return <CardLargeEditorial post={post} onClick={onClick} light={light} />;
    case 'minimal':     return <CardMinimal post={post} index={index} onClick={onClick} light={light} />;
    case 'overlay':     return <CardOverlay post={post} onClick={onClick} tall={tall} light={light} />;
    case 'horizontal':  return <CardHorizontal post={post} onClick={onClick} light={light} />;
    default:            return <CardStandard post={post} onClick={onClick} light={light} />;
  }
}
