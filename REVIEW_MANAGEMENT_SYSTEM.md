# Review Management System Documentation

## Overview

Complete backend and admin review management system with moderation, bulk actions, soft delete, and comprehensive search/filter capabilities.

## Components Built

### 1. Backend Service (`src/services/adminReviewService.js`)

Complete API layer for review management operations:

#### Review Operations
- `fetchAdminReviews()` - Fetch with filtering, searching, pagination
- `getReviewById()` - Get single review details
- `updateReview()` - Update review text, ratings, status
- `approveReview()` - Set status to approved + publish
- `rejectReview()` - Set status to rejected with notes
- `softDeleteReview()` - Soft delete (keep in DB for records)
- `hardDeleteReview()` - Permanent deletion (use cautiously)

#### Bulk Operations
- `bulkApproveReviews()` - Approve multiple reviews at once
- `bulkRejectReviews()` - Reject multiple reviews at once
- `bulkSoftDeleteReviews()` - Soft delete multiple reviews at once

#### Analytics
- `getReviewStats()` - Get dashboard statistics (total, pending, approved, rejected, by entity type)

### 2. Admin UI Component (`src/pages/AdminDashboard/ReviewsModule.jsx`)

Full-featured review management interface integrated into AdminDashboard.

#### Features

**Dashboard Stats**
- Total reviews count
- Pending reviews count
- Approved reviews count
- Rejected reviews count
- Breakdown by entity type

**Filtering & Search**
- Filter by Status: All, Pending, Approved, Rejected
- Filter by Entity Type: All, Venue, Blog, Showcase
- Full-text search: Search across reviewer name, email, review text

**Review Management**
- View all review details: Title, text, ratings, reviewer info, status
- Edit review text inline
- Approve/Reject individual reviews
- Soft delete individual reviews
- Bulk actions: Select multiple reviews, approve/reject/delete in batch
- Pagination: 20 reviews per page

**Review Details Display**
- Reviewer name, email, location
- Review title and text (with edit capability)
- Star rating (1-4 stars)
- Entity type badge
- Moderation status badge with color coding:
  - Pending: Orange
  - Approved: Green
  - Rejected: Red

### 3. Database Migration

Migration file: `supabase/migrations/20260314_add_soft_delete_to_reviews.sql`

Adds to reviews table:
- `deleted_at` TIMESTAMPTZ - Timestamp when soft deleted
- `deletion_reason` TEXT - Optional reason for deletion
- Index on `deleted_at` for efficient filtering

### 4. AdminDashboard Integration

- Reviews tab in main navigation (★ icon)
- Seamless integration with existing admin panels
- Consistent styling and theme usage

## How to Use

### Access Reviews Management

1. Navigate to Admin Dashboard
2. Click the "Reviews" tab (★ icon)
3. You'll see the reviews management interface

### Filter Reviews

Use the filters at the top:
- **Status Filter**: Select pending, approved, or rejected
- **Entity Type Filter**: Select venue, blog, or showcase
- **Search**: Type to search by reviewer name, email, or review text

### Manage Individual Reviews

For each review, you can:
- **Approve**: Click "Approve" to set status and publish
- **Reject**: Click "Reject" to decline the review
- **Edit**: Click "Edit" to update the review text
- **Delete**: Click "Delete" to soft delete (removes from public view)

### Bulk Actions

1. Click checkboxes next to reviews to select them
2. Use bulk action buttons:
   - **Approve Selected**: Approve all selected reviews
   - **Reject Selected**: Reject all selected reviews
   - **Delete Selected**: Soft delete all selected reviews
3. Select All checkbox to select all reviews on current page

### Delete Strategy

- **Soft Delete (Default)**: Reviews are marked deleted but kept in database
  - Removed from public view
  - Kept for admin records and audit trail
  - Can be restored by removing deletion timestamp
  - Recommended for compliance and record-keeping

