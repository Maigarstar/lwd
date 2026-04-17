import { jsPDF } from 'jspdf';

// Export canvas to JPEG blob (for digital reader)
export async function canvasToJpegBlob(fabricCanvas, multiplier = 3) {
  const dataUrl = fabricCanvas.toDataURL({
    format: 'jpeg',
    quality: 0.92,
    multiplier,
  });
  const res = await fetch(dataUrl);
  return await res.blob();
}

// Export canvas to JPEG blob at 4x for print quality (~380 DPI)
export async function canvasToPrintJpegBlob(fabricCanvas) {
  return canvasToJpegBlob(fabricCanvas, 4);
}

// Generate multi-page print-ready PDF
// pages = array of { blob, pageSize, canvasJSON? }
// onProgress(pageIndex, total) — optional progress callback
export async function generatePrintPDF(pages, issueTitle, pageSize = 'A4', onProgress) {
  const sizes = {
    A4:        [210, 297],
    A5:        [148, 210],
    US_LETTER: [215.9, 279.4],
    SQUARE:    [200, 200],
    TABLOID:   [279.4, 215.9],
  };
  const [w, h] = sizes[pageSize] || sizes.A4;
  const BLEED = 3; // 3mm bleed on all sides

  const pdf = new jsPDF({
    orientation: w > h ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [w + BLEED * 2, h + BLEED * 2],
  });

  // Cover/spec page
  pdf.setFillColor(26, 24, 20);
  pdf.rect(0, 0, w + BLEED * 2, h + BLEED * 2, 'F');
  pdf.setTextColor(201, 169, 110);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(issueTitle || 'Magazine Issue', (w + BLEED * 2) / 2, 40, { align: 'center' });
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const specs = [
    `Page size: ${w}mm \u00d7 ${h}mm`,
    `Bleed: ${BLEED}mm all sides`,
    `Safe zone: 5mm inside trim edge`,
    `Colour profile: sRGB (printer converts to CMYK)`,
    `Resolution: ~380 DPI (print quality)`,
    `Pages: ${pages.length}`,
    `Generated: ${new Date().toLocaleDateString('en-GB')}`,
  ];
  specs.forEach((line, i) => {
    pdf.text(line, (w + BLEED * 2) / 2, 70 + i * 10, { align: 'center' });
  });
  pdf.setFontSize(8);
  pdf.setTextColor(201, 169, 110);
  pdf.text('LUXURY WEDDING DIRECTORY \u2014 PRINT READY', (w + BLEED * 2) / 2, h - 20, { align: 'center' });

  // Add crop marks as vectors
  function addCropMarks(doc, pw, ph, bleed) {
    const markLen = 5;
    const markGap = 2;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.25);
    // Top-left
    doc.line(bleed - markGap - markLen, bleed, bleed - markGap, bleed);
    doc.line(bleed, bleed - markGap - markLen, bleed, bleed - markGap);
    // Top-right
    doc.line(pw + bleed + markGap, bleed, pw + bleed + markGap + markLen, bleed);
    doc.line(pw + bleed, bleed - markGap - markLen, pw + bleed, bleed - markGap);
    // Bottom-left
    doc.line(bleed - markGap - markLen, ph + bleed, bleed - markGap, ph + bleed);
    doc.line(bleed, ph + bleed + markGap, bleed, ph + bleed + markGap + markLen);
    // Bottom-right
    doc.line(pw + bleed + markGap, ph + bleed, pw + bleed + markGap + markLen, ph + bleed);
    doc.line(pw + bleed, ph + bleed + markGap, pw + bleed, ph + bleed + markGap + markLen);
  }

  // Content pages
  for (let i = 0; i < pages.length; i++) {
    onProgress?.(i, pages.length);
    pdf.addPage([w + BLEED * 2, h + BLEED * 2], w > h ? 'landscape' : 'portrait');
    const { blob } = pages[i];
    const url = URL.createObjectURL(blob);
    // Embed image covering full bleed area
    pdf.addImage(url, 'JPEG', 0, 0, w + BLEED * 2, h + BLEED * 2);
    URL.revokeObjectURL(url);
    addCropMarks(pdf, w, h, BLEED);
  }
  onProgress?.(pages.length, pages.length);

  return pdf;
}

