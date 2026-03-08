# Lead Inbox Completion - Detailed Implementation Plan

**Status:** Pre-Implementation Analysis
**Date:** March 8, 2026
**Estimated Time:** 2 hours
**Difficulty:** Medium (80% of code exists, just needs connection)

---

## 🎯 Executive Summary

The Lead Inbox is **80% complete**. The component exists, the database services exist, and the UI is built. We only need to:

1. **Connect status update functions** (30 min)
2. **Connect reply functionality** (45 min)
3. **Test all interactions** (30 min)

**Total: ~2 hours**

---

## 📊 Current State Analysis

### ✅ What Already Exists

#### Services (inquiryService.js) - ALL FUNCTIONS READY
```javascript
✅ updateInquiryStatus(enquiryId, newStatus)
   - Updates status to: new, replied, booked, archived
   - Returns updated enquiry object
   - Handles timestamps automatically
   
✅ addVendorReply(enquiryId, replyMessage)
   - Adds vendor_reply text to enquiry
   - Auto-sets status to "replied"
   - Auto-sets replied_at timestamp
   
✅ getVendorInquiries(vendorId)
   - Fetches all enquiries for vendor
   - Already used in component
   
✅ closeInquiry(enquiryId)
   - Archives enquiry by setting status to "archived"
   - Can be used as fallback
```

#### Component (VendorLeadInbox.jsx) - STRUCTURE READY
- ✅ Loads enquiries on mount
- ✅ Filters by status (new, replied, booked, archived)
- ✅ Displays enquiry cards with details
- ✅ Shows couple name, email, message, guest count, budget, date
- ✅ Status badges and color coding
- ✅ "View ›" button exists (not connected)

#### Database Schema (vendor_enquiries)
- ✅ id, vendor_id, couple_id, message
- ✅ guest_count, budget_range, event_date
- ✅ status (new, replied, booked, archived)
- ✅ couple_name, couple_email, couple_phone
- ✅ vendor_reply (TEXT field for vendor notes)
- ✅ replied_at (TIMESTAMP field)
- ✅ created_at, updated_at (timestamps)

---

## 📋 Implementation Checklist

### PART 1: Status Update Functionality (30 minutes)

#### Step 1a: Import updateInquiryStatus in component
**File:** `src/components/VendorLeadInbox.jsx`
**Change:** Add import at top
```javascript
// Current imports:
import { getVendorEnquiries } from "../services/vendorMetricsService";

// Add this:
import { updateInquiryStatus } from "../services/inquiryService";
```

**Why:** Connect to the update function that already exists

---

#### Step 1b: Add handleStatusUpdate function to component
**Location:** Inside VendorLeadInbox component, after useEffect
**Code to add:**
```javascript
const handleStatusUpdate = async (enquiryId, newStatus) => {
  // Disable button while updating
  setUpdating(enquiryId);
  
  const result = await updateInquiryStatus(enquiryId, newStatus);
  
  if (!result.error) {
    // Update local state - move enquiry to new status
    setEnquiries(enquiries.map(e =>
      e.id === enquiryId 
        ? { ...e, status: newStatus, updated_at: new Date().toISOString() } 
        : e
    ));
    
    // Show success message (optional)
    console.log(`Enquiry marked as ${newStatus}`);
  } else {
    // Show error
    console.error("Error updating status:", result.error);
    alert(`Failed to update status: ${result.error.message}`);
  }
  
  // Re-enable button
  setUpdating(null);
};
```

**Why:** Handle the status update when user clicks button

---

#### Step 1c: Add state for tracking updates
**Location:** Near top of component with other useState
```javascript
const [updating, setUpdating] = useState(null); // Track which enquiry is being updated
```

**Why:** Show loading state while updating

---

#### Step 1d: Modify EnquiryCard to add status buttons
**Location:** Inside EnquiryCard component, replace the "View ›" button
**Current code:**
```javascript
{/* Action Button */}
<button
  style={{
    padding: "8px 12px",
    background: "none",
    border: `1px solid ${C?.border2 || "#444444"}`,
    // ... more styles
  }}
>
  View ›
</button>
```

