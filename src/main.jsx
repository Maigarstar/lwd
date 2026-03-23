// ─── src/main.jsx ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, StrictMode, lazy, Suspense } from "react";
import { createRoot }           from "react-dom/client";
import { HelmetProvider }       from "react-helmet-async";

import { applyThemeToDocument } from "./theme/ThemeLoader";
import { getDefaultMode } from "./theme/tokens";
import { ShortlistProvider } from "./shortlist/ShortlistContext";
import { ChatProvider }      from "./chat/ChatContext";
import { VendorAuthProvider } from "./context/VendorAuthContext";
import { CoupleAuthProvider } from "./context/CoupleAuthContext";
import { AdminAuthProvider, useAdminAuth } from "./context/AdminAuthContext";
import ProtectedCoupleRoute  from "./components/ProtectedCoupleRoute";
import AuraChat              from "./chat/AuraChat";
import CookieBanner          from "./components/CookieBanner";
import SiteFooter            from "./components/sections/SiteFooter.jsx";
import GlobalAdminBar        from "./components/admin/GlobalAdminBar.jsx";

// ── Apply saved theme CSS variables BEFORE React renders ─────────────────────
applyThemeToDocument();

// ── Initialise return-after-outbound detection (runs once, passive) ──────────
import { initReturnDetection } from "./services/userEventService";
initReturnDetection();

import HomePage from "./pages/HomePage.jsx";
import VenueProfile           from "./VenueProfile.jsx";
// CountryTemplate removed, /category now renders ItalyPage with noIndex
import RegionPage             from "./pages/RegionPage.jsx";
import RegionCategoryPage     from "./pages/RegionCategoryPage.jsx";
import LWDStandard            from "./pages/LWDStandard.jsx";
import AboutLWD               from "./pages/AboutLWD.jsx";
import ContactLWD             from "./pages/ContactLWD.jsx";
import LWDPartnership         from "./pages/LWDPartnership.jsx";
import CmsPage                from "./pages/CmsPage.jsx";
import USAPage                from "./pages/USAPage.jsx";
import ItalyPage              from "./pages/ItalyPage.jsx";
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
import ArtistryPage from "./pages/Artistry/ArtistryPage.jsx";
import MagazineHomePage     from "./pages/Magazine/MagazineHomePage.jsx";
import CategoryPage          from "./pages/Magazine/CategoryPage.jsx";
import MagazineArticlePage  from "./pages/Magazine/MagazineArticlePage.jsx";
import FashionLandingPage   from "./pages/Magazine/FashionLandingPage.jsx";
const MagazineStudio         = lazy(() => import("./pages/MagazineStudio/index.jsx"));
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
  const { countrySlug, regionSlug, categorySlug, plannerSlug, weddingSlug, activationToken } = opts;
  switch (pg) {
    case "puglia":           return "/italy/puglia";
    case "region":           return `/${countrySlug}/${regionSlug}`;
    case "region-category":  return `/${countrySlug}/${regionSlug}/${categorySlug}`;
    case "planner-profile":  return `/${countrySlug}/${regionSlug}/wedding-planners/${plannerSlug}`;
    case "real-wedding-detail": return `/real-weddings/${weddingSlug}`;
    case "real-weddings":    return "/real-weddings";
    case "category":         return "/category";
    case "venue":            return "/venue";
    case "standard":         return "/the-lwd-standard";
    case "about":            return "/about";
    case "contact":          return "/contact";
    case "privacy":          return "/privacy";
    case "terms":            return "/terms";
    case "cookies":          return "/cookies";
    case "reviews-policy":   return "/reviews-policy";
    case "support":          return "/support";
    case "unsubscribe":      return "/unsubscribe";
    case "partnership":      return "/partnership";
    case "usa":              return "/usa";
    case "italy":            return "/italy";
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
    case "join":             return "/join";
    case "partner-enquiry":  return "/partner-enquiry";
    case "getting-married":  return "/getting-married";
    case "shortlist":        return "/shortlist";
    case "artistry-awards":  return "/artistry-awards";
    case "magazine":         return "/magazine";
    case "magazine-category": return `/magazine/category/${opts.magazineCategoryId || ''}`;
    case "magazine-fashion": return "/magazine/fashion";
    case "magazine-article": return `/magazine/${opts.magazineSlug || ''}`;
    case "magazine-studio":  return "/magazine-studio";
    case "vendor-public":    return `/vendor/${opts.vendorSlug || ''}`;
    case "venue-profile":    return `/venues/${opts.venueSlug || 'grand-tirolia'}`;
    case "venue-reviews":    return `/venues/${opts.venueSlug || ''}/reviews`;
    case "event-detail":     return `/events/${opts.eventSlug || ''}`;
    case "event-review":     return "/review";
    case "listing-profile":  return `/wedding-venues/${opts.venueSlug || ''}`;
    case "dde-showcase":      return "/showcase/domaine-des-etangs";
    case "ritz-showcase":     return "/showcase/the-ritz-london";
    case "ic-park-lane-showcase": return "/showcase/intercontinental-london-park-lane";
    case "gt-showcase":       return "/showcase/grand-tirolia-kitzbuehel";
    case "sskrabey-showcase": return "/showcase/six-senses-krabey-island";
    case "showcase":         return `/showcase/${opts.showcaseSlug || ''}`;
    case "aura-discovery":   return "/discovery/aura";
    default:                 return "/";
  }
}

