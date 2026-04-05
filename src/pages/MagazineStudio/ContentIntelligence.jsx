// ═══════════════════════════════════════════════════════════════════════════
// ContentIntelligence.jsx — LWD Editorial Intelligence System
// Real-time content scoring, NLP term analysis, SEO validation,
// image intelligence, and structural guidance — all while you write.
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo, useState } from 'react';
import { FU, FD, computeWordCount } from './StudioShared';

const GOLD = '#c9a96e';

// ── Word count targets per category ───────────────────────────────────────
const WORD_TARGETS = {
  'destinations':  { min: 900,  target: 1200, max: 1600 },
  'venues':        { min: 700,  target: 1000, max: 1400 },
  'fashion':       { min: 600,  target: 900,  max: 1200 },
  'real-weddings': { min: 500,  target: 800,  max: 1200 },
  'planning':      { min: 800,  target: 1200, max: 1800 },
  'honeymoons':    { min: 700,  target: 1000, max: 1400 },
  'trends':        { min: 600,  target: 900,  max: 1200 },
  'news':          { min: 300,  target: 500,  max: 800  },
  'default':       { min: 600,  target: 900,  max: 1400 },
};

// ── Image count targets per category ──────────────────────────────────────
const IMAGE_TARGETS = {
  'destinations':  { min: 4, target: 8  },
  'venues':        { min: 3, target: 6  },
  'fashion':       { min: 5, target: 10 },
  'real-weddings': { min: 6, target: 12 },
  'planning':      { min: 2, target: 4  },
  'honeymoons':    { min: 4, target: 8  },
  'trends':        { min: 3, target: 6  },
  'news':          { min: 1, target: 3  },
  'default':       { min: 3, target: 6  },
};

// ── NLP term library — domain-specific, luxury editorial voice ─────────────
export const NLP_TERMS = {
  'destinations': [
    'destination wedding', 'outdoor ceremony', 'private villa', 'historic estate',
    'coastal wedding', 'luxury venue', 'clifftop', 'overlooking', 'exclusive use',
    'intimate celebration', 'natural backdrop', 'international guests',
    'local cuisine', 'wine region', 'planning ahead',
  ],
  'venues': [
    'exclusive use', 'capacity', 'catering', 'accommodation', 'ceremony',
    'reception', 'wedding coordinator', 'terrace', 'ballroom', 'grounds',
    'historic', 'listed building', 'bespoke packages', 'in-house team',
    'licensed venue', 'overnight guests',
  ],
  'fashion': [
    'couture', 'bridal gown', 'atelier', 'silhouette', 'veil',
    'accessories', 'designer', 'bespoke', 'collection', 'fitting',
    'bridal suite', 'something borrowed', 'cathedral train', 'lace',
    'bias cut', 'embellishment',
  ],
  'real-weddings': [
    'ceremony', 'reception', 'florals', 'photographer', 'emotional',
    'intimate', 'stunning', 'celebration', 'unforgettable', 'moment',
    'first dance', 'vows', 'bridal party', 'natural light', 'candles',
    'tablescape',
  ],
  'planning': [
    'timeline', 'budget', 'wedding planner', 'coordinator', 'vendor',
    'logistics', 'checklist', 'booking', 'consultation', 'months ahead',
    'guest list', 'seating plan', 'run of day', 'contingency',
    'preferred suppliers', 'on the day',
  ],
  'honeymoons': [
    'retreat', 'private suite', 'luxury resort', 'overwater', 'exclusive',
    'tranquil', 'indulgent', 'escape', 'sanctuary', 'butler service',
    'infinity pool', 'spa', 'private beach', 'all-inclusive',
    'once in a lifetime', 'island hopping',
  ],
  'trends': [
    'emerging', 'editorial', 'aesthetic', 'modern', 'contemporary',
    'inspired', 'curated', 'innovative', 'defining', 'movement',
    'brides are choosing', 'shift towards', 'growing trend',
    'couples are opting', 'season ahead', 'style moment',
  ],
  'news': [
    'announced', 'launch', 'collaboration', 'collection', 'award',
    'recognition', 'premiere', 'debut', 'exclusive', 'revealed',
    'partnered', 'opening', 'expansion', 'milestone', 'new season',
  ],
  'default': [
    'luxury', 'exceptional', 'bespoke', 'curated', 'exclusive',
    'discerning', 'editorial', 'intimate', 'extraordinary', 'celebrate',
  ],
};

