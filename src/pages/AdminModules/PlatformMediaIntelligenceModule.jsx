// ─── src/pages/AdminModules/PlatformMediaIntelligenceModule.jsx ──────────────
// Platform-wide visual intelligence — admin module.
// Shows: health summary, trending styles, trending subjects, colour moods,
// vendor leaderboard, search intelligence.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";

const GOLD        = "#C9A84C";
const GOLD_DIM    = "rgba(201,168,76,0.10)";
const GOLD_BORDER = "rgba(201,168,76,0.28)";
const GD          = "var(--font-heading-primary)";
const NU          = "var(--font-body)";

const PERIODS = [
  { key: "7d",  label: "7 days",   days: 7   },
  { key: "30d", label: "30 days",  days: 30  },
  { key: "90d", label: "90 days",  days: 90  },
];

const COLOR_MOOD_PALETTE = {
  warm:        { color: "#E8A87C", label: "Warm" },
  cool:        { color: "#7EC8E3", label: "Cool" },
  neutral:     { color: "#B8B4A8", label: "Neutral" },
  jewel_tones: { color: "#9B59B6", label: "Jewel Tones" },
  monochrome:  { color: "#888888", label: "Monochrome" },
};

function StatCard({ label, value, sub, color = GOLD, C }) {
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
      <div style={{ fontFamily: GD, fontSize: 32, fontWeight: 700,
        color, lineHeight: 1, marginBottom: 4 }}>
        {value ?? "—"}
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

function TrendBar({ tag, score, maxScore, tagType, C }) {
  const isLight   = C?.bg === "#F2EFE9" || C?.bg?.startsWith("#F");
  const pct       = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const chipColor = tagType === "style" ? GOLD : "#a78bfa";

  return (
    <div style={{
      background: isLight ? "#fff" : (C?.card || "#111"),
      border: `1px solid ${isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.05)"}`,
      borderRadius: "var(--lwd-radius-input)",
      padding: "12px 14px",
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{ display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontFamily: NU, fontSize: 12, fontWeight: 700,
          textTransform: "capitalize",
          color: isLight ? "#1a1a1a" : (C?.white || "#F5F0E8") }}>
          {tag}
        </span>
        <span style={{
          fontFamily: NU, fontSize: 8, letterSpacing: "0.8px",
          textTransform: "uppercase", fontWeight: 700,
          color: chipColor, background: `${chipColor}18`,
          border: `1px solid ${chipColor}44`,
          borderRadius: 20, padding: "1px 7px",
        }}>
          {tagType}
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 2,
        background: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)",
        overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: tagType === "style" ? GOLD : "#a78bfa",
          borderRadius: 2, transition: "width 0.6s ease",
        }} />
      </div>
      <div style={{ fontFamily: NU, fontSize: 9, color: C?.grey || "rgba(255,255,255,0.4)" }}>
        score {Math.round(score)}
      </div>
    </div>
  );
}

