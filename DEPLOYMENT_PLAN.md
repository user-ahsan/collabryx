# Deployment Plan: Microservice Architecture

> **Goal**: Extract notification, feed scoring, and match generation from inline TypeScript into independent Python FastAPI microservices running in Docker.
> **Pattern**: Follows the exact same `python-worker/` approach — each service gets its own directory, Dockerfile, and runs via the existing `bun run docker:*` commands.
> **Existing anchor**: `python-worker/docker-compose.yml` is the single source of truth — updated in place, never replaced.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      python-worker/docker-compose.yml            │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ embedding-service │  │ notification-svc │  │  feed-service  │ │
│  │ :8000 (unchanged) │  │ :8002            │  │ :8003          │ │
│  │ Python/FastAPI    │  │ Python/FastAPI   │  │ Python/FastAPI │ │
│  │ SentenceTransform │  │ Supabase CRUD    │  │ numpy scoring  │ │
│  └──────────────────┘  └──────────────────┘  └────────────────┘ │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────────────────────────┐ │
│  │  match-service   │  │  shared/ (db.py, middleware, logging) │ │
│  │ :8004            │  │  imported by all services             │ │
│  │ Python/FastAPI   │  └──────────────────────────────────────┘ │
│  │ numpy vectorized │                                            │
│  └──────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘

Web (Next.js) ──HTTP──> each service directly (via clients in lib/worker-client.ts)

Services communicate through Supabase (database as message bus), NOT via HTTP to each other.
```

---

## Phase Map

```
Phase 0: Foundation ──────────────────────────────────────────────
  [00] docker-compose.yml update ──┐
  [01] shared/ Python modules ─────┤  (serial)
  [02] scripts update ─────────────┘

Phase 1: Services ────────────────────────────────────────────────
  [03] notification-service ───┐
  [04] feed-service ───────────┼── (PARALLEL — all 3 at once)
  [05] match-service ──────────┘

            ▼ VERIFICATION GATE 1: all 4 containers healthy ◀──┐
            │                                                   │
Phase 2: Web Integration ──────────────────────────             │
  [06] worker-client.ts + config ────┐                          │
  [07] notification API routes ──────┤  (serial, after Phase 1) │
  [08] feed API routes ──────────────┤                          │
  [09] match API routes ─────────────┘                          │
            │                                                   │
            ▼ VERIFICATION GATE 2: typecheck + lint + API      │
            │   responses correct                                │
            │                                                   │
Phase 3: Verification ───────────────────────────               │
  [10] All services healthy ─────────────────────────────────────┘
  [11] Web integration tests ───────┐  (parallel)
  [12] Python worker tests ─────────┘
            │
            ▼ VERIFICATION GATE 3: all tests pass
            │
Phase 4: Cleanup ─────────────────────────────────
  [13] Delete old TS files + update AGENTS.md
  [14] FINAL GATE: typecheck + lint + full docker cycle
