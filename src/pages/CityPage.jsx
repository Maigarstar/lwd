// ─── src/pages/CityPage.jsx ──────────────────────────────────────────────────
// City page — renders individual cities using the same design as RegionPage
// Fetches content from the database (City Studio) instead of hardcoded data
import { useState, useEffect, useMemo, useCallback } from "react";
import { fetchLocationContent } from "../services/locationContentService";
import { getCityBySlug, getCountryBySlug, getRegionBySlug } from "../data/geo.js";
import RegionPage from "./RegionPage.jsx";

// ── Default hero fallback ────────────────────────────────────────────────────
const DEFAULT_HERO =
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=80";

export default function CityPage({
  onBack = () => {},
  onViewVenue = () => {},
  onViewCategory = () => {},
  onViewRegion = () => {},
  onViewRegionCategory = () => {},
  countrySlug = null,
  regionSlug = null,
  citySlug = null,
  footerNav = {},
}) {
  const [cityContent, setCityContent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get base city data from hardcoded data
  const baseCity = useMemo(() => getCityBySlug(citySlug), [citySlug]);
  const country = useMemo(() => getCountryBySlug(countrySlug), [countrySlug]);
  const parentRegion = useMemo(() => getRegionBySlug(regionSlug), [regionSlug]);

  // Fetch city content from database
  useEffect(() => {
    if (!citySlug || !countrySlug || !regionSlug) {
      setLoading(false);
      return;
    }

    const fetchContent = async () => {
      try {
        const locationKey = `city:${countrySlug}:${regionSlug}:${citySlug}`;
        const content = await fetchLocationContent(locationKey);
        setCityContent(content);
      } catch (err) {
        console.error(`[CityPage] Failed to fetch content for ${citySlug}:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [citySlug, countrySlug, regionSlug]);

  if (loading || !baseCity) {
    return (
      <div style={{ padding: "40px", textAlign: "center", minHeight: "100vh", background: "#000" }}>
        <p style={{ color: "#fff" }}>Loading...</p>
      </div>
    );
  }

  // Merge database content with base city data for display
  // The RegionPage will treat this as a "region" but it's actually a city
  // We're reusing RegionPage's layout for consistency with London
  // Create a region object that includes the city's filter/search info
  const cityAsRegion = {
    ...baseCity,
    slug: baseCity.slug, // Ensure slug is available for RegionPage's CountrySearchBar
    name: cityContent?.hero_title || baseCity.name,
    heroTitle: cityContent?.hero_title,
    heroSubtitle: cityContent?.hero_subtitle,
    heroImg: cityContent?.hero_image || parentRegion?.heroImg || DEFAULT_HERO,
    introEditorial: cityContent?.metadata?.editorialPara1 || baseCity.introEditorial,
    cities: [], // No nested cities
    relatedRegionSlugs: [], // No related regions for a city page
    trustSignals: [],
    // Include venue listings data for this city so filters work
    listingCount: baseCity.listingCount || 0,
    localTerm: "Venues", // Change from "Cities" to "Venues" since we're showing venues for this city
  };

  // Use RegionPage with the city data
  return (
    <RegionPage
      onBack={onBack}
      onViewVenue={onViewVenue}
      onViewCategory={onViewCategory}
      onViewRegion={onViewRegion}
      onViewRegionCategory={onViewRegionCategory}
      countrySlug={countrySlug}
      regionSlug={regionSlug}
      footerNav={footerNav}
      _cityData={cityAsRegion}
    />
  );
}
