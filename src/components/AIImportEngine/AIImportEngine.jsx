import { useState, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';

/**
 * AIImportEngine — Generic AI content import panel
 *
 * Reusable across Listing Studio, Pages, Blog editor, and any future editor.
 * Source handling (files, paste, website, videos, social) and review UI are
 * fully generic. Content-type-specific logic is injected via props.
 *
 * Props:
 *   functionName   {string}    Supabase Edge Function to call (e.g. 'ai-extract-listing')
 *   entityName     {string?}   Entity name for AI context (e.g. venue name, page title)
 *   entityType     {string?}   Entity type hint passed to the function (e.g. 'venue', 'page')
 *   entityId       {string?}   Entity ID for usage logging
 *   reviewSections {Section[]} Content-type-specific review section configs — see Section shape below
 *   emptyMessage   {string?}   Shown when AI returns no extractable content
 *   targetLabel    {string?}   Appears in "Apply N sections to [targetLabel]" (default: 'form')
 *   onApply        {fn}        Called with (result, enabledSections, mergeOnly) — do field writes here
 *   onClose        {fn?}       Called with (count?) when panel closes
 *
 * Section shape:
 *   {
 *     id:       string,
 *     label:    string,
 *     icon:     string,
 *     fields:   string[],            // result keys this section covers
 *     preview:  (result) => string,  // one-line summary shown in collapsed state
 *     details?: (result) => [{label, value}][],  // field-level preview rows
 *     count?:   (result) => number,  // shown as a badge (e.g. "3 spaces")
 *     gated?:   (result) => boolean, // if present: section only shown when this returns true
 *     isArray?: boolean,             // hint: section contains array data
 *   }
 */

// ─── File type maps ───────────────────────────────────────────────────────────

const MAX_FILE_MB = 4;
const MAX_FILES   = 6;

const MIME_MAP = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'text', 'text/markdown': 'text', 'text/csv': 'text', 'text/html': 'text',
  'image/jpeg': 'image', 'image/png': 'image', 'image/webp': 'image', 'image/gif': 'image',
};

const EXT_MAP = {
  '.pdf': 'pdf',
  '.docx': 'docx',
  '.txt': 'text', '.md': 'text', '.csv': 'text', '.html': 'text',
  '.jpg': 'image', '.jpeg': 'image', '.png': 'image', '.webp': 'image', '.gif': 'image',
};

const FILE_ICONS  = { pdf: '📑', docx: '📝', text: '📄', image: '🖼', unknown: '📎' };
const FILE_LABELS = { pdf: 'PDF', docx: 'Word Doc', text: 'Text', image: 'Image' };

const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: '📸', placeholder: 'https://instagram.com/account' },
  { key: 'linkedin',  label: 'LinkedIn',  icon: '💼', placeholder: 'https://linkedin.com/company/account' },
  { key: 'youtube',   label: 'YouTube',   icon: '▶️', placeholder: 'https://youtube.com/@account' },
  { key: 'facebook',  label: 'Facebook',  icon: '📘', placeholder: 'https://facebook.com/page' },
  { key: 'tiktok',    label: 'TikTok',    icon: '🎵', placeholder: 'https://tiktok.com/@account' },
];

// ─── Exported helpers and schema utilities ───────────────────────────────────

/**
 * Field schema format — used with createApplyFn() for declarative field mapping.
 *
 * Each entry in a field schema array describes one AI result → form field mapping:
 *
 * {
 *   aiKey:     string          — key in the AI result object
 *   formKey:   string          — key passed to onChange(formKey, value)
 *   section:   string          — review section id (must match reviewSections[].id)
 *   kind:      'fact'|'editorial'
 *                fact       = value copied exactly from source (names, phone, price)
 *                editorial  = AI-written prose (summary, description, seo_*)
 *   merge:     'overwrite'|'replace_if_empty'|'append'|'merge_object'
 *                overwrite        — write always (unless mergeOnly and field has content)
 *                replace_if_empty — only write if form field is currently empty
 *                append           — extend an existing array (e.g. media_items)
 *                merge_object     — deep-merge object (e.g. contact_profile)
 *   normalise?: (aiVal, result, formData) => normalisedValue | ''
 *                Return '' to skip writing the field entirely.
 *   transform?: (aiVal, formData) => transformedValue
 *                Reshape the value (e.g. inject IDs into array items).
 *   stringify?: boolean — call String() on the value before writing
 * }
 *
 * For complex cases (multi-field normalisation, flag+data pairs, array ID injection)
 * write a custom onApply callback instead. See AIImportPanel.jsx for the listing example.
 */

