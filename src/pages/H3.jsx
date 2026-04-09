// ─── src/pages/H3.jsx ───────────────────────────────────────────────────────
// Homepage V3 — experimental layout. Isolated from live HomePage.
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

export default function H3({ onViewVenue, onViewCategory, onViewRegion, onViewRegionCategory, onViewStandard, onViewAbout, onViewContact, onViewPartnership, onViewVendor, onViewAdmin, onViewUSA, onViewItaly, onViewCountry, onViewMagazine, onViewMagazineArticle, footerNav }) {
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
          {/* ═══ 1. HERO ═══════════════════════════════════════════════════════ */}
          <SlimHero
            venues={FEATURED_VENUES}
            backgroundData={heroBackgroundData}
            onViewRegion={onViewRegion}
            onViewRegionCategory={onViewRegionCategory}
            onViewCategory={onViewCategory}
            onOpenImmersive={() => setImmersiveOpen(true)}
          />

          {/* ═══ 2. AURA — Signature feature, the brain of the platform ═════════ */}
          <section
            style={{
              background: "#000000",
              padding: isMobile ? "120px 24px" : "200px clamp(40px, 6vw, 80px)",
              position: "relative",
              overflow: "hidden",
              cursor: "pointer",
            }}
            onClick={() => setImmersiveOpen(true)}
          >
            {/* Layered ambient glows — creates depth field */}
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 55%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: -120, right: -100, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 60%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -140, left: -80, width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 55%)", pointerEvents: "none" }} />

            {/* Watermark */}
            <span aria-hidden="true" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontFamily: GD, fontSize: "clamp(140px, 14vw, 220px)", fontWeight: 400, fontStyle: "italic", color: "rgba(201,168,76,0.025)", whiteSpace: "nowrap", pointerEvents: "none", userSelect: "none", lineHeight: 1, zIndex: 0 }}>
              Aura
            </span>

            {/* Central glow behind content */}
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.10) 0%, transparent 60%)", pointerEvents: "none", zIndex: 0 }} />
            <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
              {/* Decorative diamond */}
              <div style={{ marginBottom: 32 }}>
                <span style={{ display: "inline-block", width: 8, height: 8, background: "#C9A84C", transform: "rotate(45deg)", opacity: 0.6 }} />
              </div>
              <p style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.4em", color: "rgba(201,168,76,0.55)", textTransform: "uppercase", margin: "0 0 32px" }}>
                Powered by Aura
              </p>
              <h2 style={{ fontFamily: GD, fontSize: "clamp(44px, 7vw, 84px)", fontWeight: 400, color: "#f5f0e8", lineHeight: 1.0, margin: "0 0 28px", letterSpacing: "-0.025em" }}>
                Tell us your{" "}
                <em style={{ fontStyle: "italic", color: "#C9A84C" }}>vision</em>
              </h2>
              <p style={{ fontFamily: NU, fontSize: 17, color: "rgba(245,240,232,0.5)", lineHeight: 1.85, margin: "0 auto 48px", maxWidth: 480, fontWeight: 300 }}>
                Describe the wedding you imagine. Aura will curate a bespoke selection of venues and vendors that match your style, setting, and sensibility.
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); setImmersiveOpen(true); }}
                style={{
                  background: "linear-gradient(135deg, #C9A84C, #e8c97a)",
                  border: "none",
                  borderRadius: 2,
                  padding: "18px 52px",
                  color: "#0f0e0b",
                  fontFamily: NU,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "opacity 0.2s ease, transform 0.3s ease, box-shadow 0.3s ease",
                  boxShadow: "0 8px 32px rgba(201,168,76,0.2)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.92"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(201,168,76,0.3)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(201,168,76,0.2)"; }}
              >
                Begin with Aura →
              </button>
              <p style={{ fontFamily: NU, fontSize: 10, color: "rgba(245,240,232,0.28)", letterSpacing: "0.12em", textTransform: "uppercase", margin: "20px 0 0" }}>
                3 steps · 60 seconds · Completely personal
              </p>
              <p style={{ fontFamily: NU, fontSize: 8, color: "rgba(245,240,232,0.18)", letterSpacing: "0.25em", textTransform: "uppercase", margin: "14px 0 0" }}>
                Powered by Taigenic · AI
              </p>
            </div>
          </section>

          {/* ═══ 3. SIGNATURE COLLECTION — Editorial cinematic moment ══════════ */}
          <FeaturedSlider venues={FEATURED_VENUES} />

          {/* ═══ 4. VENUES — The Collection (unified, no duplication) ══════════ */}
          <VenueGrid venues={displayVenues} onViewVenue={(v) => onViewVenue?.(v)} onViewCategory={onViewCategory} />

          {/* ═══ 5. DESTINATIONS ═══════════════════════════════════════════════ */}
          <DestinationGrid
            onDestinationClick={(d) => {
              if (d.countrySlug && d.regionSlug) {
                onViewRegion?.(d.countrySlug, d.regionSlug);
              }
            }}
          />

          {/* ═══ 6. VENDORS — The Creatives ═══════════════════════════════════ */}
          <VendorPreview
            dbVendors={displayVendors}
            onViewCategory={onViewCategory}
            onViewVendor={(v) => {
              if (v.cat === "venues") onViewVenue?.();
              else setEnquiryVendor(v);
            }}
          />

          {/* ═══ 7. MAGAZINE ═══════════════════════════════════════════════════ */}
          <MagazineEditorial
            onViewMagazine={onViewMagazine}
            onViewMagazineArticle={onViewMagazineArticle}
          />

          {/* ═══ 8. NEWSLETTER + FOOTER ═══════════════════════════════════════ */}
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
