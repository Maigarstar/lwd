/**
 * pdfProcessorService.js
 * Client-side PDF → JPEG pipeline using PDF.js.
 *
 * Flow:
 *   1. Load PDF from ArrayBuffer via PDF.js
 *   2. Render each page to <canvas> at 2× scale (high-DPI)
 *   3. Export canvas as JPEG blob (quality 0.92)
 *   4. Resize to thumbnail (≤400px wide)
 *   5. Upload page + thumb to Supabase Storage
 *   6. Upsert page record in magazine_issue_pages
 *   7. Update issue: page_count, processing_state=ready
 *
 * PDF.js is loaded dynamically to avoid bundling it unnecessarily.
 */

import { supabase } from '../lib/supabaseClient';
import { uploadPageImage, uploadThumbImage, upsertPages } from './magazinePageService';
import { setProcessingState, updatePageCount } from './magazineIssuesService';

const THUMB_MAX_WIDTH  = 400;  // thumbnail max width in px
const PAGE_SCALE       = 2.0;  // render at 2× for HiDPI sharpness
const JPEG_QUALITY     = 0.92;
const THUMB_QUALITY    = 0.82;

// PDF.js CDN (avoid bundling ~4MB — load only when needed)
const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.min.mjs';
const PDFJS_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.mjs';

let _pdfjs = null;

async function getPdfJs() {
  if (_pdfjs) return _pdfjs;
  const pdfjsLib = await import(/* @vite-ignore */ PDFJS_CDN);
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
  _pdfjs = pdfjsLib;
  return _pdfjs;
}

// ── Canvas helpers ─────────────────────────────────────────────────────────────

/**
 * Render a PDF page to a canvas element and return the canvas.
 */
async function renderPageToCanvas(pdfPage) {
  const viewport = pdfPage.getViewport({ scale: PAGE_SCALE });
  const canvas   = document.createElement('canvas');
  canvas.width   = Math.round(viewport.width);
  canvas.height  = Math.round(viewport.height);
  const ctx = canvas.getContext('2d');

  await pdfPage.render({ canvasContext: ctx, viewport }).promise;
  return canvas;
}

/**
 * Convert a canvas to a JPEG Blob.
 */
function canvasToBlob(canvas, quality = JPEG_QUALITY) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob returned null')),
      'image/jpeg',
      quality
    );
  });
}

/**
 * Resize a canvas to a thumbnail canvas (max width).
 */
function resizeToThumb(canvas) {
  const ratio  = Math.min(1, THUMB_MAX_WIDTH / canvas.width);
  const tCanvas = document.createElement('canvas');
  tCanvas.width  = Math.round(canvas.width  * ratio);
  tCanvas.height = Math.round(canvas.height * ratio);
  const ctx = tCanvas.getContext('2d');
  ctx.drawImage(canvas, 0, 0, tCanvas.width, tCanvas.height);
  return tCanvas;
}

// ── Progress callback type ────────────────────────────────────────────────────
/**
 * @typedef {Object} ProcessProgress
 * @property {number} current     - Pages processed so far
 * @property {number} total       - Total pages to process
 * @property {string} phase       - 'loading' | 'rendering' | 'uploading' | 'done' | 'error'
 * @property {string|null} error  - Error message if phase === 'error'
 */

// ── Main pipeline ─────────────────────────────────────────────────────────────

/**
 * Process a PDF file: render all pages to JPEG, upload to storage, upsert DB records.
 *
 * @param {Object}   opts
 * @param {string}   opts.issueId
 * @param {number}   opts.renderVersion
 * @param {File|ArrayBuffer} opts.file  - The PDF file (from <input type="file">)
 * @param {function} opts.onProgress    - Called with ProcessProgress on each step
 * @returns {{ pageCount: number, error: Error|null }}
 */
