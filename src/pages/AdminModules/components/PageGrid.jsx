/**
 * PageGrid.jsx
 * Grid view of all pages in a magazine issue.
 * Shows thumbnails via PageCard. Empty state + loading state.
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchPages, deletePage } from '../../../services/magazinePageService';
import { updatePageCount } from '../../../services/magazineIssuesService';
import PageCard from './PageCard';
import JpegPageUploader from './JpegPageUploader';

const GOLD = '#C9A84C';
const GD   = "var(--font-heading-primary, 'Cormorant Garamond', Georgia, serif)";
const NU   = "var(--font-body, 'Nunito Sans', sans-serif)";

/**
 * @param {Object}   props
 * @param {string}   props.issueId
 * @param {Object}   props.issue          - Full issue record
 * @param {function} [props.onPageCountChange]  - Called when page count changes
 */
export default function PageGrid({ issueId, issue, onPageCountChange }) {
  const [pages,       setPages]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [deleting,    setDeleting]    = useState(null);   // page.id being deleted
  const [showUploader, setShowUploader] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: err } = await fetchPages(issueId);
    if (err) setError(err.message);
    else setPages(data);
    setLoading(false);
  }, [issueId]);

  useEffect(() => { if (issueId) load(); }, [issueId, load]);

  const handleDelete = useCallback(async (page) => {
    if (!window.confirm(`Delete page ${page.page_number}? This cannot be undone.`)) return;
    setDeleting(page.id);
    const { error: err } = await deletePage(issueId, page.page_number);
    if (err) {
      setError(err.message);
    } else {
      const updated = pages.filter(p => p.id !== page.id);
      setPages(updated);
      const newCount = updated.length;
      await updatePageCount(issueId, newCount);
      onPageCountChange?.(newCount);
    }
    setDeleting(null);
  }, [issueId, pages, onPageCountChange]);

  const handleJpegComplete = useCallback(async ({ pageRecord }) => {
    setShowUploader(false);
    await load();
    onPageCountChange?.(pages.length + 1);
  }, [load, pages.length, onPageCountChange]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ fontFamily: NU, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Loading pages…</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: GD, fontSize: 18, color: '#fff' }}>Pages</div>
          <div style={{ fontFamily: NU, fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
            {pages.length} page{pages.length !== 1 ? 's' : ''} · v{issue?.render_version || 1}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowUploader(v => !v)}
            style={{
              background: showUploader ? 'rgba(201,168,76,0.15)' : 'transparent',
              border: `1px solid ${showUploader ? GOLD : 'rgba(255,255,255,0.2)'}`,
              borderRadius: 4, color: showUploader ? GOLD : 'rgba(255,255,255,0.7)',
              fontFamily: NU, fontSize: 11, fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              padding: '7px 14px', cursor: 'pointer',
            }}
          >
            {showUploader ? '✕ Cancel' : '+ Add Page'}
          </button>
          <button
            onClick={load}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 4, color: 'rgba(255,255,255,0.5)',
              fontFamily: NU, fontSize: 11,
              padding: '7px 12px', cursor: 'pointer',
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* JPEG uploader panel */}
      {showUploader && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 6, padding: 16, marginBottom: 20,
        }}>
          <div style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            Add Single Page (JPEG)
          </div>
          <JpegPageUploader
            issueId={issueId}
            renderVersion={issue?.render_version || 1}
            currentPageCount={pages.length}
            onComplete={handleJpegComplete}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ fontFamily: NU, fontSize: 11, color: '#f87171', marginBottom: 12 }}>
          ⚠ {error}
        </div>
      )}

      {/* Empty state */}
      {pages.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          border: '2px dashed rgba(255,255,255,0.08)', borderRadius: 6,
        }}>
          <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>📰</div>
          <div style={{ fontFamily: GD, fontSize: 18, color: 'rgba(255,255,255,0.4)' }}>No pages yet</div>
          <div style={{ fontFamily: NU, fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
            Upload a PDF in the Details tab to auto-process all pages,<br />
            or add individual JPEG pages above.
          </div>
        </div>
      ) : (
        /* Page grid */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: 10,
        }}>
          {pages.map(page => (
            <div key={page.id} style={{ opacity: deleting === page.id ? 0.4 : 1, transition: 'opacity 0.2s' }}>
              <PageCard
                page={page}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
