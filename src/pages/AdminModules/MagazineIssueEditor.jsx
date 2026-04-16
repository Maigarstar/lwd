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
import IssueDetailsForm from './components/IssueDetailsForm';
import PdfUploader from './components/PdfUploader';
import PageGrid from './components/PageGrid';

const GOLD = '#C9A84C';
const GD   = "var(--font-heading-primary, 'Cormorant Garamond', Georgia, serif)";
const NU   = "var(--font-body, 'Nunito Sans', sans-serif)";

const TABS = [
  { key: 'details', label: 'Details' },
  { key: 'pages',   label: 'Pages'   },
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
      </div>
    </div>
  );
}
