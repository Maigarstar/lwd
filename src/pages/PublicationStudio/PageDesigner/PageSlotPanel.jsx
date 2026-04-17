// ─── PageSlotPanel.jsx ────────────────────────────────────────────────────────
// Slide-in panel (right side, 380px) for assigning a vendor page slot to the
// currently-open page in PageDesigner. Part of the Revenue Engine.

import { useState, useEffect } from 'react';
import { GOLD, DARK, CARD, BORDER, MUTED, NU, GD } from './designerConstants';

const TIER_DEFAULTS = {
  standard:  850,
  featured:  1500,
  showcase:  2500,
};

const TIERS = [
  { key: 'standard',  label: 'Standard',  price: 850,  desc: 'Full page vendor feature' },
  { key: 'featured',  label: 'Featured',  price: 1500, desc: 'Priority placement + badge' },
  { key: 'showcase',  label: 'Showcase',  price: 2500, desc: 'Premium double-page spread' },
];

const STATUSES = [
  { key: 'available', label: 'Available', color: 'rgba(255,255,255,0.4)' },
  { key: 'offered',   label: 'Offered',   color: GOLD },
  { key: 'paid',      label: 'Paid',      color: '#34d399' },
  { key: 'published', label: 'Published', color: '#60a5fa' },
];

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)',
  border: `1px solid ${BORDER}`,
  borderRadius: 4,
  color: '#fff',
  fontFamily: NU,
  fontSize: 12,
  padding: '8px 10px',
  outline: 'none',
};

const labelStyle = {
  display: 'block',
  fontFamily: NU,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: MUTED,
  marginBottom: 6,
  marginTop: 14,
};

