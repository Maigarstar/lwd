/**
 * VendorPreviewSection — Vendor preview section editor
 * Editable: heading
 * Vendor selection (Phase 2+)
 */

export default function VendorPreviewSection({ section, onChange, C, NU }) {
  if (!section) return null;

  const handleFieldChange = (field, value) => {
    onChange(section.id, field, value);
  };

  return (
    <div style={{ backgroundColor: C.card, borderRadius: 4, padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Heading */}
      <div>
        <label style={{ fontFamily: NU, fontSize: 10, fontWeight: 600, color: C.grey2, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
          Section Heading
        </label>
        <input
          type="text"
          value={section.heading || ''}
          onChange={(e) => handleFieldChange('heading', e.target.value)}
          placeholder="Handpicked Vendors"
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
      </div>

      <p style={{ fontFamily: NU, fontSize: 11, color: C.grey2, margin: 0 }}>
        Featured vendor cards section. Vendor selection coming in Phase 2+.
      </p>
    </div>
  );
}
