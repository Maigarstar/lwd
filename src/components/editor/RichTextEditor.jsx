// ─── src/components/editor/RichTextEditor.jsx ────────────────────────────────
// Reusable TipTap rich text editor — premium dark-mode aware
// Used by SiteContentModule (CMS). Future: editorial studio, vendor help, etc.
//
// Props:
//   content      string   — initial HTML
//   onChange     fn       — called with latest HTML on every change
//   placeholder  string   — placeholder text
//   readOnly     bool
//   C            object   — theme palette (getDarkPalette())
//   onSelectionUpdate fn  — called with { text, html } when selection changes
// ─────────────────────────────────────────────────────────────────────────────

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Typography from '@tiptap/extension-typography';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useRef, useCallback } from 'react';

const GD = 'var(--font-heading-primary)';
const NU = 'var(--font-body)';

// ── Toolbar button ────────────────────────────────────────────────────────────
function TBtn({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '4px 8px',
        minWidth: 28,
        height: 28,
        background: active ? 'rgba(201,168,76,0.18)' : 'transparent',
        border: active ? '1px solid rgba(201,168,76,0.4)' : '1px solid transparent',
        borderRadius: 4,
        color: active ? '#C9A84C' : disabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: 600,
        fontFamily: NU,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.15s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.style.background = active ? 'rgba(201,168,76,0.22)' : 'rgba(255,255,255,0.06)';
          e.currentTarget.style.color = '#C9A84C';
        }
      }}
      onMouseLeave={e => {
        if (!disabled) {
          e.currentTarget.style.background = active ? 'rgba(201,168,76,0.18)' : 'transparent';
          e.currentTarget.style.color = active ? '#C9A84C' : 'rgba(255,255,255,0.6)';
        }
      }}
    >
      {children}
    </button>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
function TDiv() {
  return (
    <span style={{
      width: 1, height: 20,
      background: 'rgba(255,255,255,0.1)',
      flexShrink: 0,
      alignSelf: 'center',
      margin: '0 4px',
    }} />
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RichTextEditor({
  content = '',
  onChange,
  placeholder = 'Start writing…',
  readOnly = false,
  C,
  onSelectionUpdate,
}) {
  const gold = C?.gold || '#C9A84C';
  const bg = C?.card || '#141414';
  const border = C?.border || '#1e1e1e';
  const off = C?.off || '#f5f0e8';

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Typography,
      Placeholder.configure({ placeholder }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        const selectedText = editor.state.doc.textBetween(from, to, ' ');
        onSelectionUpdate?.({ text: selectedText });
      } else {
        onSelectionUpdate?.({ text: '' });
      }
    },
  });

  // Update content if it changes externally (e.g., version restore)
  const prevContent = useRef(content);
  useEffect(() => {
    if (editor && content !== prevContent.current) {
      const current = editor.getHTML();
      if (current !== content) {
        editor.commands.setContent(content, false);
      }
      prevContent.current = content;
    }
  }, [editor, content]);

  // Add link
  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', prev || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: bg }}>
      {/* ── Toolbar ── */}
      {!readOnly && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            padding: '8px 12px',
            borderBottom: `1px solid ${border}`,
            background: 'rgba(255,255,255,0.02)',
            flexShrink: 0,
          }}
        >
          {/* Headings */}
          <TBtn
            title="Heading 1"
            active={editor.isActive('heading', { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >H1</TBtn>
          <TBtn
            title="Heading 2"
            active={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >H2</TBtn>
          <TBtn
            title="Heading 3"
            active={editor.isActive('heading', { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >H3</TBtn>

          <TDiv />

          {/* Inline marks */}
          <TBtn
            title="Bold"
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          ><b>B</b></TBtn>
          <TBtn
            title="Italic"
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          ><i style={{ fontStyle: 'italic' }}>I</i></TBtn>
          <TBtn
            title="Underline"
            active={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          ><u>U</u></TBtn>

          <TDiv />

          {/* Lists */}
          <TBtn
            title="Bullet list"
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >≡</TBtn>
          <TBtn
            title="Numbered list"
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >1.</TBtn>

          <TDiv />

          {/* Blockquote */}
          <TBtn
            title="Blockquote"
            active={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >"</TBtn>

          {/* Link */}
          <TBtn
            title="Insert / edit link"
            active={editor.isActive('link')}
            onClick={setLink}
          >↗</TBtn>

          {/* Horizontal rule */}
          <TBtn
            title="Horizontal divider"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >—</TBtn>

          <TDiv />

          {/* Undo / Redo */}
          <TBtn
            title="Undo"
            disabled={!editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
          >↩</TBtn>
          <TBtn
            title="Redo"
            disabled={!editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
          >↪</TBtn>
        </div>
      )}

      {/* ── Editor content ── */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        <style>{`
          .lwd-rich-editor .ProseMirror {
            outline: none;
            min-height: 480px;
            padding: 36px 48px;
            max-width: 860px;
            margin: 0 auto;
            color: ${off};
            font-family: ${NU};
            font-size: 15px;
            line-height: 1.85;
          }
          .lwd-rich-editor .ProseMirror h1 {
            font-family: ${GD};
            font-size: 28px;
            font-weight: 600;
            color: ${off};
            margin: 0 0 16px;
            letter-spacing: -0.01em;
          }
          .lwd-rich-editor .ProseMirror h2 {
            font-family: ${GD};
            font-size: 21px;
            font-weight: 600;
            color: ${off};
            margin: 36px 0 14px;
            letter-spacing: -0.01em;
          }
          .lwd-rich-editor .ProseMirror h3 {
            font-family: ${GD};
            font-size: 16px;
            font-weight: 600;
            color: ${gold};
            margin: 28px 0 10px;
            letter-spacing: 0.01em;
          }
          .lwd-rich-editor .ProseMirror p {
            margin: 0 0 16px;
            color: rgba(245,240,232,0.72);
          }
          .lwd-rich-editor .ProseMirror a {
            color: ${gold};
            text-decoration: underline;
            text-decoration-color: rgba(201,168,76,0.4);
            text-underline-offset: 3px;
          }
          .lwd-rich-editor .ProseMirror a:hover {
            text-decoration-color: ${gold};
          }
          .lwd-rich-editor .ProseMirror ul,
          .lwd-rich-editor .ProseMirror ol {
            padding-left: 24px;
            margin: 0 0 16px;
          }
          .lwd-rich-editor .ProseMirror li {
            margin-bottom: 6px;
            color: rgba(245,240,232,0.72);
          }
          .lwd-rich-editor .ProseMirror hr {
            border: none;
            border-top: 1px solid rgba(255,255,255,0.1);
            margin: 32px 0;
          }
          .lwd-rich-editor .ProseMirror strong {
            font-weight: 600;
            color: ${off};
          }
          .lwd-rich-editor .ProseMirror em {
            font-style: italic;
          }
          .lwd-rich-editor .ProseMirror blockquote {
            border-left: 3px solid ${gold};
            margin: 20px 0;
            padding: 8px 20px;
            color: rgba(245,240,232,0.55);
            font-style: italic;
          }
          .lwd-rich-editor .ProseMirror p.is-editor-empty:first-child::before {
            color: rgba(255,255,255,0.2);
            content: attr(data-placeholder);
            float: left;
            height: 0;
            pointer-events: none;
          }
          .lwd-rich-editor .ProseMirror ::selection {
            background: rgba(201,168,76,0.22);
          }
        `}</style>
        <div className="lwd-rich-editor">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
