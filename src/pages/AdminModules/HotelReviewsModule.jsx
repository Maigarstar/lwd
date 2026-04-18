// ═══════════════════════════════════════════════════════════════════════════
// HotelReviewsModule
// Admin module for managing The LWD Hotel Review records
// Location: Admin → Publications → Hotel Reviews
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

const GOLD = "#C9A84C";
const GD   = "var(--font-heading-primary, 'Cormorant Garamond', Georgia, serif)";
const NU   = "var(--font-body, 'Nunito Sans', sans-serif)";

const STATUSES = {
  draft:     { label: "Draft",     color: "rgba(255,255,255,0.5)",  bg: "rgba(255,255,255,0.08)" },
  review:    { label: "In Review", color: GOLD,                     bg: "rgba(201,168,76,0.12)"  },
  published: { label: "Published", color: "#34d399",                bg: "rgba(52,211,153,0.12)"  },
};

const REVIEW_TYPE_LABELS = {
  editorial:  "Editorial",
  sponsored:  "Sponsored",
  self_serve: "Self-Serve",
};

function fmt(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function StatusPill({ status }) {
  const s = STATUSES[status] || STATUSES.draft;
  return (
    <span style={{
      fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.8px",
      textTransform: "uppercase", color: s.color, background: s.bg,
      borderRadius: 12, padding: "3px 9px", whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}

function StarRating({ n = 0 }) {
  return (
    <span style={{ color: GOLD, fontSize: 10, letterSpacing: 2 }}>
      {"✦".repeat(n)}
      <span style={{ opacity: 0.2 }}>{"✦".repeat(5 - n)}</span>
    </span>
  );
}

export default function HotelReviewsModule({ C }) {
  const [reviews,      setReviews]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [selected,     setSelected]     = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType,   setFilterType]   = useState("all");
  const [savingStatus, setSavingStatus] = useState(false);
  const [notesDraft,   setNotesDraft]   = useState("");
  const [savingNotes,  setSavingNotes]  = useState(false);
  const [lastFetched,  setLastFetched]  = useState(null);

  useEffect(() => { fetchReviews(); }, []);

  async function fetchReviews() {
    setLoading(true);
    setError("");
    try {
      const { data, error: err } = await supabase
        .from("magazine_hotel_reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (err) {
        if (err.message?.includes("does not exist") || err.code === "42P01") {
          setError("magazine_hotel_reviews table not found. Run the SQL migration first.");
        } else {
          setError(err.message);
        }
        setReviews([]);
      } else {
        setReviews(data || []);
        setLastFetched(new Date());
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  async function updateStatus(id, status) {
    setSavingStatus(true);
    const { error: err } = await supabase
      .from("magazine_hotel_reviews")
      .update({ status })
      .eq("id", id);
    if (!err) {
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      if (selected?.id === id) setSelected(prev => ({ ...prev, status }));
    }
    setSavingStatus(false);
  }

  async function saveNotes(id) {
    setSavingNotes(true);
    const { error: err } = await supabase
      .from("magazine_hotel_reviews")
      .update({ verdict: notesDraft })
      .eq("id", id);
    if (!err) {
      setReviews(prev => prev.map(r => r.id === id ? { ...r, verdict: notesDraft } : r));
      if (selected?.id === id) setSelected(prev => ({ ...prev, verdict: notesDraft }));
    }
    setSavingNotes(false);
  }

  function openDetail(review) {
    setSelected(review);
    setNotesDraft(review.verdict || "");
  }

  // Filtered + stats
  const filtered = reviews.filter(r => {
    if (filterStatus !== "all" && r.status !== filterStatus)           return false;
    if (filterType   !== "all" && r.review_type !== filterType)        return false;
    return true;
  });

  const total      = reviews.length;
  const published  = reviews.filter(r => r.status === "published").length;
  const drafts     = reviews.filter(r => r.status === "draft").length;
  const sponsored  = reviews.filter(r => r.review_type === "sponsored").length;

  const dark   = C?.dark   || "#0f0d0a";
  const card   = C?.card   || "rgba(255,255,255,0.04)";
  const border = C?.border || "rgba(255,255,255,0.08)";
  const white  = C?.white  || "#f5f1eb";
  const grey   = C?.grey   || "rgba(245,241,235,0.5)";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "32px 36px", fontFamily: NU, color: white, position: "relative", minHeight: 600 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: GD, fontSize: 28, fontWeight: 500, fontStyle: "italic", color: white, margin: "0 0 4px" }}>
            Hotel Reviews
          </h2>
          <p style={{ fontFamily: NU, fontSize: 12, color: grey, margin: 0 }}>
            The LWD Hotel Review — all records
            {lastFetched && ` · Updated ${lastFetched.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`}
          </p>
        </div>
        <button
          onClick={fetchReviews}
          style={{
            fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
            textTransform: "uppercase",
            background: "rgba(201,168,76,0.1)", border: `1px solid rgba(201,168,76,0.3)`,
            borderRadius: 3, color: GOLD, padding: "8px 16px", cursor: "pointer",
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* ── Stats strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Total Reviews", value: total },
          { label: "Published",     value: published },
          { label: "Drafts",        value: drafts    },
          { label: "Sponsored",     value: sponsored },
        ].map(s => (
          <div key={s.label} style={{ background: card, border: `1px solid ${border}`, borderRadius: 6, padding: "14px 18px" }}>
            <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: grey, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: GD, fontSize: 28, fontStyle: "italic", color: GOLD }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 4, padding: "12px 16px", marginBottom: 20, color: "#fca5a5", fontSize: 12 }}>
          {error}
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {/* Status filter */}
        {["all", "draft", "review", "published"].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            style={{
              fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase",
              background: filterStatus === s ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${filterStatus === s ? "rgba(201,168,76,0.4)" : border}`,
              borderRadius: 3, padding: "6px 12px", cursor: "pointer",
              color: filterStatus === s ? GOLD : grey,
            }}
          >
            {s === "all" ? "All Status" : (STATUSES[s]?.label || s)}
          </button>
        ))}
        <div style={{ width: 1, background: border, margin: "0 4px" }} />
        {/* Type filter */}
        {["all", "editorial", "sponsored", "self_serve"].map(t => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            style={{
              fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase",
              background: filterType === t ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${filterType === t ? "rgba(201,168,76,0.4)" : border}`,
              borderRadius: 3, padding: "6px 12px", cursor: "pointer",
              color: filterType === t ? GOLD : grey,
            }}
          >
            {t === "all" ? "All Types" : (REVIEW_TYPE_LABELS[t] || t)}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div style={{ color: grey, fontSize: 13, padding: "40px 0", textAlign: "center" }}>Loading reviews…</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: grey, fontSize: 13, padding: "40px 0", textAlign: "center" }}>
          {reviews.length === 0 ? "No reviews yet — build one in the Publication Studio" : "No reviews match this filter"}
        </div>
      ) : (
        <div style={{ border: `1px solid ${border}`, borderRadius: 6, overflow: "hidden" }}>
          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 80px 80px 100px 90px",
            padding: "10px 16px",
            background: "rgba(255,255,255,0.03)",
            borderBottom: `1px solid ${border}`,
          }}>
            {["Hotel", "Location", "Stars", "Type", "Status", "Created"].map(h => (
              <div key={h} style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: grey }}>
                {h}
              </div>
            ))}
          </div>

          {/* Rows */}
          {filtered.map((r, i) => (
            <div
              key={r.id}
              onClick={() => openDetail(r)}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 80px 80px 100px 90px",
                padding: "12px 16px",
                borderBottom: i < filtered.length - 1 ? `1px solid ${border}` : "none",
                cursor: "pointer",
                background: selected?.id === r.id ? "rgba(201,168,76,0.06)" : "transparent",
                transition: "background 0.1s",
              }}
              onMouseEnter={e => { if (selected?.id !== r.id) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
              onMouseLeave={e => { if (selected?.id !== r.id) e.currentTarget.style.background = "transparent"; }}
            >
              <div>
                <div style={{ fontFamily: NU, fontSize: 12, fontWeight: 600, color: white, marginBottom: 2 }}>
                  {r.hotel_name}
                </div>
                {r.headline && (
                  <div style={{ fontFamily: GD, fontSize: 11, fontStyle: "italic", color: grey }}>
                    {r.headline}
                  </div>
                )}
              </div>
              <div style={{ fontFamily: NU, fontSize: 11, color: grey, alignSelf: "center" }}>
                {r.location || "—"}
              </div>
              <div style={{ alignSelf: "center" }}>
                <StarRating n={r.star_rating || 0} />
              </div>
              <div style={{ fontFamily: NU, fontSize: 10, color: grey, alignSelf: "center", textTransform: "capitalize" }}>
                {REVIEW_TYPE_LABELS[r.review_type] || r.review_type || "—"}
              </div>
              <div style={{ alignSelf: "center" }}>
                <StatusPill status={r.status} />
              </div>
              <div style={{ fontFamily: NU, fontSize: 10, color: grey, alignSelf: "center" }}>
                {fmt(r.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Detail drawer ── */}
      {selected && (
        <div
          style={{
            position: "fixed", right: 0, top: 0, bottom: 0,
            width: 440,
            background: dark,
            borderLeft: `1px solid ${border}`,
            overflowY: "auto",
            zIndex: 50,
            padding: "28px 28px 40px",
            boxShadow: "-8px 0 32px rgba(0,0,0,0.4)",
          }}
        >
          {/* Close */}
          <button
            onClick={() => setSelected(null)}
            style={{
              position: "absolute", top: 20, right: 20,
              background: "none", border: "none", color: grey,
              fontSize: 18, cursor: "pointer", lineHeight: 1, padding: 0,
            }}
          >✕</button>

          {/* Hotel header */}
          <div style={{ marginBottom: 24 }}>
            {selected.star_rating > 0 && (
              <div style={{ marginBottom: 8 }}>
                <StarRating n={selected.star_rating} />
              </div>
            )}
            <h3 style={{ fontFamily: GD, fontSize: 24, fontWeight: 500, fontStyle: "italic", color: white, margin: "0 0 4px" }}>
              {selected.hotel_name}
            </h3>
            {selected.location && (
              <div style={{ fontFamily: NU, fontSize: 12, color: grey, marginBottom: 8 }}>
                {selected.location}
              </div>
            )}
            {selected.headline && (
              <div style={{ fontFamily: GD, fontSize: 14, fontStyle: "italic", color: GOLD }}>
                "{selected.headline}"
              </div>
            )}
          </div>

          {/* Meta pills */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
            <StatusPill status={selected.status} />
            <span style={{
              fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase", color: grey,
              background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "3px 9px",
            }}>
              {REVIEW_TYPE_LABELS[selected.review_type] || selected.review_type}
            </span>
            {selected.price_range && (
              <span style={{
                fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                color: GOLD, background: "rgba(201,168,76,0.1)", borderRadius: 12, padding: "3px 9px",
              }}>
                {selected.price_range}
              </span>
            )}
          </div>

          {/* Ratings */}
          {(selected.rating_rooms || selected.rating_dining || selected.rating_service || selected.rating_value) && (
            <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 6, padding: "14px 16px", marginBottom: 20 }}>
              <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: grey, marginBottom: 12 }}>Ratings</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "Rooms",   val: selected.rating_rooms },
                  { label: "Dining",  val: selected.rating_dining },
                  { label: "Service", val: selected.rating_service },
                  { label: "Value",   val: selected.rating_value },
                ].filter(r => r.val).map(r => (
                  <div key={r.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: GOLD }}>{r.label}</span>
                      <span style={{ fontFamily: GD, fontSize: 11, fontStyle: "italic", color: white }}>{r.val}/10</span>
                    </div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(r.val / 10) * 100}%`, background: GOLD, borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Best for */}
          {selected.best_for?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: grey, marginBottom: 8 }}>Best For</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {selected.best_for.map(tag => (
                  <span key={tag} style={{
                    fontFamily: NU, fontSize: 9, color: GOLD,
                    background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)",
                    borderRadius: 2, padding: "3px 8px",
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Images preview */}
          {selected.images?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: grey, marginBottom: 8 }}>
                Images ({selected.images.length})
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                {selected.images.slice(0, 6).map((img, i) => (
                  <div key={i} style={{ position: "relative", borderRadius: 3, overflow: "hidden", border: `1px solid ${img.isHero ? GOLD : border}` }}>
                    <img src={img.url} alt="" style={{ width: "100%", height: 60, objectFit: "cover", display: "block" }} onError={e => { e.target.style.opacity = 0.3; }} />
                    {img.isHero && (
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: GOLD, textAlign: "center", fontFamily: NU, fontSize: 7, fontWeight: 700, color: "#1a1814", padding: "2px 0" }}>HERO</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verdict notes */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: grey, marginBottom: 8 }}>Verdict</div>
            <textarea
              value={notesDraft}
              onChange={e => setNotesDraft(e.target.value)}
              rows={4}
              placeholder="Editorial verdict…"
              style={{
                width: "100%", boxSizing: "border-box",
                background: card, border: `1px solid ${border}`,
                borderRadius: 4, color: white, fontFamily: NU, fontSize: 11,
                padding: "8px 10px", outline: "none", resize: "vertical",
                lineHeight: 1.55,
              }}
            />
            <button
              onClick={() => saveNotes(selected.id)}
              disabled={savingNotes}
              style={{
                marginTop: 6,
                fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase",
                background: "rgba(255,255,255,0.06)", border: `1px solid ${border}`,
                borderRadius: 3, color: grey, padding: "6px 14px", cursor: "pointer",
              }}
            >
              {savingNotes ? "Saving…" : "Save Verdict"}
            </button>
          </div>

          {/* Status management */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: grey, marginBottom: 10 }}>Status</div>
            <div style={{ display: "flex", gap: 8 }}>
              {Object.entries(STATUSES).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => updateStatus(selected.id, key)}
                  disabled={savingStatus || selected.status === key}
                  style={{
                    fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    background: selected.status === key ? val.bg : "rgba(255,255,255,0.04)",
                    border: `1px solid ${selected.status === key ? val.color + "66" : border}`,
                    borderRadius: 3, padding: "7px 12px",
                    color: selected.status === key ? val.color : grey,
                    cursor: selected.status === key || savingStatus ? "default" : "pointer",
                    opacity: savingStatus ? 0.6 : 1,
                    transition: "all 0.12s",
                  }}
                >
                  {val.label}
                </button>
              ))}
            </div>
          </div>

          {/* Meta */}
          <div style={{ borderTop: `1px solid ${border}`, paddingTop: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "Created",  value: fmt(selected.created_at) },
                { label: "Updated",  value: fmt(selected.updated_at) },
                { label: "Sections", value: Object.entries(selected.sections_config || {}).filter(([, v]) => v).map(([k]) => k).join(", ") || "—" },
                { label: "ID",       value: selected.id?.slice(0, 8) + "…" },
              ].map(m => (
                <div key={m.label}>
                  <div style={{ fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: grey, marginBottom: 2 }}>{m.label}</div>
                  <div style={{ fontFamily: NU, fontSize: 10, color: "rgba(255,255,255,0.55)" }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
