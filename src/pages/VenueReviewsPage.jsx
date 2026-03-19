// VenueReviewsPage.jsx
// Dedicated reviews page at /venues/:slug/reviews
// Full untruncated review cards, sort + filter, load-more, theme tags

import { useState, useEffect } from 'react';
import HomeNav from '../components/nav/HomeNav';
import SiteFooter from '../components/sections/SiteFooter';
import { fetchListingBySlug } from '../services/listings';
import { fetchApprovedReviews } from '../services/reviewService';
import { THEMES } from '../services/reviewThemeService';

// ── Design tokens (mirrored from VenueProfile light/dark pattern) ─────────────
const LIGHT = {
  bg: '#ffffff', bgAlt: '#f7f7f5', surface: '#ffffff',
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

// ── Stars helper ──────────────────────────────────────────────────────────────
function Stars({ rating = 5, size = 13, gold = '#9d873e' }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <span
          key={s}
          style={{ fontSize: size, color: s <= Math.round(rating) ? gold : '#ccc', lineHeight: 1 }}
        >★</span>
      ))}
    </div>
  );
}

// ── Format date ───────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  } catch {
    return null;
  }
}

// ── Avatar initials ───────────────────────────────────────────────────────────
function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ── Map DB row to display shape ───────────────────────────────────────────────
function mapReview(r) {
  return {
    id: r.id,
    names: r.reviewer_name || 'Anonymous',
    location: r.reviewer_location || null,
    date: fmtDate(r.event_date || r.published_at || r.created_at),
    rating: r.overall_rating || 5,
    title: r.review_title || null,
    text: r.review_text || '',
    verified: !!r.is_verified,
    themes: r.themes || [],
    avatar: initials(r.reviewer_name),
  };
}

