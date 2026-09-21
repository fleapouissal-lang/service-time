-- Allow admin-managed vehicle class ids (drop fixed enum check)

ALTER TABLE public.client_vehicles
  DROP CONSTRAINT IF EXISTS client_vehicles_vehicle_class_check;
