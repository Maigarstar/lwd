# Next Features Development Roadmap

**Project:** Luxury Wedding Directory
**Date:** March 8, 2026
**Status:** Authentication Complete → Ready for Feature Development

---

## 🎯 Current State Summary

### What's Complete ✅
- ✅ **Authentication System** - Vendor & Couple signup, email confirmation, login
- ✅ **Enquiry System** - Couples can submit enquiries to vendors
- ✅ **Dashboard Metrics** - Real vendor/couple metrics connected to live data
- ✅ **Admin Lead Dashboard** - Admins can view all leads across vendors
- ✅ **Lead Inbox Component** - 80% built, needs 2 features to complete

### What's Needed 🚀
According to your product roadmap (3-layer development model):
1. **Data Layer:** ✅ Complete (enquiries, shortlists, metrics)
2. **Interaction Layer:** 🔄 In Progress (dashboards, inboxes)
3. **Revenue Layer:** 📋 Planned (promoted listings, featured placement)

---

## 📊 Feature Completion Status

| Feature | Status | Confidence | Dependencies |
|---------|--------|-----------|--------------|
| **Authentication** | ✅ Complete | 95% | None |
| **Enquiry System** | ✅ Complete | 100% | Auth ✅ |
| **Dashboard Metrics** | ✅ Complete | 100% | Enquiry ✅ |
| **Admin Leads Dashboard** | ✅ Complete | 100% | Enquiry ✅ |
| **Vendor Lead Inbox (Component)** | 🟡 80% | 90% | Enquiry ✅ |
| **Lead Inbox - Status Updates** | ❌ 0% | - | Lead Inbox |
| **Lead Inbox - Reply Function** | ❌ 0% | - | Lead Inbox |
| **Couple Activity Feed** | ❌ 0% | - | Enquiry ✅ |
| **Vendor Public Listing** | ❌ 0% | - | Vendor Profile |
| **Live Chat** | ❌ 0% | - | Enquiry ✅ |
| **Curated Index Algorithm** | ❌ 0% | - | Metrics ✅ |

---

## 🔥 Recommended Next Priority: Complete Lead Inbox (80% → 100%)

**Why This First:**
1. Component is 80% complete - just 2 features needed
2. Provides immediate vendor value (see their leads!)
3. Foundation for later features (chat, notifications)
4. Relatively small scope (2-3 hours estimated)
5. High ROI for user engagement

**Current Implementation:**
- ✅ Lead list with filtering (new, replied, booked, archived)
- ✅ Enquiry cards with couple info and details
- ✅ Status indicators and color coding
- ✅ Count badges for each status
- ✅ Integrated into VendorDashboard

**What Needs Adding (2 Features):**

### Feature 1: Status Update Functionality ⏳
**What it does:** Vendor can click status buttons to move leads through pipeline

**Implementation:**
```jsx
// Add to VendorLeadInbox.jsx
const handleStatusUpdate = async (enquiryId, newStatus) => {
  const result = await updateEnquiryStatus(enquiryId, newStatus);
  if (!result.error) {
    // Update local state
    setEnquiries(enquiries.map(e =>
      e.id === enquiryId ? { ...e, status: newStatus } : e
    ));
  }
};

// Add to EnquiryCard component
<div style={{ display: "flex", gap: 8 }}>
  {enquiry.status !== "archived" && (
    <button onClick={() => handleStatusUpdate(enquiry.id, "archived")}>
      Archive
    </button>
  )}
  {enquiry.status === "new" && (
    <button onClick={() => handleStatusUpdate(enquiry.id, "replied")}>
      Mark Replied
    </button>
  )}
  {enquiry.status !== "booked" && (
    <button onClick={() => handleStatusUpdate(enquiry.id, "booked")}>
      Book Event
    </button>
  )}
</div>
```

**Files to Modify:**
- `src/components/VendorLeadInbox.jsx` - Add status update handlers
- `src/services/inquiryService.js` - Add `updateEnquiryStatus()` function

**Estimated Time:** 30-45 minutes

---

### Feature 2: Quick Reply Functionality ⏳
**What it does:** Vendor can add a note/reply to an enquiry (for future chat integration)

