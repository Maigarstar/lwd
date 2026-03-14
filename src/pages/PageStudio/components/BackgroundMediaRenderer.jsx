/**
 * BackgroundMediaRenderer, Renders background media for preview
 * Handles: uploaded images, uploaded videos, YouTube, Vimeo
 * Falls back to default background if no media is set
 */

export default function BackgroundMediaRenderer({ bgData, defaultBg }) {
  if (!bgData) {
    return defaultBg || null;
  }

  const mediaType = bgData.backgroundType;

  // Image Upload
  if (mediaType === 'image' && bgData.backgroundImage?.url) {
    return (
      <div
        style={{
          backgroundImage: `url(${bgData.backgroundImage.url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          width: '100%',
          height: '100%',
        }}
        role="img"
        aria-label={bgData.backgroundImage.alt || 'Background'}
      />
    );
  }

  // Video Upload
  if (mediaType === 'video_upload' && bgData.backgroundVideo?.url) {
    return (
      <video
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
        autoPlay={bgData.autoplay !== false}
        muted={bgData.muted !== false}
        loop={bgData.loop !== false}
        playsInline
      >
        <source src={bgData.backgroundVideo.url} type={`video/${bgData.backgroundVideo.type}`} />
        Your browser does not support the video tag.
      </video>
    );
  }

  // YouTube
  if (mediaType === 'youtube' && bgData.backgroundVideoUrl) {
    const videoId = extractYouTubeId(bgData.backgroundVideoUrl);
    if (videoId) {
      return (
        <iframe
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&modestbranding=1`}
          allow="autoplay; fullscreen"
          allowFullScreen
          title="YouTube video background"
        />
      );
    }
  }

  // Vimeo
  if (mediaType === 'vimeo' && bgData.backgroundVideoUrl) {
    const videoId = extractVimeoId(bgData.backgroundVideoUrl);
    if (videoId) {
      return (
        <iframe
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
          src={`https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1&title=0&byline=0&portrait=0`}
          allow="autoplay; fullscreen"
          allowFullScreen
          title="Vimeo video background"
        />
      );
    }
  }

  // Fallback
  return defaultBg || null;
}

/**
 * Extract YouTube video ID from various URL formats
 */
function extractYouTubeId(url) {
  if (!url) return null;

  // youtube.com/watch?v=...
  const match1 = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (match1) return match1[1];

  // Just the ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;

  return null;
}

/**
 * Extract Vimeo video ID from URL
 */
function extractVimeoId(url) {
  if (!url) return null;

  const match = url.match(/vimeo\.com\/(\d+)/);
  if (match) return match[1];

  // Just the ID
  if (/^\d+$/.test(url)) return url;

  return null;
}
