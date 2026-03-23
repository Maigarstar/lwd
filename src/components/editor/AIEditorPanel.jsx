// ─── src/components/editor/AIEditorPanel.jsx ─────────────────────────────────
// AI writing assistant panel for the CMS editor
// Actions: improve, clarity, expand, shorten, formal, friendly, grammar, generate
// AI result is NEVER auto-applied — always shown for human review first
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { aiContentAssist } from '../../services/cmsService';

const NU = 'var(--font-body)';
const GD = 'var(--font-heading-primary)';

const ACTIONS = [
  { key: 'improve',   label: 'Improve writing',         icon: '✦' },
  { key: 'clarity',   label: 'Rewrite for clarity',     icon: '◈' },
  { key: 'expand',    label: 'Expand section',           icon: '↕' },
  { key: 'shorten',   label: 'Shorten section',          icon: '↔' },
  { key: 'formal',    label: 'Make more formal',         icon: '⊡' },
  { key: 'friendly',  label: 'Make more user-friendly',  icon: '◎' },
  { key: 'grammar',   label: 'Fix grammar',              icon: '✓' },
];

export default function AIEditorPanel({
  fullContent,
  selectionText,
  pageKey,
  onApply,
  C,
}) {
  const [scope, setScope] = useState('selection'); // 'selection' | 'full'
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [activeAction, setActiveAction] = useState(null);

  const gold   = C?.gold   || '#C9A84C';
  const card   = C?.card   || '#141414';
  const border = C?.border || '#1e1e1e';
  const off    = C?.off    || '#f5f0e8';

  const hasSelection = Boolean(selectionText && selectionText.trim());
  const effectiveScope = hasSelection ? scope : 'full';

  async function runAction(action, custom) {
    setLoading(true);
    setError(null);
    setResult(null);
    setActiveAction(action);

    try {
      const targetContent = effectiveScope === 'selection' && hasSelection
        ? selectionText
        : fullContent;

      const html = await aiContentAssist({
        action,
        content: targetContent,
        selection: effectiveScope === 'selection' ? selectionText : '',
        customPrompt: custom || '',
        pageKey,
      });
      setResult({ html, action, usedSelection: effectiveScope === 'selection' && hasSelection });
    } catch (err) {
      setError(err.message || 'AI request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    if (!result) return;
    onApply?.({ html: result.html, replacedSelection: result.usedSelection });
    setResult(null);
    setActiveAction(null);
  }

  function handleDiscard() {
    setResult(null);
    setActiveAction(null);
    setError(null);
  }

  return (
    <div style={{
      fontFamily: NU,
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: '16px 20px 12px',
        borderBottom: `1px solid ${border}`,
      }}>
        <div style={{
          fontFamily: GD,
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: gold,
          marginBottom: 4,
        }}>AI Tools</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
          Powered by Taigenic.ai
        </div>
      </div>

      {/* ── Scope selector (only shown if text is selected) ── */}
      {hasSelection && (
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${border}` }}>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>
            Apply to
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { v: 'selection', label: 'Selected text' },
              { v: 'full',      label: 'Full content' },
            ].map(({ v, label }) => (
              <button
                key={v}
                type="button"
                onClick={() => setScope(v)}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  background: scope === v ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${scope === v ? 'rgba(201,168,76,0.4)' : border}`,
                  borderRadius: 4,
                  color: scope === v ? gold : 'rgba(255,255,255,0.45)',
                  fontSize: 11,
                  fontFamily: NU,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >{label}</button>
            ))}
          </div>
        </div>
      )}

      {!hasSelection && (
        <div style={{ padding: '10px 20px', borderBottom: `1px solid ${border}` }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', fontStyle: 'italic' }}>
            Select text in the editor to target a specific section, or apply to the full content below.
          </div>
        </div>
      )}

      {/* ── Action buttons ── */}
      <div style={{ padding: '12px 20px', borderBottom: `1px solid ${border}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {ACTIONS.map(({ key, label, icon }) => (
          <button
            key={key}
            type="button"
            disabled={loading}
            onClick={() => runAction(key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '9px 12px',
              background: activeAction === key && loading
                ? 'rgba(201,168,76,0.1)'
                : 'rgba(255,255,255,0.03)',
              border: `1px solid ${activeAction === key && loading ? 'rgba(201,168,76,0.3)' : border}`,
              borderRadius: 6,
              color: loading ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.65)',
              fontSize: 12,
              fontFamily: NU,
              textAlign: 'left',
              cursor: loading ? 'wait' : 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              if (!loading) {
                e.currentTarget.style.background = 'rgba(201,168,76,0.08)';
                e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)';
                e.currentTarget.style.color = off;
              }
            }}
            onMouseLeave={e => {
              if (!loading) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.borderColor = border;
                e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
              }
            }}
          >
            <span style={{ fontSize: 10, color: gold, flexShrink: 0 }}>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Generate from prompt ── */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${border}` }}>
        <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>
          Generate from prompt
        </div>
        <textarea
          value={generatePrompt}
          onChange={e => setGeneratePrompt(e.target.value)}
          placeholder="Describe what content to generate…"
          rows={3}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${border}`,
            borderRadius: 6,
            color: off,
            fontSize: 12,
            fontFamily: NU,
            padding: '10px 12px',
            resize: 'vertical',
            outline: 'none',
            lineHeight: 1.6,
            boxSizing: 'border-box',
          }}
          onFocus={e => { e.target.style.borderColor = 'rgba(201,168,76,0.4)'; }}
          onBlur={e => { e.target.style.borderColor = border; }}
        />
        <button
          type="button"
          disabled={loading || !generatePrompt.trim()}
          onClick={() => runAction('generate', generatePrompt)}
          style={{
            marginTop: 8,
            width: '100%',
            padding: '9px',
            background: generatePrompt.trim() && !loading ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${generatePrompt.trim() && !loading ? 'rgba(201,168,76,0.35)' : border}`,
            borderRadius: 6,
            color: generatePrompt.trim() && !loading ? gold : 'rgba(255,255,255,0.2)',
            fontSize: 12,
            fontFamily: NU,
            fontWeight: 600,
            cursor: generatePrompt.trim() && !loading ? 'pointer' : 'default',
            transition: 'all 0.15s',
          }}
        >
          {loading && activeAction === 'generate' ? 'Generating…' : 'Generate'}
        </button>
      </div>

      {/* ── Loading indicator ── */}
      {loading && (
        <div style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{
            width: 8, height: 8,
            borderRadius: '50%',
            background: gold,
            display: 'inline-block',
            animation: 'lwd-ai-pulse 1.2s ease-in-out infinite',
            flexShrink: 0,
          }} />
          <style>{`
            @keyframes lwd-ai-pulse {
              0%, 100% { opacity: 0.3; transform: scale(0.9); }
              50% { opacity: 1; transform: scale(1.1); }
            }
          `}</style>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
            AI is thinking…
          </span>
        </div>
      )}

      {/* ── Error state ── */}
      {error && (
        <div style={{
          margin: '12px 20px',
          padding: '12px 14px',
          background: 'rgba(244,63,94,0.08)',
          border: '1px solid rgba(244,63,94,0.2)',
          borderRadius: 6,
          fontSize: 12,
          color: '#f87171',
          lineHeight: 1.5,
        }}>
          <strong>Error:</strong> {error}
          <button
            type="button"
            onClick={handleDiscard}
            style={{
              display: 'block',
              marginTop: 8,
              fontSize: 11,
              color: 'rgba(248,113,113,0.7)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              fontFamily: NU,
              textDecoration: 'underline',
            }}
          >Dismiss</button>
        </div>
      )}

      {/* ── AI Result panel ── */}
      {result && !loading && (
        <div style={{
          margin: '12px 20px 20px',
          border: `1px solid rgba(201,168,76,0.25)`,
          borderRadius: 8,
          overflow: 'hidden',
        }}>
          {/* Result header */}
          <div style={{
            padding: '10px 14px',
            background: 'rgba(201,168,76,0.08)',
            borderBottom: `1px solid rgba(201,168,76,0.15)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: gold }}>
              AI Suggestion
            </span>
            {result.usedSelection && (
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                Selected text
              </span>
            )}
          </div>

          {/* Result preview — rendered HTML */}
          <div
            className="lwd-ai-preview"
            style={{
              padding: '14px 16px',
              background: 'rgba(255,255,255,0.02)',
              maxHeight: 280,
              overflowY: 'auto',
            }}
          >
            <style>{`
              .lwd-ai-preview h1, .lwd-ai-preview h2, .lwd-ai-preview h3 {
                font-family: var(--font-heading-primary);
                color: #f5f0e8;
                margin: 0 0 10px;
                font-size: 14px;
              }
              .lwd-ai-preview p { font-size: 12px; color: rgba(245,240,232,0.7); line-height: 1.7; margin: 0 0 10px; font-family: var(--font-body); }
              .lwd-ai-preview ul, .lwd-ai-preview ol { padding-left: 18px; margin: 0 0 10px; }
              .lwd-ai-preview li { font-size: 12px; color: rgba(245,240,232,0.7); margin-bottom: 4px; font-family: var(--font-body); }
              .lwd-ai-preview a { color: #C9A84C; }
              .lwd-ai-preview hr { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 12px 0; }
              .lwd-ai-preview strong { color: #f5f0e8; font-weight: 600; }
            `}</style>
            <div dangerouslySetInnerHTML={{ __html: result.html }} />
          </div>

          {/* Apply / Discard */}
          <div style={{
            padding: '10px 14px',
            borderTop: `1px solid rgba(201,168,76,0.1)`,
            display: 'flex',
            gap: 8,
          }}>
            <button
              type="button"
              onClick={handleApply}
              style={{
                flex: 1,
                padding: '8px',
                background: 'linear-gradient(135deg, #C9A84C, #9b7a1a)',
                border: 'none',
                borderRadius: 6,
                color: '#0f0d0a',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: NU,
                cursor: 'pointer',
                letterSpacing: '0.04em',
              }}
            >Apply</button>
            <button
              type="button"
              onClick={handleDiscard}
              style={{
                flex: 1,
                padding: '8px',
                background: 'transparent',
                border: `1px solid ${border}`,
                borderRadius: 6,
                color: 'rgba(255,255,255,0.4)',
                fontSize: 12,
                fontFamily: NU,
                cursor: 'pointer',
              }}
            >Discard</button>
          </div>
        </div>
      )}
    </div>
  );
}
