# Vendor Account Creation & Activation - Full Testing Guide

## Overview

This guide walks through the complete flow for creating a vendor account and testing the entire activation process:
1. Admin creates account via VendorAccountsPage
2. Email is sent with activation link
3. Vendor clicks link and sets password
4. Vendor logs in to dashboard

## Prerequisites

### 1. Environment Setup

Ensure these Supabase secrets are set in your Supabase dashboard (`Settings → Secrets`):

```
SENDGRID_API_KEY = "sg_..."  # SendGrid API key (server-side secret)
SENDGRID_FROM_EMAIL = "noreply@luxuryweddingdirectory.com" # Optional
SITE_URL = "https://site.com" # Or localhost:5175 for local testing
```

**How to add Supabase secrets:**
1. Go to your Supabase project dashboard
2. Click "Settings" → "Secrets"
3. Add SENDGRID_API_KEY and other secrets
4. Secrets are accessible in Edge Functions via `Deno.env.get("SENDGRID_API_KEY")`

### 2. Database Schema

Verify vendors table has these columns:
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key to auth.users)
- `email` (TEXT, unique)
- `name` (TEXT) - vendor/venue name
- `is_activated` (BOOLEAN) - default false
- `activation_token` (TEXT, nullable, unique)
- `activation_token_expires_at` (TIMESTAMP, nullable)
- `created_at` (TIMESTAMP)
- `contact_name` (TEXT, nullable) - optional
- `linked_listing_id` (TEXT, nullable) - optional

### 3. Application Setup

The Vendor Accounts module is already installed:
- `src/admin/VendorAccounts/VendorAccountsPage.jsx` - Admin interface
- `src/admin/VendorAccounts/vendorAccountsService.js` - Service layer
- `supabase/functions/create-vendor-account/index.ts` - Edge Function
- `supabase/functions/send-vendor-activation-email/index.ts` - Email Edge Function

## Test Flow (Step-by-Step)

### Step 1: Navigate to Vendor Accounts Admin

**Expected:**
1. Login to admin panel
2. Sidebar shows "Vendor Accounts" (👤 icon) in Platform section
3. Click "Vendor Accounts" → page loads with empty table

**If fails:**
- Check AdminDashboard.jsx has sidebar link
- Check VendorAccountsPage.jsx imported correctly
- Verify NAV_SECTIONS includes "vendor-accounts"

---

### Step 2: Create Vendor Account

**Action:**
1. Click "+ Create Vendor Account" button
2. Fill form:
   - Vendor Name: "Test Venue XYZ"
   - Email: `test-vendor-UNIQUE@example.com` (must be unique)
   - Listing Link: (optional, leave blank for now)
   - Contact Name: "John Smith" (optional)
3. Click "Create Account"

**Expected:**
1. Form submits
2. Button shows "Creating..."
3. Success message appears: "Account created for Test Venue XYZ. Invitation email sent."
4. Form closes
5. Table refreshes, vendor appears with status "Invited"

**If fails with "error creating account":**
- Check Edge Function URL is correct: `create-vendor-account`
- Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set
- Check Edge Function has been deployed: `supabase functions deploy create-vendor-account`
- Check console logs for error details

**If email doesn't send but account created:**
- SENDGRID_API_KEY might not be set
- Check Edge Function logs for email error
- Account still created, can resend email manually

---

### Step 3: Verify Vendor in Database

**Check Supabase directly:**

```sql
-- Check vendors table
SELECT id, email, name, is_activated, activation_token, activation_token_expires_at
FROM vendors
WHERE email = 'test-vendor-UNIQUE@example.com';

-- Should return:
-- is_activated: false
-- activation_token: [UUID string]
-- activation_token_expires_at: [timestamp 7 days from now]

-- Check auth user was created
SELECT id, email, user_metadata
FROM auth.users
WHERE email = 'test-vendor-UNIQUE@example.com';

-- Should return:
-- user_metadata.vendor_name: "Test Venue XYZ"
```

---

### Step 4: Check Activation Email

**Option A: Real SendGrid Account**
1. Login to SendGrid dashboard
2. Go to "Mail Activity" or check your actual email inbox
3. Look for email to `test-vendor-UNIQUE@example.com`
4. Subject: "Welcome to Luxury Wedding Directory - Set Your Password"

