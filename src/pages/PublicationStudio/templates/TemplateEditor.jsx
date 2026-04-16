// ─── TemplateEditor.jsx ──────────────────────────────────────────────────────
// Full-screen editor for a single template.
// Left panel: live TemplateCanvas preview.
// Right panel: scrollable form for all template fields.

import { useState, useRef, useCallback, useEffect } from 'react';
import TemplateCanvas from './TemplateCanvas';
import { renderToJpeg } from './renderToJpeg';
import {
  uploadPageImage,
  upsertPage,
  fetchPages,
} from '../../../services/magazinePageService';

// ── Design tokens ─────────────────────────────────────────────────────────────
const GOLD   = '#C9A84C';
const BG     = '#0A0908';
const SURF   = '#141210';
const BORDER = 'rgba(255,255,255,0.08)';
const MUTED  = 'rgba(255,255,255,0.4)';
const NU     = "var(--font-body, 'Nunito Sans', sans-serif)";
const GD     = "var(--font-heading-primary, 'Cormorant Garamond', Georgia, serif)";
const INPUT  = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 3, color: '#fff',
  fontFamily: NU, fontSize: 13,
  padding: '8px 10px', outline: 'none',
};

// ── AI personas (duplicated for self-containment) ─────────────────────────────
const PERSONAS = [
  { id: 'luxury-editorial', label: 'Luxury Editorial', emoji: '✦', sys: 'You are a senior editor at a prestigious luxury wedding magazine in the style of Vogue and Condé Nast Bride. Write with sophistication, elegance, and aspiration. Use elevated vocabulary, evocative imagery, and a tone that feels exclusive yet warmly inviting. Every sentence should feel considered.' },
  { id: 'romantic-dreamy',  label: 'Romantic',         emoji: '◇', sys: 'You are a romantic editorial writer for a high-end bridal magazine. Write with warmth, poetry, and emotional depth. Evoke the feeling of love, beauty, and the magic of weddings. Use lyrical, gentle, and evocative language.' },
  { id: 'modern-bold',      label: 'Modern & Bold',    emoji: '◈', sys: "You are a bold, modern magazine editor in the style of Harper's Bazaar. Write with confidence, directness, and contemporary energy. Be stylish and authoritative — strong, current, and impactful without being cold." },
  { id: 'minimal-refined',  label: 'Minimal',          emoji: '—', sys: 'You write in the Net-a-Porter / Bottega Veneta editorial style — spare, precise, and quietly confident. Never over-explain. Every word is deliberate. Restrained luxury. Say more with less.' },
  { id: 'cinematic',        label: 'Cinematic',        emoji: '▣', sys: 'You are a cinematic storyteller writing for a luxury publication. Write with visual, atmospheric language that paints vivid scenes. Think light, texture, movement, and emotion.' },
];

// ── Primitive UI ──────────────────────────────────────────────────────────────
function Btn({ children, onClick, gold, disabled, small }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: NU, fontSize: small ? 9 : 10, fontWeight: 700,
        letterSpacing: '0.07em', textTransform: 'uppercase',
        border: 'none', borderRadius: 3,
        padding: small ? '5px 10px' : '8px 16px',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.45 : 1, transition: 'all 0.15s',
        background: gold
          ? (hov ? '#b8954d' : GOLD)
          : (hov ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)'),
        color: gold ? '#1a1806' : 'rgba(255,255,255,0.7)',
      }}
    >{children}</button>
  );
}

function Lbl({ children, required }) {
  return (
    <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5 }}>
      {children}
      {required && <span style={{ color: 'rgba(201,168,76,0.7)', marginLeft: 4 }}>*</span>}
    </div>
  );
}

