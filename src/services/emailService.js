// ─── src/services/emailService.js ────────────────────────────────────────────
// Email notification service for enquiries
// Sends confirmation emails to couples and lead notifications to vendors
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Send enquiry confirmation email to couple
 * @param {Object} enquiry - Enquiry details
 * @returns {Promise<{success: boolean, error: null|Object}>}
 */
export const sendCoupleConfirmationEmail = async (enquiry) => {
  try {
    if (!supabase) {
      console.warn("Supabase not configured for email service");
      return { success: false, error: new Error("Supabase not configured") };
    }

    const emailData = {
      to: enquiry.coupleEmail,
      subject: `Your enquiry has been sent to ${enquiry.vendorName}`,
      html: `
        <h2>Thank You, ${enquiry.coupleName}</h2>
        <p>Your enquiry has been successfully sent to:</p>
        <h3>${enquiry.vendorName}</h3>

        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Wedding Date:</strong> ${enquiry.weddingDate || "Not specified"}</p>
          <p><strong>Guest Count:</strong> ${enquiry.guestCount || "Not specified"}</p>
          ${enquiry.budgetRange ? `<p><strong>Budget:</strong> ${enquiry.budgetRange}</p>` : ""}
        </div>

        <p>The vendor will respond to you directly as soon as possible. Look for their response in your email inbox.</p>

        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          Warm regards<br/>
          Luxury Wedding Directory
        </p>
      `,
    };

    // Call Supabase Edge Function to send email
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: emailData,
    });

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error("Error sending couple confirmation email:", error);
    return { success: false, error };
  }
};

/**
 * Send lead notification email to vendor
 * @param {Object} enquiry - Enquiry details
 * @param {string} vendorEmail - Vendor's email address
 * @returns {Promise<{success: boolean, error: null|Object}>}
 */
export const sendVendorLeadNotification = async (enquiry, vendorEmail) => {
  try {
    if (!supabase) {
      console.warn("Supabase not configured for email service");
      return { success: false, error: new Error("Supabase not configured") };
    }

    const emailData = {
      to: vendorEmail,
      subject: `New Wedding Enquiry from ${enquiry.coupleName}`,
      html: `
        <h2>New Lead: ${enquiry.coupleName}</h2>

        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #c9a84c;">
          <h3 style="margin-top: 0;">${enquiry.coupleName}</h3>

          <p><strong>Email:</strong> <a href="mailto:${enquiry.coupleEmail}">${enquiry.coupleEmail}</a></p>
          ${enquiry.couplePhone ? `<p><strong>Phone:</strong> ${enquiry.couplePhone}</p>` : ""}

          <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;" />

          <p><strong>Wedding Date:</strong> ${enquiry.weddingDate || "Not specified"}</p>
          <p><strong>Guest Count:</strong> ${enquiry.guestCount || "Not specified"}</p>
          ${enquiry.budgetRange ? `<p><strong>Budget:</strong> <strong style="color: #c9a84c;">${enquiry.budgetRange}</strong></p>` : ""}

          ${enquiry.message ? `
            <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;" />
            <h4>Their Message:</h4>
            <blockquote style="background: #fff; padding: 12px; border-left: 3px solid #c9a84c; margin: 0;">
              ${enquiry.message}
            </blockquote>
          ` : ""}
        </div>

        <h3 style="color: #c9a84c;">Next Steps</h3>
        <p>Respond quickly to this enquiry to increase your booking chances. View this lead in your dashboard:</p>
        <a href="${process.env.VITE_APP_URL || "https://luxuryweddingdirectory.com"}/vendor/dashboard"
           style="background: #c9a84c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View in Dashboard
        </a>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">
          This is an automated message from Luxury Wedding Directory<br/>
          © 2026 Luxury Wedding Directory. All rights reserved.
        </p>
      `,
    };

    // Call Supabase Edge Function to send email
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: emailData,
    });

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error("Error sending vendor lead notification:", error);
    return { success: false, error };
  }
};

/**
 * Send both emails when enquiry is submitted
 * @param {Object} enquiry - Complete enquiry details
 * @param {string} vendorEmail - Vendor's email
 * @returns {Promise<{coupleEmail: Object, vendorEmail: Object}>}
 */
export const sendEnquiryNotifications = async (enquiry, vendorEmail) => {
  const results = await Promise.all([
    sendCoupleConfirmationEmail(enquiry),
    sendVendorLeadNotification(enquiry, vendorEmail),
  ]);

  return {
    coupleEmail: results[0],
    vendorEmail: results[1],
  };
};
