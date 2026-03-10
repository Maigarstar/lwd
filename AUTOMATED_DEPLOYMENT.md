# Automated Deployment Workflow

**Commit**: `eb2d8f5c7d4ddbee45463773bc9efda441b81ccc`

Deploy Vendor Accounts system with **automated scripts** + **minimal manual steps**.

---

## ⚡ Quick Summary

| Step | Action | Type | Time |
|------|--------|------|------|
| 1 | Pre-flight check | Automated Script | 1 min |
| 2 | Add SendGrid secret | Manual (one-time) | 2 min |
| 3 | Run database migration | Manual (one-time) | 2 min |
| 4 | Deploy Edge Functions | Automated Script | 3 min |
| 5 | Final verification | Automated Script | 1 min |
| **Total** | | **Mostly Automated** | **~10 min** |

---

## 🚀 Execution Plan

### Prerequisites (Do Once)

```bash
# Install supabase CLI
npm install -g supabase

# Link to your Supabase project
cd /Users/taiwoadedayo/LDW-01
supabase login
supabase link --project-ref <your-project-ref>
```

---

## 📋 Step 1: Pre-flight Check

**What**: Verify all source files are in place

```bash
./scripts/verify-deployment.sh
```

**Expected Output**:
```
✅ Passed: 12
⚠️  Warnings: 3 (manual steps needed)
❌ Failed: 0

✅ Deployment structure is valid!
```

**What to do next**:
- If any failures: Fix missing files before proceeding
- If all passed: Continue to Step 2

---

## 🔑 Step 2: Add Secrets (MANUAL - One Time Only)

**What**: Configure SendGrid API key in Supabase

**Duration**: 2 minutes

**Action 1: Get your SendGrid API key**
1. Go to: https://app.sendgrid.com/settings/api_keys
2. Create API key or copy existing one
3. Copy the key (starts with `sg_`)

**Action 2: Add to Supabase**
1. Open: Supabase Dashboard
2. Go to: **Settings → Edge Functions** (or Security → Secrets)
3. Click: **"Add secret"** or **"New secret"**
4. Fill in:
   - **Name**: `SENDGRID_API_KEY`
   - **Value**: `sg_...` (your API key)
5. Click: **Save**

**Verify**:
- Secret appears in the list (value shows as `••••••••`)

**✅ Secret configured**

---

## 🗄️ Step 3: Run Database Migration (MANUAL - One Time Only)

**What**: Create vendor_invite_log table in database

**Duration**: 2 minutes

**Option A: Supabase Dashboard (Easiest)** ← Recommended

1. Open Supabase Dashboard
2. Go to: **SQL Editor** (or **SQL**)
3. Create new query
4. Open file: `/Users/taiwoadedayo/LDW-01/VENDOR_INVITE_AUDIT_LOG.sql`
5. Copy entire contents
6. Paste into Supabase SQL Editor
7. Click: **Run**

**Expected Output**:
```
Query executed successfully
CREATE TABLE
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
```

**Option B: Script Guidance** (if you have CLI access)

```bash
./scripts/run-migrations.sh
```

This script provides instructions for applying the migration.

**Verify Migration**:
```sql
-- In Supabase SQL Editor:
SELECT * FROM vendor_invite_log LIMIT 1;
-- Should show table with columns: id, vendor_id, email, vendor_name, etc.
```

**✅ Database migrated**

---

## ⚡ Step 4: Deploy Edge Functions (AUTOMATED)

**What**: Deploy create-vendor-account and send-vendor-activation-email functions

**Duration**: 3 minutes

**Command**:
```bash
./scripts/deploy-functions.sh
```

**What the script does**:
1. Checks supabase CLI is installed
2. Checks project is linked
3. Deploys create-vendor-account function
4. Deploys send-vendor-activation-email function
5. Reports success for each

**Expected Output**:
```
🚀 Vendor Accounts Edge Functions Deployment
============================================

Project: abc123def456...

Step 1/2: Deploying create-vendor-account
✅ create-vendor-account deployed successfully

Step 2/2: Deploying send-vendor-activation-email
✅ send-vendor-activation-email deployed successfully

✅ All functions deployed successfully!

Next steps:
1. Verify in Supabase Dashboard → Functions
2. Run: ./scripts/verify-deployment.sh
```

**Troubleshooting**:
- If error "Function deployment failed"
  - Check Supabase Dashboard → Functions → [function-name] logs
  - Verify SENDGRID_API_KEY secret was added
  - Try: `supabase functions deploy <function-name> --debug`

**✅ Functions deployed**

---

## ✅ Step 5: Final Verification

**What**: Verify everything is deployed and working

**Duration**: 1 minute

**Command**:
```bash
./scripts/verify-deployment.sh
```

**What the script checks**:
- All source files present ✅
- Configuration files ready ✅
- Functions deployed status
- Guides for verifying tables and secrets

