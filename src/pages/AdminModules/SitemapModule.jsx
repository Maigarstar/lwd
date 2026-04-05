// ─── SitemapModule.jsx ────────────────────────────────────────────────────────
// Discovery Infrastructure panel — sitemaps, RSS, robots.txt, IndexNow, verification.
// All settings persist to platform_settings (Supabase). robots.txt is live-served.

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';

const SITE_URL = 'https://www.luxuryweddingdirectory.co.uk';
const G  = '#c9a84c';
const NU = 'var(--font-body, "Inter", sans-serif)';
const GD = 'var(--font-heading-primary, "Cormorant Garamond", Georgia, serif)';

// ── Sitemaps ───────────────────────────────────────────────────────────────────
const SITEMAPS = [
  { id: 'index',  path: '/sitemap-index.xml',  label: 'Sitemap Index',         function: 'sitemap-index',  priority: 'critical', description: 'Master index — referenced in robots.txt. Links crawlers to all child sitemaps.' },
  { id: 'main',   path: '/sitemap.xml',         label: 'Main URL Sitemap',      function: 'sitemap',        priority: 'critical', description: 'All public pages: venues, showcases, vendors, planners, magazine articles.' },
  { id: 'images', path: '/sitemap-images.xml',  label: 'Image Sitemap',         function: 'sitemap-images', priority: 'high',     description: 'Article images, venue galleries, cover images — with alt text and geo data.' },
  { id: 'video',  path: '/sitemap-video.xml',   label: 'Video Sitemap',         function: 'sitemap-video',  priority: 'high',     description: 'Hero videos, YouTube/Vimeo embeds — thumbnails, titles, descriptions.' },
  { id: 'news',   path: '/sitemap-news.xml',    label: 'Google News Sitemap',   function: 'sitemap-news',   priority: 'medium',   description: 'Magazine articles published in last 48h. Refreshes every 15 minutes.' },
];

const PRIORITY_COLOR = { critical: '#10b981', high: G, medium: '#6b7280' };
const PRIORITY_BG    = { critical: 'rgba(16,185,129,0.08)', high: 'rgba(201,168,76,0.08)', medium: 'rgba(107,114,128,0.06)' };

const SITEMAP_DEPLOY = SITEMAPS.map(s => `supabase functions deploy ${s.function} --no-verify-jwt`).join('\n');
const SITEMAP_NGINX  = SITEMAPS.map(s =>
  `location = ${s.path} {\n    proxy_pass https://qpkggfibwreznussudfh.supabase.co/functions/v1/${s.function};\n    proxy_set_header Host qpkggfibwreznussudfh.supabase.co;\n    proxy_ssl_server_name on;\n}`
).join('\n\n');

// ── RSS Feeds ──────────────────────────────────────────────────────────────────
const RSS_MAIN = {
  id: 'rss-main', path: '/feed.xml', label: 'Main RSS Feed', function: 'rss-feed',
  description: 'All published magazine articles — newest first. Primary discovery feed.',
  headTag: `<link rel="alternate" type="application/rss+xml" title="LWD Magazine" href="${SITE_URL}/feed.xml" />`,
};

const RSS_CATEGORY_SLUGS = ['destinations','venues','fashion-beauty','real-weddings','planning','honeymoons','trends','news'];
const RSS_CATEGORIES = RSS_CATEGORY_SLUGS.map(slug => {
  const label = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return {
    id: `rss-${slug}`, slug, path: `/magazine/${slug}/feed.xml`, label, function: 'rss-category',
    headTag: `<link rel="alternate" type="application/rss+xml" title="LWD — ${label}" href="${SITE_URL}/magazine/${slug}/feed.xml" />`,
  };
});

const RSS_DEPLOY  = `supabase functions deploy rss-feed --no-verify-jwt\nsupabase functions deploy rss-category --no-verify-jwt\nsupabase functions deploy robots-txt --no-verify-jwt`;
const RSS_NGINX   = `location = /feed.xml {\n    proxy_pass https://qpkggfibwreznussudfh.supabase.co/functions/v1/rss-feed;\n    proxy_set_header Host qpkggfibwreznussudfh.supabase.co;\n    proxy_ssl_server_name on;\n}\n\nlocation ~ ^/magazine/([^/]+)/feed\\.xml$ {\n    proxy_pass https://qpkggfibwreznussudfh.supabase.co/functions/v1/rss-category?category=$1;\n    proxy_set_header Host qpkggfibwreznussudfh.supabase.co;\n    proxy_ssl_server_name on;\n}\n\nlocation = /robots.txt {\n    proxy_pass https://qpkggfibwreznussudfh.supabase.co/functions/v1/robots-txt;\n    proxy_set_header Host qpkggfibwreznussudfh.supabase.co;\n    proxy_ssl_server_name on;\n}`;

// ── Default robots.txt ─────────────────────────────────────────────────────────
const DEFAULT_ROBOTS = `User-agent: *
Allow: /
Allow: /vendor/

Disallow: /admin
Disallow: /vendor/dashboard
Disallow: /vendor/auth
Disallow: /listing-studio
Disallow: /magazine-studio
Disallow: /getting-married
Disallow: /api/
Disallow: /*.json$

Crawl-delay: 2

Sitemap: ${SITE_URL}/sitemap-index.xml
Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${SITE_URL}/sitemap-images.xml
Sitemap: ${SITE_URL}/sitemap-video.xml
Sitemap: ${SITE_URL}/sitemap-news.xml`;

