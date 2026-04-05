// MagazinePreviewPage — WordPress-style live article preview
// Opened in a new tab from ArticleEditor. Reads draft from sessionStorage.

import { useState, useEffect } from 'react';
import ArticleBody from './components/ArticleBody';
import { getMagTheme, FD, FU, GOLD_CONST as GOLD } from './magazineTheme';

const CREAM = '#f5f0e8';
const PREVIEW_KEY = 'lwd:article-preview';

function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '';
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function MagazinePreviewPage() {
  const [post, setPost] = useState(null);
  const [isLight, setIsLight] = useState(false);
  const T = getMagTheme(isLight);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PREVIEW_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        setPost(data);
        sessionStorage.removeItem(PREVIEW_KEY);
      }
    } catch (e) {
      console.error('Preview read failed', e);
    }
  }, []);

  if (!post) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0804', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontFamily: FD, fontSize: 28, color: 'rgba(201,169,110,0.4)' }}>No preview found.</div>
        <div style={{ fontFamily: FU, fontSize: 11, color: 'rgba(245,240,232,0.25)', letterSpacing: '0.08em' }}>Open a preview from Magazine Studio.</div>
        <button onClick={() => window.close()} style={{ fontFamily: FU, fontSize: 10, color: GOLD, background: 'none', border: `1px solid ${GOLD}40`, padding: '8px 18px', borderRadius: 2, cursor: 'pointer', marginTop: 8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Close Tab</button>
      </div>
    );
  }

  const hasCover = !!post.coverImage;

  return (
    <div style={{ background: T.bg, minHeight: '100vh' }}>
      {/* Preview bar — fixed top */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, height: 40, background: '#1a1510', borderBottom: '1px solid rgba(201,169,110,0.15)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12 }}>
        <div style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, background: `${GOLD}12`, border: `1px solid ${GOLD}28`, borderRadius: 20, padding: '3px 11px', flexShrink: 0 }}>
          ◉ Draft Preview
        </div>
        <div style={{ fontFamily: FU, fontSize: 10, color: 'rgba(245,240,232,0.35)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.03em' }}>
          {post.title || 'Untitled Article'}
        </div>
        <button onClick={() => setIsLight(l => !l)}
          style={{ fontFamily: FU, fontSize: 9, color: 'rgba(245,240,232,0.45)', background: 'none', border: '1px solid rgba(201,169,110,0.12)', padding: '4px 10px', borderRadius: 2, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>
          {isLight ? '☾ Dark' : '☀ Light'}
        </button>
        <button onClick={() => window.close()}
          style={{ fontFamily: FU, fontSize: 9, color: 'rgba(245,240,232,0.45)', background: 'none', border: '1px solid rgba(201,169,110,0.12)', padding: '4px 10px', borderRadius: 2, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>
          ✕ Close
        </button>
      </div>

      {/* Offset for fixed bar */}
      <div style={{ height: 40 }} />

      {/* Hero */}
      <header style={{ position: 'relative', overflow: 'hidden' }}>
        {hasCover ? (
          <>
            <div style={{ height: 'clamp(440px, 65svh, 720px)', backgroundImage: `url(${post.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,8,4,0.92) 0%, rgba(10,8,4,0.4) 45%, rgba(10,8,4,0.08) 100%)' }} />
          </>
        ) : (
          <div style={{ height: 320, background: isLight ? 'linear-gradient(135deg, #e8e2d4, #cfc5b0)' : 'linear-gradient(135deg, #1a1510, #251d11)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: FU, fontSize: 10, color: 'rgba(201,169,110,0.3)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>No cover image set</span>
          </div>
        )}
        <div style={{ position: hasCover ? 'absolute' : 'relative', bottom: 0, left: 0, right: 0, padding: 'clamp(40px, 6vw, 80px) clamp(24px, 8vw, 140px)', maxWidth: 980, margin: '0 auto' }}>
          {post.categoryLabel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 20, height: 1, background: GOLD }} />
              <span style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: GOLD }}>{post.categoryLabel}</span>
            </div>
          )}
          <h1 style={{ fontFamily: FD, fontSize: 'clamp(32px, 5.5vw, 72px)', fontWeight: 400, color: hasCover ? CREAM : T.text, margin: '0 0 20px', lineHeight: 1.04, letterSpacing: '-0.01em' }}>
            {post.title || 'Untitled Article'}
          </h1>
          {post.standfirst && (
            <p style={{ fontFamily: FD, fontSize: 'clamp(16px, 1.8vw, 22px)', fontStyle: 'italic', fontWeight: 300, color: hasCover ? 'rgba(245,240,232,0.72)' : T.muted, margin: '0 0 24px', lineHeight: 1.55, maxWidth: 640 }}>
              {post.standfirst}
            </p>
          )}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            {post.author?.name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {post.author.avatar && (
                  <img src={post.author.avatar} alt={post.author.name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                )}
                <span style={{ fontFamily: FU, fontSize: 11, color: hasCover ? 'rgba(245,240,232,0.6)' : T.muted, letterSpacing: '0.05em' }}>{post.author.name}</span>
              </div>
            )}
            {post.author?.name && (post.publishedAt || post.date) && (
              <span style={{ color: hasCover ? 'rgba(245,240,232,0.22)' : T.border }}>·</span>
            )}
            {(post.publishedAt || post.date) && (
              <span style={{ fontFamily: FU, fontSize: 11, color: hasCover ? 'rgba(245,240,232,0.5)' : T.muted }}>
                {formatDate(post.publishedAt || post.date)}
              </span>
            )}
            {post.readingTime > 0 && (
              <>
                <span style={{ color: hasCover ? 'rgba(245,240,232,0.22)' : T.border }}>·</span>
                <span style={{ fontFamily: FU, fontSize: 11, color: hasCover ? 'rgba(245,240,232,0.5)' : T.muted }}>{post.readingTime} min read</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Body */}
      <article style={{ padding: 'clamp(56px, 8vw, 96px) clamp(24px, 8vw, 140px)' }}>
        {(post.content || []).length > 0
          ? <ArticleBody content={post.content || []} isLight={isLight} />
          : (
            <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: FU, fontSize: 12, color: T.muted, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.4 }}>
              No content blocks yet — add blocks in the editor canvas.
            </div>
          )
        }
      </article>
    </div>
  );
}
