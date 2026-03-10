# Vendor Accounts Deployment Scripts

Automated deployment and verification scripts for the Vendor Accounts production-readiness improvements.

---

## 📋 Quick Start

**One-time setup** (manual):
```bash
# Add secret in Supabase Dashboard
# Settings → Edge Functions → Add secret
# Name: SENDGRID_API_KEY
# Value: sg_...
```

**Deploy everything**:
```bash
# 1. Verify pre-deployment
./scripts/verify-deployment.sh

# 2. Run database migration (manual in Supabase SQL Editor)
./scripts/run-migrations.sh

# 3. Deploy Edge Functions
./scripts/deploy-functions.sh

# 4. Verify deployment complete
./scripts/verify-deployment.sh
```

---

## 🛠️ Scripts Overview

### 1. `verify-deployment.sh`

**Purpose**: Check that all required files are in place and ready for deployment

**What it checks**:
- ✅ Source files exist
- ✅ Vendor Accounts module files present
- ✅ Configuration files (deno.json) ready
- ✅ Guides for verifying deployed functions
- ✅ Guides for checking database tables

**Usage**:
```bash
./scripts/verify-deployment.sh
```

**Run this**:
- Before starting deployment (pre-flight check)
- After completing all deployment steps (final verification)

**Output**:
```
✅ Passed: 12
⚠️  Warnings: 3 (manual checks needed)
❌ Failed: 0

Next steps: [Instructions provided]
```

---

### 2. `run-migrations.sh`

**Purpose**: Guide the database migration process

**What it does**:
- Verifies VENDOR_INVITE_AUDIT_LOG.sql exists
- Checks Supabase project is linked
- Provides migration instructions
- Shows manual and CLI options

**Usage**:
```bash
./scripts/run-migrations.sh
```

**Important**:
- Database migrations require credentials
- Script provides two options:
  1. **Recommended**: Supabase Dashboard → SQL Editor (easiest)
  2. **Advanced**: CLI with psql (requires database credentials)

**Manual Step** (Easiest):
```
1. Open: Supabase Dashboard → SQL Editor
2. Paste contents of: VENDOR_INVITE_AUDIT_LOG.sql
3. Click: Run
```

---

### 3. `deploy-functions.sh`

**Purpose**: Deploy Edge Functions to Supabase

**What it does**:
- Checks supabase CLI is installed
- Checks project is linked
- Deploys create-vendor-account function
- Deploys send-vendor-activation-email function
- Reports success/failure for each

**Usage**:
```bash
./scripts/deploy-functions.sh
```

**Prerequisites**:
- supabase CLI installed: `npm install -g supabase`
- Project linked: `supabase link --project-ref <ref>`
- Secrets configured: SENDGRID_API_KEY added in Supabase dashboard

**Output**:
```
🚀 Vendor Accounts Edge Functions Deployment
============================================

Project: abc123def456...

Step 1/2: Deploying create-vendor-account
Deploying: create-vendor-account
✅ create-vendor-account deployed successfully

Step 2/2: Deploying send-vendor-activation-email
Deploying: send-vendor-activation-email
✅ send-vendor-activation-email deployed successfully

============================================
✅ All functions deployed successfully!
```

---

## 🚀 Complete Deployment Workflow

### Step-by-Step

```bash
# Step 1: Pre-flight check
./scripts/verify-deployment.sh

# Step 2: Add secret (MANUAL - One time only)
# Supabase Dashboard → Settings → Edge Functions
# Add: SENDGRID_API_KEY = sg_...

# Step 3: Run database migration (MANUAL - One time only)
./scripts/run-migrations.sh
# Follow the instructions to apply SQL in Supabase Dashboard

# Step 4: Deploy functions (AUTOMATED)
./scripts/deploy-functions.sh

# Step 5: Final verification
./scripts/verify-deployment.sh
```

**Total Time**: ~10-15 minutes
**Manual Steps**: 2 (secrets + SQL)
**Automated Steps**: 3

---

## 🔧 Prerequisites

### Required

1. **Node.js & npm** (for supabase CLI)
   ```bash
   node --version  # should be v16+
   npm --version   # should be v8+
   ```

2. **Supabase CLI**
   ```bash
   npm install -g supabase
   supabase --version  # should be v1.x+
   ```

