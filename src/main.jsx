// ─── src/main.jsx ─────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, StrictMode } from "react";
import { createRoot }           from "react-dom/client";

import { applyThemeToDocument } from "./theme/ThemeLoader";
import { ShortlistProvider } from "./shortlist/ShortlistContext";
import { ChatProvider }      from "./chat/ChatContext";
import { VendorAuthProvider } from "./context/VendorAuthContext";
import { CoupleAuthProvider } from "./context/CoupleAuthContext";
import { AdminAuthProvider, useAdminAuth } from "./context/AdminAuthContext";
import ProtectedCoupleRoute  from "./components/ProtectedCoupleRoute";
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
import AdminLogin             from "./pages/AdminLogin.jsx";
import VendorDashboard        from "./pages/VendorDashboard.jsx";
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
import GettingMarriedDashboard from "./pages/GettingMarriedDashboard.jsx";
import JoinPage from "./pages/JoinPage.jsx";
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
    case "partnership":      return "/partnership";
    case "usa":              return "/usa";
    case "italy":            return "/italy";
    case "admin":            return "/admin";
    case "admin-login":      return "/admin/login";
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
    case "getting-married":  return "/getting-married";
    default:                 return "/";
  }
}

function pathToState(pathname) {
  const clean = pathname.replace(/^\/+|\/+$/g, "");
  if (!clean) return { page: "home" };
  const statics = {
    venue: "venue", category: "category", "the-lwd-standard": "standard",
    about: "about", contact: "contact", partnership: "partnership",
    usa: "usa", italy: "italy", admin: "admin", vendor: "vendor", couple: "couple", "real-weddings": "real-weddings", shortlist: "shortlist", "getting-married": "getting-married", join: "join",
  };
  const parts = clean.split("/");
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
  // Handle admin auth subroutes
  if (parts[0] === "admin" && parts[1] === "login" && parts.length === 2) return { page: "admin-login" };
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

// ── Admin Route Wrapper (properly calls hooks at top level) ──────────────────
function AdminRoute({ onBack }) {
  const { isAuthenticated, loading } = useAdminAuth();

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", fontFamily: "inherit" }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    window.location.href = "/admin/login";
    return null;
  }

  return <AdminDashboard onBack={onBack} />;
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
  const [activationToken, setActivationToken] = useState(initial.activationToken || null);
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
      activationToken: activationToken,
    });
    if (window.location.pathname !== path) {
      window.history.pushState(null, "", path);
    }
  }, [page, activeCountrySlug, activeRegionSlug, activeCategorySlug, activePlannerSlug, activeWeddingSlug, activationToken]);

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
  const goVendor              = () => setPage("vendor");
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
  const goPuglia      = () => { setActiveCountrySlug(null); setActiveRegionSlug(null); setActiveCategorySlug(null); setActivePlannerSlug(null); setCategoryRegion(null); setCategorySearchQuery(null); setPage("puglia"); };

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
  const goJoin = () => { setActiveCountrySlug(null); setActiveRegionSlug(null); setActiveCategorySlug(null); setActivePlannerSlug(null); setActiveWeddingSlug(null); setCategoryRegion(null); setCategorySearchQuery(null); setPage("join"); };

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
        {page === "admin-login" && (
          <AdminLogin onBack={goHome} />
        )}
        {page === "admin" && (
          <AdminRoute onBack={goHome} />
        )}
        {page === "vendor-login" && (
          <VendorLogin onLoginSuccess={goVendor} />
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
        {page === "vendor" && (
          <VendorDashboard onBack={goHome} onVendorLogin={goVendorLogin} />
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
          <ProtectedCoupleRoute>
            <GettingMarriedDashboard onBack={goHome} footerNav={footerNav} />
          </ProtectedCoupleRoute>
        )}
        {page === "join" && (
          <JoinPage />
        )}
        {page === "home" && (
          <HomePage onViewVenue={goVenue} onViewCategory={goCategory} onViewRegion={goRegion} onViewRegionCategory={goRegionCategory} onViewStandard={goStandard} onViewAbout={goAbout} onViewContact={goContact} onViewPartnership={goPartnership} onViewVendor={goVendor} onViewAdmin={goAdmin} onViewUSA={goUSA} onViewItaly={goItaly} footerNav={footerNav} />
        )}

        {/* ── Global chat system — hidden on dashboards and auth pages ── */}
        {page !== "admin" && page !== "vendor" && page !== "vendor-login" && page !== "vendor-activate" && page !== "vendor-confirm-email" && page !== "vendor-forgot-password" && page !== "vendor-reset-password" && page !== "couple-signup" && page !== "couple-login" && page !== "couple-confirm-email" && page !== "couple-forgot-password" && page !== "couple-reset-password" && page !== "join" && (
          <AuraChat onNavigateHome={goHome} />
        )}

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
    <App />
  </StrictMode>
);
