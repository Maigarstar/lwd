import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Recipient {
  email: string;
  name?: string;
}

interface SendPayload {
  subject:   string;
  fromName:  string;
  fromEmail: string;
  html:      string;
  recipients: Recipient[];
  type?:     string;
}

// Chunk array into groups of N
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const RESEND_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_KEY) throw new Error('RESEND_API_KEY secret not configured in Supabase');

    const payload: SendPayload = await req.json();
    const { subject, fromName, fromEmail, html, recipients } = payload;

    if (!subject?.trim())    throw new Error('Subject is required');
    if (!fromEmail?.trim())  throw new Error('From email is required');
    if (!html?.trim())       throw new Error('Email HTML content is required');
    if (!recipients?.length) throw new Error('No recipients provided');

    const from = `${fromName || 'Luxury Wedding Directory'} <${fromEmail}>`;
    const batches = chunk(recipients, 50);

    let totalSent = 0;
    const errors: unknown[] = [];

    for (const batch of batches) {
      // Use batch endpoint for multiple, single endpoint for one
      if (batch.length === 1) {
        const r = batch[0];
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from,
            to:      [r.email],
            subject,
            html:    html.replace(/\{\{name\}\}/g, r.name || 'there').replace(/\{\{email\}\}/g, encodeURIComponent(r.email)),
          }),
        });
        if (res.ok) totalSent += 1;
        else errors.push(await res.json());
      } else {
        const batchBody = batch.map(r => ({
          from,
          to:      [r.email],
          subject,
          html:    html.replace(/\{\{name\}\}/g, r.name || 'there').replace(/\{\{email\}\}/g, encodeURIComponent(r.email)),
        }));

        const res = await fetch('https://api.resend.com/emails/batch', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(batchBody),
        });

        if (res.ok) {
          const data = await res.json();
          totalSent += data.data?.length ?? batch.length;
        } else {
          errors.push(await res.json());
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent: totalSent, errors }),
      { headers: { ...CORS, 'Content-Type': 'application/json' }, status: 200 },
    );

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { headers: { ...CORS, 'Content-Type': 'application/json' }, status: 400 },
    );
  }
});
