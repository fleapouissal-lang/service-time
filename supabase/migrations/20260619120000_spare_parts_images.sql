-- Multiple product images for spare_parts (JSON array of public paths)
ALTER TABLE public.spare_parts
  ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.spare_parts.images IS
  'Ordered list of public image paths (/spare-parts/...); img holds the cover (first image)';

UPDATE public.spare_parts
SET images = jsonb_build_array(img)
WHERE img IS NOT NULL
  AND trim(img) <> ''
  AND images = '[]'::jsonb;
