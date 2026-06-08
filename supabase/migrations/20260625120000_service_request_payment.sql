-- Paiement des demandes de service après accord sur le prix

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS payment_method public.spare_part_payment_method,
  ADD COLUMN IF NOT EXISTS payment_status public.spare_part_payment_status,
  ADD COLUMN IF NOT EXISTS payment_reference text;

UPDATE public.service_requests
SET payment_status = 'pending'::public.spare_part_payment_status
WHERE quote_status = 'accepted'::public.quote_status
  AND client_proposed_price IS NOT NULL
  AND payment_status IS NULL;

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
    payment_method = NULL,
    payment_status = 'pending'::public.spare_part_payment_status,
    payment_reference = NULL,
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
    payment_method = NULL,
    payment_status = 'pending'::public.spare_part_payment_status,
    payment_reference = NULL,
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
    AND (
      r.client_id = auth.uid()
      OR public.client_owns_request(r.customer_phone)
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_payment_state'
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_mark_service_request_paid(
  p_request_id uuid,
  p_reference text DEFAULT NULL
)
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
    payment_status = 'paid'::public.spare_part_payment_status,
    payment_reference = NULLIF(trim(p_reference), ''),
    updated_at = now()
  WHERE id = p_request_id
    AND quote_status = 'accepted'::public.quote_status
    AND agreed_price IS NOT NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_payment_state'
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.client_set_service_request_payment(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_mark_service_request_paid(uuid, text) TO authenticated;
