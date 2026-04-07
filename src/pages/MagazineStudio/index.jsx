import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { POSTS } from '../Magazine/data/posts';
import { CATEGORIES } from '../Magazine/data/categories';
import { computeContentIntelligence } from './ContentIntelligence';
import {
  getS, themeVars, FU, FD,
  computeStatuses, computeWordCount,
  StatusBadge, GoldBtn, GhostBtn, Input,
} from './StudioShared';

// CSS-var tokens, cascade from themeVars() on the MagazineStudio root wrapper.
// Module-level components (StudioHome, ArticleList) use these so they
// automatically pick up the correct light/dark values from the ancestor.
// Inside MagazineStudio, `const S = getS(studioLight)` shadows this with actual values.
const CV = {
  bg:          'var(--s-bg, #0f0f0d)',
  surface:     'var(--s-surface, #161614)',
  surfaceUp:   'var(--s-surface-up, #1e1e1b)',
  border:      'var(--s-border, rgba(245,240,232,0.07))',
  borderMid:   'var(--s-border-mid, rgba(245,240,232,0.12))',
  text:        'var(--s-text, #f5f0e8)',
  muted:       'var(--s-muted, rgba(245,240,232,0.45))',
  faint:       'var(--s-faint, rgba(245,240,232,0.2))',
  inputBg:     'var(--s-input-bg, rgba(245,240,232,0.04))',
  inputBorder: 'var(--s-input-border, rgba(245,240,232,0.1))',
  gold:        'var(--s-gold, #c9a96e)',
  error:       'var(--s-error, #e05555)',
  warn:        'var(--s-warn, #d4a843)',
  success:     'var(--s-success, #5aaa78)',
};
const S = CV;
import ArticleListView from './ArticleListView';
import ArticleEditor from './ArticleEditor';
import HomepageEditor from './HomepageEditor';
import CategoryEditor from './CategoryEditor';
import {
  fetchPosts,
  fetchCategories,
  savePost,
  deletePost,
  slugify,
} from '../../services/magazineService';

// ── In-app confirm dialog ────────────────────────────────────────────────────
function ConfirmDialog({ open, title, body, confirmLabel = 'Delete', onConfirm, onCancel, danger = true }) {
  if (!open) return null;
  const GOLD_V = 'var(--s-gold,#c9a96e)';
  const ERR_V  = 'var(--s-error,#e05555)';
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#1a1510', border: '1px solid rgba(201,169,110,0.18)',
        borderRadius: 5, padding: '28px 28px 22px', maxWidth: 380, width: '90%',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
      }}>
        <div style={{ fontFamily: FD, fontSize: 18, color: '#f5f0e8', marginBottom: 8 }}>{title}</div>
        {body && <div style={{ fontFamily: FU, fontSize: 12, color: 'rgba(245,240,232,0.5)', lineHeight: 1.6, marginBottom: 20 }}>{body}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            fontFamily: FU, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
            padding: '7px 16px', borderRadius: 2, cursor: 'pointer',
            background: 'none', border: '1px solid rgba(245,240,232,0.12)', color: 'rgba(245,240,232,0.45)',
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            fontFamily: FU, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
            padding: '7px 16px', borderRadius: 2, cursor: 'pointer', outline: 'none',
            background: danger ? `${ERR_V}18` : `${GOLD_V}18`,
            border: `1px solid ${danger ? `${ERR_V}60` : `${GOLD_V}60`}`,
            color: danger ? ERR_V : GOLD_V,
          }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ── Edit conflict dialog (concurrency control) ────────────────────────────────
function ConflictDialog({ open, conflictPost, onReload, onOverwrite, onCancel }) {
  if (!open || !conflictPost) return null;
  const GOLD_V = 'var(--s-gold,#c9a96e)';
  const dt = new Date(conflictPost.updatedAt || conflictPost.updated_at);
  const formattedTime = dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#1a1510', border: '1px solid rgba(201,169,110,0.18)',
        borderRadius: 5, padding: '28px 28px 22px', maxWidth: 420, width: '90%',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
      }}>
        <div style={{ fontFamily: FD, fontSize: 18, color: '#f5f0e8', marginBottom: 8 }}>⚠ Article Changed</div>
        <div style={{ fontFamily: FU, fontSize: 12, color: 'rgba(245,240,232,0.6)', lineHeight: 1.7, marginBottom: 20 }}>
          This article was modified elsewhere at {formattedTime}. Choose to <strong>Reload</strong> the latest version or <strong>Overwrite</strong> with your changes.
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            fontFamily: FU, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
            padding: '7px 16px', borderRadius: 2, cursor: 'pointer',
            background: 'none', border: '1px solid rgba(245,240,232,0.12)', color: 'rgba(245,240,232,0.45)',
          }}>Cancel</button>
          <button onClick={onReload} style={{
            fontFamily: FU, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
            padding: '7px 16px', borderRadius: 2, cursor: 'pointer',
            background: `${GOLD_V}18`,
            border: `1px solid ${GOLD_V}60`,
            color: GOLD_V,
          }}>Reload</button>
          <button onClick={onOverwrite} style={{
            fontFamily: FU, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
            padding: '7px 16px', borderRadius: 2, cursor: 'pointer', outline: 'none',
            background: `${GOLD_V}25`,
            border: `1px solid ${GOLD_V}`,
            color: GOLD_V,
          }}>Overwrite</button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
// Retry-aware savePost wrapper: Navigator Lock steal (AbortError) can cause a
// one-off failure when multiple tabs contend for the Supabase auth lock.
// A single retry after a short delay resolves it.
async function savePostSafe(postData) {
  let result = await savePost(postData);
  if (result.error && /abort|lock.*broken|steal/i.test(result.error.message || '')) {
    await new Promise(r => setTimeout(r, 500));
    result = await savePost(postData);
  }
  return result;
}

function uid() {
  return 'new_' + Math.random().toString(36).slice(2, 9);
}

