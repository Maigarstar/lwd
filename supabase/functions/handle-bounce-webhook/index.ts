// handle-bounce-webhook
// Handles Resend email.bounced and email.complained events.
// Adds the recipient email to email_suppressions automatically.
// Deploy with: supabase functions deploy handle-bounce-webhook --no-verify-jwt

Deno.serve(async (req: Request) => {
  // Quick 200 on GET (healthcheck / Resend URL verification)
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
  const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'invalid json' }), { status: 400 });
  }

  const type = (payload?.type as string) ?? '';

  // Only handle bounce and complaint events
  if (type !== 'email.bounced' && type !== 'email.complained') {
    return new Response(JSON.stringify({ ok: true, skipped: true, type }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const reason: 'bounced' | 'complaint' = type === 'email.complained' ? 'complaint' : 'bounced';

  // Resend payload shape: { type, data: { to: ["email@..."], ... } }
  const data = payload?.data as Record<string, unknown> | undefined;
  const toField = data?.to;
  let email = '';

  if (Array.isArray(toField) && toField.length > 0) {
    email = String(toField[0]).toLowerCase().trim();
  } else if (typeof toField === 'string') {
    email = toField.toLowerCase().trim();
  }

  if (!email) {
    return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'no email in payload' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Upsert into email_suppressions - ignore if already suppressed
  const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/email_suppressions`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify({
      email,
      reason,
      source: 'resend_webhook',
    }),
  });

  if (!upsertRes.ok && upsertRes.status !== 409) {
    const errText = await upsertRes.text().catch(() => 'unknown');
    console.error(`[bounce-webhook] Failed to suppress ${email}: ${errText}`);
  } else {
    console.info(`[bounce-webhook] Suppressed ${email} (${reason})`);
  }

  return new Response(JSON.stringify({ ok: true, email, reason }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
