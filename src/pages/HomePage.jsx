// ─── src/pages/HomePage.jsx ──────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { useTheme } from "../theme/ThemeContext";
import { useChat } from "../chat/ChatContext";
import { FEATURED_VENUES } from "../data/featuredVenues";
import { VENDOR_CATEGORIES } from "../data/geo";
import { getPageById } from "./PageStudio/services/pageService";
import { fetchListings } from "../services/listings";

import HomeNav from "../components/nav/HomeNav";
import SlimHero from "../components/sections/SlimHero";
import FeaturedSlider from "../components/sections/FeaturedSlider";
import DestinationGrid from "../components/sections/DestinationGrid";
import VenueGrid from "../components/sections/VenueGrid";
import VendorPreview from "../components/sections/VendorPreview";
import DirectoryBrands from "../components/sections/DirectoryBrands";
import NewsletterBand from "../components/sections/NewsletterBand";
import MagazineEditorial from "../components/sections/MagazineEditorial";
import EnquiryModal from "../components/modals/EnquiryModal";
import ImmersiveSearch from "../components/search/ImmersiveSearch";
import MasterCategoryCard, { LUXURY_ICONS } from "../components/cards/MasterCategoryCard";
import "../category.css";

// ─── Font tokens ──────────────────────────────────────────────────────────────
const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

// ── Category hover images ──────────────────────────────────────────────────────

// ─── Luxury category icons ────────────────────────────────────────────────────
// MOVED to src/components/cards/MasterCategoryCard.jsx (shared master component)

// ─── Mapper: Supabase Listing → card-compatible shape ─────────────────────────
// Called after fetchListings() which already runs buildCardImgs + buildCardVideoUrl,
// so imgs[] and videoUrl are pre-built rich objects, no further media work needed.
function listingToCard(listing) {
  return {
    id:          listing.id,
    name:        listing.cardTitle || listing.name || '',
    city:        listing.city      || '',
    region:      listing.region    || '',
    country:     listing.country   || '',
    lat:         listing.lat       ?? null,
    lng:         listing.lng       ?? null,
    slug:        listing.slug      || '',
    showcaseUrl: listing.showcaseEnabled && listing.slug ? `/showcase/${listing.slug}` : null,
    // Media, pre-built by transformSupabaseListingForUI via buildCardImgs / buildCardVideoUrl
    imgs:        listing.imgs      || [],
    videoUrl:    listing.videoUrl  || null,
    // Pricing
    priceFrom:   listing.priceFrom || null,
    // Capacity
    capacity:    listing.capacityMax || listing.capacityMin || null,
    // Social proof
    rating:      listing.rating      ?? null,
    reviews:     listing.reviewCount ?? null,
    // Status flags
    verified:    listing.isVerified  ?? false,
    featured:    listing.isFeatured  ?? false,
    online:      listing.isFeatured  ?? false,
    // Editorial
    desc:        listing.cardSummary || listing.shortDescription || '',
    tag:         listing.cardBadge   || null,
    styles:      Array.isArray(listing.styles) ? listing.styles : [],
    // Classification
    cat:         listing.categorySlug || listing.listingType || '',
    type:        listing.listingType  || '',
    // Vendor-specific amenities / includes
    // amenities is stored as comma-separated TEXT in DB — split into array
    includes:    Array.isArray(listing.amenities)
                   ? listing.amenities
                   : (typeof listing.amenities === 'string' && listing.amenities.trim()
                       ? listing.amenities.split(',').map(s => s.trim()).filter(Boolean)
                       : (listing.tags || [])),
    specialties: Array.isArray(listing.tags)      ? listing.tags      : [],
    // Dates — used for sort (latest updated/published first)
    updatedAt:   listing.updatedAt   || listing.updated_at   || null,
    publishedAt: listing.publishedAt || listing.published_at || null,
    createdAt:   listing.createdAt   || listing.created_at   || null,
  };
}

// ─── Category carousel components ─────────────────────────────────────────────
const CATS_PER_PAGE = 6;

function CategoryShortcutCard({ vc, C, onClick, isEmpty = false }) {
  return (
    <MasterCategoryCard
      category={vc}
      colors={C}
      onClick={onClick}
      isEmpty={isEmpty}
    />
  );
}

