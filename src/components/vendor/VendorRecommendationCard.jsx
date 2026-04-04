// ─── src/components/vendor/VendorRecommendationCard.jsx ──────────────────────
// Displays ONE personalised media recommendation per vendor.
// ONE insight. ONE action. CLEAR cause.
// Loads from get_vendor_recommendation() RPC.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

const GOLD        = "#C9A84C";
const GOLD_DIM    = "rgba(201,168,76,0.10)";
const GOLD_BORDER = "rgba(201,168,76,0.28)";
const GD          = "var(--font-heading-primary)";
const NU          = "var(--font-body)";

// Rule-key → icon mapping
const RULE_ICONS = {
  best_image_buried:          "◎",
  high_interest_low_conversion: "⇡",
  weak_visual_engagement:     "◈",
  low_dwell:                  "◷",
  thin_gallery:               "▦",
  high_performing:            "✦",
  no_data:                    "◌",
};

// Rule-key → accent color
const RULE_COLORS = {
  best_image_buried:            GOLD,
  high_interest_low_conversion: "#f59e0b",
  weak_visual_engagement:       "#f59e0b",
  low_dwell:                    "#f59e0b",
  thin_gallery:                 "#f59e0b",
  high_performing:              "#4ade80",
  no_data:                      "rgba(255,255,255,0.35)",
};

export default function VendorRecommendationCard({ listingId, C, className }) {
  const [rec,     setRec]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const isLight     = C?.bg === "#F2EFE9" || C?.bg?.startsWith("#F");
  const cardBg      = isLight ? "#fff" : (C?.card || "#1a1714");
  const border      = isLight ? "rgba(0,0,0,0.08)" : (C?.border || "rgba(255,255,255,0.07)");
  const textPrimary = isLight ? "#1a1a1a" : (C?.white || "#F5F0E8");
  const textMuted   = isLight ? "rgba(28,20,16,0.5)" : (C?.grey || "rgba(255,255,255,0.45)");

  useEffect(() => {
    if (!listingId) { setLoading(false); return; }
    setLoading(true);
    Promise.resolve(
      supabase.rpc("get_vendor_recommendation", { p_listing_id: listingId })
    ).then(({ data, error: err }) => {
      if (err) { setError(err.message); }
      else      { setRec(data?.[0] || null); }
      setLoading(false);
    });
  }, [listingId]);

  if (!listingId) return null;

  const accent = rec ? (RULE_COLORS[rec.rule_key] || GOLD) : GOLD;
  const icon   = rec ? (RULE_ICONS[rec.rule_key]  || "✦") : "✦";

  return (
    <div className={className} style={{
      background: cardBg,
      border: `1px solid ${border}`,
      borderRadius: "var(--lwd-radius-card)",
      overflow: "hidden",
    }}>
      {/* Header strip */}
      <div style={{
        padding: "14px 18px 12px",
        borderBottom: `1px solid ${border}`,
        display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 10,
      }}>
        <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "2px",
          textTransform: "uppercase", color: textMuted }}>
          Visual Recommendation
        </div>
        <div style={{
          fontFamily: NU, fontSize: 8, letterSpacing: "1px",
          textTransform: "uppercase", fontWeight: 700,
          color: accent, background: `${accent}18`,
          border: `1px solid ${accent}44`,
          borderRadius: 20, padding: "2px 9px",
        }}>
          ✦ Personalised
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "18px 18px 16px" }}>
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[1, 2].map(i => (
              <div key={i} style={{ height: 16, borderRadius: 4,
                background: "rgba(128,128,128,0.07)", width: i === 1 ? "55%" : "85%" }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div style={{ fontFamily: NU, fontSize: 12, color: textMuted }}>
            Unable to load recommendation right now.
          </div>
        )}

        {!loading && !error && rec && (
          <div style={{ display: "flex", gap: 14 }}>
            {/* Icon */}
            <div style={{
              fontFamily: GD, fontSize: 22, color: accent,
              lineHeight: 1, flexShrink: 0, marginTop: 2,
            }}>
              {icon}
            </div>

            {/* Content */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: NU, fontSize: 14, fontWeight: 700,
                color: textPrimary, marginBottom: 6, lineHeight: 1.3,
              }}>
                {rec.headline}
              </div>
              <div style={{
                fontFamily: NU, fontSize: 12, color: textMuted,
                lineHeight: 1.65, marginBottom: 10,
              }}>
                {rec.body}
              </div>
              {rec.action_hint && rec.rule_key !== "no_data" && (
                <div style={{
                  display: "flex", alignItems: "flex-start", gap: 8,
                  padding: "10px 12px",
                  background: `${accent}0d`,
                  border: `1px solid ${accent}33`,
                  borderRadius: "var(--lwd-radius-input)",
                }}>
                  <span style={{ color: accent, fontSize: 12, flexShrink: 0, marginTop: 1 }}>→</span>
                  <span style={{
                    fontFamily: NU, fontSize: 11, fontWeight: 600,
                    color: isLight ? "#1a1a1a" : (C?.white || "#F5F0E8"),
                    lineHeight: 1.4,
                  }}>
                    {rec.action_hint}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
