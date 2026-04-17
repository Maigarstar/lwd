import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const RESEND_KEY = Deno.env.get('RESEND_API_KEY');

  // Find all pages with slot status = 'offered' where the slot was offered > 3 days ago
  // We don't have an offered_at timestamp easily accessible, so we check all offered slots
  const { data: pages } = await supabase
    .from('magazine_issue_pages')
    .select('id, issue_id, page_number, template_data')
    .not('template_data->slot', 'is', null);

  let sent = 0;
  for (const page of pages || []) {
    const slot = page.template_data?.slot;
    if (slot?.status !== 'offered' || !slot.vendor_email) continue;

    // Fetch issue title
    const { data: issue } = await supabase.from('magazine_issues').select('title, slug').eq('id', page.issue_id).single();

    if (RESEND_KEY) {
      const html = `<!DOCTYPE html><html><body style="background:#0A0908;padding:32px;font-family:sans-serif">
        <div style="border-top:3px solid #C9A84C;padding-top:20px;max-width:560px;margin:0 auto">
          <p style="color:#C9A84C;font-size:10px;letter-spacing:0.12em;text-transform:uppercase">Luxury Wedding Directory · Editorial</p>
          <h2 style="color:#F0EBE0;font-family:Georgia,serif;font-style:italic;font-weight:400">A friendly reminder about your editorial placement</h2>
          <p style="color:rgba(240,235,224,0.75);font-size:14px;line-height:1.7">
            Dear ${slot.vendor_name || 'there'},<br><br>
            We wanted to follow up on the editorial placement offer we sent for <em>${issue?.title || 'our upcoming issue'}</em>.<br><br>
            Your <strong style="color:#C9A84C">${slot.tier || 'Standard'} placement</strong> is reserved at <strong style="color:#C9A84C">£${Number(slot.price||0).toLocaleString()}</strong>. Placements are limited and allocated on a first-confirmed basis.<br><br>
            To confirm, simply reply to this email or reach us at <a href="mailto:editorial@luxuryweddingdirectory.com" style="color:#C9A84C">editorial@luxuryweddingdirectory.com</a>.
          </p>
          <p style="color:rgba(240,235,224,0.3);font-size:11px;margin-top:24px">© ${new Date().getFullYear()} Luxury Wedding Directory</p>
        </div>
      </body></html>`;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Luxury Wedding Directory <editorial@luxuryweddingdirectory.com>',
          to: [slot.vendor_email],
          subject: `Following up on your editorial placement — LWD`,
          html,
        }),
      });
      sent++;
    }
  }

  return new Response(JSON.stringify({ sent }), {
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
});
