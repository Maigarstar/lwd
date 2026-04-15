/**
 * seoService.js
 * SEO status queries and AI-powered SEO generation for listings.
 * Reuses the ai-generate Edge Function and existing prompt builders.
 */

import { supabase } from '../lib/supabaseClient';
import { callAiGenerate } from '../lib/aiGenerate';
import {
  buildSeoTitlePrompt,
  buildSeoDescriptionPrompt,
  buildSeoKeywordsPrompt,
  SEO_SYSTEM,
} from '../lib/aiPrompts';

// ── Core AI caller ─────────────────────────────────────────────────────────────

async function callAI(feature, userPrompt) {
  try {
    const data = await callAiGenerate({ feature, systemPrompt: SEO_SYSTEM, userPrompt });
    if (!data?.text) throw new Error('AI service unavailable');
    return data.text.trim();
  } catch (err) {
    const msg = err?.message || 'AI service error';
    if (msg.includes('not_configured') || msg.includes('No active AI provider')) {
      throw new Error('AI not configured - set up a provider in Admin > AI Settings');
    }
    throw new Error(msg);
  }
}

// ── Fetch SEO status for all listings ─────────────────────────────────────────

/**
 * Fetches all listings with their SEO field status.
 * Returns rows augmented with hasSeoTitle, hasSeoDesc, hasKeywords booleans.
 */
export async function fetchListingsSeoStatus() {
  const { data, error } = await supabase
    .from('listings')
    .select('id, name, slug, status, seo_title, seo_description, seo_keywords, city, region, country, venue_type, description, hero_image')
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);

  return (data || []).map(row => ({
    ...row,
    hasSeoTitle:  Boolean(row.seo_title  && row.seo_title.trim()),
    hasSeoDesc:   Boolean(row.seo_description && row.seo_description.trim()),
    hasKeywords:  Boolean(row.seo_keywords && (Array.isArray(row.seo_keywords) ? row.seo_keywords.length > 0 : row.seo_keywords.trim())),
  }));
}

// ── Build venue data for prompts ───────────────────────────────────────────────

function buildVenueData(listing) {
  const location = [listing.city, listing.region, listing.country].filter(Boolean).join(', ');
  return {
    location,
    destination: listing.country || null,
    style:       listing.venue_type || null,
    highlights:  [],
  };
}

// ── Generate SEO for a single listing ─────────────────────────────────────────

/**
 * Calls AI 3 times (sequential) to generate seo_title, seo_description, seo_keywords.
 * Patches the listing in Supabase and returns the updated row.
 * @param {object} listing - Row from fetchListingsSeoStatus (must have id, name, city, region, country, venue_type)
 */
export async function generateListingSeo(listing) {
  const name      = listing.name || 'Venue';
  const venueData = buildVenueData(listing);

  // Generate each field sequentially to avoid rate limits
  const seoTitle = await callAI('seo_title', buildSeoTitlePrompt(name, venueData));

  // 400ms pause between calls
  await new Promise(r => setTimeout(r, 400));
  const seoDescription = await callAI('seo_description', buildSeoDescriptionPrompt(name, venueData));

  await new Promise(r => setTimeout(r, 400));
  const rawKeywords = await callAI('seo_keywords', buildSeoKeywordsPrompt(name, venueData));

  // Parse CSV keywords into array
  const seoKeywords = rawKeywords
    .split(',')
    .map(k => k.trim())
    .filter(Boolean);

  // Patch to Supabase
  const { data, error } = await supabase
    .from('listings')
    .update({ seo_title: seoTitle, seo_description: seoDescription, seo_keywords: seoKeywords })
    .eq('id', listing.id)
    .select('id, name, slug, status, seo_title, seo_description, seo_keywords, city, region, country, venue_type, description, hero_image')
    .single();

  if (error) throw new Error(error.message);

  return {
    ...data,
    hasSeoTitle: Boolean(data.seo_title?.trim()),
    hasSeoDesc:  Boolean(data.seo_description?.trim()),
    hasKeywords: Boolean(data.seo_keywords?.length > 0),
  };
}