**Replace with:**
```javascript
{/* Status Action Buttons */}
<div style={{
  display: "flex",
  gap: 6,
  flexDirection: "column",
  minWidth: "90px",
}}>
  {/* Mark as Replied Button */}
  {enquiry.status === "new" && (
    <button
      onClick={() => handleStatusUpdate(enquiry.id, "replied")}
      disabled={updating === enquiry.id}
      style={{
        padding: "6px 10px",
        background: updating === enquiry.id ? C?.grey2 || "#666" : C?.blue || "#4f9ff0",
        border: "none",
        color: C?.white || "#ffffff",
        borderRadius: "4px",
        fontFamily: NU,
        fontSize: 10,
        fontWeight: 600,
        textTransform: "uppercase",
        cursor: updating === enquiry.id ? "not-allowed" : "pointer",
        opacity: updating === enquiry.id ? 0.6 : 1,
        transition: "all 0.2s",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        if (updating !== enquiry.id) {
          e.currentTarget.style.opacity = "0.8";
        }
      }}
      onMouseLeave={(e) => {
        if (updating !== enquiry.id) {
          e.currentTarget.style.opacity = "1";
        }
      }}
    >
      {updating === enquiry.id ? "..." : "Replied"}
    </button>
  )}

  {/* Book Event Button */}
  {enquiry.status !== "booked" && enquiry.status !== "archived" && (
    <button
      onClick={() => handleStatusUpdate(enquiry.id, "booked")}
      disabled={updating === enquiry.id}
      style={{
        padding: "6px 10px",
        background: updating === enquiry.id ? C?.grey2 || "#666" : C?.green || "#10b981",
        border: "none",
        color: C?.white || "#ffffff",
        borderRadius: "4px",
        fontFamily: NU,
        fontSize: 10,
        fontWeight: 600,
        textTransform: "uppercase",
        cursor: updating === enquiry.id ? "not-allowed" : "pointer",
        opacity: updating === enquiry.id ? 0.6 : 1,
        transition: "all 0.2s",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        if (updating !== enquiry.id) {
          e.currentTarget.style.opacity = "0.8";
        }
      }}
      onMouseLeave={(e) => {
        if (updating !== enquiry.id) {
          e.currentTarget.style.opacity = "1";
        }
      }}
    >
      {updating === enquiry.id ? "..." : "Book"}
    </button>
  )}

  {/* Archive Button */}
  {enquiry.status !== "archived" && (
    <button
      onClick={() => handleStatusUpdate(enquiry.id, "archived")}
      disabled={updating === enquiry.id}
      style={{
        padding: "6px 10px",
        background: updating === enquiry.id ? C?.grey2 || "#666" : C?.grey || "#888888",
        border: "none",
        color: C?.white || "#ffffff",
        borderRadius: "4px",
        fontFamily: NU,
        fontSize: 10,
        fontWeight: 600,
        textTransform: "uppercase",
        cursor: updating === enquiry.id ? "not-allowed" : "pointer",
        opacity: updating === enquiry.id ? 0.6 : 1,
        transition: "all 0.2s",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        if (updating !== enquiry.id) {
          e.currentTarget.style.opacity = "0.8";
        }
      }}
      onMouseLeave={(e) => {
        if (updating !== enquiry.id) {
          e.currentTarget.style.opacity = "1";
        }
      }}
    >
      {updating === enquiry.id ? "..." : "Archive"}
    </button>
  )}
</div>
```

**Why:** Show context-appropriate buttons for each status

---

### PART 2: Reply Functionality (45 minutes)

#### Step 2a: Import addVendorReply function
**File:** `src/components/VendorLeadInbox.jsx`
**Add to imports:**
```javascript
import { updateInquiryStatus, addVendorReply } from "../services/inquiryService";
```

---

#### Step 2b: Add state for reply box
**Location:** Near other useState declarations
```javascript
const [expandedReplyId, setExpandedReplyId] = useState(null); // Which enquiry has reply box open
const [replyText, setReplyText] = useState(""); // Text being typed
const [replying, setReplying] = useState(null); // Which enquiry is being submitted
```

**Why:** Track which reply box is open and handle input/submit states

---

#### Step 2c: Add handleAddReply function
**Location:** After handleStatusUpdate function
```javascript
const handleAddReply = async (enquiryId) => {
  if (!replyText.trim()) {
    alert("Please enter a reply message");
    return;
  }
  
  setReplying(enquiryId);
  
  const result = await addVendorReply(enquiryId, replyText);
  
  if (!result.error) {
    // Update local state
    setEnquiries(enquiries.map(e =>
      e.id === enquiryId
        ? {
            ...e,
            vendor_reply: replyText,
            status: "replied",
            replied_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        : e
    ));
    
    // Clear reply box
    setExpandedReplyId(null);
    setReplyText("");
    
    console.log("Reply added successfully");
  } else {
    console.error("Error adding reply:", result.error);
    alert(`Failed to add reply: ${result.error.message}`);
  }
  
  setReplying(null);
};
```

**Why:** Handle reply submission and update UI

---

