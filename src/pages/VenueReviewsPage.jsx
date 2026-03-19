// VenueReviewsPage.jsx
// /venues/:slug/reviews — auto-branded with venue hero, images and identity

import { useState, useEffect, useRef } from 'react';
import HomeNav from '../components/nav/HomeNav';
import { fetchListingBySlug } from '../services/listings';
import { fetchApprovedReviews } from '../services/reviewService';
import { THEMES } from '../services/reviewThemeService';

// ── Design tokens ──────────────────────────────────────────────────────────────
const LIGHT = {
  bg: '#faf9f7', bgAlt: '#f4f3f0', surface: '#ffffff',
  border: '#ebebeb', border2: '#d8d8d8',
  gold: '#9d873e', goldLight: 'rgba(157,135,62,0.07)', goldBorder: 'rgba(157,135,62,0.2)',
  green: '#748172',
  text: '#1a1a18', textMid: '#4a4844', textLight: '#6b6560', textMuted: '#9c9690',
};
const DARK = {
  bg: '#0f0f0d', bgAlt: '#141412', surface: '#1a1a18',
  border: '#2e2e2a', border2: '#3c3c38',
  gold: '#b8a05a', goldLight: 'rgba(184,160,90,0.1)', goldBorder: 'rgba(184,160,90,0.25)',
  green: '#8fa08c',
  text: '#f5f2ec', textMid: '#c8c4bc', textLight: '#9c9890', textMuted: '#6b6860',
};

const FD = "var(--font-heading-primary)";
const FB = "var(--font-body)";

// ── Helpers ────────────────────────────────────────────────────────────────────
function Stars({ rating = 5, size = 13, gold = '#9d873e' }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ fontSize: size, color: s <= Math.round(rating) ? gold : 'rgba(255,255,255,0.25)', lineHeight: 1 }}>★</span>
      ))}
    </span>
  );
}

function StarsOnBg({ rating = 5, size = 13 }) {
  // For use on dark hero backgrounds
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ fontSize: size, color: s <= Math.round(rating) ? '#c9a84c' : 'rgba(255,255,255,0.2)', lineHeight: 1 }}>★</span>
      ))}
    </span>
  );
}

function fmtDate(iso) {
  if (!iso) return null;
  try { return new Date(iso).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }); }
  catch { return null; }
}

function initials(name) {
  if (!name) return '?';
  const w = name.trim().split(/\s+/);
  return w.length === 1 ? w[0][0].toUpperCase() : (w[0][0] + w[w.length - 1][0]).toUpperCase();
}

function mapReview(r) {
  return {
    id: r.id,
    names: r.reviewer_name || 'Anonymous',
    location: r.reviewer_location || null,
    date: fmtDate(r.event_date || r.published_at || r.created_at),
    rating: Number(r.overall_rating) || 5,
    title: r.review_title || null,
    text: r.review_text || '',
    verified: !!r.is_verified,
    themes: r.themes || [],
    avatar: initials(r.reviewer_name),
  };
}

// ── Animated hero slider ───────────────────────────────────────────────────────
function HeroSlide({ imgs }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!imgs || imgs.length < 2) return;
    const t = setInterval(() => setIdx(i => (i + 1) % imgs.length), 5000);
    return () => clearInterval(t);
  }, [imgs?.length]);
  if (!imgs || imgs.length === 0) return null;
  return imgs.map((img, i) => (
    <div key={i} style={{
      position: 'absolute', inset: 0,
      backgroundImage: `url(${img})`,
      backgroundSize: 'cover', backgroundPosition: 'center',
      opacity: i === idx ? 1 : 0,
      transition: 'opacity 1.2s ease',
      animation: i === idx ? 'vrKenBurns 10s ease forwards' : 'none',
    }} />
  ));
}