// ── AI Generate button + suggestion bar ───────────────────────────────────────
function AiGenerateBar({ fieldLabel, templateName, issueData, personaId, onAccept }) {
  const [loading, setLoading]     = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [err, setErr]             = useState('');

  const persona = PERSONAS.find(p => p.id === personaId) || PERSONAS[0];

  const handleGenerate = async () => {
    setLoading(true); setErr(''); setSuggestion(null);
    try {
      const { callAiGenerate } = await import('../../../lib/aiGenerate');
      const userPrompt = `Write ${fieldLabel} for a luxury wedding magazine page titled "${templateName}". Issue: ${issueData?.title || ''}, ${issueData?.season || ''} ${issueData?.year || ''}. Keep it concise and editorial. Return only the text, nothing else.`;
      const data = await callAiGenerate({
        feature:      `template_generate_${fieldLabel.toLowerCase().replace(/\s+/g, '_')}`,
        systemPrompt: persona.sys,
        userPrompt,
      });
      if (data?.text?.trim()) setSuggestion(data.text.trim());
      else setErr('No content returned.');
    } catch (e) {
      setErr(e.message || 'AI unavailable');
    }
    setLoading(false);
  };

  return (
    <div style={{ marginTop: 4 }}>
      <button
        onClick={handleGenerate}
        disabled={loading}
        style={{
          fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
          background: loading ? 'rgba(201,168,76,0.1)' : 'none',
          border: `1px solid ${loading ? GOLD : 'rgba(201,168,76,0.35)'}`,
          borderRadius: 2, padding: '3px 8px',
          color: loading ? GOLD : 'rgba(201,168,76,0.65)',
          cursor: loading ? 'default' : 'pointer', transition: 'all 0.15s',
        }}
      >
        {loading ? '⟳ Generating…' : '✧ Generate'}
      </button>

      {err && (
        <div style={{ fontFamily: NU, fontSize: 10, color: '#f87171', marginTop: 4 }}>{err}</div>
      )}

      {suggestion && (
        <div style={{ marginTop: 8, background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.22)', borderRadius: 4, padding: '10px 12px' }}>
          <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>✦ Suggestion</div>
          <div style={{ fontFamily: NU, fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.55, marginBottom: 10, whiteSpace: 'pre-wrap' }}>{suggestion}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn small gold onClick={() => { onAccept(suggestion); setSuggestion(null); }}>Accept</Btn>
            <Btn small onClick={() => setSuggestion(null)}>Dismiss</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Field renderers ───────────────────────────────────────────────────────────
function TextField({ field, value, onChange, templateName, issueData, personaId }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Lbl required={field.required}>{field.label}</Lbl>
      <input
        type="text"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder || ''}
        maxLength={field.maxLength}
        style={INPUT}
      />
      {field.maxLength && (
        <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, marginTop: 3 }}>
          {(value || '').length} / {field.maxLength}
        </div>
      )}
      {field.hint && (
        <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, marginTop: 3 }}>{field.hint}</div>
      )}
      <AiGenerateBar fieldLabel={field.label} templateName={templateName} issueData={issueData} personaId={personaId} onAccept={onChange} />
    </div>
  );
}

function TextareaField({ field, value, onChange, templateName, issueData, personaId }) {
  const rows = field.rows || 4;
  return (
    <div style={{ marginBottom: 16 }}>
      <Lbl required={field.required}>{field.label}</Lbl>
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder || ''}
        rows={rows}
        style={{ ...INPUT, resize: 'vertical' }}
      />
      {field.hint && (
        <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, marginTop: 3 }}>{field.hint}</div>
      )}
      <AiGenerateBar fieldLabel={field.label} templateName={templateName} issueData={issueData} personaId={personaId} onAccept={onChange} />
    </div>
  );
}

function ImageField({ field, value, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Lbl required={field.required}>{field.label}</Lbl>
      <input
        type="url"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder || 'Paste image URL or path'}
        style={INPUT}
      />
      {value && (
        <img
          src={value}
          alt=""
          style={{ marginTop: 8, width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 3, display: 'block' }}
          onError={e => { e.target.style.display = 'none'; }}
        />
      )}
      {field.hint && (
        <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, marginTop: 4 }}>{field.hint}</div>
      )}
      {!field.hint && (
        <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, marginTop: 4 }}>
          Paste a URL from your Media Library or any image URL
        </div>
      )}
    </div>
  );
}

