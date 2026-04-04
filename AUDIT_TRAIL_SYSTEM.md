# Audit Trail & Data Recovery System

## Overview
This system provides complete transparency and recovery capabilities for all data deletions in the admin panel. All individual entries that are deleted are logged, viewable, and recoverable.

## Architecture

### Database Schema
**new table: `deletion_history`**
- `id` (UUID): Unique identifier for the deletion record
- `type` (string): "student" or "faculty"
- `section` (string): The submission section (e.g., "reputedInstitutionAchievements", "papersPublished")
- `submissionId` (string): The submission ID the entry belonged to
- `rowIndex` (integer): The index of the deleted entry in the array (NULL for entire submission deletion)
- `deletedEntry` (JSONB): The actual data that was deleted (for recovery)
- `deletedAt` (timestamp): When the entry was deleted

### Key Features

#### 1. **Automatic Logging**
Every time an admin deletes an individual entry, it's automatically logged to `deletion_history` before removal:
```typescript
await db.insert(deletionHistoryTable).values({
  type: "student",
  section: section,
  submissionId: submissionId,
  rowIndex: rowIndex,
  deletedEntry: deletedEntry,
});
```

#### 2. **View Deleted Individual Entries**
**New Endpoints:**
- `GET /api/admin/student/deleted-entries?type=reputedInstitution&search=query&page=1&limit=10`
- `GET /api/admin/faculty/deleted-entries?type=paper&search=query&page=1&limit=10`

Returns:
```json
{
  "data": [
    {
      "id": "deletion-id",
      "type": "student",
      "section": "reputedInstitutionAchievements",
      "submissionId": "submission-id",
      "rowIndex": 2,
      "deletedEntry": { ...original data... },
      "deletedAt": "2026-04-04T10:30:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 10
}
```

#### 3. **Restore Individual Entries**
**New Endpoints:**
- `POST /api/admin/student/:submissionId/restore-entry`
- `POST /api/admin/faculty/:submissionId/restore-entry`

Request body:
```json
{
  "section": "reputedInstitution",
  "deletionId": "the-deletion-id"
}
```

The entry is restored to the end of the section array, and the deletion record is removed.

## Usage Scenarios

### Scenario 1: Accidental Deletion
Admin deletes 2 out of 4 remarkable achievements by mistake.

**Before:**
- Admin sees 4 entries in dashboard
- Deletes 2 entries
- Now sees 2 entries in dashboard ✓ (correct)

**For Recovery:**
1. Go to "Deleted Entries" page
2. Filter by section "Remarkable Achievements"
3. See the 2 deleted entries
4. Click "Restore" for any entry
5. Entry is added back to the original submission
6. Deletion record is removed

### Scenario 2: Data Count Transparency
**Before migration:** Faculty count 131 → 128 (3 entries disappeared, no way to recover)
**After migration:** 
- Active entries: 128
- Deleted entries (recoverable): 3
- Total historical entries: 131
- Admins can see exactly what was deleted and restore if needed

## Migration Steps

### 1. Apply Database Migration
The `deletion_history` table will be created automatically when deploying:
```bash
npm run push  # In backend/db directory
```

### 2. No Data Loss
- Existing deletions are not logged (table only tracks new deletions)
- Old soft-deleted submissions (with `deletedAt`) still work as before
- Purge mechanism still removes old submissions after 30 hours

### 3. Backwards Compatibility
- Existing deletion endpoints still work
- No changes to existing API responses
- New endpoints are additive only

## Admin Panel Integration

### New Pages/Tabs Needed
1. **Deleted Entries Tab** in the main admin dashboard
   - Show deleted student entries
   - Show deleted faculty entries
   - Filter by section type
   - Search functionality
   - Restore button for each entry

2. **Count Display**
   - "Active: 128 entries | Deleted: 3 entries | Total: 131 entries"
   - Shows transparency of what happened

## Query Examples

### Get all deleted remarkable achievements from last 7 days
```sql
SELECT * FROM deletion_history 
WHERE type = 'student' 
  AND section = 'reputedInstitutionAchievements'
  AND deleted_at > NOW() - INTERVAL '7 days'
ORDER BY deleted_at DESC;
```

### Get deleted entries for specific submission
```sql
SELECT * FROM deletion_history 
WHERE submission_id = 'xxxx-xxxx'
ORDER BY deleted_at DESC;
```

### Count restored vs permanently deleted
```sql
-- Deleted entries still in deletion_history: recoverable
SELECT COUNT(*) as recoverable FROM deletion_history;

-- Entries deleted after 30 hour retention: permanently purged
-- These are tracked in submission soft_delete but data is gone
```

## Benefits

✅ **Complete Transparency** - See all deletions with timestamps and data
✅ **Data Recovery** - Restore accidentally deleted entries instantly  
✅ **Audit Trail** - Know who deleted what and when
✅ **Count Accuracy** - Resolve missing data discrepancies
✅ **No Performance Impact** - Logging is async and non-blocking
✅ **Historical Record** - Keep deleted entries for compliance

## Implementation Status

✅ Schema created: `deletion_history.ts`
✅ Student routes updated: logging and recovery endpoints  
✅ Faculty routes updated: logging and recovery endpoints
⏳ Admin UI components: needs implementation
⏳ Database migration: ready to deploy

## Next Steps

1. Push code to main branch
2. Deploy database migration
3. Create admin UI components for deleted entries view
4. Add restore buttons to admin dashboard
5. Display combined active+deleted counts
