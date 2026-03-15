# Vendor Authentication Implementation - Phase 3.1 Complete ✅

## Overview
Phase 3.1 implements secure vendor login, protected dashboards, and RLS-based data isolation for the LWD platform. This is a focused V1 scope - secure authentication only, deferring profile editing and team management to v2.

## Architecture

### New Files Created

1. **src/services/vendorAuthService.js**
   - `loginVendor(email, password)` - Authenticates vendor with Supabase Auth
   - `logoutVendor()` - Clears Supabase session
   - `getCurrentVendor()` - Gets authenticated vendor's record
   - `activateVendor(token, password)` - Validates activation token, sets password
   - `getSession()` - Returns current auth session
   - `onAuthStateChange(callback)` - Listens for auth state changes
   - All functions return `{ data, error }` tuple pattern

2. **src/context/VendorAuthContext.jsx**
   - `VendorAuthProvider` - Wraps entire app at root level
   - `useVendorAuth()` - Hook to access auth state in components
   - Provides: `vendor`, `user`, `isAuthenticated`, `loading`, `error`, `login()`, `logout()`, `activate()`, `clearError()`
   - Persists session across page reloads via Supabase auth storage
   - Subscribes to auth state changes for real-time updates

3. **src/pages/VendorLogin.jsx**
   - Email/password login form
   - Error message display with red background
   - Loading state while authenticating
   - Redirects to dashboard on success
   - Link to activation page for new vendors

4. **src/pages/VendorActivate.jsx**
   - Invitation activation page with URL token extraction
   - Validates token (exists, not expired, not already activated)
   - Form: email (read-only pre-filled), password, confirm password
   - Password validation: >= 8 characters, passwords must match
   - Shows error state for invalid/expired tokens
   - Redirects to login after successful activation

5. **src/components/ProtectedVendorRoute.jsx**
   - Route protection wrapper component
   - Shows loading state while checking authentication
   - Redirects unauthenticated users to `/vendor/login`
   - Renders children only if authenticated

### Modified Files

1. **src/pages/VendorDashboard.jsx**
   - Removed React Router `useNavigate` dependency
   - Added `useVendorAuth()` hook integration
   - Checks authentication before rendering
   - Shows loading screen during auth check
   - Redirects to login if not authenticated
   - Added logout button in header (red button with hover effect)
   - Logout button calls `logout()` and redirects to login
   - All existing dashboard functionality preserved

2. **src/main.jsx**
   - Added `VendorAuthProvider` import
   - Added `VendorLogin` and `VendorActivate` imports
   - Wrapped entire app with `VendorAuthProvider` (outermost provider)
   - Updated `stateToPath()` with vendor auth routes:
     - `"vendor-login"` → `/vendor/login`
     - `"vendor-activate"` → `/vendor/activate?token=...`
   - Updated `pathToState()` to parse vendor auth subroutes with token extraction
   - Added state: `activationToken` for activation flow
   - Added navigation functions: `goVendorLogin()`, `goVendorActivate(token)`
   - Added conditional rendering for vendor login/activate pages
   - Updated AuraChat exclusion to exclude vendor auth pages
   - Passed `onVendorLogin` callback to VendorDashboard

## Database Schema

### vendors table (Supabase)
```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY,           -- Primary key (UUID)
  legacy_vendor_id TEXT UNIQUE,  -- "vdr-1", "vdr-13" (backward compatibility)
  user_id UUID NOT NULL UNIQUE,  -- Foreign key to auth.users(id)
  email TEXT NOT NULL UNIQUE,    -- Vendor email
  activation_token TEXT UNIQUE,  -- Invitation token (one-time use)
  activation_token_expires_at TIMESTAMP,  -- Token expiration (7 days)
  is_activated BOOLEAN,          -- Account activation status
  created_at TIMESTAMP,          -- Account creation time
  updated_at TIMESTAMP           -- Last update time
);
```

### RLS Policies

**vendors table:**
- Vendors can read their own record (user_id = auth.uid())
- Vendors can update their own record (user_id = auth.uid())

**vendor_enquiries table:**
- Vendors can read/update only their own enquiries (vendor_id matched via legacy_vendor_id)
- Couples can insert enquiries (anonymous users)
- Service role can read all (for admin dashboard)

## User Flows

### 1. Invitation-Based Activation (New Vendor)
1. Admin creates vendor record with activation token in Supabase
2. Admin sends activation link: `/vendor/activate?token=uuid`
3. Vendor clicks link → system validates token
4. Vendor sets password → account activated
5. Vendor redirected to `/vendor/login`

### 2. Vendor Login
1. Vendor navigates to `/vendor/login`
2. Enters email + password
3. System authenticates with Supabase Auth
4. On success: redirected to `/vendor/dashboard`
5. Dashboard shows only vendor's own enquiries (RLS enforced)

### 3. Vendor Logout
1. Vendor clicks logout button in dashboard header
2. Session cleared via `logoutVendor()`
3. Redirected to `/vendor/login`
4. Browser back button won't restore authentication

### 4. Session Persistence
1. Vendor logs in → session stored in browser (Supabase handles)
2. Vendor closes browser tab/window
3. Vendor reopens app at any URL
4. App detects existing session via `getCurrentVendor()`
5. Vendor stays logged in without re-entering credentials

## Routes

