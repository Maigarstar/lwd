/**
 * seoService.js
 * SEO status queries and AI-powered SEO generation for listings.
 * Reuses the ai-generate Edge Function and existing prompt builders.
 */

import { supabase } from '../lib/supabaseClient';
import {
  buildSeoTitlePrompt,
  buildSeoDescriptionPrompt,
  buildSeoKeywordsPrompt,
  SEO_SYSTEM,
} from '../lib/aiPrompts';

// ── Core AI caller ─────────────────────────────────────────────────────────────

async function callAI(feature, userPrompt) {
  const { data, error } = await supabase.functions.invoke('ai-generate', {
    body: { feature, systemPrompt: SEO_SYSTEM, userPrompt },
  });
  if (error) throw new Error(error.message || 'AI service error');
  if (!data || data.error) {
    const msg = data?.status === 'not_configured'
      ? 'AI not configured - set up a provider in Admin > AI Settings'
      : (data?.error || 'AI service unavailable');
    throw new Error(msg);
  }
  return (data.text || '').trim();
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
