-- Medium: remove phone-based IDOR — client access via client_id only

DROP POLICY IF EXISTS "service_requests_client_select_own" ON public.service_requests;
CREATE POLICY "service_requests_client_select_own"
  ON public.service_requests FOR SELECT
  USING (client_id = auth.uid() AND public.is_client());

DROP POLICY IF EXISTS "request_status_history_client_select" ON public.request_status_history;
CREATE POLICY "request_status_history_client_select"
  ON public.request_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.service_requests r
      WHERE r.id = request_id
        AND r.client_id = auth.uid()
        AND public.is_client()
    )
  );

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
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.service_requests sr
    WHERE sr.id = p_request_id
      AND (
        public.is_admin()
        OR (public.is_client() AND sr.client_id = auth.uid())
      )
  ) THEN
    RAISE EXCEPTION 'forbidden'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.request_photos (request_id, storage_path)
  VALUES (p_request_id, p_storage_path)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_request_by_tracking_token(p_token text)
RETURNS SETOF public.service_requests
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT sr.*
  FROM public.service_requests sr
  WHERE lower(trim(sr.tracking_token)) = lower(trim(p_token))
    AND (
      public.is_admin()
      OR (public.is_client() AND sr.client_id = auth.uid())
      OR (
        public.is_technician()
        AND sr.assigned_technician_id = auth.uid()
      )
    )
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_request_status_history_by_token(p_token text)
RETURNS SETOF public.request_status_history
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT h.*
  FROM public.request_status_history h
  INNER JOIN public.service_requests sr ON sr.id = h.request_id
  WHERE lower(trim(sr.tracking_token)) = lower(trim(p_token))
    AND (
      public.is_admin()
      OR (public.is_client() AND sr.client_id = auth.uid())
      OR (
        public.is_technician()
        AND sr.assigned_technician_id = auth.uid()
      )
    )
  ORDER BY h.created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_technician_location_for_tracking(p_token text)
RETURNS TABLE (
  lat double precision,
  lng double precision,
  updated_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT tl.lat, tl.lng, tl.updated_at
  FROM public.service_requests sr
  INNER JOIN public.technician_locations tl
    ON tl.technician_id = sr.assigned_technician_id
  WHERE lower(trim(sr.tracking_token)) = lower(trim(p_token))
    AND sr.assigned_technician_id IS NOT NULL
    AND sr.status IN ('on_the_way', 'arrived')
    AND (
      public.is_admin()
      OR (public.is_client() AND sr.client_id = auth.uid())
      OR (
        public.is_technician()
        AND sr.assigned_technician_id = auth.uid()
      )
    )
  LIMIT 1;
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
    payment_method = NULL,
    payment_status = 'pending'::public.spare_part_payment_status,
    payment_reference = NULL,
    updated_at = now()
  WHERE r.id = p_request_id
    AND r.quote_status = 'admin_countered'::public.quote_status
    AND r.admin_counter_price IS NOT NULL
    AND r.client_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_quote_state'
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.client_set_service_request_payment(
  p_request_id uuid,
  p_payment_method text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_method public.spare_part_payment_method;
BEGIN
  IF NOT public.is_client() THEN
    RAISE EXCEPTION 'unauthorized'
      USING ERRCODE = '42501';
  END IF;

  IF p_payment_method = 'online' THEN
    v_method := 'online'::public.spare_part_payment_method;
  ELSIF p_payment_method = 'cash_on_delivery' THEN
    v_method := 'cash_on_delivery'::public.spare_part_payment_method;
  ELSE
    RAISE EXCEPTION 'invalid_payment_method'
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.service_requests r
  SET
    payment_method = v_method,
    payment_status = 'pending'::public.spare_part_payment_status,
    payment_reference = NULL,
    updated_at = now()
  WHERE r.id = p_request_id
    AND r.quote_status = 'accepted'::public.quote_status
    AND r.agreed_price IS NOT NULL
    AND (r.payment_status IS DISTINCT FROM 'paid'::public.spare_part_payment_status)
    AND r.client_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_payment_state'
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.client_owns_request(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.client_owns_request(text) FROM authenticated;

NOTIFY pgrst, 'reload schema';
