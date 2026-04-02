// Reusable Fashion Editorial + Affiliate Commerce Modules
// Used in FashionLandingPage and can be embedded in any fashion article or shopping edit.

import { useState, useRef } from 'react';
import ProductCard from './ProductCard';
import { getProductsByCollection, formatPrice } from '../data/products';
import { trackExternalClick } from '../../../services/outboundClickService';

const FU = "'Nunito', 'Inter', 'Helvetica Neue', sans-serif";
const FD = "'Gilda Display', 'Playfair Display', Georgia, serif";
const GOLD = '#c9a96e';
const CREAM = '#f5f0e8';

// ─── EDITORIAL MODULES ─────────────────────────────────────────────────────────

// Fashion Quote Block, full-width editorial pull quote
export function FashionQuote({ quote, attribution, isLight = true }) {
  const TEXT = isLight ? '#1a1806' : CREAM;
  const MUTED = isLight ? 'rgba(30,28,22,0.45)' : 'rgba(245,240,232,0.45)';
  return (
    <blockquote style={{
      margin: '0',
      padding: 'clamp(40px,5vw,72px) clamp(24px,5vw,80px)',
      textAlign: 'center',
      borderTop: `1px solid ${isLight ? 'rgba(30,28,22,0.08)' : 'rgba(201,169,110,0.1)'}`,
      borderBottom: `1px solid ${isLight ? 'rgba(30,28,22,0.08)' : 'rgba(201,169,110,0.1)'}`,
    }}>
      <div style={{ width: 24, height: 1, background: GOLD, margin: '0 auto 24px' }} />
      <p style={{ fontFamily: FD, fontSize: 'clamp(22px,3.5vw,42px)', fontWeight: 400, fontStyle: 'italic', color: TEXT, lineHeight: 1.4, maxWidth: 800, margin: '0 auto 20px' }}>
        "{quote}"
      </p>
      {attribution && (
        <cite style={{ fontFamily: FU, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, fontStyle: 'normal' }}>
         , {attribution}
        </cite>
      )}
    </blockquote>
  );
}

