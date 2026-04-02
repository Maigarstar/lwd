import { useState, useMemo, useCallback } from 'react';
import { loadPages, savePages } from './utils/pageStorage';
import { MOCK_PAGES } from './data/mockPages';

/**
 * PageStudioHome - Pages index / home screen for Page Studio
 *
 * Matches the premium visual language of Listing Studio:
 *   same spacing, card density, gold accents, button styles, font usage.
 *
 * Props:
 *   C          {object}  Colour palette
 *   NU         {string}  UI font family
 *   GD         {string}  Display/heading font family
 *   onNavigate {fn}      Called with ("page-editor", { pageId }) or ("page-editor-new")
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

const HP_ID_KEY   = 'ps_homepage_page_id';
const HP_LOCK_KEY = 'ps_homepage_locked';

function loadHomepageId(pages) {
  const stored = localStorage.getItem(HP_ID_KEY);
  if (stored) return stored;
  const hp = pages.find(p => p.pageType === 'homepage' || p.id === 'page_home');
  return hp ? hp.id : null;
}

function saveHomepageId(id) {
  localStorage.setItem(HP_ID_KEY, id);
}

function loadHomepageLocked() {
  return localStorage.getItem(HP_LOCK_KEY) !== 'false'; // locked by default
}

function saveHomepageLocked(val) {
  localStorage.setItem(HP_LOCK_KEY, String(val));
}

const PAGE_TYPES = [
  { value: 'all',         label: 'All Types' },
  { value: 'homepage',    label: 'Homepage' },
  { value: 'destination', label: 'Destination' },
  { value: 'landing',     label: 'Landing' },
  { value: 'campaign',    label: 'Campaign' },
  { value: 'custom',      label: 'Custom' },
  { value: 'legal',       label: 'Legal' },
  { value: 'blog_landing',label: 'Blog Landing' },
];

const STATUS_OPTIONS = [
  { value: 'all',       label: 'All Status' },
  { value: 'published', label: 'Published' },
  { value: 'draft',     label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'archived',  label: 'Archived' },
];

const TYPE_COLORS = {
  homepage:    { bg: '#1d3a5f', text: '#93c5fd' },
  destination: { bg: '#1a3a2a', text: '#6ee7b7' },
  landing:     { bg: '#2d1f40', text: '#c4b5fd' },
  campaign:    { bg: '#3a2200', text: '#fcd34d' },
  custom:      { bg: '#1a1a1a', text: '#9ca3af' },
  legal:       { bg: '#1a1a1a', text: '#6b7280' },
  blog_landing:{ bg: '#1a2a2a', text: '#67e8f9' },
};

const STATUS_COLORS = {
  published: { bg: '#14532d', text: '#86efac' },
  draft:     { bg: '#1c1c1c', text: '#9ca3af' },
  scheduled: { bg: '#2d1f00', text: '#fcd34d' },
  archived:  { bg: '#1a0000', text: '#f87171' },
};

const TYPE_LABELS = {
  homepage:    'Homepage',
  destination: 'Destination',
  landing:     'Landing',
  campaign:    'Campaign',
  custom:      'Custom',
  legal:       'Legal',
  blog_landing:'Blog Landing',
};

function relativeDate(iso) {
  if (!iso) return '-';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)   return `${days}d ago`;
  const wks = Math.floor(days / 7);
  if (wks < 5)    return `${wks}w ago`;
  const mos = Math.floor(days / 30);
  if (mos < 13)   return `${mos}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function truncateSlug(slug, max = 36) {
  if (!slug || slug.length <= max) return slug;
  return slug.slice(0, max) + '...';
}

// ─── Component ────────────────────────────────────────────────────────────────

const PageStudioHome = ({ C, NU, GD, onNavigate }) => {
  const initialPages = useMemo(() => loadPages(MOCK_PAGES), []);
  const [pages,          setPages]          = useState(initialPages);
  const [homepageId,     setHomepageId]     = useState(() => loadHomepageId(initialPages));
  const [homepageLocked, setHomepageLocked] = useState(loadHomepageLocked);
  const [search,         setSearch]         = useState('');
  const [typeFilter,     setTypeFilter]     = useState('all');
  const [statusFilter,   setStatusFilter]   = useState('all');

  // Homepage always first, then sort rest by updatedAt desc
  const sorted = useMemo(() => {
    const home = pages.find(p => p.id === homepageId);
    const rest  = pages
      .filter(p => p.id !== homepageId)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    return home ? [home, ...rest] : rest;
  }, [pages, homepageId]);

  // Filter
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return sorted.filter(p => {
      if (typeFilter !== 'all' && p.pageType !== typeFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (q && !p.title.toLowerCase().includes(q) && !p.slug.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [sorted, search, typeFilter, statusFilter]);

  // Stats
  const stats = useMemo(() => ({
    total:     pages.length,
    published: pages.filter(p => p.status === 'published').length,
    draft:     pages.filter(p => p.status === 'draft').length,
    scheduled: pages.filter(p => p.status === 'scheduled').length,
  }), [pages]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleToggleLock = useCallback(() => {
    const next = !homepageLocked;
    saveHomepageLocked(next);
    setHomepageLocked(next);
  }, [homepageLocked]);

  const handleSetHomepage = useCallback((id) => {
    if (homepageLocked) return;
    saveHomepageId(id);
    setHomepageId(id);
  }, [homepageLocked]);

  const handleDuplicate = useCallback((page) => {
    const ts = Date.now();
    const newPage = {
      ...page,
      id:        `page_${ts}`,
      title:     `${page.title} (Copy)`,
      slug:      `${page.slug}-copy`,
      status:    'draft',
      updatedAt: new Date().toISOString(),
    };
    const updated = [...pages, newPage];
    savePages(updated);
    setPages(updated);
  }, [pages]);

  const handleDelete = useCallback((page) => {
    if (page.id === homepageId) {
      alert('Cannot delete the current homepage. Set a different page as homepage first.');
      return;
    }
    if (page.pageType === 'legal') {
      alert('Legal pages are protected and cannot be deleted.');
      return;
    }
    if (page.isLocked) {
      alert(`"${page.title}" is locked. Unlock it in the page editor before deleting.`);
      return;
    }
    if (!window.confirm(`Delete "${page.title}"? This cannot be undone.`)) return;
    const updated = pages.filter(p => p.id !== page.id);
    savePages(updated);
    setPages(updated);
  }, [pages, homepageId]);

  const handlePreview = useCallback((page) => {
    const slug = page.slug === '/' ? '/' : `/${page.slug}`;
    window.open(slug, '_blank', 'noopener');
  }, []);

  const handleToggleStatus = useCallback((page) => {
    const next = page.status === 'published' ? 'draft' : 'published';
    const updated = pages.map(p =>
      p.id === page.id ? { ...p, status: next, updatedAt: new Date().toISOString() } : p
    );
    savePages(updated);
    setPages(updated);
  }, [pages]);

  // Styles
  const selectStyle = {
    fontFamily: NU,
    fontSize: 11,
    color: C.off,
    backgroundColor: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 3,
    padding: '7px 10px',
    cursor: 'pointer',
    outline: 'none',
    height: 32,
  };

  return (
    <div className="psh-outer" style={{
      padding: '32px 28px 60px',
      backgroundColor: C.black,
      minHeight: '100%',
    }}>
      <style>{`
        @media (max-width: 767px) {
          .psh-outer { padding: 14px 14px 40px !important; }
          .psh-filters { flex-direction: column !important; align-items: stretch !important; }
          .psh-search { width: 100% !important; max-width: 100% !important; }
          .psh-table-header { grid-template-columns: 1fr auto auto 80px !important; }
          .psh-table-header > span:nth-child(4),
          .psh-table-header > span:nth-child(5) { display: none !important; }
          .psh-table-row { grid-template-columns: 1fr auto auto 80px !important; }
          .psh-table-row > div:nth-child(4),
          .psh-table-row > div:nth-child(5) { display: none !important; }
          .psh-table-row > div:last-child button { padding: 4px 6px !important; font-size: 9px !important; }
        }
      `}</style>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 28,
      }}>
        <div>
          <p style={{
            fontFamily: NU,
            fontSize: 11,
            color: C.grey2,
            margin: 0,
            letterSpacing: '0.3px',
          }}>
            {stats.total} pages · {stats.published} published · {stats.draft} draft
          </p>
        </div>
        <button
          onClick={() => onNavigate('page-editor-new')}
          style={{
            fontFamily: NU,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '9px 18px',
            backgroundColor: C.gold,
            color: '#fff',
            border: 'none',
            borderRadius: 3,
            cursor: 'pointer',
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.gold2 || '#7a5c0f'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.gold; e.currentTarget.style.transform = 'none'; }}
        >
          + New Page
        </button>
      </div>

      {/* ── Stats strip ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total',     value: stats.total,     color: C.gold },
          { label: 'Published', value: stats.published,  color: '#86efac' },
          { label: 'Draft',     value: stats.draft,      color: C.grey2 },
          { label: 'Scheduled', value: stats.scheduled,  color: '#fcd34d' },
        ].map(stat => (
          <div key={stat.label} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 14px',
            backgroundColor: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 3,
          }}>
            <span style={{ fontFamily: GD, fontSize: 18, fontWeight: 400, color: stat.color, lineHeight: 1 }}>{stat.value}</span>
            <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.grey2 }}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* ── Homepage lock banner ────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        marginBottom: 16,
        backgroundColor: homepageLocked ? 'rgba(201,168,76,0.06)' : 'rgba(239,68,68,0.06)',
        border: `1px solid ${homepageLocked ? 'rgba(201,168,76,0.2)' : 'rgba(239,68,68,0.2)'}`,
        borderRadius: 4,
      }}>
        <span style={{ fontSize: 15 }}>{homepageLocked ? '🔒' : '🔓'}</span>
        <div style={{ flex: 1 }}>
          <span style={{ fontFamily: NU, fontSize: 11, fontWeight: 600, color: homepageLocked ? C.gold : '#ef4444' }}>
            Homepage {homepageLocked ? 'Locked' : 'Unlocked'}
          </span>
          <span style={{ fontFamily: NU, fontSize: 11, color: C.grey2, marginLeft: 8 }}>
            {homepageLocked
              ? 'The active homepage cannot be changed. Release the lock to reassign it.'
              : 'Homepage reassignment is active. Click "Set as Home" on any page, then lock again.'}
          </span>
        </div>
        <button
          onClick={handleToggleLock}
          style={{
            fontFamily: NU,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            padding: '6px 14px',
            border: `1px solid ${homepageLocked ? 'rgba(201,168,76,0.5)' : 'rgba(239,68,68,0.5)'}`,
            backgroundColor: 'transparent',
            color: homepageLocked ? C.gold : '#ef4444',
            borderRadius: 3,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = homepageLocked ? 'rgba(201,168,76,0.1)' : 'rgba(239,68,68,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          {homepageLocked ? 'Release Lock' : 'Lock Homepage'}
        </button>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="psh-filters" style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          className="psh-search"
          type="text"
          placeholder="Search pages..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...selectStyle, width: 220, padding: '7px 10px' }}
        />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={selectStyle}>
          {PAGE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        {(search || typeFilter !== 'all' || statusFilter !== 'all') && (
          <button
            onClick={() => { setSearch(''); setTypeFilter('all'); setStatusFilter('all'); }}
            style={{ fontFamily: NU, fontSize: 10, color: C.grey2, background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', textDecoration: 'underline' }}
          >
            Clear
          </button>
        )}
        <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2, marginLeft: 'auto' }}>
          {filtered.length} of {pages.length} pages
        </span>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 4, overflow: 'hidden' }}>
        {/* Header row */}
        <div className="psh-table-header" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 110px 100px 180px 90px 1fr',
          gap: 0,
          padding: '8px 16px',
          borderBottom: `1px solid ${C.border}`,
          backgroundColor: C.dark || C.card,
        }}>
          {['Title', 'Type', 'Status', 'Slug', 'Updated', 'Actions'].map((col, i) => (
            <span key={i} style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.grey2 }}>{col}</span>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', fontFamily: NU, fontSize: 12, color: C.grey2 }}>
            No pages match your filters.
          </div>
        ) : filtered.map((page, idx) => (
          <PageRow
            key={page.id}
            page={page}
            isLast={idx === filtered.length - 1}
            isHomepage={page.id === homepageId}
            C={C}
            NU={NU}
            GD={GD}
            homepageLocked={homepageLocked}
            onEdit={() => onNavigate('page-editor', { pageId: page.id })}
            onSetHomepage={() => handleSetHomepage(page.id)}
            onDelete={() => handleDelete(page)}
            onPreview={() => handlePreview(page)}
            onDuplicate={() => handleDuplicate(page)}
            onToggleStatus={() => handleToggleStatus(page)}
          />
        ))}
      </div>

      {/* ── Footer note ─────────────────────────────────────────────────── */}
      <p style={{ fontFamily: NU, fontSize: 10, color: C.grey2, marginTop: 16, textAlign: 'right' }}>
        Pages are saved locally. Database sync coming in a future release.
      </p>
    </div>
  );
};

