-- Chemin Supabase Storage pour l'avatar (bucket profile-avatars).
-- avatar_url reste l'URL publique ; avatar_storage_path sert au proxy /api/profile-avatar.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_storage_path text;

COMMENT ON COLUMN public.profiles.avatar_storage_path IS
  'Storage path in profile-avatars bucket, e.g. {user_id}/avatar.jpg';

-- Rétro-remplissage depuis avatar_url quand possible
UPDATE public.profiles
SET avatar_storage_path = regexp_replace(
  avatar_url,
  '^.*/storage/v1/object/public/profile-avatars/',
  ''
)
WHERE avatar_url IS NOT NULL
  AND btrim(avatar_url) <> ''
  AND (avatar_storage_path IS NULL OR btrim(avatar_storage_path) = '')
  AND avatar_url LIKE '%/profile-avatars/%';

NOTIFY pgrst, 'reload schema';
