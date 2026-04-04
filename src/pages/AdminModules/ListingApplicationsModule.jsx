// ═══════════════════════════════════════════════════════════════════════════
// ListingApplicationsModule
// Admin module for managing /list-your-business applications
// Location: Admin → Sales → Listing Applications
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";

const GOLD    = "#C9A84C";
const GD      = "var(--font-heading-primary, 'Cormorant Garamond', Georgia, serif)";
const NU      = "var(--font-body, 'Nunito Sans', sans-serif)";

const STATUSES = {
  new:        { label: "New",        color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  reviewing:  { label: "Reviewing",  color: GOLD,      bg: "rgba(201,168,76,0.12)" },
  contacted:  { label: "Contacted",  color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  approved:   { label: "Approved",   color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  declined:   { label: "Declined",   color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

const CATEGORY_LABELS = {
  venue:   "Venue",
  planner: "Planner",
  vendor:  "Vendor",
};

function fmt(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    + " · "
    + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function StatusPill({ status }) {
  const s = STATUSES[status] || STATUSES.new;
  return (
    <span style={{
      fontFamily:    NU,
      fontSize:      9,
      fontWeight:    700,
      letterSpacing: "0.8px",
      textTransform: "uppercase",
      color:         s.color,
      background:    s.bg,
      borderRadius:  12,
      padding:       "3px 9px",
      whiteSpace:    "nowrap",
    }}>
      {s.label}
    </span>
  );
}

export default function ListingApplicationsModule({ C }) {
  const [applications, setApplications] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [selected,     setSelected]     = useState(null);  // detail drawer
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCat,    setFilterCat]    = useState("all");
  const [notesDraft,   setNotesDraft]   = useState("");
  const [savingNote,   setSavingNote]   = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [lastFetched,  setLastFetched]  = useState(null);

  useEffect(() => { fetchApplications(); }, []);

  async function fetchApplications() {
    setLoading(true);
    setError("");
    try {
      const { data, error: err } = await supabase
        .from("listing_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (err) {
        if (err.message?.includes("does not exist") || err.code === "42P01") {
          setError("listing_applications table not yet created. Run the migration in supabase/migrations/ to enable this module.");
        } else {
          setError(err.message);
        }
        setApplications([]);
      } else {
        setApplications(data || []);
        setLastFetched(new Date());
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  async function updateStatus(id, status) {
    setSavingStatus(true);
    await supabase
      .from("listing_applications")
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    if (selected?.id === id) setSelected(prev => ({ ...prev, status }));
    setSavingStatus(false);
  }

  async function saveNotes(id) {
    setSavingNote(true);
    await supabase
      .from("listing_applications")
      .update({ internal_notes: notesDraft })
      .eq("id", id);
    setApplications(prev => prev.map(a => a.id === id ? { ...a, internal_notes: notesDraft } : a));
    if (selected?.id === id) setSelected(prev => ({ ...prev, internal_notes: notesDraft }));
    setSavingNote(false);
  }

  function openDetail(app) {
    setSelected(app);
    setNotesDraft(app.internal_notes || "");
  }

  // Filtered list
  const filtered = applications.filter(a => {
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    if (filterCat    !== "all" && a.category !== filterCat)  return false;
    return true;
  });

  // Stats
  const total      = applications.length;
  const thisMonth  = applications.filter(a => {
    const d = new Date(a.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const newCount   = applications.filter(a => a.status === "new").length;
  const approved   = applications.filter(a => a.status === "approved").length;
  const convRate   = total > 0 ? Math.round((approved / total) * 100) : 0;

  const dark = C?.dark || "#0f0d0a";
  const card = C?.card || "rgba(255,255,255,0.04)";
  const border = C?.border || "rgba(255,255,255,0.08)";
  const white = C?.white || "#f5f1eb";
  const grey  = C?.grey  || "rgba(245,241,235,0.5)";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "32px 36px", fontFamily: NU, color: white, position: "relative", minHeight: 600 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: GD, fontSize: 28, fontWeight: 500, fontStyle: "italic", color: white, margin: "0 0 4px" }}>
            Listing Applications
          </h2>
          <p style={{ fontFamily: NU, fontSize: 12, color: grey, margin: 0 }}>
            Applications from /list-your-business
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          {lastFetched && (
            <span style={{ fontFamily: NU, fontSize: 10, color: "rgba(245,241,235,0.28)", letterSpacing: "0.3px" }}>
              Updated {lastFetched.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              {" · "}
              {lastFetched.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
          <button
            onClick={fetchApplications}
            style={{
              fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase",
              color: GOLD, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)",
              borderRadius: 4, padding: "8px 16px", cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 1, background: border, borderRadius: 6, overflow: "hidden", marginBottom: 28,
      }}>
        {[
          { label: "Total Applications", value: total },
          { label: "This Month",         value: thisMonth },
          { label: "Awaiting Review",    value: newCount },
          { label: "Conversion Rate",    value: `${convRate}%` },
        ].map(s => (
          <div key={s.label} style={{ background: card, padding: "20px 24px" }}>
            <div style={{ fontFamily: GD, fontSize: 30, fontWeight: 500, color: GOLD, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontFamily: NU, fontSize: 10, color: grey, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <FilterChip label="All Statuses" active={filterStatus === "all"} onClick={() => setFilterStatus("all")} />
        {Object.entries(STATUSES).map(([key, s]) => (
          <FilterChip key={key} label={s.label} active={filterStatus === key} onClick={() => setFilterStatus(key)} color={s.color} />
        ))}
        <div style={{ width: 1, background: border, margin: "0 4px" }} />
        <FilterChip label="All Types"  active={filterCat === "all"}     onClick={() => setFilterCat("all")} />
        <FilterChip label="Venues"     active={filterCat === "venue"}   onClick={() => setFilterCat("venue")} />
        <FilterChip label="Planners"   active={filterCat === "planner"} onClick={() => setFilterCat("planner")} />
        <FilterChip label="Vendors"    active={filterCat === "vendor"}  onClick={() => setFilterCat("vendor")} />
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 6, padding: "14px 18px", marginBottom: 20 }}>
          <p style={{ fontFamily: NU, fontSize: 12, color: "#f87171", margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ padding: "48px 0", textAlign: "center", color: grey, fontSize: 13 }}>Loading applications…</div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <div style={{ padding: "60px 0", textAlign: "center" }}>
              <div style={{ fontFamily: GD, fontSize: 24, fontStyle: "italic", color: grey, marginBottom: 8 }}>No applications yet</div>
              <p style={{ fontFamily: NU, fontSize: 12, color: grey, opacity: 0.6 }}>
                Applications submitted via /list-your-business will appear here.
              </p>
            </div>
          ) : (
            <div style={{ borderRadius: 6, overflow: "hidden", border: `1px solid ${border}` }}>
              {/* Table header */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1.6fr 1.4fr 90px 120px 100px 80px",
                background: "rgba(255,255,255,0.03)",
                borderBottom: `1px solid ${border}`,
                padding: "10px 18px",
              }}>
                {["Business", "Contact", "Type", "Country", "Status", "Date"].map(h => (
                  <div key={h} style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: grey }}>
                    {h}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {filtered.map((app, i) => (
                <ApplicationRow
                  key={app.id}
                  app={app}
                  isLast={i === filtered.length - 1}
                  border={border}
                  white={white}
                  grey={grey}
                  card={card}
                  onClick={() => openDetail(app)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Detail drawer */}
      {selected && (
        <DetailDrawer
          app={selected}
          notesDraft={notesDraft}
          setNotesDraft={setNotesDraft}
          onSaveNotes={() => saveNotes(selected.id)}
          onUpdateStatus={status => updateStatus(selected.id, status)}
          onClose={() => setSelected(null)}
          savingNote={savingNote}
          savingStatus={savingStatus}
          white={white}
          grey={grey}
          card={card}
          border={border}
          C={C}
          onApproved={(updated) => {
            setSelected(updated);
            setApplications(prev => prev.map(a => a.id === updated.id ? updated : a));
          }}
        />
      )}
    </div>
  );
}

// ── Row ────────────────────────────────────────────────────────────────────

function ApplicationRow({ app, isLast, border, white, grey, card, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        display:          "grid",
        gridTemplateColumns: "1.6fr 1.4fr 90px 120px 100px 80px",
        padding:          "14px 18px",
        background:       hov ? "rgba(201,168,76,0.04)" : "transparent",
        borderBottom:     isLast ? "none" : `1px solid ${border}`,
        cursor:           "pointer",
        alignItems:       "center",
        transition:       "background 0.15s",
      }}
    >
      <div>
        <div style={{ fontFamily: NU, fontSize: 13, fontWeight: 600, color: white, lineHeight: 1.3 }}>
          {app.business_name || "—"}
        </div>
        {app.website && (
          <div style={{ fontFamily: NU, fontSize: 10, color: grey, marginTop: 2, opacity: 0.7 }}>
            {app.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          </div>
        )}
      </div>
      <div>
        <div style={{ fontFamily: NU, fontSize: 12, color: white }}>{app.name || "—"}</div>
        <div style={{ fontFamily: NU, fontSize: 10, color: grey, marginTop: 2 }}>{app.email || ""}</div>
      </div>
      <div>
        <span style={{
          fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase",
          color: GOLD, background: "rgba(201,168,76,0.1)", borderRadius: 10, padding: "2px 8px",
        }}>
          {CATEGORY_LABELS[app.category] || app.category || "—"}
        </span>
      </div>
      <div style={{ fontFamily: NU, fontSize: 12, color: grey }}>{app.country || "—"}</div>
      <div>
        <StatusPill status={app.status} />
        {app.status === "approved" && app.vendor_id && (
          <div style={{ marginTop: 4 }}>
            <span
              onClick={e => { e.stopPropagation(); window.open(`/admin/vendors/${app.vendor_id}`, "_blank"); }}
              style={{
                fontFamily:   NU,
                fontSize:     9,
                fontWeight:   700,
                letterSpacing: "0.5px",
                color:        GOLD,
                cursor:       "pointer",
                opacity:      0.75,
                textDecoration: "underline",
              }}
            >
              → View Vendor
            </span>
          </div>
        )}
      </div>
      <div style={{ fontFamily: NU, fontSize: 11, color: grey }}>{fmt(app.created_at)}</div>
    </div>
  );
}

// ── Detail Drawer ──────────────────────────────────────────────────────────

function AnalyticsToggle({ email, border, white, grey }) {
  const [vendorId,  setVendorId]  = useState(null);
  const [enabled,   setEnabled]   = useState(null);  // null = loading/not found
  const [saving,    setSaving]    = useState(false);
  const [notFound,  setNotFound]  = useState(false);

  // Lookup vendor by email on mount
  useEffect(() => {
    if (!email) return;
    supabase
      .from("vendors")
      .select("id, analytics_enabled")
      .eq("email", email)
      .maybeSingle()
      .then(({ data }) => {
        if (data) { setVendorId(data.id); setEnabled(!!data.analytics_enabled); }
        else setNotFound(true);
      });
  }, [email]);

  const toggle = useCallback(async () => {
    if (!vendorId || saving) return;
    const next = !enabled;
    setSaving(true);
    const { error } = await supabase
      .from("vendors")
      .update({ analytics_enabled: next })
      .eq("id", vendorId);
    if (!error) setEnabled(next);
    setSaving(false);
  }, [vendorId, enabled, saving]);

  return (
    <div>
      <SectionLabel>Analytics Access</SectionLabel>
      <div style={{
        marginTop: 10,
        padding: "14px 16px",
        background: enabled ? "rgba(201,168,76,0.06)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${enabled ? "rgba(201,168,76,0.25)" : border}`,
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}>
        <div>
          <div style={{ fontFamily: NU, fontSize: 12, color: white, marginBottom: 2 }}>
            {enabled ? "Analytics enabled" : "Analytics locked"}
          </div>
          <div style={{ fontFamily: NU, fontSize: 11, color: grey, lineHeight: 1.4 }}>
            {notFound
              ? "No vendor account found for this email yet."
              : enabled
              ? "Vendor can see views, live interest, source breakdown & compare data."
              : "Vendor sees an upgrade prompt. Enable when they're on Featured or Elite."}
          </div>
        </div>
        {!notFound && (
          <button
            onClick={toggle}
            disabled={saving || enabled === null}
            style={{
              flexShrink: 0,
              fontFamily: NU,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.7px",
              textTransform: "uppercase",
              padding: "8px 14px",
              border: `1px solid ${enabled ? "rgba(248,113,113,0.5)" : "rgba(201,168,76,0.5)"}`,
              background: enabled ? "rgba(248,113,113,0.08)" : "rgba(201,168,76,0.1)",
              color: enabled ? "#f87171" : GOLD,
              borderRadius: 4,
              cursor: saving ? "default" : "pointer",
              opacity: saving ? 0.6 : 1,
              transition: "all 0.15s",
            }}
          >
            {saving ? "…" : enabled ? "Disable" : "Enable"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── ApproveButton ──────────────────────────────────────────────────────────

function ApproveButton({ C, application, onApproved }) {
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null); // null | "success" | "error"
  const [tierSel, setTierSel] = useState("standard");

  const border = C?.border || "rgba(255,255,255,0.1)";
  const grey   = C?.grey   || "#888";

  if (application.status === "approved") {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 16px",
        background: "rgba(34,197,94,0.08)",
        border: "1px solid rgba(34,197,94,0.3)",
        borderRadius: 6,
      }}>
        <span style={{ color: "#22c55e", fontSize: 16 }}>✓</span>
        <div>
          <div style={{ fontFamily: NU, fontSize: 12, fontWeight: 700, color: "#22c55e" }}>
            Approved
          </div>
          {application.approved_at && (
            <div style={{ fontFamily: NU, fontSize: 10, color: grey }}>
              {new Date(application.approved_at).toLocaleDateString("en-GB", {
                day: "numeric", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
              {application.approved_by ? ` · by ${application.approved_by}` : ""}
            </div>
          )}
          {application.vendor_id && (
            <div style={{ fontFamily: NU, fontSize: 10, color: grey, marginTop: 2 }}>
              Vendor ID: {application.vendor_id}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (application.status === "declined") return null;

  async function handleApprove() {
    setLoading(true);
    setResult(null);
    try {
      const { supabase: sb } = await import("../../lib/supabaseClient");
      const { data: { session } } = await sb.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-vendor-application`,
        {
          method:  "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            application_id: application.id,
            tier:           tierSel,
            approved_by:    "Admin",
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setResult("success");
        onApproved?.({
          ...application,
          status:      "approved",
          vendor_id:   data.vendor_id,
          approved_at: new Date().toISOString(),
          approved_by: "Admin",
        });
      } else {
        console.error("Approval error:", data);
        setResult("error");
      }
    } catch (e) {
      console.error("Approval exception:", e);
      setResult("error");
    }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Tier selector */}
      <div>
        <div style={{
          fontFamily: NU, fontSize: 10, letterSpacing: "1.5px",
          textTransform: "uppercase", color: grey, marginBottom: 8,
        }}>
          Starting tier
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { key: "standard",  label: "Standard",  color: "#6b7280" },
            { key: "featured",  label: "Featured",  color: "#C9A84C" },
            { key: "showcase",  label: "Showcase",  color: "#8b5cf6" },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTierSel(t.key)}
              style={{
                fontFamily:  NU,
                fontSize:    11,
                fontWeight:  600,
                padding:     "5px 12px",
                borderRadius: 4,
                border:      `1px solid ${tierSel === t.key ? t.color : border}`,
                background:  tierSel === t.key ? t.color + "22" : "transparent",
                color:       tierSel === t.key ? t.color : grey,
                cursor:      "pointer",
                transition:  "all 0.15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Approve button */}
      <button
        onClick={handleApprove}
        disabled={loading}
        style={{
          fontFamily:      NU,
          fontSize:        13,
          fontWeight:      700,
          letterSpacing:   "0.5px",
          padding:         "12px 24px",
          background:      loading ? "rgba(201,168,76,0.5)" : GOLD,
          color:           "#000",
          border:          "none",
          borderRadius:    4,
          cursor:          loading ? "default" : "pointer",
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "center",
          gap:             8,
          transition:      "all 0.15s",
        }}
      >
        {loading ? (
          <>
            <span style={{ fontSize: 14, display: "inline-block", animation: "lwd-spin 1s linear infinite" }}>⟳</span>
            Creating vendor account…
          </>
        ) : (
          <>✓ Approve &amp; Send Invite</>
        )}
      </button>

      {result === "success" && (
        <div style={{
          padding:     "10px 14px",
          background:  "rgba(34,197,94,0.08)",
          border:      "1px solid rgba(34,197,94,0.3)",
          borderRadius: 4,
          fontFamily:  NU,
          fontSize:    12,
          color:       "#22c55e",
        }}>
          ✓ Vendor account created and welcome email sent.
        </div>
      )}
      {result === "error" && (
        <div style={{
          padding:     "10px 14px",
          background:  "rgba(239,68,68,0.08)",
          border:      "1px solid rgba(239,68,68,0.3)",
          borderRadius: 4,
          fontFamily:  NU,
          fontSize:    12,
          color:       "#ef4444",
        }}>
          ✗ Something went wrong. Check console and try again.
        </div>
      )}
    </div>
  );
}

// ── DetailDrawer ───────────────────────────────────────────────────────────

function DetailDrawer({ app, notesDraft, setNotesDraft, onSaveNotes, onUpdateStatus, onClose, savingNote, savingStatus, white, grey, card, border, C, onApproved }) {
  return (
    <>
      {/* Spin keyframe for approve button loading state */}
      <style>{`@keyframes lwd-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 998 }}
      />

      {/* Panel */}
      <div style={{
        position:   "fixed",
        top:        0,
        right:      0,
        height:     "100vh",
        width:      "clamp(360px, 38vw, 520px)",
        background: "#13110e",
        borderLeft: `1px solid ${border}`,
        zIndex:     999,
        overflowY:  "auto",
        display:    "flex",
        flexDirection: "column",
      }}>
        {/* Drawer header */}
        <div style={{ padding: "24px 28px", borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h3 style={{ fontFamily: GD, fontSize: 22, fontStyle: "italic", fontWeight: 500, color: white, margin: "0 0 4px" }}>
              {app.business_name}
            </h3>
            <div style={{ fontFamily: NU, fontSize: 11, color: grey }}>{app.name} · {app.email}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: grey, fontSize: 20, cursor: "pointer", padding: "2px 4px", lineHeight: 1 }}>
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "24px 28px", flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Status selector */}
          <div>
            <SectionLabel>Status</SectionLabel>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              {Object.entries(STATUSES).map(([key, s]) => (
                <button
                  key={key}
                  onClick={() => onUpdateStatus(key)}
                  disabled={savingStatus}
                  style={{
                    fontFamily:    NU,
                    fontSize:      9,
                    fontWeight:    700,
                    letterSpacing: "0.7px",
                    textTransform: "uppercase",
                    color:         app.status === key ? "#0f0d0a" : s.color,
                    background:    app.status === key ? s.color : s.bg,
                    border:        `1px solid ${app.status === key ? "transparent" : s.color}`,
                    borderRadius:  4,
                    padding:       "7px 12px",
                    cursor:        savingStatus ? "default" : "pointer",
                    opacity:       savingStatus ? 0.6 : 1,
                    transition:    "all 0.15s",
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Approval ─────────────────────────────────────────────────── */}
          <div>
            <SectionLabel>Approval</SectionLabel>
            <div style={{ marginTop: 12 }}>
              <ApproveButton
                C={{ ...{ border, grey, white }, ...(C || {}) }}
                application={app}
                onApproved={onApproved}
              />
            </div>
          </div>

          {/* Application fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <DetailField label="Category"    value={CATEGORY_LABELS[app.category] || app.category} />
            <DetailField label="Country"     value={app.country} />
            <DetailField label="Region"      value={app.region} />
            <DetailField label="Phone"       value={app.phone} />
            <DetailField label="Applied"     value={fmt(app.created_at)} />
            <DetailField label="Device"      value={app.device_info ? `${app.device_info.device} · ${app.device_info.os}` : null} />
            <DetailField label="Source"      value={app.source_page} />
          </div>

          {/* Website + Instagram */}
          {(app.website || app.instagram) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {app.website && (
                <div>
                  <SectionLabel>Website</SectionLabel>
                  <a
                    href={app.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontFamily: NU, fontSize: 12, color: GOLD, textDecoration: "none" }}
                  >
                    {app.website.replace(/^https?:\/\//, "").replace(/\/$/, "")} ↗
                  </a>
                </div>
              )}
              {app.instagram && (
                <div>
                  <SectionLabel>Instagram</SectionLabel>
                  <span style={{ fontFamily: NU, fontSize: 12, color: white }}>{app.instagram}</span>
                </div>
              )}
            </div>
          )}

          {/* Message */}
          {app.message && (
            <div>
              <SectionLabel>Their message</SectionLabel>
              <p style={{ fontFamily: NU, fontSize: 13, color: grey, lineHeight: 1.6, margin: "8px 0 0", background: "rgba(255,255,255,0.03)", borderRadius: 4, padding: "12px 14px" }}>
                {app.message}
              </p>
            </div>
          )}

          {/* Internal notes */}
          <div>
            <SectionLabel>Internal notes</SectionLabel>
            <textarea
              value={notesDraft}
              onChange={e => setNotesDraft(e.target.value)}
              placeholder="Add notes visible only to your team…"
              rows={4}
              style={{
                width:       "100%",
                marginTop:   8,
                fontFamily:  NU,
                fontSize:    13,
                color:       white,
                background:  "rgba(255,255,255,0.04)",
                border:      `1px solid ${border}`,
                borderRadius: 4,
                padding:     "12px 14px",
                resize:      "vertical",
                outline:     "none",
                boxSizing:   "border-box",
              }}
            />
            <button
              onClick={onSaveNotes}
              disabled={savingNote}
              style={{
                marginTop:     8,
                fontFamily:    NU,
                fontSize:      10,
                fontWeight:    700,
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                color:         "#0f0d0a",
                background:    savingNote ? "rgba(201,168,76,0.4)" : `linear-gradient(135deg, ${GOLD}, #e8c97a)`,
                border:        "none",
                borderRadius:  4,
                padding:       "8px 18px",
                cursor:        savingNote ? "default" : "pointer",
              }}
            >
              {savingNote ? "Saving…" : "Save Notes"}
            </button>
          </div>

          {/* CRM lead link (if synced) */}
          {app.crm_lead_id && (
            <div style={{ padding: "12px 14px", background: "rgba(201,168,76,0.06)", borderRadius: 4, border: `1px solid rgba(201,168,76,0.15)` }}>
              <span style={{ fontFamily: NU, fontSize: 11, color: GOLD }}>✦ Synced to CRM · Lead ID: {app.crm_lead_id}</span>
            </div>
          )}

          {/* Analytics access toggle — only shown for approved applications */}
          {app.status === "approved" && (
            <AnalyticsToggle email={app.email} border={border} white={white} grey={grey} />
          )}

        </div>
      </div>
    </>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "rgba(245,241,235,0.35)", marginBottom: 4 }}>
      {children}
    </div>
  );
}

function DetailField({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <div style={{ fontFamily: NU, fontSize: 13, color: "rgba(245,241,235,0.75)", marginTop: 4 }}>{value}</div>
    </div>
  );
}

function FilterChip({ label, active, onClick, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily:    NU,
        fontSize:      9,
        fontWeight:    700,
        letterSpacing: "0.7px",
        textTransform: "uppercase",
        color:         active ? "#0f0d0a" : (color || "rgba(245,241,235,0.55)"),
        background:    active ? (color || GOLD) : "rgba(255,255,255,0.04)",
        border:        `1px solid ${active ? "transparent" : "rgba(255,255,255,0.08)"}`,
        borderRadius:  4,
        padding:       "6px 12px",
        cursor:        "pointer",
        transition:    "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}
