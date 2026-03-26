// ─── src/pages/CityPage.jsx ──────────────────────────────────────────────────
// Dedicated city layout — NOT a RegionPage wrapper.
// Sections: Hero (52vh) → Breadcrumb → Venues Grid → About → Map → Also in Region → Footer
import { useState, useEffect, useMemo } from "react";
import { getDarkPalette, getLightPalette, getDefaultMode } from "../theme/tokens";
import { getCityBySlug, getCountryBySlug, getRegionBySlug, CITIES } from "../data/geo.js";
import { VENUES } from "../data/italyVenues";
import { fetchLocationContent } from "../services/locationContentService";
import GCard from "../components/cards/GCard";
import GCardMobile from "../components/cards/GCardMobile";
import MapSection from "../components/sections/MapSection";
import SiteFooter from "../components/sections/SiteFooter";
import HomeNav from "../components/nav/HomeNav";
import "../category.css";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

const DEFAULT_HERO =
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=80";

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

function CityNav({ onBack, darkMode, onToggleDark, C }) {
  const [scrolled, setScrolled] = useState(false);
  const [hovToggle, setHovToggle] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
      height: 56,
      background: scrolled
        ? (darkMode ? "rgba(10,8,6,0.92)" : "rgba(249,247,242,0.96)")
        : "transparent",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      borderBottom: scrolled ? `1px solid ${C.border}` : "none",
      transition: "background 0.3s, border-color 0.3s",
      display: "flex", alignItems: "center",
      padding: "0 20px", justifyContent: "space-between",
    }}>
      <button onClick={onBack} style={{
        background: "none", border: `1px solid ${scrolled ? C.border : "rgba(255,255,255,0.3)"}`,
        borderRadius: "var(--lwd-radius-input)",
        color: scrolled ? C.grey : "rgba(255,255,255,0.9)",
        padding: "6px 12px", cursor: "pointer",
        fontFamily: NU, fontSize: 11, letterSpacing: "0.5px",
        transition: "all 0.2s",
      }}>
        ← Back
      </button>

      <span style={{
        fontFamily: NU, fontSize: 13, letterSpacing: "0.05em",
        color: scrolled ? C.text : "rgba(255,255,255,0.9)",
        fontWeight: 400,
      }}>
        Luxury <span style={{ color: C.gold }}>Wedding</span> Directory
      </span>

      <button
        onClick={onToggleDark}
        onMouseEnter={() => setHovToggle(true)}
        onMouseLeave={() => setHovToggle(false)}
        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        style={{
          background: "none",
          border: `1px solid ${hovToggle ? C.gold : (scrolled ? C.border : "rgba(255,255,255,0.3)")}`,
          borderRadius: "var(--lwd-radius-input)",
          color: hovToggle ? C.gold : (scrolled ? C.grey : "rgba(255,255,255,0.9)"),
          width: 34, height: 34, cursor: "pointer", fontSize: 14,
          transition: "all 0.2s",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {darkMode ? "☀" : "◐"}
      </button>
    </nav>
  );
}

