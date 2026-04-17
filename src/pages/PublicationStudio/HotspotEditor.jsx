// ─── src/pages/PublicationStudio/HotspotEditor.jsx ───────────────────────────
// Full-screen overlay editor for hotspot regions and vendor credits on a
// single magazine page.
//
// Props:
//   page     { id, page_number, image_url, link_targets, vendor_credits, ... }
//   onSave   (updatedPage) => void  — called after successful DB save
//   onClose  () => void

import { useState, useRef, useCallback } from 'react';
import { updatePageHotspots, updatePageCredits, updatePageVideo } from '../../services/magazinePageService';

// ── Design tokens ──────────────────────────────────────────────────────────────
const GOLD   = '#C9A84C';
const BG     = '#0A0908';
const SURF   = '#141210';
const SIDE   = '#100F0D';
const BORDER = 'rgba(255,255,255,0.08)';
const MUTED  = 'rgba(255,255,255,0.4)';
const NU     = "var(--font-body,'Nunito Sans',sans-serif)";
const GD     = "var(--font-heading-primary,'Cormorant Garamond',Georgia,serif)";

const CATEGORIES = [
  'bridal-dresses',
  'venues',
  'photographers',
  'florists',
  'jewellery',
  'styling-decor',
  'other',
];

const INPUT_STYLE = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 3,
  color: '#fff',
  fontFamily: NU,
  fontSize: 12,
  padding: '7px 9px',
  outline: 'none',
};

const SELECT_STYLE = {
  ...INPUT_STYLE,
  cursor: 'pointer',
};

// ── Small label ───────────────────────────────────────────────────────────────
function Lbl({ children }) {
  return (
    <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
      {children}
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <Lbl>{label}</Lbl>
      {children}
    </div>
  );
}

// ── Hotspot inline edit form ──────────────────────────────────────────────────
function HotspotForm({ hotspot, onUpdate, onCancel }) {
  const [draft, setDraft] = useState({ ...hotspot });
  const set = (k, v) => setDraft(prev => ({ ...prev, [k]: v }));

  return (
    <div style={{ background: 'rgba(201,168,76,0.05)', border: `1px solid rgba(201,168,76,0.2)`, borderRadius: 4, padding: '12px 14px', marginTop: 6 }}>
      <FormField label="Label">
        <input value={draft.label || ''} onChange={e => set('label', e.target.value)} placeholder="e.g. Vera Wang Gown" style={INPUT_STYLE} />
      </FormField>
      <FormField label="Type">
        <select value={draft.type || 'vendor'} onChange={e => set('type', e.target.value)} style={{ ...SELECT_STYLE, background: '#1a1a18' }}>
          <option value="vendor" style={{ background: '#1a1a18' }}>vendor</option>
          <option value="url"    style={{ background: '#1a1a18' }}>url</option>
        </select>
      </FormField>
      <FormField label="URL">
        <input value={draft.url || ''} onChange={e => set('url', e.target.value)} placeholder="/vendor/vera-wang or https://..." style={INPUT_STYLE} />
      </FormField>
      <FormField label="Vendor Name">
        <input value={draft.vendorName || ''} onChange={e => set('vendorName', e.target.value)} placeholder="Vera Wang" style={INPUT_STYLE} />
      </FormField>
      <FormField label="Category">
        <select value={draft.category || 'other'} onChange={e => set('category', e.target.value)} style={{ ...SELECT_STYLE, background: '#1a1a18' }}>
          {CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#1a1a18' }}>{c}</option>)}
        </select>
      </FormField>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button onClick={() => onUpdate(draft)} style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: GOLD, border: 'none', color: '#0A0908', padding: '6px 14px', borderRadius: 2, cursor: 'pointer' }}>Save</button>
        <button onClick={onCancel} style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'none', border: `1px solid ${BORDER}`, color: MUTED, padding: '6px 14px', borderRadius: 2, cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  );
}

