// ─── src/chat/WorkspaceLeft.jsx ───────────────────────────────────────────────
import { useState } from "react";
import { useChat }      from "./ChatContext";
import { useShortlist } from "../shortlist/ShortlistContext";
import Icon             from "./Icons";

const GOLD    = "#C9A84C";

const QUICK_ASKS = [
  "What venues have capacity for 100+ guests?",
  "Show me Tuscany venues with a romantic style",
  "Find photographers near Lake Como",
  "Wedding planner on the Amalfi Coast",
  "What's included in venue packages?",
  "Venues available for winter weddings",
];

// ── Theme helper ───────────────────────────────────────────────────────────────
function getT(dark) {
  if (dark) return {
    text:    "#FFFFFF",
    grey:    "rgba(255,255,255,0.42)",
    divider: "rgba(201,168,76,0.16)",
    rowBg:   "rgba(255,255,255,0.03)",
    btnBg:   "rgba(201,168,76,0.08)",
    btnHov:  "rgba(201,168,76,0.16)",
    iconBg:  "rgba(255,255,255,0.03)",
    iconHov: "rgba(255,255,255,0.07)",
    sectionLbl: "rgba(255,255,255,0.42)",
  };
  return {
    text:    "#1A1714",
    grey:    "rgba(26,23,20,0.45)",
    divider: "rgba(26,23,20,0.1)",
    rowBg:   "rgba(26,23,20,0.04)",
    btnBg:   "rgba(201,168,76,0.08)",
    btnHov:  "rgba(201,168,76,0.16)",
    iconBg:  "rgba(26,23,20,0.05)",
    iconHov: "rgba(26,23,20,0.1)",
    sectionLbl: "rgba(26,23,20,0.4)",
  };
}

// ── Collapsed icon rail ────────────────────────────────────────────────────────
function CollapsedRail({ onNewChat, shortlistCount, darkMode }) {
  const T = getT(darkMode);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0", gap: 16, height: "100%", overflowY: "auto" }}>
      <IconPill icon={<Icon name="edit" size={15} />} label="New Chat" gold onClick={onNewChat} T={T} />
      <IconPill icon={<Icon name="globe" size={15} />} label="Context" T={T} />
      <IconPill icon={<Icon name="messageCircle" size={15} />} label="Quick Asks" T={T} />
      <div style={{ position: "relative" }}>
        <IconPill icon={<Icon name="heart" size={15} />} label="Shortlist" T={T} />
        {shortlistCount > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            background: GOLD, color: "#0D0B09",
            width: 15, height: 15, borderRadius: "50%",
            fontSize: 8, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {shortlistCount > 9 ? "9+" : shortlistCount}
          </span>
        )}
      </div>
    </div>
  );
}

