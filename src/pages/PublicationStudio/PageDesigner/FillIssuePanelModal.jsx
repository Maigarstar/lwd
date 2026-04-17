// ─── FillIssuePanelModal.jsx ──────────────────────────────────────────────────
// P9a + P9b: Fill Issue Panel + AI Image Suggestions
//
// Full-screen modal showing every image slot across all pages.
// Left: scrollable slot grid (grouped by page, with page thumbnail + highlight).
// Right: when a slot is selected — P9b AI suggestions (Unsplash, keyed to
//        surrounding text context on that page) + Browse Library button.
//
// Props:
//   pages          — full pages array from PageDesigner state
//   dims           — { w, h } page dimensions
//   issue          — issue object (for ImagePickerModal context)
//   onAssign(pageIndex, slotId, url) — parent handles canvas mutation
//   onOpenPicker(pageIndex, slotId) — opens the full ImagePickerModal
//   onClose        — closes the panel
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo } from 'react';
import { GOLD, BORDER, MUTED, NU, GD } from './designerConstants';

const BG   = '#0E0C0A';
const BG2  = '#18160F';
const BDR  = 'rgba(255,255,255,0.09)';
const UNSPLASH_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY || null;

// Editorial fallback images (same set as PageDesigner uses for templates)
const EDITORIAL_FALLBACKS = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=600&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&q=80&auto=format&fit=crop',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPageLabel(i, total) {
  if (i === 0) return 'Cover';
  if (i === total - 1 && total % 2 === 0) return 'Back';
  return `Page ${i + 1}`;
}

// Parse a pages array → flat list of slot descriptors
function parsePlaceholders(pages) {
  const slots = [];
  pages.forEach((page, pi) => {
    if (!page.canvasJSON?.objects) return;
    let slotIdx = 0;
    for (const obj of page.canvasJSON.objects) {
      if (!obj.isImagePlaceholder) continue;
      const w = (obj.width  ?? 100) * (obj.scaleX ?? 1);
      const h = (obj.height ?? 100) * (obj.scaleY ?? 1);
      const isFilled = obj.type === 'image' && obj.src;
      slots.push({
        pageIndex:  pi,
        pageLabel:  getPageLabel(pi, pages.length),
        pageThumb:  page.thumbnailDataUrl || null,
        slotIndex:  slotIdx++,
        id:         obj.id,
        objType:    obj.type,
        left:       obj.left  ?? 0,
        top:        obj.top   ?? 0,
        width:      w,
        height:     h,
        currentUrl: isFilled ? obj.src : null,
        isFilled:   !!isFilled,
        // pending url (set when user picks but hasn't applied yet)
        pendingUrl: null,
      });
    }
  });
  return slots;
}

// Extract text keywords from a page's canvasJSON for AI suggestion query
function buildSearchQuery(canvasJSON) {
  if (!canvasJSON?.objects) return 'luxury wedding';
  const stopWords = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','is','are','was','with','this','that','from','by','our','your','their','we','you','its']);
  const raw = canvasJSON.objects
    .filter(o => ['textbox', 'i-text'].includes(o.type) && typeof o.text === 'string')
    .map(o => o.text)
    .join(' ')
    .replace(/[^\w\s]/g, ' ');
  const words = raw.toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w))
    .slice(0, 3);
  return ['luxury wedding', ...words].join(' ');
}

async function fetchSuggestions(query) {
  try {
    if (UNSPLASH_KEY) {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=6&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } }
      );
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      return (data.results || []).map(p => p.urls.regular);
    }
    // No key → use editorial fallbacks
    return EDITORIAL_FALLBACKS;
  } catch {
    return EDITORIAL_FALLBACKS;
  }
}

