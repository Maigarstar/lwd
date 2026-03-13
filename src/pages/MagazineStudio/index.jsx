import { useState, useMemo, useEffect, useCallback } from 'react';
import { POSTS } from '../Magazine/data/posts';
import { CATEGORIES } from '../Magazine/data/categories';
import {
  getS, themeVars, FU, FD,
  computeStatuses, computeWordCount,
  StatusBadge, GoldBtn, GhostBtn, Input,
} from './StudioShared';

// CSS-var tokens — cascade from themeVars() on the MagazineStudio root wrapper.
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
import ArticleEditor from './ArticleEditor';
import HomepageEditor from './HomepageEditor';
import CategoryEditor from './CategoryEditor';
import {
  fetchPosts,
  savePost,
  deletePost,
  slugify,
} from '../../services/magazineService';

// ── Helpers ───────────────────────────────────────────────────────────────────
function uid() {
  return 'new_' + Math.random().toString(36).slice(2, 9);
}

function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Studio Home Screen ────────────────────────────────────────────────────────
function StudioHome({ posts, onOpenArticles, onOpenHomepage, onOpenCategories }) {
  const published = posts.filter(p => p.published).length;
  const drafts    = posts.filter(p => !p.published).length;
  const featured  = posts.filter(p => p.featured).length;

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
      subtitle: `${CATEGORIES.length} categories · hero, cards, SEO`,
      icon: '◈',
      action: 'Edit Categories',
      onClick: onOpenCategories,
      stat: CATEGORIES.length,
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
      <div style={{
        display: 'flex', gap: 2, marginBottom: 40, flexWrap: 'wrap',
      }}>
        {[
          { label: 'Published', value: published, color: S.success },
          { label: 'Drafts',    value: drafts,    color: S.faint },
          { label: 'Featured',  value: featured,  color: S.gold },
          { label: 'Categories',value: CATEGORIES.length, color: S.info },
        ].map(stat => (
          <div
            key={stat.label}
            style={{
              background: S.surface, border: `1px solid ${S.border}`,
              borderRadius: 2, padding: '14px 24px', minWidth: 130,
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
            {recent.map(post => {
              const statuses = computeStatuses(post);
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

// ── Article List ──────────────────────────────────────────────────────────────
function ArticleList({ posts, onEdit, onNew, onDuplicate, onDelete, onBack }) {
  const [search, setSearch]     = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = useMemo(() => {
    return posts.filter(p => {
      if (search && !p.title.toLowerCase().includes(search.toLowerCase()) &&
          !(p.excerpt || '').toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCat !== 'all' && p.category !== filterCat) return false;
      if (filterStatus === 'published' && !p.published) return false;
      if (filterStatus === 'draft' && p.published) return false;
      if (filterStatus === 'featured' && !p.featured) return false;
      return true;
    });
  }, [posts, search, filterCat, filterStatus]);

  const catOptions = [
    { value: 'all', label: 'All Categories' },
    ...CATEGORIES.map(c => ({ value: c.id, label: c.label })),
  ];

  const statusOptions = [
    { value: 'all',       label: 'All Status' },
    { value: 'published', label: 'Published' },
    { value: 'draft',     label: 'Draft' },
    { value: 'featured',  label: 'Featured' },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }}>
      {/* Toolbar */}
      <div style={{
        height: 52, flexShrink: 0,
        background: S.surface, borderBottom: `1px solid ${S.border}`,
        display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px',
      }}>
        <button
          onClick={onBack}
          style={{
            fontFamily: FU, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: S.muted, background: 'none',
            border: 'none', cursor: 'pointer',
          }}
        >
          ← Studio Home
        </button>

        <div style={{ width: 1, height: 20, background: S.border }} />

        <span style={{ fontFamily: FU, fontSize: 12, fontWeight: 600, color: S.text, letterSpacing: '0.05em' }}>
          Articles
        </span>

        <div style={{ flex: 1 }} />

        <GoldBtn small onClick={onNew}>+ New Article</GoldBtn>
      </div>

      {/* Filters */}
      <div style={{
        padding: '10px 20px', background: S.surface,
        borderBottom: `1px solid ${S.border}`,
        display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
          <span style={{
            position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
            color: S.muted, fontSize: 13,
          }}>⌕</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search articles…"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: S.inputBg || 'rgba(245,240,232,0.04)',
              border: `1px solid rgba(245,240,232,0.1)`,
              color: S.text, fontFamily: FU, fontSize: 13,
              padding: '6px 10px 6px 26px', borderRadius: 2, outline: 'none',
            }}
          />
        </div>

        {[catOptions, statusOptions].map((opts, i) => (
          <select
            key={i}
            value={i === 0 ? filterCat : filterStatus}
            onChange={e => i === 0 ? setFilterCat(e.target.value) : setFilterStatus(e.target.value)}
            style={{
              background: 'rgba(245,240,232,0.04)',
              border: `1px solid rgba(245,240,232,0.1)`,
              color: S.text, fontFamily: FU, fontSize: 12,
              padding: '6px 8px', borderRadius: 2, cursor: 'pointer', outline: 'none',
            }}
          >
            {opts.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ))}

        <span style={{ fontFamily: FU, fontSize: 12, color: S.muted, marginLeft: 4 }}>
          {filtered.length} article{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{
            padding: 40, textAlign: 'center',
            fontFamily: FU, fontSize: 14, color: S.muted,
          }}>
            No articles match your filters.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${S.border}` }}>
                {['', 'Title', 'Category', 'Status', 'Words', 'Date', ''].map((h, i) => (
                  <th key={i} style={{
                    padding: i === 0 ? '10px 8px 10px 20px' : i === 6 ? '10px 20px 10px 8px' : '10px 8px',
                    fontFamily: FU, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
                    textTransform: 'uppercase', color: S.muted,
                    textAlign: i === 6 ? 'right' : 'left',
                    whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(post => {
                const statuses = computeStatuses(post);
                const wc = computeWordCount(post.content);
                return (
                  <tr
                    key={post.id}
                    style={{
                      borderBottom: `1px solid ${S.border}`,
                      transition: 'background 0.1s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = `${S.surfaceUp}`}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={() => onEdit(post.id)}
                  >
                    {/* Thumb */}
                    <td style={{ padding: '12px 12px 12px 20px', width: 120 }}>
                      <div style={{ width: 100, height: 75, borderRadius: 2, overflow: 'hidden', background: S.surfaceUp, flexShrink: 0 }}>
                        {post.coverImage && (
                          <img src={post.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                        )}
                      </div>
                    </td>
                    {/* Title */}
                    <td style={{ padding: '10px 8px', maxWidth: 320 }}>
                      <div style={{
                        fontFamily: FD, fontSize: 16, color: S.text, lineHeight: 1.3,
                        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                        maxWidth: 300,
                      }}>
                        {post.title}
                      </div>
                      {post.excerpt && (
                        <div style={{
                          fontFamily: FU, fontSize: 12, color: S.muted, marginTop: 3,
                          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                          maxWidth: 300,
                        }}>
                          {post.excerpt}
                        </div>
                      )}
                    </td>
                    {/* Category */}
                    <td style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontFamily: FU, fontSize: 11, color: S.gold, letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}>
                        {post.categoryLabel || post.category}
                      </span>
                    </td>
                    {/* Status */}
                    <td style={{ padding: '10px 8px' }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {statuses.slice(0, 3).map(s => (
                          <StatusBadge key={s.label} label={s.label} color={s.color} />
                        ))}
                      </div>
                    </td>
                    {/* Words */}
                    <td style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: FU, fontSize: 12, color: S.muted }}>
                        {wc > 0 ? wc.toLocaleString() : '—'}
                      </span>
                    </td>
                    {/* Date */}
                    <td style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: FU, fontSize: 10, color: S.muted }}>
                        {formatDate(post.date)}
                      </span>
                    </td>
                    {/* Actions */}
                    <td style={{ padding: '10px 20px 10px 8px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => onEdit(post.id)}
                          style={{
                            fontFamily: FU, fontSize: 8, fontWeight: 600, letterSpacing: '0.1em',
                            textTransform: 'uppercase', padding: '4px 8px', borderRadius: 2,
                            background: 'none', border: `1px solid ${S.border}`,
                            color: S.muted, cursor: 'pointer',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDuplicate(post.id)}
                          style={{
                            fontFamily: FU, fontSize: 8, fontWeight: 600, letterSpacing: '0.1em',
                            textTransform: 'uppercase', padding: '4px 8px', borderRadius: 2,
                            background: 'none', border: `1px solid ${S.border}`,
                            color: S.muted, cursor: 'pointer',
                          }}
                        >
                          Dupe
                        </button>
                        <button
                          onClick={() => onDelete(post.id)}
                          style={{
                            fontFamily: FU, fontSize: 8, fontWeight: 600, letterSpacing: '0.1em',
                            textTransform: 'uppercase', padding: '4px 8px', borderRadius: 2,
                            background: 'none', border: `1px solid rgba(224,85,85,0.25)`,
                            color: S.error, cursor: 'pointer',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
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
  const [localPosts, setLocalPosts] = useState(() =>
    POSTS.map(p => ({ ...p, _lastEdited: p.date }))
  );
  const [dbLoaded, setDbLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(null); // { msg, type: 'ok'|'warn'|'error' }
  const [studioLight, setStudioLight] = useState(false);
  const S = getS(studioLight);

  // ── Load posts from DB on mount (fallback to static POSTS) ───────────────────
  useEffect(() => {
    fetchPosts().then(({ data, error }) => {
      if (!error && data && data.length > 0) {
        setLocalPosts(data.map(p => ({ ...p, _lastEdited: p.updatedAt || p.date })));
      }
      setDbLoaded(true);
    });
  }, []);

  const showToast = useCallback((msg, type = 'ok') => {
    setSaveToast({ msg, type });
    setTimeout(() => setSaveToast(null), 3500);
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
    // Optimistically add to list, then persist to DB
    setLocalPosts(prev => [newPost, ...prev]);
    setModeAndId('article-edit', tempId);
    const { data: saved, error } = await savePost(newPost);
    if (!error && saved) {
      // Replace temp entry with DB record (real UUID)
      setLocalPosts(prev => prev.map(p => p.id === tempId ? { ...saved, _lastEdited: saved.updatedAt || new Date().toISOString() } : p));
      setModeAndId('article-edit', saved.id);
    }
  };

  const handleSavePost = useCallback(async (updated) => {
    setSaving(true);
    const { data: saved, error, slugChanged, resolvedSlug } = await savePost(updated);
    setSaving(false);
    if (error) {
      showToast('Save failed — ' + (error.message || 'unknown error'), 'error');
      return null;
    }
    // Replace local entry with real DB data (handles static ID → real UUID on first save)
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
    return saved ? { savedId: saved.id } : null;
  }, [showToast]);

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
    const { data: saved, error } = await savePost(copy);
    if (!error && saved) {
      setLocalPosts(prev => prev.map(p => p.id === copy.id ? { ...saved, _lastEdited: saved.updatedAt || new Date().toISOString() } : p));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this article? This cannot be undone.')) return;
    setLocalPosts(prev => prev.filter(p => p.id !== id));
    if (editingId === id) { setModeAndId('article-list', null); }
    await deletePost(id);
  };

  const editingPost = localPosts.find(p => p.id === editingId) || null;

  // Safety: if article-edit but post not found (e.g. was a new unsaved article), fall back to list
  useEffect(() => {
    if (mode === 'article-edit' && !editingPost) {
      setModeAndId('article-list', null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, editingPost]);

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
      {/* Top bar — hidden in full-screen editors (they have their own toolbars) */}
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
            onOpenArticles={(id) => setModeAndId('article-edit', id)}
            onOpenHomepage={() => setModeAndId('homepage', null)}
            onOpenCategories={() => setModeAndId('category', null)}
          />
        )}

        {mode === 'article-list' && (
          <ArticleList
            posts={localPosts}
            onEdit={id => setModeAndId('article-edit', id)}
            onNew={handleNewArticle}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
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
            onSaveToParent={async (updated, isDuplicate) => {
              if (isDuplicate) {
                // Duplicate: save to DB and go to list
                const copy = { ...updated, id: uid(), slug: updated.slug + '-copy', title: updated.title + ' (Copy)', published: false };
                const { data: saved } = await savePost(copy);
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
    </div>
  );
}
