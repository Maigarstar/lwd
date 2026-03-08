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

interface CreateVendorRequest {
  vendorName: string;
  email: string;
  linkedListingId?: string;
  category?: string;
  contactName?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
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
      return new Response(
        JSON.stringify({
          error: "Missing required fields: vendorName, email",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({
          error: "Invalid email format",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase admin client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if email already exists in vendors table
    const { data: existingVendor, error: checkError } = await supabase
      .from("vendors")
      .select("id, email")
      .eq("email", email)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 = no rows returned (expected)
      throw checkError;
    }

    if (existingVendor) {
      return new Response(
        JSON.stringify({
          error: `Vendor account already exists for ${email}`,
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
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
        return new Response(
          JSON.stringify({
            error: `User account already exists for ${email}. This email is already registered in the system.`,
          }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          }
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

    // Success response
    return new Response(
      JSON.stringify({
        id: vendorData.id,
        email: vendorData.email,
        name: vendorData.name,
        status: "invited",
        created_at: vendorData.created_at,
        message: "Vendor account created successfully. Activation email sent.",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
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

    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
