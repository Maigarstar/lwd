// ─── src/pages/HomePage.jsx ──────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { ThemeCtx } from "../theme/ThemeContext";
import { getDarkPalette, getLightPalette, getDefaultMode } from "../theme/tokens";
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
import "../category.css";

// ─── Font tokens ──────────────────────────────────────────────────────────────
const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

// ─── Luxury category icons ────────────────────────────────────────────────────
const LUXURY_ICONS = {
  "wedding-venues": (color) => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-6h6v6" /><path d="M10 10h.01M14 10h.01" /></svg>),
  "wedding-planners": (color) => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>),
  "photographers": (color) => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>),
  "florists": (color) => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c0 0 0-3 0-6" /><path d="M9 18c-2 0-4-1.5-4-4 0-2 2-3.5 4-3.5.5-2 2-3.5 3-3.5s2.5 1.5 3 3.5c2 0 4 1.5 4 3.5 0 2.5-2 4-4 4" /><path d="M12 8c0-2 1-4 3-5" /><path d="M12 8c0-2-1-4-3-5" /></svg>),
  "caterers": (color) => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 010 8h-1" /><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" /></svg>),
  "hair-makeup": (color) => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5" /><path d="M12 13v8" /><path d="M9 18h6" /><path d="M15 5c1-2 3-3 4-2" /></svg>),
  "entertainment": (color) => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>),
  "videographers": (color) => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>),
  "wedding-cakes": (color) => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 18h16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" /><path d="M6 14h12v4H6z" /><path d="M8 10h8v4H8z" /><path d="M12 3v3" /><circle cx="12" cy="2" r="1" /></svg>),
  "stationery": (color) => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>),
  "bridal-wear": (color) => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C9 2 7 5 7 8c0 2 1 3 2 4l-3 10h12l-3-10c1-1 2-2 2-4 0-3-2-6-5-6z" /><path d="M9 22h6" /></svg>),
  "jewellers": (color) => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="14" r="6" /><path d="M12 8V2" /><path d="M8 10l-3-5" /><path d="M16 10l3-5" /></svg>),
  "transport": (color) => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17h14v-5H5v5z" /><path d="M2 12h20" /><path d="M5 12V7c0-1.7 1.3-3 3-3h8c1.7 0 3 1.3 3 3v5" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></svg>),
  "event-design": (color) => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>),
};

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
const CATS_PER_PAGE = 7;

function CategoryShortcutCard({ vc, C, onClick }) {
  const [hov, setHov] = useState(false);
  const iconColor = hov ? C.gold : (C.grey || "#888");
  const renderIcon = LUXURY_ICONS[vc.slug];
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? C.card : C.dark, border: `1px solid ${hov ? C.gold : C.border2}`, borderRadius: "var(--lwd-radius-card)", padding: "28px 20px", textAlign: "center", cursor: "pointer", transition: "all 0.25s", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, borderRadius: "50%", background: hov ? (C.goldDim || "rgba(201,168,76,0.08)") : "transparent", border: `1px solid ${hov ? C.gold : (C.border2 || "rgba(255,255,255,0.08)")}`, transition: "all 0.3s ease" }} aria-hidden="true">
        {renderIcon ? renderIcon(iconColor) : <span style={{ fontSize: 22, opacity: 0.6 }}>{vc.icon}</span>}
      </span>
      <span style={{ fontFamily: NU, fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: hov ? C.gold : C.off, transition: "color 0.2s" }}>{vc.label}</span>
    </button>
  );
}

