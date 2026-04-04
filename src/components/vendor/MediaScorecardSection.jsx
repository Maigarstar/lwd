// ─── src/components/vendor/MediaScorecardSection.jsx ─────────────────────────
// Visual Media Intelligence — vendor-facing scorecard section.
// Injected into VendorAnalyticsPanel below the Revenue Impact block.
// Shows: media score ring, top performing images, gallery heatmap,
// style trends, share breakdown, search intelligence, improvement tip.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

const GOLD        = "#C9A84C";
const GOLD_DIM    = "rgba(201,168,76,0.10)";
const GOLD_BORDER = "rgba(201,168,76,0.28)";
const GD          = "var(--font-heading-primary)";
const NU          = "var(--font-body)";

const SHARE_PLATFORMS = [
  { key: "instagram",  label: "Instagram",  color: "#E1306C" },
  { key: "pinterest",  label: "Pinterest",  color: "#E60023" },
  { key: "whatsapp",   label: "WhatsApp",   color: "#25D366" },
  { key: "twitter",    label: "Twitter/X",  color: "#1DA1F2" },
  { key: "copy_link",  label: "Link Copy",  color: GOLD },
];

// ── Score ring SVG ────────────────────────────────────────────────────────────
function ScoreRing({ score = 0, grade = "C", delta = null, C }) {
  const R = 44;
  const circ = 2 * Math.PI * R;
  const fill = (score / 100) * circ;
  const gradeColor = grade === "A" ? "#4ade80" : grade === "B" ? GOLD : grade === "C" ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ position: "relative", width: 110, height: 110, flexShrink: 0 }}>
      <svg width="110" height="110" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="55" cy="55" r={R} fill="none"
          stroke="rgba(201,168,76,0.12)" strokeWidth="8" />
        <circle cx="55" cy="55" r={R} fill="none"
          stroke={GOLD} strokeWidth="8"
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease", filter: "drop-shadow(0 0 6px rgba(201,168,76,0.5))" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ fontFamily: GD, fontSize: 28, fontWeight: 700,
          color: gradeColor, lineHeight: 1 }}>{grade}</div>
        <div style={{ fontFamily: NU, fontSize: 11, color: C?.grey || "rgba(255,255,255,0.45)",
          marginTop: 2 }}>{score}</div>
        {delta != null && (
          <div style={{ fontFamily: NU, fontSize: 9, marginTop: 1,
            color: delta >= 0 ? "#4ade80" : "#ef4444" }}>
            {delta >= 0 ? "+" : ""}{delta}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Gallery heatmap bar ───────────────────────────────────────────────────────
function GalleryHeatmap({ positions = [], isMobile, C }) {
  if (!positions.length) return null;
  const maxCtr = Math.max(...positions.map(p => parseFloat(p.ctr) || 0), 1);
  const bestPos = positions.reduce((b, p) =>
    (parseFloat(p.ctr) || 0) > (parseFloat(b.ctr) || 0) ? p : b, positions[0]);

  return (
    <div>
      <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "2px",
        textTransform: "uppercase", color: C?.grey || "rgba(255,255,255,0.45)",
        marginBottom: 10 }}>
        Gallery Position Performance (CTR)
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 64, overflowX: "auto" }}>
        {positions.map(p => {
          const ctr    = parseFloat(p.ctr) || 0;
          const height = Math.max(8, Math.round((ctr / maxCtr) * 56));
          const isBest = p.gallery_position === bestPos?.gallery_position;
          return (
            <div key={p.gallery_position}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <div style={{
                width: isMobile ? 22 : 28, height,
                background: isBest ? GOLD : "rgba(201,168,76,0.3)",
                borderRadius: "3px 3px 0 0",
                boxShadow: isBest ? "0 0 8px rgba(201,168,76,0.5)" : "none",
                transition: "height 0.4s ease",
                flexShrink: 0,
              }} />
              <div style={{ fontFamily: NU, fontSize: 8,
                color: isBest ? GOLD : (C?.grey || "rgba(255,255,255,0.35)") }}>
                {p.gallery_position}
              </div>
            </div>
          );
        })}
      </div>
      {bestPos && (
        <div style={{ fontFamily: NU, fontSize: 10, color: GOLD, marginTop: 6 }}>
          ✦ Position {bestPos.gallery_position} drives the most clicks —{" "}
          {bestPos.ctr}% CTR
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function MediaScorecardSection({ listingId, vendorName, rangeFrom, rangeTo, C, isMobile }) {
  const [loading,    setLoading]    = useState(true);
  const [scorecard,  setScorecard]  = useState(null);
  const [mediaStats, setMediaStats] = useState([]);
  const [positions,  setPositions]  = useState([]);
  const [expanded,   setExpanded]   = useState(true);

  const isLight    = C?.bg === "#F2EFE9" || C?.bg?.startsWith("#F");
  const cardBg     = isLight ? "#FFFFFF" : (C?.card || "#111111");
  const border     = isLight ? "rgba(0,0,0,0.08)" : (C?.border || "rgba(255,255,255,0.07)");
  const textPrimary = isLight ? "#1a1a1a" : (C?.white || "#F5F0E8");
  const textMuted   = isLight ? "rgba(28,20,16,0.5)" : (C?.grey || "rgba(255,255,255,0.45)");

  useEffect(() => {
    if (!listingId) { setLoading(false); return; }
    let cancelled = false;

    const from = rangeFrom || new Date(Date.now() - 30 * 86400_000).toISOString();
    const to   = rangeTo   || new Date().toISOString();

    Promise.all([
      Promise.resolve(
        supabase.from("vendor_media_scorecard")
          .select("*")
          .eq("listing_id", listingId)
          .order("snapshot_date", { ascending: false })
          .limit(2)
      ),
      Promise.resolve(
        supabase.rpc("get_listing_media_stats", { p_listing_id: listingId, p_from: from, p_to: to })
      ),
      Promise.resolve(
        supabase.rpc("get_gallery_position_performance", { p_listing_id: listingId, p_from: from, p_to: to })
      ),
    ]).then(([scRes, statsRes, posRes]) => {
      if (cancelled) return;
      const rows = scRes?.data || [];
      setScorecard(rows[0] || null);
      setMediaStats(statsRes?.data || []);
      setPositions(posRes?.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));

    return () => { cancelled = true; };
  }, [listingId, rangeFrom, rangeTo]);

  // ── Derived signals ────────────────────────────────────────────────────────
  const totalViews    = mediaStats.reduce((s, m) => s + Number(m.views    || 0), 0);
  const totalClicks   = mediaStats.reduce((s, m) => s + Number(m.clicks   || 0), 0);
  const totalShares   = mediaStats.reduce((s, m) => s + Number(m.shares   || 0), 0);
  const totalEnquiries = mediaStats.reduce((s, m) => s + Number(m.enquiries || 0), 0);
  const totalSaves    = scorecard?.downloads_30d || 0;
  const searchClicks  = scorecard?.views_30d ? 0 : 0; // populated by enrichment function

  const topThree = [...mediaStats]
    .sort((a, b) => (Number(b.clicks)*3 + Number(b.views) + Number(b.shares)*5) -
                    (Number(a.clicks)*3 + Number(a.views) + Number(a.shares)*5))
    .slice(0, 3);

  const styleTags     = scorecard?.trending_style_tags || [];
  const score         = scorecard?.media_score ?? null;
  const grade         = scorecard?.score_grade ?? null;
  const delta         = scorecard?.score_delta ?? null;
  const hasData       = totalViews > 0 || (score != null && score > 0);

  // Improvement tip logic
  const tip = (() => {
    if (!scorecard) return null;
    if (scorecard.tagged_pct < 20) return "Add style tags to your images — tagged media ranks higher in platform searches and trend reports.";
    if (scorecard.images_count < 8) return "Listings with 10+ images see significantly higher engagement. Adding more gallery shots could improve your score.";
    if (scorecard.featured_count < 2) return "Mark your strongest 2–3 images as featured — they appear first in search results and comparison views.";
    if ((score || 0) < 65) return "Your media score has room to grow. Strong imagery + style tags is the fastest path to an A grade.";
    return null;
  })();

  if (loading) {
    return (
      <div style={{ background: cardBg, border: `1px solid ${border}`,
        borderRadius: "var(--lwd-radius-card)", padding: "20px 22px" }}>
        <div style={{ height: 16, width: 140, borderRadius: 4,
          background: "rgba(128,128,128,0.08)", marginBottom: 12 }} />
        <div style={{ height: 80, borderRadius: 6,
          background: "rgba(128,128,128,0.06)", animation: "shimmer 1.4s ease infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ background: cardBg, border: `1px solid ${border}`,
      borderRadius: "var(--lwd-radius-card)", overflow: "hidden" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        onClick={() => setExpanded(x => !x)}
        style={{
          padding: "20px 22px",
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          borderBottom: expanded ? `1px solid ${border}` : "none",
        }}
      >
        <div>
          <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "2px",
            textTransform: "uppercase", color: GOLD, marginBottom: 4 }}>
            Visual Performance
          </div>
          <div style={{ fontFamily: NU, fontSize: 15, fontWeight: 700, color: textPrimary }}>
            Media Intelligence
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {grade && (
            <div style={{
              fontFamily: GD, fontSize: 16, fontWeight: 700,
              color: grade === "A" ? "#4ade80" : grade === "B" ? GOLD : "#f59e0b",
              background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}`,
              borderRadius: 6, padding: "3px 10px",
            }}>
              {grade} · {score}
            </div>
          )}
          <span style={{ color: textMuted, fontSize: 14, userSelect: "none" }}>
            {expanded ? "▲" : "▼"}
          </span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* ── Score ring + headline KPIs ─────────────────────────────────── */}
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
            {score != null ? (
              <ScoreRing score={score} grade={grade} delta={delta} C={C} />
            ) : (
              <div style={{
                width: 110, height: 110, borderRadius: "50%",
                border: `2px dashed rgba(201,168,76,0.2)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <span style={{ fontFamily: NU, fontSize: 9, color: textMuted,
                  textAlign: "center", padding: 8 }}>Score pending</span>
              </div>
            )}

            <div style={{ flex: 1, display: "grid",
              gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 10 }}>
              {[
                { label: "Image Views",  value: totalViews,    color: textPrimary },
                { label: "Clicks",       value: totalClicks,   color: GOLD },
                { label: "Shares",       value: totalShares,   color: GOLD },
                { label: "Saves",        value: totalSaves,    color: textPrimary },
                { label: "Enquiries",    value: totalEnquiries, color: "#4ade80" },
                { label: "Media Assets", value: scorecard?.total_media ?? "—", color: textPrimary },
              ].map(item => (
                <div key={item.label} style={{
                  padding: "10px 12px",
                  background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${border}`,
                  borderRadius: "var(--lwd-radius-input)",
                }}>
                  <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "1.5px",
                    textTransform: "uppercase", color: textMuted, marginBottom: 4 }}>
                    {item.label}
                  </div>
                  <div style={{ fontFamily: GD, fontSize: isMobile ? 18 : 22,
                    fontWeight: 700, color: item.color, lineHeight: 1 }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── No-data state ─────────────────────────────────────────────── */}
          {!hasData && (
            <div style={{
              padding: "16px 18px",
              background: GOLD_DIM,
              border: `1px solid ${GOLD_BORDER}`,
              borderRadius: "var(--lwd-radius-input)",
            }}>
              <div style={{ fontFamily: NU, fontSize: 13, color: textPrimary, lineHeight: 1.6 }}>
                <span style={{ color: GOLD }}>✦</span>{" "}
                Media tracking is active. Image view, click, and share data will appear here as couples browse your gallery.
              </div>
            </div>
          )}

          {/* ── Top performing images ─────────────────────────────────────── */}
          {topThree.length > 0 && (
            <div>
              <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "2px",
                textTransform: "uppercase", color: textMuted, marginBottom: 10 }}>
                Top Performing Images
              </div>
              <div style={{ display: "flex", gap: 10, overflowX: "auto" }}>
                {topThree.map((m, i) => (
                  <div key={m.media_id} style={{
                    flexShrink: 0, width: 130, height: 88,
                    borderRadius: "var(--lwd-radius-input)",
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${i === 0 ? GOLD_BORDER : border}`,
                    position: "relative", overflow: "hidden",
                    display: "flex", flexDirection: "column",
                    justifyContent: "flex-end", padding: "8px 10px",
                    boxShadow: i === 0 ? `0 0 12px rgba(201,168,76,0.12)` : "none",
                  }}>
                    {/* Rank badge */}
                    <div style={{
                      position: "absolute", top: 6, left: 8,
                      fontFamily: NU, fontSize: 8, fontWeight: 700,
                      color: i === 0 ? "#000" : textPrimary,
                      background: i === 0 ? GOLD : "rgba(0,0,0,0.5)",
                      borderRadius: 3, padding: "1px 5px",
                    }}>
                      #{i + 1}
                    </div>
                    {/* Media ID (truncated) */}
                    <div style={{ fontFamily: NU, fontSize: 8, color: textMuted,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      marginBottom: 4 }}>
                      {m.media_id.slice(0, 18)}…
                    </div>
                    {/* Chips */}
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {[
                        { label: `${m.views}v`, color: textMuted },
                        { label: `${m.clicks}c`, color: GOLD },
                        m.shares > 0 && { label: `${m.shares}s`, color: "#E1306C" },
                      ].filter(Boolean).map((chip, ci) => (
                        <span key={ci} style={{
                          fontFamily: NU, fontSize: 8, fontWeight: 700,
                          color: chip.color, background: "rgba(0,0,0,0.4)",
                          borderRadius: 3, padding: "1px 5px",
                        }}>
                          {chip.label}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Gallery position heatmap ──────────────────────────────────── */}
          {positions.length > 1 && (
            <GalleryHeatmap positions={positions} isMobile={isMobile} C={C} />
          )}

          {/* ── Style trend tags ──────────────────────────────────────────── */}
          {styleTags.length > 0 && (
            <div>
              <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "2px",
                textTransform: "uppercase", color: textMuted, marginBottom: 10 }}>
                Winning Style Tags
              </div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {styleTags.map(tag => (
                  <span key={tag} style={{
                    fontFamily: NU, fontSize: 10, fontWeight: 600,
                    letterSpacing: "0.8px", textTransform: "capitalize",
                    color: GOLD,
                    background: GOLD_DIM,
                    border: `1px solid ${GOLD_BORDER}`,
                    borderRadius: 20, padding: "4px 12px",
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Share platform breakdown ──────────────────────────────────── */}
          {totalShares > 0 && scorecard && (
            <div>
              <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "2px",
                textTransform: "uppercase", color: textMuted, marginBottom: 10 }}>
                Shares by Platform
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {SHARE_PLATFORMS.map(p => {
                  const count = mediaStats
                    .filter(m => m.share_platform === p.key)
                    .reduce((s, m) => s + Number(m.shares || 0), 0);
                  if (!count) return null;
                  return (
                    <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
                      <span style={{ fontFamily: NU, fontSize: 11, color: textPrimary }}>
                        {p.label}
                      </span>
                      <span style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, color: p.color }}>
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Improvement tip ───────────────────────────────────────────── */}
          {tip && (
            <div style={{
              padding: "14px 16px",
              background: isLight ? "rgba(0,0,0,0.02)" : "rgba(201,168,76,0.04)",
              border: `1px solid rgba(201,168,76,0.15)`,
              borderRadius: "var(--lwd-radius-input)",
              borderLeft: `3px solid ${GOLD}`,
            }}>
              <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "1.5px",
                textTransform: "uppercase", color: GOLD, marginBottom: 6 }}>
                How to improve your score
              </div>
              <div style={{ fontFamily: NU, fontSize: 12, color: textPrimary, lineHeight: 1.65 }}>
                {tip}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
