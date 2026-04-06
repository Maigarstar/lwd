// ═══════════════════════════════════════════════════════════════════════════
// LiveSeoPanel.jsx — Always-visible SEO control strip
// Layer 1: FAST FEEDBACK — "What do I need to fix right now?"
// Updates on every keystroke. Score + metrics + actions. No deep analysis.
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo, useState, useEffect, useRef } from 'react';
import { FU, FD } from './StudioShared';
import { computeContentIntelligence } from './ContentIntelligence';
import { autoSuggestReferences } from '../../services/referenceService';

const GOLD = '#c9a96e';

// ── Keyword density ─────────────────────────────────────────────────────
function computeKeywordDensity(content, keyword) {
  if (!keyword) return { count: 0, density: 0 };
  const text = (content || [])
    .map(b => [b.text, b.body].filter(Boolean).join(' '))
    .join(' ')
    .replace(/<[^>]*>/g, ' ')
    .toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const kw = keyword.toLowerCase();
  const kwWords = kw.split(/\s+/).length;
  let count = 0;
  if (kwWords === 1) {
    count = words.filter(w => w === kw).length;
  } else {
    const re = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    count = (text.match(re) || []).length;
  }
  const density = words.length > 0 ? (count * kwWords / words.length) * 100 : 0;
  return { count, density: Math.round(density * 100) / 100 };
}

// ── Heading counts ──────────────────────────────────────────────────────
function analyzeHeadings(content) {
  const headings = (content || []).filter(b => b.type === 'heading' || b.type === 'subheading');
  return {
    h2: headings.filter(b => !b.level || b.level === 2).length,
    h3: headings.filter(b => b.level === 3).length,
    total: headings.length,
  };
}

// ── Priority actions ────────────────────────────────────────────────────
function generateActions(intel, kwData, headings, formData, focusKeyword, refCount = 0) {
  const actions = [];

  if (intel.wordCount < intel.wt.target) {
    const diff = intel.wt.target - intel.wordCount;
    actions.push({
      priority: intel.wordCount < intel.wt.min ? 'high' : 'medium',
      text: `Add ${diff} more words (target: ${intel.wt.target})`,
    });
  }

  if (focusKeyword) {
    if (kwData.count === 0) {
      actions.push({ priority: 'high', text: `Add mentions of "${focusKeyword}"` });
    } else if (kwData.density < 0.5) {
      actions.push({ priority: 'medium', text: `Add ${Math.max(1, 3 - kwData.count)} more mentions of "${focusKeyword}"` });
    }
    if (!intel.kwPlacement.title) {
      actions.push({ priority: 'high', text: `Add "${focusKeyword}" to title` });
    }
  } else {
    actions.push({ priority: 'high', text: 'Set a focus keyword' });
  }

  if (headings.total === 0 && intel.wordCount > 200) {
    actions.push({ priority: 'high', text: 'Add H2 headings to structure content' });
  } else if (headings.h2 < 3 && intel.wordCount > 500) {
    actions.push({ priority: 'medium', text: `Add ${3 - headings.h2} more H2 headings` });
  }

  if (!formData.metaDescription && !formData.excerpt) {
    actions.push({ priority: 'high', text: 'Write a meta description' });
  }

  if (intel.internalLinks === 0 && intel.wordCount > 300) {
    actions.push({ priority: 'medium', text: 'Add internal links' });
  }

  if (intel.imageCount < intel.it.min && intel.wordCount > 200) {
    actions.push({ priority: 'medium', text: `Add ${intel.it.min - intel.imageCount} more images` });
  }

  if (intel.nlpPct < 0.3 && intel.wordCount > 200) {
    const missing = intel.nlpCoverage.filter(t => !t.found).slice(0, 2);
    if (missing.length > 0) {
      actions.push({ priority: 'medium', text: `Include: ${missing.map(t => `"${t.term}"`).join(', ')}` });
    }
  }

  // Reference density
  if (refCount === 0 && intel.wordCount > 300) {
    actions.push({ priority: 'medium', text: 'Add references to listings or articles' });
  } else if (refCount < 2 && intel.wordCount > 500) {
    actions.push({ priority: 'low', text: `Add ${2 - refCount} more references` });
  }

  const order = { high: 0, medium: 1, low: 2 };
  return actions.sort((a, b) => order[a.priority] - order[b.priority]).slice(0, 5);
}

