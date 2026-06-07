-- RPC create_service_request (avec coordonnées GPS)
-- À exécuter dans Supabase SQL Editor si « nv demande » échoue.

CREATE OR REPLACE FUNCTION public.generate_tracking_token()
RETURNS text
LANGUAGE sql
AS $$
  SELECT replace(gen_random_uuid()::text, '-', '');
$$;

-- Supprimer les anciennes signatures
DROP FUNCTION IF EXISTS public.create_service_request(
  text, text, text, text, text,
  public.service_type, public.execution_method
);

DROP FUNCTION IF EXISTS public.create_service_request(
  text, text, text, text, text,
  public.service_type, public.execution_method,
  double precision, double precision
);

CREATE OR REPLACE FUNCTION public.create_service_request(
  p_customer_name text,
  p_customer_phone text,
  p_car_type text,
  p_location_text text,
  p_description text,
  p_service_type public.service_type,
  p_execution_method public.execution_method,
  p_location_lat double precision DEFAULT NULL,
  p_location_lng double precision DEFAULT NULL
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
    location_lat,
    location_lng,
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
    p_location_lat,
    p_location_lng,
    NULLIF(trim(p_description), ''),
    p_service_type,
    p_execution_method,
    'received'
  )
  RETURNING service_requests.id, service_requests.tracking_token;
END;
$$;

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
  public.service_type, public.execution_method,
  double precision, double precision
) TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.delete_service_request_draft(uuid)
  TO anon, authenticated, service_role;

-- Policies anon/authenticated (si absentes)
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

-- Recharger le cache PostgREST
NOTIFY pgrst, 'reload schema';