// ── Credit inline edit form ───────────────────────────────────────────────────
function CreditForm({ credit, onSave, onCancel }) {
  const [draft, setDraft] = useState({ ...credit });
  const set = (k, v) => setDraft(prev => ({ ...prev, [k]: v }));

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, borderRadius: 4, padding: '12px 14px', marginTop: 6 }}>
      <FormField label="Role">
        <input value={draft.role || ''} onChange={e => set('role', e.target.value)} placeholder="e.g. Wedding Gown" style={INPUT_STYLE} />
      </FormField>
      <FormField label="Vendor Name">
        <input value={draft.vendorName || ''} onChange={e => set('vendorName', e.target.value)} placeholder="Vera Wang" style={INPUT_STYLE} />
      </FormField>
      <FormField label="Category">
        <select value={draft.category || 'other'} onChange={e => set('category', e.target.value)} style={{ ...SELECT_STYLE, background: '#1a1a18' }}>
          {CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#1a1a18' }}>{c}</option>)}
        </select>
      </FormField>
      <FormField label="Profile Slug (optional)">
        <input value={draft.profileSlug || ''} onChange={e => set('profileSlug', e.target.value)} placeholder="vera-wang" style={INPUT_STYLE} />
      </FormField>
      <FormField label="Website (optional)">
        <input value={draft.website || ''} onChange={e => set('website', e.target.value)} placeholder="https://verawang.com" style={INPUT_STYLE} />
      </FormField>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button onClick={() => onSave(draft)} style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: GOLD, border: 'none', color: '#0A0908', padding: '6px 14px', borderRadius: 2, cursor: 'pointer' }}>Save</button>
        <button onClick={onCancel} style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'none', border: `1px solid ${BORDER}`, color: MUTED, padding: '6px 14px', borderRadius: 2, cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  );
}

