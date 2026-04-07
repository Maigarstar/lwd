import { useState, useEffect, useRef, useCallback } from 'react';
import { getPostBySlug, getRelatedPosts } from './data/posts';
import { fetchPostBySlug } from '../../services/magazineService';
import ArticleBody from './components/ArticleBody';
import RelatedPosts from './components/RelatedPosts';
import MagazineNav from './components/MagazineNav';
import HomeNav from '../../components/nav/HomeNav';
import NewsletterCapture from './components/NewsletterCapture';
import SeoHead from '../../components/seo/SeoHead';
import JsonLd from '../../components/seo/JsonLd';
import { buildArticleSchema } from '../../utils/structuredData';

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://www.luxuryweddingdirectory.co.uk';

import { getMagTheme, FD, FU, GOLD_CONST as GOLD } from './magazineTheme';

const CREAM = '#f5f0e8';

function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '';
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Reading Progress Bar ─────────────────────────────────────────────────────
function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrollTop = el.scrollTop || document.body.scrollTop;
      const height = el.scrollHeight - el.clientHeight;
      setProgress(height > 0 ? (scrollTop / height) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 2,
      zIndex: 1000, background: 'rgba(0,0,0,0.06)',
    }}>
      <div style={{
        height: '100%', background: GOLD,
        width: `${progress}%`, transition: 'width 0.1s linear',
      }} />
    </div>
  );
}

// ─── Author Card (sidebar) ─────────────────────────────────────────────────────
function AuthorCard({ author, light = false }) {
  const T = getMagTheme(light);
  return (
    <div style={{
      padding: '28px 0',
      borderTop: `1px solid ${T.border}`,
      marginTop: 32,
    }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
        <img
          src={author.avatar}
          alt={author.name}
          style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
        />
        <div>
          <div style={{ fontFamily: FU, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, marginBottom: 3 }}>
            Written by
          </div>
          <div style={{ fontFamily: FD, fontSize: 18, fontWeight: 400, color: T.text }}>{author.name}</div>
          <div style={{ fontFamily: FU, fontSize: 10, color: T.muted, letterSpacing: '0.06em' }}>{author.role}</div>
        </div>
      </div>
      <p style={{ fontFamily: FU, fontSize: 13, fontWeight: 300, color: T.muted, lineHeight: 1.65, margin: 0 }}>
        {author.bio}
      </p>
    </div>
  );
}

// ─── Social Share Row ─────────────────────────────────────────────────────────
function ShareRow({ title, light = false }) {
  const [copied, setCopied] = useState(false);
  const color = light ? 'rgba(30,28,22,0.45)' : 'rgba(245,240,232,0.45)';
  const borderColor = light ? 'rgba(30,28,22,0.12)' : 'rgba(245,240,232,0.1)';

  const copy = () => {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareBtn = (label, onClick) => (
    <button onClick={onClick} style={{
      fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
      textTransform: 'uppercase', color, background: 'transparent',
      border: `1px solid ${borderColor}`, padding: '7px 14px', borderRadius: 2,
      cursor: 'pointer', transition: 'all 0.18s',
    }}
      onMouseEnter={e => { e.currentTarget.style.color = GOLD; e.currentTarget.style.borderColor = `${GOLD}60`; }}
      onMouseLeave={e => { e.currentTarget.style.color = color; e.currentTarget.style.borderColor = borderColor; }}
    >
      {label}
    </button>
  );

  const pinterestShare = () => {
    const url = encodeURIComponent(window.location.href);
    const desc = encodeURIComponent(title);
    window.open(`https://pinterest.com/pin/create/button/?url=${url}&description=${desc}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <span style={{ fontFamily: FU, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color, marginRight: 4 }}>
        Share
      </span>
      {shareBtn('Pinterest', pinterestShare)}
      {shareBtn(copied ? 'Copied!' : 'Copy Link', copy)}
    </div>
  );
}

// ─── Tags Row ─────────────────────────────────────────────────────────────────
function TagsRow({ tags, light = false, onNavigateCategory }) {
  if (!tags?.length) return null;
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 32 }}>
      {tags.map(tag => (
        <button key={tag}
          onClick={() => onNavigateCategory && onNavigateCategory(tag)}
          style={{
            fontFamily: FU, fontSize: 9, fontWeight: 600, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: light ? 'rgba(30,28,22,0.5)' : 'rgba(245,240,232,0.4)',
            border: `1px solid ${light ? 'rgba(30,28,22,0.12)' : 'rgba(245,240,232,0.1)'}`,
            padding: '5px 11px', borderRadius: 2, background: 'none', cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#c9a96e'; e.currentTarget.style.borderColor = 'rgba(201,169,110,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = light ? 'rgba(30,28,22,0.5)' : 'rgba(245,240,232,0.4)'; e.currentTarget.style.borderColor = light ? 'rgba(30,28,22,0.12)' : 'rgba(245,240,232,0.1)'; }}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}

// ─── Sidebar Modules ──────────────────────────────────────────────────────────
function SidebarSection({ title, children }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 16, height: 1, background: GOLD }} />
        <span style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function SidebarPostRow({ post, onClick, light = false }) {
  const T = getMagTheme(light);
  return (
    <div onClick={() => onClick && onClick(post)} style={{
      display: 'flex', gap: 12, alignItems: 'flex-start',
      padding: '14px 0', borderBottom: `1px solid ${T.border}`,
      cursor: 'pointer',
    }}
      onMouseEnter={e => e.currentTarget.querySelector('.sp-title').style.color = GOLD}
      onMouseLeave={e => e.currentTarget.querySelector('.sp-title').style.color = T.text}
    >
      <div style={{
        width: 60, height: 45, flexShrink: 0, borderRadius: 1,
        backgroundImage: `url(${post.coverImage})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }} />
      <div>
        <span style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, display: 'block', marginBottom: 4 }}>
          {post.categoryLabel}
        </span>
        <h4 className="sp-title" style={{
          fontFamily: FD, fontSize: 14, fontWeight: 400, color: T.text,
          margin: 0, lineHeight: 1.3, transition: 'color 0.2s',
        }}>
          {post.title}
        </h4>
      </div>
    </div>
  );
}

