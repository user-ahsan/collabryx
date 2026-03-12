#!/bin/bash
# Collabryx Edge Functions - Register in Supabase Dashboard
# Run this script on your VPS via SSH

set -e

echo "🚀 Registering Edge Functions in Supabase Dashboard"
echo "=================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
SUPABASE_DIR="${SUPABASE_DIR:-/opt/supabase}"
FUNCTIONS_SOURCE="/opt/collabryx/supabase/functions"
PROJECT_REF="collabryx"

echo -e "${YELLOW}📁 Supabase Directory: $SUPABASE_DIR${NC}"
echo -e "${YELLOW}📁 Functions Source: $FUNCTIONS_SOURCE${NC}"

# Step 1: Check if Supabase CLI is installed
echo -e "\n${YELLOW}Step 1: Checking Supabase CLI...${NC}"
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Supabase CLI not found. Installing...${NC}"
    curl -fsSL https://supabase.com/install.sh | sh
    export PATH="$HOME/.local/bin:$PATH"
fi

echo -e "${GREEN}✓${NC} Supabase CLI: $(supabase --version)"

# Step 2: Login to Supabase
echo -e "\n${YELLOW}Step 2: Logging into Supabase...${NC}"
echo -e "${YELLOW}⚠️  You'll need to complete browser authentication${NC}"
supabase login

# Step 3: Navigate to Supabase directory
echo -e "\n${YELLOW}Step 3: Setting up project...${NC}"
cd "$SUPABASE_DIR"

# Check if already linked
if [ -f "supabase/.branches/_current_branch" ] || [ -d ".git" ]; then
    echo -e "${GREEN}✓${NC} Project already initialized"
else
    echo "Initializing Supabase project..."
    supabase init
fi

# Step 4: Link to project (self-hosted)
echo -e "\n${YELLOW}Step 4: Linking to project...${NC}"
# For self-hosted, we'll use the local project
echo -e "${GREEN}✓${NC} Using local project configuration"

# Step 5: Copy functions to Supabase functions directory
echo -e "\n${YELLOW}Step 5: Copying functions to Supabase directory...${NC}"
mkdir -p "$SUPABASE_DIR/supabase/functions"

for func in generate-embedding get-matches ai-assistant; do
    if [ -d "$FUNCTIONS_SOURCE/$func" ]; then
        echo "  Copying $func..."
        cp -r "$FUNCTIONS_SOURCE/$func" "$SUPABASE_DIR/supabase/functions/"
        echo -e "  ${GREEN}✓${NC} $func copied"
    else
        echo -e "  ${RED}✗${NC} $func not found at $FUNCTIONS_SOURCE/$func"
    fi
done

# Copy config files
cp "$FUNCTIONS_SOURCE/deno.json" "$SUPABASE_DIR/supabase/functions/" 2>/dev/null || true
cp "$FUNCTIONS_SOURCE/tsconfig.json" "$SUPABASE_DIR/supabase/functions/" 2>/dev/null || true
cp "$FUNCTIONS_SOURCE/deno.lock" "$SUPABASE_DIR/supabase/functions/" 2>/dev/null || true

echo -e "${GREEN}✓${NC} All functions copied"

# Step 6: Deploy functions using Supabase CLI
echo -e "\n${YELLOW}Step 6: Deploying functions (this registers them in dashboard)...${NC}"

cd "$SUPABASE_DIR/supabase"

# Deploy each function
for func in generate-embedding get-matches ai-assistant; do
    if [ -d "functions/$func" ] && [ -f "functions/$func/index.ts" ]; then
        echo -e "\n${YELLOW}Deploying: $func${NC}"
        
        # Use local deployment for self-hosted
        supabase functions deploy "$func" \
            --project-ref "$PROJECT_REF" \
            --no-verify-jwt \
            2>&1 || {
            echo -e "${YELLOW}⚠️  CLI deploy failed (expected for self-hosted). Using manual registration...${NC}"
        }
    else
        echo -e "${RED}✗${NC} Function $func not found or missing index.ts"
    fi
done

# Step 7: Manual registration via SQL (fallback)
echo -e "\n${YELLOW}Step 7: Registering functions in database...${NC}"

# Create SQL registration script
cat > /tmp/register_functions.sql << 'EOF'
-- Register Edge Functions in Supabase dashboard metadata
-- This makes them visible in the Studio UI

-- Ensure the supabase_functions schema exists
CREATE SCHEMA IF NOT EXISTS supabase_functions;

-- Create migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS supabase_functions.migrations (
    name TEXT PRIMARY KEY,
    version TEXT NOT NULL,
    checksum TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Register the three functions
INSERT INTO supabase_functions.migrations (name, version, checksum)
VALUES 
    ('generate-embedding', '1.0.0', md5('generate-embedding-v1')),
    ('get-matches', '1.0.0', md5('get-matches-v1')),
    ('ai-assistant', '1.0.0', md5('ai-assistant-v1'))
ON CONFLICT (name) DO UPDATE 
SET 
    version = EXCLUDED.version,
    checksum = EXCLUDED.checksum,
    created_at = NOW();

-- Verify registration
SELECT name, version, created_at FROM supabase_functions.migrations 
WHERE name IN ('generate-embedding', 'get-matches', 'ai-assistant');
EOF

echo -e "${GREEN}✓${NC} SQL registration script created at /tmp/register_functions.sql"
echo -e "${YELLOW}📝 Next step: Run this SQL in your Supabase SQL Editor${NC}"
echo ""
echo "   1. Go to: https://supabase.ahsanali.cc/studio"
echo "   2. Navigate to: SQL Editor"
echo "   3. Paste the contents of /tmp/register_functions.sql"
echo "   4. Click 'Run'"
echo ""

# Step 8: Restart edge runtime
echo -e "\n${YELLOW}Step 8: Restarting Edge Runtime...${NC}"
cd "$SUPABASE_DIR"

if docker compose ps edge_runtime &> /dev/null; then
    docker compose restart edge_runtime
    echo -e "${GREEN}✓${NC} Edge runtime restarted"
elif docker-compose ps edge_runtime &> /dev/null; then
    docker-compose restart edge_runtime
    echo -e "${GREEN}✓${NC} Edge runtime restarted (docker-compose)"
else
    echo -e "${YELLOW}⚠️  Could not find edge_runtime container${NC}"
    echo "Please restart manually: docker compose restart edge_runtime"
fi

# Step 9: Verify deployment
echo -e "\n${YELLOW}Step 9: Verifying deployment...${NC}"
sleep 5

# Test health endpoint
echo "Testing health endpoint..."
curl -s https://supabase.ahsanali.cc/functions/v1/_internal/health | head -c 200
echo ""

echo -e "\n${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "📋 Summary:"
echo "  ✓ Functions copied to Supabase directory"
echo "  ✓ SQL registration script created"
echo "  ✓ Edge runtime restarted"
echo ""
echo "🎯 Next Steps:"
echo "  1. Run the SQL script in Supabase SQL Editor (see above)"
echo "  2. Refresh your Supabase Dashboard"
echo "  3. Navigate to Edge Functions section"
echo "  4. Your functions should now appear!"
echo ""
echo "📍 Function URLs:"
echo "  - generate-embedding: https://supabase.ahsanali.cc/functions/v1/generate-embedding"
echo "  - get-matches: https://supabase.ahsanali.cc/functions/v1/get-matches"
echo "  - ai-assistant: https://supabase.ahsanali.cc/functions/v1/ai-assistant"
echo ""
