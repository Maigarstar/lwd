// ─── TemplateCanvas.jsx ──────────────────────────────────────────────────────
// Renders any of the 12 luxury magazine templates as styled HTML.
// Uses ONLY inline styles — no CSS classes — so html2canvas captures correctly.
// All measurements scale with `s = width / 400`.

import React from 'react';
import { PALETTES, PAGE_RATIOS, FONTS } from './palettes';

const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,400;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Josefin+Sans:wght@300;400;600;700&family=Playfair+Display:ital,wght@0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;1,400&display=swap';

// ── Image placeholder ─────────────────────────────────────────────────────────
function ImgPlaceholder({ style = {} }) {
  return (
    <div style={{
      ...style,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '1px dashed rgba(255,255,255,0.2)',
      background: 'rgba(0,0,0,0.12)',
    }}>
      <span style={{ fontSize: style.fontSize || 24, opacity: 0.25, color: '#fff', fontFamily: 'sans-serif' }}>⊡</span>
    </div>
  );
}

function ImgOrPlaceholder({ src, style = {}, placeholderStyle = {} }) {
  if (!src) return <ImgPlaceholder style={{ ...style, ...placeholderStyle }} />;
  return <img src={src} alt="" style={{ ...style, objectFit: style.objectFit || 'cover' }} />;
}

// ── Template components ───────────────────────────────────────────────────────

function VogueCover({ f, s, W, H }) {
  const P = PALETTES.obsidian;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg }}>
      {/* Background image */}
      {f.bgImage
        ? <img src={f.bgImage} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
        : <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #1a1208 0%, #080806 100%)' }} />
      }
      {/* Dark gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.08) 48%, rgba(0,0,0,0.38) 100%)' }} />

      {/* Top center: masthead + issue label */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 18 * s }}>
        <div style={{ fontFamily: FONTS.caption, fontSize: 9 * s, color: P.accent, letterSpacing: '0.35em', textTransform: 'uppercase', fontWeight: 700 }}>
          {f.masthead || 'LWD'}
        </div>
        {f.issueLabel && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 7 * s, color: P.muted, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 4 * s }}>
            {f.issueLabel}
          </div>
        )}
      </div>

      {/* Bottom 35%: title + rule + credits */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: `0 ${22 * s}px ${24 * s}px` }}>
        <div style={{ fontFamily: FONTS.display, fontSize: 44 * s, fontWeight: 400, color: '#fff', letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1.08, whiteSpace: 'pre-line' }}>
          {f.title || 'THE BRIDAL\nEDITION'}
        </div>
        <div style={{ width: 40 * s, height: 1, background: P.accent, marginTop: 12 * s, marginBottom: 12 * s }} />
        {f.credits && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: P.accent, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {f.credits}
          </div>
        )}
      </div>
    </div>
  );
}

function TheGown({ f, s, W, H }) {
  const P = PALETTES.ivory;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg }}>
      {/* Image: left 62% full height */}
      {f.image
        ? <img src={f.image} alt="" style={{ position: 'absolute', left: 0, top: 0, width: '62%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
        : <div style={{ position: 'absolute', left: 0, top: 0, width: '62%', height: '100%', background: '#E8E0D4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 32 * s, opacity: 0.18, color: P.text, fontFamily: 'sans-serif' }}>⊡</span>
          </div>
      }

      {/* Right 38% text panel */}
      <div style={{ position: 'absolute', right: 0, top: 0, width: '38%', height: '100%', background: P.bg, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: 24 * s, paddingRight: 20 * s, boxSizing: 'border-box' }}>
        {/* Thin gold vertical rule */}
        <div style={{ position: 'absolute', left: 0, top: '10%', height: '80%', width: 1, background: P.accent, opacity: 0.7 }} />

        <div style={{ fontFamily: FONTS.editorial, fontSize: 42 * s, color: P.text, fontWeight: 300, lineHeight: 1.08, marginBottom: 16 * s, fontStyle: 'italic' }}>
          The<br />Dress
        </div>
        <div style={{ fontFamily: FONTS.caption, fontSize: 9 * s, color: P.accent, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 * s }}>
          {f.dressName || 'THE GOWN'}
        </div>
        {f.designer && (
          <div style={{ fontFamily: FONTS.editorial, fontSize: 18 * s, color: P.text, fontStyle: 'italic', marginBottom: 4 * s }}>
            {f.designer}
          </div>
        )}
        {f.details && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: P.muted, letterSpacing: '0.08em', marginTop: 12 * s, lineHeight: 1.6 }}>
            {f.details}
          </div>
        )}
        {f.price && (
          <div style={{ fontFamily: FONTS.display, fontSize: 16 * s, color: P.accent, marginTop: 10 * s }}>
            {f.price}
          </div>
        )}
      </div>

      {/* LWD mark bottom left */}
      <div style={{ position: 'absolute', bottom: 12 * s, left: 14 * s, fontFamily: FONTS.caption, fontSize: 7 * s, color: P.muted, letterSpacing: '0.1em' }}>
        LWD
      </div>
    </div>
  );
}

