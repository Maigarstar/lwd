// ─── src/components/vendor/VendorSidebar.jsx ─────────────────────────────────
// 5 stacked sidebar cards matching venue sidebar styling.
// Cards: ContactPerson, Conversion, QuickFacts, SocialLinks, ContactForm
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import VendorContactForm from "./VendorContactForm";
import ExternalLinkModal from "../ExternalLinkModal";
import { trackExternalClick, hasSeenModalThisSession, markModalSeen } from "../../services/outboundClickService";

const FD = "var(--font-heading-primary)";
const FB = "var(--font-body)";

function stars(r = 0) {
  const x = Math.max(0, Math.min(5, Math.round(r)));
  return "★".repeat(x) + "☆".repeat(5 - x);
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Card 1, Contact Person (clones venue OwnerCard)
   ═══════════════════════════════════════════════════════════════════════════════ */
function ContactPersonCard({ vendor, C }) {
  const owner = vendor.owner || {};
  const name = owner.name || vendor.name;
  const title = owner.title || vendor.serviceTier || "";
  const photo = owner.photo || vendor.imgs?.[0];
  const bio = owner.bio;
  const memberSince = owner.memberSince;

  return (
    <div style={{ border: `1px solid ${C.border}`, background: C.surface || C.card, overflow: "hidden" }}>
      {/* Gold top accent */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${C.gold}, ${C.green || "#22c55e"})` }} />

      <div style={{ padding: "20px 22px" }}>
        {/* Header: photo + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            {photo && (
              <img src={photo} alt={name} loading="lazy" style={{
                width: 58, height: 58, borderRadius: "50%", objectFit: "cover",
                border: `2px solid ${C.gold}`, display: "block",
              }} />
            )}
            {vendor.verified && (
              <div style={{
                position: "absolute", bottom: 0, right: 0,
                width: 17, height: 17, borderRadius: "50%",
                background: C.gold, border: `2px solid ${C.surface || C.card}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, color: "#fff", fontWeight: 700,
              }}>✓</div>
            )}
          </div>
          <div>
            <div style={{ fontFamily: FD, fontSize: 16, color: C.text, lineHeight: 1.2, marginBottom: 2 }}>{name}</div>
            {title && <div style={{ fontFamily: FB, fontSize: 12, color: C.textLight || C.grey, marginBottom: 1 }}>{title}</div>}
            {memberSince && (
              <div style={{ fontFamily: FB, fontSize: 11, color: C.gold, fontWeight: 600, letterSpacing: "0.2px" }}>
                ✦ LWD Partner since {memberSince}
              </div>
            )}
          </div>
        </div>

        {/* Quote */}
        {bio && (
          <div style={{ borderLeft: `2px solid ${C.gold}22`, paddingLeft: 14, marginBottom: 16 }}>
            <p style={{ fontFamily: FD, fontSize: 13, fontStyle: "italic", color: C.textMid || C.grey, lineHeight: 1.75, margin: 0 }}>
              "{bio}"
            </p>
          </div>
        )}

        {/* Stats grid */}
        <StatsGrid vendor={vendor} C={C} />
      </div>
    </div>
  );
}

