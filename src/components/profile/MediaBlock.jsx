import { useState } from "react";
import VideoGallery from "./VideoGallery";
import ImageGallery from "./ImageGallery";
import Lightbox from "./Lightbox";

/**
 * MediaBlock - Coordinates video and image galleries with shared lightbox
 *
 * Renders:
 * 1. VideoGallery (if videos exist)
 * 2. ImageGallery (always, if gallery exists)
 * 3. Shared Lightbox for both videos and images
 *
 * Lightbox navigation works across both galleries seamlessly.
 */
export default function MediaBlock({ videos = [], gallery = [] }) {
  const [lightboxOpen, setLightboxOpen] = useState(null);

  // Combine all media into a single array for lightbox navigation
  // Videos first (if they exist), then images
  const allMedia = [
    ...(videos || []).map(v => ({
      ...v,
      src: v.thumb, // Use thumbnail as display
      id: `video-${v.id}`,
      isVideo: true,
    })),
    ...(gallery || []),
  ];

  // Handle opening lightbox from either gallery
  const handleOpenLight = (idx) => {
    // If clicking on a video, find its index in allMedia
    // If clicking on image, add videos.length to get correct index
    setLightboxOpen(idx + (videos?.length || 0));
  };

  // Handle opening video directly
  const handleOpenVideo = (videoIdx) => {
    setLightboxOpen(videoIdx);
  };

  const handlePrev = () => {
    setLightboxOpen((i) => (i - 1 + allMedia.length) % allMedia.length);
  };

  const handleNext = () => {
    setLightboxOpen((i) => (i + 1) % allMedia.length);
  };

  if (!videos || videos.length === 0) {
    // No videos, just show image gallery
    if (!gallery || gallery.length === 0) return null;

    return (
      <>
        <ImageGallery gallery={gallery} onOpenLight={handleOpenLight} />
        <Lightbox
          gallery={gallery}
          idx={lightboxOpen}
          onClose={() => setLightboxOpen(null)}
          onPrev={handlePrev}
          onNext={handleNext}
          setLightIdx={setLightboxOpen}
        />
      </>
    );
  }

  // Has videos + images
  return (
    <>
      {videos && videos.length > 0 && (
        <VideoGallery videos={videos} />
      )}
      {gallery && gallery.length > 0 && (
        <ImageGallery gallery={gallery} onOpenLight={handleOpenLight} />
      )}
      <Lightbox
        gallery={gallery}
        idx={lightboxOpen !== null ? lightboxOpen - (videos?.length || 0) : null}
        onClose={() => setLightboxOpen(null)}
        onPrev={handlePrev}
        onNext={handleNext}
        setLightIdx={setLightboxOpen}
      />
    </>
  );
}