export async function processPdf({ issueId, renderVersion, file, onProgress }) {
  const progress = (current, total, phase, error = null) => {
    onProgress?.({ current, total, phase, error });
  };

  try {
    // ── Mark processing started ─────────────────────────────────────────────
    await setProcessingState(issueId, 'processing');
    progress(0, 0, 'loading');

    // ── Load PDF.js ─────────────────────────────────────────────────────────
    const pdfjsLib = await getPdfJs();

    // ── Read file as ArrayBuffer ────────────────────────────────────────────
    const arrayBuffer = file instanceof ArrayBuffer
      ? file
      : await file.arrayBuffer();

    // ── Load PDF document ───────────────────────────────────────────────────
    const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const total  = pdfDoc.numPages;

    if (total === 0) throw new Error('PDF has no pages');

    progress(0, total, 'rendering');

    const pageRecords = [];

    // ── Process each page ────────────────────────────────────────────────────
    for (let i = 1; i <= total; i++) {
      progress(i - 1, total, 'rendering');

      // Render
      const pdfPage = await pdfDoc.getPage(i);
      const canvas  = await renderPageToCanvas(pdfPage);
      const width   = canvas.width;
      const height  = canvas.height;

      // Convert to blobs
      const [pageBlob, thumbBlob] = await Promise.all([
        canvasToBlob(canvas, JPEG_QUALITY),
        canvasToBlob(resizeToThumb(canvas), THUMB_QUALITY),
      ]);

      progress(i - 1, total, 'uploading');

      // Upload
      const [pageResult, thumbResult] = await Promise.all([
        uploadPageImage(issueId, renderVersion, i, pageBlob),
        uploadThumbImage(issueId, renderVersion, i, thumbBlob),
      ]);

      if (pageResult.error)  throw pageResult.error;
      if (thumbResult.error) throw thumbResult.error;

      pageRecords.push({
        issue_id:               issueId,
        page_number:            i,
        source_type:            'pdf',
        source_page_key:        `page-${String(i).padStart(3, '0')}`,
        image_url:              pageResult.publicUrl,
        image_storage_path:     pageResult.storagePath,
        thumbnail_url:          thumbResult.publicUrl,
        thumbnail_storage_path: thumbResult.storagePath,
        width,
        height,
        render_version:         renderVersion,
      });
    }

    // ── Upsert all page records ──────────────────────────────────────────────
    progress(total, total, 'uploading');
    const { error: upsertErr } = await upsertPages(pageRecords);
    if (upsertErr) throw upsertErr;

    // ── Finalise issue record ────────────────────────────────────────────────
    await updatePageCount(issueId, total);
    await setProcessingState(issueId, 'ready');
    progress(total, total, 'done');

    return { pageCount: total, error: null };

  } catch (err) {
    console.error('[pdfProcessor] Error:', err);
    await setProcessingState(issueId, 'failed', err.message).catch(() => {});
    progress(0, 0, 'error', err.message);
    return { pageCount: 0, error: err };
  }
}

// ── JPEG single-page upload ───────────────────────────────────────────────────

/**
 * Upload a single JPEG file as a specific page number.
 * Used for manual page insertion (not from PDF).
 *
 * @param {Object} opts
 * @param {string} opts.issueId
 * @param {number} opts.renderVersion
 * @param {number} opts.pageNumber
 * @param {File}   opts.file
 * @returns {{ pageRecord: Object|null, error: Error|null }}
 */
export async function uploadJpegPage({ issueId, renderVersion, pageNumber, file }) {
  try {
    // Draw to canvas to get dimensions + generate thumbnail
    const img    = await loadImageFromFile(file);
    const canvas = document.createElement('canvas');
    canvas.width  = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext('2d').drawImage(img, 0, 0);

    const [pageBlob, thumbBlob] = await Promise.all([
      canvasToBlob(canvas, JPEG_QUALITY),
      canvasToBlob(resizeToThumb(canvas), THUMB_QUALITY),
    ]);

    const [pageResult, thumbResult] = await Promise.all([
      uploadPageImage(issueId, renderVersion, pageNumber, pageBlob),
      uploadThumbImage(issueId, renderVersion, pageNumber, thumbBlob),
    ]);

    if (pageResult.error)  throw pageResult.error;
    if (thumbResult.error) throw thumbResult.error;

    const pageRecord = {
      issue_id:               issueId,
      page_number:            pageNumber,
      source_type:            'jpeg',
      source_page_key:        `page-${String(pageNumber).padStart(3, '0')}`,
      image_url:              pageResult.publicUrl,
      image_storage_path:     pageResult.storagePath,
      thumbnail_url:          thumbResult.publicUrl,
      thumbnail_storage_path: thumbResult.storagePath,
      width:                  canvas.width,
      height:                 canvas.height,
      render_version:         renderVersion,
    };

    return { pageRecord, error: null };

  } catch (error) {
    return { pageRecord: null, error };
  }
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload  = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image failed to load')); };
    img.src = url;
  });
}
