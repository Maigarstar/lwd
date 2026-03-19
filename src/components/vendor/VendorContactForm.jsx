// ─── src/components/vendor/VendorContactForm.jsx ─────────────────────────────
// 3-step enquiry wizard matching venue LeadForm mechanics.
// Steps: 0 idle → 1 date → 2 guests → 3 details → 4 success
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback, useRef } from "react";
import { saveInquiry } from "../../services/inquiryService";
import { sendEnquiryNotifications } from "../../services/emailService";
import { trackEnquiryStarted, trackEnquirySubmitted } from "../../services/userEventService";

const FD = "var(--font-heading-primary)";
const FB = "var(--font-body)";

function stars(r = 0) {
  const x = Math.max(0, Math.min(5, Math.round(r)));
  return "★".repeat(x) + "☆".repeat(5 - x);
}

export default function VendorContactForm({ vendor, C, leadSource = "Venue Profile" }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ date: "", guests: 80, budget: "", name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const set = useCallback((k, v) => setForm(f => ({ ...f, [k]: v })), []);
  const enquiryStartTracked = useRef(false);

  if (!vendor || !C) return null;

  const canSubmit = form.name.trim() && form.email.trim();

  // Handle enquiry submission
  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError("");

    try {
      const enquiryData = {
        vendorId: vendor.id,
        vendorName: vendor.name,
        coupleName: form.name,
        coupleEmail: form.email,
        couplePhone: form.phone || null,
        weddingDate: form.date,
        guestCount: form.guests,
        budgetRange: form.budget || null,
        message: form.message,
        leadSource: leadSource,
      };

      const { data, error: submitError } = await saveInquiry(enquiryData);

      if (submitError) throw submitError;

      // Send notification emails (couple confirmation + vendor lead notification)
      await sendEnquiryNotifications(enquiryData, vendor.email);

      // Track enquiry submitted
      trackEnquirySubmitted({ entityType: 'vendor', entityId: vendor.id ?? null, entityName: vendor.name ?? null, source: leadSource });

      // Success - move to success screen
      setStep(4);
    } catch (err) {
      console.error("Error submitting enquiry:", err);
      setError("Failed to send enquiry. Please try again.");
      setIsSubmitting(false);
    }
  };

  /* ── Input style ─────────────────────────────────────────────────────── */
  const inputStyle = {
    width: "100%", padding: "11px 14px", fontFamily: FB, fontSize: 13,
    background: C.card, color: C.text, border: `1px solid ${C.border2}`,
    borderRadius: "var(--lwd-radius-input)", outline: "none",
    transition: "border-color 0.25s",
  };
  const labelStyle = {
    display: "block", fontFamily: FB, fontSize: 10, fontWeight: 600,
    letterSpacing: "1.5px", textTransform: "uppercase", color: C.grey,
    marginBottom: 6,
  };

  /* ── Progress bars ───────────────────────────────────────────────────── */
  const ProgressBars = () => (
    <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          flex: 1, height: 3, borderRadius: 2,
          background: step >= i ? C.gold : C.border,
          transition: "background 0.3s",
        }} />
      ))}
    </div>
  );

  /* ── Button helpers ──────────────────────────────────────────────────── */
  const PrimaryBtn = ({ children, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled} style={{
      flex: 2, padding: "13px 20px", background: disabled ? C.border : C.gold,
      border: "none", borderRadius: "var(--lwd-radius-input)",
      color: disabled ? C.grey : "#fff", fontFamily: FB, fontSize: 12,
      fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase",
      cursor: disabled ? "default" : "pointer", transition: "background 0.2s",
    }}>{children}</button>
  );
  const GhostBtn = ({ children, onClick }) => (
    <button onClick={onClick} style={{
      flex: 1, padding: "11px 14px", background: "transparent",
      border: `1px solid ${C.border2}`, borderRadius: "var(--lwd-radius-input)",
      color: C.text, fontFamily: FB, fontSize: 11, fontWeight: 600,
      letterSpacing: "0.4px", cursor: "pointer", transition: "border-color 0.2s",
    }}>{children}</button>
  );

  /* ── Step 0: idle ────────────────────────────────────────────────────── */
  if (step === 0) {
    return (
      <div style={{ padding: 0 }}>
        {/* Price + rating */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: FD, fontSize: 29, fontWeight: 700, color: C.gold, lineHeight: 1.1 }}>
            From {vendor.priceFrom || "On request"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
            <span style={{ color: C.gold, fontSize: 13, letterSpacing: 1 }}>{stars(vendor.rating)}</span>
            <span style={{ fontFamily: FB, fontSize: 12, color: C.textLight || C.grey }}>
              {vendor.rating} ({vendor.reviews})
            </span>
          </div>
        </div>

        {/* Response badge */}
        {vendor.responseTime && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 10px", borderRadius: 20,
            background: "rgba(34,197,94,0.08)", marginBottom: 16,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.green || "#22c55e" }} />
            <span style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, color: C.green || "#22c55e" }}>
              Responds {vendor.responseTime.toLowerCase()}
            </span>
          </div>
        )}

        <div style={{ height: 1, background: C.border, marginBottom: 16 }} />

        {/* Primary CTA */}
        <button onClick={() => {
          setStep(1);
          if (!enquiryStartTracked.current) {
            enquiryStartTracked.current = true;
            trackEnquiryStarted({ entityType: 'vendor', entityId: vendor.id ?? null, entityName: vendor.name ?? null, source: leadSource });
          }
        }} style={{
          width: "100%", padding: "15px 20px", background: C.gold,
          border: "none", borderRadius: "var(--lwd-radius-input)",
          color: "#fff", fontFamily: FB, fontSize: 13, fontWeight: 700,
          letterSpacing: "0.6px", textTransform: "uppercase",
          cursor: "pointer", transition: "opacity 0.2s",
        }}>Check availability</button>

        {/* Activity signal */}
        <div style={{
          marginTop: 14, padding: "10px 12px", borderRadius: "var(--lwd-radius-input)",
          background: `${C.gold}11`, border: `1px solid ${C.gold}22`,
        }}>
          <span style={{ fontFamily: FB, fontSize: 12, fontWeight: 600, color: C.gold }}>
            🔥 3 couples enquired this week
          </span>
        </div>
      </div>
    );
  }

  /* ── Step 4: success ─────────────────────────────────────────────────── */
  if (step === 4) {
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
        <div style={{ fontFamily: FD, fontSize: 20, color: C.text, marginBottom: 8 }}>Enquiry Sent</div>
        <p style={{ fontFamily: FB, fontSize: 13, color: C.grey, lineHeight: 1.6, marginBottom: 8 }}>
          {vendor.name} will respond within {vendor.responseTime || "48 hours"}. Check your email for a confirmation.
        </p>
        <p style={{ fontFamily: FB, fontSize: 12, color: C.green || "#22c55e", fontWeight: 600, marginBottom: 20 }}>
          Typically replies within {vendor.responseTime || "24 hours"}
        </p>
        <button onClick={() => {
          setStep(0);
          setForm({ date: "", guests: 80, name: "", email: "", message: "" });
          setError("");
          setIsSubmitting(false);
        }} style={{
          padding: "11px 24px", background: C.gold, border: "none",
          borderRadius: "var(--lwd-radius-input)", color: "#fff",
          fontFamily: FB, fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}>Make another enquiry</button>
      </div>
    );
  }

  /* ── Steps 1-3: form ─────────────────────────────────────────────────── */
  return (
    <div>
      <ProgressBars />

      {step === 1 && (
        <div>
          <label style={labelStyle}>Preferred date</label>
          <input type="date" value={form.date} onChange={e => set("date", e.target.value)}
            style={inputStyle} onFocus={e => { e.target.style.borderColor = C.gold; }}
            onBlur={e => { e.target.style.borderColor = C.border2; }} />
        </div>
      )}

      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={labelStyle}>Estimated guests</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input type="range" min={20} max={200} step={10} value={form.guests}
                onChange={e => set("guests", +e.target.value)}
                style={{ flex: 1, accentColor: C.gold }} />
              <span style={{ fontFamily: FD, fontSize: 20, color: C.text, minWidth: 36, textAlign: "right" }}>
                {form.guests}
              </span>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Budget (optional)</label>
            <select value={form.budget} onChange={e => set("budget", e.target.value)}
              style={inputStyle}>
              <option value="">Select budget range...</option>
              <option value="£10k–£20k">£10k–£20k</option>
              <option value="£20k–£50k">£20k–£50k</option>
              <option value="£50k+">£50k+</option>
              <option value="£100k+">£100k+</option>
            </select>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Your name</label>
            <input type="text" value={form.name} placeholder="First and last name"
              onChange={e => set("name", e.target.value)} style={inputStyle}
              onFocus={e => { e.target.style.borderColor = C.gold; }}
              onBlur={e => { e.target.style.borderColor = C.border2; }} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" value={form.email} placeholder="you@example.com"
              onChange={e => set("email", e.target.value)} style={inputStyle}
              onFocus={e => { e.target.style.borderColor = C.gold; }}
              onBlur={e => { e.target.style.borderColor = C.border2; }} />
          </div>
          <div>
            <label style={labelStyle}>Message (optional)</label>
            <textarea rows={3} value={form.message} placeholder="Tell them about your vision..."
              onChange={e => set("message", e.target.value)}
              style={{ ...inputStyle, resize: "vertical", padding: "12px 14px" }}
              onFocus={e => { e.target.style.borderColor = C.gold; }}
              onBlur={e => { e.target.style.borderColor = C.border2; }} />
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div style={{
          padding: "12px", borderRadius: "var(--lwd-radius-input)",
          background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)",
          color: C.rose || "#dc2626", fontFamily: FB, fontSize: 12,
          marginBottom: 12,
        }}>
          {error}
        </div>
      )}

      {/* Nav buttons */}
      <div style={{ display: "flex", gap: 8, marginTop: 20, alignItems: "center" }}>
        {step > 1 && <GhostBtn onClick={() => setStep(s => s - 1)}>Back</GhostBtn>}
        <PrimaryBtn
          disabled={(step === 3 && !canSubmit) || isSubmitting}
          onClick={() => {
            if (step === 3) {
              handleSubmit();
            } else {
              setStep(s => s + 1);
            }
          }}
        >
          {isSubmitting ? "Sending..." : (step === 3 ? "Send enquiry" : "Continue")}
        </PrimaryBtn>
      </div>
      <div style={{ fontFamily: FB, fontSize: 10, color: C.grey, textAlign: "center", marginTop: 10, letterSpacing: "0.3px" }}>
        Step {step} of 3
      </div>
    </div>
  );
}