function CategoryCarousel({ categories, C, onSelect, activeCategorySlugs = null, isMobile = false }) {
  const catsPerPage = isMobile ? 4 : CATS_PER_PAGE;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(categories.length / catsPerPage);
  const start = page * catsPerPage;
  const visible = categories.slice(start, start + catsPerPage);
  const [hovPrev, setHovPrev] = useState(false);
  const [hovNext, setHovNext] = useState(false);
  const arrowBtn = (dir, hov, setHov, disabled, onClick) => (
    <button aria-label={dir === "prev" ? "Previous categories" : "Next categories"} disabled={disabled} onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov && !disabled ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.06)", border: `1px solid ${disabled ? "rgba(255,255,255,0.15)" : hov ? "#C9A84C" : "rgba(255,255,255,0.25)"}`, borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.35 : 1, transition: "all 0.25s", flexShrink: 0 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={hov && !disabled ? "#C9A84C" : "rgba(255,255,255,0.7)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {dir === "prev" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 6 15 12 9 18" />}
      </svg>
    </button>
  );
  return (
    <div>
      <div className="lwd-region-cat-grid" style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(6, 200px)", gap: isMobile ? 12 : 16, justifyContent: "center" }}>
        {visible.map((vc) => (<CategoryShortcutCard key={vc.slug} vc={vc} C={C} onClick={() => onSelect(vc.slug)} isEmpty={activeCategorySlugs !== null && !activeCategorySlugs.has(vc.slug)} />))}
      </div>
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 28 }}>
          {arrowBtn("prev", hovPrev, setHovPrev, page === 0, () => setPage((p) => p - 1))}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} aria-label={`Page ${i + 1}`} onClick={() => setPage(i)}
                style={{ width: page === i ? 20 : 6, height: 6, borderRadius: 3, background: page === i ? "#C9A84C" : "rgba(255,255,255,0.25)", border: "none", cursor: "pointer", padding: 0, transition: "all 0.3s ease" }} />
            ))}
          </div>
          {arrowBtn("next", hovNext, setHovNext, page >= totalPages - 1, () => setPage((p) => p + 1))}
        </div>
      )}
    </div>
  );
}

