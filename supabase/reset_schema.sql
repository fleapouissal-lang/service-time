-- Reset complet du schéma Service Time (dev uniquement)
-- Utiliser si une migration a échoué à mi-chemin, puis relancer initial_schema.sql

DROP POLICY IF EXISTS "request_photos_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "request_photos_storage_insert" ON storage.objects;

DROP TABLE IF EXISTS public.notifications_log CASCADE;
DROP TABLE IF EXISTS public.site_content CASCADE;
DROP TABLE IF EXISTS public.technician_locations CASCADE;
DROP TABLE IF EXISTS public.request_status_history CASCADE;
DROP TABLE IF EXISTS public.request_photos CASCADE;
DROP TABLE IF EXISTS public.service_requests CASCADE;
DROP TABLE IF EXISTS public.spare_parts CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP FUNCTION IF EXISTS public.get_request_status_history_by_token(text);
DROP FUNCTION IF EXISTS public.get_request_by_tracking_token(text);
DROP FUNCTION IF EXISTS public.is_technician();
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.log_service_request_status_change();
DROP FUNCTION IF EXISTS public.generate_tracking_token();
DROP FUNCTION IF EXISTS public.set_updated_at();

DROP TYPE IF EXISTS public.notification_channel CASCADE;
DROP TYPE IF EXISTS public.request_priority CASCADE;
DROP TYPE IF EXISTS public.request_status CASCADE;
DROP TYPE IF EXISTS public.execution_method CASCADE;
DROP TYPE IF EXISTS public.service_type CASCADE;
DROP TYPE IF EXISTS public.technician_type CASCADE;
DROP TYPE IF EXISTS public.profile_role CASCADE;

DELETE FROM storage.buckets WHERE id = 'request-photos';
