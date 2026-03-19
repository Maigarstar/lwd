// ─── src/chat/WorkspaceLeft.jsx ───────────────────────────────────────────────
import { useState } from "react";
import { useChat }      from "./ChatContext";
import { useShortlist } from "../shortlist/ShortlistContext";
import Icon             from "./Icons";
import SaveChatModal    from "./SaveChatModal";

const GOLD    = "#C9A84C";

// ── Context-aware suggested questions ─────────────────────────────────────────
function getQuickAsks(activeContext) {
  const { page, country, region, compareVenues = [] } = activeContext || {};

  // Compare mode — questions about the specific venues being evaluated
  if (page === 'compare' && compareVenues.length > 0) {
    const names = compareVenues.map(v => v.name);
    const first = names[0];
    const second = names[1];
    return [
      second
        ? `What's the key difference between ${first} and ${second}?`
        : `Tell me more about ${first}`,
      "Which of these venues offers exclusive use?",
      "Which venue is better for an intimate wedding under 80 guests?",
      "What are the travel options for guests at each venue?",
      "Which venue has the stronger reputation for food and service?",
      "What time of year is best for each of these venues?",
    ];
  }

  // Region-specific suggestions
  if (region && region !== 'All regions') {
    return [
      `Show me the top-rated venues in ${region}`,
      `Which ${region} venues offer exclusive use?`,
      `Find photographers based near ${region}`,
      `What's the best season to wed in ${region}?`,
      "What's included in typical venue packages?",
      "Find a venue with accommodation on site",
    ];
  }

  // Country-specific suggestions
  if (country) {
    return [
      `Show me luxury venues in ${country} for 100+ guests`,
      `Which venues in ${country} have a romantic style?`,
      `Find a wedding planner based in ${country}`,
      "What venues offer exclusive hire?",
      "What's included in typical venue packages?",
      "Show me venues available for winter weddings",
    ];
  }

  // General fallback
  return [
    "Find me a luxury venue for 80 guests",
    "What venues offer full exclusive use?",
    "Show me venues with a romantic or historic style",
    "What's typically included in a venue package?",
    "Find a wedding planner in Europe",
    "Which venues are available in summer?",
  ];
}

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
  const { sendMessage, clearHistory, messages, activeContext } = useChat();
  const { items: shortlist }                    = useShortlist();
  const T = getT(darkMode);

  const [confirmNew,    setConfirmNew]    = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

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
        flexDirection: "column", gap: 22, padding: "20px 18px 28px", boxSizing: "border-box",
      }}
    >
      {/* ── New Chat button ───────────────────────────────────────────────── */}
      {!confirmNew ? (
        <button
          onClick={handleNewChat}
          style={{
            background:     GOLD,
            border:        "none",
            color:         "#0D0B09",
            padding:       "11px 0",
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
            boxShadow:     "0 2px 8px rgba(201,168,76,0.25)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#D4B35A"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(201,168,76,0.35)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = GOLD;      e.currentTarget.style.boxShadow = "0 2px 8px rgba(201,168,76,0.25)"; }}
        >
          <Icon name="edit" size={13} /> New Chat
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

      {/* ── Secondary actions (lighter, borderless) ─────────────────────── */}
      <div style={{ display: "flex", gap: 8 }}>
        {messages.length > 1 && (
          <button
            onClick={() => setShowSaveModal(true)}
            style={{
              background:   "none",
              border:        "none",
              color:          T.grey,
              padding:       "6px 0",
              fontFamily:   "var(--font-body)",
              fontSize:       11,
              cursor:        "pointer",
              textAlign:     "left",
              flexShrink:     0,
              transition:    "all 0.2s",
              display:       "flex",
              alignItems:    "center",
              gap:            5,
              letterSpacing: "0.2px",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = GOLD; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = T.grey; }}
          >
            <Icon name="bookmark" size={11} /> Save
          </button>
        )}
        {onBack && (
          <button
            onClick={onBack}
            style={{
              background:   "none",
              border:        "none",
              color:          T.grey,
              padding:       "6px 0",
              fontFamily:   "var(--font-body)",
              fontSize:       11,
              cursor:        "pointer",
              textAlign:     "left",
              flexShrink:     0,
              transition:    "all 0.2s",
              display:       "flex",
              alignItems:    "center",
              gap:            5,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = T.text; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = T.grey; }}
          >
            <Icon name="close" size={10} /> Close
          </button>
        )}
      </div>

      {/* ── Active Context ────────────────────────────────────────────────── */}
      {activeContext && (activeContext.page === 'compare'
        ? activeContext.compareVenues?.length > 0
        : (activeContext.country || (activeContext.region && activeContext.region !== 'All regions'))
      ) && (
        <Section label="Active Context" T={T}>
          <div style={{ background: T.rowBg, border: `1px solid ${T.divider}`, borderRadius: 6, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
            {activeContext.page === 'compare' ? (
              activeContext.compareVenues.map((v) => (
                <ContextRow key={v.id} icon={<Icon name="heart" size={12} color={GOLD} />} text={v.name} T={T} />
              ))
            ) : (
              <>
                {activeContext.country && (
                  <ContextRow icon={<Icon name="globe" size={12} color={GOLD} />} text={activeContext.country} T={T} />
                )}
                {activeContext.region && activeContext.region !== 'All regions' && (
                  <ContextRow icon={<Icon name="mapPin" size={12} color={GOLD} />} text={activeContext.region} T={T} />
                )}
              </>
            )}
          </div>
        </Section>
      )}

      {/* ── Quick Asks, elegant suggestion chips ─────────────────────────── */}
      <Section label="Suggested" T={T}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {getQuickAsks(activeContext).map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              style={{
                background:   T.btnBg,
                border:        "none",
                borderRadius:  20,
                padding:      "7px 13px",
                fontFamily:   "var(--font-body)",
                fontSize:      11,
                color:          T.grey,
                cursor:        "pointer",
                textAlign:     "left",
                lineHeight:    1.35,
                transition:   "all 0.2s",
                whiteSpace:   "nowrap",
                overflow:     "hidden",
                textOverflow: "ellipsis",
                maxWidth:     "100%",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = T.btnHov; e.currentTarget.style.color = GOLD; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = T.btnBg; e.currentTarget.style.color = T.grey; }}
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

      {/* ── Save Chat Modal ─────────────────────────────────────────────────── */}
      {showSaveModal && (
        <SaveChatModal onClose={() => setShowSaveModal(false)} />
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
