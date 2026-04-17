// ─── ImagePickerModal.jsx ─────────────────────────────────────────────────────
// Canva-style image picker for the Publication Studio PageDesigner.
//
// Layout: full-height side panel sliding in from the right (not a centred modal)
// Tabs:   My Media | Unsplash | ✦ AI
//
// My Media:
//   – Shows all images uploaded to this issue (from Supabase Storage) plus
//     images from other issues/sessions (from localStorage).
//   – Upload zone at the top: drop or click → uploads instantly, image is
//     inserted into the canvas immediately without a second confirmation.
//   – Search/filter by filename.
//
// Props:
//   issue?        { id?: string }
//   onSelect(url) called with the chosen image URL
//   onClose()     closes the panel

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { uploadAsset, listAllAssets } from '../../../services/publicationMediaService';
import { GOLD, BORDER, MUTED, NU, GD } from './designerConstants';

// Unsplash: uses the free public search endpoint — no API key required.
// When a VITE_UNSPLASH_ACCESS_KEY env var is present the official API is used instead
// (higher rate limits, attribution data). Either way, search just works.
const UNSPLASH_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY || null;
const AI_STYLES    = ['Editorial', 'Romantic', 'Cinematic', 'Minimal', 'Luxury'];

// ── Colours / tokens ──────────────────────────────────────────────────────────
const BG   = '#111009';
const BG2  = '#1A1712';
const BDR  = 'rgba(255,255,255,0.09)';

// ── Tiny helpers ──────────────────────────────────────────────────────────────
function TabBtn({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, background: active ? 'rgba(201,169,110,0.1)' : 'transparent',
        border: 'none', borderBottom: `2px solid ${active ? GOLD : 'transparent'}`,
        color: active ? GOLD : MUTED,
        fontFamily: NU, fontSize: 10, fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        padding: '13px 6px', cursor: 'pointer', transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD,
      letterSpacing: '0.14em', textTransform: 'uppercase',
      margin: '16px 0 8px',
    }}>
      {children}
    </div>
  );
}

// ── Image grid item ───────────────────────────────────────────────────────────
function MediaThumb({ url, name, fromOtherIssue, onSelect }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={() => onSelect(url)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={name || url}
      style={{
        position: 'relative', aspectRatio: '3 / 4',
        background: BG2, border: `1px solid ${hovered ? GOLD : BDR}`,
        padding: 0, cursor: 'pointer', overflow: 'hidden',
        transition: 'border-color 0.15s, transform 0.15s',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      <img
        src={url}
        alt={name || ''}
        loading="lazy"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      {fromOtherIssue && (
        <div style={{
          position: 'absolute', top: 4, right: 4,
          fontFamily: NU, fontSize: 7, fontWeight: 700,
          background: 'rgba(0,0,0,0.65)', color: MUTED,
          padding: '2px 4px', letterSpacing: '0.06em',
        }}>
          REUSED
        </div>
      )}
      {hovered && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: NU, fontSize: 9, fontWeight: 700,
            color: '#fff', letterSpacing: '0.1em', textTransform: 'uppercase',
            background: GOLD, color: '#120E08', padding: '5px 10px',
          }}>
            Use
          </span>
        </div>
      )}
    </button>
  );
}