function TheJewel({ f, s, W, H }) {
  const palKey = f.bgPalette || 'claret';
  const P = PALETTES[palKey] || PALETTES.claret;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg }}>
      {/* Radial vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)' }} />

      {/* Centered content */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `${20 * s}px ${24 * s}px` }}>
        {/* Product image */}
        <div style={{ width: '55%', maxHeight: H * 0.52, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 * s }}>
          {f.image
            ? <img src={f.image} alt="" style={{ maxWidth: '100%', maxHeight: H * 0.52, objectFit: 'contain', display: 'block' }} />
            : <div style={{ width: W * 0.55, height: H * 0.42, border: '1px dashed rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 28 * s, opacity: 0.2, color: '#fff', fontFamily: 'sans-serif' }}>⊡</span>
              </div>
          }
        </div>

        {/* Decorative mark */}
        <div style={{ fontFamily: FONTS.editorial, fontSize: 14 * s, color: P.accent, opacity: 0.6, marginBottom: 12 * s }}>◈</div>

        {/* Name */}
        <div style={{ fontFamily: FONTS.display, fontSize: 16 * s, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: P.text, textAlign: 'center', lineHeight: 1.2 }}>
          {f.name || 'THE JEWEL'}
        </div>

        {/* Rule */}
        <div style={{ width: 40 * s, height: 1, background: P.accent, margin: `${10 * s}px auto` }} />

        {/* Details */}
        {f.details && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: P.muted, letterSpacing: '0.08em', textAlign: 'center', lineHeight: 1.6, marginBottom: 5 * s }}>
            {f.details}
          </div>
        )}
        {f.brand && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 9 * s, color: P.accent, letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center', marginBottom: 5 * s }}>
            {f.brand}
          </div>
        )}
        {f.price && (
          <div style={{ fontFamily: FONTS.editorial, fontSize: 15 * s, fontStyle: 'italic', color: P.text, textAlign: 'center', marginTop: 6 * s }}>
            {f.price}
          </div>
        )}
      </div>
    </div>
  );
}

