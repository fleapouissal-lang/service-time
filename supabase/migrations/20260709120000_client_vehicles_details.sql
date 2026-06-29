-- Extended client vehicle details (brand, model, specs, plate)

ALTER TABLE public.client_vehicles
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS model text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS brand_slug text,
  ADD COLUMN IF NOT EXISTS cylinders smallint
    CHECK (cylinders IS NULL OR cylinders BETWEEN 1 AND 16),
  ADD COLUMN IF NOT EXISTS fuel_type text
    CHECK (
      fuel_type IS NULL
      OR fuel_type IN ('gasoline', 'diesel', 'electric', 'hybrid')
    ),
  ADD COLUMN IF NOT EXISTS chassis_number text,
  ADD COLUMN IF NOT EXISTS plate_letters text,
  ADD COLUMN IF NOT EXISTS plate_number text,
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS year smallint
    CHECK (year IS NULL OR year BETWEEN 1980 AND 2100);

UPDATE public.client_vehicles
SET
  brand = trim(label),
  model = COALESCE(NULLIF(trim(model), ''), '')
WHERE brand IS NULL OR trim(brand) = '';

ALTER TABLE public.client_vehicles
  ALTER COLUMN brand SET NOT NULL;

COMMENT ON COLUMN public.client_vehicles.brand IS 'Marque affichée';
COMMENT ON COLUMN public.client_vehicles.model IS 'Modèle affiché';
COMMENT ON COLUMN public.client_vehicles.brand_slug IS 'Slug pour logo marque (vehicle-catalog)';

NOTIFY pgrst, 'reload schema';