// Style Feature Grid, 2-3 column editorial image grid with captions
export function StyleFeatureGrid({ items = [], isLight = true }) {
  // items: [{ image, caption, tag }]
  const BORDER = isLight ? 'rgba(30,28,22,0.08)' : 'rgba(201,169,110,0.08)';
  const CAP    = isLight ? 'rgba(30,28,22,0.5)' : 'rgba(245,240,232,0.5)';
  const TEXT   = isLight ? '#1a1806' : CREAM;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, 1fr)`,
      gap: 'clamp(12px,2vw,24px)',
    }}>
      {items.map((item, i) => (
        <figure key={i} style={{ margin: 0 }}>
          <div style={{ overflow: 'hidden', borderRadius: 2, border: `1px solid ${BORDER}` }}>
            <img
              src={item.image} alt={item.caption || ''}
              loading="lazy"
              style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block', transition: 'transform 0.6s ease' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            />
          </div>
          {item.tag && (
            <div style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, marginTop: 12, marginBottom: 5 }}>
              {item.tag}
            </div>
          )}
          {item.caption && (
            <figcaption style={{ fontFamily: FU, fontSize: 12, fontWeight: 300, color: CAP, lineHeight: 1.55 }}>
              {item.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}

// Trend Report Block, full-width editorial trend feature
export function TrendReport({ trend, isLight = true, onRead }) {
  const [hov, setHov] = useState(false);
  const TEXT  = isLight ? '#1a1806' : CREAM;
  const MUTED = isLight ? 'rgba(30,28,22,0.5)' : 'rgba(245,240,232,0.5)';
  if (!trend) return null;
  return (
    <article
      style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 0, borderRadius: 2, overflow: 'hidden', cursor: 'pointer',
        border: `1px solid ${isLight ? 'rgba(30,28,22,0.1)' : 'rgba(201,169,110,0.1)'}`,
      }}
      onClick={() => onRead && onRead(trend)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{ overflow: 'hidden', minHeight: 320 }}>
        <img src={trend.image} alt={trend.title} style={{
          width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: 320,
          transform: hov ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.7s ease',
        }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(28px,4vw,52px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 16, height: 1, background: GOLD }} />
          <span style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD }}>
            {trend.label || 'Trend Report'}
          </span>
        </div>
        <h3 style={{ fontFamily: FD, fontSize: 'clamp(20px,2.5vw,34px)', fontWeight: 400, color: TEXT, margin: '0 0 14px', lineHeight: 1.15 }}>
          {trend.title}
        </h3>
        <p style={{ fontFamily: FU, fontSize: 13, fontWeight: 300, color: MUTED, margin: '0 0 24px', lineHeight: 1.65 }}>
          {trend.excerpt}
        </p>
        <span style={{ fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: GOLD }}>
          Read the Report →
        </span>
      </div>
    </article>
  );
}

// Designer Spotlight, brand feature with logo + story
export function DesignerSpotlight({ designer, isLight = true, onRead }) {
  // designer: { name, country, heroImage, logoOrTag, story, signature, ctaLabel }
  const BG     = isLight ? '#f5f3ef' : '#0d0d0b';
  const TEXT   = isLight ? '#1a1806' : CREAM;
  const MUTED  = isLight ? 'rgba(30,28,22,0.55)' : 'rgba(245,240,232,0.55)';
  const BORDER = isLight ? 'rgba(30,28,22,0.08)' : 'rgba(201,169,110,0.08)';
  if (!designer) return null;
  return (
    <section style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 0 }}>
        <div style={{ position: 'relative', overflow: 'hidden', minHeight: 420 }}>
          <img src={designer.heroImage} alt={designer.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.4) 0%, transparent 60%)' }} />
        </div>
        <div style={{ padding: 'clamp(36px,5vw,60px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 20, height: 1, background: GOLD }} />
            <span style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD }}>
              Designer Spotlight
            </span>
          </div>
          <h2 style={{ fontFamily: FD, fontSize: 'clamp(28px,3.5vw,46px)', fontWeight: 400, color: TEXT, margin: '0 0 6px', lineHeight: 1.1 }}>
            {designer.name}
          </h2>
          {designer.country && (
            <div style={{ fontFamily: FU, fontSize: 10, color: MUTED, letterSpacing: '0.12em', marginBottom: 20 }}>
              {designer.country}
            </div>
          )}
          <p style={{ fontFamily: FU, fontSize: 13, fontWeight: 300, color: MUTED, lineHeight: 1.7, margin: '0 0 24px' }}>
            {designer.story}
          </p>
          {designer.signature && (
            <p style={{ fontFamily: FD, fontSize: 16, fontStyle: 'italic', color: TEXT, margin: '0 0 28px', paddingLeft: 12, borderLeft: `2px solid ${GOLD}` }}>
              "{designer.signature}"
            </p>
          )}
          {onRead && (
            <button onClick={onRead} style={{
              alignSelf: 'flex-start',
              fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: GOLD, background: 'none', border: `1px solid ${GOLD}50`,
              padding: '10px 22px', borderRadius: 1, cursor: 'pointer', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = `${GOLD}15`; e.currentTarget.style.borderColor = GOLD; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = `${GOLD}50`; }}
            >
              {designer.ctaLabel || 'View Collection →'}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// Mood Board, editorial image collage for fashion atmosphere
export function MoodBoard({ images = [], title, isLight = true }) {
  // images: string[] (4-6 images recommended)
  const TEXT = isLight ? '#1a1806' : CREAM;
  if (!images.length) return null;
  const [main, ...rest] = images;
  return (
    <div>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 20, height: 1, background: GOLD }} />
          <span style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD }}>
            {title}
          </span>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gridTemplateRows: 'auto auto', gap: 8 }}>
        <div style={{ gridRow: '1 / 3', overflow: 'hidden', borderRadius: 2 }}>
          <img src={main} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: 400 }} />
        </div>
        {rest.slice(0, 2).map((img, i) => (
          <div key={i} style={{ overflow: 'hidden', borderRadius: 2 }}>
            <img src={img} alt="" loading="lazy" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
          </div>
        ))}
      </div>
      {rest.length > 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(rest.length - 2, 4)}, 1fr)`, gap: 8, marginTop: 8 }}>
          {rest.slice(2, 6).map((img, i) => (
            <div key={i} style={{ overflow: 'hidden', borderRadius: 2 }}>
              <img src={img} alt="" loading="lazy" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Style Advice Block, editorial text feature with pull quote
export function StyleAdvice({ heading, body, tip, author, isLight = true }) {
  const BG    = isLight ? '#f5f3ef' : '#0d0d0b';
  const TEXT  = isLight ? '#1a1806' : CREAM;
  const MUTED = isLight ? 'rgba(30,28,22,0.55)' : 'rgba(245,240,232,0.55)';
  return (
    <div style={{
      background: BG, borderRadius: 2,
      padding: 'clamp(32px,5vw,56px)',
      borderLeft: `3px solid ${GOLD}`,
    }}>
      {heading && (
        <h3 style={{ fontFamily: FD, fontSize: 'clamp(20px,2.5vw,28px)', fontWeight: 400, color: TEXT, margin: '0 0 16px', lineHeight: 1.2 }}>
          {heading}
        </h3>
      )}
      {body && (
        <p style={{ fontFamily: FU, fontSize: 13, fontWeight: 300, color: MUTED, lineHeight: 1.75, margin: '0 0 20px' }}>
          {body}
        </p>
      )}
      {tip && (
        <p style={{ fontFamily: FD, fontSize: 18, fontStyle: 'italic', color: TEXT, margin: '0 0 16px', lineHeight: 1.55 }}>
          {tip}
        </p>
      )}
      {author && (
        <div style={{ fontFamily: FU, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD }}>
         , {author}
        </div>
      )}
    </div>
  );
}

// ─── COMMERCE MODULES ──────────────────────────────────────────────────────────

// Shoppable Product Row, horizontal scrolling product row
export function ShoppableProductRow({ headline, subline, collectionId, products: propProducts, isLight = true, ctaLabel, onCtaClick }) {
  const products = propProducts || (collectionId ? getProductsByCollection(collectionId) : []);
  const BG     = isLight ? '#fafaf8' : '#0a0a0a';
  const BORDER = isLight ? 'rgba(30,28,22,0.08)' : 'rgba(201,169,110,0.1)';
  const TEXT   = isLight ? '#1a1806' : CREAM;
  const MUTED  = isLight ? 'rgba(30,28,22,0.5)' : 'rgba(245,240,232,0.5)';
  if (!products.length) return null;

  return (
    <section style={{ background: BG, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
      <style>{`
        .spr-row { display:flex; gap:0; overflow-x:auto; scrollbar-width:thin; scroll-snap-type:x mandatory; }
        .spr-row::-webkit-scrollbar { height:3px; }
        .spr-row::-webkit-scrollbar-thumb { background:${GOLD}50; border-radius:2px; }
        .spr-item { flex:0 0 clamp(200px,22vw,280px); scroll-snap-align:start; padding:0 8px; }
      `}</style>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(40px,5vw,64px) clamp(24px,5vw,60px)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32, gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 20, height: 1, background: GOLD }} />
              <span style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.26em', textTransform: 'uppercase', color: GOLD }}>
                {subline || 'The Edit'}
              </span>
            </div>
            <h2 style={{ fontFamily: FD, fontSize: 'clamp(24px,3vw,38px)', fontWeight: 400, color: TEXT, margin: 0, lineHeight: 1.1 }}>
              {headline || 'Shop the Season'}
            </h2>
          </div>
          {ctaLabel && (
            <button onClick={onCtaClick} style={{
              fontFamily: FU, fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase',
              color: GOLD, background: 'none', border: 'none', cursor: 'pointer',
              padding: '6px 0', borderBottom: `1px solid ${GOLD}40`, whiteSpace: 'nowrap',
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderBottomColor = GOLD}
              onMouseLeave={e => e.currentTarget.style.borderBottomColor = `${GOLD}40`}
            >
              {ctaLabel} →
            </button>
          )}
        </div>
        {/* Products */}
        <div className="spr-row" style={{ margin: '0 -8px' }}>
          {products.map(p => (
            <div key={p.id} className="spr-item">
              <ProductCard product={p} variant="portrait" isLight={isLight} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Beauty Shelf, 4-item beauty product grid with editorial feel
export function BeautyShelf({ headline, products: propProducts, collectionId, isLight = true }) {
  const products = (propProducts || (collectionId ? getProductsByCollection(collectionId) : [])).slice(0, 4);
  const BG    = isLight ? '#fafaf8' : '#0a0a0a';
  const TEXT  = isLight ? '#1a1806' : CREAM;
  const MUTED = isLight ? 'rgba(30,28,22,0.5)' : 'rgba(245,240,232,0.5)';
  const BORDER = isLight ? 'rgba(30,28,22,0.08)' : 'rgba(201,169,110,0.1)';
  if (!products.length) return null;
  return (
    <section style={{ background: BG }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(40px,5vw,64px) clamp(24px,5vw,60px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 20, height: 1, background: GOLD }} />
          <span style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.26em', textTransform: 'uppercase', color: GOLD }}>
            Beauty
          </span>
        </div>
        <h2 style={{ fontFamily: FD, fontSize: 'clamp(24px,3vw,38px)', fontWeight: 400, color: TEXT, margin: '0 0 32px', lineHeight: 1.1 }}>
          {headline || 'The Beauty Edit'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 'clamp(16px,2vw,28px)' }}>
          {products.map(p => (
            <ProductCard key={p.id} product={p} variant="portrait" isLight={isLight} />
          ))}
        </div>
      </div>
    </section>
  );
}

// Accessories Edit, horizontal list of accessories with minimal cards
export function AccessoriesEdit({ headline, products: propProducts, collectionId, isLight = true }) {
  const products = propProducts || (collectionId ? getProductsByCollection(collectionId) : []);
  const BG     = isLight ? '#fff' : '#0d0d0b';
  const TEXT   = isLight ? '#1a1806' : CREAM;
  const BORDER = isLight ? 'rgba(30,28,22,0.08)' : 'rgba(201,169,110,0.08)';
  if (!products.length) return null;
  return (
    <section style={{ background: BG, borderTop: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(40px,5vw,64px) clamp(24px,5vw,60px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 20, height: 1, background: GOLD }} />
          <span style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.26em', textTransform: 'uppercase', color: GOLD }}>
            Accessories
          </span>
        </div>
        <h2 style={{ fontFamily: FD, fontSize: 'clamp(24px,3vw,38px)', fontWeight: 400, color: TEXT, margin: '0 0 32px', lineHeight: 1.1 }}>
          {headline || 'The Accessories Edit'}
        </h2>
        <div style={{ maxWidth: 640 }}>
          {products.map(p => (
            <ProductCard key={p.id} product={p} variant="minimal" isLight={isLight} />
          ))}
        </div>
      </div>
    </section>
  );
}

// Three-Item Luxury Edit, editorial 3-column product feature (portrait, with larger editorial note)
export function ThreeItemLuxuryEdit({ headline, products: propProducts, collectionId, isLight = true }) {
  const products = (propProducts || (collectionId ? getProductsByCollection(collectionId) : [])).slice(0, 3);
  const BG     = isLight ? '#fafaf8' : '#0a0a0a';
  const TEXT   = isLight ? '#1a1806' : CREAM;
  const BORDER = isLight ? 'rgba(30,28,22,0.08)' : 'rgba(201,169,110,0.1)';
  if (!products.length) return null;
  return (
    <section style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 2 }}>
      <div style={{ padding: 'clamp(32px,4vw,52px) clamp(24px,4vw,52px)' }}>
        {headline && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <div style={{ width: 20, height: 1, background: GOLD }} />
            <span style={{ fontFamily: FD, fontSize: 'clamp(20px,2.5vw,30px)', fontWeight: 400, color: TEXT }}>
              {headline}
            </span>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'clamp(20px,2.5vw,36px)' }}>
          {products.map(p => (
            <ProductCard key={p.id} product={p} variant="portrait" isLight={isLight} />
          ))}
        </div>
      </div>
    </section>
  );
}

// Gift Guide Row, editorial gift guide with budget labels
export function GiftGuideRow({ headline, items = [], isLight = true }) {
  // items: [{ label, product }]
  const BG   = isLight ? '#fff' : '#0d0d0b';
  const TEXT = isLight ? '#1a1806' : CREAM;
  const MUTED = isLight ? 'rgba(30,28,22,0.5)' : 'rgba(245,240,232,0.5)';
  if (!items.length) return null;
  return (
    <section style={{ background: BG }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(40px,5vw,64px) clamp(24px,5vw,60px)' }}>
        {headline && (
          <h2 style={{ fontFamily: FD, fontSize: 'clamp(24px,3vw,38px)', fontWeight: 400, color: TEXT, margin: '0 0 32px', lineHeight: 1.1 }}>
            {headline}
          </h2>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 'clamp(16px,2vw,28px)' }}>
          {items.map((item, i) => (
            <div key={i}>
              {item.label && (
                <div style={{ fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD, marginBottom: 10 }}>
                  {item.label}
                </div>
              )}
              <ProductCard product={item.product} variant="portrait" isLight={isLight} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Affiliate Break, full-width ambient affiliate CTA (editorial brand feature)
export function AffiliateBreak({ brand, tagline, description, image, ctaLabel, ctaUrl, isLight = true }) {
  const [hov, setHov] = useState(false);
  return (
    <section style={{ position: 'relative', overflow: 'hidden', minHeight: 320 }}>
      <img src={image} alt={brand} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0.12) 100%)' }} />
      <div style={{ position: 'relative', padding: 'clamp(48px,7vw,88px) clamp(24px,6vw,80px)', maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 20, height: 1, background: GOLD }} />
          <span style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD }}>
            {tagline || 'Featured Designer'}
          </span>
        </div>
        <h2 style={{ fontFamily: FD, fontSize: 'clamp(28px,4vw,52px)', fontWeight: 400, color: CREAM, margin: '0 0 16px', lineHeight: 1.1 }}>
          {brand}
        </h2>
        {description && (
          <p style={{ fontFamily: FU, fontSize: 'clamp(12px,1.4vw,15px)', fontWeight: 300, color: 'rgba(245,240,232,0.7)', margin: '0 0 28px', lineHeight: 1.7 }}>
            {description}
          </p>
        )}
        <a
          href={ctaUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => { if (ctaUrl) trackExternalClick({ entityType: 'magazine', entityId: null, venueId: null, linkType: 'website', url: ctaUrl }); }}
          style={{
            display: 'inline-block',
            fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: CREAM, background: 'transparent', border: `1px solid rgba(245,240,232,0.45)`,
            padding: '12px 28px', borderRadius: 1, textDecoration: 'none', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,240,232,0.1)'; e.currentTarget.style.borderColor = CREAM; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(245,240,232,0.45)'; }}
        >
          {ctaLabel || 'Explore Collection →'}
        </a>
      </div>
    </section>
  );
}

// Where to Buy Panel, list of retailers for a single product/look
export function WhereToBuy({ title, retailers = [], isLight = true }) {
  // retailers: [{ name, url, price, note }]
  const BG     = isLight ? '#f5f3ef' : '#0d0d0b';
  const TEXT   = isLight ? '#1a1806' : CREAM;
  const MUTED  = isLight ? 'rgba(30,28,22,0.5)' : 'rgba(245,240,232,0.5)';
  const BORDER = isLight ? 'rgba(30,28,22,0.1)' : 'rgba(245,240,232,0.08)';
  if (!retailers.length) return null;
  return (
    <div style={{ background: BG, borderRadius: 2, border: `1px solid ${BORDER}`, padding: '28px 24px' }}>
      {title && (
        <div style={{ fontFamily: FD, fontSize: 18, fontWeight: 400, color: TEXT, marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${BORDER}` }}>
          {title}
        </div>
      )}
      {retailers.map((r, i) => (
        <a
          key={i}
          href={r.url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => { if (r.url) trackExternalClick({ entityType: 'magazine', entityId: null, venueId: null, linkType: 'brochure', url: r.url }); }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 0',
            borderBottom: i < retailers.length - 1 ? `1px solid ${BORDER}` : 'none',
            textDecoration: 'none',
          }}
        >
          <div>
            <div style={{ fontFamily: FU, fontSize: 12, fontWeight: 600, color: TEXT, marginBottom: 2 }}>{r.name}</div>
            {r.note && <div style={{ fontFamily: FU, fontSize: 11, color: MUTED }}>{r.note}</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {r.price && <span style={{ fontFamily: FU, fontSize: 13, fontWeight: 600, color: TEXT }}>{r.price}</span>}
            <span style={{ fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: GOLD }}>Shop →</span>
          </div>
        </a>
      ))}
    </div>
  );
}
