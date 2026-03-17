// ─── src/pages/AdminModules/SocialStudioModule.jsx ────────────────────────────
// Social Studio: Managed content delivery for LWD clients.
// Planning, execution, scheduling, and performance tracking in one place.
// Internal tool for LWD team. Not a standalone scheduler.

import { useState, useMemo } from "react";

// ── Constants ──────────────────────────────────────────────────────────────────

const CONTENT_TYPE_GROUPS = [
  {
    group: "Social",
    types: [
      { key: "post", label: "Post", color: "#3b82f6", icon: "◈" },
      { key: "reel", label: "Reel", color: "#ec4899", icon: "▶" },
    ],
  },
  {
    group: "Editorial",
    types: [
      { key: "blog",            label: "Blog",            color: "#22c55e", icon: "✎" },
      { key: "venue-feature",   label: "Venue Feature",   color: "#8f7420", icon: "⌂" },
      { key: "newsletter",      label: "Newsletter",      color: "#f97316", icon: "✉" },
      { key: "organic-content", label: "Organic Content", color: "#a855f7", icon: "⚙" },
    ],
  },
  {
    group: "Creative",
    types: [
      { key: "photography", label: "Photography",      color: "#64748b", icon: "◎" },
      { key: "video",       label: "Video Production", color: "#dc2626", icon: "▶" },
      { key: "style-shoot", label: "Style Shoot",      color: "#be185d", icon: "✦" },
    ],
  },
  {
    group: "Growth",
    types: [
      { key: "link-building", label: "Link Building", color: "#06b6d4", icon: "⟐" },
      { key: "fam-trip",      label: "FAM Trip",       color: "#8b5cf6", icon: "✦" },
    ],
  },
  {
    group: "Services",
    types: [
      { key: "consultancy", label: "Consultancy", color: "#0d9488", icon: "◆" },
      { key: "mentoring",   label: "Mentoring",   color: "#d97706", icon: "◉" },
    ],
  },
];

const CONTENT_TYPES = CONTENT_TYPE_GROUPS.flatMap((g) => g.types);

const PLATFORMS = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook",  label: "Facebook" },
  { key: "pinterest", label: "Pinterest" },
  { key: "linkedin",  label: "LinkedIn" },
  { key: "tiktok",    label: "TikTok" },
  { key: "web",       label: "Website" },
  { key: "email",     label: "Email" },
];

const STATUSES = [
  { key: "brief",     label: "Brief",     color: "#6b7280" },
  { key: "draft",     label: "Draft",     color: "#3b82f6" },
  { key: "review",    label: "Review",    color: "#f59e0b" },
  { key: "approved",  label: "Approved",  color: "#0ea5e9" },
  { key: "scheduled", label: "Scheduled", color: "#8b5cf6" },
  { key: "live",      label: "Live",      color: "#22c55e" },
  { key: "reported",  label: "Reported",  color: "#6b7280" },
];

const STATUS_PIPELINE = STATUSES.map((s) => s.key);

const MOCK_CLIENTS = [
  { id: "c1", name: "Villa d'Este" },
  { id: "c2", name: "Belmond Villa San Michele" },
  { id: "c3", name: "Borgo Egnazia" },
  { id: "c4", name: "Amanzoe" },
];

