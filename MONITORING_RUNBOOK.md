# Monitoring Runbook
**Audience:** On-Call Engineers, Production Support  
**Purpose:** Quick reference for alert meanings and response procedures  
**Version:** Phase 4 Complete

---

## Alert Reference

### 🔴 CRITICAL Alerts (Page On-Call)

#### 1. **Site Down / 5xx Errors**
**Meaning:** Production site returning errors or unreachable

**Response:**
1. Verify issue: `curl -I https://luxuryweddingdirectory.com`
2. Check status page: Is Supabase down?
3. Check server logs: Are there crashes?
4. If database issue: Contact Supabase support
5. If code issue: Consider rollback (see DEPLOYMENT_HANDOFF.md)

**Escalation:** If not resolved in 10 minutes, escalate to Platform Lead

---

#### 2. **High Error Rate (>1%)**
**Meaning:** More than 1% of requests are failing

**Response:**
1. Identify error pattern: API errors? Frontend errors? Database timeout?
2. Check recent deployments: Did something deploy in last 30 min?
3. Monitor trending: Is it increasing or plateauing?
4. For API errors: Check Supabase status and quotas
5. For frontend errors: Check browser console logs from monitoring tool

**Common Causes:**
- Database query timeout (> 30s)
- Supabase connection limit exceeded
- Missing environment variable
- Unhandled exception in filter logic

**Fix:** If caused by recent deploy, rollback. Otherwise, investigate root cause.

---

#### 3. **Supabase Connectivity Failed**
**Meaning:** Application cannot connect to database

**Response:**
1. Check Supabase dashboard: Is service operational?
2. Verify environment variables: Is VITE_SUPABASE_URL correct?
3. Check network connectivity: `curl https://[supabase-url].co/rest/v1/health`
4. If auth error: Check API key hasn't been rotated
5. If rate limited: Wait 30s and retry, or contact Supabase support

**Escalation:** Page platform team, this is blocking

---

### 🟠 HIGH Alerts (Alert Team)

#### 4. **Data Quality Alert - Parity Mismatch**
**Meaning:** Filter results don't match between different counting methods

**Details:** `{filter: "style", expected: 12, got: 11}`

**Response:**
1. Identify affected filter: Check the "filter" field in alert
2. Verify data: Is the expected count correct?
3. Check filter logic: Is there a bug in applyDirectorySort?
4. Manual audit: Count venues matching filter in database
5. If persistent: Trigger data re-sync or deploy fix

**Not Urgent But Important:** This indicates subtle bugs that affect user trust

---

#### 5. **Slow Filter Operation (>50ms)**
**Meaning:** Filter took longer than baseline (31ms avg)

**Details:** `{filter: "Romantic+Coastal", duration: 87ms}`

**Response:**
1. Monitor if it's isolated or trending up
2. Check database load: Are other queries slow too?
3. Check filter complexity: Does the filter combo have a lot of venues?
4. If persistent: Optimize filter algorithm or add database index

**Not Critical:** One slow operation is fine. If > 10% are slow → investigate

---

#### 6. **Zero Results Alert**
**Meaning:** A filter returned no venues

**Details:** `{filter: "FutureStyle", query: "futuristic wedding venue"}`

**Response:**
1. Is this expected? (e.g., user searched for invalid style)
2. Check empty-state UX is showing: Does user see helpful alternatives?
3. If unexpected: Check filter logic for bug
4. Monitor frequency: Is this happening repeatedly?

**Not Critical:** Zero results are expected sometimes (empty-state UX handles this)

---

#### 7. **Unknown Style Alert**
**Meaning:** User searched for a style not in our taxonomy

**Details:** `{style: "Cyberpunk", query: "cyberpunk wedding venue"}`

**Response:**
1. Review the suggested style: Is it something we should support?
2. Check if it's a typo: "Cyberpunk" → "Contemporary"?
3. Add to style taxonomy if legitimate demand
4. For now: System falls back to empty-state UX (this is OK)

**Action:** Use this data to improve taxonomy over time

---

#### 8. **Data Quality Issue - Weak Listing**
**Meaning:** Venue has only secondary aesthetics, no primary style

**Details:** `{listingId: 20, issue: "WEAK_LISTING"}`

**Response:**
1. Find venue: `listings[id=20]` in database
2. Check styles array: Does it have a primary style?
3. If missing: Update database to add primary style
4. If correct: May be intended (e.g., special events venue)

**How to Fix:** Edit venue in database, add primary aesthetic

---

### 🟡 MEDIUM Alerts (Investigate)

