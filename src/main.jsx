// ─── src/main.jsx ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, StrictMode, lazy, Suspense } from "react";
import { createRoot }           from "react-dom/client";
import { HelmetProvider }       from "react-helmet-async";

import { applyThemeToDocument } from "./theme/ThemeLoader";
import { ThemeProvider, useTheme as useGlobalTheme } from "./theme/ThemeContext";
import { getDefaultMode } from "./theme/tokens";
import { ShortlistProvider } from "./shortlist/ShortlistContext";
import { ChatProvider }      from "./chat/ChatContext";
import { VendorAuthProvider } from "./context/VendorAuthContext";
import { CoupleAuthProvider } from "./context/CoupleAuthContext";
import { AdminAuthProvider, useAdminAuth } from "./context/AdminAuthContext";
import ProtectedCoupleRoute  from "./components/ProtectedCoupleRoute";
import AuraChat              from "./chat/AuraChat";
import { useChat }           from "./chat/ChatContext";
import CookieBanner          from "./components/CookieBanner";
import SiteFooter            from "./components/sections/SiteFooter.jsx";
import GlobalAdminBar        from "./components/admin/GlobalAdminBar.jsx";
import GlobalCompare         from "./compare/GlobalCompare.jsx";
import GlobalSeoHead         from "./components/seo/GlobalSeoHead.jsx";

// ── Apply saved theme CSS variables BEFORE React renders ─────────────────────
applyThemeToDocument();

// ── Initialise return-after-outbound detection (runs once, passive) ──────────
import { initReturnDetection } from "./services/userEventService";
initReturnDetection();

// ── Visitor tracker (admin intelligence — fires silently) ─────────────────
import { initTracker, trackPageView } from "./lib/tracker";

import HomePage from "./pages/HomePage.jsx";
import VenueProfile           from "./VenueProfile.jsx";
// CountryTemplate removed, /category now renders ItalyPage with noIndex
import RegionPage             from "./pages/RegionPage.jsx";
import RegionCategoryPage     from "./pages/RegionCategoryPage.jsx";
import LWDStandard            from "./pages/LWDStandard.jsx";
import AboutLWD               from "./pages/AboutLWD.jsx";
import TaigenicPage           from "./pages/TaigenicPage.jsx";
import ContactLWD             from "./pages/ContactLWD.jsx";
import LWDPartnership         from "./pages/LWDPartnership.jsx";
import CmsPage                from "./pages/CmsPage.jsx";
import USAPage                from "./pages/USAPage.jsx";
import ItalyPage              from "./pages/ItalyPage.jsx";
import LocationPage           from "./pages/LocationPage.jsx";
const AdminDashboard         = lazy(() => import("./pages/AdminDashboard.jsx"));
import AdminLogin             from "./pages/AdminLogin.jsx";
import GoogleOAuthCallback    from "./pages/GoogleOAuthCallback.jsx";
const VendorDashboard        = lazy(() => import("./pages/VendorDashboard.jsx"));
const ClientPortal           = lazy(() => import("./pages/ClientPortal.jsx"));
import VendorLogin            from "./pages/VendorLogin.jsx";
import VendorSignup           from "./pages/VendorSignup.jsx";
import VendorActivate         from "./pages/VendorActivate.jsx";
import VendorForgotPassword   from "./pages/VendorForgotPassword.jsx";
import VendorResetPassword    from "./pages/VendorResetPassword.jsx";
import VendorConfirmEmail     from "./pages/VendorConfirmEmail.jsx";
import CoupleSignup           from "./pages/CoupleSignup.jsx";
import CoupleLogin            from "./pages/CoupleLogin.jsx";
import CoupleForgotPassword   from "./pages/CoupleForgotPassword.jsx";
import CoupleResetPassword    from "./pages/CoupleResetPassword.jsx";
import CoupleConfirmEmail     from "./pages/CoupleConfirmEmail.jsx";
import WeddingPlannersPage    from "./pages/WeddingPlannersPage.jsx";
import PlannerProfilePage     from "./pages/PlannerProfilePage.jsx";
import PugliaPage             from "./pages/PugliaPage.jsx";
import ShortlistPage          from "./pages/ShortlistPage.jsx";
import RealWeddingsPage       from "./pages/RealWeddingsPage.jsx";
import RealWeddingDetailPage  from "./pages/RealWeddingDetailPage.jsx";
const GettingMarriedDashboard = lazy(() => import("./pages/GettingMarriedDashboard.jsx"));
import JoinPage from "./pages/JoinPage.jsx";
import PartnerEnquiryPage from "./pages/PartnerEnquiryPage.jsx";
import ListYourBusinessPage from "./pages/ListYourBusinessPage.jsx";
import PricingPage from "./pages/PricingPage.jsx";
import ListingsPage from "./pages/ListingsPage.jsx";
import H2Page from "./pages/H2Page.jsx";
import H3 from "./pages/H3.jsx";
import AdvertisePage from "./pages/AdvertisePage.jsx";
import MostLovedPage from "./pages/MostLovedPage.jsx";
import ArtistryPage from "./pages/Artistry/ArtistryPage.jsx";
import PublicationsPage       from "./pages/PublicationsPage.jsx";
import PublicationsReaderPage    from "./pages/PublicationsReaderPage.jsx";
import MagazineCollaboratePage   from "./pages/MagazineCollaboratePage.jsx";
import VendorReachPage           from "./pages/VendorReachPage.jsx";
import PublicationsEmbedPage  from "./pages/PublicationsEmbedPage.jsx";
import PublicationStudio      from "./pages/PublicationStudio.jsx";
import ThumbnailRenderer      from "./pages/PublicationStudio/ThumbnailRenderer.jsx";
import MagazineHomePage     from "./pages/Magazine/MagazineHomePage.jsx";
import CategoryPage          from "./pages/Magazine/CategoryPage.jsx";
import MagazineArticlePage  from "./pages/Magazine/MagazineArticlePage.jsx";
import MagazinePreviewPage  from "./pages/Magazine/MagazinePreviewPage.jsx";
import FashionLandingPage   from "./pages/Magazine/FashionLandingPage.jsx";
const MagazineStudio         = lazy(() => import("./pages/MagazineStudio/index.jsx"));
const UniversalStudioRouter  = lazy(() => import("./pages/Studio/UniversalStudioRouter.jsx"));
import EditorialShowcase    from "./pages/EditorialShowcase.jsx";
import ShowcasePage         from "./pages/ShowcasePage.jsx";
import VendorPublicPage     from "./pages/VendorPublicPage.jsx";
import DdeShowcasePage          from "./pages/DdeShowcasePage.jsx";
import SixSensesShowcasePage    from "./pages/SixSensesShowcasePage.jsx";
import RitzLondonShowcasePage            from "./pages/RitzLondonShowcasePage.jsx";
import InterContinentalParkLanePage      from "./pages/InterContinentalParkLanePage.jsx";
import VenueProfilePage         from "./pages/VenueProfilePage.jsx";
import VenueReviewsPage         from "./pages/VenueReviewsPage.jsx";
import EventDetailPage          from "./pages/EventDetailPage.jsx";
import EventReviewPage          from "./pages/EventReviewPage.jsx";
import AuraDiscoveryDemoPage    from "./pages/AuraDiscoveryDemoPage.jsx";
import LuxuryRegionPageTest     from "./pages/LuxuryRegionPageTest.jsx";
import GridResponsiveTest       from "./pages/GridResponsiveTest.jsx";
import NotFoundPage         from "./pages/NotFoundPage.jsx";
import UnsubscribePage      from "./pages/UnsubscribePage.jsx";
import { VENDORS }            from "./data/vendors.js";

// ── Lazy-loaded admin modules for bundle optimization ──────────────────────────
const ListingStudioPage = lazy(() => import("./pages/ListingStudio/ListingStudioPage.jsx"));

// ── Design system colors and fonts ───────────────────────────────────────────
const COLORS = {
  bg: "#0a0a0a",
  dark: "#1a1a1a",
  card: "#2a2a2a",
  white: "#ffffff",
  grey: "#a0a0a0",
  grey2: "#808080",
  border: "#404040",
  gold: "#d4af37",
  rose: "#f43f5e",
};
const FONTS = {
  normal: "'Nunito', sans-serif",
  display: "'Georgia', serif",
};

// ── Planner slug helpers ─────────────────────────────────────────────────────
function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function getPlannerByIdOrSlug(idOrSlug) {
  if (!idOrSlug) return null;
  return VENDORS.find(
    (v) => v.category === "planner" && (v.id === idOrSlug || toSlug(v.name) === idOrSlug)
  ) || null;
}

