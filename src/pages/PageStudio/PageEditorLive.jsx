import { useEffect, useState } from 'react';
import usePageForm from './hooks/usePageForm';
import usePagePreview from './hooks/usePagePreview';
import useViewMode from './hooks/useViewMode';
import PageSaveBar from './components/PageSaveBar';
import HomepageEditorPanel from './components/HomepageEditorPanel';
import HomepagePreview from './components/HomepagePreview';
import HomepageAIImportPanel from './components/HomepageAIImportPanel';

/**
 * PageEditorLive — Full page editor with 50/50 split layout
 *
 * Left Panel: Sticky save bar + section editors (scrollable)
 * Right Panel: Live preview (scrollable)
 *
 * Matches Listing Studio architecture:
 * - usePageForm for state management
 * - usePagePreview for debounced preview updates
 * - Hash-based routing + refresh persistence
 * - Draft/publish workflow with toast feedback
 *
 * Props:
 *   pageId {string}    Page ID to edit (or 'new' for new page)
 *   C {object}         Color palette
 *   NU {string}        UI font family
 *   GD {string}        Display font family
 *   onNavigate {fn}    Called with pageId when user wants to go back
 */

export default function PageEditorLive({ pageId, C, NU, GD, onNavigate }) {
  const pageForm = usePageForm(pageId);
  const previewData = usePagePreview(pageForm.formData, 200);
  const { viewMode, handleViewModeChange, gridCols, showLeftPanel, showRightPanel } = useViewMode('ps_view_mode');

  const [showAIImport, setShowAIImport] = useState(false);
  const [importToast, setImportToast] = useState(null);

  // Load page on mount (for existing pages)
  useEffect(() => {
    if (pageId && pageId !== 'new') {
      pageForm.loadPage(pageId);
    }
  }, [pageId]);

  // Handle "Populate with AI" button click
  const handlePopulateAI = () => {
    setShowAIImport(true);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: C.black,
      }}
    >
      {/* FULL-WIDTH ACTION BAR — matches Listing Studio exactly */}
      <PageSaveBar
        hasChanges={pageForm.hasChanges}
        saveStatus={pageForm.saveStatus}
        onDiscard={pageForm.handleDiscard}
        onSaveDraft={pageForm.handleSaveDraft}
        onPublish={pageForm.handlePublish}
        onPopulateAI={handlePopulateAI}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        C={C}
        NU={NU}
      />

      {/* SPLIT PANELS GRID */}
      <div
        className="ps-panels-grid"
        data-split={viewMode === 'split' ? 'true' : 'false'}
        style={{
          display: 'grid',
          gridTemplateColumns: gridCols,
          gap: 0,
          flex: 1,
          overflow: 'hidden',
        }}
      >

      {/* LEFT PANEL — Editor */}
      {showLeftPanel && (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: C.black,
          borderRight: viewMode === 'split' ? '1px solid rgba(255,255,255,0.08)' : 'none',
          overflow: 'hidden',
          order: viewMode === 'preview' ? 2 : 1,
        }}
      >

        {/* Breadcrumb Navigation */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <button
            onClick={() => {
              window.location.hash = 'page-studio';
              onNavigate?.();
            }}
            style={{
              fontFamily: NU,
              fontSize: 10,
              color: C.gold,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textTransform: 'uppercase',
              fontWeight: 700,
              letterSpacing: '0.06em',
            }}
          >
            ← Pages
          </button>
          <span style={{ color: C.grey2, fontSize: 10 }}>|</span>
          <h2
            style={{
              fontFamily: GD,
              fontSize: 14,
              fontWeight: 400,
              color: C.white,
              margin: 0,
            }}
          >
            {pageForm.formData.title}
          </h2>
        </div>

        {/* Scrollable Section Editors */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            backgroundColor: C.black,
          }}
        >
          {/* Page Details — Title + Excerpt */}
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
            <label style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.grey2, display: 'block', marginBottom: 4 }}>
              Page Excerpt
            </label>
            <textarea
              value={pageForm.formData.excerpt || ''}
              onChange={(e) => pageForm.onChange('excerpt', e.target.value)}
              placeholder="Short summary of the page — used in meta descriptions, cards, and AI context"
              rows={2}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: 12,
                fontFamily: NU,
                backgroundColor: C.card,
                color: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: 3,
                resize: 'vertical',
              }}
            />
          </div>

          <HomepageEditorPanel
            formData={pageForm.formData}
            onSectionChange={pageForm.onSectionChange}
            C={C}
            NU={NU}
            GD={GD}
          />
        </div>
      </div>
      )}

      {/* RIGHT PANEL — Live Preview */}
      {showRightPanel && (
      <div
        className="ps-panel-right"
        data-split={viewMode === 'split' ? 'true' : 'false'}
        style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: C.black,
          overflow: 'hidden',
          order: viewMode === 'preview' ? 1 : 2,
        }}
      >
        {/* Preview Header */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 12, color: C.grey2, fontFamily: NU, letterSpacing: '0.06em' }}>
            LIVE PREVIEW
          </span>
          {viewMode === 'preview' && (
            <div style={{ display: 'flex', gap: 4 }}>
              {[['⬜ Split', 'split'], ['✏ Edit', 'editor']].map(([label, mode]) => (
                <button
                  key={mode}
                  onClick={() => handleViewModeChange(mode)}
                  style={{
                    fontFamily: NU,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    padding: '4px 10px',
                    borderRadius: 3,
                    border: `1px solid ${C.border}`,
                    background: C.card,
                    color: C.gold,
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Scrollable Preview */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            backgroundColor: C.black,
          }}
        >
          <HomepagePreview formData={previewData} C={C} />
        </div>
      </div>
      )}

      {/* AI Import Panel */}
      {showAIImport && (
        <HomepageAIImportPanel
          formData={pageForm.formData}
          onChange={pageForm.onChange}
          onSectionChange={pageForm.onSectionChange}
          onClose={(appliedCount) => {
            setShowAIImport(false);
            if (appliedCount > 0) {
              setImportToast({ count: appliedCount });
              setTimeout(() => setImportToast(null), 5000);
            }
          }}
        />
      )}

      </div> {/* end grid */}

      {/* AI Import Toast */}
      {importToast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            backgroundColor: '#064e3b',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 6,
            fontFamily: NU,
            fontSize: 13,
            zIndex: 999,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            animation: 'slideUpToast 0.3s ease',
          }}
        >
          AI applied {importToast.count} section{importToast.count > 1 ? 's' : ''} to Homepage
          <style>{`
            @keyframes slideUpToast {
              from { transform: translateY(20px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
