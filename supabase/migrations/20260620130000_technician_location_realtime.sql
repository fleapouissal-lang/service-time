-- Realtime location updates + public read for active tracking

ALTER TABLE public.technician_locations REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'technician_locations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.technician_locations;
  END IF;
END $$;

DROP POLICY IF EXISTS "technician_locations_anon_select_active"
  ON public.technician_locations;

CREATE POLICY "technician_locations_anon_select_active"
  ON public.technician_locations FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1
      FROM public.service_requests r
      WHERE r.assigned_technician_id = technician_locations.technician_id
        AND r.status IN ('on_the_way', 'arrived')
    )
  );

NOTIFY pgrst, 'reload schema';
