import React, { useState } from 'react';
import { useTheme } from '../../theme/ThemeContext';

const ReviewCard = ({ review }) => {
  const C = useTheme();
  const FD = 'Cardo, serif';
  const FB = 'Inter, sans-serif';
  const [showReply, setShowReply] = useState(false);

  if (!review) return null;

  const {
    reviewer_name,
    reviewer_location,
    reviewer_role,
    event_type,
    event_date,
    guest_count,
    overall_rating,
    sub_ratings = {},
    review_title,
    review_text,
    is_verified,
    is_verified_booking,
    is_featured,
    featured_quote,
    review_date,
    published_at,
    reply_count,
    messages = [],
  } = review;

  // Use review_date (original date) for display, fallback to published_at
  const displayDate = review_date || published_at;
  const formattedDate = displayDate
    ? new Date(displayDate).toLocaleDateString('en-GB', { year: 'numeric', month: 'long' })
    : null;

  // Owner replies only (not admin notes, not reviewer messages)
  const ownerReplies = messages.filter(m => m.sender_type === 'owner' && !m.is_internal_note);

  const roleLabels = { couple: 'Couple', guest: 'Guest', planner: 'Planner', vendor: 'Vendor', corporate: 'Corporate', other: 'Other' };

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${is_featured ? C.gold + '40' : C.border}`,
      borderLeft: is_featured ? `3px solid ${C.gold}` : `1px solid ${C.border}`,
      borderRadius: 4,
      padding: 24,
      marginBottom: 20,
    }}>

      {/* Featured quote — pull quote above everything */}
      {is_featured && featured_quote && (
        <div style={{
          fontFamily: FD, fontSize: 18, fontStyle: 'italic',
          color: C.gold, lineHeight: 1.6, marginBottom: 16,
          paddingBottom: 16, borderBottom: `1px solid ${C.border}`,
        }}>
          "{featured_quote}"
        </div>
      )}

      {/* Header: reviewer + rating */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: FB, fontSize: 14, fontWeight: 600, color: C.textDark, marginBottom: 3 }}>
            {reviewer_name}
            {reviewer_location && (
              <span style={{ fontWeight: 400, color: C.textMid, marginLeft: 4 }}>, {reviewer_location}</span>
            )}
          </div>
          <div style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {reviewer_role && <span>{roleLabels[reviewer_role] || reviewer_role}</span>}
            {event_type && <span>{event_type}</span>}
            {event_date && <span>{new Date(event_date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long' })}</span>}
            {guest_count > 0 && <span>{guest_count} guests</span>}
            {formattedDate && <span style={{ color: C.textMuted }}>{formattedDate}</span>}
          </div>
        </div>

        {/* Verified badge — Booking > Couple > none */}
        {is_verified_booking ? (
          <div style={{
            background: `${C.gold}12`, border: `1px solid ${C.gold}50`,
            color: C.gold, padding: '5px 10px', borderRadius: 3,
            fontFamily: FB, fontSize: 10, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap',
          }}>
            ◈ LWD Verified Booking
          </div>
        ) : is_verified ? (
          <div style={{
            background: `${C.gold}10`, border: `1px solid ${C.gold}40`,
            color: C.gold, padding: '5px 10px', borderRadius: 3,
            fontFamily: FB, fontSize: 10, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap',
          }}>
            ◈ LWD Verified
          </div>
        ) : null}
      </div>

      {/* Rating */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontFamily: FD, fontSize: 22, fontWeight: 700, color: C.gold }}>{overall_rating}</span>
        <span style={{ fontSize: 14, color: C.gold, opacity: 0.8 }}>
          {'★'.repeat(Math.round(overall_rating))}{'☆'.repeat(5 - Math.round(overall_rating))}
        </span>
      </div>

      {/* Sub-ratings */}
      {Object.keys(sub_ratings).length > 0 && (
        <div style={{ marginBottom: 16, background: C.bg, padding: '10px 14px', borderRadius: 3 }}>
          {Object.entries(sub_ratings).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, fontSize: 11, fontFamily: FB }}>
              <span style={{ minWidth: 90, color: C.textMuted, textTransform: 'capitalize' }}>{key}</span>
              <div style={{ flex: 1, height: 3, background: C.border, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: C.gold, width: `${(Number(value) / 5) * 100}%` }} />
              </div>
              <span style={{ minWidth: 20, textAlign: 'right', color: C.gold, fontWeight: 600 }}>{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Review title */}
      <h3 style={{ fontFamily: FD, fontSize: 18, fontWeight: 400, color: C.textDark, margin: '0 0 10px', lineHeight: 1.4 }}>
        {review_title}
      </h3>

      {/* Review body */}
      <p style={{ fontFamily: FB, fontSize: 14, color: C.textLight, lineHeight: 1.8, margin: 0 }}>
        {review_text}
      </p>

      {/* Owner reply */}
      {reply_count > 0 && ownerReplies.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <button
            onClick={() => setShowReply(r => !r)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: FB, fontSize: 11, color: C.gold,
              padding: 0, textDecoration: 'underline',
            }}
          >
            {showReply ? 'Hide reply' : `View venue reply`}
          </button>
          {showReply && ownerReplies.map((msg, i) => (
            <div key={i} style={{
              marginTop: 12, padding: '12px 16px',
              background: `${C.gold}06`, borderLeft: `2px solid ${C.gold}40`,
              borderRadius: 2,
            }}>
              <div style={{ fontFamily: FB, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: C.gold, marginBottom: 6 }}>
                Venue Response · {new Date(msg.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <p style={{ fontFamily: FB, fontSize: 13, color: C.textMid, lineHeight: 1.7, margin: 0 }}>{msg.message_body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
