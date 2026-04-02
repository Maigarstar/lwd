import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import {
  fetchAdminReviews,
  getReviewStats,
  approveReview,
  rejectReview,
  softDeleteReview,
  restoreReview,
  updateReview,
  toggleFeatured,
  setVerification,
  markAwaitingReply,
  bulkApproveReviews,
  bulkRejectReviews,
  bulkSoftDeleteReviews,
  fetchReviewMessages,
  addReviewMessage,
  deleteReviewMessage,
  createReview,
  searchListings,
} from '../../services/adminReviewService';

// ─── Typography ───────────────────────────────────────────────────────────────
const ND = "'Cormorant Garamond', 'Playfair Display', Georgia, serif";
const NU = "'Inter', 'Helvetica Neue', sans-serif";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  pending:        { label: 'Pending',         icon: '⏱', bg: 'rgba(180,120,0,0.10)',   text: '#c9900a', border: 'rgba(180,120,0,0.20)' },
  approved:       { label: 'Approved',        icon: '✓',  bg: 'rgba(21,128,61,0.10)',   text: '#15803d', border: 'rgba(21,128,61,0.20)' },
  rejected:       { label: 'Rejected',        icon: '✕',  bg: 'rgba(185,28,28,0.10)',   text: '#b91c1c', border: 'rgba(185,28,28,0.20)' },
  awaiting_reply: { label: 'Awaiting Reply',  icon: '↩',  bg: 'rgba(37,99,235,0.10)',   text: '#2563eb', border: 'rgba(37,99,235,0.20)' },
  replied:        { label: 'Replied',         icon: '✦',  bg: 'rgba(109,40,217,0.10)',  text: '#7c3aed', border: 'rgba(109,40,217,0.20)' },
};

// ─── Role labels ──────────────────────────────────────────────────────────────
const ROLE_LABELS = {
  couple: 'Couple', guest: 'Guest', planner: 'Planner',
  vendor: 'Vendor', corporate: 'Corporate', other: 'Other',
};

// ─── Sub-rating labels ────────────────────────────────────────────────────────
const SUB_KEYS = ['venue', 'service', 'catering', 'atmosphere', 'value'];
const SUB_LABELS = { venue: 'Venue', service: 'Service', catering: 'Catering', atmosphere: 'Atmosphere', value: 'Value' };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function stars(n) {
  const full = Math.round(n || 0);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(diff / 86400000);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
}

function fmtDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── LWD Verified Badge ───────────────────────────────────────────────────────
// Badge hierarchy: Verified Booking > Verified Couple > no badge.
// Only ONE badge shown per review. Verified Booking requires verification_source
// in ('booking', 'enquiry'). Verified Couple requires is_verified + role='couple'
// and is only shown when is_verified_booking is false.
function LWDBadge({ review, C }) {
  // Determine which badge to show (hierarchy: Booking > Couple > none)
  let type = null;
  if (review.is_verified_booking &&
      (review.verification_source === 'booking' || review.verification_source === 'enquiry' || review.verification_source === 'manual')) {
    type = 'booking';
  } else if (review.is_verified && review.reviewer_role === 'couple' && !review.is_verified_booking) {
    type = 'couple';
  }
  if (!type) return null;

  const cfg = {
    booking: { label: 'LWD Verified Booking', icon: '◈' },
    couple:  { label: 'LWD Verified Couple',  icon: '◇' },
  };
  const b = cfg[type];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 9px', borderRadius: '2px',
      border: `1px solid ${C.gold}33`,
      background: `${C.gold}0a`,
      color: C.gold, fontFamily: NU, fontSize: '10px',
      fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
    }}>
      <span style={{ fontSize: '9px' }}>{b.icon}</span>
      {b.label}
    </span>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '2px',
      border: `1px solid ${s.border}`, background: s.bg,
      color: s.text, fontFamily: NU, fontSize: '10px',
      fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
    }}>
      <span>{s.icon}</span> {s.label}
    </span>
  );
}

