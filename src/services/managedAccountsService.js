// ─── managedAccountsService.js ───────────────────────────────────────────────
// Focused CRUD service for the managed_accounts table.
// All writes go through admin-managed-accounts edge function (service role,
// bypasses RLS). Reads use the same edge function for consistency.
//
// Every function returns: { ok: true, data: ... } or { ok: false, error: "..." }
// The UI can rely on this shape without additional null checks.
// ─────────────────────────────────────────────────────────────────────────────
import { isSupabaseAvailable } from '../lib/supabaseClient';

const EDGE_URL = 'https://qpkggfibwreznussudfh.supabase.co/functions/v1/admin-managed-accounts';

// ── Edge function caller ───────────────────────────────────────────────────────
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
    throw new Error(result.error || `admin-managed-accounts [${action}] failed: ${response.statusText}`);
  }
  return result.data;
}

// ── Transform: DB row → UI account shape ─────────────────────────────────────
function dbToAccount(row) {
  if (!row) return null;
  return {
    id:                   row.id,
    name:                 row.name                  || '',
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
    createdAt:            row.created_at            || null,
    updatedAt:            row.updated_at            || null,
  };
}

// ── Transform: UI form → DB insert/update shape ───────────────────────────────
function accountToDb(form) {
  return {
    name:                  form.name                 || '',
    slug:                  form.slug                 || slugify(form.name),
    logo_url:              form.logoUrl              || null,
    hero_image_url:        form.heroImageUrl         || null,
    primary_contact_name:  form.primaryContactName   || null,
    primary_contact_email: form.primaryContactEmail  || null,
    contact_phone:         form.contactPhone         || null,
    company_type:          form.companyType          || null,
    plan:                  form.plan                 || null,
    service_status:        form.serviceStatus        || 'onboarding',
    status:                form.status               || 'active',
    contract_start_date:   form.contractStart        || null,
    contract_end_date:     form.contractEnd          || null,
    renewal_date:          form.renewalDate          || null,
    account_manager:       form.accountManager       || null,
    onboarding_status:     form.onboardingStatus     || 'pending',
    internal_notes:        form.internalNotes        || null,
    vendor_id:             form.vendorId             || null,
    crm_lead_id:           form.crmLeadId            || null,
  };
}

function slugify(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ── readAccounts ──────────────────────────────────────────────────────────────
// Returns all managed accounts, ordered by name.
export async function readAccounts() {
  if (!isSupabaseAvailable()) return { ok: false, error: 'Supabase not available' };
  try {
    console.log('[managedAccountsService] readAccounts →');
    const rows = await callEdge('list');
    const data = (rows || []).map(dbToAccount);
    console.log('[managedAccountsService] readAccounts ←', data.length, 'accounts');
    return { ok: true, data };
  } catch (err) {
    console.error('[managedAccountsService] readAccounts error:', err.message);
    return { ok: false, error: err.message };
  }
}

// ── readAccount ───────────────────────────────────────────────────────────────
// Fetch a single account by id.
export async function readAccount(id) {
  if (!isSupabaseAvailable() || !id) return { ok: false, error: 'id required' };
  try {
    console.log('[managedAccountsService] readAccount →', id);
    const row = await callEdge('get', { id });
    const data = dbToAccount(row);
    console.log('[managedAccountsService] readAccount ←', data?.name);
    return { ok: true, data };
  } catch (err) {
    console.error('[managedAccountsService] readAccount error:', err.message);
    return { ok: false, error: err.message };
  }
}

// ── createAccount ─────────────────────────────────────────────────────────────
// Create a new managed account. Returns the created row.
export async function createAccount(form) {
  if (!isSupabaseAvailable()) return { ok: false, error: 'Supabase not available' };
  try {
    const payload = accountToDb(form);
    console.log('[managedAccountsService] createAccount → payload:', payload);
    const row = await callEdge('create', { payload });
    const data = dbToAccount(row);
    console.log('[managedAccountsService] createAccount ← created id:', data?.id);
    return { ok: true, data };
  } catch (err) {
    console.error('[managedAccountsService] createAccount error:', err.message);
    return { ok: false, error: err.message };
  }
}

// ── updateAccount ─────────────────────────────────────────────────────────────
// Update an existing managed account by id.
export async function updateAccount(id, form) {
  if (!isSupabaseAvailable() || !id) return { ok: false, error: 'id required' };
  try {
    const payload = accountToDb(form);
    console.log('[managedAccountsService] updateAccount → id:', id, 'payload:', payload);
    const row = await callEdge('update', { id, payload });
    const data = dbToAccount(row);
    console.log('[managedAccountsService] updateAccount ← updated:', data?.name);
    return { ok: true, data };
  } catch (err) {
    console.error('[managedAccountsService] updateAccount error:', err.message);
    return { ok: false, error: err.message };
  }
}

// ── deleteAccount ─────────────────────────────────────────────────────────────
// Hard-delete an account by id.
export async function deleteAccount(id) {
  if (!isSupabaseAvailable() || !id) return { ok: false, error: 'id required' };
  try {
    console.log('[managedAccountsService] deleteAccount →', id);
    await callEdge('delete', { id });
    console.log('[managedAccountsService] deleteAccount ← deleted');
    return { ok: true, data: null };
  } catch (err) {
    console.error('[managedAccountsService] deleteAccount error:', err.message);
    return { ok: false, error: err.message };
  }
}
