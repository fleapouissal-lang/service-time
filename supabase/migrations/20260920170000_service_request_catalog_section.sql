-- Persist catalog section on service requests for admin order queues

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS catalog_category text,
  ADD COLUMN IF NOT EXISTS catalog_sub text;

CREATE INDEX IF NOT EXISTS service_requests_catalog_category_idx
  ON public.service_requests (catalog_category);

-- Recreate create_service_request with catalog fields
DROP FUNCTION IF EXISTS public.create_service_request(
  text, text, text, text, text,
  public.service_type, public.execution_method,
  double precision, double precision, numeric,
  text, double precision, double precision, boolean
);

DROP FUNCTION IF EXISTS public.create_service_request(
  text, text, text, text, text,
  public.service_type, public.execution_method,
  double precision, double precision, numeric,
  text, double precision, double precision, boolean,
  text, text
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
  p_location_lng double precision DEFAULT NULL,
  p_client_proposed_price numeric DEFAULT NULL,
  p_destination_text text DEFAULT NULL,
  p_destination_lat double precision DEFAULT NULL,
  p_destination_lng double precision DEFAULT NULL,
  p_await_ops_quote boolean DEFAULT false,
  p_catalog_category text DEFAULT NULL,
  p_catalog_sub text DEFAULT NULL
)
RETURNS TABLE (id uuid, tracking_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id uuid := NULL;
  v_price numeric(10, 2);
  v_quote public.quote_status;
BEGIN
  IF public.is_client() THEN
    v_client_id := auth.uid();
  END IF;

  v_price := NULLIF(p_client_proposed_price, 0);

  IF v_price IS NOT NULL THEN
    v_quote := 'pending_admin'::public.quote_status;
  ELSIF p_await_ops_quote THEN
    v_quote := 'pending_admin'::public.quote_status;
  ELSE
    v_quote := NULL;
  END IF;

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
    destination_text,
    destination_lat,
    destination_lng,
    description,
    service_type,
    execution_method,
    status,
    client_id,
    client_proposed_price,
    quote_status,
    catalog_category,
    catalog_sub
  )
  VALUES (
    p_customer_name,
    p_customer_phone,
    NULLIF(trim(p_car_type), ''),
    NULLIF(trim(p_location_text), ''),
    p_location_lat,
    p_location_lng,
    NULLIF(trim(p_destination_text), ''),
    p_destination_lat,
    p_destination_lng,
    NULLIF(trim(p_description), ''),
    p_service_type,
    p_execution_method,
    'received',
    v_client_id,
    v_price,
    v_quote,
    NULLIF(lower(trim(p_catalog_category)), ''),
    NULLIF(trim(p_catalog_sub), '')
  )
  RETURNING service_requests.id, service_requests.tracking_token;
END;
$$;

REVOKE ALL ON FUNCTION public.create_service_request(
  text, text, text, text, text,
  public.service_type, public.execution_method,
  double precision, double precision, numeric,
  text, double precision, double precision, boolean,
  text, text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_service_request(
  text, text, text, text, text,
  public.service_type, public.execution_method,
  double precision, double precision, numeric,
  text, double precision, double precision, boolean,
  text, text
) TO authenticated;

-- Best-effort backfill from description prefixes used by the catalog form
UPDATE public.service_requests
SET catalog_category = 'flatbed'
WHERE catalog_category IS NULL
  AND (
    destination_text IS NOT NULL
    OR description ILIKE '%سطحة%'
    OR description ILIKE '%flatbed%'
    OR description ILIKE '%tow%'
  );

UPDATE public.service_requests
SET catalog_category = 'breakdown_accidents'
WHERE catalog_category IS NULL
  AND service_type = 'emergency'
  AND (
    description ILIKE '%أعطال%'
    OR description ILIKE '%حوادث%'
    OR description ILIKE '%breakdown%'
    OR description ILIKE '%accident%'
  );

UPDATE public.service_requests
SET catalog_category = 'external_tracking'
WHERE catalog_category IS NULL
  AND (
    description ILIKE '%متابعة طلبات خارجية%'
    OR description ILIKE '%external%'
  );

UPDATE public.service_requests
SET catalog_category = 'mobile_maintenance'
WHERE catalog_category IS NULL
  AND service_type = 'periodic_maintenance'
  AND execution_method = 'mobile_workshop';

UPDATE public.service_requests
SET catalog_category = 'general_maintenance'
WHERE catalog_category IS NULL
  AND service_type = 'periodic_maintenance'
  AND execution_method = 'workshop_visit';

UPDATE public.service_requests
SET catalog_category = 'breakdown_accidents'
WHERE catalog_category IS NULL
  AND service_type = 'emergency';