// ─── Sub-ratings bar ──────────────────────────────────────────────────────────
function SubRatingsBar({ subRatings, C }) {
  if (!subRatings || Object.keys(subRatings).length === 0) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px', marginTop: '10px' }}>
      {SUB_KEYS.filter(k => subRatings[k] != null).map(k => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: NU, fontSize: '10px', color: C.grey, textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: 72 }}>
            {SUB_LABELS[k]}
          </span>
          <div style={{ flex: 1, height: 3, background: C.border, borderRadius: 2 }}>
            <div style={{ width: `${(subRatings[k] / 5) * 100}%`, height: '100%', background: C.gold, borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontFamily: NU, fontSize: '11px', color: C.white, minWidth: 22, textAlign: 'right' }}>
            {Number(subRatings[k]).toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Conversation thread ──────────────────────────────────────────────────────
function ConversationThread({ reviewId, C, onThreadLoaded }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState('reply'); // 'reply' | 'note'

  useEffect(() => {
    load();
  }, [reviewId]);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchReviewMessages(reviewId);
      setMessages(data);
      onThreadLoaded?.(data.length);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(isNote) {
    const body = isNote ? noteText.trim() : replyText.trim();
    if (!body) return;
    setSending(true);
    try {
      await addReviewMessage({
        reviewId,
        senderType: isNote ? 'admin' : 'admin',
        senderName: 'Admin',
        messageBody: body,
        isInternalNote: isNote,
      });
      isNote ? setNoteText('') : setReplyText('');
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(msgId) {
    if (!window.confirm('Delete this message?')) return;
    try {
      await deleteReviewMessage(msgId);
      await load();
    } catch (e) {
      console.error(e);
    }
  }

  const senderStyle = (type, isNote) => {
    if (isNote) return { bg: `${C.gold}08`, border: `${C.gold}20`, label: 'Admin Note', labelColor: C.gold };
    if (type === 'owner')    return { bg: `rgba(21,128,61,0.07)`,  border: 'rgba(21,128,61,0.18)',  label: 'Business Owner', labelColor: '#15803d' };
    if (type === 'reviewer') return { bg: `rgba(37,99,235,0.07)`,  border: 'rgba(37,99,235,0.18)',  label: 'Reviewer',       labelColor: '#2563eb' };
    return                          { bg: `rgba(109,40,217,0.07)`, border: 'rgba(109,40,217,0.18)', label: 'Admin',          labelColor: '#7c3aed' };
  };

  return (
    <div style={{ marginTop: 16, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
      <div style={{ fontFamily: NU, fontSize: 11, color: C.grey, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        Conversation Thread
      </div>

      {loading ? (
        <div style={{ height: 40, background: C.border, borderRadius: 4, opacity: 0.4 }} />
      ) : messages.length === 0 ? (
        <div style={{ fontFamily: NU, fontSize: 12, color: C.grey2, marginBottom: 12, lineHeight: 1.6 }}>
          No messages yet. Start the conversation with this reviewer, or add an internal note below.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {messages.map(msg => {
            const s = senderStyle(msg.sender_type, msg.is_internal_note);
            return (
              <div key={msg.id} style={{
                padding: '10px 14px', borderRadius: 4,
                background: s.bg, border: `1px solid ${s.border}`,
                position: 'relative',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, color: s.labelColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {msg.is_internal_note ? '🔒 ' : ''}{s.label}
                    </span>
                    {msg.sender_name && (
                      <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>— {msg.sender_name}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2 }}>{timeAgo(msg.created_at)}</span>
                    <button onClick={() => handleDelete(msg.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.grey2, fontSize: 11, padding: '0 2px', lineHeight: 1 }}>✕</button>
                  </div>
                </div>
                <p style={{ fontFamily: NU, fontSize: 12, color: C.white, margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {msg.message_body}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Add message */}
      <div style={{ background: C.dark, borderRadius: 4, padding: 12, border: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', gap: 0, marginBottom: 10, borderBottom: `1px solid ${C.border}` }}>
          {[['reply', 'Admin Reply'], ['note', 'Internal Note']].map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: NU, fontSize: 11, fontWeight: tab === t ? 700 : 400,
              color: tab === t ? C.gold : C.grey,
              paddingBottom: 8, paddingRight: 16, paddingLeft: 0,
              borderBottom: tab === t ? `2px solid ${C.gold}` : '2px solid transparent',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              transition: 'color 0.15s',
            }}>
              {t === 'note' && '🔒 '}{l}
            </button>
          ))}
        </div>
        <textarea
          value={tab === 'note' ? noteText : replyText}
          onChange={e => tab === 'note' ? setNoteText(e.target.value) : setReplyText(e.target.value)}
          placeholder={tab === 'note' ? 'Add an internal note (not visible to reviewer or business)...' : 'Write a reply from admin...'}
          rows={3}
          style={{
            width: '100%', boxSizing: 'border-box', resize: 'vertical',
            padding: '8px 10px', borderRadius: 3, fontFamily: NU, fontSize: 12,
            background: C.black, border: `1px solid ${C.border}`, color: C.white,
            outline: 'none',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button
            onClick={() => handleSend(tab === 'note')}
            disabled={sending || !(tab === 'note' ? noteText.trim() : replyText.trim())}
            style={{
              padding: '7px 18px', borderRadius: 3, border: 'none', cursor: 'pointer',
              fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
              textTransform: 'uppercase',
              background: sending ? C.border : C.gold,
              color: sending ? C.grey : '#fff',
              opacity: sending ? 0.6 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {sending ? 'Sending…' : (tab === 'note' ? 'Save Note' : 'Send Reply')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Owner identity panel ────────────────────────────────────────────────────
function OwnerIdentityPanel({ listing, C }) {
  if (!listing) return null;
  const cp = listing.contact_profile || {};
  const ownerName = cp.name || null;
  const ownerTitle = cp.title || null;
  const ownerEmail = cp.email || null;
  const hasClaimed = !!listing.vendor_account_id;

  if (!ownerName && !ownerEmail) return null;

  return (
    <div style={{
      marginTop: 14, padding: '12px 16px',
      background: C.dark,
      border: `1px solid ${C.border}`,
      borderLeft: `3px solid ${C.gold}35`,
      borderRadius: 3,
    }}>
      <div style={{
        fontFamily: NU, fontSize: 9, textTransform: 'uppercase',
        letterSpacing: '0.12em', color: C.gold, opacity: 0.7, marginBottom: 8, fontWeight: 700,
      }}>
        Business Owner
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {ownerName && (
          <span style={{ fontFamily: NU, fontSize: 12, fontWeight: 600, color: C.white }}>{ownerName}</span>
        )}
        {ownerTitle && (
          <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>— {ownerTitle}</span>
        )}
        {hasClaimed && (
          <span style={{
            fontFamily: NU, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em',
            color: '#15803d', border: '1px solid rgba(21,128,61,0.25)', borderRadius: 2,
            padding: '2px 7px', background: 'rgba(21,128,61,0.06)',
          }}>
            Platform Account
          </span>
        )}
        {!hasClaimed && (
          <span style={{
            fontFamily: NU, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em',
            color: C.grey2, border: `1px solid ${C.border}`, borderRadius: 2,
            padding: '2px 7px',
          }}>
            Unclaimed
          </span>
        )}
      </div>
      {ownerEmail && (
        <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2, marginTop: 4 }}>{ownerEmail}</div>
      )}
    </div>
  );
}

// ─── Review card ──────────────────────────────────────────────────────────────
function ReviewCard({ review, selected, onSelect, onApprove, onReject, onDelete, onRestore, onToggleFeatured, onVerify, onUpdate, C }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(review.review_title || '');
  const [editText, setEditText] = useState(review.review_text || '');
  const [saving, setSaving] = useState(false);
  // msgCount initialises from review.reply_count (DB), updated by thread load
  const [msgCount, setMsgCount] = useState(review.reply_count ?? 0);

  const businessName = review.listing?.name || `[${review.entity_type}]`;

  async function handleSave() {
    if (!editText.trim() || !editTitle.trim()) return;
    setSaving(true);
    try {
      await onUpdate(review.id, { review_title: editTitle, review_text: editText });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      background: C.card, border: `1px solid ${selected ? C.gold : C.border}`,
      borderRadius: 4, marginBottom: 8, overflow: 'hidden',
      boxShadow: expanded
        ? `0 4px 20px rgba(0,0,0,0.35), 0 0 0 1px ${C.gold}20`
        : selected ? `0 0 0 1px ${C.gold}40` : 'none',
      transition: 'border-color 0.2s, box-shadow 0.25s',
    }}>
      {/* Identity header block */}
      <div style={{
        padding: '14px 18px 12px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'flex-start', gap: 14,
        background: expanded ? `rgba(255,255,255,0.02)` : 'transparent',
        transition: 'background 0.2s',
      }}>
        {/* Checkbox */}
        <div style={{ paddingTop: 3 }}>
          <input
            type="checkbox" checked={selected}
            onChange={() => onSelect(review.id)}
            style={{ cursor: 'pointer', accentColor: C.gold, width: 14, height: 14 }}
          />
        </div>

        {/* Identity block */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Business name + type + status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: ND, fontSize: 16, color: C.white, fontWeight: 600 }}>
              {businessName}
            </span>
            <span style={{
              fontFamily: NU, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em',
              color: C.grey, padding: '2px 7px', border: `1px solid ${C.border}`, borderRadius: 2,
            }}>
              {review.entity_type}
            </span>
            <StatusBadge status={review.moderation_status} />
            {review.listing?.reputation_score != null && (
              <span style={{ fontFamily: NU, fontSize: 9, color: C.grey2, padding: '2px 6px', border: `1px solid ${C.border}`, borderRadius: 2 }}>
                ⊙ Rep {review.listing.reputation_score}
              </span>
            )}
            {review.is_featured && (
              <span style={{ fontFamily: NU, fontSize: 9, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.06em' }}>✦ Featured</span>
            )}
            {review.added_by_admin && (
              <span style={{
                fontFamily: NU, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em',
                color: '#7c3aed', padding: '2px 7px', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 2,
              }}>
                ⊕ Admin Added
              </span>
            )}
          </div>

          {/* Reviewer identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: NU, fontSize: 13, fontWeight: 700, color: C.white }}>
              {review.reviewer_name}
            </span>
            {review.reviewer_role && (
              <span style={{
                fontFamily: NU, fontSize: 10, color: C.grey,
                padding: '1px 7px', border: `1px solid ${C.border}`, borderRadius: 2,
              }}>
                {ROLE_LABELS[review.reviewer_role] || review.reviewer_role}
              </span>
            )}
            {review.reviewer_location && (
              <span style={{ fontFamily: NU, fontSize: 11, color: C.grey2 }}>
                {review.reviewer_location}
              </span>
            )}
            <LWDBadge review={review} C={C} />
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            background: 'none', border: `1px solid ${expanded ? C.gold + '60' : C.border}`,
            borderRadius: 3, cursor: 'pointer',
            color: expanded ? C.gold : C.grey, fontFamily: NU, fontSize: 11,
            padding: '4px 12px', whiteSpace: 'nowrap', marginTop: 2,
            transition: 'all 0.18s',
          }}
        >
          {expanded ? '▲ Close' : '▼ Expand'}
        </button>
      </div>

      {/* Content block — event context, rating, review text preview */}
      <div style={{ padding: '12px 18px 14px 46px' }}>

          {/* Event context — event_type · month/year · N guests */}
          {(review.event_type || review.event_date || review.guest_count) && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {review.event_type && (
                <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>
                  {review.event_type}
                </span>
              )}
              {review.event_date && (
                <>
                  {review.event_type && <span style={{ color: C.grey2, fontSize: 10 }}>·</span>}
                  <span style={{ fontFamily: NU, fontSize: 11, color: C.grey2 }}>
                    {new Date(review.event_date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                  </span>
                </>
              )}
              {review.guest_count > 0 && (
                <>
                  <span style={{ color: C.grey2, fontSize: 10 }}>·</span>
                  <span style={{ fontFamily: NU, fontSize: 11, color: C.grey2 }}>
                    {review.guest_count} guests
                  </span>
                </>
              )}
            </div>
          )}

          {/* Rating — score dominant, stars secondary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: ND, fontSize: 20, fontWeight: 700, color: C.gold, lineHeight: 1 }}>
              {Number(review.overall_rating || 0).toFixed(1)}
            </span>
            <span style={{ color: C.gold, fontSize: 11, letterSpacing: 1, opacity: 0.75 }}>{stars(review.overall_rating)}</span>
            {msgCount > 0 && (
              <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2 }}>· {msgCount} msg{msgCount !== 1 ? 's' : ''}</span>
            )}
            <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2, marginLeft: 'auto' }}>
              {timeAgo(review.created_at)}
            </span>
          </div>

          {/* Review title */}
          <div style={{ fontFamily: ND, fontSize: 14, color: C.white, marginBottom: 4, fontStyle: 'italic' }}>
            "{review.review_title}"
          </div>

          {/* Review text preview (collapsed only) */}
          {!expanded && (
            <p style={{ fontFamily: NU, fontSize: 12, color: C.grey, margin: 0, lineHeight: 1.6 }}>
              {review.review_text?.length > 160
                ? review.review_text.substring(0, 160) + '…'
                : review.review_text}
            </p>
          )}
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div style={{ padding: '0 18px 20px 46px', transition: 'all 0.2s' }}>
          <div style={{ paddingTop: 14 }}>

            {/* Full review text / edit */}
            {editing ? (
              <div style={{ marginBottom: 14 }}>
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box', marginBottom: 8,
                    padding: '8px 10px', borderRadius: 3, fontFamily: ND, fontSize: 14,
                    background: C.black, border: `1px solid ${C.border}`, color: C.white,
                    outline: 'none',
                  }}
                />
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  rows={6}
                  style={{
                    width: '100%', boxSizing: 'border-box', resize: 'vertical',
                    padding: '8px 10px', borderRadius: 3, fontFamily: NU, fontSize: 12,
                    background: C.black, border: `1px solid ${C.border}`, color: C.white,
                    outline: 'none', lineHeight: 1.7,
                  }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{ padding: '7px 16px', borderRadius: 3, border: 'none', cursor: 'pointer', fontFamily: NU, fontSize: 11, fontWeight: 700, background: '#15803d', color: '#fff', opacity: saving ? 0.6 : 1 }}
                  >
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => { setEditing(false); setEditTitle(review.review_title || ''); setEditText(review.review_text || ''); }}
                    style={{ padding: '7px 16px', borderRadius: 3, border: `1px solid ${C.border}`, cursor: 'pointer', fontFamily: NU, fontSize: 11, fontWeight: 700, background: 'none', color: C.grey }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontFamily: NU, fontSize: 13, color: C.white, margin: '0 0 10px', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                  {review.review_text}
                </p>
              </div>
            )}

            {/* Sub-ratings */}
            <SubRatingsBar subRatings={review.sub_ratings} C={C} />

            {/* Owner identity */}
            <OwnerIdentityPanel listing={review.listing} C={C} />

            {/* Admin notes */}
            {review.admin_notes && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: `${C.gold}08`, border: `1px solid ${C.gold}20`, borderRadius: 3 }}>
                <span style={{ fontFamily: NU, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.gold }}>Admin Notes</span>
                <p style={{ fontFamily: NU, fontSize: 12, color: C.grey, margin: '4px 0 0', lineHeight: 1.6 }}>{review.admin_notes}</p>
              </div>
            )}

            {/* Action bar
                Edge case rules:
                - pending → can Approve or Reject
                - approved → can mark Awaiting Reply, Reject, Feature, Verify, Delete
                - awaiting_reply → can Approve (re-approve), Reject, Delete
                - replied → can Approve, Reject, Delete
                - rejected → can Approve, Delete (no reject button shown when already rejected)
                - All statuses: Edit Review always available
                - Verify button: toggles is_verified_booking (LWD Verified Booking badge)
            */}
            <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* PRIMARY: Approve — visually dominant */}
              {review.moderation_status !== 'approved' && (
                <ActionBtn label="Approve" color="#15803d" variant="primary" onClick={() => onApprove(review.id)} />
              )}
              {/* Awaiting Reply: only from approved state */}
              {review.moderation_status === 'approved' && (
                <ActionBtn label="Flag Awaiting Reply" color="#2563eb" variant="solid" onClick={() => markAwaitingReply(review.id).then(load => load)} />
              )}
              {/* Reject: secondary solid */}
              {review.moderation_status !== 'rejected' && (
                <ActionBtn label="Reject" color="#b91c1c" variant="solid" onClick={() => onReject(review.id)} />
              )}
              {/* Edit: neutral ghost */}
              <ActionBtn
                label={editing ? 'Editing…' : 'Edit Review'}
                color={C.grey2}
                variant="ghost"
                onClick={() => { setEditing(true); setEditTitle(review.review_title || ''); setEditText(review.review_text || ''); }}
              />
              {/* Feature: gold outline */}
              {(review.moderation_status === 'approved' || review.moderation_status === 'replied') && (
                <ActionBtn
                  label={review.is_featured ? '★ Unfeature' : '☆ Feature'}
                  color={C.gold}
                  variant="outline"
                  onClick={() => onToggleFeatured(review.id, !review.is_featured)}
                />
              )}
              {/* Verify: ghost */}
              <ActionBtn
                label={review.is_verified_booking ? 'Remove Verified' : '◈ LWD Verified'}
                color={C.grey2}
                variant="ghost"
                onClick={() => onVerify(review.id, !review.is_verified_booking)}
              />
              {/* Delete: danger outline — subtle, intentional */}
              {!review.deleted_at && (
                <ActionBtn label="Delete" color="#b91c1c" variant="danger" onClick={() => onDelete(review.id)} />
              )}
              {/* Restore: only shown in trash view */}
              {review.deleted_at && onRestore && (
                <ActionBtn label="↩ Restore" color="#15803d" variant="solid" onClick={() => onRestore(review.id)} />
              )}
            </div>

            {/* Conversation thread */}
            <ConversationThread
              reviewId={review.id}
              C={C}
              onThreadLoaded={setMsgCount}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// variant: 'primary' | 'danger' | 'outline' | 'ghost'
function ActionBtn({ label, color, outline, variant, onClick }) {
  const v = variant || (outline ? 'outline' : 'solid');
  const styles = {
    primary: {
      padding: '6px 18px', background: color, border: 'none',
      color: '#fff', fontWeight: 700, fontSize: 10,
    },
    solid: {
      padding: '5px 14px', background: color, border: 'none',
      color: '#fff', fontWeight: 700, fontSize: 10,
    },
    danger: {
      padding: '5px 14px', background: 'none',
      border: `1px solid ${color}45`, color: color,
      fontWeight: 600, fontSize: 10,
    },
    outline: {
      padding: '5px 14px', background: 'none',
      border: `1px solid ${color}50`, color: color,
      fontWeight: 600, fontSize: 10,
    },
    ghost: {
      padding: '5px 14px', background: 'none',
      border: `1px solid ${color}30`, color: color,
      fontWeight: 600, fontSize: 10,
    },
  };
  const s = styles[v] || styles.solid;
  return (
    <button
      onClick={onClick}
      style={{
        ...s, borderRadius: 3, cursor: 'pointer',
        fontFamily: NU, letterSpacing: '0.05em', textTransform: 'uppercase',
        transition: 'opacity 0.15s',
      }}
    >
      {label}
    </button>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard({ C }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: '18px', marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ width: 14, height: 14, background: C.border, borderRadius: 2, marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 14, background: C.border, borderRadius: 2, marginBottom: 8, width: '40%', opacity: 0.6 }} />
          <div style={{ height: 11, background: C.border, borderRadius: 2, marginBottom: 6, width: '60%', opacity: 0.4 }} />
          <div style={{ height: 11, background: C.border, borderRadius: 2, width: '80%', opacity: 0.3 }} />
        </div>
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, active, accent, onClick, C }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '16px 20px', borderRadius: 4, cursor: 'pointer',
        border: active ? `1px solid ${accent}60` : `1px solid ${C.border}`,
        background: active ? `${accent}12` : C.card,
        textAlign: 'left', transition: 'all 0.18s', width: '100%',
        boxShadow: active ? `inset 3px 0 0 ${accent}` : 'none',
      }}
    >
      <div style={{
        fontFamily: NU, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em',
        color: active ? accent : C.grey, marginBottom: 8, fontWeight: active ? 700 : 400,
      }}>
        {label}
      </div>
      <div style={{ fontFamily: ND, fontSize: 38, fontWeight: 600, color: active ? accent : C.white, lineHeight: 1 }}>
        {value ?? '—'}
      </div>
    </button>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, onDone, C }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{
      position: 'fixed', bottom: 32, right: 32, zIndex: 9999,
      background: C.card, border: `1px solid ${C.gold}40`, borderRadius: 4,
      padding: '12px 20px', boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      fontFamily: NU, fontSize: 12, color: C.white, maxWidth: 320,
    }}>
      {message}
    </div>
  );
}

// ─── Star Rating Selector (overall) ───────────────────────────────────────────
function StarSelector({ value, onChange, C }) {
  const [hovered, setHovered] = useState(null);
  const display = hovered ?? value;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onChange(n)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 32, lineHeight: 1, padding: '2px 3px',
            color: n <= display ? C.gold : `${C.border}`,
            transition: 'color 0.1s',
          }}
        >★</button>
      ))}
      <span style={{ fontFamily: ND, fontSize: 26, fontWeight: 600, color: C.gold, marginLeft: 10 }}>
        {value}
      </span>
    </div>
  );
}

// ─── Mini Star Selector (sub-ratings) ─────────────────────────────────────────
function MiniStarSelector({ value, onChange, C }) {
  const [hovered, setHovered] = useState(null);
  const display = hovered ?? value ?? 0;
  return (
    <div style={{ display: 'flex', gap: 1 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onChange(n === value ? null : n)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 17, lineHeight: 1, padding: '1px 1px',
            color: n <= display ? C.gold : C.border,
            transition: 'color 0.1s',
          }}
        >★</button>
      ))}
    </div>
  );
}

// ─── Verification source options ──────────────────────────────────────────────
const VERIFICATION_SOURCES = [
  { value: 'manual_verified',    label: 'Manual Verified' },
  { value: 'email_verified',     label: 'Email Verified' },
  { value: 'whatsapp_verified',  label: 'WhatsApp Verified' },
  { value: 'imported_testimonial', label: 'Imported Testimonial' },
  { value: 'booking',            label: 'Booking Record' },
  { value: 'enquiry',            label: 'Enquiry Record' },
  { value: 'manual',             label: 'Manual (unspecified)' },
];

// ─── Add Review Panel ─────────────────────────────────────────────────────────
function AddReviewPanel({ onClose, onSaved, C }) {
  const [listing, setListing] = useState(null);        // { id, name }
  const [listingSearch, setListingSearch] = useState('');
  const [listingResults, setListingResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const searchRef = useRef(null);

  // Form state
  const [form, setForm] = useState({
    entityType:          'venue',
    reviewerName:        '',
    reviewerEmail:       '',
    reviewerRole:        '',
    reviewerLocation:    '',
    reviewTitle:         '',
    reviewText:          '',
    overallRating:       5,
    subRatings:          { venue: null, service: null, catering: null, atmosphere: null, value: null },
    eventType:           '',
    eventDate:           '',
    guestCount:          '',
    reviewDate:          '',
    isVerified:          false,
    isVerifiedBooking:   false,
    verificationSource:  'manual_verified',
    moderationStatus:    'approved',
    isPublic:            true,
    isFeatured:          false,
    featuredQuote:       '',
    useHighlightQuote:   false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Authenticity checks (required before publishing)
  const [checks, setChecks] = useState({ pasted: false, identity: false, verification: false, dateAccurate: false });
  const toggleCheck = (k) => setChecks(c => ({ ...c, [k]: !c[k] }));
  const allChecked = Object.values(checks).every(Boolean);

  // Duplicate detection
  const [dupWarning, setDupWarning] = useState(null);
  useEffect(() => {
    if (!listing || form.reviewerName.trim().length < 4) { setDupWarning(null); return; }
    const t = setTimeout(async () => {
      try {
        const { reviews: hits } = await fetchAdminReviews({ searchQuery: form.reviewerName.trim(), limit: 5 });
        const match = hits.find(r => r.entity_id === listing.id);
        setDupWarning(match ? `A review from "${match.reviewer_name}" for this venue already exists (${match.moderation_status}).` : null);
      } catch { /* silent */ }
    }, 600);
    return () => clearTimeout(t);
  }, [form.reviewerName, listing]);

  // Auto-suggest overall rating from sub-ratings
  const filledSubs = Object.values(form.subRatings).filter(v => v !== null && v !== '');
  const suggestedRating = filledSubs.length >= 2
    ? Math.round((filledSubs.reduce((a, b) => a + Number(b), 0) / filledSubs.length) * 10) / 10
    : null;
  const suggestDiffers = suggestedRating !== null && suggestedRating !== form.overallRating;

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setSub = (key, val) => setForm(f => ({ ...f, subRatings: { ...f.subRatings, [key]: val } }));

  // Venue search with debounce
  useEffect(() => {
    if (listingSearch.length < 2) { setListingResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchListings(listingSearch, 8);
        setListingResults(results);
      } catch (e) { console.error(e); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [listingSearch]);

  async function handleSubmit() {
    if (!listing) { setError('Please select a venue or vendor.'); return; }
    if (!form.reviewerName.trim()) { setError('Reviewer name is required.'); return; }
    if (!form.reviewTitle.trim()) { setError('Review title is required.'); return; }
    if (!form.reviewText.trim()) { setError('Review text is required.'); return; }
    if (form.moderationStatus === 'approved' && !allChecked) {
      setError('Please complete the authenticity confirmation before publishing.'); return;
    }

    setSaving(true);
    setError(null);
    try {
      const subRatings = {};
      Object.entries(form.subRatings).forEach(([k, v]) => {
        if (v !== '' && v !== null) subRatings[k] = parseFloat(v);
      });
      await createReview({
        entityId:           listing.id,
        entityType:         form.entityType,
        reviewerName:       form.reviewerName.trim(),
        reviewerEmail:      form.reviewerEmail.trim() || null,
        reviewerRole:       form.reviewerRole || null,
        reviewerLocation:   form.reviewerLocation.trim() || null,
        reviewTitle:        form.reviewTitle.trim(),
        reviewText:         form.reviewText.trim(),
        overallRating:      parseFloat(form.overallRating),
        subRatings:         Object.keys(subRatings).length ? subRatings : null,
        eventType:          form.eventType.trim() || null,
        eventDate:          form.eventDate || null,
        guestCount:         form.guestCount ? parseInt(form.guestCount) : null,
        reviewDate:         form.reviewDate || null,
        isVerified:         form.isVerified,
        isVerifiedBooking:  form.isVerifiedBooking,
        verificationSource: form.isVerifiedBooking ? form.verificationSource : null,
        moderationStatus:   form.moderationStatus,
        isPublic:           form.isPublic,
        isFeatured:         form.isFeatured,
        featuredQuote:      (form.isFeatured && form.useHighlightQuote && form.featuredQuote.trim()) ? form.featuredQuote.trim() : null,
      });
      onSaved();
    } catch (e) {
      setError(e.message || 'Failed to save review.');
    } finally {
      setSaving(false);
    }
  }

  // Input field helper
  const Field = ({ label, hint, children }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontFamily: NU, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.grey, marginBottom: 5 }}>
        {label}
        {hint && <span style={{ fontFamily: NU, fontSize: 10, textTransform: 'none', letterSpacing: 0, color: C.grey2, marginLeft: 6, fontStyle: 'italic' }}>{hint}</span>}
      </label>
      {children}
    </div>
  );

  const inputStyle = {
    width: '100%', boxSizing: 'border-box', padding: '8px 10px',
    borderRadius: 3, background: C.black, border: `1px solid ${C.border}`,
    color: C.white, fontFamily: NU, fontSize: 12, outline: 'none',
  };
  const selectStyle = { ...inputStyle, cursor: 'pointer' };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1200,
      display: 'flex', alignItems: 'stretch',
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ flex: 1, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
      />

      {/* Panel */}
      <div style={{
        width: 520, maxWidth: '100vw', background: C.dark,
        borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          position: 'sticky', top: 0, background: C.dark, zIndex: 1,
        }}>
          <div>
            <h2 style={{ fontFamily: ND, fontSize: 20, color: C.white, margin: '0 0 3px', fontWeight: 600 }}>
              Add Client Review
            </h2>
            <p style={{ fontFamily: NU, fontSize: 11, color: C.grey, margin: 0 }}>
              Upload a verified review received offline or via email / WhatsApp
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setShowPreview(p => !p)}
              style={{
                background: 'none', border: `1px solid ${showPreview ? C.gold + '60' : C.border}`,
                borderRadius: 3, cursor: 'pointer', color: showPreview ? C.gold : C.grey,
                fontFamily: NU, fontSize: 11, padding: '5px 12px', transition: 'all 0.15s',
              }}
            >
              {showPreview ? '✕ Close Preview' : '⊙ Preview'}
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.grey, fontSize: 18, padding: 0, lineHeight: 1 }}>✕</button>
          </div>
        </div>

        {/* Preview pane — listing context */}
        {showPreview && (
          <div style={{ borderBottom: `1px solid ${C.border}` }}>
            {/* Mock listing header strip */}
            <div style={{ padding: '10px 24px', background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${C.border}40`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: ND, fontSize: 13, color: C.white, fontWeight: 600 }}>{listing?.name || 'Venue Name'}</span>
              <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2 }}>·</span>
              <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Reviews</span>
              {listing && (
                <span style={{ marginLeft: 'auto', fontFamily: NU, fontSize: 9, color: C.grey2, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 8px', border: `1px solid ${C.border}`, borderRadius: 2 }}>
                  Live listing context
                </span>
              )}
            </div>
            {/* Review card in listing style */}
            <div style={{ padding: '16px 24px', background: `${C.gold}03` }}>
              <div style={{ fontFamily: NU, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.gold, marginBottom: 12, fontWeight: 700 }}>
                Public Preview
              </div>
              <div style={{ borderLeft: `3px solid ${C.gold}30`, paddingLeft: 16 }}>
                {/* Rating + date */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: ND, fontSize: 22, fontWeight: 700, color: C.gold }}>{form.overallRating}</span>
                    <span style={{ fontFamily: NU, fontSize: 13, color: C.gold, opacity: 0.75 }}>{'★'.repeat(form.overallRating)}{'☆'.repeat(5 - form.overallRating)}</span>
                  </div>
                  <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2 }}>
                    {form.reviewDate ? new Date(form.reviewDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Review date not set'}
                  </span>
                </div>
                {/* Verified badge */}
                {(form.isVerified || form.isVerifiedBooking) && (
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontFamily: NU, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.gold, padding: '2px 8px', border: `1px solid ${C.gold}40`, borderRadius: 2 }}>
                      {form.isVerifiedBooking ? '◈ LWD Verified Booking' : '◈ LWD Verified Couple'}
                    </span>
                  </div>
                )}
                {/* Featured quote */}
                {form.isFeatured && form.useHighlightQuote && form.featuredQuote && (
                  <div style={{ fontFamily: ND, fontSize: 15, fontStyle: 'italic', color: C.gold, margin: '8px 0', lineHeight: 1.5 }}>
                    "{form.featuredQuote}"
                  </div>
                )}
                {/* Title */}
                <div style={{ fontFamily: ND, fontSize: 16, fontWeight: 600, color: C.white, marginBottom: 6, lineHeight: 1.3 }}>
                  {form.reviewTitle || <span style={{ color: C.grey2, fontStyle: 'italic' }}>Review title</span>}
                </div>
                {/* Body */}
                <div style={{ fontFamily: NU, fontSize: 11, color: C.grey, lineHeight: 1.75, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 10 }}>
                  {form.reviewText || <span style={{ color: C.grey2, fontStyle: 'italic' }}>Review text will appear here…</span>}
                </div>
                {/* Reviewer identity */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, color: C.white }}>{form.reviewerName || 'Reviewer'}</span>
                  {[
                    form.reviewerRole ? ROLE_LABELS[form.reviewerRole] : null,
                    form.reviewerLocation || null,
                  ].filter(Boolean).map((t, i) => (
                    <span key={i} style={{ fontFamily: NU, fontSize: 10, color: C.grey2 }}>· {t}</span>
                  ))}
                </div>
                {/* Event context */}
                {(form.eventType || form.guestCount) && (
                  <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2, marginTop: 4 }}>
                    {[form.eventType, form.guestCount ? `${form.guestCount} guests` : null].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form body */}
        <div style={{ padding: '20px 24px', flex: 1 }}>

          {/* ── Section: Business ── */}
          <div style={{ fontFamily: NU, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.gold, marginBottom: 12, fontWeight: 700 }}>
            Business
          </div>

          <Field label="Venue or Vendor" hint="required">
            <div style={{ position: 'relative' }} ref={searchRef}>
              {listing ? (
                <div style={{
                  ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: `${C.gold}0a`, border: `1px solid ${C.gold}40`,
                }}>
                  <span style={{ color: C.white }}>{listing.name}</span>
                  <button onClick={() => { setListing(null); setListingSearch(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.grey, fontSize: 12 }}>✕</button>
                </div>
              ) : (
                <input
                  value={listingSearch}
                  onChange={e => setListingSearch(e.target.value)}
                  placeholder="Search venue or vendor name…"
                  style={inputStyle}
                />
              )}
              {!listing && listingResults.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                  background: C.card, border: `1px solid ${C.border}`, borderTop: 'none',
                  borderRadius: '0 0 3px 3px', maxHeight: 200, overflowY: 'auto',
                }}>
                  {listingResults.map(r => (
                    <button key={r.id} onClick={() => { setListing(r); setListingSearch(''); setListingResults([]); }} style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer',
                      fontFamily: NU, fontSize: 12, color: C.white,
                      borderBottom: `1px solid ${C.border}`,
                    }}>
                      <span>{r.name}</span>
                      <span style={{ color: C.grey2, fontSize: 10, marginLeft: 8 }}>{r.city}, {r.country}</span>
                    </button>
                  ))}
                </div>
              )}
              {searching && <span style={{ position: 'absolute', right: 10, top: 9, fontFamily: NU, fontSize: 10, color: C.grey2 }}>…</span>}
            </div>
          </Field>

          <Field label="Entity Type">
            <select value={form.entityType} onChange={e => set('entityType', e.target.value)} style={selectStyle}>
              <option value="venue">Venue</option>
              <option value="planner">Planner</option>
              <option value="vendor">Vendor</option>
            </select>
          </Field>

          <div style={{ height: 1, background: `${C.border}80`, margin: '24px 0' }} />

          {/* ── Section: Reviewer ── */}
          <div style={{ fontFamily: NU, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.gold, marginBottom: 12, fontWeight: 700 }}>
            Reviewer
          </div>

          <Field label="Full Name" hint="required">
            <input value={form.reviewerName} onChange={e => set('reviewerName', e.target.value)} placeholder="e.g. Alexandra & James Whitmore" style={inputStyle} />
            {dupWarning && (
              <div style={{ marginTop: 6, padding: '6px 10px', borderRadius: 3, background: 'rgba(180,120,0,0.08)', border: '1px solid rgba(180,120,0,0.25)', fontFamily: NU, fontSize: 10, color: '#c9900a' }}>
                ⚠ {dupWarning}
              </div>
            )}
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Email">
              <input value={form.reviewerEmail} onChange={e => set('reviewerEmail', e.target.value)} placeholder="optional" style={inputStyle} />
            </Field>
            <Field label="Location">
              <input value={form.reviewerLocation} onChange={e => set('reviewerLocation', e.target.value)} placeholder="e.g. London, UK" style={inputStyle} />
            </Field>
          </div>

          <Field label="Role">
            <select value={form.reviewerRole} onChange={e => set('reviewerRole', e.target.value)} style={selectStyle}>
              <option value="">— Select role —</option>
              <option value="couple">Couple</option>
              <option value="guest">Guest</option>
              <option value="planner">Planner</option>
              <option value="vendor">Vendor</option>
              <option value="corporate">Corporate</option>
              <option value="other">Other</option>
            </select>
          </Field>

          <div style={{ height: 1, background: `${C.border}80`, margin: '24px 0' }} />

          {/* ── Section: Review Content ── */}
          <div style={{ fontFamily: NU, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.gold, marginBottom: 12, fontWeight: 700 }}>
            Review
          </div>

          <Field label="Title" hint="required">
            <input
              value={form.reviewTitle}
              onChange={e => set('reviewTitle', e.target.value)}
              placeholder="e.g. An island that felt entirely ours"
              style={{
                ...inputStyle,
                fontFamily: ND, fontSize: 16, fontWeight: 600,
                padding: '10px 12px', letterSpacing: '0.01em',
              }}
            />
          </Field>

          <Field label="Review Text" hint="required">
            <textarea value={form.reviewText} onChange={e => set('reviewText', e.target.value)} rows={6} placeholder="Full review text from the client…" style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }} />
          </Field>

          <Field label="Overall Rating">
            <StarSelector value={form.overallRating} onChange={v => set('overallRating', v)} C={C} />
            {suggestDiffers && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2, fontStyle: 'italic' }}>
                  Suggested {suggestedRating} based on sub-ratings
                </span>
                <button
                  type="button"
                  onClick={() => set('overallRating', suggestedRating)}
                  style={{ background: 'none', border: `1px solid ${C.gold}50`, borderRadius: 2, cursor: 'pointer', fontFamily: NU, fontSize: 10, color: C.gold, padding: '2px 8px' }}
                >
                  Apply
                </button>
              </div>
            )}
          </Field>

          <Field label="Review Date" hint="when client gave review">
            <input type="date" value={form.reviewDate} onChange={e => set('reviewDate', e.target.value)} style={inputStyle} />
          </Field>

          {/* Sub-ratings */}
          <Field label="Sub-Ratings" hint="all optional — click to rate">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SUB_KEYS.map(k => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: NU, fontSize: 10, color: C.grey, textTransform: 'uppercase', letterSpacing: '0.07em', width: 80 }}>
                    {SUB_LABELS[k]}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <MiniStarSelector value={form.subRatings[k] || null} onChange={v => setSub(k, v)} C={C} />
                    {form.subRatings[k] && (
                      <span style={{ fontFamily: NU, fontSize: 11, color: C.gold, minWidth: 16 }}>{form.subRatings[k]}</span>
                    )}
                    {!form.subRatings[k] && (
                      <span style={{ fontFamily: NU, fontSize: 11, color: C.border, minWidth: 16 }}>—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Field label="Event Type">
              <input value={form.eventType} onChange={e => set('eventType', e.target.value)} placeholder="e.g. Wedding" style={inputStyle} />
            </Field>
            <Field label="Event Date">
              <input type="date" value={form.eventDate} onChange={e => set('eventDate', e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Guest Count">
              <input type="number" min="0" value={form.guestCount} onChange={e => set('guestCount', e.target.value)} placeholder="e.g. 88" style={inputStyle} />
            </Field>
          </div>

          <div style={{ height: 1, background: `${C.border}80`, margin: '24px 0' }} />

          {/* ── Section: Verification ── */}
          <div style={{ fontFamily: NU, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.gold, marginBottom: 12, fontWeight: 700 }}>
            Verification
          </div>

          <p style={{ fontFamily: NU, fontSize: 10, color: C.grey2, margin: '0 0 12px', fontStyle: 'italic' }}>
            Select one verification type — only the highest applies
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {[
              { value: 'none',    label: 'No verification',       sub: 'Unverified submission' },
              { value: 'couple',  label: 'LWD Verified Couple',   sub: 'Identity confirmed, not a booking record' },
              { value: 'booking', label: '◈ LWD Verified Booking', sub: 'Confirmed via booking or enquiry record' },
            ].map(opt => {
              const current =
                form.isVerifiedBooking ? 'booking' :
                form.isVerified ? 'couple' : 'none';
              const selected = current === opt.value;
              return (
                <label
                  key={opt.value}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer',
                    padding: '10px 12px', borderRadius: 3,
                    border: `1px solid ${selected ? C.gold + '50' : C.border}`,
                    background: selected ? `${C.gold}08` : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <input
                    type="radio"
                    name="verification_type"
                    checked={selected}
                    onChange={() => {
                      set('isVerified', opt.value === 'couple');
                      set('isVerifiedBooking', opt.value === 'booking');
                    }}
                    style={{ accentColor: C.gold, marginTop: 2, cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontFamily: NU, fontSize: 12, color: C.white, fontWeight: selected ? 600 : 400 }}>{opt.label}</div>
                    <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2, marginTop: 2 }}>{opt.sub}</div>
                  </div>
                </label>
              );
            })}
          </div>

          {form.isVerifiedBooking && (
            <Field label="Verification Source">
              <select value={form.verificationSource} onChange={e => set('verificationSource', e.target.value)} style={selectStyle}>
                {VERIFICATION_SOURCES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              {form.verificationSource && (
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: NU, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.gold, padding: '2px 8px', border: `1px solid ${C.gold}40`, borderRadius: 2 }}>
                    {VERIFICATION_SOURCES.find(s => s.value === form.verificationSource)?.label || form.verificationSource}
                  </span>
                  <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2 }}>will appear in admin audit trail</span>
                </div>
              )}
            </Field>
          )}

          <div style={{ height: 1, background: `${C.border}80`, margin: '24px 0' }} />

          {/* ── Section: Status & Visibility ── */}
          <div style={{ fontFamily: NU, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.gold, marginBottom: 12, fontWeight: 700 }}>
            Status &amp; Visibility
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <Field label="Moderation Status">
              <select value={form.moderationStatus} onChange={e => set('moderationStatus', e.target.value)} style={selectStyle}>
                <option value="approved">Approved</option>
                <option value="pending">Pending Review</option>
                <option value="awaiting_reply">Awaiting Reply</option>
              </select>
            </Field>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 22 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: NU, fontSize: 12, color: C.white }}>
                <input type="checkbox" checked={form.isPublic} onChange={e => set('isPublic', e.target.checked)} style={{ accentColor: C.gold, cursor: 'pointer' }} />
                Public (visible on listing)
              </label>
            </div>
          </div>

          {/* Featured editorial card */}
          <div style={{
            marginTop: 14, padding: '14px 14px', borderRadius: 3,
            border: `1px solid ${form.isFeatured ? C.gold + '50' : C.border}`,
            background: form.isFeatured ? `${C.gold}06` : 'transparent',
            transition: 'all 0.18s',
          }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.isFeatured} onChange={e => set('isFeatured', e.target.checked)} style={{ accentColor: C.gold, cursor: 'pointer', marginTop: 2 }} />
              <div>
                <div style={{ fontFamily: NU, fontSize: 12, color: form.isFeatured ? C.gold : C.white, fontWeight: form.isFeatured ? 600 : 400 }}>
                  ✦ Feature on listing and editorial
                </div>
                <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2, marginTop: 2 }}>
                  Displayed prominently on the venue page and eligible for editorial use
                </div>
              </div>
            </label>
            {form.isFeatured && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 8 }}>
                  <input type="checkbox" checked={form.useHighlightQuote} onChange={e => set('useHighlightQuote', e.target.checked)} style={{ accentColor: C.gold, cursor: 'pointer' }} />
                  <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>Extract a highlight quote for editorial use</span>
                </label>
                {form.useHighlightQuote && (
                  <textarea
                    value={form.featuredQuote}
                    onChange={e => set('featuredQuote', e.target.value)}
                    placeholder="Paste the standout sentence or phrase from this review…"
                    rows={2}
                    style={{ ...inputStyle, resize: 'vertical', fontStyle: 'italic', fontSize: 12 }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Authenticity confirmation (required for publish) */}
          {form.moderationStatus === 'approved' && (
            <div style={{
              marginTop: 24, padding: '14px 16px', borderRadius: 3,
              border: `1px solid ${allChecked ? '#15803d40' : C.border}`,
              background: allChecked ? 'rgba(21,128,61,0.05)' : `${C.gold}04`,
            }}>
              <div style={{ fontFamily: NU, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: allChecked ? '#15803d' : C.gold, marginBottom: 10, fontWeight: 700 }}>
                {allChecked ? '✓ Authenticity Confirmed' : 'Confirm Review Authenticity'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { key: 'pasted',       label: 'Review text copied from original source (email, WhatsApp, PDF)' },
                  { key: 'identity',     label: 'Client identity confirmed — name matches contact record' },
                  { key: 'verification', label: 'Verification type accurately reflects how we verified this review' },
                  { key: 'dateAccurate', label: 'Review date reflects when the client gave this review, not today' },
                ].map(({ key, label }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={checks[key]}
                      onChange={() => toggleCheck(key)}
                      style={{ accentColor: '#15803d', cursor: 'pointer', marginTop: 2 }}
                    />
                    <span style={{ fontFamily: NU, fontSize: 11, color: checks[key] ? C.white : C.grey, lineHeight: 1.5 }}>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Audit note */}
          <div style={{
            padding: '10px 14px', background: `${C.gold}08`,
            border: `1px solid ${C.gold}20`, borderRadius: 3, marginTop: 16, marginBottom: 20,
            fontFamily: NU, fontSize: 11, color: C.grey, lineHeight: 1.6,
          }}>
            This review will be marked <strong style={{ color: C.gold }}>Added by Admin</strong> in the system. The review date you set above will be used for public display — not the system entry date.
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: '9px 12px', background: 'rgba(185,28,28,0.1)', border: '1px solid rgba(185,28,28,0.25)', borderRadius: 3, marginBottom: 14, fontFamily: NU, fontSize: 12, color: '#f87171' }}>
              {error}
            </div>
          )}

          {/* Actions */}
          {(() => {
            const isPublish = form.moderationStatus === 'approved' && form.isPublic;
            const isDraft = form.moderationStatus === 'pending';
            const btnLabel = saving ? 'Saving…' : isPublish ? 'Publish Review' : isDraft ? 'Save as Draft' : 'Save Review';
            const btnBg = saving ? C.border : isPublish ? '#15803d' : isDraft ? C.card : '#1a1a1a';
            const btnBorder = isDraft ? `1px solid ${C.border}` : 'none';
            return (
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  style={{
                    flex: 1, padding: '11px 0', borderRadius: 3, border: btnBorder,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                    background: btnBg, color: '#fff', opacity: saving ? 0.6 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  {btnLabel}
                </button>
                <button
                  onClick={onClose}
                  style={{
                    padding: '11px 20px', borderRadius: 3, border: `1px solid ${C.border}`, cursor: 'pointer',
                    fontFamily: NU, fontSize: 11, fontWeight: 600, background: 'none', color: C.grey,
                  }}
                >
                  Cancel
                </button>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

// ─── Main module ──────────────────────────────────────────────────────────────
const ReviewsModule = () => {
  const C = useTheme();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('pending');
  const [entityTypeFilter, setEntityTypeFilter] = useState(null);
  const [addedByAdminFilter, setAddedByAdminFilter] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReviews, setSelectedReviews] = useState(new Set());
  const searchTimeout = useRef(null);

  // Reject-with-reason state
  const [rejectTarget, setRejectTarget] = useState(null); // { id }
  const [rejectReason, setRejectReason] = useState('');

  // Pagination
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const PER_PAGE = 20;

  // Add review panel
  const [showAddPanel, setShowAddPanel] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  const notify = (msg) => setToast(msg);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ reviews: data, total: count }, statsData] = await Promise.all([
        fetchAdminReviews({
          status: showDeleted ? null : (statusFilter || null),
          entityType: entityTypeFilter || null,
          addedByAdmin: addedByAdminFilter ? true : null,
          showDeleted,
          searchQuery: searchQuery || null,
          limit: PER_PAGE,
          offset,
        }),
        getReviewStats(),
      ]);
      setReviews(data);
      setTotal(count);
      setStats(statsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, entityTypeFilter, addedByAdminFilter, showDeleted, searchQuery, offset]);

  useEffect(() => { load(); }, [load]);

  // Debounced search
  const handleSearch = (val) => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearchQuery(val);
      setOffset(0);
    }, 350);
  };

  const handleApprove = async (id) => {
    await approveReview(id);
    notify('Review approved and published');
    load();
  };

  const handleReject = (id) => {
    setRejectTarget({ id });
    setRejectReason('');
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    await rejectReview(rejectTarget.id, rejectReason.trim() || null);
    setRejectTarget(null);
    setRejectReason('');
    notify('Review rejected');
    load();
  };

  const handleRestore = async (id) => {
    await restoreReview(id);
    notify('Review restored');
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this review from public view? It will be kept in records.')) return;
    await softDeleteReview(id);
    notify('Review removed from public view');
    load();
  };

  const handleToggleFeatured = async (id, val) => {
    await toggleFeatured(id, val);
    notify(val ? 'Review featured' : 'Review unfeatured');
    load();
  };

  const handleVerify = async (id, val) => {
    await setVerification(id, val, 'manual');
    notify(val ? 'LWD Verified Booking badge applied' : 'Verification removed');
    load();
  };

  const handleUpdate = async (id, updates) => {
    await updateReview(id, updates);
    notify('Review updated');
    load();
  };

  const handleSelectReview = (id) => {
    setSelectedReviews(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedReviews(selectedReviews.size === reviews.length && reviews.length > 0
      ? new Set()
      : new Set(reviews.map(r => r.id))
    );
  };

  const handleBulkApprove = async () => {
    await bulkApproveReviews(Array.from(selectedReviews));
    setSelectedReviews(new Set());
    notify(`${selectedReviews.size} reviews approved`);
    load();
  };

  const handleBulkReject = async () => {
    await bulkRejectReviews(Array.from(selectedReviews));
    setSelectedReviews(new Set());
    notify(`${selectedReviews.size} reviews rejected`);
    load();
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Remove ${selectedReviews.size} review(s) from public view?`)) return;
    await bulkSoftDeleteReviews(Array.from(selectedReviews));
    setSelectedReviews(new Set());
    notify(`${selectedReviews.size} reviews removed`);
    load();
  };

  const pagesCount = Math.ceil(total / PER_PAGE);
  const currentPage = Math.floor(offset / PER_PAGE) + 1;

  const STATUS_TABS = [
    { value: 'pending',        label: 'Pending',        count: stats?.pending        ?? 0, accent: '#c9900a' },
    { value: 'approved',       label: 'Approved',       count: stats?.approved       ?? 0, accent: '#15803d' },
    { value: 'awaiting_reply', label: 'Awaiting Reply', count: stats?.awaiting_reply ?? 0, accent: '#2563eb' },
    { value: 'replied',        label: 'Replied',        count: stats?.replied        ?? 0, accent: '#7c3aed' },
    { value: 'rejected',       label: 'Rejected',       count: stats?.rejected       ?? 0, accent: '#b91c1c' },
    { value: '__deleted__',    label: 'Trash',          count: null,                        accent: '#6b7280' },
    { value: null,             label: 'All',            count: stats?.total          ?? 0, accent: C.gold    },
  ];

  return (
    <div style={{ padding: '32px 36px', minHeight: '100vh', background: C.black, color: C.white }}>

      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: ND, fontSize: 28, fontWeight: 600, color: C.white, margin: '0 0 4px' }}>
            Review Moderation Studio
          </h1>
          <p style={{ fontFamily: NU, fontSize: 12, color: C.grey, margin: 0, letterSpacing: '0.02em' }}>
            Review reputation, conversation threads, and moderation
          </p>
        </div>
        <button
          onClick={() => setShowAddPanel(true)}
          style={{
            fontFamily: NU, fontSize: 12, fontWeight: 600,
            background: C.gold, color: '#fff',
            border: 'none', borderRadius: 3, cursor: 'pointer',
            padding: '9px 18px', letterSpacing: '0.02em', whiteSpace: 'nowrap',
            marginTop: 4,
          }}
        >
          + Add Review
        </button>
      </div>

      {/* Stat tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 28 }}>
        {STATUS_TABS.map(t => (
          <StatCard
            key={String(t.value)}
            label={t.label}
            value={t.count ?? '—'}
            active={t.value === '__deleted__' ? showDeleted : (!showDeleted && statusFilter === t.value)}
            accent={t.accent}
            onClick={() => {
              if (t.value === '__deleted__') {
                setShowDeleted(true); setStatusFilter(null); setOffset(0);
              } else {
                setShowDeleted(false); setStatusFilter(t.value); setOffset(0);
              }
            }}
            C={C}
          />
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={entityTypeFilter || ''}
          onChange={e => { setEntityTypeFilter(e.target.value || null); setOffset(0); }}
          style={{
            padding: '8px 12px', borderRadius: 3, border: `1px solid ${C.border}`,
            background: C.card, color: C.white, fontFamily: NU, fontSize: 12, cursor: 'pointer',
          }}
        >
          <option value="">All types</option>
          <option value="venue">Venue</option>
          <option value="planner">Planner</option>
          <option value="vendor">Vendor</option>
        </select>

        <input
          type="text"
          placeholder="Search reviewer, business, or review text…"
          onChange={e => handleSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 220, padding: '8px 12px', borderRadius: 3,
            border: `1px solid ${C.border}`, background: C.card, color: C.white,
            fontFamily: NU, fontSize: 12, outline: 'none',
          }}
        />

        <button
          onClick={() => { setAddedByAdminFilter(f => !f); setOffset(0); }}
          style={{
            fontFamily: NU, fontSize: 11, padding: '7px 12px', borderRadius: 3, cursor: 'pointer',
            border: `1px solid ${addedByAdminFilter ? '#7c3aed60' : C.border}`,
            background: addedByAdminFilter ? 'rgba(124,58,237,0.08)' : 'none',
            color: addedByAdminFilter ? '#7c3aed' : C.grey, whiteSpace: 'nowrap',
          }}
        >
          ⊕ Admin Added
        </button>

        <span style={{ fontFamily: NU, fontSize: 11, color: C.grey2, whiteSpace: 'nowrap' }}>
          {total} result{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Reject-with-reason modal */}
      {rejectTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)' }}>
          <div style={{ background: C.dark, border: `1px solid ${C.border}`, borderRadius: 4, padding: 28, width: 420, maxWidth: '90vw' }}>
            <h3 style={{ fontFamily: ND, fontSize: 18, color: C.white, margin: '0 0 6px', fontWeight: 600 }}>Reject Review</h3>
            <p style={{ fontFamily: NU, fontSize: 12, color: C.grey, margin: '0 0 16px' }}>Optional: record the reason for rejection (internal audit trail only).</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Unable to verify reviewer identity, content policy violation…"
              rows={3}
              autoFocus
              style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 3, border: `1px solid ${C.border}`, background: C.black, color: C.white, fontFamily: NU, fontSize: 12, outline: 'none', resize: 'vertical', marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={confirmReject} style={{ flex: 1, padding: '10px 0', borderRadius: 3, border: 'none', cursor: 'pointer', background: '#b91c1c', color: '#fff', fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Confirm Reject
              </button>
              <button onClick={() => setRejectTarget(null)} style={{ padding: '10px 20px', borderRadius: 3, border: `1px solid ${C.border}`, cursor: 'pointer', background: 'none', color: C.grey, fontFamily: NU, fontSize: 11 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk action bar */}
      {selectedReviews.size > 0 && (
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center', padding: '10px 14px',
          background: `${C.gold}08`, border: `1px solid ${C.gold}30`,
          borderRadius: 3, marginBottom: 12,
        }}>
          <span style={{ fontFamily: NU, fontSize: 11, color: C.gold, flex: 1, fontWeight: 600 }}>
            {selectedReviews.size} selected
          </span>
          <ActionBtn label="Approve All" color="#15803d" onClick={handleBulkApprove} />
          <ActionBtn label="Reject All"  color="#b91c1c" onClick={handleBulkReject} />
          <ActionBtn label="Delete All"  color={C.grey2}  outline onClick={handleBulkDelete} />
          <ActionBtn label="Clear"       color={C.grey2}  outline onClick={() => setSelectedReviews(new Set())} />
        </div>
      )}

      {/* Select all row */}
      {reviews.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, paddingLeft: 2 }}>
          <input
            type="checkbox"
            checked={selectedReviews.size === reviews.length && reviews.length > 0}
            onChange={handleSelectAll}
            style={{ cursor: 'pointer', accentColor: C.gold }}
          />
          <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>
            {selectedReviews.size === reviews.length ? 'Deselect all' : 'Select all on this page'}
          </span>
        </div>
      )}

      {/* Review list */}
      {loading ? (
        <>
          {[1, 2, 3].map(i => <SkeletonCard key={i} C={C} />)}
        </>
      ) : reviews.length === 0 ? (
        <div style={{
          padding: '60px 32px', textAlign: 'center',
          border: `1px solid ${C.border}`, borderRadius: 4, background: C.card,
        }}>
          <div style={{ fontFamily: ND, fontSize: 20, color: C.grey, marginBottom: 8 }}>No reviews found</div>
          <p style={{ fontFamily: NU, fontSize: 12, color: C.grey2, margin: 0 }}>
            {statusFilter ? `No ${statusFilter} reviews at the moment.` : 'No reviews match your filters.'}
          </p>
        </div>
      ) : (
        reviews.map(r => (
          <ReviewCard
            key={r.id}
            review={r}
            selected={selectedReviews.has(r.id)}
            onSelect={handleSelectReview}
            onApprove={handleApprove}
            onReject={handleReject}
            onDelete={handleDelete}
            onRestore={handleRestore}
            onToggleFeatured={handleToggleFeatured}
            onVerify={handleVerify}
            onUpdate={handleUpdate}
            C={C}
          />
        ))
      )}

      {/* Pagination */}
      {pagesCount > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24, alignItems: 'center' }}>
          <button
            onClick={() => setOffset(Math.max(0, offset - PER_PAGE))}
            disabled={offset === 0}
            style={{
              padding: '7px 14px', border: `1px solid ${C.border}`, borderRadius: 3,
              cursor: offset === 0 ? 'not-allowed' : 'pointer', fontFamily: NU, fontSize: 11,
              background: 'none', color: C.grey, opacity: offset === 0 ? 0.4 : 1,
            }}
          >
            ← Prev
          </button>
          <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>
            {currentPage} / {pagesCount}
          </span>
          <button
            onClick={() => setOffset(offset + PER_PAGE)}
            disabled={offset + PER_PAGE >= total}
            style={{
              padding: '7px 14px', border: `1px solid ${C.border}`, borderRadius: 3,
              cursor: offset + PER_PAGE >= total ? 'not-allowed' : 'pointer', fontFamily: NU, fontSize: 11,
              background: 'none', color: C.grey, opacity: offset + PER_PAGE >= total ? 0.4 : 1,
            }}
          >
            Next →
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} C={C} />}

      {/* Add Review Panel */}
      {showAddPanel && (
        <AddReviewPanel
          onClose={() => setShowAddPanel(false)}
          onSaved={() => {
            setShowAddPanel(false);
            notify('Review added successfully');
            load();
          }}
          C={C}
        />
      )}
    </div>
  );
};

export default ReviewsModule;
