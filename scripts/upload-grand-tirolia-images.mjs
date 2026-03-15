// ═══════════════════════════════════════════════════════════════════════════
// Upload Grand Tirolia images → Supabase Storage (listing-media bucket)
// Then patch the listing record URLs from local paths → CDN URLs
// Run: node scripts/upload-grand-tirolia-images.mjs
// ═══════════════════════════════════════════════════════════════════════════
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ───────────────────────────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync(join(__dirname, '..', '.env.local'), 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const SUPABASE_URL  = env.SUPABASE_URL;
const SERVICE_KEY   = env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET        = 'listing-media';
const FOLDER        = 'grand-tirolia';
const IMG_DIR       = join(__dirname, '..', 'public', 'grand-tirolia');
const LISTING_SLUG  = 'grand-tirolia';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ── MIME helper ───────────────────────────────────────────────────────────────
function mimeType(filename) {
  const ext = extname(filename).toLowerCase();
  const map = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' };
  return map[ext] || 'application/octet-stream';
}

// ── CDN URL builder ───────────────────────────────────────────────────────────
function cdnUrl(filename) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${FOLDER}/${encodeURIComponent(filename)}`;
}

// ── Local path → CDN URL map (built after uploads) ───────────────────────────
const URL_MAP = {};

// ── 1. Upload all images ──────────────────────────────────────────────────────
async function uploadImages() {
  const files = readdirSync(IMG_DIR).filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));
  console.log(`\n📁  Found ${files.length} images in public/grand-tirolia/\n`);

  let ok = 0, skipped = 0, failed = 0;

  for (const filename of files) {
    const localPath  = `/grand-tirolia/${filename}`;
    const storagePath = `${FOLDER}/${filename}`;
    const fileBuffer = readFileSync(join(IMG_DIR, filename));
    const mime       = mimeType(filename);

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, { contentType: mime, upsert: true });

    if (error) {
      console.error(`  ❌  ${filename} — ${error.message}`);
      failed++;
    } else {
      const url = cdnUrl(filename);
      URL_MAP[localPath] = url;
      console.log(`  ✅  ${filename}`);
      ok++;
    }
  }

  console.log(`\n  Uploaded: ${ok}  Skipped: ${skipped}  Failed: ${failed}\n`);
  return ok > 0;
}

// ── 2. Deep-replace all local URLs in a value ─────────────────────────────────
function replaceUrls(value) {
  if (typeof value === 'string') {
    // Try exact match first
    if (URL_MAP[value]) return URL_MAP[value];
    // Partial replace (e.g. embedded in a longer string)
    let v = value;
    for (const [local, cdn] of Object.entries(URL_MAP)) {
      v = v.split(local).join(cdn);
    }
    return v;
  }
  if (Array.isArray(value)) return value.map(replaceUrls);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, replaceUrls(v)]));
  }
  return value;
}

// ── 3. Fetch listing, patch URLs, update ─────────────────────────────────────
async function patchListing() {
  console.log('🔍  Fetching listing from DB...');

  const { data: listing, error: fetchErr } = await supabase
    .from('listings')
    .select('*')
    .eq('slug', LISTING_SLUG)
    .single();

  if (fetchErr) { console.error('Fetch error:', fetchErr.message); return; }

  // Fields that can contain local image URLs
  const URL_FIELDS = [
    'hero_images', 'media_items',
    'spaces',
    'rooms_images',
    'dining_menu_images',
    'catering_cards',
    'wedding_weekend_days',
    'estate_items',
    'nearby_items',
    'contact_profile',
    // Scalar fields that hold single image URLs
    'hero_video_url',
  ];

  // Also check plain text fields that might store a single path
  const SCALAR_URL_FIELDS = [
    'hero_caption',
  ];

  const patch = {};

  for (const field of URL_FIELDS) {
    if (listing[field] !== undefined && listing[field] !== null) {
      const patched = replaceUrls(listing[field]);
      const original = JSON.stringify(listing[field]);
      const updated  = JSON.stringify(patched);
      if (original !== updated) {
        patch[field] = patched;
        console.log(`  🔄  ${field} — URLs updated`);
      } else {
        console.log(`  ⚪  ${field} — no local URLs found`);
      }
    }
  }

  if (Object.keys(patch).length === 0) {
    console.log('\n⚠️  No local URLs found in listing — nothing to patch.');
    return;
  }

  console.log(`\n📝  Patching ${Object.keys(patch).length} fields in listing...`);

  const { data: updated, error: updateErr } = await supabase
    .from('listings')
    .update(patch)
    .eq('id', listing.id)
    .select('id, venue_name, slug')
    .single();

  if (updateErr) { console.error('Update error:', updateErr.message); return; }

  console.log('✅  Listing patched:', JSON.stringify(updated, null, 2));
}

// ── Run ───────────────────────────────────────────────────────────────────────
console.log('🚀  Grand Tirolia — Image Upload + URL Patch\n' + '═'.repeat(50));
const uploaded = await uploadImages();
if (uploaded) {
  await patchListing();
} else {
  console.error('No images uploaded — skipping patch.');
}

// Print sample CDN URLs
console.log('\n📎  Sample CDN URLs:');
Object.entries(URL_MAP).slice(0, 3).forEach(([local, cdn]) => {
  console.log(`  ${local}\n  → ${cdn}\n`);
});
