// ClientPortal.jsx
// Premium client-facing portal for managed account clients (venues, hotels, planners).
// Entirely separate from /vendor (which is for regular directory vendors).
//
// Menu is admin-controlled per account via portal_config on managed_accounts.
// Auth: vendor login -> if vendor_id is linked to a managed account -> this portal.
//
// Aesthetic: dark luxury, warm near-black, gold accents, editorial typography.

import { useState, useEffect } from "react";
import { useVendorAuth } from "../context/VendorAuthContext";
import {
  fetchManagedAccountByVendorId,
  fetchPortalConfig,
  buildDefaultPortalConfig,
  fetchClientContentSummary,
} from "../services/socialStudioService";
import { useAdaptiveColor } from "../hooks/useAdaptiveColor";

// ── Fonts / tokens ─────────────────────────────────────────────────────────────
const SERIF = "'Cormorant Garamond', 'Georgia', serif";
const SANS  = "'Inter', 'system-ui', sans-serif";

const T = {
  bg:       "#0b0906",
  sidebar:  "#110e0a",
  card:     "#1a1510",
  border:   "#2a2218",
  border2:  "#3a3020",
  gold:     "#c9a84c",
  goldDim:  "#8f7420",
  white:    "#f5efe4",
  off:      "#d4c8b0",
  grey:     "#8a7d6a",
  grey2:    "#5a5045",
  green:    "#4ade80",
  amber:    "#f59e0b",
  red:      "#f87171",
};

