/**
 * MediaMetaCanvas — Premium right-side metadata editor for uploaded media
 *
 * Opens as a slide-in panel when the user clicks any image thumbnail
 * (both hero images and gallery media).
 *
 * All field changes apply immediately via onUpdate on blur.
 * The Save button flushes any pending (unblurred) changes and confirms.
 *
 * Keyboard: ← → navigate · Esc close · Cmd/Ctrl+S save
 *
 * AI: Generate Title, Description, Alt Text, Tags
 * User always confirms before inserting — AI never auto-fills.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabaseClient';

// ─── Constants ────────────────────────────────────────────────────────────────
const GOLD   = '#b8860b';
const GOLD2  = '#C5A059';
const GREEN  = '#15803d';
const RED    = '#dc2626';
const AMBER  = '#d97706';

const IMAGE_TYPES = [
  { value: '',                label: 'Select type…' },
  { value: 'ceremony',        label: 'Ceremony' },
  { value: 'reception',       label: 'Reception' },
  { value: 'detail_shot',     label: 'Detail Shot' },
  { value: 'portrait',        label: 'Portrait' },
  { value: 'venue_exterior',  label: 'Venue Exterior' },
  { value: 'venue_interior',  label: 'Venue Interior' },
  { value: 'food_tablescape', label: 'Food & Tablescape' },
  { value: 'aerial',          label: 'Aerial' },
  { value: 'bridal_prep',     label: 'Bridal Prep' },
  { value: 'other',           label: 'Other' },
];

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
  fileInfoBg:    '#f9f7f3',
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
  fileInfoBg:    'rgba(255,255,255,0.03)',
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
      {!suggestion && (
        <button
          type="button"
          onClick={onSuggest}
          disabled={loading}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 12px',
            background: loading ? s.divider : s.aiBtn,
            border: `1px solid ${loading ? s.border : s.aiBtnBorder}`,
            borderRadius: 4,
            color: loading ? s.hint : GOLD,
            fontSize: 11, fontWeight: 600,
            cursor: loading ? 'default' : 'pointer',
            letterSpacing: '0.03em', transition: 'all 0.15s',
          }}
        >
          <span style={{ fontSize: 13 }}>✨</span>
          {loading ? 'Generating…' : label}
        </button>
      )}
      {error && (
        <div style={{
          marginTop: 8, padding: '8px 12px',
          backgroundColor: s.errBg, border: `1px solid ${s.errBorder}`,
          borderRadius: 4, fontSize: 11, color: RED,
          display: 'flex', alignItems: 'flex-start', gap: 6,
        }}>
          <span>⚠</span><span>{error}</span>
        </div>
      )}
      {suggestion && (
        <div style={{
          marginTop: 8, padding: '12px 14px',
          backgroundColor: s.suggBg, border: `1px solid ${s.suggBorder}`,
          borderRadius: 6,
        }}>
          <p style={{
            margin: '0 0 2px', fontSize: 9, fontWeight: 700,
            letterSpacing: '0.07em', textTransform: 'uppercase', color: GREEN,
          }}>AI Suggestion</p>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: s.text, lineHeight: 1.65, fontStyle: 'italic' }}>
            "{suggestion}"
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" onClick={onInsert} style={{
              flex: 1, padding: '7px 0',
              backgroundColor: GREEN, color: '#fff', border: 'none', borderRadius: 4,
              fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.03em',
            }}>✓ Insert</button>
            <button type="button" onClick={onReject} style={{
              flex: 1, padding: '7px 0',
              backgroundColor: s.discardBg, color: s.discardText,
              border: `1px solid ${s.discardBorder}`, borderRadius: 4,
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}>✗ Discard</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtBytes = b => b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`;
const truncate  = (s, n) => s && s.length > n ? s.slice(0, n - 1) + '…' : s;

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function MediaMetaCanvas({
  item,
  objectUrls,
  onUpdate,
  onClose,
  venueId,
  onRemove,
  onMoveUp,
  onMoveDown,
  totalItems,
  itemIndex,
  onPrev,
  onNext,
}) {
  // ── Color scheme ─────────────────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(true);
  const s = isDark ? DARK : LIGHT;

  // ── Slide-in animation ───────────────────────────────────────────────────────
  const [visible, setVisible] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  // ── Scroll body ref (for reset on navigation) ─────────────────────────────────
  const scrollBodyRef = useRef(null);

  // ── Local text states ────────────────────────────────────────────────────────
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
  const [localImageType,   setLocalImageType]   = useState('');
  const [localShowCredit,  setLocalShowCredit]  = useState(false);

  // ── Tag input ─────────────────────────────────────────────────────────────────
  const [tagInput, setTagInput] = useState('');

  // ── Delete confirmation ───────────────────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState(false);

  // ── Image dimensions (captured from onLoad) ───────────────────────────────────
  const [imageDims, setImageDims] = useState(null);

  // ── Save flash ────────────────────────────────────────────────────────────────
  const [savedFlash, setSavedFlash] = useState(false);
  const savedFlashTimer = useRef(null);

  // ── AI states ─────────────────────────────────────────────────────────────────
  const [titleLoading,    setTitleLoading]    = useState(false);
  const [titleSuggestion, setTitleSuggestion] = useState(null);
  const [titleError,      setTitleError]      = useState(null);
  const [descLoading,     setDescLoading]     = useState(false);
  const [descSuggestion,  setDescSuggestion]  = useState(null);
  const [descError,       setDescError]       = useState(null);
  const [altLoading,      setAltLoading]      = useState(false);
  const [altSuggestion,   setAltSuggestion]   = useState(null);
  const [altError,        setAltError]        = useState(null);
  const [tagsLoading,     setTagsLoading]     = useState(false);
  const [tagsSuggestion,  setTagsSuggestion]  = useState(null);
  const [tagsError,       setTagsError]       = useState(null);

  // ── Sync all local state when item changes ────────────────────────────────────
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
    setLocalImageType(item.image_type ?? '');
    setLocalShowCredit(item.show_credit ?? false);
    setTagInput('');
    setConfirmDelete(false);
    setImageDims(null);
    setTitleSuggestion(null); setTitleError(null);
    setDescSuggestion(null);  setDescError(null);
    setAltSuggestion(null);   setAltError(null);
    setTagsSuggestion(null);  setTagsError(null);
    // Scroll reset
    if (scrollBodyRef.current) scrollBodyRef.current.scrollTop = 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  // ── Cleanup timers on unmount ─────────────────────────────────────────────────
  useEffect(() => () => clearTimeout(savedFlashTimer.current), []);

  // ── Close ─────────────────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 220);
  }, [onClose]);

  // ── Flush all local text state → parent ──────────────────────────────────────
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
    if (localImageType !== (item?.image_type ?? '')) onUpdate('image_type', localImageType);
  }, [onUpdate, localTitle, localCaption, localDescription, localCreditName,
      localInstagram, localWebsite, localCamera, localLocation, localCopyright,
      localAltText, localImageType, item]);

  // ── Save ──────────────────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    flushAll();
    clearTimeout(savedFlashTimer.current);
    setSavedFlash(true);
    savedFlashTimer.current = setTimeout(() => setSavedFlash(false), 1800);
  }, [flushAll]);

  // ── Prev / Next (flush first) ─────────────────────────────────────────────────
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

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────
  useEffect(() => {
    const fn = (e) => {
      // Don't fire nav keys when user is typing in an input/textarea
      const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);
      if (e.key === 'Escape') { handleClose(); return; }
      if (!inInput && e.key === 'ArrowLeft')  { handlePrev(); return; }
      if (!inInput && e.key === 'ArrowRight') { handleNext(); return; }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSave(); }
    };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [handleClose, handlePrev, handleNext, handleSave]);

  // ── Image source ──────────────────────────────────────────────────────────────
  const imgSrc = item
    ? (item.file instanceof File
        ? (objectUrls?.[item.id] ?? null)
        : (item.url || item.thumbnail || null))
    : null;

  const tags = Array.isArray(item?.tags) ? item.tags : [];

  // ── AI context builder ────────────────────────────────────────────────────────
  const buildContext = (includeDesc = false) => [
    localImageType   && `Type: ${IMAGE_TYPES.find(t => t.value === localImageType)?.label || localImageType}`,
    localTitle       && `Title: ${localTitle}`,
    localCaption     && `Caption: ${localCaption}`,
    includeDesc && localDescription && `Description: ${localDescription}`,
    localLocation    && `Location: ${localLocation}`,
    tags.length      && `Tags: ${tags.join(', ')}`,
  ].filter(Boolean).join('. ');

  // ── AI functions ──────────────────────────────────────────────────────────────
  const aiCall = async (feature, systemPrompt, userPrompt, setLoading, setError, setSuggestion) => {
    setLoading(true); setError(null); setSuggestion(null);
    try {
      const { data, error: err } = await supabase.functions.invoke('ai-generate', {
        body: { feature, systemPrompt, userPrompt: userPrompt || 'A luxury wedding image.', venue_id: venueId },
      });
      if (err) throw new Error(err.message);
      if (data?.text) setSuggestion(data.text.trim().replace(/^["']|["']$/g, ''));
      else throw new Error('No content returned from AI');
    } catch (e) { setError(e.message || 'AI suggestion failed. Try again.'); }
    finally { setLoading(false); }
  };

  const suggestTitle = () => aiCall(
    'media_title',
    'You are a professional media editor for a luxury wedding directory. Generate a concise, evocative title for a wedding image. Maximum 8 words. No quotes or punctuation at end.',
    buildContext(true),
    setTitleLoading, setTitleError, setTitleSuggestion,
  );

  const suggestDescription = () => aiCall(
    'media_description',
    'You are a professional editorial writer for luxury weddings. Write a rich, evocative, atmospheric description for a wedding media image. Be specific and sensory. Aim for 2–3 sentences.',
    buildContext(false),
    setDescLoading, setDescError, setDescSuggestion,
  );

  const suggestAltText = () => aiCall(
    'media_alt_text',
    'You are an SEO and accessibility specialist. Write a concise, visually descriptive alt text for a luxury wedding image. Keep it under 125 characters. Be specific about what is in the image.',
    buildContext(true),
    setAltLoading, setAltError, setAltSuggestion,
  );

  const suggestTags = () => aiCall(
    'media_tags',
    'You are a wedding photography metadata specialist. Suggest 4-6 relevant, specific tags for a luxury wedding image. Return ONLY a comma-separated list of lowercase tags, nothing else. Example: ceremony, golden hour, outdoor, floral, candid',
    buildContext(true),
    setTagsLoading, setTagsError, setTagsSuggestion,
  );

  // ── Tag handlers ──────────────────────────────────────────────────────────────
  const addTag = (raw) => {
    const tag = raw.trim().replace(/,+$/, '').trim().toLowerCase();
    if (!tag || tags.includes(tag)) return;
    onUpdate('tags', [...tags, tag]);
    setTagInput('');
  };
  const removeTag    = (t) => onUpdate('tags', tags.filter(x => x !== t));
  const handleTagKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput); }
    else if (e.key === 'Backspace' && !tagInput && tags.length > 0) removeTag(tags[tags.length - 1]);
  };

  // ── Insert AI tags (parse comma list, skip duplicates) ────────────────────────
  const insertAiTags = () => {
    if (!tagsSuggestion) return;
    const newTags = tagsSuggestion
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t && !tags.includes(t));
    if (newTags.length) onUpdate('tags', [...tags, ...newTags]);
    setTagsSuggestion(null);
  };

  if (!item) return null;

  // ── Derived display values ────────────────────────────────────────────────────
  const typeLabel = item.type === 'video' ? 'Video' : item.type === 'virtual_tour' ? 'Virtual Tour' : 'Image';
  const posLabel  = totalItems > 0 ? `${typeLabel} ${(itemIndex ?? 0) + 1} of ${totalItems}` : typeLabel;

  // ── Unsaved indicator ─────────────────────────────────────────────────────────
  const hasUnsaved = !!(
    localTitle       !== (item.title              ?? '') ||
    localCaption     !== (item.caption            ?? '') ||
    localDescription !== (item.description        ?? '') ||
    localCreditName  !== (item.credit_name        ?? '') ||
    localInstagram   !== (item.credit_instagram   ?? '').replace(/^@/, '') ||
    localWebsite     !== (item.credit_website     ?? '') ||
    localCamera      !== (item.credit_camera      ?? '') ||
    localLocation    !== (item.location           ?? '') ||
    localCopyright   !== (item.copyright          ?? '') ||
    localAltText     !== (item.alt_text           ?? '') ||
    localImageType   !== (item.image_type         ?? '') ||
    localShowCredit  !== (item.show_credit        ?? false)
  );

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
    transition: 'all 0.15s', whiteSpace: 'nowrap', flexShrink: 0, lineHeight: 1,
  });

  const canMoveUp   = onMoveUp   && itemIndex > 0;
  const canMoveDown = onMoveDown && itemIndex < (totalItems - 1);

  // ── File info ─────────────────────────────────────────────────────────────────
  const hasFileInfo = item.file instanceof File || imageDims;
  const fileName    = item.file instanceof File ? item.file.name : null;
  const fileSize    = item.file instanceof File ? fmtBytes(item.file.size) : null;

  return (
    <>
      {/* ── Backdrop ─────────────────────────────────────────────────────── */}
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

      {/* ── Canvas panel ─────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0,
          width: 420, height: '100vh',
          backgroundColor: s.bg, zIndex: 1300,
          display: 'flex', flexDirection: 'column',
          boxShadow: s.shadow,
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.22s ease, background-color 0.22s ease, box-shadow 0.22s ease',
        }}
      >

        {/* ── Fixed header ─────────────────────────────────────────────── */}
        <div style={{
          flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '0 14px', height: 56,
          borderBottom: `1px solid ${s.border}`,
          backgroundColor: s.headerBg,
          transition: 'background-color 0.22s ease, border-color 0.22s ease',
        }}>
          {/* Labels + status */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              margin: 0, fontSize: 8, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD,
            }}>
              Media Asset
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
              <p style={{
                margin: 0, fontSize: 12, color: s.subText,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                transition: 'color 0.22s ease',
              }}>
                {posLabel}
              </p>
              {hasUnsaved && !savedFlash && (
                <span style={{ fontSize: 9, color: AMBER, fontWeight: 700, flexShrink: 0, letterSpacing: '0.03em' }}>
                  ● unsaved
                </span>
              )}
              {savedFlash && (
                <span style={{ fontSize: 9, color: GREEN, fontWeight: 700, flexShrink: 0, letterSpacing: '0.03em' }}>
                  ✓ saved
                </span>
              )}
            </div>
          </div>

          {/* Light toggle */}
          <button
            type="button"
            onClick={() => setIsDark(d => !d)}
            title={isDark ? 'Lights on' : 'Lights off'}
            style={{
              width: 30, height: 30, borderRadius: '50%',
              border: `1px solid ${s.toggleBorder}`,
              backgroundColor: s.toggleBg, cursor: 'pointer',
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
            type="button"
            onClick={handleClose}
            title="Close (Esc)"
            style={{
              width: 30, height: 30, borderRadius: '50%',
              border: `1px solid ${s.border}`, backgroundColor: 'transparent',
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

        {/* ── Scrollable body ───────────────────────────────────────────── */}
        <div ref={scrollBodyRef} style={{ flex: 1, overflowY: 'auto' }}>

          {/* ── Sticky zone: image + file info + action bar ────────────── */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 10,
            backgroundColor: s.bg,
            transition: 'background-color 0.22s ease',
          }}>
            {/* Image preview */}
            <div style={{
              width: '100%', height: 260,
              backgroundColor: s.imageBg,
              overflow: 'hidden', position: 'relative', flexShrink: 0,
              borderBottom: hasFileInfo ? 'none' : `1px solid ${s.border}`,
              transition: 'background-color 0.22s ease',
            }}>
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt={localAltText || 'Media preview'}
                  onLoad={e => setImageDims({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48,
                }}>
                  {item.type === 'video' ? '🎬' : item.type === 'virtual_tour' ? '🌐' : '🖼️'}
                </div>
              )}
              {/* Type badge */}
              <div style={{
                position: 'absolute', bottom: 10, left: 12,
                padding: '3px 8px', backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: 3, fontSize: 9, fontWeight: 700,
                letterSpacing: '0.07em', textTransform: 'uppercase', color: '#fff',
              }}>
                {typeLabel}
              </div>
            </div>

            {/* File info bar */}
            {hasFileInfo && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '5px 14px',
                backgroundColor: s.fileInfoBg,
                borderBottom: `1px solid ${s.border}`,
                fontSize: 10, color: s.muted,
                transition: 'all 0.22s',
              }}>
                {fileName && (
                  <span title={fileName} style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    📄 {truncate(fileName, 30)}
                  </span>
                )}
                {fileSize && <span style={{ flexShrink: 0 }}>{fileSize}</span>}
                {imageDims && (
                  <span style={{ flexShrink: 0, marginLeft: 'auto' }}>
                    {imageDims.w} × {imageDims.h}px
                  </span>
                )}
              </div>
            )}

            {/* ── Action bar ─────────────────────────────────────────── */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 14px',
              minHeight: 46,
              borderBottom: `1px solid ${s.border}`,
              backgroundColor: s.headerBg,
              transition: 'background-color 0.22s ease, border-color 0.22s ease',
            }}>
              {confirmDelete ? (
                /* ── Delete confirmation ── */
                <>
                  <span style={{ fontSize: 11, color: RED, fontWeight: 600, flexShrink: 0 }}>
                    Delete this image?
                  </span>
                  <div style={{ flex: 1 }} />
                  <button
                    type="button"
                    onClick={() => { setConfirmDelete(false); if (onRemove) onRemove(); }}
                    style={{ ...actionBtn(false, true), fontSize: 11 }}
                  >
                    Yes, delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    style={{ ...actionBtn(false), fontSize: 11 }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                /* ── Normal action bar ── */
                <>
                  <button
                    type="button"
                    onClick={() => onUpdate('is_featured', !item.is_featured)}
                    style={actionBtn(item.is_featured)}
                    title={item.is_featured ? 'Remove featured' : 'Set as featured'}
                  >
                    <span>★</span>Feature
                  </button>

                  <select
                    value={item.visibility ?? 'public'}
                    onChange={e => onUpdate('visibility', e.target.value)}
                    style={{
                      padding: '6px 8px',
                      border: `1px solid ${s.actionBorder}`, borderRadius: 4,
                      backgroundColor: s.actionBg, color: s.actionText,
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      outline: 'none', transition: 'all 0.22s',
                    }}
                  >
                    <option value="public">👁 Public</option>
                    <option value="private">🔒 Private</option>
                  </select>

                  <div style={{ flex: 1 }} />

                  <button
                    type="button"
                    onClick={canMoveUp ? onMoveUp : undefined}
                    title="Move up (↑)"
                    style={{ ...actionBtn(false), padding: '6px 9px', opacity: canMoveUp ? 1 : 0.3, cursor: canMoveUp ? 'pointer' : 'default' }}
                  >⬆</button>

                  <button
                    type="button"
                    onClick={canMoveDown ? onMoveDown : undefined}
                    title="Move down (↓)"
                    style={{ ...actionBtn(false), padding: '6px 9px', opacity: canMoveDown ? 1 : 0.3, cursor: canMoveDown ? 'pointer' : 'default' }}
                  >⬇</button>

                  {onRemove && (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      title="Remove image"
                      style={{ ...actionBtn(false, true), padding: '6px 9px' }}
                    >🗑</button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Metadata form ─────────────────────────────────────────── */}
          <div style={{ padding: '24px 20px 52px', transition: 'background-color 0.22s ease' }}>

            {/* ─── CORE INFO ─────────────────────────────────────────── */}
            <SectionLabel>Core Info</SectionLabel>

            {/* Image type */}
            <FieldRow>
              <FieldLabel s={s}>Image Type</FieldLabel>
              <select
                value={localImageType}
                onChange={e => { setLocalImageType(e.target.value); onUpdate('image_type', e.target.value); }}
                style={{
                  ...INPUT, cursor: 'pointer',
                  paddingRight: 28, appearance: 'none', WebkitAppearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='${isDark ? '%23888' : '%23999'}' d='M0 0l5 6 5-6z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '8px',
                }}
              >
                {IMAGE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </FieldRow>

            {/* Title */}
            <FieldRow style={{ marginBottom: 0 }}>
              <FieldLabel s={s}>Title</FieldLabel>
              <input
                type="text" value={localTitle}
                onChange={e => setLocalTitle(e.target.value)}
                onBlur={() => onUpdate('title', localTitle.trim())}
                placeholder="e.g. Ceremony at the golden hour"
                style={INPUT}
              />
              <AiSuggestBlock
                loading={titleLoading} suggestion={titleSuggestion} error={titleError}
                label="Generate Title"
                onSuggest={suggestTitle}
                onInsert={() => { setLocalTitle(titleSuggestion); onUpdate('title', titleSuggestion); setTitleSuggestion(null); }}
                onReject={() => setTitleSuggestion(null)}
                s={s}
              />
            </FieldRow>

            <div style={{ marginBottom: 16 }} />

            {/* Caption */}
            <FieldRow>
              <FieldLabel s={s}>Caption</FieldLabel>
              <input
                type="text" value={localCaption}
                onChange={e => setLocalCaption(e.target.value)}
                onBlur={() => onUpdate('caption', localCaption.trim())}
                placeholder="Short caption shown beneath the image"
                style={INPUT}
              />
            </FieldRow>

            {/* Description */}
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
                loading={descLoading} suggestion={descSuggestion} error={descError}
                label="Generate Description"
                onSuggest={suggestDescription}
                onInsert={() => { setLocalDescription(descSuggestion); onUpdate('description', descSuggestion); setDescSuggestion(null); }}
                onReject={() => setDescSuggestion(null)}
                s={s}
              />
            </FieldRow>

            <Divider s={s} />

            {/* ─── PHOTOGRAPHER CREDITS ──────────────────────────────── */}
            <SectionLabel>Photographer Credits</SectionLabel>

            <FieldRow>
              <FieldLabel s={s}>Photographer Name</FieldLabel>
              <input type="text" value={localCreditName}
                onChange={e => setLocalCreditName(e.target.value)}
                onBlur={() => onUpdate('credit_name', localCreditName.trim())}
                placeholder="Full name or studio"
                style={INPUT} />
            </FieldRow>

            <FieldRow>
              <FieldLabel s={s}>Instagram</FieldLabel>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: s.hint, fontSize: 13, pointerEvents: 'none', userSelect: 'none',
                }}>@</span>
                <input type="text" value={localInstagram}
                  onChange={e => setLocalInstagram(e.target.value.replace(/^@/, ''))}
                  onBlur={() => {
                    const val = localInstagram.trim().replace(/^@/, '');
                    setLocalInstagram(val);
                    onUpdate('credit_instagram', val ? `@${val}` : '');
                  }}
                  placeholder="instagram_handle"
                  style={{ ...INPUT, paddingLeft: 26 }} />
              </div>
            </FieldRow>

            <FieldRow>
              <FieldLabel s={s}>Website</FieldLabel>
              <input type="url" value={localWebsite}
                onChange={e => setLocalWebsite(e.target.value)}
                onBlur={() => onUpdate('credit_website', localWebsite.trim())}
                placeholder="https://"
                style={INPUT} />
            </FieldRow>

            <FieldRow>
              <FieldLabel s={s}>Camera / Gear</FieldLabel>
              <input type="text" value={localCamera}
                onChange={e => setLocalCamera(e.target.value)}
                onBlur={() => onUpdate('credit_camera', localCamera.trim())}
                placeholder="e.g. Sony A7R V · 85mm f/1.4"
                style={INPUT} />
            </FieldRow>

            {/* Show credit toggle */}
            <FieldRow style={{ marginBottom: 0 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px',
                backgroundColor: localShowCredit ? (s.suggBg) : s.inputBg,
                border: `1px solid ${localShowCredit ? s.suggBorder : s.inputBorder}`,
                borderRadius: 6,
                transition: 'all 0.2s ease',
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: s.text }}>
                    Show credit on card
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 10, color: s.muted, lineHeight: 1.4 }}>
                    {localShowCredit
                      ? 'Photographer credit visible on listing cards'
                      : 'Credit stored but hidden from front end'}
                  </p>
                </div>
                {/* Pill toggle */}
                <button
                  type="button"
                  onClick={() => {
                    const next = !localShowCredit;
                    setLocalShowCredit(next);
                    onUpdate('show_credit', next);
                  }}
                  aria-label={localShowCredit ? 'Hide credit' : 'Show credit'}
                  style={{
                    width: 40, height: 22, borderRadius: 11, border: 'none',
                    cursor: 'pointer', flexShrink: 0, position: 'relative',
                    backgroundColor: localShowCredit ? GREEN : s.hint,
                    transition: 'background-color 0.2s ease',
                    padding: 0,
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    top: 3,
                    left: localShowCredit ? 21 : 3,
                    width: 16, height: 16, borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    transition: 'left 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                  }} />
                </button>
              </div>
            </FieldRow>

            <Divider s={s} />

            {/* ─── LOCATION & CONTEXT ────────────────────────────────── */}
            <SectionLabel>Location &amp; Context</SectionLabel>

            <FieldRow>
              <FieldLabel s={s}>Location</FieldLabel>
              <input type="text" value={localLocation}
                onChange={e => setLocalLocation(e.target.value)}
                onBlur={() => onUpdate('location', localLocation.trim())}
                placeholder="e.g. Tuscany, Italy"
                style={INPUT} />
            </FieldRow>

            <FieldRow style={{ marginBottom: 0 }}>
              <FieldLabel s={s}>Tags</FieldLabel>
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 6, padding: '7px 10px',
                border: `1px solid ${s.inputBorder}`, borderRadius: 4,
                backgroundColor: s.inputBg, minHeight: 42, alignItems: 'center',
                cursor: 'text', transition: 'background-color 0.22s, border-color 0.22s',
              }}>
                {tags.map(tag => (
                  <span key={tag} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px',
                    backgroundColor: s.tagBg, border: `1px solid ${s.tagBorder}`,
                    borderRadius: 12, fontSize: 11, color: s.tagText, fontWeight: 600, transition: 'all 0.22s',
                  }}>
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} style={{
                      background: 'none', border: 'none', cursor: 'pointer', color: s.tagText,
                      padding: '0 0 1px', fontSize: 13, lineHeight: 1, display: 'flex', alignItems: 'center', opacity: 0.7,
                    }} title={`Remove "${tag}"`}>×</button>
                  </span>
                ))}
                <input type="text" value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagKey}
                  onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
                  placeholder={tags.length === 0 ? 'Add tags… (Enter or comma)' : '+'}
                  style={{
                    border: 'none', outline: 'none', fontSize: 12, color: s.inputText,
                    backgroundColor: 'transparent',
                    minWidth: tags.length === 0 ? 160 : 40, flex: 1, padding: '2px 2px',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  }}
                />
              </div>
              <p style={{ margin: '5px 0 0', fontSize: 10, color: s.hint }}>
                Press Enter or comma to add · Backspace to remove last
              </p>
              {/* AI Tag suggestion */}
              {tagsSuggestion ? (
                <div style={{
                  marginTop: 10, padding: '12px 14px',
                  backgroundColor: s.suggBg, border: `1px solid ${s.suggBorder}`,
                  borderRadius: 6,
                }}>
                  <p style={{ margin: '0 0 6px', fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: GREEN }}>
                    AI Tag Suggestions
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                    {tagsSuggestion.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                      <span key={tag} style={{
                        padding: '3px 8px', backgroundColor: s.tagBg,
                        border: `1px solid ${s.tagBorder}`, borderRadius: 12,
                        fontSize: 11, color: s.tagText, fontWeight: 600,
                      }}>{tag}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" onClick={insertAiTags} style={{
                      flex: 1, padding: '7px 0', backgroundColor: GREEN, color: '#fff',
                      border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    }}>✓ Add all</button>
                    <button type="button" onClick={() => setTagsSuggestion(null)} style={{
                      flex: 1, padding: '7px 0', backgroundColor: s.discardBg, color: s.discardText,
                      border: `1px solid ${s.discardBorder}`, borderRadius: 4,
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    }}>✗ Discard</button>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 10 }}>
                  {tagsError && (
                    <div style={{
                      marginBottom: 6, padding: '8px 12px', backgroundColor: s.errBg,
                      border: `1px solid ${s.errBorder}`, borderRadius: 4,
                      fontSize: 11, color: RED, display: 'flex', gap: 6,
                    }}><span>⚠</span><span>{tagsError}</span></div>
                  )}
                  <button
                    type="button"
                    onClick={suggestTags}
                    disabled={tagsLoading}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px',
                      background: tagsLoading ? s.divider : s.aiBtn,
                      border: `1px solid ${tagsLoading ? s.border : s.aiBtnBorder}`,
                      borderRadius: 4, color: tagsLoading ? s.hint : GOLD,
                      fontSize: 11, fontWeight: 600, cursor: tagsLoading ? 'default' : 'pointer',
                      letterSpacing: '0.03em', transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 13 }}>✨</span>
                    {tagsLoading ? 'Generating…' : 'Generate Tags'}
                  </button>
                </div>
              )}
            </FieldRow>

            <Divider s={s} />

            {/* ─── COPYRIGHT ──────────────────────────────────────────── */}
            <SectionLabel>Copyright</SectionLabel>

            <FieldRow style={{ marginBottom: 0 }}>
              <FieldLabel s={s}>Copyright / Credit Line</FieldLabel>
              <input type="text" value={localCopyright}
                onChange={e => setLocalCopyright(e.target.value)}
                onBlur={() => onUpdate('copyright', localCopyright.trim())}
                placeholder="e.g. © 2025 Jane Smith Photography"
                style={INPUT} />
            </FieldRow>

            <Divider s={s} />

            {/* ─── SEO & ACCESSIBILITY ─────────────────────────────────── */}
            <SectionLabel>SEO &amp; Accessibility</SectionLabel>

            <FieldRow style={{ marginBottom: 0 }}>
              <FieldLabel s={s}>Alt Text</FieldLabel>
              <input type="text" value={localAltText}
                onChange={e => setLocalAltText(e.target.value)}
                onBlur={() => onUpdate('alt_text', localAltText.trim())}
                placeholder="Describe the image for search engines and screen readers"
                maxLength={200}
                style={INPUT} />
              <p style={{ margin: '4px 0 0', fontSize: 10, color: localAltText.length > 125 ? '#f59e0b' : s.hint }}>
                {localAltText.length} / 125 recommended
              </p>
              <AiSuggestBlock
                loading={altLoading} suggestion={altSuggestion} error={altError}
                label="Generate Alt Text"
                onSuggest={suggestAltText}
                onInsert={() => { setLocalAltText(altSuggestion); onUpdate('alt_text', altSuggestion); setAltSuggestion(null); }}
                onReject={() => setAltSuggestion(null)}
                s={s}
              />
            </FieldRow>

          </div>
        </div>

        {/* ── Sticky footer: Prev / Save / Next ────────────────────────── */}
        <div style={{
          flexShrink: 0, display: 'flex', alignItems: 'stretch', gap: 0,
          borderTop: `1px solid ${s.border}`, backgroundColor: s.headerBg,
          transition: 'background-color 0.22s ease, border-color 0.22s ease',
        }}>
          <button
            type="button"
            onClick={handlePrev}
            disabled={!onPrev}
            title="Previous image (←)"
            style={{
              flex: 1, padding: '13px 0', backgroundColor: 'transparent',
              border: 'none', borderRight: `1px solid ${s.border}`,
              color: onPrev ? s.text : s.hint, fontSize: 12, fontWeight: 600,
              cursor: onPrev ? 'pointer' : 'default', opacity: onPrev ? 1 : 0.35,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.15s',
            }}
          >
            ‹ Prev
          </button>

          <button
            type="button"
            onClick={handleSave}
            title="Save all fields (⌘S)"
            style={{
              flex: 1.6, padding: '13px 0',
              backgroundColor: savedFlash
                ? (isDark ? 'rgba(21,128,61,0.25)' : '#f0faf5')
                : 'transparent',
              border: 'none', borderRight: `1px solid ${s.border}`,
              color: savedFlash ? GREEN : (hasUnsaved ? AMBER : GOLD),
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              letterSpacing: '0.03em', transition: 'all 0.22s',
            }}
          >
            {savedFlash ? '✓ Saved' : (hasUnsaved ? '● Save' : '✓ Save')}
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={!onNext}
            title="Next image (→)"
            style={{
              flex: 1, padding: '13px 0', backgroundColor: 'transparent',
              border: 'none',
              color: onNext ? s.text : s.hint, fontSize: 12, fontWeight: 600,
              cursor: onNext ? 'pointer' : 'default', opacity: onNext ? 1 : 0.35,
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
