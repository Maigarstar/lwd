/**
 * SidebarOfferCard
 *
 * Highlights a featured package, special offer, or exclusive deal
 * associated with the listing. Designed to draw attention without
 * being pushy — the luxury tone is maintained through restraint.
 *
 * Props:
 *   entity     {object} — listing data (entity.featuredOffer, entity.packages[0])
 *   C          {object} — colour palette
 *   offer      {object} — optional explicit override:
 *                         { title, description, badge, ctaLabel, ctaUrl }
 *   onCtaClick {fn}     — callback when CTA tapped
 */

const FD = "var(--font-heading-primary)";
const FB = "var(--font-body)";

export default function SidebarOfferCard({ entity = {}, C = {}, offer, onCtaClick }) {
  // Resolve offer data
  const offerData = offer
    || entity.featuredOffer
    || (entity.packages && entity.packages[0])
    || null;

  if (!offerData) return null;

  const {
    title       = "Featured Package",
    description = null,
    badge       = "Exclusive",
    ctaLabel    = "View Details",
    ctaUrl      = null,
  } = offerData;

  const handleCta = () => {
    if (onCtaClick) { onCtaClick(offerData); return; }
    if (ctaUrl) window.open(ctaUrl, "_blank", "noopener");
  };

  return (
    <div style={{
      border: `1px solid ${C.goldBorder || "rgba(201,168,76,0.25)"}`,
      background: C.surface || C.card,
      padding: "18px 22px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Decorative gold left accent */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, bottom: 0,
        width: 3,
        background: `linear-gradient(180deg, ${C.gold}, ${C.gold2 || C.gold})`,
      }} />

      {/* Badge chip */}
      {badge && (
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "3px 9px",
          background: C.goldDim || "rgba(201,168,76,0.1)",
          border: `1px solid ${C.goldBorder || "rgba(201,168,76,0.2)"}`,
          borderRadius: 20,
          fontFamily: FB,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.8px",
          textTransform: "uppercase",
          color: C.gold,
          marginBottom: 10,
        }}>
          ✦ {badge}
        </div>
      )}

      {/* Package title */}
      <div style={{
        fontFamily: FD,
        fontSize: 16,
        color: C.text,
        lineHeight: 1.3,
        marginBottom: description ? 8 : 14,
      }}>
        {title}
      </div>

      {/* Description */}
      {description && (
        <p style={{
          fontFamily: FB,
          fontSize: 12,
          color: C.textLight || C.grey,
          lineHeight: 1.6,
          margin: "0 0 14px 0",
        }}>
          {description}
        </p>
      )}

      {/* CTA */}
      <button
        onClick={handleCta}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "9px 16px",
          background: "transparent",
          border: `1px solid ${C.gold}`,
          borderRadius: "var(--lwd-radius-input, 3px)",
          color: C.gold,
          fontFamily: FB,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.5px",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = C.gold;
          e.currentTarget.style.color = "#fff";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = C.gold;
        }}
      >
        {ctaLabel} →
      </button>
    </div>
  );
}
