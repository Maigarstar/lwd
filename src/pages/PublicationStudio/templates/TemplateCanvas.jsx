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

// ── Dummy images for new templates (Unsplash – free license) ─────────────────
const D = {
  // Bridal & couple
  bridalPortrait: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80&auto=format&fit=crop',
  bridalDetail:   'https://images.unsplash.com/photo-1525328437458-0c4d4db7cabf?w=1200&q=80&auto=format&fit=crop',
  coupleWalk:     'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=80&auto=format&fit=crop',
  bridalPrep:     'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=1200&q=80&auto=format&fit=crop',
  bridalReady:    'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200&q=80&auto=format&fit=crop',
  couplePortrait: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1200&q=80&auto=format&fit=crop',
  // Venue & landscape
  villa:          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80&auto=format&fit=crop',
  tuscany:        'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1200&q=80&auto=format&fit=crop',
  tablescape:     'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=1200&q=80&auto=format&fit=crop',
  // Fashion & editorial
  editorial:      'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1200&q=80&auto=format&fit=crop',
  gownDetail:     'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=80&auto=format&fit=crop',
  // Florals & details
  bouquet:        'https://images.unsplash.com/photo-1490750967868-88df5691a4b7?w=1200&q=80&auto=format&fit=crop',
  // Travel
  maldives:       'https://images.unsplash.com/photo-1439066290691-debb4d677510?w=1200&q=80&auto=format&fit=crop',
  mediterranean:  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80&auto=format&fit=crop',
};

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

// ── Templates 13–32 ─────────────────────────────────────────────────────────

function TheMasthead({ f, s, palette, W, H }) {
  const P = PALETTES.ivory;
  const credits = [
    { label: 'Editor in Chief',     value: f.editor },
    { label: 'Creative Director',   value: f.creative_director },
    { label: 'Photography',         value: f.photographer },
    { label: 'Fashion & Styling',   value: f.stylist },
    { label: 'Florals',             value: f.florist },
    { label: 'Venue',               value: f.venue_credit },
  ].filter(c => c.value);

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg, display: 'flex', flexDirection: 'column', padding: `${40 * s}px ${36 * s}px`, boxSizing: 'border-box' }}>
      {/* Top: logo or publication name */}
      <div style={{ textAlign: 'center', marginBottom: 6 * s }}>
        {f.logo_url
          ? <img src={f.logo_url} alt="" style={{ maxHeight: 40 * s, maxWidth: '60%', objectFit: 'contain', display: 'inline-block' }} />
          : <div style={{ fontFamily: FONTS.display, fontSize: 22 * s, fontWeight: 700, letterSpacing: '0.25em', color: P.text, textTransform: 'uppercase' }}>{f.publication || 'LUXURY WEDDING DIRECTORY'}</div>
        }
      </div>

      {/* Issue line */}
      <div style={{ textAlign: 'center', fontFamily: FONTS.caption, fontSize: 8 * s, color: P.accent, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 24 * s }}>
        {f.issue_line || 'Issue No. 01 · Spring 2026'}
      </div>

      {/* Full-width rule */}
      <div style={{ width: '100%', height: 1, background: P.rule, marginBottom: 24 * s }} />

      {/* Credits grid */}
      <div style={{ columns: 2, columnGap: 24 * s, flex: 1 }}>
        {credits.map((c, i) => (
          <div key={i} style={{ breakInside: 'avoid', marginBottom: 14 * s }}>
            <div style={{ fontFamily: FONTS.caption, fontSize: 7 * s, color: P.muted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2 * s }}>{c.label}</div>
            <div style={{ fontFamily: FONTS.editorial, fontSize: 12 * s, fontStyle: 'italic', color: P.text }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Bottom rule + tagline */}
      <div style={{ width: '100%', height: 1, background: P.rule, marginTop: 'auto', marginBottom: 14 * s }} />
      <div style={{ fontFamily: FONTS.editorial, fontSize: 11 * s, fontStyle: 'italic', color: P.muted, textAlign: 'center' }}>
        {f.tagline || 'Exceptional Weddings for Discerning Couples'}
      </div>
    </div>
  );
}

function FloralSpread({ f, s, palette, W, H }) {
  const P = PALETTES.blush;
  const accent = f.accent_color || P.accent;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg }}>
      {/* Full-bleed image */}
      {f.image
        ? <img src={f.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #e8d8d0 0%, #d4bdb2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 36 * s, opacity: 0.18, color: P.text, fontFamily: 'sans-serif' }}>⊡</span>
          </div>
      }
      {/* Gradient overlay bottom */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: `linear-gradient(to top, ${P.bg}dd 0%, transparent 100%)` }} />

      {/* Text block bottom-left */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: `0 ${22 * s}px ${20 * s}px` }}>
        <div style={{ width: 28 * s, height: 2, background: accent, marginBottom: 10 * s }} />
        <div style={{ fontFamily: FONTS.editorial, fontSize: 34 * s, fontStyle: 'italic', fontWeight: 300, color: P.text, lineHeight: 1.08, marginBottom: 8 * s }}>
          {f.headline || 'In Full Bloom'}
        </div>
        {f.florist_name && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: P.text, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7, marginBottom: 6 * s }}>
            Florals: {f.florist_name}
          </div>
        )}
        {f.description && (
          <div style={{ fontFamily: FONTS.body, fontSize: 9 * s, color: P.muted, lineHeight: 1.6, maxWidth: '70%' }}>
            {f.description}
          </div>
        )}
      </div>
    </div>
  );
}

function ReceptionTable({ f, s, palette, W, H }) {
  const P = PALETTES.ivory;
  const imgW = W * 0.58;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg }}>
      {/* Left image panel */}
      {f.image
        ? <img src={f.image} alt="" style={{ position: 'absolute', left: 0, top: 0, width: imgW, height: '100%', objectFit: 'cover' }} />
        : <div style={{ position: 'absolute', left: 0, top: 0, width: imgW, height: '100%', background: '#E4DDD2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 28 * s, opacity: 0.18, color: P.text, fontFamily: 'sans-serif' }}>⊡</span>
          </div>
      }

      {/* Right text panel */}
      <div style={{ position: 'absolute', left: imgW, top: 0, right: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `${20 * s}px ${18 * s}px`, boxSizing: 'border-box' }}>
        <div style={{ fontFamily: FONTS.caption, fontSize: 7 * s, color: P.accent, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10 * s }}>The Table</div>
        <div style={{ fontFamily: FONTS.editorial, fontSize: 20 * s, fontStyle: 'italic', color: P.text, lineHeight: 1.2, marginBottom: 14 * s }}>
          {f.headline || 'Dressed to Perfection'}
        </div>
        <div style={{ width: 24 * s, height: 1, background: P.accent, marginBottom: 14 * s }} />
        {f.venue && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: P.muted, letterSpacing: '0.08em', marginBottom: 5 * s }}>
            <span style={{ color: P.accent }}>Venue</span> — {f.venue}
          </div>
        )}
        {f.stylist && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: P.muted, letterSpacing: '0.08em', marginBottom: 10 * s }}>
            <span style={{ color: P.accent }}>Styling</span> — {f.stylist}
          </div>
        )}
        {f.caption && (
          <div style={{ fontFamily: FONTS.body, fontSize: 9 * s, color: P.muted, lineHeight: 1.6, marginBottom: 12 * s }}>
            {f.caption}
          </div>
        )}
        {f.palette_note && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 7 * s, color: P.accent, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 'auto' }}>
            {f.palette_note}
          </div>
        )}
      </div>
    </div>
  );
}

function CeremonyAisle({ f, s, palette, W, H }) {
  const P = PALETTES.white;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: '#fff' }}>
      {/* Image: top 65% */}
      {f.image
        ? <img src={f.image} alt="" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '65%', width: '100%', objectFit: 'cover' }} />
        : <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '65%', background: '#f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 32 * s, opacity: 0.15, color: '#555', fontFamily: 'sans-serif' }}>⊡</span>
          </div>
      }

      {/* Thin gold rule at 65% */}
      <div style={{ position: 'absolute', top: '65%', left: 0, right: 0, height: 1, background: '#C9A84C', opacity: 0.5 }} />

      {/* Bottom text block */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%', padding: `${16 * s}px ${22 * s}px`, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {f.venue && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 7 * s, color: '#888', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 * s }}>{f.venue}</div>
        )}
        <div style={{ fontFamily: FONTS.editorial, fontSize: 26 * s, fontStyle: 'italic', fontWeight: 300, color: '#111', lineHeight: 1.12, marginBottom: 6 * s }}>
          {f.headline || 'The Walk to Forever'}
        </div>
        {f.subhead && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: '#555', letterSpacing: '0.1em', marginBottom: 8 * s }}>{f.subhead}</div>
        )}
        {f.story && (
          <div style={{ fontFamily: FONTS.body, fontSize: 9 * s, color: '#555', lineHeight: 1.6, marginBottom: 6 * s }}>{f.story}</div>
        )}
        {f.photographer && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 7 * s, color: '#aaa', letterSpacing: '0.06em', marginTop: 'auto' }}>Photography: {f.photographer}</div>
        )}
      </div>
    </div>
  );
}

function CoupleStory({ f, s, palette, W, H }) {
  const P = PALETTES.midnight;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg }}>
      {/* Full-bleed image */}
      {f.image
        ? <img src={f.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #1a2840 0%, #0b1525 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 36 * s, opacity: 0.15, color: '#fff', fontFamily: 'sans-serif' }}>⊡</span>
          </div>
      }
      {/* Overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,21,37,0.88) 0%, rgba(11,21,37,0.15) 55%)' }} />

      {/* Bottom content */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: `0 ${22 * s}px ${24 * s}px` }}>
        <div style={{ width: 32 * s, height: 1, background: P.accent, marginBottom: 14 * s, opacity: 0.7 }} />
        <div style={{ fontFamily: FONTS.editorial, fontSize: 30 * s, fontStyle: 'italic', fontWeight: 300, color: P.text, lineHeight: 1.1, marginBottom: 8 * s }}>
          {f.couple_names || 'Sophia & James'}
        </div>
        {(f.date || f.location) && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: P.accent, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 * s }}>
            {[f.date, f.location].filter(Boolean).join(' · ')}
          </div>
        )}
        {f.story && (
          <div style={{ fontFamily: FONTS.body, fontSize: 9 * s, color: P.muted, lineHeight: 1.65, maxWidth: '85%' }}>
            {f.story}
          </div>
        )}
        {f.photographer && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 7 * s, color: P.muted, letterSpacing: '0.06em', marginTop: 10 * s, opacity: 0.6 }}>
            Photography: {f.photographer}
          </div>
        )}
      </div>
    </div>
  );
}

