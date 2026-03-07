/**
 * Email Service - SendGrid Integration
 * Handles email notifications for inquiries and vendor replies
 * Phase 2.2: Email Notifications
 */

const SENDGRID_API_KEY = import.meta.env.VITE_SENDGRID_API_KEY;
const SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send";

// Email templates
const EMAIL_TEMPLATES = {
  inquiry_notification: {
    subject: "New Wedding Inquiry",
    type: "vendor", // recipient type
  },
  inquiry_received: {
    subject: "Your Inquiry Has Been Sent",
    type: "couple",
  },
  vendor_reply: {
    subject: "Response from Your Wedding Venue",
    type: "couple",
  },
};

/**
 * Build HTML email template for new inquiry notification (to vendor)
 */
const buildInquiryNotificationHTML = (vendorName, coupleData) => {
  const { coupleName, coupleEmail, couplePhone, weddingDate, guestCount, budget, message } = coupleData;
  const weddingDateFormatted = new Date(weddingDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Nunito', Arial, sans-serif; color: #1a1a1a; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #8a6d1b; color: white; padding: 20px; border-radius: 4px 4px 0 0; }
          .header h1 { margin: 0; font-size: 24px; font-family: 'Gilda Display', serif; }
          .content { background-color: #ede5db; padding: 20px; border-radius: 0 0 4px 4px; }
          .detail-row { margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #ddd4c8; }
          .detail-row:last-child { border-bottom: none; }
          .label { font-size: 12px; color: #8a8078; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; }
          .value { font-size: 14px; color: #1a1a1a; }
          .message { background-color: #ffffff; padding: 12px; border-left: 3px solid #8a6d1b; margin: 15px 0; }
          .cta { background-color: #8a6d1b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 3px; display: inline-block; margin-top: 20px; font-weight: 600; }
          .footer { font-size: 12px; color: #8a8078; margin-top: 20px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Wedding Inquiry</h1>
            <p style="margin: 8px 0 0 0;">You have a new inquiry from ${coupleName}</p>
          </div>
          <div class="content">
            <div class="detail-row">
              <div class="label">Couple Name</div>
              <div class="value">${coupleName}</div>
            </div>
            <div class="detail-row">
              <div class="label">Email</div>
              <div class="value"><a href="mailto:${coupleEmail}">${coupleEmail}</a></div>
            </div>
            ${couplePhone ? `
            <div class="detail-row">
              <div class="label">Phone</div>
              <div class="value">${couplePhone}</div>
            </div>
            ` : ""}
            <div class="detail-row">
              <div class="label">Wedding Date</div>
              <div class="value">${weddingDateFormatted}</div>
            </div>
            ${guestCount ? `
            <div class="detail-row">
              <div class="label">Guest Count</div>
              <div class="value">${guestCount} guests</div>
            </div>
            ` : ""}
            ${budget ? `
            <div class="detail-row">
              <div class="label">Budget Range</div>
              <div class="value">${budget}</div>
            </div>
            ` : ""}
            ${message ? `
            <div class="detail-row">
              <div class="label">Message</div>
              <div class="message">${message.replace(/\n/g, "<br>")}</div>
            </div>
            ` : ""}
            <p style="color: #5a5147; font-size: 13px; margin-top: 20px;">
              Please respond to this inquiry through your dashboard to keep all communication organized.
            </p>
          </div>
          <div class="footer">
            <p>© Luxury Wedding Directory</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Build HTML email template for inquiry received confirmation (to couple)
 */
const buildInquiryReceivedHTML = (coupleNames, vendorName) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Nunito', Arial, sans-serif; color: #1a1a1a; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #8a6d1b; color: white; padding: 20px; border-radius: 4px 4px 0 0; }
          .header h1 { margin: 0; font-size: 24px; font-family: 'Gilda Display', serif; }
          .content { background-color: #ede5db; padding: 20px; border-radius: 0 0 4px 4px; }
          .success { background-color: #f0fdf4; border-left: 3px solid #15803d; padding: 12px; margin-bottom: 20px; }
          .success-text { color: #15803d; font-weight: 600; }
          .footer { font-size: 12px; color: #8a8078; margin-top: 20px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Inquiry Sent Successfully</h1>
            <p style="margin: 8px 0 0 0;">Your message to ${vendorName} has been received</p>
          </div>
          <div class="content">
            <div class="success">
              <p class="success-text">✓ Your inquiry has been sent successfully!</p>
            </div>
            <p>Hi ${coupleNames},</p>
            <p>Thank you for your interest in ${vendorName}! We've sent your inquiry and they typically respond within 24-48 hours.</p>
            <p>We'll notify you as soon as they get back to you. In the meantime, feel free to explore other vendors or save your favorites for later.</p>
            <p style="color: #5a5147; font-size: 13px; margin-top: 30px;">
              Best wishes for your special day!<br>
              The Luxury Wedding Directory Team
            </p>
          </div>
          <div class="footer">
            <p>© Luxury Wedding Directory</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Build HTML email template for vendor reply (to couple)
 */
const buildVendorReplyHTML = (coupleNames, vendorName, replyMessage) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Nunito', Arial, sans-serif; color: #1a1a1a; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #8a6d1b; color: white; padding: 20px; border-radius: 4px 4px 0 0; }
          .header h1 { margin: 0; font-size: 24px; font-family: 'Gilda Display', serif; }
          .content { background-color: #ede5db; padding: 20px; border-radius: 0 0 4px 4px; }
          .reply-box { background-color: #ffffff; padding: 15px; border-left: 3px solid #8a6d1b; margin: 20px 0; }
          .footer { font-size: 12px; color: #8a8078; margin-top: 20px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Response from ${vendorName}</h1>
            <p style="margin: 8px 0 0 0;">They've replied to your inquiry!</p>
          </div>
          <div class="content">
            <p>Hi ${coupleNames},</p>
            <p>${vendorName} has responded to your inquiry. Here's their message:</p>
            <div class="reply-box">
              ${replyMessage.replace(/\n/g, "<br>")}
            </div>
            <p>We recommend reviewing their response and reaching out if you have any follow-up questions. You can reply directly through your inquiry dashboard.</p>
            <p style="color: #5a5147; font-size: 13px; margin-top: 30px;">
              Best wishes for your special day!<br>
              The Luxury Wedding Directory Team
            </p>
          </div>
          <div class="footer">
            <p>© Luxury Wedding Directory</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Send email via SendGrid
 * @param {Object} emailConfig - Email configuration
 * @param {string} emailConfig.to - Recipient email
 * @param {string} emailConfig.subject - Email subject
 * @param {string} emailConfig.html - HTML email body
 * @param {string} emailConfig.from - Sender email (defaults to noreply@luxuryweddingdirectory.com)
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
const sendEmail = async (emailConfig) => {
  if (!SENDGRID_API_KEY) {
    console.warn("SendGrid API key not configured. Email not sent.", emailConfig);
    return {
      success: false,
      error: "SendGrid not configured",
    };
  }

  const {
    to,
    subject,
    html,
    from = "noreply@luxuryweddingdirectory.com",
  } = emailConfig;

  try {
    const response = await fetch(SENDGRID_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to }],
          },
        ],
        from: {
          email: from,
        },
        subject: subject,
        content: [
          {
            type: "text/html",
            value: html,
          },
        ],
      }),
    });

    if (response.ok) {
      return { success: true, error: null };
    } else {
      const error = await response.text();
      console.error("SendGrid error:", error);
      return {
        success: false,
        error: `SendGrid error: ${response.statusText}`,
      };
    }
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send inquiry notification to vendor
 * @param {string} vendorEmail - Vendor email address
 * @param {string} vendorName - Vendor name
 * @param {Object} coupleData - Couple information
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const sendInquiryNotificationToVendor = async (
  vendorEmail,
  vendorName,
  coupleData
) => {
  const html = buildInquiryNotificationHTML(vendorName, coupleData);
  return sendEmail({
    to: vendorEmail,
    subject: `New Wedding Inquiry from ${coupleData.coupleName}`,
    html,
  });
};

/**
 * Send inquiry received confirmation to couple
 * @param {string} coupleEmail - Couple email address
 * @param {string} coupleNames - Couple names
 * @param {string} vendorName - Vendor name
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const sendInquiryReceivedToCouple = async (
  coupleEmail,
  coupleNames,
  vendorName
) => {
  const html = buildInquiryReceivedHTML(coupleNames, vendorName);
  return sendEmail({
    to: coupleEmail,
    subject: EMAIL_TEMPLATES.inquiry_received.subject,
    html,
  });
};

/**
 * Send vendor reply to couple
 * @param {string} coupleEmail - Couple email address
 * @param {string} coupleNames - Couple names
 * @param {string} vendorName - Vendor name
 * @param {string} replyMessage - Vendor's reply message
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const sendVendorReplyToCouple = async (
  coupleEmail,
  coupleNames,
  vendorName,
  replyMessage
) => {
  const html = buildVendorReplyHTML(coupleNames, vendorName, replyMessage);
  return sendEmail({
    to: coupleEmail,
    subject: `Response from ${vendorName}`,
    html,
  });
};
