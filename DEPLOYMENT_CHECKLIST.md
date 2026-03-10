# Vendor Accounts Deployment Checklist

**Commit**: `eb2d8f5c7d4ddbee45463773bc9efda441b81ccc`

---

## PRE-DEPLOYMENT VERIFICATION

Before you deploy, verify these files exist in your project:

- [ ] `VENDOR_INVITE_AUDIT_LOG.sql` - Database schema
- [ ] `supabase/functions/create-vendor-account/index.ts` - Edge Function
- [ ] `supabase/functions/create-vendor-account/deno.json` - Dependencies
- [ ] `supabase/functions/send-vendor-activation-email/index.ts` - Email function
- [ ] `supabase/functions/send-vendor-activation-email/deno.json` - Dependencies
- [ ] `src/pages/VendorActivate.jsx` - Activation page with improved error message
- [ ] `src/admin/VendorAccounts/VendorAccountsTable.jsx` - Table with Activation Status column
- [ ] `src/admin/VendorAccounts/` (full directory with 4 files)

**If any missing**: Run `git checkout eb2d8f5 -- <filepath>`

---

## DEPLOYMENT PHASE

### Step 1: Deploy Database Schema

**Time**: ~2 minutes

- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Paste entire contents of `VENDOR_INVITE_AUDIT_LOG.sql`
- [ ] Execute query
- [ ] Verify: See "CREATE TABLE" and 4 "CREATE INDEX" messages
- [ ] Verify: Table `vendor_invite_log` appears in sidebar

**SQL to Run**:
```
-- Copy from: VENDOR_INVITE_AUDIT_LOG.sql
-- Paste in: Supabase Dashboard → SQL Editor
-- Click: Run
```

**Result**: ✅ or ❌ with error details

---

### Step 2: Configure Secrets

**Time**: ~5 minutes

#### Secret 1: SendGrid API Key

- [ ] Go to Supabase Dashboard → Settings → Edge Functions
- [ ] Click "Add secret" (or "New secret")
- [ ] **Name**: `SENDGRID_API_KEY`
- [ ] **Value**: Your SendGrid API key (starts with `sg_`)
- [ ] Click "Save"

**Verify**:
```bash
# In terminal, check Supabase secrets are accessible:
supabase secrets list
# Should show: SENDGRID_API_KEY
```

**Result**: ✅ or ❌ with error details

---

### Step 3: Deploy Edge Functions

**Time**: ~5 minutes

```bash
# From project root
cd /Users/taiwoadedayo/LDW-01

# Login to Supabase (if not already)
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>

# Deploy both functions
supabase functions deploy create-vendor-account
supabase functions deploy send-vendor-activation-email
```

**Expected Output**:
```
✓ Created /Users/taiwoadedayo/LDW-01/.supabase/functions/create-vendor-account
✓ Created /Users/taiwoadedayo/LDW-01/.supabase/functions/send-vendor-activation-email
✓ Functions deployed successfully
```

**Verify in Dashboard**:
- [ ] Go to Supabase Dashboard → Functions
- [ ] See both functions listed as "Active"
- [ ] Click each to view recent invocations

**Result**: ✅ or ❌ with error details

---

## TESTING PHASE

### Test 1: Create Vendor Account (Happy Path)

**Time**: ~3 minutes

**Test Email**: `test-vendor-001@example.com`
**Test Name**: `Test Vendor 001`

**Steps**:
1. [ ] Navigate to Admin Dashboard → Platform → Vendor Accounts
2. [ ] Click "Create Vendor Account" button
3. [ ] Fill form:
   - Vendor Name: `Test Vendor 001`
   - Email: `test-vendor-001@example.com`
4. [ ] Click "Create Account"

**Expected Results**:
- [ ] Form shows success: "Vendor account created successfully"
- [ ] Table refreshes showing new vendor
- [ ] Status shows "Invited"
- [ ] No errors in browser console
- [ ] No errors in Supabase function logs

**Verify in Database**:
```sql
SELECT id, email, is_activated, activation_token, activation_token_expires_at
FROM vendors
WHERE email = 'test-vendor-001@example.com';

-- Should show:
-- is_activated: false
-- activation_token: (UUID value)
-- activation_token_expires_at: (date ~7 days from now)
```

**Verify Email Sent**:
- [ ] Check inbox for email from noreply@luxuryweddingdirectory.com
- [ ] Email subject: "Welcome to Luxury Wedding Directory - Set Your Password"
- [ ] Email contains activation link with token parameter

**Check Audit Log**:
```sql
SELECT id, vendor_id, email, vendor_name, client_ip, created_at
FROM vendor_invite_log
WHERE email = 'test-vendor-001@example.com'
LIMIT 1;

-- Should show entry with client_ip captured
```

**Result**: ✅ or ❌ with error details

---

### Test 2: Duplicate Prevention

**Time**: ~2 minutes

**Steps**:
1. [ ] Try creating another vendor with same email: `test-vendor-001@example.com`
2. [ ] Observe error message

**Expected Results**:
- [ ] Error message: `"Vendor account already exists for test-vendor-001@example.com (status: invited). To create a new account, use a different email address."`
- [ ] Form does not submit
- [ ] No new vendor created

**Check Function Logs**:
- [ ] Supabase → Functions → create-vendor-account → Logs
- [ ] Should see HTTP 409 response

