// ═══════════════════════════════════════════════════════════════════════════
// Shared helper for calling the ai-generate Supabase Edge Function
// ═══════════════════════════════════════════════════════════════════════════
//
// Why this exists:
//   supabase.functions.invoke('ai-generate', ...) sends the admin's session JWT
//   in the Authorization header. When that token is stale the Supabase gateway
//   returns 401 before the function runs, and the SDK swallows the response
//   body, surfacing only the generic "Edge Function returned a non-2xx status
//   code" error. Direct fetch + anon key avoids the gateway auth path entirely
//   and also lets us surface the real error message from the function.
//
// Usage:
//   import { callAiGenerate } from '@/lib/aiGenerate';
//   const data = await callAiGenerate({
//     feature: 'about_description',
//     systemPrompt: '...',
//     userPrompt: '...',
//     venue_id: '...',   // optional
//   });
//   // data = { text, provider, model, tokens_used, estimated_cost }
//
// NOTE: This helper is specific to the ai-generate function where direct anon
// key fetch is proven to work. Do NOT reuse this pattern for other edge
// functions without verifying they accept the anon key the same way.
// ═══════════════════════════════════════════════════════════════════════════

export async function callAiGenerate(body) {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase env vars missing');
  }

  const res = await fetch(`${url}/functions/v1/ai-generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'apikey': key,
    },
    body: JSON.stringify(body),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON response — fall through to error handling below
  }

  if (!res.ok) {
    const msg = data?.error || `HTTP ${res.status}`;
    throw new Error(`ai-generate: ${msg}`);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}