function FeatureSpread({ f, s, W, H }) {
  const GOLD = '#C9A84C';
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: '#FFFFFF' }}>
      {/* Left 65%: full-bleed image */}
      {f.image
        ? <img src={f.image} alt="" style={{ position: 'absolute', left: 0, top: 0, width: '65%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ position: 'absolute', left: 0, top: 0, width: '65%', height: '100%', background: '#E8E4DC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 32 * s, opacity: 0.18, color: '#333', fontFamily: 'sans-serif' }}>⊡</span>
          </div>
      }

      {/* Right 35%: text panel */}
      <div style={{ position: 'absolute', right: 0, top: 0, width: '35%', height: '100%', background: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `${28 * s}px ${20 * s}px`, boxSizing: 'border-box' }}>
        {/* Gold rule */}
        <div style={{ width: 32 * s, height: 2, background: GOLD, marginBottom: 20 * s }} />

        {/* Headline */}
        <div style={{ fontFamily: FONTS.subhead, fontSize: 26 * s, fontWeight: 700, fontStyle: 'italic', color: '#111', lineHeight: 1.12, whiteSpace: 'pre-line', marginBottom: 16 * s }}>
          {f.headline || 'SOMETHING\nBORROWED,\nSOMETHING\nGOLD'}
        </div>

        {/* Body */}
        {f.body && (
          <div style={{ fontFamily: FONTS.body, fontSize: 11 * s, color: '#333', lineHeight: 1.65, marginBottom: 16 * s }}>
            {f.body}
          </div>
        )}

        {/* Bottom: rule + byline */}
        <div style={{ marginTop: 'auto' }}>
          <div style={{ width: '100%', height: 1, background: 'rgba(0,0,0,0.1)', marginBottom: 8 * s }} />
          {f.byline && (
            <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: 'rgba(17,17,17,0.45)', letterSpacing: '0.06em' }}>
              {f.byline}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TheRunway({ f, s, W, H }) {
  const P = PALETTES.obsidian;
  const filmH = H * 0.72;
  const bottomH = H * 0.28;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg }}>
      {/* 3-image filmstrip: top 72% */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: filmH, display: 'flex' }}>
        {[f.image1, f.image2, f.image3].map((img, i) => (
          img
            ? <img key={i} src={img} alt="" style={{ width: '33.333%', height: '100%', objectFit: 'cover', display: 'block', flexShrink: 0 }} />
            : <div key={i} style={{ width: '33.333%', height: '100%', background: i % 2 === 0 ? '#141210' : '#1a1712', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 24 * s, opacity: 0.15, color: '#fff', fontFamily: 'sans-serif' }}>⊡</span>
              </div>
        ))}
      </div>

      {/* Gold rule at 72% */}
      <div style={{ position: 'absolute', top: filmH, left: 0, right: 0, height: 1, background: P.accent, opacity: 0.5 }} />

      {/* Bottom text area */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: bottomH, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 14 * s }}>
        <div style={{ fontFamily: FONTS.display, fontSize: 18 * s, fontWeight: 400, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#fff', textAlign: 'center', marginBottom: 10 * s }}>
          {f.heading || 'SPRING / SUMMER 2026'}
        </div>
        {f.designers && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: P.accent, letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center' }}>
            {f.designers}
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 10 * s, fontFamily: FONTS.caption, fontSize: 7 * s, color: P.muted, letterSpacing: '0.1em' }}>
          LWD
        </div>
      </div>
    </div>
  );
}

function TheDestination({ f, s, W, H }) {
  const P = PALETTES.midnight;
  const imgH = H * 0.80;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg }}>
      {/* Full-bleed landscape image top 80% */}
      {f.image
        ? <img src={f.image} alt="" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: imgH, width: '100%', objectFit: 'cover' }} />
        : <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: imgH, background: 'linear-gradient(135deg, #1a2840 0%, #0b1525 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 32 * s, opacity: 0.15, color: '#fff', fontFamily: 'sans-serif' }}>⊡</span>
          </div>
      }

      {/* Gradient bleed from image into bg */}
      <div style={{ position: 'absolute', top: imgH * 0.55, left: 0, right: 0, height: imgH * 0.45 + H * 0.2, background: `linear-gradient(to top, ${P.bg} 0%, transparent 100%)` }} />

      {/* Bottom text area */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: `0 ${22 * s}px ${20 * s}px` }}>
        <div style={{ width: '100%', height: 1, background: P.accent, opacity: 0.45, marginBottom: 14 * s }} />
        <div style={{ fontFamily: FONTS.editorial, fontSize: 48 * s, fontStyle: 'italic', fontWeight: 300, color: P.text, letterSpacing: '0.04em', lineHeight: 1 }}>
          {f.location || 'TUSCANY'}
        </div>
        {f.subline && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 9 * s, color: P.accent, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 6 * s }}>
            {f.subline}
          </div>
        )}
        {f.description && (
          <div style={{ fontFamily: FONTS.editorial, fontSize: 11 * s, fontStyle: 'italic', color: P.muted, marginTop: 8 * s, lineHeight: 1.5 }}>
            {f.description}
          </div>
        )}
      </div>
    </div>
  );
}

