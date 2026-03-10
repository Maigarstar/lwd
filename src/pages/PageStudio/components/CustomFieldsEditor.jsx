/**
 * CustomFieldsEditor — Editor for custom section fields
 *
 * Features:
 * - Multiple field types (text, textarea, richtext, url, number, toggle, image, video)
 * - Enable/disable toggle for each field (controls visibility in preview)
 * - Delete field with confirmation
 * - Real-time form binding
 */

export default function CustomFieldsEditor({ section, onSectionChange, C, NU }) {
  if (!section?.customFields?.length) return null;

  const handleFieldChange = (fieldId, value) => {
    const updatedFields = section.customFields.map(f =>
      f.id === fieldId ? { ...f, value } : f
    );
    onSectionChange(section.id, 'customFields', updatedFields);
  };

  const handleToggleField = (fieldId) => {
    const updatedFields = section.customFields.map(f =>
      f.id === fieldId ? { ...f, enabled: !f.enabled } : f
    );
    onSectionChange(section.id, 'customFields', updatedFields);
  };

  const handleDeleteField = (fieldId) => {
    if (confirm('Delete this custom field permanently? This cannot be undone.')) {
      const updatedFields = section.customFields.filter(f => f.id !== fieldId);
      onSectionChange(section.id, 'customFields', updatedFields);
    }
  };

  return (
    <div
      style={{
        backgroundColor: C.card,
        borderRadius: 4,
        padding: 12,
        marginTop: 12,
        borderLeft: `3px solid ${C.gold || '#FFD700'}`,
      }}
    >
      <p
        style={{
          fontFamily: NU,
          fontSize: 9,
          fontWeight: 600,
          color: C.grey,
          textTransform: 'uppercase',
          margin: '0 0 12px 0',
          letterSpacing: 0.5,
        }}
      >
        ✨ Custom Fields
      </p>

      {section.customFields.map((field) => (
        <div key={field.id} style={{ marginBottom: 14 }}>
          {/* Field Header with Toggle & Delete */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 6,
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flex: 1,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={field.enabled}
                onChange={() => handleToggleField(field.id)}
                style={{
                  cursor: 'pointer',
                  width: 14,
                  height: 14,
                }}
              />
              <span
                style={{
                  fontFamily: NU,
                  fontSize: 10,
                  fontWeight: 600,
                  color: C.white,
                }}
              >
                {field.label}
              </span>
              <span
                style={{
                  fontSize: 8,
                  color: C.grey2,
                  fontFamily: 'monospace',
                  marginLeft: 4,
                }}
              >
                ({field.type})
              </span>
            </label>
            <button
              onClick={() => handleDeleteField(field.id)}
              title="Delete this custom field"
              style={{
                padding: '3px 6px',
                backgroundColor: '#FF6B6B',
                color: 'white',
                border: 'none',
                borderRadius: 2,
                fontFamily: NU,
                fontSize: 9,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 0.2s ease',
                opacity: 1,
              }}
              onMouseOver={(e) => (e.target.style.opacity = '0.8')}
              onMouseOut={(e) => (e.target.style.opacity = '1')}
            >
              ✕
            </button>
          </div>

          {/* Conditional Field Input Based on Type */}
          {field.enabled && (
            <>
              {field.type === 'text' && (
                <input
                  type="text"
                  value={field.value || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={field.placeholder || ''}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontFamily: NU,
                    fontSize: 12,
                    border: `1px solid ${C.border}`,
                    borderRadius: 3,
                    backgroundColor: C.black,
                    color: C.white,
                    boxSizing: 'border-box',
                  }}
                />
              )}

              {field.type === 'textarea' && (
                <textarea
                  value={field.value || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={field.placeholder || ''}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontFamily: NU,
                    fontSize: 12,
                    border: `1px solid ${C.border}`,
                    borderRadius: 3,
                    backgroundColor: C.black,
                    color: C.white,
                    boxSizing: 'border-box',
                    minHeight: 60,
                    resize: 'vertical',
                  }}
                />
              )}

              {field.type === 'url' && (
                <input
                  type="url"
                  value={field.value || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={field.placeholder || 'https://...'}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontFamily: NU,
                    fontSize: 12,
                    border: `1px solid ${C.border}`,
                    borderRadius: 3,
                    backgroundColor: C.black,
                    color: C.white,
                    boxSizing: 'border-box',
                  }}
                />
              )}

              {field.type === 'number' && (
                <input
                  type="number"
                  value={field.value || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={field.placeholder || '0'}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontFamily: NU,
                    fontSize: 12,
                    border: `1px solid ${C.border}`,
                    borderRadius: 3,
                    backgroundColor: C.black,
                    color: C.white,
                    boxSizing: 'border-box',
                  }}
                />
              )}

              {field.type === 'toggle' && (
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={field.value === true}
                    onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                    style={{
                      cursor: 'pointer',
                      width: 16,
                      height: 16,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: NU,
                      fontSize: 11,
                      color: C.grey2,
                      fontWeight: 500,
                    }}
                  >
                    {field.value ? '✓ Enabled' : '✗ Disabled'}
                  </span>
                </label>
              )}

              {field.type === 'richtext' && (
                <textarea
                  value={field.value || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={field.placeholder || 'Enter rich text...'}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontFamily: NU,
                    fontSize: 12,
                    border: `1px solid ${C.border}`,
                    borderRadius: 3,
                    backgroundColor: C.black,
                    color: C.white,
                    boxSizing: 'border-box',
                    minHeight: 80,
                    resize: 'vertical',
                  }}
                />
              )}
            </>
          )}

          {!field.enabled && (
            <p
              style={{
                fontFamily: NU,
                fontSize: 10,
                color: C.grey2,
                fontStyle: 'italic',
                margin: '6px 0 0 0',
              }}
            >
              (This field is hidden in the preview)
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
