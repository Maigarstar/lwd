/**
 * Real Weddings Gallery - Public Page
 * Showcases real wedding events with vendor credits
 */

import { useState } from "react";
import { useRealWeddings } from "../hooks/useRealWeddings";

const RealWeddingsPage = ({ C, NU, GD, onNavigate }) => {
  const { weddings, locations, loading, error, page, totalPages, filters, setFilters, goToPage } =
    useRealWeddings(12);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLocationChange = (location) => {
    setFilters({ location: location === "all" ? "" : location });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // TODO: Implement full-text search in Phase 2.3.1
    // For now, search is client-side filtering
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg }}>
      {/* Hero Section */}
      <div
        style={{
          backgroundColor: C.dark,
          padding: "60px 20px",
          textAlign: "center",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <h1
          style={{
            fontFamily: GD,
            fontSize: 48,
            color: C.white,
            margin: "0 0 12px 0",
          }}
        >
          Real Weddings
        </h1>
        <p
          style={{
            fontFamily: NU,
            fontSize: 16,
            color: C.grey,
            margin: 0,
            maxWidth: 600,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Inspiration from real couples and the vendors who made their days unforgettable
        </p>
      </div>

      {/* Filters & Search */}
      <div
        style={{
          backgroundColor: C.card,
          padding: "28px 20px",
          borderBottom: `1px solid ${C.border}`,
          maxWidth: 1200,
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          {/* Location Filter */}
          <div>
            <label
              style={{
                display: "block",
                fontFamily: NU,
                fontSize: 11,
                color: C.grey2,
                textTransform: "uppercase",
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Location
            </label>
            <select
              value={filters.location}
              onChange={(e) => handleLocationChange(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                fontFamily: NU,
                fontSize: 13,
                border: `1px solid ${C.border}`,
                borderRadius: 3,
                backgroundColor: C.bg,
                color: C.white,
                boxSizing: "border-box",
              }}
            >
              <option value="">All Locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          {/* Featured Filter */}
          <div>
            <label
              style={{
                display: "block",
                fontFamily: NU,
                fontSize: 11,
                color: C.grey2,
                textTransform: "uppercase",
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              <input
                type="checkbox"
                checked={filters.featured}
                onChange={(e) => setFilters({ featured: e.target.checked })}
                style={{ marginRight: 8 }}
              />
              Featured Only
            </label>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search weddings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px",
              fontFamily: NU,
              fontSize: 13,
              border: `1px solid ${C.border}`,
              borderRadius: 3,
              backgroundColor: C.bg,
              color: C.white,
              boxSizing: "border-box",
            }}
          />
        </form>
      </div>

      {/* Weddings Grid */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "40px 20px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <p style={{ fontFamily: NU, fontSize: 14, color: C.grey }}>Loading weddings...</p>
          </div>
        ) : error ? (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: `1px solid ${C.rose}`,
              padding: "20px",
              borderRadius: 4,
              color: C.rose,
              fontFamily: NU,
              fontSize: 13,
            }}
          >
            Failed to load weddings: {error}
          </div>
        ) : weddings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <p style={{ fontFamily: NU, fontSize: 14, color: C.grey }}>
              No weddings found. Try adjusting your filters.
            </p>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 24,
                marginBottom: 40,
              }}
            >
              {weddings.map((wedding) => (
                <div
                  key={wedding.id}
                  onClick={() =>
                    onNavigate("real-wedding-detail", { realWeddingSlug: wedding.slug })
                  }
                  style={{
                    cursor: "pointer",
                    backgroundColor: C.card,
                    borderRadius: 4,
                    overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.12)";
                    e.currentTarget.style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Image */}
                  {wedding.featured_image && (
                    <img
                      src={wedding.featured_image}
                      alt={wedding.title}
                      style={{
                        width: "100%",
                        height: 240,
                        objectFit: "cover",
                      }}
                    />
                  )}

                  {/* Content */}
                  <div style={{ padding: 20 }}>
                    <h3
                      style={{
                        fontFamily: GD,
                        fontSize: 18,
                        color: C.white,
                        margin: "0 0 8px 0",
                      }}
                    >
                      {wedding.title}
                    </h3>

                    <p
                      style={{
                        fontFamily: NU,
                        fontSize: 13,
                        color: C.grey,
                        margin: "0 0 12px 0",
                        lineHeight: 1.5,
                      }}
                    >
                      {wedding.location}
                      {wedding.wedding_date && (
                        <>
                          {" "}
                          •{" "}
                          {new Date(wedding.wedding_date).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })}
                        </>
                      )}
                    </p>

                    {wedding.couple_names && (
                      <p
                        style={{
                          fontFamily: NU,
                          fontSize: 12,
                          color: C.grey2,
                          margin: 0,
                        }}
                      >
                        {wedding.couple_names}
                      </p>
                    )}

                    {wedding.featured && (
                      <div
                        style={{
                          marginTop: 12,
                          paddingTop: 12,
                          borderTop: `1px solid ${C.border}`,
                        }}
                      >
                        <span
                          style={{
                            backgroundColor: C.gold,
                            color: "#000",
                            padding: "4px 8px",
                            borderRadius: 3,
                            fontFamily: NU,
                            fontSize: 10,
                            fontWeight: 600,
                            textTransform: "uppercase",
                          }}
                        >
                          Featured
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 40 }}>
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  style={{
                    padding: "10px 16px",
                    fontFamily: NU,
                    fontSize: 12,
                    backgroundColor: page === 1 ? C.grey2 : C.gold,
                    color: page === 1 ? C.white : "#000",
                    border: "none",
                    borderRadius: 3,
                    cursor: page === 1 ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  Previous
                </button>

                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      style={{
                        padding: "10px 12px",
                        fontFamily: NU,
                        fontSize: 12,
                        backgroundColor: page === pageNum ? C.gold : C.dark,
                        color: C.white,
                        border: "none",
                        borderRadius: 3,
                        cursor: "pointer",
                        fontWeight: 600,
                        minWidth: 40,
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                  style={{
                    padding: "10px 16px",
                    fontFamily: NU,
                    fontSize: 12,
                    backgroundColor: page === totalPages ? C.grey2 : C.gold,
                    color: page === totalPages ? C.white : "#000",
                    border: "none",
                    borderRadius: 3,
                    cursor: page === totalPages ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RealWeddingsPage;
