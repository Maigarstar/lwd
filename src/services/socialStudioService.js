// ─── socialStudioService.js ───────────────────────────────────────────────────
// Data layer for Social Studio: clients, campaigns, and content items.
// All reads/writes go through Supabase.
// Falls back gracefully if Supabase is unavailable (returns empty arrays /
// offline-flagged objects so the UI still mounts without crashing).
// ─────────────────────────────────────────────────────────────────────────────
import { supabase, isSupabaseAvailable } from '../lib/supabaseClient';

// ── Offline guard ─────────────────────────────────────────────────────────────
function offline(fallback) {
  console.warn('[SocialStudio] Supabase unavailable - using offline fallback');
  return fallback;
}

// ═════════════════════════════════════════════════════════════════════════════
// CLIENTS
// ═════════════════════════════════════════════════════════════════════════════

// DB row → UI shape
function dbToClient(row) {
  return {
    id:            row.id,
    name:          row.name,
    slug:          row.slug          || '',
    logoUrl:       row.logo_url      || '',
    contactName:   row.contact_name  || '',
    contactEmail:  row.contact_email || '',
    active:        row.active        !== false,
    internalNotes: row.internal_notes || '',
    createdAt:     row.created_at,
    updatedAt:     row.updated_at,
  };
}

// UI form → DB insert shape
function clientToDb(form) {
  return {
    name:           form.name,
    slug:           form.slug          || slugify(form.name),
    logo_url:       form.logoUrl       || null,
    contact_name:   form.contactName   || null,
    contact_email:  form.contactEmail  || null,
    active:         form.active        !== false,
    internal_notes: form.internalNotes || null,
  };
}

