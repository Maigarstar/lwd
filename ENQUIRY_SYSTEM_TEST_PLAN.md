# Enquiry System - Complete Test Plan
## End-to-End Verification for Production Readiness

**Status**: Code Complete + Ready for Supabase Integration
**Timeline**: ~30-45 minutes to setup + test

---

## PHASE 1: SUPABASE TABLE SETUP (5 minutes)

### 1.1 Create the Table

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **SQL Editor**
4. Click **New Query**
5. Copy entire content from `SUPABASE_ENQUIRY_SETUP.sql`
6. Click **Run**
7. Wait for completion message: "Queries completed successfully"

### 1.2 Verify Table Created

**Query to run**:
```sql
SELECT table_name FROM information_schema.tables WHERE table_name='vendor_enquiries';
```

**Expected result**: One row showing `vendor_enquiries`

---

## PHASE 2: COUPLE SUBMISSION FLOW (10-15 minutes)

### Test: Couple submits enquiry from vendor profile

**Setup**:
1. Open app at http://localhost:5178
2. Navigate to any vendor profile (example: `/listing/the-grand-pavilion`)
3. Scroll down to sidebar → "Check availability" button

**Steps**:
1. Click "Check availability"
2. Form shows **Step 1 of 3**: "Preferred date"
   - Select a future date (e.g., June 15, 2026)
   - Click "Continue"

3. Form shows **Step 2 of 3**: "Estimated guests"
   - Adjust slider to 120 guests
   - Click "Continue"

4. Form shows **Step 3 of 3**: "Your details"
   - Enter Name: `Test Couple`
   - Enter Email: `testcouple@example.com`
   - Enter Message: `We love your style! Can you accommodate our vision?`
   - Click "Send enquiry"

5. Form shows **Step 4**: Success screen
   - ✅ Shows "✓ Enquiry Sent"
   - ✅ Shows vendor name
   - ✅ Shows expected response time

**Verify in Supabase**:
```sql
SELECT id, couple_name, couple_email, guest_count, budget_range, event_date, status, created_at
FROM vendor_enquiries
WHERE couple_email = 'testcouple@example.com'
ORDER BY created_at DESC LIMIT 1;
```

**Expected result**: One row with:
- `couple_name`: "Test Couple"
- `couple_email`: "testcouple@example.com"
- `guest_count`: 120
- `event_date`: 2026-06-15 (as date)
- `status`: "new"
- `created_at`: Recent timestamp

**Test Edge Cases**:
1. **Empty fields**: Try submitting without name → Should show error "Please fill in all required fields"
2. **Invalid email**: Try with bad email → Form should still submit (validation light)
3. **No message**: Submit without message → Should succeed (message is optional)

---

## PHASE 3: VENDOR DASHBOARD INBOX (10-15 minutes)

### Test: Vendor sees enquiry in Lead Inbox

**Setup**:
1. Open Vendor Dashboard at http://localhost:5178/vendor
2. You should see vendor data (Grand Pavilion or test vendor)
3. Look for **"Lead Inbox"** section in main content area

**Verification Points**:

#### 3.1 Inbox Layout
- ✅ Title says "Lead Inbox"
- ✅ Filter buttons visible: "New", "Replied", "Booked", "Archived"
- ✅ Each filter shows count badge (e.g., "New 1")

#### 3.2 Enquiry Card Content
- ✅ Card displays: "Test Couple" (couple name)
- ✅ Email shown: "testcouple@example.com"
- ✅ Status badge shows: "new" (in gold)
- ✅ Message shows: "We love your style! Can you accommodate our vision?"
- ✅ Meta info shows:
  - 👥 120 guests
  - 💰 (if budget was selected)
  - 📅 Jun 15, 2026
- ✅ Timestamp shows: Recent date
- ✅ "View ›" button visible

#### 3.3 Filter Functionality
- Click "New" → Shows only new enquiries
- Click "Replied" → Shows 0 (none replied yet)
- Click "Booked" → Shows 0
- Click "Archived" → Shows 0
- Click "New" again → Back to showing new enquiries

**Verify in Database**:
```sql
SELECT COUNT(*) as new_count FROM vendor_enquiries WHERE vendor_id = 1 AND status = 'new';
```
Should return: `1`

---

## PHASE 4: DASHBOARD METRICS CONNECTION (10 minutes)

### Test: Dashboard stats show real enquiry data

**Setup**:
1. Vendor Dashboard page
2. Look at top stat cards: "New Enquiries", "Conversion Rate", "Avg Response Time"

