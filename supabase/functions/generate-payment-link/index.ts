import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { amount, currency = 'gbp', description, vendor_email, vendor_name } = await req.json()

    const key = Deno.env.get('STRIPE_SECRET_KEY')
    if (!key) throw new Error('STRIPE_SECRET_KEY not configured in Supabase secrets')

    // Create a Stripe Price object (one-time)
    const priceRes = await fetch('https://api.stripe.com/v1/prices', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        unit_amount: String(Math.round(amount * 100)),
        currency,
        'product_data[name]': description || 'Magazine Advertisement',
      }),
    })

    if (!priceRes.ok) {
      const err = await priceRes.json()
      throw new Error(err?.error?.message || 'Stripe price creation failed')
    }

    const price = await priceRes.json()

    // Create a Payment Link
    const linkRes = await fetch('https://api.stripe.com/v1/payment_links', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'line_items[0][price]': price.id,
        'line_items[0][quantity]': '1',
        ...(vendor_email ? { 'customer_creation': 'always' } : {}),
      }),
    })

    if (!linkRes.ok) {
      const err = await linkRes.json()
      throw new Error(err?.error?.message || 'Stripe payment link creation failed')
    }

    const link = await linkRes.json()

    return new Response(JSON.stringify({ url: link.url, id: link.id }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
