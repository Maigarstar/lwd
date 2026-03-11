/**
 * MediaMetaCanvas — Premium right-side metadata editor for uploaded media
 *
 * Opens as a slide-in panel when the user clicks an image/video thumbnail.
 * All field changes persist immediately through the onUpdate callback.
 * No save button — changes are real-time.
 *
 * AI features:
 *   - "AI Suggest Description" → generates editorial description from context
 *   - "AI Suggest Alt Text"    → generates SEO/accessibility alt text
 *   User must click Insert to apply; AI never auto-fills.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';

// ─── Design tokens (warm neutral editorial palette) ──────────────────────────
const GOLD   = '#b8860b';
const BORDER = '#e5ddd0';
const BG     = '#fafaf8';
const TEXT   = '#333';
const MUTED  = '#999';
const GREEN  = '#15803d';
const RED    = '#dc2626';

// ─── Shared input style ───────────────────────────────────────────────────────
const INPUT = {
  width: '100%',
  padding: '9px 12px',
  border: `1px solid ${BORDER}`,
  borderRadius: 4,
  fontSize: 13,
  color: TEXT,
  backgroundColor: BG,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  transition: 'border-color 0.15s',
};

// ─── Tiny sub-components ─────────────────────────────────────────────────────
const SectionLabel = ({ children }) => (
  <p style={{
    margin: '0 0 14px',
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.09em',
    textTransform: 'uppercase',
    color: GOLD,
  }}>
    {children}
  </p>
);

const FieldLabel = ({ children }) => (
  <label style={{
    display: 'block',
    marginBottom: 5,
    fontSize: 10,
    fontWeight: 600,
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }}>
    {children}
  </label>
);

const FieldRow = ({ children, style }) => (
  <div style={{ marginBottom: 16, ...style }}>{children}</div>
);

const Divider = () => (
  <div style={{ height: 1, backgroundColor: '#f0ebe3', margin: '22px 0' }} />
);

// ─── AI Suggest block ─────────────────────────────────────────────────────────
function AiSuggestBlock({ loading, suggestion, error, onSuggest, onInsert, onReject, label }) {
  return (
    <div style={{ marginTop: 10 }}>
      {/* Trigger button — only when no suggestion pending */}
      {!suggestion && (
        <button
          onClick={onSuggest}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            background: loading ? '#f0ebe3' : '#fffbf0',
            border: `1px solid ${loading ? BORDER : '#e9d97a'}`,
            borderRadius: 4,
            color: loading ? '#bbb' : GOLD,
            fontSize: 11,
            fontWeight: 600,
            cursor: loading ? 'default' : 'pointer',
            letterSpacing: '0.03em',
            transition: 'all 0.15s',
          }}
        >
          <span style={{ fontSize: 13 }}>✨</span>
          {loading ? 'Generating…' : label}
        </button>
      )}

      {/* Error state */}
      {error && (
        <div style={{
          marginTop: 8,
          padding: '8px 12px',
          backgroundColor: '#fff0f0',
          border: '1px solid #fca5a5',
          borderRadius: 4,
          fontSize: 11,
          color: RED,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 6,
        }}>
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Suggestion preview + actions */}
      {suggestion && (
        <div style={{
          marginTop: 8,
          padding: '12px 14px',
          backgroundColor: '#f8fcf4',
          border: '1px solid #86efac',
          borderRadius: 6,
        }}>
          <p style={{
            margin: '0 0 2px',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: GREEN,
          }}>
            AI Suggestion
          </p>
          <p style={{
            margin: '0 0 12px',
            fontSize: 12,
            color: '#374151',
            lineHeight: 1.65,
            fontStyle: 'italic',
          }}>
            "{suggestion}"
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={onInsert}
              style={{
                flex: 1,
                padding: '7px 0',
                backgroundColor: GREEN,
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.03em',
              }}
            >
              ✓ Insert
            </button>
            <button
              onClick={onReject}
              style={{
                flex: 1,
                padding: '7px 0',
                backgroundColor: '#f4f4f4',
                color: '#666',
                border: '1px solid #ddd',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ✗ Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function MediaMetaCanvas({ item, objectUrls, onUpdate, onClose, venueId }) {

  // ── Slide-in animation ──────────────────────────────────────────────────────
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // ── Local text state (synced to parent on blur) ─────────────────────────────
  const [localTitle,       setLocalTitle]       = useState('');
  const [localCaption,     setLocalCaption]     = useState('');
  const [localDescription, setLocalDescription] = useState('');
  const [localCreditName,  setLocalCreditName]  = useState('');
  const [localInstagram,   setLocalInstagram]   = useState('');
  const [localWebsite,     setLocalWebsite]     = useState('');
  const [localCamera,      setLocalCamera]      = useState('');
  const [localLocation,    setLocalLocation]    = useState('');
  const [localCopyright,   setLocalCopyright]   = useState('');
  const [localAltText,     setLocalAltText]     = useState('');

  // ── Tag input ───────────────────────────────────────────────────────────────
  const [tagInput, setTagInput] = useState('');

  // ── AI state ────────────────────────────────────────────────────────────────
  const [descLoading,    setDescLoading]    = useState(false);
  const [descSuggestion, setDescSuggestion] = useState(null);
  const [descError,      setDescError]      = useState(null);

  const [altLoading,     setAltLoading]     = useState(false);
  const [altSuggestion,  setAltSuggestion]  = useState(null);
  const [altError,       setAltError]       = useState(null);

  // ── Sync local state when item opens or changes ─────────────────────────────
  useEffect(() => {
    if (!item) return;
    setLocalTitle(item.title ?? '');
    setLocalCaption(item.caption ?? '');
    setLocalDescription(item.description ?? '');
    setLocalCreditName(item.credit_name ?? '');
    setLocalInstagram((item.credit_instagram ?? '').replace(/^@/, ''));
    setLocalWebsite(item.credit_website ?? '');
    setLocalCamera(item.credit_camera ?? '');
    setLocalLocation(item.location ?? '');
    setLocalCopyright(item.copyright ?? '');
    setLocalAltText(item.alt_text ?? '');
    setTagInput('');
    setDescSuggestion(null);
    setDescError(null);
    setAltSuggestion(null);
    setAltError(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  // ── Close helpers ───────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 220);
  }, [onClose]);

  // ESC key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleClose]);

  // ── Image source ────────────────────────────────────────────────────────────
  const imgSrc = item
    ? (item.file instanceof File
        ? (objectUrls?.[item.id] ?? null)
        : (item.url || item.thumbnail || null))
    : null;

  const tags = Array.isArray(item?.tags) ? item.tags : [];

  // ── AI context builder ──────────────────────────────────────────────────────
  const buildContext = (includeDesc = false) => [
    localTitle      && `Title: ${localTitle}`,
    localCaption    && `Caption: ${localCaption}`,
    includeDesc && localDescription && `Description: ${localDescription}`,
    localLocation   && `Location: ${localLocation}`,
    tags.length     && `Tags: ${tags.join(', ')}`,
  ].filter(Boolean).join('. ');

  // ── AI suggest: description ─────────────────────────────────────────────────
  const suggestDescription = async () => {
    setDescLoading(true);
    setDescError(null);
    setDescSuggestion(null);
    try {
      const context = buildContext(false) || 'A luxury wedding image.';
      const { data, error: err } = await supabase.functions.invoke('ai-generate', {
        body: {
          feature: 'media_description',
          systemPrompt: 'You are a professional editorial writer for luxury weddings. Write a rich, evocative, atmospheric description for a wedding media image. Be specific and sensory. Aim for 2–3 sentences.',
          userPrompt: context,
          venue_id: venueId,
        },
      });
      if (err) throw new Error(err.message);
      if (data?.text) setDescSuggestion(data.text.trim());
      else throw new Error('No content returned from AI');
    } catch (e) {
      setDescError(e.message || 'AI suggestion failed. Try again.');
    } finally {
      setDescLoading(false);
    }
  };

  // ── AI suggest: alt text ────────────────────────────────────────────────────
  const suggestAltText = async () => {
    setAltLoading(true);
    setAltError(null);
    setAltSuggestion(null);
    try {
      const context = buildContext(true) || 'A luxury wedding image.';
      const { data, error: err } = await supabase.functions.invoke('ai-generate', {
        body: {
          feature: 'media_alt_text',
          systemPrompt: 'You are an SEO and accessibility specialist. Write a concise, visually descriptive alt text for a luxury wedding image. Keep it under 125 characters. Be specific about what is in the image.',
          userPrompt: context,
          venue_id: venueId,
        },
      });
      if (err) throw new Error(err.message);
      if (data?.text) setAltSuggestion(data.text.trim());
      else throw new Error('No content returned from AI');
    } catch (e) {
      setAltError(e.message || 'AI suggestion failed. Try again.');
    } finally {
      setAltLoading(false);
    }
  };

  // ── Tag handlers ─────────────────────────────────────────────────────────────
  const addTag = (raw) => {
    const tag = raw.trim().replace(/,+$/, '').trim();
    if (!tag) return;
    if (tags.includes(tag)) return; // no duplicates
    onUpdate('tags', [...tags, tag]);
    setTagInput('');
  };

  const removeTag = (tagToRemove) => {
    onUpdate('tags', tags.filter(t => t !== tagToRemove));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  if (!item) return null;

  // Type label for the header
  const typeLabel = item.type === 'video'
    ? 'Video'
    : item.type === 'virtual_tour'
      ? 'Virtual Tour'
      : 'Image';

  const displayName = item.title || item.file?.name || (item.url ? 'Uploaded media' : 'Untitled');

  return (
    <>
      {/* ── Backdrop ─────────────────────────────────────────────────────── */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.28)',
          zIndex: 1299,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.22s ease',
        }}
      />

      {/* ── Canvas panel ─────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 420,
          height: '100vh',
          backgroundColor: '#fff',
          zIndex: 1300,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-6px 0 32px rgba(0,0,0,0.14)',
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.22s ease',
        }}
      >

        {/* ── Sticky header ────────────────────────────────────────────── */}
        <div style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 16px',
          height: 56,
          borderBottom: `1px solid ${BORDER}`,
          backgroundColor: BG,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              margin: 0,
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: GOLD,
            }}>
              {typeLabel} Metadata
            </p>
            <p style={{
              margin: '2px 0 0',
              fontSize: 12,
              color: '#555',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {displayName}
            </p>
          </div>
          <button
            onClick={handleClose}
            title="Close (Esc)"
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              border: `1px solid ${BORDER}`,
              backgroundColor: '#fff',
              color: '#888',
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              lineHeight: 1,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f0ebe3'; e.currentTarget.style.color = '#444'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#888'; }}
          >
            ×
          </button>
        </div>

        {/* ── Scrollable body ──────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* Image / video preview */}
          <div style={{
            width: '100%',
            height: 200,
            backgroundColor: '#f0ebe3',
            overflow: 'hidden',
            borderBottom: `1px solid ${BORDER}`,
            flexShrink: 0,
            position: 'relative',
          }}>
            {imgSrc ? (
              <img
                src={imgSrc}
                alt={localAltText || 'Media preview'}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 44,
              }}>
                {item.type === 'video' ? '🎬' : item.type === 'virtual_tour' ? '🌐' : '🖼️'}
              </div>
            )}
            {/* Type badge overlay */}
            <div style={{
              position: 'absolute',
              bottom: 10,
              left: 12,
              padding: '3px 8px',
              backgroundColor: 'rgba(0,0,0,0.5)',
              borderRadius: 3,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: '#fff',
            }}>
              {typeLabel}
            </div>
          </div>

          {/* ── Metadata form ─────────────────────────────────────────── */}
          <div style={{ padding: '22px 20px 48px' }}>

            {/* ── CORE INFO ─────────────────────────────────────────── */}
            <SectionLabel>Core Info</SectionLabel>

            <FieldRow>
              <FieldLabel>Title</FieldLabel>
              <input
                type="text"
                value={localTitle}
                onChange={e => setLocalTitle(e.target.value)}
                onBlur={() => onUpdate('title', localTitle.trim())}
                placeholder="e.g. Ceremony at the golden hour"
                style={INPUT}
              />
            </FieldRow>

            <FieldRow>
              <FieldLabel>Caption</FieldLabel>
              <input
                type="text"
                value={localCaption}
                onChange={e => setLocalCaption(e.target.value)}
                onBlur={() => onUpdate('caption', localCaption.trim())}
                placeholder="Short caption shown beneath the image"
                style={INPUT}
              />
            </FieldRow>

            <FieldRow style={{ marginBottom: 0 }}>
              <FieldLabel>Description</FieldLabel>
              <textarea
                value={localDescription}
                onChange={e => setLocalDescription(e.target.value)}
                onBlur={() => onUpdate('description', localDescription.trim())}
                placeholder="Rich editorial description of this image…"
                rows={4}
                style={{ ...INPUT, resize: 'vertical', lineHeight: 1.6 }}
              />
              <AiSuggestBlock
                loading={descLoading}
                suggestion={descSuggestion}
                error={descError}
                label="AI Suggest Description"
                onSuggest={suggestDescription}
                onInsert={() => {
                  const text = descSuggestion;
                  setLocalDescription(text);
                  onUpdate('description', text);
                  setDescSuggestion(null);
                }}
                onReject={() => setDescSuggestion(null)}
              />
            </FieldRow>

            <Divider />

            {/* ── PHOTOGRAPHER CREDITS ──────────────────────────────── */}
            <SectionLabel>Photographer Credits</SectionLabel>

            <FieldRow>
              <FieldLabel>Photographer Name</FieldLabel>
              <input
                type="text"
                value={localCreditName}
                onChange={e => setLocalCreditName(e.target.value)}
                onBlur={() => onUpdate('credit_name', localCreditName.trim())}
                placeholder="Full name or studio"
                style={INPUT}
              />
            </FieldRow>

            <FieldRow>
              <FieldLabel>Instagram</FieldLabel>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#bbb',
                  fontSize: 13,
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}>
                  @
                </span>
                <input
                  type="text"
                  value={localInstagram}
                  onChange={e => setLocalInstagram(e.target.value.replace(/^@/, ''))}
                  onBlur={() => {
                    const val = localInstagram.trim().replace(/^@/, '');
                    setLocalInstagram(val);
                    onUpdate('credit_instagram', val ? `@${val}` : '');
                  }}
                  placeholder="instagram_handle"
                  style={{ ...INPUT, paddingLeft: 26 }}
                />
              </div>
            </FieldRow>

            <FieldRow>
              <FieldLabel>Website</FieldLabel>
              <input
                type="url"
                value={localWebsite}
                onChange={e => setLocalWebsite(e.target.value)}
                onBlur={() => onUpdate('credit_website', localWebsite.trim())}
                placeholder="https://"
                style={INPUT}
              />
            </FieldRow>

            <FieldRow style={{ marginBottom: 0 }}>
              <FieldLabel>Camera / Gear</FieldLabel>
              <input
                type="text"
                value={localCamera}
                onChange={e => setLocalCamera(e.target.value)}
                onBlur={() => onUpdate('credit_camera', localCamera.trim())}
                placeholder="e.g. Sony A7R V · 85mm f/1.4"
                style={INPUT}
              />
            </FieldRow>

            <Divider />

            {/* ── LOCATION & CONTEXT ────────────────────────────────── */}
            <SectionLabel>Location &amp; Context</SectionLabel>

            <FieldRow>
              <FieldLabel>Location</FieldLabel>
              <input
                type="text"
                value={localLocation}
                onChange={e => setLocalLocation(e.target.value)}
                onBlur={() => onUpdate('location', localLocation.trim())}
                placeholder="e.g. Tuscany, Italy"
                style={INPUT}
              />
            </FieldRow>

            <FieldRow style={{ marginBottom: 0 }}>
              <FieldLabel>Tags</FieldLabel>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                padding: '7px 10px',
                border: `1px solid ${BORDER}`,
                borderRadius: 4,
                backgroundColor: BG,
                minHeight: 42,
                alignItems: 'center',
                cursor: 'text',
              }}>
                {tags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '3px 8px',
                      backgroundColor: '#fffbf0',
                      border: '1px solid rgba(184,134,11,0.3)',
                      borderRadius: 12,
                      fontSize: 11,
                      color: GOLD,
                      fontWeight: 600,
                    }}
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: GOLD,
                        padding: '0 0 1px',
                        fontSize: 13,
                        lineHeight: 1,
                        display: 'flex',
                        alignItems: 'center',
                        opacity: 0.7,
                      }}
                      title={`Remove "${tag}"`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
                  placeholder={tags.length === 0 ? 'Add tags… (Enter or comma)' : '+'}
                  style={{
                    border: 'none',
                    outline: 'none',
                    fontSize: 12,
                    color: TEXT,
                    backgroundColor: 'transparent',
                    minWidth: tags.length === 0 ? 160 : 40,
                    flex: 1,
                    padding: '2px 2px',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  }}
                />
              </div>
              <p style={{ margin: '5px 0 0', fontSize: 10, color: '#bbb' }}>
                Press Enter or comma to add · Backspace to remove last
              </p>
            </FieldRow>

            <Divider />

            {/* ── COPYRIGHT ─────────────────────────────────────────── */}
            <SectionLabel>Copyright</SectionLabel>

            <FieldRow style={{ marginBottom: 0 }}>
              <FieldLabel>Copyright / Credit Line</FieldLabel>
              <input
                type="text"
                value={localCopyright}
                onChange={e => setLocalCopyright(e.target.value)}
                onBlur={() => onUpdate('copyright', localCopyright.trim())}
                placeholder="e.g. © 2025 Jane Smith Photography"
                style={INPUT}
              />
            </FieldRow>

            <Divider />

            {/* ── SEO & ACCESSIBILITY ───────────────────────────────── */}
            <SectionLabel>SEO &amp; Accessibility</SectionLabel>

            <FieldRow style={{ marginBottom: 0 }}>
              <FieldLabel>Alt Text</FieldLabel>
              <input
                type="text"
                value={localAltText}
                onChange={e => setLocalAltText(e.target.value)}
                onBlur={() => onUpdate('alt_text', localAltText.trim())}
                placeholder="Describe the image for search engines and screen readers"
                maxLength={200}
                style={INPUT}
              />
              <p style={{ margin: '4px 0 0', fontSize: 10, color: localAltText.length > 125 ? '#f59e0b' : '#bbb' }}>
                {localAltText.length} / 125 recommended
              </p>
              <AiSuggestBlock
                loading={altLoading}
                suggestion={altSuggestion}
                error={altError}
                label="AI Suggest Alt Text"
                onSuggest={suggestAltText}
                onInsert={() => {
                  const text = altSuggestion;
                  setLocalAltText(text);
                  onUpdate('alt_text', text);
                  setAltSuggestion(null);
                }}
                onReject={() => setAltSuggestion(null)}
              />
            </FieldRow>

            <Divider />

            {/* ── DISPLAY SETTINGS ──────────────────────────────────── */}
            <SectionLabel>Display</SectionLabel>

            <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
              {/* Featured toggle */}
              <button
                onClick={() => onUpdate('is_featured', !(item.is_featured))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '9px 16px',
                  borderRadius: 6,
                  border: `1px solid ${item.is_featured ? 'rgba(184,134,11,0.5)' : BORDER}`,
                  backgroundColor: item.is_featured ? '#fffbf0' : BG,
                  color: item.is_featured ? GOLD : '#888',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: 14 }}>★</span>
                Featured
              </button>

              {/* Visibility dropdown */}
              <div style={{ flex: 1, position: 'relative' }}>
                <select
                  value={item.visibility ?? 'public'}
                  onChange={e => onUpdate('visibility', e.target.value)}
                  style={{
                    ...INPUT,
                    cursor: 'pointer',
                    paddingRight: 28,
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%23999' d='M0 0l5 6 5-6z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 10px center',
                    backgroundSize: '8px',
                  }}
                >
                  <option value="public">👁 Public</option>
                  <option value="private">🔒 Private</option>
                </select>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
