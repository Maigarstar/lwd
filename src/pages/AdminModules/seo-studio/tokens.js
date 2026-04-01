/**
 * seo-studio/tokens.js — Design tokens, constants, and helper functions for SEO Studio
 */

// ── Design tokens ────────────────────────────────────────────────────────────

export const GD = 'var(--font-heading-primary)';
export const NU = 'var(--font-body)';
export const G  = '#c9a84c';

export const RAIL_W = 320;

export const CTA_WORDS = ['discover','explore','book','enquire','plan','view','experience','find','browse','learn','get','start','schedule','reserve','contact','visit'];

// ── Entity types ─────────────────────────────────────────────────────────────

export const ENTITY_TYPES = [
  { key: 'listing',  label: 'Listings',  icon: '\u229E' },
  { key: 'showcase', label: 'Showcases', icon: '\u2726' },
  { key: 'article',  label: 'Articles',  icon: '\u25C7' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

export function parseKeywords(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    const t = val.trim();
    if (!t || t === '[]') return [];
    try { const p = JSON.parse(t); if (Array.isArray(p)) return p; } catch {}
    return t.split(',').map(k => k.trim()).filter(Boolean);
  }
  return [];
}

export function getEntityTitle(e, type) {
  if (type === 'article') return e.seoTitle || e.seo_title || '';
  return e.seo_title || '';
}

export function getEntityDesc(e, type) {
  if (type === 'article') return e.metaDescription || e.meta_description || '';
  return e.seo_description || '';
}

export function getEntityOgImage(e, type) {
  if (type === 'article') return e.ogImage || e.og_image || '';
  return e.og_image || '';
}

// ── Score History helpers ────────────────────────────────────────────────────

export const SCORE_HISTORY_KEY = 'seo-score-history';

export function getScoreHistory() {
  try {
    return JSON.parse(localStorage.getItem(SCORE_HISTORY_KEY) || '[]');
  } catch { return []; }
}

export function addScoreHistory(entityId, score) {
  const history = getScoreHistory();
  history.push({ entityId, score, date: new Date().toISOString() });
  // Keep max 50 entries
  const trimmed = history.length > 50 ? history.slice(-50) : history;
  localStorage.setItem(SCORE_HISTORY_KEY, JSON.stringify(trimmed));
}

export function getLastScore(entityId) {
  const history = getScoreHistory();
  // Find the most recent entry for this entity (second to last if the last is the current save)
  const entries = history.filter(h => h.entityId === entityId);
  if (entries.length < 1) return null;
  return entries[entries.length - 1].score;
}

// ── Grade / severity helpers ────────────────────────────────────────────────

export function gradeColor(grade) {
  const m = { A: '#10b981', B: '#22c55e', C: '#f59e0b', D: '#f97316', F: '#ef4444' };
  return m[grade] || '#9ca3af';
}

export function severityIcon(s) {
  if (s === 'critical') return '\uD83D\uDD34';
  if (s === 'important') return '\uD83D\uDFE1';
  return '\uD83D\uDD35';
}

// ── Word lists for CTR analysis ─────────────────────────────────────────────

export const POWER_WORDS = ['luxury','exclusive','stunning','unforgettable','breathtaking','iconic','exquisite','magnificent','elegant','bespoke','premier','prestigious','ultimate','extraordinary','enchanting','majestic','opulent','refined','timeless','dreamy','romantic','intimate','spectacular','award-winning','world-class'];
export const EMOTIONAL_WORDS = ['discover','unveil','transform','inspire','captivate','celebrate','embrace','experience','indulge','imagine','escape','secret','hidden','guide','essential','complete','perfect','ideal'];

// ── Stop words for cannibalisation ──────────────────────────────────────────

export const STOP_WORDS = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','shall','can','this','that','these','those','it','its','i','we','you','they','he','she','my','our','your','their','his','her','not','no','nor','so','if','then','than','too','very','just','about','above','after','before','between','into','through','during','each','few','more','most','other','some','such','only','own','same','all','both','each','how','what','which','who','whom','when','where','why','how','up','out','off','over','under','again','further','once']);
