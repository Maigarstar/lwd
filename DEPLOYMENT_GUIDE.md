# Vendor Accounts Production Deployment Guide

**Commit**: `eb2d8f5c7d4ddbee45463773bc9efda441b81ccc`

---

## STEP 1: Deploy Database Schema

### Create the Audit Log Table in Supabase

1. Go to: **Supabase Dashboard → SQL Editor**
2. Create new query
3. Copy and paste the entire contents of `VENDOR_INVITE_AUDIT_LOG.sql`
4. Click **Run**
5. Verify success: Table `vendor_invite_log` created with 4 indexes

**Expected Output:**
```
CREATE TABLE
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
```

---

## STEP 2: Configure Edge Function Secrets

### Add SendGrid API Key

1. Go to: **Supabase Dashboard → Settings → Edge Functions**
2. Click **Add secret** (or **New secret**)
3. **Name**: `SENDGRID_API_KEY`
4. **Value**: `sg_...` (your SendGrid API key from SendGrid dashboard)
5. Click **Save**

### Verify Supabase Credentials (Already Should Exist)

The following should already be in your Supabase environment but verify they're accessible:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your service role key (find in Settings → API)

---

## STEP 3: Deploy Edge Functions

### Using Supabase CLI

```bash
# From project root: /Users/taiwoadedayo/LDW-01

# Install Supabase CLI if not installed
npm install -g supabase

# Initialize (if not already done)
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy create-vendor-account
supabase functions deploy send-vendor-activation-email
```

### Verify Deployment

1. Go to: **Supabase Dashboard → Functions**
2. You should see:
   - ✅ `create-vendor-account` (status: Active)
   - ✅ `send-vendor-activation-email` (status: Active)
3. Click each to view logs/details

---

## STEP 4: Test the Full Flow

### Test Scenario: Admin Creates Vendor → Vendor Activates → Vendor Logs In

**Prerequisites:**
- ✅ Database schema deployed
- ✅ Secrets configured
- ✅ Edge Functions deployed
- ✅ Admin dashboard accessible
- ✅ Email service working (check SendGrid)

### Test Case 1: Create Vendor Account

**Action**: Admin creates new vendor account via Vendor Accounts page

**Expected Results**:
1. ✅ Form submit succeeds
2. ✅ Edge Function `create-vendor-account` executes
3. ✅ Auth user created in Supabase
4. ✅ Vendor record inserted in `vendors` table
5. ✅ Activation token generated (7-day expiry)
6. ✅ Entry logged in `vendor_invite_log` table
7. ✅ Email sent via SendGrid (check inbox or SendGrid dashboard)
8. ✅ UI shows success message: "Vendor account created successfully"
9. ✅ Table refreshes showing new vendor with status "Invited"

**Check**:
```sql
-- Verify in Supabase SQL Editor
SELECT id, email, is_activated, activation_token_expires_at
FROM vendors
WHERE email = 'test-vendor@example.com'
LIMIT 1;

-- Should show: is_activated = false, activation_token_expires_at = (7 days from now)
```

---

### Test Case 2: Duplicate Prevention

**Action**: Try creating another vendor with same email

**Expected Results**:
1. ✅ Edge Function returns HTTP 409
2. ✅ Admin sees error: `"Vendor account already exists for test-vendor@example.com (status: invited). To create a new account, use a different email address."`
3. ✅ No new auth user created
4. ✅ No new vendor record created

---

### Test Case 3: Rate Limiting

**Action**: Create 10+ vendor accounts in rapid succession (all from same IP)

**Expected Results**:
1. ✅ First 10 succeed
2. ✅ 11th and subsequent requests return HTTP 429
3. ✅ Admin sees error: `"Too many account creation requests. Please wait a moment before trying again."`
4. ✅ Rate limit resets after 60 seconds

---

### Test Case 4: Vendor Activates Account

**Action**: Vendor clicks activation email link and sets password

**Expected Results**:
1. ✅ VendorActivate page loads
2. ✅ Email field pre-filled (read-only)
3. ✅ Vendor enters password and confirms
4. ✅ Activation succeeds
5. ✅ Vendor record updated: `is_activated = true`, `activation_token = NULL`
6. ✅ Password set in Supabase Auth
7. ✅ Redirects to vendor login page

