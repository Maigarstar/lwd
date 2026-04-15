// ── ArticleListView — Dense table/list view for Magazine Studio articles ─────
// Scan-optimised layout: thumbnail, title+category, author, status, score, words, date, actions
import { FU, FD, computeStatuses, computeWordCount, StatusBadge } from './StudioShared';

const CV = {
  surface:   'var(--s-surface, #161614)',
  border:    'var(--s-border, rgba(245,240,232,0.07))',
  text:      'var(--s-text, #f5f0e8)',
  muted:     'var(--s-muted, rgba(245,240,232,0.6))',
  faint:     'var(--s-faint, rgba(245,240,232,0.45))',
  gold:      'var(--s-gold, #c9a96e)',
  error:     'var(--s-error, #e05555)',
};

function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  const date = dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${time}`;
}

export default function ArticleListView({
  posts,
  selected,
  onToggleRow,
  onToggleAll,
  allSelected,
  onEdit,
  onDuplicate,
  onDelete,
}) {
  if (posts.length === 0) {
    return (
      <div style={{ padding: '60px 40px', textAlign: 'center', fontFamily: FU, fontSize: 13, color: CV.muted }}>
        No articles match your filters.
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Header row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '28px 88px 1fr 100px 80px 70px 60px 130px 130px 72px',
        gap: 0,
        padding: '6px 16px',
        borderBottom: `1px solid ${CV.border}`,
        alignItems: 'center',
      }}>
        <div>
          <input type="checkbox" checked={allSelected} onChange={onToggleAll}
            style={{ accentColor: CV.gold, cursor: 'pointer', width: 13, height: 13 }} />
        </div>
        <HeaderCell />
        <HeaderCell label="Title" />
        <HeaderCell label="Author" />
        <HeaderCell label="Status" />
        <HeaderCell label="Score" />
        <HeaderCell label="Words" />
        <HeaderCell label="Published" />
        <HeaderCell label="Updated" />
        <HeaderCell label="" />
      </div>

      {/* Rows */}
      {posts.map(post => {
        const isChecked = selected.has(post.id);
        const statuses = computeStatuses(post);
        const wc = computeWordCount(post.content);
        const intel = post._intel;
        const primaryStatus = statuses[0];

        return (
          <div
            key={post.id}
            onClick={() => onEdit(post.id)}
            style={{
              display: 'grid',
              gridTemplateColumns: '28px 88px 1fr 100px 80px 70px 60px 130px 130px 72px',
              gap: 0,
              padding: '10px 16px',
              borderBottom: `1px solid ${CV.border}`,
              alignItems: 'center',
              cursor: 'pointer',
              background: isChecked ? 'rgba(201,168,76,0.04)' : 'transparent',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => { if (!isChecked) e.currentTarget.style.background = 'rgba(245,240,232,0.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = isChecked ? 'rgba(201,168,76,0.04)' : 'transparent'; }}
          >
            {/* Checkbox */}
            <div onClick={e => { e.stopPropagation(); onToggleRow(post.id); }}>
              <input type="checkbox" checked={isChecked} onChange={() => onToggleRow(post.id)}
                style={{ accentColor: CV.gold, cursor: 'pointer', width: 13, height: 13 }} />
            </div>

            {/* Thumbnail */}
            <div style={{ width: 80, height: 58, borderRadius: 2, overflow: 'hidden', background: 'rgba(245,240,232,0.04)', flexShrink: 0 }}>
              {post.coverImage
                ? <img src={post.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.15 }}>
                    <span style={{ fontFamily: FD, fontSize: 14 }}>◻</span>
                  </div>
              }
            </div>

            {/* Title + Category */}
            <div style={{ minWidth: 0, paddingRight: 12 }}>
              <div style={{
                fontFamily: FD, fontSize: 14, color: CV.text, lineHeight: 1.3,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {post.title || 'Untitled'}
                </span>
                {post._isStaticFallback && (
                  <span
                    title="Template — click Edit to create a draft from this starter."
                    style={{
                      fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.12em',
                      textTransform: 'uppercase', padding: '2px 6px', borderRadius: 2,
                      background: 'rgba(201,168,76,0.10)',
                      border: '1px solid rgba(201,168,76,0.35)',
                      color: CV.gold, flexShrink: 0,
                    }}
                  >
                    Template
                  </span>
                )}
              </div>
              {(post.categoryLabel || post.category) && (
                <span style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: CV.gold, opacity: 0.7 }}>
                  {post.categoryLabel || post.category}
                </span>
              )}
            </div>

            {/* Author */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
              {post.author?.avatar && (
                <img src={post.author.avatar} alt="" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover', opacity: 0.8, flexShrink: 0 }} />
              )}
              <span style={{ fontFamily: FU, fontSize: 10, color: CV.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {post.author?.name?.split(' ')[0] || '—'}
              </span>
            </div>

            {/* Status */}
            <div>
              {primaryStatus && <StatusBadge label={primaryStatus.label} color={primaryStatus.color} />}
            </div>

            {/* Score */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: intel?.gradeColor || CV.muted }}>
                {intel?.score ?? '—'}
              </span>
              <span style={{ fontFamily: FU, fontSize: 7, color: intel?.gradeColor || CV.muted, opacity: 0.8 }}>
                {intel?.grade || ''}
              </span>
            </div>

            {/* Word count */}
            <span style={{ fontFamily: FU, fontSize: 10, color: CV.text }}>
              {wc > 0 ? wc.toLocaleString() : '—'}
            </span>

            {/* Published */}
            <span style={{ fontFamily: FU, fontSize: 10, color: CV.text }}>
              {formatDate(post.date)}
            </span>

            {/* Updated */}
            <span style={{ fontFamily: FU, fontSize: 10, color: CV.text }}>
              {formatDate(post._lastEdited || post.updatedAt || post.updated_at)}
            </span>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
              <button onClick={() => onEdit(post.id)}
                style={{ fontFamily: FU, fontSize: 8, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 7px', borderRadius: 2, background: 'none', border: `1px solid ${CV.gold}40`, color: CV.gold, cursor: 'pointer' }}>
                Edit
              </button>
              <button onClick={() => onDuplicate(post.id)}
                style={{ fontFamily: FU, fontSize: 8, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 7px', borderRadius: 2, background: 'none', border: `1px solid ${CV.border}`, color: CV.muted, cursor: 'pointer' }}>
                Dupe
              </button>
              <button onClick={() => onDelete(post.id)}
                style={{ fontFamily: FU, fontSize: 8, fontWeight: 600, padding: '3px 5px', borderRadius: 2, background: 'none', border: `1px solid rgba(224,85,85,0.22)`, color: CV.error, cursor: 'pointer' }}>
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HeaderCell({ label }) {
  if (!label && label !== '') return <div />;
  return (
    <span style={{
      fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.12em',
      textTransform: 'uppercase', color: CV.faint, userSelect: 'none',
    }}>
      {label}
    </span>
  );
}
