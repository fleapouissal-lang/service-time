-- Bilingual content for services and spare_parts (AR + EN)

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS description_en text;

ALTER TABLE public.spare_parts
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS details_en text;

COMMENT ON COLUMN public.services.name_en IS 'English display name; falls back to name_ar when null';
COMMENT ON COLUMN public.services.description_en IS 'English description; falls back to description_ar when null';
COMMENT ON COLUMN public.spare_parts.name_en IS 'English display name; falls back to name_ar when null';
COMMENT ON COLUMN public.spare_parts.description_en IS 'English description; falls back to description_ar when null';
COMMENT ON COLUMN public.spare_parts.details_en IS 'English details; falls back to details when null';

-- Demo data English (seed.sql UUIDs)
UPDATE public.services SET
  name_en = 'Periodic maintenance',
  description_en = 'Full inspection with oil and filter change'
WHERE id = 'a1000001-0001-4001-8001-000000000001';

UPDATE public.services SET
  name_en = 'Oil change',
  description_en = 'Engine oil and oil filter replacement'
WHERE id = 'a1000001-0001-4001-8001-000000000002';

UPDATE public.services SET
  name_en = 'Brake inspection',
  description_en = 'Brake system inspection and maintenance'
WHERE id = 'a1000001-0001-4001-8001-000000000003';

UPDATE public.services SET
  name_en = 'Roadside emergency',
  description_en = 'Emergency roadside repair — battery, tires, jump start'
WHERE id = 'a1000001-0001-4001-8001-000000000004';

UPDATE public.services SET
  name_en = 'Mobile workshop',
  description_en = 'A technician comes to your location in Riyadh'
WHERE id = 'a1000001-0001-4001-8001-000000000005';

UPDATE public.services SET
  name_en = 'Spare parts request',
  description_en = 'Request a spare part and we will contact you to confirm'
WHERE id = 'a1000001-0001-4001-8001-000000000006';

UPDATE public.spare_parts SET
  name_en = 'Brake disc',
  description_en = 'High-performance brake disc — OEM quality and approved alternatives',
  details_en = 'Available in multiple sizes — please specify your car model'
WHERE id = 'b2000002-0002-4002-8002-000000000001';

UPDATE public.spare_parts SET
  name_en = 'Wheel hub',
  description_en = 'Wheel hub with bearing — precision fit',
  details_en = 'Available for most car models'
WHERE id = 'b2000002-0002-4002-8002-000000000002';

UPDATE public.spare_parts SET
  name_en = 'Clutch disc',
  description_en = 'Clutch disc with heat-resistant friction surface',
  details_en = 'Please specify transmission type (manual / automatic)'
WHERE id = 'b2000002-0002-4002-8002-000000000003';

UPDATE public.spare_parts SET
  name_en = 'Alternator',
  description_en = 'Alternator — charges the battery and powers electrical systems',
  details_en = 'Inspection and installation available at workshop or mobile service'
WHERE id = 'b2000002-0002-4002-8002-000000000004';

UPDATE public.spare_parts SET
  name_en = 'Water pump',
  description_en = 'Engine cooling water pump — reliable performance',
  details_en = 'Compatible with modern cooling systems'
WHERE id = 'b2000002-0002-4002-8002-000000000005';

UPDATE public.spare_parts SET
  name_en = 'Air filter',
  description_en = 'Engine air filter — effective dust protection',
  details_en = 'Please specify year and car model'
WHERE id = 'b2000002-0002-4002-8002-000000000006';

UPDATE public.spare_parts SET
  name_en = 'Fuel injectors',
  description_en = 'Fuel injectors — precise spray and improved consumption',
  details_en = 'Set or individual part on request'
WHERE id = 'b2000002-0002-4002-8002-000000000007';

UPDATE public.spare_parts SET
  name_en = 'Control arm',
  description_en = 'Front control arm — stability and safe handling',
  details_en = 'Please provide VIN number'
WHERE id = 'b2000002-0002-4002-8002-000000000008';

UPDATE public.spare_parts SET
  name_en = 'Timing belt',
  description_en = 'Timing belt with tensioner — complete kit',
  details_en = 'Professional installation recommended when replacing'
WHERE id = 'b2000002-0002-4002-8002-000000000009';
