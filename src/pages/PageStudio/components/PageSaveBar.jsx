/**
 * PageSaveBar, Full-width action bar for Page Studio editor
 *
 * Matches Listing Studio toolbar exactly:
 * Left:  Magic AI | Fill with AI
 * Right: Split | Editor | Preview (text links) + divider + Discard | Save Draft | Publish
 *
 * Mobile: save actions stay on row 1, view mode links wrap to row 2.
 */

export default function PageSaveBar({
  hasChanges,
  saveStatus,
  onDiscard,
  onSaveDraft,
  onPublish,
  onPopulateAI,
  viewMode,
  onViewModeChange,
  C,
  NU,
}) {
  const isLoading = saveStatus === 'saving' || saveStatus === 'publishing';

  const toastMessage =
    saveStatus === 'saved' ? 'Saved as draft' :
    saveStatus === 'published' ? 'Published successfully' :
    saveStatus === 'error' ? 'Error saving page' :
    null;

  const toastBg =
    saveStatus === 'saved' || saveStatus === 'published' ? '#064e3b' :
    saveStatus === 'error' ? '#7f1d1d' :
    '#1a1a1a';

  return (
    <>
      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 767px) {
          .ps-toolbar {
            flex-wrap: wrap !important;
            padding: 8px 12px !important;
            row-gap: 6px !important;
          }
          .ps-toolbar-vm {
            order: 3;
            width: 100%;
            justify-content: center;
            border-top: 1px solid rgba(255,255,255,0.08);
            padding-top: 6px;
          }
          .ps-toolbar-div { display: none !important; }
          .ps-toolbar-save {
            order: 2;
            flex-shrink: 0;
          }
          .ps-toolbar-save button {
            padding: 6px 10px !important;
            font-size: 11px !important;
          }
          .ps-panel-right[data-split="true"] {
            display: none !important;
          }
          .ps-panels-grid[data-split="true"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Full-width toolbar */}
      <div
        className="ps-toolbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 24px',
          borderBottom: `1px solid ${C.border}`,
          backgroundColor: C.dark,
          position: 'sticky',
          top: 0,
          zIndex: 30,
          gap: 8,
          flexShrink: 0,
        }}
      >
        {/* Left: AI tools, order 1 */}
        <div style={{ display: 'flex', gap: 8, order: 1 }}>
          <button
            type="button"
            onClick={onPopulateAI}
            disabled={isLoading}
            style={{
              fontSize: 13, fontWeight: 600, padding: '7px 14px',
              backgroundColor: C.white, color: C.dark,
              border: 'none', borderRadius: 6,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1,
              fontFamily: NU,
            }}
          >
            Magic AI
          </button>
          <button
            type="button"
            onClick={onPopulateAI}
            disabled={isLoading}
            style={{
              fontSize: 13, fontWeight: 500, padding: '7px 14px',
              backgroundColor: 'transparent', color: C.white,
              border: `1px solid ${C.border}`, borderRadius: 6,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1,
              fontFamily: NU,
            }}
          >
            Fill with AI
          </button>
        </div>

        {/* Save actions, order 2, stays on row 1 next to AI tools on mobile */}
        <div className="ps-toolbar-save" style={{ display: 'flex', gap: 8, order: 2, marginLeft: 'auto' }}>
          <button
            type="button"
            onClick={onDiscard}
            disabled={isLoading}
            style={{
              fontSize: 13, fontWeight: 500, padding: '7px 14px',
              backgroundColor: 'transparent', color: C.grey2,
              border: `1px solid ${C.border}`, borderRadius: 6,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontFamily: NU,
            }}
          >
            Discard
          </button>
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isLoading || !hasChanges}
            style={{
              fontSize: 13, fontWeight: 600, padding: '7px 14px',
              backgroundColor: C.white, color: C.dark,
              border: 'none', borderRadius: 6,
              cursor: isLoading || !hasChanges ? 'not-allowed' : 'pointer',
              opacity: isLoading || !hasChanges ? 0.35 : 1,
              fontFamily: NU,
            }}
          >
            {saveStatus === 'saving' ? 'Saving…' : 'Save Draft'}
          </button>
          <button
            type="button"
            onClick={onPublish}
            disabled={isLoading}
            style={{
              fontSize: 13, fontWeight: 600, padding: '7px 14px',
              backgroundColor: C.white, color: C.dark,
              border: 'none', borderRadius: 6,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              fontFamily: NU,
            }}
          >
            {saveStatus === 'publishing' ? 'Publishing…' : 'Publish'}
          </button>
        </div>

        {/* View mode text links, order 3, wraps to row 2 on mobile */}
        <div className="ps-toolbar-vm" style={{ display: 'flex', gap: 16, alignItems: 'center', order: 3 }}>
          {/* Divider, hidden on mobile */}
          <span className="ps-toolbar-div" style={{ width: 1, height: 16, backgroundColor: C.border, display: 'inline-block' }} />
          {['split', 'editor', 'preview'].map((mode) => {
            const isActive = viewMode === mode;
            return (
              <span
                key={mode}
                onClick={() => onViewModeChange(mode)}
                style={{
                  fontSize: 11, fontWeight: isActive ? 700 : 500,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: isActive ? C.white : C.grey2,
                  cursor: 'pointer',
                  borderBottom: isActive ? `1px solid ${C.white}` : '1px solid transparent',
                  paddingBottom: 1,
                  fontFamily: NU,
                }}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </span>
            );
          })}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            backgroundColor: toastBg,
            color: '#fff',
            padding: '12px 16px',
            borderRadius: 4,
            fontFamily: NU,
            fontSize: 12,
            zIndex: 999,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            animation: 'slideIn 0.3s ease',
          }}
        >
          {toastMessage}
          <style>{`
            @keyframes slideIn {
              from { transform: translateX(400px); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