function CategoryCarousel({ categories, C, onSelect }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(categories.length / CATS_PER_PAGE);
  const start = page * CATS_PER_PAGE;
  const visible = categories.slice(start, start + CATS_PER_PAGE);
  const [hovPrev, setHovPrev] = useState(false);
  const [hovNext, setHovNext] = useState(false);
  const arrowBtn = (dir, hov, setHov, disabled, onClick) => (
    <button aria-label={dir === "prev" ? "Previous categories" : "Next categories"} disabled={disabled} onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov && !disabled ? (C.goldDim || "rgba(201,168,76,0.08)") : "transparent", border: `1px solid ${disabled ? (C.border || "rgba(255,255,255,0.06)") : hov ? C.gold : (C.border2 || "rgba(255,255,255,0.12)")}`, borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.25 : 1, transition: "all 0.25s", flexShrink: 0 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={hov && !disabled ? C.gold : (C.grey || "#888")} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {dir === "prev" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 6 15 12 9 18" />}
      </svg>
    </button>
  );
  return (
    <div>
      <div className="lwd-region-cat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 16 }}>
        {visible.map((vc) => (<CategoryShortcutCard key={vc.slug} vc={vc} C={C} onClick={() => onSelect(vc.slug)} />))}
      </div>
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 28 }}>
          {arrowBtn("prev", hovPrev, setHovPrev, page === 0, () => setPage((p) => p - 1))}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} aria-label={`Page ${i + 1}`} onClick={() => setPage(i)}
                style={{ width: page === i ? 20 : 6, height: 6, borderRadius: 3, background: page === i ? C.gold : (C.border2 || "rgba(255,255,255,0.12)"), border: "none", cursor: "pointer", padding: 0, transition: "all 0.3s ease" }} />
            ))}
          </div>
          {arrowBtn("next", hovNext, setHovNext, page >= totalPages - 1, () => setPage((p) => p + 1))}
        </div>
      )}
    </div>
  );
}

export default function HomePage({ onViewVenue, onViewCategory, onViewRegion, onViewRegionCategory, onViewStandard, onViewAbout, onViewContact, onViewPartnership, onViewVendor, onViewAdmin, onViewUSA, onViewItaly, onViewCountry, onViewMagazine, onViewMagazineArticle, footerNav }) {
  const [darkMode, setDarkMode] = useState(() => getDefaultMode() === "dark");
  const [enquiryVendor, setEnquiryVendor] = useState(null);
  const [heroBackgroundData, setHeroBackgroundData] = useState(null);
  const [dbListings, setDbListings] = useState([]);

  const C = darkMode ? getDarkPalette() : getLightPalette();
  const { setChatContext } = useChat();

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

  return (
    <ThemeCtx.Provider value={C}>
      <div style={{ background: C.black, minHeight: "100vh" }}>
        <HomeNav
          darkMode={darkMode}
          onToggleDark={() => setDarkMode((d) => !d)}
          onVendorLogin={() => onViewVendor?.()}
          onNavigateStandard={onViewStandard}
          onNavigateAbout={onViewAbout}
        />

        <main>
          {/* SlimHero + FeaturedSlider remain on curated static data, editorial content */}
          <SlimHero venues={FEATURED_VENUES} backgroundData={heroBackgroundData} onViewRegion={onViewRegion} onViewRegionCategory={onViewRegionCategory} onViewCategory={onViewCategory} />

          {/* Category Blocks - Find Your Perfect Match */}
          <section style={{ background: "#f2f0ea", padding: "72px 48px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 48 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 28, height: 1, background: C.gold }} />
                  <span style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: C.gold, fontWeight: 600 }}>Explore by Category</span>
                  <div style={{ width: 28, height: 1, background: C.gold }} />
                </div>
                <h2 style={{ fontFamily: GD, fontSize: "clamp(26px, 3vw, 36px)", fontWeight: 400, color: C.off, lineHeight: 1.2, margin: 0 }}>
                  Find Your
                  <span style={{ fontStyle: "italic", color: C.gold }}> Perfect Match</span>
                </h2>
              </div>
              <CategoryCarousel
                categories={VENDOR_CATEGORIES}
                C={C}
                onSelect={(slug) => onViewCategory({ category: slug })}
              />
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
          <VenueGrid venues={displayVenues} onViewVenue={(v) => onViewVenue?.(v)} />
          <FeaturedSlider venues={FEATURED_VENUES} />
          {/* VendorPreview: live DB vendors when available; internal fallback to GLOBAL_VENDORS */}
          <VendorPreview
            dbVendors={displayVendors}
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
      </div>
    </ThemeCtx.Provider>
  );
}
