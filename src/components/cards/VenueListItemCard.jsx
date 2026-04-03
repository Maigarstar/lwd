// src/components/cards/VenueListItemCard.jsx
// Compact horizontal card for the venue list+map view.
// Synced with LuxuryVenueCard data shape. Image left · content right · all CTAs.

import { useState, useEffect } from "react";
import { trackCompareAdd } from "../../services/userEventService";
import { useTheme } from "../../theme/ThemeContext";
import { useShortlist } from "../../shortlist/ShortlistContext";
import Stars from "../ui/Stars";
import ShortlistButton from "../buttons/ShortlistButton";
import CompareCheckbox from "../buttons/CompareCheckbox";
import LuxeEnquiryModal from "../enquiry/LuxeEnquiryModal";
import TierBadge from "../editorial/TierBadge";
import { getQualityTier } from "../../services/listings";

const GOLD = "#C9A84C";
const GD   = "var(--font-heading-primary)";
const NU   = "var(--font-body)";

const COMPARE_KEY = "lwd_compare_list";
function loadCompareList() {
  try { return JSON.parse(sessionStorage.getItem(COMPARE_KEY)) || []; }
  catch { return []; }
}
function saveCompareList(list) {
  try { sessionStorage.setItem(COMPARE_KEY, JSON.stringify(list)); }
  catch {}
}

