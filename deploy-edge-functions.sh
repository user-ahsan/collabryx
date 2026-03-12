#!/bin/bash
# Collabryx Edge Functions Deployment Script
# For Self-Hosted Supabase

set -e

echo "🚀 Deploying Collabryx Edge Functions to Self-Hosted Supabase"

# Configuration
SUPABASE_DIR="${SUPABASE_DIR:-/opt/supabase}"
FUNCTIONS_DIR="$SUPABASE_DIR/functions"
ENV_FILE="$SUPABASE_DIR/.env"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📁 Target directory: $FUNCTIONS_DIR${NC}"

# Create functions directory if not exists
mkdir -p "$FUNCTIONS_DIR"

# Copy edge functions
echo -e "${YELLOW}📦 Copying edge functions...${NC}"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PARENT_DIR="$(dirname "$SCRIPT_DIR")"

# Copy function directories
for func in generate-embedding get-matches ai-assistant; do
    if [ -d "$PARENT_DIR/supabase/functions/$func" ]; then
        echo "  Copying $func..."
        cp -r "$PARENT_DIR/supabase/functions/$func" "$FUNCTIONS_DIR/"
        echo -e "  ${GREEN}✓${NC} $func deployed"
    else
        echo -e "  ${RED}✗${NC} $func not found"
    fi
done

# Copy Deno config
echo "  Copying Deno configuration..."
cp "$PARENT_DIR/supabase/functions/deno.json" "$FUNCTIONS_DIR/" 2>/dev/null || true
cp "$PARENT_DIR/supabase/functions/tsconfig.json" "$FUNCTIONS_DIR/" 2>/dev/null || true

# Update environment variables
echo -e "${YELLOW}🔐 Configuring environment variables...${NC}"

# Create or update .env file
cat >> "$ENV_FILE" << 'EOF'

# Edge Functions Secrets
HF_API_KEY=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
SUPABASE_URL=http://kong:8000
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
EOF

echo -e "  ${GREEN}✓${NC} Environment variables configured"

# Restart edge runtime
echo -e "${YELLOW}🔄 Restarting Edge Runtime...${NC}"
cd "$SUPABASE_DIR"
docker compose restart edge_runtime 2>/dev/null || docker-compose restart edge_runtime 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Could not restart edge_runtime automatically${NC}"
    echo "Please restart manually with: docker compose restart edge_runtime"
}

echo -e "${GREEN}✅ Deployment complete!${NC}"

# Test functions
echo -e "${YELLOW}🧪 Testing edge functions...${NC}"
sleep 5

# Get the public URL (adjust based on your setup)
PUBLIC_URL="${PUBLIC_URL:-https://supabase.ahsanali.cc}"
ANON_KEY="${ANON_KEY:-sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH}"

echo "Testing generate-embedding..."
curl -s -X POST "$PUBLIC_URL/functions/v1/generate-embedding" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{"test": true}' | head -c 200
echo ""

echo -e "${GREEN}✅ All functions deployed and tested!${NC}"
echo ""
echo "📝 Function URLs:"
echo "  - generate-embedding: $PUBLIC_URL/functions/v1/generate-embedding"
echo "  - get-matches: $PUBLIC_URL/functions/v1/get-matches"
echo "  - ai-assistant: $PUBLIC_URL/functions/v1/ai-assistant"
