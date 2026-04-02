// ─── src/pages/LocationStudio/LocationStudioModule.jsx ────────────────────────
// Location Studio — list view + builder switcher
// Handles both page types: Location Hub and Location Category
import { useState, useEffect } from "react";
import LocationBuilder from "./LocationBuilder";
import { fetchAllLocations, deleteLocationContent } from "../../services/locationContentService";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

// ── Helpers ───────────────────────────────────────────────────────────────────
function labelFromKey(key) {
  if (!key) return "—";
  const parts = key.split(":");
  return parts.slice(1).join(" › ").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function pageTypeLabel(pt) {
  return pt === "category" ? "Location Category" : "Location Hub";
}

const PAGE_TYPE_BADGE = {
  hub:      { bg: "rgba(201,168,76,0.15)", color: "#C9A84C", label: "Hub" },
  category: { bg: "rgba(100,180,120,0.15)", color: "#5fad7a", label: "Category" },
};

// ─────────────────────────────────────────────────────────────────────────────
export default function LocationStudioModule({ C, NU: _NU, GD: _GD, darkMode }) {
  const [screen, setScreen] = useState("list"); // "list" | "builder" | "new"
  const [editRecord, setEditRecord] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all"); // "all" | "hub" | "category"
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const th = C || {};

  useEffect(() => {
    loadLocations();
  }, []);

  async function loadLocations() {
    setLoading(true);
    const rows = await fetchAllLocations();
    setLocations(rows);
    setLoading(false);

    // Auto-open builder if navigated from front-end "Edit in Studio" button
    const editKey = sessionStorage.getItem("lwd_location_edit_key");
    if (editKey) {
      sessionStorage.removeItem("lwd_location_edit_key");
      const found = rows.find((r) => r.location_key === editKey);
      if (found) {
        setEditRecord(found);
        setScreen("builder");
      } else {
        // No DB record yet — open new builder so admin can create it
        setEditRecord({ location_key: editKey, _fromFrontEnd: true });
        setScreen("new");
      }
    }
  }

  const filtered = locations.filter((r) => {
    if (filterType === "all") return true;
    return (r.page_type || "hub") === filterType;
  });

  function handleEdit(record) {
    setEditRecord(record);
    setScreen("builder");
  }

  function handleNew() {
    setEditRecord(null);
    setScreen("new");
  }

  async function handleDelete(locationKey) {
    await deleteLocationContent(locationKey);
    setDeleteConfirm(null);
    await loadLocations();
  }

  // ── Builder screen ────────────────────────────────────────────────────────
  if (screen === "builder" || screen === "new") {
    return (
      <LocationBuilder
        record={editRecord}
        darkMode={darkMode}
        C={th}
        onBack={() => { setScreen("list"); loadLocations(); }}
      />
    );
  }

  // ── List screen ───────────────────────────────────────────────────────────
  const labelStyle = {
    fontFamily: NU,
    fontSize: 11,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: th.gold,
    fontWeight: 600,
    marginBottom: 4,
  };

  const rowStyle = (i) => ({
    display: "grid",
    gridTemplateColumns: "1fr 120px 100px 80px 100px",
    alignItems: "center",
    gap: 16,
    padding: "14px 20px",
    background: i % 2 === 0 ? th.card : "transparent",
    border: `1px solid ${th.border}`,
    borderRadius: 3,
    marginBottom: 4,
    cursor: "pointer",
    transition: "background 0.15s",
  });

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <p style={{ fontFamily: GD, fontSize: "clamp(20px,2vw,28px)", fontWeight: 300, fontStyle: "italic", color: th.grey, margin: "0 0 4px" }}>
            Location Studio
          </p>
          <p style={{ fontFamily: NU, fontSize: 13, color: th.grey, opacity: 0.6, margin: 0 }}>
            Manage content for city, region, country, and category pages.
          </p>
        </div>
        <button
          onClick={handleNew}
          style={{
            fontFamily: NU, fontSize: 12, fontWeight: 600, letterSpacing: "0.1em",
            textTransform: "uppercase", padding: "10px 22px",
            background: th.off, color: th.black, border: "none", borderRadius: 3,
            cursor: "pointer",
          }}
        >
          + New Location
        </button>
      </div>

      {/* ── Filter tabs ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["all", "hub", "category"].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            style={{
              fontFamily: NU, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase",
              padding: "6px 16px",
              background: filterType === t ? th.gold : "transparent",
              color: filterType === t ? th.black : th.grey,
              border: `1px solid ${filterType === t ? th.gold : th.border}`,
              borderRadius: 3, cursor: "pointer",
            }}
          >
            {t === "all" ? "All" : pageTypeLabel(t)}
          </button>
        ))}
      </div>

      {/* ── Column headers ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px 80px 100px", gap: 16, padding: "8px 20px", marginBottom: 8 }}>
        {["Location", "Page Type", "Type", "Status", "Actions"].map((h) => (
          <span key={h} style={{ ...labelStyle, marginBottom: 0 }}>{h}</span>
        ))}
      </div>

      {/* ── Rows ── */}
      {loading ? (
        <p style={{ fontFamily: NU, fontSize: 13, color: th.grey, opacity: 0.5, padding: "32px 20px" }}>
          Loading locations…
        </p>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "48px 20px", textAlign: "center" }}>
          <p style={{ fontFamily: GD, fontSize: 18, fontStyle: "italic", color: th.grey, opacity: 0.5, margin: "0 0 8px" }}>
            No locations yet.
          </p>
          <p style={{ fontFamily: NU, fontSize: 13, color: th.grey, opacity: 0.4, margin: 0 }}>
            Click "New Location" to create your first location page.
          </p>
        </div>
      ) : (
        filtered.map((row, i) => {
          const pt = row.page_type || "hub";
          const badge = PAGE_TYPE_BADGE[pt] || PAGE_TYPE_BADGE.hub;
          return (
            <div
              key={row.location_key}
              style={rowStyle(i)}
              onClick={() => handleEdit(row)}
              onMouseEnter={(e) => (e.currentTarget.style.background = th.goldDim)}
              onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? th.card : "transparent")}
            >
              {/* Location name */}
              <div>
                <p style={{ fontFamily: NU, fontSize: 14, color: th.off, margin: "0 0 2px", fontWeight: 500 }}>
                  {row.hero_title || labelFromKey(row.location_key)}
                </p>
                <p style={{ fontFamily: NU, fontSize: 11, color: th.grey, opacity: 0.5, margin: 0 }}>
                  {row.location_key}
                </p>
              </div>
              {/* Page type */}
              <span style={{
                fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", padding: "3px 10px", borderRadius: 2,
                background: badge.bg, color: badge.color,
              }}>
                {badge.label}
              </span>
              {/* Location type */}
              <span style={{ fontFamily: NU, fontSize: 11, color: th.grey, opacity: 0.7, textTransform: "capitalize" }}>
                {row.location_type}
              </span>
              {/* Published */}
              <span style={{
                fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", padding: "3px 10px", borderRadius: 2,
                background: row.published ? "rgba(95,173,122,0.15)" : "rgba(180,100,100,0.15)",
                color: row.published ? "#5fad7a" : "#c46060",
              }}>
                {row.published ? "Live" : "Draft"}
              </span>
              {/* Actions */}
              <div style={{ display: "flex", gap: 8 }} onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleEdit(row)}
                  style={{
                    fontFamily: NU, fontSize: 10, fontWeight: 600, letterSpacing: "0.1em",
                    textTransform: "uppercase", padding: "4px 12px",
                    background: "transparent", color: th.gold,
                    border: `1px solid ${th.gold}`, borderRadius: 2, cursor: "pointer",
                  }}
                >
                  Edit
                </button>
                {deleteConfirm === row.location_key ? (
                  <>
                    <button
                      onClick={() => handleDelete(row.location_key)}
                      style={{
                        fontFamily: NU, fontSize: 10, fontWeight: 600,
                        padding: "4px 10px", background: "#c46060", color: "#fff",
                        border: "none", borderRadius: 2, cursor: "pointer",
                      }}
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      style={{
                        fontFamily: NU, fontSize: 10, padding: "4px 8px",
                        background: "transparent", color: th.grey,
                        border: `1px solid ${th.border}`, borderRadius: 2, cursor: "pointer",
                      }}
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(row.location_key)}
                    style={{
                      fontFamily: NU, fontSize: 10, padding: "4px 10px",
                      background: "transparent", color: th.grey,
                      border: `1px solid ${th.border}`, borderRadius: 2, cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
