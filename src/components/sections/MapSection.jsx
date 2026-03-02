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
function makeIcon(L, color = "#C9A84C", size = 28) {
  return L.divIcon({
    className: "",
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 8],
    popupAnchor: [0, -(size + 4)],
    html: `<svg viewBox="0 0 28 36" width="${size}" height="${size + 8}" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="${color}" opacity="0.9"/>
      <circle cx="14" cy="13" r="5" fill="rgba(255,255,255,0.9)"/>
    </svg>`,
  });
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
}) {
  const C = useTheme();
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(null);
  const [panelTab, setPanelTab] = useState("venues"); // "venues" | "vendors"

  const allItems = panelTab === "venues" ? venues : vendors;

  // ── Initialise Leaflet map ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !mapEl.current) return;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

      const map = L.map(mapEl.current, {
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: true,
      });
      mapRef.current = map;

      // Tile layer — elegant desaturated style
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://carto.com">CARTO</a> &copy; <a href="https://osm.org/copyright">OSM</a>',
        maxZoom: 18,
      }).addTo(map);

      // Zoom controls (top-left)
      L.control.zoom({ position: "topleft" }).addTo(map);

      // ── Add venue markers (gold) ──
      const venueIcon = makeIcon(L, "#C9A84C", 28);
      const vendorIcon = makeIcon(L, "#8B6914", 24);
      const bounds = [];

      venues.forEach((v) => {
        if (!v.lat || !v.lng) return;
        const marker = L.marker([v.lat, v.lng], { icon: venueIcon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family:system-ui;min-width:180px">
            <div style="font-size:13px;font-weight:600;margin-bottom:4px">${v.name}</div>
            <div style="font-size:11px;color:#666;margin-bottom:4px">${v.region || ""}${v.capacity ? " · " + v.capacity + " guests" : ""}</div>
            <div style="font-size:11px;color:#C9A84C;font-weight:700">${v.priceFrom || ""}</div>
          </div>
        `, { closeButton: false, maxWidth: 240 });
        marker.on("click", () => setActive(v.id));
        bounds.push([v.lat, v.lng]);
        markersRef.current.push({ id: v.id, marker, type: "venue" });
      });

      // ── Add vendor markers (darker gold) ──
      vendors.forEach((v) => {
        if (!v.lat || !v.lng) return;
        const marker = L.marker([v.lat, v.lng], { icon: vendorIcon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family:system-ui;min-width:180px">
            <div style="font-size:13px;font-weight:600;margin-bottom:4px">${v.name}</div>
            <div style="font-size:11px;color:#666;margin-bottom:4px">${v.category || v.region || ""}</div>
            <div style="font-size:10px;color:#8B6914;font-weight:600;text-transform:uppercase;letter-spacing:1px">Vendor</div>
          </div>
        `, { closeButton: false, maxWidth: 240 });
        marker.on("click", () => setActive(v.id));
        bounds.push([v.lat, v.lng]);
        markersRef.current.push({ id: v.id, marker, type: "vendor" });
      });

      // Fit bounds
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
      } else {
        map.setView([42.5, 12.5], 6); // default Italy center
      }

      setReady(true);
    });

    return () => {
      cancelled = true;
      markersRef.current = [];
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [venues, vendors]);

  // ── Pan to marker when sidebar item hovered ─────────────────────────────
  const handleItemHover = useCallback((id) => {
    setActive(id);
    const entry = markersRef.current.find((m) => m.id === id);
    if (entry && mapRef.current) {
      entry.marker.openPopup();
      mapRef.current.panTo(entry.marker.getLatLng(), { animate: true, duration: 0.4 });
    }
  }, []);

  const handleItemLeave = useCallback(() => {
    setActive(null);
    markersRef.current.forEach((m) => m.marker.closePopup());
  }, []);

  // ── Panel counts ──
  const venueCount = venues.filter((v) => v.lat && v.lng).length;
  const vendorCount = vendors.filter((v) => v.lat && v.lng).length;

  const defaultTitle = countryFilter === "USA"
    ? `◎ Interactive Map · United States`
    : `◎ Interactive Map · ${countryFilter}`;

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
        <div style={{ position: "relative", background: "#f0ece6" }}>
          <div ref={mapEl} style={{ width: "100%", height: "100%" }} />

          {/* Loading overlay */}
          {!ready && (
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(240,236,230,0.9)", zIndex: 500,
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
              background: `linear-gradient(180deg, rgba(10,8,6,0.7) 0%, transparent 100%)`,
              padding: "14px 20px", pointerEvents: "none",
            }}
          >
            <div style={{
              fontSize: 10, letterSpacing: "3px", textTransform: "uppercase",
              color: "#C9A84C", fontWeight: 700, fontFamily: NU,
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
              <svg width="10" height="12" viewBox="0 0 28 36"><path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="#C9A84C" opacity="0.9"/></svg>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", fontFamily: NU, letterSpacing: "0.5px" }}>Venues ({venueCount})</span>
            </div>
            {vendorCount > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <svg width="10" height="12" viewBox="0 0 28 36"><path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="#8B6914" opacity="0.9"/></svg>
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
                style={{
                  display: "flex", gap: 12, padding: "12px 14px", cursor: "pointer",
                  borderBottom: `1px solid ${C.border}`,
                  background: active === v.id ? (C.goldDim || "rgba(201,168,76,0.06)") : "transparent",
                  transition: "background 0.2s",
                }}
              >
                <img
                  src={(v.imgs || v.images)?.[0] || ""}
                  alt={v.name}
                  style={{
                    width: 56, height: 56, objectFit: "cover", flexShrink: 0, borderRadius: 3,
                    border: `1px solid ${active === v.id ? C.gold : C.border}`,
                    transition: "border-color 0.2s",
                  }}
                />
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
                    <span style={{ fontSize: 10, color: C.gold, fontWeight: 700 }}>
                      {v.priceFrom || v.priceRange || ""}
                    </span>
                  </div>
                </div>
                <div aria-hidden="true" style={{
                  fontSize: 10, color: C.gold, marginLeft: "auto", alignSelf: "center",
                  opacity: active === v.id ? 1 : 0, transition: "opacity 0.2s",
                }}>→</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
