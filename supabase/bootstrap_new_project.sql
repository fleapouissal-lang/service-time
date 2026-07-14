-- Service Time — bootstrap complet pour nouveau projet Supabase
-- Généré automatiquement — ne pas éditer à la main
BEGIN;

-- ===== 20260603150000_initial_schema.sql =====
-- Service Time — Schéma initial MVP
-- Source: ServiceTime_Technical_Scope.md

-- ---------------------------------------------------------------------------
-- Extensions (pgcrypto optionnel — token via gen_random_uuid)
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE public.profile_role AS ENUM ('admin', 'technician');

CREATE TYPE public.technician_type AS ENUM ('workshop', 'mobile');

CREATE TYPE public.service_type AS ENUM (
  'periodic_maintenance',
  'emergency',
  'spare_parts'
);

CREATE TYPE public.execution_method AS ENUM (
  'workshop_visit',
  'mobile_workshop'
);

CREATE TYPE public.request_status AS ENUM (
  'received',
  'in_progress',
  'on_the_way',
  'arrived',
  'completed',
  'cancelled'
);

CREATE TYPE public.request_priority AS ENUM ('low', 'normal', 'high');

CREATE TYPE public.notification_channel AS ENUM ('whatsapp', 'sms');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_tracking_token()
RETURNS text
LANGUAGE sql
AS $$
  SELECT replace(gen_random_uuid()::text, '-', '');
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  role public.profile_role NOT NULL,
  technician_type public.technician_type,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_technician_type_check CHECK (
    (role = 'technician' AND technician_type IS NOT NULL)
    OR (role = 'admin' AND technician_type IS NULL)
  )
);

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------------
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  description_ar text,
  category text,
  service_type public.service_type NOT NULL,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX services_active_sort_idx ON public.services (is_active, sort_order);

CREATE TRIGGER services_set_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- spare_parts
-- ---------------------------------------------------------------------------
CREATE TABLE public.spare_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  description_ar text,
  category text,
  details text,
  image_url text,
  img text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX spare_parts_active_idx ON public.spare_parts (is_active);

CREATE TRIGGER spare_parts_set_updated_at
  BEFORE UPDATE ON public.spare_parts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- service_requests