#### Step 2d: Modify EnquiryCard to show existing replies
**Location:** In EnquiryCard, after the message display
**Add after line ~167 (after message paragraph):**
```javascript
{/* Existing Vendor Reply */}
{enquiry.vendor_reply && (
  <div style={{
    background: C?.border || "#333333",
    border: `1px solid ${C?.border2 || "#444444"}`,
    borderRadius: "4px",
    padding: "10px 12px",
    marginTop: 10,
    borderLeft: `3px solid ${C?.gold || "#C9A84C"}`,
  }}>
    <p style={{
      fontFamily: NU,
      fontSize: 10,
      color: C?.grey2 || "#666666",
      margin: "0 0 6px 0",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      fontWeight: 600,
    }}>
      Your Reply:
    </p>
    <p style={{
      fontFamily: NU,
      fontSize: 12,
      color: C?.white || "#ffffff",
      margin: 0,
      lineHeight: 1.4,
    }}>
      {enquiry.vendor_reply}
    </p>
    {enquiry.replied_at && (
      <p style={{
        fontFamily: NU,
        fontSize: 10,
        color: C?.grey2 || "#666666",
        margin: "6px 0 0 0",
        fontStyle: "italic",
      }}>
        {new Date(enquiry.replied_at).toLocaleDateString()}
      </p>
    )}
  </div>
)}
```

**Why:** Show vendor's existing reply if they've already replied

---

#### Step 2e: Add reply input box to EnquiryCard
**Location:** After existing reply display, before status buttons
**Add:**
```javascript
{/* Reply Input Box */}
{expandedReplyId === enquiry.id ? (
  <div style={{
    background: C?.card || "#1a1a1a",
    border: `1px solid ${C?.border2 || "#444444"}`,
    borderRadius: "4px",
    padding: 12,
    marginTop: 12,
  }}>
    <label style={{
      display: "block",
      fontFamily: NU,
      fontSize: 11,
      color: C?.grey2 || "#666666",
      marginBottom: 6,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    }}>
      Add Your Reply:
    </label>
    <textarea
      value={replyText}
      onChange={(e) => setReplyText(e.currentTarget.value)}
      placeholder="Type your reply to this couple..."
      maxLength={500}
      style={{
        width: "100%",
        padding: "10px",
        background: C?.white || "#ffffff",
        color: C?.text || "#2a2a2a",
        border: `1px solid ${C?.border || "#333333"}`,
        borderRadius: "4px",
        fontFamily: NU,
        fontSize: 12,
        fontWeight: 400,
        resize: "vertical",
        minHeight: "80px",
        boxSizing: "border-box",
        marginBottom: 8,
      }}
    />
    <p style={{
      fontFamily: NU,
      fontSize: 10,
      color: C?.grey2 || "#666666",
      margin: "6px 0 12px 0",
      textAlign: "right",
    }}>
      {replyText.length}/500 characters
    </p>
    <div style={{
      display: "flex",
      gap: 8,
      justifyContent: "flex-end",
    }}>
      <button
        onClick={() => {
          setExpandedReplyId(null);
          setReplyText("");
        }}
        disabled={replying === enquiry.id}
        style={{
          padding: "8px 16px",
          background: "none",
          border: `1px solid ${C?.border2 || "#444444"}`,
          color: C?.grey || "#888888",
          borderRadius: "4px",
          fontFamily: NU,
          fontSize: 11,
          fontWeight: 600,
          cursor: replying === enquiry.id ? "not-allowed" : "pointer",
          opacity: replying === enquiry.id ? 0.6 : 1,
        }}
      >
        Cancel
      </button>
      <button
        onClick={() => handleAddReply(enquiry.id)}
        disabled={replying === enquiry.id || !replyText.trim()}
        style={{
          padding: "8px 16px",
          background: C?.gold || "#C9A84C",
          border: "none",
          color: "#0a0a08",
          borderRadius: "4px",
          fontFamily: NU,
          fontSize: 11,
          fontWeight: 600,
          cursor: replying === enquiry.id || !replyText.trim() ? "not-allowed" : "pointer",
          opacity: replying === enquiry.id || !replyText.trim() ? 0.6 : 1,
        }}
      >
        {replying === enquiry.id ? "Sending..." : "Send Reply"}
      </button>
    </div>
  </div>
) : (
  <button
    onClick={() => {
      setExpandedReplyId(enquiry.id);
      setReplyText("");
    }}
    style={{
      marginTop: 12,
      padding: "8px 12px",
      background: "none",
      border: `1px solid ${C?.border2 || "#444444"}`,
      color: C?.gold || "#C9A84C",
      borderRadius: "4px",
      fontFamily: NU,
      fontSize: 11,
      fontWeight: 600,
      textTransform: "uppercase",
      cursor: "pointer",
      transition: "all 0.2s",
      width: "100%",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = C?.gold || "#C9A84C";
      e.currentTarget.style.background = `${C?.gold || "#C9A84C"}10`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = C?.border2 || "#444444";
      e.currentTarget.style.background = "none";
    }}
  >
    + Add Reply
  </button>
)}
```

