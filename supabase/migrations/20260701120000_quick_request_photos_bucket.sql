-- Bucket dédié aux photos des طلبات سريعة (quick requests)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quick-request-photos',
  'quick-request-photos',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "quick_request_photos_admin_select" ON storage.objects;
CREATE POLICY "quick_request_photos_admin_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'quick-request-photos'
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "quick_request_photos_admin_delete" ON storage.objects;
CREATE POLICY "quick_request_photos_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'quick-request-photos'
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "quick_request_photos_service_insert" ON storage.objects;
CREATE POLICY "quick_request_photos_service_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'quick-request-photos');

DROP POLICY IF EXISTS "quick_request_photos_service_update" ON storage.objects;
CREATE POLICY "quick_request_photos_service_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'quick-request-photos')
  WITH CHECK (bucket_id = 'quick-request-photos');

NOTIFY pgrst, 'reload schema';
