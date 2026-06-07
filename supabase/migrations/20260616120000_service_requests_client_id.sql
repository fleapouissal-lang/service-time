-- Lier les demandes au compte client + matching téléphone robuste + suivi token

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS service_requests_client_id_idx
  ON public.service_requests (client_id);

-- Compare les 9 derniers chiffres (ex. 05xxxxxxxx ↔ +9665xxxxxxxx)
CREATE OR REPLACE FUNCTION public.phone_digits_match(a text, b text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  WITH da AS (
    SELECT regexp_replace(COALESCE(a, ''), '\D', '', 'g') AS d
  ),
  db AS (
    SELECT regexp_replace(COALESCE(b, ''), '\D', '', 'g') AS d
  ),
  na AS (
    SELECT CASE
      WHEN length(d) >= 9 THEN right(d, 9)
      ELSE d
    END AS suffix
    FROM da
  ),
  nb AS (
    SELECT CASE
      WHEN length(d) >= 9 THEN right(d, 9)
      ELSE d
    END AS suffix
    FROM db
  )
  SELECT na.suffix = nb.suffix
    AND length(na.suffix) >= 9
    AND length(nb.suffix) >= 9
  FROM na, nb;
$$;

CREATE OR REPLACE FUNCTION public.client_owns_request(p_customer_phone text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'client'
      AND p.is_active = true
      AND p.phone IS NOT NULL
      AND public.phone_digits_match(p_customer_phone, p.phone)
  );
$$;

-- Rattacher les demandes existantes au client (même numéro)
UPDATE public.service_requests sr
SET client_id = p.id
FROM public.profiles p
WHERE p.role = 'client'
  AND p.is_active = true
  AND p.phone IS NOT NULL
  AND sr.client_id IS NULL
  AND public.phone_digits_match(sr.customer_phone, p.phone);

DROP POLICY IF EXISTS "service_requests_client_select_own" ON public.service_requests;
CREATE POLICY "service_requests_client_select_own"
  ON public.service_requests FOR SELECT
  USING (
    (client_id = auth.uid() AND public.is_client())
    OR public.client_owns_request(customer_phone)
  );

DROP POLICY IF EXISTS "request_status_history_client_select" ON public.request_status_history;
CREATE POLICY "request_status_history_client_select"
  ON public.request_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.service_requests r
      WHERE r.id = request_id
        AND (
          (r.client_id = auth.uid() AND public.is_client())
          OR public.client_owns_request(r.customer_phone)
        )
    )
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
DECLARE
  v_client_id uuid := NULL;
BEGIN
  IF public.is_client() THEN
    v_client_id := auth.uid();
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
    description,
    service_type,
    execution_method,
    status,
    client_id
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
    v_client_id
  )
  RETURNING service_requests.id, service_requests.tracking_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_request_by_tracking_token(p_token text)
RETURNS SETOF public.service_requests
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.service_requests
  WHERE lower(trim(tracking_token)) = lower(trim(p_token))
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_request_status_history_by_token(p_token text)
RETURNS SETOF public.request_status_history
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT h.*
  FROM public.request_status_history h
  INNER JOIN public.service_requests r ON r.id = h.request_id
  WHERE lower(trim(r.tracking_token)) = lower(trim(p_token))
  ORDER BY h.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.phone_digits_match(text, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.create_service_request(
  text, text, text, text, text,
  public.service_type, public.execution_method,
  double precision, double precision
) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
