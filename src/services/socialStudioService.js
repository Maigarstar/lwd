// ─── socialStudioService.js ───────────────────────────────────────────────────
// Data layer for Managed Accounts, Social Campaigns, and Social Content.
//
// managed_accounts: active service clients. Created when a CRM lead is
//   converted (won). Separate from the CRM pipeline (leads) and the vendor
//   auth layer (vendors). Is the hub for content delivery and activity.
//
// All reads/writes go through Supabase. Falls back gracefully when the DB
// tables are unavailable, returning empty arrays / offline-flagged objects
// so the UI still mounts without crashing.
// ─────────────────────────────────────────────────────────────────────────────
import { supabase, isSupabaseAvailable } from '../lib/supabaseClient';

// ── Offline guard ─────────────────────────────────────────────────────────────
function offline(fallback) {
  console.warn('[SocialStudio] Supabase unavailable - using offline fallback');
  return fallback;
}

// ── Fallback accounts (matches migration seed UUIDs) ──────────────────────────
// Used when the managed_accounts table is not yet available (pre-migration).
export const FALLBACK_ACCOUNTS = [
  { id: 'a1b2c3d4-0001-0000-0000-000000000001', name: "Villa d'Este",             slug: 'villa-deste',               plan: 'signature', status: 'active', serviceStatus: 'active', onboardingStatus: 'complete', companyType: 'venue', primaryContactName: '', primaryContactEmail: '', contactPhone: '', accountManager: '', renewalDate: null, contractStart: null, contractEnd: null, internalNotes: '', logoUrl: '', heroImageUrl: '' },
  { id: 'a1b2c3d4-0002-0000-0000-000000000002', name: 'Belmond Villa San Michele', slug: 'belmond-villa-san-michele', plan: 'signature', status: 'active', serviceStatus: 'active', onboardingStatus: 'complete', companyType: 'venue', primaryContactName: '', primaryContactEmail: '', contactPhone: '', accountManager: '', renewalDate: null, contractStart: null, contractEnd: null, internalNotes: '', logoUrl: '', heroImageUrl: '' },
  { id: 'a1b2c3d4-0003-0000-0000-000000000003', name: 'Borgo Egnazia',             slug: 'borgo-egnazia',             plan: 'growth',    status: 'active', serviceStatus: 'active', onboardingStatus: 'complete', companyType: 'venue', primaryContactName: '', primaryContactEmail: '', contactPhone: '', accountManager: '', renewalDate: null, contractStart: null, contractEnd: null, internalNotes: '', logoUrl: '', heroImageUrl: '' },
  { id: 'a1b2c3d4-0004-0000-0000-000000000004', name: 'Chewton Glen',             slug: 'chewton-glen',              plan: 'essentials',status: 'active', serviceStatus: 'onboarding', onboardingStatus: 'in-progress', companyType: 'hotel', primaryContactName: '', primaryContactEmail: '', contactPhone: '', accountManager: '', renewalDate: null, contractStart: null, contractEnd: null, internalNotes: '', logoUrl: '', heroImageUrl: '' },
];

// ═════════════════════════════════════════════════════════════════════════════
// MANAGED ACCOUNTS
// ═════════════════════════════════════════════════════════════════════════════

// DB row → UI shape
function dbToAccount(row) {
  return {
    id:                   row.id,
    name:                 row.name,
    slug:                 row.slug                  || '',
    logoUrl:              row.logo_url              || '',
    heroImageUrl:         row.hero_image_url        || '',
    primaryContactName:   row.primary_contact_name  || '',
    primaryContactEmail:  row.primary_contact_email || '',
    contactPhone:         row.contact_phone         || '',
    companyType:          row.company_type          || '',
    plan:                 row.plan                  || '',
    serviceStatus:        row.service_status        || 'onboarding',
    status:               row.status                || 'active',
    contractStart:        row.contract_start_date   || null,
    contractEnd:          row.contract_end_date     || null,
    renewalDate:          row.renewal_date          || null,
    accountManager:       row.account_manager       || '',
    onboardingStatus:     row.onboarding_status     || 'pending',
    internalNotes:        row.internal_notes        || '',
    vendorId:             row.vendor_id             || null,
    crmLeadId:            row.crm_lead_id           || null,
    createdAt:            row.created_at,
    updatedAt:            row.updated_at,
  };
}

