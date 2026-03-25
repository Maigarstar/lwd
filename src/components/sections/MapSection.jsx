// ─── src/components/sections/MapSection.jsx ──────────────────────────────────
// Smart interactive map using Leaflet with real venue + vendor markers.
// Loads Leaflet from CDN, creates clustered pins, popups, and auto-bounds.
import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "../../theme/ThemeContext";
import Stars from "../ui/Stars";

const NU = "var(--font-body)";
const GD = "var(--font-heading-primary)";

// ── Leaflet CDN URLs ─────────────────────────────────────────────────────────
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS  = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

// ── Gold SVG marker factory ──────────────────────────────────────────────────
function makeIcon(L, color = "#1a1a1a", size = 28) {
  const s = size;
  const h = Math.round(s * 1.35);
  return L.divIcon({
    className: "",
    iconSize:    [s, h],
    iconAnchor:  [s / 2, h],
    popupAnchor: [0, -(h - 4)],
    html: `<svg viewBox="0 0 28 38" width="${s}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <filter id="pin-shadow" x="-30%" y="-10%" width="160%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.25)"/>
      </filter>
      <path d="M14 1C7.1 1 1.5 6.6 1.5 13.5c0 4.2 2 7.9 5.1 10.3L14 37l7.4-13.2A12.4 12.4 0 0 0 26.5 13.5C26.5 6.6 20.9 1 14 1z"
        fill="${color}" filter="url(#pin-shadow)"/>
      <circle cx="14" cy="13.5" r="4.5" fill="white" opacity="0.95"/>
    </svg>`,
  });
}

// ── Geocode cache (session-scoped, avoids re-fetching same address) ───────────
const geocodeCache = {};

/** Convert slug like "italy" → "Italy", "tuscany" → "Tuscany" */
function humanise(str) {
  if (!str) return "";
  return str.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Build candidate query strings, most-specific first.
 * Nominatim is tried with each until a result is found.
 */
function buildGeoQueries(item) {
  const name    = item.name    || "";
  const address = item.address || "";
  const city    = humanise(item.city    || item.citySlug    || "");
  const region  = humanise(item.region  || item.regionSlug  || "");
  const country = humanise(item.country || item.countrySlug || "");

  const candidates = [];

  // 1. Full address + city + country
  if (address && city && country)  candidates.push(`${address}, ${city}, ${country}`);
  // 2. Address + country
  if (address && country)          candidates.push(`${address}, ${country}`);
  // 3. Venue name + city + region
  if (name && city && region)      candidates.push(`${name}, ${city}, ${region}`);
  // 4. Venue name + region + country
  if (name && region && country)   candidates.push(`${name}, ${region}, ${country}`);
  // 5. Venue name + country alone
  if (name && country)             candidates.push(`${name}, ${country}`);
  // 6. City + region + country
  if (city && region && country)   candidates.push(`${city}, ${region}, ${country}`);
  // 7. Region + country
  if (region && country)           candidates.push(`${region}, ${country}`);
  // 8. Country alone (last resort)
  if (country)                     candidates.push(country);

  return [...new Set(candidates)]; // deduplicate
}

/**
 * Geocode a single item via Nominatim (OSM, free, no key).
 * Tries candidate queries from most- to least-specific.
 * Returns { lat, lng } or null on failure.
 * Rate-limited: 1 req per 300 ms (Nominatim fair-use policy).
 */
let _lastGeoTime = 0;
async function geocodeItem(item) {
  if (item.lat && item.lng) return { lat: item.lat, lng: item.lng };

  const queries = buildGeoQueries(item);
  if (!queries.length) return null;

  for (const q of queries) {
    if (geocodeCache[q] === null) continue;           // known miss, skip
    if (geocodeCache[q])          return geocodeCache[q]; // cache hit

    // Throttle
    const wait = Math.max(0, 300 - (Date.now() - _lastGeoTime));
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    _lastGeoTime = Date.now();

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
        { headers: { "Accept-Language": "en" } }
      );
      const json = await res.json();
      if (json?.[0]) {
        const coords = { lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) };
        geocodeCache[q] = coords;
        console.log(`[map] ✓ Geocoded "${item.name}" via "${q}" → ${coords.lat}, ${coords.lng}`);
        return coords;
      }
      geocodeCache[q] = null; // cache miss so we don't retry
    } catch (err) {
      console.warn(`[map] geocode failed for "${q}":`, err.message);
    }
  }
  console.warn(`[map] ✗ Could not geocode "${item.name}" — no location fields found`);
  return null;
}

