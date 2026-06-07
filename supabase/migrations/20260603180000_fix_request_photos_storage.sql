-- Bucket request-photos + RPC attach photo (si pas déjà fait)
-- Exécuter dans Supabase SQL Editor

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'request-photos',
  'request-photos',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE OR REPLACE FUNCTION public.attach_request_photo(
  p_request_id uuid,
  p_storage_path text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.service_requests WHERE id = p_request_id) THEN
    RAISE EXCEPTION 'request_not_found';
  END IF;

  INSERT INTO public.request_photos (request_id, storage_path)
  VALUES (p_request_id, p_storage_path)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.attach_request_photo(uuid, text)
  TO anon, authenticated, service_role;
