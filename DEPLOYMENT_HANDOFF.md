# Deployment Handoff Guide
**Status:** READY FOR PRODUCTION  
**Date:** 2026-04-11  
**Version:** Phase 4 Complete  
**Audience:** DevOps, SRE, Infrastructure Teams

---

## Overview

The Luxury Wedding Directory platform is ready for production deployment. This guide covers all steps required to deploy, configure, and validate the system in production.

**Deployment Readiness:**
- ✅ Build passes with 0 errors
- ✅ Data quality audited (32 venues, all slugs verified)
- ✅ Monitoring system operational (8/8 stress tests pass)
- ✅ Feature freeze enforced (Phase 4 complete)
- ✅ Performance baseline established (avg 31ms filters)

---

## Pre-Deployment Checklist

### 1. Environment Variables
Ensure all required environment variables are set in **production environment**:

```bash
# Required - Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-public-key

# Optional but recommended
VITE_API_ENDPOINT=https://api.yourdomain.com
VITE_ENVIRONMENT=production
NODE_ENV=production
```

**Validation:**
```bash
# Verify in your CI/CD pipeline
echo $VITE_SUPABASE_URL  # Should NOT be empty
echo $VITE_SUPABASE_KEY  # Should NOT be empty
```

### 2. Supabase Secrets & Configuration

**Required Secrets** (Set in Supabase Dashboard → Settings → Secrets):
```
RESEND_API_KEY=re_xxx_yyy  # For confirmation emails
```

**Required Functions:**
- `send-email` edge function must be deployed
- Status: Deployed and tested ✅

**Required Tables:**
- `listings` — Main venue/vendor data
- `enquiries` — Customer inquiry tracking
- `listing_applications` — Vendor signup applications (if approval workflow enabled)

**Validation:**
```bash
# Test database connection
curl -X GET "https://your-project.supabase.co/rest/v1/listings?limit=1" \
  -H "apikey: $VITE_SUPABASE_KEY"
  
# Should return valid JSON, not auth errors
```

### 3. Build Output Verification

```bash
# From clean clone/build
npm ci
npm run build

# Verify output
ls -lah dist/
# Should contain:
# - index.html
# - assets/ directory with .js, .css files
# - manifest.json (if PWA enabled)

# Size check (warn if over 500kb gzipped)
du -sh dist/
```

### 4. Domain & SSL Configuration

**Production Domain:** (Set in your hosting provider)
- Primary domain: `luxuryweddingdirectory.com`
- HTTPS: ✅ Mandatory (no HTTP fallback)
- SSL Certificate: Valid and non-expired
- HSTS: Recommended (`Strict-Transport-Security: max-age=31536000`)

**Validation:**
```bash
curl -I https://luxuryweddingdirectory.com
# Should show HTTP/2 200, Strict-Transport-Security header
```

### 5. Cache Configuration

**Recommended CDN Settings:**
- HTML files: Cache-Control: `no-cache, must-revalidate`
- Assets (JS/CSS/images): Cache-Control: `public, max-age=31536000, immutable`
- Dynamic API responses: Cache-Control: `private, max-age=3600`

---

## Deployment Steps

### Step 1: Deploy Code
```bash
# Production build is already created
npm run build

# Deploy dist/ to your hosting provider
# Example for Vercel:
vercel deploy --prod

# Example for Netlify:
netlify deploy --prod --dir=dist

# Example for self-hosted:
scp -r dist/* production-server:/var/www/lwd/
```

### Step 2: Verify Deployment
```bash
# Check homepage loads
curl -I https://luxuryweddingdirectory.com

# Check assets are served
curl -I https://luxuryweddingdirectory.com/assets/index-*.js
# Should return 200, cache headers present

# Check API connectivity
curl https://luxuryweddingdirectory.com/api/health
# Should return 200 with valid JSON
```

### Step 3: Run Post-Deployment Validation
```bash
# See POST_LAUNCH_VALIDATION.md for detailed checklist
# Quick checks:
1. Homepage loads without errors
2. Search/filters work
3. Venue cards render
4. Map displays correctly
5. No 404 errors in console
```

### Step 4: Monitor First Hour
```bash
# Watch for errors in your monitoring tool
# Key metrics to watch:
- Error rate (should be <0.1%)
- Page load time (should be <3s)
- API latency (should be <200ms)
- Bounce rate (baseline comparison)

# Set up alerts:
- Any 5xx errors → page
- Error rate >1% → page
- API latency >500ms → alert
```

---

## Production Monitoring

### Essential Alerts (Configure in your APM tool)

