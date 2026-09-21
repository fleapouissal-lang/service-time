-- Vehicle class for catalog pricing (sedan / suv / pickup / luxury / van)

ALTER TABLE public.client_vehicles
  ADD COLUMN IF NOT EXISTS vehicle_class text;

ALTER TABLE public.client_vehicles
  DROP CONSTRAINT IF EXISTS client_vehicles_vehicle_class_check;

ALTER TABLE public.client_vehicles
  ADD CONSTRAINT client_vehicles_vehicle_class_check
  CHECK (
    vehicle_class IS NULL
    OR vehicle_class IN ('sedan', 'suv', 'pickup', 'luxury', 'van')
  );

CREATE INDEX IF NOT EXISTS client_vehicles_vehicle_class_idx
  ON public.client_vehicles (vehicle_class);
