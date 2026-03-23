// ─── src/pages/AdminModules/SiteContentModule.jsx ────────────────────────────
// Admin CMS — manage legal & support pages
// Two views: List (all pages) ↔ Editor (full TipTap editor + AI panel)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';
import RichTextEditor from '../../components/editor/RichTextEditor';
import AIEditorPanel from '../../components/editor/AIEditorPanel';
import {
  fetchAllPages,
  fetchPageDraft,
  saveDraft,
  saveDraftFull,
  publishPage,
  fetchVersions,
  revertToVersion,
  revertToLastPublished,
} from '../../services/cmsService';

const NU = 'var(--font-body)';
const GD = 'var(--font-heading-primary)';

// ── Page type label ────────────────────────────────────────────────────────────
const PAGE_TYPE_LABELS = {
  privacy:         { label: 'Privacy Policy',         type: 'Legal' },
  terms:           { label: 'Terms of Use',            type: 'Legal' },
  cookies:         { label: 'Cookie Policy',           type: 'Legal' },
  'reviews-policy':{ label: 'Reviews Policy',          type: 'Legal' },
  support:         { label: 'Support & Help Centre',   type: 'Support' },
};

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const published = status === 'published';
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '3px 9px',
      borderRadius: 20,
      fontSize: 10,
      fontFamily: NU,
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      background: published ? 'rgba(34,197,94,0.1)' : 'rgba(201,168,76,0.1)',
      border: `1px solid ${published ? 'rgba(34,197,94,0.25)' : 'rgba(201,168,76,0.25)'}`,
      color: published ? '#4ade80' : '#C9A84C',
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        background: published ? '#4ade80' : '#C9A84C',
        flexShrink: 0,
      }} />
      {published ? 'Published' : 'Draft'}
    </span>
  );
}

// ── Toast notification ────────────────────────────────────────────────────────
function Toast({ message, type = 'success', onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed',
      bottom: 32,
      right: 32,
      padding: '12px 20px',
      borderRadius: 8,
      background: type === 'error' ? '#1a0a0a' : '#0a1a0a',
      border: `1px solid ${type === 'error' ? 'rgba(244,63,94,0.35)' : 'rgba(34,197,94,0.3)'}`,
      color: type === 'error' ? '#f87171' : '#4ade80',
      fontSize: 13,
      fontFamily: NU,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      animation: 'lwd-toast-in 0.25s ease',
    }}>
      <style>{`@keyframes lwd-toast-in { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform:none; } }`}</style>
      <span style={{ fontSize: 14 }}>{type === 'error' ? '✕' : '✓'}</span>
      {message}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LIST VIEW
