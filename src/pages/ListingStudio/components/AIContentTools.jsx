import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

/**
 * AIContentTools, "Fill with AI" overlay panel for Listing Studio
 *
 * On trigger: reads venue name + location from formData, sends a single
 * AI call to `ai-generate`, receives structured JSON, populates fields.
 *
 * Fields generated:
 *   summary · description · amenities · seo_title · seo_description · seo_keywords
 *
 * Props:
 *   formData   {object}  Current form state (read venue name/location context)
 *   onChange   {fn}      handleChange(fieldName, value) from useListingForm
 *   listingId  {string}  Optional, passed to usage log
 *   onClose    {fn}      Called when panel is dismissed
 */

const FIELDS = [
  { key: 'summary',                    label: 'Editorial Summary',       hint: 'Short intro shown on listing cards (max 240 chars)' },
  { key: 'description',                label: 'About / Profile',         hint: 'Full venue description (rich HTML, 3–4 paragraphs)' },
  { key: 'amenities',                  label: 'Featured Amenities',      hint: 'Key features and offerings, comma-separated list' },
  { key: 'dining_description',         label: 'Catering & Dining',       hint: 'Editorial dining description (rich HTML, 1–2 paragraphs)' },
  { key: 'rooms_description',          label: 'Accommodation',           hint: 'Guest rooms & overnight experience (rich HTML, 1–2 paragraphs)' },
  { key: 'spaces_description',         label: 'Event Spaces & Ceremony', hint: 'Overview of ceremony spaces and event areas (rich HTML, 1–2 paragraphs)' },
  { key: 'exclusive_use_description',  label: 'Exclusive Use',           hint: 'Private hire description (2–3 sentences, plain text)' },
  { key: 'card_venue_description',     label: 'Card Description',        hint: 'Short teaser shown on venue cards (max 160 chars)' },
  { key: 'seo_title',                  label: 'SEO Title',               hint: 'Page title for search engines (max 60 chars)' },
  { key: 'seo_description',            label: 'SEO Description',         hint: 'Meta description (150–160 chars)' },
  { key: 'seo_keywords',               label: 'SEO Keywords',            hint: 'Up to 8 keyword phrases for search indexing' },
];

// Strip JSON code fences if the AI wraps its response
function extractJSON(raw) {
  const trimmed = raw.trim();
  // Handle ```json ... ``` or ``` ... ```
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  // Handle { ... } at root
  const braceStart = trimmed.indexOf('{');
  const braceEnd   = trimmed.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd !== -1) return trimmed.slice(braceStart, braceEnd + 1);
  return trimmed;
}