// ─── PageRow ──────────────────────────────────────────────────────────────────

const PageRow = ({ page, isLast, isHomepage, homepageLocked, C, NU, GD, onEdit, onSetHomepage, onDelete, onPreview, onDuplicate, onToggleStatus }) => {
  const [hovered, setHovered] = useState(false);

  const typeColor   = TYPE_COLORS[page.pageType]  || TYPE_COLORS.custom;
  const statusColor = STATUS_COLORS[page.status]  || STATUS_COLORS.draft;

  const btnBase = {
    fontFamily: NU,
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    padding: '4px 10px',
    borderRadius: 3,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
    lineHeight: '16px',
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="psh-table-row"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 110px 100px 180px 90px 1fr',
        gap: 0,
        alignItems: 'center',
        padding: '11px 16px',
        borderBottom: isLast ? 'none' : `1px solid ${C.border}`,
        backgroundColor: hovered ? (C.dark || '#1a1a18') : 'transparent',
        transition: 'background-color 0.12s ease',
        cursor: 'default',
      }}
    >
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        {isHomepage && (
          <span style={{
            fontSize: 8,
            backgroundColor: C.gold + '22',
            color: C.gold,
            border: `1px solid ${C.gold}55`,
            borderRadius: 2,
            padding: '1px 5px',
            fontFamily: NU,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}>
            {homepageLocked ? '🔒' : '🔓'} PINNED
          </span>
        )}
        <button
          onClick={onEdit}
          style={{
            fontFamily: GD,
            fontSize: 14,
            fontWeight: 400,
            color: C.white,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            textAlign: 'left',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textDecoration: hovered ? 'underline' : 'none',
            textUnderlineOffset: 2,
          }}
        >
          {page.title}
        </button>
      </div>

      {/* Type badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
        <span style={{
          display: 'inline-block',
          fontFamily: NU,
          fontSize: 9,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          padding: '2px 7px',
          borderRadius: 2,
          backgroundColor: typeColor.bg,
          color: typeColor.text,
        }}>
          {TYPE_LABELS[page.pageType] || page.pageType}
        </span>
        {page.pageType === 'legal' && (
          <span title="Legal page - protected from deletion" style={{ fontSize: 11, opacity: 0.8 }}>🛡️</span>
        )}
        {page.isLocked && page.pageType !== 'legal' && (
          <span title="Page locked" style={{ fontSize: 10, opacity: 0.7 }}>🔒</span>
        )}
      </div>

      {/* Status badge - click to toggle draft/published */}
      <div>
        <button
          onClick={page.status === 'scheduled' || page.status === 'archived' ? undefined : onToggleStatus}
          title={page.status === 'published' ? 'Click to revert to draft' : page.status === 'draft' ? 'Click to publish' : undefined}
          style={{
            display: 'inline-block',
            fontFamily: NU,
            fontSize: 9,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '2px 7px',
            borderRadius: 2,
            backgroundColor: statusColor.bg,
            color: statusColor.text,
            border: 'none',
            cursor: (page.status === 'draft' || page.status === 'published') ? 'pointer' : 'default',
          }}
          onMouseEnter={e => {
            if (page.status === 'draft' || page.status === 'published') {
              e.currentTarget.style.filter = 'brightness(1.2)';
            }
          }}
          onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
        >
          {page.status}
        </button>
      </div>

      {/* Slug (locked when published or isLocked) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden' }}>
        {(page.status === 'published' || page.isLocked) && (
          <span title={page.isLocked ? 'Page locked' : 'Slug locked on publish'} style={{ fontSize: 10, opacity: 0.6, flexShrink: 0 }}>🔒</span>
        )}
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: C.grey2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {truncateSlug(page.slug)}
        </span>
      </div>

      {/* Last updated */}
      <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2 }}>
        {relativeDate(page.updatedAt)}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Edit */}
        <button
          onClick={onEdit}
          style={{
            ...btnBase,
            backgroundColor: hovered ? C.gold : 'transparent',
            color: hovered ? '#fff' : C.gold,
            border: `1px solid ${C.gold}`,
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.gold; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = hovered ? C.gold : 'transparent'; e.currentTarget.style.color = hovered ? '#fff' : C.gold; }}
        >
          Edit
        </button>

        {/* Preview */}
        <button
          onClick={onPreview}
          title="Open page in new tab"
          style={{
            ...btnBase,
            backgroundColor: 'transparent',
            color: C.grey,
            border: `1px solid ${C.border}`,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = C.white; e.currentTarget.style.borderColor = C.grey; }}
          onMouseLeave={e => { e.currentTarget.style.color = C.grey; e.currentTarget.style.borderColor = C.border; }}
        >
          Preview
        </button>

        {/* Duplicate */}
        <button
          onClick={onDuplicate}
          title="Duplicate as draft"
          style={{
            ...btnBase,
            backgroundColor: 'transparent',
            color: C.grey,
            border: `1px solid ${C.border}`,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = C.white; e.currentTarget.style.borderColor = C.grey; }}
          onMouseLeave={e => { e.currentTarget.style.color = C.grey; e.currentTarget.style.borderColor = C.border; }}
        >
          Duplicate
        </button>

        {/* Set as Homepage (only on non-homepage rows, only when unlocked) */}
        {!isHomepage && !homepageLocked && (
          <button
            onClick={onSetHomepage}
            title="Set this page as the homepage"
            style={{
              ...btnBase,
              backgroundColor: 'transparent',
              color: C.gold,
              border: `1px solid ${C.gold}44`,
              opacity: 0.7,
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.borderColor = C.gold; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.borderColor = C.gold + '44'; }}
          >
            Set as Home
          </button>
        )}

        {/* Delete: hidden on homepage and legal pages; locked pages show disabled */}
        {!isHomepage && page.pageType !== 'legal' && (
          <button
            onClick={onDelete}
            title={page.isLocked ? 'Unlock page before deleting' : 'Delete page'}
            disabled={!!page.isLocked}
            style={{
              ...btnBase,
              backgroundColor: 'transparent',
              color: page.isLocked ? 'rgba(239,68,68,0.35)' : 'rgba(239,68,68,0.7)',
              border: `1px solid ${page.isLocked ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.25)'}`,
              cursor: page.isLocked ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={e => {
              if (!page.isLocked) {
                e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)';
                e.currentTarget.style.color = '#ef4444';
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = page.isLocked ? 'rgba(239,68,68,0.35)' : 'rgba(239,68,68,0.7)';
              e.currentTarget.style.borderColor = page.isLocked ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.25)';
            }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default PageStudioHome;
