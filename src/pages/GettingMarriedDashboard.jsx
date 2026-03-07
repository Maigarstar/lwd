// ─── src/pages/GettingMarriedDashboard.jsx ─────────────────────────────────
// Couples dashboard for wedding planning with shortlist preview, enquiries, and account

import { useTheme } from "../theme/ThemeContext";
import { useShortlist } from "../shortlist/ShortlistContext";
import { GLOBAL_VENDORS } from "../data/globalVendors";
import ShortlistButton from "../components/buttons/ShortlistButton";
import { track } from "../utils/track";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

export default function GettingMarriedDashboard({ onBack }) {
  const C = useTheme();
  const { items: shortlistItems, toggleItem, isShortlisted } = useShortlist();

  // Get shortlist items with vendor data
  const shortlistWithData = shortlistItems.slice(0, 3).map((item) => {
    const vendor = GLOBAL_VENDORS.find((v) => v.id === item.item_id);
    return { ...item, vendorData: vendor };
  });

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

        {/* Quick Navigation Links */}
        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <NavLink label="My Shortlist" icon="♥" count={shortlistItems.length} color={C} />
          <NavLink label="Enquiries" icon="✉" count={3} color={C} />
          <NavLink label="Account" icon="⚙" color={C} />
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
            Your Wedding Planning
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
            Everything you need to plan your luxury celebration
          </p>
        </div>

        {/* Shortlist Preview Section */}
        <section style={{ marginBottom: 80 }}>
          <div style={{ marginBottom: 32 }}>
            <h2
              style={{
                fontFamily: GD,
                fontSize: 28,
                color: C.off,
                margin: 0,
                marginBottom: 8,
                fontWeight: 400,
              }}
            >
              ♥ My Shortlist
            </h2>
            <p
              style={{
                fontFamily: NU,
                fontSize: 14,
                color: C.grey,
                margin: 0,
              }}
            >
              {shortlistItems.length === 0
                ? "Start saving your favorite venues and vendors to build your perfect wedding story."
                : `${shortlistItems.length} saved ${shortlistItems.length === 1 ? "item" : "items"} — view all in your full shortlist`}
            </p>
          </div>

          {shortlistItems.length === 0 ? (
            <div
              style={{
                background: C.card,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                padding: 60,
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: 48, margin: 0 }}>♡</p>
              <h3
                style={{
                  fontFamily: GD,
                  fontSize: 20,
                  color: C.off,
                  margin: "16px 0 8px 0",
                  fontWeight: 400,
                }}
              >
                Your Shortlist is Empty
              </h3>
              <p
                style={{
                  fontFamily: NU,
                  fontSize: 14,
                  color: C.grey,
                  margin: 0,
                }}
              >
                Browse our curated collection of luxury venues and vendors
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 24,
              }}
            >
              {shortlistWithData.map((item) =>
                item.vendorData ? (
                  <ShortlistPreviewCard
                    key={item.id}
                    vendor={item.vendorData}
                    theme={C}
                    isShortlisted={isShortlisted(item.item_id)}
                    onToggle={(id) => {
                      track("shortlist_remove_from_dashboard", { itemId: id });
                      toggleItem({ id });
                    }}
                  />
                ) : null
              )}
            </div>
          )}

          {shortlistItems.length > 0 && (
            <div style={{ marginTop: 24, textAlign: "center" }}>
              <button
                onClick={() => (window.location.href = "/shortlist")}
                style={{
                  background: "transparent",
                  color: C.gold,
                  border: `1px solid ${C.gold}`,
                  borderRadius: "var(--lwd-radius-input)",
                  padding: "12px 32px",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  fontFamily: NU,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = C.gold;
                  e.currentTarget.style.color = "#0a0906";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = C.gold;
                }}
              >
                View All {shortlistItems.length} Saved Items
              </button>
            </div>
          )}
        </section>

        {/* Enquiries Section */}
        <section style={{ marginBottom: 80 }}>
          <h2
            style={{
              fontFamily: GD,
              fontSize: 28,
              color: C.off,
              margin: 0,
              marginBottom: 32,
              fontWeight: 400,
            }}
          >
            ✉ Recent Enquiries
          </h2>

          <div
            style={{
              background: C.card,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              padding: 40,
              textAlign: "center",
            }}
          >
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
              }}
            >
              Track all your vendor enquiries and responses in one place. Messages from venues and vendors will appear here.
            </p>
          </div>
        </section>

        {/* Account & Preferences Section */}
        <section style={{ marginBottom: 80 }}>
          <h2
            style={{
              fontFamily: GD,
              fontSize: 28,
              color: C.off,
              margin: 0,
              marginBottom: 32,
              fontWeight: 400,
            }}
          >
            ⚙ Account & Preferences
          </h2>

          <div
            style={{
              background: C.card,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              padding: 40,
              textAlign: "center",
            }}
          >
            <h3
              style={{
                fontFamily: GD,
                fontSize: 20,
                color: C.off,
                margin: "0 0 8px 0",
                fontWeight: 400,
              }}
            >
              Settings Coming Soon
            </h3>
            <p
              style={{
                fontFamily: NU,
                fontSize: 14,
                color: C.grey,
                margin: 0,
              }}
            >
              Manage your profile, notification preferences, and privacy settings
            </p>
          </div>
        </section>

        {/* Wedding Planning Tools Section */}
        <section style={{ marginBottom: 40 }}>
          <h2
            style={{
              fontFamily: GD,
              fontSize: 28,
              color: C.off,
              margin: 0,
              marginBottom: 32,
              fontWeight: 400,
            }}
          >
            📋 Wedding Planning Tools
          </h2>

          <div
            style={{
              background: `linear-gradient(135deg, ${C.card} 0%, rgba(201,168,76,0.05) 100%)`,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              padding: 60,
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 48, margin: 0 }}>🎊</p>
            <h3
              style={{
                fontFamily: GD,
                fontSize: 20,
                color: C.off,
                margin: "16px 0 8px 0",
                fontWeight: 400,
              }}
            >
              Comprehensive Planning Tools Coming Soon
            </h3>
            <p
              style={{
                fontFamily: NU,
                fontSize: 14,
                color: C.grey,
                margin: 0,
              }}
            >
              Timeline, budgets, guest lists, and more — arriving soon to make wedding planning effortless
            </p>
          </div>
        </section>

        {/* Logout Button */}
        <div style={{ textAlign: "center", paddingTop: 40, borderTop: `1px solid ${C.border}` }}>
          <button
            onClick={() => {
              track("dashboard_logout");
              onBack?.();
            }}
            style={{
              background: "transparent",
              color: C.grey,
              border: `1px solid ${C.border}`,
              borderRadius: "var(--lwd-radius-input)",
              padding: "12px 32px",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: NU,
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
      </main>
    </div>
  );
}

