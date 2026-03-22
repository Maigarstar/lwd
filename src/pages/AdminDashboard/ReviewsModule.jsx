import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import {
  fetchAdminReviews,
  approveReview,
  rejectReview,
  softDeleteReview,
  bulkApproveReviews,
  bulkRejectReviews,
  bulkSoftDeleteReviews,
  getReviewStats,
  updateReview,
} from '../../services/adminReviewService';

const NU = "'Inter', 'Helvetica Neue', sans-serif";
const ND = "'Cormorant Garamond', 'Playfair Display', Georgia, serif";

// ── Status config — colours are intentionally semi-transparent so they work
//    in both light and dark backgrounds without needing separate palettes.
const STATUS_CFG = {
  pending:  { label: 'Pending',  icon: '⏱', bg: 'rgba(180,120,0,0.12)',  text: '#c9900a', border: 'rgba(180,120,0,0.22)'  },
  approved: { label: 'Approved', icon: '✓',  bg: 'rgba(21,128,61,0.12)',  text: '#15803d', border: 'rgba(21,128,61,0.22)'  },
  rejected: { label: 'Rejected', icon: '✕',  bg: 'rgba(185,28,28,0.12)',  text: '#b91c1c', border: 'rgba(185,28,28,0.22)'  },
};

// ── Toast ──────────────────────────────────────────────────────────────────────
function Toast({ message, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [onDone]);
  const bg = type === 'ok' ? '#15803d' : type === 'warn' ? '#9a6f00' : '#b91c1c';
  return (
    <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999, background: bg, color: '#fff', fontFamily: NU, fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', padding: '10px 18px', borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
      {message}
    </div>
  );
}

// ── Stars ─────────────────────────────────────────────────────────────────────
function Stars({ rating, max = 5, C }) {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{ fontSize: 13, color: i < rating ? C.gold : C.border, lineHeight: 1 }}>★</span>
      ))}
      <span style={{ fontFamily: NU, fontSize: 10, color: C.grey, marginLeft: 4 }}>{rating}/{max}</span>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.text, fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }}>
      <span>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

// ── Stat/tab card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, active, onClick, C }) {
  const colorMap = { All: C.gold, Pending: '#c9900a', Approved: '#15803d', Rejected: '#b91c1c' };
  const col = colorMap[label] || C.gold;
  return (
    <button
      onClick={onClick}
      style={{
        padding: '16px 20px', flex: 1, minWidth: 100, textAlign: 'left',
        background: active ? col : C.card, border: `1px solid ${active ? col : C.border}`,
        borderRadius: 4, cursor: 'pointer', transition: 'all 0.18s',
        boxShadow: active ? `0 4px 14px ${col}40` : 'none',
      }}
    >
      <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: active ? 'rgba(255,255,255,0.75)' : col, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontFamily: ND, fontSize: 30, fontWeight: 400, lineHeight: 1, color: active ? '#fff' : col }}>
        {value ?? '—'}
      </div>
    </button>
  );
}

// ── Skeleton loading card ─────────────────────────────────────────────────────
function SkeletonCard({ C }) {
  const sh = { background: C.border, borderRadius: 2 };
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: '18px 20px' }}>
      <div style={{ display: 'flex', gap: 14 }}>
        <div style={{ width: 15, height: 15, ...sh, flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 13, width: '38%', ...sh, marginBottom: 8 }} />
          <div style={{ height: 10, width: '22%', ...sh, marginBottom: 12, opacity: 0.6 }} />
          <div style={{ height: 12, width: '88%', ...sh, marginBottom: 6, opacity: 0.5 }} />
          <div style={{ height: 12, width: '65%', ...sh, opacity: 0.4 }} />
        </div>
        <div style={{ width: 88 }}>
          <div style={{ height: 14, ...sh, marginBottom: 10 }} />
          <div style={{ height: 22, ...sh, borderRadius: 20 }} />
        </div>
      </div>
    </div>
  );
}