// ── Bulk generate SEO for all missing listings ─────────────────────────────────

/**
 * Generates SEO for all listings missing seo_title OR seo_description.
 * Runs sequentially with 400ms delays to respect rate limits.
 * Calls onProgress(current, total) and onListingDone(id, updatedRow | null) after each.
 *
 * @param {object[]} listings          - From fetchListingsSeoStatus()
 * @param {{ onProgress?, onListingDone? }} callbacks
 * @returns {{ generated: number, failed: number }}
 */
export async function bulkGenerateSeo(listings, { onProgress, onListingDone } = {}) {
  const targets = listings.filter(l => !l.hasSeoTitle || !l.hasSeoDesc);
  let generated = 0;
  let failed    = 0;

  for (let i = 0; i < targets.length; i++) {
    const listing = targets[i];
    onProgress?.(i, targets.length);

    try {
      const updated = await generateListingSeo(listing);
      generated++;
      onListingDone?.(listing.id, updated);
    } catch (err) {
      failed++;
      console.error(`SEO generation failed for ${listing.name}:`, err);
      onListingDone?.(listing.id, null);
    }

    // 400ms between listings (on top of the 800ms inside generateListingSeo)
    if (i < targets.length - 1) {
      await new Promise(r => setTimeout(r, 400));
    }
  }

  onProgress?.(targets.length, targets.length);
  return { generated, failed };
}

// ── Generate SEO for a single magazine article ─────────────────────────────────

/**
 * Calls AI to generate seo_title + meta_description for a magazine article.
 * Patches magazine_posts in Supabase and returns the updated post object.
 * @param {object} post - Post from fetchPosts (must have id, title)
 */
export async function generateArticleSeo(post) {
  const title    = post.title || 'Article';
  const category = post.category_label || post.category_slug || '';
  const excerpt  = post.excerpt || '';

  const userPrompt = `Generate SEO metadata for this luxury wedding magazine article.

ARTICLE INFORMATION:
Title: ${title}${category ? `\nCategory: ${category}` : ''}${excerpt ? `\nExcerpt: ${excerpt}` : ''}

Generate:
1. SEO title (50-60 characters, include category context and luxury appeal)
2. Meta description (150-160 characters, compelling, keyword-rich, encourage clicks)

RETURN JSON ONLY in this exact format (no extra text):
{"seo_title": "...", "meta_description": "..."}`;

  const raw = await callAI('seo', userPrompt);

  let parsed;
  try {
    const match = raw.match(/\{[\s\S]*?\}/);
    parsed = JSON.parse(match ? match[0] : raw);
  } catch {
    throw new Error('AI returned unexpected response format');
  }

  const { seo_title, meta_description } = parsed;
  if (!seo_title || !meta_description) throw new Error('AI response missing seo_title or meta_description');

  const { data, error } = await supabase
    .from('magazine_posts')
    .update({ seo_title, meta_description })
    .eq('id', post.id)
    .select('id, seo_title, meta_description, og_title, og_description, og_image')
    .single();

  if (error) throw new Error(error.message);

  return { ...post, ...data };
}

// ── Bulk generate SEO for all magazine articles missing metadata ───────────────

/**
 * Generates SEO for all articles missing seo_title OR meta_description.
 * Runs sequentially with delays to respect rate limits.
 * @param {object[]} posts - From fetchPosts
 * @param {{ onProgress?, onPostDone? }} callbacks
 */
export async function bulkGenerateArticleSeo(posts, { onProgress, onPostDone } = {}) {
  const targets = posts.filter(p => !p.seo_title || !p.meta_description);
  let generated = 0;
  let failed    = 0;

  for (let i = 0; i < targets.length; i++) {
    const post = targets[i];
    onProgress?.(i, targets.length);

    try {
      const updated = await generateArticleSeo(post);
      generated++;
      onPostDone?.(post.id, updated);
    } catch (err) {
      failed++;
      console.error(`SEO generation failed for "${post.title}":`, err);
      onPostDone?.(post.id, null);
    }

    if (i < targets.length - 1) {
      await new Promise(r => setTimeout(r, 600));
    }
  }

  onProgress?.(targets.length, targets.length);
  return { generated, failed };
}