- **Hard Delete (Use Cautiously)**: Permanently removes review from database
  - Cannot be recovered
  - Only use if absolutely necessary
  - Available in backend service

## Data Tracked

For each review, the system tracks:

**Reviewer Information**
- Name (editable by admin)
- Email (verified)
- Location (optional)

**Review Content**
- Title
- Text/body
- Images (base64 encoded)
- Sub-ratings (Setting, Service, Food, Value)
- Overall rating (1-4 stars)

**Review Status**
- Moderation status: pending | approved | rejected
- Published at (auto-set on approval)
- Admin notes (added during moderation)

**Entity Tracking**
- Entity type: venue | blog | showcase
- Entity ID (which specific venue/blog/showcase)

**Audit Trail**
- Created at (timestamp)
- Updated at (timestamp)
- Deleted at (timestamp, if soft deleted)
- Deletion reason (if applicable)

## API Endpoints Available

All operations go through the service layer which uses Supabase RLS policies.

### Query Parameters

```javascript
fetchAdminReviews({
  status: 'pending' | 'approved' | 'rejected' | null,
  entityType: 'venue' | 'blog' | 'showcase' | null,
  searchQuery: 'search text',
  limit: 50,
  offset: 0
})
```

### Response Format

```javascript
{
  reviews: Array<Review>,
  total: number
}
```

## Security Considerations

1. **RLS Policies**: All operations respect Supabase Row Level Security
2. **Admin Only**: Reviews module only accessible to admin users
3. **Soft Delete**: Provides audit trail without permanent data loss
4. **Validation**: Server-side validation on all updates
5. **Search**: Protected against injection via parameterized queries

## Future Enhancements

Potential additions to consider:

- [ ] Review response feature (venue replies to reviews)
- [ ] Flag/report abusive reviews
- [ ] Review templates for rejection reasons
- [ ] Email notifications on review submissions
- [ ] Review analytics dashboard
- [ ] Export reviews to CSV
- [ ] Automated spam detection
- [ ] Review moderation workflow automation

## Implementation Notes

### Field Names in Database

The system uses snake_case for database fields:
- `reviewer_name`
- `reviewer_email`
- `reviewer_location`
- `review_title`
- `review_text`
- `overall_rating`
- `sub_ratings` (JSONB)
- `moderation_status`
- `entity_type`
- `entity_id`
- `deleted_at`
- `deletion_reason`
- `created_at`
- `updated_at`

### Component Props

ReviewsModule requires no props - it's fully self-contained and handles all state management internally.

### Styling

The component uses the theme context colors:
- Gold for accents
- Red for errors/rejects
- Green for approvals
- Standard admin panel colors for backgrounds

## Troubleshooting

**Reviews not loading?**
- Check that user is admin
- Verify Supabase is connected
- Check browser console for errors

**Bulk actions not working?**
- Ensure reviews are selected (checkboxes checked)
- Check that moderation_status matches the action

**Soft deleted reviews still showing?**
- Clear browser cache
- The filter explicitly checks `is('deleted_at', null)`
- Hard delete if needed (backend service only)

## Testing Checklist

- [ ] Filter by status (pending, approved, rejected)
- [ ] Filter by entity type (venue, blog, showcase)
- [ ] Search by reviewer name
- [ ] Search by reviewer email
- [ ] Search by review text
- [ ] Approve single review
- [ ] Reject single review
- [ ] Delete single review
- [ ] Edit review text
- [ ] Select multiple reviews
- [ ] Bulk approve
- [ ] Bulk reject
- [ ] Bulk delete
- [ ] Pagination works
- [ ] Stats update after actions
- [ ] Verify soft deleted reviews don't appear in filters

## Support

For issues or questions about the review management system, refer to:
- `src/services/adminReviewService.js` - Backend logic
- `src/pages/AdminDashboard/ReviewsModule.jsx` - UI component
- Database schema: reviews table in Supabase