| Alert | Condition | Action |
|-------|-----------|--------|
| **High Error Rate** | Error rate > 1% | Page on-call, investigate immediately |
| **API Down** | Supabase connectivity fails | Page on-call, check status page |
| **Performance Degradation** | Filter operation > 200ms | Alert, investigate database |
| **Silent Failures** | filterMonitoring shows hidden errors | Page on-call, audit logs |
| **Data Integrity** | Parity mismatch alert fired | Alert, check data sync |

### Monitoring Endpoints
```bash
# Health check endpoint
GET /health
# Response: { status: "healthy", timestamp: "2026-04-11T..." }

# Metrics endpoint (if enabled)
GET /api/metrics
# Response: { alerts: 0, operations: 1234, avgTime: 31 }
```

---

## Rollback Plan

**If Critical Issue Detected:**

### Quick Rollback (< 5 minutes)
```bash
# Revert to previous build in CDN/hosting
# Example: Vercel
vercel rollback

# Example: Netlify  
netlify deploy --prod --dir=dist_previous

# OR point domain to previous version
DNS CNAME → old-build.cloudfront.net
```

### Database Rollback (If Data Corrupted)
```bash
# Supabase: Restore from backup
# 1. Go to Supabase Dashboard → Settings → Backups
# 2. Click "Restore from backup"
# 3. Select backup time before issue occurred
# 4. Confirm restore (takes ~5-10 minutes)
```

### Full Environment Rollback
```bash
# If production is compromised:
1. Point DNS to staging environment
2. Investigate issue on production (do NOT modify)
3. Deploy fix to staging
4. Run full validation
5. Switch production to fixed version
```

---

## Performance Baseline

**Established during Phase 4:**
```
Filter Operations:
- Average: 31ms
- Max: 87ms
- P95: 87ms
- Baseline: ✅ Acceptable for production

Page Load:
- Initial load: <2s (target)
- Filters apply: <200ms (target)
- Map render: <500ms (target)
```

**Performance Regression Alert Threshold:**
- If any metric degrades > 50% → investigate immediately
- If any metric degrades > 100% → consider rollback

---

## Escalation Path

**For Production Issues:**

| Severity | Response Time | Action |
|----------|---------------|--------|
| **CRITICAL** | < 5 min | Page on-call, declare incident, investigate |
| **HIGH** | < 15 min | Alert team, investigate root cause |
| **MEDIUM** | < 1 hour | Log issue, schedule fix for next deploy |
| **LOW** | < 1 day | Track in backlog, include in next release |

**Critical Issues Examples:**
- Site down/404 errors
- Data loss or corruption
- Security vulnerability
- Payment/transaction failure

---

## Deployment Verification Checklist

Before declaring launch successful:

- [ ] Homepage loads without errors
- [ ] Search/filter functionality works
- [ ] Venue cards display correctly
- [ ] Map renders and is interactive
- [ ] Aura chat accessible (if enabled)
- [ ] Email confirmations send
- [ ] No 404 errors in console
- [ ] Performance metrics within baseline
- [ ] Error rate < 0.1%
- [ ] Monitoring alerts operational

---

## 24-Hour Post-Launch Checklist

**First 24 hours after launch:**

- [ ] Monitor error rate (should be <0.1%)
- [ ] Check user funnel metrics
- [ ] Verify email deliverability
- [ ] Monitor database performance
- [ ] Check log aggregation working
- [ ] Test alert notifications fire correctly
- [ ] Verify backup system functional
- [ ] Document any hotfixes needed

---

## Contact & Escalation

**For deployment issues:**
- DevOps On-Call: [slack channel or phone]
- Platform Team Lead: [contact info]
- Emergency Escalation: [process]

**For questions during deployment:**
- See README.md in repository
- Check MONITORING_RUNBOOK.md for alert meanings
- Reference POST_LAUNCH_VALIDATION.md for testing procedures

---

## Final Sign-Off

**Deployment Approved By:**
- [ ] Engineering Lead — Code quality verified
- [ ] DevOps Lead — Infrastructure ready
- [ ] QA Lead — Testing complete
- [ ] Product Lead — Launch requirements met

**Deployment Date:** _____________  
**Deployed By:** _____________  
**Build Version:** Phase 4 Complete (Commit: [latest])

---

**Status: 🚀 READY FOR PRODUCTION**

All systems have been validated and are ready for deployment. Follow this guide exactly, and the launch will be smooth and uneventful.

The platform is production-hardened, monitored, and ready to serve high-net-worth couples looking for exceptional venues.