// ── robots.txt syntax validator ────────────────────────────────────────────────
function validateRobots(content) {
  const VALID = ['user-agent','allow','disallow','crawl-delay','sitemap','host','noindex','nofollow'];
  const lines = content.split('\n');
  const errors = [], warnings = [];
  let hasUserAgent = false;

  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) { errors.push(`Line ${i + 1}: missing colon — "${line}"`); return; }
    const directive = line.slice(0, colonIdx).toLowerCase().trim();
    const value     = line.slice(colonIdx + 1).trim();
    if (!VALID.includes(directive)) { warnings.push(`Line ${i + 1}: unknown directive "${directive}"`); return; }
    if (directive === 'user-agent') { hasUserAgent = true; if (!value) errors.push(`Line ${i + 1}: User-agent cannot be empty`); }
    if ((directive === 'allow' || directive === 'disallow') && !hasUserAgent) errors.push(`Line ${i + 1}: ${directive} before User-agent`);
    if (directive === 'crawl-delay' && isNaN(Number(value))) errors.push(`Line ${i + 1}: Crawl-delay must be a number, got "${value}"`);
    if (directive === 'sitemap' && !value.startsWith('http')) errors.push(`Line ${i + 1}: Sitemap must be a full URL starting with http`);
  });

  if (!hasUserAgent) errors.push('No User-agent directive found');
  return { errors, warnings, valid: errors.length === 0 };
}

