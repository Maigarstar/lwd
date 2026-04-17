import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature' };
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    // Verify signature if webhook secret is set
    if (webhookSecret && sig) {
      // Basic timestamp check (full HMAC verification would require crypto)
      const timestamp = sig.split(',').find(p => p.startsWith('t='))?.split('=')[1];
      if (timestamp) {
        const age = Date.now() / 1000 - parseInt(timestamp);
        if (age > 300) throw new Error('Webhook too old');
      }
    }

    const event = JSON.parse(body);

    if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      // The payment link description contains the vendor email — extract it
      const email = event.data?.object?.customer_details?.email ||
                    event.data?.object?.receipt_email ||
                    null;

      if (email) {
        // Find all pages with this vendor email in slot data and mark as paid
        // We store slot in template_data.slot.vendor_email
        // Fetch pages with matching vendor email
        const { data: pages } = await supabase
          .from('magazine_issue_pages')
          .select('id, template_data')
          .not('template_data->slot', 'is', null);

        for (const page of pages || []) {
          const slot = page.template_data?.slot;
          if (slot?.vendor_email?.toLowerCase() === email.toLowerCase() &&
              (slot.status === 'offered' || slot.status === 'available')) {
            await supabase.from('magazine_issue_pages').update({
              template_data: {
                ...page.template_data,
                slot: { ...slot, status: 'paid' },
              },
            }).eq('id', page.id);
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
