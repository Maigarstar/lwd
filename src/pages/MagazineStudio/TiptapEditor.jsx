/**
 * TiptapEditor, full WYSIWYG editor for Magazine Studio.
 * Replaces the custom contentEditable RichTextEditor for intro + body_wysiwyg blocks.
 * Outputs / accepts HTML strings, compatible with ArticleBody dangerouslySetInnerHTML.
 */
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { useCallback, useRef, useState, useEffect } from 'react';
import { FU, FD } from './StudioShared';
import { supabase } from '../../lib/supabaseClient';

const BUCKET = 'listing-media';
// CSS-var tokens, cascade from themeVars() on any ancestor wrapper
const S = {
  bg:          'var(--s-bg, #0f0f0d)',
  surface:     'var(--s-surface, #161614)',
  surfaceUp:   'var(--s-surface-up, #1e1e1b)',
  border:      'var(--s-border, rgba(245,240,232,0.07))',
  text:        'var(--s-text, #f5f0e8)',
  muted:       'var(--s-muted, rgba(245,240,232,0.45))',
  inputBg:     'var(--s-input-bg, rgba(245,240,232,0.04))',
  inputBorder: 'var(--s-input-border, rgba(245,240,232,0.1))',
  gold:        'var(--s-gold, #c9a96e)',
  error:       'var(--s-error, #e05555)',
};
const GOLD = S.gold;

