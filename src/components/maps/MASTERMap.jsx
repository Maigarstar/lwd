// src/components/maps/MASTERMap.jsx
// ─────────────────────────────────────────────────────────────────────────────
// MASTERMap — unified geo-intelligence engine
//
// Supports three modes (auto-detected from props):
//   • Venue-only     — pass `venues` array (backwards compatible)
//   • Supplier-only  — pass `items` with type:"vendor"
//   • Mixed          — pass `items` with venues + vendors → filter bar shown
//
// Features:
//   • Dark CARTO tiles, full-bleed right layout
//   • Gold filled pins for venues
//   • Category-colour outline pins for suppliers
//   • Internal filter bar (All / Venues / per-category) — mixed data only
//   • Ghost opacity (0.12) on non-active filter categories
//   • Nominatim geocoding with session cache
//   • Popup: venues → price/capacity · suppliers → rating/category
//   • PinSyncBus bidirectional sync (card hover ↔ pin highlight)
//   • Follow mode: map pans with active card (toggle to free)
//   • Viewport continuity across filter changes and re-renders
//   • Staggered pin entrance animation
//   • Left-edge gradient fade — absorbed into layout
//   • Analytics: pin_click, map_viewport, map_geocode_miss → trackEvent
//   • Aura annotation overlay (bottom-left glass panel)

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { geocodeLocation } from "../../utils/geocoding/geocodeLocation";
import { PinSyncBus } from "./PinSyncBus";
import { trackEvent } from "../../lib/tracker";

const NU   = "var(--font-body)";
const GOLD = "#C9A84C";

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS  = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

// ── Country default map centres ───────────────────────────────────────────────
const DEFAULT_CENTRES = {
  italy:    [42.5,  12.5],
  england:  [52.5,  -1.5],
  uk:       [54.0,  -2.5],
  france:   [46.5,   2.3],
  usa:      [39.5, -98.35],
  spain:    [40.4,  -3.7],
  greece:   [39.0,  22.0],
  portugal: [39.5,  -8.0],
  germany:  [51.2,  10.5],
  ireland:  [53.3,  -8.0],
};

// ── Category colour palette — muted luxury, editorial ─────────────────────────
const PIN_COLOURS = {
  "wedding-venues":   "#C9A84C",  // gold — primary product
  "photographers":    "#7B9E9F",  // dusty teal
  "wedding-planners": "#C4A882",  // champagne sand
  "florists":         "#8B9E7B",  // sage green
  "videographers":    "#9B8FA8",  // muted mauve
  "caterers":         "#C4956A",  // terracotta
  "musicians":        "#8F9BB3",  // slate blue
  "hair-beauty":      "#C4909A",  // dusty rose
};

const PIN_LABELS = {
  "wedding-venues":   "Venues",
  "photographers":    "Photographers",
  "wedding-planners": "Planners",
  "florists":         "Florists",
  "videographers":    "Videographers",
  "caterers":         "Caterers",
  "musicians":        "Musicians",
  "hair-beauty":      "Hair & Beauty",
};

// ── Leaflet singleton loader ──────────────────────────────────────────────────
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


