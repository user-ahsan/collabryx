# 🚀 Quick Fix Guide - Python Worker Errors

**Problem:** Python worker showing database errors  
**Solution:** Run migration script (5 minutes)

---

## ⚡ One-Page Fix

### Step 1: Open Supabase (1 min)
1. Go to: https://supabase.ahsanali.cc
2. Click: **SQL Editor** (left sidebar)

### Step 2: Run Migration (2 min)
1. Open file: `supabase/setup/100-embedding-infrastructure-migration.sql`
2. Copy all content (Ctrl+A, Ctrl+C)
3. Paste into SQL Editor
4. Click **Run**

**Expected Output:**
```
✅ Migration Status: SUCCESS - All tables created
✅ Function Check: Functions created
```

### Step 3: Verify (1 min)
Run in your terminal:
```bash
cd python-worker
python verify_infrastructure.py
```

**Expected Output:**
```
✅ embedding_dead_letter_queue (rows: 0)
✅ embedding_rate_limits (rows: 0)
✅ embedding_pending_queue (rows: 0)
✅ check_embedding_rate_limit (Rate limiting)
✅ All required functions exist
🎉 Infrastructure is ready!
```

### Step 4: Restart Worker (1 min)
```bash
docker-compose restart
docker-compose logs -f
```

**Look for:**
```
✅ Supabase client initialized successfully
✅ Embedding service starting up...
```

**No more errors:**
- ❌ Could not find the table 'public.embedding_dead_letter_queue'
- ❌ Could not find the function public.check_embedding_rate_limit

### Step 5: Test (1 min)
```bash
curl http://localhost:8000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "supabase_connected": true
}
```

---

## ✅ Done!

Your Python worker should now work correctly.

**Full Documentation:** `docs/python-worker/DEPLOYMENT-FIX.md`  
**Verification Script:** `python-worker/verify_infrastructure.py`  
**Summary:** `FIXES-APPLIED.md`

---

## 🆘 Issues?

**Migration failed?** → Safe to re-run (idempotent)  
**Still seeing errors?** → Check `docker-compose logs -f`  
**Need rollback?** → See rollback section in DEPLOYMENT-FIX.md

---

**Time:** 5 minutes  
**Risk:** Low (migration is safe to re-run)  
**Status:** Ready to deploy
