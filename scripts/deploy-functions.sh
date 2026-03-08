#!/bin/bash

##############################################################################
# Deploy Edge Functions to Supabase
# Usage: ./scripts/deploy-functions.sh
# Prerequisites:
#   - supabase CLI installed (npm install -g supabase)
#   - Linked to Supabase project (supabase link --project-ref <ref>)
#   - SENDGRID_API_KEY secret already added in Supabase dashboard
##############################################################################

set -e  # Exit on error

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FUNCTIONS_DIR="$PROJECT_ROOT/supabase/functions"

echo "🚀 Vendor Accounts Edge Functions Deployment"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
    echo -e "${YELLOW}⚠️  Not linked to a Supabase project${NC}"
    echo ""
    echo "Run this first:"
    echo "  supabase link --project-ref <your-project-ref>"
    echo ""
    exit 1
fi

echo -e "${BLUE}Project: $PROJECT_REF${NC}"
echo ""

# Function to deploy a single function
deploy_function() {
    local func_name=$1
    local func_path="$FUNCTIONS_DIR/$func_name"

    if [ ! -d "$func_path" ]; then
        echo -e "${RED}❌ Function directory not found: $func_path${NC}"
        return 1
    fi

    echo -e "${BLUE}Deploying: $func_name${NC}"

    if supabase functions deploy "$func_name" --project-ref "$PROJECT_REF"; then
        echo -e "${GREEN}✅ $func_name deployed successfully${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}❌ Failed to deploy $func_name${NC}"
        echo ""
        return 1
    fi
}

# Deploy both functions
FAILED=0

echo -e "${YELLOW}Step 1/2: Deploying create-vendor-account${NC}"
if ! deploy_function "create-vendor-account"; then
    FAILED=$((FAILED + 1))
fi

echo -e "${YELLOW}Step 2/2: Deploying send-vendor-activation-email${NC}"
if ! deploy_function "send-vendor-activation-email"; then
    FAILED=$((FAILED + 1))
fi

echo ""
echo "=============================================="

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All functions deployed successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Verify in Supabase Dashboard → Functions"
    echo "  2. Run: ./scripts/verify-deployment.sh"
    exit 0
else
    echo -e "${RED}❌ $FAILED function(s) failed to deploy${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  - Check Supabase project is linked: supabase link"
    echo "  - Verify supabase CLI is up to date: supabase --version"
    echo "  - Check SENDGRID_API_KEY secret is added: Supabase Dashboard → Settings"
    exit 1
fi
