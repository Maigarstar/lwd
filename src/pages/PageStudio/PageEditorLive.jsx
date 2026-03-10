import { useEffect, useState } from 'react';
import usePageForm from './hooks/usePageForm';
import usePagePreview from './hooks/usePagePreview';
import PageSaveBar from './components/PageSaveBar';
import HomepageEditorPanel from './components/HomepageEditorPanel';
import HomepagePreview from './components/HomepagePreview';

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

  // View Mode state (Split View, Editor Only, Preview Only)
  const [viewMode, setViewMode] = useState('split');

  // Load page on mount (for existing pages)
  useEffect(() => {
    if (pageId && pageId !== 'new') {
      pageForm.loadPage(pageId);
    }
  }, [pageId]);

  // Load view mode preference from localStorage on mount
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('ps_view_mode');
      if (savedMode && ['split', 'editor', 'preview'].includes(savedMode)) {
        setViewMode(savedMode);
      }
    } catch (e) {
      console.warn('Failed to load view mode preference:', e);
    }
  }, []);

  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('ps_view_mode', mode);
    } catch (e) {
      console.warn('Failed to save view mode preference:', e);
    }
  };

  // Handle "Populate with AI" button click
  const handlePopulateAI = () => {
    console.log('TODO: Integrate AIPageImportPanel in Phase 2');
    // In Phase 2+:
    // setShowAIImportPanel(true);
  };

  // Compute grid layout and panel visibility based on viewMode
  const gridCols = viewMode === 'editor' ? '1fr' : viewMode === 'preview' ? '1fr' : '1fr 1fr';
  const showLeftPanel = viewMode !== 'preview';
  const showRightPanel = viewMode !== 'editor';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: gridCols,
        gap: 0,
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: C.black,
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
          animation: 'slideInLeft 0.3s ease-out',
        }}
      >
        <style>{`
          @keyframes slideInLeft {
            from {
              transform: translateX(-100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}</style>
        {/* Sticky Save Bar */}
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
            gap: 8,
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 12, color: C.grey2, fontFamily: NU }}>
            LIVE PREVIEW
          </span>

          {/* View Mode Control — Only visible in Preview-Only mode */}
          {viewMode === 'preview' && (
          <div style={{ display: 'flex', gap: 4 }}>
            {['split', 'editor', 'preview'].map((mode) => {
              const modeLabel = mode === 'split' ? 'Split' : mode === 'editor' ? 'Editor' : 'Preview';
              const isActive = viewMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => handleViewModeChange(mode)}
                  title={modeLabel}
                  style={{
                    fontFamily: NU,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    padding: '6px 8px',
                    backgroundColor: isActive ? C.gold : 'transparent',
                    color: isActive ? '#fff' : C.grey2,
                    border: `1px solid ${isActive ? C.gold : C.border}`,
                    borderRadius: 3,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    opacity: isActive ? 1 : 0.7,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isActive ? C.gold2 || '#7a5c0f' : `${C.gold}22`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isActive ? C.gold : 'transparent';
                  }}
                >
                  {modeLabel}
                </button>
              );
            })}
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

      {/* TODO: AIPageImportPanel integration in Phase 2+ */}
    </div>
  );
}
