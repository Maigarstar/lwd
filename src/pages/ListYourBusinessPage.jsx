// ═══════════════════════════════════════════════════════════════════════════
// ListYourBusinessPage
// Public marketing / sales page for business listings on LWD
// Route: /list-your-business
// Phase 1: marketing + application form
// Phase 3: auto-creates CRM lead on submit
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useRef, useEffect } from "react";
import HomeNav from "../components/nav/HomeNav";
import { supabase } from "../lib/supabaseClient";

const GOLD    = "#C9A84C";
const GOLD_DIM = "rgba(201,168,76,0.12)";
const GOLD_BOR = "rgba(201,168,76,0.28)";
const GD      = "var(--font-heading-primary, 'Cormorant Garamond', Georgia, serif)";
const NU      = "var(--font-body, 'Nunito Sans', sans-serif)";

const CATEGORIES = [
  {
    key: "venue",
    label: "Venues",
    icon: "🏛",
    tagline: "Castles, estates, villas & boutique hotels",
    description:
      "For exclusive wedding venues that deliver exceptional experiences. From intimate countryside estates to grand palazzo ballrooms.",
    includes: [
      "Full showcase profile with gallery",
      "AI-powered discovery via Aura",
      "Enquiry management & lead tracking",
      "Editorial badge eligibility",
    ],
  },
  {
    key: "planner",
    label: "Planners",
    icon: "✦",
    tagline: "Luxury & destination wedding specialists",
    description:
      "For planners who orchestrate extraordinary weddings. Build visibility with couples who expect the exceptional.",
    includes: [
      "Professional profile & portfolio",
      "Curated category placement",
      "Client enquiry routing",
      "Magazine feature opportunities",
    ],
  },
  {
    key: "vendor",
    label: "Vendors",
    icon: "◈",
    tagline: "Photographers, florists, stylists & more",
    description:
      "For specialists who elevate every wedding detail. Reach couples at the moment they're building their team.",
    includes: [
      "Category-specific profile listing",
      "Style & aesthetic tagging",
      "Direct enquiry inbox",
      "Cross-listing with venues",
    ],
  },
];

const FEATURES = [
  { icon: "◈", title: "Curated Profile", body: "A premium showcase of your work — gallery, description, pricing and style — presented to match your brand." },
  { icon: "✦", title: "Aura Discovery", body: "AI-powered search routes qualified couples to your listing based on style, setting, location and budget." },
  { icon: "⊕", title: "Enquiry Management", body: "Receive enquiries directly, track leads, and manage availability from your vendor dashboard." },
  { icon: "⊡", title: "Analytics & Visibility", body: "See profile views, enquiry rates and search impressions so you know exactly where your traffic comes from." },
  { icon: "◆", title: "Editorial Opportunities", body: "Eligible listings can feature in LWD magazine, curated guides and seasonal editorial content." },
  { icon: "⊞", title: "Premium Presentation", body: "Photography-first design. Every listing is built to showcase imagery, not suppress it." },
];

const STATS = [
  { value: "2,400+", label: "Couples searching monthly" },
  { value: "180+",   label: "Curated listings" },
  { value: "14",     label: "Countries covered" },
];

const COUNTRIES = [
  "United Kingdom", "Italy", "France", "Spain", "Portugal", "Greece", "Switzerland",
  "Austria", "Germany", "Netherlands", "Belgium", "Ireland", "USA", "Mexico", "Other",
];

