/**
 * seo-studio/panels.jsx — All React sub-components (UI panels) for SEO Studio
 */

import React, { useState, useEffect, useRef, Component } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { G, NU, GD, gradeColor, severityIcon } from './tokens';
import { estimateImpact } from './scoring';
import { callAI } from './ai';

// ── Error Boundary ──────────────────────────────────────────────────────────

export class SeoStudioErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[AiSeoStudio] Error boundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: 'calc(100vh - 60px)', fontFamily: 'var(--font-body)', color: '#6b7280',
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>{':('}</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>Something went wrong</div>
          <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20, maxWidth: 400, textAlign: 'center', lineHeight: 1.6 }}>
            The SEO Studio encountered an unexpected error. Your data is safe.
          </div>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); }}
            style={{
              padding: '10px 24px', fontSize: 13, fontWeight: 700,
              background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 6,
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Toast ────────────────────────────────────────────────────────────────────

export function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      padding: '12px 20px', borderRadius: 6,
      background: type === 'error' ? '#fef2f2' : '#f0fdf4',
      border: `1px solid ${type === 'error' ? '#fca5a5' : '#86efac'}`,
      color: type === 'error' ? '#991b1b' : '#166534',
      fontSize: 13, fontFamily: NU, fontWeight: 500,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    }}>
      {msg}
    </div>
  );
}

// ── SERP Preview ─────────────────────────────────────────────────────────────