/**
 * createApplyFn — Generate an onApply callback from a declarative field schema.
 *
 * Usage in a content-type wrapper:
 *   const handleApply = createApplyFn(MY_FIELD_SCHEMA, formData, onChange);
 *   <AIImportEngine reviewSections={sections} onApply={handleApply} ... />
 *
 * Simple schemas (Pages, Blogs, Vendors) can use this directly.
 * Complex schemas (Listings, with region normalisation and flag+data pairs)
 * use a manual onApply that calls individual onChange() for each field.
 */
export function createApplyFn(fieldSchema, formData, onChange) {
  return (result, enabledSections, mergeOnly) => {
    for (const field of fieldSchema) {
      const { aiKey, formKey, section, merge, normalise, transform, stringify } = field;

      if (!enabledSections[section]) continue;

      let aiVal = result[aiKey];
      if (aiVal === null || aiVal === undefined) continue;

      // Apply normaliser — return '' to skip
      if (normalise) {
        aiVal = normalise(aiVal, result, formData);
        if (!aiVal && aiVal !== 0) continue;
      }

      // Apply transformer (e.g., inject IDs into array items)
      if (transform) aiVal = transform(aiVal, formData);

      if (isEmpty(aiVal)) continue;

      const formVal  = formData[formKey];
      const strategy = merge || 'overwrite';

      // Merge mode: skip occupied fields (except append / merge_object which handle it internally)
      if (mergeOnly && strategy !== 'append' && strategy !== 'merge_object') {
        if (!isEmpty(formVal)) continue;
      }

      if (strategy === 'append' && Array.isArray(aiVal)) {
        onChange(formKey, [...(formVal || []), ...aiVal]);
      } else if (strategy === 'merge_object' && typeof aiVal === 'object' && !Array.isArray(aiVal)) {
        const existing = formVal || {};
        if (mergeOnly) {
          const merged = { ...existing };
          for (const [k, v] of Object.entries(aiVal)) {
            if (v && isEmpty(merged[k])) merged[k] = v;
          }
          onChange(formKey, merged);
        } else {
          onChange(formKey, { ...existing, ...aiVal });
        }
      } else {
        onChange(formKey, stringify ? String(aiVal) : aiVal);
      }
    }
  };
}

export function isEmpty(val) {
  if (val === null || val === undefined || val === '' || val === false) return true;
  if (Array.isArray(val)) return val.length === 0;
  if (typeof val === 'object') return Object.values(val).every(v => !v || v === '');
  return false;
}