function BeautyEdit({ f, s, palette, W, H }) {
  const P = PALETTES.blush;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg }}>
      {/* Image: right 55%, full height */}
      {f.image
        ? <img src={f.image} alt="" style={{ position: 'absolute', right: 0, top: 0, width: '55%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
        : <div style={{ position: 'absolute', right: 0, top: 0, width: '55%', height: '100%', background: '#e8d0c8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 28 * s, opacity: 0.18, color: P.text, fontFamily: 'sans-serif' }}>⊡</span>
          </div>
      }

      {/* Left text panel */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: '45%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `${20 * s}px ${18 * s}px`, boxSizing: 'border-box' }}>
        <div style={{ fontFamily: FONTS.caption, fontSize: 7 * s, color: P.accent, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10 * s }}>Beauty</div>
        <div style={{ fontFamily: FONTS.editorial, fontSize: 18 * s, fontStyle: 'italic', color: P.text, lineHeight: 1.2, marginBottom: 14 * s }}>
          {f.headline || 'The Art of Bridal Beauty'}
        </div>
        <div style={{ width: 20 * s, height: 1, background: P.accent, marginBottom: 14 * s }} />
        {f.makeup_artist && (
          <div style={{ marginBottom: 7 * s }}>
            <div style={{ fontFamily: FONTS.caption, fontSize: 7 * s, color: P.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Makeup</div>
            <div style={{ fontFamily: FONTS.editorial, fontSize: 11 * s, fontStyle: 'italic', color: P.text }}>{f.makeup_artist}</div>
          </div>
        )}
        {f.hair_stylist && (
          <div style={{ marginBottom: 7 * s }}>
            <div style={{ fontFamily: FONTS.caption, fontSize: 7 * s, color: P.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Hair</div>
            <div style={{ fontFamily: FONTS.editorial, fontSize: 11 * s, fontStyle: 'italic', color: P.text }}>{f.hair_stylist}</div>
          </div>
        )}
        {f.products && (
          <div style={{ fontFamily: FONTS.body, fontSize: 8.5 * s, color: P.muted, lineHeight: 1.6, marginTop: 8 * s }}>{f.products}</div>
        )}
        {f.model && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 7 * s, color: P.muted, letterSpacing: '0.06em', marginTop: 'auto', opacity: 0.7 }}>Model: {f.model}</div>
        )}
      </div>
    </div>
  );
}

function DressDetail({ f, s, palette, W, H }) {
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Image: top 72% */}
      {f.image
        ? <img src={f.image} alt="" style={{ width: '100%', height: '72%', objectFit: 'cover', flexShrink: 0 }} />
        : <div style={{ width: '100%', height: '72%', background: '#f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 32 * s, opacity: 0.15, color: '#555', fontFamily: 'sans-serif' }}>⊡</span>
          </div>
      }

      {/* Text block */}
      <div style={{ flex: 1, padding: `${12 * s}px ${18 * s}px`, display: 'flex', flexDirection: 'column', justifyContent: 'center', borderTop: '1px solid rgba(0,0,0,0.07)' }}>
        <div style={{ fontFamily: FONTS.display, fontSize: 14 * s, fontWeight: 700, letterSpacing: '0.15em', color: '#111', textTransform: 'uppercase', marginBottom: 4 * s }}>
          {f.designer || 'The Designer'}
        </div>
        {f.collection && (
          <div style={{ fontFamily: FONTS.editorial, fontSize: 11 * s, fontStyle: 'italic', color: '#555', marginBottom: 4 * s }}>{f.collection}</div>
        )}
        {f.detail_note && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: '#888', letterSpacing: '0.06em', marginBottom: 4 * s }}>{f.detail_note}</div>
        )}
        <div style={{ display: 'flex', gap: 16 * s, marginTop: 4 * s }}>
          {f.price && <div style={{ fontFamily: FONTS.subhead, fontSize: 12 * s, color: '#111' }}>{f.price}</div>}
          {f.stockist && <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: '#888', letterSpacing: '0.06em', alignSelf: 'center' }}>{f.stockist}</div>}
        </div>
      </div>
    </div>
  );
}

function InvitationSuite({ f, s, palette, W, H }) {
  const P = PALETTES.ivory;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg }}>
      {/* Full-bleed image */}
      {f.image
        ? <img src={f.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ position: 'absolute', inset: 0, background: '#e8e2d8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 32 * s, opacity: 0.18, color: P.text, fontFamily: 'sans-serif' }}>⊡</span>
          </div>
      }
      {/* Overlay — bottom third */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '38%', background: `linear-gradient(to top, ${P.bg} 0%, transparent 100%)` }} />

      {/* Text block */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: `0 ${22 * s}px ${18 * s}px` }}>
        <div style={{ fontFamily: FONTS.caption, fontSize: 7 * s, color: P.accent, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 * s }}>Stationery</div>
        <div style={{ fontFamily: FONTS.editorial, fontSize: 22 * s, fontStyle: 'italic', color: P.text, lineHeight: 1.15, marginBottom: 8 * s }}>
          {f.headline || 'The Perfect First Impression'}
        </div>
        {f.designer && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: P.muted, letterSpacing: '0.08em', marginBottom: 4 * s }}>
            <span style={{ color: P.accent }}>Design</span> — {f.designer}
          </div>
        )}
        {f.paper_stock && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: P.muted, letterSpacing: '0.06em', marginBottom: 6 * s }}>{f.paper_stock}</div>
        )}
        {f.price_guide && (
          <div style={{ fontFamily: FONTS.display, fontSize: 11 * s, color: P.accent, marginTop: 6 * s }}>{f.price_guide}</div>
        )}
      </div>
    </div>
  );
}

function CakeMoment({ f, s, palette, W, H }) {
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: '#fff' }}>
      {/* Image: full bleed */}
      {f.image
        ? <img src={f.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ position: 'absolute', inset: 0, background: '#f5f2ec', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 32 * s, opacity: 0.15, color: '#555', fontFamily: 'sans-serif' }}>⊡</span>
          </div>
      }
      {/* Bottom overlay */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(to top, rgba(255,255,255,0.95) 0%, transparent 100%)' }} />

      {/* Text */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: `0 ${22 * s}px ${18 * s}px` }}>
        <div style={{ fontFamily: FONTS.display, fontSize: 24 * s, fontWeight: 400, color: '#111', letterSpacing: '0.08em', lineHeight: 1.1, marginBottom: 6 * s }}>
          {f.headline || 'The Sweet Finale'}
        </div>
        {f.cake_designer && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 * s }}>{f.cake_designer}</div>
        )}
        {f.flavour && (
          <div style={{ fontFamily: FONTS.editorial, fontSize: 10 * s, fontStyle: 'italic', color: '#555', marginBottom: 4 * s }}>{f.flavour}</div>
        )}
        {f.caption && (
          <div style={{ fontFamily: FONTS.body, fontSize: 9 * s, color: '#888', lineHeight: 1.5 }}>{f.caption}</div>
        )}
      </div>
    </div>
  );
}

function VenuePortrait({ f, s, palette, W, H }) {
  const P = PALETTES.obsidian;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg }}>
      {/* Full-bleed image */}
      {f.image
        ? <img src={f.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #1a1208 0%, #080806 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 36 * s, opacity: 0.15, color: '#fff', fontFamily: 'sans-serif' }}>⊡</span>
          </div>
      }
      {/* Gradient */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.08) 55%)' }} />

      {/* Bottom text */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: `0 ${22 * s}px ${22 * s}px` }}>
        <div style={{ fontFamily: FONTS.caption, fontSize: 7 * s, color: P.accent, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 * s }}>
          {[f.location, f.style].filter(Boolean).join(' · ')}
        </div>
        <div style={{ fontFamily: FONTS.editorial, fontSize: 28 * s, fontStyle: 'italic', fontWeight: 300, color: '#fff', lineHeight: 1.1, marginBottom: 4 * s }}>
          {f.headline || 'Where Dreams Take Shape'}
        </div>
        <div style={{ fontFamily: FONTS.display, fontSize: 14 * s, fontWeight: 700, letterSpacing: '0.1em', color: P.text, textTransform: 'uppercase', marginBottom: 8 * s }}>
          {f.venue_name || 'THE VENUE'}
        </div>
        {f.capacity && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 7 * s, color: P.muted, letterSpacing: '0.08em', marginBottom: 8 * s }}>{f.capacity}</div>
        )}
        {f.body && (
          <div style={{ fontFamily: FONTS.body, fontSize: 9 * s, color: P.muted, lineHeight: 1.6, maxWidth: '80%' }}>{f.body}</div>
        )}
      </div>
    </div>
  );
}

function FashionPlate({ f, s, palette, W, H }) {
  const P = PALETTES.midnight;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg }}>
      {/* Full-bleed image */}
      {f.image
        ? <img src={f.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
        : <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #1a2840 0%, #0b1525 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 36 * s, opacity: 0.15, color: '#fff', fontFamily: 'sans-serif' }}>⊡</span>
          </div>
      }
      {/* Dark vignette bottom */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', background: `linear-gradient(to top, rgba(11,21,37,0.9) 0%, transparent 100%)` }} />

      {/* Look label top-left */}
      <div style={{ position: 'absolute', top: 18 * s, left: 18 * s }}>
        <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: P.accent, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          {f.look_title || 'Look I'}
        </div>
      </div>

      {/* Credits bottom */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: `0 ${18 * s}px ${18 * s}px` }}>
        <div style={{ fontFamily: FONTS.display, fontSize: 18 * s, fontWeight: 700, letterSpacing: '0.12em', color: '#fff', textTransform: 'uppercase', marginBottom: 6 * s }}>
          {f.dress || 'THE GOWN'}
        </div>
        {[f.shoes, f.jewellery].filter(Boolean).map((item, i) => (
          <div key={i} style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: P.muted, letterSpacing: '0.08em', marginBottom: 3 * s }}>{item}</div>
        ))}
        {f.photographer && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 7 * s, color: P.muted, letterSpacing: '0.06em', marginTop: 8 * s, opacity: 0.55 }}>Photography: {f.photographer}</div>
        )}
      </div>
    </div>
  );
}

function HoneymoonEdit({ f, s, palette, W, H }) {
  const P = PALETTES.claret;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg }}>
      {/* Image: top 62% */}
      {f.image
        ? <img src={f.image} alt="" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '62%', width: '100%', objectFit: 'cover' }} />
        : <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '62%', background: '#2e0e1c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 32 * s, opacity: 0.15, color: '#fff', fontFamily: 'sans-serif' }}>⊡</span>
          </div>
      }
      {/* Gradient bleed */}
      <div style={{ position: 'absolute', top: '48%', left: 0, right: 0, height: '20%', background: `linear-gradient(to bottom, transparent 0%, ${P.bg} 100%)` }} />

      {/* Bottom text block */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', padding: `${12 * s}px ${22 * s}px`, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontFamily: FONTS.display, fontSize: 20 * s, fontWeight: 400, letterSpacing: '0.15em', color: P.accent, textTransform: 'uppercase', marginBottom: 6 * s }}>
          {f.destination || 'The Maldives'}
        </div>
        {f.property && (
          <div style={{ fontFamily: FONTS.editorial, fontSize: 12 * s, fontStyle: 'italic', color: P.muted, marginBottom: 6 * s }}>{f.property}</div>
        )}
        <div style={{ fontFamily: FONTS.editorial, fontSize: 18 * s, fontStyle: 'italic', color: P.text, lineHeight: 1.2, marginBottom: 8 * s }}>
          {f.headline || 'For Two, With Love'}
        </div>
        {f.intro && (
          <div style={{ fontFamily: FONTS.body, fontSize: 9 * s, color: P.muted, lineHeight: 1.6, marginBottom: 6 * s }}>{f.intro}</div>
        )}
        {(f.price_guide || f.website) && (
          <div style={{ display: 'flex', gap: 16 * s, marginTop: 'auto' }}>
            {f.price_guide && <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: P.accent, letterSpacing: '0.08em' }}>{f.price_guide}</div>}
            {f.website && <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: P.muted, letterSpacing: '0.06em' }}>{f.website}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

function RingEdit({ f, s, palette, W, H }) {
  const P = PALETTES.obsidian;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `${32 * s}px` }}>
      {/* Radial glow */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.06) 0%, transparent 70%)' }} />

      {/* Image */}
      <div style={{ width: '60%', height: H * 0.42, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 * s }}>
        {f.image
          ? <img src={f.image} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          : <div style={{ width: '100%', height: '100%', border: '1px dashed rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 28 * s, opacity: 0.15, color: '#fff', fontFamily: 'sans-serif' }}>⊡</span>
            </div>
        }
      </div>

      {/* Decorative mark */}
      <div style={{ fontFamily: FONTS.editorial, fontSize: 12 * s, color: P.accent, opacity: 0.5, marginBottom: 10 * s }}>◈</div>

      {/* Headline */}
      <div style={{ fontFamily: FONTS.editorial, fontSize: 18 * s, fontStyle: 'italic', color: P.text, textAlign: 'center', lineHeight: 1.2, marginBottom: 8 * s }}>
        {f.headline || 'The Stone That Starts It All'}
      </div>

      {/* Rule */}
      <div style={{ width: 36 * s, height: 1, background: P.accent, opacity: 0.5, marginBottom: 12 * s }} />

      {/* Designer */}
      <div style={{ fontFamily: FONTS.caption, fontSize: 10 * s, color: P.accent, letterSpacing: '0.14em', textTransform: 'uppercase', textAlign: 'center', marginBottom: 6 * s }}>
        {f.designer || 'THE ATELIER'}
      </div>

      {/* Specs */}
      {(f.metal || f.stone) && (
        <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: P.muted, letterSpacing: '0.08em', textAlign: 'center', lineHeight: 1.7, marginBottom: 6 * s }}>
          {[f.metal, f.stone].filter(Boolean).join('\n')}
        </div>
      )}

      {/* Price */}
      {f.price && (
        <div style={{ fontFamily: FONTS.display, fontSize: 14 * s, color: P.text, marginTop: 6 * s, textAlign: 'center' }}>{f.price}</div>
      )}

      {/* Caption */}
      {f.caption && (
        <div style={{ fontFamily: FONTS.body, fontSize: 8.5 * s, color: P.muted, fontStyle: 'italic', textAlign: 'center', lineHeight: 1.6, marginTop: 10 * s, maxWidth: '80%' }}>{f.caption}</div>
      )}
    </div>
  );
}

