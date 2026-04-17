/**
 * Captures a TemplateCanvas DOM element as a high-res JPEG blob.
 * Uses html2canvas at scale=3 for 1200px output from a 400px preview.
 */

const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,400;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Josefin+Sans:wght@300;400;600;700&family=Playfair+Display:ital,wght@0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;1,400&display=swap';

export async function renderToJpeg(element, { scale = 3, quality = 0.92 } = {}) {
  // Dynamic import html2canvas
  const html2canvas = (await import('html2canvas')).default;

  // Wait for fonts to load
  if (document.fonts?.ready) await document.fonts.ready;

  const canvas = await html2canvas(element, {
    scale,
    useCORS:         true,
    allowTaint:      false,
    backgroundColor: null,
    logging:         false,
    imageTimeout:    15000,
    onclone: (clonedDoc) => {
      // Inject Google Fonts into the clone so html2canvas sees them
      const link = clonedDoc.createElement('link');
      link.rel  = 'stylesheet';
      link.href = GOOGLE_FONTS_URL;
      clonedDoc.head.appendChild(link);
    },
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
      'image/jpeg',
      quality,
    );
  });
}
