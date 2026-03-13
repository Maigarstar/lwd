// Detects YouTube / TikTok / Instagram and returns the correct embed iframe

function getEmbedInfo(url) {
  if (!url) return null;

  // YouTube: youtube.com/watch?v=ID or youtu.be/ID
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return {
      platform: 'youtube',
      src: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`,
      label: 'YouTube',
    };
  }

  // TikTok: tiktok.com/@user/video/ID
  const ttMatch = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if (ttMatch) {
    return {
      platform: 'tiktok',
      src: `https://www.tiktok.com/embed/v2/${ttMatch[1]}`,
      label: 'TikTok',
    };
  }

  // Instagram: instagram.com/reel/CODE/ or instagram.com/p/CODE/
  const igMatch = url.match(/instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]+)/);
  if (igMatch) {
    return {
      platform: 'instagram',
      src: `https://www.instagram.com/p/${igMatch[1]}/embed/`,
      label: 'Instagram',
    };
  }

  return null;
}

const PLATFORM_COLORS = {
  youtube:   '#FF0000',
  tiktok:    '#010101',
  instagram: '#C13584',
};

const PLATFORM_ICONS = {
  youtube:   '▶',
  tiktok:    '♪',
  instagram: '◈',
};

export default function VideoEmbed({ videoUrl, fontUI, artistName }) {
  const info = getEmbedInfo(videoUrl);
  if (!info) return null;

  return (
    <div style={{ width: '100%' }}>
      {/* Platform badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
      }}>
        <span style={{
          background: PLATFORM_COLORS[info.platform],
          color: '#fff',
          fontSize: 8,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          padding: '3px 8px',
          borderRadius: 2,
          fontFamily: fontUI,
        }}>
          {PLATFORM_ICONS[info.platform]} {info.label}
        </span>
        <span style={{
          fontFamily: fontUI,
          fontSize: 10,
          color: 'rgba(245,240,232,0.35)',
          letterSpacing: '0.08em',
        }}>
          {artistName}
        </span>
      </div>

      {/* Iframe wrapper — 16:9 for YouTube/Instagram, 9:16 for TikTok */}
      <div style={{
        position: 'relative',
        width: '100%',
        paddingBottom: info.platform === 'tiktok' ? '177.78%' : '56.25%',
        background: '#000',
        borderRadius: 4,
        overflow: 'hidden',
      }}>
        <iframe
          src={info.src}
          title={`${info.label} video — ${artistName}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 'none',
          }}
        />
      </div>
    </div>
  );
}

// Export the detector so ArtistCard can check if a video exists
export { getEmbedInfo };