// ── SEO Primary Pages (DB-backed cannibalisation resolution) ─────────────────

/**
 * Fetches all primary page designations.
 * Returns a map keyed by conflict_key for O(1) lookups.
 */
export async function fetchPrimaryPages() {
  const { data, error } = await supabase
    .from('seo_primary_pages')
    .select('*')
    .order('set_at', { ascending: false });
  if (error) throw new Error(error.message);
  const map = {};
  (data || []).forEach(row => { map[row.conflict_key] = row; });
  return map;
}

/**
 * Upserts a primary page designation.
 * @param {string} conflictKey - e.g. "showcase-villa-rosa"
 * @param {string} primaryId - UUID of the entity set as primary
 * @param {string} primaryName - display name at time of designation
 * @param {string} primaryType - 'listing' | 'showcase' | 'article'
 * @param {object} conflict - { type, slug, name } of the competing entity
 */
export async function setPrimaryPage(conflictKey, primaryId, primaryName, primaryType, conflict) {
  const { data, error } = await supabase
    .from('seo_primary_pages')
    .upsert({
      conflict_key: conflictKey,
      primary_id: primaryId,
      primary_name: primaryName,
      primary_type: primaryType,
      conflict_type: conflict.type || primaryType,
      conflict_slug: conflict.slug || null,
      conflict_name: conflict.name || null,
      set_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'conflict_key' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Removes a primary page designation.
 */
export async function removePrimaryPage(conflictKey) {
  const { error } = await supabase
    .from('seo_primary_pages')
    .delete()
    .eq('conflict_key', conflictKey);
  if (error) throw new Error(error.message);
}

// ── IndexNow — real-time discovery ping ───────────────────────────────────────

const SITE_URL_BASE  = "https://www.luxuryweddingdirectory.co.uk";
const INDEX_NOW_URL  = "https://api.indexnow.org/indexnow";

// In-process cache for the IndexNow key (avoids DB hit on every publish)
let _indexNowKey  = null;
let _indexNowTs   = 0;
const KEY_CACHE_MS = 60 * 60 * 1000; // 1 hour

async function getIndexNowKey() {
  const now = Date.now();
  if (_indexNowKey && now - _indexNowTs < KEY_CACHE_MS) return _indexNowKey;

  const { data } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "seo_indexnow_key")
    .maybeSingle();

  _indexNowKey = data?.value?.trim() || null;
  _indexNowTs  = now;
  return _indexNowKey;
}

/**
 * Pings IndexNow with one or more absolute URLs.
 * Silently no-ops if no IndexNow key is configured.
 * @param {string|string[]} urls
 * @returns {Promise<{ok:boolean, status?:number, error?:string}>}
 */
export async function pingIndexNow(urls) {
  try {
    const key = await getIndexNowKey();
    if (!key) return { ok: false, error: "no_key" };

    const urlList = (Array.isArray(urls) ? urls : [urls]).filter(Boolean);
    if (!urlList.length) return { ok: false, error: "no_urls" };

    const res = await fetch(INDEX_NOW_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body:    JSON.stringify({
        host:        "www.luxuryweddingdirectory.co.uk",
        key,
        keyLocation: `${SITE_URL_BASE}/${key}.txt`,
        urlList,
      }),
    });

    return { ok: res.status === 200 || res.status === 202, status: res.status };
  } catch (err) {
    console.warn("[seoService] IndexNow ping failed:", err);
    return { ok: false, error: err.message };
  }
}

/**
 * Convenience wrapper for magazine articles.
 * Builds the canonical URL from category + article slug and pings IndexNow.
 * @param {string} categorySlug
 * @param {string} articleSlug
 */
export async function pingIndexNowForArticle(categorySlug, articleSlug) {
  if (!categorySlug || !articleSlug) return;
  const url = `${SITE_URL_BASE}/magazine/${categorySlug}/${articleSlug}`;
  return pingIndexNow(url);
}
