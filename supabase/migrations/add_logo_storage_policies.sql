-- Storage RLS policies for the `logos` bucket.
--
-- The bucket itself is created in add_workspace_profile.sql and is marked
-- public (read is open), but without these policies authenticated users
-- cannot INSERT / UPDATE / DELETE objects — the client-side upload fails
-- silently with a 403, which is why the logo preview never appears after
-- the "Upload logo" click.
--
-- Uploads are scoped to `<workspace_id>/...` and we verify the user owns
-- that workspace before allowing the write. Public SELECT is intentional
-- so the rendered <img src> works without signed URLs.

-- Read: anyone can read (bucket is public).
DROP POLICY IF EXISTS "logos_public_read" ON storage.objects;
CREATE POLICY "logos_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

-- Insert: authenticated user must own the workspace in the first path segment.
DROP POLICY IF EXISTS "logos_owner_insert" ON storage.objects;
CREATE POLICY "logos_owner_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos'
  AND EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id::text = (storage.foldername(name))[1]
      AND w.owner_user_id = auth.uid()
  )
);

-- Update: same ownership check (needed because upload uses upsert:true).
DROP POLICY IF EXISTS "logos_owner_update" ON storage.objects;
CREATE POLICY "logos_owner_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos'
  AND EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id::text = (storage.foldername(name))[1]
      AND w.owner_user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'logos'
  AND EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id::text = (storage.foldername(name))[1]
      AND w.owner_user_id = auth.uid()
  )
);

-- Delete: same ownership check (allows replacing the logo cleanly).
DROP POLICY IF EXISTS "logos_owner_delete" ON storage.objects;
CREATE POLICY "logos_owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos'
  AND EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id::text = (storage.foldername(name))[1]
      AND w.owner_user_id = auth.uid()
  )
);
