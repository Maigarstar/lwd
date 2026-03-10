/**
 * RichTextEditor — shared TipTap editor for Listing Studio
 *
 * Uses the existing TipTap installation (same as RegionsModule).
 * Packages: @tiptap/react · @tiptap/starter-kit · @tiptap/extension-image
 *           @tiptap/extension-underline · @tiptap/extension-link
 *           @tiptap/extension-placeholder
 *
 * Features:
 *   Bold · Italic · Underline · Strike
 *   H2 · H3
 *   Bullet list · Numbered list
 *   Blockquote
 *   Image upload (file → base64, inserted inline)
 *   Link (prompt)
 *   HTML source view (toggle)
 *   Undo / Redo
 *   Paste cleanup (strips Word / web inline styles)
 *
 * Props:
 *   value       {string}   Controlled HTML string
 *   onChange    {fn}       Called with new HTML on every edit
 *   placeholder {string}
 *   minHeight   {number}   Min height of editable area px (default 160)
 */

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useRef, useState } from 'react';
import { injectProseStyles } from '../utils/proseStyles';

// ─── Paste cleanup: strip Word / web junk ─────────────────────────────────────
const cleanPastedHtml = html =>
  html
    .replace(/\s*style="[^"]*"/gi, '')
    .replace(/\s*class="[^"]*"/gi, '')
    .replace(/<o:p[^>]*>[\s\S]*?<\/o:p>/gi, '')
    .replace(/<\/?w:[^>]*>/gi, '')
    .replace(/<\/?m:[^>]*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<font[^>]*>/gi, '')
    .replace(/<\/font>/gi, '')
    .replace(/<span\s*>/gi, '')
    .replace(/<\/span>/gi, '');

// ─── Toolbar primitives ───────────────────────────────────────────────────────
const Btn = ({ onClick, active = false, disabled = false, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 28, height: 28, padding: 0, border: 'none', borderRadius: 3,
      backgroundColor: active ? 'rgba(201,168,76,0.18)' : 'transparent',
      color: active ? '#9a6f0a' : '#555',
      fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.32 : 1,
      transition: 'background-color 0.12s, color 0.12s',
      flexShrink: 0,
    }}
    onMouseEnter={e => { if (!disabled && !active) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.055)'; }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
  >
    {children}
  </button>
);

const Sep = () => (
  <span style={{
    display: 'inline-block', width: 1, height: 16,
    backgroundColor: '#ddd4c8', margin: '0 4px',
    verticalAlign: 'middle', flexShrink: 0,
  }} />
);

