// ─── src/components/publications/TextModePanel.jsx ───────────────────────────
// Accessibility / text mode: renders the entire issue as readable text.
// Full-screen, off-white background, large readable type, screen-reader friendly.
// Triggered by keyboard shortcut 'A' or TopBar button.

import { useState, useEffect, useRef, useCallback } from 'react';

const GOLD   = '#C9A84C';
const NU     = "var(--font-body, 'Jost', sans-serif)";
const GD     = "var(--font-heading-primary, 'Cormorant Garamond', Georgia, serif)";
const BG     = '#F8F5EF';
const TEXT   = '#1A1208';
const MUTED  = 'rgba(26,18,8,0.45)';
const BORDER = 'rgba(26,18,8,0.10)';

// ── Extract all text from a page ──────────────────────────────────────────────
function extractPageText(page) {
  const lines = [];

  if (page.caption?.trim()) {
    lines.push({ type: 'caption', text: page.caption.trim() });
  }

  if (Array.isArray(page.vendor_credits) && page.vendor_credits.length > 0) {
    page.vendor_credits.forEach(c => {
      const role   = c.role || '';
      const vendor = c.vendor || c.vendorName || '';
      const site   = c.website || '';
      if (vendor) {
        lines.push({ type: 'credit', role, vendor, site });
      }
    });
  }

  if (Array.isArray(page.link_targets) && page.link_targets.length > 0) {
    page.link_targets.forEach(h => {
      if (h.label) lines.push({ type: 'hotspot', text: h.label });
    });
  }

  if (page.template_data?.fields) {
    Object.entries(page.template_data.fields).forEach(([key, val]) => {
      if (typeof val === 'string' && val.trim()) {
        lines.push({ type: 'field', key, text: val.trim() });
      }
    });
  }

  return lines;
}

// ── Build full concatenated plain text for clipboard ─────────────────────────
function buildPlainText(pages, issue) {
  const parts = [];
  const header = [
    issue?.title || 'Untitled Issue',
    [issue?.issue_number && `Issue ${issue.issue_number}`, issue?.season, issue?.year]
      .filter(Boolean).join(' · '),
  ].filter(Boolean).join('\n');
  parts.push(header);
  parts.push('');

  (pages || []).forEach(page => {
    const lines = extractPageText(page);
    if (lines.length === 0) {
      parts.push(`Page ${page.page_number}: [image page]`);
    } else {
      parts.push(`Page ${page.page_number}`);
      lines.forEach(l => {
        if (l.type === 'caption') parts.push(l.text);
        else if (l.type === 'credit') parts.push(`${l.role ? l.role + ': ' : ''}${l.vendor}${l.site ? ' • ' + l.site : ''}`);
        else if (l.type === 'hotspot') parts.push(`[${l.text}]`);
        else if (l.type === 'field') parts.push(l.text);
      });
    }
    parts.push('');
  });
  return parts.join('\n');
}