#### 9. **Monitoring Data Export Failed**
**Meaning:** System couldn't save monitoring data to backup

**Response:**
1. Check disk space: Is storage full?
2. Check file permissions: Can app write to /logs?
3. Is this temporary (network hiccup) or persistent?
4. If persistent: Investigate file system issues

**Not Critical:** Data is still logged in memory. Only affects audit trail.

---

#### 10. **Cache Invalidation Failed**
**Meaning:** Map cache or filter cache couldn't be cleared

**Response:**
1. Check if users are seeing stale data
2. If yes: Force refresh user browser (Ctrl+Shift+R)
3. Restart service if necessary
4. Monitor if issue persists

---

## Response Matrix

| Alert | Severity | Response Time | Who | Action |
|-------|----------|--------------|-----|--------|
| Site Down | CRITICAL | < 5 min | On-Call | Investigate + rollback if needed |
| High Error Rate | CRITICAL | < 10 min | On-Call | Root cause + fix |
| Supabase Down | CRITICAL | < 5 min | On-Call | Wait or escalate |
| Parity Mismatch | HIGH | < 1 hour | Team | Audit + deploy fix |
| Slow Filters | HIGH | < 2 hours | Team | Profile + optimize |
| Zero Results | MEDIUM | < 4 hours | Team | Monitor trend |
| Unknown Style | MEDIUM | < 1 day | Team | Track for future |
| Data Quality | MEDIUM | < 1 day | Team | Update data |

---

## Escalation Flow

```
Alert Fires
    ↓
On-Call Engineer investigates (5-15 min)
    ↓
Is it CRITICAL?
    ├─ YES → Page Platform Lead immediately
    ├─ MAYBE → Alert team, escalate if not resolved in 30 min
    └─ NO → Log issue, schedule for next team standup
```

---

## Common Scenarios & Resolutions

### Scenario 1: "Filter operation took 150ms"
**Diagnosis:** Single slow operation is acceptable
**Action:** Monitor next 100 operations. If > 10% are slow → investigate
**Resolution:** May need database index on (region, style) columns

### Scenario 2: "Zero results for style=Modern"
**Diagnosis:** We don't have venues with "Modern" style (it's not in taxonomy)
**Action:** Check user query → may suggest "Contemporary" instead
**Resolution:** EmptyResultState UX handles this, suggest alternatives

### Scenario 3: "Parity mismatch: expected 5, got 4"
**Diagnosis:** Filter counted differently than expected
**Action:** Manually count matching venues → compare to both counts
**Resolution:** Fix whichever counting method is wrong

### Scenario 4: "Unknown style: Glam"
**Diagnosis:** User searched for style outside our taxonomy
**Action:** Check if "Glam" is shorthand for "Glamorous & Grand"
**Resolution:** Add fuzzy matching or normalize user input

---

## Dashboard Metrics to Watch

**Every 5 minutes during business hours:**
- ✅ Error rate (should be <0.1%)
- ✅ Average filter time (should be 31-50ms)
- ✅ API latency (should be <200ms)
- ✅ Active users (trending up is good)

**Every hour:**
- ✅ Data freshness: Are new listings showing?
- ✅ Cache hit rate: Are pages serving from cache?
- ✅ Database connections: Are we under quota?

**Daily:**
- ✅ Alert summary: How many of each type?
- ✅ Performance summary: Any regressions?
- ✅ User feedback: Any complaints in support?

---

## Critical Commands Reference

```bash
# Check if site is up
curl -I https://luxuryweddingdirectory.com

# Test API
curl https://luxuryweddingdirectory.com/api/health

# Check database
curl -X GET "[SUPABASE_URL]/rest/v1/listings?limit=1" \
  -H "apikey: [API_KEY]"

# View recent logs (in Supabase)
1. Dashboard → Logs → Filter by last 1 hour
2. Look for ERROR level messages
3. Check timestamp against alert time

# Force clear cache (if needed)
1. Go to CDN dashboard
2. Purge cache for all assets
3. Users will see new version on refresh
```

---

## Contact Escalation

**On-Call Rotation:** [Slack channel or calendar link]  
**Platform Lead:** [Name + contact]  
**Supabase Support:** https://supabase.com/support  
**Emergency:** [PagerDuty or on-call phone]

---

## Key Principles

1. **No silent failures** — We monitor everything
2. **Fast investigation** — Root cause in < 30 min
3. **Quick mitigation** — Either fix or rollback within 1 hour
4. **Transparency** — Communicate status to stakeholders
5. **Learning** — Review every incident to prevent recurrence

---

**Last Updated:** 2026-04-11  
**Next Review:** After first production week
