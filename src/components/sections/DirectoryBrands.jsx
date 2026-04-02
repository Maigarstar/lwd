// ─── src/components/sections/DirectoryBrands.jsx ──────────────────────────────
import { useMemo, useState, useEffect } from "react";
import { useTheme } from "../../theme/ThemeContext";
import { REGIONS } from "../../data/italyVenues";
import { countrySlugFromGroup } from "../../data/geo.js";
import { supabase } from "../../lib/supabaseClient.js";

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

// ── International destinations ─────────────────────────────────────────────
// Each entry: { name, slug, enabled }
// enabled = true → clickable link to /{slug} country page
// enabled = false → displayed but not clickable (coming soon)
const INTL_DESTINATIONS = [
  { name: "Antigua", slug: "antigua", enabled: false },
  { name: "Argentina", slug: "argentina", enabled: false },
  { name: "Australia", slug: "australia", enabled: false },
  { name: "Austria", slug: "austria", enabled: false },
  { name: "Bahamas", slug: "bahamas", enabled: false },
  { name: "Bali", slug: "bali", enabled: false },
  { name: "Barbados", slug: "barbados", enabled: false },
  { name: "Belgium", slug: "belgium", enabled: false },
  { name: "Bermuda", slug: "bermuda", enabled: false },
  { name: "Brazil", slug: "brazil", enabled: false },
  { name: "Cambodia", slug: "cambodia", enabled: true },
  { name: "Canada", slug: "canada", enabled: false },
  { name: "Caribbean", slug: "caribbean", enabled: false },
  { name: "Colombia", slug: "colombia", enabled: false },
  { name: "Costa Rica", slug: "costa-rica", enabled: false },
  { name: "Croatia", slug: "croatia", enabled: false },
  { name: "Cyprus", slug: "cyprus", enabled: false },
  { name: "Czech Republic", slug: "czech-republic", enabled: false },
  { name: "Denmark", slug: "denmark", enabled: false },
  { name: "Dominican Republic", slug: "dominican-republic", enabled: false },
  { name: "Dubai", slug: "dubai", enabled: false },
  { name: "Egypt", slug: "egypt", enabled: false },
  { name: "England", slug: "england", enabled: true },
  { name: "Fiji", slug: "fiji", enabled: false },
  { name: "Finland", slug: "finland", enabled: false },
  { name: "France", slug: "france", enabled: true },
  { name: "Germany", slug: "germany", enabled: false },
  { name: "Greece", slug: "greece", enabled: false },
  { name: "Grenada", slug: "grenada", enabled: false },
  { name: "Hawaii", slug: "hawaii", enabled: false },
  { name: "Hungary", slug: "hungary", enabled: true },
  { name: "Iceland", slug: "iceland", enabled: false },
  { name: "India", slug: "india", enabled: false },
  { name: "Indonesia", slug: "indonesia", enabled: false },
  { name: "Ireland", slug: "ireland", enabled: true },
  { name: "Israel", slug: "israel", enabled: false },
  { name: "Italy", slug: "italy", enabled: true },
  { name: "Jamaica", slug: "jamaica", enabled: false },
  { name: "Japan", slug: "japan", enabled: false },
  { name: "Kenya", slug: "kenya", enabled: false },
  { name: "Maldives", slug: "maldives", enabled: false },
  { name: "Malta", slug: "malta", enabled: false },
  { name: "Mauritius", slug: "mauritius", enabled: false },
  { name: "Mexico", slug: "mexico", enabled: false },
  { name: "Monaco", slug: "monaco", enabled: false },
  { name: "Montenegro", slug: "montenegro", enabled: false },
  { name: "Morocco", slug: "morocco", enabled: false },
  { name: "Netherlands", slug: "netherlands", enabled: false },
  { name: "New Zealand", slug: "new-zealand", enabled: false },
  { name: "Norway", slug: "norway", enabled: false },
  { name: "Peru", slug: "peru", enabled: false },
  { name: "Philippines", slug: "philippines", enabled: false },
  { name: "Poland", slug: "poland", enabled: false },
  { name: "Portugal", slug: "portugal", enabled: false },
  { name: "Puerto Rico", slug: "puerto-rico", enabled: false },
  { name: "Saint Lucia", slug: "saint-lucia", enabled: false },
  { name: "Santorini", slug: "santorini", enabled: false },
  { name: "Scotland", slug: "scotland", enabled: false },
  { name: "Seychelles", slug: "seychelles", enabled: false },
  { name: "Singapore", slug: "singapore", enabled: false },
  { name: "South Africa", slug: "south-africa", enabled: false },
  { name: "Spain", slug: "spain", enabled: false },
  { name: "Sri Lanka", slug: "sri-lanka", enabled: false },
  { name: "Sweden", slug: "sweden", enabled: false },
  { name: "Switzerland", slug: "switzerland", enabled: false },
  { name: "Tanzania", slug: "tanzania", enabled: false },
  { name: "Thailand", slug: "thailand", enabled: false },
  { name: "Turkey", slug: "turkey", enabled: false },
  { name: "Turks & Caicos", slug: "turks-and-caicos", enabled: false },
  { name: "USA", slug: "usa", enabled: true },
  { name: "Vietnam", slug: "vietnam", enabled: false },
  { name: "Wales", slug: "wales", enabled: false },
];

