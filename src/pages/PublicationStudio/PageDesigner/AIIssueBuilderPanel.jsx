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

const SYSTEM_PROMPT = `You are a luxury magazine editor for Luxury Wedding Directory — a premium editorial publication. Your task is to create a structured page plan for a bespoke wedding magazine issue.

You must return ONLY a valid JSON array. No markdown, no explanation, just the JSON array.

Each item in the array represents one page and must have this exact shape:
{
  "template_id": "one of the valid template ids",
  "page_label": "short descriptive label for the page",
  "kicker": "SHORT KICKER TEXT — 3-6 words, ALL CAPS",
  "headline": "Editorial headline — 3-7 words, can include line breaks with \\n",
  "body": "2-3 sentence editorial body copy in luxury tone. Specific, evocative, cinematic.",
  "location": "City/region name if relevant, otherwise omit",
  "byline": "Optional byline e.g. 'Photography · Studio Name'"
}

Valid template_id values: ${TEMPLATE_IDS_LIST}

Rules:
- First page MUST be template_id: "vogue-cover"
- Last page MUST be template_id: "back-cover"
- Mix categories for visual rhythm: editorial, venue, fashion, ceremony, reception
- Tailor all text to the user's brief — be specific, not generic
- headlines should be elegant, italic-friendly, evocative — NOT clickbait
- body copy should read like Condé Nast Traveller or Vogue Weddings
- Do not repeat the same template_id more than twice
- Return exactly the number of pages requested`;

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
    } catch (e) {
      setError('Build failed: ' + (e.message || 'unknown error'));
    }
    setBuilding(false);
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
              {structure ? `${structure.length}-page structure ready` : 'Describe your issue'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>

          {/* ── BRIEF INPUT (always visible) ── */}
          <div style={{ marginBottom: 16 }}>
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

          {/* Build progress */}
          {building && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, marginBottom: 6 }}>
                Building page {buildProgress} of {structure?.length}…
              </div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
                <div style={{
                  height: '100%',
                  width: `${Math.round((buildProgress / (structure?.length || 1)) * 100)}%`,
                  background: GOLD, borderRadius: 2, transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          )}
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
