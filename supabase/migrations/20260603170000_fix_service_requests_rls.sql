-- Fix RLS : les visiteurs (anon) peuvent créer une demande via RPC sécurisée
-- Exécuter dans Supabase SQL Editor

-- Fix tracking_token sans pgcrypto (gen_random_uuid est natif)
CREATE OR REPLACE FUNCTION public.generate_tracking_token()
RETURNS text
LANGUAGE sql
AS $$
  SELECT replace(gen_random_uuid()::text, '-', '');
$$;

-- ---------------------------------------------------------------------------
-- RPC : créer une demande (bypass RLS pour insert + return tracking_token)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_service_request(
  p_customer_name text,
  p_customer_phone text,
  p_car_type text,
  p_location_text text,
  p_description text,
  p_service_type public.service_type,
  p_execution_method public.execution_method
)
RETURNS TABLE (id uuid, tracking_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.service_requests sr
    WHERE sr.customer_phone = p_customer_phone
      AND sr.service_type = p_service_type
      AND sr.created_at > now() - interval '15 minutes'
  ) THEN
    RAISE EXCEPTION 'duplicate_request'
      USING ERRCODE = 'P0001',
            MESSAGE = 'تم إرسال طلب مشابه مؤخراً';
  END IF;

  RETURN QUERY
  INSERT INTO public.service_requests (
    customer_name,
    customer_phone,
    car_type,
    location_text,
    description,
    service_type,
    execution_method,
    status
  )
  VALUES (
    p_customer_name,
    p_customer_phone,
    NULLIF(trim(p_car_type), ''),
    NULLIF(trim(p_location_text), ''),
    NULLIF(trim(p_description), ''),
    p_service_type,
    p_execution_method,
    'received'
  )
  RETURNING service_requests.id, service_requests.tracking_token;
END;
$$;

-- Rollback si échec upload photo
CREATE OR REPLACE FUNCTION public.delete_service_request_draft(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.service_requests
  WHERE id = p_request_id
    AND status = 'received'
    AND created_at > now() - interval '10 minutes';
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_service_request(
  text, text, text, text, text,
  public.service_type, public.execution_method
) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.delete_service_request_draft(uuid)
  TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Policies explicites pour anon (insert direct si besoin)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "service_requests_public_insert" ON public.service_requests;
CREATE POLICY "service_requests_public_insert"
  ON public.service_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "request_photos_public_insert" ON public.request_photos;
CREATE POLICY "request_photos_public_insert"
  ON public.request_photos
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "request_photos_storage_insert" ON storage.objects;
CREATE POLICY "request_photos_storage_insert"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'request-photos');