// Navigation link component
function NavLink({ label, icon, count, color: C }) {
  return (
    <button
      style={{
        background: "transparent",
        color: C.off,
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
        e.currentTarget.style.background = `rgba(201,168,76,0.1)`;
        e.currentTarget.style.color = C.gold;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = C.off;
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span>{icon}</span>
        {label}
      </span>
      {count !== undefined && count > 0 && (
        <span
          style={{
            background: C.gold,
            color: "#0a0906",
            padding: "2px 8px",
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// Shortlist preview card component
function ShortlistPreviewCard({ vendor, theme: C, isShortlisted, onToggle }) {
  const images = vendor.imgs || [];
  const mainImage = images[0];

  return (
    <div
      style={{
        background: C.card,
        borderRadius: 8,
        overflow: "hidden",
        border: `1px solid ${C.border}`,
        transition: "all 0.3s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = C.gold;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.border;
      }}
    >
      {mainImage && (
        <div
          style={{
            width: "100%",
            height: 200,
            backgroundImage: `url(${mainImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
          }}
        >
          <button
            onClick={() => onToggle(vendor.id)}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(0, 0, 0, 0.6)",
              border: "none",
              color: C.gold,
              fontSize: 18,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0, 0, 0, 0.9)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(0, 0, 0, 0.6)";
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div style={{ padding: 16 }}>
        <h3
          style={{
            fontFamily: GD,
            fontSize: 16,
            color: C.off,
            margin: "0 0 6px 0",
            fontWeight: 400,
          }}
        >
          {vendor.name}
        </h3>

        <p
          style={{
            fontFamily: NU,
            fontSize: 11,
            color: C.grey,
            margin: "0 0 10px 0",
          }}
        >
          {vendor.city}, {vendor.country}
        </p>

        {vendor.price && (
          <p
            style={{
              fontFamily: NU,
              fontSize: 12,
              color: C.gold,
              fontWeight: 600,
              margin: 0,
            }}
          >
            From {vendor.price}
          </p>
        )}
      </div>
    </div>
  );
}