// ─── Main component ───────────────────────────────────────────────────────────
const RichTextEditor = ({
  value = '',
  onChange,
  placeholder = 'Start writing…',
  minHeight = 160,
}) => {
  const [htmlMode, setHtmlMode] = useState(false);
  const [rawHtml, setRawHtml] = useState('');
  const imageInputRef = useRef(null);

  useEffect(() => { injectProseStyles(); }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, codeBlock: false, underline: false, link: false }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
      }),
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editorProps: {
      attributes: { class: 'ldw-prose-body' },
      transformPastedHTML: cleanPastedHtml,
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
  });

  // Sync external value changes (e.g. DB load)
  useEffect(() => {
    if (!editor || editor.isDestroyed || htmlMode) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // ── Image upload (file → base64 → insert) ───────────────────────────────────
  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      editor.chain().focus().setImage({ src: ev.target.result }).run();
    };
    reader.readAsDataURL(file);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  // ── Link ─────────────────────────────────────────────────────────────────────
  const handleLink = () => {
    if (!editor) return;
    const existing = editor.getAttributes('link').href || '';
    const url = window.prompt('Link URL', existing || 'https://');
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
    }
  };

  // ── HTML source toggle ───────────────────────────────────────────────────────
  const enterHtmlMode = () => {
    if (!editor) return;
    setRawHtml(editor.getHTML());
    setHtmlMode(true);
  };

  const exitHtmlMode = () => {
    editor.commands.setContent(rawHtml, true); // true = emit update
    setHtmlMode(false);
  };

  if (!editor) return null;

  const is = (mark, attrs) => editor.isActive(mark, attrs);

  return (
    <div style={{ border: '1px solid #ddd4c8', borderRadius: 3, overflow: 'hidden', backgroundColor: '#fff' }}>

      {/* ── TOOLBAR ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1,
        padding: '5px 8px', backgroundColor: '#fafaf8',
        borderBottom: '1px solid #ede9e3', userSelect: 'none',
      }}>

        {/* Text style */}
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={is('bold')} title="Bold">
          <strong>B</strong>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={is('italic')} title="Italic">
          <em style={{ fontFamily: 'Georgia, serif' }}>I</em>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={is('underline')} title="Underline">
          <span style={{ textDecoration: 'underline' }}>U</span>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={is('strike')} title="Strikethrough">
          <s>S</s>
        </Btn>

        <Sep />

        {/* Headings */}
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={is('heading', { level: 2 })} title="Heading 2">
          H2
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={is('heading', { level: 3 })} title="Heading 3">
          H3
        </Btn>

        <Sep />

        {/* Lists */}
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={is('bulletList')} title="Bullet list">
          ≡•
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={is('orderedList')} title="Numbered list">
          1≡
        </Btn>

        <Sep />

        {/* Blockquote */}
        <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={is('blockquote')} title="Blockquote">
          ❝
        </Btn>

        <Sep />

        {/* Link */}
        <Btn onClick={handleLink} active={is('link')} title="Insert link">
          🔗
        </Btn>

        {/* Image upload */}
        <Btn onClick={() => imageInputRef.current?.click()} title="Insert image" active={false}>
          🖼
        </Btn>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleImageFile}
          style={{ display: 'none' }}
        />

        <Sep />

        {/* HTML source toggle */}
        <Btn
          onClick={htmlMode ? exitHtmlMode : enterHtmlMode}
          active={htmlMode}
          title={htmlMode ? 'Back to visual editor' : 'View / edit HTML source'}
        >
          <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700 }}>
            {'</>'}
          </span>
        </Btn>

        <Sep />

        {/* History */}
        <Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">↩</Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">↪</Btn>
      </div>

      {/* ── EDITOR / HTML SOURCE ─────────────────────────────────────────────── */}
      {htmlMode ? (
        <div style={{ padding: 12 }}>
          <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              HTML Source
            </span>
            <button
              type="button"
              onClick={exitHtmlMode}
              style={{
                fontSize: 11, fontWeight: 600, padding: '4px 10px',
                backgroundColor: '#C9A84C', color: '#fff',
                border: 'none', borderRadius: 3, cursor: 'pointer',
              }}
            >
              ← Back to Visual
            </button>
          </div>
          <textarea
            value={rawHtml}
            onChange={e => setRawHtml(e.target.value)}
            spellCheck={false}
            style={{
              width: '100%', minHeight: Math.max(minHeight, 120),
              padding: '10px 12px', fontSize: 11,
              fontFamily: "'SF Mono', 'Fira Code', 'Courier New', monospace",
              lineHeight: 1.6, color: '#333', backgroundColor: '#f8f6f2',
              border: '1px solid #e5ddd0', borderRadius: 3,
              resize: 'vertical', boxSizing: 'border-box',
            }}
          />
          <p style={{ fontSize: 10, color: '#bbb', margin: '4px 0 0' }}>
            Edit raw HTML. Click "Back to Visual" to apply changes.
          </p>
        </div>
      ) : (
        <div
          style={{
            minHeight,
            resize: 'vertical',
            overflow: 'auto',
            cursor: 'text',
            padding: '12px 14px',
            boxSizing: 'border-box',
          }}
          onClick={() => editor.chain().focus().run()}
        >
          <EditorContent editor={editor} />
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
