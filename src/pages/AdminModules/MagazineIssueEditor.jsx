/**
 * MagazineIssueEditor.jsx
 * Edit a single magazine issue: metadata + pages.
 * Two tabs: Details | Pages
 *
 * Used by MagazineIssuesModule when an issue is selected for editing.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchIssueById,
  updateIssue,
  publishIssue,
  unpublishIssue,
  archiveIssue,
  deleteIssue,
  bumpRenderVersion,
  uploadIssueCover,
} from '../../services/magazineIssuesService';
import { deleteAllPages } from '../../services/magazinePageService';
import { processPdf } from '../../services/pdfProcessorService';
import { supabase } from '../../lib/supabaseClient';
import IssueDetailsForm from './components/IssueDetailsForm';
import PdfUploader from './components/PdfUploader';
import PageGrid from './components/PageGrid';

const GOLD = '#C9A84C';
const GD   = "var(--font-heading-primary, 'Cormorant Garamond', Georgia, serif)";
const NU   = "var(--font-body, 'Nunito Sans', sans-serif)";

const TABS = [
  { key: 'details',   label: 'Details'   },
  { key: 'pages',     label: 'Pages'     },
  { key: 'analytics', label: 'Analytics' },
];

const STATUS_CONFIG = {
  draft:     { label: 'Draft',     color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.08)'  },
  published: { label: 'Published', color: '#34d399',               bg: 'rgba(52,211,153,0.12)'  },
  archived:  { label: 'Archived',  color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.05)' },
};

const PROC_CONFIG = {
  idle:       { label: 'Not processed', color: 'rgba(255,255,255,0.4)' },
  processing: { label: 'Processing…',   color: GOLD                    },
  ready:      { label: 'Ready',         color: '#34d399'               },
  failed:     { label: 'Failed',        color: '#f87171'               },
};

function fmt(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── IssueAnalytics ────────────────────────────────────────────────────────────
// Reads from magazine_analytics for a single issue and renders:
//   • KPI tiles (views, sessions, page turns, downloads)
//   • Page popularity bar chart
//   • Device + reader mode split
//   • Recent 20 events log
function IssueAnalytics({ issueId, issue }) {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!issueId) return;
    setLoading(true);
    supabase
      .from('magazine_analytics')
      .select('*')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: false })
      .limit(2000)          // enough for any realistic issue
      .then(({ data }) => {
        setRows(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [issueId]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: NU, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
        Loading analytics…
      </div>
    );
  }

  // ── Aggregate ─────────────────────────────────────────────────────────────
  const views      = rows.filter(r => r.event_type === 'view');
  const pageTurns  = rows.filter(r => r.event_type === 'page_turn');
  const downloads  = rows.filter(r => r.event_type === 'download');
  const dwells     = rows.filter(r => r.event_type === 'dwell');

  const uniqueSessions = new Set(rows.map(r => r.session_id).filter(Boolean)).size;

  // Page popularity: count page_turns per page_number
  const pageHits = {};
  pageTurns.forEach(r => {
    if (r.page_number) pageHits[r.page_number] = (pageHits[r.page_number] || 0) + 1;
  });
  const topPages = Object.entries(pageHits)
    .map(([p, c]) => ({ page: Number(p), count: c }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
  const maxPageHits = topPages[0]?.count || 1;

  // Device breakdown (from view events)
  const deviceMap = {};
  views.forEach(r => { if (r.device_type) deviceMap[r.device_type] = (deviceMap[r.device_type] || 0) + 1; });
  const deviceTotal = Object.values(deviceMap).reduce((s, v) => s + v, 0) || 1;

  // Avg dwell time per page
  const avgDwell = dwells.length
    ? Math.round(dwells.reduce((s, r) => s + (r.duration_ms || 0), 0) / dwells.length / 1000)
    : 0;

  // KPI tile component
  const Tile = ({ label, value, sub }) => (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 6,
      padding: '18px 20px',
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontFamily: GD, fontSize: 32, fontWeight: 300, color: '#fff', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontFamily: NU, fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>{sub}</div>}
    </div>
  );

  // No data yet
  if (rows.length === 0) {
    return (
      <div style={{ padding: '60px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 32, opacity: 0.15, marginBottom: 16 }}>◈</div>
        <div style={{ fontFamily: NU, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
          No analytics data yet.
        </div>
        <div style={{ fontFamily: NU, fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>
          Events are recorded when readers open this issue at /publications/{issue?.slug}.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 900 }}>

      {/* ── KPI tiles ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <Tile label="Views"         value={views.length}     sub={`${uniqueSessions} unique session${uniqueSessions !== 1 ? 's' : ''}`} />
        <Tile label="Page Turns"    value={pageTurns.length} sub={pageTurns.length ? `avg ${Math.round(pageTurns.length / Math.max(views.length, 1))} per visit` : null} />
        <Tile label="Downloads"     value={downloads.length} />
        <Tile label="Avg Dwell"     value={avgDwell ? `${avgDwell}s` : '—'} sub="per page" />
      </div>

      {/* ── Page popularity ── */}
      {topPages.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>
            Page Popularity (top {topPages.length} pages by turn count)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {topPages.map(({ page, count }) => (
              <div key={page} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontFamily: NU, fontSize: 10, color: 'rgba(255,255,255,0.4)', width: 42, flexShrink: 0, textAlign: 'right' }}>
                  p.{page}
                </div>
                <div style={{ flex: 1, height: 18, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${(count / maxPageHits) * 100}%`,
                    background: `linear-gradient(to right, ${GOLD}, rgba(201,168,76,0.5))`,
                    borderRadius: 2,
                    transition: 'width 0.4s ease',
                  }} />
                </div>
                <div style={{ fontFamily: NU, fontSize: 10, color: 'rgba(255,255,255,0.5)', width: 28, flexShrink: 0 }}>
                  {count}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Device + mode split ── */}
      {Object.keys(deviceMap).length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>
            Device Breakdown
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {Object.entries(deviceMap).map(([device, count]) => (
              <div key={device} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 6, padding: '12px 16px', minWidth: 100,
              }}>
                <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
                  {device}
                </div>
                <div style={{ fontFamily: GD, fontSize: 24, color: '#fff', fontWeight: 300 }}>{count}</div>
                <div style={{ fontFamily: NU, fontSize: 10, color: GOLD, marginTop: 4 }}>
                  {Math.round((count / deviceTotal) * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent events log ── */}
      <div>
        <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>
          Recent Events (last 20)
        </div>
        <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, overflow: 'hidden' }}>
          {rows.slice(0, 20).map((r, i) => {
            const typeColor = {
              view:       '#60a5fa',
              page_turn:  GOLD,
              download:   '#34d399',
              dwell:      'rgba(255,255,255,0.5)',
            }[r.event_type] || 'rgba(255,255,255,0.4)';
            return (
              <div key={r.id || i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '8px 14px',
                borderBottom: i < Math.min(rows.length, 20) - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
              }}>
                {/* Event type */}
                <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: typeColor, width: 70, flexShrink: 0 }}>
                  {r.event_type}
                </span>
                {/* Page */}
                <span style={{ fontFamily: NU, fontSize: 10, color: 'rgba(255,255,255,0.35)', width: 40, flexShrink: 0 }}>
                  {r.page_number ? `p.${r.page_number}` : '—'}
                </span>
                {/* Device */}
                <span style={{ fontFamily: NU, fontSize: 10, color: 'rgba(255,255,255,0.3)', width: 60, flexShrink: 0 }}>
                  {r.device_type || '—'}
                </span>
                {/* Mode */}
                <span style={{ fontFamily: NU, fontSize: 10, color: 'rgba(255,255,255,0.25)', flex: 1 }}>
                  {r.reader_mode || '—'}{r.duration_ms ? ` · ${Math.round(r.duration_ms / 1000)}s` : ''}
                </span>
                {/* Time */}
                <span style={{ fontFamily: NU, fontSize: 10, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
                  {r.created_at ? new Date(r.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span style={{
      fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
      textTransform: 'uppercase', color: s.color, background: s.bg,
      borderRadius: 10, padding: '3px 9px', whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
}

function ActionBtn({ children, onClick, danger, gold, disabled }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
        textTransform: 'uppercase', border: 'none', borderRadius: 3,
        padding: '7px 14px', cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.45 : 1, transition: 'all 0.15s',
        background: gold
          ? hov ? '#b8954d' : GOLD
          : danger
            ? hov ? 'rgba(248,113,113,0.25)' : 'rgba(248,113,113,0.12)'
            : hov ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
        color: gold ? '#1a1806' : danger ? '#f87171' : 'rgba(255,255,255,0.7)',
      }}
    >
      {children}
    </button>
  );
}

/**
 * @param {Object}   props
 * @param {string}   props.issueId     - ID of the issue to edit
 * @param {function} props.onBack      - Navigate back to list
 * @param {Object}   [props.C]         - Color config (unused, kept for pattern consistency)
 */
export default function MagazineIssueEditor({ issueId, onBack, C }) {
  const [issue,      setIssue]      = useState(null);
  const [formData,   setFormData]   = useState({});
  const [tab,        setTab]        = useState('details');
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [saveMsg,    setSaveMsg]    = useState('');
  const [error,      setError]      = useState('');
  const [coverFile,  setCoverFile]  = useState(null);
  const [coverPrev,  setCoverPrev]  = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);
  const coverInputRef = useRef(null);

  // ── Load issue ──────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: err } = await fetchIssueById(issueId);
    if (err) { setError(err.message); setLoading(false); return; }
    setIssue(data);
    setFormData(data);
    setLoading(false);
  }, [issueId]);

  useEffect(() => { load(); }, [load]);

  // ── Field change handler ────────────────────────────────────────────────────
  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveMsg('');
    setError('');

    const { data, error: err } = await updateIssue(issueId, formData);
    if (err) {
      setError(err.message);
    } else {
      setIssue(data);
      setFormData(data);
      setSaveMsg('Saved');
      setTimeout(() => setSaveMsg(''), 2500);
    }
    setSaving(false);
  }, [issueId, formData]);

  // ── Cover image ─────────────────────────────────────────────────────────────
  const handleCoverChange = useCallback((e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setCoverFile(f);
    setCoverPrev(URL.createObjectURL(f));
  }, []);

  const handleCoverUpload = useCallback(async () => {
    if (!coverFile || !issueId) return;
    setUploadingCover(true);
    const { publicUrl, error: err } = await uploadIssueCover(issueId, coverFile);
    if (err) {
      setError(`Cover upload failed: ${err.message}`);
    } else {
      setFormData(prev => ({ ...prev, cover_image: publicUrl }));
      setIssue(prev => ({ ...prev, cover_image: publicUrl }));
      setCoverFile(null);
      setSaveMsg('Cover uploaded');
      setTimeout(() => setSaveMsg(''), 2500);
    }
    setUploadingCover(false);
  }, [coverFile, issueId]);

  // ── PDF reprocess ───────────────────────────────────────────────────────────
  const handleReprocess = useCallback(async () => {
    if (!issue?.pdf_url || reprocessing) return;
    if (!window.confirm('Reprocess the PDF? All existing pages will be replaced.')) return;

    setReprocessing(true);
    setTab('pages');

    // Bump render version
    const newVersion = (issue.render_version || 1) + 1;
    await bumpRenderVersion(issueId, issue.render_version || 1);
    await deleteAllPages(issueId);

    // Fetch the PDF file from storage URL
    const resp = await fetch(issue.pdf_url);
    const blob = await resp.blob();
    const file = new File([blob], 'original.pdf', { type: 'application/pdf' });

    await processPdf({
      issueId,
      renderVersion: newVersion,
      file,
      onProgress: () => {},
    });

    await load();
    setReprocessing(false);
  }, [issue, issueId, reprocessing, load]);

  // ── Status actions ──────────────────────────────────────────────────────────
  const handlePublish = useCallback(async () => {
    if (issue?.processing_state !== 'ready') {
      setError('Cannot publish — pages not processed yet.');
      return;
    }
    setSaving(true);
    const { data, error: err } = await publishIssue(issueId);
    if (err) setError(err.message);
    else { setIssue(data); setFormData(data); }
    setSaving(false);
  }, [issue, issueId]);

  const handleUnpublish = useCallback(async () => {
    setSaving(true);
    const { data, error: err } = await unpublishIssue(issueId);
    if (err) setError(err.message);
    else { setIssue(data); setFormData(data); }
    setSaving(false);
  }, [issueId]);

  const handleArchive = useCallback(async () => {
    if (!window.confirm('Archive this issue? It will be hidden from the public magazine.')) return;
    setSaving(true);
    const { data, error: err } = await archiveIssue(issueId);
    if (err) setError(err.message);
    else { setIssue(data); setFormData(data); }
    setSaving(false);
  }, [issueId]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm(`Delete "${issue?.title || 'this issue'}"? This cannot be undone.`)) return;
    setSaving(true);
    const { error: err } = await deleteIssue(issueId);
    if (err) { setError(err.message); setSaving(false); return; }
    onBack?.();
  }, [issue, issueId, onBack]);

  // ── PDF complete callback ───────────────────────────────────────────────────
  const handlePdfComplete = useCallback(async ({ pageCount }) => {
    await load();
  }, [load]);

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontFamily: NU, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Loading issue…</div>
      </div>
    );
  }

  if (error && !issue) {
    return (
      <div style={{ padding: 32 }}>
        <div style={{ fontFamily: NU, fontSize: 12, color: '#f87171', marginBottom: 12 }}>⚠ {error}</div>
        <ActionBtn onClick={onBack}>← Back</ActionBtn>
      </div>
    );
  }

  const procCfg = PROC_CONFIG[issue?.processing_state] || PROC_CONFIG.idle;
  const isPublished = issue?.status === 'published';

  return (
    <div style={{ minHeight: '100%', background: '#0e0e0e' }}>

      {/* ── Top bar ── */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
      }}>
        {/* Left: back + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={onBack}
            style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
              fontFamily: NU, fontSize: 12, cursor: 'pointer', padding: 0,
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            ← Issues
          </button>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.12)' }} />
          <div>
            <div style={{ fontFamily: GD, fontSize: 20, color: '#fff', lineHeight: 1.2 }}>
              {issue?.title || 'Untitled Issue'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
              <StatusPill status={issue?.status} />
              <span style={{ fontFamily: NU, fontSize: 10, color: procCfg.color }}>
                {procCfg.label}
              </span>
              {issue?.page_count > 0 && (
                <span style={{ fontFamily: NU, fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                  · {issue.page_count} pages
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {saveMsg && (
            <span style={{ fontFamily: NU, fontSize: 11, color: '#34d399' }}>{saveMsg}</span>
          )}
          {error && (
            <span style={{ fontFamily: NU, fontSize: 11, color: '#f87171' }}>⚠ {error}</span>
          )}
          <ActionBtn onClick={handleSave} disabled={saving} gold>
            {saving ? 'Saving…' : '✦ Save'}
          </ActionBtn>
          {!isPublished && (
            <ActionBtn onClick={handlePublish} disabled={saving || issue?.processing_state !== 'ready'}>
              Publish
            </ActionBtn>
          )}
          {isPublished && (
            <ActionBtn onClick={handleUnpublish} disabled={saving}>
              Unpublish
            </ActionBtn>
          )}
          {issue?.status !== 'archived' && (
            <ActionBtn onClick={handleArchive} disabled={saving} danger>
              Archive
            </ActionBtn>
          )}
          <ActionBtn onClick={handleDelete} disabled={saving} danger>
            Delete
          </ActionBtn>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{
        display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '0 24px',
      }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              background: 'none', border: 'none', borderBottom: `2px solid ${tab === t.key ? GOLD : 'transparent'}`,
              color: tab === t.key ? GOLD : 'rgba(255,255,255,0.5)',
              fontFamily: NU, fontSize: 12, fontWeight: 600,
              padding: '12px 16px 10px', cursor: 'pointer',
              letterSpacing: '0.04em', textTransform: 'uppercase',
              transition: 'color 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div style={{ padding: '24px', maxWidth: 900 }}>

        {/* ─ Details tab ─ */}
        {tab === 'details' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'start' }}>

            {/* Left: form */}
            <div>
              <IssueDetailsForm
                data={formData}
                onChange={handleChange}
                slugLocked={!!issue?.slug_locked}
                saving={saving}
              />
            </div>

            {/* Right: cover + PDF */}
            <div>

              {/* Cover image */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6, padding: 16, marginBottom: 20,
              }}>
                <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD, marginBottom: 12 }}>
                  Cover Image
                </div>

                {/* Preview */}
                <div
                  onClick={() => coverInputRef.current?.click()}
                  style={{
                    width: '100%', paddingBottom: '133%', position: 'relative',
                    background: '#1a1a18', borderRadius: 4, overflow: 'hidden',
                    cursor: 'pointer', marginBottom: 10,
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {(coverPrev || formData.cover_image) ? (
                    <img
                      src={coverPrev || formData.cover_image}
                      alt="Cover"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)',
                    }}>
                      <div style={{ fontSize: 32, marginBottom: 6 }}>◈</div>
                      <div style={{ fontFamily: NU, fontSize: 11 }}>No cover yet</div>
                    </div>
                  )}
                </div>

                <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverChange} />

                {coverFile ? (
                  <button
                    onClick={handleCoverUpload}
                    disabled={uploadingCover}
                    style={{
                      width: '100%', background: GOLD, border: 'none', borderRadius: 4,
                      color: '#1a1806', fontFamily: NU, fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      padding: '8px 0', cursor: 'pointer',
                    }}
                  >
                    {uploadingCover ? 'Uploading…' : '✦ Upload Cover'}
                  </button>
                ) : (
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    style={{
                      width: '100%', background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4,
                      color: 'rgba(255,255,255,0.5)', fontFamily: NU, fontSize: 10,
                      padding: '8px 0', cursor: 'pointer',
                    }}
                  >
                    {formData.cover_image ? 'Replace Cover' : 'Upload Cover'}
                  </button>
                )}
              </div>

              {/* PDF uploader */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6, padding: 16, marginBottom: 20,
              }}>
                <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD, marginBottom: 12 }}>
                  PDF Upload
                </div>
                <PdfUploader
                  issueId={issueId}
                  renderVersion={issue?.render_version || 1}
                  existingPdfUrl={issue?.pdf_url}
                  onComplete={handlePdfComplete}
                  disabled={issue?.processing_state === 'processing'}
                />

                {/* Reprocess button (if PDF already uploaded) */}
                {issue?.pdf_url && issue?.processing_state === 'ready' && (
                  <button
                    onClick={handleReprocess}
                    disabled={reprocessing}
                    style={{
                      marginTop: 10, width: '100%',
                      background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 4, color: 'rgba(255,255,255,0.4)',
                      fontFamily: NU, fontSize: 10, padding: '7px 0', cursor: 'pointer',
                    }}
                  >
                    {reprocessing ? '⟳ Reprocessing…' : '↻ Reprocess PDF'}
                  </button>
                )}
              </div>

              {/* Issue stats */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6, padding: 16,
              }}>
                <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD, marginBottom: 12 }}>
                  Info
                </div>
                {[
                  ['Created',    fmt(issue?.created_at)],
                  ['Updated',    fmt(issue?.updated_at)],
                  ['Published',  fmt(issue?.published_at)],
                  ['Pages',      issue?.page_count || 0],
                  ['Views',      issue?.view_count || 0],
                  ['Version',    `v${issue?.render_version || 1}`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                    <span style={{ fontFamily: NU, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{k}</span>
                    <span style={{ fontFamily: NU, fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* ─ Pages tab ─ */}
        {tab === 'pages' && (
          <PageGrid
            issueId={issueId}
            issue={issue}
            onPageCountChange={(count) => {
              setIssue(prev => prev ? { ...prev, page_count: count } : prev);
            }}
          />
        )}

        {/* ─ Analytics tab ─ */}
        {tab === 'analytics' && (
          <IssueAnalytics issueId={issueId} issue={issue} />
        )}
      </div>
    </div>
  );
}
