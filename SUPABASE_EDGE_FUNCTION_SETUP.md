# Supabase Edge Function Setup - Email Service

## Overview
The email notification system uses Supabase Edge Functions to send confirmation emails to couples and lead notifications to vendors.

## Prerequisites
1. Supabase project with Edge Functions enabled
2. Email service API (SendGrid, Resend, or similar)
3. Supabase CLI installed locally

## Setup Steps

### 1. Create Edge Function

```bash
supabase functions new send-email
```

### 2. Implementation (use SendGrid example)

Edit `supabase/functions/send-email/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const SENDGRID_FROM_EMAIL = Deno.env.get("SENDGRID_FROM_EMAIL") || "noreply@luxuryweddingdirectory.com";

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  try {
    const { to, subject, html }: EmailRequest = await req.json();

    // Validate inputs
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, html" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Send via SendGrid
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to }],
            subject,
          },
        ],
        from: {
          email: SENDGRID_FROM_EMAIL,
          name: "Luxury Wedding Directory",
        },
        content: [
          {
            type: "text/html",
            value: html,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SendGrid error: ${error}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email sent" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
```

### 3. Add Environment Variables

In Supabase Dashboard:
1. Go to Project Settings → Edge Functions
2. Add secrets:
   - `SENDGRID_API_KEY` - Your SendGrid API key
   - `SENDGRID_FROM_EMAIL` - Sender email (e.g., noreply@luxuryweddingdirectory.com)

### 4. Deploy Function

```bash
supabase functions deploy send-email
```

### 5. Test Function

```bash
supabase functions invoke send-email --body '{
  "to": "test@example.com",
  "subject": "Test Email",
  "html": "<h1>Hello</h1>"
}'
```

## Integration with VendorContactForm

After enquiry submission in VendorContactForm, call:

```javascript
import { sendEnquiryNotifications } from "../../services/emailService";

// After successful saveInquiry()
await sendEnquiryNotifications({
  coupleName: form.name,
  coupleEmail: form.email,
  couplePhone: form.phone || null,
  vendorName: vendor.name,
  weddingDate: form.date,
  guestCount: form.guests,
  budgetRange: form.budget,
  message: form.message,
}, vendor.email);
```

## Alternative Email Services

### Resend
```typescript
const response = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from: "noreply@luxuryweddingdirectory.com",
    to,
    subject,
    html,
  }),
});
```

### Mailgun
```typescript
const response = await fetch(
  `https://api.mailgun.net/v3/${Deno.env.get("MAILGUN_DOMAIN")}/messages`,
  {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`api:${Deno.env.get("MAILGUN_API_KEY")}`)}`,
    },
    body: new URLSearchParams({
      from: "noreply@luxuryweddingdirectory.com",
      to,
      subject,
      html,
    }),
  }
);
```

## Troubleshooting

1. **"Supabase not configured"** - Ensure `.env.local` has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
2. **"Function not found"** - Run `supabase functions deploy send-email`
3. **Email not sending** - Check SendGrid API key and sender email is verified
4. **CORS errors** - Ensure Edge Function handles OPTIONS requests

## Testing Emails Locally

During development, you can mock email sending:

```javascript
// In emailService.js, for development:
if (import.meta.env.DEV) {
  console.log("DEV MODE: Would send email to", emailData.to);
  return { success: true, error: null };
}
```

## Email Templates

The HTML templates include:
- Dynamic couple/vendor names
- Wedding details (date, guests, budget)
- Professional branding
- Call-to-action buttons
- Mobile-friendly styling

See `emailService.js` for complete templates.
