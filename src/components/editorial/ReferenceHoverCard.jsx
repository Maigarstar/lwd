// ═══════════════════════════════════════════════════════════════════════════
// ReferenceHoverCard.jsx — Tooltip preview for reference links
// Shows entity preview (image, name, location, tier) on hover.
// Used in ArticleBody when a reference link is hovered.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';

const GOLD = '#C9A84C';
const TIER_COLORS = { sponsored: '#8b5cf6', featured: '#10b981', linked: '#C9A84C', mentioned: '#888' };

export default function ReferenceHoverCard({ anchor, entityType, entityId, slug, label, subtitle, image, tier, referenceTier, url, onClose }) {
  const cardRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const cardW = 300;
    let left = rect.left + rect.width / 2 - cardW / 2;
    if (left < 12) left = 12;
    if (left + cardW > window.innerWidth - 12) left = window.innerWidth - cardW - 12;
    setPos({ top: rect.bottom + 8 + window.scrollY, left });
    requestAnimationFrame(() => setVisible(true));
  }, [anchor]);

  useEffect(() => {
    const handleClick = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) onClose?.();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const tierColor = TIER_COLORS[referenceTier] || GOLD;

  return (
    <div ref={cardRef} style={{
      position: 'absolute',
      top: pos.top,
      left: pos.left,
      width: 300,
      background: '#1a1714',
      border: `1px solid ${tierColor}30`,
      borderRadius: 6,
      overflow: 'hidden',
      boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
      zIndex: 9999,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(-4px)',
      transition: 'opacity 0.2s ease, transform 0.2s ease',
      pointerEvents: 'auto',
    }}>
      {image && (
        <div style={{ height: 120, background: `url(${image}) center/cover`, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 50%, rgba(26,23,20,0.9))' }} />
        </div>
      )}

      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontFamily: "'Urbanist', sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: tierColor, marginBottom: 6, opacity: 0.8 }}>
          {entityType === 'showcase' ? '✦ Showcase' : entityType === 'article' ? '✦ Article' : '✦ Venue'}
          {referenceTier && referenceTier !== 'linked' && <span style={{ marginLeft: 8, opacity: 0.6 }}>· {referenceTier}</span>}
        </div>

        <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, fontWeight: 400, color: '#f5f0e8', lineHeight: 1.25, marginBottom: 4 }}>
          {label}
        </div>

        {subtitle && (
          <div style={{ fontFamily: "'Urbanist', sans-serif", fontSize: 11, color: 'rgba(245,240,232,0.45)', marginBottom: 10 }}>
            {subtitle}
          </div>
        )}

        {tier && tier !== 'standard' && tier !== 'free' && (
          <div style={{
            display: 'inline-block',
            fontFamily: "'Urbanist', sans-serif",
            fontSize: 7,
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            padding: '2px 8px',
            borderRadius: 2,
            background: tier === 'showcase' ? `${GOLD}18` : tier === 'premium' ? 'rgba(139,92,246,0.12)' : 'rgba(16,185,129,0.12)',
            color: tier === 'showcase' ? GOLD : tier === 'premium' ? '#8b5cf6' : '#10b981',
            marginBottom: 10,
          }}>
            {tier}
          </div>
        )}

        {url && (
          <a href={url} style={{
            display: 'inline-block',
            fontFamily: "'Urbanist', sans-serif",
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '5px 14px',
            border: `1px solid ${tierColor}40`,
            borderRadius: 2,
            color: tierColor,
            textDecoration: 'none',
            transition: 'all 0.2s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = `${tierColor}12`; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            View {entityType === 'article' ? 'Article' : 'Profile'} →
          </a>
        )}
      </div>
    </div>
  );
}