-- ---------------------------------------------------------------------------
CREATE TABLE public.service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  car_type text,
  location_text text,
  location_lat double precision,
  location_lng double precision,
  description text,
  service_type public.service_type NOT NULL,
  execution_method public.execution_method NOT NULL,
  status public.request_status NOT NULL DEFAULT 'received',
  priority public.request_priority NOT NULL DEFAULT 'normal',
  assigned_technician_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  tracking_token text NOT NULL UNIQUE DEFAULT public.generate_tracking_token(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX service_requests_phone_idx ON public.service_requests (customer_phone);
CREATE INDEX service_requests_status_idx ON public.service_requests (status);
CREATE INDEX service_requests_technician_idx ON public.service_requests (assigned_technician_id);
CREATE INDEX service_requests_created_at_idx ON public.service_requests (created_at DESC);
CREATE INDEX service_requests_dedup_idx ON public.service_requests (customer_phone, created_at DESC);

CREATE TRIGGER service_requests_set_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- request_photos
-- ---------------------------------------------------------------------------
CREATE TABLE public.request_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.service_requests (id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX request_photos_request_id_idx ON public.request_photos (request_id);

-- ---------------------------------------------------------------------------
-- request_status_history
-- ---------------------------------------------------------------------------
CREATE TABLE public.request_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.service_requests (id) ON DELETE CASCADE,
  status public.request_status NOT NULL,
  changed_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX request_status_history_request_id_idx
  ON public.request_status_history (request_id, created_at);

-- Auto-log initial status + subsequent changes
CREATE OR REPLACE FUNCTION public.log_service_request_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.request_status_history (request_id, status, changed_by)
    VALUES (NEW.id, NEW.status, auth.uid());
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.request_status_history (request_id, status, changed_by)
    VALUES (NEW.id, NEW.status, auth.uid());
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER service_requests_log_status
  AFTER INSERT OR UPDATE OF status ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.log_service_request_status_change();

-- ---------------------------------------------------------------------------
-- technician_locations
-- ---------------------------------------------------------------------------
CREATE TABLE public.technician_locations (
  technician_id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER technician_locations_set_updated_at
  BEFORE UPDATE ON public.technician_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- site_content
-- ---------------------------------------------------------------------------
CREATE TABLE public.site_content (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER site_content_set_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- notifications_log
-- ---------------------------------------------------------------------------
CREATE TABLE public.notifications_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES public.service_requests (id) ON DELETE SET NULL,
  channel public.notification_channel NOT NULL,
  event text NOT NULL,
  status text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_log_request_id_idx ON public.notifications_log (request_id);

-- ---------------------------------------------------------------------------
-- Helper functions (after tables — SQL functions validate relations at create)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_technician()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'technician'
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.get_request_by_tracking_token(p_token text)
RETURNS SETOF public.service_requests
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.service_requests
  WHERE tracking_token = p_token
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_request_status_history_by_token(p_token text)
RETURNS SETOF public.request_status_history
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT h.*
  FROM public.request_status_history h
  INNER JOIN public.service_requests r ON r.id = h.request_id
  WHERE r.tracking_token = p_token
  ORDER BY h.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_request_by_tracking_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_request_status_history_by_token(text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage bucket: request-photos
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'request-photos',
  'request-photos',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technician_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_update_own_or_admin"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_insert_admin"
  ON public.profiles FOR INSERT
  WITH CHECK (public.is_admin() OR auth.uid() = id);

-- services (public read active, admin write)
CREATE POLICY "services_public_read"
  ON public.services FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "services_admin_write"
  ON public.services FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- spare_parts
CREATE POLICY "spare_parts_public_read"
  ON public.spare_parts FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "spare_parts_admin_write"
  ON public.spare_parts FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- service_requests
CREATE POLICY "service_requests_public_insert"
  ON public.service_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "service_requests_admin_select"
  ON public.service_requests FOR SELECT
  USING (public.is_admin());

CREATE POLICY "service_requests_technician_select_assigned"
  ON public.service_requests FOR SELECT
  USING (public.is_technician() AND assigned_technician_id = auth.uid());

CREATE POLICY "service_requests_admin_update"
  ON public.service_requests FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "service_requests_technician_update_assigned"
  ON public.service_requests FOR UPDATE
  USING (public.is_technician() AND assigned_technician_id = auth.uid())
  WITH CHECK (public.is_technician() AND assigned_technician_id = auth.uid());

-- request_photos
CREATE POLICY "request_photos_public_insert"
  ON public.request_photos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "request_photos_read"
  ON public.request_photos FOR SELECT
  USING (public.is_admin() OR public.is_technician());

-- request_status_history
CREATE POLICY "request_status_history_admin_select"
  ON public.request_status_history FOR SELECT
  USING (public.is_admin());

CREATE POLICY "request_status_history_technician_select"
  ON public.request_status_history FOR SELECT
  USING (
    public.is_technician()
    AND EXISTS (
      SELECT 1 FROM public.service_requests r
      WHERE r.id = request_id AND r.assigned_technician_id = auth.uid()
    )
  );

CREATE POLICY "request_status_history_insert_staff"
  ON public.request_status_history FOR INSERT
  WITH CHECK (public.is_admin() OR public.is_technician());

-- technician_locations
CREATE POLICY "technician_locations_admin_select"
  ON public.technician_locations FOR SELECT
  USING (public.is_admin());

CREATE POLICY "technician_locations_technician_select"
  ON public.technician_locations FOR SELECT
  USING (public.is_technician());

CREATE POLICY "technician_locations_upsert_own"
  ON public.technician_locations FOR ALL
  USING (technician_id = auth.uid() OR public.is_admin())
  WITH CHECK (technician_id = auth.uid() OR public.is_admin());

-- site_content
CREATE POLICY "site_content_public_read"
  ON public.site_content FOR SELECT
  USING (true);

CREATE POLICY "site_content_admin_write"
  ON public.site_content FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- notifications_log
CREATE POLICY "notifications_log_admin"
  ON public.notifications_log FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Storage policies for request-photos
CREATE POLICY "request_photos_storage_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'request-photos');

CREATE POLICY "request_photos_storage_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'request-photos' AND (public.is_admin() OR public.is_technician()));

-- ---------------------------------------------------------------------------
-- Seed: contenu CMS minimal
-- ---------------------------------------------------------------------------
INSERT INTO public.site_content (key, value) VALUES
  ('home.hero', '{"title_ar": "Service Time", "subtitle_ar": "صيانة السيارات في الرياض"}'::jsonb),
  ('contact.phone', '{"value": "+966 58 381 4214"}'::jsonb),
  ('contact.email', '{"value": "servicetime10@gmail.com"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ===== 20260603170000_fix_service_requests_rls.sql =====
-- Fix RLS : les visiteurs (anon) peuvent créer une demande via RPC sécurisée
-- Exécuter dans Supabase SQL Editor

-- Fix tracking_token sans pgcrypto (gen_random_uuid est natif)
CREATE OR REPLACE FUNCTION public.generate_tracking_token()
RETURNS text
LANGUAGE sql
AS $$
  SELECT replace(gen_random_uuid()::text, '-', '');
$$;

-- ---------------------------------------------------------------------------
-- RPC : créer une demande (bypass RLS pour insert + return tracking_token)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_service_request(
  p_customer_name text,
  p_customer_phone text,
  p_car_type text,
  p_location_text text,
  p_description text,
  p_service_type public.service_type,
  p_execution_method public.execution_method
)
RETURNS TABLE (id uuid, tracking_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.service_requests sr
    WHERE sr.customer_phone = p_customer_phone
      AND sr.service_type = p_service_type
      AND sr.created_at > now() - interval '15 minutes'
  ) THEN
    RAISE EXCEPTION 'duplicate_request'
      USING ERRCODE = 'P0001',
            MESSAGE = 'تم إرسال طلب مشابه مؤخراً';
  END IF;

  RETURN QUERY
  INSERT INTO public.service_requests (
    customer_name,
    customer_phone,
    car_type,
    location_text,
    description,
    service_type,
    execution_method,
    status
  )
  VALUES (
    p_customer_name,
    p_customer_phone,
    NULLIF(trim(p_car_type), ''),
    NULLIF(trim(p_location_text), ''),
    NULLIF(trim(p_description), ''),
    p_service_type,
    p_execution_method,
    'received'
  )
  RETURNING service_requests.id, service_requests.tracking_token;
END;
$$;

-- Rollback si échec upload photo
CREATE OR REPLACE FUNCTION public.delete_service_request_draft(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.service_requests
  WHERE id = p_request_id
    AND status = 'received'
    AND created_at > now() - interval '10 minutes';
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_service_request(
  text, text, text, text, text,
  public.service_type, public.execution_method
) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.delete_service_request_draft(uuid)
  TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Policies explicites pour anon (insert direct si besoin)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "service_requests_public_insert" ON public.service_requests;
CREATE POLICY "service_requests_public_insert"
  ON public.service_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "request_photos_public_insert" ON public.request_photos;
CREATE POLICY "request_photos_public_insert"
  ON public.request_photos
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "request_photos_storage_insert" ON storage.objects;
CREATE POLICY "request_photos_storage_insert"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'request-photos');

-- ===== 20260603180000_fix_request_photos_storage.sql =====
-- Bucket request-photos + RPC attach photo (si pas déjà fait)
-- Exécuter dans Supabase SQL Editor

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'request-photos',
  'request-photos',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE OR REPLACE FUNCTION public.attach_request_photo(
  p_request_id uuid,
  p_storage_path text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.service_requests WHERE id = p_request_id) THEN
    RAISE EXCEPTION 'request_not_found';
  END IF;

  INSERT INTO public.request_photos (request_id, storage_path)
  VALUES (p_request_id, p_storage_path)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.attach_request_photo(uuid, text)
  TO anon, authenticated, service_role;

-- ===== 20260604120000_spare_parts_img.sql =====
-- Ajout colonne img pour chemins publics (/spare-parts/...)
ALTER TABLE public.spare_parts
  ADD COLUMN IF NOT EXISTS img text;

COMMENT ON COLUMN public.spare_parts.img IS
  'Chemin public vers l''image, ex: /spare-parts/filtre-huile.jpg';

-- ===== 20260605120000_request_location_coords.sql =====
-- Store GPS coordinates on service requests (optional, from /request form)

DROP FUNCTION IF EXISTS public.create_service_request(
  text, text, text, text, text,
  public.service_type, public.execution_method
);

CREATE OR REPLACE FUNCTION public.create_service_request(
  p_customer_name text,
  p_customer_phone text,
  p_car_type text,
  p_location_text text,
  p_description text,
  p_service_type public.service_type,
  p_execution_method public.execution_method,
  p_location_lat double precision DEFAULT NULL,
  p_location_lng double precision DEFAULT NULL
)
RETURNS TABLE (id uuid, tracking_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.service_requests sr
    WHERE sr.customer_phone = p_customer_phone
      AND sr.service_type = p_service_type
      AND sr.created_at > now() - interval '15 minutes'
  ) THEN
    RAISE EXCEPTION 'duplicate_request'
      USING ERRCODE = 'P0001',
            MESSAGE = 'تم إرسال طلب مشابه مؤخراً';
  END IF;

  RETURN QUERY
  INSERT INTO public.service_requests (
    customer_name,
    customer_phone,
    car_type,
    location_text,
    location_lat,
    location_lng,
    description,
    service_type,
    execution_method,
    status
  )
  VALUES (
    p_customer_name,
    p_customer_phone,
    NULLIF(trim(p_car_type), ''),
    NULLIF(trim(p_location_text), ''),
    p_location_lat,
    p_location_lng,
    NULLIF(trim(p_description), ''),
    p_service_type,
    p_execution_method,
    'received'
  )
  RETURNING service_requests.id, service_requests.tracking_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_service_request(
  text, text, text, text, text,
  public.service_type, public.execution_method,
  double precision, double precision
) TO anon, authenticated;

-- ===== 20260605140000_contact_messages.sql =====
-- Contact form submissions from /contact

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_messages_public_insert" ON public.contact_messages;
CREATE POLICY "contact_messages_public_insert"
  ON public.contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "contact_messages_admin_select" ON public.contact_messages;
CREATE POLICY "contact_messages_admin_select"
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

GRANT ALL ON public.contact_messages TO service_role;
GRANT ALL ON public.contact_messages TO postgres;

-- ===== 20260606120000_password_reset_codes.sql =====
-- OTP codes for custom password reset (bypasses Supabase Auth email rate limits)

CREATE TABLE IF NOT EXISTS public.password_reset_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL,
  code_hash text NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  verified_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS password_reset_codes_email_created_idx
  ON public.password_reset_codes (email, created_at DESC);

ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.password_reset_codes TO service_role;
GRANT ALL ON public.password_reset_codes TO postgres;

-- ===== 20260607120000_client_registration_enum.sql =====
-- Étape 1 : ajouter la valeur enum (transaction séparée obligatoire)
-- Ne pas utiliser 'client' dans ce fichier.

DO $$
BEGIN
  ALTER TYPE public.profile_role ADD VALUE 'client';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ===== 20260607120001_client_registration.sql =====
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

-- ===== 20260608120000_profile_avatars.sql =====
-- Photos de profil (client, technicien, admin)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

ALTER TABLE public.client_verification_codes
  ADD COLUMN IF NOT EXISTS avatar_storage_path text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-avatars',
  'profile-avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "profile_avatars_public_read" ON storage.objects;
CREATE POLICY "profile_avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-avatars');

DROP POLICY IF EXISTS "profile_avatars_insert" ON storage.objects;
CREATE POLICY "profile_avatars_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-avatars');

DROP POLICY IF EXISTS "profile_avatars_update" ON storage.objects;
CREATE POLICY "profile_avatars_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'profile-avatars')
  WITH CHECK (bucket_id = 'profile-avatars');

DROP POLICY IF EXISTS "profile_avatars_delete" ON storage.objects;
CREATE POLICY "profile_avatars_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'profile-avatars');

-- ===== 20260609120000_client_dashboard_rls.sql =====
-- RLS client : lire ses propres demandes (par téléphone du profil)

CREATE OR REPLACE FUNCTION public.is_client()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'client'
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.client_owns_request(p_customer_phone text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'client'
      AND p.is_active = true
      AND p.phone IS NOT NULL
      AND regexp_replace(p_customer_phone, '\D', '', 'g')
        = regexp_replace(p.phone, '\D', '', 'g')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_client() TO authenticated;
GRANT EXECUTE ON FUNCTION public.client_owns_request(text) TO authenticated;

DROP POLICY IF EXISTS "service_requests_client_select_own" ON public.service_requests;
CREATE POLICY "service_requests_client_select_own"
  ON public.service_requests FOR SELECT
  USING (public.client_owns_request(customer_phone));

DROP POLICY IF EXISTS "request_status_history_client_select" ON public.request_status_history;
CREATE POLICY "request_status_history_client_select"
  ON public.request_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.service_requests r
      WHERE r.id = request_id
        AND public.client_owns_request(r.customer_phone)
    )
  );

-- ===== 20260610120000_create_service_request_rpc.sql =====
-- RPC create_service_request (avec coordonnées GPS)
-- À exécuter dans Supabase SQL Editor si « nv demande » échoue.

CREATE OR REPLACE FUNCTION public.generate_tracking_token()
RETURNS text
LANGUAGE sql
AS $$
  SELECT replace(gen_random_uuid()::text, '-', '');
$$;

-- Supprimer les anciennes signatures
DROP FUNCTION IF EXISTS public.create_service_request(
  text, text, text, text, text,
  public.service_type, public.execution_method
);

DROP FUNCTION IF EXISTS public.create_service_request(
  text, text, text, text, text,
  public.service_type, public.execution_method,
  double precision, double precision
);

CREATE OR REPLACE FUNCTION public.create_service_request(
  p_customer_name text,
  p_customer_phone text,
  p_car_type text,
  p_location_text text,
  p_description text,
  p_service_type public.service_type,
  p_execution_method public.execution_method,
  p_location_lat double precision DEFAULT NULL,
  p_location_lng double precision DEFAULT NULL
)
RETURNS TABLE (id uuid, tracking_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.service_requests sr
    WHERE sr.customer_phone = p_customer_phone
      AND sr.service_type = p_service_type
      AND sr.created_at > now() - interval '15 minutes'
  ) THEN
    RAISE EXCEPTION 'duplicate_request'
      USING ERRCODE = 'P0001',
            MESSAGE = 'تم إرسال طلب مشابه مؤخراً';
  END IF;

  RETURN QUERY
  INSERT INTO public.service_requests (
    customer_name,
    customer_phone,
    car_type,
    location_text,
    location_lat,
    location_lng,
    description,
    service_type,
    execution_method,
    status
  )
  VALUES (
    p_customer_name,
    p_customer_phone,
    NULLIF(trim(p_car_type), ''),
    NULLIF(trim(p_location_text), ''),
    p_location_lat,
    p_location_lng,
    NULLIF(trim(p_description), ''),
    p_service_type,
    p_execution_method,
    'received'
  )
  RETURNING service_requests.id, service_requests.tracking_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_service_request_draft(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.service_requests
  WHERE id = p_request_id
    AND status = 'received'
    AND created_at > now() - interval '10 minutes';
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_service_request(
  text, text, text, text, text,
  public.service_type, public.execution_method,
  double precision, double precision
) TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.delete_service_request_draft(uuid)
  TO anon, authenticated, service_role;

-- Policies anon/authenticated (si absentes)
DROP POLICY IF EXISTS "service_requests_public_insert" ON public.service_requests;
CREATE POLICY "service_requests_public_insert"
  ON public.service_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "request_photos_public_insert" ON public.request_photos;
CREATE POLICY "request_photos_public_insert"
  ON public.request_photos
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Recharger le cache PostgREST
NOTIFY pgrst, 'reload schema';

-- ===== 20260611120000_spare_part_orders.sql =====
-- Commandes de pièces détachées (panier /spare-parts)

CREATE TYPE public.spare_part_order_status AS ENUM (
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'delivered',
  'cancelled'
);

CREATE TABLE public.spare_part_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status public.spare_part_order_status NOT NULL DEFAULT 'pending',
  notes text,
  order_token text NOT NULL UNIQUE DEFAULT public.generate_tracking_token(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX spare_part_orders_client_idx ON public.spare_part_orders (client_id);
CREATE INDEX spare_part_orders_status_idx ON public.spare_part_orders (status);
CREATE INDEX spare_part_orders_created_idx ON public.spare_part_orders (created_at DESC);

CREATE TRIGGER spare_part_orders_set_updated_at
  BEFORE UPDATE ON public.spare_part_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.spare_part_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.spare_part_orders (id) ON DELETE CASCADE,
  spare_part_id uuid NOT NULL REFERENCES public.spare_parts (id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0 AND quantity <= 99),
  name_snapshot text NOT NULL,
  category_snapshot text,
  img_snapshot text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, spare_part_id)
);

CREATE INDEX spare_part_order_items_order_idx ON public.spare_part_order_items (order_id);

ALTER TABLE public.spare_part_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spare_part_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "spare_part_orders_client_select_own"
  ON public.spare_part_orders FOR SELECT
  USING (client_id = auth.uid() AND public.is_client());

CREATE POLICY "spare_part_orders_admin_all"
  ON public.spare_part_orders FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "spare_part_order_items_client_select_own"
  ON public.spare_part_order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.spare_part_orders o
      WHERE o.id = order_id
        AND o.client_id = auth.uid()
        AND public.is_client()
    )
  );

CREATE POLICY "spare_part_order_items_admin_all"
  ON public.spare_part_order_items FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.create_spare_part_order(
  p_notes text,
  p_items jsonb
)
RETURNS TABLE (id uuid, order_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_client_id uuid;
  v_order_id uuid;
  v_token text;
  v_item jsonb;
  v_part_id uuid;
  v_qty integer;
  v_part public.spare_parts%ROWTYPE;
BEGIN
  v_client_id := auth.uid();

  IF v_client_id IS NULL OR NOT public.is_client() THEN
    RAISE EXCEPTION 'client_required'
      USING ERRCODE = 'P0001',
            MESSAGE = 'يجب تسجيل الدخول كعميل';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'empty_cart'
      USING ERRCODE = 'P0001',
            MESSAGE = 'السلة فارغة';
  END IF;

  INSERT INTO public.spare_part_orders (client_id, notes, status)
  VALUES (v_client_id, NULLIF(trim(p_notes), ''), 'pending')
  RETURNING spare_part_orders.id, spare_part_orders.order_token
  INTO v_order_id, v_token;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_part_id := (v_item ->> 'spare_part_id')::uuid;
    v_qty := (v_item ->> 'quantity')::integer;

    IF v_part_id IS NULL OR v_qty IS NULL OR v_qty < 1 OR v_qty > 99 THEN
      RAISE EXCEPTION 'invalid_item'
        USING ERRCODE = 'P0001',
              MESSAGE = 'عنصر غير صالح في السلة';
    END IF;

    SELECT * INTO v_part
    FROM public.spare_parts sp
    WHERE sp.id = v_part_id AND sp.is_active = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'part_unavailable'
        USING ERRCODE = 'P0001',
              MESSAGE = 'قطعة غير متاحة';
    END IF;

    INSERT INTO public.spare_part_order_items (
      order_id,
      spare_part_id,
      quantity,
      name_snapshot,
      category_snapshot,
      img_snapshot
    )
    VALUES (
      v_order_id,
      v_part_id,
      v_qty,
      v_part.name_ar,
      v_part.category,
      COALESCE(v_part.img, v_part.image_url)
    );
  END LOOP;

  RETURN QUERY SELECT v_order_id, v_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_spare_part_order(text, jsonb) TO authenticated;

NOTIFY pgrst, 'reload schema';

-- ===== 20260612120000_spare_parts_price.sql =====
-- Prix des pièces détachées + snapshot dans les commandes

ALTER TABLE public.spare_parts
  ADD COLUMN IF NOT EXISTS price numeric(10, 2) NOT NULL DEFAULT 0
  CHECK (price >= 0);

COMMENT ON COLUMN public.spare_parts.price IS 'Prix en SAR';

ALTER TABLE public.spare_part_order_items
  ADD COLUMN IF NOT EXISTS price_snapshot numeric(10, 2) NOT NULL DEFAULT 0
  CHECK (price_snapshot >= 0);

CREATE OR REPLACE FUNCTION public.create_spare_part_order(
  p_notes text,
  p_items jsonb
)
RETURNS TABLE (id uuid, order_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_client_id uuid;
  v_order_id uuid;
  v_token text;
  v_item jsonb;
  v_part_id uuid;
  v_qty integer;
  v_part public.spare_parts%ROWTYPE;
BEGIN
  v_client_id := auth.uid();

  IF v_client_id IS NULL OR NOT public.is_client() THEN
    RAISE EXCEPTION 'client_required'
      USING ERRCODE = 'P0001',
            MESSAGE = 'يجب تسجيل الدخول كعميل';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'empty_cart'
      USING ERRCODE = 'P0001',
            MESSAGE = 'السلة فارغة';
  END IF;

  INSERT INTO public.spare_part_orders (client_id, notes, status)
  VALUES (v_client_id, NULLIF(trim(p_notes), ''), 'pending')
  RETURNING spare_part_orders.id, spare_part_orders.order_token
  INTO v_order_id, v_token;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_part_id := (v_item ->> 'spare_part_id')::uuid;
    v_qty := (v_item ->> 'quantity')::integer;

    IF v_part_id IS NULL OR v_qty IS NULL OR v_qty < 1 OR v_qty > 99 THEN
      RAISE EXCEPTION 'invalid_item'
        USING ERRCODE = 'P0001',
              MESSAGE = 'عنصر غير صالح في السلة';
    END IF;

    SELECT * INTO v_part
    FROM public.spare_parts sp
    WHERE sp.id = v_part_id AND sp.is_active = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'part_unavailable'
        USING ERRCODE = 'P0001',
              MESSAGE = 'قطعة غير متاحة';
    END IF;

    INSERT INTO public.spare_part_order_items (
      order_id,
      spare_part_id,
      quantity,
      name_snapshot,
      category_snapshot,
      img_snapshot,
      price_snapshot
    )
    VALUES (
      v_order_id,
      v_part_id,
      v_qty,
      v_part.name_ar,
      v_part.category,
      COALESCE(v_part.img, v_part.image_url),
      v_part.price
    );
  END LOOP;

  RETURN QUERY SELECT v_order_id, v_token;
END;
$$;

NOTIFY pgrst, 'reload schema';

-- ===== 20260613120000_spare_parts_stock_payment.sql =====
-- Stock + paiement commandes pièces détachées

ALTER TABLE public.spare_parts
  ADD COLUMN IF NOT EXISTS stock_quantity integer NOT NULL DEFAULT 0
  CHECK (stock_quantity >= 0);

COMMENT ON COLUMN public.spare_parts.stock_quantity IS 'Quantité en stock';

CREATE TYPE public.spare_part_payment_method AS ENUM (
  'cash_on_delivery',
  'online'
);

CREATE TYPE public.spare_part_payment_status AS ENUM (
  'pending',
  'paid',
  'failed'
);

ALTER TABLE public.spare_part_orders
  ADD COLUMN IF NOT EXISTS payment_method public.spare_part_payment_method NOT NULL DEFAULT 'cash_on_delivery',
  ADD COLUMN IF NOT EXISTS payment_status public.spare_part_payment_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS total_amount numeric(10, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  ADD COLUMN IF NOT EXISTS payment_reference text;

CREATE OR REPLACE FUNCTION public.create_spare_part_order(
  p_notes text,
  p_items jsonb,
  p_payment_method text DEFAULT 'cash_on_delivery'
)
RETURNS TABLE (id uuid, order_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_client_id uuid;
  v_order_id uuid;
  v_token text;
  v_item jsonb;
  v_part_id uuid;
  v_qty integer;
  v_part public.spare_parts%ROWTYPE;
  v_total numeric(10, 2) := 0;
  v_payment_method public.spare_part_payment_method;
BEGIN
  v_client_id := auth.uid();

  IF v_client_id IS NULL OR NOT public.is_client() THEN
    RAISE EXCEPTION 'client_required'
      USING ERRCODE = 'P0001',
            MESSAGE = 'يجب تسجيل الدخول كعميل';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'empty_cart'
      USING ERRCODE = 'P0001',
            MESSAGE = 'السلة فارغة';
  END IF;

  IF p_payment_method = 'online' THEN
    v_payment_method := 'online';
  ELSE
    v_payment_method := 'cash_on_delivery';
  END IF;

  INSERT INTO public.spare_part_orders (
    client_id,
    notes,
    status,
    payment_method,
    payment_status
  )
  VALUES (
    v_client_id,
    NULLIF(trim(p_notes), ''),
    'pending',
    v_payment_method,
    'pending'
  )
  RETURNING spare_part_orders.id, spare_part_orders.order_token
  INTO v_order_id, v_token;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_part_id := (v_item ->> 'spare_part_id')::uuid;
    v_qty := (v_item ->> 'quantity')::integer;

    IF v_part_id IS NULL OR v_qty IS NULL OR v_qty < 1 OR v_qty > 99 THEN
      RAISE EXCEPTION 'invalid_item'
        USING ERRCODE = 'P0001',
              MESSAGE = 'عنصر غير صالح في السلة';
    END IF;

    SELECT * INTO v_part
    FROM public.spare_parts sp
    WHERE sp.id = v_part_id AND sp.is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'part_unavailable'
        USING ERRCODE = 'P0001',
              MESSAGE = 'قطعة غير متاحة';
    END IF;

    IF v_part.stock_quantity < v_qty THEN
      RAISE EXCEPTION 'insufficient_stock'
        USING ERRCODE = 'P0001',
              MESSAGE = format('الكمية غير كافية في المخزون: %s', v_part.name_ar);
    END IF;

    UPDATE public.spare_parts sp
    SET stock_quantity = sp.stock_quantity - v_qty
    WHERE sp.id = v_part_id;

    INSERT INTO public.spare_part_order_items (
      order_id,
      spare_part_id,
      quantity,
      name_snapshot,
      category_snapshot,
      img_snapshot,
      price_snapshot
    )
    VALUES (
      v_order_id,
      v_part_id,
      v_qty,
      v_part.name_ar,
      v_part.category,
      COALESCE(v_part.img, v_part.image_url),
      v_part.price
    );

    v_total := v_total + (v_part.price * v_qty);
  END LOOP;

  UPDATE public.spare_part_orders o
  SET total_amount = v_total
  WHERE o.id = v_order_id;

  RETURN QUERY SELECT v_order_id, v_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_spare_part_order(text, jsonb, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.restore_spare_part_order_stock(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.spare_parts sp
  SET stock_quantity = sp.stock_quantity + oi.quantity
  FROM public.spare_part_order_items oi
  WHERE oi.order_id = p_order_id
    AND oi.spare_part_id = sp.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_spare_part_order_cancelled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    PERFORM public.restore_spare_part_order_stock(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS spare_part_orders_restore_stock_on_cancel ON public.spare_part_orders;

CREATE TRIGGER spare_part_orders_restore_stock_on_cancel
  AFTER UPDATE OF status ON public.spare_part_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_spare_part_order_cancelled();

CREATE OR REPLACE FUNCTION public.mark_spare_part_order_paid(
  p_order_id uuid,
  p_payment_reference text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_order public.spare_part_orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order
  FROM public.spare_part_orders o
  WHERE o.id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_order.client_id <> auth.uid() OR NOT public.is_client() THEN
    RAISE EXCEPTION 'forbidden'
      USING ERRCODE = 'P0001',
            MESSAGE = 'غير مصرح';
  END IF;

  IF v_order.payment_method <> 'online' OR v_order.payment_status = 'paid' THEN
    RETURN false;
  END IF;

  UPDATE public.spare_part_orders o
  SET
    payment_status = 'paid',
    payment_reference = NULLIF(trim(p_payment_reference), '')
  WHERE o.id = p_order_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_spare_part_order_paid(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

-- ===== 20260614120000_fix_spare_part_order_ambiguous_id.sql =====
-- Fix: RETURNS TABLE (id ...) shadowed bare "id" in WHERE clauses

CREATE OR REPLACE FUNCTION public.create_spare_part_order(
  p_notes text,
  p_items jsonb,
  p_payment_method text DEFAULT 'cash_on_delivery'
)
RETURNS TABLE (id uuid, order_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_client_id uuid;
  v_order_id uuid;
  v_token text;
  v_item jsonb;
  v_part_id uuid;
  v_qty integer;
  v_part public.spare_parts%ROWTYPE;
  v_total numeric(10, 2) := 0;
  v_payment_method public.spare_part_payment_method;
BEGIN
  v_client_id := auth.uid();

  IF v_client_id IS NULL OR NOT public.is_client() THEN
    RAISE EXCEPTION 'client_required'
      USING ERRCODE = 'P0001',
            MESSAGE = 'يجب تسجيل الدخول كعميل';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'empty_cart'
      USING ERRCODE = 'P0001',
            MESSAGE = 'السلة فارغة';
  END IF;

  IF p_payment_method = 'online' THEN
    v_payment_method := 'online';
  ELSE
    v_payment_method := 'cash_on_delivery';
  END IF;

  INSERT INTO public.spare_part_orders (
    client_id,
    notes,
    status,
    payment_method,
    payment_status
  )
  VALUES (
    v_client_id,
    NULLIF(trim(p_notes), ''),
    'pending',
    v_payment_method,
    'pending'
  )
  RETURNING spare_part_orders.id, spare_part_orders.order_token
  INTO v_order_id, v_token;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_part_id := (v_item ->> 'spare_part_id')::uuid;
    v_qty := (v_item ->> 'quantity')::integer;

    IF v_part_id IS NULL OR v_qty IS NULL OR v_qty < 1 OR v_qty > 99 THEN
      RAISE EXCEPTION 'invalid_item'
        USING ERRCODE = 'P0001',
              MESSAGE = 'عنصر غير صالح في السلة';
    END IF;

    SELECT * INTO v_part
    FROM public.spare_parts sp
    WHERE sp.id = v_part_id AND sp.is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'part_unavailable'
        USING ERRCODE = 'P0001',
              MESSAGE = 'قطعة غير متاحة';
    END IF;

    IF v_part.stock_quantity < v_qty THEN
      RAISE EXCEPTION 'insufficient_stock'
        USING ERRCODE = 'P0001',
              MESSAGE = format('الكمية غير كافية في المخزون: %s', v_part.name_ar);
    END IF;

    UPDATE public.spare_parts sp
    SET stock_quantity = sp.stock_quantity - v_qty
    WHERE sp.id = v_part_id;

    INSERT INTO public.spare_part_order_items (
      order_id,
      spare_part_id,
      quantity,
      name_snapshot,
      category_snapshot,
      img_snapshot,
      price_snapshot
    )
    VALUES (
      v_order_id,
      v_part_id,
      v_qty,
      v_part.name_ar,
      v_part.category,
      COALESCE(v_part.img, v_part.image_url),
      v_part.price
    );

    v_total := v_total + (v_part.price * v_qty);
  END LOOP;

  UPDATE public.spare_part_orders o
  SET total_amount = v_total
  WHERE o.id = v_order_id;

  RETURN QUERY SELECT v_order_id, v_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_spare_part_order_paid(
  p_order_id uuid,
  p_payment_reference text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_order public.spare_part_orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order
  FROM public.spare_part_orders o
  WHERE o.id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_order.client_id <> auth.uid() OR NOT public.is_client() THEN
    RAISE EXCEPTION 'forbidden'
      USING ERRCODE = 'P0001',
            MESSAGE = 'غير مصرح';
  END IF;

  IF v_order.payment_method <> 'online' OR v_order.payment_status = 'paid' THEN
    RETURN false;
  END IF;

  UPDATE public.spare_part_orders o
  SET
    payment_status = 'paid',
    payment_reference = NULLIF(trim(p_payment_reference), '')
  WHERE o.id = p_order_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_spare_part_order(text, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_spare_part_order_paid(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

-- ===== 20260615120000_services_spare_parts_i18n.sql =====
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

-- ===== 20260615140000_spare_parts_category_en.sql =====
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

-- ===== 20260615150000_site_content_i18n.sql =====
-- Bilingual CMS content (workshops, hero, about) for existing databases

UPDATE public.site_content
SET value = '{
  "branches": [
    {
      "id": "riyadh-north",
      "name_ar": "ورشة الشمال - الرياض",
      "name_en": "North Workshop - Riyadh",
      "address_ar": "حي النرجس، الرياض",
      "address_en": "Al Narjis District, Riyadh",
      "lat": 24.8167,
      "lng": 46.7219
    },
    {
      "id": "riyadh-south",
      "name_ar": "ورشة الجنوب - الرياض",
      "name_en": "South Workshop - Riyadh",
      "address_ar": "حي العزيزية، الرياض",
      "address_en": "Al Aziziyah District, Riyadh",
      "lat": 24.5720,
      "lng": 46.7890
    }
  ]
}'::jsonb
WHERE key = 'locations.workshops';

UPDATE public.site_content
SET value = value
  || '{
    "title_before_en": "Your car deserves the best,",
    "title_highlight_en": "and we deliver it.",
    "subtitle_en": "Forget the hassle of maintenance and waiting — at Service Time we come to you in Riyadh with a certified technical team, whether you need periodic maintenance, emergency help, or spare parts. Request service in minutes, track your order in real time, and leave the rest to us.",
    "cta_en": "Get started"
  }'::jsonb
WHERE key = 'home.hero'
  AND NOT (value ? 'title_before_en');

UPDATE public.site_content
SET value = value
  || '{
    "title_en": "About us",
    "body_en": "Service Time is a Saudi platform for car maintenance and spare parts orders with live technician tracking."
  }'::jsonb
WHERE key = 'about.summary'
  AND NOT (value ? 'title_en');

-- ===== 20260616120000_service_requests_client_id.sql =====
-- Lier les demandes au compte client + matching téléphone robuste + suivi token

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS service_requests_client_id_idx
  ON public.service_requests (client_id);

-- Compare les 9 derniers chiffres (ex. 05xxxxxxxx ↔ +9665xxxxxxxx)
CREATE OR REPLACE FUNCTION public.phone_digits_match(a text, b text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  WITH da AS (
    SELECT regexp_replace(COALESCE(a, ''), '\D', '', 'g') AS d
  ),
  db AS (
    SELECT regexp_replace(COALESCE(b, ''), '\D', '', 'g') AS d
  ),
  na AS (
    SELECT CASE
      WHEN length(d) >= 9 THEN right(d, 9)
      ELSE d
    END AS suffix
    FROM da
  ),
  nb AS (
    SELECT CASE
      WHEN length(d) >= 9 THEN right(d, 9)
      ELSE d
    END AS suffix
    FROM db
  )
  SELECT na.suffix = nb.suffix
    AND length(na.suffix) >= 9
    AND length(nb.suffix) >= 9
  FROM na, nb;
$$;

CREATE OR REPLACE FUNCTION public.client_owns_request(p_customer_phone text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'client'
      AND p.is_active = true
      AND p.phone IS NOT NULL
      AND public.phone_digits_match(p_customer_phone, p.phone)
  );
$$;

-- Rattacher les demandes existantes au client (même numéro)
UPDATE public.service_requests sr
SET client_id = p.id
FROM public.profiles p
WHERE p.role = 'client'
  AND p.is_active = true
  AND p.phone IS NOT NULL
  AND sr.client_id IS NULL
  AND public.phone_digits_match(sr.customer_phone, p.phone);

DROP POLICY IF EXISTS "service_requests_client_select_own" ON public.service_requests;
CREATE POLICY "service_requests_client_select_own"
  ON public.service_requests FOR SELECT
  USING (
    (client_id = auth.uid() AND public.is_client())
    OR public.client_owns_request(customer_phone)
  );

DROP POLICY IF EXISTS "request_status_history_client_select" ON public.request_status_history;
CREATE POLICY "request_status_history_client_select"
  ON public.request_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.service_requests r
      WHERE r.id = request_id
        AND (
          (r.client_id = auth.uid() AND public.is_client())
          OR public.client_owns_request(r.customer_phone)
        )
    )
  );

CREATE OR REPLACE FUNCTION public.create_service_request(
  p_customer_name text,
  p_customer_phone text,
  p_car_type text,
  p_location_text text,
  p_description text,
  p_service_type public.service_type,
  p_execution_method public.execution_method,
  p_location_lat double precision DEFAULT NULL,
  p_location_lng double precision DEFAULT NULL
)
RETURNS TABLE (id uuid, tracking_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id uuid := NULL;
BEGIN
  IF public.is_client() THEN
    v_client_id := auth.uid();
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.service_requests sr
    WHERE sr.customer_phone = p_customer_phone
      AND sr.service_type = p_service_type
      AND sr.created_at > now() - interval '15 minutes'
  ) THEN
    RAISE EXCEPTION 'duplicate_request'
      USING ERRCODE = 'P0001',
            MESSAGE = 'تم إرسال طلب مشابه مؤخراً';
  END IF;

  RETURN QUERY
  INSERT INTO public.service_requests (
    customer_name,
    customer_phone,
    car_type,
    location_text,
    location_lat,
    location_lng,
    description,
    service_type,
    execution_method,
    status,
    client_id
  )
  VALUES (
    p_customer_name,
    p_customer_phone,
    NULLIF(trim(p_car_type), ''),
    NULLIF(trim(p_location_text), ''),
    p_location_lat,
    p_location_lng,
    NULLIF(trim(p_description), ''),
    p_service_type,
    p_execution_method,
    'received',
    v_client_id
  )
  RETURNING service_requests.id, service_requests.tracking_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_request_by_tracking_token(p_token text)
RETURNS SETOF public.service_requests
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.service_requests
  WHERE lower(trim(tracking_token)) = lower(trim(p_token))
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_request_status_history_by_token(p_token text)
RETURNS SETOF public.request_status_history
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT h.*
  FROM public.request_status_history h
  INNER JOIN public.service_requests r ON r.id = h.request_id
  WHERE lower(trim(r.tracking_token)) = lower(trim(p_token))
  ORDER BY h.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.phone_digits_match(text, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.create_service_request(
  text, text, text, text, text,
  public.service_type, public.execution_method,
  double precision, double precision
) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';

-- ===== 20260617120000_quick_requests.sql =====
-- Demandes rapides depuis /request?mode=quick (sans compte)

CREATE TABLE IF NOT EXISTS public.quick_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  message text NOT NULL,
  photo_storage_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quick_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quick_requests_public_insert" ON public.quick_requests;
CREATE POLICY "quick_requests_public_insert"
  ON public.quick_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "quick_requests_admin_select" ON public.quick_requests;
CREATE POLICY "quick_requests_admin_select"
  ON public.quick_requests
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

GRANT ALL ON public.quick_requests TO service_role;
GRANT ALL ON public.quick_requests TO postgres;

NOTIFY pgrst, 'reload schema';

-- ===== 20260618120000_quick_requests_client_id.sql =====
-- Lier les demandes rapides au compte client

ALTER TABLE public.quick_requests
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS quick_requests_client_id_idx
  ON public.quick_requests (client_id);

NOTIFY pgrst, 'reload schema';

-- ===== 20260619120000_spare_parts_images.sql =====
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

-- ===== 20260620120000_technician_location_tracking.sql =====
-- Live technician GPS for order tracking (anon via token, clients via RLS)

CREATE OR REPLACE FUNCTION public.get_technician_location_for_tracking(p_token text)
RETURNS TABLE (
  lat double precision,
  lng double precision,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tl.lat, tl.lng, tl.updated_at
  FROM public.service_requests r
  INNER JOIN public.technician_locations tl
    ON tl.technician_id = r.assigned_technician_id
  WHERE lower(trim(r.tracking_token)) = lower(trim(p_token))
    AND r.assigned_technician_id IS NOT NULL
    AND r.status IN ('on_the_way', 'arrived')
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_technician_location_for_tracking(text)
  TO anon, authenticated;

DROP POLICY IF EXISTS "technician_locations_client_select_assigned"
  ON public.technician_locations;

CREATE POLICY "technician_locations_client_select_assigned"
  ON public.technician_locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.service_requests r
      WHERE r.assigned_technician_id = technician_locations.technician_id
        AND r.client_id = auth.uid()
        AND r.status IN ('on_the_way', 'arrived')
    )
  );

NOTIFY pgrst, 'reload schema';

-- ===== 20260620130000_technician_location_realtime.sql =====
-- Realtime location updates + public read for active tracking

ALTER TABLE public.technician_locations REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'technician_locations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.technician_locations;
  END IF;
END $$;

DROP POLICY IF EXISTS "technician_locations_anon_select_active"
  ON public.technician_locations;

CREATE POLICY "technician_locations_anon_select_active"
  ON public.technician_locations FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1
      FROM public.service_requests r
      WHERE r.assigned_technician_id = technician_locations.technician_id
        AND r.status IN ('on_the_way', 'arrived')
    )
  );

NOTIFY pgrst, 'reload schema';

-- ===== 20260621120000_client_vehicles.sql =====
-- Saved client vehicles for quick selection on new service requests

CREATE TABLE public.client_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT client_vehicles_label_not_empty CHECK (char_length(trim(label)) > 0)
);

CREATE UNIQUE INDEX client_vehicles_client_label_unique
  ON public.client_vehicles (client_id, lower(trim(label)));

CREATE INDEX client_vehicles_client_id_idx
  ON public.client_vehicles (client_id);

CREATE TRIGGER client_vehicles_set_updated_at
  BEFORE UPDATE ON public.client_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.client_vehicles (client_id, label)
SELECT DISTINCT sr.client_id, trim(sr.car_type)
FROM public.service_requests sr
WHERE sr.client_id IS NOT NULL
  AND sr.car_type IS NOT NULL
  AND char_length(trim(sr.car_type)) > 0
  AND NOT EXISTS (
    SELECT 1
    FROM public.client_vehicles cv
    WHERE cv.client_id = sr.client_id
      AND lower(trim(cv.label)) = lower(trim(sr.car_type))
  );

ALTER TABLE public.client_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_vehicles_admin_all"
  ON public.client_vehicles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "client_vehicles_client_select_own"
  ON public.client_vehicles FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "client_vehicles_client_insert_own"
  ON public.client_vehicles FOR INSERT
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "client_vehicles_client_update_own"
  ON public.client_vehicles FOR UPDATE
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "client_vehicles_client_delete_own"
  ON public.client_vehicles FOR DELETE
  USING (client_id = auth.uid());

NOTIFY pgrst, 'reload schema';

-- ===== 20260622130000_profile_localized_names.sql =====
-- Bilingual profile display names (AR / EN)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name_ar text,
  ADD COLUMN IF NOT EXISTS full_name_en text;

UPDATE public.profiles
SET full_name_ar = full_name
WHERE full_name_ar IS NULL OR trim(full_name_ar) = '';

NOTIFY pgrst, 'reload schema';

-- ===== 20260623120000_service_request_quotes.sql =====
-- Price negotiation for service requests (client proposal → admin accept/counter → client accept)

DO $$
BEGIN
  CREATE TYPE public.quote_status AS ENUM (
    'pending_admin',
    'admin_countered',
    'accepted',
    'declined'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS client_proposed_price numeric(10, 2),
  ADD COLUMN IF NOT EXISTS admin_counter_price numeric(10, 2),
  ADD COLUMN IF NOT EXISTS agreed_price numeric(10, 2),
  ADD COLUMN IF NOT EXISTS quote_status public.quote_status;

CREATE OR REPLACE FUNCTION public.create_service_request(
  p_customer_name text,
  p_customer_phone text,
  p_car_type text,
  p_location_text text,
  p_description text,
  p_service_type public.service_type,
  p_execution_method public.execution_method,
  p_location_lat double precision DEFAULT NULL,
  p_location_lng double precision DEFAULT NULL,
  p_client_proposed_price numeric DEFAULT NULL
)
RETURNS TABLE (id uuid, tracking_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id uuid := NULL;
  v_price numeric(10, 2);
BEGIN
  IF public.is_client() THEN
    v_client_id := auth.uid();
  END IF;

  v_price := NULLIF(p_client_proposed_price, 0);

  IF EXISTS (
    SELECT 1
    FROM public.service_requests sr
    WHERE sr.customer_phone = p_customer_phone
      AND sr.service_type = p_service_type
      AND sr.created_at > now() - interval '15 minutes'
  ) THEN
    RAISE EXCEPTION 'duplicate_request'
      USING ERRCODE = 'P0001',
            MESSAGE = 'تم إرسال طلب مشابه مؤخراً';
  END IF;

  RETURN QUERY
  INSERT INTO public.service_requests (
    customer_name,
    customer_phone,
    car_type,
    location_text,
    location_lat,
    location_lng,
    description,
    service_type,
    execution_method,
    status,
    client_id,
    client_proposed_price,
    quote_status
  )
  VALUES (
    p_customer_name,
    p_customer_phone,
    NULLIF(trim(p_car_type), ''),
    NULLIF(trim(p_location_text), ''),
    p_location_lat,
    p_location_lng,
    NULLIF(trim(p_description), ''),
    p_service_type,
    p_execution_method,
    'received',
    v_client_id,
    v_price,
    CASE
      WHEN v_price IS NOT NULL THEN 'pending_admin'::public.quote_status
      ELSE NULL
    END
  )
  RETURNING service_requests.id, service_requests.tracking_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_accept_client_quote(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'unauthorized'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.service_requests
  SET
    agreed_price = client_proposed_price,
    admin_counter_price = NULL,
    quote_status = 'accepted'::public.quote_status,
    updated_at = now()
  WHERE id = p_request_id
    AND client_proposed_price IS NOT NULL
    AND quote_status IN (
      'pending_admin'::public.quote_status,
      'admin_countered'::public.quote_status
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_quote_state'
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_counter_service_quote(
  p_request_id uuid,
  p_counter_price numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_price numeric(10, 2);
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'unauthorized'
      USING ERRCODE = '42501';
  END IF;

  v_price := NULLIF(p_counter_price, 0);

  IF v_price IS NULL OR v_price <= 0 THEN
    RAISE EXCEPTION 'invalid_price'
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.service_requests
  SET
    admin_counter_price = v_price,
    quote_status = 'admin_countered'::public.quote_status,
    updated_at = now()
  WHERE id = p_request_id
    AND client_proposed_price IS NOT NULL
    AND quote_status IN (
      'pending_admin'::public.quote_status,
      'admin_countered'::public.quote_status
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_quote_state'
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.client_accept_counter_quote(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_client() THEN
    RAISE EXCEPTION 'unauthorized'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.service_requests r
  SET
    agreed_price = r.admin_counter_price,
    quote_status = 'accepted'::public.quote_status,
    updated_at = now()
  WHERE r.id = p_request_id
    AND r.quote_status = 'admin_countered'::public.quote_status
    AND r.admin_counter_price IS NOT NULL
    AND (
      r.client_id = auth.uid()
      OR public.client_owns_request(r.customer_phone)
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_quote_state'
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_accept_client_quote(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_counter_service_quote(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.client_accept_counter_quote(uuid) TO authenticated;

-- ===== 20260624120000_security_hardening.sql =====
-- Security hardening: privilege escalation, RPC grants, RLS, storage

-- ---------------------------------------------------------------------------
-- 1. Block non-admin profile privilege escalation
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.profiles_prevent_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'role_change_forbidden'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    RAISE EXCEPTION 'active_change_forbidden'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.technician_type IS DISTINCT FROM OLD.technician_type THEN
    RAISE EXCEPTION 'technician_type_change_forbidden'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_privilege_escalation ON public.profiles;

CREATE TRIGGER profiles_prevent_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_prevent_privilege_escalation();

CREATE OR REPLACE FUNCTION public.profiles_validate_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL OR auth.uid() <> NEW.id THEN
    RAISE EXCEPTION 'profile_insert_forbidden'
      USING ERRCODE = '42501';
  END IF;

  NEW.role := 'client';
  NEW.is_active := COALESCE(NEW.is_active, true);
  NEW.technician_type := NULL;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_validate_insert ON public.profiles;

CREATE TRIGGER profiles_validate_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_validate_insert();

-- ---------------------------------------------------------------------------
-- 2. Revoke dangerous anon / client RPC grants
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.delete_service_request_draft(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.attach_request_photo(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.mark_spare_part_order_paid(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_spare_part_order_paid(uuid, text) FROM anon;

-- ---------------------------------------------------------------------------
-- 3. Remove open INSERT policies (use RPC / service role only)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "service_requests_public_insert" ON public.service_requests;
DROP POLICY IF EXISTS "request_photos_public_insert" ON public.request_photos;

-- ---------------------------------------------------------------------------
-- 4. Stop leaking all technician GPS to anonymous clients
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "technician_locations_anon_select_active"
  ON public.technician_locations;

-- ---------------------------------------------------------------------------
-- 5. Harden delete_service_request_draft — owner only
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_service_request_draft(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.service_requests sr
  WHERE sr.id = p_request_id
    AND sr.status = 'received'
    AND sr.created_at > now() - interval '10 minutes'
    AND (
      (sr.client_id = auth.uid() AND public.is_client())
      OR public.is_admin()
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'draft_delete_forbidden'
      USING ERRCODE = '42501';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_service_request_draft(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_service_request_draft(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

-- ===== 20260624200000_security_critical_complete.sql =====
-- Complete critical security fixes (RPC auth, tracking, storage, create_service_request)

-- ---------------------------------------------------------------------------
-- 6. create_service_request — authenticated clients only
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_service_request(
  p_customer_name text,
  p_customer_phone text,
  p_car_type text,
  p_location_text text,
  p_description text,
  p_service_type public.service_type,
  p_execution_method public.execution_method,
  p_location_lat double precision DEFAULT NULL,
  p_location_lng double precision DEFAULT NULL,
  p_client_proposed_price numeric DEFAULT NULL
)
RETURNS TABLE (id uuid, tracking_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id uuid;
  v_price numeric(10, 2);
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_client() THEN
    RAISE EXCEPTION 'client_required'
      USING ERRCODE = '42501';
  END IF;

  v_client_id := auth.uid();
  v_price := NULLIF(p_client_proposed_price, 0);

  IF EXISTS (
    SELECT 1
    FROM public.service_requests sr
    WHERE sr.customer_phone = p_customer_phone
      AND sr.service_type = p_service_type
      AND sr.created_at > now() - interval '15 minutes'
  ) THEN
    RAISE EXCEPTION 'duplicate_request'
      USING ERRCODE = 'P0001',
            MESSAGE = 'تم إرسال طلب مشابه مؤخراً';
  END IF;

  RETURN QUERY
  INSERT INTO public.service_requests (
    customer_name,
    customer_phone,
    car_type,
    location_text,
    location_lat,
    location_lng,
    description,
    service_type,
    execution_method,
    status,
    client_id,
    client_proposed_price,
    quote_status
  )
  VALUES (
    p_customer_name,
    p_customer_phone,
    NULLIF(trim(p_car_type), ''),
    NULLIF(trim(p_location_text), ''),
    p_location_lat,
    p_location_lng,
    NULLIF(trim(p_description), ''),
    p_service_type,
    p_execution_method,
    'received',
    v_client_id,
    v_price,
    CASE
      WHEN v_price IS NOT NULL THEN 'pending_admin'::public.quote_status
      ELSE NULL
    END
  )
  RETURNING service_requests.id, service_requests.tracking_token;
END;
$$;

REVOKE ALL ON FUNCTION public.create_service_request(
  text, text, text, text, text,
  public.service_type, public.execution_method,
  double precision, double precision, numeric
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_service_request(
  text, text, text, text, text,
  public.service_type, public.execution_method,
  double precision, double precision, numeric
) TO authenticated, service_role;

-- Drop legacy overload without price param (if present)
DROP FUNCTION IF EXISTS public.create_service_request(
  text, text, text, text, text,
  public.service_type, public.execution_method,
  double precision, double precision
);

-- ---------------------------------------------------------------------------
-- 7. attach_request_photo — owner / admin only
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.attach_request_photo(
  p_request_id uuid,
  p_storage_path text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.service_requests sr
    WHERE sr.id = p_request_id
      AND (
        public.is_admin()
        OR (public.is_client() AND sr.client_id = auth.uid())
        OR (public.is_client() AND public.client_owns_request(sr.customer_phone))
      )
  ) THEN
    RAISE EXCEPTION 'forbidden'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.request_photos (request_id, storage_path)
  VALUES (p_request_id, p_storage_path)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.attach_request_photo(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.attach_request_photo(uuid, text)
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 8. Tracking RPCs — authenticated + ownership only
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_request_by_tracking_token(p_token text)
RETURNS SETOF public.service_requests
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT sr.*
  FROM public.service_requests sr
  WHERE lower(trim(sr.tracking_token)) = lower(trim(p_token))
    AND (
      public.is_admin()
      OR (
        public.is_client()
        AND (
          sr.client_id = auth.uid()
          OR public.client_owns_request(sr.customer_phone)
        )
      )
      OR (
        public.is_technician()
        AND sr.assigned_technician_id = auth.uid()
      )
    )
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_request_status_history_by_token(p_token text)
RETURNS SETOF public.request_status_history
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT h.*
  FROM public.request_status_history h
  INNER JOIN public.service_requests sr ON sr.id = h.request_id
  WHERE lower(trim(sr.tracking_token)) = lower(trim(p_token))
    AND (
      public.is_admin()
      OR (
        public.is_client()
        AND (
          sr.client_id = auth.uid()
          OR public.client_owns_request(sr.customer_phone)
        )
      )
      OR (
        public.is_technician()
        AND sr.assigned_technician_id = auth.uid()
      )
    )
  ORDER BY h.created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_technician_location_for_tracking(p_token text)
RETURNS TABLE (
  lat double precision,
  lng double precision,
  updated_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT tl.lat, tl.lng, tl.updated_at
  FROM public.service_requests sr
  INNER JOIN public.technician_locations tl
    ON tl.technician_id = sr.assigned_technician_id
  WHERE lower(trim(sr.tracking_token)) = lower(trim(p_token))
    AND sr.assigned_technician_id IS NOT NULL
    AND sr.status IN ('on_the_way', 'arrived')
    AND (
      public.is_admin()
      OR (
        public.is_client()
        AND (
          sr.client_id = auth.uid()
          OR public.client_owns_request(sr.customer_phone)
        )
      )
      OR (
        public.is_technician()
        AND sr.assigned_technician_id = auth.uid()
      )
    )
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.get_request_by_tracking_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_request_status_history_by_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_technician_location_for_tracking(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_request_by_tracking_token(text)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_request_status_history_by_token(text)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_technician_location_for_tracking(text)
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 9. mark_spare_part_order_paid — service role only (webhook uses direct update)
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.mark_spare_part_order_paid(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_spare_part_order_paid(uuid, text) TO service_role;

-- ---------------------------------------------------------------------------
-- 10. Storage — block anonymous uploads
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "request_photos_storage_insert" ON storage.objects;
CREATE POLICY "request_photos_storage_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'request-photos'
    AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "profile_avatars_insert" ON storage.objects;
CREATE POLICY "profile_avatars_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "profile_avatars_update" ON storage.objects;
CREATE POLICY "profile_avatars_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'profile-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "profile_avatars_delete" ON storage.objects;
CREATE POLICY "profile_avatars_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

NOTIFY pgrst, 'reload schema';

-- ===== 20260625120000_service_request_payment.sql =====
-- Paiement des demandes de service après accord sur le prix

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS payment_method public.spare_part_payment_method,
  ADD COLUMN IF NOT EXISTS payment_status public.spare_part_payment_status,
  ADD COLUMN IF NOT EXISTS payment_reference text;

UPDATE public.service_requests
SET payment_status = 'pending'::public.spare_part_payment_status
WHERE quote_status = 'accepted'::public.quote_status
  AND client_proposed_price IS NOT NULL
  AND payment_status IS NULL;

CREATE OR REPLACE FUNCTION public.admin_accept_client_quote(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'unauthorized'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.service_requests
  SET
    agreed_price = client_proposed_price,
    admin_counter_price = NULL,
    quote_status = 'accepted'::public.quote_status,
    payment_method = NULL,
    payment_status = 'pending'::public.spare_part_payment_status,
    payment_reference = NULL,
    updated_at = now()
  WHERE id = p_request_id
    AND client_proposed_price IS NOT NULL
    AND quote_status IN (
      'pending_admin'::public.quote_status,
      'admin_countered'::public.quote_status
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_quote_state'
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.client_accept_counter_quote(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_client() THEN
    RAISE EXCEPTION 'unauthorized'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.service_requests r
  SET
    agreed_price = r.admin_counter_price,
    quote_status = 'accepted'::public.quote_status,
    payment_method = NULL,
    payment_status = 'pending'::public.spare_part_payment_status,
    payment_reference = NULL,
    updated_at = now()
  WHERE r.id = p_request_id
    AND r.quote_status = 'admin_countered'::public.quote_status
    AND r.admin_counter_price IS NOT NULL
    AND (
      r.client_id = auth.uid()
      OR public.client_owns_request(r.customer_phone)
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_quote_state'
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.client_set_service_request_payment(
  p_request_id uuid,
  p_payment_method text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_method public.spare_part_payment_method;
BEGIN
  IF NOT public.is_client() THEN
    RAISE EXCEPTION 'unauthorized'
      USING ERRCODE = '42501';
  END IF;

  IF p_payment_method = 'online' THEN
    v_method := 'online'::public.spare_part_payment_method;
  ELSIF p_payment_method = 'cash_on_delivery' THEN
    v_method := 'cash_on_delivery'::public.spare_part_payment_method;
  ELSE
    RAISE EXCEPTION 'invalid_payment_method'
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.service_requests r
  SET
    payment_method = v_method,
    payment_status = 'pending'::public.spare_part_payment_status,
    payment_reference = NULL,
    updated_at = now()
  WHERE r.id = p_request_id
    AND r.quote_status = 'accepted'::public.quote_status
    AND r.agreed_price IS NOT NULL
    AND (r.payment_status IS DISTINCT FROM 'paid'::public.spare_part_payment_status)
    AND (
      r.client_id = auth.uid()
      OR public.client_owns_request(r.customer_phone)
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_payment_state'
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_mark_service_request_paid(
  p_request_id uuid,
  p_reference text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'unauthorized'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.service_requests
  SET
    payment_status = 'paid'::public.spare_part_payment_status,
    payment_reference = NULLIF(trim(p_reference), ''),
    updated_at = now()
  WHERE id = p_request_id
    AND quote_status = 'accepted'::public.quote_status
    AND agreed_price IS NOT NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_payment_state'
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.client_set_service_request_payment(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_mark_service_request_paid(uuid, text) TO authenticated;

-- ===== 20260626120000_security_remaining_fixes.sql =====
-- Correctifs sécurité restants : RAISE SQL, INSERT publics, RPC

-- ---------------------------------------------------------------------------
-- 1. create_service_request — fix RAISE duplicate MESSAGE
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_service_request(
  p_customer_name text,
  p_customer_phone text,
  p_car_type text,
  p_location_text text,
  p_description text,
  p_service_type public.service_type,
  p_execution_method public.execution_method,
  p_location_lat double precision DEFAULT NULL,
  p_location_lng double precision DEFAULT NULL,
  p_client_proposed_price numeric DEFAULT NULL
)
RETURNS TABLE (id uuid, tracking_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id uuid;
  v_price numeric(10, 2);
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_client() THEN
    RAISE EXCEPTION 'client_required' USING ERRCODE = '42501';
  END IF;

  v_client_id := auth.uid();
  v_price := NULLIF(p_client_proposed_price, 0);

  IF EXISTS (
    SELECT 1
    FROM public.service_requests sr
    WHERE sr.customer_phone = p_customer_phone
      AND sr.service_type = p_service_type
      AND sr.created_at > now() - interval '15 minutes'
  ) THEN
    RAISE EXCEPTION 'تم إرسال طلب مشابه مؤخراً' USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY
  INSERT INTO public.service_requests (
    customer_name,
    customer_phone,
    car_type,
    location_text,
    location_lat,
    location_lng,
    description,
    service_type,
    execution_method,
    status,
    client_id,
    client_proposed_price,
    quote_status
  )
  VALUES (
    p_customer_name,
    p_customer_phone,
    NULLIF(trim(p_car_type), ''),
    NULLIF(trim(p_location_text), ''),
    p_location_lat,
    p_location_lng,
    NULLIF(trim(p_description), ''),
    p_service_type,
    p_execution_method,
    'received',
    v_client_id,
    v_price,
    CASE
      WHEN v_price IS NOT NULL THEN 'pending_admin'::public.quote_status
      ELSE NULL
    END
  )
  RETURNING service_requests.id, service_requests.tracking_token;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. create_spare_part_order — fix RAISE duplicate MESSAGE
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_spare_part_order(
  p_notes text,
  p_items jsonb,
  p_payment_method text DEFAULT 'cash_on_delivery'
)
RETURNS TABLE (id uuid, order_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_client_id uuid;
  v_order_id uuid;
  v_token text;
  v_item jsonb;
  v_part_id uuid;
  v_qty integer;
  v_part public.spare_parts%ROWTYPE;
  v_total numeric(10, 2) := 0;
  v_payment_method public.spare_part_payment_method;
BEGIN
  v_client_id := auth.uid();

  IF v_client_id IS NULL OR NOT public.is_client() THEN
    RAISE EXCEPTION 'يجب تسجيل الدخول كعميل' USING ERRCODE = 'P0001';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'السلة فارغة' USING ERRCODE = 'P0001';
  END IF;

  IF p_payment_method = 'online' THEN
    v_payment_method := 'online';
  ELSE
    v_payment_method := 'cash_on_delivery';
  END IF;

  INSERT INTO public.spare_part_orders (
    client_id,
    notes,
    status,
    payment_method,
    payment_status
  )
  VALUES (
    v_client_id,
    NULLIF(trim(p_notes), ''),
    'pending',
    v_payment_method,
    'pending'
  )
  RETURNING spare_part_orders.id, spare_part_orders.order_token
  INTO v_order_id, v_token;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_part_id := (v_item ->> 'spare_part_id')::uuid;
    v_qty := (v_item ->> 'quantity')::integer;

    IF v_part_id IS NULL OR v_qty IS NULL OR v_qty < 1 OR v_qty > 99 THEN
      RAISE EXCEPTION 'عنصر غير صالح في السلة' USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_part
    FROM public.spare_parts sp
    WHERE sp.id = v_part_id AND sp.is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'قطعة غير متاحة' USING ERRCODE = 'P0001';
    END IF;

    IF v_part.stock_quantity < v_qty THEN
      RAISE EXCEPTION USING
        ERRCODE = 'P0001',
        MESSAGE = format('الكمية غير كافية في المخزون: %s', v_part.name_ar);
    END IF;

    UPDATE public.spare_parts sp
    SET stock_quantity = sp.stock_quantity - v_qty
    WHERE sp.id = v_part_id;

    INSERT INTO public.spare_part_order_items (
      order_id,
      spare_part_id,
      quantity,
      name_snapshot,
      category_snapshot,
      img_snapshot,
      price_snapshot
    )
    VALUES (
      v_order_id,
      v_part_id,
      v_qty,
      v_part.name_ar,
      v_part.category,
      COALESCE(v_part.img, v_part.image_url),
      v_part.price
    );

    v_total := v_total + (v_part.price * v_qty);
  END LOOP;

  UPDATE public.spare_part_orders o
  SET total_amount = v_total
  WHERE o.id = v_order_id;

  RETURN QUERY SELECT v_order_id, v_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_spare_part_order_paid(
  p_order_id uuid,
  p_payment_reference text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_order public.spare_part_orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order
  FROM public.spare_part_orders o
  WHERE o.id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_order.client_id <> auth.uid() OR NOT public.is_client() THEN
    RAISE EXCEPTION 'غير مصرح' USING ERRCODE = 'P0001';
  END IF;

  IF v_order.payment_method <> 'online' OR v_order.payment_status = 'paid' THEN
    RETURN false;
  END IF;

  UPDATE public.spare_part_orders o
  SET
    payment_status = 'paid',
    payment_reference = NULLIF(trim(p_payment_reference), '')
  WHERE o.id = p_order_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_spare_part_order_paid(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_spare_part_order_paid(uuid, text) TO service_role;

-- ---------------------------------------------------------------------------
-- 3. Fermer les INSERT publics (spam via clé anon Supabase)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "quick_requests_public_insert" ON public.quick_requests;
DROP POLICY IF EXISTS "contact_messages_public_insert" ON public.contact_messages;

REVOKE INSERT ON public.quick_requests FROM anon, authenticated;
REVOKE INSERT ON public.contact_messages FROM anon, authenticated;

NOTIFY pgrst, 'reload schema';

-- ===== 20260626140000_security_medium_client_id_only.sql =====
-- Medium: remove phone-based IDOR — client access via client_id only

DROP POLICY IF EXISTS "service_requests_client_select_own" ON public.service_requests;
CREATE POLICY "service_requests_client_select_own"
  ON public.service_requests FOR SELECT
  USING (client_id = auth.uid() AND public.is_client());

DROP POLICY IF EXISTS "request_status_history_client_select" ON public.request_status_history;
CREATE POLICY "request_status_history_client_select"
  ON public.request_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.service_requests r
      WHERE r.id = request_id
        AND r.client_id = auth.uid()
        AND public.is_client()
    )
  );

CREATE OR REPLACE FUNCTION public.attach_request_photo(
  p_request_id uuid,
  p_storage_path text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.service_requests sr
    WHERE sr.id = p_request_id
      AND (
        public.is_admin()
        OR (public.is_client() AND sr.client_id = auth.uid())
      )
  ) THEN
    RAISE EXCEPTION 'forbidden'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.request_photos (request_id, storage_path)
  VALUES (p_request_id, p_storage_path)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_request_by_tracking_token(p_token text)
RETURNS SETOF public.service_requests
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT sr.*
  FROM public.service_requests sr
  WHERE lower(trim(sr.tracking_token)) = lower(trim(p_token))
    AND (
      public.is_admin()
      OR (public.is_client() AND sr.client_id = auth.uid())
      OR (
        public.is_technician()
        AND sr.assigned_technician_id = auth.uid()
      )
    )
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_request_status_history_by_token(p_token text)
RETURNS SETOF public.request_status_history
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT h.*
  FROM public.request_status_history h
  INNER JOIN public.service_requests sr ON sr.id = h.request_id
  WHERE lower(trim(sr.tracking_token)) = lower(trim(p_token))
    AND (
      public.is_admin()
      OR (public.is_client() AND sr.client_id = auth.uid())
      OR (
        public.is_technician()
        AND sr.assigned_technician_id = auth.uid()
      )
    )
  ORDER BY h.created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_technician_location_for_tracking(p_token text)
RETURNS TABLE (
  lat double precision,
  lng double precision,
  updated_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthorized'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT tl.lat, tl.lng, tl.updated_at
  FROM public.service_requests sr
  INNER JOIN public.technician_locations tl
    ON tl.technician_id = sr.assigned_technician_id
  WHERE lower(trim(sr.tracking_token)) = lower(trim(p_token))
    AND sr.assigned_technician_id IS NOT NULL
    AND sr.status IN ('on_the_way', 'arrived')
    AND (
      public.is_admin()
      OR (public.is_client() AND sr.client_id = auth.uid())
      OR (
        public.is_technician()
        AND sr.assigned_technician_id = auth.uid()
      )
    )
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.client_accept_counter_quote(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_client() THEN
    RAISE EXCEPTION 'unauthorized'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.service_requests r
  SET
    agreed_price = r.admin_counter_price,
    quote_status = 'accepted'::public.quote_status,
    payment_method = NULL,
    payment_status = 'pending'::public.spare_part_payment_status,
    payment_reference = NULL,
    updated_at = now()
  WHERE r.id = p_request_id
    AND r.quote_status = 'admin_countered'::public.quote_status
    AND r.admin_counter_price IS NOT NULL
    AND r.client_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_quote_state'
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.client_set_service_request_payment(
  p_request_id uuid,
  p_payment_method text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_method public.spare_part_payment_method;
BEGIN
  IF NOT public.is_client() THEN
    RAISE EXCEPTION 'unauthorized'
      USING ERRCODE = '42501';
  END IF;

  IF p_payment_method = 'online' THEN
    v_method := 'online'::public.spare_part_payment_method;
  ELSIF p_payment_method = 'cash_on_delivery' THEN
    v_method := 'cash_on_delivery'::public.spare_part_payment_method;
  ELSE
    RAISE EXCEPTION 'invalid_payment_method'
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.service_requests r
  SET
    payment_method = v_method,
    payment_status = 'pending'::public.spare_part_payment_status,
    payment_reference = NULL,
    updated_at = now()
  WHERE r.id = p_request_id
    AND r.quote_status = 'accepted'::public.quote_status
    AND r.agreed_price IS NOT NULL
    AND (r.payment_status IS DISTINCT FROM 'paid'::public.spare_part_payment_status)
    AND r.client_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_payment_state'
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.client_owns_request(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.client_owns_request(text) FROM authenticated;

NOTIFY pgrst, 'reload schema';

-- ===== 20260627120000_fix_profiles_insert_service_role.sql =====
-- Le client service_role (server actions) doit pouvoir créer des profils
-- sans auth.uid() — sinon profile_insert_forbidden à la création admin / register.

CREATE OR REPLACE FUNCTION public.is_backend_elevated()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(auth.jwt()->>'role', '') = 'service_role'
    OR current_user IN ('postgres', 'supabase_admin');
$$;

CREATE OR REPLACE FUNCTION public.profiles_validate_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_backend_elevated() OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL OR auth.uid() <> NEW.id THEN
    RAISE EXCEPTION 'profile_insert_forbidden'
      USING ERRCODE = '42501';
  END IF;

  NEW.role := 'client';
  NEW.is_active := COALESCE(NEW.is_active, true);
  NEW.technician_type := NULL;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.profiles_prevent_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_backend_elevated() OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'role_change_forbidden'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    RAISE EXCEPTION 'active_change_forbidden'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.technician_type IS DISTINCT FROM OLD.technician_type THEN
    RAISE EXCEPTION 'technician_type_change_forbidden'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

NOTIFY pgrst, 'reload schema';

-- ===== 20260628120000_platform_user_contact_verification.sql =====
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

-- ===== 20260629120000_profile_contact_verification.sql =====
-- Vérification email / WhatsApp avant changement de contact (paramètres utilisateur connecté)

CREATE TABLE IF NOT EXISTS public.profile_contact_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS profile_contact_verifications_user_created_idx
  ON public.profile_contact_verifications (user_id, created_at DESC);

ALTER TABLE public.profile_contact_verifications ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.profile_contact_verifications TO service_role;
GRANT ALL ON public.profile_contact_verifications TO postgres;

NOTIFY pgrst, 'reload schema';

-- ===== 20260630120000_spare_part_order_delivery_contact.sql =====
-- Coordonnées client + adresse de livraison sur commande pièces détachées

ALTER TABLE public.spare_part_orders
  ADD COLUMN IF NOT EXISTS customer_full_name text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS delivery_address text;

CREATE OR REPLACE FUNCTION public.create_spare_part_order(
  p_notes text,
  p_items jsonb,
  p_payment_method text DEFAULT 'cash_on_delivery',
  p_customer_full_name text DEFAULT NULL,
  p_customer_phone text DEFAULT NULL,
  p_customer_email text DEFAULT NULL,
  p_delivery_address text DEFAULT NULL
)
RETURNS TABLE (id uuid, order_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_client_id uuid;
  v_order_id uuid;
  v_token text;
  v_item jsonb;
  v_part_id uuid;
  v_qty integer;
  v_part public.spare_parts%ROWTYPE;
  v_total numeric(10, 2) := 0;
  v_payment_method public.spare_part_payment_method;
BEGIN
  v_client_id := auth.uid();

  IF v_client_id IS NULL OR NOT public.is_client() THEN
    RAISE EXCEPTION 'يجب تسجيل الدخول كعميل' USING ERRCODE = 'P0001';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'السلة فارغة' USING ERRCODE = 'P0001';
  END IF;

  IF NULLIF(trim(p_customer_full_name), '') IS NULL
    OR char_length(trim(p_customer_full_name)) < 2 THEN
    RAISE EXCEPTION 'customer_name_required' USING ERRCODE = 'P0001';
  END IF;

  IF NULLIF(trim(p_customer_phone), '') IS NULL THEN
    RAISE EXCEPTION 'customer_phone_required' USING ERRCODE = 'P0001';
  END IF;

  IF NULLIF(trim(p_customer_email), '') IS NULL
    OR position('@' in trim(p_customer_email)) = 0 THEN
    RAISE EXCEPTION 'customer_email_required' USING ERRCODE = 'P0001';
  END IF;

  IF NULLIF(trim(p_delivery_address), '') IS NULL
    OR char_length(trim(p_delivery_address)) < 5 THEN
    RAISE EXCEPTION 'delivery_address_required' USING ERRCODE = 'P0001';
  END IF;

  IF p_payment_method = 'online' THEN
    v_payment_method := 'online';
  ELSE
    v_payment_method := 'cash_on_delivery';
  END IF;

  INSERT INTO public.spare_part_orders (
    client_id,
    notes,
    status,
    payment_method,
    payment_status,
    customer_full_name,
    customer_phone,
    customer_email,
    delivery_address
  )
  VALUES (
    v_client_id,
    NULLIF(trim(p_notes), ''),
    'pending',
    v_payment_method,
    'pending',
    trim(p_customer_full_name),
    trim(p_customer_phone),
    lower(trim(p_customer_email)),
    trim(p_delivery_address)
  )
  RETURNING spare_part_orders.id, spare_part_orders.order_token
  INTO v_order_id, v_token;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_part_id := (v_item ->> 'spare_part_id')::uuid;
    v_qty := (v_item ->> 'quantity')::integer;

    IF v_part_id IS NULL OR v_qty IS NULL OR v_qty < 1 OR v_qty > 99 THEN
      RAISE EXCEPTION 'عنصر غير صالح في السلة' USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_part
    FROM public.spare_parts sp
    WHERE sp.id = v_part_id AND sp.is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'قطعة غير متاحة' USING ERRCODE = 'P0001';
    END IF;

    IF v_part.stock_quantity < v_qty THEN
      RAISE EXCEPTION USING
        ERRCODE = 'P0001',
        MESSAGE = format('الكمية غير كافية في المخزون: %s', v_part.name_ar);
    END IF;

    UPDATE public.spare_parts sp
    SET stock_quantity = sp.stock_quantity - v_qty
    WHERE sp.id = v_part_id;

    INSERT INTO public.spare_part_order_items (
      order_id,
      spare_part_id,
      quantity,
      name_snapshot,
      category_snapshot,
      img_snapshot,
      price_snapshot
    )
    VALUES (
      v_order_id,
      v_part_id,
      v_qty,
      v_part.name_ar,
      v_part.category,
      COALESCE(v_part.img, v_part.image_url),
      v_part.price
    );

    v_total := v_total + (v_part.price * v_qty);
  END LOOP;

  UPDATE public.spare_part_orders o
  SET total_amount = v_total
  WHERE o.id = v_order_id;

  RETURN QUERY SELECT v_order_id, v_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_spare_part_order(
  text,
  jsonb,
  text,
  text,
  text,
  text,
  text
) TO authenticated;

NOTIFY pgrst, 'reload schema';

-- ===== 20260630200000_fix_create_service_request_raise.sql =====
-- Fix invalid RAISE syntax in create_service_request (MESSAGE specified twice).
-- Symptom in app: "RAISE option already specified: MESSAGE"

CREATE OR REPLACE FUNCTION public.create_service_request(
  p_customer_name text,
  p_customer_phone text,
  p_car_type text,
  p_location_text text,
  p_description text,
  p_service_type public.service_type,
  p_execution_method public.execution_method,
  p_location_lat double precision DEFAULT NULL,
  p_location_lng double precision DEFAULT NULL,
  p_client_proposed_price numeric DEFAULT NULL
)
RETURNS TABLE (id uuid, tracking_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id uuid;
  v_price numeric(10, 2);
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_client() THEN
    RAISE EXCEPTION 'client_required' USING ERRCODE = '42501';
  END IF;

  v_client_id := auth.uid();
  v_price := NULLIF(p_client_proposed_price, 0);

  IF EXISTS (
    SELECT 1
    FROM public.service_requests sr
    WHERE sr.customer_phone = p_customer_phone
      AND sr.service_type = p_service_type
      AND sr.created_at > now() - interval '15 minutes'
  ) THEN
    RAISE EXCEPTION 'تم إرسال طلب مشابه مؤخراً' USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY
  INSERT INTO public.service_requests (
    customer_name,
    customer_phone,
    car_type,
    location_text,
    location_lat,
    location_lng,
    description,
    service_type,
    execution_method,
    status,
    client_id,
    client_proposed_price,
    quote_status
  )
  VALUES (
    p_customer_name,
    p_customer_phone,
    NULLIF(trim(p_car_type), ''),
    NULLIF(trim(p_location_text), ''),
    p_location_lat,
    p_location_lng,
    NULLIF(trim(p_description), ''),
    p_service_type,
    p_execution_method,
    'received',
    v_client_id,
    v_price,
    CASE
      WHEN v_price IS NOT NULL THEN 'pending_admin'::public.quote_status
      ELSE NULL
    END
  )
  RETURNING service_requests.id, service_requests.tracking_token;
END;
$$;

REVOKE ALL ON FUNCTION public.create_service_request(
  text, text, text, text, text,
  public.service_type, public.execution_method,
  double precision, double precision, numeric
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_service_request(
  text, text, text, text, text,
  public.service_type, public.execution_method,
  double precision, double precision, numeric
) TO authenticated, service_role;

-- ===== 20260701120000_quick_request_photos_bucket.sql =====
-- Bucket dédié aux photos des طلبات سريعة (quick requests)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quick-request-photos',
  'quick-request-photos',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "quick_request_photos_admin_select" ON storage.objects;
CREATE POLICY "quick_request_photos_admin_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'quick-request-photos'
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "quick_request_photos_admin_delete" ON storage.objects;
CREATE POLICY "quick_request_photos_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'quick-request-photos'
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "quick_request_photos_service_insert" ON storage.objects;
CREATE POLICY "quick_request_photos_service_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'quick-request-photos');

DROP POLICY IF EXISTS "quick_request_photos_service_update" ON storage.objects;
CREATE POLICY "quick_request_photos_service_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'quick-request-photos')
  WITH CHECK (bucket_id = 'quick-request-photos');

NOTIFY pgrst, 'reload schema';

-- ===== 20260702120000_quick_requests_admin_read_at.sql =====
-- Statut lu par l'admin pour les demandes rapides

ALTER TABLE public.quick_requests
  ADD COLUMN IF NOT EXISTS admin_read_at timestamptz;

CREATE INDEX IF NOT EXISTS quick_requests_admin_read_at_idx
  ON public.quick_requests (admin_read_at);

NOTIFY pgrst, 'reload schema';

-- ===== 20260703120000_request_status_assigned.sql =====
-- Add "assigned" between received and in_progress (technician assigned, not started yet).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    INNER JOIN pg_type t ON e.enumtypid = t.oid
    INNER JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.typname = 'request_status'
      AND e.enumlabel = 'assigned'
  ) THEN
    ALTER TYPE public.request_status ADD VALUE 'assigned';
  END IF;
END
$$;

-- ===== 20260704120000_profiles_avatar_storage_path.sql =====
-- Chemin Supabase Storage pour l'avatar (bucket profile-avatars).
-- avatar_url reste l'URL publique ; avatar_storage_path sert au proxy /api/profile-avatar.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_storage_path text;

COMMENT ON COLUMN public.profiles.avatar_storage_path IS
  'Storage path in profile-avatars bucket, e.g. {user_id}/avatar.jpg';

-- Rétro-remplissage depuis avatar_url quand possible
UPDATE public.profiles
SET avatar_storage_path = regexp_replace(
  avatar_url,
  '^.*/storage/v1/object/public/profile-avatars/',
  ''
)
WHERE avatar_url IS NOT NULL
  AND btrim(avatar_url) <> ''
  AND (avatar_storage_path IS NULL OR btrim(avatar_storage_path) = '')
  AND avatar_url LIKE '%/profile-avatars/%';

NOTIFY pgrst, 'reload schema';

-- ===== 20260708120000_spare_parts_condition.sql =====
-- Product condition: new or used (pre-owned)
CREATE TYPE public.spare_part_condition AS ENUM ('new', 'used');

ALTER TABLE public.spare_parts
  ADD COLUMN IF NOT EXISTS part_condition public.spare_part_condition NOT NULL DEFAULT 'new';

COMMENT ON COLUMN public.spare_parts.part_condition IS
  'Product condition: new (OEM/new) or used (pre-owned / already used).';

CREATE INDEX IF NOT EXISTS spare_parts_condition_idx
  ON public.spare_parts (part_condition)
  WHERE is_active = true;

-- Seed variety: mark some catalogue items as used
UPDATE public.spare_parts
SET part_condition = 'used'
WHERE id IN (
  'b2000002-0002-4002-8002-000000000003',
  'b2000002-0002-4002-8002-000000000006',
  'b2000002-0002-4002-8002-000000000008'
);

-- ===== 20260708130000_spare_parts_promotion.sql =====
-- Optional original price: when higher than price, product shows as on promotion.
ALTER TABLE public.spare_parts
  ADD COLUMN IF NOT EXISTS original_price numeric(10, 2);

COMMENT ON COLUMN public.spare_parts.original_price IS
  'Original price before discount (SAR). Shown struck-through when greater than price.';

-- Sample promotions (~10% off) for catalogue variety
UPDATE public.spare_parts
SET original_price = ROUND(price / 0.9, 2)
WHERE id IN (
  'b2000002-0002-4002-8002-000000000001',
  'b2000002-0002-4002-8002-000000000004',
  'b2000002-0002-4002-8002-000000000006',
  'b2000002-0002-4002-8002-000000000009'
)
AND (original_price IS NULL OR original_price <= price);

-- ===== 20260709120000_client_vehicles_details.sql =====
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


CREATE TABLE IF NOT EXISTS service_time_schema_migrations (
  filename text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO service_time_schema_migrations (filename) VALUES ('20260603150000_initial_schema.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260603170000_fix_service_requests_rls.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260603180000_fix_request_photos_storage.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260604120000_spare_parts_img.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260605120000_request_location_coords.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260605140000_contact_messages.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260606120000_password_reset_codes.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260607120000_client_registration_enum.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260607120001_client_registration.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260608120000_profile_avatars.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260609120000_client_dashboard_rls.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260610120000_create_service_request_rpc.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260611120000_spare_part_orders.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260612120000_spare_parts_price.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260613120000_spare_parts_stock_payment.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260614120000_fix_spare_part_order_ambiguous_id.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260615120000_services_spare_parts_i18n.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260615140000_spare_parts_category_en.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260615150000_site_content_i18n.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260616120000_service_requests_client_id.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260617120000_quick_requests.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260618120000_quick_requests_client_id.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260619120000_spare_parts_images.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260620120000_technician_location_tracking.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260620130000_technician_location_realtime.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260621120000_client_vehicles.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260622130000_profile_localized_names.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260623120000_service_request_quotes.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260624120000_security_hardening.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260624200000_security_critical_complete.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260625120000_service_request_payment.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260626120000_security_remaining_fixes.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260626140000_security_medium_client_id_only.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260627120000_fix_profiles_insert_service_role.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260628120000_platform_user_contact_verification.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260629120000_profile_contact_verification.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260630120000_spare_part_order_delivery_contact.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260630200000_fix_create_service_request_raise.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260701120000_quick_request_photos_bucket.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260702120000_quick_requests_admin_read_at.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260703120000_request_status_assigned.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260704120000_profiles_avatar_storage_path.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260708120000_spare_parts_condition.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260708130000_spare_parts_promotion.sql') ON CONFLICT DO NOTHING;
INSERT INTO service_time_schema_migrations (filename) VALUES ('20260709120000_client_vehicles_details.sql') ON CONFLICT DO NOTHING;
COMMIT;
