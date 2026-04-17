// ─── src/components/publications/IssueSearchPanel.jsx ────────────────────────
// In-reader search panel — slides in from left.
// Searches captions, vendor credits, link_targets, and template_data fields.
// All client-side, no API calls.

import { useState, useEffect, useRef, useCallback } from 'react';

const GOLD   = '#C9A84C';
const NU     = "var(--font-body, 'Jost', sans-serif)";
const GD     = "var(--font-heading-primary, 'Cormorant Garamond', Georgia, serif)";
const MUTED  = 'rgba(255,255,255,0.38)';
const BORDER = 'rgba(255,255,255,0.12)';

// ── Search index builder ───────────────────────────────────────────────────────
function buildSearchIndex(pages) {
  return pages.map(p => {
    const texts = [];
    if (p.caption) texts.push(p.caption);
    if (Array.isArray(p.vendor_credits)) {
      p.vendor_credits.forEach(c => {
        if (c.vendor)     texts.push(c.vendor);
        if (c.vendorName) texts.push(c.vendorName);
        if (c.role)       texts.push(c.role);
      });
    }
    if (Array.isArray(p.link_targets)) {
      p.link_targets.forEach(h => { if (h.label) texts.push(h.label); });
    }
    if (p.template_data?.fields) {
      Object.values(p.template_data.fields).forEach(v => {
        if (typeof v === 'string' && v.length > 0) texts.push(v);
      });
    }
    return { page_number: p.page_number, thumbnail_url: p.thumbnail_url || p.image_url, texts };
  });
}

function searchPages(index, query) {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return index
    .filter(item => item.texts.some(t => t.toLowerCase().includes(q)))
    .map(item => ({
      page_number:   item.page_number,
      thumbnail_url: item.thumbnail_url,
      snippet:       item.texts.find(t => t.toLowerCase().includes(q)) || '',
    }))
    .slice(0, 20);
}

