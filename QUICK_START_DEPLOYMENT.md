# Quick Start: Deployment & Testing (5 Steps, ~20 minutes)

**Commit**: `eb2d8f5c7d4ddbee45463773bc9efda441b81ccc`

---

## ⏱️ STEP 1: Deploy Database (2 min)

**Action**: Run SQL schema in Supabase

1. Open: **Supabase Dashboard → SQL Editor**
2. **Paste this entire SQL block**:

```sql
-- Vendor Invite Audit Log Table
CREATE TABLE IF NOT EXISTS vendor_invite_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  invited_by_admin_id UUID,
  client_ip TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'invited',
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_vendor_invite_log_vendor_id
ON vendor_invite_log(vendor_id);

CREATE INDEX IF NOT EXISTS idx_vendor_invite_log_email
ON vendor_invite_log(email);

CREATE INDEX IF NOT EXISTS idx_vendor_invite_log_created_at
ON vendor_invite_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vendor_invite_log_client_ip
ON vendor_invite_log(client_ip, created_at DESC);
```

3. Click **Run**
4. **Verify**: You see "CREATE TABLE" and 4 "CREATE INDEX" success messages

---

## ⏱️ STEP 2: Add SendGrid Secret (2 min)

**Action**: Configure Edge Function secret

1. Open: **Supabase Dashboard → Settings → Edge Functions** (or Security → Secrets)
2. Click: **"Add secret"** or **"New secret"**
3. Fill in:
   - **Name**: `SENDGRID_API_KEY`
   - **Value**: `sg_...` (your SendGrid API key)
4. Click: **Save**

---

## ⏱️ STEP 3: Deploy Edge Functions (3 min)

**Action**: Run CLI commands to deploy

```bash
# From your project root
cd /Users/taiwoadedayo/LDW-01

# Make sure you're logged in and linked
supabase link --project-ref <your-project-id>

# Deploy both functions
supabase functions deploy create-vendor-account
supabase functions deploy send-vendor-activation-email
```

**Verify**:
- Open: Supabase Dashboard → Functions
- See both functions listed as "Active"

---

## ⏱️ STEP 4: Test Full Flow (10 min)

### 4A. Create Vendor Account

1. Go to: **Admin Dashboard → Vendor Accounts**
2. Click: **"Create Vendor Account"**
3. Fill:
   - Name: `Test Vendor 001`
   - Email: `test-vendor-001@example.com`
4. Click: **"Create Account"**

**Expected**: Success message + vendor appears in table with status "Invited"

### 4B. Check Email & Activation

1. Check email inbox for message from noreply@luxuryweddingdirectory.com
2. Copy activation link from email
3. Click link → You're at activation page
4. Set password: `TestPassword123!`
5. Confirm password: `TestPassword123!`
6. Click: **"Activate Account"**

**Expected**: Success + redirects to login

### 4C. Login as Vendor

1. Go to: **Vendor Login**
2. Enter:
   - Email: `test-vendor-001@example.com`
   - Password: `TestPassword123!`
3. Click: **"Sign In"**

**Expected**: Logged in → Dashboard loads

---

## ⏱️ STEP 5: Verify Improvements (3 min)

### Check 1: Duplicate Prevention
1. Try creating another vendor with same email: `test-vendor-001@example.com`
2. Should see error: `"Vendor account already exists... (status: invited)"`

### Check 2: Activation Status Column
1. Go to: **Vendor Accounts table**
2. Look for **"Activation Status"** column (new)
3. For "Invited" vendors: Shows `"⏱ 7 days left"` in blue
4. For "Activated" vendors: Shows `"✓ Activated"` in green

### Check 3: Audit Log
```sql
-- In Supabase SQL Editor:
SELECT email, vendor_name, client_ip, created_at
FROM vendor_invite_log
ORDER BY created_at DESC
LIMIT 5;

-- Should show entries for vendors you created
```

### Check 4: Expired Link Message
```sql
-- In Supabase SQL Editor, expire the token:
UPDATE vendors
SET activation_token_expires_at = NOW() - INTERVAL '1 hour'
WHERE email = 'test-vendor-001@example.com';
```

Then try activation link again → Should see helpful error message:
`"This activation link has expired. Please request a new invitation from support@luxuryweddingdirectory.com"`

---

## ✅ SUCCESS CRITERIA

All of these work:

- [x] Database schema created
- [x] Vendor can be created from admin
- [x] Email sent with activation link
- [x] Vendor can activate account
- [x] Vendor can login
- [x] Duplicate email prevented (409 error)
- [x] Activation Status column visible with countdown
- [x] Expired link shows helpful message
- [x] Audit log entries created

---

## ❌ TROUBLESHOOTING QUICK FIXES

**Error: "vendor_invite_log does not exist"**
→ Run the SQL in Step 1 again

**Error: "SENDGRID_API_KEY not configured"**
→ Add the secret in Step 2, verify in Supabase dashboard

**Email not received**
→ Check spam folder, verify SendGrid API key is correct

**Activation fails**
→ Check Supabase functions logs for errors

**"Cannot find activation page"**
→ Verify VendorActivate.jsx exists in `/src/pages/`

---

## 📋 REPORT FORMAT

When you've completed all 5 steps, report:

```
✅ Step 1: Database deployed
✅ Step 2: SendGrid secret added
✅ Step 3: Edge Functions deployed
✅ Step 4: Full flow tested
  - ✅ Vendor created
  - ✅ Email received
  - ✅ Activation successful
  - ✅ Login successful
✅ Step 5: Improvements verified
  - ✅ Duplicate prevention works
  - ✅ Activation Status column visible
  - ✅ Audit log populated
  - ✅ Expired link message correct

READY FOR PRODUCTION ✅
```

Or if errors:

```
❌ Step 3: Edge Functions deployment failed
   Error: [Copy exact error message]
   Function logs: [Copy from Supabase]

Waiting for: [What you need to fix]
```

---

## Next: After Successful Deployment

1. Monitor for 24 hours
2. Test with real vendors
3. Check for any errors in logs
4. Report back and we'll decide next feature

---

**Time Estimate**: 15-20 minutes total
**Complexity**: Medium (mostly copy-paste)
**Support**: Ready to help troubleshoot any errors!

