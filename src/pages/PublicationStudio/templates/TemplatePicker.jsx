// ─── TemplatePicker.jsx ──────────────────────────────────────────────────────
// Full-screen modal — filterable template grid with tier-gating (Phase 6).
// Locked templates show a pack badge + lock overlay; clicking opens an inline
// upgrade panel rather than a blocking modal.

import { useState } from 'react';
import TEMPLATES, { CATEGORIES } from './definitions';
import TemplateCanvas from './TemplateCanvas';
import { PACKS, TIER_ORDER, getTemplatePack, isTemplateLocked } from './packs';

const GOLD   = '#C9A84C';
const NU     = "var(--font-body, 'Nunito Sans', sans-serif)";
const GD     = "var(--font-heading-primary, 'Cormorant Garamond', Georgia, serif)";
const MUTED  = 'rgba(255,255,255,0.4)';
const BORDER = 'rgba(255,255,255,0.08)';

// ── Pack-filter pill labels (All + Starter + packs above user tier) ──────────
const PACK_FILTER_OPTIONS = ['All', 'Starter', 'Editorial', 'Flagship'];

export default function TemplatePicker({ onSelect, onClose, userTier = 'starter' }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [packFilter,     setPackFilter]     = useState('All');
  const [hoveredId,      setHoveredId]      = useState(null);
  const [upgradeTarget,  setUpgradeTarget]  = useState(null); // template that triggered upgrade panel

  // ── Filtering ────────────────────────────────────────────────────────────────
  const filtered = TEMPLATES.filter(t => {
    const catMatch  = activeCategory === 'All' || t.category === activeCategory;
    const packMatch = packFilter === 'All' ||
      getTemplatePack(t.id) === packFilter.toLowerCase();
    return catMatch && packMatch;
  });

  const allCategories = ['All', ...CATEGORIES];
  const userTierLevel = TIER_ORDER.indexOf(userTier);

  // ── Handle template click ─────────────────────────────────────────────────
  function handleClick(tpl) {
    if (isTemplateLocked(tpl.id, userTier)) {
      setUpgradeTarget(tpl);
    } else {
      onSelect(tpl);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900,
      background: 'rgba(8,7,6,0.96)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex', flexDirection: 'column',
      fontFamily: NU,
    }}>

      {/* ── Header ── */}
      <div style={{
        height: 60, flexShrink: 0,
        borderBottom: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center',
        padding: '0 28px', gap: 16,
        background: 'rgba(14,13,11,0.9)',
      }}>
        <div style={{ fontFamily: GD, fontSize: 20, fontStyle: 'italic', color: '#fff', flex: 1 }}>
          Choose a Template
        </div>
        {/* User tier badge */}
        <div style={{
          fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: PACKS[userTier]?.color || MUTED,
          border: `1px solid ${PACKS[userTier]?.color || BORDER}`,
          padding: '3px 8px', borderRadius: 10,
          opacity: 0.85,
        }}>
          {PACKS[userTier]?.name || 'Starter'}
        </div>
        <div style={{ fontFamily: NU, fontSize: 9, color: MUTED }}>
          {filtered.length} of {TEMPLATES.length}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: `1px solid ${BORDER}`,
            color: MUTED, cursor: 'pointer', fontSize: 16, lineHeight: 1,
            padding: '5px 10px', borderRadius: 3, fontFamily: NU,
          }}
          title="Close"
        >×</button>
      </div>

      {/* ── Filter rows ── */}
      <div style={{
        padding: '12px 28px 10px',
        borderBottom: `1px solid ${BORDER}`,
        background: 'rgba(12,11,9,0.7)',
        flexShrink: 0,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {/* Category pills */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {allCategories.map(cat => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  fontFamily: NU, fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  padding: '3px 10px', borderRadius: 10, cursor: 'pointer',
                  background: active ? 'rgba(201,168,76,0.14)' : 'none',
                  border: `1px solid ${active ? GOLD : BORDER}`,
                  color: active ? GOLD : MUTED,
                  transition: 'all 0.15s',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Pack filter row */}
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <span style={{ fontFamily: NU, fontSize: 8, color: MUTED, letterSpacing: '0.06em', textTransform: 'uppercase', marginRight: 4 }}>Pack</span>
          {PACK_FILTER_OPTIONS.map(pf => {
            const active = packFilter === pf;
            const pack   = PACKS[pf.toLowerCase()];
            const locked = pack && TIER_ORDER.indexOf(pf.toLowerCase()) > userTierLevel;
            return (
              <button
                key={pf}
                onClick={() => setPackFilter(pf)}
                style={{
                  fontFamily: NU, fontSize: 8, fontWeight: 700,
                  letterSpacing: '0.07em', textTransform: 'uppercase',
                  padding: '3px 10px', borderRadius: 10, cursor: 'pointer',
                  background: active ? (pack?.color ? `${pack.color}22` : 'rgba(255,255,255,0.08)') : 'none',
                  border: `1px solid ${active ? (pack?.color || BORDER) : BORDER}`,
                  color: active ? (pack?.color || '#fff') : (locked ? MUTED : 'rgba(255,255,255,0.6)'),
                  transition: 'all 0.15s',
                  opacity: locked ? 0.6 : 1,
                }}
              >
                {locked ? '🔒 ' : ''}{pf}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Grid + upgrade panel ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', position: 'relative' }}>

        {/* ── Upgrade panel (slides in from right) ── */}
        {upgradeTarget && (
          <UpgradePanel
            template={upgradeTarget}
            userTier={userTier}
            onClose={() => setUpgradeTarget(null)}
          />
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 16,
        }}>
          {filtered.map(tpl => {
            const hov    = hoveredId === tpl.id;
            const locked = isTemplateLocked(tpl.id, userTier);
            const tplPack = getTemplatePack(tpl.id);
            const packColor = PACKS[tplPack]?.color || MUTED;

            return (
              <div
                key={tpl.id}
                onClick={() => handleClick(tpl)}
                onMouseEnter={() => setHoveredId(tpl.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  cursor: locked ? 'default' : 'pointer',
                  borderRadius: 4,
                  border: upgradeTarget?.id === tpl.id
                    ? `2px solid ${packColor}`
                    : `2px solid ${hov && !locked ? GOLD : locked ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.1)'}`,
                  overflow: 'hidden',
                  transition: 'all 0.18s',
                  transform: hov && !locked ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: hov && !locked
                    ? `0 8px 32px rgba(201,168,76,0.18)`
                    : locked ? 'none' : '0 2px 8px rgba(0,0,0,0.4)',
                  background: '#0a0908',
                  opacity: locked ? 0.7 : 1,
                  position: 'relative',
                }}
              >
                {/* Template preview */}
                <div style={{ position: 'relative', paddingBottom: '141.4%', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                    <TemplateCanvas
                      templateId={tpl.id}
                      fields={{}}
                      pageSize="A4"
                      width={160}
                    />
                  </div>

                  {/* Lock overlay */}
                  {locked && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(8,7,6,0.72)',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      gap: 6,
                    }}>
                      <div style={{ fontSize: 22, opacity: 0.9 }}>🔒</div>
                      <div style={{
                        fontFamily: NU, fontSize: 8, fontWeight: 700,
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        color: packColor,
                        background: 'rgba(8,7,6,0.8)',
                        border: `1px solid ${packColor}`,
                        padding: '3px 8px', borderRadius: 8,
                      }}>
                        {PACKS[tplPack]?.name}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card footer */}
                <div style={{ padding: '8px 10px 10px', background: '#0f0e0c' }}>
                  <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, color: hov && !locked ? '#fff' : 'rgba(255,255,255,0.8)', marginBottom: 3, letterSpacing: '0.02em' }}>
                    {tpl.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{
                      display: 'inline-block',
                      fontFamily: NU, fontSize: 8, fontWeight: 700,
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      color: hov && !locked ? GOLD : MUTED,
                      padding: '2px 6px', borderRadius: 8,
                      border: `1px solid ${hov && !locked ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.1)'}`,
                      transition: 'all 0.15s',
                    }}>
                      {tpl.category}
                    </div>
                    {/* Pack tier dot (non-starter templates) */}
                    {tplPack !== 'starter' && (
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: packColor, opacity: 0.7, flexShrink: 0,
                      }}
                        title={PACKS[tplPack]?.name}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Upgrade Panel ─────────────────────────────────────────────────────────────
function UpgradePanel({ template, userTier, onClose }) {
  const tplPack    = getTemplatePack(template.id);
  const pack       = PACKS[tplPack];
  const userLevel  = TIER_ORDER.indexOf(userTier);

  // Show all tiers above the user's current tier
  const upgradeTiers = TIER_ORDER.slice(userLevel + 1).map(t => PACKS[t]);

  const TIER_COUNTS = { starter: 16, editorial: 20, flagship: 19 }; // approx per tier

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0,
      width: 360,
      background: '#0E0D0B',
      borderLeft: `1px solid ${pack.color}44`,
      zIndex: 20,
      display: 'flex', flexDirection: 'column',
      animation: 'slideInRight 0.22s ease',
    }}>
      <style>{`@keyframes slideInRight { from { transform: translateX(24px); opacity:0 } to { transform: translateX(0); opacity:1 } }`}</style>

      {/* Header */}
      <div style={{
        padding: '18px 20px 14px',
        borderBottom: `1px solid rgba(255,255,255,0.07)`,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Nunito Sans', fontSize: 9, fontWeight: 700, color: pack.color, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>
              🔒 {pack.name} Required
            </div>
            <div style={{ fontFamily: GD, fontSize: 17, fontStyle: 'italic', color: '#fff', lineHeight: 1.2 }}>
              {template.name}
            </div>
            <div style={{ fontFamily: 'Nunito Sans', fontSize: 9, color: MUTED, marginTop: 3 }}>
              {template.category}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 16, padding: 4, lineHeight: 1, flexShrink: 0 }}
          >✕</button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
        <p style={{ fontFamily: 'Nunito Sans', fontSize: 11, color: MUTED, lineHeight: 1.65, marginBottom: 20 }}>
          This template is part of the <strong style={{ color: pack.color }}>{pack.name}</strong>. Upgrade to unlock it along with {TIER_COUNTS[tplPack] - 1}+ other premium templates.
        </p>

        {/* Tier cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TIER_ORDER.map((tierId, i) => {
            const t       = PACKS[tierId];
            const current = tierId === userTier;
            const isTarget = tierId === tplPack;
            return (
              <div
                key={tierId}
                style={{
                  border: `1px solid ${isTarget ? t.color : current ? 'rgba(255,255,255,0.12)' : BORDER}`,
                  borderRadius: 5,
                  padding: '12px 14px',
                  background: isTarget ? `${t.color}0d` : 'rgba(255,255,255,0.02)',
                  position: 'relative',
                }}
              >
                {current && (
                  <div style={{ position: 'absolute', top: 8, right: 10, fontFamily: 'Nunito Sans', fontSize: 7, fontWeight: 700, color: t.color, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    Your plan
                  </div>
                )}
                {isTarget && !current && (
                  <div style={{ position: 'absolute', top: 8, right: 10, fontFamily: 'Nunito Sans', fontSize: 7, fontWeight: 700, color: t.color, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    Needed
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'Nunito Sans', fontSize: 11, fontWeight: 700, color: t.color }}>{t.name}</span>
                  {t.price && <span style={{ fontFamily: 'Nunito Sans', fontSize: 9, color: MUTED }}>{t.badge}</span>}
                  {!t.price && <span style={{ fontFamily: 'Nunito Sans', fontSize: 9, color: MUTED }}>Free</span>}
                </div>
                <div style={{ fontFamily: 'Nunito Sans', fontSize: 9, color: MUTED, lineHeight: 1.5 }}>
                  {t.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer CTAs */}
      <div style={{
        padding: '14px 20px',
        borderTop: `1px solid rgba(255,255,255,0.07)`,
        flexShrink: 0,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <button
          onClick={() => {
            // Navigate to billing/upgrade page — wired to real URL in production
            window.open('/admin?tab=billing', '_blank');
          }}
          style={{
            fontFamily: 'Nunito Sans', fontSize: 9, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            background: pack.color, border: 'none', borderRadius: 3,
            color: '#0A0908', padding: '11px 20px', cursor: 'pointer',
            width: '100%',
          }}
        >
          ✦ Upgrade to {pack.name}
        </button>
        <button
          onClick={onClose}
          style={{
            fontFamily: 'Nunito Sans', fontSize: 9, fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            background: 'none', border: `1px solid ${BORDER}`,
            borderRadius: 3, color: MUTED, padding: '9px 20px',
            cursor: 'pointer', width: '100%',
          }}
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
}
