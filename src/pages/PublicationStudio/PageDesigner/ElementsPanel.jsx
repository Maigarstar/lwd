import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { GOLD, DARK, CARD, BORDER, MUTED, GD, NU, PAGE_SIZES } from './designerConstants';
import { TEMPLATES } from '../templates/definitions';
import { callAiGenerate } from '../../../lib/aiGenerate';
import { listAllAssets, uploadAsset } from '../../../services/publicationMediaService';

// Premium templates get a visual elevation even without hover
const PREMIUM_IDS = new Set(['vogue-cover', 'feature-spread']);

// Map raw template categories to editorial section groups
const SECTION_GROUPS = [
  {
    label: 'Cover & Navigation',
    categories: new Set(['Cover', 'Back Cover', 'About Page', 'Navigation']),
  },
  {
    label: 'Editorial',
    categories: new Set(['Editorial', 'Real Wedding', 'Couple', 'Detail']),
  },
  {
    label: 'Fashion & Style',
    categories: new Set(['Fashion', 'Bridal', 'Jewellery', 'Beauty', 'Stationery', 'Food & Cake']),
  },
  {
    label: 'Venue & Travel',
    categories: new Set(['Venue', 'Venue Portrait', 'Travel', 'Florals', 'Reception', 'Ceremony']),
  },
  {
    label: 'Commercial',
    categories: new Set(['Full-Page Advertisement', 'Product Showcase Ad', 'Venue Advertisement']),
  },
];

// Category filter pill labels (maps to SECTION_GROUPS)
const CAT_PILLS = [
  'All',
  'Cover & Navigation',
  'Editorial',
  'Fashion & Style',
  'Venue & Travel',
  'Commercial',
];

// Build section → template list mapping
function buildSectionedTemplates(templates) {
  const groups = SECTION_GROUPS.map(s => ({ ...s, templates: [] }));
  const uncategorised = [];
  for (const t of templates) {
    const group = groups.find(g => g.categories.has(t.category));
    if (group) group.templates.push(t);
    else uncategorised.push(t);
  }
  return { groups, uncategorised };
}

const SECTION_STYLE = {
  fontFamily: NU,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: GOLD,
  padding: '14px 16px 6px',
};

const ELEM_BTN = {
  width: '100%',
  background: 'none',
  border: 'none',
  borderBottom: `1px solid rgba(255,255,255,0.04)`,
  color: '#fff',
  cursor: 'pointer',
  padding: '9px 16px',
  textAlign: 'left',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  transition: 'background 0.1s',
};

function ElemButton({ label, preview, onClick, hoverBg = 'rgba(201,169,110,0.07)' }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      style={{ ...ELEM_BTN, background: hov ? hoverBg : 'none' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
    >
      {preview && <span style={{ flexShrink: 0, width: 32, textAlign: 'center' }}>{preview}</span>}
      <span style={{ fontFamily: NU, fontSize: 12, color: hov ? '#fff' : 'rgba(255,255,255,0.75)' }}>{label}</span>
    </button>
  );
}

function Divider() {
  return <div style={{ borderTop: `1px solid rgba(255,255,255,0.06)`, margin: '4px 0' }} />;
}

// ── Layers panel components ───────────────────────────────────────────────────

function LayerRow({ layer, typeIcon, isDragging, onDragStart, onDragEnd, onDragOver, onSelect, onToggleVisibility, onToggleLock }) {
  const [hov, setHov] = useState(false);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onClick={onSelect}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 8px 7px 10px',
        borderBottom: `1px solid rgba(255,255,255,0.04)`,
        background: layer.selected
          ? 'rgba(201,169,110,0.12)'
          : hov ? 'rgba(255,255,255,0.04)' : 'transparent',
        borderLeft: `2px solid ${layer.selected ? GOLD : 'transparent'}`,
        cursor: 'pointer',
        opacity: isDragging ? 0.4 : 1,
        transition: 'background 0.1s, opacity 0.1s',
        userSelect: 'none',
      }}
    >
      {/* Drag handle */}
      <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, flexShrink: 0, cursor: 'grab' }}>⠿</span>

      {/* Type icon */}
      <span style={{
        fontFamily: layer.type === 'textbox' || layer.type === 'text' ? "'Cormorant Garamond',serif" : NU,
        fontSize: 11,
        color: layer.selected ? GOLD : 'rgba(255,255,255,0.5)',
        flexShrink: 0,
        width: 16,
        textAlign: 'center',
      }}>
        {typeIcon}
      </span>

      {/* Label */}
      <span style={{
        flex: 1,
        fontFamily: NU,
        fontSize: 11,
        color: layer.visible
          ? (layer.selected ? '#fff' : 'rgba(255,255,255,0.7)')
          : 'rgba(255,255,255,0.25)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontStyle: layer.type === 'textbox' ? 'italic' : 'normal',
      }}>
        {layer.label}
      </span>

      {/* Visibility toggle */}
      <button
        onClick={onToggleVisibility}
        title={layer.visible ? 'Hide layer' : 'Show layer'}
        style={{
          background: 'none', border: 'none',
          color: layer.visible ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)',
          cursor: 'pointer', padding: '0 2px', fontSize: 12, lineHeight: 1,
          flexShrink: 0,
          opacity: hov || layer.selected ? 1 : 0,
          transition: 'opacity 0.12s',
        }}
      >
        {layer.visible ? '👁' : '🚫'}
      </button>

      {/* Lock toggle */}
      <button
        onClick={onToggleLock}
        title={layer.locked ? 'Unlock layer' : 'Lock layer'}
        style={{
          background: 'none', border: 'none',
          color: layer.locked ? GOLD : 'rgba(255,255,255,0.4)',
          cursor: 'pointer', padding: '0 2px', fontSize: 11, lineHeight: 1,
          flexShrink: 0,
          opacity: hov || layer.locked || layer.selected ? 1 : 0,
          transition: 'opacity 0.12s',
        }}
      >
        {layer.locked ? '🔒' : '🔓'}
      </button>
    </div>
  );
}

function LayersPanel({ layers, onSelectLayer, onToggleLayerVisibility, onToggleLayerLock, onReorderLayer }) {
  const [dragId, setDragId] = useState(null);

  if (!layers || layers.length === 0) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px 16px', gap: 8,
      }}>
        <div style={{ fontSize: 24, opacity: 0.2 }}>⊟</div>
        <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, textAlign: 'center', lineHeight: 1.5 }}>
          No layers yet.<br />Add elements to the canvas.
        </div>
      </div>
    );
  }

  const typeIcon = (type, customType) => {
    if (customType === 'pagenumber') return '№';
    if (type === 'textbox' || type === 'text' || type === 'itext') return 'T';
    if (type === 'image') return '⬜';
    if (type === 'rect') return '▭';
    if (type === 'circle') return '○';
    if (type === 'line') return '—';
    return '◻';
  };

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
      {layers.map((layer) => (
        <LayerRow
          key={layer.id}
          layer={layer}
          typeIcon={typeIcon(layer.type, layer.customType)}
          isDragging={dragId === layer.id}
          onDragStart={() => setDragId(layer.id)}
          onDragEnd={() => setDragId(null)}
          onDragOver={(e) => {
            e.preventDefault();
            if (dragId && dragId !== layer.id) {
              onReorderLayer?.(dragId, layer.id);
            }
          }}
          onSelect={() => onSelectLayer?.(layer.id)}
          onToggleVisibility={(e) => { e.stopPropagation(); onToggleLayerVisibility?.(layer.id); }}
          onToggleLock={(e) => { e.stopPropagation(); onToggleLayerLock?.(layer.id); }}
        />
      ))}
    </div>
  );
}

