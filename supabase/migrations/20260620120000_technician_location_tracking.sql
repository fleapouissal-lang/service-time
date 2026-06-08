-- Live technician GPS for order tracking (anon via token, clients via RLS)

CREATE OR REPLACE FUNCTION public.get_technician_location_for_tracking(p_token text)
RETURNS TABLE (
  lat double precision,
  lng double precision,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tl.lat, tl.lng, tl.updated_at
  FROM public.service_requests r
  INNER JOIN public.technician_locations tl
    ON tl.technician_id = r.assigned_technician_id
  WHERE lower(trim(r.tracking_token)) = lower(trim(p_token))
    AND r.assigned_technician_id IS NOT NULL
    AND r.status IN ('on_the_way', 'arrived')
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_technician_location_for_tracking(text)
  TO anon, authenticated;

DROP POLICY IF EXISTS "technician_locations_client_select_assigned"
  ON public.technician_locations;

CREATE POLICY "technician_locations_client_select_assigned"
  ON public.technician_locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.service_requests r
      WHERE r.assigned_technician_id = technician_locations.technician_id
        AND r.client_id = auth.uid()
        AND r.status IN ('on_the_way', 'arrived')
    )
  );

NOTIFY pgrst, 'reload schema';