function IconPill({ icon, label, gold, onClick, T }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 36, height: 36, borderRadius: "50%",
        background:  hov ? (gold ? "rgba(201,168,76,0.2)" : T.iconHov) : (gold ? "rgba(201,168,76,0.08)" : T.iconBg),
        border:     `1px solid ${hov || gold ? "rgba(201,168,76,0.35)" : T.divider}`,
        color:       gold ? GOLD : (hov ? T.text : T.grey),
        cursor:      onClick ? "pointer" : "default",
        display:    "flex", alignItems: "center", justifyContent: "center",
        fontSize: 15, transition: "all 0.2s", flexShrink: 0,
      }}
    >{icon}</button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function WorkspaceLeft({ collapsed, onBack, darkMode }) {
  const { sendMessage, clearHistory, messages } = useChat();
  const { items: shortlist }                    = useShortlist();
  const T = getT(darkMode);

  const [confirmNew, setConfirmNew] = useState(false);

  const handleNewChat = () => {
    if (messages.length > 1) setConfirmNew(true);
    else clearHistory();
  };
  const confirmAndClear = () => { clearHistory(); setConfirmNew(false); };

  if (collapsed) {
    return <CollapsedRail onNewChat={handleNewChat} shortlistCount={shortlist.length} darkMode={darkMode} />;
  }

  return (
    <div
      style={{
        height: "100%", overflowY: "auto", display: "flex",
        flexDirection: "column", gap: 18, padding: "18px 16px 24px", boxSizing: "border-box",
      }}
    >
      {/* ── New Chat button ───────────────────────────────────────────────── */}
      {!confirmNew ? (
        <button
          onClick={handleNewChat}
          style={{
            background:    T.btnBg,
            border:       `1px solid rgba(201,168,76,0.28)`,
            color:          GOLD,
            padding:       "9px 0",
            borderRadius:   6,
            fontFamily:    "var(--font-body)",
            fontSize:       11,
            fontWeight:     700,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            cursor:        "pointer",
            width:         "100%",
            display:       "flex",
            alignItems:    "center",
            justifyContent: "center",
            gap:            6,
            transition:    "all 0.2s",
            flexShrink:     0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = T.btnHov; e.currentTarget.style.borderColor = GOLD; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = T.btnBg;  e.currentTarget.style.borderColor = "rgba(201,168,76,0.28)"; }}
        >
          + New Chat
        </button>
      ) : (
        <div style={{ background: "rgba(201,168,76,0.07)", border: `1px solid rgba(201,168,76,0.25)`, borderRadius: 6, padding: "12px 14px", flexShrink: 0 }}>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: T.text, marginBottom: 10, lineHeight: 1.45 }}>
            Start a fresh conversation? Your current chat will be cleared.
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={confirmAndClear}
              style={{ flex: 1, background: GOLD, border: "none", color: "#0D0B09", padding: "7px 0", borderRadius: 5, fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: "0.5px" }}
            >Yes, clear</button>
            <button
              onClick={() => setConfirmNew(false)}
              style={{ flex: 1, background: "none", border: `1px solid ${T.divider}`, color: T.grey, padding: "7px 0", borderRadius: 5, fontFamily: "var(--font-body)", fontSize: 11, cursor: "pointer" }}
            >Cancel</button>
          </div>
        </div>
      )}

      {/* ── Back to directory ─────────────────────────────────────────────── */}
      {onBack && (
        <button
          onClick={onBack}
          style={{
            background:   "none",
            border:      `1px solid ${T.divider}`,
            color:          T.grey,
            padding:      "7px 12px",
            borderRadius:   5,
            fontFamily:   "var(--font-body)",
            fontSize:       11,
            cursor:        "pointer",
            textAlign:     "left",
            width:         "100%",
            flexShrink:     0,
            transition:    "all 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = darkMode ? "rgba(255,255,255,0.25)" : "rgba(26,23,20,0.3)"; e.currentTarget.style.color = T.text; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.divider; e.currentTarget.style.color = T.grey; }}
        >
          <Icon name="arrowLeft" size={12} style={{ marginRight: 4 }} /> Directory
        </button>
      )}

      {/* ── Active Context ────────────────────────────────────────────────── */}
      <Section label="Active Context" T={T}>
        <div style={{ background: T.rowBg, border: `1px solid ${T.divider}`, borderRadius: 6, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
          <ContextRow icon={<Icon name="globe" size={12} color={GOLD} />} text="Italy"       T={T} />
          <ContextRow icon={<Icon name="mapPin" size={12} color={GOLD} />} text="All regions" T={T} dim />
        </div>
      </Section>

      {/* ── Quick Asks ────────────────────────────────────────────────────── */}
      <Section label="Quick Asks" T={T}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {QUICK_ASKS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              style={{
                background:   "none",
                border:      `1px solid ${T.divider}`,
                borderRadius:  5,
                padding:      "7px 10px",
                fontFamily:   "var(--font-body)",
                fontSize:      11,
                color:          T.text,
                cursor:        "pointer",
                textAlign:     "left",
                lineHeight:    1.38,
                opacity:        0.7,
                transition:   "all 0.15s",
                width:         "100%",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.borderColor = GOLD; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.7"; e.currentTarget.style.borderColor = T.divider; }}
            >{q}</button>
          ))}
        </div>
      </Section>

      {/* ── Shortlist ─────────────────────────────────────────────────────── */}
      {shortlist.length > 0 && (
        <Section label={`Shortlist (${shortlist.length})`} T={T}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {shortlist.slice(0, 5).map((item) => (
              <div
                key={item.id}
                style={{ display: "flex", alignItems: "center", gap: 9, background: T.rowBg, border: `1px solid ${T.divider}`, borderRadius: 5, padding: "6px 8px", overflow: "hidden" }}
              >
                <div style={{ width: 34, height: 34, borderRadius: 4, overflow: "hidden", flexShrink: 0, background: darkMode ? "#0a0806" : "#e0dbd4" }}>
                  <img src={item.imgs?.[0] ?? ""} alt={item.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 9, color: T.grey }}>{item.region}</div>
                </div>
              </div>
            ))}
            {shortlist.length > 5 && (
              <div style={{ fontFamily: "var(--font-body)", fontSize: 10, color: T.grey, opacity: 0.5, textAlign: "center", padding: "2px 0" }}>
                +{shortlist.length - 5} more saved
              </div>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}

// ── Tiny helpers ───────────────────────────────────────────────────────────────
function Section({ label, children, T }) {
  return (
    <div style={{ flexShrink: 0 }}>
      <div style={{ fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: T.sectionLbl, opacity: 0.65, marginBottom: 8, fontFamily: "var(--font-body)" }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function ContextRow({ icon, text, dim, T }) {
  return (
    <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: dim ? T.grey : T.text, opacity: dim ? 0.55 : 1, display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 13 }}>{icon}</span>
      {text}
    </div>
  );
}