// Generate multi-page screen PDF (no bleed, no crop marks, no spec page)
// pages = array of { blob, pageSize, canvasJSON? }
// onProgress(pageIndex, total) — optional progress callback
export async function generateScreenPDF(pages, issueTitle, pageSize = 'A4', onProgress) {
  const sizes = {
    A4:        [210, 297],
    A5:        [148, 210],
    US_LETTER: [215.9, 279.4],
    SQUARE:    [200, 200],
    TABLOID:   [279.4, 215.9],
  };
  const [w, h] = sizes[pageSize] || sizes.A4;
  const docW = w;
  const docH = h;

  const pdf = new jsPDF({
    orientation: w > h ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [w, h],
  });

  for (let i = 0; i < pages.length; i++) {
    onProgress?.(i, pages.length);
    if (i > 0) {
      pdf.addPage([w, h], w > h ? 'landscape' : 'portrait');
    }
    const { blob } = pages[i];
    const url = URL.createObjectURL(blob);
    pdf.addImage(url, 'JPEG', 0, 0, w, h);
    URL.revokeObjectURL(url);

    // ── Feature B: invisible text layer for searchability/selectability ───────
    const scaleX = docW / 794;   // ratio from reference (794px wide) to PDF mm
    const scaleY = docH / 1123;  // ratio from reference (1123px tall) to PDF mm
    const objects = pages[i].canvasJSON?.objects || [];
    objects.forEach(obj => {
      if (obj.type !== 'textbox' || !obj.text) return;
      try {
        pdf.setTextColor(255, 255, 255, 0); // fully transparent
        const ptSize = (obj.fontSize || 16) * scaleY * 0.75; // px → pt conversion
        pdf.setFontSize(Math.max(1, ptSize));
        pdf.setFont('helvetica');
        const x = (obj.left || 0) * scaleX;
        const y = ((obj.top || 0) + (obj.fontSize || 16)) * scaleY;
        pdf.text(obj.text, x, y, {
          baseline: 'top',
          maxWidth: (obj.width || 200) * scaleX,
        });
      } catch (_) { /* skip malformed objects */ }
    });
    pdf.setTextColor(0); // reset to black
  }
  onProgress?.(pages.length, pages.length);

  return pdf;
}

export function downloadPDF(pdf, filename) {
  pdf.save(filename);
}

// ── Feature A: HTML5 Export ──────────────────────────────────────────────────
// Renders all pages off-screen via Fabric, wraps in a self-contained HTML file.
// pages = array of { canvasJSON, thumbnailDataUrl? }
export async function generateHTML5Export(pages, issueTitle) {
  const { Canvas: FC } = await import('fabric');
  const { FabricObject } = await import('fabric');
  FabricObject.ownDefaults.originX = 'left';
  FabricObject.ownDefaults.originY = 'top';

  const pageDataUrls = [];
  const offEl = document.createElement('canvas');
  offEl.width  = 794;
  offEl.height = 1123;
  const fc = new FC(offEl, { width: 794, height: 1123, enableRetinaScaling: false });

  try {
    for (const page of pages) {
      fc.clear();
      fc.backgroundColor = '#ffffff';
      if (page.canvasJSON) {
        await fc.loadFromJSON(page.canvasJSON);
        fc.renderAll();
        await new Promise(r => setTimeout(r, 60));
        fc.renderAll();
      }
      pageDataUrls.push(offEl.toDataURL('image/jpeg', 0.88));
    }
  } finally {
    fc.dispose();
  }

  const pagesHTML = pageDataUrls.map((url, i) => `
    <section class="page" id="page-${i + 1}">
      <img src="${url}" alt="Page ${i + 1}" />
      <div class="page-num">${i + 1}</div>
    </section>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${issueTitle || 'Magazine Issue'}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#0A0908; font-family:sans-serif; }
  .cover { padding:60px 24px 40px; text-align:center; border-bottom:1px solid rgba(201,168,76,0.2); }
  .cover h1 { font-family:Georgia,serif; font-size:32px; font-style:italic; color:#F0EBE0; margin-bottom:8px; }
  .cover p { font-size:11px; color:rgba(201,168,76,0.7); letter-spacing:0.12em; text-transform:uppercase; }
  .toc { max-width:600px; margin:40px auto; padding:0 24px; }
  .toc a { display:block; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.06); color:rgba(240,235,224,0.6); text-decoration:none; font-size:13px; }
  .toc a:hover { color:#C9A84C; }
  .page { max-width:794px; margin:40px auto; position:relative; }
  .page img { width:100%; display:block; border-radius:2px; }
  .page-num { position:absolute; bottom:12px; right:16px; font-size:10px; color:rgba(255,255,255,0.3); font-family:sans-serif; }
  footer { text-align:center; padding:40px 24px; color:rgba(255,255,255,0.2); font-size:10px; letter-spacing:0.1em; }
</style>
</head>
<body>
  <div class="cover">
    <h1>${issueTitle || 'Magazine Issue'}</h1>
    <p>Luxury Wedding Directory · Editorial</p>
  </div>
  <div class="toc">
    ${pageDataUrls.map((_, i) => `<a href="#page-${i + 1}">Page ${i + 1}</a>`).join('')}
  </div>
  ${pagesHTML}
  <footer>&copy; ${new Date().getFullYear()} Luxury Wedding Directory</footer>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(issueTitle || 'issue').toLowerCase().replace(/\s+/g, '-')}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
