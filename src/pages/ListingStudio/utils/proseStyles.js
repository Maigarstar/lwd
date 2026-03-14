/**
 * proseStyles.js
 * Injects shared CSS for the rich-text editor and preview panel.
 * Call injectProseStyles() once, subsequent calls are no-ops.
 *
 * Class contract:
 *   .ldw-prose-body  →  applied to:
 *     • The TipTap ProseMirror element (editing)
 *     • dangerouslySetInnerHTML containers in the preview panel
 */

const STYLE_ID = 'ldw-prose-styles';

export const injectProseStyles = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;

  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = `
    /* ── Base ───────────────────────────────────────────────────── */
    .ldw-prose-body {
      font-size: 13px;
      font-family: inherit;
      line-height: 1.8;
      color: #555;
      outline: none;
    }
    .ldw-prose-body > * + * { margin-top: 0.85em; }

    /* ── Paragraphs ─────────────────────────────────────────────── */
    .ldw-prose-body p { margin: 0; }

    /* ── Headings ───────────────────────────────────────────────── */
    .ldw-prose-body h2 {
      font-size: 17px;
      font-weight: 700;
      color: #1a1a1a;
      font-family: 'Playfair Display', Georgia, serif;
      line-height: 1.25;
      margin: 1.4em 0 0.35em;
    }
    .ldw-prose-body h3 {
      font-size: 14px;
      font-weight: 700;
      color: #1a1a1a;
      line-height: 1.3;
      margin: 1.1em 0 0.3em;
    }

    /* ── Lists ──────────────────────────────────────────────────── */
    .ldw-prose-body ul {
      padding-left: 1.4em;
      margin: 0;
      list-style-type: disc;
    }
    .ldw-prose-body ol {
      padding-left: 1.4em;
      margin: 0;
      list-style-type: decimal;
    }
    .ldw-prose-body li { margin: 0.3em 0; }

    /* ── Blockquote ─────────────────────────────────────────────── */
    .ldw-prose-body blockquote {
      border-left: 3px solid #C9A84C;
      padding: 4px 0 4px 14px;
      margin: 0;
      color: #777;
      font-style: italic;
    }

    /* ── Inline marks ───────────────────────────────────────────── */
    .ldw-prose-body strong { font-weight: 700; }
    .ldw-prose-body em     { font-style: italic; }
    .ldw-prose-body u      { text-decoration: underline; }

    /* ── Links ──────────────────────────────────────────────────── */
    .ldw-prose-body a {
      color: #C9A84C;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .ldw-prose-body a:hover { color: #a07c2e; }

    /* ── Code ───────────────────────────────────────────────────── */
    .ldw-prose-body code {
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 11px;
      background: #f5f0e8;
      padding: 1px 5px;
      border-radius: 3px;
    }

    /* ── Editor-only: placeholder ───────────────────────────────── */
    .ldw-prose-body p.is-editor-empty:first-child::before {
      content: attr(data-placeholder);
      float: left;
      color: #c0bbb4;
      pointer-events: none;
      height: 0;
    }

    /* ── Editor-only: selection ─────────────────────────────────── */
    .ldw-prose-body ::selection {
      background: rgba(201, 168, 76, 0.18);
    }
  `;

  document.head.appendChild(el);
};
