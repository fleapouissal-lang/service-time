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
