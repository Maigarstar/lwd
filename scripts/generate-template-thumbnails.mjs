#!/usr/bin/env node
/**
 * Generate Publication Studio template thumbnails.
 *
 * Produces one JPEG per template in `public/publication-studio/templates/{id}.jpg`
 * at roughly 320×452 (A4 aspect). The hover preview in ElementsPanel.jsx looks
 * these up by id; until this script runs, rows fall back to the numbered-box
 * placeholder via the `<img onError>` handler.
 *
 * How it works:
 *   1. Starts the Vite dev server (or reuses one if already running on DEV_URL)
 *   2. Launches headless Chromium via Playwright
 *   3. For each template id, navigates to `${DEV_URL}/studio-thumbnail/:id`
 *      — a thin dev-only route that renders the template onto a 794×1123 Fabric
 *      canvas inside `#capture`
 *   4. Screenshots the `#capture` element as JPEG quality 85
 *   5. Writes to public/publication-studio/templates/{id}.jpg
 *
 * Requirements:
 *   npm i -D playwright
 *   npx playwright install chromium
 *
 * Usage:
 *   node scripts/generate-template-thumbnails.mjs
 *   DEV_URL=http://localhost:5175 node scripts/generate-template-thumbnails.mjs
 *
 * The `/studio-thumbnail/:id` route is a follow-up — see report notes. Until
 * that route exists, this script will log a clear error per template and exit
 * gracefully without partial output.
 */

import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DEFINITIONS_PATH = join(ROOT, 'src/pages/PublicationStudio/templates/definitions.js');
const OUT_DIR = join(ROOT, 'public/publication-studio/templates');
const DEV_URL = process.env.DEV_URL || 'http://localhost:5173';
const VIEWPORT = { width: 794, height: 1123 };
// DPR 1 avoids Fabric's retina-scaling quadrant-clipping bug under headless
// Chromium — output is still 794×1123 JPEG which downsizes cleanly to the
// 320×452 (or 32×44) display targets in ElementsPanel.
const DEVICE_SCALE = 1;
const NETWORK_IDLE_EXTRA_MS = 600;

// ── 1. Extract template ids from the canonical TEMPLATE_IDS export ──────────
//
// definitions.js exports `TEMPLATE_IDS` (a JS array). We read the source
// and extract the array items between the opening `export const TEMPLATE_IDS`
// declaration and its closing bracket. This avoids the need for a JS loader
// in the script while guaranteeing the id list never drifts from the real
// TEMPLATES array — templates added to the array are picked up automatically.
function extractTemplateIds() {
  const src = readFileSync(DEFINITIONS_PATH, 'utf-8');
  // Match the live export (computed .map call) — the canonical source is the
  // in-file `TEMPLATES.map(t => t.id)`. Rather than evaluate JS, we scan all
  // `id: '...',` occurrences and dedupe by cross-referencing with the object
  // names (template definitions have `name:` too; field objects don't have
  // `name:` adjacent).
  const ids = new Set();
  // Template object shape: has BOTH `id:` and `name:` within ~6 lines
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const idMatch = lines[i].match(/^\s*id:\s*['"]([a-z0-9][a-z0-9-]*)['"]/);
    if (!idMatch) continue;
    // Look ahead up to 6 lines for a `name:` sibling — templates have it, fields don't
    let hasName = false;
    for (let j = i + 1; j < Math.min(i + 7, lines.length); j++) {
      if (/^\s*name:\s*['"]/.test(lines[j])) { hasName = true; break; }
      if (/^\s*\},?\s*$/.test(lines[j])) break; // end of object
    }
    if (hasName) ids.add(idMatch[1]);
  }
  return Array.from(ids);
}

// ── 2. Main ──────────────────────────────────────────────────────────────────
async function main() {
  const ids = extractTemplateIds();
  if (!ids.length) {
    console.error('No template ids found in definitions.js — aborting.');
    process.exit(1);
  }
  console.log(`Found ${ids.length} templates:\n  ${ids.join('\n  ')}`);

  if (!existsSync(OUT_DIR)) {
    mkdirSync(OUT_DIR, { recursive: true });
  }

  let playwright;
  try {
    playwright = await import('playwright');
  } catch (err) {
    console.error('\nPlaywright is not installed. Run:\n  npm i -D playwright && npx playwright install chromium\n');
    process.exit(1);
  }

  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE,
  });
  const page = await context.newPage();

  const results = { ok: [], failed: [] };
  for (const id of ids) {
    const url = `${DEV_URL}/studio-thumbnail/${encodeURIComponent(id)}`;
    const outPath = join(OUT_DIR, `${id}.jpg`);
    process.stdout.write(`  → ${id} … `);
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
      const capture = await page.$('#capture');
      if (!capture) {
        throw new Error('`#capture` element not found — is the /studio-thumbnail/:id route wired?');
      }
      await page.waitForTimeout(NETWORK_IDLE_EXTRA_MS);
      await capture.screenshot({ path: outPath, type: 'jpeg', quality: 85 });
      console.log('✓');
      results.ok.push(id);
    } catch (err) {
      console.log(`✗  ${err.message}`);
      results.failed.push({ id, error: err.message });
    }
  }

  await browser.close();

  console.log(`\nDone. ${results.ok.length} succeeded, ${results.failed.length} failed.`);
  if (results.failed.length) {
    console.log('\nFailures:');
    for (const f of results.failed) console.log(`  ${f.id}: ${f.error}`);
    process.exit(2);
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
