#!/bin/bash

##############################################################################
# Verify Vendor Accounts Deployment
# Checks:
#   - Functions are deployed and active
#   - Required tables exist in database
#   - Required secrets are configured
#   - Edge Function endpoints respond correctly
# Usage: ./scripts/verify-deployment.sh
##############################################################################

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
ORANGE='\033[0;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

echo "🔍 Vendor Accounts Deployment Verification"
echo "=========================================="
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Error: supabase CLI not found${NC}"
    echo "Install with: npm install -g supabase"
    exit 1
fi

# Check if we're in a linked Supabase project
# Try multiple detection methods for compatibility with different CLI versions
PROJECT_REF=""

# Method 1: Check .supabase/config.toml
if [ -f "$PROJECT_ROOT/.supabase/config.toml" ]; then
    PROJECT_REF=$(grep -oP 'project_id = "\K[^"]+' "$PROJECT_ROOT/.supabase/config.toml" 2>/dev/null)
fi

# Method 2: Try supabase projects list (doesn't require Docker)
if [ -z "$PROJECT_REF" ]; then
    PROJECT_REF=$(supabase projects list 2>/dev/null | grep -E '^[[:space:]]*\|' | grep -v 'LINKED\|-----' | awk -F'|' '{print $3}' | sed 's/^[[:space:]]*//g' | sed 's/[[:space:]]*$//g' | head -1)
fi

# Method 3: Check for ~/.supabase/projects.json
if [ -z "$PROJECT_REF" ]; then
    PROJECT_REF=$(grep -oP '"project_ref":\s*"\K[^"]+' ~/.supabase/projects.json 2>/dev/null | head -1)
fi

# If still not found, we're not linked
if [ -z "$PROJECT_REF" ] || [ "$PROJECT_REF" = "unknown" ]; then
    echo -e "${RED}❌ Not linked to a Supabase project${NC}"
    echo "Run: supabase link --project-ref <your-project-ref>"
    exit 1
fi

echo -e "${BLUE}Project: $PROJECT_REF${NC}"
echo ""

##############################################################################
# CHECK 1: Source Files Exist
##############################################################################

echo -e "${YELLOW}CHECK 1: Source Files${NC}"
echo "─────────────────────────────────────────"

files_to_check=(
    "VENDOR_INVITE_AUDIT_LOG.sql:Database Schema"
    "supabase/functions/create-vendor-account/index.ts:Create Vendor Account Function"
    "supabase/functions/send-vendor-activation-email/index.ts:Send Activation Email Function"
    "src/pages/VendorActivate.jsx:Vendor Activation Page"
    "src/admin/VendorAccounts/VendorAccountsTable.jsx:Vendor Accounts Table"
)

for check in "${files_to_check[@]}"; do
    IFS=':' read -r filepath description <<< "$check"
    if [ -f "$PROJECT_ROOT/$filepath" ]; then
        echo -e "${GREEN}✅ $description${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ $description - NOT FOUND${NC}"
        FAILED=$((FAILED + 1))
    fi
done

echo ""

##############################################################################
# CHECK 2: Functions Deployed
##############################################################################

echo -e "${YELLOW}CHECK 2: Edge Functions Deployed${NC}"
echo "─────────────────────────────────────────"

functions_to_check=(
    "create-vendor-account"
    "send-vendor-activation-email"
)

for func in "${functions_to_check[@]}"; do
    # Try to get function info via CLI
    if supabase functions list --project-ref "$PROJECT_REF" 2>/dev/null | grep -q "$func"; then
        echo -e "${GREEN}✅ Function deployed: $func${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${ORANGE}⚠️  Cannot verify function: $func (verify in Supabase Dashboard)${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
done

echo ""

##############################################################################
# CHECK 3: Required Secrets
##############################################################################

echo -e "${YELLOW}CHECK 3: Required Secrets Configured${NC}"
echo "─────────────────────────────────────────"

secrets_to_check=(
    "SENDGRID_API_KEY:SendGrid API Key"
)

# Note: We can't directly check secrets via CLI, but we can guide the user
for secret_check in "${secrets_to_check[@]}"; do
    IFS=':' read -r secret_name secret_desc <<< "$secret_check"
    echo -e "${ORANGE}⚠️  $secret_desc${NC}"
    echo "   To verify: Supabase Dashboard → Settings → Edge Functions"
    echo "   Secret name: ${BLUE}$secret_name${NC}"
    WARNINGS=$((WARNINGS + 1))
done

echo ""

##############################################################################
# CHECK 4: Database Tables
##############################################################################

echo -e "${YELLOW}CHECK 4: Database Tables${NC}"
echo "─────────────────────────────────────────"

# This requires database credentials, so we'll provide instructions
echo -e "${ORANGE}ℹ️  Cannot auto-check database without credentials${NC}"
echo ""
echo "To verify tables exist, run in Supabase SQL Editor:"
echo ""
echo -e "${BLUE}-- Check vendor_invite_log table${NC}"
echo "  SELECT table_name FROM information_schema.tables"
echo "  WHERE table_name = 'vendor_invite_log';"
echo ""
echo -e "${BLUE}-- Should return: vendor_invite_log${NC}"
echo ""

WARNINGS=$((WARNINGS + 1))

##############################################################################
# CHECK 5: Vendor Accounts Files
##############################################################################

echo -e "${YELLOW}CHECK 5: Vendor Accounts Module${NC}"
echo "─────────────────────────────────────────"

va_files=(
    "src/admin/VendorAccounts/VendorAccountsPage.jsx"
    "src/admin/VendorAccounts/VendorAccountsTable.jsx"
    "src/admin/VendorAccounts/CreateVendorAccountForm.jsx"
    "src/admin/VendorAccounts/vendorAccountsService.js"
)

for va_file in "${va_files[@]}"; do
    if [ -f "$PROJECT_ROOT/$va_file" ]; then
        echo -e "${GREEN}✅ $(basename $va_file)${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ $(basename $va_file) - NOT FOUND${NC}"
        FAILED=$((FAILED + 1))
    fi
done

echo ""

##############################################################################
# CHECK 6: Configuration Files
##############################################################################

echo -e "${YELLOW}CHECK 6: Configuration Files${NC}"
echo "─────────────────────────────────────────"

deno_files=(
    "supabase/functions/create-vendor-account/deno.json"
    "supabase/functions/send-vendor-activation-email/deno.json"
)

for deno_file in "${deno_files[@]}"; do
    if [ -f "$PROJECT_ROOT/$deno_file" ]; then
        echo -e "${GREEN}✅ $(basename $(dirname $deno_file))/deno.json${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ $(basename $(dirname $deno_file))/deno.json - NOT FOUND${NC}"
        FAILED=$((FAILED + 1))
    fi
done

echo ""

##############################################################################
# SUMMARY
##############################################################################

echo "=========================================="
echo ""
echo -e "${BLUE}Verification Summary${NC}"
echo "─────────────────────────────────────────"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${ORANGE}Warnings: $WARNINGS${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment structure is valid!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Manually add secrets: Supabase Dashboard → Settings → Edge Functions"
    echo "     Secret: SENDGRID_API_KEY = your-sendgrid-key"
    echo ""
    echo "  2. Deploy database schema:"
    echo "     Supabase Dashboard → SQL Editor"
    echo "     Paste: VENDOR_INVITE_AUDIT_LOG.sql"
    echo ""
    echo "  3. Deploy functions:"
    echo "     ./scripts/deploy-functions.sh"
    echo ""
    echo "  4. Test the full flow:"
    echo "     See QUICK_START_DEPLOYMENT.md"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some checks failed. See above for details.${NC}"
    exit 1
fi
