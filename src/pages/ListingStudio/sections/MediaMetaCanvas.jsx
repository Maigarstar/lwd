/**
 * MediaMetaCanvas — Premium right-side metadata editor for uploaded media
 *
 * Opens as a slide-in panel when the user clicks an image/video thumbnail.
 * All field changes persist immediately through the onUpdate callback.
 * No save button — changes are real-time.
 *
 * Light toggle (top-right header): switches panel between warm light and
 * dark studio mode. Useful for reviewing images against a dark background.
 *
 * AI features:
 *   - "Generate Description" → generates editorial description from context
 *   - "Generate Alt Text"    → generates SEO/accessibility alt text
 *   User must click Insert to apply; AI never auto-fills.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';

// ─── Constants ────────────────────────────────────────────────────────────────
const GOLD   = '#b8860b';   // header/logo gold
const GOLD2  = '#C5A059';   // section heading gold (brighter, more readable)
const GREEN  = '#15803d';
const RED    = '#dc2626';

// ─── Color schemes ────────────────────────────────────────────────────────────
const LIGHT = {
  bg:            '#ffffff',
  headerBg:      '#fafaf8',
  border:        '#e5ddd0',
  shadow:        '-6px 0 32px rgba(0,0,0,0.14)',
  text:          '#333333',
  subText:       '#555555',
  muted:         '#999999',
  hint:          '#bbbbbb',
  inputBg:       '#fafaf8',
  inputBorder:   '#e5ddd0',
  inputText:     '#333333',
  divider:       '#ddd4c8',
  imageBg:       '#f0ebe3',
  tagBg:         '#fffbf0',
  tagBorder:     'rgba(184,134,11,0.3)',
  tagText:       GOLD,
  aiBtn:         '#fffbf0',
  aiBtnBorder:   '#e9d97a',
  discardBg:     '#f4f4f4',
  discardText:   '#666666',
  discardBorder: '#dddddd',
  errBg:         '#fff0f0',
  errBorder:     '#fca5a5',
  suggBg:        '#f8fcf4',
  suggBorder:    '#86efac',
  toggleBg:      '#ffffff',
  toggleBorder:  '#e5ddd0',
  toggleDot:     'transparent',
  toggleDotBorder: '#aaaaaa',
  actionBg:      '#f5f1eb',
  actionBorder:  '#ddd4c8',
  actionText:    '#555555',
};

const DARK = {
  bg:            '#141414',
  headerBg:      '#1c1c1c',
  border:        'rgba(255,255,255,0.1)',
  shadow:        '-6px 0 40px rgba(0,0,0,0.6)',
  text:          '#e8e8e8',
  subText:       'rgba(255,255,255,0.6)',
  muted:         'rgba(255,255,255,0.38)',
  hint:          'rgba(255,255,255,0.25)',
  inputBg:       'rgba(255,255,255,0.06)',
  inputBorder:   'rgba(255,255,255,0.12)',
  inputText:     '#e8e8e8',
  divider:       'rgba(255,255,255,0.13)',
  imageBg:       '#000000',
  tagBg:         'rgba(184,134,11,0.18)',
  tagBorder:     'rgba(184,134,11,0.45)',
  tagText:       '#d4a840',
  aiBtn:         'rgba(240,192,64,0.1)',
  aiBtnBorder:   'rgba(233,217,122,0.4)',
  discardBg:     'rgba(255,255,255,0.08)',
  discardText:   'rgba(255,255,255,0.55)',
  discardBorder: 'rgba(255,255,255,0.15)',
  errBg:         'rgba(220,38,38,0.12)',
  errBorder:     'rgba(252,165,165,0.4)',
  suggBg:        'rgba(21,128,61,0.12)',
  suggBorder:    'rgba(134,239,172,0.35)',
  toggleBg:      'rgba(240,192,64,0.15)',
  toggleBorder:  'rgba(240,192,64,0.4)',
  toggleDot:     '#f0c040',
  toggleDotBorder: 'transparent',
  actionBg:      'rgba(255,255,255,0.05)',
  actionBorder:  'rgba(255,255,255,0.1)',
  actionText:    'rgba(255,255,255,0.5)',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionLabel = ({ children }) => (
  <p style={{
    margin: '0 0 14px',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color: GOLD2,
  }}>
    {children}
  </p>
);

const FieldLabel = ({ children, s }) => (
  <label style={{
    display: 'block',
    marginBottom: 5,
    fontSize: 10,
    fontWeight: 600,
    color: s.muted,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }}>
    {children}
  </label>
);

const FieldRow = ({ children, style }) => (
  <div style={{ marginBottom: 16, ...style }}>{children}</div>
);

const Divider = ({ s }) => (
  <div style={{
    height: 1,
    backgroundColor: s.divider,
    margin: '24px 0',
    transition: 'background-color 0.22s ease',
  }} />
);

// ─── AI Suggest block ─────────────────────────────────────────────────────────
function AiSuggestBlock({ loading, suggestion, error, onSuggest, onInsert, onReject, label, s }) {
  return (
    <div style={{ marginTop: 10 }}>
      {/* Trigger button */}
      {!suggestion && (
        <button
          onClick={onSuggest}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            background: loading ? s.divider : s.aiBtn,
            border: `1px solid ${loading ? s.border : s.aiBtnBorder}`,
            borderRadius: 4,
            color: loading ? s.hint : GOLD,
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

      {/* Error */}
      {error && (
        <div style={{
          marginTop: 8,
          padding: '8px 12px',
          backgroundColor: s.errBg,
          border: `1px solid ${s.errBorder}`,
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

      {/* Suggestion preview */}
      {suggestion && (
        <div style={{
          marginTop: 8,
          padding: '12px 14px',
          backgroundColor: s.suggBg,
          border: `1px solid ${s.suggBorder}`,
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
            color: s.text,
            lineHeight: 1.65,
            fontStyle: 'italic',
          }}>
            "{suggestion}"
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={onInsert}
              style={{
                flex: 1, padding: '7px 0',
                backgroundColor: GREEN, color: '#fff',
                border: 'none', borderRadius: 4,
                fontSize: 11, fontWeight: 700,
                cursor: 'pointer', letterSpacing: '0.03em',
              }}
            >
              ✓ Insert
            </button>
            <button
              onClick={onReject}
              style={{
                flex: 1, padding: '7px 0',
                backgroundColor: s.discardBg,
                color: s.discardText,
                border: `1px solid ${s.discardBorder}`,
                borderRadius: 4,
                fontSize: 11, fontWeight: 600,
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
export default function MediaMetaCanvas({
  item,
  objectUrls,
  onUpdate,
  onClose,
  venueId,
  // Action bar props
  onRemove,
  onMoveUp,
  onMoveDown,
  totalItems,
  itemIndex,
  // Navigation props
  onPrev,
  onNext,
}) {

  // ── Dark mode toggle (default: dark studio mode) ─────────────────────────────
  const [isDark, setIsDark] = useState(true);
  const s = isDark ? DARK : LIGHT;

  // ── Slide-in animation ──────────────────────────────────────────────────────
  const [visible, setVisible] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

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

  // ── Save flash state ─────────────────────────────────────────────────────────
  const [savedFlash, setSavedFlash] = useState(false);

  // ── Sync local state when item opens / changes ──────────────────────────────
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
    setDescSuggestion(null); setDescError(null);
    setAltSuggestion(null);  setAltError(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  // ── Close ───────────────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 220);
  }, [onClose]);

  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [handleClose]);

  // ── Flush all local state → parent (captures typed-but-not-blurred values) ──
  const flushAll = useCallback(() => {
    onUpdate('title',            localTitle.trim());
    onUpdate('caption',          localCaption.trim());
    onUpdate('description',      localDescription.trim());
    onUpdate('credit_name',      localCreditName.trim());
    const igVal = localInstagram.trim().replace(/^@/, '');
    onUpdate('credit_instagram', igVal ? `@${igVal}` : '');
    onUpdate('credit_website',   localWebsite.trim());
    onUpdate('credit_camera',    localCamera.trim());
    onUpdate('location',         localLocation.trim());
    onUpdate('copyright',        localCopyright.trim());
    onUpdate('alt_text',         localAltText.trim());
  }, [onUpdate, localTitle, localCaption, localDescription, localCreditName,
      localInstagram, localWebsite, localCamera, localLocation, localCopyright, localAltText]);

  const handleSave = useCallback(() => {
    flushAll();
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  }, [flushAll]);

  const handlePrev = useCallback(() => {
    if (!onPrev) return;
    flushAll();
    onPrev();
  }, [flushAll, onPrev]);

  const handleNext = useCallback(() => {
    if (!onNext) return;
    flushAll();
    onNext();
  }, [flushAll, onNext]);

  // ── Image source ─────────────────────────────────────────────────────────────
  const imgSrc = item
    ? (item.file instanceof File
        ? (objectUrls?.[item.id] ?? null)
        : (item.url || item.thumbnail || null))
    : null;

  const tags = Array.isArray(item?.tags) ? item.tags : [];

  // ── AI context builder ───────────────────────────────────────────────────────
  const buildContext = (includeDesc = false) => [
    localTitle      && `Title: ${localTitle}`,
    localCaption    && `Caption: ${localCaption}`,
    includeDesc && localDescription && `Description: ${localDescription}`,
    localLocation   && `Location: ${localLocation}`,
    tags.length     && `Tags: ${tags.join(', ')}`,
  ].filter(Boolean).join('. ');

  // ── AI suggest: description ──────────────────────────────────────────────────
  const suggestDescription = async () => {
    setDescLoading(true); setDescError(null); setDescSuggestion(null);
    try {
      const { data, error: err } = await supabase.functions.invoke('ai-generate', {
        body: {
          feature: 'media_description',
          systemPrompt: 'You are a professional editorial writer for luxury weddings. Write a rich, evocative, atmospheric description for a wedding media image. Be specific and sensory. Aim for 2–3 sentences.',
          userPrompt: buildContext(false) || 'A luxury wedding image.',
          venue_id: venueId,
        },
      });
      if (err) throw new Error(err.message);
      if (data?.text) setDescSuggestion(data.text.trim());
      else throw new Error('No content returned from AI');
    } catch (e) { setDescError(e.message || 'AI suggestion failed. Try again.'); }
    finally { setDescLoading(false); }
  };

  // ── AI suggest: alt text ─────────────────────────────────────────────────────
  const suggestAltText = async () => {
    setAltLoading(true); setAltError(null); setAltSuggestion(null);
    try {
      const { data, error: err } = await supabase.functions.invoke('ai-generate', {
        body: {
          feature: 'media_alt_text',
          systemPrompt: 'You are an SEO and accessibility specialist. Write a concise, visually descriptive alt text for a luxury wedding image. Keep it under 125 characters. Be specific about what is in the image.',
          userPrompt: buildContext(true) || 'A luxury wedding image.',
          venue_id: venueId,
        },
      });
      if (err) throw new Error(err.message);
      if (data?.text) setAltSuggestion(data.text.trim());
      else throw new Error('No content returned from AI');
    } catch (e) { setAltError(e.message || 'AI suggestion failed. Try again.'); }
    finally { setAltLoading(false); }
  };

  // ── Tag handlers ──────────────────────────────────────────────────────────────
  const addTag = (raw) => {
    const tag = raw.trim().replace(/,+$/, '').trim();
    if (!tag || tags.includes(tag)) return;
    onUpdate('tags', [...tags, tag]);
    setTagInput('');
  };
  const removeTag = (t) => onUpdate('tags', tags.filter(x => x !== t));
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput); }
    else if (e.key === 'Backspace' && !tagInput && tags.length > 0) removeTag(tags[tags.length - 1]);
  };

  if (!item) return null;

  const typeLabel   = item.type === 'video' ? 'Video' : item.type === 'virtual_tour' ? 'Virtual Tour' : 'Image';
  const posLabel    = totalItems > 0
    ? `${typeLabel} ${(itemIndex ?? 0) + 1} of ${totalItems}`
    : typeLabel;

  // ── Shared input style ────────────────────────────────────────────────────────
  const INPUT = {
    width: '100%', padding: '9px 12px',
    border: `1px solid ${s.inputBorder}`,
    borderRadius: 4, fontSize: 13,
    color: s.inputText, backgroundColor: s.inputBg,
    outline: 'none', boxSizing: 'border-box',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    transition: 'border-color 0.15s, background-color 0.22s, color 0.22s',
  };

  // ── Action button helper ──────────────────────────────────────────────────────
  const actionBtn = (active = false, danger = false) => ({
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '6px 10px', borderRadius: 4,
    border: `1px solid ${active ? 'rgba(184,134,11,0.5)' : (danger ? 'rgba(220,38,38,0.35)' : s.actionBorder)}`,
    backgroundColor: active
      ? (isDark ? 'rgba(184,134,11,0.22)' : '#fffbf0')
      : (danger ? (isDark ? 'rgba(220,38,38,0.14)' : '#fff4f4') : s.actionBg),
    color: active ? GOLD : danger ? RED : s.actionText,
    fontSize: 11, fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.15s', whiteSpace: 'nowrap', flexShrink: 0,
    lineHeight: 1,
  });

  const canMoveUp   = onMoveUp && itemIndex > 0;
  const canMoveDown = onMoveDown && itemIndex < (totalItems - 1);

  return (
    <>
      {/* ── Backdrop ───────────────────────────────────────────────────────── */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0,
          backgroundColor: isDark ? 'rgba(0,0,0,0.58)' : 'rgba(0,0,0,0.28)',
          zIndex: 1299,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.22s ease',
        }}
      />

      {/* ── Canvas panel ───────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0,
          width: 420, height: '100vh',
          backgroundColor: s.bg,
          zIndex: 1300,
          display: 'flex', flexDirection: 'column',
          boxShadow: s.shadow,
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.22s ease, background-color 0.22s ease, box-shadow 0.22s ease',
        }}
      >

        {/* ── Fixed header ─────────────────────────────────────────────────── */}
        <div style={{
          flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '0 14px', height: 56,
          borderBottom: `1px solid ${s.border}`,
          backgroundColor: s.headerBg,
          transition: 'background-color 0.22s ease, border-color 0.22s ease',
        }}>
          {/* Labels */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              margin: 0, fontSize: 8, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD,
            }}>
              Media Asset
            </p>
            <p style={{
              margin: '2px 0 0', fontSize: 12,
              color: s.subText,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              transition: 'color 0.22s ease',
            }}>
              {posLabel}
            </p>
          </div>

          {/* Light toggle */}
          <button
            onClick={() => setIsDark(d => !d)}
            title={isDark ? 'Lights on' : 'Lights off'}
            style={{
              width: 30, height: 30, borderRadius: '50%',
              border: `1px solid ${s.toggleBorder}`,
              backgroundColor: s.toggleBg,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all 0.22s ease', padding: 0,
            }}
          >
            <span style={{
              display: 'block', width: 10, height: 10, borderRadius: '50%',
              backgroundColor: s.toggleDot,
              border: `1.5px solid ${s.toggleDotBorder || s.toggleDot}`,
              transition: 'all 0.22s ease',
            }} />
          </button>

          {/* Close */}
          <button
            onClick={handleClose}
            title="Close (Esc)"
            style={{
              width: 30, height: 30, borderRadius: '50%',
              border: `1px solid ${s.border}`,
              backgroundColor: 'transparent',
              color: s.muted, fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, lineHeight: 1, transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.08)' : '#f0ebe3';
              e.currentTarget.style.color = isDark ? '#fff' : '#444';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = s.muted;
            }}
          >
            ×
          </button>
        </div>

        {/* ── Scrollable body ───────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* ── Sticky zone: image + action bar ──────────────────────────── */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 10,
            backgroundColor: s.bg,
            transition: 'background-color 0.22s ease',
          }}>
            {/* Image preview — 260px */}
            <div style={{
              width: '100%', height: 260,
              backgroundColor: s.imageBg,
              overflow: 'hidden',
              borderBottom: `1px solid ${s.border}`,
              position: 'relative',
              flexShrink: 0,
              transition: 'background-color 0.22s ease',
            }}>
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt={localAltText || 'Media preview'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 48,
                }}>
                  {item.type === 'video' ? '🎬' : item.type === 'virtual_tour' ? '🌐' : '🖼️'}
                </div>
              )}
              {/* Type badge */}
              <div style={{
                position: 'absolute', bottom: 10, left: 12,
                padding: '3px 8px',
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: 3, fontSize: 9, fontWeight: 700,
                letterSpacing: '0.07em', textTransform: 'uppercase', color: '#fff',
              }}>
                {typeLabel}
              </div>
            </div>

            {/* ── Action bar ─────────────────────────────────────────────── */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 14px',
              borderBottom: `1px solid ${s.border}`,
              backgroundColor: s.headerBg,
              transition: 'background-color 0.22s ease, border-color 0.22s ease',
            }}>
              {/* Feature toggle */}
              <button
                onClick={() => onUpdate('is_featured', !item.is_featured)}
                style={actionBtn(item.is_featured)}
                title={item.is_featured ? 'Remove featured' : 'Set as featured'}
              >
                <span>★</span>
                Feature
              </button>

              {/* Visibility */}
              <select
                value={item.visibility ?? 'public'}
                onChange={e => onUpdate('visibility', e.target.value)}
                style={{
                  padding: '6px 8px',
                  border: `1px solid ${s.actionBorder}`,
                  borderRadius: 4,
                  backgroundColor: s.actionBg,
                  color: s.actionText,
                  fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', outline: 'none',
                  transition: 'all 0.22s',
                }}
              >
                <option value="public">👁 Public</option>
                <option value="private">🔒 Private</option>
              </select>

              {/* Spacer */}
              <div style={{ flex: 1 }} />

              {/* Move up */}
              <button
                onClick={canMoveUp ? onMoveUp : undefined}
                title="Move up"
                style={{
                  ...actionBtn(false),
                  padding: '6px 9px',
                  opacity: canMoveUp ? 1 : 0.3,
                  cursor: canMoveUp ? 'pointer' : 'default',
                }}
              >
                ⬆
              </button>

              {/* Move down */}
              <button
                onClick={canMoveDown ? onMoveDown : undefined}
                title="Move down"
                style={{
                  ...actionBtn(false),
                  padding: '6px 9px',
                  opacity: canMoveDown ? 1 : 0.3,
                  cursor: canMoveDown ? 'pointer' : 'default',
                }}
              >
                ⬇
              </button>

              {/* Remove */}
              {onRemove && (
                <button
                  onClick={onRemove}
                  title="Remove from media"
                  style={{ ...actionBtn(false, true), padding: '6px 9px' }}
                >
                  🗑
                </button>
              )}
            </div>
          </div>

          {/* ── Metadata form ─────────────────────────────────────────────── */}
          <div style={{
            padding: '24px 20px 52px',
            transition: 'background-color 0.22s ease',
          }}>

            {/* ─── CORE INFO ───────────────────────────────────────────── */}
            <SectionLabel>Core Info</SectionLabel>

            <FieldRow>
              <FieldLabel s={s}>Title</FieldLabel>
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
              <FieldLabel s={s}>Caption</FieldLabel>
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
              <FieldLabel s={s}>Description</FieldLabel>
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
                label="Generate Description"
                onSuggest={suggestDescription}
                onInsert={() => {
                  setLocalDescription(descSuggestion);
                  onUpdate('description', descSuggestion);
                  setDescSuggestion(null);
                }}
                onReject={() => setDescSuggestion(null)}
                s={s}
              />
            </FieldRow>

            <Divider s={s} />

            {/* ─── PHOTOGRAPHER CREDITS ────────────────────────────────── */}
            <SectionLabel>Photographer Credits</SectionLabel>

            <FieldRow>
              <FieldLabel s={s}>Photographer Name</FieldLabel>
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
              <FieldLabel s={s}>Instagram</FieldLabel>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  color: s.hint, fontSize: 13,
                  pointerEvents: 'none', userSelect: 'none',
                }}>@</span>
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
              <FieldLabel s={s}>Website</FieldLabel>
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
              <FieldLabel s={s}>Camera / Gear</FieldLabel>
              <input
                type="text"
                value={localCamera}
                onChange={e => setLocalCamera(e.target.value)}
                onBlur={() => onUpdate('credit_camera', localCamera.trim())}
                placeholder="e.g. Sony A7R V · 85mm f/1.4"
                style={INPUT}
              />
            </FieldRow>

            <Divider s={s} />

            {/* ─── LOCATION & CONTEXT ──────────────────────────────────── */}
            <SectionLabel>Location &amp; Context</SectionLabel>

            <FieldRow>
              <FieldLabel s={s}>Location</FieldLabel>
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
              <FieldLabel s={s}>Tags</FieldLabel>
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 6,
                padding: '7px 10px',
                border: `1px solid ${s.inputBorder}`,
                borderRadius: 4,
                backgroundColor: s.inputBg,
                minHeight: 42, alignItems: 'center', cursor: 'text',
                transition: 'background-color 0.22s, border-color 0.22s',
              }}>
                {tags.map(tag => (
                  <span key={tag} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '3px 8px',
                    backgroundColor: s.tagBg,
                    border: `1px solid ${s.tagBorder}`,
                    borderRadius: 12,
                    fontSize: 11, color: s.tagText, fontWeight: 600,
                    transition: 'all 0.22s',
                  }}>
                    {tag}
                    <button onClick={() => removeTag(tag)} style={{
                      background: 'none', border: 'none',
                      cursor: 'pointer', color: s.tagText,
                      padding: '0 0 1px', fontSize: 13, lineHeight: 1,
                      display: 'flex', alignItems: 'center', opacity: 0.7,
                    }} title={`Remove "${tag}"`}>×</button>
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
                    border: 'none', outline: 'none',
                    fontSize: 12, color: s.inputText,
                    backgroundColor: 'transparent',
                    minWidth: tags.length === 0 ? 160 : 40, flex: 1,
                    padding: '2px 2px',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  }}
                />
              </div>
              <p style={{ margin: '5px 0 0', fontSize: 10, color: s.hint }}>
                Press Enter or comma to add · Backspace to remove last
              </p>
            </FieldRow>

            <Divider s={s} />

            {/* ─── COPYRIGHT ───────────────────────────────────────────── */}
            <SectionLabel>Copyright</SectionLabel>

            <FieldRow style={{ marginBottom: 0 }}>
              <FieldLabel s={s}>Copyright / Credit Line</FieldLabel>
              <input
                type="text"
                value={localCopyright}
                onChange={e => setLocalCopyright(e.target.value)}
                onBlur={() => onUpdate('copyright', localCopyright.trim())}
                placeholder="e.g. © 2025 Jane Smith Photography"
                style={INPUT}
              />
            </FieldRow>

            <Divider s={s} />

            {/* ─── SEO & ACCESSIBILITY ─────────────────────────────────── */}
            <SectionLabel>SEO &amp; Accessibility</SectionLabel>

            <FieldRow style={{ marginBottom: 0 }}>
              <FieldLabel s={s}>Alt Text</FieldLabel>
              <input
                type="text"
                value={localAltText}
                onChange={e => setLocalAltText(e.target.value)}
                onBlur={() => onUpdate('alt_text', localAltText.trim())}
                placeholder="Describe the image for search engines and screen readers"
                maxLength={200}
                style={INPUT}
              />
              <p style={{ margin: '4px 0 0', fontSize: 10, color: localAltText.length > 125 ? '#f59e0b' : s.hint }}>
                {localAltText.length} / 125 recommended
              </p>
              <AiSuggestBlock
                loading={altLoading}
                suggestion={altSuggestion}
                error={altError}
                label="Generate Alt Text"
                onSuggest={suggestAltText}
                onInsert={() => {
                  setLocalAltText(altSuggestion);
                  onUpdate('alt_text', altSuggestion);
                  setAltSuggestion(null);
                }}
                onReject={() => setAltSuggestion(null)}
                s={s}
              />
            </FieldRow>

          </div>
        </div>

        {/* ── Sticky footer: Prev / Save / Next ─────────────────────────────── */}
        <div style={{
          flexShrink: 0,
          display: 'flex', alignItems: 'stretch', gap: 0,
          borderTop: `1px solid ${s.border}`,
          backgroundColor: s.headerBg,
          transition: 'background-color 0.22s ease, border-color 0.22s ease',
        }}>
          {/* ← Prev */}
          <button
            onClick={handlePrev}
            disabled={!onPrev}
            title="Previous image"
            style={{
              flex: 1,
              padding: '13px 0',
              backgroundColor: 'transparent',
              border: 'none',
              borderRight: `1px solid ${s.border}`,
              color: onPrev ? s.text : s.hint,
              fontSize: 12, fontWeight: 600,
              cursor: onPrev ? 'pointer' : 'default',
              opacity: onPrev ? 1 : 0.35,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.15s',
            }}
          >
            ‹ Prev
          </button>

          {/* ✓ Save */}
          <button
            onClick={handleSave}
            title="Save all fields"
            style={{
              flex: 1.6,
              padding: '13px 0',
              backgroundColor: savedFlash
                ? (isDark ? 'rgba(21,128,61,0.25)' : '#f0faf5')
                : 'transparent',
              border: 'none',
              borderRight: `1px solid ${s.border}`,
              color: savedFlash ? GREEN : GOLD,
              fontSize: 12, fontWeight: 700,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              letterSpacing: '0.03em',
              transition: 'all 0.22s',
            }}
          >
            {savedFlash ? '✓ Saved' : '✓ Save'}
          </button>

          {/* Next › */}
          <button
            onClick={handleNext}
            disabled={!onNext}
            title="Next image"
            style={{
              flex: 1,
              padding: '13px 0',
              backgroundColor: 'transparent',
              border: 'none',
              color: onNext ? s.text : s.hint,
              fontSize: 12, fontWeight: 600,
              cursor: onNext ? 'pointer' : 'default',
              opacity: onNext ? 1 : 0.35,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.15s',
            }}
          >
            Next ›
          </button>
        </div>
      </div>
    </>
  );
}