const today = new Date();
const y = today.getFullYear();
const m = today.getMonth();

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function isoDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Seed content so the module looks alive from day one
const SEED_CONTENT = [
  {
    id: "ct1", clientId: "c1", type: "reel", platform: "instagram",
    status: "live", date: isoDate(y, m, 3),
    title: "Golden Hour at Villa d'Este",
    caption: "The magic hour captured in 30 seconds. Terrace, lake, and legacy.",
    campaign: "Spring Push", assignedTo: "Yasmine",
  },
  {
    id: "ct2", clientId: "c1", type: "post", platform: "instagram",
    status: "live", date: isoDate(y, m, 6),
    title: "Grand Ballroom Detail Shot",
    caption: "Every chandelier tells a story. Enquire for 2025 availability.",
    campaign: "Spring Push", assignedTo: "Taiwo",
  },
  {
    id: "ct3", clientId: "c2", type: "blog", platform: "web",
    status: "live", date: isoDate(y, m, 8),
    title: "Why Florence is Europe's Ultimate Wedding Destination",
    caption: "Editorial SEO piece targeting high-intent couples.",
    campaign: "SEO Amplification", assignedTo: "Yasmine",
  },
  {
    id: "ct4", clientId: "c1", type: "post", platform: "instagram",
    status: "scheduled", date: isoDate(y, m, 12),
    title: "Terrace Wedding Setup",
    caption: "Long tables, olive trees, and lake Como. Your dream, our canvas.",
    campaign: "Spring Push", assignedTo: "Taiwo",
  },
  {
    id: "ct5", clientId: "c3", type: "reel", platform: "instagram",
    status: "scheduled", date: isoDate(y, m, 14),
    title: "Borgo Morning Ritual Reel",
    caption: "Behind the scenes of how the team prepares for a wedding morning.",
    campaign: "Authenticity Series", assignedTo: "Yasmine",
  },
  {
    id: "ct6", clientId: "c2", type: "venue-feature", platform: "web",
    status: "review", date: isoDate(y, m, 15),
    title: "Venue Feature: Belmond Villa San Michele",
    caption: "Full editorial spread with gallery, spaces, and enquiry flow.",
    campaign: "Venue Spotlights", assignedTo: "Taiwo",
  },
  {
    id: "ct7", clientId: "c4", type: "post", platform: "facebook",
    status: "approved", date: isoDate(y, m, 16),
    title: "Amanzoe Clifftop Ceremony",
    caption: "Saying yes with the Aegean as your witness. Enquire now.",
    campaign: "Aegean Summer", assignedTo: "Yasmine",
  },
  {
    id: "ct8", clientId: "c3", type: "newsletter", platform: "email",
    status: "draft", date: isoDate(y, m, 18),
    title: "June Edition: Puglia in Full Bloom",
    caption: "Curated inspiration for couples considering southern Italy.",
    campaign: "Monthly Newsletter", assignedTo: "Taiwo",
  },
  {
    id: "ct9", clientId: "c1", type: "fam-trip", platform: "instagram",
    status: "brief", date: isoDate(y, m, 20),
    title: "FAM Trip: Lake Como Immersion",
    caption: "3-day hosted experience for top UK and US planners.",
    campaign: "FAM Programme 2025", assignedTo: "Yasmine",
  },
  {
    id: "ct10", clientId: "c4", type: "reel", platform: "instagram",
    status: "draft", date: isoDate(y, m, 22),
    title: "Greek Sunset Ceremony BTS",
    caption: "Raw and real - the moments between the moments.",
    campaign: "Aegean Summer", assignedTo: "Taiwo",
  },
  {
    id: "ct11", clientId: "c2", type: "post", platform: "pinterest",
    status: "brief", date: isoDate(y, m, 25),
    title: "Floral Arch Inspiration: Tuscan Style",
    caption: "Pin-worthy floral editorial from the gardens of Florence.",
    campaign: "Inspiration Pins", assignedTo: "Yasmine",
  },
  {
    id: "ct12", clientId: "c3", type: "blog", platform: "web",
    status: "brief", date: isoDate(y, m, 28),
    title: "Borgo Egnazia: A Couple's Guide to Puglia",
    caption: "Long-form guide targeting 'Puglia wedding venue' keywords.",
    campaign: "SEO Amplification", assignedTo: "Taiwo",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function typeFor(key) {
  return CONTENT_TYPES.find((t) => t.key === key) || CONTENT_TYPES[0];
}

function statusFor(key) {
  return STATUSES.find((s) => s.key === key) || STATUSES[0];
}

function clientFor(id, clients) {
  return clients.find((c) => c.id === id);
}

function Badge({ label, color, small }) {
  return (
    <span style={{
      display: "inline-block",
      padding: small ? "1px 7px" : "2px 9px",
      borderRadius: 100,
      background: color + "22",
      color,
      fontSize: small ? 9 : 10,
      fontWeight: 700,
      letterSpacing: "0.04em",
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

function TypePill({ typeKey, small }) {
  const t = typeFor(typeKey);
  return <Badge label={t.label} color={t.color} small={small} />;
}

function StatusPill({ statusKey, small }) {
  const s = statusFor(statusKey);
  return <Badge label={s.label} color={s.color} small={small} />;
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

// ── Empty form ─────────────────────────────────────────────────────────────────

function emptyForm(clientId = "") {
  const dateStr = isoDate(today.getFullYear(), today.getMonth(), today.getDate());
  return {
    clientId,
    type: "post",
    platform: "instagram",
    status: "brief",
    date: dateStr,
    title: "",
    caption: "",
    campaign: "",
    assignedTo: "",
    notes: "",
  };
}

// ── New Content Modal ──────────────────────────────────────────────────────────

function ContentModal({ C, item, clients, onSave, onClose }) {
  const isEdit = !!item?.id;
  const [form, setForm] = useState(
    isEdit
      ? { ...item }
      : emptyForm(clients[0]?.id || "")
  );

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const G = C?.gold || "#8f7420";
  const canSave = form.title.trim() && form.clientId && form.date;

  const inputStyle = {
    width: "100%",
    background: C?.dark || "#111",
    border: `1px solid ${C?.border || "#333"}`,
    borderRadius: 6,
    padding: "8px 12px",
    color: C?.white || "#fff",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: C?.grey || "#888",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    marginBottom: 5,
  };

  const fieldGroup = (label, children) => (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.72)", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 24,
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: C?.card || "#1a1a1a",
        border: `1px solid ${C?.border || "#333"}`,
        borderRadius: 12,
        width: "100%", maxWidth: 680,
        maxHeight: "90vh", overflowY: "auto",
        padding: "32px 36px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C?.off || "#fff", marginBottom: 3 }}>
              {isEdit ? "Edit Content" : "New Content"}
            </div>
            <div style={{ fontSize: 12, color: C?.grey2 || "#666" }}>
              Add to the content pipeline
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: C?.grey || "#888",
            fontSize: 20, cursor: "pointer", padding: "4px 8px",
          }}>x</button>
        </div>

        {/* Two-column grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>

          {/* Title - full width */}
          <div style={{ gridColumn: "1 / -1" }}>
            {fieldGroup("Content Title *",
              <input value={form.title} onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Golden Hour at Villa d'Este" style={inputStyle} />
            )}
          </div>

          {/* Client */}
          {fieldGroup("Client *",
            <select value={form.clientId} onChange={(e) => set("clientId", e.target.value)} style={inputStyle}>
              <option value="">Select client...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}

          {/* Date */}
          {fieldGroup("Publish Date *",
            <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} style={inputStyle} />
          )}

          {/* Content type */}
          {fieldGroup("Type",
            <select value={form.type} onChange={(e) => set("type", e.target.value)} style={inputStyle}>
              {CONTENT_TYPE_GROUPS.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.types.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                </optgroup>
              ))}
            </select>
          )}

          {/* Platform */}
          {fieldGroup("Platform",
            <select value={form.platform} onChange={(e) => set("platform", e.target.value)} style={inputStyle}>
              {PLATFORMS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          )}

          {/* Status */}
          {fieldGroup("Status",
            <select value={form.status} onChange={(e) => set("status", e.target.value)} style={inputStyle}>
              {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          )}

          {/* Assigned to */}
          {fieldGroup("Assigned To",
            <input value={form.assignedTo} onChange={(e) => set("assignedTo", e.target.value)}
              placeholder="Team member name" style={inputStyle} />
          )}

          {/* Campaign - full width */}
          <div style={{ gridColumn: "1 / -1" }}>
            {fieldGroup("Campaign / Theme",
              <input value={form.campaign} onChange={(e) => set("campaign", e.target.value)}
                placeholder="e.g. Spring Push, SEO Amplification" style={inputStyle} />
            )}
          </div>

          {/* Caption - full width */}
          <div style={{ gridColumn: "1 / -1" }}>
            {fieldGroup("Caption / Brief",
              <textarea value={form.caption} onChange={(e) => set("caption", e.target.value)}
                placeholder="Caption text or content brief..." rows={3}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} />
            )}
          </div>

          {/* Notes - full width */}
          <div style={{ gridColumn: "1 / -1" }}>
            {fieldGroup("Internal Notes",
              <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
                placeholder="Asset requirements, context, dependencies..." rows={2}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C?.border || "#333"}` }}>
          <button onClick={onClose} style={{
            background: "none", border: `1px solid ${C?.border || "#333"}`,
            borderRadius: 6, padding: "9px 20px", color: C?.grey || "#888",
            fontSize: 13, cursor: "pointer",
          }}>Cancel</button>
          <button
            onClick={() => canSave && onSave(form)}
            disabled={!canSave}
            style={{
              background: canSave ? G : C?.border || "#333",
              border: "none", borderRadius: 6, padding: "9px 24px",
              color: canSave ? "#fff" : C?.grey2 || "#555",
              fontSize: 13, fontWeight: 600, cursor: canSave ? "pointer" : "not-allowed",
            }}
          >
            {isEdit ? "Save Changes" : "Add to Pipeline"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Calendar View ──────────────────────────────────────────────────────────────

function CalendarView({ C, items, onItemClick, calYear, calMonth }) {
  const numDays   = daysInMonth(calYear, calMonth);
  const firstDay  = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
  const G = C?.gold || "#8f7420";

  // Group items by date
  const byDate = useMemo(() => {
    const map = {};
    items.forEach((item) => {
      const d = item.date?.slice(0, 10);
      if (d) { if (!map[d]) map[d] = []; map[d].push(item); }
    });
    return map;
  }, [items]);

  const todayStr = isoDate(today.getFullYear(), today.getMonth(), today.getDate());

  const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div>
      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, marginBottom: 1 }}>
        {DOW.map((d) => (
          <div key={d} style={{
            textAlign: "center", padding: "8px 0",
            fontSize: 10, fontWeight: 700, color: C?.grey2 || "#666",
            letterSpacing: "0.06em", textTransform: "uppercase",
          }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
        {/* Empty cells before first day */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`e${i}`} style={{ minHeight: 90, background: C?.dark || "#111", borderRadius: 4, opacity: 0.3 }} />
        ))}

        {/* Day cells */}
        {Array.from({ length: numDays }).map((_, idx) => {
          const day = idx + 1;
          const dateStr = isoDate(calYear, calMonth, day);
          const dayItems = byDate[dateStr] || [];
          const isToday = dateStr === todayStr;

          return (
            <div key={day} style={{
              minHeight: 90,
              background: C?.dark || "#111",
              borderRadius: 4,
              padding: "8px 6px",
              border: isToday ? `1px solid ${G}55` : `1px solid ${C?.border || "#333"}22`,
              position: "relative",
            }}>
              <div style={{
                fontSize: 11, fontWeight: isToday ? 700 : 400,
                color: isToday ? G : C?.grey2 || "#666",
                marginBottom: 5,
              }}>{day}</div>

              {dayItems.slice(0, 3).map((item) => {
                const t = typeFor(item.type);
                return (
                  <div key={item.id}
                    onClick={() => onItemClick(item)}
                    title={item.title}
                    style={{
                      background: t.color + "22",
                      borderLeft: `2px solid ${t.color}`,
                      borderRadius: "0 3px 3px 0",
                      padding: "2px 5px",
                      fontSize: 10, color: t.color, fontWeight: 600,
                      marginBottom: 2, cursor: "pointer",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      maxWidth: "100%",
                    }}>
                    {item.title}
                  </div>
                );
              })}

              {dayItems.length > 3 && (
                <div style={{ fontSize: 9, color: C?.grey2 || "#666", marginTop: 2 }}>
                  +{dayItems.length - 3} more
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Queue View ─────────────────────────────────────────────────────────────────

function QueueView({ C, items, clients, onItemClick, onStatusChange }) {
  const G = C?.gold || "#8f7420";

  // Group by status
  const byStatus = useMemo(() => {
    const map = {};
    STATUS_PIPELINE.forEach((s) => { map[s] = []; });
    items.forEach((item) => {
      if (map[item.status]) map[item.status].push(item);
      else map["brief"].push(item);
    });
    return map;
  }, [items]);

  // Which statuses to show (non-empty + first 4 always visible)
  const visibleStatuses = STATUS_PIPELINE.filter(
    (s, i) => i < 4 || byStatus[s].length > 0
  );

  return (
    <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
      {visibleStatuses.map((statusKey) => {
        const s = statusFor(statusKey);
        const colItems = byStatus[statusKey] || [];
        return (
          <div key={statusKey} style={{
            minWidth: 230, maxWidth: 260, flex: "0 0 230px",
            background: C?.dark || "#111",
            border: `1px solid ${C?.border || "#333"}`,
            borderRadius: 10,
            padding: "14px 14px 10px",
          }}>
            {/* Column header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: C?.white || "#fff" }}>{s.label}</span>
              </div>
              <span style={{ fontSize: 11, color: C?.grey2 || "#666", fontWeight: 600 }}>{colItems.length}</span>
            </div>

            {/* Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {colItems.length === 0 && (
                <div style={{
                  border: `1px dashed ${C?.border || "#333"}`,
                  borderRadius: 7, padding: "16px 10px",
                  textAlign: "center", fontSize: 11, color: C?.grey2 || "#666",
                }}>No items</div>
              )}

              {colItems.map((item) => {
                const t = typeFor(item.type);
                const client = clientFor(item.clientId, clients);
                const platform = PLATFORMS.find((p) => p.key === item.platform);
                return (
                  <div key={item.id}
                    onClick={() => onItemClick(item)}
                    style={{
                      background: C?.card || "#1a1a1a",
                      border: `1px solid ${C?.border || "#333"}`,
                      borderRadius: 8, padding: "12px",
                      cursor: "pointer",
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = G + "66"}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = C?.border || "#333"}
                  >
                    {/* Type + Platform */}
                    <div style={{ display: "flex", gap: 5, marginBottom: 8, flexWrap: "wrap" }}>
                      <TypePill typeKey={item.type} small />
                      {platform && (
                        <span style={{
                          fontSize: 9, color: C?.grey2 || "#666", fontWeight: 600,
                          background: C?.dark || "#111", padding: "1px 6px", borderRadius: 100,
                          letterSpacing: "0.04em",
                        }}>{platform.label}</span>
                      )}
                    </div>

                    {/* Title */}
                    <div style={{
                      fontSize: 12, fontWeight: 600, color: C?.off || "#fff",
                      lineHeight: 1.35, marginBottom: 6,
                    }}>{item.title}</div>

                    {/* Client name */}
                    {client && (
                      <div style={{ fontSize: 10, color: C?.grey || "#888", marginBottom: 6 }}>
                        {client.name}
                      </div>
                    )}

                    {/* Date + assigned */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                      <span style={{ fontSize: 10, color: C?.grey2 || "#666" }}>
                        {item.date ? new Date(item.date + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "No date"}
                      </span>
                      {item.assignedTo && (
                        <span style={{
                          width: 22, height: 22, borderRadius: "50%",
                          background: G + "33", color: G,
                          fontSize: 9, fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }} title={item.assignedTo}>
                          {getInitials(item.assignedTo)}
                        </span>
                      )}
                    </div>

                    {/* Advance status button */}
                    {(() => {
                      const idx = STATUS_PIPELINE.indexOf(item.status);
                      const nextKey = STATUS_PIPELINE[idx + 1];
                      if (!nextKey) return null;
                      const next = statusFor(nextKey);
                      return (
                        <button
                          onClick={(e) => { e.stopPropagation(); onStatusChange(item.id, nextKey); }}
                          style={{
                            marginTop: 10, width: "100%",
                            background: "none",
                            border: `1px solid ${next.color}44`,
                            borderRadius: 5,
                            padding: "5px 0",
                            color: next.color, fontSize: 10, fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Move to {next.label} →
                        </button>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Campaigns View ─────────────────────────────────────────────────────────────

function CampaignsView({ C, items, clients }) {
  const G = C?.gold || "#8f7420";

  // Group items by campaign
  const byCampaign = useMemo(() => {
    const map = {};
    items.forEach((item) => {
      const key = item.campaign || "Uncategorised";
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return map;
  }, [items]);

  const campaigns = Object.keys(byCampaign).sort();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {campaigns.map((campaign) => {
        const campaignItems = byCampaign[campaign];
        const liveCount      = campaignItems.filter((i) => i.status === "live").length;
        const scheduledCount = campaignItems.filter((i) => i.status === "scheduled").length;
        const draftCount     = campaignItems.filter((i) => ["brief","draft","review","approved"].includes(i.status)).length;
        const clientIds = [...new Set(campaignItems.map((i) => i.clientId))];

        return (
          <div key={campaign} style={{
            background: C?.dark || "#111",
            border: `1px solid ${C?.border || "#333"}`,
            borderRadius: 10,
            overflow: "hidden",
          }}>
            {/* Campaign header */}
            <div style={{
              padding: "16px 20px",
              borderBottom: `1px solid ${C?.border || "#333"}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C?.off || "#fff", marginBottom: 4 }}>
                  {campaign}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {clientIds.map((cid) => {
                    const cl = clientFor(cid, clients);
                    return cl ? (
                      <span key={cid} style={{ fontSize: 10, color: C?.grey || "#888", background: C?.card || "#1a1a1a", padding: "2px 8px", borderRadius: 100 }}>
                        {cl.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {liveCount > 0 && <Badge label={`${liveCount} Live`} color="#22c55e" />}
                {scheduledCount > 0 && <Badge label={`${scheduledCount} Scheduled`} color="#8b5cf6" />}
                {draftCount > 0 && <Badge label={`${draftCount} In Progress`} color="#f59e0b" />}
                <span style={{ fontSize: 12, color: C?.grey2 || "#666" }}>{campaignItems.length} items</span>
              </div>
            </div>

            {/* Item rows */}
            <div>
              {campaignItems.map((item, i) => {
                const t = typeFor(item.type);
                const platform = PLATFORMS.find((p) => p.key === item.platform);
                return (
                  <div key={item.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 20px",
                    borderBottom: i < campaignItems.length - 1 ? `1px solid ${C?.border || "#333"}22` : "none",
                  }}>
                    {/* Type dot */}
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, flexShrink: 0 }} />

                    {/* Title */}
                    <div style={{ flex: 1, fontSize: 12, color: C?.white || "#fff", fontWeight: 500, minWidth: 0 }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                        {item.title}
                      </span>
                    </div>

                    {/* Badges */}
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                      <TypePill typeKey={item.type} small />
                      <StatusPill statusKey={item.status} small />
                    </div>

                    {/* Platform */}
                    {platform && (
                      <span style={{ fontSize: 10, color: C?.grey2 || "#666", width: 70, flexShrink: 0, textAlign: "right" }}>
                        {platform.label}
                      </span>
                    )}

                    {/* Date */}
                    <span style={{ fontSize: 10, color: C?.grey2 || "#666", width: 60, flexShrink: 0, textAlign: "right" }}>
                      {item.date ? new Date(item.date + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "-"}
                    </span>

                    {/* Assigned */}
                    {item.assignedTo && (
                      <span style={{
                        width: 22, height: 22, borderRadius: "50%",
                        background: G + "33", color: G,
                        fontSize: 9, fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }} title={item.assignedTo}>
                        {getInitials(item.assignedTo)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Detail Drawer ──────────────────────────────────────────────────────────────

function DetailDrawer({ C, item, clients, onEdit, onDelete, onClose }) {
  if (!item) return null;
  const G = C?.gold || "#8f7420";
  const t = typeFor(item.type);
  const s = statusFor(item.status);
  const client = clientFor(item.clientId, clients);
  const platform = PLATFORMS.find((p) => p.key === item.platform);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 900,
      display: "flex", justifyContent: "flex-end",
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      {/* Overlay */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} onClick={onClose} />

      {/* Drawer */}
      <div style={{
        position: "relative", zIndex: 1,
        width: 380, height: "100%",
        background: C?.card || "#1a1a1a",
        borderLeft: `1px solid ${C?.border || "#333"}`,
        padding: "28px 28px",
        overflowY: "auto",
        boxShadow: "-12px 0 48px rgba(0,0,0,0.4)",
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: "absolute", top: 20, right: 20,
          background: "none", border: "none", color: C?.grey || "#888",
          fontSize: 18, cursor: "pointer",
        }}>x</button>

        {/* Type + status */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, marginTop: 4 }}>
          <TypePill typeKey={item.type} />
          <StatusPill statusKey={item.status} />
        </div>

        {/* Title */}
        <div style={{ fontSize: 18, fontWeight: 700, color: C?.off || "#fff", lineHeight: 1.3, marginBottom: 8 }}>
          {item.title}
        </div>

        {/* Client */}
        {client && (
          <div style={{ fontSize: 13, color: G, marginBottom: 20, fontWeight: 500 }}>{client.name}</div>
        )}

        {/* Meta grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24, padding: "16px", background: C?.dark || "#111", borderRadius: 8 }}>
          {[
            { label: "Platform", value: platform?.label || "-" },
            { label: "Date", value: item.date ? new Date(item.date + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "-" },
            { label: "Campaign", value: item.campaign || "None" },
            { label: "Assigned", value: item.assignedTo || "Unassigned" },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C?.grey2 || "#666", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 12, color: C?.white || "#fff", fontWeight: 500 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Caption */}
        {item.caption && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C?.grey2 || "#666", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>Caption / Brief</div>
            <div style={{ fontSize: 13, color: C?.grey || "#888", lineHeight: 1.6, borderLeft: `2px solid ${G}55`, paddingLeft: 12 }}>
              {item.caption}
            </div>
          </div>
        )}

        {/* Notes */}
        {item.notes && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C?.grey2 || "#666", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>Internal Notes</div>
            <div style={{ fontSize: 12, color: C?.grey || "#888", lineHeight: 1.6 }}>{item.notes}</div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 32 }}>
          <button onClick={() => onEdit(item)} style={{
            background: G, border: "none", borderRadius: 7,
            padding: "10px 0", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>Edit Content</button>
          <button onClick={() => { onDelete(item.id); onClose(); }} style={{
            background: "none", border: `1px solid ${C?.rose || "#be123c"}44`,
            borderRadius: 7, padding: "9px 0", color: C?.rose || "#be123c",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>Remove</button>
        </div>
      </div>
    </div>
  );
}

// ── Stats Bar ──────────────────────────────────────────────────────────────────

function StatsBar({ C, items }) {
  const total     = items.length;
  const live      = items.filter((i) => i.status === "live").length;
  const scheduled = items.filter((i) => i.status === "scheduled").length;
  const inProgress = items.filter((i) => ["brief","draft","review","approved"].includes(i.status)).length;
  const reels     = items.filter((i) => i.type === "reel").length;
  const G = C?.gold || "#8f7420";

  const stats = [
    { label: "Total Items",  value: total,      color: C?.grey || "#888" },
    { label: "Live",         value: live,        color: "#22c55e" },
    { label: "Scheduled",    value: scheduled,   color: "#8b5cf6" },
    { label: "In Progress",  value: inProgress,  color: "#f59e0b" },
    { label: "Reels",        value: reels,       color: "#ec4899" },
  ];

  return (
    <div style={{ display: "flex", gap: 1, marginBottom: 24 }}>
      {stats.map((s) => (
        <div key={s.label} style={{
          flex: 1, background: C?.dark || "#111",
          padding: "14px 16px",
          borderRadius: 0,
          borderRight: `1px solid ${C?.border || "#333"}22`,
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
          <div style={{ fontSize: 10, color: C?.grey2 || "#666", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Main Module ────────────────────────────────────────────────────────────────

export default function SocialStudioModule({ C }) {
  const G = C?.gold || "#8f7420";

  // State
  const [items,       setItems]        = useState(SEED_CONTENT);
  const [clients]                      = useState(MOCK_CLIENTS);
  const [view,        setView]         = useState("calendar"); // calendar | queue | campaigns
  const [clientFilter, setClientFilter] = useState("all");
  const [typeFilter,  setTypeFilter]   = useState("all");
  const [calYear,     setCalYear]      = useState(today.getFullYear());
  const [calMonth,    setCalMonth]     = useState(today.getMonth());
  const [showModal,   setShowModal]    = useState(false);
  const [editItem,    setEditItem]     = useState(null);
  const [drawerItem,  setDrawerItem]   = useState(null);

  // Filtered items
  const filtered = useMemo(() => {
    let list = items;
    if (clientFilter !== "all") list = list.filter((i) => i.clientId === clientFilter);
    if (typeFilter   !== "all") list = list.filter((i) => i.type === typeFilter);
    // For calendar: filter to current month
    if (view === "calendar") {
      const prefix = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
      list = list.filter((i) => i.date?.startsWith(prefix));
    }
    return list;
  }, [items, clientFilter, typeFilter, view, calYear, calMonth]);

  function handleSave(form) {
    if (form.id) {
      setItems((prev) => prev.map((i) => i.id === form.id ? { ...i, ...form } : i));
    } else {
      const newItem = { ...form, id: `ct${Date.now()}` };
      setItems((prev) => [newItem, ...prev]);
    }
    setShowModal(false);
    setEditItem(null);
  }

  function handleStatusChange(id, newStatus) {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: newStatus } : i));
    if (drawerItem?.id === id) setDrawerItem((d) => ({ ...d, status: newStatus }));
  }

  function handleDelete(id) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function handleItemClick(item) {
    setDrawerItem(item);
  }

  function openEditModal(item) {
    setEditItem(item);
    setDrawerItem(null);
    setShowModal(true);
  }

  function prevMonth() {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
  }

  const tabBtn = (key, label, icon) => (
    <button key={key} onClick={() => setView(key)} style={{
      background: view === key ? G + "22" : "none",
      border: "none",
      borderBottom: `2px solid ${view === key ? G : "transparent"}`,
      color: view === key ? G : C?.grey || "#888",
      fontSize: 13, fontWeight: 600, cursor: "pointer",
      padding: "10px 18px", display: "flex", alignItems: "center", gap: 6,
    }}>
      <span style={{ fontSize: 12 }}>{icon}</span> {label}
    </button>
  );

  return (
    <div style={{ background: C?.black || "#0a0a0a", minHeight: "100vh", color: C?.white || "#fff" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: C?.off || "#fff", margin: 0, marginBottom: 4 }}>
              Social Studio
            </h1>
            <p style={{ fontSize: 13, color: C?.grey || "#888", margin: 0 }}>
              Content pipeline for managed clients. Plan, create, schedule, and track.
            </p>
          </div>
          <button
            onClick={() => { setEditItem(null); setShowModal(true); }}
            style={{
              background: G, border: "none", borderRadius: 8,
              padding: "10px 20px", color: "#fff", fontSize: 13,
              fontWeight: 600, cursor: "pointer", flexShrink: 0,
            }}
          >
            + New Content
          </button>
        </div>

        {/* Stats bar */}
        <StatsBar C={C} items={items.filter((i) => clientFilter === "all" || i.clientId === clientFilter)} />

        {/* Filters row */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 4 }}>
          {/* Client filter */}
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            style={{
              background: C?.dark || "#111",
              border: `1px solid ${C?.border || "#333"}`,
              borderRadius: 7, padding: "7px 12px",
              color: C?.white || "#fff", fontSize: 12, cursor: "pointer", outline: "none",
            }}
          >
            <option value="all">All Clients</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              background: C?.dark || "#111",
              border: `1px solid ${C?.border || "#333"}`,
              borderRadius: 7, padding: "7px 12px",
              color: C?.white || "#fff", fontSize: 12, cursor: "pointer", outline: "none",
            }}
          >
            <option value="all">All Types</option>
            {CONTENT_TYPE_GROUPS.map((g) => (
              <optgroup key={g.group} label={g.group}>
                {g.types.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </optgroup>
            ))}
          </select>

          {/* Calendar month nav (only in calendar view) */}
          {view === "calendar" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
              <button onClick={prevMonth} style={{
                background: C?.dark || "#111", border: `1px solid ${C?.border || "#333"}`,
                borderRadius: 6, padding: "6px 10px", color: C?.white || "#fff",
                fontSize: 12, cursor: "pointer",
              }}>{"<"}</button>
              <span style={{ fontSize: 13, fontWeight: 600, color: C?.off || "#fff", minWidth: 130, textAlign: "center" }}>
                {MONTH_NAMES[calMonth]} {calYear}
              </span>
              <button onClick={nextMonth} style={{
                background: C?.dark || "#111", border: `1px solid ${C?.border || "#333"}`,
                borderRadius: 6, padding: "6px 10px", color: C?.white || "#fff",
                fontSize: 12, cursor: "pointer",
              }}>{">"}</button>
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: `1px solid ${C?.border || "#333"}`, marginTop: 8 }}>
          {tabBtn("calendar",  "Calendar",  "◫")}
          {tabBtn("queue",     "Pipeline",  "◆")}
          {tabBtn("campaigns", "Campaigns", "✦")}
        </div>
      </div>

      {/* View content */}
      {view === "calendar" && (
        <CalendarView
          C={C} items={filtered} onItemClick={handleItemClick}
          calYear={calYear} calMonth={calMonth}
        />
      )}

      {view === "queue" && (
        <QueueView
          C={C} items={filtered} clients={clients}
          onItemClick={handleItemClick}
          onStatusChange={handleStatusChange}
        />
      )}

      {view === "campaigns" && (
        <CampaignsView
          C={C}
          items={clientFilter === "all" && typeFilter === "all" ? items : filtered}
          clients={clients}
        />
      )}

      {/* New / Edit modal */}
      {showModal && (
        <ContentModal
          C={C}
          item={editItem}
          clients={clients}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditItem(null); }}
        />
      )}

      {/* Detail drawer */}
      {drawerItem && (
        <DetailDrawer
          C={C}
          item={drawerItem}
          clients={clients}
          onEdit={openEditModal}
          onDelete={handleDelete}
          onClose={() => setDrawerItem(null)}
        />
      )}
    </div>
  );
}
