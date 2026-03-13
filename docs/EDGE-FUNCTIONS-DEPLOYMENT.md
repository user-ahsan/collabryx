# Collabryx Edge Functions - Self-Hosted Supabase Deployment Guide

## Prerequisites

- SSH access to your VPS running Supabase
- Docker and Docker Compose installed on VPS
- Self-hosted Supabase running via Docker

---

## Quick Deploy (Copy-Paste Ready)

### 1. SSH into Your Supabase VPS

```bash
ssh your-user@your-vps-ip
# Or via Cloudflare Tunnel if configured
ssh supabase-vps
```

### 2. Clone or Copy Project to VPS

```bash
# Option A: Clone from Git
cd /opt
git clone https://github.com/user-ahsan/collabryx.git
cd collabryx

# Option B: Copy via SCP (from your local machine)
# Run this locally, not on VPS:
scp -r supabase/functions your-user@your-vps-ip:/opt/collabryx/supabase/
```

### 3. Configure Edge Functions Directory

```bash
# Find your Supabase installation directory
# Common locations:
# - /opt/supabase
# - /home/user/supabase
# - /var/lib/supabase

SUPABASE_DIR=/opt/supabase  # Adjust based on your setup
FUNCTIONS_DIR=$SUPABASE_DIR/functions

# Create functions directory
mkdir -p $FUNCTIONS_DIR

# Copy functions
cp -r /opt/collabryx/supabase/functions/* $FUNCTIONS_DIR/

# Verify files are copied
ls -la $FUNCTIONS_DIR/
# Should show:
# - generate-embedding/
# - get-matches/
# - ai-assistant/
# - deno.json
# - tsconfig.json
```

### 4. Set Environment Variables

```bash
# Edit your Supabase .env file
cd $SUPABASE_DIR
nano .env  # or use your preferred editor

# Add these lines:
HF_API_KEY=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
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

### 5. Update Docker Compose (If Needed)

If your `docker-compose.yml` doesn't have edge runtime configured, add it:

```yaml
# Add to docker-compose.yml
services:
  edge_runtime:
    image: supabase/edge-runtime:v1.68.0
    depends_on:
      - kong
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - SUPABASE_URL=http://kong:8000
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - HF_API_KEY=${HF_API_KEY}
    volumes:
      - ./functions:/home/deno/functions
    networks:
      - supabase
    restart: unless-stopped
```

### 6. Restart Edge Runtime

```bash
cd $SUPABASE_DIR
docker compose restart edge_runtime
# Or if using docker-compose (older versions)
docker-compose restart edge_runtime

# Check status
docker compose ps edge_runtime
```

---

## Verify Deployment

### Test Edge Functions

```bash
# Set variables
SUPABASE_URL=https://supabase.ahsanali.cc
ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH

# Test generate-embedding
curl -X POST "$SUPABASE_URL/functions/v1/generate-embedding" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test-user"}'

# Expected response:
# {"success": true, "message": "Embedding generated...", ...}

# Test get-matches
curl -X POST "$SUPABASE_URL/functions/v1/get-matches" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test-user"}'

# Test ai-assistant
curl -X POST "$SUPABASE_URL/functions/v1/ai-assistant" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

### Check Function Logs

```bash
# View edge runtime logs
docker compose logs -f edge_runtime

# Or for specific function requests
docker compose logs edge_runtime | grep "generate-embedding"
```

---

## Troubleshooting

### Edge Runtime Not Starting

```bash
# Check if edge_runtime service exists
docker compose ps | grep edge

# If not running, check docker-compose.yml
cat docker-compose.yml | grep -A 20 edge_runtime

# Restart all services
docker compose down
docker compose up -d
```

### Functions Return 404

```bash
# Verify functions directory is mounted correctly
docker compose exec edge_runtime ls -la /home/deno/functions

# Should show your function directories
# If empty, the volume mount is incorrect
```

### Function Errors

```bash
# Check detailed logs
docker compose logs edge_runtime | tail -100

# Look for:
# - Import errors (missing dependencies)
# - Permission errors (RLS policies)
# - Environment variable errors
```

### CORS Issues

If you get CORS errors, add to your function's OPTIONS handler:

```typescript
if (req.method === "OPTIONS") {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
    },
  });
}
```

---

## Function URLs

Once deployed, your edge functions are available at:

| Function | URL |
|----------|-----|
| generate-embedding | `https://supabase.ahsanali.cc/functions/v1/generate-embedding` |
| get-matches | `https://supabase.ahsanali.cc/functions/v1/get-matches` |
| ai-assistant | `https://supabase.ahsanali.cc/functions/v1/ai-assistant` |

---

## Update Functions

To update functions after changes:

```bash
# On VPS
cd /opt/supabase/functions

# Pull latest changes (if using git)
git pull origin main

# Or copy updated files
scp supabase/functions/generate-embedding/index.ts user@vps:/opt/supabase/functions/generate-embedding/

# Restart edge runtime
docker compose restart edge_runtime
```

---

## Security Notes

1. **Never commit `.env` files** to git
2. **Rotate secrets regularly** - especially `SUPABASE_SERVICE_ROLE_KEY`
3. **Use RLS policies** on all tables accessed by edge functions
4. **Validate all inputs** in edge functions (already implemented)
5. **Monitor function logs** for suspicious activity

---

## Support

If you encounter issues:

1. Check edge runtime logs: `docker compose logs edge_runtime`
2. Verify environment variables: `docker compose exec edge_runtime env | grep -i supabase`
3. Test function locally first: `deno run --allow-all supabase/functions/generate-embedding/index.ts`
4. Check Supabase docs: https://supabase.com/docs/guides/functions
