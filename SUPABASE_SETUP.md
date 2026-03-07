# Supabase Setup Guide - Phase 2

This guide walks through setting up Supabase for the Luxury Wedding Directory application.

## Prerequisites

- Supabase project already created (URL and API key configured in `.env.local`)
- Access to Supabase dashboard at https://app.supabase.com

## Setup Steps

### 1. Create Database Tables

Run the SQL migrations in this order via the Supabase SQL Editor:

**Navigation**: Supabase Dashboard → Your Project → SQL Editor

#### Migration 1: Vendor Inquiries (Required for Phase 2.1)
**File**: `supabase/migrations/001_create_vendor_inquiries.sql`

Copy and paste the entire SQL content into the SQL Editor and execute:
- Creates `vendor_inquiries` table with columns for inquiry tracking
- Adds indexes on vendor_id, status, created_at for performance
- Status values: `new`, `replied`, `closed`

#### Migration 2: Email Logs (Required for Phase 2.2)
**File**: `supabase/migrations/002_create_email_logs.sql`

Copy and paste the entire SQL content into the SQL Editor and execute:
- Creates `email_logs` table for SendGrid integration tracking
- Tracks email delivery status, type, and errors
- Foreign key reference to vendor_inquiries

#### Migration 3: Real Weddings (Required for Phase 2.3)
**File**: `supabase/migrations/003_create_real_weddings.sql`

Copy and paste the entire SQL content into the SQL Editor and execute:
- Creates `real_weddings` table for wedding gallery
- Creates `real_wedding_vendors` table for vendor credits
- Stores gallery images as JSONB array

#### Migration 4: Vendor Shortlist (Required for Phase 2.4)
**File**: `supabase/migrations/004_create_vendor_shortlist.sql`

Copy and paste the entire SQL content into the SQL Editor and execute:
- Creates `vendor_shortlists` table for favorited vendors
- Unique constraint on (couple_id, vendor_id) to prevent duplicates

### 2. Verify Environment Variables

Check `.env.local` contains:
```
VITE_SUPABASE_URL=https://qpkggfibwreznussudfh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Test Connection

Run the development server:
```bash
npm run dev
```

Navigate to the vendor profile page and submit an inquiry. Check:
1. Form submits successfully (no error message)
2. Supabase Tables → vendor_inquiries shows the new record
3. Refresh page - inquiry persists (not just in localStorage)

### 4. Real-time Subscriptions (Optional)

Real-time updates are configured in `src/services/inquiryService.js`:
- `subscribeToVendorInquiries()` sets up real-time listener
- Currently used in VendorInquiryManager for live updates
- Requires Supabase real-time to be enabled (enabled by default)

## Production Checklist

- [ ] All 4 migrations run successfully
- [ ] Tables visible in Supabase Tables view
- [ ] Inquiry form saves to Supabase (not localStorage)
- [ ] Vendor can see inquiries in dashboard
- [ ] Vendor can update inquiry status
- [ ] Vendor can reply to inquiry (Phase 2.2+)
- [ ] Email notifications work (Phase 2.2+)
- [ ] Real weddings gallery loads (Phase 2.3+)
- [ ] Shortlist feature works (Phase 2.4+)

## Troubleshooting

### "Table not found" error when saving inquiry
**Problem**: vendor_inquiries table doesn't exist
**Solution**: Run Migration 1 SQL in Supabase SQL Editor

### Inquiries save to localStorage but not Supabase
**Problem**: Supabase credentials invalid or network issue
**Solution**:
1. Verify `.env.local` credentials are correct
2. Check browser console for error messages
3. Verify your IP is allowed in Supabase firewall settings

### Real-time updates not working
**Problem**: Supabase real-time disabled
**Solution**:
1. Go to Supabase Dashboard → Project Settings → Realtime
2. Ensure "Replication" is enabled for the relevant tables

## Credentials Reference

**Supabase URL**: https://qpkggfibwreznussudfh.supabase.co
**Project ID**: qpkggfibwreznussudfh
**API Key Type**: Anon key (public, safe in frontend)

## Next Steps

After setup:
1. **Phase 2.2**: Implement SendGrid email notifications
2. **Phase 2.3**: Build real weddings gallery and detail pages
3. **Phase 2.4**: Add vendor shortlist/favorites feature
4. **Phase 2.5**: Polish and performance optimization

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase SQL Guide](https://supabase.com/docs/guides/sql-overview)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
