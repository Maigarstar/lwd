// ─── src/main.jsx ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, StrictMode } from "react";
import { createRoot }           from "react-dom/client";

import { applyThemeToDocument } from "./theme/ThemeLoader";
import { ShortlistProvider } from "./shortlist/ShortlistContext";
import { ChatProvider }      from "./chat/ChatContext";
import AuraChat              from "./chat/AuraChat";
import CookieBanner          from "./components/CookieBanner";

// ── Apply saved theme CSS variables BEFORE React renders ─────────────────────
applyThemeToDocument();

import HomePage from "./pages/HomePage.jsx";
import VenueProfile           from "./VenueProfile.jsx";
// CountryTemplate removed — /category now renders ItalyPage with noIndex
import RegionPage             from "./pages/RegionPage.jsx";
import RegionCategoryPage     from "./pages/RegionCategoryPage.jsx";
import LWDStandard            from "./pages/LWDStandard.jsx";
import AboutLWD               from "./pages/AboutLWD.jsx";
import ContactLWD             from "./pages/ContactLWD.jsx";
import LWDPartnership         from "./pages/LWDPartnership.jsx";
import USAPage                from "./pages/USAPage.jsx";
import ItalyPage              from "./pages/ItalyPage.jsx";
import AdminDashboard         from "./pages/AdminDashboard.jsx";
import VendorDashboard        from "./pages/VendorDashboard.jsx";
import WeddingPlannersPage    from "./pages/WeddingPlannersPage.jsx";
import PlannerProfilePage     from "./pages/PlannerProfilePage.jsx";
import PugliaPage             from "./pages/PugliaPage.jsx";
import ShortlistPage          from "./pages/ShortlistPage.jsx";
import RealWeddingsPage       from "./pages/RealWeddingsPage.jsx";
import RealWeddingDetailPage  from "./pages/RealWeddingDetailPage.jsx";
import { VENDORS }            from "./data/vendors.js";

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
  const { countrySlug, regionSlug, categorySlug, plannerSlug, weddingSlug } = opts;
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
    case "partnership":      return "/partnership";
    case "usa":              return "/usa";
    case "italy":            return "/italy";
    case "admin":            return "/admin";
    case "vendor":           return "/vendor";
    default:                 return "/";
  }
}

function pathToState(pathname) {
  const clean = pathname.replace(/^\/+|\/+$/g, "");
  if (!clean) return { page: "home" };
  const statics = {
    venue: "venue", category: "category", "the-lwd-standard": "standard",
    about: "about", contact: "contact", partnership: "partnership",
    usa: "usa", italy: "italy", admin: "admin", vendor: "vendor", "real-weddings": "real-weddings", shortlist: "shortlist",
  };
  const parts = clean.split("/");
  // Handle real-weddings special routes
  if (parts[0] === "real-weddings" && parts.length === 1) return { page: "real-weddings" };
  if (parts[0] === "real-weddings" && parts.length === 2) return { page: "real-wedding-detail", weddingSlug: parts[1] };
  // Handle Puglia premium page (Phase 3.1 demo)
  if (parts[0] === "italy" && parts[1] === "puglia" && parts.length === 2) return { page: "puglia" };
  // Static routes only match single-segment paths; multi-segment paths
  // like /italy/tuscany or /italy/tuscany/wedding-planners are dynamic.
  if (parts.length === 1 && statics[parts[0]]) return { page: statics[parts[0]] };
  if (parts.length === 2) return { page: "region", countrySlug: parts[0], regionSlug: parts[1] };
  if (parts.length === 3) return { page: "region-category", countrySlug: parts[0], regionSlug: parts[1], categorySlug: parts[2] };
  if (parts.length === 4) return { page: "planner-profile", countrySlug: parts[0], regionSlug: parts[1], categorySlug: parts[2], plannerSlug: parts[3] };
  return { page: "home" };
}