// ── Pin icon factory ──────────────────────────────────────────────────────────
// state:   "standard" | "featured" | "showcase" | "active" | "ghost"
// color:   hex string (defaults to GOLD)
// variant: "filled" (venues) | "outline" (suppliers)
function makePinIcon(L, state = "standard", size = 22, color = GOLD, variant = "filled") {
  const h  = Math.round(size * 1.45);
  const cx = size / 2;
  const cy = size * 0.45;
  const r  = size * 0.22;

  const isGhost  = state === "ghost";
  const isActive = state === "active";
  const pinColor = isGhost ? `rgba(201,168,76,0.35)` : color;
  const scale    = isActive ? 1.2 : 1;

  // Outer ring for featured / showcase
  let outerRing = "";
  if (state === "featured") {
    outerRing = `<circle cx="${cx}" cy="${cy}" r="${size * 0.48}" fill="none"
      stroke="${color}" stroke-width="1.5" opacity="0.35"/>`;
  }
  if (state === "showcase") {
    outerRing = `<circle cx="${cx}" cy="${cy}" r="${size * 0.48}" fill="none"
      stroke="#E8E0D0" stroke-width="1.5" opacity="0.5"/>`;
  }

  // Active glow ring
  const glowRing = isActive
    ? `<circle cx="${cx}" cy="${cy}" r="${size * 0.52}" fill="none"
        stroke="${color}" stroke-width="1.2" opacity="0.4"
        class="lwd-pin-glow-ring"/>`
    : "";

  // Pin body: filled (venues) vs outline (suppliers)
  const pathFill    = variant === "outline" ? "rgba(10,8,6,0.82)" : pinColor;
  const pathStroke  = variant === "outline" ? pinColor : "none";
  const pathSW      = variant === "outline" ? "1.6" : "0";
  const pathOpacity = isGhost ? 0.45 : 0.92;

  return L.divIcon({
    className: `lwd-mmap-pin lwd-mmap-pin--${state}`,
    iconSize:    [size * scale, h * scale],
    iconAnchor:  [(size * scale) / 2, h * scale],
    popupAnchor: [0, -(h * scale - 4)],
    html: `
      <svg viewBox="0 0 ${size} ${h}" width="${size * scale}" height="${h * scale}"
        xmlns="http://www.w3.org/2000/svg" style="overflow:visible;display:block">
        ${outerRing}${glowRing}
        <path d="M${cx} 1C${size * 0.23} 1 1 ${cy * 0.51} 1 ${cy}
          c0 ${size * 0.38} ${cx - 1} ${h * 0.64 - cy} ${cx - 1} ${h * 0.64 - cy}
          s${cx - 1} ${-(h * 0.64 - cy - size * 0.38)} ${cx - 1} ${-(h * 0.64 - cy - size * 0.38)}
          C${size - 1} ${cy + size * 0.38} ${size - 1} ${cy} ${size - 1} ${cy}
          C${size - 1} ${cy * 0.51} ${size * 0.77} 1 ${cx} 1z"
          fill="${pathFill}" stroke="${pathStroke}" stroke-width="${pathSW}"
          opacity="${pathOpacity}"/>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(255,255,255,0.9)"/>
      </svg>`,
  });
}

// ── Popup builders ────────────────────────────────────────────────────────────
function buildVenuePopup(v, accentColor = GOLD) {
  const img      = v.thumbnail || (Array.isArray(v.imgs) ? v.imgs[0] : null) || "";
  const price    = v.priceFrom ? `From ${v.priceFrom}` : "";
  const loc      = [v.city, v.region].filter(Boolean).join(", ");
  const cap      = v.capacity ? ` · ${v.capacity} guests` : "";
  const offerHtml = v.hasOffer && v.offerLabel
    ? `<div style="font-size:10px;color:${accentColor};margin-bottom:6px;opacity:0.82">✦ ${v.offerLabel}</div>`
    : "";
  const imgHtml = img
    ? `<div style="width:100%;height:88px;overflow:hidden;border-radius:5px 5px 0 0;
        margin:-10px -10px 10px;width:calc(100% + 20px);background:#111">
        <img src="${img}" alt="${v.name}"
          style="width:100%;height:88px;object-fit:cover;display:block" loading="lazy"/>
      </div>`
    : "";

  return `
    <div style="font-family:var(--font-body);width:220px;padding:10px">
      ${imgHtml}
      <div style="font-weight:700;font-size:13px;color:#fff;margin-bottom:3px;line-height:1.3">
        ${v.name}
      </div>
      <div style="font-size:10px;color:rgba(255,255,255,0.42);margin-bottom:4px">
        ${loc}${cap}
      </div>
      ${price
        ? `<div style="font-size:12px;color:${accentColor};font-weight:600;margin-bottom:6px">${price}</div>`
        : ""}
      ${offerHtml}
      <div style="margin-top:8px">
        <a href="/${v.slug}"
          style="display:block;text-align:center;text-decoration:none;
            font-family:var(--font-body);font-size:9px;font-weight:700;
            letter-spacing:0.14em;text-transform:uppercase;
            padding:6px 12px;border-radius:4px;
            border:1px solid rgba(201,168,76,0.7);
            background:rgba(201,168,76,0.12);color:${GOLD}">
          View Venue
        </a>
      </div>
    </div>`;
}

