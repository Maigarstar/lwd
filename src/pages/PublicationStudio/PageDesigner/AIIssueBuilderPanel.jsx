// ─── AIIssueBuilderPanel.jsx ──────────────────────────────────────────────────
// AI Issue Builder — type a brief, get a full magazine issue structure.
// Calls the ai-generate edge function to produce a JSON page plan, shows
// a review step, then builds all pages off-screen and inserts them in one shot.

import { useState } from 'react';
import { callAiGenerate } from '../../../lib/aiGenerate';
import { GOLD, BORDER, MUTED, NU, GD } from './designerConstants';

// ── Available templates the AI can choose from ────────────────────────────────
const VALID_TEMPLATES = [
  { id: 'vogue-cover',      label: 'Cover',               category: 'Cover'       },
  { id: 'editors-letter',   label: "Editor's Letter",     category: 'Editorial'   },
  { id: 'table-of-contents',label: 'Contents Page',       category: 'Navigation'  },
  { id: 'feature-spread',   label: 'Feature Spread',      category: 'Editorial'   },
  { id: 'the-destination',  label: 'Destination Page',    category: 'Travel'      },
  { id: 'the-runway',       label: 'Fashion Runway',      category: 'Fashion'     },
  { id: 'the-gown',         label: 'The Gown',            category: 'Bridal'      },
  { id: 'the-jewel',        label: 'Jewellery Page',      category: 'Jewellery'   },
  { id: 'beauty-edit',      label: 'Beauty Edit',         category: 'Beauty'      },
  { id: 'floral-spread',    label: 'Floral Spread',       category: 'Florals'     },
  { id: 'invitation-suite', label: 'Invitation Suite',    category: 'Stationery'  },
  { id: 'cake-moment',      label: 'Cake Moment',         category: 'Food & Cake' },
  { id: 'couple-story',     label: 'Couple Story',        category: 'Couple'      },
  { id: 'the-portrait',     label: 'Portrait Page',       category: 'Real Wedding'},
  { id: 'ceremony-aisle',   label: 'Ceremony Aisle',      category: 'Ceremony'    },
  { id: 'reception-table',  label: 'Reception Table',     category: 'Reception'   },
  { id: 'the-hotel',        label: 'Venue Feature',       category: 'Venue'       },
  { id: 'venue-portrait',   label: 'Venue Portrait',      category: 'Venue'       },
  { id: 'the-triptych',     label: 'Detail Triptych',     category: 'Detail'      },
  { id: 'full-bleed',       label: 'Full Bleed',          category: 'Editorial'   },
  { id: 'lux-grid',         label: 'Luxury Grid',         category: 'Editorial'   },
  { id: 'pull-quote',       label: 'Pull Quote',          category: 'Editorial'   },
  { id: 'planner-spotlight',label: 'Planner Spotlight',   category: 'Editorial'   },
  { id: 'honeymoon-edit',   label: 'Honeymoon Edit',      category: 'Editorial'   },
  { id: 'ring-edit',        label: 'Ring Edit',           category: 'Editorial'   },
  { id: 'back-cover',       label: 'Back Cover',          category: 'Back Cover'  },
];

const TEMPLATE_IDS_LIST = VALID_TEMPLATES.map(t => t.id).join(', ');

const PAGE_COUNTS = [6, 8, 10, 12, 16];

