import { useState } from 'react';
import { formatPrice } from '../data/products';
import { trackExternalClick } from '../../../services/outboundClickService';

const FU = "'Nunito', 'Inter', 'Helvetica Neue', sans-serif";
const FD = "'Gilda Display', 'Playfair Display', Georgia, serif";
const GOLD = '#c9a96e';

// Badge colours
const BADGE_STYLES = {
  "Editor's Pick": { bg: GOLD, color: '#fff' },
  'New Season':    { bg: 'transparent', color: GOLD, border: `1px solid ${GOLD}` },
  'Sale':          { bg: '#c44', color: '#fff' },
  'Trending':      { bg: 'transparent', color: 'rgba(30,28,22,0.6)', border: '1px solid rgba(30,28,22,0.25)' },
};

// ─── Main ProductCard ──────────────────────────────────────────────────────────
// variant: 'portrait' (default tall card) | 'landscape' (side-by-side) | 'minimal' (text-forward)
export default function ProductCard({
  product,
  variant = 'portrait',
  isLight = true,
  onClick,
}) {
  const [hovered, setHovered] = useState(false);

  if (!product) return null;
  const {
    image, title, brand, price, salePrice, description,
    affiliateUrl, retailer, cta = 'Shop Now', editorialNote, badge,
  } = product;

  const BG      = isLight ? '#fff' : '#111';
  const BORDER  = isLight ? 'rgba(30,28,22,0.1)' : 'rgba(245,240,232,0.1)';
  const TEXT    = isLight ? '#1a1806' : '#f5f0e8';
  const MUTED   = isLight ? 'rgba(30,28,22,0.5)' : 'rgba(245,240,232,0.5)';
  const DIVIDER = isLight ? 'rgba(30,28,22,0.08)' : 'rgba(245,240,232,0.08)';

  const handleClick = () => {
    if (onClick) onClick(product);
    else if (affiliateUrl && affiliateUrl !== '#') window.open(affiliateUrl, '_blank', 'noopener');
  };

  if (variant === 'landscape') {
    return (
      <article
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'grid', gridTemplateColumns: '140px 1fr',
          gap: 0, background: BG,
          border: `1px solid ${hovered ? GOLD + '60' : BORDER}`,
          borderRadius: 2, overflow: 'hidden', cursor: 'pointer',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxShadow: hovered ? `0 4px 20px ${GOLD}18` : 'none',
        }}
      >
        <div style={{ overflow: 'hidden', position: 'relative' }}>
          <img src={image} alt={title} style={{
            width: '100%', height: '100%', objectFit: 'cover',
            display: 'block', minHeight: 140,
            transform: hovered ? 'scale(1.06)' : 'scale(1)',
            transition: 'transform 0.6s ease',
          }} />
          {badge && (
            <span style={{
              position: 'absolute', top: 8, left: 8,
              fontFamily: FU, fontSize: 8, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '3px 7px', borderRadius: 1,
              ...(BADGE_STYLES[badge] || BADGE_STYLES["Editor's Pick"]),
            }}>{badge}</span>
          )}
        </div>
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, marginBottom: 5 }}>
              {brand}
            </div>
            <div style={{ fontFamily: FD, fontSize: 16, fontWeight: 400, color: TEXT, lineHeight: 1.2, marginBottom: 6 }}>
              {title}
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontFamily: FU, fontSize: 13, fontWeight: 600, color: TEXT }}>
                {formatPrice(salePrice || price)}
              </span>
              {salePrice && (
                <span style={{ fontFamily: FU, fontSize: 11, color: MUTED, textDecoration: 'line-through' }}>
                  {formatPrice(price)}
                </span>
              )}
            </div>
            <a
              href={affiliateUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => { e.stopPropagation(); if (affiliateUrl) trackExternalClick({ entityType: 'magazine', entityId: null, venueId: null, linkType: 'brochure', url: affiliateUrl }); }}
              style={{
                fontFamily: FU, fontSize: 9, fontWeight: 700,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: GOLD, textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              {cta} <span style={{ fontSize: 11 }}>→</span>
            </a>
          </div>
        </div>
      </article>
    );
  }

  if (variant === 'minimal') {
    return (
      <article
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          padding: '20px 0',
          borderBottom: `1px solid ${DIVIDER}`,
          cursor: 'pointer',
          display: 'grid', gridTemplateColumns: '72px 1fr',
          gap: 16, alignItems: 'center',
        }}
      >
        <div style={{ overflow: 'hidden', borderRadius: 2 }}>
          <img src={image} alt={title} style={{
            width: '100%', aspectRatio: '1', objectFit: 'cover',
            display: 'block',
            transform: hovered ? 'scale(1.08)' : 'scale(1)',
            transition: 'transform 0.5s ease',
          }} />
        </div>
        <div>
          <div style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, marginBottom: 3 }}>
            {brand}
          </div>
          <div style={{ fontFamily: FD, fontSize: 15, fontWeight: 400, color: TEXT, lineHeight: 1.2, marginBottom: 6 }}>
            {title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: FU, fontSize: 12, fontWeight: 600, color: TEXT }}>
              {formatPrice(salePrice || price)}
            </span>
            {salePrice && (
              <span style={{ fontFamily: FU, fontSize: 11, color: MUTED, textDecoration: 'line-through' }}>
                {formatPrice(price)}
              </span>
            )}
            <span style={{ marginLeft: 'auto', fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: GOLD }}>
              {cta} →
            </span>
          </div>
        </div>
      </article>
    );
  }

  // Default: portrait
  return (
    <article
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: BG, border: `1px solid ${hovered ? GOLD + '50' : BORDER}`,
        borderRadius: 2, overflow: 'hidden', cursor: 'pointer',
        transition: 'border-color 0.25s, box-shadow 0.25s',
        boxShadow: hovered ? `0 8px 32px ${GOLD}15` : 'none',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Image */}
      <div style={{ overflow: 'hidden', position: 'relative', aspectRatio: '4/5' }}>
        <img src={image} alt={title} style={{
          width: '100%', height: '100%', objectFit: 'cover', display: 'block',
          transform: hovered ? 'scale(1.06)' : 'scale(1)',
          transition: 'transform 0.7s ease',
        }} />
        {badge && (
          <span style={{
            position: 'absolute', top: 12, left: 12,
            fontFamily: FU, fontSize: 8, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '4px 8px', borderRadius: 1,
            ...(BADGE_STYLES[badge] || {}),
          }}>{badge}</span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '20px 18px 22px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Brand */}
        <div style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, marginBottom: 7 }}>
          {brand}
        </div>

        {/* Title */}
        <div style={{ fontFamily: FD, fontSize: 'clamp(16px, 1.5vw, 20px)', fontWeight: 400, color: TEXT, lineHeight: 1.2, marginBottom: 10, flex: 1 }}>
          {title}
        </div>

        {/* Description */}
        {description && (
          <p style={{ fontFamily: FU, fontSize: 12, fontWeight: 300, color: MUTED, lineHeight: 1.6, margin: '0 0 12px' }}>
            {description}
          </p>
        )}

        {/* Editorial note */}
        {editorialNote && (
          <p style={{ fontFamily: FD, fontSize: 13, fontStyle: 'italic', color: MUTED, lineHeight: 1.5, margin: '0 0 14px', paddingLeft: 10, borderLeft: `2px solid ${GOLD}50` }}>
            {editorialNote}
          </p>
        )}

        {/* Price row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, marginTop: 'auto' }}>
          <span style={{ fontFamily: FU, fontSize: 14, fontWeight: 600, color: TEXT }}>
            {formatPrice(salePrice || price)}
          </span>
          {salePrice && (
            <span style={{ fontFamily: FU, fontSize: 12, color: MUTED, textDecoration: 'line-through' }}>
              {formatPrice(price)}
            </span>
          )}
        </div>

        {/* CTA + Retailer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a
            href={affiliateUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => { e.stopPropagation(); if (affiliateUrl) trackExternalClick({ entityType: 'magazine', entityId: null, venueId: null, linkType: 'brochure', url: affiliateUrl }); }}
            style={{
              fontFamily: FU, fontSize: 9, fontWeight: 700,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: '#fff', background: GOLD,
              padding: '9px 18px', borderRadius: 1,
              textDecoration: 'none', display: 'inline-block',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = 0.85}
            onMouseLeave={e => e.currentTarget.style.opacity = 1}
          >
            {cta}
          </a>
          {retailer && (
            <span style={{ fontFamily: FU, fontSize: 10, color: MUTED, letterSpacing: '0.06em' }}>
              via {retailer}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
