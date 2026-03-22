// ─── showcaseService.js ───────────────────────────────────────────────────────
// CRUD for venue_showcases table
// Supports: venue and planner showcase types
// RLS disabled, anon key writes (matches magazine_posts pattern)
// ─────────────────────────────────────────────────────────────────────────────
// STATUS MAPPING NOTE:
//   UI uses:  'draft' | 'live'
//   DB uses:  'draft' | 'published' | 'archived'
//   'live' ↔ 'published' are the same concept — map at every boundary.
// ─────────────────────────────────────────────────────────────────────────────
import { supabase, isSupabaseAvailable } from '../lib/supabaseClient';

// Map UI status → DB status
function toDbStatus(s) { return s === 'live' ? 'published' : (s || 'draft'); }
// Map DB status → UI status
function toUiStatus(s) { return s === 'published' ? 'live' : (s || 'draft'); }

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
    status:       toUiStatus(row.status),             // 'published' → 'live'
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
  const dbStatus = toDbStatus(form.status);
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
    status:          dbStatus,                        // 'live' → 'published'
    sections:        form.sections     || [],
    key_stats:       (form.stats || []).filter(s => s.value && s.label),
    sort_order:      form.sortOrder    ?? 0,
    published_at:    dbStatus === 'published' ? now : null,
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

// ── Fetch single showcase by slug (for admin/internal use — returns card shape) ──
export async function fetchShowcaseBySlugCard(slug) {
  if (!isSupabaseAvailable()) return null;
  try {
    const { data, error } = await supabase
      .from('venue_showcases')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    return data ? dbToCard(data) : null;
  } catch (err) {
    console.error('[showcaseService] fetchShowcaseBySlugCard error:', err);
    return null;
  }
}

// ── Fetch a single showcase by slug (for public rendering) ────────────────────
// Returns the published_sections field for the public page renderer.
// Returns null if not found or not published.
export async function fetchShowcaseBySlug(slug) {
  if (!isSupabaseAvailable() || !slug) return null;
  try {
    const { data, error } = await supabase
      .from('venue_showcases')
      .select('id, slug, title, type, status, hero_image_url, excerpt, key_stats, published_sections, listing_id, template_key, theme, seo_title, seo_description, og_image, published_at')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();
    if (error) { console.warn('[showcaseService] fetchShowcaseBySlug:', error.message); return null; }
    return data;
  } catch (e) {
    console.warn('[showcaseService] fetchShowcaseBySlug:', e.message);
    return null;
  }
}

