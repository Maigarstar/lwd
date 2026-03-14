// ─── src/components/cards/PlannerCard.jsx ─────────────────────────────────────
// Person-focused card for wedding planners. Supports grid (default) and list modes.
// Hover-to-play video, social media icons, service tier gold pill,
// CuratedIndexBadge, StarRating, 2-line desc clamp, specialty pills.
// Click image → full-screen media gallery (images + video) with left/right nav.
// Enquire button → opens enquiry form modal.

import { useState, useRef, useCallback, useEffect } from "react";
import { useTheme } from "../../theme/ThemeContext";
import Stars from "../ui/Stars";
import Pill from "../ui/Pill";
import { GoldBadge, VerifiedBadge } from "../ui/Badges";
import CuratedIndexBadge from "../ui/CuratedIndexBadge";
import MediaGalleryModal from "../ui/MediaGalleryModal";
import EnquiryFormModal from "../ui/EnquiryFormModal";

const GOLD = "#C9A84C";
const GD   = "var(--font-heading-primary)";
const NU   = "var(--font-body)";

// ── Social SVG icons ─────────────────────────────────────────────────────────
const SOCIAL_ICONS = {
  instagram: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  ),
  tiktok: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.89a8.28 8.28 0 0 0 4.76 1.5V6.94a4.85 4.85 0 0 1-1-.25z" />
    </svg>
  ),
  pinterest: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0a12 12 0 0 0-4.37 23.17c-.1-.94-.2-2.4.04-3.44l1.43-6.07s-.36-.73-.36-1.8c0-1.69.98-2.95 2.2-2.95 1.04 0 1.54.78 1.54 1.71 0 1.04-.66 2.6-1.01 4.04-.29 1.2.6 2.18 1.79 2.18 2.14 0 3.79-2.26 3.79-5.52 0-2.89-2.08-4.9-5.04-4.9-3.43 0-5.45 2.57-5.45 5.23 0 1.04.4 2.15.9 2.75a.36.36 0 0 1 .08.35l-.33 1.36c-.05.22-.18.27-.41.16-1.55-.72-2.52-2.98-2.52-4.8 0-3.91 2.84-7.5 8.18-7.5 4.3 0 7.63 3.06 7.63 7.14 0 4.27-2.69 7.7-6.43 7.7-1.25 0-2.43-.65-2.84-1.42l-.77 2.95c-.28 1.08-1.04 2.43-1.55 3.26A12 12 0 1 0 12 0z" />
    </svg>
  ),
  website: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
};

const SOCIAL_LABELS = { instagram: "Instagram", tiktok: "TikTok", pinterest: "Pinterest", website: "Website" };

// ── Social row component ─────────────────────────────────────────────────────
export { SOCIAL_ICONS };
export function SocialRow({ socials, color, phone, whatsapp, email, darkMode }) {
  const [hovKey, setHovKey] = useState(null);
  const [showPhone, setShowPhone] = useState(false);
  const [showWa, setShowWa] = useState(false);

  const entries = socials ? Object.entries(socials).filter(([k]) => SOCIAL_ICONS[k]) : [];
  if (!entries.length && !phone && !whatsapp && !email) return null;

  const baseBg     = darkMode ? "rgba(255,255,255,0.06)" : "rgba(128,128,128,0.06)";
  const baseBorder = darkMode ? "rgba(255,255,255,0.12)" : "rgba(128,128,128,0.12)";

  const circleStyle = (isHov) => ({
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    width:          28,
    height:         28,
    borderRadius:   "50%",
    background:     isHov ? "rgba(201,168,76,0.12)" : baseBg,
    border:         `1px solid ${isHov ? "rgba(201,168,76,0.3)" : baseBorder}`,
    color:          isHov ? GOLD : color,
    transition:     "all 0.2s",
    textDecoration: "none",
    cursor:         "pointer",
    padding:        0,
    lineHeight:     1,
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
      {entries.map(([key, url]) => (
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          title={SOCIAL_LABELS[key]}
          aria-label={SOCIAL_LABELS[key]}
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => setHovKey(key)}
          onMouseLeave={() => setHovKey(null)}
          style={circleStyle(hovKey === key)}
        >
          {SOCIAL_ICONS[key]}
        </a>
      ))}

      {/* Email icon */}
      {email && (
        <a
          href={`mailto:${email}`}
          title={email}
          aria-label={`Email ${email}`}
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => setHovKey("_email")}
          onMouseLeave={() => setHovKey(null)}
          style={circleStyle(hovKey === "_email")}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </a>
      )}

      {/* Phone icon, reveals number on click */}
      {phone && (
        showPhone ? (
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            onClick={(e) => e.stopPropagation()}
            title={phone}
            aria-label={`Call ${phone}`}
            onMouseEnter={() => setHovKey("_phone")}
            onMouseLeave={() => setHovKey(null)}
            style={{
              display:        "inline-flex",
              alignItems:     "center",
              gap:            5,
              fontFamily:     NU,
              fontSize:       11,
              color:          GOLD,
              textDecoration: "none",
              padding:        "0 10px",
              height:         28,
              borderRadius:   14,
              background:     "rgba(201,168,76,0.10)",
              border:         "1px solid rgba(201,168,76,0.3)",
              transition:     "all 0.25s",
              whiteSpace:     "nowrap",
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
            </svg>
            {phone}
          </a>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); setShowPhone(true); }}
            title="Show phone number"
            aria-label="Show phone number"
            onMouseEnter={() => setHovKey("_phone")}
            onMouseLeave={() => setHovKey(null)}
            style={circleStyle(hovKey === "_phone")}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
            </svg>
          </button>
        )
      )}

      {/* WhatsApp icon, reveals link on click */}
      {whatsapp && (
        showWa ? (
          <a
            href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Chat on WhatsApp"
            aria-label="Chat on WhatsApp"
            onMouseEnter={() => setHovKey("_wa")}
            onMouseLeave={() => setHovKey(null)}
            style={{
              display:        "inline-flex",
              alignItems:     "center",
              gap:            5,
              fontFamily:     NU,
              fontSize:       11,
              color:          "#25D366",
              textDecoration: "none",
              padding:        "0 10px",
              height:         28,
              borderRadius:   14,
              background:     "rgba(37,211,102,0.08)",
              border:         "1px solid rgba(37,211,102,0.25)",
              transition:     "all 0.25s",
              whiteSpace:     "nowrap",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </a>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); setShowWa(true); }}
            title="WhatsApp"
            aria-label="Chat on WhatsApp"
            onMouseEnter={() => setHovKey("_wa")}
            onMouseLeave={() => setHovKey(null)}
            style={{
              ...circleStyle(hovKey === "_wa"),
              color: hovKey === "_wa" ? "#25D366" : color,
              background: hovKey === "_wa" ? "rgba(37,211,102,0.10)" : baseBg,
              border: `1px solid ${hovKey === "_wa" ? "rgba(37,211,102,0.3)" : baseBorder}`,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </button>
        )
      )}
    </div>
  );
}

