// ─── src/components/sections/DirectoryBrands.jsx ──────────────────────────────
import { useMemo } from "react";
import { useTheme } from "../../theme/ThemeContext";
import { REGIONS } from "../../data/italyVenues";
import { countrySlugFromGroup } from "../../data/geo.js";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

// ── UK column layout definitions (display grouping for the 4-column grid) ────
// Each column pulls regions from specific REGIONS groups.
const COLUMN_DEFS = [
  {
    title: "Sth East & London",
    groups: ["England"],
    pick: ["London","Surrey","Kent","Sussex","Hampshire","Berkshire","Buckinghamshire","Oxfordshire","Essex","Hertfordshire"],
  },
  {
    title: "Sth West & East",
    groups: ["England"],
    pick: ["Devon","Cornwall","Somerset","Dorset","Wiltshire","Gloucestershire","Suffolk","Norfolk","Cambridgeshire","Bristol"],
  },
  {
    title: "Midlands & North",
    groups: ["England"],
    pick: ["Warwickshire","Staffordshire","Cheshire","Manchester","Lancashire","Derbyshire","Leicestershire","Nottinghamshire","Shropshire","Liverpool"],
  },
  {
    title: "Yorkshire & Nations",
    groups: ["England","Scotland","Wales","Northern Ireland","Ireland"],
    pick: ["Yorkshire","Northumberland","Durham","Cumbria","Edinburgh","Highlands","Cardiff","Pembrokeshire","Belfast","Dublin"],
  },
];

// ── Italy column layout definitions ──────────────────────────────────────────
const ITALY_COLUMN_DEFS = [
  {
    title: "Lakes & North",
    groups: ["Italy"],
    pick: ["Lake Como","Lake Garda","Lake Maggiore","Dolomites","Trentino-Alto Adige","Friuli Venezia Giulia"],
  },
  {
    title: "Cities & Riviera",
    groups: ["Italy"],
    pick: ["Milan","Venice","Rome","Italian Riviera","Piedmont","Valle d'Aosta"],
  },
  {
    title: "Tuscany & Central",
    groups: ["Italy"],
    pick: ["Tuscany","Umbria","Emilia-Romagna","Marche","Abruzzo","Basilicata"],
  },
  {
    title: "South & Islands",
    groups: ["Italy"],
    pick: ["Amalfi Coast","Puglia","Capri","Ischia","Sicily","Sardinia","Calabria"],
  },
];

// ── USA column layout definitions (search-based, not yet in geo.js) ────────
const USA_COLUMN_DEFS = [
  {
    title: "Northeast",
    pick: ["New York","The Hamptons","Hudson Valley","Martha's Vineyard","Cape Cod","Connecticut","Vermont","Maine"],
  },
  {
    title: "Southeast",
    pick: ["Florida","Palm Beach","Miami","Charleston","Savannah","Nashville","New Orleans","Puerto Rico"],
  },
  {
    title: "West Coast",
    pick: ["California","Napa Valley","Los Angeles","San Francisco","Big Sur","Santa Barbara","Lake Tahoe","Hawaii"],
  },
  {
    title: "Mountain & Central",
    pick: ["Aspen","Scottsdale","Sedona","Jackson Hole","Park City","Austin","Chicago","Dallas"],
  },
];

// ── International destinations (display only, hover, no navigation yet) ────
const INTL_DESTINATIONS = [
  "Antigua", "Argentina", "Australia", "Austria", "Bahamas", "Bali",
  "Barbados", "Belgium", "Bermuda", "Brazil", "Canada", "Caribbean",
  "Colombia", "Costa Rica", "Croatia", "Cyprus", "Czech Republic",
  "Denmark", "Dominican Republic", "Dubai", "Egypt", "Fiji",
  "Finland", "France", "Germany", "Greece", "Grenada",
  "Hawaii", "Hungary", "Iceland", "India", "Indonesia",
  "Ireland", "Israel", "Italy", "Jamaica", "Japan",
  "Kenya", "Maldives", "Malta", "Mauritius", "Mexico",
  "Monaco", "Montenegro", "Morocco", "Netherlands", "New Zealand",
  "Norway", "Peru", "Philippines", "Poland", "Portugal",
  "Puerto Rico", "Saint Lucia", "Santorini", "Scotland", "Seychelles",
  "Singapore", "South Africa", "Spain", "Sri Lanka", "Sweden",
  "Switzerland", "Tanzania", "Thailand", "Turkey", "Turks & Caicos",
  "USA", "Vietnam", "Wales",
];

// ── Split array into N columns ──────────────────────────────────────────────
function toColumns(arr, n) {
  const size = Math.ceil(arr.length / n);
  return Array.from({ length: n }, (_, i) => arr.slice(i * size, (i + 1) * size));
}

