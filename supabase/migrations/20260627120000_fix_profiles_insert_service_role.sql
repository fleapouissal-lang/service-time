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
