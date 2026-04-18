// ─── AIIssueBuilderPanel.jsx ──────────────────────────────────────────────────
// AI Issue Builder — type a brief, get a full magazine issue structure.
// Calls the ai-generate edge function to produce a JSON page plan, shows
// a review step, then builds all pages off-screen and inserts them in one shot.

import { useState, useRef } from 'react';
import { callAiGenerate } from '../../../lib/aiGenerate';
import { GOLD, BORDER, MUTED, NU, GD } from './designerConstants';
import { getVoiceInjection } from '../../../services/studioVoiceService';
import { useSpeechInput } from './useSpeechInput';

// ── Full template registry with visual density + zone metadata ────────────────
// visual: 'image-heavy' | 'text-heavy' | 'mixed'
// zone:   'open' | 'feature' | 'fashion' | 'story' | 'venue' | 'close' | 'any'
const VALID_TEMPLATES = [
  // Cover & Navigation
  { id: 'vogue-cover',          label: 'The Cover',            category: 'Cover',        visual: 'image-heavy', zone: 'open'    },
  { id: 'cover-split',          label: 'Cover — Split',        category: 'Cover',        visual: 'image-heavy', zone: 'open'    },
  { id: 'cover-typographic',    label: 'Cover — Typographic',  category: 'Cover',        visual: 'text-heavy',  zone: 'open'    },
  { id: 'season-opener',        label: 'Season Opener',        category: 'Cover',        visual: 'text-heavy',  zone: 'open'    },
  { id: 'editors-letter',       label: "Editor's Letter",      category: 'Navigation',   visual: 'mixed',       zone: 'open'    },
  { id: 'about-page',           label: 'About Page',           category: 'Navigation',   visual: 'text-heavy',  zone: 'open'    },
  { id: 'table-of-contents',    label: 'Contents Page',        category: 'Navigation',   visual: 'text-heavy',  zone: 'open'    },
  { id: 'supplier-credits',     label: 'Supplier Credits',     category: 'Navigation',   visual: 'text-heavy',  zone: 'close'   },
  // Feature Editorial
  { id: 'feature-spread',       label: 'Feature Spread',       category: 'Editorial',    visual: 'image-heavy', zone: 'feature' },
  { id: 'feature-cinematic',    label: 'Feature — Cinematic',  category: 'Editorial',    visual: 'image-heavy', zone: 'feature' },
  { id: 'feature-minimal',      label: 'Feature — Minimal',    category: 'Editorial',    visual: 'mixed',       zone: 'feature' },
  { id: 'story-chapter',        label: 'Story Chapter',        category: 'Editorial',    visual: 'text-heavy',  zone: 'feature' },
  { id: 'styled-shoot',         label: 'Styled Shoot',         category: 'Editorial',    visual: 'image-heavy', zone: 'feature' },
  { id: 'planning-edit',        label: 'Planning Edit',        category: 'Editorial',    visual: 'text-heavy',  zone: 'any'     },
  { id: 'behind-scenes',        label: 'Behind the Scenes',    category: 'Editorial',    visual: 'mixed',       zone: 'any'     },
  { id: 'pull-quote',           label: 'Pull Quote',           category: 'Editorial',    visual: 'text-heavy',  zone: 'any'     },
  { id: 'planner-spotlight',    label: 'Planner Spotlight',    category: 'Editorial',    visual: 'mixed',       zone: 'feature' },
  { id: 'the-interview',        label: 'The Interview',        category: 'Editorial',    visual: 'mixed',       zone: 'feature' },
  { id: 'lux-grid',             label: 'Luxury Grid',          category: 'Editorial',    visual: 'image-heavy', zone: 'any'     },
  { id: 'full-bleed',           label: 'Full Bleed',           category: 'Editorial',    visual: 'image-heavy', zone: 'any'     },
  // Travel
  { id: 'the-destination',      label: 'Destination',          category: 'Travel',       visual: 'image-heavy', zone: 'feature' },
  { id: 'regional-opener',      label: 'Regional Opener',      category: 'Travel',       visual: 'image-heavy', zone: 'feature' },
  { id: 'honeymoon-diary',      label: 'Honeymoon Diary',      category: 'Travel',       visual: 'mixed',       zone: 'story'   },
  { id: 'honeymoon-edit',       label: 'Honeymoon Edit',       category: 'Travel',       visual: 'mixed',       zone: 'story'   },
  // Fashion & Beauty
  { id: 'the-runway',           label: 'Fashion Runway',       category: 'Fashion',      visual: 'image-heavy', zone: 'fashion' },
  { id: 'the-gown',             label: 'The Gown',             category: 'Bridal',       visual: 'image-heavy', zone: 'fashion' },
  { id: 'the-jewel',            label: 'Jewellery',            category: 'Jewellery',    visual: 'image-heavy', zone: 'fashion' },
  { id: 'beauty-edit',          label: 'Beauty Edit',          category: 'Beauty',       visual: 'mixed',       zone: 'fashion' },
  { id: 'floral-spread',        label: 'Floral Spread',        category: 'Florals',      visual: 'image-heavy', zone: 'fashion' },
  { id: 'invitation-suite',     label: 'Invitation Suite',     category: 'Stationery',   visual: 'image-heavy', zone: 'any'     },
  { id: 'cake-moment',          label: 'Cake Moment',          category: 'Food & Cake',  visual: 'image-heavy', zone: 'story'   },
  { id: 'ring-edit',            label: 'Ring Edit',            category: 'Jewellery',    visual: 'image-heavy', zone: 'fashion' },
  { id: 'dress-detail',         label: 'Dress Detail',         category: 'Bridal',       visual: 'image-heavy', zone: 'fashion' },
  { id: 'fashion-plate',        label: 'Fashion Plate',        category: 'Fashion',      visual: 'image-heavy', zone: 'fashion' },
  { id: 'dress-flat-lay',       label: 'Dress Flat Lay',       category: 'Fashion',      visual: 'image-heavy', zone: 'fashion' },
  // Couple & Real Wedding
  { id: 'couple-story',         label: 'Couple Story',         category: 'Couple',       visual: 'image-heavy', zone: 'story'   },
  { id: 'couple-gallery',       label: 'Couple — Gallery',     category: 'Couple',       visual: 'image-heavy', zone: 'story'   },
  { id: 'the-portrait',         label: 'Portrait Page',        category: 'Real Wedding', visual: 'image-heavy', zone: 'story'   },
  { id: 'wedding-gallery',      label: 'Real Wedding Gallery', category: 'Real Wedding', visual: 'image-heavy', zone: 'story'   },
  { id: 'ceremony-aisle',       label: 'Ceremony Aisle',       category: 'Ceremony',     visual: 'image-heavy', zone: 'story'   },
  { id: 'reception-table',      label: 'Reception Table',      category: 'Reception',    visual: 'mixed',       zone: 'story'   },
  // Venue
  { id: 'the-hotel',            label: 'Venue Feature',        category: 'Venue',        visual: 'mixed',       zone: 'venue'   },
  { id: 'venue-skyline',        label: 'Venue — Skyline',      category: 'Venue',        visual: 'mixed',       zone: 'venue'   },
  { id: 'venue-portrait',       label: 'Venue Portrait',       category: 'Venue',        visual: 'image-heavy', zone: 'venue'   },
  { id: 'venue-essay',          label: 'Venue — Essay',        category: 'Venue',        visual: 'mixed',       zone: 'venue'   },
  { id: 'aerial-venue',         label: 'Aerial Venue',         category: 'Venue',        visual: 'image-heavy', zone: 'venue'   },
  { id: 'venue-directory',      label: 'Venue Directory',      category: 'Venue',        visual: 'mixed',       zone: 'venue'   },
  // Commercial
  { id: 'full-page-ad',         label: 'Full-Page Ad',         category: 'Commercial',   visual: 'image-heavy', zone: 'any'     },
  { id: 'product-showcase-ad',  label: 'Product Showcase Ad',  category: 'Commercial',   visual: 'mixed',       zone: 'close'   },
  { id: 'venue-advertisement',  label: 'Venue Ad',             category: 'Commercial',   visual: 'image-heavy', zone: 'close'   },
  // Detail & Back
  { id: 'the-triptych',         label: 'Detail Triptych',      category: 'Detail',       visual: 'image-heavy', zone: 'any'     },
  { id: 'back-cover',           label: 'Back Cover',           category: 'Back Cover',   visual: 'mixed',       zone: 'close'   },
  // Hotel Review (separate builder — listed here for validation only)
  { id: 'hotel-review-cover',   label: 'Hotel Review — Cover',   category: 'Hotel Review', visual: 'image-heavy', zone: 'open'  },
  { id: 'hotel-review-arrival', label: 'Hotel Review — Arrival', category: 'Hotel Review', visual: 'mixed',       zone: 'venue' },
  { id: 'hotel-review-rooms',   label: 'Hotel Review — Rooms',   category: 'Hotel Review', visual: 'mixed',       zone: 'venue' },
  { id: 'hotel-review-dining',  label: 'Hotel Review — Dining',  category: 'Hotel Review', visual: 'mixed',       zone: 'venue' },
  { id: 'hotel-review-verdict', label: 'Hotel Review — Verdict', category: 'Hotel Review', visual: 'text-heavy',  zone: 'close' },
];

