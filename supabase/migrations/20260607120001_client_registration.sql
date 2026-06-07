-- Étape 2 : contraintes + table (après commit de 20260607120000_client_registration_enum.sql)

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_technician_type_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_technician_type_check CHECK (
    (role = 'technician' AND technician_type IS NOT NULL)
    OR (role = 'admin' AND technician_type IS NULL)
    OR (role = 'client' AND technician_type IS NULL)
  );

CREATE TABLE IF NOT EXISTS public.client_verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL,
  phone text NOT NULL,
  code_hash text NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  verified_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS client_verification_codes_email_created_idx
  ON public.client_verification_codes (email, created_at DESC);

ALTER TABLE public.client_verification_codes ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.client_verification_codes TO service_role;
GRANT ALL ON public.client_verification_codes TO postgres;