// ── Contact reveal row (phone + WhatsApp, revealed on click) ────────────────
export function ContactRevealRow({ phone, whatsapp, color, darkMode }) {
  const [showPhone, setShowPhone] = useState(false);
  const [showWhatsapp, setShowWhatsapp] = useState(false);

  if (!phone && !whatsapp) return null;

  const btnBg = darkMode ? "rgba(255,255,255,0.06)" : "rgba(128,128,128,0.06)";
  const btnBorder = darkMode ? "rgba(255,255,255,0.12)" : "rgba(128,128,128,0.12)";
  const hovBg = "rgba(201,168,76,0.1)";
  const hovBorder = "rgba(201,168,76,0.3)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
      {/* Phone */}
      {phone && (
        showPhone ? (
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              display:        "inline-flex",
              alignItems:     "center",
              gap:            5,
              fontFamily:     NU,
              fontSize:       11,
              color:          GOLD,
              textDecoration: "none",
              padding:        "4px 10px",
              borderRadius:   14,
              background:     hovBg,
              border:         `1px solid ${hovBorder}`,
              transition:     "all 0.2s",
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
            </svg>
            {phone}
          </a>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); setShowPhone(true); }}
            style={{
              display:        "inline-flex",
              alignItems:     "center",
              gap:            5,
              fontFamily:     NU,
              fontSize:       10,
              fontWeight:     600,
              letterSpacing:  "0.5px",
              color:          color || "rgba(128,128,128,0.7)",
              background:    btnBg,
              border:        `1px solid ${btnBorder}`,
              borderRadius:  14,
              padding:       "4px 10px",
              cursor:        "pointer",
              transition:    "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = hovBorder; e.currentTarget.style.color = GOLD; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = btnBorder; e.currentTarget.style.color = color || "rgba(128,128,128,0.7)"; }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
            </svg>
            Show Number
          </button>
        )
      )}

      {/* WhatsApp */}
      {whatsapp && (
        showWhatsapp ? (
          <a
            href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              display:        "inline-flex",
              alignItems:     "center",
              gap:            5,
              fontFamily:     NU,
              fontSize:       11,
              color:          "#25D366",
              textDecoration: "none",
              padding:        "4px 10px",
              borderRadius:   14,
              background:     "rgba(37,211,102,0.08)",
              border:         "1px solid rgba(37,211,102,0.25)",
              transition:     "all 0.2s",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </a>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); setShowWhatsapp(true); }}
            style={{
              display:        "inline-flex",
              alignItems:     "center",
              gap:            5,
              fontFamily:     NU,
              fontSize:       10,
              fontWeight:     600,
              letterSpacing:  "0.5px",
              color:          color || "rgba(128,128,128,0.7)",
              background:    btnBg,
              border:        `1px solid ${btnBorder}`,
              borderRadius:  14,
              padding:       "4px 10px",
              cursor:        "pointer",
              transition:    "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(37,211,102,0.4)"; e.currentTarget.style.color = "#25D366"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = btnBorder; e.currentTarget.style.color = color || "rgba(128,128,128,0.7)"; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </button>
        )
      )}
    </div>
  );
}

