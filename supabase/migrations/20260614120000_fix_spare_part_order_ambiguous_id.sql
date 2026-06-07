-- Fix: RETURNS TABLE (id ...) shadowed bare "id" in WHERE clauses

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
    RAISE EXCEPTION 'client_required'
      USING ERRCODE = 'P0001',
            MESSAGE = 'يجب تسجيل الدخول كعميل';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'empty_cart'
      USING ERRCODE = 'P0001',
            MESSAGE = 'السلة فارغة';
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
      RAISE EXCEPTION 'invalid_item'
        USING ERRCODE = 'P0001',
              MESSAGE = 'عنصر غير صالح في السلة';
    END IF;

    SELECT * INTO v_part
    FROM public.spare_parts sp
    WHERE sp.id = v_part_id AND sp.is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'part_unavailable'
        USING ERRCODE = 'P0001',
              MESSAGE = 'قطعة غير متاحة';
    END IF;

    IF v_part.stock_quantity < v_qty THEN
      RAISE EXCEPTION 'insufficient_stock'
        USING ERRCODE = 'P0001',
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
    RAISE EXCEPTION 'forbidden'
      USING ERRCODE = 'P0001',
            MESSAGE = 'غير مصرح';
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

GRANT EXECUTE ON FUNCTION public.create_spare_part_order(text, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_spare_part_order_paid(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