function ThePortrait({ f, s, W, H }) {
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: '#1a1008' }}>
      {/* Full-bleed image */}
      {f.image
        ? <img src={f.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #3d2a1e 0%, #1a0e0a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 36 * s, opacity: 0.15, color: '#fff', fontFamily: 'sans-serif' }}>⊡</span>
          </div>
      }

      {/* Dark gradient overlay bottom */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.74) 0%, rgba(0,0,0,0) 55%)' }} />

      {/* Bottom text area */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 28 * s }}>
        <div style={{ fontFamily: FONTS.editorial, fontSize: 28 * s, fontStyle: 'italic', fontWeight: 300, color: '#F5EDE0', textAlign: 'center', marginBottom: 8 * s, lineHeight: 1.2 }}>
          {f.names || 'Isabella & James'}
        </div>
        <div style={{ width: 40 * s, height: 1, background: '#C9A84C', marginBottom: 8 * s }} />
        {f.location && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: '#C9A84C', letterSpacing: '0.2em', textTransform: 'uppercase', textAlign: 'center', marginBottom: 5 * s }}>
            {f.location}
          </div>
        )}
        {f.date && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.1em', textAlign: 'center' }}>
            {f.date}
          </div>
        )}
      </div>
    </div>
  );
}

function TheTriptych({ f, s, W, H }) {
  const P = PALETTES.ivory;
  const imgH = H * 0.72;
  const colW = (W - 4) / 3; // 2px gaps
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg }}>
      {/* 3 images */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: imgH, display: 'flex', gap: 2 }}>
        {[f.image1, f.image2, f.image3].map((img, i) => (
          img
            ? <img key={i} src={img} alt="" style={{ width: colW, height: '100%', objectFit: 'cover', display: 'block', flexShrink: 0 }} />
            : <div key={i} style={{ width: colW, height: '100%', background: '#E4DDD2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 20 * s, opacity: 0.2, color: P.text, fontFamily: 'sans-serif' }}>⊡</span>
              </div>
        ))}
      </div>

      {/* Thin rule */}
      <div style={{ position: 'absolute', top: imgH, left: 0, right: 0, height: 1, background: P.rule }} />

      {/* 3 caption columns */}
      <div style={{ position: 'absolute', top: imgH + 1, left: 0, right: 0, bottom: 0, display: 'flex', gap: 2 }}>
        {[f.caption1, f.caption2, f.caption3].map((cap, i) => (
          <div key={i} style={{ width: colW, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 10 * s, flexShrink: 0 }}>
            <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: P.accent, letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center' }}>
              {cap || ['The Bouquet', 'The Ring', 'The Veil'][i]}
            </div>
          </div>
        ))}
      </div>

      {/* Credit bottom center */}
      {f.credit && (
        <div style={{ position: 'absolute', bottom: 14 * s, left: 0, right: 0, fontFamily: FONTS.caption, fontSize: 7 * s, color: P.muted, letterSpacing: '0.06em', textAlign: 'center' }}>
          {f.credit}
        </div>
      )}
    </div>
  );
}

function PullQuote({ f, s, W, H }) {
  const P = PALETTES.obsidian;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `${40 * s}px` }}>
      {/* Decorative opening mark */}
      <div style={{ fontFamily: FONTS.editorial, fontSize: 80 * s, color: P.accent, opacity: 0.25, lineHeight: 0.6, alignSelf: 'flex-start', marginBottom: -20 * s, userSelect: 'none' }}>
        "
      </div>

      {/* Quote */}
      <div style={{ fontFamily: FONTS.editorial, fontSize: 22 * s, fontStyle: 'italic', fontWeight: 300, color: '#F0EBE0', lineHeight: 1.55, textAlign: 'center' }}>
        {f.quote || '"A wedding dress is not just a garment. It is an heirloom in waiting."'}
      </div>

      {/* Rule */}
      <div style={{ width: 40 * s, height: 1, background: P.accent, opacity: 0.45, margin: `${16 * s}px auto` }} />

      {/* Attribution */}
      {f.attribution && (
        <div style={{ fontFamily: FONTS.caption, fontSize: 9 * s, color: P.accent, letterSpacing: '0.12em', textAlign: 'center' }}>
          {f.attribution}
        </div>
      )}
    </div>
  );
}

