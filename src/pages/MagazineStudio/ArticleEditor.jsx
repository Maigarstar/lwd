import { useState, useEffect, useRef, useCallback } from 'react';
import { useIsMobile } from '../../components/profile/ProfileDesignSystem';
import {
  getS, themeVars, FU, FD, Field, Input, Textarea, Select, Toggle,
  StatusBadge, GoldBtn, GhostBtn, Divider, SectionLabel,
  TONE_OPTIONS, computeWordCount, computeReadingTime, computeStatuses,
} from './StudioShared';
import { POSTS, getRelatedPosts } from '../Magazine/data/posts';
import { CATEGORIES } from '../Magazine/data/categories';
import { fetchCategories } from '../../services/magazineService';
import ArticleBody from '../Magazine/components/ArticleBody';
import TiptapEditor from './TiptapEditor';
import MagazineMediaUploader from './MagazineMediaUploader';

const GOLD = '#c9a96e';

// Hook: merge static CATEGORIES with DB-only categories (e.g. newly created ones)
function useAllCategories() {
  const [dbCats, setDbCats] = useState([]);
  useEffect(() => {
    fetchCategories().then(({ data }) => { if (data) setDbCats(data); });
  }, []);
  const staticIds = new Set(CATEGORIES.map(c => c.id));
  const dbOnly = dbCats.filter(c => !staticIds.has(c.slug)).map(c => ({
    id: c.slug, label: c.name || c.label || c.slug,
  }));
  return [...CATEGORIES, ...dbOnly];
}

// Hook: shared AI generation for inline buttons in MetaPanel, SEOPanel, etc.
function useAIGenerate(formData, tone) {
  const [loading, setLoading] = useState(null);
  const [error, setError]     = useState('');

  const runAI = useCallback(async (action, onResult) => {
    setLoading(action);
    setError('');
    try {
      const context = {
        title: formData.title,
        category: formData.categoryLabel || formData.category,
        excerpt: formData.excerpt,
        tone,
        content: (formData.content || [])
          .filter(b => b.text)
          .map(b => b.text)
          .join('\n\n')
          .slice(0, 800),
      };

      const prompts = {
        'generate-excerpt':    `Write a 1–2 sentence excerpt for this ${context.tone} magazine article titled "${context.title}" in the ${context.category} category. Return only the excerpt text.`,
        'generate-seo-title':  `Write an SEO-optimised title (under 60 chars) for a ${context.tone} article titled "${context.title}". Return only the title.`,
        'generate-meta':       `Write a meta description (under 155 chars) for this article titled "${context.title}". Excerpt: ${context.excerpt}. Return only the meta description.`,
        'generate-tags':       `Generate 5–8 relevant SEO tags for an article titled "${context.title}" in ${context.category}. Return comma-separated tags only.`,
      };

      const prompt = prompts[action];
      if (!prompt) { setLoading(null); return; }

      const { data, error: fnErr } = await import('../../lib/supabaseClient').then(m =>
        m.supabase.functions.invoke('ai-generate', { body: { prompt, model: 'auto', maxTokens: 300 } })
      ).catch(() => ({ data: null, error: new Error('AI not configured') }));

      if (fnErr || !data?.text) {
        setError('AI provider not configured. Go to Admin → AI Settings to connect OpenAI or Anthropic.');
        setLoading(null);
        return;
      }

      const result = data.text.trim();
      if (onResult) onResult(action, result);
    } catch (e) {
      setError('AI unavailable. Configure your AI provider in Admin → AI Settings.');
    }
    setLoading(null);
  }, [formData, tone]);

  return { runAI, loading, error };
}

// CSS-var tokens — cascade from themeVars() set on any ancestor wrapper.
// Dark values are fallbacks; light values come from themeVars(true) on the left panel.
const CV = {
  bg:          'var(--s-bg, #0f0f0d)',
  surface:     'var(--s-surface, #161614)',
  surfaceUp:   'var(--s-surface-up, #1e1e1b)',
  border:      'var(--s-border, rgba(245,240,232,0.07))',
  borderMid:   'var(--s-border-mid, rgba(245,240,232,0.12))',
  text:        'var(--s-text, #f5f0e8)',
  muted:       'var(--s-muted, rgba(245,240,232,0.45))',
  faint:       'var(--s-faint, rgba(245,240,232,0.2))',
  inputBg:     'var(--s-input-bg, rgba(245,240,232,0.04))',
  inputBorder: 'var(--s-input-border, rgba(245,240,232,0.1))',
  gold:        'var(--s-gold, #c9a96e)',
  error:       'var(--s-error, #e05555)',
  warn:        'var(--s-warn, #d4a843)',
  success:     'var(--s-success, #5aaa78)',
};
// Module-level S uses CSS vars so that module-level components (TemplatePicker,
// BlockRow, etc.) inherit the correct theme from the nearest themeVars() wrapper.
// Inside ArticleEditor, `const S = getS(editorLight)` shadows this with actual values.
const S = CV;

// ── Paste cleaner — strips Word / Google Docs / Notion formatting ─────────────
function cleanPastedHTML(html) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    doc.querySelectorAll('script,style,meta,link,iframe,object,embed').forEach(el => el.remove());
    const strip = ['class','style','id','bgcolor','color','face','size','lang',
      'data-htmltoslatetype','data-stringify-html','data-pm-slice','data-mark-type'];
    doc.querySelectorAll('*').forEach(el => strip.forEach(a => el.removeAttribute(a)));
    return doc.body.innerHTML;
  } catch { return html; }
}

// ── WYSIWYG rich text editor ──────────────────────────────────────────────────
function RichTextEditor({ value, onChange, placeholder, minHeight = 120, full = false }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.innerHTML = value || '';
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleKeyDown = useCallback((e) => {
    const isMod = e.metaKey || e.ctrlKey;
    if (isMod) {
      if (e.key === 'b') { e.preventDefault(); document.execCommand('bold', false, null); return; }
      if (e.key === 'i') { e.preventDefault(); document.execCommand('italic', false, null); return; }
      if (e.key === 'u') { e.preventDefault(); document.execCommand('underline', false, null); return; }
      if (e.key === 'k') {
        e.preventDefault();
        const url = window.prompt('URL:', 'https://');
        if (url) document.execCommand('createLink', false, url);
        return;
      }
    }
    // Markdown shortcuts — trigger on space
    if (full && e.key === ' ') {
      const sel = window.getSelection();
      if (!sel?.rangeCount) return;
      const range = sel.getRangeAt(0);
      const node = range.startContainer;
      if (node.nodeType === 3) {
        const before = node.textContent.slice(0, range.startOffset);
        let tag = null, len = 0;
        if (before === '##')   { tag = 'h2'; len = 2; }
        else if (before === '###')  { tag = 'h3'; len = 3; }
        else if (before === '####') { tag = 'h4'; len = 4; }
        else if (before === '>')    { tag = 'blockquote'; len = 1; }
        else if (before === '-')    {
          e.preventDefault();
          const dr = document.createRange();
          dr.setStart(node, range.startOffset - 1); dr.setEnd(node, range.startOffset);
          dr.deleteContents();
          document.execCommand('insertUnorderedList', false, null);
          ref.current?.focus();
          return;
        }
        if (tag) {
          e.preventDefault();
          const dr = document.createRange();
          dr.setStart(node, range.startOffset - len); dr.setEnd(node, range.startOffset);
          dr.deleteContents();
          document.execCommand('formatBlock', false, tag);
          ref.current?.focus();
        }
      }
    }
  }, [full]);

  const handlePaste = useCallback((e) => {
    if (!full) return;
    const html = e.clipboardData?.getData('text/html');
    if (html) {
      e.preventDefault();
      document.execCommand('insertHTML', false, cleanPastedHTML(html));
    }
  }, [full]);

  // Full toolbar groups: [format] [inline] [lists] [misc]
  const TOOLBAR = full ? [
    [
      { label: 'P',  title: 'Paragraph',  cmd: () => document.execCommand('formatBlock', false, 'p') },
      { label: 'H2', title: 'Heading 2 (## )', cmd: () => document.execCommand('formatBlock', false, 'h2'), sx: { fontFamily: FD, fontWeight: 600 } },
      { label: 'H3', title: 'Heading 3 (### )', cmd: () => document.execCommand('formatBlock', false, 'h3'), sx: { fontFamily: FD } },
      { label: 'H4', title: 'Heading 4 (#### )', cmd: () => document.execCommand('formatBlock', false, 'h4') },
    ],
    null, // separator
    [
      { label: 'B', title: 'Bold (⌘B)',      cmd: () => document.execCommand('bold'),      sx: { fontWeight: 700 } },
      { label: 'I', title: 'Italic (⌘I)',    cmd: () => document.execCommand('italic'),    sx: { fontStyle: 'italic' } },
      { label: 'U', title: 'Underline (⌘U)', cmd: () => document.execCommand('underline'), sx: { textDecoration: 'underline' } },
    ],
    null,
    [
      { label: '≡',  title: 'Bullet list (- )',    cmd: () => document.execCommand('insertUnorderedList') },
      { label: '1.', title: 'Numbered list',        cmd: () => document.execCommand('insertOrderedList') },
      { label: '❝',  title: 'Blockquote (> )',      cmd: () => document.execCommand('formatBlock', false, 'blockquote') },
    ],
    null,
    [
      { label: '⌘K', title: 'Insert link (⌘K)', cmd: () => { const u = window.prompt('URL:', 'https://'); if (u) document.execCommand('createLink', false, u); } },
      { label: '—',  title: 'Horizontal rule',   cmd: () => document.execCommand('insertHorizontalRule') },
      { label: 'Tx', title: 'Clear formatting',  cmd: () => document.execCommand('removeFormat') },
    ],
  ] : [
    [
      { label: 'B', cmd: () => document.execCommand('bold'),      sx: { fontWeight: 700 } },
      { label: 'I', cmd: () => document.execCommand('italic'),    sx: { fontStyle: 'italic' } },
      { label: 'U', cmd: () => document.execCommand('underline'), sx: { textDecoration: 'underline' } },
    ],
    null,
    [
      { label: '⌘K', cmd: () => { const u = window.prompt('URL:', 'https://'); if (u) document.execCommand('createLink', false, u); } },
      { label: 'Tx', cmd: () => document.execCommand('removeFormat') },
    ],
  ];

  const btnStyle = (sx = {}) => ({
    background: 'none', border: `1px solid ${S.border}`, color: S.muted,
    cursor: 'pointer', padding: '2px 7px', borderRadius: 2,
    fontFamily: FU, fontSize: 10, lineHeight: 1.4,
    ...sx,
  });

  return (
    <div style={{ border: `1px solid ${S.inputBorder}`, borderRadius: 2, overflow: 'hidden' }}>
      <style>{`
        .rte-body:empty:before { content: attr(data-ph); color: ${S.faint}; pointer-events: none; }
        .rte-body:focus { outline: none; }
        .rte-body a { color: ${S.gold}; }
        .rte-full h2 { font-family: ${FD}; font-size: 20px; font-weight: 400; color: ${S.text}; margin: 18px 0 8px; line-height: 1.15; }
        .rte-full h3 { font-family: ${FU}; font-size: 10px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: ${S.gold}; margin: 16px 0 6px; }
        .rte-full h4 { font-family: ${FU}; font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: ${S.muted}; margin: 12px 0 5px; }
        .rte-full ul, .rte-full ol { padding-left: 22px; margin: 8px 0; }
        .rte-full li { font-family: Georgia,serif; font-size: 14px; color: ${S.text}; line-height: 1.75; margin-bottom: 4px; }
        .rte-full blockquote { border-left: 3px solid ${S.gold}; padding: 4px 0 4px 16px; margin: 12px 0; font-style: italic; color: ${S.muted}; }
        .rte-full hr { border: none; border-top: 1px solid color-mix(in srgb, ${S.gold} 10%, transparent); margin: 20px 0; }
        .rte-full p { margin: 0 0 10px; }
        .rte-full strong, .rte-full b { color: ${S.text}; font-weight: 600; }
        .rte-full code { background: color-mix(in srgb, ${S.text} 6%, transparent); padding: 1px 5px; border-radius: 2px; font-family: monospace; font-size: 12px; }
      `}</style>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '5px 8px', background: S.surfaceUp, borderBottom: `1px solid ${S.border}`, flexWrap: 'wrap' }}>
        {TOOLBAR.map((group, gi) =>
          group === null
            ? <div key={`sep-${gi}`} style={{ width: 1, height: 18, background: S.border, margin: '0 5px', alignSelf: 'center' }} />
            : (
              <div key={gi} style={{ display: 'flex', gap: 2 }}>
                {group.map((btn, bi) => (
                  <button
                    key={bi}
                    title={btn.title}
                    onMouseDown={e => { e.preventDefault(); btn.cmd(); ref.current?.focus(); }}
                    style={btnStyle(btn.sx)}
                  >{btn.label}</button>
                ))}
              </div>
            )
        )}
      </div>

      {/* Editable body */}
      <div
        ref={ref}
        className={`rte-body${full ? ' rte-full' : ''}`}
        contentEditable
        suppressContentEditableWarning
        data-ph={placeholder || ''}
        onInput={() => onChange(ref.current?.innerHTML || '')}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onFocus={e => { e.currentTarget.closest('div[style]').style.borderColor = 'var(--s-gold, #c9a96e)'; }}
        onBlur={e => { e.currentTarget.closest('div[style]').style.borderColor = S.inputBorder; }}
        style={{
          minHeight: full ? 480 : minHeight,
          padding: full ? '16px 16px 28px' : '10px 12px',
          color: S.text,
          fontFamily: full ? "Georgia, 'Times New Roman', serif" : FU,
          fontSize: full ? 15 : 12,
          lineHeight: full ? 1.9 : 1.8,
          background: S.inputBg,
        }}
      />
    </div>
  );
}

// ── Block type registry ────────────────────────────────────────────────────────
const BLOCK_TYPES = [
  { type: 'intro',           label: 'Intro / Lead',      icon: '¶',  group: 'Text'     },
  { type: 'body_wysiwyg',    label: 'Main Body Editor',  icon: '⊞',  group: 'Text'     },
  { type: 'paragraph',       label: 'Paragraph',         icon: 'P',  group: 'Text'     },
  { type: 'heading',         label: 'Section Heading',   icon: 'H',  group: 'Text'     },
  { type: 'quote',           label: 'Pull Quote',        icon: '"',  group: 'Text'     },
  { type: 'image',           label: 'Image',             icon: '▣',  group: 'Media'    },
  { type: 'gallery',         label: 'Grid Gallery',      icon: '▦',  group: 'Media'    },
  { type: 'slider',          label: 'Slider Gallery',    icon: '◁▷', group: 'Media'    },
  { type: 'masonry',         label: 'Masonry Grid',      icon: '⊟',  group: 'Media'    },
  { type: 'dual_image',      label: 'Dual Image',        icon: '⊠',  group: 'Media'    },
  { type: 'lookbook',        label: 'Lookbook',          icon: '◧',  group: 'Media'    },
  { type: 'before_after',    label: 'Before / After',    icon: '◫',  group: 'Media'    },
  { type: 'video',           label: 'Video',             icon: '▶',  group: 'Media'    },
  { type: 'video_gallery',   label: 'Video Gallery',     icon: '▶▦', group: 'Media'    },
  { type: 'embed',           label: 'YouTube / Vimeo',   icon: '⊡',  group: 'Media'    },
  { type: 'divider',         label: 'Divider',           icon: '—',  group: 'Layout'   },
  { type: 'shop_the_story',  label: 'Shop the Story',    icon: '◈',  group: 'Commerce' },
  { type: 'mood_board',      label: 'Mood Board',        icon: '◉',  group: 'Commerce' },
  { type: 'style_tip',       label: 'Style Tip',         icon: '✦',  group: 'Commerce' },
  { type: 'brand_spotlight', label: 'Brand Spotlight',   icon: '★',  group: 'Commerce' },
  // ── Editorial ──
  { type: 'full_width_image',  label: 'Full Width Image',  icon: '▰',  group: 'Editorial' },
  { type: 'image_story',       label: 'Image + Story',     icon: '◧',  group: 'Editorial' },
  { type: 'two_image_spread',  label: 'Two Image Spread',  icon: '⊞',  group: 'Editorial' },
  { type: 'three_image_strip', label: 'Three Image Strip', icon: '⊟',  group: 'Editorial' },
  { type: 'quote_highlight',   label: 'Quote Highlight',   icon: '❝',  group: 'Editorial' },
  { type: 'section_divider',   label: 'Section Divider',   icon: '✦',  group: 'Editorial' },
  { type: 'moodboard_grid',    label: 'Moodboard Grid',    icon: '◈',  group: 'Editorial' },
  { type: 'video_embed',       label: 'Video Embed',       icon: '▶',  group: 'Editorial' },
  { type: 'venue_spotlight',   label: 'Venue Spotlight',   icon: '★',  group: 'Editorial' },
  { type: 'vendor_credits',    label: 'Vendor Credits',    icon: '♦',  group: 'Editorial' },
];

const BLOCK_GROUPS = ['Editorial', 'Text', 'Media', 'Layout', 'Commerce'];

const IMG_OBJ = () => ({ src: '', alt: '', caption: '', credit: '', focal: 'center' });

function defaultBlock(type) {
  const id = crypto.randomUUID();
  switch (type) {
    case 'intro':           return { id, type, text: '' };
    case 'body_wysiwyg':    return { id, type, text: '' };
    case 'paragraph':       return { id, type, text: '' };
    case 'heading':         return { id, type, text: '', level: 2 };
    case 'quote':           return { id, type, text: '', attribution: '' };
    case 'image':           return { id, type, src: '', alt: '', caption: '', credit: '', focal: 'center', wide: false };
    case 'gallery':         return { id, type, images: [IMG_OBJ(), IMG_OBJ()] };
    case 'video':           return { id, type, src: '', poster: '', caption: '', credit: '', autoplay: false, muted: true, loop: false };
    case 'embed':           return { id, type, url: '', caption: '' };
    case 'divider':         return { id, type };
    case 'shop_the_story':  return { id, type, headline: 'Shop the Story', categories: [{ label: '', collectionId: '' }] };
    case 'mood_board':      return { id, type, title: '', images: ['', ''] };
    case 'style_tip':       return { id, type, heading: '', body: '', tip: '', author: '' };
    case 'brand_spotlight': return { id, type, designer: { name: '', country: '', heroImage: '', story: '', signature: '', ctaLabel: 'Discover the Collection' } };
    // ── Editorial blocks ──
    case 'full_width_image':  return { id, type, src: '', alt: '', caption: '', credit: '', focal: 'center' };
    case 'image_story':       return { id, type, src: '', alt: '', caption: '', credit: '', focal: 'center', text: '', layout: 'image-left' };
    case 'two_image_spread':  return { id, type, images: [IMG_OBJ(), IMG_OBJ()] };
    case 'three_image_strip': return { id, type, images: [IMG_OBJ(), IMG_OBJ(), IMG_OBJ()] };
    case 'quote_highlight':   return { id, type, text: '', attribution: '', source: '' };
    case 'section_divider':   return { id, type, style: 'ornament' };
    case 'moodboard_grid':    return { id, type, title: '', images: [IMG_OBJ(), IMG_OBJ(), IMG_OBJ(), IMG_OBJ()] };
    case 'video_embed':       return { id, type, url: '', caption: '', credit: '' };
    case 'venue_spotlight':   return { id, type, name: '', location: '', description: '', src: '', alt: '', caption: '', credit: '', focal: 'center' };
    case 'vendor_credits':    return { id, type, heading: 'Credits', vendors: [{ role: '', name: '', url: '' }] };
    default:                return { id, type };
  }
}

// ── Editorial block preview images (picker-only, never stored in content) ──────
const BLOCK_PREVIEWS = {
  full_width_image:  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=240&h=140&q=80',
  image_story:       'https://images.unsplash.com/photo-1431274172761-fca41d930114?auto=format&fit=crop&w=240&h=140&q=80',
  two_image_spread:  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=240&h=140&q=80',
  three_image_strip: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=240&h=140&q=80',
  moodboard_grid:    'https://images.unsplash.com/photo-1471623320832-752e8bbf8413?auto=format&fit=crop&w=240&h=140&q=80',
  venue_spotlight:   'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=240&h=140&q=80',
  vendor_credits:    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=240&h=140&q=80',
};

