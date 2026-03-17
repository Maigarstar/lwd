// ─── supabase/functions/google-oauth-callback/index.ts ───────────────────────
// Handles the Google OAuth redirect: exchanges the auth code for access +
// refresh tokens, fetches available properties, and stores everything securely.
//
// SETUP:
//   supabase secrets set GOOGLE_CLIENT_ID=...
//   supabase secrets set GOOGLE_CLIENT_SECRET=...
//   supabase secrets set APP_URL=https://yourdomain.com
//
// Deploy:
//   supabase functions deploy google-oauth-callback --no-verify-jwt
// ─────────────────────────────────────────────────────────────────────────────

import { serve }        from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Property {
  id:          string;
  name:        string;
  displayName: string;
}

// Fetch all GA4 properties the user has access to
async function fetchAnalyticsProperties(accessToken: string): Promise<Property[]> {
  const accountsRes = await fetch(
    'https://analyticsadmin.googleapis.com/v1beta/accounts',
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const accountsData = await accountsRes.json();
  const accounts: any[] = accountsData.accounts || [];

  const properties: Property[] = [];
  for (const account of accounts.slice(0, 10)) {
    const propsRes = await fetch(
      `https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent:${account.name}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const propsData = await propsRes.json();
    for (const prop of (propsData.properties || [])) {
      properties.push({
        id:          prop.name,  // e.g. "properties/123456789"
        name:        prop.name,
        displayName: `${prop.displayName} — ${account.displayName}`,
      });
    }
  }
  return properties;
}

// Fetch all Search Console sites the user has access to
async function fetchSearchConsoleProperties(accessToken: string): Promise<Property[]> {
  const res  = await fetch(
    'https://www.googleapis.com/webmasters/v3/sites',
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const data = await res.json();
  return (data.siteEntry || []).map((site: any) => ({
    id:          site.siteUrl,
    name:        site.siteUrl,
    displayName: site.siteUrl,
  }));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { code, state: rawState } = await req.json() as { code: string; state: string };

    if (!code || !rawState) {
      return Response.json({ error: 'Missing code or state parameter.' }, { status: 400, headers: CORS });
    }

    // state format: "service:uuid"
    const colonIdx   = rawState.indexOf(':');
    const service    = rawState.substring(0, colonIdx);
    const stateToken = rawState.substring(colonIdx + 1);

    if (!['analytics', 'search_console'].includes(service)) {
      return Response.json({ error: 'Invalid service in state parameter.' }, { status: 400, headers: CORS });
    }

    const clientId     = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const appUrl       = Deno.env.get('APP_URL');

    if (!clientId || !clientSecret || !appUrl) {
      return Response.json({
        error:          'Google OAuth is not fully configured.',
        setup_required: true,
      }, { status: 503, headers: CORS });
    }

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // CSRF check — verify state token matches what we stored
    const { data: conn } = await sb
      .from('google_connections')
      .select('oauth_state')
      .eq('service', service)
      .single();

    if (!conn || conn.oauth_state !== stateToken) {
      return Response.json(
        { error: 'State token mismatch. This may be a CSRF attempt — please try connecting again.' },
        { status: 403, headers: CORS },
      );
    }

    // Exchange auth code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     clientId,
        client_secret: clientSecret,
        redirect_uri:  `${appUrl}/admin/oauth/callback`,
        grant_type:    'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      await sb
        .from('google_connections')
        .update({ status: 'error', error_message: tokenData.error_description || tokenData.error })
        .eq('service', service);
      return Response.json(
        { error: tokenData.error_description || tokenData.error },
        { status: 400, headers: CORS },
      );
    }

    const accessToken  = tokenData.access_token  as string;
    const refreshToken = tokenData.refresh_token as string;
    const expiresIn    = (tokenData.expires_in  as number) || 3600;
    const tokenExpiry  = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Fetch available properties
    let properties: Property[] = [];
    try {
      properties = service === 'analytics'
        ? await fetchAnalyticsProperties(accessToken)
        : await fetchSearchConsoleProperties(accessToken);
    } catch {
      // Non-fatal — user can re-fetch later
    }

    // Persist connection (clear state token after use)
    await sb
      .from('google_connections')
      .update({
        status:               'connected',
        access_token:         accessToken,
        refresh_token:        refreshToken,
        token_expiry:         tokenExpiry,
        scope:                tokenData.scope || '',
        available_properties: properties,
        error_message:        null,
        oauth_state:          null,
        connected_at:         new Date().toISOString(),
      })
      .eq('service', service);

    return Response.json({ success: true, service, properties }, { headers: CORS });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: msg }, { status: 500, headers: CORS });
  }
});
