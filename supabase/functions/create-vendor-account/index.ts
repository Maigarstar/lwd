// ═══════════════════════════════════════════════════════════════════════════
// Supabase Edge Function: Create Vendor Account
// ═══════════════════════════════════════════════════════════════════════════
// Purpose: Securely create vendor account (server-side only)
// Called by: VendorAccountsPage.jsx via supabase.functions.invoke()
//
// Responsibilities:
// 1. Validate email uniqueness (auth.users + vendors table)
// 2. Create Supabase Auth user (email only, no password)
// 3. Create vendor record with activation token (7-day expiry)
// 4. Send activation email via send-vendor-activation-email function
// 5. Return { vendor_id, email, status: "invited" }
//
// Request body:
//   {
//     vendorName: string,
//     email: string,
//     linkedListingId?: string,
//     category?: string,
//     contactName?: string
//   }
//
// Response: { id, email, status } or { error: string }
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@^2.42.0";

// Environment variables (set in Supabase dashboard)
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// CORS headers for all responses
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

interface CreateVendorRequest {
  vendorName: string;
  email: string;
  linkedListingId?: string;
  category?: string;
  contactName?: string;
}

// Helper function to create JSON responses with CORS headers
function corsResponse(body: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: CORS_HEADERS,
  });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return corsResponse({ error: "Method not allowed" }, 405);
  }

  try {
    // Parse request body
    const {
      vendorName,
      email,
      linkedListingId,
      category,
      contactName,
    }: CreateVendorRequest = await req.json();

    // Validate required fields
    if (!vendorName || !email) {
      return corsResponse(
        { error: "Missing required fields: vendorName, email" },
        400
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return corsResponse({ error: "Invalid email format" }, 400);
    }

    // Initialize Supabase admin client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if email already exists in vendors table (duplicate prevention)
    const { data: existingVendor, error: checkError } = await supabase
      .from("vendors")
      .select("id, email, is_activated")
      .eq("email", email)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 = no rows returned (expected)
      throw checkError;
    }

    if (existingVendor) {
      const status = existingVendor.is_activated ? "activated" : "invited";
      return corsResponse(
        {
          error: `Vendor account already exists for ${email} (status: ${status}). To create a new account, use a different email address.`,
        },
        409
      );
    }

    // Rate limiting check: Prevent rapid account creation from same source
    // Get the client IP (for rate limiting)
    const clientIp =
      req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";

    // Check recent vendor creations from this IP in last 60 seconds
    // This is a simple check - in production, you might use a dedicated rate limiting service
    const recentVendors = await supabase
      .from("vendor_invite_log")
      .select("id")
      .eq("client_ip", clientIp)
      .gte(
        "created_at",
        new Date(Date.now() - 60 * 1000).toISOString() // Last 60 seconds
      );

    if (recentVendors.data && recentVendors.data.length >= 10) {
      return corsResponse(
        { error: "Too many account creation requests. Please wait a moment before trying again." },
        429
      );
    }

    // Create Supabase Auth user (server-side, secure)
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        email_confirm: false, // Require email verification
        user_metadata: {
          vendor_name: vendorName,
        },
      });

    if (authError) {
      console.error("Auth user creation error:", authError);
      // Check if user already exists
      if (authError.message.includes("already exists")) {
        return corsResponse(
          { error: `User account already exists for ${email}. This email is already registered in the system.` },
          409
        );
      }
      throw authError;
    }

    if (!authData.user) {
      throw new Error("Failed to create auth user");
    }

    // Generate activation token and expiry
    const activationToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Create vendor record
    const { data: vendorData, error: vendorError } = await supabase
      .from("vendors")
      .insert({
        user_id: authData.user.id,
        email,
        name: vendorName,
        is_activated: false,
        activation_token: activationToken,
        activation_token_expires_at: expiresAt.toISOString(),
        linked_listing_id: linkedListingId || null,
        contact_name: contactName || null,
      })
      .select("id, email, name, is_activated, created_at")
      .single();

    if (vendorError) {
      console.error("Vendor creation error:", vendorError);
      // Clean up auth user if vendor creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw vendorError;
    }

    // Send activation email
    const { error: emailError } = await supabase.functions.invoke(
      "send-vendor-activation-email",
      {
        body: {
          email,
          vendorName,
          activationToken,
        },
      }
    );

    if (emailError) {
      console.error("Email sending error:", emailError);
      // Log error but don't fail - vendor account is created, just email failed
      // In production, you might want to retry or alert admin
    }

    // Log invite for audit trail
    const { error: auditError } = await supabase
      .from("vendor_invite_log")
      .insert({
        vendor_id: vendorData.id,
        email,
        vendor_name: vendorName,
        client_ip: clientIp,
        // Note: admin_id would be set via RLS or JWT claims in production
      });

    if (auditError) {
      console.error("Audit log error:", auditError);
      // Log but don't fail - main account is created
    }

    // Success response
    return corsResponse(
      {
        id: vendorData.id,
        email: vendorData.email,
        name: vendorData.name,
        status: "invited",
        created_at: vendorData.created_at,
        message: "Vendor account created successfully. Activation email sent.",
      },
      201
    );
  } catch (error) {
    console.error("Error creating vendor account:", error);

    // Determine error message
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null) {
      errorMessage = JSON.stringify(error);
    }

    return corsResponse({ error: errorMessage }, 500);
  }
});

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
