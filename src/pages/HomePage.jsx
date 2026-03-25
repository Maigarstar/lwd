// ─── src/pages/HomePage.jsx ──────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { ThemeCtx } from "../theme/ThemeContext";
import { getDarkPalette, getLightPalette, getDefaultMode } from "../theme/tokens";
import { useChat } from "../chat/ChatContext";
import { FEATURED_VENUES } from "../data/featuredVenues";
import { getPageById } from "./PageStudio/services/pageService";
import { fetchListings } from "../services/listings";

import HomeNav from "../components/nav/HomeNav";
import SlimHero from "../components/sections/SlimHero";
import FeaturedSlider from "../components/sections/FeaturedSlider";
import DestinationGrid from "../components/sections/DestinationGrid";
import VenueGrid from "../components/sections/VenueGrid";
import VendorPreview from "../components/sections/VendorPreview";
import CategorySlider from "../components/sections/CategorySlider";
import DirectoryBrands from "../components/sections/DirectoryBrands";
import NewsletterBand from "../components/sections/NewsletterBand";
import MagazineEditorial from "../components/sections/MagazineEditorial";
import EnquiryModal from "../components/modals/EnquiryModal";
import "../category.css";

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

export default function HomePage({ onViewVenue, onViewCategory, onViewRegion, onViewRegionCategory, onViewStandard, onViewAbout, onViewContact, onViewPartnership, onViewVendor, onViewAdmin, onViewUSA, onViewItaly, onViewCountry, onViewMagazine, onViewMagazineArticle, footerNav, homepageGridEnabled = true, countryOverrides = {} }) {
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
          <CategorySlider />
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
          <DirectoryBrands
            onViewRegion={(countrySlug, regionSlug) => onViewRegion?.(countrySlug, regionSlug)}
            onViewCategory={onViewCategory}
            onViewUSA={onViewUSA}
            onViewItaly={onViewItaly}
            onViewCountry={onViewCountry}
            homepageGridEnabled={homepageGridEnabled}
            countryOverrides={countryOverrides}
          />
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
