-- Étape 1 : ajouter la valeur enum (transaction séparée obligatoire)
-- Ne pas utiliser 'client' dans ce fichier.

DO $$
BEGIN
  ALTER TYPE public.profile_role ADD VALUE 'client';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
