// ═══════════════════════════════════════════════════════════════════════════
// ReferenceModal.jsx — Universal Reference Search & Insert
// Phase 4: Content → Commerce bridge
//
// Searchable modal across:
//   - Directory listings (venues, vendors)
//   - Venue showcases
//   - Magazine articles
//
// Returns structured reference data to the editor for insertion.
// Prioritises paid/featured listings (commercial boost).
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from 'react';
import { FU, FD } from './StudioShared';

const GOLD = '#c9a96e';

// Entity type config
const ENTITY_TYPES = [
  { key: 'all',       label: 'All',        icon: '⊙' },
  { key: 'listing',   label: 'Listings',   icon: '◆' },
  { key: 'showcase',  label: 'Showcases',  icon: '✦' },
  { key: 'article',   label: 'Articles',   icon: '¶' },
];

// Tier weights for commercial priority
const TIER_WEIGHT = { showcase: 30, featured: 20, premium: 15, standard: 5, free: 0 };

/**
 * ReferenceModal
 * Props:
 *   open            — boolean, show/hide
 *   onClose         — () => void
 *   onSelect        — (ref: { entityType, entityId, slug, label, subtitle, image, url, tier }) => void
 *   highlightedText — string, pre-fill search from highlighted text in editor
 *   currentPostId   — string, exclude current article from results
 */