function TheInterview({ f, s, palette, W, H }) {
  const P = PALETTES.ivory;
  const imgW = W * 0.38;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg, display: 'flex' }}>
      {/* Left image */}
      <div style={{ width: imgW, flexShrink: 0, position: 'relative' }}>
        {f.image
          ? <img src={f.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }} />
          : <div style={{ width: '100%', height: '100%', background: '#E4DDD2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 24 * s, opacity: 0.2, color: P.text, fontFamily: 'sans-serif' }}>⊡</span>
            </div>
        }
      </div>

      {/* Thin rule */}
      <div style={{ width: 1, background: P.rule, flexShrink: 0 }} />

      {/* Right text panel */}
      <div style={{ flex: 1, overflow: 'hidden', padding: `${22 * s}px ${18 * s}px`, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontFamily: FONTS.caption, fontSize: 7 * s, color: P.accent, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 * s }}>Interview</div>
        <div style={{ fontFamily: FONTS.editorial, fontSize: 18 * s, fontStyle: 'italic', color: P.text, marginBottom: 2 * s }}>{f.subject_name || 'The Subject'}</div>
        {f.subject_title && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: P.muted, letterSpacing: '0.08em', marginBottom: 12 * s }}>{f.subject_title}</div>
        )}
        <div style={{ width: '100%', height: 1, background: P.rule, marginBottom: 12 * s }} />

        {f.question_1 && (
          <div style={{ marginBottom: 10 * s }}>
            <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, fontWeight: 700, color: P.text, letterSpacing: '0.04em', marginBottom: 3 * s }}>{f.question_1}</div>
            {f.answer_1 && <div style={{ fontFamily: FONTS.body, fontSize: 9 * s, color: P.muted, lineHeight: 1.6 }}>{f.answer_1}</div>}
          </div>
        )}
        {f.question_2 && (
          <div style={{ marginBottom: 12 * s }}>
            <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, fontWeight: 700, color: P.text, letterSpacing: '0.04em', marginBottom: 3 * s }}>{f.question_2}</div>
            {f.answer_2 && <div style={{ fontFamily: FONTS.body, fontSize: 9 * s, color: P.muted, lineHeight: 1.6 }}>{f.answer_2}</div>}
          </div>
        )}

        {/* Pull quote */}
        {f.pull_quote && (
          <div style={{ marginTop: 'auto', background: 'rgba(184,146,106,0.08)', borderLeft: `2px solid ${P.accent}`, padding: `${8 * s}px ${10 * s}px` }}>
            <div style={{ fontFamily: FONTS.editorial, fontSize: 11 * s, fontStyle: 'italic', color: P.text, lineHeight: 1.5 }}>"{f.pull_quote}"</div>
          </div>
        )}
      </div>
    </div>
  );
}

function DressFlatLay({ f, s, palette, W, H }) {
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: '#fff' }}>
      {/* Image: top 68% */}
      {f.image
        ? <img src={f.image} alt="" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '68%', width: '100%', objectFit: 'cover' }} />
        : <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '68%', background: '#f5f2ec', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 32 * s, opacity: 0.15, color: '#555', fontFamily: 'sans-serif' }}>⊡</span>
          </div>
      }
      <div style={{ position: 'absolute', top: '68%', left: 0, right: 0, height: 1, background: 'rgba(0,0,0,0.08)' }} />

      {/* Credits grid — bottom 32% */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '32%', padding: `${10 * s}px ${18 * s}px`, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontFamily: FONTS.display, fontSize: 13 * s, fontWeight: 700, letterSpacing: '0.12em', color: '#111', textTransform: 'uppercase', marginBottom: 6 * s }}>
          {f.headline || 'The Complete Look'}
        </div>
        <div style={{ columns: 2, columnGap: 16 * s }}>
          {[['Gown', f.gown], ['Veil', f.veil], ['Shoes', f.shoes], ['Jewellery', f.jewellery], ['Bouquet', f.bouquet]].filter(([, v]) => v).map(([label, value], i) => (
            <div key={i} style={{ breakInside: 'avoid', marginBottom: 5 * s, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: '"Josefin Sans", sans-serif', fontSize: 7 * s, color: '#aaa', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
              <span style={{ fontFamily: '"Libre Baskerville", Georgia, serif', fontSize: 8.5 * s, color: '#333', fontStyle: 'italic' }}>{value}</span>
            </div>
          ))}
        </div>
        {f.photographer && (
          <div style={{ fontFamily: '"Josefin Sans", sans-serif', fontSize: 7 * s, color: '#aaa', letterSpacing: '0.06em', marginTop: 'auto' }}>Photography: {f.photographer}</div>
        )}
      </div>
    </div>
  );
}

function AerialVenue({ f, s, palette, W, H }) {
  const P = PALETTES.midnight;
  const posMap = { 'top-left': { top: 20 * s, left: 20 * s }, 'top-right': { top: 20 * s, right: 20 * s }, 'bottom-left': { bottom: 24 * s, left: 20 * s }, 'bottom-right': { bottom: 24 * s, right: 20 * s }, 'center': { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' } };
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg }}>
      {/* Full-bleed aerial image */}
      {f.image
        ? <img src={f.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0b1525 0%, #1a2840 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 36 * s, opacity: 0.15, color: '#fff', fontFamily: 'sans-serif' }}>⊡</span>
          </div>
      }
      {/* Subtle dark overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)' }} />

      {/* Text overlay — bottom left by default */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: `0 ${20 * s}px ${20 * s}px` }}>
        <div style={{ fontFamily: FONTS.editorial, fontSize: 32 * s, fontStyle: 'italic', fontWeight: 300, color: '#fff', lineHeight: 1.1, marginBottom: 6 * s }}>
          {f.headline || 'From Above'}
        </div>
        <div style={{ fontFamily: FONTS.caption, fontSize: 9 * s, color: P.accent, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 * s }}>
          {f.location}
        </div>
        {f.subline && (
          <div style={{ fontFamily: FONTS.editorial, fontSize: 10 * s, fontStyle: 'italic', color: P.muted }}>{f.subline}</div>
        )}
        {f.photographer && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 7 * s, color: P.muted, opacity: 0.6, marginTop: 8 * s, letterSpacing: '0.06em' }}>Aerial photography: {f.photographer}</div>
        )}
      </div>
    </div>
  );
}

function LuxGrid({ f, s, palette, W, H }) {
  const P = PALETTES.obsidian;
  const images = [f.image1, f.image2, f.image3, f.image4, f.image5, f.image6];
  const gridH = H * 0.78;
  const cellW = (W - 4) / 3;
  const cellH = (gridH - 2) / 2;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg, display: 'flex', flexDirection: 'column' }}>
      {/* 2×3 grid */}
      <div style={{ width: W, height: gridH, display: 'grid', gridTemplateColumns: `repeat(3, ${cellW}px)`, gridTemplateRows: `repeat(2, ${cellH}px)`, gap: 2, flexShrink: 0 }}>
        {images.map((img, i) => (
          img
            ? <img key={i} src={img} alt="" style={{ width: cellW, height: cellH, objectFit: 'cover', display: 'block' }} />
            : <div key={i} style={{ width: cellW, height: cellH, background: i % 2 === 0 ? '#141210' : '#1a1712', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 16 * s, opacity: 0.12, color: '#fff', fontFamily: 'sans-serif' }}>⊡</span>
              </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `${6 * s}px ${18 * s}px` }}>
        <div style={{ width: 28 * s, height: 1, background: P.accent, opacity: 0.5, marginBottom: 8 * s }} />
        <div style={{ fontFamily: FONTS.display, fontSize: 15 * s, fontWeight: 400, letterSpacing: '0.2em', color: P.text, textTransform: 'uppercase', textAlign: 'center', marginBottom: 4 * s }}>
          {f.headline || 'The Edit'}
        </div>
        {f.caption && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: P.muted, letterSpacing: '0.08em', textAlign: 'center' }}>{f.caption}</div>
        )}
        <div style={{ fontFamily: FONTS.caption, fontSize: 7 * s, color: P.muted, opacity: 0.4, letterSpacing: '0.12em', marginTop: 6 * s }}>LWD</div>
      </div>
    </div>
  );
}

