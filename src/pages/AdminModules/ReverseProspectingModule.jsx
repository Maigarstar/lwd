// ═══════════════════════════════════════════════════════════════════════════
// ReverseProspectingModule.jsx — Content → Commerce Sales Intelligence
//
// Two tabs:
//   1. Unlinked Mentions — scan articles for entity names not yet referenced
//   2. Retroactive Scanner — when a listing joins, find articles that mention it
//
// Surfaces leads: "Article X mentions Venue Y but Y isn't in directory → sales lead"
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { findUnlinkedMentions, retroactiveScan, saveReference, getReferenceAnalytics } from '../../services/referenceService';

const GOLD = '#C9A84C';
const GD = "'Cormorant Garamond', Georgia, serif";
const NU = "'Urbanist', sans-serif";

export default function ReverseProspectingModule({ C }) {
  const [tab, setTab] = useState('unlinked'); // 'unlinked' | 'retroactive' | 'analytics'
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [retroResults, setRetroResults] = useState([]);
  const [retroLoading, setRetroLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsPostId, setAnalyticsPostId] = useState('');
  const [linking, setLinking] = useState({}); // { [postId]: true } for in-progress saves
  const [linked, setLinked] = useState(new Set()); // successfully linked post IDs

  // Load listings for retroactive scanner
  useEffect(() => {
    if (tab !== 'retroactive') return;
    (async () => {
      try {
        const { supabase } = await import('../../lib/supabaseClient');
        const { data } = await supabase
          .from('listings')
          .select('id, venue_name, slug, city, region, country, listing_type')
          .eq('status', 'live')
          .order('created_at', { ascending: false })
          .limit(100);
        setListings(data || []);
      } catch (_) {}
    })();
  }, [tab]);

  // Unlinked mentions search
  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const data = await findUnlinkedMentions(searchTerm.trim());
      setResults(data);
    } catch (_) {
      setResults([]);
    }
    setLoading(false);
  }, [searchTerm]);

  // Retroactive scan
  const handleRetroScan = useCallback(async (listing) => {
    setSelectedListing(listing);
    setRetroLoading(true);
    try {
      const data = await retroactiveScan({
        id: listing.id,
        venueName: listing.venue_name,
        city: listing.city,
      });
      setRetroResults(data);
    } catch (_) {
      setRetroResults([]);
    }
    setRetroLoading(false);
  }, []);

  // Quick-link: create reference from prospecting result
  const handleQuickLink = useCallback(async (postId, postTitle, postSlug) => {
    if (!selectedListing) return;
    setLinking(prev => ({ ...prev, [postId]: true }));
    try {
      await saveReference({
        postId,
        entityType: 'listing',
        entityId: selectedListing.id,
        slug: selectedListing.slug,
        label: selectedListing.venue_name,
        url: `/wedding-venues/${selectedListing.slug}`,
        referenceTier: 'linked',
        tier: selectedListing.listing_type,
      });
      setLinked(prev => new Set([...prev, postId]));
    } catch (_) {}
    setLinking(prev => ({ ...prev, [postId]: false }));
  }, [selectedListing]);

  // Analytics lookup
  const handleAnalytics = useCallback(async () => {
    if (!analyticsPostId.trim()) return;
    setLoading(true);
    try {
      const data = await getReferenceAnalytics(analyticsPostId.trim());
      setAnalytics(data);
    } catch (_) {
      setAnalytics(null);
    }
    setLoading(false);
  }, [analyticsPostId]);

  const bg = C?.card || '#fff';
  const border = C?.border || '#e4e0d8';
  const text = C?.text || '#1a1a18';
  const muted = C?.muted || '#6b6560';

  return (
    <div style={{ padding: 28, fontFamily: `${NU}` }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: GD, fontSize: 28, fontWeight: 400, color: text }}>
          Reverse Prospecting
        </div>
        <div style={{ fontSize: 12, color: muted, marginTop: 4 }}>
          Content → Commerce intelligence. Find unlinked mentions and convert editorial coverage into directory listings.
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: `1px solid ${border}` }}>
        {[
          { key: 'unlinked', label: 'Unlinked Mentions', icon: '🔍' },
          { key: 'retroactive', label: 'Retroactive Scanner', icon: '⟲' },
          { key: 'analytics', label: 'Reference Analytics', icon: '📊' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '10px 20px',
            background: 'none',
            border: 'none',
            borderBottom: tab === t.key ? `2px solid ${GOLD}` : '2px solid transparent',
            color: tab === t.key ? GOLD : muted,
            fontFamily: NU,
            fontSize: 12,
            fontWeight: tab === t.key ? 700 : 500,
            cursor: 'pointer',
            letterSpacing: '0.04em',
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Unlinked Mentions Tab ─────────────────────────────────────────── */}
      {tab === 'unlinked' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search for a venue, planner, or brand name..."
              style={{
                flex: 1, padding: '10px 16px', border: `1px solid ${border}`, borderRadius: 4,
                fontFamily: NU, fontSize: 13, background: bg, color: text, outline: 'none',
              }}
            />
            <button onClick={handleSearch} disabled={loading} style={{
              padding: '10px 24px', background: GOLD, color: '#fff', border: 'none',
              borderRadius: 4, fontFamily: NU, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              opacity: loading ? 0.6 : 1,
            }}>
              {loading ? 'Scanning...' : 'Scan Articles'}
            </button>
          </div>

          <div style={{ fontSize: 11, color: muted, marginBottom: 16 }}>
            Search for an entity name to find published articles that mention it but don't have a formal reference link. These are sales leads — the entity is getting editorial coverage but isn't in your directory.
          </div>

          {results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
                {results.length} article{results.length !== 1 ? 's' : ''} mention "{searchTerm}" without a reference
              </div>
              {results.map(r => (
                <div key={r.postId} style={{
                  padding: '14px 18px', background: bg, border: `1px solid ${border}`, borderRadius: 4,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: GD, fontSize: 16, color: text }}>{r.title}</div>
                    {r.excerpt && <div style={{ fontSize: 11, color: muted, marginTop: 4, lineHeight: 1.5 }}>{r.excerpt.slice(0, 120)}...</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <a href={`/magazine/${r.slug}`} target="_blank" rel="noopener" style={{
                      padding: '6px 12px', fontSize: 10, fontWeight: 600, border: `1px solid ${border}`,
                      borderRadius: 3, color: text, textDecoration: 'none', fontFamily: NU,
                    }}>View</a>
                    <button style={{
                      padding: '6px 12px', fontSize: 10, fontWeight: 600, background: `${GOLD}15`,
                      border: `1px solid ${GOLD}40`, borderRadius: 3, color: GOLD, cursor: 'pointer', fontFamily: NU,
                    }}>
                      Add to CRM →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {results.length === 0 && !loading && searchTerm && (
            <div style={{ textAlign: 'center', padding: 40, color: muted, fontSize: 13 }}>
              No unlinked mentions found for "{searchTerm}"
            </div>
          )}
        </div>
      )}

      {/* ── Retroactive Scanner Tab ──────────────────────────────────────── */}
      {tab === 'retroactive' && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, minHeight: 400 }}>
          {/* Listing picker */}
          <div style={{ borderRight: `1px solid ${border}`, paddingRight: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
              Select Listing
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 500, overflowY: 'auto' }}>
              {listings.map(l => (
                <button key={l.id} onClick={() => handleRetroScan(l)} style={{
                  padding: '8px 12px', background: selectedListing?.id === l.id ? `${GOLD}12` : 'transparent',
                  border: selectedListing?.id === l.id ? `1px solid ${GOLD}30` : `1px solid transparent`,
                  borderRadius: 3, cursor: 'pointer', textAlign: 'left', fontFamily: NU,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: text }}>{l.venue_name}</div>
                  <div style={{ fontSize: 10, color: muted }}>{[l.city, l.region].filter(Boolean).join(', ')}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Scan results */}
          <div>
            {!selectedListing && (
              <div style={{ textAlign: 'center', padding: 60, color: muted, fontSize: 13 }}>
                Select a listing to scan existing articles for mentions
              </div>
            )}

            {retroLoading && (
              <div style={{ textAlign: 'center', padding: 60, color: GOLD, fontSize: 13 }}>
                Scanning articles for mentions of {selectedListing?.venue_name}...
              </div>
            )}

            {selectedListing && !retroLoading && retroResults.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: muted, fontSize: 13 }}>
                No unlinked articles found mentioning {selectedListing.venue_name}
              </div>
            )}

            {retroResults.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
                  {retroResults.length} article{retroResults.length !== 1 ? 's' : ''} mention {selectedListing?.venue_name}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {retroResults.map(r => (
                    <div key={r.postId} style={{
                      padding: '14px 18px', background: bg, border: `1px solid ${border}`, borderRadius: 4,
                      display: 'grid', gridTemplateColumns: r.coverImage ? '80px 1fr auto' : '1fr auto', gap: 14, alignItems: 'center',
                    }}>
                      {r.coverImage && <div style={{ width: 80, height: 56, borderRadius: 3, background: `url(${r.coverImage}) center/cover` }} />}
                      <div>
                        <div style={{ fontFamily: GD, fontSize: 15, color: text }}>{r.title}</div>
                        <div style={{ fontSize: 10, color: muted, marginTop: 2 }}>
                          {r.categoryLabel && <span style={{ color: GOLD, marginRight: 8 }}>{r.categoryLabel}</span>}
                          {r.publishedAt && new Date(r.publishedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {linked.has(r.postId) ? (
                          <span style={{ fontSize: 10, color: '#10b981', fontWeight: 600 }}>✓ Linked</span>
                        ) : (
                          <button
                            onClick={() => handleQuickLink(r.postId, r.title, r.slug)}
                            disabled={linking[r.postId]}
                            style={{
                              padding: '5px 12px', fontSize: 10, fontWeight: 600,
                              background: `linear-gradient(135deg, ${GOLD}, #b8891e)`,
                              border: 'none', borderRadius: 3, color: '#fff', cursor: 'pointer', fontFamily: NU,
                              opacity: linking[r.postId] ? 0.6 : 1,
                            }}
                          >
                            {linking[r.postId] ? 'Linking...' : 'Quick Link →'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Reference Analytics Tab ──────────────────────────────────────── */}
      {tab === 'analytics' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <input
              value={analyticsPostId}
              onChange={e => setAnalyticsPostId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAnalytics()}
              placeholder="Paste article post ID (UUID)..."
              style={{
                flex: 1, padding: '10px 16px', border: `1px solid ${border}`, borderRadius: 4,
                fontFamily: NU, fontSize: 13, background: bg, color: text, outline: 'none',
              }}
            />
            <button onClick={handleAnalytics} disabled={loading} style={{
              padding: '10px 24px', background: GOLD, color: '#fff', border: 'none',
              borderRadius: 4, fontFamily: NU, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              opacity: loading ? 0.6 : 1,
            }}>
              {loading ? 'Loading...' : 'Get Analytics'}
            </button>
          </div>

          {analytics && (
            <div>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24,
              }}>
                <div style={{ padding: '20px 24px', background: bg, border: `1px solid ${border}`, borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ fontFamily: GD, fontSize: 32, color: GOLD }}>{analytics.totalClicks}</div>
                  <div style={{ fontSize: 10, color: muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Clicks</div>
                </div>
                <div style={{ padding: '20px 24px', background: bg, border: `1px solid ${border}`, borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ fontFamily: GD, fontSize: 32, color: text }}>{analytics.references.length}</div>
                  <div style={{ fontSize: 10, color: muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>References</div>
                </div>
                <div style={{ padding: '20px 24px', background: bg, border: `1px solid ${border}`, borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ fontFamily: GD, fontSize: 32, color: text }}>
                    {analytics.references.length > 0 ? (analytics.totalClicks / analytics.references.length).toFixed(1) : '0'}
                  </div>
                  <div style={{ fontSize: 10, color: muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Avg Clicks/Ref</div>
                </div>
              </div>

              {analytics.references.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 100px', gap: 12, padding: '8px 16px', fontSize: 9, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    <span>Entity</span><span>Type</span><span>Tier</span><span style={{ textAlign: 'right' }}>Clicks</span>
                  </div>
                  {analytics.references.map(r => (
                    <div key={r.id} style={{
                      display: 'grid', gridTemplateColumns: '1fr 80px 80px 100px', gap: 12,
                      padding: '10px 16px', background: bg, border: `1px solid ${border}`, borderRadius: 4, alignItems: 'center',
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: text }}>{r.label}</span>
                      <span style={{ fontSize: 10, color: muted }}>{r.entityType}</span>
                      <span style={{
                        fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                        color: r.tier === 'sponsored' ? '#8b5cf6' : r.tier === 'featured' ? '#10b981' : GOLD,
                      }}>{r.tier}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: r.clicks > 0 ? GOLD : muted, textAlign: 'right' }}>
                        {r.clicks}
                        {r.lastClicked && <span style={{ fontSize: 9, color: muted, marginLeft: 6 }}>{new Date(r.lastClicked).toLocaleDateString()}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