const SYSTEM_PROMPT = `You are the creative director and editor-in-chief of Luxury Wedding Directory — a world-class editorial wedding publication, peer of Vogue Weddings and Condé Nast Traveller. Your task is to plan a bespoke magazine issue with genuine editorial intelligence.

You must return ONLY a valid JSON array. No markdown, no explanation, just the raw JSON array.

Each item represents one page:
{
  "template_id": "one of the valid template ids",
  "page_label": "short descriptive label for this page",
  "kicker": "SHORT KICKER — 3-5 words, ALL CAPS, specific to this page's angle",
  "headline": "Evocative editorial headline — 3-8 words, italic-friendly, specific and poetic",
  "body": "2-3 sentences of luxury editorial copy. Specific to the location/theme/product. Reads like Condé Nast Traveller. Never generic.",
  "location": "City, Region or Country if relevant",
  "byline": "Optional: 'Photography · Studio Name' or 'Words · Editor Name'"
}

Valid template_id values: ${TEMPLATE_IDS_LIST}

CREATIVE DIRECTION RULES — these are non-negotiable:
1. First page MUST be "vogue-cover", last page MUST be "back-cover"
2. NEVER repeat the same template_id more than ONCE (every page must be visually different)
3. Build a genuine editorial arc: opening sequence → feature content → fashion/beauty → real wedding → venue → closing
4. Visual rhythm: alternate between image-heavy pages (full-bleed, feature-spread) and text-forward pages (pull-quote, editors-letter)
5. Each page must have its OWN specific angle — no two pages should feel similar in theme OR layout
6. Headlines must be specific to the brief: "Sunlit Terraces at Dusk" not "Beautiful Wedding Venue"
7. Kickers must be punchy and unique per page: not all "THE WEDDING", "THE VENUE", "THE DRESS"
8. Body copy: name specific details — flowers, fabrics, time of day, architectural features, emotions
9. Think like a real magazine: surprise the reader every turn of the page
10. Return EXACTLY the number of pages requested — no more, no less`;

// ── Category colour map ────────────────────────────────────────────────────────
const CAT_COLOURS = {
  Cover: GOLD, Editorial: '#a78bfa', Travel: '#34d399', Fashion: '#f9a8d4',
  Bridal: '#fbbf24', Jewellery: '#60a5fa', Beauty: '#f472b6',
  Florals: '#86efac', Stationery: '#c4b5fd', 'Food & Cake': '#fdba74',
  Couple: '#f9a8d4', 'Real Wedding': '#34d399', Ceremony: '#a5f3fc',
  Reception: '#fde68a', Venue: '#6ee7b7', Navigation: '#cbd5e1',
  Detail: '#e2e8f0', 'Back Cover': GOLD,
};
function catColour(cat) { return CAT_COLOURS[cat] || 'rgba(255,255,255,0.4)'; }