function ProductPage({ f, s, W, H }) {
  const GOLD_ACC = '#888888';
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `${24 * s}px` }}>
      {/* Category — top */}
      {f.category && (
        <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: '#999', letterSpacing: '0.15em', textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 * s }}>
          {f.category}
        </div>
      )}

      {/* Product image */}
      <div style={{ width: '100%', height: H * 0.58, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {f.image
          ? <img src={f.image} alt="" style={{ maxWidth: '80%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
          : <div style={{ width: W * 0.6, height: H * 0.5, background: '#F5F5F5', border: '1px dashed rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 28 * s, opacity: 0.2, color: '#333', fontFamily: 'sans-serif' }}>⊡</span>
            </div>
        }
      </div>

      {/* Rule */}
      <div style={{ width: '100%', height: 1, background: 'rgba(0,0,0,0.1)', marginTop: 20 * s, marginBottom: 20 * s }} />

      {/* Product name */}
      <div style={{ fontFamily: FONTS.caption, fontSize: 11 * s, fontWeight: 600, color: '#111', letterSpacing: '0.15em', textTransform: 'uppercase', textAlign: 'center', marginBottom: 8 * s }}>
        {f.name || 'PRODUCT NAME'}
      </div>

      {/* Brand */}
      {f.brand && (
        <div style={{ fontFamily: FONTS.caption, fontSize: 9 * s, color: '#666', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 4 * s }}>
          {f.brand}
        </div>
      )}

      {/* Price */}
      {f.price && (
        <div style={{ fontFamily: FONTS.subhead, fontSize: 18 * s, color: '#111', fontWeight: 400, textAlign: 'center', marginTop: 6 * s }}>
          {f.price}
        </div>
      )}
    </div>
  );
}

function TheHotel({ f, s, W, H }) {
  const P = PALETTES.midnight;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg }}>
      {/* Left 46%: full-height image */}
      {f.image
        ? <img src={f.image} alt="" style={{ position: 'absolute', left: 0, top: 0, width: '46%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ position: 'absolute', left: 0, top: 0, width: '46%', height: '100%', background: '#0e1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 28 * s, opacity: 0.15, color: '#fff', fontFamily: 'sans-serif' }}>⊡</span>
          </div>
      }

      {/* Gold vertical rule at 46% */}
      <div style={{ position: 'absolute', left: 'calc(46% - 1px)', top: '8%', height: '84%', width: 1, background: P.accent, opacity: 0.4 }} />

      {/* Right 54%: text panel */}
      <div style={{ position: 'absolute', left: '47%', top: 0, right: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `${24 * s}px ${20 * s}px`, boxSizing: 'border-box' }}>
        <div style={{ fontFamily: FONTS.subhead, fontSize: 16 * s, fontWeight: 700, color: P.text, letterSpacing: '0.08em', lineHeight: 1.2, marginBottom: 4 * s }}>
          {f.venueName || 'THE VENUE'}
        </div>
        {f.location && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: P.accent, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 * s }}>
            {f.location}
          </div>
        )}

        {/* Rule */}
        <div style={{ width: 28 * s, height: 1, background: P.accent, opacity: 0.5, marginBottom: 14 * s }} />

        {/* Description */}
        {f.description && (
          <div style={{ fontFamily: FONTS.body, fontSize: 10 * s, color: P.muted, lineHeight: 1.6, marginBottom: 14 * s }}>
            {f.description}
          </div>
        )}

        {/* Features */}
        {f.features && f.features.split('\n').filter(Boolean).map((feat, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 * s, marginBottom: 4 * s }}>
            <span style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: P.accent, flexShrink: 0, lineHeight: 1.8 }}>✦</span>
            <span style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: P.muted, lineHeight: 1.8 }}>{feat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TableOfContents({ f, s, W, H }) {
  const P = PALETTES.ivory;
  const entries = (f.entries || '06|The Wedding Dress\n14|Jewellery Stories\n22|Venues of the Season\n34|Real Wedding: Isabella\n44|The Bridal Beauty Edit\n52|Destination: Tuscany')
    .split('\n')
    .map(line => {
      const [page, ...rest] = line.split('|');
      return { page: (page || '').trim(), title: (rest.join('|') || '').trim() };
    })
    .filter(e => e.page || e.title);

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg, padding: `${36 * s}px`, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      {/* Issue label */}
      <div style={{ fontFamily: FONTS.caption, fontSize: 9 * s, color: P.accent, letterSpacing: '0.25em', textTransform: 'uppercase', textAlign: 'center', marginBottom: 4 * s }}>
        {f.issueLabel || 'I S S U E  0 1'}
      </div>

      {/* Contents heading */}
      <div style={{ fontFamily: FONTS.display, fontSize: 40 * s, fontWeight: 400, color: P.text, lineHeight: 1, marginBottom: 4 * s }}>
        Contents
      </div>

      {/* Rule */}
      <div style={{ width: '100%', height: 1, background: P.rule, marginBottom: 20 * s }} />

      {/* Subtitle */}
      {f.subtitle && (
        <div style={{ fontFamily: FONTS.editorial, fontSize: 13 * s, fontStyle: 'italic', color: P.muted, marginBottom: 18 * s }}>
          {f.subtitle}
        </div>
      )}

      {/* Entries */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {entries.map((e, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', borderBottom: `1px solid rgba(184,146,106,0.2)`, paddingBottom: 8 * s, marginBottom: 8 * s }}>
            <div style={{ fontFamily: FONTS.display, fontSize: 22 * s, color: P.accent, fontWeight: 400, minWidth: 44 * s, lineHeight: 1 }}>
              {e.page}
            </div>
            <div style={{ fontFamily: FONTS.editorial, fontSize: 13 * s, fontStyle: 'italic', color: P.text, flex: 1, lineHeight: 1.3 }}>
              {e.title}
            </div>
          </div>
        ))}
      </div>

      {/* LWD mark */}
      <div style={{ textAlign: 'center', fontFamily: FONTS.caption, fontSize: 7 * s, color: P.muted, letterSpacing: '0.12em', marginTop: 8 * s }}>
        LWD
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function TemplateCanvas({ templateId, fields = {}, pageSize = 'A4', width = 400, forCapture = false }) {
  const ratio  = PAGE_RATIOS[pageSize] || 1.4142;
  const height = Math.round(width * ratio);
  const s      = width / 400;
  const f      = fields;

  const container = {
    width,
    height,
    position: 'relative',
    overflow: 'hidden',
    flexShrink: 0,
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  };

  function renderTemplate() {
    const props = { f, s, W: width, H: height };
    switch (templateId) {
      case 'vogue-cover':        return <VogueCover        {...props} />;
      case 'the-gown':           return <TheGown           {...props} />;
      case 'the-jewel':          return <TheJewel          {...props} />;
      case 'feature-spread':     return <FeatureSpread     {...props} />;
      case 'the-runway':         return <TheRunway         {...props} />;
      case 'the-destination':    return <TheDestination    {...props} />;
      case 'the-portrait':       return <ThePortrait       {...props} />;
      case 'the-triptych':       return <TheTriptych       {...props} />;
      case 'pull-quote':         return <PullQuote         {...props} />;
      case 'product-page':       return <ProductPage       {...props} />;
      case 'the-hotel':          return <TheHotel          {...props} />;
      case 'table-of-contents':  return <TableOfContents   {...props} />;
      default:
        return (
          <div style={{ ...container, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'sans-serif', fontSize: 14 * s }}>
            Template not found
          </div>
        );
    }
  }

  return (
    <div style={container} data-template-canvas="true">
      <style>{`@import url('${GOOGLE_FONTS_URL}');`}</style>
      {renderTemplate()}
    </div>
  );
}
