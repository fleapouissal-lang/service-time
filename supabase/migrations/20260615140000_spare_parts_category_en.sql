-- English category labels for spare_parts

ALTER TABLE public.spare_parts
  ADD COLUMN IF NOT EXISTS category_en text;

COMMENT ON COLUMN public.spare_parts.category_en IS 'English category label; falls back to category when null';

UPDATE public.spare_parts SET category_en = 'Brakes' WHERE id = 'b2000002-0002-4002-8002-000000000001';
UPDATE public.spare_parts SET category_en = 'Chassis' WHERE id = 'b2000002-0002-4002-8002-000000000002';
UPDATE public.spare_parts SET category_en = 'Drivetrain' WHERE id = 'b2000002-0002-4002-8002-000000000003';
UPDATE public.spare_parts SET category_en = 'Electrical' WHERE id = 'b2000002-0002-4002-8002-000000000004';
UPDATE public.spare_parts SET category_en = 'Cooling' WHERE id = 'b2000002-0002-4002-8002-000000000005';
UPDATE public.spare_parts SET category_en = 'Filters' WHERE id = 'b2000002-0002-4002-8002-000000000006';
UPDATE public.spare_parts SET category_en = 'Fuel' WHERE id = 'b2000002-0002-4002-8002-000000000007';
UPDATE public.spare_parts SET category_en = 'Suspension' WHERE id = 'b2000002-0002-4002-8002-000000000008';
UPDATE public.spare_parts SET category_en = 'Drivetrain' WHERE id = 'b2000002-0002-4002-8002-000000000009';
