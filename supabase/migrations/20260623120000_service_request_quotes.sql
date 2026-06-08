-- Price negotiation for service requests (client proposal → admin accept/counter → client accept)

DO $$
BEGIN
  CREATE TYPE public.quote_status AS ENUM (
    'pending_admin',
    'admin_countered',
    'accepted',
    'declined'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS client_proposed_price numeric(10, 2),
  ADD COLUMN IF NOT EXISTS admin_counter_price numeric(10, 2),
  ADD COLUMN IF NOT EXISTS agreed_price numeric(10, 2),
  ADD COLUMN IF NOT EXISTS quote_status public.quote_status;

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
  v_client_id uuid := NULL;
  v_price numeric(10, 2);
BEGIN
  IF public.is_client() THEN
    v_client_id := auth.uid();
  END IF;

  v_price := NULLIF(p_client_proposed_price, 0);

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

CREATE OR REPLACE FUNCTION public.admin_accept_client_quote(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'unauthorized'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.service_requests
  SET
    agreed_price = client_proposed_price,
    admin_counter_price = NULL,
    quote_status = 'accepted'::public.quote_status,
    updated_at = now()
  WHERE id = p_request_id
    AND client_proposed_price IS NOT NULL
    AND quote_status IN (
      'pending_admin'::public.quote_status,
      'admin_countered'::public.quote_status
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_quote_state'
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

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
    AND client_proposed_price IS NOT NULL
    AND quote_status IN (
      'pending_admin'::public.quote_status,
      'admin_countered'::public.quote_status
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_quote_state'
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.client_accept_counter_quote(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_client() THEN
    RAISE EXCEPTION 'unauthorized'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.service_requests r
  SET
    agreed_price = r.admin_counter_price,
    quote_status = 'accepted'::public.quote_status,
    updated_at = now()
  WHERE r.id = p_request_id
    AND r.quote_status = 'admin_countered'::public.quote_status
    AND r.admin_counter_price IS NOT NULL
    AND (
      r.client_id = auth.uid()
      OR public.client_owns_request(r.customer_phone)
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_quote_state'
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_accept_client_quote(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_counter_service_quote(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.client_accept_counter_quote(uuid) TO authenticated;
