// PartnerAccountsModule.jsx (file kept as ManagedAccountsModule.jsx for routing stability)
// Partner Accounts: the parent business entity.
// One partner account can own one or more listings.
// Underlying table: managed_accounts (kept stable, renamed in UI only).
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  fetchAccounts,
  saveAccount,
  deleteAccount,
} from "../../services/managedAccountsService";

// ── Constants ────────────────────────────────────────────────────────────────

const LEVEL_OPTIONS = [
  { key: "gold",   label: "Gold",   color: "#c9a84c" },
  { key: "silver", label: "Silver", color: "#94a3b8" },
  { key: "bronze", label: "Bronze", color: "#cd7f32" },
];

const STATUS_OPTIONS = [
  { key: "onboarding", label: "Onboarding", color: "#3b82f6" },
  { key: "active",     label: "Active",     color: "#22c55e" },
  { key: "paused",     label: "Paused",     color: "#f59e0b" },
  { key: "cancelled",  label: "Cancelled",  color: "#ef4444" },
];

const COMPANY_TYPE_OPTIONS = [
  { key: "venue",    label: "Venue" },
  { key: "hotel",    label: "Hotel" },
  { key: "planner",  label: "Planner" },
  { key: "vendor",   label: "Vendor" },
  { key: "agency",   label: "Agency" },
  { key: "other",    label: "Other" },
];

function levelFor(key) {
  return LEVEL_OPTIONS.find(l => l.key === key) || { label: key || "—", color: "#6b7280" };
}
function statusFor(key) {
  // Map legacy values to new status
  if (key === "churned") return { key: "cancelled", label: "Cancelled", color: "#ef4444" };
  if (key === "at-risk") return { key: "paused", label: "Paused", color: "#f59e0b" };
  return STATUS_OPTIONS.find(s => s.key === key) || STATUS_OPTIONS[0];
}
function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// Map legacy plan values to new level keys
function normalisePlan(plan) {
  const map = { signature: "gold", growth: "silver", essentials: "bronze", custom: "gold" };
  return map[plan] || plan || "";
}

// Map new level keys back to DB plan field
function levelToDbPlan(level) {
  // Store as the level key directly — the DB plan field accepts any text
  return level || "";
}

// ── Account Modal (Create / Edit) ────────────────────────────────────────────