**Result**: ✅ or ❌ with error details

---

### Test 3: Vendor Activation

**Time**: ~3 minutes

**Steps**:
1. [ ] Copy activation link from email (or construct: `https://yoursite.com/vendor/activate?token=<token>`)
2. [ ] Navigate to activation link
3. [ ] Fill form:
   - Password: `TestPassword123!`
   - Confirm: `TestPassword123!`
4. [ ] Click "Activate Account"

**Expected Results**:
- [ ] Page shows success (or redirects to login)
- [ ] No errors shown
- [ ] No errors in console
- [ ] No errors in function logs

**Verify in Database**:
```sql
SELECT id, email, is_activated, activation_token
FROM vendors
WHERE email = 'test-vendor-001@example.com';

-- Should show:
-- is_activated: true
-- activation_token: NULL (cleared)
```

**Result**: ✅ or ❌ with error details

---

### Test 4: Vendor Login

**Time**: ~2 minutes

**Steps**:
1. [ ] Navigate to vendor login page: `/vendor/login`
2. [ ] Enter credentials:
   - Email: `test-vendor-001@example.com`
   - Password: `TestPassword123!`
3. [ ] Click "Sign In"

**Expected Results**:
- [ ] Successful login
- [ ] Redirect to `/vendor` (VendorDashboard)
- [ ] Dashboard loads with vendor data
- [ ] No authentication errors

**Verify**:
- [ ] Dashboard displays vendor information
- [ ] Can access vendor features (leads, settings, etc.)

**Check Session**:
```javascript
// In browser console:
console.log(localStorage.getItem('supabase-auth-token'));
// Should show auth token
```

**Result**: ✅ or ❌ with error details

---

### Test 5: Expired Activation Link

**Time**: ~5 minutes

**Setup**:
```sql
-- In Supabase SQL Editor:
UPDATE vendors
SET activation_token_expires_at = NOW() - INTERVAL '1 hour'
WHERE email = 'test-vendor-001@example.com';
```

**Steps**:
1. [ ] Try to use activation link again
2. [ ] Should see error message

**Expected Results**:
- [ ] Error message: `"This activation link has expired. Please request a new invitation from support@luxuryweddingdirectory.com"`
- [ ] Form is NOT shown
- [ ] Only error message + "Go to Login" button

**Result**: ✅ or ❌ with error details

---

### Test 6: Admin Views Activation Status Column

**Time**: ~2 minutes

**Steps**:
1. [ ] Navigate to Admin Dashboard → Platform → Vendor Accounts
2. [ ] Look for "Activation Status" column (new column added)
3. [ ] For "Invited" vendors, should see countdown like "⏱ 7 days left"
4. [ ] For "Activated" vendors, should see "✓ Activated"

**Expected Results**:
- [ ] Column visible between "Status" and "Last Login"
- [ ] Shows appropriate status with color coding:
  - Blue: "7 days left", "6 days left", etc.
  - Orange: "Expires today"
  - Red: "Expired"
  - Green: "✓ Activated"
- [ ] Countdown decreases as time passes

**Result**: ✅ or ❌ with error details

---

### Test 7: Rate Limiting (Optional, for advanced testing)

**Time**: ~5 minutes

**Steps**:
1. [ ] Rapidly create 10+ vendors from same browser
2. [ ] Use emails like: `test-rate-1@test.com`, `test-rate-2@test.com`, etc.
3. [ ] Try 11th vendor creation

**Expected Results for 11th+ attempts**:
- [ ] Error message: `"Too many account creation requests. Please wait a moment before trying again."`
- [ ] HTTP 429 status
- [ ] No vendor created
- [ ] Limit resets after 60 seconds

**Wait 60 seconds and retry**:
- [ ] Should succeed again

**Result**: ✅ or ❌ with error details

---

## FINAL VERIFICATION

Once all tests pass:

- [ ] Database schema created ✅
- [ ] Secrets configured ✅
- [ ] Edge Functions deployed ✅
- [ ] Create vendor succeeds ✅
- [ ] Duplicate prevention works ✅
- [ ] Vendor can activate ✅
- [ ] Vendor can login ✅
- [ ] Expired link shows proper message ✅
- [ ] Admin sees Activation Status column ✅
- [ ] Audit log entries created ✅

**System Status**: 🟢 **PRODUCTION READY**

---

## ERROR REPORTING TEMPLATE

If you encounter any errors, please report exactly:

```
TEST CASE: [Name of test]
STEP: [Which step failed]
ERROR MESSAGE: [Exact error text]
FUNCTION LOGS: [Copy error from Supabase function logs if applicable]
DATABASE RESULT: [Paste SQL query results]
BROWSER CONSOLE: [Any JavaScript errors]
TIMESTAMP: [When it occurred]
ADDITIONAL NOTES: [Any other relevant info]
```

Example:
```
TEST CASE: Create Vendor Account
STEP: Form submission
ERROR MESSAGE: "Error: vendor_invite_log does not exist"
FUNCTION LOGS: "relation 'public.vendor_invite_log' does not exist"
TIMESTAMP: 2026-03-08 17:55:00 UTC
ADDITIONAL NOTES: Database schema wasn't run successfully
```

---

## Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Edge Functions**: https://supabase.com/docs/guides/functions
- **SendGrid Integration**: https://supabase.com/docs/guides/platform/sendgrid

