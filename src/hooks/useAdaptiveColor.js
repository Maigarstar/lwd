// useAdaptiveColor.js
// Samples an image's brightness using Canvas and returns adaptive text/overlay tokens.
//
// Usage:
//   const { isDark, textColor, overlayStyle } = useAdaptiveColor(imageUrl);
//
// How it works:
//   - Loads the image into a hidden Canvas element
//   - Samples the top portion (where text usually sits) at a reduced resolution
//   - Computes perceptual brightness using ITU-R BT.601 coefficients
//   - Returns stable colour tokens ready to use in inline styles
//
// CORS: Images from external domains must allow cross-origin access.
// If blocked, the hook falls back to dark (safe for light text).
// For same-origin or CDN images (Supabase, Cloudinary etc) this works reliably.

import { useState, useEffect } from 'react';

/**
 * @param {string|null} imageUrl - Full image URL to sample
 * @param {object}  opts
 * @param {'top'|'center'|'full'} opts.region  - Which vertical slice to sample (default 'top')
 * @param {number}  opts.sampleHeight           - Pixel height of the sampled region (default 80)
 * @returns {{
 *   brightness: number|null,  // 0 (black) - 1 (white), null while loading
 *   isDark:     boolean,      // true when image is dark → use light text
 *   isLight:    boolean,      // true when image is light → use dark text
 *   textColor:  string,       // '#ffffff' or '#1a1a1a'
 *   subColor:   string,       // softer version of textColor for subtitles
 *   overlayStyle: object,     // ready-made inline style for a gradient scrim
 * }}
 */
export function useAdaptiveColor(imageUrl, { region = 'top', sampleHeight = 80 } = {}) {
  const [result, setResult] = useState(defaultResult(true));

  useEffect(() => {
    if (!imageUrl) {
      setResult(defaultResult(true));
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement('canvas');
        const naturalW = img.naturalWidth;
        const naturalH = img.naturalHeight;

        // Sample at max 300px wide to keep it fast
        const sampleW = Math.min(naturalW, 300);

        let srcY = 0;
        let srcH = Math.min(sampleHeight, naturalH);
        if (region === 'center') {
          srcY = Math.floor(naturalH / 2 - srcH / 2);
        } else if (region === 'full') {
          srcY = 0;
          srcH = naturalH;
        }

        canvas.width  = sampleW;
        canvas.height = Math.min(srcH, 150);
        const ctx = canvas.getContext('2d');

        // Draw just the sampled region
        ctx.drawImage(img, 0, srcY, naturalW, srcH, 0, 0, sampleW, canvas.height);

        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }

        // Perceived brightness: ITU-R BT.601
        const brightness = ((r / count) * 0.299 + (g / count) * 0.587 + (b / count) * 0.114) / 255;
        setResult(buildResult(brightness));
      } catch {
        // CORS blocked or canvas tainted - default to dark (safe)
        setResult(defaultResult(true));
      }
    };

    img.onerror = () => {
      if (!cancelled) setResult(defaultResult(true));
    };

    img.src = imageUrl;
    return () => { cancelled = true; };
  }, [imageUrl, region, sampleHeight]);

  return result;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function buildResult(brightness) {
  const isDark  = brightness < 0.45;
  const isLight = brightness >= 0.55;
  const isMid   = !isDark && !isLight; // 0.45-0.55: ambiguous zone

  // For ambiguous mid-tones we treat as dark (use light text + stronger overlay)
  const useLightText = isDark || isMid;

  return {
    brightness,
    isDark,
    isLight,
    isMidtone: isMid,
    // Text colours
    textColor:    useLightText ? '#ffffff'              : '#1a1208',
    subColor:     useLightText ? 'rgba(255,255,255,0.7)': 'rgba(26,18,8,0.65)',
    accentColor:  useLightText ? '#c9a84c'              : '#7a5c10',
    // Overlay gradient (apply to a positioned div covering the image)
    overlayStyle: useLightText
      ? {
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.82) 100%)',
        }
      : {
          // Light image: lighter overlay, darken slightly so dark text reads
          background: 'linear-gradient(to bottom, rgba(245,237,220,0.25) 0%, rgba(245,237,220,0.55) 60%, rgba(245,237,220,0.80) 100%)',
        },
    // Convenience: CSS mix-blend overlay for subtle refinement
    overlayBlend: useLightText ? 'multiply' : 'screen',
  };
}

function defaultResult(dark) {
  return buildResult(dark ? 0.1 : 0.9);
}
