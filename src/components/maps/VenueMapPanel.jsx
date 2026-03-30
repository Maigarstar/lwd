// src/components/maps/VenueMapPanel.jsx
// Leaflet map panel for venue directory list+map view.
// Dark CARTO tiles. Gold markers for verified, grey for others.
// Hover/pin syncs with the venue list on the left.

import { useEffect, useRef, useState } from "react";

const NU   = "var(--font-body)";
const GOLD = "#C9A84C";

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS  = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

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

function makeIcon(L, color = GOLD, size = 24) {
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

function popupHtml(v) {
  const stars = "★".repeat(Math.round(v.rating || 0)) + "☆".repeat(5 - Math.round(v.rating || 0));
  const price = v.priceFrom ? `From ${v.priceFrom}` : v.price ? `From ${v.price}` : "";
  return `
    <div style="font-family:var(--font-body);min-width:160px;">
      <div style="font-weight:700;font-size:13px;margin-bottom:3px;color:#fff;">${v.name}</div>
      <div style="font-size:10px;color:rgba(255,255,255,0.5);margin-bottom:5px;">${v.city || ""}${v.region ? ", " + v.region : ""}</div>
      <div style="font-size:11px;color:${GOLD};letter-spacing:1px;">${stars} <span style="color:rgba(255,255,255,0.4);font-size:9px;">(${v.reviews || v.reviewCount || 0})</span></div>
      ${price ? `<div style="font-size:12px;color:${GOLD};font-weight:600;margin-top:4px;">${price}</div>` : ""}
    </div>
  `;
}

export default function VenueMapPanel({
  venues        = [],
  hoveredId,
  activePinnedId,
  onPinHover,
  onPinLeave,
  onPinClick,
  onToggleView,
  label         = "Venue Map",
  bleed         = false,
}) {
  const mapElRef   = useRef(null);
  const mapRef     = useRef(null);
  const markersRef = useRef([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !mapElRef.current || mapRef.current) return;
      const map = L.map(mapElRef.current, {
        zoomControl: false,
        scrollWheelZoom: true,
        attributionControl: false,
      }).setView([42.5, 12.5], 6);
      L.control.zoom({ position: "topleft" }).addTo(map);
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { maxZoom: 18, subdomains: "abcd" },
      ).addTo(map);
      mapRef.current = map;
      setReady(true);
    });
    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const L = window.L;
    if (!L) return;

    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current = [];
    const bounds = [];

    venues.forEach((v) => {
      if (!v.lat || !v.lng) return;
      const icon   = makeIcon(L, v.verified ? GOLD : "#888888", 24);
      const marker = L.marker([v.lat, v.lng], { icon }).addTo(map);
      marker.bindPopup(popupHtml(v), {
        className: "lwd-venue-popup",
        maxWidth: 220,
        closeButton: false,
      });
      marker.on("mouseover", () => { marker.openPopup(); onPinHover?.(v.id); });
      marker.on("mouseout",  () => { marker.closePopup(); onPinLeave?.(); });
      marker.on("click",     () => { onPinClick?.(v.id); });
      markersRef.current.push({ id: v.id, marker });
      bounds.push([v.lat, v.lng]);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
    }
  }, [venues, ready, onPinHover, onPinLeave, onPinClick]);

  useEffect(() => {
    if (!mapRef.current || !ready) return;
    const targetId = hoveredId || activePinnedId;
    markersRef.current.forEach(({ id, marker }) => {
      if (id === targetId) marker.openPopup();
      else marker.closePopup();
    });
  }, [hoveredId, activePinnedId, ready]);

  return (
    <div style={{
      position:     "relative",
      width:        "100%",
      height:       "100%",
      minHeight:    480,
      borderRadius: bleed ? 0 : "var(--lwd-radius-card)",
      overflow:     "hidden",
      background:   "#131a14",
    }}>
      <div ref={mapElRef} style={{ width: "100%", height: "100%" }} />

      {!ready && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(10,8,6,0.9)", zIndex: 10,
        }}>
          <div style={{ fontFamily: NU, fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Loading map…
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{
        position: "absolute", top: 14, left: 14, right: 14,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        zIndex: 500, userSelect: "none",
      }}>
        <span style={{
          fontFamily: NU, fontSize: 9, letterSpacing: "0.35em",
          textTransform: "uppercase", color: "rgba(255,255,255,0.35)", pointerEvents: "none",
        }}>
          {label}
        </span>
        {onToggleView && (
          <button onClick={onToggleView} style={{
            fontFamily: NU, fontSize: 9, fontWeight: 600, letterSpacing: "0.15em",
            textTransform: "uppercase", color: GOLD,
            background: "rgba(8,6,4,0.75)", backdropFilter: "blur(8px)",
            border: `1px solid rgba(201,168,76,0.25)`, borderRadius: 6,
            padding: "5px 10px", cursor: "pointer", transition: "all 0.25s",
          }}>
            ≡ Grid View
          </button>
        )}
      </div>

      {/* Legend */}
      <div style={{
        position: "absolute", bottom: 14, right: 14,
        background: "rgba(8,6,4,0.82)", backdropFilter: "blur(10px)",
        border: `1px solid rgba(201,168,76,0.2)`, borderRadius: 8,
        padding: "8px 12px", display: "flex", flexDirection: "column", gap: 5,
        zIndex: 500, userSelect: "none",
      }}>
        {[{ color: GOLD, label: "Verified" }, { color: "#888", label: "Listed" }].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />
            <span style={{ fontFamily: NU, fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.3px" }}>{label}</span>
          </div>
        ))}
      </div>

      <style>{`
        .lwd-venue-popup .leaflet-popup-content-wrapper {
          background: rgba(10,8,6,0.95) !important;
          border: 1px solid rgba(201,168,76,0.2) !important;
          border-radius: 8px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
        }
        .lwd-venue-popup .leaflet-popup-tip { background: rgba(10,8,6,0.95) !important; }
        .lwd-venue-popup .leaflet-popup-content { margin: 10px 14px !important; }
      `}</style>
    </div>
  );
}
