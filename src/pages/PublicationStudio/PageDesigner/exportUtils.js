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
// pages = array of { blob, pageSize }
export async function generatePrintPDF(pages, issueTitle, pageSize = 'A4') {
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
    pdf.addPage([w + BLEED * 2, h + BLEED * 2], w > h ? 'landscape' : 'portrait');
    const { blob } = pages[i];
    const url = URL.createObjectURL(blob);
    // Embed image covering full bleed area
    pdf.addImage(url, 'JPEG', 0, 0, w + BLEED * 2, h + BLEED * 2);
    URL.revokeObjectURL(url);
    addCropMarks(pdf, w, h, BLEED);
  }

  return pdf;
}

// Generate multi-page screen PDF (no bleed, no crop marks, no spec page)
// pages = array of { blob, pageSize }
export async function generateScreenPDF(pages, issueTitle, pageSize = 'A4') {
  const sizes = {
    A4:        [210, 297],
    A5:        [148, 210],
    US_LETTER: [215.9, 279.4],
    SQUARE:    [200, 200],
    TABLOID:   [279.4, 215.9],
  };
  const [w, h] = sizes[pageSize] || sizes.A4;

  const pdf = new jsPDF({
    orientation: w > h ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [w, h],
  });

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) {
      pdf.addPage([w, h], w > h ? 'landscape' : 'portrait');
    }
    const { blob } = pages[i];
    const url = URL.createObjectURL(blob);
    pdf.addImage(url, 'JPEG', 0, 0, w, h);
    URL.revokeObjectURL(url);
  }

  return pdf;
}

export function downloadPDF(pdf, filename) {
  pdf.save(filename);
}