function StatsGrid({ vendor, C }) {
  const items = [
    vendor.responseTime && { label: "Responds in", value: vendor.responseTime },
    vendor.responseRate && { label: "Response rate", value: `${vendor.responseRate}%` },
    vendor.weddingsPlanned && { label: "Weddings planned", value: `${vendor.weddingsPlanned}+` },
    vendor.owner?.memberSince && { label: "Partner since", value: `${vendor.owner.memberSince}` },
  ].filter(Boolean);

  if (!items.length) return null;

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0,
      borderTop: `1px solid ${C.border}`, paddingTop: 14,
    }}>
      {items.map((s, i) => (
        <div key={s.label} style={{
          padding: "10px 0",
          borderRight: i % 2 === 0 ? `1px solid ${C.border}` : "none",
          paddingRight: i % 2 === 0 ? 16 : 0,
          paddingLeft: i % 2 === 1 ? 16 : 0,
        }}>
          <div style={{ fontFamily: FB, fontSize: 10, color: C.textMuted || C.grey2 || C.grey, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 3 }}>
            {s.label}
          </div>
          <div style={{ fontFamily: FD, fontSize: 17, color: C.text }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Conversion Signals (max 3 rows) ─────────────────────────────────────────── */
function ConversionSignals({ vendor, C }) {
  const signals = [];
  if (vendor.enquirySignal)       signals.push(vendor.enquirySignal);
  if (vendor.lastBookedSignal)    signals.push(vendor.lastBookedSignal);
  if (vendor.profileViewsSignal)  signals.push(vendor.profileViewsSignal);
  if (vendor.availabilitySignal)  signals.push(vendor.availabilitySignal);
  if (vendor.trustBadges?.length) signals.push(vendor.trustBadges[0]);
  if (!signals.length)            signals.push("Couples are enquiring this week");
  const rows = signals.slice(0, 3);

  return (
    <div style={{ marginTop: 10, marginBottom: 14 }}>
      {rows.map((s, i) => (
        <div key={i} style={{
          fontFamily: FB, fontSize: 12, color: C.text, opacity: 0.85,
          lineHeight: 1.5,
        }}>{s}</div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Card 2, Conversion (price, stars, CTAs)
   ═══════════════════════════════════════════════════════════════════════════════ */
function ConversionCard({ vendor, C, onChat, onSave, isSaved }) {
  return (
    <div style={{
      border: `1px solid ${C.border}`, background: C.surface || C.card,
      padding: 28, boxShadow: C.shadowLg || "0 8px 32px rgba(0,0,0,0.12)",
    }}>
      {/* Price */}
      <div style={{ fontFamily: FD, fontSize: 29, fontWeight: 700, color: C.gold, marginBottom: 4 }}>
        From {vendor.priceFrom || "On request"}
      </div>

      {/* Stars */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <span style={{ color: C.gold, fontSize: 13, letterSpacing: 1 }}>{stars(vendor.rating)}</span>
        <span style={{ fontFamily: FB, fontSize: 12, color: C.textLight || C.grey }}>
          {vendor.rating} ({vendor.reviews})
        </span>
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

      {/* Conversion signals */}
      <ConversionSignals vendor={vendor} C={C} />

      {/* Send enquiry CTA */}
      <button onClick={() => {
        const formEl = document.querySelector(".vpt-sidebar .vpt-form-anchor");
        if (formEl) formEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }} style={{
        width: "100%", padding: "14px 20px", marginBottom: 8,
        background: C.gold, border: "none", borderRadius: "var(--lwd-radius-input)",
        color: "#fff", fontFamily: FB, fontSize: 13, fontWeight: 700,
        letterSpacing: "0.6px", textTransform: "uppercase", cursor: "pointer",
      }}>Send enquiry</button>

      {/* Chat + Save row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button onClick={onChat} style={{
          padding: "10px 8px", background: "transparent",
          border: `1px solid ${C.border2 || C.border}`, borderRadius: "var(--lwd-radius-input)",
          color: C.text, fontFamily: FB, fontSize: 11, fontWeight: 700,
          letterSpacing: "0.4px", textTransform: "uppercase", cursor: "pointer",
        }}>💬 Chat</button>
        <button onClick={onSave} style={{
          padding: "10px 8px", background: "transparent",
          border: `1px solid ${C.border2 || C.border}`, borderRadius: "var(--lwd-radius-input)",
          color: isSaved ? C.gold : C.text, fontFamily: FB, fontSize: 11, fontWeight: 700,
          letterSpacing: "0.4px", textTransform: "uppercase", cursor: "pointer",
        }}>{isSaved ? "♥ Saved" : "♡ Save"}</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Card 3, Quick Facts
   ═══════════════════════════════════════════════════════════════════════════════ */
function QuickFactsCard({ vendor, C }) {
  const rows = [
    vendor.coverage?.length && { label: "Regions served", value: vendor.coverage.join(", ") },
    vendor.languages?.length && { label: "Languages", value: Array.isArray(vendor.languages) ? vendor.languages.join(", ") : vendor.languages },
    vendor.planningStyle && { label: "Planning style", value: vendor.planningStyle },
    (vendor.city || vendor.region) && { label: "Base", value: [vendor.city, vendor.region].filter(Boolean).join(", ") },
    vendor.travelPolicy && { label: "Travel policy", value: vendor.travelPolicy },
  ].filter(Boolean);

  if (!rows.length) return null;

  return (
    <div style={{ border: `1px solid ${C.border}`, background: C.surface || C.card, padding: "16px 22px" }}>
      <div style={{ fontFamily: FB, fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: C.gold, marginBottom: 12 }}>
        Quick facts
      </div>
      {rows.map((r, i) => (
        <div key={r.label} style={{
          padding: "10px 0",
          borderTop: i > 0 ? `1px solid ${C.border}` : "none",
        }}>
          <div style={{ fontFamily: FB, fontSize: 10, letterSpacing: "0.5px", textTransform: "uppercase", color: C.textMuted || C.grey, marginBottom: 3 }}>
            {r.label}
          </div>
          <div style={{ fontFamily: FD, fontSize: 15, color: C.text, lineHeight: 1.4 }}>{r.value}</div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Card 4, Social Links
   ═══════════════════════════════════════════════════════════════════════════════ */
// Social link types that go direct (no modal) — track silently
const SOCIAL_LINK_TYPES = new Set(['instagram', 'pinterest', 'tiktok', 'facebook', 'twitter', 'youtube', 'linkedin']);

function SocialLinksCard({ vendor, venueId, C }) {
  const [exitConfig, setExitConfig] = useState(null);
  const s = vendor.socials || {};

  const allLinks = [
    s.instagram && { label: "IG",  href: s.instagram, icon: "📷", type: "instagram" },
    s.pinterest && { label: "PT",  href: s.pinterest, icon: "📌", type: "pinterest" },
    s.tiktok    && { label: "TK",  href: s.tiktok,    icon: "🎵", type: "tiktok"    },
    s.website   && { label: "Web", href: s.website,   icon: "🌐", type: "website"   },
  ].filter(Boolean);

  if (!allLinks.length) return null;

  const handleClick = (link) => {
    const trackData = {
      entityType: 'vendor',
      entityId: vendor.id || null,
      venueId: venueId || null,
      linkType: link.type,
      url: link.href,
    };

    if (SOCIAL_LINK_TYPES.has(link.type)) {
      // Social — track immediately + open directly
      trackExternalClick(trackData);
      window.open(link.href, '_blank', 'noopener,noreferrer');
    } else {
      // Website — modal once per session, then direct
      if (!hasSeenModalThisSession()) {
        setExitConfig({ url: link.href, name: vendor.name || vendor.business_name || 'this vendor' });
      } else {
        trackExternalClick(trackData);
        window.open(link.href, '_blank', 'noopener,noreferrer');
      }
    }
  };

  return (
    <>
      <div style={{ border: `1px solid ${C.border}`, background: C.surface || C.card, padding: "14px 22px" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {allLinks.map(l => (
            <button key={l.label} onClick={() => handleClick(l)}
              style={{
                width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                border: `1px solid ${C.border2 || C.border}`, borderRadius: "var(--lwd-radius-input)",
                fontSize: 15, background: "none", cursor: "pointer",
                color: C.text, transition: "border-color 0.2s, color 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border2 || C.border; e.currentTarget.style.color = C.text; }}
              title={l.label}
            >{l.icon}</button>
          ))}
        </div>
      </div>

      {exitConfig && (
        <ExternalLinkModal
          name={exitConfig.name}
          url={exitConfig.url}
          onClose={() => setExitConfig(null)}
          onContinue={() => {
            markModalSeen();
            trackExternalClick({
              entityType: 'vendor',
              entityId: vendor.id || null,
              venueId: venueId || null,
              linkType: 'website',
              url: exitConfig.url,
            });
          }}
        />
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Main export, stacks all 5 cards
   ═══════════════════════════════════════════════════════════════════════════════ */
export default function VendorSidebar({ vendor, vendorType, venueId, C, onChat, onSave, isSaved }) {
  if (!vendor || !C) return null;

  return (
    <>
      <ContactPersonCard vendor={vendor} C={C} />
      <ConversionCard vendor={vendor} C={C} onChat={onChat} onSave={onSave} isSaved={isSaved} />
      <QuickFactsCard vendor={vendor} C={C} />
      <SocialLinksCard vendor={vendor} venueId={venueId} C={C} />
      <div className="vpt-form-anchor">
        <div style={{ border: `1px solid ${C.border}`, background: C.surface || C.card, padding: 28 }}>
          <div style={{ fontFamily: FB, fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: C.gold, marginBottom: 16 }}>
            Send an enquiry
          </div>
          <VendorContactForm vendor={vendor} C={C} leadSource="Venue Profile" />
        </div>
      </div>
    </>
  );
}

// Re-export ContactPersonCard for mobile placement
export { ContactPersonCard };