// ── Save draft (updates sections + updated_at, does NOT touch published_sections or published_at) ──
export async function saveShowcaseDraft(id, updates) {
  if (!isSupabaseAvailable()) throw new Error('Supabase not available');
  const { error } = await supabase
    .from('venue_showcases')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Publish showcase (snapshots sections → published_sections, sets published_at) ──
export async function publishShowcase(id, sections) {
  if (!isSupabaseAvailable()) throw new Error('Supabase not available');
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('venue_showcases')
    .update({
      status:             'published',
      sections,                          // keep working copy in sync
      published_sections: sections,      // snapshot for public page
      published_at:       now,
      updated_at:         now,
    })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Duplicate a showcase ───────────────────────────────────────────────────────
export async function duplicateShowcase(id) {
  if (!isSupabaseAvailable()) throw new Error('Supabase not available');
  const { data: source, error: fetchErr } = await supabase
    .from('venue_showcases')
    .select('*')
    .eq('id', id)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);

  const now = new Date().toISOString();
  const newSlug = `${source.slug}-copy-${Date.now()}`;
  const { data, error } = await supabase
    .from('venue_showcases')
    .insert({
      type:               source.type,
      title:              `${source.title} (Copy)`,
      slug:               newSlug,
      location:           source.location,
      excerpt:            source.excerpt,
      hero_image_url:     source.hero_image_url,
      logo_url:           source.logo_url,
      listing_id:         source.listing_id,
      status:             'draft',
      sections:           source.sections,
      published_sections: [],
      key_stats:          source.key_stats,
      template_key:       source.template_key,
      theme:              source.theme,
      seo_title:          source.seo_title,
      seo_description:    source.seo_description,
      og_image:           source.og_image,
      sort_order:         0,
      created_at:         now,
      updated_at:         now,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return dbToCard(data);
}

// ── Create new showcase ───────────────────────────────────────────────────────
export async function createShowcase(form, type = 'venue') {
  if (!isSupabaseAvailable()) {
    // Return a mock card with a temp id so the UI still works offline
    return { ...dbToCard({ ...formToDb(form, type), id: `temp-${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }), _offline: true };
  }
  try {
    // Call edge function to create showcase (uses service role, bypasses RLS)
    const url = `https://qpkggfibwreznussudfh.supabase.co/functions/v1/create-showcase`;
    const payload = { type, ...formToDb(form, type) };
    console.log('[showcaseService] calling edge function:', url, payload);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log('[showcaseService] edge function response:', response.status, result);

    if (!response.ok || !result.success) {
      throw new Error(result.error || `Failed to create showcase: ${response.statusText}`);
    }
    return dbToCard(result.data);
  } catch (err) {
    console.error('[showcaseService] createShowcase error:', err.message, err);
    throw err;
  }
}

// ── Update showcase ───────────────────────────────────────────────────────────
export async function updateShowcase(id, form) {
  if (!isSupabaseAvailable()) return null;
  try {
    // Call edge function to update showcase (uses service role, bypasses RLS)
    const url = `https://qpkggfibwreznussudfh.supabase.co/functions/v1/update-showcase`;
    const payload = {
      id,
      name:          form.name || form.title || '',
      slug:          form.slug,
      location:      form.location     || null,
      excerpt:       form.excerpt      || null,
      heroImage:     form.heroImage    || null,
      logo:          form.logo         || null,
      previewUrl:    form.previewUrl   || null,
      listingId:     form.listingId    || null,
      status:        toDbStatus(form.status),         // 'live' → 'published'
      sections:      form.sections     || [],
      stats:         (form.stats || []).filter(s => s.value && s.label),
      sortOrder:     form.sortOrder    ?? 0,
      publishedAt:   form.publishedAt,
    };
    console.log('[showcaseService] calling update edge function:', url);
    console.log('[showcaseService] payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log('[showcaseService] update edge function response:', response.status, result);

    if (!response.ok || !result.success) {
      throw new Error(result.error || `Failed to update showcase: ${response.statusText}`);
    }
    return dbToCard(result.data);
  } catch (err) {
    console.error('[showcaseService] updateShowcase error:', err.message, err);
    throw err;
  }
}

// ── Fetch templates (is_template = true) ─────────────────────────────────────
export async function fetchTemplates(type = null) {
  if (!isSupabaseAvailable()) return [];
  try {
    let q = supabase
      .from('venue_showcases')
      .select('id, title, slug, type, template_key, hero_image_url, sections, key_stats, location, excerpt')
      .eq('is_template', true)
      .order('sort_order', { ascending: true });
    if (type) q = q.eq('type', type);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map(row => ({
      id:          row.id,
      key:         row.template_key || row.slug,
      label:       row.title,
      type:        row.type,
      heroImage:   row.hero_image_url || '',
      sections:    Array.isArray(row.sections) ? row.sections : [],
    }));
  } catch (err) {
    // is_template column may not exist until migration is run — fail silently
    return [];
  }
}

// ── Clone a template into a new draft showcase ────────────────────────────────
export async function cloneTemplate(templateId, { title, slug }) {
  if (!isSupabaseAvailable()) throw new Error('Supabase not available');
  const { data: source, error: fetchErr } = await supabase
    .from('venue_showcases')
    .select('*')
    .eq('id', templateId)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('venue_showcases')
    .insert({
      type:               source.type,
      title:              title || `${source.title} (Copy)`,
      slug:               slug || `${source.slug}-${Date.now()}`,
      location:           source.location,
      excerpt:            source.excerpt,
      hero_image_url:     source.hero_image_url,
      logo_url:           source.logo_url,
      status:             'draft',
      is_template:        false,
      sections:           source.sections,
      published_sections: [],
      key_stats:          source.key_stats,
      template_key:       source.template_key,
      theme:              source.theme,
      sort_order:         0,
      created_at:         now,
      updated_at:         now,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return dbToCard(data);
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
