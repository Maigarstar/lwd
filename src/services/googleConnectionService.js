// ─── src/services/googleConnectionService.js ─────────────────────────────────
// Frontend service for Google OAuth connections (GA4 + Search Console).
// All token handling happens server-side in Supabase Edge Functions.
// This service manages connection state in the DB and fetches real data.

import { supabase } from '../lib/supabaseClient';

// ── Get current connection status for both services ───────────────────────────

export async function getConnections() {
  const { data, error } = await supabase
    .from('google_connections')
    .select('service, status, selected_property_id, selected_property_name, available_properties, connected_at, error_message')
    .in('service', ['analytics', 'search_console']);

  if (error) throw new Error(error.message);

  const byService = {};
  for (const row of (data || [])) {
    byService[row.service] = row;
  }

  return {
    analytics:      byService.analytics      || { service: 'analytics',      status: 'disconnected' },
    search_console: byService.search_console || { service: 'search_console', status: 'disconnected' },
  };
}

// ── Initiate OAuth flow - returns the Google consent screen URL ───────────────

export async function initiateOAuth(service) {
  const { data, error } = await supabase.functions.invoke('google-oauth-init', {
    body: { service },
  });
  if (error) throw new Error(error.message);
  if (data?.error) {
    const err = new Error(data.error);
    err.setupRequired = data.setup_required || false;
    err.instructions  = data.instructions   || '';
    throw err;
  }
  return data.oauthUrl;
}

// ── Open OAuth consent screen in a popup window ───────────────────────────────
// Returns a cleanup function that removes the message listener.

export function openOAuthPopup(oauthUrl, onSuccess, onError) {
  const width  = 580;
  const height = 680;
  const left   = Math.round((window.screen.width  - width)  / 2);
  const top    = Math.round((window.screen.height - height) / 2);

  const popup = window.open(
    oauthUrl,
    'lwd-google-oauth',
    `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
  );

  if (!popup) {
    onError('Popup was blocked by your browser. Please allow popups for this site.');
    return () => {};
  }

  function handleMessage(event) {
    if (event.data?.type === 'lwd-oauth-success') {
      cleanup();
      onSuccess(event.data.service, event.data.properties || []);
    } else if (event.data?.type === 'lwd-oauth-error') {
      cleanup();
      onError(event.data.error || 'OAuth failed');
    }
  }

  function cleanup() {
    window.removeEventListener('message', handleMessage);
    if (popup && !popup.closed) popup.close();
  }

  window.addEventListener('message', handleMessage);

  // Poll for popup close without message (user closed manually)
  const pollTimer = setInterval(() => {
    if (popup.closed) {
      clearInterval(pollTimer);
      cleanup();
    }
  }, 500);

  return cleanup;
}

// ── Select a property after connecting ────────────────────────────────────────

export async function selectProperty(service, propertyId, propertyName) {
  const { error } = await supabase
    .from('google_connections')
    .update({ selected_property_id: propertyId, selected_property_name: propertyName })
    .eq('service', service);
  if (error) throw new Error(error.message);
}

// ── Disconnect a service - clears all tokens and resets to disconnected ────────

export async function disconnectService(service) {
  const { error } = await supabase
    .from('google_connections')
    .update({
      status:                 'disconnected',
      access_token:           null,
      refresh_token:          null,
      token_expiry:           null,
      selected_property_id:   null,
      selected_property_name: null,
      available_properties:   [],
      error_message:          null,
      connected_at:           null,
    })
    .eq('service', service);
  if (error) throw new Error(error.message);
}

// ── Fetch real Search Console query data ──────────────────────────────────────

export async function fetchSearchConsoleData(siteUrl, { rowLimit = 10, startDate, endDate } = {}) {
  const { data, error } = await supabase.functions.invoke('google-search-console', {
    body: { siteUrl, rowLimit, ...(startDate && { startDate }), ...(endDate && { endDate }) },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

// ── Fetch real Google Analytics engagement data ───────────────────────────────

export async function fetchAnalyticsData(propertyId, options = {}) {
  const { data, error } = await supabase.functions.invoke('google-analytics', {
    body: { propertyId, ...options },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}
