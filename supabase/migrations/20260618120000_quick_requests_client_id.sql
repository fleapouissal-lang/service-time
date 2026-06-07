-- Lier les demandes rapides au compte client

ALTER TABLE public.quick_requests
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS quick_requests_client_id_idx
  ON public.quick_requests (client_id);

NOTIFY pgrst, 'reload schema';
