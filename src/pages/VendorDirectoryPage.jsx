/**
 * Public Vendor Directory - Main discovery page for couples
 * Features: Search, filters, vendor cards, map view, shortlist, quick view
 */

import { useState, useEffect } from "react";
import { VENDORS } from "../data/vendors.js";
import HomeNav from "../components/nav/HomeNav.jsx";
import SiteFooter from "../components/sections/SiteFooter.jsx";

const VendorDirectoryPage = ({
  onBack,
  onViewVendor,
  onViewRegion,
  onViewCategory,
  categorySlug = null,
  footerNav = {}
}) => {
  // ─────────────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [viewMode, setViewMode] = useState("grid"); // grid, map, list
  const [sortBy, setSortBy] = useState("curated"); // curated, popular, rated, price-low, price-high

  // Filters
  const [filters, setFilters] = useState({
    category: categorySlug || "all",
    country: "all",
    region: "all",
    capacity: { min: 0, max: 500 },
    priceRange: { min: 0, max: 100000 },
    rating: 0,
    verified: false,
    featured: false,
  });

  const [showQuickView, setShowQuickView] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // ─────────────────────────────────────────────────────────────────────
  // LOAD VENDORS
  // ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    // For now, use mock data from VENDORS
    // Later: fetch from Supabase listings table
    const allVendors = VENDORS.map(v => ({
      id: v.id,
      name: v.name,
      slug: v.slug,
      category: v.category,
      country: v.countrySlug,
      region: v.regionSlug,
      city: v.city,
      image: v.cardImage,
      rating: v.rating || 4.5,
      reviewCount: v.reviews || 12,
      capacity: v.maxGuests || 200,
      priceFrom: v.startingPrice || 10000,
      priceCurrency: "GBP",
      verified: v.verified || false,
      featured: v.cardFeatured || false,
      description: v.cardSummary || v.description,
    }));
    setVendors(allVendors);
  }, []);

  // ─────────────────────────────────────────────────────────────────────
  // FILTER & SORT VENDORS
  // ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let result = vendors.filter(v => {
      // Search query
      if (searchQuery && !v.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Category filter
      if (filters.category !== "all" && v.category !== filters.category) {
        return false;
      }
      // Country filter
      if (filters.country !== "all" && v.country !== filters.country) {
        return false;
      }
      // Region filter
      if (filters.region !== "all" && v.region !== filters.region) {
        return false;
      }
      // Capacity filter
      if (v.capacity < filters.capacity.min || v.capacity > filters.capacity.max) {
        return false;
      }
      // Price filter
      if (v.priceFrom < filters.priceRange.min || v.priceFrom > filters.priceRange.max) {
        return false;
      }
      // Rating filter
      if (filters.rating > 0 && v.rating < filters.rating) {
        return false;
      }
      // Verified filter
      if (filters.verified && !v.verified) {
        return false;
      }
      return true;
    });

    // Sort
    switch (sortBy) {
      case "popular":
        result.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case "rated":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "price-low":
        result.sort((a, b) => a.priceFrom - b.priceFrom);
        break;
      case "price-high":
        result.sort((a, b) => b.priceFrom - a.priceFrom);
        break;
      case "curated":
      default:
        result.sort((a, b) => {
          if (a.featured !== b.featured) return b.featured - a.featured;
          return b.rating - a.rating;
        });
    }

    setFilteredVendors(result);
  }, [vendors, searchQuery, filters, sortBy]);

  // ─────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────

  // Colors (from design system)
  const colors = {
    bg: "#fbf7f4",
    dark: "#ede5db",
    card: "#ffffff",
    border: "#ddd4c8",
    gold: "#8a6d1b",
    white: "#1a1a1a",
    grey: "#5a5147",
    grey2: "#8a8078",
    green: "#15803d",
  };

  const fonts = {
    body: "var(--font-body, 'Nunito', sans-serif)",
    heading: "var(--font-heading, 'Gilda Display', serif)",
  };

  // Get unique values for filters
  const countries = [...new Set(vendors.map(v => v.country))].filter(Boolean);
  const regions = [...new Set(vendors.filter(v => !filters.country || filters.country === "all" || v.country === filters.country).map(v => v.region))].filter(Boolean);

  return (
    <div style={{ backgroundColor: colors.bg, minHeight: "100vh" }}>
      {/* Simple Header */}
      <div style={{
        backgroundColor: colors.dark,
        padding: "16px 20px",
        borderBottom: `1px solid ${colors.border}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <button
          onClick={onBack}
          style={{
            fontFamily: fonts.body,
            fontSize: 14,
            color: colors.gold,
            background: "none",
            border: "none",
            cursor: "pointer",
            textTransform: "uppercase",
          }}
        >
          ← Back
        </button>
        <h2 style={{
          fontFamily: fonts.heading,
          fontSize: 20,
          color: colors.white,
          margin: 0,
        }}>
          Luxury Wedding Directory
        </h2>
        <div />
      </div>

      {/* Hero Search Section */}
      <section style={{
        backgroundColor: colors.dark,
        padding: "60px 20px",
        textAlign: "center",
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <h1 style={{
          fontFamily: fonts.heading,
          fontSize: 48,
          fontWeight: 400,
          color: colors.white,
          margin: "0 0 16px 0",
          letterSpacing: "-0.5px",
        }}>
          Find Your Perfect Venue
        </h1>
        <p style={{
          fontFamily: fonts.body,
          fontSize: 16,
          color: colors.grey,
          margin: "0 0 32px 0",
          maxWidth: "600px",
          marginLeft: "auto",
          marginRight: "auto",
        }}>
          Explore curated luxury wedding venues across the world's most romantic destinations
        </p>

        {/* Search Bar */}
        <div style={{
          maxWidth: "600px",
          margin: "0 auto",
          display: "flex",
          gap: "12px",
        }}>
          <input
            type="text"
            placeholder="Search by venue name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: "14px 16px",
              fontFamily: fonts.body,
              fontSize: 14,
              border: `1px solid ${colors.border}`,
              borderRadius: "3px",
              backgroundColor: colors.card,
              color: colors.white,
            }}
          />
          <button style={{
            padding: "14px 28px",
            backgroundColor: colors.gold,
            color: "white",
            fontFamily: fonts.body,
            fontSize: 14,
            fontWeight: 600,
            border: "none",
            borderRadius: "3px",
            cursor: "pointer",
            textTransform: "uppercase",
          }}>
            Search
          </button>
        </div>
      </section>

      {/* Main Content */}
      <div style={{
        display: "flex",
        maxWidth: "1400px",
        margin: "0 auto",
        gap: "32px",
        padding: "40px 20px",
      }}>
        {/* Sidebar Filters */}
        <aside style={{
          width: "280px",
          backgroundColor: colors.card,
          padding: "24px",
          borderRadius: "4px",
          height: "fit-content",
          display: window.innerWidth < 768 ? "none" : "block",
          border: `1px solid ${colors.border}`,
        }}>
          <h3 style={{
            fontFamily: fonts.heading,
            fontSize: 18,
            color: colors.white,
            margin: "0 0 24px 0",
          }}>
            Filters
          </h3>

          {/* Category Filter */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{
              fontFamily: fonts.body,
              fontSize: 12,
              fontWeight: 600,
              color: colors.grey2,
              textTransform: "uppercase",
              display: "block",
              marginBottom: "8px",
            }}>
              Venue Type
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              style={{
                width: "100%",
                padding: "8px 12px",
                fontFamily: fonts.body,
                fontSize: 14,
                border: `1px solid ${colors.border}`,
                borderRadius: "3px",
                backgroundColor: colors.bg,
                color: colors.white,
              }}
            >
              <option value="all">All Venues</option>
              <option value="venue">Wedding Venues</option>
              <option value="planner">Wedding Planners</option>
              <option value="photographer">Photographers</option>
            </select>
          </div>

          {/* Country Filter */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{
              fontFamily: fonts.body,
              fontSize: 12,
              fontWeight: 600,
              color: colors.grey2,
              textTransform: "uppercase",
              display: "block",
              marginBottom: "8px",
            }}>
              Country
            </label>
            <select
              value={filters.country}
              onChange={(e) => setFilters({ ...filters, country: e.target.value, region: "all" })}
              style={{
                width: "100%",
                padding: "8px 12px",
                fontFamily: fonts.body,
                fontSize: 14,
                border: `1px solid ${colors.border}`,
                borderRadius: "3px",
                backgroundColor: colors.bg,
                color: colors.white,
              }}
            >
              <option value="all">All Countries</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          {/* Guest Capacity */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{
              fontFamily: fonts.body,
              fontSize: 12,
              fontWeight: 600,
              color: colors.grey2,
              textTransform: "uppercase",
              display: "block",
              marginBottom: "8px",
            }}>
              Guest Capacity
            </label>
            <input
              type="range"
              min="0"
              max="500"
              value={filters.capacity.max}
              onChange={(e) => setFilters({ ...filters, capacity: { ...filters.capacity, max: parseInt(e.target.value) } })}
              style={{ width: "100%" }}
            />
            <p style={{
              fontFamily: fonts.body,
              fontSize: 12,
              color: colors.grey2,
              margin: "8px 0 0 0",
            }}>
              Up to {filters.capacity.max} guests
            </p>
          </div>

          {/* Price Range */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{
              fontFamily: fonts.body,
              fontSize: 12,
              fontWeight: 600,
              color: colors.grey2,
              textTransform: "uppercase",
              display: "block",
              marginBottom: "8px",
            }}>
              Budget
            </label>
            <input
              type="range"
              min="0"
              max="100000"
              step="5000"
              value={filters.priceRange.max}
              onChange={(e) => setFilters({ ...filters, priceRange: { ...filters.priceRange, max: parseInt(e.target.value) } })}
              style={{ width: "100%" }}
            />
            <p style={{
              fontFamily: fonts.body,
              fontSize: 12,
              color: colors.grey2,
              margin: "8px 0 0 0",
            }}>
              Up to £{filters.priceRange.max.toLocaleString()}
            </p>
          </div>

          {/* Rating Filter */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{
              fontFamily: fonts.body,
              fontSize: 12,
              fontWeight: 600,
              color: colors.grey2,
              textTransform: "uppercase",
              display: "block",
              marginBottom: "8px",
            }}>
              Minimum Rating
            </label>
            <select
              value={filters.rating}
              onChange={(e) => setFilters({ ...filters, rating: parseFloat(e.target.value) })}
              style={{
                width: "100%",
                padding: "8px 12px",
                fontFamily: fonts.body,
                fontSize: 14,
                border: `1px solid ${colors.border}`,
                borderRadius: "3px",
                backgroundColor: colors.bg,
                color: colors.white,
              }}
            >
              <option value="0">Any Rating</option>
              <option value="4">4+ Stars</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="5">5 Stars</option>
            </select>
          </div>

          {/* Verified Only */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: fonts.body,
              fontSize: 14,
              color: colors.white,
              cursor: "pointer",
            }}>
              <input
                type="checkbox"
                checked={filters.verified}
                onChange={(e) => setFilters({ ...filters, verified: e.target.checked })}
              />
              Verified Vendors Only
            </label>
          </div>
        </aside>

        {/* Results Section */}
        <div style={{ flex: 1 }}>
          {/* Results Header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "32px",
            paddingBottom: "16px",
            borderBottom: `1px solid ${colors.border}`,
          }}>
            <p style={{
              fontFamily: fonts.body,
              fontSize: 14,
              color: colors.grey,
              margin: 0,
            }}>
              Showing <strong>{filteredVendors.length}</strong> venues
            </p>

            <div style={{
              display: "flex",
              gap: "16px",
              alignItems: "center",
            }}>
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: "8px 12px",
                  fontFamily: fonts.body,
                  fontSize: 14,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "3px",
                  backgroundColor: colors.card,
                  color: colors.white,
                }}
              >
                <option value="curated">Curated</option>
                <option value="popular">Most Popular</option>
                <option value="rated">Top Rated</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>

              {/* View Mode Toggle */}
              <div style={{
                display: "flex",
                gap: "8px",
                backgroundColor: colors.dark,
                padding: "4px",
                borderRadius: "3px",
              }}>
                {["grid", "list", "map"].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: viewMode === mode ? colors.gold : "transparent",
                      color: viewMode === mode ? "white" : colors.grey2,
                      fontFamily: fonts.body,
                      fontSize: 12,
                      border: "none",
                      cursor: "pointer",
                      textTransform: "capitalize",
                      borderRadius: "2px",
                      fontWeight: 600,
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Vendor Grid */}
          {viewMode === "grid" && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "24px",
            }}>
              {filteredVendors.map(vendor => (
                <div
                  key={vendor.id}
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: "4px",
                    overflow: "hidden",
                    border: `1px solid ${colors.border}`,
                    cursor: "pointer",
                    transition: "box-shadow 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = `0 4px 12px rgba(0,0,0,0.1)`}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
                >
                  {/* Image */}
                  <div style={{
                    width: "100%",
                    height: "200px",
                    backgroundColor: colors.dark,
                    overflow: "hidden",
                    position: "relative",
                  }}>
                    {vendor.image && (
                      <img
                        src={vendor.image}
                        alt={vendor.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    )}
                    {vendor.featured && (
                      <div style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        backgroundColor: colors.gold,
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "3px",
                        fontFamily: fonts.body,
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}>
                        Featured
                      </div>
                    )}
                    {vendor.verified && (
                      <div style={{
                        position: "absolute",
                        top: "12px",
                        left: "12px",
                        backgroundColor: colors.green,
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "3px",
                        fontFamily: fonts.body,
                        fontSize: 10,
                        fontWeight: 600,
                      }}>
                        ✓ Verified
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ padding: "16px" }}>
                    <h3 style={{
                      fontFamily: fonts.heading,
                      fontSize: 16,
                      fontWeight: 400,
                      color: colors.white,
                      margin: "0 0 4px 0",
                    }}>
                      {vendor.name}
                    </h3>
                    <p style={{
                      fontFamily: fonts.body,
                      fontSize: 12,
                      color: colors.grey2,
                      margin: "0 0 12px 0",
                    }}>
                      {vendor.city}, {vendor.country}
                    </p>

                    {/* Rating */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      marginBottom: "12px",
                    }}>
                      <span style={{
                        fontFamily: fonts.body,
                        fontSize: 12,
                        color: colors.gold,
                      }}>
                        ★ {vendor.rating.toFixed(1)}
                      </span>
                      <span style={{
                        fontFamily: fonts.body,
                        fontSize: 11,
                        color: colors.grey2,
                      }}>
                        ({vendor.reviewCount} reviews)
                      </span>
                    </div>

                    {/* Details */}
                    <p style={{
                      fontFamily: fonts.body,
                      fontSize: 12,
                      color: colors.grey,
                      margin: "0 0 12px 0",
                      lineHeight: "1.4",
                    }}>
                      Up to {vendor.capacity} guests • From £{vendor.priceFrom.toLocaleString()}
                    </p>

                    {/* Buttons */}
                    <div style={{
                      display: "flex",
                      gap: "8px",
                    }}>
                      <button
                        onClick={() => onViewVendor && onViewVendor(vendor)}
                        style={{
                          flex: 1,
                          padding: "10px",
                          backgroundColor: colors.gold,
                          color: "white",
                          fontFamily: fonts.body,
                          fontSize: 12,
                          fontWeight: 600,
                          border: "none",
                          borderRadius: "3px",
                          cursor: "pointer",
                          textTransform: "uppercase",
                        }}
                      >
                        View Profile
                      </button>
                      <button
                        onClick={() => {
                          setSelectedVendor(vendor);
                          setShowQuickView(true);
                        }}
                        style={{
                          flex: 1,
                          padding: "10px",
                          backgroundColor: "transparent",
                          border: `1px solid ${colors.gold}`,
                          color: colors.gold,
                          fontFamily: fonts.body,
                          fontSize: 12,
                          fontWeight: 600,
                          borderRadius: "3px",
                          cursor: "pointer",
                          textTransform: "uppercase",
                        }}
                      >
                        Quick View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {filteredVendors.length === 0 && (
            <div style={{
              textAlign: "center",
              padding: "60px 20px",
            }}>
              <h3 style={{
                fontFamily: fonts.heading,
                fontSize: 24,
                color: colors.white,
                margin: "0 0 12px 0",
              }}>
                No venues found
              </h3>
              <p style={{
                fontFamily: fonts.body,
                fontSize: 14,
                color: colors.grey,
              }}>
                Try adjusting your filters to see more results
              </p>
            </div>
          )}
        </div>
      </div>

      <SiteFooter {...footerNav} />
    </div>
  );
};

export default VendorDirectoryPage;
