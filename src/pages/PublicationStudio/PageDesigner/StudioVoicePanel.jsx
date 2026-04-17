// ─── StudioVoicePanel.jsx ─────────────────────────────────────────────────────
// Editorial Voice Training for the Publication Studio.
//
// Lets the user define their publication's editorial DNA:
//   • Tone words      — the feeling/register of every piece
//   • Writing rules   — house style rules the AI must follow
//   • Avoid words     — clichés and generic words to ban
//   • Sample copy     — a paste-in reference paragraph that trains the voice
//
// Everything is saved to localStorage via studioVoiceService and injected
// into ALL AI generation prompts automatically.

import { useState, useEffect } from 'react';
import { GOLD, BORDER, MUTED, NU, GD } from './designerConstants';
import { loadVoice, saveVoice, getVoiceInjection } from '../../../services/studioVoiceService';
import { callAiGenerate } from '../../../lib/aiGenerate';

const PRESET_TONES = [
  'Luxury Editorial', 'Cinematic', 'Intimate', 'Architectural',
  'Poetic', 'Authoritative', 'Warm', 'Evocative',
  'Specific', 'Global', 'Classic', 'Modern',
];

const BG  = '#0F0E0B';
const BG2 = '#1A1712';
const BDR = BORDER;

function SectionTitle({ children }) {
  return (
    <div style={{
      fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD,
      letterSpacing: '0.18em', textTransform: 'uppercase',
      marginBottom: 8, marginTop: 20,
    }}>
      {children}
    </div>
  );
}

function Hint({ children }) {
  return (
    <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, lineHeight: 1.6, marginBottom: 10, letterSpacing: '0.03em' }}>
      {children}
    </div>
  );
}

// Tag chip — removable
function Tag({ label, onRemove, color = GOLD }) {
  const [hov, setHov] = useState(false);
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: `rgba(201,169,110,0.1)`,
        border: `1px solid rgba(201,169,110,0.3)`,
        borderRadius: 2, padding: '3px 7px',
        fontFamily: NU, fontSize: 9, fontWeight: 700,
        color, letterSpacing: '0.06em', textTransform: 'uppercase',
      }}
    >
      {label}
      <button
        onClick={onRemove}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: 'none', border: 'none', color: hov ? '#fff' : MUTED,
          cursor: 'pointer', padding: 0, fontSize: 10, lineHeight: 1,
        }}
      >
        ×
      </button>
    </span>
  );
}

function AvoidTag({ label, onRemove }) {
  const [hov, setHov] = useState(false);
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: 'rgba(220,60,60,0.07)',
        border: '1px solid rgba(220,60,60,0.2)',
        borderRadius: 2, padding: '3px 7px',
        fontFamily: NU, fontSize: 9, fontWeight: 600,
        color: '#f87171', letterSpacing: '0.04em',
      }}
    >
      {label}
      <button
        onClick={onRemove}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: 'none', border: 'none', color: hov ? '#fff' : 'rgba(248,113,113,0.5)',
          cursor: 'pointer', padding: 0, fontSize: 10, lineHeight: 1,
        }}
      >
        ×
      </button>
    </span>
  );
}

