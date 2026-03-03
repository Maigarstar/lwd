// ─── src/components/ui/EnquiryFormModal.jsx ──────────────────────────────────
// Full-screen enquiry form modal for contacting wedding planners.
// Dark cinematic overlay with elegant gold-accented form.

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const GD   = "var(--font-heading-primary)";
const NU   = "var(--font-body)";
const GOLD = "#C9A84C";

// ── Input field component ────────────────────────────────────────────────────
function FormInput({ label, type = "text", required, value, onChange, placeholder, rows }) {
  const [focused, setFocused] = useState(false);
  const isTextarea = type === "textarea";
  const Tag = isTextarea ? "textarea" : "input";

  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display:       "block",
          fontFamily:    NU,
          fontSize:      10,
          fontWeight:    600,
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          color:         focused ? GOLD : "rgba(255,255,255,0.45)",
          marginBottom:  6,
          transition:    "color 0.2s",
        }}
      >
        {label}{required && <span style={{ color: GOLD, marginLeft: 2 }}>*</span>}
      </label>
      <Tag
        type={isTextarea ? undefined : type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        rows={isTextarea ? (rows || 4) : undefined}
        required={required}
        style={{
          width:         "100%",
          fontFamily:    NU,
          fontSize:      14,
          color:         "#ffffff",
          background:    "rgba(255,255,255,0.04)",
          border:        `1px solid ${focused ? GOLD : "rgba(255,255,255,0.12)"}`,
          borderRadius:  "var(--lwd-radius-input)",
          padding:       isTextarea ? "12px 14px" : "10px 14px",
          outline:       "none",
          transition:    "border-color 0.25s",
          resize:        isTextarea ? "vertical" : undefined,
          boxSizing:     "border-box",
        }}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function EnquiryFormModal({ planner, onClose }) {
  const [form, setForm] = useState({
    name:     "",
    email:    "",
    phone:    "",
    date:     "",
    guests:   "",
    message:  "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [isMobile, setIsMobile]   = useState(false);
  const formRef = useRef(null);

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Escape key
  useEffect(() => {
    const esc = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const update = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app this would POST to an API
    setSubmitted(true);
  };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position:       "fixed",
        inset:          0,
        zIndex:         9999,
        background:     "rgba(0,0,0,0.88)",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        padding:        isMobile ? 12 : 24,
        overflowY:      "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background:    "#141414",
          border:        "1px solid rgba(201,168,76,0.15)",
          borderRadius:  "var(--lwd-radius-card)",
          width:         isMobile ? "100%" : 520,
          maxHeight:     "90vh",
          overflowY:     "auto",
          padding:       isMobile ? "28px 20px" : "36px 32px",
          position:      "relative",
          boxShadow:     "0 32px 80px rgba(0,0,0,0.5)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close enquiry form"
          style={{
            position:       "absolute",
            top:            12,
            right:          12,
            width:          32,
            height:         32,
            borderRadius:   "50%",
            background:     "rgba(255,255,255,0.06)",
            border:         "1px solid rgba(255,255,255,0.12)",
            color:          "rgba(255,255,255,0.6)",
            fontSize:       16,
            cursor:         "pointer",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>

        {submitted ? (
          /* ── Success State ── */
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>✦</div>
            <h3
              style={{
                fontFamily: GD,
                fontSize:   24,
                fontWeight: 400,
                fontStyle:  "italic",
                color:      "#ffffff",
                margin:     "0 0 12px",
              }}
            >
              Enquiry Sent
            </h3>
            <p
              style={{
                fontFamily: NU,
                fontSize:   14,
                color:      "rgba(255,255,255,0.55)",
                lineHeight: 1.6,
                margin:     "0 0 24px",
              }}
            >
              Thank you for your interest in {planner?.name}. Your enquiry has been
              forwarded and you should receive a response within 24-48 hours.
            </p>
            <button
              onClick={onClose}
              style={{
                fontFamily:    NU,
                fontSize:      11,
                fontWeight:    700,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color:         "#0f0d0a",
                background:    `linear-gradient(135deg, ${GOLD}, #e8c97a)`,
                border:        "none",
                borderRadius:  "var(--lwd-radius-input)",
                padding:       "12px 28px",
                cursor:        "pointer",
              }}
            >
              Done
            </button>
          </div>
        ) : (
          /* ── Form ── */
          <>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontFamily:    NU,
                  fontSize:      9,
                  fontWeight:    600,
                  letterSpacing: "2.5px",
                  textTransform: "uppercase",
                  color:         GOLD,
                  marginBottom:  8,
                }}
              >
                Enquire Now
              </div>
              <h3
                style={{
                  fontFamily: GD,
                  fontSize:   isMobile ? 22 : 26,
                  fontWeight: 400,
                  fontStyle:  "italic",
                  color:      "#ffffff",
                  margin:     "0 0 6px",
                  lineHeight: 1.2,
                }}
              >
                Contact {planner?.name}
              </h3>
              <p
                style={{
                  fontFamily: NU,
                  fontSize:   13,
                  color:      "rgba(255,255,255,0.45)",
                  margin:     0,
                  lineHeight: 1.5,
                }}
              >
                Fill out the form below and {planner?.name} will get back to you
                with availability and pricing.
              </p>

              {/* Email link */}
              {planner?.email && (
                <a
                  href={`mailto:${planner.email}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display:       "inline-flex",
                    alignItems:    "center",
                    gap:           6,
                    fontFamily:    NU,
                    fontSize:      12,
                    color:         GOLD,
                    marginTop:     10,
                    textDecoration: "none",
                    transition:    "opacity 0.2s",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  {planner.email}
                </a>
              )}
            </div>

            <form ref={formRef} onSubmit={handleSubmit}>
              {/* Two-column row */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 0 : 12 }}>
                <FormInput
                  label="Your Name"
                  required
                  value={form.name}
                  onChange={update("name")}
                  placeholder="Jane Smith"
                />
                <FormInput
                  label="Email Address"
                  type="email"
                  required
                  value={form.email}
                  onChange={update("email")}
                  placeholder="jane@example.com"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 0 : 12 }}>
                <FormInput
                  label="Phone Number"
                  type="tel"
                  value={form.phone}
                  onChange={update("phone")}
                  placeholder="+44 7700 900000"
                />
                <FormInput
                  label="Wedding Date"
                  type="date"
                  value={form.date}
                  onChange={update("date")}
                />
              </div>

              <FormInput
                label="Estimated Guests"
                value={form.guests}
                onChange={update("guests")}
                placeholder="e.g. 80-120"
              />

              <FormInput
                label="Message"
                type="textarea"
                required
                value={form.message}
                onChange={update("message")}
                placeholder="Tell us about your dream wedding..."
                rows={4}
              />

              {/* Submit button */}
              <button
                type="submit"
                style={{
                  width:         "100%",
                  fontFamily:    NU,
                  fontSize:      11,
                  fontWeight:    800,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color:         "#0f0d0a",
                  background:    `linear-gradient(135deg, ${GOLD}, #e8c97a)`,
                  border:        "none",
                  borderRadius:  "var(--lwd-radius-input)",
                  padding:       "14px 28px",
                  cursor:        "pointer",
                  marginTop:     8,
                  transition:    "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Send Enquiry
              </button>

              <p
                style={{
                  fontFamily: NU,
                  fontSize:   10,
                  color:      "rgba(255,255,255,0.3)",
                  textAlign:  "center",
                  marginTop:  12,
                  lineHeight: 1.5,
                }}
              >
                Your details will be sent directly to {planner?.name}.
                By submitting you agree to our privacy policy.
              </p>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
