// ═══════════════════════════════════════════════════════════════════════════
// ListYourBusinessPage — v2
// Luxury acquisition funnel for venues, planners & vendors
// Route: /list-your-business
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import HomeNav from "../components/nav/HomeNav";
import { supabase } from "../lib/supabaseClient";

const GOLD     = "#C9A84C";
const GOLD_DIM = "rgba(201,168,76,0.12)";
const GOLD_BOR = "rgba(201,168,76,0.28)";
const GD       = "var(--font-heading-primary, 'Cormorant Garamond', Georgia, serif)";
const NU       = "var(--font-body, 'Nunito Sans', sans-serif)";

// ── Data ────────────────────────────────────────────────────────────────────

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
      "For specialists who elevate every wedding detail. Reach couples at the moment they're assembling their team.",
    includes: [
      "Category-specific profile listing",
      "Style & aesthetic tagging",
      "Direct enquiry inbox",
      "Cross-listing with venues",
    ],
  },
];

const FEATURES = [
  { icon: "◈", title: "Curated Profile",       body: "A premium showcase of your work — gallery, description, pricing and style — presented to match your brand." },
  { icon: "✦", title: "Aura Discovery",         body: "AI-powered search routes qualified couples to your listing based on style, setting, location and budget." },
  { icon: "⊕", title: "Enquiry Management",     body: "Receive enquiries directly, track leads, and manage your pipeline from your vendor dashboard." },
  { icon: "⊡", title: "Analytics & Visibility", body: "See profile views, enquiry rates and search impressions. Know exactly where your traffic comes from." },
  { icon: "◆", title: "Editorial Opportunities",body: "Eligible listings are considered for LWD magazine, curated guides and seasonal editorial content." },
  { icon: "⊞", title: "Premium Presentation",   body: "Photography-first design. Every listing is built to showcase imagery, not suppress it." },
];

const STATS = [
  { value: "2,400+", label: "Couples actively searching each month" },
  { value: "180+",   label: "Curated listings across Europe" },
  { value: "14",     label: "Countries covered" },
];

const PROOF_VENUES = [
  "Villa d'Este Estate",
  "Masseria Torre Coccaro",
  "Palazzo Vendramin",
  "Castello di Vicarello",
  "Château de Varennes",
  "The Ritz London",
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Submit your application",
    body:  "Tell us about your business, your style, and the couples you work with. Takes under five minutes.",
  },
  {
    step: "02",
    title: "We review and curate",
    body:  "Every application is assessed by our editorial team. We select a limited number of partners per region to maintain quality.",
  },
  {
    step: "03",
    title: "You go live and receive enquiries",
    body:  "Your profile launches across our platform. Qualified couples find you through curated search and AI-powered discovery.",
  },
];

