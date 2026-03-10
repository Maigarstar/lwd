/**
 * pageService — Supabase CRUD operations for pages
 *
 * Phase 1: Stubs for integration
 * Phase 2+: Implement actual Supabase calls
 *
 * Functions:
 * - createPage(formData) — Create new page
 * - updatePage(pageId, formData) — Update existing page
 * - getPageById(pageId) — Fetch page for editing
 * - publishPage(pageId) — Set page status to published
 * - deletePage(pageId) — Delete page
 */

// Phase 1: No Supabase import yet
// Phase 2+: import { supabase } from '../../../supabase';

/**
 * Create new page in Supabase
 * Phase 1: Stub (returns input)
 * Phase 2+: Actual Supabase call
 */
export async function createPage(formData) {
  try {
    // Phase 1: Just return the formData as if saved
    // Phase 2+: await supabase.from('pages').insert([...]).select()
    return formData;
  } catch (err) {
    console.error('Error creating page:', err);
    throw err;
  }
}

/**
 * Update existing page in Supabase
 * Phase 1: Stub (returns input)
 * Phase 2+: Actual Supabase call
 */
export async function updatePage(pageId, formData) {
  try {
    // Phase 1: Just return the formData as if saved
    // Phase 2+: await supabase.from('pages').update({...}).eq('id', pageId)
    return formData;
  } catch (err) {
    console.error('Error updating page:', err);
    throw err;
  }
}

/**
 * Fetch page by ID from Supabase
 * Phase 1: Stub (returns null)
 * Phase 2+: Actual Supabase call
 */
export async function getPageById(pageId) {
  try {
    // Phase 1: Return default/mock data
    // Phase 2+: await supabase.from('pages').select().eq('id', pageId).single()
    return null;
  } catch (err) {
    console.error('Error fetching page:', err);
    throw err;
  }
}

/**
 * Publish page (set status to 'published' and set published_at)
 * Phase 1: Stub
 * Phase 2+: Actual Supabase call
 */
export async function publishPage(pageId, formData) {
  try {
    // Phase 1: Stub
    // Phase 2+: await supabase.from('pages').update({...}).eq('id', pageId)
    return formData;
  } catch (err) {
    console.error('Error publishing page:', err);
    throw err;
  }
}

/**
 * Delete page from Supabase
 * Phase 1: Stub
 * Phase 2+: Actual Supabase call
 */
export async function deletePage(pageId) {
  try {
    // Phase 1: Stub
    // Phase 2+: await supabase.from('pages').delete().eq('id', pageId)
    return true;
  } catch (err) {
    console.error('Error deleting page:', err);
    throw err;
  }
}
