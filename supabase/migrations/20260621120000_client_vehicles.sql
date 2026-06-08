-- Saved client vehicles for quick selection on new service requests

CREATE TABLE public.client_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT client_vehicles_label_not_empty CHECK (char_length(trim(label)) > 0)
);

CREATE UNIQUE INDEX client_vehicles_client_label_unique
  ON public.client_vehicles (client_id, lower(trim(label)));

CREATE INDEX client_vehicles_client_id_idx
  ON public.client_vehicles (client_id);

CREATE TRIGGER client_vehicles_set_updated_at
  BEFORE UPDATE ON public.client_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.client_vehicles (client_id, label)
SELECT DISTINCT sr.client_id, trim(sr.car_type)
FROM public.service_requests sr
WHERE sr.client_id IS NOT NULL
  AND sr.car_type IS NOT NULL
  AND char_length(trim(sr.car_type)) > 0
  AND NOT EXISTS (
    SELECT 1
    FROM public.client_vehicles cv
    WHERE cv.client_id = sr.client_id
      AND lower(trim(cv.label)) = lower(trim(sr.car_type))
  );

ALTER TABLE public.client_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_vehicles_admin_all"
  ON public.client_vehicles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "client_vehicles_client_select_own"
  ON public.client_vehicles FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "client_vehicles_client_insert_own"
  ON public.client_vehicles FOR INSERT
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "client_vehicles_client_update_own"
  ON public.client_vehicles FOR UPDATE
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "client_vehicles_client_delete_own"
  ON public.client_vehicles FOR DELETE
  USING (client_id = auth.uid());

NOTIFY pgrst, 'reload schema';