const AIContentTools = ({ formData = {}, onChange, listingId = null, onClose, darkMode = false }) => {
  const [selectedFields, setSelectedFields] = useState(
    FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: true }), {})
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview]           = useState(null); // generated JSON object
  const [error, setError]               = useState(null);
  const [applied, setApplied]           = useState(false);

  const venueName   = formData.venue_name  || '';
  const city        = formData.city        || '';
  const region      = formData.region      || '';
  const country     = formData.country     || '';
  const listingType = formData.listing_type || 'venue';
  const category    = formData.category    || 'wedding-venues';

  // Dark-mode colour tokens
  const DK = darkMode ? {
    panel:        '#111111',
    header:       '#0a0a0a',
    border:       '#2a2a2a',
    body:         '#111111',
    footer:       '#0d0d0d',
    card:         '#1a1a1a',
    labelText:    '#e0e0e0',
    hintText:     '#666666',
    previewLabel: '#C9A84C',
    previewText:  '#cccccc',
    infoBox:      '#1e1b10',
    infoBoxBorder:'#3a3220',
    warnBox:      '#1e1a00',
    warnBoxBorder:'#4a3c00',
    errBox:       '#1e0808',
    errBoxBorder: '#5a1a1a',
    spinnerBg:    '#2a2a2a',
    cancelBg:     'transparent',
    cancelColor:  '#888',
    cancelBorder: '#333',
    regenerate:   '#666',
  } : {
    panel:        '#fff',
    header:       '#0a0a0a',
    border:       '#e5ddd0',
    body:         '#fff',
    footer:       '#fafaf8',
    card:         '#fdfcfb',
    labelText:    '#222',
    hintText:     '#aaa',
    previewLabel: '#7a5f10',
    previewText:  '#555',
    infoBox:      '#f9f7f3',
    infoBoxBorder:'#e5ddd0',
    warnBox:      '#fef9ec',
    warnBoxBorder:'#f5d87e',
    errBox:       '#fef2f2',
    errBoxBorder: '#fecaca',
    spinnerBg:    '#e5ddd0',
    cancelBg:     'transparent',
    cancelColor:  '#888',
    cancelBorder: '#ddd4c8',
    regenerate:   '#aaa',
  };

  const canGenerate = !!venueName.trim();

  // Auto-start generation when panel opens if venue name is available
  useEffect(() => {
    if (canGenerate) {
      const t = setTimeout(() => handleGenerate(), 300);
      return () => clearTimeout(t);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleField = (key) =>
    setSelectedFields(prev => ({ ...prev, [key]: !prev[key] }));

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setPreview(null);
    setApplied(false);

    const activeKeys = FIELDS.filter(f => selectedFields[f.key]).map(f => f.key);
    if (activeKeys.length === 0) {
      setError('Select at least one field to generate.');
      setIsGenerating(false);
      return;
    }

    const locationParts = [city, region, country].filter(Boolean);
    const locationStr   = locationParts.length ? locationParts.join(', ') : 'location not specified';

    const systemPrompt = `You are a luxury wedding editorial writer for Luxury Wedding Directory, a premium venue and vendor discovery platform.
Write in a sophisticated, elegant tone that appeals to high-net-worth couples planning destination weddings.
Avoid clichés. Be specific, evocative, and aspirational.
Always return valid JSON only, no markdown, no prose outside the JSON object.`;

    const userPrompt = `Generate editorial content for this listing. Return ONLY a JSON object with these fields: ${activeKeys.join(', ')}.

Listing details:
- Name: ${venueName}
- Type: ${listingType} (${category.replace(/-/g, ' ')})
- Location: ${locationStr}

Field requirements:
- summary: Max 240 chars. One to two elegant sentences for card display. Plain text, no quotes.
- description: Rich HTML using <p> tags only. 3–4 paragraphs. Evocative, detailed, aspirational.
- amenities: Comma-separated list of key venue features and services (e.g. "Private chapel, Helicopter landing, 40-room estate, On-site catering").
- dining_description: Rich HTML using <p> tags only. 1–2 paragraphs about the culinary experience, cuisine style, sourcing, chef, atmosphere.
- rooms_description: Rich HTML using <p> tags only. 1–2 paragraphs about guest accommodations, room types, design, comfort, wedding night experience.
- spaces_description: Rich HTML using <p> tags only. 1–2 paragraphs describing the ceremony and event spaces, setting, ambiance, flexibility for different ceremony styles.
- exclusive_use_description: 2–3 sentences. Plain text. Describes the intimacy and appeal of hiring the entire estate privately, speak to luxury couples directly.
- card_venue_description: Max 160 chars. A single compelling teaser sentence for venue card display. Plain text, no quotes.
- seo_title: Max 60 chars. Natural language, include venue name and location.
- seo_description: 150–160 chars. Compelling meta description with a soft call to action.
- seo_keywords: JSON array of 6–8 keyword phrases (e.g. ["villa wedding italy", "tuscany wedding venue"]).

Return ONLY the JSON object. No explanation, no markdown fences.`;

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-generate', {
        body: {
          feature: 'listing_auto_fill',
          systemPrompt,
          userPrompt,
          venue_id: listingId || undefined,
        },
      });

      if (fnError) throw new Error(fnError.message || 'Edge Function error');
      if (data?.error) throw new Error(data.error);
      if (!data?.text) throw new Error('No content returned from AI');

      // Parse JSON from AI response
      let parsed;
      try {
        parsed = JSON.parse(extractJSON(data.text));
      } catch {
        throw new Error('AI returned malformed JSON. Try again.');
      }

      // Only keep the fields that were requested
      const filtered = {};
      for (const key of activeKeys) {
        if (parsed[key] !== undefined) filtered[key] = parsed[key];
      }

      setPreview(filtered);
    } catch (err) {
      console.error('AI fill error:', err);
      setError(err.message || 'Generation failed. Check AI settings.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (!preview) return;
    for (const [key, value] of Object.entries(preview)) {
      if (value !== undefined && value !== null) {
        onChange(key, value);
      }
    }
    setApplied(true);
    setTimeout(() => onClose(), 800);
  };

  // ── Render helpers ──────────────────────────────────────────────────────────
  const renderPreviewValue = (key, value) => {
    if (key === 'seo_keywords') {
      const arr = Array.isArray(value) ? value : [];
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
          {arr.map((kw, i) => (
            <span key={i} style={{
              padding: '2px 8px', fontSize: 11, borderRadius: 10,
              backgroundColor: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)',
              color: DK.previewLabel, fontWeight: 500,
            }}>
              {kw}
            </span>
          ))}
        </div>
      );
    }
    // HTML-rendered fields
    if (['description', 'dining_description', 'rooms_description', 'spaces_description'].includes(key)) {
      return (
        <div
          style={{ fontSize: 12, color: DK.previewText, marginTop: 4, lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: value }}
        />
      );
    }
    return <p style={{ fontSize: 12, color: DK.previewText, margin: '4px 0 0', lineHeight: 1.5 }}>{value}</p>;
  };

  return (
    <>
      {/* ── BACKDROP ────────────────────────────────────────────────────────── */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 900, backdropFilter: 'blur(2px)',
        }}
      />

      {/* ── PANEL ───────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0,
        width: 480,
        backgroundColor: DK.panel,
        boxShadow: '-4px 0 32px rgba(0,0,0,0.28)',
        zIndex: 901,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${DK.border}`,
          backgroundColor: DK.header,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff' }}>
              ✦ Fill with AI
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#888' }}>
              {venueName ? `Generating for "${venueName}"` : 'Add a venue name first'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: '#888',
              fontSize: 20, cursor: 'pointer', padding: '4px 8px',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body, scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', backgroundColor: DK.body }}>

          {/* Location context note */}
          {(city || region || country) && (
            <div style={{
              padding: '8px 12px', borderRadius: 4, marginBottom: 16,
              backgroundColor: DK.infoBox, border: `1px solid ${DK.infoBoxBorder}`,
              fontSize: 12, color: '#888',
            }}>
              📍 Using location context: <strong style={{ color: DK.previewText }}>
                {[city, region, country].filter(Boolean).join(', ')}
              </strong>
            </div>
          )}

          {/* No venue name warning */}
          {!canGenerate && (
            <div style={{
              padding: '12px 14px', borderRadius: 4, marginBottom: 16,
              backgroundColor: DK.warnBox, border: `1px solid ${DK.warnBoxBorder}`,
              fontSize: 12, color: '#92610d',
            }}>
              ⚠️ Enter a Listing Name in Basic Details before generating.
            </div>
          )}

          {/* Field selector */}
          {!preview && (
            <div style={{ marginBottom: 20 }}>
              <p style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.08em', color: DK.hintText, marginBottom: 12,
              }}>
                Fields to generate
              </p>
              {FIELDS.map(f => (
                <label
                  key={f.key}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    marginBottom: 10, cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedFields[f.key]}
                    onChange={() => toggleField(f.key)}
                    style={{ marginTop: 2, accentColor: '#C9A84C', flexShrink: 0 }}
                  />
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: DK.labelText }}>{f.label}</span>
                    <span style={{ fontSize: 11, color: DK.hintText, display: 'block', marginTop: 1 }}>{f.hint}</span>
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              padding: '12px 14px', borderRadius: 4, marginBottom: 16,
              backgroundColor: DK.errBox, border: `1px solid ${DK.errBoxBorder}`,
              fontSize: 12, color: '#f87171',
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Generating state */}
          {isGenerating && (
            <div style={{
              padding: '24px', textAlign: 'center',
              color: DK.hintText, fontSize: 13,
            }}>
              <div style={{
                width: 32, height: 32, border: `2px solid ${DK.spinnerBg}`,
                borderTopColor: '#C9A84C', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 12px',
              }} />
              Generating with AI…
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Preview */}
          {preview && !isGenerating && (
            <div>
              <p style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.08em', color: DK.hintText, marginBottom: 12,
              }}>
                Preview, review before applying
              </p>

              {FIELDS.filter(f => preview[f.key] !== undefined).map(f => (
                <div key={f.key} style={{
                  marginBottom: 16, padding: '12px 14px',
                  border: `1px solid ${DK.border}`, borderRadius: 4,
                  backgroundColor: DK.card,
                }}>
                  <p style={{
                    margin: 0, fontSize: 11, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    color: DK.previewLabel,
                  }}>
                    {f.label}
                  </p>
                  {renderPreviewValue(f.key, preview[f.key])}
                </div>
              ))}

              {/* Regenerate link */}
              <button
                type="button"
                onClick={() => { setPreview(null); setError(null); }}
                style={{
                  background: 'none', border: 'none',
                  color: DK.regenerate, fontSize: 12, cursor: 'pointer',
                  textDecoration: 'underline', padding: 0, marginBottom: 8,
                }}
              >
                ← Regenerate with different fields
              </button>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: `1px solid ${DK.border}`,
          backgroundColor: DK.footer,
          display: 'flex',
          gap: 10,
          flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1, padding: '10px', fontSize: 13, fontWeight: 500,
              backgroundColor: DK.cancelBg, color: DK.cancelColor,
              border: `1px solid ${DK.cancelBorder}`, borderRadius: 3, cursor: 'pointer',
            }}
          >
            Cancel
          </button>

          {!preview ? (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              style={{
                flex: 2, padding: '10px', fontSize: 13, fontWeight: 700,
                backgroundColor: canGenerate && !isGenerating ? '#C9A84C' : '#444',
                color: canGenerate && !isGenerating ? '#0a0a0a' : '#888',
                border: 'none', borderRadius: 3,
                cursor: canGenerate && !isGenerating ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s',
              }}
            >
              {isGenerating ? 'Generating…' : '✦ Generate'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleApply}
              style={{
                flex: 2, padding: '10px', fontSize: 13, fontWeight: 700,
                backgroundColor: applied ? '#15803d' : '#C9A84C',
                color: applied ? '#fff' : '#0a0a0a',
                border: 'none', borderRadius: 3,
                cursor: 'pointer', transition: 'background 0.2s',
              }}
            >
              {applied ? '✓ Applied!' : '↓ Apply to Listing'}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default AIContentTools;