export default function VenueListItemCard({ v, onView, isHighlighted, quickViewItem, setQuickViewItem }) {
  const C   = useTheme();
  const { isShortlisted, toggleItem } = useShortlist();
  const [hov, setHov] = useState(false);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [compareList, setCompareList] = useState(loadCompareList);

  // Keep compareList in sync when another card or VenueProfile updates sessionStorage
  useEffect(() => {
    const onCompareEvent = () => setCompareList(loadCompareList());
    window.addEventListener("lwd:compare-bar", onCompareEvent);
    return () => window.removeEventListener("lwd:compare-bar", onCompareEvent);
  }, []);

  const isCompared = compareList.some((i) => i.id === v.id);

  const imgSrc = typeof v.imgs?.[0] === "string" ? v.imgs[0] : v.imgs?.[0]?.src || v.imgs?.[0]?.url || "";
  const active = hov || isHighlighted;

  const price = v.priceFrom || v.price || null;
  const guests = v.capacity || v.maxGuests || null;
  const style  = v.styles?.[0] || v.style || null;

  return (
    <article
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onView?.(v)}
      style={{
        display:        "flex",
        flexDirection:  "row",
        alignItems:     "stretch",
        background:     active ? "rgba(201,168,76,0.04)" : C.card,
        border:         `1px solid ${active ? "rgba(201,168,76,0.3)" : C.border}`,
        borderRadius:   "var(--lwd-radius-card)",
        overflow:       "hidden",
        cursor:         "pointer",
        transition:     "all 0.25s ease",
        boxShadow:      active ? "0 4px 20px rgba(0,0,0,0.15)" : "none",
        flexShrink:     0,
      }}
    >
      {/* Image */}
      <div style={{
        width:      "clamp(280px, 35%, 380px)",
        minWidth:   "clamp(280px, 35%, 380px)",
        height:     380,
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
              width: "100%", height: "100%", objectFit: "cover",
              transform: active ? "scale(1.05)" : "scale(1)",
              transition: "transform 0.7s ease",
              display: "block",
            }}
          />
        )}
        {/* Featured badge */}
        {(v.featured || v.tag) && (
          <div style={{ position: "absolute", top: 10, left: 10 }}>
            <span style={{
              fontFamily: NU, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.9px",
              textTransform: "uppercase", color: "#0f0d0a",
              background: `linear-gradient(135deg, ${GOLD}, #e8c97a)`,
              borderRadius: 16, padding: "3px 9px",
            }}>{v.featured ? "Editor's Pick" : v.tag}</span>
          </div>
        )}
        {/* Verified badge */}
        {v.verified && (
          <div style={{ position: "absolute", bottom: 10, right: 10 }}>
            <span style={{
              fontFamily: NU, fontSize: 8, fontWeight: 600, letterSpacing: "0.4px",
              color: "#22c55e", background: "rgba(0,0,0,0.7)", borderRadius: 16,
              padding: "2px 7px", display: "flex", alignItems: "center", gap: 3,
            }}>✓ Verified</span>
          </div>
        )}
        {/* Shortlist heart */}
        <div style={{ position: "absolute", top: 10, right: 10, zIndex: 4 }} onClick={(e) => e.stopPropagation()}>
          <ShortlistButton
            item={{ id: v.id, name: v.name, image: v.imgs?.[0], category: "venue", price: v.priceFrom, type: "venue" }}
            isShortlisted={isShortlisted(v.id)}
            onToggle={(itemId, newState) => {
              toggleItem({ id: itemId, name: v.name, image: v.imgs?.[0], category: "venue", price: v.priceFrom, type: "venue" });
            }}
            variant="icon"
            size="medium"
            strokeColor="#ffffff"
          />
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex:           1,
        padding:        "16px 18px",
        display:        "flex",
        flexDirection:  "column",
        justifyContent: "space-between",
        minWidth:       0,
        position:       "relative",
      }}>
        {/* Compare checkbox */}
        <div style={{ position: "absolute", top: 16, right: 18, zIndex: 4 }} onClick={(e) => e.stopPropagation()}>
          <CompareCheckbox
            item={{ id: v.id, name: v.name, image: v.imgs?.[0], category: "venue", price: v.priceFrom, type: "venue" }}
            isCompared={isCompared}
            onToggle={() => {
              const current = loadCompareList();
              const alreadyIn = current.some((i) => i.id === v.id);
              let updated;
              if (alreadyIn) {
                updated = current.filter((i) => i.id !== v.id);
              } else {
                if (current.length >= 3) return; // max 3 — silently ignore
                updated = [...current, { id: v.id, name: v.name }];
                trackCompareAdd({ venueId: v.id, venueName: v.name, compareList: current, sourceSurface: 'list_card' });
              }
              saveCompareList(updated);
              setCompareList(updated);
              window.dispatchEvent(new CustomEvent("lwd:compare-bar", { detail: { active: updated.length > 0 } }));
            }}
          />
        </div>

        {/* Top: name + location + meta */}
        <div>
          {/* Showcase indicator */}
          {v.showcaseUrl && (
            <a
              href={v.showcaseUrl}
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                marginBottom: 6, marginTop: -2,
                padding: "2px 7px", borderRadius: 16,
                background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)",
                textDecoration: "none", cursor: "pointer",
              }}
            >
              <span style={{ color: GOLD, fontSize: 8, lineHeight: 1 }}>✦</span>
              <span style={{
                fontFamily: NU, fontSize: 7, fontWeight: 700, letterSpacing: "0.8px",
                textTransform: "uppercase", color: GOLD,
              }}>A Showcase Property</span>
            </a>
          )}

          <div style={{
            fontFamily: GD, fontSize: 24, fontStyle: "italic", fontWeight: 500,
            color: C.white, lineHeight: 1.15, marginBottom: 2,
          }}>
            {v.name}
          </div>
          <div style={{ fontFamily: NU, fontSize: 11, color: C.grey, marginBottom: 6, letterSpacing: "0.2px" }}>
            {v.city}{v.region ? `, ${v.region}` : ""}
          </div>

          {/* Style pill + rating + tier */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
            {style && (
              <span style={{
                fontFamily: NU, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.9px",
                textTransform: "uppercase", color: GOLD,
                background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)",
                borderRadius: 16, padding: "2px 8px", flexShrink: 0,
              }}>{style}</span>
            )}
            {v.rating > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Stars rating={v.rating} size={10} color={GOLD} />
                <span style={{ fontFamily: NU, fontSize: 10, fontWeight: 500, color: C.grey, letterSpacing: "0.1px" }}>
                  {v.rating.toFixed(1)} ({v.reviews || v.reviewCount || 0})
                </span>
              </div>
            )}
            {v.contentScore !== undefined && (
              <TierBadge tier={getQualityTier(v.contentScore)} showLabel={true} size="sm" />
            )}
          </div>

          {/* Capacity */}
          {guests && (
            <div style={{ fontFamily: NU, fontSize: 10, color: C.grey, marginBottom: 0, letterSpacing: "0.1px" }}>
              ✦ Up to {guests} guests
            </div>
          )}

          {/* Description */}
          {v.desc && (
            <p style={{ fontFamily: NU, fontSize: 15, color: C.grey, lineHeight: 1.5, margin: "8px 0 0", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {v.desc}
            </p>
          )}
        </div>

        {/* Bottom: price + CTAs */}
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px 10px", marginTop: "auto", borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
          {price && (
            <div style={{ fontFamily: GD, fontSize: 15, color: C.gold, fontStyle: "italic", letterSpacing: "-0.4px", marginRight: "auto" }}>
              <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 400, color: C.grey, marginRight: 3 }}>From</span>
              {price}
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setQuickViewItem?.(v); }}
            style={{
              fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "1px",
              textTransform: "uppercase", color: GOLD,
              background: "rgba(201,168,76,0.10)", border: "1px solid rgba(201,168,76,0.3)",
              borderRadius: 4, padding: "6px 10px",
              cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            QV
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowEnquiry(true); }}
            style={{
              fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "1px",
              textTransform: "uppercase", color: "#0f0d0a",
              background: `linear-gradient(135deg, ${GOLD}, #e8c97a)`,
              border: "1px solid transparent", borderRadius: 4,
              padding: "6px 12px", cursor: "pointer", whiteSpace: "nowrap",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Enquire
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onView?.(v); }}
            style={{
              fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "1px",
              textTransform: "uppercase", color: GOLD,
              background: "rgba(201,168,76,0.10)", border: "1px solid rgba(201,168,76,0.3)",
              borderRadius: 4, padding: "6px 10px",
              cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            Profile ›
          </button>
        </div>
      </div>

      {/* Enquiry modal */}
      {showEnquiry && (
        <LuxeEnquiryModal venue={v} onClose={() => setShowEnquiry(false)} entityType="venue" />
      )}
    </article>
  );
}