export default function ReferenceModal({ open, onClose, onSelect, highlightedText = '', currentPostId }) {
  const [query, setQuery] = useState(highlightedText);
  const [filter, setFilter] = useState('all');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setQuery(highlightedText || '');
      setFilter('all');
      setResults([]);
      setHasSearched(false);
      setTimeout(() => inputRef.current?.focus(), 100);
      if (highlightedText) {
        performSearch(highlightedText, 'all');
      }
    }
  }, [open, highlightedText]); // eslint-disable-line react-hooks/exhaustive-deps

  const performSearch = useCallback(async (q, f) => {
    if (!q.trim()) { setResults([]); setHasSearched(false); return; }
    setLoading(true);
    setHasSearched(true);

    try {
      const { supabase } = await import('../../lib/supabaseClient');
      const norm = q.trim().toLowerCase();
      const all = [];

      // ── Search listings ──
      if (f === 'all' || f === 'listing') {
        const { data: listings } = await supabase
          .from('listings')
          .select('id, venue_name, slug, category, city, region, country, hero_images, status, listing_type')
          .or(`venue_name.ilike.%${norm}%,city.ilike.%${norm}%,region.ilike.%${norm}%`)
          .eq('status', 'live')
          .limit(30);

        (listings || []).forEach(l => {
          const heroImgs = l.hero_images || [];
          const firstImg = Array.isArray(heroImgs) && heroImgs.length > 0
            ? (typeof heroImgs[0] === 'string' ? heroImgs[0] : heroImgs[0]?.url || heroImgs[0]?.src || '')
            : '';
          const location = [l.city, l.region, l.country].filter(Boolean).join(', ');
          const tier = l.listing_type || 'standard';

          all.push({
            entityType: 'listing',
            entityId: l.id,
            slug: l.slug,
            label: l.venue_name || 'Unnamed Listing',
            subtitle: location,
            category: l.category || 'venue',
            image: firstImg,
            url: `/${l.category || 'wedding-venues'}/${l.slug}`,
            tier,
            score: computeRelevance(norm, l.venue_name, location) + (TIER_WEIGHT[tier] || 0),
          });
        });
      }

      // ── Search showcases ──
      if (f === 'all' || f === 'showcase') {
        const { data: showcases } = await supabase
          .from('venue_showcases')
          .select('id, title, slug, location, hero_image_url, status, type')
          .or(`title.ilike.%${norm}%,location.ilike.%${norm}%`)
          .eq('status', 'live')
          .limit(20);

        (showcases || []).forEach(s => {
          all.push({
            entityType: 'showcase',
            entityId: s.id,
            slug: s.slug,
            label: s.title,
            subtitle: s.location || '',
            category: s.type || 'venue',
            image: s.hero_image_url || '',
            url: `/showcases/${s.slug}`,
            tier: 'showcase',
            score: computeRelevance(norm, s.title, s.location || '') + TIER_WEIGHT.showcase,
          });
        });
      }

      // ── Search articles ──
      if (f === 'all' || f === 'article') {
        const { data: articles } = await supabase
          .from('magazine_posts')
          .select('id, title, slug, category_slug, category_label, excerpt, cover_image, published')
          .or(`title.ilike.%${norm}%,excerpt.ilike.%${norm}%`)
          .eq('published', true)
          .neq('id', currentPostId || '00000000-0000-0000-0000-000000000000')
          .limit(20);

        (articles || []).forEach(a => {
          all.push({
            entityType: 'article',
            entityId: a.id,
            slug: a.slug,
            label: a.title,
            subtitle: a.category_label || a.category_slug || '',
            category: a.category_slug || '',
            image: a.cover_image || '',
            url: `/magazine/${a.slug}`,
            tier: 'article',
            score: computeRelevance(norm, a.title, a.excerpt || ''),
          });
        });
      }

      // Sort by score (commercial priority)
      all.sort((a, b) => b.score - a.score);
      setResults(all.slice(0, 20));
    } catch (err) {
      console.error('[ReferenceModal] search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [currentPostId]);

  // Debounced search on query/filter change
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(query, filter), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, filter, performSearch]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  // Theme
  const bg      = '#0f0e0c';
  const surface = '#161513';
  const bdr     = 'rgba(201,169,110,0.12)';
  const text    = '#f5f0e8';
  const muted   = 'rgba(245,240,232,0.45)';
  const faint   = 'rgba(245,240,232,0.2)';

  const tierBadge = (tier) => {
    const colors = {
      showcase: { bg: `${GOLD}20`, color: GOLD, label: 'Showcase' },
      featured: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', label: 'Featured' },
      premium:  { bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6', label: 'Premium' },
      standard: { bg: 'rgba(245,240,232,0.04)', color: muted, label: 'Standard' },
      article:  { bg: 'rgba(245,240,232,0.04)', color: muted, label: 'Article' },
    };
    const c = colors[tier] || colors.standard;
    return (
      <span style={{
        fontFamily: FU, fontSize: 7, fontWeight: 600,
        padding: '1px 6px', borderRadius: 8,
        background: c.bg, color: c.color,
        letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>
        {c.label}
      </span>
    );
  };

  const typeIcon = (entityType) => {
    const icons = { listing: '◆', showcase: '✦', article: '¶' };
    const colors = { listing: GOLD, showcase: '#8b5cf6', article: '#10b981' };
    return <span style={{ fontSize: 10, color: colors[entityType] || muted }}>{icons[entityType] || '○'}</span>;
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '10vh',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 560, maxHeight: '70vh',
          background: bg, border: `1px solid ${bdr}`,
          borderRadius: 6, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px 12px',
          borderBottom: `1px solid ${bdr}`,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD }}>
              ✦ Insert Reference
            </span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: muted, cursor: 'pointer', fontSize: 14, padding: 0 }}>✕</button>
          </div>

          {/* Search input */}
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search listings, showcases, articles…"
            style={{
              width: '100%', boxSizing: 'border-box',
              fontFamily: FU, fontSize: 13, color: text,
              background: surface, border: `1px solid ${bdr}`,
              borderRadius: 3, padding: '10px 14px',
              outline: 'none',
            }}
          />

          {/* Type filters */}
          <div style={{ display: 'flex', gap: 4 }}>
            {ENTITY_TYPES.map(t => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                style={{
                  flex: 1, padding: '5px 4px', borderRadius: 2,
                  cursor: 'pointer', fontFamily: FU, fontSize: 8,
                  fontWeight: 600, letterSpacing: '0.06em',
                  background: filter === t.key ? `${GOLD}18` : 'transparent',
                  border: `1px solid ${filter === t.key ? GOLD : bdr}`,
                  color: filter === t.key ? GOLD : muted,
                  transition: 'all 0.15s',
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {loading && (
            <div style={{ padding: '24px 20px', textAlign: 'center', fontFamily: FU, fontSize: 10, color: muted }}>
              Searching…
            </div>
          )}

          {!loading && hasSearched && results.length === 0 && (
            <div style={{ padding: '24px 20px', textAlign: 'center', fontFamily: FU, fontSize: 10, color: faint }}>
              No results found for "{query}"
            </div>
          )}

          {!loading && results.map(r => (
            <div
              key={`${r.entityType}-${r.entityId}`}
              onClick={() => {
                onSelect(r);
                onClose();
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 20px', cursor: 'pointer',
                borderBottom: `1px solid ${bdr}`,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = surface}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Thumbnail */}
              <div style={{
                width: 48, height: 48, borderRadius: 3,
                background: r.image ? `url(${r.image}) center/cover` : 'rgba(245,240,232,0.04)',
                flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {!r.image && typeIcon(r.entityType)}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {typeIcon(r.entityType)}
                  <span style={{
                    fontFamily: FD, fontSize: 14, fontWeight: 400, color: text,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {r.label}
                  </span>
                </div>
                <div style={{
                  fontFamily: FU, fontSize: 9, color: muted, marginTop: 2,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {r.subtitle}
                </div>
              </div>

              {/* Tier badge */}
              {tierBadge(r.tier)}
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div style={{
          padding: '8px 20px', borderTop: `1px solid ${bdr}`,
          fontFamily: FU, fontSize: 8, color: faint, textAlign: 'center',
        }}>
          Click to insert reference · Paid listings shown first
        </div>
      </div>
    </div>
  );
}


// ── Relevance scoring ──────────────────────────────────────────────────────
function computeRelevance(query, name, extra) {
  const q = query.toLowerCase();
  const n = (name || '').toLowerCase();
  const e = (extra || '').toLowerCase();

  let score = 0;
  // Exact match in name
  if (n === q) score += 50;
  // Starts with query
  else if (n.startsWith(q)) score += 30;
  // Contains query
  else if (n.includes(q)) score += 15;
  // Extra field match
  if (e.includes(q)) score += 5;
  // Word-level matches
  const qWords = q.split(/\s+/);
  qWords.forEach(w => {
    if (w.length > 2 && n.includes(w)) score += 3;
  });

  return score;
}