// ── URL ↔ state helpers ──────────────────────────────────────────────────────
function stateToPath(pg, opts = {}) {
  const { countrySlug, regionSlug, categorySlug, plannerSlug, weddingSlug, activationToken, locationType, locationSlug } = opts;
  switch (pg) {
    case "puglia":           return "/italy/puglia";
    // ── OPTION A: Dynamic location routes ──
    // Converts locationType + locationSlug back to URL path.
    // Examples: country:thailand → /thailand, region:italy:tuscany → /italy/tuscany
    case "location": {
      if (locationType === "country" && locationSlug) return `/${locationSlug}`;
      if (locationType === "region" && countrySlug && locationSlug) return `/${countrySlug}/${locationSlug}`;
      if (locationType === "city" && countrySlug && regionSlug && locationSlug) return `/${countrySlug}/${regionSlug}/${locationSlug}`;
      return "/";
    }
    case "region":           return `/${countrySlug}/${regionSlug}`;
    case "region-category": {
      // Phase 1: New URL structure
      // Global: /[categorySlug], Country: /[countrySlug]/[categorySlug], Region: /[countrySlug]/[categorySlug]-in/[regionSlug]
      // Internal state may use countrySlug="world" and regionSlug="all", but these must NOT appear in public URLs
      if ((!countrySlug || countrySlug === "world") && (!regionSlug || regionSlug === "all")) return `/${categorySlug}`;
      if (countrySlug && countrySlug !== "world" && !regionSlug) return `/${countrySlug}/${categorySlug}`;
      if (countrySlug && countrySlug !== "world" && regionSlug && regionSlug !== "all") return `/${countrySlug}/${categorySlug}-in/${regionSlug}`;
      return "/";
    }
    case "planner-profile":  return `/${countrySlug}/${regionSlug}/wedding-planners/${plannerSlug}`;
    case "real-wedding-detail": return `/real-weddings/${weddingSlug}`;
    case "real-weddings":    return "/real-weddings";
    case "category":         return "/category";

    case "standard":         return "/the-lwd-standard";
    case "about":            return "/about";
    case "taigenic":         return "/taigenic";
    case "contact":          return "/contact";
    case "privacy":          return "/privacy";
    case "terms":            return "/terms";
    case "cookies":          return "/cookies";
    case "reviews-policy":   return "/reviews-policy";
    case "support":          return "/support";
    case "unsubscribe":      return "/unsubscribe";
    case "partnership":      return "/partnership";
    case "admin":                return "/admin";
    case "admin-login":          return "/admin/login";
    case "admin-oauth-callback": return "/admin/oauth/callback";
    case "portal":           return "/portal";
    case "vendor":           return "/vendor";
    case "vendor-login":           return "/vendor/login";
    case "vendor-signup":          return "/vendor/signup";
    case "vendor-activate":        return activationToken ? `/vendor/activate?token=${activationToken}` : "/vendor/activate";
    case "vendor-confirm-email":   return "/vendor/confirm-email";
    case "vendor-forgot-password": return "/vendor/forgot-password";
    case "vendor-reset-password":  return "/vendor/reset-password";
    case "couple-signup":          return "/couple/signup";
    case "couple-login":           return "/couple/login";
    case "couple-confirm-email":   return "/getting-married/confirm-email";
    case "couple-forgot-password": return "/getting-married/forgot-password";
    case "couple-reset-password":  return "/getting-married/reset-password";
    case "join":                  return "/join";
    case "list-your-business":    return "/list-your-business";
    case "advertise":             return "/advertise";
    case "pricing":               return "/pricing";
    case "listings":              return "/listings";
    case "h2":                    return "/h2";
    case "h3":                    return "/h3";
    case "most-loved":            return "/most-loved";
    case "partner-enquiry":       return "/partner-enquiry";
    case "getting-married":  return "/getting-married";
    case "shortlist":        return "/shortlist";
    case "artistry-awards":  return "/artistry-awards";
    case "magazine":         return "/magazine";
    case "magazine-category": return `/magazine/category/${opts.magazineCategoryId || ''}`;
    case "magazine-fashion": return "/magazine/fashion";
    case "magazine-article": return `/magazine/${opts.magazineSlug || ''}`;
    case "magazine-studio":        return "/magazine-studio";
    case "publications":           return "/publications";
    case "publications-reader":    return `/publications/${opts.publicationsSlug || ''}`;
    case "publications-embed":     return `/publications/embed/${opts.publicationsEmbedSlug || ''}`;
    case "publication-studio":       return "/publication-studio";
    case "magazine-collaborate":     return `/magazine/collaborate/${opts.collaborateToken || ''}`;
    case "magazine-reach":           return `/magazine/reach/${opts.reachIssueSlug || ''}/${opts.reachVendorSlug || ''}`;
    case "magazine-reader":          return `/magazine/read/${opts.magazineIssueSlug || ''}`;
    case "studio-edit": {
      const { entityType, slug, from } = opts;
      if (!entityType || !slug) return "/";
      const base = `/studio/edit/${entityType}/${slug}`;
      return from ? `${base}?from=${encodeURIComponent(from)}` : base;
    }
    case "vendor-public":    return `/vendor/${opts.vendorSlug || ''}`;
    case "venue-profile":    return `/venues/${opts.venueSlug || 'grand-tirolia'}`;
    case "venue-reviews":    return `/venues/${opts.venueSlug || ''}/reviews`;
    case "event-detail":     return `/events/${opts.eventSlug || ''}`;
    case "event-review":     return "/review";
    case "listing-profile": {
      const cs  = opts.countrySlug;
      const rs  = opts.regionSlug;
      const cat = opts.categorySlug || 'wedding-venues';
      const vs  = opts.venueSlug    || '';
      // CANONICAL URL: /{country}/{region}/{category}/{listing}
      // countrySlug and regionSlug are REQUIRED
      if (!cs || !rs || !vs) {
        console.warn('[goListing] Missing required params for canonical URL:', { cs, rs, cat, vs });
        return '/';
      }
      return `/${cs}/${rs}/${cat}/${vs}`;
    }
    case "dde-showcase":      return "/showcase/domaine-des-etangs";
    case "ritz-showcase":     return "/showcase/the-ritz-london";
    case "ic-park-lane-showcase": return "/showcase/intercontinental-london-park-lane";
    case "gt-showcase":       return "/showcase/grand-tirolia-kitzbuehel";
    case "sskrabey-showcase": return "/showcase/six-senses-krabey-island";
    case "showcase":         return `/showcase/${opts.showcaseSlug || ''}`;
    case "aura-discovery":   return "/discovery/aura";
    case "luxury-region-test": return "/test/luxury-region/amalfi-coast";
    default:                 return "/";
  }
}

