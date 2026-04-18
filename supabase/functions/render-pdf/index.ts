// ════════════════════════════════════════════════════════════════════════════
// render-pdf — Vector PDF Export
// ════════════════════════════════════════════════════════════════════════════
//
// Converts an array of SVG strings (one per page) into a properly typeset PDF
// via Browserless.io headless Chrome. This replaces the old JPEG-raster path.
//
// Improvements over the old pipeline:
//   • Text is vector → selectable, searchable, crisp at any zoom
//   • Shapes are vector → perfectly sharp edges
//   • Images remain raster (expected — photography is always raster)
//   • Print mode adds 3mm bleed area + crop/registration marks
//   • Fonts loaded from Google Fonts CDN (Cormorant Garamond, Jost, etc.)
//
// Required env var (set via Supabase Dashboard → Edge Functions → Secrets):
//   BROWSERLESS_TOKEN — API token from https://www.browserless.io
//
// If the token is not set the function returns 503 and the client falls
// back to the existing JPEG pipeline gracefully.
//
// Request body (JSON):
//   {
//     pages:    string[]   SVG strings, one per page
//     pageSize: string     Key from PAGE_SIZES (e.g. 'A4', 'US_LETTER')
//     mode:     'screen' | 'print'
//     title:    string
//   }
//
// Response:
//   PDF binary (Content-Type: application/pdf)
//   OR { error: string } on failure
//
// ════════════════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const BROWSERLESS_TOKEN = Deno.env.get('BROWSERLESS_TOKEN')
const BROWSERLESS_BASE  = 'https://chrome.browserless.io'

// ── Page sizes (mm) ──────────────────────────────────────────────────────────
const PAGE_SIZES: Record<string, { w: number; h: number }> = {
  A4:           { w: 210,   h: 297   },
  A5:           { w: 148,   h: 210   },
  US_LETTER:    { w: 215.9, h: 279.4 },
  SQUARE:       { w: 200,   h: 200   },
  A4_LANDSCAPE: { w: 297,   h: 210   },
  A5_LANDSCAPE: { w: 210,   h: 148   },
  TABLOID:      { w: 279.4, h: 215.9 },
}

// Google Fonts used across all LWD magazine templates.
// Add families here when new ones are used in the designer.
const GFONT_QUERY = [
  'Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500',
  'Jost:wght@300;400;500;600;700',
  'Playfair+Display:ital,wght@0,400;0,500;0,700;1,400',
  'Lato:ital,wght@0,300;0,400;0,700;1,400',
  'EB+Garamond:ital,wght@0,400;0,500;1,400',
  'Libre+Baskerville:ital,wght@0,400;0,700;1,400',
  'Montserrat:wght@300;400;500;600;700',
].join('&family=')

// ── Crop marks SVG overlay ────────────────────────────────────────────────────
// Renders four corner crop marks outside the trim area.
// All measurements in mm, matching the @page bleed declarations.
function buildCropMarksSVG(trimW: number, trimH: number, bleed: number): string {
  const b   = bleed
  const ml  = 4   // mark length (mm)
  const gap = 1   // gap between trim edge and mark start (mm)
  const totalW = trimW + b * 2
  const totalH = trimH + b * 2

  return `<svg
    style="position:absolute;top:0;left:0;overflow:visible;pointer-events:none"
    width="${totalW}mm" height="${totalH}mm"
    viewBox="0 0 ${totalW} ${totalH}"
    xmlns="http://www.w3.org/2000/svg">
  <g stroke="#000000" stroke-width="0.25" fill="none">
    <!-- top-left -->
    <line x1="${b - gap - ml}" y1="${b}" x2="${b - gap}" y2="${b}"/>
    <line x1="${b}" y1="${b - gap - ml}" x2="${b}" y2="${b - gap}"/>
    <!-- top-right -->
    <line x1="${b + trimW + gap}" y1="${b}" x2="${b + trimW + gap + ml}" y2="${b}"/>
    <line x1="${b + trimW}" y1="${b - gap - ml}" x2="${b + trimW}" y2="${b - gap}"/>
    <!-- bottom-left -->
    <line x1="${b - gap - ml}" y1="${b + trimH}" x2="${b - gap}" y2="${b + trimH}"/>
    <line x1="${b}" y1="${b + trimH + gap}" x2="${b}" y2="${b + trimH + gap + ml}"/>
    <!-- bottom-right -->
    <line x1="${b + trimW + gap}" y1="${b + trimH}" x2="${b + trimW + gap + ml}" y2="${b + trimH}"/>
    <line x1="${b + trimW}" y1="${b + trimH + gap}" x2="${b + trimW}" y2="${b + trimH + gap + ml}"/>
    <!-- registration circles (centre marks) -->
    <circle cx="${b + trimW / 2}" cy="${b - gap - ml / 2}" r="1" stroke="#000" stroke-width="0.2"/>
    <circle cx="${b + trimW / 2}" cy="${b + trimH + gap + ml / 2}" r="1" stroke="#000" stroke-width="0.2"/>
  </g>
</svg>`
}

