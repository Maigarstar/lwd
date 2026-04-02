// ─── src/components/sections/MapSection.jsx ──────────────────────────────────
// AI-enhanced interactive map.
// Default state: zone circles per region (bubble size ∝ venue count).
// AI state: fly-to target region + insight card overlay + staggered pin reveal.
import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "../../theme/ThemeContext";
import Stars from "../ui/Stars";

const NU = "var(--font-body)";
const GD = "var(--font-heading-primary)";

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
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet"; link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.onload = () => resolve(window.L);
    document.head.appendChild(script);
  });
  return leafletPromise;
}

// ── Insight card — slides up from map bottom-left ────────────────────────────
function InsightCard({ card, venueCount, onDismiss }) {
  return (
    <div style={{
      position:       "absolute",
      bottom:         52,
      left:           16,
      zIndex:         500,
      background:     "rgba(8,6,4,0.92)",
      backdropFilter: "blur(10px)",
      border:         "1px solid rgba(201,168,76,0.25)",
      borderRadius:   6,
      padding:        "16px 20px",
      minWidth:       220,
      maxWidth:       280,
      pointerEvents:  "auto",
      animation:      "lwd-slide-up 0.38s cubic-bezier(0.22, 1, 0.36, 1)",
    }}>
      <style>{`
        @keyframes lwd-slide-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>

      <div style={{
        fontSize: 9, letterSpacing: "2.5px", textTransform: "uppercase",
        color: "#C9A84C", fontWeight: 700, fontFamily: NU, marginBottom: 8,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span>◎ {card.name}</span>
        <button
          onClick={onDismiss}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.3)", fontSize: 12, lineHeight: 1,
            padding: 0, fontFamily: NU,
          }}
          aria-label="Dismiss insight card"
        >✕</button>
      </div>

      {card.vibe && (
        <div style={{
          fontSize: 14, color: "rgba(255,255,255,0.9)", fontFamily: GD,
          marginBottom: 10, lineHeight: 1.35,
        }}>
          {card.vibe}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
        {card.season && (
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontFamily: NU }}>
            ✦ Best season: {card.season}
          </div>
        )}
        {card.highlight && (
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontFamily: NU }}>
            ◦ {card.highlight}
          </div>
        )}
      </div>

      {venueCount > 0 && (
        <div style={{
          fontSize: 10, color: "#C9A84C", fontFamily: NU,
          letterSpacing: "0.5px", fontWeight: 600,
          borderTop: "1px solid rgba(201,168,76,0.12)", paddingTop: 10,
        }}>
          {venueCount} venue{venueCount !== 1 ? "s" : ""} in this region
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function MapSection({
  venues = [],
  vendors = [],
  headerLabel,
  mapTitle,
  countryFilter = "Italy",
  darkMode = false,      // grayscale tiles when lights off
  // AI map props
  flyToTarget  = null,   // { slug, name, lat, lng, zoom, vibe, season, highlight }
  regionZones  = [],     // [{ slug, name, lat, lng, count }] — idle zone bubbles
  onRegionZoneClick,     // (slug) => void
}) {
  const C = useTheme();
  const mapEl      = useRef(null);
  const mapRef     = useRef(null);
  const markersRef = useRef([]);
  const zoneRef    = useRef([]);
  const flyTimer   = useRef(null);

  const [ready,       setReady]       = useState(false);
  const [active,      setActive]      = useState(null);
  const [panelTab,    setPanelTab]    = useState("venues");
  const [insightCard, setInsightCard] = useState(null);

  const allItems = panelTab === "venues" ? venues : vendors;

  // ── Initialise Leaflet map ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setReady(false);

    loadLeaflet().then((L) => {
      if (cancelled || !mapEl.current) return;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      markersRef.current = [];
      zoneRef.current    = [];

      const map = L.map(mapEl.current, {
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: true,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://carto.com">CARTO</a> &copy; <a href="https://osm.org/copyright">OSM</a>',
        maxZoom: 18,
      }).addTo(map);

      L.control.zoom({ position: "topleft" }).addTo(map);

      const venueIcon  = makeIcon(L, "#C9A84C", 28);
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

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
      } else {
        map.setView([42.5, 12.5], 6);
      }

      setReady(true);
    });

    return () => {
      cancelled = true;
      clearTimeout(flyTimer.current);
      markersRef.current = [];
      zoneRef.current    = [];
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [venues, vendors]);

  // ── Zone circles — idle state, hidden during fly-to ──────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current || !window.L) return;
    const L = window.L;

    zoneRef.current.forEach(c => { try { c.remove(); } catch (_) {} });
    zoneRef.current = [];

    if (flyToTarget || regionZones.length === 0) return;

    regionZones.forEach((zone) => {
      if (!zone.lat || !zone.lng || !zone.count) return;

      const radius = Math.min(55, Math.max(18, 12 + zone.count * 5));

      const circle = L.circleMarker([zone.lat, zone.lng], {
        radius,
        fillColor:   "#C9A84C",
        fillOpacity: 0.13,
        color:       "#C9A84C",
        weight:      1.5,
        opacity:     0.45,
      });

      circle.bindTooltip(
        `<div style="font-family:system-ui;text-align:center;padding:2px 6px">
          <div style="font-weight:600;font-size:12px;color:#1a1a1a">${zone.name}</div>
          <div style="font-size:10px;color:#777">${zone.count} venue${zone.count !== 1 ? "s" : ""}</div>
        </div>`,
        { permanent: false, sticky: true, direction: "top", className: "lwd-zone-tip" }
      );

      circle.on("mouseover", () => circle.setStyle({ fillOpacity: 0.28, opacity: 0.85 }));
      circle.on("mouseout",  () => circle.setStyle({ fillOpacity: 0.13, opacity: 0.45 }));
      circle.on("click", () => onRegionZoneClick?.(zone.slug));

      circle.addTo(mapRef.current);
      zoneRef.current.push(circle);
    });
  }, [ready, regionZones, flyToTarget, onRegionZoneClick]);

  // ── Fly-to when AI target changes ────────────────────────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    clearTimeout(flyTimer.current);

    if (!flyToTarget) {
      setInsightCard(null);
      return;
    }

    const { lat, lng, zoom } = flyToTarget;
    setInsightCard(null); // clear old card during fly

    mapRef.current.flyTo([lat, lng], zoom ?? 9, { animate: true, duration: 1.4 });

    flyTimer.current = setTimeout(() => setInsightCard(flyToTarget), 1050);
    return () => clearTimeout(flyTimer.current);
  }, [ready, flyToTarget]);

  // ── Pan to marker on sidebar hover ───────────────────────────────────────
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

  const venueCount  = venues.filter((v) => v.lat && v.lng).length;
  const vendorCount = vendors.filter((v) => v.lat && v.lng).length;

  const defaultTitle = countryFilter === "USA"
    ? "◎ Interactive Map · United States"
    : `◎ Interactive Map · ${countryFilter}`;

  return (
    <section
      aria-label="Map view of venues and vendors"
      style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 48px 40px" }}
    >
      {/* Zone tooltip CSS */}
      <style>{`
        .lwd-zone-tip.leaflet-tooltip { background: transparent; border: none; box-shadow: none; padding: 0; }
        .lwd-zone-tip .leaflet-tooltip-inner { background: #fff; color: #1a1a1a; border: 1px solid rgba(201,168,76,0.3); border-radius: 4px; padding: 4px 8px; }
      `}</style>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 380px",
        gap: 0,
        border: `1px solid ${C.border}`,
        overflow: "hidden",
        height: 640,
        borderRadius: "var(--lwd-radius-image, 6px)",
      }}>
        {/* ══ Map ══════════════════════════════════════════════════════════ */}
        <div style={{ position: "relative", background: "#f0ece6" }}>
          <div ref={mapEl} style={{
            width: "100%", height: "100%",
            filter: darkMode ? "grayscale(1) brightness(0.45)" : "none",
            transition: "filter 0.3s ease",
          }} />

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

          {/* Map header */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute", top: 0, left: 0, right: 0, zIndex: 400,
              background: "linear-gradient(180deg, rgba(10,8,6,0.65) 0%, transparent 100%)",
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

          {/* AI insight card */}
          {insightCard && (
            <InsightCard
              card={insightCard}
              venueCount={venues.length}
              onDismiss={() => setInsightCard(null)}
            />
          )}

          {/* Zone hint */}
          {ready && !flyToTarget && regionZones.length > 0 && !insightCard && (
            <div style={{
              position: "absolute", bottom: 44, right: 12, zIndex: 400,
              background: "rgba(4,3,2,0.70)", padding: "5px 10px",
              borderRadius: 4, pointerEvents: "none",
            }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.40)", fontFamily: NU, letterSpacing: "0.5px" }}>
                Click a region to filter
              </div>
            </div>
          )}

          {/* Legend */}
          <div style={{
            position: "absolute", bottom: 8, left: 12, zIndex: 400,
            background: "rgba(4,3,2,0.8)", padding: "7px 14px",
            borderRadius: 4, border: "1px solid rgba(201,168,76,0.12)",
            display: "flex", gap: 14, alignItems: "center",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="10" height="12" viewBox="0 0 28 36">
                <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="#C9A84C" opacity="0.9"/>
              </svg>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.55)", fontFamily: NU, letterSpacing: "0.5px" }}>Venues ({venueCount})</span>
            </div>
            {vendorCount > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <svg width="10" height="12" viewBox="0 0 28 36">
                  <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="#8B6914" opacity="0.9"/>
                </svg>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.55)", fontFamily: NU, letterSpacing: "0.5px" }}>Vendors ({vendorCount})</span>
              </div>
            )}
          </div>
        </div>

        {/* ══ Side panel ═══════════════════════════════════════════════════ */}
        <div style={{
          borderLeft: `1px solid ${C.border}`,
          display: "flex", flexDirection: "column",
          background: C.card, overflow: "hidden",
        }}>
          <div style={{
            padding: "12px 16px", borderBottom: `1px solid ${C.border}`,
            background: C.dark, flexShrink: 0,
          }}>
            <div style={{ display: "flex", gap: 0, marginBottom: 10 }}>
              {[
                { key: "venues",  label: "Venues",  count: venues.length },
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

            {flyToTarget ? (
              <div>
                <div style={{ fontFamily: GD, fontSize: 17, color: C.white, lineHeight: 1.2, marginBottom: 3 }}>
                  {flyToTarget.name}
                </div>
                {flyToTarget.vibe && (
                  <div style={{ fontSize: 10, color: C.grey, fontFamily: NU }}>
                    {flyToTarget.vibe}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontFamily: GD, fontSize: 18, color: C.white, lineHeight: 1.2 }}>
                {panelTab === "venues"
                  ? (headerLabel || `${venues.length} venue${venues.length !== 1 ? "s" : ""}`)
                  : `${vendors.length} vendor${vendors.length !== 1 ? "s" : ""}`}
              </div>
            )}
          </div>

          <ul style={{ flex: 1, overflowY: "auto", listStyle: "none", padding: 0, margin: 0 }}>
            {allItems.length === 0 ? (
              <li style={{ padding: "40px 20px", textAlign: "center", color: C.grey, fontSize: 12, fontFamily: NU }}>
                {flyToTarget
                  ? `No mapped venues in ${flyToTarget.name} yet`
                  : "No venues with map coordinates"}
              </li>
            ) : allItems.map((v) => (
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
                {(v.imgs || v.images)?.[0] ? (
                  <img
                    src={(v.imgs || v.images)[0]}
                    alt={v.name}
                    style={{
                      width: 56, height: 56, objectFit: "cover", flexShrink: 0, borderRadius: 3,
                      border: `1px solid ${active === v.id ? C.gold : C.border}`,
                      transition: "border-color 0.2s",
                    }}
                  />
                ) : (
                  <div style={{
                    width: 56, height: 56, flexShrink: 0, borderRadius: 3,
                    border: `1px solid ${active === v.id ? C.gold : C.border}`,
                    background: C.dark, display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "border-color 0.2s",
                  }}>
                    <svg width="20" height="20" viewBox="0 0 28 36" fill="none">
                      <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="#C9A84C" opacity="0.35"/>
                    </svg>
                  </div>
                )}
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
