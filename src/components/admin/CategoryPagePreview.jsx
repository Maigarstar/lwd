// ═══════════════════════════════════════════════════════════════════════════
// CategoryPagePreview — Live preview of category page matching wedding-planners design
// ═══════════════════════════════════════════════════════════════════════════

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

export default function CategoryPagePreview({ form = {}, categoryName = "Wedding Planners" }) {
  return (
    <div style={{ background: "#f5f1ea", minHeight: "100vh", fontFamily: NU }}>
      {/* ─── Hero Section ─── */}
      <div
        style={{
          position: "relative",
          height: 360,
          background: form.heroImage ? `url(${form.heroImage}) center/cover` : "#2a2420",
          backgroundAttachment: "fixed",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          color: "#fff",
          padding: "40px 60px",
          overflow: "hidden",
        }}
      >
        {/* Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
          }}
        />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 2, maxWidth: 600 }}>
          {form.eyebrow && (
            <div
              style={{
                fontFamily: NU,
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.7)",
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ width: 28, height: 1, background: "rgba(255,255,255,0.5)" }} />
              {form.eyebrow}
            </div>
          )}

          <h1
            style={{
              fontFamily: GD,
              fontSize: "clamp(32px, 4vw, 56px)",
              fontWeight: 400,
              color: "#fff",
              margin: 0,
              lineHeight: 1.1,
              marginBottom: 24,
            }}
          >
            {form.heroTitle ? (
              <>
                {form.heroTitle.split(" ").slice(0, -1).join(" ")}{" "}
                <span style={{ fontStyle: "italic", color: "#C9A84C" }}>
                  {form.heroTitle.split(" ").slice(-1)[0]}
                </span>
              </>
            ) : (
              <>
                Hero Title{" "}
                <span style={{ fontStyle: "italic", color: "#C9A84C" }}>
                  goes here
                </span>
              </>
            )}
          </h1>

          {/* Stats Row */}
          <div style={{ display: "flex", gap: 40, marginTop: 20 }}>
            {form.stat1Label && (
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>
                  {form.stat1Label}
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#C9A84C" }}>
                  {form.stat1Value || "—"}
                </div>
              </div>
            )}
            {form.stat2Label && (
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>
                  {form.stat2Label}
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#C9A84C" }}>
                  {form.stat2Value || "—"}
                </div>
              </div>
            )}
            {form.stat3Label && (
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>
                  {form.stat3Label}
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#C9A84C" }}>
                  {form.stat3Value || "—"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Content Section ─── */}
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "80px 60px" }}>
        {/* Search & Filter Section Placeholder */}
        <div style={{ marginBottom: 80, textAlign: "center" }}>
          <div
            style={{
              background: "#fff",
              padding: "40px",
              borderRadius: 8,
              border: "1px solid #e0d9cc",
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#999", marginBottom: 12 }}>
              AI Concierge Search
            </div>
            <input
              type="text"
              placeholder="Search will appear here"
              disabled
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1px solid #e0d9cc",
                borderRadius: 4,
                fontFamily: NU,
                fontSize: 14,
                color: "#999",
                background: "#fafafa",
              }}
            />
          </div>
        </div>

        {/* Browse by Category Section */}
        <div style={{ marginBottom: 80 }}>
          <div style={{ marginBottom: 40, textAlign: "center" }}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#999",
                marginBottom: 12,
              }}
            >
              Find Your Team
            </div>
            <h2
              style={{
                fontFamily: GD,
                fontSize: 32,
                fontWeight: 400,
                color: "#1a1a1a",
                margin: 0,
              }}
            >
              {form.categoryGridTitle || `${categoryName} Vendors`}
            </h2>
          </div>

          {/* Category Buttons */}
          <div
            style={{
              display: "flex",
              gap: 16,
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: 24,
            }}
          >
            {["Wedding Venues", "Wedding Planners", "Photographers", "Videographers", "Florists", "Caterers"].map(
              (cat, i) => (
                <button
                  key={i}
                  disabled
                  style={{
                    padding: "16px 24px",
                    background: "#fff",
                    border: "1px solid #d9d2c6",
                    borderRadius: 4,
                    fontFamily: NU,
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#1a1a1a",
                    cursor: "pointer",
                    transition: "all 0.3s",
                  }}
                >
                  {cat}
                </button>
              )
            )}
          </div>

          {/* Pagination */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
            <div
              style={{
                width: 12,
                height: 2,
                background: "#8A6A18",
                borderRadius: 1,
              }}
            />
            <div
              style={{
                width: 8,
                height: 2,
                background: "#d9d2c6",
                borderRadius: 1,
              }}
            />
          </div>
        </div>

        {/* Additional Content */}
        {form.editorialPara1 && (
          <div style={{ marginBottom: 80 }}>
            <h3
              style={{
                fontFamily: GD,
                fontSize: 24,
                fontWeight: 400,
                color: "#1a1a1a",
                marginBottom: 16,
              }}
            >
              About {categoryName}
            </h3>
            <p
              style={{
                fontFamily: NU,
                fontSize: 14,
                color: "#666",
                lineHeight: 1.7,
                maxWidth: 800,
              }}
            >
              {form.editorialPara1}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!form.heroTitle && !form.editorialPara1 && (
          <div style={{ padding: "60px 32px", textAlign: "center" }}>
            <div style={{ fontFamily: NU, fontSize: 14, color: "#999" }}>
              Fill in the hero title to see a live preview
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
