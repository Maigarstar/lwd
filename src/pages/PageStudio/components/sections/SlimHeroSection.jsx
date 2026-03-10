/**
 * SlimHeroSection — Hero section editor
 * Layout is locked. Editable content:
 * - Hero heading
 * - Hero subheading
 * - Hero CTA buttons
 * - Hero background media (images, videos, YouTube, Vimeo)
 * - Search bar: locked position, but placeholder text and button label are editable
 */

import BackgroundMediaControl from '../BackgroundMediaControl';

export default function SlimHeroSection({ section, onChange, C, NU, GD }) {
  if (!section) return null;

  const handleFieldChange = (field, value) => {
    onChange(section.id, field, value);
  };

  return (
    <div style={{ backgroundColor: C.card, borderRadius: 4, padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* HERO CONTENT — Editable */}
      <div style={{ paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
        <p style={{ fontFamily: NU, fontSize: 9, fontWeight: 600, color: C.grey, textTransform: 'uppercase', margin: '0 0 8px 0' }}>
          Hero Content
        </p>

        {/* Heading */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontFamily: NU, fontSize: 10, fontWeight: 600, color: C.grey2, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
            Heading
          </label>
          <input
            type="text"
            value={section.heading || ''}
            onChange={(e) => handleFieldChange('heading', e.target.value)}
            placeholder="Main heading text"
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

        {/* Subheading */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontFamily: NU, fontSize: 10, fontWeight: 600, color: C.grey2, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
            Subheading
          </label>
          <input
            type="text"
            value={section.subheading || ''}
            onChange={(e) => handleFieldChange('subheading', e.target.value)}
            placeholder="Subheading text"
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

        {/* CTA Button Group */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontFamily: NU, fontSize: 10, fontWeight: 600, color: C.grey2, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
            Primary CTA Button
          </label>
          <input
            type="text"
            value={section.ctaText || ''}
            onChange={(e) => handleFieldChange('ctaText', e.target.value)}
            placeholder="Button label"
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
              marginBottom: 6,
            }}
          />
          <input
            type="url"
            value={section.ctaUrl || ''}
            onChange={(e) => handleFieldChange('ctaUrl', e.target.value)}
            placeholder="Button URL"
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

        {/* Background Media Control */}
        <BackgroundMediaControl section={section} onChange={onChange} C={C} NU={NU} />
      </div>

      {/* LOCKED SEARCH BAR — Position fixed, text editable */}
      <div>
        <p style={{ fontFamily: NU, fontSize: 9, fontWeight: 600, color: C.grey, textTransform: 'uppercase', margin: '0 0 8px 0' }}>
          Search Bar (Locked in Position)
        </p>

        {/* Search Placeholder */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontFamily: NU, fontSize: 10, fontWeight: 600, color: C.grey2, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
            Search Placeholder
          </label>
          <input
            type="text"
            value={section.searchPlaceholder || ''}
            onChange={(e) => handleFieldChange('searchPlaceholder', e.target.value)}
            placeholder="Find me a Tuscan villa for 80 guests in June..."
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

        {/* Search Button Label */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontFamily: NU, fontSize: 10, fontWeight: 600, color: C.grey2, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
            Search Button Label
          </label>
          <input
            type="text"
            value={section.searchButtonLabel || 'ASK AURA'}
            onChange={(e) => handleFieldChange('searchButtonLabel', e.target.value)}
            placeholder="ASK AURA"
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

        {/* AI Suggestion Text */}
        <div>
          <label style={{ fontFamily: NU, fontSize: 10, fontWeight: 600, color: C.grey2, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
            AI Suggestion Text
          </label>
          <textarea
            value={section.aiSuggestionText || ''}
            onChange={(e) => handleFieldChange('aiSuggestionText', e.target.value)}
            placeholder="Not sure where to start? Ask Aura — get personalised venue suggestions instantly."
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
              minHeight: 50,
              resize: 'vertical',
            }}
          />
        </div>
      </div>

      <p style={{ fontFamily: NU, fontSize: 10, color: C.grey2, margin: 0, fontStyle: 'italic' }}>
        Note: Hero layout is locked. Only content text is editable.
      </p>
    </div>
  );
}
