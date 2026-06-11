-- Fix invalid RAISE syntax in create_service_request (MESSAGE specified twice).
-- Symptom in app: "RAISE option already specified: MESSAGE"

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
  p_client_proposed_price numeric DEFAULT NULL
)
RETURNS TABLE (id uuid, tracking_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id uuid;
  v_price numeric(10, 2);
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_client() THEN
    RAISE EXCEPTION 'client_required' USING ERRCODE = '42501';
  END IF;

  v_client_id := auth.uid();
  v_price := NULLIF(p_client_proposed_price, 0);

  IF EXISTS (
    SELECT 1
    FROM public.service_requests sr
    WHERE sr.customer_phone = p_customer_phone
      AND sr.service_type = p_service_type
      AND sr.created_at > now() - interval '15 minutes'
  ) THEN
    RAISE EXCEPTION 'تم إرسال طلب مشابه مؤخراً' USING ERRCODE = 'P0001';
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
    status,
    client_id,
    client_proposed_price,
    quote_status
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
    'received',
    v_client_id,
    v_price,
    CASE
      WHEN v_price IS NOT NULL THEN 'pending_admin'::public.quote_status
      ELSE NULL
    END
  )
  RETURNING service_requests.id, service_requests.tracking_token;
END;
$$;

REVOKE ALL ON FUNCTION public.create_service_request(
  text, text, text, text, text,
  public.service_type, public.execution_method,
  double precision, double precision, numeric
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_service_request(
  text, text, text, text, text,
  public.service_type, public.execution_method,
  double precision, double precision, numeric
) TO authenticated, service_role;
