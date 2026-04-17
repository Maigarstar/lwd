import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── Stripe signature verification ────────────────────────────────────────────

/** Parse Stripe's stripe-signature header into its constituent parts */
function parseStripeSignature(header: string): { timestamp: string; signatures: string[] } {
  return header.split(',').reduce(
    (acc, part) => {
      const eqIdx = part.indexOf('=')
      const k = part.slice(0, eqIdx)
      const v = part.slice(eqIdx + 1)
      if (k === 't') acc.timestamp = v
      else if (k === 'v1') acc.signatures.push(v)
      return acc
    },
    { timestamp: '', signatures: [] as string[] }
  )
}

/**
 * Verify Stripe HMAC-SHA256 webhook signature.
 * Uses Web Crypto API (SubtleCrypto) — available in Deno/Edge Functions.
 * Throws if the signature is missing, invalid, or the event is too old.
 */
async function verifyStripeSignature(body: string, sig: string, secret: string): Promise<void> {
  const { timestamp, signatures } = parseStripeSignature(sig)

  if (!timestamp) throw new Error('Missing timestamp in stripe-signature header')

  // Reject events older than 5 minutes (replay attack prevention)
  const age = Date.now() / 1000 - parseInt(timestamp, 10)
  if (age > 300) throw new Error(`Webhook timestamp too old (${Math.floor(age)}s — replay attack prevention)`)

  const encoder = new TextEncoder()
  const signedPayload = `${timestamp}.${body}`

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload))

  // Convert MAC bytes to lowercase hex string
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  // Constant-time comparison isn't critical here (computed, not received),
  // but we check all provided v1 signatures so a rotation key also works.
  const valid = signatures.some((s) => s === expected)
  if (!valid) throw new Error('Invalid Stripe webhook signature')
}

// ── Webhook handler ───────────────────────────────────────────────────────────

serve(async (req) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, stripe-signature',
  }
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const body = await req.text()
    const sig = req.headers.get('stripe-signature')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    // Reject if secret is configured but signature is absent or invalid
    if (webhookSecret) {
      if (!sig) throw new Error('Missing stripe-signature header')
      await verifyStripeSignature(body, sig, webhookSecret)
    }

    const event = JSON.parse(body)

    if (event.type === 'checkout.session.completed') {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      const session = event.data.object as {
        id: string
        metadata?: Record<string, string>
        customer_details?: { email?: string }
      }

      const { issue_id, page_number, vendor_email: metaEmail } = session.metadata ?? {}

      if (issue_id && page_number) {
        // ── Primary path: metadata-based lookup (precise, no full-table scan) ──
        // Checkout Sessions created by generate-payment-link always include
        // issue_id + page_number in metadata — this uniquely identifies the page.
        const { data: page, error } = await supabase
          .from('magazine_issue_pages')
          .select('id, template_data')
          .eq('issue_id', issue_id)
          .eq('page_number', parseInt(page_number, 10))
          .single()

        if (!error && page) {
          const slot = (page.template_data as Record<string, unknown>)?.slot as Record<string, unknown> | undefined
          const payableStatuses = ['offered', 'available', 'proof_sent']

          if (slot && payableStatuses.includes(slot.status as string)) {
            await supabase
              .from('magazine_issue_pages')
              .update({
                template_data: {
                  ...(page.template_data as object),
                  slot: {
                    ...slot,
                    status: 'paid',
                    stripe_session_id: session.id,
                    paid_at: new Date().toISOString(),
                  },
                },
              })
              .eq('id', page.id)
          }
        }
      } else {
        // ── Fallback path: email scan for legacy sessions without metadata ──
        // Only used for payment links generated before the metadata upgrade.
        // Will be removed once all outstanding links have been paid/expired.
        const customerEmail =
          session.customer_details?.email || metaEmail || null

        if (customerEmail) {
          const { data: pages } = await supabase
            .from('magazine_issue_pages')
            .select('id, template_data')
            .not('template_data->slot', 'is', null)

          for (const p of pages ?? []) {
            const td = p.template_data as Record<string, unknown>
            const s = td?.slot as Record<string, unknown> | undefined
            const payableStatuses = ['offered', 'available', 'proof_sent']

            if (
              s &&
              (s.vendor_email as string)?.toLowerCase() === customerEmail.toLowerCase() &&
              payableStatuses.includes(s.status as string)
            ) {
              await supabase
                .from('magazine_issue_pages')
                .update({
                  template_data: {
                    ...td,
                    slot: {
                      ...s,
                      status: 'paid',
                      stripe_session_id: session.id,
                      paid_at: new Date().toISOString(),
                    },
                  },
                })
                .eq('id', p.id)
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
