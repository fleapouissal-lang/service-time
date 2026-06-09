-- Correctifs sécurité restants : RAISE SQL, INSERT publics, RPC

-- ---------------------------------------------------------------------------
-- 1. create_service_request — fix RAISE duplicate MESSAGE
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

-- ---------------------------------------------------------------------------
-- 2. create_spare_part_order — fix RAISE duplicate MESSAGE
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_spare_part_order(
  p_notes text,
  p_items jsonb,
  p_payment_method text DEFAULT 'cash_on_delivery'
)
RETURNS TABLE (id uuid, order_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_client_id uuid;
  v_order_id uuid;
  v_token text;
  v_item jsonb;
  v_part_id uuid;
  v_qty integer;
  v_part public.spare_parts%ROWTYPE;
  v_total numeric(10, 2) := 0;
  v_payment_method public.spare_part_payment_method;
BEGIN
  v_client_id := auth.uid();

  IF v_client_id IS NULL OR NOT public.is_client() THEN
    RAISE EXCEPTION 'يجب تسجيل الدخول كعميل' USING ERRCODE = 'P0001';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'السلة فارغة' USING ERRCODE = 'P0001';
  END IF;

  IF p_payment_method = 'online' THEN
    v_payment_method := 'online';
  ELSE
    v_payment_method := 'cash_on_delivery';
  END IF;

  INSERT INTO public.spare_part_orders (
    client_id,
    notes,
    status,
    payment_method,
    payment_status
  )
  VALUES (
    v_client_id,
    NULLIF(trim(p_notes), ''),
    'pending',
    v_payment_method,
    'pending'
  )
  RETURNING spare_part_orders.id, spare_part_orders.order_token
  INTO v_order_id, v_token;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_part_id := (v_item ->> 'spare_part_id')::uuid;
    v_qty := (v_item ->> 'quantity')::integer;

    IF v_part_id IS NULL OR v_qty IS NULL OR v_qty < 1 OR v_qty > 99 THEN
      RAISE EXCEPTION 'عنصر غير صالح في السلة' USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_part
    FROM public.spare_parts sp
    WHERE sp.id = v_part_id AND sp.is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'قطعة غير متاحة' USING ERRCODE = 'P0001';
    END IF;

    IF v_part.stock_quantity < v_qty THEN
      RAISE EXCEPTION USING
        ERRCODE = 'P0001',
        MESSAGE = format('الكمية غير كافية في المخزون: %s', v_part.name_ar);
    END IF;

    UPDATE public.spare_parts sp
    SET stock_quantity = sp.stock_quantity - v_qty
    WHERE sp.id = v_part_id;

    INSERT INTO public.spare_part_order_items (
      order_id,
      spare_part_id,
      quantity,
      name_snapshot,
      category_snapshot,
      img_snapshot,
      price_snapshot
    )
    VALUES (
      v_order_id,
      v_part_id,
      v_qty,
      v_part.name_ar,
      v_part.category,
      COALESCE(v_part.img, v_part.image_url),
      v_part.price
    );

    v_total := v_total + (v_part.price * v_qty);
  END LOOP;

  UPDATE public.spare_part_orders o
  SET total_amount = v_total
  WHERE o.id = v_order_id;

  RETURN QUERY SELECT v_order_id, v_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_spare_part_order_paid(
  p_order_id uuid,
  p_payment_reference text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_order public.spare_part_orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order
  FROM public.spare_part_orders o
  WHERE o.id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_order.client_id <> auth.uid() OR NOT public.is_client() THEN
    RAISE EXCEPTION 'غير مصرح' USING ERRCODE = 'P0001';
  END IF;

  IF v_order.payment_method <> 'online' OR v_order.payment_status = 'paid' THEN
    RETURN false;
  END IF;

  UPDATE public.spare_part_orders o
  SET
    payment_status = 'paid',
    payment_reference = NULLIF(trim(p_payment_reference), '')
  WHERE o.id = p_order_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_spare_part_order_paid(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_spare_part_order_paid(uuid, text) TO service_role;

-- ---------------------------------------------------------------------------
-- 3. Fermer les INSERT publics (spam via clé anon Supabase)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "quick_requests_public_insert" ON public.quick_requests;
DROP POLICY IF EXISTS "contact_messages_public_insert" ON public.contact_messages;

REVOKE INSERT ON public.quick_requests FROM anon, authenticated;
REVOKE INSERT ON public.contact_messages FROM anon, authenticated;

NOTIFY pgrst, 'reload schema';
