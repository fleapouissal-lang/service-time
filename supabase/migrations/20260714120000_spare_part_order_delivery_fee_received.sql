-- Delivery fee (manual, set by admin) + client "received" confirmation status

ALTER TYPE public.spare_part_order_status ADD VALUE IF NOT EXISTS 'received';

ALTER TABLE public.spare_part_orders
  ADD COLUMN IF NOT EXISTS delivery_fee numeric(10, 2) NOT NULL DEFAULT 0
  CHECK (delivery_fee >= 0);

COMMENT ON COLUMN public.spare_part_orders.delivery_fee IS
  'Manual shipping/delivery fee set by admin (SAR). Separate from parts total_amount.';

-- Client can confirm receipt only when order is delivered and belongs to them
CREATE OR REPLACE FUNCTION public.client_confirm_spare_part_order_received(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_client_id uuid;
  v_status public.spare_part_order_status;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'P0001';
  END IF;

  SELECT client_id, status
    INTO v_client_id, v_status
  FROM public.spare_part_orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found' USING ERRCODE = 'P0001';
  END IF;

  IF v_client_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'P0001';
  END IF;

  IF v_status IS DISTINCT FROM 'delivered'::public.spare_part_order_status THEN
    RAISE EXCEPTION 'order_not_delivered' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.spare_part_orders
  SET status = 'received',
      updated_at = now()
  WHERE id = p_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.client_confirm_spare_part_order_received(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.client_confirm_spare_part_order_received(uuid) TO authenticated;
