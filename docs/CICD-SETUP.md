# CI/CD Configuration - Phase 2

**Last Updated:** 2026-03-20  
**Version:** 1.0.0

---

## GitHub Actions Workflows

### Main CI Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  PYTHON_VERSION: '3.11'

jobs:
  test:
    name: Test Suite
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run type check
        run: npm run typecheck
      
      - name: Run linter
        run: npm run lint
      
      - name: Run tests
        run: npm run test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          fail_ci_if_error: false

  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: .next/

  security-scan:
    name: Security Scanning
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run npm audit
        run: npm audit --audit-level=moderate
        continue-on-error: true
      
      - name: Run SAST with CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: javascript-typescript
      
      - name: Perform CodeQL analysis
        uses: github/codeql-action/analyze@v3
      
      - name: Run dependency check
        run: npx depcheck --ignores="@types/*,eslint,*vitest*"
        continue-on-error: true

  performance-test:
    name: Performance Regression Tests
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'pull_request'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          urls: |
            http://localhost:3000/
            http://localhost:3000/login
            http://localhost:3000/dashboard
          uploadArtifacts: true
          temporaryPublicStorage: true
      
      - name: Comment PR with results
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('./.lighthouseci/results.json', 'utf8'));
            
            const performance = results[0].summary.performance;
            const accessibility = results[0].summary.accessibility;
            const bestPractices = results[0].summary['best-practices'];
            const seo = results[0].summary.seo;
            
            const comment = `
            ## Lighthouse Performance Results
            
            | Category | Score |
            |----------|-------|
            | Performance | ${performance} |
            | Accessibility | ${accessibility} |
            | Best Practices | ${bestPractices} |
            | SEO | ${seo} |
            
            ${performance < 90 ? '⚠️ Performance below threshold (90)' : '✅ Performance OK'}
            `;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [test, build, security-scan]
    if: github.ref == 'refs/heads/develop'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel (Staging)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--env staging'
      
      - name: Deploy Python Worker (Staging)
        run: |
          # Railway deployment via CLI
          npm install -g @railway/cli
          railway login --token ${{ secrets.RAILWAY_TOKEN }}
          cd python-worker
          railway up --environment staging

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [test, build, security-scan, performance-test]
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel (Production)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
      
      - name: Deploy Python Worker (Production)
        run: |
          npm install -g @railway/cli
          railway login --token ${{ secrets.RAILWAY_TOKEN }}
          cd python-worker
          railway up --environment production
      
      - name: Run smoke tests
        run: |
          curl -f https://collabryx.com/api/health
          curl -f https://worker.railway.app/health
      
      - name: Notify success
        uses: slackapi/slack-github-action@v1.24.0
        with:
          payload: |
            {
              "text": "✅ Production deployment successful!",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Production Deployment Successful*\nCommit: ${{ github.sha }}\nDeployed by: ${{ github.actor }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Security Scanning Workflow

```yaml
# .github/workflows/security.yml
name: Security Scanning

on:
  schedule:
    - cron: '0 2 * * 1'  # Every Monday at 2 AM
  workflow_dispatch:

jobs:
  dependency-audit:
    name: Dependency Audit
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run npm audit
        run: npm audit --json > audit-results.json
        continue-on-error: true
      
      - name: Upload audit results
        uses: actions/upload-artifact@v4
        with:
          name: audit-results
          path: audit-results.json

  secret-scan:
    name: Secret Scanning
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITLEAKS_LICENSE: ${{ secrets.GITLEAKS_LICENSE }}

  container-scan:
    name: Container Security Scan
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Docker image
        run: |
          cd python-worker
          docker-compose build
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'collabryx-worker:latest'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'
```

### Performance Regression Workflow

```yaml
# .github/workflows/performance.yml
name: Performance Regression Tests

on:
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM

jobs:
  lighthouse:
    name: Lighthouse Performance
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Start server
        run: npm run start &
        env:
          NODE_ENV: production
      
      - name: Wait for server
        run: sleep 10
      
      - name: Run Lighthouse
        uses: treosh/lighthouse-ci-action@v10
        with:
          urls: |
            http://localhost:3000/
            http://localhost:3000/login
            http://localhost:3000/dashboard
          uploadArtifacts: true
          temporaryPublicStorage: true
      
      - name: Fail if performance below threshold
        run: |
          if [ $(cat .lighthouseci/results.json | jq '.[0].summary.performance') -lt 90 ]; then
            echo "Performance score below 90!"
            exit 1
          fi

  bundle-analysis:
    name: Bundle Size Analysis
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build with bundle analyzer
        run: npm run build -- --stats
      
      - name: Upload bundle stats
        uses: actions/upload-artifact@v4
        with:
          name: bundle-stats
          path: .next/build-manifest.json
```

---

## Environment Configuration

### Staging Environment

```bash
# Vercel Staging Variables
NEXT_PUBLIC_SUPABASE_URL=https://staging.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=staging-anon-key
SUPABASE_SERVICE_ROLE_KEY=staging-service-key
PYTHON_WORKER_URL=https://worker-staging.railway.app
NEXT_PUBLIC_APP_URL=https://staging.collabryx.com
NODE_ENV=staging
```

### Production Environment

```bash
# Vercel Production Variables
NEXT_PUBLIC_SUPABASE_URL=https://prod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=prod-service-key
PYTHON_WORKER_URL=https://worker.railway.app
NEXT_PUBLIC_APP_URL=https://collabryx.com
NODE_ENV=production
```

---

## Monitoring & Alerts

### Vercel Alerts
- Error rate > 5% → PagerDuty
- Build failures → Slack #dev-alerts
- Deployment failures → Slack #dev-alerts

### Railway Alerts
- Health check failures → PagerDuty
- CPU > 80% → Slack #dev-alerts
- Memory > 90% → Slack #dev-alerts

### Supabase Alerts
- Database CPU > 80% → PagerDuty
- Connection pool exhausted → PagerDuty
- Storage > 80% → Slack #dev-alerts

---

## Rollback Procedures

### Frontend Rollback
```bash
# Vercel CLI rollback
vercel rollback <deployment-url>

# Or via dashboard:
# 1. Go to vercel.com/dashboard
# 2. Select project
# 3. Click deployment
# 4. Click "..." → "Redeploy" on previous version
```

### Worker Rollback
```bash
# Railway rollback
railway rollback <deployment-id>

# Or via dashboard:
# 1. Go to railway.app/dashboard
# 2. Select service
# 3. Click "Deployments"
# 4. Select previous version
# 5. Click "Rollback"
```

---

**Document Version:** 1.0.0  
**Maintained By:** DevOps Team
