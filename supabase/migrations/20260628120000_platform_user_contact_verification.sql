-- Vérification email / WhatsApp avant changement de contact (admin edit user)

CREATE TABLE IF NOT EXISTS public.platform_user_contact_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  payload jsonb NOT NULL,
  new_email text,
  new_phone text,
  old_email text,
  old_phone text,
  email_code_hash text,
  phone_code_hash text,
  email_attempts int NOT NULL DEFAULT 0,
  phone_attempts int NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS platform_user_contact_verifications_user_created_idx
  ON public.platform_user_contact_verifications (user_id, created_at DESC);

ALTER TABLE public.platform_user_contact_verifications ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.platform_user_contact_verifications TO service_role;
GRANT ALL ON public.platform_user_contact_verifications TO postgres;

NOTIFY pgrst, 'reload schema';
