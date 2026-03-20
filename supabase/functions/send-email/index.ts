// ═══════════════════════════════════════════════════════════════════════════
// Supabase Edge Function: send-email
// ═══════════════════════════════════════════════════════════════════════════
// Unified transactional email via Resend.
// Accepts two call shapes — backward-compatible with all existing callers:
//
//   Simple (used by most services):
//     { to: string, subject: string, html: string }
//
//   Full / batch (used by emailSendService, pipeline):
//     { recipients: [{email, name?}], fromName?, fromEmail?, subject, html }
//
// Env secrets required (set in Supabase dashboard → Project Settings → Edge Functions):
//   RESEND_API_KEY       — Resend API key (re_*)
//   RESEND_FROM_EMAIL    — verified sender address (default: noreply@luxuryweddingdirectory.com)
//   RESEND_FROM_NAME     — sender display name (default: Luxury Wedding Directory)
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Recipient { email: string; name?: string }

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  try {
    const RESEND_KEY      = Deno.env.get('RESEND_API_KEY');
    const DEFAULT_FROM    = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@luxuryweddingdirectory.com';
    const DEFAULT_NAME    = Deno.env.get('RESEND_FROM_NAME')  || 'Luxury Wedding Directory';

    if (!RESEND_KEY) throw new Error('RESEND_API_KEY secret not configured');

    const payload = await req.json();

    // ── Normalise payload to internal format ─────────────────────────────────
    let recipients: Recipient[];
    let subject: string;
    let html: string;
    let fromAddress: string;
    let fromName: string;

    if (typeof payload.to === 'string') {
      // Simple shape: { to, subject, html }
      recipients  = [{ email: payload.to }];
      subject     = payload.subject  || '';
      html        = payload.html     || '';
      fromAddress = DEFAULT_FROM;
      fromName    = DEFAULT_NAME;
    } else if (Array.isArray(payload.recipients)) {
      // Full shape: { recipients, fromName?, fromEmail?, subject, html }
      recipients  = payload.recipients;
      subject     = payload.subject   || '';
      html        = payload.html      || '';
      fromAddress = payload.fromEmail || DEFAULT_FROM;
      fromName    = payload.fromName  || DEFAULT_NAME;
    } else {
      return json({ success: false, error: 'Invalid payload: provide to (string) or recipients (array)' }, 400);
    }

    if (!subject.trim()) return json({ success: false, error: 'subject is required' }, 400);
    if (!html.trim())    return json({ success: false, error: 'html is required' }, 400);
    if (!recipients.length) return json({ success: false, error: 'No recipients' }, 400);

    const from = `${fromName} <${fromAddress}>`;

    // ── Send via Resend ───────────────────────────────────────────────────────
    let totalSent = 0;
    const errors: unknown[] = [];

    for (const batch of chunk(recipients, 50)) {
      if (batch.length === 1) {
        const r = batch[0];
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from,
            to:      [r.email],
            subject,
            html:    html
              .replace(/\{\{name\}\}/g,  r.name  || 'there')
              .replace(/\{\{email\}\}/g, encodeURIComponent(r.email)),
          }),
        });
        if (res.ok) totalSent += 1;
        else { const e = await res.json(); errors.push(e); console.error('Resend error:', e); }
      } else {
        const batchBody = batch.map(r => ({
          from,
          to:      [r.email],
          subject,
          html:    html
            .replace(/\{\{name\}\}/g,  r.name  || 'there')
            .replace(/\{\{email\}\}/g, encodeURIComponent(r.email)),
        }));
        const res = await fetch('https://api.resend.com/emails/batch', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(batchBody),
        });
        if (res.ok) { const d = await res.json(); totalSent += d.data?.length ?? batch.length; }
        else { const e = await res.json(); errors.push(e); console.error('Resend batch error:', e); }
      }
    }

    return json({ success: true, sent: totalSent, errors });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[send-email] fatal:', message);
    return json({ success: false, error: message }, 500);
  }
});
