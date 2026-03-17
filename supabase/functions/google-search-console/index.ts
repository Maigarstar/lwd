// ─── supabase/functions/google-search-console/index.ts ───────────────────────
// Fetches real query data from Google Search Console for a given site URL.
// Handles token refresh automatically.
//
// Deploy:
//   supabase functions deploy google-search-console --no-verify-jwt
// ─────────────────────────────────────────────────────────────────────────────

import { serve }        from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Returns a valid access token, refreshing if within 5 minutes of expiry
async function getValidToken(sb: any, conn: any): Promise<string> {
  const expiry = conn.token_expiry ? new Date(conn.token_expiry) : null;
  const stillValid = expiry && expiry > new Date(Date.now() + 5 * 60 * 1000);
  if (stillValid) return conn.access_token;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     Deno.env.get('GOOGLE_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
      refresh_token: conn.refresh_token,
      grant_type:    'refresh_token',
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(`Token refresh failed: ${data.error_description || data.error}`);

  const newExpiry = new Date(Date.now() + ((data.expires_in as number) || 3600) * 1000).toISOString();
  await sb
    .from('google_connections')
    .update({ access_token: data.access_token, token_expiry: newExpiry })
    .eq('service', 'search_console');

  return data.access_token as string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { siteUrl, startDate, endDate, rowLimit = 10 } = await req.json() as {
      siteUrl:    string;
      startDate?: string;
      endDate?:   string;
      rowLimit?:  number;
    };

    if (!siteUrl) {
      return Response.json({ error: 'siteUrl is required.' }, { status: 400, headers: CORS });
    }

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: conn } = await sb
      .from('google_connections')
      .select('*')
      .eq('service', 'search_console')
      .eq('status', 'connected')
      .single();

    if (!conn) {
      return Response.json(
        { error: 'Search Console is not connected.', not_connected: true },
        { status: 401, headers: CORS },
      );
    }

    if (!conn.selected_property_id) {
      return Response.json(
        { error: 'No Search Console property selected.', no_property: true },
        { status: 400, headers: CORS },
      );
    }

    const accessToken = await getValidToken(sb, conn);

    const end   = endDate   || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const apiRes = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(conn.selected_property_id)}/searchAnalytics/query`,
      {
        method:  'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate,
          endDate:    end,
          startDate:  start,
          dimensions: ['query'],
          rowLimit,
          orderBy: [{ fieldName: 'clicks', sortOrder: 'DESCENDING' }],
        }),
      },
    );

    const data = await apiRes.json();

    if (data.error) {
      return Response.json(
        { error: data.error.message || 'Search Console API error' },
        { status: data.error.code || 400, headers: CORS },
      );
    }

    const rows = (data.rows || []).map((r: any) => ({
      query:       r.keys?.[0] || '',
      clicks:      Math.round(r.clicks      || 0),
      impressions: Math.round(r.impressions || 0),
      ctr:         Number(((r.ctr           || 0) * 100).toFixed(1)),  // as percentage
      position:    Number((r.position       || 0).toFixed(1)),
    }));

    // Also fetch site-wide totals (no dimension)
    const totalsRes = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(conn.selected_property_id)}/searchAnalytics/query`,
      {
        method:  'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: start, endDate: end, dimensions: [] }),
      },
    );
    const totalsData = await totalsRes.json();
    const totals     = totalsData.rows?.[0] || {};

    return Response.json({
      rows,
      totals: {
        clicks:      Math.round(totals.clicks      || 0),
        impressions: Math.round(totals.impressions || 0),
        ctr:         Number(((totals.ctr           || 0) * 100).toFixed(1)),
        position:    Number((totals.position       || 0).toFixed(1)),
      },
      startDate:  start,
      endDate:    end,
      property:   conn.selected_property_id,
      propertyName: conn.selected_property_name,
    }, { headers: CORS });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: msg }, { status: 500, headers: CORS });
  }
});