const COUNTRIES = [
  "United Kingdom", "Italy", "France", "Spain", "Portugal", "Greece", "Switzerland",
  "Austria", "Germany", "Netherlands", "Belgium", "Ireland", "USA", "Mexico", "Other",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ListYourBusinessPage({ onNavigateHome, onNavigateStandard, onNavigateAbout }) {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [submitted,        setSubmitted]         = useState(false);
  const [submitting,       setSubmitting]        = useState(false);
  const [error,            setError]             = useState("");

  const [form, setForm] = useState({
    name: "", email: "", phone: "", businessName: "",
    category: "", country: "", region: "", website: "", instagram: "", message: "",
  });

  useEffect(() => {
    if (selectedCategory) setForm(f => ({ ...f, category: selectedCategory }));
  }, [selectedCategory]);

  function set(field, val) { setForm(f => ({ ...f, [field]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.businessName || !form.category) {
      setError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await supabase.from("listing_applications").insert([{
        name: form.name, email: form.email, phone: form.phone || null,
        business_name: form.businessName, category: form.category,
        country: form.country || null, region: form.region || null,
        website: form.website || null, instagram: form.instagram || null,
        message: form.message || null,
        source_page: "list-your-business", status: "new",
      }]);
      const parts    = form.name.trim().split(" ");
      await supabase.from("leads").insert([{
        first_name: parts[0] || form.name,
        last_name:  parts.slice(1).join(" ") || "",
        email:      form.email,
        phone:      form.phone || null,
        lead_source: "list_your_business",
        lead_type:   "listing_application",
        status:      "new",
        requirements_json: {
          businessName: form.businessName,
          category:     form.category,
          country:      form.country,
          website:      form.website,
          instagram:    form.instagram,
          message:      form.message,
          interests:    [form.category],
        },
      }]);
    } catch (err) {
      console.warn("ListYourBusiness submission:", err);
    }
    setSubmitting(false);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCategoryCardClick(key) {
    setSelectedCategory(key);
    scrollTo("apply-form");
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: NU, background: "#faf9f6", minHeight: "100dvh" }}>
      <HomeNav
        hasHero
        onNavigateStandard={onNavigateStandard || (() => {})}
        onNavigateAbout={onNavigateAbout || (() => {})}
        onVendorLogin={onNavigateHome || (() => {})}
      />

      {/* ── 1. HERO ────────────────────────────────────────────────────────── */}
      <section style={{
        position: "relative", minHeight: "92vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "linear-gradient(165deg, #1a1714 0%, #0f0d0a 55%, #181410 100%)",
        overflow: "hidden", padding: "120px 24px 100px", textAlign: "center",
      }}>
        <div style={{ position: "absolute", top: "12%", left: "6%", width: 560, height: 560, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 68%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "8%", right: "4%",  width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: "2.2px", textTransform: "uppercase", color: GOLD, marginBottom: 28, opacity: 0.85 }}>
          For Venues · Planners · Vendors
        </div>

        <h1 style={{
          fontFamily: GD, fontSize: "clamp(44px, 6.5vw, 80px)",
          fontWeight: 400, lineHeight: 1.08, color: "#f5f1eb",
          margin: "0 0 26px", maxWidth: 800, letterSpacing: "-0.5px",
        }}>
          Be seen by couples planning{" "}
          <em style={{ color: GOLD, fontStyle: "italic" }}>exceptional</em>
          {" "}weddings
        </h1>

        <p style={{ fontFamily: NU, fontSize: 17, lineHeight: 1.75, color: "rgba(245,241,235,0.58)", maxWidth: 500, margin: "0 0 48px", fontWeight: 300 }}>
          Join a curated collection of Europe's most refined wedding venues and vendors,
          trusted by couples planning exceptional celebrations.
        </p>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 52 }}>
          <HeroBtn primary onClick={() => scrollTo("apply-form")}>Request to Join →</HeroBtn>
          <HeroBtn onClick={() => scrollTo("how-it-works")}>How It Works</HeroBtn>
        </div>

        {/* Proof names — whisper level */}
        <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap", justifyContent: "center", maxWidth: 640 }}>
          <span style={{ fontFamily: NU, fontSize: 10, color: "rgba(245,241,235,0.28)", letterSpacing: "0.5px", marginRight: 14, textTransform: "uppercase", whiteSpace: "nowrap" }}>
            Trusted by
          </span>
          {PROOF_VENUES.map((name, i) => (
            <span key={name} style={{ display: "flex", alignItems: "center" }}>
              <span style={{ fontFamily: GD, fontSize: 13, fontStyle: "italic", color: "rgba(245,241,235,0.38)" }}>{name}</span>
              {i < PROOF_VENUES.length - 1 && (
                <span style={{ color: "rgba(201,168,76,0.25)", margin: "0 10px", fontSize: 8 }}>✦</span>
              )}
            </span>
          ))}
        </div>

        <div style={{ position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)", color: "rgba(201,168,76,0.35)", fontSize: 18 }}>↓</div>
      </section>

      {/* ── 2. STATS STRIP ─────────────────────────────────────────────────── */}
      <section style={{
        background: "#1a1714",
        borderTop: "1px solid rgba(201,168,76,0.1)", borderBottom: "1px solid rgba(201,168,76,0.1)",
        padding: "44px 24px",
        display: "flex", justifyContent: "center", gap: "clamp(40px, 9vw, 110px)", flexWrap: "wrap",
      }}>
        {STATS.map(s => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: GD, fontSize: 42, fontWeight: 500, color: GOLD, lineHeight: 1, letterSpacing: "-0.5px" }}>{s.value}</div>
            <div style={{ fontFamily: NU, fontSize: 10.5, color: "rgba(245,241,235,0.42)", marginTop: 8, letterSpacing: "0.4px" }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── 3. WHO WE LIST ─────────────────────────────────────────────────── */}
      <section style={{ padding: "112px 24px 96px", maxWidth: 1160, margin: "0 auto" }}>
        <SectionEyebrow light={false}>Who We List</SectionEyebrow>
        <SectionHeading light={false}>
          Built for the wedding industry's{" "}<em style={{ fontStyle: "italic" }}>finest</em>
        </SectionHeading>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginTop: 64 }}>
          {CATEGORIES.map(cat => (
            <CategoryCard key={cat.key} cat={cat} isSelected={selectedCategory === cat.key} onClick={() => handleCategoryCardClick(cat.key)} />
          ))}
        </div>
      </section>

      {/* ── 4. HOW IT WORKS ────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ background: "#faf9f6", padding: "0 24px 112px", maxWidth: 1000, margin: "0 auto" }}>
        <SectionEyebrow light={false}>How It Works</SectionEyebrow>
        <SectionHeading light={false}>
          Three steps to being{" "}<em style={{ fontStyle: "italic" }}>discovered</em>
        </SectionHeading>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 2, marginTop: 64, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(26,23,20,0.08)" }}>
          {HOW_IT_WORKS.map((step, i) => (
            <HowItWorksStep key={step.step} step={step} isLast={i === HOW_IT_WORKS.length - 1} />
          ))}
        </div>

        {/* Pricing signal */}
        <div style={{ marginTop: 40, textAlign: "center" }}>
          <p style={{ fontFamily: NU, fontSize: 12.5, color: "rgba(26,23,20,0.42)", lineHeight: 1.7, margin: 0, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
            Membership is selective and tailored to each listing category.
            Pricing is discussed after your application is reviewed.
          </p>
        </div>
      </section>

      {/* ── NOT FOR EVERYONE strip ──────────────────────────────────────── */}
      <div style={{
        background:   "#1a1714",
        padding:      "32px 24px",
        textAlign:    "center",
        borderTop:    "1px solid rgba(201,168,76,0.08)",
      }}>
        <p style={{
          fontFamily:  NU,
          fontSize:    12,
          lineHeight:  1.7,
          color:       "rgba(245,241,235,0.32)",
          margin:      "0 auto",
          maxWidth:    580,
          letterSpacing: "0.2px",
        }}>
          We are not a volume marketplace. Each partner is selected based on quality,
          presentation, and alignment with the couples we serve.
        </p>
      </div>

      {/* ── 5. WHAT YOU GET ────────────────────────────────────────────────── */}
      <section style={{ background: "#1a1714", padding: "80px 24px 112px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <SectionEyebrow light>What You Get</SectionEyebrow>
          <SectionHeading light>
            Everything you need to attract the{" "}<em style={{ color: GOLD }}>right couples</em>
          </SectionHeading>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 2, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(201,168,76,0.12)", marginTop: 64 }}>
            {FEATURES.map((f, i) => <FeatureCell key={f.title} feature={f} index={i} />)}
          </div>

          {/* Mid-page CTA */}
          <div style={{ marginTop: 56, textAlign: "center" }}>
            <button
              onClick={() => scrollTo("apply-form")}
              style={{
                fontFamily: NU, fontSize: 12, fontWeight: 700, letterSpacing: "1.3px", textTransform: "uppercase",
                color: "#0f0d0a", background: `linear-gradient(135deg, ${GOLD}, #e8c97a)`,
                border: "none", borderRadius: 4, padding: "16px 36px", cursor: "pointer", transition: "opacity 0.2s, transform 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1";   e.currentTarget.style.transform = "translateY(0)"; }}
            >
              Request to Join →
            </button>
            <p style={{ fontFamily: NU, fontSize: 11, color: "rgba(245,241,235,0.28)", marginTop: 14, letterSpacing: "0.3px" }}>
              Limited placements per region · Currently onboarding for 2026
            </p>
          </div>
        </div>
      </section>

      {/* ── 6. APPLICATION FORM ────────────────────────────────────────────── */}
      <section id="apply-form" style={{ padding: "112px 24px", maxWidth: 780, margin: "0 auto" }}>
        {submitted ? (
          <SuccessState />
        ) : (
          <>
            {/* Section heading */}
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <SectionEyebrow light={false}>Apply to Join</SectionEyebrow>
              <h2 style={{ fontFamily: GD, fontSize: "clamp(32px, 4.5vw, 52px)", fontWeight: 400, color: "#1a1714", lineHeight: 1.12, margin: "0 0 20px" }}>
                Start your application
              </h2>
              <p style={{ fontFamily: NU, fontSize: 15, color: "rgba(26,23,20,0.52)", lineHeight: 1.7, margin: 0, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
                Tell us about your business. Our team reviews every application personally.
              </p>
            </div>

            {/* Emotional close */}
            <p style={{
              fontFamily:  GD,
              fontSize:    "clamp(19px, 2.5vw, 24px)",
              fontStyle:   "italic",
              fontWeight:  400,
              color:       "rgba(26,23,20,0.55)",
              lineHeight:  1.55,
              textAlign:   "center",
              margin:      "0 0 36px",
            }}>
              If your work aligns with the level of weddings we feature,
              we would love to hear from you.
            </p>

            {/* Exclusivity + scarcity signal */}
            <div style={{
              background: "rgba(201,168,76,0.05)",
              border: "1px solid rgba(201,168,76,0.18)",
              borderRadius: 6,
              padding: "18px 24px",
              marginBottom: 40,
              display: "flex", alignItems: "flex-start", gap: 14,
            }}>
              <span style={{ color: GOLD, fontSize: 16, lineHeight: 1, marginTop: 2, flexShrink: 0 }}>✦</span>
              <div>
                <p style={{ fontFamily: NU, fontSize: 13, color: "rgba(26,23,20,0.72)", lineHeight: 1.65, margin: 0 }}>
                  Every application is reviewed personally by our editorial team.
                  We select a <strong style={{ fontWeight: 700 }}>limited number of partners per region</strong> to maintain the quality of our directory.
                  Currently onboarding new partners for the <strong style={{ fontWeight: 700 }}>2026 season.</strong>
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="Your name *"      value={form.name}         onChange={v => set("name", v)}         placeholder="First and last name" />
                <Field label="Email address *"  type="email" value={form.email}  onChange={v => set("email", v)}  placeholder="you@example.com" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="Phone"            type="tel" value={form.phone}    onChange={v => set("phone", v)}   placeholder="+44 7..." />
                <Field label="Business name *"  value={form.businessName} onChange={v => set("businessName", v)}  placeholder="Your venue or studio name" />
              </div>

              {/* Category */}
              <div>
                <label style={labelStyle}>Business type *</label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                  {CATEGORIES.map(cat => (
                    <button key={cat.key} type="button" onClick={() => set("category", cat.key)} style={{
                      fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase",
                      color:      form.category === cat.key ? "#0f0d0a" : GOLD,
                      background: form.category === cat.key ? `linear-gradient(135deg, ${GOLD}, #e8c97a)` : GOLD_DIM,
                      border:     `1px solid ${form.category === cat.key ? "transparent" : GOLD_BOR}`,
                      borderRadius: 4, padding: "10px 22px", cursor: "pointer", transition: "all 0.2s",
                    }}>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Country</label>
                  <select value={form.country} onChange={e => set("country", e.target.value)} style={inputStyle}>
                    <option value="">Select country…</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <Field label="Region / City" value={form.region} onChange={v => set("region", v)} placeholder="e.g. Tuscany, Cotswolds" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="Website" type="url" value={form.website}   onChange={v => set("website", v)}   placeholder="https://yourwebsite.com" />
                <Field label="Instagram"          value={form.instagram} onChange={v => set("instagram", v)} placeholder="@yourstudio" />
              </div>

              <div>
                <label style={labelStyle}>Anything else you'd like us to know</label>
                <textarea
                  value={form.message}
                  onChange={e => set("message", e.target.value)}
                  placeholder="Tell us about the style of weddings you work with, your ideal couples, or any questions you have about joining."
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical", minHeight: 110 }}
                />
              </div>

              {error && <p style={{ fontFamily: NU, fontSize: 12, color: "#e57373", margin: 0 }}>{error}</p>}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, paddingTop: 8 }}>
                <button
                  type="submit" disabled={submitting}
                  style={{
                    fontFamily: NU, fontSize: 12, fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase",
                    color: "#0f0d0a",
                    background: submitting ? "rgba(201,168,76,0.5)" : `linear-gradient(135deg, ${GOLD}, #e8c97a)`,
                    border: "none", borderRadius: 4, padding: "18px 44px",
                    cursor: submitting ? "default" : "pointer", transition: "opacity 0.2s, transform 0.2s",
                  }}
                  onMouseEnter={e => { if (!submitting) { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-1px)"; }}}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  {submitting ? "Submitting…" : "Submit Application →"}
                </button>
                <p style={{ fontFamily: NU, fontSize: 11, color: "rgba(26,23,20,0.38)", lineHeight: 1.65, margin: 0 }}>
                  You'll hear from us within 3 business days.
                </p>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function HeroBtn({ primary, onClick, children }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily:    NU,
        fontSize:      13,
        fontWeight:    700,
        letterSpacing: "1.2px",
        textTransform: "uppercase",
        color:         primary ? "#0f0d0a" : (hov ? "rgba(245,241,235,0.9)" : "rgba(245,241,235,0.7)"),
        background:    primary ? `linear-gradient(135deg, ${GOLD}, #e8c97a)` : "transparent",
        border:        primary ? "none" : `1px solid ${hov ? "rgba(201,168,76,0.4)" : "rgba(245,241,235,0.18)"}`,
        borderRadius:  4,
        padding:       "16px 32px",
        cursor:        "pointer",
        transform:     hov ? "translateY(-3px)" : "translateY(0)",
        boxShadow:     primary && hov ? "0 10px 36px rgba(201,168,76,0.32)" : "none",
        opacity:       primary && hov ? 0.95 : 1,
        transition:    "all 0.25s cubic-bezier(0.16,1,0.3,1)",
      }}
    >{children}</button>
  );
}

function SectionEyebrow({ light, children }) {
  return (
    <div style={{
      fontFamily:    NU,
      fontSize:      10,
      fontWeight:    700,
      letterSpacing: "2.2px",
      textTransform: "uppercase",
      color:         GOLD,
      marginBottom:  20,
      opacity:       light ? 0.85 : 1,
      textAlign:     "center",
    }}>
      {children}
    </div>
  );
}

function SectionHeading({ light, children }) {
  return (
    <h2 style={{
      fontFamily:  GD,
      fontSize:    "clamp(32px, 4vw, 52px)",
      fontWeight:  400,
      lineHeight:  1.12,
      color:       light ? "#f5f1eb" : "#1a1714",
      margin:      0,
      textAlign:   "center",
    }}>
      {children}
    </h2>
  );
}

function CategoryCard({ cat, isSelected, onClick }) {
  const [hov, setHov] = useState(false);
  const active = hov || isSelected;
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        background:  active ? "rgba(201,168,76,0.04)" : "#fff",
        border:      `1px solid ${active ? GOLD_BOR : "rgba(26,23,20,0.1)"}`,
        borderRadius: 8, padding: "38px 32px 34px",
        cursor: "pointer",
        transform:   active ? "translateY(-5px)" : "translateY(0)",
        boxShadow:   active ? "0 16px 48px rgba(201,168,76,0.1)" : "0 1px 4px rgba(0,0,0,0.04)",
        transition:  "all 0.25s",
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 18, lineHeight: 1 }}>{cat.icon}</div>
      <h3 style={{ fontFamily: GD, fontSize: 30, fontWeight: 500, fontStyle: "italic", color: "#1a1714", margin: "0 0 5px", lineHeight: 1.1 }}>
        {cat.label}
      </h3>
      <div style={{ fontFamily: NU, fontSize: 11, color: GOLD, marginBottom: 18, letterSpacing: "0.3px" }}>{cat.tagline}</div>
      <p style={{ fontFamily: NU, fontSize: 13.5, color: "rgba(26,23,20,0.58)", lineHeight: 1.65, margin: "0 0 26px" }}>{cat.description}</p>
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 30px", display: "flex", flexDirection: "column", gap: 9 }}>
        {cat.includes.map(item => (
          <li key={item} style={{ fontFamily: NU, fontSize: 12, color: "rgba(26,23,20,0.52)", display: "flex", alignItems: "flex-start", gap: 9 }}>
            <span style={{ color: GOLD, marginTop: 1, flexShrink: 0 }}>✦</span>{item}
          </li>
        ))}
      </ul>
      <div style={{
        fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase",
        color:      active ? "#0f0d0a" : GOLD,
        background: active ? `linear-gradient(135deg, ${GOLD}, #e8c97a)` : GOLD_DIM,
        border:     `1px solid ${active ? "transparent" : GOLD_BOR}`,
        borderRadius: 4, padding: "10px 18px", display: "inline-block", transition: "all 0.2s",
      }}>
        Apply as {cat.label.replace(/s$/, "")} →
      </div>
    </div>
  );
}

function HowItWorksStep({ step, isLast }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:   hov ? "rgba(201,168,76,0.025)" : "#fff",
        borderRight:  isLast ? "none" : "1px solid rgba(26,23,20,0.08)",
        padding:      "44px 36px",
        transition:   "background 0.2s",
      }}
    >
      <div style={{ fontFamily: GD, fontSize: 52, fontWeight: 400, color: "rgba(201,168,76,0.18)", lineHeight: 1, marginBottom: 24, letterSpacing: "-1px" }}>
        {step.step}
      </div>
      <h4 style={{ fontFamily: GD, fontSize: 22, fontWeight: 500, fontStyle: "italic", color: "#1a1714", margin: "0 0 12px", lineHeight: 1.2 }}>
        {step.title}
      </h4>
      <p style={{ fontFamily: NU, fontSize: 13.5, color: "rgba(26,23,20,0.55)", lineHeight: 1.7, margin: 0 }}>
        {step.body}
      </p>
    </div>
  );
}

function FeatureCell({ feature }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:   hov ? "rgba(201,168,76,0.06)" : "rgba(255,255,255,0.02)",
        borderRight:  "1px solid rgba(201,168,76,0.1)",
        borderBottom: "1px solid rgba(201,168,76,0.1)",
        padding:      "34px 30px",
        transition:   "background 0.2s",
      }}
    >
      <div style={{ fontFamily: NU, fontSize: 20, color: GOLD, marginBottom: 14, opacity: 0.8 }}>{feature.icon}</div>
      <h4 style={{ fontFamily: GD, fontSize: 21, fontWeight: 500, fontStyle: "italic", color: "#f5f1eb", margin: "0 0 9px", lineHeight: 1.2 }}>
        {feature.title}
      </h4>
      <p style={{ fontFamily: NU, fontSize: 13, color: "rgba(245,241,235,0.43)", lineHeight: 1.7, margin: 0 }}>
        {feature.body}
      </p>
    </div>
  );
}

function SuccessState() {
  return (
    <div style={{ textAlign: "center", padding: "80px 0" }}>
      <div style={{ fontFamily: GD, fontSize: 52, color: GOLD, marginBottom: 28 }}>✦</div>
      <h2 style={{ fontFamily: GD, fontSize: 44, fontWeight: 400, fontStyle: "italic", color: "#1a1714", margin: "0 0 18px", lineHeight: 1.15 }}>
        Application received
      </h2>
      <p style={{ fontFamily: NU, fontSize: 15, color: "rgba(26,23,20,0.52)", lineHeight: 1.75, maxWidth: 460, margin: "0 auto 12px" }}>
        Thank you. Our editorial team will review your application personally and be in touch within 3 business days.
      </p>
      <p style={{ fontFamily: NU, fontSize: 12, color: "rgba(26,23,20,0.32)", margin: 0 }}>
        In the meantime, you can explore the directory at{" "}
        <a href="/" style={{ color: GOLD, textDecoration: "none" }}>luxuryweddingdirectory.com</a>
      </p>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
    </div>
  );
}

const labelStyle = {
  display: "block", fontFamily: NU, fontSize: 10, fontWeight: 700,
  letterSpacing: "0.8px", textTransform: "uppercase",
  color: "rgba(26,23,20,0.48)", marginBottom: 7,
};

const inputStyle = {
  width: "100%", fontFamily: NU, fontSize: 14, color: "#1a1714",
  background: "#fff", border: "1px solid rgba(26,23,20,0.15)",
  borderRadius: 4, padding: "13px 14px", outline: "none",
  boxSizing: "border-box", transition: "border-color 0.2s",
};
