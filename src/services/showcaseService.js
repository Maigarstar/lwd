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
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-showcase`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...formToDb(form, type) }),
      }
    );
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to create showcase');
    }
    return dbToCard(result.data);
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