export function SerpPreview({ title, description, url, DK }) {
  const displayUrl = url || 'luxuryweddingdirectory.com';
  const tLen = (title || '').length;
  const dLen = (description || '').length;
  // Approximate pixel-width: ~10px per char for titles at 20px font, ~7px per char for desc at 14px
  const titleTruncated = tLen > 58;
  const descTruncated = dLen > 160;
  return (
    <div style={{ background: DK ? '#1e1e1e' : '#fff', borderRadius: 8, padding: 20, border: `1px solid ${DK ? '#333' : '#e5e7eb'}`, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af' }}>
          Google Search Preview
        </span>
        <span style={{ fontSize: 10, color: tLen > 60 ? '#ef4444' : '#9ca3af' }}>
          {tLen > 60 ? `Title truncated at 60 chars (${tLen})` : ''}
        </span>
      </div>
      <div style={{ fontFamily: 'Arial, sans-serif', position: 'relative' }}>
        <div style={{ fontSize: 12, color: DK ? '#bbb' : '#202124', marginBottom: 2 }}>{displayUrl}</div>
        <div style={{ position: 'relative' }}>
          <div style={{
            fontSize: 20, color: DK ? '#8ab4f8' : '#1a0dab', fontWeight: 400, lineHeight: 1.3, marginBottom: 4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {title || <span style={{ color: '#999', fontStyle: 'italic' }}>No title set</span>}
          </div>
          {/* Pixel-width truncation indicator for title (~600px Google width, approx 58 chars at this font) */}
          {title && title.length > 0 && (
            <div style={{
              position: 'absolute', top: 0, bottom: 0,
              left: 'min(100%, 580px)',
              borderLeft: titleTruncated ? '2px dashed #ef4444' : 'none',
              opacity: titleTruncated ? 0.6 : 0,
              pointerEvents: 'none',
            }} />
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{
            fontSize: 14, color: DK ? '#aaa' : '#4d5156', lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {description || <span style={{ color: '#999', fontStyle: 'italic' }}>No meta description -- Google will auto-generate one</span>}
          </div>
        </div>
      </div>
      {/* Truncation warnings */}
      {titleTruncated && (
        <div style={{ marginTop: 6, fontSize: 10, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#ef4444', opacity: 0.3 }} />
          Likely truncated in search results ({tLen} chars, ~58 max visible)
        </div>
      )}
      {descTruncated && (
        <div style={{ marginTop: 4, fontSize: 10, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#ef4444', opacity: 0.3 }} />
          Description will be cut at ~160 chars ({dLen} currently)
        </div>
      )}
    </div>
  );
}

// ── Social Preview (OG) ─────────────────────────────────────────────────────

export function SocialPreview({ title, description, image, url, DK }) {
  return (
    <div style={{ background: DK ? '#1e1e1e' : '#fff', borderRadius: 8, padding: 20, border: `1px solid ${DK ? '#333' : '#e5e7eb'}`, marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 12 }}>
        Social Share Preview
      </div>
      <div style={{ border: `1px solid ${DK ? '#444' : '#dadce0'}`, borderRadius: 8, overflow: 'hidden' }}>
        {image ? (
          <img src={image} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: 100, background: DK ? '#2a2a2a' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>No OG image -- posts will appear without a preview image</span>
          </div>
        )}
        <div style={{ padding: '10px 14px', borderTop: `1px solid ${DK ? '#444' : '#dadce0'}` }}>
          <div style={{ fontSize: 11, color: DK ? '#999' : '#606770', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            {url || 'luxuryweddingdirectory.com'}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: DK ? '#e0e0e0' : '#1d2129', lineHeight: 1.3, marginTop: 2 }}>
            {title || 'Untitled'}
          </div>
          {description && (
            <div style={{ fontSize: 13, color: DK ? '#999' : '#606770', marginTop: 2, lineHeight: 1.4 }}>
              {description.slice(0, 100)}{description.length > 100 ? '...' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Score Ring ───────────────────────────────────────────────────────────────

export function ScoreRing({ pct, size = 48, label, DK }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 90 ? '#10b981' : pct >= 75 ? '#22c55e' : pct >= 55 ? '#f59e0b' : pct >= 30 ? '#f97316' : '#ef4444';
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={DK ? '#333' : '#f3f4f6'} strokeWidth={3} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 0.4s ease' }} />
      <text x={size/2} y={label ? size/2 - 4 : size/2} textAnchor="middle" dominantBaseline="central"
        fontSize={size * 0.26} fontWeight={700} fill={color} fontFamily={NU}>
        {pct}
      </text>
      {label && (
        <text x={size/2} y={size/2 + 8} textAnchor="middle" dominantBaseline="central"
          fontSize={7} fill="#9ca3af" fontFamily={NU}>
          {label}
        </text>
      )}
    </svg>
  );
}

// ── Field Editor Row ─────────────────────────────────────────────────────────

export function FieldRow({ label, value, onChange, maxLen, minLen, placeholder, generating, onGenerate, onUndo, undoValue, multiline, DK }) {
  const len = (value || '').length;
  const isOver = maxLen && len > maxLen;
  const isOptimal = minLen && maxLen && len >= minLen && len <= maxLen;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: DK ? '#d1d5db' : '#374151' }}>
          {label}
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {maxLen && (
            <span style={{ fontSize: 10, color: isOptimal ? '#10b981' : isOver ? '#ef4444' : '#9ca3af', fontWeight: isOptimal ? 600 : 400 }}>
              {len}/{maxLen}{isOptimal ? ' \u2713' : ''}
            </span>
          )}
          {undoValue !== undefined && undoValue !== value && (
            <button type="button" onClick={onUndo} title="Undo AI change" style={{
              fontSize: 10, padding: '2px 6px', borderRadius: 3,
              background: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5',
              cursor: 'pointer', fontFamily: NU,
            }}>{'↩'} Undo</button>
          )}
          {undoValue !== undefined && undoValue !== value && (
            <span style={{ fontSize: 9, color: '#8b5cf6', fontWeight: 600, letterSpacing: '0.03em' }}>AI</span>
          )}
          {onGenerate && (
            <button type="button" onClick={onGenerate} disabled={generating} style={{
              fontSize: 10, fontWeight: 700, fontFamily: NU, padding: '3px 10px', borderRadius: 3,
              background: generating ? (DK ? '#333' : '#f3f4f6') : G, color: generating ? '#9ca3af' : '#fff',
              border: 'none', cursor: generating ? 'wait' : 'pointer', letterSpacing: '0.03em',
            }}>
              {generating ? '...' : '\u2726 AI'}
            </button>
          )}
        </div>
      </div>
      {multiline ? (
        <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
          style={{
            width: '100%', padding: '9px 12px', fontSize: 13,
            border: `1px solid ${isOver ? '#fca5a5' : isOptimal ? '#86efac' : DK ? '#555' : '#d1d5db'}`,
            borderRadius: 4, fontFamily: NU, color: DK ? '#f0f0f0' : '#1f2937',
            resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5, background: DK ? '#252525' : '#fff',
          }} />
      ) : (
        <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{
            width: '100%', padding: '9px 12px', fontSize: 13,
            border: `1px solid ${isOver ? '#fca5a5' : isOptimal ? '#86efac' : DK ? '#555' : '#d1d5db'}`,
            borderRadius: 4, fontFamily: NU, color: DK ? '#f0f0f0' : '#1f2937', boxSizing: 'border-box', background: DK ? '#252525' : '#fff',
          }} />
      )}
      {/* Optimal range hint bar */}
      {minLen && maxLen && (
        <div style={{ marginTop: 4, height: 3, borderRadius: 2, background: DK ? '#333' : '#f3f4f6', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', height: '100%', borderRadius: 2,
            background: isOptimal ? '#10b981' : isOver ? '#ef4444' : '#f59e0b',
            width: `${Math.min(100, (len / maxLen) * 100)}%`,
            transition: 'width 0.2s, background 0.2s',
          }} />
        </div>
      )}
    </div>
  );
}

// ── Keywords Tag Editor ──────────────────────────────────────────────────────

export function KeywordsEditor({ value = [], onChange, generating, onGenerate, onUndo, undoValue, DK }) {
  const [input, setInput] = useState('');
  const addKeyword = () => {
    const kw = input.trim();
    if (kw && !value.includes(kw)) { onChange([...value, kw]); setInput(''); }
  };
  const removeKeyword = (idx) => onChange(value.filter((_, i) => i !== idx));

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: DK ? '#d1d5db' : '#374151' }}>
          Keywords
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: value.length >= 5 && value.length <= 8 ? '#10b981' : '#9ca3af', fontWeight: value.length >= 5 ? 600 : 400 }}>
            {value.length}/8{value.length >= 5 && value.length <= 8 ? ' \u2713' : ''}
          </span>
          {undoValue !== undefined && JSON.stringify(undoValue) !== JSON.stringify(value) && (
            <button type="button" onClick={onUndo} title="Undo AI change" style={{
              fontSize: 10, padding: '2px 6px', borderRadius: 3,
              background: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5',
              cursor: 'pointer', fontFamily: NU,
            }}>{'↩'} Undo</button>
          )}
          {onGenerate && (
            <button type="button" onClick={onGenerate} disabled={generating} style={{
              fontSize: 10, fontWeight: 700, fontFamily: NU, padding: '3px 10px', borderRadius: 3,
              background: generating ? (DK ? '#333' : '#f3f4f6') : G, color: generating ? '#9ca3af' : '#fff',
              border: 'none', cursor: generating ? 'wait' : 'pointer', letterSpacing: '0.03em',
            }}>
              {generating ? '...' : '\u2726 AI'}
            </button>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: value.length ? 8 : 0 }}>
        {value.map((kw, idx) => (
          <span key={idx} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', fontSize: 12, borderRadius: 12,
            background: DK ? '#3a3018' : '#fef3c7', color: DK ? '#d4a850' : '#92400e', fontWeight: 500,
          }}>
            {kw}
            <button type="button" onClick={() => removeKeyword(idx)} style={{
              background: 'none', border: 'none', cursor: 'pointer', fontSize: 14,
              color: DK ? '#d4a850' : '#92400e', padding: 0, lineHeight: 1,
            }}>{'×'}</button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); }}}
          placeholder="Type keyword + Enter"
          style={{ flex: 1, padding: '7px 10px', fontSize: 12, border: `1px solid ${DK ? '#555' : '#d1d5db'}`, borderRadius: 4, fontFamily: NU, boxSizing: 'border-box', background: DK ? '#252525' : '#fff', color: DK ? '#f0f0f0' : '#1f2937' }} />
        <button type="button" onClick={addKeyword} style={{
          padding: '7px 14px', fontSize: 11, fontWeight: 600,
          background: DK ? '#333' : '#f3f4f6', border: `1px solid ${DK ? '#555' : '#d1d5db'}`, borderRadius: 4, cursor: 'pointer', fontFamily: NU, color: DK ? '#d1d5db' : '#374151',
        }}>Add</button>
      </div>
    </div>
  );
}

// ── OG Image Field (URL + Upload) ────────────────────────────────────────────

export function OgImageField({ value, onChange, entityType, entitySlug, DK }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const handleUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const bucket = entityType === 'listing' ? 'listing-media' : 'showcase-media';
      const folder = entityType === 'article' ? 'og-images/articles' : `og-images/${entitySlug || 'general'}`;
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;

      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '31536000', upsert: true, contentType: file.type,
      });
      if (error) throw error;

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      console.error('[OgImageField] upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: DK ? '#d1d5db' : '#374151' }}>
          OG Image
        </label>
        {value && (
          <button type="button" onClick={() => onChange('')} style={{
            fontSize: 10, padding: '2px 6px', borderRadius: 3,
            background: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5',
            cursor: 'pointer', fontFamily: NU,
          }}>Remove</button>
        )}
      </div>

      {/* URL input */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <input type="text" value={value || ''} onChange={e => onChange(e.target.value)}
          placeholder="https://... or upload below"
          style={{
            flex: 1, padding: '8px 10px', fontSize: 12,
            border: `1px solid ${DK ? '#555' : '#d1d5db'}`, borderRadius: 4, fontFamily: NU,
            color: DK ? '#f0f0f0' : '#1f2937', boxSizing: 'border-box', background: DK ? '#252525' : '#fff',
          }} />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          style={{
            padding: '8px 12px', fontSize: 11, fontWeight: 600, fontFamily: NU,
            borderRadius: 4, border: `1px solid ${DK ? '#555' : '#d1d5db'}`, background: DK ? '#333' : '#f9fafb',
            color: DK ? '#d1d5db' : '#374151', cursor: uploading ? 'wait' : 'pointer',
            whiteSpace: 'nowrap',
          }}>
          {uploading ? 'Uploading...' : '\u2191 Upload'}
        </button>
      </div>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }} />

      {/* Drop zone / preview */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          borderRadius: 6, overflow: 'hidden',
          border: `2px dashed ${dragOver ? G : value ? (DK ? '#444' : '#e5e7eb') : (DK ? '#555' : '#d1d5db')}`,
          background: dragOver ? (DK ? '#2a2518' : '#fef9ee') : value ? (DK ? '#1e1e1e' : '#fafafa') : (DK ? '#252525' : '#f9fafb'),
          transition: 'all 0.15s',
          cursor: 'pointer', position: 'relative',
        }}
        onClick={() => { if (!value) fileRef.current?.click(); }}
      >
        {value ? (
          <div style={{ position: 'relative' }}>
            <img src={value} alt="OG preview" style={{
              width: '100%', height: 120, objectFit: 'cover', display: 'block',
            }} onError={e => { e.target.style.display = 'none'; }} />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '4px 8px', background: 'rgba(0,0,0,0.6)',
              fontSize: 9, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {value.length > 60 ? '...' + value.slice(-55) : value}
            </div>
          </div>
        ) : (
          <div style={{
            padding: '16px 12px', textAlign: 'center',
            fontSize: 11, color: '#9ca3af', lineHeight: 1.6,
          }}>
            {uploading ? (
              <span style={{ color: G, fontWeight: 600 }}>Uploading...</span>
            ) : (
              <>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{'🖼️'}</div>
                <div>Drop image here or click to upload</div>
                <div style={{ fontSize: 10, color: DK ? '#666' : '#d1d5db', marginTop: 2 }}>1200x630px recommended for social sharing</div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── AI Recommendations Panel ─────────────────────────────────────────────────

export function RecommendationsPanel({ quality, DK, scoreDelta }) {
  if (!quality) return null;
  const { score, grade, issues, passes } = quality;

  return (
    <div style={{ background: DK ? '#1e1e1e' : '#fff', borderRadius: 8, border: `1px solid ${DK ? '#333' : '#e5e7eb'}`, padding: 20, marginBottom: 16 }}>
      {quality.opportunity && quality.opportunity !== 'optimised' && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 10, marginBottom: 10,
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
          background: quality.opportunity === 'high' ? (DK ? '#1a2e1a' : '#f0fdf4') : quality.opportunity === 'medium' ? (DK ? '#2a2a1a' : '#fffbeb') : (DK ? '#2a2a2a' : '#f9fafb'),
          color: quality.opportunity === 'high' ? '#10b981' : quality.opportunity === 'medium' ? '#f59e0b' : '#9ca3af',
          border: `1px solid ${quality.opportunity === 'high' ? (DK ? '#2d5a2d' : '#bbf7d0') : quality.opportunity === 'medium' ? (DK ? '#5a4a1a' : '#fde68a') : (DK ? '#444' : '#e5e7eb')}`,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
          {quality.opportunity === 'high' ? 'High opportunity — strong content, weak metadata' : quality.opportunity === 'medium' ? 'Medium opportunity — room to improve' : 'Low upside — needs content investment'}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: G }}>
          SEO Health
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: gradeColor(grade), fontFamily: NU }}>{grade}</span>
          <span style={{ fontSize: 12, color: DK ? '#9ca3af' : '#6b7280' }}>{score}/100</span>
          {scoreDelta !== null && scoreDelta !== 0 && (
            <span style={{ fontSize: 10, fontWeight: 600, color: scoreDelta > 0 ? '#10b981' : '#ef4444' }}>
              {scoreDelta > 0 ? '\u2191' : '\u2193'} {scoreDelta > 0 ? '+' : ''}{scoreDelta} since last save
            </span>
          )}
        </div>
      </div>

      {/* Issues */}
      {issues.length > 0 && (
        <div style={{ marginBottom: passes.length > 0 ? 12 : 0 }}>
          {issues.map((iss, i) => (
            <div key={i} style={{
              padding: '8px 10px', marginBottom: 4, borderRadius: 5,
              background: iss.severity === 'critical' ? (DK ? '#3b1515' : '#fef2f2') : iss.severity === 'important' ? (DK ? '#3b3015' : '#fffbeb') : (DK ? '#152535' : '#f0f9ff'),
              border: `1px solid ${iss.severity === 'critical' ? (DK ? '#7f1d1d' : '#fecaca') : iss.severity === 'important' ? (DK ? '#78600a' : '#fde68a') : (DK ? '#1e3a5f' : '#bfdbfe')}`,
              fontSize: 12, lineHeight: 1.5,
            }}>
              <div style={{ fontWeight: 600, color: DK ? '#f0f0f0' : '#1f2937' }}>
                {severityIcon(iss.severity)} {iss.msg}
              </div>
              <div style={{ color: DK ? '#9ca3af' : '#6b7280', fontSize: 11, marginTop: 2 }}>
                {'💡'} {iss.tip}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Passes */}
      {passes.length > 0 && (
        <div>
          {passes.map((p, i) => (
            <div key={i} style={{ fontSize: 11, color: '#059669', padding: '3px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
              {'✅'} {p}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Competitor Insights Panel ────────────────────────────────────────────────

export function CompetitorInsightsPanel({ analysis, loading, collapsed, onToggle, DK }) {
  if (!analysis && !loading) return null;

  return (
    <div style={{ background: DK ? '#1e1e1e' : '#fff', borderRadius: 8, border: `1px solid ${DK ? '#333' : '#e5e7eb'}`, marginBottom: 16, overflow: 'hidden' }}>
      <button onClick={onToggle} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer',
        borderBottom: collapsed ? 'none' : `1px solid ${DK ? '#333' : '#f3f4f6'}`,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: G }}>
          Competitor Insights
        </span>
        <span style={{ fontSize: 12, color: '#9ca3af', transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s' }}>
          {'▼'}
        </span>
      </button>
      {!collapsed && (
        <div style={{ padding: '0 20px 20px' }}>
          {loading ? (
            <div style={{ padding: '20px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 6 }}>Analysing competitors...</div>
              <div style={{ width: '100%', height: 3, borderRadius: 2, background: DK ? '#333' : '#f3f4f6', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: '60%', background: G, borderRadius: 2,
                  animation: 'seoSlide 1.5s ease-in-out infinite',
                }} />
              </div>
              <style>{`@keyframes seoSlide { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } } @keyframes seoPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }`}</style>
            </div>
          ) : analysis ? (
            <div>
              {analysis.searchQuery && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: DK ? '#d1d5db' : '#374151', marginBottom: 4 }}>Target Query</div>
                  <div style={{ fontSize: 13, color: DK ? '#f0f0f0' : '#1a1a1a', padding: '6px 10px', background: DK ? '#252525' : '#f9fafb', borderRadius: 4, border: `1px solid ${DK ? '#444' : '#e5e7eb'}`, fontStyle: 'italic' }}>
                    "{analysis.searchQuery}"
                  </div>
                </div>
              )}
              {analysis.patterns && analysis.patterns.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: DK ? '#d1d5db' : '#374151', marginBottom: 6 }}>Competitor Patterns</div>
                  {analysis.patterns.map((p, i) => (
                    <div key={i} style={{ fontSize: 12, color: DK ? '#bbb' : '#4b5563', padding: '4px 0', lineHeight: 1.5, display: 'flex', gap: 6 }}>
                      <span style={{ color: '#9ca3af', flexShrink: 0 }}>{'•'}</span>
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              )}
              {analysis.suggestions && analysis.suggestions.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: DK ? '#d1d5db' : '#374151', marginBottom: 6 }}>Suggestions to Outrank</div>
                  {analysis.suggestions.map((s, i) => (
                    <div key={i} style={{
                      fontSize: 12, color: DK ? '#f0f0f0' : '#1f2937', padding: '6px 10px', marginBottom: 4,
                      background: DK ? '#1a2e1a' : '#f0fdf4', border: `1px solid ${DK ? '#2d5a2d' : '#bbf7d0'}`, borderRadius: 4, lineHeight: 1.5,
                    }}>
                      {'💡'} {s}
                    </div>
                  ))}
                </div>
              )}
              {analysis.competitorTitles && analysis.competitorTitles.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: DK ? '#d1d5db' : '#374151', marginBottom: 6 }}>Top Competitor Title Examples</div>
                  {analysis.competitorTitles.map((t, i) => (
                    <div key={i} style={{
                      fontSize: 12, color: DK ? '#8ab4f8' : '#1a0dab', padding: '6px 10px', marginBottom: 3,
                      background: DK ? '#252525' : '#fafaf8', border: `1px solid ${DK ? '#444' : '#e5e7eb'}`, borderRadius: 4,
                      fontFamily: 'Arial, sans-serif',
                    }}>
                      {i + 1}. {t}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ── Page Audit Panel ────────────────────────────────────────────────────────

export function PageAuditPanel({ audit, DK }) {
  if (!audit) return null;
  return (
    <div style={{ background: DK ? '#1e1e1e' : '#fff', borderRadius: 8, border: `1px solid ${DK ? '#333' : '#e5e7eb'}`, padding: '14px 20px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: G }}>
          Page Content Audit
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: audit.score >= 80 ? '#10b981' : audit.score >= 50 ? '#f59e0b' : '#ef4444' }}>
          {audit.score}%
        </span>
      </div>
      {audit.checks.map((c, i) => (
        <div key={i} style={{
          fontSize: 11, padding: '4px 0', display: 'flex', alignItems: 'flex-start', gap: 6,
          color: c.pass ? '#059669' : (DK ? '#9ca3af' : '#6b7280'),
        }}>
          <span style={{ flexShrink: 0 }}>{c.pass ? '\u2705' : '\u274C'}</span>
          <div>
            <div style={{ fontWeight: 600 }}>{c.label}</div>
            <div style={{ fontSize: 10, color: DK ? '#777' : '#9ca3af', marginTop: 1 }}>{c.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Cannibalisation Panel ──────────────────────────────────────────────────

export function CannibalisationPanel({ conflicts, DK, onResolve, loading, fixingAction, primaryPages = {} }) {
  if (loading) {
    return (
      <div style={{ background: DK ? '#1e1e1e' : '#fff', borderRadius: 8, border: `1px solid ${DK ? '#333' : '#e5e7eb'}`, padding: '14px 20px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: DK ? '#9ca3af' : '#6b7280' }}>
          Cannibalisation Check
        </div>
        <div style={{ fontSize: 11, color: DK ? '#555' : '#d1d5db', marginTop: 6 }}>
          Scanning across entity types...
        </div>
      </div>
    );
  }
  if (!conflicts || conflicts.length === 0) {
    return (
      <div style={{ background: DK ? '#1e1e1e' : '#fff', borderRadius: 8, border: `1px solid ${DK ? '#333' : '#e5e7eb'}`, padding: '14px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#10b981' }}>
            Cannibalisation Check
          </span>
          <span style={{ fontSize: 10, color: '#10b981', fontWeight: 600 }}>Clear</span>
        </div>
        <div style={{ fontSize: 11, color: DK ? '#777' : '#9ca3af', marginTop: 6 }}>
          No competing pages detected across listings, showcases, or articles.
        </div>
      </div>
    );
  }
  return (
    <div style={{ background: DK ? '#1e1e1e' : '#fff', borderRadius: 8, border: `1px solid ${DK ? '#333' : '#e5e7eb'}`, padding: '14px 20px', marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#ef4444', marginBottom: 10 }}>
        {'⚠'} Cannibalisation Risk ({conflicts.length})
      </div>
      {conflicts.map((c, i) => {
        const conflictKey = `${c.type}-${c.slug || c.name}`;
        const resolved = !!primaryPages[conflictKey];
        return (
        <div key={i} style={{
          padding: '8px 10px', marginBottom: 4, borderRadius: 5,
          background: resolved ? (DK ? '#1a2e1a' : '#f0fdf4') : (DK ? '#3b2015' : '#fef2f2'),
          border: `1px solid ${resolved ? (DK ? '#2d5a2d' : '#bbf7d0') : (DK ? '#7f3d1d' : '#fecaca')}`,
          fontSize: 12, lineHeight: 1.5,
          opacity: resolved ? 0.7 : 1,
        }}>
          <div style={{ fontWeight: 600, color: DK ? '#f0f0f0' : '#1f2937', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af', marginRight: 2 }}>{c.type}</span>
            {c.name}
            {resolved && (
              <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 8, background: '#10b981', color: '#fff', fontWeight: 700, letterSpacing: '0.04em' }}>
                PRIMARY SET
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: DK ? '#9ca3af' : '#6b7280', marginTop: 2 }}>
            {c.reason}
          </div>
          {!resolved && (
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <button onClick={() => onResolve?.('differentiate', c)} disabled={!!fixingAction} style={{
              fontSize: 10, padding: '3px 10px', borderRadius: 10, cursor: fixingAction ? 'wait' : 'pointer',
              background: fixingAction === 'cannibal-differentiate' ? G : (DK ? '#2a2a2a' : '#f3f4f6'),
              color: fixingAction === 'cannibal-differentiate' ? '#fff' : (DK ? '#aaa' : '#6b7280'),
              border: `1px solid ${DK ? '#444' : '#e5e7eb'}`, fontFamily: 'var(--font-body)',
            }}>
              {fixingAction === 'cannibal-differentiate' ? '⟳ Rewriting...' : '\u2726 Differentiate angle'}
            </button>
            <button onClick={() => onResolve?.('keyword', c)} disabled={!!fixingAction} style={{
              fontSize: 10, padding: '3px 10px', borderRadius: 10, cursor: fixingAction ? 'wait' : 'pointer',
              background: fixingAction === 'cannibal-keyword' ? G : (DK ? '#2a2a2a' : '#f3f4f6'),
              color: fixingAction === 'cannibal-keyword' ? '#fff' : (DK ? '#aaa' : '#6b7280'),
              border: `1px solid ${DK ? '#444' : '#e5e7eb'}`, fontFamily: 'var(--font-body)',
            }}>
              {fixingAction === 'cannibal-keyword' ? '⟳ Suggesting...' : '\u25C7 Change keyword'}
            </button>
            <button onClick={() => onResolve?.('primary', c)} disabled={!!fixingAction} style={{
              fontSize: 10, padding: '3px 10px', borderRadius: 10, cursor: fixingAction ? 'wait' : 'pointer',
              background: DK ? '#2a2a2a' : '#f3f4f6', color: DK ? '#aaa' : '#6b7280',
              border: `1px solid ${DK ? '#444' : '#e5e7eb'}`, fontFamily: 'var(--font-body)',
            }}>
              {'\u2605'} Set as primary
            </button>
          </div>
          )}
          {c.slug && (
            <div style={{ fontSize: 10, color: DK ? '#666' : '#d1d5db', marginTop: 2 }}>
              /{c.slug}
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
}

// ── Internal Links Panel ────────────────────────────────────────────────────

export function InternalLinksPanel({ suggestions, DK, onInsertLink, loading, fixingAction }) {
  if (loading) {
    return (
      <div style={{ background: DK ? '#1e1e1e' : '#fff', borderRadius: 8, border: `1px solid ${DK ? '#333' : '#e5e7eb'}`, padding: '14px 20px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: DK ? '#9ca3af' : '#6b7280' }}>
          Internal Links
        </div>
        <div style={{ fontSize: 11, color: DK ? '#555' : '#d1d5db', marginTop: 6 }}>
          Scanning for linking opportunities...
        </div>
      </div>
    );
  }
  if (!suggestions || suggestions.length === 0) {
    return (
      <div style={{ background: DK ? '#1e1e1e' : '#fff', borderRadius: 8, border: `1px solid ${DK ? '#333' : '#e5e7eb'}`, padding: '14px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: DK ? '#9ca3af' : '#6b7280' }}>
            Internal Links
          </span>
          <span style={{ fontSize: 10, color: DK ? '#666' : '#d1d5db' }}>None found</span>
        </div>
        <div style={{ fontSize: 11, color: DK ? '#777' : '#9ca3af', marginTop: 6 }}>
          No linking opportunities detected. Consider creating related showcases or articles.
        </div>
      </div>
    );
  }
  return (
    <div style={{ background: DK ? '#1e1e1e' : '#fff', borderRadius: 8, border: `1px solid ${DK ? '#333' : '#e5e7eb'}`, padding: '14px 20px', marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: G, marginBottom: 10 }}>
        Internal Linking Opportunities
      </div>
      {suggestions.map((s, i) => (
        <div key={i} style={{
          padding: '6px 10px', marginBottom: 4, borderRadius: 5,
          background: DK ? '#1a2e1a' : '#f0fdf4',
          border: `1px solid ${DK ? '#2d5a2d' : '#bbf7d0'}`,
          fontSize: 12, lineHeight: 1.5,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af' }}>{s.label}</span>
            <span style={{ fontWeight: 600, color: DK ? '#f0f0f0' : '#1f2937' }}>{s.targetName}</span>
          </div>
          <div style={{ fontSize: 10, color: DK ? '#777' : '#9ca3af', marginTop: 2 }}>
            {s.reason} {'·'} {s.url}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <button
              onClick={() => { navigator.clipboard.writeText(s.url); }}
              style={{
                fontSize: 9, padding: '2px 8px', borderRadius: 3,
                background: DK ? '#252525' : '#f9fafb', color: DK ? '#aaa' : '#6b7280',
                border: `1px solid ${DK ? '#444' : '#e5e7eb'}`, cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}>
              Copy link
            </button>
            {onInsertLink && (
              <button
                onClick={() => onInsertLink(s)}
                disabled={fixingAction === 'insert-link'}
                style={{
                  fontSize: 9, padding: '2px 8px', borderRadius: 3,
                  background: fixingAction === 'insert-link' ? G : (DK ? '#1a2e1a' : '#f0fdf4'),
                  color: fixingAction === 'insert-link' ? '#fff' : '#10b981',
                  border: `1px solid ${DK ? '#2d5a2d' : '#bbf7d0'}`, cursor: fixingAction === 'insert-link' ? 'wait' : 'pointer',
                  fontFamily: 'var(--font-body)',
                }}>
                {fixingAction === 'insert-link' ? '⟳ Inserting...' : 'Insert into description'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── CTR Optimisation Panel ──────────────────────────────────────────────────

export function CTRPanel({ analysis, DK }) {
  if (!analysis) return null;
  return (
    <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${DK ? '#333' : '#f3f4f6'}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: DK ? '#d1d5db' : '#374151' }}>
          CTR Optimisation
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: analysis.ctrScore >= 70 ? '#10b981' : analysis.ctrScore >= 45 ? '#f59e0b' : '#ef4444' }}>
          {analysis.ctrScore}/100
        </span>
      </div>
      {analysis.strengths.map((s, i) => (
        <div key={`s-${i}`} style={{ fontSize: 11, color: '#059669', padding: '2px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
          {'\u2705'} {s}
        </div>
      ))}
      {analysis.tips.map((t, i) => (
        <div key={`t-${i}`} style={{ fontSize: 11, color: DK ? '#9ca3af' : '#6b7280', padding: '2px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
          {'\uD83D\uDD35'} {t}
        </div>
      ))}
    </div>
  );
}

// ── Priority Actions Panel ─────────────────────────────────────────────────

export function PriorityActionsPanel({ quality, ctrAnalysis, pageAudit, cannibalisation, onAction, onFixAll, fixingAction, recentlyFixed, generating, fixAllRunning, DK }) {
  if (!quality) return null;

  // Build priority action list from all analysis sources
  const actions = [];

  // From quality issues — highest impact first
  quality.issues.forEach(issue => {
    const impact = issue.severity === 'critical' ? 'high' : issue.severity === 'important' ? 'high' : 'medium';
    const actionable = issue.field === 'title' || issue.field === 'desc' || issue.field === 'keywords';
    actions.push({
      id: `q-${issue.field}-${issue.msg.slice(0, 20)}`,
      msg: issue.msg,
      tip: issue.tip,
      impact,
      field: issue.field,
      actionable,
      source: 'seo',
    });
  });

  // Focus keyword issues now come from quality.issues (field: 'title' or 'desc')
  // and are already included above — no separate section needed.

  // From CTR analysis
  if (ctrAnalysis && ctrAnalysis.tips) {
    ctrAnalysis.tips.slice(0, 2).forEach((tip, i) => {
      actions.push({
        id: `ctr-${i}`,
        msg: tip,
        tip: null,
        impact: 'medium',
        field: 'title',
        actionable: false,
        source: 'ctr',
      });
    });
  }

  // From cannibalisation
  if (cannibalisation?.conflicts?.length > 0) {
    actions.push({
      id: 'cannibal',
      msg: `${cannibalisation.conflicts.length} cannibalisation risk${cannibalisation.conflicts.length > 1 ? 's' : ''} detected`,
      tip: 'Differentiate this page\'s angle or merge with the competing page',
      impact: 'high',
      field: null,
      actionable: false,
      source: 'cannibal',
    });
  }

  // Sort: high first, then medium
  const sorted = actions.sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 };
    return (rank[a.impact] ?? 2) - (rank[b.impact] ?? 2);
  });

  const highCount = sorted.filter(a => a.impact === 'high').length;

  const actionableCount = sorted.filter(a => a.actionable && a.field).length;

  if (sorted.length === 0) return null;

  return (
    <div style={{ background: DK ? '#1e1e1e' : '#fff', borderRadius: 8, border: `1px solid ${DK ? '#333' : '#e5e7eb'}`, padding: '14px 20px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: G }}>
            Priority Actions
          </span>
          {highCount > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', background: DK ? '#3b1515' : '#fef2f2', padding: '2px 8px', borderRadius: 10 }}>
              {highCount} high impact
            </span>
          )}
        </div>
        {actionableCount > 1 && onFixAll && (
          <button onClick={() => onFixAll(sorted.filter(a => a.actionable && a.field))} disabled={generating || fixAllRunning} style={{
            fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-body)', padding: '4px 12px', borderRadius: 4,
            background: (generating || fixAllRunning) ? (DK ? '#333' : '#e5e7eb') : G, color: (generating || fixAllRunning) ? '#9ca3af' : '#fff',
            border: 'none', cursor: (generating || fixAllRunning) ? 'wait' : 'pointer', letterSpacing: '0.03em',
          }}>
            {fixAllRunning ? `⟳ Fixing ${actionableCount}...` : `⚡ Fix All (${actionableCount})`}
          </button>
        )}
      </div>
      {sorted.slice(0, 8).map((action, i) => {
        const isFixing = fixingAction === action.id;
        const isFixed = recentlyFixed && recentlyFixed.has(action.id);
        const impact = estimateImpact(action);

        if (isFixed) {
          return (
            <div key={action.id} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0',
              borderBottom: i < Math.min(sorted.length, 8) - 1 ? `1px solid ${DK ? '#2a2a2a' : '#f3f4f6'}` : 'none',
              opacity: 0.6, transition: 'opacity 0.5s ease-out',
            }}>
              <span style={{ color: '#10b981', fontSize: 14 }}>{'✓'}</span>
              <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600, textDecoration: 'line-through' }}>{action.msg}</span>
              <span style={{ fontSize: 9, color: '#10b981', fontWeight: 700, marginLeft: 'auto', background: DK ? '#1a2e1a' : '#f0fdf4', padding: '2px 8px', borderRadius: 3 }}>
                +{impact.min}-{impact.max} pts ✓
              </span>
            </div>
          );
        }

        return (
          <div key={action.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0',
            borderBottom: i < Math.min(sorted.length, 8) - 1 ? `1px solid ${DK ? '#2a2a2a' : '#f3f4f6'}` : 'none',
            opacity: isFixing ? 0.7 : 1, transition: 'opacity 0.2s',
          }}>
            <span style={{
              flexShrink: 0, marginTop: 2, width: 6, height: 6, borderRadius: '50%',
              background: action.impact === 'high' ? '#ef4444' : action.impact === 'medium' ? '#f59e0b' : '#10b981',
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: DK ? '#e0e0e0' : '#1f2937', lineHeight: 1.4 }}>
                {action.msg}
              </div>
              {action.tip && (
                <div style={{ fontSize: 10, color: DK ? '#777' : '#9ca3af', marginTop: 2 }}>
                  {action.tip}
                </div>
              )}
            </div>
            <span style={{ flexShrink: 0, fontSize: 9, color: '#10b981', fontWeight: 600, whiteSpace: 'nowrap', padding: '2px 6px', background: DK ? '#1a2e1a' : '#f0fdf4', borderRadius: 3 }}>
              +{impact.min}-{impact.max} pts
            </span>
            {action.actionable && action.field && onAction && (
              <button onClick={() => onAction(action.field, action)} disabled={generating || isFixing} style={{
                flexShrink: 0, fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-body)',
                padding: '3px 8px', borderRadius: 3, border: 'none', cursor: (generating || isFixing) ? 'wait' : 'pointer',
                background: isFixing ? (DK ? '#333' : '#e5e7eb') : G, color: (generating || isFixing) ? '#9ca3af' : '#fff', letterSpacing: '0.03em',
                minWidth: 32,
              }}>
                {isFixing ? '⟳' : 'Fix'}
              </button>
            )}
          </div>
        );
      })}
      {sorted.length > 8 && (
        <div style={{ fontSize: 10, color: DK ? '#666' : '#d1d5db', marginTop: 6 }}>
          +{sorted.length - 8} more actions
        </div>
      )}
    </div>
  );
}

// ── Outrank Mode ───────────────────────────────────────────────────────────

export function OutrankPanel({ entity, entityType, draft, onApply, generating, onGenerate, DK, updateDraft, notify }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const name = entity.name || entity.title || '';
      const location = entity.city ? [entity.city, entity.region, entity.country].filter(Boolean).join(', ') : (entity.location || '');
      const venueType = entity.venue_type || entityType;
      const currentTitle = draft.seo_title || '';
      const currentDesc = entityType === 'article' ? (draft.meta_description || '') : (draft.seo_description || '');

      const prompt = `You are an elite SEO strategist for luxury wedding venues. Rewrite ALL SEO metadata to maximise search rankings and click-through rates.

CURRENT STATE:
Name: ${name}
Type: ${venueType}${location ? `\nLocation: ${location}` : ''}
Current title: ${currentTitle || '(none)'}
Current description: ${currentDesc || '(none)'}

GENERATE a complete optimised SEO package. Return ONLY valid JSON:
{
  "title": "optimised title (50-60 chars, include location, power words, unique angle)",
  "description": "optimised description (140-160 chars, include CTA, emotional hook, key differentiator)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6"],
  "reasoning": "2-3 sentences explaining the strategic choices made",
  "confidence": "high|medium|experimental"
}

Rules:
- Title MUST include the venue/entity name
- Title MUST include location if available
- Description MUST contain a call-to-action verb (Discover, Explore, Book, Experience)
- Description MUST mention what makes this entity unique
- Keywords should be long-tail, location-specific where possible
- Include luxury/premium language naturally
- Reasoning should explain WHY these choices beat competitors`;

      const raw = await callAI('seo', prompt);
      // Try multiple JSON extraction strategies
      let parsed;
      try {
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
      } catch (parseErr) {
        // Try cleaning the response
        const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        const match2 = cleaned.match(/\{[\s\S]*\}/);
        if (match2) parsed = JSON.parse(match2[0]);
      }
      if (!parsed) throw new Error('Could not parse AI response');
      if (!parsed.title && !parsed.description) throw new Error('AI response missing title and description');
      setResult(parsed);
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const confidenceColor = (c) => c === 'high' ? '#10b981' : c === 'medium' ? '#f59e0b' : '#8b5cf6';
  const confidenceLabel = (c) => c === 'high' ? 'High Confidence' : c === 'medium' ? 'Medium Confidence' : 'Experimental';
  const descField = entityType === 'article' ? 'meta_description' : 'seo_description';

  return (
    <div style={{ background: DK ? '#1e1e1e' : '#fff', borderRadius: 8, border: `1px solid ${DK ? '#333' : '#e5e7eb'}`, marginBottom: 16, overflow: 'hidden' }}>
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          padding: '12px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: DK ? 'linear-gradient(135deg, #1a1a2e 0%, #1e1e1e 100%)' : 'linear-gradient(135deg, #fef9ef 0%, #fff 100%)',
          borderBottom: collapsed ? 'none' : `1px solid ${DK ? '#333' : '#e5e7eb'}`,
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>{'⚡'}</span>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: G }}>
            Outrank Mode
          </span>
          <span style={{ fontSize: 9, color: DK ? '#777' : '#9ca3af', fontFamily: NU }}>
            Strategic AI rewrite
          </span>
        </div>
        <span style={{ fontSize: 10, color: DK ? '#666' : '#d1d5db', transition: 'transform 0.2s', transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}>{'▼'}</span>
      </div>

      {!collapsed && (
        <div style={{ padding: '14px 20px' }}>
          {!result && !loading && (
            <div>
              <div style={{ fontSize: 12, color: DK ? '#aaa' : '#6b7280', lineHeight: 1.5, marginBottom: 12 }}>
                AI analyses your content and generates an optimised SEO package designed to outrank competitors — title, description, keywords, and strategic reasoning.
              </div>
              <button onClick={handleGenerate} style={{
                width: '100%', padding: '10px 0', fontSize: 12, fontWeight: 700, fontFamily: NU,
                background: G, color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', letterSpacing: '0.04em',
              }}>
                {'⚡'} Generate Outrank Package
              </button>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: DK ? '#aaa' : '#9ca3af', fontSize: 12 }}>
              {'⚡'} Analysing and generating strategic SEO package...
            </div>
          )}

          {result && !result.error && (
            <div>
              {result.confidence && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: confidenceColor(result.confidence) }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: confidenceColor(result.confidence), textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {confidenceLabel(result.confidence)}
                  </span>
                </div>
              )}

              {/* Side by side: Current vs Outrank */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: DK ? '#666' : '#d1d5db', marginBottom: 4 }}>Current Title</div>
                  <div style={{ fontSize: 12, color: DK ? '#999' : '#6b7280', padding: '6px 10px', background: DK ? '#1a1a1a' : '#f9fafb', borderRadius: 4, minHeight: 36, lineHeight: 1.4 }}>
                    {draft.seo_title || <em style={{ color: '#666' }}>empty</em>}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: '#10b981', marginBottom: 4 }}>Outrank Title</div>
                  <div style={{ fontSize: 12, color: DK ? '#e0e0e0' : '#1f2937', padding: '6px 10px', background: DK ? '#1a2e1a' : '#f0fdf4', borderRadius: 4, border: `1px solid ${DK ? '#2d5a2d' : '#bbf7d0'}`, minHeight: 36, lineHeight: 1.4 }}>
                    {result.title}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                    <span style={{ fontSize: 10, color: (result.title || '').length >= 50 && (result.title || '').length <= 60 ? '#10b981' : '#f59e0b' }}>{(result.title || '').length} chars</span>
                    {updateDraft && <button onClick={() => { updateDraft('seo_title', result.title); if (notify) notify('Title applied'); }} style={{ fontSize: 9, color: G, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: NU }}>Apply</button>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: DK ? '#666' : '#d1d5db', marginBottom: 4 }}>Current Description</div>
                  <div style={{ fontSize: 12, color: DK ? '#999' : '#6b7280', padding: '6px 10px', background: DK ? '#1a1a1a' : '#f9fafb', borderRadius: 4, minHeight: 54, lineHeight: 1.4 }}>
                    {draft[descField] || <em style={{ color: '#666' }}>empty</em>}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: '#10b981', marginBottom: 4 }}>Outrank Description</div>
                  <div style={{ fontSize: 12, color: DK ? '#e0e0e0' : '#1f2937', padding: '6px 10px', background: DK ? '#1a2e1a' : '#f0fdf4', borderRadius: 4, border: `1px solid ${DK ? '#2d5a2d' : '#bbf7d0'}`, minHeight: 54, lineHeight: 1.4 }}>
                    {result.description}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                    <span style={{ fontSize: 10, color: (result.description || '').length >= 140 && (result.description || '').length <= 160 ? '#10b981' : '#f59e0b' }}>{(result.description || '').length} chars</span>
                    {updateDraft && <button onClick={() => { updateDraft(descField, result.description); if (notify) notify('Description applied'); }} style={{ fontSize: 9, color: G, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: NU }}>Apply</button>}
                  </div>
                </div>
              </div>

              {/* Keywords */}
              {result.keywords && result.keywords.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: '#10b981' }}>Proposed Keywords</span>
                    {entityType === 'listing' && updateDraft && (
                      <button onClick={() => { updateDraft('seo_keywords', result.keywords); if (notify) notify('Keywords applied'); }} style={{ fontSize: 9, color: G, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: NU }}>Apply</button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {result.keywords.map((kw, i) => (
                      <span key={i} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 10, background: DK ? '#2a2a1a' : '#fef3c7', color: DK ? '#d4a850' : '#92400e', border: `1px solid ${DK ? '#444' : '#fde68a'}` }}>
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Reasoning */}
              {result.reasoning && (
                <div style={{ marginBottom: 14, padding: '10px 12px', background: DK ? '#1a2e1a' : '#f0fdf4', borderRadius: 4, border: `1px solid ${DK ? '#2d5a2d' : '#bbf7d0'}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#10b981', marginBottom: 4 }}>Strategic Reasoning</div>
                  <div style={{ fontSize: 12, color: DK ? '#ccc' : '#374151', lineHeight: 1.5 }}>{result.reasoning}</div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => {
                  onApply(result);
                  setResult(null);
                  setCollapsed(true);
                }} style={{
                  flex: 1, padding: '9px 0', fontSize: 12, fontWeight: 700, fontFamily: NU,
                  background: '#10b981', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer',
                }}>
                  {'\u2713'} Accept All
                </button>
                <button onClick={() => { setResult(null); }} style={{
                  flex: 1, padding: '9px 0', fontSize: 12, fontWeight: 700, fontFamily: NU,
                  background: 'transparent', color: DK ? '#9ca3af' : '#6b7280', border: `1px solid ${DK ? '#444' : '#e5e7eb'}`, borderRadius: 5, cursor: 'pointer',
                }}>
                  {'\u2717'} Reject
                </button>
                <button onClick={handleGenerate} style={{
                  padding: '9px 14px', fontSize: 12, fontWeight: 700, fontFamily: NU,
                  background: 'transparent', color: G, border: `1px solid ${G}`, borderRadius: 5, cursor: 'pointer',
                }}>
                  {'\u21BB'}
                </button>
              </div>
            </div>
          )}

          {result && result.error && (
            <div style={{ color: '#ef4444', fontSize: 12, padding: '10px 0' }}>
              Error: {result.error}
              <button onClick={handleGenerate} style={{ marginLeft: 10, fontSize: 11, color: G, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Retry</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── AI Comparison Picker ────────────────────────────────────────────────────

export function ComparisonPicker({ field, current, options, onPick, onCancel, DK }) {
  const cards = [
    { label: 'Current', value: current },
    { label: 'Option A', value: options[0] },
    { label: 'Option B', value: options[1] },
  ];
  return (
    <div style={{
      background: DK ? '#1a2518' : '#f0fdf4',
      border: `1px solid ${DK ? '#2d5a2d' : '#bbf7d0'}`,
      borderRadius: 6, padding: 12, marginTop: 6, marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: G }}>
          Pick a version for {field}
        </span>
        <button onClick={onCancel} style={{
          fontSize: 10, padding: '2px 8px', borderRadius: 3,
          background: 'none', border: `1px solid ${DK ? '#555' : '#d1d5db'}`, color: DK ? '#9ca3af' : '#6b7280',
          cursor: 'pointer', fontFamily: NU,
        }}>Cancel</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {cards.map((card, i) => (
          <div key={i} style={{
            background: DK ? '#1e1e1e' : '#fff',
            border: `1px solid ${DK ? '#444' : '#e5e7eb'}`,
            borderRadius: 6, padding: 10, display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: i === 0 ? '#9ca3af' : G, letterSpacing: '0.04em' }}>
              {card.label}
            </div>
            <div style={{ fontSize: 12, color: DK ? '#e0e0e0' : '#1f2937', lineHeight: 1.5, flex: 1, wordBreak: 'break-word' }}>
              {card.value || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Empty</span>}
            </div>
            <button onClick={() => onPick(card.value)} style={{
              padding: '5px 0', fontSize: 10, fontWeight: 700, fontFamily: NU,
              borderRadius: 4, border: 'none', cursor: 'pointer',
              background: i === 0 ? (DK ? '#333' : '#f3f4f6') : G,
              color: i === 0 ? (DK ? '#d1d5db' : '#374151') : '#fff',
            }}>
              Use this
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