function FullBleed({ f, s, palette, W, H }) {
  const pos = f.position || 'bottom-left';
  const posStyle = {
    'top-left':     { top: 22 * s, left: 22 * s },
    'top-right':    { top: 22 * s, right: 22 * s, textAlign: 'right' },
    'bottom-left':  { bottom: 22 * s, left: 22 * s },
    'bottom-right': { bottom: 22 * s, right: 22 * s, textAlign: 'right' },
    'center':       { top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' },
  }[pos] || { bottom: 22 * s, left: 22 * s };

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: '#000' }}>
      {f.image
        ? <img src={f.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #1a1208 0%, #080806 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 40 * s, opacity: 0.12, color: '#fff', fontFamily: 'sans-serif' }}>⊡</span>
          </div>
      }

      {/* Overlay */}
      {f.text_overlay && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)' }} />}

      {/* Text */}
      {f.text_overlay && (
        <div style={{ position: 'absolute', ...posStyle }}>
          <div style={{ fontFamily: FONTS.editorial, fontSize: 24 * s, fontStyle: 'italic', fontWeight: 300, color: '#fff', lineHeight: 1.15, textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
            {f.text_overlay}
          </div>
        </div>
      )}

      {/* Credit */}
      {f.credit && (
        <div style={{ position: 'absolute', bottom: 8 * s, right: 12 * s, fontFamily: FONTS.caption, fontSize: 7 * s, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}>
          {f.credit}
        </div>
      )}
    </div>
  );
}

function VenueDirectory({ f, s, palette, W, H }) {
  const P = PALETTES.ivory;
  const venues = [
    { name: f.venue1_name, location: f.venue1_location, image: f.venue1_image, desc: f.venue1_desc },
    { name: f.venue2_name, location: f.venue2_location, image: f.venue2_image, desc: f.venue2_desc },
    { name: f.venue3_name, location: f.venue3_location, image: f.venue3_image, desc: f.venue3_desc },
  ].filter(v => v.name);
  const imgH = H * 0.24;

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg, padding: `${22 * s}px ${20 * s}px`, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: P.accent, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 4 * s }}>Venues</div>
      <div style={{ fontFamily: FONTS.editorial, fontSize: 22 * s, fontStyle: 'italic', color: P.text, marginBottom: 8 * s }}>
        {f.section_title || 'Venues of Distinction'}
      </div>
      <div style={{ width: '100%', height: 1, background: P.rule, marginBottom: 14 * s }} />

      {/* Venue rows */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 * s, overflow: 'hidden' }}>
        {venues.map((v, i) => (
          <div key={i} style={{ display: 'flex', gap: 10 * s, alignItems: 'flex-start', overflow: 'hidden' }}>
            <div style={{ width: W * 0.28, height: imgH, flexShrink: 0, borderRadius: 1 }}>
              {v.image
                ? <img src={v.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <div style={{ width: '100%', height: '100%', background: '#E4DDD2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 14 * s, opacity: 0.2, color: P.text, fontFamily: 'sans-serif' }}>⊡</span>
                  </div>
              }
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontFamily: FONTS.subhead, fontSize: 11 * s, fontWeight: 700, color: P.text, lineHeight: 1.2, marginBottom: 2 * s }}>{v.name}</div>
              {v.location && <div style={{ fontFamily: FONTS.caption, fontSize: 7.5 * s, color: P.accent, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 * s }}>{v.location}</div>}
              {v.desc && <div style={{ fontFamily: FONTS.body, fontSize: 8.5 * s, color: P.muted, lineHeight: 1.55 }}>{v.desc}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlannerSpotlight({ f, s, palette, W, H }) {
  const P = PALETTES.claret;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg }}>
      {/* Image: top 50% */}
      {f.image
        ? <img src={f.image} alt="" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', width: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
        : <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', background: '#2e0e1c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 32 * s, opacity: 0.15, color: '#fff', fontFamily: 'sans-serif' }}>⊡</span>
          </div>
      }
      {/* Gradient bleed */}
      <div style={{ position: 'absolute', top: '36%', left: 0, right: 0, height: '18%', background: `linear-gradient(to bottom, transparent 0%, ${P.bg} 100%)` }} />

      {/* Bottom content */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '52%', padding: `${14 * s}px ${22 * s}px ${18 * s}px`, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontFamily: FONTS.caption, fontSize: 7 * s, color: P.accent, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 6 * s }}>Planner Spotlight</div>
        <div style={{ fontFamily: FONTS.display, fontSize: 20 * s, fontWeight: 700, letterSpacing: '0.06em', color: P.text, marginBottom: 2 * s }}>
          {f.planner_name || 'The Planner'}
        </div>
        {(f.company || f.based) && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: P.muted, letterSpacing: '0.08em', marginBottom: 8 * s }}>
            {[f.company, f.based].filter(Boolean).join(' · ')}
          </div>
        )}
        <div style={{ width: 28 * s, height: 1, background: P.accent, opacity: 0.5, marginBottom: 10 * s }} />
        <div style={{ fontFamily: FONTS.editorial, fontSize: 13 * s, fontStyle: 'italic', color: P.text, lineHeight: 1.3, marginBottom: 8 * s }}>
          {f.headline || 'The Architect of Extraordinary Days'}
        </div>
        {f.bio && (
          <div style={{ fontFamily: FONTS.body, fontSize: 9 * s, color: P.muted, lineHeight: 1.6 }}>{f.bio}</div>
        )}
        {(f.signature_style || f.website) && (
          <div style={{ marginTop: 'auto', display: 'flex', gap: 14 * s, flexWrap: 'wrap' }}>
            {f.signature_style && <div style={{ fontFamily: FONTS.caption, fontSize: 7.5 * s, color: P.accent, letterSpacing: '0.08em' }}>{f.signature_style}</div>}
            {f.website && <div style={{ fontFamily: FONTS.caption, fontSize: 7.5 * s, color: P.muted, letterSpacing: '0.06em' }}>{f.website}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── NEW TEMPLATES: Editor's Letter, About Page, Back Cover, Full-Page Ad,
//                  Product Showcase Ad, Venue Advertisement
// ─────────────────────────────────────────────────────────────────────────────

function EditorsLetter({ f, s, W, H }) {
  const P = PALETTES.ivory;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg, fontFamily: FONTS.editorial }}>
      {/* Thin gold left border */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: 3, height: '100%', background: P.accent, opacity: 0.6 }} />

      {/* Right column — portrait circle */}
      <div style={{ position: 'absolute', right: 22 * s, top: 28 * s, width: 110 * s, height: 110 * s, borderRadius: '50%', overflow: 'hidden', border: `1px solid ${P.accent}` }}>
        {f.portrait
          ? <img src={f.portrait} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
          : <div style={{ width: '100%', height: '100%', background: '#E8E0D4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 28 * s, opacity: 0.2, color: P.text, fontFamily: 'sans-serif' }}>⊡</span>
            </div>
        }
      </div>

      {/* Left column — text */}
      <div style={{ position: 'absolute', left: 20 * s, top: 32 * s, right: 148 * s }}>
        <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: P.accent, letterSpacing: '0.3em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 * s }}>
          {f.kicker || 'FROM THE EDITOR'}
        </div>
        <div style={{ width: 32 * s, height: 1, background: P.accent, marginBottom: 10 * s }} />
        <div style={{ fontFamily: FONTS.display, fontSize: 26 * s, fontWeight: 400, fontStyle: 'italic', color: P.text, lineHeight: 1.1, marginBottom: 14 * s }}>
          {f.headline || 'A Season of Grace'}
        </div>
      </div>

      {/* Body copy — full width below portrait */}
      <div style={{ position: 'absolute', left: 20 * s, right: 20 * s, top: 170 * s, bottom: 80 * s, overflow: 'hidden' }}>
        <div style={{ fontFamily: FONTS.editorial, fontSize: 10 * s, color: P.text, lineHeight: 1.75, opacity: 0.85 }}>
          {f.body || 'This season we find ourselves drawn to a quieter kind of luxury — the pleasure of a well-chosen thing, the intimacy of a gathering held in a perfect room, the way light falls at six in the evening through old stone. These are the moments we have spent the year seeking out, curating, and celebrating in these pages.\n\nWe are grateful to the couples who let us into their days, and to the makers, planners, and venues who continue to set a standard that inspires everything we do.\n\nWith admiration,'}
        </div>
      </div>

      {/* Signature */}
      <div style={{ position: 'absolute', left: 20 * s, bottom: 18 * s }}>
        <div style={{ fontFamily: "'Great Vibes', cursive", fontSize: 28 * s, color: P.accent, lineHeight: 1.1 }}>
          {f.signature || 'Charlotte Ashford'}
        </div>
        <div style={{ width: 60 * s, height: 1, background: P.text, opacity: 0.25, marginTop: 4 * s, marginBottom: 4 * s }} />
        <div style={{ fontFamily: FONTS.caption, fontSize: 7 * s, color: P.muted, letterSpacing: '0.28em', textTransform: 'uppercase' }}>
          {f.title_line || 'EDITOR-IN-CHIEF'}
        </div>
      </div>

      {/* LWD mark */}
      <div style={{ position: 'absolute', bottom: 18 * s, right: 20 * s, fontFamily: FONTS.caption, fontSize: 7 * s, color: P.muted, letterSpacing: '0.1em' }}>LWD</div>
    </div>
  );
}

function AboutPage({ f, s, W, H }) {
  const P = PALETTES.obsidian;
  const cols = [
    { title: f.pillar1 || 'Curation',    body: f.pillar1_body || 'Every name in these pages has been chosen, not paid-for. We travel, we watch, we listen.' },
    { title: f.pillar2 || 'Craft',       body: f.pillar2_body || 'We champion the makers whose hands shape the quiet perfection of a great wedding day.' },
    { title: f.pillar3 || 'Celebration', body: f.pillar3_body || 'We believe a wedding is the most public private moment of a life.' },
  ];
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg }}>
      {/* Top brand mark */}
      <div style={{ position: 'absolute', top: 22 * s, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: FONTS.caption, fontSize: 7 * s, color: P.accent, letterSpacing: '0.45em', textTransform: 'uppercase', fontWeight: 700 }}>
          {f.brand_mark || 'LUXURY WEDDING DIRECTORY'}
        </div>
        <div style={{ width: 32 * s, height: 1, background: P.accent, margin: `${8 * s}px auto` }} />
      </div>

      {/* Hero title */}
      <div style={{ position: 'absolute', top: '14%', left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: FONTS.display, fontSize: 52 * s, fontWeight: 400, fontStyle: 'italic', color: P.text, lineHeight: 1 }}>
          {f.hero || 'Our Story'}
        </div>
      </div>

      {/* Lede */}
      <div style={{ position: 'absolute', top: '30%', left: '12%', right: '12%', textAlign: 'center' }}>
        <div style={{ fontFamily: FONTS.editorial, fontSize: 11 * s, color: P.muted, lineHeight: 1.75, fontStyle: 'italic' }}>
          {f.lede || 'A curated directory of the world\'s most exceptional wedding venues, planners, and artisans — gathered, vetted, and celebrated by editors who have spent a decade covering them.'}
        </div>
      </div>

      {/* Three pillars */}
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, display: 'flex', padding: `0 ${18 * s}px`, gap: 12 * s }}>
        {cols.map((c, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: P.accent, letterSpacing: '0.3em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 * s }}>
              {c.title}
            </div>
            <div style={{ width: 24 * s, height: 1, background: P.accent, margin: `0 auto ${8 * s}px` }} />
            <div style={{ fontFamily: FONTS.editorial, fontSize: 9 * s, color: P.muted, lineHeight: 1.75, fontStyle: 'italic' }}>
              {c.body}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ position: 'absolute', bottom: 20 * s, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ width: 32 * s, height: 1, background: P.accent, margin: `0 auto ${8 * s}px`, opacity: 0.5 }} />
        <div style={{ fontFamily: FONTS.editorial, fontSize: 10 * s, color: P.muted, fontStyle: 'italic' }}>
          {f.established || 'Established MMXXIV'}
        </div>
      </div>
    </div>
  );
}

function BackCover({ f, s, W, H }) {
  const P = PALETTES.obsidian;
  const teasers = [
    { img: f.teaser1_image, cap: f.teaser1_caption || 'A Lavender Wedding in Luberon' },
    { img: f.teaser2_image, cap: f.teaser2_caption || 'The Return of the Wildflower' },
    { img: f.teaser3_image, cap: f.teaser3_caption || "Château d'Estoublon · An Exclusive" },
  ];
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg }}>
      {/* Kicker + headline */}
      <div style={{ position: 'absolute', top: 22 * s, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: FONTS.caption, fontSize: 7.5 * s, color: P.accent, letterSpacing: '0.4em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 * s }}>
          {f.kicker || 'IN THE NEXT ISSUE'}
        </div>
        <div style={{ fontFamily: FONTS.display, fontSize: 36 * s, fontWeight: 400, fontStyle: 'italic', color: P.text, lineHeight: 1.05 }}>
          {f.headline || 'Summer in Provence'}
        </div>
        <div style={{ width: 32 * s, height: 1, background: P.accent, margin: `${10 * s}px auto` }} />
      </div>

      {/* Teaser triptych */}
      <div style={{ position: 'absolute', top: '24%', left: 14 * s, right: 14 * s, display: 'flex', gap: 8 * s }}>
        {teasers.map((t, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div style={{ width: '100%', aspectRatio: '3/4', overflow: 'hidden', marginBottom: 8 * s }}>
              {t.img
                ? <img src={t.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', background: '#2A2016', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 18 * s, opacity: 0.2, color: P.text }}>⊡</span>
                  </div>
              }
            </div>
            <div style={{ width: 20 * s, height: 1, background: P.accent, marginBottom: 5 * s }} />
            <div style={{ fontFamily: FONTS.editorial, fontSize: 8.5 * s, color: P.text, lineHeight: 1.45, fontStyle: 'italic' }}>
              {t.cap}
            </div>
          </div>
        ))}
      </div>

      {/* Masthead strip */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderTop: `1px solid ${P.rule}`, padding: `${10 * s}px ${16 * s}px` }}>
        <div style={{ fontFamily: FONTS.caption, fontSize: 6.5 * s, color: P.muted, letterSpacing: '0.15em', textAlign: 'center', lineHeight: 1.9, textTransform: 'uppercase' }}>
          {f.masthead || 'Editor-in-Chief · Charlotte Ashford    Creative Director · Isadora Valois    Photography · Henry Asquith'}
        </div>
        <div style={{ textAlign: 'center', marginTop: 6 * s }}>
          <span style={{ fontFamily: FONTS.display, fontSize: 14 * s, color: P.accent, fontStyle: 'italic' }}>LWD</span>
        </div>
      </div>
    </div>
  );
}

function FullPageAd({ f, s, W, H }) {
  const P = PALETTES.obsidian;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg }}>
      {/* Full-bleed image */}
      {f.image
        ? <img src={f.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg,#1a1208,#080806)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 40 * s, opacity: 0.12, color: '#fff' }}>⊡</span>
          </div>
      }
      {/* Gradient wash at bottom */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '42%', background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)' }} />

      {/* Brand block */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center', paddingBottom: 22 * s }}>
        <div style={{ width: '50%', height: 1, background: P.accent, margin: `0 auto ${12 * s}px`, opacity: 0.7 }} />
        <div style={{ fontFamily: FONTS.display, fontSize: 38 * s, fontWeight: 400, color: '#F0EBE0', letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1 }}>
          {f.brand || 'VERA WANG'}
        </div>
        {f.tagline && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 7.5 * s, color: P.accent, letterSpacing: '0.4em', textTransform: 'uppercase', marginTop: 8 * s, fontWeight: 600 }}>
            {f.tagline}
          </div>
        )}
        {f.url && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 7 * s, color: 'rgba(240,235,224,0.55)', letterSpacing: '0.15em', marginTop: 10 * s }}>
            {f.url}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductShowcaseAd({ f, s, W, H }) {
  const P = PALETTES.ivory;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg }}>
      {/* Left half — product image */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '100%' }}>
        {f.image
          ? <img src={f.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: '#E8E0D4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 36 * s, opacity: 0.18, color: P.text }}>⊡</span>
            </div>
        }
      </div>

      {/* Thin gold divider */}
      <div style={{ position: 'absolute', left: '50%', top: '8%', height: '84%', width: 1, background: P.accent, opacity: 0.5 }} />

      {/* Right half — copy panel */}
      <div style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `0 ${20 * s}px 0 ${22 * s}px`, boxSizing: 'border-box' }}>
        <div style={{ fontFamily: FONTS.caption, fontSize: 7.5 * s, color: P.accent, letterSpacing: '0.35em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 * s }}>
          {f.featured || 'FEATURED'}
        </div>
        <div style={{ width: 28 * s, height: 1, background: P.accent, marginBottom: 10 * s }} />
        <div style={{ fontFamily: FONTS.display, fontSize: 26 * s, fontWeight: 400, fontStyle: 'italic', color: P.text, lineHeight: 1.1, marginBottom: 12 * s }}>
          {f.product || 'The Madeleine Solitaire'}
        </div>
        {f.description && (
          <div style={{ fontFamily: FONTS.editorial, fontSize: 9.5 * s, color: P.text, lineHeight: 1.7, fontStyle: 'italic', marginBottom: 14 * s, opacity: 0.8 }}>
            {f.description}
          </div>
        )}
        <div style={{ width: 40 * s, height: 1, background: P.accent, marginBottom: 8 * s }} />
        {f.price && (
          <div style={{ fontFamily: FONTS.editorial, fontSize: 18 * s, color: P.text, fontStyle: 'italic', marginBottom: 16 * s }}>
            {f.price}
          </div>
        )}
        {/* CTA button */}
        <div style={{ display: 'inline-block', border: `1px solid ${P.text}`, padding: `${6 * s}px ${16 * s}px`, textAlign: 'center', marginBottom: 'auto' }}>
          <div style={{ fontFamily: FONTS.caption, fontSize: 7.5 * s, color: P.text, letterSpacing: '0.3em', textTransform: 'uppercase', fontWeight: 700 }}>
            {f.cta || 'SHOP NOW'}
          </div>
        </div>
        {/* Brand line at bottom */}
        <div style={{ fontFamily: FONTS.caption, fontSize: 7 * s, color: P.accent, letterSpacing: '0.35em', textTransform: 'uppercase', position: 'absolute', bottom: 18 * s }}>
          {f.brand || 'GRAFF · LONDON'}
        </div>
      </div>
    </div>
  );
}