function RuleRow({ rule, index, onRemove, onEdit }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 8,
        padding: '7px 10px',
        background: hov ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
        border: `1px solid rgba(255,255,255,0.06)`,
        borderRadius: 3, marginBottom: 4,
      }}
    >
      <span style={{ fontFamily: NU, fontSize: 9, color: GOLD, flexShrink: 0, marginTop: 1 }}>
        {String(index + 1).padStart(2, '0')}
      </span>
      <span style={{ flex: 1, fontFamily: NU, fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
        {rule}
      </span>
      {hov && (
        <button
          onClick={onRemove}
          style={{
            background: 'none', border: 'none', color: MUTED,
            cursor: 'pointer', padding: 0, fontSize: 12, flexShrink: 0,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

// Shared text input style
const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)',
  border: `1px solid ${BDR}`,
  borderRadius: 3, color: '#fff',
  fontFamily: NU, fontSize: 11,
  padding: '7px 10px', outline: 'none',
};

// ── Main component ────────────────────────────────────────────────────────────
export default function StudioVoicePanel({ onClose }) {
  const [voice,       setVoice]       = useState(loadVoice);
  const [saved,       setSaved]       = useState(false);
  const [testing,     setTesting]     = useState(false);
  const [testResult,  setTestResult]  = useState('');
  const [testError,   setTestError]   = useState('');
  const [newTone,     setNewTone]     = useState('');
  const [newAvoid,    setNewAvoid]    = useState('');
  const [newRule,     setNewRule]     = useState('');

  // Auto-save whenever voice changes (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      saveVoice(voice);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    }, 600);
    return () => clearTimeout(t);
  }, [voice]);

  function update(field, value) {
    setVoice(v => ({ ...v, [field]: value }));
  }

  // Tone words
  function addTone(word) {
    const w = word.trim();
    if (!w || voice.toneWords.includes(w)) return;
    update('toneWords', [...voice.toneWords, w]);
    setNewTone('');
  }
  function removeTone(w) { update('toneWords', voice.toneWords.filter(x => x !== w)); }

  // Avoid words
  function addAvoid(word) {
    const w = word.trim().toLowerCase();
    if (!w || voice.avoidWords.includes(w)) return;
    update('avoidWords', [...voice.avoidWords, w]);
    setNewAvoid('');
  }
  function removeAvoid(w) { update('avoidWords', voice.avoidWords.filter(x => x !== w)); }

  // Rules
  function addRule() {
    const r = newRule.trim();
    if (!r) return;
    update('rules', [...voice.rules, r]);
    setNewRule('');
  }
  function removeRule(i) { update('rules', voice.rules.filter((_, idx) => idx !== i)); }

  // Test voice
  async function handleTest() {
    setTesting(true); setTestResult(''); setTestError('');
    try {
      const voiceBlock = getVoiceInjection();
      const res = await callAiGenerate({
        feature: 'voice_test',
        systemPrompt: `You are a luxury wedding editorial writer. ${voiceBlock}\n\nWrite ONLY what is asked — no intro, no explanation. One short editorial paragraph only.`,
        userPrompt: 'Write one editorial paragraph (3–4 sentences) describing a candlelit wedding reception in a converted Italian palazzo. Apply the voice training above exactly.',
        maxTokens: 250,
      });
      setTestResult(res?.text?.trim() || 'No output returned.');
    } catch (e) {
      setTestError(e.message || 'Test failed');
    }
    setTesting(false);
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 440, maxWidth: '94vw',
          background: BG,
          borderLeft: `1px solid ${BDR}`,
          borderTop: `2px solid ${GOLD}`,
          display: 'flex', flexDirection: 'column',
          height: '100%',
          animation: 'voiceSlide 0.22s cubic-bezier(0.16,1,0.3,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`@keyframes voiceSlide { from { transform: translateX(48px); opacity:0 } to { transform: translateX(0); opacity:1 } }`}</style>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div style={{ padding: '16px 18px 14px', borderBottom: `1px solid ${BDR}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: NU, fontSize: 8, fontWeight: 700, color: GOLD, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 2 }}>
                ✦ Taigenic.ai
              </div>
              <div style={{ fontFamily: GD, fontSize: 20, fontStyle: 'italic', color: '#F0EBE0' }}>
                Editorial Voice
              </div>
              <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, marginTop: 3, lineHeight: 1.5 }}>
                Train the AI to write in your publication's voice. Applied to every generation.
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              {saved && (
                <span style={{ fontFamily: NU, fontSize: 8, color: '#34d399', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  ✓ Saved
                </span>
              )}
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}>
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* ── Scrollable body ────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 18px 24px' }}>

          {/* Publication name */}
          <SectionTitle>Publication Name</SectionTitle>
          <input
            type="text"
            value={voice.publication}
            onChange={e => update('publication', e.target.value)}
            placeholder="e.g. Luxury Wedding Directory"
            style={inputStyle}
          />

          {/* ── Tone Words ─────────────────────────────────────────────── */}
          <SectionTitle>Editorial Tone</SectionTitle>
          <Hint>Words that define the feeling and register of every piece of writing.</Hint>

          {/* Preset tone pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
            {PRESET_TONES.map(t => {
              const active = voice.toneWords.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => active ? removeTone(t) : addTone(t)}
                  style={{
                    fontFamily: NU, fontSize: 8, fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    background: active ? 'rgba(201,169,110,0.18)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${active ? 'rgba(201,169,110,0.5)' : BDR}`,
                    borderRadius: 2, color: active ? GOLD : MUTED,
                    padding: '4px 9px', cursor: 'pointer', transition: 'all 0.12s',
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>

          {/* Custom tone input */}
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              value={newTone}
              onChange={e => setNewTone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTone(newTone)}
              placeholder="Add custom tone…"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={() => addTone(newTone)} style={{
              background: 'rgba(201,169,110,0.12)', border: `1px solid rgba(201,169,110,0.3)`,
              borderRadius: 3, color: GOLD, fontFamily: NU, fontSize: 9, fontWeight: 700,
              padding: '0 12px', cursor: 'pointer',
            }}>+ Add</button>
          </div>

          {/* Active tone tags */}
          {voice.toneWords.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
              {voice.toneWords.map(w => <Tag key={w} label={w} onRemove={() => removeTone(w)} />)}
            </div>
          )}

          {/* ── Writing Rules ─────────────────────────────────────────── */}
          <SectionTitle>Writing Rules</SectionTitle>
          <Hint>Specific instructions the AI must follow on every generation.</Hint>

          {voice.rules.map((r, i) => (
            <RuleRow key={i} rule={r} index={i} onRemove={() => removeRule(i)} />
          ))}

          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <input
              type="text"
              value={newRule}
              onChange={e => setNewRule(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addRule()}
              placeholder="e.g. Always name the specific variety of flowers…"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={addRule} style={{
              background: 'rgba(201,169,110,0.12)', border: `1px solid rgba(201,169,110,0.3)`,
              borderRadius: 3, color: GOLD, fontFamily: NU, fontSize: 9, fontWeight: 700,
              padding: '0 12px', cursor: 'pointer', whiteSpace: 'nowrap',
            }}>+ Add</button>
          </div>

          {/* ── Words to Avoid ────────────────────────────────────────── */}
          <SectionTitle>Words to Never Use</SectionTitle>
          <Hint>Banned words and clichés. The AI will actively avoid these in all output.</Hint>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
            {voice.avoidWords.map(w => <AvoidTag key={w} label={w} onRemove={() => removeAvoid(w)} />)}
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              value={newAvoid}
              onChange={e => setNewAvoid(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addAvoid(newAvoid); } }}
              placeholder="Type word + Enter to add…"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={() => addAvoid(newAvoid)} style={{
              background: 'rgba(220,60,60,0.1)', border: '1px solid rgba(220,60,60,0.25)',
              borderRadius: 3, color: '#f87171', fontFamily: NU, fontSize: 9, fontWeight: 700,
              padding: '0 12px', cursor: 'pointer',
            }}>+ Ban</button>
          </div>

          {/* ── Sample Copy ───────────────────────────────────────────── */}
          <SectionTitle>Voice Reference Copy</SectionTitle>
          <Hint>
            Paste a paragraph from a piece you love — an article, a description, anything that captures your exact voice. The AI studies this and mirrors the register, rhythm, and specificity.
          </Hint>

          <textarea
            value={voice.sampleCopy}
            onChange={e => update('sampleCopy', e.target.value)}
            placeholder={`e.g. "The light in Villa Rufolo arrives differently each hour. By early evening, it pools against the stonework in long amber shafts, illuminating the wisteria that clings to the arched colonnade like a memory. Wedding guests arrive to find tables set not just with linen and crystal, but with a kind of hush — the particular silence of a place that has absorbed centuries of significant moments."`}
            rows={6}
            style={{
              ...inputStyle,
              resize: 'vertical', lineHeight: 1.6, fontSize: 12,
              fontFamily: "'Cormorant Garamond', serif",
            }}
          />
          {voice.sampleCopy && (
            <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, marginTop: 4 }}>
              {voice.sampleCopy.split(/\s+/).filter(Boolean).length} words
            </div>
          )}

          {/* ── Test Voice ────────────────────────────────────────────── */}
          <SectionTitle>Test Your Voice</SectionTitle>
          <Hint>See a sample paragraph generated with your current voice settings.</Hint>

          <button
            onClick={handleTest}
            disabled={testing}
            style={{
              width: '100%', marginBottom: 12,
              background: testing ? 'rgba(201,169,110,0.2)' : 'rgba(201,169,110,0.12)',
              border: `1px solid rgba(201,169,110,0.4)`,
              borderRadius: 3, color: GOLD,
              fontFamily: NU, fontSize: 10, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '10px 0', cursor: testing ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {testing ? (
              <>
                <span style={{ display: 'inline-block', animation: 'voiceSpin 0.8s linear infinite' }}>⟳</span>
                Generating test paragraph…
              </>
            ) : '✦ Generate Test Paragraph'}
          </button>
          <style>{`@keyframes voiceSpin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>

          {testError && (
            <div style={{ fontFamily: NU, fontSize: 10, color: '#f87171', padding: '8px 12px', background: 'rgba(248,113,113,0.08)', borderRadius: 3, marginBottom: 10 }}>
              {testError}
            </div>
          )}

          {testResult && !testing && (
            <div style={{
              padding: '14px 16px',
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid rgba(201,169,110,0.2)`,
              borderLeft: `3px solid ${GOLD}`,
              borderRadius: 3,
              marginBottom: 10,
            }}>
              <div style={{ fontFamily: NU, fontSize: 8, fontWeight: 700, color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>
                Voice test output
              </div>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: '#F0EBE0', lineHeight: 1.8, margin: 0, fontStyle: 'italic' }}>
                {testResult}
              </p>
            </div>
          )}

          {/* ── Content Format: Multi-venue articles ──────────────────── */}
          <div style={{ marginTop: 8, padding: '14px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${BDR}`, borderRadius: 4 }}>
            <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>
              ✦ Long-form Content
            </div>
            <p style={{ fontFamily: NU, fontSize: 10, color: MUTED, lineHeight: 1.7, margin: 0 }}>
              For articles like "Top 10 Venues in London", use the <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Magazine Article Editor</strong> — not the Page Designer AI Builder. Each venue gets its own 400+ word section with rich editorial detail, applied using this voice.
            </p>
            <p style={{ fontFamily: NU, fontSize: 10, color: MUTED, lineHeight: 1.7, margin: '8px 0 0' }}>
              In your article brief, write: <em style={{ color: 'rgba(255,255,255,0.5)' }}>"Top 10 wedding venues in London — minimum 400 words per venue, specific architectural details, atmosphere, and what makes each one unique."</em>
            </p>
          </div>

          <div style={{ height: 24 }} />
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div style={{
          padding: '12px 18px', borderTop: `1px solid ${BDR}`,
          flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontFamily: NU, fontSize: 9, color: MUTED, letterSpacing: '0.04em' }}>
            {saved ? '✓ Auto-saved' : 'Changes save automatically'}
          </span>
          <button
            onClick={onClose}
            style={{
              background: GOLD, border: 'none', borderRadius: 3, color: '#0E0D0B',
              fontFamily: NU, fontSize: 9, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '8px 20px', cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
