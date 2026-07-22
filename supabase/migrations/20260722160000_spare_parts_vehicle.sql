-- Link spare parts to a vehicle brand/model from the catalog (nullable = fits all).

ALTER TABLE public.spare_parts
  ADD COLUMN IF NOT EXISTS vehicle_brand_slug text,
  ADD COLUMN IF NOT EXISTS vehicle_model_id text;

COMMENT ON COLUMN public.spare_parts.vehicle_brand_slug IS
  'Catalog brand slug (e.g. toyota). NULL = compatible with all vehicles.';
COMMENT ON COLUMN public.spare_parts.vehicle_model_id IS
  'Catalog model id within brand (e.g. camry). NULL with brand = all models of that brand.';

CREATE INDEX IF NOT EXISTS spare_parts_vehicle_brand_idx
  ON public.spare_parts (vehicle_brand_slug)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS spare_parts_vehicle_model_idx
  ON public.spare_parts (vehicle_brand_slug, vehicle_model_id)
  WHERE is_active = true;

NOTIFY pgrst, 'reload schema';