// ── IndexNow submission ────────────────────────────────────────────────────────
async function submitIndexNow(key, urls) {
  if (!key || !urls.length) return { ok: false, msg: 'No key or URLs' };
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: 'www.luxuryweddingdirectory.co.uk',
        key,
        keyLocation: `${SITE_URL}/${key}.txt`,
        urlList: urls,
      }),
    });
    return { ok: res.ok, msg: res.ok ? `Submitted ${urls.length} URL${urls.length > 1 ? 's' : ''}` : `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, msg: String(e) };
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────
async function checkURL(path) {
  try {
    const res = await fetch(`${SITE_URL}${path}`, { method: 'HEAD', signal: AbortSignal.timeout(8000) });
    return { status: res.ok ? 'ok' : 'error', httpStatus: res.status };
  } catch { return { status: 'error', httpStatus: null }; }
}

function timeAgo(date) {
  if (!date) return null;
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function StatusDot({ status }) {
  const color = status === 'ok' ? '#10b981' : status === 'error' ? '#ef4444' : status === 'checking' ? G : '#6b7280';
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: status === 'ok' ? `0 0 6px ${color}` : 'none' }} />;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function SitemapModule({ isLight }) {
  const bg      = isLight ? '#fafaf8' : '#0f0f0d';
  const surface = isLight ? '#ffffff' : '#161614';
  const border  = isLight ? 'rgba(30,28,22,0.1)'  : 'rgba(245,240,232,0.08)';
  const text     = isLight ? '#1a1806'             : '#f5f0e8';
  const muted    = isLight ? 'rgba(30,28,22,0.5)'  : 'rgba(245,240,232,0.45)';
  const faint    = isLight ? 'rgba(30,28,22,0.25)' : 'rgba(245,240,232,0.2)';
  const inpStyle = { fontFamily: 'monospace', fontSize: 11, background: isLight ? 'rgba(30,28,22,0.04)' : 'rgba(245,240,232,0.04)', border: `1px solid ${border}`, color: text, borderRadius: 3, padding: '10px 12px', width: '100%', boxSizing: 'border-box', overflowX: 'auto' };

  // ── State ────────────────────────────────────────────────────────────────────
  const [copiedId, setCopiedId] = useState(null);

  // Sitemaps
  const [statuses,       setStatuses]       = useState({});
  const [checking,       setChecking]       = useState(false);
  const [lastChecked,    setLastChecked]     = useState(null);
  const [showDeploy,     setShowDeploy]      = useState(false);

  // RSS
  const [rssStatuses,    setRssStatuses]    = useState({});
  const [rssChecking,    setRssChecking]    = useState(false);
  const [rssLastChecked, setRssLastChecked] = useState(null);
  const [showRss,        setShowRss]        = useState(false);
  const [showRssCats,    setShowRssCats]    = useState(false);
  const [copiedRssTag,   setCopiedRssTag]   = useState(null);
  const [rssCounts,      setRssCounts]      = useState({}); // { slug: count }
  const [rssCountsLoaded, setRssCountsLoaded] = useState(false);

  // robots.txt
  const [showRobots,      setShowRobots]      = useState(false);
  const [robotsContent,   setRobotsContent]   = useState(DEFAULT_ROBOTS);
  const [robotsLoaded,    setRobotsLoaded]    = useState(false);
  const [robotsSaving,    setRobotsSaving]    = useState(false);
  const [robotsSaveMsg,   setRobotsSaveMsg]   = useState('');
  const [robotsAiLoading, setRobotsAiLoading] = useState(false);
  const [robotsAiNote,    setRobotsAiNote]    = useState('');
  const [robotsValidation, setRobotsValidation] = useState(null); // { errors, warnings, valid }

  // Verification codes
  const [showVerify,   setShowVerify]   = useState(false);
  const [googleCode,   setGoogleCode]   = useState('');
  const [bingCode,     setBingCode]     = useState('');
  const [verifySaving, setVerifySaving] = useState({});
  const verifySaveTimers = useRef({});

  // IndexNow
  const [showIndexNow,    setShowIndexNow]    = useState(false);
  const [indexNowKey,     setIndexNowKey]     = useState('');
  const [indexNowSaving,  setIndexNowSaving]  = useState(false);
  const [indexNowResult,  setIndexNowResult]  = useState(null);
  const [indexNowLoading, setIndexNowLoading] = useState(false);

  // ── DB helpers ───────────────────────────────────────────────────────────────
  const saveSetting = useCallback(async (key, value) => {
    await supabase.from('platform_settings').upsert(
      { key, value, label: key, category: 'general' },
      { onConflict: 'key' }
    );
  }, []);

  // ── Load all settings on mount ───────────────────────────────────────────────
  useEffect(() => {
    const keys = ['seo_robots_txt','seo_google_verification','seo_bing_verification','seo_indexnow_key'];
    supabase.from('platform_settings').select('key, value').in('key', keys).then(({ data }) => {
      (data || []).forEach(row => {
        if (row.key === 'seo_robots_txt'          && row.value) setRobotsContent(row.value);
        if (row.key === 'seo_google_verification' && row.value) setGoogleCode(row.value);
        if (row.key === 'seo_bing_verification'   && row.value) setBingCode(row.value);
        if (row.key === 'seo_indexnow_key'        && row.value) setIndexNowKey(row.value);
      });
      setRobotsLoaded(true);
    });
  }, []);

  // ── Validate robots on content change ───────────────────────────────────────
  useEffect(() => {
    if (!robotsLoaded) return;
    setRobotsValidation(validateRobots(robotsContent));
  }, [robotsContent, robotsLoaded]);

  // ── Load RSS article counts when section opens ───────────────────────────────
  useEffect(() => {
    if (!showRss || rssCountsLoaded) return;
    Promise.all(
      RSS_CATEGORY_SLUGS.map(slug =>
        supabase.from('magazine_posts').select('id', { count: 'exact', head: true })
          .eq('status', 'published').eq('category_slug', slug)
          .then(({ count }) => [slug, count || 0])
      )
    ).then(results => {
      setRssCounts(Object.fromEntries(results));
      setRssCountsLoaded(true);
    });
  }, [showRss, rssCountsLoaded]);

  // ── Status checks ────────────────────────────────────────────────────────────
  const checkAll = useCallback(async () => {
    setChecking(true);
    setStatuses(Object.fromEntries(SITEMAPS.map(s => [s.id, { status: 'checking' }])));
    const results = await Promise.all(SITEMAPS.map(s => checkURL(s.path).then(r => [s.id, r])));
    setStatuses(Object.fromEntries(results));
    setChecking(false);
    setLastChecked(new Date());
  }, []);

  const checkAllRss = useCallback(async () => {
    setRssChecking(true);
    const all = [RSS_MAIN, ...RSS_CATEGORIES];
    setRssStatuses(Object.fromEntries(all.map(f => [f.id, { status: 'checking' }])));
    const results = await Promise.all(all.map(f => checkURL(f.path).then(r => [f.id, r])));
    setRssStatuses(Object.fromEntries(results));
    setRssChecking(false);
    setRssLastChecked(new Date());
  }, []);

  useEffect(() => { checkAll(); }, [checkAll]);

  // ── Robots save ──────────────────────────────────────────────────────────────
  const saveRobots = useCallback(async () => {
    if (!robotsValidation?.valid) return;
    setRobotsSaving(true);
    setRobotsSaveMsg('');
    await saveSetting('seo_robots_txt', robotsContent);
    setRobotsSaving(false);
    setRobotsSaveMsg('✓ Saved to database — robots-txt function will serve this immediately');
    setTimeout(() => setRobotsSaveMsg(''), 4000);
  }, [robotsContent, robotsValidation, saveSetting]);

  // ── Verification code auto-save (debounced 800ms) ────────────────────────────
  const saveVerification = useCallback((key, value) => {
    clearTimeout(verifySaveTimers.current[key]);
    verifySaveTimers.current[key] = setTimeout(async () => {
      setVerifySaving(p => ({ ...p, [key]: true }));
      await saveSetting(key, value);
      setVerifySaving(p => ({ ...p, [key]: false }));
    }, 800);
  }, [saveSetting]);

  // ── IndexNow key save ────────────────────────────────────────────────────────
  const saveIndexNowKey = useCallback(async () => {
    setIndexNowSaving(true);
    await saveSetting('seo_indexnow_key', indexNowKey);
    setIndexNowSaving(false);
  }, [indexNowKey, saveSetting]);

  // ── IndexNow submit all public pages ────────────────────────────────────────
  const submitAllIndexNow = useCallback(async () => {
    if (!indexNowKey) return;
    setIndexNowLoading(true);
    setIndexNowResult(null);
    const urls = [
      `${SITE_URL}/`,
      `${SITE_URL}/magazine`,
      `${SITE_URL}/planners`,
      `${SITE_URL}/wedding-venues`,
    ];
    const result = await submitIndexNow(indexNowKey, urls);
    setIndexNowResult(result);
    setIndexNowLoading(false);
  }, [indexNowKey]);

  // ── AI robots generation ─────────────────────────────────────────────────────
  const generateRobotsAI = useCallback(async () => {
    setRobotsAiLoading(true);
    setRobotsAiNote('');
    try {
      const { data, error } = await supabase.functions.invoke('ai-generate', {
        body: {
          feature: 'robots_txt',
          systemPrompt: `You are an elite technical SEO specialist for a luxury wedding directory platform (${SITE_URL}). You write perfect robots.txt files that maximise crawl efficiency, protect private areas, and boost indexation of high-value pages. Always include all sitemaps. Return ONLY the raw robots.txt content — no explanation, no markdown, no code blocks.`,
          userPrompt: `Generate an optimal robots.txt for this luxury wedding directory. The site has:
- Public pages: wedding venues (/wedding-venues/), showcase pages (/showcase/), vendor profiles (/vendor/), magazine articles (/magazine/), planners (/planners/), region pages (/[country]/[region]/)
- Private areas to block: /admin, /vendor/dashboard, /vendor/auth, /listing-studio, /magazine-studio, /getting-married, /api/, *.json files
- Sitemaps: sitemap-index.xml, sitemap.xml, sitemap-images.xml, sitemap-video.xml, sitemap-news.xml
- Crawl-delay: 2
Current robots.txt:\n${robotsContent}\n\nGenerate a clean, well-commented, production-ready robots.txt. Consider Googlebot and Bingbot specifically. Return ONLY the robots.txt content.`,
        },
      });
      if (error || !data?.text) throw new Error(error?.message || 'No response');
      setRobotsContent(data.text.trim());
      setRobotsAiNote('✦ AI-generated — review before saving');
    } catch {
      setRobotsAiNote('AI generation failed — check ai-generate function is deployed');
    }
    setRobotsAiLoading(false);
  }, [robotsContent]);

  // ── Clipboard ────────────────────────────────────────────────────────────────
  const copy = useCallback((val, id) => {
    navigator.clipboard?.writeText(val).then(() => { setCopiedId(id); setTimeout(() => setCopiedId(null), 1800); });
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: bg, minHeight: '100%', padding: '28px 32px 60px', fontFamily: NU, color: text }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: GD, fontSize: 22, fontWeight: 400, marginBottom: 4 }}>Discovery Infrastructure</div>
        <div style={{ fontSize: 12, color: muted }}>
          Sitemaps · RSS feeds · robots.txt · IndexNow · verification — all persisted and live-served.
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={checkAll} disabled={checking}
          style={{ fontFamily: NU, fontSize: 11, fontWeight: 600, padding: '7px 16px', borderRadius: 3, cursor: 'pointer', background: checking ? 'transparent' : G, color: checking ? G : '#1a1714', border: `1px solid ${G}`, opacity: checking ? 0.7 : 1 }}>
          {checking ? '⟳ Checking…' : '⟳ Check All Sitemaps'}
        </button>
        <button onClick={() => window.open(`https://search.google.com/search-console/sitemaps?resource_id=${encodeURIComponent(SITE_URL)}&sitemap=${encodeURIComponent(SITE_URL + '/sitemap-index.xml')}`, '_blank')}
          style={{ fontFamily: NU, fontSize: 11, padding: '7px 16px', borderRadius: 3, cursor: 'pointer', background: 'transparent', color: '#4285f4', border: '1px solid #4285f430' }}>
          Submit to Google ↗
        </button>
        <button onClick={() => window.open('https://www.bing.com/webmaster/tools/submit-sitemap', '_blank')}
          style={{ fontFamily: NU, fontSize: 11, padding: '7px 16px', borderRadius: 3, cursor: 'pointer', background: 'transparent', color: '#00897b', border: '1px solid #00897b30' }}>
          Submit to Bing ↗
        </button>
        <button onClick={() => window.open(`${SITE_URL}/robots.txt`, '_blank')}
          style={{ fontFamily: NU, fontSize: 11, padding: '7px 16px', borderRadius: 3, cursor: 'pointer', background: 'transparent', color: muted, border: `1px solid ${border}` }}>
          robots.txt ↗
        </button>
        {lastChecked && <span style={{ fontSize: 10, color: faint, alignSelf: 'center' }}>checked {timeAgo(lastChecked)}</span>}
      </div>

      {/* Sitemap cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
        {SITEMAPS.map(s => {
          const st = statuses[s.id] || {};
          const fullUrl = `${SITE_URL}${s.path}`;
          return (
            <div key={s.id} style={{ background: surface, border: `1px solid ${border}`, borderRadius: 6, padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ paddingTop: 3, flexShrink: 0 }}><StatusDot status={st.status || 'unknown'} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: NU, fontSize: 13, fontWeight: 600 }}>{s.label}</span>
                  <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 2, background: PRIORITY_BG[s.priority], color: PRIORITY_COLOR[s.priority], border: `1px solid ${PRIORITY_COLOR[s.priority]}30` }}>{s.priority}</span>
                  {st.httpStatus && <span style={{ fontFamily: 'monospace', fontSize: 10, color: st.status === 'ok' ? '#10b981' : '#ef4444' }}>HTTP {st.httpStatus}</span>}
                </div>
                <div style={{ fontSize: 11, color: muted, marginBottom: 6, lineHeight: 1.5 }}>{s.description}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <a href={fullUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'monospace', fontSize: 10, color: G, textDecoration: 'none' }}>{s.path}</a>
                  <button onClick={() => copy(fullUrl, s.id + '-url')} style={{ fontFamily: NU, fontSize: 9, color: faint, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{copiedId === s.id + '-url' ? '✓ copied' : 'copy'}</button>
                  <span style={{ color: faint }}>·</span>
                  <button onClick={() => window.open(`https://search.google.com/search-console/sitemaps?resource_id=${encodeURIComponent(SITE_URL)}&sitemap=${encodeURIComponent(fullUrl)}`, '_blank')} style={{ fontFamily: NU, fontSize: 9, color: '#4285f4', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Submit to GSC ↗</button>
                </div>
              </div>
              <div style={{ flexShrink: 0, fontFamily: 'monospace', fontSize: 9, color: faint, paddingTop: 2 }}>fn: {s.function}</div>
            </div>
          );
        })}
      </div>

      {/* Deployment */}
      <div style={{ marginBottom: 24 }}>
        <button onClick={() => setShowDeploy(v => !v)}
          style={{ fontFamily: NU, fontSize: 11, fontWeight: 600, color: G, background: 'none', border: `1px solid ${G}30`, borderRadius: 3, padding: '6px 14px', cursor: 'pointer', marginBottom: 10 }}>
          {showDeploy ? '▾' : '▸'} Deployment & Nginx Config
        </button>
        {showDeploy && (
          <div>
            <div style={{ fontSize: 11, color: muted, marginBottom: 8 }}>Deploy all edge functions:</div>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <pre style={{ ...inpStyle, whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{SITEMAP_DEPLOY}</pre>
              <button onClick={() => copy(SITEMAP_DEPLOY, 'deploy')} style={{ position: 'absolute', top: 8, right: 8, fontFamily: NU, fontSize: 9, color: G, background: surface, border: `1px solid ${G}40`, borderRadius: 2, padding: '3px 8px', cursor: 'pointer' }}>{copiedId === 'deploy' ? '✓ Copied' : 'Copy'}</button>
            </div>
            <div style={{ fontSize: 11, color: muted, marginBottom: 8 }}>Nginx location blocks (self-hosted VPS):</div>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <pre style={{ ...inpStyle, whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{SITEMAP_NGINX}</pre>
              <button onClick={() => copy(SITEMAP_NGINX, 'nginx')} style={{ position: 'absolute', top: 8, right: 8, fontFamily: NU, fontSize: 9, color: G, background: surface, border: `1px solid ${G}40`, borderRadius: 2, padding: '3px 8px', cursor: 'pointer' }}>{copiedId === 'nginx' ? '✓ Copied' : 'Copy'}</button>
            </div>
            <div style={{ fontSize: 11, color: muted, marginBottom: 8 }}>RSS + robots.txt Nginx blocks:</div>
            <div style={{ position: 'relative' }}>
              <pre style={{ ...inpStyle, whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{RSS_NGINX}</pre>
              <button onClick={() => copy(RSS_NGINX, 'rss-nginx')} style={{ position: 'absolute', top: 8, right: 8, fontFamily: NU, fontSize: 9, color: G, background: surface, border: `1px solid ${G}40`, borderRadius: 2, padding: '3px 8px', cursor: 'pointer' }}>{copiedId === 'rss-nginx' ? '✓ Copied' : 'Copy'}</button>
            </div>
          </div>
        )}
      </div>

      {/* robots.txt Editor */}
      <div style={{ marginBottom: 24 }}>
        <button onClick={() => setShowRobots(v => !v)}
          style={{ fontFamily: NU, fontSize: 11, fontWeight: 600, color: muted, background: 'none', border: `1px solid ${border}`, borderRadius: 3, padding: '6px 14px', cursor: 'pointer', marginBottom: 10 }}>
          {showRobots ? '▾' : '▸'} robots.txt
        </button>
        {showRobots && (
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 6, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: GD, fontSize: 14, color: text }}>robots.txt Editor</span>
              <button onClick={generateRobotsAI} disabled={robotsAiLoading}
                style={{ fontFamily: NU, fontSize: 10, fontWeight: 600, padding: '5px 12px', borderRadius: 3, cursor: robotsAiLoading ? 'not-allowed' : 'pointer', background: robotsAiLoading ? 'transparent' : `${G}18`, color: G, border: `1px solid ${G}40`, opacity: robotsAiLoading ? 0.7 : 1 }}>
                {robotsAiLoading ? '✦ Generating…' : '✦ AI Optimise'}
              </button>
              <button onClick={() => window.open(`${SITE_URL}/robots.txt`, '_blank')}
                style={{ fontFamily: NU, fontSize: 10, padding: '5px 12px', borderRadius: 3, cursor: 'pointer', background: 'transparent', color: muted, border: `1px solid ${border}` }}>View Live ↗</button>
              <button onClick={() => setRobotsContent(DEFAULT_ROBOTS)}
                style={{ fontFamily: NU, fontSize: 10, padding: '5px 12px', borderRadius: 3, cursor: 'pointer', background: 'transparent', color: muted, border: `1px solid ${border}` }}>Reset</button>
            </div>

            {robotsAiNote && <div style={{ fontSize: 10, color: G, marginBottom: 10, fontStyle: 'italic' }}>{robotsAiNote}</div>}

            {/* Validation feedback */}
            {robotsValidation && (robotsValidation.errors.length > 0 || robotsValidation.warnings.length > 0) && (
              <div style={{ marginBottom: 12 }}>
                {robotsValidation.errors.map((e, i) => (
                  <div key={i} style={{ fontSize: 10, color: '#ef4444', marginBottom: 3 }}>✕ {e}</div>
                ))}
                {robotsValidation.warnings.map((w, i) => (
                  <div key={i} style={{ fontSize: 10, color: G, marginBottom: 3 }}>⚠ {w}</div>
                ))}
              </div>
            )}
            {robotsValidation?.valid && robotsLoaded && (
              <div style={{ fontSize: 10, color: '#10b981', marginBottom: 10 }}>✓ Valid robots.txt</div>
            )}

            <div style={{ fontSize: 10, color: muted, marginBottom: 8, lineHeight: 1.6 }}>
              Saved to database — served live via <code style={{ fontFamily: 'monospace', color: G }}>/robots.txt</code> edge function. No static file needed.
            </div>

            <div style={{ position: 'relative' }}>
              <textarea value={robotsContent} onChange={e => setRobotsContent(e.target.value)} spellCheck={false}
                rows={robotsContent.split('\n').length + 2}
                style={{ fontFamily: 'monospace', fontSize: 11, lineHeight: 1.8, background: isLight ? 'rgba(30,28,22,0.04)' : 'rgba(245,240,232,0.04)', border: `1px solid ${robotsValidation && !robotsValidation.valid ? '#ef444440' : border}`, color: text, borderRadius: 3, padding: '12px 14px', width: '100%', boxSizing: 'border-box', resize: 'vertical', outline: 'none', minHeight: 260 }} />
              <button onClick={() => copy(robotsContent, 'robots-copy')}
                style={{ position: 'absolute', top: 8, right: 8, fontFamily: NU, fontSize: 9, color: G, background: surface, border: `1px solid ${G}40`, borderRadius: 2, padding: '3px 8px', cursor: 'pointer' }}>{copiedId === 'robots-copy' ? '✓ Copied' : 'Copy'}</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
              <button onClick={saveRobots} disabled={robotsSaving || (robotsValidation && !robotsValidation.valid)}
                style={{ fontFamily: NU, fontSize: 11, fontWeight: 600, padding: '7px 18px', borderRadius: 3, cursor: (robotsSaving || (robotsValidation && !robotsValidation.valid)) ? 'not-allowed' : 'pointer', background: (robotsValidation && !robotsValidation.valid) ? '#6b7280' : G, color: '#1a1714', border: 'none', opacity: robotsSaving ? 0.7 : 1 }}>
                {robotsSaving ? 'Saving…' : 'Save & Deploy'}
              </button>
              {robotsSaveMsg && <span style={{ fontSize: 10, color: '#10b981' }}>{robotsSaveMsg}</span>}
              {!robotsSaveMsg && <span style={{ fontSize: 10, color: muted }}>Saves to DB · served live immediately at /robots.txt</span>}
            </div>
          </div>
        )}
      </div>

      {/* RSS Feeds */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <button onClick={() => setShowRss(v => !v)}
            style={{ fontFamily: NU, fontSize: 11, fontWeight: 600, color: G, background: 'none', border: `1px solid ${G}30`, borderRadius: 3, padding: '6px 14px', cursor: 'pointer' }}>
            {showRss ? '▾' : '▸'} RSS Feeds
          </button>
          {showRss && (
            <button onClick={checkAllRss} disabled={rssChecking}
              style={{ fontFamily: NU, fontSize: 10, padding: '5px 12px', borderRadius: 3, cursor: 'pointer', background: rssChecking ? 'transparent' : G, color: rssChecking ? G : '#1a1714', border: `1px solid ${G}`, opacity: rssChecking ? 0.7 : 1 }}>
              {rssChecking ? '⟳ Checking…' : '⟳ Check All'}
            </button>
          )}
          {showRss && rssLastChecked && <span style={{ fontSize: 10, color: faint }}>checked {timeAgo(rssLastChecked)}</span>}
        </div>

        {showRss && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Main feed card */}
            <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '6px 6px 0 0', padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ paddingTop: 3, flexShrink: 0 }}><StatusDot status={rssStatuses[RSS_MAIN.id]?.status || 'unknown'} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: NU, fontSize: 13, fontWeight: 600 }}>{RSS_MAIN.label}</span>
                  <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 2, background: PRIORITY_BG.critical, color: PRIORITY_COLOR.critical, border: `1px solid ${PRIORITY_COLOR.critical}30` }}>primary</span>
                  {rssStatuses[RSS_MAIN.id]?.httpStatus && <span style={{ fontFamily: 'monospace', fontSize: 10, color: rssStatuses[RSS_MAIN.id]?.status === 'ok' ? '#10b981' : '#ef4444' }}>HTTP {rssStatuses[RSS_MAIN.id].httpStatus}</span>}
                </div>
                <div style={{ fontSize: 11, color: muted, marginBottom: 6 }}>{RSS_MAIN.description}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
                  <a href={`${SITE_URL}${RSS_MAIN.path}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'monospace', fontSize: 10, color: G, textDecoration: 'none' }}>{RSS_MAIN.path}</a>
                  <button onClick={() => copy(`${SITE_URL}${RSS_MAIN.path}`, 'rss-main-url')} style={{ fontFamily: NU, fontSize: 9, color: faint, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{copiedId === 'rss-main-url' ? '✓ copied' : 'copy url'}</button>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <code style={{ fontFamily: 'monospace', fontSize: 9, color: muted, background: isLight ? 'rgba(30,28,22,0.05)' : 'rgba(245,240,232,0.05)', padding: '3px 7px', borderRadius: 2, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{RSS_MAIN.headTag}</code>
                  <button onClick={() => { copy(RSS_MAIN.headTag, 'rss-main-tag'); setCopiedRssTag('main'); setTimeout(() => setCopiedRssTag(null), 1800); }} style={{ fontFamily: NU, fontSize: 9, color: G, background: 'none', border: `1px solid ${G}30`, borderRadius: 2, padding: '3px 8px', cursor: 'pointer', flexShrink: 0 }}>{copiedRssTag === 'main' ? '✓' : 'Copy <link>'}</button>
                </div>
              </div>
            </div>

            {/* Category feeds */}
            <div style={{ background: isLight ? 'rgba(30,28,22,0.02)' : 'rgba(245,240,232,0.02)', border: `1px solid ${border}`, borderTop: 'none', borderRadius: '0 0 6px 6px', padding: '10px 18px' }}>
              <button onClick={() => setShowRssCats(v => !v)}
                style={{ fontFamily: NU, fontSize: 10, color: muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: showRssCats ? 12 : 0 }}>
                {showRssCats ? '▾' : '▸'} Category feeds ({RSS_CATEGORIES.length})
              </button>
              {showRssCats && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {RSS_CATEGORIES.map(f => {
                    const st = rssStatuses[f.id] || {};
                    const count = rssCounts[f.slug];
                    return (
                      <div key={f.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${border}` }}>
                        <StatusDot status={st.status || 'unknown'} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: NU, fontSize: 11, fontWeight: 600 }}>{f.label}</span>
                            {typeof count === 'number' && <span style={{ fontFamily: NU, fontSize: 9, color: faint }}>{count} article{count !== 1 ? 's' : ''}</span>}
                            {st.httpStatus && <span style={{ fontFamily: 'monospace', fontSize: 9, color: st.status === 'ok' ? '#10b981' : '#ef4444' }}>HTTP {st.httpStatus}</span>}
                            <a href={`${SITE_URL}${f.path}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'monospace', fontSize: 9, color: G, textDecoration: 'none' }}>{f.path}</a>
                          </div>
                        </div>
                        <button onClick={() => { copy(f.headTag, `rss-tag-${f.id}`); setCopiedRssTag(f.id); setTimeout(() => setCopiedRssTag(null), 1800); }} style={{ fontFamily: NU, fontSize: 9, color: G, background: 'none', border: `1px solid ${G}30`, borderRadius: 2, padding: '3px 8px', cursor: 'pointer', flexShrink: 0 }}>{copiedRssTag === f.id ? '✓' : 'Copy <link>'}</button>
                      </div>
                    );
                  })}
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 10, color: muted, marginBottom: 6 }}>All category tags for &lt;head&gt; (auto-injected via GlobalSeoHead):</div>
                    <div style={{ position: 'relative' }}>
                      <pre style={{ ...inpStyle, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{RSS_CATEGORIES.map(f => f.headTag).join('\n')}</pre>
                      <button onClick={() => copy(RSS_CATEGORIES.map(f => f.headTag).join('\n'), 'rss-all-tags')} style={{ position: 'absolute', top: 8, right: 8, fontFamily: NU, fontSize: 9, color: G, background: surface, border: `1px solid ${G}40`, borderRadius: 2, padding: '3px 8px', cursor: 'pointer' }}>{copiedId === 'rss-all-tags' ? '✓ Copied' : 'Copy All'}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RSS deploy */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, color: muted, marginBottom: 6 }}>Deploy commands (includes robots-txt function):</div>
              <div style={{ position: 'relative' }}>
                <pre style={{ ...inpStyle, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{RSS_DEPLOY}</pre>
                <button onClick={() => copy(RSS_DEPLOY, 'rss-deploy')} style={{ position: 'absolute', top: 8, right: 8, fontFamily: NU, fontSize: 9, color: G, background: surface, border: `1px solid ${G}40`, borderRadius: 2, padding: '3px 8px', cursor: 'pointer' }}>{copiedId === 'rss-deploy' ? '✓ Copied' : 'Copy'}</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* IndexNow */}
      <div style={{ marginBottom: 24 }}>
        <button onClick={() => setShowIndexNow(v => !v)}
          style={{ fontFamily: NU, fontSize: 11, fontWeight: 600, color: G, background: 'none', border: `1px solid ${G}30`, borderRadius: 3, padding: '6px 14px', cursor: 'pointer', marginBottom: 10 }}>
          {showIndexNow ? '▾' : '▸'} IndexNow
        </button>
        {showIndexNow && (
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 6, padding: '18px 20px' }}>
            <div style={{ fontSize: 11, color: muted, marginBottom: 14, lineHeight: 1.7 }}>
              IndexNow instantly notifies Bing, Yandex, and others when pages are published or updated — no waiting for crawls.
              New articles auto-ping IndexNow on publish if a key is saved here.
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 10, color: muted, marginBottom: 4 }}>IndexNow API key</div>
                <input value={indexNowKey} onChange={e => setIndexNowKey(e.target.value)} placeholder="Generate a random key, e.g. a1b2c3d4e5f6…"
                  style={{ fontFamily: 'monospace', fontSize: 11, background: isLight ? 'rgba(30,28,22,0.04)' : 'rgba(245,240,232,0.04)', border: `1px solid ${border}`, color: text, borderRadius: 3, padding: '8px 12px', width: '100%', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <button onClick={saveIndexNowKey} disabled={indexNowSaving || !indexNowKey}
                style={{ fontFamily: NU, fontSize: 11, fontWeight: 600, padding: '8px 16px', borderRadius: 3, cursor: 'pointer', background: G, color: '#1a1714', border: 'none', opacity: indexNowSaving ? 0.7 : 1 }}>
                {indexNowSaving ? 'Saving…' : 'Save Key'}
              </button>
            </div>
            {indexNowKey && (
              <div style={{ fontSize: 10, color: muted, marginBottom: 14, lineHeight: 1.7 }}>
                You must host a key verification file at: <code style={{ fontFamily: 'monospace', color: G }}>{SITE_URL}/{indexNowKey}.txt</code><br />
                Contents should be just the key: <code style={{ fontFamily: 'monospace', color: G }}>{indexNowKey}</code>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={submitAllIndexNow} disabled={indexNowLoading || !indexNowKey}
                style={{ fontFamily: NU, fontSize: 11, padding: '7px 16px', borderRadius: 3, cursor: (!indexNowKey || indexNowLoading) ? 'not-allowed' : 'pointer', background: 'transparent', color: G, border: `1px solid ${G}40`, opacity: (!indexNowKey || indexNowLoading) ? 0.5 : 1 }}>
                {indexNowLoading ? '⟳ Submitting…' : '⟳ Submit Public Pages Now'}
              </button>
              {indexNowResult && (
                <span style={{ fontSize: 10, color: indexNowResult.ok ? '#10b981' : '#ef4444' }}>
                  {indexNowResult.ok ? '✓' : '✕'} {indexNowResult.msg}
                </span>
              )}
            </div>
            {!indexNowKey && <div style={{ fontSize: 10, color: faint, marginTop: 8 }}>Auto-ping on publish is inactive until a key is saved.</div>}
          </div>
        )}
      </div>

      {/* Search Verification */}
      <div style={{ marginBottom: 24 }}>
        <button onClick={() => setShowVerify(v => !v)}
          style={{ fontFamily: NU, fontSize: 11, fontWeight: 600, color: G, background: 'none', border: `1px solid ${G}30`, borderRadius: 3, padding: '6px 14px', cursor: 'pointer', marginBottom: 10 }}>
          {showVerify ? '▾' : '▸'} Search Engine Verification
        </button>
        {showVerify && (
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 6, padding: '18px 20px' }}>
            <div style={{ fontSize: 11, color: muted, marginBottom: 16, lineHeight: 1.6 }}>
              Codes saved here are automatically injected into the site &lt;head&gt; via GlobalSeoHead. No manual copy-paste needed.
            </div>

            {/* Google */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#4285f4' }}>Google Search Console</span>
                {verifySaving['seo_google_verification'] && <span style={{ fontSize: 9, color: G }}>saving…</span>}
                <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, color: '#4285f4', textDecoration: 'none', opacity: 0.7 }}>Open GSC ↗</a>
              </div>
              <div style={{ fontSize: 10, color: muted, marginBottom: 6 }}>GSC → Add Property → HTML tag → copy the content= value.</div>
              <input value={googleCode} onChange={e => { setGoogleCode(e.target.value); saveVerification('seo_google_verification', e.target.value); }}
                placeholder="Paste verification code…"
                style={{ fontFamily: 'monospace', fontSize: 11, background: isLight ? 'rgba(30,28,22,0.04)' : 'rgba(245,240,232,0.04)', border: `1px solid ${border}`, color: text, borderRadius: 3, padding: '8px 12px', width: '100%', boxSizing: 'border-box', outline: 'none' }} />
              {googleCode && (
                <div style={{ position: 'relative', marginTop: 8 }}>
                  <pre style={{ ...inpStyle, margin: 0 }}>{`<meta name="google-site-verification" content="${googleCode.trim()}" />`}</pre>
                  <button onClick={() => copy(`<meta name="google-site-verification" content="${googleCode.trim()}" />`, 'google-meta')} style={{ position: 'absolute', top: 8, right: 8, fontFamily: NU, fontSize: 9, color: G, background: surface, border: `1px solid ${G}40`, borderRadius: 2, padding: '3px 8px', cursor: 'pointer' }}>{copiedId === 'google-meta' ? '✓ Copied' : 'Copy'}</button>
                </div>
              )}
            </div>

            {/* Bing */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#00897b' }}>Bing Webmaster Tools</span>
                {verifySaving['seo_bing_verification'] && <span style={{ fontSize: 9, color: G }}>saving…</span>}
                <a href="https://www.bing.com/webmasters" target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, color: '#00897b', textDecoration: 'none', opacity: 0.7 }}>Open Bing WMT ↗</a>
              </div>
              <div style={{ fontSize: 10, color: muted, marginBottom: 6 }}>Bing WMT → Add Site → meta tag → copy the content= value.</div>
              <input value={bingCode} onChange={e => { setBingCode(e.target.value); saveVerification('seo_bing_verification', e.target.value); }}
                placeholder="Paste verification code…"
                style={{ fontFamily: 'monospace', fontSize: 11, background: isLight ? 'rgba(30,28,22,0.04)' : 'rgba(245,240,232,0.04)', border: `1px solid ${border}`, color: text, borderRadius: 3, padding: '8px 12px', width: '100%', boxSizing: 'border-box', outline: 'none' }} />
              {bingCode && (
                <div style={{ position: 'relative', marginTop: 8 }}>
                  <pre style={{ ...inpStyle, margin: 0 }}>{`<meta name="msvalidate.01" content="${bingCode.trim()}" />`}</pre>
                  <button onClick={() => copy(`<meta name="msvalidate.01" content="${bingCode.trim()}" />`, 'bing-meta')} style={{ position: 'absolute', top: 8, right: 8, fontFamily: NU, fontSize: 9, color: G, background: surface, border: `1px solid ${G}40`, borderRadius: 2, padding: '3px 8px', cursor: 'pointer' }}>{copiedId === 'bing-meta' ? '✓ Copied' : 'Copy'}</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Best Practice Notes */}
      <div style={{ marginTop: 32, padding: '16px 20px', background: 'rgba(201,168,76,0.08)', border: `1px solid ${G}20`, borderRadius: 6, borderLeft: `3px solid ${G}` }}>
        <div style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, color: G, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>✦ System Notes</div>
        <div style={{ fontFamily: NU, fontSize: 11, color: muted, lineHeight: 1.8 }}>
          • <strong style={{ color: text }}>robots.txt</strong> — saved to DB, served live by the robots-txt edge function. No static file needed.<br />
          • <strong style={{ color: text }}>Verification codes</strong> — saved to DB, auto-injected into &lt;head&gt; via GlobalSeoHead on every page.<br />
          • <strong style={{ color: text }}>RSS feeds</strong> — &lt;link rel="alternate"&gt; tags are auto-injected site-wide. No manual placement needed.<br />
          • <strong style={{ color: text }}>IndexNow</strong> — fires automatically when a magazine article is published. Also triggerable manually above.<br />
          • <strong style={{ color: text }}>IndexNow key file</strong> — you must host /{'{key}'}.txt on your domain. Place it in /public before deploying.<br />
          • <strong style={{ color: text }}>Sitemap Index</strong> — submit this once to GSC; Google discovers all children automatically.
        </div>
      </div>
    </div>
  );
}
