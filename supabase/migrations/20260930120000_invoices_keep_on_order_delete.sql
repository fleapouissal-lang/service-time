-- Keep invoices when the order they were issued for is deleted.
-- Previously both foreign keys used ON DELETE CASCADE, so deleting a service
-- request or a spare-part order silently erased its invoice (accounting record).
-- Invoices already snapshot customer_name, customer_phone and amount, so they
-- stay readable once the link to the order is cleared.

-- 1. Replace the two cascading foreign keys with ON DELETE SET NULL.
DO $$
DECLARE
  fk record;
BEGIN
  FOR fk IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_attribute att
      ON att.attrelid = con.conrelid AND att.attnum = ANY (con.conkey)
    WHERE con.conrelid = 'public.invoices'::regclass
      AND con.contype = 'f'
      AND att.attname IN ('service_request_id', 'spare_part_order_id')
  LOOP
    EXECUTE format('ALTER TABLE public.invoices DROP CONSTRAINT %I', fk.conname);
  END LOOP;
END $$;

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_service_request_id_fkey
  FOREIGN KEY (service_request_id)
  REFERENCES public.service_requests (id) ON DELETE SET NULL;

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_spare_part_order_id_fkey
  FOREIGN KEY (spare_part_order_id)
  REFERENCES public.spare_part_orders (id) ON DELETE SET NULL;

-- 2. The old CHECK required the linked order id to be NOT NULL, which would
--    reject SET NULL. Keep the rule that an invoice never points at both kinds.
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_source_check;

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_source_check CHECK (
    (source_type = 'service_request' AND spare_part_order_id IS NULL)
    OR (source_type = 'spare_part_order' AND service_request_id IS NULL)
  );
