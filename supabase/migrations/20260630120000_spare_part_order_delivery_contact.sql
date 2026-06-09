-- Coordonnées client + adresse de livraison sur commande pièces détachées

ALTER TABLE public.spare_part_orders
  ADD COLUMN IF NOT EXISTS customer_full_name text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS delivery_address text;

CREATE OR REPLACE FUNCTION public.create_spare_part_order(
  p_notes text,
  p_items jsonb,
  p_payment_method text DEFAULT 'cash_on_delivery',
  p_customer_full_name text DEFAULT NULL,
  p_customer_phone text DEFAULT NULL,
  p_customer_email text DEFAULT NULL,
  p_delivery_address text DEFAULT NULL
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

  IF NULLIF(trim(p_customer_full_name), '') IS NULL
    OR char_length(trim(p_customer_full_name)) < 2 THEN
    RAISE EXCEPTION 'customer_name_required' USING ERRCODE = 'P0001';
  END IF;

  IF NULLIF(trim(p_customer_phone), '') IS NULL THEN
    RAISE EXCEPTION 'customer_phone_required' USING ERRCODE = 'P0001';
  END IF;

  IF NULLIF(trim(p_customer_email), '') IS NULL
    OR position('@' in trim(p_customer_email)) = 0 THEN
    RAISE EXCEPTION 'customer_email_required' USING ERRCODE = 'P0001';
  END IF;

  IF NULLIF(trim(p_delivery_address), '') IS NULL
    OR char_length(trim(p_delivery_address)) < 5 THEN
    RAISE EXCEPTION 'delivery_address_required' USING ERRCODE = 'P0001';
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
    payment_status,
    customer_full_name,
    customer_phone,
    customer_email,
    delivery_address
  )
  VALUES (
    v_client_id,
    NULLIF(trim(p_notes), ''),
    'pending',
    v_payment_method,
    'pending',
    trim(p_customer_full_name),
    trim(p_customer_phone),
    lower(trim(p_customer_email)),
    trim(p_delivery_address)
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

GRANT EXECUTE ON FUNCTION public.create_spare_part_order(
  text,
  jsonb,
  text,
  text,
  text,
  text,
  text
) TO authenticated;

NOTIFY pgrst, 'reload schema';