export default function PageSlotPanel({ slot, onSave, onClose }) {
  const [tier,        setTier]        = useState(slot?.tier        || 'standard');
  const [status,      setStatus]      = useState(slot?.status      || 'available');
  const [vendorName,  setVendorName]  = useState(slot?.vendor_name || '');
  const [vendorEmail, setVendorEmail] = useState(slot?.vendor_email || '');
  const [customPrice, setCustomPrice] = useState(slot?.price != null ? String(slot.price) : '');
  const [notes,       setNotes]       = useState(slot?.notes       || '');

  // When tier changes, clear custom price so the default is used
  function handleTierChange(t) {
    setTier(t);
    setCustomPrice('');
  }

  function getEffectivePrice() {
    const p = parseFloat(customPrice);
    if (!isNaN(p) && p > 0) return p;
    return TIER_DEFAULTS[tier] ?? 850;
  }

  function handleSave() {
    const slotData = {
      tier,
      status,
      vendor_name:  vendorName.trim(),
      vendor_email: vendorEmail.trim(),
      price:        getEffectivePrice(),
      notes:        notes.trim(),
    };
    onSave(slotData);
  }

  function handleClear() {
    onSave(null);
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 900,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <style>{`@keyframes pspSlideIn { from { transform: translateX(40px); opacity:0; } to { transform: translateX(0); opacity:1; } }`}</style>

      {/* Panel */}
      <div
        style={{
          width: 380,
          background: '#141210',
          borderLeft: `1px solid ${BORDER}`,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          animation: 'pspSlideIn 0.2s ease',
          overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 18px 14px',
          borderBottom: `1px solid ${BORDER}`,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{
                fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD,
                letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2,
              }}>
                ◆ Page Slot
              </div>
              <div style={{ fontFamily: GD, fontSize: 16, fontStyle: 'italic', color: '#fff' }}>
                Vendor Assignment
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '0 18px 24px', overflowY: 'auto' }}>

          {/* Tier picker */}
          <div style={{ marginTop: 18 }}>
            <div style={{ ...labelStyle, marginTop: 0 }}>Tier</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TIERS.map(t => {
                const isSelected = tier === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => handleTierChange(t.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 4,
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSelected ? 'rgba(201,168,76,0.5)' : BORDER}`,
                      transition: 'all 0.12s',
                      textAlign: 'left',
                    }}
                  >
                    <div>
                      <div style={{
                        fontFamily: NU, fontSize: 11, fontWeight: 700,
                        color: isSelected ? GOLD : '#fff',
                        letterSpacing: '0.04em', marginBottom: 2,
                      }}>
                        {t.label}
                      </div>
                      <div style={{ fontFamily: NU, fontSize: 10, color: MUTED }}>
                        {t.desc}
                      </div>
                    </div>
                    <div style={{
                      fontFamily: GD, fontSize: 16, fontStyle: 'italic',
                      color: isSelected ? GOLD : MUTED,
                      whiteSpace: 'nowrap', marginLeft: 12,
                    }}>
                      £{t.price.toLocaleString()}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status pipeline */}
          <div>
            <label style={labelStyle}>Status</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {STATUSES.map(s => {
                const isActive = status === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => setStatus(s.key)}
                    style={{
                      flex: 1,
                      padding: '6px 4px',
                      borderRadius: 3,
                      cursor: 'pointer',
                      background: isActive ? `rgba(${hexToRgb(s.color)},0.15)` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isActive ? s.color : BORDER}`,
                      color: isActive ? s.color : MUTED,
                      fontFamily: NU,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      transition: 'all 0.12s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vendor name */}
          <div>
            <label style={labelStyle}>Vendor Name</label>
            <input
              type="text"
              value={vendorName}
              onChange={e => setVendorName(e.target.value)}
              placeholder="e.g. Villa di Ulignano"
              style={inputStyle}
            />
          </div>

          {/* Vendor email */}
          <div>
            <label style={labelStyle}>Vendor Email</label>
            <input
              type="email"
              value={vendorEmail}
              onChange={e => setVendorEmail(e.target.value)}
              placeholder="contact@vendor.com"
              style={inputStyle}
            />
          </div>

          {/* Custom price */}
          <div>
            <label style={labelStyle}>
              Custom Price (£)
              <span style={{ fontWeight: 400, marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>
                — overrides tier default (leave blank for £{TIER_DEFAULTS[tier]?.toLocaleString()})
              </span>
            </label>
            <input
              type="number"
              min={0}
              step={50}
              value={customPrice}
              onChange={e => setCustomPrice(e.target.value)}
              placeholder={String(TIER_DEFAULTS[tier])}
              style={inputStyle}
            />
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Internal Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any internal notes about this slot…"
              rows={3}
              style={{
                ...inputStyle,
                resize: 'vertical',
                minHeight: 72,
                lineHeight: 1.5,
              }}
            />
          </div>

          {/* Price preview */}
          <div style={{
            marginTop: 16,
            padding: '12px 14px',
            background: 'rgba(201,168,76,0.06)',
            border: `1px solid rgba(201,168,76,0.2)`,
            borderRadius: 4,
          }}>
            <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Effective Price
            </div>
            <div style={{ fontFamily: GD, fontSize: 22, fontStyle: 'italic', color: GOLD }}>
              £{getEffectivePrice().toLocaleString()}
            </div>
            <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, marginTop: 2 }}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)} tier · {status.charAt(0).toUpperCase() + status.slice(1)}
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div style={{
          padding: '14px 18px',
          borderTop: `1px solid ${BORDER}`,
          flexShrink: 0,
          display: 'flex',
          gap: 10,
        }}>
          {slot && (
            <button
              onClick={handleClear}
              style={{
                padding: '9px 14px',
                borderRadius: 3,
                cursor: 'pointer',
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.25)',
                color: '#f87171',
                fontFamily: NU, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              Clear Slot
            </button>
          )}
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '9px 0',
              borderRadius: 3,
              cursor: 'pointer',
              background: 'rgba(201,168,76,0.15)',
              border: `1px solid rgba(201,168,76,0.45)`,
              color: GOLD,
              fontFamily: NU, fontSize: 10, fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}
          >
            ◆ Save Slot
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper: convert hex or named colour to "r,g,b" string for rgba()
function hexToRgb(hex) {
  if (!hex || !hex.startsWith('#')) return '255,255,255';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return '255,255,255';
  return `${r},${g},${b}`;
}