// ── Colours ─────────────────────────────────────────────────────────────
const scoreColor = (s) => s >= 85 ? '#10b981' : s >= 70 ? GOLD : s >= 55 ? '#f59e0b' : '#ef4444';
const metricColor = (ok, partial) => ok ? '#10b981' : partial ? GOLD : 'rgba(245,240,232,0.2)';
const priorityColor = { high: '#ef4444', medium: '#f59e0b', low: '#6b7280' };

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function LiveSeoPanel({ formData, focusKeyword, onKeywordChange, onOpenIntelligence }) {
  const intel    = useMemo(() => computeContentIntelligence(formData, focusKeyword), [formData, focusKeyword]);
  const kwData   = useMemo(() => computeKeywordDensity(formData.content, focusKeyword), [formData.content, focusKeyword]);
  const headings = useMemo(() => analyzeHeadings(formData.content), [formData.content]);
  const actions  = useMemo(() => generateActions(intel, kwData, headings, formData, focusKeyword, refCount), [intel, kwData, headings, formData, focusKeyword, refCount]);

  // Reference suggestions — listings, showcases, articles (debounced)
  const [linkSuggestions, setLinkSuggestions] = useState([]);
  const linkTimerRef = useRef(null);
  const refCount = useMemo(() => (formData.content || []).filter(b => b.type === 'reference' || b.type === 'listing_embed' || b.type === 'showcase_embed').length, [formData.content]);
  useEffect(() => {
    if (intel.wordCount < 200) { setLinkSuggestions([]); return; }
    clearTimeout(linkTimerRef.current);
    linkTimerRef.current = setTimeout(() => {
      autoSuggestReferences({
        title: formData.title,
        content: formData.content,
        tags: formData.tags,
        categorySlug: formData.categorySlug,
        currentPostId: formData.id,
        focusKeyword,
        existingRefs: [],
      }).then(setLinkSuggestions).catch(() => setLinkSuggestions([]));
    }, 3000); // 3s debounce
    return () => clearTimeout(linkTimerRef.current);
  }, [formData.title, formData.content, formData.tags, formData.categorySlug, focusKeyword, intel.wordCount]);

  const sc = scoreColor(intel.score);

  // Theme tokens
  const bg     = '#131210';
  const bdr    = 'rgba(201,169,110,0.08)';
  const muted  = 'rgba(245,240,232,0.4)';
  const faint  = 'rgba(245,240,232,0.18)';
  const text   = '#f5f0e8';

  // Compact metric dot: filled circle = good, half = partial, empty = needs work
  const Dot = ({ ok, partial }) => (
    <span style={{ fontSize: 6, color: metricColor(ok, partial), lineHeight: 1 }}>
      {ok ? '●' : partial ? '◐' : '○'}
    </span>
  );

  return (
    <div style={{
      width: 200, flexShrink: 0, background: bg,
      borderLeft: `1px solid ${bdr}`,
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
      fontFamily: FU,
    }}>

      {/* ── Score ── */}
      <div style={{ padding: '18px 16px 14px', textAlign: 'center', flexShrink: 0, borderBottom: `1px solid ${bdr}` }}>
        <div style={{ position: 'relative', width: 58, height: 58, margin: '0 auto 6px' }}>
          <svg width={58} height={58} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={29} cy={29} r={24} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={3.5} />
            <circle cx={29} cy={29} r={24} fill="none" stroke={sc} strokeWidth={3.5}
              strokeDasharray={`${(2 * Math.PI * 24) * (intel.score / 100)} ${2 * Math.PI * 24}`}
              strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.4s ease' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: FD, fontSize: 20, fontWeight: 600, color: sc, lineHeight: 1 }}>{intel.score}</span>
          </div>
        </div>
        <div style={{ fontSize: 7, letterSpacing: '0.18em', textTransform: 'uppercase', color: muted }}>
          SEO Score
        </div>
      </div>

      {/* ── Scrollable ── */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>

        {/* ── Focus keyword ── */}
        <div style={{ padding: '10px 12px', borderBottom: `1px solid ${bdr}` }}>
          <input
            value={focusKeyword}
            onChange={e => onKeywordChange(e.target.value)}
            placeholder="Focus keyword…"
            style={{
              width: '100%', boxSizing: 'border-box',
              fontFamily: FU, fontSize: 10, color: text,
              background: 'rgba(245,240,232,0.03)',
              border: `1px solid ${bdr}`, borderRadius: 2,
              padding: '5px 8px', outline: 'none',
            }}
          />
          {focusKeyword && (
            <>
              <div style={{ display: 'flex', gap: 3, marginTop: 5, flexWrap: 'wrap' }}>
                {[
                  { l: 'Title', ok: intel.kwPlacement.title },
                  { l: 'Intro', ok: intel.kwPlacement.firstParagraph },
                  { l: 'H2',    ok: intel.kwPlacement.heading },
                  { l: 'Slug',  ok: intel.kwPlacement.slug },
                ].map(({ l, ok }) => (
                  <span key={l} style={{
                    fontSize: 7, fontWeight: 600, padding: '1px 5px', borderRadius: 8,
                    color: ok ? '#10b981' : '#ef4444',
                    opacity: ok ? 1 : 0.6,
                  }}>
                    {ok ? '✓' : '✗'} {l}
                  </span>
                ))}
              </div>
              {kwData.count > 0 && (
                <div style={{ fontSize: 8, color: muted, marginTop: 3 }}>
                  {kwData.count}× · {kwData.density}%
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Metrics (compact) ── */}
        <div style={{ padding: '10px 12px', borderBottom: `1px solid ${bdr}` }}>
          {[
            { label: 'Words',      right: `${intel.wordCount} / ${intel.wt.target}`, ok: intel.wordCount >= intel.wt.target, partial: intel.wordCount >= intel.wt.min },
            { label: 'Headings',   right: `H2:${headings.h2}  H3:${headings.h3}`, ok: headings.total >= 3, partial: headings.total >= 1 },
            { label: 'Readability',right: `${intel.readability.grade}`, ok: intel.readability.grade === 'Good', partial: intel.readability.grade === 'Moderate' },
            { label: 'Links',      right: `${intel.internalLinks}`, ok: intel.internalLinks >= 2, partial: intel.internalLinks >= 1 },
            { label: 'Images',     right: `${intel.imageCount} / ${intel.it.target}`, ok: intel.imageCount >= intel.it.target, partial: intel.imageCount >= intel.it.min },
            { label: 'NLP',        right: `${intel.nlpFound}/${intel.nlpTotal}`, ok: intel.nlpPct >= 0.7, partial: intel.nlpPct >= 0.4 },
            { label: 'Refs',       right: `${refCount} / 3`, ok: refCount >= 3, partial: refCount >= 1 },
            { label: 'Meta',       right: `${(formData.seoTitle || formData.title) ? '✓' : '—'} / ${(formData.metaDescription || formData.excerpt) ? '✓' : '—'}`, ok: !!(formData.seoTitle || formData.title) && !!(formData.metaDescription || formData.excerpt), partial: !!(formData.seoTitle || formData.title) || !!(formData.metaDescription || formData.excerpt) },
          ].map(m => (
            <div key={m.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Dot ok={m.ok} partial={m.partial} />
                <span style={{ fontSize: 9, color: muted }}>{m.label}</span>
              </span>
              <span style={{ fontSize: 9, color: m.ok ? '#10b981' : m.partial ? GOLD : faint, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                {m.right}
              </span>
            </div>
          ))}
        </div>

        {/* ── What to improve next ── */}
        <div style={{ padding: '10px 12px' }}>
          <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: muted, marginBottom: 7 }}>
            What to Improve Next
          </div>
          {actions.length === 0 ? (
            <div style={{ fontSize: 9, color: '#10b981', padding: '6px 0' }}>
              ✓ All checks passing
            </div>
          ) : (
            actions.map((a, i) => (
              <div key={i} style={{
                display: 'flex', gap: 5, alignItems: 'flex-start',
                padding: '5px 0',
                borderBottom: i < actions.length - 1 ? `1px solid ${bdr}` : 'none',
              }}>
                <span style={{ fontSize: 6, color: priorityColor[a.priority], flexShrink: 0, marginTop: 2 }}>●</span>
                <span style={{ fontSize: 9, color: text, lineHeight: 1.4, opacity: 0.75 }}>{a.text}</span>
              </div>
            ))
          )}
        </div>

        {/* ── Reference suggestions (listings, showcases, articles) ── */}
        {linkSuggestions.length > 0 && (
          <div style={{ padding: '10px 12px', borderTop: `1px solid ${bdr}` }}>
            <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: muted, marginBottom: 7 }}>
              Suggested References
            </div>
            {linkSuggestions.slice(0, 5).map((s, i) => {
              const typeIcons = { listing: '◆', showcase: '✦', article: '¶' };
              const typeColors = { listing: GOLD, showcase: '#8b5cf6', article: '#10b981' };
              return (
                <div key={`${s.entityType}-${s.entityId}`} style={{
                  padding: '5px 0',
                  borderBottom: i < Math.min(linkSuggestions.length, 5) - 1 ? `1px solid ${bdr}` : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 8, color: typeColors[s.entityType] || muted }}>{typeIcons[s.entityType] || '○'}</span>
                    <div style={{
                      fontFamily: FU, fontSize: 9, color: text, lineHeight: 1.3,
                      cursor: 'pointer', opacity: 0.8, flex: 1, overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                      title={s.url}
                      onClick={() => navigator.clipboard?.writeText(s.url)}
                    >
                      {s.label}
                    </div>
                  </div>
                  <div style={{ fontFamily: FU, fontSize: 7, color: faint, marginTop: 1, paddingLeft: 12 }}>
                    {s.reason || s.subtitle}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Bridge to deep analysis ── */}
      <div style={{ padding: '10px 12px', borderTop: `1px solid ${bdr}`, flexShrink: 0 }}>
        <button
          onClick={onOpenIntelligence}
          style={{
            width: '100%', padding: '7px',
            background: 'none', border: `1px solid ${bdr}`,
            borderRadius: 2, cursor: 'pointer',
            fontFamily: FU, fontSize: 8, fontWeight: 500,
            letterSpacing: '0.08em',
            color: muted, transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = GOLD; e.currentTarget.style.borderColor = `${GOLD}30`; }}
          onMouseLeave={e => { e.currentTarget.style.color = muted; e.currentTarget.style.borderColor = bdr; }}
        >
          View Full Analysis →
        </button>
      </div>
    </div>
  );
}

// ── Compact score badge for toolbar ──────────────────────────────────────
export function SeoScorePill({ score }) {
  const sc = scoreColor(score);
  const grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontFamily: FU, fontSize: 9, fontWeight: 700,
      color: sc, background: `color-mix(in srgb, ${sc} 10%, transparent)`,
      border: `1px solid color-mix(in srgb, ${sc} 25%, transparent)`,
      borderRadius: 10, padding: '2px 8px 2px 6px',
      letterSpacing: '0.06em',
    }}>
      <span style={{ fontSize: 12, lineHeight: 1 }}>{score}</span>
      <span style={{ fontSize: 7, opacity: 0.7 }}>{grade}</span>
    </span>
  );
}