function AccountModal({ C, account, onSave, onClose }) {
  const isEdit = !!account?.id;
  const G = C?.gold || "#8f7420";

  const [form, setForm] = useState(() => {
    if (account) {
      return {
        ...account,
        plan: normalisePlan(account.plan), // normalise legacy plan to level key
      };
    }
    return {
      name: "",
      primaryContactName: "",
      primaryContactEmail: "",
      contactPhone: "",
      companyType: "",
      plan: "bronze",
      status: "onboarding",
      businessAddress: "",
      websiteUrl: "",
      renewalDate: "",
      accountManager: "",
      internalNotes: "",
    };
  });

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const canSave = form.name?.trim() && form.primaryContactEmail?.trim() && !saving;

  async function handleSubmit() {
    if (!canSave) return;
    setSaving(true);
    setSaveError(null);
    // Map level back to plan for DB
    const payload = { ...form, plan: levelToDbPlan(form.plan) };
    const result = await onSave(payload);
    if (result?.ok) {
      onClose();
    } else {
      setSaving(false);
      setSaveError(result?.message || "Save failed — account was not stored.");
    }
  }

  const inp = {
    width: "100%", boxSizing: "border-box",
    background: C?.dark || "#111",
    border: `1px solid ${C?.border || "#333"}`,
    borderRadius: 6, padding: "9px 12px",
    color: C?.white || "#fff", fontSize: 13,
    fontFamily: "var(--font-body, inherit)",
    outline: "none",
  };
  const lbl = {
    display: "block", fontSize: 11, fontWeight: 600,
    color: C?.grey || "#888", letterSpacing: "0.05em",
    textTransform: "uppercase", marginBottom: 5,
    fontFamily: "var(--font-body, inherit)",
  };
  const field = (label, children, fullWidth) => (
    <div style={{ marginBottom: 16, gridColumn: fullWidth ? "1 / -1" : undefined }}>
      <label style={lbl}>{label}</label>
      {children}
    </div>
  );
  const sectionHead = (label) => (
    <div style={{
      gridColumn: "1 / -1",
      fontSize: 10, fontWeight: 700, color: G,
      letterSpacing: "0.1em", textTransform: "uppercase",
      paddingBottom: 6, borderBottom: `1px solid ${C?.border || "#333"}`,
      marginBottom: 4, marginTop: 12,
      fontFamily: "var(--font-body, inherit)",
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
        borderRadius: 12, width: "100%", maxWidth: 720,
        maxHeight: "90vh", overflowY: "auto",
        padding: "32px 36px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C?.off || "#fff", marginBottom: 3, fontFamily: "var(--font-heading, inherit)" }}>
              {isEdit ? "Edit Partner Account" : "New Partner Account"}
            </div>
            <div style={{ fontSize: 12, color: C?.grey2 || "#666", fontFamily: "var(--font-body, inherit)" }}>
              {isEdit ? "Update business account details" : "Create a new business account"}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C?.grey || "#888", fontSize: 20, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>

          {/* ── Section: Business & Login ── */}
          {sectionHead("Business & Contact")}

          {field("Business Name *",
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Villa d'Este" style={inp} />,
            true
          )}
          {field("Contact Email *",
            <input type="email" value={form.primaryContactEmail} onChange={e => set("primaryContactEmail", e.target.value)} placeholder="info@business.com" style={inp} />
          )}
          {field("Contact Name",
            <input value={form.primaryContactName} onChange={e => set("primaryContactName", e.target.value)} placeholder="Primary contact person" style={inp} />
          )}
          {field("Phone",
            <input value={form.contactPhone} onChange={e => set("contactPhone", e.target.value)} placeholder="+44..." style={inp} />
          )}
          {field("Website",
            <input value={form.websiteUrl || ""} onChange={e => set("websiteUrl", e.target.value)} placeholder="https://..." style={inp} />
          )}
          {field("Company Type",
            <select value={form.companyType} onChange={e => set("companyType", e.target.value)} style={inp}>
              <option value="">Select type</option>
              {COMPANY_TYPE_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          )}
          {field("Business Address",
            <textarea value={form.businessAddress || ""} onChange={e => set("businessAddress", e.target.value)}
              placeholder="Street, City, Country" rows={2}
              style={{ ...inp, resize: "vertical", lineHeight: 1.5 }} />,
            true
          )}

          {/* ── Section: Commercial ── */}
          {sectionHead("Level & Status")}

          {field("Membership Level",
            <div style={{ display: "flex", gap: 8 }}>
              {LEVEL_OPTIONS.map(l => {
                const active = form.plan === l.key;
                return (
                  <button key={l.key} onClick={() => set("plan", l.key)} type="button" style={{
                    flex: 1, padding: "10px 0", borderRadius: 6,
                    border: `2px solid ${active ? l.color : (C?.border || "#333")}`,
                    background: active ? l.color + "18" : "transparent",
                    color: active ? l.color : (C?.grey || "#888"),
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                    letterSpacing: "0.05em", textTransform: "uppercase",
                    fontFamily: "var(--font-body, inherit)",
                    transition: "all 0.15s",
                  }}>
                    {l.label}
                  </button>
                );
              })}
            </div>,
            true
          )}

          {field("Status",
            <select value={form.status} onChange={e => set("status", e.target.value)} style={inp}>
              {STATUS_OPTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          )}
          {field("Renewal Date",
            <input type="date" value={form.renewalDate || ""} onChange={e => set("renewalDate", e.target.value)} style={inp} />
          )}
          {field("Account Manager",
            <input value={form.accountManager} onChange={e => set("accountManager", e.target.value)} placeholder="Internal team member" style={inp} />
          )}

          {/* ── Section: Notes ── */}
          {sectionHead("Notes")}
          {field("Internal Notes",
            <textarea value={form.internalNotes} onChange={e => set("internalNotes", e.target.value)}
              placeholder="Account context, requirements, history..." rows={3}
              style={{ ...inp, resize: "vertical", lineHeight: 1.5 }} />,
            true
          )}
        </div>

        {/* Error banner */}
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

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20, paddingTop: 20, borderTop: `1px solid ${C?.border || "#333"}` }}>
          <button onClick={onClose} disabled={saving} style={{
            background: "none", border: `1px solid ${C?.border || "#333"}`,
            borderRadius: 6, padding: "9px 20px", color: C?.grey || "#888",
            fontSize: 13, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.5 : 1,
            fontFamily: "var(--font-body, inherit)",
          }}>Cancel</button>
          <button onClick={handleSubmit} disabled={!canSave} style={{
            background: canSave ? G : C?.border || "#333",
            border: "none", borderRadius: 6, padding: "9px 24px",
            color: canSave ? "#fff" : C?.grey2 || "#555",
            fontSize: 13, fontWeight: 600, cursor: canSave ? "pointer" : "not-allowed",
            minWidth: 120, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            fontFamily: "var(--font-body, inherit)",
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

// ── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({ C, account, onEdit, onClose, onStatusAction }) {
  const G = C?.gold || "#8f7420";
  const level = levelFor(normalisePlan(account.plan));
  const st = statusFor(account.status);

  const section = (title, children) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: G,
        letterSpacing: "0.1em", textTransform: "uppercase",
        marginBottom: 10, paddingBottom: 6,
        borderBottom: `1px solid ${C?.border || "#333"}`,
        fontFamily: "var(--font-body, inherit)",
      }}>
        {title}
      </div>
      {children}
    </div>
  );

  const row = (label, value) => value && value !== "—" ? (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
      <span style={{ fontSize: 11, color: C?.grey || "#888", fontWeight: 500, flexShrink: 0, marginRight: 16, fontFamily: "var(--font-body, inherit)" }}>{label}</span>
      <span style={{ fontSize: 12, color: C?.white || "#fff", textAlign: "right", fontFamily: "var(--font-body, inherit)" }}>{value}</span>
    </div>
  ) : null;

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0,
      width: 420, background: C?.card || "#1a1a1a",
      borderLeft: `1px solid ${C?.border || "#333"}`,
      overflowY: "auto", zIndex: 200,
      boxShadow: "-8px 0 32px rgba(0,0,0,0.4)",
    }}>
      {/* Header */}
      <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C?.border || "#333"}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 10,
              background: level.color + "22", border: `2px solid ${level.color}55`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, fontWeight: 700, color: level.color, flexShrink: 0,
              fontFamily: "var(--font-heading, inherit)",
            }}>
              {getInitials(account.name)}
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: C?.off || "#fff", lineHeight: 1.2, fontFamily: "var(--font-heading, inherit)" }}>
                {account.name}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
                  textTransform: "uppercase", color: level.color,
                  background: level.color + "22", padding: "2px 8px", borderRadius: 100,
                  fontFamily: "var(--font-body, inherit)",
                }}>
                  {level.label}
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.05em",
                  textTransform: "uppercase", color: st.color,
                  background: st.color + "22", padding: "2px 8px", borderRadius: 100,
                  fontFamily: "var(--font-body, inherit)",
                }}>
                  {st.label}
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => onEdit(account)} style={{
              background: G, border: "none", borderRadius: 6,
              padding: "6px 14px", color: "#fff", fontSize: 11,
              fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body, inherit)",
            }}>Edit</button>
            <button onClick={onClose} style={{
              background: "none", border: "none", color: C?.grey || "#888",
              fontSize: 18, cursor: "pointer", padding: "2px 6px",
            }}>×</button>
          </div>
        </div>

        {/* Status quick actions */}
        <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
          {STATUS_OPTIONS.map(s => {
            const isCurrent = account.status === s.key;
            return (
              <button key={s.key}
                onClick={() => !isCurrent && onStatusAction?.(account.id, s.key)}
                style={{
                  padding: "3px 10px", borderRadius: 100, fontSize: 10,
                  fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
                  cursor: isCurrent ? "default" : "pointer",
                  background: isCurrent ? s.color + "22" : "transparent",
                  border: `1px solid ${isCurrent ? s.color : (C?.border || "#333")}`,
                  color: isCurrent ? s.color : C?.grey2 || "#555",
                  transition: "all 0.12s",
                  fontFamily: "var(--font-body, inherit)",
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "20px 24px" }}>
        {/* Account details */}
        {section("Account",
          <div>
            {row("Email", account.primaryContactEmail)}
            {row("Contact", account.primaryContactName)}
            {row("Phone", account.contactPhone)}
            {row("Website", account.websiteUrl)}
            {row("Type", account.companyType)}
            {row("Address", account.businessAddress)}
            {row("Manager", account.accountManager)}
          </div>
        )}

        {/* Commercial */}
        {section("Commercial",
          <div>
            {row("Level", level.label)}
            {row("Renewal", fmtDate(account.renewalDate))}
            {account.contractStart && row("Contract Start", fmtDate(account.contractStart))}
            {account.contractEnd && row("Contract End", fmtDate(account.contractEnd))}
          </div>
        )}

        {/* Linked Listings */}
        {section("Linked Listings",
          <div style={{
            padding: "20px", textAlign: "center",
            border: `1px dashed ${C?.border || "#333"}`,
            borderRadius: 8,
          }}>
            <div style={{ fontSize: 12, color: C?.grey2 || "#555", fontFamily: "var(--font-body, inherit)" }}>
              Listing linkage display coming soon
            </div>
          </div>
        )}

        {/* Notes */}
        {account.internalNotes && section("Internal Notes",
          <div style={{ fontSize: 12, color: C?.grey || "#888", lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: "var(--font-body, inherit)" }}>
            {account.internalNotes}
          </div>
        )}

        {/* Linked records (legacy) */}
        {(account.crmLeadId || account.vendorId) && section("Linked Records",
          <div>
            {account.crmLeadId && row("CRM Lead", account.crmLeadId)}
            {account.vendorId && row("Vendor Account", account.vendorId)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Module ──────────────────────────────────────────────────────────────

export default function ManagedAccountsModule({ C }) {
  const G = C?.gold || "#8f7420";

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const saveStatusTimer = useRef(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [search, setSearch] = useState("");

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAccounts();
      if (result.success && result.data) {
        setAccounts(result.data);
      } else {
        console.error("[PartnerAccounts] load failed:", result.error);
        setAccounts([]);
      }
    } catch (err) {
      console.error("[PartnerAccounts] load exception:", err);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  // Normalise plan to level for filtering
  const accountsWithLevel = useMemo(() =>
    accounts.map(a => ({ ...a, _level: normalisePlan(a.plan) })),
    [accounts]
  );

  const filtered = useMemo(() => {
    let list = accountsWithLevel;
    if (statusFilter !== "all") list = list.filter(a => a.status === statusFilter);
    if (levelFilter !== "all") list = list.filter(a => a._level === levelFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.name?.toLowerCase().includes(q) ||
        a.primaryContactEmail?.toLowerCase().includes(q) ||
        a.primaryContactName?.toLowerCase().includes(q) ||
        (a.accountManager || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [accountsWithLevel, statusFilter, levelFilter, search]);

  function showSaveFeedback(type, message) {
    if (saveStatusTimer.current) clearTimeout(saveStatusTimer.current);
    setSaveStatus({ type, message });
    saveStatusTimer.current = setTimeout(() => setSaveStatus(null), 4500);
  }

  async function handleSave(form) {
    try {
      const isCreate = !form.id;
      console.log("[PartnerAccounts] handleSave:", isCreate ? "creating" : "updating");
      const result = await saveAccount(form);
      if (!result.success) {
        return { ok: false, message: result.error || "Save failed" };
      }
      const saved = result.data;
      if (isCreate) {
        setAccounts(prev => [saved, ...prev]);
        showSaveFeedback("success", `${saved.name} created`);
        setTimeout(() => loadAccounts(), 700);
      } else {
        setAccounts(prev => prev.map(a => a.id === saved.id ? saved : a));
        setSelected(prev => prev?.id === saved.id ? saved : prev);
        showSaveFeedback("success", `${saved.name} updated`);
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, message: "An unexpected error occurred." };
    }
  }

  async function handleStatusAction(accountId, newStatus) {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;
    const updated = { ...account, status: newStatus };
    setAccounts(prev => prev.map(a => a.id === accountId ? updated : a));
    setSelected(prev => prev?.id === accountId ? updated : prev);
    const result = await saveAccount(updated);
    if (!result.success) {
      showSaveFeedback("error", `Status update failed: ${result.error}`);
    }
  }

  function openEdit(account) {
    setEditAccount(account);
    setSelected(null);
    setShowModal(true);
  }

  // ── Stats ──
  const stats = useMemo(() => ({
    total: accounts.length,
    active: accounts.filter(a => a.status === "active").length,
    onboarding: accounts.filter(a => a.status === "onboarding" || a.serviceStatus === "onboarding").length,
    gold: accountsWithLevel.filter(a => a._level === "gold").length,
    silver: accountsWithLevel.filter(a => a._level === "silver").length,
    bronze: accountsWithLevel.filter(a => a._level === "bronze").length,
  }), [accounts, accountsWithLevel]);

  const hasFilters = statusFilter !== "all" || levelFilter !== "all" || search.trim();

  // ── Table header style ──
  const th = {
    fontSize: 10, fontWeight: 700, color: C?.grey || "#888",
    letterSpacing: "0.08em", textTransform: "uppercase",
    padding: "10px 14px", textAlign: "left", whiteSpace: "nowrap",
    borderBottom: `1px solid ${C?.border || "#333"}`,
    fontFamily: "var(--font-body, inherit)",
  };
  const td = {
    fontSize: 13, color: C?.white || "#fff",
    padding: "12px 14px", verticalAlign: "middle",
    borderBottom: `1px solid ${(C?.border || "#333")}44`,
    fontFamily: "var(--font-body, inherit)",
  };

  return (
    <div style={{ background: C?.black || "#0a0a0a", minHeight: "100vh", color: C?.white || "#fff", position: "relative" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: C?.grey || "#888", margin: 0, fontFamily: "var(--font-body, inherit)" }}>
            Business accounts. Each partner account can own one or more listings.
          </p>
          <button onClick={() => { setEditAccount(null); setShowModal(true); }} style={{
            background: G, border: "none", borderRadius: 8,
            padding: "10px 20px", color: "#fff", fontSize: 13,
            fontWeight: 600, cursor: "pointer", flexShrink: 0,
            fontFamily: "var(--font-body, inherit)",
          }}>
            + New Account
          </button>
        </div>

        {/* ── Stats strip ── */}
        <div style={{ display: "flex", gap: 1, marginBottom: 20, borderRadius: 8, overflow: "hidden" }}>
          {[
            { label: "Total",      value: stats.total,      color: G },
            { label: "Active",     value: stats.active,     color: "#22c55e" },
            { label: "Onboarding", value: stats.onboarding, color: "#3b82f6" },
            { label: "Gold",       value: stats.gold,       color: "#c9a84c" },
            { label: "Silver",     value: stats.silver,     color: "#94a3b8" },
            { label: "Bronze",     value: stats.bronze,     color: "#cd7f32" },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, background: C?.dark || "#111", padding: "14px 16px",
              borderRight: `1px solid ${(C?.border || "#333") + "44"}`,
            }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: 4, fontFamily: "var(--font-heading, inherit)" }}>{s.value}</div>
              <div style={{ fontSize: 10, color: C?.grey2 || "#666", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: "var(--font-body, inherit)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Search + Filters ── */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search accounts..."
            style={{
              flex: 1, boxSizing: "border-box",
              background: C?.dark || "#111",
              border: `1px solid ${search ? G + "66" : C?.border || "#333"}`,
              borderRadius: 8, padding: "9px 14px",
              color: C?.white || "#fff", fontSize: 13,
              outline: "none", fontFamily: "var(--font-body, inherit)",
            }}
          />

          {/* Status filter */}
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{
            background: C?.dark || "#111", border: `1px solid ${C?.border || "#333"}`,
            borderRadius: 8, padding: "9px 12px", color: C?.white || "#fff",
            fontSize: 12, outline: "none", cursor: "pointer",
            fontFamily: "var(--font-body, inherit)",
          }}>
            <option value="all">All status</option>
            {STATUS_OPTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>

          {/* Level filter */}
          <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} style={{
            background: C?.dark || "#111", border: `1px solid ${C?.border || "#333"}`,
            borderRadius: 8, padding: "9px 12px", color: C?.white || "#fff",
            fontSize: 12, outline: "none", cursor: "pointer",
            fontFamily: "var(--font-body, inherit)",
          }}>
            <option value="all">All levels</option>
            {LEVEL_OPTIONS.map(l => <option key={l.key} value={l.key}>{l.label}</option>)}
          </select>

          {hasFilters && (
            <button onClick={() => { setStatusFilter("all"); setLevelFilter("all"); setSearch(""); }}
              style={{ background: "none", border: "none", color: C?.grey || "#888", fontSize: 11, cursor: "pointer", padding: "5px 8px", whiteSpace: "nowrap", fontFamily: "var(--font-body, inherit)" }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div style={{ padding: 48, textAlign: "center", color: C?.grey || "#888", fontSize: 13, fontFamily: "var(--font-body, inherit)" }}>
          Loading partner accounts...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          border: `1px dashed ${C?.border || "#333"}`, borderRadius: 12,
          padding: "64px 32px", textAlign: "center",
        }}>
          {accounts.length === 0 ? (
            <>
              <div style={{ fontSize: 15, fontWeight: 600, color: C?.off || "#fff", marginBottom: 8, fontFamily: "var(--font-heading, inherit)" }}>No partner accounts yet</div>
              <div style={{ fontSize: 13, color: C?.grey || "#888", marginBottom: 20, fontFamily: "var(--font-body, inherit)" }}>
                Create your first partner account to get started.
              </div>
              <button onClick={() => { setEditAccount(null); setShowModal(true); }} style={{
                background: G, border: "none", borderRadius: 8,
                padding: "10px 24px", color: "#fff", fontSize: 13,
                fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body, inherit)",
              }}>
                + New Account
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 15, fontWeight: 600, color: C?.off || "#fff", marginBottom: 8, fontFamily: "var(--font-heading, inherit)" }}>No results</div>
              <div style={{ fontSize: 13, color: C?.grey || "#888", marginBottom: 16, fontFamily: "var(--font-body, inherit)" }}>No accounts match your current filters.</div>
              <button onClick={() => { setStatusFilter("all"); setLevelFilter("all"); setSearch(""); }}
                style={{ background: "none", border: `1px solid ${C?.border || "#333"}`, borderRadius: 8, padding: "8px 20px", color: C?.grey || "#888", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body, inherit)" }}>
                Clear filters
              </button>
            </>
          )}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Business Name</th>
                <th style={th}>Email</th>
                <th style={th}>Level</th>
                <th style={th}>Status</th>
                <th style={{ ...th, textAlign: "center" }}>Listings</th>
                <th style={th}>Renewal</th>
                <th style={th}>Manager</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(account => {
                const level = levelFor(normalisePlan(account.plan));
                const st = statusFor(account.status);
                const isSelected = selected?.id === account.id;
                return (
                  <tr
                    key={account.id}
                    onClick={() => setSelected(account)}
                    style={{
                      cursor: "pointer",
                      background: isSelected ? (G + "12") : "transparent",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = (C?.dark || "#111"); }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                  >
                    {/* Business Name */}
                    <td style={td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 6, flexShrink: 0,
                          background: level.color + "22", border: `1px solid ${level.color}44`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 700, color: level.color,
                          fontFamily: "var(--font-heading, inherit)",
                        }}>
                          {getInitials(account.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: C?.off || "#fff" }}>{account.name}</div>
                          {account.primaryContactName && (
                            <div style={{ fontSize: 11, color: C?.grey2 || "#555", marginTop: 1 }}>{account.primaryContactName}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td style={{ ...td, fontSize: 12, color: C?.grey || "#888" }}>
                      {account.primaryContactEmail || "—"}
                    </td>

                    {/* Level */}
                    <td style={td}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                        textTransform: "uppercase", color: level.color,
                        background: level.color + "22", padding: "3px 10px",
                        borderRadius: 100, whiteSpace: "nowrap",
                      }}>
                        {level.label}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={td}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
                        textTransform: "uppercase", color: st.color,
                        background: st.color + "22", padding: "3px 10px",
                        borderRadius: 100, whiteSpace: "nowrap",
                      }}>
                        {st.label}
                      </span>
                    </td>

                    {/* Listings count */}
                    <td style={{ ...td, textAlign: "center", color: C?.grey2 || "#555" }}>
                      —
                    </td>

                    {/* Renewal */}
                    <td style={{ ...td, fontSize: 12, color: C?.grey || "#888", whiteSpace: "nowrap" }}>
                      {fmtDate(account.renewalDate)}
                    </td>

                    {/* Manager */}
                    <td style={{ ...td, fontSize: 12, color: C?.grey || "#888" }}>
                      {account.accountManager || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Detail panel ── */}
      {selected && (
        <DetailPanel
          C={C}
          account={selected}
          onEdit={openEdit}
          onStatusAction={handleStatusAction}
          onClose={() => setSelected(null)}
        />
      )}

      {/* ── Modal ── */}
      {showModal && (
        <AccountModal
          C={C}
          account={editAccount}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditAccount(null); }}
        />
      )}

      {/* ── Toast ── */}
      {saveStatus && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9999,
          background: saveStatus.type === "success" ? "#16a34a" : "#dc2626",
          color: "#fff", borderRadius: 8, padding: "12px 18px",
          fontSize: 13, fontWeight: 600,
          boxShadow: "0 4px 24px rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", gap: 10,
          maxWidth: 380, fontFamily: "var(--font-body, inherit)",
        }}>
          <span>{saveStatus.type === "success" ? "✓" : "✕"}</span>
          <span style={{ flex: 1 }}>{saveStatus.message}</span>
          <button
            onClick={() => setSaveStatus(null)}
            style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 16, lineHeight: 1, flexShrink: 0 }}
          >×</button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
