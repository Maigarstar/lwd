// ─── src/pages/AdminModules/PlatformMediaIntelligenceModule.jsx ──────────────
// Platform-wide visual intelligence — admin module.
// Three-state evolution: Activation → Signal → Intelligence
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";

const GOLD        = "#C9A84C";
const GOLD_DIM    = "rgba(201,168,76,0.10)";
const GOLD_BORDER = "rgba(201,168,76,0.28)";
const GD          = "var(--font-heading-primary)";
const NU          = "var(--font-body)";

const PERIODS = [
  { key: "7d",  label: "7 days",  days: 7  },
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
];

const COLOR_MOOD_PALETTE = {
  warm:        { color: "#E8A87C", label: "Warm" },
  cool:        { color: "#7EC8E3", label: "Cool" },
  neutral:     { color: "#B8B4A8", label: "Neutral" },
  jewel_tones: { color: "#9B59B6", label: "Jewel Tones" },
  monochrome:  { color: "#888888", label: "Monochrome" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtNum(n) {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function fmtTimestamp(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function timeAgo(d) {
  if (!d) return "";
  const diff  = Date.now() - new Date(d).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// Derive intelligence state from loaded data
// State 1 = nothing; State 2 = some signals; State 3 = rich intelligence
function deriveState(trends, leaderboard, topImages) {
  const hasImages   = topImages.some(i => !i._fallback);
  const hasTrends   = trends.length >= 3;
  const hasBoard    = leaderboard.length >= 3;
  if (hasTrends && hasBoard && hasImages) return 3;
  if (hasTrends || hasBoard || hasImages)  return 2;
  return 1;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = GOLD, delta, C }) {
  const isLight = C?.bg === "#F2EFE9" || C?.bg?.startsWith("#F");
  return (
    <div style={{
      background: isLight ? "#fff" : (C?.card || "#111"),
      border: `1px solid ${isLight ? "rgba(0,0,0,0.08)" : (C?.border || "rgba(255,255,255,0.07)")}`,
      borderRadius: "var(--lwd-radius-card)", padding: "18px 20px",
    }}>
      <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "2px",
        textTransform: "uppercase", color: C?.grey || "rgba(255,255,255,0.45)", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <div style={{ fontFamily: GD, fontSize: 32, fontWeight: 700,
          color, lineHeight: 1, marginBottom: 4 }}>
          {value ?? "—"}
        </div>
        {delta != null && (
          <span style={{
            fontFamily: NU, fontSize: 10, fontWeight: 700,
            color: delta >= 0 ? "#4ade80" : "#ef4444",
          }}>
            {delta >= 0 ? `↑ +${delta}%` : `↓ ${delta}%`}
          </span>
        )}
      </div>
      {sub && (
        <div style={{ fontFamily: NU, fontSize: 11,
          color: C?.grey || "rgba(255,255,255,0.45)" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function TrendBar({ tag, score, maxScore, tagType, rank, C }) {
  const isLight   = C?.bg === "#F2EFE9" || C?.bg?.startsWith("#F");
  const pct       = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const chipColor = tagType === "style" ? GOLD : "#a78bfa";
  return (
    <div style={{
      background: isLight ? "#fff" : (C?.card || "#111"),
      border: `1px solid ${isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.05)"}`,
      borderRadius: "var(--lwd-radius-input)", padding: "12px 14px",
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{ display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontFamily: NU, fontSize: 12, fontWeight: 700,
          textTransform: "capitalize",
          color: isLight ? "#1a1a1a" : (C?.white || "#F5F0E8") }}>
          {tag}
        </span>
        {rank === 1 && (
          <span style={{
            fontFamily: NU, fontSize: 8, letterSpacing: "0.8px",
            textTransform: "uppercase", fontWeight: 700,
            color: GOLD, background: GOLD_DIM,
            border: `1px solid ${GOLD_BORDER}`,
            borderRadius: 20, padding: "1px 7px",
          }}>
            Top
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, height: 4, borderRadius: 2,
          background: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)",
          overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${pct}%`,
            background: chipColor, borderRadius: 2,
            transition: "width 0.6s ease",
          }} />
        </div>
        <span style={{ fontFamily: NU, fontSize: 10, color: chipColor,
          fontWeight: 700, minWidth: 28, textAlign: "right" }}>
          {pct}%
        </span>
      </div>
      <div style={{ fontFamily: NU, fontSize: 9, color: C?.grey || "rgba(255,255,255,0.4)" }}>
        score {Math.round(score)}
      </div>
    </div>
  );
}

// Single top-image card
function ImageCard({ img, rank, C }) {
  const [imgError, setImgError] = useState(false);
  const isLight     = C?.bg === "#F2EFE9" || C?.bg?.startsWith("#F");
  const cardBg      = isLight ? "#fff" : (C?.card || "#111");
  const border      = isLight ? "rgba(0,0,0,0.08)" : (C?.border || "rgba(255,255,255,0.07)");
  const textPrimary = isLight ? "#1a1a1a" : (C?.white || "#F5F0E8");
  const textMuted   = isLight ? "rgba(28,20,16,0.5)" : (C?.grey || "rgba(255,255,255,0.45)");

  const stats = [
    { label: "views",     value: fmtNum(img.views)     },
    { label: "clicks",    value: fmtNum(img.clicks)    },
    { label: "shares",    value: fmtNum(img.shares)    },
    { label: "enquiries", value: fmtNum(img.enquiries) },
  ];

  const rankBg = rank === 1 ? GOLD : rank === 2 ? "#9ca3af" : rank === 3 ? "#b45309" : "rgba(0,0,0,0.55)";

  return (
    <div style={{
      background: cardBg, border: `1px solid ${border}`,
      borderRadius: "var(--lwd-radius-card)",
      overflow: "hidden", display: "flex", flexDirection: "column",
      position: "relative",
    }}>
      {/* Rank badge */}
      <div style={{
        position: "absolute", top: 10, left: 10, zIndex: 2,
        background: rankBg,
        color: rank <= 3 ? "#1a1a14" : "#fff",
        fontFamily: GD, fontSize: 11, fontWeight: 700,
        borderRadius: "50%", width: 26, height: 26,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
      }}>
        #{rank}
      </div>

      {/* Thumbnail */}
      <div style={{ width: "100%", aspectRatio: "16/9",
        overflow: "hidden", background: "rgba(128,128,128,0.10)",
        flexShrink: 0, position: "relative" }}>
        {img.image_url && !imgError ? (
          <img
            src={img.image_url}
            alt={img.title || "media image"}
            onError={() => setImgError(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover",
              display: "block", transition: "transform 0.3s ease" }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          />
        ) : (
          <div style={{ width: "100%", height: "100%",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 6 }}>
            <span style={{ fontSize: 28, opacity: 0.25 }}>🖼</span>
            <span style={{ fontFamily: NU, fontSize: 9, color: textMuted, opacity: 0.6 }}>
              Image unavailable
            </span>
          </div>
        )}
        {/* Engagement score chip */}
        {Number(img.engagement_score) > 0 && (
          <div style={{
            position: "absolute", bottom: 8, right: 8,
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
            borderRadius: 20, padding: "3px 10px",
            fontFamily: GD, fontSize: 11, fontWeight: 700, color: GOLD,
          }}>
            ✦ {Math.round(Number(img.engagement_score))}
          </div>
        )}
        {/* Featured badge */}
        {img.is_featured && (
          <div style={{
            position: "absolute", top: 10, right: 10,
            background: "rgba(0,0,0,0.60)", backdropFilter: "blur(4px)",
            borderRadius: 20, padding: "3px 9px",
            fontFamily: NU, fontSize: 9, color: GOLD, letterSpacing: "0.5px",
          }}>
            ★ Featured
          </div>
        )}
      </div>

      {/* Info block */}
      <div style={{ padding: "14px 14px 12px",
        display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>

        {/* Title */}
        <div style={{
          fontFamily: NU, fontSize: 13, fontWeight: 700,
          color: textPrimary, lineHeight: 1.3,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>
          {img.title || img.media_id}
        </div>

        {/* Owner / category / location row */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
          {img.listing_name && (
            <span style={{
              fontFamily: NU, fontSize: 10, fontWeight: 600,
              color: GOLD, background: GOLD_DIM,
              border: `1px solid ${GOLD_BORDER}`,
              borderRadius: 20, padding: "2px 8px",
              maxWidth: 150, overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {img.listing_name}
            </span>
          )}
          {img.category && (
            <span style={{
              fontFamily: NU, fontSize: 9, letterSpacing: "0.6px",
              textTransform: "uppercase", color: textMuted,
              background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.05)",
              borderRadius: 20, padding: "2px 8px",
            }}>
              {img.category}
            </span>
          )}
          {(img.region || img.country) && (
            <span style={{ fontFamily: NU, fontSize: 10, color: textMuted }}>
              📍 {[img.region, img.country].filter(Boolean).join(", ")}
            </span>
          )}
        </div>

        {/* Stat chips */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 2 }}>
          {stats.map(s => (
            <div key={s.label} style={{
              display: "flex", alignItems: "center", gap: 3,
              fontFamily: NU, fontSize: 10,
              background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.07)"}`,
              borderRadius: 20, padding: "3px 9px",
              color: s.value === "—" ? textMuted : textPrimary,
            }}>
              <span style={{ fontWeight: 700 }}>{s.value}</span>
              <span style={{ color: textMuted }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Timestamp */}
        {img.created_at && (
          <div style={{ fontFamily: NU, fontSize: 9, color: textMuted, opacity: 0.65, marginTop: 2 }}>
            Added {new Date(img.created_at).toLocaleDateString("en-GB", {
              day: "2-digit", month: "short", year: "numeric"
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// State-aware intelligence banner (replaces the simple empty state)
function IntelligenceBanner({ state, trends, C }) {
  const isLight     = C?.bg === "#F2EFE9" || C?.bg?.startsWith("#F");
  const textPrimary = isLight ? "#1a1a1a" : (C?.white || "#F5F0E8");
  const textMuted   = isLight ? "rgba(28,20,16,0.5)" : (C?.grey || "rgba(255,255,255,0.45)");

  const topStyle = trends.filter(t => t.tag_type === "style")[0];

  if (state === 3) {
    return (
      <div style={{
        padding: "24px 28px",
        background: GOLD_DIM,
        border: `1px solid ${GOLD_BORDER}`,
        borderRadius: "var(--lwd-radius-card)",
      }}>
        <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "2.5px",
          textTransform: "uppercase", color: GOLD, marginBottom: 8 }}>
          ✦ Platform Intelligence
        </div>
        <div style={{ fontFamily: GD, fontSize: 18, color: textPrimary, marginBottom: 10 }}>
          {topStyle
            ? `Couples are responding strongly to ${topStyle.tag} imagery`
            : "Couples are actively engaging with visual content"}
        </div>
        <div style={{ fontFamily: NU, fontSize: 13, color: textMuted, lineHeight: 1.7, maxWidth: 620 }}>
          {topStyle
            ? `${topStyle.tag.charAt(0).toUpperCase() + topStyle.tag.slice(1)} style imagery is currently driving the highest engagement and share activity across the platform. Listings aligned with these aesthetics are seeing stronger enquiry rates.`
            : "Visual engagement data is building across the platform. Couples are spending time on imagery — which styles and moments convert is becoming clearer."}
        </div>
        <div style={{ fontFamily: NU, fontSize: 11, color: GOLD, opacity: 0.7, marginTop: 10 }}>
          Listings with high-performing galleries typically feature their strongest image within positions 2–4.
        </div>
      </div>
    );
  }

  if (state === 2) {
    return (
      <div style={{
        padding: "24px 28px",
        background: GOLD_DIM,
        border: `1px solid ${GOLD_BORDER}`,
        borderRadius: "var(--lwd-radius-card)",
      }}>
        <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "2.5px",
          textTransform: "uppercase", color: GOLD, marginBottom: 8 }}>
          ✦ Early Signals Emerging
        </div>
        <div style={{ fontFamily: GD, fontSize: 18, color: textPrimary, marginBottom: 10 }}>
          Couples are beginning to engage
        </div>
        <div style={{ fontFamily: NU, fontSize: 13, color: textMuted, lineHeight: 1.7, maxWidth: 620 }}>
          Early interactions are flowing in. As couples continue exploring listings, this space will reveal which images, styles, and moments are driving engagement and shaping enquiry decisions.
        </div>
        <div style={{ fontFamily: NU, fontSize: 11, color: textMuted, opacity: 0.7, marginTop: 10 }}>
          Insights typically sharpen within 7–14 days as activity increases.
        </div>
      </div>
    );
  }

  // State 1
  return (
    <div style={{
      padding: "40px 44px",
      background: GOLD_DIM,
      border: `1px solid ${GOLD_BORDER}`,
      borderRadius: "var(--lwd-radius-card)",
    }}>
      <div style={{ fontFamily: GD, fontSize: 22, color: textPrimary, marginBottom: 10 }}>
        <span style={{ color: GOLD }}>✦</span> Media intelligence is live
      </div>
      <div style={{ fontFamily: NU, fontSize: 13, color: textMuted, lineHeight: 1.7, maxWidth: 560 }}>
        As couples explore listings, this space reveals which images, styles, and moments are driving engagement and enquiries.
        Insights build quickly as activity increases — early signals typically appear within days.
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PlatformMediaIntelligenceModule({ C }) {
  const [period,      setPeriod]      = useState("30d");
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [trends,      setTrends]      = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [topImages,   setTopImages]   = useState([]);
  const [summary,     setSummary]     = useState(null);
  const [colorMoods,  setColorMoods]  = useState({});
  const [refreshedAt, setRefreshedAt] = useState(null);

  const isLight     = C?.bg === "#F2EFE9" || C?.bg?.startsWith("#F");
  const cardBg      = isLight ? "#fff" : (C?.card || "#111");
  const border      = isLight ? "rgba(0,0,0,0.08)" : (C?.border || "rgba(255,255,255,0.07)");
  const textPrimary = isLight ? "#1a1a1a" : (C?.white || "#F5F0E8");
  const textMuted   = isLight ? "rgba(28,20,16,0.5)" : (C?.grey || "rgba(255,255,255,0.45)");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const days = PERIODS.find(p => p.key === period)?.days || 30;
    const from = new Date(Date.now() - days * 86_400_000).toISOString();
    const to   = new Date().toISOString();

    try {
      // 1. Trends
      const trendsRes = await Promise.resolve(
        supabase.rpc("get_platform_media_trends", { p_from: from, p_to: to, p_limit: 24 })
      );

      // 2. Top images via engagement RPC; fallback to media_ai_index
      let topImagesData = [];
      const topRes = await Promise.resolve(
        supabase.rpc("get_top_platform_images", { p_from: from, p_to: to, p_limit: 20 })
      );
      if (topRes?.data?.length) {
        topImagesData = topRes.data;
      } else {
        const fallbackRes = await Promise.resolve(
          supabase.from("media_ai_index")
            .select("media_id, url, title, alt_text, listing_name, listing_id, category, region, country, is_featured, created_at")
            .not("url", "is", null)
            .order("is_featured", { ascending: false })
            .order("created_at",  { ascending: false })
            .limit(20)
        );
        topImagesData = (fallbackRes?.data || []).map(r => ({
          media_id:         r.media_id,
          image_url:        r.url,
          title:            r.title || r.alt_text || r.media_id,
          listing_name:     r.listing_name,
          listing_id:       r.listing_id,
          category:         r.category,
          region:           r.region,
          country:          r.country,
          is_featured:      r.is_featured,
          views:            0, clicks: 0, shares: 0, enquiries: 0,
          engagement_score: 0,
          created_at:       r.created_at,
          _fallback:        true,
        }));
      }
      setTopImages(topImagesData);

      // 3. Leaderboard — scorecard + separate listing name lookup
      const scorecardRes = await Promise.resolve(
        supabase.from("vendor_media_scorecard")
          .select("listing_id, media_score, score_grade, score_delta, views_30d, clicks_30d, images_count, snapshot_date")
          .order("media_score", { ascending: false })
          .limit(20)
      );
      const scorecardRows = scorecardRes?.data || [];
      let nameMap = {};
      if (scorecardRows.length) {
        const ids = scorecardRows.map(r => r.listing_id).filter(Boolean);
        if (ids.length) {
          const namesRes = await Promise.resolve(
            supabase.from("listings").select("id, name").in("id", ids)
          );
          (namesRes?.data || []).forEach(l => { nameMap[l.id] = l.name; });
        }
      }
      const leaderRows = scorecardRows.map(r => ({
        ...r,
        name: nameMap[r.listing_id] || r.listing_id,
      }));
      setLeaderboard(leaderRows);

      // 4. Colour moods
      const colorRes = await Promise.resolve(
        supabase.from("media_metadata_enrichment")
          .select("color_mood")
          .not("color_mood", "is", null)
          .limit(500)
      );
      const freq = {};
      (colorRes?.data || []).forEach(r => {
        if (r.color_mood) freq[r.color_mood] = (freq[r.color_mood] || 0) + 1;
      });
      setColorMoods(freq);

      setTrends(trendsRes?.data || []);

      const avgScore      = leaderRows.length
        ? Math.round(leaderRows.reduce((s, r) => s + (r.media_score || 0), 0) / leaderRows.length)
        : null;
      const totalViews30d = leaderRows.reduce((s, r) => s + (r.views_30d || 0), 0);
      const topVendor     = leaderRows[0] || null;
      setSummary({ avgScore, totalViews30d, topVendor, vendorCount: leaderRows.length });
      setRefreshedAt(new Date());
    } catch (err) {
      setError(err?.message || "Failed to load media intelligence data.");
    }

    setLoading(false);
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const styleTrends     = trends.filter(t => t.tag_type === "style");
  const subjectTrends   = trends.filter(t => t.tag_type === "subject");
  const maxTrendScore   = Math.max(...trends.map(t => Number(t.trend_score) || 0), 1);
  const totalColorCount = Object.values(colorMoods).reduce((s, v) => s + v, 0);
  const topImagesAreReal = topImages.length > 0 && !topImages[0]?._fallback;
  const intelligenceState = deriveState(trends, leaderboard, topImages);

  return (
    <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start",
        justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "3px",
              textTransform: "uppercase", color: GOLD }}>
              Platform Intelligence
            </div>
            {intelligenceState === 3 && (
              <div style={{
                fontFamily: NU, fontSize: 9, letterSpacing: "1px",
                textTransform: "uppercase", fontWeight: 700,
                color: "#4ade80", background: "rgba(74,222,128,0.10)",
                border: "1px solid rgba(74,222,128,0.30)",
                borderRadius: 20, padding: "2px 9px",
              }}>
                ✦ Live insights
              </div>
            )}
          </div>
          <div style={{ fontFamily: GD, fontSize: 26, fontWeight: 700,
            color: textPrimary, marginBottom: 4 }}>
            Media Intelligence
          </div>
          <div style={{ fontFamily: NU, fontSize: 13, color: textMuted }}>
            Understand which visuals capture attention, shape desire, and drive enquiries across the platform.
          </div>
          {refreshedAt && (
            <div style={{ fontFamily: NU, fontSize: 10, color: textMuted,
              opacity: 0.6, marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%",
                background: "#4ade80", boxShadow: "0 0 6px #4ade80" }} />
              Last refreshed {fmtTimestamp(refreshedAt)} · {timeAgo(refreshedAt)}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)} style={{
              fontFamily: NU, fontSize: 11, fontWeight: 600,
              padding: "6px 14px",
              border: `1px solid ${period === p.key ? GOLD : border}`,
              background: period === p.key ? GOLD_DIM : "transparent",
              color: period === p.key ? GOLD : textMuted,
              borderRadius: "var(--lwd-radius-input)",
              cursor: "pointer", transition: "all 0.12s",
            }}>
              {p.label}
            </button>
          ))}
          <button onClick={load} disabled={loading} style={{
            fontFamily: NU, fontSize: 11, fontWeight: 600,
            padding: "6px 14px",
            border: `1px solid ${GOLD_BORDER}`,
            background: GOLD_DIM, color: GOLD,
            borderRadius: "var(--lwd-radius-input)",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.5 : 1, transition: "all 0.12s",
          }}>
            {loading ? "↻ Loading…" : "↻ Refresh"}
          </button>
        </div>
      </div>

      {/* ── Error state ──────────────────────────────────────────────────────── */}
      {error && !loading && (
        <div style={{
          padding: "16px 20px",
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: "var(--lwd-radius-card)",
          fontFamily: NU, fontSize: 12, color: "#f87171",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span>⚠</span>
          <span>{error}</span>
          <button onClick={load} style={{
            marginLeft: "auto", fontFamily: NU, fontSize: 11, fontWeight: 600,
            padding: "4px 12px", borderRadius: 20,
            background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
            color: "#f87171", cursor: "pointer",
          }}>Retry</button>
        </div>
      )}

      {/* ── Platform summary strip ────────────────────────────────────────── */}
      <div style={{ display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <StatCard
          label="Avg Media Score"
          value={loading ? "…" : (summary?.avgScore ?? "—")}
          sub="Overall visual performance across all vendors"
          color={GOLD} C={C} />
        <StatCard
          label="Total Image Views"
          value={loading ? "…" : fmtNum(summary?.totalViews30d)}
          sub="How often couples engaged with visual content"
          color={textPrimary} C={C} />
        <StatCard
          label="Vendors Tracked"
          value={loading ? "…" : (summary?.vendorCount ?? "—")}
          sub="Listings with active media intelligence"
          color={textPrimary} C={C} />
        <StatCard
          label="Top Performer"
          value={loading ? "…" : (summary?.topVendor?.score_grade ?? "—")}
          sub={summary?.topVendor?.name
            ? `${summary.topVendor.name} · ${summary.topVendor.media_score}/100`
            : "Highest performing visual profile this period"}
          color="#4ade80" C={C} />
      </div>

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 80, borderRadius: 8,
              background: "rgba(128,128,128,0.06)", animation: "shimmer 1.4s ease infinite" }} />
          ))}
        </div>
      )}

      {!loading && (
        <>
          {/* ── Intelligence banner (state-aware) ─────────────────────────── */}
          <IntelligenceBanner state={intelligenceState} trends={trends} C={C} />

          {/* ── Top Performing Images ─────────────────────────────────────── */}
          {topImages.length > 0 && (
            <div style={{ background: cardBg, border: `1px solid ${border}`,
              borderRadius: "var(--lwd-radius-card)", overflow: "hidden" }}>
              <div style={{
                padding: "18px 20px 14px",
                borderBottom: `1px solid ${border}`,
                display: "flex", alignItems: "flex-start",
                justifyContent: "space-between", gap: 12, flexWrap: "wrap",
              }}>
                <div>
                  <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "2px",
                    textTransform: "uppercase", color: textMuted, marginBottom: 4 }}>
                    Visual Performance
                  </div>
                  <div style={{ fontFamily: NU, fontSize: 15, fontWeight: 700, color: textPrimary }}>
                    Top Performing Images
                  </div>
                  <div style={{ fontFamily: NU, fontSize: 11, color: textMuted, marginTop: 3 }}>
                    {topImagesAreReal
                      ? `Ranked by engagement score — views · clicks · shares · enquiries · ${PERIODS.find(p => p.key === period)?.label}`
                      : "Recent and featured images — engagement data appears as couples browse listings"}
                  </div>
                </div>
                {!topImagesAreReal && (
                  <div style={{
                    fontFamily: NU, fontSize: 10,
                    color: GOLD, background: GOLD_DIM,
                    border: `1px solid ${GOLD_BORDER}`,
                    borderRadius: 20, padding: "4px 12px",
                    flexShrink: 0,
                  }}>
                    ✦ Showing recent images
                  </div>
                )}
              </div>
              <div style={{
                padding: 20,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 16,
              }}>
                {topImages.map((img, i) => (
                  <ImageCard key={img.media_id || i} img={img} rank={i + 1} C={C} />
                ))}
              </div>
            </div>
          )}

          {/* ── State 3 insight block ─────────────────────────────────────── */}
          {intelligenceState === 3 && styleTrends.length > 0 && (
            <div style={{
              padding: "18px 22px",
              background: isLight ? "rgba(201,168,76,0.06)" : "rgba(201,168,76,0.07)",
              border: `1px solid ${GOLD_BORDER}`,
              borderRadius: "var(--lwd-radius-card)",
              display: "flex", alignItems: "flex-start", gap: 14,
            }}>
              <div style={{ fontFamily: GD, fontSize: 20, color: GOLD, lineHeight: 1, flexShrink: 0 }}>✦</div>
              <div>
                <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "2px",
                  textTransform: "uppercase", color: GOLD, marginBottom: 4 }}>
                  Visual Insight
                </div>
                <div style={{ fontFamily: NU, fontSize: 13, color: textPrimary, lineHeight: 1.6 }}>
                  {styleTrends.slice(0, 2).map(t => t.tag).join(" and ")} imagery
                  {styleTrends.length >= 2 ? " is" : " are"} currently driving the highest engagement
                  across the platform.{" "}
                  <span style={{ color: textMuted }}>
                    Listings that feature these aesthetics prominently are seeing stronger enquiry rates.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── Trending styles + subjects ────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: cardBg, border: `1px solid ${border}`,
              borderRadius: "var(--lwd-radius-card)", padding: "20px" }}>
              <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "2px",
                textTransform: "uppercase", color: textMuted, marginBottom: 4 }}>
                Trending Styles
              </div>
              <div style={{ fontFamily: NU, fontSize: 15, fontWeight: 700,
                color: textPrimary, marginBottom: 14 }}>
                What couples are drawn to
              </div>
              {styleTrends.length === 0 ? (
                <div style={{ fontFamily: NU, fontSize: 12, color: textMuted, lineHeight: 1.6 }}>
                  No style trends yet — as couples interact with images, this will reveal which aesthetics are capturing attention and driving engagement.
                </div>
              ) : (
                <div style={{ display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
                  {styleTrends.slice(0, 12).map((t, i) => (
                    <TrendBar key={t.tag} tag={t.tag} score={Number(t.trend_score)}
                      maxScore={maxTrendScore} tagType="style" rank={i + 1} C={C} />
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: cardBg, border: `1px solid ${border}`,
              borderRadius: "var(--lwd-radius-card)", padding: "20px" }}>
              <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "2px",
                textTransform: "uppercase", color: textMuted, marginBottom: 4 }}>
                Trending Subjects
              </div>
              <div style={{ fontFamily: NU, fontSize: 15, fontWeight: 700,
                color: textPrimary, marginBottom: 14 }}>
                What couples are spending time on
              </div>
              {subjectTrends.length === 0 ? (
                <div style={{ fontFamily: NU, fontSize: 12, color: textMuted, lineHeight: 1.6 }}>
                  No subject trends yet — this will show which moments, from ceremony to reception, are holding attention the longest.
                </div>
              ) : (
                <div style={{ display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
                  {subjectTrends.slice(0, 12).map((t, i) => (
                    <TrendBar key={t.tag} tag={t.tag} score={Number(t.trend_score)}
                      maxScore={maxTrendScore} tagType="subject" rank={i + 1} C={C} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Colour mood breakdown ──────────────────────────────────────── */}
          <div style={{ background: cardBg, border: `1px solid ${border}`,
            borderRadius: "var(--lwd-radius-card)", padding: "20px" }}>
            <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "2px",
              textTransform: "uppercase", color: textMuted, marginBottom: 4 }}>
              Colour Mood Distribution
            </div>
            <div style={{ fontFamily: NU, fontSize: 15, fontWeight: 700,
              color: textPrimary, marginBottom: totalColorCount > 0 ? 16 : 8 }}>
              Platform Palette Trends
            </div>
            {totalColorCount > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {Object.entries(colorMoods)
                  .sort((a, b) => b[1] - a[1])
                  .map(([mood, count]) => {
                    const info = COLOR_MOOD_PALETTE[mood] || { color: GOLD, label: mood };
                    const pct  = Math.round((count / totalColorCount) * 100);
                    return (
                      <div key={mood} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%",
                          background: info.color, flexShrink: 0 }} />
                        <div style={{ width: 90, fontFamily: NU, fontSize: 12,
                          color: textPrimary }}>{info.label}</div>
                        <div style={{ flex: 1, height: 6, borderRadius: 3,
                          background: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)",
                          overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`,
                            background: info.color, borderRadius: 3,
                            transition: "width 0.5s ease" }} />
                        </div>
                        <div style={{ fontFamily: NU, fontSize: 11, color: textMuted,
                          width: 40, textAlign: "right" }}>{pct}%</div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div style={{ fontFamily: NU, fontSize: 12, color: textMuted, lineHeight: 1.6 }}>
                Colour mood data populates as AI enrichment runs on uploaded images — warm, cool, jewel-toned and monochrome palettes will appear here.
              </div>
            )}
          </div>

          {/* ── Vendor media leaderboard ──────────────────────────────────── */}
          {leaderboard.length > 0 && (
            <div style={{ background: cardBg, border: `1px solid ${border}`,
              borderRadius: "var(--lwd-radius-card)", overflow: "hidden" }}>
              <div style={{ padding: "18px 20px", borderBottom: `1px solid ${border}` }}>
                <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "2px",
                  textTransform: "uppercase", color: textMuted, marginBottom: 4 }}>
                  Vendor Rankings
                </div>
                <div style={{ fontFamily: NU, fontSize: 15, fontWeight: 700, color: textPrimary }}>
                  Top Performing Vendors — Visual
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Rank", "Vendor", "Grade", "Score", "Delta", "Views 30d", "Clicks 30d", "Images", "Snapshot"].map((h, i) => (
                        <th key={h} style={{
                          fontFamily: NU, fontSize: 9, letterSpacing: "1.5px",
                          textTransform: "uppercase", color: textMuted,
                          padding: "8px 12px",
                          textAlign: (i === 1 || i === 8) ? "left" : "right",
                          borderBottom: `1px solid rgba(201,168,76,0.12)`,
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((row, i) => {
                      const gradeColor = row.score_grade === "A" ? "#4ade80"
                        : row.score_grade === "B" ? GOLD
                        : row.score_grade === "C" ? "#f59e0b" : "#ef4444";
                      const delta = row.score_delta;
                      return (
                        <tr key={row.listing_id}
                          style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                          <td style={{ padding: "10px 12px", fontFamily: NU,
                            fontSize: 12, color: textMuted, textAlign: "right" }}>
                            {i + 1}
                          </td>
                          <td style={{ padding: "10px 12px", fontFamily: NU,
                            fontSize: 13, fontWeight: 600, color: textPrimary }}>
                            {row.name}
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "right" }}>
                            <span style={{
                              fontFamily: GD, fontSize: 13, fontWeight: 700, color: gradeColor,
                              background: `${gradeColor}18`, border: `1px solid ${gradeColor}44`,
                              borderRadius: 4, padding: "1px 8px",
                            }}>
                              {row.score_grade}
                            </span>
                          </td>
                          <td style={{ padding: "10px 12px", fontFamily: NU, fontSize: 13,
                            fontWeight: 700, color: GOLD, textAlign: "right" }}>
                            {row.media_score}
                          </td>
                          <td style={{ padding: "10px 12px", fontFamily: NU, fontSize: 12,
                            color: delta > 0 ? "#4ade80" : delta < 0 ? "#ef4444" : textMuted,
                            textAlign: "right" }}>
                            {delta != null ? (delta >= 0 ? `+${delta}` : delta) : "—"}
                          </td>
                          <td style={{ padding: "10px 12px", fontFamily: NU, fontSize: 12,
                            color: textMuted, textAlign: "right" }}>
                            {fmtNum(row.views_30d) || "—"}
                          </td>
                          <td style={{ padding: "10px 12px", fontFamily: NU, fontSize: 12,
                            color: textMuted, textAlign: "right" }}>
                            {fmtNum(row.clicks_30d) || "—"}
                          </td>
                          <td style={{ padding: "10px 12px", fontFamily: NU, fontSize: 12,
                            color: textMuted, textAlign: "right" }}>
                            {row.images_count || "—"}
                          </td>
                          <td style={{ padding: "10px 12px", fontFamily: NU, fontSize: 10,
                            color: textMuted, whiteSpace: "nowrap" }}>
                            {row.snapshot_date
                              ? new Date(row.snapshot_date).toLocaleDateString("en-GB", {
                                  day: "2-digit", month: "short", year: "numeric"
                                })
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