function buildSupplierPopup(v, accentColor = GOLD) {
  const img       = v.thumbnail || (Array.isArray(v.imgs) ? v.imgs[0] : null) || "";
  const loc       = [v.city, v.region].filter(Boolean).join(", ");
  const catLabel  = PIN_LABELS[v.category] || v.category || "Supplier";
  const ratingHtml = v.rating
    ? `<div style="font-size:10px;color:${accentColor};margin-bottom:4px;opacity:0.85">
        ${"★".repeat(Math.round(v.rating))}${"☆".repeat(5 - Math.round(v.rating))}
        <span style="opacity:0.55;margin-left:4px">${v.rating.toFixed(1)}</span>
       </div>`
    : "";
  const tierHtml = v.tier
    ? `<div style="font-size:9px;color:${accentColor};opacity:0.6;margin-bottom:6px;
        letter-spacing:0.1em;text-transform:uppercase">${v.tier}</div>`
    : "";
  const imgHtml = img
    ? `<div style="width:100%;height:88px;overflow:hidden;border-radius:5px 5px 0 0;
        margin:-10px -10px 10px;width:calc(100% + 20px);background:#111">
        <img src="${img}" alt="${v.name}"
          style="width:100%;height:88px;object-fit:cover;display:block" loading="lazy"/>
      </div>`
    : "";

  return `
    <div style="font-family:var(--font-body);width:220px;padding:10px">
      ${imgHtml}
      <div style="font-size:8px;letter-spacing:0.2em;text-transform:uppercase;
        color:${accentColor};opacity:0.6;margin-bottom:4px">${catLabel}</div>
      <div style="font-weight:700;font-size:13px;color:#fff;margin-bottom:3px;line-height:1.3">
        ${v.name}
      </div>
      <div style="font-size:10px;color:rgba(255,255,255,0.42);margin-bottom:4px">${loc}</div>
      ${ratingHtml}
      ${tierHtml}
      <div style="margin-top:8px">
        <a href="/${v.slug}"
          style="display:block;text-align:center;text-decoration:none;
            font-family:var(--font-body);font-size:9px;font-weight:700;
            letter-spacing:0.14em;text-transform:uppercase;
            padding:6px 12px;border-radius:4px;
            border:1px solid ${accentColor}55;
            background:${accentColor}18;color:${accentColor}">
          View Profile
        </a>
      </div>
    </div>`;
}

function buildPopupHtml(item) {
  const color = PIN_COLOURS[item.category] || GOLD;
  return item.type === "vendor"
    ? buildSupplierPopup(item, color)
    : buildVenuePopup(item, GOLD);
}

