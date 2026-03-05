// ─── src/components/vendor/VendorMobileBar.jsx ───────────────────────────────
// Mobile-only fixed bottom bar + bottom-sheet enquiry.
// Matches venue MobileLeadBar pattern exactly.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import VendorContactForm from "./VendorContactForm";

const FD = "var(--font-heading-primary)";
const FB = "var(--font-body)";

function stars(r = 0) {
  const x = Math.max(0, Math.min(5, Math.round(r)));
  return "★".repeat(x) + "☆".repeat(5 - x);
}

export default function VendorMobileBar({ vendor, C, onChat }) {
  const [open, setOpen] = useState(false);

  if (!vendor || !C) return null;

  return (
    <>
      {/* ── Fixed bottom bar ─────────────────────────────────────────────── */}
      <div className="vpt-mobile-bar" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 900,
        background: C.surface || C.card, borderTop: `1px solid ${C.border}`,
        padding: "12px 20px", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
        animation: "slideUp 0.4s ease",
      }}>
        {/* Left: price + stars */}
        <div>
          <div style={{ fontFamily: FD, fontSize: 18, color: C.gold }}>
            From {vendor.priceFrom || "On request"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
            <span style={{ color: C.gold, fontSize: 11, letterSpacing: 1 }}>{stars(vendor.rating)}</span>
            <span style={{ fontFamily: FB, fontSize: 11, color: C.textLight || C.grey }}>
              {vendor.reviews} reviews
            </span>
          </div>
          {vendor.enquirySignal && (
            <div style={{ fontFamily: FB, fontSize: 11, color: C.text, opacity: 0.85, marginTop: 3, lineHeight: 1.4 }}>
              {vendor.enquirySignal}
            </div>
          )}
        </div>

        {/* Right: Send enquiry + Chat */}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setOpen(true)} style={{
            padding: "12px 24px", background: C.gold, border: "none",
            borderRadius: "var(--lwd-radius-input)", color: "#fff",
            fontFamily: FB, fontSize: 13, fontWeight: 700,
            letterSpacing: "0.6px", textTransform: "uppercase", cursor: "pointer",
          }}>Send enquiry</button>
          {onChat && (
            <button onClick={onChat} style={{
              padding: "12px 16px", background: "transparent",
              border: `1px solid ${C.border2 || C.border}`,
              borderRadius: "var(--lwd-radius-input)", color: C.text,
              fontFamily: FB, fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>💬</button>
          )}
        </div>
      </div>

      {/* ── Bottom sheet overlay ──────────────────────────────────────────── */}
      {open && (
        <div onClick={() => setOpen(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 950,
          display: "flex", alignItems: "flex-end",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: "100%", background: C.surface || C.card, padding: 24,
            borderTop: `3px solid ${C.gold}`,
            animation: "slideUp 0.3s ease",
            maxHeight: "85vh", overflowY: "auto",
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontFamily: FD, fontSize: 22, color: C.text }}>Send enquiry</div>
              <button onClick={() => setOpen(false)} style={{
                background: "none", border: "none", fontSize: 22,
                color: C.textMuted || C.grey, cursor: "pointer",
              }}>×</button>
            </div>

            {/* Embedded form */}
            <VendorContactForm vendor={vendor} C={C} />
          </div>
        </div>
      )}
    </>
  );
}