// ── Page section ──────────────────────────────────────────────────────────────
function PageSection({ page }) {
  const lines = extractPageText(page);
  const hasText = lines.length > 0;

  return (
    <section
      style={{
        borderTop:    `1px solid ${BORDER}`,
        paddingTop:   28,
        marginBottom: 32,
      }}
      aria-label={`Page ${page.page_number}`}
    >
      {/* Page label */}
      <div style={{
        fontFamily:    NU,
        fontSize:      9,
        fontWeight:    700,
        color:         GOLD,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        marginBottom:  12,
      }}>
        Page {page.page_number}
      </div>

      {!hasText && (
        <p style={{
          fontFamily: NU, fontSize: 13, color: MUTED,
          fontStyle: 'italic', margin: 0,
        }}>
          — [image page] —
        </p>
      )}

      {hasText && lines.map((l, i) => {
        if (l.type === 'caption') {
          return (
            <p key={i} style={{
              fontFamily: GD, fontSize: 17, fontWeight: 400, color: TEXT,
              lineHeight: 1.7, margin: '0 0 14px',
            }}>
              {l.text}
            </p>
          );
        }
        if (l.type === 'credit') {
          return (
            <p key={i} style={{
              fontFamily: NU, fontSize: 13, color: TEXT,
              lineHeight: 1.6, margin: '0 0 6px',
              display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'baseline',
            }}>
              {l.role && (
                <span style={{ fontWeight: 700, color: 'rgba(26,18,8,0.55)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {l.role}
                </span>
              )}
              <span>{l.vendor}</span>
              {l.site && (
                <a
                  href={l.site} target="_blank" rel="noreferrer"
                  style={{ color: GOLD, fontSize: 11, textDecoration: 'none' }}
                >
                  {l.site}
                </a>
              )}
            </p>
          );
        }
        if (l.type === 'hotspot') {
          return (
            <p key={i} style={{
              fontFamily: NU, fontSize: 12, color: MUTED,
              margin: '0 0 6px', fontStyle: 'italic',
            }}>
              [{l.text}]
            </p>
          );
        }
        if (l.type === 'field') {
          return (
            <p key={i} style={{
              fontFamily: GD, fontSize: 17, color: TEXT,
              lineHeight: 1.7, margin: '0 0 10px',
            }}>
              {l.text}
            </p>
          );
        }
        return null;
      })}
    </section>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function TextModePanel({ pages, issue, onClose, T }) {
  const scrollRef   = useRef(null);
  const [copied,    setCopied]    = useState(false);
  const [activePage, setActivePage] = useState(1);

  const totalPages = (pages || []).length;

  // Track current page based on scroll position
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const sections = el.querySelectorAll('section[aria-label]');
      for (let i = sections.length - 1; i >= 0; i--) {
        const rect = sections[i].getBoundingClientRect();
        if (rect.top <= 120) {
          const label = sections[i].getAttribute('aria-label') || '';
          const num   = parseInt(label.replace('Page ', ''));
          if (!isNaN(num)) setActivePage(num);
          break;
        }
      }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleCopy = useCallback(() => {
    const text = buildPlainText(pages, issue);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  }, [pages, issue]);

  return (
    <div style={{
      position:   'fixed',
      inset:      0,
      zIndex:     400,
      background: BG,
      display:    'flex',
      flexDirection: 'column',
      animation:  'textModeIn 0.22s ease',
    }}>
      <style>{`
        @keyframes textModeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Sticky top bar */}
      <div style={{
        position:   'sticky',
        top:        0,
        zIndex:     10,
        background: BG,
        borderBottom: `1px solid ${BORDER}`,
        display:    'flex',
        alignItems: 'center',
        padding:    '0 24px',
        height:     52,
        gap:        12,
        flexShrink: 0,
      }}>
        {/* Back button */}
        <button
          onClick={onClose}
          style={{
            fontFamily: NU, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: TEXT, background: 'none',
            border: `1px solid ${BORDER}`, borderRadius: 2,
            padding: '6px 14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'border-color 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = GOLD}
          onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}
        >
          ← Back to Reading
        </button>

        {/* Title */}
        <span style={{
          fontFamily: GD, fontSize: 15, fontStyle: 'italic',
          color: TEXT, flex: 1, minWidth: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {issue?.title || 'Untitled Issue'} — Text Mode
        </span>

        {/* Page position indicator */}
        <span style={{
          fontFamily: NU, fontSize: 10, color: MUTED,
          letterSpacing: '0.04em', flexShrink: 0,
        }}>
          Page {activePage} of {totalPages}
        </span>

        {/* Copy all text */}
        <button
          onClick={handleCopy}
          style={{
            fontFamily: NU, fontSize: 9, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: copied ? GOLD : 'rgba(26,18,8,0.55)',
            background: copied ? 'rgba(201,168,76,0.1)' : 'none',
            border: `1px solid ${copied ? 'rgba(201,168,76,0.45)' : BORDER}`,
            borderRadius: 2, padding: '6px 14px',
            cursor: 'pointer', transition: 'all 0.15s',
            flexShrink: 0,
          }}
          title="Copy all text to clipboard"
        >
          {copied ? '✦ Copied!' : '⬦ Copy All Text'}
        </button>
      </div>

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        style={{
          flex:      1,
          overflowY: 'auto',
          padding:   '48px 24px 80px',
        }}
      >
        <div style={{
          maxWidth:    680,
          margin:      '0 auto',
        }}>
          {/* Issue header */}
          <header style={{ marginBottom: 48 }}>
            <div style={{
              fontFamily:    NU,
              fontSize:      10,
              fontWeight:    700,
              color:         GOLD,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom:  12,
            }}>
              {[issue?.issue_number && `Issue ${issue.issue_number}`, issue?.season, issue?.year]
                .filter(Boolean).join(' · ')}
            </div>
            <h1 style={{
              fontFamily:  GD,
              fontSize:    36,
              fontWeight:  400,
              fontStyle:   'italic',
              color:       TEXT,
              margin:      '0 0 16px',
              lineHeight:  1.2,
            }}>
              {issue?.title || 'Untitled Issue'}
            </h1>
            {issue?.intro && (
              <p style={{
                fontFamily: NU, fontSize: 15, color: 'rgba(26,18,8,0.65)',
                lineHeight: 1.7, margin: 0,
              }}>
                {issue.intro}
              </p>
            )}
          </header>

          {/* Accessibility notice */}
          <div style={{
            background: 'rgba(201,168,76,0.08)',
            border:     `1px solid rgba(201,168,76,0.25)`,
            borderRadius: 4,
            padding:    '10px 14px',
            marginBottom: 36,
            fontFamily: NU, fontSize: 11, color: 'rgba(26,18,8,0.6)',
            lineHeight: 1.55,
          }}>
            ✦ Text Mode — This view is optimised for accessibility and screen readers.
            Pages with only images are shown as "[image page]".
          </div>

          {/* Pages */}
          {(pages || []).map(page => (
            <PageSection key={page.page_number} page={page} />
          ))}
        </div>
      </div>
    </div>
  );
}
