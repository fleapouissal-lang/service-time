-- Service Time — Profils admin + techniciens (démo)
-- Exécuter dans Supabase SQL Editor (rôle postgres)
--
-- Comptes créés :
--   admin@servicetime.sa      / Admin123!
--   tech@servicetime.sa       / Tech123!   (فني متنقل)
--   workshop@servicetime.sa   / Tech123!   (ورشة)
--
-- Prérequis : extension pgcrypto (activée par défaut sur Supabase)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- UUID fixes pour re-seed idempotent
-- Admin
-- e1000001-0001-4001-8001-000000000001
-- Technicien mobile
-- e1000001-0001-4001-8001-000000000002
-- Technicien workshop
-- e1000001-0001-4001-8001-000000000003

DO $$
DECLARE
  admin_id uuid := 'e1000001-0001-4001-8001-000000000001';
  tech_mobile_id uuid := 'e1000001-0001-4001-8001-000000000002';
  tech_workshop_id uuid := 'e1000001-0001-4001-8001-000000000003';
BEGIN
  -- -------------------------------------------------------------------------
  -- auth.users + auth.identities (3 comptes email/password)
  -- -------------------------------------------------------------------------
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES
    (
      admin_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@servicetime.sa',
      crypt('Admin123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"مدير النظام"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    ),
    (
      tech_mobile_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'tech@servicetime.sa',
      crypt('Tech123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"فهد المتنقل"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    ),
    (
      tech_workshop_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'workshop@servicetime.sa',
      crypt('Tech123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"ورشة الجنوب"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = now();

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES
    (
      admin_id,
      admin_id,
      jsonb_build_object('sub', admin_id::text, 'email', 'admin@servicetime.sa'),
      'email',
      admin_id::text,
      now(),
      now(),
      now()
    ),
    (
      tech_mobile_id,
      tech_mobile_id,
      jsonb_build_object('sub', tech_mobile_id::text, 'email', 'tech@servicetime.sa'),
      'email',
      tech_mobile_id::text,
      now(),
      now(),
      now()
    ),
    (
      tech_workshop_id,
      tech_workshop_id,
      jsonb_build_object('sub', tech_workshop_id::text, 'email', 'workshop@servicetime.sa'),
      'email',
      tech_workshop_id::text,
      now(),
      now(),
      now()
    )
  ON CONFLICT (provider, provider_id) DO UPDATE SET
    identity_data = EXCLUDED.identity_data,
    updated_at = now();

  -- -------------------------------------------------------------------------
  -- public.profiles
  -- Contrainte : admin → technician_type NULL | technician → type obligatoire
  -- -------------------------------------------------------------------------
  INSERT INTO public.profiles (id, full_name, phone, role, technician_type, is_active)
  VALUES
    (admin_id, 'مدير النظام', '+966500000001', 'admin', NULL, true),
    (tech_mobile_id, 'فهد المتنقل', '+966500000002', 'technician', 'mobile', true),
    (tech_workshop_id, 'ورشة الجنوب', '+966500000003', 'technician', 'workshop', true)
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    technician_type = EXCLUDED.technician_type,
    is_active = EXCLUDED.is_active,
    updated_at = now();

  -- Assigner la demande démo "on_the_way" au technicien mobile
  UPDATE public.service_requests
  SET assigned_technician_id = tech_mobile_id
  WHERE tracking_token = 'demo-track-live';

  -- Position GPS démo pour le suivi live
  INSERT INTO public.technician_locations (technician_id, lat, lng, updated_at)
  VALUES (tech_mobile_id, 24.7050, 46.6700, now())
  ON CONFLICT (technician_id) DO UPDATE SET
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    updated_at = now();

END $$;
