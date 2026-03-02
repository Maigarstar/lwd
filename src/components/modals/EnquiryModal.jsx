// ─── src/components/modals/EnquiryModal.jsx ──────────────────────────────────
import { useState } from "react";
import { useTheme } from "../../theme/ThemeContext";
import { MField, Btn } from "../ui/FormHelpers";

export default function EnquiryModal({ vendor, onClose }) {
  const C = useTheme();
  const IS = {
    width: "100%",
    background: C.card,
    border: `1px solid ${C.border2}`,
    borderRadius: "var(--lwd-radius-input)",
    color: C.white,
    padding: "12px 14px",
    fontSize: 14,
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };
  const [step, setStep] = useState(1);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    date: "",
    guests: "",
    budget: "",
    message: "",
  });

  if (!vendor) return null;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Send enquiry to ${vendor.name}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.9)",
        backdropFilter: "blur(8px)",
        zIndex: 9500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: C.dark,
          border: `1px solid ${C.border2}`,
          borderRadius: "var(--lwd-radius-card)",
          width: "100%",
          maxWidth: 500,
          maxHeight: "90vh",
          overflowY: "auto",
          animation: "modalIn 0.3s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "28px 32px 20px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "3px",
                textTransform: "uppercase",
                color: C.gold,
                marginBottom: 4,
              }}
            >
              Send Enquiry
            </div>
            <div
              style={{
                fontFamily: "var(--font-heading-primary)",
                fontSize: 24,
                color: C.white,
                fontWeight: 600,
              }}
            >
              {vendor.name}
            </div>
            <div style={{ fontSize: 12, color: C.grey, marginTop: 2 }}>
              📍 {vendor.city} · ⚡ Responds {vendor.response}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              color: C.grey,
              fontSize: 22,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {sent ? (
          <div style={{ padding: "48px 32px", textAlign: "center" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>✦</div>
            <div
              style={{
                fontFamily: "var(--font-heading-primary)",
                fontSize: 28,
                color: C.white,
                marginBottom: 8,
              }}
            >
              Enquiry Sent!
            </div>
            <div style={{ color: C.grey, fontSize: 14, lineHeight: 1.7 }}>
              {vendor.name} will respond to{" "}
              <span style={{ color: C.gold }}>{form.email}</span> within{" "}
              {vendor.response}.
              <br />
              We've also sent a confirmation email.
            </div>
            <button
              onClick={onClose}
              style={{
                marginTop: 28,
                background: C.gold,
                color: C.black,
                border: "none",
                borderRadius: "var(--lwd-radius-input)",
                padding: "12px 32px",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <div style={{ padding: "24px 32px 32px" }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
              {[1, 2].map((s) => (
                <div
                  key={s}
                  style={{
                    flex: 1,
                    height: 2,
                    background: step >= s ? C.gold : C.border,
                    transition: "background 0.3s",
                  }}
                />
              ))}
            </div>
            {step === 1 ? (
              <>
                <MField label="Your Name(s)">
                  <input style={IS} value={form.name} onChange={set("name")} placeholder="Sophie & James" />
                </MField>
                <MField label="Email Address">
                  <input style={IS} value={form.email} onChange={set("email")} placeholder="your@email.com" />
                </MField>
                <MField label="Wedding Date">
                  <input style={{ ...IS, colorScheme: "dark" }} type="date" value={form.date} onChange={set("date")} />
                </MField>
                <MField label="Guest Count">
                  <select style={IS} value={form.guests} onChange={set("guests")}>
                    <option value="">Select...</option>
                    {["Under 30", "30–80", "80–150", "150–300", "300+"].map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </MField>
                <Btn onClick={() => form.name && form.email && setStep(2)} gold>
                  Next Step →
                </Btn>
              </>
            ) : (
              <>
                <MField label="Budget Range">
                  <select style={IS} value={form.budget} onChange={set("budget")}>
                    <option value="">Select...</option>
                    {["Under £10,000", "£10–25k", "£25–50k", "£50–100k", "£100k+"].map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </MField>
                <MField label="Tell them about your dream wedding">
                  <textarea
                    style={{ ...IS, resize: "vertical", minHeight: 100 }}
                    value={form.message}
                    onChange={set("message")}
                    placeholder="We're dreaming of an outdoor ceremony..."
                  />
                </MField>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => setStep(1)}
                    style={{
                      ...IS,
                      background: "none",
                      border: `1px solid ${C.border2}`,
                      color: C.grey,
                      padding: "13px 20px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontWeight: 600,
                      letterSpacing: "1px",
                      fontSize: 12,
                      textTransform: "uppercase",
                    }}
                  >
                    ← Back
                  </button>
                  <Btn onClick={() => form.message && setSent(true)} gold>
                    ✦ Send Enquiry
                  </Btn>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
