-- Flatbed (سطحة): destination fields + ops can set price without client proposal

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS destination_text text,
  ADD COLUMN IF NOT EXISTS destination_lat double precision,
  ADD COLUMN IF NOT EXISTS destination_lng double precision;

-- Allow admin counter when client did not propose a price (ops-first pricing)
CREATE OR REPLACE FUNCTION public.admin_counter_service_quote(
  p_request_id uuid,
  p_counter_price numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_price numeric(10, 2);
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'unauthorized'
      USING ERRCODE = '42501';
  END IF;

  v_price := NULLIF(p_counter_price, 0);

  IF v_price IS NULL OR v_price <= 0 THEN
    RAISE EXCEPTION 'invalid_price'
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.service_requests
  SET
    admin_counter_price = v_price,
    quote_status = 'admin_countered'::public.quote_status,
    updated_at = now()
  WHERE id = p_request_id
    AND (
      quote_status IS NULL
      OR quote_status IN (
        'pending_admin'::public.quote_status,
        'admin_countered'::public.quote_status
      )
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_quote_state'
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

-- Recreate create_service_request with destination + pending_admin without client price
DROP FUNCTION IF EXISTS public.create_service_request(
  text, text, text, text, text,
  public.service_type, public.execution_method,
  double precision, double precision, numeric
);

DROP FUNCTION IF EXISTS public.create_service_request(
  text, text, text, text, text,
  public.service_type, public.execution_method,
  double precision, double precision, numeric,
  text, double precision, double precision, boolean
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
  p_await_ops_quote boolean DEFAULT false
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
    quote_status
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
    v_quote
  )
  RETURNING service_requests.id, service_requests.tracking_token;
END;
$$;

REVOKE ALL ON FUNCTION public.create_service_request(
  text, text, text, text, text,
  public.service_type, public.execution_method,
  double precision, double precision, numeric,
  text, double precision, double precision, boolean
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_service_request(
  text, text, text, text, text,
  public.service_type, public.execution_method,
  double precision, double precision, numeric,
  text, double precision, double precision, boolean
) TO authenticated;