// ── Slot card ─────────────────────────────────────────────────────────────────
function SlotCard({ slot, canvasW, canvasH, selected, pending, onSelect, onPick }) {
  const [hov, setHov] = useState(false);

  // Scale factor from canvas coords → thumbnail display coords
  const THUMB_W = 72;
  const THUMB_H = Math.round(THUMB_W * (canvasH / canvasW));
  const scale   = THUMB_W / canvasW;

  // Clamp highlight box to thumbnail bounds
  const hlLeft   = Math.max(0, Math.round(slot.left  * scale));
  const hlTop    = Math.max(0, Math.round(slot.top   * scale));
  const hlWidth  = Math.min(THUMB_W  - hlLeft, Math.max(4, Math.round(slot.width  * scale)));
  const hlHeight = Math.min(THUMB_H  - hlTop,  Math.max(4, Math.round(slot.height * scale)));

  const fillUrl = pending || slot.currentUrl;
  const isEmpty = !fillUrl;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onSelect(slot)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 12px',
        borderRadius: 4,
        cursor: 'pointer',
        background: selected
          ? 'rgba(201,169,110,0.1)'
          : hov
          ? 'rgba(255,255,255,0.04)'
          : 'transparent',
        border: `1px solid ${selected ? 'rgba(201,169,110,0.4)' : 'transparent'}`,
        transition: 'all 0.12s',
        position: 'relative',
      }}
    >
      {/* Page thumbnail with slot highlight */}
      <div style={{
        position: 'relative',
        width: THUMB_W,
        height: THUMB_H,
        flexShrink: 0,
        borderRadius: 2,
        overflow: 'hidden',
        background: '#2A2520',
        border: `1px solid ${BDR}`,
      }}>
        {slot.pageThumb && (
          <img
            src={slot.pageThumb}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}
        {/* Slot highlight overlay */}
        <div style={{
          position: 'absolute',
          left: hlLeft,
          top: hlTop,
          width: hlWidth,
          height: hlHeight,
          border: `1.5px solid ${isEmpty ? 'rgba(201,169,110,0.9)' : 'rgba(52,211,153,0.9)'}`,
          borderRadius: 1,
          boxShadow: isEmpty
            ? '0 0 6px rgba(201,169,110,0.6)'
            : '0 0 6px rgba(52,211,153,0.5)',
          pointerEvents: 'none',
        }} />
        {/* Filled image preview in thumbnail zone */}
        {fillUrl && (
          <div style={{
            position: 'absolute',
            left: hlLeft,
            top: hlTop,
            width: hlWidth,
            height: hlHeight,
            overflow: 'hidden',
            borderRadius: 1,
          }}>
            <img
              src={fillUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        )}
      </div>

      {/* Slot info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: GOLD, marginBottom: 3,
        }}>
          {slot.pageLabel}
        </div>
        <div style={{
          fontFamily: NU, fontSize: 10,
          color: isEmpty ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.8)',
        }}>
          {isEmpty ? 'Empty slot' : pending ? '✓ Pending' : '✓ Filled'}
        </div>
        <div style={{
          fontFamily: NU, fontSize: 9,
          color: 'rgba(255,255,255,0.3)',
          marginTop: 2,
        }}>
          {Math.round(slot.width)} × {Math.round(slot.height)} px
        </div>
      </div>

      {/* Status dot */}
      <div style={{
        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
        background: pending ? GOLD : isEmpty ? 'rgba(255,255,255,0.2)' : '#34d399',
        boxShadow: pending ? `0 0 6px ${GOLD}` : isEmpty ? 'none' : '0 0 6px rgba(52,211,153,0.6)',
      }} />
    </div>
  );
}