// ─── helpers ─────────────────────────────────────────────────────────────────
function scrollToApply() {
  const el = document.getElementById("apply-form");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function ListYourBusinessPage({ onNavigateHome, onNavigateStandard, onNavigateAbout }) {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [submitted,        setSubmitted]         = useState(false);
  const [submitting,       setSubmitting]        = useState(false);
  const [error,            setError]             = useState("");

  const [form, setForm] = useState({
    name:          "",
    email:         "",
    phone:         "",
    businessName:  "",
    category:      "",
    country:       "",
    region:        "",
    website:       "",
    instagram:     "",
    message:       "",
  });

  // Sync selectedCategory → form.category
  useEffect(() => {
    if (selectedCategory) setForm(f => ({ ...f, category: selectedCategory }));
  }, [selectedCategory]);

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.businessName || !form.category) {
      setError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      // ── Phase 2: write listing application ──────────────────────────────
      const { error: appErr } = await supabase.from("listing_applications").insert([{
        name:             form.name,
        email:            form.email,
        phone:            form.phone    || null,
        business_name:    form.businessName,
        category:         form.category,
        country:          form.country  || null,
        region:           form.region   || null,
        website:          form.website  || null,
        instagram:        form.instagram || null,
        message:          form.message  || null,
        source_page:      "list-your-business",
        source_campaign:  null,
        status:           "new",
      }]);

      if (appErr && !appErr.message?.includes("does not exist")) {
        // Real error, not just a missing table
        console.error("listing_applications insert:", appErr);
      }

      // ── Phase 3: create CRM lead ─────────────────────────────────────────
      const nameParts = form.name.trim().split(" ");
      const firstName  = nameParts[0] || form.name;
      const lastName   = nameParts.slice(1).join(" ") || "";

      await supabase.from("leads").insert([{
        first_name:        firstName,
        last_name:         lastName,
        email:             form.email,
        phone:             form.phone || null,
        lead_source:       "list_your_business",
        lead_type:         "listing_application",
        status:            "new",
        requirements_json: {
          businessName:    form.businessName,
          category:        form.category,
          country:         form.country,
          website:         form.website,
          instagram:       form.instagram,
          message:         form.message,
          interests:       [form.category],
        },
      }]);
    } catch (err) {
      // Non-blocking — form submission still succeeds from UX perspective
      console.warn("ListYourBusiness submission error:", err);
    }

    setSubmitting(false);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCategoryCardClick(key) {
    setSelectedCategory(key);
    scrollToApply();
  }

  // ── Layout ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: NU, background: "#faf9f6", minHeight: "100dvh" }}>
      <HomeNav
        hasHero
        onNavigateStandard={onNavigateStandard || (() => {})}
        onNavigateAbout={onNavigateAbout || (() => {})}
        onVendorLogin={onNavigateHome || (() => {})}
      />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{
        position:       "relative",
        minHeight:      "92vh",
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        background:     "linear-gradient(165deg, #1a1714 0%, #0f0d0a 55%, #181410 100%)",
        overflow:       "hidden",
        padding:        "120px 24px 80px",
        textAlign:      "center",
      }}>
        {/* Ambient gold glows */}
        <div style={{ position: "absolute", top: "15%", left: "8%", width: 480, height: 480,
          borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)",
          pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 360, height: 360,
          borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 70%)",
          pointerEvents: "none" }} />

        {/* Eyebrow */}
        <div style={{
          fontFamily:    NU,
          fontSize:      10,
          fontWeight:    700,
          letterSpacing: "2px",
          textTransform: "uppercase",
          color:         GOLD,
          marginBottom:  24,
          opacity:       0.85,
        }}>
          For Venues · Planners · Vendors
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily:  GD,
          fontSize:    "clamp(42px, 6vw, 76px)",
          fontWeight:  400,
          lineHeight:  1.1,
          color:       "#f5f1eb",
          margin:      "0 0 24px",
          maxWidth:    780,
          letterSpacing: "-0.5px",
        }}>
          Be seen by couples planning{" "}
          <em style={{ color: GOLD, fontStyle: "italic" }}>exceptional</em>
          {" "}weddings
        </h1>

        {/* Subline */}
        <p style={{
          fontFamily:  NU,
          fontSize:    17,
          lineHeight:  1.7,
          color:       "rgba(245,241,235,0.6)",
          maxWidth:    520,
          margin:      "0 0 44px",
          fontWeight:  300,
        }}>
          Join a curated collection of Europe's finest wedding professionals.
          Built for discerning couples. Designed to elevate serious businesses.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={scrollToApply}
            style={{
              fontFamily:    NU,
              fontSize:      13,
              fontWeight:    700,
              letterSpacing: "1.2px",
              textTransform: "uppercase",
              color:         "#0f0d0a",
              background:    `linear-gradient(135deg, ${GOLD}, #e8c97a)`,
              border:        "none",
              borderRadius:  4,
              padding:       "16px 32px",
              cursor:        "pointer",
              transition:    "opacity 0.2s, transform 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1";   e.currentTarget.style.transform = "translateY(0)"; }}
          >
            Apply to Join →
          </button>
          <a
            href="#how-it-works"
            onClick={e => { e.preventDefault(); document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" }); }}
            style={{
              fontFamily:    NU,
              fontSize:      13,
              fontWeight:    700,
              letterSpacing: "1.2px",
              textTransform: "uppercase",
              color:         "rgba(245,241,235,0.7)",
              background:    "transparent",
              border:        "1px solid rgba(245,241,235,0.18)",
              borderRadius:  4,
              padding:       "16px 28px",
              cursor:        "pointer",
              textDecoration: "none",
              display:       "inline-block",
              transition:    "border-color 0.2s, color 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)"; e.currentTarget.style.color = "rgba(245,241,235,0.9)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(245,241,235,0.18)"; e.currentTarget.style.color = "rgba(245,241,235,0.7)"; }}
          >
            How It Works
          </a>
        </div>

        {/* Scroll caret */}
        <div style={{ position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)", color: "rgba(201,168,76,0.4)", fontSize: 18 }}>
          ↓
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────────────────────── */}
      <section style={{
        background:    "#1a1714",
        borderTop:     "1px solid rgba(201,168,76,0.1)",
        borderBottom:  "1px solid rgba(201,168,76,0.1)",
        padding:       "36px 24px",
        display:       "flex",
        justifyContent: "center",
        gap:           "clamp(32px, 8vw, 100px)",
        flexWrap:      "wrap",
      }}>
        {STATS.map(s => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: GD, fontSize: 38, fontWeight: 500, color: GOLD, lineHeight: 1, letterSpacing: "-0.5px" }}>
              {s.value}
            </div>
            <div style={{ fontFamily: NU, fontSize: 11, color: "rgba(245,241,235,0.45)", marginTop: 6, letterSpacing: "0.5px", textTransform: "uppercase" }}>
              {s.label}
            </div>
          </div>
        ))}
      </section>

      {/* ── WHO WE LIST ──────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: "96px 24px", maxWidth: 1160, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: GOLD, marginBottom: 16 }}>
            Who We List
          </div>
          <h2 style={{ fontFamily: GD, fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 400, color: "#1a1714", lineHeight: 1.15, margin: 0 }}>
            Built for the wedding industry's{" "}
            <em style={{ fontStyle: "italic" }}>finest</em>
          </h2>
        </div>

        <div style={{
          display:             "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap:                 24,
        }}>
          {CATEGORIES.map(cat => (
            <CategoryCard
              key={cat.key}
              cat={cat}
              isSelected={selectedCategory === cat.key}
              onClick={() => handleCategoryCardClick(cat.key)}
            />
          ))}
        </div>
      </section>

      {/* ── WHAT YOU GET ─────────────────────────────────────────────────── */}
      <section style={{
        background: "#1a1714",
        padding:    "96px 24px",
      }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: GOLD, marginBottom: 16 }}>
              What You Get
            </div>
            <h2 style={{ fontFamily: GD, fontSize: "clamp(30px, 4vw, 48px)", fontWeight: 400, color: "#f5f1eb", lineHeight: 1.15, margin: 0 }}>
              Everything you need to attract the{" "}
              <em style={{ color: GOLD }}>right couples</em>
            </h2>
          </div>

          <div style={{
            display:             "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap:                 2,
            borderRadius:        8,
            overflow:            "hidden",
            border:              "1px solid rgba(201,168,76,0.12)",
          }}>
            {FEATURES.map((f, i) => (
              <FeatureCell key={f.title} feature={f} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── APPLICATION FORM ─────────────────────────────────────────────── */}
      <section id="apply-form" style={{ padding: "96px 24px", maxWidth: 760, margin: "0 auto" }}>
        {submitted ? (
          <SuccessState />
        ) : (
          <>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: GOLD, marginBottom: 16 }}>
                Apply to Join
              </div>
              <h2 style={{ fontFamily: GD, fontSize: "clamp(30px, 4vw, 48px)", fontWeight: 400, color: "#1a1714", lineHeight: 1.15, margin: "0 0 16px" }}>
                Start your application
              </h2>
              <p style={{ fontFamily: NU, fontSize: 15, color: "rgba(26,23,20,0.55)", lineHeight: 1.7, margin: 0 }}>
                Tell us about your business. Our team reviews every application personally.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Row: name + email */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="Your name *" value={form.name} onChange={v => set("name", v)} placeholder="First and last name" />
                <Field label="Email address *" type="email" value={form.email} onChange={v => set("email", v)} placeholder="you@example.com" />
              </div>

              {/* Row: phone + business name */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="Phone" type="tel" value={form.phone} onChange={v => set("phone", v)} placeholder="+44 7..." />
                <Field label="Business name *" value={form.businessName} onChange={v => set("businessName", v)} placeholder="Your venue or studio name" />
              </div>

              {/* Category */}
              <div>
                <label style={labelStyle}>Business type *</label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => set("category", cat.key)}
                      style={{
                        fontFamily:    NU,
                        fontSize:      11,
                        fontWeight:    700,
                        letterSpacing: "0.8px",
                        textTransform: "uppercase",
                        color:         form.category === cat.key ? "#0f0d0a" : GOLD,
                        background:    form.category === cat.key
                          ? `linear-gradient(135deg, ${GOLD}, #e8c97a)`
                          : GOLD_DIM,
                        border:        `1px solid ${form.category === cat.key ? "transparent" : GOLD_BOR}`,
                        borderRadius:  4,
                        padding:       "10px 20px",
                        cursor:        "pointer",
                        transition:    "all 0.2s",
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row: country + region */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Country</label>
                  <select
                    value={form.country}
                    onChange={e => set("country", e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Select country…</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <Field label="Region / City" value={form.region} onChange={v => set("region", v)} placeholder="e.g. Tuscany, Cotswolds" />
              </div>

              {/* Row: website + instagram */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="Website" type="url" value={form.website} onChange={v => set("website", v)} placeholder="https://yourwebsite.com" />
                <Field label="Instagram" value={form.instagram} onChange={v => set("instagram", v)} placeholder="@yourstudio" />
              </div>

              {/* Message */}
              <div>
                <label style={labelStyle}>Anything else you'd like us to know</label>
                <textarea
                  value={form.message}
                  onChange={e => set("message", e.target.value)}
                  placeholder="Tell us about your business, the style of weddings you work with, or any questions you have."
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical", minHeight: 100 }}
                />
              </div>

              {/* Error */}
              {error && (
                <p style={{ fontFamily: NU, fontSize: 12, color: "#e57373", margin: 0 }}>{error}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  fontFamily:    NU,
                  fontSize:      12,
                  fontWeight:    700,
                  letterSpacing: "1.4px",
                  textTransform: "uppercase",
                  color:         "#0f0d0a",
                  background:    submitting ? "rgba(201,168,76,0.5)" : `linear-gradient(135deg, ${GOLD}, #e8c97a)`,
                  border:        "none",
                  borderRadius:  4,
                  padding:       "18px 40px",
                  cursor:        submitting ? "default" : "pointer",
                  alignSelf:     "flex-start",
                  transition:    "opacity 0.2s, transform 0.2s",
                  marginTop:     4,
                }}
                onMouseEnter={e => { if (!submitting) { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-1px)"; }}}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {submitting ? "Submitting…" : "Submit Application →"}
              </button>

              <p style={{ fontFamily: NU, fontSize: 11, color: "rgba(26,23,20,0.38)", margin: "4px 0 0", lineHeight: 1.6 }}>
                We review every application personally. You'll hear from us within 3 business days.
              </p>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CategoryCard({ cat, isSelected, onClick }) {
  const [hov, setHov] = useState(false);
  const active = hov || isSelected;
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        background:   active ? "rgba(201,168,76,0.04)" : "#fff",
        border:       `1px solid ${active ? GOLD_BOR : "rgba(26,23,20,0.1)"}`,
        borderRadius: 8,
        padding:      "36px 32px 32px",
        cursor:       "pointer",
        transition:   "border-color 0.25s, box-shadow 0.25s, transform 0.25s",
        transform:    active ? "translateY(-4px)" : "translateY(0)",
        boxShadow:    active ? "0 12px 40px rgba(201,168,76,0.1)" : "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 16, lineHeight: 1 }}>{cat.icon}</div>
      <h3 style={{ fontFamily: GD, fontSize: 28, fontWeight: 500, fontStyle: "italic", color: "#1a1714", margin: "0 0 4px", lineHeight: 1.1 }}>
        {cat.label}
      </h3>
      <div style={{ fontFamily: NU, fontSize: 11, color: GOLD, marginBottom: 16, letterSpacing: "0.3px" }}>
        {cat.tagline}
      </div>
      <p style={{ fontFamily: NU, fontSize: 13.5, color: "rgba(26,23,20,0.6)", lineHeight: 1.65, margin: "0 0 24px" }}>
        {cat.description}
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 8 }}>
        {cat.includes.map(item => (
          <li key={item} style={{ fontFamily: NU, fontSize: 12, color: "rgba(26,23,20,0.55)", display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span style={{ color: GOLD, marginTop: 1, flexShrink: 0 }}>✦</span>
            {item}
          </li>
        ))}
      </ul>
      <div style={{
        fontFamily:    NU,
        fontSize:      10,
        fontWeight:    700,
        letterSpacing: "1.2px",
        textTransform: "uppercase",
        color:         active ? "#0f0d0a" : GOLD,
        background:    active ? `linear-gradient(135deg, ${GOLD}, #e8c97a)` : GOLD_DIM,
        border:        `1px solid ${active ? "transparent" : GOLD_BOR}`,
        borderRadius:  4,
        padding:       "9px 18px",
        display:       "inline-block",
        transition:    "all 0.2s",
      }}>
        Apply as {cat.label.slice(0, -1)} →
      </div>
    </div>
  );
}

function FeatureCell({ feature, index }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:  hov ? "rgba(201,168,76,0.06)" : "rgba(255,255,255,0.02)",
        borderRight: "1px solid rgba(201,168,76,0.1)",
        borderBottom:"1px solid rgba(201,168,76,0.1)",
        padding:     "32px 28px",
        transition:  "background 0.2s",
      }}
    >
      <div style={{ fontFamily: NU, fontSize: 20, color: GOLD, marginBottom: 12, opacity: 0.8 }}>
        {feature.icon}
      </div>
      <h4 style={{ fontFamily: GD, fontSize: 20, fontWeight: 500, fontStyle: "italic", color: "#f5f1eb", margin: "0 0 8px", lineHeight: 1.2 }}>
        {feature.title}
      </h4>
      <p style={{ fontFamily: NU, fontSize: 13, color: "rgba(245,241,235,0.45)", lineHeight: 1.65, margin: 0 }}>
        {feature.body}
      </p>
    </div>
  );
}

function SuccessState() {
  return (
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <div style={{ fontFamily: GD, fontSize: 48, color: GOLD, marginBottom: 24 }}>✦</div>
      <h2 style={{ fontFamily: GD, fontSize: 42, fontWeight: 400, fontStyle: "italic", color: "#1a1714", margin: "0 0 16px", lineHeight: 1.2 }}>
        Application received
      </h2>
      <p style={{ fontFamily: NU, fontSize: 15, color: "rgba(26,23,20,0.55)", lineHeight: 1.7, maxWidth: 440, margin: "0 auto" }}>
        Thank you. Our team reviews every application personally and will be in touch within 3 business days.
      </p>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}

const labelStyle = {
  display:       "block",
  fontFamily:    NU,
  fontSize:      10,
  fontWeight:    700,
  letterSpacing: "0.8px",
  textTransform: "uppercase",
  color:         "rgba(26,23,20,0.5)",
  marginBottom:  6,
};

const inputStyle = {
  width:        "100%",
  fontFamily:   NU,
  fontSize:     14,
  color:        "#1a1714",
  background:   "#fff",
  border:       "1px solid rgba(26,23,20,0.15)",
  borderRadius: 4,
  padding:      "13px 14px",
  outline:      "none",
  boxSizing:    "border-box",
  transition:   "border-color 0.2s",
};