function formatDate(d) {
  if (!d) return ' - ';
  const dt = new Date(d);
  const date = dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${time}`;
}

// ── Studio Home Screen ────────────────────────────────────────────────────────
function StudioHome({ posts, allCategories, onOpenArticles, onOpenHomepage, onOpenCategories }) {
  const published  = posts.filter(p => p.published).length;
  const scheduled  = posts.filter(p => !p.published && p.scheduledDate && new Date(p.scheduledDate) > new Date()).length;
  const drafts     = posts.filter(p => !p.published && !(p.scheduledDate && new Date(p.scheduledDate) > new Date())).length;
  const featured   = posts.filter(p => p.featured).length;
  const needsWork  = posts.filter(p => computeContentIntelligence(p, '').score < 55).length;

  const recent = [...posts]
    .sort((a, b) => new Date(b._lastEdited || b.date) - new Date(a._lastEdited || a.date))
    .slice(0, 4);

  const cards = [
    {
      title: 'Articles',
      subtitle: `${posts.length} total · ${published} published · ${drafts} drafts`,
      icon: '✦',
      action: 'Manage Articles',
      onClick: onOpenArticles,
      stat: posts.length,
    },
    {
      title: 'Homepage',
      subtitle: 'Configure sections, hero style, featured picks',
      icon: '⊞',
      action: 'Open Builder',
      onClick: onOpenHomepage,
      stat: null,
    },
    {
      title: 'Category Pages',
      subtitle: `${allCategories.length} categories · hero, cards, SEO`,
      icon: '◈',
      action: 'Edit Categories',
      onClick: onOpenCategories,
      stat: allCategories.length,
    },
  ];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 'clamp(32px,4vw,56px) clamp(24px,4vw,48px)' }}>
      {/* Header */}
      <div style={{ marginBottom: 48 }}>
        <div style={{
          fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: S.gold, marginBottom: 12,
        }}>
          Magazine Studio
        </div>
        <h1 style={{
          fontFamily: FD, fontSize: 'clamp(32px,4vw,52px)', fontWeight: 400,
          color: S.text, margin: 0, lineHeight: 1.1,
        }}>
          Your Editorial Workspace
        </h1>
        <p style={{
          fontFamily: FU, fontSize: 13, color: S.muted, marginTop: 12,
          fontWeight: 300, lineHeight: 1.65,
        }}>
          Write, design, and publish your luxury magazine from one place.
        </p>
      </div>

      {/* Mode cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 2, marginBottom: 48,
      }}>
        {cards.map(card => (
          <div
            key={card.title}
            style={{
              background: S.surface, border: `1px solid ${S.border}`,
              borderRadius: 2, padding: 28, cursor: 'pointer',
              transition: 'border-color 0.2s',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}
            onClick={card.onClick}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--s-gold, #c9a96e)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = S.border}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 22, color: S.gold, lineHeight: 1 }}>{card.icon}</span>
              {card.stat !== null && (
                <span style={{
                  fontFamily: FD, fontSize: 36, color: `${S.text}30`,
                  lineHeight: 1, fontWeight: 400,
                }}>
                  {card.stat}
                </span>
              )}
            </div>
            <div>
              <div style={{ fontFamily: FU, fontSize: 13, fontWeight: 600, color: S.text, marginBottom: 5 }}>
                {card.title}
              </div>
              <div style={{ fontFamily: FU, fontSize: 11, color: S.muted, lineHeight: 1.5 }}>
                {card.subtitle}
              </div>
            </div>
            <div style={{ marginTop: 'auto', paddingTop: 16 }}>
              <span style={{
                fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: S.gold,
              }}>
                {card.action} →
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 40, flexWrap: 'wrap' }}>
        {[
          { label: 'Published',  value: published,        color: S.success },
          { label: 'Scheduled',  value: scheduled,        color: '#818cf8' },
          { label: 'Drafts',     value: drafts,           color: S.faint   },
          { label: 'Featured',   value: featured,         color: S.gold    },
          { label: 'Needs Work', value: needsWork,        color: S.error   },
          { label: 'Categories', value: allCategories.length, color: '#7c9db5' },
        ].map(stat => (
          <div
            key={stat.label}
            style={{
              background: S.surface, border: `1px solid ${S.border}`,
              borderRadius: 2, padding: '14px 24px', minWidth: 120,
            }}
          >
            <div style={{ fontFamily: FD, fontSize: 32, color: stat.color, lineHeight: 1 }}>
              {stat.value}
            </div>
            <div style={{ fontFamily: FU, fontSize: 9, color: S.muted, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 5 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Recently edited */}
      {recent.length > 0 && (
        <div>
          <div style={{
            fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: S.muted,
            marginBottom: 14, paddingBottom: 10,
            borderBottom: `1px solid ${S.border}`,
          }}>
            Recent Articles
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 2 }}>
            {recent.map(post => {
              const statuses = computeStatuses(post);
              const wc = computeWordCount(post.content);
              const intel = computeContentIntelligence(post, '');
              return (
                <div
                  key={post.id}
                  onClick={() => onOpenArticles(post.id)}
                  style={{
                    background: S.surface, border: `1px solid ${S.border}`,
                    borderRadius: 2, overflow: 'hidden', cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--s-gold, #c9a96e)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = S.border}
                >
                  <div style={{ aspectRatio: '16/7', overflow: 'hidden', background: S.surfaceUp }}>
                    {post.coverImage && (
                      <img src={post.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75 }} />
                    )}
                  </div>
                  <div style={{ padding: '10px 12px' }}>
                    <div style={{ fontFamily: FU, fontSize: 8, color: S.gold, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 5 }}>
                      {post.categoryLabel || post.category}
                    </div>
                    <div style={{
                      fontFamily: FD, fontSize: 14, color: S.text, lineHeight: 1.3,
                      overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      marginBottom: 8,
                    }}>
                      {post.title}
                    </div>
                    {/* Author + meta row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      {post.author?.avatar && (
                        <img src={post.author.avatar} alt="" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover', opacity: 0.8 }} />
                      )}
                      {post.author?.name && (
                        <span style={{ fontFamily: FU, fontSize: 10, color: S.muted }}>
                          {post.author.name.split(' ')[0]}
                        </span>
                      )}
                      {wc > 0 && (
                        <span style={{ fontFamily: FU, fontSize: 10, color: S.faint }}>· {wc.toLocaleString()}w</span>
                      )}
                      <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: intel.gradeColor }}>
                        {intel.score}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {statuses.slice(0, 2).map(s => (
                        <StatusBadge key={s.label} label={s.label} color={s.color} />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Article List (Newsroom) ───────────────────────────────────────────────────
const VIEW_MODE_KEY = 'magazineStudio_viewMode';

function ArticleList({ posts, allCategories, onEdit, onNew, onDuplicate, onDelete, onBack, onBulkAction }) {
  const [search, setSearch]         = useState('');
  const [filterCat, setFilterCat]   = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortCol, setSortCol]       = useState('date');
  const [sortDir, setSortDir]       = useState('desc');
  const [selected, setSelected]     = useState(new Set());
  const [bulkOpen, setBulkOpen]     = useState(false);
  const [bulkWorking, setBulkWorking] = useState(false);
  const [confirmState, setConfirmState] = useState(null); // { action, ids, title, body }
  const [deleteConfirm, setDeleteConfirm] = useState(null); // single delete { id }
  const [viewMode, setViewModeRaw]  = useState(() => {
    try { return localStorage.getItem(VIEW_MODE_KEY) || 'grid'; } catch { return 'grid'; }
  });
  const setViewMode = (m) => { setViewModeRaw(m); try { localStorage.setItem(VIEW_MODE_KEY, m); } catch {} };

  const isSched = (p) => !p.published && p.scheduledDate && new Date(p.scheduledDate) > new Date();

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  const filtered = useMemo(() => {
    const base = posts.filter(p => {
      if (search && !p.title.toLowerCase().includes(search.toLowerCase()) &&
          !(p.excerpt || '').toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCat !== 'all' && p.category !== filterCat) return false;
      const sched = isSched(p);
      if (filterStatus === 'published'       && !p.published) return false;
      if (filterStatus === 'draft'           && (p.published || sched)) return false;
      if (filterStatus === 'scheduled'       && !sched) return false;
      if (filterStatus === 'featured'        && !p.featured) return false;
      if (filterStatus === 'needs-attention' && computeContentIntelligence(p, '').score >= 55) return false;
      return true;
    });
    const dir = sortDir === 'asc' ? 1 : -1;
    const sorted = [...base].sort((a, b) => {
      if (sortCol === 'title')  return dir * a.title.localeCompare(b.title);
      if (sortCol === 'words')  return dir * (computeWordCount(a.content) - computeWordCount(b.content));
      if (sortCol === 'date')   return dir * (new Date(a.date || 0) - new Date(b.date || 0));
      if (sortCol === 'status') return dir * (a.published === b.published ? 0 : a.published ? -1 : 1);
      if (sortCol === 'score') {
        const sa = computeContentIntelligence(a, '').score;
        const sb = computeContentIntelligence(b, '').score;
        return dir * (sa - sb);
      }
      return 0;
    });
    return sorted.map(p => ({ ...p, _intel: computeContentIntelligence(p, '') }));
  }, [posts, search, filterCat, filterStatus, sortCol, sortDir]);

  useEffect(() => { setSelected(new Set()); }, [filterStatus, filterCat, search]);

  const allSelected = filtered.length > 0 && filtered.every(p => selected.has(p.id));
  const toggleAll   = () => allSelected ? setSelected(new Set()) : setSelected(new Set(filtered.map(p => p.id)));
  const toggleRow   = (id) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const runBulk = (action) => {
    setBulkOpen(false);
    const count = selected.size;
    const plural = count > 1 ? 's' : '';

    // Define confirmation for each bulk action
    const confirmationMap = {
      delete: {
        title: `Delete ${count} article${plural}?`,
        body: 'This cannot be undone. All content and blocks will be permanently removed.',
        label: 'Delete',
      },
      publish: {
        title: `Publish ${count} article${plural}?`,
        body: `${count} article${plural} will be published and visible on the live site.`,
        label: 'Publish',
      },
      unpublish: {
        title: `Unpublish ${count} article${plural}?`,
        body: `${count} article${plural} will no longer be visible on the live site.`,
        label: 'Unpublish',
      },
      feature: {
        title: `Feature ${count} article${plural}?`,
        body: `${count} article${plural} will be marked as featured content.`,
        label: 'Feature',
      },
      unfeature: {
        title: `Unfeature ${count} article${plural}?`,
        body: `${count} article${plural} will no longer be featured.`,
        label: 'Unfeature',
      },
    };

    if (confirmationMap[action]) {
      const conf = confirmationMap[action];
      setConfirmState({
        action,
        ids: [...selected],
        title: conf.title,
        body: conf.body,
        label: conf.label,
        danger: action === 'delete',
      });
      return;
    }

    executeBulk(action, [...selected]);
  };

  const executeBulk = async (action, ids) => {
    setBulkWorking(true);
    await onBulkAction(action, ids);
    setSelected(new Set());
    setBulkWorking(false);
  };

  const catOptions    = [{ value: 'all', label: 'All Categories' }, ...allCategories.map(c => ({ value: c.id, label: c.label }))];
  const statusOptions = [
    { value: 'all',             label: 'All Status'      },
    { value: 'published',       label: 'Published'       },
    { value: 'draft',           label: 'Draft'           },
    { value: 'scheduled',       label: 'Scheduled'       },
    { value: 'featured',        label: 'Featured'        },
    { value: 'needs-attention', label: 'Needs Attention' },
  ];

  const GOLD_V = 'var(--s-gold,#c9a96e)';
  const inputStyle = {
    background: 'rgba(245,240,232,0.04)', border: `1px solid rgba(245,240,232,0.1)`,
    color: S.text, fontFamily: FU, fontSize: 12,
    padding: '6px 8px', borderRadius: 2, cursor: 'pointer', outline: 'none',
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }}>
      {/* Toolbar */}
      <div style={{ height: 52, flexShrink: 0, background: S.surface, borderBottom: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px' }}>
        <button onClick={onBack} style={{ fontFamily: FU, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: S.muted, background: 'none', border: 'none', cursor: 'pointer' }}>
          ← Studio Home
        </button>
        <div style={{ width: 1, height: 20, background: S.border }} />
        <span style={{ fontFamily: FU, fontSize: 12, fontWeight: 600, color: S.text, letterSpacing: '0.05em' }}>Articles</span>
        <div style={{ flex: 1 }} />
        {/* View toggle */}
        <div style={{ display: 'flex', gap: 2, background: 'rgba(245,240,232,0.03)', borderRadius: 3, padding: 2 }}>
          {[
            { mode: 'grid', icon: '⊞', title: 'Grid view' },
            { mode: 'list', icon: '☰', title: 'List view' },
          ].map(v => (
            <button key={v.mode} title={v.title} onClick={() => setViewMode(v.mode)}
              style={{
                fontFamily: FU, fontSize: 13, lineHeight: 1, padding: '4px 8px', borderRadius: 2,
                background: viewMode === v.mode ? 'rgba(201,168,76,0.15)' : 'none',
                border: viewMode === v.mode ? '1px solid rgba(201,168,76,0.4)' : '1px solid transparent',
                color: viewMode === v.mode ? 'var(--s-gold,#c9a96e)' : 'var(--s-faint,rgba(245,240,232,0.2))',
                cursor: 'pointer', transition: 'all 0.12s',
              }}>
              {v.icon}
            </button>
          ))}
        </div>
        <GoldBtn small onClick={onNew}>+ New Article</GoldBtn>
      </div>

      {/* Filters */}
      <div style={{ padding: '10px 20px', background: S.surface, borderBottom: `1px solid ${S.border}`, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
          <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: S.muted, fontSize: 13 }}>⌕</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)} placeholder="Search articles…"
            style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', fontSize: 13, padding: '6px 10px 6px 26px' }}
          />
        </div>
        <select value={filterCat}    onChange={e => setFilterCat(e.target.value)}    style={inputStyle}>
          {catOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={inputStyle}>
          {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span style={{ fontFamily: FU, fontSize: 12, color: S.muted }}>
          {filtered.length} article{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{ padding: '8px 20px', background: 'rgba(201,168,76,0.06)', borderBottom: `1px solid rgba(201,168,76,0.18)`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span style={{ fontFamily: FU, fontSize: 11, color: GOLD_V, fontWeight: 600 }}>{selected.size} selected</span>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setBulkOpen(o => !o)} disabled={bulkWorking}
              style={{ fontFamily: FU, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 2, cursor: 'pointer', background: 'none', border: `1px solid rgba(201,168,76,0.4)`, color: GOLD_V, opacity: bulkWorking ? 0.5 : 1 }}
            >
              {bulkWorking ? 'Working…' : 'Bulk Actions ▾'}
            </button>
            {bulkOpen && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 100, background: 'var(--s-surface,#161614)', border: `1px solid rgba(245,240,232,0.12)`, borderRadius: 3, minWidth: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                {[
                  { label: 'Publish',       action: 'publish',   color: S.success },
                  { label: 'Unpublish',     action: 'unpublish', color: S.muted   },
                  { label: 'Mark Featured', action: 'feature',   color: GOLD_V    },
                  { label: 'Unfeature',     action: 'unfeature', color: S.muted   },
                  null,
                  { label: 'Delete',        action: 'delete',    color: S.error   },
                ].map((item, i) => item === null ? (
                  <div key={i} style={{ height: 1, background: 'rgba(245,240,232,0.08)', margin: '3px 0' }} />
                ) : (
                  <button key={item.action} onClick={() => runBulk(item.action)}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px', background: 'none', border: 'none', fontFamily: FU, fontSize: 11, color: item.color || S.text, cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,240,232,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >{item.label}</button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setSelected(new Set())} style={{ fontFamily: FU, fontSize: 10, color: S.muted, background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
        </div>
      )}

      {/* Sort bar */}
      <div style={{ padding: '6px 20px', background: S.bg || S.surface, borderBottom: `1px solid ${S.border}`, display: 'flex', gap: 2, alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontFamily: FU, fontSize: 9, color: S.faint, letterSpacing: '0.1em', textTransform: 'uppercase', marginRight: 6 }}>Sort</span>
        {[
          { label: 'Newest',   col: 'date',   dir: 'desc' },
          { label: 'Oldest',   col: 'date',   dir: 'asc'  },
          { label: 'A → Z',    col: 'title',  dir: 'asc'  },
          { label: 'Score ↑',  col: 'score',  dir: 'desc' },
          { label: 'Words ↑',  col: 'words',  dir: 'desc' },
        ].map(({ label, col, dir }) => {
          const active = sortCol === col && sortDir === dir;
          return (
            <button key={label} onClick={() => { setSortCol(col); setSortDir(dir); }}
              style={{ fontFamily: FU, fontSize: 9, fontWeight: active ? 700 : 400, padding: '3px 9px', borderRadius: 10, background: active ? `${GOLD_V}14` : 'none', border: `1px solid ${active ? GOLD_V + '60' : S.border}`, color: active ? GOLD_V : S.faint, cursor: 'pointer', transition: 'all 0.12s' }}>
              {label}
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
          <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ accentColor: GOLD_V, cursor: 'pointer' }} />
          <span style={{ fontFamily: FU, fontSize: 9, color: S.faint }}>All</span>
        </label>
      </div>

      {/* Articles — grid or list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: viewMode === 'list' ? '0' : '20px 20px 32px' }}>
        {viewMode === 'list' ? (
          <ArticleListView
            posts={filtered}
            selected={selected}
            onToggleRow={toggleRow}
            onToggleAll={toggleAll}
            allSelected={allSelected}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onDelete={(id) => { const p = filtered.find(x => x.id === id); setDeleteConfirm({ id, title: p?.title }); }}
          />
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 40px', textAlign: 'center', fontFamily: FU, fontSize: 13, color: S.muted }}>No articles match your filters.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filtered.map(post => {
              const statuses  = computeStatuses(post);
              const wc        = computeWordCount(post.content);
              const intel     = post._intel;
              const sched     = isSched(post);
              const isChecked = selected.has(post.id);
              const primaryStatus = sched ? { label: 'Scheduled', color: '#818cf8' } : statuses[0];
              return (
                <div key={post.id}
                  onClick={() => onEdit(post.id)}
                  style={{ position: 'relative', background: isChecked ? `${GOLD_V}08` : S.surface, border: `1px solid ${isChecked ? GOLD_V + '40' : S.border}`, borderRadius: 3, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s' }}
                  onMouseEnter={e => { if (!isChecked) { e.currentTarget.style.borderColor = `${GOLD_V}30`; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.25)'; } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = isChecked ? `${GOLD_V}40` : S.border; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {/* Cover image */}
                  <div style={{ position: 'relative', aspectRatio: '16/9', background: S.surfaceUp, overflow: 'hidden' }}>
                    {post.coverImage
                      ? <img src={post.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.15 }}>
                          <span style={{ fontFamily: FD, fontSize: 32 }}>◻</span>
                        </div>
                    }
                    {/* Gradient overlay */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 60%)', pointerEvents: 'none' }} />
                    {/* Checkbox */}
                    <div style={{ position: 'absolute', top: 8, left: 8 }} onClick={e => { e.stopPropagation(); toggleRow(post.id); }}>
                      <input type="checkbox" checked={isChecked} onChange={() => toggleRow(post.id)} style={{ accentColor: GOLD_V, cursor: 'pointer', width: 14, height: 14 }} />
                    </div>
                    {/* Status badge overlay */}
                    {primaryStatus && (
                      <div style={{ position: 'absolute', top: 8, right: 8 }}>
                        <StatusBadge label={primaryStatus.label} color={primaryStatus.color} />
                      </div>
                    )}
                    {/* Intel score overlay */}
                    <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.55)', borderRadius: 2, padding: '2px 6px', display: 'flex', alignItems: 'baseline', gap: 2 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: intel.gradeColor }}>{intel.score}</span>
                      <span style={{ fontFamily: FU, fontSize: 7, color: intel.gradeColor, opacity: 0.8 }}>{intel.grade}</span>
                    </div>
                    {/* Category overlay */}
                    {(post.categoryLabel || post.category) && (
                      <div style={{ position: 'absolute', bottom: 8, left: 8 }}>
                        <span style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD_V, background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 2 }}>
                          {post.categoryLabel || post.category}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div style={{ padding: '12px 14px 10px' }}>
                    {/* Title */}
                    <div style={{ fontFamily: FD, fontSize: 16, color: S.text, lineHeight: 1.35, marginBottom: 5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {post.title || 'Untitled'}
                    </div>
                    {/* Excerpt */}
                    {post.excerpt && (
                      <div style={{ fontFamily: FU, fontSize: 11, color: S.muted, lineHeight: 1.5, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {post.excerpt}
                      </div>
                    )}
                    {/* Meta row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      {post.author && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          {post.author.avatar && <img src={post.author.avatar} alt="" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover', opacity: 0.8 }} />}
                          <span style={{ fontFamily: FU, fontSize: 10, color: S.muted }}>{post.author.name?.split(' ')[0]}</span>
                        </div>
                      )}
                      {post.author && <span style={{ color: S.faint, fontSize: 9 }}>·</span>}
                      <span style={{ fontFamily: FU, fontSize: 10, color: S.faint }}>{formatDate(post.date)}</span>
                      {wc > 0 && <>
                        <span style={{ color: S.faint, fontSize: 9 }}>·</span>
                        <span style={{ fontFamily: FU, fontSize: 10, color: S.faint }}>{wc.toLocaleString()} words</span>
                      </>}
                      {sched && <>
                        <span style={{ color: S.faint, fontSize: 9 }}>·</span>
                        <span style={{ fontFamily: FU, fontSize: 10, color: '#818cf8' }}>Sched {formatDate(post.scheduledDate)}</span>
                      </>}
                    </div>
                    {/* Updated date */}
                    {(post._lastEdited || post.updatedAt || post.updated_at) && (
                      <div style={{ fontFamily: FU, fontSize: 9, color: S.faint, marginBottom: 8 }}>
                        Updated {formatDate(post._lastEdited || post.updatedAt || post.updated_at)}
                      </div>
                    )}
                    {/* Feature flag chips */}
                    {(post.isFeatured || post.editorsChoice || post.homepageFeature) && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                        {post.isFeatured      && <span style={{ fontFamily: FU, fontSize: 7, color: GOLD_V,     padding: '2px 5px', border: `1px solid ${GOLD_V}30`,           borderRadius: 2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Featured</span>}
                        {post.homepageFeature && <span style={{ fontFamily: FU, fontSize: 7, color: '#22c55e',  padding: '2px 5px', border: '1px solid rgba(34,197,94,0.3)',  borderRadius: 2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Homepage</span>}
                        {post.editorsChoice   && <span style={{ fontFamily: FU, fontSize: 7, color: '#a78bfa',  padding: '2px 5px', border: '1px solid rgba(167,139,250,0.3)',borderRadius: 2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Editor's Pick</span>}
                      </div>
                    )}
                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 5, borderTop: `1px solid ${S.border}`, paddingTop: 9 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => onEdit(post.id)}
                        style={{ flex: 1, fontFamily: FU, fontSize: 8, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '5px 4px', borderRadius: 2, background: `${GOLD_V}0e`, border: `1px solid ${GOLD_V}40`, color: GOLD_V, cursor: 'pointer' }}>
                        Edit
                      </button>
                      <button onClick={() => onDuplicate(post.id)}
                        style={{ fontFamily: FU, fontSize: 8, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '5px 9px', borderRadius: 2, background: 'none', border: `1px solid ${S.border}`, color: S.muted, cursor: 'pointer' }}>
                        Dupe
                      </button>
                      <button onClick={e => { e.stopPropagation(); setDeleteConfirm({ id: post.id, title: post.title }); }}
                        style={{ fontFamily: FU, fontSize: 8, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '5px 9px', borderRadius: 2, background: 'none', border: '1px solid rgba(224,85,85,0.22)', color: S.error, cursor: 'pointer' }}>
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* In-app bulk action confirm */}
      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.title}
        body={confirmState?.body}
        confirmLabel={confirmState?.label || 'Confirm'}
        danger={confirmState?.danger !== false}
        onConfirm={() => { const s = confirmState; setConfirmState(null); executeBulk(s.action, s.ids); }}
        onCancel={() => setConfirmState(null)}
      />

      {/* In-app single delete confirm */}
      <ConfirmDialog
        open={!!deleteConfirm}
        title={`Delete "${deleteConfirm?.title || 'this article'}"?`}
        body="This cannot be undone. All content and blocks will be permanently removed."
        confirmLabel="Delete"
        onConfirm={() => { const d = deleteConfirm; setDeleteConfirm(null); onDelete(d.id); }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────────
const SESSION_KEY = 'magazineStudio_nav';

export default function MagazineStudio({ onNavigateMagazine, onNavigateHome }) {
  const [mode, setModeRaw] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY))?.mode || 'home'; } catch { return 'home'; }
  });
  const [editingId, setEditingIdRaw] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY))?.editingId || null; } catch { return null; }
  });
  const [returnPath, setReturnPath] = useState(() => {
    try {
      const p = sessionStorage.getItem('lwd_admin_return_path');
      if (p) { sessionStorage.removeItem('lwd_admin_return_path'); return p; }
    } catch {}
    return null;
  });

  const setMode = (m) => {
    setModeRaw(m);
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ mode: m, editingId })); } catch {}
  };
  const setEditingId = (id) => {
    setEditingIdRaw(id);
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ mode, editingId: id })); } catch {}
  };
  // Combined setter for atomic mode+id changes
  const setModeAndId = (m, id) => {
    setModeRaw(m);
    setEditingIdRaw(id);
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ mode: m, editingId: id })); } catch {}
  };
  const [categoryId, setCategoryId] = useState(() => {
    try {
      const stored = sessionStorage.getItem('magazineStudio_categoryId');
      if (stored && CATEGORIES.some(c => c.id === stored)) return stored;
    } catch {}
    return CATEGORIES[0].id;
  });
  const [allCategories, setAllCategories] = useState(CATEGORIES);
  const [localPosts, setLocalPosts] = useState(() =>
    POSTS.map(p => ({ ...p, _lastEdited: p.date }))
  );
  const [dbLoaded, setDbLoaded] = useState(false);
  const [deleteConfirmShell, setDeleteConfirmShell] = useState(null); // { id, title }
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [saveToast, setSaveToast] = useState(null); // { msg, type: 'ok'|'warn'|'error' }
  const [studioLight, setStudioLight] = useState(false);
  const [conflictState, setConflictState] = useState(null); // { post, pendingUpdate } for concurrency control
  const [pendingOverwrite, setPendingOverwrite] = useState(null); // data to save if user chooses overwrite
  const S = getS(studioLight);

  // ── Load posts from DB on mount (merge with static seed posts) ───────────────
  useEffect(() => {
    fetchPosts().then(({ data, error }) => {
      if (!error && data && data.length > 0) {
        // DB posts WIN — static seeds only fill gaps for slugs not yet in DB
        const dbSlugs = new Set(data.map(p => p.slug));
        const staticOnly = POSTS.filter(p => !dbSlugs.has(p.slug));
        setLocalPosts([
          ...data.map(p => ({ ...p, _lastEdited: p.updatedAt || p.date })),
          ...staticOnly.map(p => ({ ...p, _lastEdited: p.date, _isStaticFallback: true })),
        ]);
      }
      setDbLoaded(true);
    });
  }, []);

  // ── Load categories from DB (merge with static fallback) ────────────────────
  useEffect(() => {
    fetchCategories().then(({ data, error }) => {
      if (!error && data && data.length > 0) {
        // DB categories win; static fills gaps
        const dbIds = new Set(data.map(c => c.id));
        const staticOnly = CATEGORIES.filter(c => !dbIds.has(c.id));
        setAllCategories([...data, ...staticOnly]);
      }
    });
  }, []);

  const showToast = useCallback((msg, type = 'ok') => {
    setSaveToast({ msg, type });
    setTimeout(() => setSaveToast(null), 3500);
  }, []);

  // Check for concurrency conflicts before saving
  // Returns { hasConflict: boolean, dbPost: object | null }
  const checkForConflict = useCallback(async (postId, currentUpdatedAt) => {
    const { supabase, isSupabaseAvailable } = await import('../../lib/supabaseClient');
    if (!isSupabaseAvailable()) return { hasConflict: false, dbPost: null };

    try {
      const { data } = await supabase
        .from('magazine_posts')
        .select('id, updated_at')
        .eq('id', postId)
        .maybeSingle();

      if (!data) return { hasConflict: false, dbPost: null };

      const dbUpdatedAt = data.updated_at || data.updatedAt;
      const hasConflict = dbUpdatedAt && currentUpdatedAt &&
        new Date(dbUpdatedAt).getTime() !== new Date(currentUpdatedAt).getTime();

      return { hasConflict, dbPost: { ...data, updatedAt: dbUpdatedAt } };
    } catch (err) {
      console.error('[MagazineStudio] Conflict check error:', err);
      return { hasConflict: false, dbPost: null };
    }
  }, []);

  // Navigate to article list, optionally opening a specific article
  const openArticles = (id = null) => {
    if (id) {
      setModeAndId('article-edit', id);
    } else {
      setModeAndId('article-list', null);
    }
  };

  const handleNewArticle = async () => {
    const tempId = uid();
    const newPost = {
      id: tempId,
      slug: slugify('new-article-' + Date.now()),
      title: 'New Article',
      category: 'destinations',
      categorySlug: 'destinations',
      categoryLabel: 'Destinations',
      content: [],
      published: false,
      featured: false,
      _lastEdited: new Date().toISOString(),
    };
    // Save to DB FIRST (blocking) before opening editor to ensure we have a real UUID
    const { data: saved, error } = await savePostSafe(newPost);
    if (error) {
      showToast('Failed to create article: ' + (error.message || 'unknown error'), 'error');
      return;
    }
    if (!saved) {
      showToast('Failed to create article: no response', 'error');
      return;
    }
    // Only after successful DB save, add to list and open editor with real ID
    setLocalPosts(prev => [{ ...saved, _lastEdited: saved.updatedAt || new Date().toISOString() }, ...prev]);
    setModeAndId('article-edit', saved.id);
  };

  const handleSavePost = useCallback(async (updated) => {
    if (savingRef.current) return null; // Prevent concurrent saves (ref avoids stale closure)
    savingRef.current = true;
    setSaving(true);

    try {
      // Check for concurrency conflicts if this is an existing DB post
      if (updated.id && /^[0-9a-f]{8}-/.test(updated.id)) {
        const { hasConflict, dbPost } = await checkForConflict(updated.id, updated.updatedAt);
        if (hasConflict && dbPost) {
          setConflictState({ post: dbPost });
          setPendingOverwrite(updated);
          return null;
        }
      }

      const intel = computeContentIntelligence(updated, updated.focusKeyword || '');
      const withScore = {
        ...updated,
        contentScore:          intel.score,
        contentScoreGrade:     intel.grade,
        contentScoreBreakdown: intel.breakdown,
        contentScoreUpdatedAt: new Date().toISOString(),
      };
      const { data: saved, error, slugChanged, resolvedSlug } = await savePostSafe(withScore);
      if (error) {
        showToast('Save failed, ' + (error.message || 'unknown error'), 'error');
        return null;
      }
      if (saved) {
        setLocalPosts(prev =>
          prev.map(p => p.id === updated.id
            ? { ...saved, content: updated.content, _lastEdited: new Date().toISOString() }
            : p)
        );
        if (saved.id !== updated.id) {
          setModeAndId('article-edit', saved.id);
        }
      }
      if (slugChanged) {
        showToast(`Slug auto-adjusted to "${resolvedSlug}" (collision)`, 'warn');
      }
      return saved ? { savedId: saved.id, slug: resolvedSlug } : null;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [showToast, checkForConflict]);

  // Conflict dialog: user chooses to reload latest DB version
  const handleReloadConflict = () => {
    if (conflictState?.post?.id) {
      // Reload the post from DB and update localPosts
      setLocalPosts(prev =>
        prev.map(p => p.id === conflictState.post.id
          ? { ...p, updatedAt: conflictState.post.updatedAt, _lastEdited: conflictState.post.updatedAt }
          : p)
      );
      showToast('Article reloaded from database', 'ok');
    }
    setConflictState(null);
    setPendingOverwrite(null);
  };

  // Conflict dialog: user chooses to overwrite DB version with their changes
  const handleOverwriteConflict = async () => {
    setConflictState(null);
    if (pendingOverwrite) {
      // Retry the save with the pending data
      setSaving(true);
      const intel = computeContentIntelligence(pendingOverwrite, pendingOverwrite.focusKeyword || '');
      const withScore = {
        ...pendingOverwrite,
        contentScore:          intel.score,
        contentScoreGrade:     intel.grade,
        contentScoreBreakdown: intel.breakdown,
        contentScoreUpdatedAt: new Date().toISOString(),
      };
      const { data: saved, error, slugChanged, resolvedSlug } = await savePostSafe(withScore);
      setSaving(false);
      if (error) {
        showToast('Overwrite failed: ' + (error.message || 'unknown error'), 'error');
      } else if (saved) {
        setLocalPosts(prev =>
          prev.map(p => p.id === pendingOverwrite.id
            ? { ...saved, content: pendingOverwrite.content, _lastEdited: new Date().toISOString() }
            : p)
        );
        showToast('Changes saved (overwrote concurrent edit)', 'ok');
      }
    }
    setPendingOverwrite(null);
  };

  const handleDuplicate = async (id) => {
    const src = localPosts.find(p => p.id === id);
    if (!src) return;
    const copy = {
      ...src,
      id: uid(),
      slug: src.slug + '-copy',
      title: src.title + ' (Copy)',
      published: false,
      featured: false,
      _lastEdited: new Date().toISOString(),
    };
    setLocalPosts(prev => [copy, ...prev]);
    const { data: saved, error } = await savePostSafe(copy);
    if (!error && saved) {
      setLocalPosts(prev => prev.map(p => p.id === copy.id ? { ...saved, _lastEdited: saved.updatedAt || new Date().toISOString() } : p));
    }
  };

  const handleDelete = (id) => {
    const post = localPosts.find(p => p.id === id);
    setDeleteConfirmShell({ id, title: post?.title || 'this article' });
  };

  const executeDelete = async (id) => {
    setLocalPosts(prev => prev.filter(p => p.id !== id));
    if (editingId === id) { setModeAndId('article-list', null); }
    await deletePost(id);
  };

  const handleBulkAction = useCallback(async (action, ids) => {
    const errors = [];
    for (const id of ids) {
      const post = localPosts.find(p => p.id === id);
      if (!post) continue;
      if (action === 'delete') {
        setLocalPosts(prev => prev.filter(p => p.id !== id));
        const { error } = await deletePost(id);
        if (error) errors.push(post.title || id);
      } else {
        const updates =
          action === 'publish'   ? { published: true,  publishedAt: new Date().toISOString() } :
          action === 'unpublish' ? { published: false, publishedAt: null } :
          action === 'feature'   ? { featured: true  } :
          action === 'unfeature' ? { featured: false } : null;
        if (updates) {
          const updated = { ...post, ...updates };
          setLocalPosts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
          const { error } = await savePostSafe(updated);
          if (error) errors.push(post.title || id);
        }
      }
    }
    if (errors.length > 0) {
      showToast(`${errors.length} item${errors.length > 1 ? 's' : ''} failed to update`, 'error');
    }
  }, [localPosts, showToast]);

  const editingPost = localPosts.find(p => p.id === editingId) || null;

  // ── Deep-link: open specific article by slug (from "Edit" on article page) ──
  useEffect(() => {
    if (!dbLoaded) return;
    try {
      const slug = sessionStorage.getItem('magazineStudio_editSlug');
      if (!slug) return;
      sessionStorage.removeItem('magazineStudio_editSlug');
      const match = localPosts.find(p => p.slug === slug);
      if (match) {
        setModeAndId('article-edit', match.id);
      }
    } catch {}
  }, [dbLoaded, localPosts]);

  // Safety: if article-edit but post not found (e.g. was a new unsaved article), fall back to list
  // Wait for DB to load first — otherwise DB-only posts aren't in localPosts yet
  useEffect(() => {
    if (!dbLoaded || mode !== 'article-edit') return;

    if (!editingPost) {
      // Defer redirect to avoid setState-during-render error when ArticleEditor is unmounting
      setTimeout(() => {
        setModeAndId('article-list', null);
      }, 0);
      return;
    }

    // Check if we're loading a static fallback post (was deleted or never saved to DB)
    if (editingPost._isStaticFallback) {
      setSaveToast({
        msg: 'This article doesn\'t exist in the database. It has been reset to the template.',
        type: 'warn',
      });
      // Clear the toast after 4 seconds and redirect to list
      setTimeout(() => {
        setModeAndId('article-list', null);
      }, 4000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, editingPost, dbLoaded]);

  // ── Shell wrapper ─────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', width: '100%', background: S.bg, overflow: 'hidden', ...themeVars(studioLight) }}>
      {/* Save toast */}
      {saveToast && (
        <div style={{
          position: 'fixed', top: 16, right: 20, zIndex: 9999,
          fontFamily: FU, fontSize: 11, padding: '8px 14px', borderRadius: 4,
          background: saveToast.type === 'error' ? S.error : saveToast.type === 'warn' ? S.warn : S.success,
          color: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
          pointerEvents: 'none',
        }}>
          {saveToast.msg}
        </div>
      )}
      {/* Return to live page strip */}
      {returnPath && mode === 'article-edit' && (
        <div style={{
          height: 28, flexShrink: 0,
          background: 'rgba(201,168,76,0.08)',
          borderBottom: '1px solid rgba(201,168,76,0.16)',
          display: 'flex', alignItems: 'center',
          padding: '0 20px', gap: 10,
        }}>
          <button
            onClick={() => { window.location.href = returnPath }}
            style={{
              fontFamily: FU, fontSize: 10, fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              color: S.gold, background: 'none', border: 'none',
              cursor: 'pointer', padding: 0,
            }}
          >
            ← Back to live page
          </button>
          <span style={{ fontFamily: FU, fontSize: 10, color: S.muted }}>
            {returnPath}
          </span>
        </div>
      )}

      {/* Top bar, hidden in full-screen editors (they have their own toolbars) */}
      {mode !== 'article-edit' && mode !== 'homepage' && mode !== 'category' && <div style={{
        height: 52, flexShrink: 0,
        background: S.surface, borderBottom: `1px solid ${S.border}`,
        display: 'flex', alignItems: 'center', gap: 16, padding: '0 20px',
      }}>
        {/* Logo / brand */}
        <span style={{ fontFamily: FD, fontSize: 18, color: S.text, letterSpacing: '0.06em', flexShrink: 0 }}>
          LDW
        </span>

        <div style={{ width: 1, height: 20, background: S.border }} />

        <span style={{
          fontFamily: FU, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: S.gold,
        }}>
          Magazine Studio
        </span>

        <div style={{ flex: 1 }} />

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { label: 'Studio Home', key: 'home' },
            { label: 'Articles',    key: 'article-list' },
            { label: 'Homepage',    key: 'homepage' },
            { label: 'Categories', key: 'category' },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setModeAndId(item.key, null)}
              style={{
                fontFamily: FU, fontSize: 8, fontWeight: 600, letterSpacing: '0.1em',
                textTransform: 'uppercase', padding: '4px 10px', borderRadius: 2,
                background: mode === item.key ? `${S.gold}18` : 'none',
                border: `1px solid ${mode === item.key ? `${S.gold}60` : S.border}`,
                color: mode === item.key ? S.gold : S.muted,
                cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 20, background: S.border }} />

        {/* Back to Admin button */}
        <button
          onClick={() => window.location.hash = '#'}
          title='Back to Admin Dashboard'
          style={{
            fontFamily: FU, fontSize: 8, fontWeight: 600, letterSpacing: '0.1em',
            textTransform: 'uppercase', padding: '4px 10px', borderRadius: 2,
            background: 'none', border: `1px solid ${S.border}`,
            color: S.muted, cursor: 'pointer', transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          ← Admin
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setStudioLight(l => !l)}
          title={studioLight ? 'Switch to dark mode' : 'Switch to light mode'}
          style={{
            background: 'none', border: `1px solid ${S.border}`,
            color: S.muted, cursor: 'pointer', borderRadius: 2,
            padding: '3px 8px', fontFamily: FU, fontSize: 13, lineHeight: 1,
            transition: 'all 0.15s',
          }}
        >
          {studioLight ? '☾' : '☀'}
        </button>

        {/* Magazine preview link */}
        {onNavigateMagazine && (
          <button
            onClick={onNavigateMagazine}
            style={{
              fontFamily: FU, fontSize: 8, fontWeight: 600, letterSpacing: '0.1em',
              textTransform: 'uppercase', padding: '4px 10px', borderRadius: 2,
              background: 'none', border: `1px solid ${S.border}`,
              color: S.muted, cursor: 'pointer',
            }}
          >
            View Magazine ↗
          </button>
        )}
      </div>}

      {/* Body */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', minHeight: 0, width: '100%', ...themeVars(studioLight) }}>
        {mode === 'home' && (
          <StudioHome
            posts={localPosts}
            allCategories={allCategories}
            onOpenArticles={(id) => setModeAndId('article-edit', id)}
            onOpenHomepage={() => setModeAndId('homepage', null)}
            onOpenCategories={() => setModeAndId('category', null)}
          />
        )}

        {mode === 'article-list' && (
          <ArticleList
            posts={localPosts}
            allCategories={allCategories}
            onEdit={id => setModeAndId('article-edit', id)}
            onNew={handleNewArticle}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onBulkAction={handleBulkAction}
            onBack={() => setModeAndId('home', null)}
          />
        )}

        {mode === 'homepage' && (
          <HomepageEditor
            allPosts={localPosts}
            isLight={studioLight}
            onBack={() => setModeAndId('home', null)}
          />
        )}

        {mode === 'category' && (
          <CategoryEditor
            categoryId={categoryId}
            isLight={studioLight}
            onBack={() => setModeAndId('home', null)}
          />
        )}

        {mode === 'article-edit' && editingPost && (
          <ArticleEditor
            initialPost={editingPost}
            allPosts={localPosts}
            saving={saving}
            isLight={studioLight}
            onToggleTheme={() => setStudioLight(l => !l)}
            onSaveToParent={async (updated, isDuplicate) => {
              if (isDuplicate) {
                // Duplicate: save to DB and go to list
                const copy = { ...updated, id: uid(), slug: updated.slug + '-copy', title: updated.title + ' (Copy)', published: false };
                const { data: saved } = await savePostSafe(copy);
                setLocalPosts(prev => [saved || copy, ...prev]);
                setModeAndId('article-list', null);
              } else {
                return await handleSavePost(updated);
              }
            }}
            onBack={() => setModeAndId('article-list', null)}
          />
        )}
      </div>

      {/* Concurrency conflict resolution */}
      <ConflictDialog
        open={!!conflictState}
        conflictPost={conflictState?.post}
        onReload={handleReloadConflict}
        onOverwrite={handleOverwriteConflict}
        onCancel={() => { setConflictState(null); setPendingOverwrite(null); }}
      />

      {/* Shell-level single delete confirm (from article-list or article-edit) */}
      <ConfirmDialog
        open={!!deleteConfirmShell}
        title={`Delete "${deleteConfirmShell?.title || 'this article'}"?`}
        body="This cannot be undone. All content and blocks will be permanently removed."
        confirmLabel="Delete"
        onConfirm={() => { const d = deleteConfirmShell; setDeleteConfirmShell(null); executeDelete(d.id); }}
        onCancel={() => setDeleteConfirmShell(null)}
      />
    </div>
  );
}
