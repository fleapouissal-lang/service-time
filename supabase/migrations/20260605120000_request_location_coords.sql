-- Store GPS coordinates on service requests (optional, from /request form)

DROP FUNCTION IF EXISTS public.create_service_request(
  text, text, text, text, text,
  public.service_type, public.execution_method
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

GRANT EXECUTE ON FUNCTION public.create_service_request(
  text, text, text, text, text,
  public.service_type, public.execution_method,
  double precision, double precision
) TO anon, authenticated;
