// ─── showcaseService.js ───────────────────────────────────────────────────────
// CRUD for venue_showcases table
// All writes go through admin-showcases edge function (service role, bypasses RLS).
// ─────────────────────────────────────────────────────────────────────────────
// STATUS MAPPING NOTE:
//   UI uses:  'draft' | 'live'
//   DB uses:  'draft' | 'published' | 'archived'
//   'live' ↔ 'published' are the same concept — map at every boundary.
// ─────────────────────────────────────────────────────────────────────────────
import { supabase, isSupabaseAvailable } from '../lib/supabaseClient';

const EDGE_URL = 'https://qpkggfibwreznussudfh.supabase.co/functions/v1/admin-showcases';

// Map UI status → DB status
function toDbStatus(s) { return s === 'live' ? 'published' : (s || 'draft'); }
// Map DB status → UI status
function toUiStatus(s) { return s === 'published' ? 'live' : (s || 'draft'); }

// ── Call admin-showcases edge function ────────────────────────────────────────
async function callEdge(action, params = {}) {
  const response = await fetch(EDGE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
    },
    body: JSON.stringify({ action, ...params }),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || `admin-showcases [${action}] failed: ${response.statusText}`);
  }
  return result.data;
}

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
    seo_title:       form.seo_title       || null,
    seo_description: form.seo_description || null,
    og_image:        form.og_image        || null,
  };
}

// ── Fetch all showcases (optionally filter by type) ───────────────────────────
export async function fetchShowcases(type = null) {
  if (!isSupabaseAvailable()) return [];
  try {
    // Exclude heavy sections/published_sections JSON — not needed for list cards
    const CARD_COLS = 'id,type,title,slug,location,excerpt,hero_image_url,logo_url,preview_url,listing_id,status,key_stats,sort_order,published_at,updated_at,created_at';
    let q = supabase
      .from('venue_showcases')
      .select(CARD_COLS)
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

// ── Fetch single showcase by ID (for admin/internal use — returns card shape) ──
export async function fetchShowcaseById(id) {
  if (!isSupabaseAvailable() || !id) return null;
  try {
    const { data, error } = await supabase
      .from('venue_showcases')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? dbToCard(data) : null;
  } catch (err) {
    console.error('[showcaseService] fetchShowcaseById error:', err);
    return null;
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

// ── Save draft ────────────────────────────────────────────────────────────────
export async function saveShowcaseDraft(id, updates) {
  if (!isSupabaseAvailable()) throw new Error('Supabase not available');
  await callEdge('saveDraft', { id, updates });
}

// ── Publish showcase ──────────────────────────────────────────────────────────
export async function publishShowcase(id, sections) {
  if (!isSupabaseAvailable()) throw new Error('Supabase not available');
  await callEdge('publish', { id, sections });
}

// ── Duplicate a showcase ───────────────────────────────────────────────────────
export async function duplicateShowcase(id) {
  if (!isSupabaseAvailable()) throw new Error('Supabase not available');
  const row = await callEdge('duplicate', { id });
  return dbToCard(row);
}

// ── Create new showcase ───────────────────────────────────────────────────────
export async function createShowcase(form, type = 'venue') {
  if (!isSupabaseAvailable()) {
    return { ...dbToCard({ ...formToDb(form, type), id: `temp-${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }), _offline: true };
  }
  try {
    const payload = formToDb(form, type);
    console.log('[showcaseService] createShowcase payload:', payload);
    const row = await callEdge('create', { payload });
    return dbToCard(row);
  } catch (err) {
    console.error('[showcaseService] createShowcase error:', err.message);
    throw err;
  }
}

// ── Update showcase ───────────────────────────────────────────────────────────
export async function updateShowcase(id, form) {
  if (!isSupabaseAvailable()) return null;
  try {
    const payload = formToDb(form, form.type || 'venue');
    console.log('[showcaseService] updateShowcase payload:', payload);
    const row = await callEdge('update', { id, payload });
    return dbToCard(row);
  } catch (err) {
    console.error('[showcaseService] updateShowcase error:', err.message);
    throw err;
  }
}

// ── Fetch templates (is_template = true) ─────────────────────────────────────
export async function fetchTemplates(type = null) {
  if (!isSupabaseAvailable()) return [];
  try {
    const data = await callEdge('listTemplates', type ? { type } : {});
    return (data || []).map(row => ({
      id:          row.id,
      key:         row.template_key || row.slug,
      label:       row.title,
      type:        row.type,
      heroImage:   row.hero_image_url || '',
      icon:        row.template_key || '◈',
      sections:    Array.isArray(row.sections) ? row.sections : [],
    }));
  } catch (err) {
    // is_template column may not exist until migration is run — fail silently
    return [];
  }
}

// ── Save current showcase as a reusable template ──────────────────────────────
export async function saveShowcaseAsTemplate(showcase, sections, { label, icon }) {
  if (!isSupabaseAvailable()) throw new Error('Supabase not available');
  const slug    = `tmpl-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}-${Date.now()}`;
  const now     = new Date().toISOString();
  const payload = {
    type:               showcase?.type || 'venue',
    title:              label,
    slug,
    status:             'draft',
    is_template:        true,
    template_key:       icon || '◈',
    sections,
    published_sections: [],
    hero_image_url:     showcase?.hero_image_url || '',
    sort_order:         0,
    created_at:         now,
    updated_at:         now,
  };
  return await callEdge('create', { payload });
}

// ── Clone a template into a new draft showcase ────────────────────────────────
export async function cloneTemplate(templateId, { title, slug }) {
  if (!isSupabaseAvailable()) throw new Error('Supabase not available');
  const row = await callEdge('cloneTemplate', { templateId, title, slug });
  return dbToCard(row);
}

// ── Delete showcase ───────────────────────────────────────────────────────────
export async function deleteShowcase(id) {
  if (!isSupabaseAvailable()) return;
  try {
    await callEdge('delete', { id });
  } catch (err) {
    console.error('[showcaseService] deleteShowcase error:', err);
    throw err;
  }
}
