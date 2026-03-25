import { useState, useEffect, useRef, createContext, useContext } from "react";
import { getDefaultMode } from "./theme/tokens";
import GCardMobile from "./components/cards/GCardMobile";
import SliderNav from "./components/ui/SliderNav";
import { fetchListingBySlug, fetchListingById } from './services/listings';
import { fetchApprovedReviews } from './services/reviewService';
import { useAdminAuth } from "./context/AdminAuthContext";
import { buildCardImgs, mapMediaItemToGalleryPhoto, buildVenueVideos } from './utils/mediaMappers';
import ReviewSubmitForm from './components/reviews/ReviewSubmitForm';
import VenueEnquiryForm from './components/enquiry/VenueEnquiryForm';
import SeoHead from './components/seo/SeoHead';
import JsonLd from './components/seo/JsonLd';
import { buildVenueSchema, buildBreadcrumbSchema, buildFaqSchema } from './utils/structuredData';
import HomeNav from "./components/nav/HomeNav";
import { useChat } from "./chat/ChatContext";
import { createLead } from "./services/leadEngineService";
import ExternalLinkModal from "./components/ExternalLinkModal";
import { trackExternalClick, hasSeenModalThisSession, markModalSeen } from "./services/outboundClickService";
import { trackProfileView, trackCompareAdd, trackCompareRemove, trackCompareView, trackComparePair, trackEvent } from "./services/userEventService";
import { fetchUpcomingEventsForVenue, formatEventDate, formatEventTime } from './services/eventService';
import ReviewsSection from './components/reviews/ReviewsSection';
import EventDrawer from './components/EventDrawer';
import { ShowcaseAtAGlance, ShowcasePricing, ShowcaseVerified } from './components/showcase';
import { fetchVenueIntelligence } from './services/venueIntelligenceService';

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://www.luxuryweddingdirectory.co.uk';

// Ensures external URLs always have a protocol, without doubling it up
// e.g. "auberge.com/..." → "https://auberge.com/..."
//      "https://auberge.com/..." → "https://auberge.com/..." (unchanged)
const toAbsoluteUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
};