// ── Suggestion grid ───────────────────────────────────────────────────────────
function SuggestionGrid({ urls, onPick, loading }) {
  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
        {[0,1,2,3,4,5].map(i => (
          <div key={i} style={{
            height: 80, borderRadius: 3,
            background: 'rgba(255,255,255,0.06)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
        ))}
      </div>
    );
  }
  if (!urls.length) return (
    <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, marginTop: 12, textAlign: 'center' }}>
      No suggestions available
    </div>
  );
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
      {urls.map((url, i) => (
        <button
          key={i}
          onClick={() => onPick(url)}
          style={{
            height: 80,
            borderRadius: 3,
            overflow: 'hidden',
            border: '2px solid transparent',
            padding: 0,
            cursor: 'pointer',
            transition: 'border-color 0.12s, transform 0.1s',
            background: '#2A2520',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.transform = 'scale(1.03)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
          title="Use this image"
        >
          <img
            src={url}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            loading="lazy"
          />
        </button>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function FillIssuePanelModal({
  pages,
  dims,
  issue,
  onAssign,
  onOpenPicker,
  onClose,
}) {
  const [filter,       setFilter]       = useState('empty'); // 'all' | 'empty' | 'filled'
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [pending,      setPending]      = useState({}); // { 'pageIdx:slotId': url }
  const [suggestions,  setSuggestions]  = useState([]);
  const [sugLoading,   setSugLoading]   = useState(false);

  // Parse all placeholders from pages
  const allSlots = useMemo(() => parsePlaceholders(pages), [pages]);

  const filtered = useMemo(() => {
    if (filter === 'empty')  return allSlots.filter(s => !s.currentUrl && !pending[`${s.pageIndex}:${s.id}`]);
    if (filter === 'filled') return allSlots.filter(s => s.currentUrl || pending[`${s.pageIndex}:${s.id}`]);
    return allSlots;
  }, [allSlots, filter, pending]);

  // Stats
  const totalCount  = allSlots.length;
  const filledCount = allSlots.filter(s => s.currentUrl || pending[`${s.pageIndex}:${s.id}`]).length;
  const emptyCount  = totalCount - filledCount;

  // When selected slot changes, fetch AI suggestions
  useEffect(() => {
    if (!selectedSlot) { setSuggestions([]); return; }
    const page = pages[selectedSlot.pageIndex];
    if (!page) return;
    const query = buildSearchQuery(page.canvasJSON);
    setSugLoading(true);
    setSuggestions([]);
    fetchSuggestions(query).then(urls => {
      setSuggestions(urls);
      setSugLoading(false);
    });
  }, [selectedSlot, pages]);

  // Handle picking an image for the selected slot
  const handlePick = useCallback((url) => {
    if (!selectedSlot) return;
    const key = `${selectedSlot.pageIndex}:${selectedSlot.id}`;
    setPending(prev => ({ ...prev, [key]: url }));
    // Immediately notify parent to patch the canvas
    onAssign(selectedSlot.pageIndex, selectedSlot.id, url);
  }, [selectedSlot, onAssign]);

  // Apply all pending assignments
  const handleApplyAll = useCallback(() => {
    // All pending assignments have already been dispatched via onAssign
    // Just close the panel
    onClose();
  }, [onClose]);

  const pendingCount = Object.keys(pending).length;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 600,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex',
      alignItems: 'stretch',
      justifyContent: 'center',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 1100,
        margin: 'auto',
        background: BG,
        display: 'flex',
        flexDirection: 'column',
        height: '92vh',
        borderRadius: 6,
        overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        border: `1px solid ${BDR}`,
      }}>
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: `1px solid ${BDR}`,
          flexShrink: 0,
        }}>
          <div>
            <div style={{
              fontFamily: NU, fontSize: 11, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD,
              marginBottom: 4,
            }}>
              ⬡ Fill Image Slots
            </div>
            <div style={{ fontFamily: NU, fontSize: 10, color: MUTED }}>
              {totalCount} slots total ·{' '}
              <span style={{ color: '#34d399' }}>{filledCount} filled</span>
              {' · '}
              <span style={{ color: emptyCount > 0 ? GOLD : MUTED }}>{emptyCount} empty</span>
            </div>
          </div>

          {/* Filter pills */}
          <div style={{ display: 'flex', gap: 4 }}>
            {[['all','All'], ['empty','Empty'], ['filled','Filled']].map(([k, label]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                style={{
                  fontFamily: NU, fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  padding: '5px 10px', borderRadius: 3,
                  cursor: 'pointer', border: 'none',
                  background: filter === k ? 'rgba(201,169,110,0.15)' : 'rgba(255,255,255,0.05)',
                  color: filter === k ? GOLD : MUTED,
                  transition: 'all 0.12s',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: MUTED,
              cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '2px 4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

          {/* LEFT: Slot list */}
          <div style={{
            width: 340,
            flexShrink: 0,
            borderRight: `1px solid ${BDR}`,
            overflowY: 'auto',
            padding: '12px 8px',
          }}>
            {filtered.length === 0 && (
              <div style={{
                padding: '40px 16px', textAlign: 'center',
                fontFamily: NU, fontSize: 10, color: MUTED,
              }}>
                {filter === 'empty' ? 'All slots are filled ✓' : 'No slots found'}
              </div>
            )}

            {/* Group by page */}
            {(() => {
              const byPage = {};
              filtered.forEach(s => {
                if (!byPage[s.pageIndex]) byPage[s.pageIndex] = [];
                byPage[s.pageIndex].push(s);
              });
              return Object.entries(byPage).map(([piStr, slots]) => (
                <div key={piStr} style={{ marginBottom: 16 }}>
                  <div style={{
                    fontFamily: NU, fontSize: 8, fontWeight: 700,
                    letterSpacing: '0.15em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.25)',
                    padding: '4px 12px 8px',
                  }}>
                    {slots[0].pageLabel}
                  </div>
                  {slots.map(slot => (
                    <SlotCard
                      key={slot.id}
                      slot={slot}
                      canvasW={dims.w}
                      canvasH={dims.h}
                      selected={selectedSlot?.id === slot.id}
                      pending={pending[`${slot.pageIndex}:${slot.id}`] || null}
                      onSelect={setSelectedSlot}
                      onPick={handlePick}
                    />
                  ))}
                </div>
              ));
            })()}
          </div>

          {/* RIGHT: AI Suggestions + Controls */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {!selectedSlot ? (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 12,
                padding: 32,
              }}>
                <div style={{
                  fontFamily: GD, fontSize: 28, fontStyle: 'italic',
                  color: 'rgba(255,255,255,0.12)',
                }}>
                  Select a slot
                </div>
                <div style={{ fontFamily: NU, fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
                  Click any slot on the left to see AI image suggestions
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

                {/* Slot context header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
                  paddingBottom: 16, borderBottom: `1px solid ${BDR}`,
                }}>
                  {/* Mini page thumbnail */}
                  {selectedSlot.pageThumb && (
                    <img
                      src={selectedSlot.pageThumb}
                      alt=""
                      style={{ width: 52, height: 74, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }}
                    />
                  )}
                  <div>
                    <div style={{
                      fontFamily: NU, fontSize: 9, fontWeight: 700,
                      letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: GOLD, marginBottom: 4,
                    }}>
                      {selectedSlot.pageLabel} · Slot {selectedSlot.slotIndex + 1}
                    </div>
                    <div style={{ fontFamily: NU, fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>
                      {Math.round(selectedSlot.width)} × {Math.round(selectedSlot.height)} px
                      {selectedSlot.isFilled ? ' · Currently filled' : ' · Empty'}
                    </div>
                    {pending[`${selectedSlot.pageIndex}:${selectedSlot.id}`] && (
                      <div style={{ fontFamily: NU, fontSize: 9, color: GOLD, marginTop: 4 }}>
                        ✓ Image assigned — pending save
                      </div>
                    )}
                  </div>
                </div>

                {/* Current / Pending preview */}
                {(pending[`${selectedSlot.pageIndex}:${selectedSlot.id}`] || selectedSlot.currentUrl) && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{
                      fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                      textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 8,
                    }}>
                      Current
                    </div>
                    <div style={{
                      height: 130, borderRadius: 3, overflow: 'hidden',
                      background: '#2A2520',
                    }}>
                      <img
                        src={pending[`${selectedSlot.pageIndex}:${selectedSlot.id}`] || selectedSlot.currentUrl}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                  </div>
                )}

                {/* AI Suggestions — P9b */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4,
                  }}>
                    <span style={{
                      fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
                      textTransform: 'uppercase', color: GOLD,
                    }}>
                      ✦ AI Suggestions
                    </span>
                    <span style={{ fontFamily: NU, fontSize: 9, color: MUTED }}>
                      · based on page content
                    </span>
                  </div>
                  <SuggestionGrid
                    urls={suggestions}
                    loading={sugLoading}
                    onPick={handlePick}
                  />
                </div>

                {/* Browse Media Library */}
                <div style={{
                  borderTop: `1px solid ${BDR}`, paddingTop: 16,
                }}>
                  <div style={{
                    fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 10,
                  }}>
                    Or Browse
                  </div>
                  <button
                    onClick={() => onOpenPicker(selectedSlot.pageIndex, selectedSlot.id)}
                    style={{
                      width: '100%', padding: '10px 16px',
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${BDR}`,
                      borderRadius: 3, cursor: 'pointer',
                      fontFamily: NU, fontSize: 10, fontWeight: 600,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.7)',
                      transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                    }}
                  >
                    ⬡ Browse Media Library
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px',
          borderTop: `1px solid ${BDR}`,
          flexShrink: 0,
          background: BG2,
        }}>
          <div style={{ fontFamily: NU, fontSize: 10, color: MUTED }}>
            {pendingCount > 0
              ? `${pendingCount} image${pendingCount > 1 ? 's' : ''} assigned`
              : 'No changes yet'
            }
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                padding: '7px 18px', borderRadius: 3,
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${BDR}`,
                color: MUTED, cursor: 'pointer',
                fontFamily: NU, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleApplyAll}
              style={{
                padding: '7px 20px', borderRadius: 3,
                background: pendingCount > 0 ? 'rgba(201,169,110,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${pendingCount > 0 ? 'rgba(201,169,110,0.45)' : BDR}`,
                color: pendingCount > 0 ? GOLD : MUTED,
                cursor: 'pointer',
                fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                transition: 'all 0.12s',
              }}
            >
              {pendingCount > 0 ? `Done — ${pendingCount} assigned ✓` : 'Done'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