function slugify(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/**
 * Fetch all active managed clients.
 * @returns {Promise<Array>} array of client objects
 */
export async function fetchClients() {
  if (!isSupabaseAvailable()) return offline([]);
  try {
    const { data, error } = await supabase
      .from('social_clients')
      .select('*')
      .eq('active', true)
      .order('name');
    if (error) throw error;
    return (data || []).map(dbToClient);
  } catch (err) {
    console.error('[SocialStudio] fetchClients error:', err);
    return [];
  }
}

/**
 * Create a new managed client.
 * @param {Object} form
 * @returns {Promise<Object|null>} created client or null on error
 */
export async function createClient(form) {
  if (!isSupabaseAvailable()) return offline(null);
  try {
    const { data, error } = await supabase
      .from('social_clients')
      .insert([clientToDb(form)])
      .select()
      .single();
    if (error) throw error;
    return dbToClient(data);
  } catch (err) {
    console.error('[SocialStudio] createClient error:', err);
    return null;
  }
}

/**
 * Update an existing client.
 * @param {string} id
 * @param {Object} form
 * @returns {Promise<Object|null>}
 */
export async function updateClient(id, form) {
  if (!isSupabaseAvailable()) return offline(null);
  try {
    const { data, error } = await supabase
      .from('social_clients')
      .update(clientToDb(form))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return dbToClient(data);
  } catch (err) {
    console.error('[SocialStudio] updateClient error:', err);
    return null;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// CAMPAIGNS
// ═════════════════════════════════════════════════════════════════════════════

function dbToCampaign(row) {
  return {
    id:          row.id,
    clientId:    row.client_id    || null,
    name:        row.name,
    description: row.description  || '',
    startDate:   row.start_date   || null,
    endDate:     row.end_date     || null,
    status:      row.status       || 'active',
    sortOrder:   row.sort_order   ?? 0,
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
  };
}

function campaignToDb(form) {
  return {
    client_id:   form.clientId    || null,
    name:        form.name,
    description: form.description || null,
    start_date:  form.startDate   || null,
    end_date:    form.endDate     || null,
    status:      form.status      || 'active',
    sort_order:  form.sortOrder   ?? 0,
  };
}

/**
 * Fetch campaigns, optionally filtered by client.
 * @param {string|null} clientId
 * @returns {Promise<Array>}
 */
export async function fetchCampaigns(clientId = null) {
  if (!isSupabaseAvailable()) return offline([]);
  try {
    let q = supabase
      .from('social_campaigns')
      .select('*')
      .order('sort_order')
      .order('name');
    if (clientId) q = q.eq('client_id', clientId);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map(dbToCampaign);
  } catch (err) {
    console.error('[SocialStudio] fetchCampaigns error:', err);
    return [];
  }
}

/**
 * Create a new campaign.
 * @param {Object} form
 * @returns {Promise<Object|null>}
 */
export async function createCampaign(form) {
  if (!isSupabaseAvailable()) return offline(null);
  try {
    const { data, error } = await supabase
      .from('social_campaigns')
      .insert([campaignToDb(form)])
      .select()
      .single();
    if (error) throw error;
    return dbToCampaign(data);
  } catch (err) {
    console.error('[SocialStudio] createCampaign error:', err);
    return null;
  }
}

/**
 * Update a campaign.
 * @param {string} id
 * @param {Object} form
 * @returns {Promise<Object|null>}
 */
export async function updateCampaign(id, form) {
  if (!isSupabaseAvailable()) return offline(null);
  try {
    const { data, error } = await supabase
      .from('social_campaigns')
      .update(campaignToDb(form))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return dbToCampaign(data);
  } catch (err) {
    console.error('[SocialStudio] updateCampaign error:', err);
    return null;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// CONTENT ITEMS
// ═════════════════════════════════════════════════════════════════════════════

// DB row → UI shape used throughout SocialStudioModule
function dbToItem(row) {
  return {
    id:          row.id,
    clientId:    row.client_id     || '',
    campaignId:  row.campaign_id   || null,
    campaign:    row.campaign_name || '',   // denormalised; matches existing UI prop
    title:       row.title         || '',
    type:        row.type          || 'post',
    platform:    row.platform      || 'instagram',
    status:      row.status        || 'brief',
    date:        row.publish_date  || null, // matches existing UI prop 'date'
    assignedTo:  row.assigned_to   || '',
    caption:     row.caption_brief || '',  // matches existing UI prop 'caption'
    notes:       row.internal_notes || '',
    parentId:    row.parent_id     || null,
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
  };
}

// UI item → DB insert/update shape
function itemToDb(item) {
  return {
    client_id:      item.clientId    || null,
    campaign_id:    item.campaignId  || null,
    campaign_name:  item.campaign    || null,
    title:          item.title       || '',
    type:           item.type        || 'post',
    platform:       item.platform    || 'instagram',
    status:         item.status      || 'brief',
    publish_date:   item.date        || null,
    assigned_to:    item.assignedTo  || null,
    caption_brief:  item.caption     || null,
    internal_notes: item.notes       || null,
    parent_id:      item.parentId    || null,
  };
}

/**
 * Fetch all content items, optionally filtered.
 * @param {{ clientId?: string, status?: string, month?: string }} opts
 *   month format: 'YYYY-MM' - returns items whose publish_date starts with that prefix
 * @returns {Promise<Array>}
 */
export async function fetchContent(opts = {}) {
  if (!isSupabaseAvailable()) return offline([]);
  try {
    let q = supabase
      .from('social_content')
      .select('*')
      .order('publish_date', { ascending: true })
      .order('created_at', { ascending: false });

    if (opts.clientId) q = q.eq('client_id', opts.clientId);
    if (opts.status)   q = q.eq('status', opts.status);
    // Month filter: publish_date BETWEEN 'YYYY-MM-01' AND 'YYYY-MM-31'
    if (opts.month) {
      const [yr, mo] = opts.month.split('-').map(Number);
      const from = `${yr}-${String(mo).padStart(2,'0')}-01`;
      const to   = `${yr}-${String(mo).padStart(2,'0')}-31`;
      q = q.gte('publish_date', from).lte('publish_date', to);
    }

    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map(dbToItem);
  } catch (err) {
    console.error('[SocialStudio] fetchContent error:', err);
    return [];
  }
}

/**
 * Fetch a lightweight content summary for a single client.
 * Used by CRM client detail view (Phase 3).
 * Returns counts + last published date without loading full item list.
 * @param {string} clientId
 * @returns {Promise<Object>}
 */
export async function fetchClientContentSummary(clientId) {
  if (!isSupabaseAvailable()) return offline({ scheduled: 0, draft: 0, liveThisMonth: 0, lastPublished: null, activeCampaign: null });
  try {
    const now  = new Date();
    const yr   = now.getFullYear();
    const mo   = now.getMonth() + 1;
    const moPad = String(mo).padStart(2, '0');
    const monthStart = `${yr}-${moPad}-01`;
    const monthEnd   = `${yr}-${moPad}-31`;

    // Fetch all items for this client in one query (small dataset per client)
    const { data, error } = await supabase
      .from('social_content')
      .select('id, status, publish_date, campaign_name')
      .eq('client_id', clientId)
      .order('publish_date', { ascending: false });

    if (error) throw error;
    const items = data || [];

    const scheduled     = items.filter(i => i.status === 'scheduled').length;
    const draft         = items.filter(i => i.status === 'draft' || i.status === 'brief').length;
    const liveThisMonth = items.filter(i =>
      i.status === 'live' && i.publish_date >= monthStart && i.publish_date <= monthEnd
    ).length;

    const lastLive      = items.find(i => i.status === 'live');
    const lastPublished = lastLive?.publish_date || null;

    // Most recent active campaign (from most recent item that has a campaign_name)
    const withCampaign  = items.find(i => i.campaign_name && i.status !== 'reported');
    const activeCampaign = withCampaign?.campaign_name || null;

    return { scheduled, draft, liveThisMonth, lastPublished, activeCampaign };
  } catch (err) {
    console.error('[SocialStudio] fetchClientContentSummary error:', err);
    return { scheduled: 0, draft: 0, liveThisMonth: 0, lastPublished: null, activeCampaign: null };
  }
}

/**
 * Create a single content item.
 * @param {Object} item - UI shape (from ContentModal form)
 * @returns {Promise<Object|null>} created item in UI shape, or null on error
 */
export async function createContentItem(item) {
  if (!isSupabaseAvailable()) {
    return offline({ ...item, id: `offline_${Date.now()}`, _offline: true });
  }
  try {
    const { data, error } = await supabase
      .from('social_content')
      .insert([itemToDb(item)])
      .select()
      .single();
    if (error) throw error;
    return dbToItem(data);
  } catch (err) {
    console.error('[SocialStudio] createContentItem error:', err);
    return { ...item, id: `offline_${Date.now()}`, _offline: true };
  }
}

/**
 * Create multiple content items in one batch.
 * Used by DuplicateModal (one row per client per date).
 * @param {Array} items - array of UI-shape items
 * @returns {Promise<Array>} created items in UI shape
 */
export async function createContentItems(items) {
  if (!isSupabaseAvailable()) {
    return offline(items.map((it, i) => ({ ...it, id: `offline_${Date.now()}_${i}`, _offline: true })));
  }
  try {
    const rows = items.map(itemToDb);
    const { data, error } = await supabase
      .from('social_content')
      .insert(rows)
      .select();
    if (error) throw error;
    return (data || []).map(dbToItem);
  } catch (err) {
    console.error('[SocialStudio] createContentItems error:', err);
    return items.map((it, i) => ({ ...it, id: `offline_${Date.now()}_${i}`, _offline: true }));
  }
}

/**
 * Update an existing content item.
 * @param {string} id
 * @param {Object} item - UI shape (partial or full)
 * @returns {Promise<Object|null>}
 */
export async function updateContentItem(id, item) {
  if (!isSupabaseAvailable()) return offline({ ...item, id });
  try {
    const { data, error } = await supabase
      .from('social_content')
      .update(itemToDb(item))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return dbToItem(data);
  } catch (err) {
    console.error('[SocialStudio] updateContentItem error:', err);
    return { ...item, id };
  }
}

/**
 * Update only the status of a content item.
 * Lightweight patch - avoids sending the full row on quick status changes.
 * @param {string} id
 * @param {string} status
 * @returns {Promise<boolean>} true on success
 */
export async function updateContentStatus(id, status) {
  if (!isSupabaseAvailable()) return offline(false);
  try {
    const { error } = await supabase
      .from('social_content')
      .update({ status })
      .eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[SocialStudio] updateContentStatus error:', err);
    return false;
  }
}

/**
 * Delete a content item.
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function deleteContentItem(id) {
  if (!isSupabaseAvailable()) return offline(false);
  try {
    const { error } = await supabase
      .from('social_content')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[SocialStudio] deleteContentItem error:', err);
    return false;
  }
}
