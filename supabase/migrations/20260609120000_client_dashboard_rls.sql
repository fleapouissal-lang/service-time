-- RLS client : lire ses propres demandes (par téléphone du profil)

CREATE OR REPLACE FUNCTION public.is_client()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'client'
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.client_owns_request(p_customer_phone text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'client'
      AND p.is_active = true
      AND p.phone IS NOT NULL
      AND regexp_replace(p_customer_phone, '\D', '', 'g')
        = regexp_replace(p.phone, '\D', '', 'g')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_client() TO authenticated;
GRANT EXECUTE ON FUNCTION public.client_owns_request(text) TO authenticated;

DROP POLICY IF EXISTS "service_requests_client_select_own" ON public.service_requests;
CREATE POLICY "service_requests_client_select_own"
  ON public.service_requests FOR SELECT
  USING (public.client_owns_request(customer_phone));

DROP POLICY IF EXISTS "request_status_history_client_select" ON public.request_status_history;
CREATE POLICY "request_status_history_client_select"
  ON public.request_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.service_requests r
      WHERE r.id = request_id
        AND public.client_owns_request(r.customer_phone)
    )
  );
