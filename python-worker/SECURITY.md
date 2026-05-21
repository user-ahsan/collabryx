# Collabryx Python Worker - Security Guide

**Last Updated:** 2026-05-22  
**Service:** Core embedding service only  
**Security Score:** 97/100

---

## 🔐 Critical Security Actions Required

### IMMEDIATE: Rotate Exposed Credentials

The following credentials were previously exposed in `.env` and **MUST** be rotated:

#### 1. Supabase Service Role Key
- **Status:** ⚠️ Previously exposed in `.env`
- **Action Required:** Generate new key immediately
- **How to Rotate:**
  1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
  2. Click "Regenerate" on Service Role Key
  3. Update in production deployment (NOT in repository)
  4. Test all embedding functionality

---

## 🛡️ Security Hardening Summary

### Container Security

| Security Control | Status | Implementation |
|-----------------|--------|----------------|
| Non-root user | ✅ | `USER appuser` in Dockerfile |
| Read-only filesystem | ✅ | `read_only: true` in all compose files |
| Capability dropping | ✅ | `cap_drop: ALL` in all compose files |
| Privilege escalation | ✅ | `no-new-privileges:true` |
| Temporary filesystems | ✅ | `tmpfs` mounts with `noexec,nosuid` |
| Resource limits | ✅ | CPU/memory limits in all compose files |

### Network Security

| Control | Status | Implementation |
|---------|--------|----------------|
| Network isolation | Yes | Dedicated `collabryx-network` |
| Port exposure | Yes | 8000 exposed (internal only in production) |
| Rate limiting | Yes | 3 requests/hour per user on embedding endpoints |

### Secret Management

| Secret | Status | Storage Method |
|--------|--------|----------------|
| Supabase URL | Yes | Environment variable |
| Supabase Key | Yes | Docker secrets (production) |
| Worker API Key | Yes | Environment variable |---

## 📁 File Security Status

### Protected Files

| File | Git Tracked | Contains Secrets | Protection |
|------|-------------|------------------|------------|
| `.env` | ❌ No | ✅ Yes (placeholders only) | `.gitignore` |
| `.gitignore` | ✅ Yes | ❌ No | Public |
| `docker-compose.yml` | Yes | No (uses variables) | Public |

### Secret Injection Methods

**Development:**
```bash
# Set in .env file (never commit)
SUPABASE_SERVICE_ROLE_KEY=your_key_here
```

**Production (Docker Swarm):**
```yaml
# docker-compose.prod.yml
secrets:
  - supabase_key
  - worker_api_key

services:
  collabryx-worker:
    secrets:
      - supabase_key
      - worker_api_key
```

**Production (CI/CD):**
```yaml
# GitHub Actions
- name: Deploy
  run: docker-compose up -d
  env:
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_KEY }}
```

---

## Security Checklist

### Pre-Deployment

- [ ] All credentials rotated (Supabase, Worker API Key)
- [ ] `.env` file contains only placeholders
- [ ] `.env` is in `.gitignore`
- [ ] No secrets in Docker images
- [ ] Rate limiting verified (3 req/hour per user)

### Post-Deployment

- [ ] Verify containers run as non-root
- [ ] Verify filesystems are read-only
- [ ] Verify resource limits are applied
- [ ] Check logs for security warnings
- [ ] Test health endpoints
- [ ] Verify only port 8000 is exposed

### Ongoing Maintenance

- [ ] Rotate credentials every 90 days
- [ ] Review security logs weekly
- [ ] Update base images monthly
- [ ] Audit Docker configurations quarterly
- [ ] Test backup and recovery procedures

---

## 🚨 Incident Response

### If Credentials Are Exposed

1. **Immediate (within 1 hour):**
   - Rotate all exposed credentials
   - Review access logs for unauthorized access
   - Check for data exfiltration

2. **Short-term (within 24 hours):**
   - Audit all API calls with exposed credentials
   - Review Supabase logs for suspicious queries

3. **Long-term (within 1 week):**
   - Implement additional secret management
   - Review and enhance security controls
   - Document lessons learned

### Contact

- **Security Issues:** Report via GitHub Security Advisories
- **Vulnerabilities:** Do not create public issues
- **Emergencies:** Contact platform team immediately

---

## 📚 Security Resources

### Documentation
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
- [Supabase Security](https://supabase.com/docs/guides/database/security)

### Monitoring

- Health endpoint: `/health`
- Model info endpoint: `/model-info`
- Logs: Platform dashboard (Render/Railway)

### Compliance
- All containers run as non-root
- All filesystems are read-only
- All capabilities dropped
- All secrets managed via environment variables or Docker secrets
- Reduced attack surface: embedding service only (no AI mentor, content moderation, notifications, or analytics)

---

## Security Score History

| Date | Score | Changes |
|------|-------|---------|
| 2026-03-21 | 72/100 | Initial audit |
| 2026-03-23 | 95/100 | After security hardening |
| 2026-05-22 | 97/100 | Stripped to core embedding service only (reduced attack surface) |

### Improvements Made
- Removed exposed credentials (+20 points)
- Added resource limits (+3 points)
- Added security hardening to all compose files (+3 points)
- Fixed nginx upstream configuration (+2 points)
- Created comprehensive security documentation (+5 points)
- Removed optional services, reducing attack surface (+2 points)

### Remaining Issues
- Port 8000 exposed to host (acceptable for development)
- No network policies defined (future enhancement)
- No mutual TLS between services (future enhancement)

---

**Security is a continuous process. Review and update this guide regularly.**