**Option B: Development/Testing**
1. If using test SendGrid account, emails may go to spam
2. Check spam folder or email logs
3. Can also mock email by checking Edge Function logs

**Expected Email Content:**
- Subject: "Welcome to Luxury Wedding Directory - Set Your Password"
- From: "noreply@luxuryweddingdirectory.com"
- HTML template: Professional onboarding email
- Contains: "Set Your Password" button (CTA)
- Activation link: `https://site.com/vendor/activate?token=[ACTIVATION_TOKEN]`
- Note: "Account activation link expires in 7 days"

**If email not received:**
- Check spam folder
- Verify SENDGRID_API_KEY is correct
- Check SendGrid account has email credits
- Verify from email address is verified in SendGrid
- Check Edge Function logs for errors

---

### Step 5: Activate Vendor Account

**Action:**
1. Get the activation link from email (or manually construct it)
   - Format: `https://luxuryweddingdirectory.com/vendor/activate?token=UUID`
   - For local testing: `http://localhost:5175/vendor/activate?token=UUID`
2. Open link in browser or copy-paste into address bar

**Expected:**
1. Page loads: "Set Your Password" form
2. Shows: Vendor name "Test Venue XYZ" and email
3. Has password input field
4. Has "Set Password" button

**If page doesn't load:**
- VendorConfirmEmail component might not exist
- Token might not be in URL correctly
- Check browser console for errors

**Action (continued):**
1. Enter password: `TestPassword123!` (or any secure password)
2. Click "Set Password"

**Expected:**
1. Form submits
2. Loading state appears
3. Success message: "Your password has been set successfully"
4. Redirects to `/vendor/login` after 2-3 seconds
5. Database update:
   - `is_activated` = true
   - `activation_token` = NULL (cleared)

**If activation fails:**
- Check token exists and hasn't expired
- Check vendorAuthService.activateVendor() function works
- Check password meets Supabase requirements
- Check database update succeeds

**Verify in database:**
```sql
SELECT id, email, is_activated, activation_token
FROM vendors
WHERE email = 'test-vendor-UNIQUE@example.com';

-- Should return:
-- is_activated: true
-- activation_token: NULL
```

---

### Step 6: Vendor Login

**Action:**
1. On /vendor/login page (redirected automatically)
2. Enter credentials:
   - Email: `test-vendor-UNIQUE@example.com`
   - Password: `TestPassword123!`
3. Click "Sign In"

**Expected:**
1. Form submits
2. Loading state appears
3. Success: Redirects to `/vendor` (VendorDashboard)
4. Dashboard loads with:
   - Vendor name displayed
   - Metrics loaded
   - Enquiries visible (if any exist)
   - Session created (cookie/localStorage)

**If login fails:**
- Check email and password match
- Check user account exists and is_activated = true
- Check Supabase Auth is configured correctly
- Check loginVendor() function in vendorAuthService
- Check browser console for errors

---

### Step 7: Verify Session Persistence

**Action:**
1. On vendor dashboard
2. Refresh page (F5 or Cmd+R)

**Expected:**
1. Page reloads
2. Vendor still logged in
3. Dashboard data loads without re-login
4. Session persists across page reloads

**If session lost:**
- Check VendorAuthContext initialization
- Check Supabase session handling
- Check getCurrentVendor() function fetches vendor on mount

---

### Step 8: Test Admin Access Mode

**Action (from Admin Dashboard):**
1. Go to Admin → Vendor Accounts
2. Find the created vendor in table
3. Status should be "Activated"
4. Click "Actions" dropdown
5. Click "⟶ Open as Vendor"

**Expected:**
1. Page navigates to `/vendor`
2. Vendor dashboard loads
3. Banner appears at top: "Admin Access Mode | Viewing as: Test Venue XYZ"
4. "← Return to Admin" button visible
5. Dashboard shows vendor data (NOT actual login)

**If doesn't open as vendor:**
- Check Admin Access Mode implementation
- Check sessionStorage is being set correctly
- Check VendorDashboard reads sessionStorage
- Check synchronous admin preview check

**Action (continued):**
1. Click "← Return to Admin" button

**Expected:**
1. Navigates back to `/admin`
2. Vendor Accounts page loads
3. Admin dashboard showing

---

## Testing Checklist