**Current Expected State** (before vendor replies):
- "New Enquiries": 1 (from our test submission)
- "Total Enquiries": 1
- "Conversion Rate": 0% (no booked yet)
- "Avg Response Time": N/A (vendor hasn't replied yet)

**Verify Query**:
```sql
SELECT
  COUNT(*) as total_enquiries,
  COUNT(*) FILTER (WHERE status = 'new') as new_enquiries,
  COUNT(*) FILTER (WHERE status = 'booked') as booked_enquiries,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'booked') / NULLIF(COUNT(*), 0), 1) as conversion_rate
FROM vendor_enquiries
WHERE vendor_id = 1;
```

**Expected result**:
```
total_enquiries | new_enquiries | booked_enquiries | conversion_rate
1               | 1             | 0                | 0.0
```

---

## PHASE 5: VENDOR REPLY FLOW (5 minutes)

### Test: Vendor replies to enquiry (simulates future detail view)

**Manual Supabase Update** (simulates vendor clicking "Reply" in detail view):
```sql
UPDATE vendor_enquiries
SET status = 'replied',
    vendor_reply = 'Thank you for your interest! We would love to work with you. Let''s schedule a call.',
    replied_at = NOW()
WHERE couple_email = 'testcouple@example.com'
LIMIT 1;
```

**Verify in Dashboard**:
1. Go back to Vendor Dashboard
2. In Lead Inbox, click "Replied" filter
3. ✅ Test Couple's enquiry should now appear under "Replied"
4. ✅ Status badge should show "replied" (blue)

**Verify Metrics Updated**:
- Check dashboard stats again
- "Avg Response Time" should now show a number (hours between created_at and replied_at)

**Verify Query**:
```sql
SELECT id, couple_name, status, replied_at FROM vendor_enquiries WHERE couple_email = 'testcouple@example.com';
```

Should show:
- `status`: "replied"
- `replied_at`: Recent timestamp

---

## PHASE 6: CONVERSION TRACKING (5 minutes)

### Test: Vendor marks enquiry as booked

**Manual Supabase Update** (simulates marking as booked):
```sql
UPDATE vendor_enquiries
SET status = 'booked',
    updated_at = NOW()
WHERE couple_email = 'testcouple@example.com'
LIMIT 1;
```

**Verify in Dashboard**:
1. Go back to Vendor Dashboard
2. In Lead Inbox, click "Booked" filter
3. ✅ Test Couple's enquiry should appear under "Booked"
4. ✅ Status badge should show "booked" (green)

**Verify Conversion Rate Updated**:
- Dashboard stat "Conversion Rate" should now show "100%"

**Verify Query**:
```sql
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'booked') as booked,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'booked') / COUNT(*), 1) as conversion_rate
FROM vendor_enquiries
WHERE vendor_id = 1;
```

Should show: `1 | 1 | 100.0`

---

## PHASE 7: LOAD TESTING (Optional)

### Create multiple test enquiries to verify at scale

```sql
-- Insert 9 more test enquiries (total 10)
INSERT INTO vendor_enquiries (vendor_id, couple_id, couple_name, couple_email, guest_count, budget_range, event_date, status)
VALUES
  (1, 'couple2@test.com', 'Couple Two', 'couple2@test.com', 100, '10k-25k', '2026-07-20', 'new'),
  (1, 'couple3@test.com', 'Couple Three', 'couple3@test.com', 150, '25k-50k', '2026-08-10', 'new'),
  (1, 'couple4@test.com', 'Couple Four', 'couple4@test.com', 80, '5k-10k', '2026-09-15', 'replied'),
  (1, 'couple5@test.com', 'Couple Five', 'couple5@test.com', 200, '50k-100k', '2026-10-01', 'booked'),
  (1, 'couple6@test.com', 'Couple Six', 'couple6@test.com', 120, '25k-50k', '2026-06-30', 'new'),
  (1, 'couple7@test.com', 'Couple Seven', 'couple7@test.com', 90, '10k-25k', '2026-07-15', 'archived'),
  (1, 'couple8@test.com', 'Couple Eight', 'couple8@test.com', 110, '25k-50k', '2026-08-20', 'new'),
  (1, 'couple9@test.com', 'Couple Nine', 'couple9@test.com', 130, '50k-100k', '2026-09-25', 'replied'),
  (1, 'couple10@test.com', 'Couple Ten', 'couple10@test.com', 160, '100k+', '2026-10-10', 'booked');
```

**Expected Lead Inbox Counts**:
- New: 4
- Replied: 2
- Booked: 2
- Archived: 1
- Total: 10

**Expected Metrics**:
- Total Enquiries: 10
- Conversion Rate: 40% (4 booked out of 10)

---

## CLEANUP: Delete Test Data (Optional)

After testing, clean up test enquiries:
```sql
DELETE FROM vendor_enquiries
WHERE couple_email LIKE 'testcouple@example.com' OR couple_email LIKE 'couple%@test.com';
```

---

## SUCCESS CRITERIA ✅

The Enquiry System is **production-ready** when:

- ✅ Couple can submit form from vendor profile
- ✅ Enquiry saves to `vendor_enquiries` table with all fields
- ✅ Vendor Dashboard shows enquiry in Lead Inbox
- ✅ Filter buttons show correct counts
- ✅ Dashboard metrics display real data:
  - New Enquiries count
  - Total Enquiries count
  - Conversion Rate (%)
  - Average Response Time (hours)
- ✅ Status updates (new → replied → booked → archived) work correctly
- ✅ Metrics recalculate when status changes
- ✅ No console errors in browser DevTools
- ✅ No errors in Supabase logs

---

## NEXT STEPS (After Verification)

1. **Build Enquiry Detail View** - Let vendors click "View ›" to see full conversation
2. **Add Email Notifications** (SendGrid) - Notify vendors of new enquiries
3. **Build Live Chat** - Real-time messaging between couple and vendor
4. **Add Couple Dashboard** - Show couples their sent enquiries and vendor replies

---

## TROUBLESHOOTING

**Problem**: Enquiry submits but doesn't appear in inbox
- Check: `SELECT * FROM vendor_enquiries;` - is the record there?
- If yes: Check vendor_id in dashboard vs database
- If no: Check browser console for errors

**Problem**: Filter counts are wrong
- Run: `SELECT status, COUNT(*) FROM vendor_enquiries GROUP BY status;`
- Verify counts match filter buttons

**Problem**: Dashboard metrics show 0
- Check if `getVendorEnquiries()` is being called in VendorDashboard
- Check browser Network tab for API errors
- Verify vendor_id is being passed correctly

---

**Estimated Total Time**: 45-60 minutes
**Complexity**: Medium (straightforward verification)
**Risk Level**: Low (read-only tests, manual data cleanup available)