// ── Template row with thumbnail + hover preview card ─────────────────────────
// Each template shows a 32×44 thumbnail in the panel list. On hover, a
// 320×452 preview card floats to the right of the panel so the user can see
// the full template at roughly real proportions before clicking.
//
// Thumbnail source: /publication-studio/templates/{id}.jpg — generated by
// scripts/generate-template-thumbnails.mjs. If the image fails to load we
// fall back to the old numbered-box appearance so the panel stays readable
// until thumbnails are built.
function TemplateRow({ template, globalIndex, onInsert, onReplace, isActive }) {
  const [hov, setHov] = useState(false);
  const [anchor, setAnchor] = useState(null);
  const [thumbOk, setThumbOk] = useState(true);
  const rowRef = useRef(null);
  const isPremium = PREMIUM_IDS.has(template.id);

  function handleEnter() {
    setHov(true);
    const rect = rowRef.current?.getBoundingClientRect?.();
    if (rect) setAnchor({ top: rect.top, left: rect.right + 12 });
  }
  function handleLeave() {
    setHov(false);
  }

  const thumbSrc = `/publication-studio/templates/${template.id}.jpg`;

  return (
    <>
      <div
        ref={rowRef}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={{
          width: '100%',
          borderBottom: `1px solid rgba(255,255,255,0.04)`,
          borderLeft: `2px solid ${isActive ? GOLD : isPremium ? 'rgba(201,169,110,0.4)' : 'transparent'}`,
          background: isActive
            ? 'rgba(201,169,110,0.10)'
            : hov
              ? 'rgba(201,169,110,0.07)'
              : isPremium ? 'rgba(201,169,110,0.025)' : 'none',
          padding: '7px 10px 7px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          transition: 'background 0.12s, border-color 0.12s',
          cursor: 'default',
          userSelect: 'none',
        }}
      >
        {/* Thumbnail */}
        {thumbOk ? (
          <img
            src={thumbSrc}
            alt=""
            onError={() => setThumbOk(false)}
            style={{
              width: 32,
              height: 44,
              objectFit: 'cover',
              border: `1px solid ${isActive ? GOLD : 'rgba(201,169,110,0.35)'}`,
              flexShrink: 0,
              background: 'rgba(201,169,110,0.08)',
              display: 'block',
              transition: 'border-color 0.12s',
            }}
          />
        ) : (
          <div style={{
            width: 32,
            height: 44,
            background: 'rgba(201,169,110,0.12)',
            border: `1px solid rgba(201,169,110,0.28)`,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: NU, fontSize: 9, color: GOLD }}>{globalIndex + 1}</span>
          </div>
        )}

        {/* Name + category */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: NU,
            fontSize: 12,
            color: isActive ? '#F0EBE0' : 'rgba(255,255,255,0.78)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}>
            {template.name}
            {isPremium && !isActive && (
              <span style={{
                fontFamily: NU,
                fontSize: 7,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: GOLD,
                background: 'rgba(201,169,110,0.12)',
                border: `1px solid rgba(201,169,110,0.3)`,
                borderRadius: 2,
                padding: '1px 4px',
                textTransform: 'uppercase',
                flexShrink: 0,
              }}>
                {template.id === 'vogue-cover' ? 'Hero' : 'Signature'}
              </span>
            )}
          </div>
          <div style={{ fontFamily: NU, fontSize: 9, color: GOLD, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 1 }}>
            {template.category}
          </div>
        </div>

        {/* Actions — visible on hover */}
        {hov && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            {/* Primary: Insert */}
            <button
              onClick={(e) => { e.stopPropagation(); onInsert && onInsert(); }}
              title="Insert as new page"
              style={{
                background: GOLD,
                border: 'none',
                borderRadius: 2,
                color: '#1a1208',
                fontFamily: NU,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '4px 8px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                lineHeight: 1.4,
              }}
            >
              + Insert
            </button>
            {/* Secondary: Replace */}
            <button
              onClick={(e) => { e.stopPropagation(); onReplace && onReplace(); }}
              title="Replace current page"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 2,
                color: 'rgba(255,255,255,0.5)',
                fontFamily: NU,
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: '0.04em',
                padding: '4px 6px',
                cursor: 'pointer',
                lineHeight: 1.4,
                flexShrink: 0,
              }}
            >
              ↺
            </button>
          </div>
        )}
      </div>

      {/* Floating preview card — position:fixed so it's never clipped by the panel overflow */}
      {hov && anchor && (
        <div
          style={{
            position: 'fixed',
            top: Math.min(anchor.top, window.innerHeight - 460),
            left: anchor.left,
            width: 320,
            height: 452,
            background: '#0F0E0B',
            border: `1px solid ${GOLD}`,
            boxShadow: '0 24px 64px rgba(0,0,0,0.85)',
            zIndex: 3000,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {thumbOk ? (
            <img
              src={thumbSrc}
              alt={template.name}
              style={{ width: '100%', height: 404, objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: 404,
              background: 'rgba(201,169,110,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: NU,
              color: GOLD,
              fontSize: 12,
              letterSpacing: '0.2em',
            }}>
              {template.name.toUpperCase()}
            </div>
          )}
          <div style={{ padding: '10px 14px', borderTop: `1px solid rgba(255,255,255,0.08)`, flex: 1 }}>
            <div style={{ fontFamily: GD, fontSize: 15, color: '#F0EBE0', fontStyle: 'italic' }}>{template.name}</div>
            <div style={{ fontFamily: NU, fontSize: 9, color: GOLD, letterSpacing: '0.15em', marginTop: 2, textTransform: 'uppercase' }}>
              {template.category}
            </div>
            <div style={{
              marginTop: 8,
              fontFamily: NU,
              fontSize: 8,
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              Hover · Insert or Replace ↑
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Grid thumbnail for 2-column template view ────────────────────────────────
function GridThumb({ template, globalIndex, onInsert, onReplace, isActive }) {
  const [hov, setHov] = useState(false);
  const [thumbOk, setThumbOk] = useState(true);
  const thumbSrc = `/publication-studio/templates/${template.id}.jpg`;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative',
        border: `1px solid ${isActive ? GOLD : hov ? 'rgba(201,169,110,0.45)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 3,
        overflow: 'hidden',
        cursor: 'default',
        background: 'rgba(201,169,110,0.04)',
        transition: 'border-color 0.12s',
      }}
    >
      {thumbOk ? (
        <img
          src={thumbSrc}
          alt={template.name}
          onError={() => setThumbOk(false)}
          style={{ width: '100%', aspectRatio: '794/1123', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{
          width: '100%', aspectRatio: '794/1123',
          background: 'rgba(201,169,110,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: NU, fontSize: 9, color: GOLD, textAlign: 'center',
          padding: 4,
        }}>
          {template.name}
        </div>
      )}
      {/* Name overlay at bottom */}
      <div style={{
        padding: '4px 6px',
        background: '#0F0E0B',
        borderTop: `1px solid rgba(255,255,255,0.06)`,
      }}>
        <div style={{ fontFamily: NU, fontSize: 9, color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {template.name}
        </div>
      </div>
      {/* Hover action overlay */}
      {hov && (
        <div style={{
          position: 'absolute', inset: 0, bottom: 26,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <button
            onClick={(e) => { e.stopPropagation(); onInsert?.(); }}
            style={{
              background: GOLD, border: 'none', borderRadius: 2,
              color: '#1a1208', fontFamily: NU, fontSize: 9, fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              padding: '5px 14px', cursor: 'pointer',
            }}
          >+ Insert</button>
          <button
            onClick={(e) => { e.stopPropagation(); onReplace?.(); }}
            style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 2, color: 'rgba(255,255,255,0.7)',
              fontFamily: NU, fontSize: 9, padding: '4px 10px', cursor: 'pointer',
            }}
          >↺ Replace</button>
        </div>
      )}
    </div>
  );
}

// ── Inline media grid (shown inside Elements > Images section) ───────────────
function InlineMediaGrid({ issue, onAddImage, onSeeAll }) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listAllAssets(issue?.id).then(data => {
      if (!cancelled) { setItems(data); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [issue?.id]);

  if (loading) {
    return (
      <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, textAlign: 'center', padding: '12px 0' }}>
        Loading media…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, textAlign: 'center', padding: '10px 16px 4px', lineHeight: 1.5 }}>
        No uploads yet. Click Upload above.
      </div>
    );
  }

  // Show latest 9 images; "See all" goes to Media tab
  const preview = items.slice(0, 9);

  return (
    <div style={{ padding: '0 10px 4px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5 }}>
        {preview.map(item => (
          <InlineThumb key={item.url} item={item} onAddImage={onAddImage} />
        ))}
      </div>
      {items.length > 9 && (
        <button
          onClick={onSeeAll}
          style={{
            marginTop: 8, width: '100%',
            background: 'none', border: `1px solid rgba(255,255,255,0.1)`,
            borderRadius: 3, color: MUTED,
            fontFamily: NU, fontSize: 9, fontWeight: 700,
            letterSpacing: '0.07em', textTransform: 'uppercase',
            padding: '6px 0', cursor: 'pointer',
          }}
        >
          + {items.length - 9} more →
        </button>
      )}
    </div>
  );
}

function InlineThumb({ item, onAddImage }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={() => onAddImage(item.url)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={item.name || item.url}
      style={{
        position: 'relative', aspectRatio: '1/1',
        background: '#0E0D0B',
        border: `1px solid ${hov ? GOLD : 'rgba(255,255,255,0.08)'}`,
        padding: 0, cursor: 'pointer', overflow: 'hidden',
        borderRadius: 2, transition: 'border-color 0.12s',
      }}
    >
      <img
        src={item.url} alt={item.name || ''}
        loading="lazy"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      {hov && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 14, color: '#fff' }}>+</span>
        </div>
      )}
    </button>
  );
}

// ── Media library tab ────────────────────────────────────────────────────────
function MediaTab({ issue, onAddImage }) {
  const [items,        setItems]        = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState('');
  const [uploading,    setUploading]    = useState(false);
  const [uploadPct,    setUploadPct]    = useState(0);
  const [uploadErr,    setUploadErr]    = useState(null);
  const [dragOver,     setDragOver]     = useState(false);
  const fileRef = useRef(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const data = await listAllAssets(issue?.id);
    setItems(data);
    setLoading(false);
  }, [issue?.id]);

  useEffect(() => { reload(); }, [reload]);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(i => (i.name || i.url || '').toLowerCase().includes(q));
  }, [items, search]);

  const thisIssue = filtered.filter(i => !i.fromOtherIssue);
  const reused    = filtered.filter(i =>  i.fromOtherIssue);

  async function handleFile(file) {
    if (!file) return;
    setUploading(true); setUploadErr(null); setUploadPct(10);
    try {
      const timer = setInterval(() => setUploadPct(p => Math.min(p + 15, 85)), 300);
      const { publicUrl, error } = await uploadAsset(issue?.id, file);
      clearInterval(timer); setUploadPct(100);
      if (error) throw new Error(error);
      await reload();
      onAddImage(publicUrl);
    } catch (e) { setUploadErr(e?.message || 'Upload failed'); }
    finally     { setUploading(false); setUploadPct(0); }
  }

  function onDrop(e) {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function MediaThumb({ url, name, fromOtherIssue }) {
    const [hov, setHov] = useState(false);
    return (
      <button
        onClick={() => onAddImage(url)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        title={name || url}
        style={{
          position: 'relative', aspectRatio: '3/4',
          background: '#0E0D0B', border: `1px solid ${hov ? GOLD : 'rgba(255,255,255,0.08)'}`,
          padding: 0, cursor: 'pointer', overflow: 'hidden',
          transition: 'border-color 0.15s', borderRadius: 2,
        }}
      >
        <img src={url} alt={name || ''} loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        {fromOtherIssue && (
          <div style={{
            position: 'absolute', top: 3, right: 3,
            fontFamily: NU, fontSize: 6, fontWeight: 700,
            background: 'rgba(0,0,0,0.7)', color: MUTED,
            padding: '2px 4px', letterSpacing: '0.05em',
          }}>REUSED</div>
        )}
        {hov && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              fontFamily: NU, fontSize: 8, fontWeight: 700,
              background: GOLD, color: '#0E0D0B',
              padding: '4px 8px', letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>+ Add</span>
          </div>
        )}
      </button>
    );
  }

  const SL = ({ children }) => (
    <div style={{ fontFamily: NU, fontSize: 8, fontWeight: 700, color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '12px 12px 5px' }}>
      {children}
    </div>
  );

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Upload zone */}
      <div style={{ padding: '10px 12px 0' }}>
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => !uploading && fileRef.current?.click()}
          style={{
            border: `1px dashed ${dragOver ? GOLD : 'rgba(255,255,255,0.14)'}`,
            background: dragOver ? 'rgba(201,169,110,0.05)' : 'rgba(255,255,255,0.02)',
            borderRadius: 3, padding: '16px 10px', textAlign: 'center',
            cursor: uploading ? 'wait' : 'pointer', transition: 'all 0.15s',
          }}
        >
          {uploading ? (
            <>
              <div style={{ fontFamily: NU, fontSize: 10, color: GOLD, marginBottom: 6 }}>Uploading…</div>
              <div style={{ height: 2, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: GOLD, width: `${uploadPct}%`, transition: 'width 0.3s' }} />
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 18, color: GOLD, marginBottom: 3 }}>↑</div>
              <div style={{ fontFamily: NU, fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>
                Drop or click to upload
              </div>
              <div style={{ fontFamily: NU, fontSize: 8, color: MUTED, marginTop: 2 }}>JPG · PNG · WebP</div>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
        {uploadErr && <div style={{ fontFamily: NU, fontSize: 9, color: '#f7a0a0', marginTop: 5 }}>{uploadErr}</div>}
      </div>

      {/* Search */}
      {items.length > 4 && (
        <div style={{ padding: '8px 12px 0' }}>
          <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(255,255,255,0.1)`,
              borderRadius: 3, color: '#fff', fontFamily: NU, fontSize: 10,
              padding: '5px 8px', outline: 'none',
            }} />
        </div>
      )}

      {loading && (
        <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, textAlign: 'center', padding: '24px 0' }}>Loading…</div>
      )}

      {/* This issue */}
      {!loading && thisIssue.length > 0 && (
        <>
          <SL>This issue</SL>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, padding: '0 12px' }}>
            {thisIssue.map(i => <MediaThumb key={i.url} {...i} />)}
          </div>
        </>
      )}

      {/* Reused from other issues */}
      {!loading && reused.length > 0 && (
        <>
          <SL>From other issues</SL>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, padding: '0 12px' }}>
            {reused.map(i => <MediaThumb key={i.url} {...i} />)}
          </div>
        </>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ fontFamily: GD, fontStyle: 'italic', fontSize: 13, color: MUTED, textAlign: 'center', padding: '32px 16px' }}>
          No images yet — upload one above
        </div>
      )}
      <div style={{ height: 16 }} />
    </div>
  );
}

