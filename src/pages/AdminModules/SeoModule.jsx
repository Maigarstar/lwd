// ─── src/pages/AdminModules/SeoModule.jsx ────────────────────────────────────
// SEO & Visibility Intelligence admin panel.
// Internal SEO: coverage stats, per-listing AI generation.
// Visibility Intelligence: domain-grouped audits, detail panel, connections.

import { useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import { ThemeCtx } from '../../theme/ThemeContext';
import { fetchListingsSeoStatus, generateListingSeo, bulkGenerateSeo } from '../../services/seoService';
import { fetchPosts, fetchCategories } from '../../services/magazineService';
import {
  fetchDomainGroupedAudits, runAudit,
  scoreLabel, scoreColor,
  getIssueSeverityCounts, scoreEnquiryExperience, computeOpportunityScore, computeTrend,
  normalizeDomain,
} from '../../services/websiteAuditService';
import {
  getConnections,
  initiateOAuth,
  openOAuthPopup,
  selectProperty,
  disconnectService,
} from '../../services/googleConnectionService';
import AuditScoreRing from '../../components/seo/AuditScoreRing';
import VisibilityDetailPanel from '../../components/seo/VisibilityDetailPanel';
import PropertySelectorModal from '../../components/seo/PropertySelectorModal';
import UrlToLeadModal from '../../components/crm/UrlToLeadModal';

const GD = 'var(--font-heading-primary)';
const NU = 'var(--font-body)';
const G  = '#c9a84c';

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso) {
  if (!iso) return '--';
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 2)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
}

function fmtDate(iso) {
  if (!iso) return '--';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    live:    { bg: 'rgba(16,185,129,0.12)',  color: '#10b981', label: 'Live'    },
    draft:   { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'Draft'   },
    pending: { bg: 'rgba(99,102,241,0.12)', color: '#6366f1', label: 'Pending' },
  };
  const s = map[status] || { bg: 'rgba(156,163,175,0.12)', color: '#9ca3af', label: status || 'Unknown' };
  return (
    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', background: s.bg, color: s.color, textTransform: 'uppercase', fontFamily: NU }}>
      {s.label}
    </span>
  );
}

function Tick({ ok }) {
  return <span style={{ color: ok ? '#10b981' : 'rgba(255,255,255,0.2)', fontSize: 14 }}>{ok ? '✓' : '–'}</span>;
}