function VenueAdvertisement({ f, s, W, H }) {
  const P = PALETTES.obsidian;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg }}>
      {/* Full-bleed venue image */}
      {f.image
        ? <img src={f.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg,#1a1612,#080806)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 40 * s, opacity: 0.12, color: '#fff' }}>⊡</span>
          </div>
      }
      {/* Gradient wash — lower 55% */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }} />

      {/* Brand block */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center', paddingBottom: 20 * s }}>
        <div style={{ width: 40 * s, height: 1, background: P.accent, margin: `0 auto ${10 * s}px`, opacity: 0.8 }} />
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 22 * s, color: P.accent, letterSpacing: '0.5em', textTransform: 'uppercase', lineHeight: 1, marginBottom: 8 * s }}>
          {f.venue || 'HOTEL CIPRIANI'}
        </div>
        {f.tagline && (
          <div style={{ fontFamily: FONTS.editorial, fontSize: 11 * s, color: P.text, fontStyle: 'italic', marginBottom: 10 * s, opacity: 0.9 }}>
            {f.tagline}
          </div>
        )}
        {f.callout && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 7 * s, color: 'rgba(240,235,224,0.65)', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 10 * s }}>
            {f.callout}
          </div>
        )}
        {/* Ghost CTA button */}
        <div style={{ display: 'inline-block', border: `1px solid ${P.accent}`, padding: `${5 * s}px ${18 * s}px`, marginBottom: 10 * s }}>
          <div style={{ fontFamily: FONTS.caption, fontSize: 7.5 * s, color: P.accent, letterSpacing: '0.35em', textTransform: 'uppercase', fontWeight: 600 }}>
            {f.cta || 'BOOK A VISIT'}
          </div>
        </div>
        {f.footer && (
          <div style={{ fontFamily: FONTS.editorial, fontSize: 8.5 * s, color: P.muted, fontStyle: 'italic' }}>
            {f.footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── PHASE 2 VARIANT TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────

function CoverSplit({ f, s, W, H }) {
  const P = PALETTES.obsidian;
  const lines = (f.lines || 'THE BRIDAL EDIT\nVERA WANG · PARIS\nAMALFI COAST VENUES\nJEWELLERY REPORT').split('\n').filter(Boolean);
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg }}>
      {/* Left 44%: image */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: '44%', height: '100%' }}>
        <img src={f.image || D.bridalPortrait} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
      </div>
      {/* Hairline separator */}
      <div style={{ position: 'absolute', left: '44%', top: 0, width: 1, height: '100%', background: P.accent }} />
      {/* Right panel */}
      <div style={{ position: 'absolute', left: '45%', top: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', padding: `${20 * s}px ${16 * s}px` }}>
        {/* Masthead */}
        <div style={{ borderBottom: `1px solid ${P.accent}`, paddingBottom: 6 * s, marginBottom: 8 * s }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 36 * s, fontWeight: 400, fontStyle: 'italic', color: P.text, textAlign: 'center', lineHeight: 1 }}>
            {f.masthead || 'LWD'}
          </div>
          <div style={{ fontFamily: FONTS.caption, fontSize: 6 * s, color: P.accent, letterSpacing: '0.3em', textTransform: 'uppercase', textAlign: 'center', marginTop: 4 * s }}>
            {f.issue || 'ISSUE 01 · SPRING 2026'}
          </div>
        </div>
        {/* Cover lines */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0 }}>
          {lines.map((line, i) => (
            <div key={i}>
              <div style={{ fontFamily: FONTS.caption, fontSize: 7.5 * s, color: i === 0 ? P.text : P.muted, letterSpacing: '0.15em', textTransform: 'uppercase', padding: `${5 * s}px 0` }}>
                {line}
              </div>
              {i < lines.length - 1 && <div style={{ height: 1, background: P.rule }} />}
            </div>
          ))}
        </div>
        {/* Bottom: main title */}
        <div style={{ borderTop: `1px solid ${P.accent}`, paddingTop: 8 * s }}>
          <div style={{ fontFamily: FONTS.subhead, fontSize: 22 * s, fontWeight: 400, fontStyle: 'italic', color: P.text, textAlign: 'center', lineHeight: 1.1 }}>
            {f.title || 'The Bridal Edition'}
          </div>
        </div>
      </div>
    </div>
  );
}

function CoverTypographic({ f, s, W, H }) {
  const P = PALETTES.obsidian;
  const linesLeft  = (f.lines_left  || 'Vera Wang · Couture\nAmalfi Venues\nFlorals by Season').split('\n').filter(Boolean);
  const linesRight = (f.lines_right || 'The Ring Report\nPlanning in 6 Months\nBeauty Edit').split('\n').filter(Boolean);
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg }}>
      {/* Ghost issue number */}
      <div style={{ position: 'absolute', bottom: '-5%', right: '-5%', fontFamily: FONTS.display, fontSize: 280 * s, fontWeight: 400, color: 'rgba(201,168,76,0.055)', lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>
        {f.issue_num || '01'}
      </div>
      {/* Masthead */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: `${18 * s}px ${22 * s}px 0`, borderBottom: `1px solid ${P.accent}`, paddingBottom: 10 * s }}>
        <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: P.text, letterSpacing: '0.4em', textTransform: 'uppercase', textAlign: 'center', fontWeight: 700 }}>
          {f.masthead || 'LUXURY WEDDING DIRECTORY'}
        </div>
        <div style={{ fontFamily: FONTS.caption, fontSize: 6.5 * s, color: P.accent, letterSpacing: '0.35em', textTransform: 'uppercase', textAlign: 'center', marginTop: 4 * s }}>
          {f.season || 'SPRING · SUMMER'}
        </div>
      </div>
      {/* Giant title */}
      <div style={{ position: 'absolute', top: '18%', left: 0, right: 0, textAlign: 'center', padding: `0 ${22 * s}px` }}>
        <div style={{ fontFamily: FONTS.display, fontSize: 64 * s, fontWeight: 400, fontStyle: 'italic', color: P.text, lineHeight: 1.0 }}>
          {f.title || 'The Bridal Edition'}
        </div>
      </div>
      {/* Cover lines grid */}
      <div style={{ position: 'absolute', bottom: '10%', left: 0, right: 0, display: 'flex', padding: `0 ${22 * s}px`, gap: 12 * s }}>
        <div style={{ flex: 1 }}>
          {linesLeft.map((l, i) => (
            <div key={i} style={{ fontFamily: FONTS.caption, fontSize: 7 * s, color: P.muted, letterSpacing: '0.1em', textTransform: 'uppercase', padding: `${3 * s}px 0`, borderBottom: `1px solid ${P.rule}` }}>{l}</div>
          ))}
        </div>
        <div style={{ width: 1, background: P.rule }} />
        <div style={{ flex: 1 }}>
          {linesRight.map((l, i) => (
            <div key={i} style={{ fontFamily: FONTS.caption, fontSize: 7 * s, color: P.muted, letterSpacing: '0.1em', textTransform: 'uppercase', padding: `${3 * s}px 0`, borderBottom: `1px solid ${P.rule}` }}>{l}</div>
          ))}
        </div>
      </div>
      {/* Year */}
      <div style={{ position: 'absolute', bottom: 14 * s, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: FONTS.display, fontSize: 11 * s, color: 'rgba(240,235,224,0.25)', fontStyle: 'italic' }}>{f.year || 'MMXXVI'}</div>
      </div>
    </div>
  );
}

function FeatureCinematic({ f, s, W, H }) {
  const P = PALETTES.obsidian;
  const lines = (f.headline || 'Something Borrowed, Something Gold').split(',').map(l => l.trim());
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: '#0D0C0A' }}>
      {/* 72% image */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: '72%', height: '100%' }}>
        <img src={f.image || D.editorial} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
      </div>
      {/* Vertical gold rule */}
      <div style={{ position: 'absolute', left: '72%', top: '4%', height: '92%', width: 1, background: P.accent }} />
      {/* Right narrow column */}
      <div style={{ position: 'absolute', left: '74%', top: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: `${20 * s}px ${10 * s}px` }}>
        <div>
          <div style={{ fontFamily: FONTS.caption, fontSize: 6.5 * s, color: P.accent, letterSpacing: '0.35em', textTransform: 'uppercase', marginBottom: 8 * s }}>
            {f.kicker || 'EDITORIAL'}
          </div>
          <div style={{ width: '80%', height: 1, background: P.accent, marginBottom: 10 * s }} />
          {/* Headline: one fragment per line */}
          {lines.map((l, i) => (
            <div key={i} style={{ fontFamily: FONTS.display, fontSize: 18 * s, fontWeight: 400, fontStyle: 'italic', color: i === lines.length - 1 ? P.accent : P.text, lineHeight: 1.15, marginBottom: 2 * s }}>
              {l}{i < lines.length - 1 ? ',' : ''}
            </div>
          ))}
          <div style={{ width: '80%', height: 1, background: P.rule, marginTop: 10 * s, marginBottom: 8 * s }} />
          {f.body && (
            <div style={{ fontFamily: FONTS.editorial, fontSize: 8 * s, color: P.muted, lineHeight: 1.75, fontStyle: 'italic' }}>
              {f.body}
            </div>
          )}
        </div>
        <div style={{ fontFamily: FONTS.caption, fontSize: 6 * s, color: 'rgba(240,235,224,0.3)', letterSpacing: '0.08em', lineHeight: 1.8 }}>
          {(f.byline || 'Words · Charlotte Ashford').split('\n').map((l, i) => <div key={i}>{l}</div>)}
        </div>
      </div>
    </div>
  );
}

function FeatureMinimal({ f, s, W, H }) {
  const P = PALETTES.white;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: '#FAFAF8' }}>
      {/* Small inset image — top right */}
      <div style={{ position: 'absolute', right: 22 * s, top: 22 * s, width: '36%', aspectRatio: '4/5', overflow: 'hidden' }}>
        <img src={f.image || D.bridalDetail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      {/* Kicker */}
      <div style={{ position: 'absolute', left: 22 * s, top: 28 * s, fontFamily: FONTS.caption, fontSize: 7.5 * s, color: '#B8926A', letterSpacing: '0.35em', textTransform: 'uppercase' }}>
        {f.kicker || 'FASHION · SPRING 2026'}
      </div>
      {/* Giant headline */}
      <div style={{ position: 'absolute', left: 22 * s, top: 48 * s, width: '60%' }}>
        <div style={{ fontFamily: FONTS.subhead, fontSize: 46 * s, fontWeight: 400, fontStyle: 'italic', color: P.text, lineHeight: 1.0 }}>
          {f.headline || 'Something\nBorrowed,\nSomething\nGold'}
        </div>
      </div>
      {/* Thin rule */}
      <div style={{ position: 'absolute', left: 22 * s, top: '37%', width: 48 * s, height: 1, background: '#B8926A' }} />
      {/* Two-column body */}
      <div style={{ position: 'absolute', left: 22 * s, right: 22 * s, top: '40%', bottom: 40 * s, display: 'flex', gap: 18 * s }}>
        <div style={{ flex: 1, fontFamily: FONTS.editorial, fontSize: 9.5 * s, color: P.text, lineHeight: 1.8, opacity: 0.82 }}>
          {f.body1 || 'For the modern bride, tradition becomes language — softened, re-tuned, reimagined. A veil inherited from a grandmother, a locket tucked in a bouquet; these are the gestures that carry love forward through time.'}
        </div>
        <div style={{ flex: 1, fontFamily: FONTS.editorial, fontSize: 9.5 * s, color: P.text, lineHeight: 1.8, opacity: 0.82 }}>
          {f.body2 || 'This season, we revisit the rituals that remain — and the ones that are quietly, gloriously new. From hand-cut lace to ceremony at dusk, the details that define a day.'}
        </div>
      </div>
      {/* Byline */}
      {f.byline && (
        <div style={{ position: 'absolute', bottom: 16 * s, left: 22 * s, fontFamily: FONTS.caption, fontSize: 6.5 * s, color: P.muted, letterSpacing: '0.12em' }}>
          {f.byline}
        </div>
      )}
    </div>
  );
}

