// ─── src/pages/AdminModules/MediaIntelligenceTab.jsx ─────────────────────────
// Per-vendor media intelligence — rendered as a tab inside AdminVendorIntelligenceView.
// Shows: score header, per-image table (sortable), gallery position chart,
// style tag breakdown, search intelligence, admin notes.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

const GOLD        = "#C9A84C";
const GOLD_DIM    = "rgba(201,168,76,0.10)";
const GOLD_BORDER = "rgba(201,168,76,0.28)";
const GD          = "var(--font-heading-primary)";
const NU          = "var(--font-body)";

function Pill({ children, color = GOLD }) {
  return (
    <span style={{
      fontFamily: NU, fontSize: 9, fontWeight: 700,
      letterSpacing: "0.8px", textTransform: "capitalize",
      color, background: `${color}18`,
      border: `1px solid ${color}44`,
      borderRadius: 20, padding: "2px 8px",
    }}>
      {children}
    </span>
  );
}

function GradeChip({ grade, score }) {
  const color = grade === "A" ? "#4ade80" : grade === "B" ? GOLD : grade === "C" ? "#f59e0b" : "#ef4444";
  return (
    <span style={{
      fontFamily: GD, fontSize: 14, fontWeight: 700, color,
      background: `${color}18`, border: `1px solid ${color}44`,
      borderRadius: 6, padding: "2px 10px", marginLeft: 8,
    }}>
      {grade} · {score}
    </span>
  );
}

// ── Sortable column header ────────────────────────────────────────────────────
function Th({ children, sortKey, sortBy, setSortBy, sortDir, setSortDir, C }) {
  const active = sortBy === sortKey;
  return (
    <th
      onClick={() => {
        if (active) setSortDir(d => d === "desc" ? "asc" : "desc");
        else { setSortBy(sortKey); setSortDir("desc"); }
      }}
      style={{
        fontFamily: NU, fontSize: 9, letterSpacing: "1.5px",
        textTransform: "uppercase", fontWeight: 600,
        color: active ? GOLD : (C?.grey || "rgba(255,255,255,0.45)"),
        padding: "8px 10px", textAlign: "right", cursor: "pointer",
        whiteSpace: "nowrap", userSelect: "none",
        borderBottom: `1px solid rgba(201,168,76,0.12)`,
      }}
    >
      {children}{active ? (sortDir === "desc" ? " ↓" : " ↑") : ""}
    </th>
  );
}

