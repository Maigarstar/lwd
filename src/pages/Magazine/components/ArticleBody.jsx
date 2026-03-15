// Renders structured article content blocks with luxury editorial typography
import { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import ShopTheStory, { ShopTheLook } from './ShopTheStory';
import { getProductsByCollection, getProductById } from '../data/products';
import { StyleAdvice, MoodBoard, DesignerSpotlight } from './FashionModules';
import { getMagTheme, FD, FU, GOLD_CONST as GOLD } from '../magazineTheme';

// ── Lazy-loaded editorial blocks ────────────────────────────────────────────
const VideoEmbedBlock = lazy(() => import('./blocks/VideoEmbedBlock'));
const MoodboardGridBlock = lazy(() => import('./blocks/MoodboardGridBlock'));

const FS = "Georgia, 'Times New Roman', serif";

// ── Gallery Lightbox ──────────────────────────────────────────────────────────
function GalleryLightbox({ images, startIndex, onClose, isLight }) {
  const T = getMagTheme(isLight);
  const [idx, setIdx] = useState(startIndex);

  const prev = useCallback((e) => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); }, [images.length]);
  const next = useCallback((e) => { e.stopPropagation(); setIdx(i => (i + 1) % images.length); }, [images.length]);

  const img = images[idx];
  const src = typeof img === 'string' ? img : img?.src;
  const caption = typeof img === 'object' ? (img.caption || img.alt || '') : '';
  const credit = typeof img === 'object' ? img.credit : '';

  const handleKey = useCallback((e) => {
    if (e.key === 'ArrowLeft') setIdx(i => (i - 1 + images.length) % images.length);
    if (e.key === 'ArrowRight') setIdx(i => (i + 1) % images.length);
    if (e.key === 'Escape') onClose();
  }, [images.length, onClose]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.94)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
      }}
      onClick={onClose}
      onKeyDown={handleKey}
      tabIndex={-1}
      ref={el => el?.focus()}
    >
      {/* Close */}
      <button onClick={onClose} style={{
        position: 'absolute', top: 24, right: 28, background: 'none', border: 'none',
        color: 'rgba(245,240,232,0.6)', fontSize: 28, cursor: 'pointer', lineHeight: 1,
        padding: 4,
      }}>✕</button>

      {/* Counter */}
      <div style={{
        position: 'absolute', top: 28, left: '50%', transform: 'translateX(-50%)',
        fontFamily: FU, fontSize: 11, color: 'rgba(245,240,232,0.4)', letterSpacing: '0.1em',
      }}>
        {idx + 1} / {images.length}
      </div>

      {/* Prev */}
      {images.length > 1 && (
        <button onClick={prev} style={{
          position: 'absolute', left: 20, background: 'none', border: 'none',
          color: 'rgba(245,240,232,0.55)', fontSize: 32, cursor: 'pointer',
          padding: '12px 16px', transition: 'color 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = '#f5f0e8'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.55)'}
        >‹</button>
      )}

      {/* Image */}
      <div style={{ maxWidth: '88vw', maxHeight: '84vh', display: 'flex', flexDirection: 'column', gap: 14 }} onClick={e => e.stopPropagation()}>
        <img src={src} alt={caption}
          style={{
            maxWidth: '88vw', maxHeight: '78vh',
            objectFit: 'contain', display: 'block', borderRadius: 2,
          }}
        />
        {(caption || credit) && (
          <div style={{ textAlign: 'center' }}>
            {caption && <p style={{ fontFamily: FU, fontSize: 12, color: 'rgba(245,240,232,0.55)', margin: 0, fontStyle: 'italic' }}>{caption}</p>}
            {credit && <p style={{ fontFamily: FU, fontSize: 10, color: `${GOLD}80`, margin: '4px 0 0', letterSpacing: '0.08em' }}>© {credit}</p>}
          </div>
        )}
      </div>

      {/* Next */}
      {images.length > 1 && (
        <button onClick={next} style={{
          position: 'absolute', right: 20, background: 'none', border: 'none',
          color: 'rgba(245,240,232,0.55)', fontSize: 32, cursor: 'pointer',
          padding: '12px 16px', transition: 'color 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = '#f5f0e8'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.55)'}
        >›</button>
      )}
    </div>
  );
}

// ── Slider block ──────────────────────────────────────────────────────────────
function SliderBlock({ images = [], autoplay = false, isLight }) {
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
  return (
    <figure style={{ margin: '40px 0', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'relative' }}>
        <img src={src} alt={cap || ''} style={{ width: '100%', display: 'block', borderRadius: 2, maxHeight: 520, objectFit: 'cover' }} />
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
function MasonryBlock({ images = [], columns = 2 }) {
  if (!images.length) return null;
  return (
    <div style={{ margin: '40px 0', columns, columnGap: 12 }}>
      {images.map((img, i) => {
        const src = typeof img === 'string' ? img : img?.src;
        const cap = typeof img === 'object' ? img.caption : '';
        return (
          <figure key={i} style={{ breakInside: 'avoid', margin: '0 0 12px' }}>
            <img src={src} alt={cap || ''} style={{ width: '100%', display: 'block', borderRadius: 2 }} />
            {cap && <figcaption style={{ fontFamily: FU, fontSize: 10, color: 'rgba(150,140,130,0.75)', marginTop: 4, fontStyle: 'italic' }}>{cap}</figcaption>}
          </figure>
        );
      })}
    </div>
  );
}

// ── Dual Image block ──────────────────────────────────────────────────────────
function DualImageBlock({ imageA, imageB, layout = '50/50' }) {
  const widths = { '60/40': ['60%', '40%'], '40/60': ['40%', '60%'] };
  const [wA, wB] = widths[layout] || ['50%', '50%'];
  const renderImg = (img, w) => {
    const src = typeof img === 'string' ? img : img?.src;
    const cap = typeof img === 'object' ? img.caption : '';
    return (
      <figure style={{ flex: `0 0 ${w}`, margin: 0 }}>
        <img src={src} alt={cap || ''} style={{ width: '100%', display: 'block', borderRadius: 2, objectFit: 'cover', aspectRatio: '4/3' }} />
        {cap && <figcaption style={{ fontFamily: FU, fontSize: 10, color: 'rgba(150,140,130,0.75)', marginTop: 4, fontStyle: 'italic' }}>{cap}</figcaption>}
      </figure>
    );
  };
  return (
    <div style={{ margin: '40px 0', display: 'flex', gap: 12 }}>
      {imageA && renderImg(imageA, wA)}
      {imageB && renderImg(imageB, wB)}
    </div>
  );
}

// ── Lookbook block ────────────────────────────────────────────────────────────
function LookbookBlock({ images = [], columns = 3 }) {
  if (!images.length) return null;
  return (
    <div style={{ margin: '40px 0', display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 8 }}>
      {images.map((img, i) => {
        const src = typeof img === 'string' ? img : img?.src;
        const label = typeof img === 'object' ? (img.label || img.caption) : '';
        return (
          <figure key={i} style={{ margin: 0 }}>
            <img src={src} alt={label || ''} style={{ width: '100%', display: 'block', borderRadius: 2, objectFit: 'cover', aspectRatio: '3/4' }} />
            {label && <figcaption style={{ fontFamily: FU, fontSize: 10, color: 'rgba(150,140,130,0.75)', marginTop: 4, textAlign: 'center' }}>{label}</figcaption>}
          </figure>
        );
      })}
    </div>
  );
}

// ── Before/After block ────────────────────────────────────────────────────────
function BeforeAfterBlock({ before, after, beforeLabel = 'Before', afterLabel = 'After' }) {
  const renderSide = (img, label) => {
    const src = typeof img === 'string' ? img : img?.src;
    return (
      <figure style={{ flex: 1, margin: 0, position: 'relative' }}>
        <img src={src} alt={label} style={{ width: '100%', display: 'block', borderRadius: 2, objectFit: 'cover', aspectRatio: '4/3' }} />
        <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.6)', color: '#fff', fontFamily: FU, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 2 }}>{label}</div>
      </figure>
    );
  };
  return (
    <div style={{ margin: '40px 0', display: 'flex', gap: 12 }}>
      {before && renderSide(before, beforeLabel)}
      {after && renderSide(after, afterLabel)}
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

// ── Main ArticleBody ──────────────────────────────────────────────────────────
export default function ArticleBody({ content = [], isLight = true }) {
  const T = getMagTheme(isLight);
  const [lightbox, setLightbox] = useState(null); // { images, startIndex }

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
            return (
              <figure key={i} style={{ margin: '40px 0' }}>
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 2 }}>
                  <iframe
                    src={embedUrl}
                    title={block.caption || 'Embedded video'}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                {block.caption && (
                  <figcaption style={{ fontFamily: FU, fontSize: 11, color: MUTED, marginTop: 10, fontStyle: 'italic' }}>
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );
          }

          case 'slider':
            return <SliderBlock key={i} images={block.images || []} autoplay={block.autoplay} isLight={isLight} />;

          case 'masonry':
            return <MasonryBlock key={i} images={block.images || []} columns={block.columns || 2} />;

          case 'dual_image':
            return <DualImageBlock key={i} imageA={block.imageA} imageB={block.imageB} layout={block.layout} />;

          case 'lookbook':
            return <LookbookBlock key={i} images={block.images || []} columns={block.columns || 3} />;

          case 'before_after':
            return <BeforeAfterBlock key={i} before={block.before} after={block.after} beforeLabel={block.beforeLabel} afterLabel={block.afterLabel} />;

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
                        <a href={v.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: FS, fontSize: 15, color: TEXT, textDecoration: 'none', borderBottom: `1px solid ${DIVBG}` }}>{v.name}</a>
                      ) : (
                        <span style={{ fontFamily: FS, fontSize: 15, color: TEXT }}>{v.name}</span>
                      )}
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
    </div>
  );
}
