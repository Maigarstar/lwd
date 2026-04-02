// ─── src/pages/PublicVendorProfilePage.jsx ────────────────────────────────────
// Public vendor profile page — route: /vendor/[slug]
//
// Features:
//   • Fetches vendor listing from DB by slug
//   • Displays approved reviews with owner replies
//   • "Write a Review" button — always visible in section header
//   • /vendor/[slug]#write-a-review auto-opens the form on load
//   • Submissions feed the admin moderation queue (status = 'pending')
//   • Auto-verified when reviewer email matches a confirmed booking enquiry
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import HomeNav from '../components/nav/HomeNav';
import { fetchListingBySlug } from '../services/listings';
import { fetchApprovedReviews } from '../services/reviewService';
import ReviewForm from '../components/ReviewForm';
import SiteFooter from '../components/sections/SiteFooter';

const GD = 'var(--font-heading-primary)';
const NU = 'var(--font-body)';

const C = {
  bg:         '#faf9f7',
  surface:    '#ffffff',
  border:     '#e8e3dc',
  border2:    '#d4cdc4',
  gold:       '#9d873e',
  goldLight:  'rgba(157,135,62,0.08)',
  goldBorder: 'rgba(157,135,62,0.22)',
  text:       '#1a1a18',
  textMid:    '#4a4844',
  textLight:  '#6b6560',
  textMuted:  '#9c9690',
  green:      '#2d6a4f',
  greenBg:    'rgba(45,106,79,0.07)',
  greenBd:    'rgba(45,106,79,0.2)',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return null;
  try { return new Date(iso).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }); }
  catch { return null; }
}

function initials(name = '') {
  const w = name.trim().split(/\s+/);
  if (!w[0]) return '?';
  return w.length === 1 ? w[0][0].toUpperCase() : (w[0][0] + w[w.length - 1][0]).toUpperCase();
}

function Stars({ rating = 5, size = 13 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ fontSize: size, color: s <= Math.round(rating) ? C.gold : '#d8d3cc', lineHeight: 1 }}>★</span>
      ))}
    </span>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ open, onClose, children }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(10,8,6,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.surface, borderRadius: 4, width: '100%', maxWidth: 560,
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)', position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 12, right: 14, background: 'none', border: 'none', cursor: 'pointer', fontFamily: NU, fontSize: 20, color: C.textLight, lineHeight: 1 }}
          aria-label="Close"
        >×</button>
        {children}
      </div>
    </div>
  );
}

// ── Owner reply ───────────────────────────────────────────────────────────────
function OwnerReply({ messages = [], vendorName }) {
  const replies = messages.filter(m => m.sender_type === 'owner' && !m.is_internal_note);
  if (!replies.length) return null;
  const r = replies[0];
  return (
    <div style={{ marginTop: 14, padding: '12px 14px', background: C.goldLight, border: `1px solid ${C.goldBorder}`, borderLeft: `3px solid ${C.gold}`, borderRadius: '0 3px 3px 0' }}>
      <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: C.gold, marginBottom: 6 }}>
        Response from {vendorName}
        {r.created_at && <span style={{ fontWeight: 400, color: C.textMuted, marginLeft: 8 }}>· {fmtDate(r.created_at)}</span>}
      </div>
      <p style={{ fontFamily: NU, fontSize: 12, color: C.textMid, lineHeight: 1.65, margin: 0 }}>{r.message_body}</p>
    </div>
  );
}

// ── Review card ───────────────────────────────────────────────────────────────
function ReviewCard({ review, vendorName }) {
  const { reviewer_name, reviewer_location, overall_rating, review_title, review_text,
          is_verified_booking, is_verified, review_date, published_at, messages = [] } = review;
  const dateLabel = fmtDate(review_date || published_at);
  const verified  = is_verified_booking || is_verified;

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, padding: '22px 24px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: `${C.gold}18`, border: `1px solid ${C.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: GD, fontSize: 14, color: C.gold }}>
          {initials(reviewer_name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: NU, fontSize: 13, fontWeight: 700, color: C.text }}>{reviewer_name}</span>
            {reviewer_location && <span style={{ fontFamily: NU, fontSize: 11, color: C.textMuted }}>· {reviewer_location}</span>}
            {verified && (
              <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: C.green, background: C.greenBg, border: `1px solid ${C.greenBd}`, padding: '2px 7px', borderRadius: 2 }}>
                ◈ Verified booking
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <Stars rating={overall_rating} size={12} />
            {dateLabel && <span style={{ fontFamily: NU, fontSize: 11, color: C.textMuted }}>{dateLabel}</span>}
          </div>
        </div>
      </div>
      {review_title && <div style={{ fontFamily: GD, fontSize: 15, color: C.text, marginBottom: 8, lineHeight: 1.4 }}>{review_title}</div>}
      <p style={{ fontFamily: NU, fontSize: 13, color: C.textMid, lineHeight: 1.7, margin: 0 }}>{review_text}</p>
      <OwnerReply messages={messages} vendorName={vendorName} />
    </div>
  );
}