// ── Gallery heatmap ───────────────────────────────────────────────────────────
function PositionChart({ positions, C }) {
  if (!positions.length) return (
    <div style={{ fontFamily: NU, fontSize: 12,
      color: C?.grey || "rgba(255,255,255,0.45)", fontStyle: "italic" }}>
      No gallery position data yet.
    </div>
  );
  const maxCtr = Math.max(...positions.map(p => parseFloat(p.ctr) || 0), 1);
  const bestPos = positions.reduce((b, p) =>
    (parseFloat(p.ctr) || 0) > (parseFloat(b.ctr) || 0) ? p : b, positions[0]);

  return (
    <div>
      <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 80, overflowX: "auto" }}>
        {positions.map(p => {
          const ctr = parseFloat(p.ctr) || 0;
          const height = Math.max(6, Math.round((ctr / maxCtr) * 72));
          const isBest = p.gallery_position === bestPos?.gallery_position;
          return (
            <div key={p.gallery_position}
              title={`Position ${p.gallery_position}: ${p.impressions} views · ${p.clicks} clicks · ${ctr}% CTR`}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <div style={{
                width: 32, height,
                background: isBest ? GOLD : "rgba(201,168,76,0.3)",
                borderRadius: "3px 3px 0 0",
                boxShadow: isBest ? "0 0 10px rgba(201,168,76,0.5)" : "none",
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
      <div style={{ fontFamily: NU, fontSize: 10, color: GOLD, marginTop: 8 }}>
        ✦ Position {bestPos.gallery_position} — {bestPos.ctr}% CTR ({bestPos.impressions} impressions)
      </div>
    </div>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────────
export default function MediaIntelligenceTab({ vendorId, vendorName, C }) {
  const [loading,    setLoading]    = useState(true);
  const [scorecard,  setScorecard]  = useState(null);
  const [mediaStats, setMediaStats] = useState([]);
  const [positions,  setPositions]  = useState([]);
  const [sortBy,     setSortBy]     = useState("views");
  const [sortDir,    setSortDir]    = useState("desc");
  const [notes,      setNotes]      = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved,  setNotesSaved]  = useState(false);
  const [listingId,  setListingId]  = useState(null);

  const isLight    = C?.bg === "#F2EFE9" || C?.bg?.startsWith("#F");
  const cardBg     = isLight ? "#FFFFFF" : (C?.card || "#111");
  const border     = isLight ? "rgba(0,0,0,0.08)" : (C?.border || "rgba(255,255,255,0.07)");
  const textPrimary = isLight ? "#1a1a1a" : (C?.white || "#F5F0E8");
  const textMuted   = isLight ? "rgba(28,20,16,0.5)" : (C?.grey || "rgba(255,255,255,0.45)");

  useEffect(() => {
    if (!vendorId) { setLoading(false); return; }
    let cancelled = false;

    // Get the linked listing_id for this vendor
    Promise.resolve(
      supabase.from("listings").select("id").eq("vendor_account_id", vendorId).limit(1).single()
    ).then(({ data: listingRow }) => {
      const lid = listingRow?.id;
      if (!lid) { setLoading(false); return; }
      if (!cancelled) setListingId(lid);

      const from = new Date(Date.now() - 30 * 86400_000).toISOString();
      const to   = new Date().toISOString();

      return Promise.all([
        Promise.resolve(
          supabase.from("vendor_media_scorecard")
            .select("*")
            .eq("listing_id", lid)
            .order("snapshot_date", { ascending: false })
            .limit(1)
            .single()
        ),
        Promise.resolve(
          supabase.rpc("get_listing_media_stats", { p_listing_id: lid, p_from: from, p_to: to })
        ),
        Promise.resolve(
          supabase.rpc("get_gallery_position_performance", { p_listing_id: lid, p_from: from, p_to: to })
        ),
      ]);
    }).then(results => {
      if (!results || cancelled) return;
      const [scRes, statsRes, posRes] = results;
      setScorecard(scRes?.data || null);
      setNotes(scRes?.data?.admin_notes || "");
      setMediaStats(statsRes?.data || []);
      setPositions(posRes?.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));

    return () => { cancelled = true; };
  }, [vendorId]);

  // Sort media table
  const sortedMedia = [...mediaStats].sort((a, b) => {
    const av = Number(a[sortBy] || 0);
    const bv = Number(b[sortBy] || 0);
    return sortDir === "desc" ? bv - av : av - bv;
  });

  // Save admin notes
  async function saveNotes() {
    if (!scorecard?.id) return;
    setSavingNotes(true);
    await Promise.resolve(
      supabase.from("vendor_media_scorecard")
        .update({ admin_notes: notes })
        .eq("id", scorecard.id)
    ).catch(() => {});
    setSavingNotes(false);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  }

  // Style tag frequency from metadata
  const [styleTags, setStyleTags] = useState([]);
  useEffect(() => {
    if (!listingId) return;
    Promise.resolve(
      supabase.from("media_metadata_enrichment")
        .select("style_tags")
        .eq("listing_id", listingId)
        .limit(200)
    ).then(({ data }) => {
      if (!data?.length) return;
      const freq = {};
      data.forEach(row => (row.style_tags || []).forEach(t => { freq[t] = (freq[t] || 0) + 1; }));
      setStyleTags(Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 12));
    }).catch(() => {});
  }, [listingId]);

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 4 }}>
      {[1,2,3].map(i => (
        <div key={i} style={{ height: 64, borderRadius: 6,
          background: "rgba(128,128,128,0.06)", animation: "shimmer 1.4s ease infinite" }} />
      ))}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Score header ─────────────────────────────────────────────────── */}
      <div style={{ background: cardBg, border: `1px solid ${border}`,
        borderRadius: "var(--lwd-radius-card)", padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "2px",
              textTransform: "uppercase", color: textMuted, marginBottom: 4 }}>
              Media Health Score
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ fontFamily: NU, fontSize: 15, fontWeight: 700, color: textPrimary }}>
                {vendorName || "Vendor"}
              </span>
              {scorecard && <GradeChip grade={scorecard.score_grade} score={scorecard.media_score} />}
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              { label: "Images",    value: scorecard?.images_count  ?? "—" },
              { label: "Videos",    value: scorecard?.videos_count  ?? "—" },
              { label: "Tagged",    value: scorecard?.tagged_pct != null ? `${scorecard.tagged_pct}%` : "—" },
              { label: "Views 30d", value: scorecard?.views_30d     ?? "—" },
              { label: "Clicks 30d",value: scorecard?.clicks_30d    ?? "—" },
              { label: "Shares 30d",value: scorecard?.shares_30d    ?? "—" },
            ].map(item => (
              <div key={item.label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: GD, fontSize: 18, fontWeight: 700, color: GOLD }}>
                  {item.value}
                </div>
                <div style={{ fontFamily: NU, fontSize: 8, letterSpacing: "1px",
                  textTransform: "uppercase", color: textMuted }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Per-image table ───────────────────────────────────────────────── */}
      <div style={{ background: cardBg, border: `1px solid ${border}`,
        borderRadius: "var(--lwd-radius-card)", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${border}` }}>
          <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "2px",
            textTransform: "uppercase", color: textMuted }}>
            Image Performance — last 30 days
          </div>
        </div>
        {sortedMedia.length === 0 ? (
          <div style={{ padding: "24px 18px", fontFamily: NU, fontSize: 13,
            color: textMuted, fontStyle: "italic" }}>
            No media events yet. Tracking fires automatically as couples browse.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ fontFamily: NU, fontSize: 9, letterSpacing: "1.5px",
                    textTransform: "uppercase", color: textMuted,
                    padding: "8px 10px 8px 18px", textAlign: "left",
                    borderBottom: `1px solid rgba(201,168,76,0.12)` }}>
                    Media ID
                  </th>
                  {[
                    { label: "Views",     key: "views"     },
                    { label: "Clicks",    key: "clicks"    },
                    { label: "Dwells",    key: "dwells"    },
                    { label: "Shares",    key: "shares"    },
                    { label: "Enquiries", key: "enquiries" },
                    { label: "Avg dwell", key: "avg_dwell_ms" },
                  ].map(col => (
                    <Th key={col.key} sortKey={col.key}
                      sortBy={sortBy} setSortBy={setSortBy}
                      sortDir={sortDir} setSortDir={setSortDir} C={C}>
                      {col.label}
                    </Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedMedia.map((m, i) => (
                  <tr key={m.media_id}
                    style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                    <td style={{ padding: "10px 10px 10px 18px",
                      fontFamily: NU, fontSize: 11, color: textMuted }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {m.is_hero && <Pill color={GOLD}>hero</Pill>}
                        <span style={{ maxWidth: 140, overflow: "hidden",
                          textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {m.media_id}
                        </span>
                      </div>
                    </td>
                    {[
                      { val: m.views,    col: "views",      color: textPrimary },
                      { val: m.clicks,   col: "clicks",     color: GOLD },
                      { val: m.dwells,   col: "dwells",     color: textPrimary },
                      { val: m.shares,   col: "shares",     color: "#E1306C" },
                      { val: m.enquiries,col: "enquiries",  color: "#4ade80" },
                      { val: m.avg_dwell_ms ? `${Math.round(m.avg_dwell_ms / 1000)}s` : "—",
                        col: "avg_dwell_ms", color: textMuted },
                    ].map((cell, ci) => (
                      <td key={ci} style={{
                        padding: "10px",
                        fontFamily: NU, fontSize: 12, fontWeight: 700,
                        color: sortBy === cell.col ? cell.color : textMuted,
                        textAlign: "right",
                        borderLeft: `1px solid ${border}`,
                      }}>
                        {cell.val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Gallery position chart ────────────────────────────────────────── */}
      <div style={{ background: cardBg, border: `1px solid ${border}`,
        borderRadius: "var(--lwd-radius-card)", padding: "18px 20px" }}>
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "2px",
          textTransform: "uppercase", color: textMuted, marginBottom: 12 }}>
          Gallery Position Performance
        </div>
        <PositionChart positions={positions} C={C} />
      </div>

      {/* ── Style tags ────────────────────────────────────────────────────── */}
      {styleTags.length > 0 && (
        <div style={{ background: cardBg, border: `1px solid ${border}`,
          borderRadius: "var(--lwd-radius-card)", padding: "18px 20px" }}>
          <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "2px",
            textTransform: "uppercase", color: textMuted, marginBottom: 12 }}>
            Style Tag Distribution
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {styleTags.slice(0, 10).map(([tag, count]) => {
              const maxCount = styleTags[0][1];
              const pct = Math.round((count / maxCount) * 100);
              return (
                <div key={tag} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 90, fontFamily: NU, fontSize: 11, color: textPrimary,
                    textTransform: "capitalize", flexShrink: 0 }}>
                    {tag}
                  </div>
                  <div style={{ flex: 1, height: 6, borderRadius: 3,
                    background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`,
                      background: GOLD, borderRadius: 3,
                      transition: "width 0.5s ease" }} />
                  </div>
                  <div style={{ fontFamily: NU, fontSize: 10, color: textMuted,
                    width: 24, textAlign: "right" }}>
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Admin notes ───────────────────────────────────────────────────── */}
      <div style={{ background: cardBg, border: `1px solid ${border}`,
        borderRadius: "var(--lwd-radius-card)", padding: "18px 20px" }}>
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "2px",
          textTransform: "uppercase", color: textMuted, marginBottom: 10 }}>
          Admin Notes — Media
        </div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Internal notes on media quality, photography recommendations, pending enrichment…"
          rows={3}
          style={{
            width: "100%", boxSizing: "border-box",
            fontFamily: NU, fontSize: 12, lineHeight: 1.6,
            padding: "10px 12px",
            background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${border}`,
            borderRadius: "var(--lwd-radius-input)",
            color: textPrimary, resize: "vertical", outline: "none",
          }}
        />
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={saveNotes}
            disabled={savingNotes}
            style={{
              fontFamily: NU, fontSize: 11, fontWeight: 700,
              padding: "6px 16px",
              background: GOLD, color: "#000", border: "none",
              borderRadius: "var(--lwd-radius-input)",
              cursor: savingNotes ? "default" : "pointer",
              opacity: savingNotes ? 0.6 : 1,
            }}
          >
            {savingNotes ? "Saving…" : "Save notes"}
          </button>
          {notesSaved && (
            <span style={{ fontFamily: NU, fontSize: 11, color: "#4ade80" }}>✓ Saved</span>
          )}
        </div>
      </div>

    </div>
  );
}
