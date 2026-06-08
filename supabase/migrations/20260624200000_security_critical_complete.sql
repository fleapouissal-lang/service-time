-- Complete critical security fixes (RPC auth, tracking, storage, create_service_request)

-- ---------------------------------------------------------------------------
-- 6. create_service_request — authenticated clients only
-- ---------------------------------------------------------------------------
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
    RAISE EXCEPTION 'client_required'
      USING ERRCODE = '42501';
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

-- Drop legacy overload without price param (if present)
DROP FUNCTION IF EXISTS public.create_service_request(
  text, text, text, text, text,
  public.service_type, public.execution_method,
  double precision, double precision
);

-- ---------------------------------------------------------------------------
-- 7. attach_request_photo — owner / admin only
-- ---------------------------------------------------------------------------
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
        OR (public.is_client() AND public.client_owns_request(sr.customer_phone))
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

REVOKE ALL ON FUNCTION public.attach_request_photo(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.attach_request_photo(uuid, text)
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 8. Tracking RPCs — authenticated + ownership only
-- ---------------------------------------------------------------------------
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
      OR (
        public.is_client()
        AND (
          sr.client_id = auth.uid()
          OR public.client_owns_request(sr.customer_phone)
        )
      )
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
      OR (
        public.is_client()
        AND (
          sr.client_id = auth.uid()
          OR public.client_owns_request(sr.customer_phone)
        )
      )
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
      OR (
        public.is_client()
        AND (
          sr.client_id = auth.uid()
          OR public.client_owns_request(sr.customer_phone)
        )
      )
      OR (
        public.is_technician()
        AND sr.assigned_technician_id = auth.uid()
      )
    )
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.get_request_by_tracking_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_request_status_history_by_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_technician_location_for_tracking(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_request_by_tracking_token(text)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_request_status_history_by_token(text)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_technician_location_for_tracking(text)
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 9. mark_spare_part_order_paid — service role only (webhook uses direct update)
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.mark_spare_part_order_paid(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_spare_part_order_paid(uuid, text) TO service_role;

-- ---------------------------------------------------------------------------
-- 10. Storage — block anonymous uploads
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "request_photos_storage_insert" ON storage.objects;
CREATE POLICY "request_photos_storage_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'request-photos'
    AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "profile_avatars_insert" ON storage.objects;
CREATE POLICY "profile_avatars_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "profile_avatars_update" ON storage.objects;
CREATE POLICY "profile_avatars_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'profile-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "profile_avatars_delete" ON storage.objects;
CREATE POLICY "profile_avatars_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

NOTIFY pgrst, 'reload schema';
