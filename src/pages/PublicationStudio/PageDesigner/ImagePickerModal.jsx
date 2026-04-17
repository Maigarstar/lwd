import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { uploadPageImage } from '../../../services/magazinePageService';
import { GOLD, BORDER, MUTED, NU, GD } from './designerConstants';

/**
 * ImagePickerModal
 * Two-tab dark modal for replacing an image placeholder on the canvas.
 *
 * Tab 1 · Upload — drag-drop / file input, uploads to Supabase via
 *   uploadPageImage() and calls onSelect(publicUrl) on success.
 *
 * Tab 2 · Gallery — lists previously-uploaded images for the current issue
 *   from the magazine-pages bucket, shown as a 3-col thumb grid. Falls back
 *   to a flat listing at the bucket root if no issueId is available.
 *
 * Props:
 *   - issue?: { id?: string }      // scopes gallery queries to this issue's folder
 *   - onSelect(url: string): void  // called when the user picks / uploads an image
 *   - onClose(): void              // closes the modal
 */
const UNSPLASH_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

export default function ImagePickerModal({ issue, onSelect, onClose }) {
  const [tab, setTab] = useState('upload');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [galleryItems, setGalleryItems] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  // ── Unsplash state ──────────────────────────────────────────────────────────
  const [unsplashQuery, setUnsplashQuery] = useState('');
  const [unsplashResults, setUnsplashResults] = useState([]);
  const [unsplashLoading, setUnsplashLoading] = useState(false);
  const [unsplashError, setUnsplashError] = useState(null);
  const unsplashDebounceRef = useRef(null);

  // ── AI Generate state ───────────────────────────────────────────────────────
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiStyle, setAiStyle] = useState('Editorial');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState(null);  // generated image URL
  const [aiError, setAiError] = useState(null);
  const AI_STYLES = ['Editorial', 'Romantic', 'Cinematic', 'Minimal'];

  // ── Gallery loader ──────────────────────────────────────────────────────────
  // Lists existing images from the magazine-pages bucket scoped to issue.id
  // when available. Supabase storage.list returns name + metadata — we derive
  // public URLs via getPublicUrl for each file.
  const loadGallery = useCallback(async () => {
    setGalleryLoading(true);
    setGalleryError(null);
    try {
      const bucket = 'magazine-pages';
      const prefix = issue?.id ? `${issue.id}` : '';
      // Recursive list: first list versions folders, then each folder's files.
      const { data: versions, error: vErr } = await supabase.storage
        .from(bucket)
        .list(prefix, { limit: 100, sortBy: { column: 'updated_at', order: 'desc' } });
      if (vErr) throw vErr;

      const urls = [];
      for (const entry of (versions || [])) {
        // Skip .keep / hidden metadata
        if (!entry?.name) continue;
        // If it's a folder (id === null for folders in Supabase), list inside
        if (!entry.id) {
          const subPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;
          const { data: files } = await supabase.storage
            .from(bucket)
            .list(subPrefix, { limit: 100, sortBy: { column: 'updated_at', order: 'desc' } });
          for (const f of (files || [])) {
            if (!f?.name) continue;
            const path = `${subPrefix}/${f.name}`;
            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
            urls.push({ url: publicUrl, name: f.name, updated: f.updated_at });
          }
        } else {
          // A file at the root prefix
          const path = prefix ? `${prefix}/${entry.name}` : entry.name;
          const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
          urls.push({ url: publicUrl, name: entry.name, updated: entry.updated_at });
        }
      }

      // Filter to jpg/png/webp only
      const images = urls.filter(i => /\.(jpg|jpeg|png|webp)$/i.test(i.name));
      setGalleryItems(images.slice(0, 60));
    } catch (e) {
      console.error('Gallery load failed', e);
      setGalleryError(e?.message || 'Could not load gallery.');
    } finally {
      setGalleryLoading(false);
    }
  }, [issue?.id]);

  useEffect(() => {
    if (tab === 'gallery') loadGallery();
  }, [tab, loadGallery]);

  // ── Unsplash search ──────────────────────────────────────────────────────────
  const searchUnsplash = useCallback(async (q) => {
    if (!q.trim()) { setUnsplashResults([]); return; }
    if (!UNSPLASH_KEY) { setUnsplashError('Add VITE_UNSPLASH_ACCESS_KEY to .env to enable Unsplash search.'); return; }
    setUnsplashLoading(true);
    setUnsplashError(null);
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=20&orientation=portrait`,
        { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } }
      );
      if (!res.ok) throw new Error(`Unsplash error: ${res.status}`);
      const data = await res.json();
      setUnsplashResults(data.results || []);
    } catch (e) {
      setUnsplashError(e.message || 'Search failed.');
    } finally {
      setUnsplashLoading(false);
    }
  }, []);

  function handleUnsplashQueryChange(val) {
    setUnsplashQuery(val);
    if (unsplashDebounceRef.current) clearTimeout(unsplashDebounceRef.current);
    unsplashDebounceRef.current = setTimeout(() => searchUnsplash(val), 400);
  }

  // ── AI Generate handler ─────────────────────────────────────────────────────
  async function handleAIGenerate() {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    setAiError(null);
    setAiResult(null);
    try {
      const fullPrompt = `${aiPrompt.trim()} — ${aiStyle} style`;
      const { data, error } = await supabase.functions.invoke('ai-image-generate', {
        body: { prompt: fullPrompt },
      });
      if (error || !data?.url) throw new Error(error?.message || data?.error || 'No image returned');
      setAiResult(data.url);
    } catch (e) {
      setAiError(e.message || 'Generation failed');
    } finally {
      setAiGenerating(false);
    }
  }

  // ── Upload handler ──────────────────────────────────────────────────────────
  // Uses uploadPageImage helper. Because it expects a pageNumber + version in
  // the path, we pass synthetic values (version 0, page = timestamp) so
  // uploaded images don't collide with published page renders.
  const handleUpload = useCallback(async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const issueId = issue?.id || 'studio';
      const syntheticPage = Math.floor(Date.now() / 1000) % 100000;
      const { publicUrl, error } = await uploadPageImage(issueId, 0, syntheticPage, file);
      if (error) throw error;
      if (publicUrl) onSelect(publicUrl);
    } catch (e) {
      console.error('Upload failed', e);
      setUploadError(e?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }, [issue?.id, onSelect]);

  function onFileChange(e) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = '';
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }

  // ── Styles ──────────────────────────────────────────────────────────────────
  const OVERLAY = {
    position: 'fixed', inset: 0, zIndex: 2000,
    background: 'rgba(0,0,0,0.72)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(4px)',
  };
  const MODAL = {
    width: 720, maxWidth: '92vw', maxHeight: '86vh',
    background: '#14120E',
    border: `1px solid ${BORDER}`,
    borderTop: `2px solid ${GOLD}`,
    boxShadow: '0 32px 96px rgba(0,0,0,0.6)',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  };
  const HEADER = {
    padding: '16px 20px',
    borderBottom: `1px solid ${BORDER}`,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  };
  const TAB_BAR = {
    display: 'flex',
    borderBottom: `1px solid ${BORDER}`,
    flexShrink: 0,
  };
  const TAB_BTN = (active) => ({
    flex: 1, background: active ? 'rgba(201,169,110,0.08)' : 'transparent',
    border: 'none', borderBottom: `2px solid ${active ? GOLD : 'transparent'}`,
    color: active ? GOLD : MUTED,
    fontFamily: NU, fontSize: 10, fontWeight: 700,
    letterSpacing: '0.12em', textTransform: 'uppercase',
    padding: '14px 0', cursor: 'pointer', transition: 'all 0.15s',
  });

  return (
    <div style={OVERLAY} onClick={onClose}>
      <div style={MODAL} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={HEADER}>
          <div>
            <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.3em', textTransform: 'uppercase' }}>
              Publication Studio
            </div>
            <div style={{ fontFamily: GD, fontSize: 22, fontStyle: 'italic', color: '#F0EBE0', marginTop: 2 }}>
              Choose an image
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: `1px solid ${BORDER}`,
              color: MUTED, padding: '6px 12px', cursor: 'pointer',
              fontFamily: NU, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
            }}
          >
            Close
          </button>
        </div>

        {/* Tabs */}
        <div style={TAB_BAR}>
          <button style={TAB_BTN(tab === 'upload')}     onClick={() => setTab('upload')}>Upload</button>
          <button style={TAB_BTN(tab === 'gallery')}    onClick={() => setTab('gallery')}>Gallery</button>
          <button style={TAB_BTN(tab === 'unsplash')}   onClick={() => setTab('unsplash')}>Unsplash</button>
          <button style={TAB_BTN(tab === 'ai-generate')} onClick={() => setTab('ai-generate')}>✦ AI Generate</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 24 }}>
          {tab === 'upload' && (
            <div>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `1px dashed ${dragOver ? GOLD : 'rgba(255,255,255,0.18)'}`,
                  background: dragOver ? 'rgba(201,169,110,0.06)' : 'rgba(255,255,255,0.02)',
                  padding: '64px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 36, color: GOLD, marginBottom: 12 }}>↑</div>
                <div style={{ fontFamily: GD, fontSize: 20, color: '#F0EBE0', fontStyle: 'italic', marginBottom: 8 }}>
                  {uploading ? 'Uploading…' : 'Drop an image here'}
                </div>
                <div style={{ fontFamily: NU, fontSize: 11, color: MUTED, letterSpacing: '0.08em' }}>
                  or click to browse · JPG, PNG, WebP
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={onFileChange}
              />
              {uploadError && (
                <div style={{ marginTop: 16, padding: 12, background: 'rgba(200,60,60,0.12)', border: '1px solid rgba(200,60,60,0.3)', color: '#F3C8C8', fontFamily: NU, fontSize: 11 }}>
                  {uploadError}
                </div>
              )}
            </div>
          )}

          {tab === 'gallery' && (
            <div>
              {galleryLoading && (
                <div style={{ fontFamily: NU, fontSize: 11, color: MUTED, textAlign: 'center', padding: 48 }}>
                  Loading gallery…
                </div>
              )}
              {galleryError && !galleryLoading && (
                <div style={{ fontFamily: NU, fontSize: 11, color: '#F3C8C8', textAlign: 'center', padding: 32 }}>
                  {galleryError}
                </div>
              )}
              {!galleryLoading && !galleryError && galleryItems.length === 0 && (
                <div style={{ fontFamily: GD, fontStyle: 'italic', fontSize: 16, color: MUTED, textAlign: 'center', padding: 48 }}>
                  No images yet — upload one first.
                </div>
              )}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
              }}>
                {galleryItems.map((item) => (
                  <button
                    key={item.url}
                    onClick={() => onSelect(item.url)}
                    style={{
                      background: '#1A1712',
                      border: `1px solid ${BORDER}`,
                      padding: 0,
                      cursor: 'pointer',
                      aspectRatio: '4 / 5',
                      overflow: 'hidden',
                      transition: 'border 0.15s, transform 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = GOLD;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = BORDER;
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <img
                      src={item.url}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Feature G: Unsplash Tab ──────────────────────────────────────────── */}
          {tab === 'unsplash' && (
            <div>
              {!UNSPLASH_KEY ? (
                <div style={{
                  padding: '32px 24px', textAlign: 'center',
                  fontFamily: NU, fontSize: 11, color: MUTED, lineHeight: 1.7,
                }}>
                  Add <code style={{ color: GOLD, background: 'rgba(201,169,110,0.08)', padding: '2px 6px', borderRadius: 3 }}>VITE_UNSPLASH_ACCESS_KEY</code> to your .env to enable Unsplash search.
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 18 }}>
                    <input
                      type="text"
                      placeholder="Search Unsplash — e.g. 'wedding flowers'"
                      value={unsplashQuery}
                      onChange={e => handleUnsplashQueryChange(e.target.value)}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: 'rgba(255,255,255,0.06)',
                        border: `1px solid ${BORDER}`,
                        borderRadius: 3, color: '#fff',
                        fontFamily: NU, fontSize: 12,
                        padding: '9px 12px', outline: 'none',
                      }}
                    />
                  </div>

                  {unsplashLoading && (
                    <div style={{ fontFamily: NU, fontSize: 11, color: MUTED, textAlign: 'center', padding: 32 }}>
                      Searching…
                    </div>
                  )}
                  {unsplashError && !unsplashLoading && (
                    <div style={{ fontFamily: NU, fontSize: 11, color: '#F3C8C8', textAlign: 'center', padding: 24 }}>
                      {unsplashError}
                    </div>
                  )}
                  {!unsplashLoading && !unsplashError && unsplashResults.length === 0 && unsplashQuery && (
                    <div style={{ fontFamily: GD, fontStyle: 'italic', fontSize: 16, color: MUTED, textAlign: 'center', padding: 40 }}>
                      No results for "{unsplashQuery}"
                    </div>
                  )}
                  {!unsplashLoading && !unsplashError && unsplashResults.length === 0 && !unsplashQuery && (
                    <div style={{ fontFamily: GD, fontStyle: 'italic', fontSize: 16, color: MUTED, textAlign: 'center', padding: 40 }}>
                      Type to search millions of photos
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {unsplashResults.map(photo => (
                      <div key={photo.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <button
                          onClick={() => onSelect(photo.urls.regular)}
                          style={{
                            background: '#1A1712',
                            border: `1px solid ${BORDER}`,
                            padding: 0,
                            cursor: 'pointer',
                            aspectRatio: '4 / 5',
                            overflow: 'hidden',
                            transition: 'border 0.15s, transform 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = GOLD;
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = BORDER;
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          <img
                            src={photo.urls.small}
                            alt={photo.alt_description || photo.id}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        </button>
                        <div style={{ fontFamily: NU, fontSize: 9, color: 'rgba(255,255,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {photo.user?.name || 'Unsplash'}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          {/* ── Feature 5: AI Generate Tab ──────────────────────────────────── */}
          {tab === 'ai-generate' && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <textarea
                  placeholder="Describe the image you want…"
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.06)',
                    border: `1px solid ${BORDER}`,
                    borderRadius: 3, color: '#fff',
                    fontFamily: NU, fontSize: 12,
                    padding: '9px 12px', outline: 'none', resize: 'vertical',
                  }}
                />
              </div>
              <div style={{ marginBottom: 16, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {AI_STYLES.map(s => (
                  <button
                    key={s}
                    onClick={() => setAiStyle(s)}
                    style={{
                      background: aiStyle === s ? 'rgba(201,169,110,0.2)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${aiStyle === s ? 'rgba(201,169,110,0.5)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: 3, color: aiStyle === s ? GOLD : MUTED,
                      fontFamily: NU, fontSize: 10, fontWeight: 700,
                      padding: '5px 12px', cursor: 'pointer',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button
                onClick={handleAIGenerate}
                disabled={aiGenerating || !aiPrompt.trim()}
                style={{
                  background: 'rgba(201,169,110,0.15)',
                  border: '1px solid rgba(201,169,110,0.4)',
                  borderRadius: 3, color: GOLD,
                  fontFamily: NU, fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  padding: '8px 20px', cursor: aiGenerating || !aiPrompt.trim() ? 'default' : 'pointer',
                  opacity: !aiPrompt.trim() ? 0.5 : 1,
                  marginBottom: 20,
                }}
              >
                {aiGenerating ? '⋯ Generating…' : '✦ Generate Image'}
              </button>

              {/* Loading shimmer */}
              {aiGenerating && (
                <div style={{
                  width: '100%', aspectRatio: '9 / 16', maxWidth: 320, margin: '0 auto',
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.4s infinite',
                  borderRadius: 4,
                }} />
              )}

              {/* Error */}
              {aiError && !aiGenerating && (
                <div style={{ padding: 14, background: 'rgba(200,60,60,0.1)', border: '1px solid rgba(200,60,60,0.25)', borderRadius: 4, fontFamily: NU, fontSize: 11, color: '#F3C8C8', lineHeight: 1.6 }}>
                  {aiError.includes('OPENAI_API_KEY') || aiError.includes('configured')
                    ? 'Add VITE_OPENAI_KEY or deploy ai-image-generate edge function to enable this feature.'
                    : aiError}
                </div>
              )}

              {/* Result */}
              {aiResult && !aiGenerating && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <img
                    src={aiResult}
                    alt="AI generated"
                    style={{ width: '100%', maxWidth: 360, borderRadius: 4, border: `1px solid ${BORDER}`, display: 'block' }}
                  />
                  <button
                    onClick={() => onSelect(aiResult)}
                    style={{
                      background: GOLD, border: 'none', borderRadius: 3,
                      color: '#1a1208', fontFamily: NU, fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      padding: '9px 28px', cursor: 'pointer',
                    }}
                  >
                    Insert Image →
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