// ── App (router + providers in one place) ────────────────────────────────────
function App() {
  // Parse initial URL so direct links & refreshes work
  const initial = pathToState(window.location.pathname);

  const [page, setPage] = useState(initial.page);
  const [categoryRegion, setCategoryRegion] = useState(null);
  const [activeCountrySlug, setActiveCountrySlug] = useState(initial.countrySlug || null);
  const [activeRegionSlug, setActiveRegionSlug] = useState(initial.regionSlug || null);
  const [activeCategorySlug, setActiveCategorySlug] = useState(initial.categorySlug || null);
  const [activePlannerSlug, setActivePlannerSlug] = useState(initial.plannerSlug || null);
  const [activeWeddingSlug, setActiveWeddingSlug] = useState(initial.weddingSlug || null);
  const [categorySearchQuery, setCategorySearchQuery] = useState(null);

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
    });
    if (window.location.pathname !== path) {
      window.history.pushState(null, "", path);
    }
  }, [page, activeCountrySlug, activeRegionSlug, activeCategorySlug, activePlannerSlug, activeWeddingSlug]);

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
  const goVenue = () => {
    setCategoryRegion(null); setActiveCountrySlug(null); setActiveRegionSlug(null);
    setActiveCategorySlug(null); setCategorySearchQuery(null);
    setPage("venue");
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
  const goUSA         = () => { setActiveCountrySlug(null); setActiveRegionSlug(null); setActiveCategorySlug(null); setCategoryRegion(null); setCategorySearchQuery(null); setPage("usa"); };
  const goItaly       = () => { setActiveCountrySlug(null); setActiveRegionSlug(null); setActiveCategorySlug(null); setCategoryRegion(null); setCategorySearchQuery(null); setPage("italy"); };
  const goAdmin       = () => setPage("admin");
  const goVendor      = () => setPage("vendor");
  const goPuglia      = () => { setActiveCountrySlug(null); setActiveRegionSlug(null); setActiveCategorySlug(null); setActivePlannerSlug(null); setCategoryRegion(null); setCategorySearchQuery(null); setPage("puglia"); };
  const goRealWeddings = () => { setActiveCountrySlug(null); setActiveRegionSlug(null); setActiveCategorySlug(null); setActivePlannerSlug(null); setActiveWeddingSlug(null); setCategoryRegion(null); setCategorySearchQuery(null); setPage("real-weddings"); };
  const goRealWeddingDetail = (weddingSlug) => { setActiveWeddingSlug(weddingSlug); setPage("real-wedding-detail"); };
  const goShortlist = () => { setActiveCountrySlug(null); setActiveRegionSlug(null); setActiveCategorySlug(null); setActivePlannerSlug(null); setActiveWeddingSlug(null); setCategoryRegion(null); setCategorySearchQuery(null); setPage("shortlist"); };

  // ── Centralized footer navigation (passed to every page for SiteFooter) ───
  const footerNav = {
    onNavigateHome: goHome,
    onNavigateContact: goContact,
    onNavigatePartnership: goPartnership,
    onNavigateAdmin: goAdmin,
    onNavigateAbout: goAbout,
    onNavigateStandard: goStandard,
    onViewCategory: goCategory,
  };

  return (
    <ShortlistProvider>
      <ChatProvider>

        {/* ── Pages ── */}
        {page === "venue" && (
          <VenueProfile onBack={goHome} />
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
        {page === "puglia" && (
          <PugliaPage onBack={goHome} onViewVenue={goVenue} onViewCategory={goCategory} onViewRegion={goRegion} onViewStandard={goStandard} onViewAbout={goAbout} footerNav={footerNav} />
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
        {page === "partnership" && (
          <LWDPartnership onBack={goHome} onViewCategory={goCategory} onViewStandard={goStandard} onViewAbout={goAbout} onViewContact={goContact} footerNav={footerNav} />
        )}
        {page === "italy" && (
          <ItalyPage onBack={goHome} onViewVenue={goVenue} onViewRegion={goRegion} onViewCategory={goCategory} initialRegion={categoryRegion} initialSearchQuery={categorySearchQuery} footerNav={footerNav} />
        )}
        {page === "usa" && (
          <USAPage onBack={goHome} onViewRegion={goRegion} onViewCategory={goCategory} onViewStandard={goStandard} onViewAbout={goAbout} footerNav={footerNav} />
        )}
        {page === "admin" && (
          <AdminDashboard onBack={goHome} />
        )}
        {page === "vendor" && (
          <VendorDashboard onBack={goHome} />
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
        {page === "home" && (
          <HomePage onViewVenue={goVenue} onViewCategory={goCategory} onViewRegion={goRegion} onViewRegionCategory={goRegionCategory} onViewStandard={goStandard} onViewAbout={goAbout} onViewContact={goContact} onViewPartnership={goPartnership} onViewVendor={goVendor} onViewAdmin={goAdmin} onViewUSA={goUSA} onViewItaly={goItaly} footerNav={footerNav} />
        )}

        {/* ── Global chat system — hidden on dashboards (they have built-in chat) ── */}
        {page !== "admin" && page !== "vendor" && (
          <AuraChat onNavigateHome={goHome} />
        )}

        {/* ── GDPR cookie banner ── */}
        <CookieBanner />

      </ChatProvider>
    </ShortlistProvider>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
