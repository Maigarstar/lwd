// ═══════════════════════════════════════════════════════════════════════════
// referenceAttributionService.js — Full-funnel revenue attribution
//
// Tracks the chain: Article → Reference Click → Listing View → Enquiry
//
// Flow:
//   1. User reads article, clicks a reference link (tracked by referenceService)
//   2. Reference link includes ?ref=article&ref_post=<postId>&ref_id=<refId>
//   3. Listing page captures these params → sessionStorage
//   4. When enquiry is submitted, attribution data is included
//   5. Attribution record links enquiry back to the originating article
//
// This enables: "This article drove X enquiries worth $Y"
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'lwd:ref-attribution';

// ── Capture attribution from URL params (call on listing page mount) ────────
export function captureReferenceAttribution() {
  try {
    const params = new URLSearchParams(window.location.search);
    const refSource = params.get('ref');
    if (!refSource) return null;

    const attribution = {
      source: refSource,              // 'article'
      postId: params.get('ref_post'), // originating article ID
      refId: params.get('ref_id'),    // reference record ID
      capturedAt: new Date().toISOString(),
      landingUrl: window.location.pathname,
    };

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));

    // Clean URL params without reload
    const clean = new URL(window.location);
    clean.searchParams.delete('ref');
    clean.searchParams.delete('ref_post');
    clean.searchParams.delete('ref_id');
    window.history.replaceState({}, '', clean.toString());

    return attribution;
  } catch (_) {
    return null;
  }
}

// ── Get stored attribution (call when submitting enquiry) ───────────────────
export function getStoredAttribution() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Expire after 30 minutes
    if (Date.now() - new Date(data.capturedAt).getTime() > 30 * 60 * 1000) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch (_) {
    return null;
  }
}

// ── Clear attribution after use ─────────────────────────────────────────────
export function clearAttribution() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch (_) {}
}

// ── Log attribution event to Supabase (fire-and-forget) ─────────────────────
export async function logReferenceConversion({ listingId, listingSlug, enquiryType, attribution }) {
  if (!attribution?.postId) return;
  try {
    const { supabase } = await import('../lib/supabaseClient');
    await supabase.from('reference_conversions').insert({
      post_id: attribution.postId,
      reference_id: attribution.refId || null,
      listing_id: listingId || null,
      listing_slug: listingSlug || null,
      conversion_type: enquiryType || 'enquiry',
      landing_url: attribution.landingUrl || null,
      session_id: null,
      viewport: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
    });
  } catch (e) {
    // Non-critical — never block enquiry submission, but surface the error for debugging
    console.warn('[referenceAttribution] Failed to log conversion:', e?.message);
  }
}

// ── Build attribution URL params (for reference links in articles) ──────────
export function buildAttributionParams({ postId, referenceId }) {
  const params = new URLSearchParams();
  params.set('ref', 'article');
  if (postId) params.set('ref_post', postId);
  if (referenceId) params.set('ref_id', referenceId);
  return params.toString();
}