function StatTile({ label, value, sub, gold, C }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${gold ? 'rgba(201,168,76,0.35)' : C.border}`, borderRadius: 8, padding: '20px 24px', minWidth: 120, flex: 1 }}>
      <div style={{ fontFamily: GD, fontSize: 28, fontWeight: 400, color: gold ? G : C.white, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontFamily: NU, fontSize: 11, color: C.grey, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 6 }}>{label}</div>
      {sub != null && <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Toast({ message, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 9999, background: '#1a1a18', color: '#f5f2ec', border: '1px solid rgba(201,168,76,0.4)', borderRadius: 8, padding: '14px 20px', fontFamily: NU, fontSize: 13, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', maxWidth: 360 }}>
      {message}
    </div>
  );
}

function RowBtn({ children, onClick, disabled, gold }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding: '4px 12px', borderRadius: 4, border: gold ? 'none' : '1px solid rgba(255,255,255,0.12)', background: gold ? G : 'transparent', color: gold ? '#fff' : 'rgba(255,255,255,0.6)', fontFamily: NU, fontSize: 11, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap', transition: 'opacity 0.15s' }}>
      {children}
    </button>
  );
}

function OpportunityBadge({ value }) {
  const cfg = { High: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' }, Medium: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' }, Low: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e' } };
  const s = cfg[value] || cfg.Low;
  return <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', background: s.bg, color: s.color, textTransform: 'uppercase', fontFamily: NU }}>{value}</span>;
}

function TrendCell({ trend }) {
  if (trend.direction === 'none') return <span style={{ fontFamily: NU, fontSize: 10, color: '#4b5563', fontStyle: 'italic' }}>No history yet</span>;
  const col = trend.direction === 'up' ? '#22c55e' : trend.direction === 'down' ? '#ef4444' : '#6b7280';
  const arrow = trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→';
  return <span style={{ fontFamily: NU, fontSize: 12, color: col, fontWeight: 600 }}>{arrow} {trend.label}</span>;
}

function EnquiryBadge({ label }) {
  const cfg = { Excellent: '#22c55e', Good: '#a3e635', Weak: '#f97316', Poor: '#ef4444', Unknown: '#6b7280' };
  return <span style={{ fontFamily: NU, fontSize: 11, color: cfg[label] || '#6b7280' }}>{label}</span>;
}

function SeverityCounts({ counts }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {counts.critical > 0 && <span style={{ fontFamily: NU, fontSize: 10, color: '#ef4444', fontWeight: 600 }}>🔴 {counts.critical}</span>}
      {counts.important > 0 && <span style={{ fontFamily: NU, fontSize: 10, color: '#f97316', fontWeight: 600 }}>🟠 {counts.important}</span>}
      {counts.minor > 0 && <span style={{ fontFamily: NU, fontSize: 10, color: '#6b7280' }}>⚪ {counts.minor}</span>}
      {counts.critical === 0 && counts.important === 0 && counts.minor === 0 && (
        <span style={{ fontFamily: NU, fontSize: 10, color: '#22c55e' }}>✓ Clear</span>
      )}
    </div>
  );
}

// ── Google product SVG icons ──────────────────────────────────────────────────

function GoogleAnalyticsIcon({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="192" height="192" rx="40" fill="#F9AB00"/>
      <g>
        <path d="M130 29c0-11.05 8.95-20 20-20s20 8.95 20 20v134c0 11.05-8.95 20-20 20s-20-8.95-20-20V29z" fill="#E37400"/>
        <path d="M76 96c0-11.05 8.95-20 20-20s20 8.95 20 20v67c0 11.05-8.95 20-20 20s-20-8.95-20-20V96z" fill="white"/>
        <path d="M22 143c0-11.05 8.95-20 20-20s20 8.95 20 20v20c0 11.05-8.95 20-20 20s-20-8.95-20-20v-20z" fill="white"/>
      </g>
    </svg>
  );
}

function GoogleSearchConsoleIcon({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="192" height="192" rx="40" fill="#458CF5"/>
      <path d="M96 36C63.27 36 36 63.27 36 96s27.27 60 60 60 60-27.27 60-60-27.27-60-60-60zm0 108c-26.47 0-48-21.53-48-48s21.53-48 48-48 48 21.53 48 48-21.53 48-48 48z" fill="white"/>
      <path d="M130.34 125.66l-17.4-17.4A30.12 30.12 0 0 1 96 126a30 30 0 1 1 30-30c0 6.32-1.96 12.18-5.26 17.06l17.32 17.32-7.72 7.28zM96 108a18 18 0 1 0 0-36 18 18 0 0 0 0 36z" fill="white"/>
      <circle cx="148" cy="148" r="22" fill="#34A853"/>
      <path d="M140 148h16M148 140v16" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

// ── Connections Tab ───────────────────────────────────────────────────────────

function ConnectionCard({ name, description, icon, integration, conn, onConnect, onDisconnect, connecting, C }) {
  const status    = conn?.status || 'disconnected';
  const connected = status === 'connected';
  const isError   = status === 'error';
  const isPending = status === 'pending';
  const propName  = conn?.selected_property_name || null;

  return (
    <div style={{ background: C.card, border: `1px solid ${connected ? 'rgba(34,197,94,0.25)' : isError ? 'rgba(239,68,68,0.2)' : C.border}`, borderRadius: 8, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: GD, fontSize: 16, fontWeight: 400, color: C.off, marginBottom: 4 }}>{name}</div>
        <div style={{ fontFamily: NU, fontSize: 12, color: C.grey, lineHeight: 1.6, marginBottom: 10 }}>{description}</div>
        <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2 }}>
          Unlocks: <span style={{ color: G }}>{integration}</span>
        </div>
        {connected && propName && (
          <div style={{ fontFamily: NU, fontSize: 10, color: '#22c55e', marginTop: 4 }}>
            Property: {propName}
          </div>
        )}
        {isError && conn?.error_message && (
          <div style={{ fontFamily: NU, fontSize: 10, color: '#ef4444', marginTop: 4 }}>
            Error: {conn.error_message}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0, minWidth: 120, textAlign: 'right' }}>
        {connected ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ fontFamily: NU, fontSize: 11, color: '#22c55e', fontWeight: 600 }}>Connected</span>
            </div>
            <button
              onClick={onDisconnect}
              style={{ padding: '5px 12px', background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 4, fontFamily: NU, fontSize: 11, cursor: 'pointer' }}
            >
              Disconnect
            </button>
          </div>
        ) : isPending ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 14, height: 14, border: `2px solid ${G}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'connSpin 0.8s linear infinite' }} />
            <span style={{ fontFamily: NU, fontSize: 11, color: G }}>Connecting...</span>
          </div>
        ) : (
          <button
            onClick={onConnect}
            disabled={connecting}
            style={{ padding: '9px 20px', background: 'transparent', border: `1px solid ${G}`, color: G, borderRadius: 5, fontFamily: NU, fontSize: 12, fontWeight: 600, cursor: connecting ? 'not-allowed' : 'pointer', opacity: connecting ? 0.6 : 1, whiteSpace: 'nowrap', transition: 'background 0.15s' }}
            onMouseEnter={e => { if (!connecting) e.currentTarget.style.background = 'rgba(201,168,76,0.08)'; }}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {isError ? 'Reconnect' : 'Connect via OAuth'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main SeoModule ─────────────────────────────────────────────────────────────

export default function SeoModule() {
  const C = useContext(ThemeCtx);

  // Internal SEO state
  const [listings,       setListings]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [listingFilter,  setListingFilter]  = useState('all');
  const [generating,     setGenerating]     = useState({});
  const [bulkRunning,    setBulkRunning]    = useState(false);
  const [bulkProgress,   setBulkProgress]   = useState({ done: 0, total: 0 });
  const [toast,          setToast]          = useState(null);
  const [error,          setError]          = useState(null);

  // Visibility Intelligence state
  const [seoTab,           setSeoTab]         = useState('overview');
  const [domainGroups,     setDomainGroups]   = useState([]);
  const [auditsLoading,    setAuditsLoading]  = useState(false);
  const [reauditingUrl,    setReauditingUrl]  = useState(null);
  const [showUrlModal,     setShowUrlModal]   = useState(false);

  // Detail panel state
  const [selectedGroup,  setSelectedGroup]  = useState(null);
  const [panelOpen,      setPanelOpen]      = useState(false);

  // Connections state
  const [connections,         setConnections]         = useState({ analytics: null, search_console: null });
  const [connectionsLoading,  setConnectionsLoading]  = useState(false);
  const [connecting,          setConnecting]          = useState(null); // 'analytics' | 'search_console' | null
  const [connError,           setConnError]           = useState(null);
  const [propertyModal,       setPropertyModal]       = useState(null); // { service, properties }
  const oauthCleanup = useRef(null);

  // Audit filter/sort state
  const [auditSearch,      setAuditSearch]    = useState('');
  const [auditTypeFilter,  setAuditTypeFilter]= useState('all');   // all | vendor | prospect
  const [auditOppFilter,   setAuditOppFilter] = useState('all');   // all | High | Medium | Low
  const [auditSort,        setAuditSort]      = useState('date');  // date | score-asc | score-desc | opportunity

  // Content & SEO state
  const [contentPosts,      setContentPosts]      = useState([]);
  const [contentCats,       setContentCats]       = useState([]);
  const [contentLoading,    setContentLoading]    = useState(false);
  const [contentFilter,     setContentFilter]     = useState('all'); // all | missing | complete
  const [contentSearch,     setContentSearch]     = useState('');

  // ── Load internal SEO listings ──────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setListings(await fetchListingsSeoStatus()); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Load domain-grouped audits ──────────────────────────────────────────────
  const loadDomainAudits = useCallback(async () => {
    setAuditsLoading(true);
    try { setDomainGroups(await fetchDomainGroupedAudits(400)); }
    catch (e) { console.error('Failed to load audits:', e); }
    finally { setAuditsLoading(false); }
  }, []);

  useEffect(() => {
    const VI_TABS = ['website-audits', 'authority-scores', 'ai-visibility', 'prospect-outreach'];
    if (VI_TABS.includes(seoTab) && domainGroups.length === 0 && !auditsLoading) {
      loadDomainAudits();
    }
  }, [seoTab]);

  // ── Load content SEO (magazine posts + categories) ──────────────────────────
  const loadContentSeo = useCallback(async () => {
    setContentLoading(true);
    try {
      const [postsRes, catsRes] = await Promise.all([
        fetchPosts(),
        fetchCategories(),
      ]);
      setContentPosts(postsRes?.data || []);
      setContentCats(catsRes?.data || []);
    } catch (e) {
      console.error('Failed to load content SEO:', e);
    } finally {
      setContentLoading(false);
    }
  }, []);

  useEffect(() => {
    if (seoTab === 'content-seo' && contentPosts.length === 0 && !contentLoading) {
      loadContentSeo();
    }
  }, [seoTab]);

  // ── Load Google connections ─────────────────────────────────────────────────
  const loadConnections = useCallback(async () => {
    setConnectionsLoading(true);
    try {
      const c = await getConnections();
      setConnections(c);
    } catch (e) {
      console.error('Failed to load connections:', e);
    } finally {
      setConnectionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (seoTab === 'connections') loadConnections();
  }, [seoTab, loadConnections]);

  // Cleanup popup listener on unmount
  useEffect(() => () => { if (oauthCleanup.current) oauthCleanup.current(); }, []);

  // ── Handle OAuth connect ────────────────────────────────────────────────────
  async function handleConnect(service) {
    setConnecting(service);
    setConnError(null);
    try {
      const oauthUrl = await initiateOAuth(service);
      const cleanup = openOAuthPopup(
        oauthUrl,
        async (svc, properties) => {
          // OAuth succeeded - refresh connection status
          await loadConnections();
          setConnecting(null);
          // Show property selector if multiple properties
          const freshConn = await getConnections();
          setConnections(freshConn);
          if (properties && properties.length > 1) {
            setPropertyModal({ service: svc, properties });
          } else if (properties && properties.length === 1) {
            await selectProperty(svc, properties[0].id, properties[0].displayName);
            await loadConnections();
          }
        },
        (err) => {
          setConnError(err);
          setConnecting(null);
        },
      );
      oauthCleanup.current = cleanup;
    } catch (e) {
      setConnError(e.message);
      setConnecting(null);
    }
  }

  // ── Handle disconnect ───────────────────────────────────────────────────────
  async function handleDisconnect(service) {
    if (!window.confirm(`Disconnect ${service === 'analytics' ? 'Google Analytics' : 'Google Search Console'}? This will remove all saved tokens and property selections.`)) return;
    try {
      await disconnectService(service);
      await loadConnections();
    } catch (e) {
      setConnError(e.message);
    }
  }

  // ── Re-audit a domain ───────────────────────────────────────────────────────
  async function handleReaudit(auditRow) {
    setReauditingUrl(auditRow.url);
    try {
      const newRow = await runAudit(auditRow.url, {
        prospectId:  auditRow.prospect_id || undefined,
        listingId:   auditRow.listing_id  || undefined,
        logActivity: !!auditRow.prospect_id,
      });
      // Refresh domain groups to pick up new audit
      await loadDomainAudits();
      // Update selected group if open
      if (selectedGroup && normalizeDomain(auditRow.url) === selectedGroup.domain) {
        setSelectedGroup(prev => prev ? { ...prev, latest: newRow, history: [prev.latest, ...prev.history] } : null);
      }
    } catch (e) {
      setToast(`Re-audit failed: ${e.message}`);
    } finally {
      setReauditingUrl(null);
    }
  }

  // ── Stats ───────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total        = listings.length;
    const complete     = listings.filter(l => l.hasSeoTitle && l.hasSeoDesc && l.hasKeywords).length;
    const missingTitle = listings.filter(l => !l.hasSeoTitle).length;
    const missingDesc  = listings.filter(l => !l.hasSeoDesc).length;
    const missingKw    = listings.filter(l => !l.hasKeywords).length;
    const pct          = total > 0 ? Math.round((complete / total) * 100) : 0;
    return { total, complete, missingTitle, missingDesc, missingKw, pct };
  }, [listings]);

  const rows = useMemo(() => {
    if (listingFilter === 'complete')   return listings.filter(l => l.hasSeoTitle && l.hasSeoDesc && l.hasKeywords);
    if (listingFilter === 'incomplete') return listings.filter(l => !l.hasSeoTitle || !l.hasSeoDesc || !l.hasKeywords);
    return listings;
  }, [listings, listingFilter]);

  // ── Filtered + sorted domain groups ────────────────────────────────────────
  const filteredGroups = useMemo(() => {
    let groups = domainGroups;

    if (auditSearch.trim()) {
      const q = auditSearch.trim().toLowerCase();
      groups = groups.filter(g => g.domain.toLowerCase().includes(q));
    }
    if (auditTypeFilter !== 'all') {
      groups = groups.filter(g => {
        const isProspect = !!g.latest.prospect_id;
        return auditTypeFilter === 'prospect' ? isProspect : !isProspect;
      });
    }
    if (auditOppFilter !== 'all') {
      groups = groups.filter(g => computeOpportunityScore(g.latest.score, g.latest.findings) === auditOppFilter);
    }

    groups = [...groups];
    if (auditSort === 'score-asc')    groups.sort((a, b) => a.latest.score - b.latest.score);
    if (auditSort === 'score-desc')   groups.sort((a, b) => b.latest.score - a.latest.score);
    if (auditSort === 'opportunity') {
      const order = { High: 0, Medium: 1, Low: 2 };
      groups.sort((a, b) => order[computeOpportunityScore(a.latest.score, a.latest.findings)] - order[computeOpportunityScore(b.latest.score, b.latest.findings)]);
    }
    // default 'date': already sorted by created_at desc from fetchDomainGroupedAudits

    return groups;
  }, [domainGroups, auditSearch, auditTypeFilter, auditOppFilter, auditSort]);

  // ── Generate (single) ───────────────────────────────────────────────────────
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

  // ── Bulk generate ───────────────────────────────────────────────────────────
  const handleBulkGenerate = useCallback(async () => {
    if (bulkRunning) return;
    const targets = listings.filter(l => !l.hasSeoTitle || !l.hasSeoDesc);
    if (targets.length === 0) { setToast('All listings already have SEO title and description.'); return; }

    setBulkRunning(true);
    setBulkProgress({ done: 0, total: targets.length });
    await bulkGenerateSeo(listings, {
      onProgress: (done, total) => setBulkProgress({ done, total }),
      onListingDone: (id, updated) => {
        if (updated) setListings(prev => prev.map(l => l.id === id ? updated : l));
        setBulkProgress(p => ({ ...p, done: p.done + 1 }));
      },
    });
    setBulkRunning(false);
    setToast('SEO generation complete.');
  }, [bulkRunning, listings]);

  // ── Row open ────────────────────────────────────────────────────────────────
  function openGroup(group) {
    setSelectedGroup(group);
    setPanelOpen(true);
  }

  // ── Styles ──────────────────────────────────────────────────────────────────
  const colHeader = { padding: '10px 14px', fontFamily: NU, fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.grey, textAlign: 'left', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' };
  const cell      = { padding: '12px 14px', fontFamily: NU, fontSize: 12, color: C.white, borderBottom: `1px solid ${C.border}`, verticalAlign: 'middle' };
  const filterInput = { padding: '7px 12px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 5, color: C.white, fontFamily: NU, fontSize: 12, outline: 'none', minWidth: 0 };

  // ── Tab definitions ─────────────────────────────────────────────────────────
  const TAB_GROUPS = [
    {
      label: 'Internal SEO',
      tabs: [
        { id: 'overview',    label: 'Overview'      },
        { id: 'listings',    label: 'Listings SEO'  },
        { id: 'content-seo', label: 'Content & SEO' },
      ],
    },
    {
      label: 'Visibility Intelligence',
      tabs: [
        { id: 'website-audits',    label: 'Website Audits'   },
        { id: 'authority-scores',  label: 'Authority Scores' },
        { id: 'ai-visibility',     label: 'AI Visibility'    },
        { id: 'prospect-outreach', label: 'Prospect Outreach'},
      ],
    },
    {
      label: 'Connected Data',
      tabs: [
        { id: 'connections', label: 'Connections' },
      ],
    },
  ];

  return (
    <div style={{ color: C.white, fontFamily: NU }}>

      {/* ── Tab bar ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 32, flexWrap: 'wrap', borderBottom: `1px solid ${C.border}` }}>
        {TAB_GROUPS.map((group, gi) => (
          <div key={group.label} style={{ display: 'flex', flexDirection: 'column', marginRight: gi < TAB_GROUPS.length - 1 ? 24 : 0 }}>
            <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.grey2, padding: '0 2px 6px', opacity: 0.7 }}>
              {group.label}
            </div>
            <div style={{ display: 'flex', gap: 0 }}>
              {group.tabs.map(tab => (
                <button key={tab.id} onClick={() => setSeoTab(tab.id)} style={{ padding: '7px 14px', background: 'transparent', border: 'none', borderBottom: seoTab === tab.id ? `2px solid ${G}` : '2px solid transparent', color: seoTab === tab.id ? G : C.grey, fontFamily: NU, fontSize: 12, fontWeight: seoTab === tab.id ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color 0.15s', marginBottom: -1 }}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════ INTERNAL SEO ══════════════════════════════ */}

      {seoTab === 'overview' && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: GD, fontSize: 22, fontWeight: 400, color: C.off, margin: '0 0 20px' }}>SEO Coverage</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            <StatTile label="Total Listings"   value={stats.total}        C={C} />
            <StatTile label="SEO Complete"     value={stats.complete}     C={C} gold />
            <StatTile label="Missing Title"    value={stats.missingTitle} C={C} />
            <StatTile label="Missing Desc"     value={stats.missingDesc}  C={C} />
            <StatTile label="Missing Keywords" value={stats.missingKw}    C={C} />
          </div>
          <div style={{ background: C.dark, borderRadius: 6, height: 8, overflow: 'hidden', maxWidth: 480 }}>
            <div style={{ height: '100%', width: `${stats.pct}%`, background: `linear-gradient(90deg, ${G}, #e8c96c)`, borderRadius: 6, transition: 'width 0.6s ease' }} />
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: C.grey, fontFamily: NU }}>{stats.pct}% of listings have complete SEO</div>
        </div>
      )}

      {seoTab === 'listings' && (
        <div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
            <button onClick={handleBulkGenerate} disabled={bulkRunning} style={{ padding: '9px 20px', background: bulkRunning ? 'rgba(201,168,76,0.3)' : G, color: '#fff', border: 'none', borderRadius: 6, fontFamily: NU, fontSize: 13, fontWeight: 500, cursor: bulkRunning ? 'not-allowed' : 'pointer' }}>
              {bulkRunning ? `Generating... (${bulkProgress.done}/${bulkProgress.total})` : `Bulk Generate Missing SEO (${listings.filter(l => !l.hasSeoTitle || !l.hasSeoDesc).length})`}
            </button>
            <button onClick={load} disabled={loading} style={{ padding: '9px 16px', background: 'transparent', border: `1px solid ${C.border2}`, color: C.grey, borderRadius: 6, fontFamily: NU, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            {bulkRunning && bulkProgress.total > 0 && (
              <div style={{ flex: 1, minWidth: 200, maxWidth: 300 }}>
                <div style={{ background: C.dark, borderRadius: 4, height: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.round((bulkProgress.done / bulkProgress.total) * 100)}%`, background: G, borderRadius: 4, transition: 'width 0.3s' }} />
                </div>
                <div style={{ fontSize: 11, color: C.grey, marginTop: 4, fontFamily: NU }}>{bulkProgress.done} of {bulkProgress.total} done</div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
            {['all', 'incomplete', 'complete'].map(f => (
              <button key={f} onClick={() => setListingFilter(f)} style={{ padding: '6px 14px', borderRadius: 4, border: listingFilter === f ? 'none' : `1px solid ${C.border}`, background: listingFilter === f ? G : 'transparent', color: listingFilter === f ? '#fff' : C.grey, fontFamily: NU, fontSize: 12, fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize' }}>
                {f === 'all' ? `All (${listings.length})` : f === 'incomplete' ? `Incomplete (${listings.filter(l => !l.hasSeoTitle || !l.hasSeoDesc || !l.hasKeywords).length})` : `Complete (${stats.complete})`}
              </button>
            ))}
          </div>

          {error && <div style={{ padding: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, color: '#ef4444', fontSize: 13, marginBottom: 20 }}>Error loading SEO data: {error}</div>}

          <div style={{ background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: C.grey, fontSize: 13 }}>Loading listings...</div>
            ) : rows.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: C.grey, fontSize: 13 }}>No listings match this filter.</div>
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
                      <tr key={listing.id} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ ...cell, maxWidth: 220 }}>
                          <div style={{ fontWeight: 500, color: C.white, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.name}</div>
                          {listing.slug && <div style={{ fontSize: 11, color: C.grey2 }}>/wedding-venues/{listing.slug}</div>}
                        </td>
                        <td style={cell}><StatusBadge status={listing.status} /></td>
                        <td style={{ ...cell, maxWidth: 200 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Tick ok={listing.hasSeoTitle} />
                            {listing.seo_title ? <span style={{ color: C.grey, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160, fontSize: 11 }} title={listing.seo_title}>{listing.seo_title}</span> : <span style={{ color: C.grey2, fontSize: 11 }}>Not set</span>}
                          </div>
                        </td>
                        <td style={{ ...cell, maxWidth: 180 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Tick ok={listing.hasSeoDesc} />
                            {listing.seo_description ? <span style={{ color: C.grey, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140, fontSize: 11 }} title={listing.seo_description}>{listing.seo_description.substring(0, 50)}{listing.seo_description.length > 50 ? '...' : ''}</span> : <span style={{ color: C.grey2, fontSize: 11 }}>Not set</span>}
                          </div>
                        </td>
                        <td style={cell}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Tick ok={listing.hasKeywords} />
                            {listing.hasKeywords ? <span style={{ color: C.grey, fontSize: 11 }}>{Array.isArray(listing.seo_keywords) ? `${listing.seo_keywords.length} keywords` : 'Set'}</span> : <span style={{ color: C.grey2, fontSize: 11 }}>Not set</span>}
                          </div>
                        </td>
                        <td style={{ ...cell, whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <RowBtn gold disabled={!!generating[listing.id] || bulkRunning} onClick={() => handleGenerate(listing)}>
                              {generating[listing.id] ? 'Generating...' : 'Generate'}
                            </RowBtn>
                            {listing.slug && (
                              <RowBtn onClick={() => window.dispatchEvent(new CustomEvent('lwd-nav', { detail: { tab: 'listing-studio', id: listing.id } }))}>
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
        </div>
      )}

      {seoTab === 'content-seo' && (() => {
        const hasSeoTitle  = p => !!p.seo_title;
        const hasMetaDesc  = p => !!p.meta_description;
        const hasOgImage   = p => !!p.og_image;
        const isComplete   = p => hasSeoTitle(p) && hasMetaDesc(p) && hasOgImage(p);
        const isMissing    = p => !isComplete(p);

        const filtered = contentPosts.filter(p => {
          const matchSearch = !contentSearch || (p.title || '').toLowerCase().includes(contentSearch.toLowerCase()) || (p.slug || '').toLowerCase().includes(contentSearch.toLowerCase());
          const matchFilter = contentFilter === 'all' ? true : contentFilter === 'complete' ? isComplete(p) : isMissing(p);
          return matchSearch && matchFilter;
        });

        const total    = contentPosts.length;
        const complete = contentPosts.filter(isComplete).length;
        const pct      = total ? Math.round((complete / total) * 100) : 0;

        const catComplete = contentCats.filter(c => c.seo_title && c.meta_description).length;

        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ fontFamily: GD, fontSize: 20, fontWeight: 400, color: C.off, margin: '0 0 4px' }}>Content & SEO</h2>
                <div style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>{total} articles tracked</div>
              </div>
              <button onClick={loadContentSeo} disabled={contentLoading} style={{ padding: '7px 16px', background: 'transparent', border: `1px solid ${C.border2}`, color: C.grey, borderRadius: 5, fontFamily: NU, fontSize: 12, cursor: contentLoading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                {contentLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {/* Summary tiles */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <StatTile label="Total Articles"     value={total}                              C={C} />
              <StatTile label="SEO Complete"       value={complete}                           C={C} gold />
              <StatTile label="Missing SEO Title"  value={contentPosts.filter(p => !hasSeoTitle(p)).length}  C={C} />
              <StatTile label="Missing Meta Desc"  value={contentPosts.filter(p => !hasMetaDesc(p)).length}  C={C} />
              <StatTile label="Missing OG Image"   value={contentPosts.filter(p => !hasOgImage(p)).length}   C={C} />
            </div>

            {/* Progress bar */}
            <div style={{ background: C.dark, borderRadius: 6, height: 8, overflow: 'hidden', maxWidth: 480, marginBottom: 8 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${G}, #e8c96c)`, borderRadius: 6, transition: 'width 0.6s ease' }} />
            </div>
            <div style={{ fontSize: 12, color: C.grey, fontFamily: NU, marginBottom: 24 }}>{pct}% of articles have complete SEO</div>

            {/* Category SEO summary */}
            {contentCats.length > 0 && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.grey2 }}>Categories</div>
                <div style={{ fontFamily: NU, fontSize: 13, color: C.white }}>{contentCats.length} total</div>
                <div style={{ fontFamily: NU, fontSize: 13, color: catComplete === contentCats.length ? '#22c55e' : G }}>{catComplete} with SEO metadata</div>
                <div style={{ fontFamily: NU, fontSize: 13, color: C.grey }}>{contentCats.length - catComplete} missing title or description</div>
              </div>
            )}

            {/* Filter bar */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                placeholder="Search articles..."
                value={contentSearch}
                onChange={e => setContentSearch(e.target.value)}
                style={{ padding: '7px 12px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 5, color: C.white, fontFamily: NU, fontSize: 12, outline: 'none', flex: '1 1 180px', maxWidth: 260 }}
              />
              <div style={{ display: 'flex', gap: 4 }}>
                {['all', 'missing', 'complete'].map(f => (
                  <button key={f} onClick={() => setContentFilter(f)} style={{ padding: '6px 14px', borderRadius: 4, border: contentFilter === f ? 'none' : `1px solid ${C.border}`, background: contentFilter === f ? G : 'transparent', color: contentFilter === f ? '#fff' : C.grey, fontFamily: NU, fontSize: 12, fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize' }}>
                    {f === 'all' ? `All (${total})` : f === 'missing' ? `Incomplete (${contentPosts.filter(isMissing).length})` : `Complete (${complete})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Articles table */}
            {contentLoading ? (
              <div style={{ padding: 48, textAlign: 'center', color: C.grey, fontSize: 13 }}>Loading articles...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: C.grey, fontSize: 13 }}>
                {total === 0 ? 'No magazine articles found.' : 'No articles match the current filter.'}
              </div>
            ) : (
              <div style={{ background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={colHeader}>Article</th>
                        <th style={colHeader}>Category</th>
                        <th style={colHeader}>Status</th>
                        <th style={colHeader}>SEO Title</th>
                        <th style={colHeader}>Meta Description</th>
                        <th style={colHeader}>OG Image</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(post => (
                        <tr key={post.id} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ ...cell, maxWidth: 240 }}>
                            <div style={{ fontWeight: 500, color: C.white, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={post.title}>{post.title || 'Untitled'}</div>
                            {post.slug && <div style={{ fontSize: 11, color: C.grey2 }}>/magazine/{post.slug}</div>}
                          </td>
                          <td style={cell}>
                            <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>{post.category_label || post.category_slug || '--'}</span>
                          </td>
                          <td style={cell}>
                            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: post.published ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.06)', color: post.published ? '#10b981' : C.grey, fontWeight: 600, fontFamily: NU, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {post.published ? 'Live' : 'Draft'}
                            </span>
                          </td>
                          <td style={{ ...cell, maxWidth: 200 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Tick ok={hasSeoTitle(post)} />
                              {post.seo_title
                                ? <span style={{ color: C.grey, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160, fontSize: 11 }} title={post.seo_title}>{post.seo_title}</span>
                                : <span style={{ color: C.grey2, fontSize: 11 }}>Not set</span>}
                            </div>
                          </td>
                          <td style={{ ...cell, maxWidth: 200 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Tick ok={hasMetaDesc(post)} />
                              {post.meta_description
                                ? <span style={{ color: C.grey, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160, fontSize: 11 }} title={post.meta_description}>{post.meta_description.substring(0, 50)}{post.meta_description.length > 50 ? '...' : ''}</span>
                                : <span style={{ color: C.grey2, fontSize: 11 }}>Not set</span>}
                            </div>
                          </td>
                          <td style={cell}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Tick ok={hasOgImage(post)} />
                              {post.og_image
                                ? <img src={post.og_image} alt="" style={{ width: 36, height: 24, objectFit: 'cover', borderRadius: 2 }} />
                                : <span style={{ color: C.grey2, fontSize: 11 }}>Not set</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ═══════════════════════ VISIBILITY INTELLIGENCE ═══════════════════════ */}

      {/* ── Website Audits (rebuilt) ──────────────────────────────────────────── */}
      {seoTab === 'website-audits' && (
        <div>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
            <div>
              <h2 style={{ fontFamily: GD, fontSize: 20, fontWeight: 400, color: C.off, margin: '0 0 4px' }}>Visibility Intelligence</h2>
              <div style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>
                {filteredGroups.length} {filteredGroups.length === 1 ? 'domain' : 'domains'} tracked
                {domainGroups.length !== filteredGroups.length ? ` (${domainGroups.length} total)` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowUrlModal(true)} style={{ padding: '7px 16px', background: 'transparent', border: `1px solid ${G}`, color: G, borderRadius: 5, fontFamily: NU, fontSize: 12, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
                + Add Website URL
              </button>
              <button onClick={loadDomainAudits} disabled={auditsLoading} style={{ padding: '7px 16px', background: 'transparent', border: `1px solid ${C.border2}`, color: C.grey, borderRadius: 5, fontFamily: NU, fontSize: 12, cursor: auditsLoading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                {auditsLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Filter bar */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              placeholder="Search domain..."
              value={auditSearch}
              onChange={e => setAuditSearch(e.target.value)}
              style={{ ...filterInput, flex: '1 1 180px', maxWidth: 240 }}
            />
            <select value={auditTypeFilter} onChange={e => setAuditTypeFilter(e.target.value)} style={{ ...filterInput, cursor: 'pointer' }}>
              <option value="all">All Types</option>
              <option value="vendor">Vendor</option>
              <option value="prospect">Prospect</option>
            </select>
            <select value={auditOppFilter} onChange={e => setAuditOppFilter(e.target.value)} style={{ ...filterInput, cursor: 'pointer' }}>
              <option value="all">All Opportunities</option>
              <option value="High">High Opportunity</option>
              <option value="Medium">Medium Opportunity</option>
              <option value="Low">Low Opportunity</option>
            </select>
            <select value={auditSort} onChange={e => setAuditSort(e.target.value)} style={{ ...filterInput, cursor: 'pointer' }}>
              <option value="date">Latest First</option>
              <option value="score-asc">Score: Low to High</option>
              <option value="score-desc">Score: High to Low</option>
              <option value="opportunity">Opportunity: High First</option>
            </select>
          </div>

          {/* Table or empty state */}
          {auditsLoading ? (
            <div style={{ padding: 48, textAlign: 'center', color: C.grey, fontSize: 13 }}>Loading audits...</div>
          ) : filteredGroups.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: C.grey, fontSize: 13 }}>
              {domainGroups.length === 0
                ? 'No audits yet. Add a website URL or run an audit from the Sales Pipeline.'
                : 'No domains match the current filters.'}
            </div>
          ) : (
            <div style={{ background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={colHeader}>Domain</th>
                      <th style={colHeader}>Type</th>
                      <th style={colHeader}>SEO Score</th>
                      <th style={colHeader}>Opportunity</th>
                      <th style={colHeader}>Trend</th>
                      <th style={colHeader}>Enquiry</th>
                      <th style={colHeader}>Issues</th>
                      <th style={colHeader}>Last Audit</th>
                      <th style={colHeader}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGroups.map(group => {
                      const a         = group.latest;
                      const sc        = scoreColor(a.score);
                      const trend     = computeTrend(a.score, group.history);
                      const enquiry   = scoreEnquiryExperience(a.findings);
                      const opp       = computeOpportunityScore(a.score, a.findings);
                      const severity  = getIssueSeverityCounts(a.findings);
                      const isReaudit = reauditingUrl === a.url;

                      return (
                        <tr
                          key={group.domain}
                          onClick={() => openGroup(group)}
                          style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          {/* Domain */}
                          <td style={{ ...cell, maxWidth: 200 }}>
                            <div style={{ fontFamily: NU, fontSize: 12, color: G, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.url}>
                              {group.domain}
                            </div>
                            {group.history.length > 0 && (
                              <div style={{ fontSize: 10, color: C.grey2, marginTop: 2 }}>{group.history.length + 1} runs</div>
                            )}
                          </td>

                          {/* Type */}
                          <td style={cell}>
                            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: a.prospect_id ? 'rgba(99,102,241,0.12)' : 'rgba(16,185,129,0.1)', color: a.prospect_id ? '#6366f1' : '#10b981', fontWeight: 600, fontFamily: NU, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {a.prospect_id ? 'Prospect' : 'Vendor'}
                            </span>
                          </td>

                          {/* SEO Score */}
                          <td style={cell}>
                            <span style={{ fontFamily: GD, fontSize: 18, color: sc, fontWeight: 600 }}>{a.score}</span>
                            <span style={{ fontFamily: NU, fontSize: 10, color: sc, marginLeft: 4 }}>{scoreLabel(a.score)}</span>
                          </td>

                          {/* Opportunity */}
                          <td style={cell}><OpportunityBadge value={opp} /></td>

                          {/* Trend */}
                          <td style={cell}><TrendCell trend={trend} /></td>

                          {/* Enquiry Experience */}
                          <td style={cell}><EnquiryBadge label={enquiry.label} /></td>

                          {/* Issues severity counts */}
                          <td style={cell}><SeverityCounts counts={severity} /></td>

                          {/* Last Audit (relative time with tooltip) */}
                          <td style={{ ...cell, color: C.grey, fontSize: 11, whiteSpace: 'nowrap' }} title={fmtDate(a.created_at)}>
                            {relativeTime(a.created_at)}
                          </td>

                          {/* Actions */}
                          <td style={{ ...cell, whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                            <RowBtn disabled={isReaudit} onClick={() => handleReaudit(a)}>
                              {isReaudit ? 'Running...' : 'Re-audit'}
                            </RowBtn>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Authority Scores ─────────────────────────────────────────────────── */}
      {seoTab === 'authority-scores' && (
        <div>
          <h2 style={{ fontFamily: GD, fontSize: 20, fontWeight: 400, color: C.off, margin: '0 0 20px' }}>Authority Scores</h2>
          {auditsLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: C.grey, fontSize: 13 }}>Loading...</div>
          ) : (() => {
            const byListing = {};
            domainGroups.filter(g => g.latest.listing_id).forEach(g => {
              byListing[g.latest.listing_id] = g.latest;
            });
            const scoreRows = Object.values(byListing).sort((a, b) => a.score - b.score);
            if (scoreRows.length === 0) return <div style={{ padding: 40, textAlign: 'center', color: C.grey, fontSize: 13 }}>No vendor audits yet.</div>;
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                {scoreRows.map(a => (
                  <div key={a.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '20px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <AuditScoreRing score={a.score} size={90} strokeWidth={8} />
                    <div style={{ fontFamily: NU, fontSize: 11, color: C.grey, textAlign: 'center', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.url}>{a.url.replace(/^https?:\/\//, '')}</div>
                    <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2 }}>{fmtDate(a.created_at)}</div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── AI Visibility ────────────────────────────────────────────────────── */}
      {seoTab === 'ai-visibility' && (
        <div>
          <h2 style={{ fontFamily: GD, fontSize: 20, fontWeight: 400, color: C.off, margin: '0 0 20px' }}>AI Visibility</h2>
          {auditsLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: C.grey, fontSize: 13 }}>Loading...</div>
          ) : (() => {
            const checked = domainGroups.filter(g => g.latest.ai_visible !== null).map(g => g.latest);
            if (checked.length === 0) return <div style={{ padding: 40, textAlign: 'center', color: C.grey, fontSize: 13 }}>No AI visibility checks run yet. Open a domain in Website Audits and click "Check AI Presence".</div>;
            return (
              <div style={{ background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={colHeader}>URL</th><th style={colHeader}>AI Status</th><th style={colHeader}>Note</th><th style={colHeader}>Date</th></tr></thead>
                  <tbody>
                    {checked.map(a => (
                      <tr key={a.id} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ ...cell, maxWidth: 220 }}><a href={a.url} target="_blank" rel="noreferrer" style={{ color: G, fontSize: 11 }} title={a.url}>{a.url.replace(/^https?:\/\//, '')}</a></td>
                        <td style={cell}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.ai_visible ? '#22c55e' : '#6b7280', flexShrink: 0 }} />
                            <span style={{ fontFamily: NU, fontSize: 11, fontWeight: 600, color: a.ai_visible ? '#22c55e' : '#6b7280' }}>{a.ai_visible ? 'KNOWN' : 'UNKNOWN'}</span>
                          </div>
                        </td>
                        <td style={{ ...cell, color: C.grey, fontSize: 11, maxWidth: 280 }}>{a.ai_visible_note || '--'}</td>
                        <td style={{ ...cell, color: C.grey, fontSize: 11 }}>{fmtDate(a.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Prospect Outreach ────────────────────────────────────────────────── */}
      {seoTab === 'prospect-outreach' && (
        <div>
          <h2 style={{ fontFamily: GD, fontSize: 20, fontWeight: 400, color: C.off, margin: '0 0 20px' }}>Prospect Outreach</h2>
          {auditsLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: C.grey, fontSize: 13 }}>Loading...</div>
          ) : (() => {
            const prospectGroups = domainGroups.filter(g => g.latest.prospect_id);
            if (prospectGroups.length === 0) return <div style={{ padding: 40, textAlign: 'center', color: C.grey, fontSize: 13 }}>No prospect audits yet. Open a prospect in the Sales Pipeline and click "Audit Site" to get started.</div>;
            return (
              <div style={{ background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={colHeader}>URL</th><th style={colHeader}>Score</th><th style={colHeader}>Opportunity</th><th style={colHeader}>Issues</th><th style={colHeader}>Date</th><th style={colHeader}>Open Prospect</th></tr></thead>
                  <tbody>
                    {prospectGroups.map(group => {
                      const a  = group.latest;
                      const sc = scoreColor(a.score);
                      const sv = getIssueSeverityCounts(a.findings);
                      const op = computeOpportunityScore(a.score, a.findings);
                      return (
                        <tr key={group.domain} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ ...cell, maxWidth: 200 }}><a href={a.url} target="_blank" rel="noreferrer" style={{ color: G, fontSize: 11 }} title={a.url}>{a.url.replace(/^https?:\/\//, '')}</a></td>
                          <td style={cell}><span style={{ fontFamily: GD, fontSize: 18, color: sc, fontWeight: 600 }}>{a.score}</span><span style={{ fontFamily: NU, fontSize: 10, color: sc, marginLeft: 4 }}>{scoreLabel(a.score)}</span></td>
                          <td style={cell}><OpportunityBadge value={op} /></td>
                          <td style={cell}><SeverityCounts counts={sv} /></td>
                          <td style={{ ...cell, color: C.grey, fontSize: 11 }}>{fmtDate(a.created_at)}</td>
                          <td style={cell}><RowBtn gold onClick={() => window.dispatchEvent(new CustomEvent('lwd-nav', { detail: { tab: 'sales-pipeline', prospectId: a.prospect_id } }))}>Open</RowBtn></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      {/* ═══════════════════════ CONNECTED DATA ════════════════════════════════ */}

      {seoTab === 'connections' && (
        <div>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontFamily: GD, fontSize: 20, fontWeight: 400, color: C.off, margin: '0 0 6px' }}>Connections</h2>
            <p style={{ fontFamily: NU, fontSize: 13, color: C.grey, margin: 0, lineHeight: 1.6 }}>
              Connect your Google accounts via OAuth to unlock Tier 2 intelligence: real engagement data, keyword rankings, and search performance. No API keys or passwords required.
            </p>
          </div>

          {connError && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, fontFamily: NU, fontSize: 12, color: '#ef4444', maxWidth: 720 }}>
              {connError}
              <button onClick={() => setConnError(null)} style={{ float: 'right', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14 }}>×</button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>
            {connectionsLoading ? (
              <div style={{ fontFamily: NU, fontSize: 12, color: C.grey, padding: '20px 0' }}>Loading connection status...</div>
            ) : (
              <>
                <ConnectionCard
                  name="Google Analytics"
                  description="Unlock engagement signals including bounce rate, session duration, and pages per session for each audited domain. Surfaced directly in the domain detail panel."
                  icon={<GoogleAnalyticsIcon size={40} />}
                  integration="Engagement & Bounce Rate data in Website Audits"
                  conn={connections.analytics}
                  onConnect={() => handleConnect('analytics')}
                  onDisconnect={() => handleDisconnect('analytics')}
                  connecting={connecting === 'analytics'}
                  C={C}
                />
                <ConnectionCard
                  name="Google Search Console"
                  description="Unlock keyword visibility data including search rankings, impressions, click-through rates, and position trends for each audited domain."
                  icon={<GoogleSearchConsoleIcon size={40} />}
                  integration="Keyword Visibility & Rankings in Website Audits"
                  conn={connections.search_console}
                  onConnect={() => handleConnect('search_console')}
                  onDisconnect={() => handleDisconnect('search_console')}
                  connecting={connecting === 'search_console'}
                  C={C}
                />
              </>
            )}
          </div>

          <div style={{ marginTop: 32, padding: '16px 20px', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 6, maxWidth: 720 }}>
            <div style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, color: G, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>How connections work</div>
            <ul style={{ fontFamily: NU, fontSize: 12, color: C.grey, margin: 0, paddingLeft: 18, lineHeight: 2 }}>
              <li>A Google consent screen opens in a popup. No passwords are stored.</li>
              <li>Only read-only access is requested. We never modify your Google account data.</li>
              <li>Connected data appears automatically in the Website Audits domain detail panel.</li>
              <li>You can disconnect at any time from this page or from your Google account settings.</li>
            </ul>
          </div>
        </div>
      )}

      {/* ── Toast ───────────────────────────────────────────────────────────── */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* ── URL to Lead Modal ────────────────────────────────────────────────── */}
      {showUrlModal && (
        <UrlToLeadModal
          C={C}
          onClose={() => setShowUrlModal(false)}
          onSaved={() => { loadDomainAudits(); setShowUrlModal(false); }}
        />
      )}

      {/* ── Visibility Detail Panel ──────────────────────────────────────────── */}
      {panelOpen && selectedGroup && (
        <VisibilityDetailPanel
          key={selectedGroup.domain}
          domainGroup={selectedGroup}
          connections={connections}
          onClose={() => { setPanelOpen(false); setSelectedGroup(null); }}
          onReaudit={handleReaudit}
          C={C}
        />
      )}

      {/* ── Property Selector Modal ──────────────────────────────────────────── */}
      {propertyModal && (
        <PropertySelectorModal
          service={propertyModal.service}
          properties={propertyModal.properties}
          onComplete={async () => {
            setPropertyModal(null);
            await loadConnections();
          }}
          onClose={() => setPropertyModal(null)}
        />
      )}

      <style>{`@keyframes connSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