// ── Main component ─────────────────────────────────────────────────────────────
export default function AIIssueBuilderPanel({ onBuild, onClose }) {
  const [brief,     setBrief]     = useState('');
  const [pageCount, setPageCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [structure,  setStructure]  = useState(null); // parsed AI page plan
  const [error,      setError]      = useState('');
  const [building,   setBuilding]   = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [builtCount,    setBuiltCount]    = useState(0);  // pages added — shown in success state

  // ── Step 1: Generate structure ──────────────────────────────────────────────
  async function handleGenerate() {
    if (!brief.trim()) { setError('Add a brief first'); return; }
    setGenerating(true);
    setError('');
    setStructure(null);

    const userPrompt = `Create a ${pageCount}-page luxury wedding magazine issue.

Brief: ${brief.trim()}

Return exactly ${pageCount} pages. Remember: first page = vogue-cover, last page = back-cover.`;

    try {
      const res = await callAiGenerate({
        feature: 'magazine-issue-builder',
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        maxTokens: 3000,
      });

      // Parse JSON — strip any markdown fences just in case
      let raw = (res?.text || '').trim();
      raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Invalid structure returned');

      // Validate / normalise template ids
      const validated = parsed.map((p, i) => ({
        ...p,
        template_id: VALID_TEMPLATES.find(t => t.id === p.template_id)
          ? p.template_id
          : (i === 0 ? 'vogue-cover' : i === parsed.length - 1 ? 'back-cover' : 'feature-spread'),
      }));

      setStructure(validated);
    } catch (e) {
      setError('Generation failed: ' + (e.message || 'parse error'));
    }
    setGenerating(false);
  }

  // ── Step 2: Build all pages ─────────────────────────────────────────────────
  async function handleBuild() {
    if (!structure?.length) return;
    setBuilding(true);
    setBuildProgress(0);
    setError('');
    try {
      await onBuild(structure, (n) => setBuildProgress(n));
      // On success: show done state (don't close — let user decide)
      setBuiltCount(structure.length);
      setStructure(null);
      setBrief('');
    } catch (e) {
      setError('Build failed: ' + (e.message || 'unknown error'));
    }
    setBuilding(false);
  }

  function handleReset() {
    setStructure(null);
    setBuiltCount(0);
    setError('');
    setBuildProgress(0);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 900,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 560, maxHeight: '88vh',
          background: '#141210',
          border: `1px solid ${BORDER}`,
          borderRadius: 6,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'aibIn 0.2s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`@keyframes aibIn { from { transform: scale(0.96); opacity:0 } to { transform: scale(1); opacity:1 } }`}</style>

        {/* Header */}
        <div style={{
          padding: '18px 22px 14px',
          borderBottom: `1px solid ${BORDER}`,
          flexShrink: 0,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 3 }}>
              ✦ AI Issue Builder
            </div>
            <div style={{ fontFamily: GD, fontSize: 20, fontStyle: 'italic', color: '#fff', lineHeight: 1.2 }}>
              {builtCount > 0 && !building
                ? `${builtCount} pages added ✓`
                : structure
                ? `${structure.length}-page structure ready`
                : 'Describe your issue'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>

          {/* ── SUCCESS STATE ── */}
          {builtCount > 0 && !building && (
            <div style={{
              marginBottom: 20,
              background: 'rgba(52,211,153,0.06)',
              border: '1px solid rgba(52,211,153,0.25)',
              borderRadius: 6,
              padding: '20px 20px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>✦</div>
              <div style={{ fontFamily: GD, fontSize: 17, fontStyle: 'italic', color: '#34d399', marginBottom: 6 }}>
                {builtCount} pages added to your issue
              </div>
              <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, lineHeight: 1.7, marginBottom: 16 }}>
                Your pages are ready in the canvas.<br />
                Close this panel or build another section.
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button
                  onClick={handleReset}
                  style={{
                    fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    background: 'rgba(201,169,110,0.12)', border: `1px solid rgba(201,169,110,0.35)`,
                    borderRadius: 3, color: GOLD, padding: '8px 18px', cursor: 'pointer',
                  }}
                >
                  ✦ Build More Pages
                </button>
                <button
                  onClick={onClose}
                  style={{
                    fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    background: 'none', border: `1px solid ${BORDER}`,
                    borderRadius: 3, color: MUTED, padding: '8px 18px', cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* ── BRIEF INPUT + build flow (hidden after success) ── */}
          {!(builtCount > 0 && !building) && <div style={{ marginBottom: 16 }}>
            <label style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Issue Brief
            </label>
            <textarea
              value={brief}
              onChange={e => { setBrief(e.target.value); setStructure(null); setError(''); }}
              placeholder={`e.g. "A 12-page Amalfi Coast summer wedding issue featuring coastal venues, Italian fashion, and clifftop ceremonies"`}
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${BORDER}`,
                borderRadius: 4, color: '#fff',
                fontFamily: NU, fontSize: 13, lineHeight: 1.5,
                padding: '10px 12px', outline: 'none', resize: 'vertical',
              }}
            />
          </div>

          {/* Page count */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Pages
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {PAGE_COUNTS.map(n => (
                <button
                  key={n}
                  onClick={() => { setPageCount(n); setStructure(null); }}
                  style={{
                    fontFamily: NU, fontSize: 12, fontWeight: 700,
                    padding: '6px 16px', borderRadius: 3, cursor: 'pointer',
                    background: pageCount === n ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${pageCount === n ? 'rgba(201,168,76,0.5)' : BORDER}`,
                    color: pageCount === n ? GOLD : MUTED,
                    transition: 'all 0.12s',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ fontFamily: NU, fontSize: 11, color: '#f87171', marginBottom: 14, padding: '8px 12px', background: 'rgba(248,113,113,0.08)', borderRadius: 3 }}>
              {error}
            </div>
          )}

          {/* ── GENERATED STRUCTURE PREVIEW ── */}
          {structure && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                Page Structure — {structure.length} pages
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {structure.map((p, i) => {
                  const tpl = VALID_TEMPLATES.find(t => t.id === p.template_id);
                  const colour = catColour(tpl?.category || '');
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        padding: '9px 12px',
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${BORDER}`,
                        borderRadius: 3,
                      }}
                    >
                      {/* Page number */}
                      <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, minWidth: 20, paddingTop: 1, flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      {/* Colour dot + template label */}
                      <div style={{ flexShrink: 0, paddingTop: 2 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: colour }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: colour, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                            {tpl?.label || p.template_id}
                          </span>
                          {p.kicker && (
                            <span style={{ fontFamily: NU, fontSize: 9, color: MUTED }}>
                              {p.kicker}
                            </span>
                          )}
                        </div>
                        {p.headline && (
                          <div style={{ fontFamily: GD, fontSize: 13, fontStyle: 'italic', color: 'rgba(255,255,255,0.8)', marginTop: 2, lineHeight: 1.3 }}>
                            {p.headline.replace(/\\n/g, ' ')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Build progress — prominent overlay-style ─────────────────── */}
          {building && (
            <div style={{
              marginTop: 16,
              background: 'rgba(0,0,0,0.35)',
              border: `1px solid rgba(201,169,110,0.2)`,
              borderRadius: 6,
              padding: '20px 20px 16px',
            }}>
              <style>{`
                @keyframes aibPulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
                @keyframes aibSpin  { from{transform:rotate(0)} to{transform:rotate(360deg)} }
              `}</style>

              {/* Spinner + label row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  border: `2px solid rgba(201,169,110,0.2)`,
                  borderTopColor: GOLD,
                  animation: 'aibSpin 0.9s linear infinite',
                  flexShrink: 0,
                }} />
                <div>
                  <div style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>
                    Building page {buildProgress} of {structure?.length}
                  </div>
                  <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, marginTop: 2, letterSpacing: '0.03em' }}>
                    {buildProgress === 0
                      ? 'Preparing templates…'
                      : buildProgress === structure?.length
                      ? 'Finalising issue…'
                      : `Rendering "${structure[buildProgress - 1]?.page_label || 'page'}"…`}
                  </div>
                </div>
              </div>

              {/* Big progress bar */}
              <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.round((buildProgress / (structure?.length || 1)) * 100)}%`,
                  background: `linear-gradient(90deg, ${GOLD} 0%, rgba(201,169,110,0.7) 100%)`,
                  borderRadius: 3,
                  transition: 'width 0.35s cubic-bezier(0.4,0,0.2,1)',
                }} />
              </div>

              {/* Page dots row */}
              <div style={{ display: 'flex', gap: 4, marginTop: 10, flexWrap: 'wrap' }}>
                {structure.map((p, i) => (
                  <div
                    key={i}
                    title={p.page_label || `Page ${i + 1}`}
                    style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: i < buildProgress
                        ? GOLD
                        : i === buildProgress
                        ? 'rgba(201,169,110,0.5)'
                        : 'rgba(255,255,255,0.1)',
                      transition: 'background 0.3s',
                      animation: i === buildProgress - 1 ? 'aibPulse 1s ease infinite' : 'none',
                    }}
                  />
                ))}
              </div>

              {/* Pct label */}
              <div style={{ marginTop: 8, fontFamily: NU, fontSize: 9, color: MUTED, textAlign: 'right', letterSpacing: '0.06em' }}>
                {Math.round((buildProgress / (structure?.length || 1)) * 100)}%
              </div>
            </div>
          )}
          </div>}{/* end brief+build conditional */}
        </div>

        {/* Footer actions */}
        <div style={{
          padding: '14px 22px',
          borderTop: `1px solid ${BORDER}`,
          flexShrink: 0,
          display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center',
        }}>
          {structure && !building && (
            <button
              onClick={() => { setStructure(null); setError(''); }}
              style={{
                fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', background: 'none',
                border: `1px solid ${BORDER}`, borderRadius: 2, color: MUTED,
                padding: '8px 16px', cursor: 'pointer',
              }}
            >
              ← Regenerate
            </button>
          )}
          {!structure ? (
            <button
              onClick={handleGenerate}
              disabled={generating || !brief.trim()}
              style={{
                fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase',
                background: generating || !brief.trim() ? 'rgba(201,168,76,0.3)' : GOLD,
                border: 'none', borderRadius: 2, color: '#0A0908',
                padding: '10px 24px', cursor: generating || !brief.trim() ? 'default' : 'pointer',
                minWidth: 140,
              }}
            >
              {generating ? 'Generating…' : '✦ Generate Structure'}
            </button>
          ) : (
            <button
              onClick={handleBuild}
              disabled={building}
              style={{
                fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase',
                background: building ? 'rgba(201,168,76,0.3)' : GOLD,
                border: 'none', borderRadius: 2, color: '#0A0908',
                padding: '10px 24px', cursor: building ? 'default' : 'pointer',
                minWidth: 140,
              }}
            >
              {building ? `Building ${buildProgress}/${structure.length}…` : `✦ Build ${structure.length} Pages`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
