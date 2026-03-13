// Lazy-loaded editorial block: Moodboard Grid (mosaic image layout)
import { FU, GOLD_CONST as GOLD } from '../../magazineTheme';

export default function MoodboardGridBlock({ block, MUTED, HEAD, onLightbox }) {
  const mbImgs = (block.images || []).filter(img => img?.src);
  if (!mbImgs.length) return null;
  const [mbMain, ...mbRest] = mbImgs;

  return (
    <div style={{ margin: '48px 0' }}>
      {block.title && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 20, height: 1, background: GOLD }} />
          <span style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD }}>
            {block.title}
          </span>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gridTemplateRows: 'auto auto', gap: 8 }}>
        <div
          style={{ gridRow: '1 / 3', overflow: 'hidden', borderRadius: 2, cursor: 'zoom-in' }}
          onClick={() => onLightbox?.({ images: mbImgs, startIndex: 0 })}
        >
          <img src={mbMain.src} alt={mbMain.alt || ''} loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: 300 }} />
        </div>
        {mbRest.slice(0, 2).map((img, gi) => (
          <div key={gi} style={{ overflow: 'hidden', borderRadius: 2, cursor: 'zoom-in' }}
            onClick={() => onLightbox?.({ images: mbImgs, startIndex: gi + 1 })}>
            <img src={img.src} alt={img.alt || ''} loading="lazy"
              style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
          </div>
        ))}
      </div>
      {mbRest.length > 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(mbRest.length - 2, 4)}, 1fr)`, gap: 8, marginTop: 8 }}>
          {mbRest.slice(2, 6).map((img, gi) => (
            <div key={gi} style={{ overflow: 'hidden', borderRadius: 2, cursor: 'zoom-in' }}
              onClick={() => onLightbox?.({ images: mbImgs, startIndex: gi + 3 })}>
              <img src={img.src} alt={img.alt || ''} loading="lazy"
                style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
