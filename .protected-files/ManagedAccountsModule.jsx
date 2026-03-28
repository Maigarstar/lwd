// ManagedAccountsModule.jsx
// Managed Accounts: the active service client layer.
// Created when a CRM deal is won. Separate from the CRM pipeline (leads)
// and the Vendor Accounts access layer (vendors).
// Hub for content delivery, campaigns, and activity per client.
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  fetchManagedAccounts,
  createManagedAccount,
  updateManagedAccount,
  fetchClientContentSummary,
  fetchAllContentSummaries,
  fetchPortalConfig,
  updatePortalConfig,
  buildDefaultPortalConfig,
} from "../../services/socialStudioService";

const PLAN_OPTIONS = [
  { key: "signature",  label: "Signature",  color: "#c9a84c" },
  { key: "growth",     label: "Growth",     color: "#8b5cf6" },
  { key: "essentials", label: "Essentials", color: "#3b82f6" },
  { key: "custom",     label: "Custom",     color: "#6b7280" },
];

const STATUS_OPTIONS = [
  { key: "active",  label: "Active",  color: "#22c55e" },
  { key: "paused",  label: "Paused",  color: "#f59e0b" },
  { key: "churned", label: "Churned", color: "#ef4444" },
];

const SERVICE_STATUS_OPTIONS = [
  { key: "onboarding", label: "Onboarding", color: "#3b82f6" },
  { key: "active",     label: "Active",     color: "#22c55e" },
  { key: "paused",     label: "Paused",     color: "#f59e0b" },
  { key: "at-risk",    label: "At Risk",    color: "#f97316" },
  { key: "churned",    label: "Churned",    color: "#ef4444" },
];

const ONBOARDING_STATUS_OPTIONS = [
  { key: "pending",     label: "Pending" },
  { key: "in-progress", label: "In Progress" },
  { key: "complete",    label: "Complete" },
];

const COMPANY_TYPE_OPTIONS = [
  { key: "venue",    label: "Venue" },
  { key: "hotel",    label: "Hotel" },
  { key: "planner",  label: "Planner" },
  { key: "agency",   label: "Agency" },
  { key: "other",    label: "Other" },
];

