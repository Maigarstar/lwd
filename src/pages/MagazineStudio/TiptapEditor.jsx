/**
 * TiptapEditor — Magazine Studio WYSIWYG
 * WordPress-style: no fixed toolbar. A floating bubble appears above any text selection.
 * Outputs / accepts HTML strings compatible with ArticleBody dangerouslySetInnerHTML.
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
import { createPortal } from 'react-dom';
import { FU, FD } from './StudioShared';
import MediaLibrary from './MediaLibrary';

// ── Floating Bubble Menu (WordPress-style) ────────────────────────────────────
// Appears above selected text only. Never a fixed toolbar.
function FloatingBubble({ editor, onOpenImagePicker }) {
  const [pos, setPos]           = useState(null); // { top, left } absolute page px
  const [linkMode, setLinkMode] = useState(false);
  const [linkUrl, setLinkUrl]   = useState('');
  const linkInputRef = useRef(null);

  // Reposition / show / hide bubble on selection change
  useEffect(() => {
    if (!editor) return;
    const update = () => {
      const { selection } = editor.state;
      if (selection.empty) { setPos(null); setLinkMode(false); return; }
      const domSel = window.getSelection();
      if (!domSel || domSel.rangeCount === 0) { setPos(null); return; }
      const rect = domSel.getRangeAt(0).getBoundingClientRect();
      if (!rect || rect.width === 0) { setPos(null); return; }
      setPos({
        top:  rect.top,   // viewport-relative (for position:fixed bubble)
        left: rect.left + rect.width / 2,
      });
    };
    editor.on('selectionUpdate', update);
    editor.on('transaction',     update);
    return () => {
      editor.off('selectionUpdate', update);
      editor.off('transaction',     update);
    };
  }, [editor]);

  useEffect(() => {
    if (linkMode) setTimeout(() => linkInputRef.current?.focus(), 30);
  }, [linkMode]);

  const isActive = (cmd) => {
    if (!editor) return false;
    switch (cmd) {
      case 'bold':        return editor.isActive('bold');
      case 'italic':      return editor.isActive('italic');
      case 'underline':   return editor.isActive('underline');
      case 'h2':          return editor.isActive('heading', { level: 2 });
      case 'h3':          return editor.isActive('heading', { level: 3 });
      case 'bulletList':  return editor.isActive('bulletList');
      case 'orderedList': return editor.isActive('orderedList');
      case 'blockquote':  return editor.isActive('blockquote');
      case 'link':        return editor.isActive('link');
      default:            return false;
    }
  };

  const run = (cmd) => {
    if (!editor) return;
    switch (cmd) {
      case 'bold':         editor.chain().focus().toggleBold().run(); break;
      case 'italic':       editor.chain().focus().toggleItalic().run(); break;
      case 'underline':    editor.chain().focus().toggleUnderline().run(); break;
      case 'h2':           editor.chain().focus().toggleHeading({ level: 2 }).run(); break;
      case 'h3':           editor.chain().focus().toggleHeading({ level: 3 }).run(); break;
      case 'bulletList':   editor.chain().focus().toggleBulletList().run(); break;
      case 'orderedList':  editor.chain().focus().toggleOrderedList().run(); break;
      case 'blockquote':   editor.chain().focus().toggleBlockquote().run(); break;
      case 'alignLeft':    editor.chain().focus().setTextAlign('left').run(); break;
      case 'alignCenter':  editor.chain().focus().setTextAlign('center').run(); break;
      case 'alignRight':   editor.chain().focus().setTextAlign('right').run(); break;
      case 'clearFormat':  editor.chain().focus().clearNodes().unsetAllMarks().run(); break;
      case 'link': {
        if (editor.isActive('link')) { editor.chain().focus().unsetLink().run(); }
        else { setLinkMode(true); }
        break;
      }
      case 'image': { onOpenImagePicker(); break; }
      default: break;
    }
  };

  const confirmLink = () => {
    if (linkUrl.trim()) {
      const href = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
      editor.chain().focus().extendMarkRange('link').setLink({ href, target: '_blank' }).run();
    }
    setLinkMode(false);
    setLinkUrl('');
  };

  if (!pos) return null;

  const btn = (cmd, label, title, extraStyle = {}) => {
    const active = isActive(cmd);
    return (
      <button
        key={cmd}
        title={title}
        onMouseDown={e => { e.preventDefault(); run(cmd); }}
        style={{
          background:    active ? 'rgba(201,169,110,0.18)' : 'none',
          border:        'none',
          borderRadius:  3,
          color:         active ? '#c9a96e' : 'rgba(245,240,232,0.75)',
          cursor:        'pointer',
          fontFamily:    FU,
          fontSize:      11,
          fontWeight:    600,
          padding:       '4px 7px',
          lineHeight:    1,
          transition:    'background 0.1s, color 0.1s',
          userSelect:    'none',
          ...extraStyle,
        }}
        onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(201,169,110,0.1)'; e.currentTarget.style.color = '#f5f0e8'; } }}
        onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'none';                  e.currentTarget.style.color = 'rgba(245,240,232,0.75)'; } }}
      >{label}</button>
    );
  };

  const sep = (key) => (
    <div key={key} style={{ width: 1, height: 14, background: 'rgba(245,240,232,0.1)', flexShrink: 0, margin: '0 2px' }} />
  );

  const bubble = (
    <div
      onMouseDown={e => e.preventDefault()}
      style={{
        position:     'fixed',
        top:          pos.top - 8,
        left:         pos.left,
        transform:    'translate(-50%, -100%)',
        zIndex:       999999,
        background:   '#1a1510',
        border:       '1px solid rgba(201,169,110,0.2)',
        borderRadius: 5,
        boxShadow:    '0 4px 28px rgba(0,0,0,0.65), 0 1px 8px rgba(0,0,0,0.4)',
        display:      'flex',
        alignItems:   'center',
        padding:      '3px 4px',
        gap:          1,
        whiteSpace:   'nowrap',
      }}
    >
      {linkMode ? (
        <>
          <input
            ref={linkInputRef}
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') confirmLink();
              if (e.key === 'Escape') { setLinkMode(false); setLinkUrl(''); }
            }}
            placeholder="https://…"
            style={{
              background: 'rgba(245,240,232,0.06)', border: '1px solid rgba(245,240,232,0.15)',
              borderRadius: 3, padding: '4px 8px', color: '#f5f0e8',
              fontFamily: FU, fontSize: 11, outline: 'none', width: 180,
            }}
          />
          <button
            onMouseDown={e => { e.preventDefault(); confirmLink(); }}
            style={{ fontFamily: FU, fontSize: 10, fontWeight: 700, color: '#c9a96e', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 3 }}
          >Insert</button>
          <button
            onMouseDown={e => { e.preventDefault(); setLinkMode(false); setLinkUrl(''); }}
            style={{ fontFamily: FU, fontSize: 10, color: 'rgba(245,240,232,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 3 }}
          >✕</button>
        </>
      ) : (
        <>
          {btn('bold',         'B',  'Bold (⌘B)',        { fontWeight: 800 })}
          {btn('italic',       'I',  'Italic (⌘I)',       { fontStyle: 'italic' })}
          {btn('underline',    'U',  'Underline (⌘U)',    { textDecoration: 'underline' })}
          {sep('s1')}
          {btn('h2',           'H2', 'Heading 2')}
          {btn('h3',           'H3', 'Heading 3')}
          {sep('s2')}
          {btn('bulletList',   '≡•', 'Bullet list')}
          {btn('orderedList',  '1.', 'Numbered list')}
          {btn('blockquote',   '"',  'Blockquote')}
          {sep('s3')}
          {btn('alignLeft',    '⬅', 'Align left')}
          {btn('alignCenter',  '⬆', 'Align centre')}
          {btn('alignRight',   '➡', 'Align right')}
          {sep('s4')}
          {btn('link',         '🔗', editor?.isActive('link') ? 'Remove link' : 'Insert link')}
          {btn('image',        '🖼', 'Insert image')}
          {sep('s5')}
          {btn('clearFormat',  '✕',  'Clear formatting', { color: 'rgba(224,85,85,0.7)', fontSize: 10 })}
        </>
      )}
    </div>
  );

  return createPortal(bubble, document.body);
}

// ── Main TiptapEditor export ──────────────────────────────────────────────────
export default function TiptapEditor({ value = '', onChange, placeholder = 'Start writing…', minHeight = 180, full = false }) {
  const [showImagePicker, setShowImagePicker] = useState(false);
  const editorRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading:    { levels: [2, 3, 4] },
        typography: false,
        link: false,       // Disable StarterKit's default link to avoid duplicate
        underline: false,  // Disable StarterKit's default underline to avoid duplicate
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
      attributes: { class: 'tiptap-canvas-body' },
    },
  });

  useEffect(() => { editorRef.current = editor; }, [editor]);

  const handleInsertImage = useCallback((imgObj) => {
    // MediaLibrary passes { url, alt, caption } or just a string
    const src = typeof imgObj === 'string' ? imgObj : imgObj?.url;
    const alt = typeof imgObj === 'object' ? (imgObj?.alt || '') : '';
    if (src) editorRef.current?.chain().focus().setImage({ src, alt }).run();
    setShowImagePicker(false);
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <style>{`
        .tiptap-canvas-body {
          outline: none;
          min-height: ${full ? 320 : minHeight}px;
          padding: 14px 16px;
          font-family: ${FD};
          font-size: 16px;
          line-height: 1.8;
          color: var(--tiptap-color, #f5f0e8);
          caret-color: #c9a96e;
        }
        .tiptap-canvas-body p { margin: 0 0 1em; }
        .tiptap-canvas-body h2 { font-family: ${FD}; font-size: 22px; font-weight: 600; margin: 1.4em 0 0.5em; color: var(--tiptap-color, #f5f0e8); }
        .tiptap-canvas-body h3 { font-family: ${FD}; font-size: 18px; font-weight: 600; margin: 1.2em 0 0.4em; color: var(--tiptap-color, #f5f0e8); }
        .tiptap-canvas-body h4 { font-family: ${FU}; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; margin: 1.2em 0 0.4em; color: #c9a96e; }
        .tiptap-canvas-body ul, .tiptap-canvas-body ol { padding-left: 1.4em; margin: 0 0 1em; }
        .tiptap-canvas-body li { margin-bottom: 0.3em; }
        .tiptap-canvas-body blockquote { border-left: 2px solid #c9a96e; margin: 1.2em 0; padding: 0.4em 0 0.4em 1.2em; color: rgba(245,240,232,0.6); font-style: italic; }
        .tiptap-canvas-body a { color: #c9a96e; text-decoration: underline; }
        .tiptap-canvas-body hr { border: none; border-top: 1px solid rgba(245,240,232,0.08); margin: 1.5em 0; }
        .tiptap-canvas-body img { max-width: 100%; border-radius: 3px; margin: 0.5em 0; display: block; }
        .tiptap-canvas-body strong { font-weight: 700; }
        .tiptap-canvas-body em { font-style: italic; }
        .tiptap-canvas-body u { text-decoration: underline; }
        .tiptap-canvas-body .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: rgba(245,240,232,0.28);
          float: left; height: 0; pointer-events: none;
        }
        .tiptap-canvas-body p.is-empty::before {
          content: attr(data-placeholder);
          color: rgba(245,240,232,0.28);
          float: left; height: 0; pointer-events: none;
        }
      `}</style>

      <div
        style={{
          border:       '1px solid rgba(245,240,232,0.08)',
          borderRadius: 4,
          overflow:     'hidden',
          transition:   'border-color 0.15s',
        }}
        onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(201,169,110,0.45)'}
        onBlurCapture={e  => e.currentTarget.style.borderColor = 'rgba(245,240,232,0.08)'}
      >
        <EditorContent editor={editor} />
      </div>

      {editor && (
        <FloatingBubble
          editor={editor}
          onOpenImagePicker={() => setShowImagePicker(true)}
        />
      )}

      {createPortal(
        <MediaLibrary
          open={showImagePicker}
          onClose={() => setShowImagePicker(false)}
          onSelect={handleInsertImage}
          bucket="magazine"
        />,
        document.body
      )}
    </div>
  );
}
