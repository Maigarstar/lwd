// ═══════════════════════════════════════════════════════════════════════════
// Supabase Edge Function: admin-events
// ═══════════════════════════════════════════════════════════════════════════
// Admin CRUD for events + event bookings.
// Uses service_role to bypass RLS — never expose service key in browser.
//
// Deploy:
//   supabase functions deploy admin-events
//
// Actions:
//   list          — paginated event list with filters
//   get           — single event by ID with booking summary
//   create        — insert event
//   update        — patch event fields
//   delete        — soft-delete (status → cancelled) or hard delete
//   list_bookings — bookings for an event_id with counts
//   update_booking — confirm / cancel / waitlist a booking
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL              = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const cors = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function ok(data: unknown) {
  return new Response(JSON.stringify({ success: true, data }), {
    status: 200, headers: { "Content-Type": "application/json", ...cors },
  });
}
function err(msg: string, status = 400) {
  return new Response(JSON.stringify({ success: false, error: msg }), {
    status, headers: { "Content-Type": "application/json", ...cors },
  });
}

// ─── Slug generator ──────────────────────────────────────────────────────────
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return err("Method not allowed", 405);

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return err("Invalid JSON"); }

  const { action } = body;

  // ── list ──────────────────────────────────────────────────────────────────
  if (action === "list") {
    const {
      managedAccountId, venueId, ownerId,
      status, eventType, upcoming,
      limit = 50, offset = 0,
    } = body as Record<string, unknown>;

    let query = supabase
      .from("events")
      .select("*, event_bookings(count)", { count: "exact" })
      .order("start_date", { ascending: true })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (managedAccountId) query = query.eq("managed_account_id", managedAccountId);
    if (venueId)           query = query.eq("venue_id", venueId);
    if (ownerId)           query = query.eq("owner_id", ownerId);
    if (status)            query = query.eq("status", status);
    if (eventType)         query = query.eq("event_type", eventType);
    if (upcoming)          query = query.gte("start_date", new Date().toISOString().split("T")[0]);

    const { data, error, count } = await query;
    if (error) return err(error.message, 500);
    return ok({ events: data, total: count });
  }

  // ── get ───────────────────────────────────────────────────────────────────
  if (action === "get") {
    const { eventId } = body as { eventId: string };
    if (!eventId) return err("eventId required");

    const { data: event, error: evErr } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (evErr) return err(evErr.message, 500);

    // Booking summary counts
    const { data: counts } = await supabase
      .from("event_bookings")
      .select("status")
      .eq("event_id", eventId);

    const bookingSummary = {
      total:     counts?.length ?? 0,
      confirmed: counts?.filter(b => b.status === "confirmed").length  ?? 0,
      pending:   counts?.filter(b => b.status === "pending").length    ?? 0,
      cancelled: counts?.filter(b => b.status === "cancelled").length  ?? 0,
      waitlist:  counts?.filter(b => b.status === "waitlist").length   ?? 0,
    };

    return ok({ event, bookingSummary });
  }

  // ── create ────────────────────────────────────────────────────────────────
  if (action === "create") {
    const { event } = body as { event: Record<string, unknown> };
    if (!event) return err("event payload required");

    // Auto-generate slug from title if not provided
    if (!event.slug && event.title) {
      event.slug = slugify(String(event.title)) + "-" + Date.now().toString(36);
    }

    const { data, error } = await supabase
      .from("events")
      .insert(event)
      .select("*")
      .single();

    if (error) return err(error.message, 500);
    return ok({ event: data });
  }

  // ── update ────────────────────────────────────────────────────────────────
  if (action === "update") {
    const { eventId, updates } = body as { eventId: string; updates: Record<string, unknown> };
    if (!eventId) return err("eventId required");

    const { data, error } = await supabase
      .from("events")
      .update(updates)
      .eq("id", eventId)
      .select("*")
      .single();

    if (error) return err(error.message, 500);
    return ok({ event: data });
  }

  // ── delete ────────────────────────────────────────────────────────────────
  if (action === "delete") {
    const { eventId, hard = false } = body as { eventId: string; hard?: boolean };
    if (!eventId) return err("eventId required");

    if (hard) {
      const { error } = await supabase.from("events").delete().eq("id", eventId);
      if (error) return err(error.message, 500);
    } else {
      // Soft delete — preserves bookings history
      const { error } = await supabase
        .from("events")
        .update({ status: "cancelled" })
        .eq("id", eventId);
      if (error) return err(error.message, 500);
    }
    return ok({ deleted: true, eventId });
  }

  // ── list_bookings ─────────────────────────────────────────────────────────
  if (action === "list_bookings") {
    const { eventId, status: bookingStatus, limit = 100, offset = 0 } =
      body as Record<string, unknown>;

    if (!eventId) return err("eventId required");

    let query = supabase
      .from("event_bookings")
      .select("*", { count: "exact" })
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (bookingStatus) query = query.eq("status", bookingStatus);

    const { data, error, count } = await query;
    if (error) return err(error.message, 500);

    // Counts per status
    const { data: allStatuses } = await supabase
      .from("event_bookings")
      .select("status, guest_count")
      .eq("event_id", eventId);

    const counts = {
      total:            allStatuses?.length ?? 0,
      confirmed:        allStatuses?.filter(b => b.status === "confirmed").length  ?? 0,
      pending:          allStatuses?.filter(b => b.status === "pending").length    ?? 0,
      cancelled:        allStatuses?.filter(b => b.status === "cancelled").length  ?? 0,
      waitlist:         allStatuses?.filter(b => b.status === "waitlist").length   ?? 0,
      totalGuests:      allStatuses
        ?.filter(b => b.status !== "cancelled")
        .reduce((sum, b) => sum + (b.guest_count || 1), 0) ?? 0,
    };

    return ok({ bookings: data, counts, total: count });
  }

  // ── update_booking ────────────────────────────────────────────────────────
  if (action === "update_booking") {
    const { bookingId, updates } = body as {
      bookingId: string;
      updates: Record<string, unknown>;
    };
    if (!bookingId) return err("bookingId required");

    // Set lifecycle timestamps automatically
    const now = new Date().toISOString();
    if (updates.status === "confirmed" && !updates.confirmed_at) updates.confirmed_at = now;
    if (updates.status === "cancelled" && !updates.cancelled_at) updates.cancelled_at = now;

    const { data, error } = await supabase
      .from("event_bookings")
      .update(updates)
      .eq("id", bookingId)
      .select("*")
      .single();

    if (error) return err(error.message, 500);
    return ok({ booking: data });
  }

  return err(`Unknown action: ${action}`);
});