3. **Supabase Project**
   - Create at: https://supabase.com
   - Get project reference from: Settings → General

4. **Link to Project**
   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>
   ```

### Optional

- **psql** (PostgreSQL client) - for alternative migration approach
  ```bash
  # macOS
  brew install libpq
  brew link libpq --force

  # Ubuntu
  sudo apt-get install postgresql-client
  ```

---

## 📊 Verification Steps

After running all scripts, manually verify in Supabase Dashboard:

### Check 1: Functions Deployed
```
Supabase Dashboard → Functions
- create-vendor-account (Status: Active)
- send-vendor-activation-email (Status: Active)
```

### Check 2: Database Table
```sql
-- In Supabase Dashboard → SQL Editor
SELECT table_name FROM information_schema.tables
WHERE table_name = 'vendor_invite_log';

-- Should return: vendor_invite_log
```

### Check 3: Table Indexes
```sql
-- Should show 4 indexes:
-- - idx_vendor_invite_log_vendor_id
-- - idx_vendor_invite_log_email
-- - idx_vendor_invite_log_created_at
-- - idx_vendor_invite_log_client_ip

SELECT indexname FROM pg_indexes
WHERE tablename = 'vendor_invite_log';
```

### Check 4: Secrets Configured
```
Supabase Dashboard → Settings → Edge Functions
- SENDGRID_API_KEY (should be visible as "••••••••")
```

---

## 🐛 Troubleshooting

### Error: "supabase CLI not found"
```bash
npm install -g supabase
```

### Error: "Not linked to a Supabase project"
```bash
supabase link --project-ref <your-project-ref>
```

### Error: "Function deployment failed"
1. Check Supabase Dashboard → Functions → [function-name] for logs
2. Verify SENDGRID_API_KEY secret is added
3. Check deno.json dependencies are valid
4. Try again with: `supabase functions deploy <function-name> --debug`

### Error: "Database migration failed"
1. Check SQL syntax in VENDOR_INVITE_AUDIT_LOG.sql
2. Verify you ran it in Supabase SQL Editor (not via CLI)
3. Check for duplicate table (run: `DROP TABLE IF EXISTS vendor_invite_log;` first)

### Error: "Table doesn't exist" when testing
1. Verify SQL migration completed: `SELECT * FROM vendor_invite_log;`
2. Check Supabase SQL Editor for error messages
3. Re-run migration if needed

---

## 📝 Environment Variables

Scripts use these environment variables (set automatically):

- `SUPABASE_URL` - From project settings
- `SUPABASE_SERVICE_ROLE_KEY` - From project settings
- `SENDGRID_API_KEY` - Added as secret (not in .env)

---

## 🔄 Re-running Scripts

Safe to run multiple times:

- `verify-deployment.sh` - Can run anytime (read-only)
- `run-migrations.sh` - Safe if migration already applied (idempotent)
- `deploy-functions.sh` - Safe to re-run (updates existing functions)

---

## 📖 Additional Resources

- **Supabase Docs**: https://supabase.com/docs
- **Edge Functions**: https://supabase.com/docs/guides/functions
- **CLI Reference**: https://supabase.com/docs/reference/cli/introduction
- **SendGrid Setup**: See QUICK_START_DEPLOYMENT.md

---

## ✅ Success Indicators

Scripts complete successfully when:

```
✅ verify-deployment.sh shows: "Deployment structure is valid!"
✅ run-migrations.sh shows: "Migration instructions provided"
✅ deploy-functions.sh shows: "All functions deployed successfully!"
✅ Supabase Dashboard shows both functions as Active
✅ Database has vendor_invite_log table with 4 indexes
```

---

## 🆘 Getting Help

If scripts fail, report:

1. **Exact error message** from script output
2. **Your Supabase project reference**
3. **Output from**: `supabase --version`
4. **Output from**: `node --version` && `npm --version`
5. **Error logs from**: Supabase Dashboard → Functions

---

## 📌 Notes

- Scripts are **read-only** except for deploying functions
- No data is modified by verification scripts
- Safe to run in CI/CD pipelines
- All scripts check for prerequisites before running
- Scripts are idempotent (safe to run multiple times)