// ─── Layout A: Full-Width Editorial ──────────────────────────────────────────
function LayoutFullWidth({ post, relatedPosts, onNavigateArticle, onNavigateHome, onNavigateCategory, onEdit, isLight, onToggleLight, footerNav }) {
  const T = getMagTheme(isLight);
  const goArticle = p => onNavigateArticle && onNavigateArticle(p.slug);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', transition: 'background 0.35s' }}>
      <ReadingProgress />
      <HomeNav darkMode={!isLight} onToggleDark={onToggleLight} hasHero={false} />
      <MagazineNav
        activeCategoryId={post.category}
        onNavigateHome={onNavigateHome}
        onNavigateCategory={onNavigateCategory}
        onNavigateArticle={goArticle}
        onEdit={onEdit}
        isLight={isLight}
        onToggleLight={onToggleLight}
        topOffset={60}
      />

      {/* Hero */}
      <header style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{
          height: 'clamp(440px, 65svh, 720px)',
          backgroundImage: `url(${post.coverImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(10,8,4,0.92) 0%, rgba(10,8,4,0.4) 45%, rgba(10,8,4,0.1) 100%)',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: 'clamp(40px, 6vw, 80px) clamp(24px, 8vw, 140px)',
          maxWidth: 960, margin: '0 auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 20, height: 1, background: GOLD }} />
            <span style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: GOLD }}>
              {post.categoryLabel}
            </span>
          </div>
          <h1 style={{
            fontFamily: FD, fontSize: 'clamp(32px, 5.5vw, 72px)',
            fontWeight: 400, color: CREAM, margin: '0 0 20px', lineHeight: 1.04,
            letterSpacing: '-0.01em',
          }}>
            {post.title}
          </h1>
          {post.standfirst && (
            <p style={{
              fontFamily: FD, fontSize: 'clamp(16px, 1.8vw, 22px)',
              fontStyle: 'italic', fontWeight: 300, color: 'rgba(245,240,232,0.72)',
              margin: '0 0 24px', lineHeight: 1.55, maxWidth: 640,
            }}>
              {post.standfirst}
            </p>
          )}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            {post.author && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src={post.author.avatar} alt={post.author.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                <span style={{ fontFamily: FU, fontSize: 11, color: 'rgba(245,240,232,0.6)', letterSpacing: '0.05em' }}>{post.author.name}</span>
              </div>
            )}
            <span style={{ color: 'rgba(245,240,232,0.25)' }}>·</span>
            <span style={{ fontFamily: FU, fontSize: 11, color: 'rgba(245,240,232,0.5)' }}>{formatDate(post.date)}</span>
            <span style={{ color: 'rgba(245,240,232,0.25)' }}>·</span>
            <span style={{ fontFamily: FU, fontSize: 11, color: 'rgba(245,240,232,0.5)' }}>{post.readingTime} min read</span>
          </div>
        </div>
      </header>

      {/* Article body */}
      <article style={{ padding: 'clamp(56px, 8vw, 96px) clamp(24px, 8vw, 140px)' }}>
        <ArticleBody content={post.content || []} isLight={isLight} />

        {/* Footer row */}
        <div style={{
          maxWidth: 720, margin: '48px auto 0',
          paddingTop: 32, borderTop: `1px solid ${T.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20,
        }}>
          <ShareRow title={post.title} light={isLight} />
          <TagsRow tags={post.tags} light={isLight} onNavigateCategory={onNavigateCategory} />
        </div>

        {/* Author */}
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <AuthorCard author={post.author} light={isLight} />
        </div>
      </article>

      <RelatedPosts posts={relatedPosts} onRead={goArticle} light={isLight} />
      <NewsletterCapture isLight={isLight} />
    </div>
  );
}