**Check**:
```sql
SELECT id, email, is_activated, activation_token
FROM vendors
WHERE email = 'test-vendor@example.com';

-- Should show: is_activated = true, activation_token = NULL
```

---

### Test Case 5: Vendor Logs In

**Action**: Vendor enters email and password on vendor login page

**Expected Results**:
1. ✅ Supabase authenticates email/password
2. ✅ Session created
3. ✅ Vendor data fetched from `vendors` table
4. ✅ VendorDashboard loads with vendor data
5. ✅ Vendor can see their leads/enquiries

---

### Test Case 6: Activation Link Expiry (Optional)

**Action**: Wait for token to expire OR manually set expiry to past date and try to activate

**Expected Results**:
1. ✅ VendorActivate page shows error: `"This activation link has expired. Please request a new invitation from support@luxuryweddingdirectory.com"`
2. ✅ Form is not shown (only error message + "Go to Login" button)
3. ✅ Vendor cannot set password

**Manual Test** (don't wait 7 days):
```sql
-- In Supabase SQL Editor, set expiry to past:
UPDATE vendors
SET activation_token_expires_at = NOW() - INTERVAL '1 hour'
WHERE email = 'test-vendor@example.com';
```

Then try activation link again - should see expiry message.

---

### Test Case 7: Admin Views Vendor in Table

**Action**: Admin views Vendor Accounts table after creating vendors

**Expected Results**:
1. ✅ Table shows vendors with columns:
   - Vendor Name
   - Email
   - Status (badge: "Invited" in blue)
   - **Activation Status** (NEW): Shows countdown "7 days left" in blue
   - Last Login: "Never"
   - Actions dropdown
2. ✅ Days countdown decreases as time passes
3. ✅ Status changes to orange when < 1 day remains
4. ✅ After activation, shows "✓ Activated" in green

---

### Test Case 8: Check Audit Log

**Action**: Query the audit log table

**Expected Results**:
```sql
SELECT id, vendor_id, email, vendor_name, client_ip, created_at, status
FROM vendor_invite_log
ORDER BY created_at DESC
LIMIT 10;

-- Should show entries for each vendor created
-- Each entry has: vendor_id, email, vendor_name, client_ip, created_at timestamp
```

---

## Troubleshooting

### Issue: Edge Function returns 500 error

**Check**:
1. Go to Supabase Dashboard → Functions → function logs
2. Look for errors like:
   - "SENDGRID_API_KEY not found" → Add secret in settings
   - "vendor_invite_log does not exist" → Run SQL schema
   - Database connection errors → Check SERVICE_ROLE_KEY is valid

### Issue: Email not sent

**Check**:
1. Verify `SENDGRID_API_KEY` is correct (test in SendGrid dashboard)
2. Check SendGrid logs for bounced emails
3. Check spam folder for email
4. Review function logs for email send errors

### Issue: Duplicate prevention not working

**Check**:
1. Verify `.maybeSingle()` query in Edge Function (line 106-110)
2. Ensure database has vendor with same email
3. Check function logs for query errors

### Issue: Rate limiting not working

**Check**:
1. Verify `vendor_invite_log` table exists and has data
2. Check if IP is being captured correctly (line 132-133)
3. Ensure rate limit check queries the table (line 137-144)
4. Check function logs for query errors

---

## Success Criteria

All tests pass when:

✅ Vendor created → Email sent → Audit log entry created
✅ Duplicate email → 409 Conflict (helpful error message)
✅ Rate limit exceeded → 429 Too Many Requests
✅ Vendor activates → Password set, session created
✅ Vendor logs in → Dashboard loads with data
✅ Expired link → User-friendly error message
✅ Admin sees countdown → Activation Status column shows days remaining
✅ Audit log → All invitations tracked

---

## Next Steps After Successful Deployment

1. Monitor for 24 hours (check logs for errors)
2. Test with real vendors if possible
3. Verify email delivery to real email addresses
4. Check edge cases (timezones, daylight savings)
5. Document any issues encountered
6. Decide on next feature