// ── Canvas View: group accent colours ────────────────────────────────────────
const GROUP_COLOURS = {
  Editorial: '#c9a96e',   // gold
  Text:      '#7a8a9e',   // blue-grey
  Media:     '#9678b4',   // purple
  Layout:    '#6b7280',   // neutral
  Commerce:  '#5aaa78',   // green
};

// ── Canvas View: YouTube thumbnail resolver ──────────────────────────────────
function getYouTubeThumbnail(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null;
}

// ── Canvas View: resolve tile preview image ──────────────────────────────────
function getTilePreviewImage(block) {
  // 1. Block's own image
  if (block.src) return block.src;
  // 2. First image in array
  const firstImg = block.images?.find?.(img => img?.src || (typeof img === 'string' && img));
  if (firstImg) return typeof firstImg === 'string' ? firstImg : firstImg.src;
  // 3. YouTube thumbnail for video blocks
  if (block.url) { const yt = getYouTubeThumbnail(block.url); if (yt) return yt; }
  // 4. BLOCK_PREVIEWS fallback
  if (BLOCK_PREVIEWS[block.type]) return BLOCK_PREVIEWS[block.type];
  return null;
}

// ── Canvas View: tile content preview text ───────────────────────────────────
function getTilePreview(block) {
  return block.text?.replace(/<[^>]*>/g, '').slice(0, 40)
    || block.title || block.name || block.heading
    || block.designer?.name
    || (block.src ? 'Image' : '')
    || (block.images?.some?.(img => img?.src) ? `${block.images.filter(img => img?.src).length} images` : '')
    || (block.vendors?.length ? `${block.vendors.length} vendors` : '')
    || (block.url ? 'Video' : '')
    || '';
}

// ── Canvas View component ────────────────────────────────────────────────────
const CANVAS_SIZES = {
  compact:     { minCol: 140, imgH: 80 },
  comfortable: { minCol: 180, imgH: 110 },
  large:       { minCol: 240, imgH: 140 },
};