```

---

## Execution Details

### Legend

| Symbol | Meaning |
|--------|---------|
| `→ S` | Serial — must wait for previous task |
| `→ P` | Parallel — can run alongside other P tasks |
| `⛔ GATE` | Verification checkpoint — must pass before proceeding |
| `🔄 LOOP` | Auto-retry loop with escalation |

---

### Phase 0: Foundation (SERIAL — 3 tasks, run one after another)

**⛔ ENTRY GATE**: Project compiles. `bun run typecheck` passes.

---

#### Task 00: Update `python-worker/docker-compose.yml`

| Property | Value |
|----------|-------|
| **Agent** | `CoderAgent` |
| **Execution** | `→ S` (first) |
| **Wave** | `0-foundation` |

**What to do:**
- Open `python-worker/docker-compose.yml`
- Rename existing `collabryx-worker` → `embedding-service` (leaves config unchanged)
- Add 3 new services: `notification-service`, `feed-service`, `match-service`
- Each service gets its own build context (`./{service-name}/`)
- All services share `collabryx-network` bridge network
- Each has healthcheck: `test: ["CMD", "curl", "-f", "http://localhost:8000/health"]`
- Port mapping: `embedding-service=8000:8000`, `notification-service=8002:8000`, `feed-service=8003:8000`, `match-service=8004:8000`

**Verification loop:**
```bash
🔄 docker compose -f python-worker/docker-compose.yml config
# Must succeed — validates YAML syntax
```

**⛔ EXIT GATE**: `docker compose config` validates cleanly. No YAML errors.

---

#### Task 01: Create `shared/` Python modules

| Property | Value |
|----------|-------|
| **Agent** | `CoderAgent` |
| **Execution** | `→ S` (after 00) |
| **Wave** | `0-foundation` |

**What to do:**
Create `python-worker/shared/` with:
- `__init__.py` — empty
- `db.py` — Supabase client factory with `_execute()` async helper (ThreadPoolExecutor pattern copied from current `main.py` lines 175–211)
- `middleware.py` — API key auth middleware + CORS (mirrors current `main.py` lines 488–514)
- `logging_config.py` — Structured JSON logger setup (mirrors current `main.py` lines 126–161)

**Verification loop:**
```bash
🔄 cd python-worker && python -c "from shared.db import create_client; print('OK')"
# Must print OK without errors
```

**⛔ EXIT GATE**: All 3 modules import cleanly in Python. `from shared.{db,middleware,logging_config}` works.

---

#### Task 02: Update all docker scripts + package.json

| Property | Value |
|----------|-------|
| **Agent** | `CoderAgent` |
| **Execution** | `→ S` (after 00) |
| **Wave** | `0-foundation` |

**What to change in each script:**

| Script | Change |
|--------|--------|
| `docker-up.mjs` | Wait for **4** health endpoints (8000, 8002, 8003, 8004). Show table of all services. |
| `docker-down.mjs` | No change needed — stops everything in compose file |
| `docker-rebuild.mjs` | Same steps × 4 services. Show build time per service. |
| `docker-health.mjs` | Check all 4 endpoints. Show status table per service. |
| `docker-status.mjs` | Show all 4 containers (already generic via `docker compose ps`) |
| `docker-logs.mjs` | Already supports `--service` flag. Default = all services. |
| `docker-clean.mjs` | Clean images for all 4 service patterns |
| `docker-inspect.mjs` | Already generic — verifies it shows all 4 |
| `check-docker.mjs` | Check all 4 health endpoints. Report which are up/down. |

**Verification loop:**
```bash
🔄 node scripts/docker-up.mjs
# Must start all 4 containers and report them healthy
```

**⛔ EXIT GATE**: `docker compose ps` shows 4 services all `running (healthy)`. `docker-up.mjs` exits 0.

---

### Phase 1: Service Implementation (PARALLEL — all 3 at once)

**⛔ ENTRY GATE**: Phase 0 complete (compose file valid, shared/ imports work, scripts updated).

---

#### Task 03: Build `notification-service`

| Property | Value |
|----------|-------|
| **Agent** | `CoderAgent` |
| **Execution** | `→ P` (parallel with 04, 05) |
| **Wave** | `1-services` |
| **Source** | `lib/services/notification-engine.ts` (314 lines) |
| **Reference** | `python-worker/embedding-service/` (structure pattern) |

**Directory:**
```
python-worker/notification-service/
├── main.py           # FastAPI app with shared/ imports
├── sender.py         # sendNotification() + sendBulkNotifications()
├── digester.py       # generateDigest()
├── cleaner.py        # cleanupExpiredNotifications()
├── Dockerfile        # Same pattern as embedding-service Dockerfile
└── requirements.txt  # fastapi, uvicorn, supabase, pydantic, httpx
```

**Routes to implement:**

| Route | Source Function | Notes |
|-------|----------------|-------|
| `POST /send` | `sendNotification()` | Validate with Pydantic, check preferences, insert into `notifications`, Realtime broadcast |
| `POST /send-bulk` | `sendBulkNotifications()` | Loop over array calling `/send` logic |
| `POST /digest` | `generateDigest()` | Query unread notifications, group by user+type, insert digest |
| `POST /cleanup` | `cleanupExpiredNotifications()` | Batch delete old notifications |
| `GET /health` | — | Return healthy + Supabase connection status |

**Behavioral mapping (TS → Python):**

```typescript
// TypeScript (current)
const prefColumn = TYPE_TO_PREF[notificationType];
if (!prefColumn) return true;
const { data } = await supabase
  .from("notification_preferences")
  .select(prefColumn)
  .eq("user_id", userId)
  .single();
