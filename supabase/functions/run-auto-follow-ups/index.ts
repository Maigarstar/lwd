// run-auto-follow-ups — Supabase Edge Function
// Triggered by pg_cron (every hour). Finds prospects with next_follow_up_at <= now(),
// renders their stage email template, sends via Resend, and updates follow-up timestamps.
// Also callable manually from admin for testing.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_KEY        = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL        = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@luxuryweddingdirectory.com';
const FROM_NAME         = 'Luxury Wedding Directory';

// ── Merge {{tag}} style template tags ──────────────────────────────────────────
function mergeTags(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = data[key];
    return val != null ? String(val) : '';
  });
}

// ── Send a single email via Resend ─────────────────────────────────────────────
async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  if (!RESEND_KEY) {
    console.warn('run-auto-follow-ups: RESEND_API_KEY not set — email skipped');
    return false;
  }
  const html = body.replace(/\n/g, '<br>');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('run-auto-follow-ups: Resend error:', err);
    return false;
  }
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // 1. Fetch all active prospects with overdue follow-ups
    const now = new Date().toISOString();
    const { data: prospects, error: fetchErr } = await supabase
      .from('prospects')
      .select('*, pipeline_stages!stage_id(id, name, email_template_id, auto_follow_up_days, pipeline_id)')
      .eq('status', 'active')
      .lte('next_follow_up_at', now)
      .not('next_follow_up_at', 'is', null)
      .order('next_follow_up_at', { ascending: true })
      .limit(50); // safety cap per run

    if (fetchErr) throw fetchErr;
    if (!prospects?.length) {
      return new Response(JSON.stringify({ success: true, processed: 0, message: 'No follow-ups due' }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    let sent = 0;
    let skipped = 0;
    const results: Array<{ id: string; company: string; status: string }> = [];

    for (const prospect of prospects) {
      const stage = prospect.pipeline_stages;

      // Skip if no stage or no email template or no email address
      if (!stage?.email_template_id || !prospect.email) {
        // Still advance follow-up date so we don't re-process endlessly
        const nextDate = stage?.auto_follow_up_days
          ? new Date(Date.now() + stage.auto_follow_up_days * 86_400_000).toISOString()
          : null;
        await supabase.from('prospects').update({
          last_contacted_at: now,
          next_follow_up_at: nextDate,
        }).eq('id', prospect.id);
        skipped++;
        results.push({ id: prospect.id, company: prospect.company_name, status: 'skipped_no_template' });
        continue;
      }

      // 2. Fetch email template
      const { data: template } = await supabase
        .from('email_templates')
        .select('subject, body, email_type')
        .eq('id', stage.email_template_id)
        .single();

      if (!template?.subject || !template?.body) {
        skipped++;
        results.push({ id: prospect.id, company: prospect.company_name, status: 'skipped_template_missing' });
        continue;
      }

      // 3. Render template with prospect data
      const templateData: Record<string, unknown> = {
        company_name:  prospect.company_name || '',
        contact_name:  prospect.contact_name || prospect.company_name || '',
        first_name:    (prospect.contact_name || '').split(' ')[0] || prospect.company_name || '',
        email:         prospect.email || '',
        phone:         prospect.phone || '',
        website:       prospect.website || '',
        pipeline_stage: prospect.pipeline_stage || stage.name || '',
        source:        prospect.source || '',
        package:       prospect.package || '',
      };

      const subject = mergeTags(template.subject, templateData);
      const body    = mergeTags(template.body, templateData);

      // 4. Send the email
      const emailSent = await sendEmail(prospect.email, subject, body);

      // 5. Log to outreach_emails
      await supabase.from('outreach_emails').insert({
        prospect_id: prospect.id,
        email_type:  template.email_type || 'follow_up',
        subject,
        body,
        status:      emailSent ? 'sent' : 'failed',
        sent_at:     emailSent ? now : null,
      });

      // 6. Advance follow-up date
      const nextFollowUp = stage.auto_follow_up_days
        ? new Date(Date.now() + stage.auto_follow_up_days * 86_400_000).toISOString()
        : null;

      await supabase.from('prospects').update({
        last_contacted_at: now,
        next_follow_up_at: nextFollowUp,
      }).eq('id', prospect.id);

      if (emailSent) {
        sent++;
        results.push({ id: prospect.id, company: prospect.company_name, status: 'sent' });
      } else {
        skipped++;
        results.push({ id: prospect.id, company: prospect.company_name, status: 'send_failed' });
      }

      // Small delay to avoid Resend rate limits
      await new Promise(r => setTimeout(r, 200));
    }

    return new Response(
      JSON.stringify({ success: true, processed: prospects.length, sent, skipped, results }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    );

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('run-auto-follow-ups error:', msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }
});