**Implementation:**
```jsx
// Add to VendorLeadInbox.jsx
const handleAddReply = async (enquiryId, replyText) => {
  const result = await addVendorReply(enquiryId, replyText);
  if (!result.error) {
    // Refresh enquiry or show success message
    setEnquiries(enquiries.map(e =>
      e.id === enquiryId
        ? { ...e, last_reply: replyText, replied_at: new Date() }
        : e
    ));
  }
};

// Add to EnquiryCard - expand to show reply box
{showReplyBox && (
  <textarea
    placeholder="Add a note or reply..."
    style={{ width: "100%", padding: "10px", marginTop: 10 }}
  />
)}
```

**Files to Modify:**
- `src/components/VendorLeadInbox.jsx` - Add reply input and submit
- `src/services/inquiryService.js` - Add `addVendorReply()` function

**Estimated Time:** 30-45 minutes

---

## 📋 Secondary Priority: Couple Activity Feed

**Why After Lead Inbox:**
1. Provides vendor engagement (daily dopamine)
2. Motivates couple action ("see who viewed you")
3. Builds on existing lead tracking data
4. Relatively simple to build

**Scope:**
- Activity card: "3 couples shortlisted your venue"
- Activity card: "[Couple Name] viewed your profile"
- Activity card: "[Couple Name] sent an enquiry"
- Real-time updates (optional: could use polling first)
- Display on vendor dashboard above metrics

**Estimated Time:** 2-3 hours

**Data Already Available:**
- vendor_shortlists table - who shortlisted vendor
- vendor_enquiries table - who sent enquiries
- profile_views table - who viewed profile

---

## 🔄 Alternative: Quick Wins Before Lead Inbox

If you'd prefer smaller, independent features:

### Quick Win 1: "View Public Listing" Button (30 min)
- Add button to vendor dashboard
- Links to couple's view of vendor profile
- Shows what couples see when browsing

### Quick Win 2: Email Notifications for New Leads (1 hour)
- Send email when couple submits enquiry
- Send email when vendor gets replied
- Foundation for notification system

### Quick Win 3: Search/Filter Improvements (45 min)
- Search leads by couple name or email
- Filter by date range
- Sort by newest/oldest/guest count

---

## 🗂️ Architecture for Next Features

### Database Tables Ready ✅
```sql
-- Enquiries
vendor_enquiries: id, vendor_id, couple_id, status, message, created_at

-- Shortlists
vendor_shortlists: id, couple_id, vendor_id, created_at

-- Views
profile_views: id, viewer_id (couple), vendor_id, viewed_at

-- Messages (for future chat)
messages: id, from_id, to_id, enquiry_id, message, created_at
```

### Services Ready ✅
- `inquiryService.js` - CRUD for enquiries
- `vendorMetricsService.js` - Metrics and data fetching
- `adminLeadService.js` - Admin operations

### Components Ready ✅
- `VendorLeadInbox.jsx` - Lead list (80% done)
- `VendorDashboard.jsx` - Already integrated

---

## 🚀 Recommended Development Path

### Sprint 1 (This Session - 2-3 hours):
1. ✅ Complete authentication E2E testing
2. ✅ Create production readiness checklist
3. 🔄 **Complete Lead Inbox (add status updates + replies)**

### Sprint 2 (Next Session - 2-3 hours):
1. Couple Activity Feed
2. Email notifications for new leads
3. Search/filter improvements

### Sprint 3 (Week 3 - 3-4 hours):
1. Live chat between vendor and couple
2. Message inbox for vendors
3. "View Public Listing" button

### Sprint 4+ (Later):
1. Algorithm-based curated index
2. Revenue features (promoted listings, featured placement)
3. Reviews and ratings system

---

## 📝 Development Checklist for Lead Inbox Completion

### Status Update Feature:
- [ ] Add `updateEnquiryStatus(enquiryId, status)` to inquiryService.js
- [ ] Add SQL RLS policy: vendor can update their own enquiries
- [ ] Add status update buttons to EnquiryCard component
- [ ] Add loading state while updating
- [ ] Add error handling with user feedback
- [ ] Test all status transitions (new→replied, new→booked, etc.)
- [ ] Test that vendor can only update their own enquiries
- [ ] Add success toast message when status changes

