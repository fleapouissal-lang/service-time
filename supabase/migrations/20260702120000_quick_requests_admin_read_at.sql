-- Statut lu par l'admin pour les demandes rapides

ALTER TABLE public.quick_requests
  ADD COLUMN IF NOT EXISTS admin_read_at timestamptz;

CREATE INDEX IF NOT EXISTS quick_requests_admin_read_at_idx
  ON public.quick_requests (admin_read_at);

NOTIFY pgrst, 'reload schema';
