-- Commandes de pièces détachées (panier /spare-parts)

CREATE TYPE public.spare_part_order_status AS ENUM (
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'delivered',
  'cancelled'
);

CREATE TABLE public.spare_part_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status public.spare_part_order_status NOT NULL DEFAULT 'pending',
  notes text,
  order_token text NOT NULL UNIQUE DEFAULT public.generate_tracking_token(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX spare_part_orders_client_idx ON public.spare_part_orders (client_id);
CREATE INDEX spare_part_orders_status_idx ON public.spare_part_orders (status);
CREATE INDEX spare_part_orders_created_idx ON public.spare_part_orders (created_at DESC);

CREATE TRIGGER spare_part_orders_set_updated_at
  BEFORE UPDATE ON public.spare_part_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.spare_part_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.spare_part_orders (id) ON DELETE CASCADE,
  spare_part_id uuid NOT NULL REFERENCES public.spare_parts (id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0 AND quantity <= 99),
  name_snapshot text NOT NULL,
  category_snapshot text,
  img_snapshot text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, spare_part_id)
);

CREATE INDEX spare_part_order_items_order_idx ON public.spare_part_order_items (order_id);

ALTER TABLE public.spare_part_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spare_part_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "spare_part_orders_client_select_own"
  ON public.spare_part_orders FOR SELECT
  USING (client_id = auth.uid() AND public.is_client());

CREATE POLICY "spare_part_orders_admin_all"
  ON public.spare_part_orders FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "spare_part_order_items_client_select_own"
  ON public.spare_part_order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.spare_part_orders o
      WHERE o.id = order_id
        AND o.client_id = auth.uid()
        AND public.is_client()
    )
  );

CREATE POLICY "spare_part_order_items_admin_all"
  ON public.spare_part_order_items FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

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
      img_snapshot
    )
    VALUES (
      v_order_id,
      v_part_id,
      v_qty,
      v_part.name_ar,
      v_part.category,
      COALESCE(v_part.img, v_part.image_url)
    );
  END LOOP;

  RETURN QUERY SELECT v_order_id, v_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_spare_part_order(text, jsonb) TO authenticated;

NOTIFY pgrst, 'reload schema';
