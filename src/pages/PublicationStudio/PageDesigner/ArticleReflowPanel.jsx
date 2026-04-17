// ─── ArticleReflowPanel.jsx ──────────────────────────────────────────────────
// P9c: Article Text Reflow
//
// Imports a published article from the Article Editor and automatically flows
// headline / excerpt / body text into a 2-3 page spread using appropriate
// magazine templates.
//
// Workflow:
//   1. Search published magazine_articles
//   2. Select one — preview shows title, excerpt, body length
//   3. Choose template plan (Opener + Body — 2 pages, or Opener + Body + Gallery — 3)
//   4. Confirm → calls onReflow(article, plan)
//
// The parent (PageDesigner) handles the actual canvas operations.
//
// Props:
//   onReflow(article, plan) — triggers page creation in PageDesigner
//   onClose()               — closes the panel
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { GOLD, BORDER, MUTED, NU, GD } from './designerConstants';

const BG   = '#0E0C0A';
const BG2  = '#18160F';
const BDR  = 'rgba(255,255,255,0.09)';

// ── Template plans ─────────────────────────────────────────────────────────────
// Each plan is an array of page descriptors that PageDesigner will build.
const PLANS = {
  '2-page': {
    label: '2-Page Spread',
    description: 'Cinematic opener + full-width body text',
    pages: [
      {
        role:     'opener',
        template: 'feature-minimal',
        label:    'Article Opener',
        hint:     'Headline + standfirst',
      },
      {
        role:     'body',
        template: 'venue-essay',
        label:    'Body Text',
        hint:     'Full article text, 3 columns',
      },
    ],
  },
  '3-page': {
    label: '3-Page Feature',
    description: 'Full opener + body spread + gallery close',
    pages: [
      {
        role:     'opener',
        template: 'feature-cinematic',
        label:    'Article Opener',
        hint:     'Full-bleed image + headline',
      },
      {
        role:     'body',
        template: 'planning-edit',
        label:    'Body Text',
        hint:     'Article body + pull quote',
      },
      {
        role:     'close',
        template: 'lux-grid',
        label:    'Visual Close',
        hint:     'Image gallery close page',
      },
    ],
  },
  'minimal': {
    label: 'Minimal Single',
    description: 'One clean page — title, excerpt, intro',
    pages: [
      {
        role:     'opener',
        template: 'story-chapter',
        label:    'Chapter Opener',
        hint:     'Headline + intro paragraph',
      },
    ],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

// Extract plain text from content blocks (article body)
function extractBodyText(content) {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter(b => b.text || b.content)
      .map(b => b.text || b.content || '')
      .join('\n\n')
      .slice(0, 1500);
  }
  return '';
}

function wordCount(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ── Article card ─────────────────────────────────────────────────────────────
function ArticleCard({ article, selected, onSelect }) {
  const [hov, setHov] = useState(false);
  const thumb = article.featured_image || article.hero_image_url || null;
  const date  = article.published_at
    ? new Date(article.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div
      onClick={() => onSelect(article)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 4,
        cursor: 'pointer',
        border: `1px solid ${selected ? 'rgba(201,169,110,0.45)' : 'transparent'}`,
        background: selected
          ? 'rgba(201,169,110,0.08)'
          : hov
          ? 'rgba(255,255,255,0.04)'
          : 'transparent',
        transition: 'all 0.12s',
      }}
    >
      {/* Thumbnail */}
      <div style={{
        width: 64, height: 90, flexShrink: 0, borderRadius: 2, overflow: 'hidden',
        background: '#2A2520', border: `1px solid ${BDR}`,
      }}>
        {thumb && (
          <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        )}
      </div>

      {/* Meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {article.category && (
          <div style={{
            fontFamily: NU, fontSize: 8, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: GOLD, marginBottom: 4,
          }}>
            {article.category}
          </div>
        )}
        <div style={{
          fontFamily: GD, fontSize: 14, fontStyle: 'italic',
          color: 'rgba(255,255,255,0.88)', lineHeight: 1.3,
          marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {article.title || 'Untitled'}
        </div>
        {article.excerpt && (
          <div style={{
            fontFamily: NU, fontSize: 9, color: 'rgba(255,255,255,0.4)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {article.excerpt.slice(0, 80)}…
          </div>
        )}
        {date && (
          <div style={{ fontFamily: NU, fontSize: 8, color: 'rgba(255,255,255,0.22)', marginTop: 4 }}>
            {date}
          </div>
        )}
      </div>

      {/* Selected check */}
      {selected && (
        <div style={{
          width: 18, height: 18, borderRadius: '50%',
          background: 'rgba(201,169,110,0.2)', border: `1px solid ${GOLD}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, color: GOLD, fontSize: 11,
        }}>
          ✓
        </div>
      )}
    </div>
  );
}

// ── Plan option card ──────────────────────────────────────────────────────────
function PlanCard({ planKey, plan, selected, onSelect }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={() => onSelect(planKey)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '12px 14px',
        borderRadius: 4,
        cursor: 'pointer',
        border: `1px solid ${selected ? 'rgba(201,169,110,0.5)' : BDR}`,
        background: selected
          ? 'rgba(201,169,110,0.08)'
          : hov
          ? 'rgba(255,255,255,0.03)'
          : BG2,
        transition: 'all 0.12s',
        marginBottom: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{
          fontFamily: NU, fontSize: 10, fontWeight: 700,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          color: selected ? GOLD : 'rgba(255,255,255,0.8)',
        }}>
          {plan.label}
        </div>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: selected ? GOLD : 'rgba(255,255,255,0.15)',
          flexShrink: 0,
        }} />
      </div>
      <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, marginBottom: 8 }}>
        {plan.description}
      </div>
      {/* Page chips */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {plan.pages.map((p, i) => (
          <div key={i} style={{
            fontFamily: NU, fontSize: 8, fontWeight: 600,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            padding: '2px 7px', borderRadius: 2,
            background: 'rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.5)',
            border: `1px solid ${BDR}`,
          }}>
            {p.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ArticleReflowPanel({ onReflow, onClose }) {
  const [query,    setQuery]    = useState('');
  const [articles, setArticles] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [selected, setSelected] = useState(null);
  const [plan,     setPlan]     = useState('2-page');
  const [step,     setStep]     = useState('search'); // 'search' | 'plan'
  const [running,  setRunning]  = useState(false);
  const debounceRef = useRef(null);
  const inputRef    = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const search = useCallback(async (q) => {
    setLoading(true);
    setError('');
    try {
      let req = supabase
        .from('magazine_articles')
        .select('id, title, slug, excerpt, featured_image, category, published_at, content')
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false })
        .limit(20);
      if (q.trim()) req = req.ilike('title', `%${q.trim()}%`);
      const { data, error: err } = await req;
      if (err) throw err;
      setArticles(data || []);
    } catch (e) {
      setError(e.message || 'Search failed');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 350);
    return () => clearTimeout(debounceRef.current);
  }, [query, search]);

  useEffect(() => { search(''); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectArticle = (article) => {
    setSelected(article);
    setStep('plan');
  };

  const handleConfirmReflow = async () => {
    if (!selected) return;
    setRunning(true);
    try {
      const chosenPlan = PLANS[plan];
      await onReflow(selected, chosenPlan);
      onClose();
    } catch (e) {
      setError(e.message || 'Reflow failed');
    }
    setRunning(false);
  };

  const bodyText   = selected ? extractBodyText(selected.content) : '';
  const bodyWords  = wordCount(bodyText);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 600,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'stretch', justifyContent: 'center',
    }}>
      <div style={{
        width: '100%', maxWidth: 920,
        margin: 'auto',
        background: BG,
        display: 'flex', flexDirection: 'column',
        height: '90vh',
        borderRadius: 6, overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        border: `1px solid ${BDR}`,
      }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: `1px solid ${BDR}`, flexShrink: 0,
        }}>
          <div>
            <div style={{
              fontFamily: NU, fontSize: 11, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, marginBottom: 3,
            }}>
              ⤴ Article Text Reflow
            </div>
            <div style={{ fontFamily: NU, fontSize: 10, color: MUTED }}>
              Import an article and auto-flow it into magazine pages
            </div>
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {['search', 'plan'].map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {i > 0 && <div style={{ width: 20, height: 1, background: BDR }} />}
                <div style={{
                  fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: step === s ? GOLD : 'rgba(255,255,255,0.25)',
                }}>
                  {i + 1}. {s === 'search' ? 'Choose Article' : 'Choose Layout'}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '2px 4px' }}
          >
            ✕
          </button>
        </div>

        {/* ── Body ─────────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

          {/* LEFT: Article search */}
          <div style={{
            width: 360, flexShrink: 0,
            borderRight: `1px solid ${BDR}`,
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Search bar */}
            <div style={{ padding: '12px 14px', borderBottom: `1px solid ${BDR}`, flexShrink: 0 }}>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search articles…"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.07)',
                  border: `1px solid ${BDR}`,
                  borderRadius: 3, color: '#fff',
                  fontFamily: NU, fontSize: 11,
                  padding: '8px 12px', outline: 'none',
                }}
              />
            </div>

            {/* Article list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {loading && (
                <div style={{ padding: 20, fontFamily: NU, fontSize: 10, color: MUTED, textAlign: 'center' }}>
                  Loading…
                </div>
              )}
              {error && (
                <div style={{ padding: 14, fontFamily: NU, fontSize: 10, color: '#f87171' }}>
                  {error}
                </div>
              )}
              {!loading && !error && articles.length === 0 && (
                <div style={{ padding: 20, fontFamily: NU, fontSize: 10, color: MUTED, textAlign: 'center' }}>
                  No published articles found
                </div>
              )}
              {articles.map(a => (
                <ArticleCard
                  key={a.id}
                  article={a}
                  selected={selected?.id === a.id}
                  onSelect={handleSelectArticle}
                />
              ))}
            </div>
          </div>

          {/* RIGHT: Plan + Preview */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            {step === 'search' && (
              <div style={{
                height: '100%', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 12,
              }}>
                <div style={{ fontFamily: GD, fontSize: 26, fontStyle: 'italic', color: 'rgba(255,255,255,0.1)' }}>
                  Select an article
                </div>
                <div style={{ fontFamily: NU, fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center', maxWidth: 260 }}>
                  Choose a published article from the left panel to configure your reflow layout
                </div>
              </div>
            )}

            {step === 'plan' && selected && (
              <>
                {/* Article preview */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{
                    fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
                    textTransform: 'uppercase', color: GOLD, marginBottom: 10,
                  }}>
                    Selected Article
                  </div>
                  <div style={{
                    display: 'flex', gap: 14, padding: '14px 16px',
                    background: BG2, borderRadius: 4, border: `1px solid ${BDR}`,
                  }}>
                    {selected.featured_image && (
                      <img
                        src={selected.featured_image}
                        alt=""
                        style={{ width: 72, height: 100, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }}
                      />
                    )}
                    <div>
                      {selected.category && (
                        <div style={{ fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, marginBottom: 4 }}>
                          {selected.category}
                        </div>
                      )}
                      <div style={{ fontFamily: GD, fontSize: 16, fontStyle: 'italic', color: 'rgba(255,255,255,0.9)', lineHeight: 1.3, marginBottom: 6 }}>
                        {selected.title}
                      </div>
                      {selected.excerpt && (
                        <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, lineHeight: 1.5 }}>
                          {selected.excerpt.slice(0, 120)}…
                        </div>
                      )}
                      <div style={{ fontFamily: NU, fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 6 }}>
                        {bodyWords > 0 ? `~${bodyWords} words` : 'No body content'} · Will flow into {PLANS[plan].pages.length} page{PLANS[plan].pages.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Plan selection */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{
                    fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
                    textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 12,
                  }}>
                    Choose Layout
                  </div>
                  {Object.entries(PLANS).map(([key, p]) => (
                    <PlanCard
                      key={key}
                      planKey={key}
                      plan={p}
                      selected={plan === key}
                      onSelect={setPlan}
                    />
                  ))}
                </div>

                {/* What will be created */}
                <div style={{
                  background: 'rgba(201,169,110,0.06)',
                  border: `1px solid rgba(201,169,110,0.2)`,
                  borderRadius: 4, padding: '14px 16px', marginBottom: 8,
                }}>
                  <div style={{
                    fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: GOLD, marginBottom: 10,
                  }}>
                    What will be created
                  </div>
                  {PLANS[plan].pages.map((p, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      marginBottom: i < PLANS[plan].pages.length - 1 ? 8 : 0,
                    }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: 2, flexShrink: 0,
                        background: 'rgba(201,169,110,0.15)',
                        border: `1px solid rgba(201,169,110,0.3)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: NU, fontSize: 8, fontWeight: 700, color: GOLD,
                      }}>
                        {i + 1}
                      </div>
                      <div>
                        <div style={{ fontFamily: NU, fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>
                          {p.label}
                          <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 6 }}>
                            · {p.template}
                          </span>
                        </div>
                        <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, marginTop: 2 }}>
                          {p.hint}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {error && (
                  <div style={{ fontFamily: NU, fontSize: 10, color: '#f87171', marginTop: 8 }}>
                    {error}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px', borderTop: `1px solid ${BDR}`, flexShrink: 0, background: BG2,
        }}>
          <div>
            {step === 'plan' && (
              <button
                onClick={() => setStep('search')}
                style={{
                  background: 'none', border: 'none', color: MUTED,
                  cursor: 'pointer', fontFamily: NU, fontSize: 10,
                  padding: 0, letterSpacing: '0.04em',
                }}
              >
                ← Back
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                padding: '7px 18px', borderRadius: 3,
                background: 'rgba(255,255,255,0.06)', border: `1px solid ${BDR}`,
                color: MUTED, cursor: 'pointer',
                fontFamily: NU, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
              }}
            >
              Cancel
            </button>
            {step === 'plan' && selected && (
              <button
                onClick={handleConfirmReflow}
                disabled={running}
                style={{
                  padding: '7px 24px', borderRadius: 3,
                  background: running ? 'rgba(201,169,110,0.06)' : 'rgba(201,169,110,0.15)',
                  border: `1px solid ${running ? 'rgba(201,169,110,0.2)' : 'rgba(201,169,110,0.45)'}`,
                  color: running ? MUTED : GOLD,
                  cursor: running ? 'default' : 'pointer',
                  fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                  transition: 'all 0.12s',
                }}
              >
                {running ? '⟳ Building pages…' : `⤴ Reflow into ${PLANS[plan].pages.length} page${PLANS[plan].pages.length > 1 ? 's' : ''}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
