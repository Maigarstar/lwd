// ─── src/pages/AdminModules/SeoModule.jsx ────────────────────────────────────
// SEO & Rankings admin panel.
// Coverage stats, per-listing SEO status table, single-row AI generate,
// and bulk AI generation with live progress for all missing fields.

import { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { ThemeCtx } from '../../theme/ThemeContext';
import { fetchListingsSeoStatus, generateListingSeo, bulkGenerateSeo } from '../../services/seoService';

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";
const G  = "#c9a84c";

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://www.luxuryweddingdirectory.co.uk';

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    live:    { bg: 'rgba(16,185,129,0.12)', color: '#10b981', label: 'Live' },
    draft:   { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'Draft' },
    pending: { bg: 'rgba(99,102,241,0.12)', color: '#6366f1', label: 'Pending' },
  };
  const s = map[status] || { bg: 'rgba(156,163,175,0.12)', color: '#9ca3af', label: status || 'Unknown' };
  return (
    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', background: s.bg, color: s.color, textTransform: 'uppercase', fontFamily: NU }}>
      {s.label}
    </span>
  );
}

// ── Tick/Dash indicator ────────────────────────────────────────────────────────
function Tick({ ok }) {
  return (
    <span style={{ color: ok ? '#10b981' : 'rgba(255,255,255,0.2)', fontSize: 14 }}>
      {ok ? '✓' : '–'}
    </span>
  );
}