export default function DirectoryBrands({ onViewRegion, onViewCategory, onViewUSA, onViewItaly, showInternational = true, showUK = true, showItaly = false, showUSA = false }) {
  const C = useTheme();
  const cols = toColumns(INTL_DESTINATIONS, 4);

  // Pre-index REGIONS by name for O(1) lookup (shared by UK + Italy)
  const byName = useMemo(() => new Map(REGIONS.map((r) => [r.name, r])), []);

  // Build region objects for each column from REGIONS (single source of truth)
  const ukColumns = useMemo(() => {
    return COLUMN_DEFS.map((col) => ({
      title: col.title,
      regions: col.pick
        .map((name) => byName.get(name))
        .filter(Boolean),
    }));
  }, [byName]);

  const italyColumns = useMemo(() => {
    return ITALY_COLUMN_DEFS.map((col) => ({
      title: col.title,
      regions: col.pick
        .map((name) => byName.get(name))
        .filter(Boolean),
    }));
  }, [byName]);

  // Shared renderer for a region directory grid (UK or Italy)
  const renderRegionGrid = (columns, label, subtitle) => (
    <section
      aria-label={`${label} regions directory`}
      className="home-directory-section"
      style={{
        background: C.dark,
        borderTop: `1px solid ${C.border}`,
        padding: "80px 60px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Section heading */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ width: 28, height: 1, background: C.gold }} />
            <span
              style={{
                fontFamily: NU,
                fontSize: 9,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: C.gold,
                fontWeight: 600,
              }}
            >
              {label}
            </span>
            <div style={{ width: 28, height: 1, background: C.gold }} />
          </div>
          <h2
            style={{
              fontFamily: GD,
              fontSize: "clamp(26px, 3vw, 36px)",
              fontWeight: 400,
              color: C.off,
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            {subtitle || (<>Browse by <span style={{ fontStyle: "italic", color: C.gold }}>Region</span></>)}
          </h2>
        </div>

        {/* Region columns */}
        <div
          className="home-directory-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 40,
          }}
        >
          {columns.map((col) => (
            <div key={col.title}>
              <h3
                style={{
                  fontFamily: NU,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: C.off,
                  marginBottom: 16,
                  paddingBottom: 10,
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                {col.title}
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {col.regions.map((region) => (
                  <li key={region.slug}>
                    <button
                      onClick={() => onViewRegion?.(countrySlugFromGroup(region.group), region.slug)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: NU,
                        fontSize: 13,
                        fontWeight: 400,
                        color: C.grey,
                        padding: "5px 0",
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = C.gold)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = C.grey)}
                    >
                      {region.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  // Search-based grid renderer (for USA, destinations not yet in geo.js)
  const renderSearchGrid = (columnDefs, label, subtitle) => (
    <section
      aria-label={`${label} destinations directory`}
      className="home-directory-section"
      style={{
        background: C.dark,
        borderTop: `1px solid ${C.border}`,
        padding: "80px 60px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ width: 28, height: 1, background: C.gold }} />
            <span
              style={{
                fontFamily: NU,
                fontSize: 9,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: C.gold,
                fontWeight: 600,
              }}
            >
              {label}
            </span>
            <div style={{ width: 28, height: 1, background: C.gold }} />
          </div>
          <h2
            style={{
              fontFamily: GD,
              fontSize: "clamp(26px, 3vw, 36px)",
              fontWeight: 400,
              color: C.off,
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            {subtitle}
          </h2>
        </div>

        <div
          className="home-directory-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 40,
          }}
        >
          {columnDefs.map((col) => (
            <div key={col.title}>
              <h3
                style={{
                  fontFamily: NU,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: C.off,
                  marginBottom: 16,
                  paddingBottom: 10,
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                {col.title}
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {col.pick.map((dest) => (
                  <li key={dest}>
                    <button
                      onClick={() => onViewCategory?.({ searchQuery: dest })}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: NU,
                        fontSize: 13,
                        fontWeight: 400,
                        color: C.grey,
                        padding: "5px 0",
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = C.gold)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = C.grey)}
                    >
                      {dest}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  return (
    <>
      {/* ── UK Regions ────────────────────────────────────────────────────── */}
      {showUK && renderRegionGrid(ukColumns, "UK, Scotland & Ireland")}

      {/* ── Italy Regions ─────────────────────────────────────────────────── */}
      {showItaly && renderRegionGrid(italyColumns, "Italy", (<>Browse Italian <span style={{ fontStyle: "italic", color: C.gold }}>Regions</span></>))}

      {/* ── USA Destinations ──────────────────────────────────────────────── */}
      {showUSA && renderSearchGrid(USA_COLUMN_DEFS, "United States", (<>Browse American <span style={{ fontStyle: "italic", color: C.gold }}>Destinations</span></>))}

      {/* ── International Destinations ─────────────────────────────────── */}
      {showInternational && (
        <section
          aria-label="International destinations directory"
          className="home-directory-section"
          style={{
            background: C.card,
            borderTop: `1px solid ${C.border}`,
            padding: "80px 60px",
          }}
        >
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            {/* Heading */}
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div style={{ width: 28, height: 1, background: C.gold }} />
                <span
                  style={{
                    fontFamily: NU,
                    fontSize: 9,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: C.gold,
                    fontWeight: 600,
                  }}
                >
                  Worldwide
                </span>
                <div style={{ width: 28, height: 1, background: C.gold }} />
              </div>
              <h2
                style={{
                  fontFamily: GD,
                  fontSize: "clamp(26px, 3vw, 36px)",
                  fontWeight: 400,
                  color: C.off,
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                Browse Iconic{" "}
                <span style={{ fontStyle: "italic", color: C.gold }}>Destinations</span>
              </h2>
            </div>

            {/* Country columns */}
            <div
              className="home-intl-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 40,
              }}
            >
              {cols.map((col, ci) => (
                <ul key={ci} style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {col.map((country) => (
                    <li key={country}>
                      <button
                        onClick={() => country === "USA" && onViewUSA ? onViewUSA() : country === "Italy" && onViewItaly ? onViewItaly() : onViewCategory?.({ searchQuery: country })}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontFamily: NU,
                          fontSize: 13,
                          fontWeight: 400,
                          color: C.grey,
                          padding: "5px 0",
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = C.gold)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = C.grey)}
                      >
                        {country}
                      </button>
                    </li>
                  ))}
                </ul>
              ))}
            </div>

          </div>
        </section>
      )}

    </>
  );
}
