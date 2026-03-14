// ─── showcaseService.js ───────────────────────────────────────────────────────
// CRUD for venue_showcases table
// Supports: venue and planner showcase types
// RLS disabled, anon key writes (matches magazine_posts pattern)
// ─────────────────────────────────────────────────────────────────────────────
import { supabase, isSupabaseAvailable } from '../lib/supabaseClient';

// ── Transform: DB row → admin card shape ─────────────────────────────────────
function dbToCard(row) {
  return {
    id:           row.id,
    type:         row.type         || 'venue',
    name:         row.title,                          // UI uses 'name'
    slug:         row.slug,
    location:     row.location     || '',
    excerpt:      row.excerpt      || '',
    heroImage:    row.hero_image_url || '',
    logo:         row.logo_url     || '',
    previewUrl:   row.preview_url  || '',
    listingId:    row.listing_id   || '',
    status:       row.status       || 'draft',
    sections:     Array.isArray(row.sections)  ? row.sections  : [],
    stats:        Array.isArray(row.key_stats) ? row.key_stats : [],
    sortOrder:    row.sort_order   ?? 0,
    publishedAt:  row.published_at || null,
    lastUpdated:  row.updated_at
      ? new Date(row.updated_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
      : '',
    createdAt:    row.created_at,
  };
}

// ── Transform: admin form → DB insert shape ───────────────────────────────────
function formToDb(form, type = 'venue') {
  const now = new Date().toISOString();
  return {
    type:            type,
    title:           form.name || form.title || '',
    slug:            form.slug,
    location:        form.location     || null,
    excerpt:         form.excerpt      || null,
    hero_image_url:  form.heroImage    || null,
    logo_url:        form.logo         || null,
    preview_url:     form.previewUrl   || null,
    listing_id:      form.listingId    || null,
    status:          form.status       || 'draft',
    sections:        form.sections     || [],
    key_stats:       (form.stats || []).filter(s => s.value && s.label),
    sort_order:      form.sortOrder    ?? 0,
    published_at:    form.status === 'live' ? now : null,
  };
}

// ── Fetch all showcases (optionally filter by type) ───────────────────────────
export async function fetchShowcases(type = null) {
  if (!isSupabaseAvailable()) return [];
  try {
    let q = supabase
      .from('venue_showcases')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (type) q = q.eq('type', type);

    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map(dbToCard);
  } catch (err) {
    console.error('[showcaseService] fetchShowcases error:', err);
    return [];
  }
}

// ── Fetch single showcase by slug (used by dynamic ShowcasePage) ──────────────
export async function fetchShowcaseBySlug(slug) {
  if (!isSupabaseAvailable()) return null;
  try {
    const { data, error } = await supabase
      .from('venue_showcases')
      .select('*')
      .eq('slug', slug)
      .single();
    if (error) throw error;
    return data ? dbToCard(data) : null;
  } catch (err) {
    console.error('[showcaseService] fetchShowcaseBySlug error:', err);
    return null;
  }
}

// ── Create new showcase ───────────────────────────────────────────────────────
export async function createShowcase(form, type = 'venue') {
  if (!isSupabaseAvailable()) {
    // Return a mock card with a temp id so the UI still works offline
    return { ...dbToCard({ ...formToDb(form, type), id: `temp-${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }), _offline: true };
  }
  try {
    const { data, error } = await supabase
      .from('venue_showcases')
      .insert([formToDb(form, type)])
      .select()
      .single();
    if (error) throw error;
    return dbToCard(data);
  } catch (err) {
    console.error('[showcaseService] createShowcase error:', err);
    throw err;
  }
}

// ── Update showcase ───────────────────────────────────────────────────────────
export async function updateShowcase(id, form) {
  if (!isSupabaseAvailable()) return null;
  try {
    const updates = {
      title:          form.name || form.title || '',
      slug:           form.slug,
      location:       form.location     || null,
      excerpt:        form.excerpt      || null,
      hero_image_url: form.heroImage    || null,
      logo_url:       form.logo         || null,
      preview_url:    form.previewUrl   || null,
      listing_id:     form.listingId    || null,
      status:         form.status       || 'draft',
      sections:       form.sections     || [],
      key_stats:      (form.stats || []).filter(s => s.value && s.label),
      sort_order:     form.sortOrder    ?? 0,
      ...(form.status === 'live' && !form.publishedAt ? { published_at: new Date().toISOString() } : {}),
    };
    const { data, error } = await supabase
      .from('venue_showcases')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return dbToCard(data);
  } catch (err) {
    console.error('[showcaseService] updateShowcase error:', err);
    throw err;
  }
}

// ── Delete showcase ───────────────────────────────────────────────────────────
export async function deleteShowcase(id) {
  if (!isSupabaseAvailable()) return;
  try {
    const { error } = await supabase
      .from('venue_showcases')
      .delete()
      .eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.error('[showcaseService] deleteShowcase error:', err);
    throw err;
  }
}