// ── Rating summary ────────────────────────────────────────────────────────────
function RatingSummary({ reviews }) {
  if (!reviews.length) return null;
  const avg = (reviews.reduce((s, r) => s + Number(r.overall_rating), 0) / reviews.length).toFixed(1);
  const dist = [5,4,3,2,1].map(s => {
    const count = reviews.filter(r => Math.round(Number(r.overall_rating)) === s).length;
    return { star: s, count, pct: (count / reviews.length) * 100 };
  });
  const verified = reviews.filter(r => r.is_verified_booking || r.is_verified).length;

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, padding: '24px 28px', marginBottom: 24, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0 32px', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: GD, fontSize: 52, color: C.text, lineHeight: 1 }}>{avg}</div>
        <Stars rating={parseFloat(avg)} size={16} />
        <div style={{ fontFamily: NU, fontSize: 11, color: C.textMuted, marginTop: 6 }}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</div>
        {verified > 0 && <div style={{ fontFamily: NU, fontSize: 10, color: C.green, marginTop: 4 }}>◈ {verified} verified</div>}
      </div>
      <div>
        {dist.map(({ star, count, pct }) => (
          <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span style={{ fontFamily: NU, fontSize: 10, color: C.textMuted, minWidth: 18, textAlign: 'right' }}>{star}★</span>
            <div style={{ flex: 1, height: 5, background: C.border, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: pct > 0 ? C.gold : 'transparent', borderRadius: 3, transition: 'width 0.5s ease' }} />
            </div>
            <span style={{ fontFamily: NU, fontSize: 10, color: count > 0 ? C.textMid : C.textMuted, minWidth: 16 }}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
const PublicVendorProfilePage = ({ vendorSlug, onBack, footerNav = {} }) => {
  const writeReviewRef = useRef(null);

  const [listing,  setListing]  = useState(null);
  const [reviews,  setReviews]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    if (!vendorSlug) { setNotFound(true); setLoading(false); return; }
    async function load() {
      try {
        const l = await fetchListingBySlug(vendorSlug);
        if (!l) { setNotFound(true); setLoading(false); return; }
        setListing(l);
        // Load reviews separately — failure here must never block the page render
        try {
          const entityType = l.entityType || l.entity_type || 'vendor';
          const raw = await fetchApprovedReviews(entityType, l.id);
          setReviews(raw || []);
        } catch (reviewErr) {
          console.warn('[PublicVendorProfilePage] reviews load failed (migration pending?):', reviewErr.message);
        }
      } catch (err) {
        console.error('[PublicVendorProfilePage]', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [vendorSlug]);

  // Hash auto-open: /vendor/[slug]#write-a-review
  useEffect(() => {
    if (!loading && listing && window.location.hash === '#write-a-review') {
      setFormOpen(true);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [loading, listing]);

  const categoryLabel = (() => {
    if (!listing) return 'Vendor';
    const cat = listing.category || listing.entityType || listing.entity_type || '';
    return cat.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Vendor';
  })();

  const locationStr = [listing?.city, listing?.region, listing?.country].filter(Boolean).join(', ');
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + Number(r.overall_rating), 0) / reviews.length).toFixed(1)
    : null;

  if (loading) return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      <HomeNav hasHero={false} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <span style={{ fontFamily: NU, fontSize: 13, color: C.textMuted }}>Loading…</span>
      </div>
    </div>
  );

  if (notFound || !listing) return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      <HomeNav hasHero={false} />
      <div style={{ maxWidth: 600, margin: '100px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: GD, fontSize: 26, color: C.text, marginBottom: 12 }}>Vendor not found</div>
        <p style={{ fontFamily: NU, fontSize: 13, color: C.textLight }}>This vendor profile doesn't exist or has been removed.</p>
        <button onClick={onBack} style={{ marginTop: 20, fontFamily: NU, fontSize: 12, color: C.gold, background: 'none', border: 'none', cursor: 'pointer' }}>← Back to directory</button>
      </div>
    </div>
  );

  const entityType = listing.entityType || listing.entity_type || 'vendor';

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      <HomeNav hasHero={false} />
      <div style={{ height: 61 }} />

      {/* Header */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '32px 0 28px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ fontFamily: NU, fontSize: 11, color: C.textMuted, marginBottom: 14 }}>
            <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.gold, fontFamily: NU, fontSize: 11 }}>← Directory</button>
            <span style={{ margin: '0 6px' }}>›</span>
            <span>{categoryLabel}</span>
            <span style={{ margin: '0 6px' }}>›</span>
            <span style={{ color: C.textMid }}>{listing.name}</span>
          </div>

          <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: C.gold, marginBottom: 8 }}>{categoryLabel}</div>
          <h1 style={{ fontFamily: GD, fontSize: 34, color: C.text, margin: '0 0 8px', lineHeight: 1.2 }}>{listing.name}</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            {locationStr && <span style={{ fontFamily: NU, fontSize: 12, color: C.textLight }}>📍 {locationStr}</span>}
            {avgRating && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Stars rating={parseFloat(avgRating)} size={13} />
                <span style={{ fontFamily: NU, fontSize: 12, fontWeight: 700, color: C.gold }}>{avgRating}</span>
                <span style={{ fontFamily: NU, fontSize: 12, color: C.textMuted }}>({reviews.length})</span>
              </span>
            )}
          </div>

          {listing.bio && (
            <p style={{ fontFamily: NU, fontSize: 14, color: C.textMid, lineHeight: 1.7, margin: '16px 0 0', maxWidth: 700 }}>{listing.bio}</p>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 24px 80px' }}>
        <div id="reviews" />

        {/* Section header — top-right CTA only shown once reviews exist */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: C.gold, marginBottom: 4 }}>Client Reviews</div>
            <h2 style={{ fontFamily: GD, fontSize: 24, color: C.text, margin: 0 }}>
              {reviews.length > 0 ? `${reviews.length} review${reviews.length !== 1 ? 's' : ''}` : 'Be the first to review'}
            </h2>
          </div>

          {reviews.length > 0 && (
            <div id="write-a-review" ref={writeReviewRef}>
              <button
                onClick={() => setFormOpen(true)}
                style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', padding: '11px 22px', borderRadius: 3, background: C.text, color: '#fff', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                + Write a review
              </button>
            </div>
          )}
        </div>

        <RatingSummary reviews={reviews} />

        {reviews.length > 0 ? (
          reviews.map(r => <ReviewCard key={r.id} review={r} vendorName={listing.name} />)
        ) : (
          /* Empty state — single gold CTA, no competing button */
          <div style={{ background: C.surface, border: `1px dashed ${C.border2}`, borderRadius: 4, padding: '52px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 14, opacity: 0.35 }}>✦</div>
            <div style={{ fontFamily: GD, fontSize: 22, color: C.textMid, marginBottom: 10 }}>No reviews yet</div>
            <p style={{ fontFamily: NU, fontSize: 13, color: C.textLight, lineHeight: 1.65, maxWidth: 420, margin: '0 auto 8px' }}>
              {listing.name} hasn't received any reviews on LWD yet.
            </p>
            <p style={{ fontFamily: NU, fontSize: 12, color: C.textMuted, lineHeight: 1.5, maxWidth: 360, margin: '0 auto 28px' }}>
              Couples rely on reviews like yours to make confident decisions.
            </p>
            <button
              onClick={() => setFormOpen(true)}
              style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', padding: '13px 28px', borderRadius: 3, background: C.gold, color: '#fff', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              + Write the first review
            </button>
          </div>
        )}

        <div style={{ marginTop: 28, padding: '14px 18px', background: C.goldLight, border: `1px solid ${C.goldBorder}`, borderRadius: 3 }}>
          <p style={{ fontFamily: NU, fontSize: 11, color: C.textMid, lineHeight: 1.5, margin: 0 }}>
            <strong style={{ color: C.gold }}>LWD Review Standards</strong> — All reviews are verified by our editorial team before publishing. Confirmed bookings receive a ◈ Verified Booking badge.
          </p>
        </div>
      </div>

      {/* Review Form Modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)}>
        <ReviewForm
          entityType={entityType}
          entityId={listing.id}
          entityName={listing.name}
          onSuccess={() => {}}
          onClose={() => setFormOpen(false)}
        />
      </Modal>

      <SiteFooter />
    </div>
  );
};

export default PublicVendorProfilePage;
