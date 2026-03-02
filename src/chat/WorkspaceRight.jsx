// ─── src/chat/WorkspaceRight.jsx ──────────────────────────────────────────────
import { useState } from "react";
import { useChat }         from "./ChatContext";
import RecommendationCard  from "./RecommendationCard";
import QuickViewModal      from "../components/modals/QuickViewModal";
import Icon                from "./Icons";

const GOLD = "#C9A84C";

// ── Theme helper ───────────────────────────────────────────────────────────────
function getT(dark) {
  if (dark) return {
    bg:      "#0D0B09",
    text:    "#FFFFFF",
    grey:    "rgba(255,255,255,0.42)",
    divider: "rgba(201,168,76,0.16)",
    emptyBg: "none",
  };
  return {
    bg:      "#f3efeb",
    text:    "#1A1714",
    grey:    "rgba(26,23,20,0.45)",
    divider: "rgba(26,23,20,0.1)",
    emptyBg: "none",
  };
}

// ── Collapsed state ────────────────────────────────────────────────────────────
function CollapsedRight({ itemCount, darkMode }) {
  const T = getT(darkMode);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0", gap: 20, height: "100%" }}>
      <Icon name="sparkleMini" size={16} color={GOLD} style={{ opacity: 0.75 }} />
      {itemCount > 0 && (
        <div style={{
          background: GOLD, color: "#0D0B09",
          width: 26, height: 26, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 800, fontFamily: "var(--font-body)",
        }}>
          {itemCount > 9 ? "9+" : itemCount}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function WorkspaceRight({ collapsed, darkMode }) {
  const { recommendations } = useChat();
  const { items = [], summary = "Curated for you" } = recommendations ?? {};
  const [qvItem, setQvItem] = useState(null);
  const T = getT(darkMode);

  if (collapsed) {
    return <CollapsedRight itemCount={items.length} darkMode={darkMode} />;
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: T.bg, boxSizing: "border-box", transition: "background 0.3s ease" }}>

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, padding: "18px 18px 13px", borderBottom: `1px solid ${T.divider}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: "var(--font-heading-primary)", fontSize: 17, fontWeight: 500, color: T.text }}>
            Curated for you
          </div>
          {items.length > 0 && (
            <span style={{
              background: "rgba(201,168,76,0.12)",
              border:    `1px solid rgba(201,168,76,0.28)`,
              color:      GOLD,
              fontSize:   10,
              fontWeight: 700,
              fontFamily: "var(--font-body)",
              padding:    "2px 8px",
              borderRadius: 12,
            }}>
              {items.length} result{items.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: T.grey, opacity: 0.7, marginTop: 4 }}>
          {summary}
        </div>
      </div>

      {/* ── Scrollable cards ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 20px" }}>
        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "56px 12px", fontFamily: "var(--font-body)", fontSize: 13, color: T.grey, opacity: 0.5, lineHeight: 1.65 }}>
            <div style={{ marginBottom: 12, opacity: 0.4 }}><Icon name="sparkle" size={28} color={GOLD} /></div>
            Ask Aura about venues, regions, or vendors to see curated recommendations here.
          </div>
        ) : (
          items.map((item) => (
            <RecommendationCard
              key={item.id}
              item={item}
              darkMode={darkMode}
              onQuickView={setQvItem}
              onViewFull={setQvItem}
            />
          ))
        )}
      </div>

      {/* Quick View modal */}
      {qvItem && (
        <QuickViewModal
          item={qvItem}
          onClose={() => setQvItem(null)}
          onViewFull={() => setQvItem(null)}
        />
      )}
    </div>
  );
}