export default function HomePage({ onViewVenue, onViewCategory, onViewRegion, onViewRegionCategory, onViewStandard, onViewAbout, onViewContact, onViewPartnership, onViewVendor, onViewAdmin, onViewUSA, onViewItaly, onViewCountry, onViewMagazine, onViewMagazineArticle, footerNav }) {
  const themeCtx = useTheme();
  const darkMode = themeCtx.darkMode;
  const C = themeCtx;
  const [enquiryVendor, setEnquiryVendor] = useState(null);
  const [heroBackgroundData, setHeroBackgroundData] = useState(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  const [hovCat, setHovCat] = useState(null);
  const [dbListings, setDbListings] = useState([]);
  const [immersiveOpen, setImmersiveOpen] = useState(false);
  const { setChatContext } = useChat();

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Set chat context on mount
  useEffect(() => {
    setChatContext?.({ page: "home" });
  }, [setChatContext]);

  // Load published homepage background media from Page Studio
  useEffect(() => {
    getPageById("page_home").then((page) => {
      if (!page) return;
      const hero = (page.sections || []).find((s) => s.id === "hero");
      if (hero?.backgroundData?.backgroundType) {
        setHeroBackgroundData(hero.backgroundData);
      }
    }).catch(() => {});
  }, []);

  // Fetch live published listings from Supabase
  // Falls back gracefully: VenueGrid uses FEATURED_VENUES, VendorPreview uses GLOBAL_VENDORS
  useEffect(() => {
    fetchListings({ status: "published" })
      .then((listings) => setDbListings(listings))
      .catch(() => {}); // silent fail, static fallbacks stay active
  }, []);

  // ── Derive live venue + vendor arrays from DB listings ──────────────────────
  // venue = listingType "venue"; everything else (photographer, planner, etc.) = vendor
  // If DB has no data yet, fall back to static curated data automatically.
  const dbCards      = dbListings.map(listingToCard);
  const dbVenueCards = dbCards.filter((c) => c.type === "venue");
  const dbVendorCards= dbCards.filter((c) => c.type !== "venue");

  // VenueGrid: prefer live DB venues, fall back to FEATURED_VENUES
  const displayVenues = dbVenueCards.length > 0 ? dbVenueCards : FEATURED_VENUES;
  // VendorPreview handles its own fallback to GLOBAL_VENDORS when dbVendors is empty/null
  const displayVendors = dbVendorCards.length > 0 ? dbVendorCards : null;

  // Set of category slugs that have ≥1 live published listing globally.
  // Drives the "Coming Soon" badge on empty category cards.
  const activeCategorySlugs = (() => {
    if (dbListings.length === 0) return null; // still loading — don't show badges yet
    const s = new Set();
    if (dbVenueCards.length > 0) s.add("wedding-venues");
    dbVendorCards.forEach((c) => { if (c.cat) s.add(c.cat); });
    return s;
  })();

  return (
      <div style={{ background: C.black, minHeight: "100vh" }}>
        <HomeNav
          darkMode={darkMode}
          onToggleDark={themeCtx.toggleDark}
          onVendorLogin={() => onViewVendor?.()}
          onNavigateStandard={onViewStandard}
          onNavigateAbout={onViewAbout}
        />

        <main>
          {/* SlimHero + FeaturedSlider remain on curated static data, editorial content */}
          <SlimHero
            venues={FEATURED_VENUES}
            backgroundData={heroBackgroundData}
            onViewRegion={onViewRegion}
            onViewRegionCategory={onViewRegionCategory}
            onViewCategory={onViewCategory}
            onOpenImmersive={() => setImmersiveOpen(true)}
          />

          {/* ── Two-Path Search Section ──────────────────────────────── */}
          <section style={{ background: darkMode ? "#0f0e0b" : "#f2f0ea", padding: "80px clamp(20px, 5vw, 64px)" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>

              {/* Section label */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ width: 28, height: 1, background: C.gold }} />
                <span style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: C.gold, fontWeight: 600 }}>Explore</span>
                <div style={{ width: 28, height: 1, background: C.gold }} />
              </div>

              {/* Section heading */}
              <h2 style={{ fontFamily: GD, fontSize: "clamp(24px, 2.8vw, 34px)", fontWeight: 400, color: C.off, lineHeight: 1.2, margin: "0 0 48px", textAlign: "center" }}>
                Begin your search
              </h2>

              {/* Two-column fork */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.15fr 0.85fr", gap: 2, borderRadius: 4, overflow: "hidden", alignItems: "stretch" }}>

                {/* LEFT — Guided / Aura (primary) */}
                <div
                  style={{
                    background:    darkMode ? "#161210" : "#1a1714",
                    padding:       isMobile ? "40px 28px" : "clamp(40px, 5vw, 64px) clamp(32px, 4vw, 56px)",
                    display:       "flex",
                    flexDirection: "column",
                    gap:           28,
                    minHeight:     isMobile ? 280 : 360,
                    position:      "relative",
                    overflow:      "hidden",
                    cursor:        "pointer",
                    transition:    "background 0.35s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s ease",
                  }}
                  onClick={() => setImmersiveOpen(true)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background  = darkMode ? "#1e1a16" : "#211e1a";
                    e.currentTarget.style.transform   = "translateY(-3px)";
                    e.currentTarget.style.boxShadow   = "0 16px 48px rgba(201,168,76,0.13)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background  = darkMode ? "#161210" : "#1a1714";
                    e.currentTarget.style.transform   = "translateY(0)";
                    e.currentTarget.style.boxShadow   = "none";
                  }}
                >
                  {/* Ambient glows — two points for depth */}
                  <div style={{ position: "absolute", top: -70, right: -50, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.09) 0%, transparent 68%)", pointerEvents: "none" }} />
                  <div style={{ position: "absolute", bottom: -90, left: -50, width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 65%)", pointerEvents: "none" }} />

                  <div>
                    {/* Eyebrow */}
                    <p style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.28em", color: "rgba(201,168,76,0.7)", textTransform: "uppercase", margin: "0 0 20px" }}>
                      ✦ Guided Search
                    </p>

                    {/* Heading — "Let Aura" slightly bolder for harmony */}
                    <h3 style={{ fontFamily: GD, fontSize: "clamp(28px, 3.5vw, 46px)", fontWeight: 500, color: "#f5f0e8", lineHeight: 1.1, margin: "0 0 18px", letterSpacing: "-0.02em" }}>
                      Let Aura<br />
                      <em style={{ fontStyle: "italic", fontWeight: 400, color: "rgba(201,168,76,0.88)" }}>guide you</em>
                    </h3>

                    {/* Description */}
                    <p style={{ fontFamily: NU, fontSize: 14, color: "rgba(245,240,232,0.62)", lineHeight: 1.7, margin: 0, maxWidth: 320, fontWeight: 300 }}>
                      Tell us what you're imagining — your style, your guests, your setting. We'll find your perfect match.
                    </p>
                  </div>

                  {/* CTA — tight cluster with text */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setImmersiveOpen(true); }}
                        style={{
                          background:    "#C9A84C",
                          border:        "none",
                          borderRadius:  2,
                          padding:       "13px 28px",
                          color:         "#0f0e0b",
                          fontFamily:    NU,
                          fontSize:      11,
                          fontWeight:    700,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          cursor:        "pointer",
                          transition:    "opacity 0.2s ease",
                          flexShrink:    0,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                      >
                        Start with Aura →
                      </button>
                      <span style={{ fontFamily: NU, fontSize: 11, color: "rgba(245,240,232,0.42)", letterSpacing: "0.04em" }}>
                        3-step guided experience
                      </span>
                    </div>
                    <p style={{ fontFamily: NU, fontSize: 10, color: "rgba(245,240,232,0.38)", letterSpacing: "0.05em", margin: 0 }}>
                      Helping couples plan luxury weddings across Europe, the UK, and beyond
                    </p>
                  </div>
                </div>

                {/* RIGHT — Browse by Category (secondary) */}
                <div style={{
                  background: darkMode ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.48)",
                  padding:    isMobile ? "36px 28px" : "clamp(40px, 5vw, 64px) clamp(32px, 4vw, 56px)",
                  display:    "flex",
                  flexDirection: "column",
                }}>
                  {/* Heading */}
                  <div style={{ marginBottom: 28 }}>
                    <p style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.28em", color: darkMode ? "rgba(201,168,76,0.5)" : "rgba(201,168,76,0.7)", textTransform: "uppercase", margin: "0 0 12px" }}>
                      Direct Browse
                    </p>
                    <h3 style={{ fontFamily: GD, fontSize: "clamp(22px, 2.5vw, 32px)", fontWeight: 400, color: C.off, lineHeight: 1.15, margin: 0, letterSpacing: "-0.015em" }}>
                      Browse by<br />
                      <em style={{ fontStyle: "italic", color: C.gold }}>category</em>
                    </h3>
                  </div>

                  {/* Category grid — uniform 3-col */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, flex: 1, alignContent: "flex-start" }}>
                    {VENDOR_CATEGORIES.slice(0, 12).map((cat) => {
                      const hov = hovCat === cat.slug;
                      return (
                        <button
                          key={cat.slug}
                          onClick={() => onViewCategory({ category: cat.slug })}
                          onMouseEnter={() => setHovCat(cat.slug)}
                          onMouseLeave={() => setHovCat(null)}
                          style={{
                            background:     hov ? (darkMode ? "rgba(201,168,76,0.08)" : "rgba(26,23,20,0.04)") : "none",
                            border:         `1px solid ${hov ? "rgba(201,168,76,0.45)" : darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
                            borderRadius:   2,
                            padding:        "0 8px",
                            height:         isMobile ? 44 : 64,
                            cursor:         "pointer",
                            display:        "flex",
                            alignItems:     "center",
                            justifyContent: "center",
                            fontFamily:     NU,
                            fontSize:       11,
                            letterSpacing:  "0.04em",
                            color:          hov ? (darkMode ? "#f5f0e8" : "#1a1714") : darkMode ? "rgba(245,240,232,0.65)" : C.off,
                            whiteSpace:     "nowrap",
                            overflow:       "hidden",
                            textOverflow:   "ellipsis",
                            transform:      hov ? "translateY(-2px)" : "translateY(0)",
                            boxShadow:      hov ? "0 4px 14px rgba(201,168,76,0.1)" : "none",
                            transition:     "border-color 0.2s ease, color 0.2s ease, background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
                          }}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Footer hint */}
                  <p style={{ fontFamily: NU, fontSize: 11, color: darkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.3)", margin: "24px 0 0", letterSpacing: "0.03em" }}>
                    Browse all categories and filter by destination
                  </p>
                </div>

              </div>
            </div>
          </section>

          <DestinationGrid
            onDestinationClick={(d) => {
              if (d.countrySlug && d.regionSlug) {
                onViewRegion?.(d.countrySlug, d.regionSlug);
              }
            }}
          />
          {/* VenueGrid: live DB data, falls back to static if DB empty */}
          <VenueGrid venues={displayVenues} onViewVenue={(v) => onViewVenue?.(v)} onViewCategory={onViewCategory} />
          <FeaturedSlider venues={FEATURED_VENUES} />
          {/* VendorPreview: live DB vendors when available; internal fallback to GLOBAL_VENDORS */}
          <VendorPreview
            dbVendors={displayVendors}
            onViewCategory={onViewCategory}
            onViewVendor={(v) => {
              if (v.cat === "venues") onViewVenue?.();
              else setEnquiryVendor(v);
            }}
          />
          <MagazineEditorial
            onViewMagazine={onViewMagazine}
            onViewMagazineArticle={onViewMagazineArticle}
          />
          <NewsletterBand />
          <DirectoryBrands onViewRegion={(countrySlug, regionSlug) => onViewRegion?.(countrySlug, regionSlug)} onViewCategory={onViewCategory} onViewUSA={onViewUSA} onViewItaly={onViewItaly} onViewCountry={onViewCountry} darkMode={darkMode} />
        </main>

        {/* Enquiry modal */}
        <EnquiryModal
          vendor={enquiryVendor}
          onClose={() => setEnquiryVendor(null)}
        />

        {/* Immersive Search overlay */}
        <ImmersiveSearch
          isOpen={immersiveOpen}
          onClose={() => setImmersiveOpen(false)}
          onViewCategory={onViewCategory}
          onViewRegionCategory={onViewRegionCategory}
        />
      </div>
  );
}
