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
