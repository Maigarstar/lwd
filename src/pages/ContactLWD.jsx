// ─── src/pages/ContactLWD.jsx ──────────────────────────────────────────────────
// Contact LWD — structured access page with controlled submission.
// Not a support page. Not a chat box. A curated submission gateway.
// Dark mode locked. Institutional tone throughout.
// No "Get in touch." No "We'd love to hear from you."

import { useState, useEffect, useRef } from "react";
import { ThemeCtx } from "../theme/ThemeContext";
import { getDarkPalette } from "../theme/tokens";
import { useChat } from "../chat/ChatContext";

import HomeNav from "../components/nav/HomeNav";
import SiteFooter from "../components/sections/SiteFooter";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";
const C = getDarkPalette();

// ── Shared label (consistent with About + Standard) ────────────────────────
function SectionLabel({ text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, justifyContent: "center" }}>
      <div style={{ width: 28, height: 1, background: "rgba(201,168,76,0.5)" }} />
      <span style={{
        fontFamily: NU, fontSize: 10, letterSpacing: "0.28em",
        textTransform: "uppercase", color: C.gold, fontWeight: 600,
      }}>
        {text}
      </span>
      <div style={{ width: 28, height: 1, background: "rgba(201,168,76,0.5)" }} />
    </div>
  );
}

// ── Enquiry type options ───────────────────────────────────────────────────
const ENQUIRY_TYPES = ["Couple", "Venue", "Press", "General"];