/**
 * Enrich an array of items with lat/lng via geocoding where missing.
 * Sequential to respect Nominatim's rate limit.
 */
async function enrichWithCoords(items) {
  const results = [];
  for (const item of items) {
    if (item.lat && item.lng) { results.push(item); continue; }
    const coords = await geocodeItem(item);
    results.push(coords ? { ...item, ...coords } : item);
  }
  return results;
}

// ── Load Leaflet dynamically ─────────────────────────────────────────────────
let leafletPromise = null;
function loadLeaflet() {
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve) => {
    if (window.L) { resolve(window.L); return; }
    // CSS
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet"; link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    // JS
    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.onload = () => resolve(window.L);
    document.head.appendChild(script);
  });
  return leafletPromise;
}

// ═════════════════════════════════════════════════════════════════════════════
export default function MapSection({
  venues = [],
  vendors = [],
  headerLabel,
  mapTitle,
  countryFilter = "Italy",
  onMarkerClick,
  lat,
  lng,
  zoom,
}) {
  const C = useTheme();
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const enrichedRef = useRef({ venues: [], vendors: [] }); // always-current coords
  const [ready,  setReady]  = useState(false);
  const [active, setActive] = useState(null);
  const [panelTab, setPanelTab] = useState("venues"); // "venues" | "vendors"
  const [enrichedVenues,  setEnrichedVenues]  = useState(venues);
  const [enrichedVendors, setEnrichedVendors] = useState(vendors);

  // Keep ref in sync so callbacks always see latest geocoded coords
  useEffect(() => {
    enrichedRef.current = { venues: enrichedVenues, vendors: enrichedVendors };
  }, [enrichedVenues, enrichedVendors]);

  const allItems = panelTab === "venues" ? enrichedVenues : enrichedVendors;

  // ── Single effect: init map + place pins + geocode missing coords ──────────
  useEffect(() => {
    let cancelled = false;

    function placeMarkers(L, map, items, icon, type) {
      const bounds = [];
      items.forEach((v) => {
        if (!v.lat || !v.lng) return;
        if (markersRef.current.find(m => m.id === v.id)) return; // dedup
        const marker = L.marker([v.lat, v.lng], { icon }).addTo(map);
        const priceLabel = type === "venue"
          ? `<div style="font-size:11px;color:#888;font-weight:600">${v.priceFrom || ""}</div>`
          : `<div style="font-size:10px;color:#555;font-weight:600;text-transform:uppercase;letter-spacing:1px">Vendor</div>`;
        marker.bindPopup(`
          <div style="font-family:system-ui;min-width:180px">
            <div style="font-size:13px;font-weight:600;margin-bottom:4px">${v.name}</div>
            <div style="font-size:11px;color:#666;margin-bottom:4px">${v.region || v.city || ""}${v.capacity ? " · " + v.capacity + " guests" : v.category ? " · " + v.category : ""}</div>
            ${priceLabel}
          </div>
        `, { closeButton: false, maxWidth: 240 });
        marker.on("click", () => { setActive(v.id); onMarkerClick?.(v.slug || v.id); });
        bounds.push([v.lat, v.lng]);
        markersRef.current.push({ id: v.id, marker, type });
      });
      return bounds;
    }

    loadLeaflet().then(async (L) => {
      if (cancelled || !mapEl.current) return;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      markersRef.current = [];

      // ── Init map ──
      const map = L.map(mapEl.current, {
        zoomControl: false, attributionControl: true, scrollWheelZoom: true,
      });
      mapRef.current = map;
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://carto.com">CARTO</a> &copy; <a href="https://osm.org/copyright">OSM</a>',
        maxZoom: 18,
      }).addTo(map);
      L.control.zoom({ position: "topleft" }).addTo(map);

      const venueIcon  = makeIcon(L, "#1a1a1a", 28);
      const vendorIcon = makeIcon(L, "#555555", 24);

      // ── Step 1: pin everything that already has coords (instant) ──
      const hasCoords   = (v) => v.lat && v.lng;
      const vImmediate  = venues.filter(hasCoords);
      const vdImmediate = vendors.filter(hasCoords);
      const vNeedsGeo   = venues.filter(v => !hasCoords(v));
      const vdNeedsGeo  = vendors.filter(v => !hasCoords(v));

      let bounds = [
        ...placeMarkers(L, map, vImmediate,  venueIcon,  "venue"),
        ...placeMarkers(L, map, vdImmediate, vendorIcon, "vendor"),
      ];

      // Update sidebar with what we have so far
      setEnrichedVenues([...vImmediate]);
      setEnrichedVendors([...vdImmediate]);

      // Fit bounds or fall back to country centre
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
      } else if (lat && lng) {
        map.setView([lat, lng], zoom || 7);
      } else {
        // Sensible country-level defaults
        const DEFAULT_CENTRES = {
          USA: [39.5, -98.35], usa: [39.5, -98.35],
          Italy: [42.5, 12.5], italy: [42.5, 12.5],
          France: [46.5, 2.3], france: [46.5, 2.3],
          UK: [54.0, -2.5], uk: [54.0, -2.5],
        };
        const centre = DEFAULT_CENTRES[countryFilter] || [42.5, 12.5];
        map.setView(centre, countryFilter === "USA" || countryFilter === "usa" ? 4 : 6);
      }

      setReady(true);

      // ── Step 2: geocode remaining venues progressively ──
      if (vNeedsGeo.length === 0 && vdNeedsGeo.length === 0) return;

      const geoVenues  = await enrichWithCoords(vNeedsGeo);
      if (cancelled || !mapRef.current) return;
      const geoVendors = await enrichWithCoords(vdNeedsGeo);
      if (cancelled || !mapRef.current) return;

      const newBounds = [
        ...placeMarkers(L, map, geoVenues,  venueIcon,  "venue"),
        ...placeMarkers(L, map, geoVendors, vendorIcon, "vendor"),
      ];

      setEnrichedVenues([...vImmediate,  ...geoVenues]);
      setEnrichedVendors([...vdImmediate, ...geoVendors]);

      const allBounds = [...bounds, ...newBounds];
      if (allBounds.length > 0 && mapRef.current) {
        mapRef.current.fitBounds(allBounds, { padding: [40, 40], maxZoom: 10 });
      }
    });

    return () => {
      cancelled = true;
      markersRef.current = [];
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [venues, vendors]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pan to marker / geocoded coords when sidebar item clicked ───────────
  const handleItemHover = useCallback((id) => {
    setActive(id);
    if (!mapRef.current) return;

    // 1. Try existing Leaflet marker (fastest)
    const entry = markersRef.current.find((m) => m.id === id);
    if (entry) {
      entry.marker.openPopup();
      mapRef.current.panTo(entry.marker.getLatLng(), { animate: true, duration: 0.5 });
      mapRef.current.setZoom(12, { animate: true });
      return;
    }

    // 2. Fall back to geocoded coords stored in enrichedRef (geocoding done but marker pending)
    const all = [...enrichedRef.current.venues, ...enrichedRef.current.vendors];
    const item = all.find((v) => v.id === id);
    if (item?.lat && item?.lng) {
      mapRef.current.panTo([item.lat, item.lng], { animate: true, duration: 0.5 });
      mapRef.current.setZoom(12, { animate: true });
    }
  }, []);

  const handleItemLeave = useCallback(() => {
    setActive(null);
    markersRef.current.forEach((m) => m.marker.closePopup());
  }, []);

  // ── Panel counts ──
  const venueCount  = enrichedVenues.length;
  const vendorCount = enrichedVendors.length;

  const defaultTitle = countryFilter === "USA"
    ? `Interactive Map · United States`
    : `Interactive Map · ${countryFilter}`;

  return (
    <section
      aria-label="Map view of venues and vendors"
      style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 48px 40px" }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 380px",
          gap: 0,
          border: `1px solid ${C.border}`,
          overflow: "hidden",
          height: 640,
          borderRadius: "var(--lwd-radius-image, 6px)",
        }}
      >
        {/* ══ Map ═════════════════════════════════════════════════════════ */}
        <div style={{ position: "relative", background: "#ffffff" }}>
          <div ref={mapEl} style={{ width: "100%", height: "100%" }} />

          {/* Loading overlay */}
          {!ready && (
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(255,255,255,0.95)", zIndex: 500,
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{
                  width: 32, height: 32, border: "2px solid #C9A84C", borderTop: "2px solid transparent",
                  borderRadius: "50%", animation: "lwd-spin 0.8s linear infinite", margin: "0 auto 12px",
                }} />
                <div style={{ fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: "#8B6914", fontFamily: NU }}>
                  Loading map...
                </div>
              </div>
              <style>{`@keyframes lwd-spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Map overlay header */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute", top: 0, left: 0, right: 0, zIndex: 400,
              padding: "14px 20px", pointerEvents: "none",
            }}
          >
            <div style={{
              fontSize: 10, letterSpacing: "3px", textTransform: "uppercase",
              color: "rgba(255,255,255,0.7)", fontWeight: 700, fontFamily: NU,
            }}>
              {mapTitle || defaultTitle}
            </div>
          </div>

          {/* Legend */}
          <div style={{
            position: "absolute", bottom: 36, left: 12, zIndex: 400,
            background: "rgba(4,3,2,0.8)", padding: "8px 14px",
            borderRadius: 4, border: "1px solid rgba(201,168,76,0.15)",
            display: "flex", gap: 14, alignItems: "center",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="10" height="13" viewBox="0 0 28 38"><path d="M14 1C7.1 1 1.5 6.6 1.5 13.5c0 4.2 2 7.9 5.1 10.3L14 37l7.4-13.2A12.4 12.4 0 0 0 26.5 13.5C26.5 6.6 20.9 1 14 1z" fill="#1a1a1a"/><circle cx="14" cy="13.5" r="4.5" fill="white" opacity="0.9"/></svg>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", fontFamily: NU, letterSpacing: "0.5px" }}>Venues ({venueCount})</span>
            </div>
            {vendorCount > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <svg width="9" height="12" viewBox="0 0 28 38"><path d="M14 1C7.1 1 1.5 6.6 1.5 13.5c0 4.2 2 7.9 5.1 10.3L14 37l7.4-13.2A12.4 12.4 0 0 0 26.5 13.5C26.5 6.6 20.9 1 14 1z" fill="#555555"/><circle cx="14" cy="13.5" r="4.5" fill="white" opacity="0.9"/></svg>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", fontFamily: NU, letterSpacing: "0.5px" }}>Vendors ({vendorCount})</span>
              </div>
            )}
          </div>
        </div>

        {/* ══ Side panel ══════════════════════════════════════════════════ */}
        <div style={{
          borderLeft: `1px solid ${C.border}`, display: "flex",
          flexDirection: "column", background: C.card, overflow: "hidden",
        }}>
          {/* Panel header with tabs */}
          <div style={{
            padding: "12px 16px", borderBottom: `1px solid ${C.border}`,
            background: C.dark, flexShrink: 0,
          }}>
            <div style={{ display: "flex", gap: 0, marginBottom: 10 }}>
              {[
                { key: "venues", label: "Venues", count: venues.length },
                ...(vendors.length > 0 ? [{ key: "vendors", label: "Vendors", count: vendors.length }] : []),
              ].map((tab) => (
                <button key={tab.key} onClick={() => setPanelTab(tab.key)}
                  style={{
                    background: panelTab === tab.key ? "rgba(201,168,76,0.12)" : "transparent",
                    border: "none",
                    borderBottom: panelTab === tab.key ? "2px solid #C9A84C" : "2px solid transparent",
                    color: panelTab === tab.key ? "#C9A84C" : C.grey,
                    fontSize: 9, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase",
                    padding: "6px 14px", cursor: "pointer", fontFamily: NU, transition: "all 0.2s",
                  }}
                >{tab.label} ({tab.count})</button>
              ))}
            </div>
            <div style={{
              fontFamily: GD, fontSize: 18, color: C.white, lineHeight: 1.2,
            }}>
              {panelTab === "venues"
                ? (headerLabel || `${venues.length} ${countryFilter === "USA" ? "American" : "Italian"} Estate${venues.length !== 1 ? "s" : ""}`)
                : `${vendors.length} ${countryFilter === "USA" ? "American" : "Italian"} Vendor${vendors.length !== 1 ? "s" : ""}`}
            </div>
          </div>

          {/* Scrollable item list */}
          <ul style={{ flex: 1, overflowY: "auto", listStyle: "none", padding: 0, margin: 0 }} aria-label="Item list">
            {allItems.map((v) => (
              <li
                key={v.id}
                onMouseEnter={() => handleItemHover(v.id)}
                onMouseLeave={handleItemLeave}
                onClick={() => handleItemHover(v.id)}
                style={{
                  display: "flex", gap: 12, padding: "12px 14px", cursor: "pointer",
                  borderBottom: `1px solid ${C.border}`,
                  background: active === v.id ? "rgba(0,0,0,0.04)" : "transparent",
                  transition: "background 0.2s",
                }}
              >
                {/* Thumbnail */}
                <img
                  src={(() => { const first = (v.imgs || v.images)?.[0]; return typeof first === 'string' ? first : first?.src || first?.url || ""; })()}
                  alt={v.name}
                  style={{
                    width: 56, height: 56, objectFit: "cover", flexShrink: 0, borderRadius: 3,
                    border: `1px solid ${active === v.id ? "#1a1a1a" : C.border}`,
                    transition: "border-color 0.2s",
                  }}
                />

                {/* Info */}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    fontSize: 13, fontFamily: GD, color: C.white, fontWeight: 500,
                    marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{v.name}</div>
                  <div style={{ fontSize: 10, color: C.grey, marginBottom: 4, fontFamily: NU }}>
                    {v.region || v.city || ""}{v.capacity ? ` · ${v.capacity} guests` : v.category ? ` · ${v.category}` : ""}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {v.rating && <Stars r={v.rating} />}
                    <span style={{ fontSize: 10, color: C.grey, fontWeight: 600 }}>
                      {v.priceFrom || v.priceRange || ""}
                    </span>
                  </div>
                </div>

                {/* Actions — fixed 40px column, both buttons same width */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: "center", gap: 6, flexShrink: 0, width: 40 }}>
                  {/* Map pin — pans to location */}
                  <button
                    title="Show on map"
                    onClick={(e) => { e.stopPropagation(); handleItemHover(v.id); }}
                    style={{
                      background: active === v.id ? "#1a1a1a" : "transparent",
                      border: `1px solid ${active === v.id ? "#1a1a1a" : C.border}`,
                      borderRadius: 3, width: "100%", height: 26, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s",
                    }}
                  >
                    <svg width="10" height="13" viewBox="0 0 28 38" fill="none">
                      <path d="M14 1C7.1 1 1.5 6.6 1.5 13.5c0 4.2 2 7.9 5.1 10.3L14 37l7.4-13.2A12.4 12.4 0 0 0 26.5 13.5C26.5 6.6 20.9 1 14 1z"
                        fill={active === v.id ? "white" : "#1a1a1a"}/>
                      <circle cx="14" cy="13.5" r="4.5" fill={active === v.id ? "#1a1a1a" : "white"}/>
                    </svg>
                  </button>
                  {/* View — navigates to venue page */}
                  {onMarkerClick && (
                    <button
                      title="View venue"
                      onClick={(e) => { e.stopPropagation(); onMarkerClick(v.slug || v.id); }}
                      style={{
                        background: "transparent", border: `1px solid ${C.border}`,
                        borderRadius: 3, width: "100%", height: 26, cursor: "pointer",
                        fontSize: 9, fontFamily: NU, color: C.grey, letterSpacing: "0.5px",
                        transition: "all 0.2s",
                      }}
                    >View</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
