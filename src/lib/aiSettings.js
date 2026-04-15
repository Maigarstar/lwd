// ═══════════════════════════════════════════════════════════════════════════
// Shared helper for calling the ai-settings Supabase Edge Function
// ═══════════════════════════════════════════════════════════════════════════
//
// Why this exists:
//   supabase.functions.invoke('ai-settings', ...) sends the admin's session
//   JWT in the Authorization header. When that token is stale (admin
//   session expired, rotated, or never fully established) the Supabase
//   gateway returns 401 *before* the function runs, and the SDK swallows
//   the real response body, surfacing only the generic "Edge Function
//   returned a non-2xx status code" error. Admins then can't save their
//   AI provider API key, and the diagnostic path is invisible.
//
//   Direct fetch + anon key avoids the gateway auth path entirely, matches
//   the pattern already used in ./aiGenerate.js, and bubbles the real
//   error body up to the caller as a normal Error.
//
// Usage:
//   import { fetchAiSettings, saveAiSettings } from '@/lib/aiSettings';
//
//   const current = await fetchAiSettings();
//   // current = { id, provider, model, active, api_key_masked, ... } or null
//
//   const updated = await saveAiSettings({
//     provider: 'openai',
//     api_key:  'sk-...',
//     model:    'gpt-4.1',
//     active:   true,
//   });
//   // updated = same shape as fetchAiSettings, with fresh masked key
//
// Error handling:
//   Both functions throw a single Error instance whose .message holds the
//   real error string from the function body (e.g. "No active AI provider
//   configured", "Missing required fields", "Failed to save settings: …").
//   Callers should wrap in try/catch and surface err.message to the UI.
//
// NOTE: This is the ai-settings companion to ./aiGenerate.js. Keep the two
// helpers in lockstep — any hardening added here should be considered for
// aiGenerate.js as well, and vice versa.
// ═══════════════════════════════════════════════════════════════════════════

function getConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing');
  return { url, key };
}

/**
 * GET /functions/v1/ai-settings
 * Returns the currently active AI provider config (with masked api_key)
 * or null if no provider is configured.
 * Throws on network / auth / 5xx errors.
 */
export async function fetchAiSettings() {
  const { url, key } = getConfig();

  const res = await fetch(`${url}/functions/v1/ai-settings`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${key}`,
      'apikey': key,
    },
  });

  // 503 "No active AI provider configured" is an expected null state, not
  // an error — the admin page should render the empty form in that case.
  if (res.status === 503) return null;

  let data = null;
  try { data = await res.json(); } catch { /* non-JSON */ }

  if (!res.ok) {
    const msg = data?.error || `HTTP ${res.status}`;
    throw new Error(`ai-settings: ${msg}`);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

/**
 * POST /functions/v1/ai-settings
 * Save (upsert) AI provider config. Returns the saved row with masked key.
 * Throws on any non-200 response with the real server error message.
 *
 * @param {{ provider: string, api_key: string, model: string, active: boolean }} body
 */
export async function saveAiSettings(body) {
  const { url, key } = getConfig();

  if (!body || !body.provider || !body.api_key || !body.model) {
    throw new Error('Missing required fields: provider, api_key, model');
  }

  const res = await fetch(`${url}/functions/v1/ai-settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'apikey': key,
    },
    body: JSON.stringify(body),
  });

  let data = null;
  try { data = await res.json(); } catch { /* non-JSON */ }

  if (!res.ok) {
    const msg = data?.error || `HTTP ${res.status}`;
    throw new Error(`ai-settings: ${msg}`);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}