function useIsMobile(bp = 768) {
  const [mobile, setMobile] = useState(() => window.innerWidth <= bp);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${bp}px)`);
    const fn = (e) => setMobile(e.matches);
    mql.addEventListener("change", fn);
    return () => mql.removeEventListener("change", fn);
  }, [bp]);
  return mobile;
}

// ─── DESIGN SYSTEM ────────────────────────────────────────────────────────────
const LIGHT = {
  bg:         "#ffffff",
  bgAlt:      "#f7f7f5",
  surface:    "#ffffff",
  border:     "#ebebeb",
  border2:    "#d8d8d8",
  gold:       "#9d873e",
  goldLight:  "rgba(157,135,62,0.07)",
  goldBorder: "rgba(157,135,62,0.2)",
  green:      "#748172",
  greenLight: "rgba(116,129,114,0.07)",
  text:       "#1a1a18",
  textMid:    "#4a4844",
  textLight:  "#6b6560",
  textMuted:  "#9c9690",
  navBg:      "rgba(255,255,255,0.96)",
  shadow:     "0 2px 16px rgba(0,0,0,0.05)",
  shadowMd:   "0 8px 40px rgba(0,0,0,0.08)",
  shadowLg:   "0 24px 64px rgba(0,0,0,0.1)",
};
const DARK = {
  bg:         "#0f0f0d",
  bgAlt:      "#141412",
  surface:    "#1a1a18",
  border:     "#2e2e2a",
  border2:    "#3c3c38",
  gold:       "#b8a05a",
  goldLight:  "rgba(184,160,90,0.1)",
  goldBorder: "rgba(184,160,90,0.25)",
  green:      "#8fa08c",
  greenLight: "rgba(143,160,140,0.1)",
  text:       "#f5f2ec",
  textMid:    "#c8c4bc",
  textLight:  "#9c9890",
  textMuted:  "#6b6860",
  navBg:      "rgba(15,15,13,0.94)",
  shadow:     "0 2px 16px rgba(0,0,0,0.4)",
  shadowMd:   "0 8px 40px rgba(0,0,0,0.5)",
  shadowLg:   "0 24px 64px rgba(0,0,0,0.6)",
};
const Theme = createContext(LIGHT);
const useT = () => useContext(Theme);
// Font stacks, resolved via CSS custom properties set by ThemeLoader
const FD = "var(--font-heading-primary)"; // display
const FB = "var(--font-body)";            // body

// ─── COUNTRY → FLAG LOOKUP ────────────────────────────────────────────────────
const COUNTRY_FLAG = {
  'Italy': '🇮🇹', 'Austria': '🇦🇹', 'France': '🇫🇷', 'Spain': '🇪🇸',
  'Portugal': '🇵🇹', 'Greece': '🇬🇷', 'United Kingdom': '🇬🇧', 'UK': '🇬🇧',
  'United States': '🇺🇸', 'USA': '🇺🇸', 'Switzerland': '🇨🇭', 'Germany': '🇩🇪',
  'Croatia': '🇭🇷', 'Mexico': '🇲🇽', 'Maldives': '🇲🇻', 'Turkey': '🇹🇷',
  'Cyprus': '🇨🇾', 'Morocco': '🇲🇦', 'South Africa': '🇿🇦', 'Thailand': '🇹🇭',
  'Bali': '🇮🇩', 'Indonesia': '🇮🇩', 'Ireland': '🇮🇪', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
};

// ─── PRICE FORMATTER ──────────────────────────────────────────────────────────
const fmtPrice = (amount, currency) => {
  if (!amount && amount !== 0) return '';
  const sym = currency || '';
  const num = Number(amount);
  if (isNaN(num)) return `${sym}${amount}`;
  return `${sym}${num.toLocaleString()}`;
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const VENUE = {
  // ── MINIMAL FALLBACK: ID ONLY ──
  // All other fields MUST come from database. Do not add venue-specific defaults.
  id: 1,
  name: null,
  tagline: null,
  location: null,
  country: null,
  flag: null,
  rating: null,
  reviews: null,
  responseTime: null,
  responseRate: null,
  established: null,
  weddingsHosted: null,
  priceFrom: null,
  capacity: null,
  verified: null,
  featured: null,
  accommodation: {
    type: null,
    totalRooms: null,
    totalSuites: null,
    maxOvernightGuests: null,
    exclusiveUse: null,
    minNightStay: null,
    description: null,
    images: [],
  },
  dining: {
    style: null,
    chefName: null,
    inHouseCatering: null,
    externalCateringAllowed: null,
    menuStyles: [],
    dietaryOptions: [],
    drinksOptions: [],
    description: null,
    menuImages: [],
  },
  venueType: {
    primaryType: null,
    styles: [],
    architecture: null,
    built: null,
    description: null,
    features: [],
  },
  categories: [],
  awards: [],
  press: [],
  imgs: [],
  gallery: [],
  videos: [],
  // ── Engagement data is removed from fallback. Load from database only. ──
  engagement: {
    photos: {},
    videos: {},
  },
  // ── Notices: Load from database only. Do not provide hardcoded fallbacks. ──
  notices: [],
  exclusiveUse: {
    enabled: false,
    title: null,
    subtitle: null,
    from: null,
    subline: null,
    description: null,
    ctaText: null,
    includes: [],
    minNights: null,
  },
  catering: {
    enabled: true,
    cards: [
      {
        id: 'c1',
        icon: 'dining',
        title: 'In-house catering',
        description: 'Our culinary team sources produce from the estate and surrounding farms. Seasonal menus designed around your wedding day.',
        subtext: '',
        sortOrder: 0,
      },
      {
        id: 'c2',
        icon: 'cooking',
        title: 'External caterers',
        description: 'External caterers welcome. Corkage fee £18 per bottle.',
        subtext: '',
        sortOrder: 1,
      },
      {
        id: 'c3',
        icon: 'wine',
        title: 'Sommelier service',
        description: 'Our sommelier will curate a bespoke wine journey from our private cellar. Private cellar with over 800 labels.',
        subtext: '',
        sortOrder: 2,
      },
    ],
    styles: ["Fine dining", "Banquet", "Family style", "Food stations", "Late-night snacks"],
    dietary: ["Vegan", "Vegetarian", "Halal", "Kosher", "Gluten-free"],
  },
  // ── Spaces: Load from database only. Hardcoded spaces (Grand Salon, Cypress Garden, etc.) removed. ──
  spaces: [],
  experiences: [
    { id: "e1", label: "Private wine cellar tasting",       category: "estate", kind: "wine",    isIncluded: true, season: "all-year" },
    { id: "e2", label: "Full spa and wellness suite",        category: "estate", kind: "spa",     isIncluded: true, season: "all-year" },
    { id: "e3", label: "Heated infinity pool and sun terrace", category: "estate", kind: "pool",  isIncluded: true, season: "summer" },
    { id: "e4", label: "Tuscan cooking class with our chef", category: "estate", kind: "cooking", isPrivate: true, season: "all-year" },
    { id: "e5", label: "Vintage Alfa Romeo estate collection", category: "estate", kind: "car",  isPrivate: true },
    { id: "e6", label: "Olive oil and truffle estate tour",  category: "estate", kind: "truffle", season: "autumn" },
    { id: "e7", label: "Antinori vineyard tours",            category: "nearby", kind: "vineyard", distanceMinutes: 12 },
    { id: "e8", label: "Private Florence gallery experience", category: "nearby", kind: "museum",  distanceMinutes: 30 },
    { id: "e9", label: "Golf Club Ugolino",                  category: "nearby", kind: "golf",    distanceMinutes: 15 },
    { id: "e10", label: "Truffle hunting with local guide",  category: "nearby", kind: "truffle", distanceMinutes: 20 },
    { id: "e11", label: "Arno river private boat",           category: "nearby", kind: "boat",   distanceMinutes: 35 },
    { id: "e12", label: "Private Uffizi after-hours visit",  category: "nearby", kind: "culture", distanceMinutes: 30 },
  ],
  access: {
    helicopterTransferAvailable: false,
    helicopterTransferMinutesFromAirport: null,
    airports: [],
    primaryAirport: null,
  },
  // ── Testimonials: Load from database only. Do not provide hardcoded fallbacks. ──
  testimonials: [],
  // ── Similar Venues: Load from database only. Do not provide hardcoded fallbacks. ──
  similar: [],
  contact: {
    address: {
      line1: null,
      city: null,
      region: null,
      postcode: null,
      country: null,
      latitude: null,
      longitude: null,
    },
    phone: null,
    email: null,
    website: null,
    responseMetrics: {
      averageResponseHours: null,
      responseRatePercent: null,
      sameDayTypical: null,
    },
  },
  video: {
    type: null,
    heroId: null,
    filmId: null,
  },
  // ── Owner: Load from database only. Do not provide hardcoded fallbacks (Isabella Rosanova removed). ──
  owner: {
    name: null,
    title: null,
    photo: null,
    bio: null,
    memberSince: null,
  },
  // ── Wedding Weekend: Load from database only. Hardcoded Villa descriptions removed. ──
  weddingWeekend: {
    enabled: false,
    subtitle: null,
    days: [],
  },
  estateEnabled: false,
  nearbyEnabled: false,
  // ── FAQ: Load from database only. All hardcoded Villa Rosanova FAQs removed. ──
  faq: {
    enabled: false,
    title: null,
    subtitle: null,
    ctaEnabled: false,
    ctaHeadline: null,
    ctaSubtext: null,
    ctaButtonText: null,
    categories: [],
  },
  similarVenuesEnabled: true,
  recentlyViewedEnabled: true,
};

// ─── COMPUTED BACKWARD-COMPAT FIELDS ─────────────────────────────────────────
// These derive from structured data so older references (sidebar, chat, etc.) keep working.
VENUE.responseTime = VENUE.contact.responseMetrics.averageResponseHours
  ? `${VENUE.contact.responseMetrics.averageResponseHours} hrs`
  : null;
VENUE.responseRate = VENUE.contact.responseMetrics.responseRatePercent;
VENUE.contact.mapQuery = `${VENUE.contact.address.city},+${VENUE.contact.address.region},+${VENUE.contact.address.country}`.replace(/ /g, "+");
VENUE.contact.addressFormatted = [
  VENUE.contact.address.line1,
  VENUE.contact.address.city,
  `${VENUE.contact.address.postcode} ${VENUE.contact.address.region}`,
  VENUE.contact.address.country,
].join(", ");

// ─── RECENTLY VIEWED, localStorage helpers ────────────────────────────────────
const RV_KEY = 'ldw_recently_viewed';
const MAX_RV_STORED = 6;

function getRVList() {
  try { return JSON.parse(localStorage.getItem(RV_KEY) || '[]'); } catch { return []; }
}

function recordVenueView(v, slug) {
  try {
    // Extract gallery photo or first image
    let img = '';
    if (v.imgs && Array.isArray(v.imgs) && v.imgs.length > 0) {
      img = v.imgs[0];
    } else if (v.gallery && typeof v.gallery === 'object') {
      // If gallery is an object (from DB), extract src from first item
      if (Array.isArray(v.gallery) && v.gallery.length > 0) {
        img = v.gallery[0].src || v.gallery[0];
      } else if (v.gallery.src) {
        img = v.gallery.src;
      }
    }

    const entry = {
      id: v.id,
      name: v.name,
      location: v.location,
      rating: v.rating,
      price: v.priceFrom,
      currency: v.priceCurrency || '£',
      img: img,
      slug: slug,
      viewedAt: Date.now(),
    };
    const updated = [entry, ...getRVList().filter(x => x.id !== entry.id)].slice(0, MAX_RV_STORED);
    localStorage.setItem(RV_KEY, JSON.stringify(updated));
  } catch { /* localStorage unavailable */ }
}

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
function GlobalStyles() {
  return (
    <style>{`
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html { scroll-behavior: smooth; scrollbar-gutter: stable; }
      body { font-family: ${FB}; -webkit-font-smoothing: antialiased; }
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(157,135,62,0.3); border-radius: 3px; }
      @keyframes fadeUp      { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
      @keyframes fadeIn      { from { opacity:0; } to { opacity:1; } }
      @keyframes shimmer     { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      @keyframes slideUp     { from { transform:translateY(100%); opacity:0; } to { transform:translateY(0); opacity:1; } }
      @keyframes kenBurns    { 0%{transform:scale(1)} 100%{transform:scale(1.06)} }
      @keyframes pulse       { 0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,0.5)} 50%{box-shadow:0 0 0 5px rgba(74,222,128,0)} }
      @keyframes chatModalIn { from { opacity:0; transform:translate(-50%,-50%) scale(0.93); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }
      @keyframes dotPulse    { 0%,80%,100% { transform:scale(0); opacity:0.4; } 40% { transform:scale(1); opacity:1; } }
      @keyframes lightbox-progress { from { width:0 } to { width:100% } }
      .lwd-thumb-strip::-webkit-scrollbar { display:none; }
      @keyframes barPulse    { 0%,100% { box-shadow:0 4px 32px rgba(0,0,0,0.08),0 0 0 1px rgba(201,168,76,0.18); } 50% { box-shadow:0 6px 40px rgba(201,168,76,0.15),0 0 0 1.5px rgba(201,168,76,0.38); } }
      @keyframes lwd-modal-in { from { opacity:0; transform:translateY(18px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
      .lwd-aura-bar { bottom: 28px !important; }
      @media (max-width: 900px) { .lwd-aura-bar { bottom: 80px !important; } }
      .lwd-img-zoom { transition: transform 0.7s ease; }
      .lwd-img-zoom:hover { transform: scale(1.04); }
      *:hover > .lwd-tag-overlay { opacity: 1 !important; }
      .lwd-fade-up { animation: fadeUp 0.6s ease both; }
      @media (max-width: 900px) { .lwd-sidebar { display: none !important; } .lwd-mobile-bar { display: flex !important; } }
      @media (min-width: 901px) { .lwd-mobile-bar { display: none !important; } }
    `}</style>
  );
}

// ─── EXPERIENCE TAXONOMY ────────────────────────────────────────────────────
const EXPERIENCE_KINDS = Object.freeze([
  "vineyard", "wine", "truffle", "cooking", "dining", "spa", "pool", "golf",
  "boat", "beach", "mountain", "museum", "culture", "tour", "helicopter",
  "airport", "car", "wellness", "nature", "hiking", "safari", "ski", "island", "rail",
]);
const EXPERIENCE_KIND_SET = new Set(EXPERIENCE_KINDS);

// ─── ICON MAP (SVG paths, stroke-based, 24×24 viewBox) ─────────────────────
const ICON_PATHS = Object.freeze({
  vineyard:   "M12 2C12 2 7 8 7 13a5 5 0 0010 0c0-5-5-11-5-11zM12 22v-6",
  wine:       "M8 2h8l-1 8a5 5 0 01-6 0L8 2zM12 14v8M8 22h8M12 10v0",
  truffle:    "M12 6a6 6 0 100 12 6 6 0 000-12zM9 10.5a1.5 1.5 0 110 .01M15 10.5a1.5 1.5 0 110 .01M11 14a1 1 0 110 .01M12 2v4",
  cooking:    "M12 2v4M6 6h12v3a6 6 0 01-12 0V6zM12 15v5M8 22h8M4 6h16",
  dining:     "M3 6h18M7 6v-2a2 2 0 014 0v2M13 6v-2a2 2 0 014 0v2M5 6l1 14a2 2 0 002 2h8a2 2 0 002-2l1-14",
  spa:        "M12 8c-3 0-6 2-6 6v2h12v-2c0-4-3-6-6-6zM12 2v2M8 4l1 2M16 4l-1 2M6 18c0 2 2.7 4 6 4s6-2 6-4",
  pool:       "M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 7c2-2 4-2 6 0s4 2 6 0 4-2 6 0",
  golf:       "M12 2v14M12 16a4 4 0 01-4 4h8a4 4 0 01-4-4zM12 6l6-2",
  boat:       "M2 16l2-2h16l2 2M4 14V8l4-4h8l4 4v6M2 20c2-2 4-2 6 0s4 2 6 0 4-2 6 0",
  beach:      "M2 20h20M6 20v-4M18 20v-4M6 16h12M9 8a3 3 0 106 0M12 2v3",
  mountain:   "M2 20L8 8l4 6 4-6 6 12H2z",
  museum:     "M3 21h18M5 21V10M19 21V10M3 10l9-7 9 7M9 21v-5h6v5",
  culture:    "M4 20h16M12 4v2M7 9a5 5 0 0010 0M5 14h14M8 14v6M16 14v6",
  tour:       "M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zM12 12a3 3 0 110-6 3 3 0 010 6z",
  helicopter: "M12 14l-4 6h8l-4-6zM2 6h20M12 6v8M7 2v8M17 2v8",
  airport:    "M12 2L2 8h20L12 2zM4 8v8h16V8M8 16v4M16 16v4M2 22h20",
  car:        "M3 14h18v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zM5 14l2-6h10l2 6M6.5 17.5a1 1 0 110-2 1 1 0 010 2zM17.5 17.5a1 1 0 110-2 1 1 0 010 2z",
  wellness:   "M12 2a4 4 0 014 4c0 2-2 6-4 6s-4-4-4-6a4 4 0 014-4zM12 12c-4 0-8 2-8 6v2h16v-2c0-4-4-6-8-6z",
  nature:     "M12 2l-2 6h4l-2-6zM12 8c-5 0-8 3-8 7h16c0-4-3-7-8-7zM12 15c-6 0-10 2-10 5h20c0-3-4-5-10-5zM12 20v2",
  hiking:     "M13 4a2 2 0 110-4 2 2 0 010 4zM10 8l-4 8h3l2 6h4l2-6h3l-4-8h-6z",
  safari:     "M12 2c-4 0-8 3.6-8 8s8 12 8 12 8-7.6 8-12-4-8-8-8zM9 9h0M15 9h0M9 13c1.5 2 4.5 2 6 0",
  ski:        "M2 20l6-6M10 14l8-8M14 4l4 4M12 2l-2 6h4l-2-6z",
  island:     "M2 16c3-4 6-6 10-6s7 2 10 6M7 16c1-2 2-6 5-6s4 4 5 6M12 10V6M10 6h4",
  rail:       "M5 4h14v12a2 2 0 01-2 2H7a2 2 0 01-2-2V4zM5 4a2 2 0 012-2h10a2 2 0 012 2M8 20l-2 2M16 20l2 2M5 12h14M8.5 15.5a1 1 0 110-2M15.5 15.5a1 1 0 110-2",
  // ── Utility icons (for Contact, Access, UI) ──
  pin:        "M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zM12 12a3 3 0 110-6 3 3 0 010 6z",
  phone:      "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z",
  email:      "M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zM22 6l-10 7L2 6",
  globe:      "M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2a15 15 0 014 10 15 15 0 01-4 10 15 15 0 01-4-10A15 15 0 0112 2z",
  clock:      "M12 2a10 10 0 100 20 10 10 0 000-20zM12 6v6l4 2",
  check:      "M20 6L9 17l-5-5",
  zap:        "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
});

function Icon({ name, size = 18, color, style: extraStyle }) {
  const C = useT();
  const d = ICON_PATHS[name];
  if (!d) {
    if (typeof window !== "undefined" && window.__LWD_DEV) console.warn(`[LWD] Unknown icon: "${name}"`);
    return null;
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || C.textMid}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, display: "inline-block", verticalAlign: "middle", ...extraStyle }}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

// ─── STARS ───────────────────────────────────────────────────────────────────
function Stars({ rating, size = 13 }) {
  const C = useT();
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: size, color: i <= Math.floor(rating) ? C.gold : i - 0.5 <= rating ? C.gold : C.border2 }}>★</span>
      ))}
    </span>
  );
}

// ─── SECTION HEADING ─────────────────────────────────────────────────────────
function SectionHeading({ title, subtitle }) {
  const C = useT();
  return (
    <div style={{ marginBottom: 40, textAlign: 'left', width: '100%' }}>
      <h2 style={{ fontFamily: FD, fontSize: 34, fontWeight: 400, color: C.text, letterSpacing: "-0.4px", lineHeight: 1.1, marginBottom: 12 }}>{title}</h2>
      <div style={{ width: 48, height: 2, backgroundImage: `linear-gradient(90deg, ${C.gold}, ${C.green})` }} />
      {subtitle && <p style={{ fontFamily: FB, fontSize: 14, color: C.textMuted, marginTop: 12, lineHeight: 1.65, letterSpacing: '0.1px' }}>{subtitle}</p>}
    </div>
  );
}

// ─── PILL / BADGE ─────────────────────────────────────────────────────────────
function Pill({ children, color }) {
  const C = useT();
  const clr = color === "gold" ? C.gold : color === "green" ? C.green : C.textLight;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", border: `1px solid ${clr}22`, background: `${clr}10`, color: clr, fontFamily: FB, fontSize: 11, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" }}>
      {children}
    </span>
  );
}

// ─── NAV ─────────────────────────────────────────────────────────────────────
function Nav({ venue, darkMode, setDarkMode, saved, setSaved, compareList, onAddCompare, onBack }) {
  const C = useT();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // ── colour tokens that change based on scroll + theme ──
  const navBg     = scrolled ? C.navBg    : "transparent";
  const navBorder = scrolled ? (darkMode ? `1px solid ${C.goldBorder}` : `1px solid ${C.border}`) : "none";
  const logoColor = scrolled ? C.gold     : "#ffffff";
  const wordColor = scrolled ? C.textMuted : "rgba(255,255,255,0.45)";
  const crumbColor = scrolled ? C.textMuted : "rgba(255,255,255,0.5)";
  const crumbActive = scrolled ? C.gold   : "rgba(255,255,255,0.9)";
  const btnBorder = (active) => active
    ? C.gold
    : scrolled ? C.border2 : "rgba(255,255,255,0.28)";
  const btnColor  = (active) => active
    ? C.gold
    : scrolled ? C.textMid : "rgba(255,255,255,0.82)";
  const btnBg     = (active) => active ? C.goldLight : "transparent";

  return (
    <nav className="vp-nav" style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
      background: navBg,
      backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
      borderBottom: navBorder,
      padding: "0 40px", height: 72,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      transition: "background 0.35s ease, border-color 0.35s ease",
    }}>

      {/* ── Logo + breadcrumb ── */}
      <div className="vp-nav-left" style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {/* Wordmark */}
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <div style={{
            fontFamily: FD, fontSize: 21, fontWeight: 400,
            color: logoColor, letterSpacing: "2.5px",
            lineHeight: 1, transition: "color 0.35s",
          }}>
            LUXURY WEDDING DIRECTORY
          </div>
          <div style={{
            width: "100%", height: 1,
            background: scrolled
              ? `linear-gradient(90deg, ${C.gold}, ${C.green})`
              : "rgba(255,255,255,0.22)",
            transition: "opacity 0.35s",
          }} />
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: scrolled ? C.border : "rgba(255,255,255,0.2)" }} />

        {/* Breadcrumb */}
        <div className="vp-breadcrumb" style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FB, fontSize: 12, letterSpacing: "0.2px" }}>
          {["Venues", venue.country, venue.location?.split(', ').pop()].filter(Boolean).map((crumb) => (
            <span key={crumb} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{ color: crumbColor, cursor: "pointer", transition: "color 0.2s" }}
                onClick={crumb === "Venues" && onBack ? onBack : undefined}
                onMouseEnter={e => e.currentTarget.style.color = crumbActive}
                onMouseLeave={e => e.currentTarget.style.color = crumbColor}
              >{crumb}</span>
              <span style={{ color: scrolled ? C.border2 : "rgba(255,255,255,0.25)", fontSize: 10 }}>›</span>
            </span>
          ))}
          <span style={{ color: crumbActive, fontWeight: 600 }}>{venue.name}</span>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="vp-nav-actions" style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {[
          { label: saved ? "♥  Saved" : "♡  Save",  action: () => setSaved(s => !s), active: saved },
          { label: "⊕  Compare", action: onAddCompare,   active: compareList.length > 0 },
          { label: "↗  Share",   action: () => {},        active: false },
        ].map(btn => (
          <button key={btn.label} onClick={btn.action}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = btnBorder(btn.active); e.currentTarget.style.color = btnColor(btn.active); }}
            style={{
              padding: "8px 16px", fontFamily: FB, fontSize: 11, fontWeight: 700, letterSpacing: "0.6px",
              textTransform: "uppercase",
              background: btnBg(btn.active),
              border: `1px solid ${btnBorder(btn.active)}`,
              borderRadius: "var(--lwd-radius-input)",
              color: btnColor(btn.active),
              cursor: "pointer", transition: "all 0.2s",
            }}>{btn.label}
          </button>
        ))}

        {/* Dark / light toggle */}
        <button onClick={() => setDarkMode(d => !d)}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = scrolled ? C.border2 : "rgba(255,255,255,0.28)"; e.currentTarget.style.color = scrolled ? C.textMid : "rgba(255,255,255,0.82)"; }}
          style={{
            width: 38, height: 38, marginLeft: 4,
            border: `1px solid ${scrolled ? C.border2 : "rgba(255,255,255,0.28)"}`,
            borderRadius: "var(--lwd-radius-input)",
            background: "none", color: scrolled ? C.textMid : "rgba(255,255,255,0.82)",
            fontSize: 16, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}>{darkMode ? "☀" : "☽"}
        </button>
      </div>
    </nav>
  );
}

// ─── HERO SLIDER (shared) ────────────────────────────────────────────────────
function HeroSlider({ imgs, height, children }) {
  const C = useT();
  const [idx, setIdx] = useState(0);
  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    if (hovered) return;
    const t = setInterval(() => setIdx(i => (i + 1) % imgs.length), 5000);
    return () => clearInterval(t);
  }, [hovered, imgs.length]);
  return (
    <div style={{ position: "relative", height, overflow: "hidden" }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {imgs.map((img, i) => (
        <div key={i} style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${img})`,
          backgroundSize: "cover", backgroundPosition: "center",
          opacity: i === idx ? 1 : 0,
          animation: i === idx ? "kenBurns 8s ease forwards" : "none",
          transition: "opacity 1.2s ease",
        }} />
      ))}
      {children}
      {/* Arrows */}
      {[{ dir: "←", l: 16, r: "auto" }, { dir: "→", l: "auto", r: 16 }].map(a => (
        <button key={a.dir}
          onClick={() => setIdx(i => a.dir === "←" ? (i - 1 + imgs.length) % imgs.length : (i + 1) % imgs.length)}
          style={{
            position: "absolute", top: "50%", left: a.l, right: a.r,
            transform: "translateY(-50%)", width: 40, height: 40,
            border: "1px solid rgba(255,255,255,0.4)", borderRadius: "var(--lwd-radius-input)",
            background: "rgba(0,0,0,0.22)",
            backdropFilter: "blur(8px)", color: "#fff", fontSize: 16, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{a.dir}</button>
      ))}
      {/* Dots — max 3 shown: prev · active · next */}
      {imgs.length > 1 && (
        <div style={{ position: "absolute", bottom: 16, right: 40, display: "flex", gap: 5, alignItems: "center" }}>
          {[
            (idx - 1 + imgs.length) % imgs.length,
            idx,
            (idx + 1) % imgs.length,
          ].filter((v, i, a) => imgs.length >= 3 || a.indexOf(v) === i).map((dotIdx, i) => (
            <button key={dotIdx} onClick={() => setIdx(dotIdx)} style={{
              width: dotIdx === idx ? 20 : 6, height: 6, border: "none", cursor: "pointer",
              background: dotIdx === idx ? C.gold : "rgba(255,255,255,0.5)",
              transition: "all 0.3s ease",
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── HERO STYLE 1: CINEMATIC ─────────────────────────────────────────────────
function HeroCinematic({ venue, onEnquire, onBack }) {
  const C = useT();
  const isMobile = useIsMobile();
  return (
    <div style={{ position: "relative" }}>
      <HeroSlider imgs={venue.imgs} height="62vh">
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.75) 100%)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 40px 52px", animation: "fadeUp 0.8s ease both" }}>
          {venue.featured && (
            <div style={{ display: "inline-flex", marginBottom: 12, padding: "4px 12px", border: `1px solid ${C.gold}`, background: "rgba(157,135,62,0.18)" }}>
              <span style={{ fontFamily: FB, fontSize: 10, color: "#fff", letterSpacing: "1.5px", fontWeight: 700, textTransform: "uppercase" }}>✦ Editor's Pick</span>
            </div>
          )}
          <h1 style={{ fontFamily: FD, fontSize: "clamp(38px, 5.3vw, 68px)", fontWeight: 400, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1.05, marginBottom: 10 }}>{venue.name}</h1>
          {venue.tagline && (
            <p style={{ fontFamily: FB, fontSize: "clamp(13px, 1.4vw, 16px)", color: "rgba(255,255,255,0.72)", lineHeight: 1.6, marginBottom: 14, maxWidth: 560, letterSpacing: "0.1px" }}>{venue.tagline}</p>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 22 }}>
            <span style={{ fontFamily: FB, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{venue.flag} {venue.location}</span>
            {(venue.rating > 0 || venue.verified) && <span style={{ width: 1, height: 12, background: "rgba(255,255,255,0.3)" }} />}
            {venue.rating != null && venue.rating > 0 && <><Stars rating={venue.rating} size={13} />
            <span style={{ fontFamily: FB, fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>{venue.rating}</span>
            {venue.reviews != null && <span style={{ fontFamily: FB, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>({venue.reviews} reviews)</span>}</> }
            {venue.verified && <span style={{ fontFamily: FB, fontSize: 11, color: "#4ade80", fontWeight: 700 }}>✓ LWD Verified</span>}
          </div>
          {/* Urgency signal — social proof before the CTA */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 11px",
              background: "rgba(0,0,0,0.32)", backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.13)",
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%", background: "#4ade80", flexShrink: 0,
                boxShadow: "0 0 0 0 rgba(74,222,128,0.7)",
                animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
              }} />
              <span style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.82)", letterSpacing: "0.35px" }}>
                {venue.weddingsHosted
                  ? `${venue.weddingsHosted}+ weddings hosted · Popular this season`
                  : 'Popular this season · Limited peak dates remaining'}
              </span>
            </span>
          </div>

          {/* Hero CTA */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={onEnquire} style={{
              padding: "14px 28px", background: C.gold, border: "none", borderRadius: "var(--lwd-radius-input)",
              color: "#0f0d0a", fontFamily: FB, fontSize: 13, fontWeight: 800,
              letterSpacing: "1.2px", textTransform: "uppercase", cursor: "pointer",
              transition: "opacity 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >Begin Your Enquiry →</button>
            {venue.showcaseUrl && (
              <a href={venue.showcaseUrl}
                onClick={e => { e.preventDefault(); window.history.pushState(null, "", venue.showcaseUrl); window.dispatchEvent(new PopStateEvent('popstate')); }}
                style={{
                padding: "13px 22px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.45)",
                borderRadius: "var(--lwd-radius-input)",
                color: "rgba(255,255,255,0.9)",
                fontFamily: FB, fontSize: 13, fontWeight: 700,
                letterSpacing: "1px", textTransform: "uppercase",
                textDecoration: "none",
                display: "inline-flex", alignItems: "center", gap: 6,
                transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.75)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.45)"; }}
              >✦ Showcase</a>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {venue.priceFrom && (
                <span style={{ fontFamily: FD, fontSize: isMobile ? 20 : 26, fontWeight: 400, color: "#fff", lineHeight: 1 }}>
                  From {fmtPrice(venue.priceFrom, venue.priceCurrency)}
                </span>
              )}
              {venue.priceFrom && venue.responseTime && (
                <span style={{ width: 1, height: 11, background: "rgba(255,255,255,0.2)", display: "inline-block" }} />
              )}
              {venue.responseTime && (
                <span style={{ fontFamily: FB, fontSize: 12, color: "rgba(255,255,255,0.6)", letterSpacing: "0.2px" }}>
                  Replies in {venue.responseTime}
                </span>
              )}
            </div>
          </div>

        </div>
        {/* Breadcrumb — absolutely pinned to bottom-left, same row as slider dots */}
        <div style={{ position: "absolute", bottom: 16, left: 40, display: "flex", alignItems: "center", gap: 6, fontFamily: FB, fontSize: 11, letterSpacing: "0.3px" }}>
          {["Venues", venue.country, venue.location?.split(', ').pop()].filter(Boolean).map((crumb) => (
            <span key={crumb} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{ color: "rgba(255,255,255,0.55)", cursor: crumb === "Venues" ? "pointer" : "default", transition: "color 0.2s" }}
                onClick={crumb === "Venues" && onBack ? onBack : undefined}
                onMouseEnter={e => { if (crumb === "Venues") e.currentTarget.style.color = "rgba(255,255,255,0.9)"; }}
                onMouseLeave={e => { if (crumb === "Venues") e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
              >{crumb}</span>
              <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 10 }}>›</span>
            </span>
          ))}
          <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>{venue.name}</span>
        </div>
      </HeroSlider>
    </div>
  );
}

// ─── HERO STYLE 2: EDITORIAL SPLIT ───────────────────────────────────────────
function HeroSplit({ venue, onEnquire }) {
  const C = useT();
  const isMobile = useIsMobile();
  return (
    <div className="vp-hero-grid" style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "58% 42%",
      height: isMobile ? "auto" : "62vh",
      marginTop: 64,
    }}>
      {/* Image, top on mobile, left on desktop */}
      <HeroSlider imgs={venue.imgs} height={isMobile ? "44vh" : "100%"}>
        {venue.featured && (
          <div style={{ position: "absolute", top: 20, left: 20, display: "inline-flex", padding: "4px 12px", border: `1px solid ${C.gold}`, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)" }}>
            <span style={{ fontFamily: FB, fontSize: 10, color: "#fff", letterSpacing: "1.5px", fontWeight: 700, textTransform: "uppercase" }}>✦ Editor's Pick</span>
          </div>
        )}
      </HeroSlider>
      {/* Info, below on mobile, right on desktop */}
      <div style={{
        background: C.surface,
        borderLeft: isMobile ? "none" : `1px solid ${C.border}`,
        borderTop: isMobile ? `1px solid ${C.border}` : "none",
        padding: isMobile ? "24px 20px 28px" : "40px 44px",
        display: "flex", flexDirection: "column", justifyContent: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: isMobile ? 14 : 20, flexWrap: "wrap" }}>
          {venue.categories.map(cat => <Pill key={cat} color="gold">{cat}</Pill>)}
        </div>
        <h1 style={{ fontFamily: FD, fontSize: isMobile ? 32 : "clamp(30px, 3.5vw, 52px)", fontWeight: 400, color: C.text, lineHeight: 1.05, marginBottom: 8 }}>{venue.name}</h1>
        <p style={{ fontFamily: FB, fontSize: 13, color: C.textLight, marginBottom: isMobile ? 14 : 20, lineHeight: 1.6 }}>{venue.flag} {venue.location}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: isMobile ? 16 : 24, flexWrap: "wrap" }}>
          {venue.rating != null && venue.rating > 0 && <><Stars rating={venue.rating} size={14} />
          <span style={{ fontFamily: FB, fontSize: 14, fontWeight: 700, color: C.text }}>{venue.rating}</span>
          {venue.reviews != null && <span style={{ fontFamily: FB, fontSize: 13, color: C.textLight }}>· {venue.reviews} reviews</span>}</> }
          {venue.verified && <span style={{ fontFamily: FB, fontSize: 11, color: C.green, fontWeight: 700 }}>✓ Verified</span>}
        </div>
        <div style={{ height: 1, background: C.border, marginBottom: isMobile ? 16 : 24 }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMobile ? 16 : 24, gap: 12, flexWrap: isMobile ? "wrap" : "nowrap" }}>
          {venue.priceFrom && (
            <div>
              <div style={{ fontFamily: FD, fontSize: isMobile ? 24 : 28, color: C.gold }}>From {fmtPrice(venue.priceFrom, venue.priceCurrency)}</div>
              <div style={{ fontFamily: FB, fontSize: 12, color: C.textMuted, marginTop: 2 }}>per event · up to {venue.capacity.ceremony} guests</div>
            </div>
          )}
          {venue.responseTime && (
            <div style={{ fontFamily: FB, fontSize: 12, color: C.green, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}><Icon name="zap" size={13} color={C.green} /> Replies in {venue.responseTime}</div>
          )}
        </div>
        <button onClick={onEnquire} style={{ width: "100%", padding: isMobile ? "13px" : "14px", background: C.gold, border: "none", borderRadius: "var(--lwd-radius-input)", color: "#0f0d0a", fontFamily: FB, fontSize: 13, fontWeight: 800, letterSpacing: "1.2px", textTransform: "uppercase", cursor: "pointer", transition: "opacity 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
          Begin Your Enquiry →
        </button>
        {venue.showcaseUrl && (
          <a href={venue.showcaseUrl}
            onClick={e => { e.preventDefault(); window.history.pushState(null, "", venue.showcaseUrl); window.dispatchEvent(new PopStateEvent('popstate')); }}
            style={{
            display: "block", textAlign: "center", marginTop: 10,
            padding: "11px", border: `1px solid ${C.border2}`,
            borderRadius: "var(--lwd-radius-input)",
            color: C.textMid, fontFamily: FB, fontSize: 12, fontWeight: 700,
            letterSpacing: "0.8px", textTransform: "uppercase",
            textDecoration: "none", transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.color = C.textMid; }}
          >✦ View Showcase</a>
        )}
      </div>
    </div>
  );
}

// ─── HERO STYLE 3: MAGAZINE BANNER ───────────────────────────────────────────
function HeroMagazine({ venue, onEnquire }) {
  const C = useT();
  return (
    <div>
      <HeroSlider imgs={venue.imgs} height="48vh">
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.28)" }} />
        {venue.featured && (
          <div style={{ position: "absolute", top: 80, left: 40 }}>
            <div style={{ display: "inline-flex", padding: "4px 12px", border: `1px solid ${C.gold}`, background: "rgba(0,0,0,0.45)" }}>
              <span style={{ fontFamily: FB, fontSize: 10, color: "#fff", letterSpacing: "1.5px", fontWeight: 700, textTransform: "uppercase" }}>✦ Editor's Pick</span>
            </div>
          </div>
        )}
      </HeroSlider>
      {/* Title below image */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "28px 40px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontFamily: FD, fontSize: "clamp(28px, 4vw, 54px)", fontWeight: 400, color: C.text, lineHeight: 1.05, marginBottom: 8 }}>{venue.name}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontFamily: FB, fontSize: 13, color: C.textLight }}>{venue.flag} {venue.location}</span>
              <span style={{ width: 1, height: 12, background: C.border2 }} />
              {venue.rating != null && venue.rating > 0 && <><Stars rating={venue.rating} size={13} />
              <span style={{ fontFamily: FB, fontSize: 13, fontWeight: 700, color: C.text }}>{venue.rating}</span>
              {venue.reviews != null && <span style={{ fontFamily: FB, fontSize: 13, color: C.textLight }}>({venue.reviews} reviews)</span>}</> }
              {venue.verified && <span style={{ fontFamily: FB, fontSize: 11, color: C.green, fontWeight: 700 }}>✓ LWD Verified</span>}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            {venue.priceFrom && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: FD, fontSize: 26, color: C.gold }}>From {fmtPrice(venue.priceFrom, venue.priceCurrency)}</div>
                <div style={{ fontFamily: FB, fontSize: 11, color: C.textMuted }}>per event</div>
              </div>
            )}
            {venue.showcaseUrl && (
              <a href={venue.showcaseUrl}
                onClick={e => { e.preventDefault(); window.history.pushState(null, "", venue.showcaseUrl); window.dispatchEvent(new PopStateEvent('popstate')); }}
                style={{
                padding: "12px 18px", border: `1px solid ${C.border2}`,
                borderRadius: "var(--lwd-radius-input)",
                color: C.textMid, fontFamily: FB, fontSize: 11, fontWeight: 700,
                letterSpacing: "0.8px", textTransform: "uppercase",
                textDecoration: "none", whiteSpace: "nowrap", transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.color = C.textMid; }}
              >✦ Showcase</a>
            )}
            <button onClick={onEnquire} style={{
              padding: "13px 22px", background: C.gold, border: "none", borderRadius: "var(--lwd-radius-input)",
              color: "#0f0d0a", fontFamily: FB, fontSize: 12, fontWeight: 800,
              letterSpacing: "1.2px", textTransform: "uppercase", cursor: "pointer",
              whiteSpace: "nowrap", transition: "opacity 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >Begin Your Enquiry →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── HERO STYLE 4: VIDEO (YouTube / Vimeo) ───────────────────────────────────
function HeroVideo({ venue, onEnquire }) {
  const C = useT();
  const [filmOpen, setFilmOpen] = useState(false);
  const { type, heroId, filmId } = venue.video || {};

  const embedUrl = type === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${heroId}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&loop=1&playlist=${heroId}&showinfo=0&iv_load_policy=3&disablekb=1&playsinline=1`
    : `https://player.vimeo.com/video/${heroId}?autoplay=1&loop=1&muted=1&background=1`;

  const filmUrl = type === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${filmId}?autoplay=1&rel=0&modestbranding=1`
    : `https://player.vimeo.com/video/${filmId}?autoplay=1`;

  return (
    <div style={{ position: "relative", height: "62vh", overflow: "hidden", background: "#111" }}>
      {/* iframe scaled 120% to hide YouTube edge UI */}
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "120%", height: "120%",
        pointerEvents: "none",
      }}>
        <iframe
          src={embedUrl}
          style={{ width: "100%", height: "100%", border: "none" }}
          allow="autoplay; fullscreen; picture-in-picture"
          title="Venue hero video"
        />
      </div>

      {/* Gradient overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.04) 40%, rgba(0,0,0,0.72) 100%)",
        pointerEvents: "none",
      }} />

      {/* Content, same layout as Cinematic */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 40px 52px", animation: "fadeUp 0.8s ease both" }}>
        {venue.featured && (
          <div style={{ display: "inline-flex", marginBottom: 12, padding: "4px 12px", border: `1px solid ${C.gold}`, background: "rgba(157,135,62,0.18)" }}>
            <span style={{ fontFamily: FB, fontSize: 10, color: "#fff", letterSpacing: "1.5px", fontWeight: 700, textTransform: "uppercase" }}>✦ Editor's Pick</span>
          </div>
        )}
        <h1 style={{ fontFamily: FD, fontSize: "clamp(38px, 5.3vw, 68px)", fontWeight: 400, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1.05, marginBottom: 14 }}>{venue.name}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 22 }}>
          <span style={{ fontFamily: FB, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{venue.flag} {venue.location}</span>
          <span style={{ width: 1, height: 12, background: "rgba(255,255,255,0.3)" }} />
          <Stars rating={venue.rating} size={13} />
          <span style={{ fontFamily: FB, fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>{venue.rating}</span>
          {venue.reviews != null && <span style={{ fontFamily: FB, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>({venue.reviews} reviews)</span>}
          {venue.verified && <span style={{ fontFamily: FB, fontSize: 11, color: "#4ade80", fontWeight: 700 }}>✓ LWD Verified</span>}
        </div>
        {/* Hero CTAs */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={onEnquire} style={{
            padding: "14px 28px", background: C.gold, border: "none", borderRadius: "var(--lwd-radius-input)",
            color: "#0f0d0a", fontFamily: FB, fontSize: 13, fontWeight: 800,
            letterSpacing: "1.2px", textTransform: "uppercase", cursor: "pointer", transition: "opacity 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >Begin Your Enquiry →</button>
          {/* Watch film CTA */}
          <button onClick={() => setFilmOpen(true)} style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "9px 20px",
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.32)",
            borderRadius: "var(--lwd-radius-input)",
            color: "#fff", fontFamily: FB, fontSize: 12, fontWeight: 700,
            letterSpacing: "0.6px", textTransform: "uppercase", cursor: "pointer",
            transition: "all 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.22)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
          >
            <span style={{ fontSize: 14 }}>▶</span> Watch the film
          </button>
        </div>
      </div>

      {/* Film lightbox */}
      {filmOpen && (
        <div onClick={() => setFilmOpen(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.94)", zIndex: 2000,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div onClick={e => e.stopPropagation()} style={{ position: "relative", width: "90vw", maxWidth: 1024 }}>
            <div style={{ position: "relative", paddingTop: "56.25%" }}>
              <iframe
                src={filmUrl}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title="Venue film"
              />
            </div>
            <button onClick={() => setFilmOpen(false)} style={{
              position: "absolute", top: -48, right: 0,
              background: "none", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "var(--lwd-radius-input)",
              color: "rgba(255,255,255,0.7)", fontSize: 22, width: 40, height: 40,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── STICKY TAB NAV ───────────────────────────────────────────────────────────
const TABS = [
  { key: 'overview',     label: 'Overview',     show: (v) => true },
  { key: 'gallery',      label: 'Gallery',      show: (v) => (v.gallery?.length || 0) > 0 },
  { key: 'capacity',     label: 'Spaces',       show: (v) => (v.spaces?.length || 0) > 0 },
  { key: 'rooms',        label: 'Rooms',        show: (v) => v.accommodation?.totalRooms > 0 || v.accommodation?.description },
  { key: 'dining',       label: 'Dining',       show: (v) => v.dining?.description || v.dining?.style },
  { key: 'pricing',      label: 'Pricing',      show: (v) => (v.exclusiveUse?.enabled !== false && v.exclusiveUse) || v.priceFrom },
  { key: 'availability', label: 'Availability', show: (v) => (v.notices?.length || 0) > 0 },
  { key: 'reviews',      label: 'Reviews',      show: (v) => true },
  { key: 'faqs',         label: 'FAQs',         show: (v) => true },
  { key: 'venue-type',   label: 'Venue Type',   show: (v) => v.venueType?.primaryType || (v.categories?.length || 0) > 0 },
  { key: 'things-to-do', label: 'Things to Do', show: (v) => (v.experiences?.length || 0) > 0 },
];

// ─── BREADCRUMB BAR ───────────────────────────────────────────────────────────
function BreadcrumbBar({ venue, onBack }) {
  const C = useT();
  const crumbs = ["Venues", venue.country, venue.location?.split(', ').pop()].filter(Boolean);
  return (
    <div style={{
      maxWidth: 1280, margin: '0 auto', padding: '14px 40px',
      display: 'flex', alignItems: 'center', gap: 6,
      fontFamily: "'Nunito','Inter',sans-serif", fontSize: 12, letterSpacing: '0.2px',
    }}>
      {crumbs.map((crumb) => (
        <span key={crumb} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{ color: C.textMid || '#888', cursor: crumb === 'Venues' ? 'pointer' : 'default', transition: 'color 0.2s' }}
            onClick={crumb === 'Venues' && onBack ? onBack : undefined}
            onMouseEnter={e => { if (crumb === 'Venues') e.currentTarget.style.color = C.gold; }}
            onMouseLeave={e => { if (crumb === 'Venues') e.currentTarget.style.color = C.textMid || '#888'; }}
          >{crumb}</span>
          <span style={{ color: C.border2, fontSize: 10 }}>›</span>
        </span>
      ))}
      <span style={{ color: C.text, fontWeight: 600 }}>{venue.name}</span>
    </div>
  );
}

function StickyTabNav({ venue, activeTab, onTabClick, saved, setSaved, onAddCompare, compareList = [] }) {
  const C = useT();
  const isMobile = useIsMobile();
  const visibleTabs = TABS.filter(t => t.show(venue));

  if (isMobile) {
    return (
      <div data-tab-nav style={{
        position: 'sticky', top: 60, zIndex: 50,
        backgroundColor: C.navBg || C.bg, borderBottom: `1px solid ${C.border}`,
        padding: '10px 20px',
        backdropFilter: 'blur(12px)',
      }}>
        <select
          value={activeTab}
          onChange={e => onTabClick(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px',
            fontSize: 14, fontFamily: 'inherit',
            border: `1px solid ${C.border}`,
            borderRadius: 'var(--lwd-radius-input, 3px)',
            backgroundColor: C.surface,
            color: C.text,
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23999' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 14px center',
            paddingRight: 40,
            cursor: 'pointer',
          }}
        >
          {visibleTabs.map(t => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div data-tab-nav style={{
      position: 'sticky', top: 60, zIndex: 50,
      backgroundColor: C.navBg || C.bg,
      backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${C.border}`,
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '0 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'stretch', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', flex: 1 }}>
        {visibleTabs.map((t, i) => {
          const active = activeTab === t.key;
          return (
            <div key={t.key} style={{ display: 'flex', alignItems: 'stretch' }}>
              <button
                onClick={() => onTabClick(t.key)}
                style={{
                  flexShrink: 0,
                  padding: '0 18px',
                  height: 48,
                  border: 'none',
                  borderBottom: `2px solid ${active ? C.gold : 'transparent'}`,
                  backgroundColor: 'transparent',
                  color: active ? C.gold : C.textLight,
                  fontFamily: 'inherit',
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  letterSpacing: '0.01em',
                  cursor: 'pointer',
                  transition: 'color 0.15s, border-bottom-color 0.15s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = C.text; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = C.textLight; }}
              >
                {t.label}
              </button>
              {i < visibleTabs.length - 1 && (
                <div style={{ width: '1px', backgroundColor: `${C.border}`, opacity: 0.5, alignSelf: 'center', height: '20px' }} />
              )}
            </div>
          );
        })}
        </div>
        {/* Venue actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, paddingLeft: 16 }}>
          {[
            { label: saved ? '♥  Saved' : '♡  Save', action: () => setSaved(s => !s), active: saved },
            { label: '⊕  Compare', action: onAddCompare, active: compareList.length > 0 },
            { label: '↗  Share', action: () => {}, active: false },
          ].map(btn => (
            <button key={btn.label} onClick={btn.action}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#c9a84c'; e.currentTarget.style.color = '#c9a84c'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = btn.active ? '#c9a84c' : 'rgba(0,0,0,0.15)'; e.currentTarget.style.color = btn.active ? '#c9a84c' : '#666'; }}
              style={{
                padding: '6px 14px', fontSize: 11, fontWeight: 700, letterSpacing: '0.6px',
                textTransform: 'uppercase', fontFamily: "'Nunito','Inter',sans-serif",
                background: btn.active ? 'rgba(201,168,76,0.08)' : 'none',
                border: `1px solid ${btn.active ? '#c9a84c' : 'rgba(0,0,0,0.15)'}`,
                borderRadius: 'var(--lwd-radius-input)',
                color: btn.active ? '#c9a84c' : '#666',
                cursor: 'pointer', transition: 'all 0.2s',
              }}>{btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SECTION SIDE IMAGE ──────────────────────────────────────────────────────
// Consistent 3:4 portrait block, same size for ALL sections. No layout shift.
function SectionSideImage({ src, alt = '' }) {
  if (!src) return null;
  return (
    <div style={{ width: 240, flexShrink: 0 }}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        style={{
          display: 'block',
          width: 240,
          aspectRatio: '3/4',
          objectFit: 'cover',
          borderRadius: 2,
        }}
      />
    </div>
  );
}

// Wrapper that puts content + side image side by side on desktop
function SectionLayout({ children, sideImg, isMobile }) {
  return (
    <div style={{
      display: 'flex',
      gap: 48,
      alignItems: 'flex-start',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      {!isMobile && <SectionSideImage src={sideImg} />}
    </div>
  );
}

// ─── HERO WRAPPER, style switcher ───────────────────────────────────────────
function Hero({ venue, heroStyle, setHeroStyle, onEnquire, onBack }) {
  const C = useT();
  // Only show Video option if the venue has video configured
  const styles = [
    { key: "cinematic", label: "Cinematic" },
    { key: "split",     label: "Split" },
    { key: "magazine",  label: "Magazine" },
    ...(venue.video?.type ? [{ key: "video", label: "▶ Video" }] : []),
  ];
  return (
    <div>
      {heroStyle === "cinematic" && <HeroCinematic venue={venue} onEnquire={onEnquire} onBack={onBack} />}
      {heroStyle === "split"     && <HeroSplit venue={venue} onEnquire={onEnquire} />}
      {heroStyle === "magazine"  && <HeroMagazine venue={venue} onEnquire={onEnquire} />}
      {heroStyle === "video"     && <HeroVideo venue={venue} onEnquire={onEnquire} />}
    </div>
  );
}

// ─── STATS STRIP ─────────────────────────────────────────────────────────────
function StatsStrip({ venue, nextEvent, onEventClick }) {
  const C = useT();

  // Capacity
  const maxCeremony  = venue.capacity?.ceremony || venue.capacity?.standing || null;
  const maxDinner    = venue.capacity?.dinner || venue.capacity?.seated || null;
  const maxGuests    = maxCeremony || maxDinner;

  // Accommodation
  const sleepsValue  = venue.accommodation?.maxOvernightGuests ?? venue.accommodation?.maxGuests ?? null;
  const totalRooms   = venue.accommodation?.totalRooms ?? null;

  // Spaces
  const spacesCount  = venue.spaces?.length || null;

  // Ceremony styles — derived from spaces tags or venue.ceremonyStyles
  const ceremonyTypes = (() => {
    const from = venue.ceremonyStyles || [];
    if (from.length) return from.slice(0, 2).join(" & ");
    if (!venue.spaces?.length) return null;
    const tags = new Set();
    venue.spaces.forEach(s => {
      if (s.setting?.toLowerCase().includes("beach"))   tags.add("Beach");
      if (s.setting?.toLowerCase().includes("garden"))  tags.add("Garden");
      if (s.setting?.toLowerCase().includes("chapel"))  tags.add("Chapel");
      if (s.setting?.toLowerCase().includes("terrace")) tags.add("Terrace");
      if (s.indoor !== undefined) tags.add(s.indoor ? "Indoor" : "Outdoor");
    });
    const arr = [...tags].slice(0, 2);
    return arr.length ? arr.join(" & ") : null;
  })();

  const stats = [
    {
      label: "Starting From",
      value: venue.priceFrom ? fmtPrice(venue.priceFrom, venue.priceCurrency) : null,
      sub: "per event",
      hide: !venue.priceFrom,
    },
    {
      label: "Up to",
      value: maxGuests ? `${maxGuests}` : (sleepsValue ? `${sleepsValue}` : null),
      sub: "guests",
      hide: !maxGuests && !sleepsValue,
    },
    {
      label: "Rooms",
      value: totalRooms ? totalRooms.toString() : null,
      sub: sleepsValue ? `sleeps ${sleepsValue}` : "for guests",
      hide: !totalRooms,
    },
    {
      label: "Event Spaces",
      value: spacesCount ? spacesCount.toString() : null,
      sub: "ceremony settings",
      hide: !spacesCount,
    },
    {
      label: "Ceremony Style",
      value: ceremonyTypes,
      sub: "settings available",
      hide: !ceremonyTypes,
      small: true,
    },
    {
      label: "Exclusive Use",
      value: venue.exclusiveUse ? "Available" : null,
      sub: "full venue buyout",
      hide: !venue.exclusiveUse,
      small: true,
    },
    {
      label: "Rating",
      value: venue.rating ? `${venue.rating}★` : null,
      sub: `${venue.reviews || 0} verified reviews`,
      hide: !venue.rating,
    },
  ].filter(s => !s.hide);

  const nextEventDate = nextEvent ? formatEventDate(nextEvent.startDate) : null;

  return (
    <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 40px" }}>
      <div style={{ display: "flex", overflowX: "auto", gap: 0, scrollbarWidth: "none" }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            flex: "0 0 auto", padding: "18px 28px",
            borderRight: `1px solid ${C.border}`,
            minWidth: 120,
          }}>
            <div style={{ fontFamily: FB, fontSize: 10, color: C.textMuted, letterSpacing: "0.7px", textTransform: "uppercase", marginBottom: 5 }}>{s.label}</div>
            <div style={{ fontFamily: s.small ? FB : FD, fontSize: s.small ? 15 : 22, fontWeight: s.small ? 600 : 500, color: C.gold, lineHeight: 1, letterSpacing: s.small ? "-0.2px" : "normal" }}>{s.value}</div>
            <div style={{ fontFamily: FB, fontSize: 11, color: C.textLight, marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}

        {/* Next Open Day — only when an upcoming event exists */}
        {nextEvent && nextEventDate && (
          <div
            onClick={() => {
              trackEvent({ eventType: 'event_cta_click', entityType: 'event', entityId: nextEvent.id, metadata: { surface: 'stats_strip', eventTitle: nextEvent.title } })
              onEventClick?.(nextEvent)
            }}
            style={{
              flex: "0 0 auto", padding: "18px 28px", minWidth: 140,
              cursor: "pointer", position: "relative",
              transition: "background 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = C.hover || 'rgba(201,168,76,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ fontFamily: FB, fontSize: 10, color: C.textMuted, letterSpacing: "0.7px", textTransform: "uppercase", marginBottom: 5 }}>
              Next Open Day
            </div>
            <div style={{ fontFamily: FB, fontSize: 15, fontWeight: 600, color: C.gold, lineHeight: 1.2 }}>
              {nextEventDate}
            </div>
            <div style={{ fontFamily: FB, fontSize: 11, color: C.gold, marginTop: 5, display: 'flex', alignItems: 'center', gap: 4, opacity: 0.85 }}>
              Register <span style={{ fontSize: 10 }}>→</span>
            </div>
            {/* Subtle animated bottom border as a signal */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`,
              animation: 'lwd-pulse-bar 2.5s ease-in-out infinite',
            }} />
          </div>
        )}
      </div>
      <style>{`
        @keyframes lwd-pulse-bar {
          0%, 100% { opacity: 0.3; }
          50%       { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── SIDEBAR: OWNER CARD ─────────────────────────────────────────────────────
function OwnerCard({ owner, venue }) {
  const C = useT();

  // Only render if owner data exists
  if (!owner || !owner.name) return null;

  return (
    <div style={{
      border: `1px solid ${C.border}`,
      background: C.surface,
      overflow: "hidden",
      marginBottom: 0,
    }}>
      {/* Gold top accent */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${C.gold}, ${C.green})` }} />

      <div style={{ padding: "20px 22px" }}>
        {/* Owner header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            {owner.photo ? (
              <img
                src={owner.photo}
                alt={owner.name}
                style={{
                  width: 58, height: 58, borderRadius: "50%", objectFit: "cover",
                  border: `2px solid ${C.gold}`, display: "block",
                }}
              />
            ) : (
              <div style={{
                width: 58, height: 58, borderRadius: "50%",
                border: `2px solid ${C.gold}`, background: C.goldLight,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: FD, fontSize: 20, color: C.gold, letterSpacing: "-0.5px",
              }}>
                {(owner.name || "V").split(" ").map(w => w[0]).slice(0, 2).join("")}
              </div>
            )}
            {/* LWD verified dot */}
            <div style={{
              position: "absolute", bottom: 0, right: 0,
              width: 17, height: 17, borderRadius: "50%",
              background: C.gold, border: `2px solid ${C.surface}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, color: "#fff", fontWeight: 700,
            }}>✓</div>
          </div>
          <div>
            <div style={{ fontFamily: FD, fontSize: 16, color: C.text, lineHeight: 1.2, marginBottom: 2 }}>{owner.name}</div>
            <div style={{ fontFamily: FB, fontSize: 12, color: C.textLight, marginBottom: 1 }}>{owner.title}</div>
            <div style={{ fontFamily: FB, fontSize: 11, color: C.gold, fontWeight: 600, letterSpacing: "0.2px" }}>
              ✦ LWD Partner since {owner.memberSince}
            </div>
          </div>
        </div>

        {/* Quote — only render when bio has content */}
        {owner.bio && (
          <div style={{
            borderLeft: `2px solid ${C.goldBorder}`,
            paddingLeft: 14, marginBottom: 16,
          }}>
            <p style={{
              fontFamily: FD, fontSize: 13, fontStyle: "italic",
              color: C.textMid, lineHeight: 1.75, margin: 0,
            }}>"{owner.bio}"</p>
          </div>
        )}

        {/* Stats grid */}
        <div className="vp-stats-strip" style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: 0, borderTop: `1px solid ${C.border}`,
          paddingTop: 14,
        }}>
          {[
            { label: "Responds in",   value: venue.responseTime                                              },
            { label: "Response rate", value: venue.responseRate ? `${venue.responseRate}%` : null            },
            { label: "Weddings held", value: venue.weddingsHosted != null ? `${venue.weddingsHosted}+` : null },
            { label: "Partner since", value: owner.memberSince || null                                       },
          ].filter(s => s.value).map((s, i) => (
            <div key={s.label} style={{
              padding: "10px 0",
              borderRight: i % 2 === 0 ? `1px solid ${C.border}` : "none",
              paddingRight: i % 2 === 0 ? 16 : 0,
              paddingLeft: i % 2 === 1 ? 16 : 0,
            }}>
              <div style={{ fontFamily: FB, fontSize: 10, color: C.textMuted, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontFamily: FD, fontSize: 17, color: C.text }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR: MINI CONTACT ───────────────────────────────────────────────────
// ─── OPENING HOURS WIDGET ─────────────────────────────────────────────────────
function OpeningHoursWidget({ openingHours }) {
  const C = useT();
  if (!openingHours?.enabled || !openingHours?.hours) return null;
  const DAYS = [
    { key: 'mon', label: 'Mon' }, { key: 'tue', label: 'Tue' }, { key: 'wed', label: 'Wed' },
    { key: 'thu', label: 'Thu' }, { key: 'fri', label: 'Fri' }, { key: 'sat', label: 'Sat' },
    { key: 'sun', label: 'Sun' },
  ];
  // Group consecutive days with same hours
  const rows = DAYS.map(d => ({ ...d, ...(openingHours.hours[d.key] || { type: 'closed' }) }));
  return (
    <div style={{ borderTop: `1px solid ${C.border}`, padding: '12px 16px' }}>
      <div style={{ fontFamily: FB, fontSize: 9, color: C.textMuted, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 10 }}>Opening Hours</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {rows.map(r => (
          <div key={r.key} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: FB, fontSize: 12 }}>
            <span style={{ color: (r.type === 'closed' && !r.from) ? C.textMuted : C.text, width: 32 }}>{r.label}</span>
            <span style={{ color: r.type === 'closed' ? C.textMuted : (r.type === 'appointment' || r.type === 'by_appointment') ? C.gold : C.text }}>
              {r.type === 'closed'
                ? 'Closed'
                : (r.type === 'appointment' || r.type === 'by_appointment')
                  ? 'By appt.'
                  : (r.from && r.to)
                    ? `${r.from} – ${r.to}`
                    : 'Open'}
            </span>
          </div>
        ))}
      </div>
      {openingHours.note && (
        <div style={{ marginTop: 8, fontFamily: FB, fontSize: 11, color: C.textLight, lineHeight: 1.5 }}>{openingHours.note}</div>
      )}
    </div>
  );
}

function SidebarContact({ venue }) {
  const C = useT();
  const [exitConfig, setExitConfig] = useState(null);

  const handleWebsiteClick = () => {
    const url = toAbsoluteUrl(venue.contact.website);
    const trackData = { entityType: 'venue', entityId: venue.id, venueId: venue.id, linkType: 'website', url };
    if (!hasSeenModalThisSession(url)) {
      setExitConfig({ url, name: venue.name });
    } else {
      trackExternalClick(trackData);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div style={{ border: `1px solid ${C.border}`, background: C.surface }}>
      {/* Mini map */}
      <div style={{ height: 160, overflow: "hidden", borderBottom: `1px solid ${C.border}` }}>
        <iframe
          title="Mini map"
          width="100%" height="160"
          style={{ display: "block", border: "none", marginTop: -40 }}
          loading="lazy"
          src={`https://maps.google.com/maps?q=${venue.contact.mapQuery}&output=embed&z=11`}
        />
      </div>
      {/* Address + quick actions */}
      <div style={{ padding: "14px 16px" }}>
        <div style={{ fontFamily: FB, fontSize: 12, color: C.textMid, lineHeight: 1.6, marginBottom: 12 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="pin" size={13} color={C.textMid} /> {venue.contact.addressFormatted}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <a href={`tel:${venue.contact.phone}`} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "9px 8px", border: `1px solid ${C.border2}`, borderRadius: "var(--lwd-radius-input)",
            fontFamily: FB, fontSize: 11, fontWeight: 700, color: C.text,
            textDecoration: "none", letterSpacing: "0.4px", textTransform: "uppercase",
            transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.color = C.text; }}
          ><Icon name="phone" size={12} /> Call</a>
          <button onClick={venue.contact.website ? handleWebsiteClick : undefined} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "9px 8px", border: `1px solid ${C.border2}`, borderRadius: "var(--lwd-radius-input)",
            fontFamily: FB, fontSize: 11, fontWeight: 700, color: C.text,
            background: "none", cursor: "pointer",
            letterSpacing: "0.4px", textTransform: "uppercase",
            transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.color = C.text; }}
          ><Icon name="globe" size={12} /> Website</button>
        </div>
      </div>
      {/* Opening hours */}
      <OpeningHoursWidget openingHours={venue.openingHours} />

      {exitConfig && (
        <ExternalLinkModal
          name={exitConfig.name}
          url={exitConfig.url}
          onClose={() => setExitConfig(null)}
          onContinue={() => {
            markModalSeen(exitConfig.url);
            trackExternalClick({ entityType: 'venue', entityId: venue.id, venueId: venue.id, linkType: 'website', url: exitConfig.url });
          }}
        />
      )}
    </div>
  );
}

// ─── NOTICE ENQUIRY MODAL ─────────────────────────────────────────────────────
const NOTICE_FORM_CONFIG = {
  "open-day": {
    heading: "Reserve Your Place",
    getContext: (n) => n.title,
    fields: [
      { key: "name",    label: "Full name",        type: "text",     required: true  },
      { key: "email",   label: "Email address",    type: "email",    required: true  },
      { key: "phone",   label: "Phone number",     type: "tel",      required: false },
      { key: "guests",  label: "Number attending", type: "select",   required: true,
        options: ["1 person", "2 people", "3 people", "4 people"] },
      { key: "message", label: "Any questions",    type: "textarea", required: false },
    ],
    submitLabel: "Reserve My Place",
    confirmHeading: "You're reserved.",
    confirmDetail: "We'll send confirmation to your email and look forward to welcoming you.",
  },
  "offer": {
    heading: "Enquire About This Offer",
    getContext: (n) => n.title,
    fields: [
      { key: "name",        label: "Full name",    type: "text",     required: true  },
      { key: "email",       label: "Email address",type: "email",    required: true  },
      { key: "phone",       label: "Phone number", type: "tel",      required: false },
      { key: "weddingDate", label: "Wedding date", type: "text",     required: false, placeholder: "e.g. September 2026" },
      { key: "guests",      label: "Guest count",  type: "text",     required: false, placeholder: "e.g. 120 guests" },
      { key: "message",     label: "Message",      type: "textarea", required: false },
    ],
    submitLabel: "Send Enquiry",
    confirmHeading: "Enquiry received.",
    confirmDetail: "Our team will be in touch within 2 hours to discuss your 2026 booking.",
  },
  "availability": {
    heading: "Enquire About This Date",
    getContext: (n) => `${n.title} (exclusive use inquiry)`,
    fields: [
      { key: "name",  label: "Full name",    type: "text",  required: true  },
      { key: "email", label: "Email address",type: "email", required: true  },
      { key: "phone", label: "Phone number", type: "tel",   required: true  },
      { key: "guests",label: "Guest count",  type: "text",  required: false, placeholder: "e.g. 80 guests" },
    ],
    note: "We respond within 2 hours. This date will not be held without a confirmed enquiry.",
    submitLabel: "Enquire About This Date",
    confirmHeading: "We're on it.",
    confirmDetail: "Our availability team will contact you within 2 hours. Please keep your phone nearby.",
  },
  "news": {
    heading: "Request Sample Menus",
    getContext: () => "Curated by Lorenzo Conti, Executive Chef",
    fields: [
      { key: "name",       label: "Full name",            type: "text",     required: true  },
      { key: "email",      label: "Email address",        type: "email",    required: true  },
      { key: "weddingDate",label: "Wedding date",         type: "text",     required: false, placeholder: "e.g. June 2026" },
      { key: "dietary",    label: "Dietary requirements", type: "textarea", required: false, placeholder: "Any allergies or preferences to note" },
    ],
    submitLabel: "Request Menus",
    confirmHeading: "Sample menus on their way.",
    confirmDetail: "Lorenzo's current seasonal menu will be sent to your inbox shortly.",
  },
};

function NoticeEnquiryModal({ notice, venueName, onClose }) {
  const C = useT();
  const cfg      = NOTICE_FORM_CONFIG[notice.type] || NOTICE_FORM_CONFIG["offer"];
  const noticeCfg = NOTICE_CONFIG[notice.type]    || NOTICE_CONFIG["news"];
  const [formData,   setFormData]   = useState({});
  const [sent,       setSent]       = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleChange = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => { setSent(true); setSubmitting(false); }, 900);
  };

  const inputBase = {
    width: "100%", background: C.bgAlt, border: `1px solid ${C.border}`,
    color: C.text, fontFamily: FB, fontSize: 13, padding: "10px 12px",
    borderRadius: "var(--lwd-radius-input)", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 4000,
        background: "rgba(0,0,0,0.82)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "min(92vw, 480px)",
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderTop: `3px solid ${noticeCfg.accent}`,
          maxHeight: "90vh", overflowY: "auto",
          animation: "lwd-modal-in 0.25s ease",
        }}
      >
        {/* ── Image header ── */}
        {notice.img && (
          <div style={{ position: "relative", height: 170, overflow: "hidden", flexShrink: 0 }}>
            <img src={notice.img} alt={notice.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.12) 55%, transparent 100%)",
            }} />
            {/* Type badge */}
            <div style={{
              position: "absolute", top: 14, left: 18,
              fontSize: 9, fontFamily: FB, fontWeight: 700,
              letterSpacing: "1.4px", textTransform: "uppercase",
              color: noticeCfg.accent, borderLeft: `2px solid ${noticeCfg.accent}`, paddingLeft: 7,
            }}>{noticeCfg.label}</div>
            {/* Close */}
            <button onClick={onClose} style={{
              position: "absolute", top: 12, right: 14,
              background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "var(--lwd-radius-input)", color: "rgba(255,255,255,0.8)",
              width: 30, height: 30, cursor: "pointer",
              fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
            {/* Context line */}
            <div style={{
              position: "absolute", bottom: 14, left: 18, right: 50,
              fontFamily: FB, fontSize: 10, color: "rgba(255,255,255,0.72)",
              fontStyle: "italic", letterSpacing: "0.3px",
            }}>{cfg.getContext(notice)}</div>
          </div>
        )}

        {/* ── Body ── */}
        <div style={{ padding: "26px 26px 30px" }}>
          {!sent ? (
            <>
              <h3 style={{
                fontFamily: FD, fontSize: 21, fontWeight: 400,
                color: C.text, margin: "0 0 5px", lineHeight: 1.2,
              }}>{cfg.heading}</h3>
              <p style={{
                fontFamily: FB, fontSize: 11, color: C.textMuted,
                letterSpacing: "0.3px", margin: "0 0 22px",
              }}>{venueName} · {cfg.getContext(notice)}</p>

              {/* Urgency note (availability only) */}
              {cfg.note && (
                <div style={{
                  background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.22)",
                  borderRadius: "var(--lwd-radius-card)", padding: "10px 13px", marginBottom: 20,
                  fontFamily: FB, fontSize: 11, color: C.textLight, lineHeight: 1.55,
                }}>{cfg.note}</div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                {cfg.fields.map(f => (
                  <div key={f.key}>
                    <label style={{
                      display: "block", fontFamily: FB, fontSize: 10, fontWeight: 700,
                      letterSpacing: "1.2px", textTransform: "uppercase",
                      color: C.textMuted, marginBottom: 6,
                    }}>
                      {f.label}
                      {f.required && <span style={{ color: noticeCfg.accent, marginLeft: 3 }}>*</span>}
                    </label>
                    {f.type === "textarea" ? (
                      <textarea rows={3} required={f.required} placeholder={f.placeholder || ""}
                        value={formData[f.key] || ""}
                        onChange={e => handleChange(f.key, e.target.value)}
                        style={{ ...inputBase, resize: "vertical", minHeight: 76 }}
                        onFocus={e => e.target.style.borderColor = noticeCfg.accent}
                        onBlur={e  => e.target.style.borderColor = C.border}
                      />
                    ) : f.type === "select" ? (
                      <select required={f.required} value={formData[f.key] || ""}
                        onChange={e => handleChange(f.key, e.target.value)}
                        style={inputBase}
                        onFocus={e => e.target.style.borderColor = noticeCfg.accent}
                        onBlur={e  => e.target.style.borderColor = C.border}
                      >
                        <option value="">Select…</option>
                        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type={f.type} required={f.required}
                        placeholder={f.placeholder || ""}
                        value={formData[f.key] || ""}
                        onChange={e => handleChange(f.key, e.target.value)}
                        style={inputBase}
                        onFocus={e => e.target.style.borderColor = noticeCfg.accent}
                        onBlur={e  => e.target.style.borderColor = C.border}
                      />
                    )}
                  </div>
                ))}

                <button type="submit" disabled={submitting} style={{
                  marginTop: 4,
                  background: noticeCfg.accent, border: "none", borderRadius: "var(--lwd-radius-input)",
                  color: "#0f0d0a", padding: "13px 24px",
                  fontFamily: FB, fontSize: 11, fontWeight: 700,
                  letterSpacing: "1.2px", textTransform: "uppercase",
                  cursor: submitting ? "default" : "pointer",
                  opacity: submitting ? 0.7 : 1, transition: "opacity 0.2s", width: "100%",
                }}>{submitting ? "Sending…" : `${cfg.submitLabel} →`}</button>
              </form>
            </>
          ) : (
            /* ── Confirmation ── */
            <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
              <div style={{
                width: 54, height: 54, borderRadius: "50%",
                border: `2px solid ${noticeCfg.accent}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px", fontSize: 24, color: noticeCfg.accent,
              }}>✓</div>
              <h3 style={{
                fontFamily: FD, fontSize: 22, fontWeight: 400,
                color: C.text, margin: "0 0 10px",
              }}>{cfg.confirmHeading}</h3>
              <p style={{
                fontFamily: FB, fontSize: 13, color: C.textLight,
                lineHeight: 1.65, margin: "0 auto 26px", maxWidth: 300,
              }}>{cfg.confirmDetail}</p>
              <button onClick={onClose} style={{
                background: "none", border: `1px solid ${C.border}`,
                borderRadius: "var(--lwd-radius-input)", color: C.textMuted,
                padding: "10px 28px", fontFamily: FB, fontSize: 10,
                fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase",
                cursor: "pointer",
              }}>Close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR: VENUE NOTICES ───────────────────────────────────────────────────
const NOTICE_CONFIG = {
  "open-day":     { label: "Open Day",         accent: "#C9A84C",              bg: "rgba(201,168,76,0.07)",  icon: "🗓" },
  "offer":        { label: "Special Offer",     accent: "#d97706",              bg: "rgba(217,119,6,0.07)",   icon: "🏷" },
  "availability": { label: "Late Availability", accent: "#22c55e",              bg: "rgba(34,197,94,0.07)",   icon: "📅" },
  "news":         { label: "Estate News",        accent: "#C9A84C",              bg: "rgba(201,168,76,0.07)",  icon: "📢" },
};

function SidebarNotices({ notices, venueName }) {
  const C = useT();
  // Only first notice open by default
  const [openIds,       setOpenIds]       = useState(() => new Set(notices?.length ? [notices[0].id] : []));
  const [enquiryNotice, setEnquiryNotice] = useState(null);
  if (!notices?.length) return null;

  const toggle = (id) => setOpenIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <div style={{
      border: `1px solid ${C.border}`,
      background: C.surface,
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 18px 12px",
        borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ fontSize: 10, color: C.gold }}>✦</span>
        <span style={{
          fontFamily: FB, fontSize: 10, fontWeight: 700,
          letterSpacing: "2px", textTransform: "uppercase", color: C.textMuted,
        }}>From {venueName}</span>
      </div>

      {/* Notices */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {notices.map((n, idx) => {
          const cfg = NOTICE_CONFIG[n.type] || NOTICE_CONFIG["news"];
          const isOpen = openIds.has(n.id);
          return (
            <div
              key={n.id}
              style={{
                borderBottom: idx < notices.length - 1 ? `1px solid ${C.border}` : "none",
              }}
            >
              {/* Notice row */}
              <button
                onClick={() => toggle(n.id)}
                style={{
                  width: "100%", textAlign: "left", background: "none", border: "none",
                  padding: "14px 18px", cursor: "pointer", display: "flex",
                  alignItems: "flex-start", gap: 12, transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = cfg.bg}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                {/* Type badge */}
                <span style={{
                  flexShrink: 0, marginTop: 1,
                  fontSize: 9, fontFamily: FB, fontWeight: 700,
                  letterSpacing: "1.2px", textTransform: "uppercase",
                  color: cfg.accent, whiteSpace: "nowrap",
                  borderLeft: `2px solid ${cfg.accent}`,
                  paddingLeft: 6,
                }}>
                  {cfg.label}
                </span>

                {/* Title + chevron */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: FB, fontSize: 12, fontWeight: 600,
                    color: C.text, lineHeight: 1.35,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>{n.title}</div>
                  {n.expires && (
                    <div style={{ fontFamily: FB, fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                      Expires {n.expires}
                    </div>
                  )}
                </div>

                <span style={{
                  flexShrink: 0, fontSize: 10, color: C.textMuted,
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.25s", lineHeight: 1, marginTop: 2,
                }}>▾</span>
              </button>

              {/* Expanded detail */}
              <div style={{
                overflow: "hidden",
                maxHeight: isOpen ? 420 : 0,
                transition: "max-height 0.4s ease",
              }}>
                <div style={{
                  borderTop: `1px solid ${C.border}`,
                }}>
                  {/* Image, only for news type */}
                  {n.img && (
                    <div style={{ position: "relative", overflow: "hidden" }}>
                      <img
                        src={n.img}
                        alt={n.imgCaption || n.title}
                        style={{ width: "100%", display: "block", maxHeight: 160, objectFit: "cover" }}
                      />
                      {n.imgCaption && (
                        <div style={{
                          position: "absolute", bottom: 0, left: 0, right: 0,
                          padding: "16px 12px 8px",
                          background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
                          fontFamily: FB, fontSize: 10, color: "rgba(255,255,255,0.75)",
                          fontStyle: "italic", letterSpacing: "0.3px",
                        }}>{n.imgCaption}</div>
                      )}
                    </div>
                  )}
                  <div style={{ padding: "12px 18px 16px" }}>
                  {n.type === "news" && (
                    <p style={{
                      fontFamily: FD, fontSize: 15, fontWeight: 600,
                      color: C.text, lineHeight: 1.35, margin: "0 0 8px",
                    }}>{n.title}</p>
                  )}
                  <p style={{
                    fontFamily: FB, fontSize: 12, color: C.textLight,
                    lineHeight: 1.65, margin: "0 0 12px",
                  }}>{n.detail}</p>
                  <button
                    onClick={e => { e.stopPropagation(); setEnquiryNotice(n); }}
                    style={{
                      background: cfg.accent, border: "none", borderRadius: "var(--lwd-radius-input)",
                      color: "#0f0d0a",
                      padding: "8px 16px", fontFamily: FB, fontSize: 10,
                      fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase",
                      cursor: "pointer", transition: "opacity 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                  >{n.cta} →</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Notice enquiry modal */}
      {enquiryNotice && (
        <NoticeEnquiryModal
          notice={enquiryNotice}
          venueName={venueName}
          onClose={() => setEnquiryNotice(null)}
        />
      )}
    </div>
  );
}

// ─── SIDEBAR: INSTAGRAM TEASER ───────────────────────────────────────────────
function SidebarInstagram({ venue }) {
  const C = useT();
  // Placeholder tiles, real impl pulls from Instagram Basic Display API
  const posts = [
    { id: 0, src: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=240&q=75" },
    { id: 1, src: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=240&q=75" },
    { id: 2, src: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=240&q=75" },
    { id: 3, src: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=240&q=75" },
    { id: 4, src: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=240&q=75" },
    { id: 5, src: "https://images.unsplash.com/photo-1464808322410-1a934aab61e5?w=240&q=75" },
  ];
  return (
    <div style={{ border: `1px solid ${C.border}`, background: C.surface, padding: "16px 16px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>◈</span>
          <span style={{ fontFamily: FB, fontSize: 12, fontWeight: 700, color: C.text }}>@{venue.contact.website.replace("www.", "").split(".")[0]}</span>
        </div>
        <a href="#" style={{ fontFamily: FB, fontSize: 11, color: C.gold, textDecoration: "none", fontWeight: 600 }}>Follow →</a>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3 }}>
        {posts.map(p => (
          <div key={p.id} style={{ overflow: "hidden", aspectRatio: "1", cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.querySelector("img").style.transform = "scale(1.06)"}
            onMouseLeave={e => e.currentTarget.querySelector("img").style.transform = "scale(1)"}
          >
            <img src={p.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.4s ease" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── LEAD FORM (SIDEBAR) ──────────────────────────────────────────────────────
function LeadForm({ venue }) {
  const C = useT();
  const [step, setStep] = useState(0); // 0=idle, 1=date, 2=guests, 3=details, 4=done
  const [form, setForm] = useState({ date: "", guests: 80, name: "", email: "", message: "" });

  const steps = [
    {
      key: "date", label: "When is your wedding?",
      content: (
        <div>
          <label style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, letterSpacing: "0.6px", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Wedding date</label>
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            style={{ width: "100%", padding: "11px 14px", border: `1px solid ${C.border2}`, background: C.bgAlt || C.bg, color: C.text, fontFamily: FB, fontSize: 14, outline: "none" }} />
        </div>
      )
    },
    {
      key: "guests", label: "How many guests?",
      content: (
        <div>
          <label style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, letterSpacing: "0.6px", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
            Guests, <span style={{ color: C.gold, fontWeight: 700 }}>{form.guests}</span>
          </label>
          <input type="range" min={20} max={200} value={form.guests} onChange={e => setForm(f => ({ ...f, guests: +e.target.value }))}
            style={{ width: "100%", accentColor: C.gold }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FB, fontSize: 11, color: C.textMuted, marginTop: 4 }}>
            <span>20</span><span>200</span>
          </div>
        </div>
      )
    },
    {
      key: "details", label: "Your details",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[{ key: "name", ph: "Your name", type: "text" }, { key: "email", ph: "Email address", type: "email" }].map(f => (
            <input key={f.key} type={f.type} placeholder={f.ph} value={form[f.key]} onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))}
              style={{ width: "100%", padding: "11px 14px", border: `1px solid ${C.border2}`, background: C.bgAlt || C.bg, color: C.text, fontFamily: FB, fontSize: 14, outline: "none" }} />
          ))}
          <textarea placeholder="Anything specific you'd like to know? (optional)" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={3}
            style={{ width: "100%", padding: "11px 14px", border: `1px solid ${C.border2}`, background: C.bgAlt || C.bg, color: C.text, fontFamily: FB, fontSize: 13, outline: "none", resize: "none" }} />
        </div>
      )
    },
  ];

  const canAdvance = () => {
    if (step === 1) return !!form.date;
    if (step === 3) return !!(form.name && form.email);
    return true;
  };

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      boxShadow: C.shadowLg,
      padding: 28,
    }}>
      {/* Price + rating */}
      <div style={{ marginBottom: 20 }}>
        {venue.priceFrom && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
            <span style={{ fontFamily: FD, fontSize: 29, fontWeight: 700, color: C.gold }}>From {fmtPrice(venue.priceFrom, venue.priceCurrency)}</span>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Stars rating={venue.rating} size={12} />
          <span style={{ fontFamily: FB, fontSize: 13, fontWeight: 700, color: C.text }}>{venue.rating}</span>
          {venue.reviews != null && <span style={{ fontFamily: FB, fontSize: 13, color: C.textLight }}>· {venue.reviews} reviews</span>}
        </div>
        {venue.responseTime && (
          <div style={{ marginTop: 8, fontFamily: FB, fontSize: 12, color: C.green, fontWeight: 600 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="zap" size={13} color={C.green} /> Responds within {venue.responseTime}</span>
          </div>
        )}
      </div>

      <div style={{ height: 1, background: C.border, marginBottom: 20 }} />

      {/* Step progress */}
      {step > 0 && step < 4 && (
        <div style={{ display: "flex", gap: 4, marginBottom: 18 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ flex: 1, height: 3, background: s <= step ? C.gold : C.border, transition: "background 0.3s" }} />
          ))}
        </div>
      )}

      {/* Step content */}
      {step === 0 && (
        <>
          <button onClick={() => setStep(1)} style={{
            width: "100%", padding: "15px 20px",
            background: C.gold, border: "none", borderRadius: "var(--lwd-radius-input)", color: "#fff",
            fontFamily: FB, fontSize: 14, fontWeight: 800, letterSpacing: "1.2px",
            textTransform: "uppercase", cursor: "pointer",
            transition: "all 0.2s",
          }}>Begin Your Enquiry →</button>
          {venue.showcaseUrl && (
            <a href={venue.showcaseUrl}
              onClick={e => { e.preventDefault(); window.history.pushState(null, "", venue.showcaseUrl); window.dispatchEvent(new PopStateEvent('popstate')); }}
              style={{
              display: "block", textAlign: "center", marginTop: 12,
              fontFamily: FB, fontSize: 12, fontWeight: 600,
              color: C.textLight, textDecoration: "none",
              letterSpacing: "0.4px", transition: "color 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.color = C.gold}
              onMouseLeave={e => e.currentTarget.style.color = C.textLight}
            >✦ View Full Showcase →</a>
          )}
        </>
      )}

      {step > 0 && step < 4 && (
        <div style={{ animation: "fadeUp 0.3s ease" }}>
          <div style={{ fontFamily: FD, fontSize: 18, fontWeight: 500, color: C.text, marginBottom: 16 }}>{steps[step - 1].label}</div>
          {steps[step - 1].content}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} style={{
                flex: 1, padding: "11px", border: `1px solid ${C.border2}`, borderRadius: "var(--lwd-radius-input)", background: "none",
                color: C.textLight, fontFamily: FB, fontSize: 13, cursor: "pointer",
              }}>← Back</button>
            )}
            <button onClick={() => step < 3 ? setStep(s => s + 1) : setStep(4)}
              disabled={!canAdvance()}
              style={{
                flex: 2, padding: "11px",
                background: canAdvance() ? C.gold : C.border,
                border: "none", borderRadius: "var(--lwd-radius-input)",
                color: canAdvance() ? "#fff" : C.textMuted,
                fontFamily: FB, fontSize: 13, fontWeight: 700, cursor: canAdvance() ? "pointer" : "not-allowed",
                letterSpacing: "0.5px", transition: "all 0.2s",
              }}>{step < 3 ? "Continue →" : "Send Enquiry →"}</button>
          </div>
          <div style={{ textAlign: "center", marginTop: 12, fontFamily: FB, fontSize: 11, color: C.textMuted }}>
            Step {step} of 3
          </div>
        </div>
      )}

      {step === 4 && (
        <div style={{ textAlign: "center", animation: "fadeUp 0.4s ease", padding: "8px 0" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
          <div style={{ fontFamily: FD, fontSize: 20, color: C.text, marginBottom: 8 }}>Enquiry Sent</div>
          <div style={{ fontFamily: FB, fontSize: 13, color: C.textLight, lineHeight: 1.6 }}>
            Your message has been sent. The venue typically replies within {venue.responseTime}.
          </div>
          <button onClick={() => setStep(0)} style={{
            marginTop: 16, padding: "9px 20px",
            border: `1px solid ${C.border2}`, borderRadius: "var(--lwd-radius-input)", background: "none",
            color: C.textLight, fontFamily: FB, fontSize: 12, cursor: "pointer",
          }}>Make another enquiry</button>
        </div>
      )}

      {/* Activity signal */}
      {step < 4 && (
        <div style={{ marginTop: 16, padding: "10px 14px", background: C.goldLight, border: `1px solid ${C.goldBorder}` }}>
          <div style={{ fontFamily: FB, fontSize: 12, color: C.gold, fontWeight: 600 }}>🔥 3 couples enquired this week</div>
        </div>
      )}

      {/* Save + Compare */}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        {["♡ Save", "⊕ Compare"].map(a => (
          <button key={a} style={{
            flex: 1, padding: "9px", border: `1px solid ${C.border2}`, borderRadius: "var(--lwd-radius-input)", background: "none",
            color: C.textLight, fontFamily: FB, fontSize: 12, cursor: "pointer",
            transition: "all 0.2s",
          }}>{a}</button>
        ))}
      </div>
    </div>
  );
}

// ─── IMAGE GALLERY, Coco-style 3-photo preview ──────────────────────────────
function ImageGallery({ gallery, onOpenLight }) {
  const C = useT();
  const isMobile = useIsMobile();
  const [allOpen, setAllOpen] = useState(false);
  const scrollRef = useRef(null);
  const preview = gallery.slice(0, 6);
  const remaining = gallery.length - 5;

  return (
    <section id="gallery" style={{ marginBottom: 56 }}>
      <SectionHeading title="Gallery" subtitle="16 curated photographs showcasing the venue" />

      {/* ── Mobile: horizontal photo slider ── */}
      {isMobile && !allOpen && (
        <div>
          <div ref={scrollRef} className="vp-gallery-slider" style={{
            display: "flex", gap: 8, overflowX: "auto", scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none",
            marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16,
          }}>
            {preview.map((img, i) => (
              <div key={img.id} onClick={() => onOpenLight(i)} style={{
                flex: "0 0 280px", scrollSnapAlign: "start",
                overflow: "hidden", cursor: "pointer", position: "relative",
                borderRadius: 3, height: 340,
              }}>
                <img src={img.src} alt={img.alt || ""} loading="lazy" style={{
                  width: "100%", height: "100%", objectFit: "cover", display: "block",
                }} />
                {/* Photo number badge */}
                <div style={{
                  position: "absolute", bottom: 10, left: 10,
                  background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)",
                  borderRadius: 20, padding: "3px 10px",
                  fontFamily: FB, fontSize: 10, color: "rgba(255,255,255,0.8)",
                  letterSpacing: "0.5px",
                }}>{i + 1} / {gallery.length}</div>
              </div>
            ))}
            {/* "View all" final card */}
            <div onClick={() => setAllOpen(true)} style={{
              flex: "0 0 180px", scrollSnapAlign: "start",
              borderRadius: 3, height: 340, cursor: "pointer",
              background: C.surface, border: `1px solid ${C.border}`,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <div style={{ fontFamily: FD, fontSize: 36, color: C.gold, fontWeight: 400, lineHeight: 1 }}>+{remaining}</div>
              <div style={{ fontFamily: FB, fontSize: 10, color: C.textMuted, letterSpacing: "1px", textTransform: "uppercase" }}>View all</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop: grid preview ── */}
      {!isMobile && !allOpen && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "auto auto", gap: 6 }}>
            <div onClick={() => onOpenLight(0)} style={{
              gridRow: "1 / 3", overflow: "hidden", cursor: "pointer",
              position: "relative", minHeight: 360,
            }}
              onMouseEnter={e => e.currentTarget.querySelector("img").style.transform = "scale(1.04)"}
              onMouseLeave={e => e.currentTarget.querySelector("img").style.transform = "scale(1)"}>
              <img src={gallery[0]?.src} alt={gallery[0]?.alt || ""} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.7s ease" }} />
            </div>
            <div onClick={() => onOpenLight(1)} style={{ overflow: "hidden", cursor: "pointer", position: "relative", aspectRatio: "4/3" }}
              onMouseEnter={e => e.currentTarget.querySelector("img").style.transform = "scale(1.04)"}
              onMouseLeave={e => e.currentTarget.querySelector("img").style.transform = "scale(1)"}>
              <img src={gallery[1]?.src} alt={gallery[1]?.alt || ""} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.7s ease" }} />
            </div>
            <div onClick={() => setAllOpen(true)} style={{ overflow: "hidden", cursor: "pointer", position: "relative", aspectRatio: "4/3" }}
              onMouseEnter={e => e.currentTarget.querySelector("img").style.transform = "scale(1.04)"}
              onMouseLeave={e => e.currentTarget.querySelector("img").style.transform = "scale(1)"}>
              <img src={gallery[2]?.src} alt={gallery[2]?.alt || ""} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.7s ease" }} />
              <div style={{
                position: "absolute", inset: 0, background: "rgba(0,0,0,0.52)",
                display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6,
              }}>
                <span style={{ fontFamily: FD, fontSize: 32, color: "#fff", fontWeight: 400 }}>+{gallery.length - 3}</span>
                <span style={{ fontFamily: FB, fontSize: 12, color: "rgba(255,255,255,0.85)", letterSpacing: "1px", textTransform: "uppercase" }}>View all photos</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <button onClick={() => setAllOpen(true)} style={{
              background: "none", border: `1px solid ${C.border2}`, borderRadius: "var(--lwd-radius-input)",
              color: C.textLight, fontFamily: FB, fontSize: 12, fontWeight: 600,
              padding: "8px 18px", cursor: "pointer", letterSpacing: "0.3px",
              display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.color = C.textLight; }}>
              View all {gallery.length} photographs →
            </button>
          </div>
        </div>
      )}

      {/* ── Full gallery, masonry ── */}
      {allOpen && (
        <div style={{ animation: "fadeUp 0.4s ease" }}>
          <div style={{ columns: isMobile ? 2 : 3, columnGap: 6, marginBottom: 16 }}>
            {gallery.map((img, i) => (
              <div key={img.id} onClick={() => onOpenLight(i)} style={{
                breakInside: "avoid", marginBottom: 6, overflow: "hidden", cursor: "pointer",
                borderRadius: 2,
              }}
                onMouseEnter={e => e.currentTarget.querySelector("img").style.transform = "scale(1.04)"}
                onMouseLeave={e => e.currentTarget.querySelector("img").style.transform = "scale(1)"}>
                <img src={img.src} alt="" loading="lazy" style={{ width: "100%", display: "block", transition: "transform 0.7s ease" }} />
              </div>
            ))}
          </div>
          <button onClick={() => setAllOpen(false)} style={{
            background: "none", border: `1px solid ${C.border2}`, borderRadius: "var(--lwd-radius-input)",
            color: C.textLight, fontFamily: FB, fontSize: 12,
            padding: "8px 18px", cursor: "pointer",
          }}>← Show less</button>
        </div>
      )}
    </section>
  );
}

// ─── LIGHTBOX ────────────────────────────────────────────────────────────────
function Lightbox({ gallery, idx, onClose, onPrev, onNext, setLightIdx, engagement }) {
  const isMobile = useIsMobile();
  const [autoPlay, setAutoPlay] = useState(false);
  const [hovPrev, setHovPrev]   = useState(false);
  const [hovNext, setHovNext]   = useState(false);
  const [viewAll, setViewAll]   = useState(false);
  const [copied, setCopied]     = useState(false);
  const [likedMap, setLikedMap] = useState({});
  const [commentsMap, setCommentsMap] = useState({});
  const [commentText, setCommentText] = useState("");
  const thumbRef = useRef(null);

  const photo = gallery[idx];
  const pg = photo?.photographer;
  const eng = engagement?.[photo?.id] || { likes: 0, comments: [] };
  const isLiked = likedMap[photo?.id] || false;
  const likeCount = eng.likes + (isLiked ? 1 : 0);
  const allComments = [...(eng.comments || []), ...(commentsMap[photo?.id] || [])];

  // Keyboard nav
  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape") { if (viewAll) setViewAll(false); else onClose(); }
      if (e.key === "ArrowLeft" && !viewAll) onPrev();
      if (e.key === "ArrowRight" && !viewAll) onNext();
      if (e.key === " ") { e.preventDefault(); setAutoPlay((a) => !a); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose, onPrev, onNext, viewAll]);

  // Auto-play slideshow, stop if idx is null (lightbox closed)
  useEffect(() => {
    if (!autoPlay || idx === null) return;
    const timer = setInterval(() => onNext(), 3000);
    return () => clearInterval(timer);
  }, [autoPlay, idx, onNext]);

  // Reset internal state when lightbox is closed
  useEffect(() => {
    if (idx === null) {
      setAutoPlay(false);
      setViewAll(false);
    }
  }, [idx]);

  // Scroll active thumbnail into view, scroll the strip container, not the page
  useEffect(() => {
    if (!thumbRef.current) return;
    const strip = thumbRef.current;
    const active = strip.children[idx];
    if (!active) return;
    const stripRect  = strip.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    const offset = activeRect.left - stripRect.left - (stripRect.width / 2) + (activeRect.width / 2);
    strip.scrollBy({ left: offset, behavior: "smooth" });
  }, [idx]);

  // Copy link to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href + `#photo-${photo.id}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Share via email
  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Photo, ${venue.name || 'Wedding Venue'}`);
    const body = encodeURIComponent(`Check out this photo:\n${photo.alt || ""}\n\nPhotographer: ${pg?.name || "Unknown"}\n${window.location.href}#photo-${photo.id}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  // Share via Pinterest
  const handlePinterestShare = () => {
    const url = encodeURIComponent(window.location.href);
    const media = encodeURIComponent(photo.src);
    const desc = encodeURIComponent(`${photo.alt || "Villa Rosanova"}, Photo by ${pg?.name || ""}`);
    window.open(`https://pinterest.com/pin/create/button/?url=${url}&media=${media}&description=${desc}`, "_blank", "width=600,height=400");
  };

  // Share via Facebook
  const handleFacebookShare = () => {
    const url = encodeURIComponent(window.location.href + `#photo-${photo.id}`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank", "width=600,height=400");
  };

  // Share via Instagram (copy link + open Instagram)
  const handleInstagramShare = () => {
    navigator.clipboard.writeText(`${photo.alt || "Villa Rosanova"}, Photo by ${pg?.name || ""}\n${window.location.href}#photo-${photo.id}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      window.open("https://www.instagram.com/", "_blank");
    });
  };

  if (idx === null) return null;

  const navBtn = (dir, hov, setHov) => (
    <button
      onClick={(e) => { e.stopPropagation(); dir === "prev" ? onPrev() : onNext(); }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      aria-label={dir === "prev" ? "Previous photo" : "Next photo"}
      style={{
        position: "absolute", top: "50%", transform: "translateY(-50%)",
        [dir === "prev" ? "left" : "right"]: 16,
        width: 44, height: 44, borderRadius: "50%",
        background: hov ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.4)",
        border: `1px solid ${hov ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.12)"}`,
        backdropFilter: "blur(4px)",
        color: hov ? "#fff" : "rgba(255,255,255,0.7)",
        cursor: "pointer", fontSize: 18,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s", zIndex: 10,
      }}
    >
      {dir === "prev" ? "‹" : "›"}
    </button>
  );

  // Small share button helper
  const shareBtn = (label, icon, onClick, hov) => (
    <button
      onClick={onClick}
      style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
        padding: "7px 0", background: "none",
        border: "1px solid rgba(255,255,255,0.1)", borderRadius: "var(--lwd-radius-input)",
        color: "rgba(255,255,255,0.5)", fontFamily: FB, fontSize: 10,
        fontWeight: 600, letterSpacing: "0.4px", cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.color = "#fff"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
    >
      <span style={{ fontSize: 12 }}>{icon}</span> {label}
    </button>
  );

  // View All grid overlay
  if (viewAll) {
    return (
      <div style={{
        position: "fixed", inset: 0, background: "rgba(5,4,3,0.97)", zIndex: 2000,
        overflow: "auto", padding: "60px 40px 40px",
      }}>
        {/* Header */}
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 10,
          padding: "16px 40px", background: "rgba(5,4,3,0.92)", backdropFilter: "blur(8px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ fontFamily: FD, fontSize: 18, color: "#f5f2ec" }}>
            All Photos <span style={{ fontFamily: FB, fontSize: 12, color: "rgba(255,255,255,0.4)", marginLeft: 8 }}>{gallery.length} photographs</span>
          </div>
          <button onClick={() => setViewAll(false)} aria-label="Close grid view"
            style={{
              background: "none", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "var(--lwd-radius-input)",
              color: "rgba(255,255,255,0.55)", width: 34, height: 34, cursor: "pointer",
              fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
        </div>
        {/* Grid */}
        <div style={{ columns: 4, columnGap: 8 }}>
          {gallery.map((img, i) => (
            <div key={img.id} onClick={() => { setViewAll(false); setLightIdx?.(i); }}
              style={{ breakInside: "avoid", marginBottom: 8, cursor: "pointer", position: "relative", overflow: "hidden" }}
            >
              <img src={img.src} alt={img.alt || ""} style={{ width: "100%", display: "block", transition: "transform 0.5s, opacity 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.opacity = "0.85"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.opacity = "1"; }}
              />
              {/* Tags overlay on hover */}
              {img.tags && (
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  padding: "24px 8px 6px", background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                  display: "flex", flexWrap: "wrap", gap: 3, opacity: 0, transition: "opacity 0.3s",
                }}
                  className="lwd-tag-overlay"
                >
                  {img.tags.slice(0, 3).map(t => (
                    <span key={t} style={{
                      fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.8)",
                      background: "rgba(255,255,255,0.12)", padding: "2px 6px",
                      borderRadius: "var(--lwd-radius-input)", letterSpacing: "0.3px",
                    }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div onClick={onClose} onMouseDown={e => { if (e.target.tagName === "BUTTON" || e.target.closest("button")) e.preventDefault(); }} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.96)", zIndex: 2000,
      display: "flex", flexDirection: "column",
    }}>
      {/* Top bar */}
      <div onClick={(e) => e.stopPropagation()} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: FD, fontSize: 16, color: "#f5f2ec" }}>
            {idx + 1} <span style={{ color: "rgba(255,255,255,0.3)" }}>/ {gallery.length}</span>
          </span>
          {pg && <span style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>📷 {pg.name}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Auto-play toggle, hidden on mobile */}
          {!isMobile && (
            <button onClick={() => setAutoPlay((a) => !a)}
              style={{
                background: autoPlay ? "rgba(201,168,76,0.12)" : "none",
                border: `1px solid ${autoPlay ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.15)"}`,
                borderRadius: "var(--lwd-radius-input)", color: autoPlay ? "#C9A84C" : "rgba(255,255,255,0.5)",
                padding: "6px 14px", cursor: "pointer", fontFamily: FB, fontSize: 11,
                fontWeight: 600, letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: 6,
                transition: "all 0.2s",
              }}
            >
              {autoPlay ? "❚❚" : "▶"} {autoPlay ? "Pause" : "Slideshow"}
            </button>
          )}
          {/* View All, hidden on mobile */}
          {!isMobile && (
            <button onClick={() => setViewAll(true)}
              style={{
                background: "none", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "var(--lwd-radius-input)",
                color: "rgba(255,255,255,0.5)", padding: "6px 14px", cursor: "pointer",
                fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: "0.5px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
            >
              ⊞ View All
            </button>
          )}
          {/* Close */}
          <button onClick={onClose} aria-label="Close gallery"
            style={{
              background: "none", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "var(--lwd-radius-input)",
              color: "rgba(255,255,255,0.55)", width: 34, height: 34, cursor: "pointer",
              fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#C9A84C"; e.currentTarget.style.color = "#C9A84C"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
          >✕</button>
        </div>
      </div>

      {/* Main content: image + info panel */}
      <div onClick={(e) => e.stopPropagation()} style={{
        flex: 1, display: "flex", flexDirection: isMobile ? "column" : "row",
        minHeight: 0, overflow: isMobile ? "auto" : "hidden",
      }}>
        {/* Image area */}
        <div onClick={onClose} style={{
          flex: isMobile ? "none" : 1, display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", overflow: "hidden", minWidth: 0,
          minHeight: isMobile ? "50vh" : undefined,
        }}>
          <img
            key={idx}
            src={photo.src}
            alt={photo.alt || ""}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: "100%", maxWidth: "100%", objectFit: "contain",
              animation: "fadeIn 0.3s ease",
            }}
          />
          {/* Nav arrows, on mobile show smaller inline arrows */}
          {isMobile ? (
            <>
              <button onClick={(e) => { e.stopPropagation(); onPrev(); }} style={{
                position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
                width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.5)",
                border: "none", color: "#fff", fontSize: 16, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>‹</button>
              <button onClick={(e) => { e.stopPropagation(); onNext(); }} style={{
                position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.5)",
                border: "none", color: "#fff", fontSize: 16, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>›</button>
            </>
          ) : (
            <>
              {navBtn("prev", hovPrev, setHovPrev)}
              {navBtn("next", hovNext, setHovNext)}
            </>
          )}

          {/* Auto-play progress bar */}
          {autoPlay && (
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
              background: "rgba(255,255,255,0.08)",
            }}>
              <div style={{
                height: "100%", background: "#C9A84C",
                animation: "lightbox-progress 3s linear infinite",
              }} />
            </div>
          )}
        </div>

        {/* ── Info panel (right on desktop, below on mobile) ── */}
        <div style={{
          width: isMobile ? "100%" : 280, flexShrink: 0,
          borderLeft: isMobile ? "none" : "1px solid rgba(255,255,255,0.06)",
          borderTop: isMobile ? "1px solid rgba(255,255,255,0.06)" : "none",
          background: "rgba(10,8,6,0.6)", backdropFilter: "blur(8px)",
          display: "flex", flexDirection: "column",
          overflowY: "auto", padding: isMobile ? "16px 16px 40px" : "20px 18px",
        }}>
          {/* Image description */}
          {photo.alt && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 6 }}>Description</div>
              <div style={{ fontFamily: FB, fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, fontWeight: 300 }}>{photo.alt}</div>
            </div>
          )}

          {/* Photographer details */}
          {pg && (
            <div style={{
              marginBottom: 20, padding: "14px 12px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "var(--lwd-radius-card)",
            }}>
              <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 10 }}>Photographer</div>
              <div style={{ fontFamily: FD, fontSize: 16, color: "#f5f2ec", marginBottom: 3 }}>{pg.name}</div>
              <div style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}><Icon name="pin" size={11} color="rgba(255,255,255,0.45)" /> {pg.area}</div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {pg.instagram && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="culture" size={11} color="rgba(255,255,255,0.5)" />
                    <span style={{ fontFamily: FB, fontSize: 11, color: "#C9A84C" }}>{pg.instagram}</span>
                  </div>
                )}
                {pg.website && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="globe" size={11} color="rgba(255,255,255,0.5)" />
                    <span style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{pg.website}</span>
                  </div>
                )}
                {pg.camera && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, opacity: 0.5 }}>📷</span>
                    <span style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{pg.camera}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags for AI search */}
          {photo.tags && photo.tags.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>Tags</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {photo.tags.map(t => (
                  <span key={t} style={{
                    fontFamily: FB, fontSize: 10, color: "rgba(255,255,255,0.55)",
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                    padding: "3px 8px", borderRadius: "var(--lwd-radius-input)", letterSpacing: "0.3px",
                    transition: "all 0.2s", cursor: "default",
                  }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Sharing options */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>Share</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {shareBtn(copied ? "Copied!" : "Copy", "📋", handleCopyLink)}
              {shareBtn("Pin", "📌", handlePinterestShare)}
              {shareBtn("Email", "✉", handleEmailShare)}
              {shareBtn("Facebook", "📘", handleFacebookShare)}
              {shareBtn("Instagram", "📷", handleInstagramShare)}
            </div>
          </div>

          {/* ── Appreciations & Reflections ── */}
          <div style={{ marginBottom: 20 }}>
            {/* Appreciation + reflection count */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <button onClick={() => setLikedMap(m => ({ ...m, [photo.id]: !m[photo.id] }))}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: isLiked ? "rgba(201,168,76,0.08)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isLiked ? "rgba(201,168,76,0.25)" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: "var(--lwd-radius-input)", padding: "6px 12px", cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <span style={{ fontSize: 13, transition: "transform 0.2s", transform: isLiked ? "scale(1.15)" : "scale(1)" }}>{isLiked ? "❤️" : "🤍"}</span>
                <span style={{ fontFamily: FB, fontSize: 10, fontWeight: 600, color: isLiked ? "#C9A84C" : "rgba(255,255,255,0.45)", letterSpacing: "0.3px" }}>
                  {likeCount} {likeCount === 1 ? "Appreciation" : "Appreciations"}
                </span>
              </button>
              {allComments.length > 0 && (
                <span style={{ fontFamily: FB, fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.3px" }}>
                  {allComments.length} {allComments.length === 1 ? "Reflection" : "Reflections"}
                </span>
              )}
            </div>

            {/* Reflection input */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>Share Your Reflection</div>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your reflection on this moment..."
                style={{
                  width: "100%", minHeight: 52, resize: "vertical",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "var(--lwd-radius-input)", padding: "10px 12px",
                  fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.65)",
                  lineHeight: 1.6, outline: "none", fontStyle: "italic",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"; e.currentTarget.style.fontStyle = "normal"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; if (!commentText) e.currentTarget.style.fontStyle = "italic"; }}
              />
              {commentText.trim() && (
                <button
                  onClick={() => {
                    if (!commentText.trim()) return;
                    setCommentsMap(m => ({
                      ...m,
                      [photo.id]: [...(m[photo.id] || []), { name: "You", text: commentText.trim(), date: new Date().toISOString().slice(0, 10) }],
                    }));
                    setCommentText("");
                  }}
                  style={{
                    marginTop: 6, width: "100%", padding: "8px 0",
                    background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)",
                    borderRadius: "var(--lwd-radius-input)", cursor: "pointer",
                    fontFamily: FB, fontSize: 10, fontWeight: 600,
                    color: "#C9A84C", letterSpacing: "0.8px", textTransform: "uppercase",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(201,168,76,0.12)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(201,168,76,0.06)"; }}
                >
                  Share Reflection
                </button>
              )}
            </div>

            {/* Curated Reflections */}
            {allComments.length > 0 && (
              <div>
                <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 10 }}>
                  Curated Reflections
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 180, overflowY: "auto" }}>
                  {allComments.map((c, ci) => (
                    <div key={ci} style={{
                      padding: "10px 12px",
                      borderLeft: "2px solid rgba(201,168,76,0.25)",
                      background: "rgba(255,255,255,0.015)",
                    }}>
                      <div style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, fontStyle: "italic", fontWeight: 300 }}>
                        "{c.text}"
                      </div>
                      <div style={{ fontFamily: FB, fontSize: 10, color: "rgba(201,168,76,0.5)", marginTop: 6, fontWeight: 600 }}>
                       , {c.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Image meta */}
          <div style={{
            marginTop: "auto", paddingTop: 14,
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>Image Info</div>
            <div style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.7 }}>
              Photo {idx + 1} of {gallery.length}<br />
              {pg ? `© ${pg.name}` : "Villa Rosanova"}
            </div>
          </div>
        </div>
      </div>

      {/* Thumbnail strip */}
      <div onClick={(e) => e.stopPropagation()} style={{
        flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "8px 12px", overflow: "hidden",
      }}>
        <div ref={thumbRef} className="lwd-thumb-strip" style={{
          display: "flex", gap: 4, overflowX: "auto",
          scrollbarWidth: "none", msOverflowStyle: "none",
        }}>
          {gallery.map((img, i) => (
            <div
              key={img.id}
              onClick={() => setLightIdx?.(i)}
              style={{
                flexShrink: 0, width: 72, height: 48, cursor: "pointer",
                border: i === idx ? "2px solid #C9A84C" : "2px solid transparent",
                opacity: i === idx ? 1 : 0.4,
                transition: "all 0.2s", overflow: "hidden",
              }}
              onMouseEnter={(e) => { if (i !== idx) e.currentTarget.style.opacity = "0.7"; }}
              onMouseLeave={(e) => { if (i !== idx) e.currentTarget.style.opacity = "0.4"; }}
            >
              <img src={img.src} alt={img.alt || img.title || ""} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ABOUT SECTION ────────────────────────────────────────────────────────────
function AboutSection({ venue, isDbVenue = false }) {
  const C = useT();
  const [expanded, setExpanded] = useState(false);
  const isMobile = useIsMobile();

  return (
    <section id="overview" style={{ marginBottom: 56 }}>
      <SectionHeading title={`About ${venue.name}`} />

      {/* Single-column editorial layout */}
      <div>

        {/* Intro paragraph, uses DB short_description when available */}
        <p style={{ fontFamily: FB, fontSize: isMobile ? 15 : 16, color: C.textMid, lineHeight: 1.9, marginBottom: 28, maxWidth: 780 }}>
          {venue.description || venue.tagline || "Set within 120 acres of rolling Tuscan countryside, Villa Rosanova is one of the finest privately-owned estates in Italy. Built in 1847 for the Marchese di Rosanova, the property has been meticulously restored to its original grandeur while offering every modern comfort a discerning couple could wish for."}
        </p>

        {/* Full description, DB venues: always shown inline, no read more gate */}
        {isDbVenue && venue.fullDescription && (
          <div
            className="ldw-prose-body"
            style={{ fontFamily: FB, fontSize: isMobile ? 14 : 15, color: C.textLight, lineHeight: 1.9, marginBottom: 28, maxWidth: 780 }}
            dangerouslySetInnerHTML={{ __html: venue.fullDescription }}
          />
        )}

        {/* Second paragraph, static Villa Rosanova content, only on /venue */}
        {!isDbVenue && (
        <p style={{ fontFamily: FB, fontSize: isMobile ? 14 : 15, color: C.textLight, lineHeight: 1.9, marginBottom: 16, maxWidth: 780 }}>
          From the frescoed Grand Salon, with its original parquet floors and three Venetian chandeliers, to the centuries-old cypress garden, every space has been designed to create moments of extraordinary beauty. With accommodation for 58 guests across 24 rooms and 6 suites, Villa Rosanova is the perfect setting for multi-day wedding celebrations.
        </p>
        )}

        {/* Expandable paragraphs, static Villa Rosanova content, only on /venue */}
        {!isDbVenue && (
        <div style={{ overflow: "hidden", maxHeight: expanded ? 500 : 0, transition: "max-height 0.5s ease", maxWidth: 780 }}>
          <p style={{ fontFamily: FB, fontSize: isMobile ? 14 : 15, color: C.textLight, lineHeight: 1.9, marginBottom: 16 }}>
            The estate produces its own Chianti Classico wine, cold-pressed extra virgin olive oil, and seasonal truffles, all of which feature on our exclusively crafted wedding menus. Every detail of your celebration is managed by our dedicated events team, who have hosted over 300 weddings across four decades.
          </p>
          <p style={{ fontFamily: FB, fontSize: isMobile ? 14 : 15, color: C.textLight, lineHeight: 1.9 }}>
            Villa Rosanova has been featured in Vogue, Tatler and Harper's Bazaar, and has received the Luxury Wedding Directory's Best Villa award three years in succession. For couples seeking a truly once-in-a-lifetime setting, where privacy, beauty and impeccable service converge, there is simply nowhere quite like it.
          </p>
        </div>
        )}

        {!isDbVenue && (
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            marginTop: 4, marginBottom: 32,
            background: "none", border: "none",
            fontFamily: FB, fontSize: 13, fontWeight: 700,
            color: C.gold, cursor: "pointer", letterSpacing: "0.3px",
            padding: 0,
          }}
        >
          {expanded ? "Show less ↑" : "Read the full story →"}
        </button>
        )}

        {/* Awards, horizontal scroll on mobile */}
        {venue.awards?.length > 0 && (
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, marginBottom: 16 }}>
          <div style={{ fontFamily: FB, fontSize: 9, color: C.textMuted, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 12 }}>Awards & Recognition</div>
          <div className="vp-awards-scroll" style={{
            display: "flex", gap: 8, overflowX: isMobile ? "auto" : "visible",
            flexWrap: isMobile ? "nowrap" : "wrap",
            scrollbarWidth: "none", msOverflowStyle: "none",
            paddingBottom: isMobile ? 4 : 0,
          }}>
            {venue.awards.map(a => (
              <div key={a} style={{
                flex: "0 0 auto",
                padding: "8px 14px",
                border: `1px solid ${C.gold}30`,
                background: `${C.gold}08`,
                borderRadius: 3,
                fontFamily: FB, fontSize: 11, fontWeight: 600,
                color: C.gold, letterSpacing: "0.3px", whiteSpace: "nowrap",
              }}>
                ✦ {a}
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Press */}
        {venue.press?.length > 0 && (
        <div>
          <div style={{ fontFamily: FB, fontSize: 9, color: C.textMuted, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 12 }}>As Seen In</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            {venue.press.map(p => (
              <span key={p} style={{
                fontFamily: FD, fontSize: isMobile ? 15 : 17, fontWeight: 400,
                color: C.textLight, letterSpacing: "0.5px",
              }}>{p}</span>
            ))}
          </div>
        </div>
        )}

      </div>
    </section>
  );
}

// ─── CONTACT SECTION ─────────────────────────────────────────────────────────
function ContactSection({ venue }) {
  const C = useT();
  const [emailRevealed, setEmailRevealed] = useState(false);
  const [mapLoaded, setMapLoaded]         = useState(false);
  const [exitConfig, setExitConfig]       = useState(null);
  if (!venue.contact) return null;

  const handleWebsiteClick = () => {
    const url = toAbsoluteUrl(venue.contact.website);
    const trackData = { entityType: 'venue', entityId: venue.id, venueId: venue.id, linkType: 'website', url };
    if (!hasSeenModalThisSession(url)) {
      setExitConfig({ url, name: venue.name });
    } else {
      trackExternalClick(trackData);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };
  const addr = venue.contact.address || {};
  const rm   = venue.contact.responseMetrics || {};

  const contactRow = (iconName, label, content, props = {}) => {
    const Tag = props.href ? "a" : "div";
    return (
      <Tag {...(props.href ? { href: props.href, target: props.target, rel: props.rel } : {})}
        style={{
          padding: "18px 20px", display: "flex", gap: 14, alignItems: "center",
          textDecoration: "none", transition: "background 0.2s",
          borderBottom: props.last ? "none" : `1px solid ${C.border}`,
          ...(props.topAlign ? { alignItems: "flex-start" } : {}),
        }}
        onMouseEnter={props.href ? (e => e.currentTarget.style.background = C.bgAlt) : undefined}
        onMouseLeave={props.href ? (e => e.currentTarget.style.background = "transparent") : undefined}
      >
        <Icon name={iconName} size={18} color={C.textMuted} style={props.topAlign ? { marginTop: 2 } : {}} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
          {content}
        </div>
      </Tag>
    );
  };

  const addressFormatted = [addr.line1, addr.city, `${addr.postcode} ${addr.region}`, addr.country].join(", ");

  // Clean location label (deduplicate city/region if same)
  const locationParts = [addr.city, addr.region, addr.country]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i); // dedupe
  const locationLabel = locationParts.join(", ");

  // Travel context — nearest airport if available
  const nearestAirport = venue.access?.nearestAirport;

  // Google Maps links — embed + external
  const rawQuery  = venue.contact.mapQuery?.replace(/\+/g, " ") || locationLabel;
  const embedSrc  = `https://maps.google.com/maps?q=${encodeURIComponent(rawQuery)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
  const mapsLink  = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rawQuery)}`;

  return (
    <section style={{ marginBottom: 56 }}>
      <SectionHeading title="Contact & Location" subtitle="Find us and plan your journey" />
      <div className="vp-contact-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>

        {/* ── Contact details ── */}
        <div style={{ display: "flex", flexDirection: "column", height: 400 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 0, border: `1px solid ${C.border}`, overflow: "hidden", flex: 1 }}>
            {addressFormatted && contactRow("pin", "Address",
              <div style={{ fontFamily: FB, fontSize: 14, color: C.textMid, lineHeight: 1.6 }}>{addressFormatted}</div>,
              { topAlign: true }
            )}
            {venue.contact.phone && contactRow("phone", "Phone",
              <div style={{ fontFamily: FB, fontSize: 15, color: C.gold, fontWeight: 600 }}>{venue.contact.phone}</div>,
              { href: `tel:${venue.contact.phone}` }
            )}
            {venue.contact.email && contactRow("email", "Email",
              emailRevealed
                ? <a href={`mailto:${venue.contact.email}`} style={{ fontFamily: FB, fontSize: 14, color: C.gold, textDecoration: "none" }}>{venue.contact.email}</a>
                : <button onClick={() => setEmailRevealed(true)} style={{
                    background: "none", border: `1px solid ${C.border2}`, borderRadius: "var(--lwd-radius-input)",
                    color: C.textLight, fontFamily: FB, fontSize: 12, padding: "5px 12px",
                    cursor: "pointer", letterSpacing: "0.3px",
                  }}>Click to reveal email</button>
            )}
            {venue.contact.website && (
              <div
                onClick={handleWebsiteClick}
                style={{
                  padding: "18px 20px", display: "flex", gap: 14, alignItems: "center",
                  cursor: "pointer", transition: "background 0.2s",
                  borderBottom: `1px solid ${C.border}`,
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.bgAlt}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <Icon name="globe" size={15} color={C.textMuted} />
                <div>
                  <div style={{ fontFamily: FB, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.textMuted, marginBottom: 3 }}>Website</div>
                  <div style={{ fontFamily: FB, fontSize: 14, color: C.gold, fontWeight: 600 }}>{venue.contact.website}</div>
                </div>
              </div>
            )}

            {/* ── Social media links ── */}
            {(() => {
              const s = venue.contact?.social || {};
              const links = [
                { key: 'instagram', label: 'Instagram', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' },
                { key: 'facebook', label: 'Facebook', icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
                { key: 'linkedin', label: 'LinkedIn', icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
                { key: 'tiktok', label: 'TikTok', icon: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z' },
                { key: 'twitter', label: 'X (Twitter)', icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
                { key: 'pinterest', label: 'Pinterest', icon: 'M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z' },
                { key: 'youtube', label: 'YouTube', icon: 'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
              ].filter(l => s[l.key]);
              if (!links.length) return null;
              return (
                <div style={{ padding: "16px 20px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontFamily: FB, fontSize: 10, color: C.textMuted, letterSpacing: "0.7px", textTransform: "uppercase", marginRight: 4 }}>Follow</span>
                  {links.map(l => (
                    <button key={l.key} onClick={() => {
                      trackExternalClick({ entityType: 'venue', entityId: venue.id, venueId: venue.id, linkType: l.key, url: s[l.key] });
                      window.open(s[l.key], '_blank', 'noopener,noreferrer');
                    }} title={l.label}
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: C.textMuted, transition: "color 0.2s", display: "flex" }}
                      onMouseEnter={e => e.currentTarget.style.color = C.gold}
                      onMouseLeave={e => e.currentTarget.style.color = C.textMuted}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ display: "block" }}>
                        <path d={l.icon} />
                      </svg>
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>

          {rm.averageResponseHours && (
            <div style={{ marginTop: 14, padding: "12px 16px", background: C.goldLight, border: `1px solid ${C.goldBorder}`, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <Icon name="zap" size={14} color={C.gold} style={{ marginTop: 1 }} />
              <div>
                <div style={{ fontFamily: FB, fontSize: 12, color: C.gold, fontWeight: 600, marginBottom: 3 }}>Responds within {rm.averageResponseHours} hrs</div>
                <div style={{ fontFamily: FB, fontSize: 12, color: C.textLight }}>
                  {rm.responseRatePercent}% response rate{rm.sameDayTypical ? " · Typically replies same day" : ""}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Map column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

          {/* Location descriptor */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="pin" size={13} color={C.gold} />
              <span style={{ fontFamily: FB, fontSize: 13, color: C.textMid, fontWeight: 500 }}>
                {locationLabel || venue.location}
              </span>
              {nearestAirport && (
                <span style={{ fontFamily: FB, fontSize: 12, color: C.textMuted }}>
                  · {nearestAirport} nearest airport{venue.access?.transferTime ? ` · ${venue.access.transferTime} transfer` : ''}
                </span>
              )}
            </div>
            <a
              href={mapsLink} target="_blank" rel="noopener noreferrer"
              style={{ fontFamily: FB, fontSize: 11, color: C.gold, textDecoration: "none", letterSpacing: "0.3px", display: "flex", alignItems: "center", gap: 4, transition: "opacity 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.72"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              View in Google Maps ↗
            </a>
          </div>

          {/* Map container — fixed height so iframe always renders */}
          <div style={{
            position: "relative", height: 400, overflow: "hidden",
            border: `1px solid ${C.border}`,
            borderRadius: "var(--lwd-radius-input)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            background: C.bgAlt,
          }}>
            {/* Loading shimmer — hidden once map fires onLoad */}
            {!mapLoaded && (
              <div style={{
                position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 12,
                background: C.bgAlt,
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill={C.gold} opacity="0.4"/>
                </svg>
                <span style={{ fontFamily: FB, fontSize: 12, color: C.textMuted, letterSpacing: "0.3px" }}>Loading map…</span>
              </div>
            )}
            <iframe
              title="Venue location"
              width="100%"
              height="400"
              style={{ display: "block", border: "none", opacity: mapLoaded ? 1 : 0, transition: "opacity 0.4s ease" }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={embedSrc}
              onLoad={() => setMapLoaded(true)}
            />
          </div>
        </div>

      </div>

      {exitConfig && (
        <ExternalLinkModal
          name={exitConfig.name}
          url={exitConfig.url}
          onClose={() => setExitConfig(null)}
          onContinue={() => {
            markModalSeen(exitConfig.url);
            trackExternalClick({ entityType: 'venue', entityId: venue.id, venueId: venue.id, linkType: 'website', url: exitConfig.url });
          }}
        />
      )}
    </section>
  );
}

// ─── VIDEO PLAY MODAL ─────────────────────────────────────────────────────────
function VideoPlayModal({ video, videos = [], onSelect, onClose, engagement }) {
  const isMobile = useIsMobile();
  const [hovPrev, setHovPrev] = useState(false);
  const [hovNext, setHovNext] = useState(false);
  const [copied, setCopied]   = useState(false);
  const [likedMap, setLikedMap]       = useState({});
  const [commentsMap, setCommentsMap] = useState({});
  const [commentText, setCommentText] = useState("");
  const [ytPaused, setYtPaused]       = useState(false);
  const [resolvedEmbedUrl, setResolvedEmbedUrl] = useState(null);

  const idx = videos.findIndex((v) => v.id === video.id);
  const hasPrev = idx > 0;
  const hasNext = idx < videos.length - 1;
  const vg = video.videographer;
  const eng = engagement?.[video.id] || { likes: 0, comments: [] };
  const isLiked = likedMap[video.id] || false;
  const likeCount = eng.likes + (isLiked ? 1 : 0);
  const allComments = [...(eng.comments || []), ...(commentsMap[video.id] || [])];

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const embedUrl = video.youtubeId
    ? `https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&showinfo=0&controls=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(origin)}`
    : video.vimeoId
    ? `https://player.vimeo.com/video/${video.vimeoId}?autoplay=1&title=0&byline=0&portrait=0&dnt=1${video.vimeoHash ? `&h=${video.vimeoHash}` : ''}`
    : null;

  // For Vimeo URLs without a numeric ID (e.g. vimeo.com/user/slug), resolve via oEmbed
  const isVimeoUrl = !video.youtubeId && !video.vimeoId && video.url?.includes('vimeo.com');
  useEffect(() => {
    if (!isVimeoUrl || !video.url) return;
    setResolvedEmbedUrl(null);
    fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(video.url)}&autoplay=1`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.video_id) return;
        const hash = data.uri?.split('/').find(p => /^[a-f0-9]{8,}$/i.test(p)) || null;
        const url = `https://player.vimeo.com/video/${data.video_id}?autoplay=1&title=0&byline=0&portrait=0&dnt=1${hash ? `&h=${hash}` : ''}`;
        setResolvedEmbedUrl(url);
      })
      .catch(() => {});
  }, [video.url, isVimeoUrl]);

  const activeEmbedUrl = embedUrl || resolvedEmbedUrl;

  const iframeRef = useRef(null);

  // Reset paused overlay and resolved URL when video changes
  useEffect(() => { setYtPaused(false); setResolvedEmbedUrl(null); }, [video.id]);

  // Stop video playback on unmount (prevents audio continuing after modal closes)
  useEffect(() => {
    const iframe = iframeRef.current;
    return () => {
      try {
        if (iframe) {
          iframe.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*'
          );
          // Clear src as nuclear fallback to guarantee playback stops
          iframe.src = '';
        }
      } catch (_) {}
    };
  }, []);

  // Keyboard nav
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onSelect?.(videos[idx - 1]);
      if (e.key === "ArrowRight" && hasNext) onSelect?.(videos[idx + 1]);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, hasPrev, hasNext, idx, videos, onSelect]);

  // Listen for YouTube video end → auto-play next
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !video.youtubeId) return;

    // Tell YouTube we're listening for events
    const onLoad = () => {
      try {
        iframe.contentWindow.postMessage(JSON.stringify({ event: "listening" }), "*");
        iframe.contentWindow.postMessage(JSON.stringify({ event: "command", func: "addEventListener", args: ["onStateChange"] }), "*");
      } catch (_) {}
    };
    iframe.addEventListener("load", onLoad);

    // Listen for state change messages from YouTube
    const onMessage = (e) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (data.event === "onStateChange") {
          // YouTube state: 0=ended, 1=playing, 2=paused
          if (data.info === 0 && hasNext) {
            onSelect?.(videos[idx + 1]);
          }
          setYtPaused(data.info === 2 || data.info === 0);
          if (data.info === 1) setYtPaused(false);
        }
      } catch (_) {}
    };
    window.addEventListener("message", onMessage);
    return () => {
      iframe.removeEventListener("load", onLoad);
      window.removeEventListener("message", onMessage);
    };
  }, [video.youtubeId, hasNext, idx, videos, onSelect]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href + `#film-${video.id}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Video, ${video.title}`);
    const body = encodeURIComponent(`Check out this film:\n${video.title}\n\nFilmed by: ${vg?.name || "Unknown"}\n${window.location.href}#film-${video.id}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  // Share via Facebook
  const handleFacebookShare = () => {
    const url = encodeURIComponent(window.location.href + `#film-${video.id}`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank", "width=600,height=400");
  };

  // Share via Instagram (copy link + open Instagram)
  const handleInstagramShare = () => {
    navigator.clipboard.writeText(`${video.title}, Filmed by ${vg?.name || ""}\n${window.location.href}#film-${video.id}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      window.open("https://www.instagram.com/", "_blank");
    });
  };

  // Share via Pinterest
  const handlePinterestShare = () => {
    const url = encodeURIComponent(window.location.href + `#film-${video.id}`);
    const media = encodeURIComponent(video.thumb);
    const desc = encodeURIComponent(`${video.title}, Filmed by ${vg?.name || ""} at Villa Rosanova`);
    window.open(`https://pinterest.com/pin/create/button/?url=${url}&media=${media}&description=${desc}`, "_blank", "width=600,height=400");
  };

  const navBtn = (dir, enabled, hov, setHov) => (
    <button
      onClick={() => enabled && onSelect?.(videos[dir === "prev" ? idx - 1 : idx + 1])}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      aria-label={dir === "prev" ? "Previous video" : "Next video"}
      style={{
        position: "absolute", top: "50%", transform: "translateY(-50%)",
        [dir === "prev" ? "left" : "right"]: -52,
        width: 40, height: 40, borderRadius: "50%",
        background: hov ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
        border: `1px solid ${hov ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.12)"}`,
        color: enabled ? (hov ? "#fff" : "rgba(255,255,255,0.6)") : "rgba(255,255,255,0.15)",
        cursor: enabled ? "pointer" : "default",
        fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s",
      }}
    >
      {dir === "prev" ? "‹" : "›"}
    </button>
  );

  const shareBtn = (label, icon, onClick) => (
    <button onClick={onClick}
      style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
        padding: "7px 0", background: "none",
        border: "1px solid rgba(255,255,255,0.1)", borderRadius: "var(--lwd-radius-input)",
        color: "rgba(255,255,255,0.5)", fontFamily: FB, fontSize: 10,
        fontWeight: 600, letterSpacing: "0.4px", cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.color = "#fff"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
    >
      <span style={{ fontSize: 12 }}>{icon}</span> {label}
    </button>
  );

  return (
    <div
      onClick={onClose}
      onMouseDown={e => { if (e.target.tagName === "BUTTON" || e.target.closest("button")) e.preventDefault(); }}
      role="dialog" aria-modal="true" aria-label={`Play ${video.title}`}
      style={{
        position: "fixed", inset: 0, zIndex: 3000,
        background: "rgba(0,0,0,0.96)",
        display: "flex", flexDirection: "column",
      }}
    >
      {/* Top bar */}
      <div onClick={(e) => e.stopPropagation()} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: FD, fontSize: 16, color: "#f5f2ec" }}>
            {idx + 1} <span style={{ color: "rgba(255,255,255,0.3)" }}>/ {videos.length}</span>
          </span>
          {vg && <span style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>🎬 {vg.name}</span>}
        </div>
        <button onClick={onClose} aria-label="Close video"
          style={{
            background: "none", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "var(--lwd-radius-input)",
            color: "rgba(255,255,255,0.55)", width: 34, height: 34, cursor: "pointer",
            fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s", flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#C9A84C"; e.currentTarget.style.color = "#C9A84C"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
        >✕</button>
      </div>

      {/* Main content: video + info panel */}
      <div onClick={(e) => e.stopPropagation()} style={{
        flex: 1, display: "flex", flexDirection: isMobile ? "column" : "row",
        minHeight: 0, overflow: isMobile ? "auto" : "hidden",
      }}>
        {/* Video area */}
        <div style={{ flex: isMobile ? "none" : 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative" }}>
          {/* Prev / Next arrows, hidden on mobile */}
          {!isMobile && videos.length > 1 && navBtn("prev", hasPrev, hovPrev, setHovPrev)}
          {!isMobile && videos.length > 1 && navBtn("next", hasNext, hovNext, setHovNext)}

          {/* Video player */}
          {activeEmbedUrl ? (
            <div style={{
              flex: isMobile ? "none" : 1,
              position: "relative",
              background: "#000",
              ...(isMobile ? { width: "100%", aspectRatio: "16/9" } : {}),
            }}>
              <iframe
                ref={iframeRef}
                key={activeEmbedUrl + video.id}
                src={activeEmbedUrl}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title={video.title}
              />
              {/* Overlay to block YouTube "More videos" suggestions when paused */}
              {ytPaused && (
                <div
                  onClick={() => {
                    // Resume playback via YouTube postMessage API
                    try {
                      iframeRef.current?.contentWindow.postMessage(JSON.stringify({ event: "command", func: "playVideo", args: [] }), "*");
                      setYtPaused(false);
                    } catch (_) {}
                  }}
                  style={{
                    position: "absolute", bottom: 52, left: 0, right: 0,
                    height: "calc(100% - 100px)", zIndex: 2,
                    background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 40%, transparent 100%)",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end",
                    paddingBottom: 40, cursor: "pointer",
                    transition: "opacity 0.3s",
                  }}
                >
                  <div style={{
                    width: 56, height: 56, borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
                    marginBottom: 12, transition: "all 0.2s",
                  }}>
                    <span style={{ fontSize: 20, color: "#fff", marginLeft: 3 }}>▶</span>
                  </div>
                  <div style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: "1px", textTransform: "uppercase" }}>Click to resume</div>
                </div>
              )}
            </div>
          ) : (
            <div style={{
              flex: isMobile ? "none" : 1,
              position: "relative", background: "#000", display: "flex", alignItems: "center", justifyContent: "center",
              ...(isMobile ? { width: "100%", aspectRatio: "16/9" } : {}),
            }}>
              <img src={video.thumb} alt={video.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.2 }} />
              <div style={{ position: "relative", textAlign: "center", padding: 32 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%", margin: "0 auto 14px",
                  border: "1px solid rgba(201,168,76,0.35)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(201,168,76,0.08)",
                }}>
                  <span style={{ fontSize: 18, color: "#C9A84C", marginLeft: 3 }}>▶</span>
                </div>
                <div style={{ fontFamily: FD, fontSize: 15, color: "rgba(201,168,76,0.85)", letterSpacing: "1.5px" }}>
                  {isVimeoUrl ? "Loading film…" : "Film Coming Soon"}
                </div>
                <div style={{ fontFamily: FB, fontSize: 12, color: "rgba(255,255,255,0.4)", maxWidth: 300, lineHeight: 1.65, marginTop: 8 }}>
                  {isVimeoUrl ? "Connecting to Vimeo…" : <>This film will be available shortly.<br />Contact us for a private screening enquiry.</>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Info panel (right on desktop, below on mobile) ── */}
        <div style={{
          width: isMobile ? "100%" : 280, flexShrink: 0,
          borderLeft: isMobile ? "none" : "1px solid rgba(255,255,255,0.06)",
          borderTop: isMobile ? "1px solid rgba(255,255,255,0.06)" : "none",
          background: "rgba(10,8,6,0.6)", backdropFilter: "blur(8px)",
          display: "flex", flexDirection: "column",
          overflowY: "auto", padding: isMobile ? "16px 16px 40px" : "20px 18px",
        }}>
          {/* Title + type */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: FD, fontSize: isMobile ? 19 : 17, color: "#f5f2ec", lineHeight: 1.3, marginBottom: 4 }}>{video.title}</div>
            <div style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
              {video.duration} · {video.type === "wedding" ? "Wedding Film" : video.type === "tour" ? "Estate Tour" : "Highlights"}
            </div>
          </div>

          {/* Description */}
          {video.desc && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 6 }}>About This Film</div>
              <div style={{ fontFamily: FB, fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.65, fontWeight: 300 }}>{video.desc}</div>
            </div>
          )}

          {/* Videographer details */}
          {vg && (
            <div style={{
              marginBottom: 18, padding: "14px 12px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "var(--lwd-radius-card)",
            }}>
              <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 10 }}>Videographer</div>
              <div style={{ fontFamily: FD, fontSize: 16, color: "#f5f2ec", marginBottom: 3 }}>{vg.name}</div>
              <div style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}><Icon name="pin" size={11} color="rgba(255,255,255,0.45)" /> {vg.area}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {vg.instagram && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="culture" size={11} color="rgba(255,255,255,0.5)" />
                    <span style={{ fontFamily: FB, fontSize: 11, color: "#C9A84C" }}>{vg.instagram}</span>
                  </div>
                )}
                {vg.website && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="globe" size={11} color="rgba(255,255,255,0.5)" />
                    <span style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{vg.website}</span>
                  </div>
                )}
                {vg.camera && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, opacity: 0.5 }}>🎥</span>
                    <span style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{vg.camera}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {video.tags && video.tags.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>Tags</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {video.tags.map(t => (
                  <span key={t} style={{
                    fontFamily: FB, fontSize: 10, color: "rgba(255,255,255,0.55)",
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                    padding: "3px 8px", borderRadius: "var(--lwd-radius-input)", letterSpacing: "0.3px",
                  }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Sharing */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>Share</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {shareBtn(copied ? "Copied!" : "Copy", "📋", handleCopyLink)}
              {shareBtn("Pin", "📌", handlePinterestShare)}
              {shareBtn("Email", "✉", handleEmailShare)}
              {shareBtn("Facebook", "📘", handleFacebookShare)}
              {shareBtn("Instagram", "📷", handleInstagramShare)}
            </div>
          </div>

          {/* ── Appreciations & Reflections ── */}
          <div style={{ marginBottom: 18 }}>
            {/* Appreciation + reflection count */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <button onClick={() => setLikedMap(m => ({ ...m, [video.id]: !m[video.id] }))}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: isLiked ? "rgba(201,168,76,0.08)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isLiked ? "rgba(201,168,76,0.25)" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: "var(--lwd-radius-input)", padding: "6px 12px", cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <span style={{ fontSize: 13, transition: "transform 0.2s", transform: isLiked ? "scale(1.15)" : "scale(1)" }}>{isLiked ? "❤️" : "🤍"}</span>
                <span style={{ fontFamily: FB, fontSize: 10, fontWeight: 600, color: isLiked ? "#C9A84C" : "rgba(255,255,255,0.45)", letterSpacing: "0.3px" }}>
                  {likeCount} {likeCount === 1 ? "Appreciation" : "Appreciations"}
                </span>
              </button>
              {allComments.length > 0 && (
                <span style={{ fontFamily: FB, fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.3px" }}>
                  {allComments.length} {allComments.length === 1 ? "Reflection" : "Reflections"}
                </span>
              )}
            </div>

            {/* Reflection input */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>Share Your Reflection</div>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your reflection on this film..."
                style={{
                  width: "100%", minHeight: 52, resize: "vertical",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "var(--lwd-radius-input)", padding: "10px 12px",
                  fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.65)",
                  lineHeight: 1.6, outline: "none", fontStyle: "italic",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"; e.currentTarget.style.fontStyle = "normal"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; if (!commentText) e.currentTarget.style.fontStyle = "italic"; }}
              />
              {commentText.trim() && (
                <button
                  onClick={() => {
                    if (!commentText.trim()) return;
                    setCommentsMap(m => ({
                      ...m,
                      [video.id]: [...(m[video.id] || []), { name: "You", text: commentText.trim(), date: new Date().toISOString().slice(0, 10) }],
                    }));
                    setCommentText("");
                  }}
                  style={{
                    marginTop: 6, width: "100%", padding: "8px 0",
                    background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)",
                    borderRadius: "var(--lwd-radius-input)", cursor: "pointer",
                    fontFamily: FB, fontSize: 10, fontWeight: 600,
                    color: "#C9A84C", letterSpacing: "0.8px", textTransform: "uppercase",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(201,168,76,0.12)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(201,168,76,0.06)"; }}
                >
                  Share Reflection
                </button>
              )}
            </div>

            {/* Curated Reflections */}
            {allComments.length > 0 && (
              <div>
                <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 10 }}>
                  Curated Reflections
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 180, overflowY: "auto" }}>
                  {allComments.map((c, ci) => (
                    <div key={ci} style={{
                      padding: "10px 12px",
                      borderLeft: "2px solid rgba(201,168,76,0.25)",
                      background: "rgba(255,255,255,0.015)",
                    }}>
                      <div style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, fontStyle: "italic", fontWeight: 300 }}>
                        "{c.text}"
                      </div>
                      <div style={{ fontFamily: FB, fontSize: 10, color: "rgba(201,168,76,0.5)", marginTop: 6, fontWeight: 600 }}>
                       , {c.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Film meta */}
          <div style={{
            marginTop: "auto", paddingTop: 14,
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>Film Info</div>
            <div style={{ fontFamily: FB, fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.7 }}>
              Film {idx + 1} of {videos.length}<br />
              {vg ? `© ${vg.name}` : "Villa Rosanova"}
            </div>
          </div>
        </div>
      </div>

      {/* Thumbnail strip */}
      <div onClick={(e) => e.stopPropagation()} style={{
        flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: isMobile ? "8px 8px" : "8px 12px", overflow: "hidden",
      }}>
        <div style={{ display: "flex", gap: 6, justifyContent: isMobile ? "flex-start" : "center", overflowX: isMobile ? "auto" : "visible", scrollbarWidth: "none" }}>
          {videos.map((v, i) => (
            <div
              key={v.id}
              onClick={() => onSelect?.(v)}
              style={{
                width: isMobile ? 90 : 120, height: isMobile ? 52 : 68,
                flexShrink: 0, cursor: "pointer",
                border: v.id === video.id ? "2px solid #C9A84C" : "2px solid transparent",
                opacity: v.id === video.id ? 1 : 0.4,
                transition: "all 0.2s", overflow: "hidden", position: "relative",
                borderRadius: isMobile ? 2 : 0,
              }}
              onMouseEnter={(e) => { if (v.id !== video.id) e.currentTarget.style.opacity = "0.7"; }}
              onMouseLeave={(e) => { if (v.id !== video.id) e.currentTarget.style.opacity = "0.4"; }}
            >
              <img src={v.thumb} alt={v.title}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              {v.id === video.id && (
                <div style={{
                  position: "absolute", bottom: 3, left: 0, right: 0, textAlign: "center",
                  fontFamily: FB, fontSize: 7, fontWeight: 700, letterSpacing: "0.8px",
                  textTransform: "uppercase", color: "#C9A84C",
                  textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                }}>Playing</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── VIDEO GALLERY ────────────────────────────────────────────────────────────
function VideoGallery({ videos, venue }) {
  const C = useT();
  const isMobile = useIsMobile();
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(null);

  // Reset all state when VideoGallery unmounts (route change / navigation away)
  useEffect(() => {
    return () => {
      setPlaying(null);
      setActive(0);
    };
  }, []);
  if (!videos || videos.length === 0) return null;
  const vg = videos[active].videographer;
  const venueName = venue?.name || 'Wedding Venue';

  return (
    <section style={{ marginBottom: 56 }}>
      <SectionHeading title="Films" subtitle={`Real weddings, estate tours and highlights from ${venueName}`} />

      {/* Main featured video */}
      <div
        style={{ marginBottom: 0, position: "relative", background: "#000", cursor: "pointer", aspectRatio: "16/9", overflow: "hidden", borderRadius: isMobile ? 3 : 0 }}
        onClick={() => setPlaying(videos[active])}
        role="button"
        aria-label={`Play ${videos[active].title}`}
      >
        <img src={videos[active].thumb} alt={videos[active].title}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 0.85 }} />
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: isMobile ? 52 : 64, height: isMobile ? 52 : 64, borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)",
          }}>
            <span style={{ fontSize: isMobile ? 16 : 20, color: "#fff", marginLeft: 3 }}>▶</span>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: isMobile ? "32px 16px 14px" : "40px 20px 16px", background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}>
          <div style={{ fontFamily: FD, fontSize: isMobile ? 17 : 20, color: "#fff" }}>{videos[active].title}</div>
          <div style={{ fontFamily: FB, fontSize: isMobile ? 11 : 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>{videos[active].duration} · {videos[active].type === "wedding" ? "Wedding Film" : "Estate Tour"}</div>
        </div>
      </div>

      {/* Video info bar, stacked on mobile */}
      <div className="vp-video-info" style={{
        padding: isMobile ? "14px 0" : "16px 20px", background: isMobile ? "transparent" : C.surface,
        border: isMobile ? "none" : `1px solid ${C.border}`, borderTop: "none",
        display: "flex", flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? 12 : 24, alignItems: isMobile ? "stretch" : "flex-start",
        marginBottom: 0,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {videos[active].desc && (
            <p style={{ fontFamily: FB, fontSize: isMobile ? 13 : 13, color: C.textLight, lineHeight: 1.7, marginBottom: 10 }}>{videos[active].desc}</p>
          )}
          {videos[active].tags && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {videos[active].tags.map(t => (
                <span key={t} style={{
                  fontFamily: FB, fontSize: 9, color: C.textMuted,
                  background: C.bgAlt, border: `1px solid ${C.border}`,
                  padding: "2px 7px", borderRadius: "var(--lwd-radius-input)", letterSpacing: "0.3px",
                }}>{t}</span>
              ))}
            </div>
          )}
        </div>
        {vg && (
          <div style={{
            flexShrink: 0, width: isMobile ? "100%" : 200,
            padding: "10px 14px", background: C.bgAlt,
            border: `1px solid ${C.border}`, borderRadius: "var(--lwd-radius-card)",
            display: "flex", flexDirection: isMobile ? "row" : "column",
            alignItems: isMobile ? "center" : "stretch",
            gap: isMobile ? 12 : 0,
          }}>
            <div style={{ flex: isMobile ? 1 : undefined }}>
              <div style={{ fontFamily: FB, fontSize: 9, color: C.textMuted, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 4 }}>Videographer</div>
              <div style={{ fontFamily: FD, fontSize: 15, color: C.text }}>{vg.name}</div>
              <div style={{ fontFamily: FB, fontSize: 11, color: C.textLight, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}><Icon name="pin" size={11} color={C.textLight} /> {vg.area}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {vg.instagram && (
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 10, opacity: 0.5 }}>📹</span>
                  <span style={{ fontFamily: FB, fontSize: 10, color: C.gold }}>{vg.instagram}</span>
                </div>
              )}
              {vg.camera && (
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 10, opacity: 0.5 }}>🎥</span>
                  <span style={{ fontFamily: FB, fontSize: 10, color: C.textMuted }}>{vg.camera}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Thumbnail strip — only shown when there are multiple videos */}
      {videos.length > 1 && (isMobile ? (
        <div className="vp-films-slider" style={{
          display: "flex", gap: 10, overflowX: "auto", scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none",
          marginTop: 16, marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16,
        }}>
          {videos.map((v, i) => (
            <div key={v.id} style={{ flex: "0 0 200px", scrollSnapAlign: "start", cursor: "pointer" }}
              onClick={() => setActive(i)}>
              <div style={{
                position: "relative", aspectRatio: "16/9", overflow: "hidden", borderRadius: 3,
                border: i === active ? `2px solid ${C.gold}` : "2px solid transparent",
              }}>
                <img src={v.thumb} alt={v.title} style={{
                  width: "100%", height: "100%", objectFit: "cover", display: "block",
                  opacity: i === active ? 1 : 0.6,
                }} />
                {i === active && (
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                    padding: "12px 8px 6px", textAlign: "center",
                    fontFamily: FB, fontSize: 8, fontWeight: 700, letterSpacing: "0.8px",
                    textTransform: "uppercase", color: C.gold,
                  }}>Now Playing</div>
                )}
                <div onClick={(e) => { e.stopPropagation(); setPlaying(v); }} style={{
                  position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 10, color: "#fff", marginLeft: 2 }}>▶</span>
                  </div>
                </div>
              </div>
              <div style={{ padding: "6px 0 0" }}>
                <div style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{v.title}</div>
                <div style={{ fontFamily: FB, fontSize: 10, color: C.textMuted, marginTop: 2 }}>{v.duration}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${videos.length}, 1fr)`, gap: 10, marginTop: 20 }}>
          {videos.map((v, i) => (
            <div key={v.id} style={{ cursor: "pointer" }} onClick={() => setActive(i)}>
              <div style={{
                position: "relative", aspectRatio: "16/9", overflow: "hidden",
                border: i === active ? `2px solid ${C.gold}` : "2px solid transparent",
              }}>
                <img src={v.thumb} alt={v.title} style={{
                  width: "100%", height: "100%", objectFit: "cover", display: "block",
                  opacity: i === active ? 1 : 0.5, transition: "opacity 0.2s",
                }}
                  onMouseEnter={(e) => { if (i !== active) e.currentTarget.style.opacity = "0.75"; }}
                  onMouseLeave={(e) => { if (i !== active) e.currentTarget.style.opacity = "0.5"; }}
                />
                <div
                  onClick={(e) => { e.stopPropagation(); setPlaying(v); }}
                  style={{
                    position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    opacity: 0, transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "0"}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.5)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 11, color: "#fff", marginLeft: 2 }}>▶</span>
                  </div>
                </div>
                {i === active && (
                  <div style={{
                    position: "absolute", bottom: 4, left: 0, right: 0, textAlign: "center",
                    fontFamily: FB, fontSize: 8, fontWeight: 700, letterSpacing: "0.8px",
                    textTransform: "uppercase", color: C.gold, textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                  }}>Now Playing</div>
                )}
              </div>
              <div style={{ padding: "8px 0 0" }}>
                <div style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{v.title}</div>
                <div style={{ fontFamily: FB, fontSize: 10, color: C.textMuted, marginTop: 2 }}>{v.duration} · {v.videographer?.name || ""}</div>
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Video play modal */}
      {playing && (
        <VideoPlayModal
          video={playing}
          videos={videos}
          onSelect={(v) => setPlaying(v)}
          onClose={() => setPlaying(null)}
          engagement={VENUE.engagement?.videos}
        />
      )}
    </section>
  );
}

// ─── EXCLUSIVE USE ────────────────────────────────────────────────────────────
function ExclusiveUse({ venue, onEnquire }) {
  const C = useT();
  const isMobile = useIsMobile();
  const eu = venue.exclusiveUse;

  // Section hidden if disabled or no data
  if (!eu || eu.enabled === false) return null;
  // Don't render empty shell
  if (!eu.from && !eu.description && !(eu.includes?.length)) return null;

  const title    = eu.title    || "Exclusive Use";
  const subtitle = eu.subtitle || "";
  const ctaText  = eu.ctaText  || "Enquire About Exclusive Use";
  const subline  = eu.subline  || (eu.minNights ? `Minimum ${eu.minNights} nights` : "");

  return (
    <section id="pricing" style={{ marginBottom: 56 }}>
      <SectionHeading title={title} subtitle={subtitle} />
      <div style={{ border: `1px solid ${C.goldBorder}`, background: C.goldLight, padding: isMobile ? 24 : 40 }}>
        <div className="vp-exclusive-grid" style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: isMobile ? 32 : 48,
        }}>
          {/* Left: price + description + CTA */}
          <div>
            {eu.from && (
              <div style={{ fontFamily: FD, fontSize: isMobile ? 32 : 40, color: C.gold, marginBottom: 6, lineHeight: 1 }}>
                From {eu.from}
              </div>
            )}
            {subline && (
              <div style={{ fontFamily: FB, fontSize: 13, color: C.textLight, marginBottom: 24 }}>
                {subline}
              </div>
            )}
            {eu.description && (
              <div
                style={{ fontFamily: FB, fontSize: 14, color: C.textMid, lineHeight: 1.8, marginBottom: 28 }}
                dangerouslySetInnerHTML={{ __html: eu.description }}
              />
            )}
            <button
              type="button"
              onClick={onEnquire}
              style={{
                padding: "13px 28px", background: C.gold, border: "none",
                borderRadius: "var(--lwd-radius-input)",
                color: "#fff", fontFamily: FB, fontSize: 12, fontWeight: 800,
                letterSpacing: "0.9px", textTransform: "uppercase", cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 8,
                transition: "opacity 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              {ctaText} →
            </button>
          </div>

          {/* Right: includes list */}
          {eu.includes?.length > 0 && (
            <div>
              <div style={{
                fontFamily: FB, fontSize: 9, color: C.textMuted,
                letterSpacing: "1.4px", textTransform: "uppercase", marginBottom: 16,
              }}>
                Exclusive use includes
              </div>
              {eu.includes.slice(0, 7).map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <span style={{ color: C.gold, fontSize: 14, lineHeight: 1, flexShrink: 0 }}>✓</span>
                  <span style={{ fontFamily: FB, fontSize: 14, color: C.textMid }}>{typeof item === 'string' ? item : item?.text || ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── CATERING ────────────────────────────────────────────────────────────────
function CateringSection({ venue }) {
  const C = useT();
  const isMobile = useIsMobile();
  const cat = venue.catering;

  // Hide if disabled or missing
  if (!cat || cat.enabled === false) return null;

  // Only show cards with content, sorted by sortOrder
  const cards = (cat.cards || [])
    .filter(c => c.title || c.description)
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
    .slice(0, 3);

  if (cards.length === 0) return null;

  // Grid cols: 3-up on desktop, adapt to card count on mobile
  const colCount = isMobile ? 1 : Math.min(cards.length, 3);

  return (
    <section style={{ marginBottom: 56 }}>
      <SectionHeading title="Catering & Dining" subtitle="Professional catering services and dining options" />
      <div
        className="vp-catering-grid"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${colCount}, 1fr)`,
          gap: 20,
          marginBottom: 28,
        }}
      >
        {cards.map(c => (
          <div
            key={c.id || c.title}
            style={{ padding: 24, border: `1px solid ${C.border}`, background: C.surface }}
          >
            <div style={{ marginBottom: 12 }}>
              <Icon name={c.icon || 'dining'} size={28} color={C.gold} />
            </div>
            <div style={{ fontFamily: FD, fontSize: 18, color: C.text, marginBottom: 8 }}>{c.title}</div>
            <div style={{ fontFamily: FB, fontSize: 13, color: C.textLight, lineHeight: 1.7 }}>{c.description}</div>
            {c.subtext && (
              <div style={{ fontFamily: FB, fontSize: 12, color: C.textMuted, marginTop: 8 }}>{c.subtext}</div>
            )}
          </div>
        ))}
      </div>

      {/* Dining styles + dietary pills */}
      <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
        {cat.styles?.length > 0 && (
          <div>
            <div style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 10 }}>
              Dining styles
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {cat.styles.map(s => <Pill key={s} color="gold">{s}</Pill>)}
            </div>
          </div>
        )}
        {cat.dietary?.length > 0 && (
          <div>
            <div style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 10 }}>
              Dietary options
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {cat.dietary.map(d => (
                <Pill key={d} color="green"><Icon name="check" size={10} color={C.green} /> {d}</Pill>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── SPACES ───────────────────────────────────────────────────────────────────
// ─── VENUE SPACES SECTION ─────────────────────────────────────────────────────
function SpaceCapacityRow({ space, C }) {
  const caps = [
    space.capacityCeremony != null && { label: 'Ceremony', value: space.capacityCeremony },
    space.capacityReception != null && { label: 'Reception', value: space.capacityReception },
    space.capacityDining != null && { label: 'Dining', value: space.capacityDining },
    space.capacityStanding != null && { label: 'Standing', value: space.capacityStanding },
  ].filter(Boolean);

  if (!caps.length) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
      {caps.map(({ label, value }) => (
        <div key={label} style={{ textAlign: 'center', minWidth: 56 }}>
          <div style={{ fontFamily: FD, fontSize: 22, fontWeight: 400, color: C.text, lineHeight: 1 }}>{value}</div>
          <div style={{ fontFamily: FB, fontSize: 10, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

function SpaceAttributeBadges({ space, C }) {
  const attrs = [];
  if (space.indoor != null) attrs.push(space.indoor ? '🏛 Indoor' : '🌿 Outdoor');
  if (space.covered != null && !space.indoor) attrs.push(space.covered ? '⛱ Covered' : '☀️ Open Air');
  if (space.accessible) attrs.push('♿ Accessible');
  if (!attrs.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
      {attrs.map(a => (
        <span key={a} style={{
          padding: '3px 10px', fontSize: 11, fontFamily: FB,
          border: `1px solid ${C.border}`, borderRadius: 20,
          color: C.textMid, backgroundColor: C.bgAlt || C.surface,
        }}>{a}</span>
      ))}
    </div>
  );
}

function SpacesSection({ spaces, venue }) {
  const C = useT();
  const isMobile = useIsMobile();
  const [floorPlanModal, setFloorPlanModal] = useState(null); // { url, name }
  // Gallery images used as fallback when a space has no dedicated image
  const galleryImgs = (venue?.imgs || []).map(i => (typeof i === 'string' ? i : (i.src || i.url || '')).trim()).filter(Boolean);

  return (
    <section id="capacity" style={{ marginBottom: 56 }}>
      <SectionHeading
        title="Venue Spaces"
        subtitle={`${spaces.length} distinct event space${spaces.length !== 1 ? 's' : ''}, each with unique character and atmosphere`}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 48 : 64 }}>
        {spaces.map((s, i) => {
          const isEven = i % 2 === 0;
          const spaceImg = s.img || galleryImgs[i % galleryImgs.length] || null;
          return (
            <div key={s.id || s.name} className="vp-space-card" style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : (isEven ? '1fr 1fr' : '1fr 1fr'),
              gap: isMobile ? 0 : 48,
              animation: `fadeUp 0.5s ease ${i * 0.08}s both`,
              alignItems: 'center',
            }}>
              {/* Image column, full landscape, max 750px height */}
              {spaceImg && (
                <div style={{
                  order: isMobile ? 0 : (isEven ? 0 : 1),
                  overflow: 'hidden',
                  borderRadius: 2,
                  aspectRatio: '16 / 10',
                }}>
                  <img
                    src={spaceImg} alt={s.name}
                    className="lwd-img-zoom"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      maxHeight: isMobile ? '380px' : '500px',
                    }}
                  />
                </div>
              )}

              {/* Content column, editorial layout, more open spacing */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                order: isMobile ? 1 : (isEven ? 1 : 0),
              }}>
                {/* Type pill */}
                {s.type && (
                  <div>
                    <span style={{
                      display: 'inline-block',
                      padding: '5px 14px',
                      fontSize: 10,
                      fontFamily: FB,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      border: `1px solid ${C.gold}`,
                      borderRadius: 20,
                      color: C.gold,
                      fontWeight: 700,
                    }}>{s.type}</span>
                  </div>
                )}

                {/* Space name, serif headline */}
                <div style={{
                  fontFamily: FD,
                  fontSize: isMobile ? 24 : 32,
                  fontWeight: 400,
                  color: C.text,
                  lineHeight: 1.2,
                }}>
                  {s.name}
                </div>

                {/* Capacity numbers, clean row */}
                <SpaceCapacityRow space={s} C={C} />

                {/* Description, readable paragraph width */}
                {s.description && (
                  <p style={{
                    fontFamily: FB,
                    fontSize: 13,
                    color: C.textLight,
                    lineHeight: 1.8,
                    margin: 0,
                    maxWidth: '600px',
                  }}>
                    {s.description}
                  </p>
                )}

                {/* Attribute badges */}
                <SpaceAttributeBadges space={s} C={C} />

                {/* Floor plan link */}
                {s.floorPlanUrl && (
                  <button
                    type="button"
                    onClick={() => setFloorPlanModal({ url: s.floorPlanUrl, name: s.name })}
                    style={{
                      alignSelf: 'flex-start',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '9px 18px',
                      fontSize: 11,
                      fontFamily: FB,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      border: `1px solid ${C.textMuted}`,
                      borderRadius: 2,
                      backgroundColor: 'transparent',
                      color: C.textMid,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = C.bgAlt;
                      e.currentTarget.style.borderColor = C.textMid;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = C.textMuted;
                    }}
                  >
                    📐 View Floor Plan
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floor Plan Modal */}
      {floorPlanModal && (
        <div
          onClick={() => setFloorPlanModal(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ position: 'relative', maxWidth: 900, width: '100%', backgroundColor: '#fff', borderRadius: 2 }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5ddd0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: FB, fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>Floor Plan, {floorPlanModal.name}</span>
              <button
                type="button"
                onClick={() => setFloorPlanModal(null)}
                style={{ border: 'none', background: 'none', fontSize: 22, color: '#888', cursor: 'pointer', lineHeight: 1 }}
              >×</button>
            </div>
            <img src={floorPlanModal.url} alt={`Floor plan, ${floorPlanModal.name}`} style={{ width: '100%', display: 'block', borderRadius: '0 0 2px 2px' }} />
          </div>
        </div>
      )}
    </section>
  );
}

// ─── ROOMS & ACCOMMODATION ────────────────────────────────────────────────────
function RoomsSection({ venue }) {
  const C = useT();
  const isMobile = useIsMobile();
  const acc = venue.accommodation;
  if (!acc || (!acc.totalRooms && !acc.description)) return null;
  const [roomsLightboxIdx, setRoomsLightboxIdx] = useState(null);
  // Fall back to gallery images when no dedicated room images are assigned
  const roomImgs = acc.images?.length > 0
    ? acc.images
    : (venue.imgs || []).slice(0, 6).map(i => (typeof i === 'string' ? i : (i.src || i.url || '')).trim()).filter(Boolean);

  return (
    <section id="rooms" style={{ marginBottom: 56 }}>
      <SectionHeading title="Rooms & Accommodation" subtitle={acc.totalRooms ? `${acc.totalRooms} rooms${acc.totalSuites ? ` & ${acc.totalSuites} suites` : ''} for your guests` : "Accommodation for your guests"} />
      <>
        {/* Stats bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
          {acc.type && (
            <span style={{ padding: '5px 14px', border: `1px solid ${C.gold}`, borderRadius: 20, fontSize: 12, fontWeight: 600, color: C.gold, fontFamily: 'var(--font-body, inherit)' }}>
              {acc.type}
            </span>
          )}
          {acc.totalRooms > 0 && (
            <span style={{ padding: '5px 14px', backgroundColor: C.bgAlt || C.surface, border: `1px solid ${C.border}`, borderRadius: 20, fontSize: 12, color: C.textMid, fontFamily: 'var(--font-body, inherit)' }}>
              {acc.totalRooms} Rooms
            </span>
          )}
          {acc.totalSuites > 0 && (
            <span style={{ padding: '5px 14px', backgroundColor: C.bgAlt || C.surface, border: `1px solid ${C.border}`, borderRadius: 20, fontSize: 12, color: C.textMid, fontFamily: 'var(--font-body, inherit)' }}>
              {acc.totalSuites} Suites
            </span>
          )}
          {acc.maxOvernightGuests > 0 && (
            <span style={{ padding: '5px 14px', backgroundColor: C.bgAlt || C.surface, border: `1px solid ${C.border}`, borderRadius: 20, fontSize: 12, color: C.textMid, fontFamily: 'var(--font-body, inherit)' }}>
              Up to {acc.maxOvernightGuests} guests
            </span>
          )}
          {acc.minNightStay > 0 && (
            <span style={{ padding: '5px 14px', backgroundColor: C.bgAlt || C.surface, border: `1px solid ${C.border}`, borderRadius: 20, fontSize: 12, color: C.textMid, fontFamily: 'var(--font-body, inherit)' }}>
              Min {acc.minNightStay} nights
            </span>
          )}
          {acc.exclusiveUse && (
            <span style={{ padding: '5px 14px', backgroundColor: 'rgba(201,168,76,0.1)', border: `1px solid ${C.gold}`, borderRadius: 20, fontSize: 12, fontWeight: 700, color: C.gold, fontFamily: 'var(--font-body, inherit)' }}>
              ✦ Exclusive Use Available
            </span>
          )}
        </div>

        {/* Description */}
        {acc.description && (
          <div
            className="ldw-prose-body"
            style={{ marginBottom: 28 }}
            dangerouslySetInnerHTML={{ __html: acc.description }}
          />
        )}

        {/* Room images grid (max 6) — uses dedicated room images or falls back to gallery */}
        {roomImgs.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: 8,
          }}>
            {roomImgs.slice(0, 6).map((src, i) => (
              <img
                key={i} src={src} alt={`Room ${i + 1}`}
                loading="lazy"
                onClick={() => setRoomsLightboxIdx(i)}
                style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 2, cursor: 'pointer' }}
              />
            ))}
          </div>
        )}
        {roomsLightboxIdx !== null && (() => {
          const lightboxImages = roomImgs.slice(0, 6).map(src => ({ src, title: '' }));
          return (
            <MenuImageModal
              images={lightboxImages}
              idx={roomsLightboxIdx}
              onClose={() => setRoomsLightboxIdx(null)}
              onPrev={() => setRoomsLightboxIdx(i => Math.max(0, i - 1))}
              onNext={() => setRoomsLightboxIdx(i => Math.min(lightboxImages.length - 1, i + 1))}
            />
          );
        })()}
      </>
    </section>
  );
}

// ─── MENU IMAGE MODAL ─────────────────────────────────────────────────────────
function MenuImageModal({ images, idx, onClose, onPrev, onNext }) {
  const C = useT();
  if (idx === null || idx === undefined || !images?.[idx]) return null;
  const img = images[idx];

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, onPrev, onNext]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: 760, width: '100%', position: 'relative' }}>
        <img
          src={img.src} alt={img.title}
          style={{ width: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 2 }}
        />
        {img.title && (
          <p style={{
            textAlign: 'center', marginTop: 14,
            fontFamily: 'var(--font-body, inherit)', fontSize: 14,
            color: 'rgba(255,255,255,0.85)', letterSpacing: '0.02em',
          }}>
            {img.title}
          </p>
        )}
        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: -40, right: 0, background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>×</button>
        {/* Prev */}
        {idx > 0 && (
          <button onClick={onPrev} style={{ position: 'absolute', top: '50%', left: -52, transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 40, height: 40, color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
        )}
        {/* Next */}
        {idx < images.length - 1 && (
          <button onClick={onNext} style={{ position: 'absolute', top: '50%', right: -52, transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 40, height: 40, color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
        )}
        {/* Thumbnail strip (max 4) */}
        {images.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            {images.map((img, i) => (
              <img key={i} src={img.src} alt="" onClick={() => { /* handled via onPrev/onNext */ }}
                style={{
                  width: 52, height: 36, objectFit: 'cover', borderRadius: 2,
                  cursor: 'pointer', opacity: i === idx ? 1 : 0.45,
                  border: i === idx ? '1px solid #C9A84C' : '1px solid transparent',
                  transition: 'opacity 0.15s',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DINING SECTION ───────────────────────────────────────────────────────────
function DiningSection({ venue }) {
  const C = useT();
  const isMobile = useIsMobile();
  const dining = venue.dining;
  const [menuImgIdx, setMenuImgIdx] = useState(null);

  if (!dining || (!dining.description && !dining.style)) return null;

  // Gallery fallback: normalize venue.imgs to plain URL strings
  const galleryImgs = (venue.imgs || [])
    .map(i => (typeof i === 'string' ? i : (i.src || i.url || '')).trim())
    .filter(Boolean);

  const sideImg = dining.menuImages?.[0]?.src || galleryImgs[1] || galleryImgs[0] || null;

  // Fallback gallery: use venue gallery images when no dedicated dining images exist
  const hasDiningImages = dining.menuImages?.length > 0;
  const fallbackGalleryImgs = !hasDiningImages ? galleryImgs.slice(0, 4) : [];

  const PillGroup = ({ items, color }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
      {items.map(item => (
        <span key={item} style={{
          padding: '4px 12px', borderRadius: 20, fontSize: 12,
          border: color === 'gold' ? `1px solid ${C.gold}` : `1px solid ${C.border}`,
          color: color === 'gold' ? C.gold : C.textMid,
          backgroundColor: color === 'gold' ? 'rgba(201,168,76,0.08)' : (C.bgAlt || C.surface),
          fontFamily: 'var(--font-body, inherit)',
          fontWeight: color === 'gold' ? 600 : 400,
        }}>
          {item}
        </span>
      ))}
    </div>
  );

  return (
    <section id="dining" style={{ marginBottom: 56 }}>
      <SectionHeading title="Dining" subtitle="World-class culinary experiences and menu options" />
      <SectionLayout sideImg={sideImg} isMobile={isMobile}>

        {/* Style + chef */}
        {dining.style && (
          <p style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: isMobile ? 17 : 20, fontWeight: 400, color: C.text, lineHeight: 1.35, marginBottom: 20, letterSpacing: '-0.01em' }}>
            {dining.style}
            {dining.chefName && <span style={{ display: 'block', fontFamily: 'var(--font-body, inherit)', fontSize: 13, color: C.textLight, marginTop: 6, fontStyle: 'italic' }}>Chef {dining.chefName}</span>}
          </p>
        )}

        {/* Catering badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {dining.inHouseCatering && (
            <span style={{ padding: '5px 14px', backgroundColor: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.4)', borderRadius: 20, fontSize: 12, fontWeight: 600, color: C.green }}>✓ In-house Catering</span>
          )}
          {dining.externalCateringAllowed && (
            <span style={{ padding: '5px 14px', backgroundColor: C.bgAlt || C.surface, border: `1px solid ${C.border}`, borderRadius: 20, fontSize: 12, color: C.textMid }}>External Caterers Welcome</span>
          )}
        </div>

        {/* Menu styles */}
        {dining.menuStyles?.length > 0 && (
          <div style={{ marginBottom: 4 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textLight, marginBottom: 8 }}>Menu Style</p>
            <PillGroup items={dining.menuStyles} color="gold" />
          </div>
        )}

        {/* Dietary */}
        {dining.dietaryOptions?.length > 0 && (
          <div style={{ marginBottom: 4 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textLight, marginBottom: 8 }}>Dietary</p>
            <PillGroup items={dining.dietaryOptions} color="neutral" />
          </div>
        )}

        {/* Drinks */}
        {dining.drinksOptions?.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textLight, marginBottom: 8 }}>Drinks</p>
            <PillGroup items={dining.drinksOptions} color="neutral" />
          </div>
        )}

        {/* Description */}
        {dining.description && (
          <div
            className="ldw-prose-body"
            style={{ marginBottom: 32 }}
            dangerouslySetInnerHTML={{ __html: dining.description }}
          />
        )}

        {/* Menu Highlights — dedicated dining images */}
        {hasDiningImages && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textLight, marginBottom: 12 }}>Menu Highlights</p>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(dining.menuImages.length, 4)}, 1fr)`, gap: 8 }}>
              {dining.menuImages.slice(0, 4).map((img, i) => (
                <div key={i} style={{ cursor: 'pointer' }} onClick={() => setMenuImgIdx(i)}>
                  <img
                    src={img.src} alt={img.title}
                    loading="lazy"
                    style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 2, transition: 'opacity 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  />
                  {img.title && (
                    <p style={{ fontSize: 11, color: C.textLight, margin: '5px 0 0', lineHeight: 1.3, fontFamily: 'var(--font-body, inherit)' }}>{img.title}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gallery fallback — shown when no dedicated dining images exist */}
        {!hasDiningImages && fallbackGalleryImgs.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(fallbackGalleryImgs.length, 4)}, 1fr)`, gap: 8, marginTop: 4 }}>
            {fallbackGalleryImgs.map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                loading="lazy"
                style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 2 }}
              />
            ))}
          </div>
        )}
      </SectionLayout>

      {/* Menu image lightbox */}
      <MenuImageModal
        images={dining.menuImages || []}
        idx={menuImgIdx}
        onClose={() => setMenuImgIdx(null)}
        onPrev={() => setMenuImgIdx(i => Math.max(0, i - 1))}
        onNext={() => setMenuImgIdx(i => Math.min((dining.menuImages?.length || 1) - 1, i + 1))}
      />
    </section>
  );
}

// ─── VENUE TYPE SECTION ───────────────────────────────────────────────────────
function VenueTypeSection({ venue }) {
  const C = useT();
  const isMobile = useIsMobile();
  const vt = venue.venueType;
  if (!vt?.primaryType && !(venue.categories?.length > 0)) return null;

  const sideImg = venue.imgs?.[3] || venue.imgs?.[0];

  return (
    <section id="venue-type" style={{ marginBottom: 56 }}>
      <SectionHeading title="Venue Type" subtitle={vt?.description || "Unique venue with distinctive character and style"} />
      <SectionLayout sideImg={sideImg} isMobile={isMobile}>
        {/* Primary type + architecture */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
          {vt?.primaryType && (
            <span style={{ padding: '5px 16px', border: `1px solid ${C.gold}`, borderRadius: 20, fontSize: 13, fontWeight: 700, color: C.gold }}>
              {vt.primaryType}
            </span>
          )}
          {vt?.architecture && (
            <span style={{ padding: '5px 14px', backgroundColor: C.bgAlt || C.surface, border: `1px solid ${C.border}`, borderRadius: 20, fontSize: 12, color: C.textMid }}>
              {vt.architecture} Architecture
            </span>
          )}
          {vt?.built && (
            <span style={{ padding: '5px 14px', backgroundColor: C.bgAlt || C.surface, border: `1px solid ${C.border}`, borderRadius: 20, fontSize: 12, color: C.textMid }}>
              Built {vt.built}
            </span>
          )}
        </div>

        {vt?.description && (
          <p style={{ fontFamily: 'var(--font-body, inherit)', fontSize: 14, color: C.textMid, lineHeight: 1.75, marginBottom: 24 }}>
            {vt.description}
          </p>
        )}

        {/* Style tags */}
        {vt?.styles?.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textLight, marginBottom: 10 }}>Style</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {vt.styles.map(s => (
                <span key={s} style={{ padding: '4px 12px', border: `1px solid ${C.border}`, borderRadius: 20, fontSize: 12, color: C.textMid, backgroundColor: C.bgAlt || C.surface }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Features checklist */}
        {Array.isArray(vt?.features) && vt.features.length > 0 && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textLight, marginBottom: 10 }}>Features</p>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 8 }}>
              {vt.features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.textMid }}>
                  <span style={{ color: C.gold, fontSize: 11 }}>✦</span>
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionLayout>
    </section>
  );
}

// ─── WEDDING WEEKEND ─────────────────────────────────────────────────────────
function WeddingWeekend({ venue }) {
  const C = useT();
  const isMobile = useIsMobile();
  const ww = venue.weddingWeekend;
  if (!ww || ww.enabled === false) return null;
  const experiences = venue.experiences || [];
  const estate  = venue.estateEnabled !== false ? experiences.filter(e => e.category === "estate").slice(0, 6) : [];
  const nearby  = venue.nearbyEnabled !== false ? experiences.filter(e => e.category === "nearby").slice(0, 6) : [];
  const formatDistance = (mins) => {
    if (!mins) return null;
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
  };

  const experienceRow = (exp) => (
    <div key={exp.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: C.bgAlt || C.bg, border: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <Icon name={EXPERIENCE_KIND_SET.has(exp.kind) ? exp.kind : "nature"} size={18} color={C.textMid} />
        <span style={{ fontFamily: FB, fontSize: 13, color: C.textMid, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exp.label}</span>
        {exp.isIncluded && (
          <span style={{ fontFamily: FB, fontSize: 9, color: C.gold, letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 700, padding: "2px 6px", border: `1px solid ${C.goldBorder || C.gold}`, background: C.goldLight || "transparent", flexShrink: 0 }}>Included</span>
        )}
        {exp.isPrivate && (
          <span style={{ fontFamily: FB, fontSize: 9, color: C.textMuted, letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 700, padding: "2px 6px", border: `1px solid ${C.border}`, flexShrink: 0 }}>Private</span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        {exp.season && exp.season !== "all-year" && (
          <span style={{ fontFamily: FB, fontSize: 10, color: C.textMuted, fontStyle: "italic" }}>{exp.season}</span>
        )}
        {exp.distanceMinutes && (
          <span style={{ fontFamily: FB, fontSize: 11, color: C.gold, fontWeight: 600 }}>{formatDistance(exp.distanceMinutes)}</span>
        )}
      </div>
    </div>
  );

  const days = (ww.days || [])
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
    .slice(0, 4)
    .map(d => ({
      ...d,
      day:   String(d.day   || '').slice(0, 12),
      title: String(d.title || '').slice(0, 28),
      desc:  String(d.desc  || '').slice(0, 110),
    }));

  const dayCard = (d) => (
    <div key={d.day} style={{ padding: 20, border: `1px solid ${C.border}`, background: C.surface, flex: isMobile ? "0 0 220px" : undefined, scrollSnapAlign: isMobile ? "start" : undefined, minHeight: isMobile ? undefined : 130, overflow: 'hidden' }}>
      <div style={{ fontFamily: FB, fontSize: 10, color: C.gold, letterSpacing: "1px", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>{d.day}</div>
      <div style={{ fontFamily: FD, fontSize: 18, color: C.text, marginBottom: 8 }}>{d.title}</div>
      <p style={{ fontFamily: FB, fontSize: 12, color: C.textLight, lineHeight: 1.65 }}>{d.desc}</p>
    </div>
  );

  return (
    <section id="things-to-do" style={{ marginBottom: 56 }}>
      <SectionHeading title="Your Wedding Weekend" subtitle={ww.subtitle || ''} />
      {/* Days */}
      {isMobile ? (
        <div style={{ display: "flex", gap: 12, overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", marginBottom: 36, scrollbarWidth: "none", msOverflowStyle: "none" }} className="vp-weekend-slider">
          {days.map(dayCard)}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(days.length, 4)}, 1fr)`, gap: 12, marginBottom: 36 }}>
          {days.map(dayCard)}
        </div>
      )}
      {/* Experiences */}
      {(estate.length > 0 || nearby.length > 0) && (
        <div className="vp-experiences-grid" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : (estate.length > 0 && nearby.length > 0 ? "1fr 1fr" : "1fr"), gap: isMobile ? 24 : 32 }}>
          {[
            estate.length > 0 && { title: "On the Estate", items: estate },
            nearby.length > 0 && { title: "Nearby Experiences", items: nearby },
          ].filter(Boolean).map(g => (
            <div key={g.title}>
              <div style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 14 }}>{g.title}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {g.items.map(experienceRow)}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── GETTING HERE ─────────────────────────────────────────────────────────────
function GettingHere({ access }) {
  const C = useT();

  // Only render if access data exists with airports
  if (!access || !Array.isArray(access.airports) || access.airports.length === 0) return null;

  const formatDrive = (mins) => {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
  };
  const driveColor = (mins) => {
    if (mins < 60) return C.green;
    if (mins < 100) return C.gold;
    return C.textLight;
  };

  return (
    <section id="availability" style={{ marginBottom: 56 }}>
      <SectionHeading title="Getting Here" subtitle="Transportation options and airport proximity for guest convenience" />

      {/* Helicopter callout */}
      {access.helicopterTransferAvailable && (
        <div style={{ marginBottom: 20, padding: "14px 20px", background: C.goldLight, border: `1px solid ${C.goldBorder}`, display: "flex", alignItems: "center", gap: 12 }}>
          <Icon name="helicopter" size={22} color={C.gold} />
          <div>
            <span style={{ fontFamily: FB, fontSize: 14, fontWeight: 700, color: C.gold }}>Helicopter transfers available</span>
            {access.helicopterTransferMinutesFromAirport && (
              <span style={{ fontFamily: FB, fontSize: 13, color: C.textLight, marginLeft: 8 }}>
                {access.helicopterTransferMinutesFromAirport} min from {access.primaryAirport.code}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Primary airport highlight */}
      {access.primaryAirport && (
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="airport" size={14} color={C.gold} />
          <span style={{ fontFamily: FB, fontSize: 13, color: C.textMid }}>
            Closest international airport: <strong style={{ color: C.text, fontWeight: 600 }}>{access.primaryAirport.name}</strong>, {formatDrive(access.primaryAirport.driveTimeMinutes)}
          </span>
        </div>
      )}

      {/* Airport table */}
      <div style={{ border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", background: C.bgAlt || C.bg, borderBottom: `1px solid ${C.border}`, padding: "10px 20px" }}>
          {["Airport", "Drive time", "Distance"].map(h => (
            <div key={h} style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, letterSpacing: "0.6px", textTransform: "uppercase" }}>{h}</div>
          ))}
        </div>
        {access.airports.map((a, i) => (
          <div key={a.code} style={{
            display: "grid", gridTemplateColumns: "2fr 1fr 1fr",
            padding: "16px 20px", alignItems: "center",
            borderBottom: i < access.airports.length - 1 ? `1px solid ${C.border}` : "none",
            background: C.surface,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="airport" size={16} color={C.textMuted} />
              <div>
                <span style={{ fontFamily: FD, fontSize: 17, color: C.text }}>{a.name}</span>
                <span style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, marginLeft: 8, padding: "2px 6px", border: `1px solid ${C.border2}` }}>{a.code}</span>
              </div>
            </div>
            <div style={{ fontFamily: FB, fontSize: 14, fontWeight: 700, color: driveColor(a.driveTimeMinutes) }}>{formatDrive(a.driveTimeMinutes)}</div>
            <div style={{ fontFamily: FB, fontSize: 13, color: C.textLight }}>{a.distanceKm ? `${a.distanceKm} km` : ""}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── REVIEWS ─────────────────────────────────────────────────────────────────
function Reviews({ testimonials, venue, venueSlug }) {
  const C = useT();
  const isMobile = useIsMobile();
  const [expandedFirst, setExpandedFirst] = useState(false);

  if (!testimonials || !Array.isArray(testimonials) || testimonials.length === 0) return null;

  const featured = testimonials[0];
  const rest = testimonials.slice(1);
  const LONG_THRESHOLD = 300;
  const featuredIsLong = (featured.text || '').length > LONG_THRESHOLD;

  // Avatar initials helper
  const getInitials = (names) => {
    if (!names) return '?';
    const parts = names.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Compact card for horizontal slider
  const compactCard = (r, idx) => (
    <div
      key={r.id || idx}
      style={{
        flex: '0 0 340px',
        padding: 20,
        border: `1px solid ${C.border}`,
        background: C.surface,
        scrollSnapAlign: 'start',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Stars */}
      <Stars rating={r.rating} size={11} />

      {/* Title */}
      {r.title && (
        <div style={{ fontFamily: FD, fontSize: 14, color: C.text, lineHeight: 1.4 }}>{r.title}</div>
      )}

      {/* Body – 4 line clamp */}
      <p style={{
        fontFamily: FB, fontSize: 13, color: C.textMid, lineHeight: 1.75, margin: 0,
        display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        flex: 1,
      }}>{r.text}</p>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
        <div style={{
          width: 28, height: 28, background: C.goldLight, border: `1px solid ${C.goldBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: FD, fontSize: 11, color: C.gold, flexShrink: 0,
        }}>{getInitials(r.names)}</div>
        <div>
          <div style={{ fontFamily: FB, fontSize: 12, color: C.text, fontWeight: 600 }}>{r.names}</div>
          <div style={{ fontFamily: FB, fontSize: 10, color: C.textMuted }}>
            {[r.location, r.date].filter(Boolean).join(' · ')}
          </div>
        </div>
        {r.verified && (
          <span style={{ marginLeft: 'auto', fontFamily: FB, fontSize: 10, color: C.green, fontWeight: 700, whiteSpace: 'nowrap' }}>✓ Verified</span>
        )}
      </div>
    </div>
  );

  return (
    <section id="reviews" style={{ marginBottom: 56 }}>
      <SectionHeading title="What Couples Say" subtitle={`Rated ${venue?.rating || '5.0'} by ${venue?.reviews || testimonials.length} verified couple${(venue?.reviews || testimonials.length) !== 1 ? 's' : ''}`} />

      {/* ── Featured review ───────────────────────────────────────────────── */}
      <div style={{
        padding: isMobile ? 20 : 32,
        borderLeft: `3px solid ${C.gold}`,
        border: `1px solid ${C.goldBorder}`,
        borderLeftWidth: 3,
        borderLeftColor: C.gold,
        background: C.goldLight,
        marginBottom: rest.length > 0 ? 28 : 0,
        position: 'relative',
      }}>
        {/* Large quote mark */}
        <div style={{
          fontFamily: FD, fontSize: 72, color: C.gold, lineHeight: 0.6,
          marginBottom: 16, opacity: 0.6, userSelect: 'none',
        }}>"</div>

        {/* Title */}
        {featured.title && (
          <div style={{ fontFamily: FD, fontSize: 18, color: C.text, marginBottom: 10 }}>{featured.title}</div>
        )}

        {/* Body */}
        <p style={{
          fontFamily: FB, fontSize: 14, color: C.textMid, lineHeight: 1.8, margin: 0,
          ...(!expandedFirst && featuredIsLong ? {
            display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          } : {}),
        }}>{featured.text}</p>

        {featuredIsLong && (
          <button
            onClick={() => setExpandedFirst(e => !e)}
            style={{
              marginTop: 8, fontFamily: FB, fontSize: 12, color: C.gold,
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontWeight: 600,
            }}
          >{expandedFirst ? 'Show less' : 'Read more'}</button>
        )}

        {/* Footer row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
          <div style={{
            width: 40, height: 40, background: C.goldLight, border: `1px solid ${C.goldBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: FD, fontSize: 15, color: C.gold, flexShrink: 0,
          }}>{getInitials(featured.names)}</div>
          <div>
            <div style={{ fontFamily: FD, fontSize: 15, color: C.text }}>{featured.names}</div>
            <div style={{ fontFamily: FB, fontSize: 11, color: C.textMuted }}>
              {[featured.location, featured.date].filter(Boolean).join(' · ')}
            </div>
          </div>
          <div style={{ marginLeft: 4 }}>
            <Stars rating={featured.rating} size={12} />
          </div>
          {featured.verified !== false && (
            <span style={{ fontFamily: FB, fontSize: 11, color: C.green, fontWeight: 700, padding: '2px 8px', border: `1px solid ${C.green}`, borderRadius: 2 }}>✓ Verified</span>
          )}
        </div>
      </div>

      {/* ── More from guests ──────────────────────────────────────────────── */}
      {rest.length > 0 && (
        <>
          <div style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 12 }}>More from guests</div>
          <div style={{
            display: 'flex', gap: 16, overflowX: 'auto', scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none',
            paddingBottom: 4,
          }} className="vp-reviews-more-slider">
            {rest.map((r, i) => compactCard(r, i))}
          </div>
        </>
      )}

      {/* ── Bottom action row ─────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 24, flexWrap: 'wrap', gap: 12,
      }}>
        {/* Aggregate */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: FD, fontSize: 36, color: C.gold, lineHeight: 1 }}>{venue?.rating || '5.0'}</span>
          <div>
            <Stars rating={venue?.rating || 5} size={14} />
            <div style={{ fontFamily: FB, fontSize: 12, color: C.textMuted, marginTop: 2 }}>
              {venue?.reviews || testimonials.length} verified review{(venue?.reviews || testimonials.length) !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        {/* Read all link */}
        <a
          href={venueSlug ? `/venues/${venueSlug}/reviews` : '#'}
          style={{
            fontFamily: FB, fontSize: 13, color: C.gold, fontWeight: 600,
            textDecoration: 'none', letterSpacing: '0.2px',
          }}
          onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
          onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
        >Read all reviews →</a>
      </div>
    </section>
  );
}

// ─── ENQUIRY MODAL (shared: FAQ CTA, hero CTA, compare bar) ──────────────────
function EnquiryModal({ venue, onClose }) {
  const C = useT();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    hasDate: null, date: "", year: "", season: "",
    guests: "", budget: "",
    name1: "", name2: "", email: "", phone: "",
  });
  const [sent, setSent] = useState(false);

  const STEPS = 3;
  const years   = ["2025", "2026", "2027", "2028", "Not sure"];
  const seasons = ["Spring  Mar–May", "Summer  Jun–Aug", "Autumn  Sep–Nov", "Winter  Dec–Feb"];
  const guestTiers  = ["Up to 50", "50–80", "80–120", "120–180", "180+"];
  const budgetTiers = ["Under £15k", "£15–25k", "£25–50k", "£50k+"];

  const pill = (val, active, onClick) => (
    <button key={val} onClick={onClick} style={{
      padding: "8px 14px", border: `1px solid ${active ? C.gold : C.border2}`, borderRadius: "var(--lwd-radius-input)",
      background: active ? C.goldLight : "none",
      color: active ? C.gold : C.textMid,
      fontFamily: FB, fontSize: 12, fontWeight: active ? 700 : 400,
      cursor: "pointer", transition: "all 0.15s", letterSpacing: "0.2px",
    }}>{val}</button>
  );

  const canNext = () => {
    if (step === 1) return form.hasDate !== null && (form.hasDate ? !!form.date : (!!form.year && !!form.season));
    if (step === 2) return !!form.guests;
    if (step === 3) return !!(form.name1 && form.email);
    return false;
  };

  const prefilledMsg = () =>
    `Hi, we're ${form.name1}${form.name2 ? " & " + form.name2 : ""}. We're planning a ${form.hasDate ? `wedding on ${form.date}` : `${form.season?.split("  ")[0].toLowerCase()} ${form.year} wedding`} for ${form.guests} guests${form.budget ? " with a budget of " + form.budget : ""}. We'd love to learn more about ${venue.name}, could you share availability and pricing?`;

  const echoSummary = () => {
    const datePart = form.hasDate
      ? new Date(form.date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      : [form.season?.split("  ")[0], form.year].filter(Boolean).join(" ");
    return [datePart, form.guests ? `${form.guests} guests` : "", form.budget].filter(Boolean).join("  ·  ");
  };

  if (sent) return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.surface, maxWidth: 480, width: "90vw",
        border: `1px solid ${C.border}`, boxShadow: C.shadowLg,
        animation: "lwd-modal-in 0.3s ease", overflow: "hidden",
      }}>
        {/* Venue photo banner */}
        <div style={{ height: 130, position: "relative", overflow: "hidden" }}>
          <img src={venue.imgs[0]} alt={venue.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 100%)" }} />
          <div style={{ position: "absolute", bottom: 14, left: 24, fontFamily: FD, fontSize: 13, color: "rgba(255,255,255,0.8)", letterSpacing: "0.4px" }}>{venue.name} · {venue.location}</div>
        </div>

        {/* Gold ✓ circle, floats on the seam */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: -28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: C.gold, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, color: "#0f0d0a", fontWeight: 700,
            border: `3px solid ${C.surface}`, boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          }}>✓</div>
        </div>

        {/* Body */}
        <div style={{ padding: "18px 32px 32px", textAlign: "center" }}>
          <h3 style={{ fontFamily: FD, fontSize: 26, color: C.text, marginBottom: 10, lineHeight: 1.2 }}>Enquiry received</h3>
          <p style={{ fontFamily: FB, fontSize: 14, color: C.textLight, lineHeight: 1.75, marginBottom: 20 }}>
            <strong style={{ color: C.text, fontWeight: 600 }}>{venue.owner.name.split(" ")[0]}</strong> will personally review your enquiry and respond within{" "}
            <strong style={{ color: C.text, fontWeight: 600 }}>{venue.responseTime}</strong>.
          </p>

          {/* Echo card, reflects their selections back */}
          <div style={{
            background: C.goldLight, border: `1px solid ${C.goldBorder}`,
            borderRadius: "var(--lwd-radius-card)", padding: "14px 18px", marginBottom: 24, textAlign: "left",
          }}>
            <div style={{ fontFamily: FB, fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>Your enquiry summary</div>
            <div style={{ fontFamily: FD, fontSize: 14, color: C.text, lineHeight: 1.65 }}>{echoSummary()}</div>
            <div style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, marginTop: 6 }}>Confirmation sent to {form.email}</div>
          </div>

          <button onClick={onClose} style={{
            padding: "12px 36px", background: C.gold, border: "none", borderRadius: "var(--lwd-radius-input)",
            color: "#0f0d0a", fontFamily: FB, fontSize: 12, fontWeight: 800,
            letterSpacing: "1.2px", textTransform: "uppercase", cursor: "pointer",
          }}>Done</button>
        </div>
      </div>
    </div>
  );

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.58)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.surface, width: "100%", maxWidth: 520, border: `1px solid ${C.border}`, boxShadow: C.shadowLg, position: "relative" }}>

        {/* Gold top bar */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${C.gold}, ${C.green})` }} />

        {/* Header */}
        <div style={{ padding: "24px 28px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: FB, fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 4 }}>Enquire about {venue.name}</div>
            <h3 style={{ fontFamily: FD, fontSize: 22, color: C.text, margin: 0 }}>
              {step === 1 ? "When is your celebration?" : step === 2 ? "Tell us about your plans" : "Your details"}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, color: C.textMuted, cursor: "pointer", lineHeight: 1, padding: "0 0 0 16px" }}>✕</button>
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", gap: 6, padding: "16px 28px 0" }}>
          {[1,2,3].map(s => (
            <div key={s} style={{ flex: 1, height: 3, background: s <= step ? C.gold : C.border, borderRadius: 2, transition: "background 0.3s" }} />
          ))}
        </div>
        <div style={{ padding: "6px 28px 0", fontFamily: FB, fontSize: 11, color: C.textMuted }}>Step {step} of {STEPS}</div>

        {/* Step content */}
        <div style={{ padding: "20px 28px 0" }}>

          {/* Step 1, Date */}
          {step === 1 && (
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {[{v: true, l: "I have a date"}, {v: false, l: "Not yet"}].map(o => (
                  <button key={o.l} onClick={() => setForm(f => ({ ...f, hasDate: o.v }))} style={{
                    flex: 1, padding: "11px", border: `1px solid ${form.hasDate === o.v ? C.gold : C.border2}`,
                    borderRadius: "var(--lwd-radius-input)",
                    background: form.hasDate === o.v ? C.goldLight : "none",
                    color: form.hasDate === o.v ? C.gold : C.textMid,
                    fontFamily: FB, fontSize: 13, fontWeight: form.hasDate === o.v ? 700 : 400, cursor: "pointer",
                  }}>{o.l}</button>
                ))}
              </div>
              {form.hasDate === true && (
                <input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))}
                  style={{ width: "100%", padding: "11px 14px", border: `1px solid ${C.border2}`, background: C.bgAlt, color: C.text, fontFamily: FB, fontSize: 14, outline: "none" }} />
              )}
              {form.hasDate === false && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 8 }}>Year</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {years.map(y => pill(y, form.year === y, () => setForm(f => ({...f, year: y}))))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 8 }}>Season</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {seasons.map(s => pill(s, form.season === s, () => setForm(f => ({...f, season: s}))))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2, Guests + Budget */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 8 }}>Approx. guest count</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {guestTiers.map(g => pill(g, form.guests === g, () => setForm(f => ({...f, guests: g}))))}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 8 }}>Approximate budget <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {budgetTiers.map(b => pill(b, form.budget === b, () => setForm(f => ({...f, budget: b}))))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3, Contact */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[{k:"name1",ph:"Your name *"},{k:"name2",ph:"Partner's name"}].map(f => (
                  <input key={f.k} placeholder={f.ph} value={form[f.k]} onChange={e => setForm(fm => ({...fm, [f.k]: e.target.value}))}
                    style={{ padding: "11px 14px", border: `1px solid ${C.border2}`, background: C.bgAlt, color: C.text, fontFamily: FB, fontSize: 13, outline: "none" }} />
                ))}
              </div>
              <input placeholder="Email address *" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
                style={{ padding: "11px 14px", border: `1px solid ${C.border2}`, background: C.bgAlt, color: C.text, fontFamily: FB, fontSize: 13, outline: "none", width: "100%" }} />
              <input placeholder="Phone number (optional)" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))}
                style={{ padding: "11px 14px", border: `1px solid ${C.border2}`, background: C.bgAlt, color: C.text, fontFamily: FB, fontSize: 13, outline: "none", width: "100%" }} />
              <textarea rows={3} defaultValue={prefilledMsg()}
                style={{ padding: "11px 14px", border: `1px solid ${C.border2}`, background: C.bgAlt, color: C.text, fontFamily: FB, fontSize: 12, outline: "none", resize: "none", lineHeight: 1.6 }} />
              <div style={{ fontFamily: FB, fontSize: 11, color: C.textMuted }}>✓ You'll receive a copy of this enquiry by email</div>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div style={{ padding: "20px 28px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {step > 1
            ? <button onClick={() => setStep(s => s - 1)} style={{ background: "none", border: "none", fontFamily: FB, fontSize: 13, color: C.textLight, cursor: "pointer", padding: 0 }}>← Back</button>
            : <div />
          }
          {step < 3
            ? <button onClick={() => setStep(s => s + 1)} disabled={!canNext()} style={{
                padding: "11px 28px", background: canNext() ? C.gold : C.border, border: "none", borderRadius: "var(--lwd-radius-input)",
                color: canNext() ? "#fff" : C.textMuted, fontFamily: FB, fontSize: 12, fontWeight: 700,
                letterSpacing: "0.8px", textTransform: "uppercase", cursor: canNext() ? "pointer" : "default", transition: "all 0.2s",
              }}>Continue →</button>
            : <button onClick={() => setSent(true)} disabled={!canNext()} style={{
                padding: "11px 28px", background: canNext() ? C.gold : C.border, border: "none", borderRadius: "var(--lwd-radius-input)",
                color: canNext() ? "#fff" : C.textMuted, fontFamily: FB, fontSize: 12, fontWeight: 700,
                letterSpacing: "0.8px", textTransform: "uppercase", cursor: canNext() ? "pointer" : "default",
              }}>✦ Send enquiry</button>
          }
        </div>

        {/* Social proof */}
        <div style={{ padding: "0 28px 20px", display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontFamily: FB, fontSize: 11, color: C.green, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="zap" size={12} color={C.green} /> Responds in {venue.responseTime}</span>
          <span style={{ width: 1, height: 10, background: C.border }} />
          <span style={{ fontFamily: FB, fontSize: 11, color: C.textMuted }}>{venue.responseRate}% response rate</span>
          <span style={{ width: 1, height: 10, background: C.border }} />
          <span style={{ fontFamily: FB, fontSize: 11, color: C.textMuted }}>🔥 3 enquired this week</span>
        </div>
      </div>
    </div>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────
const FAQ_DATA = [
  {
    category: "The Venue",
    icon: "I",
    questions: [
      { q: "Is Villa Rosanova available for exclusive use?", a: "Yes, Villa Rosanova is available for exclusive hire from Thursday to Sunday. Exclusive use includes all 24 bedrooms and 6 suites, full use of the grounds, gardens, pool pavilion and all venue spaces. Pricing from £28,000 for the full weekend." },
      { q: "What is the maximum guest capacity?", a: "The estate accommodates up to 200 guests for a ceremony, 160 for a seated dinner and 180 for a standing reception. For intimate celebrations, we welcome parties from 20 guests." },
      { q: "Can we hold both the ceremony and reception here?", a: "Absolutely. The Cypress Garden seats 200 for outdoor ceremonies, while the Grand Salon accommodates 160 for indoor ceremonies. All reception spaces are on the same estate." },
    ],
  },
  {
    category: "Catering & Drink",
    icon: "II",
    questions: [
      { q: "Do you work with an in-house caterer or can we bring our own?", a: "We have an award-winning in-house culinary team led by Chef Marco Bellini. External caterers are permitted with prior approval and a corkage arrangement. Our sommelier curates a bespoke wine list featuring our own estate Chianti Classico." },
      { q: "Can you accommodate dietary requirements?", a: "Yes, our kitchen is fully equipped to cater for vegan, vegetarian, halal, kosher and gluten-free guests. Please advise your dedicated event planner of any requirements when confirming your booking." },
      { q: "Is there a corkage fee if we bring our own wine?", a: "External wine and spirits are welcome at £18 per bottle. We recommend our estate wine list as a first choice, our Chianti Classico is particularly popular with guests." },
    ],
  },
  {
    category: "Accommodation",
    icon: "III",
    questions: [
      { q: "How many guests can stay on the estate overnight?", a: "Villa Rosanova sleeps 58 guests across 24 bedrooms and 6 suites. All rooms are uniquely decorated and include en-suite bathrooms. Bridal and groom suites are available with dedicated dressing areas." },
      { q: "What are the check-in and check-out times?", a: "Check-in is from 3pm on your arrival day. Check-out is by 11am on your departure day. For exclusive use bookings, we are flexible around your schedule, please discuss timing with your event planner." },
    ],
  },
  {
    category: "Getting Here",
    icon: "IV",
    questions: [
      { q: "What is the closest airport?", a: "Please see our Getting Here section for detailed airport information, driving times, and transfer options." },
      { q: "Is there parking on the estate?", a: "Parking information will be provided during your enquiry consultation." },
    ],
  },
  {
    category: "Planning & Suppliers",
    icon: "V",
    questions: [
      { q: "Do we need to use your recommended suppliers?", a: "We have a curated list of preferred suppliers, florists, photographers, bands and planners, who know the estate well. However, you are welcome to bring your own suppliers subject to prior approval from our events team." },
      { q: "How far in advance should we book?", a: "Peak summer dates (June–September) book 18–24 months in advance. Spring and autumn dates are often available with 12 months' notice. We recommend securing your date as early as possible to avoid disappointment." },
      { q: "Is a wedding planner included in the venue hire?", a: "Our dedicated event coordinator will support you from enquiry through to your wedding day. For comprehensive planning services, we can recommend preferred planning partners." },
    ],
  },
];

function FAQSection({ venue, onAsk }) {
  const C = useT();
  const [openItems, setOpenItems] = useState({});
  const faqData = venue?.faq;
  if (!faqData || faqData.enabled === false) return null;
  const categories = (faqData.categories || []).filter(c => c.questions?.length > 0).slice(0, 4);
  if (categories.length === 0) return null;

  const toggle = (catIdx, qIdx) => {
    const key = `${catIdx}-${qIdx}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <section id="faqs" style={{ marginBottom: 56 }}>
      <SectionHeading
        title={faqData.title || "FAQs"}
        subtitle={faqData.subtitle || ""}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {categories.map((cat, catIdx) => (
          <div key={cat.category} style={{
            background: C.bgAlt,
            border: `1px solid ${C.border}`,
            padding: "24px 28px",
          }}>
            {/* Category label */}
            <div style={{
              display: "flex", alignItems: "center", gap: 14,
              marginBottom: 16, paddingBottom: 14,
              borderBottom: `1px solid ${C.goldBorder}`,
            }}>
              <span style={{
                fontFamily: FD,
                fontSize: 11,
                color: C.gold,
                letterSpacing: "2px",
                minWidth: 24,
                textAlign: "center",
                opacity: 0.9,
              }}>{cat.icon}</span>
              <span style={{ fontFamily: FB, fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: "1.8px", textTransform: "uppercase" }}>{cat.category}</span>
            </div>

            {/* Questions */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {cat.questions.map((item, qIdx) => {
                const isOpen = openItems[`${catIdx}-${qIdx}`];
                return (
                  <div key={qIdx} style={{ borderBottom: `1px solid ${C.border}` }}>
                    {/* Question row */}
                    <button
                      onClick={() => toggle(catIdx, qIdx)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center",
                        justifyContent: "space-between", gap: 16,
                        padding: "21px 0", background: "none", border: "none",
                        cursor: "pointer", textAlign: "left",
                        transition: "opacity 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
                      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                    >
                      <span style={{
                        fontFamily: FB, fontSize: 14, fontWeight: 600,
                        color: isOpen ? C.gold : C.text,
                        lineHeight: 1.4, flex: 1,
                        transition: "color 0.2s",
                      }}>{item.q}</span>
                      <span style={{
                        fontSize: 18, color: isOpen ? C.gold : C.textMuted,
                        flexShrink: 0, transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                        transition: "transform 0.3s ease, color 0.2s",
                        display: "inline-block", fontWeight: 300,
                        lineHeight: 1,
                      }}>+</span>
                    </button>

                    {/* Answer, smooth height transition */}
                    <div style={{
                      overflow: "hidden",
                      maxHeight: isOpen ? 300 : 0,
                      transition: "max-height 0.4s ease",
                    }}>
                      <p style={{
                        fontFamily: FB, fontSize: 14, color: C.textLight,
                        lineHeight: 1.8, paddingBottom: 18,
                        margin: 0, paddingRight: 32,
                      }}>{item.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {faqData.ctaEnabled !== false && (
        <div style={{
          marginTop: 32, padding: "20px 24px",
          background: C.goldLight, border: `1px solid ${C.goldBorder}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        }}>
          <div>
            <div style={{ fontFamily: FD, fontSize: 17, color: C.text, marginBottom: 4 }}>{faqData.ctaHeadline || "Still have a question?"}</div>
            <div style={{ fontFamily: FB, fontSize: 13, color: C.textLight }}>{faqData.ctaSubtext || "Our team is here to help."}</div>
          </div>
          <button style={{
            padding: "11px 24px", background: C.gold, border: "none", borderRadius: "var(--lwd-radius-input)",
            color: "#fff", fontFamily: FB, fontSize: 12, fontWeight: 700,
            letterSpacing: "0.8px", textTransform: "uppercase", cursor: "pointer",
            flexShrink: 0, transition: "opacity 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          onClick={onAsk}>{faqData.ctaButtonText || "Ask a question"} →</button>
        </div>
      )}
    </section>
  );
}

// ─── SIMILAR VENUES ───────────────────────────────────────────────────────────
// Recommendation logic (production): query venues WHERE country = venue.country
// AND region = venue.region AND venueType = venue.venueType, ordered by
// price proximity and capacity overlap. Max 3 results.
// Admin can override via venue.similarVenuesManualOverride (array of venue objects).
function SimilarVenues({ venue }) {
  const C = useT();
  const isMobile = useIsMobile();

  // Admin toggle guard
  if (venue.similarVenuesEnabled === false) return null;

  // Manual admin override takes priority; fallback to pre-computed similar list
  const venues = (
    venue.similarVenuesManualOverride?.length
      ? venue.similarVenuesManualOverride
      : venue.similar || []
  ).slice(0, 3);

  if (venues.length === 0) return null;

  return (
    <section id="continue-exploring" style={{ marginBottom: 56 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
        <SectionHeading title="Continue Exploring" />
      </div>
      <div style={{ fontFamily: FB, fontSize: 12, color: C.gold, marginBottom: 24, marginTop: -20 }}>
        ✦ Curated based on location, venue type &amp; capacity
      </div>
      {isMobile ? (
        <SliderNav className="venue-similar-slider" cardWidth={300} gap={12}>
          {venues.map(({ location: loc, slug, ...rest }) => (
            <div key={rest.id} style={{ flex: "0 0 300px", scrollSnapAlign: "start" }} onClick={() => {
              if (slug) window.location.href = `/wedding-venues/${slug}`;
            }}>
              <GCardMobile
                v={{ ...rest, region: loc, image: rest.img, priceFrom: rest.price }}
                saved={false}
                onSave={() => {}}
                onView={() => {}}
              />
            </div>
          ))}
        </SliderNav>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${venues.length}, 1fr)`, gap: 16 }}>
          {venues.map(v => (
            <div key={v.id} style={{ border: `1px solid ${C.border}`, background: C.surface, overflow: "hidden", cursor: "pointer", borderRadius: 2 }}
              onClick={() => {
                if (v.slug) window.location.href = `/wedding-venues/${v.slug}`;
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = C.shadowMd}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
              <div style={{ overflow: "hidden", aspectRatio: "1/1" }}>
                <img src={v.img} alt={v.name} className="lwd-img-zoom" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
              <div style={{ padding: 18 }}>
                <div style={{ fontFamily: FD, fontSize: 18, color: C.text, marginBottom: 4 }}>{v.name}</div>
                <div style={{ fontFamily: FB, fontSize: 12, color: C.textLight, marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
                  <Icon name="pin" size={12} color={C.textLight} /> {v.location}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Stars rating={v.rating} size={11} />
                    <span style={{ fontFamily: FB, fontSize: 12, color: C.textLight }}>{v.rating}</span>
                  </div>
                  <span style={{ fontFamily: FD, fontSize: 16, color: C.gold }}>From {fmtPrice(v.price, v.currency)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── RECENTLY VIEWED ──────────────────────────────────────────────────────────
// Reads from localStorage (ldw_recently_viewed). Excludes current venue.
// Max 3 cards shown. Section hidden if empty or admin-disabled.
function RecentlyViewed({ venue }) {
  const C = useT();
  const isMobile = useIsMobile();
  const [items, setItems] = useState([]);

  useEffect(() => {
    // Read stored visits, exclude current venue, filter out invalid entries, cap at 3
    const stored = getRVList()
      .filter(v => v.id !== venue.id && v.name && v.location)
      .slice(0, 3);
    setItems(stored);
  }, [venue.id]);

  // Admin toggle guard + empty guard
  if (venue.recentlyViewedEnabled === false || items.length === 0) return null;

  return (
    <section id="recently-viewed" style={{ marginBottom: 56 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
        <SectionHeading title="Recently Viewed" />
      </div>
      <div style={{ fontFamily: FB, fontSize: 12, color: C.gold, marginBottom: 24, marginTop: -20 }}>
        ✦ Based on your browsing session
      </div>
      {isMobile ? (
        <SliderNav className="venue-recent-slider" cardWidth={300} gap={12}>
          {items.map(({ location: loc, img, price, slug, ...rest }) => (
            <div key={rest.id} style={{ flex: "0 0 300px", scrollSnapAlign: "start" }} onClick={() => {
              if (slug) window.location.href = `/wedding-venues/${slug}`;
            }}>
              <GCardMobile
                v={{ ...rest, region: loc, image: img, priceFrom: price }}
                saved={false}
                onSave={() => {}}
                onView={() => {}}
              />
            </div>
          ))}
        </SliderNav>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 16 }}>
          {items.map(v => (
            <div key={v.id} style={{ border: `1px solid ${C.border}`, background: C.surface, overflow: "hidden", cursor: "pointer", borderRadius: 2 }}
              onClick={() => {
                if (v.slug) window.location.href = `/wedding-venues/${v.slug}`;
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = C.shadowMd}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
              <div style={{ overflow: "hidden", aspectRatio: "1/1" }}>
                <img src={v.img} alt={v.name} className="lwd-img-zoom" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
              <div style={{ padding: 18 }}>
                <div style={{ fontFamily: FD, fontSize: 18, color: C.text, marginBottom: 4 }}>{v.name}</div>
                <div style={{ fontFamily: FB, fontSize: 12, color: C.textLight, marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
                  <Icon name="pin" size={12} color={C.textLight} /> {v.location}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Stars rating={v.rating} size={11} />
                    <span style={{ fontFamily: FB, fontSize: 12, color: C.textLight }}>{v.rating}</span>
                  </div>
                  <span style={{ fontFamily: FD, fontSize: 16, color: C.gold }}>From {fmtPrice(v.price, v.currency)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── MOBILE LEAD BAR ─────────────────────────────────────────────────────────
function MobileLeadBar({ venue }) {
  const C = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="lwd-mobile-bar" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 900,
        background: C.surface, borderTop: `1px solid ${C.border}`,
        padding: "12px 20px", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
        animation: "slideUp 0.4s ease",
      }}>
        <div>
          <div style={{ fontFamily: FD, fontSize: 18, color: C.gold }}>From {fmtPrice(venue.priceFrom, venue.priceCurrency)}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
            <Stars rating={venue.rating} size={11} />
            {venue.reviews != null && <span style={{ fontFamily: FB, fontSize: 11, color: C.textLight }}>{venue.reviews} reviews</span>}
          </div>
        </div>
        <button onClick={() => setOpen(true)} style={{
          padding: "12px 24px", background: C.gold, border: "none", borderRadius: "var(--lwd-radius-input)",
          color: "#fff", fontFamily: FB, fontSize: 13, fontWeight: 700,
          letterSpacing: "0.6px", textTransform: "uppercase", cursor: "pointer",
        }}>Send Enquiry</button>
      </div>
      {open && (
        <div onClick={() => setOpen(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 950,
          display: "flex", alignItems: "flex-end",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: "100%", background: C.surface, padding: 24,
            borderTop: `3px solid ${C.gold}`,
            animation: "slideUp 0.3s ease",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontFamily: FD, fontSize: 22, color: C.text }}>Send Enquiry</div>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", fontSize: 22, color: C.textMuted, cursor: "pointer" }}>×</button>
            </div>
            <LeadForm venue={venue} />
          </div>
        </div>
      )}
    </>
  );
}

// ─── COMPARE MODAL ───────────────────────────────────────────────────────────

const VENUE_TYPE_LABELS = {
  venue:       'Venue',
  villa:       'Villa',
  castle:      'Castle',
  hotel:       'Hotel',
  manor:       'Manor House',
  chateau:     'Château',
  barn:        'Barn',
  garden:      'Garden',
  beach:       'Beach',
  vineyard:    'Vineyard',
  estate:      'Estate',
  palazzo:     'Palazzo',
  resort:      'Resort',
  farmhouse:   'Farmhouse',
  penthouse:   'Penthouse',
  lodge:       'Lodge',
  yacht:       'Yacht',
  island:      'Private Island',
  rooftop:     'Rooftop',
  loft:        'Loft',
  gallery:     'Gallery',
  spa:         'Spa & Retreat',
};

function CompareStat({ label, value, accent, C }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '14px 0', borderBottom: `1px solid rgba(255,255,255,0.07)`,
    }}>
      <span style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', fontWeight: 600 }}>
        {label}
      </span>
      <span style={{ fontFamily: FB, fontSize: 13, color: accent || 'rgba(255,255,255,0.82)', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>
        {value || <span style={{ color: 'rgba(255,255,255,0.22)', fontStyle: 'italic', fontWeight: 400 }}>—</span>}
      </span>
    </div>
  );
}

function CompareVenueColumn({ venue, isLast, highlight, C, onClose, onEnquire }) {
  const [hovered,    setHovered]    = useState(false);
  const [activeIdx,  setActiveIdx]  = useState(0);
  const [arrowHover, setArrowHover] = useState(null); // 'prev' | 'next' | null

  // ── Build full gallery from richest available source ──────────────────────
  const galleryImgs = (() => {
    if (Array.isArray(venue?.imgs) && venue.imgs.length > 0) {
      return venue.imgs
        .map(i => ({ src: i.src || i.url, alt: i.alt_text || venue.name }))
        .filter(i => i.src)
        .slice(0, 20);
    }
    if (Array.isArray(venue?.heroImages) && venue.heroImages.length > 0) {
      return venue.heroImages
        .filter(h => h?.url)
        .map(h => ({ src: h.url, alt: venue.name }));
    }
    const single = venue?.heroImage || venue?.cardImage || null;
    return single ? [{ src: single, alt: venue?.name || '' }] : [];
  })();

  const totalImgs  = galleryImgs.length;
  const currentImg = galleryImgs[activeIdx] || null;

  const goPrev = (e) => {
    e.stopPropagation();
    setActiveIdx(i => (i - 1 + totalImgs) % totalImgs);
  };
  const goNext = (e) => {
    e.stopPropagation();
    setActiveIdx(i => (i + 1) % totalImgs);
  };

  const locationParts = [venue?.city, venue?.region, venue?.country].filter(Boolean);
  const location = locationParts.join(', ');
  const flag = COUNTRY_FLAG[venue?.country] || '';
  const price = venue?.priceFrom
    ? `${venue.priceCurrency || '€'}${Number(venue.priceFrom).toLocaleString()}`
    : null;
  const capacity = venue?.capacity ? `Up to ${Number(venue.capacity).toLocaleString()} guests` : null;
  const type = VENUE_TYPE_LABELS[venue?.listingType?.toLowerCase?.()] ||
    (venue?.listingType ? venue.listingType.charAt(0).toUpperCase() + venue.listingType.slice(1) : null);
  const rating = venue?.rating ? Number(venue.rating).toFixed(1) : null;
  const reviews = venue?.reviewCount ?? venue?.reviews ?? null;
  const exclusiveUse = venue?.exclusiveUseEnabled ?? venue?.exclusiveUse?.enabled ?? null;
  const slug = venue?.slug || null;
  const profileUrl = slug ? `/venues/${slug}` : null;

  if (!venue || (!venue.name && !currentImg)) {
    return (
      <div style={{
        borderRight: isLast ? 'none' : `1px solid rgba(184,160,90,0.12)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 500,
      }}>
        <div style={{ fontFamily: FB, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Unable to load</div>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRight: isLast ? 'none' : `1px solid rgba(184,160,90,0.12)`,
        display: 'flex', flexDirection: 'column',
        position: 'relative',
        background: hovered ? '#111110' : '#0f0f0d',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'transform 0.22s cubic-bezier(0.25,0.46,0.45,0.94), background 0.2s ease',
        boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.5)' : 'none',
        zIndex: hovered ? 2 : 1,
      }}
    >

      {/* Highlight badge */}
      {highlight && (
        <div style={{
          position: 'absolute', top: 16, left: 16, zIndex: 4,
          background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)',
          border: `1px solid ${C.gold}`,
          padding: '3px 10px', borderRadius: 2,
          fontFamily: FB, fontSize: 9, fontWeight: 700,
          letterSpacing: '0.14em', textTransform: 'uppercase', color: C.gold,
        }}>
          {highlight}
        </div>
      )}

      {/* ── Gallery ── */}
      <div style={{ position: 'relative', height: 340, flexShrink: 0, overflow: 'hidden', background: '#1a1a18' }}>

        {/* Slides — instant crossfade */}
        {galleryImgs.map((img, i) => (
          <img
            key={i}
            src={img.src}
            alt={img.alt}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'cover',
              opacity: i === activeIdx ? 1 : 0,
              transition: 'opacity 0.38s ease',
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Fallback placeholder */}
        {galleryImgs.length === 0 && (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1a18 0%, #2a2a24 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: FD, fontSize: 32, color: 'rgba(184,160,90,0.2)' }}>✦</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.86) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)', zIndex: 1 }} />

        {/* Prev / Next arrows — shown only when >1 image and card is hovered */}
        {totalImgs > 1 && (
          <>
            <button
              onClick={goPrev}
              onMouseEnter={() => setArrowHover('prev')}
              onMouseLeave={() => setArrowHover(null)}
              aria-label="Previous photo"
              style={{
                position: 'absolute', left: 10, top: '50%',
                transform: `translateY(-50%) ${arrowHover === 'prev' ? 'scale(1.1)' : 'scale(1)'}`,
                zIndex: 3,
                width: 32, height: 32, borderRadius: '50%',
                background: arrowHover === 'prev' ? 'rgba(0,0,0,0.72)' : 'rgba(0,0,0,0.48)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: '#fff', fontSize: 14, lineHeight: 1,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: hovered ? 1 : 0,
                transition: 'opacity 0.2s ease, background 0.15s, transform 0.15s',
                backdropFilter: 'blur(8px)',
              }}
            >
              ‹
            </button>
            <button
              onClick={goNext}
              onMouseEnter={() => setArrowHover('next')}
              onMouseLeave={() => setArrowHover(null)}
              aria-label="Next photo"
              style={{
                position: 'absolute', right: 10, top: '50%',
                transform: `translateY(-50%) ${arrowHover === 'next' ? 'scale(1.1)' : 'scale(1)'}`,
                zIndex: 3,
                width: 32, height: 32, borderRadius: '50%',
                background: arrowHover === 'next' ? 'rgba(0,0,0,0.72)' : 'rgba(0,0,0,0.48)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: '#fff', fontSize: 14, lineHeight: 1,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: hovered ? 1 : 0,
                transition: 'opacity 0.2s ease, background 0.15s, transform 0.15s',
                backdropFilter: 'blur(8px)',
              }}
            >
              ›
            </button>
          </>
        )}

        {/* Photo count badge — top right */}
        {totalImgs > 1 && (
          <div style={{
            position: 'absolute', top: 14, right: 14, zIndex: 3,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.12)',
            padding: '3px 9px', borderRadius: 20,
            fontFamily: FB, fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.75)',
            letterSpacing: '0.04em',
          }}>
            {activeIdx + 1} / {totalImgs}
          </div>
        )}

        {/* Dot indicators — sit just above the name/rating overlay */}
        {totalImgs > 1 && totalImgs <= 12 && (
          <div style={{
            position: 'absolute', bottom: 92, left: 0, right: 0,
            display: 'flex', justifyContent: 'center', gap: 5, zIndex: 3,
          }}>
            {galleryImgs.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setActiveIdx(i); }}
                aria-label={`Photo ${i + 1}`}
                style={{
                  width: i === activeIdx ? 18 : 5,
                  height: 5, borderRadius: 3,
                  background: i === activeIdx ? C.gold : 'rgba(255,255,255,0.35)',
                  border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'width 0.3s ease, background 0.2s ease',
                }}
              />
            ))}
          </div>
        )}

        {/* Name / rating overlay */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 24px 20px', zIndex: 2 }}>
          {rating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7 }}>
              <span style={{ color: C.gold, fontSize: 10 }}>★</span>
              <span style={{ fontFamily: FB, fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>
                {rating}
              </span>
              {reviews > 0 && (
                <span style={{ fontFamily: FB, fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>
                  · {reviews} review{reviews !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
          <div style={{ fontFamily: FD, fontSize: 22, color: '#fff', fontWeight: 400, lineHeight: 1.2, marginBottom: 5 }}>
            {venue.name}
          </div>
          {location && (
            <div style={{ fontFamily: FB, fontSize: 11, color: 'rgba(255,255,255,0.52)', letterSpacing: '0.02em' }}>
              {flag && <span style={{ marginRight: 5 }}>{flag}</span>}
              {location}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '20px 24px 16px', flex: 1, background: 'transparent' }}>
        {/* Price — decision anchor, prominent */}
        <div style={{
          padding: '16px 0 14px',
          borderBottom: `1px solid rgba(255,255,255,0.07)`,
          marginBottom: 2,
        }}>
          <div style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', fontWeight: 600, marginBottom: 6 }}>
            Starting From
          </div>
          <div style={{ fontFamily: FD, fontSize: 28, color: C.gold, fontWeight: 400, letterSpacing: '0.01em', lineHeight: 1 }}>
            {price || <span style={{ fontFamily: FB, fontSize: 13, color: 'rgba(255,255,255,0.22)', fontStyle: 'italic', fontWeight: 400 }}>Price on request</span>}
          </div>
        </div>

        <CompareStat label="Capacity" value={capacity} C={C} />
        <CompareStat label="Venue Type" value={type} C={C} />
        <CompareStat
          label="Exclusive Use"
          value={
            exclusiveUse === true  ? (
              <span style={{ color: '#6fcf67', fontWeight: 700 }}>✓ Available</span>
            ) : exclusiveUse === false ? (
              <span style={{ color: 'rgba(255,255,255,0.28)' }}>
                <span style={{ marginRight: 5, fontSize: 11 }}>×</span>Not offered
              </span>
            ) : null
          }
          C={C}
        />
      </div>

      {/* CTAs */}
      <div style={{ padding: '20px 24px 30px', display: 'flex', flexDirection: 'column', gap: 10, background: 'transparent' }}>
        {/* Primary — Send Enquiry */}
        <button
          onClick={() => onEnquire && onEnquire(venue)}
          style={{
            display: 'block', width: '100%', textAlign: 'center',
            padding: '13px 16px',
            background: C.gold,
            border: 'none',
            borderRadius: 'var(--lwd-radius-input)',
            color: '#0f0d0a', fontFamily: FB, fontSize: 12, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'background 0.15s, transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#b8922a';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(201,168,76,0.35)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = C.gold;
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Send Enquiry →
        </button>

        {/* Secondary — View Profile */}
        {profileUrl && (
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block', textAlign: 'center',
              padding: '11px 16px',
              background: 'transparent',
              border: `1px solid rgba(255,255,255,0.14)`,
              borderRadius: 'var(--lwd-radius-input)',
              color: 'rgba(255,255,255,0.45)', fontFamily: FB, fontSize: 11, fontWeight: 500,
              letterSpacing: '0.04em',
              textDecoration: 'none', cursor: 'pointer',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.32)'; e.currentTarget.style.color = 'rgba(255,255,255,0.72)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
          >
            View Full Profile
          </a>
        )}
      </div>
    </div>
  );
}

// ─── MINI CALENDAR ────────────────────────────────────────────────────────────
const CAL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const CAL_DAYS   = ['Mo','Tu','We','Th','Fr','Sa','Su'];

function MiniCalendar({ anchorRect, selected, onChange, onClose }) {
  const initMonth = () => {
    const base = selected || new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  };
  const [month, setMonth] = useState(initMonth);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (!e.target.closest('[data-lwdcal]')) onClose(); };
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
  }, [onClose]);

  const prevMonth = (e) => { e.stopPropagation(); setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1)); };
  const nextMonth = (e) => { e.stopPropagation(); setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1)); };

  const today      = new Date();
  const firstDow   = (month.getDay() + 6) % 7; // Mon=0
  const daysInMo   = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells      = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMo }, (_, i) => i + 1)];

  const isSel  = (d) => d && selected && selected.getFullYear() === month.getFullYear() && selected.getMonth() === month.getMonth() && d === selected.getDate();
  const isToday = (d) => d && today.getFullYear() === month.getFullYear() && today.getMonth() === month.getMonth() && d === today.getDate();

  const pick = (d) => {
    if (!d) return;
    onChange(new Date(month.getFullYear(), month.getMonth(), d));
    onClose();
  };

  // Position: below the anchor, flip up if too close to bottom
  const viewH = window.innerHeight;
  const calH  = 280;
  const top   = anchorRect.bottom + 6 + calH > viewH ? anchorRect.top - calH - 6 : anchorRect.bottom + 6;
  const left  = Math.min(anchorRect.left, window.innerWidth - 268);

  const navBtn = {
    background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
    fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: '2px 6px',
    transition: 'color 0.15s',
  };

  return (
    <div
      data-lwdcal=""
      onClick={e => e.stopPropagation()}
      style={{
        position: 'fixed', top, left, zIndex: 9999,
        width: 256,
        background: '#0d0d0b',
        border: '1px solid rgba(184,160,90,0.28)',
        borderRadius: 10,
        padding: '14px 14px 16px',
        boxShadow: '0 28px 70px rgba(0,0,0,0.85)',
        animation: 'lwd-modal-in 0.15s ease',
      }}
    >
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button style={navBtn} onClick={prevMonth}
          onMouseEnter={e => e.currentTarget.style.color = '#C9A84C'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
        >‹</button>
        <span style={{ fontFamily: FB, fontSize: 12, color: '#fff', fontWeight: 600, letterSpacing: '0.04em' }}>
          {CAL_MONTHS[month.getMonth()]} {month.getFullYear()}
        </span>
        <button style={navBtn} onClick={nextMonth}
          onMouseEnter={e => e.currentTarget.style.color = '#C9A84C'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
        >›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {CAL_DAYS.map(d => (
          <div key={d} style={{ fontFamily: FB, fontSize: 9, color: 'rgba(255,255,255,0.28)', textAlign: 'center', padding: '2px 0', letterSpacing: '0.06em' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Date cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((d, i) => (
          <button
            key={i}
            onClick={() => pick(d)}
            disabled={!d}
            style={{
              height: 30, borderRadius: 6, border: 'none',
              background: isSel(d)   ? '#C9A84C'
                        : isToday(d) ? 'rgba(201,168,76,0.14)'
                        : 'transparent',
              outline: isToday(d) && !isSel(d) ? '1px solid rgba(201,168,76,0.32)' : 'none',
              color: isSel(d) ? '#0f0d0a' : d ? 'rgba(255,255,255,0.78)' : 'transparent',
              fontFamily: FB, fontSize: 12,
              fontWeight: isSel(d) ? 700 : 400,
              cursor: d ? 'pointer' : 'default',
              transition: 'background 0.12s, color 0.12s',
            }}
            onMouseEnter={e => { if (d && !isSel(d)) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { if (d && !isSel(d)) e.currentTarget.style.background = isToday(d) ? 'rgba(201,168,76,0.14)' : 'transparent'; }}
          >
            {d || ''}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── COMPARE ENQUIRY FORM ─────────────────────────────────────────────────────
// Dark single-page form that floats above the compare modal.
// Compare grid stays visible in the background through the semi-opaque overlay.
const BASE_MSG = "We are currently exploring venues for our wedding and would love to learn more about your availability, pricing, and options.";

function buildMessage(date, guests) {
  const d = date?.trim();
  const g = guests?.trim();
  if (!d && !g) return BASE_MSG;
  const datePart   = d ? ` on ${d}` : '';
  const guestPart  = g ? ` for around ${g} guests` : '';
  return `We are currently exploring venues for our wedding${datePart}${guestPart} and would love to learn more about your availability, pricing, and options.`;
}

function CompareEnquiryForm({ venue, onClose }) {
  const { openMiniBar, sessionId } = useChat();
  const [form,        setForm]        = useState({ name1: '', name2: '', email: '', phone: '', date: '', guests: '', message: BASE_MSG });
  const [sent,        setSent]        = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [msgEdited,   setMsgEdited]   = useState(false);
  const [calOpen,     setCalOpen]     = useState(false);
  const [calAnchor,   setCalAnchor]   = useState(null);
  const [selDate,     setSelDate]     = useState(null);
  const dateFieldRef = useRef(null);
  const textareaRef  = useRef(null);

  // Place cursor at end of prefilled message when form mounts
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const len = ta.value.length;
    ta.setSelectionRange(len, len);
    // don't auto-focus on mount — let user tab in naturally
  }, []);

  // Rebuild message whenever date/guests change — only if user hasn't manually edited
  const { date, guests } = form;
  useEffect(() => {
    if (msgEdited) return;
    setForm(f => ({ ...f, message: buildMessage(date, guests) }));
  }, [date, guests, msgEdited]);

  const openCal = () => {
    if (dateFieldRef.current) setCalAnchor(dateFieldRef.current.getBoundingClientRect());
    setCalOpen(true);
  };

  const pickDate = (d) => {
    setSelDate(d);
    const label = `${d.getDate()} ${CAL_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    setForm(f => ({ ...f, date: label }));
    setCalOpen(false);
  };

  const clearDate = (e) => {
    e.stopPropagation();
    setSelDate(null);
    setForm(f => ({ ...f, date: '' }));
  };

  const heroSrc = venue?.imgs?.[0]?.src || venue?.heroImage || venue?.cardImage || null;
  const loc     = [venue?.city, venue?.country].filter(Boolean).join(', ');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const canSubmit = !!(form.name1 && form.email) && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await createLead({
        leadSource:   'Compare Enquiry',
        leadChannel:  'compare_modal',
        leadType:     'venue_enquiry',
        listingId:    String(venue.id),
        venueId:      String(venue.id),
        firstName:    form.name1.trim() || undefined,
        lastName:     form.name2.trim() || undefined,
        fullName:     [form.name1.trim(), form.name2.trim()].filter(Boolean).join(' & ') || undefined,
        email:        form.email.trim(),
        phone:        form.phone.trim() || undefined,
        weddingDate:  form.date.trim()   || undefined,
        guestCount:   form.guests.trim() || undefined,
        message:      form.message.trim(),
        auraSessionId: sessionId || undefined,
        intentSummary: `Venue enquiry from Compare modal for ${venue.name}`,
        requirementsJson: { source: 'compare_modal', venue_name: venue.name },
        tagsJson:     ['compare_enquiry'],
        consentDataProcessing: true,
      });
      if (!result.success) {
        console.error('[CompareEnquiryForm] createLead failed:', result.error);
        throw new Error(`DB error: ${result.error?.message || result.error?.code || JSON.stringify(result.error)}`);
      }
      setSent(true);
    } catch (err) {
      console.error('[CompareEnquiryForm] submit failed:', err?.message, err);
      setSubmitError('Something went wrong. Please try again or contact us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Design tokens ─────────────────────────────────────────────────────────
  const GOLD        = '#C9A84C';
  const GOLD_DIM    = 'rgba(201,168,76,0.55)';
  const GOLD_GLOW   = 'rgba(201,168,76,0.18)';

  const inputBase = {
    width: '100%', padding: '12px 16px',
    background: 'rgba(255,255,255,0.04)',         // darker resting — stays in the dark system
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 'var(--lwd-radius-input)',
    color: 'rgba(255,255,255,0.92)',              // text high-contrast, background not
    fontFamily: FB, fontSize: 13,
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.18s, background 0.18s, box-shadow 0.18s',
  };
  const FOCUS_SHADOW = `0 0 0 3px rgba(201,168,76,0.16), inset 0 1px 0 rgba(255,255,255,0.03)`;
  const focusStyle = (e) => {
    e.currentTarget.style.borderColor = 'rgba(201,168,76,0.52)';
    e.currentTarget.style.background  = 'rgba(255,255,255,0.06)';  // slight lift, not a flash
    e.currentTarget.style.boxShadow   = FOCUS_SHADOW;
  };
  const blurStyle = (e) => {
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
    e.currentTarget.style.background  = 'rgba(255,255,255,0.04)';
    e.currentTarget.style.boxShadow   = 'none';
  };

  const mkLabel = (text) => (
    <div style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', fontWeight: 700, marginBottom: 7 }}>
      {text}
    </div>
  );
  const mkField = (k, label, type = 'text') => (
    <div>
      {mkLabel(label)}
      <input type={type} value={form[k]} onChange={e => set(k, e.target.value)}
        onFocus={focusStyle} onBlur={blurStyle}
        style={inputBase} />
    </div>
  );

  // ── Layout styles ──────────────────────────────────────────────────────────
  const overlayStyle = {
    position: 'fixed', inset: 0, zIndex: 1100,
    background: 'rgba(0,0,0,0.72)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 'clamp(8px, 3vw, 24px)',
    backdropFilter: 'blur(6px)',
  };
  const panelStyle = {
    // Warm near-black with very subtle gold undertone
    background: 'linear-gradient(170deg, #111009 0%, #0c0c0a 50%, #0f0d08 100%)',
    border: '1px solid rgba(201,168,76,0.32)',
    borderRadius: 'clamp(10px, 2vw, 16px)',
    width: '100%', maxWidth: 500,
    maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto',
    // Multi-layer glow: close bloom + wide ambient + depth shadow
    boxShadow: [
      `inset 0 1px 0 rgba(255,255,255,0.06)`,           // top inner light edge
      `0 0 0 1px rgba(201,168,76,0.08)`,                // halo ring — very quiet
      `0 0 28px 4px rgba(201,168,76,0.10)`,             // close bloom — softer than CTA
      `0 0 80px 24px rgba(201,168,76,0.05)`,            // mid ambient — wide & faint
      `0 0 160px 60px rgba(201,168,76,0.025)`,          // far ambient — just a hint
      `0 60px 160px rgba(0,0,0,0.97)`,                  // depth shadow
    ].join(', '),
    animation: 'lwd-modal-in 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
  };

  // ── Confirmation screen ───────────────────────────────────────────────────
  if (sent) return (
    <div onClick={onClose} style={overlayStyle}>
      <div onClick={e => e.stopPropagation()} style={{ ...panelStyle, maxWidth: 460 }}>

        {/* Hero image carries through to confirmation */}
        {heroSrc && (
          <div style={{ position: 'relative', height: 120, overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
            <img src={heroSrc} alt={venue.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.6)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(12,12,10,1) 0%, rgba(0,0,0,0.1) 100%)' }} />
          </div>
        )}

        <div style={{ padding: heroSrc ? '0 44px 52px' : '60px 44px 52px', textAlign: 'center' }}>
          {/* Gold ring icon — floats on the hero seam */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: `linear-gradient(135deg, ${GOLD} 0%, #a87d2a 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, color: '#0f0d0a', fontWeight: 700,
            margin: heroSrc ? '-32px auto 28px' : '0 auto 28px',
            position: 'relative', zIndex: 1,
            boxShadow: `0 0 0 6px rgba(12,12,10,1), 0 0 0 10px rgba(201,168,76,0.14), 0 0 40px rgba(201,168,76,0.4)`,
          }}>✦</div>

          <div style={{ fontFamily: FD, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, fontWeight: 400, marginBottom: 14, opacity: 0.85 }}>
            One step closer
          </div>
          <div style={{ fontFamily: FD, fontSize: 28, color: '#fff', marginBottom: 16, lineHeight: 1.25, letterSpacing: '0.01em' }}>
            Your enquiry is on its way
          </div>
          <div style={{ fontFamily: FB, fontSize: 13, color: 'rgba(255,255,255,0.48)', lineHeight: 1.85, marginBottom: 36, maxWidth: 320, margin: '0 auto 36px' }}>
            You've taken a beautiful first step.<br />
            The team at <span style={{ color: 'rgba(255,255,255,0.78)', fontWeight: 500 }}>{venue.name}</span> will reach out personally to discuss your wedding.
          </div>

          <button onClick={onClose} style={{
            padding: '15px 52px',
            background: `linear-gradient(135deg, #d4a93e 0%, ${GOLD} 45%, #b8882a 100%)`,
            border: 'none', borderRadius: 'var(--lwd-radius-input)',
            color: '#0a0800', fontFamily: FB, fontSize: 12, fontWeight: 800,
            letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
            boxShadow: `0 2px 0 rgba(0,0,0,0.2), 0 6px 28px rgba(201,168,76,0.38), inset 0 1px 0 rgba(255,255,255,0.18)`,
            transition: 'transform 0.18s, box-shadow 0.18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 2px 0 rgba(0,0,0,0.2), 0 14px 36px rgba(201,168,76,0.52), inset 0 1px 0 rgba(255,255,255,0.18)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 0 rgba(0,0,0,0.2), 0 6px 28px rgba(201,168,76,0.38), inset 0 1px 0 rgba(255,255,255,0.18)'; }}
          >
            Back to comparison
          </button>

          <div style={{ fontFamily: FB, fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 16, lineHeight: 1.7, letterSpacing: '0.01em' }}>
            You can continue exploring or send another enquiry
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div onClick={onClose} style={overlayStyle}>
      <div onClick={e => e.stopPropagation()} style={panelStyle}>

      {/* ── Hero banner — tall, cinematic ── */}
      <div style={{ position: 'relative', height: 150, overflow: 'hidden', borderRadius: '16px 16px 0 0', flexShrink: 0 }}>
        {heroSrc
          ? <img src={heroSrc} alt={venue.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1a14 0%, #252518 100%)' }} />
        }
        {/* Cinematic gradient — deep at bottom, clear at top */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.1) 100%)' }} />
        {/* Venue info */}
        <div style={{ position: 'absolute', bottom: 16, left: 22, right: 52 }}>
          <div style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, fontWeight: 700, marginBottom: 5, opacity: 0.9 }}>
            Venue Enquiry
          </div>
          <div style={{ fontFamily: FD, fontSize: 21, color: '#fff', lineHeight: 1.2, marginBottom: 3 }}>{venue.name}</div>
          {loc && <div style={{ fontFamily: FB, fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.02em' }}>{loc}</div>}
        </div>
        <button onClick={onClose} aria-label="Close" style={{
          position: 'absolute', top: 10, right: 10,
          width: 28, height: 28, borderRadius: '50%',
          background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.5)', fontSize: 15, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.7)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.45)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
        >×</button>
      </div>

      {/* Gold accent bar — full gradient, 3px */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${GOLD} 0%, rgba(184,160,90,0.6) 60%, rgba(184,160,90,0.05) 100%)` }} />

      {/* ── Form body ── */}
      <div style={{ padding: 'clamp(16px, 4vw, 28px) clamp(16px, 5vw, 28px) 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Section title */}
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: GOLD, fontWeight: 700, opacity: 0.8, marginBottom: 7 }}>
            Begin your enquiry
          </div>
          <div style={{ fontFamily: FD, fontSize: 20, color: '#fff', lineHeight: 1.2, letterSpacing: '0.01em', marginBottom: 8 }}>
            Tell us about your wedding
          </div>
          <div style={{ fontFamily: FB, fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.01em', lineHeight: 1.5 }}>
            Your enquiry will be sent directly to this venue
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {mkField('name1', 'Your name *')}
          {mkField('name2', "Partner's name")}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {mkField('email', 'Email *', 'email')}
          {mkField('phone', 'Phone', 'tel')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {/* Date — calendar picker */}
          <div>
            {mkLabel('Wedding date')}
            <div
              ref={dateFieldRef}
              onClick={openCal}
              style={{
                ...inputBase,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', userSelect: 'none',
                borderColor:  calOpen ? 'rgba(201,168,76,0.52)' : 'rgba(255,255,255,0.1)',
                background:   calOpen ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)',
                boxShadow:    calOpen ? FOCUS_SHADOW : 'none',
              }}
            >
              <span style={{ color: form.date ? '#fff' : 'rgba(255,255,255,0.32)', fontSize: 13 }}>
                {form.date || 'Select a date'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {form.date && (
                  <span onClick={clearDate}
                    style={{ color: 'rgba(255,255,255,0.3)', fontSize: 15, lineHeight: 1, cursor: 'pointer', padding: '0 2px' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                  >×</span>
                )}
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ color: GOLD, opacity: 0.65, flexShrink: 0 }}>
                  <rect x="1" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M5 1v4M11 1v4M1 7h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </span>
            </div>
          </div>
          {mkField('guests', 'Estimated guests')}
        </div>

        {/* Calendar popup */}
        {calOpen && calAnchor && (
          <MiniCalendar anchorRect={calAnchor} selected={selDate} onChange={pickDate} onClose={() => setCalOpen(false)} />
        )}

        {/* Divider — transition to personal message */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
          <span style={{ fontFamily: FB, fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>Your message</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
            {mkLabel('Message')}
            <span style={{ fontFamily: FB, fontSize: 9, color: 'rgba(255,255,255,0.24)', letterSpacing: '0.02em', fontStyle: 'italic' }}>
              Add any details to personalise
            </span>
          </div>
          <textarea
            ref={textareaRef}
            value={form.message}
            onChange={e => { setMsgEdited(true); set('message', e.target.value); }}
            onFocus={e => {
              focusStyle(e);
              if (!msgEdited) { const len = e.target.value.length; e.target.setSelectionRange(len, len); }
            }}
            onBlur={blurStyle}
            rows={4}
            style={{ ...inputBase, resize: 'vertical', lineHeight: 1.7, fontSize: 13 }}
          />
        </div>

      </div>

      {/* ── Sticky CTA ── */}
      <div style={{
        position: 'sticky', bottom: 0,
        background: 'linear-gradient(to bottom, transparent 0%, #0c0c0a 28%)',
        padding: '28px 28px 20px',
        display: 'flex', flexDirection: 'column', gap: 11,
      }}>
        <button
          disabled={!canSubmit}
          onClick={handleSubmit}
          style={{
            padding: '16px 24px', width: '100%',
            background: canSubmit
              ? `linear-gradient(135deg, #d4a93e 0%, ${GOLD} 45%, #b8882a 100%)`
              : 'rgba(201,168,76,0.12)',
            border: canSubmit ? 'none' : `1px solid rgba(201,168,76,0.18)`,
            borderRadius: 'var(--lwd-radius-input)',
            color: canSubmit ? '#0a0800' : 'rgba(255,255,255,0.25)',
            fontFamily: FB, fontSize: 13, fontWeight: 800,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            cursor: canSubmit ? 'pointer' : 'default',
            boxShadow: canSubmit
              ? `0 2px 0 rgba(0,0,0,0.2), 0 6px 28px rgba(201,168,76,0.38), inset 0 1px 0 rgba(255,255,255,0.18)`
              : 'none',
            transition: 'all 0.18s',
            position: 'relative',
          }}
          onMouseEnter={e => { if (canSubmit) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 2px 0 rgba(0,0,0,0.2), 0 14px 36px rgba(201,168,76,0.52), inset 0 1px 0 rgba(255,255,255,0.18)'; } }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = canSubmit ? '0 2px 0 rgba(0,0,0,0.2), 0 6px 28px rgba(201,168,76,0.38), inset 0 1px 0 rgba(255,255,255,0.18)' : 'none'; }}
        >
          {submitting ? 'Sending…' : 'Send Enquiry →'}
        </button>
        {submitError && (
          <div style={{ fontFamily: FB, fontSize: 11, color: '#e57373', textAlign: 'center', lineHeight: 1.5 }}>
            {submitError}
          </div>
        )}
        <div style={{ fontFamily: FB, fontSize: 11, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 1.65, letterSpacing: '0.01em' }}>
          Your details are shared only with this venue and handled in confidence.
        </div>

        {/* Aura soft link */}
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <button
            type="button"
            onClick={openMiniBar}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontFamily: FB, fontSize: 11, letterSpacing: '0.03em',
              color: 'rgba(201,168,76,0.55)',
              transition: 'color 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(201,168,76,0.55)'; }}
          >
            ✦ Have questions before sending? Chat with Aura
          </button>
        </div>
      </div>

    </div>
    </div>
  );
}

function CompareModal({ items, onClose }) {
  const C = DARK; // modal is always dark
  const { openWorkspace, sendMessage, setChatContext, messages } = useChat();
  const [venues,       setVenues]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [enquiryVenue, setEnquiryVenue] = useState(null); // full venue object for in-modal enquiry

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Escape to close (only close compare if no enquiry form is open)
  useEffect(() => {
    const handler = e => {
      if (e.key === 'Escape') {
        if (enquiryVenue) setEnquiryVenue(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, enquiryVenue]);

  // Listen for Aura workspace "Enquire" button dispatches
  useEffect(() => {
    const handler = e => {
      const venue = venues.find(v => String(v.id) === String(e.detail?.venueId));
      if (venue) setEnquiryVenue(venue);
    };
    window.addEventListener('lwd:aura-enquire', handler);
    return () => window.removeEventListener('lwd:aura-enquire', handler);
  }, [venues]);

  // Fetch all venues
  useEffect(() => {
    if (!items.length) return;
    let cancelled = false;
    setLoading(true);
    Promise.all(
      items.map(item =>
        fetchListingById(String(item.id)).catch(() => ({ id: item.id, name: item.name }))
      )
    ).then(results => {
      if (!cancelled) { setVenues(results); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [items]);

  // Compute highlight badges — best rating, best price
  const highlights = {};
  if (venues.length >= 2) {
    const ratings = venues.map((v, i) => ({ i, val: v?.rating ? Number(v.rating) : -1 }));
    const prices  = venues.map((v, i) => ({ i, val: v?.priceFrom ? Number(v.priceFrom) : Infinity }));
    const topRated  = ratings.reduce((a, b) => b.val > a.val ? b : a);
    const bestValue = prices.reduce((a, b) => b.val < a.val ? b : a);
    if (topRated.val  > 0)          highlights[topRated.i]  = 'Highest Rated';
    if (bestValue.val < Infinity && bestValue.i !== topRated.i) highlights[bestValue.i] = 'Most Affordable';
  }

  const count = items.length;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 960,
        background: 'rgba(0,0,0,0.97)',
        display: 'flex', flexDirection: 'column',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* ── Header ── */}
      <div style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '28px 44px',
        borderBottom: `1px solid rgba(184,160,90,0.15)`,
        background: 'rgba(10,10,8,0.97)',
        backdropFilter: 'blur(20px)',
      }}>
        <div>
          <div style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: C.gold, fontWeight: 700, marginBottom: 8 }}>
            Venue Comparison
          </div>
          <div style={{ fontFamily: FD, fontSize: 26, color: '#fff', fontWeight: 400, letterSpacing: '0.01em' }}>
            {count === 1 ? 'Venue in Review' : `Comparing ${count} Venues`}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close comparison"
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.14)',
            color: 'rgba(255,255,255,0.7)', fontSize: 20, lineHeight: 1,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
        >
          ×
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflow: 'auto', padding: 'clamp(16px, 4vw, 44px)' }}>
        {loading ? (
          <div style={{
            height: '100%', minHeight: 400,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
          }}>
            <div style={{ fontFamily: FD, fontSize: 20, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.04em' }}>
              Curating your comparison…
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {items.map((_, i) => (
                <div key={i} style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: 'rgba(184,160,90,0.5)',
                  animation: `dotPulse 1.4s ease-in-out ${i * 0.18}s infinite`,
                }} />
              ))}
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${count}, minmax(260px, 1fr))`,
            border: `1px solid rgba(184,160,90,0.18)`,
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: '0 40px 100px rgba(0,0,0,0.75)',
          }}>
            {venues.map((venue, i) => (
              <CompareVenueColumn
                key={venue?.id || i}
                venue={venue}
                isLast={i === venues.length - 1}
                highlight={highlights[i] || null}
                C={C}
                onClose={onClose}
                onEnquire={(v) => setEnquiryVenue(v)}
              />
            ))}
          </div>
        )}

        {/* Footer note */}
        {!loading && (
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <span style={{ fontFamily: FB, fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
              Add up to 3 venues to compare · Click outside or press Esc to close
            </span>
          </div>
        )}
      </div>

      {/* ── Aura strip ── */}
      <div style={{
        flexShrink: 0,
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '13px 44px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(8,8,6,0.6)',
      }}>
        <button
          type="button"
          onClick={() => {
            // Set context — pass the full venue objects so the panel pins them
            setChatContext({ page: 'compare', country: venues[0]?.country || null, region: venues[0]?.destination || null, compareVenues: venues });
            // Open the full workspace — this is a decision environment, not a quick question
            openWorkspace();
            if (venues.length > 1) {
              // Only send the intro message once — don't repeat it every time the user reopens Aura
              const alreadySent = messages.some(m => m.from === 'user' && m.text?.startsWith("I'm comparing these venues:"));
              if (!alreadySent) {
                const venueSummaries = venues.map(v => {
                  const parts = [v.name];
                  if (v.type)                     parts.push(v.type);
                  if (v.destination || v.country) parts.push(v.destination || v.country);
                  if (v.capacity)                 parts.push(`up to ${v.capacity} guests`);
                  return parts.join(', ');
                });
                sendMessage(`I'm comparing these venues: ${venueSummaries.join(' · ')}. Can you help me understand which might be the better fit for our wedding?`);
              }
            }
          }}
          style={{
            background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            transition: 'opacity 0.18s',
            opacity: 0.65,
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '0.65'; }}
        >
          <span style={{
            width: 22, height: 22, borderRadius: '50%',
            background: 'rgba(201,168,76,0.12)',
            border: '1px solid rgba(201,168,76,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, color: '#C9A84C', flexShrink: 0,
          }}>✦</span>
          <span style={{
            fontFamily: FB, fontSize: 12, color: 'rgba(255,255,255,0.65)',
            letterSpacing: '0.02em',
          }}>
            Not sure which to choose?{' '}
            <span style={{ color: '#C9A84C' }}>Ask Aura →</span>
          </span>
        </button>
      </div>

      {/* ── Company footer ── */}
      <div style={{
        flexShrink: 0,
        borderTop: '1px solid rgba(184,160,90,0.1)',
        background: 'rgba(8,8,6,0.98)',
        backdropFilter: 'blur(12px)',
        padding: '16px 44px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 24,
      }}>
        {/* Left: wordmark + tagline */}
        <div>
          <div style={{ fontFamily: FD, fontSize: 14, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.04em', marginBottom: 3 }}>
            Luxury Wedding Directory
          </div>
          <div style={{ fontFamily: FB, fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.02em' }}>
            The world's finest venues and vendors, carefully selected
          </div>
        </div>

        {/* Right: legal links + copyright */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7 }}>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacy', 'Terms', 'Cookies', 'Contact'].map(lbl => (
              <a
                key={lbl}
                href={`/${lbl.toLowerCase()}`}
                style={{ fontFamily: FB, fontSize: 10, color: 'rgba(255,255,255,0.28)', textDecoration: 'none', letterSpacing: '0.02em', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#C9A84C'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.28)'}
              >
                {lbl}
              </a>
            ))}
          </div>
          <div style={{ fontFamily: FB, fontSize: 10, color: 'rgba(255,255,255,0.16)', letterSpacing: '0.01em' }}>
            &copy; {new Date().getFullYear()} Luxury Wedding Directory &middot; A brand of 5 Star Weddings Ltd
          </div>
        </div>
      </div>

      {/* In-modal enquiry form — dark single-page form, compare grid stays visible behind */}
      {enquiryVenue && (
        <CompareEnquiryForm
          venue={enquiryVenue}
          onClose={() => setEnquiryVenue(null)}
        />
      )}
    </div>
  );
}

// ─── COMPARE BAR ─────────────────────────────────────────────────────────────
function CompareBar({ items, onRemove, onClear, onCompare }) {
  const C = useT();
  if (!items.length) return null;
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 850,
      background: C.text, borderTop: `2px solid ${C.gold}`,
      padding: "12px 32px", display: "flex", alignItems: "center", gap: 12,
      animation: "slideUp 0.3s ease",
    }}>
      <span style={{ fontFamily: FB, fontSize: 12, color: "rgba(255,255,255,0.6)", letterSpacing: "0.5px", textTransform: "uppercase", flexShrink: 0 }}>Compare:</span>
      {items.map(v => (
        <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>
          <span style={{ fontFamily: FB, fontSize: 12, color: "#fff" }}>{v.name}</span>
          <button onClick={() => onRemove(v.id)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 14, lineHeight: 1 }}>×</button>
        </div>
      ))}
      {items.length < 3 && (
        <div style={{ padding: "5px 12px", border: "1px dashed rgba(255,255,255,0.25)", fontFamily: FB, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>+ Add venue</div>
      )}
      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        <button onClick={onClear} style={{ padding: "6px 14px", background: "none", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "var(--lwd-radius-input)", color: "rgba(255,255,255,0.6)", fontFamily: FB, fontSize: 12, cursor: "pointer" }}>Clear</button>
        <button onClick={onCompare} style={{ padding: "6px 20px", background: C.gold, border: "none", borderRadius: "var(--lwd-radius-input)", color: "#fff", fontFamily: FB, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Compare Now →</button>
      </div>
    </div>
  );
}

// ─── AURA PRESENCE ────────────────────────────────────────────────────────────
// Time-based availability: 09:00–18:00 UTC Mon–Fri = online
function getAuraStatus() {
  const now     = new Date();
  const hour    = now.getUTCHours();
  const weekday = now.getUTCDay(); // 0=Sun,6=Sat
  const online  = weekday >= 1 && weekday <= 5 && hour >= 9 && hour < 18;
  return {
    online,
    dotColor:  online ? '#4caf7d' : 'rgba(184,160,90,0.55)',
    ringColor: online ? 'rgba(76,175,125,0.2)' : 'rgba(184,160,90,0.12)',
    label:     online ? 'Online' : 'Typically responds within 24h',
    labelColor:online ? '#4caf7d' : 'rgba(184,160,90,0.7)',
  };
}

// ─── FLOATING AURA CHAT ──────────────────────────────────────────────────────
function AuraChat({ venue }) {
  const C = useT();
  const aura = getAuraStatus();
  // mode: "closed" | "modal" | "full"
  const [mode, setMode] = useState("closed");
  const [msgs, setMsgs] = useState([
    { from: "aura", text: `Hi! I'm Aura, your LWD assistant. I know about pricing, spaces, availability and more. What would you like to know?` }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const msgEndRef = useRef(null);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  const send = (text) => {
    const userMsg = (text || input).trim();
    if (!userMsg) return;
    setMsgs(m => [...m, { from: "user", text: userMsg }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs(m => [...m, { from: "aura", text: `Great question! ${venue.name} would be delighted to help with that. I can share details here, or you can send a formal enquiry and the team will respond within ${venue.responseTime}.` }]);
    }, 1100);
  };

  const CHIPS = ["Ceremony spaces", "Guest capacity", "Exclusive use", "Pricing & availability"];
  const TOPICS = [
    { iconName: "museum", label: "The Venue" },
    { iconName: "wine", label: "Catering & Drink" },
    { iconName: "spa", label: "Accommodation" },
    { iconName: "airport", label: "Getting Here" },
    { iconName: "dining", label: "Pricing" },
    { iconName: "check", label: "Planning Help" },
  ];

  // ── Shared: message bubbles ───────────────────────────────────────────────
  const bubbles = () => (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
      {msgs.map((m, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.from === "user" ? "flex-end" : "flex-start" }}>
          {m.from === "aura" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                background: `linear-gradient(135deg, ${C.gold}, ${C.green})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, color: "#fff",
              }}>✦</div>
              <span style={{ fontFamily: FB, fontSize: 11, color: C.textMuted, fontWeight: 600, letterSpacing: "0.03em" }}>Aura</span>
            </div>
          )}
          <div style={{
            maxWidth: "82%",
            background: m.from === "user"
              ? `linear-gradient(135deg, ${C.gold}, ${C.green})`
              : C.bgAlt,
            color: m.from === "user" ? "#fff" : C.text,
            padding: "11px 16px",
            fontFamily: FB, fontSize: 14, lineHeight: 1.65,
            borderRadius: m.from === "user" ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
            boxShadow: m.from === "user" ? `0 2px 12px rgba(157,135,62,0.25)` : C.shadow,
          }}>{m.text}</div>
        </div>
      ))}
      {typing && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <div style={{
            width: 22, height: 22, borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.gold}, ${C.green})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, color: "#fff", flexShrink: 0, marginTop: 2,
          }}>✦</div>
          <div style={{ background: C.bgAlt, padding: "13px 16px", borderRadius: "4px 16px 16px 16px", display: "flex", gap: 5, alignItems: "center" }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 7, height: 7, borderRadius: "50%", background: C.textMuted,
                animation: `dotPulse 1.4s ease ${i * 0.18}s infinite`,
              }} />
            ))}
          </div>
        </div>
      )}
      <div ref={msgEndRef} />
    </div>
  );

  // ── Shared: input bar ─────────────────────────────────────────────────────
  const inputBar = (size = "normal") => (
    <div style={{
      padding: size === "large" ? "16px 24px" : "12px 16px",
      borderTop: `1px solid ${C.border}`,
      display: "flex", gap: 8,
    }}>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === "Enter" && send()}
        placeholder="Ask about spaces, pricing, availability…"
        autoFocus
        style={{
          flex: 1, padding: size === "large" ? "13px 18px" : "10px 14px",
          border: `1px solid ${C.border2}`, borderRadius: size === "large" ? 12 : 10,
          background: C.bgAlt, color: C.text,
          fontFamily: FB, fontSize: size === "large" ? 14 : 13,
          outline: "none", transition: "border-color 0.2s",
        }}
        onFocus={e => e.target.style.borderColor = C.gold}
        onBlur={e => e.target.style.borderColor = C.border2}
      />
      <button onClick={() => send()} style={{
        width: size === "large" ? 46 : 40, height: size === "large" ? 46 : 40,
        background: `linear-gradient(135deg, ${C.gold}, ${C.green})`,
        border: "none", borderRadius: size === "large" ? 12 : 10,
        color: "#fff", fontSize: size === "large" ? 18 : 16,
        cursor: "pointer", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 2px 10px rgba(157,135,62,0.3)`,
      }}>→</button>
    </div>
  );

  // ── Shared: WhatsApp strip ────────────────────────────────────────────────
  const waStrip = () => (
    <div style={{ padding: "9px 20px", borderTop: `1px solid ${C.border}` }}>
      <a href="https://wa.me/390558200700" target="_blank" rel="noopener noreferrer" style={{
        display: "flex", alignItems: "center", gap: 7,
        fontFamily: FB, fontSize: 12, color: C.green, textDecoration: "none", fontWeight: 600,
      }}>
        <span style={{ fontSize: 14 }}>💬</span>
        Prefer WhatsApp? Chat with {venue.owner?.name?.split(" ")[0]} directly →
      </a>
    </div>
  );

  return (
    <>
      {/* ── 1. CENTERED BAR TRIGGER ─────────────────────────────────────── */}
      {mode === "closed" && (
        <button
          className="lwd-aura-bar"
          onClick={() => setMode("modal")}
          style={{
            position: "fixed", left: 0, right: 0, margin: "0 auto",
            zIndex: 80,
            display: "flex", alignItems: "center", gap: 12,
            height: 54, paddingLeft: 7, paddingRight: 18,
            background: "rgba(255,255,255,0.82)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: `1px solid rgba(201,168,76,0.35)`,
            borderRadius: 27,
            boxShadow: `0 4px 32px rgba(0,0,0,0.08), 0 0 0 1px rgba(201,168,76,0.18)`,
            cursor: "pointer",
            width: 460, maxWidth: "calc(100vw - 32px)",
            transition: "box-shadow 0.25s, transform 0.25s",
            animation: "barPulse 3s ease-in-out infinite, fadeUp 0.5s ease both",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = `0 8px 48px rgba(0,0,0,0.12), 0 0 0 1.5px ${C.gold}`;
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.animation = "none";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = `0 4px 32px rgba(0,0,0,0.08), 0 0 0 1px rgba(201,168,76,0.18)`;
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.animation = "barPulse 3s ease-in-out infinite";
          }}
        >
          {/* Aura icon */}
          <div style={{
            width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
            background: `linear-gradient(135deg, ${C.gold}, ${C.green})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 17, color: "#fff",
            boxShadow: `0 2px 10px rgba(157,135,62,0.35)`,
          }}>✦</div>

          {/* Label */}
          <div style={{ flex: 1, textAlign: "left" }}>
            <div style={{ fontFamily: FD, fontSize: 13, color: "#2a2315", letterSpacing: "0.02em", lineHeight: 1.2 }}>
              Ask Aura about {venue.name}
            </div>
            <div style={{ fontFamily: FB, fontSize: 11, color: "rgba(0,0,0,0.42)", marginTop: 2 }}>
              AI-powered · Responds instantly
            </div>
          </div>

          {/* Status dot + arrow */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: aura.dotColor,
              boxShadow: `0 0 0 3px ${aura.ringColor}`,
            }} />
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: C.goldLight, border: `1px solid ${C.goldBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: C.gold, fontSize: 14,
            }}>→</div>
          </div>
        </button>
      )}

      {/* ── BACKDROP (shared by modal + full) ───────────────────────────── */}
      {(mode === "modal" || mode === "full") && (
        <div
          onClick={() => setMode("closed")}
          style={{
            position: "fixed", inset: 0, zIndex: 140,
            background: "rgba(6,6,4,0.62)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            animation: "fadeIn 0.25s ease both",
          }}
        />
      )}

      {/* ── 2. CENTERED MODAL ───────────────────────────────────────────── */}
      {mode === "modal" && (
        <div style={{
          position: "fixed", zIndex: 150,
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 560, maxWidth: "calc(100vw - 24px)",
          maxHeight: "82vh",
          background: C.surface,
          border: `1px solid ${C.goldBorder}`,
          borderRadius: 20,
          boxShadow: `0 40px 100px rgba(0,0,0,0.45), 0 0 0 1px rgba(157,135,62,0.12)`,
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          animation: "chatModalIn 0.32s cubic-bezier(0.34,1.56,0.64,1) both",
        }}>
          {/* Shimmer accent top */}
          <div style={{
            height: 3,
            background: `linear-gradient(90deg, ${C.gold}, ${C.green}, ${C.gold})`,
            backgroundSize: "200% 100%",
            animation: "shimmer 3s linear infinite",
          }} />

          {/* Header */}
          <div style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
              background: `linear-gradient(135deg, ${C.gold}, ${C.green})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, color: "#fff",
              boxShadow: `0 2px 10px rgba(157,135,62,0.3)`,
            }}>✦</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FD, fontSize: 16, color: C.text, letterSpacing: "0.02em" }}>Aura</div>
              <div style={{ fontFamily: FB, fontSize: 11, color: aura.labelColor, display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: aura.dotColor, display: "inline-block" }} />
                {aura.label} · Knows {venue.name}
              </div>
            </div>
            {/* Expand button */}
            <button
              onClick={e => { e.stopPropagation(); setMode("full"); }}
              title="Open full experience"
              style={{
                height: 34, padding: "0 12px",
                borderRadius: 8,
                background: C.goldLight, border: `1px solid ${C.goldBorder}`,
                color: C.gold, cursor: "pointer",
                fontFamily: FB, fontSize: 12, fontWeight: 600,
                display: "flex", alignItems: "center", gap: 5,
                marginRight: 6, whiteSpace: "nowrap",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.gold; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.goldLight; e.currentTarget.style.color = C.gold; }}
            >
              <span style={{ fontSize: 14 }}>⤢</span> Full chat
            </button>
            <button
              onClick={e => { e.stopPropagation(); setMode("closed"); }}
              style={{
                width: 34, height: 34, borderRadius: 8,
                background: "transparent", border: `1px solid ${C.border}`,
                color: C.textMid, cursor: "pointer", fontSize: 15,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.bgAlt; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >✕</button>
          </div>

          {/* Quick-reply chips */}
          <div style={{
            padding: "12px 20px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex", flexWrap: "wrap", gap: 7,
          }}>
            {CHIPS.map(c => (
              <button
                key={c}
                onClick={e => { e.stopPropagation(); send(c); }}
                style={{
                  padding: "5px 13px", borderRadius: 20,
                  border: `1px solid ${C.goldBorder}`,
                  background: C.goldLight,
                  color: C.gold, fontFamily: FB, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = C.gold; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = C.gold; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.goldLight; e.currentTarget.style.color = C.gold; e.currentTarget.style.borderColor = C.goldBorder; }}
              >{c}</button>
            ))}
          </div>

          {/* Messages */}
          {bubbles()}

          {/* WhatsApp */}
          {waStrip()}

          {/* Input */}
          {inputBar("normal")}
        </div>
      )}

      {/* ── 3. FULL SCREEN EXPERIENCE ───────────────────────────────────── */}
      {mode === "full" && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          display: "flex",
          animation: "fadeIn 0.2s ease both",
        }}>
          {/* ── Left sidebar ─── */}
          <div style={{
            width: 260, flexShrink: 0,
            background: "#0c0c0a",
            borderRight: "1px solid rgba(255,255,255,0.07)",
            display: "flex", flexDirection: "column",
          }}>
            {/* LWD wordmark */}
            <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontFamily: FD, fontSize: 10, color: "#b8a05a", letterSpacing: "0.22em", textTransform: "uppercase", lineHeight: 1.6 }}>
                Luxury Wedding<br />Directory
              </div>
              <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "linear-gradient(135deg, #b8a05a, #8fa08c)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, color: "#fff",
                }}>✦</div>
                <div>
                  <div style={{ fontFamily: FD, fontSize: 14, color: "#f5f2ec", letterSpacing: "0.04em" }}>Aura</div>
                  <div style={{ fontFamily: FB, fontSize: 10, color: aura.labelColor, display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: aura.dotColor, display: "inline-block" }} />
                    {aura.label}
                  </div>
                </div>
              </div>
            </div>

            {/* Back to venue */}
            <button
              onClick={() => setMode("closed")}
              style={{
                margin: "14px 14px 6px",
                padding: "9px 14px",
                background: "rgba(184,160,90,0.07)",
                border: "1px solid rgba(184,160,90,0.2)",
                borderRadius: 10,
                color: "#b8a05a", fontFamily: FB, fontSize: 12, fontWeight: 600,
                cursor: "pointer", textAlign: "left",
                display: "flex", alignItems: "center", gap: 7,
                transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(184,160,90,0.14)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(184,160,90,0.07)"}
            >
              ← Back to {venue.name}
            </button>

            {/* Topic links */}
            <div style={{ padding: "18px 14px 8px" }}>
              <div style={{
                fontFamily: FB, fontSize: 9, color: "rgba(255,255,255,0.28)",
                textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 10,
              }}>Ask about</div>
              {TOPICS.map(t => (
                <button
                  key={t.label}
                  onClick={() => send(t.label)}
                  style={{
                    width: "100%", padding: "9px 12px", marginBottom: 2,
                    background: "transparent", border: "none",
                    color: "rgba(255,255,255,0.6)", fontFamily: FB, fontSize: 13,
                    cursor: "pointer", textAlign: "left", borderRadius: 8,
                    display: "flex", alignItems: "center", gap: 10,
                    transition: "background 0.15s, color 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(184,160,90,0.1)"; e.currentTarget.style.color = "#b8a05a"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
                >
                  <Icon name={t.iconName} size={15} color="currentColor" /> {t.label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1 }} />

            {/* WhatsApp bottom */}
            <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <a href="https://wa.me/390558200700" target="_blank" rel="noopener noreferrer" style={{
                display: "flex", alignItems: "center", gap: 8,
                fontFamily: FB, fontSize: 12, color: "#8fa08c",
                textDecoration: "none", fontWeight: 600,
              }}>
                <span style={{ fontSize: 14 }}>💬</span>
                WhatsApp {venue.owner?.name?.split(" ")[0]}
              </a>
            </div>
          </div>

          {/* ── Right: main chat ─── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", background: C.surface, overflow: "hidden" }}>
            {/* Shimmer top */}
            <div style={{
              height: 3,
              background: `linear-gradient(90deg, ${C.gold}, ${C.green}, ${C.gold})`,
              backgroundSize: "200% 100%",
              animation: "shimmer 3s linear infinite",
              flexShrink: 0,
            }} />

            {/* Header */}
            <div style={{
              padding: "18px 28px",
              borderBottom: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexShrink: 0,
            }}>
              <div>
                <div style={{ fontFamily: FD, fontSize: 20, color: C.text, letterSpacing: "0.02em" }}>
                  Chat with Aura
                </div>
                <div style={{ fontFamily: FB, fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                  AI assistant for {venue.name} · {venue.location}
                </div>
              </div>
              <button
                onClick={() => setMode("closed")}
                style={{
                  width: 38, height: 38, borderRadius: 9,
                  background: "transparent", border: `1px solid ${C.border}`,
                  color: C.textMid, cursor: "pointer", fontSize: 16,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.bgAlt}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >✕</button>
            </div>

            {/* Messages */}
            {bubbles()}

            {/* Input */}
            {inputBar("large")}
          </div>
        </div>
      )}
    </>
  );
}

// ─── COOKIE BANNER (standalone, no ChatContext dependency) ──────────────────
const COOKIE_KEY = "lwd_cookies_accepted";
function VenueCookieBanner() {
  const C = useT();
  const [visible, setVisible]   = useState(false);
  const [entered, setEntered]   = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(COOKIE_KEY)) {
      const t = setTimeout(() => {
        setVisible(true);
        requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
      }, 900);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ all: true, ts: Date.now() }));
    setEntered(false);
    setTimeout(() => setVisible(false), 350);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ essential: true, ts: Date.now() }));
    setEntered(false);
    setTimeout(() => setVisible(false), 350);
  };

  if (!visible) return null;

  return (
    <div style={{
      position:   "fixed",
      bottom:      0,
      left:        0,
      right:       0,
      zIndex:      1500,
      background:  "#0D0B09",
      borderTop:  "1px solid rgba(201,168,76,0.2)",
      padding:    "14px 28px",
      fontFamily:  FB,
      transform:   entered ? "translateY(0)" : "translateY(100%)",
      transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
      boxShadow:  "0 -4px 32px rgba(0,0,0,0.4)",
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 14,
      }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#C9A84C", fontSize: 15 }}>✦</span> We use cookies
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.55, margin: 0 }}>
            We use essential cookies to make our site work, and optional cookies to personalise your experience. By clicking{" "}
            <strong style={{ color: "rgba(255,255,255,0.65)" }}>Accept All</strong>, you agree to our use of cookies.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexShrink: 0, alignItems: "center" }}>
          <button onClick={decline} style={{
            background: "none", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "var(--lwd-radius-input)",
            color: "rgba(255,255,255,0.55)", padding: "9px 18px",
            fontFamily: FB, fontSize: 11, cursor: "pointer", letterSpacing: "0.5px",
            transition: "all 0.2s", whiteSpace: "nowrap",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
          >Essential Only</button>
          <button onClick={accept} style={{
            background: "#C9A84C", border: "none", borderRadius: "var(--lwd-radius-input)",
            color: "#0D0B09", padding: "9px 24px",
            fontFamily: FB, fontSize: 11, fontWeight: 700, cursor: "pointer",
            letterSpacing: "1.5px", textTransform: "uppercase", transition: "opacity 0.2s",
            whiteSpace: "nowrap",
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >Accept All</button>
        </div>
      </div>
    </div>
  );
}

// ─── COMPARE LIST PERSISTENCE ─────────────────────────────────────────────────
// Stored in sessionStorage so it survives slug changes and page navigations
// within the same browser session.
const COMPARE_STORAGE_KEY = 'lwd_compare_list';

function loadCompareList() {
  try { return JSON.parse(sessionStorage.getItem(COMPARE_STORAGE_KEY)) || []; }
  catch { return []; }
}

function saveCompareList(list) {
  try { sessionStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(list)); }
  catch {}
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export default function VenueProfile({ onBack = null, slug = null, countrySlug = null, regionSlug = null, categorySlug = null }) {
  // Always default to light mode on venue profiles — dark is opt-in via toggle
  const [darkMode, setDarkMode] = useState(false);
  const [saved, setSaved] = useState(false);
  const [lightIdx, setLightIdx] = useState(null);
  const [compareList, setCompareList] = useState(() => loadCompareList());
  const [showCompareModal, setShowCompareModal] = useState(false);
  const { isAuthenticated: isAdmin } = useAdminAuth();

  // Sync compareList to sessionStorage + notify global Aura button to shift up
  useEffect(() => {
    saveCompareList(compareList);
    window.dispatchEvent(new CustomEvent('lwd:compare-bar', { detail: { active: compareList.length > 0 } }));
    // Cleanup: broadcast inactive when this component unmounts
    return () => {
      window.dispatchEvent(new CustomEvent('lwd:compare-bar', { detail: { active: false } }));
    };
  }, [compareList]);
  const [heroStyle, setHeroStyle] = useState("cinematic");
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [dbVenue, setDbVenue] = useState(null);
  const [rawListing, setRawListing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [viData, setViData] = useState(null); // venue_intelligence row
  const [venueEvents, setVenueEvents] = useState([]);
  const [drawerEvent, setDrawerEvent] = useState(null);

  const C = darkMode ? DARK : LIGHT;
  const VV = dbVenue ? { ...VENUE, ...dbVenue } : VENUE;

  // Record this venue visit for Recently Viewed tracking
  // Only record AFTER database has loaded with real data, not on mount with dummy data
  useEffect(() => {
    if (dbVenue && dbVenue.name && slug) {
      recordVenueView(VV, slug);
      // Track profile_view in unified event system (once per real data load)
      trackProfileView({
        entityType:    'venue',
        entityId:      dbVenue.id   || null,
        entityName:    dbVenue.name || null,
        slug,
        sourceSurface: 'venue_profile',
      });
    }
  }, [slug, dbVenue]);

  // Fetch venue intelligence — single source of truth for capacity + pricing
  useEffect(() => {
    if (!slug) return;
    fetchVenueIntelligence(slug).then(row => { if (row) setViData(row); });
  }, [slug]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        // Only update active tab from the topmost intersecting section
        const intersecting = entries.filter(e => e.isIntersecting);
        if (intersecting.length > 0) {
          // Pick the section closest to the top of the viewport
          const topmost = intersecting.reduce((a, b) =>
            a.boundingClientRect.top < b.boundingClientRect.top ? a : b
          );
          setActiveTab(topmost.target.id);
        }
      },
      { rootMargin: '-137px 0px -60% 0px', threshold: 0 }
    );
    TABS.forEach(t => {
      const el = document.getElementById(t.key);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let ignore = false;
    async function loadVenue() {
      if (!slug) return;
      setLoading(true);
      try {
        const listing = await fetchListingBySlug(slug);
        if (!listing || ignore) return;
        // All data is now camelCase from mapListingFromDb mapper
        const mapped = {
          id:        listing.id,
          name:      listing.name || VENUE.name,
          tagline:   listing.heroTagline || VENUE.tagline,
          location:  [listing.city, listing.region].filter(Boolean).join(', ') || VENUE.location,
          country:   listing.country || VENUE.country,
          priceFrom: listing.priceFrom || VENUE.priceFrom,
          priceCurrency: listing.priceCurrency || '£',
          capacity:  { ...VENUE.capacity, max: listing.capacityMax || VENUE.capacity?.max },
          imgs:      (listing.imgs || []).map(i => i.src).filter(Boolean).slice(0, 10),
          verified:  !!listing.isVerified,
          venueType: { ...(VENUE.venueType || {}), features: listing.amenities || [], styles: listing.styles || [] },
          description: listing.shortDescription || listing.cardSummary || null,
          gallery: (listing.mediaItems || [])
            .filter(i => i.type !== 'video' && i.type !== 'virtual_tour' && i.visibility !== 'private')
            .sort((a, b) => {
              if (a.is_featured && !b.is_featured) return -1;
              if (!a.is_featured && b.is_featured) return 1;
              return (a.sort_order ?? 999) - (b.sort_order ?? 999);
            })
            .map(item => mapMediaItemToGalleryPhoto(item))
            .filter(item => item.src) || VENUE.gallery,
          rating:  listing.rating ?? VENUE.rating,
          reviews: listing.reviewCount ?? VENUE.reviews,
          flag:    COUNTRY_FLAG[listing.country] || VENUE.flag,
          awards:  Array.isArray(listing.awards)
            ? listing.awards.map(a => typeof a === 'string' ? a : (a.award || a.title || a.issuer || '')).filter(Boolean)
            : [],
          press:   Array.isArray(listing.pressFeatures)
            ? listing.pressFeatures.map(p => typeof p === 'string' ? p : (p.outlet || p.title || '')).filter(Boolean)
            : [],
          videos:  Array.isArray(listing.mediaItems) ? buildVenueVideos(listing.mediaItems) : [],
          accommodation: (listing.roomsMaxGuests || listing.roomsTotal || listing.roomsDescription)
            ? {
                type:              listing.roomsAccommodationType || null,
                totalRooms:        listing.roomsTotal || null,
                totalSuites:       listing.roomsSuites || null,
                maxOvernightGuests:listing.roomsMaxGuests || null,
                maxGuests:         listing.roomsMaxGuests || null,
                minNightStay:      listing.roomsMinStay || null,
                exclusiveUse:      !!listing.roomsExclusiveUse,
                description:       listing.roomsDescription || null,
                images:            Array.isArray(listing.roomsImages)
                  ? listing.roomsImages
                      .map(img => typeof img === 'string' ? img : (img.url || img.src || ''))
                      .filter(Boolean)
                  : [],
              }
            : null,
          exclusiveUse: (listing.exclusiveUsePrice || listing.exclusiveUseDescription || listing.exclusiveUseEnabled != null)
            ? {
                enabled:     listing.exclusiveUseEnabled !== false,
                title:       listing.exclusiveUseTitle || 'Exclusive Use',
                subtitle:    listing.exclusiveUseSubtitle || '',
                from:        listing.exclusiveUsePrice || null,
                subline:     listing.exclusiveUseSubline || null,
                description: listing.exclusiveUseDescription || null,
                ctaText:     listing.exclusiveUseCtaText || 'Enquire About Exclusive Use',
                includes:    Array.isArray(listing.exclusiveUseIncludes) ? listing.exclusiveUseIncludes : [],
              }
            : null,
          showcaseUrl:      `/showcase/${slug}`,
          fullDescription:  listing.description || null,
          readmoreEnabled:  !!listing.readmoreEnabled,
          openingHours: listing.openingHoursEnabled
            ? {
                enabled: true,
                hours:   listing.openingHours || {},
                note:    listing.openingHoursNote || null,
              }
            : null,
          responseTime: listing.contactProfile?.responseTime || null,
          responseRate: (() => {
            const rate = listing.contactProfile?.responseRate;
            return rate ? String(rate).replace('%', '') : null;
          })(),
          weddingsHosted: listing.weddingsHosted || null,
          owner: listing.contactProfile?.name ? {
            name:        listing.contactProfile.name || null,
            title:       listing.contactProfile.title || null,
            bio:         listing.contactProfile.bio || listing.contactProfile.about || null,
            photo:       listing.contactProfile.photoUrl || listing.contactProfile.photo || null,
            memberSince: listing.memberSince || null,
          } : null,
          contact: {
            address: {
              line1:   listing.address  || '',
              city:    listing.city     || '',
              region:  listing.region   || '',
              postcode:listing.postcode || '',
              country: listing.country  || '',
            },
            phone:   listing.phone   || listing.contactProfile?.phone   || null,
            email:   listing.email   || listing.contactProfile?.email   || null,
            website: listing.website || listing.contactProfile?.website || null,
            social:  listing.contactProfile?.social || null,
            responseMetrics: {
              averageResponseHours: null,
              responseRatePercent:  null,
              sameDayTypical: false,
            },
            addressFormatted: [listing.address, listing.city, [listing.postcode, listing.region].filter(Boolean).join(' '), listing.country].filter(Boolean).join(', '),
            mapQuery: [listing.city, listing.region, listing.country].filter(Boolean).join(',+').replace(/ /g, '+'),
          },
          catering: (() => {
            const cateringCards = listing.cateringCards || [];
            const cateringEnabled = listing.cateringEnabled;
            const hasCards = Array.isArray(cateringCards) && cateringCards.length > 0;
            if (!hasCards && cateringEnabled == null) return null;
            if (cateringEnabled === false) return null;
            return {
              enabled: true,
              cards:   Array.isArray(cateringCards) ? cateringCards : [],
              styles:  Array.isArray(listing.diningMenuStyles) ? listing.diningMenuStyles : [],
              dietary: Array.isArray(listing.diningDietary) ? listing.diningDietary : [],
            };
          })(),
          dining: (listing.diningStyle || listing.diningDescription || listing.diningChefName)
            ? {
                style:                  listing.diningStyle || null,
                chefName:               listing.diningChefName || null,
                inHouseCatering:        !!listing.diningInHouse,
                externalCateringAllowed:!!listing.diningExternal,
                menuStyles:             Array.isArray(listing.diningMenuStyles) ? listing.diningMenuStyles : [],
                dietaryOptions:         Array.isArray(listing.diningDietary) ? listing.diningDietary : [],
                drinksOptions:          Array.isArray(listing.diningDrinks) ? listing.diningDrinks : [],
                description:            listing.diningDescription || null,
                menuImages:             Array.isArray(listing.diningMenuImages)
                  ? listing.diningMenuImages.map(img =>
                      typeof img === 'string'
                        ? { src: img, title: '' }
                        : { src: img.url || img.src || '', title: img.title || '' }
                    ).filter(img => img.src)
                  : [],
              }
            : null,
          spaces: Array.isArray(listing.spaces) && listing.spaces.length > 0
            ? listing.spaces.map(s => ({
                id:          s.id          || s.name,
                name:        s.name        || '',
                type:        s.type        || '',
                description: s.description || '',
                img:         s.img         ? (s.img.startsWith('/') || s.img.startsWith('http') ? s.img : '/' + s.img) : null,
                capacityCeremony: s.capacityCeremony || null,
                capacityReception: s.capacityReception || null,
                capacityDining:   s.capacityDining   || null,
                capacityStanding: s.capacityStanding || null,
                indoor:     s.indoor    ?? false,
                covered:    s.covered   ?? false,
                accessible: s.accessible ?? false,
                floorPlanUrl: s.floorPlanUrl || null,
              }))
            : null,
          faq: (listing.faqCategories && Array.isArray(listing.faqCategories) && listing.faqCategories.length > 0)
            ? {
                enabled:       listing.faqEnabled !== false,
                title:         listing.faqTitle    || 'FAQs',
                subtitle:      listing.faqSubtitle || '',
                ctaEnabled:    listing.faqCtaEnabled !== false,
                ctaHeadline:   listing.faqCtaHeadline   || null,
                ctaSubtext:    listing.faqCtaSubtext     || null,
                ctaButtonText: listing.faqCtaButtonText || null,
                categories:    listing.faqCategories,
              }
            : null,
        };
        // ── Fetch approved reviews and map to testimonials format ─────────────
        let testimonials = [];
        try {
          const reviews = await fetchApprovedReviews('venue', listing.id);
          testimonials = (reviews || []).map(r => ({
            id:       r.id,
            names:    r.reviewer_name,
            avatar:   r.reviewer_name
                        .split(' ')
                        .filter(w => /^[A-Za-z]/.test(w))
                        .map(w => w[0].toUpperCase())
                        .slice(0, 2)
                        .join(''),
            date:     r.event_date
                        ? new Date(r.event_date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
                        : new Date(r.published_at || r.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
            location: r.reviewer_location || '',
            rating:   Number(r.overall_rating),
            text:     r.review_text,
            verified: r.is_verified,
          }));
        } catch (reviewErr) {
          console.warn('[VenueProfile] Reviews fetch failed silently:', reviewErr);
        }
        mapped.testimonials = testimonials;

        if (!ignore) {
          setDbVenue(mapped);
          setRawListing(listing);
        }
      } catch (err) {
        console.error('Failed to load venue by slug', err);
        if (!ignore) setNotFound(true);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadVenue();
    return () => { ignore = true; };
  }, [slug]);

  // Fetch upcoming events linked to this listing
  useEffect(() => {
    if (!VV.id) return;
    fetchUpcomingEventsForVenue(VV.id, 6).then(evts => setVenueEvents(evts || []));
  }, [VV.id]);

  // Silently replace URL bar with canonical hierarchical path once listing loads
  useEffect(() => {
    if (!rawListing || !slug) return;
    const cs  = rawListing.country_slug  || rawListing.countrySlug  || countrySlug;
    const rs  = rawListing.region_slug   || rawListing.regionSlug   || regionSlug;
    const cat = rawListing.category_slug || rawListing.categorySlug || categorySlug || 'wedding-venues';
    if (!cs) return;
    const canonical = (cs && rs && cat)
      ? `/${cs}/${rs}/${cat}/${slug}`
      : `/${cs}/${cat}/${slug}`;
    if (window.location.pathname !== canonical) {
      window.history.replaceState(null, '', canonical);
    }
  }, [rawListing, slug, countrySlug, regionSlug, categorySlug]);

  const scrollToSection = (key) => {
    setActiveTab(key);
    const el = document.getElementById(key);
    if (!el) return;
    // Measure the tab nav bar height directly (it carries the combined sticky offset)
    // The tab nav sits at top:56, so its bottom = 56 + its own height
    const tabNavEl = document.querySelector('[data-tab-nav]');
    const tabNavBottom = tabNavEl ? tabNavEl.getBoundingClientRect().bottom : 116;
    const offset = Math.max(tabNavBottom, 137) + 16;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const addCompare = () => {
    if (!compareList.find(v => v.id === VV.id)) {
      setCompareList(l => {
        const updated = [...l, { id: VV.id, name: VV.name }].slice(0, 3);
        trackCompareAdd({
          venueId:       VV.id,
          venueName:     VV.name,
          compareList:   l,           // peers already in bar before this add
          sourceSurface: 'venue_profile',
        });
        return updated;
      });
    }
  };

  if (slug && loading) return (
    <Theme.Provider value={C}>
      <GlobalStyles />
      <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMuted, fontFamily: FB, fontSize: 14 }}>
        Loading venue…
      </div>
    </Theme.Provider>
  );

  if (slug && notFound) return (
    <Theme.Provider value={C}>
      <GlobalStyles />
      <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: C.text, fontFamily: FB }}>
        <div style={{ fontSize: 22, fontFamily: FD }}>Venue Not Found</div>
        {onBack && <button onClick={onBack} style={{ border: 'none', background: 'none', color: C.gold, cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>← Back</button>}
      </div>
    </Theme.Provider>
  );

  return (
    <Theme.Provider value={C}>
      <GlobalStyles />
      {/* SEO head - only when real listing data is loaded */}
      {rawListing && (() => {
        const cs  = rawListing.country_slug  || rawListing.countrySlug  || countrySlug;
        const rs  = rawListing.region_slug   || rawListing.regionSlug   || regionSlug;
        const cat = rawListing.category_slug || rawListing.categorySlug || categorySlug || 'wedding-venues';
        const canonicalUrl = (cs && rs && cat)
          ? `${SITE_URL}/${cs}/${rs}/${cat}/${slug}`
          : (cs && cat)
            ? `${SITE_URL}/${cs}/${cat}/${slug}`
            : `${SITE_URL}/wedding-venues/${slug}`;
        const countryUrl  = cs ? `/${cs}` : '/';
        const regionUrl   = (cs && rs) ? `/${cs}/${rs}` : countryUrl;
        const categoryUrl = (cs && rs && cat) ? `/${cs}/${rs}/${cat}` : '/';
        return (
          <>
            <SeoHead
              title={rawListing.seoTitle || rawListing.name}
              description={rawListing.seoDescription || rawListing.shortDescription || rawListing.cardSummary}
              keywords={rawListing.seoKeywords}
              canonicalUrl={canonicalUrl}
              ogImage={rawListing.heroImage || rawListing.imgs?.[0]?.src || rawListing.imgs?.[0]}
            />
            <JsonLd schema={buildVenueSchema(rawListing)} />
            <JsonLd schema={buildBreadcrumbSchema([
              { name: 'Home', url: '/' },
              { name: rawListing.country || 'Venues', url: countryUrl },
              ...(rs ? [{ name: rawListing.region || rs, url: regionUrl }] : []),
              { name: cat.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), url: categoryUrl },
              { name: rawListing.name, url: canonicalUrl },
            ])} />
            {rawListing.faqEnabled !== false && rawListing.faqCategories && rawListing.faqCategories.length > 0 && (
              <JsonLd schema={buildFaqSchema(rawListing.faqCategories)} />
            )}
          </>
        );
      })()}
      <div className="vp-root" style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
        <HomeNav hasHero={true} darkMode={darkMode} onToggleDark={() => setDarkMode(d => !d)} />
        <Hero venue={VV} heroStyle={heroStyle} setHeroStyle={setHeroStyle} onEnquire={() => setEnquiryOpen(true)} onBack={onBack} />
        <StatsStrip venue={VV} nextEvent={venueEvents[0] || null} onEventClick={setDrawerEvent} />
        <StickyTabNav venue={VV} activeTab={activeTab} onTabClick={scrollToSection} saved={saved} setSaved={setSaved} onAddCompare={addCompare} compareList={compareList} />

        {/* Main layout */}
        <div className="vp-main-wrapper" style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 40px 120px" }}>
          <div className="vp-main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 56, alignItems: "start" }}>
            {/* Content */}
            <div>
              <AboutSection venue={VV} isDbVenue={!!slug} />
              <ImageGallery gallery={VV.gallery} onOpenLight={i => setLightIdx(i)} />
              {VV.videos && VV.videos.length > 0 && <VideoGallery videos={VV.videos} venue={VV} />}
              <ExclusiveUse venue={VV} onEnquire={() => setEnquiryOpen(true)} />

              {/* ── Venue Intelligence: At a Glance + Pricing + Verified ── */}
              {viData && (
                <>
                  <ShowcaseVerified
                    data={viData}
                    accentColor={C.gold}
                    theme={darkMode ? 'dark' : 'light'}
                  />
                  <ShowcaseAtAGlance
                    data={viData}
                    accentColor={C.gold}
                    theme={darkMode ? 'dark' : 'light'}
                  />
                  <ShowcasePricing
                    data={viData}
                    venueName={VV.name}
                    accentColor={C.gold}
                    theme={darkMode ? 'dark' : 'light'}
                    bg={darkMode ? undefined : '#faf9f6'}
                  />
                </>
              )}

              <CateringSection venue={VV} />
              {VV.spaces && <SpacesSection spaces={VV.spaces} venue={VV} />}
              <RoomsSection venue={VV} />
              {VV.dining && <DiningSection venue={VV} />}
              <VenueTypeSection venue={VV} />
              <WeddingWeekend venue={VV} />
              <ContactSection venue={VV} />
              {VV.access && Array.isArray(VV.access.airports) && VV.access.airports.length > 0 && <GettingHere access={VV.access} />}
              {venueEvents.length > 0 && (
                <div id="events" style={{ marginBottom: 48 }}>
                  <div style={{ fontFamily: 'var(--font-heading-primary)', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: 8 }}>Open Days &amp; Events</div>
                  <h2 style={{ fontFamily: 'var(--font-heading-primary)', fontSize: 26, fontWeight: 400, margin: '0 0 6px', color: C.text }}>Join Us in Person</h2>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: C.muted, margin: '0 0 24px', lineHeight: 1.6 }}>
                    Experience {VV.name} first-hand. Register for an upcoming open day, private tour, or virtual showcase.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                    {venueEvents.map(ev => {
                      const dateStr = formatEventDate(ev.startDate);
                      const timeStr = ev.startTime ? formatEventTime(ev.startTime) : null;
                      // Urgency signal: capacity-based or default
                      const spotsLeft = ev.capacity
                        ? Math.max(0, ev.capacity - (ev.bookingCount || 0))
                        : null;
                      const isAlmostFull = spotsLeft !== null && spotsLeft <= Math.ceil(ev.capacity * 0.25);
                      const urgencyLabel = isAlmostFull
                        ? `${spotsLeft} place${spotsLeft === 1 ? '' : 's'} remaining`
                        : ev.capacity
                          ? `Limited to ${ev.capacity} guests`
                          : 'Limited availability';
                      return (
                        <div
                          key={ev.id}
                          onClick={() => setDrawerEvent(ev)}
                          style={{ cursor: 'pointer', background: '#1a1a18', border: '1px solid #2a2a28', borderRadius: 4, overflow: 'hidden', transition: 'border-color 0.2s, transform 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a28'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                          {ev.coverImageUrl && (
                            <div style={{ height: 160, overflow: 'hidden', position: 'relative' }}>
                              <img src={ev.coverImageUrl} alt={ev.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              {/* Urgency badge overlay */}
                              <div style={{
                                position: 'absolute', bottom: 10, right: 10,
                                background: isAlmostFull ? 'rgba(239,68,68,0.88)' : 'rgba(0,0,0,0.62)',
                                border: isAlmostFull ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.15)',
                                backdropFilter: 'blur(4px)',
                                padding: '3px 8px', borderRadius: 2,
                                fontFamily: 'var(--font-body)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
                                color: '#fff',
                              }}>
                                {urgencyLabel}
                              </div>
                            </div>
                          )}
                          {!ev.coverImageUrl && (
                            <div style={{
                              height: 48, background: '#141412',
                              borderBottom: '1px solid #2a2a28',
                              display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                              padding: '0 14px',
                            }}>
                              <div style={{
                                background: isAlmostFull ? 'rgba(239,68,68,0.2)' : 'rgba(201,168,76,0.12)',
                                border: `1px solid ${isAlmostFull ? 'rgba(239,68,68,0.4)' : 'rgba(201,168,76,0.3)'}`,
                                padding: '3px 8px', borderRadius: 2,
                                fontFamily: 'var(--font-body)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
                                color: isAlmostFull ? '#fca5a5' : '#C9A84C',
                              }}>
                                {urgencyLabel}
                              </div>
                            </div>
                          )}
                          <div style={{ padding: '16px 18px' }}>
                            <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#C9A84C', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
                              {ev.eventType?.replace(/_/g, ' ') || 'Event'}
                              {ev.isVirtual && <span style={{ marginLeft: 8, color: '#93c5fd' }}>· Virtual</span>}
                            </div>
                            <div style={{ fontFamily: 'var(--font-heading-primary)', fontSize: 17, fontWeight: 400, color: '#f0ece4', marginBottom: 4, lineHeight: 1.3 }}>{ev.title}</div>
                            {ev.subtitle && <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#999', marginBottom: 8, lineHeight: 1.5 }}>{ev.subtitle}</div>}
                            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#666', marginTop: 8 }}>
                              {dateStr}{timeStr ? ` · ${timeStr}` : ''}
                              {ev.isFree === false && ev.ticketPrice && (
                                <span style={{ marginLeft: 10, color: '#C9A84C' }}>From £{ev.ticketPrice}</span>
                              )}
                            </div>
                            <div style={{
                              marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              paddingTop: 12, borderTop: '1px solid #2a2a28',
                            }}>
                              <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#C9A84C', letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: '1px solid #C9A84C', paddingBottom: 1 }}>
                                {ev.bookingMode === 'external' ? 'Book Now →' : 'Reserve Your Place →'}
                              </div>
                              {ev.isFree !== false && (
                                <div style={{ fontFamily: 'var(--font-body)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#555', background: '#242420', padding: '3px 7px', borderRadius: 2 }}>
                                  Complimentary
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {VV.testimonials && Array.isArray(VV.testimonials) && VV.testimonials.length > 0 && <Reviews testimonials={VV.testimonials} venue={VV} venueSlug={slug} />}
              {dbVenue && dbVenue.id && (
                <ReviewsSection
                  entityType="venue"
                  entityId={dbVenue.id}
                  onOpenReviewForm={() => setEnquiryOpen(true)}
                />
              )}
              <FAQSection venue={VV} onAsk={() => setEnquiryOpen(true)} />
              <SimilarVenues venue={VV} />
              <RecentlyViewed venue={VV} />
            </div>
            {/* Sidebar, 4 zones, sticky on desktop */}
            <div className="lwd-sidebar" style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 108, alignSelf: "start" }}>
              {/* Zone 1, Owner card (only if owner data available) */}
              {VV.owner && VV.owner.name && <OwnerCard owner={VV.owner} venue={VV} />}
              {/* Zone 2, Venue enquiry form (lead gen) */}
              <VenueEnquiryForm
                listingId={VV.id}
                venueId={VV.id}
                vendorId={VV.vendorId || null}
                vendorName={VV.name}
                vendorEmail={VV.contactProfile?.email || VV.contact?.email || null}
                venueName={VV.name}
                responseTime={VV.responseTime}
                sticky={false}
              />
              {/* Zone 3, Lead form (scrolls naturally) */}
              <LeadForm venue={VV} />
              {/* Zone 4, Mini map + quick contact */}
              <SidebarContact venue={VV} />
              {/* Zone 5, Venue notices (open days, offers, late availability, news) */}
              <SidebarNotices notices={VV.notices} venueName={VV.name} />
              {/* Zone 6, Instagram teaser (placeholder, to be connected to live feed) */}
              {/* <SidebarInstagram venue={VV} /> */}
            </div>
          </div>
        </div>

        <MobileLeadBar venue={VV} />
        <CompareBar
          items={compareList}
          onRemove={id => {
            const removed = compareList.find(v => v.id === id);
            setCompareList(l => l.filter(v => v.id !== id));
            if (removed) {
              trackCompareRemove({ venueId: id, venueName: removed.name, compareList, sourceSurface: 'compare_bar' });
            }
          }}
          onClear={() => setCompareList([])}
          onCompare={() => {
            trackCompareView({ compareList, sourceSurface: 'compare_bar' });
            trackComparePair({ compareList, sourceSurface: 'compare_bar' });
            setShowCompareModal(true);
          }}
        />
        <Lightbox gallery={VV.gallery} idx={lightIdx} setLightIdx={setLightIdx} onClose={() => setLightIdx(null)} onPrev={() => setLightIdx(i => (i - 1 + (VV.gallery?.length || 1)) % (VV.gallery?.length || 1))} onNext={() => setLightIdx(i => (i + 1) % (VV.gallery?.length || 1))} engagement={VV.engagement?.photos} />
        {enquiryOpen && <EnquiryModal venue={VV} onClose={() => setEnquiryOpen(false)} />}
        {showCompareModal && compareList.length > 0 && (
          <CompareModal
            items={compareList}
            onClose={() => setShowCompareModal(false)}
          />
        )}
        {showReviewForm && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: 20,
            }}
            onClick={() => setShowReviewForm(false)}
          >
            <div
              style={{
                background: C.bg,
                borderRadius: 8,
                padding: 40,
                maxWidth: 600,
                maxHeight: '90vh',
                overflow: 'auto',
                position: 'relative',
              }}
              onClick={e => e.stopPropagation()}
            >
              {dbVenue && dbVenue.id && (
                <ReviewSubmitForm
                  entityType="venue"
                  entityId={dbVenue.id}
                  onSubmitSuccess={() => {
                    setShowReviewForm(false);
                  }}
                  onCancel={() => setShowReviewForm(false)}
                />
              )}
            </div>
          </div>
        )}
        <VenueCookieBanner />
        <EventDrawer event={drawerEvent} onClose={() => setDrawerEvent(null)} darkMode={darkMode} />

        {/* Admin: Edit Listing button (floats above Aura chat on desktop) */}
        {isAdmin && (
          <button
            onClick={() => {
              sessionStorage.setItem("lwd_admin_edit_intent", JSON.stringify({
                type: "listing",
                listingId: VV.id,
                returnPath: window.location.pathname,
              }));
              window.location.href = "/admin";
            }}
            style={{
              position: "fixed",
              bottom: compareList.length > 0 ? 150 : 90,
              right: 28,
              zIndex: 901,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 22px 12px 16px",
              borderRadius: 100,
              background: "#1a1a1a",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 6px 28px rgba(0,0,0,0.4)",
              transition: "bottom 0.3s cubic-bezier(0.25,0.46,0.45,0.94), transform 0.2s ease",
              transform: "translateY(0)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            aria-label="Edit listing"
          >
            {/* Icon */}
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "rgba(201,168,76,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                flexShrink: 0,
                color: "#C9A84C",
              }}
            >
              ✦
            </span>

            {/* Label */}
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: 11,
                color: "#C9A84C",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              Edit Listing
            </span>
          </button>
        )}
      </div>
    </Theme.Provider>
  );
}