// ── Power words that signal editorial quality ──────────────────────────────
const POWER_WORDS = [
  'breathtaking', 'extraordinary', 'intimate', 'effortless', 'flawless',
  'unrivalled', 'timeless', 'exceptional', 'exquisite', 'magnificent',
  'considered', 'refined', 'understated', 'thoughtfully', 'masterfully',
];

// ── Flesch-Kincaid readability (approximate) ──────────────────────────────
function computeReadability(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 3);
  const words = text.split(/\s+/).filter(Boolean);
  const syllables = words.reduce((n, w) => {
    const m = w.toLowerCase().match(/[aeiouy]{1,2}/g);
    return n + (m ? Math.max(1, m.length) : 1);
  }, 0);
  if (sentences.length === 0 || words.length === 0) return { score: 70, grade: 'Good' };
  const fk = 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length);
  const score = Math.max(0, Math.min(100, fk));
  const grade = score >= 70 ? 'Good' : score >= 50 ? 'Moderate' : 'Complex';
  return { score: Math.round(score), grade };
}

// ── Extract full plain text from all content blocks ───────────────────────
function extractText(content = []) {
  return content.map(b => [b.text, b.body, b.tip, b.standfirst, b.caption, b.quote]
    .filter(Boolean)
    .map(t => t.replace(/<[^>]*>/g, ' ').replace(/&[a-z]{2,6};/gi, ' '))
    .join(' ')
  ).join(' ').toLowerCase();
}

// ── Count headings from content blocks ────────────────────────────────────
function countHeadings(content = []) {
  return content.filter(b => b.type === 'heading' || b.type === 'subheading').length;
}

// ── Count images from content blocks ─────────────────────────────────────
function countImages(content = []) {
  return content.filter(b => b.type === 'image' || b.type === 'gallery').length;
}