// ── Upload zone ───────────────────────────────────────────────────────────────
function UploadZone({ uploading, uploadProgress, onFile, dragOver, onDragOver, onDragLeave, onDrop }) {
  const inputRef = useRef(null);
  return (
    <div>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          border: `1px dashed ${dragOver ? GOLD : 'rgba(255,255,255,0.15)'}`,
          background: dragOver ? 'rgba(201,169,110,0.05)' : 'rgba(255,255,255,0.02)',
          padding: '28px 16px', textAlign: 'center',
          cursor: uploading ? 'wait' : 'pointer',
          transition: 'all 0.15s', borderRadius: 2,
        }}
      >
        {uploading ? (
          <>
            <div style={{ fontFamily: NU, fontSize: 11, color: GOLD, marginBottom: 8 }}>
              Uploading…
            </div>
            <div style={{
              height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', background: GOLD, borderRadius: 2,
                width: `${uploadProgress}%`, transition: 'width 0.3s ease',
              }} />
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 24, color: GOLD, marginBottom: 6 }}>↑</div>
            <div style={{ fontFamily: NU, fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em' }}>
              Drop image or click to upload
            </div>
            <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, marginTop: 4 }}>
              JPG · PNG · WebP
            </div>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ImagePickerModal({ issue, onSelect, onClose }) {
  const [tab,            setTab]            = useState('media');
  const [mediaItems,     setMediaItems]     = useState([]);
  const [mediaLoading,   setMediaLoading]   = useState(false);
  const [mediaError,     setMediaError]     = useState(null);
  const [mediaSearch,    setMediaSearch]    = useState('');
  const [dragOver,       setDragOver]       = useState(false);
  const [uploading,      setUploading]      = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError,    setUploadError]    = useState(null);

  // Unsplash
  const [unQuery,   setUnQuery]   = useState('');
  const [unResults, setUnResults] = useState([]);
  const [unLoading, setUnLoading] = useState(false);
  const [unError,   setUnError]   = useState(null);
  const unDebounce  = useRef(null);

  // AI Generate
  const [aiPrompt,  setAiPrompt]  = useState('');
  const [aiStyle,   setAiStyle]   = useState('Editorial');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult,  setAiResult]  = useState(null);
  const [aiError,   setAiError]   = useState(null);

  // ── Load media library ─────────────────────────────────────────────────────
  const loadMedia = useCallback(async () => {
    setMediaLoading(true);
    setMediaError(null);
    try {
      const items = await listAllAssets(issue?.id);
      setMediaItems(items);
    } catch (e) {
      setMediaError(e?.message || 'Could not load media.');
    } finally {
      setMediaLoading(false);
    }
  }, [issue?.id]);

  useEffect(() => {
    if (tab === 'media') loadMedia();
  }, [tab, loadMedia]);

  // Filtered media
  const filteredMedia = useMemo(() => {
    if (!mediaSearch.trim()) return mediaItems;
    const q = mediaSearch.toLowerCase();
    return mediaItems.filter(i => (i.name || i.url || '').toLowerCase().includes(q));
  }, [mediaItems, mediaSearch]);

  const thisIssueItems  = filteredMedia.filter(i => !i.fromOtherIssue);
  const reusedItems     = filteredMedia.filter(i =>  i.fromOtherIssue);

  // ── Upload ─────────────────────────────────────────────────────────────────
  const handleUpload = useCallback(async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    setUploadProgress(10);
    try {
      // Simulate progress (real progress not available from fetch)
      const progressTimer = setInterval(() => {
        setUploadProgress(p => Math.min(p + 15, 85));
      }, 300);
      const { publicUrl, error } = await uploadAsset(issue?.id, file);
      clearInterval(progressTimer);
      setUploadProgress(100);
      if (error) throw new Error(error);
      // Refresh media list then auto-select
      await loadMedia();
      onSelect(publicUrl);
    } catch (e) {
      setUploadError(e?.message || 'Upload failed.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [issue?.id, loadMedia, onSelect]);

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }

  // ── Unsplash search ────────────────────────────────────────────────────────
  // Free path:    GET https://unsplash.com/napi/search/photos?query=…&per_page=24
  // With API key: GET https://api.unsplash.com/search/photos?query=…&per_page=24
  //               Authorization: Client-ID <key>
  const searchUnsplash = useCallback(async (q) => {
    if (!q.trim()) { setUnResults([]); return; }
    setUnLoading(true); setUnError(null);
    try {
      let res;
      if (UNSPLASH_KEY) {
        res = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=24&orientation=portrait`,
          { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } }
        );
      } else {
        // Free public endpoint — no key needed
        res = await fetch(
          `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(q)}&per_page=24&orientation=portrait`
        );
      }
      if (!res.ok) throw new Error(`Unsplash ${res.status}`);
      const json = await res.json();
      setUnResults(json.results || []);
    } catch (e) {
      setUnError('Search failed — ' + e.message);
    }
    setUnLoading(false);
  }, []);

  function handleUnQuery(v) {
    setUnQuery(v);
    clearTimeout(unDebounce.current);
    unDebounce.current = setTimeout(() => searchUnsplash(v), 450);
  }

  // ── AI Generate ────────────────────────────────────────────────────────────
  async function handleAIGenerate() {
    if (!aiPrompt.trim()) return;
    const { supabase: sb } = await import('../../../lib/supabaseClient');
    setAiLoading(true); setAiError(null); setAiResult(null);
    try {
      const { data, error } = await sb.functions.invoke('ai-image-generate', {
        body: { prompt: `${aiPrompt.trim()} — ${aiStyle} luxury editorial style` },
      });
      if (error || !data?.url) throw new Error(error?.message || 'No image returned');
      setAiResult(data.url);
    } catch (e) { setAiError(e.message); }
    setAiLoading(false);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 3000,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 400, maxWidth: '92vw',
          background: BG,
          borderLeft: `1px solid ${BDR}`,
          borderTop: `2px solid ${GOLD}`,
          display: 'flex', flexDirection: 'column',
          height: '100%',
          animation: 'imgPickSlide 0.22s cubic-bezier(0.16,1,0.3,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`
          @keyframes imgPickSlide {
            from { transform: translateX(48px); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
        `}</style>

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div style={{
          padding: '14px 16px 0',
          borderBottom: `1px solid ${BDR}`,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                Publication Studio
              </div>
              <div style={{ fontFamily: GD, fontSize: 18, fontStyle: 'italic', color: '#F0EBE0', marginTop: 2 }}>
                Choose an image
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: `1px solid ${BDR}`, borderRadius: 2,
                color: MUTED, padding: '5px 10px', cursor: 'pointer',
                fontFamily: NU, fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase',
              }}
            >
              ✕ Close
            </button>
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 0 }}>
            <TabBtn label="My Media" active={tab === 'media'}   onClick={() => setTab('media')} />
            <TabBtn label="Unsplash" active={tab === 'unsplash'} onClick={() => setTab('unsplash')} />
            <TabBtn label="✦ AI"     active={tab === 'ai'}       onClick={() => setTab('ai')} />
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 24px' }}>

          {/* ── MY MEDIA ──────────────────────────────────────────────────── */}
          {tab === 'media' && (
            <div>
              {/* Upload zone */}
              <div style={{ marginTop: 16 }}>
                <UploadZone
                  uploading={uploading}
                  uploadProgress={uploadProgress}
                  onFile={handleUpload}
                  dragOver={dragOver}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                />
                {uploadError && (
                  <div style={{ marginTop: 8, fontFamily: NU, fontSize: 10, color: '#F3C8C8' }}>
                    {uploadError}
                  </div>
                )}
              </div>

              {/* Search */}
              {mediaItems.length > 6 && (
                <input
                  type="text"
                  placeholder="Search your media…"
                  value={mediaSearch}
                  onChange={e => setMediaSearch(e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box', marginTop: 12,
                    background: 'rgba(255,255,255,0.05)', border: `1px solid ${BDR}`,
                    borderRadius: 2, color: '#fff', fontFamily: NU, fontSize: 11,
                    padding: '7px 10px', outline: 'none',
                  }}
                />
              )}

              {mediaLoading && (
                <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, textAlign: 'center', padding: '32px 0' }}>
                  Loading…
                </div>
              )}
              {mediaError && !mediaLoading && (
                <div style={{ fontFamily: NU, fontSize: 10, color: '#F3C8C8', marginTop: 12 }}>{mediaError}</div>
              )}

              {/* This issue's uploads */}
              {!mediaLoading && thisIssueItems.length > 0 && (
                <>
                  <SectionLabel>This issue</SectionLabel>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {thisIssueItems.map(item => (
                      <MediaThumb key={item.url} {...item} onSelect={onSelect} />
                    ))}
                  </div>
                </>
              )}

              {/* Reused from other issues */}
              {!mediaLoading && reusedItems.length > 0 && (
                <>
                  <SectionLabel>From other issues</SectionLabel>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {reusedItems.map(item => (
                      <MediaThumb key={item.url} {...item} onSelect={onSelect} />
                    ))}
                  </div>
                </>
              )}

              {!mediaLoading && filteredMedia.length === 0 && (
                <div style={{
                  fontFamily: GD, fontStyle: 'italic', fontSize: 15,
                  color: MUTED, textAlign: 'center', padding: '40px 0',
                }}>
                  No images yet — upload one above
                </div>
              )}
            </div>
          )}

          {/* ── UNSPLASH ──────────────────────────────────────────────────── */}
          {tab === 'unsplash' && (
            <div>
              <input
                type="text"
                placeholder="Search Unsplash — e.g. 'wedding flowers'"
                value={unQuery}
                onChange={e => handleUnQuery(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box', marginTop: 16,
                  background: 'rgba(255,255,255,0.05)', border: `1px solid ${BDR}`,
                  borderRadius: 2, color: '#fff', fontFamily: NU, fontSize: 11,
                  padding: '9px 12px', outline: 'none',
                }}
                autoFocus
              />

              {unLoading && (
                <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, textAlign: 'center', padding: 32 }}>
                  Searching…
                </div>
              )}
              {unError && !unLoading && (
                <div style={{ fontFamily: NU, fontSize: 10, color: '#F3C8C8', marginTop: 12 }}>{unError}</div>
              )}
              {!unLoading && !unError && unResults.length === 0 && !unQuery && (
                <div style={{ fontFamily: GD, fontStyle: 'italic', fontSize: 15, color: MUTED, textAlign: 'center', padding: 40 }}>
                  Type to search millions of free photos
                </div>
              )}
              {!unLoading && !unError && unResults.length === 0 && unQuery && (
                <div style={{ fontFamily: GD, fontStyle: 'italic', fontSize: 14, color: MUTED, textAlign: 'center', padding: 32 }}>
                  No results for "{unQuery}"
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 16 }}>
                {unResults.map(photo => (
                  <div key={photo.id} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <MediaThumb
                      url={photo.urls.small}
                      name={photo.alt_description || photo.id}
                      onSelect={() => onSelect(photo.urls.regular)}
                    />
                    <div style={{ fontFamily: NU, fontSize: 8, color: 'rgba(255,255,255,0.25)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {photo.user?.name || 'Unsplash'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── AI GENERATE ────────────────────────────────────────────────── */}
          {tab === 'ai' && (
            <div>
              <div style={{ marginTop: 16 }}>
                <textarea
                  placeholder="Describe the image you want…"
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.05)', border: `1px solid ${BDR}`,
                    borderRadius: 2, color: '#fff', fontFamily: NU, fontSize: 11,
                    padding: '9px 12px', outline: 'none', resize: 'vertical',
                  }}
                />
              </div>

              {/* Style pills */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                {AI_STYLES.map(s => (
                  <button
                    key={s}
                    onClick={() => setAiStyle(s)}
                    style={{
                      background:   aiStyle === s ? 'rgba(201,169,110,0.18)' : 'rgba(255,255,255,0.05)',
                      border:       `1px solid ${aiStyle === s ? 'rgba(201,169,110,0.5)' : BDR}`,
                      borderRadius: 2, color: aiStyle === s ? GOLD : MUTED,
                      fontFamily:   NU, fontSize: 9, fontWeight: 700,
                      padding:      '5px 11px', cursor: 'pointer', letterSpacing: '0.06em',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <button
                onClick={handleAIGenerate}
                disabled={aiLoading || !aiPrompt.trim()}
                style={{
                  marginTop: 14, width: '100%',
                  background: 'rgba(201,169,110,0.14)', border: '1px solid rgba(201,169,110,0.4)',
                  borderRadius: 2, color: GOLD, fontFamily: NU, fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  padding: '10px', cursor: aiLoading || !aiPrompt.trim() ? 'default' : 'pointer',
                  opacity: !aiPrompt.trim() ? 0.5 : 1,
                }}
              >
                {aiLoading ? '⋯ Generating…' : '✦ Generate Image'}
              </button>

              {aiLoading && (
                <div style={{
                  marginTop: 16, width: '100%', aspectRatio: '3/4',
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)',
                  backgroundSize: '200% 100%', animation: 'aiShimmer 1.4s infinite',
                }} />
              )}
              <style>{`@keyframes aiShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

              {aiError && !aiLoading && (
                <div style={{ marginTop: 12, padding: 12, background: 'rgba(200,60,60,0.1)', border: '1px solid rgba(200,60,60,0.25)', fontFamily: NU, fontSize: 10, color: '#F3C8C8', lineHeight: 1.6 }}>
                  {aiError.includes('OPENAI') || aiError.includes('configured')
                    ? 'Deploy ai-image-generate edge function and set VITE_OPENAI_KEY to enable this.'
                    : aiError}
                </div>
              )}

              {aiResult && !aiLoading && (
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <img
                    src={aiResult}
                    alt="AI generated"
                    style={{ width: '100%', borderRadius: 2, border: `1px solid ${BDR}`, display: 'block' }}
                  />
                  <button
                    onClick={() => onSelect(aiResult)}
                    style={{
                      background: GOLD, border: 'none', borderRadius: 2,
                      color: '#120E08', fontFamily: NU, fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                      padding: '10px', cursor: 'pointer', width: '100%',
                    }}
                  >
                    Use This Image →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