// ── Main ElementsPanel export ─────────────────────────────────────────────────

export default function ElementsPanel({ onAddElement, onAddImage, onAddSpreadImage, onAddSpreadText, onAddSpreadShape, spreadView, onInsertTemplate, onReplaceTemplate, activeTemplateId, issue, layers, onSelectLayer, onToggleLayerVisibility, onToggleLayerLock, onReorderLayer, onAddSVG, onAddArcText, onAILayout, currentPageIndex = 0, totalPages = 1, pageSize = 'A4' }) {
  const [panelTab, setPanelTab] = useState('elements');
  const [aiBrief, setAiBrief] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const fileRef = useRef(null);
  const svgFileRef = useRef(null);
  const [urlOpen, setUrlOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  // SVG import state
  const [svgOpen, setSvgOpen] = useState(false);
  const [svgCode, setSvgCode] = useState('');

  // Arc text state
  const [arcOpen, setArcOpen] = useState(false);
  const [arcText, setArcText] = useState('');
  const [arcDeg, setArcDeg] = useState(60);

  // AI Layout state
  const [aiLayoutOpen, setAiLayoutOpen] = useState(false);
  const [aiLayoutPrompt, setAiLayoutPrompt] = useState('');
  const [aiLayoutLoading, setAiLayoutLoading] = useState(false);

  // ── P7 Rich Media state ────────────────────────────────────────────────────
  const [ctaOpen,    setCtaOpen]    = useState(false);
  const [ctaLabel,   setCtaLabel]   = useState('EXPLORE NOW');
  const [ctaUrl,     setCtaUrl]     = useState('');
  const [ctaStyle,   setCtaStyle]   = useState('gold');   // 'gold' | 'outline' | 'text'
  const [videoOpen,  setVideoOpen]  = useState(false);
  const [videoUrl,   setVideoUrl]   = useState('');
  const [linkOpen,   setLinkOpen]   = useState(false);
  const [linkUrl,    setLinkUrl]    = useState('');
  const [linkFetching, setLinkFetching] = useState(false);
  const [linkPreview,  setLinkPreview]  = useState(null);  // { title, description, imageUrl, domain }
  const [linkError,    setLinkError]    = useState('');

  // ── Template management state ──────────────────────────────────────────────
  const [templateSearch, setTemplateSearch]   = useState('');
  const [templateCat,    setTemplateCat]      = useState('All');  // category filter
  const [templateGrid,   setTemplateGrid]     = useState(false);  // grid vs list view
  const [recentTplIds,   setRecentTplIds]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('lwd_studio_recent_tpl') || '[]'); } catch { return []; }
  });

  // Record a template use in recents (called on insert/replace)
  function recordTemplateUse(templateId) {
    setRecentTplIds(prev => {
      const next = [templateId, ...prev.filter(id => id !== templateId)].slice(0, 5);
      try { localStorage.setItem('lwd_studio_recent_tpl', JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  }

  // Smart recommendations based on page position
  const recommendedTemplateIds = useMemo(() => {
    const isFirst = currentPageIndex === 0;
    const isLast  = currentPageIndex >= totalPages - 1 && totalPages > 1;
    const isSecond = currentPageIndex === 1;
    if (isFirst)  return ['vogue-cover'];
    if (isLast)   return ['back-cover'];
    if (isSecond) return ['editors-letter', 'table-of-contents'];
    return [];
  }, [currentPageIndex, totalPages]);

  // Landscape flag — landscape sizes have LANDSCAPE in the key or are TABLOID
  const isLandscape = !!(pageSize?.includes('LANDSCAPE') || pageSize === 'TABLOID');

  async function handleAIWrite() {
    if (!aiBrief.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          feature: 'designer_text',
          systemPrompt: 'You are a luxury wedding magazine copywriter. Write short, elegant editorial copy. Return only the text, no quotes.',
          userPrompt: aiBrief,
        }),
      });
      const data = await res.json();
      if (data.text) onAddElement('aitext', data.text);
      setAiBrief('');
      setAiOpen(false);
    } catch (e) {
      console.error('AI Write error:', e);
    } finally {
      setAiLoading(false);
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onAddImage(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function handleSVGFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (onAddSVG && ev.target.result) onAddSVG(ev.target.result);
      setSvgOpen(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleSVGCodeInsert() {
    if (!svgCode.trim() || !onAddSVG) return;
    onAddSVG(svgCode.trim());
    setSvgCode('');
    setSvgOpen(false);
  }

  function handleArcTextInsert() {
    if (!arcText.trim() || !onAddArcText) return;
    onAddArcText(arcText.trim(), arcDeg);
    setArcText('');
    setArcOpen(false);
  }

  async function handleAILayout() {
    if (!aiLayoutPrompt.trim() || !onAILayout) return;
    setAiLayoutLoading(true);
    try {
      await onAILayout(aiLayoutPrompt.trim());
      setAiLayoutPrompt('');
      setAiLayoutOpen(false);
    } catch (e) {
      console.error('AI Layout error:', e);
    } finally {
      setAiLayoutLoading(false);
    }
  }

  function handleAddFromUrl() {
    if (!imageUrl.trim()) return;
    onAddImage(imageUrl.trim());
    setImageUrl('');
    setUrlOpen(false);
  }


  return (
    <div style={{
      width: 240,
      flexShrink: 0,
      background: '#1A1712',
      borderRight: `1px solid ${BORDER}`,
      overflowY: 'hidden',
      overflowX: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${BORDER}`,
        flexShrink: 0,
      }}>
        {[
          { key: 'elements', label: '⊞ Elements' },
          { key: 'media',    label: '⊟ Media'    },
          { key: 'layers',   label: '⊟ Layers'   },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPanelTab(key)}
            style={{
              flex: 1,
              background: panelTab === key ? 'rgba(201,169,110,0.08)' : 'none',
              border: 'none',
              borderBottom: `2px solid ${panelTab === key ? GOLD : 'transparent'}`,
              color: panelTab === key ? GOLD : MUTED,
              fontFamily: NU,
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '10px 4px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Elements tab */}
      {panelTab === 'elements' && (
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Text elements */}
          <div style={SECTION_STYLE}>Text</div>
          <ElemButton
            label="Heading"
            preview={<span style={{ fontFamily: GD, fontSize: 18, color: GOLD }}>H</span>}
            onClick={() => onAddElement('heading')}
          />
          <ElemButton
            label="Body Text"
            preview={<span style={{ fontFamily: GD, fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>T</span>}
            onClick={() => onAddElement('text')}
          />
          <ElemButton
            label="Subheading"
            preview={<span style={{ fontFamily: GD, fontSize: 16, color: 'rgba(255,255,255,0.7)' }}>S</span>}
            onClick={() => onAddElement('subheading')}
          />
          <ElemButton
            label="Caption"
            preview={<span style={{ fontFamily: NU, fontSize: 10, color: MUTED, letterSpacing: '0.08em' }}>CAP</span>}
            onClick={() => onAddElement('caption')}
          />
          <ElemButton
            label="Pull Quote"
            preview={<span style={{ fontFamily: GD, fontSize: 16, color: GOLD, fontStyle: 'italic' }}>"</span>}
            onClick={() => onAddElement('pullquote')}
          />
          <ElemButton
            label="Page No."
            preview={<span style={{ fontFamily: NU, fontSize: 13, color: GOLD }}>№</span>}
            onClick={() => onAddElement('pagenumber')}
          />
          <ElemButton
            label="Arc Text"
            preview={<span style={{ fontFamily: GD, fontSize: 14, color: GOLD, fontStyle: 'italic' }}>∩</span>}
            onClick={() => setArcOpen(v => !v)}
          />
          {arcOpen && (
            <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.2)' }}>
              <input
                type="text"
                placeholder="Your arc text…"
                value={arcText}
                onChange={e => setArcText(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid rgba(255,255,255,0.12)`,
                  borderRadius: 3, color: '#fff',
                  fontFamily: NU, fontSize: 11,
                  padding: '6px 8px', outline: 'none',
                  marginBottom: 8,
                }}
              />
              <label style={{ fontFamily: NU, fontSize: 10, color: MUTED, display: 'block', marginBottom: 4 }}>
                Arc amount: {arcDeg}°
              </label>
              <input
                type="range"
                min={-180}
                max={180}
                value={arcDeg}
                onChange={e => setArcDeg(Number(e.target.value))}
                style={{ width: '100%', accentColor: GOLD, marginBottom: 8 }}
              />
              <button
                onClick={handleArcTextInsert}
                disabled={!arcText.trim()}
                style={{
                  width: '100%',
                  background: arcText.trim() ? GOLD : 'rgba(201,169,110,0.3)',
                  border: 'none', borderRadius: 3,
                  color: '#1a1208', fontFamily: NU,
                  fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  padding: '6px 0', cursor: arcText.trim() ? 'pointer' : 'default',
                }}
              >
                Insert Arc Text
              </button>
            </div>
          )}

          <Divider />

          {/* Shapes */}
          <div style={SECTION_STYLE}>Shapes</div>
          <ElemButton
            label="Rectangle"
            preview={
              <svg width="22" height="14" viewBox="0 0 22 14">
                <rect x="1" y="1" width="20" height="12" fill={GOLD} rx="0" />
              </svg>
            }
            onClick={() => onAddElement('rect')}
          />
          <ElemButton
            label="Circle"
            preview={
              <svg width="18" height="18" viewBox="0 0 18 18">
                <circle cx="9" cy="9" r="8" fill={GOLD} />
              </svg>
            }
            onClick={() => onAddElement('circle')}
          />
          <ElemButton
            label="Line"
            preview={
              <svg width="22" height="4" viewBox="0 0 22 4">
                <line x1="0" y1="2" x2="22" y2="2" stroke={GOLD} strokeWidth="2" />
              </svg>
            }
            onClick={() => onAddElement('line')}
          />
          <ElemButton
            label="Divider"
            preview={
              <svg width="22" height="4" viewBox="0 0 22 4">
                <line x1="0" y1="2" x2="22" y2="2" stroke={GOLD} strokeWidth="1" />
              </svg>
            }
            onClick={() => onAddElement('divider')}
          />

          <Divider />

          {/* ── Rich Media ───────────────────────────────────────────────── */}
          <div style={SECTION_STYLE}>Rich Media</div>

          {/* CTA Button */}
          <ElemButton
            label="CTA Button"
            preview={
              <svg width="28" height="14" viewBox="0 0 28 14">
                <rect x="1" y="1" width="26" height="12" fill={GOLD} rx="2" />
                <text x="14" y="9.5" textAnchor="middle" fill="#18120A" fontSize="6" fontFamily="sans-serif" fontWeight="bold">CTA</text>
              </svg>
            }
            onClick={() => { setCtaOpen(v => !v); setVideoOpen(false); setLinkOpen(false); }}
          />
          {ctaOpen && (
            <div style={{ padding: '8px 14px 12px', background: 'rgba(0,0,0,0.25)' }}>
              <input
                placeholder="Button label…"
                value={ctaLabel}
                onChange={e => setCtaLabel(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 3, color: '#fff', fontFamily: NU, fontSize: 11, padding: '6px 8px', outline: 'none', marginBottom: 8 }}
              />
              {/* Style pills */}
              <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
                {[['gold','Gold Fill'],['outline','Outline'],['text','Text Only']].map(([s, lbl]) => (
                  <button key={s} onClick={() => setCtaStyle(s)} style={{
                    flex: 1, fontFamily: NU, fontSize: 8.5, fontWeight: 600,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    background: ctaStyle === s ? 'rgba(201,168,76,0.18)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${ctaStyle === s ? GOLD : 'rgba(255,255,255,0.1)'}`,
                    color: ctaStyle === s ? GOLD : MUTED,
                    borderRadius: 2, padding: '5px 0', cursor: 'pointer',
                  }}>{lbl}</button>
                ))}
              </div>
              <input
                placeholder="https://… (optional)"
                value={ctaUrl}
                onChange={e => setCtaUrl(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 3, color: '#fff', fontFamily: NU, fontSize: 11, padding: '6px 8px', outline: 'none', marginBottom: 8 }}
              />
              <button
                onClick={() => {
                  onAddElement('cta-button', JSON.stringify({ label: ctaLabel || 'EXPLORE NOW', url: ctaUrl, style: ctaStyle }));
                  setCtaOpen(false);
                }}
                style={{ width: '100%', background: GOLD, border: 'none', borderRadius: 3, color: '#18120A', fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '7px 0', cursor: 'pointer' }}
              >
                Insert Button
              </button>
            </div>
          )}

          {/* Video Embed */}
          <ElemButton
            label="Video Embed"
            preview={
              <svg width="28" height="18" viewBox="0 0 28 18">
                <rect x="1" y="1" width="26" height="16" fill="#1A1612" rx="2" stroke={GOLD} strokeWidth="0.8" />
                <circle cx="14" cy="9" r="5" fill={GOLD} opacity="0.85" />
                <polygon points="12,7 12,11 17,9" fill="#18120A" />
              </svg>
            }
            onClick={() => { setVideoOpen(v => !v); setCtaOpen(false); setLinkOpen(false); }}
          />
          {videoOpen && (
            <div style={{ padding: '8px 14px 12px', background: 'rgba(0,0,0,0.25)' }}>
              <input
                placeholder="YouTube or Vimeo URL…"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 3, color: '#fff', fontFamily: NU, fontSize: 11, padding: '6px 8px', outline: 'none', marginBottom: 8 }}
              />
              <button
                disabled={!videoUrl.trim()}
                onClick={() => {
                  onAddElement('video-block', videoUrl.trim());
                  setVideoOpen(false);
                  setVideoUrl('');
                }}
                style={{ width: '100%', background: videoUrl.trim() ? GOLD : 'rgba(201,168,76,0.3)', border: 'none', borderRadius: 3, color: '#18120A', fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '7px 0', cursor: videoUrl.trim() ? 'pointer' : 'default' }}
              >
                Insert Video
              </button>
            </div>
          )}

          {/* Link Card */}
          <ElemButton
            label="Link Card"
            preview={
              <svg width="28" height="18" viewBox="0 0 28 18">
                <rect x="1" y="1" width="26" height="16" fill="#1A1612" rx="2" stroke={GOLD} strokeWidth="0.8" />
                <rect x="2" y="2" width="10" height="15" fill="#2A2520" rx="1.5" />
                <rect x="14" y="4" width="13" height="2" fill={GOLD} rx="1" opacity="0.7" />
                <rect x="14" y="8" width="13" height="1.5" fill="rgba(255,255,255,0.3)" rx="1" />
                <rect x="14" y="11" width="9" height="1.5" fill="rgba(255,255,255,0.2)" rx="1" />
              </svg>
            }
            onClick={() => { setLinkOpen(v => !v); setCtaOpen(false); setVideoOpen(false); setLinkError(''); }}
          />
          {linkOpen && (
            <div style={{ padding: '8px 14px 12px', background: 'rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
                <input
                  placeholder="https://…"
                  value={linkUrl}
                  onChange={e => { setLinkUrl(e.target.value); setLinkPreview(null); setLinkError(''); }}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 3, color: '#fff', fontFamily: NU, fontSize: 11, padding: '6px 8px', outline: 'none' }}
                />
                <button
                  disabled={!linkUrl.trim() || linkFetching}
                  onClick={async () => {
                    setLinkFetching(true); setLinkError(''); setLinkPreview(null);
                    try {
                      const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(linkUrl.trim())}`);
                      const data = await res.json();
                      if (data.status === 'success') {
                        setLinkPreview({
                          title:       data.data.title       || linkUrl,
                          description: data.data.description || '',
                          imageUrl:    data.data.image?.url  || '',
                          domain:      data.data.url ? new URL(data.data.url).hostname : linkUrl,
                        });
                      } else {
                        setLinkError('Could not fetch preview.');
                      }
                    } catch { setLinkError('Network error.'); }
                    setLinkFetching(false);
                  }}
                  style={{ flexShrink: 0, background: 'rgba(201,168,76,0.15)', border: `1px solid rgba(201,168,76,0.3)`, borderRadius: 3, color: GOLD, fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '6px 10px', cursor: linkUrl.trim() && !linkFetching ? 'pointer' : 'default' }}
                >
                  {linkFetching ? '…' : 'Fetch'}
                </button>
              </div>
              {linkError && <div style={{ fontFamily: NU, fontSize: 10, color: '#f87171', marginBottom: 6 }}>{linkError}</div>}
              {linkPreview && (
                <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(201,168,76,0.2)`, borderRadius: 3, padding: '8px 10px', marginBottom: 8 }}>
                  <div style={{ fontFamily: NU, fontSize: 8, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>{linkPreview.domain}</div>
                  <div style={{ fontFamily: GD, fontSize: 12, fontStyle: 'italic', color: '#F0EBE0', lineHeight: 1.3, marginBottom: 3 }}>{linkPreview.title}</div>
                  {linkPreview.description && <div style={{ fontFamily: NU, fontSize: 9.5, color: MUTED, lineHeight: 1.4 }}>{linkPreview.description.slice(0, 90)}{linkPreview.description.length > 90 ? '…' : ''}</div>}
                </div>
              )}
              <button
                disabled={!linkPreview}
                onClick={() => {
                  onAddElement('link-card', JSON.stringify({ ...linkPreview, linkUrl: linkUrl.trim() }));
                  setLinkOpen(false); setLinkUrl(''); setLinkPreview(null);
                }}
                style={{ width: '100%', background: linkPreview ? GOLD : 'rgba(201,168,76,0.3)', border: 'none', borderRadius: 3, color: '#18120A', fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '7px 0', cursor: linkPreview ? 'pointer' : 'default' }}
              >
                Insert Card
              </button>
            </div>
          )}

          <Divider />

          {/* Image + inline media library */}
          <div style={{ ...SECTION_STYLE, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 16 }}>
            <span>Images</span>
            <button
              onClick={() => setPanelTab('media')}
              style={{ background: 'none', border: 'none', fontFamily: NU, fontSize: 8, color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', padding: 0 }}
            >
              See all →
            </button>
          </div>

          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
          <input ref={svgFileRef} type="file" accept=".svg" style={{ display: 'none' }} onChange={handleSVGFileChange} />

          {/* Upload row */}
          <div style={{ padding: '0 10px 8px', display: 'flex', gap: 6 }}>
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                background: 'rgba(201,169,110,0.1)', border: `1px solid rgba(201,169,110,0.3)`,
                borderRadius: 3, color: GOLD,
                fontFamily: NU, fontSize: 9, fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                padding: '7px 0', cursor: 'pointer',
              }}
            >
              ↑ Upload
            </button>
            <button
              onClick={() => setUrlOpen(v => !v)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(255,255,255,0.1)`,
                borderRadius: 3, color: 'rgba(255,255,255,0.55)',
                fontFamily: NU, fontSize: 9, fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                padding: '7px 0', cursor: 'pointer',
              }}
            >
              URL
            </button>
          </div>

          {urlOpen && (
            <div style={{ padding: '0 10px 8px', background: 'rgba(0,0,0,0.2)' }}>
              <input
                type="text"
                placeholder="https://..."
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddFromUrl()}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid rgba(255,255,255,0.12)`,
                  borderRadius: 3, color: '#fff',
                  fontFamily: NU, fontSize: 11,
                  padding: '6px 8px', outline: 'none',
                }}
              />
              <button
                onClick={handleAddFromUrl}
                style={{
                  marginTop: 6, width: '100%',
                  background: GOLD, border: 'none',
                  borderRadius: 3, color: '#1a1208',
                  fontFamily: NU, fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  padding: '6px 0', cursor: 'pointer',
                }}
              >
                Add Image
              </button>
            </div>
          )}

          {/* Inline media grid — recent uploads */}
          <InlineMediaGrid issue={issue} onAddImage={onAddImage} onSeeAll={() => setPanelTab('media')} />

          {/* ── Spread elements — only visible in spread view ─────────────────── */}
          {spreadView && (
            <div style={{ padding: '0 10px 12px' }}>
              <div style={{
                fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                color: GOLD, textTransform: 'uppercase', marginBottom: 6, paddingLeft: 2,
              }}>
                Spread Elements
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[
                  { label: '⊞ Spread Image',   title: 'Place one image across both pages',          onClick: onAddSpreadImage },
                  { label: '⊞ Spread Heading',  title: 'Place a headline text across both pages',    onClick: () => onAddSpreadText?.('heading') },
                  { label: '⊞ Spread Body',     title: 'Place body text across both pages',          onClick: () => onAddSpreadText?.('text') },
                  { label: '⊞ Spread Box',      title: 'Place a colour band across both pages',      onClick: () => onAddSpreadShape?.('rect') },
                  { label: '⊞ Spread Line',     title: 'Place a rule line across both pages',        onClick: () => onAddSpreadShape?.('line') },
                ].map(({ label, title, onClick }) => (
                  <button
                    key={label}
                    onClick={onClick}
                    disabled={!onClick}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      background: 'rgba(201,169,110,0.08)',
                      border: `1px solid rgba(201,169,110,0.3)`,
                      borderRadius: 3, color: GOLD,
                      fontFamily: NU, fontSize: 9, fontWeight: 700,
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      padding: '8px 0', cursor: onClick ? 'pointer' : 'default',
                      transition: 'all 0.15s', opacity: onClick ? 1 : 0.4,
                    }}
                    onMouseEnter={e => { if (onClick) { e.currentTarget.style.background = 'rgba(201,169,110,0.15)'; e.currentTarget.style.borderColor = GOLD; }}}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,169,110,0.08)'; e.currentTarget.style.borderColor = 'rgba(201,169,110,0.3)'; }}
                    title={title}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SVG Import */}
          <ElemButton
            label="SVG"
            preview={<span style={{ fontFamily: NU, fontSize: 10, color: GOLD, fontWeight: 700 }}>SVG</span>}
            onClick={() => setSvgOpen(v => !v)}
          />
          {svgOpen && (
            <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.2)' }}>
              <button
                onClick={() => svgFileRef.current?.click()}
                style={{
                  width: '100%', marginBottom: 6,
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid rgba(255,255,255,0.12)`,
                  borderRadius: 3, color: '#fff',
                  fontFamily: NU, fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                  padding: '6px 0', cursor: 'pointer',
                }}
              >
                ↑ Upload .svg file
              </button>
              <textarea
                placeholder="Or paste SVG code here…"
                value={svgCode}
                onChange={e => setSvgCode(e.target.value)}
                rows={4}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid rgba(255,255,255,0.12)`,
                  borderRadius: 3, color: '#fff',
                  fontFamily: NU, fontSize: 10,
                  padding: '6px 8px', outline: 'none',
                  resize: 'vertical',
                }}
              />
              <button
                onClick={handleSVGCodeInsert}
                disabled={!svgCode.trim()}
                style={{
                  marginTop: 6, width: '100%',
                  background: svgCode.trim() ? GOLD : 'rgba(201,169,110,0.3)',
                  border: 'none', borderRadius: 3,
                  color: '#1a1208', fontFamily: NU,
                  fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  padding: '6px 0', cursor: svgCode.trim() ? 'pointer' : 'default',
                }}
              >
                Insert SVG
              </button>
            </div>
          )}

          <Divider />

          {/* AI Generate */}
          <div style={SECTION_STYLE}>AI Generate</div>
          <ElemButton
            label="✦ AI Write"
            preview={<span style={{ fontSize: 14, color: GOLD }}>✦</span>}
            onClick={() => setAiOpen(v => !v)}
          />
          {aiOpen && (
            <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.2)' }}>
              <textarea
                placeholder="Brief: e.g. 'Romantic opening paragraph for a Tuscany villa wedding'"
                value={aiBrief}
                onChange={e => setAiBrief(e.target.value)}
                rows={3}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid rgba(255,255,255,0.12)`,
                  borderRadius: 3, color: '#fff',
                  fontFamily: NU, fontSize: 11,
                  padding: '6px 8px', outline: 'none',
                  resize: 'vertical',
                }}
              />
              <button
                onClick={handleAIWrite}
                disabled={aiLoading || !aiBrief.trim()}
                style={{
                  marginTop: 6, width: '100%',
                  background: aiLoading ? 'rgba(201,169,110,0.4)' : GOLD,
                  border: 'none', borderRadius: 3,
                  color: '#1a1208', fontFamily: NU,
                  fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  padding: '6px 0', cursor: aiLoading ? 'default' : 'pointer',
                  opacity: !aiBrief.trim() ? 0.5 : 1,
                }}
              >
                {aiLoading ? 'Writing...' : '✦ Generate Text'}
              </button>
            </div>
          )}

          <ElemButton
            label="✦ AI Layout"
            preview={<span style={{ fontSize: 14, color: GOLD }}>✦</span>}
            onClick={() => setAiLayoutOpen(v => !v)}
          />
          {aiLayoutOpen && (
            <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.2)' }}>
              <textarea
                placeholder="Describe a layout (e.g. 'editorial feature with large left image and pull quote on the right')"
                value={aiLayoutPrompt}
                onChange={e => setAiLayoutPrompt(e.target.value)}
                rows={3}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid rgba(255,255,255,0.12)`,
                  borderRadius: 3, color: '#fff',
                  fontFamily: NU, fontSize: 11,
                  padding: '6px 8px', outline: 'none',
                  resize: 'vertical',
                }}
              />
              <button
                onClick={handleAILayout}
                disabled={aiLayoutLoading || !aiLayoutPrompt.trim()}
                style={{
                  marginTop: 6, width: '100%',
                  background: aiLayoutLoading ? 'rgba(201,169,110,0.4)' : GOLD,
                  border: 'none', borderRadius: 3,
                  color: '#1a1208', fontFamily: NU,
                  fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  padding: '6px 0', cursor: aiLayoutLoading ? 'default' : 'pointer',
                  opacity: !aiLayoutPrompt.trim() ? 0.5 : 1,
                }}
              >
                {aiLayoutLoading ? 'Applying...' : '✦ Apply Layout'}
              </button>
            </div>
          )}

          <Divider />

          {/* ── Template Library ─────────────────────────────────────────────── */}
          <div style={{ padding: '10px 12px 6px' }}>

            {/* Header row: title + grid/list toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Templates
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => setTemplateGrid(false)}
                  title="List view"
                  style={{
                    background: !templateGrid ? 'rgba(201,169,110,0.15)' : 'none',
                    border: `1px solid ${!templateGrid ? 'rgba(201,169,110,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 2, color: !templateGrid ? GOLD : MUTED,
                    padding: '3px 6px', cursor: 'pointer', fontSize: 10,
                  }}
                >☰</button>
                <button
                  onClick={() => setTemplateGrid(true)}
                  title="Grid view"
                  style={{
                    background: templateGrid ? 'rgba(201,169,110,0.15)' : 'none',
                    border: `1px solid ${templateGrid ? 'rgba(201,169,110,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 2, color: templateGrid ? GOLD : MUTED,
                    padding: '3px 6px', cursor: 'pointer', fontSize: 10,
                  }}
                >⊞</button>
              </div>
            </div>

            {/* Search bar */}
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <span style={{
                position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                fontSize: 11, color: MUTED, pointerEvents: 'none',
              }}>⌕</span>
              <input
                type="text"
                placeholder="Search templates…"
                value={templateSearch}
                onChange={e => setTemplateSearch(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${templateSearch ? 'rgba(201,169,110,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 3, color: '#fff',
                  fontFamily: NU, fontSize: 11,
                  padding: '5px 8px 5px 22px', outline: 'none',
                  transition: 'border-color 0.12s',
                }}
              />
              {templateSearch && (
                <button
                  onClick={() => setTemplateSearch('')}
                  style={{
                    position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: MUTED,
                    cursor: 'pointer', fontSize: 12, padding: 0, lineHeight: 1,
                  }}
                >✕</button>
              )}
            </div>

            {/* Category filter pills */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
              {CAT_PILLS.map(pill => (
                <button
                  key={pill}
                  onClick={() => setTemplateCat(pill)}
                  style={{
                    fontFamily: NU, fontSize: 8, fontWeight: 600,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    padding: '3px 7px', borderRadius: 2, cursor: 'pointer',
                    background: templateCat === pill ? 'rgba(201,169,110,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${templateCat === pill ? 'rgba(201,169,110,0.45)' : 'rgba(255,255,255,0.09)'}`,
                    color: templateCat === pill ? GOLD : MUTED,
                    transition: 'all 0.1s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {pill === 'Cover & Navigation' ? 'Cover' :
                   pill === 'Fashion & Style' ? 'Fashion' :
                   pill === 'Venue & Travel' ? 'Venue' : pill}
                </button>
              ))}
            </div>

            {/* Landscape notice */}
            {isLandscape && (
              <div style={{
                fontFamily: NU, fontSize: 9, color: 'rgba(201,169,110,0.7)',
                background: 'rgba(201,169,110,0.07)',
                border: '1px solid rgba(201,169,110,0.2)',
                borderRadius: 3, padding: '6px 10px', marginBottom: 8,
                lineHeight: 1.5,
              }}>
                ◆ Templates are designed for portrait. Landscape variants coming soon — insert and adjust manually.
              </div>
            )}
          </div>

          {/* Template rows — filtered + grouped */}
          {(() => {
            const q = templateSearch.toLowerCase().trim();

            // Filter templates
            let filtered = TEMPLATES.filter(t => {
              const matchSearch = !q || t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
              const matchCat = templateCat === 'All' || SECTION_GROUPS.find(g => g.label === templateCat)?.categories.has(t.category);
              return matchSearch && matchCat;
            });

            // Recently used (top of list when no search)
            const recentTemplates = !q && templateCat === 'All'
              ? recentTplIds.map(id => TEMPLATES.find(t => t.id === id)).filter(Boolean)
              : [];

            // Recommended (when no search)
            const recTemplates = !q && templateCat === 'All'
              ? recommendedTemplateIds.map(id => TEMPLATES.find(t => t.id === id)).filter(Boolean)
              : [];

            // Helper: render a template (list or grid)
            function renderTpl(template, label) {
              const globalIndex = TEMPLATES.indexOf(template);
              if (templateGrid) {
                return (
                  <GridThumb
                    key={`${label}-${template.id}`}
                    template={template}
                    globalIndex={globalIndex}
                    onInsert={() => { onInsertTemplate?.(globalIndex); recordTemplateUse(template.id); }}
                    onReplace={() => { onReplaceTemplate?.(globalIndex); recordTemplateUse(template.id); }}
                    isActive={activeTemplateId === template.id}
                  />
                );
              }
              return (
                <TemplateRow
                  key={`${label}-${template.id}`}
                  template={template}
                  globalIndex={globalIndex}
                  onInsert={() => { onInsertTemplate?.(globalIndex); recordTemplateUse(template.id); }}
                  onReplace={() => { onReplaceTemplate?.(globalIndex); recordTemplateUse(template.id); }}
                  isActive={activeTemplateId === template.id}
                />
              );
            }

            // Search mode — flat list with match count
            if (q) {
              if (!filtered.length) {
                return (
                  <div style={{ padding: '20px 16px', textAlign: 'center', fontFamily: NU, fontSize: 11, color: MUTED }}>
                    No templates match "{q}"
                  </div>
                );
              }
              return (
                <>
                  <div style={{ padding: '4px 14px 6px', fontFamily: NU, fontSize: 8, color: MUTED }}>
                    {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                  </div>
                  {filtered.map(t => renderTpl(t, 'search'))}
                </>
              );
            }

            // Category filter mode — sectioned or flat
            if (templateCat !== 'All') {
              return filtered.length
                ? (templateGrid
                    ? <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: '6px 10px' }}>
                        {filtered.map(t => renderTpl(t, 'cat'))}
                      </div>
                    : <>{filtered.map(t => renderTpl(t, 'cat'))}</>
                  )
                : <div style={{ padding: '20px 16px', textAlign: 'center', fontFamily: NU, fontSize: 11, color: MUTED }}>No templates in this category</div>;
            }

            // Default: recommended + recently used + full grouped list
            const { groups, uncategorised } = buildSectionedTemplates(filtered);
            return (
              <>
                {/* Recommended */}
                {recTemplates.length > 0 && (
                  <div>
                    <div style={{ ...SECTION_STYLE, borderTop: `1px solid rgba(255,255,255,0.06)`, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 9 }}>✦</span> Suggested for page {currentPageIndex + 1}
                    </div>
                    {recTemplates.map(t => renderTpl(t, 'rec'))}
                  </div>
                )}

                {/* Recently used */}
                {recentTemplates.length > 0 && (
                  <div>
                    <div style={{ ...SECTION_STYLE, borderTop: `1px solid rgba(255,255,255,0.06)`, marginTop: 4 }}>
                      Recently Used
                    </div>
                    {recentTemplates.map(t => renderTpl(t, 'recent'))}
                  </div>
                )}

                {/* Grouped sections */}
                {templateGrid ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: '6px 10px' }}>
                    {filtered.map(t => renderTpl(t, 'grid'))}
                  </div>
                ) : (
                  <>
                    {groups.map(group => {
                      if (!group.templates.length) return null;
                      return (
                        <div key={group.label}>
                          <div style={{ ...SECTION_STYLE, borderTop: `1px solid rgba(255,255,255,0.06)`, marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span>{group.label}</span>
                            <span style={{ fontFamily: NU, fontSize: 8, color: 'rgba(255,255,255,0.2)', fontWeight: 400, letterSpacing: '0.04em', textTransform: 'none' }}>
                              {group.templates.length} layouts
                            </span>
                          </div>
                          {group.templates.map(t => renderTpl(t, group.label))}
                        </div>
                      );
                    })}
                    {uncategorised.length > 0 && (
                      <div>
                        <div style={{ ...SECTION_STYLE, borderTop: `1px solid rgba(255,255,255,0.06)`, marginTop: 4 }}>Other</div>
                        {uncategorised.map(t => renderTpl(t, 'other'))}
                      </div>
                    )}
                  </>
                )}
              </>
            );
          })()}

          <div style={{ height: 20 }} />
        </div>
      )}

      {/* Media tab */}
      {panelTab === 'media' && (
        <MediaTab issue={issue} onAddImage={onAddImage} />
      )}

      {/* Layers tab */}
      {panelTab === 'layers' && (
        <LayersPanel
          layers={layers}
          onSelectLayer={onSelectLayer}
          onToggleLayerVisibility={onToggleLayerVisibility}
          onToggleLayerLock={onToggleLayerLock}
          onReorderLayer={onReorderLayer}
        />
      )}
    </div>
  );
}
