/**
 * MediaLibrary
 *
 * WordPress-style media picker for Magazine Studio.
 * Recursively loads images from Supabase storage (YYYY/MM/ subfolder structure).
 * Supports single-select and multi-select (for galleries).
 * Date dropdown filters by upload month.
 *
 * Props:
 *   open          — bool
 *   onClose       — () => void
 *   onSelect      — (imageObj) => void          single mode
 *   onSelectMany  — (imageObjs[]) => void        multi mode
 *   multiple      — bool
 *   preSelected   — string[]  URLs already in selection
 *   bucket        — string (default 'magazine')
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';

const DEFAULT_BUCKET = 'magazine';
const UNSPLASH_KEY = import.meta.env?.VITE_UNSPLASH_KEY || '';
const UNSPLASH_API = 'https://api.unsplash.com';
const GOLD = '#c9a96e';
const FU   = 'Futura,"Century Gothic",sans-serif';
const FD   = 'var(--font-display,Georgia,serif)';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtMonthYear(yyyy, mm) {
  const m = parseInt(mm, 10);
  return `${MONTH_NAMES[m - 1] || mm} ${yyyy}`;
}

const FOCAL_PRESETS = [
  { id: 'top left', l: 'TL' }, { id: 'top center', l: 'TC' }, { id: 'top right', l: 'TR' },
  { id: 'center left', l: 'ML' }, { id: 'center', l: 'C' }, { id: 'center right', l: 'MR' },
  { id: 'bottom left', l: 'BL' }, { id: 'bottom center', l: 'BC' }, { id: 'bottom right', l: 'BR' },
];

function fmt(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

// ── Recursive loader: traverses YYYY/MM/ subdirectories ───────────────────────
async function loadAllImages(bucket) {
  const IMG_RE = /\.(jpe?g|png|webp|gif)$/i;
  const b = supabase.storage.from(bucket);
  const results = [];

  async function listFolder(prefix) {
    const { data, error } = await b.list(prefix, {
      limit: 500, sortBy: { column: 'created_at', order: 'desc' },
    });
    if (error || !data) return;
    for (const item of data) {
      if (!item.name) continue;
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null || item.metadata === null) {
        // It's a folder — recurse one level
        await listFolder(fullPath);
      } else if (IMG_RE.test(item.name)) {
        // It's an image file
        const url = b.getPublicUrl(fullPath).data.publicUrl;
        const parts = fullPath.split('/');
        const yyyy  = parts.length >= 2 ? parts[parts.length - 3] || parts[0] : '';
        const mm    = parts.length >= 2 ? parts[parts.length - 2] || parts[1] : '';
        const yearMonth = (yyyy && mm && /^\d{4}$/.test(yyyy) && /^\d{2}$/.test(mm))
          ? `${yyyy}/${mm}` : '';
        results.push({
          path: fullPath,
          name: item.name,
          url,
          size: item.metadata?.size,
          yearMonth,
          dateLabel: yearMonth ? fmtMonthYear(yyyy, mm) : 'Other',
          alt: '', caption: '', credit: '', focal: 'center',
          title: item.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '),
        });
      }
    }
  }

  await listFolder('');
  // Sort newest first: yearMonth desc, then name desc
  results.sort((a, b) => {
    if (a.yearMonth > b.yearMonth) return -1;
    if (a.yearMonth < b.yearMonth) return 1;
    return b.name.localeCompare(a.name);
  });
  return results;
}

// ── Image compression ─────────────────────────────────────────────────────────
async function compressImage(file) {
  if (file.type === 'image/gif' || file.size < 120 * 1024) return file;
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 2400;
      let w = img.naturalWidth, h = img.naturalHeight;
      if (Math.max(w, h) > MAX) {
        if (w >= h) { h = Math.round(h * MAX / w); w = MAX; }
        else        { w = Math.round(w * MAX / h); h = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const q = file.size > 10 * 1048576 ? 0.82 : file.size > 3 * 1048576 ? 0.85 : 0.88;
      canvas.toBlob(blob => {
        if (!blob || blob.size >= file.size) { resolve(file); return; }
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }));
      }, 'image/webp', q);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

async function uploadFile(file, bucket) {
  const compressed = await compressImage(file);
  const ext  = compressed.type === 'image/webp' ? 'webp' : (file.name.split('.').pop()?.toLowerCase() || 'jpg');
  const now  = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const id   = `mag_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const path = `${yyyy}/${mm}/${id}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, compressed, {
    cacheControl: '31536000', upsert: false, contentType: compressed.type || 'image/webp',
  });
  if (error) throw new Error(error.message);
  const url = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  return { path, url, originalSize: file.size, compressedSize: compressed.size, yyyy, mm };
}

// ── Grid item ─────────────────────────────────────────────────────────────────
function LibItem({ item, selected, onClick, onDelete }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      style={{
        position: 'relative', borderRadius: 3, overflow: 'hidden', cursor: 'pointer',
        aspectRatio: '4/3', background: '#1a1714',
        outline: selected ? `2px solid ${GOLD}` : hover ? `1px solid rgba(201,168,76,0.4)` : 'none',
        outlineOffset: selected ? 2 : 1, transition: 'outline 0.12s',
      }}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <img src={item.url} alt={item.alt || ''} loading="lazy"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'opacity 0.2s', opacity: hover ? 0.85 : 1 }} />
      {selected && (
        <div style={{ position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 10, color: '#1a1714', fontWeight: 700 }}>✓</span>
        </div>
      )}
      {hover && !selected && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.18)', pointerEvents: 'none' }} />}
      {hover && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(item); }}
          title="Delete image"
          style={{
            position: 'absolute', top: 5, left: 5,
            width: 22, height: 22, borderRadius: 3,
            background: 'rgba(20,8,8,0.82)', border: '1px solid rgba(224,85,85,0.5)',
            color: '#e05555', fontSize: 11, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1, padding: 0, transition: 'background 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(224,85,85,0.25)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(20,8,8,0.82)'; }}
        >✕</button>
      )}
    </div>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────
function DetailPanel({ item, onChange, onDelete }) {
  if (!item) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(245,240,232,0.2)', fontFamily: FU, fontSize: 11, textAlign: 'center', padding: 20 }}>
      Select an image to edit details
    </div>
  );
  const inp = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(245,240,232,0.05)', border: '1px solid rgba(245,240,232,0.1)',
    color: '#f5f0e8', fontFamily: FU, fontSize: 11,
    padding: '7px 9px', borderRadius: 2, outline: 'none', marginTop: 4,
  };
  const lbl = { fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.4)', display: 'block', marginTop: 12 };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ flexShrink: 0, background: '#0a0a08', height: 180 }}>
        <img src={item.url} alt={item.alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: item.focal || 'center' }} />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {item.size && <div style={{ fontFamily: FU, fontSize: 9, color: 'rgba(245,240,232,0.3)', marginBottom: 4 }}>{item.name} · {fmt(item.size)}</div>}
        {item.dateLabel && <div style={{ fontFamily: FU, fontSize: 9, color: 'rgba(245,240,232,0.2)', marginBottom: 10 }}>{item.dateLabel}</div>}
        <span style={lbl}>Alt Text</span>
        <input value={item.alt || ''} onChange={e => onChange({ ...item, alt: e.target.value })} placeholder="Describe for accessibility" style={inp} />
        <span style={lbl}>Caption</span>
        <input value={item.caption || ''} onChange={e => onChange({ ...item, caption: e.target.value })} placeholder="Optional caption" style={inp} />
        <span style={lbl}>Credit / Copyright</span>
        <input value={item.credit || ''} onChange={e => onChange({ ...item, credit: e.target.value })} placeholder="© Photographer" style={inp} />
        <span style={lbl}>Focal Point</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, marginTop: 6, maxWidth: 120 }}>
          {FOCAL_PRESETS.map(fp => (
            <button key={fp.id} onClick={() => onChange({ ...item, focal: fp.id })} title={fp.id}
              style={{ fontFamily: FU, fontSize: 9, padding: '4px 0', borderRadius: 2, cursor: 'pointer', background: (item.focal || 'center') === fp.id ? `${GOLD}22` : 'transparent', border: `1px solid ${(item.focal || 'center') === fp.id ? GOLD : 'rgba(245,240,232,0.1)'}`, color: (item.focal || 'center') === fp.id ? GOLD : 'rgba(245,240,232,0.4)' }}>
              {fp.l}
            </button>
          ))}
        </div>
      </div>
      {/* Delete from storage */}
      <div style={{ flexShrink: 0, padding: '10px 16px', borderTop: '1px solid rgba(245,240,232,0.06)' }}>
        <button
          onClick={() => onDelete(item)}
          style={{
            width: '100%', fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', padding: '7px 0', borderRadius: 2, cursor: 'pointer',
            background: 'rgba(224,85,85,0.07)', border: '1px solid rgba(224,85,85,0.3)',
            color: '#e05555', transition: 'background 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(224,85,85,0.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(224,85,85,0.07)'; }}
        >✕ Delete Image</button>
      </div>
    </div>
  );
}

