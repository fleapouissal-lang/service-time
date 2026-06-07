-- Demandes rapides depuis /request?mode=quick (sans compte)

CREATE TABLE IF NOT EXISTS public.quick_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  message text NOT NULL,
  photo_storage_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quick_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quick_requests_public_insert" ON public.quick_requests;
CREATE POLICY "quick_requests_public_insert"
  ON public.quick_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "quick_requests_admin_select" ON public.quick_requests;
CREATE POLICY "quick_requests_admin_select"
  ON public.quick_requests
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

GRANT ALL ON public.quick_requests TO service_role;
GRANT ALL ON public.quick_requests TO postgres;

NOTIFY pgrst, 'reload schema';
