// Renders structured article content blocks with luxury editorial typography
import { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import ShopTheStory, { ShopTheLook } from './ShopTheStory';
import { getProductsByCollection, getProductById } from '../data/products';
import { StyleAdvice, MoodBoard, DesignerSpotlight } from './FashionModules';
import { getMagTheme, FD, FU, GOLD_CONST as GOLD } from '../magazineTheme';
import ExternalLinkModal from '../../../components/ExternalLinkModal';
import { trackExternalClick, hasSeenModalThisSession, markModalSeen } from '../../../services/outboundClickService';
import ImageInteractionBar from '../../../components/media/ImageInteractionBar';
import ReferenceHoverCard from '../../../components/editorial/ReferenceHoverCard';

// ── Lazy-loaded editorial blocks ────────────────────────────────────────────
const VideoEmbedBlock = lazy(() => import('./blocks/VideoEmbedBlock'));
const MoodboardGridBlock = lazy(() => import('./blocks/MoodboardGridBlock'));

const FS = "Georgia, 'Times New Roman', serif";

// Inject spin keyframe once (used by VideoEmbedWithLoader skeleton)
if (typeof document !== 'undefined' && !document.getElementById('ab-spin-kf')) {
  const s = document.createElement('style');
  s.id = 'ab-spin-kf';
  s.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
  document.head.appendChild(s);
}

// ── Gallery Lightbox (professional — swipe, keyboard, dots, credits) ────────────
function GalleryLightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const touchStartX = useRef(null);
  const total = images.length;

  const prev = useCallback((e) => { e?.stopPropagation(); setIdx(i => (i - 1 + total) % total); }, [total]);
  const next = useCallback((e) => { e?.stopPropagation(); setIdx(i => (i + 1) % total); }, [total]);

  const img    = images[idx];
  const src    = typeof img === 'string' ? img : img?.src;
  const caption = typeof img === 'object' ? (img.caption || img.alt || '') : '';
  const credit  = typeof img === 'object' ? img.credit : '';

  const handleKey = useCallback((e) => {
    if (e.key === 'ArrowLeft')  prev();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'Escape')     onClose();
  }, [prev, next, onClose]);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 48) dx < 0 ? next() : prev();
    touchStartX.current = null;
  };

  // Formatted counter: 01 / 12
  const counter = `${String(idx + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(4,3,2,0.96)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
      onClick={onClose} onKeyDown={handleKey} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
      tabIndex={-1} ref={el => el?.focus()}
    >
      {/* Close */}
      <button onClick={onClose}
        style={{ position: 'absolute', top: 20, right: 24, background: 'none', border: 'none', color: 'rgba(245,240,232,0.5)', fontSize: 24, cursor: 'pointer', lineHeight: 1, padding: 6, transition: 'color 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.color = '#f5f0e8'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.5)'}>✕</button>

      {/* Counter */}
      <div style={{ position: 'absolute', top: 26, left: '50%', transform: 'translateX(-50%)', fontFamily: FU, fontSize: 10, color: 'rgba(245,240,232,0.35)', letterSpacing: '0.18em' }}>{counter}</div>

      {/* Prev arrow */}
      {total > 1 && (
        <button onClick={prev}
          style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(245,240,232,0.5)', width: 48, height: 48, borderRadius: '50%', cursor: 'pointer', fontSize: 22, lineHeight: '48px', textAlign: 'center', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = `${GOLD}18`; e.currentTarget.style.borderColor = `${GOLD}40`; e.currentTarget.style.color = GOLD; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(245,240,232,0.5)'; }}>
          ‹
        </button>
      )}

      {/* Image */}
      <div style={{ maxWidth: '84vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }} onClick={e => e.stopPropagation()}>
        <img src={src} alt={caption}
          style={{ maxWidth: '84vw', maxHeight: '72vh', objectFit: 'contain', display: 'block', borderRadius: 2, transition: 'opacity 0.25s ease' }}
        />
        {(caption || credit) && (
          <div style={{ textAlign: 'center' }}>
            {caption && <p style={{ fontFamily: FU, fontSize: 12, color: 'rgba(245,240,232,0.5)', margin: 0, fontStyle: 'italic' }}>{caption}</p>}
            {credit && <p style={{ fontFamily: FU, fontSize: 10, color: `${GOLD}90`, margin: '5px 0 0', letterSpacing: '0.1em' }}>© {credit}</p>}
          </div>
        )}
        <ImageInteractionBar
          mediaId={typeof img === 'object' ? img.media_id || null : null}
          listingId={typeof img === 'object' ? img.listing_id || null : null}
          imageUrl={src}
          listingName={typeof img === 'object' ? (img.listing_name || img.credit || null) : null}
        />
      </div>

      {/* Next arrow */}
      {total > 1 && (
        <button onClick={next}
          style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(245,240,232,0.5)', width: 48, height: 48, borderRadius: '50%', cursor: 'pointer', fontSize: 22, lineHeight: '48px', textAlign: 'center', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = `${GOLD}18`; e.currentTarget.style.borderColor = `${GOLD}40`; e.currentTarget.style.color = GOLD; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(245,240,232,0.5)'; }}>
          ›
        </button>
      )}

      {/* Dot indicators */}
      {total > 1 && total <= 12 && (
        <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
          {images.map((_, j) => (
            <button key={j} onClick={() => setIdx(j)}
              style={{ width: j === idx ? 20 : 6, height: 3, borderRadius: 2, border: 'none', cursor: 'pointer', padding: 0, background: j === idx ? GOLD : 'rgba(245,240,232,0.25)', transition: 'all 0.25s ease' }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── FAQ accordion item ───────────────────────────────────────────────────────
function FaqItem({ question, answer, isLight, TEXT, MUTED, GOLD, DIVBG }) {
  const [open, setOpen] = useState(false);
  if (!question) return null;
  return (
    <div style={{ borderBottom: `1px solid ${DIVBG}` }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '16px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, textAlign: 'left',
      }}>
        <span style={{ fontFamily: "'Urbanist', sans-serif", fontSize: 14, fontWeight: 600, color: TEXT, lineHeight: 1.4 }}>{question}</span>
        <span style={{ fontSize: 18, color: GOLD, transition: 'transform 0.25s ease', transform: open ? 'rotate(45deg)' : 'rotate(0deg)', flexShrink: 0 }}>+</span>
      </button>
      {open && (
        <div style={{ padding: '0 20px 16px', fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 14, color: MUTED, lineHeight: 1.7 }}
          dangerouslySetInnerHTML={{ __html: answer || '' }} />
      )}
    </div>
  );
}

// ── Slider block ──────────────────────────────────────────────────────────────
function SliderBlock({ images = [], autoplay = false, isLight, onLightbox }) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);
  const GOLD_L = GOLD;
  const total = images.length;
  const prev = () => setIdx(i => (i - 1 + total) % total);
  const next = useCallback(() => setIdx(i => (i + 1) % total), [total]);
  useEffect(() => {
    if (!autoplay || total < 2) return;
    timerRef.current = setInterval(next, 4000);
    return () => clearInterval(timerRef.current);
  }, [autoplay, next, total]);
  if (!total) return null;
  const img = images[idx];
  const src = typeof img === 'string' ? img : img?.src;
  const cap = typeof img === 'object' ? img.caption : '';
  const focal = typeof img === 'object' ? (img.focal || img.focalPoint || 'center') : 'center';
  return (
    <figure style={{ margin: '40px 0', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'relative' }}>
        <img src={src} alt={cap || ''} loading="lazy"
          onClick={onLightbox ? () => onLightbox({ images, startIndex: idx }) : undefined}
          style={{ width: '100%', display: 'block', borderRadius: 2, maxHeight: 520, objectFit: 'cover', objectPosition: focal, cursor: onLightbox ? 'zoom-in' : 'default' }} />
        {total > 1 && (
          <>
            <button onClick={prev} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: 18, lineHeight: '36px', textAlign: 'center' }}>‹</button>
            <button onClick={next} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: 18, lineHeight: '36px', textAlign: 'center' }}>›</button>
            <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
              {images.map((_, j) => (
                <button key={j} onClick={() => setIdx(j)} style={{ width: 20, height: 2, borderRadius: 1, border: 'none', cursor: 'pointer', background: j === idx ? GOLD_L : 'rgba(255,255,255,0.4)', padding: 0 }} />
              ))}
            </div>
          </>
        )}
      </div>
      {cap && <figcaption style={{ fontFamily: FU, fontSize: 11, color: 'rgba(150,140,130,0.8)', marginTop: 8, fontStyle: 'italic' }}>{cap}</figcaption>}
    </figure>
  );
}

// ── Masonry block ─────────────────────────────────────────────────────────────
function MasonryBlock({ images = [], columns = 2, onLightbox }) {
  if (!images.length) return null;
  const allImgs = images.filter(img => typeof img === 'string' ? img : img?.src);
  return (
    <div style={{ margin: '40px 0', columns, columnGap: 12 }}>
      {allImgs.map((img, i) => {
        const src = typeof img === 'string' ? img : img?.src;
        const cap = typeof img === 'object' ? img.caption : '';
        const focal = typeof img === 'object' ? (img.focal || img.focalPoint || 'center') : 'center';
        return (
          <figure key={i} style={{ breakInside: 'avoid', margin: '0 0 12px', cursor: onLightbox ? 'zoom-in' : 'default' }}>
            <img src={src} alt={cap || ''} loading="lazy"
              onClick={onLightbox ? () => onLightbox({ images: allImgs, startIndex: i }) : undefined}
              style={{ width: '100%', display: 'block', borderRadius: 2, objectFit: 'cover', objectPosition: focal, transition: 'opacity 0.2s' }}
              onMouseEnter={onLightbox ? e => e.currentTarget.style.opacity = '0.88' : undefined}
              onMouseLeave={onLightbox ? e => e.currentTarget.style.opacity = '1' : undefined}
            />
            {cap && <figcaption style={{ fontFamily: FU, fontSize: 10, color: 'rgba(150,140,130,0.75)', marginTop: 4, fontStyle: 'italic' }}>{cap}</figcaption>}
          </figure>
        );
      })}
    </div>
  );
}

// ── Dual Image block ──────────────────────────────────────────────────────────
function DualImageBlock({ imageA, imageB, layout = '50/50', onLightbox }) {
  const widths = { '60/40': ['60%', '40%'], '40/60': ['40%', '60%'] };
  const [wA, wB] = widths[layout] || ['50%', '50%'];
  const dualImgs = [imageA, imageB].filter(Boolean);
  const renderImg = (img, w, imgIdx) => {
    const src = typeof img === 'string' ? img : img?.src;
    const cap = typeof img === 'object' ? img.caption : '';
    const focal = typeof img === 'object' ? (img.focal || img.focalPoint || 'center') : 'center';
    return (
      <figure style={{ flex: `0 0 ${w}`, margin: 0, cursor: onLightbox ? 'zoom-in' : 'default' }}>
        <img src={src} alt={cap || ''} loading="lazy"
          onClick={onLightbox ? () => onLightbox({ images: dualImgs, startIndex: imgIdx }) : undefined}
          style={{ width: '100%', display: 'block', borderRadius: 2, objectFit: 'cover', objectPosition: focal, aspectRatio: '4/3', transition: 'opacity 0.2s' }}
          onMouseEnter={onLightbox ? e => e.currentTarget.style.opacity = '0.88' : undefined}
          onMouseLeave={onLightbox ? e => e.currentTarget.style.opacity = '1' : undefined}
        />
        {cap && <figcaption style={{ fontFamily: FU, fontSize: 10, color: 'rgba(150,140,130,0.75)', marginTop: 4, fontStyle: 'italic' }}>{cap}</figcaption>}
      </figure>
    );
  };
  return (
    <div style={{ margin: '40px 0', display: 'flex', gap: 12 }}>
      {imageA && renderImg(imageA, wA, 0)}
      {imageB && renderImg(imageB, wB, 1)}
    </div>
  );
}

// ── Lookbook block ────────────────────────────────────────────────────────────
function LookbookBlock({ images = [], columns = 3, onLightbox }) {
  if (!images.length) return null;
  const allImgs = images.filter(img => typeof img === 'string' ? img : img?.src);
  return (
    <div style={{ margin: '40px 0', display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 8 }}>
      {allImgs.map((img, i) => {
        const src = typeof img === 'string' ? img : img?.src;
        const label = typeof img === 'object' ? (img.label || img.caption) : '';
        const focal = typeof img === 'object' ? (img.focal || img.focalPoint || 'center') : 'center';
        return (
          <figure key={i} style={{ margin: 0, cursor: onLightbox ? 'zoom-in' : 'default' }}>
            <img src={src} alt={label || ''} loading="lazy"
              onClick={onLightbox ? () => onLightbox({ images: allImgs, startIndex: i }) : undefined}
              style={{ width: '100%', display: 'block', borderRadius: 2, objectFit: 'cover', objectPosition: focal, aspectRatio: '3/4', transition: 'opacity 0.2s' }}
              onMouseEnter={onLightbox ? e => e.currentTarget.style.opacity = '0.88' : undefined}
              onMouseLeave={onLightbox ? e => e.currentTarget.style.opacity = '1' : undefined}
            />
            {label && <figcaption style={{ fontFamily: FU, fontSize: 10, color: 'rgba(150,140,130,0.75)', marginTop: 4, textAlign: 'center' }}>{label}</figcaption>}
          </figure>
        );
      })}
    </div>
  );
}

// ── Before/After block ────────────────────────────────────────────────────────
function BeforeAfterBlock({ before, after, beforeLabel = 'Before', afterLabel = 'After', onLightbox }) {
  const baImgs = [before, after].filter(Boolean);
  const renderSide = (img, label, imgIdx) => {
    const src = typeof img === 'string' ? img : img?.src;
    const focal = typeof img === 'object' ? (img.focal || img.focalPoint || 'center') : 'center';
    return (
      <figure style={{ flex: 1, margin: 0, position: 'relative', cursor: onLightbox ? 'zoom-in' : 'default' }}>
        <img src={src} alt={label} loading="lazy"
          onClick={onLightbox ? () => onLightbox({ images: baImgs, startIndex: imgIdx }) : undefined}
          style={{ width: '100%', display: 'block', borderRadius: 2, objectFit: 'cover', objectPosition: focal, aspectRatio: '4/3', transition: 'opacity 0.2s' }}
          onMouseEnter={onLightbox ? e => e.currentTarget.style.opacity = '0.88' : undefined}
          onMouseLeave={onLightbox ? e => e.currentTarget.style.opacity = '1' : undefined}
        />
        <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.6)', color: '#fff', fontFamily: FU, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 2 }}>{label}</div>
      </figure>
    );
  };
  return (
    <div style={{ margin: '40px 0', display: 'flex', gap: 12 }}>
      {before && renderSide(before, beforeLabel, 0)}
      {after  && renderSide(after,  afterLabel,  1)}
    </div>
  );
}

// ── Video Gallery block ───────────────────────────────────────────────────────
function VideoGalleryBlock({ videos = [] }) {
  if (!videos.length) return null;
  return (
    <div style={{ margin: '40px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
      {videos.map((v, i) => (
        <figure key={i} style={{ margin: 0 }}>
          <video
            src={v.src}
            poster={v.poster}
            controls
            style={{ width: '100%', display: 'block', borderRadius: 2, background: '#000', aspectRatio: '16/9', objectFit: 'cover' }}
          />
          {v.title && <p style={{ fontFamily: FU, fontSize: 12, color: 'rgba(150,140,130,0.9)', margin: '6px 0 0', fontWeight: 600 }}>{v.title}</p>}
          {v.caption && <p style={{ fontFamily: FU, fontSize: 11, color: 'rgba(150,140,130,0.65)', margin: '2px 0 0', fontStyle: 'italic' }}>{v.caption}</p>}
        </figure>
      ))}
    </div>
  );
}

// ── Video embed with loading skeleton ────────────────────────────────────────
function VideoEmbedWithLoader({ embedUrl, caption, MUTED }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <figure style={{ margin: '40px 0' }}>
      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 2, background: '#0f0d0a' }}>
        {/* Skeleton shown until iframe fires onLoad */}
        {!loaded && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid rgba(201,168,76,0.25)', borderTopColor: '#C9A84C', animation: 'spin 0.9s linear infinite' }} />
            <span style={{ fontFamily: FU, fontSize: 10, color: 'rgba(201,168,76,0.5)', letterSpacing: '0.12em' }}>Loading video…</span>
          </div>
        )}
        <iframe
          src={embedUrl}
          title={caption || 'Embedded video'}
          onLoad={() => setLoaded(true)}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', opacity: loaded ? 1 : 0, transition: 'opacity 0.4s ease' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      {caption && (
        <figcaption style={{ fontFamily: FU, fontSize: 11, color: MUTED, marginTop: 10, fontStyle: 'italic' }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// ── Main ArticleBody ──────────────────────────────────────────────────────────
export default function ArticleBody({ content = [], isLight = true }) {
  const T = getMagTheme(isLight);
  const [lightbox, setLightbox] = useState(null); // { images, startIndex }
  const [exitConfig, setExitConfig] = useState(null); // { url, name } for vendor credit modal
  const [hoverRef, setHoverRef] = useState(null); // hover preview card state
  const hoverTimer = useRef(null);

  const handleVendorLink = useCallback((url, name) => {
    if (!url) return;
    const abs = url.startsWith('http') ? url : `https://${url}`;
    if (!hasSeenModalThisSession(abs)) {
      setExitConfig({ url: abs, name });
    } else {
      trackExternalClick({ entityType: 'magazine', entityId: null, venueId: null, linkType: 'website', url: abs });
      window.open(abs, '_blank', 'noopener,noreferrer');
    }
  }, []);

  const TEXT  = T.text;
  const BODY  = isLight ? '#2a2620' : 'rgba(245,240,232,0.85)';
  const HEAD  = isLight ? '#0f0e0a' : T.text;
  const MUTED = T.muted;
  const DIVBG = T.border2;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Scoped WYSIWYG styles, respects isLight */}
      <style>{`
        .ab-img-wide {
          margin: 44px -60px;
          width: calc(100% + 120px);
        }
        @media (max-width: 900px) {
          .ab-img-wide { margin: 32px 0 !important; width: 100% !important; }
        }
        .ab-wysiwyg h2 { font-family: ${FD}; font-size: clamp(22px, 2.8vw, 30px); font-weight: 400; color: ${HEAD}; margin: 44px 0 18px; line-height: 1.1; letter-spacing: -0.01em; }
        .ab-wysiwyg h3 { font-family: ${FU}; font-size: 12px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: ${GOLD}; margin: 34px 0 14px; }
        .ab-wysiwyg h4 { font-family: ${FU}; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: ${MUTED}; margin: 24px 0 10px; }
        .ab-wysiwyg p  { font-family: ${FS}; font-size: clamp(16px, 1.7vw, 18px); color: ${BODY}; line-height: 1.85; margin: 0 0 26px; letter-spacing: 0.01em; }
        .ab-wysiwyg ul, .ab-wysiwyg ol { font-family: ${FS}; font-size: clamp(15px, 1.6vw, 17px); color: ${BODY}; padding-left: 28px; margin: 0 0 26px; line-height: 1.8; }
        .ab-wysiwyg li { margin-bottom: 6px; }
        .ab-wysiwyg blockquote { border-left: 3px solid ${GOLD}; padding: 8px 0 8px 28px; margin: 36px 0; }
        .ab-wysiwyg blockquote p { font-family: ${FD}; font-size: clamp(18px, 2.2vw, 24px); font-style: italic; color: ${TEXT}; line-height: 1.55; margin: 0; }
        .ab-wysiwyg hr { border: none; border-top: 1px solid ${DIVBG}; margin: 44px 0; }
        .ab-wysiwyg strong, .ab-wysiwyg b { color: ${TEXT}; font-weight: 600; }
        .ab-wysiwyg a { color: ${GOLD}; }
        .ab-wysiwyg code { background: rgba(201,169,110,0.08); padding: 1px 6px; border-radius: 2px; font-family: monospace; font-size: 14px; color: ${TEXT}; }
        .ab-gallery-img { cursor: zoom-in; transition: opacity 0.2s; }
        .ab-gallery-img:hover { opacity: 0.88; }
      `}</style>

      {/* Lightbox */}
      {lightbox && (
        <GalleryLightbox
          images={lightbox.images}
          startIndex={lightbox.startIndex}
          onClose={() => setLightbox(null)}
          isLight={isLight}
        />
      )}

      {content.map((block, i) => {
        switch (block.type) {
          case 'intro':
            return (
              <p key={i}
                dangerouslySetInnerHTML={{ __html: block.text }}
                style={{
                  fontFamily: FD, fontSize: 'clamp(20px, 2.5vw, 26px)',
                  fontWeight: 400, fontStyle: 'italic',
                  color: TEXT, lineHeight: 1.65,
                  margin: '0 0 32px',
                  borderLeft: `3px solid ${GOLD}`,
                  paddingLeft: 24,
                }}
              />
            );

          case 'paragraph':
            return (
              <p key={i}
                dangerouslySetInnerHTML={{ __html: block.text }}
                style={{
                  fontFamily: FS, fontSize: 'clamp(16px, 1.7vw, 18px)',
                  fontWeight: 400, color: BODY,
                  lineHeight: 1.85, margin: '0 0 28px',
                  letterSpacing: '0.01em',
                }}
              />
            );

          case 'body_wysiwyg':
            return (
              <div
                key={i}
                className="ab-wysiwyg"
                dangerouslySetInnerHTML={{ __html: block.text }}
              />
            );

          case 'heading': {
            const lvl = block.level || 2;
            const headingStyles = {
              1: { fontFamily: FD, fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 400, color: HEAD, margin: '56px 0 24px', lineHeight: 1.05, letterSpacing: '-0.02em' },
              2: { fontFamily: FD, fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 400, color: HEAD, margin: '48px 0 20px', lineHeight: 1.1, letterSpacing: '-0.01em' },
              3: { fontFamily: FU, fontSize: 13, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: GOLD, margin: '36px 0 16px' },
              4: { fontFamily: FU, fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: MUTED, margin: '24px 0 10px' },
            };
            const Tag = `h${lvl}`;
            return <Tag key={i} style={headingStyles[lvl] || headingStyles[2]}>{block.text}</Tag>;
          }

          case 'image': {
            const imgSrc = block.src || block.url;
            if (!imgSrc) return null;
            return (
              <figure key={i} className={block.wide ? 'ab-img-wide' : ''} style={{ margin: block.wide ? undefined : '40px 0' }}>
                <img
                  src={imgSrc}
                  alt={block.alt || block.caption || ''}
                  loading="lazy"
                  style={{
                    width: '100%', display: 'block', borderRadius: 2,
                    objectPosition: block.focal || 'center',
                  }}
                />
                {(block.caption || block.credit) && (
                  <figcaption style={{
                    fontFamily: FU, fontSize: 11, fontWeight: 300,
                    color: MUTED, marginTop: 10,
                    lineHeight: 1.5, fontStyle: 'italic',
                    textAlign: 'right',
                    display: 'flex', justifyContent: 'space-between', gap: 12,
                  }}>
                    {block.caption && <span>{block.caption}</span>}
                    {block.credit && <span style={{ color: `${GOLD}80` }}>© {block.credit}</span>}
                  </figcaption>
                )}
                <div style={{
                  marginTop: 10, paddingTop: 10,
                  borderTop: `1px solid ${DIVBG}`,
                }}>
                  <ImageInteractionBar
                    mediaId={block.media_id || null}
                    listingId={block.listing_id || null}
                    imageUrl={imgSrc}
                    listingName={block.listing_name || block.credit || null}
                    compact
                  />
                </div>
              </figure>
            );
          }

          case 'video': {
            const videoSrc = block.src || block.url;
            if (!videoSrc) return null;
            return (
              <figure key={i} style={{ margin: '40px 0' }}>
                <video
                  src={videoSrc}
                  poster={block.poster}
                  controls={!block.autoplay}
                  autoPlay={block.autoplay}
                  muted={block.muted !== false}
                  loop={block.loop}
                  playsInline
                  style={{ width: '100%', display: 'block', borderRadius: 2, background: '#000' }}
                />
                {(block.caption || block.credit) && (
                  <figcaption style={{
                    fontFamily: FU, fontSize: 11, color: MUTED,
                    marginTop: 10, display: 'flex', justifyContent: 'space-between', gap: 12,
                    fontStyle: 'italic',
                  }}>
                    {block.caption && <span>{block.caption}</span>}
                    {block.credit && <span style={{ color: `${GOLD}80` }}>© {block.credit}</span>}
                  </figcaption>
                )}
              </figure>
            );
          }

          case 'quote':
            return (
              <blockquote key={i} style={{
                margin: '48px 0',
                borderLeft: `3px solid ${GOLD}`,
                paddingLeft: 32,
              }}>
                <p style={{
                  fontFamily: FD, fontSize: 'clamp(20px, 2.5vw, 28px)',
                  fontWeight: 400, fontStyle: 'italic',
                  color: TEXT, lineHeight: 1.55, margin: '0 0 14px',
                }}>
                  "{block.text}"
                </p>
                {block.attribution && (
                  <cite style={{
                    fontFamily: FU, fontSize: 11, fontWeight: 600,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: GOLD, fontStyle: 'normal',
                  }}>
                   , {block.attribution}
                  </cite>
                )}
              </blockquote>
            );

          case 'divider':
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                margin: '48px 0',
              }}>
                <div style={{ flex: 1, height: 1, background: DIVBG }} />
                <span style={{ color: GOLD, fontSize: 10, letterSpacing: '0.3em' }}>✦</span>
                <div style={{ flex: 1, height: 1, background: DIVBG }} />
              </div>
            );

          case 'gallery': {
            // Support both old format (string[]) and new rich format (object[])
            const images = block.images || [];
            if (!images.length) return null;
            const cols = images.length === 2 ? 2 : images.length === 1 ? 1 : 3;
            return (
              <div key={i}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${cols}, 1fr)`,
                  gap: 10, margin: '40px 0 8px',
                }}>
                  {images.map((img, gi) => {
                    const src = typeof img === 'string' ? img : img?.src;
                    const alt = typeof img === 'object' ? (img.alt || img.caption || '') : '';
                    return (
                      <div key={gi} style={{ position: 'relative', overflow: 'hidden', borderRadius: 2 }}>
                        <img
                          src={src} alt={alt} loading="lazy"
                          className="ab-gallery-img"
                          onClick={() => setLightbox({ images, startIndex: gi })}
                          style={{ width: '100%', aspectRatio: cols === 1 ? '16/9' : '1', objectFit: 'cover', display: 'block' }}
                        />
                        {gi === 0 && images.length > 1 && (
                          <div style={{
                            position: 'absolute', bottom: 8, right: 8,
                            background: 'rgba(0,0,0,0.6)', color: '#fff',
                            fontFamily: FU, fontSize: 10, padding: '3px 7px',
                            borderRadius: 2, letterSpacing: '0.06em',
                          }}>
                            1 / {images.length}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Captions row for first image with caption */}
                {images[0]?.caption && (
                  <p style={{ fontFamily: FU, fontSize: 11, color: MUTED, fontStyle: 'italic', margin: '6px 0 32px', textAlign: 'right' }}>
                    {images[0].caption}
                  </p>
                )}
              </div>
            );
          }

          // ── Fashion Commerce Blocks ──────────────────────────────────────────

          case 'shop_the_story':
            return (
              <ShopTheStory
                key={i}
                headline={block.headline || 'Shop the Story'}
                categories={block.categories || []}
                isLight={isLight}
              />
            );

          case 'shop_the_look': {
            const lookProducts = (block.productIds || []).map(id => getProductById(id)).filter(Boolean);
            return <ShopTheLook key={i} products={lookProducts} headline={block.headline} isLight={isLight} />;
          }

          case 'product_row': {
            const rowProds = block.collectionId
              ? getProductsByCollection(block.collectionId)
              : (block.productIds || []).map(id => getProductById(id)).filter(Boolean);
            return <ShopTheLook key={i} products={rowProds} headline={block.headline} isLight={isLight} />;
          }

          case 'mood_board':
            return (
              <div key={i} style={{ margin: '48px 0' }}>
                <MoodBoard title={block.title} images={block.images || []} isLight={isLight} />
              </div>
            );

          case 'style_tip':
            return (
              <div key={i} style={{ margin: '48px 0' }}>
                <StyleAdvice
                  heading={block.heading}
                  body={block.body}
                  tip={block.tip}
                  author={block.author}
                  isLight={isLight}
                />
              </div>
            );

          case 'brand_spotlight':
            return (
              <div key={i} style={{ margin: '48px -60px' }}>
                <DesignerSpotlight designer={block.designer} isLight={isLight} />
              </div>
            );

          case 'embed': {
            if (!block.url) return null;
            const getEmbedUrl = (url) => {
              const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
              if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
              const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
              if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
              return null;
            };
            const embedUrl = getEmbedUrl(block.url);
            if (!embedUrl) return null;
            return <VideoEmbedWithLoader key={i} embedUrl={embedUrl} caption={block.caption} MUTED={MUTED} />;
          }

          case 'slider':
            return <SliderBlock key={i} images={block.images || []} autoplay={block.autoplay} isLight={isLight} onLightbox={setLightbox} />;

          case 'masonry':
            return <MasonryBlock key={i} images={block.images || []} columns={block.columns || 2} onLightbox={setLightbox} />;

          case 'dual_image':
            return <DualImageBlock key={i} imageA={block.imageA} imageB={block.imageB} layout={block.layout} onLightbox={setLightbox} />;

          case 'lookbook':
            return <LookbookBlock key={i} images={block.images || []} columns={block.columns || 3} onLightbox={setLightbox} />;

          case 'before_after':
            return <BeforeAfterBlock key={i} before={block.before} after={block.after} beforeLabel={block.beforeLabel} afterLabel={block.afterLabel} onLightbox={setLightbox} />;

          case 'video_gallery':
            return <VideoGalleryBlock key={i} videos={block.videos || []} />;

          // ── Editorial blocks ─────────────────────────────────────────────
          case 'full_width_image': {
            if (!block.src) return null;
            return (
              <figure key={i} className="ab-img-wide" style={{ margin: '40px -60px' }}>
                <img src={block.src} alt={block.alt || block.caption || ''} loading="lazy" style={{ width: '100%', display: 'block', borderRadius: 2, objectPosition: block.focal || 'center' }} />
                {(block.caption || block.credit) && (
                  <figcaption style={{ fontFamily: FU, fontSize: 11, fontWeight: 300, color: MUTED, marginTop: 10, lineHeight: 1.5, fontStyle: 'italic', display: 'flex', justifyContent: 'space-between', gap: 12, padding: '0 60px' }}>
                    {block.caption && <span>{block.caption}</span>}
                    {block.credit && <span style={{ color: `${GOLD}80` }}>© {block.credit}</span>}
                  </figcaption>
                )}
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${DIVBG}`, padding: '10px 60px 0' }}>
                  <ImageInteractionBar
                    mediaId={block.media_id || null}
                    listingId={block.listing_id || null}
                    imageUrl={block.src}
                    listingName={block.listing_name || block.credit || null}
                    compact
                  />
                </div>
              </figure>
            );
          }

          case 'image_story': {
            if (!block.src && !block.text) return null;
            const isLeft = (block.layout || 'image-left') === 'image-left';
            const imgStoryEl = block.src ? (
              <figure style={{ flex: 1, margin: 0 }}>
                <img src={block.src} alt={block.alt || block.caption || ''} loading="lazy" style={{ width: '100%', display: 'block', borderRadius: 2, objectFit: 'cover', aspectRatio: '3/4', objectPosition: block.focal || 'center' }} />
                {(block.caption || block.credit) && (
                  <figcaption style={{ fontFamily: FU, fontSize: 10, color: MUTED, marginTop: 8, fontStyle: 'italic', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    {block.caption && <span>{block.caption}</span>}
                    {block.credit && <span style={{ color: `${GOLD}80` }}>© {block.credit}</span>}
                  </figcaption>
                )}
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${DIVBG}` }}>
                  <ImageInteractionBar
                    mediaId={block.media_id || null}
                    listingId={block.listing_id || null}
                    imageUrl={block.src}
                    listingName={block.listing_name || block.credit || null}
                    compact
                  />
                </div>
              </figure>
            ) : null;
            const textStoryEl = block.text ? (
              <div className="ab-wysiwyg" style={{ flex: 1, alignSelf: 'center' }} dangerouslySetInnerHTML={{ __html: block.text }} />
            ) : null;
            return (
              <div key={i} style={{ margin: '48px 0', display: 'flex', gap: 'clamp(20px, 3vw, 40px)', flexDirection: isLeft ? 'row' : 'row-reverse', alignItems: 'flex-start' }}>
                {imgStoryEl}
                {textStoryEl}
              </div>
            );
          }

          case 'two_image_spread': {
            const tisImgs = block.images || [];
            if (!tisImgs.some(img => img?.src)) return null;
            return (
              <div key={i} style={{ margin: '40px 0', display: 'flex', gap: 12 }}>
                {tisImgs.map((img, gi) => {
                  if (!img?.src) return null;
                  return (
                    <figure key={gi} style={{ flex: 1, margin: 0 }}>
                      <img src={img.src} alt={img.alt || img.caption || ''} loading="lazy" className="ab-gallery-img"
                        onClick={() => setLightbox({ images: tisImgs.filter(im => im?.src), startIndex: gi })}
                        style={{ width: '100%', display: 'block', borderRadius: 2, objectFit: 'cover', aspectRatio: '3/2', objectPosition: img.focal || 'center' }} />
                      {(img.caption || img.credit) && (
                        <figcaption style={{ fontFamily: FU, fontSize: 10, color: MUTED, marginTop: 6, fontStyle: 'italic', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                          {img.caption && <span>{img.caption}</span>}
                          {img.credit && <span style={{ color: `${GOLD}80` }}>© {img.credit}</span>}
                        </figcaption>
                      )}
                    </figure>
                  );
                })}
              </div>
            );
          }

          case 'three_image_strip': {
            const stripImgs = block.images || [];
            if (!stripImgs.some(img => img?.src)) return null;
            return (
              <div key={i} style={{ margin: '40px 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {stripImgs.map((img, gi) => {
                  if (!img?.src) return null;
                  return (
                    <figure key={gi} style={{ margin: 0 }}>
                      <img src={img.src} alt={img.alt || img.caption || ''} loading="lazy" className="ab-gallery-img"
                        onClick={() => setLightbox({ images: stripImgs.filter(im => im?.src), startIndex: gi })}
                        style={{ width: '100%', display: 'block', borderRadius: 2, objectFit: 'cover', aspectRatio: '4/3', objectPosition: img.focal || 'center' }} />
                      {(img.caption || img.credit) && (
                        <figcaption style={{ fontFamily: FU, fontSize: 10, color: MUTED, marginTop: 6, fontStyle: 'italic', textAlign: 'center' }}>
                          {img.caption && <span>{img.caption}</span>}
                          {img.credit && <span style={{ display: 'block', color: `${GOLD}80`, fontSize: 9 }}>© {img.credit}</span>}
                        </figcaption>
                      )}
                    </figure>
                  );
                })}
              </div>
            );
          }

          case 'quote_highlight': {
            if (!block.text) return null;
            return (
              <div key={i} style={{ margin: '56px 0', textAlign: 'center', padding: '40px 20px', borderTop: `1px solid ${DIVBG}`, borderBottom: `1px solid ${DIVBG}` }}>
                <div style={{ fontSize: 48, color: GOLD, lineHeight: 1, marginBottom: 16 }}>"</div>
                <p style={{ fontFamily: FD, fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 400, fontStyle: 'italic', color: TEXT, lineHeight: 1.5, margin: '0 auto 20px', maxWidth: 620 }}>
                  {block.text}
                </p>
                {block.attribution && (
                  <cite style={{ fontFamily: FU, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, fontStyle: 'normal', display: 'block' }}>
                   , {block.attribution}
                  </cite>
                )}
                {block.source && (
                  <span style={{ fontFamily: FU, fontSize: 10, color: MUTED, display: 'block', marginTop: 6, fontStyle: 'italic' }}>{block.source}</span>
                )}
              </div>
            );
          }

          case 'section_divider': {
            const divStyle = block.style || 'ornament';
            if (divStyle === 'space') return <div key={i} style={{ height: 80 }} />;
            if (divStyle === 'line') return (
              <div key={i} style={{ margin: '48px 0', display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: 120, height: 1, background: GOLD }} />
              </div>
            );
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '48px 0' }}>
                <div style={{ flex: 1, height: 1, background: DIVBG }} />
                <span style={{ color: GOLD, fontSize: 10, letterSpacing: '0.3em' }}>✦</span>
                <div style={{ flex: 1, height: 1, background: DIVBG }} />
              </div>
            );
          }

          case 'moodboard_grid':
            return (
              <Suspense key={i} fallback={<div style={{ height: 200 }} />}>
                <MoodboardGridBlock block={block} MUTED={MUTED} HEAD={HEAD} onLightbox={setLightbox} />
              </Suspense>
            );

          case 'video_embed':
            return (
              <Suspense key={i} fallback={<div style={{ height: 200 }} />}>
                <VideoEmbedBlock block={block} MUTED={MUTED} />
              </Suspense>
            );

          case 'venue_spotlight': {
            return (
              <div key={i} style={{ margin: '56px 0', borderRadius: 2, overflow: 'hidden', border: `1px solid ${DIVBG}` }}>
                {block.src && (
                  <img src={block.src} alt={block.alt || block.name || ''} loading="lazy"
                    style={{ width: '100%', display: 'block', aspectRatio: '16/9', objectFit: 'cover', objectPosition: block.focal || 'center' }} />
                )}
                <div style={{ padding: 'clamp(24px, 3vw, 40px)' }}>
                  {block.name && <h3 style={{ fontFamily: FD, fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 400, color: HEAD, margin: '0 0 8px', lineHeight: 1.1 }}>{block.name}</h3>}
                  {block.location && <div style={{ fontFamily: FU, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: GOLD, marginBottom: 16 }}>{block.location}</div>}
                  {block.description && <p style={{ fontFamily: FS, fontSize: 'clamp(15px, 1.6vw, 17px)', color: BODY, lineHeight: 1.8, margin: 0 }}>{block.description}</p>}
                </div>
                {(block.caption || block.credit) && (
                  <div style={{ padding: '0 clamp(24px, 3vw, 40px) 16px', fontFamily: FU, fontSize: 10, color: MUTED, fontStyle: 'italic', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    {block.caption && <span>{block.caption}</span>}
                    {block.credit && <span style={{ color: `${GOLD}80` }}>© {block.credit}</span>}
                  </div>
                )}
              </div>
            );
          }

          case 'vendor_credits': {
            const vcVendors = block.vendors || [];
            if (!vcVendors.length) return null;
            return (
              <div key={i} style={{ margin: '56px 0', borderTop: `1px solid ${DIVBG}`, borderBottom: `1px solid ${DIVBG}`, padding: '40px 0' }}>
                {block.heading && (
                  <div style={{ fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, marginBottom: 24, textAlign: 'center' }}>{block.heading}</div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px 32px', maxWidth: 600, margin: '0 auto' }}>
                  {vcVendors.map((v, vi) => (
                    <div key={vi} style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, marginBottom: 4 }}>{v.role}</div>
                      {v.url ? (
                        <button
                          onClick={() => handleVendorLink(v.url, v.name)}
                          style={{ fontFamily: FS, fontSize: 15, color: TEXT, textDecoration: 'none', background: 'none', border: 'none', borderBottom: `1px solid ${DIVBG}`, cursor: 'pointer', padding: 0 }}
                        >{v.name}</button>
                      ) : (
                        <span style={{ fontFamily: FS, fontSize: 15, color: TEXT }}>{v.name}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          // ── Display Section ──────────────────────────────────────────────
          case 'display_section': {
            const bg   = block.bg || '#1a1714';
            const fg   = block.fg || '#f5f0e8';
            const sz   = block.fontSize || 64;
            const sticky = !!block.sticky;
            return (
              <div key={i} style={{ margin: '32px -48px', position: 'relative' }}>
                <section style={{
                  position: sticky ? 'sticky' : 'relative',
                  top: sticky ? 0 : undefined,
                  zIndex: sticky ? 2 : undefined,
                  background: block.bgImage ? `url(${block.bgImage}) center/cover no-repeat` : bg,
                  padding: 'clamp(48px,8vw,96px) clamp(32px,6vw,96px)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: block.align === 'center' ? 'center' : block.align === 'right' ? 'flex-end' : 'flex-start',
                  textAlign: block.align || 'left',
                  minHeight: block.minHeight || 320,
                }}>
                  {block.bgImage && <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${block.overlay ?? 0.45})` }} />}
                  <div style={{ position: 'relative', zIndex: 1, maxWidth: 900 }}>
                    {block.eyebrow && <div style={{ fontFamily: FU, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, marginBottom: 20, opacity: 0.8 }}>{block.eyebrow}</div>}
                    <div style={{ fontFamily: FD, fontSize: `clamp(${Math.round(sz*0.55)}px, ${sz/16}vw, ${sz}px)`, fontWeight: 400, lineHeight: 1.1, color: fg }}
                      dangerouslySetInnerHTML={{ __html: block.text || '' }} />
                    {block.subtitle && <div style={{ fontFamily: FS, fontSize: 20, fontStyle: 'italic', color: fg, opacity: 0.7, marginTop: 24, lineHeight: 1.55 }}>{block.subtitle}</div>}
                  </div>
                </section>
              </div>
            );
          }

          // ── Sticky Scroll Section ─────────────────────────────────────────
          case 'sticky_section': {
            const stickyOn = block.stickyEnabled !== false;
            return (
              <div key={i} style={{ margin: '32px -48px', background: block.bg || '#f7f4ef' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                  <div style={{
                    padding: 'clamp(40px,6vw,60px) clamp(24px,4vw,48px) clamp(40px,6vw,60px) clamp(32px,5vw,96px)',
                    position: stickyOn ? 'sticky' : 'relative',
                    top: stickyOn ? 0 : undefined,
                    alignSelf: 'start',
                    height: stickyOn ? '100vh' : undefined,
                    display: 'flex', flexDirection: 'column', justifyContent: 'center',
                  }}>
                    <div style={{ fontFamily: FD, fontSize: 'clamp(24px,2.5vw,36px)', fontWeight: 400, lineHeight: 1.2, color: block.color || TEXT }}
                      dangerouslySetInnerHTML={{ __html: block.text || '' }} />
                    {block.body && <div style={{ fontFamily: FS, fontSize: 17, lineHeight: 1.7, color: MUTED, marginTop: 20 }}>{block.body}</div>}
                  </div>
                  <div style={{ padding: 'clamp(40px,6vw,60px) clamp(32px,5vw,96px) clamp(40px,6vw,60px) clamp(24px,4vw,48px)', display: 'flex', flexDirection: 'column', gap: 32 }}>
                    {(block.items || []).map((item, ii) => (
                      <div key={ii} style={{ background: '#fff', padding: 24, borderRadius: 4, border: `1px solid ${DIVBG}`, fontFamily: FS, fontSize: 16, lineHeight: 1.7, color: TEXT }}>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          }

          // ── Sidebar Layout ────────────────────────────────────────────────
          case 'sidebar_layout': {
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 32, margin: '24px 0' }}>
                <div style={{ fontFamily: FS, fontSize: 18, lineHeight: 1.78, color: TEXT }}
                  dangerouslySetInnerHTML={{ __html: block.text || '' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {(block.sidebarItems || []).map((item, ii) => {
                    const it = item.type || 'note';
                    if (it === 'stat') return (
                      <div key={ii} style={{ background: `${GOLD}0a`, border: `1px solid ${GOLD}28`, borderRadius: 4, padding: '14px 16px' }}>
                        <div style={{ fontFamily: FD, fontSize: 32, fontWeight: 400, color: GOLD, lineHeight: 1 }}>{item.value}</div>
                        <div style={{ fontFamily: FU, fontSize: 10, color: MUTED, marginTop: 5 }}>{item.label}</div>
                      </div>
                    );
                    if (it === 'quote') return (
                      <div key={ii} style={{ borderLeft: `3px solid ${GOLD}`, padding: '12px 14px' }}>
                        <div style={{ fontFamily: FS, fontSize: 14, fontStyle: 'italic', lineHeight: 1.6, color: MUTED }}>{item.text}</div>
                        {item.attr && <div style={{ fontFamily: FU, fontSize: 9, color: `${MUTED}80`, marginTop: 6 }}>— {item.attr}</div>}
                      </div>
                    );
                    if (it === 'product') return (
                      <div key={ii} style={{ border: `1px solid ${DIVBG}`, borderRadius: 4, overflow: 'hidden', background: '#fff' }}>
                        {item.image && <div style={{ height: 100, background: `url(${item.image}) center/cover` }} />}
                        <div style={{ padding: '10px 12px 14px' }}>
                          {item.brand && <div style={{ fontFamily: FU, fontSize: 8, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3 }}>{item.brand}</div>}
                          <div style={{ fontFamily: FS, fontSize: 13, color: TEXT, lineHeight: 1.3, marginBottom: 4 }}>{item.name}</div>
                          {item.price && <div style={{ fontFamily: FU, fontSize: 11, fontWeight: 600, color: TEXT }}>{item.price}</div>}
                          {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 8, fontFamily: FU, fontSize: 8, padding: '3px 8px', background: `linear-gradient(135deg,${GOLD},#b8891e)`, color: '#fff', borderRadius: 2, textDecoration: 'none' }}>Shop →</a>}
                        </div>
                      </div>
                    );
                    // note
                    return (
                      <div key={ii} style={{ background: `${GOLD}06`, border: `1px solid ${GOLD}22`, borderRadius: 4, padding: '12px 14px' }}>
                        <div style={{ fontFamily: FU, fontSize: 8, color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 5, opacity: 0.6 }}>Editor's Note</div>
                        <div style={{ fontFamily: FS, fontSize: 13, fontStyle: 'italic', lineHeight: 1.6, color: MUTED }}>{item.text}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          // ── Listing Embed ─────────────────────────────────────────────────
          case 'listing_embed': {
            if (!block.name) return null;
            return (
              <div key={i} style={{ margin: '28px 0', border: `1px solid ${GOLD}28`, borderRadius: 4, overflow: 'hidden', background: isLight ? '#fdfcf9' : '#1a1714' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', minHeight: 140 }}>
                  <div style={{ background: block.image ? `url(${block.image}) center/cover` : (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)') }} />
                  <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontFamily: FU, fontSize: 8, color: GOLD, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.7 }}>{block.category || 'Venue'}</div>
                    <div style={{ fontFamily: FD, fontSize: 22, fontWeight: 400, color: TEXT, lineHeight: 1.2 }}>{block.name}</div>
                    {block.location && <div style={{ fontFamily: FU, fontSize: 11, color: MUTED }}>{block.location}</div>}
                    {block.desc && <div style={{ fontFamily: FS, fontSize: 13, color: MUTED, lineHeight: 1.55, flex: 1 }}>{block.desc}</div>}
                    <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                      {block.url && <a href={block.url} style={{ fontFamily: FU, fontSize: 9, padding: '4px 12px', border: `1px solid ${GOLD}50`, borderRadius: 2, color: GOLD, textDecoration: 'none' }}
                        onMouseEnter={e => { e.currentTarget.style.background = `${GOLD}12`; setHoverRef({ anchor: e.currentTarget, ...block, entityType: 'listing', label: block.name }); }}
                        onMouseLeave={() => hoverTimer.current = setTimeout(() => setHoverRef(null), 300)}
                      >View Profile →</a>}
                      {block.showEnquire && block.url && <a href={`${block.url}?enquire=1`} style={{ fontFamily: FU, fontSize: 9, padding: '4px 12px', background: `linear-gradient(135deg,${GOLD},#b8891e)`, borderRadius: 2, color: '#fff', textDecoration: 'none' }}>Enquire</a>}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // ── Showcase Embed ────────────────────────────────────────────────
          case 'showcase_embed': {
            const showcaseItems = block.items || [];
            if (!showcaseItems.length && !block.title) return null;
            return (
              <div key={i} style={{ margin: '32px -48px', background: block.bg || '#1a1714', padding: 'clamp(40px,6vw,56px) clamp(32px,5vw,96px)' }}>
                <div style={{ fontFamily: FU, fontSize: 8, color: GOLD, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 6, opacity: 0.7 }}>✦ Featured</div>
                {block.title && <div style={{ fontFamily: FD, fontSize: 'clamp(22px,2.5vw,32px)', fontWeight: 400, color: '#f5f0e8', lineHeight: 1.2, marginBottom: 28 }}>{block.title}</div>}
                {showcaseItems.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(showcaseItems.length, 4)}, 1fr)`, gap: 16 }}>
                    {showcaseItems.map((item, ii) => (
                      <div key={ii} style={{ background: '#fff', borderRadius: 3, overflow: 'hidden', cursor: item.url ? 'pointer' : 'default' }}
                        onClick={() => item.url && (window.location.href = item.url)}>
                        {item.image && <div style={{ height: 140, background: `url(${item.image}) center/cover` }} />}
                        <div style={{ padding: '12px 14px' }}>
                          <div style={{ fontFamily: FD, fontSize: 15, color: '#0f0e0b', lineHeight: 1.3 }}>{item.name}</div>
                          {item.location && <div style={{ fontFamily: FU, fontSize: 9, color: '#aaa', marginTop: 4 }}>{item.location}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          // ── Reference Block (Content → Commerce) ────────────────────────
          case 'reference': {
            if (!block.label) return null;
            const refTierColor = block.referenceTier === 'sponsored' ? '#8b5cf6' : block.referenceTier === 'featured' ? '#10b981' : GOLD;
            return (
              <div key={i} style={{ margin: '28px 0', border: `1px solid ${refTierColor}28`, borderRadius: 4, overflow: 'hidden', background: isLight ? '#fdfcf9' : '#1a1714' }}>
                <div style={{ display: 'grid', gridTemplateColumns: block.image ? '180px 1fr' : '1fr', minHeight: 120 }}>
                  {block.image && <div style={{ background: `url(${block.image}) center/cover` }} />}
                  <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontFamily: FU, fontSize: 8, color: refTierColor, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.7 }}>
                      {block.entityType === 'showcase' ? '✦ Showcase' : block.entityType === 'article' ? '✦ Related' : '✦ Featured'}
                    </div>
                    <div style={{ fontFamily: FD, fontSize: 20, fontWeight: 400, color: TEXT, lineHeight: 1.25 }}>{block.label}</div>
                    {block.subtitle && <div style={{ fontFamily: FU, fontSize: 11, color: MUTED }}>{block.subtitle}</div>}
                    {block.url && (
                      <div style={{ marginTop: 8 }}>
                        <a href={`${block.url}${block.url.includes('?') ? '&' : '?'}ref=article${block.postId ? '&ref_post=' + block.postId : ''}${block.id ? '&ref_id=' + block.id : ''}`}
                          style={{ fontFamily: FU, fontSize: 9, padding: '5px 14px', border: `1px solid ${refTierColor}50`, borderRadius: 2, color: refTierColor, textDecoration: 'none' }}
                          onClick={() => {
                            try {
                              import('../../../services/referenceService').then(m => m.trackReferenceClick({
                                referenceId: block.id, postId: block.postId, entityType: block.entityType,
                                entityId: block.entityId, entitySlug: block.slug,
                              }));
                            } catch (_) {}
                          }}
                        >View {block.entityType === 'article' ? 'Article' : 'Profile'} →</a>
                        {block.referenceTier === 'sponsored' && block.url && (
                          <a href={`${block.url}?enquire=1&ref=article${block.postId ? '&ref_post=' + block.postId : ''}`} style={{ fontFamily: FU, fontSize: 9, padding: '5px 14px', marginLeft: 8, background: `linear-gradient(135deg,${GOLD},#b8891e)`, borderRadius: 2, color: '#fff', textDecoration: 'none' }}>Enquire</a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          // ── FAQ Block ────────────────────────────────────────────────────────
          case 'faq': {
            const faqs = block.items || (block.question ? [{ question: block.question, answer: block.answer }] : []);
            if (!faqs.length) return null;
            return (
              <div key={i} style={{ margin: '32px 0' }}>
                {block.heading && <div style={{ fontFamily: FD, fontSize: 'clamp(20px,2vw,26px)', fontWeight: 400, color: TEXT, marginBottom: 20, lineHeight: 1.25 }}>{block.heading}</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: `1px solid ${DIVBG}`, borderRadius: 4, overflow: 'hidden' }}>
                  {faqs.map((faq, fi) => (
                    <FaqItem key={fi} question={faq.question} answer={faq.answer} isLight={isLight} TEXT={TEXT} MUTED={MUTED} GOLD={GOLD} DIVBG={DIVBG} />
                  ))}
                </div>
              </div>
            );
          }

          // ── Affiliate Product ─────────────────────────────────────────────
          case 'affiliate_product':
          case 'product_tile': {
            const products = block.products || [];
            if (!products.length) return null;
            const cols = block.columns || Math.min(products.length, 3);
            return (
              <div key={i} style={{ margin: '28px 0' }}>
                {block.sectionTitle && <div style={{ fontFamily: FU, fontSize: 9, color: GOLD, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16, opacity: 0.75 }}>{block.sectionTitle}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>
                  {products.map((p, ii) => (
                    <div key={ii} style={{ border: `1px solid ${DIVBG}`, borderRadius: 4, overflow: 'hidden', background: isLight ? '#fff' : '#1e1c19' }}>
                      {p.image && <div style={{ height: 200, background: `url(${p.image}) center/cover` }} />}
                      <div style={{ padding: '14px 16px 18px' }}>
                        {p.brand && <div style={{ fontFamily: FU, fontSize: 8, color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4, opacity: 0.7 }}>{p.brand}</div>}
                        <div style={{ fontFamily: FS, fontSize: 15, fontWeight: 500, color: TEXT, lineHeight: 1.3, marginBottom: p.desc ? 6 : 0 }}>{p.name}</div>
                        {p.desc && <div style={{ fontFamily: FS, fontSize: 12, color: MUTED, lineHeight: 1.5, marginBottom: 8 }}>{p.desc}</div>}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                          {p.price && <span style={{ fontFamily: FU, fontSize: 13, fontWeight: 600, color: TEXT }}>{p.price}</span>}
                          {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: FU, fontSize: 9, padding: '5px 12px', background: `linear-gradient(135deg,${GOLD},#b8891e)`, color: '#fff', borderRadius: 2, textDecoration: 'none' }}>Shop →</a>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          default:
            return null;
        }
      })}

      {exitConfig && (
        <ExternalLinkModal
          name={exitConfig.name}
          url={exitConfig.url}
          onClose={() => setExitConfig(null)}
          onContinue={() => {
            markModalSeen(exitConfig.url);
            trackExternalClick({ entityType: 'magazine', entityId: null, venueId: null, linkType: 'website', url: exitConfig.url });
          }}
        />
      )}

      {hoverRef && (
        <ReferenceHoverCard
          {...hoverRef}
          onClose={() => setHoverRef(null)}
        />
      )}
    </div>
  );
}
