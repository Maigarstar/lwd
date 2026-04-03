import { useCompare } from "../compare/CompareContext";
import { useState } from "react";

const GOLD = "#C9A84C";
const BG = "#0a0a0a";
const CARD = "#2a2a2a";
const BORDER = "#444";
const TEXT = "#ffffff";
const MUTED = "#a0a0a0";

export default function ComparisonPage({ onBack }) {
  const { compareItems, clearCompare } = useCompare();
  const [sortBy, setSortBy] = useState("name");

  if (compareItems.length === 0) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: BG, color: TEXT }}>
        <div style={{ padding: "20px 32px", borderBottom: `1px solid ${BORDER}` }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: GOLD, cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>
            ← Back
          </button>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 24px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "32px", fontWeight: 700, color: TEXT, marginBottom: "12px" }}>
              Nothing to Compare
            </div>
            <div style={{ fontSize: "16px", color: MUTED, marginBottom: "24px" }}>
              Add venues to your comparison from the list to see them side-by-side.
            </div>
            <button
              onClick={onBack}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                color: "#0f0d0a",
                background: `linear-gradient(135deg, ${GOLD}, #e8c97a)`,
                border: "none",
                borderRadius: "4px",
                padding: "10px 20px",
                cursor: "pointer",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Back to Venues
            </button>
          </div>
        </div>
      </div>
    );
  }

  const sortedItems = [...compareItems].sort((a, b) => {
    switch (sortBy) {
      case "price":
        return (a.price || 0) - (b.price || 0);
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      default:
        return a.name.localeCompare(b.name);
    }
  });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: BG, color: TEXT }}>
      <div style={{ padding: "20px 32px", borderBottom: `1px solid ${BORDER}` }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: GOLD, cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>
          ← Back
        </button>
      </div>

      <div style={{ flex: 1, padding: "40px 32px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
            <div>
              <h1 style={{ fontSize: "40px", fontWeight: 700, color: TEXT, margin: 0, marginBottom: "8px" }}>
                Compare Venues
              </h1>
              <p style={{ fontSize: "14px", color: MUTED, margin: 0 }}>
                {compareItems.length} venue{compareItems.length !== 1 ? "s" : ""} selected
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={clearCompare}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: MUTED,
                  background: "none",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "4px",
                  padding: "8px 16px",
                  cursor: "pointer",
                  letterSpacing: "0.5px",
                }}
              >
                Clear All
              </button>
              <button
                onClick={onBack}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#0f0d0a",
                  background: `linear-gradient(135deg, ${GOLD}, #e8c97a)`,
                  border: "none",
                  borderRadius: "4px",
                  padding: "8px 16px",
                  cursor: "pointer",
                  letterSpacing: "0.5px",
                }}
              >
                Continue Browsing
              </button>
            </div>
          </div>

          {/* Sort controls */}
          <div style={{ marginBottom: "32px", display: "flex", gap: "12px", alignItems: "center" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, color: MUTED, textTransform: "uppercase" }}>
              Sort by:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                padding: "8px 12px",
                background: CARD,
                color: TEXT,
                border: `1px solid ${BORDER}`,
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              <option value="name">Name</option>
              <option value="price">Price (Low to High)</option>
              <option value="rating">Rating (High to Low)</option>
            </select>
          </div>

          {/* Comparison table */}
          <div style={{ overflowX: "auto", border: `1px solid ${BORDER}`, borderRadius: "8px" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
                fontFamily: "var(--font-body)",
              }}
            >
              <thead>
                <tr style={{ background: CARD, borderBottom: `1px solid ${BORDER}` }}>
                  <th style={{ padding: "16px", textAlign: "left", color: GOLD, fontWeight: 700, minWidth: "280px" }}>
                    Venue Name
                  </th>
                  <th style={{ padding: "16px", textAlign: "left", color: MUTED, fontWeight: 600, minWidth: "120px" }}>
                    Location
                  </th>
                  <th style={{ padding: "16px", textAlign: "left", color: MUTED, fontWeight: 600, minWidth: "100px" }}>
                    Price
                  </th>
                  <th style={{ padding: "16px", textAlign: "left", color: MUTED, fontWeight: 600, minWidth: "100px" }}>
                    Capacity
                  </th>
                  <th style={{ padding: "16px", textAlign: "left", color: MUTED, fontWeight: 600, minWidth: "100px" }}>
                    Rating
                  </th>
                  <th style={{ padding: "16px", textAlign: "left", color: MUTED, fontWeight: 600, minWidth: "100px" }}>
                    Style
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((item, idx) => (
                  <tr
                    key={item.id}
                    style={{
                      background: idx % 2 === 0 ? "transparent" : `rgba(201,168,76,0.03)`,
                      borderBottom: idx < sortedItems.length - 1 ? `1px solid ${BORDER}` : "none",
                    }}
                  >
                    <td style={{ padding: "16px", color: TEXT, fontWeight: 500 }}>
                      {item.name}
                    </td>
                    <td style={{ padding: "16px", color: MUTED }}>
                      {item.city || item.region || "—"}
                    </td>
                    <td style={{ padding: "16px", color: GOLD, fontWeight: 500 }}>
                      {item.price || "—"}
                    </td>
                    <td style={{ padding: "16px", color: MUTED }}>
                      {item.capacity ? `${item.capacity}` : "—"}
                    </td>
                    <td style={{ padding: "16px", color: MUTED }}>
                      {item.rating ? `${item.rating.toFixed(1)}/5` : "—"}
                    </td>
                    <td style={{ padding: "16px", color: MUTED }}>
                      {item.style || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
