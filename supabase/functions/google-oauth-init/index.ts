// ─── supabase/functions/google-oauth-init/index.ts ───────────────────────────
// Generates a Google OAuth 2.0 authorisation URL for GA4 or Search Console.
//
// SETUP (run these commands once after deploying):
//   supabase secrets set GOOGLE_CLIENT_ID=your_client_id
//   supabase secrets set APP_URL=https://yourdomain.com
//
// Google Cloud Console:
//   1. Create a project and enable: Google Analytics Data API, Search Console API,
//      Google Analytics Admin API
//   2. Create OAuth 2.0 credentials (type: Web application)
//   3. Add Authorised redirect URI: {APP_URL}/admin/oauth/callback
//
// Deploy:
//   supabase functions deploy google-oauth-init --no-verify-jwt
// ─────────────────────────────────────────────────────────────────────────────

import { serve }        from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SCOPES: Record<string, string> = {
  analytics:
    'https://www.googleapis.com/auth/analytics.readonly ' +
    'https://www.googleapis.com/auth/analytics.edit ' +
    'https://www.googleapis.com/auth/analytics',
  search_console:
    'https://www.googleapis.com/auth/webmasters.readonly',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { service } = await req.json() as { service: string };

    if (!['analytics', 'search_console'].includes(service)) {
      return Response.json({ error: 'Invalid service. Must be analytics or search_console.' }, { status: 400, headers: CORS });
    }

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const appUrl   = Deno.env.get('APP_URL');

    if (!clientId || !appUrl) {
      return Response.json({
        error:         'Google OAuth is not configured for this workspace.',
        setup_required: true,
        instructions:  'Set GOOGLE_CLIENT_ID and APP_URL in Supabase secrets to enable Google connections.',
      }, { status: 503, headers: CORS });
    }

    // Generate a cryptographically random CSRF state token
    const stateToken  = crypto.randomUUID();
    const redirectUri = `${appUrl}/admin/oauth/callback`;

    // Persist state token for CSRF verification on callback
    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    await sb
      .from('google_connections')
      .upsert(
        { service, status: 'pending', oauth_state: stateToken, error_message: null },
        { onConflict: 'service' },
      );

    // Build OAuth URL — state format: "service:uuid" so callback can identify service
    const params = new URLSearchParams({
      client_id:     clientId,
      redirect_uri:  redirectUri,
      response_type: 'code',
      scope:         SCOPES[service],
      access_type:   'offline',    // request refresh token
      prompt:        'consent',    // force consent screen to ensure refresh token returned
      state:         `${service}:${stateToken}`,
    });

    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    return Response.json({ oauthUrl }, { headers: CORS });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: msg }, { status: 500, headers: CORS });
  }
});