**Expected Output**:
```
✅ Passed: 12
⚠️  Warnings: 3 (secrets verified manually above)
❌ Failed: 0

✅ Deployment structure is valid!

Next steps:
1. Manually add secrets: [Already done in Step 2] ✅
2. Deploy database schema: [Already done in Step 3] ✅
3. Deploy functions: [Just completed in Step 4] ✅
4. Test the full flow: See QUICK_START_DEPLOYMENT.md
```

**✅ Deployment verified**

---

## 🧪 Step 6: Test the Flow (Optional)

**What**: Verify the vendor invite → activate → login flow works end-to-end

**Duration**: 10-15 minutes

**Follow**: `QUICK_START_DEPLOYMENT.md` → Step 4: Test Full Flow

This tests:
- Admin creating vendor accounts
- Duplicate prevention (409 error)
- Activation link working
- Vendor password setup
- Vendor login
- Activation Status column countdown
- Audit logging

---

## 📊 Deployment Checklist

```
PRE-FLIGHT:
  ☐ supabase CLI installed
  ☐ Project linked: supabase link --project-ref <ref>

STEP 1: Pre-flight check
  ☐ ./scripts/verify-deployment.sh (PASS)

STEP 2: Manual - Add Secret
  ☐ SendGrid API key obtained
  ☐ Secret added: SENDGRID_API_KEY
  ☐ Verified in Supabase Dashboard

STEP 3: Manual - Database Migration
  ☐ SQL copied from VENDOR_INVITE_AUDIT_LOG.sql
  ☐ Pasted in Supabase SQL Editor
  ☐ Executed successfully (4 CREATE INDEX messages)
  ☐ Verified table exists: SELECT * FROM vendor_invite_log;

STEP 4: Deploy Functions
  ☐ ./scripts/deploy-functions.sh (SUCCESS)
  ☐ Both functions appear as "Active" in Dashboard

STEP 5: Final Verification
  ☐ ./scripts/verify-deployment.sh (PASS)

OPTIONAL - Test Flow:
  ☐ Admin creates vendor account
  ☐ Email received with activation link
  ☐ Vendor activates and sets password
  ☐ Vendor can login and see dashboard
  ☐ Duplicate prevention works (409 error)
  ☐ Activation Status column shows countdown

DEPLOYMENT COMPLETE ✅
```

---

## 🔄 Redeployment / Updates

If you need to redeploy or update:

**Update Edge Functions Only**:
```bash
./scripts/deploy-functions.sh
```

**Update Database Schema**:
```
No changes to schema in this release.
If future migrations needed:
1. Create new .sql file
2. Run in Supabase SQL Editor
```

**Full Redeployment**:
```bash
# Steps 2-5 (skip Step 1, secrets already added)
# Follow the same process
```

---

## 🎯 Success Criteria

Deployment is **complete** when:

✅ All script steps execute without errors
✅ Supabase Dashboard shows both functions as Active
✅ Database has vendor_invite_log table (verified via SQL)
✅ vendor_invite_log has 4 indexes
✅ SENDGRID_API_KEY secret configured
✅ (Optional) Full flow test succeeds

---

## 📞 Getting Help

If any script fails, report:

1. **Exact error from script output**
2. **Step where it failed**
3. **Output from**: `supabase --version`
4. **Check**: Supabase Dashboard → Functions → [function-name] → Logs

Example:
```
FAILED at: Step 4 (Deploy Functions)
Error: "Function deployment failed"
supabase version: 1.89.0
Dashboard logs: "SENDGRID_API_KEY not configured"
```

---

## 📁 Files Referenced

- `./scripts/verify-deployment.sh` - Pre-flight check
- `./scripts/run-migrations.sh` - Migration guidance
- `./scripts/deploy-functions.sh` - Deploy functions
- `./VENDOR_INVITE_AUDIT_LOG.sql` - Database schema
- `./QUICK_START_DEPLOYMENT.md` - Manual testing guide

---

## ⏱️ Timeline Estimate

| Task | Duration | Type |
|------|----------|------|
| Install prerequisites | 5 min | One-time |
| Step 1: Pre-flight | 1 min | Automated |
| Step 2: Add secret | 2 min | Manual |
| Step 3: Database | 2 min | Manual |
| Step 4: Deploy | 3 min | Automated |
| Step 5: Verify | 1 min | Automated |
| **Step 6: Test** (optional) | 15 min | Manual |
| **TOTAL** | **27 min** | Mixed |

---

## 🎉 You're Done!

After completing all steps:

1. System is **deployed to production**
2. All **improvements active** (duplicate prevention, rate limiting, audit logging, etc.)
3. Ready for **live vendor testing**
4. Can **monitor via logs** in Supabase Dashboard

**Next**: Decide on next feature to build!

