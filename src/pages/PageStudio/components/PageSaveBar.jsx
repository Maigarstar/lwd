/**
 * PageSaveBar — Sticky save bar (top of left editor panel)
 *
 * Buttons: Discard | Save Draft | Populate with AI | Publish
 * States: unsaved, saving, saved, publishing, published, error
 * Toast feedback for user actions
 *
 * Mirrors Listing Studio save bar pattern
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
      {/* Sticky Save Bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          backgroundColor: C.card,
          borderBottom: `1px solid ${C.border}`,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        {/* Discard Button */}
        <button
          onClick={onDiscard}
          disabled={isLoading || !hasChanges}
          style={{
            fontFamily: NU,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            padding: '8px 14px',
            backgroundColor: 'transparent',
            color: hasChanges && !isLoading ? '#ef4444' : C.grey2,
            border: `1px solid ${hasChanges && !isLoading ? '#ef4444' : C.border}`,
            borderRadius: 3,
            cursor: hasChanges && !isLoading ? 'pointer' : 'not-allowed',
            opacity: hasChanges && !isLoading ? 1 : 0.5,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (hasChanges && !isLoading) {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Discard
        </button>

        {/* Save Draft Button */}
        <button
          onClick={onSaveDraft}
          disabled={isLoading || !hasChanges}
          style={{
            fontFamily: NU,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            padding: '8px 14px',
            backgroundColor: hasChanges && !isLoading ? C.gold : '#f0f0f0',
            color: hasChanges && !isLoading ? '#fff' : C.grey2,
            border: 'none',
            borderRadius: 3,
            cursor: hasChanges && !isLoading ? 'pointer' : 'not-allowed',
            opacity: isLoading ? 0.7 : 1,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (hasChanges && !isLoading) {
              e.currentTarget.style.backgroundColor = C.gold2 || '#7a5c0f';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (hasChanges && !isLoading) {
              e.currentTarget.style.backgroundColor = C.gold;
              e.currentTarget.style.transform = 'none';
            }
          }}
        >
          {saveStatus === 'saving' ? 'Saving…' : 'Save Draft'}
        </button>

        {/* Populate with AI Button */}
        <button
          onClick={onPopulateAI}
          disabled={isLoading}
          style={{
            fontFamily: NU,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            padding: '8px 14px',
            backgroundColor: 'transparent',
            color: C.gold,
            border: `1px solid ${C.gold}`,
            borderRadius: 3,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.5 : 1,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = `${C.gold}22`;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          ★ AI
        </button>

        {/* View Mode Control — Split / Editor / Preview */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            paddingRight: 8,
            borderRight: `1px solid ${C.border}`,
          }}
        >
          {['split', 'editor', 'preview'].map((mode) => {
            const modeLabel = mode === 'split' ? 'Split' : mode === 'editor' ? 'Editor' : 'Preview';
            const isActive = viewMode === mode;
            return (
              <button
                key={mode}
                onClick={() => onViewModeChange(mode)}
                title={modeLabel}
                style={{
                  fontFamily: NU,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '8px 10px',
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

        {/* Publish Button */}
        <button
          onClick={onPublish}
          disabled={isLoading}
          style={{
            fontFamily: NU,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            padding: '8px 14px',
            backgroundColor: C.gold,
            color: '#fff',
            border: 'none',
            borderRadius: 3,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
            transition: 'all 0.15s ease',
            marginLeft: 'auto',
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = C.gold2 || '#7a5c0f';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = C.gold;
              e.currentTarget.style.transform = 'none';
            }
          }}
        >
          {saveStatus === 'publishing' ? 'Publishing…' : '↑ Publish'}
        </button>

        {/* Unsaved Indicator */}
        {hasChanges && !isLoading && (
          <span
            style={{
              fontFamily: NU,
              fontSize: 9,
              color: '#ef4444',
              marginLeft: 'auto',
              fontWeight: 600,
              letterSpacing: '0.05em',
            }}
          >
            Unsaved changes
          </span>
        )}
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
