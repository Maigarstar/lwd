import { useState, useRef, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';

/**
 * AIImportPanel — "Populate with AI" panel for Listing Studio
 *
 * Accepts source materials:
 *   • PDF brochures / media packs  → Claude native document processing
 *   • Images (JPG, PNG, WEBP)      → Claude vision
 *   • Text files (TXT, MD, CSV)    → extracted client-side, injected as text
 *   • Pasted web copy / text       → injected as text
 *   • Video URLs (YouTube, Vimeo)  → stored in media_items + used as context
 *
 * Two-step AI approach (single Claude call):
 *   Step 1 — Extract: pull real facts from source materials
 *   Step 2 — Write: produce polished luxury editorial copy
 *
 * UX: Upload → Extract & Write → Review by section → Apply to listing
 */

// ─── Types and constants ──────────────────────────────────────────────────────

const MAX_FILE_MB = 4;
const MAX_FILES   = 6;

const MIME_MAP = {
  'application/pdf': 'pdf',
  'text/plain': 'text', 'text/markdown': 'text', 'text/csv': 'text', 'text/html': 'text',
  'image/jpeg': 'image', 'image/png': 'image', 'image/webp': 'image', 'image/gif': 'image',
};

const EXT_MAP = {
  '.pdf': 'pdf',
  '.txt': 'text', '.md': 'text', '.csv': 'text', '.html': 'text',
  '.jpg': 'image', '.jpeg': 'image', '.png': 'image', '.webp': 'image', '.gif': 'image',
};

const FILE_ICONS  = { pdf: '📑', text: '📄', image: '🖼', unknown: '📎' };
const FILE_LABELS = { pdf: 'PDF', text: 'Text', image: 'Image' };

// Sections shown on the review screen
const REVIEW_SECTIONS = [
  {
    id: 'core',
    label: 'Core Details',
    icon: '🏛',
    fields: ['venue_name', 'city', 'region', 'country', 'capacity', 'price_range'],
    preview: (r) => [r.venue_name, [r.city, r.region, r.country].filter(Boolean).join(', '), r.capacity && `${r.capacity} guests`, r.price_range].filter(Boolean).join(' · '),
  },
  {
    id: 'description',
    label: 'Description',
    icon: '✍',
    fields: ['summary', 'description'],
    preview: (r) => r.summary || '',
  },
  {
    id: 'amenities',
    label: 'Amenities',
    icon: '✓',
    fields: ['amenities'],
    preview: (r) => r.amenities ? r.amenities.split(',').slice(0, 4).join(', ') + (r.amenities.split(',').length > 4 ? '…' : '') : '',
  },
  {
    id: 'spaces',
    label: 'Spaces',
    icon: '🚪',
    fields: ['spaces'],
    isArray: true,
    preview: (r) => r.spaces?.length ? r.spaces.map(s => s.name).filter(Boolean).slice(0, 3).join(', ') : '',
    count: (r) => r.spaces?.length || 0,
  },
  {
    id: 'rooms',
    label: 'Rooms & Accommodation',
    icon: '🛏',
    fields: ['rooms_total', 'rooms_suites', 'rooms_max_guests', 'rooms_description'],
    preview: (r) => [r.rooms_total && `${r.rooms_total} rooms`, r.rooms_suites && `${r.rooms_suites} suites`, r.rooms_max_guests && `sleeps ${r.rooms_max_guests}`].filter(Boolean).join(' · '),
  },
  {
    id: 'dining',
    label: 'Dining',
    icon: '🍽',
    fields: ['dining_style', 'dining_chef_name', 'dining_in_house', 'dining_description'],
    preview: (r) => [r.dining_style, r.dining_chef_name && `Chef ${r.dining_chef_name}`].filter(Boolean).join(' · '),
  },
  {
    id: 'exclusive_use',
    label: 'Exclusive Use',
    icon: '🔑',
    fields: ['exclusive_use_enabled', 'exclusive_use_title', 'exclusive_use_price', 'exclusive_use_subline', 'exclusive_use_description', 'exclusive_use_includes'],
    gated: (r) => r.exclusive_use_enabled,
    preview: (r) => [r.exclusive_use_price, r.exclusive_use_subline].filter(Boolean).join(' · '),
  },
  {
    id: 'faq',
    label: 'FAQ',
    icon: '💬',
    fields: ['faq_enabled', 'faq_categories'],
    isArray: true,
    gated: (r) => r.faq_enabled,
    preview: (r) => r.faq_categories?.map(c => c.category).filter(Boolean).slice(0, 3).join(', ') || '',
    count: (r) => r.faq_categories?.reduce((n, c) => n + (c.questions?.length || 0), 0) || 0,
  },
  {
    id: 'seo',
    label: 'SEO',
    icon: '🔍',
    fields: ['seo_title', 'seo_description', 'seo_keywords'],
    preview: (r) => r.seo_title || '',
  },
  {
    id: 'contact_location',
    label: 'Contact & Location Details',
    icon: '📍',
    fields: ['address', 'postcode', 'contact_profile'],
    preview: (r) => [
      r.contact_profile?.name,
      r.address,
      r.contact_profile?.email || r.contact_profile?.phone,
    ].filter(Boolean).join(' · '),
  },
  {
    id: 'nearby',
    label: 'Nearby Experiences',
    icon: '📍',
    fields: ['nearby_enabled', 'nearby_items'],
    isArray: true,
    gated: (r) => r.nearby_enabled,
    preview: (r) => r.nearby_items?.map(i => i.title).filter(Boolean).slice(0, 3).join(', ') || '',
    count: (r) => r.nearby_items?.length || 0,
  },
  {
    id: 'videos',
    label: 'Videos',
    icon: '🎬',
    fields: ['video_urls'],
    isArray: true,
    preview: (r) => r.video_urls?.slice(0, 2).join(', ') || '',
    count: (r) => r.video_urls?.length || 0,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFileType(file) {
  const byMime = MIME_MAP[file.type];
  if (byMime) return byMime;
  const ext = ('.' + file.name.split('.').pop()).toLowerCase();
  return EXT_MAP[ext] || null;
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function addId(prefix, obj, idx) {
  return { id: `${prefix}-${Date.now()}-${idx}`, sortOrder: idx, ...obj };
}

// Checks if a section has any meaningful content in the AI result
function sectionHasContent(section, result) {
  if (!result) return false;
  if (section.gated && !section.gated(result)) return false;
  return section.fields.some(f => {
    const v = result[f];
    if (v === null || v === undefined || v === '' || v === false) return false;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FileRow({ file, onRemove }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 10px', marginBottom: 4,
      backgroundColor: '#f5f3f0', borderRadius: 4,
      border: '1px solid #e5ddd0',
    }}>
      <span style={{ fontSize: 15, flexShrink: 0 }}>{FILE_ICONS[file.type] || FILE_ICONS.unknown}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {file.name}
        </p>
        <p style={{ margin: 0, fontSize: 10, color: '#aaa' }}>
          {FILE_LABELS[file.type] || 'File'} · {formatSize(file.size)}
          {file.type === 'text' && file.extractedText ? ` · ${file.extractedText.length.toLocaleString()} chars` : ''}
        </p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: 14, padding: '2px 4px', flexShrink: 0, lineHeight: 1 }}
        title="Remove"
      >
        ✕
      </button>
    </div>
  );
}

function ReviewSection({ section, result, enabled, onToggle }) {
  const hasContent = sectionHasContent(section, result);
  if (!hasContent) return null;

  const previewText  = section.preview(result);
  const count        = section.count ? section.count(result) : null;

  return (
    <div style={{
      borderRadius: 6,
      border: `1px solid ${enabled ? '#C9A84C' : '#e5ddd0'}`,
      marginBottom: 8,
      overflow: 'hidden',
      opacity: enabled ? 1 : 0.5,
      transition: 'all 0.15s ease',
    }}>
      <div
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px',
          backgroundColor: enabled ? 'rgba(201,168,76,0.06)' : '#fafaf8',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <span style={{ fontSize: 16, flexShrink: 0 }}>{section.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#222' }}>{section.label}</span>
            {count !== null && count > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10,
                backgroundColor: enabled ? '#C9A84C' : '#ccc', color: '#fff',
              }}>
                {count}
              </span>
            )}
          </div>
          {previewText && (
            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {previewText}
            </p>
          )}
        </div>
        <div style={{
          width: 18, height: 18, borderRadius: 3, flexShrink: 0,
          border: `2px solid ${enabled ? '#C9A84C' : '#ccc'}`,
          backgroundColor: enabled ? '#C9A84C' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {enabled && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
        </div>
      </div>
    </div>
  );
}

function SourceToggle({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ accentColor: '#C9A84C', width: 14, height: 14, flexShrink: 0 }}
      />
      <span style={{ fontSize: 12, color: checked ? '#333' : '#aaa', fontWeight: checked ? 600 : 400 }}>{label}</span>
    </label>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const AIImportPanel = ({ formData = {}, onChange, listingId = null, onClose }) => {
  // Input state
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [pastedText,    setPastedText]    = useState('');
  const [websiteUrl,    setWebsiteUrl]    = useState('');
  const [videoLinks,    setVideoLinks]    = useState('');
  const [isDragging,    setIsDragging]    = useState(false);
  const [sourceToggles, setSourceToggles] = useState({ files: true, paste: true, website: true, videos: true });
  const fileInputRef = useRef(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [error,        setError]        = useState(null);

  // Review state
  const [result,          setResult]          = useState(null);
  const [enabledSections, setEnabledSections] = useState({});
  const [applied,         setApplied]         = useState(false);

  const venueName = formData.venue_name || '';
  const listingType = formData.listing_type || 'venue';

  const activeVideoLinks = videoLinks.split(/[\n,]+/).filter(l => l.trim().startsWith('http'));
  const canProcess = (sourceToggles.files && uploadedFiles.length > 0)
    || (sourceToggles.paste && !!pastedText.trim())
    || (sourceToggles.website && !!websiteUrl.trim())
    || (sourceToggles.videos && activeVideoLinks.length > 0)
    || !!venueName;

  // ── File processing ────────────────────────────────────────────────────────
  const processFile = useCallback(async (file) => {
    const fileType = getFileType(file);

    if (!fileType) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (['.doc', '.docx'].includes(ext)) {
        return { error: `Word documents (.docx) — please export to PDF or paste the text content instead.` };
      }
      return { error: `${file.name}: unsupported format. Use PDF, images, or text files.` };
    }

    if (file.size > MAX_FILE_MB * 1048576) {
      return { error: `${file.name} is ${formatSize(file.size)} — max ${MAX_FILE_MB}MB per file.` };
    }

    return new Promise((resolve) => {
      const reader = new FileReader();

      if (fileType === 'text') {
        reader.onload = (e) => resolve({
          id: `${file.name}-${Date.now()}`,
          name: file.name,
          type: 'text',
          mediaType: file.type || 'text/plain',
          size: file.size,
          extractedText: e.target.result,
          data: null,
        });
        reader.readAsText(file);
      } else {
        reader.onload = (e) => {
          resolve({
            id: `${file.name}-${Date.now()}`,
            name: file.name,
            type: fileType,
            mediaType: file.type || (fileType === 'pdf' ? 'application/pdf' : 'image/jpeg'),
            size: file.size,
            data: e.target.result.split(',')[1],
            extractedText: null,
          });
        };
        reader.readAsDataURL(file);
      }
    });
  }, []);

  const handleFiles = useCallback(async (fileList) => {
    setError(null);
    const current = uploadedFiles.length;
    const incoming = Array.from(fileList);

    if (current + incoming.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files per import. Remove some files first.`);
      return;
    }

    const results = await Promise.all(incoming.map(processFile));
    const errors  = results.filter(r => r?.error);
    const valid   = results.filter(r => !r?.error && r?.name);

    if (errors.length > 0) setError(errors.map(e => e.error).join('\n'));

    setUploadedFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...valid.filter(f => !existing.has(f.name))];
    });
  }, [uploadedFiles.length, processFile]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removeFile = (id) => setUploadedFiles(prev => prev.filter(f => f.id !== id));

  // ── Process ────────────────────────────────────────────────────────────────
  const handleProcess = async () => {
    setIsProcessing(true);
    setError(null);
    setResult(null);
    setApplied(false);

    // Apply source toggles
    const activeFiles = sourceToggles.files ? uploadedFiles : [];
    const activePaste = sourceToggles.paste ? pastedText.trim() : '';
    const activeWebsite = sourceToggles.website ? websiteUrl.trim() : '';
    const activeVideoLinks = sourceToggles.videos
      ? videoLinks.split(/[\n,]+/).map(l => l.trim()).filter(l => l.startsWith('http'))
      : [];

    // Build files payload
    const filesPayload = activeFiles.map(f => ({
      name: f.name,
      type: f.type,
      mediaType: f.mediaType,
      ...(f.data          ? { data: f.data }                    : {}),
      ...(f.extractedText ? { extractedText: f.extractedText } : {}),
    }));

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-extract-listing', {
        body: {
          venueName:   venueName       || undefined,
          listingType: listingType     || undefined,
          pastedText:  activePaste     || undefined,
          websiteUrl:  activeWebsite   || undefined,
          videoLinks:  activeVideoLinks.length ? activeVideoLinks : undefined,
          files:       filesPayload.length     ? filesPayload     : undefined,
          venue_id:    listingId               || undefined,
        },
      });

      if (fnError) throw new Error(fnError.message || 'Edge Function error');
      if (data?.error) throw new Error(data.error);
      if (!data?.result) throw new Error('No data returned from AI');

      const aiResult = data.result;
      setResult(aiResult);

      // Auto-enable all sections that have content
      const initial = {};
      for (const s of REVIEW_SECTIONS) {
        initial[s.id] = sectionHasContent(s, aiResult);
      }
      setEnabledSections(initial);

    } catch (err) {
      console.error('AI import error:', err);
      setError(err.message || 'Processing failed. Check your AI settings and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Apply ──────────────────────────────────────────────────────────────────
  const handleApply = () => {
    if (!result) return;

    const r = result;
    const enabled = enabledSections;

    // Core details
    if (enabled.core) {
      if (r.venue_name) onChange('venue_name', r.venue_name);
      if (r.city)       onChange('city', r.city);
      if (r.region)     onChange('region', r.region);
      if (r.country)    onChange('country', r.country);
      if (r.capacity)   onChange('capacity', String(r.capacity));
      if (r.price_range) onChange('price_range', r.price_range);
    }

    // Description
    if (enabled.description) {
      if (r.summary)     onChange('summary', r.summary);
      if (r.description) onChange('description', r.description);
    }

    // Amenities
    if (enabled.amenities && r.amenities) {
      onChange('amenities', r.amenities);
    }

    // Spaces
    if (enabled.spaces && r.spaces?.length) {
      onChange('spaces', r.spaces.map((s, i) => ({
        id: `space-${Date.now()}-${i}`,
        name:              s.name               || '',
        type:              s.type               || 'other',
        description:       s.description        || '',
        capacityCeremony:  s.capacityCeremony   ?? null,
        capacityReception: s.capacityReception  ?? null,
        capacityDining:    s.capacityDining     ?? null,
        capacityStanding:  s.capacityStanding   ?? null,
        indoor:            s.indoor             ?? null,
        covered:           s.covered            ?? null,
        accessible:        null,
        img:               '',
        imgFile:           null,
        floorPlanFile:     null,
        floorPlanUrl:      '',
        sortOrder:         i,
      })));
    }

    // Rooms
    if (enabled.rooms) {
      if (r.rooms_total)       onChange('rooms_total',       String(r.rooms_total));
      if (r.rooms_suites)      onChange('rooms_suites',      String(r.rooms_suites));
      if (r.rooms_max_guests)  onChange('rooms_max_guests',  String(r.rooms_max_guests));
      if (r.rooms_description) onChange('rooms_description', r.rooms_description);
    }

    // Dining
    if (enabled.dining) {
      if (r.dining_style)       onChange('dining_style',       r.dining_style);
      if (r.dining_chef_name)   onChange('dining_chef_name',   r.dining_chef_name);
      if (r.dining_in_house)    onChange('dining_in_house',    r.dining_in_house);
      if (r.dining_description) onChange('dining_description', r.dining_description);
    }

    // Exclusive Use
    if (enabled.exclusive_use && r.exclusive_use_enabled) {
      onChange('exclusive_use_enabled',     true);
      if (r.exclusive_use_title)       onChange('exclusive_use_title',       r.exclusive_use_title);
      if (r.exclusive_use_price)       onChange('exclusive_use_price',       r.exclusive_use_price);
      if (r.exclusive_use_subline)     onChange('exclusive_use_subline',     r.exclusive_use_subline);
      if (r.exclusive_use_description) onChange('exclusive_use_description', r.exclusive_use_description);
      if (r.exclusive_use_includes?.length) onChange('exclusive_use_includes', r.exclusive_use_includes);
    }

    // FAQ
    if (enabled.faq && r.faq_enabled && r.faq_categories?.length) {
      onChange('faq_enabled', true);
      onChange('faq_categories', r.faq_categories.map((cat, ci) => ({
        id:        `cat-${Date.now()}-${ci}`,
        icon:      ['I', 'II', 'III', 'IV'][ci] || 'I',
        category:  cat.category || '',
        sortOrder: ci,
        questions: (cat.questions || []).map((q, qi) => ({
          id:        `q-${Date.now()}-${ci}-${qi}`,
          q:         q.q || '',
          a:         q.a || '',
          sortOrder: qi,
        })),
      })));
    }

    // SEO
    if (enabled.seo) {
      if (r.seo_title)       onChange('seo_title',       r.seo_title);
      if (r.seo_description) onChange('seo_description', r.seo_description);
      if (r.seo_keywords?.length) onChange('seo_keywords', r.seo_keywords);
    }

    // Contact & Location Details
    if (enabled.contact_location) {
      if (r.address)       onChange('address',       r.address);
      if (r.address_line2) onChange('address_line2', r.address_line2);
      if (r.postcode)      onChange('postcode',      r.postcode);
      // City/region/country — only overwrite if core section not enabled (avoid double-write)
      if (!enabled.core) {
        if (r.city)    onChange('city',    r.city);
        if (r.region)  onChange('region',  r.region);
        if (r.country) onChange('country', r.country);
      }
      if (r.contact_profile) {
        const existing = formData.contact_profile || {};
        onChange('contact_profile', { ...existing, ...r.contact_profile });
      }
    }

    // Nearby
    if (enabled.nearby && r.nearby_enabled && r.nearby_items?.length) {
      onChange('nearby_enabled', true);
      onChange('nearby_items', r.nearby_items.map((item, i) => ({
        id:        `exp-${Date.now()}-${i}`,
        icon:      item.icon   || 'nature',
        title:     item.title  || '',
        status:    item.status || '',
        note:      item.note   || '',
        sortOrder: i,
      })));
    }

    // Videos → media_items
    if (enabled.videos && r.video_urls?.length) {
      const videoItems = r.video_urls.map((url, i) => ({
        id: `video-import-${Date.now()}-${i}`,
        type: 'video',
        source_type: url.includes('youtube') ? 'youtube' : url.includes('vimeo') ? 'vimeo' : 'external',
        url,
        title:             '',
        caption:           '',
        description:       '',
        credit_name:       '',
        credit_instagram:  '',
        credit_website:    '',
        location:          '',
        tags:              [],
        sort_order:        (formData.media_items?.length || 0) + i,
        is_featured:       false,
      }));
      onChange('media_items', [...(formData.media_items || []), ...videoItems]);
    }

    setApplied(true);
    setTimeout(() => onClose(enabledCount), 900);
  };

  // ── Count enabled sections with content ────────────────────────────────────
  const enabledCount = REVIEW_SECTIONS.filter(s =>
    enabledSections[s.id] && sectionHasContent(s, result)
  ).length;

  const totalSourceCount =
    (sourceToggles.files    ? uploadedFiles.length : 0)
    + (sourceToggles.paste  && pastedText.trim()    ? 1 : 0)
    + (sourceToggles.website && websiteUrl.trim()   ? 1 : 0)
    + (sourceToggles.videos ? activeVideoLinks.length : 0);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.55)',
          zIndex: 900, backdropFilter: 'blur(2px)',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0,
        width: 520,
        backgroundColor: '#fff',
        boxShadow: '-6px 0 40px rgba(0,0,0,0.2)',
        zIndex: 901,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e5ddd0',
          backgroundColor: '#0a0a0a',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
              📂 Populate with AI
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#888' }}>
              {result
                ? 'Review extracted content — toggle sections to include'
                : 'Upload source materials and AI will populate your listing'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#777', fontSize: 20, cursor: 'pointer', padding: '4px 6px', lineHeight: 1, marginTop: -2 }}
          >
            ✕
          </button>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {!result ? (
            /* ─── UPLOAD SCREEN ─── */
            <>
              {/* File drop zone */}
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: 10 }}>
                Upload Files
              </p>

              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging ? '#C9A84C' : '#ddd4c8'}`,
                  borderRadius: 6,
                  padding: '22px 16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: isDragging ? 'rgba(201,168,76,0.05)' : '#fafaf8',
                  transition: 'all 0.15s ease',
                  marginBottom: 8,
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 6 }}>📎</div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#444' }}>
                  Drop files here or click to browse
                </p>
                <p style={{ margin: '6px 0 0', fontSize: 11, color: '#bbb', lineHeight: 1.5 }}>
                  PDF brochures · Images (JPG, PNG, WEBP) · Text files (TXT, MD)
                  <br />
                  Max {MAX_FILE_MB}MB per file · Up to {MAX_FILES} files
                </p>
                <p style={{ margin: '6px 0 0', fontSize: 10, color: '#ccc' }}>
                  Word docs (.docx): export to PDF first, or paste the text below
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.txt,.md,.csv,.html,.jpg,.jpeg,.png,.webp,.gif"
                onChange={(e) => handleFiles(e.target.files)}
                style={{ display: 'none' }}
              />

              {/* Uploaded files list */}
              {uploadedFiles.length > 0 && (
                <div style={{ marginTop: 8, marginBottom: 4 }}>
                  {uploadedFiles.map(f => (
                    <FileRow key={f.id} file={f} onRemove={() => removeFile(f.id)} />
                  ))}
                </div>
              )}

              {/* Paste text */}
              <div style={{ marginTop: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: 8 }}>
                  Paste Text
                  <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 6, color: '#bbb' }}>
                    — web copy, descriptions, any text
                  </span>
                </p>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste venue descriptions, web copy, Word document text, or any other source material here…"
                  rows={5}
                  style={{
                    width: '100%', fontSize: 12, padding: '10px 12px',
                    border: '1px solid #ddd4c8', borderRadius: 4,
                    resize: 'vertical', color: '#333', lineHeight: 1.6,
                    fontFamily: 'inherit', backgroundColor: '#fff',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Website URL */}
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: 8 }}>
                  Website URL
                  <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 6, color: '#bbb' }}>
                    — optional, AI will fetch and read the page
                  </span>
                </p>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://www.venuewebsite.com"
                  style={{
                    width: '100%', fontSize: 12, padding: '9px 12px',
                    border: '1px solid #ddd4c8', borderRadius: 4,
                    color: '#333', fontFamily: 'inherit', backgroundColor: '#fff',
                    boxSizing: 'border-box',
                  }}
                />
                <p style={{ margin: '4px 0 0', fontSize: 10, color: '#bbb' }}>
                  The page will be fetched server-side. For best results, also paste key text below.
                </p>
              </div>

              {/* Video links */}
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: 8 }}>
                  Video Links
                  <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 6, color: '#bbb' }}>
                    — YouTube, Vimeo, etc.
                  </span>
                </p>
                <textarea
                  value={videoLinks}
                  onChange={(e) => setVideoLinks(e.target.value)}
                  placeholder="https://youtube.com/watch?v=...&#10;https://vimeo.com/..."
                  rows={3}
                  style={{
                    width: '100%', fontSize: 12, padding: '10px 12px',
                    border: '1px solid #ddd4c8', borderRadius: 4,
                    resize: 'vertical', color: '#333', lineHeight: 1.6,
                    fontFamily: 'inherit', backgroundColor: '#fff',
                    boxSizing: 'border-box',
                  }}
                />
                <p style={{ margin: '4px 0 0', fontSize: 10, color: '#bbb' }}>
                  Video links will be added to your listing's media and used as context by the AI.
                </p>
              </div>

              {/* Source toggles — shown when any source is added */}
              {(uploadedFiles.length > 0 || pastedText.trim() || websiteUrl.trim() || videoLinks.trim()) && (
                <div style={{
                  marginTop: 16, padding: '12px 14px',
                  backgroundColor: '#f9f7f3', border: '1px solid #e5ddd0', borderRadius: 4,
                }}>
                  <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999' }}>
                    Sources to include
                  </p>
                  {uploadedFiles.length > 0 && (
                    <SourceToggle
                      label={`Uploaded files (${uploadedFiles.length})`}
                      checked={sourceToggles.files}
                      onChange={() => setSourceToggles(prev => ({ ...prev, files: !prev.files }))}
                    />
                  )}
                  {pastedText.trim() && (
                    <SourceToggle
                      label="Pasted text"
                      checked={sourceToggles.paste}
                      onChange={() => setSourceToggles(prev => ({ ...prev, paste: !prev.paste }))}
                    />
                  )}
                  {websiteUrl.trim() && (
                    <SourceToggle
                      label={`Website: ${websiteUrl.length > 40 ? websiteUrl.slice(0, 40) + '…' : websiteUrl}`}
                      checked={sourceToggles.website}
                      onChange={() => setSourceToggles(prev => ({ ...prev, website: !prev.website }))}
                    />
                  )}
                  {videoLinks.split(/[\n,]+/).some(l => l.trim().startsWith('http')) && (
                    <SourceToggle
                      label="Video links"
                      checked={sourceToggles.videos}
                      onChange={() => setSourceToggles(prev => ({ ...prev, videos: !prev.videos }))}
                    />
                  )}
                  <p style={{ margin: '6px 0 0', fontSize: 10, color: '#bbb', fontStyle: 'italic' }}>
                    Priority: PDFs / pasted text → website → images / video
                  </p>
                </div>
              )}

              {/* Info banner */}
              <div style={{
                marginTop: 16, padding: '10px 12px', borderRadius: 4,
                backgroundColor: '#f9f7f3', border: '1px solid #e5ddd0',
                fontSize: 11, color: '#888', lineHeight: 1.5,
              }}>
                <strong style={{ color: '#555' }}>How it works:</strong> AI reads your source materials to extract real facts, then writes polished luxury editorial copy. You review everything before it's applied — nothing is saved automatically.
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  marginTop: 14, padding: '10px 12px', borderRadius: 4,
                  backgroundColor: '#fef2f2', border: '1px solid #fecaca',
                  fontSize: 12, color: '#991b1b', whiteSpace: 'pre-line',
                }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Processing state */}
              {isProcessing && (
                <div style={{ padding: '32px 0', textAlign: 'center', color: '#888', fontSize: 13 }}>
                  <div style={{
                    width: 36, height: 36, border: '2px solid #e5ddd0',
                    borderTopColor: '#C9A84C', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    margin: '0 auto 14px',
                  }} />
                  Analysing {totalSourceCount} source{totalSourceCount !== 1 ? 's' : ''}…
                  <p style={{ margin: '6px 0 0', fontSize: 11, color: '#bbb' }}>
                    Extracting facts and writing copy. This takes 15–30 seconds.
                  </p>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              )}
            </>

          ) : (
            /* ─── REVIEW SCREEN ─── */
            <>
              {/* Meta bar */}
              {result._meta && (
                <div style={{
                  padding: '8px 12px', borderRadius: 4, marginBottom: 16,
                  backgroundColor: '#f9f7f3', border: '1px solid #e5ddd0',
                  fontSize: 11, color: '#888',
                }}>
                  <strong style={{ color: '#555' }}>Sources used:</strong>{' '}
                  {result._meta.sources_used?.join(', ') || 'uploaded materials'}
                  {result._meta.missing_fields?.length > 0 && (
                    <span style={{ marginLeft: 8, color: '#bbb' }}>
                      · Not found: {result._meta.missing_fields.slice(0, 4).join(', ')}
                    </span>
                  )}
                </div>
              )}

              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: 10 }}>
                Toggle sections to apply
              </p>

              {REVIEW_SECTIONS.map(section => (
                <ReviewSection
                  key={section.id}
                  section={section}
                  result={result}
                  enabled={!!enabledSections[section.id]}
                  onToggle={() => setEnabledSections(prev => ({ ...prev, [section.id]: !prev[section.id] }))}
                />
              ))}

              {REVIEW_SECTIONS.every(s => !sectionHasContent(s, result)) && (
                <div style={{
                  padding: '16px', textAlign: 'center', color: '#888',
                  backgroundColor: '#fafaf8', borderRadius: 4, border: '1px solid #e5ddd0',
                  fontSize: 12,
                }}>
                  AI couldn't extract enough content from the source materials.
                  <br />
                  Try adding more detailed files or paste the venue description.
                </div>
              )}

              <button
                type="button"
                onClick={() => { setResult(null); setError(null); setApplied(false); }}
                style={{
                  background: 'none', border: 'none', color: '#aaa',
                  fontSize: 12, cursor: 'pointer', textDecoration: 'underline',
                  padding: '8px 0', display: 'block', marginTop: 8,
                }}
              >
                ← Import different files
              </button>
            </>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #e5ddd0',
          backgroundColor: '#fafaf8',
          display: 'flex',
          gap: 10,
          flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1, padding: '10px', fontSize: 13, fontWeight: 500,
              backgroundColor: 'transparent', color: '#888',
              border: '1px solid #ddd4c8', borderRadius: 3, cursor: 'pointer',
            }}
          >
            Cancel
          </button>

          {!result ? (
            <button
              type="button"
              onClick={handleProcess}
              disabled={!canProcess || isProcessing}
              style={{
                flex: 2, padding: '10px', fontSize: 13, fontWeight: 700,
                backgroundColor: canProcess && !isProcessing ? '#0a0a0a' : '#ccc',
                color: '#fff', border: 'none', borderRadius: 3,
                cursor: canProcess && !isProcessing ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s',
              }}
            >
              {isProcessing
                ? 'Analysing…'
                : totalSourceCount > 0
                  ? `🔍 Extract & Write from ${totalSourceCount} source${totalSourceCount !== 1 ? 's' : ''}`
                  : '🔍 Extract & Write'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleApply}
              disabled={enabledCount === 0 || applied}
              style={{
                flex: 2, padding: '10px', fontSize: 13, fontWeight: 700,
                backgroundColor: applied
                  ? '#15803d'
                  : enabledCount > 0
                    ? '#C9A84C'
                    : '#ccc',
                color: '#fff', border: 'none', borderRadius: 3,
                cursor: enabledCount > 0 && !applied ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s',
              }}
            >
              {applied
                ? '✓ Applied!'
                : `↓ Apply ${enabledCount} section${enabledCount !== 1 ? 's' : ''} to Listing`}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default AIImportPanel;
