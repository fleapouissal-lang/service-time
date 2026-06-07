-- Photos de profil (client, technicien, admin)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

ALTER TABLE public.client_verification_codes
  ADD COLUMN IF NOT EXISTS avatar_storage_path text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-avatars',
  'profile-avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "profile_avatars_public_read" ON storage.objects;
CREATE POLICY "profile_avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-avatars');

DROP POLICY IF EXISTS "profile_avatars_insert" ON storage.objects;
CREATE POLICY "profile_avatars_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-avatars');

DROP POLICY IF EXISTS "profile_avatars_update" ON storage.objects;
CREATE POLICY "profile_avatars_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'profile-avatars')
  WITH CHECK (bucket_id = 'profile-avatars');

DROP POLICY IF EXISTS "profile_avatars_delete" ON storage.objects;
CREATE POLICY "profile_avatars_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'profile-avatars');
