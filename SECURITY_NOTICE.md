# 🔴 SECURITY NOTICE - TOKEN LEAK

## Incident Summary

A GitHub Personal Access Token was accidentally committed to the repository.

**Commit:** `e6d871b76ce4741f3dd9930b9a065b556f836118`  
**Detection:** GitHub Secret Scanning (GH013)

## Required Actions

### 🔴 CRITICAL - IMMEDIATE

**ROTATE THE LEAKED TOKEN**

1. Go to https://github.com/settings/tokens
2. Find and revoke the compromised token
3. Generate new token with same permissions
4. Update any services using this token

### ✅ COMPLETED

- [x] File containing token removed
- [x] Security notice created
- [x] GitHub blocked public exposure

## Timeline

- **Leak Date:** March 15, 2026
- **Discovery:** March 16, 2026
- **Status:** Contained (not public)

## Impact

- Token was in repository history for < 24 hours
- GitHub push protection blocked exposure
- Token MUST be rotated as precaution

## Prevention

- Never commit `.env*` files
- Use `.gitignore` for sensitive files
- Enable GitHub secret scanning
- Use environment variables for secrets

---

**Status:** ⚠️ TOKEN ROTATION REQUIRED  
**Severity:** HIGH  
**Date:** March 16, 2026