// ── HTML document builder ────────────────────────────────────────────────────
function buildHTML(
  svgPages: string[],
  sizeKey: string,
  mode: 'screen' | 'print',
  title: string,
): string {
  const size    = PAGE_SIZES[sizeKey] || PAGE_SIZES.A4
  const isPrint = mode === 'print'
  const bleed   = isPrint ? 3 : 0
  const totalW  = size.w + bleed * 2
  const totalH  = size.h + bleed * 2

  const pagesHtml = svgPages.map((rawSvg, i) => {
    // Fabric exports SVG with pixel width/height (e.g., width="794" height="1123").
    // We remove those so CSS controls the size; the viewBox handles scaling.
    const svg = rawSvg
      // strip XML declaration (not valid inside HTML body)
      .replace(/<\?xml[^?]*\?>\s*/i, '')
      // strip DOCTYPE
      .replace(/<!DOCTYPE[^>]*>\s*/i, '')
      // replace Fabric's pixel dimensions with 100%/100% — CSS will size the SVG
      .replace(/(<svg[^>]*)\s+width="[^"]*"/, '$1')
      .replace(/(<svg[^>]*)\s+height="[^"]*"/, '$1')

    const cropMarks = isPrint ? buildCropMarksSVG(size.w, size.h, bleed) : ''

    return `<div class="page" id="p${i + 1}">
      <div class="trim">${svg}</div>
      ${cropMarks}
    </div>`
  }).join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${GFONT_QUERY}&display=swap" rel="stylesheet">
<style>
  @page {
    size: ${totalW}mm ${totalH}mm;
    margin: 0;
    ${isPrint ? `marks: crop cross; bleed: ${bleed}mm;` : ''}
  }
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  .page {
    width:  ${totalW}mm;
    height: ${totalH}mm;
    position: relative;
    overflow: hidden;
    page-break-after: always;
    break-after: page;
  }
  .page:last-child { page-break-after: avoid; break-after: avoid; }

  /* trim box — the actual page content area, inset by bleed on all sides */
  .trim {
    position: absolute;
    top:    ${bleed}mm;
    left:   ${bleed}mm;
    width:  ${size.w}mm;
    height: ${size.h}mm;
    overflow: hidden;
  }

  /* Make Fabric's SVG fill the trim box exactly */
  .trim > svg {
    display: block;
    width:  100% !important;
    height: 100% !important;
  }
</style>
</head>
<body>
${pagesHtml}
</body>
</html>`
}

// ── Handler ──────────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    // Guard — token must be configured
    if (!BROWSERLESS_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'BROWSERLESS_TOKEN secret not set. Add it in Supabase Dashboard → Edge Functions → Secrets, then redeploy.' }),
        { status: 503, headers: { ...CORS, 'Content-Type': 'application/json' } },
      )
    }

    const body = await req.json()
    const { pages, pageSize, mode, title } = body as {
      pages:    string[]
      pageSize: string
      mode:     'screen' | 'print'
      title:    string
    }

    if (!Array.isArray(pages) || pages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'pages array is required and must not be empty' }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } },
      )
    }

    const size    = PAGE_SIZES[pageSize] || PAGE_SIZES.A4
    const isPrint = mode === 'print'
    const bleed   = isPrint ? 3 : 0
    const totalW  = size.w + bleed * 2
    const totalH  = size.h + bleed * 2

    const html = buildHTML(pages, pageSize, mode, title || 'Magazine')

    // ── Call Browserless ─────────────────────────────────────────────────────
    const blessRes = await fetch(`${BROWSERLESS_BASE}/pdf?token=${BROWSERLESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html,
        options: {
          printBackground:  true,
          width:            `${totalW}mm`,
          height:           `${totalH}mm`,
          preferCSSPageSize: true,
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
        },
        // Give fonts + cross-origin images time to load before printing
        waitDelay: 1800,
      }),
    })

    if (!blessRes.ok) {
      const errBody = await blessRes.text().catch(() => '')
      throw new Error(`Browserless ${blessRes.status}: ${errBody.slice(0, 200)}`)
    }

    const pdfBuffer = await blessRes.arrayBuffer()

    if (pdfBuffer.byteLength < 1000) {
      throw new Error('Browserless returned an empty or corrupt PDF')
    }

    const safeName = (title || 'magazine').toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const suffix   = isPrint ? '_PRINT_READY' : '_digital'

    return new Response(pdfBuffer, {
      headers: {
        ...CORS,
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${safeName}${suffix}.pdf"`,
        'Content-Length':      String(pdfBuffer.byteLength),
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[render-pdf]', msg)
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } },
    )
  }
})
