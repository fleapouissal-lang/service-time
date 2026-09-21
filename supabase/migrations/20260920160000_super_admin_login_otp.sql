-- Super Admin flag + login OTP codes (admin sign-in after password)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_super_admin boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.is_super_admin IS
  'Primary Super Admin account — protected from demotion/deletion.';

CREATE TABLE IF NOT EXISTS public.login_otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL,
  code_hash text NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  verified_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS login_otp_codes_email_created_idx
  ON public.login_otp_codes (email, created_at DESC);

ALTER TABLE public.login_otp_codes ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.login_otp_codes TO service_role;
GRANT ALL ON public.login_otp_codes TO postgres;

-- Rename primary admin email → support@servicetime.com.sa and mark Super Admin
DO $$
DECLARE
  target_id uuid;
BEGIN
  SELECT id INTO target_id
  FROM auth.users
  WHERE lower(email) IN (
    'support@servicetime.com.sa',
    'admin@servicetime.sa',
    'admin@servicetime.com.sa'
  )
  ORDER BY CASE lower(email)
    WHEN 'support@servicetime.com.sa' THEN 0
    WHEN 'admin@servicetime.sa' THEN 1
    ELSE 2
  END
  LIMIT 1;

  IF target_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE auth.users
  SET
    email = 'support@servicetime.com.sa',
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
  WHERE id = target_id;

  UPDATE auth.identities
  SET
    identity_data = coalesce(identity_data, '{}'::jsonb)
      || jsonb_build_object(
        'email', 'support@servicetime.com.sa',
        'sub', target_id::text
      ),
    updated_at = now()
  WHERE user_id = target_id
    AND provider = 'email';

  UPDATE public.profiles
  SET
    role = 'admin',
    is_super_admin = true,
    is_active = true,
    updated_at = now()
  WHERE id = target_id;

  -- Ensure only one Super Admin
  UPDATE public.profiles
  SET is_super_admin = false, updated_at = now()
  WHERE is_super_admin = true
    AND id <> target_id;
END $$;
