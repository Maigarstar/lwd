# Couple Authentication Implementation - Phase 4 Complete ✅

## Overview
Phase 4 implements secure couple login, protected dashboards, and persistent shortlist/enquiry tracking for the LWD platform. Couples authenticate to use Aura chat, manage shortlists, and track vendor replies.

**Architecture Principle**: Single source of truth for enquiries via vendor_enquiries table (no duplication with separate couple_enquiries). Couples and vendors query the same table with RLS enforcing data isolation.

## Architecture

### New Files Created

1. **src/services/coupleAuthService.js**
   - `signupCouple(email, password, firstName, lastName)` - Create couple account
   - `loginCouple(email, password)` - Authenticate couple
   - `logoutCouple()` - Clear session
   - `getCurrentCouple()` - Get authenticated couple's record
   - `getSession()` - Returns current auth session
   - `onAuthStateChange(callback)` - Listens for auth state changes
   - All functions return `{ data, error }` tuple pattern

2. **src/context/CoupleAuthContext.jsx**
   - `CoupleAuthProvider` - Wraps entire app at root level
   - `useCoupleAuth()` - Hook to access auth state in components
   - Provides: `couple`, `user`, `isAuthenticated`, `loading`, `error`, `signup()`, `login()`, `logout()`, `clearError()`
   - Persists session across page reloads via Supabase auth storage
   - Subscribes to auth state changes for real-time updates

3. **src/pages/CoupleSignup.jsx**
   - Multi-step signup form: email/password → personal details → confirmation
   - Creates couple account via Supabase Auth
   - Creates couple record in database
   - Redirects to dashboard on success
   - Link to login page for existing couples

4. **src/pages/CoupleLogin.jsx**
   - Email/password login form
   - Error message display with red background
   - Loading state while authenticating
   - Redirects to dashboard on success
   - Link to signup page for new couples

5. **src/components/ProtectedCoupleRoute.jsx**
   - Route protection wrapper component
   - Shows loading state while checking authentication
   - Redirects unauthenticated users to `/couple/login`
   - Renders children only if authenticated

### Modified Files

1. **src/pages/GettingMarriedDashboard.jsx**
   - Added `useCoupleAuth()` hook integration
   - Checks authentication before rendering
   - Shows loading screen during auth check
   - Redirects to login if not authenticated
   - Displays couple name in dashboard header
   - Added logout button in header

2. **src/components/AuraChat.jsx**
   - Added `useCoupleAuth()` hook integration
   - Shows login prompt if couple not authenticated
   - "Sign in to use Aura chat" message with link to login
   - Only renders chat interface if authenticated
   - Shows "Logging in..." during auth check

3. **src/main.jsx**
   - Added `CoupleAuthProvider` import
   - Added `CoupleSignup` and `CoupleLogin` imports
   - Wrapped entire app with `CoupleAuthProvider` (inside VendorAuthProvider)
   - Updated `stateToPath()` with couple auth routes
   - Updated `pathToState()` to parse couple auth subroutes
   - Added state: `coupleLoginEmail` for signup flow
   - Added navigation functions: `goCoupleSingup()`, `goCoupleLogin()`
   - Added conditional rendering for couple signup/login pages
   - Updated shortlist provider context for couple-scoped data

4. **src/context/ShortlistContext.jsx**
   - Modified to support both anonymous (device-based) and authenticated (couple-based) shortlists
   - When couple authenticated: Load/save from couple_shortlists table
   - When anonymous: Continue using device_id-based storage
   - Migrate shortlist to database on couple signup/login
   - Merge device shortlist with couple shortlist on first login

## Database Schema

### couples table (Supabase)
Stores couple profile data linked to Supabase Auth.
```sql
CREATE TABLE couples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,       -- Foreign key to auth.users(id)
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  event_date DATE,                     -- Wedding date
  guest_count INT,                     -- Expected guests
  created_at TIMESTAMP,
  updated_at TIMESTAMP,

  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
```

### couple_shortlists table (Supabase)
Stores couple's saved vendors (persistent shortlist from heart button).
```sql
CREATE TABLE couple_shortlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL,
  vendor_id TEXT NOT NULL,             -- Vendor legacy_vendor_id ("vdr-1")
  saved_at TIMESTAMP,

  CONSTRAINT fk_couple FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE,
  CONSTRAINT uq_couple_vendor UNIQUE (couple_id, vendor_id)  -- Prevents duplicate saves
);
```

### vendor_enquiries table (Updated)
**Single source of truth** for enquiries used by vendor dashboard, couple dashboard, and admin dashboard.

Added to existing table:
```sql
ALTER TABLE vendor_enquiries ADD COLUMN couple_id UUID;
ALTER TABLE vendor_enquiries ADD CONSTRAINT fk_vendor_enquiries_couple
  FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE SET NULL;
```

Now vendor_enquiries contains:
- `vendor_id` - Which vendor received the enquiry
- `couple_id` - Which couple submitted it
- `status` - Pipeline status (new/replied/booked/archived)
- All existing fields (message, guest_count, budget_range, event_date, etc.)

