/**
 * Managed Accounts Service
 *
 * Clean, single-path data layer for Managed Accounts.
 * All operations go through the edge function for consistent behavior.
 *
 * Response shape (consistent everywhere):
 * {
 *   success: boolean,
 *   data?: object,
 *   error?: string,
 *   fieldErrors?: { [field]: string }
 * }
 */

import { supabase } from '../lib/supabaseClient';

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-managed-accounts`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ─────────────────────────────────────────────────────────────────────────────
// Database Row ↔ UI Shape Transforms
// ─────────────────────────────────────────────────────────────────────────────

function dbToAccount(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug || '',
    logoUrl: row.logo_url || '',
    heroImageUrl: row.hero_image_url || '',
    primaryContactName: row.primary_contact_name || '',
    primaryContactEmail: row.primary_contact_email || '',
    contactPhone: row.contact_phone || '',
    companyType: row.company_type || '',
    plan: row.plan || '',
    serviceStatus: row.service_status || 'onboarding',
    status: row.status || 'active',
    contractStart: row.contract_start_date || null,
    contractEnd: row.contract_end_date || null,
    renewalDate: row.renewal_date || null,
    accountManager: row.account_manager || '',
    onboardingStatus: row.onboarding_status || 'pending',
    internalNotes: row.internal_notes || '',
    vendorId: row.vendor_id || null,
    crmLeadId: row.crm_lead_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function accountToDb(form) {
  return {
    name: form.name,
    slug: form.slug || slugify(form.name),
    logo_url: form.logoUrl || null,
    hero_image_url: form.heroImageUrl || null,
    primary_contact_name: form.primaryContactName || null,
    primary_contact_email: form.primaryContactEmail || null,
    contact_phone: form.contactPhone || null,
    company_type: form.companyType || null,
    plan: form.plan || null,
    service_status: form.serviceStatus || 'onboarding',
    status: form.status || 'active',
    contract_start_date: form.contractStart || null,
    contract_end_date: form.contractEnd || null,
    renewal_date: form.renewalDate || null,
    account_manager: form.accountManager || null,
    onboarding_status: form.onboardingStatus || 'pending',
    internal_notes: form.internalNotes || null,
    vendor_id: form.vendorId || null,
    crm_lead_id: form.crmLeadId || null,
  };
}

function slugify(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ─────────────────────────────────────────────────────────────────────────────
// Edge Function Call — Single Entry Point
// ─────────────────────────────────────────────────────────────────────────────

async function callEdge(action, params = {}) {
  if (!EDGE_URL || EDGE_URL.startsWith('undefined')) {
    return { success: false, error: 'Supabase not configured' };
  }

  const payload = { action, ...params };

  try {
    console.log('[managedAccountsService] Edge call:', action);

    const res = await fetch(EDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    console.log('[managedAccountsService] Edge response:', { status: res.status, success: json.success, error: json.error });

    // Edge function returns: { success: true, data } or { success: false, error }
    if (!json.success) {
      return { success: false, error: json.error || `Edge error (HTTP ${res.status})` };
    }

    return { success: true, data: json.data };
  } catch (err) {
    const errorMsg = err.message || 'Network error';
    console.error('[managedAccountsService] Edge exception:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all managed accounts from the database.
 * @returns {{ success: boolean, data?: array, error?: string }}
 */
export async function fetchAccounts() {
  try {
    console.log('[managedAccountsService] fetchAccounts');

    // Use direct Supabase query for reads (faster, RLS allows anon SELECT)
    const { data, error } = await supabase
      .from('managed_accounts')
      .select('*')
      .order('name');

    if (error) {
      return { success: false, error: error.message };
    }

    const accounts = (data || []).map(dbToAccount);
    console.log('[managedAccountsService] fetchAccounts: found', accounts.length);
    return { success: true, data: accounts };
  } catch (err) {
    console.error('[managedAccountsService] fetchAccounts error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch a single managed account by ID.
 * @param {string} id
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
export async function fetchAccount(id) {
  try {
    console.log('[managedAccountsService] fetchAccount:', id);

    const { data, error } = await supabase
      .from('managed_accounts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Account not found' };
    }

    return { success: true, data: dbToAccount(data) };
  } catch (err) {
    console.error('[managedAccountsService] fetchAccount error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Save a managed account (create or update).
 * Unified function: if form has id, update; otherwise create.
 * @param {object} form - Account form data
 * @returns {{ success: boolean, data?: object, error?: string, fieldErrors?: object }}
 */
export async function saveAccount(form) {
  try {
    // Validate required field
    if (!form.name || !form.name.trim()) {
      return { success: false, error: 'Validation failed', fieldErrors: { name: 'Account name is required' } };
    }

    const dbPayload = accountToDb(form);

    if (form.id) {
      // Update existing account
      console.log('[managedAccountsService] saveAccount: updating', form.id);
      const result = await callEdge('update', { id: form.id, payload: dbPayload });
      if (!result.success) {
        return result;
      }
      const account = dbToAccount(result.data);
      console.log('[managedAccountsService] saveAccount: update complete');
      return { success: true, data: account };
    } else {
      // Create new account
      console.log('[managedAccountsService] saveAccount: creating new');
      const result = await callEdge('create', { payload: dbPayload });
      if (!result.success) {
        return result;
      }
      const account = dbToAccount(result.data);
      console.log('[managedAccountsService] saveAccount: create complete');
      return { success: true, data: account };
    }
  } catch (err) {
    console.error('[managedAccountsService] saveAccount error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Delete a managed account.
 * @param {string} id
 * @returns {{ success: boolean, error?: string }}
 */
export async function deleteAccount(id) {
  try {
    console.log('[managedAccountsService] deleteAccount:', id);
    const result = await callEdge('delete', { id });
    if (!result.success) {
      return result;
    }
    console.log('[managedAccountsService] deleteAccount: complete');
    return { success: true };
  } catch (err) {
    console.error('[managedAccountsService] deleteAccount error:', err.message);
    return { success: false, error: err.message };
  }
}