// ── Highlight matched word in a snippet ───────────────────────────────────────
function HighlightSnippet({ text, query }) {
  if (!query.trim() || !text) return <span>{text}</span>;
  const q   = query.toLowerCase();
  const idx = text.toLowerCase().indexOf(q);
  if (idx === -1) return <span style={{ fontSize: 11, color: MUTED, lineHeight: 1.4 }}>{text}</span>;

  const before = text.slice(0, idx);
  const match  = text.slice(idx, idx + query.length);
  const after  = text.slice(idx + query.length);

  return (
    <span style={{ fontSize: 11, color: MUTED, lineHeight: 1.4 }}>
      {before}
      <mark style={{ background: 'rgba(201,168,76,0.35)', color: GOLD, borderRadius: 2, padding: '0 2px', fontWeight: 700 }}>
        {match}
      </mark>
      {after}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function IssueSearchPanel({ pages, currentPage, onJump, onClose, T }) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const inputRef   = useRef(null);
  const debounceId = useRef(null);

  // Build index once
  const indexRef = useRef(null);
  useEffect(() => {
    indexRef.current = buildSearchIndex(pages || []);
  }, [pages]);

  // Auto-focus
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  // Debounced search
  const handleQueryChange = useCallback((val) => {
    setQuery(val);
    clearTimeout(debounceId.current);
    debounceId.current = setTimeout(() => {
      setResults(searchPages(indexRef.current || [], val));
    }, 200);
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const themeCtrlBg  = T?.ctrlBg  || 'rgba(8,7,6,0.92)';
  const themeCtrlBdr = T?.ctrlBdr || BORDER;
  const themeText    = T?.text    || '#ffffff';
  const themeMuted   = T?.muted   || MUTED;
  const themeBtnHov  = T?.btnHov  || 'rgba(201,168,76,0.12)';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 290,
          background: 'rgba(0,0,0,0.3)',
        }}
      />

      {/* Panel */}
      <div style={{
        position:     'fixed',
        left:         0,
        top:          56,
        bottom:       0,
        width:        'min(340px, 100vw)',
        zIndex:       300,
        background:   themeCtrlBg,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRight:  `1px solid ${GOLD}40`,
        display:      'flex',
        flexDirection: 'column',
        animation:    'searchSlideIn 0.24s ease',
      }}>
        <style>{`
          @keyframes searchSlideIn {
            from { transform: translateX(-100%); opacity: 0; }
            to   { transform: translateX(0);     opacity: 1; }
          }
        `}</style>

        {/* Header */}
        <div style={{
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'space-between',
          padding:      '16px 16px 12px',
          borderBottom: `1px solid ${themeCtrlBdr}`,
          flexShrink:   0,
        }}>
          <span style={{
            fontFamily: NU, fontSize: 10, fontWeight: 700,
            color: GOLD, letterSpacing: '0.18em', textTransform: 'uppercase',
          }}>
            ✦ Search Issue
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none',
              color: themeMuted, cursor: 'pointer',
              fontSize: 16, lineHeight: 1, padding: 4,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = themeText}
            onMouseLeave={e => e.currentTarget.style.color = themeMuted}
          >
            ✕
          </button>
        </div>

        {/* Search input */}
        <div style={{ padding: '12px 14px 10px', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              color: themeMuted, fontSize: 13, pointerEvents: 'none',
            }}>
              🔍
            </span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => handleQueryChange(e.target.value)}
              placeholder="Search captions, vendors…"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${themeCtrlBdr}`,
                borderRadius: 4, color: themeText,
                fontFamily: NU, fontSize: 13,
                padding: '8px 10px 8px 32px', outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)'}
              onBlur={e  => e.currentTarget.style.borderColor = themeCtrlBdr}
            />
            {query && (
              <button
                onClick={() => handleQueryChange('')}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: themeMuted,
                  cursor: 'pointer', fontSize: 12, padding: 2, lineHeight: 1,
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Results list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0 16px' }}>

          {/* Zero-query state */}
          {!query.trim() && (
            <div style={{
              padding: '20px 16px',
              fontFamily: NU, fontSize: 11, color: themeMuted, lineHeight: 1.65,
              textAlign: 'center',
            }}>
              Search captions, vendor names, and editorial text across all pages.
            </div>
          )}

          {/* No results */}
          {query.trim() && results.length === 0 && (
            <div style={{
              padding: '24px 16px',
              fontFamily: NU, fontSize: 11, color: themeMuted, textAlign: 'center',
            }}>
              No results for "{query}"
            </div>
          )}

          {/* Results */}
          {results.map(r => {
            const isCurrent = r.page_number === currentPage;
            return (
              <div
                key={r.page_number}
                onClick={() => { onJump(r.page_number); onClose(); }}
                style={{
                  display:    'flex',
                  alignItems: 'center',
                  gap:        10,
                  padding:    '8px 14px',
                  cursor:     'pointer',
                  borderLeft: isCurrent ? `3px solid ${GOLD}` : '3px solid transparent',
                  background: isCurrent ? 'rgba(201,168,76,0.06)' : 'transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = themeBtnHov; }}
                onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Thumbnail */}
                <div style={{
                  width: 40, height: 56, flexShrink: 0,
                  borderRadius: 2, overflow: 'hidden',
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${isCurrent ? 'rgba(201,168,76,0.4)' : themeCtrlBdr}`,
                }}>
                  {r.thumbnail_url
                    ? <img src={r.thumbnail_url} alt={`p${r.page_number}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    : <div style={{
                        width: '100%', height: '100%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontFamily: NU, fontSize: 9, color: themeMuted,
                      }}>{r.page_number}</div>
                  }
                </div>

                {/* Page label + snippet */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: NU, fontSize: 10, fontWeight: 700,
                    color: isCurrent ? GOLD : themeText,
                    letterSpacing: '0.04em', marginBottom: 3,
                  }}>
                    Page {r.page_number}
                  </div>
                  <div style={{ overflow: 'hidden', maxHeight: 34 }}>
                    <HighlightSnippet text={r.snippet} query={query} />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Results count */}
          {results.length > 0 && (
            <div style={{
              padding: '10px 16px 0',
              fontFamily: NU, fontSize: 9, color: themeMuted,
              letterSpacing: '0.05em', textAlign: 'center',
            }}>
              {results.length} result{results.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
