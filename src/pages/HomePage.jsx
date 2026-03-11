// ─── src/pages/HomePage.jsx ──────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { ThemeCtx } from "../theme/ThemeContext";
import { getDarkPalette, getLightPalette, getDefaultMode } from "../theme/tokens";
import { useChat } from "../chat/ChatContext";
import { FEATURED_VENUES } from "../data/featuredVenues";
import { getPageById } from "./PageStudio/services/pageService";

import HomeNav from "../components/nav/HomeNav";
import SlimHero from "../components/sections/SlimHero";
import FeaturedSlider from "../components/sections/FeaturedSlider";
import SiteFooter from "../components/sections/SiteFooter";
import DestinationGrid from "../components/sections/DestinationGrid";
import VenueGrid from "../components/sections/VenueGrid";
import VendorPreview from "../components/sections/VendorPreview";
import CategorySlider from "../components/sections/CategorySlider";
import DirectoryBrands from "../components/sections/DirectoryBrands";
import NewsletterBand from "../components/sections/NewsletterBand";
import EnquiryModal from "../components/modals/EnquiryModal";
import "../category.css";

export default function HomePage({ onViewVenue, onViewCategory, onViewRegion, onViewRegionCategory, onViewStandard, onViewAbout, onViewContact, onViewPartnership, onViewVendor, onViewAdmin, onViewUSA, onViewItaly, footerNav }) {
  const [darkMode, setDarkMode] = useState(() => getDefaultMode() === "dark");
  const [enquiryVendor, setEnquiryVendor] = useState(null);
  const [heroBackgroundData, setHeroBackgroundData] = useState(null);

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
          <SlimHero venues={FEATURED_VENUES} backgroundData={heroBackgroundData} onViewRegion={onViewRegion} onViewRegionCategory={onViewRegionCategory} onViewCategory={onViewCategory} />
          <DestinationGrid
            onDestinationClick={(d) => {
              if (d.countrySlug && d.regionSlug) {
                onViewRegion?.(d.countrySlug, d.regionSlug);
              }
            }}
          />
          <VenueGrid venues={FEATURED_VENUES} onViewVenue={() => onViewVenue?.()} />
          <FeaturedSlider venues={FEATURED_VENUES} />
          <CategorySlider />
          <VendorPreview
            onViewVendor={(v) => {
              if (v.cat === "venues") onViewVenue?.();
              else setEnquiryVendor(v);
            }}
          />
          <NewsletterBand />
          <DirectoryBrands onViewRegion={(countrySlug, regionSlug) => onViewRegion?.(countrySlug, regionSlug)} onViewCategory={onViewCategory} onViewUSA={onViewUSA} onViewItaly={onViewItaly} />
        </main>

        <SiteFooter {...footerNav} />

        {/* Enquiry modal */}
        <EnquiryModal
          vendor={enquiryVendor}
          onClose={() => setEnquiryVendor(null)}
        />
      </div>
    </ThemeCtx.Provider>
  );
}