// UI form → DB insert/update shape
function accountToDb(form) {
  return {
    name:                  form.name,
    slug:                  form.slug                  || slugify(form.name),
    logo_url:              form.logoUrl               || null,
    hero_image_url:        form.heroImageUrl          || null,
    primary_contact_name:  form.primaryContactName    || null,
    primary_contact_email: form.primaryContactEmail   || null,
    contact_phone:         form.contactPhone          || null,
    company_type:          form.companyType           || null,
    plan:                  form.plan                  || null,
    service_status:        form.serviceStatus         || 'onboarding',
    status:                form.status                || 'active',
    contract_start_date:   form.contractStart         || null,
    contract_end_date:     form.contractEnd           || null,
    renewal_date:          form.renewalDate           || null,
    account_manager:       form.accountManager        || null,
    onboarding_status:     form.onboardingStatus      || 'pending',
    internal_notes:        form.internalNotes         || null,
    vendor_id:             form.vendorId              || null,
    crm_lead_id:           form.crmLeadId             || null,
  };
}

function slugify(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/**
 * Fetch all managed accounts.
 * @param {{ status?: string }} opts - optional filter
 * @returns {Promise<Array>}
 */
export async function fetchManagedAccounts(opts = {}) {
  if (!isSupabaseAvailable()) return offline(FALLBACK_ACCOUNTS);
  try {
    let q = supabase
      .from('managed_accounts')
      .select('*')
      .order('name');
    if (opts.status) q = q.eq('status', opts.status);
    const { data, error } = await q;
    if (error) throw error;
    const rows = (data || []).map(dbToAccount);
    return rows.length > 0 ? rows : FALLBACK_ACCOUNTS;
  } catch (err) {
    console.error('[SocialStudio] fetchManagedAccounts error:', err);
    return FALLBACK_ACCOUNTS;
  }
}

/**
 * Fetch a single managed account by id.
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function fetchManagedAccount(id) {
  if (!isSupabaseAvailable()) return offline(null);
  try {
    const { data, error } = await supabase
      .from('managed_accounts')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return dbToAccount(data);
  } catch (err) {
    console.error('[SocialStudio] fetchManagedAccount error:', err);
    return null;
  }
}

/**
 * Create a new managed account (manual, not from CRM conversion).
 * @param {Object} form
 * @returns {Promise<Object|null>}
 */
export async function createManagedAccount(form) {
  if (!isSupabaseAvailable()) return offline(null);
  try {
    const { data, error } = await supabase
      .from('managed_accounts')
      .insert([accountToDb(form)])
      .select()
      .single();
    if (error) throw error;
    return dbToAccount(data);
  } catch (err) {
    console.error('[SocialStudio] createManagedAccount error:', err);
    return null;
  }
}

/**
 * Check if a managed account already exists for a given CRM lead id.
 * Used for duplicate prevention during CRM conversion.
 * @param {string} crmLeadId
 * @returns {Promise<Object|null>} existing account or null
 */
export async function fetchManagedAccountByLeadId(crmLeadId) {
  if (!isSupabaseAvailable()) return offline(null);
  try {
    const { data, error } = await supabase
      .from('managed_accounts')
      .select('*')
      .eq('crm_lead_id', crmLeadId)
      .maybeSingle();
    if (error) throw error;
    return data ? dbToAccount(data) : null;
  } catch (err) {
    console.error('[SocialStudio] fetchManagedAccountByLeadId error:', err);
    return null;
  }
}

/**
 * Convert a won CRM lead into a managed account.
 * Carries over core client info from the lead record.
 * @param {Object} lead - CRM lead object (from leads table)
 * @returns {Promise<Object|null>} created managed account
 */
export async function convertLeadToManagedAccount(lead) {
  if (!isSupabaseAvailable()) return offline(null);
  const req = lead.requirements_json || {};
  const form = {
    name:                req.businessName || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || lead.email,
    slug:                slugify(req.businessName || `${lead.first_name || ''} ${lead.last_name || ''}`),
    primaryContactName:  `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
    primaryContactEmail: lead.email  || '',
    contactPhone:        lead.phone  || '',
    plan:                '',
    serviceStatus:       'onboarding',
    status:              'active',
    onboardingStatus:    'pending',
    crmLeadId:           lead.id,
    internalNotes:       `Converted from CRM lead on ${new Date().toLocaleDateString('en-GB')}. Original source: ${lead.lead_source || 'unknown'}.`,
  };
  return createManagedAccount(form);
}

/**
 * Update an existing managed account.
 * @param {string} id
 * @param {Object} form
 * @returns {Promise<Object|null>}
 */
export async function updateManagedAccount(id, form) {
  if (!isSupabaseAvailable()) return offline({ ...form, id });
  try {
    const { data, error } = await supabase
      .from('managed_accounts')
      .update(accountToDb(form))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return dbToAccount(data);
  } catch (err) {
    console.error('[SocialStudio] updateManagedAccount error:', err);
    return { ...form, id };
  }
}

// ── Backwards-compat aliases used by SocialStudioModule ──────────────────────
// SocialStudioModule uses "clients" terminology internally.
// These aliases keep that working without touching the module's internals.
export const fetchClients        = fetchManagedAccounts;
export const createClient        = createManagedAccount;
export const updateClient        = updateManagedAccount;

// ═════════════════════════════════════════════════════════════════════════════
// CAMPAIGNS
// ═════════════════════════════════════════════════════════════════════════════

function dbToCampaign(row) {
  return {
    id:               row.id,
    managedAccountId: row.managed_account_id || null,
    // UI compat alias
    clientId:         row.managed_account_id || null,
    name:             row.name,
    description:      row.description  || '',
    startDate:        row.start_date   || null,
    endDate:          row.end_date     || null,
    status:           row.status       || 'active',
    sortOrder:        row.sort_order   ?? 0,
    createdAt:        row.created_at,
    updatedAt:        row.updated_at,
  };
}

function campaignToDb(form) {
  return {
    managed_account_id: form.managedAccountId || form.clientId || null,
    name:               form.name,
    description:        form.description  || null,
    start_date:         form.startDate    || null,
    end_date:           form.endDate      || null,
    status:             form.status       || 'active',
    sort_order:         form.sortOrder    ?? 0,
  };
}

/**
 * Fetch campaigns, optionally filtered by managed account.
 * @param {string|null} managedAccountId
 * @returns {Promise<Array>}
 */
export async function fetchCampaigns(managedAccountId = null) {
  if (!isSupabaseAvailable()) return offline([]);
  try {
    let q = supabase
      .from('social_campaigns')
      .select('*')
      .order('sort_order')
      .order('name');
    if (managedAccountId) q = q.eq('managed_account_id', managedAccountId);
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
    id:               row.id,
    // UI uses 'clientId' - maps to managed_account_id
    clientId:         row.managed_account_id || '',
    managedAccountId: row.managed_account_id || '',
    campaignId:       row.campaign_id        || null,
    campaign:         row.campaign_name      || '',
    title:            row.title              || '',
    type:             row.type               || 'post',
    platform:         row.platform           || 'instagram',
    status:           row.status             || 'brief',
    date:             row.publish_date       || null,
    assignedTo:       row.assigned_to        || '',
    caption:          row.caption_brief      || '',
    notes:            row.internal_notes     || '',
    parentId:         row.parent_id          || null,
    createdAt:        row.created_at,
    updatedAt:        row.updated_at,
  };
}

// UI item → DB insert/update shape
function itemToDb(item) {
  return {
    managed_account_id: item.clientId         || item.managedAccountId || null,
    campaign_id:        item.campaignId        || null,
    campaign_name:      item.campaign          || null,
    title:              item.title             || '',
    type:               item.type              || 'post',
    platform:           item.platform          || 'instagram',
    status:             item.status            || 'brief',
    publish_date:       item.date              || null,
    assigned_to:        item.assignedTo        || null,
    caption_brief:      item.caption           || null,
    internal_notes:     item.notes             || null,
    parent_id:          item.parentId          || null,
  };
}

/**
 * Fetch all content items, optionally filtered.
 * @param {{ clientId?: string, status?: string, month?: string }} opts
 *   month format: 'YYYY-MM'
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

    if (opts.clientId)         q = q.eq('managed_account_id', opts.clientId);
    if (opts.managedAccountId) q = q.eq('managed_account_id', opts.managedAccountId);
    if (opts.status)           q = q.eq('status', opts.status);
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
 * Fetch content summaries for ALL managed accounts in one query.
 * Returns a map: { [managedAccountId]: summary }
 * Used by ManagedAccountsModule to populate card-level signals without N+1 queries.
 * @returns {Promise<Object>}
 */
export async function fetchAllContentSummaries() {
  const empty = () => ({ scheduled: 0, draft: 0, liveThisMonth: 0, lastPublished: null, activeCampaign: null, totalItems: 0 });
  if (!isSupabaseAvailable()) return offline({});
  try {
    const now        = new Date();
    const yr         = now.getFullYear();
    const mo         = now.getMonth() + 1;
    const moPad      = String(mo).padStart(2, '0');
    const monthStart = `${yr}-${moPad}-01`;
    const monthEnd   = `${yr}-${moPad}-31`;

    const { data, error } = await supabase
      .from('social_content')
      .select('id, managed_account_id, status, publish_date, campaign_name')
      .order('publish_date', { ascending: false });

    if (error) throw error;
    const items = data || [];

    // Group by managed_account_id
    const map = {};
    for (const item of items) {
      const aid = item.managed_account_id;
      if (!aid) continue;
      if (!map[aid]) map[aid] = empty();
      const s = map[aid];
      s.totalItems++;
      if (item.status === 'scheduled') s.scheduled++;
      if (item.status === 'draft' || item.status === 'brief') s.draft++;
      if (item.status === 'live' && item.publish_date >= monthStart && item.publish_date <= monthEnd) s.liveThisMonth++;
      if (!s.lastPublished && item.status === 'live') s.lastPublished = item.publish_date;
      if (!s.activeCampaign && item.campaign_name && item.status !== 'reported') s.activeCampaign = item.campaign_name;
    }
    return map;
  } catch (err) {
    console.error('[SocialStudio] fetchAllContentSummaries error:', err);
    return {};
  }
}

/**
 * Fetch a lightweight content summary for a managed account.
 * Used by the Managed Accounts detail view (Phase 3 CRM integration).
 * @param {string} managedAccountId
 * @returns {Promise<Object>}
 */
export async function fetchClientContentSummary(managedAccountId) {
  const empty = { scheduled: 0, draft: 0, liveThisMonth: 0, lastPublished: null, activeCampaign: null };
  if (!isSupabaseAvailable()) return offline(empty);
  try {
    const now     = new Date();
    const yr      = now.getFullYear();
    const mo      = now.getMonth() + 1;
    const moPad   = String(mo).padStart(2, '0');
    const monthStart = `${yr}-${moPad}-01`;
    const monthEnd   = `${yr}-${moPad}-31`;

    const { data, error } = await supabase
      .from('social_content')
      .select('id, status, publish_date, campaign_name')
      .eq('managed_account_id', managedAccountId)
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

    const withCampaign  = items.find(i => i.campaign_name && i.status !== 'reported');
    const activeCampaign = withCampaign?.campaign_name || null;

    return { scheduled, draft, liveThisMonth, lastPublished, activeCampaign };
  } catch (err) {
    console.error('[SocialStudio] fetchClientContentSummary error:', err);
    return empty;
  }
}

/**
 * Create a single content item.
 * @param {Object} item - UI shape
 * @returns {Promise<Object|null>}
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
 * Create multiple content items in one batch (DuplicateModal).
 * @param {Array} items
 * @returns {Promise<Array>}
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
 * @param {Object} item - UI shape
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
 * Update only the status of a content item (lightweight patch).
 * @param {string} id
 * @param {string} status
 * @returns {Promise<boolean>}
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

// ═════════════════════════════════════════════════════════════════════════════
// PORTAL CONFIG
// ═════════════════════════════════════════════════════════════════════════════

// Default menu config per plan tier.
// Admin can override per-account after creation.
const MENU_KEYS = [
  { key: 'overview',    label: 'Overview',     icon: '◈' },
  { key: 'content',     label: 'Content',      icon: '◉' },
  { key: 'campaigns',   label: 'Campaigns',    icon: '◎' },
  { key: 'performance', label: 'Performance',  icon: '◇' },
  { key: 'brand',       label: 'Your Brand',   icon: '✦' },
  { key: 'requests',    label: 'Requests',     icon: '◫' },
  { key: 'settings',    label: 'Settings',     icon: '⊡' },
];

const PLAN_DEFAULTS = {
  signature:  { overview: true, content: true, campaigns: true, performance: true, brand: true,  requests: true,  settings: true  },
  growth:     { overview: true, content: true, campaigns: true, performance: true, brand: false, requests: true,  settings: true  },
  essentials: { overview: true, content: true, campaigns: false,performance: false,brand: false, requests: true,  settings: true  },
  custom:     { overview: true, content: true, campaigns: false,performance: false,brand: false, requests: false, settings: true  },
};

/**
 * Build a default portal_config for a given plan.
 * Called when creating a managed account or when portal_config is null.
 * @param {string} plan - 'signature' | 'growth' | 'essentials' | 'custom'
 * @returns {Object}
 */
export function buildDefaultPortalConfig(plan) {
  const defaults = PLAN_DEFAULTS[plan] || PLAN_DEFAULTS.essentials;
  return {
    menu: MENU_KEYS.map((m, i) => ({
      key:     m.key,
      label:   m.label,
      icon:    m.icon,
      enabled: defaults[m.key] ?? false,
      order:   i,
    })),
    accountManager: { name: '', title: '', email: '', photo: '' },
    welcomeMessage: '',
  };
}

/**
 * Fetch the portal_config for a managed account.
 * Returns a built default if the column is null (plan-based).
 * @param {string} managedAccountId
 * @param {string} [fallbackPlan] - plan to use if DB row not found or query fails
 * @returns {Promise<Object>}
 */
export async function fetchPortalConfig(managedAccountId, fallbackPlan = 'essentials') {
  if (!isSupabaseAvailable()) {
    console.debug('[PortalConfig] supabase unavailable — using generated default', { managedAccountId, fallbackPlan, source: 'no-supabase' });
    return buildDefaultPortalConfig(fallbackPlan);
  }
  try {
    const { data, error } = await supabase
      .from('managed_accounts')
      .select('portal_config, plan')
      .eq('id', managedAccountId)
      .maybeSingle();
    if (error) throw error;
    if (data?.portal_config) {
      console.debug('[PortalConfig] loaded from database', { managedAccountId, plan: data.plan, source: 'db' });
      return data.portal_config;
    }
    const resolvedPlan = data?.plan || fallbackPlan;
    console.debug('[PortalConfig] portal_config null — using generated default', { managedAccountId, resolvedPlan, dbHit: !!data, source: 'generated' });
    return buildDefaultPortalConfig(resolvedPlan);
  } catch (err) {
    console.error('[SocialStudio] fetchPortalConfig error:', err);
    console.debug('[PortalConfig] query failed — using generated default', { managedAccountId, fallbackPlan, source: 'error-fallback' });
    return buildDefaultPortalConfig(fallbackPlan);
  }
}

/**
 * Save portal_config for a managed account.
 * @param {string} managedAccountId
 * @param {Object} config
 * @returns {Promise<boolean>}
 */
export async function updatePortalConfig(managedAccountId, config) {
  if (!isSupabaseAvailable()) return offline(false);
  try {
    const { error } = await supabase
      .from('managed_accounts')
      .update({ portal_config: config })
      .eq('id', managedAccountId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[SocialStudio] updatePortalConfig error:', err);
    return false;
  }
}

/**
 * Fetch a managed account by vendor_id.
 * Used by ClientPortal to load the account for the logged-in vendor.
 * @param {string} vendorId
 * @returns {Promise<Object|null>}
 */
export async function fetchManagedAccountByVendorId(vendorId) {
  if (!isSupabaseAvailable()) return offline(null);
  try {
    const { data, error } = await supabase
      .from('managed_accounts')
      .select('*')
      .eq('vendor_id', vendorId)
      .maybeSingle();
    if (error) throw error;
    return data ? { ...dbToAccount(data), portalConfig: data.portal_config || null } : null;
  } catch (err) {
    console.error('[SocialStudio] fetchManagedAccountByVendorId error:', err);
    return null;
  }
}
