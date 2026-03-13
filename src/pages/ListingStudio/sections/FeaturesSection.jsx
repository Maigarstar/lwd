import { useState } from 'react';
import AIContentGenerator from '../../../components/AIAssistant/AIContentGenerator';
import { LUXURY_TONE_SYSTEM, buildAmenitiesPrompt } from '../../../lib/aiPrompts';

const aiLinkStyle = {
  fontSize: 11, color: '#C9A84C', background: 'none', border: 'none',
  cursor: 'pointer', fontFamily: 'inherit', padding: 0,
};

const FeaturesSection = ({ formData, onChange }) => {
  const [showAmenitiesAI, setShowAmenitiesAI] = useState(false);

  return (
    <section style={{ marginBottom: 16, padding: 20 }}>
      <h3 style={{ marginBottom: 20 }}>Features & Amenities</h3>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
          Featured Amenities
        </label>
        <button type="button" onClick={() => setShowAmenitiesAI(v => !v)} style={aiLinkStyle}>
          ✦ Generate with AI
        </button>
      </div>

      {showAmenitiesAI && (
        <div style={{ marginBottom: 10 }}>
          <AIContentGenerator
            feature="amenities"
            systemPrompt={LUXURY_TONE_SYSTEM}
            userPrompt={buildAmenitiesPrompt(
              formData?.venue_name || formData?.name || '',
              { location: [formData?.city, formData?.region, formData?.country].filter(Boolean).join(', '),
                style: formData?.style, capacity: formData?.capacity }
            )}
            venueId={formData?.id}
            onInsert={(text) => { onChange('amenities', text); setShowAmenitiesAI(false); }}
            label="Generate Amenities"
          />
        </div>
      )}

      <textarea
        name="amenities"
        value={formData?.amenities || ""}
        onChange={(e) => onChange("amenities", e.target.value)}
        placeholder="List features, amenities, and highlights..."
        style={{ width: "100%", padding: "10px 12px", fontSize: 13, border: "1px solid #ddd4c8", borderRadius: 3, minHeight: 120, fontFamily: "inherit" }}
      />
      <p style={{ fontSize: 12, color: "#999", marginTop: 8 }}>Tip: List each feature on a new line or comma-separated</p>
    </section>
  );
};

export default FeaturesSection;