// ══════════════════════════════════════════════════════════════════════════════
function ListView({ pages, loading, onEdit, C, darkMode }) {
  const border = C?.border || '#1e1e1e';
  const card   = C?.card   || '#141414';
  const off    = C?.off    || '#f5f0e8';
  const gold   = C?.gold   || '#C9A84C';

  const isDark     = darkMode !== false;
  const textMuted  = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.55)';
  const textFaint  = isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.38)';
  const sectionLbl = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.45)';
  const inputBg    = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const btnBg      = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const btnBorder  = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
  const hoverBg    = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.025)';
  const dividerColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

  // Per-row publish state
  const [publishingKey, setPublishingKey] = useState(null);
  const [publishedFlash, setPublishedFlash] = useState(null);

  async function handlePublishRow(pageKey) {
    setPublishingKey(pageKey);
    try {
      await publishPage(pageKey);
      setPublishedFlash(pageKey);
      setTimeout(() => setPublishedFlash(k => k === pageKey ? null : k), 2000);
    } catch (err) {
      // Silent fail — user can open editor to publish with full error handling
    } finally {
      setPublishingKey(null);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: gold, fontFamily: NU, marginBottom: 10 }}>
          Admin · Site Content
        </div>
        <h1 style={{ fontFamily: GD, fontSize: 26, fontWeight: 600, color: off, margin: 0, letterSpacing: '-0.01em' }}>
          Legal &amp; Support Pages
        </h1>
        <p style={{ fontFamily: NU, fontSize: 13, color: textMuted, marginTop: 8, lineHeight: 1.6 }}>
          Edit and publish content for all policy and support pages. Changes go live immediately on publish.
        </p>
      </div>

      {/* Table */}
      <div style={{
        background: card,
        border: `1px solid ${border}`,
        borderRadius: 10,
        overflow: 'hidden',
      }}>
        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 90px 160px 200px',
          padding: '12px 24px',
          borderBottom: `1px solid ${border}`,
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: sectionLbl,
          fontFamily: NU,
        }}>
          <span>Page</span>
          <span>Type</span>
          <span>Last Updated</span>
          <span style={{ textAlign: 'right' }}>Action</span>
        </div>

        {loading ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: textFaint, fontFamily: NU, fontSize: 13 }}>
            Loading pages…
          </div>
        ) : (
          pages.map((p, i) => {
            const meta = PAGE_TYPE_LABELS[p.page_key] || {};
            const updatedDate = p.last_updated
              ? new Date(p.last_updated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : '—';
            const isPublishing = publishingKey === p.page_key;
            const didFlash = publishedFlash === p.page_key;

            return (
              <div
                key={p.page_key}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 90px 160px 200px',
                  alignItems: 'center',
                  padding: '16px 24px',
                  borderBottom: i < pages.length - 1 ? `1px solid ${border}` : 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = hoverBg; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Title + slug */}
                <div>
                  <div style={{ fontFamily: NU, fontSize: 14, fontWeight: 600, color: off, marginBottom: 3 }}>
                    {p.title}
                  </div>
                  <div style={{ fontFamily: NU, fontSize: 11, color: textFaint }}>
                    {p.slug}
                  </div>
                </div>

                {/* Page type */}
                <div>
                  <span style={{
                    fontSize: 10, fontFamily: NU, letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: sectionLbl,
                    background: inputBg,
                    border: `1px solid ${dividerColor}`,
                    padding: '2px 7px', borderRadius: 4,
                  }}>
                    {meta.type || p.page_type}
                  </span>
                </div>

                {/* Last updated + status */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <StatusBadge status={p.status} />
                  <span style={{ fontSize: 11, color: textFaint, fontFamily: NU }}>{updatedDate}</span>
                </div>

                {/* Action buttons */}
                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                  {/* Publish / Re-publish button */}
                  <button
                    type="button"
                    onClick={() => handlePublishRow(p.page_key)}
                    disabled={isPublishing}
                    style={{
                      padding: '7px 12px',
                      background: 'transparent',
                      border: '1px solid rgba(201,168,76,0.25)',
                      borderRadius: 6,
                      color: didFlash ? '#4ade80' : gold,
                      fontSize: 11,
                      fontFamily: NU,
                      fontWeight: 600,
                      cursor: isPublishing ? 'wait' : 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!isPublishing) e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)'; }}
                  >
                    {didFlash ? '✓' : isPublishing ? 'Publishing…' : p.status === 'published' ? 'Re-publish' : 'Publish'}
                  </button>

                  {/* Edit button */}
                  <button
                    type="button"
                    onClick={() => onEdit(p.page_key)}
                    style={{
                      padding: '7px 16px',
                      background: 'rgba(201,168,76,0.1)',
                      border: '1px solid rgba(201,168,76,0.3)',
                      borderRadius: 6,
                      color: gold,
                      fontSize: 12,
                      fontFamily: NU,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.18)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.1)'; }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// EDITOR VIEW
// ══════════════════════════════════════════════════════════════════════════════
function EditorView({ pageKey, onBack, C, darkMode }) {
  const gold   = C?.gold   || '#C9A84C';
  const card   = C?.card   || '#141414';
  const border = C?.border || '#1e1e1e';
  const off    = C?.off    || '#f5f0e8';
  const black  = C?.black  || '#080808';

  const isDark      = darkMode !== false;
  const textMuted  = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.55)';
  const textFaint  = isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.38)';
  const sectionLbl = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.45)';
  const inputBg    = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const btnBg      = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const btnBorder  = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
  const hoverBg    = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.025)';
  const dividerColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

  const [page, setPage]             = useState(null);
  const [content, setContent]       = useState('');
  const [title, setTitle]           = useState('');
  const [seoTitle, setSeoTitle]     = useState('');
  const [metaDesc, setMetaDesc]     = useState('');
  const [status, setStatus]         = useState('draft');
  const [lastUpdated, setLastUpdated] = useState(null);

  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast]           = useState(null);

  const [selectionText, setSelectionText] = useState('');
  const [versions, setVersions]     = useState([]);
  const [showVersions, setShowVersions] = useState(false);
  const [autoSaveMsg, setAutoSaveMsg]   = useState('');
  const [noIndex, setNoIndex]   = useState(false);
  const [noFollow, setNoFollow] = useState(false);

  const autoSaveTimer = useRef(null);
  const autoSaveMsgTimer = useRef(null);

  // Load page data
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchPageDraft(pageKey);
        setPage(data);
        setContent(data.content_html || '');
        setTitle(data.title || '');
        setSeoTitle(data.seo_title || '');
        setMetaDesc(data.meta_description || '');
        setNoIndex(data.noindex || false);
        setNoFollow(data.nofollow || false);
        setStatus(data.status || 'draft');
        setLastUpdated(data.last_updated);
      } catch (err) {
        setToast({ message: 'Failed to load page: ' + err.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [pageKey]);

  // Load versions
  useEffect(() => {
    if (!pageKey) return;
    fetchVersions(pageKey).then(setVersions).catch(() => {});
  }, [pageKey, status]);

  // Auto-save debounce
  const triggerAutoSave = useCallback((newContent) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      try {
        await saveDraft(pageKey, { content_html: newContent });
        setAutoSaveMsg('Auto-saved');
        if (autoSaveMsgTimer.current) clearTimeout(autoSaveMsgTimer.current);
        autoSaveMsgTimer.current = setTimeout(() => setAutoSaveMsg(''), 3000);
      } catch (e) {
        // Silent fail on auto-save
      }
    }, 3000);
  }, [pageKey]);

  function handleContentChange(html) {
    setContent(html);
    triggerAutoSave(html);
  }

  // Manual save draft
  async function handleSaveDraft() {
    setSaving(true);
    try {
      await saveDraftFull(pageKey, {
        content_html: content,
        title,
        seo_title: seoTitle,
        meta_description: metaDesc,
        noindex: noIndex,
        nofollow: noFollow,
      });
      setStatus('draft');
      setToast({ message: 'Draft saved', type: 'success' });
    } catch (err) {
      setToast({ message: 'Save failed: ' + err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  // Publish
  async function handlePublish() {
    setPublishing(true);
    try {
      const updated = await publishPage(pageKey, content, { title, seo_title: seoTitle, meta_description: metaDesc, noindex: noIndex, nofollow: noFollow });
      setStatus('published');
      setLastUpdated(updated.last_updated);
      setToast({ message: 'Published successfully', type: 'success' });
      // Refresh versions
      fetchVersions(pageKey).then(setVersions).catch(() => {});
    } catch (err) {
      setToast({ message: 'Publish failed: ' + err.message, type: 'error' });
    } finally {
      setPublishing(false);
    }
  }

  // Preview (opens in new tab with ?preview=1)
  function handlePreview() {
    const slug = page?.slug || `/${pageKey}`;
    window.open(`${slug}?preview=1`, '_blank');
  }

  // Apply AI result
  function handleAIApply({ html }) {
    setContent(prev => {
      // For now, replace full content (selection replace handled via editor ref if needed)
      return html;
    });
    triggerAutoSave(html);
  }

  // Version restore
  async function handleRestoreVersion(versionId, label) {
    if (!window.confirm(`Restore version "${label}"? This will overwrite the current draft.`)) return;
    try {
      const { restoredHtml } = await revertToVersion(pageKey, versionId);
      setContent(restoredHtml);
      setStatus('draft');
      setToast({ message: `Restored: ${label}`, type: 'success' });
    } catch (err) {
      setToast({ message: 'Restore failed: ' + err.message, type: 'error' });
    }
  }

  async function handleRevertToPublished() {
    if (!window.confirm('Revert to last published version? This will overwrite the current draft.')) return;
    try {
      const { restoredHtml } = await revertToLastPublished(pageKey);
      setContent(restoredHtml);
      setStatus('draft');
      setToast({ message: 'Reverted to last published version', type: 'success' });
    } catch (err) {
      setToast({ message: 'Revert failed: ' + err.message, type: 'error' });
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: textFaint, fontFamily: NU, fontSize: 13 }}>
        Loading editor…
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: black }}>
      {/* ── Fixed toolbar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: 56,
        borderBottom: `1px solid ${border}`,
        background: card,
        flexShrink: 0,
        gap: 12,
      }}>
        {/* Left: back + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none',
              color: textMuted, fontSize: 12, fontFamily: NU,
              cursor: 'pointer', padding: '4px 8px',
              borderRadius: 4, flexShrink: 0,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = off; }}
            onMouseLeave={e => { e.currentTarget.style.color = textMuted; }}
          >
            ← All Pages
          </button>
          <span style={{ width: 1, height: 16, background: border, flexShrink: 0 }} />
          <span style={{ fontFamily: NU, fontSize: 13, fontWeight: 600, color: off, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title || page?.title}
          </span>
          <StatusBadge status={status} />
          {autoSaveMsg && (
            <span style={{ fontSize: 11, color: textFaint, fontFamily: NU, fontStyle: 'italic', flexShrink: 0 }}>
              {autoSaveMsg}
            </span>
          )}
        </div>

        {/* Right: actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            type="button"
            onClick={handlePreview}
            style={{
              padding: '7px 14px',
              background: 'transparent',
              border: `1px solid ${border}`,
              borderRadius: 6,
              color: textMuted,
              fontSize: 12, fontFamily: NU,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = off; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = textMuted; }}
          >
            Preview ↗
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            style={{
              padding: '7px 20px',
              background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)'}`,
              borderRadius: 6,
              color: off, fontSize: 12, fontFamily: NU, fontWeight: 700,
              cursor: saving ? 'wait' : 'pointer', transition: 'all 0.15s',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={e => { if (!saving) { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.13)'; } }}
            onMouseLeave={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'; }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            style={{
              padding: '7px 18px',
              background: 'linear-gradient(135deg, #C9A84C, #9b7a1a)',
              border: 'none',
              borderRadius: 6,
              color: '#0f0d0a', fontSize: 12, fontFamily: NU, fontWeight: 700,
              cursor: publishing ? 'wait' : 'pointer',
              letterSpacing: '0.04em',
              opacity: publishing ? 0.7 : 1,
            }}
          >
            {publishing ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </div>

      {/* ── Body: left panel + editor + AI panel ── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* ── Left sidebar: settings + versions + AI panel ── */}
        <div style={{
          width: 300,
          flexShrink: 0,
          minHeight: 0,
          borderRight: `1px solid ${border}`,
          overflowY: 'auto',
          background: card,
        }}>
          {/* Page settings */}
          <div style={{ padding: '20px', borderBottom: `1px solid ${border}` }}>
            <div style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: sectionLbl, fontFamily: NU, marginBottom: 14 }}>
              Page Settings
            </div>

            <label style={{ display: 'block', marginBottom: 12 }}>
              <span style={{ display: 'block', fontSize: 11, color: sectionLbl, fontFamily: NU, marginBottom: 5 }}>Page Title</span>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '8px 10px',
                  background: inputBg,
                  border: `1px solid ${border}`,
                  borderRadius: 6,
                  color: off, fontSize: 13, fontFamily: NU,
                  outline: 'none',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(201,168,76,0.4)'; }}
                onBlur={e => { e.target.style.borderColor = border; }}
              />
            </label>

            <div style={{ marginBottom: 12 }}>
              <span style={{ display: 'block', fontSize: 11, color: sectionLbl, fontFamily: NU, marginBottom: 5 }}>Status</span>
              <StatusBadge status={status} />
            </div>

            <div>
              <span style={{ display: 'block', fontSize: 11, color: sectionLbl, fontFamily: NU, marginBottom: 4 }}>Last Updated</span>
              <span style={{ fontSize: 12, color: textMuted, fontFamily: NU }}>
                {lastUpdated ? new Date(lastUpdated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
              </span>
            </div>
          </div>

          {/* SEO */}
          <div style={{ padding: '20px', borderBottom: `1px solid ${border}` }}>
            <div style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: sectionLbl, fontFamily: NU, marginBottom: 14 }}>
              SEO
            </div>

            <label style={{ display: 'block', marginBottom: 12 }}>
              <span style={{ display: 'block', fontSize: 11, color: sectionLbl, fontFamily: NU, marginBottom: 5 }}>SEO Title</span>
              <input
                value={seoTitle}
                onChange={e => setSeoTitle(e.target.value)}
                placeholder="Leave blank to use page title"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '8px 10px',
                  background: inputBg,
                  border: `1px solid ${border}`,
                  borderRadius: 6,
                  color: off, fontSize: 12, fontFamily: NU,
                  outline: 'none',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(201,168,76,0.4)'; }}
                onBlur={e => { e.target.style.borderColor = border; }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: 12 }}>
              <span style={{ display: 'block', fontSize: 11, color: sectionLbl, fontFamily: NU, marginBottom: 5 }}>Meta Description</span>
              <textarea
                value={metaDesc}
                onChange={e => setMetaDesc(e.target.value)}
                placeholder="Brief description for search engines (150–160 chars)"
                rows={3}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '8px 10px',
                  background: inputBg,
                  border: `1px solid ${border}`,
                  borderRadius: 6,
                  color: off, fontSize: 12, fontFamily: NU,
                  outline: 'none', resize: 'vertical', lineHeight: 1.5,
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(201,168,76,0.4)'; }}
                onBlur={e => { e.target.style.borderColor = border; }}
              />
            </label>

            {/* Robots meta */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: sectionLbl, fontFamily: NU, marginBottom: 8 }}>Search Engines</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={noIndex}
                  onChange={e => setNoIndex(e.target.checked)}
                  style={{ accentColor: gold, width: 14, height: 14, cursor: 'pointer' }}
                />
                <span style={{ fontSize: 12, fontFamily: NU, color: noIndex ? gold : textMuted }}>No Index</span>
                <span style={{ fontSize: 10, fontFamily: NU, color: textFaint }}>— hide from Google</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={noFollow}
                  onChange={e => setNoFollow(e.target.checked)}
                  style={{ accentColor: gold, width: 14, height: 14, cursor: 'pointer' }}
                />
                <span style={{ fontSize: 12, fontFamily: NU, color: noFollow ? gold : textMuted }}>No Follow</span>
                <span style={{ fontSize: 10, fontFamily: NU, color: textFaint }}>— don't follow links</span>
              </label>
            </div>

            <div style={{ marginBottom: 16 }}>
              <span style={{ display: 'block', fontSize: 11, color: sectionLbl, fontFamily: NU, marginBottom: 5 }}>Slug</span>
              <span style={{
                display: 'inline-block',
                padding: '4px 10px',
                background: inputBg,
                border: `1px solid ${border}`,
                borderRadius: 4,
                fontSize: 11, fontFamily: 'monospace',
                color: gold,
              }}>
                {page?.slug || `/${pageKey}`}
              </span>
            </div>

            {/* Save button */}
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving}
              style={{
                width: '100%',
                padding: '9px',
                background: saving ? inputBg : btnBg,
                border: `1px solid ${btnBorder}`,
                borderRadius: 6,
                color: off,
                fontSize: 12, fontFamily: NU, fontWeight: 600,
                cursor: saving ? 'wait' : 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!saving) { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'; e.currentTarget.style.color = gold; } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = btnBorder; e.currentTarget.style.color = off; }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>

          {/* Version history */}
          <div style={{ padding: '20px', borderBottom: `1px solid ${border}` }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 12,
            }}>
              <div style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: sectionLbl, fontFamily: NU }}>
                Version History
              </div>
              <button
                type="button"
                onClick={() => setShowVersions(v => !v)}
                style={{
                  background: 'none', border: 'none',
                  color: sectionLbl, fontSize: 11, fontFamily: NU,
                  cursor: 'pointer',
                }}
              >
                {showVersions ? 'Hide' : `Show (${versions.length})`}
              </button>
            </div>

            {status === 'published' && (
              <button
                type="button"
                onClick={handleRevertToPublished}
                style={{
                  width: '100%',
                  padding: '7px 12px',
                  background: inputBg,
                  border: `1px solid ${border}`,
                  borderRadius: 6,
                  color: textMuted,
                  fontSize: 11, fontFamily: NU,
                  cursor: 'pointer', marginBottom: 10,
                  transition: 'all 0.15s',
                  textAlign: 'left',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = off; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = textMuted; }}
              >
                ↩ Revert to Last Published
              </button>
            )}

            {showVersions && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {versions.length === 0 ? (
                  <div style={{ fontSize: 11, color: textFaint, fontFamily: NU, fontStyle: 'italic' }}>
                    No versions yet. Versions are created on publish.
                  </div>
                ) : (
                  versions.map(v => (
                    <div key={v.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 10px',
                      background: hoverBg,
                      border: `1px solid ${border}`,
                      borderRadius: 6,
                    }}>
                      <div>
                        <div style={{ fontSize: 11, color: textMuted, fontFamily: NU }}>
                          {v.version_label || 'Version'}
                        </div>
                        <div style={{ fontSize: 10, color: textFaint, fontFamily: NU, marginTop: 2 }}>
                          {new Date(v.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRestoreVersion(v.id, v.version_label)}
                        style={{
                          padding: '4px 10px',
                          background: 'none',
                          border: `1px solid ${border}`,
                          borderRadius: 4,
                          color: sectionLbl,
                          fontSize: 10, fontFamily: NU,
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = gold; e.currentTarget.style.color = gold; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = sectionLbl; }}
                      >
                        Restore
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* AI Panel */}
          <AIEditorPanel
            fullContent={content}
            selectionText={selectionText}
            pageKey={pageKey}
            onApply={handleAIApply}
            C={C}
            darkMode={darkMode}
          />
        </div>

        {/* ── Main editor area ── */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: black }}>
          <RichTextEditor
            content={content}
            onChange={handleContentChange}
            placeholder="Start writing your content here…"
            C={C}
            darkMode={darkMode}
            onSelectionUpdate={({ text }) => setSelectionText(text)}
          />
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN MODULE
// ══════════════════════════════════════════════════════════════════════════════
export default function SiteContentModule({ C, darkMode }) {
  const [pages, setPages]               = useState([]);
  const [loadingList, setLoadingList]   = useState(true);

  // Auto-open editor if arriving via front-end "Edit Page" button
  const getInitialEditKey = () => {
    try {
      const key = sessionStorage.getItem('lwd_cms_edit_pagekey');
      if (key) { sessionStorage.removeItem('lwd_cms_edit_pagekey'); return key; }
    } catch {}
    return null;
  };
  const [editingPageKey, setEditingPageKey] = useState(getInitialEditKey);

  useEffect(() => {
    setLoadingList(true);
    fetchAllPages()
      .then(data => setPages(data))
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, [editingPageKey]); // Refresh list on return from editor

  if (editingPageKey) {
    return (
      <EditorView
        key={editingPageKey}
        pageKey={editingPageKey}
        onBack={() => setEditingPageKey(null)}
        C={C}
        darkMode={darkMode}
      />
    );
  }

  return (
    <ListView
      pages={pages}
      loading={loadingList}
      onEdit={setEditingPageKey}
      C={C}
      darkMode={darkMode}
    />
  );
}
