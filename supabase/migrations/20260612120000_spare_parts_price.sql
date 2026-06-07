-- Prix des pièces détachées + snapshot dans les commandes

ALTER TABLE public.spare_parts
  ADD COLUMN IF NOT EXISTS price numeric(10, 2) NOT NULL DEFAULT 0
  CHECK (price >= 0);

COMMENT ON COLUMN public.spare_parts.price IS 'Prix en SAR';

ALTER TABLE public.spare_part_order_items
  ADD COLUMN IF NOT EXISTS price_snapshot numeric(10, 2) NOT NULL DEFAULT 0
  CHECK (price_snapshot >= 0);

CREATE OR REPLACE FUNCTION public.create_spare_part_order(
  p_notes text,
  p_items jsonb
)
RETURNS TABLE (id uuid, order_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id uuid;
  v_order_id uuid;
  v_token text;
  v_item jsonb;
  v_part_id uuid;
  v_qty integer;
  v_part public.spare_parts%ROWTYPE;
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

  INSERT INTO public.spare_part_orders (client_id, notes, status)
  VALUES (v_client_id, NULLIF(trim(p_notes), ''), 'pending')
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
    FROM public.spare_parts
    WHERE id = v_part_id AND is_active = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'part_unavailable'
        USING ERRCODE = 'P0001',
              MESSAGE = 'قطعة غير متاحة';
    END IF;

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
  END LOOP;

  RETURN QUERY SELECT v_order_id, v_token;
END;
$$;

NOTIFY pgrst, 'reload schema';