function pathToState(pathname) {
  const clean = pathname.replace(/^\/+|\/+$/g, "");
  if (!clean) return { page: "home" };
  const statics = {
    category: "category", "the-lwd-standard": "standard",
    about: "about", contact: "contact", partnership: "partnership",
    privacy: "privacy", terms: "terms", cookies: "cookies", "reviews-policy": "reviews-policy", support: "support",
    admin: "admin", vendor: "vendor", couple: "couple", "real-weddings": "real-weddings", shortlist: "shortlist", "getting-married": "getting-married", join: "join", "artistry-awards": "artistry-awards", "partner-enquiry": "partner-enquiry", taigenic: "taigenic", "list-your-business": "list-your-business", pricing: "pricing", "most-loved": "most-loved", listings: "listings", "h2": "h2", "h3": "h3", advertise: "advertise",
  };
  const parts = clean.split("/");
  // Unsubscribe landing page
  if (parts[0] === "unsubscribe" && parts.length === 1) return { page: "unsubscribe" };
  // Client portal
  if (parts[0] === "portal") return { page: "portal" };
  // Handle vendor auth subroutes first (before treating /vendor as static)
  if (parts[0] === "vendor" && parts[1] === "login" && parts.length === 2) return { page: "vendor-login" };
  if (parts[0] === "vendor" && parts[1] === "signup" && parts.length === 2) return { page: "vendor-signup" };
  if (parts[0] === "vendor" && parts[1] === "activate" && parts.length === 2) {
    const url = new URL("http://dummy" + pathname);
    const token = url.searchParams.get("token");
    return { page: "vendor-activate", activationToken: token };
  }
  if (parts[0] === "vendor" && parts[1] === "confirm-email" && parts.length === 2) return { page: "vendor-confirm-email" };
  if (parts[0] === "vendor" && parts[1] === "forgot-password" && parts.length === 2) return { page: "vendor-forgot-password" };
  if (parts[0] === "vendor" && parts[1] === "reset-password" && parts.length === 2) return { page: "vendor-reset-password" };
  // Public vendor profile: /vendor/{slug} — must come after all auth subroutes
  const VENDOR_AUTH_WORDS = ['login','signup','activate','confirm-email','forgot-password','reset-password','dashboard'];
  if (parts[0] === "vendor" && parts.length === 2 && !VENDOR_AUTH_WORDS.includes(parts[1])) {
    return { page: "vendor-public", vendorSlug: parts[1] };
  }
  // Handle admin auth subroutes
  if (parts[0] === "admin" && parts[1] === "login" && parts.length === 2) return { page: "admin-login" };
  if (parts[0] === "admin" && parts[1] === "oauth" && parts[2] === "callback") return { page: "admin-oauth-callback" };
  // Handle couple auth subroutes
  if (parts[0] === "couple" && parts[1] === "signup" && parts.length === 2) return { page: "couple-signup" };
  if (parts[0] === "couple" && parts[1] === "login" && parts.length === 2) return { page: "couple-login" };
  if (parts[0] === "getting-married" && parts[1] === "confirm-email" && parts.length === 2) return { page: "couple-confirm-email" };
  if (parts[0] === "getting-married" && parts[1] === "forgot-password" && parts.length === 2) return { page: "couple-forgot-password" };
  if (parts[0] === "getting-married" && parts[1] === "reset-password" && parts.length === 2) return { page: "couple-reset-password" };
  if (parts[0] === "couple" && parts[1] === "getting-married" && parts.length === 2) return { page: "getting-married" };
  // Handle real-weddings special routes
  if (parts[0] === "real-weddings" && parts.length === 1) return { page: "real-weddings" };
  if (parts[0] === "real-weddings" && parts.length === 2) return { page: "real-wedding-detail", weddingSlug: parts[1] };
  // Handle Aura Discovery
  if (parts[0] === "discovery" && parts[1] === "aura" && parts.length === 2) return { page: "aura-discovery" };
  // Handle Luxury Region Test page
  if (parts[0] === "test" && parts[1] === "luxury-region" && parts.length === 3) return { page: "luxury-region-test", testRegion: parts[2] };
  // Handle Grid Responsive Test page
  if (parts[0] === "test" && parts[1] === "grid" && parts.length === 2) return { page: "grid-responsive-test" };
  // Handle Amalfi Coast v2 unified SEO test
  if (parts[0] === "test" && parts[1] === "amalfi-coast-v2" && parts.length === 2) return { page: "amalfi-coast-v2" };
  // Handle Puglia premium page (Phase 3.1 demo)
  if (parts[0] === "italy" && parts[1] === "puglia" && parts.length === 2) return { page: "puglia" };
  // Magazine routes
  if (parts[0] === "editorial-showcase" && parts.length === 1) return { page: "editorial-showcase" };
  // Venue showcase, static DDE page
  if (parts[0] === "showcase" && parts[1] === "domaine-des-etangs")       return { page: "dde-showcase" };
  if (parts[0] === "showcase" && parts[1] === "six-senses-krabey-island") return { page: "sskrabey-showcase" };
  // Venue showcase, static Ritz London editorial page
  if (parts[0] === "showcase" && parts[1] === "the-ritz-london")          return { page: "ritz-showcase" };
  if (parts[0] === "showcase" && parts[1] === "intercontinental-london-park-lane") return { page: "ic-park-lane-showcase" };
  // Venue showcase, static Grand Tirolia editorial page
  if (parts[0] === "showcase" && parts[1] === "grand-tirolia-kitzbuehel") return { page: "gt-showcase" };
  // Venue showcase: /showcase/{slug}
  if (parts[0] === "showcase" && parts.length === 2) return { page: "showcase", showcaseSlug: parts[1] };
  // ── DEPRECATED OLD URLs (for redirect only) ──
  // Old format: /venues/{slug} → redirect to canonical
  if (parts[0] === "venues" && parts.length === 2) return { page: "listing-profile", venueSlug: parts[1], redirectToCanonical: true };
  // Venue reviews page: /venues/{slug}/reviews → also deprecated
  if (parts[0] === "venues" && parts.length === 3 && parts[2] === "reviews") return { page: "venue-reviews", venueSlug: parts[1] };
  // Event detail: /events/{slug}
  if (parts[0] === "events" && parts.length === 2) return { page: "event-detail", eventSlug: parts[1] };
  // Event attendee review: /review?token=UUID
  if (parts[0] === "review" && parts.length === 1) return { page: "event-review" };
  // Old format: /wedding-venues/{slug} → redirect to canonical
  if (parts[0] === "wedding-venues" && parts.length === 2) return { page: "listing-profile", venueSlug: parts[1], redirectToCanonical: true };
  // Universal studio editor: /studio/edit/{entityType}/{slug}
  if (parts[0] === "studio" && parts[1] === "edit" && parts.length === 4) {
    return { page: "studio-edit", entityType: parts[2], slug: decodeURIComponent(parts[3]) };
  }
  if (parts[0] === "magazine-studio" && parts.length === 1) return { page: "magazine-studio" };
  if (parts[0] === "publications" && parts.length === 1) return { page: "publications" };
  if (parts[0] === "publications" && parts[1] === "embed" && parts.length === 3) return { page: "publications-embed", publicationsEmbedSlug: parts[2] };
  if (parts[0] === "publications" && parts.length === 2) return { page: "publications-reader", publicationsSlug: parts[1] };
  if (parts[0] === "publication-studio") return { page: "publication-studio" };
  if (parts[0] === "magazine" && parts[1] === "collaborate" && parts.length === 3) return { page: "magazine-collaborate", collaborateToken: parts[2] };
  if (parts[0] === "magazine" && parts[1] === "reach" && parts.length === 4) return { page: "magazine-reach", reachIssueSlug: parts[2], reachVendorSlug: parts[3] };
  if (parts[0] === "magazine" && parts[1] === "read" && parts.length === 3) return { page: "magazine-reader", magazineIssueSlug: parts[2] };
  // Dev-only renderer for thumbnail generation — see scripts/generate-template-thumbnails.mjs
  if (parts[0] === "studio-thumbnail" && parts.length === 2) return { page: "studio-thumbnail", templateId: parts[1] };
  if (parts[0] === "magazine" && parts.length === 1) return { page: "magazine" };
  if (parts[0] === "magazine" && parts[1] === "category" && parts.length === 3) return { page: "magazine-category", magazineCategoryId: parts[2] };
  if (parts[0] === "magazine" && parts[1] === "fashion" && parts.length === 2) return { page: "magazine-fashion" };
  if (parts[0] === "magazine" && parts[1] === "preview" && parts.length === 2) return { page: "magazine-preview" };
  if (parts[0] === "magazine" && parts.length === 2 && parts[1] !== "category" && parts[1] !== "fashion" && parts[1] !== "preview") return { page: "magazine-article", magazineSlug: parts[1] };
  // Static routes: non-location single-segment paths (admin, about, contact, etc.)
  if (parts.length === 1 && statics[parts[0]]) return { page: statics[parts[0]] };

  // ── NEW URL STRUCTURE: Category Pages (Phase 1) ────────────────────────────────
  // Uses existing RegionCategoryPage component with different data context
  // /[category] → global, /[country]/[category] → country, /[country]/[category]-in/[region] → region
  const CATEGORY_SLUGS = ['wedding-venues', 'wedding-planners', 'photographers', 'videographers', 'florists', 'styling-decor', 'caterers', 'hair-makeup', 'guest-attire', 'entertainment', 'cakes', 'bridal-dresses', 'stationery', 'health-beauty', 'event-production', 'luxury-transport', 'celebrants', 'gift-registry'];

  // /[category] — Global category (e.g. /wedding-venues)
  if (parts.length === 1 && CATEGORY_SLUGS.includes(parts[0])) {
    return { page: "region-category", countrySlug: null, regionSlug: null, categorySlug: parts[0] };
  }

  // /[country]/[category] — Country category (e.g. /england/wedding-venues)
  if (parts.length === 2 && CATEGORY_SLUGS.includes(parts[1])) {
    return { page: "region-category", countrySlug: parts[0], regionSlug: null, categorySlug: parts[1] };
  }

  // /[country]/[category]-in/[region] — Region category (e.g. /england/wedding-venues-in/surrey)
  if (parts.length === 3 && parts[1].includes('-in')) {
    const [categoryPart, _] = parts[1].split('-in');
    if (CATEGORY_SLUGS.includes(categoryPart)) {
      return { page: "region-category", countrySlug: parts[0], regionSlug: parts[2], categorySlug: categoryPart };
    }
  }

  // ── ALL location routes resolve through LocationPage ──
  // No country-specific privileged routing. Supabase locations table is the single authority.
  // /italy, /thailand, /france — all treated identically.
  // LocationPage queries Supabase first, falls back to static geo.js only for migration.
  if (parts.length === 1) return { page: "location", locationType: "country", locationSlug: parts[0] };

  if (parts.length === 2) return { page: "region", countrySlug: parts[0], regionSlug: parts[1] };
  if (parts.length === 3) {
    // Modern format: /country/region/category → region-category grid
    // Old format: /country/category/slug → DEPRECATED, redirect to canonical
    if (CATEGORY_SLUGS.includes(parts[2])) {
      // New format: /country/region/category (e.g. /england/somerset/wedding-venues)
      return { page: "region-category", countrySlug: parts[0], regionSlug: parts[1], categorySlug: parts[2] };
    }
    if (CATEGORY_SLUGS.includes(parts[1])) {
      // Old format: /country/category/slug (e.g. /italy/wedding-venues/villa-balbiano)
      return { page: "listing-profile", countrySlug: parts[0], regionSlug: null, categorySlug: parts[1], venueSlug: parts[2], redirectToCanonical: true };
    }
    // Fallback: treat as new format (region-category)
    return { page: "region-category", countrySlug: parts[0], regionSlug: parts[1], categorySlug: parts[2] };
  }
  if (parts.length === 4) {
    const [countrySlug, regionSlug, categorySlug, itemSlug] = parts;
    if (categorySlug === 'wedding-planners') {
      return { page: "planner-profile", countrySlug, regionSlug, categorySlug, plannerSlug: itemSlug };
    }
    return { page: "listing-profile", countrySlug, regionSlug, categorySlug, venueSlug: itemSlug };
  }
  // /{country}/{region}/{category}/{slug}/reviews
  if (parts.length === 5 && parts[4] === "reviews") {
    return { page: "venue-reviews", countrySlug: parts[0], regionSlug: parts[1], categorySlug: parts[2], venueSlug: parts[3] };
  }
  return { page: "not-found" };
}