// ── Main HotspotEditor ────────────────────────────────────────────────────────
export default function HotspotEditor({ page, onSave, onClose }) {
  const [hotspots,       setHotspots]       = useState(page.link_targets  || []);
  const [credits,        setCredits]        = useState(page.vendor_credits || []);
  const [activeTab,      setActiveTab]      = useState('hotspots'); // 'hotspots' | 'credits' | 'video'
  const [editingHotspot, setEditingHotspot] = useState(null); // hotspot id or null
  const [editingCredit,  setEditingCredit]  = useState(null); // credit id or null
  const [addingCredit,   setAddingCredit]   = useState(false);

  // Video state
  const [videoUrl,      setVideoUrl]      = useState(page.video_url      || '');
  const [videoAutoplay, setVideoAutoplay] = useState(page.video_autoplay ?? false);
  const [videoMuted,    setVideoMuted]    = useState(page.video_muted    ?? true);
  const [videoSaving,   setVideoSaving]   = useState(false);
  const [videoSaveMsg,  setVideoSaveMsg]  = useState('');

  // Drawing state
  const [drawing,      setDrawing]      = useState(false);
  const [drawStart,    setDrawStart]    = useState(null);
  const [drawCurrent,  setDrawCurrent]  = useState(null);

  // Save state
  const [saving,   setSaving]   = useState(false);
  const [saveMsg,  setSaveMsg]  = useState('');

  const imgContainerRef = useRef(null);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const getPct = useCallback((clientX, clientY) => {
    const rect = imgContainerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((clientY - rect.top)  / rect.height) * 100)),
    };
  }, []);

  // ── Mouse handlers ────────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    // Only start drawing if clicking on the overlay area itself, not a hotspot div
    if (e.target !== e.currentTarget) return;
    e.preventDefault();
    const pos = getPct(e.clientX, e.clientY);
    setDrawing(true);
    setDrawStart(pos);
    setDrawCurrent(pos);
  }, [getPct]);

  const onMouseMove = useCallback((e) => {
    if (!drawing) return;
    setDrawCurrent(getPct(e.clientX, e.clientY));
  }, [drawing, getPct]);

  const onMouseUp = useCallback((e) => {
    if (!drawing) return;
    setDrawing(false);
    const end = getPct(e.clientX, e.clientY);

    const x = Math.min(drawStart.x, end.x);
    const y = Math.min(drawStart.y, end.y);
    const w = Math.abs(end.x - drawStart.x);
    const h = Math.abs(end.y - drawStart.y);

    if (w * h > 2) {
      const newHotspot = {
        id:         crypto.randomUUID(),
        x:          parseFloat(x.toFixed(2)),
        y:          parseFloat(y.toFixed(2)),
        w:          parseFloat(w.toFixed(2)),
        h:          parseFloat(h.toFixed(2)),
        type:       'vendor',
        label:      '',
        url:        '',
        vendorName: '',
        category:   'other',
      };
      setHotspots(prev => [...prev, newHotspot]);
      setEditingHotspot(newHotspot.id);
      setActiveTab('hotspots');
    }

    setDrawStart(null);
    setDrawCurrent(null);
  }, [drawing, drawStart, getPct]);

  // ── Hotspot operations ────────────────────────────────────────────────────────
  const updateHotspot = useCallback((updated) => {
    setHotspots(prev => prev.map(h => h.id === updated.id ? updated : h));
    setEditingHotspot(null);
  }, []);

  const deleteHotspot = useCallback((id) => {
    setHotspots(prev => prev.filter(h => h.id !== id));
    if (editingHotspot === id) setEditingHotspot(null);
  }, [editingHotspot]);

  // ── Credit operations ─────────────────────────────────────────────────────────
  const addCredit = useCallback((draft) => {
    const credit = { ...draft, id: crypto.randomUUID() };
    setCredits(prev => [...prev, credit]);
    setAddingCredit(false);
  }, []);

  const updateCredit = useCallback((updated) => {
    setCredits(prev => prev.map(c => c.id === updated.id ? updated : c));
    setEditingCredit(null);
  }, []);

  const deleteCredit = useCallback((id) => {
    setCredits(prev => prev.filter(c => c.id !== id));
    if (editingCredit === id) setEditingCredit(null);
  }, [editingCredit]);

  // ── Save hotspots + credits ───────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    const [r1, r2] = await Promise.all([
      updatePageHotspots(page.id, hotspots),
      updatePageCredits(page.id, credits),
    ]);
    if (r1.error || r2.error) {
      setSaveMsg('Save failed');
      setSaving(false);
      return;
    }
    setSaveMsg('Saved ✓');
    setSaving(false);
    onSave({ ...page, link_targets: hotspots, vendor_credits: credits });
  };

  // ── Save video ────────────────────────────────────────────────────────────────
  const handleSaveVideo = async () => {
    setVideoSaving(true);
    setVideoSaveMsg('');
    const { error } = await updatePageVideo(page.id, {
      video_url:      videoUrl || null,
      video_autoplay: videoAutoplay,
      video_muted:    videoAutoplay ? true : videoMuted, // autoplay forces muted
    });
    if (error) {
      setVideoSaveMsg('Save failed');
    } else {
      setVideoSaveMsg('Saved ✓');
      setTimeout(() => setVideoSaveMsg(''), 2500);
      onSave({ ...page, video_url: videoUrl || null, video_autoplay: videoAutoplay, video_muted: videoMuted });
    }
    setVideoSaving(false);
  };

  // Helper: build an embed preview URL for YouTube/Vimeo
  const getPreviewEmbed = (url) => {
    if (!url) return null;
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const id = url.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (url.includes('vimeo.com')) {
      const id = url.match(/vimeo\.com\/(\d+)/)?.[1];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  };

  const previewEmbed = getPreviewEmbed(videoUrl);

  // ── Draw preview rect ─────────────────────────────────────────────────────────
  const drawRect = drawing && drawStart && drawCurrent ? {
    x: Math.min(drawStart.x, drawCurrent.x),
    y: Math.min(drawStart.y, drawCurrent.y),
    w: Math.abs(drawCurrent.x - drawStart.x),
    h: Math.abs(drawCurrent.y - drawStart.y),
  } : null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 800,
      background: BG,
      display: 'flex', flexDirection: 'column',
      fontFamily: NU,
    }}>

      {/* ── Top bar ── */}
      <div style={{
        height: 52, flexShrink: 0,
        borderBottom: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center',
        padding: '0 20px', gap: 16,
        background: SURF,
      }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0, flexShrink: 0 }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: GD, fontSize: 16, fontStyle: 'italic', color: '#fff' }}>
            Edit Hotspots & Credits
          </div>
          <div style={{ fontFamily: NU, fontSize: 10, color: MUTED }}>
            Page {page.page_number}
          </div>
        </div>

        {saveMsg && (
          <span style={{ fontFamily: NU, fontSize: 10, color: saveMsg === 'Saved ✓' ? '#34d399' : '#f87171' }}>
            {saveMsg}
          </span>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', background: saving ? 'rgba(201,168,76,0.5)' : GOLD,
            border: 'none', color: '#0A0908', padding: '7px 18px', borderRadius: 2,
            cursor: saving ? 'default' : 'pointer',
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Left 60%: image + hotspot canvas ── */}
        <div style={{ flex: '0 0 60%', display: 'flex', flexDirection: 'column', background: '#080706', overflow: 'hidden', position: 'relative' }}>

          {/* Hint */}
          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${BORDER}`, fontFamily: NU, fontSize: 10, color: MUTED, flexShrink: 0 }}>
            Draw a rectangle on the page to add a hotspot
          </div>

          {/* Image + drawing surface */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflow: 'hidden' }}>
            <div
              ref={imgContainerRef}
              style={{
                position: 'relative',
                maxHeight: '100%',
                maxWidth: '100%',
                lineHeight: 0,
                userSelect: 'none',
              }}
            >
              {page.image_url ? (
                <img
                  src={page.image_url}
                  alt={`Page ${page.page_number}`}
                  draggable={false}
                  style={{ maxHeight: 'calc(100vh - 160px)', maxWidth: '100%', display: 'block', objectFit: 'contain', pointerEvents: 'none' }}
                />
              ) : (
                <div style={{ width: 400, height: 560, background: '#1A1612', display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, fontFamily: NU, fontSize: 12 }}>
                  No image
                </div>
              )}

              {/* Overlay surface */}
              <div
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                style={{
                  position: 'absolute', inset: 0,
                  cursor: 'crosshair',
                }}
              >
                {/* Existing hotspots */}
                {hotspots.map(hs => {
                  const isSelected = editingHotspot === hs.id;
                  return (
                    <div
                      key={hs.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingHotspot(hs.id);
                        setActiveTab('hotspots');
                      }}
                      style={{
                        position: 'absolute',
                        left:   hs.x + '%',
                        top:    hs.y + '%',
                        width:  hs.w + '%',
                        height: hs.h + '%',
                        border:  `2px solid ${isSelected ? GOLD : 'rgba(201,168,76,0.6)'}`,
                        background: isSelected ? 'rgba(201,168,76,0.15)' : 'rgba(201,168,76,0.08)',
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                        padding: 3,
                        transition: 'border-color 0.15s, background 0.15s',
                      }}
                    >
                      {hs.label && (
                        <span style={{
                          fontFamily: NU, fontSize: 8, fontWeight: 700,
                          letterSpacing: '0.06em', textTransform: 'uppercase',
                          color: GOLD, background: 'rgba(0,0,0,0.75)',
                          padding: '2px 5px', borderRadius: 1,
                          maxWidth: '80%', overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          pointerEvents: 'none',
                        }}>
                          {hs.label}
                        </span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteHotspot(hs.id); }}
                        style={{
                          background: 'rgba(0,0,0,0.75)', border: 'none',
                          color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                          fontSize: 10, lineHeight: 1, padding: '2px 4px',
                          borderRadius: 1, marginLeft: 'auto',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}

                {/* Drawing preview */}
                {drawRect && (
                  <div style={{
                    position: 'absolute',
                    left:   drawRect.x + '%',
                    top:    drawRect.y + '%',
                    width:  drawRect.w + '%',
                    height: drawRect.h + '%',
                    border:  `2px dashed ${GOLD}`,
                    background: 'rgba(201,168,76,0.1)',
                    boxSizing: 'border-box',
                    pointerEvents: 'none',
                  }} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right 40%: tabs + panel ── */}
        <div style={{ flex: '0 0 40%', background: SIDE, borderLeft: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
            {[
              { key: 'hotspots', label: `Hotspots (${hotspots.length})` },
              { key: 'credits',  label: `Credits (${credits.length})`   },
              { key: 'video',    label: 'Video'                          },
            ].map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                flex: 1, padding: '12px 0',
                fontFamily: NU, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'capitalize',
                border: 'none', cursor: 'pointer',
                background: activeTab === t.key ? 'rgba(201,168,76,0.08)' : 'none',
                borderBottom: `2px solid ${activeTab === t.key ? GOLD : 'transparent'}`,
                color: activeTab === t.key ? GOLD : MUTED,
                transition: 'all 0.15s',
              }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

            {/* ── Hotspots tab ── */}
            {activeTab === 'hotspots' && (
              <div>
                {hotspots.length === 0 && (
                  <div style={{ fontFamily: NU, fontSize: 12, color: MUTED, textAlign: 'center', padding: '32px 16px', lineHeight: 1.6 }}>
                    Draw a region on the page to add a hotspot.
                  </div>
                )}
                {hotspots.map(hs => {
                  const isEditing = editingHotspot === hs.id;
                  return (
                    <div key={hs.id} style={{ marginBottom: 8 }}>
                      <div
                        onClick={() => setEditingHotspot(isEditing ? null : hs.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 10px',
                          background: isEditing ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isEditing ? 'rgba(201,168,76,0.3)' : BORDER}`,
                          borderRadius: 3, cursor: 'pointer',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: NU, fontSize: 11, color: hs.label ? '#fff' : MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {hs.label || '(unlabelled)'}
                          </div>
                          <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: NU, fontSize: 9, color: GOLD, background: 'rgba(201,168,76,0.1)', padding: '1px 6px', borderRadius: 2 }}>{hs.type}</span>
                            {hs.url && <span style={{ fontFamily: NU, fontSize: 9, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{hs.url}</span>}
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteHotspot(hs.id); }}
                          style={{ background: 'none', border: 'none', color: 'rgba(248,113,113,0.6)', cursor: 'pointer', fontSize: 12, padding: '2px 4px', flexShrink: 0 }}
                        >
                          ✕
                        </button>
                      </div>
                      {isEditing && (
                        <HotspotForm
                          hotspot={hs}
                          onUpdate={updateHotspot}
                          onCancel={() => setEditingHotspot(null)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Credits tab ── */}
            {activeTab === 'credits' && (
              <div>
                {credits.length === 0 && !addingCredit && (
                  <div style={{ fontFamily: NU, fontSize: 12, color: MUTED, textAlign: 'center', padding: '24px 16px', lineHeight: 1.6 }}>
                    No credits yet.
                  </div>
                )}
                {credits.map(c => {
                  const isEditing = editingCredit === c.id;
                  return (
                    <div key={c.id} style={{ marginBottom: 8 }}>
                      <div
                        onClick={() => setEditingCredit(isEditing ? null : c.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 10px',
                          background: isEditing ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isEditing ? 'rgba(201,168,76,0.3)' : BORDER}`,
                          borderRadius: 3, cursor: 'pointer',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: NU, fontSize: 11, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.vendorName || '(unnamed)'}
                          </div>
                          <div style={{ fontFamily: NU, fontSize: 9, color: GOLD, marginTop: 2 }}>{c.role}</div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteCredit(c.id); }}
                          style={{ background: 'none', border: 'none', color: 'rgba(248,113,113,0.6)', cursor: 'pointer', fontSize: 12, padding: '2px 4px', flexShrink: 0 }}
                        >
                          ✕
                        </button>
                      </div>
                      {isEditing && (
                        <CreditForm
                          credit={c}
                          onSave={updateCredit}
                          onCancel={() => setEditingCredit(null)}
                        />
                      )}
                    </div>
                  );
                })}

                {addingCredit ? (
                  <CreditForm
                    credit={{ id: '', role: '', vendorName: '', category: 'other', profileSlug: '', website: '' }}
                    onSave={addCredit}
                    onCancel={() => setAddingCredit(false)}
                  />
                ) : (
                  <button
                    onClick={() => setAddingCredit(true)}
                    style={{
                      width: '100%', marginTop: credits.length > 0 ? 8 : 0,
                      fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                      textTransform: 'uppercase', background: 'none',
                      border: `1px dashed rgba(255,255,255,0.15)`,
                      color: MUTED, padding: '10px', borderRadius: 3, cursor: 'pointer',
                      transition: 'border-color 0.15s, color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.35)'; e.currentTarget.style.color = GOLD; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = MUTED; }}
                  >
                    + Add Credit
                  </button>
                )}
              </div>
            )}

            {/* ── Video tab ── */}
            {activeTab === 'video' && (
              <div>
                <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, marginBottom: 16, lineHeight: 1.6 }}>
                  Add a video to this page. Readers see a "Watch Video" button overlaid on the page.
                </div>

                <FormField label="Video URL (YouTube, Vimeo, or MP4)">
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    spellCheck={false}
                    style={INPUT_STYLE}
                  />
                </FormField>

                {/* Auto-play toggle */}
                <FormField label="Auto-play">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <div
                      onClick={() => {
                        const next = !videoAutoplay;
                        setVideoAutoplay(next);
                        if (next) setVideoMuted(true); // autoplay requires muted
                      }}
                      style={{
                        width: 36, height: 20, borderRadius: 10,
                        background: videoAutoplay ? GOLD : 'rgba(255,255,255,0.15)',
                        position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0,
                      }}
                    >
                      <div style={{ position: 'absolute', top: 3, left: videoAutoplay ? 19 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                    </div>
                    <span style={{ fontFamily: NU, fontSize: 11, color: MUTED }}>Auto-play when page is reached</span>
                  </label>
                </FormField>

                {/* Muted toggle */}
                <FormField label="Muted">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: videoAutoplay ? 'default' : 'pointer', opacity: videoAutoplay ? 0.5 : 1 }}>
                    <div
                      onClick={() => { if (!videoAutoplay) setVideoMuted(v => !v); }}
                      style={{
                        width: 36, height: 20, borderRadius: 10,
                        background: videoMuted ? GOLD : 'rgba(255,255,255,0.15)',
                        position: 'relative', transition: 'background 0.2s', cursor: videoAutoplay ? 'default' : 'pointer', flexShrink: 0,
                      }}
                    >
                      <div style={{ position: 'absolute', top: 3, left: videoMuted ? 19 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                    </div>
                    <span style={{ fontFamily: NU, fontSize: 11, color: MUTED }}>
                      {videoAutoplay ? 'Muted (required for auto-play)' : 'Muted by default'}
                    </span>
                  </label>
                </FormField>

                {/* Preview */}
                {previewEmbed && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED, marginBottom: 8 }}>Preview</div>
                    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 3, border: `1px solid ${BORDER}` }}>
                      <iframe
                        src={previewEmbed}
                        title="Video preview"
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                        allow="fullscreen"
                      />
                    </div>
                  </div>
                )}

                {/* Save */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                  <button
                    onClick={handleSaveVideo}
                    disabled={videoSaving}
                    style={{
                      fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                      textTransform: 'uppercase', background: videoSaving ? 'rgba(201,168,76,0.5)' : GOLD,
                      border: 'none', color: '#0A0908', padding: '7px 18px', borderRadius: 2,
                      cursor: videoSaving ? 'default' : 'pointer',
                    }}
                  >
                    {videoSaving ? 'Saving…' : 'Save Video'}
                  </button>
                  {videoSaveMsg && (
                    <span style={{ fontFamily: NU, fontSize: 10, color: videoSaveMsg.includes('✓') ? '#34d399' : '#f87171' }}>
                      {videoSaveMsg}
                    </span>
                  )}
                  {videoUrl && (
                    <button
                      onClick={() => { setVideoUrl(''); }}
                      style={{
                        fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                        textTransform: 'uppercase', background: 'none',
                        border: `1px solid rgba(248,113,113,0.3)`, color: 'rgba(248,113,113,0.7)',
                        padding: '7px 14px', borderRadius: 2, cursor: 'pointer',
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