function SelectField({ field, value, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Lbl>{field.label}</Lbl>
      <select
        value={value || field.default || (field.options?.[0] || '')}
        onChange={e => onChange(e.target.value)}
        style={{ ...INPUT, cursor: 'pointer' }}
      >
        {(field.options || []).map(opt => (
          <option key={opt} value={opt} style={{ background: '#1a1a18' }}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

// ── Compact persona pills for editor header ───────────────────────────────────
function PersonaPills({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
      {PERSONAS.map(p => {
        const active = value === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            title={p.label}
            style={{
              fontFamily: NU, fontSize: 9, fontWeight: 600,
              letterSpacing: '0.05em',
              padding: '4px 9px', borderRadius: 2,
              border: `1px solid ${active ? GOLD : 'rgba(255,255,255,0.1)'}`,
              background: active ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.03)',
              color: active ? GOLD : MUTED,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {p.emoji} {p.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Main TemplateEditor ───────────────────────────────────────────────────────

export default function TemplateEditor({ template, issueData, persona: initialPersona, onAdd, onClose }) {
  // Initialise field values from defaults
  const defaultValues = {};
  (template.fields || []).forEach(f => {
    if (f.default !== undefined) defaultValues[f.id] = f.default;
  });

  const [fieldValues, setFieldValues] = useState(defaultValues);
  const [rendering,   setRendering]   = useState(false);
  const [renderError, setRenderError] = useState('');
  const [personaId,   setPersonaId]   = useState(initialPersona || 'luxury-editorial');

  const canvasRef = useRef(null);

  const setField = useCallback((id, val) => {
    setFieldValues(prev => ({ ...prev, [id]: val }));
  }, []);

  // Check if required fields are filled
  const canAdd = (template.fields || [])
    .filter(f => f.required)
    .every(f => fieldValues[f.id] !== undefined && fieldValues[f.id] !== '');

  const handleAdd = async () => {
    if (!canvasRef.current || !issueData?.id) return;
    setRendering(true);
    setRenderError('');
    try {
      // Capture canvas
      const blob = await renderToJpeg(canvasRef.current, { scale: 3 });

      // Get next page number
      const { data: existingPages } = await fetchPages(issueData.id);
      const maxPage = existingPages?.length
        ? Math.max(...existingPages.map(p => p.page_number))
        : 0;
      const nextPage = maxPage + 1;

      // Upload image
      const renderVersion = issueData.render_version || 1;
      const { publicUrl, storagePath, error: uploadErr } = await uploadPageImage(
        issueData.id, renderVersion, nextPage, blob
      );
      if (uploadErr) throw uploadErr;

      // Upsert page record
      const { data: newPage, error: upsertErr } = await upsertPage({
        issue_id:      issueData.id,
        page_number:   nextPage,
        image_url:     publicUrl,
        storage_path:  storagePath,
        source_type:   'template',
        template_data: { templateId: template.id, fields: fieldValues },
      });
      if (upsertErr) throw upsertErr;

      onAdd(newPage);
    } catch (e) {
      console.error('[TemplateEditor] handleAdd error:', e);
      setRenderError(e.message || 'Render failed. Please try again.');
    }
    setRendering(false);
  };

  // Preview width: fill left panel minus padding
  // We'll use a container ref to size the canvas
  const [previewWidth, setPreviewWidth] = useState(380);
  const previewPanelRef = useRef(null);

  useEffect(() => {
    if (!previewPanelRef.current) return;
    const observer = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect?.width;
      if (w) setPreviewWidth(Math.floor(w - 48));
    });
    observer.observe(previewPanelRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 910,
      background: BG,
      display: 'flex', flexDirection: 'column',
      fontFamily: NU,
    }}>

      {/* ── Header ── */}
      <div style={{
        height: 56, flexShrink: 0,
        borderBottom: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center',
        padding: '0 20px', gap: 14,
        background: SURF,
      }}>
        {/* Back */}
        <button
          onClick={onClose}
          style={{
            background: 'none', border: `1px solid ${BORDER}`,
            color: MUTED, cursor: 'pointer', fontFamily: NU,
            fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
            textTransform: 'uppercase', padding: '5px 12px', borderRadius: 3,
          }}
        >
          ← Back
        </button>

        {/* Template name */}
        <div style={{ fontFamily: GD, fontSize: 17, fontStyle: 'italic', color: '#fff' }}>
          {template.name}
        </div>
        <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, padding: '3px 8px', border: `1px solid ${BORDER}`, borderRadius: 10 }}>
          {template.category}
        </div>

        {/* Persona pills */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, marginLeft: 8, overflow: 'hidden' }}>
          <span style={{ fontFamily: NU, fontSize: 9, color: MUTED, flexShrink: 0 }}>AI Voice:</span>
          <PersonaPills value={personaId} onChange={setPersonaId} />
        </div>

        {/* Add to Issue button */}
        {renderError && (
          <div style={{ fontFamily: NU, fontSize: 10, color: '#f87171', maxWidth: 200, textAlign: 'right' }}>
            {renderError}
          </div>
        )}
        <Btn gold onClick={handleAdd} disabled={rendering || !canAdd}>
          {rendering ? '⟳ Rendering…' : '↑ Add to Issue'}
        </Btn>
      </div>

      {/* ── Body: left preview | right form ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Left 58%: live preview ── */}
        <div
          ref={previewPanelRef}
          style={{
            width: '58%', flexShrink: 0,
            borderRight: `1px solid ${BORDER}`,
            background: '#0a0908',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '24px',
            overflow: 'hidden',
          }}
        >
          <div
            ref={canvasRef}
            style={{
              boxShadow: '0 16px 64px rgba(0,0,0,0.7)',
              flexShrink: 0,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            <TemplateCanvas
              templateId={template.id}
              fields={fieldValues}
              pageSize={issueData?.page_size || 'A4'}
              width={previewWidth}
            />
          </div>
          {/* Template description below preview */}
          <div style={{ marginTop: 14, fontFamily: NU, fontSize: 10, color: MUTED, textAlign: 'center', maxWidth: previewWidth }}>
            {template.description}
          </div>
        </div>

        {/* ── Right 42%: form ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

          {/* Section heading */}
          <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 18 }}>
            ✦ Template Fields
          </div>

          {!canAdd && (
            <div style={{ fontFamily: NU, fontSize: 10, color: 'rgba(251,191,36,0.8)', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.18)', borderRadius: 3, padding: '8px 12px', marginBottom: 16 }}>
              Fill all required fields (*) before adding to the issue.
            </div>
          )}

          {/* Fields */}
          {(template.fields || []).map(field => {
            const val = fieldValues[field.id];
            const change = (v) => setField(field.id, v);

            switch (field.type) {
              case 'image':
                return <ImageField key={field.id} field={field} value={val} onChange={change} />;
              case 'textarea':
                return <TextareaField key={field.id} field={field} value={val} onChange={change} templateName={template.name} issueData={issueData} personaId={personaId} />;
              case 'select':
                return <SelectField key={field.id} field={field} value={val} onChange={change} />;
              case 'text':
              default:
                return <TextField key={field.id} field={field} value={val} onChange={change} templateName={template.name} issueData={issueData} personaId={personaId} />;
            }
          })}

          {/* Bottom: Add to Issue */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${BORDER}` }}>
            <Btn gold onClick={handleAdd} disabled={rendering || !canAdd}>
              {rendering ? '⟳ Rendering…' : '↑ Add to Issue'}
            </Btn>
            {renderError && (
              <div style={{ fontFamily: NU, fontSize: 10, color: '#f87171', marginTop: 8 }}>{renderError}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