// ── Aura suppressor for admin/vendor pages ───────────────────────────────────
// Forces chatUiState back to "closed" when navigating into any dashboard page.
// Prevents Aura persisting open from a previous public page visit, and prevents
// the lwd_aura_engage bridge from rendering the chat inside an admin window.
function AuraSuppressor({ active }) {
  const { closeChat } = useChat();
  useEffect(() => {
    if (active) closeChat();
  }, [active, closeChat]);
  return null;
}

// ── Admin Route Wrapper (properly calls hooks at top level) ──────────────────
function AdminRoute({ onBack, onNavigate }) {
  const { isAuthenticated, loading } = useAdminAuth();

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", fontFamily: "inherit" }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <AdminLogin onBack={onBack} />;
  }

  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', fontFamily: 'inherit' }}>Loading...</div>}>
      <AdminDashboard onBack={onBack} onNavigate={onNavigate} />
    </Suspense>
  );
}

// ── App (router + providers in one place) ────────────────────────────────────
function App() {
  // Parse initial URL so direct links & refreshes work
  const initial = pathToState(window.location.pathname);

  const themeCtx = useGlobalTheme();
  const darkMode = themeCtx.darkMode ?? (getDefaultMode() === 'dark');
  const toggleDark = themeCtx.toggleDark ?? (() => {});

  const [page, setPage] = useState(initial.page);
  const [categoryRegion, setCategoryRegion] = useState(null);
  const [activeCountrySlug, setActiveCountrySlug] = useState(initial.countrySlug || null);
  const [activeRegionSlug, setActiveRegionSlug] = useState(initial.regionSlug || null);
  const [activeCategorySlug, setActiveCategorySlug] = useState(initial.categorySlug || null);
  const [activePlannerSlug, setActivePlannerSlug] = useState(initial.plannerSlug || null);
  const [activeWeddingSlug, setActiveWeddingSlug] = useState(initial.weddingSlug || null);
  const [activationToken, setActivationToken] = useState(initial.activationToken || null);
  const [categorySearchQuery, setCategorySearchQuery] = useState(null);
  const [activeMagazineCategoryId, setActiveMagazineCategoryId] = useState(initial.magazineCategoryId || null);
  const [activeMagazineSlug, setActiveMagazineSlug] = useState(initial.magazineSlug || null);
  const [activePublicationsSlug, setActivePublicationsSlug] = useState(initial.publicationsSlug || null);
  const [activeEmbedSlug,        setActiveEmbedSlug]        = useState(initial.publicationsEmbedSlug || null);
  const [activeMagazineIssueSlug, setActiveMagazineIssueSlug] = useState(initial.magazineIssueSlug || null);
  const [activeCollaborateToken,  setActiveCollaborateToken]  = useState(initial.collaborateToken  || null);
  const [activeReachIssueSlug,    setActiveReachIssueSlug]    = useState(initial.reachIssueSlug    || null);
  const [activeReachVendorSlug,   setActiveReachVendorSlug]   = useState(initial.reachVendorSlug   || null);
  const [studioThumbnailId,      setStudioThumbnailId]      = useState(initial.templateId || null);
  const [studioEntityType, setStudioEntityType] = useState(initial.entityType || null);
  const [studioSlug, setStudioSlug] = useState(initial.slug || null);
  const [activeVenueSlug, setActiveVenueSlug] = useState(initial.venueSlug || null);
  const [activeVendorSlug, setActiveVendorSlug] = useState(initial.vendorSlug || null);
  const [activeShowcaseSlug, setActiveShowcaseSlug] = useState(initial.showcaseSlug || null);
  const [activeEventSlug, setActiveEventSlug] = useState(initial.eventSlug || null);
  const [activeLocationType, setActiveLocationType] = useState(initial.locationType || null);
  const [activeLocationSlug, setActiveLocationSlug] = useState(initial.locationSlug || null);
  const [magazineLight, setMagazineLight] = useState(true);
  const [needsRedirect, setNeedsRedirect] = useState(initial.redirectToCanonical ? stateToPath(initial.page, initial) : null);

  // Ref: skip pushState when change came from popstate (back/forward)
  const skipPush = useRef(false);

  // Scroll to top whenever the page or active slug changes
  useEffect(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
  }, [page, activeShowcaseSlug, activeCountrySlug, activeRegionSlug, activeCategorySlug, activePlannerSlug]);

  // ── Tracker: init on mount, fire page_view on every navigation ───────────
  const trackerInitRef = useRef(false);
  useEffect(() => {
    if (!trackerInitRef.current) {
      trackerInitRef.current = true;
      initTracker();   // fires first page_view + starts heartbeat
    } else {
      trackPageView(); // subsequent navigations
    }
  }, [page, activeCountrySlug, activeRegionSlug, activeCategorySlug, activePlannerSlug, activeWeddingSlug, activeMagazineCategoryId, activeMagazineSlug, activeVenueSlug, activeVendorSlug, activeShowcaseSlug, activeEventSlug, activeLocationType, activeLocationSlug]);

  // ── URL sync: push URL whenever state changes ─────────────────────────────
  useEffect(() => {
    if (skipPush.current) { skipPush.current = false; return; }
    const path = stateToPath(page, {
      countrySlug: activeCountrySlug,
      regionSlug: activeRegionSlug,
      categorySlug: activeCategorySlug,
      plannerSlug: activePlannerSlug,
      weddingSlug: activeWeddingSlug,
      activationToken: activationToken,
      magazineCategoryId: activeMagazineCategoryId,
      magazineSlug: activeMagazineSlug,
      publicationsSlug: activePublicationsSlug,
      magazineIssueSlug: activeMagazineIssueSlug,
      collaborateToken: activeCollaborateToken,
      reachIssueSlug: activeReachIssueSlug,
      reachVendorSlug: activeReachVendorSlug,
      venueSlug: activeVenueSlug,
      vendorSlug: activeVendorSlug,
      showcaseSlug: activeShowcaseSlug,
      eventSlug: activeEventSlug,
      locationType: activeLocationType,
      locationSlug: activeLocationSlug,
    });
    if (window.location.pathname !== path) {
      window.history.pushState(null, "", path);
    }
  }, [page, activeCountrySlug, activeRegionSlug, activeCategorySlug, activePlannerSlug, activeWeddingSlug, activationToken, activeMagazineCategoryId, activeMagazineSlug, activeVenueSlug, activeVendorSlug, activeShowcaseSlug, activeEventSlug, activeLocationType, activeLocationSlug]);

  // ── Redirect to canonical URL if needed ────────────────────────────────────
  useEffect(() => {
    if (needsRedirect && window.location.pathname !== needsRedirect) {
      window.location.replace(needsRedirect);
    }
  }, [needsRedirect]);

  // ── Popstate: back / forward browser buttons ─────────────────────────────
  useEffect(() => {
    const onPop = () => {
      const s = pathToState(window.location.pathname);
      skipPush.current = true;
      setActiveCountrySlug(s.countrySlug || null);
      setActiveRegionSlug(s.regionSlug || null);
      setActiveCategorySlug(s.categorySlug || null);
      setActivePlannerSlug(s.plannerSlug || null);
      setActiveWeddingSlug(s.weddingSlug || null);
      setActivationToken(s.activationToken || null);
      setActiveMagazineCategoryId(s.magazineCategoryId || null);
      setActiveMagazineSlug(s.magazineSlug || null);
      setActiveMagazineIssueSlug(s.magazineIssueSlug || null);
      setActiveVenueSlug(s.venueSlug || null);
      setActiveVendorSlug(s.vendorSlug || null);
      setActiveShowcaseSlug(s.showcaseSlug || null);
      setActiveEventSlug(s.eventSlug || null);
      setActiveLocationType(s.locationType || null);
      setActiveLocationSlug(s.locationSlug || null);
      setStudioThumbnailId(s.templateId || null);
      setCategoryRegion(null);
      setCategorySearchQuery(null);
      setPage(s.page);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const goHome = () => {
    setCategoryRegion(null); setActiveCountrySlug(null); setActiveRegionSlug(null);
    setActiveCategorySlug(null); setCategorySearchQuery(null);
    setPage("home");
  };
  const goVenue = (venueOrSlug) => {
    setCategoryRegion(null); setCategorySearchQuery(null);
    const isObj = typeof venueOrSlug === 'object' && venueOrSlug !== null;
    const slug  = isObj ? venueOrSlug.slug        : venueOrSlug;
    const cs    = isObj ? (venueOrSlug.countrySlug  || venueOrSlug.country_slug  || null) : null;
    const rs    = isObj ? (venueOrSlug.regionSlug   || venueOrSlug.region_slug   || null) : null;
    const cat   = isObj ? (venueOrSlug.categorySlug || venueOrSlug.category_slug || 'wedding-venues') : null;
    setActiveCountrySlug(cs);
    setActiveRegionSlug(rs);
    setActiveCategorySlug(cat);
    if (slug) {
      setActiveVenueSlug(slug);
      setPage("listing-profile");
    } else {
      setPage("home");
    }
  };
  const goRegion = (countrySlug, regionSlug) => {
    setActiveCountrySlug(countrySlug || null);
    setActiveRegionSlug(regionSlug || null);
    setCategoryRegion(null);
    setActiveCategorySlug(null); setCategorySearchQuery(null);
    setPage("region");
  };
  const goRegionCategory = (countrySlug, regionSlug, categorySlug) => {
    setActiveCountrySlug(countrySlug || null);
    setActiveRegionSlug(regionSlug || null);
    setActiveCategorySlug(categorySlug || null);
    setCategoryRegion(null); setCategorySearchQuery(null);
    setPage("region-category");
  };
  const goCategory = (filterCtx) => {
    // NEW: Support Phase 1 URL routing for categories
    // When passed { category, countrySlug, regionSlug }, navigate to new URL pattern
    if (filterCtx && typeof filterCtx === "object" && filterCtx.category) {
      const catSlug = filterCtx.category;
      const ctrySlug = filterCtx.countrySlug || null;
      const regSlug = filterCtx.regionSlug || null;

      setActiveCountrySlug(ctrySlug);
      setActiveRegionSlug(regSlug);
      setActiveCategorySlug(catSlug);
      setCategoryRegion(null);
      setCategorySearchQuery(null);
      // Use "region-category" page which handles all three URL patterns:
      // - /[category] (global)
      // - /[country]/[category] (country)
      // - /[country]/[category]-in/[region] (region)
      setPage("region-category");
      return;
    }

    // OLD: Legacy category mode (backward compatibility)
    if (typeof filterCtx === "string") {
      setCategoryRegion(filterCtx || null);
      setCategorySearchQuery(null);
    } else if (filterCtx && typeof filterCtx === "object") {
      setCategoryRegion(filterCtx.regionSlug || null);
      setActiveCountrySlug(filterCtx.countrySlug || null);
      setActiveRegionSlug(filterCtx.regionSlug || null);
      setCategorySearchQuery(filterCtx.searchQuery || null);
    } else {
      setCategoryRegion(null);
      setCategorySearchQuery(null);
    }
    setPage("category");
  };
  const goPlannerProfile = (countrySlug, regionSlug, planner) => {
    setActiveCountrySlug(countrySlug || null);
    setActiveRegionSlug(regionSlug || null);
    setActiveCategorySlug("wedding-planners");
    setActivePlannerSlug(toSlug(planner.name));
    setPage("planner-profile");
  };
  const goStandard = () => setPage("standard");
  const goAbout    = () => setPage("about");
  const goContact     = () => setPage("contact");
  const goPartnership = () => setPage("partnership");
  const goPartnerEnquiry = () => setPage("partner-enquiry");
  const goUSA         = () => { setActiveCountrySlug(null); setActiveRegionSlug(null); setActiveCategorySlug(null); setCategoryRegion(null); setCategorySearchQuery(null); setPage("usa"); };
  const goItaly       = () => { setActiveCountrySlug(null); setActiveRegionSlug(null); setActiveCategorySlug(null); setCategoryRegion(null); setCategorySearchQuery(null); setPage("italy"); };
  const goCountry     = (slug) => { setActiveLocationType("country"); setActiveLocationSlug(slug); setActiveCountrySlug(slug); setActiveRegionSlug(null); setActiveCategorySlug(null); setCategoryRegion(null); setCategorySearchQuery(null); setPage("location"); };
  const goAdmin       = () => setPage("admin");
  const goVendor              = () => setPage("vendor");
  const goPortal              = () => setPage("portal");
  const goVendorLogin         = () => setPage("vendor-login");
  const goVendorSignup        = () => setPage("vendor-signup");
  const goVendorConfirmEmail  = () => setPage("vendor-confirm-email");
  const goVendorForgotPassword = () => setPage("vendor-forgot-password");
  const goVendorResetPassword  = () => setPage("vendor-reset-password");
  const goVendorActivate      = (token) => { setActivationToken(token || null); setPage("vendor-activate"); };
  const goCoupleSignup        = () => setPage("couple-signup");
  const goCoupleLogin         = () => setPage("couple-login");
  const goCoupleConfirmEmail  = () => setPage("couple-confirm-email");
  const goCoupleForgotPassword = () => setPage("couple-forgot-password");
  const goCoupleResetPassword  = () => setPage("couple-reset-password");
  const goAdminLogin  = () => setPage("admin-login");
  const goPuglia           = () => { setActiveCountrySlug(null); setActiveRegionSlug(null); setActiveCategorySlug(null); setActivePlannerSlug(null); setCategoryRegion(null); setCategorySearchQuery(null); setPage("puglia"); };
  const goAuraDiscovery    = () => { setActiveCountrySlug(null); setActiveRegionSlug(null); setActiveCategorySlug(null); setActivePlannerSlug(null); setCategoryRegion(null); setCategorySearchQuery(null); setPage("aura-discovery"); };
  const goEventDetail = (eventSlug) => { setActiveEventSlug(eventSlug); setPage("event-detail"); };

  // Store couple/vendor nav functions on window for use in auth components
  useEffect(() => {
    window.coupleGoSignup = goCoupleSignup;
    window.coupleGoLogin = goCoupleLogin;
    window.vendorGoSignup = goVendorSignup;
    window.vendorGoLogin = goVendorLogin;
    window.goJoin = goJoin;
  }, []);
  const goRealWeddings = () => { setActiveCountrySlug(null); setActiveRegionSlug(null); setActiveCategorySlug(null); setActivePlannerSlug(null); setActiveWeddingSlug(null); setCategoryRegion(null); setCategorySearchQuery(null); setPage("real-weddings"); };
  const goRealWeddingDetail = (weddingSlug) => { setActiveWeddingSlug(weddingSlug); setPage("real-wedding-detail"); };
  const goShortlist = () => { setActiveCountrySlug(null); setActiveRegionSlug(null); setActiveCategorySlug(null); setActivePlannerSlug(null); setActiveWeddingSlug(null); setCategoryRegion(null); setCategorySearchQuery(null); setPage("shortlist"); };
  const goGettingMarried = () => { setActiveCountrySlug(null); setActiveRegionSlug(null); setActiveCategorySlug(null); setActivePlannerSlug(null); setActiveWeddingSlug(null); setCategoryRegion(null); setCategorySearchQuery(null); setPage("getting-married"); };
  const goArtistryAwards = () => { setActiveCountrySlug(null); setActiveRegionSlug(null); setActiveCategorySlug(null); setActivePlannerSlug(null); setActiveWeddingSlug(null); setCategoryRegion(null); setCategorySearchQuery(null); setPage("artistry-awards"); };
  const goJoin = () => { setActiveCountrySlug(null); setActiveRegionSlug(null); setActiveCategorySlug(null); setActivePlannerSlug(null); setActiveWeddingSlug(null); setCategoryRegion(null); setCategorySearchQuery(null); setPage("join"); };
  const goListYourBusiness = () => { setActiveCountrySlug(null); setActiveRegionSlug(null); setActiveCategorySlug(null); setActivePlannerSlug(null); setActiveWeddingSlug(null); setCategoryRegion(null); setCategorySearchQuery(null); setPage("list-your-business"); };
  const goPricing = () => { setActiveCountrySlug(null); setActiveRegionSlug(null); setActiveCategorySlug(null); setActivePlannerSlug(null); setActiveWeddingSlug(null); setCategoryRegion(null); setCategorySearchQuery(null); setPage("pricing"); };
  const goListings = () => { setActiveCountrySlug(null); setActiveRegionSlug(null); setActiveCategorySlug(null); setActivePlannerSlug(null); setActiveWeddingSlug(null); setCategoryRegion(null); setCategorySearchQuery(null); setPage("listings"); };
  const goH2 = () => { setActiveCountrySlug(null); setActiveRegionSlug(null); setActiveCategorySlug(null); setActivePlannerSlug(null); setActiveWeddingSlug(null); setCategoryRegion(null); setCategorySearchQuery(null); setPage("h2"); };
  const goH3 = () => { setActiveCountrySlug(null); setActiveRegionSlug(null); setActiveCategorySlug(null); setActivePlannerSlug(null); setActiveWeddingSlug(null); setCategoryRegion(null); setCategorySearchQuery(null); setPage("h3"); };
  const goAdvertise = () => { setActiveCountrySlug(null); setActiveRegionSlug(null); setActiveCategorySlug(null); setActivePlannerSlug(null); setActiveWeddingSlug(null); setCategoryRegion(null); setCategorySearchQuery(null); setPage("advertise"); };
  const goMagazine = () => { setActiveMagazineCategoryId(null); setActiveMagazineSlug(null); setPage("magazine"); };
  const goMagazineCategory = (categoryId) => { setActiveMagazineCategoryId(categoryId); setActiveMagazineSlug(null); setPage("magazine-category"); };
  const goMagazineArticle = (slug) => { setActiveMagazineSlug(slug); setActiveMagazineCategoryId(null); setPage("magazine-article"); };
  const goPublications      = () => { setActivePublicationsSlug(null); setPage("publications"); };
  const goPublicationsReader = (slug) => { setActivePublicationsSlug(slug); setPage("publications-reader"); };
  const goMagazineReader     = (slug) => { setActiveMagazineIssueSlug(slug); setPage("magazine-reader"); };
  const goPublicationsEmbed  = (slug) => { setActiveEmbedSlug(slug); setPage("publications-embed"); };
  const goPublicationStudio  = () => { setPage("publication-studio"); };
  const goMagazineFashion = () => { setActiveMagazineSlug(null); setActiveMagazineCategoryId(null); setPage("magazine-fashion"); };
  const [magazineEditSlug, setMagazineEditSlug] = useState(null);
  const goMagazineStudio  = (slug) => {
    if (slug) setMagazineEditSlug(slug);
    setPage("magazine-studio");
  };

  // ── Centralized footer navigation (passed to every page for SiteFooter) ───
  const footerNav = {
    onNavigateHome: goHome,
    onNavigateContact: goContact,
    onNavigatePartnership: goPartnership,
    onNavigateAdmin: goAdmin,
    onNavigateAbout: goAbout,
    onNavigateStandard: goStandard,
    onViewCategory: goCategory,
    onNavigateGettingMarried: goGettingMarried,
    onNavigateArtistryAwards: goArtistryAwards,
    onNavigateMagazine: goMagazine,
    onNavigatePartnerEnquiry: goPartnerEnquiry,
    onNavigatePricing: goPricing,
  };

  return (
    <AdminAuthProvider>
      <VendorAuthProvider>
        <CoupleAuthProvider>
          <ShortlistProvider>
            <ChatProvider>

        {/* ── Pages ── */}
        {/* /venue removed — dead route with no data */}
        {page === "venue-profile" && (
          <VenueProfile slug={activeVenueSlug} onBack={goHome} />
        )}
        {page === "listing-profile" && (
          <VenueProfile
            slug={activeVenueSlug}
            countrySlug={activeCountrySlug}
            regionSlug={activeRegionSlug}
            categorySlug={activeCategorySlug}
            onBack={goHome}
          />
        )}
        {page === "venue-reviews" && (
          <VenueReviewsPage slug={activeVenueSlug} categorySlug={activeCategorySlug} />
        )}
        {page === "event-detail" && (
          <EventDetailPage slug={activeEventSlug} onBack={goHome} footerNav={footerNav} />
        )}
        {page === "event-review" && (
          <EventReviewPage />
        )}
        {page === "dde-showcase" && (
          <ShowcasePage
            slug="domaine-des-etangs"
            darkMode={darkMode}
            onToggleDark={toggleDark}
            onBack={goHome}
            onGoDestination={(countrySlug) => {
              if (countrySlug) { setActiveCountrySlug(countrySlug); setPage("italy"); }
              else { setPage("home"); }
            }}
            onNavigateStandard={goStandard}
            onNavigateAbout={goAbout}
          />
        )}
        {page === "gt-showcase" && (
          <ShowcasePage
            slug="grand-tirolia-kitzbuehel"
            darkMode={darkMode}
            onToggleDark={toggleDark}
            onBack={goHome}
            onGoDestination={(countrySlug) => {
              if (countrySlug) { setActiveCountrySlug(countrySlug); setPage("home"); }
              else { setPage("home"); }
            }}
            onNavigateStandard={goStandard}
            onNavigateAbout={goAbout}
          />
        )}
        {page === "sskrabey-showcase" && (
          <ShowcasePage
            slug="six-senses-krabey-island"
            darkMode={darkMode}
            onToggleDark={toggleDark}
            onBack={goHome}
            onGoDestination={(countrySlug) => {
              if (countrySlug) { setActiveCountrySlug(countrySlug); setPage("italy"); }
              else { setPage("home"); }
            }}
            onNavigateStandard={goStandard}
            onNavigateAbout={goAbout}
          />
        )}
        {page === "ritz-showcase" && (
          <ShowcasePage
            slug="the-ritz-london"
            darkMode={darkMode}
            onToggleDark={toggleDark}
            onBack={goHome}
            onGoDestination={(countrySlug) => {
              if (countrySlug) { setActiveCountrySlug(countrySlug); setPage("italy"); }
              else { setPage("home"); }
            }}
            onNavigateStandard={goStandard}
            onNavigateAbout={goAbout}
          />
        )}
        {page === "ic-park-lane-showcase" && (
          <ShowcasePage
            slug="intercontinental-london-park-lane"
            darkMode={darkMode}
            onToggleDark={toggleDark}
            onBack={goHome}
            onGoDestination={(countrySlug) => {
              if (countrySlug) { setActiveCountrySlug(countrySlug); setPage("location"); }
              else { setPage("home"); }
            }}
            onNavigateStandard={goStandard}
            onNavigateAbout={goAbout}
          />
        )}
        {page === "showcase" && (
          <ShowcasePage
            slug={activeShowcaseSlug}
            darkMode={darkMode}
            onToggleDark={toggleDark}
            onBack={() => {
              setActiveVenueSlug(activeShowcaseSlug);
              setPage("venue-profile");
            }}
            onGoDestination={(countrySlug) => {
              if (countrySlug) {
                setActiveCountrySlug(countrySlug);
                setPage("italy"); // expand later per country
              } else {
                setPage("home");
              }
            }}
            onNavigateStandard={goStandard}
            onNavigateAbout={goAbout}
          />
        )}
        {/* OPTION A: Dynamic location page (country/region/city from Supabase) */}
        {page === "location" && (
          <LocationPage
            locationType={activeLocationType}
            locationSlug={activeLocationSlug}
            onBack={goHome}
            onViewVenue={goVenue}
            onViewCategory={goCategory}
            onViewRegion={goRegion}
            onViewRegionCategory={goRegionCategory}
            footerNav={footerNav}
          />
        )}
        {page === "region" && (
          <RegionPage onBack={goHome} onViewVenue={goVenue} onViewCategory={goCategory} onViewRegion={goRegion} onViewRegionCategory={goRegionCategory} onViewCountry={goCountry} countrySlug={activeCountrySlug} regionSlug={activeRegionSlug} footerNav={footerNav} />
        )}
        {page === "planner-profile" && (() => {
          const currentPlanner = getPlannerByIdOrSlug(activePlannerSlug);
          const similarPlanners = VENDORS.filter(
            (v) => v.category === "planner" && v.id !== currentPlanner?.id && v.countrySlug === activeCountrySlug
          ).slice(0, 6);
          return (
            <PlannerProfilePage
              plannerSlug={activePlannerSlug}
              getPlannerByIdOrSlug={getPlannerByIdOrSlug}
              onBack={() => goRegionCategory(activeCountrySlug, activeRegionSlug, "wedding-planners")}
              onOpenChat={() => {}}
              onSave={() => {}}
              onViewPlanner={(planner) => goPlannerProfile(activeCountrySlug, activeRegionSlug, planner)}
              similarPlanners={similarPlanners}
              countrySlug={activeCountrySlug}
              regionSlug={activeRegionSlug}
              onViewRegion={goRegion}
              onViewRegionCategory={goRegionCategory}
              footerNav={footerNav}
            />
          );
        })()}
        {page === "artistry-awards" && (
          <ArtistryPage
            onNavigateStandard={goHome}
            onNavigateAbout={goAbout}
          />
        )}
        {page === "publications" && (
          <PublicationsPage
            onRead={goPublicationsReader}
            onBack={goHome}
            footerNav={footerNav}
          />
        )}
        {page === "publications-reader" && (
          <PublicationsReaderPage
            slug={activePublicationsSlug}
            onBack={goPublications}
          />
        )}
        {page === "magazine-reader" && (
          <PublicationsReaderPage
            slug={activeMagazineIssueSlug}
            onBack={() => setPage("publication-studio")}
          />
        )}
        {page === "publications-embed" && (
          <PublicationsEmbedPage slug={activeEmbedSlug} />
        )}
        {page === "publication-studio" && (
          <PublicationStudio
            onBack={goHome}
            onReadIssue={goMagazineReader}
          />
        )}
        {page === "magazine-collaborate" && (
          <MagazineCollaboratePage
            token={activeCollaborateToken}
            onBack={() => setPage("publication-studio")}
          />
        )}
        {page === "magazine-reach" && (
          <VendorReachPage
            issueSlug={activeReachIssueSlug}
            vendorSlug={activeReachVendorSlug}
            onBack={() => setPage("publication-studio")}
          />
        )}
        {page === "studio-thumbnail" && (
          <ThumbnailRenderer templateId={studioThumbnailId} />
        )}
        {page === "magazine" && (
          <MagazineHomePage
            onNavigateArticle={goMagazineArticle}
            onNavigateCategory={goMagazineCategory}
            onNavigateFashion={goMagazineFashion}
            onEdit={goMagazineStudio}
            isLight={magazineLight}
            onToggleLight={() => setMagazineLight(l => !l)}
            footerNav={footerNav}
          />
        )}
        {page === "magazine-fashion" && (
          <FashionLandingPage
            onNavigateArticle={goMagazineArticle}
            onNavigateCategory={goMagazineCategory}
            onNavigateHome={goMagazine}
            isLight={magazineLight}
            onToggleLight={() => setMagazineLight(l => !l)}
            footerNav={footerNav}
          />
        )}
        {page === "magazine-category" && (
          <CategoryPage
            categoryId={activeMagazineCategoryId}
            onNavigateArticle={goMagazineArticle}
            onNavigateHome={goMagazine}
            onNavigateCategory={goMagazineCategory}
            onEdit={goMagazineStudio}
            isLight={magazineLight}
            onToggleLight={() => setMagazineLight(l => !l)}
            footerNav={footerNav}
          />
        )}
        {page === "magazine-preview" && (
          <MagazinePreviewPage />
        )}
        {page === "magazine-article" && (
          <MagazineArticlePage
            slug={activeMagazineSlug}
            onNavigateArticle={goMagazineArticle}
            onNavigateHome={goMagazine}
            onNavigateCategory={goMagazineCategory}
            onNavigateFashion={goMagazineFashion}
            onEdit={goMagazineStudio}
            isLight={magazineLight}
            onToggleLight={() => setMagazineLight(l => !l)}
            footerNav={footerNav}
          />
        )}
        {page === "magazine-studio" && (
          <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>}>
            <MagazineStudio
              onNavigateMagazine={goMagazine}
              onNavigateHome={goHome}
              editSlug={magazineEditSlug}
            />
          </Suspense>
        )}
        {page === "studio-edit" && (
          <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading editor...</div>}>
            <UniversalStudioRouter entityType={studioEntityType} slug={studioSlug} />
          </Suspense>
        )}
        {page === "puglia" && (
          <PugliaPage onBack={goHome} onViewVenue={goVenue} onViewCategory={goCategory} onViewRegion={goRegion} onViewStandard={goStandard} onViewAbout={goAbout} footerNav={footerNav} />
        )}
        {page === "aura-discovery" && (
          <AuraDiscoveryDemoPage onViewVenue={goVenue} />
        )}
        {page === "luxury-region-test" && (
          <LuxuryRegionPageTest countrySlug="italy" regionSlug="amalfi-coast" />
        )}
        {page === "grid-responsive-test" && (
          <GridResponsiveTest />
        )}
        {page === "amalfi-coast-v2" && (
          <RegionCategoryPage
            onBack={() => goHome()}
            onBackHome={goHome}
            onViewVenue={goVenue}
            onViewCategory={goCategory}
            onViewRegion={goRegion}
            onViewRegionCategory={goRegionCategory}
            onViewVendor={goVendor}
            onViewPlanner={goPlannerProfile}
            onViewWedding={goWedding}
            countrySlug="italy"
            regionSlug="amalfi-coast"
            isTestMode={true}
          />
        )}
        {page === "region-category" && (
          <RegionCategoryPage
            onBack={() => goRegion(activeCountrySlug, activeRegionSlug)}
            onBackHome={goHome}
            onViewVenue={goVenue}
            onViewCategory={goCategory}
            onViewRegion={goRegion}
            onViewRegionCategory={goRegionCategory}
            onViewCountry={goCountry}
            onViewPlanner={(planner) => goPlannerProfile(activeCountrySlug, activeRegionSlug, planner)}
            countrySlug={activeCountrySlug}
            regionSlug={activeRegionSlug}
            categorySlug={activeCategorySlug}
            footerNav={footerNav}
          />
        )}
        {page === "category" && (
          <ItalyPage noIndex onBack={goHome} onViewVenue={goVenue} onViewRegion={goRegion} onViewCategory={goCategory} initialRegion={categoryRegion} initialSearchQuery={categorySearchQuery} footerNav={footerNav} />
        )}
        {page === "standard" && (
          <LWDStandard onBack={goHome} onViewCategory={goCategory} onViewAbout={goAbout} onViewContact={goContact} onViewPartnership={goPartnership} footerNav={footerNav} />
        )}
        {page === "about" && (
          <AboutLWD onBack={goHome} onViewCategory={goCategory} onViewStandard={goStandard} onViewContact={goContact} onViewPartnership={goPartnership} footerNav={footerNav} />
        )}
        {page === "taigenic" && (
          <TaigenicPage onBack={goHome} footerNav={footerNav} />
        )}
        {page === "contact" && (
          <ContactLWD onBack={goHome} onViewCategory={goCategory} onViewStandard={goStandard} onViewAbout={goAbout} onViewPartnership={goPartnership} footerNav={footerNav} />
        )}
        {page === "privacy" && (
          <CmsPage pageKey="privacy" onBack={goHome} footerNav={footerNav} darkMode={darkMode} />
        )}
        {page === "terms" && (
          <CmsPage pageKey="terms" onBack={goHome} footerNav={footerNav} darkMode={darkMode} />
        )}
        {page === "cookies" && (
          <CmsPage pageKey="cookies" onBack={goHome} footerNav={footerNav} darkMode={darkMode} />
        )}
        {page === "reviews-policy" && (
          <CmsPage pageKey="reviews-policy" onBack={goHome} footerNav={footerNav} darkMode={darkMode} />
        )}
        {page === "support" && (
          <CmsPage pageKey="support" onBack={goHome} footerNav={footerNav} darkMode={darkMode} />
        )}
        {page === "unsubscribe" && (
          <UnsubscribePage />
        )}
        {page === "partnership" && (
          <LWDPartnership onBack={goHome} onViewCategory={goCategory} onViewStandard={goStandard} onViewAbout={goAbout} onViewContact={goContact} footerNav={footerNav} />
        )}
        {/* Country-specific render cases removed.
            All countries now route through page === "location" → LocationPage.
            Supabase locations table is the single source of truth. */}
        {page === "admin-login" && (
          <AdminLogin onBack={goHome} />
        )}
        {page === "admin-oauth-callback" && (
          <GoogleOAuthCallback />
        )}
        {page === "admin" && (
          <AdminRoute onBack={goHome} onNavigate={(action, data) => {
            if (action === 'magazine-studio') { goMagazineStudio(); return; }
            console.log("Admin navigation:", action, data);
          }} />
        )}
        {page === "editorial-showcase" && <EditorialShowcase />}
        {page === "vendor-login" && (
          <VendorLogin onLoginSuccess={(dest) => dest === 'portal' ? goPortal() : goVendor()} />
        )}
        {page === "vendor-signup" && (
          <VendorSignup onSignupSuccess={goVendor} />
        )}
        {page === "vendor-activate" && (
          <VendorActivate activationToken={activationToken} onActivationSuccess={goVendorLogin} />
        )}
        {page === "vendor-confirm-email" && (
          <VendorConfirmEmail />
        )}
        {page === "vendor-forgot-password" && (
          <VendorForgotPassword />
        )}
        {page === "vendor-reset-password" && (
          <VendorResetPassword />
        )}
        {page === "vendor-public" && (
          <VendorPublicPage vendorSlug={activeVendorSlug} onBack={goHome} darkMode={darkMode} onToggleDark={toggleDark} />
        )}
        {page === "vendor" && (
          <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>}>
            <VendorDashboard onBack={goHome} onVendorLogin={goVendorLogin} />
          </Suspense>
        )}
        {page === "portal" && (
          <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0b0906", display: "flex", alignItems: "center", justifyContent: "center", color: "#8a7d6a", fontSize: 13, fontFamily: "Inter,sans-serif", letterSpacing: "2px" }}>Loading your portal...</div>}>
            <ClientPortal />
          </Suspense>
        )}
        {page === "real-weddings" && (
          <RealWeddingsPage C={COLORS} NU={FONTS.normal} GD={FONTS.display} onNavigate={(type, data) => { if (type === "real-wedding-detail") goRealWeddingDetail(data.realWeddingSlug); }} />
        )}
        {page === "real-wedding-detail" && (
          <RealWeddingDetailPage C={COLORS} NU={FONTS.normal} GD={FONTS.display} realWeddingSlug={activeWeddingSlug} onNavigate={(type, data) => { if (type === "venue-directory") goVenue(); }} />
        )}
        {page === "shortlist" && (
          <ShortlistPage onBack={goHome} />
        )}
        {page === "couple-signup" && (
          <CoupleSignup onSignupSuccess={goCoupleLogin} />
        )}
        {page === "couple-login" && (
          <CoupleLogin onLoginSuccess={goGettingMarried} />
        )}
        {page === "couple-confirm-email" && (
          <CoupleConfirmEmail />
        )}
        {page === "couple-forgot-password" && (
          <CoupleForgotPassword />
        )}
        {page === "couple-reset-password" && (
          <CoupleResetPassword />
        )}
        {page === "getting-married" && (
          <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>}>
            <ProtectedCoupleRoute>
              <GettingMarriedDashboard onBack={goHome} footerNav={footerNav} />
            </ProtectedCoupleRoute>
          </Suspense>
        )}
        {page === "join" && (
          <JoinPage />
        )}
        {page === "list-your-business" && (
          <ListYourBusinessPage
            onNavigateHome={goHome}
            onNavigateStandard={goStandard}
            onNavigateAbout={goAbout}
          />
        )}
        {page === "advertise" && (
          <AdvertisePage
            onNavigateHome={goHome}
            onNavigateListYourBusiness={goListYourBusiness}
          />
        )}
        {page === "pricing" && (
          <PricingPage
            onNavigateHome={goHome}
            onNavigateListYourBusiness={goListYourBusiness}
            footerNav={footerNav}
            onToggleDark={toggleDark}
            darkMode={darkMode}
            onVendorLogin={goVendorLogin}
            onNavigateStandard={goStandard}
            onNavigateAbout={goAbout}
          />
        )}
        {page === "listings" && (
          <ListingsPage
            onBack={goHome}
            onViewVenue={goVenue}
            onNavigateHome={goHome}
            onToggleDark={toggleDark}
            darkMode={darkMode}
            onVendorLogin={goVendorLogin}
            onNavigateStandard={goStandard}
            onNavigateAbout={goAbout}
            footerNav={footerNav}
          />
        )}
        {page === "h2" && (
          <H2Page
            onBack={goHome}
            onViewVenue={goVenue}
            onNavigateHome={goHome}
            onToggleDark={toggleDark}
            darkMode={darkMode}
            onVendorLogin={goVendorLogin}
            onNavigateStandard={goStandard}
            onNavigateAbout={goAbout}
            footerNav={footerNav}
          />
        )}
        {page === "h3" && (
          <H3
            onViewVenue={goVenue}
            onViewCategory={goCategory}
            onViewRegion={goRegion}
            onViewRegionCategory={goRegionCategory}
            onViewStandard={goStandard}
            onViewAbout={goAbout}
            onViewContact={goContact}
            onViewPartnership={goPartnership}
            onViewVendor={goVendor}
            onViewAdmin={goAdmin}
            onViewUSA={goUSA}
            onViewItaly={goItaly}
            onViewCountry={goCountry}
            onViewMagazine={goMagazine}
            onViewMagazineArticle={goMagazineArticle}
            footerNav={footerNav}
          />
        )}
        {page === "partner-enquiry" && (
          <PartnerEnquiryPage footerNav={footerNav} onBack={goHome} onNavigateStandard={goStandard} onNavigateAbout={goAbout} />
        )}
        {page === "most-loved" && (
          <MostLovedPage onViewVenue={goVenue} />
        )}
        {page === "home" && (
          <HomePage onViewVenue={goVenue} onViewCategory={goCategory} onViewRegion={goRegion} onViewRegionCategory={goRegionCategory} onViewStandard={goStandard} onViewAbout={goAbout} onViewContact={goContact} onViewPartnership={goPartnership} onViewVendor={goVendor} onViewAdmin={goAdmin} onViewUSA={goUSA} onViewItaly={goItaly} onViewCountry={goCountry} onViewMagazine={goMagazine} onViewMagazineArticle={goMagazineArticle} footerNav={footerNav} />
        )}
        {page === "not-found" && (
          <NotFoundPage onNavigateHome={goHome} onNavigateCategory={goCategory} />
        )}

        {/* ── Global site footer ──
            Rendered here for ALL pages except auth/dashboard pages listed below.
            RULE: Never import or render <SiteFooter> inside a page component that
            is served through this main.jsx render tree — it will double-render. ── */}
        {!["admin","admin-login","admin-oauth-callback","vendor","vendor-login","vendor-signup","vendor-activate","vendor-confirm-email","vendor-forgot-password","vendor-reset-password","portal","getting-married","magazine-studio","couple-signup","couple-login","couple-confirm-email","couple-forgot-password","couple-reset-password","event-review","publications-reader","publications-embed","publication-studio","studio-thumbnail","magazine-reader","magazine-collaborate","magazine-reach"].includes(page) && (
          <SiteFooter onNavigateAdmin={goAdmin} />
        )}

        {/* ── Aura suppressor — keeps chat closed on all dashboard / auth pages ── */}
        <AuraSuppressor active={["admin","admin-login","admin-oauth-callback","vendor","vendor-login","vendor-signup","vendor-activate","vendor-confirm-email","vendor-forgot-password","vendor-reset-password","portal","couple-signup","couple-login","couple-confirm-email","couple-forgot-password","couple-reset-password","join","studio-thumbnail"].includes(page)} />

        {/* ── Global chat system, hidden on dashboards and auth pages ── */}
        {!["admin","admin-login","admin-oauth-callback","vendor","vendor-login","vendor-signup","vendor-activate","vendor-confirm-email","vendor-forgot-password","vendor-reset-password","portal","couple-signup","couple-login","couple-confirm-email","couple-forgot-password","couple-reset-password","join","studio-thumbnail"].includes(page) && (
          <AuraChat onNavigateHome={goHome} />
        )}

        {/* ── Global admin edit bar — visible on live pages for authenticated admins ── */}
        <GlobalAdminBar
          page={page}
          slugs={{
            showcaseSlug:  activeShowcaseSlug,
            venueSlug:     activeVenueSlug,
            magazineSlug:  activeMagazineSlug,
            eventSlug:     activeEventSlug,
            locationSlug:  activeLocationSlug,
            countrySlug:   activeCountrySlug,
            regionSlug:    activeRegionSlug,
          }}
          onOpenAdmin={goAdmin}
        />

        {/* ── Global compare strip + modal — persists across all pages ── */}
        <GlobalCompare />

        {/* ── GDPR cookie banner — hidden on thumbnail renderer ── */}
        {page !== "studio-thumbnail" && <CookieBanner />}

        {/* ── Site-wide SEO head tags — RSS discovery + verification codes ── */}
        <GlobalSeoHead />

            </ChatProvider>
          </ShortlistProvider>
        </CoupleAuthProvider>
      </VendorAuthProvider>
    </AdminAuthProvider>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HelmetProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </HelmetProvider>
  </StrictMode>
);