**Why:** Show reply input when user clicks "Add Reply", hide when done

---

### PART 3: Testing Plan (30 minutes)

#### Test 1: Status Updates
```
1. Create test enquiry (couple submits enquiry to vendor)
2. Open Lead Inbox as vendor
3. Click "Mark Replied" button
4. Verify:
   - Button disappears (status no longer "new")
   - Enquiry card updates to show "replied" status
   - Card moves to "Replied" filter tab
   - Database reflects change
5. Repeat for "Book" and "Archive" buttons
```

#### Test 2: Reply Functionality
```
1. Open enquiry in Lead Inbox
2. Click "+ Add Reply"
3. Type test message
4. Click "Send Reply"
5. Verify:
   - Reply text appears in yellow box
   - Status auto-changes to "replied"
   - "Add Reply" button changes to show reply text
   - Character limit works
   - Can edit/replace reply
6. Reload page - verify reply persists
```

#### Test 3: Full Pipeline
```
1. Start with "new" enquiry
2. Mark as "replied"
3. Add reply message
4. Mark as "booked"
5. Archive enquiry
6. Verify each status transition works
7. Test mobile view - buttons stack properly
```

---

## 📂 Files to Modify

| File | Changes | Lines |
|------|---------|-------|
| `src/components/VendorLeadInbox.jsx` | Add status handlers + reply handlers | ~150 new lines |
| `src/services/inquiryService.js` | Already has all functions! | No changes |

---

## 🔄 Data Flow After Implementation

```
User clicks "Mark Replied" button
    ↓
handleStatusUpdate() called with enquiryId + "replied"
    ↓
updateInquiryStatus(enquiryId, "replied") called
    ↓
Supabase updates vendor_enquiries.status = "replied"
Supabase updates vendor_enquiries.updated_at = NOW()
    ↓
Local state updated: enquiry.status = "replied"
    ↓
Component re-renders:
  - Enquiry card shows "replied" badge
  - New action buttons appear (Book, Archive)
  - "Mark Replied" button disappears
    ↓
User sees change immediately
```

---

## 🎯 Expected Outcome

### Before (Current State)
```
Lead Inbox
  ├─ Filter buttons (New, Replied, Booked, Archived)
  ├─ Enquiry cards showing:
  │  ├─ Couple name & email
  │  ├─ Message
  │  ├─ Event details
  │  └─ "View ›" button (not functional)
  └─ No way to update status
```

### After (Complete State)
```
Lead Inbox
  ├─ Filter buttons (New, Replied, Booked, Archived)
  ├─ Enquiry cards showing:
  │  ├─ Couple name & email
  │  ├─ Message
  │  ├─ Event details
  │  ├─ Status update buttons:
  │  │  ├─ "Replied" (if status = new)
  │  │  ├─ "Book" (if status != booked)
  │  │  └─ "Archive" (if status != archived)
  │  ├─ Vendor reply display (if exists)
  │  └─ "+ Add Reply" button → expands to textarea
  └─ Full lead management workflow
```

---

## ⚠️ Potential Issues & Solutions

### Issue 1: Race Condition (User clicks multiple times)
**Solution:** `disabled={updating === enquiry.id}` prevents clicks while updating

### Issue 2: Character limits in reply
**Solution:** maxLength="500" on textarea + character counter

### Issue 3: Reply box state lost on refresh
**Solution:** Data fetched from DB on mount, so always has latest reply

### Issue 4: RLS permissions (Vendor can only update their own)
**Solution:** Supabase handles this - vendor can only see their own enquiries

### Issue 5: Mobile button layout
**Solution:** `flexDirection: "column"` stacks buttons vertically on mobile

---

## 📊 Complexity Assessment

| Component | Complexity | Risk | Time |
|-----------|-----------|------|------|
| Status buttons | Low | Low | 15 min |
| Reply textarea | Low | Low | 20 min |
| State management | Medium | Low | 15 min |
| Testing | Medium | Low | 30 min |

**Total: 2 hours**

---

## ✅ Pre-Implementation Verification

- [x] All service functions exist
- [x] Database schema has all fields
- [x] Component structure is ready
- [x] No breaking changes needed
- [x] Can be tested with existing data
- [x] Authentication not required (uses vendorId from context)
- [x] Mobile responsive by design
- [x] No external dependencies needed

---

## 🚀 Go/No-Go Decision

**✅ GO** - All prerequisites met. Ready to implement.

**Confidence Level:** 95%
**Risk Level:** Very Low
**Impact:** High (completes vendor lead management system)

---

**Prepared By:** Claude Code
**Date:** March 8, 2026
**Status:** Ready for Implementation
