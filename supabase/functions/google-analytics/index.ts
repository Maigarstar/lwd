// ─── supabase/functions/google-analytics/index.ts ────────────────────────────
// Fetches real engagement data from Google Analytics 4 using the Data API.
// Returns site-wide summary metrics + top landing pages.
// Handles token refresh automatically.
//
// Deploy:
//   supabase functions deploy google-analytics --no-verify-jwt
// ─────────────────────────────────────────────────────────────────────────────

import { serve }        from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getValidToken(sb: any, conn: any): Promise<string> {
  const expiry     = conn.token_expiry ? new Date(conn.token_expiry) : null;
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
    .eq('service', 'analytics');

  return data.access_token as string;
}

function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { propertyId, startDate, endDate } = await req.json() as {
      propertyId:  string;
      startDate?:  string;
      endDate?:    string;
    };

    if (!propertyId) {
      return Response.json({ error: 'propertyId is required.' }, { status: 400, headers: CORS });
    }

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: conn } = await sb
      .from('google_connections')
      .select('*')
      .eq('service', 'analytics')
      .eq('status', 'connected')
      .single();

    if (!conn) {
      return Response.json(
        { error: 'Google Analytics is not connected.', not_connected: true },
        { status: 401, headers: CORS },
      );
    }

    const accessToken = await getValidToken(sb, conn);

    const end   = endDate   || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // GA4 numeric property ID: strip "properties/" prefix if present
    const numericId = propertyId.replace(/^properties\//, '');

    const commonHeaders = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
    const apiBase       = `https://analyticsdata.googleapis.com/v1beta/properties/${numericId}:runReport`;

    // Fetch overall site metrics
    const summaryRes = await fetch(apiBase, {
      method:  'POST',
      headers: commonHeaders,
      body: JSON.stringify({
        dateRanges: [{ startDate: start, endDate: end }],
        metrics: [
          { name: 'sessions'              },
          { name: 'engagedSessions'       },
          { name: 'bounceRate'            },
          { name: 'averageSessionDuration'},
          { name: 'screenPageViewsPerSession' },
          { name: 'newUsers'              },
          { name: 'totalUsers'            },
        ],
      }),
    });
    const summaryData = await summaryRes.json();

    if (summaryData.error) {
      return Response.json(
        { error: summaryData.error.message || 'Analytics API error' },
        { status: summaryData.error.code || 400, headers: CORS },
      );
    }

    // Fetch top 5 landing pages
    const pagesRes = await fetch(apiBase, {
      method:  'POST',
      headers: commonHeaders,
      body: JSON.stringify({
        dateRanges: [{ startDate: start, endDate: end }],
        dimensions: [{ name: 'landingPagePlusQueryString' }],
        metrics:    [
          { name: 'sessions'              },
          { name: 'bounceRate'            },
          { name: 'averageSessionDuration'},
        ],
        limit:    5,
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      }),
    });
    const pagesData = await pagesRes.json();

    // Parse summary row — guard every value against undefined (empty rows when no data)
    const row  = summaryData.rows?.[0];
    const vals = (row?.metricValues || []).map((v: any) => Number(v.value || 0));
    const [
      sessions        = 0,
      engagedSessions = 0,
      bounceRate      = 0,
      avgSessionDuration = 0,
      pagesPerSession = 0,
      newUsers        = 0,
      totalUsers      = 0,
    ] = vals;

    const landingPages = (pagesData.rows || []).map((r: any) => ({
      page:            r.dimensionValues?.[0]?.value || '/',
      sessions:        Math.round(Number(r.metricValues?.[0]?.value || 0)),
      bounceRate:      Number((Number(r.metricValues?.[1]?.value || 0) * 100).toFixed(1)),
      avgDurationSecs: Number(r.metricValues?.[2]?.value || 0),
      avgDuration:     fmtDuration(Number(r.metricValues?.[2]?.value || 0)),
    }));

    return Response.json({
      summary: {
        sessions:            Math.round(sessions),
        engagedSessions:     Math.round(engagedSessions),
        bounceRate:          Number((bounceRate * 100).toFixed(1)),  // as percentage
        avgSessionDuration:  Math.round(avgSessionDuration),
        avgSessionFormatted: fmtDuration(avgSessionDuration),
        pagesPerSession:     Number(pagesPerSession.toFixed(1)),
        newUsers:            Math.round(newUsers),
        totalUsers:          Math.round(totalUsers),
      },
      landingPages,
      startDate:   start,
      endDate:     end,
      propertyId,
      propertyName: conn.selected_property_name || propertyId,
    }, { headers: CORS });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ error: msg }, { status: 500, headers: CORS });
  }
});
