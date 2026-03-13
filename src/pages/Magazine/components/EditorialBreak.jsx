/**
 * EditorialBreak — Full-width cinematic feature band.
 * Background image with dark gradient overlay, editorial label,
 * display headline, intro text, and "Read the Feature" CTA.
 *
 * Extracted from MagazineHomePage for reuse across all layout variants.
 */
import { getMagTheme, FD, FU, GOLD_CONST as GOLD, FD_LS } from '../magazineTheme';

const CREAM = '#f5f0e8';

export default function EditorialBreak({ post, onRead, label = 'Feature', isLight = false }) {
  if (!post) return null;

  return (
    <section style={{
      position: 'relative', overflow: 'hidden',
      minHeight: 'clamp(380px, 55vw, 600px)',
      display: 'flex', alignItems: 'center',
    }}>
      {/* Background image */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${post.coverImage})`,
        backgroundSize: 'cover', backgroundPosition: 'center 35%',
      }} />

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(105deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.15) 100%)',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        padding: 'clamp(48px, 7vw, 88px) clamp(24px, 6vw, 100px)',
        maxWidth: 640,
      }}>
        {/* Gold label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <div style={{ width: 24, height: 1, background: GOLD }} />
          <span style={{
            fontFamily: FU, fontSize: 8, fontWeight: 700,
            letterSpacing: '0.26em', textTransform: 'uppercase', color: GOLD,
          }}>
            {label}
          </span>
        </div>

        {/* Display headline */}
        <h2 style={{
          fontFamily: FD,
          fontSize: 'clamp(28px, 4.5vw, 60px)',
          fontWeight: 400, color: CREAM,
          margin: '0 0 18px', lineHeight: 1.08,
          letterSpacing: FD_LS,
        }}>
          {post.title}
        </h2>

        {/* Intro text */}
        <p style={{
          fontFamily: FU,
          fontSize: 'clamp(13px, 1.5vw, 16px)',
          fontWeight: 300, color: 'rgba(245,240,232,0.62)',
          margin: '0 0 32px', lineHeight: 1.65, maxWidth: 480,
        }}>
          {post.standfirst || post.excerpt}
        </p>

        {/* CTA */}
        <button
          onClick={() => onRead && onRead(post)}
          style={{
            fontFamily: FU, fontSize: 9, fontWeight: 700,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: CREAM, background: 'transparent',
            border: '1px solid rgba(245,240,232,0.4)',
            padding: '13px 28px', cursor: 'pointer',
            borderRadius: 2, transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,240,232,0.1)'; e.currentTarget.style.borderColor = CREAM; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(245,240,232,0.4)'; }}
        >
          Read the Feature
        </button>
      </div>
    </section>
  );
}