function VenueSkyline({ f, s, W, H }) {
  const P = PALETTES.ivory;
  const specs = [
    { label: 'CAPACITY',       value: f.capacity      || 'Up to 180' },
    { label: 'STYLE',          value: f.style         || 'Renaissance' },
    { label: 'EXCLUSIVE USE',  value: f.exclusive_use || 'Available' },
    { label: 'OVERNIGHT',      value: f.rooms         || '24 Suites' },
  ];
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg }}>
      {/* Hero image top 50% */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', overflow: 'hidden' }}>
        <img src={f.image || D.villa} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }} />
        {/* Gradient fade at bottom of image */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: `linear-gradient(to top, ${P.bg}, transparent)` }} />
      </div>
      {/* Below image */}
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: `${12 * s}px ${20 * s}px` }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 20 * s, color: P.text, letterSpacing: '0.45em', textTransform: 'uppercase', textAlign: 'center', marginBottom: 4 * s }}>
          {f.venue || 'VILLA SAN CASCIANO'}
        </div>
        <div style={{ fontFamily: FONTS.editorial, fontSize: 11 * s, color: P.accent, fontStyle: 'italic', marginBottom: 10 * s }}>
          {f.location || 'Tuscany, Italy'}
        </div>
        <div style={{ width: 32 * s, height: 1, background: P.accent, marginBottom: 12 * s }} />
        {/* Specs row */}
        <div style={{ display: 'flex', width: '100%', gap: 0, marginBottom: 14 * s }}>
          {specs.map((sp, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', borderRight: i < 3 ? `1px solid ${P.rule}` : 'none', padding: `0 ${6 * s}px` }}>
              <div style={{ fontFamily: FONTS.caption, fontSize: 6 * s, color: P.accent, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 3 * s }}>{sp.label}</div>
              <div style={{ fontFamily: FONTS.editorial, fontSize: 9.5 * s, color: P.text, fontStyle: 'italic' }}>{sp.value}</div>
            </div>
          ))}
        </div>
        {/* CTA */}
        <div style={{ border: `1px solid ${P.text}`, padding: `${5 * s}px ${18 * s}px` }}>
          <div style={{ fontFamily: FONTS.caption, fontSize: 7 * s, color: P.text, letterSpacing: '0.3em', textTransform: 'uppercase' }}>
            ENQUIRE NOW
          </div>
        </div>
      </div>
    </div>
  );
}

function VenueEssay({ f, s, W, H }) {
  const P = PALETTES.white;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: '#FAFAF8' }}>
      {/* Left 38%: portrait image */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: '38%', height: '100%' }}>
        <img src={f.image || D.tuscany} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
      </div>
      {/* Gold hairline divider */}
      <div style={{ position: 'absolute', left: '38%', top: '4%', height: '92%', width: 1, background: '#B8926A', opacity: 0.6 }} />
      {/* Right: essay */}
      <div style={{ position: 'absolute', left: '41%', top: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `${24 * s}px ${18 * s}px ${24 * s}px ${14 * s}px` }}>
        <div style={{ fontFamily: FONTS.caption, fontSize: 7 * s, color: '#B8926A', letterSpacing: '0.35em', textTransform: 'uppercase', marginBottom: 6 * s }}>
          {f.kicker || 'VENUE FEATURE'}
        </div>
        <div style={{ width: 28 * s, height: 1, background: '#B8926A', marginBottom: 10 * s }} />
        <div style={{ fontFamily: FONTS.display, fontSize: 30 * s, fontWeight: 400, fontStyle: 'italic', color: P.text, lineHeight: 1.05, marginBottom: 8 * s }}>
          {f.venue || 'Villa San\nCasciano'}
        </div>
        <div style={{ fontFamily: FONTS.editorial, fontSize: 9 * s, color: '#B8926A', fontStyle: 'italic', marginBottom: 10 * s }}>
          {f.location || 'Tuscany, Italy'}
        </div>
        <div style={{ width: '100%', height: 1, background: 'rgba(30,26,20,0.12)', marginBottom: 10 * s }} />
        <div style={{ fontFamily: FONTS.editorial, fontSize: 9.5 * s, color: P.text, lineHeight: 1.82, opacity: 0.85, flex: 1, overflow: 'hidden' }}>
          {f.body || 'The light in Villa San Casciano arrives differently each hour. By early evening it pools against the sandstone in long amber shafts, illuminating the wisteria that clings to the arched colonnade like a memory.\n\nCouples arrive to find tables set not just with linen and crystal, but with a kind of hush — the particular silence of a place that has absorbed centuries of significant moments.'}
        </div>
        {f.byline && (
          <div style={{ fontFamily: FONTS.caption, fontSize: 6.5 * s, color: P.muted, letterSpacing: '0.1em', marginTop: 10 * s }}>
            {f.byline}
          </div>
        )}
      </div>
    </div>
  );
}

function CoupleGallery({ f, s, W, H }) {
  const P = PALETTES.white;
  const imgs = [
    f.image1 || D.coupleWalk,
    f.image2 || D.bridalPortrait,
    f.image3 || D.bridalPrep,
    f.image4 || D.bridalReady,
  ];
  const headerH = H * 0.17;
  const gapPx = 4 * s;
  const gridTop = headerH;
  const gridH = H - gridTop - 36 * s;
  const cellW = (W - 36 * s - gapPx) / 2;
  const cellH = (gridH - gapPx) / 2;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: '#FAFAF8' }}>
      {/* Header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: headerH, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderBottom: `1px solid rgba(30,26,20,0.1)` }}>
        <div style={{ fontFamily: FONTS.caption, fontSize: 6.5 * s, color: '#B8926A', letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: 4 * s }}>
          A LOVE STORY
        </div>
        <div style={{ fontFamily: FONTS.display, fontSize: 28 * s, fontWeight: 400, fontStyle: 'italic', color: P.text, lineHeight: 1 }}>
          {f.names || 'Isabelle & François'}
        </div>
      </div>
      {/* 2×2 grid */}
      {[[0,0],[1,0],[0,1],[1,1]].map(([col, row], i) => (
        <div key={i} style={{
          position: 'absolute',
          left: 18 * s + col * (cellW + gapPx),
          top: gridTop + row * (cellH + gapPx),
          width: cellW, height: cellH, overflow: 'hidden',
        }}>
          <img src={imgs[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ))}
      {/* Footer */}
      <div style={{ position: 'absolute', bottom: 10 * s, right: 18 * s, fontFamily: FONTS.editorial, fontSize: 7.5 * s, color: P.muted, fontStyle: 'italic', textAlign: 'right' }}>
        {f.date_loc || '12 June 2026 · Provence, France'}
      </div>
    </div>
  );
}

function StoryChapter({ f, s, W, H }) {
  const P = PALETTES.white;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: '#FAFAF8' }}>
      {/* Ghost chapter numeral */}
      <div style={{ position: 'absolute', left: '-8%', top: '15%', fontFamily: FONTS.display, fontSize: 340 * s, fontWeight: 400, color: 'rgba(30,26,20,0.038)', lineHeight: 1, userSelect: 'none', pointerEvents: 'none', letterSpacing: '-0.05em' }}>
        {f.chapter || '01'}
      </div>
      {/* Gold accent bar */}
      <div style={{ position: 'absolute', left: 22 * s, top: H * 0.3, width: 40 * s, height: 3, background: '#B8926A' }} />
      {/* Kicker */}
      <div style={{ position: 'absolute', left: 22 * s, top: H * 0.3 + 12 * s, fontFamily: FONTS.caption, fontSize: 7.5 * s, color: '#B8926A', letterSpacing: '0.4em', textTransform: 'uppercase' }}>
        {f.kicker || 'PART ONE · THE JOURNEY'}
      </div>
      {/* Headline */}
      <div style={{ position: 'absolute', left: 22 * s, right: 22 * s, top: H * 0.38 }}>
        <div style={{ fontFamily: FONTS.subhead, fontSize: 44 * s, fontWeight: 400, fontStyle: 'italic', color: P.text, lineHeight: 1.05 }}>
          {f.headline || 'The Day We\nChanged Everything'}
        </div>
      </div>
      {/* Intro paragraph */}
      <div style={{ position: 'absolute', left: 22 * s, right: '28%', top: H * 0.63 }}>
        <div style={{ fontFamily: FONTS.editorial, fontSize: 11 * s, color: P.text, lineHeight: 1.78, fontStyle: 'italic', opacity: 0.82 }}>
          {f.intro || 'It began with a letter. Not an email — a letter, handwritten on thick cream card, delivered to a flat in Marylebone on a Tuesday morning in October. Inside: one line.'}
        </div>
      </div>
      {/* Base rule + page number */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderTop: `1px solid rgba(184,146,106,0.3)`, display: 'flex', justifyContent: 'space-between', padding: `${10 * s}px ${22 * s}px` }}>
        <div style={{ fontFamily: FONTS.caption, fontSize: 6.5 * s, color: P.muted, letterSpacing: '0.15em' }}>
          {f.page_num || '01'}
        </div>
        <div style={{ fontFamily: FONTS.caption, fontSize: 6.5 * s, color: P.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          LWD
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── PHASE 3: NEW EDITORIAL CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────

function StyledShoot({ f, s, W, H }) {
  const P = PALETTES.white;
  const accent = '#B8926A';
  const stripH = H * 0.54;
  const gapPx = 6 * s;
  const cellW = (W - gapPx * 2) / 3;
  const imgs = [
    f.image1 || D.bouquet,
    f.image2 || D.bridalDetail,
    f.image3 || D.couplePortrait,
  ];
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: '#FAFAF8' }}>
      {/* Header rule sandwich */}
      <div style={{ position: 'absolute', top: 44 * s, left: 22 * s, right: 22 * s, height: 1, background: accent }} />
      <div style={{ position: 'absolute', top: 44 * s, left: 22 * s, right: 22 * s, textAlign: 'center' }}>
        <div style={{ fontFamily: FONTS.caption, fontSize: 7.5 * s, color: accent, letterSpacing: '0.5em', textTransform: 'uppercase', lineHeight: 1, background: '#FAFAF8', display: 'inline-block', padding: `0 ${10 * s}px`, marginTop: -6 * s }}>
          {f.kicker || 'STYLED SHOOT'}
        </div>
      </div>
      <div style={{ position: 'absolute', top: 62 * s, left: 22 * s, right: 22 * s, height: 1, background: accent }} />

      {/* 3-column image strip */}
      {imgs.map((img, i) => (
        <div key={i} style={{ position: 'absolute', left: i * (cellW + gapPx), top: 76 * s, width: cellW, height: stripH, overflow: 'hidden' }}>
          <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ))}

      {/* Headline + intro below strip */}
      <div style={{ position: 'absolute', left: 22 * s, right: 22 * s, top: 76 * s + stripH + 18 * s, textAlign: 'center' }}>
        <div style={{ fontFamily: FONTS.subhead, fontSize: 36 * s, fontWeight: 400, fontStyle: 'italic', color: P.text, lineHeight: 1.05, marginBottom: 10 * s }}>
          {f.headline || 'In Full Bloom'}
        </div>
        {f.intro && (
          <div style={{ fontFamily: FONTS.editorial, fontSize: 9.5 * s, color: P.muted, lineHeight: 1.65, fontStyle: 'italic', maxWidth: '80%', margin: '0 auto' }}>
            {f.intro}
          </div>
        )}
      </div>

      {/* Credits footer */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderTop: `1px solid rgba(30,26,20,0.1)`, padding: `${9 * s}px ${22 * s}px`, textAlign: 'center' }}>
        <div style={{ fontFamily: FONTS.caption, fontSize: 6.5 * s, color: P.muted, letterSpacing: '0.1em', lineHeight: 1.8 }}>
          {f.photographer && <span>Photography · {f.photographer}{'   '}</span>}
          {f.florist && <span>Florals · {f.florist}{'   '}</span>}
          {f.planner && <span>Planning · {f.planner}{'   '}</span>}
          {f.venue && <span>Venue · {f.venue}</span>}
          {!f.photographer && !f.florist && !f.planner && !f.venue && (
            <span>Photography · Studio Fable   Florals · Bloom & Wild   Venue · Villa San Casciano</span>
          )}
        </div>
      </div>
    </div>
  );
}

