// Email send service — calls the send-email Supabase Edge Function
// which in turn calls Resend. API key lives in Supabase secrets only.

/**
 * Send an email campaign or newsletter via Resend.
 *
 * @param {object} opts
 * @param {string} opts.subject
 * @param {string} opts.fromName
 * @param {string} opts.fromEmail   - Must be from a Resend-verified domain
 * @param {string} opts.html        - Full email HTML (from generateHTML)
 * @param {{email:string, name?:string}[]} opts.recipients
 * @param {'campaign'|'newsletter'} [opts.type]
 * @returns {Promise<{sent:number, errors:unknown[]}>}
 */
export async function sendEmail({ subject, fromName, fromEmail, html, recipients, type = 'campaign' }) {
  const { supabase } = await import('../lib/supabaseClient');

  const { data, error } = await supabase.functions.invoke('send-email', {
    body: { subject, fromName, fromEmail, html, recipients, type },
  });

  if (error) throw new Error(error.message || 'Edge Function error');
  if (!data?.success) throw new Error(data?.error || 'Send failed');

  // Log to email_sends (best-effort — don't fail the send if this fails)
  try {
    await supabase.from('email_sends').insert({
      type,
      subject,
      from_name:       fromName,
      from_email:      fromEmail,
      recipient_count: data.sent,
      status:          data.errors?.length > 0 ? 'partial' : 'sent',
      html_body:       html,
      sent_at:         new Date().toISOString(),
    });
  } catch (logErr) {
    console.warn('[emailSendService] Failed to log send:', logErr);
  }

  return { sent: data.sent, errors: data.errors ?? [] };
}

/**
 * Fetch active newsletter subscribers from Supabase.
 * Returns [] gracefully if the table doesn't exist yet.
 */
export async function fetchNewsletterSubscribers() {
  const { supabase } = await import('../lib/supabaseClient');
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('id, email, first_name, last_name, status')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[emailSendService] newsletter_subscribers not available:', error.message);
    return [];
  }
  return data || [];
}

/**
 * Subscribe an email to the newsletter.
 */
export async function subscribeToNewsletter({ email, firstName, lastName, source = 'website' }) {
  const { supabase } = await import('../lib/supabaseClient');
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .upsert({ email, first_name: firstName, last_name: lastName, source, status: 'active' }, { onConflict: 'email' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Unsubscribe by email (called from the unsubscribe landing page).
 */
export async function unsubscribe(email) {
  const { supabase } = await import('../lib/supabaseClient');
  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
    .eq('email', email);
  if (error) throw error;
}