**No separate couple_enquiries table** - Vendors and couples query the same enquiries table.

### RLS Policies

**couples table:**
- Couples can read their own record (user_id = auth.uid())
- Couples can update their own record (user_id = auth.uid())

**couple_shortlists table:**
- Couples can insert saved vendors (shortlist)
- Couples can read their own shortlist (couple_id matches)
- Couples can delete from their own shortlist
- UNIQUE constraint prevents duplicate saves per couple

**vendor_enquiries table (updated):**
- Couples can read their own enquiries (couple_id = their couples.id)
- Couples can insert enquiries (anyone can submit)
- Vendors can read their own enquiries (vendor_id matches their legacy_vendor_id)
- Vendors can update their own enquiries (reply, status change)

## User Flows

### 1. Couple Signup
1. Couple navigates to `/couple/signup`
2. Enters email + password
3. Enters first name, last name, event date, guest count
4. System creates auth user + couple record
5. Couple logged in automatically
6. Redirected to `/couple/dashboard`

### 2. Couple Login
1. Couple navigates to `/couple/login`
2. Enters email + password
3. System authenticates with Supabase Auth
4. Couple logged in, device shortlist merged with database
5. On success: redirected to `/couple/dashboard`

### 3. Aura Chat Access
1. Couple navigates to Aura chat component
2. If not authenticated: shows "Sign in to use Aura" message
3. Couple clicks "Sign in" → redirected to `/couple/login`
4. After login: Aura chat interface available

### 4. Shortlist Management
1. Anonymous couple adds vendor to shortlist → stored via device_id in localStorage
2. Couple creates account/logs in → device shortlist migrates to couple_shortlists table
3. Future shortlist actions → saved to couple_shortlists database (enforced UNIQUE constraint prevents duplicate saves)
4. Shortlist persists across devices once authenticated
5. Getting Married Dashboard queries couple_shortlists for saved vendors

### 5. Enquiry Tracking
1. Couple submits enquiry via VendorContactForm → saved to vendor_enquiries with couple_id
2. Couple Dashboard queries vendor_enquiries WHERE couple_id = couples.id
3. Vendor Dashboard queries vendor_enquiries WHERE vendor_id = their vendor_id
4. Admin Dashboard queries all vendor_enquiries
5. **Single table, multiple views** - no duplication

## Routes

| Route | Component | Auth Required | Purpose |
|-------|-----------|---|---------|
| `/couple/signup` | CoupleSignup | No | Email/password signup form |
| `/couple/login` | CoupleLogin | No | Email/password login form |
| `/couple/dashboard` | GettingMarriedDashboard | Yes | Protected dashboard showing couple's shortlists and enquiries |

## Differences from Vendor Auth (Phase 3.1)

- **Open Signup**: Couples use self-service signup (no invite tokens)
- **Persistent Data**: Shortlists tracked in couple_shortlists; enquiries tracked in vendor_enquiries (shared table, not duplicated)
- **Chat Gating**: Aura chat requires authentication (couples must login to use)
- **Device Migration**: Merge anonymous (device-based) shortlist with couple account on first login
- **Personal Info**: Couples provide first/last name, event date, guest count at signup
- **Single Source of Truth**: vendor_enquiries used by vendor dashboard, couple dashboard, and admin dashboard with RLS enforcing isolation

## Testing Checklist

### Signup Flow
- [ ] Navigate to `/couple/signup`
- [ ] Enter email + password
- [ ] Enter first name, last name, event date, guest count
- [ ] Submit → account created, couple logged in automatically
- [ ] Redirected to `/couple/dashboard`
- [ ] Dashboard shows couple name in header

### Login Flow
- [ ] Navigate to `/couple/login`
- [ ] Enter email + password from signup
- [ ] Submit → authenticated, redirected to `/couple/dashboard`
- [ ] Dashboard accessible, shortlists visible

### Aura Chat Access
- [ ] Try to use Aura chat without login → shows "Sign in" message
- [ ] Click "Sign in" → redirected to `/couple/login`
- [ ] After login, Aura chat interface available

### Shortlist Migration
- [ ] As anonymous couple: add 3 vendors to shortlist (stored via device_id)
- [ ] Create account + login → device shortlist migrated to database
- [ ] Close tab, reopen → shortlist still present (persisted)
- [ ] Add new vendor while logged in → added to database

### Logout
- [ ] Click logout in dashboard → session clears, redirected to `/couple/login`
- [ ] Try accessing `/couple/dashboard` → redirected to login
- [ ] Anonymous shortlist not accessible after logout (device reset)

### Session Persistence
- [ ] Log in, reload page → still authenticated
- [ ] Close tab, reopen, navigate to dashboard → still logged in
- [ ] Clear auth token from storage → logged out on reload

---

**Created**: March 2026
**Status**: ✅ Complete & Ready for Testing
**Branch**: claude/magical-montalcini
