// src/components/cards/VenueListItemCard.jsx
// Horizontal list card — image left · content right · all CTAs.
// Rebuilt April 2026: image cycling, cinematic gradient, inclusions strip,
// proper location fallback, premium spacing. Target: 8.5/10.

import { useState, useEffect, useRef } from "react";
import { trackCompareAdd } from "../../services/userEventService";
import { useTheme } from "../../theme/ThemeContext";
import { useShortlist } from "../../shortlist/ShortlistContext";
import Stars from "../ui/Stars";
import ShortlistButton from "../buttons/ShortlistButton";
import CompareCheckbox from "../buttons/CompareCheckbox";
import LuxeEnquiryModal from "../enquiry/LuxeEnquiryModal";
import TierBadge from "../editorial/TierBadge";
import { getQualityTier } from "../../services/listings";

const GOLD   = "#C9A84C";
const GD     = "var(--font-heading-primary)";
const NU     = "var(--font-body)";
const CYCLE_MS = 2200; // ms per image when hovering

const COMPARE_KEY = "lwd_compare_list";
function loadCompareList() {
  try { return JSON.parse(sessionStorage.getItem(COMPARE_KEY)) || []; }
  catch { return []; }
}
function saveCompareList(list) {
  try { sessionStorage.setItem(COMPARE_KEY, JSON.stringify(list)); }
  catch {}
}

