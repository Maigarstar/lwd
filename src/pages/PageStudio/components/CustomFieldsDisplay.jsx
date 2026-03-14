/**
 * CustomFieldsDisplay, Renders enabled custom fields in preview
 *
 * Only renders fields marked as enabled.
 * Displays field values with type-appropriate formatting.
 */

export default function CustomFieldsDisplay({ customFields, C, NU }) {
  if (!customFields?.length) return null;

  const enabledFields = customFields.filter(f => f.enabled);
  if (!enabledFields.length) return null;

  return (
    <div style={{ padding: '20px 40px', backgroundColor: C.black, borderTop: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {enabledFields.map((field) => (
          <div key={field.id} style={{ marginBottom: 16 }}>
            <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 600, color: C.grey, textTransform: 'uppercase', marginBottom: 6 }}>
              {field.label}
            </p>

            {field.type === 'text' && (
              <p style={{ fontFamily: NU, fontSize: 14, color: C.white, margin: 0 }}>
                {field.value}
              </p>
            )}

            {field.type === 'textarea' && (
              <p style={{ fontFamily: NU, fontSize: 14, color: C.white, margin: 0, lineHeight: 1.6 }}>
                {field.value}
              </p>
            )}

            {field.type === 'richtext' && (
              <div style={{ fontFamily: NU, fontSize: 14, color: C.white, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: field.value }} />
            )}

            {field.type === 'url' && (
              <a href={field.value} style={{ fontFamily: NU, fontSize: 14, color: C.gold, textDecoration: 'none' }}>
                {field.value}
              </a>
            )}

            {field.type === 'number' && (
              <p style={{ fontFamily: NU, fontSize: 14, color: C.white, margin: 0 }}>
                {field.value}
              </p>
            )}

            {field.type === 'toggle' && (
              <p style={{ fontFamily: NU, fontSize: 14, color: C.white, margin: 0 }}>
                {field.value ? '✓ Enabled' : '✗ Disabled'}
              </p>
            )}

            {field.type === 'image' && field.value && (
              <img src={field.value} alt={field.label} style={{ maxWidth: '100%', height: 'auto', borderRadius: 4 }} />
            )}

            {field.type === 'video' && field.value && (
              <video controls style={{ maxWidth: '100%', height: 'auto', borderRadius: 4 }}>
                <source src={field.value} />
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