// ── Review card ───────────────────────────────────────────────────────────────
function ReviewCard({ review, selected, onSelect, onApprove, onReject, onDelete, onSave, toast, C }) {
  const [expanded, setExpanded] = useState(false);
  const [editing,  setEditing]  = useState(false);
  const [editText, setEditText] = useState(review.review_text || '');
  const [saving,   setSaving]   = useState(false);
  const textRef = useRef(null);

  const isApproved = review.moderation_status === 'approved';
  const isRejected = review.moderation_status === 'rejected';

  const date    = review.created_at  ? new Date(review.created_at).toLocaleDateString('en-GB',  { day: 'numeric', month: 'short', year: 'numeric' }) : null;
  const updated = review.updated_at && review.updated_at !== review.created_at
    ? new Date(review.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  const doSave = async () => {
    if (!editText.trim()) return;
    setSaving(true);
    try { await onSave(review.id, editText); setEditing(false); toast('Review updated'); }
    catch { toast('Save failed', 'error'); }
    finally { setSaving(false); }
  };

  const doApprove = async (e) => { e.stopPropagation(); await onApprove(review.id); toast('Review approved'); };
  const doReject  = async (e) => { e.stopPropagation(); await onReject(review.id);  toast('Review rejected', 'warn'); };
  const doDelete  = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Remove this review from public view?')) return;
    await onDelete(review.id);
    toast('Review removed', 'warn');
  };

  return (
    <div style={{
      background: C.card, border: `1px solid ${selected ? C.gold : C.border}`,
      borderRadius: 4, overflow: 'hidden',
      boxShadow: selected ? `0 0 0 2px ${C.gold}30` : expanded ? `0 4px 18px rgba(0,0,0,0.10)` : 'none',
      transition: 'box-shadow 0.2s, border-color 0.2s',
    }}>
      {/* Main row */}
      <div
        onClick={() => setExpanded(v => !v)}
        style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '18px 20px', cursor: 'pointer' }}
        onMouseEnter={e => { if (!expanded) e.currentTarget.style.background = C.dark; }}
        onMouseLeave={e => { e.currentTarget.style.background = ''; }}
      >
        {/* Checkbox */}
        <div onClick={e => { e.stopPropagation(); onSelect(review.id); }} style={{ paddingTop: 2, flexShrink: 0 }}>
          <input type="checkbox" checked={selected} onChange={() => onSelect(review.id)} style={{ cursor: 'pointer', accentColor: C.gold, width: 15, height: 15 }} />
        </div>

        {/* Reviewer + content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Top meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 3 }}>
            <span style={{ fontFamily: NU, fontSize: 13, fontWeight: 700, color: C.white, letterSpacing: '-0.01em' }}>
              {review.reviewer_name || 'Anonymous'}
            </span>
            {review.reviewer_location && (
              <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>
                {review.reviewer_location}
              </span>
            )}
            {review.entity_type && (
              <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 2, background: `${C.gold}18`, color: C.gold }}>
                {review.entity_type}
              </span>
            )}
          </div>

          {/* Email + date */}
          <div style={{ fontFamily: NU, fontSize: 11, color: C.grey, marginBottom: 9, lineHeight: 1.4 }}>
            {review.reviewer_email}
            {date    && <span style={{ marginLeft: 10, opacity: 0.7 }}>· {date}</span>}
            {updated && <span style={{ marginLeft: 8, fontStyle: 'italic', opacity: 0.6 }}>· edited {updated}</span>}
          </div>

          {/* Review title */}
          {review.review_title && (
            <div style={{ fontFamily: ND, fontSize: 15, fontWeight: 600, color: C.white, marginBottom: 4, lineHeight: 1.3 }}>
              {review.review_title}
            </div>
          )}

          {/* Review text — truncated when collapsed */}
          <div style={{ fontFamily: NU, fontSize: 13, color: C.grey, lineHeight: 1.7, maxWidth: 680 }}>
            {expanded
              ? review.review_text
              : (review.review_text?.length > 160 ? review.review_text.slice(0, 160) + '…' : review.review_text)}
          </div>
        </div>

        {/* Right — rating + status */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
          <Stars rating={review.overall_rating || 0} C={C} />
          <StatusBadge status={review.moderation_status} />
          <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2, opacity: 0.7 }}>
            {expanded ? '↑ collapse' : '↓ expand'}
          </div>
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: '16px 20px 20px', background: C.dark }}>

          {/* Edit area */}
          {editing ? (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.gold, marginBottom: 8 }}>
                Editing Review Text
              </div>
              <textarea
                ref={textRef}
                value={editText}
                onChange={e => setEditText(e.target.value)}
                rows={5}
                style={{
                  width: '100%', boxSizing: 'border-box', resize: 'vertical',
                  padding: '12px 14px', fontFamily: NU, fontSize: 13, color: C.white,
                  lineHeight: 1.65, background: C.card, border: `1px solid ${C.gold}50`,
                  borderRadius: 3, outline: 'none',
                }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setEditing(false); setEditText(review.review_text || ''); }}
                  style={{ padding: '7px 16px', fontFamily: NU, fontSize: 11, fontWeight: 600, background: 'none', border: `1px solid ${C.border}`, borderRadius: 3, cursor: 'pointer', color: C.grey }}
                >
                  Cancel
                </button>
                <button
                  onClick={doSave}
                  disabled={saving}
                  style={{ padding: '7px 18px', fontFamily: NU, fontSize: 11, fontWeight: 700, background: C.white, color: C.black, border: 'none', borderRadius: 3, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={e => { e.stopPropagation(); setEditing(true); setTimeout(() => textRef.current?.focus(), 50); }}
                style={{ fontFamily: NU, fontSize: 11, fontWeight: 600, color: C.gold, background: 'none', border: `1px solid ${C.gold}40`, borderRadius: 3, padding: '5px 12px', cursor: 'pointer' }}
              >
                ✎  Edit Review Text
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {!isApproved && (
              <button
                onClick={doApprove}
                style={{ padding: '8px 20px', fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', background: '#15803d', color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                ✓  Approve
              </button>
            )}
            {!isRejected && (
              <button
                onClick={doReject}
                style={{ padding: '8px 20px', fontFamily: NU, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', background: 'none', color: '#b91c1c', border: '1px solid rgba(185,28,28,0.35)', borderRadius: 3, cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(185,28,28,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
              >
                ✕  Reject
              </button>
            )}
            {isApproved && (
              <span style={{ fontFamily: NU, fontSize: 11, color: '#15803d', fontWeight: 700 }}>✓ Published</span>
            )}
            <div style={{ flex: 1 }} />
            <button
              onClick={doDelete}
              style={{ padding: '6px 12px', fontFamily: NU, fontSize: 10, fontWeight: 600, background: 'none', color: C.grey2, border: `1px solid ${C.border}`, borderRadius: 3, cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#b91c1c'; e.currentTarget.style.borderColor = 'rgba(185,28,28,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = C.grey2; e.currentTarget.style.borderColor = C.border; }}
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ReviewsModule() {
  const C = useTheme();

  const [reviews,          setReviews]          = useState([]);
  const [stats,            setStats]             = useState(null);
  const [loading,          setLoading]           = useState(true);
  const [statusFilter,     setStatusFilter]      = useState('pending');
  const [entityTypeFilter, setEntityTypeFilter]  = useState('');
  const [searchQuery,      setSearchQuery]       = useState('');
  const [selectedReviews,  setSelectedReviews]   = useState(new Set());
  const [offset,           setOffset]            = useState(0);
  const [total,            setTotal]             = useState(0);
  const [toast,            setToast]             = useState(null);
  const itemsPerPage = 20;

  const showToast = useCallback((message, type = 'ok') => setToast({ message, type }), []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { reviews: data, total: count } = await fetchAdminReviews({
        status:      statusFilter      || null,
        entityType:  entityTypeFilter  || null,
        searchQuery: searchQuery       || null,
        limit: itemsPerPage,
        offset,
      });
      setReviews(data);
      setTotal(count);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, entityTypeFilter, searchQuery, offset, showToast]);

  const loadStats = useCallback(async () => {
    try { const data = await getReviewStats(); setStats(data); } catch {}
  }, []);

  useEffect(() => { load(); },      [load]);
  useEffect(() => { loadStats(); }, [loadStats]);

  const refresh = useCallback(() => { load(); loadStats(); }, [load, loadStats]);

  const handleApprove = async (id) => { await approveReview(id);      refresh(); };
  const handleReject  = async (id) => { await rejectReview(id);       refresh(); };
  const handleDelete  = async (id) => { await softDeleteReview(id);   refresh(); };
  const handleSave    = async (id, text) => { await updateReview(id, { review_text: text }); refresh(); };

  const handleSelect = (id) => {
    setSelectedReviews(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedReviews(prev =>
      prev.size === reviews.length && reviews.length > 0
        ? new Set()
        : new Set(reviews.map(r => r.id))
    );
  };

  const handleBulkApprove = async () => {
    const count = selectedReviews.size;
    await bulkApproveReviews(Array.from(selectedReviews));
    setSelectedReviews(new Set());
    showToast(`${count} review(s) approved`);
    refresh();
  };
  const handleBulkReject = async () => {
    const count = selectedReviews.size;
    await bulkRejectReviews(Array.from(selectedReviews));
    setSelectedReviews(new Set());
    showToast(`${count} review(s) rejected`, 'warn');
    refresh();
  };
  const handleBulkDelete = async () => {
    const count = selectedReviews.size;
    if (!window.confirm(`Remove ${count} review(s) from public view?`)) return;
    await bulkSoftDeleteReviews(Array.from(selectedReviews));
    setSelectedReviews(new Set());
    showToast(`${count} review(s) removed`, 'warn');
    refresh();
  };

  const STATUS_TABS = [
    { key: '',         label: 'All',      count: stats?.total    },
    { key: 'pending',  label: 'Pending',  count: stats?.pending  },
    { key: 'approved', label: 'Approved', count: stats?.approved },
    { key: 'rejected', label: 'Rejected', count: stats?.rejected },
  ];

  const pagesCount  = Math.ceil(total / itemsPerPage);
  const currentPage = Math.floor(offset / itemsPerPage) + 1;
  const allSelected = selectedReviews.size === reviews.length && reviews.length > 0;

  return (
    <div style={{ padding: '36px 40px', background: C.black, minHeight: '100%' }}>
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.gold, marginBottom: 10 }}>
          Curation
        </div>
        <h1 style={{ fontFamily: ND, fontSize: 34, fontWeight: 400, color: C.white, margin: '0 0 6px', lineHeight: 1.1 }}>
          Review Moderation Studio
        </h1>
        <p style={{ fontFamily: NU, fontSize: 13, color: C.grey, margin: 0, lineHeight: 1.6 }}>
          Curate, edit, and publish customer reviews across all venues and listings.
        </p>
      </div>

      {/* Stat / tab cards */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 32, flexWrap: 'wrap' }}>
        {STATUS_TABS.map(tab => (
          <StatCard
            key={tab.key}
            label={tab.label}
            value={tab.count}
            active={statusFilter === tab.key}
            onClick={() => { setStatusFilter(tab.key); setOffset(0); setSelectedReviews(new Set()); }}
            C={C}
          />
        ))}
      </div>

      {/* Filters row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={entityTypeFilter}
          onChange={e => { setEntityTypeFilter(e.target.value); setOffset(0); }}
          style={{ padding: '9px 14px', borderRadius: 3, border: `1px solid ${C.border}`, fontFamily: NU, fontSize: 12, color: C.white, background: C.card, cursor: 'pointer', outline: 'none' }}
        >
          <option value="">All Venue Types</option>
          <option value="venue">Venue</option>
          <option value="blog">Blog</option>
          <option value="showcase">Showcase</option>
        </select>

        <input
          type="text"
          placeholder="Search by name, email, or text…"
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setOffset(0); }}
          style={{ padding: '9px 14px', borderRadius: 3, border: `1px solid ${C.border}`, fontFamily: NU, fontSize: 12, color: C.white, background: C.card, flex: 1, minWidth: 200, outline: 'none' }}
        />

        {reviews.length > 0 && (
          <button
            onClick={handleSelectAll}
            style={{ padding: '9px 14px', fontFamily: NU, fontSize: 11, fontWeight: 600, color: allSelected ? C.gold : C.grey, background: 'none', border: `1px solid ${C.border}`, borderRadius: 3, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>

      {/* Bulk actions bar */}
      {selectedReviews.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '12px 18px', background: C.card, border: `1px solid ${C.gold}40`, borderRadius: 4, boxShadow: `0 2px 12px ${C.gold}18` }}>
          <span style={{ fontFamily: NU, fontSize: 12, fontWeight: 700, color: C.gold, flex: 1 }}>
            {selectedReviews.size} selected
          </span>
          <button onClick={handleBulkApprove} style={{ padding: '7px 16px', fontFamily: NU, fontSize: 11, fontWeight: 700, background: '#15803d', color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer' }}>
            ✓  Approve Selected
          </button>
          <button onClick={handleBulkReject} style={{ padding: '7px 16px', fontFamily: NU, fontSize: 11, fontWeight: 600, background: 'none', color: '#b91c1c', border: '1px solid rgba(185,28,28,0.35)', borderRadius: 3, cursor: 'pointer' }}>
            ✕  Reject Selected
          </button>
          <button onClick={handleBulkDelete} style={{ padding: '7px 14px', fontFamily: NU, fontSize: 10, fontWeight: 600, background: 'none', color: C.grey2, border: `1px solid ${C.border}`, borderRadius: 3, cursor: 'pointer' }}>
            Remove
          </button>
        </div>
      )}

      {/* Cards */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} C={C} />)}
        </div>
      ) : reviews.length === 0 ? (
        <div style={{ padding: '64px 40px', textAlign: 'center', background: C.card, border: `1px solid ${C.border}`, borderRadius: 4 }}>
          <div style={{ fontFamily: ND, fontSize: 22, color: C.grey, marginBottom: 10 }}>No reviews found</div>
          <div style={{ fontFamily: NU, fontSize: 12, color: C.grey2 }}>
            {statusFilter === 'pending'
              ? 'All caught up. No pending reviews to moderate.'
              : 'Submissions matching your filters will appear here.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reviews.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              selected={selectedReviews.has(review.id)}
              onSelect={handleSelect}
              onApprove={handleApprove}
              onReject={handleReject}
              onDelete={handleDelete}
              onSave={handleSave}
              toast={showToast}
              C={C}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagesCount > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32, alignItems: 'center' }}>
          <button
            onClick={() => setOffset(Math.max(0, offset - itemsPerPage))}
            disabled={offset === 0}
            style={{ padding: '8px 18px', fontFamily: NU, fontSize: 11, fontWeight: 600, border: `1px solid ${C.border}`, borderRadius: 3, cursor: offset === 0 ? 'not-allowed' : 'pointer', background: C.card, color: C.grey, opacity: offset === 0 ? 0.4 : 1 }}
          >
            ← Prev
          </button>
          <span style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>
            {currentPage} / {pagesCount}
          </span>
          <button
            onClick={() => setOffset(offset + itemsPerPage)}
            disabled={offset + itemsPerPage >= total}
            style={{ padding: '8px 18px', fontFamily: NU, fontSize: 11, fontWeight: 600, border: `1px solid ${C.border}`, borderRadius: 3, cursor: offset + itemsPerPage >= total ? 'not-allowed' : 'pointer', background: C.card, color: C.grey, opacity: offset + itemsPerPage >= total ? 0.4 : 1 }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