// ── Split array into N columns ──────────────────────────────────────────────
function toColumns(arr, n) {
  const size = Math.ceil(arr.length / n);
  return Array.from({ length: n }, (_, i) => arr.slice(i * size, (i + 1) * size));
}

export default function DirectoryBrands({ onViewRegion, onViewCategory, onViewUSA, onViewItaly, onViewCountry, showInternational = true, showUK = true, showItaly = false, showUSA = false, darkMode = false, liveRegions = [] }) {
  const C = useTheme();

  // Fetch country slugs with at least one published listing from Supabase
  const [enabledSlugs, setEnabledSlugs] = useState(new Set());
  useEffect(() => {
    if (!supabase) return;
    supabase
      .from('listings')
      .select('country_slug')
      .eq('status', 'published')
      .then(({ data }) => {
        if (data) {
          setEnabledSlugs(new Set(data.map(r => r.country_slug).filter(Boolean)));
        }
      });
  }, []);

  const cols = toColumns(INTL_DESTINATIONS, 4);

  // Pre-index REGIONS by name for O(1) lookup (shared by UK + Italy)
  const byName = useMemo(() => new Map(REGIONS.map((r) => [r.name, r])), []);

  // Slugs of regions with live listings — used to filter UK/Italy columns
  const liveRegionSlugs = useMemo(() => new Set(liveRegions.map(r => r.slug)), [liveRegions]);

  // Build region objects for each column from REGIONS (single source of truth)
  const ukColumns = useMemo(() => {
    return COLUMN_DEFS.map((col) => ({
      title: col.title,
      regions: col.pick
        .map((name) => byName.get(name))
        .filter(Boolean)
        // When liveRegionSlugs available, only show regions with live listings
        .filter(r => liveRegionSlugs.size === 0 || liveRegionSlugs.has(r.slug)),
    }))
    // Remove empty columns
    .filter(col => col.regions.length > 0);
  }, [byName, liveRegionSlugs]);

  const italyColumns = useMemo(() => {
    return ITALY_COLUMN_DEFS.map((col) => ({
      title: col.title,
      regions: col.pick
        .map((name) => byName.get(name))
        .filter(Boolean)
        .filter(r => liveRegionSlugs.size === 0 || liveRegionSlugs.has(r.slug)),
    }))
    .filter(col => col.regions.length > 0);
  }, [byName, liveRegionSlugs]);

  // Shared renderer for a region directory grid (UK or Italy)
  const renderRegionGrid = (columns, label, subtitle) => (
    <section
      aria-label={`${label} regions directory`}
      className="home-directory-section"
      style={{
        background: darkMode ? C.dark : "#f2f0ea",
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

  // Generic region renderer — flat list for countries without predefined column groups
  // Used for France, Hungary, Ireland, and any other country with live listings
  const renderGenericRegions = (regions, countryLabel) => {
    if (!regions || regions.length === 0) return null;
    return (
      <section
        aria-label={`${countryLabel} regions directory`}
        className="home-directory-section"
        style={{
          background: darkMode ? C.dark : "#f2f0ea",
          borderTop: `1px solid ${C.border}`,
          padding: "80px 60px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 28, height: 1, background: C.gold }} />
              <span style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: C.gold, fontWeight: 600 }}>
                {countryLabel}
              </span>
              <div style={{ width: 28, height: 1, background: C.gold }} />
            </div>
            <h2 style={{ fontFamily: GD, fontSize: "clamp(26px, 3vw, 36px)", fontWeight: 400, color: C.off, lineHeight: 1.2, margin: 0 }}>
              Browse by <span style={{ fontStyle: "italic", color: C.gold }}>Region</span>
            </h2>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 48px", justifyContent: "center", maxWidth: 800, margin: "0 auto" }}>
            {regions.map(region => (
              <button
                key={region.slug}
                onClick={() => onViewRegion?.(region.countrySlug, region.slug)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: NU, fontSize: 14, fontWeight: 400, color: C.grey,
                  padding: "6px 0", transition: "color 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = C.gold)}
                onMouseLeave={e => (e.currentTarget.style.color = C.grey)}
              >
                {region.name}
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  };

  // Search-based grid renderer (for USA, destinations not yet in geo.js)
  const renderSearchGrid = (columnDefs, label, subtitle) => (
    <section
      aria-label={`${label} destinations directory`}
      className="home-directory-section"
      style={{
        background: darkMode ? C.dark : "#f2f0ea",
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

  // Generic section shows for any country that's not UK/Italy/USA but has live regions
  const showGeneric = !showUK && !showItaly && !showUSA && liveRegions.length > 0;

  return (
    <>
      {/* ── UK Regions — only regions with live listings ──────────────────── */}
      {showUK && ukColumns.length > 0 && renderRegionGrid(ukColumns, "UK, Scotland & Ireland")}

      {/* ── Italy Regions — only regions with live listings ───────────────── */}
      {showItaly && italyColumns.length > 0 && renderRegionGrid(italyColumns, "Italy", (<>Browse Italian <span style={{ fontStyle: "italic", color: C.gold }}>Regions</span></>))}

      {/* ── USA Destinations ──────────────────────────────────────────────── */}
      {showUSA && renderSearchGrid(USA_COLUMN_DEFS, "United States", (<>Browse American <span style={{ fontStyle: "italic", color: C.gold }}>Destinations</span></>))}

      {/* ── Generic country regions (France, Hungary, Ireland, etc.) ─────── */}
      {showGeneric && renderGenericRegions(liveRegions, liveRegions[0]?.countrySlug?.charAt(0).toUpperCase() + liveRegions[0]?.countrySlug?.slice(1) || "Regions")}

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
                  {col.map((item) => {
                    const enabled = enabledSlugs.has(item.slug);
                    const handleClick = () => {
                      if (!enabled) return;
                      if (onViewCountry) return onViewCountry(item.slug);
                      if (item.slug === "usa" && onViewUSA) return onViewUSA();
                      if (item.slug === "italy" && onViewItaly) return onViewItaly();
                      onViewCategory?.({ searchQuery: item.name });
                    };
                    return (
                      <li key={item.name}>
                        <button
                          onClick={handleClick}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: enabled ? "pointer" : "default",
                            fontFamily: NU,
                            fontSize: 13,
                            fontWeight: 400,
                            color: enabled ? C.grey : C.muted || "rgba(128,128,128,0.45)",
                            padding: "5px 0",
                            display: "block",
                            width: "100%",
                            textAlign: "left",
                            transition: "color 0.2s",
                          }}
                          onMouseEnter={(e) => { if (enabled) e.currentTarget.style.color = C.gold; }}
                          onMouseLeave={(e) => { if (enabled) e.currentTarget.style.color = C.grey; }}
                        >
                          {item.name}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ))}
            </div>

          </div>
        </section>
      )}

    </>
  );
}