// ─── Layout B: Magazine with Sidebar ─────────────────────────────────────────
function LayoutSidebar({ post, relatedPosts, onNavigateArticle, onNavigateHome, onNavigateCategory, onEdit, isLight, onToggleLight, footerNav }) {
  const T = getMagTheme(isLight);
  const [sidebarFixed, setSidebarFixed] = useState(false);
  const sidebarAnchorRef = useRef(null);
  const goArticle = p => onNavigateArticle && onNavigateArticle(p.slug);

  useEffect(() => {
    const onScroll = () => {
      if (!sidebarAnchorRef.current) return;
      const rect = sidebarAnchorRef.current.getBoundingClientRect();
      setSidebarFixed(rect.top < 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', transition: 'background 0.35s' }}>
      <ReadingProgress />
      <HomeNav darkMode={!isLight} onToggleDark={onToggleLight} hasHero={false} />
      <MagazineNav
        activeCategoryId={post.category}
        onNavigateHome={onNavigateHome}
        onNavigateCategory={onNavigateCategory}
        onNavigateArticle={goArticle}
        onEdit={onEdit}
        isLight={isLight}
        onToggleLight={onToggleLight}
        topOffset={60}
      />

      {/* Hero, narrower, left-aligned for sidebar layout */}
      <header style={{
        position: 'relative', overflow: 'hidden',
        background: '#0a0a0a',
        padding: 'clamp(64px, 10vw, 120px) clamp(24px, 6vw, 80px) 0',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ width: 20, height: 1, background: GOLD }} />
            <span style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: GOLD }}>
              {post.categoryLabel}
            </span>
          </div>
          <h1 style={{
            fontFamily: FD, fontSize: 'clamp(28px, 4.5vw, 60px)',
            fontWeight: 400, color: CREAM, margin: '0 0 18px',
            lineHeight: 1.07, maxWidth: 860,
          }}>
            {post.title}
          </h1>
          {post.standfirst && (
            <p style={{
              fontFamily: FD, fontSize: 'clamp(15px, 1.6vw, 20px)',
              fontStyle: 'italic', color: 'rgba(245,240,232,0.6)',
              margin: '0 0 28px', lineHeight: 1.6, maxWidth: 640,
            }}>
              {post.standfirst}
            </p>
          )}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', paddingBottom: 40 }}>
            <img src={post.author.avatar} alt={post.author.name} style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
            <span style={{ fontFamily: FU, fontSize: 11, color: 'rgba(245,240,232,0.55)' }}>{post.author.name}</span>
            <span style={{ color: 'rgba(245,240,232,0.2)' }}>·</span>
            <span style={{ fontFamily: FU, fontSize: 11, color: 'rgba(245,240,232,0.45)' }}>{formatDate(post.date)}</span>
            <span style={{ color: 'rgba(245,240,232,0.2)' }}>·</span>
            <span style={{ fontFamily: FU, fontSize: 11, color: 'rgba(245,240,232,0.45)' }}>{post.readingTime} min read</span>
          </div>
        </div>
        {/* Hero image flush to bottom */}
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          height: 'clamp(240px, 40svh, 520px)',
          backgroundImage: `url(${post.coverImage})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          borderRadius: '2px 2px 0 0',
        }} />
      </header>

      {/* Sidebar layout body */}
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        padding: 'clamp(40px, 5vw, 64px) clamp(24px, 4vw, 80px)',
      }}>
        <div ref={sidebarAnchorRef} style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 300px',
          gap: 'clamp(40px, 5vw, 80px)',
          alignItems: 'start',
        }}>
          {/* Main content */}
          <article>
            <ArticleBody content={post.content || []} isLight={isLight} />

            <div style={{
              marginTop: 48, paddingTop: 32,
              borderTop: `1px solid ${T.border}`,
              display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
            }}>
              <ShareRow title={post.title} light={isLight} />
              <TagsRow tags={post.tags} light={isLight} onNavigateCategory={onNavigateCategory} />
            </div>
            <AuthorCard author={post.author} light={isLight} />
          </article>

          {/* Sidebar */}
          <aside style={{
            position: sidebarFixed ? 'sticky' : 'relative',
            top: sidebarFixed ? 24 : 'auto',
          }}>
            {/* Newsletter mini */}
            <div style={{
              background: '#0a0a0a',
              padding: 28, borderRadius: 2,
              marginBottom: 36,
              textAlign: 'center',
            }}>
              <span style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, display: 'block', marginBottom: 12 }}>
                The Magazine
              </span>
              <p style={{ fontFamily: FD, fontSize: 20, fontWeight: 400, color: CREAM, margin: '0 0 18px', lineHeight: 1.25 }}>
                Join the World of Luxury Weddings
              </p>
              <SidebarNewsletterForm />
            </div>

            {/* More in category */}
            {relatedPosts.length > 0 && (
              <SidebarSection title={`More in ${post.categoryLabel}`}>
                {relatedPosts.slice(0, 3).map(p => (
                  <SidebarPostRow key={p.id} post={p} onClick={goArticle} light={isLight} />
                ))}
              </SidebarSection>
            )}

            {/* Tags */}
            {post.tags?.length > 0 && (
              <SidebarSection title="Topics">
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {post.tags.map(tag => (
                    <span key={tag} style={{
                      fontFamily: FU, fontSize: 9, fontWeight: 600,
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: T.muted,
                      border: `1px solid ${T.border}`,
                      padding: '5px 10px', borderRadius: 2,
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </SidebarSection>
            )}
          </aside>
        </div>
      </div>

      {/* Related posts full-width below */}
      <RelatedPosts posts={relatedPosts.slice(0, 3)} onRead={goArticle} light={isLight} />
      <NewsletterCapture isLight={isLight} />
    </div>
  );
}

// ─── Sidebar newsletter (compact) ─────────────────────────────────────────────
function SidebarNewsletterForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (submitted) return (
    <p style={{ fontFamily: FD, fontSize: 14, fontStyle: 'italic', color: 'rgba(245,240,232,0.6)', margin: 0 }}>
      Welcome to the edit.
    </p>
  );

  return (
    <form onSubmit={e => { e.preventDefault(); if (email.includes('@')) setSubmitted(true); }}
      style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Your email address"
        required
        style={{
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(201,169,110,0.25)',
          borderRadius: 2, padding: '11px 14px',
          fontFamily: FU, fontSize: 12, color: CREAM, outline: 'none',
        }}
      />
      <button type="submit" style={{
        background: GOLD, color: '#0a0a0a', border: 'none', borderRadius: 2,
        padding: '11px', fontFamily: FU, fontSize: 9, fontWeight: 700,
        letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer',
      }}>
        Subscribe
      </button>
    </form>
  );
}

// ─── Not Found ────────────────────────────────────────────────────────────────
function ArticleNotFound({ onNavigateHome }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <p style={{ fontFamily: FU, color: 'rgba(245,240,232,0.35)', fontSize: 13 }}>Article not found.</p>
      <button onClick={onNavigateHome} style={{
        fontFamily: FU, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
        color: GOLD, background: 'transparent', border: `1px solid ${GOLD}60`, padding: '9px 20px',
        borderRadius: 2, cursor: 'pointer',
      }}>
        Back to Magazine
      </button>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function MagazineArticlePage({ slug, onNavigateArticle, onNavigateHome, onNavigateCategory, onEdit, isLight = false, onToggleLight, footerNav = {} }) {
  const [post, setPost] = useState(() => getPostBySlug(slug));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchPostBySlug(slug).then(({ data }) => {
      if (data) setPost(data);
      else setPost(getPostBySlug(slug)); // static fallback
      setLoading(false);
    });
  }, [slug]);

  if (loading && !post) return null;
  if (!post) return <ArticleNotFound onNavigateHome={onNavigateHome} />;

  const relatedPosts = getRelatedPosts(post, 4);
  const canonicalUrl = post.category_slug && post.slug
    ? `${SITE_URL}/magazine/${post.category_slug}/${post.slug}`
    : undefined;

  const handleEdit = () => onEdit && onEdit(post.slug);
  const sharedProps = { post, relatedPosts, onNavigateArticle, onNavigateHome, onNavigateCategory, onEdit: handleEdit, isLight, onToggleLight, footerNav };

  return (
    <>
      <SeoHead
        title={post.seo_title || post.seoTitle || post.title}
        description={post.seo_description || post.seoDescription || post.metaDescription || post.excerpt}
        canonicalUrl={canonicalUrl}
        ogImage={post.hero_image || post.heroImage || post.ogImage || post.coverImage}
        ogType="article"
      />
      <JsonLd schema={buildArticleSchema(post)} />
      {post.layout === 'sidebar' ? <LayoutSidebar {...sharedProps} /> : <LayoutFullWidth {...sharedProps} />}
    </>
  );
}