function CanvasView({ blocks, onChange, onSwitchToEditor, onAddBlock, canvasSize = 'comfortable' }) {
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const [overSide, setOverSide] = useState(null); // 'before' | 'after'
  const [hoverIdx, setHoverIdx] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const isMobile = useIsMobile(768);
  const mobileSize = { minCol: 120, imgH: 72 };
  const { minCol, imgH } = isMobile ? mobileSize : (CANVAS_SIZES[canvasSize] || CANVAS_SIZES.comfortable);

  const moveBlock = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const handleDragOver = (e, i) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const isFullW = isFullWidth(blocks[i]?.type);
    // For full-width tiles check vertical midpoint, for grid tiles check horizontal midpoint
    const mid = isFullW ? (rect.top + rect.height / 2) : (rect.left + rect.width / 2);
    const pos = isFullW ? e.clientY : e.clientX;
    setOverIdx(i);
    setOverSide(pos < mid ? 'before' : 'after');
  };

  const handleDrop = (targetIdx) => {
    if (dragIdx !== null && dragIdx !== targetIdx) {
      const insertAt = overSide === 'after' ? targetIdx + 1 : targetIdx;
      const next = [...blocks];
      const [moved] = next.splice(dragIdx, 1);
      // Adjust insertion index if dragged item was before the target
      const adjustedInsert = dragIdx < targetIdx ? insertAt - 1 : insertAt;
      next.splice(adjustedInsert, 0, moved);
      onChange(next);
    }
    setDragIdx(null);
    setOverIdx(null);
    setOverSide(null);
  };

  const isFullWidth = (type) => type === 'section_divider' || type === 'heading';

  // ── Empty state ──
  if (!blocks.length) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? '32px 16px' : '60px 20px', textAlign: 'center',
        background: S.inputBg, border: `1px dashed ${S.border}`, borderRadius: 4,
      }}>
        <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>◧</div>
        <div style={{ fontFamily: FU, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: S.text, marginBottom: 6 }}>
          No blocks yet
        </div>
        <div style={{ fontFamily: FD, fontSize: 13, color: S.muted, lineHeight: 1.5, maxWidth: 260, marginBottom: 18 }}>
          Add your first content block to start building your article's visual story.
        </div>
        <button
          onClick={() => setShowPicker(true)}
          style={{
            fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
            padding: '8px 20px', borderRadius: 2, cursor: 'pointer',
            background: `${GOLD}15`, border: `1px solid ${GOLD}60`, color: GOLD,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `${GOLD}25`; }}
          onMouseLeave={e => { e.currentTarget.style.background = `${GOLD}15`; }}
        >
          + Add First Block
        </button>
        {showPicker && (
          <div style={{ marginTop: 16, width: '100%' }}>
            <AddBlockPicker onAdd={type => { onAddBlock(type); setShowPicker(false); }} onClose={() => setShowPicker(false)} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${minCol}px, 1fr))`,
        gap: isMobile ? 8 : 10,
      }}>
        {blocks.map((block, i) => {
          const meta = BLOCK_TYPES.find(b => b.type === block.type) || { icon: '?', label: block.type, group: 'Layout' };
          const groupColour = GROUP_COLOURS[meta.group] || GROUP_COLOURS.Layout;
          const previewImg = getTilePreviewImage(block);
          const previewText = getTilePreview(block);
          const fullWidth = isFullWidth(block.type);
          const isDragging = dragIdx === i;
          const isDropTarget = overIdx === i && dragIdx !== null && dragIdx !== i;
          const isHovered = hoverIdx === i;

          // ── Section divider / heading: full-width separator tile ──
          if (fullWidth) {
            return (
              <div
                key={block.id || `${i}-${block.type}`}
                data-canvas-tile
                onDragOver={!isMobile ? e => handleDragOver(e, i) : undefined}
                onDrop={!isMobile ? () => handleDrop(i) : undefined}
                onDoubleClick={() => onSwitchToEditor(i)}
                onClick={isMobile ? () => onSwitchToEditor(i) : undefined}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                style={{
                  gridColumn: '1 / -1',
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 20px',
                  background: S.inputBg,
                  border: `1px solid ${isHovered && !isDragging ? `${GOLD}60` : S.border}`,
                  borderRadius: 2,
                  opacity: isDragging ? 0.4 : 1,
                  cursor: 'default',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                {/* Insertion marker — top or bottom edge */}
                {isDropTarget && (
                  <div style={{
                    position: 'absolute',
                    left: 8, right: 8,
                    [overSide === 'before' ? 'top' : 'bottom']: -6,
                    height: 2, borderRadius: 1,
                    background: GOLD, boxShadow: `0 0 6px ${GOLD}80`,
                    pointerEvents: 'none', zIndex: 4,
                  }} />
                )}
                {/* Drag handle — hidden on mobile (HTML5 DnD doesn't work on touch) */}
                {!isMobile && (
                  <div
                    draggable
                    onDragStart={e => {
                      setDragIdx(i);
                      e.dataTransfer.effectAllowed = 'move';
                      try { e.dataTransfer.setDragImage(e.currentTarget.closest('[data-canvas-tile]'), 40, 20); } catch (_) {}
                    }}
                    onDragEnd={() => { setDragIdx(null); setOverIdx(null); setOverSide(null); }}
                    style={{
                      cursor: 'grab', padding: '2px 4px', fontSize: 11, lineHeight: 1,
                      color: S.muted, opacity: isHovered ? 0.7 : 0, transition: 'opacity 0.15s',
                      position: 'absolute', left: 3, top: '50%', transform: 'translateY(-50%)',
                      userSelect: 'none', zIndex: 3,
                    }}
                    title="Drag to reorder"
                  >⠿</div>
                )}
                <div style={{ flex: 1, height: 1, background: `${GOLD}40` }} />
                <span style={{
                  fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.2em',
                  textTransform: 'uppercase', color: GOLD, whiteSpace: 'nowrap',
                }}>
                  {block.type === 'heading' ? (block.text || 'Section Heading') : `✦  ${block.style === 'ornament' ? 'Section Break' : block.style === 'line' ? 'Line Break' : 'Space'}`}
                </span>
                <div style={{ flex: 1, height: 1, background: `${GOLD}40` }} />
                {/* Position badge */}
                <span style={{
                  position: 'absolute', top: 6, left: 10,
                  fontFamily: FU, fontSize: 8, fontWeight: 700, color: S.muted,
                }}>{i + 1}</span>
                {/* ↑↓ arrows — always visible on mobile, hover-reveal on desktop */}
                {(isMobile || isHovered) && (
                  <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 2 }}>
                    <button onClick={e => { e.stopPropagation(); moveBlock(i, -1); }} disabled={i === 0}
                      style={{ background: 'none', border: 'none', color: i === 0 ? S.border : S.muted, cursor: i === 0 ? 'default' : 'pointer', fontSize: 11, padding: '2px 5px' }}>↑</button>
                    <button onClick={e => { e.stopPropagation(); moveBlock(i, 1); }} disabled={i === blocks.length - 1}
                      style={{ background: 'none', border: 'none', color: i === blocks.length - 1 ? S.border : S.muted, cursor: i === blocks.length - 1 ? 'default' : 'pointer', fontSize: 11, padding: '2px 5px' }}>↓</button>
                  </div>
                )}
              </div>
            );
          }

          // ── Standard tile ──
          return (
            <div
              key={block.id || `${i}-${block.type}`}
              data-canvas-tile
              onDragOver={!isMobile ? e => handleDragOver(e, i) : undefined}
              onDrop={!isMobile ? () => handleDrop(i) : undefined}
              onDoubleClick={() => onSwitchToEditor(i)}
              onClick={isMobile ? () => onSwitchToEditor(i) : undefined}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              style={{
                background: S.inputBg,
                border: `1px solid ${isHovered && !isDragging ? `${GOLD}50` : S.border}`,
                borderRadius: 3,
                overflow: 'hidden',
                cursor: isMobile ? 'pointer' : 'default',
                opacity: isDragging ? 0.4 : 1,
                transition: 'all 0.2s ease',
                transform: isHovered && !isDragging ? 'translateY(-2px)' : 'none',
                boxShadow: isHovered && !isDragging ? `0 8px 20px rgba(0,0,0,0.18), 0 0 0 1px ${GOLD}20` : 'none',
                position: 'relative',
              }}
            >
              {/* Insertion marker — left or right edge */}
              {isDropTarget && (
                <div style={{
                  position: 'absolute',
                  top: 8, bottom: 8,
                  [overSide === 'before' ? 'left' : 'right']: -6,
                  width: 2, borderRadius: 1,
                  background: GOLD, boxShadow: `0 0 6px ${GOLD}80`,
                  pointerEvents: 'none', zIndex: 4,
                }} />
              )}
              {/* Group accent bar */}
              <div style={{ height: 3, background: groupColour }} />

              {/* Image area */}
              <div style={{
                height: imgH, background: `${groupColour}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', position: 'relative',
              }}>
                {previewImg ? (
                  <img src={previewImg} alt="" loading="lazy" style={{
                    width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                  }} />
                ) : (
                  <span style={{
                    fontSize: canvasSize === 'large' ? 32 : canvasSize === 'compact' ? 20 : 26,
                    color: `${groupColour}80`, lineHeight: 1,
                  }}>{meta.icon}</span>
                )}
                {/* Position badge */}
                <div style={{
                  position: 'absolute', top: 6, left: 6,
                  width: 20, height: 20, borderRadius: '50%',
                  background: `${GOLD}cc`, color: '#fff',
                  fontFamily: FU, fontSize: 8, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{i + 1}</div>
                {/* Drag handle — hidden on mobile (HTML5 DnD doesn't work on touch) */}
                {!isMobile && (
                  <div
                    draggable
                    onDragStart={e => {
                      setDragIdx(i);
                      e.dataTransfer.effectAllowed = 'move';
                      try { e.dataTransfer.setDragImage(e.currentTarget.closest('[data-canvas-tile]'), 40, 20); } catch (_) {}
                    }}
                    onDragEnd={() => { setDragIdx(null); setOverIdx(null); setOverSide(null); }}
                    style={{
                      position: 'absolute', top: 4, right: 4,
                      cursor: 'grab', padding: '3px 5px', fontSize: 11, lineHeight: 1,
                      color: '#fff', background: 'rgba(0,0,0,0.35)', borderRadius: 2,
                      opacity: isHovered ? 0.85 : 0, transition: 'opacity 0.15s',
                      userSelect: 'none', zIndex: 3,
                    }}
                    title="Drag to reorder"
                  >⠿</div>
                )}
              </div>

              {/* Info area */}
              <div style={{ padding: '8px 10px 10px' }}>
                <div style={{
                  fontFamily: FU, fontSize: 9, fontWeight: 600, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: S.text,
                  display: 'flex', alignItems: 'center', gap: 4,
                  overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                }}>
                  <span style={{ color: groupColour, flexShrink: 0 }}>{meta.icon}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta.label}</span>
                </div>
                {previewText && (
                  <div style={{
                    fontFamily: FD, fontSize: 11, color: S.muted,
                    marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap', lineHeight: 1.3,
                  }}>{previewText}</div>
                )}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginTop: 6,
                }}>
                  <span style={{
                    fontFamily: FU, fontSize: 7, fontWeight: 600, letterSpacing: '0.12em',
                    textTransform: 'uppercase', color: groupColour, opacity: 0.7,
                    background: `${groupColour}12`, padding: '2px 6px', borderRadius: 2,
                  }}>{meta.group}</span>
                  {/* ↑↓ arrows — always visible on mobile, hover-reveal on desktop */}
                  <div style={{
                    display: 'flex', gap: 1,
                    opacity: isMobile || isHovered ? 1 : 0,
                    transition: 'opacity 0.15s',
                  }}>
                    <button onClick={e => { e.stopPropagation(); moveBlock(i, -1); }} disabled={i === 0}
                      style={{ background: 'none', border: 'none', color: i === 0 ? S.border : S.muted, cursor: i === 0 ? 'default' : 'pointer', fontSize: 10, padding: '1px 4px', lineHeight: 1 }}>↑</button>
                    <button onClick={e => { e.stopPropagation(); moveBlock(i, 1); }} disabled={i === blocks.length - 1}
                      style={{ background: 'none', border: 'none', color: i === blocks.length - 1 ? S.border : S.muted, cursor: i === blocks.length - 1 ? 'default' : 'pointer', fontSize: 10, padding: '1px 4px', lineHeight: 1 }}>↓</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* ── Add Block tile ── */}
        {showPicker ? null : (
          <div
            onClick={() => setShowPicker(true)}
            style={{
              background: 'none',
              border: `1px dashed ${GOLD}40`,
              borderRadius: 3,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 6,
              minHeight: imgH + 60,
              cursor: 'pointer',
              transition: 'all 0.15s',
              color: GOLD,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${GOLD}08`; e.currentTarget.style.borderStyle = 'solid'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderStyle = 'dashed'; }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>+</span>
            <span style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Add Block</span>
          </div>
        )}
      </div>

      {/* AddBlockPicker below grid when open */}
      {showPicker && (
        <div style={{ marginTop: 12 }}>
          <AddBlockPicker onAdd={type => { onAddBlock(type); setShowPicker(false); }} onClose={() => setShowPicker(false)} />
        </div>
      )}
    </div>
  );
}

// ── Article templates ──────────────────────────────────────────────────────────
// Paris-themed editorial preview images for the template picker
const TEMPLATE_PREVIEWS = {
  blank:              null,
  'venue-feature':    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=480&h=280&q=80', // Eiffel Tower at dusk
  'destination-guide':'https://images.unsplash.com/photo-1431274172761-fca41d930114?auto=format&fit=crop&w=480&h=280&q=80', // Paris couple at Trocadéro
  'real-wedding':     'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=480&h=280&q=80', // Hands with ring
  'fashion-editorial':'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=480&h=280&q=80', // Fashion portrait
  'planner-feature':  'https://images.unsplash.com/photo-1471623320832-752e8bbf8413?auto=format&fit=crop&w=480&h=280&q=80', // La Madeleine facade
  'beauty-guide':     'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=480&h=280&q=80', // Beauty portrait
  'shopping-edit':    'https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=480&h=280&q=80', // Elegant details
};

const TEMPLATES = [
  {
    id: 'blank', label: 'Blank', icon: '○',
    desc: 'Start with a clean canvas',
    content: [
      { type: 'intro', text: '' },
      { type: 'body_wysiwyg', text: '' },
    ],
  },
  {
    id: 'venue-feature', label: 'Venue Feature', icon: '◎',
    desc: 'Introduce a luxury venue with rich editorial storytelling',
    content: [
      { type: 'intro', text: 'Begin with an evocative opening that captures the essence of this extraordinary place...' },
      { type: 'paragraph', text: 'Describe the setting, history, and atmosphere that makes this venue unique...' },
      { type: 'image', src: '', caption: 'The main facade at golden hour', wide: true },
      { type: 'heading', text: 'The Spaces', level: 2 },
      { type: 'paragraph', text: 'Detail the venue\'s spaces and their possibilities for an unforgettable celebration...' },
      { type: 'quote', text: 'Every great wedding tells the story of the people in it — and this place has witnessed thousands of those stories.', attribution: 'Estate Director' },
      { type: 'image', src: '', caption: '', wide: false },
      { type: 'paragraph', text: 'Closing thoughts and how couples can begin the conversation...' },
    ],
  },
  {
    id: 'destination-guide', label: 'Destination Guide', icon: '◈',
    desc: 'A comprehensive editorial guide to a wedding destination',
    content: [
      { type: 'intro', text: 'Set the scene with the destination\'s defining character...' },
      { type: 'paragraph', text: 'Explore what makes this destination so compelling for discerning couples...' },
      { type: 'image', src: '', caption: '', wide: true },
      { type: 'heading', text: 'Why Couples Choose Here', level: 2 },
      { type: 'paragraph', text: 'The practical and emotional reasons this destination has endured as a favourite...' },
      { type: 'heading', text: 'Where to Celebrate', level: 2 },
      { type: 'paragraph', text: 'The finest venues and estates that define the destination\'s offering...' },
      { type: 'divider' },
      { type: 'paragraph', text: 'Planning considerations, best season, and what to expect...' },
    ],
  },
  {
    id: 'real-wedding', label: 'Real Wedding', icon: '♡',
    desc: 'Tell a couple\'s real wedding story',
    content: [
      { type: 'intro', text: 'Open with the couple\'s story and what brought them to this moment...' },
      { type: 'image', src: '', caption: '', wide: true },
      { type: 'paragraph', text: 'Describe the day\'s atmosphere, the venue, and the vision the couple had...' },
      { type: 'heading', text: 'The Details', level: 2 },
      { type: 'gallery', images: ['', '', ''] },
      { type: 'paragraph', text: 'The fashion, flowers, styling, and the vendors who brought it all together...' },
      { type: 'quote', text: 'It was exactly as we imagined — and somehow more.', attribution: 'The Bride' },
    ],
  },
  {
    id: 'fashion-editorial', label: 'Fashion Editorial', icon: '◇',
    desc: 'A luxury bridal fashion feature with shopping',
    content: [
      { type: 'image', src: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1600&h=800&fit=crop', caption: 'The Season\'s Defining Vision', wide: true },
      { type: 'intro', text: 'Discover the season\'s most transformative bridal fashion trends. From revolutionary silhouettes to unexpected fabric choices, explore the designers and designs that are redefining modern luxury bridal wear.' },
      { type: 'heading', text: 'The Silhouette Story', level: 2 },
      { type: 'paragraph', text: 'This season celebrates silhouettes that balance timeless elegance with contemporary edge. The houses leading the conversation—from heritage ateliers to emerging designers—share a common vision: empowering brides to express their most authentic selves. Whether it\'s the return of minimalist drama, unexpected asymmetry, or a renewed appreciation for sculptural proportions, the message is clear: luxury bridal fashion is evolving.' },
      { type: 'mood_board', title: 'The Edit', images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&h=500&fit=crop', 'https://images.unsplash.com/photo-1595777707802-221eb3cb6411?w=500&h=500&fit=crop', 'https://images.unsplash.com/photo-1583092087894-f4f2be6bed21?w=500&h=500&fit=crop', 'https://images.unsplash.com/photo-1620961068444-cc8dbb5b8a10?w=500&h=500&fit=crop'] },
      { type: 'paragraph', text: 'Translating these runway moments into your real bridal wardrobe is about understanding your personal narrative. Consider how these key trends align with your vision: Do the season\'s architectural shapes speak to your aesthetic? Will a bold statement gown feel authentic, or does refined simplicity better represent your style? The best choice is always the one that makes you feel most like yourself on your wedding day.' },
      { type: 'quote', text: 'The modern bride has finally given herself permission to want more—more boldness, more individuality, more joy.', attribution: 'Fashion Director' },
      { type: 'shop_the_story', headline: 'Shop the Story', categories: [{ label: 'Gowns', collectionId: 'bridal-gowns' }, { label: 'Shoes', collectionId: 'bridal-shoes' }] },
    ],
  },
  {
    id: 'planner-feature', label: 'Planner Feature', icon: '✦',
    desc: 'Profile a leading wedding planner',
    content: [
      { type: 'intro', text: 'Introduce the planner and what sets their approach apart...' },
      { type: 'paragraph', text: 'Their philosophy, background, and the clients they work with...' },
      { type: 'heading', text: 'The Approach', level: 2 },
      { type: 'paragraph', text: 'How they work, what they believe, and what they create...' },
      { type: 'quote', text: 'The best weddings are the ones where every decision has a reason.', attribution: '' },
      { type: 'paragraph', text: 'Recent work, upcoming projects, and how couples can engage them...' },
    ],
  },
  {
    id: 'beauty-guide', label: 'Beauty Guide', icon: '◉',
    desc: 'Bridal beauty, skincare, and wellbeing editorial',
    content: [
      { type: 'intro', text: 'The season\'s most important beauty direction for brides...' },
      { type: 'paragraph', text: 'Expert perspective on what\'s defining bridal beauty right now...' },
      { type: 'heading', text: 'The Skincare Countdown', level: 2 },
      { type: 'paragraph', text: 'The preparation ritual that makes the difference on the day...' },
      { type: 'image', src: '', caption: '', wide: false },
      { type: 'heading', text: 'The Look', level: 2 },
      { type: 'paragraph', text: 'The make-up directions and artists defining the season\'s aesthetic...' },
    ],
  },
  {
    id: 'shopping-edit', label: 'Shopping Edit', icon: '◈',
    desc: 'A curated commerce-led editorial piece',
    content: [
      { type: 'intro', text: 'The curated pieces that define this season\'s bridal edit...' },
      { type: 'shop_the_story', headline: 'The Edit', categories: [{ label: 'Gowns', collectionId: 'bridal-gowns' }] },
      { type: 'paragraph', text: 'What makes these pieces significant right now...' },
      { type: 'image', src: '', caption: '', wide: false },
      { type: 'shop_the_story', headline: 'Accessories', categories: [{ label: 'Shoes', collectionId: 'bridal-shoes' }, { label: 'Jewellery', collectionId: 'bridal-jewellery' }] },
    ],
  },
];

// ── Template picker modal ──────────────────────────────────────────────────────
function TemplatePicker({ onSelect, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: S.surface, border: `1px solid ${S.border}`,
          borderRadius: 4, padding: 32, width: '100%', maxWidth: 780,
          maxHeight: '85vh', overflowY: 'auto',
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: S.gold, marginBottom: 8 }}>
            Magazine Studio
          </div>
          <h2 style={{ fontFamily: FD, fontSize: 28, fontWeight: 400, color: S.text, margin: 0, lineHeight: 1.1 }}>
            Choose a Template
          </h2>
          <p style={{ fontFamily: FU, fontSize: 10, color: S.muted, marginTop: 6, lineHeight: 1.5 }}>
            Select a starting structure for your article. You can customise everything after.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {TEMPLATES.map(t => {
            const preview = TEMPLATE_PREVIEWS[t.id];
            return (
              <button
                key={t.id}
                onClick={() => onSelect(t)}
                style={{
                  background: S.inputBg, border: `1px solid ${S.border}`,
                  borderRadius: 3, padding: 0, textAlign: 'left',
                  cursor: 'pointer', transition: 'border-color 0.15s, transform 0.15s',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${GOLD}60`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = S.border; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {/* Preview image */}
                {preview ? (
                  <div style={{ width: '100%', height: 100, overflow: 'hidden', position: 'relative' }}>
                    <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
                    <div style={{ position: 'absolute', bottom: 6, left: 8, fontSize: 14 }}>{t.icon}</div>
                  </div>
                ) : (
                  <div style={{ width: '100%', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(245,240,232,0.02)' }}>
                    <span style={{ fontSize: 24, opacity: 0.4 }}>{t.icon}</span>
                  </div>
                )}
                {/* Text content */}
                <div style={{ padding: '10px 12px 14px' }}>
                  <div style={{ fontFamily: FU, fontSize: 11, fontWeight: 600, color: S.text, marginBottom: 4 }}>{t.label}</div>
                  <div style={{ fontFamily: FU, fontSize: 9, color: S.muted, lineHeight: 1.4 }}>{t.desc}</div>
                  <div style={{ fontFamily: FU, fontSize: 8, color: S.gold, marginTop: 6, letterSpacing: '0.06em' }}>{t.content.length} blocks</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Block editor per type ──────────────────────────────────────────────────────
function BlockEditor({ block, onChange }) {
  const upd = (key, val) => onChange({ ...block, [key]: val });

  switch (block.type) {
    case 'intro':
      return (
        <TiptapEditor
          value={block.text}
          onChange={v => upd('text', v)}
          placeholder="Opening paragraph — sets the tone of the piece…"
          minHeight={80}
        />
      );

    case 'paragraph':
      return (
        <TiptapEditor
          value={block.text}
          onChange={v => upd('text', v)}
          placeholder="Write editorial body copy…"
          minHeight={120}
        />
      );

    case 'heading': {
      const HEADING_LEVELS = [
        { value: '1', label: 'H1 — Feature Title' },
        { value: '2', label: 'H2 — Section' },
        { value: '3', label: 'H3 — Subheading' },
        { value: '4', label: 'H4 — Label / Caption' },
      ];
      return (
        <div>
          {/* Level chooser — visual chips */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
            {HEADING_LEVELS.map(h => (
              <button
                key={h.value}
                onClick={() => upd('level', Number(h.value))}
                style={{
                  fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                  padding: '4px 10px', borderRadius: 2, cursor: 'pointer',
                  background: String(block.level || 2) === h.value ? `color-mix(in srgb, ${S.gold} 12%, transparent)` : 'none',
                  border: `1px solid ${String(block.level || 2) === h.value ? `${GOLD}80` : S.border}`,
                  color: String(block.level || 2) === h.value ? S.gold : S.muted,
                }}
              >{h.label.split(' — ')[0]}</button>
            ))}
            <span style={{ fontFamily: FU, fontSize: 10, color: S.muted, alignSelf: 'center', marginLeft: 4 }}>
              {HEADING_LEVELS.find(h => h.value === String(block.level || 2))?.label.split(' — ')[1]}
            </span>
          </div>
          <Input value={block.text} onChange={v => upd('text', v)} placeholder="Section heading…" />
        </div>
      );
    }

    case 'quote':
      return (
        <>
          <Textarea value={block.text} onChange={v => upd('text', v)} placeholder="Pull quote text — make it memorable…" minHeight={70} />
          <div style={{ height: 8 }} />
          <Input value={block.attribution} onChange={v => upd('attribution', v)} placeholder="Attribution — person, role (optional)" />
        </>
      );

    case 'image': {
      const mediaVal = block.src ? { src: block.src, alt: block.alt || '', caption: block.caption || '', credit: block.credit || '', focal: block.focal || 'center' } : null;
      return (
        <>
          <MagazineMediaUploader
            value={mediaVal}
            onChange={v => onChange({ ...block, src: v?.src || '', alt: v?.alt || '', caption: v?.caption || '', credit: v?.credit || '', focal: v?.focal || 'center' })}
            type="image"
          />
          <div style={{ marginTop: 10 }}>
            <Toggle value={block.wide} onChange={v => upd('wide', v)} label="Full-bleed wide image" />
          </div>
        </>
      );
    }

    case 'gallery': {
      // Normalise: support old string[] format
      const imgs = (block.images || []).map(img =>
        typeof img === 'string' ? { src: img, alt: '', caption: '', credit: '', focal: 'center' } : img
      );
      return (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginBottom: 12 }}>
            {imgs.map((img, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <MagazineMediaUploader
                  value={img.src ? img : null}
                  onChange={v => {
                    const a = [...imgs];
                    a[i] = v || { src: '', alt: '', caption: '', credit: '', focal: 'center' };
                    upd('images', a);
                  }}
                  type="image"
                />
                <button
                  onClick={() => upd('images', imgs.filter((_, j) => j !== i))}
                  style={{ position: 'absolute', top: 8, left: 8, background: 'color-mix(in srgb, #000 70%, transparent)', border: `1px solid ${S.border}`, color: S.text, fontFamily: FU, fontSize: 9, padding: '2px 7px', cursor: 'pointer', borderRadius: 2, zIndex: 2 }}
                >✕ Remove</button>
              </div>
            ))}
          </div>
          <button
            onClick={() => upd('images', [...imgs, { src: '', alt: '', caption: '', credit: '', focal: 'center' }])}
            style={{ width: '100%', padding: '8px', background: 'none', border: `1px dashed color-mix(in srgb, ${S.gold} 25%, transparent)`, color: S.gold, fontFamily: FU, fontSize: 10, cursor: 'pointer', borderRadius: 2 }}
          >+ Add Image</button>
        </>
      );
    }

    // ── Slider gallery ────────────────────────────────────────────────────────
    case 'slider': {
      const slides = (block.images || []).map(img =>
        typeof img === 'string' ? { src: img, alt: '', caption: '', credit: '', focal: 'center' } : img
      );
      return (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
            <Toggle value={block.autoplay !== false} onChange={v => upd('autoplay', v)} label="Autoplay" />
            <Toggle value={block.showCaptions !== false} onChange={v => upd('showCaptions', v)} label="Show Captions" />
            <Toggle value={block.showArrows !== false} onChange={v => upd('showArrows', v)} label="Show Arrows" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
            {slides.map((img, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <div style={{ fontFamily: FU, fontSize: 9, color: S.muted, marginBottom: 4 }}>Slide {i + 1}</div>
                <MagazineMediaUploader
                  value={img.src ? img : null}
                  onChange={v => { const a = [...slides]; a[i] = v || { src: '', alt: '', caption: '', credit: '', focal: 'center' }; upd('images', a); }}
                  type="image"
                />
                <button onClick={() => upd('images', slides.filter((_, j) => j !== i))}
                  style={{ marginTop: 4, background: 'none', border: `1px solid ${S.inputBorder}`, color: S.error, fontFamily: FU, fontSize: 9, padding: '3px 8px', cursor: 'pointer', borderRadius: 2 }}>
                  ✕ Remove Slide
                </button>
              </div>
            ))}
          </div>
          <button onClick={() => upd('images', [...slides, { src: '', alt: '', caption: '', credit: '', focal: 'center' }])}
            style={{ width: '100%', padding: '8px', background: 'none', border: `1px dashed color-mix(in srgb, ${S.gold} 25%, transparent)`, color: S.gold, fontFamily: FU, fontSize: 10, cursor: 'pointer', borderRadius: 2 }}>
            + Add Slide
          </button>
        </>
      );
    }

    // ── Masonry grid ──────────────────────────────────────────────────────────
    case 'masonry': {
      const imgs = (block.images || []).map(img =>
        typeof img === 'string' ? { src: img, alt: '', caption: '', credit: '', focal: 'center' } : img
      );
      const COLUMN_OPTIONS = [{ value: 2, label: '2 Columns' }, { value: 3, label: '3 Columns' }];
      return (
        <>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {COLUMN_OPTIONS.map(o => (
              <button key={o.value} onClick={() => upd('columns', o.value)}
                style={{ fontFamily: FU, fontSize: 9, fontWeight: 600, padding: '4px 12px', borderRadius: 2, cursor: 'pointer',
                  background: (block.columns || 3) === o.value ? `color-mix(in srgb, ${S.gold} 12%, transparent)` : 'none',
                  border: `1px solid ${(block.columns || 3) === o.value ? S.gold : S.border}`,
                  color: (block.columns || 3) === o.value ? S.gold : S.muted }}>
                {o.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, marginBottom: 10 }}>
            {imgs.map((img, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <MagazineMediaUploader
                  value={img.src ? img : null}
                  onChange={v => { const a = [...imgs]; a[i] = v || { src: '', alt: '', caption: '', credit: '', focal: 'center' }; upd('images', a); }}
                  type="image"
                />
                <button onClick={() => upd('images', imgs.filter((_, j) => j !== i))}
                  style={{ position: 'absolute', top: 8, left: 8, background: 'color-mix(in srgb, #000 70%, transparent)', border: `1px solid ${S.border}`, color: S.text, fontFamily: FU, fontSize: 9, padding: '2px 7px', cursor: 'pointer', borderRadius: 2, zIndex: 2 }}>
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button onClick={() => upd('images', [...imgs, { src: '', alt: '', caption: '', credit: '', focal: 'center' }])}
            style={{ width: '100%', padding: '8px', background: 'none', border: `1px dashed color-mix(in srgb, ${S.gold} 25%, transparent)`, color: S.gold, fontFamily: FU, fontSize: 10, cursor: 'pointer', borderRadius: 2 }}>
            + Add Image
          </button>
        </>
      );
    }

    // ── Dual image ────────────────────────────────────────────────────────────
    case 'dual_image': {
      const LAYOUT_OPTIONS = [
        { value: '50/50', label: '50 / 50' },
        { value: '60/40', label: '60 / 40' },
        { value: '40/60', label: '40 / 60' },
      ];
      const imgA = block.imageA || null;
      const imgB = block.imageB || null;
      return (
        <>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, alignItems: 'center' }}>
            <span style={{ fontFamily: FU, fontSize: 9, color: S.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Split</span>
            {LAYOUT_OPTIONS.map(o => (
              <button key={o.value} onClick={() => upd('layout', o.value)}
                style={{ fontFamily: FU, fontSize: 9, fontWeight: 600, padding: '4px 10px', borderRadius: 2, cursor: 'pointer',
                  background: (block.layout || '50/50') === o.value ? `color-mix(in srgb, ${S.gold} 12%, transparent)` : 'none',
                  border: `1px solid ${(block.layout || '50/50') === o.value ? `${GOLD}70` : S.border}`,
                  color: (block.layout || '50/50') === o.value ? GOLD : S.muted }}>
                {o.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontFamily: FU, fontSize: 9, color: S.muted, marginBottom: 6 }}>LEFT IMAGE</div>
              <MagazineMediaUploader
                value={imgA}
                onChange={v => upd('imageA', v)}
                type="image"
              />
            </div>
            <div>
              <div style={{ fontFamily: FU, fontSize: 9, color: S.muted, marginBottom: 6 }}>RIGHT IMAGE</div>
              <MagazineMediaUploader
                value={imgB}
                onChange={v => upd('imageB', v)}
                type="image"
              />
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <Input value={block.caption || ''} onChange={v => upd('caption', v)} placeholder="Overall caption (optional)" />
          </div>
        </>
      );
    }

    // ── Lookbook ──────────────────────────────────────────────────────────────
    case 'lookbook': {
      const imgs = (block.images || []).map(img =>
        typeof img === 'string' ? { src: img, alt: '', caption: '', credit: '', focal: 'center' } : img
      );
      const COL_OPTIONS = [{ value: 2, label: '2 Col' }, { value: 3, label: '3 Col' }];
      return (
        <>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {COL_OPTIONS.map(o => (
              <button key={o.value} onClick={() => upd('columns', o.value)}
                style={{ fontFamily: FU, fontSize: 9, fontWeight: 600, padding: '4px 12px', borderRadius: 2, cursor: 'pointer',
                  background: (block.columns || 3) === o.value ? `color-mix(in srgb, ${S.gold} 12%, transparent)` : 'none',
                  border: `1px solid ${(block.columns || 3) === o.value ? S.gold : S.border}`,
                  color: (block.columns || 3) === o.value ? S.gold : S.muted }}>
                {o.label}
              </button>
            ))}
            <Toggle value={block.showLabels} onChange={v => upd('showLabels', v)} label="Show Labels" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, marginBottom: 10 }}>
            {imgs.map((img, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <MagazineMediaUploader
                  value={img.src ? img : null}
                  onChange={v => { const a = [...imgs]; a[i] = v || { src: '', alt: '', caption: '', credit: '', focal: 'center' }; upd('images', a); }}
                  type="image"
                />
                {block.showLabels && (
                  <input
                    value={img.label || ''}
                    onChange={e => { const a = [...imgs]; a[i] = { ...a[i], label: e.target.value }; upd('images', a); }}
                    placeholder="Image label…"
                    style={{ width: '100%', boxSizing: 'border-box', marginTop: 4, background: S.inputBg, border: `1px solid ${S.inputBorder}`, color: S.text, fontFamily: FU, fontSize: 11, padding: '5px 8px', borderRadius: 2, outline: 'none' }}
                  />
                )}
                <button onClick={() => upd('images', imgs.filter((_, j) => j !== i))}
                  style={{ position: 'absolute', top: 8, left: 8, background: 'color-mix(in srgb, #000 70%, transparent)', border: `1px solid ${S.border}`, color: S.text, fontFamily: FU, fontSize: 9, padding: '2px 7px', cursor: 'pointer', borderRadius: 2, zIndex: 2 }}>
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button onClick={() => upd('images', [...imgs, { src: '', alt: '', caption: '', credit: '', focal: 'center' }])}
            style={{ width: '100%', padding: '8px', background: 'none', border: `1px dashed color-mix(in srgb, ${S.gold} 25%, transparent)`, color: S.gold, fontFamily: FU, fontSize: 10, cursor: 'pointer', borderRadius: 2 }}>
            + Add Image
          </button>
        </>
      );
    }

    // ── Before / After ────────────────────────────────────────────────────────
    case 'before_after': {
      const before = block.before || null;
      const after = block.after || null;
      return (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: FU, fontSize: 9, color: S.muted, marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Before</div>
              <MagazineMediaUploader value={before} onChange={v => upd('before', v)} type="image" />
              <input
                value={block.beforeLabel || 'Before'}
                onChange={e => upd('beforeLabel', e.target.value)}
                placeholder="Before label"
                style={{ width: '100%', boxSizing: 'border-box', marginTop: 6, background: S.inputBg, border: `1px solid ${S.inputBorder}`, color: S.text, fontFamily: FU, fontSize: 11, padding: '5px 8px', borderRadius: 2, outline: 'none' }}
              />
            </div>
            <div>
              <div style={{ fontFamily: FU, fontSize: 9, color: S.muted, marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>After</div>
              <MagazineMediaUploader value={after} onChange={v => upd('after', v)} type="image" />
              <input
                value={block.afterLabel || 'After'}
                onChange={e => upd('afterLabel', e.target.value)}
                placeholder="After label"
                style={{ width: '100%', boxSizing: 'border-box', marginTop: 6, background: S.inputBg, border: `1px solid ${S.inputBorder}`, color: S.text, fontFamily: FU, fontSize: 11, padding: '5px 8px', borderRadius: 2, outline: 'none' }}
              />
            </div>
          </div>
          <Input value={block.caption || ''} onChange={v => upd('caption', v)} placeholder="Caption (optional)" />
        </>
      );
    }

    case 'video': {
      const videoVal = block.src ? { src: block.src, poster: block.poster || '', caption: block.caption || '', credit: block.credit || '', autoplay: block.autoplay || false, muted: block.muted !== false, loop: block.loop || false } : null;
      return (
        <MagazineMediaUploader
          value={videoVal}
          onChange={v => onChange({ ...block, src: v?.src || '', poster: v?.poster || '', caption: v?.caption || '', credit: v?.credit || '', autoplay: v?.autoplay || false, muted: v?.muted !== false, loop: v?.loop || false })}
          type="video"
        />
      );
    }

    // ── Video gallery ─────────────────────────────────────────────────────────
    case 'video_gallery': {
      const videos = block.videos || [];
      return (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
            {videos.map((vid, i) => {
              const vidVal = vid.src ? { src: vid.src, poster: vid.poster || '', caption: vid.caption || '', credit: vid.credit || '', autoplay: false, muted: true, loop: false } : null;
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontFamily: FU, fontSize: 9, color: S.muted }}>Video {i + 1}</span>
                    <button onClick={() => upd('videos', videos.filter((_, j) => j !== i))}
                      style={{ background: 'none', border: `1px solid ${S.inputBorder}`, color: S.error, fontFamily: FU, fontSize: 9, padding: '2px 8px', cursor: 'pointer', borderRadius: 2 }}>
                      ✕ Remove
                    </button>
                  </div>
                  <MagazineMediaUploader
                    value={vidVal}
                    onChange={v => { const a = [...videos]; a[i] = { src: v?.src || '', poster: v?.poster || '', caption: v?.caption || '', credit: v?.credit || '' }; upd('videos', a); }}
                    type="video"
                  />
                </div>
              );
            })}
          </div>
          <button onClick={() => upd('videos', [...videos, { src: '', poster: '', caption: '', credit: '' }])}
            style={{ width: '100%', padding: '8px', background: 'none', border: `1px dashed color-mix(in srgb, ${S.gold} 25%, transparent)`, color: S.gold, fontFamily: FU, fontSize: 10, cursor: 'pointer', borderRadius: 2 }}>
            + Add Video
          </button>
        </>
      );
    }

    case 'embed': {
      const getEmbedUrl = (url) => {
        if (!url) return null;
        const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
        if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        return null;
      };
      const embedUrl = getEmbedUrl(block.url);
      return (
        <>
          <Field label="YouTube or Vimeo URL">
            <Input value={block.url || ''} onChange={v => upd('url', v)} placeholder="https://www.youtube.com/watch?v=… or https://vimeo.com/…" />
          </Field>
          <Field label="Caption">
            <Input value={block.caption || ''} onChange={v => upd('caption', v)} placeholder="Optional caption" />
          </Field>
          {embedUrl && (
            <div style={{ aspectRatio: '16/9', borderRadius: 2, overflow: 'hidden', marginTop: 8 }}>
              <iframe src={embedUrl} title="Video preview" style={{ width: '100%', height: '100%', border: 'none' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          )}
          {block.url && !embedUrl && (
            <div style={{ fontFamily: FU, fontSize: 10, color: S.warn, marginTop: 6 }}>Paste a YouTube or Vimeo URL above to see the preview.</div>
          )}
        </>
      );
    }

    case 'divider':
      return <div style={{ fontFamily: FU, fontSize: 10, color: S.muted, padding: '6px 0' }}>✦ Ornamental divider — no configuration needed</div>;

    case 'shop_the_story':
      return (
        <>
          <Field label="Headline">
            <Input value={block.headline} onChange={v => upd('headline', v)} placeholder="Shop the Story" />
          </Field>
          <Field label="Categories / Tabs">
            {(block.categories || []).map((cat, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6, marginBottom: 6 }}>
                <Input value={cat.label} onChange={v => { const c = [...block.categories]; c[i] = { ...c[i], label: v }; upd('categories', c); }} placeholder="Tab label" />
                <Input value={cat.collectionId} onChange={v => { const c = [...block.categories]; c[i] = { ...c[i], collectionId: v }; upd('categories', c); }} placeholder="Collection ID" />
                <button onClick={() => upd('categories', block.categories.filter((_, j) => j !== i))}
                  style={{ background: 'none', border: `1px solid ${S.inputBorder}`, color: S.muted, cursor: 'pointer', padding: '0 8px', borderRadius: 2 }}>✕</button>
              </div>
            ))}
            <button onClick={() => upd('categories', [...(block.categories || []), { label: '', collectionId: '' }])}
              style={{ width: '100%', padding: '7px', background: 'none', border: `1px dashed color-mix(in srgb, ${S.gold} 25%, transparent)`, color: S.gold, fontFamily: FU, fontSize: 10, cursor: 'pointer', borderRadius: 2 }}>
              + Add Category
            </button>
          </Field>
        </>
      );

    case 'mood_board': {
      const imgs = block.images || ['', ''];
      return (
        <>
          <Field label="Title"><Input value={block.title} onChange={v => upd('title', v)} placeholder="Mood board title" /></Field>
          <Field label="Images">
            {imgs.map((img, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <Input value={img} onChange={v => { const a = [...imgs]; a[i] = v; upd('images', a); }} placeholder={`Image ${i + 1} URL`} style={{ flex: 1 }} />
                <button onClick={() => upd('images', imgs.filter((_, j) => j !== i))}
                  style={{ background: 'none', border: `1px solid ${S.inputBorder}`, color: S.muted, cursor: 'pointer', padding: '0 8px', borderRadius: 2, fontSize: 12 }}>✕</button>
              </div>
            ))}
            <button onClick={() => upd('images', [...imgs, ''])}
              style={{ width: '100%', padding: '7px', background: 'none', border: `1px dashed color-mix(in srgb, ${S.gold} 25%, transparent)`, color: S.gold, fontFamily: FU, fontSize: 10, cursor: 'pointer', borderRadius: 2 }}>
              + Add Image
            </button>
          </Field>
        </>
      );
    }

    case 'style_tip':
      return (
        <>
          <Field label="Heading"><Input value={block.heading} onChange={v => upd('heading', v)} placeholder="Section heading" /></Field>
          <Field label="Body"><Textarea value={block.body} onChange={v => upd('body', v)} placeholder="Body text" /></Field>
          <Field label="The Tip"><Textarea value={block.tip} onChange={v => upd('tip', v)} placeholder="The style advice or tip" minHeight={60} /></Field>
          <Field label="Author / Stylist"><Input value={block.author} onChange={v => upd('author', v)} placeholder="Stylist or author name" /></Field>
        </>
      );

    case 'brand_spotlight': {
      const d = block.designer || {};
      const updD = (key, val) => upd('designer', { ...d, [key]: val });
      return (
        <>
          <Field label="Brand Name"><Input value={d.name} onChange={v => updD('name', v)} placeholder="Brand / designer name" /></Field>
          <Field label="Country"><Input value={d.country} onChange={v => updD('country', v)} placeholder="Country of origin" /></Field>
          <Field label="Hero Image URL"><Input value={d.heroImage} onChange={v => updD('heroImage', v)} placeholder="https://…" /></Field>
          <Field label="Story"><Textarea value={d.story} onChange={v => updD('story', v)} placeholder="Brand story" /></Field>
          <Field label="Signature Quote"><Input value={d.signature} onChange={v => updD('signature', v)} placeholder="Signature brand quote" /></Field>
          <Field label="CTA Label"><Input value={d.ctaLabel} onChange={v => updD('ctaLabel', v)} placeholder="Discover the Collection" /></Field>
        </>
      );
    }

    case 'body_wysiwyg':
      return (
        <TiptapEditor
          value={block.text}
          onChange={v => upd('text', v)}
          placeholder="Write your article here…"
          full
        />
      );

    // ── Editorial block editors ──────────────────────────────────────────────
    case 'full_width_image': {
      const mediaVal = block.src ? { src: block.src, alt: block.alt || '', caption: block.caption || '', credit: block.credit || '', focal: block.focal || 'center' } : null;
      return (
        <MagazineMediaUploader
          value={mediaVal}
          onChange={v => onChange({ ...block, src: v?.src || '', alt: v?.alt || '', caption: v?.caption || '', credit: v?.credit || '', focal: v?.focal || 'center' })}
          type="image"
        />
      );
    }

    case 'image_story': {
      const IS_LAYOUTS = [{ value: 'image-left', label: 'Image Left' }, { value: 'image-right', label: 'Image Right' }];
      const isMediaVal = block.src ? { src: block.src, alt: block.alt || '', caption: block.caption || '', credit: block.credit || '', focal: block.focal || 'center' } : null;
      return (
        <>
          <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
            {IS_LAYOUTS.map(l => (
              <button key={l.value} onClick={() => upd('layout', l.value)} style={{
                fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', padding: '4px 10px', borderRadius: 2, cursor: 'pointer',
                background: (block.layout || 'image-left') === l.value ? `color-mix(in srgb, ${S.gold} 12%, transparent)` : 'none',
                border: `1px solid ${(block.layout || 'image-left') === l.value ? `${GOLD}80` : S.border}`,
                color: (block.layout || 'image-left') === l.value ? S.gold : S.muted,
              }}>{l.label}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontFamily: FU, fontSize: 9, color: S.muted, marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Image</div>
              <MagazineMediaUploader value={isMediaVal} onChange={v => onChange({ ...block, src: v?.src || '', alt: v?.alt || '', caption: v?.caption || '', credit: v?.credit || '', focal: v?.focal || 'center' })} type="image" />
            </div>
            <div>
              <div style={{ fontFamily: FU, fontSize: 9, color: S.muted, marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Story Text</div>
              <TiptapEditor value={block.text} onChange={v => upd('text', v)} placeholder="Tell the story alongside this image…" minHeight={180} />
            </div>
          </div>
        </>
      );
    }

    case 'two_image_spread': {
      const tisImgs = block.images || [];
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[0, 1].map(idx => (
            <div key={idx}>
              <div style={{ fontFamily: FU, fontSize: 9, color: S.muted, marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{idx === 0 ? 'Left Image' : 'Right Image'}</div>
              <MagazineMediaUploader
                value={tisImgs[idx]?.src ? tisImgs[idx] : null}
                onChange={v => { const a = [...tisImgs]; a[idx] = v || IMG_OBJ(); upd('images', a); }}
                type="image"
              />
            </div>
          ))}
        </div>
      );
    }

    case 'three_image_strip': {
      const stripImgs = block.images || [];
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[0, 1, 2].map(idx => (
            <div key={idx}>
              <div style={{ fontFamily: FU, fontSize: 9, color: S.muted, marginBottom: 6, textAlign: 'center' }}>Image {idx + 1}</div>
              <MagazineMediaUploader
                value={stripImgs[idx]?.src ? stripImgs[idx] : null}
                onChange={v => { const a = [...stripImgs]; a[idx] = v || IMG_OBJ(); upd('images', a); }}
                type="image"
              />
            </div>
          ))}
        </div>
      );
    }

    case 'quote_highlight':
      return (
        <>
          <Textarea value={block.text} onChange={v => upd('text', v)} placeholder="A memorable quote — make it stand out…" minHeight={80} />
          <div style={{ height: 8 }} />
          <Input value={block.attribution || ''} onChange={v => upd('attribution', v)} placeholder="Attribution — who said it" />
          <div style={{ height: 6 }} />
          <Input value={block.source || ''} onChange={v => upd('source', v)} placeholder="Source — publication, interview, etc. (optional)" />
        </>
      );

    case 'section_divider': {
      const DIV_STYLES = [{ value: 'ornament', label: 'Ornament ✦' }, { value: 'line', label: 'Line ──' }, { value: 'space', label: 'Space ▯' }];
      return (
        <div style={{ display: 'flex', gap: 4 }}>
          {DIV_STYLES.map(s => (
            <button key={s.value} onClick={() => upd('style', s.value)} style={{
              fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', padding: '6px 14px', borderRadius: 2, cursor: 'pointer',
              background: (block.style || 'ornament') === s.value ? `color-mix(in srgb, ${S.gold} 12%, transparent)` : 'none',
              border: `1px solid ${(block.style || 'ornament') === s.value ? `${GOLD}80` : S.border}`,
              color: (block.style || 'ornament') === s.value ? S.gold : S.muted,
            }}>{s.label}</button>
          ))}
        </div>
      );
    }

    case 'moodboard_grid': {
      const mbImgs = (block.images || []).map(img => typeof img === 'string' ? { src: img, alt: '', caption: '', credit: '', focal: 'center' } : img);
      return (
        <>
          <Field label="Title"><Input value={block.title || ''} onChange={v => upd('title', v)} placeholder="Moodboard title" /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 10 }}>
            {mbImgs.map((img, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <MagazineMediaUploader value={img.src ? img : null} onChange={v => { const a = [...mbImgs]; a[i] = v || IMG_OBJ(); upd('images', a); }} type="image" />
                {mbImgs.length > 4 && (
                  <button onClick={() => upd('images', mbImgs.filter((_, j) => j !== i))} style={{
                    position: 'absolute', top: 4, left: 4, background: 'rgba(0,0,0,0.7)', border: `1px solid ${S.border}`, color: '#fff',
                    fontFamily: FU, fontSize: 9, padding: '2px 7px', cursor: 'pointer', borderRadius: 2, zIndex: 2,
                  }}>✕</button>
                )}
              </div>
            ))}
          </div>
          {mbImgs.length < 9 && (
            <button onClick={() => upd('images', [...mbImgs, IMG_OBJ()])} style={{
              width: '100%', padding: '8px', background: 'none', border: `1px dashed color-mix(in srgb, ${S.gold} 25%, transparent)`,
              color: S.gold, fontFamily: FU, fontSize: 10, cursor: 'pointer', borderRadius: 2,
            }}>+ Add Image ({mbImgs.length}/9)</button>
          )}
        </>
      );
    }

    case 'video_embed': {
      const getVEUrl = (url) => {
        if (!url) return null;
        const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
        if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        return null;
      };
      const veUrl = getVEUrl(block.url);
      return (
        <>
          <Field label="YouTube or Vimeo URL"><Input value={block.url || ''} onChange={v => upd('url', v)} placeholder="https://www.youtube.com/watch?v=… or https://vimeo.com/…" /></Field>
          <Field label="Caption"><Input value={block.caption || ''} onChange={v => upd('caption', v)} placeholder="Video caption (optional)" /></Field>
          <Field label="Credit"><Input value={block.credit || ''} onChange={v => upd('credit', v)} placeholder="© Videographer name (optional)" /></Field>
          {veUrl && (
            <div style={{ aspectRatio: '16/9', borderRadius: 2, overflow: 'hidden', marginTop: 8 }}>
              <iframe src={veUrl} title="Video preview" style={{ width: '100%', height: '100%', border: 'none' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          )}
          {block.url && !veUrl && <div style={{ fontFamily: FU, fontSize: 10, color: S.warn, marginTop: 6 }}>Paste a YouTube or Vimeo URL to see the preview.</div>}
        </>
      );
    }

    case 'venue_spotlight': {
      const vsMediaVal = block.src ? { src: block.src, alt: block.alt || '', caption: block.caption || '', credit: block.credit || '', focal: block.focal || 'center' } : null;
      return (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <Field label="Venue Name"><Input value={block.name || ''} onChange={v => upd('name', v)} placeholder="Venue name" /></Field>
            <Field label="Location"><Input value={block.location || ''} onChange={v => upd('location', v)} placeholder="City, Country" /></Field>
          </div>
          <Field label="Description"><Textarea value={block.description || ''} onChange={v => upd('description', v)} placeholder="A short description of the venue…" minHeight={80} /></Field>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontFamily: FU, fontSize: 9, color: S.muted, marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Venue Image</div>
            <MagazineMediaUploader value={vsMediaVal} onChange={v => onChange({ ...block, src: v?.src || '', alt: v?.alt || '', caption: v?.caption || '', credit: v?.credit || '', focal: v?.focal || 'center' })} type="image" />
          </div>
        </>
      );
    }

    case 'vendor_credits': {
      const vcVendors = block.vendors || [];
      return (
        <>
          <Field label="Heading"><Input value={block.heading || ''} onChange={v => upd('heading', v)} placeholder="Credits" /></Field>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
            {vcVendors.map((vendor, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 6 }}>
                <Input value={vendor.role || ''} onChange={v => { const a = [...vcVendors]; a[i] = { ...a[i], role: v }; upd('vendors', a); }} placeholder="Role (e.g. Photography)" />
                <Input value={vendor.name || ''} onChange={v => { const a = [...vcVendors]; a[i] = { ...a[i], name: v }; upd('vendors', a); }} placeholder="Vendor name" />
                <Input value={vendor.url || ''} onChange={v => { const a = [...vcVendors]; a[i] = { ...a[i], url: v }; upd('vendors', a); }} placeholder="Website URL (optional)" />
                <button onClick={() => upd('vendors', vcVendors.filter((_, j) => j !== i))} style={{
                  background: 'none', border: `1px solid ${S.border}`, color: S.muted, cursor: 'pointer', padding: '0 8px', borderRadius: 2, fontSize: 12,
                }}>✕</button>
              </div>
            ))}
          </div>
          <button onClick={() => upd('vendors', [...vcVendors, { role: '', name: '', url: '' }])} style={{
            width: '100%', padding: '7px', background: 'none', border: `1px dashed color-mix(in srgb, ${S.gold} 25%, transparent)`,
            color: S.gold, fontFamily: FU, fontSize: 10, cursor: 'pointer', borderRadius: 2,
          }}>+ Add Vendor</button>
        </>
      );
    }

    default:
      return <div style={{ color: S.muted, fontFamily: FU, fontSize: 10 }}>Unknown block: {block.type}</div>;
  }
}

// ── Single block row ───────────────────────────────────────────────────────────
function BlockRow({ block, index, total, onChange, onDelete, onDuplicate, onMove, isOpen, onToggle, tone, blockRef }) {
  const meta = BLOCK_TYPES.find(b => b.type === block.type) || { icon: '?', label: block.type };
  const preview = block.text?.slice(0, 55) || block.title || block.name || block.heading
    || block.designer?.name || (block.src ? '📷 image' : '')
    || (block.images?.some?.(img => img?.src || (typeof img === 'string' && img)) ? `📷 ${block.images.filter(img => img?.src || (typeof img === 'string' && img)).length} images` : '')
    || (block.vendors?.length ? `${block.vendors.length} vendor${block.vendors.length > 1 ? 's' : ''}` : '')
    || (block.url ? '🎬 video' : '');

  return (
    <div ref={blockRef} style={{
      background: isOpen ? `color-mix(in srgb, ${S.gold} 8%, transparent)` : S.inputBg,
      border: `1px solid ${isOpen ? `${GOLD}40` : S.border}`,
      borderRadius: 2, marginBottom: 4, transition: 'border-color 0.15s, background 0.15s',
    }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', cursor: 'pointer' }}
        onClick={onToggle}
      >
        <span style={{ fontFamily: FU, fontSize: 11, color: S.gold, width: 16, textAlign: 'center', flexShrink: 0 }}>{meta.icon}</span>
        <span style={{ fontFamily: FU, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: isOpen ? S.gold : S.text, flexShrink: 0 }}>
          {meta.label}
        </span>
        {!isOpen && preview && (
          <span style={{ fontFamily: FU, fontSize: 10, color: S.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {preview}{preview.length >= 55 ? '…' : ''}
          </span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 2, flexShrink: 0 }}>
          <button onClick={e => { e.stopPropagation(); onMove(-1); }} disabled={index === 0}
            style={{ background: 'none', border: 'none', color: index === 0 ? S.border : S.muted, cursor: index === 0 ? 'default' : 'pointer', fontSize: 11, padding: '2px 5px' }}>↑</button>
          <button onClick={e => { e.stopPropagation(); onMove(1); }} disabled={index === total - 1}
            style={{ background: 'none', border: 'none', color: index === total - 1 ? S.border : S.muted, cursor: index === total - 1 ? 'default' : 'pointer', fontSize: 11, padding: '2px 5px' }}>↓</button>
          <button
            onClick={e => { e.stopPropagation(); onDuplicate(); }}
            title="Duplicate block"
            style={{ background: 'none', border: 'none', color: S.muted, cursor: 'pointer', fontSize: 11, padding: '2px 5px' }}
            onMouseEnter={e => e.currentTarget.style.color = S.gold}
            onMouseLeave={e => e.currentTarget.style.color = S.muted}
          >⧉</button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            style={{ background: 'none', border: 'none', color: S.muted, cursor: 'pointer', fontSize: 11, padding: '2px 6px', borderRadius: 2 }}
            onMouseEnter={e => e.currentTarget.style.color = S.error}
            onMouseLeave={e => e.currentTarget.style.color = S.muted}
          >✕</button>
        </div>
      </div>
      {isOpen && (
        <div style={{ padding: '10px 12px 14px', borderTop: `1px solid ${S.border}` }}>
          <BlockEditor block={block} onChange={onChange} />
          <InlineAIBar block={block} onUpdate={onChange} tone={tone || 'Luxury Editorial'} />
        </div>
      )}
    </div>
  );
}

// ── Add block picker ───────────────────────────────────────────────────────────
function AddBlockPicker({ onAdd, onClose }) {
  const isEditorial = group => group === 'Editorial';
  return (
    <div style={{ border: `1px solid color-mix(in srgb, ${S.gold} 25%, transparent)`, borderRadius: 2, background: S.surface, padding: 14, marginTop: 4 }}>
      {BLOCK_GROUPS.map(group => (
        <div key={group} style={{ marginBottom: 14 }}>
          <div style={{
            fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: isEditorial(group) ? GOLD : S.muted, marginBottom: 6,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {isEditorial(group) && <div style={{ width: 3, height: 12, background: GOLD, borderRadius: 1 }} />}
            {isEditorial(group) ? 'EDITORIAL BLOCKS' : group}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isEditorial(group) ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 4 }}>
            {BLOCK_TYPES.filter(bt => bt.group === group).map(bt => {
              const preview = BLOCK_PREVIEWS[bt.type];
              return (
                <button
                  key={bt.type}
                  onClick={() => { onAdd(bt.type); onClose(); }}
                  style={{
                    background: S.inputBg, border: `1px solid ${S.border}`, borderRadius: 2,
                    color: S.text, cursor: 'pointer', padding: preview ? '0' : '8px 6px', textAlign: 'center',
                    fontFamily: FU, fontSize: 9, letterSpacing: '0.04em', transition: 'all 0.15s',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${GOLD}60`; e.currentTarget.style.color = GOLD; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = S.border; e.currentTarget.style.color = S.text; }}
                >
                  {preview ? (
                    <>
                      <div style={{ width: '100%', height: 56, overflow: 'hidden' }}>
                        <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.7 }} />
                      </div>
                      <div style={{ padding: '6px 6px 7px' }}>
                        <span style={{ fontSize: 11, marginRight: 4 }}>{bt.icon}</span>
                        {bt.label}
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 13, marginBottom: 3 }}>{bt.icon}</div>
                      {bt.label}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: S.muted, fontFamily: FU, fontSize: 10, cursor: 'pointer', marginTop: 4 }}>
        Cancel
      </button>
    </div>
  );
}

// ── Video embed URL resolver ───────────────────────────────────────────────────
/**
 * Converts a YouTube, Vimeo, or direct video URL to an embeddable form.
 * Returns { type: 'youtube'|'vimeo'|'direct', embedUrl } or null.
 */
export function getVideoEmbed(url) {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    const id = ytMatch[1];
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&playsinline=1`,
    };
  }
  // Already an embed URL
  const ytEmbed = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (ytEmbed) {
    const id = ytEmbed[1];
    const base = url.split('?')[0];
    return {
      type: 'youtube',
      embedUrl: `${base}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&playsinline=1`,
    };
  }
  const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  if (vimeoMatch) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&muted=1&loop=1&background=1`,
    };
  }
  if (/\.(mp4|webm|mov|ogg)(\?|$)/i.test(url)) {
    return { type: 'direct', embedUrl: url };
  }
  return null;
}

// ── Hero video URL input ───────────────────────────────────────────────────────
function HeroVideoInput({ value, onChange }) {
  const embed = getVideoEmbed(value);
  const detect = embed?.type === 'youtube' ? 'YouTube' : embed?.type === 'vimeo' ? 'Vimeo' : embed?.type === 'direct' ? 'Video file' : null;
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          value={value || ''}
          onChange={e => onChange(e.target.value || undefined)}
          placeholder="YouTube, Vimeo or .mp4 URL…"
          style={{
            flex: 1, background: S.inputBg,
            border: `1px solid ${S.inputBorder}`,
            color: S.text, fontFamily: FU, fontSize: 12,
            padding: '7px 10px', borderRadius: 2, outline: 'none',
          }}
        />
        {value && (
          <button onClick={() => onChange(undefined)} style={{ fontFamily: FU, fontSize: 9, padding: '5px 8px', borderRadius: 2, background: 'none', border: `1px solid ${S.border}`, color: S.muted, cursor: 'pointer', flexShrink: 0 }}>✕</button>
        )}
      </div>
      {detect && <div style={{ fontFamily: FU, fontSize: 9, color: S.gold, marginTop: 4 }}>✓ {detect} detected</div>}
      {value && !embed && <div style={{ fontFamily: FU, fontSize: 9, color: S.error, marginTop: 4 }}>Unrecognised URL — paste a YouTube, Vimeo or .mp4 link</div>}
    </div>
  );
}

// ── Hero styles ────────────────────────────────────────────────────────────────
const HERO_STYLES = [
  { id: 'editorial',  label: 'Editorial',  icon: '▉', desc: 'Full-bleed image, gradient overlay, text at bottom' },
  { id: 'split',      label: 'Split',      icon: '▐', desc: 'Text left — image right (50 / 50)' },
  { id: 'cinematic',  label: 'Cinematic',  icon: '▣', desc: 'Full-screen image with centred text overlay' },
  { id: 'minimal',    label: 'Minimal',    icon: '▢', desc: 'Dark background, no image, centred type' },
  { id: 'banner',     label: 'Banner',     icon: '▬', desc: 'Short banner strip with title' },
];

// ── Hero options panel — with live visual mini-preview ─────────────────────────
function HeroPanel({ formData, onChange, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const upd = (key, val) => onChange({ ...formData, [key]: val });
  const hs  = formData.heroStyle || 'editorial';
  const hasImage   = ['editorial', 'split', 'cinematic', 'banner'].includes(hs);
  const hasOverlay = ['editorial', 'cinematic'].includes(hs);
  const titlePos   = formData.heroTitlePosition || 'bottom';
  const overlayOp  = ((formData.heroOverlayOpacity ?? 60) / 100).toFixed(2);
  const catLabel   = formData.categoryLabel || '';
  const dateStr    = formData.date ? new Date(formData.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  // ── Mini hero preview ─────────────────────────────────────────────────────
  const previewText = (
    <>
      {catLabel && <div style={{ fontFamily: FU, fontSize: 7, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: S.gold, marginBottom: 3 }}>— {catLabel}</div>}
      <div style={{ fontFamily: FD, fontSize: 14, fontWeight: 400, color: S.text, lineHeight: 1.15, marginBottom: 3 }}>
        {formData.title || 'Article Title'}
      </div>
      {(formData.author?.name || dateStr) && (
        <div style={{ fontFamily: FU, fontSize: 7, color: S.muted }}>
          {formData.author?.name}{formData.author?.name && dateStr ? ' · ' : ''}{dateStr}
        </div>
      )}
    </>
  );

  const textOverlayPos = titlePos === 'top' ? { top: 0 } : titlePos === 'center' ? { top: '50%', transform: 'translateY(-50%)' } : { bottom: 0 };

  const miniEmbed = getVideoEmbed(formData.heroVideoUrl);
  const miniHero = (
    <div style={{ position: 'relative', height: 160, overflow: 'hidden', background: S.bg, cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
      {/* Background — video takes priority over image */}
      {miniEmbed?.type === 'direct' && hasImage && (
        <video src={miniEmbed.embedUrl} autoPlay muted loop playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
      {miniEmbed && miniEmbed.type !== 'direct' && hasImage && (
        <iframe src={miniEmbed.embedUrl} allow="autoplay; encrypted-media" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }} title="Hero video preview" />
      )}
      {!miniEmbed && formData.coverImage && hasImage && (
        <img src={formData.coverImage} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      )}

      {/* Overlays by style */}
      {hs === 'editorial' && (
        <>
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, color-mix(in srgb, #000 ${overlayOp * 100}%, transparent) 0%, color-mix(in srgb, #000 10%, transparent) 55%, transparent 100%)` }} />
          <div style={{ position: 'absolute', left: 0, right: 0, padding: '10px 14px', ...textOverlayPos }}>{previewText}</div>
        </>
      )}
      {hs === 'cinematic' && (
        <>
          <div style={{ position: 'absolute', inset: 0, background: `color-mix(in srgb, #000 ${overlayOp * 100}%, transparent)` }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '10px 18px' }}>{previewText}</div>
        </>
      )}
      {hs === 'split' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
          <div style={{ flex: 1, background: 'color-mix(in srgb, #000 88%, transparent)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '10px 14px' }}>{previewText}</div>
          <div style={{ flex: 1 }} />
        </div>
      )}
      {hs === 'banner' && (
        <>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, color-mix(in srgb, #000 72%, transparent) 0%, color-mix(in srgb, #000 10%, transparent) 100%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 14px' }}>{previewText}</div>
        </>
      )}
      {hs === 'minimal' && (
        <div style={{ position: 'absolute', inset: 0, background: S.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '10px 20px' }}>{previewText}</div>
      )}

      {/* Style label badge */}
      <div style={{ position: 'absolute', top: 8, left: 8, fontFamily: FU, fontSize: 7, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: S.muted, background: 'color-mix(in srgb, #000 55%, transparent)', padding: '2px 6px', borderRadius: 1 }}>
        {HERO_STYLES.find(h => h.id === hs)?.label}
      </div>

      {/* Edit Hero button */}
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        style={{
          position: 'absolute', top: 8, right: 8,
          fontFamily: FU, fontSize: 7, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
          background: `${GOLD}22`, border: `1px solid ${GOLD}55`, color: GOLD,
          cursor: 'pointer', padding: '3px 8px', borderRadius: 2, backdropFilter: 'blur(4px)',
        }}
      >Edit Hero {open ? '▲' : '▼'}</button>
    </div>
  );

  return (
    <div style={{ border: `1px solid ${open ? `${GOLD}40` : 'var(--s-border, rgba(245,240,232,0.07))'}`, borderRadius: 2, marginBottom: 12, overflow: 'hidden', transition: 'border-color 0.15s' }}>
      {miniHero}

      {open && (
        <div style={{ padding: '12px 12px 16px', borderTop: '1px solid var(--s-border, rgba(245,240,232,0.07))', background: 'var(--s-surface, #161614)' }}>
          {/* Layout chips */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: FU, fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--s-muted, rgba(245,240,232,0.45))', marginBottom: 6 }}>Layout</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {HERO_STYLES.map(h => (
                <button key={h.id} onClick={() => upd('heroStyle', h.id)} title={h.desc} style={{ fontFamily: FU, fontSize: 9, padding: '4px 10px', borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s', background: hs === h.id ? `${GOLD}18` : 'none', border: `1px solid ${hs === h.id ? `${GOLD}60` : 'var(--s-border, rgba(245,240,232,0.07))'}`, color: hs === h.id ? GOLD : 'var(--s-muted, rgba(245,240,232,0.45))' }}>
                  {h.icon} {h.label}
                </button>
              ))}
            </div>
          </div>

          {/* Height chips */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: FU, fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--s-muted, rgba(245,240,232,0.45))', marginBottom: 6 }}>Height</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[{ id: 'standard', label: 'Standard' }, { id: 'tall', label: 'Tall' }, { id: 'fullscreen', label: 'Full Screen' }].map(opt => (
                <button key={opt.id} onClick={() => upd('heroHeight', opt.id)} style={{ fontFamily: FU, fontSize: 9, padding: '4px 10px', borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s', background: (formData.heroHeight || 'standard') === opt.id ? `${GOLD}18` : 'none', border: `1px solid ${(formData.heroHeight || 'standard') === opt.id ? `${GOLD}60` : 'var(--s-border, rgba(245,240,232,0.07))'}`, color: (formData.heroHeight || 'standard') === opt.id ? GOLD : 'var(--s-muted, rgba(245,240,232,0.45))' }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cover image */}
          {hasImage && (
            <Field label="Cover Image">
              <MagazineMediaUploader
                value={formData.coverImage ? { src: formData.coverImage, alt: formData.coverImageAlt || '', caption: '', credit: formData.coverImageCredit || '', focal: formData.heroFocalPoint || 'center' } : null}
                onChange={v => onChange({ ...formData, coverImage: v?.src || '', coverImageAlt: v?.alt || '', coverImageCredit: v?.credit || '', heroFocalPoint: v?.focal || 'center' })}
                type="image"
                showMeta
              />
            </Field>
          )}

          {/* Hero video URL — YouTube, Vimeo, or direct .mp4 */}
          {hasImage && (
            <Field label="Hero Video" hint="YouTube, Vimeo or .mp4 — plays as looping background">
              <HeroVideoInput value={formData.heroVideoUrl} onChange={v => upd('heroVideoUrl', v)} />
            </Field>
          )}

          {/* Overlay opacity */}
          {hasOverlay && (
            <Field label="Overlay Opacity" hint="Darkens image for text legibility">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="range" min={0} max={90} step={5} value={formData.heroOverlayOpacity ?? 60} onChange={e => upd('heroOverlayOpacity', Number(e.target.value))} style={{ flex: 1, accentColor: GOLD }} />
                <span style={{ fontFamily: FU, fontSize: 10, color: 'var(--s-muted, rgba(245,240,232,0.45))', width: 28, textAlign: 'right' }}>{formData.heroOverlayOpacity ?? 60}%</span>
              </div>
            </Field>
          )}

          {/* Title position */}
          {hasOverlay && (
            <Field label="Title Position">
              <div style={{ display: 'flex', gap: 4 }}>
                {['top', 'center', 'bottom'].map(pos => (
                  <button key={pos} onClick={() => upd('heroTitlePosition', pos)} style={{ fontFamily: FU, fontSize: 9, textTransform: 'capitalize', padding: '4px 10px', borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s', background: (formData.heroTitlePosition || 'bottom') === pos ? `${GOLD}18` : 'none', border: `1px solid ${(formData.heroTitlePosition || 'bottom') === pos ? `${GOLD}60` : 'var(--s-border, rgba(245,240,232,0.07))'}`, color: (formData.heroTitlePosition || 'bottom') === pos ? GOLD : 'var(--s-muted, rgba(245,240,232,0.45))' }}>
                    {pos}
                  </button>
                ))}
              </div>
            </Field>
          )}
        </div>
      )}
    </div>
  );
}

// ── Inline AI bar (shown inside each open block) ───────────────────────────────
const BLOCK_AI_ACTIONS = {
  intro:        [['improve', 'Improve Tone'], ['expand', 'Expand'], ['shorten', 'Shorten']],
  body_wysiwyg: [['improve', 'Improve Tone'], ['expand', 'Expand'], ['shorten', 'Shorten']],
  paragraph:    [['improve', 'Improve Tone'], ['expand', 'Expand'], ['shorten', 'Shorten']],
  heading:   [['gen-heading', 'Generate Heading']],
  quote:     [['gen-quote', 'Generate Quote'], ['improve', 'Improve Tone']],
  style_tip: [['improve-tip', 'Improve Tip']],
};

function InlineAIBar({ block, onUpdate, tone }) {
  const [loading, setLoading] = useState(null);
  const [err, setErr]         = useState('');
  const actions = BLOCK_AI_ACTIONS[block.type];
  if (!actions) return null;

  const run = async (action) => {
    const text = block.text || block.tip || block.body || '';
    if (!text.trim() && !['gen-heading', 'gen-quote'].includes(action)) {
      setErr('Add text first'); setTimeout(() => setErr(''), 2000); return;
    }
    setLoading(action); setErr('');
    const prompts = {
      improve:       `Rewrite the following in a ${tone} luxury editorial tone. Return only the improved text, no preamble:\n\n"${text}"`,
      expand:        `Expand the following with more elegant detail in a ${tone} tone. Return only the expanded text:\n\n"${text}"`,
      shorten:       `Condense the following to its essential idea in a ${tone} tone. Return only the shortened text:\n\n"${text}"`,
      'gen-heading': `Write a compelling single section heading for a ${tone} luxury wedding article. Return only the heading.`,
      'gen-quote':   `Write one powerful pull quote for a ${tone} luxury wedding editorial. Return only the quote text, no quotation marks.`,
      'improve-tip': `Rewrite this style tip in an elegant ${tone} editorial voice. Return only the improved tip:\n\n"${text}"`,
    };
    try {
      const { data, error: fnErr } = await import('../../lib/supabaseClient').then(m =>
        m.supabase.functions.invoke('ai-generate', { body: { prompt: prompts[action], model: 'auto', maxTokens: 200 } })
      ).catch(() => ({ data: null, error: new Error('') }));
      if (fnErr || !data?.text) { setErr('AI not configured'); setLoading(null); return; }
      const result = data.text.trim();
      if (action === 'gen-heading') onUpdate({ ...block, text: result });
      else if (action === 'gen-quote') onUpdate({ ...block, text: result });
      else if (action === 'improve-tip') onUpdate({ ...block, tip: result });
      else onUpdate({ ...block, text: result });
    } catch { setErr('AI unavailable'); }
    setLoading(null);
  };

  return (
    <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
      <span style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', color: GOLD, flexShrink: 0, marginRight: 2 }}>✦ AI</span>
      {actions.map(([action, label]) => (
        <button
          key={action}
          onClick={() => run(action)}
          disabled={!!loading}
          style={{
            fontFamily: FU, fontSize: 8, padding: '2px 8px', borderRadius: 2,
            cursor: loading ? 'default' : 'pointer', transition: 'all 0.15s',
            background: 'none',
            border: `1px solid ${loading === action ? `${GOLD}60` : S.border}`,
            color: loading === action ? GOLD : S.muted,
            opacity: loading && loading !== action ? 0.4 : 1,
          }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = `${GOLD}50`; e.currentTarget.style.color = GOLD; } }}
          onMouseLeave={e => { if (loading !== action) { e.currentTarget.style.borderColor = S.border; e.currentTarget.style.color = S.muted; } }}
        >{loading === action ? '⟳' : label}</button>
      ))}
      {err && <span style={{ fontFamily: FU, fontSize: 8, color: S.warn }}>{err}</span>}
    </div>
  );
}

// ── Content blocks panel ───────────────────────────────────────────────────────
function ContentPanel({ blocks, onChange, tone, openIndices = new Set(), setOpenIndices = () => {} }) {
  const [showPicker, setShowPicker] = useState(false);
  const [contentView, setContentView] = useState('blocks'); // 'blocks' | 'canvas'
  const [canvasSize, setCanvasSize] = useState('comfortable'); // 'compact' | 'comfortable' | 'large'
  const isMobile = useIsMobile(768);
  const blockRefs = useRef({});
  const scrollTargetId = useRef(null);

  // Auto-scroll to newly added/duplicated block
  useEffect(() => {
    if (scrollTargetId.current) {
      const targetId = scrollTargetId.current;
      scrollTargetId.current = null;
      setTimeout(() => {
        const el = blockRefs.current[targetId];
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 60);
    }
  });

  const toggleBlock = i => setOpenIndices(prev => {
    const n = new Set(prev);
    n.has(i) ? n.delete(i) : n.add(i);
    return n;
  });

  const updateBlock = (i, block) => { const next = [...blocks]; next[i] = block; onChange(next); };

  const deleteBlock = i => {
    onChange(blocks.filter((_, j) => j !== i));
    setOpenIndices(prev => {
      const n = new Set();
      for (const idx of prev) {
        if (idx < i) n.add(idx);
        else if (idx > i) n.add(idx - 1);
      }
      return n;
    });
  };

  const duplicateBlock = i => {
    const clone = JSON.parse(JSON.stringify(blocks[i]));
    clone.id = crypto.randomUUID();
    const next = [...blocks.slice(0, i + 1), clone, ...blocks.slice(i + 1)];
    setOpenIndices(prev => {
      const n = new Set();
      for (const idx of prev) {
        if (idx <= i) n.add(idx);
        else n.add(idx + 1);
      }
      n.add(i + 1);
      return n;
    });
    scrollTargetId.current = clone.id;
    onChange(next);
  };

  const moveBlock = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    setOpenIndices(prev => {
      const n = new Set();
      for (const idx of prev) {
        if (idx === i) n.add(j);
        else if (idx === j) n.add(i);
        else n.add(idx);
      }
      return n;
    });
    onChange(next);
  };

  const addBlock = type => {
    const newBlock = defaultBlock(type);
    const next = [...blocks, newBlock];
    setOpenIndices(prev => new Set([...prev, next.length - 1]));
    scrollTargetId.current = newBlock.id;
    onChange(next);
    setShowPicker(false);
  };

  // Canvas → double-click tile switches to Blocks view and opens that block
  const switchToBlockEditor = (idx) => {
    setContentView('blocks');
    setOpenIndices(prev => new Set([...prev, idx]));
    // scroll into view after render
    const block = blocks[idx];
    if (block?.id) scrollTargetId.current = block.id;
  };

  return (
    <div>
      {/* ── Blocks / Canvas toggle + zoom controls ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12,
        paddingBottom: 10, borderBottom: `1px solid ${S.border}`,
        flexWrap: 'wrap',
      }}>
        {[
          { key: 'blocks', label: 'Blocks', icon: '☰' },
          { key: 'canvas', label: 'Canvas', icon: '◧' },
        ].map(v => (
          <button key={v.key} onClick={() => setContentView(v.key)} style={{
            fontFamily: FU, fontSize: 8, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '4px 10px', borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s',
            background: contentView === v.key ? `${GOLD}18` : 'none',
            border: `1px solid ${contentView === v.key ? `${GOLD}60` : S.border}`,
            color: contentView === v.key ? GOLD : S.muted,
          }}>
            {v.icon} {v.label}{v.key === 'blocks' ? ` (${blocks.length})` : ''}
          </button>
        ))}

        {/* Zoom controls — visible in canvas mode, hidden on mobile (forced compact) */}
        {contentView === 'canvas' && !isMobile && (
          <>
            <div style={{ width: 1, height: 14, background: S.border, margin: '0 2px' }} />
            {[
              { key: 'compact',     label: '◻' },
              { key: 'comfortable', label: '◻◻' },
              { key: 'large',       label: '◻◻◻' },
            ].map(z => (
              <button key={z.key} onClick={() => setCanvasSize(z.key)} title={z.key} style={{
                fontFamily: FU, fontSize: 9, padding: '3px 6px', borderRadius: 2, cursor: 'pointer',
                background: canvasSize === z.key ? `${GOLD}18` : 'none',
                border: `1px solid ${canvasSize === z.key ? `${GOLD}60` : S.border}`,
                color: canvasSize === z.key ? GOLD : S.muted,
                transition: 'all 0.15s',
              }}>{z.label}</button>
            ))}
          </>
        )}
      </div>

      {/* ── Blocks view (existing BlockRow list) ── */}
      {contentView === 'blocks' && (
        <>
          {blocks.length === 0 && !showPicker && (
            <div style={{ fontFamily: FU, fontSize: 11, color: S.muted, padding: '20px 0', textAlign: 'center', lineHeight: 1.6 }}>
              No content blocks yet.<br />Add your first block below.
            </div>
          )}
          {blocks.map((block, i) => (
            <BlockRow
              key={block.id || `${i}-${block.type}`}
              blockRef={el => { if (block.id) blockRefs.current[block.id] = el; }}
              block={block} index={i} total={blocks.length}
              isOpen={openIndices.has(i)}
              onToggle={() => toggleBlock(i)}
              onChange={b => updateBlock(i, b)}
              onDelete={() => deleteBlock(i)}
              onDuplicate={() => duplicateBlock(i)}
              onMove={dir => moveBlock(i, dir)}
              tone={tone}
            />
          ))}
          {showPicker
            ? <AddBlockPicker onAdd={addBlock} onClose={() => setShowPicker(false)} />
            : (
              <button
                onClick={() => setShowPicker(true)}
                style={{
                  width: '100%', padding: '10px', marginTop: 4,
                  background: 'none', border: `1px dashed ${GOLD}40`,
                  color: GOLD, fontFamily: FU, fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  cursor: 'pointer', borderRadius: 2, transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = `${GOLD}08`; e.currentTarget.style.borderStyle = 'solid'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderStyle = 'dashed'; }}
              >
                + Add Block
              </button>
            )
          }
        </>
      )}

      {/* ── Canvas view (visual tile grid) ── */}
      {contentView === 'canvas' && (
        <CanvasView
          blocks={blocks}
          onChange={onChange}
          onSwitchToEditor={switchToBlockEditor}
          onAddBlock={addBlock}
          canvasSize={canvasSize}
        />
      )}
    </div>
  );
}

// ── Metadata panel ─────────────────────────────────────────────────────────────
function MetaPanel({ formData, onChange, tone, onToneChange }) {
  const upd = (key, val) => onChange({ ...formData, [key]: val });
  const updAuthor = (key, val) => onChange({ ...formData, author: { ...formData.author, [key]: val } });
  const { runAI, loading: aiLoading, error: aiError } = useAIGenerate(formData, tone);
  const [linksOpen, setLinksOpen] = useState(false);

  const allCats = useAllCategories();
  const catOptions = allCats.map(c => ({ value: c.id, label: c.label }));

  const handleAI = (action) => {
    runAI(action, (a, result) => {
      if (a === 'generate-excerpt') upd('excerpt', result);
      if (a === 'generate-tags')    upd('tags', result.split(',').map(t => t.trim()).filter(Boolean));
    });
  };

  // For inline links section
  const related = getRelatedPosts(formData, 5);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl]   = useState('');
  const [copied, setCopied]     = useState(false);
  const copyMarkdown = () => {
    const md = `[${linkText || 'Link text'}](${linkUrl})`;
    navigator.clipboard?.writeText(md).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Inline AI button helper
  const aiBtn = (action, label) => (
    <button
      onClick={() => handleAI(action)}
      disabled={!!aiLoading}
      style={{
        fontFamily: FU, fontSize: 8, fontWeight: 600, letterSpacing: '0.06em',
        textTransform: 'uppercase', background: 'none',
        border: `1px solid var(--s-border, rgba(245,240,232,0.07))`,
        color: aiLoading === action ? GOLD : 'var(--s-muted, rgba(245,240,232,0.45))',
        padding: '3px 7px', borderRadius: 2, cursor: aiLoading ? 'default' : 'pointer',
        opacity: aiLoading && aiLoading !== action ? 0.4 : 1, transition: 'all 0.15s',
        marginTop: 4,
      }}
      onMouseEnter={e => { if (!aiLoading) { e.currentTarget.style.borderColor = `${GOLD}60`; e.currentTarget.style.color = GOLD; } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--s-border, rgba(245,240,232,0.07))'; e.currentTarget.style.color = aiLoading === action ? GOLD : 'var(--s-muted, rgba(245,240,232,0.45))'; }}
    >
      {aiLoading === action ? '⟳ Working…' : label}
    </button>
  );

  return (
    <div>
      <Field label="Title">
        <Input value={formData.title} onChange={v => upd('title', v)} placeholder="Article title" />
      </Field>
      <Field label="Slug" hint="URL path — auto-formatted to kebab-case">
        <Input
          value={formData.slug}
          onChange={v => upd('slug', v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
          placeholder="article-url-slug"
        />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Category">
          <Select
            value={formData.category}
            onChange={v => {
              const cat = allCats.find(c => c.id === v);
              onChange({ ...formData, category: v, categoryLabel: cat?.label || v });
            }}
            options={catOptions}
          />
        </Field>
        <Field label="Layout">
          <Select
            value={formData.layout || 'full-width'}
            onChange={v => upd('layout', v)}
            options={[{ value: 'full-width', label: 'Full Width' }, { value: 'sidebar', label: 'With Sidebar' }]}
          />
        </Field>
      </div>
      <Field label="Excerpt" hint="1–2 sentences shown in article listings">
        <Textarea value={formData.excerpt} onChange={v => upd('excerpt', v)} placeholder="Short article summary…" minHeight={60} />
        {aiBtn('generate-excerpt', '✦ Generate Excerpt')}
      </Field>
      <Field label="Standfirst" hint="Opening paragraph shown in the article hero">
        <Textarea value={formData.standfirst} onChange={v => upd('standfirst', v)} placeholder="Opening paragraph that introduces the piece…" minHeight={80} />
      </Field>
      <Divider />

      {/* Tone selector (moved from AI panel) */}
      <Field label="Writing Tone" hint="Applied to all AI generation for this article">
        <Select
          value={tone}
          onChange={onToneChange}
          options={TONE_OPTIONS.map(t => ({ value: t, label: t }))}
        />
      </Field>

      <Divider />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Author Name">
          <Input value={formData.author?.name} onChange={v => updAuthor('name', v)} placeholder="Full name" />
        </Field>
        <Field label="Author Avatar URL">
          <Input value={formData.author?.avatar} onChange={v => updAuthor('avatar', v)} placeholder="https://…" />
        </Field>
        <Field label="Publish Date">
          <input
            type="date" value={formData.date || ''}
            onChange={e => upd('date', e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', background: 'var(--s-input-bg, rgba(245,240,232,0.04))', border: '1px solid var(--s-input-border, rgba(245,240,232,0.1))', color: 'var(--s-text, #f5f0e8)', fontFamily: FU, fontSize: 12, padding: '8px 10px', borderRadius: 2, outline: 'none', colorScheme: 'dark' }}
          />
        </Field>
        <Field label="Reading Time (min)">
          <input
            type="number" min={1} max={60} value={formData.readingTime || ''}
            onChange={e => upd('readingTime', Number(e.target.value))}
            style={{ width: '100%', boxSizing: 'border-box', background: 'var(--s-input-bg, rgba(245,240,232,0.04))', border: '1px solid var(--s-input-border, rgba(245,240,232,0.1))', color: 'var(--s-text, #f5f0e8)', fontFamily: FU, fontSize: 12, padding: '8px 10px', borderRadius: 2, outline: 'none' }}
          />
        </Field>
      </div>
      <Divider />
      <Field label="Cover Image URL">
        <Input value={formData.coverImage} onChange={v => upd('coverImage', v)} placeholder="https://images.unsplash.com/…" />
        {formData.coverImage && (
          <img src={formData.coverImage} alt="" style={{ width: '100%', marginTop: 8, borderRadius: 2, maxHeight: 130, objectFit: 'cover' }} />
        )}
      </Field>
      <Field label="Cover Image Alt Text">
        <Input value={formData.coverImageAlt} onChange={v => upd('coverImageAlt', v)} placeholder="Describe the image for accessibility" />
      </Field>
      <Field label="Tags" hint="Comma-separated — amalfi, italy, venues">
        <Input
          value={Array.isArray(formData.tags) ? formData.tags.join(', ') : formData.tags || ''}
          onChange={v => upd('tags', v.split(',').map(t => t.trim()).filter(Boolean))}
          placeholder="tag1, tag2, tag3"
        />
        {aiBtn('generate-tags', '✦ Generate Tags')}
      </Field>

      {aiError && (
        <div style={{ padding: '8px 10px', marginBottom: 10, background: `var(--s-warn, #d4a843)12`, border: `1px solid var(--s-warn, #d4a843)40`, borderRadius: 2, fontFamily: FU, fontSize: 9, color: 'var(--s-text, #f5f0e8)', lineHeight: 1.4 }}>
          ⚠ {aiError}
        </div>
      )}

      <Divider />

      {/* ── Collapsible Related Articles & Links ─────────────────────────────── */}
      <button
        onClick={() => setLinksOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, width: '100%',
          background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0',
          fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: GOLD,
        }}
      >
        <span style={{ fontSize: 10, transition: 'transform 0.15s', transform: linksOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
        Related Articles & Links
      </button>

      {linksOpen && (
        <div style={{ paddingLeft: 4, marginBottom: 8 }}>
          {/* Suggested related */}
          {related.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: FU, fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--s-muted, rgba(245,240,232,0.45))', marginBottom: 6 }}>Suggested</div>
              {related.map(post => (
                <div key={post.id} style={{
                  display: 'flex', gap: 8, padding: '6px 0',
                  borderBottom: '1px solid var(--s-border, rgba(245,240,232,0.07))',
                }}>
                  {post.coverImage && <img src={post.coverImage} alt="" style={{ width: 36, height: 26, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: FD, fontSize: 11, color: 'var(--s-text, #f5f0e8)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {post.title}
                    </div>
                  </div>
                  <button
                    onClick={() => { setLinkText(post.title); setLinkUrl(`/magazine/${post.slug}`); }}
                    style={{ flexShrink: 0, background: 'none', border: `1px solid var(--s-border, rgba(245,240,232,0.07))`, color: 'var(--s-muted, rgba(245,240,232,0.45))', fontFamily: FU, fontSize: 7, padding: '2px 6px', cursor: 'pointer', borderRadius: 1 }}
                  >Use</button>
                </div>
              ))}
            </div>
          )}

          {/* Category links */}
          <div style={{ fontFamily: FU, fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--s-muted, rgba(245,240,232,0.45))', marginBottom: 4 }}>Category Links</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 10 }}>
            {allCats.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setLinkText(cat.label); setLinkUrl(`/magazine/category/${cat.id}`); }}
                style={{
                  background: 'var(--s-input-bg, rgba(245,240,232,0.04))', border: '1px solid var(--s-border, rgba(245,240,232,0.07))',
                  borderRadius: 2, padding: '3px 6px', cursor: 'pointer', fontFamily: FU, fontSize: 8, color: 'var(--s-text, #f5f0e8)',
                }}
              >{cat.label}</button>
            ))}
          </div>

          {/* Manual link */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
            <Input value={linkText} onChange={setLinkText} placeholder="Link text" />
            <Input value={linkUrl} onChange={setLinkUrl} placeholder="/magazine/slug" />
          </div>
          {(linkText || linkUrl) && (
            <div style={{ background: 'var(--s-input-bg, rgba(245,240,232,0.04))', border: '1px solid var(--s-border, rgba(245,240,232,0.07))', borderRadius: 2, padding: 8, marginBottom: 6, fontFamily: 'monospace', fontSize: 10, color: GOLD, wordBreak: 'break-all' }}>
              [{linkText || 'text'}]({linkUrl || 'url'})
            </div>
          )}
          <GhostBtn onClick={copyMarkdown} small>
            {copied ? '✓ Copied' : 'Copy as Markdown'}
          </GhostBtn>
        </div>
      )}
    </div>
  );
}

// ── SEO panel ─────────────────────────────────────────────────────────────────
function SEOPanel({ formData, onChange, tone }) {
  const upd = (key, val) => onChange({ ...formData, [key]: val });
  const wc = computeWordCount(formData.content);
  const rt = computeReadingTime(wc);
  const { runAI, loading: aiLoading, error: aiError } = useAIGenerate(formData, tone);

  const handleAI = (action) => {
    runAI(action, (a, result) => {
      if (a === 'generate-seo-title') upd('seoTitle', result);
      if (a === 'generate-meta')      upd('metaDescription', result);
    });
  };

  const aiBtn = (action, label) => (
    <button
      onClick={() => handleAI(action)}
      disabled={!!aiLoading}
      style={{
        fontFamily: FU, fontSize: 8, fontWeight: 600, letterSpacing: '0.06em',
        textTransform: 'uppercase', background: 'none',
        border: '1px solid var(--s-border, rgba(245,240,232,0.07))',
        color: aiLoading === action ? GOLD : 'var(--s-muted, rgba(245,240,232,0.45))',
        padding: '3px 7px', borderRadius: 2, cursor: aiLoading ? 'default' : 'pointer',
        opacity: aiLoading && aiLoading !== action ? 0.4 : 1, transition: 'all 0.15s',
        marginTop: 4,
      }}
      onMouseEnter={e => { if (!aiLoading) { e.currentTarget.style.borderColor = `${GOLD}60`; e.currentTarget.style.color = GOLD; } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--s-border, rgba(245,240,232,0.07))'; e.currentTarget.style.color = aiLoading === action ? GOLD : 'var(--s-muted, rgba(245,240,232,0.45))'; }}
    >
      {aiLoading === action ? '⟳ Working…' : label}
    </button>
  );

  const warnings = [];
  if (!formData.excerpt)           warnings.push({ type: 'warn', msg: 'Missing excerpt — required for meta description fallback' });
  if (!formData.coverImage)         warnings.push({ type: 'warn', msg: 'Missing cover image — affects OG sharing appearance' });
  if (wc < 300 && (formData.content || []).length > 0) warnings.push({ type: 'error', msg: `Thin content — only ${wc} words. Aim for 400+` });
  if (!formData.tags?.length)       warnings.push({ type: 'warn', msg: 'No tags — add 3–5 tags to aid discoverability' });
  if (formData.seoTitle && formData.seoTitle.length > 60)
    warnings.push({ type: 'warn', msg: `SEO title is ${formData.seoTitle.length} chars — keep under 60` });
  if (formData.metaDescription && formData.metaDescription.length > 155)
    warnings.push({ type: 'warn', msg: `Meta description is ${formData.metaDescription.length} chars — keep under 155` });
  if (!formData.seoTitle && !formData.title) warnings.push({ type: 'warn', msg: 'No SEO title — will fall back to article title' });

  return (
    <div>
      {/* Content stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
        background: 'var(--s-input-bg, rgba(245,240,232,0.04))', border: '1px solid var(--s-border, rgba(245,240,232,0.07))',
        borderRadius: 2, padding: 12, marginBottom: 16,
      }}>
        {[
          { label: 'Word Count', value: wc.toLocaleString() },
          { label: 'Reading Time', value: `~${rt} min` },
          { label: 'Content Blocks', value: (formData.content || []).length },
          { label: 'Tags', value: formData.tags?.length || 0 },
        ].map(s => (
          <div key={s.label}>
            <div style={{ fontFamily: FU, fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--s-muted, rgba(245,240,232,0.45))' }}>{s.label}</div>
            <div style={{ fontFamily: FD, fontSize: 18, color: 'var(--s-text, #f5f0e8)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {warnings.map((w, i) => (
            <div key={i} style={{
              display: 'flex', gap: 8, alignItems: 'flex-start',
              padding: '8px 10px', marginBottom: 4,
              background: `${w.type === 'error' ? 'var(--s-error, #e05555)' : 'var(--s-warn, #d4a843)'}12`,
              border: `1px solid ${w.type === 'error' ? 'var(--s-error, #e05555)' : 'var(--s-warn, #d4a843)'}40`,
              borderRadius: 2,
            }}>
              <span style={{ color: w.type === 'error' ? 'var(--s-error, #e05555)' : 'var(--s-warn, #d4a843)', flexShrink: 0, fontSize: 11 }}>
                {w.type === 'error' ? '✕' : '⚠'}
              </span>
              <span style={{ fontFamily: FU, fontSize: 10, color: 'var(--s-text, #f5f0e8)', lineHeight: 1.4 }}>{w.msg}</span>
            </div>
          ))}
        </div>
      )}
      {warnings.length === 0 && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 10px', marginBottom: 16, background: 'color-mix(in srgb, var(--s-success, #5aaa78) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--s-success, #5aaa78) 40%, transparent)', borderRadius: 2 }}>
          <span style={{ color: 'var(--s-success, #5aaa78)' }}>✓</span>
          <span style={{ fontFamily: FU, fontSize: 10, color: 'var(--s-text, #f5f0e8)' }}>SEO looks good — no issues found</span>
        </div>
      )}

      <Divider />
      <SectionLabel>Search Engine</SectionLabel>
      <Field label="SEO Title" hint="Defaults to article title if blank — keep under 60 characters">
        <Input value={formData.seoTitle} onChange={v => upd('seoTitle', v)} placeholder={formData.title || 'SEO title…'} />
        {formData.seoTitle && (
          <div style={{ fontFamily: FU, fontSize: 9, color: formData.seoTitle.length > 60 ? 'var(--s-warn, #d4a843)' : 'var(--s-muted, rgba(245,240,232,0.45))', marginTop: 3 }}>
            {formData.seoTitle.length}/60
          </div>
        )}
        {aiBtn('generate-seo-title', '✦ Generate SEO Title')}
      </Field>
      <Field label="Meta Description" hint="Keep under 155 characters">
        <Textarea value={formData.metaDescription} onChange={v => upd('metaDescription', v)} placeholder={formData.excerpt || 'Meta description…'} minHeight={60} />
        {formData.metaDescription && (
          <div style={{ fontFamily: FU, fontSize: 9, color: formData.metaDescription.length > 155 ? 'var(--s-warn, #d4a843)' : 'var(--s-muted, rgba(245,240,232,0.45))', marginTop: 3 }}>
            {formData.metaDescription.length}/155
          </div>
        )}
        {aiBtn('generate-meta', '✦ Generate Meta Description')}
      </Field>

      {aiError && (
        <div style={{ padding: '8px 10px', marginBottom: 10, background: 'var(--s-warn, #d4a843)12', border: '1px solid var(--s-warn, #d4a843)40', borderRadius: 2, fontFamily: FU, fontSize: 9, color: 'var(--s-text, #f5f0e8)', lineHeight: 1.4 }}>
          ⚠ {aiError}
        </div>
      )}

      <Divider />
      <SectionLabel>Open Graph (Social Sharing)</SectionLabel>
      <Field label="OG Title">
        <Input value={formData.ogTitle} onChange={v => upd('ogTitle', v)} placeholder={formData.seoTitle || formData.title || 'OG title…'} />
      </Field>
      <Field label="OG Description">
        <Textarea value={formData.ogDescription} onChange={v => upd('ogDescription', v)} placeholder={formData.metaDescription || formData.excerpt || 'OG description…'} minHeight={60} />
      </Field>
      <Field label="OG Image URL" hint="1200×630px recommended for social sharing">
        <Input value={formData.ogImage} onChange={v => upd('ogImage', v)} placeholder={formData.coverImage || 'https://…'} />
        {(formData.ogImage || formData.coverImage) && (
          <img src={formData.ogImage || formData.coverImage} alt="" style={{ width: '100%', aspectRatio: '1200/630', objectFit: 'cover', marginTop: 8, borderRadius: 2 }} />
        )}
      </Field>
    </div>
  );
}

// ── AI panel ──────────────────────────────────────────────────────────────────
function AIPanel({ formData, onChange, tone, onToneChange }) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');

  const upd = (key, val) => onChange({ ...formData, [key]: val });

  const runAI = async (action) => {
    setLoading(action);
    setError('');
    try {
      const context = {
        title: formData.title,
        category: formData.categoryLabel || formData.category,
        excerpt: formData.excerpt,
        tone,
        content: (formData.content || [])
          .filter(b => b.text)
          .map(b => b.text)
          .join('\n\n')
          .slice(0, 800),
      };

      const prompts = {
        'generate-excerpt':    `Write a 1–2 sentence excerpt for this ${context.tone} magazine article titled "${context.title}" in the ${context.category} category. Return only the excerpt text.`,
        'generate-seo-title':  `Write an SEO-optimised title (under 60 chars) for a ${context.tone} article titled "${context.title}". Return only the title.`,
        'generate-meta':       `Write a meta description (under 155 chars) for this article titled "${context.title}". Excerpt: ${context.excerpt}. Return only the meta description.`,
        'generate-tags':       `Generate 5–8 relevant SEO tags for an article titled "${context.title}" in ${context.category}. Return comma-separated tags only.`,
        'improve-tone':        `Rewrite this text in a ${context.tone} luxury editorial tone:\n\n${context.content.slice(0, 400)}\n\nReturn improved version only.`,
      };

      const prompt = prompts[action];
      if (!prompt) { setLoading(null); return; }

      // Try to use the configured AI provider via edge function
      const { data, error: fnErr } = await import('../../lib/supabaseClient').then(m =>
        m.supabase.functions.invoke('ai-generate', { body: { prompt, model: 'auto', maxTokens: 300 } })
      ).catch(() => ({ data: null, error: new Error('AI not configured') }));

      if (fnErr || !data?.text) {
        // Fallback: show user what to do
        setError('AI provider not configured. Go to Admin → AI Settings to connect OpenAI or Anthropic.');
        setLoading(null);
        return;
      }

      const result = data.text.trim();
      if (action === 'generate-excerpt')   upd('excerpt', result);
      if (action === 'generate-seo-title') upd('seoTitle', result);
      if (action === 'generate-meta')      upd('metaDescription', result);
      if (action === 'generate-tags')      upd('tags', result.split(',').map(t => t.trim()).filter(Boolean));
    } catch (e) {
      setError('AI unavailable. Configure your AI provider in Admin → AI Settings.');
    }
    setLoading(null);
  };

  const aiBtn = (action, label) => (
    <button
      key={action}
      onClick={() => runAI(action)}
      disabled={!!loading}
      style={{
        fontFamily: FU, fontSize: 9, fontWeight: 600, letterSpacing: '0.08em',
        textTransform: 'uppercase', background: S.inputBg,
        border: `1px solid ${S.border}`, color: loading === action ? GOLD : S.text,
        padding: '8px 10px', borderRadius: 2, cursor: loading ? 'default' : 'pointer',
        opacity: loading && loading !== action ? 0.5 : 1, transition: 'all 0.15s', textAlign: 'left',
      }}
      onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = `${GOLD}60`; e.currentTarget.style.color = GOLD; } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = S.border; e.currentTarget.style.color = loading === action ? GOLD : S.text; }}
    >
      {loading === action ? '⟳ Working…' : label}
    </button>
  );

  return (
    <div>
      <SectionLabel>Tone Settings</SectionLabel>
      <Field label="Writing Tone" hint="Applied to all AI generation for this article">
        <Select
          value={tone}
          onChange={onToneChange}
          options={TONE_OPTIONS.map(t => ({ value: t, label: t }))}
        />
      </Field>

      <Divider />
      <SectionLabel>Generate Content</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
        {aiBtn('generate-excerpt',   '✦ Generate Excerpt')}
        {aiBtn('generate-seo-title', '✦ Generate SEO Title')}
        {aiBtn('generate-meta',      '✦ Generate Meta Description')}
        {aiBtn('generate-tags',      '✦ Generate Tags')}
        {aiBtn('improve-tone',       '✦ Improve Luxury Tone')}
      </div>

      {error && (
        <div style={{ padding: '10px 12px', background: `${S.warn}12`, border: `1px solid ${S.warn}40`, borderRadius: 2, fontFamily: FU, fontSize: 10, color: S.text, lineHeight: 1.5 }}>
          ⚠ {error}
        </div>
      )}

      <Divider />
      <div style={{ fontFamily: FU, fontSize: 10, color: S.muted, lineHeight: 1.6 }}>
        AI generation uses the provider configured in Admin → AI Settings.<br />
        Block-level rewriting (expand, shorten, humanise) coming in the next update.
      </div>
    </div>
  );
}

// ── Publish panel — final workflow step ───────────────────────────────────────
function PublishPanel({ formData, onChange, onPublish, onUnpublish, onSave, onDuplicate, saving }) {
  const upd = (key, val) => onChange({ ...formData, [key]: val });
  const wc  = computeWordCount(formData.content);

  // Pre-publish checklist items
  const checks = [
    { label: 'Title set',                  ok: !!formData.title },
    { label: 'Cover image added',          ok: !!formData.coverImage },
    { label: 'Hero image alt text',        ok: !!formData.coverImageAlt },
    { label: 'Hero style configured',      ok: formData.heroStyle && formData.heroStyle !== 'editorial' || !!formData.coverImage },
    { label: 'Excerpt written',            ok: !!formData.excerpt },
    { label: 'Content blocks added',       ok: (formData.content || []).length > 0 },
    { label: 'SEO title set',              ok: !!formData.seoTitle },
    { label: 'Category assigned',          ok: !!formData.category },
  ];
  const passCount = checks.filter(c => c.ok).length;
  const allPassed = passCount === checks.length;

  // Status
  const isPublished = formData.published;
  const isScheduled = !isPublished && formData.scheduledDate && new Date(formData.scheduledDate) > new Date();

  return (
    <div>
      {/* Progress indicator */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
        padding: '12px 14px', borderRadius: 2,
        background: allPassed
          ? 'color-mix(in srgb, var(--s-success, #5aaa78) 10%, transparent)'
          : 'var(--s-input-bg, rgba(245,240,232,0.04))',
        border: `1px solid ${allPassed
          ? 'color-mix(in srgb, var(--s-success, #5aaa78) 40%, transparent)'
          : 'var(--s-border, rgba(245,240,232,0.07))'}`,
      }}>
        <span style={{ fontFamily: FD, fontSize: 22, color: allPassed ? 'var(--s-success, #5aaa78)' : GOLD }}>
          {allPassed ? '✓' : `${passCount}/${checks.length}`}
        </span>
        <div>
          <div style={{ fontFamily: FU, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--s-text, #f5f0e8)' }}>
            {allPassed ? 'Ready to Publish' : 'Pre-publish Checklist'}
          </div>
          <div style={{ fontFamily: FU, fontSize: 9, color: 'var(--s-muted, rgba(245,240,232,0.45))', marginTop: 2 }}>
            {allPassed ? 'All checks complete — article is ready' : `${passCount} of ${checks.length} checks complete`}
          </div>
        </div>
      </div>

      {/* Checklist items */}
      <div style={{ marginBottom: 20 }}>
        {checks.map((c, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0',
            borderBottom: i < checks.length - 1 ? '1px solid var(--s-border, rgba(245,240,232,0.07))' : 'none',
          }}>
            <span style={{ fontSize: 12, color: c.ok ? 'var(--s-success, #5aaa78)' : 'var(--s-error, #e05555)', flexShrink: 0, width: 16, textAlign: 'center' }}>
              {c.ok ? '✓' : '✕'}
            </span>
            <span style={{ fontFamily: FU, fontSize: 10, color: c.ok ? 'var(--s-text, #f5f0e8)' : 'var(--s-muted, rgba(245,240,232,0.45))' }}>
              {c.label}
            </span>
          </div>
        ))}
      </div>

      <Divider />

      {/* Current status */}
      <SectionLabel>Status</SectionLabel>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 10px', borderRadius: 2, marginBottom: 16,
        background: isPublished
          ? 'color-mix(in srgb, var(--s-success, #5aaa78) 12%, transparent)'
          : isScheduled
            ? 'color-mix(in srgb, var(--s-info, #5b8dd9) 12%, transparent)'
            : 'var(--s-input-bg, rgba(245,240,232,0.04))',
        border: `1px solid ${isPublished
          ? 'color-mix(in srgb, var(--s-success, #5aaa78) 40%, transparent)'
          : isScheduled
            ? 'color-mix(in srgb, var(--s-info, #5b8dd9) 40%, transparent)'
            : 'var(--s-border, rgba(245,240,232,0.07))'}`,
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: isPublished ? 'var(--s-success, #5aaa78)' : isScheduled ? 'var(--s-info, #5b8dd9)' : 'var(--s-muted, rgba(245,240,232,0.45))' }} />
        <span style={{ fontFamily: FU, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--s-text, #f5f0e8)' }}>
          {isPublished ? 'Published' : isScheduled ? 'Scheduled' : 'Draft'}
        </span>
        {isPublished && formData.publishedAt && (
          <span style={{ fontFamily: FU, fontSize: 9, color: 'var(--s-muted, rgba(245,240,232,0.45))' }}>
            · {new Date(formData.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        )}
      </div>

      <Divider />

      {/* Visibility toggles */}
      <SectionLabel>Visibility</SectionLabel>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 16 }}>
        <Toggle value={formData.featured} onChange={v => upd('featured', v)} label="Featured" />
        <Toggle value={formData.trending} onChange={v => upd('trending', v)} label="Trending" />
        <Toggle value={formData.editorsChoice} onChange={v => upd('editorsChoice', v)} label="Editor's Choice" />
      </div>

      <Divider />

      {/* Schedule */}
      <SectionLabel>Schedule</SectionLabel>
      <Field label="Scheduled Publish Date" hint="Leave empty to publish manually">
        <input
          type="datetime-local"
          value={formData.scheduledDate ? new Date(formData.scheduledDate).toISOString().slice(0, 16) : ''}
          onChange={e => upd('scheduledDate', e.target.value ? new Date(e.target.value).toISOString() : null)}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'var(--s-input-bg, rgba(245,240,232,0.04))',
            border: '1px solid var(--s-input-border, rgba(245,240,232,0.1))',
            color: 'var(--s-text, #f5f0e8)',
            fontFamily: FU, fontSize: 12, padding: '8px 10px', borderRadius: 2, outline: 'none',
            colorScheme: 'dark',
          }}
        />
      </Field>

      <Divider />

      {/* Publish actions */}
      <SectionLabel>Actions</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        {!isPublished ? (
          <GoldBtn onClick={onPublish} disabled={saving} style={{ gridColumn: 'span 2' }}>
            {saving ? 'Publishing…' : '↑ Publish Now'}
          </GoldBtn>
        ) : (
          <GhostBtn onClick={onUnpublish} disabled={saving} style={{ gridColumn: 'span 2', color: 'var(--s-warn, #d4a843)', borderColor: 'var(--s-warn, #d4a843)' }}>
            {saving ? 'Unpublishing…' : '↓ Unpublish'}
          </GhostBtn>
        )}
        <GhostBtn onClick={() => onSave()} disabled={saving}>
          {saving ? 'Saving…' : 'Save Draft'}
        </GhostBtn>
        <GhostBtn onClick={onDuplicate}>
          Duplicate
        </GhostBtn>
      </div>

      <Divider />

      {/* Permalink */}
      <SectionLabel>Permalink</SectionLabel>
      <div style={{
        fontFamily: 'monospace', fontSize: 11, color: GOLD,
        background: 'var(--s-input-bg, rgba(245,240,232,0.04))',
        border: '1px solid var(--s-border, rgba(245,240,232,0.07))',
        borderRadius: 2, padding: '8px 10px', wordBreak: 'break-all',
      }}>
        /magazine/{formData.slug || 'untitled'}
      </div>

      {/* Content stats */}
      <Divider />
      <SectionLabel>Content Stats</SectionLabel>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
        background: 'var(--s-input-bg, rgba(245,240,232,0.04))',
        border: '1px solid var(--s-border, rgba(245,240,232,0.07))',
        borderRadius: 2, padding: 12,
      }}>
        {[
          { label: 'Words', value: wc.toLocaleString() },
          { label: 'Reading Time', value: `~${computeReadingTime(wc)} min` },
          { label: 'Blocks', value: (formData.content || []).length },
        ].map(s => (
          <div key={s.label}>
            <div style={{ fontFamily: FU, fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--s-muted, rgba(245,240,232,0.45))' }}>{s.label}</div>
            <div style={{ fontFamily: FD, fontSize: 18, color: 'var(--s-text, #f5f0e8)' }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Internal links panel ───────────────────────────────────────────────────────
function LinksPanel({ formData }) {
  const allCats = useAllCategories();
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const related = getRelatedPosts(formData, 5);

  const copyMarkdown = () => {
    const md = `[${linkText || 'Link text'}](${linkUrl})`;
    navigator.clipboard?.writeText(md).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <SectionLabel>Suggested Related Articles</SectionLabel>
      {related.length > 0 ? (
        <div style={{ marginBottom: 16 }}>
          {related.map(post => (
            <div key={post.id} style={{
              display: 'flex', gap: 10, padding: '8px 0',
              borderBottom: `1px solid ${S.border}`,
            }}>
              <img src={post.coverImage} alt="" style={{ width: 44, height: 32, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD, marginBottom: 2 }}>
                  {post.categoryLabel}
                </div>
                <div style={{ fontFamily: FD, fontSize: 13, color: S.text, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {post.title}
                </div>
              </div>
              <button
                onClick={() => { setLinkText(post.title); setLinkUrl(`/magazine/${post.slug}`); }}
                style={{ flexShrink: 0, background: 'none', border: `1px solid ${S.border}`, color: S.muted, fontFamily: FU, fontSize: 8, padding: '3px 8px', cursor: 'pointer', borderRadius: 1 }}
                onMouseEnter={e => { e.currentTarget.style.color = GOLD; e.currentTarget.style.borderColor = `${GOLD}50`; }}
                onMouseLeave={e => { e.currentTarget.style.color = S.muted; e.currentTarget.style.borderColor = S.border; }}
              >
                Use
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontFamily: FU, fontSize: 10, color: S.muted, marginBottom: 16 }}>
          No related articles found in this category.
        </div>
      )}

      <Divider />
      <SectionLabel>Category Links</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 16 }}>
        {allCats.map(cat => (
          <button
            key={cat.id}
            onClick={() => { setLinkText(cat.label); setLinkUrl(`/magazine/category/${cat.id}`); }}
            style={{
              background: S.inputBg, border: `1px solid ${S.border}`,
              borderRadius: 2, padding: '6px 8px', textAlign: 'left',
              cursor: 'pointer', fontFamily: FU, fontSize: 9, color: S.text, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = S.gold; e.currentTarget.style.color = S.gold; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = S.border; e.currentTarget.style.color = S.text; }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <Divider />
      <SectionLabel>Manual Link</SectionLabel>
      <Field label="Link Text">
        <Input value={linkText} onChange={setLinkText} placeholder="Anchor text" />
      </Field>
      <Field label="URL">
        <Input value={linkUrl} onChange={setLinkUrl} placeholder="/magazine/article-slug or https://…" />
      </Field>
      {(linkText || linkUrl) && (
        <div style={{ background: S.inputBg, border: `1px solid ${S.border}`, borderRadius: 2, padding: 10, marginBottom: 10, fontFamily: 'monospace', fontSize: 11, color: S.gold, wordBreak: 'break-all' }}>
          [{linkText || 'text'}]({linkUrl || 'url'})
        </div>
      )}
      <GhostBtn onClick={copyMarkdown} small>
        {copied ? '✓ Copied' : 'Copy as Markdown'}
      </GhostBtn>

      <Divider />
      <div style={{ fontFamily: FU, fontSize: 10, color: S.muted, lineHeight: 1.6 }}>
        Vendor & venue link suggestions — coming soon.<br />
        Will surface relevant listings from the directory automatically.
      </div>
    </div>
  );
}

// ── Article live preview ───────────────────────────────────────────────────────
function ArticlePreview({ formData, isLight, viewport, onBlockClick, selectedBlockIdx }) {
  const previewS = isLight ? { text: '#1a1806', bg: '#fafaf8', muted: 'rgba(30,28,22,0.45)', border: 'rgba(30,28,22,0.08)' } : { text: '#f5f0e8', bg: '#0d0d0b', muted: 'rgba(245,240,232,0.45)', border: 'color-mix(in srgb, #c9a96e 10%, transparent)' };
  const TP  = previewS.text;
  const TBG = previewS.bg;
  const TM  = previewS.muted;
  const TB  = previewS.border;

  const vpWidth  = viewport === 'mobile' ? 390 : viewport === 'tablet' ? 768 : null;
  const vpScale  = viewport === 'mobile' ? 0.55 : viewport === 'tablet' ? 0.72 : 1;

  const heroStyle    = formData.heroStyle || 'editorial';
  const heroHeightPx = { standard: 340, tall: 480, fullscreen: '100vh' }[formData.heroHeight || 'standard'];
  const overlayOp    = ((formData.heroOverlayOpacity ?? 60) / 100).toFixed(2);
  const titlePos     = formData.heroTitlePosition || 'bottom';

  // Shared text block renderer
  const heroText = (dark = true) => {
    const tc  = dark ? '#f5f0e8' : TP;
    const tmc = dark ? 'color-mix(in srgb, #f5f0e8 60%, transparent)' : TM;
    const tsd = dark ? 'color-mix(in srgb, #f5f0e8 75%, transparent)' : TM;
    const dt  = formData.date ? new Date(formData.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
    return (
      <>
        {formData.categoryLabel && (
          <div style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--s-gold, #c9a96e)', marginBottom: 8, ...themeVars(isLight) }}>
            — {formData.categoryLabel}
          </div>
        )}
        <h1 style={{ fontFamily: FD, fontSize: 'clamp(18px,3vw,32px)', fontWeight: 400, color: tc, margin: '0 0 10px', lineHeight: 1.1 }}>
          {formData.title || 'Untitled Article'}
        </h1>
        {formData.standfirst && (
          <p style={{ fontFamily: FD, fontSize: 13, fontStyle: 'italic', color: tsd, margin: '0 0 10px', lineHeight: 1.5, maxWidth: 520 }}>
            {formData.standfirst}
          </p>
        )}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {formData.author?.name && <span style={{ fontFamily: FU, fontSize: 10, color: tmc }}>{formData.author.name}</span>}
          {dt && <span style={{ fontFamily: FU, fontSize: 10, color: dark ? 'color-mix(in srgb, #f5f0e8 40%, transparent)' : TM }}>{dt}</span>}
          {formData.readingTime && <span style={{ fontFamily: FU, fontSize: 10, color: dark ? 'color-mix(in srgb, #f5f0e8 35%, transparent)' : TM }}>{formData.readingTime} min</span>}
        </div>
      </>
    );
  };

  // Title position mapping for overlays
  const overlayTextPos = titlePos === 'bottom'
    ? { bottom: 0 }
    : titlePos === 'top'
      ? { top: 0 }
      : { top: '50%', transform: 'translateY(-50%)' };

  // HeroBg — video takes priority; falls back to image; falls back to solid colour
  const heroBgStyle = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' };
  const iframeBgStyle = { position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', pointerEvents: 'none' };
  const videoEmbed = getVideoEmbed(formData.heroVideoUrl);
  const HeroBg = ({ fallbackColor = '#0a0a0a' }) => {
    if (videoEmbed?.type === 'direct') return <video src={videoEmbed.embedUrl} autoPlay muted loop playsInline style={heroBgStyle} />;
    if (videoEmbed) return <iframe src={videoEmbed.embedUrl} allow="autoplay; encrypted-media" style={iframeBgStyle} title="Hero video" />;
    if (formData.coverImage)   return <img src={formData.coverImage} alt={formData.coverImageAlt || ''} style={heroBgStyle} />;
    return <div style={{ ...heroBgStyle, background: fallbackColor }} />;
  };

  const previewContent = (
    <div style={{ background: TBG, minHeight: '100%' }}>
      {/* Cover hero — click to open hero panel */}
      <div
        onClick={() => onBlockClick?.(-1)}
        style={{ cursor: onBlockClick ? 'pointer' : 'default', outline: selectedBlockIdx === -1 ? `2px solid color-mix(in srgb, #c9a96e 70%, transparent)` : '2px solid transparent', outlineOffset: -2, transition: 'outline 0.15s' }}
      >
      {/* Cover hero — style variants */}
      {heroStyle === 'editorial' && (
        (formData.coverImage || formData.heroVideoUrl) ? (
          <div style={{ position: 'relative', height: heroHeightPx, overflow: 'hidden' }}>
            <HeroBg />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, color-mix(in srgb, #000 ${overlayOp * 100}%, transparent) 0%, color-mix(in srgb, #000 ${(overlayOp * 0.35) * 100}%, transparent) 50%, transparent 100%)` }} />
            <div style={{ position: 'absolute', left: 0, right: 0, padding: '24px 32px', ...overlayTextPos }}>
              {heroText(true)}
            </div>
          </div>
        ) : (
          <div style={{ background: TBG, padding: '40px 32px 32px', borderBottom: `1px solid ${TB}` }}>
            {heroText(true)}
          </div>
        )
      )}

      {heroStyle === 'split' && (
        <div style={{ display: 'flex', height: heroHeightPx, overflow: 'hidden' }}>
          <div style={{ flex: 1, background: TBG, padding: '32px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
            {heroText(true)}
          </div>
          <div style={{ flex: 1, flexShrink: 0, background: TBG, overflow: 'hidden', position: 'relative' }}>
            <HeroBg fallbackColor={TBG} />
          </div>
        </div>
      )}

      {heroStyle === 'cinematic' && (
        <div style={{ position: 'relative', height: heroHeightPx, overflow: 'hidden' }}>
          <HeroBg />
          <div style={{ position: 'absolute', inset: 0, background: `color-mix(in srgb, #000 ${overlayOp * 100}%, transparent)` }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px 40px' }}>
            {heroText(true)}
          </div>
        </div>
      )}

      {heroStyle === 'minimal' && (
        <div style={{ background: TBG, padding: '60px 40px 40px', borderBottom: `1px solid ${TB}`, textAlign: 'center' }}>
          {heroText(false)}
        </div>
      )}

      {heroStyle === 'banner' && (
        <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
          <HeroBg />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, color-mix(in srgb, #000 70%, transparent) 0%, color-mix(in srgb, #000 20%, transparent) 100%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 24px' }}>
            {heroText(true)}
          </div>
        </div>
      )}

      </div>{/* end hero click wrapper */}

      {/* Article body — each block wrapped for click-to-select */}
      <div style={{ padding: 'clamp(20px,3vw,48px) clamp(16px,3vw,40px)' }}>
        {(formData.content || []).length === 0 ? (
          <div style={{ fontFamily: FU, fontSize: 11, color: TM, padding: '40px 0', textAlign: 'center' }}>
            Add content blocks to see your article preview.
          </div>
        ) : (formData.content || []).map((block, i) => (
          <div
            key={i}
            onClick={() => onBlockClick?.(i)}
            style={{
              cursor: onBlockClick ? 'pointer' : 'default',
              outline: selectedBlockIdx === i ? `2px solid ${GOLD}70` : '2px solid transparent',
              outlineOffset: 3, borderRadius: 2, transition: 'outline 0.15s',
            }}
            onMouseEnter={e => { if (onBlockClick && selectedBlockIdx !== i) e.currentTarget.style.outline = `2px solid ${GOLD}30`; }}
            onMouseLeave={e => { if (onBlockClick && selectedBlockIdx !== i) e.currentTarget.style.outline = '2px solid transparent'; }}
          >
            <ArticleBody content={[block]} isLight={isLight} />
          </div>
        ))}
      </div>
    </div>
  );

  if (vpWidth) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0', minHeight: '100%' }}>
        <div style={{
          width: vpWidth, maxWidth: '100%',
          boxShadow: '0 4px 32px rgba(0,0,0,0.5)',
          borderRadius: viewport === 'mobile' ? 12 : 4,
          overflow: 'hidden', flexShrink: 0,
        }}>
          {previewContent}
        </div>
      </div>
    );
  }

  return previewContent;
}

// ── Hero-only live preview (used in Hero tab) ─────────────────────────────────
function HeroPreviewPane({ formData, isLight }) {
  const TBG = isLight ? '#fafaf8' : '#0d0d0b';
  const TP  = isLight ? '#1a1806' : '#f5f0e8';
  const TM  = isLight ? 'rgba(30,28,22,0.45)' : 'rgba(245,240,232,0.45)';
  const TB  = isLight ? 'rgba(30,28,22,0.08)' : 'rgba(201,169,110,0.1)';

  const heroStyle    = formData.heroStyle || 'editorial';
  const heroHeightPx = { standard: 320, tall: 460, fullscreen: 500 }[formData.heroHeight || 'standard'] || 320;
  const overlayOp    = ((formData.heroOverlayOpacity ?? 60) / 100).toFixed(2);
  const titlePos     = formData.heroTitlePosition || 'bottom';

  const overlayTextPos = titlePos === 'bottom'
    ? { bottom: 0 }
    : titlePos === 'top'
      ? { top: 0 }
      : { top: '50%', transform: 'translateY(-50%)' };

  const heroBgSt = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' };
  const iframeSt = { position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', pointerEvents: 'none' };
  const videoEmbed2 = getVideoEmbed(formData.heroVideoUrl);
  const HeroBg2 = ({ fallbackColor = '#0a0a0a' }) => {
    if (videoEmbed2?.type === 'direct') return <video src={videoEmbed2.embedUrl} autoPlay muted loop playsInline style={heroBgSt} />;
    if (videoEmbed2) return <iframe src={videoEmbed2.embedUrl} allow="autoplay; encrypted-media" style={iframeSt} title="Hero video" />;
    if (formData.coverImage)   return <img src={formData.coverImage} alt={formData.coverImageAlt || ''} style={heroBgSt} />;
    return <div style={{ ...heroBgSt, background: fallbackColor }} />;
  };

  const heroTextPreview = (dark = true) => {
    const tc  = dark ? '#f5f0e8' : TP;
    const tmc = dark ? 'rgba(245,240,232,0.6)' : TM;
    const tsd = dark ? 'rgba(245,240,232,0.75)' : TM;
    const dt  = formData.date ? new Date(formData.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
    return (
      <>
        {formData.categoryLabel && (
          <div style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--s-gold, #c9a96e)', marginBottom: 8, ...themeVars(isLight) }}>
            — {formData.categoryLabel}
          </div>
        )}
        <h1 style={{ fontFamily: FD, fontSize: 'clamp(16px,2.8vw,26px)', fontWeight: 400, color: tc, margin: '0 0 8px', lineHeight: 1.1 }}>
          {formData.title || 'Untitled Article'}
        </h1>
        {formData.standfirst && (
          <p style={{ fontFamily: FD, fontSize: 12, fontStyle: 'italic', color: tsd, margin: '0 0 8px', lineHeight: 1.5, maxWidth: 480 }}>
            {formData.standfirst}
          </p>
        )}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {formData.author?.name && <span style={{ fontFamily: FU, fontSize: 9, color: tmc }}>{formData.author.name}</span>}
          {dt && <span style={{ fontFamily: FU, fontSize: 9, color: dark ? 'rgba(245,240,232,0.4)' : TM }}>{dt}</span>}
          {formData.readingTime && <span style={{ fontFamily: FU, fontSize: 9, color: dark ? 'rgba(245,240,232,0.35)' : TM }}>{formData.readingTime} min read</span>}
        </div>
      </>
    );
  };

  return (
    <div style={{ borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(201,169,110,0.2)' }}>
      {heroStyle === 'editorial' && (
        (formData.coverImage || formData.heroVideoUrl) ? (
          <div style={{ position: 'relative', height: heroHeightPx, overflow: 'hidden' }}>
            <HeroBg2 />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, color-mix(in srgb, #000 ${overlayOp * 100}%, transparent) 0%, color-mix(in srgb, #000 ${(overlayOp * 0.35) * 100}%, transparent) 50%, transparent 100%)` }} />
            <div style={{ position: 'absolute', left: 0, right: 0, padding: '20px 24px', ...overlayTextPos }}>
              {heroTextPreview(true)}
            </div>
          </div>
        ) : (
          <div style={{ background: '#0a0a0a', padding: '32px 24px 24px', borderBottom: `1px solid ${TB}` }}>
            {heroTextPreview(true)}
          </div>
        )
      )}
      {heroStyle === 'split' && (
        <div style={{ display: 'flex', height: heroHeightPx, overflow: 'hidden' }}>
          <div style={{ flex: 1, background: '#0a0a0a', padding: '24px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
            {heroTextPreview(true)}
          </div>
          <div style={{ flex: 1, flexShrink: 0, background: '#111', overflow: 'hidden', position: 'relative' }}>
            <HeroBg2 fallbackColor="#1a1a16" />
          </div>
        </div>
      )}
      {heroStyle === 'cinematic' && (
        <div style={{ position: 'relative', height: heroHeightPx, overflow: 'hidden' }}>
          <HeroBg2 />
          <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${overlayOp})` }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px 36px' }}>
            {heroTextPreview(true)}
          </div>
        </div>
      )}
      {heroStyle === 'minimal' && (
        <div style={{ background: TBG, padding: '40px 32px 32px', borderBottom: `1px solid ${TB}`, textAlign: 'center' }}>
          {heroTextPreview(false)}
        </div>
      )}
      {heroStyle === 'banner' && (
        <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
          <HeroBg2 />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 100%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 20px' }}>
            {heroTextPreview(true)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step navigation — Next / Previous buttons at bottom of each panel ─────────
function StepNav({ activeTab, onTabChange }) {
  const idx = TABS.findIndex(t => t.id === activeTab);
  const prev = idx > 0 ? TABS[idx - 1] : null;
  const next = idx < TABS.length - 1 ? TABS[idx + 1] : null;

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginTop: 28, paddingTop: 16,
      borderTop: '1px solid var(--s-border, rgba(245,240,232,0.07))',
    }}>
      {prev ? (
        <GhostBtn small onClick={() => onTabChange(prev.id)}>
          ← {prev.label}
        </GhostBtn>
      ) : <div />}
      <div style={{ fontFamily: FU, fontSize: 8, color: 'var(--s-muted, rgba(245,240,232,0.45))', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Step {idx + 1} of {TABS.length}
      </div>
      {next ? (
        <GoldBtn small onClick={() => onTabChange(next.id)}>
          {next.label} →
        </GoldBtn>
      ) : <div />}
    </div>
  );
}

// ── Main ArticleEditor ─────────────────────────────────────────────────────────
const TABS = [
  { id: 'hero',    label: '1 · Hero',     step: 1 },
  { id: 'content', label: '2 · Content',  step: 2 },
  { id: 'meta',    label: '3 · Metadata', step: 3 },
  { id: 'seo',     label: '4 · SEO',      step: 4 },
  { id: 'publish', label: '5 · Publish',  step: 5 },
];

export default function ArticleEditor({ initialPost, onBack, onSaveToParent, saving = false, isLight = false }) {
  const [editorLight, setEditorLight] = useState(isLight);
  const S = getS(editorLight);
  const [formData, setFormData]     = useState(() => JSON.parse(JSON.stringify(initialPost)));
  const [activeTab, setActiveTab]   = useState('hero');
  const [previewLight, setPreviewLight] = useState(true);
  const [tone, setTone]             = useState(initialPost.tone || 'Luxury Editorial');
  const [dirty, setDirty]           = useState(false);
  const [lastSaved, setLastSaved]   = useState(null);
  const [saveLabel, setSaveLabel]   = useState(null);
  const [showTemplate, setShowTemplate] = useState((initialPost.content || []).length === 0);
  const [viewMode, setViewMode]     = useState('split'); // 'split' | 'editor' | 'preview'
  const [viewport, setViewport]     = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [openIndices, setOpenIndices] = useState(() => {
    const s = new Set();
    (initialPost?.content || []).forEach((b, i) => {
      if (b.type === 'intro' || b.type === 'body_wysiwyg') s.add(i);
    });
    if (s.size === 0) s.add(0);
    return s;
  });
  const [selectedBlockIdx, setSelectedBlockIdx] = useState(null);
  const autosaveRef = useRef(null);

  const updateForm = useCallback(data => {
    setFormData(data);
    setDirty(true);
  }, []);

  const save = useCallback(async (data = formData) => {
    setSaveLabel('Saving…');
    const result = await onSaveToParent({ ...data, tone });
    // Sync the real DB UUID into formData on the first save of a static post
    if (result?.savedId && result.savedId !== data.id) {
      setFormData(fd => ({ ...fd, id: result.savedId }));
    }
    setDirty(false);
    setLastSaved(new Date());
    setSaveLabel('✓ Saved');
    setTimeout(() => setSaveLabel(null), 2500);
  }, [formData, tone, onSaveToParent]);

  const publish = async () => {
    const updated = { ...formData, published: true, publishedAt: new Date().toISOString(), tone };
    setFormData(updated);
    await save(updated);
  };

  const unpublish = async () => {
    const updated = { ...formData, published: false, tone };
    setFormData(updated);
    await save(updated);
  };

  const duplicate = () => {
    const dup = { ...formData, slug: `${formData.slug}-copy`, title: `${formData.title} (Copy)`, published: false };
    onSaveToParent(dup, true);
  };

  // Autosave every 25s if dirty
  useEffect(() => {
    autosaveRef.current = setInterval(() => {
      setDirty(d => {
        if (d) {
          setFormData(fd => { save(fd); return fd; });
          return false;
        }
        return d;
      });
    }, 25000);
    return () => clearInterval(autosaveRef.current);
  }, [save]);

  const statuses = computeStatuses(formData);

  const handlePreviewBlockClick = (idx) => {
    setSelectedBlockIdx(idx);
    setActiveTab('content');
    if (idx >= 0) setOpenIndices(prev => new Set([...prev, idx]));
  };

  const showPreview = viewMode !== 'editor';
  const showEditor  = viewMode !== 'preview';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: S.bg, overflow: 'hidden', ...themeVars(editorLight) }}>
      {showTemplate && (
        <TemplatePicker
          onSelect={t => { updateForm({ ...formData, content: t.content.map(b => ({ ...b })) }); setShowTemplate(false); setActiveTab('hero'); }}
          onClose={() => setShowTemplate(false)}
        />
      )}

      {/* Save indicator strip */}
      <div style={{
        height: 3, background: dirty ? S.warn : (lastSaved ? S.success : 'transparent'),
        transition: 'background 0.4s', flexShrink: 0,
      }} />

      {/* Article toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px',
        height: 48, flexShrink: 0, background: S.surface,
        borderBottom: `1px solid ${S.border}`,
      }}>
        {/* Back */}
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: S.muted, cursor: 'pointer', fontFamily: FU, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0 }}>
          ← Articles
        </button>
        <div style={{ width: 1, height: 18, background: S.border, flexShrink: 0 }} />

        {/* Title */}
        <span style={{ fontFamily: FD, fontSize: 14, color: S.text, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: '0 1 auto' }}>
          {formData.title || 'Untitled Article'}
        </span>

        {/* Status badges */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {statuses.slice(0, 2).map(s => <StatusBadge key={s.label} label={s.label} color={s.color} />)}
        </div>

        {/* Viewport toggle — centre */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 2 }}>
          {[
            { key: 'editor',  label: 'Editor' },
            { key: 'split',   label: 'Split' },
            { key: 'preview', label: 'Preview' },
          ].map(v => (
            <button key={v.key} onClick={() => setViewMode(v.key)} style={{
              fontFamily: FU, fontSize: 8, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '3px 9px', borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s',
              background: viewMode === v.key ? `${S.gold}18` : 'none',
              border: `1px solid ${viewMode === v.key ? `${S.gold}60` : S.border}`,
              color: viewMode === v.key ? S.gold : S.muted,
            }}>{v.label}</button>
          ))}
          {showPreview && (
            <>
              <div style={{ width: 1, height: 18, background: S.border, alignSelf: 'center', margin: '0 2px' }} />
              {[
                { key: 'desktop', label: '⊡' },
                { key: 'tablet',  label: '▭' },
                { key: 'mobile',  label: '▯' },
              ].map(v => (
                <button key={v.key} onClick={() => setViewport(v.key)} title={v.key} style={{
                  fontFamily: FU, fontSize: 11, padding: '3px 7px', borderRadius: 2, cursor: 'pointer',
                  background: viewport === v.key ? `${S.gold}18` : 'none',
                  border: `1px solid ${viewport === v.key ? `${S.gold}60` : S.border}`,
                  color: viewport === v.key ? S.gold : S.muted,
                }}>{v.label}</button>
              ))}
            </>
          )}
        </div>

        {/* Save state */}
        <div style={{ fontFamily: FU, fontSize: 9, color: dirty ? S.warn : S.success, flexShrink: 0, letterSpacing: '0.06em' }}>
          {saveLabel || (dirty ? '● Unsaved' : (lastSaved ? `✓ ${lastSaved.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : ''))}
        </div>

        {/* Editor panel light/dark */}
        {showEditor && (
          <button onClick={() => setEditorLight(l => !l)} title={editorLight ? 'Switch editor to dark mode' : 'Switch editor to light mode'}
            style={{ background: 'none', border: `1px solid ${S.border}`, color: S.muted, fontSize: 12, padding: '3px 7px', cursor: 'pointer', borderRadius: 1, flexShrink: 0 }}>
            {editorLight ? '☾' : '☀'}
          </button>
        )}

        {/* Preview light/dark */}
        {showPreview && (
          <button onClick={() => setPreviewLight(l => !l)} title="Toggle preview theme"
            style={{ background: 'none', border: `1px solid ${S.border}`, color: S.muted, fontSize: 12, padding: '3px 7px', cursor: 'pointer', borderRadius: 1, flexShrink: 0 }}>
            {previewLight ? '◐' : '◑'}
          </button>
        )}

        {/* Template picker */}
        <GhostBtn small onClick={() => setShowTemplate(true)}>Templates</GhostBtn>

        {/* Quick save */}
        <GhostBtn small onClick={() => save()} disabled={saving}>
          {saving ? 'Saving…' : 'Save Draft'}
        </GhostBtn>
      </div>

      {/* Main workspace — [Editor panel (left, 50%)] [Preview canvas (right, 50%)] */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* ── Left: editor panel ── */}
        {showEditor && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0, background: S.surface, borderRight: `1px solid ${S.border}`, ...themeVars(editorLight) }}>
            {/* Tab bar */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${S.border}`, flexShrink: 0, overflowX: 'auto' }}>
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    fontFamily: FU, fontSize: 9, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '10px 12px', whiteSpace: 'nowrap', flexShrink: 0,
                    color: activeTab === t.id ? GOLD : S.muted,
                    borderBottom: `2px solid ${activeTab === t.id ? GOLD : 'transparent'}`,
                    transition: 'color 0.15s',
                  }}
                >
                  {t.id === 'content' ? `2 · Content (${(formData.content || []).length})` : t.label}
                </button>
              ))}
            </div>
            {/* Scrollable panel */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 60px' }}>
              {activeTab === 'hero'    && (
                <>
                  <HeroPanel formData={formData} onChange={updateForm} defaultOpen />
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD, marginBottom: 8 }}>
                      Live Hero Preview
                    </div>
                    <HeroPreviewPane formData={formData} isLight={previewLight} />
                  </div>
                </>
              )}
              {activeTab === 'content' && (
                <ContentPanel
                  blocks={formData.content || []}
                  onChange={blocks => updateForm({ ...formData, content: blocks })}
                  tone={tone}
                  openIndices={openIndices}
                  setOpenIndices={setOpenIndices}
                />
              )}
              {activeTab === 'meta'    && <MetaPanel formData={formData} onChange={updateForm} tone={tone} onToneChange={setTone} />}
              {activeTab === 'seo'     && <SEOPanel  formData={formData} onChange={updateForm} tone={tone} />}
              {activeTab === 'publish' && (
                <PublishPanel
                  formData={formData}
                  onChange={updateForm}
                  onPublish={publish}
                  onUnpublish={unpublish}
                  onSave={save}
                  onDuplicate={duplicate}
                  saving={saving}
                />
              )}

              {/* Step navigation */}
              <StepNav activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
          </div>
        )}

        {/* ── Right: live preview canvas ── */}
        {showPreview && (
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0, background: previewLight ? '#fafaf8' : '#0d0d0b' }}>
            <ArticlePreview
              formData={formData}
              isLight={previewLight}
              viewport={viewport}
              onBlockClick={showEditor ? handlePreviewBlockClick : undefined}
              selectedBlockIdx={showEditor ? selectedBlockIdx : undefined}
            />
          </div>
        )}
      </div>
    </div>
  );
}