### Reply Feature:
- [ ] Add `addVendorReply(enquiryId, message)` to inquiryService.js
- [ ] Add SQL table for enquiry_replies (or use messages table)
- [ ] Add reply input box that expands when clicked
- [ ] Add character limit (e.g., 500 chars)
- [ ] Add loading state while submitting
- [ ] Add error handling
- [ ] Mark enquiry status as "replied" when reply added
- [ ] Display replies in chronological order
- [ ] Test that only vendor can reply to their own enquiries

### Testing:
- [ ] Test with sample vendor account
- [ ] Verify status updates reflect in database
- [ ] Verify replies save correctly
- [ ] Test on mobile view
- [ ] Verify auth guard prevents unauthorized updates
- [ ] Test edge cases (rapid clicks, network errors)

---

## 📊 Impact & Metrics

### Lead Inbox Completion Impact:
- **Vendor Value:** Can now manage leads, move through pipeline
- **Engagement:** Vendors check inbox to see new leads
- **Data:** Transition data shows lead quality (% booked, response time)
- **Foundation:** Platform for notifications, chat, scoring

### Expected Usage:
- **New Vendors:** Check inbox first time to see leads
- **Daily:** Check for new leads (morning/evening habit)
- **Lead Response:** Update status as they progress toward booking

---

## 🎯 Success Metrics

Once Lead Inbox is complete, track:
- [ ] % of leads that get replied to
- [ ] Average time to first reply
- [ ] % of leads that convert to booked
- [ ] Average lead-to-booking cycle time
- [ ] Lead quality scoring (vendor feedback)

---

## 💡 Implementation Tips

### For Status Updates:
```javascript
// Use transaction to update both enquiry and metrics atomically
BEGIN
  UPDATE vendor_enquiries SET status = 'replied' WHERE id = ?
  UPDATE vendor_metrics SET replied_count = replied_count + 1 WHERE vendor_id = ?
COMMIT
```

### For Replies:
```javascript
// Consider storing replies in separate table for future chat
CREATE TABLE enquiry_replies (
  id UUID,
  enquiry_id UUID,
  sender_id UUID, // vendor or couple
  message TEXT,
  created_at TIMESTAMP
)
```

### For Real-Time Updates (Later):
```javascript
// Current: Polling (reload data every 30 sec)
// Future: Supabase Realtime (automatic updates)
supabase
  .channel('enquiries')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'vendor_enquiries' },
    (payload) => { /* update local state */ }
  )
  .subscribe()
```

---

## 📚 Related Documentation

- `E2E_AUTHENTICATION_TEST_REPORT.md` - Auth system verification
- `PRODUCTION_READINESS_CHECKLIST.md` - What's needed before launch
- `ENQUIRY_SYSTEM_SUMMARY.md` - How enquiry system works
- `EMAIL_CONFIRMATION_GUIDE.md` - Email verification details

---

## ❓ Questions to Consider

1. **Real-time updates:** Should Lead Inbox auto-refresh when new leads arrive?
2. **Notifications:** Should vendor get email when couple sends enquiry?
3. **Bulk operations:** Should vendor be able to archive multiple leads?
4. **SLA tracking:** Should system track response time and compliance?
5. **Lead scoring:** Should system suggest best leads based on match?

---

## 🔗 Dependencies & Blockers

### No Blockers ✅
- Authentication: Complete
- Database: Schema ready
- Services: Base functions available
- Components: Lead inbox 80% done

### Internal Dependencies:
- Lead Inbox → Activity Feed (uses same data)
- Activity Feed → Notifications (future)
- Notifications → Live Chat (future)

---

## 📞 Getting Started

To proceed with Lead Inbox completion:

1. **Review** the current VendorLeadInbox.jsx component
2. **Identify** which SQL functions exist in inquiryService.js
3. **Add** updateEnquiryStatus() function
4. **Add** handleStatusUpdate() handler to component
5. **Add** status update buttons to EnquiryCard
6. **Test** with sample vendor account
7. **Repeat** for reply functionality

**Estimated Total Time:** 1.5-2 hours to get both features working

---

## 🎬 Ready to Start?

The path forward is clear:
1. ✅ Authentication - DONE
2. 🔄 Complete Lead Inbox (2 features, 2 hours)
3. → Then Couple Activity Feed (3 hours)
4. → Then Live Chat system
5. → Then Revenue features

**What would you like to tackle next?**

---

**Document Created:** March 8, 2026
**Next Review:** After completing Lead Inbox
**Status:** Ready to Implement