// ── Full review card ───────────────────────────────────────────────────────────
function ReviewCard({ r, C, index }) {
  const [expanded, setExpanded] = useState(false);
  const LONG = r.text.length > 340;

  return (
    <div style={{
      padding: '32px 36px',
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderLeft: `4px solid ${C.gold}`,
      marginBottom: 0,
      animation: `vrFadeUp 0.4s ease ${Math.min(index * 0.07, 0.35)}s both`,
    }}>
      {/* Quote + title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 14 }}>
        <span style={{ fontFamily: FD, fontSize: 52, color: C.gold, lineHeight: 0.6, opacity: 0.45, flexShrink: 0, userSelect: 'none', marginTop: 8 }}>"</span>
        <div>
          {r.title && (
            <div style={{ fontFamily: FD, fontSize: 17, color: C.text, lineHeight: 1.35, marginBottom: 6 }}>{r.title}</div>
          )}
          <StarsOnLight rating={r.rating} size={12} gold={C.gold} />
        </div>
      </div>

      {/* Body */}
      <p style={{
        fontFamily: FB, fontSize: 14, color: C.textMid, lineHeight: 1.85, margin: '0 0 0 0',
        ...(!expanded && LONG ? { display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : {}),
      }}>{r.text}</p>

      {LONG && (
        <button onClick={() => setExpanded(e => !e)} style={{
          marginTop: 8, fontFamily: FB, fontSize: 12, color: C.gold,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontWeight: 700, letterSpacing: '0.2px',
        }}>{expanded ? 'Show less ↑' : 'Read full review ↓'}</button>
      )}

      {/* Theme tags */}
      {r.themes && r.themes.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
          {r.themes.map(t => (
            <span key={t} style={{
              fontFamily: FB, fontSize: 10, color: C.gold, fontWeight: 700,
              padding: '3px 9px', border: `1px solid ${C.goldBorder}`,
              background: C.goldLight, letterSpacing: '0.4px', textTransform: 'uppercase',
            }}>{THEMES[t]?.label || t}</span>
          ))}
        </div>
      )}

      {/* Reviewer row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
        <div style={{
          width: 40, height: 40, background: C.goldLight, border: `1px solid ${C.goldBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: FD, fontSize: 15, color: C.gold, flexShrink: 0,
        }}>{r.avatar}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FD, fontSize: 14, color: C.text, marginBottom: 2 }}>{r.names}</div>
          <div style={{ fontFamily: FB, fontSize: 11, color: C.textMuted }}>
            {[r.location, r.date].filter(Boolean).join(' · ')}
          </div>
        </div>
        {r.verified && (
          <span style={{
            fontFamily: FB, fontSize: 10, color: C.green, fontWeight: 700,
            padding: '3px 8px', border: `1px solid ${C.green}`, letterSpacing: '0.3px',
          }}>✓ Verified Review</span>
        )}
      </div>
    </div>
  );
}

function StarsOnLight({ rating = 5, size = 13, gold = '#9d873e' }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ fontSize: size, color: s <= Math.round(rating) ? gold : '#ddd', lineHeight: 1 }}>★</span>
      ))}
    </span>
  );
}

// ── Rating bar ─────────────────────────────────────────────────────────────────
function RatingBar({ star, count, total, C }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontFamily: FB, fontSize: 12, color: C.textMuted, width: 12, textAlign: 'right' }}>{star}</span>
      <span style={{ fontSize: 11, color: C.gold }}>★</span>
      <div style={{ flex: 1, height: 5, background: C.border, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: C.gold, transition: 'width 0.8s ease' }} />
      </div>
      <span style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, width: 24, textAlign: 'right' }}>{count}</span>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function VenueReviewsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const C = darkMode ? DARK : LIGHT;

  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const slug = pathParts[1] || null;

  const [listing, setListing]   = useState(null);
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [sortMode,      setSortMode]      = useState('recent');
  const [starFilter,    setStarFilter]    = useState(null);
  const [visibleCount,  setVisibleCount]  = useState(8);

  useEffect(() => {
    if (!slug) { setNotFound(true); setLoading(false); return; }
    async function load() {
      try {
        const l = await fetchListingBySlug(slug);
        if (!l) { setNotFound(true); setLoading(false); return; }
        setListing(l);
        const raw = await fetchApprovedReviews('venue', l.id);
        setReviews((raw || []).map(mapReview));
      } catch (e) {
        console.error('[VenueReviewsPage]', e);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1) : null;

  const starDist = [5,4,3,2,1].reduce((acc, s) => {
    acc[s] = reviews.filter(r => Math.round(r.rating) === s).length;
    return acc;
  }, {});

  const filtered = reviews.filter(r => {
    if (!starFilter) return true;
    if (starFilter === 'below') return r.rating < 3;
    return Math.round(r.rating) === starFilter;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortMode === 'highest')  return b.rating - a.rating;
    if (sortMode === 'detailed') return b.text.length - a.text.length;
    return 0;
  });

  const visible = sorted.slice(0, visibleCount);
  const hasMore = sorted.length > visibleCount;

  // ── Hero image sources ────────────────────────────────────────────────────────
  const heroImgs = listing?.imgs?.map(i => typeof i === 'string' ? i : i.src).filter(Boolean) || [];
  const venueName = listing?.name || 'Venue';
  const venueLocation = [listing?.city, listing?.country].filter(Boolean).join(', ');

  // ── Pill ─────────────────────────────────────────────────────────────────────
  const Pill = ({ label, active, onClick }) => (
    <button onClick={onClick} style={{
      width: 120, padding: '7px 0', border: `1px solid ${active ? C.gold : 'rgba(0,0,0,0.1)'}`,
      background: active ? C.goldLight : 'none',
      color: active ? C.gold : C.textLight,
      fontFamily: FB, fontSize: 12, fontWeight: active ? 700 : 400,
      cursor: 'pointer', transition: 'all 0.18s',
      borderRadius: 20, letterSpacing: '0.1px', textAlign: 'center', flexShrink: 0,
    }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = C.goldBorder; e.currentTarget.style.color = C.gold; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; e.currentTarget.style.color = C.textLight; } }}
    >{label}</button>
  );

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ background: '#0d0b09', minHeight: '100vh' }}>
      <HomeNav hasHero={false} darkMode={true} onToggleDark={() => {}} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <span style={{ fontFamily: FB, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Loading…</span>
      </div>
    </div>
  );

  if (notFound) return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      <HomeNav hasHero={false} darkMode={darkMode} onToggleDark={() => setDarkMode(d => !d)} />
      <div style={{ maxWidth: 600, margin: '120px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: FD, fontSize: 26, color: C.text, marginBottom: 16 }}>Venue not found</div>
        <a href="/" style={{ fontFamily: FB, fontSize: 13, color: C.gold }}>← Back to home</a>
      </div>
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text }}>

      {/* ── Global styles ─────────────────────────────────────────────────── */}
      <style>{`
        @keyframes vrKenBurns { 0%{transform:scale(1)} 100%{transform:scale(1.05)} }
        @keyframes vrFadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes vrFadeIn   { from{opacity:0} to{opacity:1} }
        .vrp-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── HomeNav (transparent over hero) ──────────────────────────────── */}
      <HomeNav hasHero={true} darkMode={darkMode} onToggleDark={() => setDarkMode(d => !d)} />

      {/* ── BRANDED HERO ─────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: '55vh', minHeight: 380, overflow: 'hidden' }}>

        {/* Animated image slider */}
        <HeroSlide imgs={heroImgs} />

        {/* Gradient overlays */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.08) 40%, rgba(0,0,0,0.78) 100%)' }} />

        {/* Fallback if no images */}
        {heroImgs.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a1712 0%, #0d0b09 100%)' }} />
        )}

        {/* Content — bottom left */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '0 56px 48px',
          animation: 'vrFadeIn 0.8s ease both',
        }}>
          <h1 style={{
            fontFamily: FD, fontSize: 'clamp(30px, 4.5vw, 58px)', fontWeight: 400,
            color: '#fff', letterSpacing: '-0.3px', lineHeight: 1.05, margin: '0 0 10px',
          }}>{venueName}</h1>

          {/* Emotional hook */}
          <p style={{
            fontFamily: FB, fontSize: 13, color: 'rgba(255,255,255,0.55)',
            margin: '0 0 16px', letterSpacing: '0.1px', lineHeight: 1.5,
          }}>Real experiences from couples who celebrated here</p>

          {/* Rating summary on hero */}
          {avgRating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: FD, fontSize: 26, color: '#c9a84c', lineHeight: 1 }}>{avgRating}</span>
              <StarsOnBg rating={parseFloat(avgRating)} size={15} />
              <span style={{ fontFamily: FB, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                {totalReviews} verified review{totalReviews !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Breadcrumb row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 18, fontFamily: FB, fontSize: 11, letterSpacing: '0.3px' }}>
            {[
              { label: 'Venues', href: '/venues' },
              { label: venueName, href: `/venues/${slug}` },
              { label: 'Reviews', href: null },
            ].map((crumb, i, arr) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {crumb.href ? (
                  <a href={crumb.href} style={{ color: 'rgba(255,255,255,0.52)', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.52)'}
                  >{crumb.label}</a>
                ) : (
                  <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{crumb.label}</span>
                )}
                {i < arr.length - 1 && <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>›</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── RATING SUMMARY STRIP ─────────────────────────────────────────── */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '0 56px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'stretch', gap: 0 }}>

          {/* Big number */}
          <div style={{ padding: '36px 48px 36px 0', borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8, minWidth: 180 }}>
            <div style={{ fontFamily: FD, fontSize: 56, fontWeight: 400, color: C.gold, lineHeight: 1 }}>{avgRating || '—'}</div>
            <StarsOnLight rating={parseFloat(avgRating) || 0} size={16} gold={C.gold} />
            <div style={{ fontFamily: FB, fontSize: 12, color: C.textMuted, marginTop: 2 }}>
              Based on {totalReviews} verified review{totalReviews !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Star distribution bars */}
          <div style={{ padding: '36px 48px', display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center', flex: 1 }}>
            {[5,4,3,2,1].map(s => (
              <RatingBar key={s} star={s} count={starDist[s] || 0} total={totalReviews} C={C} />
            ))}
          </div>

          {/* Actions */}
          <div style={{ padding: '36px 0 36px 48px', borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12, minWidth: 240 }}>
            {/* Write a Review — prominent */}
            <a href={`/venues/${slug}#reviews`} style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px 24px', background: C.gold, border: `1px solid ${C.gold}`,
              color: '#fff', fontFamily: FB, fontSize: 12, fontWeight: 700,
              textDecoration: 'none', letterSpacing: '0.8px', textTransform: 'uppercase',
              transition: 'opacity 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >✦ Write a Review</a>
            {/* View profile — secondary */}
            <a href={`/venues/${slug}`} style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '11px 24px', border: `1px solid ${C.border2}`,
              background: 'none', color: C.textMid,
              fontFamily: FB, fontSize: 12, fontWeight: 500,
              textDecoration: 'none', letterSpacing: '0.4px',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.color = C.textMid; }}
            >← View Venue Profile</a>
          </div>
        </div>
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 56px 120px' }}>

        {/* Controls — single row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 36, flexWrap: 'nowrap', overflowX: 'auto' }}>
          <span style={{ fontFamily: FB, fontSize: 10, color: C.textMuted, letterSpacing: '0.8px', textTransform: 'uppercase', whiteSpace: 'nowrap', marginRight: 2 }}>Sort</span>
          <Pill label="Most Recent"    active={sortMode === 'recent'}   onClick={() => { setSortMode('recent');   setVisibleCount(8); }} />
          <Pill label="Highest Rated"  active={sortMode === 'highest'}  onClick={() => { setSortMode('highest');  setVisibleCount(8); }} />
          <Pill label="Most Detailed"  active={sortMode === 'detailed'} onClick={() => { setSortMode('detailed'); setVisibleCount(8); }} />
          {/* Divider */}
          <span style={{ width: 1, height: 20, background: C.border2, flexShrink: 0, margin: '0 6px' }} />
          <span style={{ fontFamily: FB, fontSize: 10, color: C.textMuted, letterSpacing: '0.8px', textTransform: 'uppercase', whiteSpace: 'nowrap', marginRight: 2 }}>Filter</span>
          <Pill label="All"        active={!starFilter}             onClick={() => { setStarFilter(null);    setVisibleCount(8); }} />
          <Pill label="★★★★★"     active={starFilter === 5}        onClick={() => { setStarFilter(5);       setVisibleCount(8); }} />
          <Pill label="★★★★"      active={starFilter === 4}        onClick={() => { setStarFilter(4);       setVisibleCount(8); }} />
          <Pill label="★★★"       active={starFilter === 3}        onClick={() => { setStarFilter(3);       setVisibleCount(8); }} />
          <Pill label="Below ★★★" active={starFilter === 'below'}  onClick={() => { setStarFilter('below'); setVisibleCount(8); }} />
          {/* Count — pushed right */}
          <span style={{ marginLeft: 'auto', fontFamily: FB, fontSize: 12, color: C.textMuted, whiteSpace: 'nowrap', flexShrink: 0 }}>
            Showing {Math.min(visibleCount, sorted.length)} of {sorted.length}
          </span>
        </div>

        {/* Review list */}
        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: FB, fontSize: 14, color: C.textMuted }}>
            No reviews match this filter.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {visible.map((r, i) => <ReviewCard key={r.id} r={r} C={C} index={i} />)}
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <button
              onClick={() => setVisibleCount(n => n + 8)}
              style={{
                padding: '13px 40px', border: `1px solid ${C.gold}`,
                background: 'none', color: C.gold,
                fontFamily: FB, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', letterSpacing: '0.5px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.goldLight; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >Load more — {sorted.length - visibleCount} remaining</button>
          </div>
        )}

        {/* Write review CTA */}
        <div style={{
          marginTop: 72, padding: '40px 48px',
          background: `linear-gradient(135deg, ${C.bgAlt} 0%, ${C.surface} 100%)`,
          border: `1px solid ${C.border}`,
          borderTop: `3px solid ${C.gold}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24,
        }}>
          <div>
            <div style={{ fontFamily: FD, fontSize: 22, color: C.text, marginBottom: 6 }}>
              Share your experience at {venueName}
            </div>
            <div style={{ fontFamily: FB, fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
              Your review helps other couples make the most important decision of their wedding journey.
            </div>
          </div>
          <a href={`/venues/${slug}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 28px', background: C.gold, border: 'none',
            color: '#fff', fontFamily: FB, fontSize: 13, fontWeight: 700,
            textDecoration: 'none', letterSpacing: '1px', textTransform: 'uppercase',
            flexShrink: 0, transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >Write a Review →</a>
        </div>

      </div>

    </div>
  );
}
