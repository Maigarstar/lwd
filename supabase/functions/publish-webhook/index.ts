import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { webhook_url, payload } = await req.json()

    if (!webhook_url || typeof webhook_url !== 'string') {
      throw new Error('webhook_url is required')
    }

    // Validate it's a proper URL
    let parsed: URL
    try {
      parsed = new URL(webhook_url)
    } catch {
      throw new Error('webhook_url is not a valid URL')
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('webhook_url must use http or https')
    }

    const res = await fetch(webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'issue.published',
        timestamp: new Date().toISOString(),
        ...payload,
      }),
    })

    return new Response(JSON.stringify({ ok: true, status: res.status }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
