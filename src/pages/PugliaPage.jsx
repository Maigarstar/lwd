// ════════════════════════════════════════════════════════════════════════════════
// PugliaPage.jsx - Premium Region Page (Phase 3.1)
// Demonstrates the admin → frontend region page configuration system
// Reads config from regionPageConfig service and renders premium sections
// ════════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo, useCallback } from "react";
import { getLightPalette, getDarkPalette, getDefaultMode } from "../theme/tokens";
import { getRegionPageConfig } from "../services/regionPageConfig";
import { VENUES } from "../data/italyVenues";
import { getRealWeddingsByLocation } from "../services/realWeddingService";

import SiteFooter from "../components/sections/SiteFooter";
import RegionHero from "../components/sections/RegionHero";
import RegionFeatured from "../components/sections/RegionFeatured";
import RegionRealWeddings from "../components/sections/RegionRealWeddings";
import RegionSignatureVibes from "../components/sections/RegionSignatureVibes";

// ── Font tokens ──────────────────────────────────────────────────────────────
const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

export default function PugliaPage({
  onBack = () => {},
  onViewVenue = () => {},
  onViewCategory = () => {},
  onViewRegion = () => {},
  onViewStandard = () => {},
  onViewAbout = () => {},
  footerNav = {},
}) {
  // ── State ────────────────────────────────────────────────────────────────
  const [darkMode, setDarkMode] = useState(() => getDefaultMode() === "dark");
  const [loaded, setLoaded] = useState(false);

  const C = darkMode ? getDarkPalette() : getLightPalette();

  // ── Load Puglia page configuration ────────────────────────────────────────
  // This reads from regionPageConfig service (connected to admin dashboard)
  const pageConfig = useMemo(() => {
    return getRegionPageConfig("puglia");
  }, []);

  // ── Region metadata ──────────────────────────────────────────────────────
  const region = useMemo(
    () => ({
      id: "puglia",
      slug: "puglia",
      name: "Puglia",
      country: "italy",
      countrySlug: "italy",
    }),
    []
  );

  // ── Filter venues for Puglia (region === "puglia") ──────────────────────
  const pugliaVenues = useMemo(() => {
    return VENUES.filter((v) => v.region?.toLowerCase() === "puglia");
  }, []);

  // ── Load real weddings for Puglia ────────────────────────────────────────
  const realWeddings = useMemo(() => {
    return getRealWeddingsByLocation("Puglia") || [];
  }, []);

  // ── Set loaded state ─────────────────────────────────────────────────────
  useEffect(() => {
    setLoaded(true);
  }, []);

  if (!pageConfig || !region) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", color: C.grey }}>
        <p>Unable to load Puglia page configuration</p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: C.bg,
        color: C.white,
        minHeight: "100vh",
        transition: "background-color 0.3s ease",
      }}
    >
      {/* ── Premium Hero Section (reads from config) ── */}
      {pageConfig.hero && (
        <RegionHero config={pageConfig.hero} region={region} C={C} />
      )}

      {/* ── Signature Vibes Section (regional character) ── */}
      {pageConfig.vibes && pageConfig.vibes.enabled && (
        <RegionSignatureVibes vibes={pageConfig.vibes.vibes} C={C} />
      )}

      {/* ── Featured Venues Carousel ── */}
      {pageConfig.featured && pageConfig.featured.enabled && pugliaVenues.length > 0 && (
        <RegionFeatured
          title={pageConfig.featured.title || "Featured Puglia Venues"}
          venues={pugliaVenues.slice(0, pageConfig.featured.count || 6)}
          displayType={pageConfig.featured.displayType || "carousel"}
          onViewVenue={(venue) => onViewVenue(venue.id)}
          C={C}
        />
      )}

      {/* ── Real Weddings Gallery ── */}
      {pageConfig.realWeddings && pageConfig.realWeddings.enabled && (
        <RegionRealWeddings
          title={pageConfig.realWeddings.title || "Real Puglia Weddings"}
          location="Puglia"
          onNavigate={(type, data) => {
            if (type === "venue-directory") onViewVenue();
          }}
          C={C}
        />
      )}

      {/* ── About Section ── */}
      {pageConfig.about && pageConfig.about.content && (
        <section
          style={{
            padding: "100px 60px",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <h2
            style={{
              fontFamily: GD,
              fontSize: "48px",
              fontWeight: 400,
              margin: "0 0 32px 0",
              color: C.gold,
              textAlign: "center",
            }}
          >
            {pageConfig.about.title || "About Puglia"}
          </h2>
          <p
            style={{
              fontFamily: NU,
              fontSize: "16px",
              fontWeight: 300,
              lineHeight: 1.8,
              color: C.grey,
              maxWidth: "800px",
              margin: "0 auto",
              textAlign: "center",
            }}
          >
            {pageConfig.about.content}
          </p>
        </section>
      )}

      {/* ── Footer ── */}
      <SiteFooter
        onViewCategory={onViewCategory}
        onViewVenue={onViewVenue}
        onViewRegion={onViewRegion}
        onViewStandard={onViewStandard}
        onViewAbout={onViewAbout}
        footerNav={footerNav}
      />

      {/* ── Theme toggle (hidden in production, shown for demo) ── */}
      {loaded && (
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            background: C.card,
            border: `1px solid ${C.border}`,
            color: C.gold,
            fontSize: "20px",
            cursor: "pointer",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s ease",
          }}
          title="Toggle dark/light mode"
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
      )}
    </div>
  );
}
