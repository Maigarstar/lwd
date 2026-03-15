/**
 * ViewModeControl, Shared split/editor/preview view mode buttons
 *
 * Used by both Page Studio and Listing Studio save bars.
 * Displays three toggle buttons: Split, Editor, Preview.
 *
 * Props:
 *   viewMode {string}      Current view mode: 'split', 'editor', 'preview'
 *   onViewModeChange {fn}  Called with new mode when button is clicked
 *   C {object}             Color palette (from theme context)
 *   NU {string}            UI font family
 */

export default function ViewModeControl({ viewMode, onViewModeChange, C, NU }) {
  const modes = [
    { id: 'split', label: 'Split', icon: '⊞' },
    { id: 'editor', label: 'Editor', icon: '✎' },
    { id: 'preview', label: 'Preview', icon: '👁' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        alignItems: 'center',
      }}
    >
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onViewModeChange(mode.id)}
          title={`${mode.label} view`}
          style={{
            fontFamily: NU,
            fontSize: 10,
            fontWeight: 600,
            padding: '8px 12px',
            border: viewMode === mode.id ? `1px solid ${C.gold}` : `1px solid ${C.border}`,
            backgroundColor: viewMode === mode.id ? C.gold : 'transparent',
            color: viewMode === mode.id ? '#000' : C.grey2,
            borderRadius: 3,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
          onMouseEnter={(e) => {
            if (viewMode !== mode.id) {
              e.currentTarget.style.backgroundColor = `${C.gold}22`;
              e.currentTarget.style.borderColor = C.gold;
            }
          }}
          onMouseLeave={(e) => {
            if (viewMode !== mode.id) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = C.border;
            }
          }}
        >
          <span style={{ fontSize: 12 }}>{mode.icon}</span>
          {mode.label}
        </button>
      ))}
    </div>
  );
}