- [ ] Admin can create vendor account via form
- [ ] Activation email is sent
- [ ] Email contains correct activation link
- [ ] Vendor can click link and reach password setup page
- [ ] Vendor can set password
- [ ] Vendor is_activated changes to true
- [ ] Vendor can login with email + password
- [ ] Session persists after page refresh
- [ ] Admin can open vendor via "Open as Vendor" button
- [ ] Admin banner shows correct vendor name
- [ ] Admin can return to admin dashboard

---

## Edge Cases to Test

### 1. Duplicate Email
**Action:** Try creating account with existing email
**Expected:** Error: "Vendor account already exists for [email]"

### 2. Invalid Email
**Action:** Try creating account with invalid email format
**Expected:** Error: "Invalid email format"

### 3. Token Expiry
**Action:** Wait 7 days (or manually set expired token in database)
**Expected:** Activation fails with "Token expired"

### 4. Missing Form Fields
**Action:** Try creating account with empty Vendor Name or Email
**Expected:** Form validation error before submission

### 5. Resend Invitation
**Action:** After creating account, click "Resend Invite" in Actions
**Expected:**
- New activation token generated
- New email sent with new link
- Old token invalidated

### 6. Disable Account
**Action:** Activate vendor, then click "Disable Account" in Actions
**Expected:**
- is_activated = false
- activation_token cleared
- Vendor cannot login anymore

---

## Troubleshooting

### "Supabase not configured"
**Solution:**
- Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local
- Reload browser after env changes

### "Edge Function not found"
**Solution:**
- Verify functions are deployed: `supabase functions list`
- Deploy: `supabase functions deploy create-vendor-account`
- Deploy: `supabase functions deploy send-vendor-activation-email`

### "SENDGRID_API_KEY not configured"
**Solution:**
- Set secret in Supabase dashboard: Settings → Secrets
- Secret value: `sg_...` (your SendGrid API key)
- Redeploy Edge Function after adding secret

### Email not sending
**Solution:**
- Check SendGrid API key is correct
- Verify from email is verified in SendGrid
- Check email address is valid
- Check Edge Function logs for error: `supabase functions logs send-vendor-activation-email`

### "Vendor profile not found"
**Solution:**
- Verify vendor record created in database
- Check user_id matches auth user
- Check email is correct

---

## Local Testing (Localhost)

For testing locally at `http://localhost:5175`:

### 1. Set SITE_URL environment variable
```bash
# In Supabase dashboard → Secrets, set:
SITE_URL = "http://localhost:5175"
```

### 2. Deploy Edge Functions locally
```bash
supabase start  # Start Supabase locally
supabase functions deploy create-vendor-account  # Deploy function
```

### 3. Run development server
```bash
npm run dev  # Start React dev server on localhost:5175
```

### 4. Test full flow
- Navigate to admin
- Create vendor account
- Email will be sent via SendGrid (or your email service)
- Click activation link in email
- Test password setup and login

---

## Production Deployment

### Before Going Live

1. **Verify all Edge Functions are deployed:**
   ```bash
   supabase functions list
   ```

2. **Set production environment variables:**
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - SENDGRID_API_KEY
   - SENDGRID_FROM_EMAIL
   - SITE_URL (production domain)

3. **Test sending email from production domain:**
   - Verify from email is verified in SendGrid
   - Test email delivery to real email address

4. **Enable RLS policies (if implemented):**
   - Restrict vendor access to own records
   - Allow admin to see all

5. **Enable HTTPS:**
   - Activation links must be HTTPS
   - Set SITE_URL to HTTPS production domain

---

## Success Indicators

✅ **Full Flow Working:**
- Admin creates account
- Email sent within seconds
- Vendor receives professional HTML email
- Vendor clicks activation link
- Password set successfully
- Vendor logged in to dashboard
- Session persists across page reloads
- Admin can impersonate vendor via Admin Access Mode

✅ **Database Correct:**
- Auth user created
- Vendor record created with token
- is_activated changed to true after activation
- activation_token cleared after activation
- Email addresses match

✅ **Security:**
- Auth user created server-side (never client-side)
- Passwords NOT in emails
- Activation tokens expire after 7 days
- Admin API key never exposed to browser
- SendGrid key only in Edge Function secrets

---

## Support

For issues or questions:
1. Check Edge Function logs: `supabase functions logs [function-name]`
2. Check browser console for client-side errors
3. Check database directly via Supabase dashboard
4. Verify environment variables are set
5. Check Supabase project is configured correctly