// ── Upload helper (mirrors MagazineMediaUploader) ─────────────────────────────
async function uploadToMagazineMedia(file) {
  const rawExt = file.name.split('.').pop()?.toLowerCase() || '';
  const ext = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(rawExt) ? rawExt : 'jpg';
  const id = `mag_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const path = `${id}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '31536000', upsert: false, contentType: file.type || 'image/jpeg',
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// ── Image Picker Modal ────────────────────────────────────────────────────────
function ImagePickerModal({ onInsert, onClose }) {
  const [tab, setTab] = useState('upload'); // 'upload' | 'gallery'
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [gallery, setGallery] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const fileRef = useRef(null);

  // Load gallery when tab switches to gallery
  useEffect(() => {
    if (tab !== 'gallery') return;
    setGalleryLoading(true);
    supabase.storage.from(BUCKET).list('', {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    }).then(({ data, error }) => {
      if (error || !data) { setGalleryLoading(false); return; }
      const images = data
        .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name))
        .map(f => ({
          name: f.name,
          url: supabase.storage.from(BUCKET).getPublicUrl(f.name).data.publicUrl,
        }));
      setGallery(images);
      setGalleryLoading(false);
    });
  }, [tab]);

  const handleFile = async (file) => {
    if (!file.type.startsWith('image/')) { setUploadErr('Please select an image file.'); return; }
    setUploadErr(null);
    setUploading(true);
    try {
      const src = await uploadToMagazineMedia(file);
      onInsert(src);
    } catch (err) {
      setUploadErr(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUrlInsert = () => {
    const u = urlInput.trim();
    if (u) { onInsert(u); }
  };

  const tabBtn = (key, label) => (
    <button
      key={key}
      onClick={() => setTab(key)}
      style={{
        fontFamily: FU, fontSize: 9, fontWeight: 600, letterSpacing: '0.1em',
        textTransform: 'uppercase', padding: '7px 14px', cursor: 'pointer',
        background: 'none', border: 'none',
        borderBottom: `2px solid ${tab === key ? GOLD : 'transparent'}`,
        color: tab === key ? GOLD : S.muted,
        transition: 'all 0.15s',
      }}
    >{label}</button>
  );

  return (
    /* Backdrop */
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: S.surface, border: `1px solid ${S.border}`,
        borderRadius: 6, width: 560, maxHeight: '80vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 16px 60px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px 0', borderBottom: `1px solid ${S.border}`,
        }}>
          <div style={{ display: 'flex', gap: 0 }}>
            {tabBtn('upload', 'Upload')}
            {tabBtn('gallery', 'Gallery')}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: S.muted, cursor: 'pointer', fontSize: 16, padding: '0 4px', lineHeight: 1 }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

          {/* ── Upload tab ── */}
          {tab === 'upload' && (
            <div>
              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                onClick={() => !uploading && fileRef.current?.click()}
                style={{
                  border: `1px dashed ${dragging ? GOLD : S.border}`,
                  borderRadius: 4, padding: '32px 16px',
                  textAlign: 'center', cursor: uploading ? 'default' : 'pointer',
                  background: dragging ? 'color-mix(in srgb, var(--s-gold, #c9a96e) 4%, transparent)' : S.inputBg,
                  transition: 'all 0.15s', marginBottom: 12,
                }}
              >
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) { handleFile(f); e.target.value = ''; } }}
                />
                {uploading ? (
                  <div style={{ fontFamily: FU, fontSize: 12, color: GOLD }}>Uploading…</div>
                ) : (
                  <>
                    <div style={{ fontSize: 28, marginBottom: 8, color: S.muted }}>⬆</div>
                    <div style={{ fontFamily: FU, fontSize: 12, color: S.text, marginBottom: 4 }}>
                      Drop image or <span style={{ color: GOLD, textDecoration: 'underline' }}>browse files</span>
                    </div>
                    <div style={{ fontFamily: FU, fontSize: 10, color: S.muted }}>JPG, PNG, WebP, GIF</div>
                  </>
                )}
                {uploadErr && (
                  <div style={{ fontFamily: FU, fontSize: 10, color: S.error, marginTop: 8 }}>{uploadErr}</div>
                )}
              </div>

              {/* URL input */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontFamily: FU, fontSize: 9, color: S.muted, flexShrink: 0, letterSpacing: '0.1em', textTransform: 'uppercase' }}>or URL</span>
                <input
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleUrlInsert()}
                  placeholder="https://…"
                  style={{
                    flex: 1, background: S.inputBg, border: `1px solid ${S.border}`,
                    borderRadius: 2, padding: '7px 10px', color: S.text,
                    fontFamily: FU, fontSize: 12, outline: 'none',
                  }}
                />
                <button
                  onClick={handleUrlInsert}
                  disabled={!urlInput.trim()}
                  style={{
                    fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                    textTransform: 'uppercase', padding: '7px 14px', borderRadius: 2,
                    cursor: urlInput.trim() ? 'pointer' : 'default',
                    background: urlInput.trim() ? GOLD : 'none',
                    border: `1px solid ${urlInput.trim() ? GOLD : S.border}`,
                    color: urlInput.trim() ? '#0a0a0a' : S.muted,
                    flexShrink: 0,
                  }}
                >Insert</button>
              </div>
            </div>
          )}

          {/* ── Gallery tab ── */}
          {tab === 'gallery' && (
            <div>
              {galleryLoading ? (
                <div style={{ fontFamily: FU, fontSize: 11, color: S.muted, textAlign: 'center', padding: 32 }}>
                  Loading gallery…
                </div>
              ) : gallery.length === 0 ? (
                <div style={{ fontFamily: FU, fontSize: 11, color: S.muted, textAlign: 'center', padding: 32 }}>
                  No images uploaded yet. Upload images in the Upload tab.
                </div>
              ) : (
                <>
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginBottom: 12,
                  }}>
                    {gallery.map(img => (
                      <div
                        key={img.name}
                        onClick={() => setSelected(img.url)}
                        style={{
                          aspectRatio: '1', overflow: 'hidden', borderRadius: 3, cursor: 'pointer',
                          border: `2px solid ${selected === img.url ? GOLD : 'transparent'}`,
                          transition: 'border-color 0.12s',
                          position: 'relative',
                        }}
                      >
                        <img
                          src={img.url}
                          alt=""
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                        {selected === img.url && (
                          <div style={{
                            position: 'absolute', inset: 0,
                            background: 'color-mix(in srgb, var(--s-gold, #c9a96e) 12%, transparent)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <span style={{ fontSize: 20, color: GOLD }}>✓</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => selected && onInsert(selected)}
                      disabled={!selected}
                      style={{
                        fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                        textTransform: 'uppercase', padding: '8px 20px', borderRadius: 2,
                        cursor: selected ? 'pointer' : 'default',
                        background: selected ? GOLD : 'none',
                        border: `1px solid ${selected ? GOLD : S.border}`,
                        color: selected ? '#0a0a0a' : S.muted,
                      }}
                    >Insert Selected</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Toolbar button config ─────────────────────────────────────────────────────
const SEP = 'SEP';

const TOOLBAR_GROUPS = [
  [
    { cmd: 'bold',      label: 'B',     title: 'Bold (⌘B)',       style: { fontWeight: 700 } },
    { cmd: 'italic',    label: 'I',     title: 'Italic (⌘I)',     style: { fontStyle: 'italic' } },
    { cmd: 'underline', label: 'U',     title: 'Underline (⌘U)',  style: { textDecoration: 'underline' } },
  ],
  SEP,
  [
    { cmd: 'h2',   label: 'H2', title: 'Heading 2' },
    { cmd: 'h3',   label: 'H3', title: 'Heading 3' },
    { cmd: 'h4',   label: 'H4', title: 'Heading 4' },
  ],
  SEP,
  [
    { cmd: 'bulletList',   label: '≡•', title: 'Bullet list' },
    { cmd: 'orderedList',  label: '1.', title: 'Ordered list' },
    { cmd: 'blockquote',   label: '"',  title: 'Blockquote' },
  ],
  SEP,
  [
    { cmd: 'alignLeft',   label: '⬅', title: 'Align left' },
    { cmd: 'alignCenter', label: '⬆', title: 'Align center' },
    { cmd: 'alignRight',  label: '➡', title: 'Align right' },
  ],
  SEP,
  [
    { cmd: 'link',         label: '🔗', title: 'Insert link (⌘K)' },
    { cmd: 'horizontalRule', label: ' - ',  title: 'Horizontal rule' },
    { cmd: 'image',        label: '🖼',  title: 'Insert image' },
  ],
  SEP,
  [
    { cmd: 'clearFormat', label: '✕', title: 'Clear formatting' },
  ],
];

// ── Toolbar component ─────────────────────────────────────────────────────────
function Toolbar({ editor, onOpenImagePicker }) {
  const [linkPrompt, setLinkPrompt] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const linkInputRef = useRef(null);

  const isActive = useCallback((cmd) => {
    if (!editor) return false;
    switch (cmd) {
      case 'bold':         return editor.isActive('bold');
      case 'italic':       return editor.isActive('italic');
      case 'underline':    return editor.isActive('underline');
      case 'h2':           return editor.isActive('heading', { level: 2 });
      case 'h3':           return editor.isActive('heading', { level: 3 });
      case 'h4':           return editor.isActive('heading', { level: 4 });
      case 'bulletList':   return editor.isActive('bulletList');
      case 'orderedList':  return editor.isActive('orderedList');
      case 'blockquote':   return editor.isActive('blockquote');
      case 'link':         return editor.isActive('link');
      case 'alignLeft':    return editor.isActive({ textAlign: 'left' });
      case 'alignCenter':  return editor.isActive({ textAlign: 'center' });
      case 'alignRight':   return editor.isActive({ textAlign: 'right' });
      default:             return false;
    }
  }, [editor]);

  const runCmd = useCallback((cmd) => {
    if (!editor) return;
    switch (cmd) {
      case 'bold':          editor.chain().focus().toggleBold().run(); break;
      case 'italic':        editor.chain().focus().toggleItalic().run(); break;
      case 'underline':     editor.chain().focus().toggleUnderline().run(); break;
      case 'h2':            editor.chain().focus().toggleHeading({ level: 2 }).run(); break;
      case 'h3':            editor.chain().focus().toggleHeading({ level: 3 }).run(); break;
      case 'h4':            editor.chain().focus().toggleHeading({ level: 4 }).run(); break;
      case 'bulletList':    editor.chain().focus().toggleBulletList().run(); break;
      case 'orderedList':   editor.chain().focus().toggleOrderedList().run(); break;
      case 'blockquote':    editor.chain().focus().toggleBlockquote().run(); break;
      case 'alignLeft':     editor.chain().focus().setTextAlign('left').run(); break;
      case 'alignCenter':   editor.chain().focus().setTextAlign('center').run(); break;
      case 'alignRight':    editor.chain().focus().setTextAlign('right').run(); break;
      case 'horizontalRule': editor.chain().focus().setHorizontalRule().run(); break;
      case 'clearFormat':   editor.chain().focus().clearNodes().unsetAllMarks().run(); break;
      case 'link': {
        if (editor.isActive('link')) {
          editor.chain().focus().unsetLink().run();
        } else {
          setLinkPrompt(true);
          setTimeout(() => linkInputRef.current?.focus(), 50);
        }
        break;
      }
      case 'image': {
        onOpenImagePicker();
        break;
      }
      default: break;
    }
  }, [editor, onOpenImagePicker]);

  const confirmLink = () => {
    if (linkUrl) {
      const href = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
      editor.chain().focus().extendMarkRange('link').setLink({ href, target: '_blank' }).run();
    }
    setLinkPrompt(false);
    setLinkUrl('');
  };

  const btnBase = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 7px',
    borderRadius: 3,
    fontSize: 12,
    fontFamily: FU,
    color: S.muted,
    transition: 'background 0.12s, color 0.12s',
    lineHeight: 1,
    userSelect: 'none',
  };
  const btnActive = { background: 'color-mix(in srgb, var(--s-gold, #c9a96e) 11%, transparent)', color: S.gold };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1,
      padding: '6px 8px', borderBottom: `1px solid ${S.border}`,
      background: S.bg, borderRadius: '4px 4px 0 0', userSelect: 'none',
      position: 'relative',
    }}>
      {TOOLBAR_GROUPS.map((group, gi) => {
        if (group === SEP) {
          return (
            <div key={`sep-${gi}`} style={{
              width: 1, height: 16, background: S.border, margin: '0 4px', flexShrink: 0,
            }} />
          );
        }
        return group.map((btn) => (
          <button
            key={btn.cmd}
            title={btn.title}
            onMouseDown={(e) => { e.preventDefault(); runCmd(btn.cmd); }}
            style={{
              ...btnBase,
              ...btn.style,
              ...(isActive(btn.cmd) ? btnActive : {}),
            }}
            onMouseEnter={e => {
              if (!isActive(btn.cmd)) {
                e.currentTarget.style.background = 'color-mix(in srgb, var(--s-gold, #c9a96e) 6%, transparent)';
                e.currentTarget.style.color = S.text;
              }
            }}
            onMouseLeave={e => {
              if (!isActive(btn.cmd)) {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = S.muted;
              }
            }}
          >
            {btn.label}
          </button>
        ));
      })}

      {/* Link input popover */}
      {linkPrompt && (
        <div style={{
          position: 'absolute', zIndex: 100, top: '100%', left: 0,
          background: S.surface, border: `1px solid ${S.border}`,
          borderRadius: 6, padding: '8px 10px', display: 'flex', gap: 6,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)', marginTop: 4,
        }}>
          <input
            ref={linkInputRef}
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') confirmLink(); if (e.key === 'Escape') setLinkPrompt(false); }}
            placeholder="https://..."
            style={{
              background: S.inputBg, border: `1px solid ${S.inputBorder}`,
              borderRadius: 4, padding: '5px 8px', color: S.text,
              fontFamily: FU, fontSize: 13, outline: 'none', width: 220,
            }}
          />
          <button onMouseDown={e => { e.preventDefault(); confirmLink(); }} style={{ ...btnBase, color: S.gold, fontWeight: 600 }}>Insert</button>
          <button onMouseDown={e => { e.preventDefault(); setLinkPrompt(false); }} style={{ ...btnBase }}>✕</button>
        </div>
      )}
    </div>
  );
}

// ── Main TiptapEditor ─────────────────────────────────────────────────────────
export default function TiptapEditor({ value = '', onChange, placeholder = 'Start writing…', minHeight = 180, full = false }) {
  const [showImagePicker, setShowImagePicker] = useState(false);
  const editorRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        typography: false,
      }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder }),
      Typography,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value,
    onUpdate({ editor }) {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'tiptap-body',
      },
    },
  });

  // Store editor ref so ImagePickerModal can access it after modal opens
  useEffect(() => { editorRef.current = editor; }, [editor]);

  const handleInsertImage = useCallback((src) => {
    editorRef.current?.chain().focus().setImage({ src }).run();
    setShowImagePicker(false);
  }, []);

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* Styles injected into page head */}
      <style>{`
        .tiptap-body {
          outline: none;
          min-height: ${full ? 320 : minHeight}px;
          padding: 14px 16px;
          font-family: ${FD};
          font-size: 16px;
          line-height: 1.8;
          color: ${S.text};
          background: ${S.inputBg};
          caret-color: ${S.gold};
        }
        .tiptap-body p { margin: 0 0 1em; }
        .tiptap-body h2 { font-family: ${FD}; font-size: 22px; font-weight: 600; margin: 1.4em 0 0.5em; color: ${S.text}; }
        .tiptap-body h3 { font-family: ${FD}; font-size: 18px; font-weight: 600; margin: 1.2em 0 0.4em; color: ${S.text}; }
        .tiptap-body h4 { font-family: ${FU}; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; margin: 1.2em 0 0.4em; color: ${S.gold}; }
        .tiptap-body ul, .tiptap-body ol { padding-left: 1.4em; margin: 0 0 1em; }
        .tiptap-body li { margin-bottom: 0.3em; }
        .tiptap-body blockquote { border-left: 2px solid ${S.gold}; margin: 1.2em 0; padding: 0.4em 0 0.4em 1.2em; color: ${S.muted}; font-style: italic; }
        .tiptap-body a { color: ${S.gold}; text-decoration: underline; }
        .tiptap-body hr { border: none; border-top: 1px solid ${S.border}; margin: 1.5em 0; }
        .tiptap-body img { max-width: 100%; border-radius: 3px; margin: 0.5em 0; }
        .tiptap-body strong { font-weight: 700; }
        .tiptap-body em { font-style: italic; }
        .tiptap-body u { text-decoration: underline; }
        .tiptap-body .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: ${S.muted};
          float: left;
          height: 0;
          pointer-events: none;
        }
        .tiptap-body p.is-empty::before {
          content: attr(data-placeholder);
          color: ${S.muted};
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>

      <div style={{
        border: `1px solid ${S.border}`,
        borderRadius: 5,
        overflow: 'hidden',
        transition: 'border-color 0.15s',
      }}
        onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--s-gold, #c9a96e)'}
        onBlurCapture={e => e.currentTarget.style.borderColor = S.border}
      >
        <Toolbar editor={editor} onOpenImagePicker={() => setShowImagePicker(true)} />
        <EditorContent editor={editor} />
      </div>

      {showImagePicker && (
        <ImagePickerModal
          onInsert={handleInsertImage}
          onClose={() => setShowImagePicker(false)}
        />
      )}
    </div>
  );
}