```

```python
# Python (new)
PREF_COLUMNS = {
    "connect": "push_new_connections",
    "message": "push_messages",
    ...
}
column = PREF_COLUMNS.get(notification_type)
if not column:
    return True
result = supabase.table("notification_preferences")\
    .select(column)\
    .eq("user_id", user_id)\
    .single()\
    .execute()
```

**Verification loop:**
```bash
🔄 # Test inside container
docker compose -f python-worker/docker-compose.yml build notification-service
docker compose -f python-worker/docker-compose.yml up -d notification-service
curl http://localhost:8002/health | jq .status
# Must return "healthy"

🔄 # Test /send endpoint
curl -X POST http://localhost:8002/send \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test-uuid","type":"system","content":"test"}'
# Must return { success: true, notificationId: "..." }
```

**⛔ EXIT GATE**: `GET /health` returns `{"status": "healthy"}`. `POST /send` with valid input returns `200`.

---

#### Task 04: Build `feed-service`

| Property | Value |
|----------|-------|
| **Agent** | `CoderAgent` |
| **Execution** | `→ P` (parallel with 03, 05) |
| **Wave** | `1-services` |
| **Source** | `lib/services/feed-scorer.ts` (344 lines) |

**Directory:**
```
python-worker/feed-service/
├── main.py           # FastAPI app
├── scorer.py         # Thompson Sampling + recency + hybrid score
├── Dockerfile
└── requirements.txt  # fastapi, uvicorn, numpy, supabase, pydantic
```

**Routes to implement:**

| Route | Source Function | Notes |
|-------|----------------|-------|
| `POST /score-by-id` | `scorePostForUser()` | Single post scoring using numpy.random.beta |
| `POST /score-feed` | `scoreFeedForUser()` | Batch scoring |
| `POST /persist` | `persistFeedScores()` | Upsert to feed_scores table |
| `GET /health` | — | Return healthy |

**Key optimization (TS → Python):**

```typescript
// TypeScript (current) — manual LCG, 1000 samples
export function seededThompsonSample(successes: number, failures: number): number {
  const lcg = (s: number) => (s * 1664525 + 1013904223) & 0x7fffffff;
  let state = 42;
  const values: number[] = [];
  const alpha = successes + 1;
  const beta = failures + 1;
  // ... manual loop of 1000 iterations
  return values.reduce((a, b) => a + b, 0) / values.length;
}
```

```python
# Python (new) — numpy, single call, mathematically correct
import numpy as np

def thompson_sample(alpha: float, beta: float) -> float:
    return float(np.random.beta(alpha, beta))
```

**Verification loop:**
```bash
🔄 docker compose -f python-worker/docker-compose.yml build feed-service
docker compose -f python-worker/docker-compose.yml up -d feed-service
curl http://localhost:8003/health | jq .status

🔄 # Test score calculation
curl -X POST http://localhost:8003/score-by-id \
  -H "Content-Type: application/json" \
  -d '{"semantic":0.8,"engagement_successes":5,"engagement_failures":2,"hours_old":4,"is_connected":true,"has_shared_interests":true,"intent_match":false}'
# Must return { score: 0.XX, factors: {...} }
```

**⛔ EXIT GATE**: Score endpoint returns value in `[0, 1]`. Health returns `healthy`.

---

#### Task 05: Build `match-service`

| Property | Value |
|----------|-------|
| **Agent** | `CoderAgent` |
| **Execution** | `→ P` (parallel with 03, 04) |
| **Wave** | `1-services` |
| **Source** | `lib/services/match-generator.ts` (450 lines) + `match-generation.ts` (227 lines) |

**Directory:**
```
python-worker/match-service/
├── main.py           # FastAPI app
├── generator.py      # generateMatchesForUser() + batch
├── Dockerfile
└── requirements.txt  # fastapi, uvicorn, numpy, supabase, pydantic
```

**Routes to implement:**

| Route | Source Function | Notes |
|-------|----------------|-------|
| `POST /generate` | `generateMatchesForUser()` | Fetch embeddings, cosine sim via numpy, Jaccard, persist results |
| `POST /generate-batch` | batch generation | Multiple users at once |
| `GET /health` | — | Return healthy |

**Key optimization (TS → Python):**

```typescript
// TypeScript (current) — 1-by-1 loop over all candidates
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}
// Called in a loop: N candidates × 384 iterations = slow
```

```python
# Python (new) — vectorized, single call for ALL candidates
import numpy as np