// ── Full review card ──────────────────────────────────────────────────────────
function FullReviewCard({ r, C }) {
  const [expanded, setExpanded] = useState(false);
  const LONG = r.text.length > 320;

  return (
    <div style={{
      padding: 28,
      borderLeft: `3px solid ${C.gold}`,
      border: `1px solid ${C.goldBorder}`,
      borderLeftWidth: 3,
      borderLeftColor: C.gold,
      background: C.goldLight,
      marginBottom: 20,
    }}>
      {/* Quote mark */}
      <div style={{ fontFamily: FD, fontSize: 56, color: C.gold, lineHeight: 0.5, marginBottom: 14, opacity: 0.55, userSelect: 'none' }}>"</div>

      {/* Title */}
      {r.title && (
        <div style={{ fontFamily: FD, fontSize: 17, color: C.text, marginBottom: 10, lineHeight: 1.4 }}>{r.title}</div>
      )}

      {/* Body */}
      <p style={{
        fontFamily: FB, fontSize: 14, color: C.textMid, lineHeight: 1.8, margin: 0,
        ...(!expanded && LONG ? {
          display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        } : {}),
      }}>{r.text}</p>
      {LONG && (
        <button
          onClick={() => setExpanded(e => !e)}
          style={{ marginTop: 6, fontFamily: FB, fontSize: 12, color: C.gold, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}
        >{expanded ? 'Show less' : 'Read more'}</button>
      )}

      {/* Theme tags */}
      {r.themes && r.themes.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
          {r.themes.map(t => (
            <span key={t} style={{
              fontFamily: FB, fontSize: 10, color: C.gold, fontWeight: 600,
              padding: '3px 8px', border: `1px solid ${C.goldBorder}`, borderRadius: 2,
              background: C.goldLight, letterSpacing: '0.3px', textTransform: 'capitalize',
            }}>{THEMES[t]?.label || t}</span>
          ))}
        </div>
      )}

      {/* Footer row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
        <div style={{
          width: 38, height: 38, background: C.goldLight, border: `1px solid ${C.goldBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: FD, fontSize: 14, color: C.gold, flexShrink: 0,
        }}>{r.avatar}</div>
        <div>
          <div style={{ fontFamily: FD, fontSize: 14, color: C.text }}>{r.names}</div>
          <div style={{ fontFamily: FB, fontSize: 11, color: C.textMuted }}>
            {[r.location, r.date].filter(Boolean).join(' · ')}
          </div>
        </div>
        <div style={{ marginLeft: 4 }}>
          <Stars rating={r.rating} size={12} gold={C.gold} />
        </div>
        {r.verified && (
          <span style={{ fontFamily: FB, fontSize: 11, color: C.green, fontWeight: 700, padding: '2px 8px', border: `1px solid ${C.green}`, borderRadius: 2 }}>✓ Verified</span>
        )}
      </div>
    </div>
  );
}

// ── Main page component ───────────────────────────────────────────────────────
export default function VenueReviewsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const C = darkMode ? DARK : LIGHT;

  // Extract slug from URL: /venues/:slug/reviews
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const slug = pathParts[1] || null; // ['venues', slug, 'reviews']

  const [venue, setVenue] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Sort + filter state
  const [sortMode, setSortMode] = useState('recent'); // 'recent' | 'highest' | 'detailed'
  const [starFilter, setStarFilter] = useState(null); // null | 5 | 4 | 3 | 'below'
  const [visibleCount, setVisibleCount] = useState(6);

  // Fetch data
  useEffect(() => {
    if (!slug) { setNotFound(true); setLoading(false); return; }

    async function load() {
      setLoading(true);
      try {
        const listing = await fetchListingBySlug(slug);
        if (!listing) { setNotFound(true); setLoading(false); return; }
        setVenue(listing);

        const rawReviews = await fetchApprovedReviews('venue', listing.id);
        setReviews((rawReviews || []).map(mapReview));
      } catch (err) {
        console.error('[VenueReviewsPage] load error:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  // Sort + filter client-side
  const filtered = reviews.filter(r => {
    if (!starFilter) return true;
    if (starFilter === 'below') return r.rating < 3;
    if (starFilter === 3) return r.rating >= 3 && r.rating < 4;
    if (starFilter === 4) return r.rating >= 4 && r.rating < 5;
    if (starFilter === 5) return r.rating >= 4.9;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortMode === 'highest') return b.rating - a.rating;
    if (sortMode === 'detailed') return (b.text || '').length - (a.text || '').length;
    // most recent: default order from DB (already sorted by published_at desc)
    return 0;
  });

  const visible = sorted.slice(0, visibleCount);
  const hasMore = sorted.length > visibleCount;

  // Aggregate stats
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : null;

  // ── Pill helper ─────────────────────────────────────────────────────────────
  const Pill = ({ label, active, onClick }) => (
    <button
      onClick={onClick}
      style={{
        padding: '7px 14px',
        border: `1px solid ${active ? C.gold : C.border2}`,
        background: active ? C.goldLight : 'none',
        color: active ? C.gold : C.textMuted,
        fontFamily: FB, fontSize: 12, fontWeight: active ? 700 : 400,
        cursor: 'pointer', borderRadius: 2, transition: 'all 0.15s',
      }}
    >{label}</button>
  );

  // ── Loading / not found ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <HomeNav hasHero={false} darkMode={darkMode} onToggleDark={() => setDarkMode(d => !d)} />
        <div style={{ fontFamily: FB, fontSize: 14, color: C.textMuted }}>Loading reviews…</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh' }}>
        <HomeNav hasHero={false} darkMode={darkMode} onToggleDark={() => setDarkMode(d => !d)} />
        <div style={{ maxWidth: 720, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ fontFamily: FD, fontSize: 24, color: C.text, marginBottom: 12 }}>Venue not found</div>
          <a href="/" style={{ fontFamily: FB, fontSize: 13, color: C.gold }}>← Back to home</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text }}>
      <HomeNav hasHero={false} darkMode={darkMode} onToggleDark={() => setDarkMode(d => !d)} />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 100px' }}>

        {/* Back link */}
        <a
          href={`/venues/${slug}`}
          style={{ fontFamily: FB, fontSize: 13, color: C.gold, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 32 }}
          onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
          onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
        >← Back to {venue?.name || 'venue'}</a>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: FD, fontSize: 28, fontWeight: 400, color: C.text, margin: 0, marginBottom: 8 }}>
            {venue?.name} — Guest Reviews
          </h1>
          {avgRating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 14px', border: `1px solid ${C.goldBorder}`,
                background: C.goldLight,
              }}>
                <span style={{ fontFamily: FD, fontSize: 20, color: C.gold }}>{avgRating}</span>
                <Stars rating={parseFloat(avgRating)} size={13} gold={C.gold} />
                <span style={{ fontFamily: FB, fontSize: 12, color: C.textMuted }}>{totalReviews} review{totalReviews !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )}
        </div>

        {/* Controls row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, alignItems: 'center' }}>
          <span style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, letterSpacing: '0.6px', textTransform: 'uppercase', marginRight: 4 }}>Sort:</span>
          <Pill label="Most Recent"  active={sortMode === 'recent'}   onClick={() => setSortMode('recent')} />
          <Pill label="Highest Rated" active={sortMode === 'highest'}  onClick={() => setSortMode('highest')} />
          <Pill label="Most Detailed" active={sortMode === 'detailed'} onClick={() => setSortMode('detailed')} />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32, alignItems: 'center' }}>
          <span style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, letterSpacing: '0.6px', textTransform: 'uppercase', marginRight: 4 }}>Filter:</span>
          <Pill label="All"   active={!starFilter}        onClick={() => setStarFilter(null)} />
          <Pill label="★★★★★" active={starFilter === 5}   onClick={() => setStarFilter(5)} />
          <Pill label="★★★★"  active={starFilter === 4}   onClick={() => setStarFilter(4)} />
          <Pill label="★★★"   active={starFilter === 3}   onClick={() => setStarFilter(3)} />
          <Pill label="Below ★★★" active={starFilter === 'below'} onClick={() => setStarFilter('below')} />
        </div>

        {/* Reviews list */}
        {visible.length === 0 ? (
          <div style={{ fontFamily: FB, fontSize: 14, color: C.textMuted, padding: '40px 0', textAlign: 'center' }}>
            No reviews match this filter.
          </div>
        ) : (
          visible.map(r => <FullReviewCard key={r.id} r={r} C={C} />)
        )}

        {/* Load more */}
        {hasMore && (
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <button
              onClick={() => setVisibleCount(n => n + 6)}
              style={{
                padding: '12px 32px', border: `1px solid ${C.gold}`,
                background: 'none', color: C.gold, fontFamily: FB, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', letterSpacing: '0.3px', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.goldLight; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >Load more ({sorted.length - visibleCount} remaining)</button>
          </div>
        )}

        {/* Write a review CTA */}
        <div style={{
          marginTop: 56, padding: 28, border: `1px solid ${C.border}`,
          background: C.bgAlt, textAlign: 'center',
        }}>
          <div style={{ fontFamily: FD, fontSize: 18, color: C.text, marginBottom: 8 }}>Share your experience</div>
          <div style={{ fontFamily: FB, fontSize: 13, color: C.textMuted, marginBottom: 16 }}>
            Stayed or celebrated at {venue?.name}? Your review helps other couples.
          </div>
          <a
            href={`/venues/${slug}`}
            style={{
              display: 'inline-block', padding: '10px 28px',
              border: `1px solid ${C.gold}`, background: C.goldLight,
              color: C.gold, fontFamily: FB, fontSize: 13, fontWeight: 600,
              textDecoration: 'none', letterSpacing: '0.3px',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = C.gold; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.goldLight; e.currentTarget.style.color = C.gold; }}
          >Write a review</a>
        </div>

      </div>

      <SiteFooter />
    </div>
  );
}
