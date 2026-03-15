/**
 * SidebarEnquiryCard
 *
 * The primary conversion module in the listing sidebar.
 * Shows pricing, rating, response badge, urgency signals, and CTA buttons.
 *
 * MODULAR, kept intentionally simple. The full enquiry/contact form experience
 * will be designed and built in a dedicated future phase.
 *
 * This card does NOT include an embedded contact form.
 * It provides a clean anchor point (.lwd-enquiry-anchor) for when the
 * full form is added.
 *
 * Props:
 *   entity    {object} , listing/venue data
 *   C         {object} , colour palette
 *   onEnquire {fn}     , primary CTA callback (open modal, scroll to form, etc.)
 *   onSave    {fn}     , save/shortlist callback
 *   onCompare {fn}     , compare callback
 *   isSaved   {bool}
 *   isCompared{bool}
 */

const FD = "var(--font-heading-primary)";
const FB = "var(--font-body)";

function StarRow({ rating, reviews, C }) {
  if (!rating) return null;
  const full = Math.round(rating);
  const stars = "★".repeat(full) + "☆".repeat(5 - full);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <span style={{ color: C.gold, fontSize: 13, letterSpacing: 1 }}>{stars}</span>
      <span style={{ fontFamily: FB, fontSize: 12, color: C.textLight || C.grey }}>
        {rating}
        {reviews ? ` · ${reviews} reviews` : ""}
      </span>
    </div>
  );
}

function ResponseBadge({ responseTime, C }) {
  if (!responseTime) return null;
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "5px 10px",
      borderRadius: 20,
      background: "rgba(34,197,94,0.08)",
      marginBottom: 16,
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%",
        background: C.green || "#22c55e",
        display: "inline-block",
      }} />
      <span style={{
        fontFamily: FB,
        fontSize: 11,
        fontWeight: 600,
        color: C.green || "#22c55e",
      }}>
        Responds {typeof responseTime === "string" ? responseTime.toLowerCase() : responseTime}
      </span>
    </div>
  );
}

function UrgencySignals({ entity, C }) {
  // Build signal list from entity data, with generic fallback
  const signals = [];
  if (entity.enquirySignal)      signals.push({ icon: "🔔", text: entity.enquirySignal });
  if (entity.lastBookedSignal)   signals.push({ icon: "📅", text: entity.lastBookedSignal });
  if (entity.availabilitySignal) signals.push({ icon: "⏳", text: entity.availabilitySignal });

  // Fallback generic signals if none provided
  if (!signals.length) {
    signals.push({ icon: "🔔", text: "Couples are enquiring this week" });
  }

  return (
    <div style={{
      padding: "12px 14px",
      background: (C.goldDim || "rgba(201,168,76,0.06)"),
      border: `1px solid ${C.goldBorder || "rgba(201,168,76,0.15)"}`,
      borderRadius: 3,
      marginBottom: 16,
    }}>
      {signals.slice(0, 2).map((s, i) => (
        <div key={i} style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          paddingTop: i > 0 ? 8 : 0,
          borderTop: i > 0 ? `1px solid ${C.goldBorder || "rgba(201,168,76,0.15)"}` : "none",
        }}>
          <span style={{ fontSize: 12, flexShrink: 0 }}>{s.icon}</span>
          <span style={{ fontFamily: FB, fontSize: 12, color: C.text, lineHeight: 1.4 }}>
            {s.text}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function SidebarEnquiryCard({
  entity = {},
  C = {},
  onEnquire,
  onSave,
  onCompare,
  isSaved = false,
  isCompared = false,
}) {
  const priceDisplay = entity.priceFrom
    ? `From ${entity.priceFrom}`
    : entity.priceLabel || null;

  return (
    // .lwd-enquiry-anchor, future contact form will be placed here or triggered from here
    <div className="lwd-enquiry-anchor" style={{
      border: `1px solid ${C.border}`,
      background: C.surface || C.card,
      padding: "28px 24px",
      boxShadow: C.shadowLg || "0 8px 32px rgba(0,0,0,0.08)",
    }}>

      {/* Price */}
      {priceDisplay && (
        <div style={{
          fontFamily: FD,
          fontSize: 30,
          fontWeight: 700,
          color: C.gold,
          marginBottom: 6,
          lineHeight: 1,
        }}>
          {priceDisplay}
        </div>
      )}

      {/* Stars + response badge */}
      <StarRow rating={entity.rating} reviews={entity.reviews} C={C} />
      <ResponseBadge responseTime={entity.responseTime} C={C} />

      {/* Divider */}
      <div style={{ height: 1, background: C.border, marginBottom: 16 }} />

      {/* Urgency / conversion signals */}
      <UrgencySignals entity={entity} C={C} />

      {/* Primary CTA, full contact form is a future phase */}
      <button
        onClick={onEnquire}
        style={{
          width: "100%",
          padding: "15px 20px",
          marginBottom: 10,
          background: C.gold,
          border: "none",
          borderRadius: "var(--lwd-radius-input, 3px)",
          color: "#fff",
          fontFamily: FB,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.8px",
          textTransform: "uppercase",
          cursor: "pointer",
          transition: "opacity 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
      >
        Request Information
      </button>

      {/* Secondary actions: Save + Compare */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button
          onClick={onSave}
          style={{
            padding: "10px 8px",
            background: "transparent",
            border: `1px solid ${isSaved ? C.gold : (C.border2 || C.border)}`,
            borderRadius: "var(--lwd-radius-input, 3px)",
            color: isSaved ? C.gold : (C.text),
            fontFamily: FB,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.5px",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = isSaved ? C.gold : (C.border2 || C.border);
            e.currentTarget.style.color = isSaved ? C.gold : C.text;
          }}
        >
          {isSaved ? "♥ Saved" : "♡ Save"}
        </button>

        <button
          onClick={onCompare}
          style={{
            padding: "10px 8px",
            background: "transparent",
            border: `1px solid ${isCompared ? C.gold : (C.border2 || C.border)}`,
            borderRadius: "var(--lwd-radius-input, 3px)",
            color: isCompared ? C.gold : C.text,
            fontFamily: FB,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.5px",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = isCompared ? C.gold : (C.border2 || C.border);
            e.currentTarget.style.color = isCompared ? C.gold : C.text;
          }}
        >
          {isCompared ? "✓ Comparing" : "⊞ Compare"}
        </button>
      </div>

      {/* Subtle trust note, will be replaced by full form trust signals in future phase */}
      <p style={{
        fontFamily: FB,
        fontSize: 11,
        color: C.textMuted || C.grey,
        textAlign: "center",
        margin: "14px 0 0 0",
        lineHeight: 1.5,
      }}>
        Free to enquire · No booking fees
      </p>
    </div>
  );
}
