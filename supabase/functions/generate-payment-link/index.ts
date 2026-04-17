import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const {
      amount,        // ALREADY in smallest currency unit (pence/cents) — do NOT multiply again
      currency = 'gbp',
      description,
      vendor_email,
      vendor_name,
      issue_id,      // Supabase issue UUID — stored in Stripe metadata for webhook matching
      page_number,   // Page number — stored in metadata for precise webhook matching
      success_url,   // Where to redirect after successful payment (caller supplies)
      cancel_url,    // Where to redirect on cancel
    } = await req.json()

    const key = Deno.env.get('STRIPE_SECRET_KEY')
    if (!key) throw new Error('STRIPE_SECRET_KEY not configured in Supabase secrets')

    const siteBase = Deno.env.get('SITE_URL') || 'https://luxuryweddingdirectory.com'

    // Checkout Session (one-time, supports per-session metadata for webhook)
    // Payment Links are static/reusable and don't carry per-session metadata,
    // so we use Checkout Sessions to reliably match the webhook to the correct page.
    const params = new URLSearchParams({
      mode: 'payment',
      'line_items[0][price_data][currency]': currency,
      // amount is already in pence/cents — DO NOT multiply by 100
      'line_items[0][price_data][unit_amount]': String(Math.round(amount)),
      'line_items[0][price_data][product_data][name]': description || 'Magazine Advertisement',
      'line_items[0][quantity]': '1',
      success_url: success_url || `${siteBase}/publication-studio?payment=success`,
      cancel_url:  cancel_url  || `${siteBase}/publication-studio?payment=cancelled`,
      // Metadata is returned verbatim in the webhook event
      'metadata[issue_id]':    issue_id      || '',
      'metadata[page_number]': String(page_number ?? ''),
      'metadata[vendor_email]': vendor_email || '',
    })

    if (vendor_email) {
      params.set('customer_email', vendor_email)
    }

    const sessionRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    })

    if (!sessionRes.ok) {
      const err = await sessionRes.json()
      throw new Error(err?.error?.message || 'Stripe session creation failed')
    }

    const session = await sessionRes.json()

    return new Response(JSON.stringify({ url: session.url, id: session.id }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