const TEMPLATE_IDS_LIST = VALID_TEMPLATES.map(t => t.id).join(', ');

const PAGE_COUNTS = [6, 8, 10, 12, 16];

const PAGE_COUNT_META = {
  6:  { label: 'Quick Read',       desc: 'Cover + hero feature + couple + close' },
  8:  { label: 'Standard Issue',   desc: 'Opening sequence + 2 features + fashion + close' },
  10: { label: 'Full Feature',     desc: 'Full editorial arc across all 5 zones' },
  12: { label: 'Premium Issue',    desc: 'Extended arc — travel, real wedding + venue feature' },
  16: { label: 'Flagship Edition', desc: 'All zones — BTS, planning guide, honeymoon + full credits' },
};

// ── Issue Moods ───────────────────────────────────────────────────────────────
const MOODS = [
  {
    id: 'classic',
    label: 'The Classic Issue',
    icon: '◆',
    desc: 'Balanced luxury. Every category, perfect proportion.',
    moodPrompt: `This is a CLASSIC BALANCED ISSUE. The arc should feel like Vogue Weddings: aspirational but accessible, covering fashion, venues, real weddings, and beauty in equal measure. Template variety is paramount — no zone should dominate.`,
  },
  {
    id: 'destination',
    label: 'Destination Issue',
    icon: '✈',
    desc: 'Travel-first. Regional openers, honeymoon diaries, venue essays.',
    moodPrompt: `This is a DESTINATION-FIRST ISSUE. Lead with a regional-opener in Zone 2. Include the-destination, honeymoon-diary, venue-essay, and aerial-venue. The geographic identity should be felt on every spread — specific locations, local details, atmosphere.`,
  },
  {
    id: 'fashion',
    label: 'Fashion Issue',
    icon: '✦',
    desc: 'Editorial-first. Runway, beauty, styled shoots, cinematic features.',
    moodPrompt: `This is a HIGH-FASHION EDITORIAL ISSUE. Prioritise feature-cinematic, the-runway, styled-shoot, the-gown, beauty-edit, and ring-edit. The visual language should be dramatic and image-led. Include fashion-plate and dress-flat-lay. Minimise text-heavy pages — use pull-quote as the only text breath.`,
  },
  {
    id: 'wedding',
    label: 'Real Wedding Issue',
    icon: '♡',
    desc: 'Story-forward. Couple gallery, ceremony, BTS, supplier credits.',
    moodPrompt: `This is a REAL WEDDING STORY ISSUE. The emotional arc is paramount: story-chapter opener for the real wedding → couple-gallery → ceremony-aisle → behind-scenes → reception-table. Include wedding-gallery and supplier-credits. The issue should feel like you are living the day.`,
  },
];

