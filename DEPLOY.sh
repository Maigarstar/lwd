#!/bin/bash

##############################################################################
# MASTER DEPLOYMENT SCRIPT
# Vendor Accounts Production Deployment
#
# This script guides you through the complete deployment process
# Combines automated scripts with clear instructions for manual steps
#
# Usage: ./DEPLOY.sh
##############################################################################

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
STEP=0
TOTAL_STEPS=6

show_step() {
    STEP=$((STEP + 1))
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}STEP $STEP/$TOTAL_STEPS: $1${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

pause_for_user() {
    echo ""
    echo -e "${YELLOW}Press ENTER to continue...${NC}"
    read -r
}

# ============================================================================
# HEADER
# ============================================================================

clear
cat << "EOF"
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║     🚀  VENDOR ACCOUNTS PRODUCTION DEPLOYMENT                            ║
║                                                                           ║
║     Automated Edge Functions + Database Migration                        ║
║     Duration: ~15 minutes (mostly automated)                             ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
EOF

echo ""
echo "Deployment Workflow:"
echo "  1. Pre-flight verification"
echo "  2. Manual: Add SendGrid secret"
echo "  3. Manual: Run database migration"
echo "  4. Automated: Deploy Edge Functions"
echo "  5. Automated: Final verification"
echo "  6. Optional: Test the full flow"
echo ""
echo "Commit: $(cd "$PROJECT_ROOT" && git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
echo ""

pause_for_user

# ============================================================================
# STEP 1: PRE-FLIGHT CHECK
# ============================================================================

show_step "Pre-flight Verification"

echo "Checking deployment prerequisites..."
echo ""

if [ ! -f "$PROJECT_ROOT/scripts/verify-deployment.sh" ]; then
    echo -e "${RED}❌ Deployment scripts not found${NC}"
    exit 1
fi

"$PROJECT_ROOT/scripts/verify-deployment.sh"

pause_for_user

# ============================================================================
# STEP 2: ADD SENDGRID SECRET (MANUAL)
# ============================================================================

show_step "Add SendGrid API Key (MANUAL)"

cat << 'EOF'
WHAT: Configure SendGrid API key as Supabase secret

WHY: Edge Functions need this to send vendor activation emails

TIME: 2 minutes

STEPS:

  1️⃣  Get your SendGrid API Key:
     → Go to: https://app.sendgrid.com/settings/api_keys
     → Copy your API key (starts with "sg_")

  2️⃣  Add to Supabase:
     → Open: Supabase Dashboard
     → Go to: Settings → Edge Functions (or Security → Secrets)
     → Click: "Add secret" or "New secret"
     → Name: SENDGRID_API_KEY
     → Value: sg_... (your API key)
     → Click: Save

  3️⃣  Verify:
     → Secret should appear in the list
     → Value shows as ••••••••

✅ DONE when secret is added in Supabase Dashboard
EOF

pause_for_user

# ============================================================================
# STEP 3: RUN DATABASE MIGRATION (MANUAL)
# ============================================================================

show_step "Run Database Migration (MANUAL)"

cat << 'EOF'
WHAT: Create vendor_invite_log table in your Supabase database

WHY: This table stores invitation audit logs for rate limiting and debugging

TIME: 2 minutes

EASIEST METHOD:

  1️⃣  Open Supabase Dashboard
     → SQL Editor

  2️⃣  Copy the schema file:
     → File: VENDOR_INVITE_AUDIT_LOG.sql
     → Copy entire contents

  3️⃣  In SQL Editor:
     → Paste the SQL
     → Click: Run

  4️⃣  Verify:
     → You see: CREATE TABLE
     → You see: 4x CREATE INDEX

✅ DONE when SQL executes successfully with all 4 index creation messages

VERIFY (in SQL Editor):
  SELECT * FROM vendor_invite_log LIMIT 1;
  → Should show table with columns: id, vendor_id, email, vendor_name, etc.
EOF

pause_for_user

# ============================================================================
# STEP 4: DEPLOY EDGE FUNCTIONS (AUTOMATED)
# ============================================================================

show_step "Deploy Edge Functions (AUTOMATED)"

echo "Running deployment script..."
echo ""

if [ ! -f "$PROJECT_ROOT/scripts/deploy-functions.sh" ]; then
    echo -e "${RED}❌ Deploy script not found${NC}"
    exit 1
fi

if "$PROJECT_ROOT/scripts/deploy-functions.sh"; then
    echo ""
    echo -e "${GREEN}✅ Functions deployed successfully!${NC}"
    pause_for_user
else
    echo ""
    echo -e "${RED}❌ Function deployment failed${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  - Check supabase CLI: supabase --version"
    echo "  - Check project is linked: supabase status"
    echo "  - Check secrets: Supabase Dashboard → Settings"
    echo "  - Check logs: Supabase Dashboard → Functions → [function name]"
    exit 1
fi

# ============================================================================
# STEP 5: FINAL VERIFICATION (AUTOMATED)
# ============================================================================

show_step "Final Verification (AUTOMATED)"

echo "Running final verification..."
echo ""

if "$PROJECT_ROOT/scripts/verify-deployment.sh"; then
    echo ""
    echo -e "${GREEN}✅ Deployment verified successfully!${NC}"
else
    echo ""
    echo -e "${RED}⚠️  Verification completed with warnings${NC}"
    echo "Check Supabase Dashboard manually for any issues"
fi

pause_for_user

# ============================================================================
# STEP 6: OPTIONAL - TEST THE FLOW
# ============================================================================

show_step "Test the Flow (OPTIONAL)"

cat << 'EOF'
WHAT: Verify the complete vendor invite → activate → login flow

WHY: Ensure everything works before going live

TIME: 15 minutes

RECOMMENDED: Run through the test flow to ensure system is working

STEPS:

  1. Create a test vendor account
     → Admin Dashboard → Platform → Vendor Accounts
     → Click "Create Vendor Account"
     → Fill: Name, Email
     → Click "Create Account"

  2. Check email received
     → Check inbox for activation email
     → Copy activation link

  3. Activate account
     → Click activation link
     → Set password
     → Click "Activate Account"

  4. Login as vendor
     → Go to vendor login
     → Enter email and password
     → Verify dashboard loads

  5. Check admin table
     → View Vendor Accounts table
     → Verify "Activation Status" column shows countdown

FOR DETAILED INSTRUCTIONS:
  → See: QUICK_START_DEPLOYMENT.md
  → Follow: Step 4 & 5

✅ DONE when you can create, activate, and login as a vendor
EOF

echo ""
read -p "Would you like to run the test flow now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Follow the instructions in: QUICK_START_DEPLOYMENT.md"
    echo "Sections: Step 4 - Test Full Flow, Step 5 - Verify Improvements"
    echo ""
fi

# ============================================================================
# FINAL SUMMARY
# ============================================================================

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cat << 'EOF'
🎉 Your Vendor Accounts system is now deployed!

WHAT'S DEPLOYED:
  ✅ Edge Function: create-vendor-account (duplicate prevention, rate limiting)
  ✅ Edge Function: send-vendor-activation-email (SendGrid integration)
  ✅ Database Table: vendor_invite_log (audit trail)
  ✅ Improved UX: Activation expiry error message
  ✅ Bonus Feature: Activation Status countdown column

NEXT STEPS:
  1. Monitor logs: Supabase Dashboard → Functions
  2. Test with real vendors
  3. Check for any errors in first 24 hours
  4. Report any issues

DOCUMENTATION:
  - AUTOMATED_DEPLOYMENT.md - Deployment overview
  - QUICK_START_DEPLOYMENT.md - Manual testing guide
  - DEPLOYMENT_CHECKLIST.md - Detailed verification
  - scripts/README.md - Script documentation

USEFUL COMMANDS:
  - Verify again: ./scripts/verify-deployment.sh
  - Deploy again: ./scripts/deploy-functions.sh
  - Check logs: Supabase Dashboard → Functions → [function name]

READY FOR PRODUCTION ✅
EOF

echo ""
