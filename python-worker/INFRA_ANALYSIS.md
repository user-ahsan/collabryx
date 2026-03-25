# Infrastructure Analysis Report

**Agent:** Backend Agent 1  
**Branch:** `agent/backend/1-docker-infra-analysis`  
**Date:** 2026-03-26  
**Focus:** Docker configuration, read-only filesystem, pytest cache issues

---

## Executive Summary

The test failures are caused by **3 primary infrastructure issues**:

1. **Read-only filesystem** - Container runs with `read_only: true` but pytest cache paths aren't mounted as writable tmpfs
2. **Missing pytest cache configuration** - pytest.ini doesn't specify a writable cache directory
3. **Model loading timing** - Model pre-downloaded in Dockerfile but tests may run before model is fully initialized

---

## Issue #1: Read-Only Filesystem (CRITICAL)

### Location
- `docker-compose.yml` line 25: `read_only: true`
- `docker-compose.yml` lines 26-29: tmpfs mounts

### Problem
The container is configured with a read-only root filesystem for security:
```yaml
read_only: true
tmpfs:
  - /tmp:noexec,nosuid,size=256m
  - /app/logs:noexec,nosuid,size=512m
  - /home/appuser/.cache:noexec,nosuid,size=512m
```

However, pytest tries to write cache files to `/app/.pytest_cache/v/cache/` which is NOT in the tmpfs list, causing:
```
[Errno 30] Read-only file system: '/app/pytest-cache-files-*'
PytestCacheWarning: could not create cache path /app/.pytest_cache/v/cache/lastfailed
```

### Solution
Add `/app/.pytest_cache` to tmpfs mounts OR configure pytest to use `/tmp/.pytest_cache`.

---

## Issue #2: Pytest Cache Configuration (MEDIUM)

### Location
- `pytest.ini` lines 1-16

### Problem
The pytest configuration doesn't specify a cache directory:
```ini
[pytest]
testpaths = tests
python_files = test_*.py
# ... no cache_dir setting
```

### Solution
Add `cache_dir = /tmp/.pytest_cache` to pytest.ini to use the writable tmpfs mount.

---

## Issue #3: Model Loading (MEDIUM)

### Location
- `Dockerfile` lines 37-42
- `embedding_generator.py` lines 37-43
- `tests/conftest.py` lines 19-23

### Problem
The model is pre-downloaded during Docker build:
```dockerfile
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
```

But the test fixture creates a new `EmbeddingGenerator()` instance which may:
1. Try to reload the model
2. Fail if the cache path isn't accessible
3. Have timing issues with singleton initialization

### Solution
1. Ensure `HF_HOME` and `TRANSFORMERS_CACHE` point to writable locations
2. Add pytest-asyncio configuration to fix fixture loop scope warning
3. Consider mocking the model in tests for faster execution

---

## Issue #4: Pytest-Asyncio Configuration (LOW)

### Location
- `pytest.ini`
- Error: `PytestDeprecationWarning: The configuration option "asyncio_default_fixture_loop_scope" is unset`

### Problem
Missing pytest-asyncio configuration causes deprecation warnings.

### Solution
Add to pytest.ini:
```ini
asyncio_default_fixture_loop_scope = function
```

---

## Files Requiring Changes

| File | Changes Needed | Priority |
|------|---------------|----------|
| `docker-compose.yml` | Add `/app/.pytest_cache` to tmpfs OR remove for test runs | HIGH |
| `pytest.ini` | Add `cache_dir` and `asyncio_default_fixture_loop_scope` | HIGH |
| `Dockerfile` | Ensure cache dirs are writable before model download | MEDIUM |
| `tests/conftest.py` | Add model mocking option for faster tests | LOW |

---

## Recommended Fix Sequence

1. **Fix pytest.ini** - Add cache_dir pointing to /tmp/.pytest_cache
2. **Fix docker-compose.yml** - Add pytest_cache to tmpfs mounts
3. **Fix pytest-asyncio config** - Add default fixture loop scope
4. **Verify model cache permissions** - Ensure HF_HOME is writable

---

## Test Failure Summary

```
FAILED tests/test_embedding.py::TestEmbeddingGenerator::test_model_loading
FAILED tests/test_embedding.py::TestEmbeddingGenerator::test_embedding_generation
FAILED tests/test_embedding.py::TestEmbeddingGenerator::test_empty_text_validation
FAILED tests/test_embedding.py::TestEmbeddingGenerator::test_short_text_validation
FAILED tests/test_embedding.py::TestEmbeddingGenerator::test_long_text_truncation
FAILED tests/test_embedding.py::TestEmbeddingGenerator::test_retry_logic
FAILED tests/test_embedding.py::TestEmbeddingGenerator::test_model_info
FAILED tests/test_embedding.py::TestConcurrentProcessing::test_concurrent_embedding_generation

Result: 8 failed, 8 passed
```

The 8 passing tests are likely the `construct_semantic_text` tests which don't require the model.
The 8 failing tests all use the `embedding_generator` fixture which requires model loading.

---

## Next Steps for Agent 2

Investigate the application code to understand:
1. How the model is loaded in `EmbeddingGenerator.__init__()`
2. Whether the singleton pattern is working correctly
3. If there are any code-level issues beyond infrastructure