export default function CityPage({
  onBack            = () => {},
  onViewVenue       = () => {},
  onViewCategory    = () => {},
  onViewRegion      = () => {},
  onViewRegionCategory = () => {},
  onViewCity        = () => {},
  countrySlug       = null,
  regionSlug        = null,
  citySlug          = null,
  footerNav         = {},
}) {
  const [darkMode, setDarkMode] = useState(() => getDefaultMode() === "dark");
  const [dbContent, setDbContent] = useState(null);
  const [savedIds,  setSavedIds]  = useState([]);
  const [qvItem,    setQvItem]    = useState(null);

  const isMobile = useIsMobile();
  const C = darkMode ? getDarkPalette() : getLightPalette();

  const city    = useMemo(() => getCityBySlug(citySlug),    [citySlug]);
  const country = useMemo(() => getCountryBySlug(countrySlug), [countrySlug]);
  const region  = useMemo(() => getRegionBySlug(regionSlug),   [regionSlug]);

  // ── Fetch DB content ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!citySlug || !countrySlug || !regionSlug) return;
    fetchLocationContent(`city:${countrySlug}:${regionSlug}:${citySlug}`)
      .then(data => { if (data) setDbContent(data); })
      .catch(() => {});
  }, [citySlug, countrySlug, regionSlug]);

  // ── Content merge: DB → geo.js fallback ────────────────────────────────────
  const heroImg      = dbContent?.hero_image  || city?.heroImg || DEFAULT_HERO;
  const heroTitle    = dbContent?.hero_title  || city?.name    || citySlug || "";
  const heroSubtitle = dbContent?.hero_subtitle || null;
  const editorial    = dbContent?.metadata?.editorialPara1 || city?.introEditorial || null;

  // ── Data ────────────────────────────────────────────────────────────────────
  // Venues filtered to this city
  const cityVenues = useMemo(
    () => VENUES.filter(v => v.citySlug === citySlug),
    [citySlug]
  );

  // Other cities in the same region ("Also in Region")
  const alsoCities = useMemo(
    () => CITIES.filter(c => c.regionSlug === regionSlug && c.slug !== citySlug).slice(0, 4),
    [regionSlug, citySlug]
  );

  const toggleSave = (id) =>
    setSavedIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  // ── Scroll handler for dark mode toggle ────────────────────────────────────
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [citySlug]);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text }}>

      {/* ── Sticky Nav ───────────────────────────────────────────────────────── */}
      <HomeNav
        hasHero={true}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(d => !d)}
        onNavigateStandard={() => onBack()}
        onNavigateAbout={() => onBack()}
      />

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section style={{ position: "relative", height: "52vh", minHeight: 320, overflow: "hidden" }}>
        <img
          src={heroImg}
          alt={heroTitle}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.55) 100%)",
        }} />

        {/* Hero text */}
        <div style={{
          position: "absolute", bottom: isMobile ? 32 : 52, left: 0, right: 0,
          textAlign: "center", zIndex: 10, padding: "0 24px",
        }}>
          <p style={{
            color: "rgba(255,255,255,0.65)", fontFamily: NU, fontSize: 11,
            letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 12, margin: "0 0 12px",
          }}>
            {country?.name}{region?.name ? ` · ${region.name}` : ""}
          </p>
          <h1 style={{
            color: "#fff", fontFamily: GD, fontSize: isMobile ? 36 : 60,
            fontWeight: 400, margin: "0 0 12px", letterSpacing: "-0.02em",
            textShadow: "0 2px 20px rgba(0,0,0,0.35)",
          }}>
            Weddings in{" "}
            <span style={{ fontStyle: "italic", color: "#d1a352" }}>{heroTitle}</span>
          </h1>
          {heroSubtitle && (
            <p style={{
              color: "rgba(255,255,255,0.8)", fontFamily: NU,
              fontSize: isMobile ? 15 : 18, margin: "0 0 14px", fontStyle: "italic",
            }}>
              {heroSubtitle}
            </p>
          )}
          {cityVenues.length > 0 && (
            <p style={{
              color: "rgba(255,255,255,0.6)", fontFamily: NU,
              fontSize: 12, letterSpacing: "0.1em", margin: 0,
            }}>
              {cityVenues.length} wedding venue{cityVenues.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </section>

      {/* ── Breadcrumb ───────────────────────────────────────────────────────── */}
      <nav style={{
        borderBottom: `1px solid ${C.border}`,
        background: C.card,
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          padding: isMobile ? "11px 16px" : "11px 32px",
          display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
        }}>
          {[
            { label: "Home",            action: footerNav.onNavigateHome || (() => {}) },
            { label: country?.name || countrySlug, action: null },
            { label: region?.name  || regionSlug,  action: () => onViewRegion(countrySlug, regionSlug) },
            { label: heroTitle,         active: true },
          ].map((crumb, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {i > 0 && <span style={{ color: C.muted, fontSize: 11 }}>›</span>}
              {crumb.active ? (
                <span style={{
                  color: C.text, fontFamily: NU, fontSize: 12, fontWeight: 500,
                }}>
                  {crumb.label}
                </span>
              ) : crumb.action ? (
                <button
                  onClick={crumb.action}
                  style={{
                    background: "none", border: "none", padding: 0,
                    color: C.muted, fontFamily: NU, fontSize: 12,
                    cursor: "pointer", lineHeight: 1,
                  }}
                >
                  {crumb.label}
                </button>
              ) : (
                <span style={{ color: C.muted, fontFamily: NU, fontSize: 12 }}>{crumb.label}</span>
              )}
            </span>
          ))}
        </div>
      </nav>

      {/* ── Venues Grid ─────────────────────────────────────────────────────── */}
      {cityVenues.length > 0 ? (
        <section style={{
          maxWidth: 1200, margin: "0 auto",
          padding: isMobile ? "48px 16px" : "64px 32px",
        }}>
          <div style={{ marginBottom: 36 }}>
            <p style={{
              color: C.gold, fontFamily: NU, fontSize: 11,
              letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 8px",
            }}>
              Wedding Venues
            </p>
            <h2 style={{
              color: C.text, fontFamily: GD, fontSize: isMobile ? 28 : 36,
              fontWeight: 400, margin: 0, letterSpacing: "-0.01em",
            }}>
              Venues in {heroTitle}
            </h2>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
            gap: isMobile ? 16 : 24,
          }}>
            {cityVenues.map(v =>
              isMobile ? (
                <GCardMobile
                  key={v.id} v={v}
                  saved={savedIds.includes(v.id)}
                  onSave={toggleSave}
                  onView={onViewVenue}
                />
              ) : (
                <GCard
                  key={v.id} v={v}
                  saved={savedIds.includes(v.id)}
                  onSave={toggleSave}
                  onView={onViewVenue}
                  onQuickView={setQvItem}
                />
              )
            )}
          </div>
        </section>
      ) : (
        <section style={{
          maxWidth: 1200, margin: "0 auto",
          padding: isMobile ? "48px 16px" : "64px 32px",
          textAlign: "center",
        }}>
          <p style={{ color: C.muted, fontFamily: NU, fontSize: 15 }}>
            Venue listings for {heroTitle} coming soon.
          </p>
          <button
            onClick={() => onViewCategory({ countrySlug, regionSlug })}
            style={{
              marginTop: 20, background: C.gold, color: "#fff",
              border: "none", borderRadius: 8, padding: "12px 28px",
              fontFamily: NU, fontSize: 14, cursor: "pointer",
            }}
          >
            Browse all venues
          </button>
        </section>
      )}

      {/* ── About / Editorial ────────────────────────────────────────────────── */}
      {editorial && (
        <section style={{
          background: C.card,
          borderTop: `1px solid ${C.border}`,
          borderBottom: `1px solid ${C.border}`,
        }}>
          <div style={{
            maxWidth: 760, margin: "0 auto",
            padding: isMobile ? "52px 24px" : "88px 32px",
            textAlign: "center",
          }}>
            <p style={{
              color: C.gold, fontFamily: NU, fontSize: 11,
              letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 28px",
            }}>
              About {heroTitle}
            </p>
            <p style={{
              color: C.text, fontFamily: GD,
              fontSize: isMobile ? 22 : 28, fontWeight: 400,
              lineHeight: 1.6, margin: 0, fontStyle: "italic",
            }}>
              {editorial}
            </p>
          </div>
        </section>
      )}

      {/* ── Map ─────────────────────────────────────────────────────────────── */}
      {cityVenues.length > 0 && (
        <MapSection
          venues={cityVenues}
          mapTitle={`Venues in ${heroTitle}`}
          headerLabel="Where to celebrate"
        />
      )}

      {/* ── Also in Region ───────────────────────────────────────────────────── */}
      {alsoCities.length > 0 && (
        <section style={{
          maxWidth: 1200, margin: "0 auto",
          padding: isMobile ? "48px 16px" : "64px 32px",
        }}>
          <div style={{ marginBottom: 32 }}>
            <p style={{
              color: C.gold, fontFamily: NU, fontSize: 11,
              letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 8px",
            }}>
              Also in {region?.name}
            </p>
            <h2 style={{
              color: C.text, fontFamily: GD,
              fontSize: isMobile ? 24 : 32, fontWeight: 400, margin: 0,
            }}>
              More destinations nearby
            </h2>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
            gap: 16,
          }}>
            {alsoCities.map(c => (
              <button
                key={c.slug}
                onClick={() => onViewCity(countrySlug, regionSlug, c.slug)}
                style={{
                  background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: 12, padding: isMobile ? "18px 14px" : "24px 20px",
                  textAlign: "left", cursor: "pointer", transition: "border-color 0.2s",
                  width: "100%",
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.gold}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
              >
                <p style={{
                  color: C.text, fontFamily: GD,
                  fontSize: 18, margin: "0 0 4px", fontWeight: 400,
                }}>
                  {c.name}
                </p>
                {c.listingCount > 0 && (
                  <p style={{ color: C.muted, fontFamily: NU, fontSize: 12, margin: 0 }}>
                    {c.listingCount} venues
                  </p>
                )}
                {c.introEditorial && (
                  <p style={{
                    color: C.muted, fontFamily: NU, fontSize: 12, margin: "8px 0 0",
                    lineHeight: 1.5, overflow: "hidden",
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  }}>
                    {c.introEditorial}
                  </p>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <SiteFooter {...footerNav} />
    </div>
  );
}