export default function PlatformMediaIntelligenceModule({ C }) {
  const [period,      setPeriod]      = useState("30d");
  const [loading,     setLoading]     = useState(true);
  const [trends,      setTrends]      = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [summary,     setSummary]     = useState(null);
  const [colorMoods,  setColorMoods]  = useState({});

  const isLight    = C?.bg === "#F2EFE9" || C?.bg?.startsWith("#F");
  const cardBg     = isLight ? "#fff" : (C?.card || "#111");
  const border     = isLight ? "rgba(0,0,0,0.08)" : (C?.border || "rgba(255,255,255,0.07)");
  const textPrimary = isLight ? "#1a1a1a" : (C?.white || "#F5F0E8");
  const textMuted   = isLight ? "rgba(28,20,16,0.5)" : (C?.grey || "rgba(255,255,255,0.45)");

  const load = useCallback(async () => {
    setLoading(true);
    const days = PERIODS.find(p => p.key === period)?.days || 30;
    const from = new Date(Date.now() - days * 86400_000).toISOString();
    const to   = new Date().toISOString();

    try {
      const [trendsRes, leaderRes, colorRes] = await Promise.all([
        Promise.resolve(
          supabase.rpc("get_platform_media_trends", { p_from: from, p_to: to, p_limit: 24 })
        ),
        Promise.resolve(
          supabase.from("vendor_media_scorecard")
            .select("listing_id, media_score, score_grade, score_delta, views_30d, clicks_30d, images_count, listings(name)")
            .order("media_score", { ascending: false })
            .limit(20)
        ),
        Promise.resolve(
          supabase.from("media_metadata_enrichment")
            .select("color_mood")
            .not("color_mood", "is", null)
            .limit(500)
        ),
      ]);

      setTrends(trendsRes?.data || []);

      // Build leaderboard — join listing name
      const rows = (leaderRes?.data || []).map(r => ({
        ...r,
        name: r.listings?.name || r.listing_id,
      }));
      setLeaderboard(rows);

      // Colour mood frequency
      const freq = {};
      (colorRes?.data || []).forEach(r => {
        if (r.color_mood) freq[r.color_mood] = (freq[r.color_mood] || 0) + 1;
      });
      setColorMoods(freq);

      // Summary aggregates
      const avgScore  = rows.length
        ? Math.round(rows.reduce((s, r) => s + (r.media_score || 0), 0) / rows.length)
        : null;
      const totalViews30d = rows.reduce((s, r) => s + (r.views_30d || 0), 0);
      const topVendor     = rows[0] || null;

      setSummary({ avgScore, totalViews30d, topVendor, vendorCount: rows.length });
    } catch {}

    setLoading(false);
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const styleTrends   = trends.filter(t => t.tag_type === "style");
  const subjectTrends = trends.filter(t => t.tag_type === "subject");
  const maxTrendScore = Math.max(...trends.map(t => Number(t.trend_score) || 0), 1);
  const totalColorCount = Object.values(colorMoods).reduce((s, v) => s + v, 0);

  return (
    <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start",
        justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "3px",
            textTransform: "uppercase", color: GOLD, marginBottom: 8 }}>
            Platform Intelligence
          </div>
          <div style={{ fontFamily: GD, fontSize: 26, fontWeight: 700,
            color: textPrimary, marginBottom: 4 }}>
            Media Intelligence
          </div>
          <div style={{ fontFamily: NU, fontSize: 13, color: textMuted }}>
            Understand which visuals capture attention, drive engagement, and influence enquiries across the platform.
          </div>
        </div>

        {/* Period selector */}
        <div style={{ display: "flex", gap: 4 }}>
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
        </div>
      </div>

      {/* ── Platform summary strip ───────────────────────────────────────── */}
      <div style={{ display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <StatCard label="Avg Media Score"  value={loading ? "…" : (summary?.avgScore ?? "—")}    sub="Overall visual performance across all vendors"     color={GOLD} C={C} />
        <StatCard label="Image Views" value={loading ? "…" : (summary?.totalViews30d ?? "—")} sub="How often couples engaged with media this period" color={textPrimary} C={C} />
        <StatCard label="Vendors Tracked"  value={loading ? "…" : (summary?.vendorCount ?? "—")} sub="Listings with active media intelligence"   color={textPrimary} C={C} />
        <StatCard label="Top Performer"
          value={loading ? "…" : (summary?.topVendor?.score_grade ?? "—")}
          sub={summary?.topVendor?.name ? `${summary.topVendor.name} · ${summary.topVendor.media_score}/100` : "Highest scoring vendor this period"}
          color="#4ade80" C={C} />
      </div>

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: 80, borderRadius: 8,
              background: "rgba(128,128,128,0.06)", animation: "shimmer 1.4s ease infinite" }} />
          ))}
        </div>
      )}

      {!loading && (
        <>
          {/* ── Trending styles + subjects ─────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Style trends */}
            <div style={{ background: cardBg, border: `1px solid ${border}`,
              borderRadius: "var(--lwd-radius-card)", padding: "20px" }}>
              <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "2px",
                textTransform: "uppercase", color: textMuted, marginBottom: 4 }}>
                Trending Styles
              </div>
              <div style={{ fontFamily: NU, fontSize: 15, fontWeight: 700,
                color: textPrimary, marginBottom: 14 }}>
                What couples are clicking
              </div>
              {styleTrends.length === 0 ? (
                <div style={{ fontFamily: NU, fontSize: 12, color: textMuted, lineHeight: 1.6 }}>
                  No style trends yet — as couples interact with images, you'll see which aesthetics are driving the most engagement.
                </div>
              ) : (
                <div style={{ display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
                  {styleTrends.slice(0, 12).map(t => (
                    <TrendBar key={t.tag} tag={t.tag} score={Number(t.trend_score)}
                      maxScore={maxTrendScore} tagType="style" C={C} />
                  ))}
                </div>
              )}
            </div>

            {/* Subject trends */}
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
                  No subject trends yet — this will reveal which moments (ceremony, reception, portraits) capture the most couple attention.
                </div>
              ) : (
                <div style={{ display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
                  {subjectTrends.slice(0, 12).map(t => (
                    <TrendBar key={t.tag} tag={t.tag} score={Number(t.trend_score)}
                      maxScore={maxTrendScore} tagType="subject" C={C} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Colour mood breakdown ──────────────────────────────────── */}
          {totalColorCount > 0 && (
            <div style={{ background: cardBg, border: `1px solid ${border}`,
              borderRadius: "var(--lwd-radius-card)", padding: "20px" }}>
              <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "2px",
                textTransform: "uppercase", color: textMuted, marginBottom: 4 }}>
                Colour Mood Distribution
              </div>
              <div style={{ fontFamily: NU, fontSize: 15, fontWeight: 700,
                color: textPrimary, marginBottom: 16 }}>
                Platform Palette Trends
              </div>
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
                          width: 40, textAlign: "right" }}>
                          {pct}%
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ── Vendor media leaderboard ──────────────────────────────── */}
          {leaderboard.length > 0 && (
            <div style={{ background: cardBg, border: `1px solid ${border}`,
              borderRadius: "var(--lwd-radius-card)", overflow: "hidden" }}>
              <div style={{ padding: "18px 20px", borderBottom: `1px solid ${border}` }}>
                <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "2px",
                  textTransform: "uppercase", color: textMuted, marginBottom: 4 }}>
                  Vendor Rankings
                </div>
                <div style={{ fontFamily: NU, fontSize: 15, fontWeight: 700, color: textPrimary }}>
                  Media Health Leaderboard
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Rank", "Vendor", "Grade", "Score", "Delta", "Views 30d", "Clicks 30d", "Images"].map((h, i) => (
                        <th key={h} style={{
                          fontFamily: NU, fontSize: 9, letterSpacing: "1.5px",
                          textTransform: "uppercase", color: textMuted,
                          padding: "8px 12px", textAlign: i === 1 ? "left" : "right",
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
                            {row.views_30d || "—"}
                          </td>
                          <td style={{ padding: "10px 12px", fontFamily: NU, fontSize: 12,
                            color: textMuted, textAlign: "right" }}>
                            {row.clicks_30d || "—"}
                          </td>
                          <td style={{ padding: "10px 12px", fontFamily: NU, fontSize: 12,
                            color: textMuted, textAlign: "right" }}>
                            {row.images_count || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Empty state ───────────────────────────────────────────── */}
          {trends.length === 0 && leaderboard.length === 0 && (
            <div style={{
              padding: "40px 44px",
              background: GOLD_DIM,
              border: `1px solid ${GOLD_BORDER}`,
              borderRadius: "var(--lwd-radius-card)",
            }}>
              <div style={{ fontFamily: GD, fontSize: 22, color: textPrimary,
                marginBottom: 10 }}>
                <span style={{ color: GOLD }}>✦</span>{" "}Media tracking is active
              </div>
              <div style={{ fontFamily: NU, fontSize: 13, color: textMuted, lineHeight: 1.7, maxWidth: 560 }}>
                As couples browse listings, this module reveals which visual styles, moments, and images are driving engagement and enquiries across the platform.
              </div>
              <div style={{ fontFamily: NU, fontSize: 12, color: textMuted,
                opacity: 0.7, marginTop: 12, lineHeight: 1.5 }}>
                Trends and scores become meaningful within 7–14 days of activity. Performance data updates automatically.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
