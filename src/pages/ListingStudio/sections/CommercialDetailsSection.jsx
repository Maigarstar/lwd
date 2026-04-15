import { useState } from 'react';
import AIContentGenerator from '../../../components/AIAssistant/AIContentGenerator';
import { PRICING_LOOKUP_SYSTEM, buildPricingLookupPrompt } from '../../../lib/aiPrompts';

// Tolerant JSON extractor — strips markdown fences and falls back to first {...} block.
// Mirrors the helper in LocationSection so silent JSON.parse failures can't hide
// a malformed AI response.
function extractJsonObject(text) {
  if (typeof text !== 'string' || !text.trim()) return null;
  let cleaned = text.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  try { return JSON.parse(cleaned); } catch { /* fall through */ }
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

const CommercialDetailsSection = ({ formData, onChange }) => {
  const [showPricingAI, setShowPricingAI] = useState(false);

  // Build a location hint from whatever the form already has — gives the model
  // context to disambiguate same-named venues across countries.
  const locationHint = [
    formData?.city,
    formData?.region,
    formData?.country,
  ].filter(Boolean).join(', ');

  return (
    <section style={{ marginBottom: 16, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <h3 style={{ margin: 0 }}>Commercial Details</h3>
        <button
          type="button"
          onClick={() => setShowPricingAI(v => !v)}
          style={{ fontSize: 11, color: '#C9A84C', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
        >
          {showPricingAI ? '✦ Hide AI lookup' : '✦ Find pricing with AI'}
        </button>
      </div>
      <p style={{ fontSize: 12, color: '#999', marginBottom: showPricingAI ? 12 : 20, marginTop: 0 }}>
        Public starting price, currency, price band, and seated guest capacity
      </p>

      {showPricingAI && (
        <div style={{ marginBottom: 20 }}>
          <AIContentGenerator
            feature="pricing_lookup"
            systemPrompt={PRICING_LOOKUP_SYSTEM}
            userPrompt={buildPricingLookupPrompt(
              formData?.venue_name || formData?.name || '',
              formData?.website || formData?.website_url || formData?.url || '',
              locationHint
            )}
            venueId={formData?.id}
            onInsert={(text) => {
              const data = extractJsonObject(text);
              if (!data) {
                // eslint-disable-next-line no-alert
                alert(
                  'Could not parse pricing from AI response. The model returned ' +
                  'something that is not valid JSON. Try clicking Generate again ' +
                  'or fill the pricing manually.\n\nResponse was:\n\n' +
                  String(text).slice(0, 400)
                );
                return;
              }
              const fieldsApplied = [];
              // price_from arrives as a number or numeric string; normalise to integer string
              if (data.price_from !== undefined && data.price_from !== null && data.price_from !== '' && Number(data.price_from) > 0) {
                onChange('price_from', String(Math.round(Number(data.price_from))));
                fieldsApplied.push('price_from');
              }
              if (data.price_currency && typeof data.price_currency === 'string' && data.price_currency.trim()) {
                onChange('price_currency', data.price_currency.trim().slice(0, 3));
                fieldsApplied.push('price_currency');
              }
              if (data.price_range && typeof data.price_range === 'string' && data.price_range.trim()) {
                onChange('price_range', data.price_range.trim());
                fieldsApplied.push('price_range');
              }
              if (data.capacity !== undefined && data.capacity !== null && data.capacity !== '' && Number(data.capacity) > 0) {
                onChange('capacity', String(Math.round(Number(data.capacity))));
                fieldsApplied.push('capacity');
              }
              if (fieldsApplied.length === 0) {
                // eslint-disable-next-line no-alert
                alert(
                  'AI returned a JSON response but every field was empty — the ' +
                  'model could not confidently identify pricing for this venue. ' +
                  'Wedding venues rarely publish prices, so this is common. ' +
                  'Try giving it a website URL, or fill the pricing manually.'
                );
                return;
              }
              setShowPricingAI(false);
            }}
            label="Find Pricing"
          />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>Price Range</label>
          <input
            type="text"
            name="price_range"
            value={formData?.price_range || ""}
            onChange={(e) => onChange("price_range", e.target.value)}
            placeholder="€€€"
            style={{ width: "100%", padding: "10px 12px", fontSize: 13, border: "1px solid #ddd4c8", borderRadius: 3 }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>Capacity</label>
          <input
            type="number"
            name="capacity"
            value={formData?.capacity || ""}
            onChange={(e) => onChange("capacity", e.target.value)}
            placeholder="e.g., 150"
            style={{ width: "100%", padding: "10px 12px", fontSize: 13, border: "1px solid #ddd4c8", borderRadius: 3 }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>Starting From (number)</label>
          <input
            type="number"
            min="0"
            name="price_from"
            value={formData?.price_from || ""}
            onChange={(e) => onChange("price_from", e.target.value)}
            placeholder="e.g. 12000"
            style={{ width: "100%", padding: "10px 12px", fontSize: 13, border: "1px solid #ddd4c8", borderRadius: 3 }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>Currency Symbol</label>
          <input
            type="text"
            name="price_currency"
            value={formData?.price_currency || ""}
            onChange={(e) => onChange("price_currency", e.target.value)}
            placeholder="e.g. £ or $ or €"
            style={{ width: "100%", padding: "10px 12px", fontSize: 13, border: "1px solid #ddd4c8", borderRadius: 3 }}
          />
        </div>
      </div>
    </section>
  );
};

export default CommercialDetailsSection;