| Route | Component | Auth Required | Purpose |
|-------|-----------|---|---------|
| `/vendor/login` | VendorLogin | No | Email/password login form |
| `/vendor/activate` | VendorActivate | No | Invitation activation with token |
| `/vendor/dashboard` | VendorDashboard | Yes | Protected dashboard showing vendor's own data |

## Testing Checklist

### Pre-Requisites
- [ ] Run SUPABASE_VENDOR_AUTH_SETUP.sql in Supabase SQL Editor
- [ ] Create test vendor auth user in Supabase Dashboard
- [ ] Generate activation token and insert into vendors table

### Activation Flow
- [ ] Navigate to `/vendor/activate?token=[token]`
- [ ] Email field shows vendor email (read-only)
- [ ] Enter password (min 8 chars)
- [ ] Confirm password matches
- [ ] Submit → account activated, redirected to `/vendor/login`
- [ ] Try invalid token → shows "Invalid or expired token" error
- [ ] Try expired token → shows "Activation token has expired" error

### Login Flow
- [ ] Navigate to `/vendor/login`
- [ ] Enter email + password
- [ ] Submit → authenticated, redirected to `/vendor/dashboard`
- [ ] Dashboard header shows vendor name
- [ ] Lead inbox shows only vendor's enquiries
- [ ] Try wrong password → shows "Invalid credentials" error

### Dashboard Security
- [ ] Log in as Vendor A → see Vendor A's enquiries only
- [ ] Log out
- [ ] Log in as Vendor B → see Vendor B's enquiries only (not A's)
- [ ] Verify RLS blocks cross-vendor queries in Supabase logs

### Logout & Session
- [ ] Click logout button → session clears, redirected to login
- [ ] Try accessing `/vendor/dashboard` → redirected to `/vendor/login`
- [ ] Log in again → redirected to dashboard
- [ ] Close tab/window and reopen app → still logged in
- [ ] Manually delete auth token from browser storage → logged out on reload

### Error Handling
- [ ] Already activated account → "Account has already been activated" error
- [ ] Non-existent email → "Invalid credentials" error
- [ ] Missing password field → button disabled, form doesn't submit
- [ ] Network error → shows error message with retry option

## Code Patterns

### Using Auth Context in Components
```javascript
import { useVendorAuth } from "../context/VendorAuthContext";

export function MyComponent() {
  const { vendor, isAuthenticated, loading, logout } = useVendorAuth();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in</div>;

  return <div>Welcome, {vendor.name}!</div>;
}
```

### Navigating in VendorDashboard
```javascript
// Use callback props instead of React Router navigate
onClick={async () => {
  await logout();
  if (onVendorLogin) {
    onVendorLogin();  // Calls goVendorLogin() from main.jsx
  }
}}
```

## Important Notes

### Backward Compatibility
- `legacy_vendor_id` (TEXT "vdr-1" format) maintained throughout
- Existing vendor_enquiries queries continue using TEXT vendor_id
- RLS policies map UUID user_id → TEXT legacy_vendor_id for isolation
- No breaking changes to existing enquiry system

### Development vs. Production
- **Dev**: RLS policies include permissive "Allow all" for testing
- **Prod**: TODO - Replace with proper admin role checks in Phase 4
- Session handling automatic via Supabase Auth client
- Email invitations: Admin creates tokens manually in Supabase Dashboard

### Future Enhancements (v2+)
- ❌ Public vendor signup (use invite-only for now)
- ❌ Vendor profile editing page (planned for Phase 4)
- ❌ Team member management (planned for Phase 4)
- ❌ Password reset flow (planned for Phase 4)
- ❌ Two-factor authentication (planned for Phase 4)

## Deployment Checklist

1. **Database**
   - [ ] Run SUPABASE_VENDOR_AUTH_SETUP.sql in production Supabase
   - [ ] Verify vendors table created with RLS enabled
   - [ ] Verify vendor_enquiries RLS policies updated

2. **Environment**
   - [ ] Verify VITE_SUPABASE_URL is set in .env
   - [ ] Verify VITE_SUPABASE_ANON_KEY is set in .env
   - [ ] Test Supabase connection with simple query

3. **Testing**
   - [ ] Run all testing checklist items above
   - [ ] Test on mobile devices (responsive layout)
   - [ ] Test cross-browser compatibility

4. **Go-Live**
   - [ ] Create vendor accounts via Supabase Dashboard
   - [ ] Generate activation tokens
   - [ ] Send activation links to vendors
   - [ ] Monitor for activation/login issues
   - [ ] Provide vendor support contact

## Troubleshooting

### "Loading..." screen persists
- Check browser console for errors
- Verify Supabase credentials in .env
- Check network tab for failed requests
- Verify VendorAuthProvider wraps entire app

### Can't activate account
- Verify activation token is valid UUID format
- Check token hasn't expired (7 day limit)
- Verify vendor record exists in Supabase
- Check activation_token_expires_at is in future

### Login fails with "Invalid credentials"
- Verify email is correct (case-sensitive in some databases)
- Verify password is exactly as set during activation
- Check vendor account is activated (is_activated = TRUE)
- Check no duplicate accounts exist

### Sees other vendor's enquiries
- Check RLS policies are properly applied
- Verify legacy_vendor_id is set in vendor record
- Verify vendor_enquiries.vendor_id is TEXT not INT
- Check Supabase query logs for RLS errors

---

**Created**: March 2026
**Status**: ✅ Complete & Ready for Testing
**Branch**: claude/magical-montalcini