function planFor(key) {
  return PLAN_OPTIONS.find(p => p.key === key) || { label: key || "No plan", color: "#6b7280" };
}
function statusFor(key) {
  return STATUS_OPTIONS.find(s => s.key === key) || STATUS_OPTIONS[0];
}
function serviceStatusFor(key) {
  return SERVICE_STATUS_OPTIONS.find(s => s.key === key) || SERVICE_STATUS_OPTIONS[0];
}
function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}
function fmtDate(d) {
  if (!d) return null;
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr + "T00:00:00") - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Compute health signals for an account + its content summary.
// Returns array of { label, color, bg } signal objects.
function getHealthSignals(account, summary) {
  const signals = [];
  if (account.serviceStatus === "at-risk") {
    signals.push({ label: "At Risk", color: "#f97316", bg: "rgba(249,115,22,0.12)" });
  }
  if (account.onboardingStatus === "in-progress") {
    signals.push({ label: "Onboarding", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" });
  }
  const renewDays = daysUntil(account.renewalDate);
  if (renewDays !== null && renewDays <= 30 && renewDays >= 0) {
    signals.push({ label: `Renews in ${renewDays}d`, color: "#f59e0b", bg: "rgba(245,158,11,0.12)" });
  }
  const contractDays = daysUntil(account.contractEnd);
  if (contractDays !== null && contractDays <= 14 && contractDays >= 0) {
    signals.push({ label: `Contract ends ${contractDays}d`, color: "#ef4444", bg: "rgba(239,68,68,0.12)" });
  }
  if (summary && account.serviceStatus === "active" && account.status === "active") {
    if (summary.scheduled === 0 && summary.draft === 0 && summary.totalItems === 0) {
      signals.push({ label: "No content", color: "#6b7280", bg: "rgba(107,114,128,0.12)" });
    } else if (summary.scheduled === 0 && summary.liveThisMonth === 0) {
      signals.push({ label: "Stalled", color: "#f97316", bg: "rgba(249,115,22,0.12)" });
    }
  }
  return signals;
}

// Account Modal (Add / Edit)

function AccountModal({ C, account, onSave, onClose }) {
  const isEdit = !!account?.id;
  const [form, setForm] = useState(account ? { ...account } : {
    name: "", slug: "",
    logoUrl: "", heroImageUrl: "",
    primaryContactName: "", primaryContactEmail: "", contactPhone: "",
    companyType: "", plan: "growth",
    serviceStatus: "onboarding", status: "active", onboardingStatus: "pending",
    contractStart: "", contractEnd: "", renewalDate: "",
    accountManager: "", internalNotes: "",
  });
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState(null);
  const G = C?.gold || "#8f7420";
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const canSave = form.name?.trim() && !saving;

  async function handleSubmit() {
    if (!canSave) return;
    setSaving(true);
    setSaveError(null);
    const result = await onSave(form);
    if (result?.ok) {
      onClose(); // only close on confirmed DB success
    } else {
      setSaving(false);
      setSaveError(result?.message || 'Save failed — account was not stored in the database');
    }
  }

  const autoSlug = (v) => {
    set("name", v);
    if (!isEdit) set("slug", v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
  };

  const inp = {
    width: "100%", background: C?.dark || "#111",
    border: `1px solid ${C?.border || "#333"}`,
    borderRadius: 6, padding: "8px 12px", color: C?.white || "#fff",
    fontSize: 13, outline: "none", boxSizing: "border-box",
  };
  const lbl = {
    display: "block", fontSize: 11, fontWeight: 600,
    color: C?.grey || "#888", letterSpacing: "0.05em",
    textTransform: "uppercase", marginBottom: 5,
  };
  const field = (label, children) => (
    <div style={{ marginBottom: 16 }}>
      <label style={lbl}>{label}</label>
      {children}
    </div>
  );
  const sectionHead = (label) => (
    <div style={{
      gridColumn: "1 / -1",
      fontSize: 10, fontWeight: 700, color: C?.grey || "#888",
      letterSpacing: "0.08em", textTransform: "uppercase",
      paddingBottom: 6, borderBottom: `1px solid ${C?.border || "#333"}`,
      marginBottom: 4, marginTop: 8,
    }}>
      {label}
    </div>
  );

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.72)", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 24,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: C?.card || "#1a1a1a",
        border: `1px solid ${C?.border || "#333"}`,
        borderRadius: 12, width: "100%", maxWidth: 680,
        maxHeight: "90vh", overflowY: "auto",
        padding: "32px 36px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C?.off || "#fff", marginBottom: 3 }}>
              {isEdit ? "Edit Managed Account" : "New Managed Account"}
            </div>
            <div style={{ fontSize: 12, color: C?.grey2 || "#666" }}>Active service client profile</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C?.grey || "#888", fontSize: 20, cursor: "pointer" }}>x</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
          {sectionHead("Account")}
          <div style={{ gridColumn: "1 / -1" }}>
            {field("Account Name *",
              <input value={form.name} onChange={e => autoSlug(e.target.value)} placeholder="e.g. Villa d'Este" style={inp} />
            )}
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            {field("Slug",
              <input value={form.slug} onChange={e => set("slug", e.target.value)} placeholder="villa-deste" style={inp} />
            )}
          </div>
          {field("Hero Image URL",
            <input value={form.heroImageUrl || ""} onChange={e => set("heroImageUrl", e.target.value)} placeholder="https://... (shown in client portal)" style={inp} />
          )}
          {field("Logo URL",
            <input value={form.logoUrl || ""} onChange={e => set("logoUrl", e.target.value)} placeholder="https://..." style={inp} />
          )}
          {field("Company Type",
            <select value={form.companyType} onChange={e => set("companyType", e.target.value)} style={inp}>
              <option value="">Select type</option>
              {COMPANY_TYPE_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          )}
          {field("Service Plan",
            <select value={form.plan} onChange={e => set("plan", e.target.value)} style={inp}>
              <option value="">No plan assigned</option>
              {PLAN_OPTIONS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          )}

          {sectionHead("Primary Contact")}
          {field("Contact Name",
            <input value={form.primaryContactName} onChange={e => set("primaryContactName", e.target.value)} placeholder="Primary contact" style={inp} />
          )}
          {field("Contact Email",
            <input type="email" value={form.primaryContactEmail} onChange={e => set("primaryContactEmail", e.target.value)} placeholder="contact@venue.com" style={inp} />
          )}
          {field("Contact Phone",
            <input value={form.contactPhone} onChange={e => set("contactPhone", e.target.value)} placeholder="+44..." style={inp} />
          )}

          {sectionHead("Status")}
          {field("Account Status",
            <select value={form.status} onChange={e => set("status", e.target.value)} style={inp}>
              {STATUS_OPTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          )}
          {field("Service Status",
            <select value={form.serviceStatus} onChange={e => set("serviceStatus", e.target.value)} style={inp}>
              {SERVICE_STATUS_OPTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          )}
          {field("Onboarding Status",
            <select value={form.onboardingStatus} onChange={e => set("onboardingStatus", e.target.value)} style={inp}>
              {ONBOARDING_STATUS_OPTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          )}
          {field("Account Manager",
            <input value={form.accountManager} onChange={e => set("accountManager", e.target.value)} placeholder="Internal team member" style={inp} />
          )}

          {sectionHead("Contract")}
          {field("Contract Start",
            <input type="date" value={form.contractStart || ""} onChange={e => set("contractStart", e.target.value)} style={inp} />
          )}
          {field("Contract End",
            <input type="date" value={form.contractEnd || ""} onChange={e => set("contractEnd", e.target.value)} style={inp} />
          )}
          {field("Renewal Date",
            <input type="date" value={form.renewalDate || ""} onChange={e => set("renewalDate", e.target.value)} style={inp} />
          )}

          {sectionHead("Notes")}
          <div style={{ gridColumn: "1 / -1" }}>
            {field("Internal Notes",
              <textarea value={form.internalNotes} onChange={e => set("internalNotes", e.target.value)}
                placeholder="Account context, requirements, history..." rows={3}
                style={{ ...inp, resize: "vertical", lineHeight: 1.5 }} />
            )}
          </div>
        </div>

        {/* Error banner — shown inside modal so user sees it without the modal disappearing */}
        {saveError && (
          <div style={{
            marginTop: 16, padding: "10px 14px",
            background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.35)",
            borderRadius: 6, color: "#fca5a5", fontSize: 12, lineHeight: 1.5,
            display: "flex", alignItems: "flex-start", gap: 8,
          }}>
            <span style={{ flexShrink: 0, marginTop: 1 }}>✕</span>
            <span>{saveError}</span>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20, paddingTop: 20, borderTop: `1px solid ${C?.border || "#333"}` }}>
          <button onClick={onClose} disabled={saving} style={{
            background: "none", border: `1px solid ${C?.border || "#333"}`,
            borderRadius: 6, padding: "9px 20px", color: C?.grey || "#888",
            fontSize: 13, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.5 : 1,
          }}>Cancel</button>
          <button onClick={handleSubmit} disabled={!canSave} style={{
            background: canSave ? G : C?.border || "#333",
            border: "none", borderRadius: 6, padding: "9px 24px",
            color: canSave ? "#fff" : C?.grey2 || "#555",
            fontSize: 13, fontWeight: 600, cursor: canSave ? "pointer" : "not-allowed",
            minWidth: 120, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            {saving ? (
              <>
                <span style={{
                  width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff", borderRadius: "50%",
                  display: "inline-block", animation: "spin 0.7s linear infinite",
                }} />
                Saving…
              </>
            ) : (
              isEdit ? "Save Changes" : "Create Account"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Content Summary Widget

function ContentSummary({ C, accountId }) {
  const [summary, setSummary] = useState(null);
  const G = C?.gold || "#8f7420";

  useEffect(() => {
    fetchClientContentSummary(accountId).then(setSummary);
  }, [accountId]);

  if (!summary) return (
    <div style={{ fontSize: 12, color: C?.grey || "#888", padding: "8px 0" }}>Loading...</div>
  );

  const stats = [
    { label: "Scheduled",      value: summary.scheduled,     color: "#8b5cf6" },
    { label: "In Draft",       value: summary.draft,         color: "#3b82f6" },
    { label: "Live This Month",value: summary.liveThisMonth, color: "#22c55e" },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 1, marginBottom: 12 }}>
        {stats.map(s => (
          <div key={s.label} style={{
            flex: 1, background: C?.dark || "#111",
            padding: "12px 14px",
            borderRight: `1px solid ${(C?.border || "#333") + "44"}`,
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: 3 }}>{s.value}</div>
            <div style={{ fontSize: 9, color: C?.grey2 || "#666", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{s.label}</div>
          </div>
        ))}
      </div>
      {(summary.activeCampaign || summary.lastPublished) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {summary.activeCampaign && (
            <div style={{ fontSize: 12, color: C?.grey || "#888" }}>
              <span style={{ color: G, fontWeight: 600 }}>Active campaign: </span>
              {summary.activeCampaign}
            </div>
          )}
          {summary.lastPublished && (
            <div style={{ fontSize: 12, color: C?.grey || "#888" }}>
              <span style={{ fontWeight: 600 }}>Last published: </span>
              {fmtDate(summary.lastPublished)}
            </div>
          )}
        </div>
      )}
      {!summary.activeCampaign && !summary.lastPublished && summary.scheduled === 0 && summary.draft === 0 && summary.liveThisMonth === 0 && (
        <div style={{ fontSize: 12, color: C?.grey2 || "#555", fontStyle: "italic" }}>No content in pipeline yet.</div>
      )}
    </div>
  );
}

// Portal Config Editor
// Admin can toggle which menu items are visible in the client portal,
// rename labels, and reorder items via drag-and-drop.

function PortalConfigEditor({ C, account }) {
  const G = C?.gold || "#8f7420";
  const [config, setConfig]   = useState(null);
  const [saving, setSaving]   = useState(false);
  const [saved,  setSaved]    = useState(false);
  const dragIndex             = useRef(null);

  useEffect(() => {
    fetchPortalConfig(account.id, account.plan || 'essentials').then(cfg => {
      setConfig(cfg);
    });
  }, [account.id, account.plan]);

  if (!config) return (
    <div style={{ fontSize: 12, color: C?.grey || "#888", padding: "8px 0" }}>Loading...</div>
  );

  const menu = [...config.menu].sort((a, b) => a.order - b.order);

  function setMenu(newMenu) {
    setConfig(c => ({ ...c, menu: newMenu.map((m, i) => ({ ...m, order: i })) }));
    setSaved(false);
  }

  function toggleItem(key) {
    setMenu(menu.map(m => m.key === key ? { ...m, enabled: !m.enabled } : m));
  }

  function renameItem(key, label) {
    setMenu(menu.map(m => m.key === key ? { ...m, label } : m));
  }

  function setManager(field, val) {
    setConfig(c => ({ ...c, accountManager: { ...c.accountManager, [field]: val } }));
    setSaved(false);
  }

  // Drag-and-drop handlers
  function onDragStart(i) {
    dragIndex.current = i;
  }

  function onDragOver(e, i) {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === i) return;
    const reordered = [...menu];
    const [moved] = reordered.splice(dragIndex.current, 1);
    reordered.splice(i, 0, moved);
    dragIndex.current = i;
    setMenu(reordered);
  }

  function onDragEnd() {
    dragIndex.current = null;
  }

  async function save() {
    setSaving(true);
    await updatePortalConfig(account.id, config);
    setSaving(false);
    setSaved(true);
  }

  async function resetToDefaults() {
    const fresh = buildDefaultPortalConfig(account.plan || "essentials");
    setConfig(fresh);
    setSaved(false);
  }

  const inp = {
    background: C?.dark || "#111",
    border: `1px solid ${C?.border || "#333"}`,
    borderRadius: 4, padding: "4px 8px",
    color: C?.white || "#fff", fontSize: 11,
    outline: "none", width: "100%", boxSizing: "border-box",
  };

  return (
    <div>
      {/* Menu items */}
      <div style={{ marginBottom: 16 }}>
        {menu.map((item, i) => (
          <div
            key={item.key}
            draggable
            onDragStart={() => onDragStart(i)}
            onDragOver={e => onDragOver(e, i)}
            onDragEnd={onDragEnd}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "7px 0",
              borderBottom: `1px solid ${(C?.border || "#333") + "55"}`,
              cursor: "grab",
              opacity: item.enabled ? 1 : 0.45,
            }}
          >
            {/* Drag handle */}
            <span style={{ color: C?.grey2 || "#555", fontSize: 11, cursor: "grab", userSelect: "none", flexShrink: 0 }}>
              ≡
            </span>

            {/* Toggle */}
            <button
              onClick={() => toggleItem(item.key)}
              style={{
                width: 28, height: 16, borderRadius: 8, flexShrink: 0, cursor: "pointer",
                border: "none", position: "relative",
                background: item.enabled ? G : (C?.border || "#333"),
                transition: "background 0.15s",
              }}
            >
              <span style={{
                position: "absolute", top: 2,
                left: item.enabled ? 14 : 2,
                width: 12, height: 12, borderRadius: "50%",
                background: "#fff", transition: "left 0.15s",
              }} />
            </button>

            {/* Icon */}
            <span style={{ fontSize: 11, color: C?.grey || "#888", flexShrink: 0, width: 14 }}>
              {item.icon}
            </span>

            {/* Editable label */}
            <input
              value={item.label}
              onChange={e => renameItem(item.key, e.target.value)}
              style={{ ...inp, flex: 1 }}
            />
          </div>
        ))}
      </div>

      {/* Account manager strip */}
      <div style={{
        fontSize: 10, fontWeight: 700, color: C?.grey || "#888",
        letterSpacing: "0.08em", textTransform: "uppercase",
        marginBottom: 8, paddingBottom: 5,
        borderBottom: `1px solid ${C?.border || "#333"}`,
      }}>
        Account Manager (shown in portal)
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[
          ["name",  "Name"],
          ["title", "Title"],
          ["email", "Email"],
          ["photo", "Photo URL"],
        ].map(([field, label]) => (
          <div key={field}>
            <div style={{ fontSize: 9, color: C?.grey2 || "#555", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
            <input
              value={config.accountManager?.[field] || ""}
              onChange={e => setManager(field, e.target.value)}
              style={inp}
            />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={save} disabled={saving} style={{
          background: saving ? (C?.border || "#333") : G,
          border: "none", borderRadius: 6,
          padding: "7px 16px", color: "#fff",
          fontSize: 11, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
          flex: 1,
        }}>
          {saving ? "Saving..." : saved ? "Saved" : "Save Portal Config"}
        </button>
        <button onClick={resetToDefaults} style={{
          background: "none", border: `1px solid ${C?.border || "#333"}`,
          borderRadius: 6, padding: "7px 12px",
          color: C?.grey || "#888", fontSize: 11, cursor: "pointer",
        }}>
          Reset
        </button>
      </div>
    </div>
  );
}

// Detail Panel

function DetailPanel({ C, account, onEdit, onClose, onStatusAction }) {
  const G = C?.gold || "#8f7420";
  const plan = planFor(account.plan);
  const st   = statusFor(account.status);
  const sst  = serviceStatusFor(account.serviceStatus);

  const section = (title, children) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C?.grey || "#888", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${C?.border || "#333"}` }}>
        {title}
      </div>
      {children}
    </div>
  );

  const row = (label, value) => value ? (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
      <span style={{ fontSize: 11, color: C?.grey || "#888", fontWeight: 500, flexShrink: 0, marginRight: 16 }}>{label}</span>
      <span style={{ fontSize: 12, color: C?.white || "#fff", textAlign: "right" }}>{value}</span>
    </div>
  ) : null;

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0,
      width: 380, background: C?.card || "#1a1a1a",
      borderLeft: `1px solid ${C?.border || "#333"}`,
      overflowY: "auto", zIndex: 200,
      boxShadow: "-8px 0 32px rgba(0,0,0,0.4)",
    }}>
      {/* Header */}
      <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C?.border || "#333"}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: G + "22", border: `1px solid ${G}44`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 700, color: G, flexShrink: 0,
            }}>
              {getInitials(account.name)}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C?.off || "#fff", lineHeight: 1.2 }}>{account.name}</div>
              <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap" }}>
                {account.plan && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
                    textTransform: "uppercase", color: plan.color,
                    background: plan.color + "22", padding: "2px 7px", borderRadius: 100,
                  }}>
                    {plan.label}
                  </span>
                )}
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.05em",
                  textTransform: "uppercase", color: sst.color,
                  background: sst.color + "22", padding: "2px 7px", borderRadius: 100,
                }}>
                  {sst.label}
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => onEdit(account)} style={{
              background: G, border: "none", borderRadius: 6,
              padding: "6px 14px", color: "#fff", fontSize: 11,
              fontWeight: 600, cursor: "pointer",
            }}>Edit</button>
            <button onClick={onClose} style={{
              background: "none", border: "none", color: C?.grey || "#888",
              fontSize: 18, cursor: "pointer", padding: "2px 6px",
            }}>x</button>
          </div>
        </div>
        {/* Status quick actions */}
        <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
          {STATUS_OPTIONS.map(s => {
            const isCurrent = account.status === s.key;
            return (
              <button
                key={s.key}
                onClick={() => !isCurrent && onStatusAction && onStatusAction(account.id, s.key)}
                style={{
                  padding: "3px 10px", borderRadius: 100, fontSize: 10,
                  fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
                  cursor: isCurrent ? "default" : "pointer",
                  background: isCurrent ? s.color + "22" : "transparent",
                  border: `1px solid ${isCurrent ? s.color : (C?.border || "#333")}`,
                  color: isCurrent ? s.color : C?.grey2 || "#555",
                  transition: "all 0.12s",
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "20px 24px" }}>
        {/* Content summary */}
        {section("Content Delivery",
          <ContentSummary C={C} accountId={account.id} />
        )}

        {/* Account details */}
        {section("Account",
          <div>
            {row("Company Type",      account.companyType)}
            {row("Account Manager",   account.accountManager)}
            {row("Onboarding",        account.onboardingStatus ? account.onboardingStatus.replace("-", " ") : null)}
          </div>
        )}

        {/* Primary contact */}
        {(account.primaryContactName || account.primaryContactEmail || account.contactPhone) && section("Primary Contact",
          <div>
            {row("Name",  account.primaryContactName)}
            {row("Email", account.primaryContactEmail)}
            {row("Phone", account.contactPhone)}
          </div>
        )}

        {/* Contract */}
        {(account.contractStart || account.contractEnd || account.renewalDate) && section("Contract",
          <div>
            {row("Start",   fmtDate(account.contractStart))}
            {row("End",     fmtDate(account.contractEnd))}
            {row("Renewal", fmtDate(account.renewalDate))}
          </div>
        )}

        {/* Linked records */}
        {(account.crmLeadId || account.vendorId) && section("Linked Records",
          <div>
            {account.crmLeadId && row("CRM Lead",       account.crmLeadId)}
            {account.vendorId  && row("Vendor Account", account.vendorId)}
          </div>
        )}

        {/* Notes */}
        {account.internalNotes && section("Internal Notes",
          <div style={{ fontSize: 12, color: C?.grey || "#888", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {account.internalNotes}
          </div>
        )}

        {/* Quick link to Social Studio */}
        <div style={{ marginTop: 8, paddingTop: 16, borderTop: `1px solid ${C?.border || "#333"}`, marginBottom: 20 }}>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("lwd-nav", { detail: { tab: "social-studio" } }))}
            style={{
              width: "100%", background: "none",
              border: `1px solid ${C?.border || "#333"}`,
              borderRadius: 8, padding: "10px 16px",
              color: C?.grey || "#888", fontSize: 12,
              cursor: "pointer", textAlign: "left",
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            <span style={{ fontSize: 14 }}>◉</span>
            View in Social Studio
          </button>
        </div>

        {/* Portal config */}
        {section("Client Portal Menu",
          <PortalConfigEditor C={C} account={account} />
        )}
      </div>
    </div>
  );
}

// Account Card

function AccountCard({ C, account, summary, onClick }) {
  const G = C?.gold || "#8f7420";
  const plan    = planFor(account.plan);
  const sst     = serviceStatusFor(account.serviceStatus);
  const signals = getHealthSignals(account, summary);
  const [hov, setHov] = useState(false);

  const hasPipelineData = summary && (summary.scheduled > 0 || summary.draft > 0 || summary.liveThisMonth > 0);

  return (
    <div
      onClick={() => onClick(account)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? (C?.dark || "#111") : (C?.card || "#1a1a1a"),
        border: `1px solid ${hov ? G + "55" : C?.border || "#333"}`,
        borderRadius: 10, padding: "18px 20px",
        cursor: "pointer", transition: "all 0.15s ease",
        display: "flex", flexDirection: "column", gap: 0,
      }}
    >
      {/* Top row: avatar + name + badges */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 8, flexShrink: 0,
          background: G + "22", border: `1px solid ${G}44`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color: G,
        }}>
          {getInitials(account.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C?.off || "#fff", marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {account.name}
          </div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {account.plan && (
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: plan.color, background: plan.color + "22", padding: "2px 6px", borderRadius: 100 }}>
                {plan.label}
              </span>
            )}
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: sst.color, background: sst.color + "22", padding: "2px 6px", borderRadius: 100 }}>
              {sst.label}
            </span>
          </div>
        </div>
      </div>

      {/* Health signals */}
      {signals.length > 0 && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
          {signals.map((sig, i) => (
            <span key={i} style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: sig.color, background: sig.bg, padding: "2px 7px", borderRadius: 100 }}>
              {sig.label}
            </span>
          ))}
        </div>
      )}

      {/* Content pipeline mini-stats */}
      {hasPipelineData ? (
        <div style={{ display: "flex", gap: 1, borderRadius: 6, overflow: "hidden", marginBottom: 10 }}>
          {[
            { label: "Scheduled", value: summary.scheduled, color: "#8b5cf6" },
            { label: "Draft",     value: summary.draft,     color: "#3b82f6" },
            { label: "Live",      value: summary.liveThisMonth, color: "#22c55e" },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: (C?.dark || "#111"), padding: "8px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: s.value > 0 ? s.color : C?.grey2 || "#555", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 8, color: C?.grey2 || "#555", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      ) : summary ? (
        <div style={{ fontSize: 10, color: C?.grey2 || "#555", fontStyle: "italic", marginBottom: 10, paddingTop: 2 }}>
          No content in pipeline
        </div>
      ) : null}

      {/* Footer: contact + manager */}
      <div style={{ borderTop: `1px solid ${(C?.border || "#333") + "55"}`, paddingTop: 8, marginTop: 2 }}>
        {account.primaryContactName && (
          <div style={{ fontSize: 10, color: C?.grey || "#888", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {account.primaryContactName}
            {account.primaryContactEmail && <span style={{ color: C?.grey2 || "#555" }}> · {account.primaryContactEmail}</span>}
          </div>
        )}
        {account.accountManager && (
          <div style={{ fontSize: 10, color: C?.grey2 || "#555" }}>
            {account.accountManager}
          </div>
        )}
        {!account.primaryContactName && !account.accountManager && (
          <div style={{ fontSize: 10, color: C?.grey2 || "#555", fontStyle: "italic" }}>No contact set</div>
        )}
      </div>
    </div>
  );
}

// Main Module

export default function ManagedAccountsModule({ C }) {
  const G = C?.gold || "#8f7420";

  const [accounts,        setAccounts]        = useState([]);
  const [summaries,       setSummaries]       = useState({});
  const [loading,         setLoading]         = useState(true);
  const [selected,        setSelected]        = useState(null);
  const [showModal,       setShowModal]        = useState(false);
  const [saveStatus,      setSaveStatus]      = useState(null); // { type: 'success'|'error', message: string }
  const saveStatusTimer = useRef(null);
  const [editAccount,     setEditAccount]      = useState(null);
  const [statusFilter,    setStatusFilter]     = useState("active");
  const [serviceFilter,   setServiceFilter]    = useState("all");
  const [planFilter,      setPlanFilter]       = useState("all");
  const [search,          setSearch]           = useState("");

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    const [data, sums] = await Promise.all([
      fetchManagedAccounts(),
      fetchAllContentSummaries(),
    ]);
    setAccounts(data);
    setSummaries(sums || {});
    setLoading(false);
  }, []);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const filtered = useMemo(() => {
    let list = accounts;
    if (statusFilter !== "all")  list = list.filter(a => a.status === statusFilter);
    if (serviceFilter !== "all") list = list.filter(a => a.serviceStatus === serviceFilter);
    if (planFilter !== "all")    list = list.filter(a => a.plan === planFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.primaryContactName.toLowerCase().includes(q) ||
        a.primaryContactEmail.toLowerCase().includes(q) ||
        (a.accountManager || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [accounts, statusFilter, serviceFilter, planFilter, search]);

  function showSaveFeedback(type, message) {
    if (saveStatusTimer.current) clearTimeout(saveStatusTimer.current);
    setSaveStatus({ type, message });
    saveStatusTimer.current = setTimeout(() => setSaveStatus(null), 4500);
  }

  // Returns { ok: true } on DB-confirmed success, { ok: false, message } on failure.
  // The modal uses the return value to decide whether to close — it stays open on failure.
  async function handleSave(form) {
    if (form.id) {
      // ── Edit ──────────────────────────────────────────────────────────────────
      const updated = await updateManagedAccount(form.id, form);
      if (updated && !updated._offline) {
        setAccounts(prev => prev.map(a => a.id === form.id ? updated : a));
        setSelected(prev => prev?.id === form.id ? updated : prev);
        showSaveFeedback('success', `${updated.name} updated`);
        return { ok: true };
      } else {
        return { ok: false, message: 'Update failed — your changes were not saved to the database. Please try again.' };
      }
    } else {
      // ── Create ────────────────────────────────────────────────────────────────
      const created = await createManagedAccount(form);
      if (created && !created._offline) {
        // Only add to the list once the DB confirms the record exists
        setAccounts(prev => [created, ...prev]);
        showSaveFeedback('success', `${created.name} created`);
        // Re-fetch from DB to verify the record survives a reload
        setTimeout(() => loadAccounts(), 700);
        return { ok: true };
      } else {
        return { ok: false, message: 'Create failed — account was not saved to the database. Check the browser console for the error detail.' };
      }
    }
  }

  async function handleStatusAction(accountId, newStatus) {
    const updated = { status: newStatus };
    setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, ...updated } : a));
    setSelected(prev => prev?.id === accountId ? { ...prev, ...updated } : prev);
    await updateManagedAccount(accountId, { ...accounts.find(a => a.id === accountId), status: newStatus });
  }

  function openEdit(account) {
    setEditAccount(account);
    setSelected(null);
    setShowModal(true);
  }

  const pill = (active, onClick, label, color) => (
    <button onClick={onClick} style={{
      background: active ? (color || G) + "22" : "none",
      border: `1px solid ${active ? (color || G) : C?.border || "#333"}`,
      borderRadius: 20, padding: "5px 14px",
      color: active ? (color || G) : C?.grey || "#888",
      fontSize: 11, fontWeight: 600, cursor: "pointer",
      letterSpacing: "0.03em", whiteSpace: "nowrap",
    }}>
      {label}
    </button>
  );

  const hasFilters = statusFilter !== "active" || serviceFilter !== "all" || planFilter !== "all" || search.trim();

  return (
    <div style={{ background: C?.black || "#0a0a0a", minHeight: "100vh", color: C?.white || "#fff", position: "relative" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: C?.grey || "#888", margin: 0 }}>
            Active service clients. Created when a CRM deal is won. Hub for content delivery and campaigns.
          </p>
          <button onClick={() => { setEditAccount(null); setShowModal(true); }} style={{
            background: G, border: "none", borderRadius: 8,
            padding: "10px 20px", color: "#fff", fontSize: 13,
            fontWeight: 600, cursor: "pointer", flexShrink: 0,
          }}>
            + New Account
          </button>
        </div>

        {/* Stats bar */}
        <div style={{ display: "flex", gap: 1, marginBottom: 20 }}>
          {[
            { label: "Total",           value: accounts.length,                                                                                           color: G },
            { label: "Active",          value: accounts.filter(a => a.status === "active").length,                                                        color: "#22c55e" },
            { label: "Onboarding",      value: accounts.filter(a => a.serviceStatus === "onboarding").length,                                             color: "#3b82f6" },
            { label: "Needs Attention", value: accounts.filter(a => getHealthSignals(a, summaries[a.id] || null).length > 0).length,                      color: "#f97316" },
            { label: "At Risk",         value: accounts.filter(a => a.serviceStatus === "at-risk").length,                                                color: "#ef4444" },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, background: C?.dark || "#111", padding: "14px 16px",
              borderRight: `1px solid ${(C?.border || "#333") + "44"}`,
            }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: C?.grey2 || "#666", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ marginBottom: 12 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search accounts, contacts, managers..."
            style={{
              width: "100%", boxSizing: "border-box",
              background: C?.dark || "#111",
              border: `1px solid ${search ? G + "66" : C?.border || "#333"}`,
              borderRadius: 8, padding: "9px 14px",
              color: C?.white || "#fff", fontSize: 13,
              outline: "none",
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {/* Account status */}
          {pill(statusFilter === "active",  () => setStatusFilter("active"),  "Active",  "#22c55e")}
          {pill(statusFilter === "paused",  () => setStatusFilter("paused"),  "Paused",  "#f59e0b")}
          {pill(statusFilter === "churned", () => setStatusFilter("churned"), "Churned", "#ef4444")}
          {pill(statusFilter === "all",     () => setStatusFilter("all"),     "All accounts")}

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: C?.border || "#333" }} />

          {/* Service status */}
          {["onboarding", "active", "paused", "at-risk"].map(k => {
            const sst = SERVICE_STATUS_OPTIONS.find(s => s.key === k);
            return <span key={k}>{pill(serviceFilter === k, () => setServiceFilter(serviceFilter === k ? "all" : k), sst.label, sst.color)}</span>;
          })}

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: C?.border || "#333" }} />

          {/* Plan */}
          {PLAN_OPTIONS.map(p =>
            <span key={p.key}>{pill(planFilter === p.key, () => setPlanFilter(planFilter === p.key ? "all" : p.key), p.label, p.color)}</span>
          )}

          {/* Clear all */}
          {hasFilters && (
            <button onClick={() => { setStatusFilter("active"); setServiceFilter("all"); setPlanFilter("all"); setSearch(""); }}
              style={{ background: "none", border: "none", color: C?.grey || "#888", fontSize: 11, cursor: "pointer", padding: "5px 8px" }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ padding: 48, textAlign: "center", color: C?.grey || "#888", fontSize: 13 }}>
          Loading managed accounts...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          border: `1px dashed ${C?.border || "#333"}`, borderRadius: 12,
          padding: "64px 32px", textAlign: "center",
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>◎</div>
          {accounts.length === 0 ? (
            <>
              <div style={{ fontSize: 15, fontWeight: 600, color: C?.off || "#fff", marginBottom: 8 }}>No managed accounts yet</div>
              <div style={{ fontSize: 13, color: C?.grey || "#888", marginBottom: 20 }}>
                Convert a won CRM deal or add an account manually.
              </div>
              <button onClick={() => { setEditAccount(null); setShowModal(true); }} style={{
                background: G, border: "none", borderRadius: 8,
                padding: "10px 24px", color: "#fff", fontSize: 13,
                fontWeight: 600, cursor: "pointer",
              }}>
                + New Account
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 15, fontWeight: 600, color: C?.off || "#fff", marginBottom: 8 }}>No results</div>
              <div style={{ fontSize: 13, color: C?.grey || "#888", marginBottom: 16 }}>No accounts match your current filters.</div>
              <button onClick={() => { setStatusFilter("all"); setServiceFilter("all"); setPlanFilter("all"); setSearch(""); }}
                style={{ background: "none", border: `1px solid ${C?.border || "#333"}`, borderRadius: 8, padding: "8px 20px", color: C?.grey || "#888", fontSize: 12, cursor: "pointer" }}>
                Clear filters
              </button>
            </>
          )}
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 16,
        }}>
          {filtered.map(account => (
            <AccountCard key={account.id} C={C} account={account} summary={summaries[account.id] || null} onClick={setSelected} />
          ))}
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <DetailPanel
          C={C}
          account={selected}
          onEdit={openEdit}
          onStatusAction={handleStatusAction}
          onClose={() => setSelected(null)}
        />
      )}

      {/* Add / edit modal */}
      {showModal && (
        <AccountModal
          C={C}
          account={editAccount}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditAccount(null); }}
        />
      )}

      {/* Save feedback toast */}
      {saveStatus && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9999,
          background: saveStatus.type === "success" ? "#16a34a" : "#dc2626",
          color: "#fff", borderRadius: 8, padding: "12px 18px",
          fontSize: 13, fontWeight: 600,
          boxShadow: "0 4px 24px rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", gap: 10,
          maxWidth: 380,
        }}>
          <span>{saveStatus.type === "success" ? "✓" : "✕"}</span>
          <span style={{ flex: 1 }}>{saveStatus.message}</span>
          <button
            onClick={() => setSaveStatus(null)}
            style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 16, lineHeight: 1, flexShrink: 0 }}
          >×</button>
        </div>
      )}

      {/* Spinner keyframes */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