function WeddingGallery({ f, s, W, H }) {
  const P = PALETTES.white;
  const accent = '#B8926A';
  const gridTop = H * 0.145;
  const heroW = W * 0.55;
  const heroH = H - gridTop - 46 * s;
  const rCellH = (heroH - 4 * s) / 2;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: '#FAFAF8' }}>
      {/* Header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: gridTop, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderBottom: `1px solid rgba(30,26,20,0.08)` }}>
        <div style={{ fontFamily: FONTS.caption, fontSize: 6.5 * s, color: accent, letterSpacing: '0.5em', textTransform: 'uppercase', marginBottom: 4 * s }}>
          REAL WEDDING
        </div>
        <div style={{ fontFamily: FONTS.subhead, fontSize: 32 * s, fontWeight: 400, fontStyle: 'italic', color: P.text, lineHeight: 1.0 }}>
          {f.names || 'Isabella & James'}
        </div>
        <div style={{ width: 40 * s, height: 1, background: accent, marginTop: 6 * s }} />
      </div>

      {/* Asymmetric grid: hero left + 2 stacked right */}
      <div style={{ position: 'absolute', left: 0, top: gridTop, width: heroW - 3 * s, height: heroH, overflow: 'hidden' }}>
        <img src={f.image_hero || D.coupleWalk} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
      </div>
      {[f.image_tl || D.villa, f.image_bl || D.bouquet].map((img, i) => (
        <div key={i} style={{ position: 'absolute', left: heroW + 3 * s, top: gridTop + i * (rCellH + 4 * s), width: W - heroW - 3 * s, height: rCellH, overflow: 'hidden' }}>
          <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ))}

      {/* Footer */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 42 * s, borderTop: `1px solid rgba(30,26,20,0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: FONTS.caption, fontSize: 6.5 * s, color: P.muted, letterSpacing: '0.1em', textAlign: 'center' }}>
          {[f.date, f.venue, f.photographer && `Photography: ${f.photographer}`].filter(Boolean).join('  ·  ')
            || '15 September 2026  ·  Villa San Casciano, Tuscany  ·  Photography: Studio Fable'}
        </div>
      </div>
    </div>
  );
}

function SupplierCredits({ f, s, W, H }) {
  const P = PALETTES.ivory;
  const accent = '#B8926A';
  const cols = [
    { title: f.col1_title || 'PHOTOGRAPHY', entries: f.col1_entries || 'Studio Fable\nLondon & Destination\nstudiofable.co' },
    { title: f.col2_title || 'VENUE', entries: f.col2_entries || 'Villa San Casciano\nTuscany, Italy\nvsc.it' },
    { title: f.col3_title || 'GOWN & FASHION', entries: f.col3_entries || 'Vera Wang Couture\nShoes: Sophia Webster\nVeil: Toni Federici' },
    { title: f.col4_title || 'FLOWERS & CAKE', entries: f.col4_entries || 'Bloom & Wild Florals\nButtercream Dreams\nCeremony: The Orchard' },
  ];
  const colW = (W - 44 * s) / 4;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg }}>
      {/* Top masthead */}
      <div style={{ position: 'absolute', top: 28 * s, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: FONTS.caption, fontSize: 7 * s, color: accent, letterSpacing: '0.42em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 * s }}>
          {f.issue_label || 'LUXURY WEDDING DIRECTORY'}
        </div>
        <div style={{ width: 36 * s, height: 1, background: accent, margin: '0 auto' }} />
      </div>

      {/* Headline */}
      <div style={{ position: 'absolute', top: '10%', left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: FONTS.subhead, fontSize: 52 * s, fontWeight: 400, fontStyle: 'italic', color: P.text, lineHeight: 1.0 }}>
          {f.headline || 'The Team'}
        </div>
      </div>

      {/* Rule below headline */}
      <div style={{ position: 'absolute', top: '26%', left: 22 * s, right: 22 * s, height: 1, background: 'rgba(30,26,20,0.12)' }} />

      {/* 4-column credits */}
      <div style={{ position: 'absolute', top: '28%', left: 22 * s, right: 22 * s, bottom: 54 * s, display: 'flex', gap: 0 }}>
        {cols.map((col, i) => (
          <div key={i} style={{ flex: 1, padding: `0 ${8 * s}px`, borderRight: i < 3 ? `1px solid rgba(30,26,20,0.08)` : 'none' }}>
            <div style={{ fontFamily: FONTS.caption, fontSize: 6.5 * s, color: accent, letterSpacing: '0.32em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 * s }}>
              {col.title}
            </div>
            <div style={{ width: 24 * s, height: 1, background: accent, opacity: 0.5, marginBottom: 8 * s }} />
            <div style={{ fontFamily: FONTS.editorial, fontSize: 10 * s, color: P.text, lineHeight: 1.8, fontStyle: 'italic', whiteSpace: 'pre-line' }}>
              {col.entries}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 50 * s, borderTop: `1px solid rgba(30,26,20,0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: FONTS.caption, fontSize: 6.5 * s, color: P.muted, letterSpacing: '0.06em', textAlign: 'center', maxWidth: '80%' }}>
          All weddings featured have been independently selected by our editorial team.
        </div>
      </div>
    </div>
  );
}

function RegionalOpener({ f, s, W, H }) {
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: '#0D1520' }}>
      {/* Full-bleed image */}
      <img src={f.image || D.tuscany} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      {/* Dark overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,12,22,0.55)' }} />

      {/* Ghost region name — enormous italic watermark */}
      <div style={{ position: 'absolute', left: '50%', top: '25%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontFamily: FONTS.subhead, fontSize: 130 * s, fontWeight: 400, fontStyle: 'italic', color: 'rgba(255,255,255,0.05)', lineHeight: 0.9, userSelect: 'none', pointerEvents: 'none' }}>
        {f.region || 'TUSCANY'}
      </div>

      {/* Content layer */}
      <div style={{ position: 'absolute', top: '44%', left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: '#C9A84C', letterSpacing: '0.6em', textTransform: 'uppercase', marginBottom: 8 * s }}>
          {f.kicker || 'THE REGION'}
        </div>
        <div style={{ width: 56 * s, height: 1, background: '#C9A84C', margin: '0 auto', marginBottom: 10 * s }} />
        <div style={{ fontFamily: FONTS.subhead, fontSize: 60 * s, fontWeight: 400, fontStyle: 'italic', color: '#F0EBE0', lineHeight: 1.0, padding: `0 ${22 * s}px`, marginBottom: 16 * s }}>
          {f.headline || 'Eternal Tuscany'}
        </div>
        {f.intro && (
          <div style={{ fontFamily: FONTS.editorial, fontSize: 11 * s, color: 'rgba(240,235,224,0.8)', lineHeight: 1.7, fontStyle: 'italic', maxWidth: '72%', margin: '0 auto' }}>
            {f.intro}
          </div>
        )}
      </div>

      {/* Byline */}
      {f.byline && (
        <div style={{ position: 'absolute', bottom: 20 * s, left: 0, right: 0, textAlign: 'center', fontFamily: FONTS.caption, fontSize: 7.5 * s, color: 'rgba(240,235,224,0.35)', letterSpacing: '0.2em' }}>
          {f.byline}
        </div>
      )}
    </div>
  );
}

