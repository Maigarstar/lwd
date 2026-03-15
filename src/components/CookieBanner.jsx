// ─── src/components/CookieBanner.jsx ─────────────────────────────────────────
// GDPR-compliant cookie acceptance banner, fixed bottom strip.
// Saves acceptance to localStorage so it only shows once.
// Hides automatically when the Aura full workspace is open.
import { useState, useEffect } from "react";
import { useChat } from "../chat/ChatContext";

const STORAGE_KEY = "lwd_cookies_accepted";

const GOLD    = "#C9A84C";
const DARK    = "#0D0B09";
const DIVIDER = "rgba(201,168,76,0.18)";

// ── Manage Preferences modal ───────────────────────────────────────────────────
function PrefsModal({ onClose, onSave }) {
  const [prefs, setPrefs] = useState({
    essential:  true,   // always on, not toggleable
    analytics:  false,
    marketing:  false,
  });

  const toggle = (key) =>
    setPrefs((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cookie preferences"
      style={{
        position:   "fixed",
        inset:       0,
        zIndex:      2000,
        background: "rgba(0,0,0,0.72)",
        display:    "flex",
        alignItems: "center",
        justifyContent: "center",
        padding:    "20px",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background:   "#141210",
          border:      `1px solid ${DIVIDER}`,
          borderRadius:  10,
          padding:      "28px 28px 24px",
          maxWidth:      480,
          width:        "100%",
          fontFamily:   "var(--font-body)",
        }}
      >
        {/* Header */}
        <div
          style={{
            fontFamily:   "var(--font-heading-primary)",
            fontSize:      22,
            fontWeight:    500,
            color:        "#FFFFFF",
            marginBottom:  6,
          }}
        >
          Cookie Preferences
        </div>
        <p
          style={{
            fontSize:     13,
            color:       "rgba(255,255,255,0.5)",
            lineHeight:   1.6,
            marginBottom: 22,
          }}
        >
          Choose which cookies you allow. Essential cookies are required for the
          site to function and cannot be disabled.
        </p>

        {/* Toggles */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
          <PrefRow
            label="Essential"
            desc="Required for login, navigation and security."
            checked={true}
            disabled={true}
          />
          <PrefRow
            label="Analytics"
            desc="Help us understand how visitors use the site."
            checked={prefs.analytics}
            onChange={() => toggle("analytics")}
          />
          <PrefRow
            label="Marketing"
            desc="Used to show personalised venue and vendor suggestions."
            checked={prefs.marketing}
            onChange={() => toggle("marketing")}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => onSave(prefs)}
            style={{
              flex:          1,
              background:    GOLD,
              border:       "none",
              color:        "#0D0B09",
              padding:      "11px 0",
              borderRadius:   6,
              fontFamily:   "var(--font-body)",
              fontSize:      12,
              fontWeight:    700,
              letterSpacing: "1px",
              textTransform: "uppercase",
              cursor:        "pointer",
            }}
          >
            Save Preferences
          </button>
          <button
            onClick={onClose}
            style={{
              flex:        1,
              background: "none",
              border:     `1px solid ${DIVIDER}`,
              color:      "rgba(255,255,255,0.45)",
              padding:    "11px 0",
              borderRadius: 6,
              fontFamily: "var(--font-body)",
              fontSize:    12,
              cursor:     "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function PrefRow({ label, desc, checked, disabled, onChange }) {
  return (
    <div
      style={{
        display:     "flex",
        alignItems:  "flex-start",
        gap:          14,
        padding:     "12px 14px",
        background:  "rgba(255,255,255,0.03)",
        border:      `1px solid rgba(255,255,255,0.07)`,
        borderRadius: 6,
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize:   13,
            fontWeight:  600,
            color:      "#FFFFFF",
            marginBottom: 3,
          }}
        >
          {label}
          {disabled && (
            <span
              style={{
                marginLeft:    8,
                fontSize:      9,
                letterSpacing: "1px",
                textTransform: "uppercase",
                color:         GOLD,
                opacity:       0.7,
              }}
            >
              Always on
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", lineHeight: 1.45 }}>
          {desc}
        </div>
      </div>
      {/* Toggle */}
      <button
        role="switch"
        aria-checked={checked}
        onClick={disabled ? undefined : onChange}
        style={{
          width:        40,
          height:       22,
          borderRadius: 11,
          background:   checked ? GOLD : "rgba(255,255,255,0.12)",
          border:       "none",
          cursor:       disabled ? "not-allowed" : "pointer",
          position:     "relative",
          flexShrink:    0,
          marginTop:     2,
          transition:   "background 0.2s",
          opacity:       disabled ? 0.7 : 1,
        }}
      >
        <span
          style={{
            position:     "absolute",
            top:           3,
            left:          checked ? 21 : 3,
            width:         16,
            height:        16,
            borderRadius: "50%",
            background:   "#FFFFFF",
            transition:   "left 0.2s",
            boxShadow:    "0 1px 3px rgba(0,0,0,0.3)",
          }}
        />
      </button>
    </div>
  );
}

// ── Main Banner ───────────────────────────────────────────────────────────────
export default function CookieBanner() {
  const { chatUiState } = useChat();
  const [visible,   setVisible]   = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [entered,   setEntered]   = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY);
    if (!accepted) {
      // Small delay so it doesn't pop before the page renders
      const t = setTimeout(() => {
        setVisible(true);
        requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
      }, 800);
      return () => clearTimeout(t);
    }
  }, []);

  // Allow footer "Cookies" link to re-open preferences
  useEffect(() => {
    const show = () => {
      setShowPrefs(true);
      setVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
    };
    window.addEventListener("lwd:show-cookies", show);
    return () => window.removeEventListener("lwd:show-cookies", show);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ all: true, ts: Date.now() }));
    dismiss();
  };

  const savePrefs = (prefs) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ prefs, ts: Date.now() }));
    setShowPrefs(false);
    dismiss();
  };

  const dismiss = () => {
    setEntered(false);
    setTimeout(() => setVisible(false), 350);
  };

  // Don't render anything if not visible at all
  if (!visible) return null;

  // In fullchat mode, only show the preferences modal (not the banner strip)
  if (chatUiState === "fullchat") {
    return showPrefs ? (
      <PrefsModal
        onClose={() => { setShowPrefs(false); dismiss(); }}
        onSave={savePrefs}
      />
    ) : null;
  }

  return (
    <>
      {/* Preferences modal */}
      {showPrefs && (
        <PrefsModal
          onClose={() => setShowPrefs(false)}
          onSave={savePrefs}
        />
      )}

      {/* Banner strip */}
      <div
        role="region"
        aria-label="Cookie consent"
        style={{
          position:   "fixed",
          bottom:      0,
          left:        0,
          right:       0,
          zIndex:      1500,
          background:  "#0D0B09",
          borderTop:  `1px solid ${DIVIDER}`,
          padding:    "14px 28px",
          fontFamily: "var(--font-body)",
          transform:   entered ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow:  "0 -4px 32px rgba(0,0,0,0.4)",
        }}
      >
        <div
          style={{
            maxWidth:       1200,
            margin:        "0 auto",
            display:       "flex",
            alignItems:    "center",
            justifyContent: "space-between",
            flexWrap:      "wrap",
            gap:            14,
          }}
        >
          {/* Text */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <div
              style={{
                fontSize:   13,
                fontWeight:  600,
                color:      "#FFFFFF",
                marginBottom: 4,
                display:    "flex",
                alignItems: "center",
                gap:         8,
              }}
            >
              <span style={{ color: GOLD, fontSize: 15 }}>✦</span>
              We use cookies
            </div>
            <p
              style={{
                fontSize:   11,
                color:     "rgba(255,255,255,0.45)",
                lineHeight: 1.55,
                margin:      0,
              }}
            >
              We use essential cookies to make our site work, and optional cookies to personalise
              content and improve your experience. By clicking{" "}
              <strong style={{ color: "rgba(255,255,255,0.65)" }}>Accept All</strong>, you agree
              to our use of cookies.{" "}
              <button
                onClick={() => setShowPrefs(true)}
                style={{
                  background: "none",
                  border:     "none",
                  cursor:     "pointer",
                  color:       GOLD,
                  fontSize:   "inherit",
                  fontFamily: "inherit",
                  padding:     0,
                  opacity:     0.85,
                  textDecoration: "underline",
                }}
              >
                Learn more
              </button>
            </p>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10, flexShrink: 0, alignItems: "center" }}>
            <button
              onClick={() => setShowPrefs(true)}
              style={{
                background:    "none",
                border:       `1px solid rgba(255,255,255,0.18)`,
                borderRadius:  3,
                color:         "rgba(255,255,255,0.55)",
                padding:      "9px 18px",
                fontFamily:   "var(--font-body)",
                fontSize:      11,
                cursor:        "pointer",
                letterSpacing: "0.5px",
                transition:   "all 0.2s",
                whiteSpace:   "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
                e.currentTarget.style.color       = "#FFFFFF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
                e.currentTarget.style.color       = "rgba(255,255,255,0.55)";
              }}
            >
              Manage Preferences
            </button>
            <button
              onClick={accept}
              style={{
                background:    GOLD,
                border:       "none",
                borderRadius:  3,
                color:        "#0D0B09",
                padding:      "9px 24px",
                fontFamily:   "var(--font-body)",
                fontSize:      11,
                fontWeight:    700,
                cursor:        "pointer",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                transition:   "opacity 0.2s",
                whiteSpace:   "nowrap",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
