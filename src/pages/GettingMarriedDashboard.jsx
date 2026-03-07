// ─── src/pages/GettingMarriedDashboard.jsx ─────────────────────────────────
// Couples dashboard for wedding planning with shortlist, enquiries, and timeline

import { useState } from "react";
import { useTheme } from "../theme/ThemeContext";
import { useShortlist } from "../shortlist/ShortlistContext";
import ShortlistPage from "./ShortlistPage";
import { track } from "../utils/track";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

export default function GettingMarriedDashboard({ onBack }) {
  const C = useTheme();
  const { items: shortlistItems } = useShortlist();
  const [activeTab, setActiveTab] = useState("shortlist"); // shortlist, enquiries, timeline, settings

  const tabs = [
    { id: "shortlist", label: "My Shortlist", icon: "♥", count: shortlistItems.length },
    { id: "enquiries", label: "Enquiries", icon: "✉", count: 3 },
    { id: "timeline", label: "Timeline", icon: "📅", count: 0 },
    { id: "settings", label: "Settings", icon: "⚙", count: 0 },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.black }}>
      {/* ─── SIDEBAR ─── */}
      <aside
        style={{
          width: 280,
          background: C.card,
          borderRight: `1px solid ${C.border}`,
          padding: "40px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 32,
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div>
          <h1
            style={{
              fontFamily: GD,
              fontSize: 24,
              color: C.off,
              margin: 0,
              marginBottom: 8,
              fontWeight: 400,
            }}
          >
            Getting Married
          </h1>
          <p
            style={{
              fontFamily: NU,
              fontSize: 12,
              color: C.grey,
              margin: 0,
              fontWeight: 300,
            }}
          >
            Plan your luxury wedding
          </p>
        </div>

        {/* Navigation Tabs */}
        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                track("dashboard_tab_click", { tab: tab.id });
                setActiveTab(tab.id);
              }}
              style={{
                background: activeTab === tab.id ? C.gold : "transparent",
                color: activeTab === tab.id ? "#0a0906" : C.off,
                border: "none",
                borderRadius: "var(--lwd-radius-input)",
                padding: "12px 16px",
                fontFamily: NU,
                fontSize: 14,
                fontWeight: 600,
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.background = `rgba(201,168,76,0.1)`;
                  e.currentTarget.style.color = C.gold;
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = C.off;
                }
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>{tab.icon}</span>
                {tab.label}
              </span>
              {tab.count > 0 && (
                <span
                  style={{
                    background: activeTab === tab.id ? "rgba(0,0,0,0.3)" : C.gold,
                    color: activeTab === tab.id ? C.off : "#0a0906",
                    padding: "2px 8px",
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Stats */}
        <div
          style={{
            borderTop: `1px solid ${C.border}`,
            paddingTop: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div>
            <p
              style={{
                fontFamily: NU,
                fontSize: 11,
                color: C.grey,
                margin: "0 0 8px 0",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontWeight: 600,
              }}
            >
              Saved Items
            </p>
            <p
              style={{
                fontFamily: GD,
                fontSize: 32,
                color: C.gold,
                margin: 0,
                fontWeight: 400,
              }}
            >
              {shortlistItems.length}
            </p>
          </div>

          <div>
            <p
              style={{
                fontFamily: NU,
                fontSize: 11,
                color: C.grey,
                margin: "0 0 8px 0",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontWeight: 600,
              }}
            >
              Active Enquiries
            </p>
            <p
              style={{
                fontFamily: GD,
                fontSize: 32,
                color: C.gold,
                margin: 0,
                fontWeight: 400,
              }}
            >
              3
            </p>
          </div>
        </div>

        {/* Logout */}
        <div style={{ marginTop: "auto" }}>
          <button
            onClick={() => {
              track("dashboard_logout");
              onBack?.();
            }}
            style={{
              width: "100%",
              background: "transparent",
              color: C.grey,
              border: `1px solid ${C.border}`,
              borderRadius: "var(--lwd-radius-input)",
              padding: "10px 16px",
              fontFamily: NU,
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.rose;
              e.currentTarget.style.color = C.rose;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.color = C.grey;
            }}
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main
        style={{
          flex: 1,
          padding: "40px 60px",
          overflowY: "auto",
          maxHeight: "100vh",
        }}
      >
        {/* Page Header */}
        <div style={{ marginBottom: 48 }}>
          <h2
            style={{
              fontFamily: GD,
              fontSize: "clamp(28px, 4vw, 48px)",
              color: C.off,
              fontWeight: 400,
              margin: 0,
              marginBottom: 8,
            }}
          >
            {tabs.find((t) => t.id === activeTab)?.label}
          </h2>
          <p
            style={{
              fontFamily: NU,
              fontSize: 14,
              color: C.grey,
              margin: 0,
              fontWeight: 300,
            }}
          >
            {activeTab === "shortlist" && "Manage your saved venues and vendors"}
            {activeTab === "enquiries" && "Track your enquiries and vendor responses"}
            {activeTab === "timeline" && "Plan your wedding timeline and milestones"}
            {activeTab === "settings" && "Manage your account and preferences"}
          </p>
        </div>

        {/* Shortlist Tab */}
        {activeTab === "shortlist" && <ShortlistPage />}

        {/* Enquiries Tab */}
        {activeTab === "enquiries" && (
          <div
            style={{
              background: C.card,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              padding: 40,
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: GD,
                fontSize: 24,
                color: C.off,
                margin: "0 0 16px 0",
              }}
            >
              ✉
            </p>
            <h3
              style={{
                fontFamily: GD,
                fontSize: 20,
                color: C.off,
                margin: "0 0 8px 0",
                fontWeight: 400,
              }}
            >
              Enquiries Coming Soon
            </h3>
            <p
              style={{
                fontFamily: NU,
                fontSize: 14,
                color: C.grey,
                margin: 0,
                maxWidth: 400,
              }}
            >
              Track all your vendor enquiries and responses in one place. Messages from venues and vendors will appear here.
            </p>
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === "timeline" && (
          <div
            style={{
              background: C.card,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              padding: 40,
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: GD,
                fontSize: 24,
                color: C.off,
                margin: "0 0 16px 0",
              }}
            >
              📅
            </p>
            <h3
              style={{
                fontFamily: GD,
                fontSize: 20,
                color: C.off,
                margin: "0 0 8px 0",
                fontWeight: 400,
              }}
            >
              Wedding Timeline Coming Soon
            </h3>
            <p
              style={{
                fontFamily: NU,
                fontSize: 14,
                color: C.grey,
                margin: 0,
                maxWidth: 400,
              }}
            >
              Create a personalized timeline with key milestones, vendor deadlines, and planning checklists for your wedding day.
            </p>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div
            style={{
              background: C.card,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              padding: 40,
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: GD,
                fontSize: 24,
                color: C.off,
                margin: "0 0 16px 0",
              }}
            >
              ⚙
            </p>
            <h3
              style={{
                fontFamily: GD,
                fontSize: 20,
                color: C.off,
                margin: "0 0 8px 0",
                fontWeight: 400,
              }}
            >
              Account Settings Coming Soon
            </h3>
            <p
              style={{
                fontFamily: NU,
                fontSize: 14,
                color: C.grey,
                margin: 0,
                maxWidth: 400,
              }}
            >
              Update your profile, notification preferences, and privacy settings.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
