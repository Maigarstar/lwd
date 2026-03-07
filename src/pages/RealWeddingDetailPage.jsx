/**
 * Real Wedding Detail Page
 * Shows full wedding showcase with gallery, story, and vendor credits
 */

import { useState, useEffect } from "react";
import { getRealWeddingBySlug } from "../services/realWeddingService";

const RealWeddingDetailPage = ({ C, NU, GD, realWeddingSlug, onNavigate }) => {
  const [wedding, setWedding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const loadWedding = async () => {
      if (!realWeddingSlug) return;

      try {
        const { data, error: err } = await getRealWeddingBySlug(realWeddingSlug);
        if (err) throw err;
        setWedding(data);
      } catch (err) {
        console.error("Error loading wedding:", err);
        setError(err.message || "Failed to load wedding");
      } finally {
        setLoading(false);
      }
    };

    loadWedding();
  }, [realWeddingSlug]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: C.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ fontFamily: NU, fontSize: 14, color: C.grey }}>Loading wedding...</p>
      </div>
    );
  }

  if (error || !wedding) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: C.bg,
          padding: "40px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            backgroundColor: "#fef2f2",
            border: `1px solid ${C.rose}`,
            padding: "20px",
            borderRadius: 4,
            color: C.rose,
            fontFamily: NU,
            fontSize: 13,
            maxWidth: 400,
            textAlign: "center",
          }}
        >
          {error || "Wedding not found"}
        </div>
      </div>
    );
  }

  const galleryImages = wedding.gallery_images || [];
  const currentImage = galleryImages[selectedImageIndex];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg }}>
      {/* Hero Section - Featured Image */}
      {wedding.featured_image && (
        <div style={{ position: "relative", height: "50vh", overflow: "hidden" }}>
          <img
            src={wedding.featured_image}
            alt={wedding.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
              padding: "40px 20px 20px",
              color: "white",
              textAlign: "center",
            }}
          >
            <h1
              style={{
                fontFamily: GD,
                fontSize: 48,
                margin: 0,
                marginBottom: 12,
              }}
            >
              {wedding.title}
            </h1>
            {wedding.couple_names && (
              <p style={{ fontFamily: NU, fontSize: 16, margin: 0 }}>
                {wedding.couple_names}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "40px 20px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Details Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 20,
            marginBottom: 40,
            padding: "20px",
            backgroundColor: C.card,
            borderRadius: 4,
          }}
        >
          {wedding.wedding_date && (
            <div>
              <p
                style={{
                  fontFamily: NU,
                  fontSize: 11,
                  color: C.grey2,
                  textTransform: "uppercase",
                  fontWeight: 600,
                  margin: "0 0 8px 0",
                }}
              >
                Wedding Date
              </p>
              <p
                style={{
                  fontFamily: NU,
                  fontSize: 14,
                  color: C.white,
                  margin: 0,
                }}
              >
                {new Date(wedding.wedding_date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}

          {wedding.location && (
            <div>
              <p
                style={{
                  fontFamily: NU,
                  fontSize: 11,
                  color: C.grey2,
                  textTransform: "uppercase",
                  fontWeight: 600,
                  margin: "0 0 8px 0",
                }}
              >
                Location
              </p>
              <p
                style={{
                  fontFamily: NU,
                  fontSize: 14,
                  color: C.white,
                  margin: 0,
                }}
              >
                {wedding.location}
              </p>
            </div>
          )}
        </div>

        {/* Couple's Story */}
        {wedding.couple_story && (
          <div style={{ marginBottom: 40 }}>
            <h2
              style={{
                fontFamily: GD,
                fontSize: 32,
                color: C.white,
                margin: "0 0 20px 0",
              }}
            >
              Their Story
            </h2>
            <div
              style={{
                backgroundColor: C.card,
                padding: 20,
                borderRadius: 4,
                fontFamily: NU,
                fontSize: 14,
                color: C.white,
                lineHeight: 1.8,
                whiteSpace: "pre-wrap",
              }}
            >
              {wedding.couple_story}
            </div>
          </div>
        )}

        {/* Gallery */}
        {galleryImages.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2
              style={{
                fontFamily: GD,
                fontSize: 32,
                color: C.white,
                margin: "0 0 20px 0",
              }}
            >
              Gallery
            </h2>

            {/* Main Image Display */}
            <div
              style={{
                backgroundColor: C.dark,
                borderRadius: 4,
                overflow: "hidden",
                marginBottom: 20,
              }}
            >
              {currentImage?.url && (
                <img
                  src={currentImage.url}
                  alt={currentImage.caption || "Wedding photo"}
                  style={{
                    width: "100%",
                    maxHeight: "500px",
                    objectFit: "cover",
                  }}
                />
              )}
              {currentImage?.caption && (
                <p
                  style={{
                    fontFamily: NU,
                    fontSize: 13,
                    color: C.grey,
                    padding: "12px 16px",
                    margin: 0,
                    backgroundColor: C.dark,
                  }}
                >
                  {currentImage.caption}
                </p>
              )}
            </div>

            {/* Thumbnail Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                gap: 12,
              }}
            >
              {galleryImages.map((image, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  style={{
                    cursor: "pointer",
                    borderRadius: 4,
                    overflow: "hidden",
                    border: selectedImageIndex === index ? `3px solid ${C.gold}` : "none",
                  }}
                >
                  <img
                    src={image.url}
                    alt={image.caption || "Wedding photo"}
                    style={{
                      width: "100%",
                      height: 100,
                      objectFit: "cover",
                      opacity: selectedImageIndex === index ? 1 : 0.7,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vendor Credits */}
        {wedding.vendors && wedding.vendors.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2
              style={{
                fontFamily: GD,
                fontSize: 32,
                color: C.white,
                margin: "0 0 20px 0",
              }}
            >
              Featured Vendors
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                gap: 20,
              }}
            >
              {wedding.vendors.map((vendor) => (
                <div
                  key={vendor.id}
                  style={{
                    backgroundColor: C.card,
                    padding: 20,
                    borderRadius: 4,
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                  }}
                >
                  <p
                    style={{
                      fontFamily: NU,
                      fontSize: 11,
                      color: C.gold,
                      textTransform: "uppercase",
                      fontWeight: 600,
                      margin: "0 0 8px 0",
                    }}
                  >
                    {vendor.vendor_category}
                  </p>

                  <h3
                    style={{
                      fontFamily: GD,
                      fontSize: 18,
                      color: C.white,
                      margin: "0 0 8px 0",
                    }}
                  >
                    {vendor.vendor_name}
                  </h3>

                  {vendor.role_description && (
                    <p
                      style={{
                        fontFamily: NU,
                        fontSize: 13,
                        color: C.grey,
                        margin: "0 0 12px 0",
                        lineHeight: 1.5,
                      }}
                    >
                      {vendor.role_description}
                    </p>
                  )}

                  {vendor.vendor_slug && (
                    <button
                      onClick={() =>
                        onNavigate("public-vendor-profile", {
                          vendorSlug: vendor.vendor_slug,
                        })
                      }
                      style={{
                        padding: "8px 16px",
                        fontFamily: NU,
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor: C.gold,
                        color: "#000",
                        border: "none",
                        borderRadius: 3,
                        cursor: "pointer",
                        textTransform: "uppercase",
                      }}
                    >
                      View Vendor
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div
          style={{
            backgroundColor: C.dark,
            padding: "40px 20px",
            borderRadius: 4,
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontFamily: GD,
              fontSize: 28,
              color: C.white,
              margin: "0 0 16px 0",
            }}
          >
            Ready to Plan Your Wedding?
          </h2>
          <p
            style={{
              fontFamily: NU,
              fontSize: 14,
              color: C.grey,
              margin: "0 0 24px 0",
            }}
          >
            Explore our full vendor directory to find your perfect vendors
          </p>
          <button
            onClick={() => onNavigate("venue-directory")}
            style={{
              padding: "12px 28px",
              fontFamily: NU,
              fontSize: 13,
              fontWeight: 600,
              backgroundColor: C.gold,
              color: "#000",
              border: "none",
              borderRadius: 3,
              cursor: "pointer",
              textTransform: "uppercase",
            }}
          >
            Browse Venues
          </button>
        </div>
      </div>
    </div>
  );
};

export default RealWeddingDetailPage;