// ═════════════════════════════════════════════════════════════════════════════
export default function MASTERMap({
  venues       = [],         // backwards compat — venue array
  items        = null,       // mixed array: [{ ...venueOrVendor, type, category }]
  label        = "Venue Map",
  viewMode     = "grid",     // "grid" | "list" — drives toggle button label
  onToggleView,              // fn() — called when user clicks back to Grid/List
  countrySlug  = "italy",
  pageBg       = "#f2f0ea",  // match left column bg for gradient fade
  auraSummary  = null,       // Aura annotation string
  activeFilter = null,       // category slug driven by Aura — "photographers" | "wedding-venues" | null
  onFilterChange,            // fn(categorySlug) — fires when user manually changes filter pill
}) {
  const mapElRef       = useRef(null);
  const mapRef         = useRef(null);
  const markersRef     = useRef([]);   // [{ id, marker, state, lat, lng, category, type, item }]
  const popupRef       = useRef(null);
  const viewportRef    = useRef(null); // { center, zoom } — persisted across filter changes
  const geocodingActive = useRef(false);

  const [ready,      setReady]      = useState(false);
  const [followMode, setFollowMode] = useState(true);
  const [pinFilter,  setPinFilter]  = useState(activeFilter || "all");

  // ── Sync internal filter when Aura drives activeFilter ────────────────────
  useEffect(() => {
    setPinFilter(activeFilter || "all");
  }, [activeFilter]);

  // ── Normalise data ─────────────────────────────────────────────────────────
  // Accept either `items` (new unified model) or `venues` (backwards compat)
  const allItems = useMemo(() => {
    if (items && items.length > 0) return items;
    return venues.map((v) => ({ ...v, type: "venue", category: v.category || "wedding-venues" }));
  }, [items, venues]);

  // Categories present in the data (for filter bar)
  const presentCategories = useMemo(() => {
    const seen = new Set();
    const result = [];
    allItems.forEach((i) => {
      const cat = i.category || "wedding-venues";
      if (!seen.has(cat)) { seen.add(cat); result.push(cat); }
    });
    return result;
  }, [allItems]);

  const hasSuppliers = useMemo(
    () => presentCategories.some((c) => c !== "wedding-venues"),
    [presentCategories]
  );

  const showFilterBar = hasSuppliers; // Only show filter when mixed data

  // ── Init Leaflet map (once) ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !mapElRef.current || mapRef.current) return;

      const centre = DEFAULT_CENTRES[countrySlug] || [42.5, 12.5];
      const map = L.map(mapElRef.current, {
        zoomControl:        false,
        scrollWheelZoom:    true,
        attributionControl: false,
      }).setView(centre, 7);

      L.control.zoom({ position: "topleft" }).addTo(map);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19, subdomains: "abcd",
      }).addTo(map);

      // Persist viewport + analytics
      let _vpTimer = null;
      map.on("moveend zoomend", () => {
        viewportRef.current = { center: map.getCenter(), zoom: map.getZoom() };
        clearTimeout(_vpTimer);
        _vpTimer = setTimeout(() => {
          const c = map.getCenter();
          const b = map.getBounds();
          trackEvent("map_viewport", {
            zoom:       map.getZoom(),
            center_lat: Math.round(c.lat * 1000) / 1000,
            center_lng: Math.round(c.lng * 1000) / 1000,
            bounds_sw:  `${b.getSouthWest().lat.toFixed(3)},${b.getSouthWest().lng.toFixed(3)}`,
            bounds_ne:  `${b.getNorthEast().lat.toFixed(3)},${b.getNorthEast().lng.toFixed(3)}`,
            country:    countrySlug,
          });
        }, 1500);
      });

      mapRef.current = map;
      setReady(true);
    });

    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      markersRef.current = [];
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Place / refresh pins when allItems or ready changes ───────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const L = window.L;
    if (!L) return;

    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current = [];
    if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }

    const withCoords    = allItems.filter((v) => v.lat && v.lng);
    const needsGeocoding = allItems.filter((v) => !v.lat || !v.lng);
    const bounds        = [];

    withCoords.forEach((v, i) => {
      setTimeout(() => {
        if (!mapRef.current) return;
        _addPin(L, map, v);
      }, i * 20);
      bounds.push([v.lat, v.lng]);
    });

    if (bounds.length > 0) {
      if (viewportRef.current) {
        map.setView(viewportRef.current.center, viewportRef.current.zoom, { animate: false });
      } else {
        map.fitBounds(bounds, { padding: [44, 44], maxZoom: 8, animate: true });
      }
    }

    if (needsGeocoding.length > 0 && !geocodingActive.current) {
      geocodingActive.current = true;
      _geocodeProgressively(L, map, needsGeocoding).finally(() => {
        geocodingActive.current = false;
      });
    }
  }, [allItems, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Apply category filter — ghost non-matching pins ───────────────────────
  useEffect(() => {
    markersRef.current.forEach(({ marker, category }) => {
      const el = marker.getElement();
      if (!el) return;
      const matches = pinFilter === "all" || pinFilter === category;
      el.style.opacity    = matches ? "1" : "0.12";
      el.style.transition = "opacity 0.2s ease";
      el.style.pointerEvents = matches ? "auto" : "none";
    });
  }, [pinFilter]);

  // ── Add a single pin ──────────────────────────────────────────────────────
  function _addPin(L, map, v, forceState) {
    const isVenue   = v.type !== "vendor";
    const category  = v.category || "wedding-venues";
    const color     = PIN_COLOURS[category] || GOLD;
    const variant   = isVenue ? "filled" : "outline";
    const pinState  = forceState || (
      v.isShowcase ? "showcase" :
      v.isFeatured ? "featured" : "standard"
    );

    const icon = makePinIcon(L, pinState, 22, color, variant);
    const marker = L.marker([v.lat, v.lng], {
      icon,
      zIndexOffset: v.isFeatured || v.isShowcase ? 200 : 0,
    }).addTo(map);

    marker.on("mouseover", () => {
      PinSyncBus.emit("pin:hover", v.id);
      _openPopup(map, marker, v);
    });
    marker.on("mouseout", () => {
      PinSyncBus.emit("pin:leave", v.id);
    });
    marker.on("click", () => {
      PinSyncBus.emit("pin:click", v.id);
      trackEvent("pin_click", {
        item_id:       v.id,
        item_name:     v.name,
        item_slug:     v.slug,
        item_type:     v.type || "venue",
        item_category: category,
        country:       countrySlug,
      });
    });

    markersRef.current.push({
      id: v.id, marker, state: pinState,
      lat: v.lat, lng: v.lng,
      category, type: v.type || "venue", item: v,
    });

    // Apply current filter immediately (in case filter was set before this pin was added)
    const el = marker.getElement();
    if (el) {
      const matches = pinFilter === "all" || pinFilter === category;
      el.style.opacity       = matches ? "1" : "0.12";
      el.style.pointerEvents = matches ? "auto" : "none";
    }

    return marker;
  }

  // ── Open popup ────────────────────────────────────────────────────────────
  function _openPopup(map, marker, v) {
    if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
    const popup = window.L.popup({
      className:   "lwd-mmap-popup",
      maxWidth:    240,
      closeButton: false,
      autoPan:     false,
      offset:      [0, -6],
    })
      .setContent(buildPopupHtml(v))
      .setLatLng(marker.getLatLng());
    popup.addTo(map);
    popupRef.current = popup;
  }

  // ── Geocode items progressively ───────────────────────────────────────────
  async function _geocodeProgressively(L, map, needsGeo) {
    for (const v of needsGeo) {
      if (!mapRef.current) break;
      const result = await geocodeLocation(v);
      if (!result || !mapRef.current) {
        if (!result) {
          trackEvent("map_geocode_miss", {
            item_id:       v.id,
            item_name:     v.name,
            item_category: v.category || "wedding-venues",
            country:       countrySlug,
          });
        }
        continue;
      }
      _addPin(L, map, { ...v, lat: result.lat, lng: result.lng });
    }
  }

  // ── Highlight a pin ───────────────────────────────────────────────────────
  const _highlightPin = useCallback((id, active) => {
    const L = window.L;
    if (!L || !mapRef.current) return;
    markersRef.current.forEach(({ id: pid, marker, state, category, type }) => {
      const isTarget = pid === id;
      const color    = PIN_COLOURS[category] || GOLD;
      const variant  = type === "vendor" ? "outline" : "filled";
      marker.setIcon(
        makePinIcon(L, isTarget && active ? "active" : state, isTarget && active ? 26 : 22, color, variant)
      );
      marker.setZIndexOffset(isTarget && active ? 500 : 0);
    });
  }, []);

  // ── Pan map to a pin ──────────────────────────────────────────────────────
  const _panToPin = useCallback((id) => {
    const entry = markersRef.current.find((m) => m.id === id);
    if (entry && mapRef.current) {
      mapRef.current.panTo([entry.lat, entry.lng], { animate: true, duration: 0.4 });
    }
  }, []);

  // ── PinSyncBus listeners ──────────────────────────────────────────────────
  useEffect(() => {
    const offCardHover = PinSyncBus.on("card:hover", (id) => {
      _highlightPin(id, true);
      if (followMode) _panToPin(id);
      const entry = markersRef.current.find((m) => m.id === id);
      if (entry && mapRef.current) {
        _openPopup(mapRef.current, entry.marker, entry.item);
      }
    });

    const offCardLeave = PinSyncBus.on("card:leave", (id) => {
      _highlightPin(id, false);
      if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
    });

    const offCardClick = PinSyncBus.on("card:click", (id) => {
      _highlightPin(id, true);
      _panToPin(id);
      if (mapRef.current) {
        const entry = markersRef.current.find((m) => m.id === id);
        if (entry) {
          mapRef.current.setView(
            [entry.lat, entry.lng],
            Math.max(mapRef.current.getZoom(), 11),
            { animate: true, duration: 0.5 }
          );
        }
      }
    });

    return () => { offCardHover(); offCardLeave(); offCardClick(); };
  }, [followMode, _highlightPin, _panToPin]);

  // ── Filter bar pill renderer ──────────────────────────────────────────────
  function FilterPill({ cat, label: pillLabel, color }) {
    const isActive = pinFilter === cat;
    return (
      <button
        onClick={() => {
          const next = isActive ? "all" : cat;
          setPinFilter(next);
          onFilterChange?.(next === "all" ? null : cat);
        }}
        style={{
          display:        "flex",
          alignItems:     "center",
          gap:            5,
          fontFamily:     NU,
          fontSize:       9,
          fontWeight:     600,
          letterSpacing:  "0.12em",
          textTransform:  "uppercase",
          color:          isActive ? color : "rgba(255,255,255,0.38)",
          background:     isActive ? `${color}18` : "rgba(8,6,4,0.65)",
          backdropFilter: "blur(8px)",
          border:         `1px solid ${isActive ? `${color}60` : "rgba(255,255,255,0.1)"}`,
          borderRadius:   6,
          padding:        "5px 9px",
          cursor:         "pointer",
          transition:     "all 0.2s ease",
          whiteSpace:     "nowrap",
        }}
      >
        <span style={{
          width: 6, height: 6, borderRadius: "50%",
          background: isActive ? color : "rgba(255,255,255,0.2)",
          flexShrink: 0,
          transition: "background 0.2s",
        }} />
        {pillLabel}
      </button>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  const zoomTopOffset = showFilterBar ? 96 : 52;

  return (
    <div
      aria-label="Map"
      style={{
        position:     "relative",
        width:        "100%",
        height:       "100%",
        minHeight:    480,
        background:   "#0d1012",
        borderRadius: "var(--lwd-radius-card, 8px) 0 0 var(--lwd-radius-card, 8px)",
        overflow:     "hidden",
      }}
    >
      {/* Left-edge gradient fade */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 52,
          background: `linear-gradient(to right, ${pageBg}, transparent)`,
          zIndex: 400, pointerEvents: "none",
        }}
      />

      {/* Leaflet map canvas */}
      <div ref={mapElRef} style={{ width: "100%", height: "100%" }} />

      {/* Loading overlay */}
      {!ready && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(10,8,6,0.92)", zIndex: 10,
        }}>
          <span style={{
            fontFamily: NU, fontSize: 11, letterSpacing: "0.25em",
            textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
          }}>
            Loading map…
          </span>
        </div>
      )}

      {/* ── Map header: label + controls ── */}
      <div style={{
        position: "absolute", top: 14, left: 62, right: 14,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        zIndex: 500, userSelect: "none",
      }}>
        <span style={{
          fontFamily: NU, fontSize: 9, letterSpacing: "0.38em",
          textTransform: "uppercase", color: "rgba(255,255,255,0.28)",
          pointerEvents: "none",
        }}>
          {label}
        </span>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button
            onClick={() => setFollowMode((f) => !f)}
            title={followMode ? "Following active card" : "Free navigation"}
            style={{
              fontFamily: NU, fontSize: 9, fontWeight: 600,
              letterSpacing: "0.12em", textTransform: "uppercase",
              color:      followMode ? GOLD : "rgba(255,255,255,0.3)",
              background: followMode ? "rgba(201,168,76,0.1)" : "rgba(8,6,4,0.65)",
              backdropFilter: "blur(8px)",
              border:     `1px solid ${followMode ? "rgba(201,168,76,0.32)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 6, padding: "5px 10px",
              cursor: "pointer", transition: "all 0.25s",
            }}
          >
            {followMode ? "● Follow" : "○ Free"}
          </button>

          {onToggleView && (
            <button
              onClick={onToggleView}
              style={{
                fontFamily: NU, fontSize: 9, fontWeight: 600,
                letterSpacing: "0.15em", textTransform: "uppercase",
                color: GOLD,
                background: "rgba(8,6,4,0.75)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(201,168,76,0.25)", borderRadius: 6,
                padding: "5px 10px", cursor: "pointer", transition: "all 0.25s",
              }}
            >
              {viewMode === "grid" ? "⊞ Grid" : "≡ List"}
            </button>
          )}
        </div>
      </div>

      {/* ── Category filter bar (mixed data only) ── */}
      {showFilterBar && (
        <div style={{
          position:   "absolute",
          top:        42,
          left:       62,
          right:      14,
          zIndex:     500,
          display:    "flex",
          gap:        5,
          alignItems: "center",
          flexWrap:   "nowrap",
          overflowX:  "auto",
          paddingBottom: 2,
          scrollbarWidth: "none",
        }}>
          {/* All pill */}
          <button
            onClick={() => { setPinFilter("all"); onFilterChange?.(null); }}
            style={{
              fontFamily:     NU,
              fontSize:       9,
              fontWeight:     600,
              letterSpacing:  "0.12em",
              textTransform:  "uppercase",
              color:          pinFilter === "all" ? GOLD : "rgba(255,255,255,0.38)",
              background:     pinFilter === "all" ? "rgba(201,168,76,0.12)" : "rgba(8,6,4,0.65)",
              backdropFilter: "blur(8px)",
              border:         `1px solid ${pinFilter === "all" ? "rgba(201,168,76,0.5)" : "rgba(255,255,255,0.1)"}`,
              borderRadius:   6,
              padding:        "5px 10px",
              cursor:         "pointer",
              transition:     "all 0.2s ease",
              whiteSpace:     "nowrap",
              flexShrink:     0,
            }}
          >
            All
          </button>

          {/* Per-category pills — only categories present in data */}
          {presentCategories.map((cat) => (
            <FilterPill
              key={cat}
              cat={cat}
              label={PIN_LABELS[cat] || cat}
              color={PIN_COLOURS[cat] || GOLD}
            />
          ))}
        </div>
      )}

      {/* Aura annotation — bottom-left glass panel */}
      {auraSummary && (
        <div style={{
          position:       "absolute",
          bottom:         20,
          left:           62,
          maxWidth:       280,
          zIndex:         500,
          background:     "rgba(10,8,6,0.82)",
          backdropFilter: "blur(12px)",
          border:         "1px solid rgba(201,168,76,0.22)",
          borderLeft:     "3px solid rgba(201,168,76,0.7)",
          borderRadius:   "0 6px 6px 0",
          padding:        "8px 12px",
          pointerEvents:  "none",
        }}>
          <div style={{
            fontFamily: NU, fontSize: 8, fontWeight: 700,
            letterSpacing: "0.22em", textTransform: "uppercase",
            color: GOLD, opacity: 0.72, marginBottom: 4,
          }}>
            ✦ Aura
          </div>
          <div style={{
            fontFamily: NU, fontSize: 11, fontStyle: "italic",
            color: "rgba(255,255,255,0.62)", lineHeight: 1.5,
          }}>
            {auraSummary}
          </div>
        </div>
      )}

      {/* Popup + pin CSS */}
      <style>{`
        .lwd-mmap-popup .leaflet-popup-content-wrapper {
          background: rgba(10,8,6,0.96) !important;
          border: 1px solid rgba(201,168,76,0.18) !important;
          border-radius: 8px !important;
          box-shadow: 0 12px 48px rgba(0,0,0,0.65) !important;
          backdrop-filter: blur(14px) !important;
          padding: 0 !important;
        }
        .lwd-mmap-popup .leaflet-popup-tip-container { display: none !important; }
        .lwd-mmap-popup .leaflet-popup-content {
          margin: 0 !important; padding: 0 !important; width: auto !important;
        }
        .lwd-mmap-pin--active { transition: transform 0.15s ease; }
        @keyframes lwd-pin-pulse {
          0%,100% { transform: scale(1); }
          50%      { transform: scale(1.18); }
        }
        .lwd-mmap-pin--active svg { animation: lwd-pin-pulse 1.8s ease-in-out infinite; }
        @keyframes lwd-ring-pulse {
          0%,100% { opacity: 0.4; transform: scale(1); }
          50%      { opacity: 0.15; transform: scale(1.3); }
        }
        .lwd-pin-glow-ring { animation: lwd-ring-pulse 2s ease-in-out infinite; }
        .leaflet-control-zoom {
          border: 1px solid rgba(201,168,76,0.2) !important;
          border-radius: 6px !important;
          overflow: hidden;
          margin-top: ${zoomTopOffset}px !important;
          margin-left: 14px !important;
        }
        .leaflet-control-zoom a {
          background: rgba(10,8,6,0.82) !important;
          color: rgba(201,168,76,0.7) !important;
          border-bottom: 1px solid rgba(201,168,76,0.1) !important;
          width: 28px !important; height: 28px !important;
          line-height: 28px !important; font-size: 16px !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(201,168,76,0.12) !important;
          color: #C9A84C !important;
        }
        .lwd-mmap-filter-scroll::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
