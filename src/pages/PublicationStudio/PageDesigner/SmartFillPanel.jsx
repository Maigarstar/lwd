// ─── SmartFillPanel.jsx ───────────────────────────────────────────────────────
// Slide-in search panel for the Publication Studio PageDesigner.
// Searches the listings table (venues, planners, photographers) and calls
// onSelect(listing) with the full Supabase row when the user picks one.
// The parent calls applySmartFill(fc, listing, brand) to build the page.

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { GOLD, BORDER, MUTED, NU, GD } from './designerConstants';

// ── Helpers ───────────────────────────────────────────────────────────────────
function getHeroImage(row) {
  // mediaItems (JSONB array)
  try {
    const items = Array.isArray(row.media_items) ? row.media_items : JSON.parse(row.media_items || '[]');
    const feat = items.find(m => m.is_featured && m.type === 'image');
    if (feat?.url) return feat.url;
    const first = items.find(m => m.type === 'image');
    if (first?.url) return first.url;
  } catch { /* noop */ }
  // hero_images fallback
  try {
    const hi = Array.isArray(row.hero_images) ? row.hero_images : JSON.parse(row.hero_images || '[]');
    if (hi.length) {
      const img = hi[0];
      return typeof img === 'string' ? img : img?.url || img?.src || '';
    }
  } catch { /* noop */ }
  return null;
}

function typeLabel(t) {
  const map = { venue: 'Venue', planner: 'Planner', photographer: 'Photographer', videographer: 'Videographer', general: 'Vendor' };
  return map[t] || t || 'Listing';
}

function locationStr(row) {
  return [row.city, row.region, row.country].filter(Boolean).join(' · ');
}

// ── Type filter tabs ──────────────────────────────────────────────────────────
const TYPES = [
  { key: '', label: 'All' },
  { key: 'venue', label: 'Venues' },
  { key: 'planner', label: 'Planners' },
  { key: 'photographer', label: 'Photographers' },
];

// ── Main component ────────────────────────────────────────────────────────────
export default function SmartFillPanel({ onSelect, onClose }) {
  const [query,    setQuery]   = useState('');
  const [typeFilter, setType] = useState('');
  const [results,  setResults] = useState([]);
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState('');
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Focus input on open
  useEffect(() => { inputRef.current?.focus(); }, []);

  const search = useCallback(async (q, type) => {
    if (!q.trim() && !type) { setResults([]); return; }
    setLoading(true);
    setError('');
    try {
      let req = supabase
        .from('listings')
        .select('id, name, slug, listing_type, city, region, country, hero_images, media_items, description, short_description, capacity_max, amenities, styles, contact_profile, price_from')
        .in('status', ['published', 'active', 'draft'])
        .limit(16);

      if (q.trim()) req = req.ilike('name', `%${q.trim()}%`);
      if (type)     req = req.eq('listing_type', type);

      const { data, error: err } = await req;
      if (err) throw err;
      setResults(data || []);
    } catch (e) {
      setError('Search failed — ' + (e.message || 'unknown error'));
    }
    setLoading(false);
  }, []);

  // Debounced search on query/type change
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query, typeFilter), 350);
    return () => clearTimeout(debounceRef.current);
  }, [query, typeFilter, search]);

  // Initial load: show recent published venues
  useEffect(() => { search('', 'venue'); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 900,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      {/* Panel */}
      <div
        style={{
          width: 380,
          background: '#141210',
          borderLeft: `1px solid ${BORDER}`,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          animation: 'sfSlideIn 0.2s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`@keyframes sfSlideIn { from { transform: translateX(40px); opacity:0; } to { transform: translateX(0); opacity:1; } }`}</style>

        {/* Header */}
        <div style={{
          padding: '16px 18px 12px',
          borderBottom: `1px solid ${BORDER}`,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2 }}>
                ✦ Smart Fill
              </div>
              <div style={{ fontFamily: GD, fontSize: 16, fontStyle: 'italic', color: '#fff' }}>
                Select a listing
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}
            >
              ✕
            </button>
          </div>

          {/* Search input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search venues, planners…"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${BORDER}`,
              borderRadius: 4,
              color: '#fff',
              fontFamily: NU,
              fontSize: 13,
              padding: '9px 12px',
              outline: 'none',
              marginBottom: 10,
            }}
          />

          {/* Type filter tabs */}
          <div style={{ display: 'flex', gap: 6 }}>
            {TYPES.map(t => (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                style={{
                  fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '5px 10px', borderRadius: 2, cursor: 'pointer',
                  background: typeFilter === t.key ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${typeFilter === t.key ? 'rgba(201,168,76,0.5)' : BORDER}`,
                  color: typeFilter === t.key ? GOLD : MUTED,
                  transition: 'all 0.12s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {loading && (
            <div style={{ padding: '24px 18px', fontFamily: NU, fontSize: 11, color: MUTED, textAlign: 'center' }}>
              Searching…
            </div>
          )}
          {error && (
            <div style={{ padding: '16px 18px', fontFamily: NU, fontSize: 11, color: '#f87171' }}>
              {error}
            </div>
          )}
          {!loading && !error && results.length === 0 && (
            <div style={{ padding: '24px 18px', fontFamily: NU, fontSize: 11, color: MUTED, textAlign: 'center' }}>
              {query || typeFilter ? 'No results found' : 'Type to search'}
            </div>
          )}
          {!loading && results.map(row => {
            const img = getHeroImage(row);
            const loc = locationStr(row);
            return (
              <button
                key={row.id}
                onClick={() => onSelect(row)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '10px 18px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
              >
                {/* Thumbnail */}
                <div style={{
                  width: 56,
                  height: 72,
                  flexShrink: 0,
                  background: '#2A2520',
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: `1px solid ${BORDER}`,
                }}>
                  {img
                    ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: NU, fontSize: 9, color: MUTED }}>No img</div>
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Type badge */}
                  <div style={{
                    display: 'inline-block',
                    fontFamily: NU, fontSize: 8, fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: GOLD, marginBottom: 4,
                  }}>
                    {typeLabel(row.listing_type)}
                  </div>
                  {/* Name */}
                  <div style={{
                    fontFamily: GD, fontSize: 14, fontStyle: 'italic',
                    color: '#fff', lineHeight: 1.2, marginBottom: 3,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {row.name}
                  </div>
                  {/* Location */}
                  {loc && (
                    <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, lineHeight: 1.3 }}>
                      {loc}
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div style={{ color: MUTED, fontSize: 14, flexShrink: 0 }}>›</div>
              </button>
            );
          })}
        </div>

        {/* Footer hint */}
        <div style={{
          padding: '12px 18px',
          borderTop: `1px solid ${BORDER}`,
          fontFamily: NU, fontSize: 9, color: MUTED,
          lineHeight: 1.6, flexShrink: 0,
        }}>
          Select a listing to auto-build an editorial page with real data, images, and brand styling applied.
        </div>
      </div>
    </div>
  );
}
