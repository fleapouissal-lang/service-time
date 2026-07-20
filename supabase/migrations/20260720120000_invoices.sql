-- Factures : créées auto quand service → in_progress / spare parts → confirmed
-- Visibles client uniquement après validation admin

CREATE TYPE public.invoice_status AS ENUM ('pending', 'validated');

CREATE TYPE public.invoice_source_type AS ENUM (
  'service_request',
  'spare_part_order'
);

CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  source_type public.invoice_source_type NOT NULL,
  service_request_id uuid UNIQUE REFERENCES public.service_requests (id) ON DELETE CASCADE,
  spare_part_order_id uuid UNIQUE REFERENCES public.spare_part_orders (id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_phone text,
  amount numeric(12, 2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  status public.invoice_status NOT NULL DEFAULT 'pending',
  validated_at timestamptz,
  validated_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invoices_source_check CHECK (
    (
      source_type = 'service_request'
      AND service_request_id IS NOT NULL
      AND spare_part_order_id IS NULL
    )
    OR (
      source_type = 'spare_part_order'
      AND spare_part_order_id IS NOT NULL
      AND service_request_id IS NULL
    )
  )
);

CREATE INDEX invoices_client_idx ON public.invoices (client_id);
CREATE INDEX invoices_status_idx ON public.invoices (status);
CREATE INDEX invoices_created_idx ON public.invoices (created_at DESC);
CREATE INDEX invoices_source_type_idx ON public.invoices (source_type);

CREATE TRIGGER invoices_set_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_admin_all"
  ON public.invoices FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Client : uniquement les factures validées qui lui appartiennent
CREATE POLICY "invoices_client_select_validated"
  ON public.invoices FOR SELECT
  USING (
    public.is_client()
    AND client_id = auth.uid()
    AND status = 'validated'
  );

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'INV-'
    || to_char(timezone('utc', now()), 'YYYYMMDD')
    || '-'
    || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_invoice_for_service_request(p_request_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.service_requests%ROWTYPE;
  v_invoice_id uuid;
  v_amount numeric(12, 2);
BEGIN
  SELECT * INTO v_req
  FROM public.service_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF v_req.status NOT IN (
    'in_progress',
    'on_the_way',
    'arrived',
    'completed'
  ) THEN
    RETURN NULL;
  END IF;

  SELECT i.id INTO v_invoice_id
  FROM public.invoices i
  WHERE i.service_request_id = p_request_id;

  IF FOUND THEN
    RETURN v_invoice_id;
  END IF;

  v_amount := COALESCE(
    v_req.agreed_price,
    v_req.admin_counter_price,
    v_req.client_proposed_price,
    0
  );

  INSERT INTO public.invoices (
    invoice_number,
    source_type,
    service_request_id,
    client_id,
    customer_name,
    customer_phone,
    amount,
    status
  )
  VALUES (
    public.generate_invoice_number(),
    'service_request',
    v_req.id,
    v_req.client_id,
    COALESCE(NULLIF(trim(v_req.customer_name), ''), '—'),
    v_req.customer_phone,
    v_amount,
    'pending'
  )
  RETURNING id INTO v_invoice_id;

  RETURN v_invoice_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_invoice_for_spare_part_order(p_order_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.spare_part_orders%ROWTYPE;
  v_invoice_id uuid;
  v_amount numeric(12, 2);
  v_client_name text;
BEGIN
  SELECT * INTO v_order
  FROM public.spare_part_orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF v_order.status NOT IN (
    'confirmed',
    'preparing',
    'ready',
    'delivered',
    'received'
  ) THEN
    RETURN NULL;
  END IF;

  SELECT i.id INTO v_invoice_id
  FROM public.invoices i
  WHERE i.spare_part_order_id = p_order_id;

  IF FOUND THEN
    -- Keep amount in sync for pending invoices when delivery fee changes
    IF (
      SELECT status FROM public.invoices WHERE id = v_invoice_id
    ) = 'pending' THEN
      v_amount := COALESCE(v_order.total_amount, 0)
        + COALESCE(v_order.delivery_fee, 0);
      UPDATE public.invoices
      SET amount = v_amount
      WHERE id = v_invoice_id;
    END IF;
    RETURN v_invoice_id;
  END IF;

  SELECT COALESCE(
    NULLIF(trim(v_order.customer_full_name), ''),
    NULLIF(trim(p.full_name), ''),
    '—'
  )
  INTO v_client_name
  FROM public.profiles p
  WHERE p.id = v_order.client_id;

  v_amount := COALESCE(v_order.total_amount, 0)
    + COALESCE(v_order.delivery_fee, 0);

  INSERT INTO public.invoices (
    invoice_number,
    source_type,
    spare_part_order_id,
    client_id,
    customer_name,
    customer_phone,
    amount,
    status
  )
  VALUES (
    public.generate_invoice_number(),
    'spare_part_order',
    v_order.id,
    v_order.client_id,
    COALESCE(v_client_name, '—'),
    COALESCE(v_order.customer_phone, (
      SELECT phone FROM public.profiles WHERE id = v_order.client_id
    )),
    v_amount,
    'pending'
  )
  RETURNING id INTO v_invoice_id;

  RETURN v_invoice_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_service_request_ensure_invoice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status IN ('in_progress', 'on_the_way', 'arrived', 'completed') THEN
    PERFORM public.ensure_invoice_for_service_request(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER service_requests_ensure_invoice
  AFTER UPDATE OF status ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_service_request_ensure_invoice();

CREATE OR REPLACE FUNCTION public.trg_spare_part_order_ensure_invoice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status IN (
       'confirmed',
       'preparing',
       'ready',
       'delivered',
       'received'
     ) THEN
    PERFORM public.ensure_invoice_for_spare_part_order(NEW.id);
  ELSIF NEW.delivery_fee IS DISTINCT FROM OLD.delivery_fee
     AND NEW.status IN (
       'confirmed',
       'preparing',
       'ready',
       'delivered',
       'received'
     ) THEN
    PERFORM public.ensure_invoice_for_spare_part_order(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER spare_part_orders_ensure_invoice
  AFTER UPDATE OF status, delivery_fee ON public.spare_part_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_spare_part_order_ensure_invoice();

GRANT EXECUTE ON FUNCTION public.generate_invoice_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_invoice_for_service_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_invoice_for_spare_part_order(uuid) TO authenticated;
