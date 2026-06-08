-- Bilingual profile display names (AR / EN)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name_ar text,
  ADD COLUMN IF NOT EXISTS full_name_en text;

UPDATE public.profiles
SET full_name_ar = full_name
WHERE full_name_ar IS NULL OR trim(full_name_ar) = '';

NOTIFY pgrst, 'reload schema';