export function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function sectionHasContent(section, result) {
  if (!result) return false;
  if (section.gated && !section.gated(result)) return false;
  return section.fields.some(f => {
    const v = result[f];
    if (v === null || v === undefined || v === '' || v === false) return false;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  });
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

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
  const [expanded, setExpanded] = useState(false);
  const hasContent = sectionHasContent(section, result);
  if (!hasContent) return null;

  const previewText = section.preview(result);
  const count       = section.count ? section.count(result) : null;
  const details     = section.details ? section.details(result) : [];

  return (
    <div style={{
      borderRadius: 6,
      border: `1px solid ${enabled ? '#C9A84C' : '#e5ddd0'}`,
      marginBottom: 8,
      overflow: 'hidden',
      opacity: enabled ? 1 : 0.5,
      transition: 'all 0.15s ease',
    }}>
      {/* Header — clicking toggles include/exclude */}
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
          {previewText && !expanded && (
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

      {/* Expand / collapse field details — independent of include toggle */}
      {details.length > 0 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
          style={{
            width: '100%', padding: '4px 12px',
            background: 'none', border: 'none', borderTop: '1px solid #f0ebe3',
            fontSize: 10, color: '#bbb', cursor: 'pointer', textAlign: 'left',
            fontFamily: 'inherit',
          }}
        >
          {expanded ? '▲ Hide fields' : `▼ Show ${details.length} field${details.length !== 1 ? 's' : ''}`}
        </button>
      )}

      {/* Field-level preview grid */}
      {expanded && details.length > 0 && (
        <div style={{ padding: '8px 12px 10px', borderTop: '1px solid #f0ebe3', backgroundColor: '#fafaf8' }}>
          {details.map(({ label, value }, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5, fontSize: 11, lineHeight: 1.4 }}>
              <span style={{ color: '#bbb', flexShrink: 0, width: 72, textAlign: 'right', paddingTop: 1 }}>{label}</span>
              <span style={{ color: '#333', flex: 1, wordBreak: 'break-word' }}>{String(value)}</span>
            </div>
          ))}
        </div>
      )}
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

// ─── Main engine component ────────────────────────────────────────────────────

const AIImportEngine = ({
  functionName,
  entityName    = '',
  entityType    = '',
  entityId      = null,
  reviewSections,
  emptyMessage  = "AI couldn't extract enough content. Try adding more detailed source materials.",
  targetLabel   = 'form',
  onApply,
  onClose,
}) => {
  // ── Input state ───────────────────────────────────────────────────────────
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [pastedText,    setPastedText]    = useState('');
  const [websiteUrl,    setWebsiteUrl]    = useState('');
  const [videoLinks,    setVideoLinks]    = useState('');
  const [socialLinks,   setSocialLinks]   = useState({ instagram: '', linkedin: '', youtube: '', facebook: '', tiktok: '' });
  const [isDragging,    setIsDragging]    = useState(false);
  const [showSocial,    setShowSocial]    = useState(false);
  const [sourceToggles, setSourceToggles] = useState({ files: true, paste: true, website: true, videos: true, social: true });
  const fileInputRef = useRef(null);

  // ── Processing state ──────────────────────────────────────────────────────
  const [isProcessing, setIsProcessing] = useState(false);
  const [error,        setError]        = useState(null);

  // ── Review state ──────────────────────────────────────────────────────────
  const [result,          setResult]          = useState(null);
  const [enabledSections, setEnabledSections] = useState({});
  const [applied,         setApplied]         = useState(false);
  const [mergeOnly,       setMergeOnly]       = useState(false);

  const activeVideoLinks = videoLinks.split(/[\n,]+/).filter(l => l.trim().startsWith('http'));
  const activeSocialUrls = Object.values(socialLinks).filter(u => u.trim().startsWith('http'));
  const hasSocial        = activeSocialUrls.length > 0;

  const canProcess = (sourceToggles.files   && uploadedFiles.length > 0)
    || (sourceToggles.paste    && !!pastedText.trim())
    || (sourceToggles.website  && !!websiteUrl.trim())
    || (sourceToggles.videos   && activeVideoLinks.length > 0)
    || (sourceToggles.social   && activeSocialUrls.length > 0)
    || !!entityName;

  const totalSourceCount =
    (sourceToggles.files   ? uploadedFiles.length     : 0)
    + (sourceToggles.paste  && pastedText.trim()       ? 1 : 0)
    + (sourceToggles.website && websiteUrl.trim()      ? 1 : 0)
    + (sourceToggles.videos ? activeVideoLinks.length  : 0)
    + (sourceToggles.social ? activeSocialUrls.length  : 0);

  // ── File processing ───────────────────────────────────────────────────────

  const processFile = useCallback(async (file) => {
    const fileType = getFileType(file);

    if (!fileType) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (ext === '.doc') {
        return { error: `${file.name}: .doc format not supported — please save as .docx or paste the text content.` };
      }
      return { error: `${file.name}: unsupported format. Use PDF, Word (.docx), images, or text files.` };
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
        // pdf, docx, image — send as base64 (server handles extraction for docx)
        reader.onload = (e) => {
          resolve({
            id: `${file.name}-${Date.now()}`,
            name: file.name,
            type: fileType,
            mediaType: file.type || (
              fileType === 'pdf'  ? 'application/pdf' :
              fileType === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
              'image/jpeg'
            ),
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
    const current  = uploadedFiles.length;
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

  // ── Process ───────────────────────────────────────────────────────────────

  const handleProcess = async () => {
    setIsProcessing(true);
    setError(null);
    setResult(null);
    setApplied(false);

    const activeFiles   = sourceToggles.files   ? uploadedFiles : [];
    const activePaste   = sourceToggles.paste   ? pastedText.trim() : '';
    const activeWebsite = sourceToggles.website ? websiteUrl.trim() : '';
    const activeVideos  = sourceToggles.videos
      ? videoLinks.split(/[\n,]+/).map(l => l.trim()).filter(l => l.startsWith('http'))
      : [];
    const activeSocial  = sourceToggles.social
      ? Object.values(socialLinks).map(u => u.trim()).filter(u => u.startsWith('http'))
      : [];

    const filesPayload = activeFiles.map(f => ({
      name: f.name,
      type: f.type,
      mediaType: f.mediaType,
      ...(f.data          ? { data: f.data }                    : {}),
      ...(f.extractedText ? { extractedText: f.extractedText } : {}),
    }));

    try {
      const { data, error: fnError } = await supabase.functions.invoke(functionName, {
        body: {
          venueName:   entityName    || undefined,
          listingType: entityType    || undefined,
          pastedText:  activePaste   || undefined,
          websiteUrl:  activeWebsite || undefined,
          videoLinks:  activeVideos.length ? activeVideos  : undefined,
          socialLinks: activeSocial.length ? activeSocial  : undefined,
          files:       filesPayload.length ? filesPayload  : undefined,
          venue_id:    entityId           || undefined,
        },
      });

      if (fnError) throw new Error(fnError.message || 'Edge Function error');
      if (data?.error) throw new Error(data.error);
      if (!data?.result) throw new Error('No data returned from AI');

      const aiResult = data.result;
      setResult(aiResult);

      const initial = {};
      for (const s of reviewSections) {
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

  // ── Apply ─────────────────────────────────────────────────────────────────

  const handleApply = () => {
    if (!result || !onApply) return;
    onApply(result, enabledSections, mergeOnly);
    setApplied(true);
    const count = reviewSections.filter(s => enabledSections[s.id] && sectionHasContent(s, result)).length;
    setTimeout(() => onClose?.(count), 900);
  };

  const enabledCount = reviewSections.filter(s =>
    enabledSections[s.id] && sectionHasContent(s, result)
  ).length;

  // ── Render ────────────────────────────────────────────────────────────────

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

        {/* ── Header ── */}
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
                : 'Upload source materials and AI will populate your content'}
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

        {/* ── Body ── */}
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
                  PDF brochures · Word docs (.docx) · Images (JPG, PNG, WEBP) · Text files (TXT, MD)
                  <br />
                  Max {MAX_FILE_MB}MB per file · Up to {MAX_FILES} files
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.txt,.md,.csv,.html,.jpg,.jpeg,.png,.webp,.gif"
                onChange={(e) => handleFiles(e.target.files)}
                style={{ display: 'none' }}
              />

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
                  placeholder="Paste descriptions, web copy, or any other source material here…"
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
                  placeholder="https://www.website.com"
                  style={{
                    width: '100%', fontSize: 12, padding: '9px 12px',
                    border: '1px solid #ddd4c8', borderRadius: 4,
                    color: '#333', fontFamily: 'inherit', backgroundColor: '#fff',
                    boxSizing: 'border-box',
                  }}
                />
                <p style={{ margin: '4px 0 0', fontSize: 10, color: '#bbb' }}>
                  Fetched via Jina Reader — works on most modern sites. For best results, also paste key text above.
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
                  placeholder={'https://youtube.com/watch?v=...\nhttps://vimeo.com/...'}
                  rows={3}
                  style={{
                    width: '100%', fontSize: 12, padding: '10px 12px',
                    border: '1px solid #ddd4c8', borderRadius: 4,
                    resize: 'vertical', color: '#333', lineHeight: 1.6,
                    fontFamily: 'inherit', backgroundColor: '#fff',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Social profiles */}
              <div style={{ marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setShowSocial(v => !v)}
                  style={{
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
                  }}
                >
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999' }}>
                    Social Profiles
                  </p>
                  <span style={{ fontSize: 10, color: '#bbb' }}>
                    {hasSocial ? `(${activeSocialUrls.length} added)` : '— optional context'}
                    {' '}{showSocial ? '▲' : '▼'}
                  </span>
                </button>

                {showSocial && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {SOCIAL_PLATFORMS.map(({ key, label, icon, placeholder }) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, flexShrink: 0, width: 20, textAlign: 'center' }}>{icon}</span>
                        <input
                          type="url"
                          value={socialLinks[key]}
                          onChange={(e) => setSocialLinks(prev => ({ ...prev, [key]: e.target.value }))}
                          placeholder={placeholder}
                          style={{
                            flex: 1, fontSize: 12, padding: '7px 10px',
                            border: '1px solid #ddd4c8', borderRadius: 4,
                            color: '#333', fontFamily: 'inherit', backgroundColor: '#fff',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    ))}
                    <p style={{ margin: '2px 0 0', fontSize: 10, color: '#bbb' }}>
                      Social URLs are used as context — AI won't fetch their content.
                    </p>
                  </div>
                )}
              </div>

              {/* Source toggles — only shown when there's something to toggle */}
              {(uploadedFiles.length > 0 || pastedText.trim() || websiteUrl.trim() || videoLinks.trim() || hasSocial) && (
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
                  {hasSocial && (
                    <SourceToggle
                      label={`Social profiles (${activeSocialUrls.length})`}
                      checked={sourceToggles.social}
                      onChange={() => setSourceToggles(prev => ({ ...prev, social: !prev.social }))}
                    />
                  )}
                  <p style={{ margin: '6px 0 0', fontSize: 10, color: '#bbb', fontStyle: 'italic' }}>
                    Priority: PDFs / Word docs / pasted text → website → images / video / social
                  </p>
                </div>
              )}

              {/* Info banner */}
              <div style={{
                marginTop: 16, padding: '10px 12px', borderRadius: 4,
                backgroundColor: '#f9f7f3', border: '1px solid #e5ddd0',
                fontSize: 11, color: '#888', lineHeight: 1.5,
              }}>
                <strong style={{ color: '#555' }}>How it works:</strong> AI reads your source materials to extract real facts, then writes polished content. You review everything before it's applied — nothing is saved automatically.
              </div>

              {error && (
                <div style={{
                  marginTop: 14, padding: '10px 12px', borderRadius: 4,
                  backgroundColor: '#fef2f2', border: '1px solid #fecaca',
                  fontSize: 12, color: '#991b1b', whiteSpace: 'pre-line',
                }}>
                  ⚠️ {error}
                </div>
              )}

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
              {/* Website fetch warning */}
              {result._meta?.website_fetch_status
                && result._meta.website_fetch_status !== 'success'
                && result._meta.website_fetch_status !== 'not_provided' && (
                <div style={{
                  padding: '9px 12px', borderRadius: 4, marginBottom: 12,
                  backgroundColor: '#fffbeb', border: '1px solid #fde68a',
                  fontSize: 11, color: '#92400e',
                }}>
                  ⚠️ Website content could not be fetched — continuing with other selected sources.
                </div>
              )}

              {/* Sources meta */}
              {result._meta && (
                <div style={{
                  padding: '8px 12px', borderRadius: 4, marginBottom: 12,
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

              {/* Merge mode toggle */}
              <label style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 4, marginBottom: 14,
                backgroundColor: mergeOnly ? 'rgba(201,168,76,0.06)' : '#f9f7f3',
                border: `1px solid ${mergeOnly ? '#C9A84C' : '#e5ddd0'}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}>
                <input
                  type="checkbox"
                  checked={mergeOnly}
                  onChange={(e) => setMergeOnly(e.target.checked)}
                  style={{ accentColor: '#C9A84C', width: 14, height: 14, flexShrink: 0 }}
                />
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>Fill empty fields only</span>
                  <span style={{ fontSize: 11, color: '#999', marginLeft: 6 }}>— keep existing curated content</span>
                </div>
              </label>

              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: 10 }}>
                Toggle sections to apply
              </p>

              {reviewSections.map(section => (
                <ReviewSection
                  key={section.id}
                  section={section}
                  result={result}
                  enabled={!!enabledSections[section.id]}
                  onToggle={() => setEnabledSections(prev => ({ ...prev, [section.id]: !prev[section.id] }))}
                />
              ))}

              {reviewSections.every(s => !sectionHasContent(s, result)) && (
                <div style={{
                  padding: '16px', textAlign: 'center', color: '#888',
                  backgroundColor: '#fafaf8', borderRadius: 4, border: '1px solid #e5ddd0',
                  fontSize: 12,
                }}>
                  {emptyMessage}
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

        {/* ── Footer ── */}
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
                backgroundColor: applied ? '#15803d' : enabledCount > 0 ? '#C9A84C' : '#ccc',
                color: '#fff', border: 'none', borderRadius: 3,
                cursor: enabledCount > 0 && !applied ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s',
              }}
            >
              {applied
                ? '✓ Applied!'
                : `↓ Apply ${enabledCount} section${enabledCount !== 1 ? 's' : ''} to ${targetLabel}`}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default AIImportEngine;