// Resolve location string with full fallback chain
function resolveLocation(v) {
  const parts = [];
  const city   = v.city   || v.cityName   || null;
  const region = v.region || v.regionName || (v.regionSlug ? v.regionSlug.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ") : null);
  const country = v.country || v.countryName || null;
  if (city)   parts.push(city);
  if (region && region !== city) parts.push(region);
  if (country && parts.length === 0) parts.push(country);
  return parts.join(", ");
}

export default function VenueListItemCard({ v, onView, isHighlighted, quickViewItem, setQuickViewItem }) {
  const C   = useTheme();
  const { isShortlisted, toggleItem } = useShortlist();

  const [hov,          setHov]          = useState(false);
  const [imgIdx,       setImgIdx]       = useState(0);
  const [imgFading,    setImgFading]    = useState(false);
  const [showEnquiry,  setShowEnquiry]  = useState(false);
  const [compareList,  setCompareList]  = useState(loadCompareList);
  const cycleRef = useRef(null);

  // Normalise images array
  const imgs = (v.imgs || []).map(i => typeof i === "string" ? i : i?.src || i?.url || "").filter(Boolean);
  const imgSrc = imgs[imgIdx] || "";
  const hasMultiple = imgs.length > 1;

  // Auto-cycle images on hover
  useEffect(() => {
    if (hov && hasMultiple) {
      cycleRef.current = setInterval(() => {
        setImgFading(true);
        setTimeout(() => {
          setImgIdx(i => (i + 1) % imgs.length);
          setImgFading(false);
        }, 280);
      }, CYCLE_MS);
    } else {
      clearInterval(cycleRef.current);
      if (!hov) { setImgIdx(0); setImgFading(false); }
    }
    return () => clearInterval(cycleRef.current);
  }, [hov, hasMultiple, imgs.length]);

  // Keep compareList in sync across cards
  useEffect(() => {
    const sync = () => setCompareList(loadCompareList());
    window.addEventListener("lwd:compare-bar", sync);
    return () => window.removeEventListener("lwd:compare-bar", sync);
  }, []);

  const active     = hov || isHighlighted;
  const isCompared = compareList.some(i => i.id === v.id);
  const price      = v.priceFrom || v.price || null;
  const guests     = v.capacity  || v.maxGuests || null;
  const style      = v.styles?.[0] || v.style || null;
  const location   = resolveLocation(v);
  const inclusions = (v.inclusions || v.amenities || []).slice(0, 4);

  return (
    <article
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onView?.(v)}
      style={{
        display:       "flex",
        flexDirection: "row",
        alignItems:    "stretch",
        background:    active ? "rgba(201,168,76,0.04)" : C.card,
        border:        `1px solid ${active ? "rgba(201,168,76,0.28)" : C.border}`,
        borderRadius:  "var(--lwd-radius-card)",
        overflow:      "hidden",
        cursor:        "pointer",
        transition:    "border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease",
        boxShadow:     active ? "0 8px 32px rgba(0,0,0,0.18)" : "none",
        flexShrink:    0,
      }}
    >

      {/* ── IMAGE ─────────────────────────────────────────────────────────── */}
      <div style={{
        width:      357,
        minWidth:   357,
        height:     244,
        position:   "relative",
        overflow:   "hidden",
        background: "#0a0806",
        flexShrink: 0,
      }}>

        {imgSrc && (
          <img
            src={imgSrc}
            alt={v.name}
            loading="lazy"
            style={{
              width:      "100%",
              height:     "100%",
              objectFit:  "cover",
              display:    "block",
              opacity:    imgFading ? 0 : 1,
              transform:  active && !imgFading ? "scale(1.04)" : "scale(1)",
              transition: imgFading
                ? "opacity 0.28s ease"
                : "transform 0.7s cubic-bezier(0.16,1,0.3,1), opacity 0.28s ease",
            }}
          />
        )}

        {/* Cinematic gradient — bottom fade */}
        <div style={{
          position:   "absolute",
          inset:      0,
          background: "linear-gradient(to top, rgba(10,8,6,0.72) 0%, rgba(10,8,6,0.18) 40%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Top-left badges */}
        <div style={{ position: "absolute", top: 10, left: 10, display: "flex", flexDirection: "column", gap: 4 }}>
          {(v.featured || v.tag) && (
            <span style={{
              fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: "0.9px",
              textTransform: "uppercase", color: "#0f0d0a",
              background: `linear-gradient(135deg, ${GOLD}, #e8c97a)`,
              borderRadius: 16, padding: "3px 9px",
            }}>
              {v.featured ? "Editor's Pick" : v.tag}
            </span>
          )}
          {v.showcaseUrl && (
            <a
              href={v.showcaseUrl}
              onClick={e => e.stopPropagation()}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "2px 7px", borderRadius: 16,
                background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)",
                textDecoration: "none",
              }}
            >
              <span style={{ color: GOLD, fontSize: 7 }}>✦</span>
              <span style={{ fontFamily: NU, fontSize: 7, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: GOLD }}>
                Showcase
              </span>
            </a>
          )}
        </div>

        {/* Verified — bottom left */}
        {v.verified && (
          <div style={{ position: "absolute", bottom: 10, left: 10 }}>
            <span style={{
              fontFamily: NU, fontSize: 8, fontWeight: 600, letterSpacing: "0.3px",
              color: "#22c55e", background: "rgba(0,0,0,0.65)", borderRadius: 16,
              padding: "2px 7px", display: "flex", alignItems: "center", gap: 3,
            }}>✓ Verified</span>
          </div>
        )}

        {/* Image dots — bottom right */}
        {hasMultiple && (
          <div style={{
            position: "absolute", bottom: 10, right: 10,
            display: "flex", gap: 4,
          }}>
            {imgs.slice(0, 5).map((_, i) => (
              <span key={i} style={{
                width: 4, height: 4, borderRadius: "50%",
                background: i === imgIdx ? GOLD : "rgba(255,255,255,0.4)",
                transition: "background 0.3s ease",
              }} />
            ))}
          </div>
        )}

        {/* Shortlist heart */}
        <div style={{ position: "absolute", top: 10, right: 10, zIndex: 4 }} onClick={e => e.stopPropagation()}>
          <ShortlistButton
            item={{ id: v.id, name: v.name, image: v.imgs?.[0], category: "venue", price: v.priceFrom, type: "venue" }}
            isShortlisted={isShortlisted(v.id)}
            onToggle={() => toggleItem({ id: v.id, name: v.name, image: v.imgs?.[0], category: "venue", price: v.priceFrom, type: "venue" })}
            variant="icon"
            size="medium"
            strokeColor="#ffffff"
          />
        </div>
      </div>

      {/* ── CONTENT ───────────────────────────────────────────────────────── */}
      <div style={{
        flex:           1,
        padding:        "22px 24px 20px",
        display:        "flex",
        flexDirection:  "column",
        justifyContent: "space-between",
        minWidth:       0,
        position:       "relative",
      }}>

        {/* Compare — top right */}
        <div style={{ position: "absolute", top: 18, right: 20, zIndex: 4 }} onClick={e => e.stopPropagation()}>
          <CompareCheckbox
            item={{ id: v.id, name: v.name, image: v.imgs?.[0], category: "venue", price: v.priceFrom, type: "venue" }}
            isCompared={isCompared}
            onToggle={() => {
              const current  = loadCompareList();
              const alreadyIn = current.some(i => i.id === v.id);
              let updated;
              if (alreadyIn) {
                updated = current.filter(i => i.id !== v.id);
              } else {
                if (current.length >= 3) return;
                updated = [...current, { id: v.id, name: v.name }];
                trackCompareAdd({ venueId: v.id, venueName: v.name, compareList: current, sourceSurface: "list_card" });
              }
              saveCompareList(updated);
              setCompareList(updated);
              window.dispatchEvent(new CustomEvent("lwd:compare-bar", { detail: { active: updated.length > 0 } }));
            }}
          />
        </div>

        {/* ── Top block ── */}
        <div>

          {/* Name */}
          <h3 style={{
            fontFamily:    GD,
            fontSize:      18,
            fontStyle:     "italic",
            fontWeight:    500,
            color:         C.white,
            lineHeight:    1.15,
            margin:        "0 0 4px",
            paddingRight:  36,
          }}>
            {v.name}
          </h3>

          {/* Location */}
          {location && (
            <div style={{
              fontFamily:    NU,
              fontSize:      11,
              color:         C.grey,
              marginBottom:  10,
              letterSpacing: "0.2px",
            }}>
              {location}
            </div>
          )}

          {/* Meta row: style pill · rating · tier */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            {style && (
              <span style={{
                fontFamily: NU, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.9px",
                textTransform: "uppercase", color: GOLD,
                background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.22)",
                borderRadius: 16, padding: "2px 9px", flexShrink: 0,
              }}>
                {style}
              </span>
            )}
            {v.rating > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Stars rating={v.rating} size={10} color={GOLD} />
                <span style={{ fontFamily: NU, fontSize: 10, color: C.grey }}>
                  {v.rating.toFixed(1)} ({v.reviews || v.reviewCount || 0})
                </span>
              </div>
            )}
            {v.contentScore !== undefined && (
              <TierBadge tier={getQualityTier(v.contentScore)} showLabel size="sm" />
            )}
          </div>

          {/* Capacity */}
          {guests && (
            <div style={{
              fontFamily:   NU,
              fontSize:     10,
              color:        C.grey,
              marginBottom: 8,
              letterSpacing: "0.1px",
            }}>
              ✦ Up to {guests} guests
            </div>
          )}

          {/* Description */}
          {v.desc && (
            <p style={{
              fontFamily:           NU,
              fontSize:             13,
              color:                C.grey,
              lineHeight:           1.6,
              margin:               "0 0 12px",
              display:              "-webkit-box",
              WebkitLineClamp:      3,
              WebkitBoxOrient:      "vertical",
              overflow:             "hidden",
            }}>
              {v.desc}
            </p>
          )}

          {/* Inclusions strip */}
          {inclusions.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
              {inclusions.map((inc, i) => (
                <span key={i} style={{
                  fontFamily:    NU,
                  fontSize:      9,
                  color:         C.grey,
                  background:    "rgba(255,255,255,0.04)",
                  border:        `1px solid ${C.border}`,
                  borderRadius:  12,
                  padding:       "2px 8px",
                  letterSpacing: "0.2px",
                }}>
                  {inc}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Bottom: price + CTAs ── */}
        <div style={{
          display:      "flex",
          alignItems:   "center",
          flexWrap:     "wrap",
          gap:          "6px 10px",
          marginTop:    "auto",
          paddingTop:   12,
          borderTop:    `1px solid ${C.border}`,
        }}>
          {price && (
            <div style={{ fontFamily: GD, fontSize: 15, color: C.gold, fontStyle: "italic", letterSpacing: "-0.4px", marginRight: "auto" }}>
              <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 400, color: C.grey, marginRight: 3 }}>From</span>
              {price}
            </div>
          )}

          <button
            onClick={e => { e.stopPropagation(); setQuickViewItem?.(v); }}
            style={{
              fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "1px",
              textTransform: "uppercase", color: GOLD,
              background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)",
              borderRadius: 4, padding: "7px 12px", cursor: "pointer", whiteSpace: "nowrap",
              transition: "background 0.2s, border-color 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,168,76,0.14)"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.45)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(201,168,76,0.08)"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.25)"; }}
          >
            Quick View
          </button>

          <button
            onClick={e => { e.stopPropagation(); setShowEnquiry(true); }}
            style={{
              fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "1px",
              textTransform: "uppercase", color: "#0f0d0a",
              background: `linear-gradient(135deg, ${GOLD}, #e8c97a)`,
              border: "1px solid transparent", borderRadius: 4,
              padding: "7px 14px", cursor: "pointer", whiteSpace: "nowrap",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            Enquire
          </button>

          <button
            onClick={e => { e.stopPropagation(); onView?.(v); }}
            style={{
              fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "1px",
              textTransform: "uppercase", color: GOLD,
              background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)",
              borderRadius: 4, padding: "7px 12px", cursor: "pointer", whiteSpace: "nowrap",
              transition: "background 0.2s, border-color 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,168,76,0.14)"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.45)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(201,168,76,0.08)"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.25)"; }}
          >
            View Profile ›
          </button>
        </div>
      </div>

      {showEnquiry && (
        <LuxeEnquiryModal venue={v} onClose={() => setShowEnquiry(false)} entityType="venue" />
      )}
    </article>
  );
}