// ═════════════════════════════════════════════════════════════════════════════
// Main Component
// ═════════════════════════════════════════════════════════════════════════════
export default function ContactLWD({ onBack, onViewCategory, onViewStandard, onViewAbout, onViewPartnership, footerNav }) {
  const { setChatContext } = useChat();
  const formRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    country: "",
    type: "Couple",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setChatContext?.({ page: "contact" });
  }, [setChatContext]);

  const scrollToForm = (type) => {
    setFormData((prev) => ({ ...prev, type }));
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const inputStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.03)",
    border: `1px solid ${C.border2}`,
    borderRadius: "var(--lwd-radius-input)",
    padding: "14px 16px",
    fontFamily: NU,
    fontSize: 14,
    color: C.off,
    fontWeight: 300,
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontFamily: NU,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: C.grey,
    fontWeight: 600,
    marginBottom: 8,
    display: "block",
  };

  return (
    <ThemeCtx.Provider value={C}>
      <div style={{ background: C.black, minHeight: "100vh" }}>
        <HomeNav
          darkMode={true}
          onToggleDark={() => {}}
          onVendorLogin={onBack}
          onNavigateStandard={onViewStandard}
          onNavigateAbout={onViewAbout}
        />

        <main>
          {/* ──────────────────────────────────────────────────────────────────
              SECTION 1: Hero — Structured Access
          ────────────────────────────────────────────────────────────────── */}
          <section
            className="lwd-standard-section lwd-standard-hero"
            style={{
              background: C.black,
              padding: "160px 40px 100px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <div style={{ maxWidth: 720 }}>
              <SectionLabel text="Contact" />

              <h1 style={{
                fontFamily: GD, fontSize: "clamp(36px, 4.5vw, 64px)", fontWeight: 400,
                color: C.off, margin: "0 0 32px", lineHeight: 1.15,
              }}>
                Structured access.
              </h1>

              <p style={{
                fontFamily: NU, fontSize: 16, color: C.grey, lineHeight: 1.85,
                fontWeight: 300, margin: 0, maxWidth: 540, marginLeft: "auto", marginRight: "auto",
              }}>
                LWD operates as a curated platform. Enquiries are directed
                through defined pathways.
              </p>

              {/* Gold divider */}
              <div style={{ width: 40, height: 1, background: C.gold, opacity: 0.5, margin: "48px auto 0" }} />
            </div>
          </section>

          {/* ──────────────────────────────────────────────────────────────────
              SECTION 2: Path Segmentation
          ────────────────────────────────────────────────────────────────── */}
          <section
            className="lwd-standard-section"
            style={{
              background: C.card,
              padding: "100px 60px",
              borderTop: "1px solid rgba(201,168,76,0.15)",
            }}
          >
            <div
              className="contact-two-col"
              style={{
                maxWidth: 1000, margin: "0 auto",
                display: "grid", gridTemplateColumns: "1fr 1px 1fr", gap: 0,
                alignItems: "start",
              }}
            >
              {/* Left — For Couples */}
              <div style={{ padding: "0 48px 0 0" }}>
                <h2 style={{
                  fontFamily: GD, fontSize: "clamp(24px, 2.5vw, 36px)", fontWeight: 400,
                  fontStyle: "italic", color: C.gold, margin: "0 0 20px", lineHeight: 1.2,
                }}>
                  For Couples
                </h2>
                <p style={{
                  fontFamily: NU, fontSize: 15, color: C.grey, lineHeight: 1.85,
                  fontWeight: 300, margin: "0 0 32px",
                }}>
                  All venue communication takes place directly through individual
                  profiles. For platform guidance, submit a structured enquiry below.
                </p>
                <button
                  onClick={() => scrollToForm("Couple")}
                  style={{
                    background: "transparent", color: C.gold,
                    border: `1px solid ${C.gold}`, borderRadius: "var(--lwd-radius-input)",
                    padding: "13px 32px", cursor: "pointer",
                    fontFamily: NU, fontSize: 11, fontWeight: 700,
                    letterSpacing: "0.18em", textTransform: "uppercase",
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
                  Submit Enquiry
                </button>
              </div>

              {/* Gold vertical divider */}
              <div style={{
                background: `linear-gradient(to bottom, transparent, ${C.gold}, transparent)`,
                opacity: 0.2,
                width: 1,
                alignSelf: "stretch",
              }} />

              {/* Right — For Venues & Vendors */}
              <div style={{ padding: "0 0 0 48px" }}>
                <h2 style={{
                  fontFamily: GD, fontSize: "clamp(24px, 2.5vw, 36px)", fontWeight: 400,
                  fontStyle: "italic", color: C.gold, margin: "0 0 20px", lineHeight: 1.2,
                }}>
                  For Venues & Vendors
                </h2>
                <p style={{
                  fontFamily: NU, fontSize: 15, color: C.grey, lineHeight: 1.85,
                  fontWeight: 300, margin: "0 0 32px",
                }}>
                  Exceptional venues seeking inclusion within LWD are invited
                  to request evaluation.
                </p>
                <button
                  onClick={() => scrollToForm("Venue")}
                  style={{
                    background: "transparent", color: C.gold,
                    border: `1px solid ${C.gold}`, borderRadius: "var(--lwd-radius-input)",
                    padding: "13px 32px", cursor: "pointer",
                    fontFamily: NU, fontSize: 11, fontWeight: 700,
                    letterSpacing: "0.18em", textTransform: "uppercase",
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
                  Request Evaluation
                </button>
              </div>
            </div>
          </section>

          {/* ──────────────────────────────────────────────────────────────────
              SECTION 3: Controlled Submission Form
          ────────────────────────────────────────────────────────────────── */}
          <section
            ref={formRef}
            className="lwd-standard-section"
            style={{
              background: C.black,
              padding: "100px 60px",
              borderTop: "1px solid rgba(201,168,76,0.15)",
            }}
          >
            <div style={{ maxWidth: 580, margin: "0 auto" }}>
              <h2 style={{
                fontFamily: GD, fontSize: "clamp(24px, 2.5vw, 36px)", fontWeight: 400,
                color: C.off, margin: "0 0 40px", lineHeight: 1.2,
                textAlign: "center",
              }}>
                Submit an Enquiry
              </h2>

              {!submitted ? (
                <form onSubmit={handleSubmit}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    {/* Full Name */}
                    <div>
                      <label style={labelStyle}>Full Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange("name")}
                        style={inputStyle}
                        onFocus={(e) => (e.target.style.borderColor = C.gold)}
                        onBlur={(e) => (e.target.style.borderColor = C.border2)}
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label style={labelStyle}>Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange("email")}
                        style={inputStyle}
                        onFocus={(e) => (e.target.style.borderColor = C.gold)}
                        onBlur={(e) => (e.target.style.borderColor = C.border2)}
                      />
                    </div>

                    {/* Country */}
                    <div>
                      <label style={labelStyle}>Country</label>
                      <input
                        type="text"
                        value={formData.country}
                        onChange={handleChange("country")}
                        style={inputStyle}
                        onFocus={(e) => (e.target.style.borderColor = C.gold)}
                        onBlur={(e) => (e.target.style.borderColor = C.border2)}
                      />
                    </div>

                    {/* Enquiry Type */}
                    <div>
                      <label style={labelStyle}>Enquiry Type</label>
                      <select
                        value={formData.type}
                        onChange={handleChange("type")}
                        style={{
                          ...inputStyle,
                          appearance: "none",
                          WebkitAppearance: "none",
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888888' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 16px center",
                          paddingRight: 40,
                          cursor: "pointer",
                        }}
                        onFocus={(e) => (e.target.style.borderColor = C.gold)}
                        onBlur={(e) => (e.target.style.borderColor = C.border2)}
                      >
                        {ENQUIRY_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    {/* Message */}
                    <div>
                      <label style={labelStyle}>Message</label>
                      <textarea
                        required
                        rows={5}
                        value={formData.message}
                        onChange={handleChange("message")}
                        style={{
                          ...inputStyle,
                          resize: "vertical",
                          minHeight: 120,
                        }}
                        onFocus={(e) => (e.target.style.borderColor = C.gold)}
                        onBlur={(e) => (e.target.style.borderColor = C.border2)}
                      />
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      style={{
                        background: C.gold, color: "#0a0906", border: "none",
                        borderRadius: "var(--lwd-radius-input)", padding: "15px 36px", cursor: "pointer",
                        fontFamily: NU, fontSize: 11, fontWeight: 700,
                        letterSpacing: "0.18em", textTransform: "uppercase",
                        transition: "opacity 0.2s",
                        marginTop: 8,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                    >
                      Submit Enquiry
                    </button>

                    <p style={{
                      fontFamily: NU, fontSize: 12, color: C.grey2, lineHeight: 1.6,
                      fontWeight: 300, margin: 0, textAlign: "center",
                    }}>
                      All submissions are reviewed personally.
                    </p>
                  </div>
                </form>
              ) : (
                /* Confirmation state */
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <p style={{
                    fontFamily: GD, fontSize: 22, fontStyle: "italic",
                    color: C.gold, margin: "0 0 16px", lineHeight: 1.4,
                  }}>
                    Enquiry received.
                  </p>
                  <p style={{
                    fontFamily: NU, fontSize: 15, color: C.grey, lineHeight: 1.85,
                    fontWeight: 300, margin: 0,
                  }}>
                    Your submission has been recorded and will be reviewed directly.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ──────────────────────────────────────────────────────────────────
              SECTION 4: Press & Editorial
          ────────────────────────────────────────────────────────────────── */}
          <section
            className="lwd-standard-section"
            style={{
              background: C.card,
              padding: "60px 60px",
              borderTop: "1px solid rgba(201,168,76,0.15)",
            }}
          >
            <div style={{ maxWidth: 580, margin: "0 auto" }}>
              <h3 style={{
                fontFamily: GD, fontSize: 18, fontWeight: 400,
                fontStyle: "italic", color: C.gold, margin: "0 0 12px", lineHeight: 1.3,
              }}>
                Press & Editorial
              </h3>
              <p style={{
                fontFamily: NU, fontSize: 14, color: C.grey, lineHeight: 1.85,
                fontWeight: 300, margin: 0,
              }}>
                For media and editorial enquiries —{" "}
                <a
                  href="mailto:press@luxuryweddingdirectory.com"
                  style={{
                    color: C.off, textDecoration: "none",
                    borderBottom: `1px solid ${C.border2}`,
                    transition: "border-color 0.2s, color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = C.gold;
                    e.currentTarget.style.borderColor = C.gold;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = C.off;
                    e.currentTarget.style.borderColor = C.border2;
                  }}
                >
                  press@luxuryweddingdirectory.com
                </a>
              </p>
            </div>
          </section>

          {/* ──────────────────────────────────────────────────────────────────
              SECTION 5: Corporate
          ────────────────────────────────────────────────────────────────── */}
          <section
            className="lwd-standard-section"
            style={{
              background: C.black,
              padding: "60px 60px",
              borderTop: "1px solid rgba(201,168,76,0.15)",
            }}
          >
            <div style={{ maxWidth: 580, margin: "0 auto" }}>
              <p style={{
                fontFamily: NU, fontSize: 11, color: C.grey, lineHeight: 1.6,
                fontWeight: 300, fontStyle: "italic", margin: "0 0 20px",
              }}>
                Direct corporate contact.
              </p>
              <p style={{
                fontFamily: NU, fontSize: 12, color: C.grey2, lineHeight: 1.8,
                fontWeight: 300, margin: "0 0 4px",
              }}>
                5 Star Weddings Ltd
              </p>
              <p style={{
                fontFamily: NU, fontSize: 12, color: C.grey2, lineHeight: 1.8,
                fontWeight: 300, margin: "0 0 16px",
              }}>
                United Kingdom
              </p>
              <a
                href="mailto:hello@luxuryweddingdirectory.com"
                style={{
                  fontFamily: NU, fontSize: 12, color: C.grey,
                  textDecoration: "none",
                  borderBottom: `1px solid ${C.border}`,
                  transition: "border-color 0.2s, color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = C.gold;
                  e.currentTarget.style.borderColor = C.gold;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = C.grey;
                  e.currentTarget.style.borderColor = C.border;
                }}
              >
                hello@luxuryweddingdirectory.com
              </a>
              <p style={{
                fontFamily: NU, fontSize: 12, color: C.grey2, lineHeight: 1.8,
                fontWeight: 300, margin: "12px 0 0",
              }}>
                +44 07960 497211
              </p>
            </div>
          </section>
        </main>

        <SiteFooter {...footerNav} />
      </div>
    </ThemeCtx.Provider>
  );
}
