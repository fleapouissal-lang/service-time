-- Ajout colonne img pour chemins publics (/spare-parts/...)
ALTER TABLE public.spare_parts
  ADD COLUMN IF NOT EXISTS img text;

COMMENT ON COLUMN public.spare_parts.img IS
  'Chemin public vers l''image, ex: /spare-parts/filtre-huile.jpg';