def compute_similarities(user_embedding: list, candidate_embeddings: list[list]) -> list[float]:
    user_vec = np.array(user_embedding).reshape(1, -1)   # (1, 384)
    candidates = np.array(candidate_embeddings)            # (N, 384)
    norms = np.linalg.norm(candidates, axis=1, keepdims=True)
    similarities = (candidates @ user_vec.T).flatten() / norms.flatten()
    return similarities.tolist()
```

**Verification loop:**
```bash
🔄 docker compose -f python-worker/docker-compose.yml build match-service
docker compose -f python-worker/docker-compose.yml up -d match-service
curl http://localhost:8004/health | jq .status
```

**⛔ EXIT GATE**: Health returns `healthy`. `POST /generate` with valid user_id returns `200` with suggestions.

---

### 🛑 VERIFICATION GATE 1: All Services Healthy

**Run after Phase 1 completes:**

```bash
🔄 # Verify all 4 containers
docker compose -f python-worker/docker-compose.yml ps
# Must show 4 services: embedding-service, notification-service, feed-service, match-service
# All must show "running (healthy)"

🔄 # Verify all 4 health endpoints
for port in 8000 8002 8003 8004; do
  status=$(curl -s http://localhost:$port/health | python -c "import sys,json; print(json.load(sys.stdin).get('status','unknown'))")
  echo ":$port → $status"
  if [ "$status" != "healthy" ]; then
    echo "❌ FAIL: port $port is $status"
    exit 1
  fi
done
echo "✅ ALL SERVICES HEALTHY"

🔄 # Verify script commands work
bun run docker:status  # Must show 4 containers
bun run docker:health  # Must show 4 green
```

**⛔ If any service is unhealthy → STOP. Do NOT proceed to Phase 2.**

Diagnose with:
```bash
docker compose -f python-worker/docker-compose.yml logs <service-name>
```

Fix the issue, then re-run verification. Maximum 3 retry loops before escalating.

---

### Phase 2: Web Integration (SERIAL — depends on Phase 1)

**⛔ ENTRY GATE**: All 4 microservices healthy. Gate 1 passed.

---

#### Task 06: Extend `worker-client.ts` + config

| Property | Value |
|----------|-------|
| **Agent** | `CoderAgent` |
| **Execution** | `→ S` (after Phase 1) |
| **Wave** | `2-web-integration` |

**What to do:**

Add to `lib/worker-client.ts`:

```typescript
export class NotificationClient {
  constructor(baseUrl?: string) { /* defaults to NOTIFICATION_SERVICE_URL env or localhost:8002 */ }
  async send(input: NotificationInput): Promise<SendNotificationResult> { ... }
  async sendBulk(inputs: NotificationInput[]): Promise<...> { ... }
}

export class FeedClient {
  constructor(baseUrl?: string) { /* defaults to FEED_SERVICE_URL env or localhost:8003 */ }
  async scoreById(params: FeedScorerInput): Promise<ScoredPost> { ... }
  async scoreFeed(posts: Array<...>): Promise<ScoredPost[]> { ... }
}

export class MatchClient {
  constructor(baseUrl?: string) { /* defaults to MATCH_SERVICE_URL env or localhost:8004 */ }
  async generate(userId: string, opts?: GenerateOptions): Promise<...> { ... }
}

export const notificationClient = new NotificationClient();
export const feedClient = new FeedClient();
export const matchClient = new MatchClient();
```

Update `lib/config/backend.ts`:
```typescript
export const SERVICE_URLS = {
  notification: process.env.NOTIFICATION_SERVICE_URL || "http://localhost:8002",
  feed: process.env.FEED_SERVICE_URL || "http://localhost:8003",
  match: process.env.MATCH_SERVICE_URL || "http://localhost:8004",
};
```

Update `.env.example` with the 3 new service URL vars.

**⛔ EXIT GATE**: All 3 client classes compile (`bun run typecheck`). Client instances exportable.

---

#### Tasks 07–09: Update API routes (can run close together)

| Task | Agent | Route Files to Update |
|------|-------|-----------------------|
| 07 | `CoderAgent` | `app/api/notifications/*/route.ts` — switch from `import { sendNotification }` → `notificationClient.send()` |
| 08 | `CoderAgent` | `app/api/feed/*/route.ts` — switch from `import { scorePostForUser }` → `feedClient.scoreById()` |
| 09 | `CoderAgent` | `app/api/matches/generate/route.ts` — switch from `import { generateMatchesForUser }` → `matchClient.generate()` |

**Pattern for each route:**

```typescript
// BEFORE (direct import)
import { sendNotification } from "@/lib/services/notification-engine";
const result = await sendNotification({ userId, type, content });
return Response.json(result);

// AFTER (HTTP call)
import { notificationClient } from "@/lib/worker-client";
const result = await notificationClient.send({ userId, type, content });
return Response.json(result);
```

**⛔ EXIT GATE**: `bun run typecheck` passes (0 errors). `bun run lint` passes (0 new errors).

---

### 🛑 VERIFICATION GATE 2: TypeScript + API Correctness

```bash
🔄 bun run typecheck
# 0 errors — mandatory

🔄 bun run lint
# 0 errors, ~26 existing warnings only

🔄 # Quick API smoke tests (manual or via curl to dev server)
# Start dev server: bun run dev:skip-docker
# Test notification endpoint
# Test feed endpoint
# Test match endpoint
# All must return valid JSON (even if auth prevents real data, must not be 500)
```

**⛔ If typecheck fails → STOP. Fix all TS errors before proceeding.**

---

### Phase 3: Verification (PARALLEL where possible)

**⛔ ENTRY GATE**: TypeScript compiles, API routes respond without 500 errors.

---

#### Task 10: All Services Healthy (re-verify after web changes)

```bash
🔄 bun run docker:up          # Start everything
bun run docker:health         # All 4 green
bun run docker:status          # All 4 running
```

#### Task 11: Web Integration Tests

**Agent**: `TestEngineer`

**Tests**:
1. Notification: Create notification via API → verify it appears in Supabase `notifications` table
2. Feed: Send scoring request → verify returned score is in [0, 1]
3. Match: Send match generation request → verify returned suggestions or appropriate status

#### Task 12: Python Worker Tests

**Agent**: `TestEngineer`

**Tests**:
1. Embedding: `cd python-worker && python -m pytest tests/ -v` (must pass, existing 12 tests)
2. Notification: New tests for `/send`, `/digest`, `/cleanup`
3. Feed: New tests for scoring accuracy, edge cases (all zeros, NaN input)
4. Match: New tests for cosine similarity, Jaccard, full generation flow

---

### 🛑 VERIFICATION GATE 3: All Tests Pass

```bash
🔄 # Python tests
cd python-worker && python -m pytest tests/ -v --cov-fail-under=80
# All 4 service test suites pass, coverage ≥80%

🔄 # TypeScript compilation
bun run typecheck   # 0 errors
bun run lint        # 0 new errors

🔄 # Full docker cycle
bun run docker:up        # starts all 4
bun run docker:health    # all 4 green
bun run docker:down      # stops all cleanly
bun run docker:rebuild   # rebuilds all 4, starts them
bun run docker:health    # all 4 green again
```

**⛔ If any test fails → STOP. Do NOT proceed to cleanup.**

---

### Phase 4: Cleanup

**⛔ ENTRY GATE**: All tests pass. Gate 3 cleared.

---

#### Task 13: Delete old TS files + update AGENTS.md

| Property | Value |
|----------|-------|
| **Agent** | `CoderAgent` |
| **Execution** | `→ S` (final) |

**Delete:**
```
lib/services/notification-engine.ts    → backed up to .tmp/backup/services/
lib/services/feed-scorer.ts            → backed up to .tmp/backup/services/
lib/services/match-generator.ts        → backed up to .tmp/backup/services/
lib/services/match-generation.ts       → backed up to .tmp/backup/services/
```

**Update `lib/services/index.ts`** — remove exports for deleted files.

**Update `AGENTS.md`**:
- Add "Microservices" section with port map table
- Update docker commands section
- Add service architecture diagram

**Rollback plan in AGENTS.md:**
```markdown
## Rollback: Microservice → Inline TypeScript

If a microservice fails in production:
1. `bun run docker:down`
2. Restore from `.tmp/backup/services/`:
   ```bash
   cp .tmp/backup/services/notification-engine.ts lib/services/
   ```
3. Revert API route imports from `worker-client.ts` back to direct imports
4. Verify with `bun run typecheck`
```

---

#### Task 14: FINAL GATE

```
┌─────────────────────────────────────────────────┐
│            FINAL VERIFICATION LOOP               │
│                                                   │
│  1. bun run typecheck         → 0 errors        │
│  2. bun run lint              → 0 new errors    │
│  3. bun run docker:up         → 4/4 healthy     │
│  4. bun run docker:health     → all green       │
│  5. bun run docker:status     → 4 running       │
│  6. bun run docker:down       → clean stop      │
│  7. bun run docker:rebuild    → build + restart  │
│  8. bun run docker:health     → all green again │
│  9. python -m pytest          → all pass        │
│ 10. bun run dev:skip-docker   → starts clean    │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │  ✅ DEPLOYMENT COMPLETE                     │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## Quick Reference: Agent Commands

### For executing tasks:

```bash
# Check what's ready to work on
bash .opencode/skills/task-management/router.sh next microservice-deploy

# Show parallel tasks
bash .opencode/skills/task-management/router.sh parallel microservice-deploy

# Mark task complete
bash .opencode/skills/task-management/router.sh complete microservice-deploy 03 "Built notification-service with /send, /digest, /cleanup endpoints"

# Validate task structure
bash .opencode/skills/task-management/router.sh validate microservice-deploy
```

### For sub-agent delegation:

```javascript
// Deploy a single service (parallel wave)
task(
  subagent_type="CoderAgent",
  description="Build notification-service",
  prompt="Load context from: .tmp/tasks/microservice-deploy/subtask_03.json
          
          Build the notification-service Python microservice.
          
          Source: lib/services/notification-engine.ts (port to Python)
          Pattern: python-worker/embedding-service/ (follow this structure)
          
          Acceptance criteria:
          - POST /send working
          - POST /digest working
          - POST /cleanup working
          - GET /health working
          - Uses shared/ modules for DB, middleware, logging
          - Dockerfile + requirements.txt included"
)

// Verify health
task(
  subagent_type="BuildAgent",
  description="Verify all services healthy",
  prompt="Run verification: check all 4 health endpoints...
          
          Subtask: .tmp/tasks/microservice-deploy/subtask_10.json"
)
```

---

## Service Port Map (Quick Reference)

| Service | Internal Port | External Port | Health Endpoint | Dependencies |
|---------|--------------|---------------|-----------------|--------------|
| embedding-service | 8000 | 8000 | `GET /health` | Supabase, sentence-transformers model |
| notification-service | 8000 | 8002 | `GET /health` | Supabase |
| feed-service | 8000 | 8003 | `GET /health` | Supabase, numpy |
| match-service | 8000 | 8004 | `GET /health` | Supabase, numpy, pgvector |

All services share `collabryx-network` bridge network inside Docker Compose.

---

## Rollback Plan

If anything goes wrong at any stage:

### During Phase 0 (Foundation)
```bash
git checkout -- python-worker/docker-compose.yml scripts/*.mjs
# Reverts all changes cleanly
```

### During Phase 1 (Services)  
```bash
docker compose -f python-worker/docker-compose.yml down -v
rm -rf python-worker/{notification,feed,match}-service/
# Services not deployed yet, no web impact
```

### During Phase 2 (Web Integration)
```bash
git checkout -- lib/worker-client.ts lib/config/backend.ts
git checkout -- app/api/notifications/*/route.ts
git checkout -- app/api/feed/*/route.ts
git checkout -- app/api/matches/*/route.ts
# Web reverts to direct imports, no Docker needed
```

### During Phase 3+ (Post-Deployment)
```bash
# 1. Stop all microservices
bun run docker:down

# 2. Restore old TS files
cp .tmp/backup/services/*.ts lib/services/

# 3. Revert API routes
git checkout -- app/api/notifications/*/route.ts
git checkout -- app/api/feed/*/route.ts
git checkout -- app/api/matches/*/route.ts

# 4. Verify
bun run typecheck
bun run dev:skip-docker  # Should start clean
```