// ── Unsplash search panel ─────────────────────────────────────────────────────
async function searchUnsplash(query, page = 1) {
  const res = await fetch(`${UNSPLASH_API}/search/photos?query=${encodeURIComponent(query)}&per_page=30&page=${page}&orientation=landscape`, {
    headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
  });
  if (!res.ok) throw new Error(`Unsplash API error ${res.status}`);
  return res.json();
}

async function triggerUnsplashDownload(downloadLocation) {
  if (!UNSPLASH_KEY) return;
  // Required by Unsplash API guidelines when image is used
  fetch(`${downloadLocation}?client_id=${UNSPLASH_KEY}`).catch(() => {});
}

function UnsplashPanel({ onSelect, multiple, selected, onToggle }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);

  const doSearch = useCallback(async (q, pg = 1) => {
    if (!q.trim()) return;
    setLoading(true); setError('');
    try {
      const data = await searchUnsplash(q, pg);
      setResults(pg === 1 ? data.results : prev => [...prev, ...data.results]);
      setTotalPages(data.total_pages || 0);
      setPage(pg);
    } catch (e) {
      setError(e.message || 'Unsplash search failed');
    }
    setLoading(false);
  }, []);

  if (!UNSPLASH_KEY) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 28, opacity: 0.3 }}>✦</div>
      <div style={{ fontFamily: FU, fontSize: 12, color: 'rgba(245,240,232,0.6)' }}>Unsplash not configured</div>
      <div style={{ fontFamily: FU, fontSize: 10, color: 'rgba(245,240,232,0.35)', lineHeight: 1.6, maxWidth: 320 }}>
        Add <code style={{ background: 'rgba(245,240,232,0.06)', padding: '2px 6px', borderRadius: 2 }}>VITE_UNSPLASH_KEY=your_access_key</code> to your <code style={{ background: 'rgba(245,240,232,0.06)', padding: '2px 6px', borderRadius: 2 }}>.env</code> file, then restart the dev server.
      </div>
      <a href="https://unsplash.com/developers" target="_blank" rel="noopener noreferrer"
        style={{ fontFamily: FU, fontSize: 9, color: GOLD, letterSpacing: '0.08em' }}>Get a free API key →</a>
    </div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Search bar */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(245,240,232,0.06)', display: 'flex', gap: 8 }}>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') doSearch(query); }}
          placeholder="Search Unsplash — wedding, venue, floral…"
          style={{ flex: 1, background: 'rgba(245,240,232,0.06)', border: '1px solid rgba(245,240,232,0.12)', color: '#f5f0e8', fontFamily: FU, fontSize: 11, padding: '7px 10px', borderRadius: 2, outline: 'none' }}
        />
        <button onClick={() => doSearch(query)} disabled={!query.trim() || loading}
          style={{ fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', padding: '7px 16px', borderRadius: 2, cursor: query.trim() ? 'pointer' : 'not-allowed', background: GOLD, color: '#1a1714', border: 'none', opacity: loading ? 0.6 : 1 }}>
          {loading ? '…' : 'Search'}
        </button>
      </div>
      {/* Results */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {error && <div style={{ fontFamily: FU, fontSize: 11, color: '#e05555', marginBottom: 12 }}>{error}</div>}
        {!loading && results.length === 0 && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, color: 'rgba(245,240,232,0.25)', gap: 10 }}>
            <div style={{ fontSize: 28, opacity: 0.4 }}>◻</div>
            <div style={{ fontFamily: FU, fontSize: 11 }}>Search for luxury wedding imagery</div>
          </div>
        )}
        {results.length > 0 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8, marginBottom: 12 }}>
              {results.map(photo => {
                const isSelected = selected.some(s => s.url === photo.urls.regular);
                return (
                  <div key={photo.id}
                    onClick={() => {
                      const imgObj = {
                        url: photo.urls.regular,
                        src: photo.urls.regular,
                        name: photo.id,
                        title: photo.alt_description || photo.description || 'Unsplash photo',
                        alt: photo.alt_description || '',
                        credit: `Photo by ${photo.user.name} on Unsplash`,
                        focal: 'center',
                        _unsplashDownload: photo.links.download_location,
                      };
                      onToggle(imgObj);
                      triggerUnsplashDownload(photo.links.download_location);
                    }}
                    style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 3, overflow: 'hidden', cursor: 'pointer', background: '#1a1714', outline: isSelected ? `2px solid ${GOLD}` : 'none', outlineOffset: 2, transition: 'outline 0.12s' }}>
                    <img src={photo.urls.small} alt={photo.alt_description || ''} loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    {isSelected && (
                      <div style={{ position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 10, color: '#1a1714', fontWeight: 700 }}>✓</span>
                      </div>
                    )}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 6px 4px', background: 'linear-gradient(transparent,rgba(0,0,0,0.55))', fontFamily: FU, fontSize: 8, color: 'rgba(255,255,255,0.7)' }}>
                      {photo.user.name}
                    </div>
                  </div>
                );
              })}
            </div>
            {page < totalPages && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button onClick={() => doSearch(query, page + 1)} disabled={loading}
                  style={{ fontFamily: FU, fontSize: 9, color: GOLD, background: 'none', border: `1px solid ${GOLD}40`, borderRadius: 2, padding: '6px 20px', cursor: 'pointer' }}>
                  {loading ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
            <div style={{ fontFamily: FU, fontSize: 8, color: 'rgba(245,240,232,0.2)', textAlign: 'center', marginTop: 16 }}>
              Photos from <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(245,240,232,0.35)' }}>Unsplash</a> — free for editorial use
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MediaLibrary({ open, onClose, onSelect, onSelectMany, multiple = false, preSelected = [], bucket = DEFAULT_BUCKET, initialTab = 'library' }) {
  const [tab, setTab]           = useState(initialTab); // 'library' | 'unsplash' | 'upload'
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [selected, setSelected] = useState([]);
  const [activeItem, setActiveItem] = useState(null);
  const [search, setSearch]     = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'YYYY/MM'
  const [uploading, setUploading]  = useState(false);
  const [uploadProg, setUploadProg] = useState([]);
  const [uploadErr, setUploadErr]  = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  const loadLibrary = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const imgs = await loadAllImages(bucket);
      setItems(imgs);
    } catch (err) {
      setError('Could not load media library. Check Supabase storage permissions.');
    }
    setLoading(false);
  }, [bucket]);

  useEffect(() => {
    if (open) { loadLibrary(); setSelected([]); setActiveItem(null); setSearch(''); setDateFilter('all'); setTab(initialTab); }
  }, [open, loadLibrary, initialTab]);

  // Pre-seed selection
  useEffect(() => {
    if (open && preSelected.length && items.length) {
      const pre = items.filter(it => preSelected.includes(it.url));
      if (pre.length) { setSelected(pre); setActiveItem(pre[0]); }
    }
  }, [open, preSelected, items]);

  // Unique sorted date options from loaded images
  const dateOptions = (() => {
    const seen = new Set();
    const opts = [];
    for (const it of items) {
      if (it.yearMonth && !seen.has(it.yearMonth)) {
        seen.add(it.yearMonth);
        opts.push({ value: it.yearMonth, label: it.dateLabel });
      }
    }
    return opts;
  })();

  const filtered = items.filter(it => {
    if (dateFilter !== 'all' && it.yearMonth !== dateFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return it.name.toLowerCase().includes(q) || it.title.toLowerCase().includes(q);
    }
    return true;
  });

  const toggleSelect = (item) => {
    if (!multiple) {
      setSelected([item]); setActiveItem(item);
    } else {
      const idx = selected.findIndex(s => s.url === item.url);
      const next = idx !== -1 ? selected.filter((_, i) => i !== idx) : [...selected, item];
      setSelected(next);
      setActiveItem(next[next.length - 1] || null);
    }
  };

  const updateActiveItem = (updated) => {
    setActiveItem(updated);
    setItems(prev => prev.map(it => it.url === updated.url ? updated : it));
    setSelected(prev => prev.map(s => s.url === updated.url ? updated : s));
  };

  const handleInsert = () => {
    if (multiple && onSelectMany) onSelectMany(selected);
    else if (selected[0] && onSelect) onSelect(selected[0]);
    onClose();
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.storage.from(bucket).remove([item.path]);
    if (error) { alert('Delete failed: ' + error.message); return; }
    setItems(prev => prev.filter(i => i.url !== item.url));
    if (activeItem?.url === item.url) setActiveItem(null);
    setSelected(prev => prev.filter(s => s.url !== item.url));
  };

  const deleteSelected = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Delete ${selected.length} image${selected.length > 1 ? 's' : ''}? This cannot be undone.`)) return;
    const paths = selected.map(s => s.path);
    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) { alert('Bulk delete failed: ' + error.message); return; }
    const deletedUrls = new Set(selected.map(s => s.url));
    setItems(prev => prev.filter(i => !deletedUrls.has(i.url)));
    if (activeItem && deletedUrls.has(activeItem.url)) setActiveItem(null);
    setSelected([]);
  };

  const handleFileUpload = async (files) => {
    setUploading(true); setUploadErr('');
    setUploadProg(Array.from(files).map(f => ({ name: f.name, status: 'optimising' })));
    const results = [];
    for (const file of Array.from(files)) {
      try {
        setUploadProg(prev => prev.map(p => p.name === file.name ? { ...p, status: 'uploading' } : p));
        const { url, originalSize, compressedSize, yyyy, mm } = await uploadFile(file, bucket);
        const savings = originalSize && compressedSize && originalSize > compressedSize
          ? Math.round((1 - compressedSize / originalSize) * 100) : 0;
        const ym = `${yyyy}/${String(mm).padStart(2,'0')}`;
        const item = {
          path: `${ym}/...`, name: file.name, url, size: compressedSize || file.size,
          yearMonth: ym, dateLabel: fmtMonthYear(String(yyyy), String(mm).padStart(2,'0')),
          alt: '', caption: '', credit: '', focal: 'center',
          title: file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '),
        };
        results.push(item);
        setUploadProg(prev => prev.map(p => p.name === file.name ? { ...p, status: 'done', savings, originalSize, compressedSize } : p));
      } catch (err) {
        setUploadProg(prev => prev.map(p => p.name === file.name ? { ...p, status: 'error', msg: err.message } : p));
      }
    }
    if (results.length) {
      setItems(prev => [...results, ...prev]);
      setSelected(results);
      setActiveItem(results[0]);
      setTimeout(() => setTab('library'), 600);
    }
    setUploading(false);
  };

  if (!open) return null;

  const selBtn = {
    fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
    padding: '7px 22px', borderRadius: 2, cursor: selected.length ? 'pointer' : 'not-allowed',
    background: selected.length ? `linear-gradient(135deg,${GOLD},#b8891e)` : 'rgba(245,240,232,0.05)',
    border: `1px solid ${selected.length ? GOLD : 'rgba(245,240,232,0.1)'}`,
    color: selected.length ? '#1a1714' : 'rgba(245,240,232,0.2)',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: '92vw', maxWidth: 1100, height: '88vh', maxHeight: 760, background: '#141412', border: '1px solid rgba(245,240,232,0.1)', borderRadius: 6, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>

        {/* Header */}
        <div style={{ height: 48, flexShrink: 0, borderBottom: '1px solid rgba(245,240,232,0.07)', display: 'flex', alignItems: 'center', padding: '0 18px', gap: 12, flexWrap: 'nowrap', overflow: 'hidden' }}>
          <span style={{ fontFamily: FD, fontSize: 15, color: '#f5f0e8', fontWeight: 400, flexShrink: 0 }}>Media Library</span>
          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
            {[
              { id: 'library',  label: items.length ? `Library (${items.length})` : 'Library' },
              { id: 'unsplash', label: '✦ Unsplash' },
              { id: 'upload',   label: 'Upload' },
            ].map(({ id, label }) => (
              <button key={id} onClick={() => setTab(id)}
                style={{ fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: 2, cursor: 'pointer', background: tab === id ? `${GOLD}18` : 'none', border: `1px solid ${tab === id ? GOLD : 'rgba(245,240,232,0.1)'}`, color: tab === id ? GOLD : 'rgba(245,240,232,0.45)' }}>
                {label}
              </button>
            ))}
          </div>

          {tab === 'library' && (
            <>
              {/* Date dropdown */}
              {dateOptions.length > 0 && tab === 'library' && (
                <select
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  style={{ fontFamily: FU, fontSize: 9, background: 'rgba(245,240,232,0.06)', border: '1px solid rgba(245,240,232,0.12)', color: dateFilter !== 'all' ? GOLD : 'rgba(245,240,232,0.55)', borderRadius: 2, padding: '4px 8px', cursor: 'pointer', outline: 'none', flexShrink: 0 }}
                >
                  <option value="all">All dates</option>
                  {dateOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              )}
              {/* Search */}
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by filename…"
                style={{ marginLeft: 'auto', width: 180, background: 'rgba(245,240,232,0.05)', border: '1px solid rgba(245,240,232,0.1)', color: '#f5f0e8', fontFamily: FU, fontSize: 11, padding: '5px 10px', borderRadius: 2, outline: 'none', flexShrink: 0 }} />
            </>
          )}
          {tab !== 'library' && tab !== 'unsplash' && <div style={{ flex: 1 }} />}

          <button onClick={onClose}
            style={{ background: 'none', border: '1px solid rgba(245,240,232,0.1)', color: 'rgba(245,240,232,0.45)', fontSize: 14, width: 28, height: 28, borderRadius: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

          {tab === 'library' && (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                {loading && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
                    <div style={{ fontFamily: FU, fontSize: 11, color: GOLD }}>Loading…</div>
                    <div style={{ fontFamily: FU, fontSize: 9, color: 'rgba(245,240,232,0.3)' }}>Scanning {bucket} bucket…</div>
                  </div>
                )}
                {!loading && error && (
                  <div style={{ padding: 24 }}>
                    <div style={{ fontFamily: FU, fontSize: 11, color: '#e05555', marginBottom: 12 }}>{error}</div>
                    <button onClick={loadLibrary} style={{ fontFamily: FU, fontSize: 9, color: GOLD, background: 'none', border: `1px solid ${GOLD}40`, borderRadius: 2, padding: '5px 12px', cursor: 'pointer' }}>Retry</button>
                  </div>
                )}
                {!loading && !error && filtered.length === 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, color: 'rgba(245,240,232,0.25)' }}>
                    <div style={{ fontSize: 32 }}>◻</div>
                    <div style={{ fontFamily: FU, fontSize: 11 }}>
                      {search ? 'No images match that search' : dateFilter !== 'all' ? 'No images in that month' : 'No images yet — upload some!'}
                    </div>
                    {!search && dateFilter === 'all' && (
                      <button onClick={() => setTab('upload')} style={{ fontFamily: FU, fontSize: 9, color: GOLD, background: 'none', border: `1px solid ${GOLD}40`, borderRadius: 2, padding: '5px 12px', cursor: 'pointer' }}>Upload Images</button>
                    )}
                    {dateFilter !== 'all' && (
                      <button onClick={() => setDateFilter('all')} style={{ fontFamily: FU, fontSize: 9, color: 'rgba(245,240,232,0.4)', background: 'none', border: '1px solid rgba(245,240,232,0.1)', borderRadius: 2, padding: '5px 12px', cursor: 'pointer' }}>Show all dates</button>
                    )}
                  </div>
                )}
                {!loading && !error && filtered.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                    {filtered.map(item => (
                      <LibItem key={item.url} item={item} selected={selected.some(s => s.url === item.url)} onClick={() => toggleSelect(item)} onDelete={deleteItem} />
                    ))}
                  </div>
                )}
              </div>
              <div style={{ width: 260, flexShrink: 0, borderLeft: '1px solid rgba(245,240,232,0.07)', background: '#0f0f0d', display: 'flex', flexDirection: 'column' }}>
                <DetailPanel item={activeItem} onChange={updateActiveItem} onDelete={deleteItem} />
              </div>
            </>
          )}

          {tab === 'unsplash' && (
            <UnsplashPanel
              selected={selected}
              multiple={multiple}
              onSelect={img => { if (!multiple) { setSelected([img]); setActiveItem(img); } }}
              onToggle={img => {
                if (!multiple) { setSelected([img]); setActiveItem(img); return; }
                const idx = selected.findIndex(s => s.url === img.url);
                const next = idx !== -1 ? selected.filter((_, i) => i !== idx) : [...selected, img];
                setSelected(next); setActiveItem(next[next.length - 1] || null);
              }}
            />
          )}

          {tab === 'upload' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 20 }}>
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) handleFileUpload(e.dataTransfer.files); }}
                onClick={() => fileRef.current?.click()}
                style={{ width: '100%', maxWidth: 480, padding: '60px 40px', borderRadius: 6, cursor: 'pointer', textAlign: 'center', border: `2px dashed ${dragging ? GOLD : 'rgba(245,240,232,0.15)'}`, background: dragging ? `${GOLD}06` : 'rgba(245,240,232,0.02)', transition: 'border-color 0.15s, background 0.15s' }}
              >
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files; if (f?.length) { handleFileUpload(f); e.target.value = ''; } }} />
                {uploading ? (
                  <div style={{ fontFamily: FU, fontSize: 13, color: GOLD }}>Uploading…</div>
                ) : (
                  <>
                    <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>⬆</div>
                    <div style={{ fontFamily: FD, fontSize: 18, color: '#f5f0e8', marginBottom: 8 }}>Drop images here</div>
                    <div style={{ fontFamily: FU, fontSize: 11, color: 'rgba(245,240,232,0.4)' }}>or click to browse — JPG, PNG, WebP, GIF</div>
                  </>
                )}
              </div>
              {uploadProg.length > 0 && (
                <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {uploadProg.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: FU, fontSize: 10 }}>
                      <span style={{ color: p.status === 'done' ? '#5a9' : p.status === 'error' ? '#e05555' : GOLD, fontSize: 12, width: 14, textAlign: 'center' }}>
                        {p.status === 'done' ? '✓' : p.status === 'error' ? '✕' : p.status === 'optimising' ? '⚙' : '⬆'}
                      </span>
                      <span style={{ color: 'rgba(245,240,232,0.6)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                      <span style={{ color: 'rgba(245,240,232,0.35)', flexShrink: 0, fontSize: 9 }}>
                        {p.status === 'optimising' && 'Optimising…'}
                        {p.status === 'uploading'  && 'Uploading…'}
                        {p.status === 'done' && p.savings > 0 && `−${p.savings}%`}
                      </span>
                      {p.msg && <span style={{ color: '#e05555', fontSize: 9 }}>{p.msg}</span>}
                    </div>
                  ))}
                </div>
              )}
              {uploadErr && <div style={{ fontFamily: FU, fontSize: 11, color: '#e05555' }}>{uploadErr}</div>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ height: 52, flexShrink: 0, borderTop: '1px solid rgba(245,240,232,0.07)', display: 'flex', alignItems: 'center', padding: '0 18px', gap: 10 }}>
          {selected.length > 0 && (
            <span style={{ fontFamily: FU, fontSize: 9, color: 'rgba(245,240,232,0.4)', letterSpacing: '0.1em' }}>
              {selected.length} selected
            </span>
          )}
          {selected.length > 0 && tab === 'library' && (
            <button
              onClick={deleteSelected}
              style={{
                fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '5px 12px', borderRadius: 2, cursor: 'pointer',
                background: 'rgba(224,85,85,0.07)', border: '1px solid rgba(224,85,85,0.3)',
                color: '#e05555', transition: 'background 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(224,85,85,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(224,85,85,0.07)'; }}
            >✕ Delete {selected.length > 1 ? `${selected.length} Images` : 'Image'}</button>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={onClose}
            style={{ fontFamily: FU, fontSize: 9, letterSpacing: '0.1em', padding: '7px 18px', borderRadius: 2, cursor: 'pointer', background: 'none', border: '1px solid rgba(245,240,232,0.15)', color: 'rgba(245,240,232,0.5)' }}>
            Cancel
          </button>
          <button onClick={handleInsert} disabled={selected.length === 0} style={selBtn}>
            {multiple ? `Insert ${selected.length > 0 ? `${selected.length} ` : ''}Image${selected.length !== 1 ? 's' : ''}` : 'Insert Image'}
          </button>
        </div>
      </div>
    </div>
  );
}