function pathToState(pathname) {
  const clean = pathname.replace(/^\/+|\/+$/g, "");
  if (!clean) return { page: "home" };
  const statics = {
    venue: "venue", category: "category", "the-lwd-standard": "standard",
    about: "about", contact: "contact", partnership: "partnership",
    privacy: "privacy", terms: "terms", cookies: "cookies", "reviews-policy": "reviews-policy", support: "support",
    usa: "usa", italy: "italy", admin: "admin", vendor: "vendor", couple: "couple", "real-weddings": "real-weddings", shortlist: "shortlist", "getting-married": "getting-married", join: "join", "artistry-awards": "artistry-awards", "partner-enquiry": "partner-enquiry",
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
  // Venue listing profile: /venues/{slug}
  // Venue reviews page: /venues/{slug}/reviews
  if (parts[0] === "venues" && parts.length === 3 && parts[2] === "reviews") return { page: "venue-reviews", venueSlug: parts[1] };
  if (parts[0] === "venues" && parts.length === 2) return { page: "venue-profile", venueSlug: parts[1] };
  // Event detail: /events/{slug}
  if (parts[0] === "events" && parts.length === 2) return { page: "event-detail", eventSlug: parts[1] };
  // Event attendee review: /review?token=UUID
  if (parts[0] === "review" && parts.length === 1) return { page: "event-review" };
  // Wedding venue listing profile: /wedding-venues/{slug}
  if (parts[0] === "wedding-venues" && parts.length === 2) return { page: "listing-profile", venueSlug: parts[1] };
  if (parts[0] === "magazine-studio" && parts.length === 1) return { page: "magazine-studio" };
  if (parts[0] === "magazine" && parts.length === 1) return { page: "magazine" };
  if (parts[0] === "magazine" && parts[1] === "category" && parts.length === 3) return { page: "magazine-category", magazineCategoryId: parts[2] };
  if (parts[0] === "magazine" && parts[1] === "fashion" && parts.length === 2) return { page: "magazine-fashion" };
  if (parts[0] === "magazine" && parts.length === 2 && parts[1] !== "category" && parts[1] !== "fashion") return { page: "magazine-article", magazineSlug: parts[1] };
  // Static routes only match single-segment paths; multi-segment paths
  // like /italy/tuscany or /italy/tuscany/wedding-planners are dynamic.
  if (parts.length === 1 && statics[parts[0]]) return { page: statics[parts[0]] };
  if (parts.length === 2) return { page: "region", countrySlug: parts[0], regionSlug: parts[1] };
  if (parts.length === 3) return { page: "region-category", countrySlug: parts[0], regionSlug: parts[1], categorySlug: parts[2] };
  if (parts.length === 4) return { page: "planner-profile", countrySlug: parts[0], regionSlug: parts[1], categorySlug: parts[2], plannerSlug: parts[3] };
  return { page: "not-found" };
}

// ── Admin Route Wrapper (properly calls hooks at top level) ──────────────────
function AdminRoute({ onBack, onNavigate }) {
  const { isAuthenticated, loading } = useAdminAuth();

  // ⚠️ DEV MODE: Bypass authentication for faster testing
  const DEV_SKIP_AUTH = true;

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", fontFamily: "inherit" }}>Loading...</div>;
  }

  if (!isAuthenticated && !DEV_SKIP_AUTH) {
    window.location.href = "/admin/login";
    return null;
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

  const [darkMode, setDarkMode] = useState(() => getDefaultMode() === 'dark');
  const toggleDark = () => setDarkMode(d => !d);

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
  const [activeVenueSlug, setActiveVenueSlug] = useState(initial.venueSlug || null);
  const [activeVendorSlug, setActiveVendorSlug] = useState(initial.vendorSlug || null);
  const [activeShowcaseSlug, setActiveShowcaseSlug] = useState(initial.showcaseSlug || null);
  const [activeEventSlug, setActiveEventSlug] = useState(initial.eventSlug || null);
  const [magazineLight, setMagazineLight] = useState(true);

  // Ref: skip pushState when change came from popstate (back/forward)
  const skipPush = useRef(false);

  // Scroll to top whenever the page changes
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [page]);

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
      venueSlug: activeVenueSlug,
      vendorSlug: activeVendorSlug,
      showcaseSlug: activeShowcaseSlug,
      eventSlug: activeEventSlug,
    });
    if (window.location.pathname !== path) {
      window.history.pushState(null, "", path);
    }
  }, [page, activeCountrySlug, activeRegionSlug, activeCategorySlug, activePlannerSlug, activeWeddingSlug, activationToken, activeMagazineCategoryId, activeMagazineSlug, activeVenueSlug, activeVendorSlug, activeShowcaseSlug, activeEventSlug]);

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
      setActiveVenueSlug(s.venueSlug || null);
      setActiveVendorSlug(s.vendorSlug || null);
      setActiveShowcaseSlug(s.showcaseSlug || null);
      setActiveEventSlug(s.eventSlug || null);
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
    setCategoryRegion(null); setActiveCountrySlug(null); setActiveRegionSlug(null);
    setActiveCategorySlug(null); setCategorySearchQuery(null);
    const slug = typeof venueOrSlug === 'string' ? venueOrSlug : venueOrSlug?.slug;
    if (slug) {
      setActiveVenueSlug(slug);
      setPage("venue-profile");
    } else {
      setPage("venue");
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
  const goMagazine = () => { setActiveMagazineCategoryId(null); setActiveMagazineSlug(null); setPage("magazine"); };
  const goMagazineCategory = (categoryId) => { setActiveMagazineCategoryId(categoryId); setActiveMagazineSlug(null); setPage("magazine-category"); };
  const goMagazineArticle = (slug) => { setActiveMagazineSlug(slug); setActiveMagazineCategoryId(null); setPage("magazine-article"); };
  const goMagazineFashion = () => { setActiveMagazineSlug(null); setActiveMagazineCategoryId(null); setPage("magazine-fashion"); };
  const goMagazineStudio  = () => setPage("magazine-studio");

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
  };

  return (
    <AdminAuthProvider>
      <VendorAuthProvider>
        <CoupleAuthProvider>
          <ShortlistProvider>
            <ChatProvider>

        {/* ── Pages ── */}
        {page === "venue" && (
          <VenueProfile onBack={goHome} />
        )}
        {page === "venue-profile" && (
          <VenueProfile slug={activeVenueSlug} onBack={goHome} />
        )}
        {page === "listing-profile" && (
          <VenueProfile slug={activeVenueSlug} onBack={goHome} />
        )}
        {page === "venue-reviews" && (
          <VenueReviewsPage />
        )}
        {page === "event-detail" && (
          <EventDetailPage slug={activeEventSlug} onBack={goHome} footerNav={footerNav} />
        )}
        {page === "event-review" && (
          <EventReviewPage />
        )}
        {page === "dde-showcase" && (
          <DdeShowcasePage
            onBack={goHome}
            onGoDestination={(countrySlug) => {
              if (countrySlug) { setActiveCountrySlug(countrySlug); setPage("italy"); }
              else { setPage("home"); }
            }}
            onNavigateStandard={goStandard}
            onNavigateAbout={goAbout}
            darkMode={darkMode}
            onToggleDark={toggleDark}
          />
        )}
        {page === "gt-showcase" && (
          <VenueProfilePage
            onBack={goHome}
          />
        )}
        {page === "sskrabey-showcase" && (
          <SixSensesShowcasePage
            onBack={goHome}
            onGoDestination={(countrySlug) => {
              if (countrySlug) { setActiveCountrySlug(countrySlug); setPage("italy"); }
              else { setPage("home"); }
            }}
            onNavigateStandard={goStandard}
            onNavigateAbout={goAbout}
            darkMode={darkMode}
            onToggleDark={toggleDark}
          />
        )}
        {page === "ritz-showcase" && (
          <RitzLondonShowcasePage
            onBack={goHome}
            onGoDestination={(countrySlug) => {
              if (countrySlug) { setActiveCountrySlug(countrySlug); setPage("italy"); }
              else { setPage("home"); }
            }}
            onNavigateStandard={goStandard}
            onNavigateAbout={goAbout}
            darkMode={darkMode}
            onToggleDark={toggleDark}
          />
        )}
        {page === "ic-park-lane-showcase" && (
          <InterContinentalParkLanePage
            onBack={goHome}
            onGoDestination={(countrySlug) => {
              if (countrySlug) { setActiveCountrySlug(countrySlug); setPage("uk"); }
              else { setPage("home"); }
            }}
            onNavigateStandard={goStandard}
            onNavigateAbout={goAbout}
            darkMode={darkMode}
            onToggleDark={toggleDark}
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
        {page === "region" && (
          <RegionPage onBack={goHome} onViewVenue={goVenue} onViewCategory={goCategory} onViewRegion={goRegion} onViewRegionCategory={goRegionCategory} countrySlug={activeCountrySlug} regionSlug={activeRegionSlug} footerNav={footerNav} />
        )}
        {page === "region-category" && activeCategorySlug === "wedding-planners" && (
          <WeddingPlannersPage
            onBack={() => goRegion(activeCountrySlug, activeRegionSlug)}
            onBackHome={goHome}
            onViewCategory={goCategory}
            onViewRegion={goRegion}
            onViewRegionCategory={goRegionCategory}
            onViewPlanner={(planner) => goPlannerProfile(activeCountrySlug, activeRegionSlug, planner)}
            countrySlug={activeCountrySlug}
            regionSlug={activeRegionSlug}
            categorySlug={activeCategorySlug}
            footerNav={footerNav}
          />
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
          <ArtistryPage />
        )}
        {page === "magazine" && (
          <MagazineHomePage
            onNavigateArticle={goMagazineArticle}
            onNavigateCategory={goMagazineCategory}
            onNavigateFashion={goMagazineFashion}
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
            isLight={magazineLight}
            onToggleLight={() => setMagazineLight(l => !l)}
            footerNav={footerNav}
          />
        )}
        {page === "magazine-article" && (
          <MagazineArticlePage
            slug={activeMagazineSlug}
            onNavigateArticle={goMagazineArticle}
            onNavigateHome={goMagazine}
            onNavigateCategory={goMagazineCategory}
            onNavigateFashion={goMagazineFashion}
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
            />
          </Suspense>
        )}
        {page === "puglia" && (
          <PugliaPage onBack={goHome} onViewVenue={goVenue} onViewCategory={goCategory} onViewRegion={goRegion} onViewStandard={goStandard} onViewAbout={goAbout} footerNav={footerNav} />
        )}
        {page === "aura-discovery" && (
          <AuraDiscoveryDemoPage onViewVenue={goVenue} />
        )}
        {page === "region-category" && activeCategorySlug !== "wedding-planners" && (
          <RegionCategoryPage
            onBack={() => goRegion(activeCountrySlug, activeRegionSlug)}
            onBackHome={goHome}
            onViewVenue={goVenue}
            onViewCategory={goCategory}
            onViewRegion={goRegion}
            onViewRegionCategory={goRegionCategory}
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
        {page === "italy" && (
          <ItalyPage onBack={goHome} onViewVenue={goVenue} onViewRegion={goRegion} onViewCategory={goCategory} initialRegion={categoryRegion} initialSearchQuery={categorySearchQuery} footerNav={footerNav} />
        )}
        {page === "usa" && (
          <USAPage onBack={goHome} onViewRegion={goRegion} onViewCategory={goCategory} onViewStandard={goStandard} onViewAbout={goAbout} footerNav={footerNav} />
        )}
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
        {page === "partner-enquiry" && (
          <PartnerEnquiryPage footerNav={footerNav} onBack={goHome} onNavigateStandard={goStandard} onNavigateAbout={goAbout} />
        )}
        {page === "home" && (
          <HomePage onViewVenue={goVenue} onViewCategory={goCategory} onViewRegion={goRegion} onViewRegionCategory={goRegionCategory} onViewStandard={goStandard} onViewAbout={goAbout} onViewContact={goContact} onViewPartnership={goPartnership} onViewVendor={goVendor} onViewAdmin={goAdmin} onViewUSA={goUSA} onViewItaly={goItaly} onViewMagazine={goMagazine} onViewMagazineArticle={goMagazineArticle} footerNav={footerNav} />
        )}
        {page === "not-found" && (
          <NotFoundPage onNavigateHome={goHome} onNavigateCategory={goCategory} />
        )}

        {/* ── Global site footer ── */}
        {!["admin","admin-login","admin-oauth-callback","vendor","vendor-login","vendor-signup","vendor-activate","vendor-confirm-email","vendor-forgot-password","vendor-reset-password","portal","getting-married","magazine-studio","couple-signup","couple-login","couple-confirm-email","couple-forgot-password","couple-reset-password","event-review"].includes(page) && (
          <SiteFooter onNavigateAdmin={goAdmin} />
        )}

        {/* ── Global chat system, hidden on dashboards and auth pages ── */}
        {page !== "admin" && page !== "vendor" && page !== "vendor-login" && page !== "vendor-activate" && page !== "vendor-confirm-email" && page !== "vendor-forgot-password" && page !== "vendor-reset-password" && page !== "couple-signup" && page !== "couple-login" && page !== "couple-confirm-email" && page !== "couple-forgot-password" && page !== "couple-reset-password" && page !== "join" && (
          <AuraChat onNavigateHome={goHome} />
        )}

        {/* ── Global admin edit bar — visible on live pages for authenticated admins ── */}
        <GlobalAdminBar
          page={page}
          slugs={{
            showcaseSlug: activeShowcaseSlug,
            venueSlug:    activeVenueSlug,
            magazineSlug: activeMagazineSlug,
            eventSlug:    activeEventSlug,
          }}
          onOpenAdmin={goAdmin}
        />

        {/* ── GDPR cookie banner ── */}
        <CookieBanner />

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
      <App />
    </HelmetProvider>
  </StrictMode>
);
