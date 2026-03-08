#!/bin/bash

##############################################################################
# Run Database Migrations
# Usage: ./scripts/run-migrations.sh
# Prerequisites:
#   - supabase CLI installed and linked to project
##############################################################################

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATIONS_DIR="$PROJECT_ROOT/migrations"
VENDOR_INVITE_LOG="$PROJECT_ROOT/VENDOR_INVITE_AUDIT_LOG.sql"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🗄️  Running Database Migrations"
echo "========================================"
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
    PROJECT_REF=$(supabase projects list 2>/dev/null | head -1 | awk '{print $1}')
fi

# Method 3: Check for ~/.supabase/projects.json
if [ -z "$PROJECT_REF" ]; then
    PROJECT_REF=$(grep -oP '"project_ref":\s*"\K[^"]+' ~/.supabase/projects.json 2>/dev/null | head -1)
fi

# If still not found, we're not linked
if [ -z "$PROJECT_REF" ] || [ "$PROJECT_REF" = "unknown" ]; then
    echo -e "${RED}❌ Not linked to a Supabase project${NC}"
    echo ""
    echo "Run this first:"
    echo "  supabase link --project-ref <your-project-ref>"
    echo ""
    exit 1
fi

echo -e "${BLUE}Project: $PROJECT_REF${NC}"
echo ""

# Function to run a SQL migration
run_migration() {
    local sql_file=$1
    local migration_name=$(basename "$sql_file")

    if [ ! -f "$sql_file" ]; then
        echo -e "${RED}❌ Migration file not found: $sql_file${NC}"
        return 1
    fi

    echo -e "${YELLOW}Applying: $migration_name${NC}"

    # Use psql if available, otherwise use supabase CLI
    if command -v psql &> /dev/null; then
        # Get database connection info from Supabase
        # This requires PGPASSWORD to be set or .pgpass configured
        # For now, we'll use supabase CLI instead
        echo "Using Supabase CLI to apply migration..."
    fi

    # Apply using supabase CLI (requires direct database access)
    # For local development: supabase db push
    # For remote: Use the SQL editor or psql with credentials

    # Since we can't directly execute SQL via CLI easily, provide instructions
    echo -e "${YELLOW}⚠️  Migration requires manual execution or credentials${NC}"
    echo ""
    echo "Option 1: Manual (Easiest) - Supabase SQL Editor"
    echo "  1. Open: Supabase Dashboard → SQL Editor"
    echo "  2. Paste contents of: $sql_file"
    echo "  3. Click: Run"
    echo ""
    echo "Option 2: CLI with psql (if you have database credentials)"
    echo "  psql 'postgresql://...' < $sql_file"
    echo ""
    echo "Option 3: Script this file (requires PGPASSWORD setup)"
    echo ""

    return 0
}

FAILED=0

# Run vendor_invite_log migration
if [ -f "$VENDOR_INVITE_LOG" ]; then
    echo -e "${BLUE}Migration 1/1: Vendor Invite Audit Log${NC}"
    if ! run_migration "$VENDOR_INVITE_LOG"; then
        FAILED=$((FAILED + 1))
    fi
    echo ""
else
    echo -e "${RED}❌ Migration file not found: VENDOR_INVITE_AUDIT_LOG.sql${NC}"
    FAILED=$((FAILED + 1))
fi

echo "========================================"
echo ""
echo "📋 Migration Instructions Provided"
echo ""
echo "The schema has been identified. To apply it:"
echo ""
echo -e "${GREEN}RECOMMENDED: Use Supabase Dashboard${NC}"
echo "  1. Supabase Dashboard → SQL Editor"
echo "  2. Copy contents of: VENDOR_INVITE_AUDIT_LOG.sql"
echo "  3. Paste into SQL Editor and Run"
echo ""
echo "Then verify:"
echo "  ./scripts/verify-deployment.sh"
echo ""