function PlanningEdit({ f, s, W, H }) {
  const P = PALETTES.ivory;
  const accent = '#B8926A';
  const cols = [
    { title: f.col1_title || 'FIND YOUR VENUE', steps: (f.col1_steps || 'Define your guest list\nBook 12–18 months ahead\nArrange private viewings\nAsk for exclusive use').split('\n').filter(Boolean) },
    { title: f.col2_title || 'BUILD YOUR TEAM', steps: (f.col2_steps || 'Photographer books first\nPlanner or coordinator\nFlorist consultation\nCaterer tasting day').split('\n').filter(Boolean) },
    { title: f.col3_title || 'THE FINAL MONTH', steps: (f.col3_steps || 'Final dress fitting\nConfirm all suppliers\nSend final numbers\nPrepare morning kit').split('\n').filter(Boolean) },
  ];
  const colW = (W - 44 * s) / 3;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: P.bg }}>
      {/* Left gold accent bar */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: 4, height: '100%', background: accent }} />

      {/* Header */}
      <div style={{ position: 'absolute', top: 30 * s, left: 22 * s }}>
        <div style={{ fontFamily: FONTS.caption, fontSize: 7.5 * s, color: accent, letterSpacing: '0.42em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 * s }}>
          THE PLANNING EDIT
        </div>
        <div style={{ fontFamily: FONTS.subhead, fontSize: 46 * s, fontWeight: 400, fontStyle: 'italic', color: P.text, lineHeight: 1.0, width: W * 0.6 }}>
          {f.headline || 'Six Months\nto Perfect'}
        </div>
      </div>

      {/* Small optional image top-right */}
      <img src={f.image || D.gownDetail} alt="" style={{ position: 'absolute', right: 22 * s, top: 22 * s, width: W * 0.28, height: W * 0.28 * 1.26, objectFit: 'cover' }} />

      {/* Rule below header */}
      <div style={{ position: 'absolute', top: '24%', left: 22 * s, right: 22 * s, height: 1, background: 'rgba(30,26,20,0.15)' }} />

      {/* 3 columns */}
      <div style={{ position: 'absolute', top: '26%', left: 22 * s, right: 22 * s, bottom: 24 * s, display: 'flex', gap: 0 }}>
        {cols.map((col, i) => (
          <div key={i} style={{ flex: 1, padding: `0 ${8 * s}px ${0}px 0`, borderRight: i < 2 ? `1px solid rgba(30,26,20,0.1)` : 'none', paddingRight: 10 * s }}>
            <div style={{ fontFamily: FONTS.caption, fontSize: 6.5 * s, color: accent, letterSpacing: '0.32em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 * s }}>
              {col.title}
            </div>
            <div style={{ width: 20 * s, height: 1, background: accent, opacity: 0.5, marginBottom: 10 * s }} />
            {col.steps.map((step, j) => (
              <div key={j} style={{ display: 'flex', gap: 6 * s, marginBottom: 12 * s, alignItems: 'flex-start' }}>
                <div style={{ fontFamily: FONTS.subhead, fontSize: 18 * s, fontWeight: 400, fontStyle: 'italic', color: `rgba(184,146,106,0.35)`, lineHeight: 1.1, flexShrink: 0, width: 16 * s, textAlign: 'right' }}>
                  {j + 1}
                </div>
                <div style={{ fontFamily: FONTS.editorial, fontSize: 9.5 * s, color: P.text, lineHeight: 1.55 }}>
                  {step}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function SeasonOpener({ f, s, W, H }) {
  const P = PALETTES.obsidian;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: '#0A0908' }}>
      {/* Gold frame border */}
      {[
        { left: 20 * s, top: 20 * s, width: W - 40 * s, height: 1 },
        { left: 20 * s, top: H - 20 * s, width: W - 40 * s, height: 1 },
        { left: 20 * s, top: 20 * s, width: 1, height: H - 40 * s },
        { left: W - 20 * s, top: 20 * s, width: 1, height: H - 40 * s },
      ].map((r, i) => (
        <div key={i} style={{ position: 'absolute', ...r, background: P.accent }} />
      ))}

      {/* Diamond mark */}
      <div style={{ position: 'absolute', top: '28%', left: 0, right: 0, textAlign: 'center', fontFamily: 'Jost, sans-serif', fontSize: 14 * s, color: P.accent }}>◆</div>

      {/* Giant season words */}
      <div style={{ position: 'absolute', top: '33%', left: 40 * s, right: 40 * s, textAlign: 'center' }}>
        <div style={{ fontFamily: '"Josefin Sans", sans-serif', fontSize: 90 * s, fontWeight: 700, color: '#F0EBE0', letterSpacing: '0.12em', lineHeight: 0.88, textTransform: 'uppercase' }}>
          {(f.season || 'SPRING\nSUMMER').split('\n').map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      </div>

      {/* Year */}
      <div style={{ position: 'absolute', top: '68%', left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: FONTS.subhead, fontSize: 26 * s, fontWeight: 400, fontStyle: 'italic', color: P.accent, letterSpacing: '0.7em' }}>
          {f.year || '2  0  2  6'}
        </div>
      </div>

      {/* Subtitle + rule */}
      <div style={{ position: 'absolute', top: '78%', left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 * s }}>
        <div style={{ fontFamily: FONTS.caption, fontSize: 8.5 * s, color: 'rgba(240,235,224,0.42)', letterSpacing: '0.55em', textTransform: 'uppercase' }}>
          {f.subtitle || 'THE DEFINITIVE GUIDE'}
        </div>
        <div style={{ width: 56 * s, height: 1, background: P.accent }} />
        <div style={{ fontFamily: FONTS.caption, fontSize: 8 * s, color: P.accent, letterSpacing: '0.5em', textTransform: 'uppercase' }}>
          {f.issue || 'ISSUE 01'}
        </div>
      </div>

      {/* Wordmark bottom */}
      <div style={{ position: 'absolute', bottom: 34 * s, left: 0, right: 0, textAlign: 'center', fontFamily: FONTS.caption, fontSize: 7 * s, color: 'rgba(240,235,224,0.15)', letterSpacing: '0.35em', textTransform: 'uppercase' }}>
        LUXURY WEDDING DIRECTORY
      </div>
    </div>
  );
}

function BehindScenes({ f, s, W, H }) {
  const P = PALETTES.white;
  const accent = '#B8926A';
  const stripTop = H * 0.2;
  const stripH = H * 0.37;
  const gapPx = 3 * s;
  const cellW = (W - gapPx * 3) / 4;
  const imgs = [
    f.image1 || D.bridalPrep,
    f.image2 || D.bridalPortrait,
    f.image3 || D.bouquet,
    f.image4 || D.tablescape,
  ];
  const notesY = stripTop + stripH + 54 * s;
  const noteColW = (W - 44 * s) / 2;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: '#FAFAF8' }}>
      {/* Header */}
      <div style={{ position: 'absolute', top: 24 * s, left: 22 * s, right: 22 * s }}>
        <div style={{ fontFamily: FONTS.caption, fontSize: 7.5 * s, color: accent, letterSpacing: '0.5em', textTransform: 'uppercase', marginBottom: 6 * s }}>
          {f.kicker || 'BEHIND THE SCENES'}
        </div>
        <div style={{ fontFamily: FONTS.subhead, fontSize: 38 * s, fontWeight: 400, fontStyle: 'italic', color: P.text, lineHeight: 1.0, width: '65%' }}>
          {f.headline || 'The Making of\na Perfect Day'}
        </div>
        <div style={{ width: W - 44 * s, height: 1, background: 'rgba(30,26,20,0.1)', marginTop: 10 * s }} />
      </div>

      {/* 4-wide horizontal image strip */}
      {imgs.map((img, i) => (
        <div key={i} style={{ position: 'absolute', left: i * (cellW + gapPx), top: stripTop, width: cellW, height: stripH, overflow: 'hidden' }}>
          <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ))}

      {/* Caption below strip */}
      <div style={{ position: 'absolute', top: stripTop + stripH + 10 * s, left: 22 * s, right: 22 * s, fontFamily: FONTS.editorial, fontSize: 9.5 * s, color: P.muted, lineHeight: 1.55, fontStyle: 'italic', textAlign: 'center' }}>
        {f.caption || 'Morning preparations — four hours before the ceremony.'}
      </div>
      <div style={{ position: 'absolute', top: stripTop + stripH + 38 * s, left: 22 * s, right: 22 * s, height: 1, background: 'rgba(30,26,20,0.08)' }} />

      {/* Two-column production notes */}
      <div style={{ position: 'absolute', top: notesY, left: 22 * s, width: noteColW, right: 'auto' }}>
        <div style={{ fontFamily: FONTS.editorial, fontSize: 9.5 * s, color: P.text, lineHeight: 1.72 }}>
          {f.notes_col1 || 'The florals arrived at six in the morning — three white vans carrying everything from the ceremony arch to the boutonnieres. Head florist Elara Jones spent five hours on the bridal bouquet alone.'}
        </div>
      </div>
      <div style={{ position: 'absolute', top: notesY, right: 22 * s, width: noteColW }}>
        <div style={{ fontFamily: FONTS.editorial, fontSize: 9.5 * s, color: P.text, lineHeight: 1.72 }}>
          {f.notes_col2 || 'By eleven, the ballroom had been transformed. Sixty tables laid with hand-pressed linen, crystal, and a single gardenia stem. The bridal suite looked out over cypress trees.'}
        </div>
      </div>

      {/* Credits footer */}
      {f.byline && (
        <div style={{ position: 'absolute', bottom: 16 * s, left: 22 * s, fontFamily: FONTS.caption, fontSize: 6.5 * s, color: P.muted, letterSpacing: '0.1em' }}>
          {f.byline}
        </div>
      )}
    </div>
  );
}

function HoneymoonDiary({ f, s, W, H }) {
  const P = PALETTES.midnight;
  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: '#0B1020' }}>
      {/* Left image panel */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: '46%', height: '100%', overflow: 'hidden' }}>
        <img src={f.image || D.maldives} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
        {/* Gradient overlay bottom of image */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '34%', background: 'linear-gradient(to top, rgba(11,16,32,0.82) 0%, transparent 100%)' }} />
        {/* Location overlay */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: `${14 * s}px ${14 * s}px ${16 * s}px` }}>
          <div style={{ fontFamily: '"Cinzel", serif', fontSize: 15 * s, color: P.accent, letterSpacing: '0.42em', textTransform: 'uppercase', marginBottom: 5 * s }}>
            {f.destination || 'THE MALDIVES'}
          </div>
          <div style={{ fontFamily: FONTS.caption, fontSize: 7.5 * s, color: 'rgba(240,235,224,0.45)', letterSpacing: '0.18em' }}>
            {f.coordinates || '3.2028° N  ·  73.2207° E'}
          </div>
        </div>
      </div>

      {/* Thin gold separator */}
      <div style={{ position: 'absolute', left: '46%', top: '4%', height: '92%', width: 1, background: P.accent }} />

      {/* Right diary panel */}
      <div style={{ position: 'absolute', left: '49%', top: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `${22 * s}px ${18 * s}px ${22 * s}px ${12 * s}px` }}>
        <div style={{ fontFamily: FONTS.caption, fontSize: 6.5 * s, color: P.accent, letterSpacing: '0.42em', textTransform: 'uppercase', marginBottom: 8 * s }}>
          HONEYMOON DIARY
        </div>
        <div style={{ width: 36 * s, height: 1, background: P.accent, marginBottom: 10 * s }} />
        <div style={{ fontFamily: FONTS.subhead, fontSize: 38 * s, fontWeight: 400, fontStyle: 'italic', color: '#F0EBE0', lineHeight: 1.0, marginBottom: 8 * s }}>
          {f.headline || 'Five Days\nin Paradise'}
        </div>
        {f.property && (
          <div style={{ fontFamily: FONTS.editorial, fontSize: 14 * s, color: P.accent, fontStyle: 'italic', marginBottom: 8 * s }}>
            {f.property}
          </div>
        )}
        <div style={{ width: '100%', height: 1, background: 'rgba(240,235,224,0.1)', marginBottom: 10 * s }} />
        <div style={{ fontFamily: FONTS.editorial, fontSize: 9.5 * s, color: 'rgba(240,235,224,0.8)', lineHeight: 1.78, fontStyle: 'italic', flex: 1, overflow: 'hidden' }}>
          {f.entry || 'The overwater villa is accessed by a wooden bridge that sways gently in the ocean breeze — a threshold between the ordinary world and something else entirely. Below the glass floor, nurse sharks move through warm water the colour of first light.\n\nOn the first morning, we woke to a private breakfast on the deck: papaya, cold-pressed juice, and the sound of nothing.'}
        </div>
        {/* Practical footer */}
        <div style={{ borderTop: `1px solid rgba(201,168,76,0.25)`, paddingTop: 8 * s, marginTop: 8 * s, display: 'flex', gap: 16 * s }}>
          {f.nights && <div style={{ fontFamily: FONTS.caption, fontSize: 7 * s, color: P.accent, letterSpacing: '0.22em', textTransform: 'uppercase' }}>{f.nights} NIGHTS</div>}
          {f.price_guide && <div style={{ fontFamily: FONTS.caption, fontSize: 7 * s, color: 'rgba(240,235,224,0.45)', letterSpacing: '0.1em' }}>{f.price_guide}</div>}
          {f.website && <div style={{ fontFamily: FONTS.editorial, fontSize: 8.5 * s, color: 'rgba(240,235,224,0.38)', fontStyle: 'italic', marginLeft: 'auto' }}>{f.website}</div>}
          {!f.nights && !f.price_guide && !f.website && (
            <>
              <div style={{ fontFamily: FONTS.caption, fontSize: 7 * s, color: P.accent, letterSpacing: '0.22em' }}>7 NIGHTS</div>
              <div style={{ fontFamily: FONTS.caption, fontSize: 7 * s, color: 'rgba(240,235,224,0.45)', letterSpacing: '0.1em' }}>FROM £14,000</div>
              <div style={{ fontFamily: FONTS.editorial, fontSize: 8.5 * s, color: 'rgba(240,235,224,0.35)', fontStyle: 'italic', marginLeft: 'auto' }}>soneva.com</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function TemplateCanvas({ templateId, fields = {}, pageSize = 'A4', width = 400, forCapture = false, fieldStyles = {} }) {
  const ratio  = PAGE_RATIOS[pageSize] || 1.4142;
  const height = Math.round(width * ratio);
  const s      = width / 400;

  // Merge fieldStyles overrides into fields for text rendering
  // Each template renderer is responsible for applying fieldStyles[fieldId] on its own text elements
  const f = fields;

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
    const props = { f, s, W: width, H: height, fieldStyles };
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
      case 'masthead':           return <TheMasthead       {...props} />;
      case 'floral-spread':      return <FloralSpread      {...props} />;
      case 'reception-table':    return <ReceptionTable    {...props} />;
      case 'ceremony-aisle':     return <CeremonyAisle     {...props} />;
      case 'couple-story':       return <CoupleStory       {...props} />;
      case 'beauty-edit':        return <BeautyEdit        {...props} />;
      case 'dress-detail':       return <DressDetail       {...props} />;
      case 'invitation-suite':   return <InvitationSuite   {...props} />;
      case 'cake-moment':        return <CakeMoment        {...props} />;
      case 'venue-portrait':     return <VenuePortrait     {...props} />;
      case 'fashion-plate':      return <FashionPlate      {...props} />;
      case 'honeymoon-edit':     return <HoneymoonEdit     {...props} />;
      case 'ring-edit':          return <RingEdit          {...props} />;
      case 'the-interview':      return <TheInterview      {...props} />;
      case 'dress-flat-lay':     return <DressFlatLay      {...props} />;
      case 'aerial-venue':       return <AerialVenue       {...props} />;
      case 'lux-grid':           return <LuxGrid           {...props} />;
      case 'full-bleed':         return <FullBleed         {...props} />;
      case 'venue-directory':        return <VenueDirectory        {...props} />;
      case 'planner-spotlight':      return <PlannerSpotlight      {...props} />;
      case 'editors-letter':         return <EditorsLetter         {...props} />;
      case 'about-page':             return <AboutPage             {...props} />;
      case 'back-cover':             return <BackCover             {...props} />;
      case 'full-page-ad':           return <FullPageAd            {...props} />;
      case 'product-showcase-ad':    return <ProductShowcaseAd     {...props} />;
      case 'venue-advertisement':    return <VenueAdvertisement    {...props} />;
      // Phase 2 variants
      case 'cover-split':            return <CoverSplit            {...props} />;
      case 'cover-typographic':      return <CoverTypographic      {...props} />;
      case 'feature-cinematic':      return <FeatureCinematic      {...props} />;
      case 'feature-minimal':        return <FeatureMinimal        {...props} />;
      case 'venue-skyline':          return <VenueSkyline          {...props} />;
      case 'venue-essay':            return <VenueEssay            {...props} />;
      case 'couple-gallery':         return <CoupleGallery         {...props} />;
      case 'story-chapter':          return <StoryChapter          {...props} />;
      // Phase 3 new categories
      case 'styled-shoot':           return <StyledShoot           {...props} />;
      case 'wedding-gallery':        return <WeddingGallery        {...props} />;
      case 'supplier-credits':       return <SupplierCredits       {...props} />;
      case 'regional-opener':        return <RegionalOpener        {...props} />;
      case 'planning-edit':          return <PlanningEdit          {...props} />;
      case 'season-opener':          return <SeasonOpener          {...props} />;
      case 'behind-scenes':          return <BehindScenes          {...props} />;
      case 'honeymoon-diary':        return <HoneymoonDiary        {...props} />;
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
