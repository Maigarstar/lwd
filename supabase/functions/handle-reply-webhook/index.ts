// ═══════════════════════════════════════════════════════════════════════════
// Supabase Edge Function: Handle Inbound Reply Webhook
// ═══════════════════════════════════════════════════════════════════════════
//
// Purpose: Detect when a prospect replies to an outreach email.
//   1. Match inbound email to a prospect by their email address.
//   2. Mark the latest outreach_email as 'replied'.
//   3. Move prospect to the "Conversation" stage in their pipeline.
//   4. Clear next_follow_up_at to stop the auto follow-up sequence.
//   5. Log a system note in outreach history.
//
// Supported webhook formats:
//   - Resend:    { "type": "email.replied", "data": { "from": "...", "subject": "..." } }
//   - SendGrid:  [{ "event": "reply", "email": "...", "subject": "..." }]
//   - Generic:   { "from_email": "...", "subject": "..." }
//   - Manual:    { "manual": true, "prospect_id": "...", "subject": "..." }
//
// Setup:
//   1. Deploy this function: supabase functions deploy handle-reply-webhook
//   2. Set your email provider's inbound webhook URL to:
//      https://<project-ref>.supabase.co/functions/v1/handle-reply-webhook
//   3. Add WEBHOOK_SECRET to Supabase secrets if your provider signs webhooks.
//
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL              = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const WEBHOOK_SECRET            = Deno.env.get("REPLY_WEBHOOK_SECRET") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-webhook-secret",
};

interface ParsedReply {
  fromEmail: string;
  subject:   string;
  body?:     string;
  isManual?: boolean;
  prospectId?: string;
}

// ── Webhook format parsers ────────────────────────────────────────────────────

function parseWebhookBody(body: unknown): ParsedReply | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;

  // Manual mark-as-replied (from admin UI button)
  if (b.manual && b.prospect_id) {
    return {
      fromEmail:  "",
      subject:    (b.subject as string) || "Manual reply recorded",
      isManual:   true,
      prospectId: b.prospect_id as string,
    };
  }

  // Resend format
  if (b.type === "email.replied" && b.data) {
    const d = b.data as Record<string, unknown>;
    const from = Array.isArray(d.from) ? d.from[0] : (d.from as string);
    return { fromEmail: extractEmail(from), subject: (d.subject as string) || "" };
  }

  // SendGrid array format
  if (Array.isArray(b)) {
    const event = (b as unknown[])[0] as Record<string, unknown>;
    if (event?.event === "reply" || event?.event === "inbound") {
      return { fromEmail: extractEmail(event.email as string), subject: (event.subject as string) || "" };
    }
  }

  // Mailgun/Postmark
  if (b.sender || b.From) {
    return {
      fromEmail: extractEmail((b.sender || b.From) as string),
      subject:   (b.subject || b.Subject || "") as string,
      body:      (b["body-plain"] || b.TextBody || "") as string,
    };
  }

  // Generic fallback
  if (b.from_email) {
    return { fromEmail: b.from_email as string, subject: (b.subject as string) || "" };
  }

  return null;
}

function extractEmail(raw: string): string {
  if (!raw) return "";
  // "Name <email@domain.com>" -> "email@domain.com"
  const match = raw.match(/<([^>]+)>/) || raw.match(/([^\s]+@[^\s]+)/);
  return (match?.[1] || raw).toLowerCase().trim();
}

// ── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Optional webhook secret validation
  if (WEBHOOK_SECRET) {
    const provided = req.headers.get("x-webhook-secret") || req.headers.get("x-resend-signature");
    if (provided !== WEBHOOK_SECRET) {
      return new Response(JSON.stringify({ error: "Invalid webhook secret" }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  }

  try {
    const rawBody = await req.json();
    const reply   = parseWebhookBody(rawBody);

    if (!reply) {
      return new Response(JSON.stringify({ ok: true, action: "ignored", reason: "unrecognised format" }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ── Find the prospect ─────────────────────────────────────────────────

    let prospect: Record<string, unknown> | null = null;

    if (reply.isManual && reply.prospectId) {
      const { data } = await supabase
        .from("prospects")
        .select("*")
        .eq("id", reply.prospectId)
        .single();
      prospect = data;
    } else if (reply.fromEmail) {
      const { data } = await supabase
        .from("prospects")
        .select("*")
        .ilike("email", reply.fromEmail)
        .eq("status", "active")
        .limit(1)
        .single();
      prospect = data;
    }

    if (!prospect) {
      return new Response(JSON.stringify({ ok: true, action: "ignored", reason: "prospect not found" }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const now = new Date().toISOString();

    // ── Mark latest outreach email as replied ─────────────────────────────

    const { data: latestEmail } = await supabase
      .from("outreach_emails")
      .select("id")
      .eq("prospect_id", prospect.id as string)
      .eq("status", "sent")
      .order("sent_at", { ascending: false })
      .limit(1)
      .single();

    if (latestEmail) {
      await supabase
        .from("outreach_emails")
        .update({ status: "replied", replied_at: now })
        .eq("id", latestEmail.id);
    }

    // Log a system note about the reply
    await supabase.from("outreach_emails").insert([{
      prospect_id: prospect.id,
      email_type:  "custom",
      subject:     `Reply received: ${reply.subject || "(no subject)"}`,
      body:        reply.body || "Prospect replied to outreach email.",
      sent_at:     now,
      status:      "replied",
      replied_at:  now,
    }]);

    // ── Find "Conversation" stage in prospect's pipeline ──────────────────

    let conversationStageId: string | null = null;
    let conversationStageName = "Conversation";

    if (prospect.pipeline_id) {
      const { data: stages } = await supabase
        .from("pipeline_stages")
        .select("id, name")
        .eq("pipeline_id", prospect.pipeline_id as string)
        .order("position", { ascending: true });

      if (stages) {
        // Find the first stage with "conversation" in the name
        const convStage = stages.find(s =>
          s.name.toLowerCase().includes("conversation")
        );
        if (convStage) {
          conversationStageId   = convStage.id;
          conversationStageName = convStage.name;
        }
      }
    }

    // ── Update prospect: move to Conversation, stop follow-ups ───────────

    const updates: Record<string, unknown> = {
      next_follow_up_at:  null,    // stop auto follow-up sequence
      last_contacted_at:  now,
      updated_at:         now,
      pipeline_stage:     conversationStageName,
    };

    if (conversationStageId) {
      updates.stage_id = conversationStageId;
    }

    await supabase
      .from("prospects")
      .update(updates)
      .eq("id", prospect.id as string);

    console.log(`Reply detected: ${prospect.company_name} -> moved to ${conversationStageName}`);

    return new Response(
      JSON.stringify({
        ok:       true,
        action:   "reply_processed",
        prospect: prospect.company_name,
        moved_to: conversationStageName,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error("Reply webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