// ── Count internal links in rich text content ─────────────────────────────
function countInternalLinks(content = []) {
  const html = content.map(b => b.body || b.text || '').join(' ');
  const matches = html.match(/href=["'][^"']*luxuryweddingdirectory|href=["']\//g);
  return matches ? matches.length : 0;
}

// ── Check keyword presence in key positions ───────────────────────────────
function checkKeywordPlacement(keyword, formData) {
  if (!keyword) return { title: false, firstParagraph: false, heading: false, slug: false };
  const kw = keyword.toLowerCase();
  const title = (formData.title || '').toLowerCase();
  const seoTitle = (formData.seoTitle || '').toLowerCase();
  const slug = (formData.slug || '').toLowerCase().replace(/-/g, ' ');
  const firstBlock = (formData.content || []).find(b => b.text || b.body);
  const firstText = ((firstBlock?.text || firstBlock?.body || '').toLowerCase().replace(/<[^>]*>/g, ' ')).slice(0, 200);
  const headings = (formData.content || []).filter(b => b.type === 'heading').map(b => (b.text || '').toLowerCase());

  return {
    title:          title.includes(kw) || seoTitle.includes(kw),
    firstParagraph: firstText.includes(kw),
    heading:        headings.some(h => h.includes(kw)),
    slug:           slug.includes(kw),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MASTER SCORING FUNCTION
// Returns score 0-100, breakdown per signal, issues, passes, NLP analysis
// ═══════════════════════════════════════════════════════════════════════════
export function computeContentIntelligence(formData, focusKeyword = '') {
  const category = formData.categorySlug || formData.category || 'default';
  const wt = WORD_TARGETS[category] || WORD_TARGETS.default;
  const it = IMAGE_TARGETS[category] || IMAGE_TARGETS.default;
  const content = formData.content || [];

  const wordCount   = computeWordCount(content);
  const imageCount  = countImages(content);
  const headingCount = countHeadings(content);
  const internalLinks = countInternalLinks(content);
  const fullText    = extractText(content);
  const readability = computeReadability(fullText);
  const kwPlacement = checkKeywordPlacement(focusKeyword, formData);

  const nlpTerms   = NLP_TERMS[category] || NLP_TERMS.default;
  const nlpCoverage = nlpTerms.map(term => ({
    term,
    found: fullText.includes(term.toLowerCase()),
  }));
  const nlpFound   = nlpCoverage.filter(t => t.found).length;
  const nlpPct     = nlpTerms.length > 0 ? nlpFound / nlpTerms.length : 0;

  const powerWordsFound = POWER_WORDS.filter(w => fullText.includes(w));

  const issues  = [];
  const passes  = [];
  let score     = 0;

  // ── 1. Word count (0-20 pts) ─────────────────────────────────────────
  let wordPts = 0;
  if (wordCount >= wt.target) {
    wordPts = 20; passes.push(`Word count ${wordCount} meets target of ${wt.target}`);
  } else if (wordCount >= wt.min) {
    wordPts = Math.round(12 + 8 * ((wordCount - wt.min) / (wt.target - wt.min)));
    issues.push({ severity: 'low', signal: 'wordCount', msg: `${wordCount} words — target is ${wt.target}`, tip: `Add ${wt.target - wordCount} more words to hit the ${category} target.` });
  } else if (wordCount > 0) {
    wordPts = Math.round(8 * (wordCount / wt.min));
    issues.push({ severity: 'high', signal: 'wordCount', msg: `Only ${wordCount} words — minimum is ${wt.min}`, tip: `This article needs significantly more content. Target: ${wt.target} words.` });
  } else {
    issues.push({ severity: 'high', signal: 'wordCount', msg: 'No content yet', tip: 'Start writing in the Content tab.' });
  }
  if (wordCount > wt.max) {
    wordPts = Math.max(14, wordPts - 4);
    issues.push({ severity: 'low', signal: 'wordCount', msg: `${wordCount} words exceeds recommended maximum of ${wt.max}`, tip: 'Consider splitting into two articles.' });
  }
  score += wordPts;

  // ── 2. SEO completeness (0-20 pts) ──────────────────────────────────
  let seoPts = 0;
  const hasSeoTitle = !!(formData.seoTitle || formData.title);
  const hasMetaDesc = !!(formData.metaDescription || formData.excerpt);
  const hasOgImage  = !!(formData.ogImage || formData.coverImage);
  const hasExcerpt  = !!formData.excerpt;
  const hasSlug     = !!formData.slug;

  if (hasSeoTitle)  { seoPts += 5; passes.push('SEO title set'); }
  else issues.push({ severity: 'high', signal: 'seo', msg: 'Missing SEO title', tip: 'Go to the SEO tab and set a title under 60 characters.' });

  if (hasMetaDesc)  { seoPts += 5; passes.push('Meta description set'); }
  else issues.push({ severity: 'high', signal: 'seo', msg: 'Missing meta description', tip: 'Write a 140–155 character meta description in the SEO tab.' });

  if (hasOgImage)   { seoPts += 5; passes.push('OG / cover image set'); }
  else issues.push({ severity: 'medium', signal: 'seo', msg: 'No cover image for social sharing', tip: 'Set an OG image (1200×630px) in the SEO tab.' });

  if (hasExcerpt)   { seoPts += 3; passes.push('Article excerpt set'); }
  else issues.push({ severity: 'medium', signal: 'seo', msg: 'Missing excerpt', tip: 'Write a 1–2 sentence excerpt in the Metadata tab.' });

  if (hasSlug)      { seoPts += 2; passes.push('URL slug set'); }
  score += seoPts;

  // ── 3. NLP term coverage (0-20 pts) ─────────────────────────────────
  let nlpPts = 0;
  if (nlpPct >= 0.7)       { nlpPts = 20; passes.push(`NLP terms: ${nlpFound}/${nlpTerms.length} covered — excellent`); }
  else if (nlpPct >= 0.5)  { nlpPts = 15; }
  else if (nlpPct >= 0.3)  { nlpPts = 10; }
  else if (nlpPct >= 0.15) { nlpPts = 5;  }

  const missingTerms = nlpCoverage.filter(t => !t.found).slice(0, 5);
  if (missingTerms.length > 0 && wordCount > 100) {
    issues.push({ severity: 'medium', signal: 'nlp', msg: `Missing key terms for ${category}`, tip: `Include: ${missingTerms.map(t => `"${t.term}"`).join(', ')}` });
  }
  score += nlpPts;

  // ── 4. Focus keyword placement (0-15 pts) ───────────────────────────
  let kwPts = 0;
  if (focusKeyword) {
    if (kwPlacement.title)          { kwPts += 5; passes.push('Focus keyword in title'); }
    else issues.push({ severity: 'high', signal: 'keyword', msg: 'Focus keyword missing from title', tip: `Include "${focusKeyword}" in the article title or SEO title.` });
    if (kwPlacement.firstParagraph) { kwPts += 4; passes.push('Focus keyword in opening paragraph'); }
    else issues.push({ severity: 'medium', signal: 'keyword', msg: 'Focus keyword not in opening paragraph', tip: 'Mention the keyword naturally in the first 100 words.' });
    if (kwPlacement.heading)        { kwPts += 3; passes.push('Focus keyword in a heading'); }
    if (kwPlacement.slug)           { kwPts += 3; passes.push('Focus keyword in URL slug'); }
  } else {
    kwPts = 8; // neutral — no keyword set
  }
  score += kwPts;

  // ── 5. Content structure (0-15 pts) ─────────────────────────────────
  let structPts = 0;
  if (headingCount >= 3)       { structPts += 7; passes.push(`${headingCount} headings — good structure`); }
  else if (headingCount >= 1)  { structPts += 4; issues.push({ severity: 'low', signal: 'structure', msg: 'Add more headings to break up the content', tip: 'Aim for at least 3 H2/H3 headings for articles over 600 words.' }); }
  else if (wordCount > 300)    { issues.push({ severity: 'medium', signal: 'structure', msg: 'No headings found', tip: 'Add headings in the Content tab to improve readability and SEO.' }); }

  if (internalLinks >= 2)      { structPts += 5; passes.push(`${internalLinks} internal links`); }
  else if (internalLinks === 1){ structPts += 3; issues.push({ severity: 'low', signal: 'links', msg: 'Only 1 internal link — add more', tip: 'Link to related venue listings, destination pages, or other articles.' }); }
  else if (wordCount > 300)    { issues.push({ severity: 'medium', signal: 'links', msg: 'No internal links', tip: 'Add links to LWD venue listings or other magazine articles.' }); }

  if (readability.grade === 'Good')     { structPts += 3; passes.push(`Readability: ${readability.grade} (${readability.score})`); }
  else if (readability.grade === 'Moderate') { structPts += 2; issues.push({ severity: 'low', signal: 'readability', msg: 'Content readability is moderate', tip: 'Use shorter sentences and simpler words to improve reader engagement.' }); }
  else if (wordCount > 200) { issues.push({ severity: 'low', signal: 'readability', msg: 'Content is complex — consider simplifying', tip: 'Luxury editorial is specific and vivid, not unnecessarily complex.' }); }
  score += structPts;

  // ── 6. Visual content (0-10 pts) ────────────────────────────────────
  let imgPts = 0;
  if (imageCount >= it.target)      { imgPts = 10; passes.push(`${imageCount} images — meets target`); }
  else if (imageCount >= it.min)    { imgPts = 7; issues.push({ severity: 'low', signal: 'images', msg: `${imageCount} images — target is ${it.target}`, tip: `Add ${it.target - imageCount} more images. Visual content is essential for ${category}.` }); }
  else if (imageCount > 0)          { imgPts = 4; issues.push({ severity: 'medium', signal: 'images', msg: `Only ${imageCount} image${imageCount !== 1 ? 's' : ''}`, tip: `This article needs more visuals. Minimum ${it.min} images for ${category}.` }); }
  else if (wordCount > 200)         { issues.push({ severity: 'high', signal: 'images', msg: 'No images in content', tip: 'Add images in the Content tab. Visual storytelling is core to LWD.' }); }
  score += imgPts;

  // Clamp
  score = Math.min(100, Math.max(0, score));

  const grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F';
  const gradeColor = score >= 85 ? '#10b981' : score >= 70 ? '#c9a96e' : score >= 55 ? '#f59e0b' : '#ef4444';

  return {
    score, grade, gradeColor,
    wordCount, imageCount, headingCount, internalLinks,
    readability, nlpCoverage, nlpPct, nlpFound, nlpTotal: nlpTerms.length,
    powerWordsFound, kwPlacement,
    wt, it,
    breakdown: { wordPts, seoPts, nlpPts, kwPts, structPts, imgPts },
    issues: issues.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.severity] - { high: 0, medium: 1, low: 2 }[b.severity] )),
    passes,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTENT INTELLIGENCE PANEL — the full UI
// ═══════════════════════════════════════════════════════════════════════════

const SEV_COLOR = { high: '#ef4444', medium: '#f59e0b', low: '#6b7280' };
const SEV_BG    = { high: 'rgba(239,68,68,0.08)', medium: 'rgba(245,158,11,0.08)', low: 'rgba(107,114,128,0.06)' };

function ScoreRing({ score, grade, gradeColor, size = 72 }) {
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const dash = circ * (score / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={gradeColor} strokeWidth={5}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: FD, fontSize: size * 0.28, fontWeight: 700, color: gradeColor, lineHeight: 1 }}>{score}</span>
        <span style={{ fontFamily: FU, fontSize: size * 0.12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{grade}</span>
      </div>
    </div>
  );
}

function SignalBar({ label, pts, max, color }) {
  const pct = max > 0 ? (pts / max) * 100 : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontFamily: FU, fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em' }}>{label}</span>
        <span style={{ fontFamily: FU, fontSize: 9, color, fontWeight: 700 }}>{pts}/{max}</span>
      </div>
      <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

export function ContentIntelligencePanel({ formData, focusKeyword, onKeywordChange, S }) {
  const [section, setSection] = useState('overview'); // 'overview' | 'nlp' | 'issues' | 'passes'
  const intel = useMemo(() => computeContentIntelligence(formData, focusKeyword), [formData, focusKeyword]);

  const bg        = 'transparent'; // outer container owns the bg color
  const border    = 'rgba(201,169,110,0.1)';
  const text      = '#f5f0e8';
  const muted     = 'rgba(245,240,232,0.45)';
  const faint     = 'rgba(245,240,232,0.22)';
  const surface   = 'rgba(201,169,110,0.05)';

  const { score, grade, gradeColor, breakdown, issues, passes, nlpCoverage, nlpPct, powerWordsFound, readability, wordCount, imageCount, headingCount, internalLinks, wt, it } = intel;

  const sectionBtn = (id, label) => (
    <button key={id} onClick={() => setSection(id)} style={{
      fontFamily: FU, fontSize: 8, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
      padding: '5px 10px', borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s',
      background: section === id ? `${GOLD}18` : 'none',
      border: `1px solid ${section === id ? `${GOLD}50` : border}`,
      color: section === id ? GOLD : muted,
    }}>{label}</button>
  );

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '20px 18px 48px', background: bg, fontFamily: FU }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, marginBottom: 6 }}>
          ✦ Content Intelligence
        </div>
        <div style={{ fontFamily: FD, fontSize: 15, color: text, fontWeight: 400, marginBottom: 3 }}>
          Editorial Score
        </div>
        <div style={{ fontSize: 10, color: muted }}>Updates as you write</div>
      </div>

      {/* ── Score ring + breakdown ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: '16px', background: surface, borderRadius: 6, border: `1px solid ${border}` }}>
        <ScoreRing score={score} grade={grade} gradeColor={gradeColor} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <SignalBar label="Word Count"  pts={breakdown.wordPts}   max={20} color={breakdown.wordPts >= 16 ? '#10b981' : breakdown.wordPts >= 10 ? GOLD : '#ef4444'} />
          <SignalBar label="SEO Fields"  pts={breakdown.seoPts}    max={20} color={breakdown.seoPts >= 16 ? '#10b981' : breakdown.seoPts >= 10 ? GOLD : '#ef4444'} />
          <SignalBar label="NLP Terms"   pts={breakdown.nlpPts}    max={20} color={breakdown.nlpPts >= 16 ? '#10b981' : breakdown.nlpPts >= 10 ? GOLD : '#ef4444'} />
          <SignalBar label="Keyword"     pts={breakdown.kwPts}     max={15} color={breakdown.kwPts >= 12 ? '#10b981' : breakdown.kwPts >= 7 ? GOLD : '#ef4444'} />
          <SignalBar label="Structure"   pts={breakdown.structPts} max={15} color={breakdown.structPts >= 12 ? '#10b981' : breakdown.structPts >= 8 ? GOLD : '#ef4444'} />
          <SignalBar label="Visuals"     pts={breakdown.imgPts}    max={10} color={breakdown.imgPts >= 8 ? '#10b981' : breakdown.imgPts >= 5 ? GOLD : '#ef4444'} />
        </div>
      </div>

      {/* ── Focus Keyword input ── */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: muted, marginBottom: 6 }}>Focus Keyword</div>
        <input
          value={focusKeyword}
          onChange={e => onKeywordChange(e.target.value)}
          placeholder="e.g. Lake Como wedding venues"
          style={{ width: '100%', boxSizing: 'border-box', fontFamily: FU, fontSize: 11, color: text, background: surface, border: `1px solid ${border}`, borderRadius: 3, padding: '7px 10px', outline: 'none' }}
        />
        {focusKeyword && (
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            {[
              { label: 'Title', ok: intel.kwPlacement.title },
              { label: 'Intro', ok: intel.kwPlacement.firstParagraph },
              { label: 'Heading', ok: intel.kwPlacement.heading },
              { label: 'Slug', ok: intel.kwPlacement.slug },
            ].map(({ label, ok }) => (
              <span key={label} style={{ fontFamily: FU, fontSize: 8, fontWeight: 600, letterSpacing: '0.08em', padding: '2px 7px', borderRadius: 10, background: ok ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)', color: ok ? '#10b981' : '#ef4444', border: `1px solid ${ok ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.2)'}` }}>
                {ok ? '✓' : '✗'} {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
        {[
          { label: 'Words',    value: wordCount,    target: `/ ${wt.target}`,  ok: wordCount >= wt.min },
          { label: 'Images',   value: imageCount,   target: `/ ${it.target}`,  ok: imageCount >= it.min },
          { label: 'Headings', value: headingCount, target: '+ needed',        ok: headingCount >= 2 },
          { label: 'Links',    value: internalLinks,target: 'internal',        ok: internalLinks >= 2 },
          { label: 'NLP',      value: `${intel.nlpFound}/${intel.nlpTotal}`, target: 'terms', ok: nlpPct >= 0.5 },
          { label: 'Reading',  value: readability.grade, target: '',          ok: readability.grade === 'Good' },
        ].map(({ label, value, target, ok }) => (
          <div key={label} style={{ background: surface, border: `1px solid ${border}`, borderRadius: 4, padding: '10px 12px' }}>
            <div style={{ fontSize: 9, color: muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontFamily: FD, fontSize: 18, color: ok ? '#10b981' : wordCount === 0 ? faint : GOLD, fontWeight: 400 }}>{value}</span>
              <span style={{ fontSize: 9, color: faint }}>{target}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Section tabs ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, flexWrap: 'wrap' }}>
        {sectionBtn('overview', 'Overview')}
        {sectionBtn('nlp', `NLP (${intel.nlpFound}/${intel.nlpTotal})`)}
        {sectionBtn('issues', `Issues (${issues.length})`)}
        {sectionBtn('passes', `Passes (${passes.length})`)}
      </div>

      {/* ── Overview ── */}
      {section === 'overview' && (
        <div>
          {issues.filter(i => i.severity === 'high').slice(0, 3).map((issue, idx) => (
            <div key={idx} style={{ background: SEV_BG.high, border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 4, padding: '10px 12px', marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: SEV_COLOR.high, marginBottom: 3 }}>✗ {issue.msg}</div>
              <div style={{ fontSize: 10, color: muted, lineHeight: 1.5 }}>{issue.tip}</div>
            </div>
          ))}
          {powerWordsFound.length > 0 && (
            <div style={{ background: 'rgba(201,169,110,0.07)', border: `1px solid rgba(201,169,110,0.2)`, borderRadius: 4, padding: '10px 12px', marginBottom: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>✦ Editorial voice detected</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {powerWordsFound.map(w => (
                  <span key={w} style={{ fontFamily: FU, fontSize: 9, padding: '2px 7px', borderRadius: 10, background: 'rgba(201,169,110,0.1)', color: GOLD, border: `1px solid rgba(201,169,110,0.25)` }}>{w}</span>
                ))}
              </div>
            </div>
          )}
          <div style={{ fontSize: 9, color: faint, lineHeight: 1.6, marginTop: 12, padding: '10px 0', borderTop: `1px solid ${border}` }}>
            Category target: <span style={{ color: muted }}>{wt.min}–{wt.max} words · {it.min}–{it.target} images</span>
          </div>
        </div>
      )}

      {/* ── NLP Terms ── */}
      {section === 'nlp' && (
        <div>
          <div style={{ fontSize: 10, color: muted, marginBottom: 12, lineHeight: 1.5 }}>
            Key terms that signal topic authority to Google and AI search engines for <span style={{ color: GOLD }}>{formData.categorySlug || formData.category || 'this category'}</span>.
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {nlpCoverage.map(({ term, found }) => (
              <span key={term} style={{
                fontFamily: FU, fontSize: 9, padding: '4px 9px', borderRadius: 10,
                background: found ? 'rgba(16,185,129,0.12)' : surface,
                color: found ? '#10b981' : faint,
                border: `1px solid ${found ? 'rgba(16,185,129,0.25)' : border}`,
                fontWeight: found ? 700 : 400,
              }}>
                {found ? '✓ ' : ''}{term}
              </span>
            ))}
          </div>
          <div style={{ marginTop: 14, fontSize: 9, color: faint }}>
            {nlpCoverage.filter(t => !t.found).length > 0
              ? `${nlpCoverage.filter(t => !t.found).length} terms not yet covered — work them in naturally.`
              : '✦ All key terms covered.'}
          </div>
        </div>
      )}

      {/* ── Issues ── */}
      {section === 'issues' && (
        <div>
          {issues.length === 0
            ? <div style={{ fontSize: 12, color: '#10b981', padding: '20px 0' }}>✓ No issues found.</div>
            : issues.map((issue, idx) => (
              <div key={idx} style={{ background: SEV_BG[issue.severity], border: `1px solid ${SEV_COLOR[issue.severity]}30`, borderRadius: 4, padding: '10px 12px', marginBottom: 8, borderLeft: `3px solid ${SEV_COLOR[issue.severity]}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: SEV_COLOR[issue.severity], marginBottom: 3 }}>{issue.msg}</div>
                <div style={{ fontSize: 10, color: muted, lineHeight: 1.5 }}>{issue.tip}</div>
              </div>
            ))
          }
        </div>
      )}

      {/* ── Passes ── */}
      {section === 'passes' && (
        <div>
          {passes.length === 0
            ? <div style={{ fontSize: 12, color: muted, padding: '20px 0' }}>No passes yet — keep writing.</div>
            : passes.map((pass, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0', borderBottom: `1px solid ${border}` }}>
                <span style={{ color: '#10b981', fontSize: 12, flexShrink: 0, marginTop: 1 }}>✓</span>
                <span style={{ fontSize: 11, color: muted, lineHeight: 1.5 }}>{pass}</span>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

// ── Score badge for toolbar ────────────────────────────────────────────────
export function ContentScoreBadge({ score, grade, gradeColor, onClick }) {
  return (
    <button
      onClick={onClick}
      title="Content Intelligence Score — click to open"
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        background: `${gradeColor}15`, border: `1px solid ${gradeColor}40`,
        borderRadius: 3, padding: '3px 9px', cursor: 'pointer',
        transition: 'all 0.2s', flexShrink: 0,
      }}
      onMouseEnter={e => e.currentTarget.style.background = `${gradeColor}25`}
      onMouseLeave={e => e.currentTarget.style.background = `${gradeColor}15`}
    >
      <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: gradeColor }}>{score}</span>
      <span style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: gradeColor }}>/ {grade}</span>
    </button>
  );
}
