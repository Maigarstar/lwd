// Lazy-loaded editorial block: Video Embed (YouTube / Vimeo)
import { FU, GOLD_CONST as GOLD } from '../../magazineTheme';

function getEmbedUrl(url) {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

export default function VideoEmbedBlock({ block, MUTED }) {
  if (!block.url) return null;
  const embedUrl = getEmbedUrl(block.url);
  if (!embedUrl) return null;
  return (
    <figure style={{ margin: '40px 0' }}>
      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 2 }}>
        <iframe
          src={embedUrl}
          title={block.caption || 'Embedded video'}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      {(block.caption || block.credit) && (
        <figcaption style={{
          fontFamily: FU, fontSize: 11, color: MUTED, marginTop: 10, fontStyle: 'italic',
          display: 'flex', justifyContent: 'space-between', gap: 12,
        }}>
          {block.caption && <span>{block.caption}</span>}
          {block.credit && <span style={{ color: `${GOLD}80` }}>&copy; {block.credit}</span>}
        </figcaption>
      )}
    </figure>
  );
}
