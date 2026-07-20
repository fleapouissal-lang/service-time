-- Infos entreprise client sur la facture (nom société, ICE, etc.)

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS customer_company_name text,
  ADD COLUMN IF NOT EXISTS customer_ice text,
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS customer_address text;
