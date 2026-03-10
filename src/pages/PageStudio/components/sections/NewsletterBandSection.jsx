/**
 * NewsletterBandSection — Newsletter subscription band editor
 * Editable: heading, ctaText, ctaUrl
 */

export default function NewsletterBandSection({ section, onChange, C, NU }) {
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
          placeholder="Stay Updated"
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

      {/* CTA Text */}
      <div>
        <label style={{ fontFamily: NU, fontSize: 10, fontWeight: 600, color: C.grey2, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
          CTA Text
        </label>
        <input
          type="text"
          value={section.ctaText || ''}
          onChange={(e) => handleFieldChange('ctaText', e.target.value)}
          placeholder="Subscribe"
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

      {/* CTA URL */}
      <div>
        <label style={{ fontFamily: NU, fontSize: 10, fontWeight: 600, color: C.grey2, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
          CTA URL
        </label>
        <input
          type="url"
          value={section.ctaUrl || ''}
          onChange={(e) => handleFieldChange('ctaUrl', e.target.value)}
          placeholder="#newsletter"
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
    </div>
  );
}