// ── Hover video media (image + video overlay) ────────────────────────────────
export function HoverMedia({ src, videoUrl, alt, hov }) {
  const vidRef = useRef(null);

  // Trigger play/pause based on parent hover state
  if (hov && vidRef.current?.paused) {
    vidRef.current.currentTime = 0;
    vidRef.current.play().catch(() => {});
  }
  if (!hov && vidRef.current && !vidRef.current.paused) {
    vidRef.current.pause();
  }

  return (
    <>
      {/* Static image, always present */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        style={{
          width:      "100%",
          height:     "100%",
          objectFit:  "cover",
          transform:  hov ? "scale(1.05)" : "scale(1)",
          transition: "transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      />
      {/* Video overlay, fades in on hover */}
      {videoUrl && (
        <video
          ref={vidRef}
          src={videoUrl}
          muted
          loop
          playsInline
          preload="none"
          style={{
            position:   "absolute",
            inset:      0,
            width:      "100%",
            height:     "100%",
            objectFit:  "cover",
            opacity:    hov ? 1 : 0,
            transition: "opacity 0.6s ease",
          }}
        />
      )}
      {/* Play button hint for video cards (visible when not hovering) */}
      {videoUrl && !hov && (
        <div
          aria-hidden="true"
          style={{
            position:       "absolute",
            top:            "50%",
            left:           "50%",
            transform:      "translate(-50%, -50%)",
            width:          44,
            height:         44,
            borderRadius:   "50%",
            background:     "rgba(0,0,0,0.45)",
            backdropFilter: "blur(6px)",
            border:         "1.5px solid rgba(255,255,255,0.25)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            zIndex:         3,
            transition:     "opacity 0.3s",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)">
            <polygon points="8,5 20,12 8,19" />
          </svg>
        </div>
      )}
    </>
  );
}

// ── Image count badge (shows total images + video) ──────────────────────────
function MediaCountBadge({ imgCount, hasVideo }) {
  const total = imgCount + (hasVideo ? 1 : 0);
  if (total <= 1) return null;
  return (
    <div
      aria-hidden="true"
      style={{
        position:       "absolute",
        bottom:         10,
        right:          10,
        padding:        "4px 10px",
        borderRadius:   12,
        background:     "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        color:          "#fff",
        fontSize:       9,
        fontFamily:     NU,
        fontWeight:     600,
        letterSpacing:  "0.5px",
        display:        "flex",
        alignItems:     "center",
        gap:            5,
        zIndex:         2,
      }}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
      </svg>
      {total}
    </div>
  );
}

// ── Gallery + Watch hint (bottom left on hover) ─────────────────────────────
function MediaHintBadge({ hasVideo }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position:       "absolute",
        bottom:         10,
        left:           10,
        padding:        "5px 10px",
        borderRadius:   12,
        background:     "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        color:          "#fff",
        fontSize:       9,
        fontFamily:     NU,
        fontWeight:     600,
        letterSpacing:  "0.8px",
        textTransform:  "uppercase",
        display:        "flex",
        alignItems:     "center",
        gap:            5,
        zIndex:         2,
      }}
    >
      {hasVideo ? (
        <>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
          Gallery
        </>
      ) : (
        <>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
          </svg>
          Gallery
        </>
      )}
    </div>
  );
}

// ── Scroll-to-next chevron (mobile only) ─────────────────────────────────────
function ScrollNextChevron({ cardRef }) {
  const [bouncing, setBouncing] = useState(true);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    if (!cardRef.current) return;
    const next = cardRef.current.nextElementSibling;
    if (next) {
      next.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      // Last card, scroll to next section
      const parent = cardRef.current.parentElement;
      const nextSection = parent?.nextElementSibling;
      if (nextSection) nextSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [cardRef]);

  // Stop bounce animation after 3s
  useEffect(() => {
    const t = setTimeout(() => setBouncing(false), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <button
      onClick={handleClick}
      aria-label="Scroll to next planner"
      style={{
        position:       "absolute",
        bottom:         0,
        left:           "50%",
        transform:      "translateX(-50%)",
        zIndex:         5,
        width:          36,
        height:         24,
        border:         "none",
        background:     "linear-gradient(180deg, transparent, rgba(0,0,0,0.3))",
        cursor:         "pointer",
        display:        "flex",
        alignItems:     "flex-end",
        justifyContent: "center",
        paddingBottom:  4,
        animation:      bouncing ? "chevronBounce 1.2s ease infinite" : "none",
      }}
    >
      <svg width="18" height="10" viewBox="0 0 18 10" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="2,2 9,8 16,2" />
      </svg>
    </button>
  );
}

// ── Grid Card (default), full-bleed reel style with swipeable media ────────
function GridCard({ v, onView, isMobile }) {
  const C = useTheme();
  const [hov, setHov] = useState(false);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);
  const [muted, setMuted] = useState(true);
  const cardRef = useRef(null);
  const touchRef = useRef({ startX: 0, startY: 0, swiping: false });
  const videoRefs = useRef({});

  // ── Build media array: images first, video last ──
  const allMedia = (() => {
    const items = [];
    (v.imgs || []).forEach((src) => items.push({ type: "image", src }));
    if (v.videoUrl) items.push({ type: "video", src: v.videoUrl });
    return items.length > 0 ? items : [{ type: "image", src: "" }];
  })();

  const mediaCount = allMedia.length;
  const hasMultiple = mediaCount > 1;
  const hasVideo    = allMedia.some((m) => m.type === "video");

  // ── Track card visibility (pause video when scrolled away) ──
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ── Auto-play/pause video: must be on active slide AND card visible ──
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([idx, vid]) => {
      if (!vid) return;
      vid.muted = muted;
      if (parseInt(idx) === slideIdx && isVisible) {
        vid.currentTime = 0;
        vid.play().catch(() => {});
      } else {
        vid.pause();
      }
    });
  }, [slideIdx, isVisible, muted]);

  // ── Swipe navigation ──
  const goTo = useCallback((idx) => {
    setSlideIdx(Math.max(0, Math.min(idx, mediaCount - 1)));
  }, [mediaCount]);

  const goNext = useCallback(() => goTo(slideIdx < mediaCount - 1 ? slideIdx + 1 : 0), [slideIdx, mediaCount, goTo]);
  const goPrev = useCallback(() => goTo(slideIdx > 0 ? slideIdx - 1 : mediaCount - 1), [slideIdx, mediaCount, goTo]);

  // ── Touch handlers ──
  const onTouchStart = useCallback((e) => {
    touchRef.current = {
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      swiping: false,
      isDrag: false,
    };
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!touchRef.current.startX) return;
    const dx = Math.abs(e.touches[0].clientX - touchRef.current.startX);
    const dy = Math.abs(e.touches[0].clientY - touchRef.current.startY);
    if (dx > dy && dx > 10) {
      touchRef.current.swiping = true;
      e.preventDefault();
    }
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (!touchRef.current.swiping) return;
    const diff = touchRef.current.startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) goNext();
      else goPrev();
    }
    touchRef.current = { startX: 0, startY: 0, swiping: false, isDrag: false };
  }, [goNext, goPrev]);

  // ── Mouse drag handlers (desktop swipe) ──
  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return; // left click only
    touchRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      swiping: false,
      isDrag: true,
    };
    e.preventDefault(); // prevent text selection during drag
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!touchRef.current.isDrag) return;
    const dx = Math.abs(e.clientX - touchRef.current.startX);
    if (dx > 8) touchRef.current.swiping = true;
  }, []);

  const onMouseUp = useCallback((e) => {
    if (!touchRef.current.isDrag) return;
    const diff = touchRef.current.startX - e.clientX;
    if (touchRef.current.swiping && Math.abs(diff) > 40) {
      if (diff > 0) goNext();
      else goPrev();
    }
    touchRef.current = { startX: 0, startY: 0, swiping: false, isDrag: false };
  }, [goNext, goPrev]);

  const onMouseLeaveMedia = useCallback(() => {
    if (touchRef.current.isDrag) {
      touchRef.current = { startX: 0, startY: 0, swiping: false, isDrag: false };
    }
  }, []);

  // ── Tap/click image area → advance to next slide (no pop-up) ──
  const handleImageClick = useCallback((e) => {
    e.stopPropagation();
    if (touchRef.current.swiping) return;
    goNext();
  }, [goNext]);

  return (
    <article
      ref={cardRef}
      aria-label={v.name}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onView?.(v)}
      style={{
        position:        "relative",
        borderRadius:    "var(--lwd-radius-card)",
        overflow:        "hidden",
        cursor:          "pointer",
        transition:      "all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        transform:       hov ? "translateY(-4px)" : "translateY(0)",
        boxShadow:       hov ? "0 16px 48px rgba(0,0,0,0.25), 0 4px 12px rgba(201,168,76,0.08)" : "0 2px 12px rgba(0,0,0,0.1)",
        scrollSnapAlign: isMobile ? "start" : undefined,
        scrollMarginTop: isMobile ? 12 : undefined,
        height:          isMobile ? "75vh" : 460,
        minHeight:       isMobile ? 440 : 400,
        maxHeight:       480,
      }}
    >
      {/* ── Full-bleed swipeable media background ── */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeaveMedia}
        onClick={handleImageClick}
        style={{
          position:   "absolute",
          inset:      0,
          overflow:   "hidden",
          background: "#0a0806",
          cursor:     hasMultiple ? "grab" : "default",
          userSelect: "none",
        }}
      >
        {/* Slide strip, translateX for slide transitions */}
        <div
          style={{
            display:    "flex",
            width:      `${mediaCount * 100}%`,
            height:     "100%",
            transform:  `translateX(-${(slideIdx * 100) / mediaCount}%)`,
            transition: "transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            willChange: "transform",
          }}
        >
          {allMedia.map((item, i) => (
            <div
              key={`${item.type}-${i}`}
              style={{
                width:      `${100 / mediaCount}%`,
                height:     "100%",
                flexShrink: 0,
                position:   "relative",
                overflow:   "hidden",
              }}
            >
              {item.type === "image" ? (
                <img
                  src={item.src}
                  alt={i === 0 ? `${v.name} – ${v.city}, ${v.region}` : `${v.name} photo ${i + 1}`}
                  loading="lazy"
                  style={{
                    width:      "100%",
                    height:     "100%",
                    objectFit:  "cover",
                    transform:  hov && i === slideIdx ? "scale(1.03)" : "scale(1)",
                    transition: "transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                  }}
                />
              ) : (
                <>
                  {/* Video poster image (first img as fallback) */}
                  {v.imgs?.[0] && (
                    <img
                      src={v.imgs[0]}
                      alt=""
                      style={{
                        position:  "absolute",
                        inset:     0,
                        width:     "100%",
                        height:    "100%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                  <video
                    ref={(el) => { videoRefs.current[i] = el; }}
                    src={item.src}
                    muted={muted}
                    loop
                    playsInline
                    preload="metadata"
                    style={{
                      position:   "absolute",
                      inset:      0,
                      width:      "100%",
                      height:     "100%",
                      objectFit:  "cover",
                      opacity:    slideIdx === i ? 1 : 0,
                      transition: "opacity 0.6s ease",
                    }}
                  />
                  {/* Play icon badge on video slide */}
                  {slideIdx !== i && (
                    <div
                      aria-hidden="true"
                      style={{
                        position:       "absolute",
                        top:            "50%",
                        left:           "50%",
                        transform:      "translate(-50%, -50%)",
                        width:          44,
                        height:         44,
                        borderRadius:   "50%",
                        background:     "rgba(0,0,0,0.45)",
                        backdropFilter: "blur(6px)",
                        border:         "1.5px solid rgba(255,255,255,0.25)",
                        display:        "flex",
                        alignItems:     "center",
                        justifyContent: "center",
                        zIndex:         3,
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)">
                        <polygon points="8,5 20,12 8,19" />
                      </svg>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Cinematic gradient, stronger at bottom for text readability ── */}
      <div
        aria-hidden="true"
        style={{
          position:      "absolute",
          inset:         0,
          background:    "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, transparent 25%, transparent 35%, rgba(0,0,0,0.65) 65%, rgba(0,0,0,0.88) 100%)",
          pointerEvents: "none",
          zIndex:        1,
        }}
      />

      {/* ── Top badges ── */}
      {v.tag && (
        <div style={{ position: "absolute", top: 12, left: 12, zIndex: 4 }}>
          <GoldBadge text={v.tag} />
        </div>
      )}
      {v.verified && (
        <div style={{ position: "absolute", top: 12, right: 12, zIndex: 4 }}>
          <VerifiedBadge />
        </div>
      )}

      {/* Swipe hint, top right area on hover */}
      {hov && hasMultiple && (
        <div
          style={{
            position:       "absolute",
            top:            v.verified ? 44 : 12,
            right:          12,
            zIndex:         4,
            padding:        "5px 10px",
            borderRadius:   12,
            background:     "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
            color:          "#fff",
            fontSize:       9,
            fontFamily:     NU,
            fontWeight:     600,
            letterSpacing:  "0.8px",
            textTransform:  "uppercase",
            display:        "flex",
            alignItems:     "center",
            gap:            5,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          Swipe
        </div>
      )}

      {/* Media count badge */}
      <div style={{ position: "absolute", top: 12, right: v.verified ? 100 : 12, zIndex: 4 }}>
        <MediaCountBadge imgCount={v.imgs?.length || 0} hasVideo={!!v.videoUrl} />
      </div>

      {/* ── Swipe dot indicators (above content overlay) ── */}
      {hasMultiple && (
        <div
          aria-hidden="true"
          style={{
            position:       "absolute",
            bottom:         isMobile ? "auto" : "auto",
            top:            14,
            left:           "50%",
            transform:      "translateX(-50%)",
            zIndex:         5,
            display:        "flex",
            alignItems:     "center",
            gap:            5,
            padding:        "4px 8px",
            borderRadius:   12,
            background:     "rgba(0,0,0,0.35)",
            backdropFilter: "blur(6px)",
          }}
        >
          {allMedia.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); goTo(i); }}
              aria-label={`Slide ${i + 1}`}
              style={{
                width:      slideIdx === i ? 18 : 6,
                height:     6,
                borderRadius: 3,
                background: slideIdx === i ? GOLD : "rgba(255,255,255,0.45)",
                border:     "none",
                padding:    0,
                cursor:     "pointer",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>
      )}

      {/* ── Desktop prev/next arrows (visible on hover) ── */}
      {hasMultiple && hov && !isMobile && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            aria-label="Previous photo"
            style={{
              position:       "absolute",
              top:            "40%",
              left:           10,
              transform:      "translateY(-50%)",
              zIndex:         5,
              width:          34,
              height:         34,
              borderRadius:   "50%",
              background:     "rgba(0,0,0,0.45)",
              backdropFilter: "blur(4px)",
              border:         "1px solid rgba(255,255,255,0.15)",
              color:          "#fff",
              cursor:         "pointer",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              transition:     "all 0.2s",
              opacity:        0.85,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(201,168,76,0.35)"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.45)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            aria-label="Next photo"
            style={{
              position:       "absolute",
              top:            "40%",
              right:          10,
              transform:      "translateY(-50%)",
              zIndex:         5,
              width:          34,
              height:         34,
              borderRadius:   "50%",
              background:     "rgba(0,0,0,0.45)",
              backdropFilter: "blur(4px)",
              border:         "1px solid rgba(255,255,255,0.15)",
              color:          "#fff",
              cursor:         "pointer",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              transition:     "all 0.2s",
              opacity:        0.85,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(201,168,76,0.35)"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.45)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}

      {/* ── Sound on/off toggle (visible on video slide) ── */}
      {hasVideo && allMedia[slideIdx]?.type === "video" && (
        <button
          onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}
          aria-label={muted ? "Unmute video" : "Mute video"}
          style={{
            position:       "absolute",
            top:            isMobile ? 56 : 48,
            right:          12,
            zIndex:         5,
            width:          34,
            height:         34,
            borderRadius:   "50%",
            background:     "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            border:         "1px solid rgba(255,255,255,0.2)",
            color:          muted ? "rgba(255,255,255,0.5)" : "#fff",
            cursor:         "pointer",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            transition:     "all 0.2s",
          }}
        >
          {muted ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          )}
        </button>
      )}

      {/* ── Content overlaid at bottom ── */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position:       "absolute",
          bottom:         0,
          left:           0,
          right:          0,
          zIndex:         2,
          padding:        isMobile ? "20px 16px 16px" : "20px 18px 18px",
        }}
      >
        {/* Name */}
        <div
          onClick={() => onView?.(v)}
          style={{
            fontFamily:   GD,
            fontSize:     isMobile ? 22 : 20,
            fontWeight:   500,
            fontStyle:    "italic",
            color:        "#ffffff",
            lineHeight:   1.2,
            marginBottom: 3,
            textShadow:   "0 1px 4px rgba(0,0,0,0.3)",
            cursor:       "pointer",
          }}
        >
          {v.name}
        </div>

        {/* Location */}
        <div
          style={{
            fontFamily:   NU,
            fontSize:     12,
            color:        "rgba(255,255,255,0.7)",
            marginBottom: 8,
          }}
        >
          {v.city}, {v.region}
        </div>

        {/* Service tier + Stars row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          {v.serviceTier && (
            <span
              style={{
                fontFamily:    NU,
                fontSize:      8,
                fontWeight:    700,
                letterSpacing: "1.2px",
                textTransform: "uppercase",
                color:         GOLD,
                background:    "rgba(201,168,76,0.15)",
                border:        "1px solid rgba(201,168,76,0.3)",
                borderRadius:  20,
                padding:       "3px 10px",
              }}
            >
              {v.serviceTier}
            </span>
          )}
          {v.rating && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Stars r={v.rating} />
              <span style={{ fontFamily: NU, fontSize: 10, color: "rgba(255,255,255,0.6)" }}>
                {v.rating} ({v.reviews})
              </span>
            </div>
          )}
        </div>

        {/* Social + contact icons */}
        <SocialRow socials={v.socials} color="rgba(255,255,255,0.5)" phone={v.phone} whatsapp={v.whatsapp} email={v.email} darkMode />

        {/* Description, 2-line clamp */}
        <p
          style={{
            fontFamily:        NU,
            fontSize:          12,
            color:             "rgba(255,255,255,0.6)",
            lineHeight:        1.5,
            margin:            "0 0 10px",
            display:           "-webkit-box",
            WebkitLineClamp:   2,
            WebkitBoxOrient:   "vertical",
            overflow:          "hidden",
          }}
        >
          {v.desc}
        </p>

        {/* Footer: price + CTAs */}
        <div
          style={{
            display:        "flex",
            justifyContent: "space-between",
            alignItems:     "center",
            paddingTop:     10,
            borderTop:      "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div
            style={{
              fontFamily: GD,
              fontSize:   20,
              fontWeight: 600,
              color:      GOLD,
              lineHeight: 1,
            }}
          >
            <span style={{ fontFamily: NU, fontSize: 10, fontWeight: 400, color: "rgba(255,255,255,0.45)", marginRight: 4, letterSpacing: "0.3px" }}>From</span>
            {v.priceFrom}
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowEnquiry(true); }}
              style={{
                fontFamily:    NU,
                fontSize:      10,
                fontWeight:    700,
                letterSpacing: "1.2px",
                textTransform: "uppercase",
                color:         "#0f0d0a",
                background:    `linear-gradient(135deg, ${GOLD}, #e8c97a)`,
                border:        "none",
                borderRadius:  "var(--lwd-radius-input)",
                padding:       "8px 14px",
                cursor:        "pointer",
                transition:    "opacity 0.25s",
                whiteSpace:    "nowrap",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Enquire
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onView?.(v); }}
              style={{
                fontFamily:    NU,
                fontSize:      10,
                fontWeight:    700,
                letterSpacing: "1.2px",
                textTransform: "uppercase",
                color:         GOLD,
                background:    "rgba(201,168,76,0.12)",
                border:        "1px solid rgba(201,168,76,0.3)",
                borderRadius:  "var(--lwd-radius-input)",
                padding:       "8px 14px",
                cursor:        "pointer",
                transition:    "all 0.25s",
                whiteSpace:    "nowrap",
              }}
            >
              Profile ›
            </button>
          </div>
        </div>
      </div>

      {/* Scroll-to-next chevron (mobile) */}
      {isMobile && <ScrollNextChevron cardRef={cardRef} />}

      {/* Enquiry modal */}
      {showEnquiry && (
        <EnquiryFormModal planner={v} onClose={() => setShowEnquiry(false)} />
      )}
    </article>
  );
}

// ── List Card (horizontal) ───────────────────────────────────────────────────
function ListCard({ v, onView, listMode, isHighlighted }) {
  const C = useTheme();
  const [hov, setHov] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showEnquiry, setShowEnquiry] = useState(false);

  const imgCount = v.imgs?.length || 0;
  const hasMedia = imgCount > 1 || v.videoUrl;

  return (
    <article
      aria-label={v.name}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onView?.(v)}
      style={{
        display:      listMode ? "grid" : "flex",
        ...(listMode ? {
          gridTemplateColumns: "clamp(320px, 42%, 520px) 1fr",
          gridTemplateRows:    "minmax(0, 1fr)",
          columnGap:           24,
          maxHeight:           420,
        } : {}),
        background:   listMode
          ? (isHighlighted ? "rgba(201,168,76,0.04)" : C.card)
          : C.card,
        ...(listMode ? {
          borderTop:    "none",
          borderRight:  "none",
          borderBottom: `1px solid ${C.border}`,
          borderLeft:   `3px solid ${isHighlighted || hov ? GOLD : "transparent"}`,
          borderRadius: 0,
        } : {
          border:       `1px solid ${hov ? C.goldDim : C.border}`,
          borderRadius: "var(--lwd-radius-card)",
          boxShadow:    hov ? "0 8px 32px rgba(0,0,0,0.1)" : "none",
        }),
        overflow:     "hidden",
        cursor:       "pointer",
        transition:   "all 0.3s ease",
      }}
    >
      {/* Image / Video */}
      <div
        onClick={(e) => { e.stopPropagation(); setShowGallery(true); }}
        style={{
          ...(listMode
            ? { width: "100%", height: "100%", minWidth: 0 }
            : { flex: "0 0 220px", maxWidth: 220 }
          ),
          minHeight:  200,
          position:   "relative",
          overflow:   "hidden",
          background: "#0a0806",
          cursor:     "pointer",
        }}
      >
        <HoverMedia
          src={v.imgs?.[0] ?? ""}
          videoUrl={v.videoUrl}
          alt={`${v.name} – ${v.city}, ${v.region}`}
          hov={hov}
        />
        {v.tag && (
          <div style={{ position: "absolute", top: 10, left: 10, zIndex: 1 }}>
            <GoldBadge text={v.tag} />
          </div>
        )}
        {/* Hover hint */}
        {hov && hasMedia && <MediaHintBadge hasVideo={!!v.videoUrl} />}
        <MediaCountBadge imgCount={imgCount} hasVideo={!!v.videoUrl} />
      </div>

      {/* Gallery modal */}
      {showGallery && (
        <MediaGalleryModal
          imgs={v.imgs || []}
          videoUrl={v.videoUrl}
          onClose={() => setShowGallery(false)}
          plannerName={v.name}
        />
      )}

      {/* Enquiry modal */}
      {showEnquiry && (
        <EnquiryFormModal planner={v} onClose={() => setShowEnquiry(false)} />
      )}

      {/* Content */}
      <div style={{ flex: 1, padding: "18px 22px", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0, overflowY: listMode ? "auto" : undefined }}>
        {/* Top row: name + verified */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
          <div
            style={{
              fontFamily: GD,
              fontSize:   22,
              fontWeight: 500,
              fontStyle:  "italic",
              color:      C.white,
              lineHeight: 1.2,
            }}
          >
            {v.name}
          </div>
          {v.verified && <VerifiedBadge />}
        </div>

        {/* Location */}
        <div style={{ fontFamily: NU, fontSize: 12, color: C.grey, marginBottom: 8 }}>
          {v.city}, {v.region}
        </div>

        {/* Service tier + badges row (compact in listMode) */}
        {listMode ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            {v.serviceTier && (
              <span
                style={{
                  fontFamily:    NU,
                  fontSize:      9,
                  fontWeight:    700,
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                  color:         GOLD,
                  background:    "rgba(201,168,76,0.08)",
                  border:        "1px solid rgba(201,168,76,0.22)",
                  borderRadius:  20,
                  padding:       "3px 10px",
                }}
              >
                {v.serviceTier}
              </span>
            )}
            {v.rating && (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Stars r={v.rating} />
                <span style={{ fontFamily: NU, fontSize: 10, color: C.grey }}>
                  {v.rating} ({v.reviews})
                </span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
            {v.serviceTier && (
              <span
                style={{
                  fontFamily:    NU,
                  fontSize:      9,
                  fontWeight:    700,
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                  color:         GOLD,
                  background:    "rgba(201,168,76,0.08)",
                  border:        "1px solid rgba(201,168,76,0.22)",
                  borderRadius:  20,
                  padding:       "4px 12px",
                }}
              >
                {v.serviceTier}
              </span>
            )}
            {v.lwdScore && <CuratedIndexBadge score={v.lwdScore} />}
            {v.rating && (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Stars r={v.rating} />
                <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>
                  {v.rating} ({v.reviews})
                </span>
              </div>
            )}
          </div>
        )}

        {/* Social media + phone + WhatsApp icons */}
        <SocialRow socials={v.socials} color={C.grey} phone={v.phone} whatsapp={v.whatsapp} email={v.email} darkMode />

        {/* Description */}
        <p
          style={{
            fontFamily:      NU,
            fontSize:        13,
            color:           C.grey2,
            lineHeight:      1.55,
            margin:          "0 0 12px",
            display:         "-webkit-box",
            WebkitLineClamp: listMode ? 3 : 2,
            WebkitBoxOrient: "vertical",
            overflow:        "hidden",
          }}
        >
          {v.desc}
        </p>

        {/* Specialty pills */}
        {v.specialties?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
            {v.specialties.slice(0, listMode ? 4 : 3).map((s) => (
              <Pill key={s} text={s} />
            ))}
          </div>
        )}

        {/* Footer: price + CTAs */}
        {listMode ? (
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px 12px", marginTop: "auto", borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
            {v.priceFrom && (
              <div style={{ fontFamily: GD, fontSize: 18, fontWeight: 600, color: C.gold }}>
                <span style={{ fontFamily: NU, fontSize: 10, fontWeight: 400, color: C.grey, marginRight: 4, letterSpacing: "0.3px" }}>From</span>
                {v.priceFrom}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 8 }} />
            <button
              onClick={(e) => { e.stopPropagation(); setShowEnquiry(true); }}
              style={{
                fontFamily:    NU,
                fontSize:      10,
                fontWeight:    700,
                letterSpacing: "1.2px",
                textTransform: "uppercase",
                color:         "#0f0d0a",
                background:    `linear-gradient(135deg, ${GOLD}, #e8c97a)`,
                border:        "none",
                borderRadius:  "var(--lwd-radius-input)",
                padding:       "8px 16px",
                cursor:        "pointer",
                transition:    "opacity 0.25s",
                whiteSpace:    "nowrap",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Enquire
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onView?.(v); }}
              style={{
                fontFamily:    NU,
                fontSize:      10,
                fontWeight:    700,
                letterSpacing: "1.2px",
                textTransform: "uppercase",
                color:         GOLD,
                background:    "rgba(201,168,76,0.08)",
                border:        "1px solid rgba(201,168,76,0.22)",
                borderRadius:  "var(--lwd-radius-input)",
                padding:       "8px 16px",
                cursor:        "pointer",
                transition:    "all 0.25s",
                whiteSpace:    "nowrap",
              }}
            >
              Profile ›
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto" }}>
            <div style={{ fontFamily: GD, fontSize: 20, fontWeight: 600, color: C.gold }}>
              <span style={{ fontFamily: NU, fontSize: 10, fontWeight: 400, color: C.grey, marginRight: 4, letterSpacing: "0.3px" }}>From</span>
              {v.priceFrom}
            </div>
            <div style={{ flex: 1 }} />
            {/* Enquire button */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowEnquiry(true); }}
              style={{
                fontFamily:    NU,
                fontSize:      10,
                fontWeight:    700,
                letterSpacing: "1.2px",
                textTransform: "uppercase",
                color:         "#0f0d0a",
                background:    `linear-gradient(135deg, ${GOLD}, #e8c97a)`,
                border:        "none",
                borderRadius:  "var(--lwd-radius-input)",
                padding:       "8px 14px",
                cursor:        "pointer",
                transition:    "opacity 0.25s",
                whiteSpace:    "nowrap",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Enquire
            </button>
            {/* View Profile button */}
            <button
              onClick={(e) => { e.stopPropagation(); onView?.(v); }}
              style={{
                fontFamily:    NU,
                fontSize:      10,
                fontWeight:    700,
                letterSpacing: "1.2px",
                textTransform: "uppercase",
                color:         GOLD,
                background:    "rgba(201,168,76,0.08)",
                border:        "1px solid rgba(201,168,76,0.22)",
                borderRadius:  "var(--lwd-radius-input)",
                padding:       "8px 14px",
                cursor:        "pointer",
                transition:    "all 0.25s",
                whiteSpace:    "nowrap",
              }}
            >
              Profile ›
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

// ── Public Export ─────────────────────────────────────────────────────────────
export default function PlannerCard({ v, mode = "grid", onView, isMobile, listMode, isHighlighted }) {
  if (mode === "list") return <ListCard v={v} onView={onView} listMode={listMode} isHighlighted={isHighlighted} />;
  return <GridCard v={v} onView={onView} isMobile={isMobile} />;
}
