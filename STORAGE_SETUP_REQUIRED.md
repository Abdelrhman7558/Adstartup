# Supabase Storage Buckets Setup Required

## Important: Manual Storage Bucket Creation

Before using the file upload features, you need to create two storage buckets in your Supabase dashboard.

### Steps to Create Storage Buckets:

1. **Log in to Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Navigate to Storage**
   - Click "Storage" in the left sidebar
   - Click "New bucket" button

3. **Create Bucket #1: user-assets**
   - Name: `user-assets`
   - Public bucket: ✅ Yes (enable)
   - File size limit: Set as needed (e.g., 50 MB)
   - Allowed MIME types: Leave empty to allow all types
   - Click "Create bucket"

4. **Create Bucket #2: campaign-files**
   - Name: `campaign-files`
   - Public bucket: ✅ Yes (enable)
   - File size limit: Set as needed (e.g., 100 MB)
   - Allowed MIME types: Leave empty to allow all types
   - Click "Create bucket"

### Set Up Bucket Policies (RLS for Storage):

For both buckets, you need to set up Row Level Security policies:

#### For `user-assets` bucket:

```sql
-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own files
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### For `campaign-files` bucket:

```sql
-- Allow authenticated users to upload files to their own campaigns
CREATE POLICY "Users can upload to own campaigns"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'campaign-files' AND
  (storage.foldername(name))[1] = 'campaigns' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow users to view their own campaign files
CREATE POLICY "Users can view own campaign files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'campaign-files' AND
  (storage.foldername(name))[1] = 'campaigns' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow users to delete their own campaign files
CREATE POLICY "Users can delete own campaign files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'campaign-files' AND
  (storage.foldername(name))[1] = 'campaigns' AND
  (storage.foldername(name))[2] = auth.uid()::text
);
```

### To Apply Storage Policies:

1. In Supabase Dashboard, go to "Storage"
2. Click on the bucket name (e.g., `user-assets`)
3. Click on "Policies" tab
4. Click "New Policy"
5. Choose "Custom" or "Create a new policy"
6. Paste the policy SQL and save
7. Repeat for all policies and both buckets

### Alternative: Apply via SQL Editor

1. Go to "SQL Editor" in Supabase Dashboard
2. Click "New query"
3. Paste all the policies above
4. Click "Run"

### Verify Setup:

After creating buckets and policies, verify they work:

1. Log in to your app
2. Navigate to Assets page
3. Try uploading a file
4. Check if the file appears in the list
5. Try deleting a file

If you encounter permission errors:
- Check that buckets are created with correct names
- Verify RLS policies are applied
- Ensure buckets are set to "Public"
- Check browser console for detailed errors

---

**Status**: ⚠️ Manual Setup Required
**Priority**: High (required for file uploads)
**Time Needed**: 5-10 minutes