// ── Fallback managed account for dev when no vendor link ───────────────────────
const DEV_ACCOUNT = {
  id:                  "a1b2c3d4-0001-0000-0000-000000000001",
  name:                "Villa d'Este",
  plan:                "signature",
  status:              "active",
  serviceStatus:       "active",
  primaryContactName:  "Sofia Ricci",
  accountManager:      "James Holloway",
  portalConfig:        null,
  // heroImageUrl stored on managed_accounts.logo_url or linked listing hero.
  // In dev we use a sample image to exercise the adaptive colour system.
  heroImageUrl:        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80",
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return null;
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function greet(name) {
  const h = new Date().getHours();
  const time = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return `${time}, ${name || ""}`;
}

// ── Overview Page ──────────────────────────────────────────────────────────────
function OverviewPage({ account, summary }) {
  const mgr = account.portalConfig?.accountManager;
  const heroUrl = account.heroImageUrl || account.logoUrl || null;
  const { textColor, subColor, accentColor, overlayStyle } = useAdaptiveColor(heroUrl, { region: "center", sampleHeight: 120 });

  const thisWeek = [
    summary?.scheduled > 0  && { type: "scheduled",  text: `${summary.scheduled} post${summary.scheduled > 1 ? "s" : ""} scheduled` },
    summary?.draft > 0       && { type: "draft",      text: `${summary.draft} item${summary.draft > 1 ? "s" : ""} in draft` },
    summary?.activeCampaign  && { type: "campaign",   text: `Active campaign: ${summary.activeCampaign}` },
  ].filter(Boolean);

  const statColor = (val, thresholds) => {
    if (val >= thresholds[0]) return T.green;
    if (val >= thresholds[1]) return T.amber;
    return T.grey;
  };

  return (
    <div>
      {/* Greeting banner - adapts text colour to the hero image */}
      <div style={{
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 32,
        minHeight: heroUrl ? 200 : "auto",
        display: "flex", alignItems: "flex-end",
        background: heroUrl ? "transparent" : "none",
      }}>
        {/* Hero image */}
        {heroUrl && (
          <img
            src={heroUrl}
            alt=""
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "center",
              pointerEvents: "none", userSelect: "none",
            }}
            crossOrigin="anonymous"
          />
        )}
        {/* Adaptive gradient overlay */}
        {heroUrl && (
          <div style={{ position: "absolute", inset: 0, ...overlayStyle }} />
        )}
        {/* Text content */}
        <div style={{
          position: heroUrl ? "relative" : "static",
          zIndex: 1,
          padding: heroUrl ? "28px 32px" : "0",
          width: "100%",
        }}>
          <div style={{
            fontFamily: SANS, fontSize: 10, letterSpacing: "3px",
            textTransform: "uppercase",
            color: heroUrl ? accentColor : T.goldDim,
            marginBottom: 10,
          }}>
            Client Overview
          </div>
          <h1 style={{
            fontFamily: SERIF, fontSize: heroUrl ? 40 : 36,
            fontWeight: 600, margin: "0 0 8px",
            color: heroUrl ? textColor : T.white,
          }}>
            {greet(account.name)}
          </h1>
          <p style={{
            fontFamily: SANS, fontSize: 13, margin: 0, lineHeight: 1.7,
            color: heroUrl ? subColor : T.grey,
          }}>
            Here is what is happening with your account this week.
          </p>
        </div>
      </div>

      {/* This week */}
      {thisWeek.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.gold, marginBottom: 14 }}>
            This Week
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {thisWeek.map((item, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px",
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 8,
              }}>
                <span style={{ color: T.gold, fontSize: 12, flexShrink: 0 }}>
                  {item.type === "campaign" ? "◎" : item.type === "scheduled" ? "◈" : "◇"}
                </span>
                <span style={{ fontFamily: SANS, fontSize: 13, color: T.off }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content pipeline stats */}
      {summary && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.grey, marginBottom: 14 }}>
            Content Pipeline
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
            {[
              { label: "Scheduled",       value: summary.scheduled,     color: statColor(summary.scheduled, [3, 1]) },
              { label: "In Progress",     value: summary.draft,         color: statColor(summary.draft, [2, 1]) },
              { label: "Live This Month", value: summary.liveThisMonth, color: statColor(summary.liveThisMonth, [4, 2]) },
            ].map(s => (
              <div key={s.label} style={{
                background: T.card, border: `1px solid ${T.border}`,
                padding: "18px 20px", textAlign: "center",
              }}>
                <div style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 600, color: s.color, lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
                <div style={{ fontFamily: SANS, fontSize: 9, color: T.grey2, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>{s.label}</div>
              </div>
            ))}
          </div>
          {summary.lastPublished && (
            <div style={{ fontFamily: SANS, fontSize: 11, color: T.grey, marginTop: 10, paddingLeft: 4 }}>
              Last published: <span style={{ color: T.off }}>{fmtDate(summary.lastPublished)}</span>
            </div>
          )}
        </div>
      )}

      {/* No content yet */}
      {summary && summary.totalItems === 0 && (
        <div style={{
          padding: "32px 24px", background: T.card,
          border: `1px solid ${T.border}`, borderRadius: 10,
          textAlign: "center", marginBottom: 32,
        }}>
          <div style={{ fontFamily: SERIF, fontSize: 22, color: T.off, marginBottom: 8 }}>Your content is being prepared</div>
          <p style={{ fontFamily: SANS, fontSize: 13, color: T.grey, margin: 0, lineHeight: 1.8 }}>
            Your team is currently building your content strategy.<br />
            Your first pieces will appear here once they are ready for your review.
          </p>
        </div>
      )}

      {/* Account manager */}
      {mgr?.name && (
        <div style={{
          display: "flex", alignItems: "center", gap: 16,
          padding: "16px 20px",
          background: T.card,
          border: `1px solid ${T.border}`,
          borderRadius: 10,
        }}>
          {mgr.photo ? (
            <img src={mgr.photo} alt={mgr.name} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
          ) : (
            <div style={{
              width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
              background: T.gold + "22", border: `1px solid ${T.gold}44`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: SANS, fontSize: 13, fontWeight: 700, color: T.gold,
            }}>
              {mgr.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
            </div>
          )}
          <div>
            <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: T.off, marginBottom: 2 }}>{mgr.name}</div>
            <div style={{ fontFamily: SANS, fontSize: 11, color: T.grey }}>{mgr.title || "Your Account Manager"}</div>
            {mgr.email && (
              <a href={`mailto:${mgr.email}`} style={{ fontFamily: SANS, fontSize: 11, color: T.gold, textDecoration: "none" }}>
                {mgr.email}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Coming Soon Page (for disabled-but-visible or stub sections) ───────────────
function ComingSoonPage({ label }) {
  return (
    <div style={{ padding: "80px 0", textAlign: "center" }}>
      <div style={{ fontFamily: SERIF, fontSize: 28, color: T.off, marginBottom: 12, fontWeight: 500 }}>
        {label}
      </div>
      <p style={{ fontFamily: SANS, fontSize: 13, color: T.grey, lineHeight: 1.8, maxWidth: 380, margin: "0 auto" }}>
        This section is being prepared for your account.<br />
        Your team will make it available shortly.
      </p>
    </div>
  );
}

// ── Main Portal Shell ──────────────────────────────────────────────────────────
export default function ClientPortal() {
  const { vendor, isAuthenticated, loading: authLoading } = useVendorAuth();
  const [account,  setAccount]  = useState(null);
  const [menu,     setMenu]     = useState([]);
  const [tab,      setTab]      = useState("overview");
  const [summary,  setSummary]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [sideOpen, setSideOpen] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    async function load() {
      setLoading(true);
      let acc = null;

      if (isAuthenticated && vendor?.id) {
        acc = await fetchManagedAccountByVendorId(vendor.id);
      }

      // Dev fallback: use seed account if no vendor link found
      if (!acc && import.meta.env.DEV) {
        acc = DEV_ACCOUNT;
      }

      if (acc) {
        setAccount(acc);
        const cfg = acc.portalConfig || (await fetchPortalConfig(acc.id));
        const sorted = [...(cfg?.menu || buildDefaultPortalConfig(acc.plan).menu)]
          .sort((a, b) => a.order - b.order)
          .filter(m => m.enabled);
        setMenu(sorted);
        if (sorted.length > 0) setTab(sorted[0].key);

        // Load content summary
        fetchClientContentSummary(acc.id).then(setSummary);
      }
      setLoading(false);
    }
    load();
  }, [authLoading, isAuthenticated, vendor]);

  if (authLoading || loading) {
    return (
      <div style={{
        minHeight: "100vh", background: T.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ fontFamily: SANS, fontSize: 13, color: T.grey, letterSpacing: "2px" }}>
          Loading your portal...
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div style={{
        minHeight: "100vh", background: T.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 16, padding: 32,
      }}>
        <div style={{ fontFamily: SERIF, fontSize: 28, color: T.off }}>Portal not found</div>
        <p style={{ fontFamily: SANS, fontSize: 13, color: T.grey, textAlign: "center", lineHeight: 1.8, maxWidth: 360 }}>
          Your account does not have a client portal set up yet.<br />
          Please contact your account manager.
        </p>
      </div>
    );
  }

  const SIDEBAR_W = sideOpen ? 240 : 64;

  function renderPage() {
    switch (tab) {
      case "overview":    return <OverviewPage account={account} summary={summary} />;
      case "content":     return <ComingSoonPage label="Content" />;
      case "campaigns":   return <ComingSoonPage label="Campaigns" />;
      case "performance": return <ComingSoonPage label="Performance" />;
      case "brand":       return <ComingSoonPage label="Your Brand" />;
      case "requests":    return <ComingSoonPage label="Requests" />;
      case "settings":    return <ComingSoonPage label="Settings" />;
      default:            return <ComingSoonPage label={tab} />;
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: T.bg,
      display: "flex", fontFamily: SANS,
    }}>
      {/* Sidebar */}
      <div style={{
        width: SIDEBAR_W,
        minHeight: "100vh",
        background: T.sidebar,
        borderRight: `1px solid ${T.border}`,
        display: "flex", flexDirection: "column",
        flexShrink: 0,
        transition: "width 0.2s ease",
        overflow: "hidden",
        position: "sticky", top: 0, alignSelf: "flex-start",
      }}>
        {/* Top: logo + toggle */}
        <div style={{
          padding: sideOpen ? "24px 20px 16px" : "24px 16px 16px",
          borderBottom: `1px solid ${T.border}`,
          display: "flex", alignItems: "center",
          justifyContent: sideOpen ? "space-between" : "center",
        }}>
          {sideOpen && (
            <div>
              <div style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: T.gold, letterSpacing: "0.02em", lineHeight: 1.2 }}>
                {account.name}
              </div>
              <div style={{ fontFamily: SANS, fontSize: 9, color: T.grey, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 3 }}>
                Client Portal
              </div>
            </div>
          )}
          <button
            onClick={() => setSideOpen(o => !o)}
            style={{
              background: "none", border: "none",
              color: T.grey, cursor: "pointer",
              fontSize: 16, padding: 4, lineHeight: 1, flexShrink: 0,
            }}
          >
            {sideOpen ? "←" : "→"}
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: sideOpen ? "12px 0" : "12px 0" }}>
          {menu.map(item => {
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                title={!sideOpen ? item.label : undefined}
                style={{
                  display: "flex", alignItems: "center",
                  gap: sideOpen ? 10 : 0,
                  width: "100%", padding: sideOpen ? "10px 20px" : "10px 0",
                  justifyContent: sideOpen ? "flex-start" : "center",
                  background: active ? T.gold + "14" : "none",
                  border: "none",
                  borderLeft: `2px solid ${active ? T.gold : "transparent"}`,
                  color: active ? T.gold : T.grey,
                  fontSize: sideOpen ? 13 : 16,
                  fontFamily: SANS,
                  cursor: "pointer",
                  transition: "all 0.12s",
                  textAlign: "left",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ flexShrink: 0, fontSize: 13 }}>{item.icon}</span>
                {sideOpen && (
                  <span style={{ fontWeight: active ? 600 : 400 }}>{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom: logout */}
        <div style={{
          padding: sideOpen ? "12px 20px 24px" : "12px 16px 24px",
          borderTop: `1px solid ${T.border}`,
        }}>
          <button
            onClick={() => window.location.href = "/vendor/login"}
            title={!sideOpen ? "Sign out" : undefined}
            style={{
              display: "flex", alignItems: "center",
              gap: sideOpen ? 8 : 0,
              justifyContent: sideOpen ? "flex-start" : "center",
              width: "100%", background: "none", border: "none",
              color: T.grey2, fontSize: 11,
              fontFamily: SANS, cursor: "pointer", padding: "6px 0",
            }}
          >
            <span style={{ fontSize: 12 }}>⊠</span>
            {sideOpen && "Sign out"}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{
        flex: 1, padding: "48px 56px",
        maxWidth: 860, margin: "0 auto",
        minWidth: 0,
      }}>
        {renderPage()}
      </div>
    </div>
  );
}