// ── Coverage stat tile ─────────────────────────────────────────────────────────
function StatTile({ label, value, sub, gold, C }) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${gold ? 'rgba(201,168,76,0.35)' : C.border}`,
      borderRadius: 8,
      padding: '20px 24px',
      minWidth: 120,
      flex: 1,
    }}>
      <div style={{ fontFamily: GD, fontSize: 28, fontWeight: 400, color: gold ? G : C.white, letterSpacing: '-0.02em' }}>
        {value}
      </div>
      <div style={{ fontFamily: NU, fontSize: 11, color: C.grey, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 6 }}>
        {label}
      </div>
      {sub != null && (
        <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2, marginTop: 4 }}>{sub}</div>
      )}
    </div>
  );
}

// ── Toast notification ─────────────────────────────────────────────────────────
function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div style={{
      position: 'fixed', bottom: 32, right: 32, zIndex: 9999,
      background: '#1a1a18', color: '#f5f2ec',
      border: '1px solid rgba(201,168,76,0.4)',
      borderRadius: 8, padding: '14px 20px',
      fontFamily: NU, fontSize: 13,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      maxWidth: 360,
    }}>
      {message}
    </div>
  );
}

// ── Row action button ──────────────────────────────────────────────────────────
function RowBtn({ children, onClick, disabled, gold }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '4px 12px',
        borderRadius: 4,
        border: gold ? 'none' : '1px solid rgba(255,255,255,0.12)',
        background: gold ? G : 'transparent',
        color: gold ? '#fff' : 'rgba(255,255,255,0.6)',
        fontFamily: NU,
        fontSize: 11,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        whiteSpace: 'nowrap',
        transition: 'opacity 0.15s',
      }}
    >
      {children}
    </button>
  );
}

// ── Main SeoModule ─────────────────────────────────────────────────────────────
export default function SeoModule() {
  const C = useContext(ThemeCtx);

  const [listings, setListings]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState('all'); // all | incomplete | complete
  const [generating, setGenerating]     = useState({}); // id -> true
  const [bulkRunning, setBulkRunning]   = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });
  const [toast, setToast]               = useState(null);
  const [error, setError]               = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchListingsSeoStatus();
      setListings(rows);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total    = listings.length;
    const complete = listings.filter(l => l.hasSeoTitle && l.hasSeoDesc && l.hasKeywords).length;
    const missingTitle = listings.filter(l => !l.hasSeoTitle).length;
    const missingDesc  = listings.filter(l => !l.hasSeoDesc).length;
    const missingKw    = listings.filter(l => !l.hasKeywords).length;
    const pct = total > 0 ? Math.round((complete / total) * 100) : 0;
    return { total, complete, missingTitle, missingDesc, missingKw, pct };
  }, [listings]);

  // ── Filtered rows ──────────────────────────────────────────────────────────
  const rows = useMemo(() => {
    if (filter === 'complete')   return listings.filter(l => l.hasSeoTitle && l.hasSeoDesc && l.hasKeywords);
    if (filter === 'incomplete') return listings.filter(l => !l.hasSeoTitle || !l.hasSeoDesc || !l.hasKeywords);
    return listings;
  }, [listings, filter]);

  // ── Single generate ────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async (listing) => {
    setGenerating(g => ({ ...g, [listing.id]: true }));
    try {
      const updated = await generateListingSeo(listing);
      setListings(prev => prev.map(l => l.id === listing.id ? updated : l));
    } catch (err) {
      setToast(`Failed to generate SEO for ${listing.name}: ${err.message}`);
    } finally {
      setGenerating(g => { const n = { ...g }; delete n[listing.id]; return n; });
    }
  }, []);

  // ── Bulk generate ──────────────────────────────────────────────────────────
  const handleBulkGenerate = useCallback(async () => {
    if (bulkRunning) return;
    const targets = listings.filter(l => !l.hasSeoTitle || !l.hasSeoDesc);
    if (targets.length === 0) {
      setToast('All listings already have SEO title and description.');
      return;
    }

    setBulkRunning(true);
    setBulkProgress({ done: 0, total: targets.length });

    await bulkGenerateSeo(listings, {
      onProgress: (done, total) => setBulkProgress({ done, total }),
      onListingDone: (id, updated) => {
        if (updated) {
          setListings(prev => prev.map(l => l.id === id ? updated : l));
        }
        setBulkProgress(p => ({ ...p, done: p.done + 1 }));
      },
    });

    setBulkRunning(false);
    setToast(`SEO generation complete.`);
  }, [bulkRunning, listings]);

  // ── Styles ─────────────────────────────────────────────────────────────────
  const colHeader = {
    padding: '10px 14px',
    fontFamily: NU, fontSize: 10, fontWeight: 600,
    letterSpacing: '0.1em', textTransform: 'uppercase',
    color: C.grey, textAlign: 'left', borderBottom: `1px solid ${C.border}`,
    whiteSpace: 'nowrap',
  };

  const cell = {
    padding: '12px 14px',
    fontFamily: NU, fontSize: 12,
    color: C.white, borderBottom: `1px solid ${C.border}`,
    verticalAlign: 'middle',
  };

  return (
    <div style={{ color: C.white, fontFamily: NU }}>
      {/* ── Coverage header ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: GD, fontSize: 22, fontWeight: 400, color: C.off, margin: '0 0 20px' }}>
          SEO Coverage
        </h2>

        {/* Stat tiles */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <StatTile label="Total Listings"   value={stats.total}        C={C} />
          <StatTile label="SEO Complete"     value={stats.complete}     C={C} gold />
          <StatTile label="Missing Title"    value={stats.missingTitle} C={C} />
          <StatTile label="Missing Desc"     value={stats.missingDesc}  C={C} />
          <StatTile label="Missing Keywords" value={stats.missingKw}    C={C} />
        </div>

        {/* Overall coverage progress bar */}
        <div style={{ background: C.dark, borderRadius: 6, height: 8, overflow: 'hidden', maxWidth: 480 }}>
          <div style={{
            height: '100%',
            width: `${stats.pct}%`,
            background: `linear-gradient(90deg, ${G}, #e8c96c)`,
            borderRadius: 6,
            transition: 'width 0.6s ease',
          }} />
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: C.grey, fontFamily: NU }}>
          {stats.pct}% of listings have complete SEO
        </div>
      </div>

      {/* ── Action bar ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          onClick={handleBulkGenerate}
          disabled={bulkRunning}
          style={{
            padding: '9px 20px',
            background: bulkRunning ? 'rgba(201,168,76,0.3)' : G,
            color: '#fff', border: 'none', borderRadius: 6,
            fontFamily: NU, fontSize: 13, fontWeight: 500,
            cursor: bulkRunning ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {bulkRunning
            ? `Generating... (${bulkProgress.done}/${bulkProgress.total})`
            : `Bulk Generate Missing SEO (${listings.filter(l => !l.hasSeoTitle || !l.hasSeoDesc).length})`
          }
        </button>

        <button
          onClick={load}
          disabled={loading}
          style={{
            padding: '9px 16px',
            background: 'transparent',
            border: `1px solid ${C.border2}`,
            color: C.grey, borderRadius: 6,
            fontFamily: NU, fontSize: 13,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>

        {/* Bulk progress bar */}
        {bulkRunning && bulkProgress.total > 0 && (
          <div style={{ flex: 1, minWidth: 200, maxWidth: 300 }}>
            <div style={{ background: C.dark, borderRadius: 4, height: 6, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.round((bulkProgress.done / bulkProgress.total) * 100)}%`,
                background: G, borderRadius: 4, transition: 'width 0.3s',
              }} />
            </div>
            <div style={{ fontSize: 11, color: C.grey, marginTop: 4, fontFamily: NU }}>
              {bulkProgress.done} of {bulkProgress.total} done
            </div>
          </div>
        )}
      </div>

      {/* ── Filter tabs ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {['all', 'incomplete', 'complete'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px',
              borderRadius: 4,
              border: filter === f ? 'none' : `1px solid ${C.border}`,
              background: filter === f ? G : 'transparent',
              color: filter === f ? '#fff' : C.grey,
              fontFamily: NU, fontSize: 12, fontWeight: 500,
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'all 0.15s',
            }}
          >
            {f === 'all' ? `All (${listings.length})` : f === 'incomplete' ? `Incomplete (${listings.filter(l => !l.hasSeoTitle || !l.hasSeoDesc || !l.hasKeywords).length})` : `Complete (${stats.complete})`}
          </button>
        ))}
      </div>

      {/* ── Error state ─────────────────────────────────────────────────── */}
      {error && (
        <div style={{ padding: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, color: '#ef4444', fontSize: 13, marginBottom: 20, fontFamily: NU }}>
          Error loading SEO data: {error}
        </div>
      )}

      {/* ── Listings table ───────────────────────────────────────────────── */}
      <div style={{ background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: C.grey, fontFamily: NU, fontSize: 13 }}>
            Loading listings...
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: C.grey, fontFamily: NU, fontSize: 13 }}>
            No listings match this filter.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={colHeader}>Venue Name</th>
                  <th style={colHeader}>Status</th>
                  <th style={colHeader}>SEO Title</th>
                  <th style={colHeader}>SEO Desc</th>
                  <th style={colHeader}>Keywords</th>
                  <th style={colHeader}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(listing => (
                  <tr key={listing.id} style={{ transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Venue name */}
                    <td style={{ ...cell, maxWidth: 220 }}>
                      <div style={{ fontWeight: 500, color: C.white, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {listing.name}
                      </div>
                      {listing.slug && (
                        <div style={{ fontSize: 11, color: C.grey2 }}>
                          /wedding-venues/{listing.slug}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td style={cell}>
                      <StatusBadge status={listing.status} />
                    </td>

                    {/* SEO Title */}
                    <td style={{ ...cell, maxWidth: 200 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Tick ok={listing.hasSeoTitle} />
                        {listing.seo_title ? (
                          <span style={{ color: C.grey, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160, fontSize: 11 }} title={listing.seo_title}>
                            {listing.seo_title}
                          </span>
                        ) : (
                          <span style={{ color: C.grey2, fontSize: 11 }}>Not set</span>
                        )}
                      </div>
                    </td>

                    {/* SEO Desc */}
                    <td style={{ ...cell, maxWidth: 180 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Tick ok={listing.hasSeoDesc} />
                        {listing.seo_description ? (
                          <span style={{ color: C.grey, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140, fontSize: 11 }} title={listing.seo_description}>
                            {listing.seo_description.substring(0, 50)}{listing.seo_description.length > 50 ? '...' : ''}
                          </span>
                        ) : (
                          <span style={{ color: C.grey2, fontSize: 11 }}>Not set</span>
                        )}
                      </div>
                    </td>

                    {/* Keywords */}
                    <td style={cell}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Tick ok={listing.hasKeywords} />
                        {listing.hasKeywords ? (
                          <span style={{ color: C.grey, fontSize: 11 }}>
                            {Array.isArray(listing.seo_keywords) ? `${listing.seo_keywords.length} keywords` : 'Set'}
                          </span>
                        ) : (
                          <span style={{ color: C.grey2, fontSize: 11 }}>Not set</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ ...cell, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <RowBtn
                          gold
                          disabled={!!generating[listing.id] || bulkRunning}
                          onClick={() => handleGenerate(listing)}
                        >
                          {generating[listing.id] ? 'Generating...' : 'Generate'}
                        </RowBtn>
                        {listing.slug && (
                          <RowBtn
                            onClick={() => {
                              window.location.hash = `listing-studio/${listing.id}`;
                              // Trigger navigation to listing studio
                              window.dispatchEvent(new CustomEvent('lwd-nav', { detail: { tab: 'listing-studio', id: listing.id } }));
                            }}
                          >
                            Edit in Studio
                          </RowBtn>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Toast ───────────────────────────────────────────────────────── */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