// ── Editorial Arc Engine — System Prompt ─────────────────────────────────────
function buildSystemPrompt(mood, pageCount) {
  const moodBlock = mood?.moodPrompt || MOODS[0].moodPrompt;

  const sizeGuide = {
    6:  `6-PAGE ARC: p1=cover, p2=editors-letter, p3=feature-spread OR the-destination, p4=fashion OR the-gown OR the-jewel, p5=couple-story OR the-portrait OR the-hotel, p6=back-cover`,
    8:  `8-PAGE ARC: p1=cover, p2=editors-letter, p3=table-of-contents, p4=feature-spread, p5=the-runway OR the-gown, p6=couple-story OR the-portrait, p7=the-hotel OR venue-portrait, p8=back-cover`,
    10: `10-PAGE ARC: p1=cover, p2=editors-letter, p3=table-of-contents, p4=feature-spread OR feature-cinematic, p5=IMAGE-HEAVY travel OR fashion, p6=TEXT-HEAVY breath (pull-quote OR story-chapter OR planning-edit), p7=IMAGE-HEAVY fashion OR beauty, p8=couple-story OR wedding-gallery, p9=the-hotel OR venue-essay, p10=back-cover`,
    12: `12-PAGE ARC: p1=cover, p2=season-opener OR editors-letter, p3=table-of-contents, p4=regional-opener OR feature-cinematic, p5=the-destination OR feature-spread, p6=TEXT breath (pull-quote OR feature-minimal), p7=the-runway OR styled-shoot, p8=the-gown OR beauty-edit, p9=couple-gallery OR wedding-gallery, p10=ceremony-aisle OR the-portrait, p11=venue-essay OR the-hotel, p12=back-cover`,
    16: `16-PAGE ARC: p1=cover, p2=season-opener, p3=editors-letter, p4=table-of-contents, p5=regional-opener OR feature-cinematic, p6=the-destination, p7=TEXT breath (story-chapter OR pull-quote), p8=styled-shoot OR feature-spread, p9=the-runway OR the-gown, p10=beauty-edit OR ring-edit, p11=behind-scenes OR planning-edit, p12=couple-gallery OR wedding-gallery, p13=ceremony-aisle, p14=the-hotel OR venue-skyline, p15=supplier-credits OR venue-advertisement, p16=back-cover`,
  }[pageCount] || `Build a ${pageCount}-page arc with the 5-zone structure described below.`;

  return `You are the creative director and editor-in-chief of Luxury Wedding Directory — a world-class editorial wedding publication, peer of Vogue Weddings and Condé Nast Traveller. Your task is to plan a bespoke magazine issue with genuine editorial intelligence and a precisely calibrated page arc.

You must return ONLY a valid JSON array. No markdown, no explanation, just the raw JSON array.

Each item represents one page:
{
  "template_id": "one of the valid template ids below",
  "page_label": "short descriptive label for this page",
  "kicker": "SHORT KICKER — 3-5 words, ALL CAPS, completely specific to this page",
  "headline": "Evocative editorial headline — 3-8 words, italic-friendly, never generic",
  "body": "2-3 sentences of luxury editorial copy. Specific details — location, time of day, fabric, architecture, emotion. Reads like Condé Nast Traveller. Never templated.",
  "location": "City, Region or Country if relevant",
  "byline": "Optional: 'Photography · Studio Name' or 'Words · Editor Name'"
}

Valid template_id values (choose ONLY from this list):
${TEMPLATE_IDS_LIST}

═══════════════════════════════════════════════════════
ISSUE MOOD: ${mood?.label || 'The Classic Issue'}
${moodBlock}
═══════════════════════════════════════════════════════

STRUCTURAL ARC — 5 EDITORIAL ZONES:

ZONE 1 — OPENING (pages 1–3): Sets the issue's identity.
  Must include: vogue-cover OR cover-split OR cover-typographic (page 1 ALWAYS)
  Should include 1–2 of: editors-letter, table-of-contents, season-opener, about-page
  Never use: story-chapter, the-gown, couple-story, back-cover in Zone 1

ZONE 2 — FEATURE (middle 30–40% of pages): The intellectual and visual climax.
  Must include: at least ONE of: feature-spread, feature-cinematic, feature-minimal
  Should include: travel (the-destination, regional-opener) and editorial depth
  Introduce the issue's geographic identity here

ZONE 3 — FASHION / SPECIALIST (middle 20–30% of pages): Showcases beauty and craft.
  Must include: at least ONE of: the-runway, the-gown, beauty-edit, the-jewel, floral-spread
  Can include: styled-shoot, behind-scenes, ring-edit, planner-spotlight

ZONE 4 — STORY (middle 20–30% of pages): The emotional heart.
  Must include: at least ONE real wedding or couple template
  Should include: one of: couple-gallery, wedding-gallery, couple-story, the-portrait
  Can include: ceremony-aisle, reception-table, cake-moment, story-chapter

ZONE 5 — CLOSE (last 2–3 pages): Graceful resolution.
  Must include: back-cover as the FINAL page
  Should include 1 of: the-hotel, venue-essay, venue-skyline, venue-portrait
  Can include: supplier-credits, venue-advertisement, product-showcase-ad, honeymoon-diary

${sizeGuide}

═══════════════════════════════════════════════════════
VISUAL RHYTHM RULES (non-negotiable):
Image-heavy templates: vogue-cover, cover-split, feature-spread, feature-cinematic, the-destination, regional-opener, the-runway, the-gown, the-jewel, floral-spread, invitation-suite, cake-moment, couple-story, couple-gallery, the-portrait, wedding-gallery, ceremony-aisle, venue-portrait, aerial-venue, styled-shoot, full-bleed, lux-grid, ring-edit, dress-detail, fashion-plate, dress-flat-lay, the-triptych, full-page-ad, venue-advertisement
Text-heavy templates: pull-quote, editors-letter, planning-edit, supplier-credits, about-page, story-chapter, season-opener, table-of-contents, cover-typographic
Mixed templates: beauty-edit, the-hotel, venue-essay, venue-skyline, feature-minimal, behind-scenes, planner-spotlight, the-interview, reception-table, honeymoon-diary, honeymoon-edit, venue-directory, product-showcase-ad, back-cover

RULE 1: Never place 3+ image-heavy pages in a row without a text-heavy or mixed page between them
RULE 2: Never place 2+ text-heavy pages in a row
RULE 3: Every image-heavy run of 3+ pages MUST be broken by a pull-quote, story-chapter, or feature-minimal
RULE 4: The issue must contain at least one pull-quote, story-chapter, OR feature-minimal as a "breath" page

═══════════════════════════════════════════════════════
VARIANT TEMPLATE SELECTION GUIDE:
- vogue-cover: maximum glamour, full-bleed hero portrait — the default luxury cover
- cover-split: editorial split-panel — use when the issue has strong graphic identity
- cover-typographic: pure type, no photo — use for seasonal special editions ONLY
- season-opener: use as page 2 of a seasonal edition, NOT as the cover
- feature-spread: versatile editorial feature — safe choice for Zone 2
- feature-cinematic: high-drama, Harper's Bazaar register — use for fashion or travel features
- feature-minimal: Kinfolk/Cereal register — use for lifestyle, planning, or softer features
- story-chapter: opens a multi-page narrative arc — place before a real wedding section
- styled-shoot: aspirational image grid — place between fashion and real wedding zones
- behind-scenes: production access — use as a rhythm break after a dense image run
- regional-opener: destination feature opener — place at the START of a travel section
- wedding-gallery: asymmetric real wedding opener — more modern than the-portrait
- couple-gallery: 2×2 mosaic — use when you want a more editorial couple spread
- venue-skyline: spec-forward venue feature — use when the brief mentions a specific venue
- venue-essay: literary venue narrative — use for atmospheric destination features

═══════════════════════════════════════════════════════
COPY RULES:
1. First page MUST be vogue-cover OR cover-split OR cover-typographic
2. Last page MUST ALWAYS be back-cover — no exceptions
3. NEVER repeat the same template_id (every page must be visually different)
4. Headlines: specific, poetic, italic-friendly — "Sunlit Terraces at Dusk" not "Beautiful Venue"
5. Kickers: unique per page — never repeat the same kicker across 2+ pages
6. Body copy: name specific details — fabrics, flowers, time of day, architecture, emotion
7. Think like a real magazine editor: surprise on every turn of the page
8. Return EXACTLY ${pageCount} pages — no more, no less`;
}

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
  const [mood,      setMood]      = useState(MOODS[0]);
  const [generating, setGenerating] = useState(false);
  const [structure,  setStructure]  = useState(null); // parsed AI page plan
  const [error,      setError]      = useState('');
  const [building,   setBuilding]   = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [builtCount,    setBuiltCount]    = useState(0);  // pages added — shown in success state
  const [speechError,   setSpeechError]   = useState('');
  const [listingAssigns, setListingAssigns] = useState({}); // pageIdx → { query, results, loading, assigned }
  const searchTimers = useRef({});

  // ── Listing assignment helpers ──────────────────────────────────────────────
  // Pages with these zones can be backed by a real listing
  function isAssignable(tpl) {
    return tpl && (tpl.zone === 'venue' || tpl.zone === 'story' || tpl.zone === 'feature');
  }

  function getHeroImg(listing) {
    try {
      const items = Array.isArray(listing.media_items)
        ? listing.media_items : JSON.parse(listing.media_items || '[]');
      const feat = items.find(m => m.is_featured && m.type === 'image');
      return feat?.url || items.find(m => m.type === 'image')?.url || null;
    } catch { return null; }
  }

  async function handleListingSearch(idx, query) {
    setListingAssigns(prev => ({
      ...prev,
      [idx]: { ...prev[idx], query, results: [], loading: !!query.trim() },
    }));
    clearTimeout(searchTimers.current[idx]);
    if (!query.trim()) return;
    searchTimers.current[idx] = setTimeout(async () => {
      try {
        const { supabase } = await import('../../../lib/supabaseClient');
        const { data } = await supabase
          .from('listings')
          .select('id, name, listing_type, city, country, media_items, short_description')
          .ilike('name', `%${query}%`)
          .limit(6);
        setListingAssigns(prev => ({
          ...prev,
          [idx]: { ...prev[idx], results: data || [], loading: false },
        }));
      } catch {
        setListingAssigns(prev => ({ ...prev, [idx]: { ...prev[idx], loading: false } }));
      }
    }, 320);
  }

  function assignListing(idx, listing) {
    setListingAssigns(prev => ({
      ...prev,
      [idx]: { query: listing.name, results: [], loading: false, assigned: listing },
    }));
    setStructure(prev => prev.map((p, i) => i === idx ? { ...p, listing_data: listing } : p));
  }

  function clearAssignment(idx) {
    setListingAssigns(prev => ({
      ...prev,
      [idx]: { query: '', results: [], loading: false, assigned: null },
    }));
    setStructure(prev => prev.map((p, i) => i === idx ? { ...p, listing_data: null } : p));
  }

  // Speech-to-text for brief input
  const { listening: micListening, supported: micSupported, toggle: micToggle } = useSpeechInput({
    onResult: (text) => setBrief(prev => prev ? `${prev} ${text}` : text),
    onError:  (err)  => setSpeechError(typeof err === 'string' ? err : 'Microphone unavailable'),
  });

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
      const voiceBlock  = getVoiceInjection();
      const baseSystem  = buildSystemPrompt(mood, pageCount);
      const fullSystem  = voiceBlock
        ? `${baseSystem}\n\n── YOUR TRAINED EDITORIAL VOICE ──\n${voiceBlock}\n──────────────────────────────────\nApply this voice to ALL text fields (kicker, headline, body, byline).`
        : baseSystem;

      const res = await callAiGenerate({
        feature: 'magazine-issue-builder',
        systemPrompt: fullSystem,
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
      setListingAssigns({});
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
    setListingAssigns({});
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
          {!(builtCount > 0 && !building) && <div>

          {/* ── MOOD SELECTOR ── */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
              Issue Mood
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {MOODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => { setMood(m); setStructure(null); }}
                  style={{
                    background: mood.id === m.id ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${mood.id === m.id ? 'rgba(201,168,76,0.5)' : BORDER}`,
                    borderRadius: 4, padding: '9px 12px',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.12s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, lineHeight: 1 }}>{m.icon}</span>
                    <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: mood.id === m.id ? GOLD : 'rgba(255,255,255,0.7)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {m.label}
                    </span>
                  </div>
                  <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, lineHeight: 1.4 }}>
                    {m.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Issue Brief
              </label>
              {micSupported && (
                <button
                  onClick={micToggle}
                  title={micListening ? 'Stop recording' : 'Dictate your brief'}
                  style={{
                    background: micListening ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${micListening ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.15)'}`,
                    borderRadius: 3, padding: '3px 8px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                    color: micListening ? '#f87171' : MUTED,
                    fontFamily: NU, fontSize: 9, fontWeight: 600,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    animation: micListening ? 'aibPulse 1s ease infinite' : 'none',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 11 }}>{micListening ? '⏹' : '🎙'}</span>
                  {micListening ? 'Stop' : 'Speak'}
                </button>
              )}
            </div>
            {speechError && (
              <div style={{ fontFamily: NU, fontSize: 10, color: '#f87171', marginBottom: 6 }}>
                {speechError}
              </div>
            )}
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
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PAGE_COUNTS.map(n => {
                const meta = PAGE_COUNT_META[n];
                const active = pageCount === n;
                return (
                  <button
                    key={n}
                    onClick={() => { setPageCount(n); setStructure(null); }}
                    style={{
                      fontFamily: NU, borderRadius: 3, cursor: 'pointer',
                      background: active ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${active ? 'rgba(201,168,76,0.5)' : BORDER}`,
                      color: active ? GOLD : MUTED,
                      padding: '7px 14px',
                      textAlign: 'left',
                      transition: 'all 0.12s',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1, marginBottom: 2 }}>{n}</div>
                    <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.8 }}>{meta?.label}</div>
                  </button>
                );
              })}
            </div>
            {PAGE_COUNT_META[pageCount] && (
              <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, marginTop: 6, lineHeight: 1.4 }}>
                {PAGE_COUNT_META[pageCount].desc}
              </div>
            )}
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
              <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                Page Structure — {structure.length} pages
              </div>

              {/* Pacing rhythm strip */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontFamily: NU, fontSize: 8, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5, opacity: 0.6 }}>
                  Visual Rhythm
                </div>
                <div style={{ display: 'flex', gap: 3, flexWrap: 'nowrap', alignItems: 'flex-end' }}>
                  {structure.map((p, i) => {
                    const tpl  = VALID_TEMPLATES.find(t => t.id === p.template_id);
                    const vis  = tpl?.visual || 'mixed';
                    const col  = vis === 'image-heavy' ? '#C9A96E'
                               : vis === 'text-heavy'  ? '#64748b'
                               : '#6ee7b7';
                    const h    = vis === 'image-heavy' ? 28
                               : vis === 'text-heavy'  ? 14
                               : 21;
                    return (
                      <div
                        key={i}
                        title={`p${i+1} · ${tpl?.label || p.template_id} · ${vis}`}
                        style={{
                          width: `${Math.floor(100 / structure.length) - 1}%`,
                          maxWidth: 28,
                          height: h,
                          background: col,
                          borderRadius: 2,
                          opacity: 0.75,
                          flexShrink: 0,
                          transition: 'height 0.2s',
                        }}
                      />
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 5 }}>
                  {[['image-heavy', '#C9A96E', 'Image-led'], ['mixed', '#6ee7b7', 'Mixed'], ['text-heavy', '#64748b', 'Text breath']].map(([id, col, lbl]) => (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 8, height: 8, background: col, borderRadius: 1, opacity: 0.75 }} />
                      <span style={{ fontFamily: NU, fontSize: 8, color: MUTED, letterSpacing: '0.04em' }}>{lbl}</span>
                    </div>
                  ))}
                </div>
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

          {/* ── LINK REAL LISTINGS ───────────────────────────────────────────── */}
          {structure && structure.some(p => isAssignable(VALID_TEMPLATES.find(t => t.id === p.template_id))) && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                ✦ Link Real Listings
                <span style={{ fontWeight: 400, fontSize: 8, letterSpacing: '0.05em', color: 'rgba(255,255,255,0.22)', textTransform: 'none' }}>optional — replaces placeholders with real venue imagery</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {structure.map((p, i) => {
                  const tpl = VALID_TEMPLATES.find(t => t.id === p.template_id);
                  if (!isAssignable(tpl)) return null;
                  const a = listingAssigns[i] || {};
                  const heroSrc = a.assigned ? getHeroImg(a.assigned) : null;
                  return (
                    <div key={i} style={{
                      background: a.assigned ? 'rgba(201,168,76,0.06)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${a.assigned ? 'rgba(201,168,76,0.3)' : BORDER}`,
                      borderRadius: 4, padding: '8px 10px',
                    }}>
                      {/* Row header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: a.assigned ? 6 : 6 }}>
                        <span style={{ fontFamily: NU, fontSize: 8, color: MUTED, minWidth: 16 }}>{i + 1}</span>
                        <span style={{ fontFamily: NU, fontSize: 8, fontWeight: 700, color: catColour(tpl.category), letterSpacing: '0.06em', textTransform: 'uppercase', flex: 1 }}>
                          {tpl.label}
                        </span>
                        {a.assigned && (
                          <button onClick={() => clearAssignment(i)} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 11, padding: 0, lineHeight: 1 }}>✕</button>
                        )}
                      </div>

                      {a.assigned ? (
                        /* ── Assigned: show thumbnail + name ── */
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {heroSrc && (
                            <img src={heroSrc} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />
                          )}
                          <div>
                            <div style={{ fontFamily: NU, fontSize: 10, color: '#fff', fontWeight: 600 }}>{a.assigned.name}</div>
                            <div style={{ fontFamily: NU, fontSize: 8, color: MUTED }}>
                              {[a.assigned.city, a.assigned.country].filter(Boolean).join(' · ') || a.assigned.listing_type}
                            </div>
                          </div>
                          <div style={{ marginLeft: 'auto', fontFamily: NU, fontSize: 7, color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase' }}>✦ Linked</div>
                        </div>
                      ) : (
                        /* ── Search input ── */
                        <div style={{ position: 'relative' }}>
                          <input
                            value={a.query || ''}
                            onChange={e => handleListingSearch(i, e.target.value)}
                            placeholder={`Search ${tpl.category.toLowerCase()} listings…`}
                            style={{
                              width: '100%', boxSizing: 'border-box',
                              background: 'rgba(255,255,255,0.05)',
                              border: `1px solid ${BORDER}`, borderRadius: 3,
                              color: '#fff', fontFamily: NU, fontSize: 11,
                              padding: '6px 28px 6px 8px', outline: 'none',
                            }}
                          />
                          <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 9, color: MUTED, pointerEvents: 'none' }}>
                            {a.loading ? '…' : '⌕'}
                          </span>
                          {a.results?.length > 0 && (
                            <div style={{
                              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
                              background: '#1C1610', border: `1px solid ${BORDER}`, borderRadius: 3, marginTop: 2,
                              maxHeight: 180, overflowY: 'auto',
                            }}>
                              {a.results.map(listing => (
                                <button
                                  key={listing.id}
                                  onClick={() => assignListing(i, listing)}
                                  style={{
                                    width: '100%', padding: '7px 10px',
                                    background: 'none', border: 'none',
                                    borderBottom: `1px solid ${BORDER}`,
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    cursor: 'pointer', textAlign: 'left',
                                  }}
                                >
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontFamily: NU, fontSize: 10, color: '#fff' }}>{listing.name}</div>
                                    <div style={{ fontFamily: NU, fontSize: 8, color: MUTED }}>
                                      {[listing.city, listing.country].filter(Boolean).join(' · ') || listing.listing_type || ''}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
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
